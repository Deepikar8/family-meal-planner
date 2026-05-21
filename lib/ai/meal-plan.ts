export interface Ingredient {
  name: string
  amount: string
  category: 'produce' | 'protein' | 'dairy' | 'pantry' | 'spices'
}

export interface MealDay {
  day: string
  meal_name: string
  description: string
  cook_time_minutes: number
  emoji: string
  sides_suggestion: string
  ingredients: Ingredient[]
  instructions: string[]
}

export interface MealPlan {
  plan: MealDay[]
}

export const EXPECTED_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'] as const

const INGREDIENT_CATEGORIES = ['produce', 'protein', 'dairy', 'pantry', 'spices'] as const

export const MEAL_PLAN_TOOL = {
  name: 'return_meal_plan',
  description: 'Return the completed Monday-Friday family dinner plan.',
  input_schema: {
    type: 'object',
    additionalProperties: false,
    properties: {
      plan: {
        type: 'array',
        minItems: 5,
        maxItems: 5,
        items: {
          type: 'object',
          additionalProperties: false,
          properties: {
            day: { type: 'string', enum: EXPECTED_DAYS },
            meal_name: { type: 'string' },
            description: { type: 'string' },
            cook_time_minutes: { type: 'number', minimum: 1 },
            emoji: { type: 'string' },
            sides_suggestion: { type: 'string' },
            ingredients: {
              type: 'array',
              minItems: 1,
              items: {
                type: 'object',
                additionalProperties: false,
                properties: {
                  name: { type: 'string' },
                  amount: { type: 'string' },
                  category: { type: 'string', enum: INGREDIENT_CATEGORIES },
                },
                required: ['name', 'amount', 'category'],
              },
            },
            instructions: {
              type: 'array',
              minItems: 1,
              items: { type: 'string' },
            },
          },
          required: [
            'day',
            'meal_name',
            'description',
            'cook_time_minutes',
            'emoji',
            'sides_suggestion',
            'ingredients',
            'instructions',
          ],
        },
      },
    },
    required: ['plan'],
  },
} as const

type ToolContentBlock = {
  type: string
  name?: string
  input?: unknown
}

export function mealPlanFromToolUseContent(content: ToolContentBlock[] | undefined): MealPlan | null {
  const toolUse = content?.find((block) => (
    block.type === 'tool_use' &&
    block.name === MEAL_PLAN_TOOL.name &&
    typeof block.input === 'object' &&
    block.input !== null
  ))

  return toolUse ? toolUse.input as MealPlan : null
}

export function validateMealPlan(mealPlan: MealPlan): string | null {
  if (!mealPlan?.plan || !Array.isArray(mealPlan.plan)) return 'Missing plan array'
  if (mealPlan.plan.length !== 5) return 'Plan must contain exactly 5 dinners'

  for (const day of EXPECTED_DAYS) {
    const meal = mealPlan.plan.find((m) => m.day === day)
    if (!meal) return `Missing ${day}`
    if (!meal.meal_name || !meal.description || !meal.emoji || !meal.sides_suggestion) {
      return `${day} is missing required meal fields`
    }
    if (!Number.isFinite(meal.cook_time_minutes) || meal.cook_time_minutes < 1) {
      return `${day} has invalid cook_time_minutes`
    }
    if (!Array.isArray(meal.ingredients) || meal.ingredients.length === 0) {
      return `${day} has no ingredients`
    }
    if (!Array.isArray(meal.instructions) || meal.instructions.length === 0) {
      return `${day} has no instructions`
    }
  }

  return null
}
