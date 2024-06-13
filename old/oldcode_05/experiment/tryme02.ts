import { Project, SourceFile, TypeReferenceNode } from "ts-morph";

export function TryMe() {
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
    const func = sourceFile.getFunction("ImplFindOnePersonByEmail");
    if (!func) continue;

    const returnType = (func.getReturnTypeNode() as TypeReferenceNode).getText();

    const aliasSourceFile = getTypeDeclarationSourceFile(sourceFile, returnType);
    const aliasDecl = aliasSourceFile.getTypeAlias(returnType);
    console.log(">>3>>", aliasDecl?.getText(true));

    const typeNode = aliasDecl?.getTypeNode();
    if (!typeNode) continue;

    const typeText = typeNode.getText(true);

    const typeArguments = typeText
      .match(/<(.+)>/)?.[1]
      .split(",")
      .map((arg) => arg.trim());

    const requestSourceFile = getTypeDeclarationSourceFile(aliasSourceFile, typeArguments![0]);
    const requestAlias =
      requestSourceFile.getTypeAlias(typeArguments![0])?.getText(true) ||
      requestSourceFile.getClass(typeArguments![0])?.getText(true) ||
      requestSourceFile.getInterface(typeArguments![0])?.getText(true);
    console.log(requestAlias);

    const responseSourceFile = getTypeDeclarationSourceFile(aliasSourceFile, typeArguments![1]);
    const responseAlias =
      responseSourceFile.getTypeAlias(typeArguments![1])?.getText(true) ||
      responseSourceFile.getClass(typeArguments![1])?.getText(true) ||
      responseSourceFile.getInterface(typeArguments![1])?.getText(true);
    console.log(responseAlias);

    break;
  }
}
