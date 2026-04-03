// /api/chat endpoint for Hugging Face chat
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { messages } = req.body;
  if (!Array.isArray(messages)) return res.status(400).json({ error: 'Invalid messages' });

  const apiKey = process.env.HF_API_TOKEN;
  if (!apiKey) {
    console.error('Missing Hugging Face API token');
    return res.status(500).json({ error: 'Missing Hugging Face API token' });
  }

  // Use DeepSeek-V2 as the model (free tier)
  const HF_MODEL = 'deepseek-ai/DeepSeek-V2';

  try {
    const resp = await fetch('https://router.huggingface.co/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        model: HF_MODEL,
        messages
      })
    });
    let data;
    try {
      data = await resp.json();
    } catch (jsonErr) {
      // If not JSON (e.g. 404 Not Found), return error
      const text = await resp.text();
      console.error('Hugging Face non-JSON response:', text);
      return res.status(500).json({ error: 'Hugging Face API error', details: text });
    }
    // Hugging Face returns choices[0].message.content for chat
    const reply = data?.choices?.[0]?.message?.content || data?.error || 'Sorry, I could not get a response.';
    res.json({ reply });
  } catch (e) {
    console.error('Hugging Face fetch error:', e);
    res.status(500).json({ error: 'Failed to contact Hugging Face', details: e.message });
  }
}
