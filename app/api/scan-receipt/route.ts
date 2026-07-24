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
      max_tokens: 2048,
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
              text: `You are a receipt parser. Analyze EACH line item individually and assign it to the most specific category. Return ONLY valid JSON, no markdown:
{ "store": "store name", "date": "YYYY-MM-DD", "groups": [{"category": "category name", "total": number, "items": ["item name - price", ...]}] }

Category rules (use EXACTLY these names):
- "Продукты" — bread, dairy, meat, fish, eggs, vegetables, fruit, rice, pasta, basic groceries
- "Сладости / снеки" — candy, chocolate, chips, crackers, cookies, sweets, halva, waffles, snacks
- "Газировка / соки" — cola, soda, energy drinks, juice, flavored water, lemonade
- "Кофе / чай" — coffee, tea, espresso, cappuccino
- "Кафе / рестораны" — restaurant meals, cafe food
- "Фастфуд" — fast food, hot dogs, shawarma, pizza
- "Алкоголь" — beer, wine, vodka, cognac, spirits, any alcohol
- "Сигареты / табак" — cigarettes, tobacco, vape, e-cigarettes, lighter, matches
- "Аптека" — medicine, pills, bandages, pharmacy items
- "Здоровье / медицина" — vitamins, supplements, health products
- "Бытовая химия" — cleaning products, detergent, dish soap, laundry
- "Гигиена / красота" — soap, shampoo, toothpaste, cosmetics, deodorant, razors
- "Жильё / коммуналка" — utilities, rent, housing
- "Транспорт" — transport, gas, fuel, parking, taxi
- "Одежда" — clothing, shoes, accessories, bags
- "Электроника" — electronics, gadgets, batteries, cables
- "Развлечения" — entertainment, games, movies
- "Спорт" — sports equipment, gym
- "Подписки" — subscriptions, streaming services
- "Подарки" — gifts, wrapping
- "Котики / питомцы" — pet food, vet, pet supplies, cat litter
- "Прочее" — anything that doesn't fit the categories above

Group items by category. Items in the same category go into one group. Each group's total = sum of its items' prices.`,
            },
          ],
        },
      ],
      system:
        "You are a receipt parser. Extract and categorize each line item from receipt images. Return ONLY valid JSON with no markdown formatting.",
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
