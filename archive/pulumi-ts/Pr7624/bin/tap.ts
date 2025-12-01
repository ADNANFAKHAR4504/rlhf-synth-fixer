import * as pulumi from '@pulumi/pulumi';
import { CicdPipelineStack } from '../lib/cicd-pipeline-stack';

const config = new pulumi.Config();
const environmentSuffix = config.require('environmentSuffix');

const stack = new CicdPipelineStack('TapStack', {
  environmentSuffix,
});

export const pipelineUrl = stack.pipelineUrl;
export const ecrRepositoryUri = stack.ecrRepositoryUri;
export const artifactBucketName = stack.artifactBucketName;
export const cloudFrontUrl = stack.cloudFrontUrl;
export const snsTopicArn = stack.snsTopicArn;
export const taskDefinitionArn = stack.taskDefinitionArn;
