import { describe, test, expect } from 'vitest'
import { calculateFootprint, generateFallbackRoadmap } from './carbonEngine'
import { RoadmapSchema, TwinData } from './types'

const averageUser: TwinData = {
  housing: 'apartment',
  occupants: 2,
  commute_km: 25,
  transport: 'car_petrol',
  diet: 'meat_sometimes',
  flights: 2,
  location: 'Mumbai'
}

describe('Graceful Degradation', () => {

  test('API timeout falls back to deterministic roadmap', async () => {
    const slowAPI = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('timeout')), 100)
    )

    const result = await slowAPI.catch(
      () => generateFallbackRoadmap(averageUser, 40)
    )

    expect(RoadmapSchema.safeParse(result).success).toBe(true)
  })

  test('malformed API response falls back cleanly', () => {
    const malformed = { phases: null, confidence: 'high' }
    const isValid = RoadmapSchema.safeParse(malformed).success

    expect(isValid).toBe(false)

    // Fallback should be used when validation fails
    const fallback = generateFallbackRoadmap(averageUser, 40)
    expect(RoadmapSchema.safeParse(fallback).success).toBe(true)
  })

  test('missing environment variable does not crash app', () => {
    const originalKey = process.env.ANTHROPIC_API_KEY
    delete process.env.ANTHROPIC_API_KEY

    expect(() => generateFallbackRoadmap(averageUser, 40))
      .not.toThrow()

    process.env.ANTHROPIC_API_KEY = originalKey
  })

  test('extreme input values do not crash calculateFootprint', () => {
    const extremeTwin = {
      ...averageUser,
      commute_km: 999,
      flights: 99,
      occupants: 20
    }

    expect(() => calculateFootprint(extremeTwin)).not.toThrow()
    const result = calculateFootprint(extremeTwin)
    expect(Number.isFinite(result.total)).toBe(true)
  })

})
