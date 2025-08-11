// /**
//  * Pulumi application entry point for the TAP (Test Automation Platform) infrastructure.
//  *
//  * This module defines the core Pulumi stack and instantiates the TapStack with appropriate
//  * configuration based on the deployment environment. It handles environment-specific settings,
//  * tagging, and deployment configuration for AWS resources.
//  *
//  * The stack created by this module uses environment suffixes to distinguish between
//  * different deployment environments (development, staging, production, etc.).
//  */
// import * as pulumi from '@pulumi/pulumi';
// import { TapStack } from '../lib/tap-stack';

// // Initialize Pulumi configuration for the current stack.
// const config = new pulumi.Config();

// // Get the environment suffix from the Pulumi config, defaulting to 'dev'.
// // You can set this value using the command: `pulumi config set env <value>`
// const environmentSuffix = config.get('env') || 'dev';

// // Get metadata from environment variables for tagging purposes.
// // These are often injected by CI/CD systems.
// const repository = config.get('repository') || 'unknown';
// const commitAuthor = config.get('commitAuthor') || 'unknown';

// // Define a set of default tags to apply to all resources.
// // While not explicitly used in the TapStack instantiation here,
// // this is the standard place to define them. They would typically be passed
// // into the TapStack or configured on the AWS provider.
// const defaultTags = {
//   Environment: environmentSuffix,
//   Repository: repository,
//   Author: commitAuthor,
// };

// // Instantiate the main stack component for the infrastructure.
// // This encapsulates all the resources for the platform.
// new TapStack('pulumi-infra', {
//   tags: defaultTags,
// });

// // To use the stack outputs, you can export them.
// // For example, if TapStack had an output `bucketName`:
// // export const bucketName = stack.bucketName;

/**
 * TAP (Test Automation Platform) multi-region infrastructure deployment.
 *
 * Combines Pulumi-style configuration flexibility (environment, repository, author tags)
 * with CDKTF's ability to define multiple stacks in different AWS regions.
 *
 * Allows configuration via Pulumi config or environment variables for CI/CD pipelines.
 */

import { App } from 'cdktf';
import * as pulumi from '@pulumi/pulumi';
import { TapStack } from '../lib/tap-stack';

// Initialize Pulumi configuration
const config = new pulumi.Config();

// Environment name (default: dev)
const environmentSuffix = config.get('env') || process.env.ENVIRONMENT || 'dev';

// Metadata from Pulumi config or environment variables
const repository =
  config.get('repository') || process.env.REPOSITORY || 'unknown';
const commitAuthor =
  config.get('commitAuthor') || process.env.COMMIT_AUTHOR || 'unknown';

// Default tags to be applied to all stacks
const defaultTags = {
  Environment: environmentSuffix,
  Repository: repository,
  Author: commitAuthor,
};

const app = new App();

// List of AWS regions to deploy to
const regions = ['us-east-1', 'us-west-2'];

// Deploy a TapStack in each region
regions.forEach(region => {
  new TapStack(app, `tap-stack-${region}`, {
    region,
    environment: environmentSuffix,
    tags: defaultTags,
  });
});

app.synth();
