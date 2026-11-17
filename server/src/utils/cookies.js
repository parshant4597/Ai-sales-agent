// Just enough cookie handling for one session cookie, so no cookie-parser package is needed.

export function parseCookies(header) {
  const cookies = {};
  for (const part of String(header || '').split(';')) {
    const index = part.indexOf('=');
    if (index < 1) continue;
    const name = part.slice(0, index).trim();
    if (!name) continue;
    try {
      cookies[name] = decodeURIComponent(part.slice(index + 1).trim());
    } catch {
      /* ignore a cookie with broken encoding */
    }
  }
  return cookies;
}

export function serializeCookie(name, value, { maxAgeSeconds, secure = false } = {}) {
  const parts = [`${name}=${encodeURIComponent(value)}`, 'Path=/', 'HttpOnly', 'SameSite=Lax'];
  if (maxAgeSeconds !== undefined) parts.push(`Max-Age=${maxAgeSeconds}`);
  if (secure) parts.push('Secure');
  return parts.join('; ');
}
