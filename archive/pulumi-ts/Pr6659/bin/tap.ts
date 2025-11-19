#!/usr/bin/env node
import * as pulumi from '@pulumi/pulumi';
import { TapStack } from '../lib/tap-stack';

const config = new pulumi.Config();
const environmentSuffix = config.get('environmentSuffix') || 'dev';

const stack = new TapStack('tap-stack', {
  environmentSuffix: environmentSuffix,
  tags: {
    Project: 'TradingPlatform',
    ManagedBy: 'Pulumi',
  },
});

export const primaryEndpoint = stack.primaryEndpoint;
export const secondaryEndpoint = stack.secondaryEndpoint;
export const healthCheckUrl = stack.healthCheckUrl;
export const dashboardUrl = stack.dashboardUrl;
