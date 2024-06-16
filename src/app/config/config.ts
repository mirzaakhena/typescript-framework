export type Database = {
  dbName: string;
}

export type DatabaseMySQL = Database;

export type DatabasePostgres = Database;

/**
 * @Config
 */
export function ImplDatabaseMySQL(): DatabaseMySQL {
  return { dbName: "mysql" };
}

/**
 * @Config
 */
export function ImplDatabasePostgres(): DatabasePostgres {
  return { dbName: "postgres" };
}
