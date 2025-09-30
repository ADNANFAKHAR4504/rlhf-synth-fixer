/* eslint-disable prettier/prettier */

import * as pulumi from '@pulumi/pulumi';
import { TapStack } from '../lib/tap-stack';

const config = new pulumi.Config();
const environmentSuffix = config.get('env') || 'dev';

const repository =
  config.get('repository') || process.env.REPOSITORY || 'unknown';
const commitAuthor =
  config.get('commitAuthor') || process.env.COMMIT_AUTHOR || 'unknown';

const defaultTags = {
  Environment: environmentSuffix,
  Repository: repository,
  Author: commitAuthor,
  ManagedBy: 'Pulumi',
};

const githubToken =
  config.getSecret('githubToken') || pulumi.output('dummy-token-for-testing');
const githubOwner = config.get('githubOwner');
const githubRepo = config.get('githubRepo');
const githubBranch = config.get('githubBranch') || 'main';
const enableApproval =
  config.getBoolean('enableApproval') ?? environmentSuffix === 'prod';
const notificationEmail =
  config.get('notificationEmail') || 'notifications@example.com';

const stack = new TapStack('pulumi-infra', {
  environmentSuffix: environmentSuffix,
  tags: defaultTags,
  githubOwner: githubOwner,
  githubRepo: githubRepo,
  githubBranch: githubBranch,
  githubToken: githubToken,
  enableApproval: enableApproval,
  notificationEmail: notificationEmail,
});

// Export all outputs for integration testing
export const kmsKeyId = stack.outputs.kmsKeyId;
export const kmsKeyArn = stack.outputs.kmsKeyArn;
export const artifactBucketName = stack.outputs.artifactBucketName;
export const artifactBucketArn = stack.outputs.artifactBucketArn;
export const snsTopicArn = stack.outputs.snsTopicArn;
export const ecsClusterName = stack.outputs.ecsClusterName;
export const ecsClusterArn = stack.outputs.ecsClusterArn;
export const ecsServiceName = stack.outputs.ecsServiceName;
export const ecsServiceArn = stack.outputs.ecsServiceArn;
export const ecsTaskDefinitionArn = stack.outputs.ecsTaskDefinitionArn;
export const codeBuildProjectName = stack.outputs.codeBuildProjectName;
export const codeBuildProjectArn = stack.outputs.codeBuildProjectArn;
export const codeDeployAppName = stack.outputs.codeDeployAppName;
export const codeDeployAppArn = stack.outputs.codeDeployAppArn;
export const codeDeployGroupName = stack.outputs.codeDeployGroupName;
export const codeDeployGroupArn = stack.outputs.codeDeployGroupArn;
export const codePipelineName = stack.outputs.codePipelineName;
export const codePipelineArn = stack.outputs.codePipelineArn;
export const logGroupName = stack.outputs.logGroupName;
export const logGroupArn = stack.outputs.logGroupArn;
export const albArn = stack.outputs.albArn;
export const albDnsName = stack.outputs.albDnsName;
export const blueTargetGroupArn = stack.outputs.blueTargetGroupArn;
export const greenTargetGroupArn = stack.outputs.greenTargetGroupArn;
export const listenerArn = stack.outputs.listenerArn;
export const vpcId = stack.outputs.vpcId;
export const publicSubnet1Id = stack.outputs.publicSubnet1Id;
export const publicSubnet2Id = stack.outputs.publicSubnet2Id;
export const stackName = stack.outputs.stackName;
export const environment = stack.outputs.environmentSuffix;
export const regions = stack.outputs.regions;
