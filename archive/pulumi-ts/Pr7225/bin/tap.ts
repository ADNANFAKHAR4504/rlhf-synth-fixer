#!/usr/bin/env node
import * as pulumi from '@pulumi/pulumi';
import { TapStack } from '../lib/tap-stack';

const config = new pulumi.Config();
const environmentSuffix =
  process.env.ENVIRONMENT_SUFFIX || config.get('environmentSuffix') || 'dev';
const domainName =
  config.get('domainName') || `testdomain-${environmentSuffix}.net`;

const stack = new TapStack('tap-stack', {
  environmentSuffix: environmentSuffix,
  primaryRegion: 'us-east-1',
  secondaryRegion: 'us-west-2',
  domainName: domainName,
});

export const primaryVpcId = stack.primaryVpcId;
export const secondaryVpcId = stack.secondaryVpcId;
export const dynamoTableName = stack.dynamoTableName;
export const primaryBucketName = stack.primaryBucketName;
export const secondaryBucketName = stack.secondaryBucketName;
export const primaryLambdaArn = stack.primaryLambdaArn;
export const secondaryLambdaArn = stack.secondaryLambdaArn;
export const primaryAlbDns = stack.primaryAlbDns;
export const secondaryAlbDns = stack.secondaryAlbDns;
export const primaryAlbArn = stack.primaryAlbArn;
export const secondaryAlbArn = stack.secondaryAlbArn;
export const primaryTargetGroupArn = stack.primaryTargetGroupArn;
export const secondaryTargetGroupArn = stack.secondaryTargetGroupArn;
export const hostedZoneId = stack.hostedZoneId;
export const healthCheckId = stack.healthCheckId;
export const primarySnsTopicArn = stack.primarySnsTopicArn;
export const secondarySnsTopicArn = stack.secondarySnsTopicArn;
