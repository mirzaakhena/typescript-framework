// src/config/database.ts

import { Database } from "./base_type.js";

export type DatabaseMySQL = Database;

export type DatabasePostgres = Database;

export function ImplDatabaseMySQL(): DatabaseMySQL {
  return { dbName: "mysql" };
}

export function ImplDatabasePostgres(): DatabasePostgres {
  return { dbName: "postgres" };
}
