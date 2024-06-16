import * as TJS from "typescript-json-schema";
import { Singleton } from "../core/core.js";

export async function Try010() {
  const settings: TJS.PartialArgs = { required: true };
  const compilerOptions: TJS.CompilerOptions = { strictNullChecks: true };

  const application = await Singleton.getInstance().startScan();
  const usecases = Array.from(application.getContainer().values()) //
    .filter((x) => x.funcMetadata.decorators.some((y) => y.name === "Controller"));

  const paths = usecases.map(({ funcMetadata }) => funcMetadata.request?.path as string);

  const program = TJS.getProgramFromFiles(paths, compilerOptions);

  usecases.forEach(({ funcMetadata }) => {
    //

    // const requestField = TJS.generateSchema(program, funcMetadata.request?.name as string, settings);

    // console.log(JSON.stringify(requestField, null, 2));

    console.log(JSON.stringify(funcMetadata, null, 2));

    //
  });
}
