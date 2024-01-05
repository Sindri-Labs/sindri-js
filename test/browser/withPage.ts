import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

import { ExecutionContext } from "ava";
import puppeteer, { Page } from "puppeteer";

type RunFunction = (t: ExecutionContext, page: Page) => Promise<void>;

const getSindriScriptPath = () => {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const sindriScriptPath = path.join(
    __dirname,
    "..",
    "..",
    "dist",
    "lib",
    "browser",
    "sindri.iife.js",
  );
  if (!fs.existsSync(sindriScriptPath)) {
    throw new Error(`Expected IIFE build to exist at "${sindriScriptPath}".`);
  }
  return sindriScriptPath;
};

export default async (t: ExecutionContext, run: RunFunction) => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  try {
    await page.addScriptTag({
      path: getSindriScriptPath(),
    });
    await run(t, page);
  } finally {
    await page.close();
    await browser.close();
  }
};
