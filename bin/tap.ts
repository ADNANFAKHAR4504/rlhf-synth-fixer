import * as aws from '@pulumi/aws';
import * as pulumi from '@pulumi/pulumi';
import { TapStack } from '../lib/tap-stack';

// Configure Pulumi Kubernetes provider to handle unreachable clusters
// This prevents deployment failures when clusters are recreated or unreachable
process.env.PULUMI_K8S_DELETE_UNREACHABLE =
  process.env.PULUMI_K8S_DELETE_UNREACHABLE || 'true';

const config = new pulumi.Config();
const environmentSuffix =
  config.get('environmentSuffix') || process.env.ENVIRONMENT_SUFFIX || 'dev';

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
  'tap',
  {
    environmentSuffix,
    tags: defaultTags,
  },
  { provider }
);

export const clusterName = stack.clusterName;
export const clusterEndpoint = stack.clusterEndpoint;
export const meshName = stack.meshName;
