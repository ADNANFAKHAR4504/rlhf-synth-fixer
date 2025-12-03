import * as pulumi from '@pulumi/pulumi';
import { TapStack } from './lib/tap-stack';

const config = new pulumi.Config();
const environmentSuffix =
  config.get('environmentSuffix') || process.env.ENVIRONMENT_SUFFIX || 'dev';

const stack = new TapStack('tap-stack', {
  environmentSuffix: environmentSuffix,
  tags: {
    Project: 'TAP',
    ManagedBy: 'Pulumi',
  },
});

// Export stack outputs
export const tableArn = stack.tableArn;
export const streamArn = stack.streamArn;
export const lambdaRoleArn = stack.lambdaRoleArn;
