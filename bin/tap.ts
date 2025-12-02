import * as pulumi from '@pulumi/pulumi';
import { TapStack } from '../lib/tap-stack';

const config = new pulumi.Config();
const environmentSuffix =
  config.get('environmentSuffix') || process.env.ENVIRONMENT_SUFFIX || 'dev';

const stack = new TapStack('tap', {
  environmentSuffix: environmentSuffix,
  tags: {
    Environment: 'ci',
    ManagedBy: 'pulumi',
  },
});

export const codeBuildProjectName = stack.codeBuildProjectName;
export const artifactBucketName = stack.artifactBucketName;
