import * as pulumi from '@pulumi/pulumi';
import { TapStack } from '../lib/tap-stack';

const config = new pulumi.Config();
const environmentSuffix = config.get('environmentSuffix') || 'dev';

const stack = new TapStack('tap', {
  environmentSuffix: environmentSuffix,
  tags: {
    Environment: 'production',
    Team: 'devops',
  },
});

export const pipelineArn = stack.pipelineArn;
export const artifactBucketName = stack.artifactBucketName;
