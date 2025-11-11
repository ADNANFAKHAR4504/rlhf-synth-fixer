import * as pulumi from '@pulumi/pulumi';
import { TapStack } from '../lib/tap-stack';

const config = new pulumi.Config();
const environmentSuffix = config.require('environmentSuffix');

const stack = new TapStack('payment-processing', {
  environmentSuffix,
});

export const blueAlbEndpoint = stack.blueAlbEndpoint;
export const greenAlbEndpoint = stack.greenAlbEndpoint;
export const blueDatabaseEndpoint = stack.blueDatabaseEndpoint;
export const greenDatabaseEndpoint = stack.greenDatabaseEndpoint;
export const dashboardUrl = stack.dashboardUrl;
