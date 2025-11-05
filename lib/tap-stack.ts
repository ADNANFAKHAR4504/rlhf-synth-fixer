import {
  AwsProvider,
  AwsProviderDefaultTags,
} from '@cdktf/provider-aws/lib/provider';
import { LocalBackend, TerraformStack } from 'cdktf';
import { Construct } from 'constructs';
import { VpcStack } from './vpc-stack';

interface TapStackProps {
  environmentSuffix?: string;
  stateBucket?: string;
  stateBucketRegion?: string;
  awsRegion?: string;
  defaultTags?: AwsProviderDefaultTags;
}

// AWS Region override for us-east-1
const AWS_REGION_OVERRIDE = 'us-east-1';

export class TapStack extends TerraformStack {
  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id);

    const environmentSuffix = props?.environmentSuffix || 'dev';
    const awsRegion = AWS_REGION_OVERRIDE;
    const stateBucketRegion = props?.stateBucketRegion || 'us-east-1';
    const stateBucket = props?.stateBucket || 'iac-rlhf-tf-states';

    // Configure AWS Provider - this expects AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY to be set in the environment
    new AwsProvider(this, 'aws', {
      region: awsRegion,
      defaultTags: [],
    });

    // Configure Local Backend for testing (S3 bucket not available)
    new LocalBackend(this, {
      path: `terraform.${environmentSuffix}.tfstate`,
    });

    // Create VPC infrastructure for payment processing application
    new VpcStack(this, 'vpc-stack', {
      environmentSuffix,
      awsRegion,
    });
  }
}
