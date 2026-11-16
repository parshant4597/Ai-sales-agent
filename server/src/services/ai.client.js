// Thin wrapper around any OpenAI-compatible "chat completions" endpoint.
// Swapping Groq for OpenAI / Gemini / a local model is only an .env change.
import { env } from '../config/env.js';

const DEFAULT_TIMEOUT_MS = 20000;

export function isAiConfigured() {
  return Boolean(env.aiApiKey);
}

/**
 * Sends one system + user message and returns the parsed JSON object.
 * Throws on network errors, timeouts, HTTP errors or invalid JSON, and the
 * callers catch that and use the rule-based fallback instead.
 */
export async function requestJson({ system, user, timeoutMs = DEFAULT_TIMEOUT_MS }) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(`${env.aiBaseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${env.aiApiKey}`,
      },
      body: JSON.stringify({
        model: env.aiModel,
        temperature: 0.1,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: user },
        ],
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`AI API responded with status ${response.status}`);
    }

    const data = await response.json();
    const content = data?.choices?.[0]?.message?.content;
    if (typeof content !== 'string') {
      throw new Error('AI API returned no message content');
    }
    return JSON.parse(content);
  } finally {
    clearTimeout(timer);
  }
}
