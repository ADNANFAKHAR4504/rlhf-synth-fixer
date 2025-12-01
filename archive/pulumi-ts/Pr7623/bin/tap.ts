import * as aws from '@pulumi/aws';
import { TapStack } from '../lib/tap-stack';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

const repository = process.env.REPOSITORY || 'unknown';
const commitAuthor = process.env.COMMIT_AUTHOR || 'unknown';
const prNumber = process.env.PR_NUMBER || 'unknown';
const team = process.env.TEAM || 'unknown';
const createdAt = new Date().toISOString();

const defaultTags = {
  Environment: environmentSuffix,
  Repository: repository,
  Author: commitAuthor,
  PRNumber: prNumber,
  Team: team,
  CreatedAt: createdAt,
};

const provider = new aws.Provider('aws', {
  region: process.env.AWS_REGION || 'us-east-1',
  defaultTags: {
    tags: defaultTags,
  },
});

const stack = new TapStack(
  'ec2-cost-optimizer',
  {
    environmentSuffix: environmentSuffix,
    tags: defaultTags,
  },
  { provider }
);

export const stateTableName = stack.stateTableName;
export const startRuleArn = stack.startRuleArn;
export const stopRuleArn = stack.stopRuleArn;
export const stateMachineArn = stack.stateMachineArn;
export const estimatedMonthlySavings = stack.estimatedMonthlySavings;
