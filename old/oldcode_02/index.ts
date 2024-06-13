// src/index.ts

// import { newCtx } from "./core.js";
// import { Logging } from "./plugin/plugin.js";
// import { DatabaseMySQL, ImplDatabaseMySQL } from "./config/database.js";
// import { ImplFindOnePersonByEmail, ImplSavePerson, ImplGenerateRandomId } from "./gatewayimpl/gateway_one.js";
// import { Gateways, ImplRegisterUniqueUser } from "./usecase/usecase_register_user.js";

// const logging = Logging();

// export const db: DatabaseMySQL = logging(ImplDatabaseMySQL(), { useLog: true });

// export const gw: Gateways = {
//   findOnePersonByEmail: logging(ImplFindOnePersonByEmail(db), { useLog: true }),
//   savePerson: logging(ImplSavePerson(db), { useLog: true }),
//   generateRandomId: logging(ImplGenerateRandomId(), { useLog: true }),
// };

// const usecase = logging(ImplRegisterUniqueUser(gw), { useLog: true });

// const result = await usecase(newCtx(), {
//   email: "mirza@gmail.com",
// });

// console.log(result);

// ========================================================================

// import { ActionHandler, MyFramework, newCtx } from "./core.js";
// import { Logging } from "./plugin/plugin.js";

// const myFramework = new MyFramework();

// await myFramework.createFunctionMap("./src/config", Logging());
// await myFramework.createFunctionMap("./src/gatewayimpl", Logging());
// await myFramework.createFunctionMap("./src/usecase", Logging());

// console.log(myFramework.getAll());

// const usecase = myFramework.get("RegisterUniqueUser") as ActionHandler;

// const result = await usecase(newCtx(), { email: "abc1@gmail.com" });

// console.log(result);

import {  } from "markdown-pdf";
// fs = require("fs");

// fs.createReadStream("/path/to/document.md") //
//   .pipe(markdownpdf())
//   .pipe(fs.createWriteStream("/path/to/document.pdf"));

// --- OR ---

markdownpdf()
  .from("README.md")
  .to("README.pdf", function () {
    console.log("Done");
  });
