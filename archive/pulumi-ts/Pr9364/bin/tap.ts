#!/usr/bin/env node
import * as pulumi from '@pulumi/pulumi';
import { TapStack } from '../lib/tap-stack';

// Get environment suffix from config or environment variable
const config = new pulumi.Config();
const environmentSuffix =
  config.get('environmentSuffix') || process.env.ENVIRONMENT_SUFFIX || 'dev';

const repository = config.get('repository') || 'unknown';
const commitAuthor = config.get('commitAuthor') || 'unknown';

const defaultTags = {
  Environment: environmentSuffix,
  Repository: repository,
  Author: commitAuthor,
};

// Create the main stack
const tapStack = new TapStack('pulumi-infra', {
  environmentSuffix,
  tags: defaultTags,
});

// Export stack outputs
export const vpcId = tapStack.vpcId;
export const publicSubnetIds = tapStack.publicSubnetIds;
export const privateSubnetIds = tapStack.privateSubnetIds;
export const rdsEndpoint = tapStack.rdsEndpoint;
export const s3BucketName = tapStack.s3BucketName;
export const applicationRoleArn = tapStack.applicationRoleArn;
export const kmsKeyId = tapStack.kmsKeyId;
export const instanceProfileArn = tapStack.instanceProfileArn;
