#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { Tags } from 'aws-cdk-lib';
import * as fs from 'fs';
import * as path from 'path';
import 'source-map-support/register';
import { TapStack } from '../lib/tap-stack';

const app = new cdk.App();

// Get configuration from context or environment
const environment =
  app.node.tryGetContext('environment') || process.env.ENVIRONMENT || 'dev';

// Check for lib/AWS_REGION file override (single region deployment)
let regions: string[];
const awsRegionFilePath = path.join(__dirname, '../lib/AWS_REGION');
if (fs.existsSync(awsRegionFilePath)) {
  const singleRegion = fs.readFileSync(awsRegionFilePath, 'utf8').trim();
  regions = [singleRegion];
  console.log(
    `Using single region deployment from lib/AWS_REGION: ${singleRegion}`
  );
} else {
  regions =
    app.node.tryGetContext('regions') ||
    (process.env.REGIONS
      ? process.env.REGIONS.split(',')
      : ['us-east-2', 'us-east-1']);
  console.log(`Using multi-region deployment: ${regions.join(', ')}`);
}
const suffix =
  app.node.tryGetContext('suffix') ||
  process.env.SUFFIX ||
  Date.now().toString().slice(-6);
const ec2InstanceCountPerRegion = parseInt(
  app.node.tryGetContext('ec2InstanceCountPerRegion') ||
    process.env.EC2_COUNT ||
    '3'
);

// Environment suffix for unique naming (keep existing pattern)
const environmentSuffix =
  app.node.tryGetContext('environmentSuffix') || environment + suffix;
const repositoryName = process.env.REPOSITORY || 'unknown';
const commitAuthor = process.env.COMMIT_AUTHOR || 'unknown';

// Apply global tags
Tags.of(app).add('iac-rlhf-amazon', 'true');
Tags.of(app).add('Environment', environmentSuffix);
Tags.of(app).add('Repository', repositoryName);
Tags.of(app).add('Author', commitAuthor);
Tags.of(app).add('ManagedBy', 'CDK');

// Deploy stacks for each region
for (const region of regions) {
  const stackName = `TapStack${environmentSuffix}`;

  new TapStack(app, `${stackName}-${region}`, {
    stackName: stackName,
    environmentSuffix: environmentSuffix,
    environment,
    region,
    suffix,
    ec2InstanceCountPerRegion,
    crossRegionReferences: true,
    env: {
      account: process.env.CDK_DEFAULT_ACCOUNT,
      region: region,
    },
  });
}
