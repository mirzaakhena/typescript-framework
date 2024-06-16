import cors from "cors";
import express from "express";
import { Singleton } from "../core/core.js";
import { generateController, RequestWithContext } from "../core/expressjs.js";
import { printController } from "../core/printcontroller.js";

export async function experimentRestAPI() {
  //

  const app = express();
  const port = 3001;
  const router = express.Router();

  const application = await Singleton.getInstance().startScan();
  const usecases = Array.from(application.getContainer().values()) //
    .filter((x) => x.funcMetadata.decorators.some((y) => y.name === "Controller"));

  generateController(router, usecases);

  app.use(cors({ exposedHeaders: ["Trace-Id", "Date"] }));
  app.use("/", handleJWTAuth("SECRET_KEY", "userLogin"), router);

  console.table(printController(usecases));

  app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
  });
}

export const handleJWTAuth = (secretKey: string, fieldName: string) => async (req: RequestWithContext, res: express.Response, next: express.NextFunction) => {
  //

  try {
    //
    // const authHeader = req.headers.authorization;
    // if (!authHeader) {
    //   res.sendStatus(401);
    //   return;
    // }

    // const token = authHeader.split(" ");
    // if (token.length !== 2 || token[0].toLowerCase() !== "bearer") {
    //   res.sendStatus(401);
    //   return;
    // }

    const dataDecoded = { data: "" }; // jwt.verify(token[1], secretKey) as JwtPayload;

    if (!req.context) {
      req.context = {};
      req.context[fieldName] = dataDecoded.data; // split between user and vendor login data
    }

    next();
  } catch (e: any) {
    next(e);
  }
};
