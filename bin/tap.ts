#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { SecureInfrastructureStack } from '../lib/tap-stack';

const app = new cdk.App();

// Deploy to us-west-2 region as specified
new SecureInfrastructureStack(app, 'SecureInfrastructureStack', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: 'us-west-2'
  },
  description: 'Secure AWS Infrastructure with comprehensive security controls',
  tags: {
    Environment: 'Production',
    Project: 'SecureWebApp',
    Owner: 'DevSecOps',
    CostCenter: 'Engineering'
  }
});