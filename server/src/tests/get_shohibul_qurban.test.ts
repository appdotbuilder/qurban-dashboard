
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable } from '../db/schema';
import { type CreateUserInput } from '../schema';
import { getShohibulQurban } from '../handlers/get_shohibul_qurban';

// Test user inputs
const shohibulQurbanUser: CreateUserInput = {
  name: 'Ahmad Shohibul',
  email: 'ahmad@example.com',
  phone: '08123456789',
  role: 'Shohibul Qurban'
};

const panitiaUser: CreateUserInput = {
  name: 'Pak Panitia',
  email: 'panitia@example.com',
  phone: '08987654321',
  role: 'Panitia/Admin'
};

const anotherShohibulQurbanUser: CreateUserInput = {
  name: 'Budi Shohibul',
  email: 'budi@example.com',
  phone: null,
  role: 'Shohibul Qurban'
};

describe('getShohibulQurban', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no Shohibul Qurban users exist', async () => {
    const result = await getShohibulQurban();
    expect(result).toEqual([]);
  });

  it('should return only Shohibul Qurban users', async () => {
    // Create test users
    await db.insert(usersTable).values([
      shohibulQurbanUser,
      panitiaUser,
      anotherShohibulQurbanUser
    ]).execute();

    const result = await getShohibulQurban();

    expect(result).toHaveLength(2);
    
    // Verify all returned users have Shohibul Qurban role
    result.forEach(user => {
      expect(user.role).toEqual('Shohibul Qurban');
    });

    // Verify specific users are returned
    const names = result.map(user => user.name);
    expect(names).toContain('Ahmad Shohibul');
    expect(names).toContain('Budi Shohibul');
    expect(names).not.toContain('Pak Panitia');
  });

  it('should return users with all expected fields', async () => {
    await db.insert(usersTable).values(shohibulQurbanUser).execute();

    const result = await getShohibulQurban();

    expect(result).toHaveLength(1);
    const user = result[0];

    expect(user.id).toBeDefined();
    expect(user.name).toEqual('Ahmad Shohibul');
    expect(user.email).toEqual('ahmad@example.com');
    expect(user.phone).toEqual('08123456789');
    expect(user.role).toEqual('Shohibul Qurban');
    expect(user.created_at).toBeInstanceOf(Date);
  });

  it('should handle users with null phone numbers', async () => {
    await db.insert(usersTable).values(anotherShohibulQurbanUser).execute();

    const result = await getShohibulQurban();

    expect(result).toHaveLength(1);
    const user = result[0];

    expect(user.name).toEqual('Budi Shohibul');
    expect(user.phone).toBeNull();
    expect(user.role).toEqual('Shohibul Qurban');
  });
});
