// /api/chat endpoint for OpenAI/Gemini chat
import { config } from 'dotenv';
config();

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { messages } = req.body;
  if (!Array.isArray(messages)) return res.status(400).json({ error: 'Invalid messages' });

  // Use OpenAI as default (can swap to Gemini or other)
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'Missing OpenAI API key' });

  try {
    const resp = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: messages.map(m => ({ role: m.role, content: m.content })),
        max_tokens: 256,
        temperature: 0.7
      })
    });
    const data = await resp.json();
    const reply = data.choices?.[0]?.message?.content || 'Sorry, I could not get a response.';
    res.json({ reply });
  } catch (e) {
    res.status(500).json({ error: 'Failed to contact OpenAI', details: e.message });
  }
}
