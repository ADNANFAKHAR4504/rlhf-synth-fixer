#!/usr/bin/env node
import * as pulumi from '@pulumi/pulumi';
import { SecureApiStack } from '../lib';

const config = new pulumi.Config();
const environmentSuffix = config.require('environmentSuffix');

const stack = new SecureApiStack('secure-api-stack', {
  environmentSuffix,
  region: 'ap-southeast-1',
});

export const apiUrl = stack.apiUrl;
export const functionName = stack.functionName;
export const kmsKeyId = stack.kmsKeyId;
export const logGroupName = stack.logGroupName;
