import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { extractJsonObject } from '../lib/ai/json'

describe('extractJsonObject', () => {
  it('extracts the first balanced JSON object while ignoring surrounding prose', () => {
    const text = 'Here is the plan:\n{"plan":[{"meal_name":"Pasta","ingredients":[{"name":"tomato"}]}]}\nEnjoy.'

    assert.equal(
      extractJsonObject(text),
      '{"plan":[{"meal_name":"Pasta","ingredients":[{"name":"tomato"}]}]}'
    )
  })

  it('does not stop on braces inside JSON strings', () => {
    const text = '{"plan":[{"meal_name":"Soup","description":"Use a {large} pot"}]} trailing'

    assert.equal(
      extractJsonObject(text),
      '{"plan":[{"meal_name":"Soup","description":"Use a {large} pot"}]}'
    )
  })
})
