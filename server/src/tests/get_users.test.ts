
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable } from '../db/schema';
import { type CreateUserInput } from '../schema';
import { getUsers } from '../handlers/get_users';

// Test user inputs
const testUsers: CreateUserInput[] = [
  {
    name: 'John Doe',
    email: 'john@example.com',
    phone: '123-456-7890',
    role: 'Shohibul Qurban'
  },
  {
    name: 'Jane Smith',
    email: 'jane@example.com',
    phone: null,
    role: 'Panitia/Admin'
  },
  {
    name: 'Bob Wilson',
    email: 'bob@example.com',
    phone: '987-654-3210',
    role: 'Shohibul Qurban'
  }
];

describe('getUsers', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no users exist', async () => {
    const result = await getUsers();
    expect(result).toEqual([]);
  });

  it('should return all users from database', async () => {
    // Create test users
    await db.insert(usersTable)
      .values(testUsers)
      .execute();

    const result = await getUsers();

    expect(result).toHaveLength(3);
    
    // Verify all users are returned
    const userNames = result.map(user => user.name).sort();
    expect(userNames).toEqual(['Bob Wilson', 'Jane Smith', 'John Doe']);
    
    // Verify user properties
    const johnUser = result.find(user => user.name === 'John Doe');
    expect(johnUser).toBeDefined();
    expect(johnUser!.email).toEqual('john@example.com');
    expect(johnUser!.phone).toEqual('123-456-7890');
    expect(johnUser!.role).toEqual('Shohibul Qurban');
    expect(johnUser!.id).toBeDefined();
    expect(johnUser!.created_at).toBeInstanceOf(Date);
  });

  it('should return users with different roles', async () => {
    // Create test users
    await db.insert(usersTable)
      .values(testUsers)
      .execute();

    const result = await getUsers();

    const shohibulUsers = result.filter(user => user.role === 'Shohibul Qurban');
    const adminUsers = result.filter(user => user.role === 'Panitia/Admin');

    expect(shohibulUsers).toHaveLength(2);
    expect(adminUsers).toHaveLength(1);
    
    // Verify specific role users
    expect(shohibulUsers.map(u => u.name).sort()).toEqual(['Bob Wilson', 'John Doe']);
    expect(adminUsers[0].name).toEqual('Jane Smith');
  });

  it('should handle users with null phone numbers', async () => {
    // Create test users
    await db.insert(usersTable)
      .values(testUsers)
      .execute();

    const result = await getUsers();

    const userWithNullPhone = result.find(user => user.name === 'Jane Smith');
    expect(userWithNullPhone).toBeDefined();
    expect(userWithNullPhone!.phone).toBeNull();
  });
});
