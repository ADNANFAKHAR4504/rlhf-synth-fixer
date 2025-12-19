import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';
import { TapStack } from '../lib/tap-stack';

const config = new pulumi.Config();
const environmentSuffix =
  config.get('environmentSuffix') || process.env.ENVIRONMENT_SUFFIX || 'dev';
const githubRepo = config.get('githubRepo') || 'example-org/example-repo';
const githubBranch = config.get('githubBranch') || 'main';
const githubConnectionArn = config.get('githubConnectionArn') || '';

// Get metadata from environment variables for tagging purposes
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

// Configure AWS provider with default tags
const provider = new aws.Provider('aws', {
  region: process.env.AWS_REGION || 'us-east-1',
  defaultTags: {
    tags: defaultTags,
  },
});

const stack = new TapStack(
  'tap',
  {
    environmentSuffix,
    githubRepo,
    githubBranch,
    githubConnectionArn,
    tags: defaultTags,
  },
  { provider }
);

export const pipelineUrl = stack.pipelineUrl;
export const ecrRepositoryUri = stack.ecrRepositoryUri;
