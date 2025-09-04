#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { Tags } from 'aws-cdk-lib';
import { TapStack } from '../lib/tap-stack';

// Try CDKTF mode first, fall back to CDK if CDKTF not available
let isCdktfMode = false;
try {
  require('cdktf');
  isCdktfMode = true;
} catch {
  isCdktfMode = false;
}

if (isCdktfMode) {
  // CDKTF mode - create minimal Terraform stack
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { App, TerraformStack } = require('cdktf');

  class PlaceholderTerraformStack extends TerraformStack {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    constructor(scope: any, id: string) {
      super(scope, id);
      // Empty placeholder for CDKTF synthesis
    }
  }

  const cdktfApp = new App();
  const envSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';
  new PlaceholderTerraformStack(
    cdktfApp,
    `PlaceholderTerraformStack${envSuffix}`
  );
  cdktfApp.synth();
} else {
  // CDK mode - normal AWS CDK app
  const app = new cdk.App();

  // Get environment suffix from context (set by CI/CD pipeline) or use 'dev' as default
  const environmentSuffix =
    app.node.tryGetContext('environmentSuffix') || 'dev';
  const stackName = `TapStack${environmentSuffix}`;

  const repositoryName = process.env.REPOSITORY || 'unknown';
  const commitAuthor = process.env.COMMIT_AUTHOR || 'unknown';

  // Apply tags to all stacks in this app (optional - you can do this at stack level instead)
  Tags.of(app).add('Environment', environmentSuffix);
  Tags.of(app).add('Repository', repositoryName);
  Tags.of(app).add('Author', commitAuthor);

  new TapStack(app, stackName, {
    stackName: stackName, // This ensures CloudFormation stack name includes the suffix
    environmentSuffix: environmentSuffix, // Pass the suffix to the stack
    env: {
      account: process.env.CDK_DEFAULT_ACCOUNT,
      region: process.env.CDK_DEFAULT_REGION || 'us-west-2',
    },
  });
}
