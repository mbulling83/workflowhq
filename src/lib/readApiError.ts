/**
 * Reads a failed HTTP response body. Proxies and gateways often return plain text or HTML
 * instead of JSON; this avoids SyntaxError from blindly calling Response.json().
 */
export async function readApiError(res: Response): Promise<string> {
  const text = await res.text()
  try {
    const data = JSON.parse(text) as { error?: unknown }
    if (data && typeof data.error === 'string' && data.error.trim()) {
      return data.error.trim()
    }
  } catch {
    // not JSON
  }
  const normalized = text.trim().replace(/\s+/g, ' ')
  if (normalized) {
    return normalized.length > 280 ? `${normalized.slice(0, 280)}…` : normalized
  }
  return `Request failed (${res.status})`
}
