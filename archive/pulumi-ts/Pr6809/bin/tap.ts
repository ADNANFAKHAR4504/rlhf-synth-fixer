#!/usr/bin/env node
import TapStack from '../lib/tap-stack';

const stack = new TapStack('Tap', {});

export const apiGatewayUrl = stack.apiGatewayUrl;
export const s3BucketName = stack.s3BucketName;
export const dynamodbTableArn = stack.dynamodbTableArn;
