import { ActionHandler } from "../../core/core.js";

export class Person {
  id: string;
  email: string;
}

type FindOnePersonByEmailRequest = { email: string };

type FindOnePersonByEmailResponse = { person: Person | null };

export type FindOnePersonByEmail = ActionHandler<FindOnePersonByEmailRequest, FindOnePersonByEmailResponse>;

export type SavePerson = ActionHandler<{ person: Person }, { id: string }>;

export type GenerateRandomId = ActionHandler<void, string>;
