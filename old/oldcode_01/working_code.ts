import {
  Project,
  SourceFile,
  SyntaxKind,
  TypeReferenceNode,
  TypeAliasDeclaration,
  UnionTypeNode,
  Symbol,
  PropertySignature,
  PropertyDeclaration,
  Node,
  VariableDeclaration,
} from "ts-morph";

const THIRD_TYPE_ARGUMENT = 3;

const project = new Project();
project.addSourceFileAtPath("src/experiment/experiment.ts");

const printTypeProperties = (properties: Array<Symbol | PropertySignature | PropertyDeclaration>): void => {
  properties.forEach((property) => {
    const propertyType = property instanceof Symbol ? property.getValueDeclaration()?.getType().getText() : property.getType().getText();

    if (propertyType) {
      console.log(`  Field: ${property.getName()} - Type: ${propertyType}`);
    }
  });
};

const logTypeProperties = (sourceFile: SourceFile, typeName: string): void => {
  const typeAlias = sourceFile.getTypeAlias(typeName);
  const interfaceDeclaration = sourceFile.getInterface(typeName);
  const classDeclaration = sourceFile.getClass(typeName);

  if (typeAlias) {
    console.log(`Type Alias for ${typeName}`);
    printTypeProperties(typeAlias.getType().getProperties());
  } else if (interfaceDeclaration) {
    console.log(`Interface for ${typeName}`);
    printTypeProperties(interfaceDeclaration.getProperties());
  } else if (classDeclaration) {
    console.log(`Class for ${typeName}`);
    printTypeProperties(classDeclaration.getProperties());
  } else {
    console.log(`No type alias, interface, or class found for ${typeName}`);
  }
};

const resolveTypeName = (typeNode: Node): string[] => (Node.isUnionTypeNode(typeNode) ? typeNode.getTypeNodes().map((node) => node.getText()) : [typeNode.getText()]);

const logDecoratorProperties = (sourceFile: SourceFile, typeNode: Node, cache: Map<string, boolean>): void => {
  const typeNames = resolveTypeName(typeNode);

  typeNames.forEach((typeName) => {
    if (cache.has(typeName)) {
      console.log(`Using cached results for ${typeName}`);
      return;
    }

    cache.set(typeName, true);

    const typeAlias = sourceFile.getTypeAlias(typeName);
    if (typeAlias) {
      const internalTypeNode = typeAlias.getTypeNode();

      if (internalTypeNode && Node.isUnionTypeNode(internalTypeNode)) {
        internalTypeNode.getTypeNodes().forEach((unionMember) => {
          console.log(`Processing Union Member: ${unionMember.getText()}`);
          logTypeProperties(sourceFile, unionMember.getText());
        });
      } else {
        logTypeProperties(sourceFile, typeName);
      }
    } else {
      logTypeProperties(sourceFile, typeName);
    }
  });
};

const logServiceHandlerType = (sourceFile: SourceFile, serviceTypeAlias: TypeAliasDeclaration, cache: Map<string, boolean>): void => {
  const typeArguments = serviceTypeAlias.getTypeNode()?.asKind(SyntaxKind.TypeReference)?.getTypeArguments();

  if (typeArguments && typeArguments.length > THIRD_TYPE_ARGUMENT) {
    const decoratorTypeNode = typeArguments[THIRD_TYPE_ARGUMENT];
    logDecoratorProperties(sourceFile, decoratorTypeNode, cache);
  }
};

const processTypeProperties = (sourceFile: SourceFile, properties: Array<Symbol>, cache: Map<string, boolean>): void => {
  properties.forEach((property) => {
    const propertyDeclaration = property.getValueDeclaration();

    if (Node.isVariableDeclaration(propertyDeclaration) || Node.isParameterDeclaration(propertyDeclaration) || Node.isPropertySignature(propertyDeclaration)) {
      const propertyTypeNode = propertyDeclaration.getTypeNode();

      if (!propertyTypeNode) return;

      const resolvedTypeNames = resolveTypeName(propertyTypeNode);

      resolvedTypeNames.forEach((resolvedTypeName) => {
        console.log(`Field: ${property.getName()} - Type: ${resolvedTypeName}`);

        const resolvedServiceTypeName = resolvedTypeName.split(".").pop()!;
        const serviceAlias = sourceFile.getTypeAlias(resolvedServiceTypeName);

        if (serviceAlias) {
          const typeNode = serviceAlias.getTypeNode();

          if (typeNode?.getKind() === SyntaxKind.TypeReference) {
            const typeReference = typeNode.asKind(SyntaxKind.TypeReference);

            if (typeReference?.getTypeName().getText() === "ServiceHandler") {
              logServiceHandlerType(sourceFile, serviceAlias, cache);
            }
          }
        }
      });
    }
  });
};

const isVariableDeclaration = (node: Node): node is VariableDeclaration => Node.isVariableDeclaration(node);

const processVariableDeclaration = (sourceFile: SourceFile, variableDeclaration: VariableDeclaration, cache: Map<string, boolean>): void => {
  const typeNode = variableDeclaration.getTypeNode();

  if (typeNode?.getKind() === SyntaxKind.TypeReference) {
    const typeReferenceNode = typeNode.asKind(SyntaxKind.TypeReference);

    if (typeReferenceNode) {
      const typeName = typeReferenceNode.getTypeName().getText();

      if (typeName === "ServiceHandler") {
        console.log(`Found 'ServiceHandler' in variable declaration: ${variableDeclaration.getText()}`);

        const typeArgs = typeReferenceNode.getTypeArguments();

        if (typeArgs.length > 0) {
          const gatewaysType = typeArgs[0].getText();
          console.log(`Gateways Type: ${gatewaysType}`);

          const gatewaysTypeAlias = sourceFile.getTypeAlias(gatewaysType);
          if (gatewaysTypeAlias) {
            processTypeProperties(sourceFile, gatewaysTypeAlias.getType().getProperties(), cache);
          }
        }

        if (typeArgs.length > 1) {
          const requestType = typeArgs[1].getText();
          console.log(`Request Type: ${requestType}`);
          logTypeProperties(sourceFile, requestType);
        }

        if (typeArgs.length > 2) {
          const responseType = typeArgs[2].getText();
          console.log(`Response Type: ${responseType}`);
          logTypeProperties(sourceFile, responseType);
        }
      }
    }
  }
};

const processSourceFile = (sourceFile: SourceFile, cache: Map<string, boolean>): void => {
  sourceFile.getVariableStatements().forEach((variableStatement) => {
    variableStatement
      .getDeclarationList()
      .getDeclarations()
      .forEach((variableDeclaration) => {
        if (isVariableDeclaration(variableDeclaration)) {
          processVariableDeclaration(sourceFile, variableDeclaration, cache);
        }
      });
  });
};

const cache = new Map<string, boolean>();
project.getSourceFiles().forEach((sourceFile) => processSourceFile(sourceFile, cache));
