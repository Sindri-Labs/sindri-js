import { InternalService } from "lib/api";

export default {
  environment: process.env.NODE_ENV,
  getSindriManifestSchema: async () =>
    await InternalService.sindriManifestSchema(),
};
