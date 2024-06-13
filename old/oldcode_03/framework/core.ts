// src/framework/core.ts
import { FunctionDeclaration, Project, SourceFile, TypeAliasDeclaration, TypeReferenceNode } from "ts-morph";
import { ActionHandler, PluginHandler } from "./base_type.js";

export class ClosureDI {
  private container = new Map<string, ActionHandler>();
  private project: Project = new Project();

  /**
   * Scans the provided directory path and wires functions based on metadata.
   * @param directoryPath Path of the directory to scan
   * @param plugin Optional plugin handler
   */
  async createFunctionMap(directoryPath: string, ...plugins: PluginHandler[]): Promise<void> {
    this.project.addSourceFilesAtPaths(`${directoryPath}/**/*.ts`);
    const sourceFiles = this.project.getSourceFiles();

    for (const sourceFile of sourceFiles) {
      await this.processSourceFile(sourceFile, ...plugins);
    }
  }

  private async processSourceFile(sourceFile: SourceFile, ...plugins: PluginHandler[]) {
    const module = await import(sourceFile.getFilePath());

    sourceFile.getFunctions().forEach((func) => {
      if (!func.isExported()) return;

      const functionName = func.getName();
      if (!functionName) return;

      const returnTypeNode = func.getReturnTypeNode() as TypeReferenceNode;
      const returnTypeText = returnTypeNode.getTypeName().getText();

      const paramHandlers = this.getParameterHandlers(func);

      const functionResult = module[functionName](...paramHandlers);

      // Extract metadata from the decorator
      const decorator = this.getDecoratorMetadata(returnTypeNode);

      let currentResult = functionResult;

      for (const plugin of plugins) {
        currentResult = plugin(currentResult, functionName, decorator);
      }

      this.register(returnTypeText, currentResult);
    });
  }

  private register(key: string, handler: ActionHandler) {
    if (this.container.has(key)) {
      return;
    }

    this.container.set(key, handler);
  }

  /**
   * Retrieve a function by name from the function map.
   * @param key The type key of the function to retrieve
   * @returns The function if found, or undefined if not found
   */
  get(key: string): ActionHandler {
    return this.container.get(key) as ActionHandler;
  }

  /**
   * Get all registered functions as an array of [funcName, ActionHandler] tuples.
   * @returns Array of registered functions
   */
  getAll(): Map<string, ActionHandler> {
    return this.container;
  }

  // Update the getParameterHandlers method
  private getParameterHandlers(func: FunctionDeclaration) {
    const paramHandlers: ActionHandler[] = [];
    for (const param of func.getParameters()) {
      const typeNode = param.getTypeNode() as TypeReferenceNode;
      const paramTypeName = typeNode.getTypeName().getText();

      // Directly check the function map for the parameter type name
      if (this.container.has(paramTypeName)) {
        // console.log(`Parameter type '${paramTypeName}' found in functionMap`);
        const p = this.container.get(paramTypeName) as ActionHandler;
        paramHandlers.push(p);
      } else {
        console.warn(`>>>> Parameter type '${paramTypeName}' not found in functionMap`);
      }
    }
    return paramHandlers;
  }

  private getDecoratorMetadata(returnTypeNode: TypeReferenceNode): Record<string, any> {
    let decoratorData = {};

    // Resolve the symbol of the return type
    const typeAliasSymbol = returnTypeNode.getType().getSymbol();

    if (typeAliasSymbol) {
      const declarations = typeAliasSymbol.getDeclarations();
      if (declarations.length > 0) {
        const typeAliasDeclaration = declarations[0] as TypeAliasDeclaration;

        // Extract JSDoc comments using the TypeScript Compiler API directly
        const jsDocs = typeAliasDeclaration.getJsDocs();
        for (const jsDoc of jsDocs) {
          const comment = jsDoc.getComment();
          let commentText = "";

          if (typeof comment === "string") {
            commentText = comment;
          } else if (Array.isArray(comment)) {
            commentText = comment.map((c) => (c ? c.getText() : "")).join(" ");
          }

          if (commentText) {
            const decoratorMatch = commentText.match(/@decorator\s*(\{[^}]+\})/);

            if (decoratorMatch && decoratorMatch[1]) {
              try {
                decoratorData = JSON.parse(decoratorMatch[1]);
              } catch (err) {
                console.error("Failed to parse decorator:", err);
              }
            }
          }
        }
      }
    }

    return decoratorData;
  }
}
