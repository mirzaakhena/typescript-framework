// src/gatewayimpl/gateway.ts

import { DatabaseMySQL, DatabasePostgres } from "../config/database.js";
import { FindOnePersonByEmail, Person, SavePerson, GenerateRandomId } from "../model/model.js";

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

export function ImplSavePerson(g: DatabasePostgres): SavePerson {
  return async (ctx, req) => {
    return {
      id: req.person.id,
    };
  };
}

export function ImplGenerateRandomId(): GenerateRandomId {
  return async (ctx, req) => {
    return "12345";
  };
}
