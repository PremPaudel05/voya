// /api/chat endpoint for OpenAI/Gemini chat
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { messages } = req.body;
  if (!Array.isArray(messages)) return res.status(400).json({ error: 'Invalid messages' });

  const apiKey = process.env.HF_API_TOKEN;
  if (!apiKey) {
    console.error('Missing Hugging Face API token');
    return res.status(500).json({ error: 'Missing Hugging Face API token' });
  }

  // Use Mistral-7B-Instruct as the model
  const HF_MODEL = 'mistralai/Mistral-7B-Instruct-v0.2';
  // Join all messages for context (simple prompt)
  const prompt = messages.map(m => (m.role === 'user' ? `User: ${m.content}` : `Assistant: ${m.content}`)).join('\n');

  try {
    const resp = await fetch(`https://api-inference.huggingface.co/models/${HF_MODEL}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({ inputs: prompt })
    });
    const data = await resp.json();
    // Hugging Face returns an array of generated texts
    const reply = Array.isArray(data) && data[0]?.generated_text
      ? data[0].generated_text.replace(prompt, '').trim()
      : (data.error || 'Sorry, I could not get a response.');
    res.json({ reply });
  } catch (e) {
    console.error('Hugging Face fetch error:', e);
    res.status(500).json({ error: 'Failed to contact Hugging Face', details: e.message });
  }
}
