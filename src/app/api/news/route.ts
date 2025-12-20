import { NextResponse } from "next/server";

export async function GET() {
  if (!process.env.PPLX_API_KEY) {
    return NextResponse.json(
      { error: "Missing PPLX_API_KEY" }, 
      { status: 500 }
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
    const res = await fetch("https://api.perplexity.ai/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.PPLX_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "sonar-pro", 
        messages: [
          { role: "system", content: "You are a precise financial news aggregator returning strict JSON." },
          { role: "user", content: prompt }
        ],
        temperature: 0.1, 
      }),
    });

    if (!res.ok) {
      throw new Error(`Perplexity API Error: ${res.status}`);
    }

    const data = await res.json();
    let content = data.choices[0]?.message?.content || "{}";
    
    // Cleanup: Remove markdown if present
    content = content.replace(/```json/g, "").replace(/```/g, "").trim();

    const newsData = JSON.parse(content);

    return NextResponse.json(newsData);

  } catch (error: any) {
    console.error("News Fetch Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch news", details: error.message }, 
      { status: 500 }
    );
  }
}