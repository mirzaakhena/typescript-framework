import { ActionHandlerWithDecorator } from "../core.js";
import { AutoTransaction } from "../plugin/plugin.js";

export type Service1 = ActionHandlerWithDecorator<{}, { message: string } | null, AutoTransaction>;
export type Service2 = ActionHandlerWithDecorator<{}, { value: string } | null>;
