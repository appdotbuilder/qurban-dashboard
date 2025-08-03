
import { db } from '../db';
import { animalsTable, processLogsTable } from '../db/schema';
import { type UpdateAnimalStageInput, type Animal } from '../schema';
import { eq } from 'drizzle-orm';

export const updateAnimalStage = async (input: UpdateAnimalStageInput): Promise<Animal> => {
  try {
    // First, verify the animal exists
    const existingAnimal = await db.select()
      .from(animalsTable)
      .where(eq(animalsTable.id, input.animal_id))
      .execute();

    if (existingAnimal.length === 0) {
      throw new Error(`Animal with id ${input.animal_id} not found`);
    }

    // Prepare update data with conditional timestamps
    const updateData: any = {
      current_stage: input.new_stage,
    };

    // Set weight if provided
    if (input.weight_recorded !== null && input.weight_recorded !== undefined) {
      updateData.weight = input.weight_recorded.toString();
    }

    // Set notes if provided
    if (input.notes !== null && input.notes !== undefined) {
      updateData.notes = input.notes;
    }

    // Set stage-specific timestamps
    if (input.new_stage === 'slaughtering') {
      updateData.slaughter_date = new Date();
    } else if (input.new_stage === 'distribution') {
      updateData.completion_date = new Date();
    }

    // Update the animal
    const updatedAnimals = await db.update(animalsTable)
      .set(updateData)
      .where(eq(animalsTable.id, input.animal_id))
      .returning()
      .execute();

    // Create process log entry
    await db.insert(processLogsTable)
      .values({
        animal_id: input.animal_id,
        stage: input.new_stage,
        weight_recorded: input.weight_recorded ? input.weight_recorded.toString() : null,
        processed_by: input.processed_by,
        notes: input.notes || null,
      })
      .execute();

    // Convert numeric fields back to numbers
    const updatedAnimal = updatedAnimals[0];
    return {
      ...updatedAnimal,
      weight: updatedAnimal.weight ? parseFloat(updatedAnimal.weight) : null,
    };
  } catch (error) {
    console.error('Animal stage update failed:', error);
    throw error;
  }
};
