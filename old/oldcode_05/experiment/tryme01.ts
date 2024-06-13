import { Project, SourceFile, TypeReferenceNode } from "ts-morph";

export function TryMe() {
  const project = new Project();
  const sourceFile = project.createSourceFile(
    "example.ts",
    `
    /**
     * @something 
     */
    export type Request = {
      /**
       * @hello
       */
      name: string;
      /**
       * @what
       */
      age: number;
    };

    /**
     * @anotherthing 
     */
    export type Response = {
      /**
       * @hai
       */
      value: float;
      /**
       * @why
       */
      areYou: boolean;
    };

    export type ActionHandler<REQ, RES> = (req: REQ) => Promise<RES>;
    export type SomeType = ActionHandler<Request, Response>;
    function Hello (): SomeType {
      return (req, res) => {
        return {value: 0, areYou: true}
      }
    }
  `,
    { overwrite: true }
  );

  function FindRequest(source: SourceFile, functionName: string): string[] {
    const func = source.getFunctionOrThrow(functionName);
    console.log(func.getReturnType().getText());

    const returnType = (func.getReturnTypeNode() as TypeReferenceNode).getText();
    const aliasDecl = source.getTypeAliasOrThrow(returnType);
    const typeText = aliasDecl.getTypeNodeOrThrow().getText();
    const typeArguments = typeText
      .match(/<(.+)>/)?.[1]
      .split(",")
      .map((arg) => arg.trim());
    const requestAlias = source.getTypeAliasOrThrow(typeArguments![0]);
    const responseAlias = source.getTypeAliasOrThrow(typeArguments![1]);
    return [requestAlias.getText(true), responseAlias.getText(true)];
  }

  const result = FindRequest(sourceFile, "Hello");
  console.log(result[0]);
  console.log(result[1]);
}
