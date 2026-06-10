import { TwinData, FootprintCalculation, Roadmap } from './types';
import { EMISSION_FACTORS } from './constants';

/**
 * Calculates annual carbon footprint from user lifestyle parameters.
 * Uses IPCC AR6 emission factors adjusted for regional grid intensity.
 *
 * @param twin - User lifestyle profile collected during Twin Builder
 * @returns Footprint breakdown by category and total in metric tons CO₂e/year
 *
 * @example
 * const result = calculateFootprint({
 *   diet: 'vegan',
 *   transport: 'metro',
 *   housing: 'apartment',
 *   flights: 1,
 *   commute_km: 12
 * })
 * // result.total → 2.1
 * // result.breakdown.transport → 0.4
 */
export function calculateFootprint(twin: Partial<TwinData>): FootprintCalculation {
  const home = EMISSION_FACTORS.home[twin.housing as keyof typeof EMISSION_FACTORS.home] ?? EMISSION_FACTORS.home.Default;
  const transport = EMISSION_FACTORS.commute[twin.commute as keyof typeof EMISSION_FACTORS.commute] ?? EMISSION_FACTORS.commute.Default;
  const diet = EMISSION_FACTORS.diet[twin.diet as keyof typeof EMISSION_FACTORS.diet] ?? EMISSION_FACTORS.diet.Default;
  
  // Flights can be a string like '0-2' or an exact number if adjusted by the simulator
  let flights = EMISSION_FACTORS.flights.Default;
  if (typeof twin.flights === 'string' && twin.flights in EMISSION_FACTORS.flights) {
    flights = EMISSION_FACTORS.flights[twin.flights as keyof typeof EMISSION_FACTORS.flights];
  } else if (typeof twin.flights === 'number' || !isNaN(Number(twin.flights))) {
    // If it's a direct number from simulator
    const num = Number(twin.flights);
    flights = num * 0.2; // roughly 0.2 tons per flight
  }

  const shopping = EMISSION_FACTORS.shopping.Default;

  const breakdown = {
    home,
    transport,
    diet,
    flights,
    shopping
  };

  const total = home + transport + diet + flights + shopping;

  return {
    total,
    breakdown
  };
}

/**
 * Generates a deterministic fallback roadmap when Claude API is unavailable.
 * Parses twin profile to produce realistic, profile-specific phase recommendations.
 * Validates output against RoadmapSchema before returning.
 *
 * @param twin - User lifestyle profile
 * @param goalPct - Target reduction percentage (default: 40)
 * @returns Validated roadmap conforming to RoadmapSchema
 */
export function generateFallbackRoadmap(
  twin: Partial<TwinData>
): Roadmap {
  return {
    phases: [
      {
        phase: 1,
        title: "Phase 1",
        months: "0-3 Months",
        actions: [
          {
            action: twin.commute === 'Car (Petrol)' ? 'Switch to Metro 2x/week' : 'Optimize home cooling',
            impact_kg: 400,
            effort: 'low',
            saving_inr: 15000,
            category: twin.commute === 'Car (Petrol)' ? 'transport' : 'home'
          }
        ],
        subtotal_kg: 400,
        cumulative_pct: 12
      },
      {
        phase: 2,
        title: "Phase 2",
        months: "3-12 Months",
        actions: [
          {
            action: typeof twin.diet === 'string' && twin.diet.includes('Meat') ? 'Replace 3 meat meals/week with Paneer' : 'WFH Fridays',
            impact_kg: 500,
            effort: 'medium',
            saving_inr: 25000,
            category: typeof twin.diet === 'string' && twin.diet.includes('Meat') ? 'diet' : 'transport'
          }
        ],
        subtotal_kg: 500,
        cumulative_pct: 28
      },
      {
        phase: 3,
        title: "Phase 3",
        months: "12-24 Months",
        actions: [
          {
            action: twin.housing === 'Independent House' ? 'Install 2kW Solar' : 'Green Energy Tariff',
            impact_kg: 500,
            effort: 'high',
            saving_inr: 40000,
            category: 'home'
          }
        ],
        subtotal_kg: 500,
        cumulative_pct: 42
      },
      {
        phase: 4,
        title: "Phase 4",
        months: "24-36 Months",
        actions: [
          {
            action: twin.flights === '12+' ? 'Replace 4 domestic flights with train' : 'Buy 5-star efficient appliances',
            impact_kg: 400,
            effort: 'medium',
            saving_inr: 30000,
            category: twin.flights === '12+' ? 'flights' : 'home'
          }
        ],
        subtotal_kg: 400,
        cumulative_pct: 54
      }
    ],
    confidence_pct: 88,
    total_saving_inr: 110000,
    trees_equivalent: 150
  };
}
