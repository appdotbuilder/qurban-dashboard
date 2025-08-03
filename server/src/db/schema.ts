
import { serial, text, pgTable, timestamp, integer, numeric, pgEnum } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Enums
export const userRoleEnum = pgEnum('user_role', ['Panitia/Admin', 'Shohibul Qurban']);
export const animalTypeEnum = pgEnum('animal_type', ['cow', 'goat']);
export const processStageEnum = pgEnum('process_stage', [
  'registration',
  'slaughtering',
  'skinning',
  'meat_weighing',
  'meat_chopping',
  'bone_cutting',
  'packing',
  'distribution'
]);
export const recipientCategoryEnum = pgEnum('recipient_category', [
  'Shohibul Qurban',
  'Warga',
  'Fakir Miskin',
  'Proposal',
  'Panitia'
]);
export const distributionStatusEnum = pgEnum('distribution_status', ['pending', 'completed']);

// Users table
export const usersTable = pgTable('users', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  phone: text('phone'),
  role: userRoleEnum('role').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Animals table
export const animalsTable = pgTable('animals', {
  id: serial('id').primaryKey(),
  type: animalTypeEnum('type').notNull(),
  owner_id: integer('owner_id').notNull().references(() => usersTable.id),
  current_stage: processStageEnum('current_stage').notNull().default('registration'),
  weight: numeric('weight', { precision: 10, scale: 2 }),
  registration_date: timestamp('registration_date').defaultNow().notNull(),
  slaughter_date: timestamp('slaughter_date'),
  completion_date: timestamp('completion_date'),
  notes: text('notes'),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Process logs table
export const processLogsTable = pgTable('process_logs', {
  id: serial('id').primaryKey(),
  animal_id: integer('animal_id').notNull().references(() => animalsTable.id),
  stage: processStageEnum('stage').notNull(),
  weight_recorded: numeric('weight_recorded', { precision: 10, scale: 2 }),
  completed_at: timestamp('completed_at').defaultNow().notNull(),
  notes: text('notes'),
  processed_by: integer('processed_by').notNull().references(() => usersTable.id),
});

// Distribution records table
export const distributionRecordsTable = pgTable('distribution_records', {
  id: serial('id').primaryKey(),
  animal_id: integer('animal_id').notNull().references(() => animalsTable.id),
  recipient_category: recipientCategoryEnum('recipient_category').notNull(),
  recipient_name: text('recipient_name'),
  weight_distributed: numeric('weight_distributed', { precision: 10, scale: 2 }).notNull(),
  status: distributionStatusEnum('status').notNull().default('pending'),
  distributed_at: timestamp('distributed_at'),
  distributed_by: integer('distributed_by').references(() => usersTable.id),
  notes: text('notes'),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Relations
export const usersRelations = relations(usersTable, ({ many }) => ({
  animals: many(animalsTable),
  processLogs: many(processLogsTable),
  distributionRecords: many(distributionRecordsTable),
}));

export const animalsRelations = relations(animalsTable, ({ one, many }) => ({
  owner: one(usersTable, {
    fields: [animalsTable.owner_id],
    references: [usersTable.id],
  }),
  processLogs: many(processLogsTable),
  distributionRecords: many(distributionRecordsTable),
}));

export const processLogsRelations = relations(processLogsTable, ({ one }) => ({
  animal: one(animalsTable, {
    fields: [processLogsTable.animal_id],
    references: [animalsTable.id],
  }),
  processedBy: one(usersTable, {
    fields: [processLogsTable.processed_by],
    references: [usersTable.id],
  }),
}));

export const distributionRecordsRelations = relations(distributionRecordsTable, ({ one }) => ({
  animal: one(animalsTable, {
    fields: [distributionRecordsTable.animal_id],
    references: [animalsTable.id],
  }),
  distributedBy: one(usersTable, {
    fields: [distributionRecordsTable.distributed_by],
    references: [usersTable.id],
  }),
}));

// TypeScript types for the table schemas
export type User = typeof usersTable.$inferSelect;
export type NewUser = typeof usersTable.$inferInsert;
export type Animal = typeof animalsTable.$inferSelect;
export type NewAnimal = typeof animalsTable.$inferInsert;
export type ProcessLog = typeof processLogsTable.$inferSelect;
export type NewProcessLog = typeof processLogsTable.$inferInsert;
export type DistributionRecord = typeof distributionRecordsTable.$inferSelect;
export type NewDistributionRecord = typeof distributionRecordsTable.$inferInsert;

// Export all tables for proper query building
export const tables = {
  users: usersTable,
  animals: animalsTable,
  processLogs: processLogsTable,
  distributionRecords: distributionRecordsTable,
};
