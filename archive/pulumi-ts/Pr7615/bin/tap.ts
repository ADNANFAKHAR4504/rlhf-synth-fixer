/**
 * Pulumi application entry point for Lambda optimization infrastructure.
 */
import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';
import { TapStack } from '../lib/tap-stack';

const config = new pulumi.Config();
const environmentSuffix =
  config.get('environmentSuffix') || process.env.ENVIRONMENT_SUFFIX || 'dev';

const repository = process.env.REPOSITORY || 'iac-test-automations';
const commitAuthor = process.env.COMMIT_AUTHOR || 'synth-agent';
const prNumber = process.env.PR_NUMBER || 'local';
const team = process.env.TEAM || 'synth';
const createdAt = new Date().toISOString();

const defaultTags = {
  Environment: environmentSuffix,
  Repository: repository,
  Author: commitAuthor,
  PRNumber: prNumber,
  Team: team,
  CreatedAt: createdAt,
  ManagedBy: 'Pulumi',
};

const provider = new aws.Provider('aws', {
  region: process.env.AWS_REGION || 'us-east-1',
  defaultTags: {
    tags: defaultTags,
  },
});

const stack = new TapStack(
  'pulumi-infra',
  {
    environmentSuffix,
    tags: defaultTags,
  },
  { provider }
);

// Export stack outputs
export const lambdaArn = stack.lambdaArn;
export const lambdaName = stack.lambdaName;
export const roleArn = stack.roleArn;
export const logGroupName = stack.logGroupName;
export const dlqUrl = stack.dlqUrl;
export const layerArn = stack.layerArn;
