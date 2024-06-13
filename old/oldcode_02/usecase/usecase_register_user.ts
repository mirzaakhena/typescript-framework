// src/usecase/usecase_register_user.ts

import { ActionHandler } from "../core.js";
import { FindOnePersonByEmail, Person, SavePerson, GenerateRandomId } from "../model/model.js";

export type Gateways = {
  findOnePersonByEmail: FindOnePersonByEmail;
  savePerson: SavePerson;
  generateRandomId: GenerateRandomId;
};

export type RegisterUniqueUser = ActionHandler<{ email: string }, { personId: string; dbUsed: any }>;

// /**
//  * @decorator {useLog: true}
//  */
// export function ImplRegisterUniqueUser(g: Gateways): RegisterUniqueUser {
//   return async (ctx, req) => {
//     //

//     if (req.email.trim() === "") {
//       throw new Error(`Email must not empty`);
//     }

//     const objPerson = await g.findOnePersonByEmail(ctx, { email: req.email });

//     if (objPerson.person) {
//       throw new Error(`Person with email ${req.email} already exist`);
//     }

//     const newPerson = new Person();
//     newPerson.email = req.email;
//     newPerson.id = await g.generateRandomId(ctx);

//     const savePersonDBUsed = await g.savePerson(ctx, { person: newPerson });

//     return {
//       personId: newPerson.id,
//       dbUsed: [
//         //
//         { findOnePersonByEmailDBUsed: objPerson.dbSource },
//         { savePersonDBUsed: savePersonDBUsed.dbSource },
//       ],
//     };
//   };
// }

/**
 * @decorator {useLog: true}
 */
export function ImplRegisterUniqueUser(findOnePersonByEmail: FindOnePersonByEmail, savePerson: SavePerson, generateRandomId: GenerateRandomId): RegisterUniqueUser {
  return async (ctx, req) => {
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

    const savePersonDBUsed = await savePerson(ctx, { person: newPerson });

    return {
      personId: newPerson.id,
      dbUsed: [{ findOnePersonByEmailDBUsed: objPerson.dbSource }, { savePersonDBUsed: savePersonDBUsed.dbSource }],
    };
  };
}
