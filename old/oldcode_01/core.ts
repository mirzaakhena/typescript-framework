// core.ts
export type Context<T extends Record<string, any> = Record<string, any>> = {
  data: T;
  traceId: string;
  date: Date;
};

export const newCtx = (): Context => {
  return {
    data: {},
    traceId: "123",
    date: new Date(),
  };
};

type ActionHandler<REQUEST = any, RESPONSE = any> = (ctx: Context, request: REQUEST) => Promise<RESPONSE>;

export type ServiceHandler<GATEWAYS = any, REQUEST = any, RESPONSE = any> = {
  setup: (g: GATEWAYS) => ActionHandler<REQUEST, RESPONSE>;
};

export type ActionHandlerWithDecorator<REQUEST = any, RESPONSE = any, DECORATOR = any> = {
  run: ActionHandler<REQUEST, RESPONSE>;
  decorator?: DECORATOR;
};

export type Plugin = (o: ActionHandlerWithDecorator) => ActionHandlerWithDecorator;

import * as fs from "fs";
import * as path from "path";
import { Project, SourceFile, Symbol, SyntaxKind, Type, TypeReferenceNode } from "ts-morph";

export const fileMap = new Map<string, ActionHandlerWithDecorator>();

export const funcMap = new Map<string, ActionHandlerWithDecorator>();

export async function createFunctionMap(folderPath: string, plugins?: Plugin[]) {
  //

  const project = new Project();

  // Read all files recursively in the folder
  function readFilesRecursively(dir: string) {
    const files = fs.readdirSync(dir);

    // console.log("read file", dir);

    files.forEach((file) => {
      const filePath = path.resolve(dir, file);
      const stat = fs.statSync(filePath);

      if (stat.isDirectory()) {
        readFilesRecursively(filePath);
      } else if (filePath.endsWith(".ts")) {
        project.addSourceFileAtPath(filePath);
      }
    });
  }

  function extractTypeDetails(type: Type) {
    const properties: { [key: string]: string } = {};
    const typeProperties = type.getProperties();

    typeProperties.forEach((property: Symbol) => {
      const propType = property.getValueDeclaration()?.getType().getText();
      if (propType) {
        properties[property.getName()] = propType;
      }
    });
    return properties;
  }

  function getTheReturnTypeName(returnTypeText: string) {
    const match = returnTypeText.match(/(?:import\(.+\)\.)?(\w+)/);
    return match ? match[1] : returnTypeText;
  }

  // Function to find the Type information starting from `DoSomething`
  function getTypeParametersFromActionHandler(returnTypeText: string, sourceFile: SourceFile) {
    // Find the `DoSomething` type alias declaration
    const theTypeAlias = sourceFile.getTypeAlias(returnTypeText);

    if (theTypeAlias) {
      //
      // Get the type node of the
      const theTypeNode = theTypeAlias.getTypeNode();

      if (theTypeNode && theTypeNode.getKind() === SyntaxKind.TypeReference) {
        // Cast the type node to a TypeReferenceNode to access its properties
        const typeReferenceNode = theTypeNode as TypeReferenceNode;

        // Get the type arguments of the
        const typeArguments = typeReferenceNode.getTypeArguments();

        if (typeArguments.length > 0) {
          return [extractTypeDetails(typeArguments[0].getType()), extractTypeDetails(typeArguments[1].getType())];
        }
      }
    }

    return [{}, {}];
  }

  readFilesRecursively(folderPath);

  for (const sourceFile of project.getSourceFiles()) {
    //

    const module = await import(sourceFile.getFilePath());

    for (const func of sourceFile.getFunctions()) {
      //

      if (!func.isExported()) continue;

      const gateways: Record<string, ActionHandlerWithDecorator> = {};
      const parameters = func.getParameters();
      if (parameters.length > 0) {
        const param = parameters[0];
        const paramType = param.getType();
        if (paramType.isObject()) {
          const paramTypeDetails = extractTypeDetails(paramType);
          for (const key in paramTypeDetails) {
            if (fileMap.has(paramTypeDetails[key])) {
              gateways[key] = fileMap.get(paramTypeDetails[key]) as ActionHandlerWithDecorator;
            }
          }
        }
      }

      const functionName = func.getName() as string;

      const functionResult = module[functionName](gateways) as ActionHandlerWithDecorator;

      const returnType = func.getReturnType().getText();

      // const [req, res] = getTypeParametersFromActionHandler(getTheReturnTypeName(returnType), sourceFile);

      // console.log(req, res);

      let current: ActionHandlerWithDecorator = functionResult;
      if (plugins) {
        for (const plugin of plugins) {
          current = plugin(current);
        }
      }

      fileMap.set(returnType, current);
      funcMap.set(getTheReturnTypeName(returnType), current);
    }
  }
}
