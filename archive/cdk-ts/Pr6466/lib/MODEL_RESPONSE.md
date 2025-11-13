// main.ts

import * as cdk from 'aws-cdk-lib';
import { PrimaryStack, SecondaryStack, SharedConfig } from './tapstack';

const app = new cdk.App();

// 🔹 Shared Configuration
const sharedConfig: SharedConfig = {
  domainName: 'payments.example.com',
  alertEmail: 'ops-team@example.com',
  tags: {
    'Environment': 'Production',
    'DR-Tier': 'Critical',
    'ManagedBy': 'CDK',
    'Application': 'PaymentProcessor'
  }
};

// 🔹 Primary Region Stack (us-east-1)
const primaryStack = new PrimaryStack(app, 'PaymentDR-Primary', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: 'us-east-1'
  },
  stackName: 'PaymentDR-Primary',
  description: 'Primary region stack for payment processing DR solution',
  config: sharedConfig
});

// 🔹 Secondary Region Stack (us-west-2)  
const secondaryStack = new SecondaryStack(app, 'PaymentDR-Secondary', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: 'us-west-2'
  },
  stackName: 'PaymentDR-Secondary',
  description: 'Secondary region stack for payment processing DR solution',
  config: sharedConfig,
  primaryVpcId: primaryStack.vpcId,
  primaryVpcCidr: primaryStack.vpcCidr,
  globalDatabaseId: primaryStack.globalDatabaseId,
  hostedZoneId: primaryStack.hostedZoneId,
  hostedZoneName: primaryStack.hostedZoneName,
  primaryLambdaUrl: primaryStack.lambdaUrl,
  primaryBucketArn: primaryStack.bucketArn
});

// Apply cross-stack dependency
secondaryStack.addDependency(primaryStack);

// 🔹 Apply Global Tags
Object.entries(sharedConfig.tags).forEach(([key, value]) => {
  cdk.Tags.of(app).add(key, value);
});

// 🔹 Stack Outputs Summary
app.synth();