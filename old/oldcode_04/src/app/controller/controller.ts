import express from "express";
import cors from "cors";
import { ClosureDI, newCtx } from "../../core.js";

export type HttpData = {
  usecase: string;
  path: string;
  method: "post" | "get" | "delete" | "put";
  tag?: string;
  security?: string;
};

// export function runServer(httpDatas: HttpData[], closureDI: ClosureDI) {
//   //

//   const mainRouter = express.Router();

//   httpDatas.forEach((x) => {
//     mainRouter[x.method](x.path, async (req, res) => {
//       const usecase = closureDI.get(x.usecase);
//       const result = await usecase(newCtx(), { email: "abca@gmail.com" });
//       res.json(result);
//     });
//   });

//   const app = express();
//   app.use(express.json());
//   app.use(express.urlencoded({ extended: true }));
//   app.use(cors({ exposedHeaders: ["Trace-Id", "Date"] }));
//   app.use(mainRouter);

//   app.listen(3001, () => {});
// }
