
import { NextResponse, NextRequest } from "next/server";
import { Pinecone } from '@pinecone-database/pinecone'

export async function POST(req: NextRequest, res: NextResponse) {
    const pc = new Pinecone({ apiKey: process.env.NEXT_PUBLIC_PINECONE_API_KEY! })
    const index = pc.index("reviews")


}