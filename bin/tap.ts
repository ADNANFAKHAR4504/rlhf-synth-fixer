#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { Tags } from 'aws-cdk-lib';
import * as fs from 'fs';
import * as path from 'path';
import { TapStack } from '../lib/tap-stack';

const app = new cdk.App();

// Get environment suffix from context (set by CI/CD pipeline) or use 'dev' as default
const environmentSuffix = app.node.tryGetContext('environmentSuffix') || 'dev';
const repositoryName = process.env.REPOSITORY || 'unknown';
const commitAuthor = process.env.COMMIT_AUTHOR || 'unknown';

// Apply tags to all stacks in this app
Tags.of(app).add('Environment', environmentSuffix);
Tags.of(app).add('Repository', repositoryName);
Tags.of(app).add('Author', commitAuthor);

// Read authoritative region from lib/AWS_REGION if present. This repo uses
// the file to pin the default deployment region (so existing deploys keep
// using the same region). If the file is present and non-empty we use it as
// the default region unless the user explicitly overrides via CLI/env or
// passes a forced multi-region flag.
let fileRegion: string | undefined;
try {
  const awsRegionPath = path.join(__dirname, '../lib/AWS_REGION');
  const raw = fs.readFileSync(awsRegionPath, 'utf8').trim();
  if (raw) {
    fileRegion = raw;
  }
} catch (e) {
  // file missing: that's fine — fall back to env/CLI/defaults below
  fileRegion = undefined;
}

// Multi-region is opt-in via context 'multiRegion'. To avoid accidental
// multi-region changes when `lib/AWS_REGION` is in use, require an explicit
// `forceMultiRegion` context to enable multi-region despite the pinned file.
const multiRegion = !!app.node.tryGetContext('multiRegion');
const forceMultiRegion = !!app.node.tryGetContext('forceMultiRegion');

// Determine effective default region precedence:
// 1) CLI/env (CDK_DEFAULT_REGION) if set
// 2) lib/AWS_REGION file (if present)
// 3) fallback to us-east-1
const cliRegion = process.env.CDK_DEFAULT_REGION;
const effectiveRegion = cliRegion || fileRegion || 'us-east-1';

// If multiRegion was requested but a pinned file exists, require forceMultiRegion
// to actually create multiple regional stacks. Otherwise create a single-stack
// in the pinned region to preserve the current deploy behavior.
if (multiRegion && (!fileRegion || forceMultiRegion)) {
  // primary region may be provided via context; otherwise use the effectiveRegion
  const primaryRegion =
    app.node.tryGetContext('primaryRegion') || effectiveRegion;
  const secondaryRegion =
    app.node.tryGetContext('secondaryRegion') || 'us-west-2';

  const primarySuffix = `${environmentSuffix}-${primaryRegion.replace(/[^a-z0-9]/gi, '')}`;
  const primaryName = `TapStack${primarySuffix}`;
  new TapStack(app, primaryName, {
    stackName: primaryName,
    environmentSuffix: primarySuffix,
    env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: primaryRegion },
  });

  const secondarySuffix = `${environmentSuffix}-${secondaryRegion.replace(/[^a-z0-9]/gi, '')}`;
  const secondaryName = `TapStack${secondarySuffix}`;
  new TapStack(app, secondaryName, {
    stackName: secondaryName,
    environmentSuffix: secondarySuffix,
    env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: secondaryRegion },
  });
} else {
  // Single-stack behavior: honor CLI/env region if present, otherwise the
  // fileRegion, otherwise fallback to effectiveRegion. This preserves the
  // repo's previous deployment region when `lib/AWS_REGION` is used.
  const targetRegion = cliRegion || fileRegion || 'us-east-1';
  const stackName = `TapStack${environmentSuffix}`;
  new TapStack(app, stackName, {
    stackName: stackName, // ensures CloudFormation stack name includes the suffix
    environmentSuffix: environmentSuffix,
    env: {
      account: process.env.CDK_DEFAULT_ACCOUNT,
      region: targetRegion,
    },
  });
}
