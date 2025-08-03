
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { animalsTable, usersTable } from '../db/schema';
import { type CreateAnimalInput } from '../schema';
import { createAnimal } from '../handlers/create_animal';
import { eq } from 'drizzle-orm';

describe('createAnimal', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let testOwner: { id: number };

  beforeEach(async () => {
    // Create a test user to be the owner
    const ownerResult = await db.insert(usersTable)
      .values({
        name: 'Test Owner',
        email: 'owner@test.com',
        phone: '123456789',
        role: 'Shohibul Qurban'
      })
      .returning()
      .execute();
    
    testOwner = ownerResult[0];
  });

  it('should create a cow with weight', async () => {
    const testInput: CreateAnimalInput = {
      type: 'cow',
      owner_id: testOwner.id,
      weight: 450.5,
      notes: 'Test cow for qurban'
    };

    const result = await createAnimal(testInput);

    // Basic field validation
    expect(result.type).toEqual('cow');
    expect(result.owner_id).toEqual(testOwner.id);
    expect(result.weight).toEqual(450.5);
    expect(typeof result.weight).toBe('number');
    expect(result.notes).toEqual('Test cow for qurban');
    expect(result.current_stage).toEqual('registration');
    expect(result.id).toBeDefined();
    expect(result.registration_date).toBeInstanceOf(Date);
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.slaughter_date).toBeNull();
    expect(result.completion_date).toBeNull();
  });

  it('should create a goat without weight', async () => {
    const testInput: CreateAnimalInput = {
      type: 'goat',
      owner_id: testOwner.id,
      weight: null,
      notes: null
    };

    const result = await createAnimal(testInput);

    expect(result.type).toEqual('goat');
    expect(result.owner_id).toEqual(testOwner.id);
    expect(result.weight).toBeNull();
    expect(result.notes).toBeNull();
    expect(result.current_stage).toEqual('registration');
    expect(result.id).toBeDefined();
    expect(result.registration_date).toBeInstanceOf(Date);
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save animal to database', async () => {
    const testInput: CreateAnimalInput = {
      type: 'cow',
      owner_id: testOwner.id,
      weight: 300.75,
      notes: 'Database test cow'
    };

    const result = await createAnimal(testInput);

    // Query using proper drizzle syntax
    const animals = await db.select()
      .from(animalsTable)
      .where(eq(animalsTable.id, result.id))
      .execute();

    expect(animals).toHaveLength(1);
    const savedAnimal = animals[0];
    expect(savedAnimal.type).toEqual('cow');
    expect(savedAnimal.owner_id).toEqual(testOwner.id);
    expect(parseFloat(savedAnimal.weight!)).toEqual(300.75);
    expect(savedAnimal.notes).toEqual('Database test cow');
    expect(savedAnimal.current_stage).toEqual('registration');
    expect(savedAnimal.registration_date).toBeInstanceOf(Date);
    expect(savedAnimal.created_at).toBeInstanceOf(Date);
  });

  it('should handle zero weight correctly', async () => {
    const testInput: CreateAnimalInput = {
      type: 'goat',
      owner_id: testOwner.id,
      weight: 0,
      notes: 'Zero weight test'
    };

    const result = await createAnimal(testInput);

    expect(result.weight).toEqual(0);
    expect(typeof result.weight).toBe('number');

    // Verify in database
    const animals = await db.select()
      .from(animalsTable)
      .where(eq(animalsTable.id, result.id))
      .execute();

    expect(parseFloat(animals[0].weight!)).toEqual(0);
  });

  it('should throw error for non-existent owner', async () => {
    const testInput: CreateAnimalInput = {
      type: 'cow',
      owner_id: 99999, // Non-existent owner ID
      weight: 400,
      notes: 'Invalid owner test'
    };

    await expect(createAnimal(testInput)).rejects.toThrow(/violates foreign key constraint/i);
  });
});
