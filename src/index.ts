import { experimentAutomatic } from "./experiment/automatic.js";
import { experimentManual } from "./experiment/manual.js";
import { experimentOpenAPI } from "./experiment/openapi.js";
import { experimentRestAPI } from "./experiment/rest_api.js";

(async () => {
  // experimentManual();
  experimentAutomatic();
  // experimentRestAPI();
  // experimentOpenAPI();
})();
