import express from "express";
import * as TJS from "typescript-json-schema";
import { Singleton, newCtx } from "../core/core.js";
import { ActionHandler } from "../core/type.js";

export async function experimentRestAPI() {
  //

  const application = await Singleton.getInstance().startScan();
  const container = application.getContainer();
  const usecases = Array.from(container.values()).filter((x) => x.funcMetadata.kind === "Usecase");

  const settings: TJS.PartialArgs = { required: true, noExtraProps: true };
  const compilerOptions: TJS.CompilerOptions = { strictNullChecks: true };

  const app = express();
  const port = 3001;
  type Methods = "all" | "get" | "post" | "put" | "delete" | "patch" | "options" | "head";

  // Create a router
  const router = express.Router();

  usecases.forEach(({ funcInstance, funcMetadata }) => {
    //

    const program = TJS.getProgramFromFiles([funcMetadata.request?.path as string], compilerOptions);

    console.log(JSON.stringify(TJS.generateSchema(program, funcMetadata.request?.name as string, settings)));
    console.log();
    console.log(JSON.stringify(TJS.generateSchema(program, funcMetadata.response?.name as string, settings)));

    const usecase = funcInstance as ActionHandler;
    const data = funcMetadata.decorators.find((x) => x.name === "Controller")?.data as { method: Methods; path: string };
    if (!data) throw new Error("undefined path and method");
    console.table(data);
    router[data.method as Methods](data.path, async (req, res) => {
      //
      let payload = {};
      funcMetadata.request?.structure.forEach((x) => {
        if (x.decorator.some((y) => y.name === "RestApi" && y.data.type === "query")) {
          payload = { ...payload, [x.name]: req.query[x.name] };
          return;
        }
        if (x.decorator.some((y) => y.name === "RestApi" && y.data.type === "param")) {
          payload = { ...payload, [x.name]: req.params[x.name] };
          return;
        }
        if (x.decorator.some((y) => y.name === "RestApi" && y.data.type === "body")) {
          payload = { ...payload, [x.name]: req.body[x.name] };
          return;
        }
        if (x.decorator.some((y) => y.name === "RestApi" && y.data.type === "header")) {
          payload = { ...payload, [x.name]: req.get(x.name) };
          return;
        }
      });
      const result = await usecase(newCtx(), payload);
      res.json(result);
    });
  });

  // Use the router
  app.use("/", router);

  app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
  });
}
