
import { db } from '../db';
import { animalsTable, distributionRecordsTable } from '../db/schema';
import { type DashboardStats } from '../schema';
import { eq, sum } from 'drizzle-orm';

export async function getDashboardStats(): Promise<DashboardStats> {
  try {
    // Get all animals with their current stage
    const animals = await db.select({
      type: animalsTable.type,
      current_stage: animalsTable.current_stage,
      weight: animalsTable.weight
    })
    .from(animalsTable)
    .execute();

    // Calculate basic counts
    const total_animals = animals.length;
    const total_cows = animals.filter(animal => animal.type === 'cow').length;
    const total_goats = animals.filter(animal => animal.type === 'goat').length;

    // Calculate animals by stage
    const animals_by_stage = {
      registration: 0,
      slaughtering: 0,
      skinning: 0,
      meat_weighing: 0,
      meat_chopping: 0,
      bone_cutting: 0,
      packing: 0,
      distribution: 0
    };

    animals.forEach(animal => {
      animals_by_stage[animal.current_stage] += 1;
    });

    // Calculate total weight (sum of all animal weights)
    const total_weight = animals.reduce((sum, animal) => {
      return sum + (animal.weight ? parseFloat(animal.weight) : 0);
    }, 0);

    // Get total distributed weight
    const distributionResult = await db.select({
      total_distributed: sum(distributionRecordsTable.weight_distributed)
    })
    .from(distributionRecordsTable)
    .where(eq(distributionRecordsTable.status, 'completed'))
    .execute();

    const total_distributed_weight = distributionResult[0]?.total_distributed 
      ? parseFloat(distributionResult[0].total_distributed) 
      : 0;

    return {
      total_animals,
      total_cows,
      total_goats,
      animals_by_stage,
      total_weight,
      total_distributed_weight
    };
  } catch (error) {
    console.error('Dashboard stats calculation failed:', error);
    throw error;
  }
}
