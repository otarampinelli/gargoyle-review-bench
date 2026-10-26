import { loadConfig } from './config.ts';
import { openDb } from './db.ts';
import { routes } from './http/routes.ts';
import { startServer } from './http/server.ts';
import { HttpPaymentGateway } from './payments/gateway.ts';

const config = loadConfig();
const db = openDb(config.databasePath);
const gateway = new HttpPaymentGateway(config.paymentApiUrl, config.paymentApiKey);
startServer(routes(db, config, gateway), config);
console.log(`shopkit listening on :${config.port}`);
