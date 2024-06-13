import { ImplLogging } from "../oldcode_04/app/plugin/plugin.js";
import { ImplRegisterUniqueUser } from "../oldcode_04/app/usecase/usecase_register_user.js";
import { ImplFindOnePersonByEmail, ImplGenerateRandomId, ImplSavePerson } from "../oldcode_04/app/ygateway/gateway.js";
import { ImplDatabaseMySQL, ImplDatabasePostgres } from "../oldcode_04/app/zconfig/config.js";
import { ClosureDI, DependencyResolver, DependencyScanner, newCtx } from "../oldcode_04/core.js";
// import { runServer } from "./app/controller/controller.js";
import { Project } from "ts-morph";

async function manual() {
  //

  const logging = ImplLogging();

  const databaseMySQL = ImplDatabaseMySQL();

  const databasePostgres = ImplDatabasePostgres();

  const generateRandomId = logging(ImplGenerateRandomId(), "GenerateRandomId", { useLog: true });

  const savePerson = logging(ImplSavePerson(databasePostgres), "SavePerson", { useLog: true });

  const findOnePersonByEmail = logging(ImplFindOnePersonByEmail(databaseMySQL), "FindOnePersonByEmail", { useLog: true });

  const registerUniqueUser = logging(ImplRegisterUniqueUser(findOnePersonByEmail, savePerson, generateRandomId), "RegisterUniqueUser", { useLog: true });

  {
    const result = await savePerson(newCtx(), { person: { id: "abcc", email: "aaa@ccc.aaa" } });
    console.log(">> %s\n", JSON.stringify(result));
  }

  {
    const result = await findOnePersonByEmail(newCtx(), { email: "abc@gmail.com" });
    console.log(">> %s\n", JSON.stringify(result));
  }

  {
    const result = await registerUniqueUser(newCtx(), { email: "abca@gmail.com" });
    console.log(">> %s\n", JSON.stringify(result));
  }
}

async function automatic() {
  //

  const closureDI = new ClosureDI();

  const logging = ImplLogging();

  // await closureDI.scanDir("src/config");
  // await closureDI.scanDir("src/gateway");
  await closureDI.scanDir("src/app", logging);

  const savePerson = closureDI.get("SavePerson");
  const findOnePersonByEmail = closureDI.get("FindOnePersonByEmail");
  const registerUniqueUser = closureDI.get("RegisterUniqueUser");

  {
    const result = await savePerson(newCtx(), { person: { id: "abcc", email: "aaa@ccc.aaa" } });
    console.log(">> %s\n", JSON.stringify(result));
  }

  // {
  //   const result = await findOnePersonByEmail(newCtx(), { email: "abc@gmail.com" });
  //   console.log(">> %s\n", JSON.stringify(result));
  // }

  // {
  //   const result = await registerUniqueUser(newCtx(), { email: "abca@gmail.com" });
  //   console.log(">> %s\n", JSON.stringify(result));
  // }

  return closureDI;
}

function Tryone() {
  // const functions = [
  //   { name: "F", dependencies: ["E", "B"] },
  //   { name: "B", dependencies: ["A"] },
  //   { name: "E", dependencies: ["D"] },
  //   { name: "C", dependencies: ["B"] },
  //   { name: "D", dependencies: ["C"] },
  //   { name: "A", dependencies: [] },
  //   // Circular dependency example:
  //   // { name: "X", dependencies: ["Y"] },
  //   // { name: "Y", dependencies: ["X"] },
  // ];

  const scanner = new DependencyScanner();
  const functions = scanner.scanFunctions();

  // functions.forEach((f) => console.log("%s depend on %s", f.name, f.dependencies));

  console.log();

  const resolver = new DependencyResolver(functions);

  try {
    const sortedFunctions = resolver.sortFunctions();
    sortedFunctions.forEach((funcObj) => {
      // console.log("%s", funcObj.name);
      // const x = getDecoratorMetadata2(funcObj.func);
      // console.log("   >> ", funcObj.func.getSourceFile().getFilePath());
    });
  } catch (e: any) {
    console.error(e.message);
  }
}

function TryTwo() {
  // Initialize a new project
  const project = new Project();

  // Add a source file to the project
  const sourceFile = project.createSourceFile(
    "source.ts",
    `
import { ActionHandler } from "../../core.js";

export type SavePerson = ActionHandler<{ person: Person }, { id: string }>;

export type Logging = PluginHandler<{ useLog: boolean }>;

export type DatabaseMySQL = Database;
`,
    { overwrite: true }
  );

  function getBaseType(typeName: string) {
    // Find the type alias declaration by name
    const typeAlias = sourceFile.getTypeAlias(typeName);

    if (!typeAlias) {
      throw new Error(`Type alias with name ${typeName} not found`);
    }

    // Get the right-hand side type
    const typeNode = typeAlias.getTypeNode();

    if (!typeNode) {
      throw new Error(`Right-hand side type for ${typeName} not found`);
    }

    // Return the text representation of the type node
    return typeNode.getText();
  }

  // Example usages
  const a1 = getBaseType("SavePerson");
  console.log(a1); // ActionHandler<{ person: Person }, { id: string }>

  const a2 = getBaseType("Logging");
  console.log(a2); // PluginHandler<{ useLog: boolean }>

  const a3 = getBaseType("DatabaseMySQL");
  console.log(a3); // Database
}

(async () => {
  //
  // manual();
  // const cd = await automatic();
  // cd.getAll()
  // runServer(
  //   [
  //     //
  //     { method: "get", path: "/hi", usecase: "RegisterUniqueUser" },
  //   ],
  //   cd
  // );
  //

  Tryone();
  // TryTwo();
})();
