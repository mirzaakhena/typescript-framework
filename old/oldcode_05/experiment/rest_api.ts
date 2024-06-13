import express from "express";
import { ActionHandler, newCtx, Singleton } from "../core/core.js";

export async function experimentRestAPI() {
  //

  const app = express();
  const port = 3001;

  const application = await Singleton.getInstance().startScan();
  const container = application.getContainer();

  const usecases = Array.from(container.values()).filter((x) => x.functionMetadata.kind === "usecase");

  type Methods = "all" | "get" | "post" | "put" | "delete" | "patch" | "options" | "head";

  {
    // Create a router
    const router = express.Router();

    usecases.forEach(({ func, functionMetadata }) => {
      //

      const usecase = func as ActionHandler;

      const data = functionMetadata.decorators.find((x) => x.name === "Controller")?.data as { method: Methods; path: string };

      if (!data) throw new Error("undefined path and method");

      console.table(data);

      router[data.method as Methods](data.path, async (req, res) => {
        //

        // TODO gimana cara ngambil struktur Request nya ?

        const result = await usecase(newCtx(), { email: "mirza@gmail.com" });
        res.json(result);
      });
    });

    // Use the router
    app.use("/", router);
  }

  app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
  });
}
