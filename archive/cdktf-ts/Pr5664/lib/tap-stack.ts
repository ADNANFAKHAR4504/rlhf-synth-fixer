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

// AWS Region override for eu-south-1
const AWS_REGION_OVERRIDE = 'eu-south-1';

export class TapStack extends TerraformStack {
  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id);

    const environmentSuffix = props?.environmentSuffix || 'dev';
    const awsRegion = AWS_REGION_OVERRIDE;

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
    // NOTE: To resolve "AddressLimitExceeded" errors for EIPs:
    // - AWS limits 5 EIPs per account per region by default
    // - Use `terraform state rm` to clean up unused EIPs from previous deployments:
    //   terraform state rm 'aws_eip.vpc-stack_nat-eip-*'
    // - Or request a service quota increase from AWS Support for "Elastic IPs" in your region
    new VpcStack(this, 'vpc-stack', {
      environmentSuffix,
      awsRegion,
    });
  }
}
