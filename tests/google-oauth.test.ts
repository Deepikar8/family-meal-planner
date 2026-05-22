import assert from 'node:assert/strict'
import { test } from 'node:test'
import { googleOAuthOptions } from '@/lib/auth/google'

test('googleOAuthOptions forces account selection on sign in', () => {
  assert.deepEqual(googleOAuthOptions('https://meal.example'), {
    redirectTo: 'https://meal.example/auth/callback',
    queryParams: {
      prompt: 'select_account',
    },
  })
})
