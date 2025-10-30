import * as pulumi from '@pulumi/pulumi';
import { TapStack } from './lib/tap-stack';

// Get configuration from Pulumi config
const config = new pulumi.Config();
const environmentSuffix = config.get('environmentSuffix') || pulumi.getStack();

// Create the main stack
const stack = new TapStack('webapp', {
  environmentSuffix: environmentSuffix,
  tags: {
    Environment: environmentSuffix,
    ManagedBy: 'Pulumi',
    Project: 'WebApp',
  },
});

// Export outputs
export const vpcId = stack.networkStack.vpc.id;
export const clusterArn = stack.ecsClusterStack.cluster.arn;
export const albDnsName = stack.albStack.alb.dnsName;
export const applicationUrl = stack.route53Stack.fullDomainName;
export const frontendEcrRepositoryUrl =
  stack.ecsClusterStack.ecrRepositoryFrontend.repositoryUrl;
export const backendEcrRepositoryUrl =
  stack.ecsClusterStack.ecrRepositoryBackend.repositoryUrl;
export const frontendServiceName = stack.frontendService.service.name;
export const backendServiceName = stack.backendService.service.name;
