import * as pulumi from '@pulumi/pulumi';
import { TapStack } from '../lib/tap-stack';

const config = new pulumi.Config();
const environmentSuffix = config.require('environmentSuffix');

const stack = new TapStack('tap-stack', {
  environmentSuffix,
});

export const pipelineArn = stack.pipelineArn;
export const artifactBucketName = stack.artifactBucketName;
export const repositoryCloneUrl = stack.repositoryCloneUrl;
