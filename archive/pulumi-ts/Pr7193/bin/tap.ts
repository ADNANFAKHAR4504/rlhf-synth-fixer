import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';
import { TapStack } from '../lib/tap-stack';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';
const repository = process.env.REPOSITORY || 'unknown';
const team = process.env.TEAM || 'unknown';
const createdAt = new Date().toISOString();

const defaultTags = {
  Environment: environmentSuffix,
  Repository: repository,
  Team: team,
  CreatedAt: createdAt,
};

const provider = new aws.Provider('aws', {
  region: process.env.AWS_REGION || 'us-east-1',
  defaultTags: { tags: defaultTags },
});

const config = new pulumi.Config();
// Make githubToken optional with a dummy default for CI/CD environments
const githubToken =
  config.getSecret('githubToken') || pulumi.secret('dummy-token-for-testing');

const stack = new TapStack(
  'cicd-pipeline',
  {
    environmentSuffix,
    tags: defaultTags,
    githubOwner: config.get('githubOwner') || 'TuringGpt',
    githubRepo: config.get('githubRepo') || 'iac-test-automations',
    githubBranch: config.get('githubBranch') || 'main',
    githubToken,
  },
  { provider }
);

export const pipelineUrl = stack.pipelineUrl;
export const deploymentTableName = stack.deploymentTableName;
