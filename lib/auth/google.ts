export function googleOAuthOptions(origin: string) {
  return {
    redirectTo: `${origin}/auth/callback`,
    queryParams: {
      prompt: 'select_account',
    },
  }
}
