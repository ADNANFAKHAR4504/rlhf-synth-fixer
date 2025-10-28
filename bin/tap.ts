#!/usr/bin/env node
import { App } from 'cdktf';
import { TapStack } from '../lib/tap-stack';
import * as fs from 'fs';
import * as path from 'path';

const app = new App();

// Get environment variables from the environment or use defaults
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';
const stateBucket = process.env.TERRAFORM_STATE_BUCKET || 'iac-rlhf-tf-states';
const stateBucketRegion =
  process.env.TERRAFORM_STATE_BUCKET_REGION || 'us-east-1';

// Read AWS_REGION from file if it exists and no env var is set, otherwise use default
let awsRegion = process.env.AWS_REGION;
if (!awsRegion) {
  try {
    const regionPath = path.join(process.cwd(), 'lib', 'AWS_REGION');
    if (fs.existsSync(regionPath)) {
      awsRegion = fs.readFileSync(regionPath, 'utf8').trim();
    } else {
      awsRegion = 'us-east-1';
    }
  } catch (error) {
    awsRegion = 'us-east-1';
  }
}
const repositoryName = process.env.REPOSITORY || 'unknown';
const commitAuthor = process.env.COMMIT_AUTHOR || 'unknown';

// Calculate the stack name
const stackName = `TapStack${environmentSuffix}`;

// defautlTags is structured in adherence to the AwsProviderDefaultTags interface
const defaultTags = {
  tags: {
    Environment: environmentSuffix,
    Repository: repositoryName,
    CommitAuthor: commitAuthor,
  },
};

// Create the TapStack with the calculated properties
new TapStack(app, stackName, {
  environmentSuffix: environmentSuffix,
  stateBucket: stateBucket,
  stateBucketRegion: stateBucketRegion,
  awsRegion: awsRegion,
  defaultTags: defaultTags,
});

// Synthesize the app to generate the Terraform configuration
app.synth();
