import { Project, SourceFile, SyntaxKind, ts, TypeReferenceNode } from "ts-morph";

export function TryMe01() {
  const project = new Project();
  project.addSourceFilesAtPaths(`src/app/**/*.ts`);

  const getTypeDeclarationSourceFile = (sourceFile: SourceFile, typeName: string): SourceFile => {
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
  };

  for (const sourceFile of project.getSourceFiles()) {
    // cari function dengan nama
    const func = sourceFile.getFunction("ImplSavePerson");
    if (!func) continue;

    // cari return function type nya
    const returnType = (func.getReturnTypeNode() as TypeReferenceNode).getText();

    // cari source nya. bisa jadi di file yg sama atau di file lain
    const aliasSourceFile = getTypeDeclarationSourceFile(sourceFile, returnType);
    const typeAlias = aliasSourceFile.getTypeAlias(returnType);
    if (!typeAlias) continue;

    // tipe datanya : const typeNode: TypeNode<ts.TypeNode>
    const typeNode = typeAlias?.getTypeNode();
    if (!typeNode) continue;
    const typeReferenceNode = typeNode.asKindOrThrow(ts.SyntaxKind.TypeReference);

    const typeArguments = typeReferenceNode.getTypeArguments();

    typeArguments.forEach((arg, index) => {
      //

      const kind = arg.getKindName();
      console.log(`Type Argument index-${index} is of kind: ${kind}`);

      if (arg.getKind() === SyntaxKind.TypeLiteral) {
        console.log(typeArguments[index].getText(true));
      } else if (arg.getKind() === SyntaxKind.TypeReference) {
        const requestSourceFile = getTypeDeclarationSourceFile(aliasSourceFile, typeArguments[index].getText(true));
        const requestAlias =
          requestSourceFile.getTypeAlias(typeArguments[index].getText(true))?.getText(true) ||
          requestSourceFile.getClass(typeArguments[index].getText(true))?.getText(true) ||
          requestSourceFile.getInterface(typeArguments[index].getText(true))?.getText(true);
        console.log(requestAlias);
      } else {
        throw new Error("the type should be Reference or Literal");
      }
    });

    break;
  }
}
