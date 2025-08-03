
import { db } from '../db';
import { distributionRecordsTable } from '../db/schema';
import { type DistributionRecord } from '../schema';

export async function getDistributions(): Promise<DistributionRecord[]> {
  try {
    const results = await db.select()
      .from(distributionRecordsTable)
      .execute();

    // Convert numeric fields back to numbers
    return results.map(record => ({
      ...record,
      weight_distributed: parseFloat(record.weight_distributed)
    }));
  } catch (error) {
    console.error('Failed to fetch distribution records:', error);
    throw error;
  }
}
