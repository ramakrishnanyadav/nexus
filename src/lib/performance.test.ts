import { describe, test, expect } from 'vitest'
import { calculateFootprint, generateFallbackRoadmap } from './carbonEngine'
import type { TwinData } from './types'

const averageUser: TwinData = {
  housing: 'apartment',
  occupants: 2,
  commute_km: 25,
  transport: 'car_petrol',
  diet: 'meat_sometimes',
  flights: 2,
  location: 'Mumbai'
}

describe('Performance Benchmarks', () => {

  test('calculateFootprint completes under 5ms', () => {
    const start = performance.now()
    calculateFootprint(averageUser)
    const end = performance.now()
    expect(end - start).toBeLessThan(5)
  })

  test('generateFallbackRoadmap completes under 50ms', () => {
    const start = performance.now()
    generateFallbackRoadmap(averageUser, 40)
    const end = performance.now()
    expect(end - start).toBeLessThan(50)
  })

  test('100 consecutive footprint calculations complete under 100ms', () => {
    const start = performance.now()
    for (let i = 0; i < 100; i++) {
      calculateFootprint(averageUser)
    }
    const end = performance.now()
    expect(end - start).toBeLessThan(100)
  })

  test('Time Machine slider calculation is fast enough for 60fps', () => {
    // 60fps = 16.67ms per frame. Calculation must be much faster.
    const start = performance.now()
    for (let year = 2024; year <= 2028; year++) {
      const reduction = (year - 2024) * 0.08
      const projected = averageUser
        ? calculateFootprint(averageUser).total * (1 - reduction)
        : 0
      expect(projected).toBeGreaterThanOrEqual(0)
    }
    const end = performance.now()
    expect(end - start).toBeLessThan(10)
  })

})
