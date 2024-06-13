import { FunctionDeclaration, Project, SourceFile, SyntaxKind, ts, TypeReferenceNode } from "ts-morph";

export type Context<T extends Record<string, any> = Record<string, any>> = {
  data: T;
  traceId: string;
  date: Date;
};

export const newCtx = (): Context => ({ data: {}, traceId: "123", date: new Date() });

export type ActionHandler<REQUEST = any, RESPONSE = any> = (ctx: Context, request: REQUEST) => Promise<RESPONSE>;

export type PluginHandler<T = any> = (ah: ActionHandler, funcName: string, metadataDecorator?: T) => ActionHandler;

class ClosureDI {
  //

  private container: Map<string, any> = new Map();

  public async scanDir(directory: string, ...plugins: PluginHandler[]) {
    //

    const project: Project = new Project();

    project.addSourceFilesAtPaths(`${directory}/**/*.ts`);

    const sourceFiles = project.getSourceFiles();

    const pendingFunctions: FunctionDeclaration[] = [];

    for (const sourceFile of sourceFiles) {
      //

      const funcs = sourceFile.getFunctions();

      const module = await import(sourceFile.getFilePath());

      for (const func of funcs) {
        //

        if (!func.isExported()) continue;

        const returnTypeNode = func.getReturnTypeNode();

        if (!returnTypeNode) continue;

        const funcName = func.getName();

        if (!funcName) continue;

        const returnTypeNodeText = (returnTypeNode as TypeReferenceNode).getText();

        const { paramHandlers, pendingFunction } = this.getParameterHandlers(func);

        if (pendingFunction) {
          pendingFunctions.push(pendingFunction);
          continue;
        }

        const decorator = this.getDecoratorMetadata(func);

        const funcResult = module[funcName](...paramHandlers);

        let currentResult = funcResult;

        for (const plugin of plugins) {
          currentResult = plugin(currentResult, funcName, decorator);
        }

        this.container.set(returnTypeNodeText, currentResult);
      }
    }
  }

  // Update the getParameterHandlers method
  private getParameterHandlers(func: FunctionDeclaration) {
    const paramHandlers: ActionHandler[] = [];

    let pendingFunction: FunctionDeclaration | undefined = undefined;

    for (const param of func.getParameters()) {
      const typeNode = param.getTypeNode() as TypeReferenceNode;
      const paramTypeName = typeNode.getText();

      // Directly check the function map for the parameter type name
      if (this.container.has(paramTypeName)) {
        // console.log(`Parameter type '${paramTypeName}' found in functionMap`);
        const p = this.container.get(paramTypeName) as ActionHandler;
        paramHandlers.push(p);
      } else {
        pendingFunction = func;
        // console.warn(`>>>> type '${paramTypeName}' from parameter name : '${param.getName()}' not found in functionMap`);
      }
    }
    return { paramHandlers, pendingFunction };
  }

  private getDecoratorMetadata(func: FunctionDeclaration) {
    const jsDoc = func
      .getJsDocs()
      .map((doc) => doc.getInnerText())
      .join("\n");

    if (!jsDoc) return {};

    const decoratorRegex = /@decorator\s*({[\s\S]*?})/;
    const match = jsDoc.match(decoratorRegex);

    if (!match) return {};

    try {
      const jsonString = match[1].replace(/^\s*/gm, "").replace(/\s*$/, "");
      return JSON.parse(jsonString);
    } catch {
      return {};
    }
  }

  get(returnTypeName: string) {
    return this.container.get(returnTypeName) as ActionHandler;
  }

  getAll() {
    return this.container;
  }
}

export class DependencyScanner {
  //

  private project: Project;

  constructor(projectRoot: string = ".") {
    this.project = new Project({
      tsConfigFilePath: `${projectRoot}/tsconfig.json`,
    });
  }

  scanFunctions() {
    const sourceFiles = this.project.getSourceFiles();
    const functions: Array<{ name: string; dependencies: string[]; func: FunctionDeclaration }> = [];

    sourceFiles.forEach((sourceFile) => {
      const funcs = sourceFile.getFunctions();

      for (const func of funcs) {
        if (!func.isExported()) continue;

        const returnTypeNode = func.getReturnTypeNode();

        if (!returnTypeNode) continue;

        const funcName = func.getName();

        if (!funcName) continue;

        const functionReturnTypeName = getFunctionReturnTypeName(func);

        const dependencies = getFunctionParameters(func);

        // const returnType = func.getReturnType();

        // const aliasSymbol = returnType.getAliasSymbol() as Symbol;

        // if (aliasSymbol) {
        //   const aliasType = aliasSymbol.getDeclaredType();
        //   const typeText = aliasType.getText();

        //   console.log(">>>::", typeText);

        //   // We need to parse the type text to get the original type
        //   const matches = typeText.match(/^(\w+)<.*>$/);
        //   if (matches) {
        //     console.log(">>>>>> %s", matches[1]);
        //   }
        // }

        getSourceOfType(this.project, sourceFile, functionReturnTypeName);

        functions.push({ name: functionReturnTypeName, dependencies, func });
      }
    });

    return functions;
  }
}

export class DependencyResolver {
  private functions: Array<{ name: string; dependencies: string[]; func: FunctionDeclaration }>;
  private resolvedDependencies: Set<string> = new Set();
  private visited: Set<string> = new Set();
  private inStack: Set<string> = new Set();
  private stack: string[] = [];

  constructor(functions: Array<{ name: string; dependencies: string[]; func: FunctionDeclaration }>) {
    this.functions = functions;
  }

  private getInDegree(): { [key: string]: number } {
    const inDegree: { [key: string]: number } = {};

    this.functions.forEach((func) => {
      inDegree[func.name] = 0;
      func.dependencies.forEach((dep) => {
        inDegree[dep] = (inDegree[dep] || 0) + 1;
      });
    });

    return inDegree;
  }

  private detectCycle(node: string, adjList: { [key: string]: string[] }): string[] | null {
    if (this.inStack.has(node)) {
      const cyclePath = this.stack.slice(this.stack.indexOf(node));
      cyclePath.push(node); // tambahkan node awal untuk menunjukkan siklus utuh
      return cyclePath;
    }

    if (this.visited.has(node)) {
      return null; // Sudah diproses dan tidak ada siklus
    }

    this.visited.add(node);
    this.inStack.add(node);
    this.stack.push(node);

    for (const neighbor of adjList[node] || []) {
      const result = this.detectCycle(neighbor, adjList);
      if (result) {
        return result;
      }
    }

    this.inStack.delete(node);
    this.stack.pop();
    return null;
  }

  private findCircularDependency(): string[] | null {
    const adjList: { [key: string]: string[] } = {};

    this.functions.forEach((func) => {
      adjList[func.name] = func.dependencies;
    });

    for (const func of this.functions) {
      const result = this.detectCycle(func.name, adjList);
      if (result) {
        return result; // Siklus ditemukan
      }
    }

    return null; // Tidak ada siklus
  }

  private checkMissingDependencies(): void {
    const functionNames = new Set(this.functions.map((func) => func.name));

    this.functions.forEach((func) => {
      func.dependencies.forEach((dep) => {
        if (!functionNames.has(dep)) {
          throw new Error(`Function ${func.name} cannot be resolved because it depends on ${dep} which is not defined.`);
        }
      });
    });
  }

  sortFunctions(): Array<{ name: string; func: FunctionDeclaration }> {
    this.checkMissingDependencies();

    const cycle = this.findCircularDependency();
    if (cycle) {
      throw new Error(`Circular dependency detected: ${cycle.join(" -> ")}`);
    }

    const inDegree = this.getInDegree();
    const sorted: Array<{ name: string; func: FunctionDeclaration }> = [];
    const queue: string[] = [];

    this.functions.forEach((func) => {
      if (func.dependencies.length === 0) {
        queue.push(func.name);
        this.resolvedDependencies.add(func.name);
      }
    });

    queue.sort((a, b) => inDegree[a] - inDegree[b]);

    while (queue.length > 0) {
      const node = queue.shift()!;
      const funcObj = this.functions.find((func) => func.name === node)!;
      sorted.push({ name: funcObj.name, func: funcObj.func });

      this.functions.forEach((func) => {
        if (func.dependencies.includes(node)) {
          func.dependencies = func.dependencies.filter((dep) => dep !== node);
          if (!this.resolvedDependencies.has(func.name) && func.dependencies.length === 0) {
            queue.push(func.name);
            this.resolvedDependencies.add(func.name);
          }
        }
      });

      queue.sort((a, b) => inDegree[a] - inDegree[b]);
    }

    return sorted;
  }
}

export { ClosureDI };

export function getFunctionMetadata(func: FunctionDeclaration) {
  const decorators: { name: string; data: any }[] = [];

  const jsDocs = func.getJsDocs();

  jsDocs.forEach((jsDoc) => {
    const innerText = jsDoc.getInnerText().split("\n");

    innerText.forEach((text) => {
      const decoratorRegex = /@\s*(\w+)\s*(\{\s*.*?\s*\})?/;
      const match = text.match(decoratorRegex);

      if (match) {
        const name = match[1];
        const decoratorData = match[2] ? JSON.parse(match[2]) : null;

        decorators.push({
          name,
          ...(decoratorData && { data: decoratorData }),
        });
      }
    });
  });

  return decorators;
}

export function getFunctionParameters(func: FunctionDeclaration) {
  return func.getParameters().map((param) => (param.getTypeNode() as TypeReferenceNode).getText());
}

export function getFunctionReturnTypeName(func: FunctionDeclaration) {
  return (func.getReturnTypeNode() as TypeReferenceNode).getText();
}

export function getBaseType(sourceFile: SourceFile, functionReturnTypeName: string) {
  // Find the type alias declaration by name
  const typeAlias = sourceFile.getTypeAlias(functionReturnTypeName);

  if (!typeAlias) {
    throw new Error(`Type alias with name ${functionReturnTypeName} not found`);
  }

  // Get the right-hand side type
  const typeNode = typeAlias.getTypeNode();

  if (!typeNode) {
    throw new Error(`Right-hand side type for ${functionReturnTypeName} not found`);
  }

  // Return the text representation of the type node
  return typeNode.getText();
}

export function getSourceOfType(project: Project, sourceFile: SourceFile, functionReturnTypeName: string) {
  const identifier = sourceFile.getDescendantsOfKind(SyntaxKind.Identifier).find((id) => id.getText() === functionReturnTypeName);

  if (identifier) {
    const typeAlias = identifier.getFirstAncestorByKind(SyntaxKind.TypeAliasDeclaration);
    if (typeAlias) {
      // console.log("%s is declared in the same file.", functionReturnTypeName);
    } else {
      const importDeclarations = sourceFile.getImportDeclarations();
      let isImported = false;

      for (const importDecl of importDeclarations) {
        const namedImports = importDecl.getNamedImports();

        for (const namedImport of namedImports) {
          if (namedImport.getName() !== functionReturnTypeName) {
            continue;
          }

          isImported = true;
          const importPath = importDecl.getModuleSpecifierValue();
          // console.log("%s is imported from file: %s", functionReturnTypeName, importPath);

          // Resolve the path to the TypeScript file using TypeScript's module resolution
          const resolvedModule = ts.resolveModuleName(importPath, sourceFile.getFilePath(), project.getCompilerOptions(), ts.sys);

          if (resolvedModule.resolvedModule) {
            const resolvedFileName = resolvedModule.resolvedModule.resolvedFileName;
            const importedSourceFile = project.getSourceFile(resolvedFileName);

            if (importedSourceFile) {
              const baseType = getBaseType(importedSourceFile, functionReturnTypeName);
              console.log("Base type of %s: %s", functionReturnTypeName, baseType);
              return;
            } else {
              // console.error(`>>>> Could not find source file for resolved path: ${resolvedFileName}`);
            }
          } else {
            // console.error(`>>>> Could not resolve module for import path: ${importPath}`);
          }
        }
      }
      if (!isImported) {
        // console.log("%s is neither declared nor imported in the same file.", functionReturnTypeName);
      }
    }
  } else {
    // console.log("%s identifier is not found.", functionReturnTypeName);
  }
}
