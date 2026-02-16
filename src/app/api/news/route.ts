import { NextResponse } from "next/server";

export async function GET() {
  if (!process.env.PPLX_API_KEY) {
    return NextResponse.json(
      { error: "Missing PPLX_API_KEY" },
      { status: 500 },
    );
  }

  const prompt = `
    Search for the latest trending financial and economic news from the last 24 hours.
    I need two distinct lists:
    1. Top 4 stories specifically for Australia (ASX, RBA, local economy).
    2. Top 4 stories for the World (US Markets, Global Economy, Crypto).

    Return ONLY a valid JSON object. Do not use Markdown formatting or code blocks.
    The JSON structure must be exactly:
    {
      "australia": [
        { 
          "title": "Headline", 
          "summary": "Brief 1-sentence summary", 
          "sentiment": "positive/neutral/negative",
          "url": "Direct link to the news source"
        }
      ],
      "world": [
        { 
          "title": "Headline", 
          "summary": "Brief 1-sentence summary", 
          "sentiment": "positive/neutral/negative",
          "url": "Direct link to the news source"
        }
      ]
    }
  `;

  try {
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${process.env.PPLX_API_KEY}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      // This tool enables live web search for financial news
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Gemini News Error ${res.status}: ${errText}`);
  }

  const data = await res.json();
  let content = data.candidates?.[0]?.content?.parts?.[0]?.text || "{}";

  // Cleanup: Gemini sometimes wraps JSON in markdown blocks
  content = content.replace(/```json/g, "").replace(/```/g, "").trim();

  const newsData = JSON.parse(content);
  return NextResponse.json(newsData);

  } catch (error: any) {
    console.error("News Fetch Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch news", details: error.message },
      { status: 500 },
    );
  }
}
