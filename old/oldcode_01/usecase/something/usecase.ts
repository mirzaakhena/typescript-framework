import { ActionHandlerWithDecorator, ServiceHandler } from "../../core.js";
import { Service1, Service2 } from "../../model/model.js";
import { AutoTransaction } from "../../plugin/plugin.js";

type Request = {
  n: number;
};

type Response = {
  name: string;
};

type Gateways = {
  service1: Service1;
  service2: Service2;
};

// export type DoSomething = ActionHandlerWithDecorator<Request, Response | null, AutoTransaction>;

// export function ImplDoSomething(o: Gateways): DoSomething {
//   return {
//     decorator: { gateways: Gateways },
//     run: async (ctx, req) => {
//       const a = await o.service1.run(ctx, {});
//       const b = await o.service2.run(ctx, {});
//       return { name: `${req.n}x ${a?.message} - ${b?.value}` };
//     },
//   };
// }

export type DoSomething = ServiceHandler<Gateways, Request, Response>;

export const implDoSomething: DoSomething = {
  setup: (g) => async (ctx, req) => {
    return {
      name: "",
    };
  },
};
