import * as pulumi from '@pulumi/pulumi';
import { TapStack } from '../lib/tap-stack';

const config = new pulumi.Config();
const environmentSuffix = config.require('environmentSuffix');

const stack = new TapStack('TapStack', {
  environmentSuffix,
});

export const artifactBucketName = stack.artifactBucketName;
export const deployBucketName = stack.deployBucketName;
export const codeBuildProjectName = stack.codeBuildProjectName;
export const codePipelineName = stack.codePipelineName;
export const codeBuildLogGroupName = stack.codeBuildLogGroupName;
export const codeBuildRoleArn = stack.codeBuildRoleArn;
export const codePipelineRoleArn = stack.codePipelineRoleArn;
export const eventRuleArn = stack.eventRuleArn;
