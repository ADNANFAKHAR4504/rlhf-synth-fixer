import * as cdk from 'aws-cdk-lib';
import { TapStack } from '../lib/tap-stack';

const app = new cdk.App();

const environmentSuffix = app.node.tryGetContext('environmentSuffix') || 'dev';
const stackName = `TapStack${environmentSuffix}`;

// Stage (affects names/tags), default: 'dev'
const stage = (app.node.tryGetContext('stage') as string) || 'dev';
const appName = (app.node.tryGetContext('appName') as string) ?? 'webapp';

new TapStack(app, `${stackName}-Use1`, {
  env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: 'us-east-1' },
  stage,
  appName,
});

new TapStack(app, `${stackName}-Usw2`, {
  env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: 'us-west-2' },
  stage,
  appName,
});
