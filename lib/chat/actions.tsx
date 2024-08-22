import 'server-only'

import {
  createAI,
  createStreamableUI,
  getMutableAIState,
  getAIState,
  streamUI,
  createStreamableValue
} from 'ai/rsc'
import { createOpenAI as createGroq } from '@ai-sdk/openai';

import {
  BotCard,
  BotMessage,
} from '@/components/stocks'

import { z } from 'zod'
import {
  runAsyncFnWithoutBlocking,
  sleep,
  nanoid
} from '@/lib/utils'
import { saveChat } from '@/app/actions'
import { SpinnerMessage, UserMessage } from '@/components/stocks/message'
import { Chat, Message } from '@/lib/types'
import { auth } from '@/auth'
import { queryVectorStore } from '@/lib/pinecone'

const groq = createGroq({
  baseURL: 'https://api.groq.com/openai/v1',
  apiKey: process.env.GROQ_API_KEY,
});

function shouldQueryVectorStore(content: string): boolean {
  const professorKeywords = ['professor', 'teacher', 'instructor', 'faculty', 'class', 'course', 'lecture', 'subject'];
  return professorKeywords.some(keyword => content.toLowerCase().includes(keyword));
}

async function submitUserMessage(content: string) {
  'use server'

  const aiState = getMutableAIState<typeof AI>()

  aiState.update({
    ...aiState.get(),
    messages: [
      ...aiState.get().messages,
      {
        id: nanoid(),
        role: 'user',
        content
      }
    ]
  })

  let textStream: undefined | ReturnType<typeof createStreamableValue<string>>
  let textNode: undefined | React.ReactNode

  const shouldQuery = shouldQueryVectorStore(content);

  const result = await streamUI({
    model: groq('llama3-8b-8192'),
    initial: <SpinnerMessage />,
    system: `\
    You are a chatbot that answers questions about professors in a college based on student reviews.
    You can provide information about professors' star ratings and review comments from students.
    For questions about specific professors or courses, use the information provided by the queryVectorStore function if it's available.
    When presenting information from queryVectorStore, format it in a natural, conversational way. Do not show raw data or mention the tool directly.
    If the information is not available or for general questions, respond based on your general knowledge.
    You can also provide general information about the college if needed.
    Always maintain a helpful and friendly tone in your responses.`,
    messages: [
      ...aiState.get().messages.map((message: any) => ({
        role: message.role,
        content: message.content,
        name: message.name
      }))
    ],
    tools: shouldQuery ? {
      queryVectorStore: {
        description: 'Query the vector store for information about professors',
        parameters: z.object({
          query: z.string().describe('The query to search for professor information'),
        }),
        generate: async function* ({ query }) {
          yield (
            <BotCard>
              Searching for professor information...
            </BotCard>
          )

          const results = await queryVectorStore(query)

          if (results && results.length > 0) {
            const formattedResults = results.map((result, index) => (
              <div key={index}>
                <p>Professor: {result.professor}</p>
                <p>Subject: {result.subject}</p>
                <p>Star Rating: {result.starRating}</p>
                <p>Review: {result.reviewComment}</p>
                <hr />
              </div>
            ));

            return (
              <BotCard>
                {formattedResults}
              </BotCard>
            );
          } else {
            return (
              <BotCard>
                No information found for the given query.
              </BotCard>
            );
          }
        }
      }
    } : undefined,
    text: ({ content, done, delta }) => {
      if (!textStream) {
        textStream = createStreamableValue('')
        textNode = <BotMessage content={textStream.value} />
      }

      if (done) {
        textStream.done()
        aiState.done({
          ...aiState.get(),
          messages: [
            ...aiState.get().messages,
            {
              id: nanoid(),
              role: 'assistant',
              content
            }
          ]
        })
      } else {
        textStream.update(delta)
      }

      return textNode
    },
  })

  return {
    id: nanoid(),
    display: result.value
  }
}

export type AIState = {
  chatId: string
  messages: Message[]
}

export type UIState = {
  id: string
  display: React.ReactNode
}[]

export const AI = createAI<AIState, UIState>({
  actions: {
    submitUserMessage,
  },
  initialUIState: [],
  initialAIState: { chatId: nanoid(), messages: [] },
  onGetUIState: async () => {
    'use server'

    const session = await auth()

    if (session && session.user) {
      const aiState = getAIState() as Chat

      if (aiState) {
        const uiState = getUIStateFromAIState(aiState)
        return uiState
      }
    } else {
      return
    }
  },
  onSetAIState: async ({ state }) => {
    'use server'

    const session = await auth()

    if (session && session.user) {
      const { chatId, messages } = state

      const createdAt = new Date()
      const userId = session.user.id as string
      const path = `/chat/${chatId}`

      const firstMessageContent = messages[0].content as string
      const title = firstMessageContent.substring(0, 100)

      const chat: Chat = {
        id: chatId,
        title,
        userId,
        createdAt,
        messages,
        path
      }

      await saveChat(chat)
    } else {
      return
    }
  }
})

export const getUIStateFromAIState = (aiState: Chat) => {
  return aiState.messages
    .filter(message => message.role !== 'system')
    .map((message, index) => ({
      id: `${aiState.chatId}-${index}`,
      display:
        message.role === 'tool' ? (
          message.content.map(tool => {
            return tool.toolName === 'queryVectorStore' ? (
              <BotCard>
                {/* @ts-expect-error */}
                {tool.result.map((result, index) => (
                  <div key={index}>
                    <p>Professor: {result.professor}</p>
                    <p>Subject: {result.subject}</p>
                    <p>Star Rating: {result.starRating}</p>
                    <p>Review: {result.reviewComment}</p>
                    <hr />
                  </div>
                ))}
              </BotCard>
            ) : null
          })
        ) : message.role === 'user' ? (
          <UserMessage>{message.content as string}</UserMessage>
        ) : message.role === 'assistant' &&
          typeof message.content === 'string' ? (
          <BotMessage content={message.content} />
        ) : null
    }))
}