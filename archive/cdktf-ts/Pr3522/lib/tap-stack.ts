import {
  AwsProvider,
  AwsProviderDefaultTags,
} from '@cdktf/provider-aws/lib/provider';
import { ArchiveProvider } from '@cdktf/provider-archive/lib/provider';
import { S3Backend, TerraformOutput, TerraformStack } from 'cdktf';
import { Construct } from 'constructs';
import * as fs from 'fs';
import * as path from 'path';
import { NetworkStack } from './network-stack';
import { ComputeStack } from './compute-stack';
import { DatabaseStack } from './database-stack';
import { ApiStack } from './api-stack';
import { MonitoringStack } from './monitoring-stack';

interface TapStackProps {
  environmentSuffix?: string;
  stateBucket?: string;
  stateBucketRegion?: string;
  awsRegion?: string;
  defaultTags?: AwsProviderDefaultTags;
}

// Function to read AWS region override from file if it exists
function getAwsRegionOverride(): string | undefined {
  try {
    const regionFilePath = path.join(__dirname, 'AWS_REGION');
    if (fs.existsSync(regionFilePath)) {
      return fs.readFileSync(regionFilePath, 'utf-8').trim();
    }
  } catch (error) {
    // Silently ignore if file doesn't exist or can't be read
  }
  return undefined;
}

export class TapStack extends TerraformStack {
  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id);

    const environmentSuffix = props?.environmentSuffix || 'dev';
    const regionOverride = getAwsRegionOverride();
    const awsRegion = regionOverride || props?.awsRegion || 'us-east-1';
    const stateBucketRegion = props?.stateBucketRegion || 'us-east-1';
    const stateBucket = props?.stateBucket || 'iac-rlhf-tf-states';
    const defaultTags = props?.defaultTags ? [props.defaultTags] : [];

    new AwsProvider(this, 'aws', {
      region: awsRegion,
      defaultTags: defaultTags,
    });

    new ArchiveProvider(this, 'archive', {});

    new S3Backend(this, {
      bucket: stateBucket,
      key: `${environmentSuffix}/${id}.tfstate`,
      region: stateBucketRegion,
      encrypt: true,
    });

    const networkStack = new NetworkStack(this, 'network', {
      vpcCidr: '172.32.0.0/16',
      region: awsRegion,
      environmentSuffix,
    });

    const databaseStack = new DatabaseStack(this, 'database', {
      vpc: networkStack.vpc,
      privateSubnets: networkStack.privateSubnets,
      region: awsRegion,
      environmentSuffix,
    });

    const computeStack = new ComputeStack(this, 'compute', {
      vpc: networkStack.vpc,
      publicSubnets: networkStack.publicSubnets,
      privateSubnets: networkStack.privateSubnets,
      database: databaseStack.dbInstance,
      cache: databaseStack.elasticacheServerless,
      region: awsRegion,
      environmentSuffix,
    });

    new ApiStack(this, 'api', {
      vpc: networkStack.vpc,
      alb: computeStack.alb,
      region: awsRegion,
      environmentSuffix,
    });

    const monitoringStack = new MonitoringStack(this, 'monitoring', {
      asg: computeStack.asg,
      alb: computeStack.alb,
      database: databaseStack.dbInstance,
      region: awsRegion,
      environmentSuffix,
    });

    // Outputs for integration tests
    new TerraformOutput(this, 'vpc-id', {
      value: networkStack.vpc.id,
      description: 'VPC ID',
    });

    new TerraformOutput(this, 'vpc-cidr', {
      value: networkStack.vpc.cidrBlock,
      description: 'VPC CIDR block',
    });

    new TerraformOutput(this, 'public-subnet-ids', {
      value: networkStack.publicSubnets.map(s => s.id),
      description: 'Public subnet IDs',
    });

    new TerraformOutput(this, 'private-subnet-ids', {
      value: networkStack.privateSubnets.map(s => s.id),
      description: 'Private subnet IDs',
    });

    new TerraformOutput(this, 'alb-dns-name', {
      value: computeStack.alb.dnsName,
      description: 'ALB DNS name',
    });

    new TerraformOutput(this, 'alb-arn', {
      value: computeStack.alb.arn,
      description: 'ALB ARN',
    });

    new TerraformOutput(this, 'asg-name', {
      value: computeStack.asg.name,
      description: 'Auto Scaling Group name',
    });

    new TerraformOutput(this, 'db-endpoint', {
      value: databaseStack.dbInstance.endpoint,
      description: 'RDS database endpoint',
    });

    new TerraformOutput(this, 'db-identifier', {
      value: databaseStack.dbInstance.identifier,
      description: 'RDS database identifier',
    });

    new TerraformOutput(this, 'cache-endpoint', {
      value: databaseStack.elasticacheServerless.endpoint,
      description: 'ElastiCache serverless endpoint',
    });

    new TerraformOutput(this, 'cache-name', {
      value: databaseStack.elasticacheServerless.name,
      description: 'ElastiCache serverless name',
    });

    new TerraformOutput(this, 's3-bucket-name', {
      value: databaseStack.historicalDataBucket.bucket,
      description: 'S3 bucket name for historical data',
    });

    new TerraformOutput(this, 'dashboard-name', {
      value: monitoringStack.dashboard.dashboardName,
      description: 'CloudWatch dashboard name',
    });
  }
}
