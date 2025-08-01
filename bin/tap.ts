#!/usr/bin/env node
import { App } from 'cdktf';
import { TapStack } from '../lib/tap-stack';
import * as fs from 'fs';
import * as path from 'path';

// Function to read AWS region from file
function readRegionFromFile(): string | null {
  try {
    const regionFilePath = path.join(__dirname, '..', 'lib', 'AWS_REGION');
    if (fs.existsSync(regionFilePath)) {
      return fs.readFileSync(regionFilePath, 'utf8').trim();
    }
  } catch (error) {
    console.warn('Could not read AWS_REGION file:', error);
  }
  return null;
}

const app = new App();

// Get environment variables from the environment or use defaults
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';
const stateBucket = process.env.TERRAFORM_STATE_BUCKET || 'iac-rlhf-tf-states';
const fileRegion = readRegionFromFile();
const stateBucketRegion =
  process.env.TERRAFORM_STATE_BUCKET_REGION || fileRegion || 'us-west-2';
const awsRegion = process.env.AWS_REGION || fileRegion || 'us-west-2';
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
