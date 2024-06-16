import { FunctionDeclaration, JSDoc, Project, SourceFile, SyntaxKind, ts, TypeAliasDeclaration, TypeNode, TypeReferenceNode } from "ts-morph";
import { DependencyResolver } from "./dependency_resolver.js";
import { Decorator, FuncInstanceMetadata, FuncMetadata, InjectableDecorator, TypeField, TypeOf } from "./type.js";

type FuncDeclMetadata = { funcMetadata: FuncMetadata; funcDeclaration: FunctionDeclaration };

type InjectableDecoratorType = TypeOf<typeof InjectableDecorator>;

function getFunctionReturnTypeName(returnTypeNode: TypeNode<ts.TypeNode> | undefined) {
  return (returnTypeNode as TypeReferenceNode).getText();
}

function getFunctionParameters(func: FunctionDeclaration) {
  return func.getParameters().map((param) => getFunctionReturnTypeName(param.getTypeNode()));
}

function getParameterHandler(funcDecl: FunctionDeclaration, funcResultMap: Map<string, FuncInstanceMetadata>) {
  const paramHandlers: any[] = [];

  funcDecl.getParameters().forEach((param) => {
    const paramTypeName = getFunctionReturnTypeName(param.getTypeNode());

    if (funcResultMap.has(paramTypeName)) {
      paramHandlers.push(funcResultMap.get(paramTypeName)?.funcInstance);
    }
  });

  return paramHandlers;
}

function getDecoratorMetadata(jsDocs: JSDoc[]) {
  const decorators: Decorator[] = [];

  jsDocs.forEach((jsDoc) => {
    const innerText = jsDoc.getInnerText();
    const lines = innerText.split("\n");
    let currentDecorator: { name: string; data?: string } = { name: "", data: "" };
    let hasDecorator = false;

    lines.forEach((line) => {
      const match = line.match(/@(\w+)\s*(\{.*)?/);
      if (match) {
        if (hasDecorator) {
          try {
            decorators.push({ name: currentDecorator.name, data: currentDecorator.data ? JSON.parse(currentDecorator.data) : undefined });
          } catch (e) {
            decorators.push({ name: currentDecorator.name, data: undefined });
          }
        }
        currentDecorator = { name: match[1], data: match[2] || "" };
        hasDecorator = true;
      } else if (hasDecorator) {
        currentDecorator.data += line.trim();
      }
    });

    if (hasDecorator) {
      try {
        decorators.push({ name: currentDecorator.name, data: currentDecorator.data ? JSON.parse(currentDecorator.data) : undefined });
      } catch (e) {
        decorators.push({ name: currentDecorator.name, data: undefined });
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

/**
 * Extracts functions from the project source files and gathers their metadata.
 * @param project - The project containing the source files.
 * @returns A map where the keys are function names and the values are objects containing function metadata and declarations.
 */
function extractFunctions(project: Project): Map<string, FuncDeclMetadata> {
  const funcMap: Map<string, FuncDeclMetadata> = new Map();

  const badgeColorForKind = (kind: TypeOf<typeof InjectableDecorator>) => {
    if (kind === "Config") {
      return `\x1b[45m${kind}\x1b[0m`;
    }

    if (kind === "Plugin") {
      return `\x1b[42m${kind}\x1b[0m`;
    }

    if (kind === "Action") {
      return `\x1b[41m${kind}\x1b[0m`;
    }

    return `${kind}`;
  };

  project.getSourceFiles().forEach((sourceFile) => {
    sourceFile.getFunctions().forEach((func) => {
      if (!func.isExported()) return;

      const funcName = func.getName();
      if (!funcName) return;

      const returnTypeNode = func.getReturnTypeNode();
      if (!returnTypeNode) return;

      const functionReturnTypeName = getFunctionReturnTypeName(returnTypeNode);
      if (funcMap.has(functionReturnTypeName)) return;

      const decorators = getDecoratorMetadata(func.getJsDocs());
      if (!decorators.some((x) => InjectableDecorator.some((y) => y === x.name))) return;

      const dependencies = getFunctionParameters(func);

      const kind = decorators.find((d) => InjectableDecorator.find((y) => y === d.name))!.name as InjectableDecoratorType;

      const meta = {
        name: functionReturnTypeName,
        dependencies,
        kind,
        decorators,
      };

      printToLog(`  as ${badgeColorForKind(meta.kind)}, function ${meta.name} has ${meta.dependencies.length} dependency:`);
      meta.dependencies.forEach((x) => printToLog(`    - ${x}`));

      funcMap.set(functionReturnTypeName, { funcDeclaration: func, funcMetadata: meta });
    });
  });

  printToLog();

  return funcMap;
}

/**
 * Sorts functions by their kind using a dependency resolver.
 * @param funcMap - A map of function names to their metadata and declarations.
 * @returns An object containing arrays of functions sorted by their kinds: config, plugin, and action handlers.
 */
function sortFunctionsByKind(funcMap: Map<string, FuncDeclMetadata>) {
  const configMetadatas: FuncMetadata[] = [];
  const pluginMetadatas: FuncMetadata[] = [];
  const actionMetadatas: FuncMetadata[] = [];

  const nameAndDeps = Array.from(funcMap.values()).map((x) => ({ name: x.funcMetadata.name, dependencies: x.funcMetadata.dependencies }));
  const dr = new DependencyResolver(nameAndDeps);
  const orderedFunctions = dr.sortFunctions();

  orderedFunctions.forEach((x) => {
    //

    printToLog(`  - ${x}`);

    const fm = funcMap.get(x)?.funcMetadata;

    if (fm?.kind === "Config") {
      configMetadatas.push(fm);
      return;
    }

    if (fm?.kind === "Plugin") {
      pluginMetadatas.push(fm);
      return;
    }

    if (fm?.kind === "Action") {
      actionMetadatas.push(fm);
      return;
    }
  });

  printToLog();

  return { configMetadatas, pluginMetadatas, actionMetadatas: actionMetadatas };
}

/**
 * Resolves and instantiates configuration functions.
 * @param metadatas - Array of configuration function metadata.
 * @param funcMap - Map of function names to their metadata and declarations.
 * @param funcResultMap - Map to store the results and metadata of resolved functions.
 */
async function resolveConfigFunctions(metadatas: FuncMetadata[], funcMap: Map<string, FuncDeclMetadata>, funcResultMap: Map<string, FuncInstanceMetadata>) {
  for (const metadata of metadatas.map((x) => x.name)) {
    const funcDecl = funcMap.get(metadata)?.funcDeclaration as FunctionDeclaration;
    const module = await import(funcDecl.getSourceFile().getFilePath());
    const funcName = funcDecl.getName() as string;

    const funcResult = module[funcName]();

    funcResultMap.set(metadata, {
      funcInstance: funcResult,
      funcMetadata: funcMap.get(metadata)?.funcMetadata as FuncMetadata,
    });
  }
}

/**
 * Resolves and instantiates plugin functions with their dependencies.
 * @param metadatas - Array of plugin function metadata.
 * @param funcMap - Map of function names to their metadata and declarations.
 * @param funcResultMap - Map to store the results and metadata of resolved functions.
 */
async function resolvePluginFunctions(metadatas: FuncMetadata[], funcMap: Map<string, FuncDeclMetadata>, funcResultMap: Map<string, FuncInstanceMetadata>) {
  for (const metadata of metadatas.map((x) => x.name)) {
    const funcDecl = funcMap.get(metadata)?.funcDeclaration as FunctionDeclaration;
    const module = await import(funcDecl.getSourceFile().getFilePath());
    const funcName = funcDecl.getName() as string;

    const paramHandlers = getParameterHandler(funcDecl, funcResultMap);

    const funcResult = module[funcName](...paramHandlers);

    funcResultMap.set(metadata, {
      funcInstance: funcResult,
      funcMetadata: funcMap.get(metadata)?.funcMetadata as FuncMetadata,
    });
  }
}

/**
 * Resolves and instantiates action handler functions, including their dependencies and plugins.
 * @param metadatas - Array of action handler function metadata.
 * @param pluginMetadatas - Array of plugin function metadata.
 * @param funcMap - Map of function names to their metadata and declarations.
 * @param funcResultMap - Map to store the results and metadata of resolved functions.
 */
async function resolveActionFunctions(
  metadatas: FuncMetadata[],
  pluginMetadatas: FuncMetadata[],
  funcMap: Map<string, FuncDeclMetadata>,
  funcResultMap: Map<string, FuncInstanceMetadata>
) {
  for (const metadata of metadatas) {
    const funcDecl = funcMap.get(metadata.name)?.funcDeclaration as FunctionDeclaration;
    const aliasSourceFile = getTypeDeclarationSourceFile(funcDecl.getSourceFile(), metadata.name);
    const aliasDecl = aliasSourceFile.getTypeAlias(metadata.name);

    if (!aliasDecl) continue;

    const typeNode = aliasDecl.getTypeNode();
    if (!typeNode) continue;

    const typeReferenceNode = typeNode.asKindOrThrow(ts.SyntaxKind.TypeReference);

    const typeArguments = typeReferenceNode.getTypeArguments();

    typeArguments.forEach((typeArgument, index) => {
      if (typeArgument.getKind() === SyntaxKind.TypeReference) {
        const payloadSourceFile = getTypeDeclarationSourceFile(aliasSourceFile, typeArgument.getText(true));
        const payloadAlias =
          payloadSourceFile.getTypeAlias(typeArgument.getText(true)) ||
          payloadSourceFile.getClass(typeArgument.getText(true)) ||
          payloadSourceFile.getInterface(typeArgument.getText(true));

        if (payloadAlias) {
          const typeAlias = payloadSourceFile.getTypeAlias(typeArgument.getText(true)) as TypeAliasDeclaration;
          // const decoratorType = getDecoratorMetadata(typeAlias.getJsDocs());

          const properties = typeAlias.getType().getProperties();

          const typeFields = properties.map((prop) => {
            const name = prop.getName();
            const type = prop.getTypeAtLocation(aliasDecl).getText();

            const decorator = prop.getJsDocTags().map((doc) => {
              const texts = doc.getText();

              const text = texts.length > 0 ? texts[0].text : "";

              try {
                const jsonText = JSON.parse(text);
                return { name: doc.getName(), data: jsonText };
              } catch {
                return { name: doc.getName(), data: text };
              }
            });

            return { name, type, decorator } as TypeField;
          });

          metadata[index === 0 ? "request" : "response"] = {
            name: payloadAlias?.getName() as string,
            path: payloadSourceFile.getFilePath(),
            structure: typeFields,
          };
        }
      } else if (typeArgument.getKind() === SyntaxKind.TypeLiteral) {
        // Handle TypeLiteral case
      } else {
        // throw new Error("the type should be Reference or Literal");
      }
    });

    const module = await import(funcDecl.getSourceFile().getFilePath());
    const funcName = funcDecl.getName() as string;
    const paramHandlers = getParameterHandler(funcDecl, funcResultMap);

    let currentResult = module[funcName](...paramHandlers);

    for (const pluginMetadata of pluginMetadatas) {
      const pluginHandler = funcResultMap.get(pluginMetadata.name)?.funcInstance;
      currentResult = pluginHandler(currentResult, metadata);
    }

    funcResultMap.set(metadata.name, { funcInstance: currentResult, funcMetadata: metadata });
  }
}

/**
 * Scans the project for functions, sorts them by kind, resolves their dependencies and plugins, and returns the results.
 * @param project - The project containing the source files.
 * @returns A map of function names to their resolved instances and metadata.
 */
export async function scanFunctions(project: Project) {
  //

  printToLog("scanned function:");
  const funcMap = extractFunctions(project);

  printToLog("sort function by dependencies");
  const { configMetadatas, pluginMetadatas, actionMetadatas } = sortFunctionsByKind(funcMap);

  const funcResultMap: Map<string, FuncInstanceMetadata> = new Map();

  printToLog("resolve config");
  await resolveConfigFunctions(configMetadatas, funcMap, funcResultMap);

  printToLog("resolve plugin");
  await resolvePluginFunctions(pluginMetadatas, funcMap, funcResultMap);

  printToLog("resolve action");
  await resolveActionFunctions(actionMetadatas, pluginMetadatas, funcMap, funcResultMap);

  return funcResultMap;
}

function printToLog(message?: any, ...optionalParams: any[]) {
  // if (!message) {
  //   console.log();
  //   return;
  // }
  // console.log(message, ...optionalParams);
}
