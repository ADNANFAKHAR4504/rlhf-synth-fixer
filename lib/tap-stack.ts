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

const AWS_REGION_OVERRIDE = 'us-west-2'; // Change to fresh region

export class TapStack extends TerraformStack {
  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id);

    const environmentSuffix = props?.environmentSuffix || 'dev';
    const awsRegion = AWS_REGION_OVERRIDE
      ? AWS_REGION_OVERRIDE
      : props?.awsRegion || 'us-east-1';
    const stateBucketRegion = props?.stateBucketRegion || 'us-east-1';
    const stateBucket = props?.stateBucket || 'iac-rlhf-tf-states';
    const defaultTags = props?.defaultTags || [];

    // Configure AWS Provider
    new AwsProvider(this, 'aws', {
      region: awsRegion,
      defaultTags: defaultTags,
    });

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
      operationsAccountId: '123456789012',
    });
  }
}
