#!/usr/bin/env node
import * as pulumi from '@pulumi/pulumi';
import { TapStack } from '../lib/tap-stack';

// Create the stack
const stack = new TapStack();

// Export outputs
export const resultsBucketName = stack.resultsBucket.id;
export const resultsBucketArn = stack.resultsBucket.arn;
export const analysisFunctionName = stack.analysisFunction.name;
export const analysisFunctionArn = stack.analysisFunction.arn;
export const dashboardName = stack.dashboard.dashboardName;
export const publicAccessAlarmName = stack.publicAccessAlarm.name;
export const unencryptedBucketsAlarmName = stack.unencryptedBucketsAlarm.name;
export const lambdaFailureAlarmName = stack.lambdaFailureAlarm.name;
