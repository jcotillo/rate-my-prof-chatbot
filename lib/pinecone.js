const { GoogleGenerativeAI } = require("@google/generative-ai");
const { Pinecone } = require('@pinecone-database/pinecone');
require('dotenv').config(); 

// Initialize the Pinecone client 
const pc = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY,
});

console.log('Pinecone initialized successfully');

// Initialize the Google Generative AI client
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Function to create and populate the vector store
async function createAndPopulateVectorStore() {
  try {
    const indexName = 'professors';
    const indexList = await pc.listIndexes();

    // Check if the index exists
    if (!indexList.indexes.some(index => index.name === indexName)) {
      await pc.createIndex({
        name: indexName,
        dimension: 768, // Dimension for text-embedding-004
        metric: 'cosine',
        spec: {
          serverless: {
            cloud: 'aws',
            region: 'us-east-1',
          },
        },
        waitUntilReady: true,
      });
      console.log("Index 'professors' created successfully.");
    } else {
      console.log(`Index '${indexName}' already exists.`);
    }

    const model = await genAI.getGenerativeModel({ model: "text-embedding-004" });

    // Review records to be upserted
    const reviews = [
      {
        professor: "Dr. Jane Smith",
        subject: "Mathematics",
        starRating: 5,
        reviewComment: "Dr. Smith is an amazing teacher! She explains complex concepts clearly and always makes time for students.",
      },
      {
        professor: "Dr. Robert Johnson",
        subject: "Physics",
        starRating: 3,
        reviewComment: "Dr. Johnson knows his stuff, but his lectures are a bit dry. The material is tough but manageable.",
      },
      {
        professor: "Professor Emily Davis",
        subject: "English Literature",
        starRating: 4,
        reviewComment: "Professor Davis is very passionate about literature, which makes her classes enjoyable. However, her grading is tough.",
      },
      {
        professor: "Dr. Michael Brown",
        subject: "Chemistry",
        starRating: 2,
        reviewComment: "Dr. Brown's lectures are hard to follow, and he doesn't explain things well. Labs were more helpful than his lectures.",
      },
      {
        professor: "Professor Lisa Wilson",
        subject: "History",
        starRating: 5,
        reviewComment: "Professor Wilson makes history come alive! Her classes are engaging, and she is always open to discussions.",
      },
      {
        professor: "Dr. John Miller",
        subject: "Biology",
        starRating: 4,
        reviewComment: "Dr. Miller is knowledgeable and cares about students, but his exams are very challenging.",
      },
      {
        professor: "Professor Sarah Moore",
        subject: "Psychology",
        starRating: 3,
        reviewComment: "Professor Moore's classes are interesting, but she tends to rush through the material.",
      },
      {
        professor: "Dr. William Taylor",
        subject: "Computer Science",
        starRating: 5,
        reviewComment: "Dr. Taylor is a fantastic professor! His coding examples are practical, and he is always willing to help.",
      },
      {
        professor: "Professor Karen Anderson",
        subject: "Philosophy",
        starRating: 4,
        reviewComment: "Professor Anderson encourages deep thinking and class discussions, though sometimes the topics can be confusing.",
      },
      {
        professor: "Dr. Richard Thomas",
        subject: "Economics",
        starRating: 2,
        reviewComment: "Dr. Thomas's lectures are very theoretical and not very engaging. He could improve by connecting theory to real-world examples.",
      },
      {
        professor: "Professor Patricia Jackson",
        subject: "Sociology",
        starRating: 4,
        reviewComment: "Professor Jackson is very knowledgeable and approachable. The class discussions are thought-provoking.",
      },
      {
        professor: "Dr. Steven White",
        subject: "Political Science",
        starRating: 5,
        reviewComment: "Dr. White is an excellent lecturer with a deep understanding of political systems. His classes are a must-attend.",
      },
      {
        professor: "Professor Laura Harris",
        subject: "Art History",
        starRating: 3,
        reviewComment: "Professor Harris is passionate about art, but her lectures can be a bit monotonous.",
      },
      {
        professor: "Dr. Daniel Martin",
        subject: "Physics",
        starRating: 4,
        reviewComment: "Dr. Martin's classes are well-structured and informative. However, he expects a lot from students.",
      },
      {
        professor: "Professor Nancy Lee",
        subject: "Statistics",
        starRating: 2,
        reviewComment: "Professor Lee's explanations are often unclear, making it hard to grasp the concepts. Tutorials helped more than lectures.",
      },
      {
        professor: "Dr. Charles King",
        subject: "Philosophy",
        starRating: 5,
        reviewComment: "Dr. King is a brilliant thinker and challenges students to see things differently. His classes are both difficult and rewarding.",
      },
      {
        professor: "Professor Barbara Young",
        subject: "Anthropology",
        starRating: 4,
        reviewComment: "Professor Young is very knowledgeable and her classes are interesting, but the reading load is heavy.",
      },
      {
        professor: "Dr. James Allen",
        subject: "Chemistry",
        starRating: 3,
        reviewComment: "Dr. Allen's lectures are thorough, but sometimes he goes too fast. His office hours are helpful.",
      },
      {
        professor: "Professor Sandra Scott",
        subject: "English",
        starRating: 5,
        reviewComment: "Professor Scott is one of the best English professors I've had. Her feedback on essays is incredibly detailed and helpful.",
      },
      {
        professor: "Dr. George Wright",
        subject: "Mathematics",
        starRating: 1,
        reviewComment: "Dr. Wright's teaching style is very confusing, and he rarely answers questions clearly. Not a good experience.",
      }
    ];

    // Array to store the records for upsert
    const records = [];

    for (const [i, review] of reviews.entries()) {
      // Generate embedding for each review
      const result = await model.embedContent(review.reviewComment);
      const embedding = result.embedding;

      // Add structured record to the records array
      records.push({
        id: `review-${i + 1}`,
        values: embedding.values,
        metadata: {
          professor: review.professor,
          subject: review.subject,
          starRating: review.starRating,
          reviewComment: review.reviewComment,
        },
      });
    }

    // Upsert data into the index
    const index = pc.index(indexName);

    try {
      await index.upsert(records);
      console.log("Successfully upserted all reviews.");
    } catch (error) {
      console.error("Error upserting reviews:", error);
    }
  } catch (error) {
    console.error("Error creating or checking the index:", error);
  }
}

// Function to query the vector store
async function queryVectorStore(queryText) {
  try {
    // Generate embedding for the query
    const model = await genAI.getGenerativeModel({ model: "text-embedding-004" });
    const result = await model.embedContent(queryText);
    const queryEmbedding = result.embedding;

    // Send query to Pinecone to retrieve similar documents 
    const index = pc.index('professors');
    const queryResponse = await index.query({
      vector: queryEmbedding.values,
      topK: 10,
      includeMetadata: true,
    });
    // console.log("Query response:", queryResponse);
    return queryResponse.matches.map(match => ({
      score: match.score,
      professor: match.metadata.professor,
      subject: match.metadata.subject,
      starRating: match.metadata.starRating,
      reviewComment: match.metadata.reviewComment,
    }));
  } catch (error) {
    console.error("Error querying vector store:", error);
    return [];
  }
}

// Example usage
async function run() {
  await createAndPopulateVectorStore();

  const query = "Who is the best Chemistry professor?";
  const results2 = await queryVectorStore(query);
  console.log("Query results:", results2);
}

// run();

// Export the functions so they can be used in other files
module.exports = {
  createAndPopulateVectorStore,
  queryVectorStore,
}