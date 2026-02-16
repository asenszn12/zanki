import { NextResponse } from "next/server";

export async function GET() {
  const apiKey = process.env.PPLX_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "Missing Key" }, { status: 500 });

  const prompt = `
    Conduct a real-time web search for the latest financial news (last 24 hours).
    Provide two lists: Australia (4 stories) and World (4 stories).
    Include for each: title, 1-sentence summary, sentiment (positive/neutral/negative), and a direct URL.
    Also include a "market_summary" field for the overall global vibe.

    Return ONLY strict JSON. No markdown.
    {
      "market_summary": "Summary...",
      "australia": [{ "title": "...", "summary": "...", "sentiment": "...", "url": "..." }],
      "world": [{ "title": "...", "summary": "...", "sentiment": "...", "url": "..." }]
    }
  `;

  try {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
        temperature: 0.2 // Lower for strictly structured JSON
      })
    });

    const data = await res.json();
    
    // SAFE CHECK: Ensure choices[0] exists before accessing content
    if (!data.choices?.[0]?.message?.content) {
      throw new Error("Invalid response structure from Groq");
    }

    const content = JSON.parse(data.choices[0].message.content);
    return NextResponse.json(content);

  } catch (error: any) {
    console.error("News Error:", error.message);
    return NextResponse.json({ error: "Failed to fetch news" }, { status: 500 });
  }
}