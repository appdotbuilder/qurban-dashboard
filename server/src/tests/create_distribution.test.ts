
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { distributionRecordsTable, usersTable, animalsTable } from '../db/schema';
import { type CreateDistributionInput } from '../schema';
import { createDistribution } from '../handlers/create_distribution';
import { eq } from 'drizzle-orm';

describe('createDistribution', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  // Helper to create prerequisite data
  const createTestUser = async () => {
    const result = await db.insert(usersTable)
      .values({
        name: 'Test User',
        email: 'test@example.com',
        phone: '123456789',
        role: 'Panitia/Admin'
      })
      .returning()
      .execute();
    return result[0];
  };

  const createTestAnimal = async (ownerId: number) => {
    const result = await db.insert(animalsTable)
      .values({
        type: 'cow',
        owner_id: ownerId,
        current_stage: 'registration',
        weight: '500.50',
        notes: 'Test animal'
      })
      .returning()
      .execute();
    return result[0];
  };

  it('should create a distribution record', async () => {
    // Create prerequisite data
    const user = await createTestUser();
    const animal = await createTestAnimal(user.id);

    const testInput: CreateDistributionInput = {
      animal_id: animal.id,
      recipient_category: 'Fakir Miskin',
      recipient_name: 'Test Recipient',
      weight_distributed: 25.75,
      distributed_by: user.id,
      notes: 'Test distribution'
    };

    const result = await createDistribution(testInput);

    // Basic field validation
    expect(result.animal_id).toEqual(animal.id);
    expect(result.recipient_category).toEqual('Fakir Miskin');
    expect(result.recipient_name).toEqual('Test Recipient');
    expect(result.weight_distributed).toEqual(25.75);
    expect(typeof result.weight_distributed).toBe('number');
    expect(result.status).toEqual('completed');
    expect(result.distributed_by).toEqual(user.id);
    expect(result.notes).toEqual('Test distribution');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.distributed_at).toBeInstanceOf(Date);
  });

  it('should save distribution record to database', async () => {
    // Create prerequisite data
    const user = await createTestUser();
    const animal = await createTestAnimal(user.id);

    const testInput: CreateDistributionInput = {
      animal_id: animal.id,
      recipient_category: 'Warga',
      recipient_name: 'Community Member',
      weight_distributed: 15.25,
      distributed_by: user.id,
      notes: 'Community distribution'
    };

    const result = await createDistribution(testInput);

    // Query database to verify record was saved
    const distributionRecords = await db.select()
      .from(distributionRecordsTable)
      .where(eq(distributionRecordsTable.id, result.id))
      .execute();

    expect(distributionRecords).toHaveLength(1);
    const savedRecord = distributionRecords[0];
    expect(savedRecord.animal_id).toEqual(animal.id);
    expect(savedRecord.recipient_category).toEqual('Warga');
    expect(savedRecord.recipient_name).toEqual('Community Member');
    expect(parseFloat(savedRecord.weight_distributed)).toEqual(15.25);
    expect(savedRecord.status).toEqual('completed');
    expect(savedRecord.distributed_by).toEqual(user.id);
    expect(savedRecord.notes).toEqual('Community distribution');
    expect(savedRecord.created_at).toBeInstanceOf(Date);
    expect(savedRecord.distributed_at).toBeInstanceOf(Date);
  });

  it('should handle null recipient_name', async () => {
    // Create prerequisite data
    const user = await createTestUser();
    const animal = await createTestAnimal(user.id);

    const testInput: CreateDistributionInput = {
      animal_id: animal.id,
      recipient_category: 'Proposal',
      recipient_name: null,
      weight_distributed: 10.0,
      distributed_by: user.id,
      notes: null
    };

    const result = await createDistribution(testInput);

    expect(result.recipient_name).toBeNull();
    expect(result.notes).toBeNull();
    expect(result.recipient_category).toEqual('Proposal');
    expect(result.weight_distributed).toEqual(10.0);
  });

  it('should throw error when animal does not exist', async () => {
    // Create user but no animal
    const user = await createTestUser();

    const testInput: CreateDistributionInput = {
      animal_id: 999, // Non-existent animal ID
      recipient_category: 'Fakir Miskin',
      recipient_name: 'Test Recipient',
      weight_distributed: 25.75,
      distributed_by: user.id,
      notes: 'Test distribution'
    };

    expect(createDistribution(testInput)).rejects.toThrow(/Animal with id 999 not found/i);
  });

  it('should throw error when distributed_by user does not exist', async () => {
    // Create animal with valid owner but use non-existent distributed_by user
    const owner = await createTestUser();
    const animal = await createTestAnimal(owner.id);

    const testInput: CreateDistributionInput = {
      animal_id: animal.id,
      recipient_category: 'Fakir Miskin',
      recipient_name: 'Test Recipient',
      weight_distributed: 25.75,
      distributed_by: 999, // Non-existent user ID
      notes: 'Test distribution'
    };

    expect(createDistribution(testInput)).rejects.toThrow(/User with id 999 not found/i);
  });
});
