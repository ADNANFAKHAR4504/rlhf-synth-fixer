#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { PrimaryRegionStack } from '../lib/primary-region-stack';
import { SecondaryRegionStack } from '../lib/secondary-region-stack';
import { GlobalStack } from '../lib/global-stack';

const app = new cdk.App();

const environmentSuffix = app.node.tryGetContext('environmentSuffix') || 'dev';
const primaryRegion = 'us-east-1';
const secondaryRegion = 'us-east-2';

// Global resources (Route 53, IAM roles)
const globalStack = new GlobalStack(app, `GlobalStack-${environmentSuffix}`, {
  env: { region: 'us-east-1' },
  environmentSuffix,
  primaryRegion,
  secondaryRegion,
});

// Primary region stack
const primaryStack = new PrimaryRegionStack(
  app,
  `PrimaryRegionStack-${environmentSuffix}`,
  {
    env: { region: primaryRegion },
    environmentSuffix,
    region: primaryRegion,
    isPrimary: true,
  }
);

// Secondary region stack
const secondaryStack = new SecondaryRegionStack(
  app,
  `SecondaryRegionStack-${environmentSuffix}`,
  {
    env: { region: secondaryRegion },
    environmentSuffix,
    region: secondaryRegion,
    isPrimary: false,
    primaryRegion,
  }
);

// Dependencies
secondaryStack.addDependency(primaryStack);
globalStack.addDependency(primaryStack);
globalStack.addDependency(secondaryStack);

app.synth();
