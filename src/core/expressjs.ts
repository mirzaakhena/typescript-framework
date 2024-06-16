import express from "express";
import { newCtx } from "../core/core.js";
import { ActionHandler, Context, FuncInstanceMetadata } from "../core/type.js";
import { Methods } from "./helper.js";

export type RequestWithContext = express.Request & {
  ctx?: Context;
};

export const getRequestWithContext = (req: express.Request): Context => {
  return (req as RequestWithContext).ctx as Context;
};

export function generateController(router: express.Router, usecases: FuncInstanceMetadata[]) {
  //

  usecases.forEach(({ funcInstance, funcMetadata }) => {
    //

    const usecase = funcInstance as ActionHandler;

    const data = funcMetadata.decorators.find((x) => x.name === "Controller")?.data as { method: Methods; path: string; tag: string };
    if (!data) throw new Error("undefined path and method");

    router[data.method as Methods](data.path, async (req, res) => {
      //

      const ctx = getRequestWithContext(req);

      let payload = {};
      funcMetadata.request?.structure.forEach((x) => {
        //

        x.decorator.forEach((y) => {
          //

          if (y.name !== "RestApi") return;

          if (y.data.type === "query") {
            payload = { ...payload, [x.name]: req.query[x.name] };
            return;
          }
          if (y.data.type === "param") {
            payload = { ...payload, [x.name]: req.params[x.name] };
            return;
          }
          if (y.data.type === "body") {
            payload = { ...payload, [x.name]: req.body[x.name] };
            return;
          }
          if (y.data.type === "header") {
            payload = { ...payload, [x.name]: req.get(x.name) };
            return;
          }

          if (y.data.type === "local") {
            payload = { ...payload, [x.name]: ctx.data[x.name] };
            return;
          }
        });
      });
      const result = await usecase(newCtx(), payload);
      res.json(result);
    });
  });
}
