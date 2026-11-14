/**
 * Shared Groq API client for the Tools Hub writing utilities.
 * Reuses the project's existing VITE_GROQ_API_KEY environment variable.
 * Never hardcodes an API key.
 */

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions'

export async function callGroq(messages, options = {}) {
  const apiKey = import.meta.env.VITE_GROQ_API_KEY
  if (!apiKey) {
    throw new Error('Groq API key is not configured. Set VITE_GROQ_API_KEY in your environment.')
  }

  const response = await fetch(GROQ_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: options.model || 'openai/gpt-oss-safeguard-20b',
      messages,
      temperature: options.temperature ?? 0.7,
      max_tokens: options.max_tokens ?? 1024,
    }),
  })

  if (!response.ok) {
    const errData = (await response.json().catch(() => ({}))) || {}
    throw new Error(errData.error?.message || `Groq API request failed (${response.status})`)
  }

  const data = await response.json()
  return data.choices?.[0]?.message?.content || ''
}

export default { callGroq }
