import { FunctionDeclaration, Project, SourceFile, SyntaxKind, Symbol, ts, Type, TypeNode, TypeReferenceNode, TypeAliasDeclaration } from "ts-morph";

export type Context<T extends Record<string, any> = Record<string, any>> = {
  data: T;
  traceId: string;
  date: Date;
};

export const newCtx = (): Context => ({ data: {}, traceId: "123", date: new Date() });

export type ActionHandler<REQUEST = any, RESPONSE = any> = (ctx: Context, request: REQUEST) => Promise<RESPONSE>;

export type UsecaseHandler<REQUEST = any, RESPONSE = any> = ActionHandler<REQUEST, RESPONSE>;

export type GatewayHandler<REQUEST = any, RESPONSE = any> = ActionHandler<REQUEST, RESPONSE>;

export type PluginHandler<T = any> = (ah: ActionHandler, functionMetadata: FunctionMetadata, extendInfo?: T) => ActionHandler;

type Decorator = { name: string; data: any };

export type FunctionMetadata = {
  name: string;
  dependencies: string[];
  kind: "usecase" | "gateway" | "config" | "plugin";
  decorators: Decorator[];
};

async function scanFunctions(project: Project) {
  //

  const injectableDecorator = "Injectable" as const;

  const actionHandlerType = ["gateway", "usecase"] as const;

  const funcMetadatas: Array<FunctionMetadata> = [];

  const funcDeclMap: Map<string, FunctionDeclaration> = new Map();

  project.getSourceFiles().forEach((sourceFile) => {
    //

    sourceFile.getFunctions().forEach((func) => {
      //

      if (!func.isExported()) return;

      const funcName = func.getName();

      if (!funcName) return;

      const returnTypeNode = func.getReturnTypeNode();

      if (!returnTypeNode) return;

      const functionReturnTypeName = getFunctionReturnTypeName(returnTypeNode);

      if (funcDeclMap.has(functionReturnTypeName)) return;

      const decorators = getDecoratorMetadata(func);

      if (decorators.some((x) => injectableDecorator)) {
        //

        // console.log("%s", JSON.stringify(decorators));

        const dependencies = getFunctionParameters(func);

        const sourceOfFunctionReturnType = getSourceOfType(sourceFile, functionReturnTypeName);

        // console.log(sourceOfFunctionReturnType);

        funcDeclMap.set(functionReturnTypeName, func);

        // console.log("%s ::: %s ::: %s\n", fnd.name, fnd.kind, sourceOfFunctionReturnType);

        funcMetadatas.push({
          //
          name: functionReturnTypeName,
          dependencies,
          kind: decorators.find((d) => d.name === injectableDecorator)?.data.as,
          decorators,
        });

        //
      }
    });

    //
  });

  const rd = new DependencyResolver(funcMetadatas);

  const funcResultMap: Map<string, { func: any; functionMetadata: FunctionMetadata }> = new Map();

  const orderedFunctions: FunctionMetadata[] = rd.sortFunctions();

  const configs = orderedFunctions.filter((x) => x.kind === "config");

  const plugins = orderedFunctions.filter((x) => x.kind === "plugin");

  const actionHandlerFunctions = orderedFunctions.filter((x) => actionHandlerType.some((y) => y === x.kind));

  // solve config
  {
    for (const config of configs) {
      //

      const funcDecl = funcDeclMap.get(config.name) as FunctionDeclaration;

      const module = await import(funcDecl.getSourceFile().getFilePath());

      const funcName = funcDecl.getName() as string;

      const funcResult = module[funcName]();

      // console.log("name config: %s", config.name);

      funcResultMap.set(config.name, { func: funcResult, functionMetadata: config });
    }
  }

  // solve plugin
  {
    for (const plugin of plugins) {
      //

      const funcDecl = funcDeclMap.get(plugin.name) as FunctionDeclaration;

      const module = await import(funcDecl.getSourceFile().getFilePath());

      const funcName = funcDecl.getName() as string;

      const paramHandlers = getParameterHandler(funcDecl, funcResultMap);

      const funcResult = module[funcName](...paramHandlers);

      // console.log("name plugin: %s", plugin.name);

      funcResultMap.set(plugin.name, { func: funcResult, functionMetadata: plugin });
    }
  }

  // all usecase and gateway
  {
    //
    // semua plugin yang exist dalam system
    const allRealExistingPluginNames = plugins.map((x) => x.name);

    for (const actionHandlerFunction of actionHandlerFunctions) {
      //

      const funcDecl = funcDeclMap.get(actionHandlerFunction.name) as FunctionDeclaration;

      const module = await import(funcDecl.getSourceFile().getFilePath());

      const funcName = funcDecl.getName() as string;

      const paramHandlers = getParameterHandler(funcDecl, funcResultMap);

      const funcResult = module[funcName](...paramHandlers);

      let currentResult = funcResult;

      // dari setiap actionHandlernya decorator,
      // ambil semua nama decorator selain "@Inject" yang benar2 ada dalam system
      // ignore yang tidak terdefinisi
      const existPluginNames = actionHandlerFunction.decorators //
        .filter((x) => x.name !== injectableDecorator)
        .map((x) => x.name)
        .filter((plugin) => allRealExistingPluginNames.includes(plugin));

      // TODO akan ada plugin yang secara implisit pasti akan selalu ada meskipun tidak di insert dalam JSDoc Decorator
      // TODO akan ada plugin yang secara explisit hanya bekerja pada

      for (const existPluginName of existPluginNames) {
        const pluginHandler = funcResultMap.get(existPluginName)?.func as PluginHandler;
        currentResult = pluginHandler(currentResult, actionHandlerFunction);
      }

      // console.log("name actHdl: %s", actionHandlerFunction.name);

      funcResultMap.set(actionHandlerFunction.name, { func: currentResult, functionMetadata: actionHandlerFunction });
    }
  }

  return funcResultMap;

  //
}

function getFunctionReturnTypeName(returnTypeNode: TypeNode<ts.TypeNode> | undefined) {
  return (returnTypeNode as TypeReferenceNode).getText();
}

function getFunctionParameters(func: FunctionDeclaration) {
  return func.getParameters().map((param) => getFunctionReturnTypeName(param.getTypeNode()));
}

function getSourceOfType(sourceFile: SourceFile, functionReturnTypeName: string) {
  //
  const identifier = sourceFile.getDescendantsOfKind(SyntaxKind.Identifier).find((id) => id.getText() === functionReturnTypeName);

  const _project = sourceFile.getProject();

  if (identifier) {
    const typeAlias = identifier.getFirstAncestorByKind(SyntaxKind.TypeAliasDeclaration);
    if (typeAlias) {
      // console.log("%s is declared in the same file.", functionReturnTypeName);
      const baseType = getBaseType(sourceFile, functionReturnTypeName);
      // console.log("   >> Base type of %s: %s", functionReturnTypeName, baseType);
      return baseType;
    } else {
      const importDeclarations = sourceFile.getImportDeclarations();
      let isImported = false;

      for (const importDecl of importDeclarations) {
        const namedImports = importDecl.getNamedImports();

        for (const namedImport of namedImports) {
          if (namedImport.getName() === functionReturnTypeName) {
            isImported = true;
            const importPath = importDecl.getModuleSpecifierValue();
            // console.log("%s is imported from file: %s", functionReturnTypeName, importPath);

            // Resolve the path to the TypeScript file using TypeScript's module resolution
            const resolvedModule = ts.resolveModuleName(importPath, sourceFile.getFilePath(), _project.getCompilerOptions(), ts.sys);

            if (resolvedModule.resolvedModule) {
              const resolvedFileName = resolvedModule.resolvedModule.resolvedFileName;
              const importedSourceFile = _project.getSourceFile(resolvedFileName);

              if (importedSourceFile) {
                const baseType = getBaseType(importedSourceFile, functionReturnTypeName);
                // console.log("   >> Base type of %s: %s", functionReturnTypeName, baseType);
                return baseType;
              } else {
                console.error(`>>>> Could not find source file for resolved path: ${resolvedFileName}`);
              }
            } else {
              console.error(`>>>> Could not resolve module for import path: ${importPath}`);
            }
          }
        }
      }
      if (!isImported) {
        console.log("%s is neither declared nor imported in the same file.", functionReturnTypeName);
      }
    }
  } else {
    console.log("%s identifier is not found.", functionReturnTypeName);
  }
}

function getBaseType(sourceFile: SourceFile, functionReturnTypeName: string) {
  // Find the type alias declaration by name
  const typeAlias = sourceFile.getTypeAlias(functionReturnTypeName);

  if (!typeAlias) {
    throw new Error(`Type alias with name ${functionReturnTypeName} not found`);
  }

  const typeNames = getActionHandlerRequestResponse(typeAlias);

  console.log("REQ_RES: ", typeNames);

  // Get the right-hand side type
  const typeNode = typeAlias.getTypeNode();

  if (!typeNode) {
    throw new Error(`Right-hand side type for ${functionReturnTypeName} not found`);
  }

  // Return the text representation of the type node
  return typeNode.getText();
}

function getDecoratorMetadata(func: FunctionDeclaration) {
  //

  const decorators: Decorator[] = [];

  const jsDocs = func.getJsDocs();

  jsDocs.forEach((jsDoc) => {
    const innerText = jsDoc.getInnerText();

    const decoratorRegex = /@\s*(\w+)\s*({[\s\S]*?})?/g;
    let match: RegExpExecArray | null;

    while ((match = decoratorRegex.exec(innerText)) !== null) {
      const name = match[1];
      try {
        const decoratorData = match[2] ? JSON.parse(match[2]) : null;

        decorators.push({
          name,
          ...(decoratorData && { data: decoratorData }),
        });
      } catch (err: any) {
        throw new Error(`JSDoc at '${func.getName()}' has error ${err}`);
      }
    }
  });

  return decorators;
}

function getParameterHandler(funcDecl: FunctionDeclaration, funcResultMap: Map<string, { func: any; functionMetadata: FunctionMetadata }>) {
  const paramHandlers: any[] = [];

  funcDecl.getParameters().forEach((param) => {
    const paramTypeName = getFunctionReturnTypeName(param.getTypeNode());

    if (funcResultMap.has(paramTypeName)) {
      paramHandlers.push(funcResultMap.get(paramTypeName)?.func);
    }
  });

  return paramHandlers;
}

class DependencyResolver {
  //

  private functions: Array<FunctionMetadata>;
  private resolvedDependencies: Set<string> = new Set();
  private visited: Set<string> = new Set();
  private inStack: Set<string> = new Set();
  private stack: string[] = [];

  constructor(functions: Array<FunctionMetadata>) {
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

  sortFunctions(): FunctionMetadata[] {
    //

    this.checkMissingDependencies();

    const cycle = this.findCircularDependency();
    if (cycle) {
      throw new Error(`Circular dependency detected: ${cycle.join(" -> ")}`);
    }

    const inDegree = this.getInDegree();
    const sorted: FunctionMetadata[] = [];
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
      sorted.push(funcObj);

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

export class Singleton {
  //

  private static instance: Singleton;

  private container: Map<string, { func: any; functionMetadata: FunctionMetadata }>;

  // private constructor to prevent instantiation
  private constructor() {}

  public static getInstance(): Singleton {
    if (!Singleton.instance) {
      Singleton.instance = new Singleton();
    }
    return Singleton.instance;
  }

  public async startScan(directory: string = "src/app") {
    if (!Singleton.instance.container) {
      const project = new Project();
      project.addSourceFilesAtPaths(`${directory}/**/*.ts`);
      this.container = await scanFunctions(project);
    }
    return Singleton.instance;
  }

  public getContainer() {
    return this.container;
  }
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

function getActionHandlerRequestResponse(typeAliasDeclaration: TypeAliasDeclaration) {
  //

  const typeNode = typeAliasDeclaration.getTypeNode();

  const typeReferenceNode = typeNode as TypeReferenceNode;

  const typeName = typeReferenceNode.getTypeName().getText();

  // console.log(typeName); // This will print "ActionHandler"

  if (typeName === "ActionHandler") {
    //

    const typeArgs = typeReferenceNode.getTypeArguments();

    const typeNames: string[] = [];

    if (typeArgs.length > 0) {
      const typeName = typeArgs[0].getText();
      // console.log("REQUEST : %s", typeName);
      typeNames.push(typeName);
    }

    if (typeArgs.length > 1) {
      const typeName = typeArgs[1].getText();
      // console.log("RESPONSE: %s", typeName);
      typeNames.push(typeName);
    }

    // console.log();

    return typeNames;
  }

  return [];
}
