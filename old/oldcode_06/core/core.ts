import { FunctionDeclaration, Project, SourceFile, SyntaxKind, Symbol, ts, Type, TypeNode, TypeReferenceNode, TypeAliasDeclaration } from "ts-morph";

export type Context<T extends Record<string, any> = Record<string, any>> = {
  data: T;
  traceId: string;
  date: Date;
};

export const newCtx = (): Context => ({ data: {}, traceId: "123", date: new Date() });

export type ActionHandler<REQUEST = any, RESPONSE = any> = (ctx: Context, request: REQUEST) => Promise<RESPONSE>;

export type PluginHandler = (ah: ActionHandler, functionMetadata: FunctionMetadata) => ActionHandler;

export type UsecaseHandler<REQUEST = any, RESPONSE = any> = ActionHandler<REQUEST, RESPONSE>;

export type GatewayHandler<REQUEST = any, RESPONSE = any> = ActionHandler<REQUEST, RESPONSE>;

type Decorator = { name: string; data: any };

export type FunctionMetadata = {
  name: string;
  dependencies: string[];
  kind: "usecase" | "gateway" | "config" | "plugin";
  decorators: Decorator[];
};

function getFunctionReturnTypeName(returnTypeNode: TypeNode<ts.TypeNode> | undefined) {
  return (returnTypeNode as TypeReferenceNode).getText();
}

function getFunctionParameters(func: FunctionDeclaration) {
  return func.getParameters().map((param) => getFunctionReturnTypeName(param.getTypeNode()));
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

function getTypeDeclarationSourceFile(sourceFile: SourceFile, typeName: string): SourceFile {
  const typeDecl = sourceFile.getTypeAlias(typeName) || sourceFile.getClass(typeName) || sourceFile.getInterface(typeName);
  if (typeDecl) return sourceFile;

  const imports = sourceFile.getImportDeclarations();
  for (const imp of imports) {
    for (const namedImport of imp.getNamedImports()) {
      if (namedImport.getName() === typeName) {
        const importedSourceFile = imp.getModuleSpecifierSourceFile();
        if (importedSourceFile) {
          return getTypeDeclarationSourceFile(importedSourceFile, typeName);
        }
      }
    }
  }

  throw new Error(`Type ${typeName} not found`);
}

async function scanFunctions(project: Project) {
  //

  const injectableDecorator = "Injectable" as const;

  const funcDeclMap: Map<string, FunctionDeclaration> = new Map();

  const funcMetadatas: Array<FunctionMetadata> = [];

  project.getSourceFiles().forEach((sourceFile) => {
    //

    sourceFile.getFunctions().forEach((func) => {
      //

      // harus punya export
      if (!func.isExported()) return;

      const funcName = func.getName();

      // harus punya nama
      if (!funcName) return;

      const returnTypeNode = func.getReturnTypeNode();

      // harus punya return type
      if (!returnTypeNode) return;

      const functionReturnTypeName = getFunctionReturnTypeName(returnTypeNode);

      // belum pernah masuk map
      if (funcDeclMap.has(functionReturnTypeName)) return;

      const decorators = getDecoratorMetadata(func);

      // harus ada @Injectable
      if (!decorators.some((x) => injectableDecorator)) return;

      const dependencies = getFunctionParameters(func);

      funcDeclMap.set(functionReturnTypeName, func);

      funcMetadatas.push({
        //
        name: functionReturnTypeName,
        dependencies,
        kind: decorators.find((d) => d.name === injectableDecorator)?.data.as,
        decorators,
      });
    });
  });

  const dr = new DependencyResolver(funcMetadatas);

  const actionHandlerType = ["gateway", "usecase"] as const;

  const funcResultMap: Map<string, { func: any; functionMetadata: FunctionMetadata }> = new Map();

  const orderedFunctions: FunctionMetadata[] = dr.sortFunctions();

  const configNames = orderedFunctions.filter((x) => x.kind === "config").map((x) => x.name);

  const pluginNames = orderedFunctions.filter((x) => x.kind === "plugin").map((x) => x.name);

  const actionHandlerFunctions = orderedFunctions.filter((x) => actionHandlerType.some((y) => y === x.kind));

  // solve config
  {
    for (const configName of configNames) {
      //

      const funcDecl = funcDeclMap.get(configName) as FunctionDeclaration;

      const module = await import(funcDecl.getSourceFile().getFilePath());

      const funcName = funcDecl.getName() as string;

      // config does not have parameter
      const funcResult = module[funcName]();

      // console.log("name config: %s", config.name);

      funcResultMap.set(configName, { func: funcResult, functionMetadata: funcResultMap.get(configName)?.func });
    }
  }

  // solve plugin
  {
    for (const pluginName of pluginNames) {
      //

      const funcDecl = funcDeclMap.get(pluginName) as FunctionDeclaration;

      const module = await import(funcDecl.getSourceFile().getFilePath());

      const funcName = funcDecl.getName() as string;

      const paramHandlers = getParameterHandler(funcDecl, funcResultMap);

      // plugin does have parameter
      const funcResult = module[funcName](...paramHandlers);

      // console.log("name plugin: %s", pluginName);

      funcResultMap.set(pluginName, { func: funcResult, functionMetadata: funcResultMap.get(pluginName)?.func });
    }
  }

  // all usecase and gateway
  {
    for (const actionHandlerFunction of actionHandlerFunctions) {
      //

      const funcDecl = funcDeclMap.get(actionHandlerFunction.name) as FunctionDeclaration;

      const aliasSourceFile = getTypeDeclarationSourceFile(funcDecl.getSourceFile(), actionHandlerFunction.name);
      const aliasDecl = aliasSourceFile.getTypeAlias(actionHandlerFunction.name);

      console.log(">>> ", aliasDecl?.getText());

      const typeNode = aliasDecl?.getTypeNode();
      if (!typeNode) continue;

      // console.log(">>> ", typeNode.getText());

      const module = await import(funcDecl.getSourceFile().getFilePath());

      const funcName = funcDecl.getName() as string;

      const paramHandlers = getParameterHandler(funcDecl, funcResultMap);

      // it have parameters
      const funcResult = module[funcName](...paramHandlers);

      let currentResult = funcResult;

      // it also have a plugin
      for (const pluginName of pluginNames) {
        //

        const pluginHandler = funcResultMap.get(pluginName)?.func as PluginHandler;

        currentResult = pluginHandler(currentResult, actionHandlerFunction);
      }

      funcResultMap.set(actionHandlerFunction.name, { func: currentResult, functionMetadata: actionHandlerFunction });
    }
  }

  return funcResultMap;
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

  public getContainer = () => this.container;
}
