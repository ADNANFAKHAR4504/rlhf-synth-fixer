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

export const scanResults = stack.scanResults;
export const complianceReport = stack.complianceReport;
