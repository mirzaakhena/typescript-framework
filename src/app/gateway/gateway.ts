import { DatabaseMySQL, DatabasePostgres } from "../config/config.js";
import { FindOnePersonByEmail, GenerateRandomId, Person, SavePerson } from "../model/model.js";

/**
 * @Gateway
 */
export function ImplFindOnePersonByEmail(g: DatabaseMySQL): FindOnePersonByEmail {
  return async (ctx, req) => {
    if (req.email === "abc@gmail.com") {
      const person = new Person();
      person.id = "999";
      person.email = "abc@gmail.com";
      return { person };
    }

    return { person: null };
  };
}

/**
 * @Gateway
 */
export function ImplSavePerson(g: DatabasePostgres): SavePerson {
  return async (ctx, req) => {
    return { id: req.person.id };
  };
}

/**
 * @Gateway
 */
export function ImplGenerateRandomId(): GenerateRandomId {
  return async (ctx, req) => {
    return "12345";
  };
}
