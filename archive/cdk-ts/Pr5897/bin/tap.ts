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

// If multiRegion is requested, prefer explicit context/env overrides but
// provide sensible defaults so `--context multiRegion=true` alone will
// synth two stacks in the common pair of regions used by our org.
// Users/CI can still override with --context primaryRegion/secondaryRegion
// or via environment variables (CDK_DEFAULT_REGION/AWS_REGION/SECONDARY_REGION).
let resolvedPrimaryRegion = primaryRegion;
let resolvedSecondaryRegion = secondaryRegion;
if (multiRegion) {
  resolvedPrimaryRegion =
    resolvedPrimaryRegion ||
    process.env.CDK_DEFAULT_REGION ||
    process.env.AWS_REGION;
  resolvedSecondaryRegion =
    resolvedSecondaryRegion || process.env.SECONDARY_REGION;

  // Do not fall back to hard-coded regions here. Require explicit configuration
  // so CDK/CDK_CONTEXT controls region selection deterministically in CI/CLI.
  if (!resolvedPrimaryRegion || !resolvedSecondaryRegion) {
    throw new Error(
      'multiRegion mode requires both primaryRegion and secondaryRegion to be explicitly set.\n' +
        'Provide them via --context primaryRegion/secondaryRegion or environment variables:\n' +
        '  primary: CDK_DEFAULT_REGION or AWS_REGION\n' +
        '  secondary: SECONDARY_REGION\n' +
        'Example: npx cdk synth --context multiRegion=true --context primaryRegion=us-east-1 --context secondaryRegion=us-west-2'
    );
  }

  if (resolvedPrimaryRegion === resolvedSecondaryRegion) {
    throw new Error(
      `primaryRegion and secondaryRegion must be different when running in multi-region mode (both are ${resolvedPrimaryRegion}).`
    );
  }
}

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
    secondaryRegion: resolvedSecondaryRegion,
    baseEnvironmentSuffix: environmentSuffix,
    env: {
      account: process.env.CDK_DEFAULT_ACCOUNT,
      ...(resolvedPrimaryRegion ? { region: resolvedPrimaryRegion } : {}),
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
      ...(resolvedSecondaryRegion ? { region: resolvedSecondaryRegion } : {}),
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
