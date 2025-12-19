#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { Tags } from 'aws-cdk-lib';
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

// Deploy to primary region
const primaryStackName = `TapStack${environmentSuffix}`;
new TapStack(app, primaryStackName, {
  stackName: primaryStackName,
  environmentSuffix: environmentSuffix,
  domainName: process.env.DOMAIN_NAME,
  certificateArn: process.env.CERTIFICATE_ARN,
  alertEmail: process.env.ALERT_EMAIL || 'alerts@example.com',
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: 'us-east-2',
  },
  crossRegionReferences: true,
});

// Deploy to secondary regions
const secondaryRegions = ['us-west-2'];
for (const region of secondaryRegions) {
  const stackName = `TapStack${environmentSuffix}-${region}`;
  new TapStack(app, stackName, {
    stackName: stackName,
    environmentSuffix: environmentSuffix,
    domainName: process.env.DOMAIN_NAME,
    certificateArn: process.env.CERTIFICATE_ARN,
    alertEmail: process.env.ALERT_EMAIL || 'alerts@example.com',
    env: {
      account: process.env.CDK_DEFAULT_ACCOUNT,
      region: region,
    },
    crossRegionReferences: true,
  });
}
