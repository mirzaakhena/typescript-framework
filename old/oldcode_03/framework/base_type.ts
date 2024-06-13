export type Context<T extends Record<string, any> = Record<string, any>> = {
  data: T;
  traceId: string;
  date: Date;
};

export const newCtx = (): Context => ({ data: {}, traceId: "123", date: new Date() });

export type ActionHandler<REQUEST = any, RESPONSE = any> = (ctx: Context, request: REQUEST) => Promise<RESPONSE>;

export type PluginHandler<T = any> = (ah: ActionHandler, funcName: string, functionMetadata?: T) => ActionHandler;
