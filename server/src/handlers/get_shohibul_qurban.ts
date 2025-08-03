
import { db } from '../db';
import { usersTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { type User } from '../schema';

export async function getShohibulQurban(): Promise<User[]> {
  try {
    const results = await db.select()
      .from(usersTable)
      .where(eq(usersTable.role, 'Shohibul Qurban'))
      .execute();

    return results;
  } catch (error) {
    console.error('Failed to fetch Shohibul Qurban users:', error);
    throw error;
  }
}
