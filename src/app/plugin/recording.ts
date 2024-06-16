import { PluginHandler } from "../../core/type.js";

export type Recording = PluginHandler;

export type RecordFunction = {
  id?: string;
  funcName?: string;
  description?: string;
  input?: any;
  output?: any;
  error?: any;
  functions?: RecordFunction[];
  duration?: number; // TODO: count duration
};

/**
 * @Plugin
 */
export function ImplRecording(): Recording {
  //

  return (handler, fm) => {
    //

    if (!fm.decorators.some((x) => x.name === "Action")) {
      return handler;
    }

    // Usecase as Controller
    if (fm.decorators.some((x) => x.name === "Controller")) {
      return async (ctx, request) => {
        //

        if (!ctx.data.recording) {
          ctx.data = {
            ...ctx.data,
            recording: {
              functions: [],
              description: "",
            } as RecordFunction,
          };
        }

        const start = Date.now();
        let response = {};
        let error = null;

        try {
          response = await handler(ctx, request);
        } catch (err: any) {
          error = err.message;
        }

        ctx.data["recording"] = {
          ...ctx.data["recording"],
          id: ctx.traceId,
          description: "",
          duration: Date.now() - start,
          error,
          funcName: fm.name,
          input: request,
          output: response,
        } as RecordFunction;

        return response;
      };
    }

    // Gateway
    return async (ctx, request) => {
      //

      if (!ctx.data.recording) {
        ctx.data = {
          ...ctx.data,
          recording: {
            functions: [],
            description: "",
          } as RecordFunction,
        };
      }

      const start = Date.now();
      let response = {};
      let error = null;
      try {
        response = await handler(ctx, request);
      } catch (err: any) {
        error = err.message;
      }

      const recording = ctx.data["recording"] as RecordFunction;

      recording.functions?.push({
        funcName: fm.name,
        input: request,
        output: response,
        functions: undefined,
        description: "",
        error,
        duration: Date.now() - start,
      });

      return response;
    };
  };
}
