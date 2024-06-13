// src/gatewayimpl/gateway_one.ts

import { DatabaseMySQL, DatabasePostgres } from "../config/database.js";
import { FindOnePersonByEmail, Person, SavePerson, GenerateRandomId } from "../model/model.js";

/**
 * @decorator {useLog: true}
 */
export function ImplFindOnePersonByEmail(g: DatabaseMySQL): FindOnePersonByEmail {
  return async (ctx, req) => {
    if (req.email === "abc@gmail.com") {
      const person = new Person();
      person.id = "999";
      person.email = "abc@gmail.com";
      return { person, dbSource: "" };
    }

    return { person: null, dbSource: "" };
  };
}

/**
 *
 * @decorator {useLog: true}
 * @param g
 * @returns
 */
export function ImplSavePerson(g: DatabasePostgres): SavePerson {
  return async (ctx, req) => {
    return {
      id: req.person.id,
      dbSource: "",
    };
  };
}

/**
 * @decorator {useLog: true}
 * @returns
 */
export function ImplGenerateRandomId(): GenerateRandomId {
  return async (ctx, req) => {
    return "12345";
  };
}
