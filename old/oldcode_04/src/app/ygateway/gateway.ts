import { DatabaseMySQL, DatabasePostgres } from "../zconfig/config.js";
import { FindOnePersonByEmail, Person, SavePerson, GenerateRandomId } from "../model/model.js";

/**
 * @injectable {"as": "gateway"}
 * @decorator2 { "useLog": true }
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
 * @injectable {"as": "gateway"}
 * @decorator2 { "useLog": true }
 */
export function ImplSavePerson(g: DatabasePostgres): SavePerson {
  return async (ctx, req) => {
    return { id: req.person.id };
  };
}

/**
 * @decorator2 { "useLog": true }
 */
export function ImplGenerateRandomId(): GenerateRandomId {
  return async (ctx, req) => {
    return "12345";
  };
}
