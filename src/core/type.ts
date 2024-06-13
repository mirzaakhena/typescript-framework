export type Context<T extends Record<string, any> = Record<string, any>> = {
  data: T;
  traceId: string;
  date: Date;
};

export type ActionHandler<REQUEST = any, RESPONSE = any> = (ctx: Context, request: REQUEST) => Promise<RESPONSE>;

export type PluginHandler = (ah: ActionHandler, functionMetadata: FuncMetadata) => ActionHandler;

export type FuncInstanceMetadata = { funcInstance: any; funcMetadata: FuncMetadata };

export type FuncMetadata = {
  name: string;
  dependencies: string[];
  kind: TypeOf<typeof InjectableDecorator>;
  decorators: Decorator[];
  request?: { name: string; path: string; structure: TypeField[] };
  response?: { name: string; path: string; structure: TypeField[] };
};

export type Decorator = { name: string; data: any };

export type TypeOf<T extends readonly any[]> = T[number];

export const InjectableDecorator = ["Config", "Gateway", "Plugin", "Usecase"] as const;

export type InjectableDecoratorType = TypeOf<typeof InjectableDecorator>;

export type TypeField = {
  name: string;
  type: string;
  decorator: Decorator[];
};
