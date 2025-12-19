#!/usr/bin/env node
import * as pulumi from '@pulumi/pulumi';
import { TapStack } from '../lib/tap-stack';

const config = new pulumi.Config();
const environmentSuffix = config.get('environmentSuffix') || process.env.ENVIRONMENT_SUFFIX || '';
const region = config.get('region') || process.env.AWS_REGION || 'us-east-1';

const stack = new TapStack('payment-webhook-migration', {
  environmentSuffix: environmentSuffix,
  region: region,
});

export const functionUrl = stack.functionUrl;
export const tableArn = stack.tableArn;
export const lambdaArn = stack.lambdaArn;
