import * as pulumi from '@pulumi/pulumi';
import { TapStack } from './lib/tap-stack';

// Get environment suffix from Pulumi config or use default
const config = new pulumi.Config();
const environmentSuffix =
  config.get('environmentSuffix') || process.env.ENVIRONMENT_SUFFIX || 'dev';

// Create the main stack
const tapStack = new TapStack('TapStack', {
  environmentSuffix,
  tags: {
    Environment: environmentSuffix,
    ManagedBy: 'Pulumi',
    Project: 'WebApp',
  },
});

// Export important outputs
export const vpcId = tapStack.networkStack.vpc.id;
export const publicSubnetIds = tapStack.networkStack.publicSubnets.map(
  s => s.id
);
export const privateSubnetIds = tapStack.networkStack.privateSubnets.map(
  s => s.id
);
export const albDnsName = tapStack.albStack.alb.dnsName;
export const albArn = tapStack.albStack.alb.arn;
export const ecsClusterName = tapStack.ecsClusterStack.cluster.name;
export const ecsClusterArn = tapStack.ecsClusterStack.cluster.arn;
export const frontendServiceName = tapStack.frontendService.service.name;
export const backendServiceName = tapStack.backendService.service.name;
