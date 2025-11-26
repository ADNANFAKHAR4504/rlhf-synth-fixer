import * as pulumi from '@pulumi/pulumi';
import { TapStack } from '../lib/tap-stack';

const config = new pulumi.Config();
const environmentSuffix =
  config.get('environmentSuffix') || process.env.ENVIRONMENT_SUFFIX || 'dev';

// Instantiate the stack
const stack = new TapStack(`tap-stack-${environmentSuffix}`);

// Export outputs (if present on the stack)
export const vpcId = (stack as any).vpcId;
export const rdsEndpoint = (stack as any).rdsEndpoint;
export const bucketName = (stack as any).bucketName;
export const lambdaArn = (stack as any).lambdaArn;
export const apiUrl = (stack as any).apiUrl;
