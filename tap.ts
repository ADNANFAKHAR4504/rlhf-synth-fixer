import * as pulumi from '@pulumi/pulumi';
import { TapStack } from './lib/tap-stack';

const config = new pulumi.Config();
const environmentSuffix = config.get('environmentSuffix') || 'dev';

const stack = new TapStack('payment-dr-stack', {
  environmentSuffix: environmentSuffix,
  primaryRegion: 'us-east-1',
  drRegion: 'us-east-2',
});

export const primaryApiEndpoint = stack.primaryApiEndpoint;
export const secondaryApiEndpoint = stack.secondaryApiEndpoint;
export const healthCheckUrl = stack.healthCheckUrl;
export const replicationLagAlarmArn = stack.replicationLagAlarmArn;
