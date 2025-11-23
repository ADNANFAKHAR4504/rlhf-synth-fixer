#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { Tags } from 'aws-cdk-lib';
import { TapStack } from '../lib/tap-stack';
import { MigrationStack } from '../lib/migration-stack';
import { Route53Stack } from '../lib/route53-stack';

const app = new cdk.App();

// Get environment suffix from context
const environmentSuffix = app.node.tryGetContext('environmentSuffix') || 'dev';
const repositoryName = process.env.REPOSITORY || 'migration-repo';
const commitAuthor = process.env.COMMIT_AUTHOR || 'unknown';
const region = process.env.CDK_DEFAULT_REGION || 'ap-southeast-1';

// Environment configurations
const environments = {
  dev: {
    name: 'dev',
    vpcCidr: '10.0.0.0/16',
    migrationPhase: 'preparation' as const,
    alertEmail: 'devops-dev@example.com',
  },
  staging: {
    name: 'staging',
    vpcCidr: '10.1.0.0/16',
    migrationPhase: 'migration' as const,
    alertEmail: 'devops-staging@example.com',
  },
  prod: {
    name: 'prod',
    vpcCidr: '10.2.0.0/16',
    migrationPhase: 'cutover' as const,
    alertEmail: 'devops-prod@example.com',
  },
};

// Determine which environment to deploy based on suffix
const envKey = environmentSuffix.replace(
  /^(dev|staging|prod).*/,
  '$1'
) as keyof typeof environments;
const envConfig = environments[envKey] || environments.dev;

// Apply global tags
Tags.of(app).add('Environment', envConfig.name);
Tags.of(app).add('Repository', repositoryName);
Tags.of(app).add('Author', commitAuthor);
Tags.of(app).add('ManagedBy', 'CDK');

const envProps = {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: region,
  },
};

// Create main migration stack for the environment
const migrationStack = new MigrationStack(
  app,
  `MigrationStack-${environmentSuffix}`,
  {
    ...envProps,
    environmentName: envConfig.name,
    environmentSuffix: environmentSuffix,
    migrationPhase: envConfig.migrationPhase,
    vpcCidr: envConfig.vpcCidr,
    alertEmail: envConfig.alertEmail,
    stackName: `MigrationStack-${environmentSuffix}`,
  }
);

// Create TapStack for compatibility
new TapStack(app, `TapStack-${environmentSuffix}`, {
  ...envProps,
  environmentSuffix: environmentSuffix,
  stackName: `TapStack-${environmentSuffix}`,
});

// Optional: Create Route53 stack if domain is configured
const domainName = app.node.tryGetContext('domainName');
if (domainName) {
  new Route53Stack(app, `Route53Stack-${environmentSuffix}`, {
    ...envProps,
    domainName: domainName,
    environmentSuffix: environmentSuffix,
    prodLoadBalancer: migrationStack.loadBalancer,
    migrationPhase: envConfig.migrationPhase,
    stackName: `Route53Stack-${environmentSuffix}`,
  });
}

app.synth();
