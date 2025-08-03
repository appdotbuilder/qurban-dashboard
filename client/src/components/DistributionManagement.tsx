
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
import type { AnimalWithOwner, User, CreateDistributionInput, DistributionRecord } from '../../../server/src/schema';

interface DistributionManagementProps {
  animals: AnimalWithOwner[];
  currentUser: User;
}

export function DistributionManagement({ animals, currentUser }: DistributionManagementProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [distributions, setDistributions] = useState<DistributionRecord[]>([]);
  const [isLoadingDistributions, setIsLoadingDistributions] = useState(false);
  
  const [formData, setFormData] = useState<CreateDistributionInput>({
    animal_id: 0,
    recipient_category: 'Shohibul Qurban',
    recipient_name: null,
    weight_distributed: 0,
    distributed_by: currentUser.id,
    notes: null
  });

  const recipientCategories = [
    'Shohibul Qurban',
    'Warga',
    'Fakir Miskin',
    'Proposal',
    'Panitia'
  ] as const;

  const loadDistributions = async () => {
    setIsLoadingDistributions(true);
    try {
      const result = await trpc.getDistributions.query();
      setDistributions(result);
    } catch (error) {
      console.error('Failed to load distributions:', error);
    } finally {
      setIsLoadingDistributions(false);
    }
  };

  const handleCreateDistribution = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.animal_id === 0) {
      alert('Please select an animal');
      return;
    }

    setIsCreating(true);
    try {
      const newDistribution = await trpc.createDistribution.mutate(formData);
      setDistributions([...distributions, newDistribution]);
      
      setFormData({
        animal_id: 0,
        recipient_category: 'Shohibul Qurban',
        recipient_name: null,
        weight_distributed: 0,
        distributed_by: currentUser.id,
        notes: null
      });
      setIsDialogOpen(false);
    } catch (error) {
      console.error('Failed to create distribution:', error);
      alert('Failed to record distribution. Please try again.');
    } finally {
      setIsCreating(false);
    }
  };

  const getStatusBadge = (status: string) => {
    return status === 'completed' 
      ? <Badge className="bg-green-500 text-white">✅ Completed</Badge>
      : <Badge className="bg-yellow-500 text-white">⏳ Pending</Badge>;
  };

  const getCategoryEmoji = (category: string) => {
    const emojis: Record<string, string> = {
      'Shohibul Qurban': '👤',
      'Warga': '🏘️',
      'Fakir Miskin': '🤲',
      'Proposal': '📋',
      'Panitia': '🛡️'
    };
    return emojis[category] || '📦';
  };

  // Filter animals that are at distribution stage
  const distributionReadyAnimals = animals.filter((animal: AnimalWithOwner) => 
    animal.current_stage === 'distribution'
  );

  return (
    <Card className="bg-white shadow-lg">
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="text-xl text-green-800">📦 Distribution Management</CardTitle>
            <CardDescription>Record and track meat distribution to recipients</CardDescription>
          </div>
          <div className="flex gap-2">
            <Button onClick={loadDistributions} variant="outline">
              📋 Load Records
            </Button>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-purple-600 hover:bg-purple-700">
                  ➕ Record Distribution
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Record New Distribution</DialogTitle>
                  <DialogDescription>
                    Record meat distribution to recipients.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleCreateDistribution} className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Animal</label>
                    <Select 
                      value={formData.animal_id === 0 ? 'none' : formData.animal_id.toString()} 
                      onValueChange={(value: string) => 
                        setFormData((prev: CreateDistributionInput) => ({ 
                          ...prev, 
                          animal_id: value === 'none' ? 0 : parseInt(value) 
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select animal for distribution" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none" disabled>Select animal for distribution</SelectItem>
                        {distributionReadyAnimals.map((animal: AnimalWithOwner) => (
                          <SelectItem key={animal.id} value={animal.id.toString()}>
                            {animal.type === 'cow' ? '🐄' : '🐐'} {animal.type} #{animal.id} - {animal.owner_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {distributionReadyAnimals.length === 0 && (
                      <p className="text-sm text-red-600 mt-1">
                        No animals ready for distribution. Animals must reach the distribution stage first.
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="text-sm font-medium">Recipient Category</label>
                    <Select 
                      value={formData.recipient_category} 
                      onValueChange={(value: typeof recipientCategories[number]) => 
                        setFormData((prev: CreateDistributionInput) => ({ ...prev, recipient_category: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {recipientCategories.map((category) => (
                          <SelectItem key={category} value={category}>
                            {getCategoryEmoji(category)} {category}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-sm font-medium">Recipient Name - Optional</label>
                    <Input
                      placeholder="Enter recipient name"
                      value={formData.recipient_name || ''}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setFormData((prev: CreateDistributionInput) => ({ 
                          ...prev, 
                          recipient_name: e.target.value || null 
                        }))
                      }
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium">Weight Distributed (kg)</label>
                    <Input
                      type="number"
                      placeholder="Enter weight in kg"
                      value={formData.weight_distributed}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setFormData((prev: CreateDistributionInput) => ({ 
                          ...prev, 
                          weight_distributed: parseFloat(e.target.value) || 0 
                        }))
                      }
                      step="0.1"
                      min="0"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium">Distribution Notes - Optional</label>
                    <Textarea
                      placeholder="Any notes about this distribution"
                      value={formData.notes || ''}
                      onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                        setFormData((prev: CreateDistributionInput) => ({ 
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
                    <Button type="submit" disabled={isCreating || distributionReadyAnimals.length === 0}>
                      {isCreating ? 'Recording...' : 'Record Distribution'}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Animals Ready for Distribution */}
        <div className="mb-6">
          <h3 className="font-semibold text-lg mb-3">🎯 Ready for Distribution</h3>
          {distributionReadyAnimals.length === 0 ? (
            <Alert>
              <AlertDescription>
                No animals are currently ready for distribution. Complete the processing stages first.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="grid gap-3">
              {distributionReadyAnimals.map((animal: AnimalWithOwner) => (
                <div key={animal.id} className="border rounded-lg p-3 bg-green-50">
                  <div className="flex justify-between items-center">
                    <div>
                      <span className="font-medium">
                        {animal.type === 'cow' ? '🐄' : '🐐'} 
                        {animal.type.charAt(0).toUpperCase() + animal.type.slice(1)} #{animal.id}
                      </span>
                      <span className="text-gray-600 ml-2">- {animal.owner_name}</span>
                      {animal.weight && (
                        <span className="text-gray-600 ml-2">({animal.weight} kg)</span>
                      )}
                    </div>
                    <Badge className="bg-green-500 text-white">
                      Ready to Distribute
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Distribution Records */}
        <div>
          <h3 className="font-semibold text-lg mb-3">📋 Distribution Records</h3>
          {isLoadingDistributions ? (
            <div className="text-center py-4">Loading distribution records...</div>
          ) : distributions.length === 0 ? (
            <Alert>
              <AlertDescription>
                No distribution records yet. Click "Load Records" to see existing distributions or "Record Distribution" to add new ones.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-4">
              {distributions.map((distribution: DistributionRecord) => {
                const animal = animals.find((a: AnimalWithOwner) => a.id === distribution.animal_id);
                return (
                  <div key={distribution.id} className="border rounded-lg p-4 bg-gray-50">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h4 className="font-semibold flex items-center gap-2">
                          {getCategoryEmoji(distribution.recipient_category)} 
                          {distribution.recipient_category}
                          {distribution.recipient_name && (
                            <span className="text-gray-600">- {distribution.recipient_name}</span>
                          )}
                        </h4>
                        <p className="text-gray-600">
                          From: {animal ? `${animal.type} #${animal.id} (${animal.owner_name})` : `Animal #${distribution.animal_id}`}
                        </p>
                        <p className="text-gray-600">Weight: {distribution.weight_distributed} kg</p>
                      </div>
                      {getStatusBadge(distribution.status)}
                    </div>
                
                    
                    <div className="text-sm text-gray-600">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <span className="font-medium">Created:</span> {distribution.created_at.toLocaleDateString()}
                        </div>
                        {distribution.distributed_at && (
                          <div>
                            <span className="font-medium">Distributed:</span> {distribution.distributed_at.toLocaleDateString()}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {distribution.notes && (
                      <p className="text-sm text-gray-600 italic bg-white p-2 rounded mt-2">
                        Notes: {distribution.notes}
                      </p>
                    )}
                  </div>
                );
              })}
              
              {/* Summary */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
                <h4 className="font-semibold text-blue-800 mb-2">📊 Distribution Summary</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Total Records:</span> {distributions.length}
                  </div>
                  <div>
                    <span className="font-medium">Total Weight:</span> {' '}
                    {distributions.reduce((sum: number, d: DistributionRecord) => sum + d.weight_distributed, 0).toFixed(1)} kg
                  </div>
                  <div>
                    <span className="font-medium">Completed:</span> {' '}
                    {distributions.filter((d: DistributionRecord) => d.status === 'completed').length}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
