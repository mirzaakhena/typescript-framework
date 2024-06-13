// src/index.ts

// import { newCtx } from "./core.js";
// import { Logging } from "./plugin/plugin.js";
// import { DatabaseMySQL, ImplDatabaseMySQL } from "./config/database.js";
// import { ImplFindOnePersonByEmail, ImplSavePerson, ImplGenerateRandomId } from "./gatewayimpl/gateway.js";
// import { ImplRegisterUniqueUser } from "./usecase/usecase_register_user.js";

// export const db: DatabaseMySQL = ImplDatabaseMySQL();

// const logging = Logging();

// const findOnePersonByEmail = logging(ImplFindOnePersonByEmail(db), "FindOnePersonByEmail", { useLog: true });
// const savePerson = logging(ImplSavePerson(db), "SavePerson", { useLog: true });
// const generateRandomId = logging(ImplGenerateRandomId(), "GenerateRandomId", { useLog: true });

// const usecase = logging(ImplRegisterUniqueUser(findOnePersonByEmail, savePerson, generateRandomId), "RegisterUniqueUser", { useLog: true });

// const result = await usecase(newCtx(), {
//   email: "mirza@gmail.com",
// });

// console.log(result);

// ========================================================================

// import { newCtx } from "./framework/base_type.js";
// import { ClosureDI } from "./framework/core.js";
// import { Logging } from "./plugin/plugin.js";

// const myFramework = new ClosureDI();

// await myFramework.createFunctionMap("./src/config");
// await myFramework.createFunctionMap("./src/gatewayimpl", Logging());

// const usecase = myFramework.get("SavePerson");
// if (usecase) {
//   const result = await usecase(newCtx(), { person: { id: "888", email: "sjdlfa@akdhd.cooc" } });
//   // console.log(result);
// }

// console.log(myFramework.getAll());

import { Project, printNode } from "ts-morph";

// Initialize a new project
const project = new Project();

// Add the source file which contains the type alias
const sourceFile = project.createSourceFile(
  "example.ts",
  `
  export interface Database {
    dbName: string;
  }
  
  export type DatabasePostgres = Database;

  export type DatabaseMySQL = Database;
  
  function ImplDatabaseMySQL(): DatabaseMySQL {
    return { dbName: "mysql" };
  }  

  function Hello(): DatabaseMySQL {
    return { dbName: "mysql" };
  }  

  export function ImplDatabasePostgres(): DatabasePostgres {
    return { dbName: "postgres" };
  }

  interface Person {
    name: string;
    age: number;
  }
`,
  { overwrite: true }
);

const x = sourceFile.getInterfaceOrThrow("Person");

console.log(x.getProperties().map((x) => x.print()));

// funcs.forEach((x) => console.log(x.print()));
