
import { db } from '../db';
import { animalsTable } from '../db/schema';
import { type CreateAnimalInput, type Animal } from '../schema';

export const createAnimal = async (input: CreateAnimalInput): Promise<Animal> => {
  try {
    // Insert animal record
    const result = await db.insert(animalsTable)
      .values({
        type: input.type,
        owner_id: input.owner_id,
        weight: input.weight !== null ? input.weight.toString() : null, // Convert number to string for numeric column, preserve null
        notes: input.notes
        // current_stage defaults to 'registration' in schema
        // registration_date and created_at default to now() in schema
      })
      .returning()
      .execute();

    // Convert numeric fields back to numbers before returning
    const animal = result[0];
    return {
      ...animal,
      weight: animal.weight !== null ? parseFloat(animal.weight) : null // Convert string back to number, preserve null
    };
  } catch (error) {
    console.error('Animal creation failed:', error);
    throw error;
  }
};
