#!/usr/bin/env node
import { TapStack } from '../lib/tap-stack';

const stack = new TapStack('tap-stack');

export const vpcId = stack.vpc.id;
export const tableArn = stack.processor.table.arn;
export const tableName = stack.processor.table.name;
export const topicArn = stack.processor.topic.arn;
export const lambdaArn = stack.processor.lambda.arn;
export const lambdaName = stack.processor.lambda.name;
export const dlqArn = stack.processor.dlq.arn;
