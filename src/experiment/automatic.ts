import { newCtx, Singleton } from "../core/core.js";
import { ActionHandler } from "../core/type.js";

export async function experimentAutomatic() {
  //

  const application = await Singleton.getInstance().startScan();
  const container = application.getContainer();

  {
    const usecase = container.get("SavePerson")?.funcInstance as ActionHandler;
    const result = await usecase(newCtx(), { person: { id: "abcc", email: "aaa@ccc.aaa" } });
    console.log(">> %s\n", JSON.stringify(result));
  }

  {
    const usecase = container.get("FindOnePersonByEmail")?.funcInstance as ActionHandler;
    const result = await usecase(newCtx(), { email: "aaa@ccc.aaa" });
    console.log(">> %s\n", JSON.stringify(result));
  }

  {
    const usecase = container.get("RegisterUniqueUser")?.funcInstance as ActionHandler;
    console.log(JSON.stringify(container.get("RegisterUniqueUser")?.funcMetadata, null, 2));
    const result = await usecase(newCtx(), { email: "abcd@gmail.com" });
    console.log(">> %s\n", JSON.stringify(result));
  }

  //
}
