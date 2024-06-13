// src/core.ts

import * as fs from "fs";
import * as path from "path";
import { Project, Symbol, Type, TypeReferenceNode, FunctionDeclaration } from "ts-morph";

export type Context<T extends Record<string, any> = Record<string, any>> = {
  data: T;
  traceId: string;
  date: Date;
};

export const newCtx = (): Context => ({ data: {}, traceId: "123", date: new Date() });

export type ActionHandler<REQUEST = any, RESPONSE = any> = (ctx: Context, request: REQUEST) => Promise<RESPONSE>;

export type PluginHandler<T = any> = (ah: ActionHandler, funcName: string, functionMetadata?: T) => ActionHandler;

class MyFramework {
  private functionMap: Map<string, ActionHandler> = new Map();
  private project = new Project();

  async createFunctionMap(directory: string, ...plugins: PluginHandler[]): Promise<void> {
    this.readFilesRecursively(directory);

    for (const sourceFile of this.project.getSourceFiles()) {
      const module = await import(sourceFile.getFilePath());

      for (const func of sourceFile.getFunctions()) {
        if (!func.isExported()) continue;

        const functionName = func.getName() as string;
        const returnTypeNode = func.getReturnTypeNode() as TypeReferenceNode;

        let metadata = {};

        func.getJsDocs().forEach((doc) => {
          const comment = doc.getInnerText();
          const decoratorRegex = /@decorator\s*\{([^}]+)\}/;
          const match = decoratorRegex.exec(comment);
          if (match) {
            const decoratorContent = match[1].trim();
            const decoratorObject = eval(`({${decoratorContent}})`);
            metadata = { ...metadata, ...decoratorObject };
          }
        });

        console.log(`Processing function: ${functionName}`);
        const paramHandlers = this.getParameterHandlers(func);

        // Verify the handlers
        paramHandlers.forEach((handler, index) => {
          console.log(`Parameter ${index}: ${handler ? "Handler found" : "No handler found"}`);
        });

        const functionResult = module[functionName](...paramHandlers) as ActionHandler;

        let current: ActionHandler = functionResult;

        for (const plugin of plugins) {
          current = plugin(current, functionName, metadata);
        }

        this.functionMap.set(returnTypeNode.getText(), current);
      }
    }
  }

  get(name: string): ActionHandler | undefined {
    return this.functionMap.get(name);
  }

  getAll() {
    return this.functionMap;
  }

  // Update only the getParameterHandlers method

  // Update the getParameterHandlers method
  private getParameterHandlers(func: FunctionDeclaration) {
    const paramHandlers = [];
    for (const param of func.getParameters()) {
      const paramType = param.getType().getApparentType();
      const paramTypeName = paramType.getText();

      // Directly check the function map for the parameter type name
      if (this.functionMap.has(paramTypeName)) {
        console.log(`Parameter type '${paramTypeName}' found in functionMap`);
        paramHandlers.push(this.functionMap.get(paramTypeName));
      } else if (paramType.isObject()) {
        const paramTypeDetails = this.extractTypeDetails(paramType);
        const detailedHandlers: Record<string, ActionHandler> = {};

        for (const key in paramTypeDetails) {
          const returnTypeName = this.getTheReturnTypeName(paramTypeDetails[key]);
          if (this.functionMap.has(returnTypeName)) {
            detailedHandlers[key] = this.functionMap.get(returnTypeName) as ActionHandler;
          }
        }

        if (Object.keys(detailedHandlers).length > 0) {
          paramHandlers.push(detailedHandlers);
          console.log(`Parameter type '${paramTypeName}' is an object with resolved handlers`);
        } else {
          console.warn(`No handlers found for object type '${paramTypeName}'`);
        }
      } else {
        console.warn(`Parameter type '${paramTypeName}' not found in functionMap`);
        paramHandlers.push(undefined);
      }
    }
    return paramHandlers;
  }

  private extractTypeDetails(type: Type) {
    const properties: { [key: string]: string } = {};
    const typeProperties = type.getProperties();

    if (typeProperties) {
      typeProperties.forEach((property) => {
        const valueDeclaration = property.getValueDeclaration();
        if (valueDeclaration) {
          const propType = valueDeclaration.getType().getText();
          properties[property.getName()] = propType;
        }
      });
    }
    return properties;
  }

  private getTheReturnTypeName(returnTypeText: string) {
    const match = returnTypeText.match(/(?:import\(.+\)\.)?(\w+)/);
    return match ? match[1] : returnTypeText;
  }

  private readFilesRecursively(dir: string) {
    const files = fs.readdirSync(dir);
    files.forEach((file) => {
      const filePath = path.resolve(dir, file);
      const stat = fs.statSync(filePath);

      if (stat.isDirectory()) {
        this.readFilesRecursively(filePath);
      } else if (filePath.endsWith(".ts")) {
        this.project.addSourceFileAtPath(filePath);
      }
    });
  }
}

export { MyFramework };
