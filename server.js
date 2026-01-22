import express from "express";
import cors from "cors";
import fetch from "node-fetch";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

if (!OPENROUTER_API_KEY) {
  console.error("OPENROUTER_API_KEY missing");
  process.exit(1);
}

const MODEL = "xiaomi/mimo-v2-flash:free";


app.post("/generate-cards", async (req, res) => {
  const {
    userType,
    goal,
    durationNumber,
    durationUnit,
    skillFocus,
  } = req.body;

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

  try {
    const response = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "http://localhost:3000", 
          "X-Title": "PlanWise",
        },
        body: JSON.stringify({
          model: MODEL,
          messages: [
            { role: "system", content: "You output JSON only." },
            { role: "user", content: prompt }
          ],
          temperature: 0.7,
        }),
      }
    );

    if (!response.ok) {
      const text = await response.text();
      console.error("OpenRouter error:", text);
      return res.status(500).json([]);
    }

    const data = await response.json();

    const rawText = data.choices?.[0]?.message?.content || "";

    const match = rawText.match(/\[[\s\S]*\]/);
    const cards = match ? JSON.parse(match[0]) : [];

    res.json(cards);

  } catch (err) {
    console.error("Server error:", err);
    res.status(500).json([]);
  }
});

app.listen(3001, () =>
  console.log("OpenRouter server running")
);
