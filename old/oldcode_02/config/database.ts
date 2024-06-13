// src/config/database.ts

import { ActionHandler } from "../core.js";

export interface Database {
  dbName: string;
}

export type DatabaseMySQL = ActionHandler<void, Database>;

/**
 * @decorator {useLog:true}
 * @returns
 */
export function ImplDatabaseMySQL(): DatabaseMySQL {
  return async (ctx) => {
    return { dbName: "mysql" };
  };
}

export type DatabasePostgres = ActionHandler<void, Database>;

/**
 * @decorator {useLog:true}
 * @returns
 */
export function ImplDatabasePostgres(): DatabasePostgres {
  return async (ctx) => {
    return { dbName: "postgres" };
  };
}
