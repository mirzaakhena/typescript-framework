import express from "express";

export type ExpressJS = express.Express;

/**
 * @Config
 */
export function ImplExpressJS(): ExpressJS {
  const app = express();
  return app;
}
