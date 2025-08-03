
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { trpc } from '@/utils/trpc';
import type { User, CreateUserInput } from '../../../server/src/schema';

interface UserManagementProps {
  users: User[];
  onUsersChange: (users: User[]) => void;
}

export function UserManagement({ users, onUsersChange }: UserManagementProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  
  const [formData, setFormData] = useState<CreateUserInput>({
    name: '',
    email: '',
    phone: null,
    role: 'Shohibul Qurban'
  });

  const loadAllUsers = async () => {
    try {
      const result = await trpc.getUsers.query();
      setAllUsers(result);
    } catch (error) {
      console.error('Failed to load users:', error);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);
    try {
      const newUser = await trpc.createUser.mutate(formData);
      
      // Update the appropriate list based on role
      if (formData.role === 'Shohibul Qurban') {
        onUsersChange([...users, newUser]);
      }
      setAllUsers([...allUsers, newUser]);
      
      setFormData({
        name: '',
        email: '',
        phone: null,
        role: 'Shohibul Qurban'
      });
      setIsDialogOpen(false);
    } catch (error) {
      console.error('Failed to create user:', error);
      alert('Failed to create user. Please try again.');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Shohibul Qurban Section */}
      <Card className="bg-white shadow-lg">
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-xl text-green-800">👥 Shohibul Qurban</CardTitle>
              <CardDescription>Participants who registered for qurban</CardDescription>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-green-600 hover:bg-green-700">
                  ➕ Add Person
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Add New Person</DialogTitle>
                  <DialogDescription>
                    Register a new person in the system.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleCreateUser} className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Full Name</label>
                    <Input
                      placeholder="Enter full name"
                      value={formData.name}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setFormData((prev: CreateUserInput) => ({ ...prev, name: e.target.value }))
                      }
                      required
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium">Email Address</label>
                    <Input
                      type="email"
                      placeholder="Enter email address"
                      value={formData.email}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setFormData((prev: CreateUserInput) => ({ ...prev, email: e.target.value }))
                      }
                      required
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium">Phone Number - Optional</label>
                    <Input
                      type="tel"
                      placeholder="Enter phone number"
                      value={formData.phone || ''}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setFormData((prev: CreateUserInput) => ({ 
                          ...prev, 
                          phone: e.target.value || null 
                        }))
                      }
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium">Role</label>
                    <Select 
                      value={formData.role} 
                      onValueChange={(value: 'Panitia/Admin' | 'Shohibul Qurban') => 
                        setFormData((prev: CreateUserInput)  => ({ ...prev, role: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Shohibul Qurban">👤 Shohibul Qurban</SelectItem>
                        <SelectItem value="Panitia/Admin">🛡️ Panitia/Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <DialogFooter>
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setIsDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" disabled={isCreating}>
                      {isCreating ? 'Creating...' : 'Create Person'}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {users.length === 0 ? (
            <Alert>
              <AlertDescription>
                No Shohibul Qurban registered yet. Click "Add Person" to register the first participant.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="grid gap-4">
              {users.map((person: User) => (
                <div key={person.id} className="border rounded-lg p-4 bg-gray-50">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold text-lg">{person.name}</h3>
                      <p className="text-gray-600">{person.email}</p>
                      {person.phone && (
                        <p className="text-gray-600">{person.phone}</p>
                      )}
                    </div>
                    <Badge variant="secondary" className="bg-green-100 text-green-800">
                      {person.role}
                    </Badge>
                  </div>
                  <div className="text-sm text-gray-500 mt-2">
                    Registered: {person.created_at.toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* All Users Section */}
      <Card className="bg-white shadow-lg">
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-xl text-blue-800">🛡️ All System Users</CardTitle>
              <CardDescription>Complete list of all registered users</CardDescription>
            </div>
            <Button onClick={loadAllUsers} variant="outline">
              🔄 Refresh List
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {allUsers.length === 0 ? (
            <div className="text-center py-4">
              <Button onClick={loadAllUsers} variant="outline">
                Load All Users
              </Button>
            </div>
          ) : (
            <div className="grid gap-4">
              {allUsers.map((person: User) => (
                <div key={person.id} className="border rounded-lg p-4 bg-gray-50">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold text-lg">{person.name}</h3>
                      <p className="text-gray-600">{person.email}</p>
                      {person.phone && (
                        <p className="text-gray-600">{person.phone}</p>
                      )}
                    </div>
                    <Badge 
                      variant="secondary" 
                      className={person.role === 'Panitia/Admin' 
                        ? 'bg-blue-100 text-blue-800' 
                        : 'bg-green-100 text-green-800'
                      }
                    >
                      {person.role === 'Panitia/Admin' ? '🛡️' : '👤'} {person.role}
                    </Badge>
                  </div>
                  <div className="text-sm text-gray-500 mt-2">
                    Registered: {person.created_at.toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
