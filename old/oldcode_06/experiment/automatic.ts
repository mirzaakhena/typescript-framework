import { ActionHandler, newCtx, Singleton } from "../core/core.js";

export async function experimentAutomatic() {
  //

  const application = await Singleton.getInstance().startScan();
  const container = application.getContainer();

  {
    const usecase = container.get("SavePerson")?.func as ActionHandler;
    const result = await usecase(newCtx(), { person: { id: "abcc", email: "aaa@ccc.aaa" } });
    console.log(">> %s\n", JSON.stringify(result));
  }

  {
    const usecase = container.get("FindOnePersonByEmail")?.func as ActionHandler;
    const result = await usecase(newCtx(), { email: "aaa@ccc.aaa" });
    console.log(">> %s\n", JSON.stringify(result));
  }

  {
    const usecase = container.get("RegisterUniqueUser")?.func as ActionHandler;
    const result = await usecase(newCtx(), { email: "abcd@gmail.com" });
    console.log(">> %s\n", JSON.stringify(result));
  }

  {
    const usecase = container.get("Blablabla")?.func as ActionHandler;
    const result = await usecase(newCtx(), { email: "abcd@gmail.com" });
    console.log(">> %s\n", JSON.stringify(result));
  }

  //
}
