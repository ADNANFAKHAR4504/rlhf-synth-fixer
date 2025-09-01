#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { SecureVpcStack } from '../lib/tap-stack';

const app = new cdk.App();

new SecureVpcStack(app, 'SecureVpcStack', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: 'us-west-2',
  },
  vpcCidr: '10.0.0.0/16',
  allowedSshCidr: '203.0.113.0/24', // Replace with your IP range
  companyTags: {
    Environment: 'Production',
    Project: 'SecureVPC',
    Owner: 'DevOps',
    CostCenter: 'IT-Infrastructure',
    Compliance: 'SOC2',
  },
});