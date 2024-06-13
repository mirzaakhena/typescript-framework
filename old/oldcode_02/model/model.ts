// src/model/model.ts

import { ActionHandler } from "../core.js";

export class Person {
  id: string;
  email: string;
}

/**
 * @decorator {"useLog": true}
 */
export type FindOnePersonByEmail = ActionHandler<{ email: string }, { person: Person | null; dbSource: string }>;

/**
 * @decorator {"useLog": true}
 */
export type SavePerson = ActionHandler<{ person: Person }, { id: string; dbSource: string }>;

/**
 * @decorator {"useLog": true}
 */
export type GenerateRandomId = ActionHandler<void, string>;
