
import { db } from '../db';
import { processLogsTable } from '../db/schema';
import { type ProcessLog } from '../schema';

export const getProcessLogs = async (): Promise<ProcessLog[]> => {
  try {
    const results = await db.select()
      .from(processLogsTable)
      .execute();

    // Convert numeric fields back to numbers
    return results.map(log => ({
      ...log,
      weight_recorded: log.weight_recorded ? parseFloat(log.weight_recorded) : null
    }));
  } catch (error) {
    console.error('Failed to fetch process logs:', error);
    throw error;
  }
};
