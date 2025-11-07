import {
  AwsProvider,
  AwsProviderDefaultTags,
} from '@cdktf/provider-aws/lib/provider';
import { LocalBackend, TerraformStack } from 'cdktf';
import { Construct } from 'constructs';
import { NetworkingStack } from './networking-stack';

interface TapStackProps {
  environmentSuffix?: string;
  stateBucket?: string;
  stateBucketRegion?: string;
  awsRegion?: string;
  defaultTags?: AwsProviderDefaultTags[];
  // Add this to make testing easier
  awsRegionOverride?: string;
}

// If you need to override the AWS Region for the terraform provider for any particular task,
// you can set it here. Otherwise, it will default to 'us-east-1'.
const AWS_REGION_OVERRIDE = process.env.AWS_REGION_OVERRIDE || '';

export class TapStack extends TerraformStack {
  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id);

    const environmentSuffix = props?.environmentSuffix || 'dev';

    // Modified to support testing - check props override first, then constant, then fallback
    const regionOverride = props?.awsRegionOverride || AWS_REGION_OVERRIDE;
    const awsRegion = regionOverride
      ? regionOverride
      : props?.awsRegion || 'us-east-1';
    const defaultTags = props?.defaultTags || [];

    // Configure AWS Provider - this expects AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY to be set in the environment
    new AwsProvider(this, 'aws', {
      region: awsRegion,
      defaultTags: defaultTags,
    });

    // Configure Local Backend for development
    new LocalBackend(this, {
      path: `terraform.${environmentSuffix}.tfstate`,
    });

    // Create networking infrastructure
    new NetworkingStack(this, 'networking', {
      environmentSuffix,
      region: awsRegion,
    });
  }
}
