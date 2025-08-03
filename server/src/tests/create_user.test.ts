
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable } from '../db/schema';
import { type CreateUserInput } from '../schema';
import { createUser } from '../handlers/create_user';
import { eq } from 'drizzle-orm';

// Test inputs for different user roles
const adminInput: CreateUserInput = {
  name: 'Admin User',
  email: 'admin@example.com',
  phone: '+6281234567890',
  role: 'Panitia/Admin'
};

const shohibulQurbanInput: CreateUserInput = {
  name: 'Shohibul Qurban User',
  email: 'shohibul@example.com',
  phone: null,
  role: 'Shohibul Qurban'
};

describe('createUser', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a Panitia/Admin user', async () => {
    const result = await createUser(adminInput);

    // Basic field validation
    expect(result.name).toEqual('Admin User');
    expect(result.email).toEqual('admin@example.com');
    expect(result.phone).toEqual('+6281234567890');
    expect(result.role).toEqual('Panitia/Admin');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should create a Shohibul Qurban user', async () => {
    const result = await createUser(shohibulQurbanInput);

    // Basic field validation
    expect(result.name).toEqual('Shohibul Qurban User');
    expect(result.email).toEqual('shohibul@example.com');
    expect(result.phone).toBeNull();
    expect(result.role).toEqual('Shohibul Qurban');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save user to database', async () => {
    const result = await createUser(adminInput);

    // Query using proper drizzle syntax
    const users = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, result.id))
      .execute();

    expect(users).toHaveLength(1);
    expect(users[0].name).toEqual('Admin User');
    expect(users[0].email).toEqual('admin@example.com');
    expect(users[0].phone).toEqual('+6281234567890');
    expect(users[0].role).toEqual('Panitia/Admin');
    expect(users[0].created_at).toBeInstanceOf(Date);
  });

  it('should enforce email uniqueness', async () => {
    // Create first user
    await createUser(adminInput);

    // Try to create another user with same email
    const duplicateEmailInput: CreateUserInput = {
      name: 'Different Name',
      email: 'admin@example.com', // Same email
      phone: '+6289876543210',
      role: 'Shohibul Qurban'
    };

    await expect(createUser(duplicateEmailInput)).rejects.toThrow(/duplicate key value/i);
  });

  it('should handle null phone numbers', async () => {
    const nullPhoneInput: CreateUserInput = {
      name: 'User Without Phone',
      email: 'nophone@example.com',
      phone: null,
      role: 'Panitia/Admin'
    };

    const result = await createUser(nullPhoneInput);
    
    expect(result.phone).toBeNull();
    
    // Verify in database
    const users = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, result.id))
      .execute();

    expect(users[0].phone).toBeNull();
  });
});
