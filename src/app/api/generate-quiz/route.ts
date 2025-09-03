import { NextRequest, NextResponse } from "next/server";

// If you prefer the official SDK:
// import OpenAI from "openai";
// const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const { topic = "General Knowledge" } = await req.json();

    // --- Call your LLM of choice here. Below is a simple fetch example. ---
    // Replace with your provider endpoint or SDK; keep JSON schema tight to ensure one correct answer.
    const prompt = `
You are a quiz generator.
Given a TOPIC, create exactly 5 multiple-choice questions.
Each question must have:
- "question": string
- "options": array of 4 strings in order A–D
- "answerIndex": integer 0..3 indicating the single correct option

Constraints:
- Options should be plausible.
- Only one correct answer per question.

Return ONLY valid JSON: { "topic": string, "questions": [ { "question": string, "options": [string, string, string, string], "answerIndex": number }, ... ] }

TOPIC: ${topic}
`;

    // Example using OpenAI responses with JSON output via prompt discipline.
    // Swap to your provider. Keep it simple for MVP.
    const resp = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY ?? ""}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: "You return concise, strictly valid JSON." },
          { role: "user", content: prompt },
        ],
        temperature: 0.7,
      }),
    });

    if (!resp.ok) {
      const text = await resp.text();
      return NextResponse.json({ error: `LLM request failed: ${text}` }, { status: 500 });
    }

    const data = await resp.json();
    // Try to parse content as JSON
    const content = data?.choices?.[0]?.message?.content ?? "{}";
    let quiz;
    try {
      quiz = JSON.parse(content);
    } catch {
      // As a fallback, attempt to extract JSON block (MVP-friendly)
      const match = content.match(/\{[\s\S]*\}$/);
      quiz = match ? JSON.parse(match[0]) : null;
    }

    // Minimal validation
    if (
      !quiz ||
      typeof quiz.topic !== "string" ||
      !Array.isArray(quiz.questions) ||
      quiz.questions.length !== 5 ||
      quiz.questions.some(
        (q: any) =>
          typeof q.question !== "string" ||
          !Array.isArray(q.options) ||
          q.options.length !== 4 ||
          typeof q.answerIndex !== "number" ||
          q.answerIndex < 0 ||
          q.answerIndex > 3
      )
    ) {
      return NextResponse.json({ error: "Malformed quiz from model." }, { status: 500 });
    }

    return NextResponse.json(quiz, { status: 200 });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? "Unknown error" }, { status: 500 });
  }
}
