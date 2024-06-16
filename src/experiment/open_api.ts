import cors from "cors";
import express from "express";
import { Singleton } from "../core/core.js";
import { generateOpenAPIObject } from "../core/openapi.js";

export async function experimentOpenAPI() {
  //

  const app = express();
  const port = 3001;
  const router = express.Router();

  const application = await Singleton.getInstance().startScan();
  const usecases = Array.from(application.getContainer().values()) //
    .filter((x) => x.funcMetadata.decorators.some((y) => y.name === "Controller"));

  const securitySchema = {
    bearerAuth: {
      type: "http" as const,
      scheme: "bearer",
      bearerFormat: "JWT",
    },
    bearerAuthVendor: {
      type: "http" as const,
      scheme: "bearer",
      bearerFormat: "JWT",
    },
  };

  router.get("/openapi", (req, res) => res.json(generateOpenAPIObject(usecases, securitySchema)));

  app.use(cors({ exposedHeaders: ["Trace-Id", "Date"] }));
  app.use("/", router);

  app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
  });
}
