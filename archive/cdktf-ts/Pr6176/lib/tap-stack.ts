import { DataAwsCallerIdentity } from '@cdktf/provider-aws/lib/data-aws-caller-identity';
import {
  AwsProvider,
  AwsProviderDefaultTags,
} from '@cdktf/provider-aws/lib/provider';
import { S3Backend, TerraformStack } from 'cdktf';
import { Construct } from 'constructs';
import { EnvironmentStack } from './environment-stack';

interface TapStackProps {
  environmentSuffix?: string;
  stateBucket?: string;
  stateBucketRegion?: string;
  awsRegion?: string;
  defaultTags?: AwsProviderDefaultTags[];
}

export class TapStack extends TerraformStack {
  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id);

    const environmentSuffix = props?.environmentSuffix || 'dev';
    const awsRegion = props?.awsRegion || 'us-east-1';
    const stateBucketRegion = props?.stateBucketRegion || 'us-east-1';
    const stateBucket = props?.stateBucket || 'iac-rlhf-tf-states';
    const defaultTags = props?.defaultTags || [];

    // Configure AWS Provider
    new AwsProvider(this, 'aws', {
      region: awsRegion,
      defaultTags: defaultTags,
    });

    // Get current AWS account ID
    const currentAccount = new DataAwsCallerIdentity(this, 'current', {});

    // Get operations account ID from environment variable or use current account
    const operationsAccountId =
      process.env.OPERATIONS_ACCOUNT_ID || currentAccount.accountId;

    // Configure S3 Backend with state locking
    new S3Backend(this, {
      bucket: stateBucket,
      key: `${environmentSuffix}/${id}.tfstate`,
      region: stateBucketRegion,
      encrypt: true,
    });
    this.addOverride('terraform.backend.s3.use_lockfile', true);

    // Determine environment and CIDR based on environment suffix
    const envConfig = {
      dev: { cidrBlock: '10.0.0.0/16' },
      staging: { cidrBlock: '10.1.0.0/16' },
      prod: { cidrBlock: '10.2.0.0/16' },
    };

    const environment = environmentSuffix.includes('dev')
      ? 'dev'
      : environmentSuffix.includes('staging')
        ? 'staging'
        : 'prod';

    const config = envConfig[environment as keyof typeof envConfig];

    // Create environment stack
    new EnvironmentStack(this, 'environment', {
      environment: environment,
      environmentSuffix: environmentSuffix,
      cidrBlock: config.cidrBlock,
      operationsAccountId: operationsAccountId,
      awsRegion: awsRegion,
    });
  }
}
