
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, animalsTable, processLogsTable } from '../db/schema';
import { type UpdateAnimalStageInput } from '../schema';
import { updateAnimalStage } from '../handlers/update_animal_stage';
import { eq } from 'drizzle-orm';

describe('updateAnimalStage', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let testUserId: number;
  let testAnimalId: number;
  let testProcessorId: number;

  beforeEach(async () => {
    // Create test user (owner)
    const users = await db.insert(usersTable)
      .values([
        {
          name: 'Test Owner',
          email: 'owner@test.com',
          role: 'Shohibul Qurban'
        },
        {
          name: 'Test Processor',
          email: 'processor@test.com',
          role: 'Panitia/Admin'
        }
      ])
      .returning()
      .execute();

    testUserId = users[0].id;
    testProcessorId = users[1].id;

    // Create test animal
    const animals = await db.insert(animalsTable)
      .values({
        type: 'cow',
        owner_id: testUserId,
        current_stage: 'registration',
        weight: '150.5'
      })
      .returning()
      .execute();

    testAnimalId = animals[0].id;
  });

  it('should update animal stage successfully', async () => {
    const input: UpdateAnimalStageInput = {
      animal_id: testAnimalId,
      new_stage: 'slaughtering',
      weight_recorded: 145.25,
      notes: 'Slaughter process started',
      processed_by: testProcessorId
    };

    const result = await updateAnimalStage(input);

    expect(result.id).toEqual(testAnimalId);
    expect(result.current_stage).toEqual('slaughtering');
    expect(result.weight).toEqual(145.25);
    expect(result.notes).toEqual('Slaughter process started');
    expect(result.slaughter_date).toBeInstanceOf(Date);
  });

  it('should create process log entry', async () => {
    const input: UpdateAnimalStageInput = {
      animal_id: testAnimalId,
      new_stage: 'skinning',
      weight_recorded: 140.0,
      notes: 'Skinning completed',
      processed_by: testProcessorId
    };

    await updateAnimalStage(input);

    const processLogs = await db.select()
      .from(processLogsTable)
      .where(eq(processLogsTable.animal_id, testAnimalId))
      .execute();

    expect(processLogs).toHaveLength(1);
    expect(processLogs[0].stage).toEqual('skinning');
    expect(parseFloat(processLogs[0].weight_recorded!)).toEqual(140.0);
    expect(processLogs[0].notes).toEqual('Skinning completed');
    expect(processLogs[0].processed_by).toEqual(testProcessorId);
    expect(processLogs[0].completed_at).toBeInstanceOf(Date);
  });

  it('should set completion_date when stage is distribution', async () => {
    const input: UpdateAnimalStageInput = {
      animal_id: testAnimalId,
      new_stage: 'distribution',
      weight_recorded: null,
      notes: 'Ready for distribution',
      processed_by: testProcessorId
    };

    const result = await updateAnimalStage(input);

    expect(result.current_stage).toEqual('distribution');
    expect(result.completion_date).toBeInstanceOf(Date);
  });

  it('should handle null weight_recorded', async () => {
    const input: UpdateAnimalStageInput = {
      animal_id: testAnimalId,
      new_stage: 'meat_weighing',
      weight_recorded: null,
      notes: null,
      processed_by: testProcessorId
    };

    const result = await updateAnimalStage(input);

    expect(result.current_stage).toEqual('meat_weighing');
    expect(result.weight).toEqual(150.5); // Should keep original weight
  });

  it('should throw error for non-existent animal', async () => {
    const input: UpdateAnimalStageInput = {
      animal_id: 99999,
      new_stage: 'slaughtering',
      weight_recorded: 100.0,
      notes: 'Test',
      processed_by: testProcessorId
    };

    expect(updateAnimalStage(input)).rejects.toThrow(/not found/i);
  });

  it('should update database correctly', async () => {
    const input: UpdateAnimalStageInput = {
      animal_id: testAnimalId,
      new_stage: 'packing',
      weight_recorded: 135.75,
      notes: 'Packing completed',
      processed_by: testProcessorId
    };

    await updateAnimalStage(input);

    // Verify animal was updated in database
    const animals = await db.select()
      .from(animalsTable)
      .where(eq(animalsTable.id, testAnimalId))
      .execute();

    expect(animals).toHaveLength(1);
    expect(animals[0].current_stage).toEqual('packing');
    expect(parseFloat(animals[0].weight!)).toEqual(135.75);
    expect(animals[0].notes).toEqual('Packing completed');
  });
});
