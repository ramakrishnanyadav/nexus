'use server';

import { generateObject } from 'ai';
import { createAnthropic } from '@ai-sdk/anthropic';
import { RoadmapSchema, TwinData, RoadmapResult } from '@/lib/types';
import { calculateFootprint, generateFallbackRoadmap } from '@/lib/carbonEngine';

/**
 * Generates a personalized climate roadmap using Claude 3.5 Sonnet.
 * Falls back to generateFallbackRoadmap if the API fails or is unavailable.
 *
 * @param twin - The user's lifestyle data
 * @returns A structured Roadmap matching RoadmapSchema
 */
export async function generateRoadmapAction(twin: TwinData): Promise<RoadmapResult> {
  const baseline = calculateFootprint(twin);
  
  // Approximate grid intensity based on location for context
  const gridIntensity = twin.location === 'Mumbai' ? 0.8 : twin.location === 'Bengaluru' ? 0.7 : 0.75;
  const occupants = twin.housing === 'Shared' ? 3 : twin.housing === 'Independent House' ? 4 : 2;
  const transport_mode = twin.commute;
  const commute_km = twin.commute === 'Car (Petrol)' ? 28 : 15;
  const flights_per_year = twin.flights;
  
  const goal_pct = 40; // Hardcoded goal for the demo narrative
  const goal_months = 36;

  const prompt = `
You are a senior climate advisor generating a personalized carbon reduction roadmap.

User profile:
- Location: ${twin.location} (grid intensity: ${gridIntensity} kg CO₂/kWh)
- Housing: ${twin.housing} (${occupants} occupants)
- Commute: ${commute_km}km daily by ${transport_mode}
- Diet: ${twin.diet}
- Flights: ${flights_per_year} per year
- Baseline footprint: ${baseline.total.toFixed(1)} tons/year
- Reduction goal: ${goal_pct}% over ${goal_months} months

Rules:
1. Phase 1 must contain only zero-cost actions achievable in 30 days
2. Sequence by psychological momentum: easiest wins first
3. Each action must be specific to this user's profile — no generic advice
4. impact_kg values must sum correctly to hit the stated goal
5. saving_inr must reflect actual Indian market prices (2024)
6. Return only valid JSON matching the schema — no markdown, no explanation
`;

  try {
    const anthropic = createAnthropic({
      apiKey: process.env.ANTHROPIC_API_KEY || 'dummy_key',
    });

    const { object } = await generateObject({
      model: anthropic('claude-3-5-sonnet-20241022'),
      schema: RoadmapSchema,
      prompt: prompt,
      temperature: 0.2,
    });

    return object;
  } catch (error) {
    console.error("AI Generation failed or no API key, using intelligent fallback.", error);
    
    // Sophisticated structured fallback that complies perfectly with RoadmapSchema
    return generateFallbackRoadmap(twin);
  }
}
