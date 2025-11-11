#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { Tags } from 'aws-cdk-lib';
import { TapStack } from '../lib/tap-stack';

const app = new cdk.App();

// Get configuration from context or environment variables
const environmentSuffix =
  app.node.tryGetContext('environmentSuffix') ||
  process.env.ENVIRONMENT ||
  'dev';
const serviceName =
  app.node.tryGetContext('serviceName') ||
  process.env.SERVICE_NAME ||
  'financial-platform';

// Primary region is ALWAYS the current region (from CDK_DEFAULT_REGION or --region flag)
const primaryRegion = process.env.CDK_DEFAULT_REGION || 'us-east-1';
const secondaryRegion =
  app.node.tryGetContext('secondaryRegion') ||
  process.env.SECONDARY_REGION ||
  'us-west-2';

const notificationEmail =
  app.node.tryGetContext('notificationEmail') || process.env.NOTIFICATION_EMAIL;
const domainName =
  app.node.tryGetContext('domainName') || process.env.DOMAIN_NAME;
const hostedZoneId =
  app.node.tryGetContext('hostedZoneId') || process.env.HOSTED_ZONE_ID;
const deployBothRegions =
  app.node.tryGetContext('deployBothRegions') !== 'false'; // Default to true

const repositoryName = process.env.REPOSITORY || 'unknown';
const commitAuthor = process.env.COMMIT_AUTHOR || 'unknown';
const account = process.env.CDK_DEFAULT_ACCOUNT;

// Apply global tags to all stacks
Tags.of(app).add('Environment', environmentSuffix);
Tags.of(app).add('ServiceName', serviceName);
Tags.of(app).add('Repository', repositoryName);
Tags.of(app).add('Author', commitAuthor);
Tags.of(app).add('ManagedBy', 'CDK');

// ============================================================================
// PRIMARY REGION STACK
// ============================================================================

const primaryStackName = `TapStack-${environmentSuffix}-primary`;

const primaryStack = new TapStack(app, primaryStackName, {
  stackName: primaryStackName,
  description: `Multi-region DR stack for ${serviceName} - PRIMARY region (${environmentSuffix})`,
  environmentSuffix: environmentSuffix,
  serviceName: serviceName,
  primaryRegion: primaryRegion,
  secondaryRegion: secondaryRegion,
  notificationEmail: notificationEmail,
  domainName: domainName,
  hostedZoneId: hostedZoneId,
  isPrimaryRegion: true, // Mark as primary
  crossRegionReferences: true, // Enable cross-region references
  env: {
    account: account,
    region: primaryRegion,
  },
  terminationProtection: environmentSuffix === 'prod',
});

// ============================================================================
// SECONDARY REGION STACK (optional, for full multi-region deployment)
// ============================================================================

if (deployBothRegions) {
  const secondaryStackName = `TapStack-${environmentSuffix}-secondary`;

  const secondaryStack = new TapStack(app, secondaryStackName, {
    stackName: secondaryStackName,
    description: `Multi-region DR stack for ${serviceName} - SECONDARY region (${environmentSuffix})`,
    environmentSuffix: environmentSuffix,
    serviceName: serviceName,
    primaryRegion: secondaryRegion, // Secondary becomes the primary for its own stack
    secondaryRegion: primaryRegion, // Primary becomes the peer region
    notificationEmail: notificationEmail,
    domainName: domainName,
    hostedZoneId: hostedZoneId,
    isPrimaryRegion: false, // Mark as secondary
    peerVpcId: primaryStack.vpcId, // Reference primary VPC for peering
    crossRegionReferences: true, // Enable cross-region references
    env: {
      account: account,
      region: secondaryRegion,
    },
    terminationProtection: environmentSuffix === 'prod',
  });

  // Add dependency - deploy secondary after primary
  secondaryStack.addDependency(primaryStack);
}
