import { z } from 'zod'

// ─── TWIN DATA ────────────────────────────────────────────────
// Supports both UI string-based input and test numeric input
// Optional precise fields override string fields when present

export interface TwinData {
  // UI schema — string-based selections from TwinBuilderView
  housing: 'apartment' | 'independent_house' | 'shared_accommodation' | string
  diet: 'vegan' | 'vegetarian' | 'meat_sometimes' | 'heavy_meat' | string
  flights: 0 | 1 | 2 | 4 | 6 | 10 | 12 | string
  location: string

  // UI commute — string description from dropdown
  commute?: string

  // Precise numeric fields — used by tests and advanced calculation
  // When present, these take priority over string-based equivalents
  commute_km?: number
  transport?: TransportMode
  occupants?: number
}

export type TransportMode =
  | 'car_petrol'
  | 'car_diesel'
  | 'car_ev'
  | 'car_hybrid'
  | 'metro'
  | 'bus'
  | 'cycling'
  | 'walking'
  | 'motorbike'
  | 'auto_rickshaw'

// ─── FOOTPRINT RESULT ─────────────────────────────────────────

export interface FootprintBreakdown {
  transport: number
  diet: number
  housing: number
  flights: number
  energy: number
}

export interface FootprintResult {
  total: number
  breakdown: FootprintBreakdown
  accuracy: 'estimated' | 'good' | 'precise'
}

// ─── DELTA RESULT ─────────────────────────────────────────────

export interface DeltaResult {
  total_change_kg: number
  breakdown_change: FootprintBreakdown
  original_total: number
  new_total: number
  pct_change: number
}

// ─── EQUIVALENTS ──────────────────────────────────────────────

export interface CarbonEquivalents {
  trees: number
  km_driven: number
  phone_charges: number
  flight_hours: number
}

// ─── ROADMAP ──────────────────────────────────────────────────

export const RoadmapActionSchema = z.object({
  action: z.string().min(1),
  impact_kg: z.number().positive(),
  effort: z.enum(['low', 'medium', 'high']),
  saving_inr: z.number().nonnegative(),
  category: z.enum(['transport', 'diet', 'home', 'flights', 'shopping'])
})

export const RoadmapPhaseSchema = z.object({
  phase: z.number().int().min(1).max(4),
  title: z.string().min(1),
  months: z.string(),
  actions: z.array(RoadmapActionSchema).min(1).max(3),
  subtotal_kg: z.number().positive(),
  cumulative_pct: z.number().min(0).max(100)
})

export const RoadmapSchema = z.object({
  phases: z.array(RoadmapPhaseSchema).length(4),
  confidence_pct: z.number().min(50).max(99),
  total_saving_inr: z.number().positive(),
  trees_equivalent: z.number().positive()
})

export type RoadmapAction = z.infer<typeof RoadmapActionSchema>
export type RoadmapPhase = z.infer<typeof RoadmapPhaseSchema>
export type RoadmapResult = z.infer<typeof RoadmapSchema>
