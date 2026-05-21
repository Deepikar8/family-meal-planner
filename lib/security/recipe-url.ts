import { lookup } from 'node:dns/promises'
import { isIP } from 'node:net'

const PRIVATE_HOSTS = new Set(['localhost', '0.0.0.0'])

function isPrivateIPv4(host: string): boolean {
  const parts = host.split('.').map(Number)
  if (parts.length !== 4 || parts.some(part => !Number.isInteger(part) || part < 0 || part > 255)) {
    return false
  }

  const [a, b] = parts
  return (
    a === 10 ||
    a === 127 ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168)
  )
}

function isPrivateIPv6(host: string): boolean {
  const normalized = host.toLowerCase()
  return (
    normalized === '::1' ||
    normalized.startsWith('fc') ||
    normalized.startsWith('fd') ||
    normalized.startsWith('fe80:')
  )
}

function isPrivateAddress(host: string): boolean {
  const version = isIP(host)
  if (version === 4) return isPrivateIPv4(host)
  if (version === 6) return isPrivateIPv6(host)
  return false
}

export function validateRecipeImportUrl(rawUrl: string): { ok: true; url: URL } | { ok: false; error: string } {
  let parsed: URL
  try {
    parsed = new URL(rawUrl)
  } catch {
    return { ok: false, error: 'Please enter a valid URL.' }
  }

  if (!['http:', 'https:'].includes(parsed.protocol)) {
    return { ok: false, error: 'Please enter a valid URL starting with http:// or https://.' }
  }

  if (parsed.username || parsed.password) {
    return { ok: false, error: 'Recipe URLs cannot include credentials.' }
  }

  const host = parsed.hostname.toLowerCase()
  if (!host || PRIVATE_HOSTS.has(host) || host.endsWith('.localhost') || isPrivateAddress(host)) {
    return { ok: false, error: 'Please enter a public recipe URL.' }
  }

  return { ok: true, url: parsed }
}

export async function assertRecipeImportUrlIsAllowed(rawUrl: string): Promise<URL> {
  const validation = validateRecipeImportUrl(rawUrl)
  if (!validation.ok) throw new Error(validation.error)

  const addresses = await lookup(validation.url.hostname, { all: true, verbatim: false })
  if (!addresses.length || addresses.some(({ address }) => isPrivateAddress(address))) {
    throw new Error('Please enter a public recipe URL.')
  }

  return validation.url
}
