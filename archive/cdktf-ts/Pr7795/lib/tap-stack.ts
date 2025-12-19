import {
  AwsProvider,
  AwsProviderDefaultTags,
} from '@cdktf/provider-aws/lib/provider';
import { S3Backend, TerraformStack } from 'cdktf';
import { Construct } from 'constructs';
import { DevStack } from './dev-stack';
import { ProdStack } from './prod-stack';
import { StagingStack } from './staging-stack';
import { EnvironmentConfig } from './types';

interface TapStackProps {
  environmentSuffix?: string;
  stateBucket?: string;
  stateBucketRegion?: string;
  awsRegion?: string;
  defaultTags?: AwsProviderDefaultTags[];
}

const AWS_REGION_OVERRIDE = '';

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

    // Configure S3 Backend
    new S3Backend(this, {
      bucket: stateBucket,
      key: `${environmentSuffix}/${id}.tfstate`,
      region: stateBucketRegion,
      encrypt: true,
    });
    this.addOverride('terraform.backend.s3.use_lockfile', true);

    // Environment configurations
    const environments: Record<string, EnvironmentConfig> = {
      dev: {
        name: 'dev',
        cidrBlock: '10.1.0.0/16',
        accountId: '123456789012',
        instanceType: 'db.t3.medium',
        minCapacity: 1,
        maxCapacity: 3,
        costCenter: 'engineering-dev',
      },
      staging: {
        name: 'staging',
        cidrBlock: '10.2.0.0/16',
        accountId: '234567890123',
        instanceType: 'db.r5.large',
        minCapacity: 2,
        maxCapacity: 5,
        costCenter: 'engineering-staging',
        enableCrossEnvironmentReplication: true,
        // This would be set to the production cluster ARN
        replicationSourceArn:
          'arn:aws:rds:us-east-1:345678901234:cluster:aurora-cluster-prod',
      },
      prod: {
        name: 'prod',
        cidrBlock: '10.3.0.0/16',
        accountId: '345678901234',
        instanceType: 'db.r5.xlarge',
        minCapacity: 3,
        maxCapacity: 10,
        costCenter: 'engineering-prod',
        certificateArn:
          'arn:aws:acm:us-east-1:345678901234:certificate/example',
      },
    };

    // Create environment-specific stacks based on environmentSuffix
    let config = environments[environmentSuffix];

    // Accept PR-style environments like 'pr7795' or 'pr-7795' and map them to a dev-style config
    // while preserving a unique environment name for resources.
    if (!config) {
      // match prNNNN or pr-NNNN (case-insensitive)
      const match = /^pr-?(\d+)$/i.exec(environmentSuffix);
      if (match) {
        const numericPart = parseInt(match[1], 10);
        const devTemplate = environments.dev;
        // Compute a unique CIDR second octet for the PR using a modulo to keep in range 1-254
        const octet =
          Number.isFinite(numericPart) && numericPart > 0
            ? (numericPart % 250) + 1
            : 1;
        const cidrBlock = `10.${octet}.0.0/16`;

        config = {
          ...devTemplate,
          name: environmentSuffix,
          cidrBlock,
        } as EnvironmentConfig;
      } else {
        throw new Error(
          `Unknown environment: ${environmentSuffix}. Valid values: dev, staging, prod or prNNNN`
        );
      }
    }

    // Instantiate appropriate stack based on environment
    if (environmentSuffix === 'dev') {
      new DevStack(this, 'trading-app-dev', {
        config,
        stateBucket,
        stateBucketRegion,
        awsRegion,
      });
    } else if (environmentSuffix === 'staging') {
      new StagingStack(this, 'trading-app-staging', {
        config,
        stateBucket,
        stateBucketRegion,
        awsRegion,
      });
    } else if (environmentSuffix === 'prod') {
      new ProdStack(this, 'trading-app-prod', {
        config,
        stateBucket,
        stateBucketRegion,
        awsRegion,
      });
    }
  }
}
