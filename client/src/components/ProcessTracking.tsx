
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { trpc } from '@/utils/trpc';
import type { AnimalWithOwner, User, UpdateAnimalStageInput } from '../../../server/src/schema';

interface ProcessTrackingProps {
  animals: AnimalWithOwner[];
  currentUser: User;
  onAnimalsChange: (animals: AnimalWithOwner[]) => void;
}

export function ProcessTracking({ animals, currentUser, onAnimalsChange }: ProcessTrackingProps) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedAnimal, setSelectedAnimal] = useState<AnimalWithOwner | null>(null);
  
  const [updateData, setUpdateData] = useState<UpdateAnimalStageInput>({
    animal_id: 0,
    new_stage: 'registration',
    weight_recorded: null,
    notes: null,
    processed_by: currentUser.id
  });

  const processStages = [
    'registration',
    'slaughtering',
    'skinning',
    'meat_weighing',
    'meat_chopping',
    'bone_cutting',
    'packing',
    'distribution'
  ] as const;

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

  const getStageProgress = (stage: string) => {
    return ((processStages.indexOf(stage as typeof processStages[number]) + 1) / processStages.length) * 100;
  };

  const formatStageLabel = (stage: string) => {
    return stage.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const getNextStage = (currentStage: string) => {
    const currentIndex = processStages.indexOf(currentStage as typeof processStages[number]);
    return currentIndex < processStages.length - 1 ? processStages[currentIndex + 1] : null;
  };

  const handleUpdateStage = (animal: AnimalWithOwner) => {
    const nextStage = getNextStage(animal.current_stage);
    if (!nextStage) {
      alert('This animal has already completed all process stages.');
      return;
    }

    setSelectedAnimal(animal);
    setUpdateData({
      animal_id: animal.id,
      new_stage: nextStage,
      weight_recorded: null,
      notes: null,
      processed_by: currentUser.id
    });
    setIsDialogOpen(true);
  };

  const handleUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdating(true);
    try {
      await trpc.updateAnimalStage.mutate(updateData);
      
      // Update the animal in the list
      const updatedAnimals = animals.map((animal: AnimalWithOwner) => 
        animal.id === updateData.animal_id 
          ? { ...animal, current_stage: updateData.new_stage }
          : animal
      );
      onAnimalsChange(updatedAnimals);
      
      setIsDialogOpen(false);
      setSelectedAnimal(null);
    } catch (error) {
      console.error('Failed to update animal stage:', error);
      alert('Failed to update process stage. Please try again.');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <Card className="bg-white shadow-lg">
      <CardHeader>
        <CardTitle className="text-xl text-green-800">⚙️ Process Tracking</CardTitle>
        <CardDescription>Track and update the process stages of animals</CardDescription>
      </CardHeader>
      <CardContent>
        {animals.length === 0 ? (
          <Alert>
            <AlertDescription>
              No animals registered yet. Add animals in the Animals tab first.
            </AlertDescription>
          </Alert>
        ) : (
          <div className="space-y-6">
            {/* Process Stages Legend */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold mb-3">Process Stages:</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {processStages.map((stage, index) => (
                  <div key={stage} className="flex items-center gap-2 text-sm">
                    <div className={`w-3 h-3 rounded-full ${getStageColor(stage)}`}></div>
                    <span>{index + 1}. {formatStageLabel(stage)}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              {animals.map((animal: AnimalWithOwner) => (
                <div key={animal.id} className="border rounded-lg p-4 bg-gray-50">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-semibold text-lg flex items-center gap-2">
                        {animal.type === 'cow' ? '🐄' : '🐐'} 
                        {animal.type.charAt(0).toUpperCase() + animal.type.slice(1)} #{animal.id}
                      </h3>
                      <p className="text-gray-600">Owner: {animal.owner_name}</p>
                      {animal.weight && (
                        <p className="text-gray-600">Weight: {animal.weight} kg</p>
                      )}
                    </div>
                    <div className="text-right">
                      <Badge className={getStageColor(animal.current_stage) + ' text-white mb-2'}>
                        {formatStageLabel(animal.current_stage)}
                      </Badge>
                      <div className="text-sm text-gray-600">
                        Stage {processStages.indexOf(animal.current_stage as typeof processStages[number]) + 1} of {processStages.length}
                      </div>
                    </div>
                  </div>

                  <div className="mb-4">
                    <div className="flex justify-between text-sm text-gray-600 mb-1">
                      <span>Process Progress</span>
                      <span>{getStageProgress(animal.current_stage).toFixed(0)}%</span>
                    </div>
                    <Progress value={getStageProgress(animal.current_stage)} className="h-3" />
                  </div>

                  <div className="flex justify-between items-center">
                    <div className="text-sm text-gray-600">
                      {animal.current_stage === 'distribution' ? (
                        <span className="text-green-600 font-medium">✅ Process Complete</span>
                      ) : (
                        <span>Next: {formatStageLabel(getNextStage(animal.current_stage) || '')}</span>
                      )}
                    </div>
                    
                    {animal.current_stage !== 'distribution' && (
                      <Button 
                        onClick={() => handleUpdateStage(animal)}
                        size="sm"
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        Advance Stage →
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Update Stage Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Update Process Stage</DialogTitle>
              <DialogDescription>
                {selectedAnimal && (
                  <>Update stage for {selectedAnimal.type} #{selectedAnimal.id} owned by {selectedAnimal.owner_name}</>
                )}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleUpdateSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-medium">New Stage</label>
                <Select 
                  value={updateData.new_stage || ''} 
                  onValueChange={(value: typeof processStages[number]) => 
                    setUpdateData((prev: UpdateAnimalStageInput) => ({ ...prev, new_stage: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {processStages.map((stage) => (
                      <SelectItem key={stage} value={stage}>
                        {formatStageLabel(stage)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium">Weight Recorded (kg) - Optional</label>
                <Input
                  type="number"
                  placeholder="Enter weight if applicable"
                  value={updateData.weight_recorded || ''}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setUpdateData((prev: UpdateAnimalStageInput) => ({ 
                      ...prev, 
                      weight_recorded: e.target.value ? parseFloat(e.target.value) : null 
                    }))
                  }
                  step="0.1"
                  min="0"
                />
              </div>

              <div>
                <label className="text-sm font-medium">Process Notes - Optional</label>
                <Textarea
                  placeholder="Any notes about this process stage"
                  value={updateData.notes || ''}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                    setUpdateData((prev: UpdateAnimalStageInput) => ({ 
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
                <Button type="submit" disabled={isUpdating}>
                  {isUpdating ? 'Updating...' : 'Update Stage'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
