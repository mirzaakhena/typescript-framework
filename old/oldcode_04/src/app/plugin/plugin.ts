import { Logging } from "../model/model.js";

/**
 * @injectable {"as": "plugin"}
 */
export function ImplLogging(): Logging {
  //

  return (handler, funcName, metadataDecorator) => {
    //

    if (!metadataDecorator?.useLog) {
      return handler;
    }

    return async (ctx, request) => {
      //
      console.log("request  %s : %s", funcName.padEnd(24), JSON.stringify(request));

      const responses = await handler(ctx, request);

      console.log("response %s : %s", funcName.padEnd(24), JSON.stringify(responses));

      return responses;
    };
  };
}

// export function RestAPI(router: express.IRouter): PluginHandler<{
//   path: string;
//   method: "post" | "get" | "delete" | "put";
//   tag: string;
//   security?: string;
// }> {
//   //

//   return (handler, funcName, metadataDecorator) => {
//     //

//     if (!metadataDecorator) {
//       return handler;
//     }

//     return async (ctx, request) => {
//       //

//       router[metadataDecorator?.method](metadataDecorator?.path, async (req, res, next) => {
//         const responses = await handler(ctx, request);
//       });
//     };
//   };
// }
