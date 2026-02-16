import { NextResponse } from "next/server";

export const revalidate = 86400; 

export async function GET() {
  if (!process.env.PPLX_API_KEY) {
    return NextResponse.json({ error: "Missing API Key" }, { status: 500 });
  }

  const prompt = `Return ONLY a valid JSON object with 4 Australia and 4 World financial news stories. JSON: {"australia": [...], "world": [...]}`;

  try {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${process.env.PPLX_API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
      next: { revalidate: 86400 } 
    });

    if (res.status === 429) {
      return NextResponse.json({ error: "Rate limit hit. Cache will reset at midnight." }, { status: 429 });
    }

    if (!res.ok) throw new Error(`Gemini Error: ${res.status}`);

    const data = await res.json();
    let content = data.candidates?.[0]?.content?.parts?.map((p: any) => p.text).join("") || "{}";
    content = content.replace(/```json/g, "").replace(/```/g, "").trim();

    return NextResponse.json(JSON.parse(content));
  } catch (error: any) {
    return NextResponse.json({ error: "Failed to fetch news" }, { status: 500 });
  }
}