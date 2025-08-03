
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, animalsTable, distributionRecordsTable } from '../db/schema';
import { getDistributionsByAnimal } from '../handlers/get_distributions_by_animal';

describe('getDistributionsByAnimal', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return distributions for a specific animal', async () => {
    // Create test user
    const user = await db.insert(usersTable)
      .values({
        name: 'Test User',
        email: 'test@example.com',
        role: 'Panitia/Admin'
      })
      .returning()
      .execute();

    // Create test animal
    const animal = await db.insert(animalsTable)
      .values({
        type: 'cow',
        owner_id: user[0].id,
        current_stage: 'registration'
      })
      .returning()
      .execute();

    // Create distribution records for the animal
    const distributions = await db.insert(distributionRecordsTable)
      .values([
        {
          animal_id: animal[0].id,
          recipient_category: 'Warga',
          recipient_name: 'John Doe',
          weight_distributed: '5.50',
          status: 'completed',
          distributed_by: user[0].id
        },
        {
          animal_id: animal[0].id,
          recipient_category: 'Fakir Miskin',
          recipient_name: 'Jane Smith',
          weight_distributed: '3.25',
          status: 'pending'
        }
      ])
      .returning()
      .execute();

    const result = await getDistributionsByAnimal(animal[0].id);

    expect(result).toHaveLength(2);
    
    // Check first distribution
    const firstDistribution = result.find(d => d.recipient_name === 'John Doe');
    expect(firstDistribution).toBeDefined();
    expect(firstDistribution!.animal_id).toEqual(animal[0].id);
    expect(firstDistribution!.recipient_category).toEqual('Warga');
    expect(firstDistribution!.weight_distributed).toEqual(5.5);
    expect(typeof firstDistribution!.weight_distributed).toEqual('number');
    expect(firstDistribution!.status).toEqual('completed');
    expect(firstDistribution!.distributed_by).toEqual(user[0].id);

    // Check second distribution
    const secondDistribution = result.find(d => d.recipient_name === 'Jane Smith');
    expect(secondDistribution).toBeDefined();
    expect(secondDistribution!.animal_id).toEqual(animal[0].id);
    expect(secondDistribution!.recipient_category).toEqual('Fakir Miskin');
    expect(secondDistribution!.weight_distributed).toEqual(3.25);
    expect(typeof secondDistribution!.weight_distributed).toEqual('number');
    expect(secondDistribution!.status).toEqual('pending');
    expect(secondDistribution!.distributed_by).toBeNull();
  });

  it('should return empty array for animal with no distributions', async () => {
    // Create test user
    const user = await db.insert(usersTable)
      .values({
        name: 'Test User',
        email: 'test@example.com',
        role: 'Panitia/Admin'
      })
      .returning()
      .execute();

    // Create test animal without distributions
    const animal = await db.insert(animalsTable)
      .values({
        type: 'goat',
        owner_id: user[0].id,
        current_stage: 'registration'
      })
      .returning()
      .execute();

    const result = await getDistributionsByAnimal(animal[0].id);

    expect(result).toHaveLength(0);
    expect(Array.isArray(result)).toBe(true);
  });

  it('should return empty array for non-existent animal', async () => {
    const result = await getDistributionsByAnimal(99999);

    expect(result).toHaveLength(0);
    expect(Array.isArray(result)).toBe(true);
  });

  it('should only return distributions for the specified animal', async () => {
    // Create test user
    const user = await db.insert(usersTable)
      .values({
        name: 'Test User',
        email: 'test@example.com',
        role: 'Panitia/Admin'
      })
      .returning()
      .execute();

    // Create two test animals
    const animals = await db.insert(animalsTable)
      .values([
        {
          type: 'cow',
          owner_id: user[0].id,
          current_stage: 'registration'
        },
        {
          type: 'goat',
          owner_id: user[0].id,
          current_stage: 'registration'
        }
      ])
      .returning()
      .execute();

    // Create distributions for both animals
    await db.insert(distributionRecordsTable)
      .values([
        {
          animal_id: animals[0].id,
          recipient_category: 'Warga',
          recipient_name: 'For Animal 1',
          weight_distributed: '5.00',
          status: 'completed'
        },
        {
          animal_id: animals[1].id,
          recipient_category: 'Warga',
          recipient_name: 'For Animal 2',
          weight_distributed: '3.00',
          status: 'completed'
        }
      ])
      .returning()
      .execute();

    // Get distributions for first animal only
    const result = await getDistributionsByAnimal(animals[0].id);

    expect(result).toHaveLength(1);
    expect(result[0].animal_id).toEqual(animals[0].id);
    expect(result[0].recipient_name).toEqual('For Animal 1');
    expect(result[0].weight_distributed).toEqual(5.0);
  });
});
