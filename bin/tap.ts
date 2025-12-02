import * as pulumi from '@pulumi/pulumi';
import { TapStack } from '../lib/tap-stack';

const config = new pulumi.Config();

const stack = new TapStack('tap', {
  environmentSuffix: config.require('environmentSuffix'),
  githubOwner: config.get('githubOwner'),
  githubRepo: config.get('githubRepo'),
  githubBranch: config.get('githubBranch'),
  ecsClusterName: config.get('ecsClusterName'),
  ecsServiceName: config.get('ecsServiceName'),
});

export const pipelineArn = stack.pipelineArn;
export const codeBuildProjectArn = stack.codeBuildProjectArn;
export const ecrRepositoryUri = stack.ecrRepositoryUri;
export const artifactBucketName = stack.artifactBucketName;
export const logGroupName = stack.logGroupName;
