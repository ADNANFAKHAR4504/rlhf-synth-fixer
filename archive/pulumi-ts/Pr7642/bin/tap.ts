#!/usr/bin/env node
import * as pulumi from '@pulumi/pulumi';
import { TapStack } from '../lib/tap-stack';

const config = new pulumi.Config();
const environmentSuffix = config.get('environmentSuffix') || 'dev';

const stack = new TapStack('tap', {
  environmentSuffix,
  tags: {
    Project: 'compliance-monitoring',
    ManagedBy: 'pulumi',
  },
});

export const vpcId = stack.vpcId;
export const instanceIds = stack.instanceIds;
export const lambdaFunctionArn = stack.lambdaFunctionArn;
export const dashboardUrl = stack.dashboardUrl;
