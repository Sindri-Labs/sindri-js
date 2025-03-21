import _ from "lodash";
import makeSynchronous from "make-synchronous";
import { type Definition as NockDefinition } from "nock";
import * as multipart from "parse-multipart-data";

type MultipartInput = {
  filename?: string;
  name?: string;
  type: string;
  data: Buffer;
};

// The form boundaries are randomized for security reasons, so we use a regex to find them. These
// might break in future axios or chromium versions if the formats change. Here are examples of the
// boundaries that they generate:
//   * `----WebKitFormBoundary0buQ8d6EhWcs9X9d`
//   * `axios-1.6.8-boundary-4FWEgytYyXdg_JzLZ-voa_ci6`
const boundaryRegex =
  /(?:----WebKitFormBoundary.{16}|axios-.\..\..-boundary-.{25})/;
const parseTarball = makeSynchronous(
  async (buffer: Buffer): Promise<{ [path: string]: Buffer }> =>
    new Promise((resolve) => {
      const files: { [path: string]: Buffer } = {};
      import("tar").then((tar) => {
        const parseStream = new tar.Parse({
          // @ts-expect-error - The `ondone` callback is missing from the `ParseOptions` type.
          ondone: () => {
            resolve(files);
          },
          onentry: (entry) => {
            entry.on("data", (chunk) => {
              files[entry.path] = Buffer.concat([
                files[entry.path] ?? Buffer.alloc(0),
                chunk,
              ]);
            });
          },
        });
        parseStream.end(buffer);
      });
    }),
);

const partSorter = (a: MultipartInput, b: MultipartInput): number => {
  // First sort by name with nameless entries last.
  if (a.name != null || b.name != null) {
    if (a.name == null) return 1;
    if (b.name == null) return -1;
    if (a.name < b.name) return -1;
    if (a.name > b.name) return 1;
  }

  // If names are equal, sort by data.
  return a.data.compare(b.data);
};

export function matchFormPayloads(scope: NockDefinition) {
  // @ts-expect-error - Types are wrong.
  scope.filteringRequestBody = (
    body: string | null,
    recordedBody: string | null,
  ) => {
    if (typeof body !== "string" || typeof recordedBody !== "string") {
      return body;
    }

    // Find the boundaries for the multipart form bodies.
    const isText = boundaryRegex.test(body);
    const bodyBuffer = Buffer.from(body, isText ? "utf-8" : "hex");
    const bodyText = bodyBuffer.toString("utf-8");
    const boundaryMatch = boundaryRegex.exec(bodyText);
    if (!boundaryMatch) {
      return body;
    }
    const boundary = boundaryMatch[0];
    const recordedBodyBuffer = Buffer.from(
      recordedBody,
      isText ? "utf-8" : "hex",
    );
    const recordedBodyText = recordedBodyBuffer.toString("utf-8");
    const recordedBoundaryMatch = boundaryRegex.exec(recordedBodyText);
    if (!recordedBoundaryMatch) {
      return body;
    }
    const recordedBoundary = recordedBoundaryMatch[0];

    // Parse the form data and get it into a normalized format by sorting the parts.
    const parts: MultipartInput[] = multipart.parse(bodyBuffer, boundary);
    parts.sort(partSorter);
    const recordedParts: MultipartInput[] = multipart.parse(
      recordedBodyBuffer,
      recordedBoundary,
    );
    recordedParts.sort(partSorter);

    // Check that the form inputs are equivalent.
    if (parts.length !== recordedParts.length) {
      return body;
    }
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      const recordedPart = recordedParts[i];

      // Check that all the metadata matches.
      if (
        !part ||
        !recordedPart ||
        part.filename !== recordedPart.filename ||
        part.name !== recordedPart.name ||
        part.type !== recordedPart.type
      ) {
        return body;
      }

      // Check that tarballs contain the same data.
      if (
        part &&
        part.filename &&
        /\.(tar|tar\.gz|tgz)$/i.test(part.filename)
      ) {
        const tarball = parseTarball(part.data);
        const recordedTarball = parseTarball(part.data);
        if (!_.isEqual(tarball, recordedTarball)) {
          return body;
        }
      } else {
        if (part.data.compare(recordedPart.data) !== 0) {
          return body;
        }
      }
    }

    // If we made it this far, it's a match, so pretend the body is whatever we recorded.
    return recordedBody;
  };
}
