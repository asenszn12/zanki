import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { metrics } = await req.json();

    if (!metrics || !metrics.category_summary) {
      return NextResponse.json({ tip: "Track more expenses to get tips!" });
    }

    if (!process.env.PPLX_API_KEY) {
      return NextResponse.json({ error: "Missing API Key" }, { status: 500 });
    }

    const topCategories = metrics.category_summary
      .slice(0, 3)
      .map((c: any) => `${c.category} ($${c.spent})`)
      .join(", ");

    const prompt = `
      You are a professional financial analyst. Analyze this data:
      - Total Spent: $${metrics.total_spent}
      - Net Cash Flow: $${metrics.net_cash_flow}
      - Top Categories: ${topCategories}
      
      TASK: Provide a 3-sentence "Tip of the Day" using this exact structure:
      1. Sentence 1 (Observation): Identify a risk in their pattern (like high "Other" spending).
      2. Sentence 2 (Action): Give one specific instruction to fix it today.
      3. Sentence 3 (Benefit): Explain the long-term benefit of this action.
      
      CONSTRAINTS: 
      - Total length: 35-50 words. No short one-liners.
      - Start DIRECTLY with the advice. No "Okay" or "Sure."
    `;

    // Switched to gemini-2.5-flash-lite for higher rate limits
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${process.env.PPLX_API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.85,
          maxOutputTokens: 300, 
        }
      }),
    });

    // FAIL-SAFE: If we hit a 429 Quota limit, return a generic helpful tip instead of crashing
    if (res.status === 429) {
      return NextResponse.json({ 
        tip: "Moola's Tip: Your 'Other' category is looking a bit heavy today. Audit your recent bank statement to find hidden subscriptions you can cancel to save $20+ monthly." 
      });
    }

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`API Error ${res.status}: ${errText}`);
    }

    const data = await res.json();

    // Map and Join logic to ensure full sentence completion
    const tip = data.candidates?.[0]?.content?.parts
      ?.map((part: any) => part.text)
      .join("") || "No tip generated.";

    return NextResponse.json({ tip: tip.trim() });

  } catch (error: any) {
    console.error("API Route Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}