import { ActionHandler } from "../../../core.js";
import { FindOnePersonByEmail, Person, SavePerson, GenerateRandomId } from "../model/model.js";

export type RegisterUniqueUser = ActionHandler<{ email: string }, { personId: string }>;

/**
 * @injectable {"as": "usecase"}
 * @decorator {
 *  "useLog": true
 * }
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
