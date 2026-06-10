import { describe, test, expect } from 'vitest'
import {
  calculateFootprint,
  calculateDelta,
  generateFallbackRoadmap,
  translateToEquivalents
} from './carbonEngine'
import { RoadmapSchema } from './types'
import type { TwinData } from './types'

// ─── FIXTURES ────────────────────────────────────────────────

const veganCyclist: TwinData = {
  housing: 'apartment',
  occupants: 3,
  commute_km: 8,
  transport: 'cycling',
  diet: 'vegan',
  flights: 0,
  location: 'Mumbai'
}

const heavyEmitter: TwinData = {
  housing: 'independent_house',
  occupants: 1,
  commute_km: 60,
  transport: 'car_petrol',
  diet: 'heavy_meat',
  flights: 10,
  location: 'Mumbai'
}

const averageUser: TwinData = {
  housing: 'apartment',
  occupants: 2,
  commute_km: 25,
  transport: 'car_petrol',
  diet: 'meat_sometimes',
  flights: 2,
  location: 'Mumbai'
}

// ─── calculateFootprint ───────────────────────────────────────

describe('calculateFootprint — correctness', () => {

  test('vegan cyclist emits less than heavy emitter', () => {
    expect(calculateFootprint(veganCyclist).total)
      .toBeLessThan(calculateFootprint(heavyEmitter).total)
  })

  test('returns all 5 breakdown categories', () => {
    const result = calculateFootprint(averageUser)
    expect(result.breakdown).toHaveProperty('transport')
    expect(result.breakdown).toHaveProperty('diet')
    expect(result.breakdown).toHaveProperty('housing')
    expect(result.breakdown).toHaveProperty('flights')
    expect(result.breakdown).toHaveProperty('energy')
  })

  test('total equals sum of breakdown categories', () => {
    const result = calculateFootprint(averageUser)
    const sum = parseFloat(
      Object.values(result.breakdown).reduce((a, b) => a + b, 0).toFixed(2)
    )
    expect(result.total).toBeCloseTo(sum, 1)
  })

  test('more flights = higher footprint', () => {
    const low = calculateFootprint({ ...averageUser, flights: 0 })
    const high = calculateFootprint({ ...averageUser, flights: 8 })
    expect(high.total).toBeGreaterThan(low.total)
  })

  test('longer commute = higher transport emission', () => {
    const short = calculateFootprint({ ...averageUser, commute_km: 5 })
    const long  = calculateFootprint({ ...averageUser, commute_km: 80 })
    expect(long.breakdown.transport).toBeGreaterThan(short.breakdown.transport)
  })

  test('EV commute emits less than petrol commute', () => {
    const petrol = calculateFootprint({ ...averageUser, transport: 'car_petrol' })
    const ev     = calculateFootprint({ ...averageUser, transport: 'car_ev' })
    expect(ev.breakdown.transport).toBeLessThan(petrol.breakdown.transport)
  })

  test('independent house emits more housing than apartment', () => {
    const apt   = calculateFootprint({ ...averageUser, housing: 'apartment' })
    const house = calculateFootprint({ ...averageUser, housing: 'independent_house' })
    expect(house.breakdown.housing).toBeGreaterThan(apt.breakdown.housing)
  })

  test('footprint is deterministic', () => {
    expect(calculateFootprint(averageUser).total)
      .toBe(calculateFootprint(averageUser).total)
  })

  test('all numeric outputs are finite', () => {
    const result = calculateFootprint(averageUser)
    expect(Number.isFinite(result.total)).toBe(true)
    Object.values(result.breakdown).forEach(val => {
      expect(Number.isFinite(val)).toBe(true)
    })
  })

})

describe('calculateFootprint — boundaries', () => {

  test('minimum profile returns positive footprint under 4 tons', () => {
    const result = calculateFootprint(veganCyclist)
    expect(result.total).toBeGreaterThan(0)
    expect(result.total).toBeLessThan(4)
  })

  test('maximum profile stays under 40 tons', () => {
    const result = calculateFootprint(heavyEmitter)
    expect(result.total).toBeGreaterThan(8)
    expect(result.total).toBeLessThan(40)
  })

  test('zero commute with cycling = zero transport emission', () => {
    const result = calculateFootprint({
      ...averageUser, commute_km: 0, transport: 'cycling'
    })
    expect(result.breakdown.transport).toBe(0)
  })

  test('UI string-based commute resolves correctly', () => {
    const uiTwin: TwinData = {
      housing: 'apartment',
      diet: 'meat_sometimes',
      flights: '1–2 flights',
      commute: '15–30km',
      location: 'Mumbai'
    }
    const result = calculateFootprint(uiTwin)
    expect(result.total).toBeGreaterThan(0)
    expect(result.accuracy).toBe('good')
  })

})

// ─── calculateDelta ───────────────────────────────────────────

describe('calculateDelta', () => {

  test('switching petrol to EV produces negative delta', () => {
    const delta = calculateDelta(averageUser, { transport: 'car_ev' })
    expect(delta.total_change_kg).toBeLessThan(0)
  })

  test('going vegan produces negative diet delta', () => {
    const delta = calculateDelta(averageUser, { diet: 'vegan' })
    expect(delta.breakdown_change.diet).toBeLessThan(0)
  })

  test('adding flights produces positive delta', () => {
    const delta = calculateDelta(averageUser, { flights: 8 })
    expect(delta.total_change_kg).toBeGreaterThan(0)
  })

  test('no changes produces zero delta', () => {
    const delta = calculateDelta(averageUser, {})
    expect(delta.total_change_kg).toBe(0)
  })

  test('pct_change is proportional to total_change_kg', () => {
    const delta = calculateDelta(averageUser, { transport: 'car_ev' })
    expect(Math.abs(delta.pct_change)).toBeGreaterThan(0)
    expect(Math.abs(delta.pct_change)).toBeLessThan(100)
  })

})

// ─── translateToEquivalents ───────────────────────────────────

describe('translateToEquivalents', () => {

  test('1 ton = approximately 46 trees', () => {
    const result = translateToEquivalents(1.0)
    expect(result.trees).toBeCloseTo(46, 0)
  })

  test('returns all 4 equivalent types', () => {
    const result = translateToEquivalents(2.5)
    expect(result).toHaveProperty('trees')
    expect(result).toHaveProperty('km_driven')
    expect(result).toHaveProperty('phone_charges')
    expect(result).toHaveProperty('flight_hours')
  })

  test('larger reduction = larger equivalents', () => {
    expect(translateToEquivalents(5).trees)
      .toBeGreaterThan(translateToEquivalents(1).trees)
  })

  test('zero input returns all zeros', () => {
    const result = translateToEquivalents(0)
    expect(result.trees).toBe(0)
    expect(result.km_driven).toBe(0)
    expect(result.phone_charges).toBe(0)
    expect(result.flight_hours).toBe(0)
  })

})

// ─── generateFallbackRoadmap ──────────────────────────────────

describe('generateFallbackRoadmap', () => {

  test('returns exactly 4 phases', () => {
    expect(generateFallbackRoadmap(averageUser, 40).phases).toHaveLength(4)
  })

  test('phase numbers are sequential 1 through 4', () => {
    generateFallbackRoadmap(averageUser, 40).phases.forEach((p, i) => {
      expect(p.phase).toBe(i + 1)
    })
  })

  test('cumulative_pct increases or remains equal each phase', () => {
    const phases = generateFallbackRoadmap(averageUser, 40).phases
    for (let i = 1; i < phases.length; i++) {
      expect(phases[i].cumulative_pct)
        .toBeGreaterThanOrEqual(phases[i - 1].cumulative_pct)
    }
  })

  test('Phase 1 contains only low-effort actions', () => {
    generateFallbackRoadmap(averageUser, 40).phases[0].actions.forEach(a => {
      expect(a.effort).toBe('low')
    })
  })

  test('final phase meets goal without exceeding 80%', () => {
    const phases = generateFallbackRoadmap(heavyEmitter, 40).phases
    const final = phases[phases.length - 1]
    expect(final.cumulative_pct).toBeGreaterThanOrEqual(38)
    expect(final.cumulative_pct).toBeLessThanOrEqual(80)
  })

  test('each action has all required fields with valid values', () => {
    generateFallbackRoadmap(averageUser, 40).phases.forEach(phase => {
      phase.actions.forEach(action => {
        expect(action.action.length).toBeGreaterThan(20)
        expect(action.impact_kg).toBeGreaterThan(0)
        expect(action.saving_inr).toBeGreaterThanOrEqual(0)
        expect(['low','medium','high']).toContain(action.effort)
        expect(['transport','diet','home','flights','shopping'])
          .toContain(action.category)
      })
    })
  })

  test('validates against RoadmapSchema without throwing', () => {
    const roadmap = generateFallbackRoadmap(averageUser, 40)
    expect(() => RoadmapSchema.parse(roadmap)).not.toThrow()
  })

  test('min and max profiles both produce valid roadmaps', () => {
    expect(() => RoadmapSchema.parse(
      generateFallbackRoadmap(veganCyclist, 40)
    )).not.toThrow()

    expect(() => RoadmapSchema.parse(
      generateFallbackRoadmap(heavyEmitter, 40)
    )).not.toThrow()
  })

})
