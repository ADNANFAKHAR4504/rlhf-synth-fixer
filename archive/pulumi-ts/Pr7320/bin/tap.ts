import * as pulumi from '@pulumi/pulumi';
import { TapStack } from '../lib/tap-stack';

const config = new pulumi.Config();

// Get environmentSuffix from Pulumi config, fallback to ENVIRONMENT_SUFFIX env var, or use 'dev'
const environmentSuffix =
  config.get('environmentSuffix') || process.env.ENVIRONMENT_SUFFIX || 'dev';

const enableDeletionProtection =
  config.getBoolean('enableDeletionProtection') || false;

const stack = new TapStack('ecommerce-api-stack', {
  environmentSuffix,
  enableDeletionProtection,
});

// Export outputs
export const vpcId = stack.vpcId;
export const albDnsName = stack.albDnsName;
export const ecsClusterName = stack.ecsClusterName;
export const dbEndpoint = stack.dbEndpoint;
export const redisEndpoint = stack.redisEndpoint;
