
import { db } from '../db';
import { animalsTable, usersTable } from '../db/schema';
import { type AnimalWithOwner } from '../schema';
import { eq } from 'drizzle-orm';

export async function getAnimalsByOwner(ownerId: number): Promise<AnimalWithOwner[]> {
  try {
    const results = await db.select()
      .from(animalsTable)
      .innerJoin(usersTable, eq(animalsTable.owner_id, usersTable.id))
      .where(eq(animalsTable.owner_id, ownerId))
      .execute();

    return results.map(result => ({
      id: result.animals.id,
      type: result.animals.type,
      owner_id: result.animals.owner_id,
      owner_name: result.users.name,
      owner_email: result.users.email,
      current_stage: result.animals.current_stage,
      weight: result.animals.weight ? parseFloat(result.animals.weight) : null,
      registration_date: result.animals.registration_date,
      slaughter_date: result.animals.slaughter_date,
      completion_date: result.animals.completion_date,
      notes: result.animals.notes,
      created_at: result.animals.created_at
    }));
  } catch (error) {
    console.error('Get animals by owner failed:', error);
    throw error;
  }
}
