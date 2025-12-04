import * as aws from '@pulumi/aws';
import { TapStack } from '../lib/tap-stack';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';
const repository = process.env.REPOSITORY || 'unknown';
const commitAuthor = process.env.COMMIT_AUTHOR || 'unknown';
const prNumber = process.env.PR_NUMBER || 'unknown';
const team = process.env.TEAM || 'unknown';
const createdAt = new Date().toISOString();
const notificationEmail = process.env.NOTIFICATION_EMAIL;

const defaultTags = {
  Environment: 'production',
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
  'pulumi-infra',
  {
    environmentSuffix: environmentSuffix,
    tags: defaultTags,
    notificationEmail: notificationEmail,
  },
  { provider }
);

export const repositoryCloneUrl = stack.repositoryCloneUrl;
export const buildProjectName = stack.buildProjectName;
export const buildProjectArn = stack.buildProjectArn;
export const artifactsBucketName = stack.artifactsBucketName;
export const logGroupName = stack.logGroupName;
export const serviceRoleArn = stack.serviceRoleArn;
export const snsTopicArn = stack.snsTopicArn;
export const kmsKeyArn = stack.kmsKeyArn;
export const eventBridgeRuleArn = stack.eventBridgeRuleArn;
export const dashboardUrl = stack.dashboardUrl;
