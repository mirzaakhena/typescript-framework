import { experimentAutomatic } from "./experiment/automatic.js";
import { experimentManual } from "./experiment/manual.js";
import { experimentOpenAPI } from "./experiment/open_api.js";
import { experimentRestAPI } from "./experiment/rest_api.js";
import { Try011 } from "./experiment/try011.js";
// import "./experiment/try020.js";
// import "./experiment/try030.js";

(async () => {
  // experimentManual();
  // experimentAutomatic();
  experimentRestAPI();
  // experimentOpenAPI();
  // await Try011();
})();
