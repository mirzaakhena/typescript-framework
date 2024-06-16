import { Singleton } from "../core/core.js";
import { generateOpenAPIObject } from "../core/openapi.js";

export async function Try011() {
  const application = await Singleton.getInstance().startScan();
  const usecases = Array.from(application.getContainer().values()) //
    .filter((x) => x.funcMetadata.decorators.some((y) => y.name === "Controller"));

  const securitySchema = {
    bearerAuth: {
      type: "http" as const,
      scheme: "bearer",
      bearerFormat: "JWT",
    },
    bearerAuthVendor: {
      type: "http" as const,
      scheme: "bearer",
      bearerFormat: "JWT",
    },
  };

  const openapi = generateOpenAPIObject(usecases, securitySchema);

  console.log(JSON.stringify(openapi, null, 2));
}
