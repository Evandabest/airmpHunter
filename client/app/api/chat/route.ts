import { NextResponse, NextRequest } from "next/server";
import { Pinecone } from '@pinecone-database/pinecone';
import { GoogleGenerativeAI } from "@google/generative-ai";
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";

export async function POST(req: NextRequest) {
    try {
        // Initialize Pinecone and select the index
        console.log("Initializing Pinecone");
        const pc = new Pinecone({ apiKey: process.env.NEXT_PUBLIC_PINECONE_API_KEY! });
        const index = pc.index("reviews");

        // Initialize Google Generative AI and Embeddings
        console.log("Initializing Google Generative AI and Embeddings");
        const apiKey = process.env.NEXT_PUBLIC_GOOGLE_API_KEY!;
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
        const questionEmbeddings = await embeddings.embedDocuments([question]); // embedDocuments expects an array
        console.log("Question embeddings:", questionEmbeddings);

        // Query Pinecone with the question embeddings
        console.log("Querying Pinecone with the question embeddings");
        const results = await index.query({
            topK: 5,
            vector: questionEmbeddings[0], // Use the first (and only) embedding
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
        const prompt = `${question} Use the following as context: ${JSON.stringify(relevantMatches)}`;
        console.log("Generated prompt for AI:", prompt);
        const genAIResponse = await model.generateContent(prompt);
        console.log("Generated AI Response:",  genAIResponse.response && genAIResponse.response.candidates && genAIResponse.response.candidates[0] );

        // Accessing the generated response (modify based on the actual structure)
        const generatedText = genAIResponse.response.text || "No response available";

        // Send the final response
        return NextResponse.json({
            success: true,
            data: generatedText // return the generated text
        });

    } catch (error) {
        console.error("Error processing the request:", error);
        return NextResponse.json({
            success: false,
            message: "An error occurred while processing the request."
        });
    }
}