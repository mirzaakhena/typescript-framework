import { ActionHandler } from "../../core/type.js";

interface Person {
  name: string;
  age: number;
  hasPet: boolean;
}

interface Car {
  brand: string;
  color: "red" | "blue" | "yellow";
}

export type PersonRequest = {
  /**
   * @RequestPart body
   */
  person: Person[];

  /**
   * @RequestPart body
   */
  usercategory: string | { nomor: number }[];

  /**
   * @RequestPart query
   */
  id: string;

  /**
   * @RequestPart query
   * @TJS-format ipv4
   */
  ipv4: string;

  /**
   * @RequestPart param
   */
  something: "aaa" | "bbb";
};

export type PersonResponse = {
  cars: Car[];
};

export type CreateNewPerson = ActionHandler<PersonRequest, PersonResponse>;

/**
 * @Action
 * @Controller {
 *  "method": "post",
 *  "path": "/person/:something",
 *  "tag": "book",
 *  "security": [{"bearerAuth": []}]
 * }
 */
export function ImplCreateNewPerson(): CreateNewPerson {
  return async (ctx, req) => ({ cars: [] });
}
