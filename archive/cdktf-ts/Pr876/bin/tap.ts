import { App, TerraformOutput } from 'cdktf';
import { TapStack } from '../lib/tap-stack';

const app = new App();
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';
const crossAccountId = process.env.CROSS_ACCOUNT_ID; // Set in CI/CD

const repository = process.env.REPOSITORY || 'unknown';
const commitAuthor = process.env.COMMIT_AUTHOR || 'unknown';

const defaultTags = {
  Environment: environmentSuffix,
  Repository: repository,
  Author: commitAuthor,
};

// Correct regions as per requirements
const requiredRegions = ['us-east-1', 'eu-west-1', 'ap-southeast-2'];
const targetRegions =
  process.env.AWS_REGION && requiredRegions.includes(process.env.AWS_REGION)
    ? [process.env.AWS_REGION]
    : requiredRegions;

targetRegions.forEach(region => {
  const regionSuffix = region.replace(/-/g, '');
  const stackName = `tap-stack-${regionSuffix}`;

  const stack = new TapStack(app, stackName, {
    region,
    environmentSuffix,
    crossAccountId,
    tags: defaultTags,
  });

  new TerraformOutput(stack, 'VpcId', {
    value: stack.vpcId,
  });

  new TerraformOutput(stack, 'AlbDnsName', {
    value: stack.albDnsName,
  });

  new TerraformOutput(stack, 'RdsEndpoint', {
    value: stack.rdsEndpoint,
  });

  new TerraformOutput(stack, 'S3BucketName', {
    value: stack.s3BucketName,
  });
});

app.synth();
