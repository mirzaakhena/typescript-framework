import { ActionHandler } from "../../core/core.js";

type Blablabla = ActionHandler<number, number>;

/**
 * @Injectable {"as": "usecase"}
 * @Controller {"method": "post", "path": "/something", "tag": "user" }
 */
export function ImplMyNewUsecase(

// 

): Blablabla {
  return async (ctx, req) => {

    //

    return 0;
  };
}
