import { ConfigSetup, Database, SomeHTTPClient } from "../config/config.js";
import { Service1, Service2 } from "../model/model.js";

export function ImplService1(o: { db: Database; cfg: ConfigSetup }): Service1 {
  return {
    run: async (ctx, req) => {
      return { message: `hello ${o.db.dbName} ${o.cfg.path}` };
    },
  };
}

export function ImplService2(o: { client: SomeHTTPClient }): Service2 {
  return {
    run: async (ctx, req) => {
      return { value: `hay ${o.client.http}` };
    },
  };
}
