#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { WebAppStack } from '../lib/tap-stack';

const app = new cdk.App();

new WebAppStack(app, 'ScalableWebAppStack', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: 'us-west-2', // Oregon region as required
  },
  description: 'Scalable, highly available web application infrastructure',
});
