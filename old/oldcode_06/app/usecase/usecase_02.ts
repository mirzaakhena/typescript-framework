import { ActionHandler } from "../../core/core.js";
import { SavePerson } from "../model/model.js";

type Blablabla = ActionHandler<number, number>;

/**
 * @Injectable {"as": "usecase" }
 * @Controller {"method": "post", "path": "/something", "tag": "user" }
 * @Logging { "useLog": false }
 */
export function ImplMyNewUsecase(savePerson: SavePerson): Blablabla {
  //
  return async (ctx, req) => {
    //

    await savePerson(ctx, { person: { email: "", id: "" } });

    return 0;
  };
}
