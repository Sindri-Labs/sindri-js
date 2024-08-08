import type { Logger } from "lib/logging";

let cachedDefaultMeta: Meta | null = null;

/**
 * Retrieves the default metadata from the `SINDRI_META` environment variable.
 *
 * The `SINDRI_META` environment variable can be set to a JSON object (e.g., `{"key": "value"}`) or
 * a colon-delimited string of key-value pairs (e.g., `key1=value1:key2=value2`). In the
 * colon-delimited format, you can escape actual colons by doubling them (`::` will map to `:`).
 *
 * @param options.cache - Whether to cache the default metadata. Note that retrieving a cached value
 * will not raise exceptions or log warnings, even if the `raiseExceptions` option is set to `true`.
 * @param options.logger - The optional logger to use for warning messages.
 * @param options.raiseExceptions - Whether to raise exceptions for invalid metadata entries.
 * Warnings will not be logged if this is set to `true`.
 */
export function getDefaultMeta({
  cache = true,
  logger,
  raiseExceptions = false,
}: { cache?: boolean; logger?: Logger; raiseExceptions?: boolean } = {}): Meta {
  if (cache && cachedDefaultMeta) {
    return cachedDefaultMeta;
  }

  // There are no environment variables in a browser.
  if (process.env.BROWSER_BUILD) {
    return (cachedDefaultMeta = {});
  }

  const { SINDRI_META } = process.env;
  if (!SINDRI_META) {
    return (cachedDefaultMeta = {});
  }

  // Handle the filtering, validation, logging, and/or error handling for each metadata entry.
  const validationFilter = ([key, value]: [string, unknown]): boolean => {
    if (typeof value !== "string") {
      const errorMessage = `Invalid metadata entry for '${key}' (value must be a string).`;
      if (raiseExceptions) {
        throw new Error(errorMessage);
      }
      logger?.warn(
        {
          key,
          value,
          SINDRI_META,
        },
        errorMessage + " Ignoring.",
      );
      return false;
    }
    const validationError = validateMetaEntry(key, value);
    if (validationError) {
      if (raiseExceptions) {
        throw new Error(validationError);
      }
      logger?.warn(
        {
          key,
          value,
          SINDRI_META,
        },
        validationError + " Ignoring.",
      );
      return false;
    }
    return true;
  };

  // Support specifying default metadata as JSON.
  if (SINDRI_META.startsWith("{")) {
    try {
      return (cachedDefaultMeta = Object.fromEntries(
        Object.entries(JSON.parse(SINDRI_META)).filter(validationFilter),
      ) as Meta);
    } catch (error) {
      const errorMessage = "Failed to parse 'SINDRI_META' as JSON.";
      if (raiseExceptions) {
        throw new Error(errorMessage);
      }
      logger?.warn(
        {
          SINDRI_META,
          error: (error as Error).toString(),
        },
        errorMessage + " Using '{}' as the default.",
      );
      return (cachedDefaultMeta = {});
    }
  }

  // Support the `key=value:key=value` format.
  const colonPlaceholder = "\0";
  // Split the string into :-delimited pieces, and unescape `::` to `:` in each segment.
  return (cachedDefaultMeta = Object.fromEntries(
    SINDRI_META.replace(/::/g, colonPlaceholder)
      .split(":")
      .map((segment) => segment.replace(new RegExp(colonPlaceholder, "g"), ":"))
      // Split each piece into a key and value.
      .filter((segment) => {
        if (!segment.includes("=")) {
          const errorMessage =
            `Invalid 'SINDRI_META' metadata segment '${segment}' ` +
            "(missing '=', try 'key=value').";
          if (raiseExceptions) {
            throw new Error(errorMessage);
          }
          logger?.warn({ segment, SINDRI_META }, errorMessage + " Ignoring.");
          return false;
        }
        return true;
      })
      .map((segment): [key: string, value: string] => {
        const index = segment.indexOf("=");
        return [segment.slice(0, index), segment.slice(index + 1)];
      })
      // Validate the keys and values (logic should match the backend validation).
      .filter(validationFilter),
  ));
}

export type Meta = Record<string, string>;

/**
 * Validates the metadata and merges it with the default metadata.
 *
 * @param meta - The metadata to validate and merge.
 * @returns The validated and merged metadata.
 */
export function validateMetaAndMergeWithDefaults(meta: Meta): Meta {
  const defaultMeta = getDefaultMeta({ raiseExceptions: true });
  Object.entries(meta).forEach(([key, value]) => {
    const validationError = validateMetaEntry(key, value);
    if (validationError) {
      throw new Error(validationError);
    }
  });
  return { ...defaultMeta, ...meta };
}

/**
 * Validates a key-value pair of metadata.
 *
 * @param key - The metadata key.
 * @param value - The metadata value.
 * @returns An error message if the entry is invalid, otherwise `null`.
 */
export function validateMetaEntry(key: string, value: string): string | null {
  // These validation constraints must be kept in sync with the backend.
  const keyLengthLow = 1;
  const keyLengthHigh = 64;
  const valueLengthLow = 0;
  const valueLengthHigh = 4096;
  const keyRegex = /^[a-zA-Z][a-zA-Z0-9_-]*$/;

  // Validate the key.
  if (key.length < keyLengthLow || key.length > keyLengthHigh) {
    return (
      `Invalid metadata key length for '${key}' (must be ` +
      `${keyLengthLow}-${keyLengthHigh} characters).`
    );
  }
  if (!keyRegex.test(key)) {
    return (
      `Invalid metadata key for '${key}' (must start with an alphabet character and only ` +
      "include alphanumeric characters, underscores, and hyphens)."
    );
  }

  // Validate the value.
  if (value.length < valueLengthLow || value.length > valueLengthHigh) {
    return (
      `Invalid metadata value length for '${key}' (must be ` +
      `${valueLengthLow}-${valueLengthHigh} characters).`
    );
  }

  // Otherwise, the entry is valid.
  return null;
}
