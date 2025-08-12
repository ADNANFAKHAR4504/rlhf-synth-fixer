// /**
//  * CDKTF application entry point for the TAP (Test Automation Platform) infrastructure.
//  *
//  * This module defines the core CDKTF app and instantiates the TapStack with appropriate
//  * configuration based on the deployment environment. It handles environment-specific settings,
//  * tagging, and deployment configuration for AWS resources across multiple regions.
//  *
//  * The stack created by this module uses environment suffixes to distinguish between
//  * different deployment environments (development, staging, production, etc.).
//  */

// import { App, TerraformOutput } from 'cdktf';
// import { TapStack } from '../lib/tapstack';

// // Create CDKTF app
// const app = new App();

// // Get the environment suffix from environment variable, defaulting to 'dev'.
// // Environment variable takes precedence for CI/CD compatibility
// const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

// // Get metadata from environment variables for tagging purposes.
// // These are often injected by CI/CD systems.
// const repository = process.env.REPOSITORY || 'unknown';
// const commitAuthor = process.env.COMMIT_AUTHOR || 'unknown';

// // Define a set of default tags to apply to all resources.
// const defaultTags = {
//   Environment: environmentSuffix,
//   Repository: repository,
//   Author: commitAuthor,
// };

// // List of AWS regions to deploy to as per requirements
// const regions = ['us-east-1', 'us-west-2'];

// // Create infrastructure in each region
// const stacks: { [key: string]: TapStack } = {};

// regions.forEach(region => {
//   const regionSuffix = region.replace(/-/g, '');
//   const stackName = `tap-stack-${regionSuffix}`;

//   // Instantiate the main stack component for each region
//   const stack = new TapStack(app, stackName, {
//     region: region,
//     environmentSuffix: environmentSuffix,
//     tags: defaultTags,
//   });

//   stacks[region] = stack;

//   // Export region-specific outputs
//   new TerraformOutput(stack, `${region}VpcId`, {
//     value: stack.vpcId,
//     description: `VPC ID in ${region}`,
//   });

//   new TerraformOutput(stack, `${region}AlbDnsName`, {
//     value: stack.albDnsName,
//     description: `ALB DNS name in ${region}`,
//   });

//   new TerraformOutput(stack, `${region}RdsEndpoint`, {
//     value: stack.rdsEndpoint,
//     description: `RDS endpoint in ${region}`,
//   });
// });

// // Synthesize the app
// app.synth();

import { App, TerraformOutput } from 'cdktf';
import { TapStack } from '../lib/tap-stack';

// Create CDKTF app
const app = new App();

// Environment suffix (default: 'dev')
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

// Metadata tags (from env vars or defaults)
const repository = process.env.REPOSITORY || 'unknown';
const commitAuthor = process.env.COMMIT_AUTHOR || 'unknown';

const defaultTags = {
  Environment: environmentSuffix,
  Repository: repository,
  Author: commitAuthor,
};

// All possible regions for local/multi-region use
const allRegions = ['us-east-1', 'us-west-2', 'us-east-2'];

// Determine target regions
// In CI/CD, AWS_REGION is usually set → deploy only that region
// Locally, if AWS_REGION not set → deploy to all regions
const targetRegions =
  process.env.AWS_REGION && allRegions.includes(process.env.AWS_REGION)
    ? [process.env.AWS_REGION]
    : allRegions;

// Create stacks for each target region
targetRegions.forEach(region => {
  const regionSuffix = region.replace(/-/g, '');
  const stackName = `tap-stack-${regionSuffix}`;

  const stack = new TapStack(app, stackName, {
    region,
    environmentSuffix,
    tags: defaultTags,
  });

  // Outputs
  new TerraformOutput(stack, `${region}VpcId`, {
    value: stack.vpcId,
    description: `VPC ID in ${region}`,
  });

  new TerraformOutput(stack, `${region}AlbDnsName`, {
    value: stack.albDnsName,
    description: `ALB DNS name in ${region}`,
  });

  new TerraformOutput(stack, `${region}RdsEndpoint`, {
    value: stack.rdsEndpoint,
    description: `RDS endpoint in ${region}`,
  });
});

// Synthesize
app.synth();
