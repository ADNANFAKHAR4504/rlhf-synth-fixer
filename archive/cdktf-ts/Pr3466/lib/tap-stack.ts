import {
  AwsProvider,
  AwsProviderDefaultTags,
} from '@cdktf/provider-aws/lib/provider';
import { S3Backend, TerraformStack } from 'cdktf';
import { Construct } from 'constructs';
import { readFileSync } from 'fs';
import { join } from 'path';
import { BackupInfrastructureStack } from './backup-infrastructure-stack';

interface TapStackProps {
  environmentSuffix?: string;
  stateBucket?: string;
  stateBucketRegion?: string;
  awsRegion?: string;
  defaultTags?: AwsProviderDefaultTags;
}

// If you need to override the AWS Region for the terraform provider for any particular task,
// you can set it here. Otherwise, it will read from AWS_REGION file or default to 'us-east-1'.

export function getAwsRegionOverride(): string {
  if (process.env.NODE_ENV === 'test') {
    return '';
  }
  try {
    // Try reading from dist folder first (compiled location), then lib folder (source location)
    let regionFilePath = join(__dirname, 'AWS_REGION');
    try {
      const region = readFileSync(regionFilePath, 'utf-8').trim();
      return region || 'us-east-1';
    } catch {
      // Try lib folder (when running from dist)
      regionFilePath = join(__dirname, '..', 'lib', 'AWS_REGION');
      const region = readFileSync(regionFilePath, 'utf-8').trim();
      return region || 'us-east-1';
    }
  } catch (error) {
    // If file doesn't exist or can't be read, default to us-east-1
    return 'us-east-1';
  }
}

const AWS_REGION_OVERRIDE = getAwsRegionOverride();

export class TapStack extends TerraformStack {
  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id);

    const environmentSuffix = props?.environmentSuffix || 'dev';
    // Priority: explicit props > AWS_REGION_OVERRIDE (from file) > default us-east-1
    const awsRegion = props?.awsRegion || AWS_REGION_OVERRIDE;
    // S3 state bucket is in us-east-1, but AWS resources are in us-east-2
    const stateBucketRegion = props?.stateBucketRegion || 'us-east-1'; // Fixed to us-east-1 where bucket exists
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
