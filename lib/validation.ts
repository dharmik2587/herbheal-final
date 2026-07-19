import { z } from 'zod';

export const recommendationRequestSchema = z.object({
  symptoms: z.array(z.string().min(1)).min(1, 'At least one symptom is required'),
  dosha: z.enum(['Vata', 'Pitta', 'Kapha']).optional(),
  limit: z.number().int().min(1).max(50).optional().default(10),
});

export const herbCreateSchema = z.object({
  name: z.string().min(1),
  scientificName: z.string().optional(),
  description: z.string().min(1),
  imageUrl: z.string().url().optional(),
  ayurvedicProperties: z.array(z.string()).optional().default([]),
  taste: z.array(z.string()).optional().default([]),
  temperature: z.string(),
  doshas: z.array(z.string()).optional().default([]),
  organs: z.array(z.string()).optional().default([]),
  contraindications: z.array(z.string()).optional().default([]),
  knownCompounds: z.array(z.string()).optional().default([]),
});

export const herbUpdateSchema = herbCreateSchema.partial();
