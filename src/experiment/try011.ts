import * as TJS from "typescript-json-schema";
import { Singleton } from "../core/core.js";
import { generateOpenAPIObject } from "../core/openapi.js";

export async function Try011() {
  const application = await Singleton.getInstance().startScan();
  const usecases = Array.from(application.getContainer().values()) //
    .filter((x) => x.funcMetadata.decorators.some((y) => y.name === "Controller"));

  const openapi = generateOpenAPIObject(usecases);

  console.log(JSON.stringify(openapi, null, 2));
}
