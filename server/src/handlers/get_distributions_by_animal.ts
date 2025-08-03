
import { db } from '../db';
import { distributionRecordsTable } from '../db/schema';
import { type DistributionRecord } from '../schema';
import { eq } from 'drizzle-orm';

export async function getDistributionsByAnimal(animalId: number): Promise<DistributionRecord[]> {
  try {
    const results = await db.select()
      .from(distributionRecordsTable)
      .where(eq(distributionRecordsTable.animal_id, animalId))
      .execute();

    // Convert numeric fields back to numbers
    return results.map(record => ({
      ...record,
      weight_distributed: parseFloat(record.weight_distributed)
    }));
  } catch (error) {
    console.error('Failed to fetch distributions by animal:', error);
    throw error;
  }
}
