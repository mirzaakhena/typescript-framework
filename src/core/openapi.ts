import * as TJS from "typescript-json-schema";
import { OpenAPI3, ParameterObject, ResponsesObject, SchemaObject } from "../core/openapi_types.js";
import { FuncInstanceMetadata } from "../core/type.js";
import { camelToPascalWithSpace } from "./helper.js";

export function generateOpenAPIObject(usecases: FuncInstanceMetadata[]) {
  //

  const settings: TJS.PartialArgs = { required: true };
  const compilerOptions: TJS.CompilerOptions = { strictNullChecks: true };

  const openAPIObject: OpenAPI3 = {
    openapi: "3.0.0",
    info: { title: "App", version: "1.0.0" },
    paths: {},
  };

  const paths = usecases.map(({ funcMetadata }) => funcMetadata.request?.path as string);

  const program = TJS.getProgramFromFiles(paths, compilerOptions);

  usecases.forEach(({ funcMetadata }) => {
    //

    const requestField = TJS.generateSchema(program, funcMetadata.request?.name as string, settings);
    delete requestField?.$schema;

    const responseField = TJS.generateSchema(program, funcMetadata.response?.name as string, settings);
    delete responseField?.$schema;

    const data = funcMetadata.decorators.find((x) => x.name === "Controller")?.data; //as { method: Methods; path: string; tag: string };

    let path = data.path;

    const parameters: ParameterObject[] = [];

    let requiredRequestBody = false;

    let requestBody = {};

    funcMetadata.request?.structure.forEach((x) => {
      //

      x.decorator.forEach((y) => {
        //

        if (y.name !== "RestApi") return;

        if (y.data.type === "param") {
          //

          path = path.replace(`:${x.name}`, `{${x.name}}`);

          let schema = (requestField?.properties?.[x.name] as SchemaObject) ?? { type: x.type };
          parameters.push({
            in: "path",
            name: x.name,
            schema,
            required: true,
          });
        }

        if (y.data.type === "query") {
          let schema = (requestField?.properties?.[x.name] as SchemaObject) ?? { type: x.type };
          parameters.push({
            in: "query",
            name: x.name,
            schema,
          });
        }

        if (y.data.type === "body") {
          requiredRequestBody = true;

          const copyObj = { ...requestField?.properties };

          Object.keys(copyObj)
            .filter((z) => z !== x.name)
            .forEach((w) => delete copyObj[w]);

          requestBody = { ...requestBody, ...((copyObj as SchemaObject) ?? {}) };
        }
      });
    });

    openAPIObject.paths = {
      ...openAPIObject.paths,
      [path]: {
        ...openAPIObject.paths![path],
        [data.method]: {
          tags: [data.tag],
          operationId: funcMetadata.name,
          summary: camelToPascalWithSpace(funcMetadata.name),
          parameters,
          requestBody:
            data.method === "get" || data.method === "delete" || data.method === "options" || data.method === "head"
              ? undefined
              : {
                  required: requiredRequestBody,
                  description: "",
                  content: {
                    "application/json": {
                      schema: {
                        type: "object",
                        properties: requestBody,
                      },
                    },
                  },
                },
          responses: {
            default: {
              description: "",
              content: {
                "application/json": {
                  schema: responseField as SchemaObject,
                },
              },
            },
          } as ResponsesObject,
        },
      },
    };
  });

  return openAPIObject;
}
