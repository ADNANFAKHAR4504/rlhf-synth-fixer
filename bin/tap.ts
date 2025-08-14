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
const allRegions = ['us-east-1', 'us-west-2', 'us-east-2', 'ap-southeast-5'];

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
  new TerraformOutput(stack, `VpcId`, {
    value: stack.vpcId,
  });
  new TerraformOutput(stack, `AlbDnsName`, {
    value: stack.albDnsName,
  });
  new TerraformOutput(stack, `RdsEndpoint`, {
    value: stack.rdsEndpoint,
  });
});

// Synthesize
app.synth();
