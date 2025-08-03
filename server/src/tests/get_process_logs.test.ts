
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, animalsTable, processLogsTable } from '../db/schema';
import { getProcessLogs } from '../handlers/get_process_logs';

describe('getProcessLogs', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no process logs exist', async () => {
    const result = await getProcessLogs();
    expect(result).toEqual([]);
  });

  it('should return all process logs', async () => {
    // Create prerequisite data
    const user = await db.insert(usersTable)
      .values({
        name: 'Test User',
        email: 'test@example.com',
        phone: '123456789',
        role: 'Panitia/Admin'
      })
      .returning()
      .execute();

    const animal = await db.insert(animalsTable)
      .values({
        type: 'cow',
        owner_id: user[0].id,
        current_stage: 'registration',
        weight: '500.50',
        notes: 'Test animal'
      })
      .returning()
      .execute();

    // Create test process logs
    await db.insert(processLogsTable)
      .values([
        {
          animal_id: animal[0].id,
          stage: 'slaughtering',
          weight_recorded: '450.25',
          notes: 'First log',
          processed_by: user[0].id
        },
        {
          animal_id: animal[0].id,
          stage: 'skinning',
          weight_recorded: null,
          notes: 'Second log',
          processed_by: user[0].id
        }
      ])
      .execute();

    const result = await getProcessLogs();

    expect(result).toHaveLength(2);
    
    // Check first log
    expect(result[0].animal_id).toEqual(animal[0].id);
    expect(result[0].stage).toEqual('slaughtering');
    expect(result[0].weight_recorded).toEqual(450.25);
    expect(typeof result[0].weight_recorded).toBe('number');
    expect(result[0].notes).toEqual('First log');
    expect(result[0].processed_by).toEqual(user[0].id);
    expect(result[0].completed_at).toBeInstanceOf(Date);
    expect(result[0].id).toBeDefined();

    // Check second log
    expect(result[1].animal_id).toEqual(animal[0].id);
    expect(result[1].stage).toEqual('skinning');
    expect(result[1].weight_recorded).toBeNull();
    expect(result[1].notes).toEqual('Second log');
    expect(result[1].processed_by).toEqual(user[0].id);
    expect(result[1].completed_at).toBeInstanceOf(Date);
    expect(result[1].id).toBeDefined();
  });

  it('should handle multiple process logs from different animals', async () => {
    // Create users
    const users = await db.insert(usersTable)
      .values([
        {
          name: 'User 1',
          email: 'user1@example.com',
          phone: '111111111',
          role: 'Panitia/Admin'
        },
        {
          name: 'User 2',
          email: 'user2@example.com',
          phone: '222222222',
          role: 'Shohibul Qurban'
        }
      ])
      .returning()
      .execute();

    // Create animals
    const animals = await db.insert(animalsTable)
      .values([
        {
          type: 'cow',
          owner_id: users[0].id,
          current_stage: 'slaughtering',
          weight: '600.00'
        },
        {
          type: 'goat',
          owner_id: users[1].id,
          current_stage: 'skinning',
          weight: '25.50'
        }
      ])
      .returning()
      .execute();

    // Create process logs for different animals
    await db.insert(processLogsTable)
      .values([
        {
          animal_id: animals[0].id,
          stage: 'slaughtering',
          weight_recorded: '580.75',
          notes: 'Cow slaughtering',
          processed_by: users[0].id
        },
        {
          animal_id: animals[1].id,
          stage: 'skinning',
          weight_recorded: '22.25',
          notes: 'Goat skinning',
          processed_by: users[0].id
        },
        {
          animal_id: animals[0].id,
          stage: 'meat_weighing',
          weight_recorded: '400.00',
          notes: 'Cow meat weighing',
          processed_by: users[0].id
        }
      ])
      .execute();

    const result = await getProcessLogs();

    expect(result).toHaveLength(3);
    
    // Verify different animals are represented
    const animalIds = result.map(log => log.animal_id);
    expect(animalIds).toContain(animals[0].id);
    expect(animalIds).toContain(animals[1].id);

    // Verify different stages are represented
    const stages = result.map(log => log.stage);
    expect(stages).toContain('slaughtering');
    expect(stages).toContain('skinning');
    expect(stages).toContain('meat_weighing');

    // Verify numeric conversions
    result.forEach(log => {
      if (log.weight_recorded !== null) {
        expect(typeof log.weight_recorded).toBe('number');
      }
    });
  });
});
