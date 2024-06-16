interface JSONSchema {
  type: string;
  properties: any;
  required: string[];
  definitions?: any;
  $schema?: string;
}

interface OpenAPISchema {
  openapi: string;
  info: {
    title: string;
    version: string;
  };
  paths: {
    [path: string]: {
      [method: string]: {
        requestBody: {
          content: {
            [mediaType: string]: {
              schema: any;
            };
          };
          required: boolean;
        };
        responses: any;
      };
    };
  };
  components: {
    schemas: any;
  };
}

const jsonSchema2: JSONSchema = {
  type: "object",
  properties: {
    person: {
      type: "array",
      items: {
        $ref: "#/definitions/Person",
      },
    },
  },
  required: ["person"],
  definitions: {
    Person: {
      type: "object",
      properties: {
        name: {
          type: "string",
        },
        age: {
          type: "number",
        },
        hasPet: {
          type: "boolean",
        },
      },
      required: ["age", "hasPet", "name"],
    },
  },
  $schema: "http://json-schema.org/draft-07/schema#",
};

const jsonSchema: JSONSchema = {
  type: "object",
  properties: {
    person: {
      $ref: "#/definitions/Person",
    },
  },
  required: ["person"],
  definitions: {
    Person: {
      type: "object",
      properties: {
        name: {
          type: "string",
        },
        age: {
          type: "number",
        },
        hasPet: {
          type: "boolean",
        },
      },
      required: ["age", "hasPet", "name"],
    },
  },
  $schema: "http://json-schema.org/draft-07/schema#",
};

function updateReferences(schema: any) {
  if (typeof schema !== "object" || schema === null) {
    return;
  }

  for (const key in schema) {
    if (schema.hasOwnProperty(key)) {
      if (key === "$ref") {
        schema[key] = schema[key].replace("#/definitions/", "#/components/schemas/");
      } else {
        updateReferences(schema[key]);
      }
    }
  }
}

function convertToOpenAPI(jsonSchema: JSONSchema): OpenAPISchema {
  const { definitions, $schema, ...schemaWithoutDefinitions } = jsonSchema;

  // Update references recursively
  updateReferences(schemaWithoutDefinitions);

  return {
    openapi: "3.0.0",
    info: {
      title: "Converted Schema",
      version: "1.0.0",
    },
    paths: {
      "/example": {
        post: {
          requestBody: {
            content: {
              "application/json": {
                schema: schemaWithoutDefinitions,
              },
            },
            required: true,
          },
          responses: {
            "200": {
              description: "Success",
            },
          },
        },
      },
    },
    components: {
      schemas: definitions || {},
    },
  };
}

const openAPISchema = convertToOpenAPI(jsonSchema);
console.log(JSON.stringify(openAPISchema, null, 2));
