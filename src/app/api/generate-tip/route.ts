import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { metrics } = await req.json();
    const apiKey = process.env.PPLX_API_KEY;

    if (!metrics) return NextResponse.json({ error: "No metrics" }, { status: 400 });

    const topCategories = metrics.category_summary
      ?.slice(0, 3)
      .map((c: any) => `${c.category} ($${c.spent})`)
      .join(", ") || "Other";

    const prompt = `
      Act as a friendly but direct financial advisor.
      Here is my monthly financial summary:
      - Total Spent: $${metrics.total_spent}
      - Net Cash Flow: $${metrics.net_cash_flow}
      - Top Expenses: ${topCategories}
      
      Based on this, give me exactly ONE specific, actionable "Tip of the Day" to improve my financial health. 
      Keep it under 30 words. Be encouraging but realistic. Do not use markdown formatting and do not include references 
      at the end of messages (i.e. do not include [1][2] etc.).
    `;

    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [{ role: "user", content: prompt.trim() }],
        temperature: 0.8 // Higher temp makes it sound more "human" and less repetitive
      })
    });

    const data = await res.json();
    const tip = data.choices?.[0]?.message?.content || "You're doing great! Keep an eye on those small daily spends to keep your momentum going.";

    return NextResponse.json({ tip: tip.trim() });
  } catch (error: any) {
    return NextResponse.json({ error: "Failed to generate tip" }, { status: 500 });
  }
}