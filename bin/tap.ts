#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { Tags } from 'aws-cdk-lib';
import { TapStack } from '../lib/tap-stack';

const app = new cdk.App();

// Get environment suffix from context (set by CI/CD pipeline) or use 'dev' as default
const environmentSuffix = app.node.tryGetContext('environmentSuffix') || 'dev';
const repositoryName = process.env.REPOSITORY || 'unknown';
const commitAuthor = process.env.COMMIT_AUTHOR || 'unknown';

// Multi-region control: set --context multiRegion=true to create a primary
// and a secondary stack. When multiRegion is not set we create a single
// stack and honor CDK_DEFAULT_REGION / AWS_REGION as an explicit override.
const multiRegionContext = app.node.tryGetContext('multiRegion');
const multiRegion =
  multiRegionContext === true || multiRegionContext === 'true';

// Prefer explicit context or environment-provided regions. Do NOT fall
// back to hard-coded region literals so the CLI/CI can control region
// selection via CDK_DEFAULT_REGION or CDK context without surprises.
const primaryRegion =
  app.node.tryGetContext('primaryRegion') ||
  process.env.CDK_DEFAULT_REGION ||
  process.env.AWS_REGION ||
  undefined;
const secondaryRegion =
  app.node.tryGetContext('secondaryRegion') ||
  process.env.SECONDARY_REGION ||
  undefined;

// Apply tags to all stacks in this app (optional - you can do this at stack level instead)
Tags.of(app).add('Environment', environmentSuffix);
Tags.of(app).add('Repository', repositoryName);
Tags.of(app).add('Author', commitAuthor);

if (multiRegion) {
  const primaryStackName = `TapStack${environmentSuffix}-primary`;
  const secondaryStackName = `TapStack${environmentSuffix}-secondary`;

  // Primary stack
  new TapStack(app, primaryStackName, {
    stackName: primaryStackName,
    environmentSuffix,
    // mark this top-level stack as primary so nested stacks can create
    // global resources (HostedZone, health checks, primary DNS records).
    isPrimary: true,
    // forward secondaryRegion so nested stack can configure replication if enabled
    secondaryRegion,
    baseEnvironmentSuffix: environmentSuffix,
    env: {
      account: process.env.CDK_DEFAULT_ACCOUNT,
      ...(primaryRegion ? { region: primaryRegion } : {}),
    },
  });

  // Secondary stack - creates destination resources (S3 bucket) in the other region
  new TapStack(app, secondaryStackName, {
    stackName: secondaryStackName,
    environmentSuffix,
    // secondary stack should not create global DNS resources to avoid
    // duplicate HostedZone creation. It will be treated as a secondary failover target.
    isPrimary: false,
    baseEnvironmentSuffix: environmentSuffix,
    env: {
      account: process.env.CDK_DEFAULT_ACCOUNT,
      ...(secondaryRegion ? { region: secondaryRegion } : {}),
    },
  });
} else {
  // Single-region behavior: respect CDK_DEFAULT_REGION/AWS_REGION as an explicit override
  const stackName = `TapStack${environmentSuffix}`;
  new TapStack(app, stackName, {
    stackName,
    environmentSuffix,
    baseEnvironmentSuffix: environmentSuffix,
    env: {
      account: process.env.CDK_DEFAULT_ACCOUNT,
      ...(process.env.CDK_DEFAULT_REGION || process.env.AWS_REGION
        ? { region: process.env.CDK_DEFAULT_REGION || process.env.AWS_REGION }
        : {}),
    },
  });
}
