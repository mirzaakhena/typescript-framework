import { ActionHandler, PluginHandler } from "../../../core.js";

export type Logging = PluginHandler<{ useLog: boolean }>;

export class Person {
  id: string;
  email: string;
}

export type FindOnePersonByEmail = ActionHandler<{ email: string }, { person: Person | null }>;

export type SavePerson = ActionHandler<{ person: Person }, { id: string }>;

export type GenerateRandomId = ActionHandler<void, string>;
