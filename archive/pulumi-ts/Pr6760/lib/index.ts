import * as pulumi from '@pulumi/pulumi';
import { TapStack } from './tap-stack';

const config = new pulumi.Config();
const environmentSuffix =
  config.get('environmentSuffix') || process.env.ENVIRONMENT_SUFFIX || 'dev';

const stack = new TapStack('eks-cluster', {
  environmentSuffix,
  tags: {
    Environment: environmentSuffix,
    ManagedBy: 'Pulumi',
    Project: 'EKS-Production',
  },
});

export const vpcId = stack.vpcId;
export const clusterName = stack.clusterName;
export const clusterEndpoint = stack.clusterEndpoint;
export const clusterOidcIssuer = stack.clusterOidcIssuer;
export const kubeconfig = stack.kubeconfig;
export const clusterSecurityGroupId = stack.clusterSecurityGroupId;
export const nodeGroupArns = stack.nodeGroupArns;
