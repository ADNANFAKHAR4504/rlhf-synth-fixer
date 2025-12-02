import * as pulumi from '@pulumi/pulumi';
import { TapStack } from './lib/tap-stack';

const config = new pulumi.Config();
const environmentSuffix =
  config.get('environmentSuffix') || process.env.ENVIRONMENT_SUFFIX || 'dev';

const stack = new TapStack('ecs-fargate-optimization', {
  environmentSuffix: environmentSuffix,
  tags: {
    Owner: 'DevOps',
    CostCenter: 'Engineering',
  },
});

export const clusterName = stack.clusterName;
export const serviceName = stack.serviceName;
export const serviceEndpoint = stack.serviceEndpoint;
export const albDnsName = stack.albDnsName;
