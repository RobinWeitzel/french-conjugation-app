import RemoteStorage, { type RSModule } from 'remotestoragejs';
import type BaseClient from 'remotestoragejs/release/types/baseclient';

export const MODULE_NAME = 'frenchconjugation';

const module: RSModule = {
  name: MODULE_NAME,
  builder(privateClient) {
    privateClient.declareType('stat', {
      type: 'object',
      properties: {
        id: { type: 'string' },
        correctCount: { type: 'integer' },
        box: { type: 'integer' },
        nextReview: { type: 'string' },
        lastPracticed: { type: 'string' },
        updatedAt: { type: 'integer' },
      },
      required: ['id', 'correctCount', 'box', 'nextReview', 'lastPracticed', 'updatedAt'],
    });
    privateClient.declareType('activity', {
      type: 'object',
      properties: {
        syncId: { type: 'string' },
        date: { type: 'string' },
        mode: { type: 'string' },
        correct: { type: 'boolean' },
        direction: { type: 'string' },
        updatedAt: { type: 'integer' },
      },
      required: ['syncId', 'date', 'mode', 'correct', 'updatedAt'],
    });
    privateClient.declareType('gateCompletion', {
      type: 'object',
      properties: {
        id: { type: 'string' },
        tense: { type: 'string' },
        direction: { type: 'string' },
        tier: { type: 'integer' },
        mode: { type: 'string' },
        completedAt: { type: 'string' },
        updatedAt: { type: 'integer' },
      },
      required: ['id', 'tense', 'direction', 'tier', 'mode', 'completedAt', 'updatedAt'],
    });
    return { exports: { client: privateClient } };
  },
};

let instance: RemoteStorage | null = null;

export function getRemoteStorage(): RemoteStorage {
  if (!instance) {
    instance = new RemoteStorage({ modules: [module], cache: true });
    instance.access.claim(MODULE_NAME, 'rw');
    instance.caching.enable(`/${MODULE_NAME}/`);
  }
  return instance;
}

export function getModuleClient(): BaseClient {
  const rs = getRemoteStorage() as unknown as Record<string, { client: BaseClient }>;
  return rs[MODULE_NAME]!.client;
}
