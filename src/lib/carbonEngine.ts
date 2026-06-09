import { TwinData, FootprintCalculation } from './types';
import { EMISSION_FACTORS } from './constants';

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
