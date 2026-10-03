import { loadConfig, loadDotEnv } from '../config';
import { openDatabase } from './index';

const command = process.argv[2];
if (command !== 'migrate') {
  console.error('Usage: db:migrate');
  process.exit(1);
}

loadDotEnv();
const config = loadConfig();
const db = await openDatabase(config);
console.log(`Database ready (${db.kind}${config.databaseUrl ? '' : ` in ${config.dataDir}`}).`);
await db.close();
