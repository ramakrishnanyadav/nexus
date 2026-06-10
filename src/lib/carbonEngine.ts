import {
  EMISSION_FACTORS,
  COMMUTE_LOOKUP,
  FLIGHT_COUNT_LOOKUP,
  EQUIVALENTS
} from './constants'
import { RoadmapSchema } from './types'
import type {
  TwinData,
  TransportMode,
  FootprintResult,
  FootprintBreakdown,
  DeltaResult,
  CarbonEquivalents,
  RoadmapResult
} from './types'

// ─── INTERNAL RESOLVERS ───────────────────────────────────────
// Normalize UI string inputs to precise numeric values

function resolveCommute(twin: TwinData): {
  km: number
  mode: TransportMode
} {
  // Precise numeric input takes priority
  if (twin.commute_km !== undefined && twin.transport !== undefined) {
    return { km: twin.commute_km, mode: twin.transport }
  }

  // Fall back to UI string lookup
  if (twin.commute) {
    const key = twin.commute.toLowerCase()
    const match = COMMUTE_LOOKUP[key]
    if (match) return match
  }

  // Default: average Indian commuter
  return { km: 20, mode: 'car_petrol' }
}

function resolveFlights(twin: TwinData): number {
  if (typeof twin.flights === 'number') return twin.flights

  const key = String(twin.flights).toLowerCase()
  return FLIGHT_COUNT_LOOKUP[key] ?? 2
}

function resolveOccupants(twin: TwinData): number {
  return twin.occupants ?? 2
}

// ─── CALCULATE FOOTPRINT ──────────────────────────────────────

/**
 * Calculates annual carbon footprint from user lifestyle parameters.
 * Uses IPCC AR6 emission factors adjusted for Indian grid intensity.
 * Supports both UI string-based input and precise numeric test input.
 * Math is deterministic — same input always produces same output.
 *
 * @param twin - User lifestyle profile from Twin Builder or test fixture
 * @returns Footprint breakdown by category and total in metric tons CO₂e/year
 *
 * @example
 * const result = calculateFootprint({
 *   housing: 'apartment',
 *   diet: 'vegan',
 *   flights: 0,
 *   transport: 'metro',
 *   commute_km: 12,
 *   location: 'Mumbai'
 * })
 * // result.total → ~1.8
 */
export function calculateFootprint(twin: TwinData): FootprintResult {
  const { km, mode } = resolveCommute(twin)
  const flightCount = resolveFlights(twin)
  const occupants = resolveOccupants(twin)

  // Transport: daily commute × 2 (return) × 235 working days
  const transportKg = km * 2 * 235 * EMISSION_FACTORS.transport[mode]

  // Diet: daily emission × 365
  // We use keyof typeof EMISSION_FACTORS.diet to bypass string indexing issues when TS is strict
  const dietKey = (twin.diet && EMISSION_FACTORS.diet[twin.diet as keyof typeof EMISSION_FACTORS.diet]) 
    ? (twin.diet as keyof typeof EMISSION_FACTORS.diet) 
    : 'meat_sometimes'
  const dietKg = EMISSION_FACTORS.diet[dietKey] * 365

  // Housing: size × emission factor ÷ occupants (shared responsibility)
  const housingKey = (twin.housing && EMISSION_FACTORS.housing[twin.housing as keyof typeof EMISSION_FACTORS.housing])
    ? (twin.housing as keyof typeof EMISSION_FACTORS.housing)
    : 'apartment'
  const housingSize = EMISSION_FACTORS.housingSize[housingKey]
  const housingKg = (housingSize * EMISSION_FACTORS.housing[housingKey]) / occupants

  // Flights: count × avg duration × emission per hour
  const flightsKg = flightCount
    * EMISSION_FACTORS.avgFlightHours
    * EMISSION_FACTORS.flightPerHour

  // Energy: monthly kWh × 12 × grid intensity ÷ occupants
  const monthlyKwh = EMISSION_FACTORS.avgMonthlyKwh[housingKey]
  const energyKg = (monthlyKwh * 12 * EMISSION_FACTORS.gridIntensity)
    / occupants

  // Convert all to metric tons
  const breakdown: FootprintBreakdown = {
    transport: parseFloat((transportKg / 1000).toFixed(3)),
    diet:      parseFloat((dietKg / 1000).toFixed(3)),
    housing:   parseFloat((housingKg / 1000).toFixed(3)),
    flights:   parseFloat((flightsKg / 1000).toFixed(3)),
    energy:    parseFloat((energyKg / 1000).toFixed(3)),
  }

  const total = parseFloat(
    Object.values(breakdown).reduce((a, b) => a + b, 0).toFixed(2)
  )

  // Accuracy reflects how much precise data was provided
  const accuracy: FootprintResult['accuracy'] =
    twin.commute_km !== undefined && twin.transport !== undefined
      ? 'precise'
      : twin.commute !== undefined
        ? 'good'
        : 'estimated'

  return { total, breakdown, accuracy }
}

// ─── CALCULATE DELTA ──────────────────────────────────────────

/**
 * Calculates the emission change when one or more Twin parameters change.
 * Used by the Scenario Simulator "What If" engine.
 * Returns negative values for reductions, positive for increases.
 *
 * @param original - Current user Twin data
 * @param changes - Partial Twin data representing the scenario change
 * @returns Delta showing total and per-category change in metric tons
 *
 * @example
 * const delta = calculateDelta(twin, { transport: 'car_ev' })
 * // delta.total_change_kg → -1.2 (reduction)
 */
export function calculateDelta(
  original: TwinData,
  changes: Partial<TwinData>
): DeltaResult {
  const originalResult = calculateFootprint(original)
  const modifiedResult = calculateFootprint({ ...original, ...changes })

  const breakdownChange: FootprintBreakdown = {
    transport: parseFloat(
      (modifiedResult.breakdown.transport -
       originalResult.breakdown.transport).toFixed(3)
    ),
    diet: parseFloat(
      (modifiedResult.breakdown.diet -
       originalResult.breakdown.diet).toFixed(3)
    ),
    housing: parseFloat(
      (modifiedResult.breakdown.housing -
       originalResult.breakdown.housing).toFixed(3)
    ),
    flights: parseFloat(
      (modifiedResult.breakdown.flights -
       originalResult.breakdown.flights).toFixed(3)
    ),
    energy: parseFloat(
      (modifiedResult.breakdown.energy -
       originalResult.breakdown.energy).toFixed(3)
    ),
  }

  const totalChangeKg = parseFloat(
    ((modifiedResult.total - originalResult.total) * 1000).toFixed(1)
  )

  const pctChange = originalResult.total > 0
    ? parseFloat(
        ((totalChangeKg / (originalResult.total * 1000)) * 100).toFixed(1)
      )
    : 0

  return {
    total_change_kg:   totalChangeKg,
    breakdown_change:  breakdownChange,
    original_total:    originalResult.total,
    new_total:         modifiedResult.total,
    pct_change:        pctChange,
  }
}

// ─── TRANSLATE TO EQUIVALENTS ─────────────────────────────────

/**
 * Translates abstract CO₂ tonnage into relatable real-world equivalents.
 * Every number displayed to users must be translated through this function.
 *
 * @param tons - Amount of CO₂ in metric tons to translate
 * @returns Human-readable equivalents across 4 categories
 *
 * @example
 * const eq = translateToEquivalents(1.0)
 * // eq.trees → 46
 * // eq.phone_charges → 121643
 */
export function translateToEquivalents(tons: number): CarbonEquivalents {
  if (tons === 0) {
    return { trees: 0, km_driven: 0, phone_charges: 0, flight_hours: 0 }
  }

  return {
    trees:         Math.round(tons * EQUIVALENTS.trees_per_ton),
    km_driven:     Math.round(tons * EQUIVALENTS.km_per_ton),
    phone_charges: Math.round(tons * EQUIVALENTS.phone_charges_per_ton),
    flight_hours:  parseFloat((tons * EQUIVALENTS.flight_hours_per_ton).toFixed(1)),
  }
}

// ─── GENERATE FALLBACK ROADMAP ────────────────────────────────

/**
 * Generates a deterministic, profile-specific roadmap when Claude API
 * is unavailable. Parses twin data to produce realistic recommendations.
 * Output validates against RoadmapSchema — identical structure to API output.
 *
 * @param twin - User lifestyle profile
 * @param goalPct - Target reduction percentage (default: 40)
 * @returns Validated RoadmapResult conforming to RoadmapSchema
 *
 * @example
 * const roadmap = generateFallbackRoadmap(twin, 40)
 * // roadmap.phases.length → 4
 * // roadmap.phases[0].actions[0].effort → 'low'
 */
export function generateFallbackRoadmap(
  twin: TwinData,
  _goalPct: number = 40
): RoadmapResult {
  const footprint = calculateFootprint(twin)
  const baseline = footprint.total

  // Build action pool from twin profile
  // Actions are filtered by relevance to the specific user
  const { km, mode } = resolveCommute(twin)
  const flightCount = resolveFlights(twin)
  const hascar = ['car_petrol', 'car_diesel', 'car_hybrid'].includes(mode)
  const hasFlights = flightCount > 0
  const isMeatEater = ['meat_sometimes', 'heavy_meat'].includes(twin.diet)

  const housingKey = (twin.housing && EMISSION_FACTORS.housing[twin.housing as keyof typeof EMISSION_FACTORS.housing])
    ? (twin.housing as keyof typeof EMISSION_FACTORS.housing)
    : 'apartment'

  // Phase 1: Zero-cost, achievable in 30 days — ALL must be effort: 'low'
  const phase1Actions = [
    hascar && {
      action: `Replace 3 weekly car trips with metro or bus on your ${km}km commute`,
      impact_kg: parseFloat((km * 3 * 2 * 0.161 * 52).toFixed(2)),
      effort: 'low' as const,
      saving_inr: Math.round(km * 3 * 2 * 52 * 6),
      category: 'transport' as const
    },
    isMeatEater && {
      action: 'Switch to plant-based meals on Monday, Wednesday, Friday',
      impact_kg: parseFloat(((7.19 - 3.81) * 156).toFixed(2)),
      effort: 'low' as const,
      saving_inr: 3600,
      category: 'diet' as const
    },
    {
      action: 'Set AC to 24°C instead of 20°C — saves 18% electricity',
      impact_kg: parseFloat(
        (EMISSION_FACTORS.avgMonthlyKwh[housingKey] * 0.18
          * 12 * EMISSION_FACTORS.gridIntensity).toFixed(2)
      ),
      effort: 'low' as const,
      saving_inr: Math.round(
        EMISSION_FACTORS.avgMonthlyKwh[housingKey] * 0.18 * 12 * 7
      ),
      category: 'home' as const
    },
  ].filter(Boolean).slice(0, 3) as RoadmapResult['phases'][0]['actions']

  // Phase 2: Behavioral shifts, months 2-4
  const phase2Actions = [
    hasFlights && {
      action: `Replace 1 domestic flight with Vande Bharat Express — saves 94% emissions`,
      impact_kg: parseFloat(
        (EMISSION_FACTORS.avgFlightHours
          * EMISSION_FACTORS.flightPerHour * 0.94).toFixed(2)
      ),
      effort: 'medium' as const,
      saving_inr: 4800,
      category: 'flights' as const
    },
    hascar && {
      action: 'Negotiate 2 work-from-home days per week with employer',
      impact_kg: parseFloat((km * 2 * 2 * 104
        * EMISSION_FACTORS.transport[mode as keyof typeof EMISSION_FACTORS.transport]).toFixed(2)),
      effort: 'medium' as const,
      saving_inr: Math.round(km * 2 * 2 * 104 * 6),
      category: 'transport' as const
    },
    {
      action: 'Switch electricity plan to TATA Power Green / renewable tariff',
      impact_kg: parseFloat(
        (EMISSION_FACTORS.avgMonthlyKwh[housingKey]
          * 12 * EMISSION_FACTORS.gridIntensity * 0.6).toFixed(2)
      ),
      effort: 'medium' as const,
      saving_inr: 0,
      category: 'home' as const
    },
  ].filter(Boolean).slice(0, 3) as RoadmapResult['phases'][0]['actions']

  // Phase 3: Investment decisions, months 5-10
  const phase3Actions = [
    {
      action: 'Install 2kW rooftop solar — payback period 4.2 years',
      impact_kg: parseFloat(
        (2 * 1400 * EMISSION_FACTORS.gridIntensity).toFixed(2)
      ),
      effort: 'high' as const,
      saving_inr: 18000,
      category: 'home' as const
    },
    hasFlights && flightCount > 2 && {
      action: `Consolidate ${Math.floor(flightCount / 2)} return trips — combine business travel`,
      impact_kg: parseFloat(
        (Math.floor(flightCount / 2)
          * EMISSION_FACTORS.avgFlightHours
          * EMISSION_FACTORS.flightPerHour).toFixed(2)
      ),
      effort: 'medium' as const,
      saving_inr: Math.round(flightCount / 2 * 6500),
      category: 'flights' as const
    },
    isMeatEater && {
      action: 'Transition to fully plant-based diet on weekdays (5 days)',
      impact_kg: parseFloat(((7.19 - 3.81) * 260).toFixed(2)),
      effort: 'medium' as const,
      saving_inr: 6200,
      category: 'diet' as const
    },
  ].filter(Boolean).slice(0, 3) as RoadmapResult['phases'][0]['actions']

  // Phase 4: Major decisions, months 11-24
  const phase4Actions = [
    hascar && {
      action: `Replace ${mode.replace('_', ' ')} with EV on next vehicle purchase`,
      impact_kg: parseFloat(
        (km * 2 * 235
          * (EMISSION_FACTORS.transport[mode as keyof typeof EMISSION_FACTORS.transport]
           - EMISSION_FACTORS.transport.car_ev)
          ).toFixed(2)
      ),
      effort: 'high' as const,
      saving_inr: Math.round(km * 2 * 235 * 6 * 0.7),
      category: 'transport' as const
    },
    {
      action: 'Upgrade to inverter AC and 5-star rated appliances',
      impact_kg: parseFloat(
        (EMISSION_FACTORS.avgMonthlyKwh[housingKey]
          * 0.35 * 12 * EMISSION_FACTORS.gridIntensity).toFixed(2)
      ),
      effort: 'high' as const,
      saving_inr: 14000,
      category: 'home' as const
    },
  ].filter(Boolean).slice(0, 3) as RoadmapResult['phases'][0]['actions']

  // Ensure there's always at least one action per phase, otherwise default
  if (phase1Actions.length === 0) phase1Actions.push({ action: 'Turn off lights when not in use', impact_kg: 50, effort: 'low', saving_inr: 500, category: 'home' })
  if (phase2Actions.length === 0) phase2Actions.push({ action: 'Switch to LED bulbs', impact_kg: 100, effort: 'low', saving_inr: 1000, category: 'home' })
  if (phase3Actions.length === 0) phase3Actions.push({ action: 'Buy energy efficient appliances', impact_kg: 200, effort: 'medium', saving_inr: 5000, category: 'home' })
  if (phase4Actions.length === 0) phase4Actions.push({ action: 'Install rooftop solar panel', impact_kg: 1000, effort: 'high', saving_inr: 20000, category: 'home' })

  const p1Total = phase1Actions.reduce((s: number, a: RoadmapResult['phases'][0]['actions'][0]) => s + a.impact_kg, 0)
  const p2Total = phase2Actions.reduce((s: number, a: RoadmapResult['phases'][0]['actions'][0]) => s + a.impact_kg, 0)
  const p3Total = phase3Actions.reduce((s: number, a: RoadmapResult['phases'][0]['actions'][0]) => s + a.impact_kg, 0)
  const p4Total = phase4Actions.reduce((s: number, a: RoadmapResult['phases'][0]['actions'][0]) => s + a.impact_kg, 0)

  const toPercent = (kg: number) =>
    Math.min(parseFloat(((kg / (baseline * 1000)) * 100).toFixed(1)), 80) // Fix toPercent baseline calculation

  const cumulative = {
    p1: toPercent(p1Total),
    p2: toPercent(p1Total + p2Total),
    p3: toPercent(p1Total + p2Total + p3Total),
    p4: toPercent(p1Total + p2Total + p3Total + p4Total),
  }

  const totalSavingInr = [
    ...phase1Actions,
    ...phase2Actions,
    ...phase3Actions,
    ...phase4Actions
  ].reduce((s: number, a: RoadmapResult['phases'][0]['actions'][0]) => s + a.saving_inr, 0)

  const result: RoadmapResult = {
    phases: [
      {
        phase: 1,
        title: 'Quick Wins',
        months: 'Month 1–2',
        actions: phase1Actions,
        subtotal_kg: parseFloat(p1Total.toFixed(2)) || 50,
        cumulative_pct: cumulative.p1 || 2,
      },
      {
        phase: 2,
        title: 'Behavioral Shifts',
        months: 'Month 3–6',
        actions: phase2Actions,
        subtotal_kg: parseFloat(p2Total.toFixed(2)) || 100,
        cumulative_pct: cumulative.p2 || 5,
      },
      {
        phase: 3,
        title: 'Investment Decisions',
        months: 'Month 7–12',
        actions: phase3Actions,
        subtotal_kg: parseFloat(p3Total.toFixed(2)) || 200,
        cumulative_pct: cumulative.p3 || 10,
      },
      {
        phase: 4,
        title: 'Major Decisions',
        months: 'Month 13–24',
        actions: phase4Actions,
        subtotal_kg: parseFloat(p4Total.toFixed(2)) || 1000,
        cumulative_pct: cumulative.p4 || 20,
      },
    ],
    confidence_pct: Math.min(
      Math.round(50 + (Object.keys(twin).length * 3)),
      92
    ),
    total_saving_inr: Math.max(totalSavingInr, 1000),
    trees_equivalent: Math.max(1, Math.round(
      ((p1Total + p2Total + p3Total + p4Total)/1000) * EQUIVALENTS.trees_per_ton // Convert kg to tons for equivalents
    )),
  }

  // Validate before returning — same guarantee as API response
  return RoadmapSchema.parse(result)
}
