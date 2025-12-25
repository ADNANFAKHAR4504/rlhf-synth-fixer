#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { Tags } from 'aws-cdk-lib';
import { NetworkStack } from '../lib/network-stack';
// LocalStack: Use simplified webapp stack without AutoScaling/ELB
import { WebAppStack } from '../lib/webapp-stack-localstack';
import { TapStack } from '../lib/tap-stack';
// import { SimpleRoute53Stack } from '../lib/simple-route53-stack';

const app = new cdk.App();

// Get environment suffix from context (set by CI/CD pipeline) or use 'dev' as default
const environmentSuffix = app.node.tryGetContext('environmentSuffix') || 'dev';

const repositoryName = process.env.REPOSITORY || 'iac-test-automations';
const commitAuthor = process.env.COMMIT_AUTHOR || 'localstack-migration';
const account = process.env.CDK_DEFAULT_ACCOUNT || '000000000000';

// Apply tags to all stacks in this app
Tags.of(app).add('Environment', environmentSuffix);
Tags.of(app).add('Repository', repositoryName);
Tags.of(app).add('Author', commitAuthor);
Tags.of(app).add('LocalStackMigration', 'Pr921');

// Primary region (us-east-1) infrastructure
const primaryNetworkStack = new NetworkStack(
  app,
  `PrimaryNetworkStack${environmentSuffix}`,
  {
    stackName: `Primary-Network-${environmentSuffix}`,
    environmentSuffix,
    regionName: 'primary',
    env: {
      account,
      region: 'us-east-1',
    },
  }
);

const primaryWebAppStack = new WebAppStack(
  app,
  `PrimaryWebAppStack${environmentSuffix}`,
  {
    stackName: `Primary-WebApp-${environmentSuffix}`,
    environmentSuffix,
    vpc: primaryNetworkStack.vpc,
    regionName: 'primary',
    env: {
      account,
      region: 'us-east-1',
    },
  }
);

// LocalStack: Secondary region (us-west-2) infrastructure commented out for testing
// LocalStack Community runs in a single endpoint, multi-region deployment is complex
// Uncomment below for actual AWS deployment
/*
const secondaryNetworkStack = new NetworkStack(
  app,
  `SecondaryNetworkStack${environmentSuffix}`,
  {
    stackName: `Secondary-Network-${environmentSuffix}`,
    environmentSuffix,
    regionName: 'secondary',
    env: {
      account,
      region: 'us-west-2',
    },
  }
);

const secondaryWebAppStack = new WebAppStack(
  app,
  `SecondaryWebAppStack${environmentSuffix}`,
  {
    stackName: `Secondary-WebApp-${environmentSuffix}`,
    environmentSuffix,
    vpc: secondaryNetworkStack.vpc,
    regionName: 'secondary',
    env: {
      account,
      region: 'us-west-2',
    },
  }
);
*/

// Global Route 53 DNS management (deployed to us-east-1)
// Note: Route53 stack commented out for initial deployment to avoid cross-region token issues
// Deploy infrastructure first, then manually configure Route53 or use a separate stack
// new SimpleRoute53Stack(app, `Route53Stack${environmentSuffix}`, {
//   stackName: `Route53-${environmentSuffix}`,
//   environmentSuffix,
//   env: {
//     account,
//     region: 'us-east-1',
//   },
// });

// Set dependencies to ensure proper deployment order
primaryWebAppStack.addDependency(primaryNetworkStack);
// LocalStack: Secondary stack commented out
// secondaryWebAppStack.addDependency(secondaryNetworkStack);

// Create TapStack to aggregate outputs for deployment validation
// The deployment script looks for stacks with "TapStack" in their name
const tapStack = new TapStack(app, `TapStack${environmentSuffix}`, {
  stackName: `TapStack-${environmentSuffix}`,
  environmentSuffix,
  outputs: {
    PrimaryInstanceDns: primaryWebAppStack.instanceDnsName,
    DeploymentRegion: 'us-east-1',
    StackType: 'LocalStack-Compatible',
  },
  env: {
    account,
    region: 'us-east-1',
  },
});

// TapStack depends on WebAppStack to ensure outputs are available
tapStack.addDependency(primaryWebAppStack);
