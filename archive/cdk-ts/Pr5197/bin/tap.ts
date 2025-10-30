#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { Tags } from 'aws-cdk-lib';
import { TapStack } from '../lib/tap-stack';

const app = new cdk.App();

// Get environment suffix from context (set by CI/CD pipeline) or use 'dev' as default
const environmentSuffix = app.node.tryGetContext('environmentSuffix') || 'dev';
const stackName = `TapStack${environmentSuffix}`;
const repositoryName = process.env.REPOSITORY || 'unknown';
const commitAuthor = process.env.COMMIT_AUTHOR || 'unknown';

// Apply tags to all stacks in this app (optional - you can do this at stack level instead)
Tags.of(app).add('Environment', environmentSuffix);
Tags.of(app).add('Repository', repositoryName);
Tags.of(app).add('Author', commitAuthor);

// Current/default deployment account/region
const defaultAccount = process.env.CDK_DEFAULT_ACCOUNT;
const defaultRegion =
  process.env.CDK_DEFAULT_REGION || process.env.AWS_REGION || 'us-east-1';

// Read replicate regions from context or env; expect an array in context or CSV in env
const replicateRegionsFromContext = app.node.tryGetContext('replicateRegions');
const replicateRegionsEnv = process.env.REPLICATE_REGIONS;
const replicateRegions: string[] = Array.isArray(replicateRegionsFromContext)
  ? replicateRegionsFromContext
  : replicateRegionsEnv
    ? replicateRegionsEnv
        .split(',')
        .map(r => r.trim())
        .filter(Boolean)
    : [];

// Primary TapStack in the current/default region
new TapStack(app, stackName, {
  stackName: stackName, // This ensures CloudFormation stack name includes the suffix
  environmentSuffix: environmentSuffix, // Pass the suffix to the stack
  env: {
    account: defaultAccount,
    region: defaultRegion,
  },
});

// Create additional TapStack replicas for other regions if requested.
for (const region of replicateRegions) {
  if (!region || region === defaultRegion) continue;
  const regionalStackName = `${stackName}-${region}`;
  new TapStack(app, regionalStackName, {
    stackName: regionalStackName,
    environmentSuffix: environmentSuffix,
    env: { account: defaultAccount, region },
  });
}
