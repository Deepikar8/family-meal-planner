import { createAdminClient } from '@/lib/supabase/admin'
import type { MealDay } from '@/app/api/generate-plan/route'
import SharedPlanView from '@/components/SharedPlanView'

interface Props {
  params: { token: string }
}

export default async function SharedPlanPage({ params }: Props) {
  // Use the service-role admin client so this public page can read the
  // meal_plans table without the viewer needing to be authenticated.
  // The anon client would be blocked by RLS since the viewer isn't the plan owner.
  const supabase = createAdminClient()

  const { data } = await supabase
    .from('meal_plans')
    .select('plan, week_start')
    .eq('share_token', params.token)
    .single()

  if (!data) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center px-6 text-center bg-white">
        <div className="text-5xl mb-4">🤔</div>
        <h1 className="text-xl font-bold text-gray-900 mb-2">Plan not found</h1>
        <p className="text-gray-500 text-sm">
          This link may have expired or the plan was regenerated.
          Ask your family member to share a new link.
        </p>
      </main>
    )
  }

  // Format "Week of March 10" from week_start
  const weekLabel = new Date(data.week_start + 'T12:00:00').toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
  })

  return <SharedPlanView plan={data.plan as MealDay[]} weekLabel={weekLabel} />
}
