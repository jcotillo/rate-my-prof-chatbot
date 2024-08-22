import { UseChatHelpers } from 'ai/react'

import { Button } from '@/components/ui/button'
import { ExternalLink } from '@/components/external-link'
import { IconArrowRight } from '@/components/ui/icons'

export function EmptyScreen() {
  return (
    <div className="mx-auto max-w-2xl px-4">
      <div className="flex flex-col gap-2 rounded-lg border bg-background p-8">
        <h1 className="text-lg font-semibold">
          Welcome to the AI-Powered Rate My Professor App!
        </h1>
        <p className="leading-normal text-muted-foreground">
          This app allows you to get insights about professors based on student reviews. It&apos;s built with{' '}
          <ExternalLink href="https://nextjs.org">Next.js</ExternalLink> and uses advanced AI technology to provide accurate and helpful information.
        </p>
        <p className="leading-normal text-muted-foreground">
          You can ask questions about professors, their teaching styles, course difficulty, and more. The AI will search through a database of student reviews to give you the most relevant information.
        </p>
        <p className="leading-normal text-muted-foreground">
          To get started, simply type your question in the chat box below. For example:
        </p>
        <ul className="list-disc list-inside text-muted-foreground">
          <li>&quot;Who is the best Math professor?&quot;</li>
          <li>&quot;What do students say about Dr. Smith&apos;s Chemistry class?&quot;</li>
          <li>&quot;Which English Literature professor has the highest rating?&quot;</li>
        </ul>
        <p className="leading-normal text-muted-foreground mt-4">
          The AI will analyze the reviews and provide you with helpful insights to make informed decisions about your courses and professors.
        </p>
      </div>
    </div>
  )
}