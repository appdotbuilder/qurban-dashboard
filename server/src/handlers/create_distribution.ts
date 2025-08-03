
import { db } from '../db';
import { distributionRecordsTable, animalsTable, usersTable } from '../db/schema';
import { type CreateDistributionInput, type DistributionRecord } from '../schema';
import { eq } from 'drizzle-orm';

export async function createDistribution(input: CreateDistributionInput): Promise<DistributionRecord> {
  try {
    // Verify that the animal exists
    const animal = await db.select()
      .from(animalsTable)
      .where(eq(animalsTable.id, input.animal_id))
      .execute();

    if (animal.length === 0) {
      throw new Error(`Animal with id ${input.animal_id} not found`);
    }

    // Verify that the distributed_by user exists
    const user = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, input.distributed_by))
      .execute();

    if (user.length === 0) {
      throw new Error(`User with id ${input.distributed_by} not found`);
    }

    // Insert distribution record
    const result = await db.insert(distributionRecordsTable)
      .values({
        animal_id: input.animal_id,
        recipient_category: input.recipient_category,
        recipient_name: input.recipient_name,
        weight_distributed: input.weight_distributed.toString(), // Convert number to string for numeric column
        status: 'completed', // Set as completed upon creation
        distributed_at: new Date(), // Set current timestamp
        distributed_by: input.distributed_by,
        notes: input.notes
      })
      .returning()
      .execute();

    // Convert numeric fields back to numbers before returning
    const distributionRecord = result[0];
    return {
      ...distributionRecord,
      weight_distributed: parseFloat(distributionRecord.weight_distributed) // Convert string back to number
    };
  } catch (error) {
    console.error('Distribution creation failed:', error);
    throw error;
  }
}
