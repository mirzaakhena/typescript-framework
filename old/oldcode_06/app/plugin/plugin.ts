import { PluginHandler } from "../../core/core.js";

export type Logging = PluginHandler;

/**
 * @Injectable {"as": "plugin" }
 */
export function ImplLogging(): Logging {
  //

  // console.log("plugin level 1"); // dijalankan saat pertama kali diinstance

  return (handler, fm) => {
    //

    const injectable = fm.decorators.find((x) => x.name === "Injectable");

    if (injectable?.data.as !== "usecase") {
      return handler;
    }

    const logging = fm.decorators.find((x) => x.name === "Logging");

    if (logging?.data.useLog === false) {
      return handler;
    }

    // console.log("plugin level 2"); // dijalankan saat pertama kali melakukan wrapping

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
