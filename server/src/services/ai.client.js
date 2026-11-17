// Thin wrapper around any OpenAI-compatible "chat completions" endpoint.
// Swapping Groq for OpenAI / Gemini / a local model is only an .env change.
import { env } from '../config/env.js';

const DEFAULT_TIMEOUT_MS = 15000;
const DEFAULT_RETRY_WAIT_MS = 1500;
const MAX_RETRY_WAIT_MS = 4000;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export function isAiConfigured() {
  return Boolean(env.aiApiKey);
}

// Some models wrap JSON in ```json fences even when told not to.
function parseJsonContent(content) {
  return JSON.parse(content.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, ''));
}

/**
 * Sends one system + user message and returns the parsed JSON object.
 * A rate-limit answer (HTTP 429) is retried once if the wait is short.
 * Everything else throws (network error, timeout, HTTP error, invalid JSON), and the
 * callers catch that and use the rule-based fallback instead.
 */
export async function requestJson({ system, user, timeoutMs = DEFAULT_TIMEOUT_MS }) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  const send = () =>
    fetch(`${env.aiBaseUrl}/chat/completions`, {
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

  try {
    let response = await send();

    if (response.status === 429) {
      const waitMs = (Number(response.headers.get('retry-after')) || 0) * 1000 || DEFAULT_RETRY_WAIT_MS;
      if (waitMs <= MAX_RETRY_WAIT_MS) {
        await sleep(waitMs);
        response = await send();
      }
    }

    if (!response.ok) {
      throw new Error(`AI API responded with status ${response.status}`);
    }

    const data = await response.json();
    const content = data?.choices?.[0]?.message?.content;
    if (typeof content !== 'string') {
      throw new Error('AI API returned no message content');
    }
    return parseJsonContent(content);
  } finally {
    clearTimeout(timer);
  }
}
