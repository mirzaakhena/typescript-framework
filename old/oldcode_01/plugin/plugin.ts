import { ActionHandlerWithDecorator, Plugin } from "../core.js";

export type BasicClass<T = any> = {
  new (): T;
};

export type AutoTransaction = {
  gateways: BasicClass;
};

export function Transaction(): Plugin {
  return (o) => {
    // console.log("masuk", o.decorator.gateways);

    if (o.decorator) {
      // console.log(keyof typeof o.decorator.gateways);
      // console.log(Object.keys(o.decorator.gateways));
    }

    return o;
    // if (!o.decorator) {
    // }

    // console.log("masuk sini", o.decorator);

    // for (const key in o.decorator.gateways) {
    //   console.log(">>>>", key);
    // }

    // for (const gatewayName of Object.keys(o.decorator.gateways)) {
    //   console.log(">>", gatewayName);
    // }

    // return {
    //   run: async (ctx, req) => {
    //     return o.run(ctx, req);
    //   },
    // };
  };

  // if (!o.decorator) {
  //   return {
  //     run: async (ctx, req) => {
  //       return o.run(ctx, req);
  //     },
  //   };
  // }

  // for (const gatewayName of Object.keys(o.decorator.gateways)) {
  //   console.log(">>", gatewayName);
  // }

  // return {
  //   run: async (ctx, req) => {
  //     return o.run(ctx, req);
  //   },
  // };
}
