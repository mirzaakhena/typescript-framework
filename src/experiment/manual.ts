import { ImplDatabaseMySQL, ImplDatabasePostgres } from "../app/config/config.js";
import { ImplFindOnePersonByEmail, ImplGenerateRandomId, ImplSavePerson } from "../app/gateway/gateway.js";
import { ImplLogging } from "../app/plugin/plugin.js";
import { ImplRegisterUniqueUser } from "../app/usecase/usecase_01.js";
import { newCtx } from "../core/core.js";

export async function experimentManual() {
  //

  const logging = ImplLogging();

  const databaseMySQL = ImplDatabaseMySQL();

  const databasePostgres = ImplDatabasePostgres();

  const generateRandomId = logging(ImplGenerateRandomId(), {
    //
    kind: "Action",
    name: "GenerateRandomId",
    decorators: [],
    dependencies: [],
  });

  const savePerson = logging(ImplSavePerson(databasePostgres), {
    //
    kind: "Action",
    name: "SavePerson",
    decorators: [],
    dependencies: [],
  });

  const findOnePersonByEmail = logging(ImplFindOnePersonByEmail(databaseMySQL), {
    //
    kind: "Action",
    name: "FindOnePersonByEmail",
    decorators: [],
    dependencies: [],
  });

  const registerUniqueUser = logging(ImplRegisterUniqueUser(findOnePersonByEmail, savePerson, generateRandomId), {
    kind: "Action",
    name: "RegisterUniqueUser",
    decorators: [],
    dependencies: [],
  });

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
