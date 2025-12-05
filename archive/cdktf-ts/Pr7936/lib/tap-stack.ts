import {
  AwsProvider,
  AwsProviderDefaultTags,
} from '@cdktf/provider-aws/lib/provider';
import { LocalBackend, TerraformStack } from 'cdktf';
import { Construct } from 'constructs';

import { EducationStack } from './education-stack';

interface TapStackProps {
  environmentSuffix?: string;
  stateBucket?: string;
  stateBucketRegion?: string;
  awsRegion?: string;
  defaultTags?: AwsProviderDefaultTags[];
}

// If you need to override the AWS Region for the terraform provider for any particular task,
// you can set it here. Otherwise, it will default to 'us-east-1'.

const AWS_REGION_OVERRIDE = 'us-east-1';

export class TapStack extends TerraformStack {
  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id);

    const environmentSuffix = props?.environmentSuffix || 'dev';
    const awsRegion = AWS_REGION_OVERRIDE
      ? AWS_REGION_OVERRIDE
      : props?.awsRegion || 'us-east-1';
    // Reserved for future S3 backend configuration
    // const stateBucketRegion = props?.stateBucketRegion || 'us-east-1';
    // const stateBucket = props?.stateBucket || 'iac-rlhf-tf-states';
    const defaultTags = props?.defaultTags || [];

    // Configure AWS Provider - this expects AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY to be set in the environment
    new AwsProvider(this, 'aws', {
      region: awsRegion,
      defaultTags: defaultTags,
    });

    // Configure Local Backend for development/testing
    // Note: In production, use S3Backend with proper access controls
    new LocalBackend(this, {
      path: `terraform.${environmentSuffix}.tfstate`,
    });

    new EducationStack(this, 'education', {
      environmentSuffix,
      region: awsRegion,
    });
  }
}
