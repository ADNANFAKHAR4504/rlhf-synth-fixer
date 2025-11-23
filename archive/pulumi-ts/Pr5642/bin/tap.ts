import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';
import * as fs from 'fs';
import * as path from 'path';
import { TapStack } from '../lib/tap-stack';

const config = new pulumi.Config();
// Read from environment variable set by CI/CD pipeline, fallback to Pulumi config, then 'dev'
const environmentSuffix =
  process.env.ENVIRONMENT_SUFFIX || config.get('environmentSuffix') || 'dev';
const notificationEmail = config.get('notificationEmail');

// Read AWS region from lib/AWS_REGION file or environment variable
let awsRegion = process.env.AWS_REGION || 'us-east-1';
try {
  const regionFilePath = path.join(__dirname, '../lib/AWS_REGION');
  if (fs.existsSync(regionFilePath)) {
    awsRegion = fs.readFileSync(regionFilePath, 'utf-8').trim();
  }
} catch (error) {
  // Fall back to environment variable or default
}

// Configure AWS provider with explicit region
const awsProvider = new aws.Provider('aws-provider', {
  region: awsRegion,
});

const stack = new TapStack(
  'tap-stack',
  {
    environmentSuffix: environmentSuffix,
    notificationEmail: notificationEmail,
    tags: {
      ManagedBy: 'Pulumi',
    },
  },
  { provider: awsProvider }
);

export const vpcId = stack.vpc.id;
export const rdsEndpoint = stack.rdsInstance.endpoint;
export const snsTopicArn = stack.snsTopic.arn;
