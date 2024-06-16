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
    const result = await usecase(newCtx(), { email: "abc@gmail.com" });
    console.log(">> %s\n", JSON.stringify(result));
  }

  {
    const ctx = newCtx();

    const usecase = container.get("RegisterUniqueUser")?.funcInstance as ActionHandler;
    const result = await usecase(ctx, { email: "abcd@gmail.com" });
    console.log(">> %s\n", JSON.stringify(result));

    console.log(">>>>", JSON.stringify(ctx.data["recording"], null, 2));
  }

  //
}
