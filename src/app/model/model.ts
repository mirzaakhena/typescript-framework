import { ActionHandler } from "../../core/type.js";

export class Person {
  id: string;
  email: string;
}

type FindOnePersonByEmailRequest = { email: string };

type FindOnePersonByEmailResponse = { person: Person | null };

export type FindOnePersonByEmail = ActionHandler<FindOnePersonByEmailRequest, FindOnePersonByEmailResponse>;

/**
 * @Aaaa
 */
type SavePersonRequest = {
  /**
   * @Bbbb
   */
  person: Person;
};

type SavePersonResponse = { id: string };

export type SavePerson = ActionHandler<SavePersonRequest, SavePersonResponse>;

// export type SavePerson = ActionHandler<{ person: Person }, { id: string }>;

export type GenerateRandomId = ActionHandler<void, string>;
