import path from "path";
import process from "process";

import testWithoutContext, { type ExecutionContext, type TestFn } from "ava";
import nock, { back as nockBack, type BackMode } from "nock";

import { matchFormPayloads } from "test/utils/matchFormPayloads";

// Add the context to the test function type.
type Context = {
  nockDone: () => void;
};
export const test = testWithoutContext as TestFn<Context>;

export const useNock = async () => {
  // Prepare the nock fixture paths.
  const testPath = test.meta.file.replace(/^file:/, "");
  nockBack.fixtures = path.join(path.dirname(testPath), "fixtures");
  const testFilenamePrefix = path.basename(testPath);
  const fixtureFilename = `${testFilenamePrefix}.json`;

  test.before(async (t: ExecutionContext<Context>) => {
    // Start recording, and only allow connections to `sindri.app`.
    nock.disableNetConnect();
    // We allow three sources here:
    // * https://localhost.run/'s https://*.lhr.life for development.
    // * https://ngrok.com/ for development.
    // * https://sindri.app/ for production, stage, and development.
    nock.enableNetConnect(
      /^(https?:\/\/)?(.+\.)?(lhr\.life|ngrok-free.app|sindri.app)(:\d+)?$/i,
    );
    nockBack.setMode((process.env.NOCK_BACK_MODE ?? "lockdown") as BackMode);
    const { nockDone } = await nockBack(fixtureFilename, {
      before: matchFormPayloads,
    });
    t.context.nockDone = nockDone;
  });

  test.after.always((t: ExecutionContext<Context>) => {
    // Stop recording and re-enable all network connections.
    if (t.context.nockDone) {
      t.context.nockDone();
    }
    nock.enableNetConnect();
    nockBack.setMode("wild");
  });
};
