export interface ConfigSetup {
  path: string;
}

export interface Database {
  dbName: string;
}

export interface SomeHTTPClient {
  http: string;
}

export function ImplConfigSetup(): ConfigSetup {
  return {
    path: "aaa/bbb/ccc",
  };
}

export function ImplDatabase(): Database {
  return {
    dbName: "mySql",
  };
}

export function ImplSomeHTTPClient(): SomeHTTPClient {
  return {
    http: "restapi2",
  };
}
