#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { Tags } from 'aws-cdk-lib';
import { NetworkStack } from '../lib/network-stack';
import { WebAppStack } from '../lib/webapp-stack';
// import { SimpleRoute53Stack } from '../lib/simple-route53-stack';

const app = new cdk.App();

// Get environment suffix from context (set by CI/CD pipeline) or use 'dev' as default
const environmentSuffix = app.node.tryGetContext('environmentSuffix') || 'dev';

const repositoryName = process.env.REPOSITORY || 'unknown';
const commitAuthor = process.env.COMMIT_AUTHOR || 'unknown';
const account = process.env.CDK_DEFAULT_ACCOUNT;

// Apply tags to all stacks in this app
Tags.of(app).add('Environment', environmentSuffix);
Tags.of(app).add('Repository', repositoryName);
Tags.of(app).add('Author', commitAuthor);

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

// Secondary region (us-west-2) infrastructure
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
secondaryWebAppStack.addDependency(secondaryNetworkStack);
