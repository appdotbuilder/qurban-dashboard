
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, animalsTable, processLogsTable } from '../db/schema';
import { getProcessLogsByAnimal } from '../handlers/get_process_logs_by_animal';

describe('getProcessLogsByAnimal', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return process logs for a specific animal', async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        name: 'Test User',
        email: 'test@example.com',
        role: 'Panitia/Admin'
      })
      .returning()
      .execute();
    const userId = userResult[0].id;

    // Create test animal
    const animalResult = await db.insert(animalsTable)
      .values({
        type: 'cow',
        owner_id: userId,
        current_stage: 'registration'
      })
      .returning()
      .execute();
    const animalId = animalResult[0].id;

    // Create process logs for the animal
    await db.insert(processLogsTable)
      .values([
        {
          animal_id: animalId,
          stage: 'slaughtering',
          weight_recorded: '250.50',
          processed_by: userId,
          notes: 'First stage completed'
        },
        {
          animal_id: animalId,
          stage: 'skinning',
          weight_recorded: '240.75',
          processed_by: userId,
          notes: 'Second stage completed'
        }
      ])
      .execute();

    const result = await getProcessLogsByAnimal(animalId);

    expect(result).toHaveLength(2);
    expect(result[0].animal_id).toEqual(animalId);
    expect(result[0].stage).toEqual('slaughtering');
    expect(result[0].weight_recorded).toEqual(250.50);
    expect(typeof result[0].weight_recorded).toBe('number');
    expect(result[0].processed_by).toEqual(userId);
    expect(result[0].notes).toEqual('First stage completed');
    expect(result[0].completed_at).toBeInstanceOf(Date);

    expect(result[1].animal_id).toEqual(animalId);
    expect(result[1].stage).toEqual('skinning');
    expect(result[1].weight_recorded).toEqual(240.75);
    expect(typeof result[1].weight_recorded).toBe('number');
    expect(result[1].processed_by).toEqual(userId);
    expect(result[1].notes).toEqual('Second stage completed');
    expect(result[1].completed_at).toBeInstanceOf(Date);
  });

  it('should return empty array when no process logs exist for animal', async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        name: 'Test User',
        email: 'test@example.com',
        role: 'Panitia/Admin'
      })
      .returning()
      .execute();
    const userId = userResult[0].id;

    // Create test animal
    const animalResult = await db.insert(animalsTable)
      .values({
        type: 'goat',
        owner_id: userId,
        current_stage: 'registration'
      })
      .returning()
      .execute();
    const animalId = animalResult[0].id;

    const result = await getProcessLogsByAnimal(animalId);

    expect(result).toHaveLength(0);
  });

  it('should handle null weight_recorded values correctly', async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        name: 'Test User',
        email: 'test@example.com',
        role: 'Panitia/Admin'
      })
      .returning()
      .execute();
    const userId = userResult[0].id;

    // Create test animal
    const animalResult = await db.insert(animalsTable)
      .values({
        type: 'cow',
        owner_id: userId,
        current_stage: 'registration'
      })
      .returning()
      .execute();
    const animalId = animalResult[0].id;

    // Create process log without weight
    await db.insert(processLogsTable)
      .values({
        animal_id: animalId,
        stage: 'registration',
        processed_by: userId,
        notes: 'Initial registration'
      })
      .execute();

    const result = await getProcessLogsByAnimal(animalId);

    expect(result).toHaveLength(1);
    expect(result[0].weight_recorded).toBeNull();
    expect(result[0].stage).toEqual('registration');
    expect(result[0].notes).toEqual('Initial registration');
  });

  it('should only return logs for the specified animal', async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        name: 'Test User',
        email: 'test@example.com',
        role: 'Panitia/Admin'
      })
      .returning()
      .execute();
    const userId = userResult[0].id;

    // Create two test animals
    const animalResults = await db.insert(animalsTable)
      .values([
        {
          type: 'cow',
          owner_id: userId,
          current_stage: 'registration'
        },
        {
          type: 'goat',
          owner_id: userId,
          current_stage: 'registration'
        }
      ])
      .returning()
      .execute();
    const animalId1 = animalResults[0].id;
    const animalId2 = animalResults[1].id;

    // Create process logs for both animals
    await db.insert(processLogsTable)
      .values([
        {
          animal_id: animalId1,
          stage: 'slaughtering',
          processed_by: userId
        },
        {
          animal_id: animalId2,
          stage: 'skinning',
          processed_by: userId
        }
      ])
      .execute();

    const result = await getProcessLogsByAnimal(animalId1);

    expect(result).toHaveLength(1);
    expect(result[0].animal_id).toEqual(animalId1);
    expect(result[0].stage).toEqual('slaughtering');
  });
});
