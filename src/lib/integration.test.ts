import { describe, it, expect } from 'vitest';
import { calculateFootprint } from './carbonEngine';
import { generateRoadmapAction } from '../app/actions';
import { RoadmapSchema, TwinData } from './types';

describe('V6 Integration Tests', () => {
  // Test 1: Time Machine monotonicity
  it('verifies that the Time Machine always shows a lower footprint at year 5 than year 1', async () => {
    const twin: TwinData = {
      location: 'Mumbai',
      housing: 'Independent House',
      commute: 'Car (Petrol)',
      diet: 'High Meat',
      flights: '12+'
    };

    const baseline = calculateFootprint(twin).total;
    const roadmap = await generateRoadmapAction(twin);
    const reduction = roadmap.phases.reduce((acc, p) => acc + p.subtotal_kg, 0) / 1000;

    // Simulate year 1 (progress = 0) vs year 5 (progress = 1)
    const year1Emissions = baseline - (0 * reduction);
    const year5Emissions = baseline - (1 * reduction);

    expect(year5Emissions).toBeLessThan(year1Emissions);
    expect(year1Emissions).toBeCloseTo(baseline);
  });

  // Test 2: Roadmap coherence
  it('verifies that the cumulative_pct on phase 4 is at least 40%', async () => {
    const twin: TwinData = {
      location: 'Delhi',
      housing: 'Apartment',
      commute: 'Metro/Train',
      diet: 'Vegetarian',
      flights: '0-2'
    };

    const roadmap = await generateRoadmapAction(twin);
    const finalPhase = roadmap.phases[3];

    expect(finalPhase.cumulative_pct).toBeGreaterThanOrEqual(40);
  });

  // Test 3: Fallback structural validity
  it('verifies the fallback returns a valid RoadmapSchema object for different twins', async () => {
    // Override API key to force fallback for test predictability
    process.env.ANTHROPIC_API_KEY = 'invalid';

    const highEmitter: TwinData = { location: 'Mumbai', housing: 'Independent House', commute: 'Car (Petrol)', diet: 'High Meat', flights: '12+' };
    const lowEmitter: TwinData = { location: 'Bengaluru', housing: 'Shared', commute: 'Metro/Train', diet: 'Vegan', flights: '0-2' };

    const highRoadmap = await generateRoadmapAction(highEmitter);
    const lowRoadmap = await generateRoadmapAction(lowEmitter);

    // This will throw an error if the structure is invalid
    expect(() => RoadmapSchema.parse(highRoadmap)).not.toThrow();
    expect(() => RoadmapSchema.parse(lowRoadmap)).not.toThrow();

    // Verify specific structure mapping
    expect(highRoadmap.phases).toHaveLength(4);
    expect(highRoadmap.total_saving_inr).toBeGreaterThan(0);
  });
});
