import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema.js';
import * as dotenv from 'dotenv';

dotenv.config();

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
    throw new Error('DATABASE_URL is not defined');
}

// Fix for Neon: Explicitly enable SSL
const client = postgres(connectionString, {
    ssl: 'require',
    prepare: false // Neon recommendation for serverless
});

export const db = drizzle(client, { schema });
export const migrationClient = client;
