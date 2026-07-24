import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: NextRequest) {
  try {
    const { image } = await req.json();
    if (!image) {
      return NextResponse.json({ error: "No image provided" }, { status: 400 });
    }

    const sizeBytes = (image.length * 3) / 4;
    if (sizeBytes > 4 * 1024 * 1024) {
      return NextResponse.json({ error: "Image too large (max 4MB)" }, { status: 400 });
    }

    const message = await client.messages.create({
      model: "claude-haiku-4-5",
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: {
                type: "base64",
                media_type: "image/jpeg",
                data: image,
              },
            },
            {
              type: "text",
              text: `You are a receipt parser. Return ONLY valid JSON, no markdown, no explanation:
{ "store": "store name", "date": "YYYY-MM-DD", "total": number, "items": [{"name": "item", "price": number}], "suggested_category": "one of: Еда, Транспорт, Жильё, Здоровье, Развлечения, Одежда, Алкоголь, Кафе / рестораны, Котики / питомцы, Подписки, Подарки, Спорт, Аптека, Прочее" }`,
            },
          ],
        },
      ],
      system:
        "You are a receipt parser. Extract information from receipt images and return ONLY valid JSON with no markdown formatting.",
    });

    const text = message.content[0].type === "text" ? message.content[0].text : "";
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON in response");

    const parsed = JSON.parse(jsonMatch[0]);
    return NextResponse.json(parsed);
  } catch (err) {
    console.error("Receipt scan error:", err);
    return NextResponse.json(
      { error: "Failed to parse receipt" },
      { status: 500 }
    );
  }
}
