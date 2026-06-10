import { calculateFootprint, generateFallbackRoadmap } from './carbonEngine';
import { TwinData, RoadmapSchema } from './types';

describe('Carbon Engine', () => {
  it('calculates the default baseline if no inputs are provided', () => {
    const result = calculateFootprint({});
    expect(result.total).toBeCloseTo(1.5 + 1.0 + 1.8 + 1.0 + 1.5);
  });

  it('calculates a high-emission profile accurately', () => {
    const result = calculateFootprint({
      housing: 'Independent House', // 2.5
      commute: 'Car (Petrol)', // 1.8
      diet: 'High Meat', // 2.5
      flights: '12+', // 4.0
    });
    // + 1.5 shopping
    expect(result.total).toBeCloseTo(2.5 + 1.8 + 2.5 + 4.0 + 1.5);
  });

  it('calculates a low-emission profile accurately', () => {
    const result = calculateFootprint({
      housing: 'Shared', // 0.8
      commute: 'Metro/Train', // 0.2
      diet: 'Vegan', // 0.7
      flights: '0-2', // 0.4
    });
    // + 1.5 shopping
    expect(result.total).toBeCloseTo(0.8 + 0.2 + 0.7 + 0.4 + 1.5);
  });

  it('handles direct number inputs for flights from the simulator', () => {
    const result = calculateFootprint({
      flights: '5', // 5 * 0.2 = 1.0
    });
    expect(result.breakdown.flights).toBeCloseTo(1.0);
  });
});

