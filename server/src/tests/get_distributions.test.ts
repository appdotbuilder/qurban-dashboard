
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, animalsTable, distributionRecordsTable } from '../db/schema';
import { getDistributions } from '../handlers/get_distributions';

describe('getDistributions', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no distributions exist', async () => {
    const result = await getDistributions();
    
    expect(result).toEqual([]);
  });

  it('should return all distribution records', async () => {
    // Create prerequisite user
    const userResults = await db.insert(usersTable)
      .values({
        name: 'Test User',
        email: 'test@example.com',
        phone: '123456789',
        role: 'Shohibul Qurban'
      })
      .returning()
      .execute();
    const userId = userResults[0].id;

    // Create prerequisite animal
    const animalResults = await db.insert(animalsTable)
      .values({
        type: 'cow',
        owner_id: userId,
        current_stage: 'registration',
        weight: '500.50',
        notes: 'Test animal'
      })
      .returning()
      .execute();
    const animalId = animalResults[0].id;

    // Create test distribution records
    await db.insert(distributionRecordsTable)
      .values([
        {
          animal_id: animalId,
          recipient_category: 'Fakir Miskin',
          recipient_name: 'John Doe',
          weight_distributed: '15.75',
          status: 'completed',
          distributed_by: userId,
          notes: 'First distribution'
        },
        {
          animal_id: animalId,
          recipient_category: 'Warga',
          recipient_name: 'Jane Smith',
          weight_distributed: '20.25',
          status: 'pending',
          distributed_by: userId,
          notes: 'Second distribution'
        }
      ])
      .execute();

    const result = await getDistributions();

    expect(result).toHaveLength(2);
    
    // Verify first record
    expect(result[0].animal_id).toEqual(animalId);
    expect(result[0].recipient_category).toEqual('Fakir Miskin');
    expect(result[0].recipient_name).toEqual('John Doe');
    expect(result[0].weight_distributed).toEqual(15.75);
    expect(typeof result[0].weight_distributed).toBe('number');
    expect(result[0].status).toEqual('completed');
    expect(result[0].distributed_by).toEqual(userId);
    expect(result[0].notes).toEqual('First distribution');
    expect(result[0].id).toBeDefined();
    expect(result[0].created_at).toBeInstanceOf(Date);

    // Verify second record
    expect(result[1].animal_id).toEqual(animalId);
    expect(result[1].recipient_category).toEqual('Warga');
    expect(result[1].recipient_name).toEqual('Jane Smith');
    expect(result[1].weight_distributed).toEqual(20.25);
    expect(typeof result[1].weight_distributed).toBe('number');
    expect(result[1].status).toEqual('pending');
    expect(result[1].distributed_by).toEqual(userId);
    expect(result[1].notes).toEqual('Second distribution');
  });

  it('should handle records with null optional fields', async () => {
    // Create prerequisite user
    const userResults = await db.insert(usersTable)
      .values({
        name: 'Test User',
        email: 'test@example.com',
        phone: null,
        role: 'Panitia/Admin'
      })
      .returning()
      .execute();
    const userId = userResults[0].id;

    // Create prerequisite animal
    const animalResults = await db.insert(animalsTable)
      .values({
        type: 'goat',
        owner_id: userId,
        current_stage: 'slaughtering',
        weight: null,
        notes: null
      })
      .returning()
      .execute();
    const animalId = animalResults[0].id;

    // Create distribution record with null optional fields
    await db.insert(distributionRecordsTable)
      .values({
        animal_id: animalId,
        recipient_category: 'Proposal',
        recipient_name: null,
        weight_distributed: '10.00',
        status: 'pending',
        distributed_by: null,
        notes: null
      })
      .execute();

    const result = await getDistributions();

    expect(result).toHaveLength(1);
    expect(result[0].recipient_name).toBeNull();
    expect(result[0].distributed_by).toBeNull();
    expect(result[0].notes).toBeNull();
    expect(result[0].distributed_at).toBeNull();
    expect(result[0].weight_distributed).toEqual(10);
    expect(typeof result[0].weight_distributed).toBe('number');
  });
});
