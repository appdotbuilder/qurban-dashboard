
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { trpc } from '@/utils/trpc';
import type { AnimalWithOwner, User, CreateAnimalInput } from '../../../server/src/schema';

interface AnimalManagementProps {
  animals: AnimalWithOwner[];
  onAnimalsChange: (animals: AnimalWithOwner[]) => void;
  currentUser: User;
}

export function AnimalManagement({ animals, onAnimalsChange }: AnimalManagementProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [shohibulQurban, setShohibulQurban] = useState<User[]>([]);
  
  const [formData, setFormData] = useState<CreateAnimalInput>({
    type: 'cow',
    owner_id: 0,
    weight: null,
    notes: null
  });

  const loadShohibulQurban = async () => {
    try {
      const result = await trpc.getShohibulQurban.query();
      setShohibulQurban(result);
    } catch (error) {
      console.error('Failed to load Shohibul Qurban:', error);
    }
  };

  const handleCreateAnimal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.owner_id === 0) {
      alert('Please select an owner');
      return;
    }

    setIsCreating(true);
    try {
      const newAnimal = await trpc.createAnimal.mutate(formData);
      
      // Find owner details to create AnimalWithOwner
      const owner = shohibulQurban.find(u => u.id === formData.owner_id);
      const animalWithOwner: AnimalWithOwner = {
        ...newAnimal,
        owner_name: owner?.name || 'Unknown',
        owner_email: owner?.email || 'unknown@email.com'
      };
      
      onAnimalsChange([...animals, animalWithOwner]);
      
      setFormData({
        type: 'cow',
        owner_id: 0,
        weight: null,
        notes: null
      });
      setIsDialogOpen(false);
    } catch (error) {
      console.error('Failed to create animal:', error);
      alert('Failed to create animal. Please try again.');
    } finally {
      setIsCreating(false);
    }
  };

  const getStageColor = (stage: string) => {
    const colors: Record<string, string> = {
      registration: 'bg-blue-500',
      slaughtering: 'bg-red-500',
      skinning: 'bg-orange-500',
      meat_weighing: 'bg-yellow-500',
      meat_chopping: 'bg-green-500',
      bone_cutting: 'bg-purple-500',
      packing: 'bg-indigo-500',
      distribution: 'bg-gray-500'
    };
    return colors[stage] || 'bg-gray-400';
  };

  const formatStageLabel = (stage: string) => {
    return stage.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  return (
    <Card className="bg-white shadow-lg">
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="text-xl text-green-800">🐄 Animal Management</CardTitle>
            <CardDescription>Register and manage sacrificial animals</CardDescription>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={loadShohibulQurban} className="bg-green-600 hover:bg-green-700">
                ➕ Add Animal
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Register New Animal</DialogTitle>
                <DialogDescription>
                  Add a new sacrificial animal to the system.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateAnimal} className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Animal Type</label>
                  <Select 
                    value={formData.type} 
                    onValueChange={(value: 'cow' | 'goat') => 
                      setFormData((prev: CreateAnimalInput) => ({ ...prev, type: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cow">🐄 Cow</SelectItem>
                      <SelectItem value="goat">🐐 Goat</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium">Owner (Shohibul Qurban)</label>
                  <Select 
                    value={formData.owner_id === 0 ? 'none' : formData.owner_id.toString()} 
                    onValueChange={(value: string) => 
                      setFormData((prev: CreateAnimalInput) => ({ 
                        ...prev, 
                        owner_id: value === 'none' ? 0 : parseInt(value) 
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select owner" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none" disabled>Select owner</SelectItem>
                      {shohibulQurban.map((person: User) => (
                        <SelectItem key={person.id} value={person.id.toString()}>
                          {person.name} ({person.email})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium">Weight (kg) - Optional</label>
                  <Input
                    type="number"
                    placeholder="Enter weight in kg"
                    value={formData.weight || ''}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setFormData((prev: CreateAnimalInput) => ({ 
                        ...prev, 
                        weight: e.target.value ? parseFloat(e.target.value) : null 
                      }))
                    }
                    step="0.1"
                    min="0"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">Notes - Optional</label>
                  <Textarea
                    placeholder="Any additional notes about the animal"
                    value={formData.notes || ''}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                      setFormData((prev: CreateAnimalInput) => ({ 
                        ...prev, 
                        notes: e.target.value || null 
                      }))
                    }
                    rows={3}
                  />
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
                    {isCreating ? 'Creating...' : 'Create Animal'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {animals.length === 0 ? (
          <Alert>
            <AlertDescription>
              No animals registered yet. Click "Add Animal" to register the first one.
            </AlertDescription>
          </Alert>
        ) : (
          <div className="space-y-4">
            {animals.map((animal: AnimalWithOwner) => (
              <div key={animal.id} className="border rounded-lg p-4 bg-gray-50">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-semibold text-lg flex items-center gap-2">
                      {animal.type === 'cow' ? '🐄' : '🐐'} 
                      {animal.type.charAt(0).toUpperCase() + animal.type.slice(1)} #{animal.id}
                    </h3>
                    <p className="text-gray-600">Owner: {animal.owner_name}</p>
                    <p className="text-sm text-gray-500">{animal.owner_email}</p>
                    {animal.weight && (
                      <p className="text-gray-600">Weight: {animal.weight} kg</p>
                    )}
                  </div>
                  <Badge className={getStageColor(animal.current_stage) + ' text-white'}>
                    {formatStageLabel(animal.current_stage)}
                  </Badge>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 mb-3">
                  <div>
                    <span className="font-medium">Registered:</span> {animal.registration_date.toLocaleDateString()}
                  </div>
                  {animal.slaughter_date && (
                    <div>
                      <span className="font-medium">Slaughtered:</span> {animal.slaughter_date.toLocaleDateString()}
                    </div>
                  )}
                  {animal.completion_date && (
                    <div>
                      <span className="font-medium">Completed:</span> {animal.completion_date.toLocaleDateString()}
                    </div>
                  )}
                </div>
                
                {animal.notes && (
                  <p className="text-sm text-gray-600 italic bg-white p-2 rounded">
                    Notes: {animal.notes}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
