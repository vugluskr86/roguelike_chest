import { join } from 'node:path';
import process from 'node:process';
import { createStorage } from '../analytics-server/storage.js';

const days = Number(process.env.ANALYTICS_RETENTION_DAYS || 90);
const storage = createStorage(process.env.ANALYTICS_DATA_DIR || join(process.cwd(), 'analytics-data'));
await storage.init();
const removed = await storage.prune(Date.now() - days * 24 * 60 * 60 * 1000);
console.log(`Removed ${removed} analytics runs older than ${days} days.`);
