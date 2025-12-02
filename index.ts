import * as pulumi from '@pulumi/pulumi';
import { TapStack } from './lib/tap-stack';

const config = new pulumi.Config();
const environmentSuffix =
  config.get('environmentSuffix') || process.env.ENVIRONMENT_SUFFIX || 'dev';

const stack = new TapStack('tap-stack', {
  environmentSuffix: environmentSuffix,
  tags: {
    Environment: 'Production',
    ManagedBy: 'Pulumi',
  },
  githubRepo: config.get('githubRepo'),
  githubBranch: config.get('githubBranch') || 'main',
  githubToken: config.getSecret('githubToken'),
});

export const artifactBucketName = stack.artifactBucketName;
export const ecrRepositoryUrl = stack.ecrRepositoryUrl;
export const pipelineName = stack.pipelineName;
