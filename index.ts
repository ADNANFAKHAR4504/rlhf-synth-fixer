import * as pulumi from '@pulumi/pulumi';
import { TapStack } from './lib/tap-stack';

const config = new pulumi.Config();
const environmentSuffix =
  config.get('environmentSuffix') || process.env.ENVIRONMENT_SUFFIX || 'dev';

const stack = new TapStack('TapStack', {
  environmentSuffix,
  tags: {
    Environment: environmentSuffix,
    Project: 'tap',
    ManagedBy: 'pulumi',
  },
});

export const albDnsName = stack.albDnsName;
export const clusterArn = stack.clusterArn;
export const ecrRepositories = stack.ecrRepositories;
