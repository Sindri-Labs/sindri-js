/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */

/**
 * Response for producing proof histograms.
 */
export type ProofHistogramResponse = {
  /**
   * The bin size in seconds.
   */
  bin_size: number;
  /**
   * A list of dictionaries in the format:</br>
   * ```
   * {
   * 'bin': '2021-01-01T00:00:00Z',
   * 'ready': 2,
   * 'failed': 1,
   * 'in_progress': 3,
   * 'queued': 4,
   * }
   * ```</br>
   * where 'bin' is an ISO8601 timestamp indicating the start
   * of the bin, and proof status keys (e.g. 'ready') indicating
   * the number of proofs with that status in the bin.
   */
  data: Array<Record<string, any>>;
  /**
   * The end of the histogram in timezone-aware ISO8601 format.
   */
  end_time: string;
  /**
   * The start of the histogram in timezone-aware ISO8601 format.
   */
  start_time: string;
};
