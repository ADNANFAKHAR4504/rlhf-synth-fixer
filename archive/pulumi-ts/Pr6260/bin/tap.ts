/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable quotes */
/* eslint-disable @typescript-eslint/quotes */
/* eslint-disable prettier/prettier */

import * as pulumi from "@pulumi/pulumi";
import { TapStack } from "../lib/tap-stack";

// Get environment suffix from context or environment variable
const config = new pulumi.Config();
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX ||
  config.get("environmentSuffix") ||
  pulumi.getStack().split("-").pop() ||
  "dev";


// Create the stack with environment suffix
const stack = new TapStack("tap-stack", {
  environmentSuffix: environmentSuffix
});

export const blueAlbEndpoint = stack.blueAlbEndpoint;
export const greenAlbEndpoint = stack.greenAlbEndpoint;
export const blueDatabaseEndpoint = stack.blueDatabaseEndpoint;
export const greenDatabaseEndpoint = stack.greenDatabaseEndpoint;
export const dashboardUrl = stack.dashboardUrl;
