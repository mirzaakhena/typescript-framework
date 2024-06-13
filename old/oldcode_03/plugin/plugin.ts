// src/plugin/plugin.ts

import { PluginHandler } from "../framework/base_type.js";

export function Logging(): PluginHandler<{ useLog: boolean }> {
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

      console.log("response %s : %s\n", funcName.padEnd(24), JSON.stringify(responses));

      return responses;
    };
  };
}
