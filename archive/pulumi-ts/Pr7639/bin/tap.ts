import * as pulumi from '@pulumi/pulumi';
import { TapStack } from '../lib/tap-stack';

const config = new pulumi.Config();
const environmentSuffix = config.require('environmentSuffix');

const stack = new TapStack('tap-stack', {
  environmentSuffix: environmentSuffix,
});

export const artifactBucketName = stack.artifactBucket.id;
export const codeBuildProjectName = stack.codeBuildProject.name;
export const pipelineName = stack.pipeline.name;
export const logGroupName = stack.logGroup.name;
