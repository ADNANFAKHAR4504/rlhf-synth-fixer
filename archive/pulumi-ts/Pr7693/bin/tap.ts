#!/usr/bin/env node
import * as pulumi from '@pulumi/pulumi';
import { TapStack } from '../lib/tap-stack';

const config = new pulumi.Config();
const environmentSuffix = config.require('environmentSuffix');
const region = config.get('region') || 'us-east-1';

const stack = new TapStack('tap-stack', {
  environmentSuffix,
  region,
});

// Standard outputs
export const scanResults = stack.scanResults;
export const complianceReport = stack.complianceReport;

// Outputs for integration tests (match flat-outputs.json format)
export const LambdaFunctionName = stack.lambdaFunctionName;
export const S3BucketName = stack.s3BucketName;
export const LambdaFunctionArn = stack.lambdaFunctionArn;
export const EventRuleName = stack.eventRuleName;
