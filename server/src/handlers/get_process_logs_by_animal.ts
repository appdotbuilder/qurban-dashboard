
import { db } from '../db';
import { processLogsTable } from '../db/schema';
import { type ProcessLog } from '../schema';
import { eq } from 'drizzle-orm';

export const getProcessLogsByAnimal = async (animalId: number): Promise<ProcessLog[]> => {
  try {
    const results = await db.select()
      .from(processLogsTable)
      .where(eq(processLogsTable.animal_id, animalId))
      .execute();

    // Convert numeric fields back to numbers
    return results.map(log => ({
      ...log,
      weight_recorded: log.weight_recorded ? parseFloat(log.weight_recorded) : null
    }));
  } catch (error) {
    console.error('Failed to fetch process logs by animal:', error);
    throw error;
  }
};
