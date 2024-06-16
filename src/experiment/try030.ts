import "reflect-metadata";

function RequestPart(part: "body" | "query" | "param") {
  return function (target: any, propertyKey: string) {
    Reflect.defineMetadata("RequestPart", part, target, propertyKey);
  };
}

export type Person = {
  name: string;
  age: number;
};

class PersonRequest {
  @RequestPart("body")
  person: Person;

  @RequestPart("query")
  id: string;

  @RequestPart("param")
  something: string;
}

function categorizeRequestParts<T extends object>(request: T) {
  const body: any = {};
  const query: any = {};
  const param: any = {};

  for (const key of Object.keys(request)) {
    const partType = Reflect.getMetadata("RequestPart", request, key);
    if (partType === "body") {
      body[key] = (request as any)[key];
    } else if (partType === "query") {
      query[key] = (request as any)[key];
    } else if (partType === "param") {
      param[key] = (request as any)[key];
    }
  }

  return { body, query, param };
}

const personRequest = new PersonRequest();
personRequest.person = { name: "John Doe", age: 30 };
personRequest.id = "123";
personRequest.something = "example";

const categorized = categorizeRequestParts(personRequest);
console.log(categorized);
// Output should be:
// {
//   body: { person: { name: 'John Doe', age: 30 } },
//   query: { id: '123' },
//   param: { something: 'example' }
// }
