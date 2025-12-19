import * as pulumi from '@pulumi/pulumi';
import { TapStack } from '../lib/tap-stack';

const config = new pulumi.Config();
const environment = pulumi.getStack();

const stack = new TapStack('TapStack', {
  environmentSuffix: environment,
  tags: {
    Environment: environment,
    CostCenter: config.get('costCenter') || 'engineering',
    Owner: config.get('owner') || 'platform-team',
  },
});

// Export key outputs
export const vpcId = stack.vpcId;
export const publicSubnetIds = stack.publicSubnetIds;
export const privateSubnetIds = stack.privateSubnetIds;
export const ecsClusterId = stack.ecsClusterId;
export const rdsEndpoint = stack.rdsEndpoint;
export const albDnsName = stack.albDnsName;
export const cloudfrontDomainName = stack.cloudfrontDomainName;
export const appBucketName = stack.appBucketName;
