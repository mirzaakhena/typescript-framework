import { ActionHandler } from "../../core/type.js";
import { FindOnePersonByEmail, GenerateRandomId, Person, SavePerson } from "../model/model.js";

type Request = {
  /**
   * @Restapi {"type": "query"}
   */
  email: string;
  age: number;
};

type Response = {
  personId: Person[];
};

/**
 * @Something
 */
export type RegisterUniqueUser = ActionHandler<Request, Response>;

/**
 * @Action
 * @Controller { "method": "get", "path": "/registeruser", "tag": "user", "security": "bearer" }
 */
export function ImplRegisterUniqueUser( //
  findOnePersonByEmail: FindOnePersonByEmail, //
  savePerson: SavePerson,
  generateRandomId: GenerateRandomId
): RegisterUniqueUser {
  //
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

    return { personId: [newPerson] };
  };
}
