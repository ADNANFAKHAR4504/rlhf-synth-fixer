import {
  AwsProvider,
  AwsProviderDefaultTags,
} from '@cdktf/provider-aws/lib/provider';
import { S3Backend, TerraformStack } from 'cdktf';
import { Construct } from 'constructs';
import { BackupInfrastructureStack } from './backup-infrastructure-stack';

interface TapStackProps {
  environmentSuffix?: string;
  stateBucket?: string;
  stateBucketRegion?: string;
  awsRegion?: string;
  defaultTags?: AwsProviderDefaultTags;
}

// If you need to override the AWS Region for the terraform provider for any particular task,
// you can set it here. Otherwise, it will use AWS_REGION environment variable or default to 'us-east-1'.

export function getAwsRegionOverride(): string {
  if (process.env.NODE_ENV === 'test') {
    return '';
  }
  // Force us-east-1 regardless of environment variable to ensure consistency
  return 'us-east-1';
}

const AWS_REGION_OVERRIDE = getAwsRegionOverride();

export class TapStack extends TerraformStack {
  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id);

    const environmentSuffix = props?.environmentSuffix || 'dev';
    // Force us-east-1 for consistency, use override function for testability
    const awsRegion = AWS_REGION_OVERRIDE || 'us-east-1';
    const stateBucketRegion = props?.stateBucketRegion || awsRegion; // Use same region for state bucket
    const stateBucket = props?.stateBucket || 'iac-rlhf-tf-states';
    const defaultTags = props?.defaultTags ? [props.defaultTags] : [];

    // Configure AWS Provider - this expects AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY to be set in the environment
    new AwsProvider(this, 'aws', {
      region: awsRegion,
      defaultTags: defaultTags,
    });

    // Configure S3 Backend with native state locking
    new S3Backend(this, {
      bucket: stateBucket,
      key: `${environmentSuffix}/${id}.tfstate`,
      region: stateBucketRegion,
      encrypt: true,
    });
    // S3 backend with default locking (no DynamoDB table required)

    // Add backup infrastructure stack
    new BackupInfrastructureStack(this, 'backup-infrastructure', {
      region: awsRegion,
      environmentSuffix: environmentSuffix,
    });
  }
}
