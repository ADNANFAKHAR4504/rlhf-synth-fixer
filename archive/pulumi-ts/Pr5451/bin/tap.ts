#!/usr/bin/env node
import * as pulumi from '@pulumi/pulumi';
import { TapStack } from '../lib/tap-stack';

const config = new pulumi.Config();
const environmentSuffix = config.get('environmentSuffix') || 'dev';

const stack = new TapStack('webhook-processing-stack', {
  environmentSuffix: environmentSuffix,
  tags: {
    Environment: environmentSuffix,
    Project: 'webhook-processing',
    ManagedBy: 'pulumi',
  },
});

export const apiUrl = stack.apiUrl;
export const tableName = stack.tableName;
export const bucketName = stack.bucketName;
