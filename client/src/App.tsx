
import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { trpc } from '@/utils/trpc';
import type { DashboardStats, AnimalWithOwner, User } from '../../server/src/schema';
import { AnimalManagement } from '@/components/AnimalManagement';
import { UserManagement } from '@/components/UserManagement';
import { DistributionManagement } from '@/components/DistributionManagement';
import { ProcessTracking } from '@/components/ProcessTracking';

function App() {
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);
  const [animals, setAnimals] = useState<AnimalWithOwner[]>([]);
  const [shohibulQurban, setShohibulQurban] = useState<User[]>([]);
  const [currentUser] = useState<User>({
    id: 1,
    name: 'Admin User',
    email: 'admin@qurban.org',
    phone: '+62123456789',
    role: 'Panitia/Admin',
    created_at: new Date()
  });
  const [isLoading, setIsLoading] = useState(true);

  const loadDashboardData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [statsResult, animalsResult, shohibulResult] = await Promise.all([
        trpc.getDashboardStats.query(),
        trpc.getAnimals.query(),
        trpc.getShohibulQurban.query()
      ]);
      
      setDashboardStats(statsResult);
      setAnimals(animalsResult);
      setShohibulQurban(shohibulResult);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

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
    const stages = [
      'registration', 'slaughtering', 'skinning', 'meat_weighing',
      'meat_chopping', 'bone_cutting', 'packing', 'distribution'
    ];
    return ((stages.indexOf(stage) + 1) / stages.length) * 100;
  };

  const formatStageLabel = (stage: string) => {
    return stage.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-2xl font-bold text-green-800 mb-2">🕌 Qurban Management System</div>
          <div className="text-gray-600">Loading dashboard...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-4">
      <div className="container mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-green-800 mb-2">
                🕌 Qurban Management Dashboard
              </h1>
              <p className="text-gray-600">
                Welcome, {currentUser.name} ({currentUser.role})
              </p>
            </div>
            <Button onClick={loadDashboardData} variant="outline">
              🔄 Refresh Data
            </Button>
          </div>
        </div>

        {/* Stats Overview */}
        {dashboardStats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="bg-white shadow-lg">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg text-green-800">🐄 Total Animals</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600">
                  {dashboardStats.total_animals}
                </div>
                <div className="text-sm text-gray-600 mt-2">
                  {dashboardStats.total_cows} cows • {dashboardStats.total_goats} goats
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white shadow-lg">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg text-blue-800">⚖️ Total Weight</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-blue-600">
                  {dashboardStats.total_weight.toFixed(1)} kg
                </div>
                <div className="text-sm text-gray-600 mt-2">
                  Available for processing
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white shadow-lg">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg text-purple-800">📦 Distributed</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-purple-600">
                  {dashboardStats.total_distributed_weight.toFixed(1)} kg
                </div>
                <div className="text-sm text-gray-600 mt-2">
                  {dashboardStats.total_weight > 0 
                    ? ((dashboardStats.total_distributed_weight / dashboardStats.total_weight) * 100).toFixed(1)
                    : 0}% distributed
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white shadow-lg">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg text-orange-800">👥 Shohibul Qurban</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-orange-600">
                  {shohibulQurban.length}
                </div>
                <div className="text-sm text-gray-600 mt-2">
                  Registered participants
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Process Stages Overview */}
        {dashboardStats && (
          <Card className="mb-8 bg-white shadow-lg">
            <CardHeader>
              <CardTitle className="text-xl text-green-800">📊 Process Stages Overview</CardTitle>
              <CardDescription>Current status of all animals in the qurban process</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {Object.entries(dashboardStats.animals_by_stage).map(([stage, count]) => (
                  <div key={stage} className="text-center p-4 rounded-lg bg-gray-50">
                    <div className={`w-4 h-4 rounded-full ${getStageColor(stage)} mx-auto mb-2`}></div>
                    <div className="font-semibold text-gray-800">{formatStageLabel(stage)}</div>
                    <div className="text-2xl font-bold text-gray-600">{count}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Role-based content */}
        {currentUser.role === 'Panitia/Admin' ? (
          <Tabs defaultValue="animals" className="space-y-6">
            <TabsList className="grid w-full grid-cols-5 bg-white shadow-sm">
              <TabsTrigger value="animals" className="text-sm">🐄 Animals</TabsTrigger>
              <TabsTrigger value="users" className="text-sm">👥 Users</TabsTrigger>
              <TabsTrigger value="process" className="text-sm">⚙️ Process</TabsTrigger>
              <TabsTrigger value="distribution" className="text-sm">📦 Distribution</TabsTrigger>
              <TabsTrigger value="overview" className="text-sm">📋 Overview</TabsTrigger>
            </TabsList>

            <TabsContent value="animals">
              <AnimalManagement 
                animals={animals}
                onAnimalsChange={setAnimals}
                currentUser={currentUser}
              />
            </TabsContent>

            <TabsContent value="users">
              <UserManagement 
                users={shohibulQurban}
                onUsersChange={setShohibulQurban}
              />
            </TabsContent>

            <TabsContent value="process">
              <ProcessTracking 
                animals={animals}
                currentUser={currentUser}
                onAnimalsChange={setAnimals}
              />
            </TabsContent>

            <TabsContent value="distribution">
              <DistributionManagement 
                animals={animals}
                currentUser={currentUser}
              />
            </TabsContent>

            <TabsContent value="overview">
              <div className="space-y-6">
                {/* Shohibul Qurban List */}
                <Card className="bg-white shadow-lg">
                  <CardHeader>
                    <CardTitle className="text-xl text-green-800">👥 Shohibul Qurban List</CardTitle>
                    <CardDescription>All registered participants</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {shohibulQurban.length === 0 ? (
                      <Alert>
                        <AlertDescription>
                          No Shohibul Qurban registered yet. Add participants in the Users tab.
                        </AlertDescription>
                      </Alert>
                    ) : (
                      <div className="grid gap-4">
                        {shohibulQurban.map((person: User) => (
                          <div key={person.id} className="border rounded-lg p-4 bg-gray-50">
                            <div className="flex justify-between items-start">
                              <div>
                                <h3 className="font-semibold text-lg">{person.name}</h3>
                                <p className="text-gray-600">{person.email}</p>
                                {person.phone && (
                                  <p className="text-gray-600">{person.phone}</p>
                                )}
                              </div>
                              <Badge variant="secondary">
                                {animals.filter((a: AnimalWithOwner) => a.owner_id === person.id).length} animals
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

                {/* Animals Overview */}
                <Card className="bg-white shadow-lg">
                  <CardHeader>
                    <CardTitle className="text-xl text-green-800">🐄 Animals Overview</CardTitle>
                    <CardDescription>Current status of all registered animals</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {animals.length === 0 ? (
                      <Alert>
                        <AlertDescription>
                          No animals registered yet. Add animals in the Animals tab.
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
                                {animal.weight && (
                                  <p className="text-gray-600">Weight: {animal.weight} kg</p>
                                )}
                              </div>
                              <Badge className={getStageColor(animal.current_stage) + ' text-white'}>
                                {formatStageLabel(animal.current_stage)}
                              </Badge>
                            </div>
                            <div className="mb-3">
                              <div className="flex justify-between text-sm text-gray-600 mb-1">
                                <span>Progress</span>
                                <span>{getStageProgress(animal.current_stage).toFixed(0)}%</span>
                              </div>
                              <Progress value={getStageProgress(animal.current_stage)} className="h-2" />
                            </div>
                            {animal.notes && (
                              <p className="text-sm text-gray-600 italic">Notes: {animal.notes}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        ) : (
          // Shohibul Qurban view - limited to their own animals
          <Card className="bg-white shadow-lg">
            <CardHeader>
              <CardTitle className="text-xl text-green-800">🐄 My Qurban Animals</CardTitle>
              <CardDescription>Track the status of your registered animals</CardDescription>
            </CardHeader>
            <CardContent>
              {animals.filter((a: AnimalWithOwner) => a.owner_id === currentUser.id).length === 0 ? (
                <Alert>
                  <AlertDescription>
                    You haven't registered any animals yet. Please contact the administration.
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="space-y-4">
                  {animals
                    .filter((a: AnimalWithOwner) => a.owner_id === currentUser.id)
                    .map((animal: AnimalWithOwner) => (
                      <div key={animal.id} className="border rounded-lg p-4 bg-gray-50">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h3 className="font-semibold text-lg flex items-center gap-2">
                              {animal.type === 'cow' ? '🐄' : '🐐'} 
                              {animal.type.charAt(0).toUpperCase() + animal.type.slice(1)} #{animal.id}
                            </h3>
                            {animal.weight && (
                              <p className="text-gray-600">Weight: {animal.weight} kg</p>
                            )}
                          </div>
                          <Badge className={getStageColor(animal.current_stage) + ' text-white'}>
                            {formatStageLabel(animal.current_stage)}
                          </Badge>
                        </div>
                        <div className="mb-3">
                          <div className="flex justify-between text-sm text-gray-600 mb-1">
                            <span>Process Progress</span>
                            <span>{getStageProgress(animal.current_stage).toFixed(0)}%</span>
                          </div>
                          <Progress value={getStageProgress(animal.current_stage)} className="h-3" />
                        </div>
                        <div className="text-sm text-gray-600">
                          <p>Registered: {animal.registration_date.toLocaleDateString()}</p>
                          {animal.slaughter_date && (
                            <p>Slaughtered: {animal.slaughter_date.toLocaleDateString()}</p>
                          )}
                          {animal.completion_date && (
                            <p>Completed: {animal.completion_date.toLocaleDateString()}</p>
                          )}
                        </div>
                        {animal.notes && (
                          <p className="text-sm text-gray-600 italic mt-2">Notes: {animal.notes}</p>
                        )}
                      </div>
                    ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

export default App;
