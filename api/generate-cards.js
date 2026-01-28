import fetch from "node-fetch";

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const MODEL = "openrouter/auto:free";

export async function POST(req) {
  try {
    const { userType, goal, durationNumber, durationUnit, skillFocus } = await req.json();

    const prompt = `
Generate ${durationNumber} motivational planning cards.

RULES:
- Output ONLY valid JSON
- No markdown
- No explanations

FORMAT:
[
  {
    "info": "Short motivational sentence (max 15 words)",
    "description": "Clear, practical advice (3-5 sentences)"
  }
]

CONTEXT:
User type: ${userType}
Goal: ${goal}
Duration unit: ${durationUnit}
Focus: ${skillFocus}
`;

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: "system", content: "You output JSON only." },
          { role: "user", content: prompt },
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      console.error("OpenRouter error:", text);
      return new Response(JSON.stringify([]), { status: 500 });
    }

    const data = await response.json();
    const rawText = data.choices?.[0]?.message?.content || "";
    if (!rawText) return new Response(JSON.stringify([]), { status: 200 });
    const match = rawText.match(/\[[\s\S]*\]/);
    const cards = match ? JSON.parse(match[0]) : [];

    return new Response(JSON.stringify(cards), { status: 200 });
  } catch (err) {
    console.error("Server error:", err);
    return new Response(JSON.stringify([]), { status: 500 });
  }
}
