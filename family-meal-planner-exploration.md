# Family Meal Planner — Feature & Strategy Exploration

*Working document — last updated March 9, 2026 · v2*

---

## 1. The Problem Worth Solving

Every week, millions of families face the same draining cycle: "What's for dinner?" → frantic recipe searching → a disorganized grocery run → food that goes to waste anyway. The mental load of feeding a family is enormous — and it falls disproportionately on one person in the household.

Existing solutions either require too much manual effort (spreadsheets, Pinterest boards) or feel like they were built for solo fitness enthusiasts, not for a household where one kid won't eat tomatoes, another is in a mac-and-cheese-only phase, and the adults are trying to eat healthier without cooking two separate meals.

**The core insight:** Families don't just need recipes. They need a system that absorbs the cognitive load of feeding a household — planning, shopping, adapting, and coordinating — so dinner stops being a daily crisis.

---

## 2. Competitive Landscape

The meal planning app market is projected to grow from ~$2.5B (2025) to ~$6.8B by 2034. Here's who's in the space and where the gaps are:

| App | Strength | Weakness | Price |
|-----|----------|----------|-------|
| **Ollie** | AI-powered, family-friendly, grocery delivery integration | Newer entrant, smaller recipe library | ~$10/mo |
| **Mealime** | Fast 30-min recipes, good free tier | Limited family coordination, basic AI | $5.99/mo premium |
| **Samsung Food** | Free, smart home integration | Requires Samsung ecosystem, less family-focused | Free |
| **AnyList** | Excellent shared grocery lists | Meal planning is secondary, not AI-driven | $12/yr |
| **Eat This Much** | Budget + macro control | Optimized for individuals, not families | $9/mo |
| **Plan to Eat** | Great organization, recipe import | Manual planning, no AI, dated UI | $5.95/mo |

### Where the gaps are

1. **Family coordination is an afterthought.** Most apps treat meal planning as a single-user activity. No one does multi-member household preferences well — managing different tastes, ages, and dietary needs in one plan.
2. **The plan-to-table pipeline breaks.** Planning a meal and actually getting it on the table are different problems. Prep scheduling, defrost reminders, and "start cooking" notifications are largely missing.
3. **Kids are invisible.** No major app treats kid-friendliness as a first-class feature — picky eater profiles, gradual flavor introduction, age-appropriate nutrition.
4. **Leftovers and waste are ignored.** Apps plan meals but don't help you use what's already in your fridge, repurpose leftovers, or reduce waste.
5. **The "family meeting" doesn't exist.** There's no collaborative moment where the family votes on or browses next week's meals together — it's still one person deciding for everyone.

---

## 3. Target Audience Segments

While you're targeting families broadly, it helps to define the segments you'd serve — each has different "willingness to pay" triggers.

### Segment A: The Overwhelmed Planner
- Typically one parent carrying the full mental load of household meals
- Values: time savings, reduced decision fatigue, "just tell me what to cook"
- **Willingness to pay for:** done-for-you plans, automated grocery lists, "I don't have to think" simplicity

### Segment B: The Health-Conscious Family
- Wants balanced nutrition for growing kids without it being a battle
- Values: nutritional visibility, allergen management, portion guidance by age
- **Willingness to pay for:** dietitian-informed plans, allergy/intolerance management, nutritional dashboards

### Segment C: The Budget Stretcher
- Trying to feed a family of 4–6 without spending $200+/week on groceries
- Values: cost-per-meal visibility, sale integration, waste reduction
- **Willingness to pay for:** budget optimization, store-specific pricing, "use what you have" features

### Segment D: The Collaborative Household
- Two working parents or older kids who share cooking duties
- Values: shared planning, assigned cooking nights, visibility into what's happening
- **Willingness to pay for:** multi-user access, cooking assignments, shared grocery lists

---

## 4. Feature Exploration

### 4.1 Core Features (Table Stakes — Must Ship)

These are the minimum features users expect from any meal planning app. Without them, you won't be taken seriously.

**Weekly Meal Plan Generation**
- AI-generated plans based on household preferences, dietary restrictions, and family size
- Drag-and-drop calendar view to swap meals around
- Support for breakfast, lunch, dinner, and snacks

**Smart Grocery List**
- Auto-generated from the meal plan
- Organized by store aisle
- Shareable with household members in real-time
- Check-off items as you shop

**Recipe Library & Import**
- Curated library of family-tested recipes
- Import from any URL (blogs, YouTube, etc.)
- Save personal/family recipes
- Search and filter by cook time, difficulty, ingredients

**Household Profiles**
- Individual profiles for each family member
- Dietary restrictions and allergies per person
- Taste preferences (likes, dislikes, "will tolerate")

**Recipe Rating & Feedback System**
- After cooking a meal, rate it: Keep (loved it), Discard (won't make again), or Tweak (good but needs changes)
- Tweak mode lets you log specific adjustments: "more spice," "less sugar," "add salt," "cook longer," "use less oil," etc.
- The app saves your family's version of the recipe with those modifications baked in — so next time it appears in your plan, it's already adjusted
- Ratings are per-household-member: Mom loved it, the 5-year-old rejected it, Dad thought it needed more garlic — all captured
- Over time, the AI learns your family's collective palate and stops suggesting meals that got discarded, while favoring patterns from your top-rated meals
- "Family Favorites" list auto-populates from highly rated recipes for easy repeat scheduling
- Optional quick-rate: simple thumbs up/down after dinner for nights when you don't want to write notes

---

### 4.2 Differentiating Features (What Makes You Stand Out)

These are the features that would make your app feel meaningfully different from what's already out there.

**Picky Eater Intelligence**
- Dedicated kid profiles with a "pickiness spectrum"
- Gradual flavor introduction suggestions ("If they like buttered noodles, try this next...")
- "Stealth veggie" recipe tags for hiding nutrition in kid-approved meals
- Track what each kid actually ate vs. rejected over time

**Family Meal Voting**
- Weekly "What should we eat?" polls shared with the household
- Each family member (including kids) can vote or veto
- Surfaces options everyone can agree on
- Turns the dreaded "what do you want for dinner" into a 2-minute interaction

**Fridge & Pantry-First Planning**
- Snap a photo of your fridge, pantry, or cupboards → AI identifies ingredients
- Maintain a running "what we have" inventory across three zones: fridge (perishables), pantry (lentils, rice, canned goods, spices, oils, pasta), and freezer (frozen proteins, vegetables, leftovers)
- "Use what you have" meal suggestions that prioritize ingredients already on hand — especially pantry staples that families tend to forget they have
- Expiration date tracking and "use it before it goes bad" alerts for perishables; pantry items get gentler "you've had this for a while" nudges
- Leftover repurposing: "You have half a rotisserie chicken → here are 3 things to make"
- Smart grocery list deduction: if the plan calls for lentils and you already have them in your pantry inventory, they don't show up on the shopping list
- "Pantry meals" tag for recipes that can be made entirely from shelf-stable ingredients — great for end-of-week when you haven't shopped yet

**Cook-Night Coordination**
- Assign cooking responsibilities to different household members on different nights
- Recipes tagged by difficulty so the less-experienced cook gets manageable meals
- Prep delegation: "Partner A chops veggies in the morning, Partner B cooks at 6pm"

**Prep & Timing Assistant**
- "Start defrosting at 8am" push notifications
- Meal prep scheduling for batch-cooking Sundays
- Real-time cook-along mode with step-by-step timers
- Coordinates timing across multiple dishes ("Start the rice now so it's done when the chicken is")

---

### 4.3 Premium / Delight Features (What Makes People Love It)

These are the features that create loyalty, word-of-mouth, and a reason to upgrade to a paid tier.

**AI Meal Adaptation**
- "Make this dairy-free" / "Make this faster" / "Make this kid-friendly" on any recipe
- Automatically substitute ingredients based on what's in your pantry
- Scale recipes up or down for guests or meal prep

**Budget Dashboard**
- Estimated weekly grocery cost before you shop
- Cost-per-meal breakdown
- "Stay under $X this week" mode that adjusts the plan accordingly
- Integration with store loyalty programs or flyer sales

**Nutritional Family Report**
- Weekly summary: "Your family ate X servings of vegetables, Y grams of protein"
- Per-person nutritional tracking (especially useful for growing kids)
- Gentle nudges, not guilt: "Want to add one more veggie-forward dinner next week?"

**Cultural & Seasonal Awareness**
- Holiday and cultural meal suggestions (Lunar New Year, Thanksgiving, Diwali, etc.)
- Seasonal produce recommendations
- "Theme nights" — Taco Tuesday, Stir-Fry Friday — that families can build traditions around

**Social & Community — "Recipes That Slapped"**
- When a family rates an AI-adapted recipe highly, they can one-tap share it to the community
- Community feed of "family-tested, AI-tweaked" recipes — every shared recipe comes with the family's modifications and ratings attached
- Filter community recipes by household similarity: family size, kids' ages, dietary needs
- "Trending this week" — most-shared recipes among families like yours
- Comments and tips from other families: "We doubled the garlic and it was even better"
- Save community recipes directly into your own plan
- Privacy-first: sharing is always opt-in, and family names/details are never exposed — just "A family of 4 with a picky toddler loved this"

---

## 5. Monetization Strategy

### The Model: Freemium + Subscription

Based on market data, subscription revenue accounts for ~45% of diet/nutrition app revenue. The most successful apps use a generous free tier to build habit, then convert on premium features that save measurable time or money.

### Free Tier (Build the Habit)
- 1 meal plan per week (dinner only)
- Basic grocery list
- Limited recipe library (~200 recipes)
- 1 household profile
- Ad-supported

**Purpose:** Get families using it consistently. The free tier should be good enough that people *rely* on it — that's when they'll pay to unlock more.

### Premium Tier — ~$7.99/month or $59.99/year
- Unlimited meal plans (all meals + snacks)
- Full recipe library + URL import
- Up to 6 household profiles with individual preferences
- Smart grocery list with aisle organization
- Family voting
- Fridge-first planning
- Prep & timing assistant
- Ad-free

**Why this price:** Mealime charges $5.99, Eat This Much charges $9. At $7.99, you're positioned as a family-grade tool (more value than Mealime) without feeling expensive. The annual plan at $59.99 ($5/mo effective) creates strong lock-in.

### Premium+ Tier — ~$12.99/month or $99.99/year
- Everything in Premium
- AI meal adaptation
- Budget dashboard with cost optimization
- Nutritional family reports
- Grocery delivery integration (Instacart, Amazon Fresh, Walmart)
- Priority new features

**Why this tier exists:** Power users who want the app to fully replace their meal planning mental load. The $100/year price point is validated by MyFitnessPal's Premium+ tier.

### Additional Revenue Streams
- **Grocery partnerships:** Affiliate revenue from Instacart/Amazon Fresh/Walmart orders placed through the app
- **Brand partnerships:** "Featured ingredient of the week" (non-intrusive, disclosed)
- **Meal kit partnerships:** "Don't feel like cooking? Here's a HelloFresh box for this plan"
- **Family plan pricing:** $14.99/mo for extended family (grandparents, nannies who cook)

---

## 6. What Would Make People Pay

Based on research into user behavior and complaints, here are the specific "unlock" moments — the points where a free user thinks "okay, I need to upgrade."

### The Triggers

1. **"I saved 3 hours this week."** Time savings is the #1 driver. If your free tier shows them the value but the premium tier saves them measurably more time, they'll convert.

2. **"My kid actually ate it."** Picky eater success stories are emotionally powerful. If the app helps a parent find meals their kid will eat, that's worth $8/month forever.

3. **"We stopped throwing food away."** Waste reduction is both financially and emotionally motivating. Show users how much they saved by using the fridge-first feature.

4. **"My partner finally helps with meals."** The coordination features (shared plans, cooking assignments, voting) solve a relationship pain point, not just a logistics one.

5. **"I stayed under budget."** If you can show a family they spent $50 less on groceries this month because of your budget features, the app pays for itself.

### The Anti-Patterns (Why People Churn)

- Repetitive meal suggestions (the "not chicken again" problem)
- Plans that look good on paper but are unrealistic to actually cook on a Tuesday night
- No way to say "we went out tonight" and adjust the plan
- Grocery lists that don't match how your actual store is laid out
- Subscription fatigue — if it feels like "just another $8/month" without clear value

---

## 7. Strategic Decisions (Resolved)

| Decision | Direction | Rationale |
|----------|-----------|-----------|
| **Platform** | Mobile-first (web app) | Meal planning happens on phones — in the kitchen, at the grocery store. A responsive web app avoids app store gatekeeping and works on any device. Can wrap as a PWA for home-screen install. |
| **Recipe content** | Aggregate from existing sources | Import from YouTube, blogs, websites, cookbook photos, and handwritten recipes. AI parses and standardizes them into a consistent format. No need to build a library from scratch — families already have recipes scattered everywhere. |
| **Launch audience** | Working households with kids | Sharpest pain point, highest willingness to pay. Dual-income families with school-age kids who are time-poor and decision-fatigued. |
| **Grocery integration** | Start with WhatsApp list export | Low-friction, no partnerships needed, works globally. One tap to send the formatted grocery list to your family WhatsApp group. Graduate to delivery integrations later. |
| **Community model** | Share AI-adapted recipes that were hits | Opt-in sharing of family-tested, AI-tweaked recipes. Community becomes a curated library of "meals that actually worked for real families." |

### Remaining Open Questions

1. **AI depth:** How much should the AI "drive" vs. how much should the user be in control? (Fully automated plans vs. AI-assisted manual planning)
2. **Cookbook/photo OCR scope:** How polished does the cookbook photo → recipe extraction need to be at launch? Is "good enough with manual correction" acceptable for v1?
3. **Offline support:** Do users need the app to work without internet (e.g., in a grocery store with poor signal)?

---

## 8. MVP Definition — What Ships in v1 (and What Doesn't)

### The Guiding Principle: Minimal Setup, Maximum "Aha"

The #1 risk for this app isn't building the wrong features — it's losing people before they ever experience the value. A working parent who downloads this at 9pm on a Sunday night will give you about 3 minutes before deciding if it's worth their time. Every screen, every question, every tap before they see a meal plan is a chance for them to close the tab and go back to staring at their fridge.

**Activation is defined as:** User creates (or imports) their first weekly dinner plan AND rates at least one meal after cooking it. That's the full loop. Everything in the MVP exists to get users to that moment as fast as possible and with as little effort as possible.

### The MVP Filter

Every feature was evaluated against four criteria:

1. **Does it complete the core loop?** Plan → Shop → Cook → Rate. If the loop breaks without it, it's in.
2. **Does it deliver the "aha moment" fast?** The user needs to feel "this is better than what I do now" within their first session. Features that take weeks to show value can wait.
3. **Does it block or slow down activation?** If a feature requires upfront effort before the user gets value, it needs to be optional or deferrable — not a gate.
4. **Can we build it in ~8–10 weeks with a small team?** If it requires complex infrastructure (real-time sync, image ML pipelines, moderation systems), it's a v2 candidate.

---

### The Activation Flow — From Sign-Up to First Plan in Under 3 Minutes

This is the most important design in the entire app. Every step is measured by "can we remove this?" and if we can't, "can we make it one tap?"

**Step 1: Sign up (30 seconds)**
- Google/Apple single-tap auth only — no email/password forms
- No email verification step blocking access
- *Why:* Every form field is a drop-off. Social auth gets them in with one tap.

**Step 2: Quick household setup (60 seconds)**
- "Who's eating?" — Add family members as name + age chips. Tap "Adult" or "Kid" to add a row. Three taps for a family of four.
- "Any allergies or diets?" — A short visual grid of common options (nut-free, vegetarian, dairy-free, gluten-free, halal, none). Tap to select, skip to move on. No typing required.
- "Anything your family won't eat?" — Optional free-text field. Pre-populated suggestions ("shellfish," "mushrooms," "spicy food") that users can tap to add. Can be skipped entirely.
- *Why:* This replaces a full profile-building flow. You're collecting the minimum the AI needs to generate a decent first plan. Everything else (detailed preferences, likes/dislikes, pickiness levels) gets collected progressively over time through ratings.
- *Design principle:* Every question has a visible "Skip" option. Nothing is mandatory except "how many people are eating."

**Step 3: Generate your first plan (30 seconds)**
- Immediately after household setup, the screen shows: "Here's your dinner plan for this week" — no extra button to press, no "what would you like to do?" menu.
- 5 dinner cards appear for Mon–Fri. Each card shows: meal name, a photo, cook time, and one-line description.
- User can tap any card to swap it (generates a new suggestion) or tap "Looks good — get my grocery list."
- *Why:* This is the "aha moment." The user just told the app about their family 60 seconds ago and they're already looking at a week of dinners. No recipe browsing, no manual selection, no decision fatigue. The AI did the work.
- *Design principle:* The first plan should feel good, not perfect. "Good enough to try" beats "configure everything first."

**Step 4: Grocery list + WhatsApp export (30 seconds)**
- One tap from the plan → full grocery list, organized by category
- Big green "Send to WhatsApp" button at the top
- *Why:* This is where the time savings become tangible. The user now has a week of dinners AND a shopping list they can share with their partner — in under 3 minutes.

**Step 5: Cook + Rate (happens later in the week — gentle nudges)**
- After a planned dinner night, the app sends a soft reminder: "How was the Chicken Stir-Fry tonight?"
- One-tap rating: thumbs up (Keep), thumbs down (Discard), or pencil icon (Tweak with notes)
- *Why:* This completes activation. The user has now gone through the full loop: plan → shop → cook → tell us what you thought. From here, every subsequent week gets better.
- *Design principle:* The rating prompt should feel like a 5-second check-in, not a chore. Default to the simplest input (thumbs up/down) with the option to add detail.

**What is deliberately NOT in the activation flow:**
- No pantry setup (this is valuable but would add 3–5 minutes of friction before the first plan; it's offered after the first week as "make your next plan even better")
- No recipe importing (save this for users who are already engaged and want to add their own favorites)
- No detailed preference building (collected progressively through ratings instead)
- No tutorial or product tour (the flow IS the tutorial)

---

### Progressive Disclosure — How Features Unlock After Activation

The key insight: features that require setup effort should only appear AFTER the user has experienced value. This prevents front-loading friction while still getting the data you need.

| When | What Unlocks | Why Now |
|------|-------------|---------|
| **After first plan is generated** | Recipe URL import — "Want to add a favorite recipe to next week's plan?" | User is engaged and can see where their recipes would go |
| **After first grocery export** | Pantry setup prompt — "Scan your receipt after you shop to skip buying what you already have next week" | The user just shopped; scanning the receipt is natural and the benefit is immediately obvious |
| **After first rating** | Tweak mode detail — "Want to tell us what to change?" + preference refinement prompts | The user has already given simple feedback; now they can optionally go deeper |
| **After week 2 plan** | "Add more family members' preferences" / detailed likes & dislikes | The user is coming back — now they're invested enough to fine-tune |
| **After 3+ ratings** | "Your plans are getting smarter — here's what we've learned about your family" (progress screen) | Positive reinforcement that ratings are working |

---

### IN — MVP (v1)

**AI Weekly Meal Plan Generation (Dinner Only)**
- Generate a 5-day dinner plan based on household size, dietary restrictions, and basic preferences
- Simple calendar view — swap individual meals, regenerate single days
- The AI generates the first plan immediately after the 60-second household setup — no additional configuration
- *Why it's in:* This is the product. It's also the activation moment — the faster we get a plan on screen, the more likely the user sticks around.
- *What's cut for v1:* Breakfast, lunch, and snack planning. Drag-and-drop reordering (swap buttons are simpler). Full all-meals support comes in v2.

**Recipe Import from URLs (Post-Activation)**
- Paste a link from any recipe blog, YouTube description, or website → AI extracts the recipe into a standardized card
- Save imported recipes to your personal library; optionally include them in future plans
- Surfaces after the first plan: "Got a recipe your family already loves? Add it to next week."
- *Why it's in:* Your content strategy is aggregation. But critically, this is NOT part of the activation flow — it's offered after the user has already seen value.
- *What's cut for v1:* Cookbook photo OCR and handwritten recipe scanning.

**Basic Household Profiles (Up to 4 Members)**
- Collected in the 60-second onboarding: name, age (adult/kid), allergies, dietary restrictions
- Detailed preferences (likes, dislikes, taste notes) are added progressively through ratings and optional prompts after week 1
- *Why it's in:* The AI needs this to generate a relevant plan. But the v1 profile is radically minimal — 3 taps per person, not a form to fill out.
- *What's cut for v1:* Pickiness scoring, per-member nutritional targets, "will tolerate" spectrum. All collected over time.

**Grocery List with WhatsApp Export**
- Auto-generated from the plan, organized by category (produce, dairy, protein, pantry, etc.)
- One-tap WhatsApp export — big, obvious button
- Check-off items within the app
- *Why it's in:* This is the tangible payoff of generating a plan. Without the grocery list, the plan is just inspiration. With it, the app has saved the user 30+ minutes.
- *What's cut for v1:* Aisle-specific organization, real-time shared lists, delivery integrations.

**Recipe Rating — Keep / Discard / Tweak**
- After a planned dinner night, soft prompt: "How was [meal]?"
- One-tap: thumbs up (Keep) / thumbs down (Discard) / pencil (Tweak)
- Tweak captures free-text adjustments: "more spice," "less sugar," "cook longer"
- Discarded recipes never return; Kept recipes get weighted higher in future plans
- *Why it's in:* This completes activation AND builds the flywheel. Without it, the AI is static. The key design decision: make rating feel like a 5-second check-in, not homework.
- *What's cut for v1:* Per-member ratings, auto-modified recipe cards, Family Favorites list.

**Smart Pantry List — Receipt Scan + Checkout Import + Manual (Post-Activation)**
- Three ways to populate, surfaced AFTER the first grocery trip:
  1. **Receipt scan:** Snap a photo of your receipt → AI extracts items into fridge/pantry/freezer categories
  2. **Grocery app import:** Forward checkout confirmation email or screenshot order summary → AI parses items
  3. **Manual entry:** Type or edit items directly
- AI uses the pantry list to improve future plans and deduct from grocery lists
- Post-cooking prompt: "Did you use the rice and canned tomatoes? Remove from pantry?"
- *Why it's in but post-activation:* This feature dramatically improves plans from week 2 onward, but asking someone to inventory their kitchen before they've seen a single meal plan would kill activation. The natural moment to introduce it is right after the first grocery trip: "You just bought all this — scan the receipt so we don't make you buy it again next week."
- *What's cut for v1:* Direct grocery app API integrations, fridge photo recognition, expiration tracking, leftover repurposing, "pantry meals" filtering.

---

### OUT — v2 and Beyond

| Feature | Why It's Out | When It Makes Sense |
|---------|-------------|---------------------|
| **Picky Eater Intelligence** | Requires enough rating data to build flavor models per kid. The v1 rating system collects this data; the intelligence layer comes once we have it. | v2 — after 8+ weeks of rating data per household |
| **Family Meal Voting** | Needs multi-user accounts with auth, notifications, and a voting UI. Adds complexity and would slow down the single-user activation flow. | v2 — once you have households actively using the app weekly |
| **Fridge/Pantry Photo Recognition** | Requires an image recognition ML pipeline. v1 already covers the easier input paths (receipts, checkout emails). | v2 — add as an upgrade path alongside receipt scanning |
| **Direct Grocery App API Integration** | Requires partnerships. v1's email/screenshot approach gets 80% of the value without the overhead. | v2/v3 — once you have scale to negotiate partnerships |
| **Cook-Night Coordination** | Multi-user assignment and notifications. Would require multi-user auth infrastructure. | v2 — after multi-user accounts are built |
| **Prep & Timing Assistant** | Push notifications, real-time timers, native capabilities. | v2/v3 — when you wrap the PWA with Capacitor |
| **AI Meal Adaptation** | Real-time recipe transformation is complex. v1's Tweak notes are the manual precursor. | v2 — once you have tweak data to inform substitution logic |
| **Budget Dashboard** | Needs grocery pricing data, which is fragmented and hard to get. | v3 — once you have grocery partnerships |
| **Nutritional Family Report** | Requires nutritional database and per-recipe macro calculation. | v3 |
| **Cultural & Seasonal Awareness** | Enrichment, not core loop. | v2 — start with a "holiday meals" collection |
| **Community ("Recipes That Slapped")** | Needs moderation, UGC infrastructure, and enough users. A dead community is worse than no community. | v3 — once you have 1,000+ active households |
| **Cookbook Photo / Handwritten Recipe OCR** | ML-heavy. URL import covers 80% of the use case. | v2 — premium feature |
| **Breakfast / Lunch / Snack Planning** | Dinner is the pain point. Expanding multiplies AI complexity. | v2 — easy expansion once dinner planning is solid |

---

### MVP at a Glance

| What Ships | What Waits |
|-----------|------------|
| AI dinner plans (5 days/week) | Full meal planning (breakfast, lunch, snacks) |
| Recipe import from URLs (post-activation) | Cookbook photo scanning |
| Minimal household profiles (3 taps/person) | Picky eater intelligence, detailed preference forms |
| Grocery list + WhatsApp export | Delivery integration, aisle organization |
| Keep / Discard / Tweak ratings | Per-member ratings, auto-modified recipes |
| Pantry list via receipt scan + checkout import (post-activation) | Fridge photo recognition, expiration tracking, direct APIs |
| Progressive feature disclosure | Everything-upfront onboarding |
| — | Voting, coordination, community, budget tools |

### Activation Funnel — What to Measure

The metrics are now structured around the activation flow. If any step has a >30% drop-off, that's where you focus.

| Step | Metric | Target |
|------|--------|--------|
| Sign up → Household setup complete | Onboarding completion rate | >80% |
| Household setup → First plan generated | Time to first plan | <3 minutes |
| First plan → Grocery list exported | Plan-to-list conversion | >60% |
| Grocery list → First meal rated | Full loop completion (= Activation) | >30% within first week |
| Activated → Generates plan in week 2 | Week-1 retention | >50% |
| Week 2 → Pantry setup started | Pantry adoption (post-activation) | >40% |
| Week 4 → Still generating weekly plans | Month-1 retention | >30% |

---

## 9. Suggested MVP Build Roadmap

The build order mirrors the activation flow — we build the critical path first, then layer in post-activation features.

| Phase | Weeks | What Gets Built | Activation Impact |
|-------|-------|-----------------|-------------------|
| **1 — Activation Core** | 1–3 | Google/Apple auth, 60-second household setup (name, age chips, allergy grid), AI dinner plan generation, calendar view with swap/regenerate | Users can sign up and see their first plan |
| **2 — Grocery Loop** | 4–5 | Auto-generated grocery list from plan, WhatsApp export, in-app check-off | Users can go from plan → shopping list in one tap |
| **3 — Feedback Loop** | 6–7 | Post-dinner rating prompts, Keep/Discard/Tweak system, AI weighting from ratings, progressive preference collection | Activation is complete — full loop works |
| **4 — Post-Activation Layer** | 8–9 | Recipe URL importer, pantry inventory (receipt scan + checkout email import + manual), grocery deduction, progressive feature disclosure triggers | Returning users get deeper value |
| **5 — Polish + Launch** | 10 | Onboarding micro-copy, mobile polish, error handling, analytics for activation funnel, soft launch to 50–100 families | Ready for real users |
| **6 — Polish + Launch** | 10 | Onboarding flow, mobile polish, error handling, soft launch to 50–100 families |

---

## 10. Tech Stack Analysis

You're building a mobile-first web app for families, with AI features, image recognition, real-time sharing, and eventual community features. Here's how the main options compare.

### Option A: Progressive Web App (PWA) with React/Next.js

**What it is:** A responsive web app built with React that can be installed on a phone's home screen and work offline. Next.js provides server-side rendering, API routes, and a mature deployment story.

**Pros:**
- Single codebase for all platforms — phones, tablets, desktops
- No app store approval process, no 15–30% revenue cut from Apple/Google
- Instant updates — push a deploy and everyone gets the new version
- Massive React ecosystem for hiring and libraries
- Next.js API routes can serve as your backend initially, reducing infrastructure
- Works well with Vercel for easy deployment and scaling
- WhatsApp share links work natively on the web (no deep-linking headaches)

**Cons:**
- No push notifications on iOS until the user installs the PWA (and iOS PWA support is still imperfect)
- Camera/photo access works but feels slightly less polished than native
- Can't appear in the App Store or Google Play (unless you wrap it — see Capacitor below)
- Some users don't understand "add to home screen" — discovery is harder without an app store listing
- Offline support requires careful service worker management

**Best for:** Fast launch, lean team, validating the concept before investing in native apps.

### Option B: React Native (with Expo)

**What it is:** Write JavaScript/TypeScript, ship native iOS and Android apps. Expo provides a managed workflow that handles builds, updates, and native module configuration.

**Pros:**
- True native apps in both app stores — better discoverability and user trust
- Full access to push notifications, camera, photo library, and device features
- One codebase, two platforms (mostly — ~85–90% code sharing is realistic)
- Expo's over-the-air updates let you push changes without app store review
- Large community, battle-tested by companies like Shopify, Discord, and Bloomberg
- Can share business logic with a React web app if you later add a web version
- React Native's "New Architecture" (Fabric + TurboModules) has matured significantly — performance is now close to native

**Cons:**
- Still need to deal with app store review processes, guidelines, and the 15–30% cut on subscriptions
- Build times and native module debugging can be painful
- Some libraries lag behind native equivalents (e.g., advanced camera features)
- Need Mac hardware for iOS builds (Expo's cloud builds help but add cost)
- Navigation and gestures, while good, don't feel quite as fluid as fully native

**Best for:** Team committed to mobile-first, wants app store presence, plans to use device features heavily (camera for fridge photos, push notifications for defrost reminders).

### Option C: Flutter

**What it is:** Google's UI toolkit using the Dart language. Compiles to native ARM code for iOS and Android, and also supports web and desktop from a single codebase.

**Pros:**
- Excellent performance — compiles to native code, smooth animations
- Beautiful, highly customizable UI with the widget system
- True single codebase for mobile, web, and desktop
- Hot reload makes development fast and iterative
- Strong support for complex UI (meal calendars, drag-and-drop, recipe cards)
- Growing ecosystem and Google's continued investment

**Cons:**
- Dart is a niche language — smaller hiring pool than JavaScript/TypeScript
- Flutter web is functional but not as mature or performant as React-based web apps
- Ecosystem is younger — fewer third-party packages, and some are less maintained
- Larger app binary size compared to React Native
- If you ever need to share code with a web team or hire web-focused developers, Dart creates a barrier
- Google's track record of abandoning projects makes some teams nervous (though Flutter investment remains strong as of 2026)

**Best for:** Small team that values UI polish and wants one codebase to eventually cover mobile + web + desktop.

### Option D: Hybrid — PWA Now, Native Later (Recommended)

**What it is:** Launch as a PWA with React/Next.js to validate the product. Once you have traction and revenue, wrap the web app with Capacitor (or rebuild key screens natively) to get into app stores.

**Pros:**
- Fastest path to launch — skip app store setup entirely for v1
- Validates the concept with real users before committing to native development costs
- Capacitor can wrap your existing web app into a native shell with access to push notifications, camera, and other native APIs
- You can progressively "go native" — replace individual screens with native implementations as needed
- WhatsApp export, recipe URL import, and AI features all work great on the web from day one
- Keeps your options open — if the product pivots, you haven't over-invested in native infrastructure

**Cons:**
- Capacitor-wrapped apps can feel slightly less native than true React Native or Flutter apps
- Two-step process means some rework when you eventually add native capabilities
- Users who expect an app store listing from day one may be harder to acquire initially

**Best for:** Founders who want to validate fast, keep costs low, and invest in native only when the product-market fit is proven.

### Tech Stack Summary

| Factor | PWA (React) | React Native | Flutter | Hybrid (Rec.) |
|--------|-------------|--------------|---------|----------------|
| Time to launch | Fastest | Medium | Medium | Fast |
| App store presence | No (unless wrapped) | Yes | Yes | Later |
| Push notifications | Limited on iOS | Full | Full | Full (with Capacitor) |
| Camera/photo access | Good | Excellent | Excellent | Good → Excellent |
| Hiring pool | Largest | Large | Smaller | Largest |
| Code sharing (web) | Native | Partial | Partial | Native |
| Cost to build v1 | Lowest | Medium | Medium | Low |
| WhatsApp integration | Trivial | Easy | Easy | Trivial |
| Offline support | Manual (service workers) | Good | Good | Manual → Good |

### My Recommendation

Go with **Option D (Hybrid)** — launch a PWA with Next.js to get the product in front of working parents as fast as possible. Your initial killer features (AI meal plans, recipe import, grocery list export to WhatsApp, household profiles) all work perfectly on the web. The features that truly need native capabilities (fridge photo recognition, defrost push notifications) can come in v2 when you wrap with Capacitor or invest in React Native for key flows.

This lets you spend your early effort on **getting the product right** rather than fighting app store reviews and native build pipelines.

---

*This is a living document. Let's refine it together — tell me which sections to expand, challenge, or rethink.*

---

## 11. What Has Been Built (v1 Progress — as of March 2026)

This section tracks the actual implementation status of the MVP features described above.

### Tech Stack Chosen
**Next.js 14 (App Router) + Supabase + Tailwind CSS** — aligned with the Hybrid PWA recommendation. The app is deployed as a web-first, mobile-responsive application. No native wrapper yet.

- **Frontend:** Next.js 14 with the App Router, TypeScript, Tailwind CSS
- **Backend/DB:** Supabase (PostgreSQL, Auth, Row Level Security)
- **AI:** Claude (Anthropic) for meal plan generation and meal swapping
- **Auth:** Supabase Auth with Google OAuth (one-tap sign-in, no email/password)
- **Hosting:** Vercel-compatible Next.js app

---

### Built Features

**Authentication (Phase 1 — ✅ Complete)**
- Google single-tap OAuth via Supabase Auth
- Auth callback handling with session persistence
- Protected routes: unauthenticated users are redirected to sign-in

**Onboarding Flow (Phase 1 — ✅ Complete)**
- 3-step progressive household setup: "Your family" → "Dietary needs" → "Dislikes"
- Family members added as name + type chips (Adult / Kid) — tap to add rows
- Dietary restriction grid: 10 options including nut-free, gluten-free, dairy-free, vegetarian, vegan, halal, kosher, no-seafood, no-pork, low-carb — tap to select
- Food dislikes: 12 quick-tap suggestions (mushrooms, spicy food, shellfish, etc.) + free-text custom input
- All steps skippable; progress bar visible at top
- Household profile saved to Supabase `household_profiles` table
- On completion → immediately redirected to dashboard where the first plan is generated

**AI Dinner Plan Generation (Phase 1 — ✅ Complete)**
- AI generates a 5-day (Mon–Fri) dinner plan on first login or on demand
- Plan is personalized using household profile: family members, dietary restrictions, and dislikes
- Each meal card shows: meal name, short description, emoji, cook time, difficulty, and ingredients list
- Plan stored in Supabase `meal_plans` table with `week_start` field for weekly tracking
- Week-of-Monday logic: looking up an existing plan for the current week on load, avoiding regeneration

**Individual Meal Swapping (Phase 2 — ✅ Complete)**
- "Swap" button on each meal card calls `/api/swap-meal`
- AI is given the full current plan as context so the replacement is intentionally different
- Swapped meal replaces the card in-place; the rest of the plan is unchanged
- Loading spinner per-card during swap

**Grocery List (Phase 2 — ✅ Complete)**
- Auto-generated from the current meal plan's ingredients
- Displayed as a categorized checklist (produce, protein, dairy, pantry, etc.)
- In-app check-off with visual strikethrough
- Toggle between Plan view and Grocery List view via tab bar at top of dashboard
- `GroceryList` component is a standalone module

**Plan Sharing (Phase 2 — ✅ Complete)**
- Each plan gets a unique `share_token` (UUID) stored in Supabase
- "Share Plan" button on the dashboard: uses native Web Share API on mobile (share sheet), falls back to clipboard copy on desktop
- Shared link resolves to `/plan/[token]` — a public, read-only view of the plan
- `SharedPlanView` component renders the plan without requiring login
- Toast notification confirms link was copied
- Share token is regenerated each time a new plan is generated

---

### What's Still Ahead

Based on the MVP plan, the following items from the original roadmap have **not yet been built**:

| Feature | Status | Notes |
|---------|--------|-------|
| Recipe URL import | Not started | Phase 4 — post-activation feature |
| Keep / Discard / Tweak ratings | Not started | Phase 3 — needed to complete activation loop |
| Post-dinner rating prompts (notifications) | Not started | Phase 3 |
| Pantry inventory (receipt scan, email import) | Not started | Phase 4 |
| Progressive feature disclosure triggers | Not started | Phase 4 |
| WhatsApp-specific grocery export | Not started | Current share uses generic Web Share API |
| Per-member dietary profiles | Partial | Restrictions are household-level, not per-member yet |
| Breakfast / lunch / snack plans | Not started | v2 |
| Analytics / activation funnel tracking | Not started | Phase 5 |

---

### Key Design Decisions Made During Build

**Recipe content format:** Each AI-generated meal card is structured JSON: `{ day, name, description, emoji, cookTime, difficulty, ingredients[] }`. This enables the grocery list to be auto-derived from ingredients without a separate AI call.

**No recipe library yet:** The app currently generates recipes on-the-fly via AI rather than pulling from a curated library. This lets us launch without content ops overhead and still produce personalized, varied plans. A library/import system can overlay later.

**Shared plan is public:** The `/plan/[token]` route does not require authentication. This was intentional — it lets the non-planning partner in a household view the plan from a WhatsApp link without needing an account.

**Week-based plan storage:** Plans are keyed by `(user_id, week_start)`. Generating a new plan within the same week overwrites the existing one. This keeps the data model simple and prevents orphaned plans from accumulating.
