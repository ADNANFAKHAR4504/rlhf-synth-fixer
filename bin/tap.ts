import * as cdk from 'aws-cdk-lib';
import { TapStack } from '../lib/tap-stack';

const app = new cdk.App();

// Stage (affects names/tags), default: 'dev'
const stage = (app.node.tryGetContext('stage') as string) || 'dev';

// ACM cert ARNs for HTTPS listeners (required to create 443 in each region)
// Pass via context: -c eastCertArn=arn:... -c westCertArn=arn:...
const eastCertArn = app.node.tryGetContext('eastCertArn') as string | undefined;
const westCertArn = app.node.tryGetContext('westCertArn') as string | undefined;

new TapStack(app, `Web-${stage}-Use1`, {
  env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: 'us-east-1' },
  stage,
  certificateArn: eastCertArn,
});

new TapStack(app, `Web-${stage}-Usw2`, {
  env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: 'us-west-2' },
  stage,
  certificateArn: westCertArn,
});
