import axios from "axios";
import { serializeError, deserializeError } from "serialize-error";

/**
 * Make an error object serializable.
 *
 * The heavy lifting is done by the `serialize-error` package, which handles functions, buffers,
 * circular references, and other things that would make errors non-serializable. We simply do a
 * round trip through serialization and deserialization to ensure that the error is clean.
 */
function sanitizeError(error: Error): Error {
  return deserializeError(serializeError(error));
}

/**
 * Patch Axios to remove functions from the request config.
 *
 * When Ava tries to serialize axios errors to send IPC messages from the test workers to the main
 * process, it fails because the error object contains functions. This patch removes any functions
 * so that the errors can be serialized. The Ava test config is setup to automatically load and run
 * this patch in the test workers.
 */
export function makeAxiosErrorsSerializable() {
  axios.interceptors.response.use(
    (response) => response,
    (error) => Promise.reject(sanitizeError(error)),
  );
}

export default makeAxiosErrorsSerializable;
