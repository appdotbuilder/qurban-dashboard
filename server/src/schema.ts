
import { z } from 'zod';

// Enums
export const userRoleSchema = z.enum(['Panitia/Admin', 'Shohibul Qurban']);
export const animalTypeSchema = z.enum(['cow', 'goat']);
export const processStageSchema = z.enum([
  'registration',
  'slaughtering',
  'skinning',
  'meat_weighing',
  'meat_chopping',
  'bone_cutting',
  'packing',
  'distribution'
]);
export const recipientCategorySchema = z.enum([
  'Shohibul Qurban',
  'Warga',
  'Fakir Miskin',
  'Proposal',
  'Panitia'
]);
export const distributionStatusSchema = z.enum(['pending', 'completed']);

// User schema
export const userSchema = z.object({
  id: z.number(),
  name: z.string(),
  email: z.string().email(),
  phone: z.string().nullable(),
  role: userRoleSchema,
  created_at: z.coerce.date()
});

export type User = z.infer<typeof userSchema>;

// Animal schema
export const animalSchema = z.object({
  id: z.number(),
  type: animalTypeSchema,
  owner_id: z.number(),
  current_stage: processStageSchema,
  weight: z.number().nullable(),
  registration_date: z.coerce.date(),
  slaughter_date: z.coerce.date().nullable(),
  completion_date: z.coerce.date().nullable(),
  notes: z.string().nullable(),
  created_at: z.coerce.date()
});

export type Animal = z.infer<typeof animalSchema>;

// Process log schema
export const processLogSchema = z.object({
  id: z.number(),
  animal_id: z.number(),
  stage: processStageSchema,
  weight_recorded: z.number().nullable(),
  completed_at: z.coerce.date(),
  notes: z.string().nullable(),
  processed_by: z.number()
});

export type ProcessLog = z.infer<typeof processLogSchema>;

// Distribution record schema
export const distributionRecordSchema = z.object({
  id: z.number(),
  animal_id: z.number(),
  recipient_category: recipientCategorySchema,
  recipient_name: z.string().nullable(),
  weight_distributed: z.number(),
  status: distributionStatusSchema,
  distributed_at: z.coerce.date().nullable(),
  distributed_by: z.number().nullable(),
  notes: z.string().nullable(),
  created_at: z.coerce.date()
});

export type DistributionRecord = z.infer<typeof distributionRecordSchema>;

// Input schemas for creating records
export const createUserInputSchema = z.object({
  name: z.string(),
  email: z.string().email(),
  phone: z.string().nullable(),
  role: userRoleSchema
});

export type CreateUserInput = z.infer<typeof createUserInputSchema>;

export const createAnimalInputSchema = z.object({
  type: animalTypeSchema,
  owner_id: z.number(),
  weight: z.number().positive().nullable(),
  notes: z.string().nullable()
});

export type CreateAnimalInput = z.infer<typeof createAnimalInputSchema>;

export const updateAnimalStageInputSchema = z.object({
  animal_id: z.number(),
  new_stage: processStageSchema,
  weight_recorded: z.number().positive().nullable(),
  notes: z.string().nullable(),
  processed_by: z.number()
});

export type UpdateAnimalStageInput = z.infer<typeof updateAnimalStageInputSchema>;

export const createDistributionInputSchema = z.object({
  animal_id: z.number(),
  recipient_category: recipientCategorySchema,
  recipient_name: z.string().nullable(),
  weight_distributed: z.number().positive(),
  distributed_by: z.number(),
  notes: z.string().nullable()
});

export type CreateDistributionInput = z.infer<typeof createDistributionInputSchema>;

// Dashboard data schema
export const dashboardStatsSchema = z.object({
  total_animals: z.number(),
  total_cows: z.number(),
  total_goats: z.number(),
  animals_by_stage: z.record(processStageSchema, z.number()),
  total_weight: z.number(),
  total_distributed_weight: z.number()
});

export type DashboardStats = z.infer<typeof dashboardStatsSchema>;

// Animal with owner details schema
export const animalWithOwnerSchema = z.object({
  id: z.number(),
  type: animalTypeSchema,
  owner_id: z.number(),
  owner_name: z.string(),
  owner_email: z.string(),
  current_stage: processStageSchema,
  weight: z.number().nullable(),
  registration_date: z.coerce.date(),
  slaughter_date: z.coerce.date().nullable(),
  completion_date: z.coerce.date().nullable(),
  notes: z.string().nullable(),
  created_at: z.coerce.date()
});

export type AnimalWithOwner = z.infer<typeof animalWithOwnerSchema>;
