import { ActionHandler } from "../../core/type.js";

interface Person {
  name: string;
  age: number;
  hasPet: boolean;
}

type Car = {
  brand: string;
  color: "red" | "blue" | "yellow";
};

export type PersonRequest = {
  /**
   * @RestApi {"type": "body"}
   */
  person: Person[];

  /**
   * @RestApi {"type": "body"}
   */
  usercategory: string;

  /**
   * @RestApi {"type": "query"}
   */
  id: string;

  /**
   * @RestApi {"type": "query"}
   * @TJS-pattern ^[a-zA-Z0-9]{4}-abc_123$
   */
  regexPattern: string;

  /**
   * @RestApi {"type": "param"}
   */
  something: "aaa" | "bbb";
};

export type PersonResponse = {
  cars: Car[];
};

export type CreateNewPerson = ActionHandler<PersonRequest, PersonResponse>;

/**
 * @Action
 * @Controller { "method": "post", "path": "/person/:something", "tag": "book" }
 */
export function ImplCreateNewPerson(): CreateNewPerson {
  return async (ctx, req) => ({ cars: [] });
}
