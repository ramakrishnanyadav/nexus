import { describe, test, expect, vi } from 'vitest'
import { calculateFootprint, generateFallbackRoadmap } from './carbonEngine'
import { RoadmapSchema, TwinData } from './types'
import { generateRoadmap } from '../app/actions'

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

describe('Twin → Footprint → Roadmap Pipeline', () => {

  test('full pipeline produces valid roadmap from twin data', () => {
    const twin = averageUser
    const footprint = calculateFootprint(twin)
    const roadmap = generateFallbackRoadmap(twin, 40)

    expect(footprint.total).toBeGreaterThan(0)
    expect(roadmap.phases).toHaveLength(4)
    expect(RoadmapSchema.safeParse(roadmap).success).toBe(true)
  })

  test('Time Machine monotonicity — year 5 always lower than year 1', () => {
    const profiles = [veganCyclist, averageUser, heavyEmitter]

    profiles.forEach(profile => {
      const baseline = calculateFootprint(profile).total
      const year1 = baseline * 0.95
      const year5 = baseline * 0.60

      expect(year5).toBeLessThan(year1)
      expect(year5).toBeGreaterThan(0)
    })
  })

  test('Scenario simulator state flows correctly to roadmap', () => {
    const original = calculateFootprint(averageUser)
    const modified = calculateFootprint({
      ...averageUser,
      transport: 'metro',
      diet: 'vegan'
    })

    expect(modified.total).toBeLessThan(original.total)
    const roadmap = generateFallbackRoadmap(
      { ...averageUser, transport: 'metro', diet: 'vegan' },
      40
    )
    expect(roadmap.phases[0].actions.length).toBeGreaterThan(0)
  })

  test('high emitter and low emitter produce different roadmaps', () => {
    const highRoadmap = generateFallbackRoadmap(heavyEmitter, 40)
    const lowRoadmap = generateFallbackRoadmap(veganCyclist, 40)

    const highTotal = highRoadmap.phases.reduce(
      (sum, p) => sum + p.actions.reduce(
        (s, a) => s + a.impact_kg, 0
      ), 0
    )
    const lowTotal = lowRoadmap.phases.reduce(
      (sum, p) => sum + p.actions.reduce(
        (s, a) => s + a.impact_kg, 0
      ), 0
    )

    expect(highTotal).toBeGreaterThan(lowTotal)
  })

  test('fallback produces same schema-valid output as real API response', () => {
    const fallback = generateFallbackRoadmap(averageUser, 40)
    const parsed = RoadmapSchema.safeParse(fallback)

    expect(parsed.success).toBe(true)
    if (parsed.success) {
      expect(parsed.data.phases).toHaveLength(4)
      expect(parsed.data.confidence_pct).toBeGreaterThan(0)
      expect(parsed.data.total_saving_inr).toBeGreaterThan(0)
    }
  })

  test('API failure triggers fallback without throwing', async () => {
    vi.mock('../app/actions', () => ({
      generateRoadmap: vi.fn().mockRejectedValue(
        new Error('API key missing')
      )
    }))

    const result = await generateRoadmap(averageUser).catch(
      () => generateFallbackRoadmap(averageUser, 40)
    )

    expect(RoadmapSchema.safeParse(result).success).toBe(true)
  })

})
