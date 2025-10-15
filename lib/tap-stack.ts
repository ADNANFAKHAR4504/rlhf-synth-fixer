import {
  AwsProvider,
  AwsProviderDefaultTags,
} from '@cdktf/provider-aws/lib/provider';
import { S3Backend, TerraformStack } from 'cdktf';
import { Construct } from 'constructs';
import { DatabaseStack } from './database-stack';
import { StorageStack } from './storage-stack';
import { MonitoringStack } from './monitoring-stack';
import { DisasterRecoveryStack } from './disaster-recovery-stack';

interface TapStackProps {
  environmentSuffix?: string;
  stateBucket?: string;
  stateBucketRegion?: string;
  awsRegion?: string;
  defaultTags?: AwsProviderDefaultTags;
}

const AWS_REGION_OVERRIDE = 'ap-southeast-1';
const SECONDARY_REGION = 'ap-southeast-2';

export class TapStack extends TerraformStack {
  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id);

    const environmentSuffix = props?.environmentSuffix || 'dev';
    const awsRegion = AWS_REGION_OVERRIDE
      ? AWS_REGION_OVERRIDE
      : props?.awsRegion || 'us-east-1';
    const stateBucketRegion = props?.stateBucketRegion || 'us-east-1';
    const stateBucket = props?.stateBucket || 'iac-rlhf-tf-states';
    const defaultTags = props?.defaultTags ? [props.defaultTags] : [];

    // Configure primary AWS Provider
    const primaryProvider = new AwsProvider(this, 'aws', {
      region: awsRegion,
      defaultTags: defaultTags,
    });

    // Configure secondary AWS Provider for DR region
    const secondaryProvider = new AwsProvider(this, 'aws-secondary', {
      region: SECONDARY_REGION,
      defaultTags: defaultTags,
      alias: 'secondary',
    });

    // Configure S3 Backend
    new S3Backend(this, {
      bucket: stateBucket,
      key: `${environmentSuffix}/${id}.tfstate`,
      region: stateBucketRegion,
      encrypt: true,
    });

    // Create storage infrastructure
    new StorageStack(this, 'storage', {
      environmentSuffix,
      primaryRegion: awsRegion,
      secondaryRegion: SECONDARY_REGION,
      primaryProvider,
      secondaryProvider,
    });

    // Create monitoring infrastructure
    const monitoring = new MonitoringStack(this, 'monitoring', {
      environmentSuffix,
      primaryProvider,
    });

    // Create database infrastructure
    const database = new DatabaseStack(this, 'database', {
      environmentSuffix,
      primaryRegion: awsRegion,
      secondaryRegion: SECONDARY_REGION,
      primaryProvider,
      secondaryProvider,
      snsTopicArn: monitoring.snsTopicArn,
    });

    // Create disaster recovery orchestration
    new DisasterRecoveryStack(this, 'disaster-recovery', {
      environmentSuffix,
      primaryRegion: awsRegion,
      secondaryRegion: SECONDARY_REGION,
      primaryProvider,
      secondaryProvider,
      primaryDatabaseId: database.primaryDatabaseId,
      replicaDatabaseId: database.replicaDatabaseId,
      snsTopicArn: monitoring.snsTopicArn,
    });
  }
}
