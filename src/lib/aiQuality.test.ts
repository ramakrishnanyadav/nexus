import { describe, test, expect } from 'vitest'
import { generateFallbackRoadmap } from './carbonEngine'
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

const heavyEmitter: TwinData = {
  housing: 'independent_house',
  occupants: 1,
  commute_km: 60,
  transport: 'car_petrol',
  diet: 'heavy_meat',
  flights: 10,
  location: 'Mumbai'
}

describe('AI Roadmap Quality', () => {

  test('roadmap actions are specific not generic', () => {
    const roadmap = generateFallbackRoadmap(averageUser, 40)

    roadmap.phases.forEach(phase => {
      phase.actions.forEach(action => {
        // Must not contain generic phrases
        expect(action.action).not.toMatch(/consider reducing/i)
        expect(action.action).not.toMatch(/try to use/i)
        expect(action.action).not.toMatch(/you might want/i)

        // Must be specific and actionable
        expect(action.action.length).toBeGreaterThan(20)
      })
    })
  })

  test('impact values are proportional to effort', () => {
    const roadmap = generateFallbackRoadmap(heavyEmitter, 40)
    const phase1Actions = roadmap.phases[0].actions
    const phase4Actions = roadmap.phases[3].actions

    const phase1AvgImpact = phase1Actions.reduce(
      (s, a) => s + a.impact_kg, 0
    ) / phase1Actions.length

    const phase4AvgImpact = phase4Actions.reduce(
      (s, a) => s + a.impact_kg, 0
    ) / phase4Actions.length

    // Phase 4 (major decisions) should have higher impact than Phase 1 (quick wins)
    expect(phase4AvgImpact).toBeGreaterThanOrEqual(phase1AvgImpact)
  })

  test('saving_inr values are realistic for Indian market', () => {
    const roadmap = generateFallbackRoadmap(averageUser, 40)
    roadmap.phases.forEach(phase => {
      phase.actions.forEach(action => {
        // Savings should be between ₹0 and ₹200,000/year
        expect(action.saving_inr).toBeGreaterThanOrEqual(0)
        expect(action.saving_inr).toBeLessThan(200000)
      })
    })
  })

  test('roadmap total saving_inr matches sum of action savings', () => {
    const roadmap = generateFallbackRoadmap(averageUser, 40)
    const sumOfActions = roadmap.phases.reduce(
      (total, phase) => total + phase.actions.reduce(
        (s, a) => s + a.saving_inr, 0
      ), 0
    )
    expect(roadmap.total_saving_inr).toBeCloseTo(sumOfActions, -2)
  })

})
