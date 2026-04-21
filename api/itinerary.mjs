const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  if (!GEMINI_API_KEY) return res.status(500).json({ error: 'Missing GEMINI_API_KEY' });

  const { countryName, days, budget, styles, traveler, notes } = req.body || {};
  if (!countryName || !days) return res.status(400).json({ error: 'Missing required fields' });

  const styleList = Array.isArray(styles) ? styles.join(', ') : styles || 'culture';

  const prompt = `You are an expert travel planner. Create a detailed ${days}-day trip itinerary for ${countryName}.

Traveler profile:
- Group: ${traveler || 'couple'}
- Budget: ${budget || 'mid-range'}
- Interests: ${styleList}
- Special requests: ${notes || 'none'}

Return ONLY a valid JSON object with this exact structure (no markdown, no extra text):
{
  "intro": "2-3 sentence overview of the trip",
  "days": [
    {
      "day": 1,
      "title": "Catchy day title",
      "morning": "Detailed morning activity with specific place names (2-3 sentences)",
      "afternoon": "Detailed afternoon activity with specific place names (2-3 sentences)",
      "evening": "Detailed evening activity and dinner recommendation (2-3 sentences)",
      "tip": "One practical tip specific to this day",
      "estimatedCost": "Estimated daily spend e.g. $50-80 per person"
    }
  ],
  "packingEssentials": ["item1", "item2", "item3", "item4", "item5", "item6"],
  "budgetSummary": "2-sentence total trip budget estimate",
  "bestAdvice": "Single most important piece of advice for this specific trip"
}

Rules:
- Create exactly ${days} day objects
- Use real, specific place names in ${countryName}
- Morning/afternoon/evening must be detailed and actionable
- Budget estimates must reflect the ${budget} level
- If family traveler, include child-friendly options
- If adventure interest, include physical activities`;

  try {
    const geminiResp = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.7, maxOutputTokens: 4096 },
        }),
      }
    );

    if (!geminiResp.ok) {
      const errText = await geminiResp.text();
      console.error('Gemini error:', geminiResp.status, errText);
      return res.status(502).json({ error: `Gemini error ${geminiResp.status}` });
    }

    const json = await geminiResp.json();
    const raw = json?.candidates?.[0]?.content?.parts?.[0]?.text || '';
    const cleaned = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, '').trim();
    const parsed = JSON.parse(cleaned);

    if (!parsed.days?.length) throw new Error('Invalid AI response structure');

    return res.json(parsed);
  } catch (err) {
    console.error('Itinerary error:', err);
    return res.status(500).json({ error: err?.message || 'Failed to generate itinerary' });
  }
}
