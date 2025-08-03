
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, animalsTable } from '../db/schema';
import { type CreateUserInput, type CreateAnimalInput } from '../schema';
import { getAnimals } from '../handlers/get_animals';

// Test users
const testUser: CreateUserInput = {
  name: 'John Doe',
  email: 'john@example.com',
  phone: '+1234567890',
  role: 'Shohibul Qurban'
};

const testAdmin: CreateUserInput = {
  name: 'Admin User',
  email: 'admin@example.com',
  phone: '+0987654321',
  role: 'Panitia/Admin'
};

describe('getAnimals', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no animals exist', async () => {
    const result = await getAnimals();
    expect(result).toEqual([]);
  });

  it('should return animals with owner details', async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        name: testUser.name,
        email: testUser.email,
        phone: testUser.phone,
        role: testUser.role
      })
      .returning()
      .execute();

    const userId = userResult[0].id;

    // Create test animal
    const animalInput: CreateAnimalInput = {
      type: 'cow',
      owner_id: userId,
      weight: 500.50,
      notes: 'Test cow'
    };

    await db.insert(animalsTable)
      .values({
        type: animalInput.type,
        owner_id: animalInput.owner_id,
        weight: animalInput.weight?.toString(),
        notes: animalInput.notes
      })
      .execute();

    const result = await getAnimals();

    expect(result).toHaveLength(1);
    expect(result[0].type).toEqual('cow');
    expect(result[0].owner_id).toEqual(userId);
    expect(result[0].owner_name).toEqual('John Doe');
    expect(result[0].owner_email).toEqual('john@example.com');
    expect(result[0].current_stage).toEqual('registration');
    expect(result[0].weight).toEqual(500.50);
    expect(typeof result[0].weight).toBe('number');
    expect(result[0].notes).toEqual('Test cow');
    expect(result[0].id).toBeDefined();
    expect(result[0].registration_date).toBeInstanceOf(Date);
    expect(result[0].created_at).toBeInstanceOf(Date);
    expect(result[0].slaughter_date).toBeNull();
    expect(result[0].completion_date).toBeNull();
  });

  it('should return multiple animals with different owners', async () => {
    // Create first user
    const user1Result = await db.insert(usersTable)
      .values({
        name: testUser.name,
        email: testUser.email,
        phone: testUser.phone,
        role: testUser.role
      })
      .returning()
      .execute();

    // Create second user
    const user2Result = await db.insert(usersTable)
      .values({
        name: testAdmin.name,
        email: testAdmin.email,
        phone: testAdmin.phone,
        role: testAdmin.role
      })
      .returning()
      .execute();

    const user1Id = user1Result[0].id;
    const user2Id = user2Result[0].id;

    // Create animals for both users
    await db.insert(animalsTable)
      .values([
        {
          type: 'cow',
          owner_id: user1Id,
          weight: '400.25',
          notes: 'User 1 cow'
        },
        {
          type: 'goat',
          owner_id: user2Id,
          weight: '50.75',
          notes: 'User 2 goat'
        }
      ])
      .execute();

    const result = await getAnimals();

    expect(result).toHaveLength(2);

    // Check first animal
    const cow = result.find(animal => animal.type === 'cow');
    expect(cow).toBeDefined();
    expect(cow!.owner_name).toEqual('John Doe');
    expect(cow!.owner_email).toEqual('john@example.com');
    expect(cow!.weight).toEqual(400.25);
    expect(typeof cow!.weight).toBe('number');

    // Check second animal
    const goat = result.find(animal => animal.type === 'goat');
    expect(goat).toBeDefined();
    expect(goat!.owner_name).toEqual('Admin User');
    expect(goat!.owner_email).toEqual('admin@example.com');
    expect(goat!.weight).toEqual(50.75);
    expect(typeof goat!.weight).toBe('number');
  });

  it('should handle animals with null weight', async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        name: testUser.name,
        email: testUser.email,
        phone: testUser.phone,
        role: testUser.role
      })
      .returning()
      .execute();

    const userId = userResult[0].id;

    // Create animal with null weight
    await db.insert(animalsTable)
      .values({
        type: 'goat',
        owner_id: userId,
        weight: null,
        notes: 'Goat without weight'
      })
      .execute();

    const result = await getAnimals();

    expect(result).toHaveLength(1);
    expect(result[0].weight).toBeNull();
    expect(result[0].type).toEqual('goat');
    expect(result[0].owner_name).toEqual('John Doe');
  });
});
