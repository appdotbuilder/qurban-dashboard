
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, animalsTable, distributionRecordsTable } from '../db/schema';
import { getDashboardStats } from '../handlers/get_dashboard_stats';

describe('getDashboardStats', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty stats when no data exists', async () => {
    const stats = await getDashboardStats();

    expect(stats.total_animals).toEqual(0);
    expect(stats.total_cows).toEqual(0);
    expect(stats.total_goats).toEqual(0);
    expect(stats.total_weight).toEqual(0);
    expect(stats.total_distributed_weight).toEqual(0);
    expect(stats.animals_by_stage).toEqual({
      registration: 0,
      slaughtering: 0,
      skinning: 0,
      meat_weighing: 0,
      meat_chopping: 0,
      bone_cutting: 0,
      packing: 0,
      distribution: 0
    });
  });

  it('should calculate correct stats with animals data', async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        name: 'Test User',
        email: 'test@example.com',
        role: 'Shohibul Qurban'
      })
      .returning()
      .execute();
    const userId = userResult[0].id;

    // Create test animals
    await db.insert(animalsTable)
      .values([
        {
          type: 'cow',
          owner_id: userId,
          current_stage: 'registration',
          weight: '500.50'
        },
        {
          type: 'cow',
          owner_id: userId,
          current_stage: 'slaughtering',
          weight: '600.75'
        },
        {
          type: 'goat',
          owner_id: userId,
          current_stage: 'registration',
          weight: '35.25'
        },
        {
          type: 'goat',
          owner_id: userId,
          current_stage: 'meat_weighing',
          weight: null // No weight recorded
        }
      ])
      .execute();

    const stats = await getDashboardStats();

    expect(stats.total_animals).toEqual(4);
    expect(stats.total_cows).toEqual(2);
    expect(stats.total_goats).toEqual(2);
    expect(stats.total_weight).toEqual(1136.5); // 500.50 + 600.75 + 35.25 + 0
    expect(stats.animals_by_stage.registration).toEqual(2);
    expect(stats.animals_by_stage.slaughtering).toEqual(1);
    expect(stats.animals_by_stage.meat_weighing).toEqual(1);
    expect(stats.animals_by_stage.skinning).toEqual(0);
  });

  it('should calculate distributed weight correctly', async () => {
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
        current_stage: 'distribution',
        weight: '500.00'
      })
      .returning()
      .execute();
    const animalId = animalResult[0].id;

    // Create distribution records
    await db.insert(distributionRecordsTable)
      .values([
        {
          animal_id: animalId,
          recipient_category: 'Warga',
          weight_distributed: '50.25',
          status: 'completed',
          distributed_by: userId
        },
        {
          animal_id: animalId,
          recipient_category: 'Fakir Miskin',
          weight_distributed: '30.75',
          status: 'completed',
          distributed_by: userId
        },
        {
          animal_id: animalId,
          recipient_category: 'Proposal',
          weight_distributed: '20.00',
          status: 'pending', // Should not be included
          distributed_by: userId
        }
      ])
      .execute();

    const stats = await getDashboardStats();

    expect(stats.total_animals).toEqual(1);
    expect(stats.total_cows).toEqual(1);
    expect(stats.total_goats).toEqual(0);
    expect(stats.total_weight).toEqual(500);
    expect(stats.total_distributed_weight).toEqual(81); // 50.25 + 30.75 (pending not included)
    expect(stats.animals_by_stage.distribution).toEqual(1);
  });

  it('should handle animals with null weights', async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        name: 'Test User',
        email: 'test@example.com',
        role: 'Shohibul Qurban'
      })
      .returning()
      .execute();
    const userId = userResult[0].id;

    // Create animals with null weights
    await db.insert(animalsTable)
      .values([
        {
          type: 'cow',
          owner_id: userId,
          current_stage: 'registration',
          weight: null
        },
        {
          type: 'goat',
          owner_id: userId,
          current_stage: 'slaughtering',
          weight: '45.50'
        }
      ])
      .execute();

    const stats = await getDashboardStats();

    expect(stats.total_animals).toEqual(2);
    expect(stats.total_weight).toEqual(45.5); // Only the goat's weight
    expect(stats.total_distributed_weight).toEqual(0);
  });
});
