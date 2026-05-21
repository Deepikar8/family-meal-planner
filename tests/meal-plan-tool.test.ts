import assert from 'node:assert/strict'
import { test } from 'node:test'
import { mealPlanFromToolUseContent } from '@/lib/ai/meal-plan'

const validPlan = {
  plan: [
    {
      day: 'Monday',
      meal_name: 'Chicken Rice Bowls',
      description: 'Tender chicken served over rice with crisp vegetables.',
      cook_time_minutes: 30,
      emoji: '🍚',
      sides_suggestion: 'Serve with cucumber salad.',
      ingredients: [{ name: 'Chicken breast', amount: '1 lb', category: 'protein' }],
      instructions: ['Cook chicken.', 'Serve over rice.'],
    },
    {
      day: 'Tuesday',
      meal_name: 'Turkey Tacos',
      description: 'Mild turkey tacos with familiar toppings.',
      cook_time_minutes: 25,
      emoji: '🌮',
      sides_suggestion: 'Serve with corn and avocado.',
      ingredients: [{ name: 'Ground turkey', amount: '1 lb', category: 'protein' }],
      instructions: ['Brown turkey.', 'Fill tortillas.'],
    },
    {
      day: 'Wednesday',
      meal_name: 'Salmon Pasta',
      description: 'Flaky salmon tossed with pasta and peas.',
      cook_time_minutes: 35,
      emoji: '🍝',
      sides_suggestion: 'Serve with green salad.',
      ingredients: [{ name: 'Salmon', amount: '1 lb', category: 'protein' }],
      instructions: ['Bake salmon.', 'Toss with pasta.'],
    },
    {
      day: 'Thursday',
      meal_name: 'Bean Burrito Bowls',
      description: 'Hearty beans, rice, and mild toppings in bowls.',
      cook_time_minutes: 20,
      emoji: '🥣',
      sides_suggestion: 'Serve with sliced fruit.',
      ingredients: [{ name: 'Black beans', amount: '2 cans', category: 'pantry' }],
      instructions: ['Warm beans.', 'Build bowls.'],
    },
    {
      day: 'Friday',
      meal_name: 'Beef Stir Fry',
      description: 'Quick beef and vegetables in a savory sauce.',
      cook_time_minutes: 30,
      emoji: '🥢',
      sides_suggestion: 'Serve with steamed rice.',
      ingredients: [{ name: 'Beef strips', amount: '1 lb', category: 'protein' }],
      instructions: ['Sear beef.', 'Stir fry vegetables.'],
    },
  ],
}

test('extracts a meal plan from Anthropic tool use content', () => {
  const content = [
    { type: 'text', text: 'Calling the tool now.' },
    { type: 'tool_use', name: 'return_meal_plan', input: validPlan },
  ]

  assert.deepEqual(mealPlanFromToolUseContent(content), validPlan)
})

test('ignores unrelated tool use content', () => {
  const content = [
    { type: 'tool_use', name: 'other_tool', input: validPlan },
  ]

  assert.equal(mealPlanFromToolUseContent(content), null)
})
