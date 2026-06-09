import { z } from 'zod';

export interface TwinData {
  location: string;
  housing: string;
  commute: string;
  diet: string;
  flights: string;
}

export interface FootprintBreakdown {
  transport: number;
  diet: number;
  home: number;
  flights: number;
  shopping: number;
}

export interface FootprintCalculation {
  total: number;
  breakdown: FootprintBreakdown;
}

export const RoadmapSchema = z.object({
  phases: z.array(z.object({
    phase: z.number().int().min(1).max(4),
    title: z.string().min(1),
    months: z.string(),
    actions: z.array(z.object({
      action: z.string().min(1),
      impact_kg: z.number().positive(),
      effort: z.enum(['low', 'medium', 'high']),
      saving_inr: z.number(),
      category: z.enum(['transport', 'diet', 'home', 'flights', 'shopping'])
    })).min(1).max(3),
    subtotal_kg: z.number().positive(),
    cumulative_pct: z.number().min(0).max(100)
  })).length(4),
  confidence_pct: z.number().min(50).max(99),
  total_saving_inr: z.number().positive(),
  trees_equivalent: z.number().positive()
});

export type Roadmap = z.infer<typeof RoadmapSchema>;
