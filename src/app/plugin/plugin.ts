import { PluginHandler } from "../../core/type.js";

export type Logging = PluginHandler;

/**
 * @Plugin_
 */
export function ImplLogging(): Logging {
  //

  // console.log("plugin level 1"); // dijalankan saat pertama kali diinstance

  return (handler, fm) => {
    //

    // console.log("plugin level 2"); // dijalankan saat pertama kali melakukan wrapping

    if (!fm.decorators.some((x) => x.name === "Action")) {
      //
      return handler;
    }

    return async (ctx, request) => {
      //

      // console.log("plugin level 3"); // dijalankan saat function di jalankankan secara runtime

      console.log("request  %s : %s", fm.name.padEnd(24), JSON.stringify(request));

      const responses = await handler(ctx, request);

      console.log("response %s : %s", fm.name.padEnd(24), JSON.stringify(responses));

      return responses;
    };
  };
}
