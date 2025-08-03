
import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';
import { z } from 'zod';

// Import schemas
import {
  createUserInputSchema,
  createAnimalInputSchema,
  updateAnimalStageInputSchema,
  createDistributionInputSchema
} from './schema';

// Import handlers
import { createUser } from './handlers/create_user';
import { getUsers } from './handlers/get_users';
import { getShohibulQurban } from './handlers/get_shohibul_qurban';
import { createAnimal } from './handlers/create_animal';
import { getAnimals } from './handlers/get_animals';
import { getAnimalsByOwner } from './handlers/get_animals_by_owner';
import { updateAnimalStage } from './handlers/update_animal_stage';
import { createDistribution } from './handlers/create_distribution';
import { getDistributions } from './handlers/get_distributions';
import { getDistributionsByAnimal } from './handlers/get_distributions_by_animal';
import { getDashboardStats } from './handlers/get_dashboard_stats';
import { getProcessLogs } from './handlers/get_process_logs';
import { getProcessLogsByAnimal } from './handlers/get_process_logs_by_animal';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),
  
  // User management
  createUser: publicProcedure
    .input(createUserInputSchema)
    .mutation(({ input }) => createUser(input)),
  
  getUsers: publicProcedure
    .query(() => getUsers()),
  
  getShohibulQurban: publicProcedure
    .query(() => getShohibulQurban()),
  
  // Animal management
  createAnimal: publicProcedure
    .input(createAnimalInputSchema)
    .mutation(({ input }) => createAnimal(input)),
  
  getAnimals: publicProcedure
    .query(() => getAnimals()),
  
  getAnimalsByOwner: publicProcedure
    .input(z.object({ ownerId: z.number() }))
    .query(({ input }) => getAnimalsByOwner(input.ownerId)),
  
  updateAnimalStage: publicProcedure
    .input(updateAnimalStageInputSchema)
    .mutation(({ input }) => updateAnimalStage(input)),
  
  // Distribution management
  createDistribution: publicProcedure
    .input(createDistributionInputSchema)
    .mutation(({ input }) => createDistribution(input)),
  
  getDistributions: publicProcedure
    .query(() => getDistributions()),
  
  getDistributionsByAnimal: publicProcedure
    .input(z.object({ animalId: z.number() }))
    .query(({ input }) => getDistributionsByAnimal(input.animalId)),
  
  // Process logs
  getProcessLogs: publicProcedure
    .query(() => getProcessLogs()),
  
  getProcessLogsByAnimal: publicProcedure
    .input(z.object({ animalId: z.number() }))
    .query(({ input }) => getProcessLogsByAnimal(input.animalId)),
  
  // Dashboard
  getDashboardStats: publicProcedure
    .query(() => getDashboardStats()),
});

export type AppRouter = typeof appRouter;

async function start() {
  const port = process.env['SERVER_PORT'] || 2022;
  const server = createHTTPServer({
    middleware: (req, res, next) => {
      cors()(req, res, next);
    },
    router: appRouter,
    createContext() {
      return {};
    },
  });
  server.listen(port);
  console.log(`TRPC server listening at port: ${port}`);
}

start();
