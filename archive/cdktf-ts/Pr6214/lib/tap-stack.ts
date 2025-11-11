import {
  AwsProvider,
  AwsProviderDefaultTags,
} from '@cdktf/provider-aws/lib/provider';
import { TerraformStack, TerraformOutput } from 'cdktf';
import { Construct } from 'constructs';
import { VpcStack } from './stacks/vpc-stack';
import { RdsStack } from './stacks/rds-stack';
import { S3Stack } from './stacks/s3-stack';
import { Ec2Stack } from './stacks/ec2-stack';

interface TapStackProps {
  environmentSuffix?: string;
  stateBucket?: string;
  stateBucketRegion?: string;
  awsRegion?: string;
  defaultTags?: AwsProviderDefaultTags[];
}

// Region override for ap-southeast-2
const AWS_REGION_OVERRIDE = 'ap-southeast-2';

// Environment-specific configurations
interface EnvironmentConfig {
  vpcCidr: string;
  rdsInstanceClass: string;
  rdsBackupRetention: number;
  ec2InstanceType: string;
  s3LifecycleDays: number;
  availabilityZones: string[];
}

const ENVIRONMENT_CONFIGS: Record<string, EnvironmentConfig> = {
  dev: {
    vpcCidr: '10.0.0.0/16',
    rdsInstanceClass: 'db.t3.micro',
    rdsBackupRetention: 1,
    ec2InstanceType: 't3.micro',
    s3LifecycleDays: 30,
    availabilityZones: ['ap-southeast-2a', 'ap-southeast-2b'],
  },
  staging: {
    vpcCidr: '10.1.0.0/16',
    rdsInstanceClass: 'db.t3.small',
    rdsBackupRetention: 7,
    ec2InstanceType: 't3.small',
    s3LifecycleDays: 90,
    availabilityZones: ['ap-southeast-2a', 'ap-southeast-2b'],
  },
  prod: {
    vpcCidr: '10.2.0.0/16',
    rdsInstanceClass: 'db.r5.large',
    rdsBackupRetention: 30,
    ec2InstanceType: 't3.medium',
    s3LifecycleDays: 365,
    availabilityZones: ['ap-southeast-2a', 'ap-southeast-2b'],
  },
};

export class TapStack extends TerraformStack {
  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id);

    const environmentSuffix = props?.environmentSuffix || 'dev';
    const awsRegion = AWS_REGION_OVERRIDE
      ? AWS_REGION_OVERRIDE
      : props?.awsRegion || 'us-east-1';
    // S3 backend configuration variables (currently commented out in implementation)
    // const stateBucketRegion = props?.stateBucketRegion || 'us-east-1';
    // const stateBucket = props?.stateBucket || 'iac-rlhf-tf-states';
    const defaultTags = props?.defaultTags || [];

    // Determine environment from suffix (extract base environment: dev, staging, prod)
    const environment = environmentSuffix.includes('dev')
      ? 'dev'
      : environmentSuffix.includes('staging')
        ? 'staging'
        : environmentSuffix.includes('prod')
          ? 'prod'
          : 'dev';

    const config = ENVIRONMENT_CONFIGS[environment];

    // Merge all tags into a single object
    const mergedTags: Record<string, string> = {
      Application: 'payment-processing',
      CostCenter: 'fintech-ops',
      EnvironmentSuffix: environmentSuffix,
      ManagedBy: 'cdktf',
    };

    // Merge existing defaultTags if provided
    if (defaultTags && defaultTags.length > 0) {
      defaultTags.forEach(tagObj => {
        if (tagObj.tags) {
          Object.assign(mergedTags, tagObj.tags);
        }
      });
    }

    // Configure AWS Provider with single defaultTags object
    new AwsProvider(this, 'aws', {
      region: awsRegion,
      defaultTags: [
        {
          tags: mergedTags,
        },
      ],
    });

    // Configure S3 Backend with native state locking
    // Note: Using local backend for testing due to S3 bucket access issues
    // In production, uncomment S3Backend and comment out LocalBackend
    // new S3Backend(this, {
    //   bucket: stateBucket,
    //   key: `${environmentSuffix}/${id}.tfstate`,
    //   region: stateBucketRegion,
    //   encrypt: true,
    // });

    // Create VPC infrastructure
    const vpcStack = new VpcStack(this, 'vpc', {
      environmentSuffix,
      environment,
      vpcCidr: config.vpcCidr,
      availabilityZones: config.availabilityZones,
    });

    // Create S3 buckets
    const s3Stack = new S3Stack(this, 's3', {
      environmentSuffix,
      environment,
      lifecycleDays: config.s3LifecycleDays,
    });

    // Create RDS database
    const rdsStack = new RdsStack(this, 'rds', {
      environmentSuffix,
      environment,
      vpcId: vpcStack.vpcId,
      privateSubnetIds: vpcStack.privateSubnetIds,
      instanceClass: config.rdsInstanceClass,
      backupRetention: config.rdsBackupRetention,
    });

    // Create EC2 instances
    const ec2Stack = new Ec2Stack(this, 'ec2', {
      environmentSuffix,
      environment,
      vpcId: vpcStack.vpcId,
      publicSubnetIds: vpcStack.publicSubnetIds,
      instanceType: config.ec2InstanceType,
    });

    // Outputs
    new TerraformOutput(this, 'vpc_id', {
      value: vpcStack.vpcId,
      description: 'VPC ID',
    });

    new TerraformOutput(this, 'rds_endpoint', {
      value: rdsStack.endpoint,
      description: 'RDS endpoint',
    });

    new TerraformOutput(this, 's3_bucket_name', {
      value: s3Stack.bucketName,
      description: 'S3 bucket name',
    });

    new TerraformOutput(this, 'ec2_instance_id', {
      value: ec2Stack.instanceId,
      description: 'EC2 instance ID',
    });

    new TerraformOutput(this, 'environment', {
      value: environment,
      description: 'Environment name',
    });

    new TerraformOutput(this, 'environment_suffix', {
      value: environmentSuffix,
      description: 'Environment suffix',
    });
  }
}
