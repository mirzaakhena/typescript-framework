import { ActionHandler } from "../../core/core.js";
import { FindOnePersonByEmail, Person, SavePerson, GenerateRandomId } from "../model/model.js";

/**
 * @apalah
 */
class Request {
  /**
   * @coba 123
   */
  email: string;

  /**
   * @test12 {"aaa":"nonon"}
   */
  age: number;
}

type Response = { personId: string };

/**
 * @Something
 */
export type RegisterUniqueUser = ActionHandler<Request, Response>;

/**
 * @Injectable { "as": "usecase" }
 * @Controller { "method": "get", "path": "/registeruser", "tag": "user" }
 * @Logging
 */
export function ImplRegisterUniqueUser( //
  findOnePersonByEmail: FindOnePersonByEmail, //
  savePerson: SavePerson,
  generateRandomId: GenerateRandomId
): RegisterUniqueUser {
  //

  return async (ctx, req) => {
    //

    if (req.email.trim() === "") {
      throw new Error(`Email must not be empty`);
    }

    const objPerson = await findOnePersonByEmail(ctx, { email: req.email });

    if (objPerson.person) {
      throw new Error(`Person with email ${req.email} already exists`);
    }

    const newPerson = new Person();
    newPerson.email = req.email;
    newPerson.id = await generateRandomId(ctx);

    await savePerson(ctx, { person: newPerson });

    return { personId: newPerson.id };
  };
}
