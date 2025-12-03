#!/usr/bin/env node
import * as pulumi from '@pulumi/pulumi';
import { TapStack } from '../lib/tap-stack';

const config = new pulumi.Config();
const environmentSuffix =
  config.get('environmentSuffix') || process.env.ENVIRONMENT_SUFFIX || 'dev';

const stack = new TapStack('tap', {
  environmentSuffix: environmentSuffix,
});

export const tableName = stack.table;
export const processorFunctionArn = stack.processorFunctionArn;
export const dlqUrl = stack.dlqUrl;
