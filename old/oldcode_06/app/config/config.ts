export interface Database {
  dbName: string;
}

export type DatabaseMySQL = Database;

export type DatabasePostgres = Database;

/**
 * @Injectable {"as": "config"}
 */
export function ImplDatabaseMySQL(): DatabaseMySQL {
  return { dbName: "mysql" };
}

/**
 * @Injectable {"as": "config"}
 */
export function ImplDatabasePostgres(): DatabasePostgres {
  return { dbName: "postgres" };
}
