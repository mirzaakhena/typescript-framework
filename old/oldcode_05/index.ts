import { experimentAutomatic } from "./experiment/automatic.js";
import { experimentManual } from "./experiment/manual.js";
import { experimentRestAPI } from "./experiment/rest_api.js";
import { TryMe } from "./experiment/tryme02.js";

(async () => {
  // experimentManual();
  // experimentAutomatic();
  // experimentRestAPI();
  TryMe();
})();
