import * as pulumi from '@pulumi/pulumi';
import { TapStack } from '../lib/tap-stack';

const config = new pulumi.Config();
const environmentSuffix =
  config.get('environmentSuffix') || process.env.ENVIRONMENT_SUFFIX || 'dev';
const awsRegion =
  config.get('awsRegion') || process.env.AWS_REGION || 'us-east-1';

// Create the stack
const stack = new TapStack('TapStack', {
  environmentSuffix: environmentSuffix,
  awsRegion: awsRegion,
  approvedAmiIds: ['ami-0c55b159cbfafe1f0', 'ami-0abcdef1234567890'],
  requiredTags: ['Environment', 'Owner', 'CostCenter'],
});

// Export stack outputs
export const configBucketName = stack.configBucketOutput;
export const snsTopicArn = stack.snsTopicArn;
export const complianceFunctionArn = stack.complianceFunction.arn;
export const configRecorderName = stack.configRecorderName;
