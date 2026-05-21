export function isCronRequestAuthorized(request: Request, cronSecret: string | undefined): boolean {
  if (!cronSecret) return false
  return request.headers.get('authorization') === `Bearer ${cronSecret}`
}
