#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { TapStack } from './tap-stack';

const app = new cdk.App();

const tapStackId =
  process.env.CDK_STAGE_ID ??
  (app.node.tryGetContext('stageId') as string | undefined) ??
  'IaCNovaTapStack';

new TapStack(app, tapStackId, {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
  stackId:
    process.env.CDK_STACK_ID ??
    (app.node.tryGetContext('stackId') as string | undefined),
  stackDescription:
    process.env.CDK_STACK_DESCRIPTION ??
    'Email notification infrastructure synthesized via TapStack.',
  stringSuffix:
    process.env.STRING_SUFFIX ??
    (app.node.tryGetContext('stringSuffix') as string | undefined),
  environmentSuffix:
    process.env.ENVIRONMENT_SUFFIX ??
    (app.node.tryGetContext('environmentSuffix') as string | undefined),
});

app.synth();
