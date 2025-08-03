
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, animalsTable } from '../db/schema';
import { getAnimalsByOwner } from '../handlers/get_animals_by_owner';

describe('getAnimalsByOwner', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return animals owned by specific user', async () => {
    // Create test users
    const users = await db.insert(usersTable)
      .values([
        {
          name: 'Owner 1',
          email: 'owner1@example.com',
          role: 'Shohibul Qurban'
        },
        {
          name: 'Owner 2',
          email: 'owner2@example.com',
          role: 'Shohibul Qurban'
        }
      ])
      .returning()
      .execute();

    const owner1Id = users[0].id;
    const owner2Id = users[1].id;

    // Create test animals for both owners
    await db.insert(animalsTable)
      .values([
        {
          type: 'cow',
          owner_id: owner1Id,
          weight: '250.50',
          notes: 'Cow for owner 1'
        },
        {
          type: 'goat',
          owner_id: owner1Id,
          weight: '45.25',
          notes: 'Goat for owner 1'
        },
        {
          type: 'cow',
          owner_id: owner2Id,
          weight: '300.00',
          notes: 'Cow for owner 2'
        }
      ])
      .execute();

    const result = await getAnimalsByOwner(owner1Id);

    expect(result).toHaveLength(2);
    
    // Check first animal
    expect(result[0].owner_id).toEqual(owner1Id);
    expect(result[0].owner_name).toEqual('Owner 1');
    expect(result[0].owner_email).toEqual('owner1@example.com');
    expect(result[0].type).toEqual('cow');
    expect(result[0].weight).toEqual(250.50);
    expect(result[0].current_stage).toEqual('registration');
    expect(result[0].notes).toEqual('Cow for owner 1');
    expect(result[0].id).toBeDefined();
    expect(result[0].registration_date).toBeInstanceOf(Date);
    expect(result[0].created_at).toBeInstanceOf(Date);

    // Check second animal
    expect(result[1].owner_id).toEqual(owner1Id);
    expect(result[1].owner_name).toEqual('Owner 1');
    expect(result[1].owner_email).toEqual('owner1@example.com');
    expect(result[1].type).toEqual('goat');
    expect(result[1].weight).toEqual(45.25);
    expect(result[1].current_stage).toEqual('registration');
    expect(result[1].notes).toEqual('Goat for owner 1');
  });

  it('should return empty array when owner has no animals', async () => {
    // Create test user
    const users = await db.insert(usersTable)
      .values([
        {
          name: 'Owner Without Animals',
          email: 'noanimals@example.com',
          role: 'Shohibul Qurban'
        }
      ])
      .returning()
      .execute();

    const result = await getAnimalsByOwner(users[0].id);

    expect(result).toHaveLength(0);
  });

  it('should handle animals with null weight', async () => {
    // Create test user
    const users = await db.insert(usersTable)
      .values([
        {
          name: 'Test Owner',
          email: 'test@example.com',
          role: 'Shohibul Qurban'
        }
      ])
      .returning()
      .execute();

    // Create animal with null weight
    await db.insert(animalsTable)
      .values([
        {
          type: 'cow',
          owner_id: users[0].id,
          weight: null,
          notes: 'Animal without weight'
        }
      ])
      .execute();

    const result = await getAnimalsByOwner(users[0].id);

    expect(result).toHaveLength(1);
    expect(result[0].weight).toBeNull();
    expect(result[0].owner_name).toEqual('Test Owner');
    expect(result[0].type).toEqual('cow');
  });

  it('should return animals in correct order by id', async () => {
    // Create test user
    const users = await db.insert(usersTable)
      .values([
        {
          name: 'Test Owner',
          email: 'test@example.com',
          role: 'Shohibul Qurban'
        }
      ])
      .returning()
      .execute();

    // Create multiple animals
    await db.insert(animalsTable)
      .values([
        {
          type: 'cow',
          owner_id: users[0].id,
          weight: '100.00',
          notes: 'First animal'
        },
        {
          type: 'goat',
          owner_id: users[0].id,
          weight: '50.00',
          notes: 'Second animal'
        },
        {
          type: 'cow',
          owner_id: users[0].id,
          weight: '200.00',
          notes: 'Third animal'
        }
      ])
      .execute();

    const result = await getAnimalsByOwner(users[0].id);

    expect(result).toHaveLength(3);
    
    // Verify all animals belong to same owner
    result.forEach(animal => {
      expect(animal.owner_id).toEqual(users[0].id);
      expect(animal.owner_name).toEqual('Test Owner');
      expect(animal.owner_email).toEqual('test@example.com');
    });

    // Verify IDs are in ascending order (default database ordering)
    expect(result[0].id).toBeLessThan(result[1].id);
    expect(result[1].id).toBeLessThan(result[2].id);
  });
});
