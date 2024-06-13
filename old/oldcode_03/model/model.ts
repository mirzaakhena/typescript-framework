// src/model/model.ts

import { ActionHandler } from "../framework/base_type.js";

export class Person {
  id: string;
  email: string;
}

/**
 * @decorator {useLog: true}
 */
export type FindOnePersonByEmail = ActionHandler<{ email: string }, { person: Person | null }>;

/**
 * @decorator {useLog: true}
 */
export type SavePerson = ActionHandler<{ person: Person }, { id: string }>;

/**
 * @decorator {useLog: true}
 */
export type GenerateRandomId = ActionHandler<void, string>;
