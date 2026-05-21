import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { isCronRequestAuthorized } from '../lib/security/cron'
import { validateRecipeImportUrl } from '../lib/security/recipe-url'
import { addDaysToDateString, icalFloatingDateTime } from '../lib/calendar/ics'

describe('isCronRequestAuthorized', () => {
  it('requires the bearer cron secret even when Vercel cron headers are present', () => {
    const request = new Request('https://example.test/api/emails/daily-reminder', {
      method: 'POST',
      headers: { 'x-vercel-cron-signature': 'present-but-unverified' },
    })

    assert.equal(isCronRequestAuthorized(request, 'secret'), false)
  })

  it('accepts the configured bearer cron secret', () => {
    const request = new Request('https://example.test/api/emails/daily-reminder', {
      method: 'POST',
      headers: { authorization: 'Bearer secret' },
    })

    assert.equal(isCronRequestAuthorized(request, 'secret'), true)
  })
})

describe('validateRecipeImportUrl', () => {
  it('rejects localhost and private network hosts', () => {
    assert.equal(validateRecipeImportUrl('http://localhost:54321').ok, false)
    assert.equal(validateRecipeImportUrl('http://127.0.0.1:54321').ok, false)
    assert.equal(validateRecipeImportUrl('http://192.168.1.10/recipe').ok, false)
    assert.equal(validateRecipeImportUrl('http://10.0.0.5/recipe').ok, false)
    assert.equal(validateRecipeImportUrl('http://172.16.0.5/recipe').ok, false)
  })

  it('allows public http and https recipe URLs', () => {
    assert.equal(validateRecipeImportUrl('https://example.com/recipe').ok, true)
    assert.equal(validateRecipeImportUrl('http://example.com/recipe').ok, true)
  })
})

describe('iCal date formatting', () => {
  it('emits floating local dinner times instead of UTC timestamps', () => {
    const friday = addDaysToDateString('2026-05-18', 4)

    assert.equal(friday, '2026-05-22')
    assert.equal(icalFloatingDateTime(friday, 18, 30), '20260522T183000')
  })
})
