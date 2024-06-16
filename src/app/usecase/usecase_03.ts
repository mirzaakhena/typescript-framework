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
   * @RestApi body
   */
  person: Person[];

  /**
   * @RestApi body
   */
  usercategory: string;

  /**
   * @RestApi query
   */
  id: string;

  /**
   * @RestApi query
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
