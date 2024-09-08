import { NextResponse, NextRequest } from "next/server";
import { Pinecone } from '@pinecone-database/pinecone';
import { GoogleGenerativeAI } from "@google/generative-ai";
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";

export async function POST(req: NextRequest) {
  try {
    // Initialize Pinecone and select the index
    console.log("Initializing Pinecone");
    const pcApiKey = process.env.NEXT_PUBLIC_PINECONE_API_KEY!;
    if (!pcApiKey) throw new Error("Pinecone API key is not set");
    const pc = new Pinecone({ apiKey: pcApiKey });
    const index = pc.index("reviews");

    // Initialize Google Generative AI and Embeddings
    console.log("Initializing Google Generative AI and Embeddings");
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_API_KEY!;
    if (!apiKey) throw new Error("Google API key is not set");
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const embeddings = new GoogleGenerativeAIEmbeddings({ apiKey, model: "models/text-embedding-004" });

    // Parse the request body
    const body = await req.json();
    console.log("Received request body:", body);

    // Extract the question from the request body
    const { question } = body;
    console.log("Received question:", question);

    // Ensure the question is a string
    if (typeof question !== 'string') {
      throw new Error("Invalid question format. Expected a string.");
    }

    // Get embeddings for the question
    console.log("Getting embeddings for the question");
    const questionEmbeddings = await embeddings.embedDocuments([question]);
    console.log("Question embeddings:", questionEmbeddings);

    // Query Pinecone with the question embeddings
    console.log("Querying Pinecone with the question embeddings");
    const results = await index.query({
      topK: 5,
      vector: questionEmbeddings[0],
      includeMetadata: true
    });
    console.log("Pinecone query results:", results);

    // Extract the relevant data from the Pinecone query response
    const relevantMatches = results.matches.map((match: any) => ({
      comment: match.metadata.comment,
      teacherName: match.metadata.name
    }));
    console.log("Relevant matches:", relevantMatches);

    // Use Google Generative AI to create a response based on the matched professors
    const prompt = `Provide a comprehensive response to the following student query about computer science professors. Questions: ${question} Context: ${JSON.stringify(relevantMatches)}`;
    console.log("Generated prompt for AI:", prompt);
    
    const genAIResponse = await model.generateContent(prompt);
    console.log("Generated AI Response:", genAIResponse);

    // Accessing the generated response
    const generatedText = genAIResponse.response.text();
    console.log("Generated Text:", generatedText);

    // Send the final response
    return NextResponse.json({
      success: true,
      data: generatedText
    });
  } catch (error) {
    console.error("Error processing the request:", error);
    return NextResponse.json({
      success: false,
      message: error instanceof Error ? error.message : "An unknown error occurred"
    }, { status: 500 });
  }
}