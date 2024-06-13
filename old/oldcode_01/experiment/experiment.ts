export type Context<T extends Record<string, any> = Record<string, any>> = {
  data: T;
  traceId: string;
  date: Date;
};

export type ServiceHandler<GATEWAYS = any, REQUEST = any, RESPONSE = any, DECORATOR = any> = {
  decorator?: DECORATOR;
  setup: (g: GATEWAYS) => (ctx: Context, request: REQUEST) => Promise<RESPONSE>;
};

export interface Database {
  dbName: string;
}

export interface SomeHTTPClient {
  http: string;
}

export type Transaction = {
  isDoingModification: boolean;
};

export type Logging = {
  printLogCount: number;
  logName: string;
};

export type TransactionWithLogging = Transaction | Logging;
export type Service1 = ServiceHandler<Database, { page: number; size: number }, { message: string } | null, Transaction | Logging>;
export type Service2 = ServiceHandler<SomeHTTPClient, { keyword: string }, { items: { name: string; age: number }[]; count: number }, Logging>;

type Request = {
  n: number;
  nama: string
};

type Response = {
  name: string;
};

type Gateways = {
  service1: Service1;
  service2: Service2;
};

export type DoSomething = ServiceHandler<Gateways, Request, Response, Logging>;

export const implDoSomething: DoSomething = {
  decorator: { logName: "", printLogCount: 0 },
  setup: (g) => async (ctx, req) => {
    return {
      name: "",
    };
  },
};
