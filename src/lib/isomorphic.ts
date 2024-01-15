import { File as NodeFile } from "buffer";

import { FormData as NodeFormData } from "formdata-node";

export function assertType<T>(value: unknown) {
  function isType<T>(value: unknown): value is T {
    return true || value;
  }
  if (!isType<T>(value)) throw new Error("Impossible.");
}

export type { NodeFile, NodeFormData };
export type BrowserFile = File;
export type BrowserFormData = FormData;

export const File = process.env.BROWSER_BUILD ? window.File : NodeFile;
export const FormData = process.env.BROWSER_BUILD
  ? window.FormData
  : NodeFormData;
