#!/usr/bin/env node
import { App } from 'cdktf';
import { TapStack } from '../lib/tap-stack';

const app = new App();

// Get environment variables from the environment or use defaults
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';
const stateBucket = process.env.TERRAFORM_STATE_BUCKET || 'iac-rlhf-tf-states';
// Region will be read from lib/AWS_REGION file
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
// Region will be read from lib/AWS_REGION file
new TapStack(app, stackName, {
  environmentSuffix: environmentSuffix,
  stateBucket: stateBucket,
  defaultTags: defaultTags,
});

// Synthesize the app to generate the Terraform configuration
app.synth();
