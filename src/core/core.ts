import { Project } from "ts-morph";
import { Context, FuncInstanceMetadata } from "./type.js";
import { scanFunctions } from "./scanner.js";

export class Singleton {
  //

  private static instance: Singleton;

  private container: Map<string, FuncInstanceMetadata>;

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

export const newCtx = (): Context => ({ data: {}, traceId: "123", date: new Date() });
