import * as pulumi from '@pulumi/pulumi';
import { TapStack } from '../lib/tap-stack';

const config = new pulumi.Config();

// Get environmentSuffix from config, environment variable, or use default
const environmentSuffix =
  config.get('environmentSuffix') ||
  process.env.ENVIRONMENT_SUFFIX ||
  process.env.PR_NUMBER ||
  'dev';

const stack = new TapStack(`tap-stack-${environmentSuffix}`);

export const vpcId = stack.vpcId;
export const rdsEndpoint = stack.rdsEndpoint;
export const bucketName = stack.bucketName;
export const lambdaArn = stack.lambdaArn;
export const apiUrl = stack.apiUrl;
