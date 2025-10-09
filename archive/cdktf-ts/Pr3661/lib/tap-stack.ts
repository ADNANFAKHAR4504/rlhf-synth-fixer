import {
  AwsProvider,
  AwsProviderDefaultTags,
} from '@cdktf/provider-aws/lib/provider';
import { S3Backend, TerraformStack, TerraformOutput } from 'cdktf';
import { Construct } from 'constructs';

// ? Import your stacks here
import {
  VpcModule,
  IamModule,
  S3Module,
  Ec2Module,
  RdsModule,
  CloudTrailModule,
  ConfigModule,
  KmsModule,
} from './modules';
// import { MyStack } from './my-stack';

interface TapStackProps {
  environmentSuffix?: string;
  stateBucket?: string;
  stateBucketRegion?: string;
  awsRegion?: string;
  defaultTags?: AwsProviderDefaultTags;
}

// If you need to override the AWS Region for the terraform provider for any particular task,
// you can set it here. Otherwise, it will default to 'us-east-1'.

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
    // Using an escape hatch instead of S3Backend construct - CDKTF still does not support S3 state locking natively
    // ref - https://developer.hashicorp.com/terraform/cdktf/concepts/resources#escape-hatch
    this.addOverride('terraform.backend.s3.use_lockfile', true);

    // ? Add your stack instantiations here
    // Global environment tags
    const tags = {
      Environment: 'Production',
      Project: 'TAP',
      ManagedBy: 'CDKTF',
    };

    // Create KMS keys
    const mainKms = new KmsModule(this, 'main-kms', {
      description: 'Main KMS key for encryption',
      tags,
    });

    const rdsKms = new KmsModule(this, 'rds-kms', {
      description: 'KMS key for RDS encryption',
      tags,
    });

    // Create S3 buckets
    const s3 = new S3Module(this, 's3', {
      bucketName: 'tap-production-data-bucket',
      logBucketName: 'tap-production-logs-bucket',
      kmsKeyId: mainKms.key.id,
      tags,
    });

    // Create VPC infrastructure
    const vpc = new VpcModule(this, 'vpc', {
      vpcCidrBlock: '10.0.0.0/16',
      publicSubnetCidrs: ['10.0.1.0/24', '10.0.2.0/24'],
      privateSubnetCidrs: ['10.0.3.0/24', '10.0.4.0/24'],
      availabilityZones: [`${awsRegion}a`, `${awsRegion}b`],
      flowLogBucketArn: s3.logBucket.arn,
      tags,
    });

    // Create IAM roles and policies
    const iam = new IamModule(this, 'iam', {
      vpcId: vpc.vpcId,
      tags,
    });

    // Create EC2 instances with Auto Scaling
    new Ec2Module(this, 'ec2', {
      vpcId: vpc.vpcId,
      subnetIds: vpc.privateSubnetIds,
      securityGroupIds: [],
      instanceType: 't3.micro',
      iamInstanceProfileName: iam.ec2InstanceProfile.name,
      sshCidr: '10.0.0.0/24', // Replace with actual admin IP range
      minCapacity: 2,
      maxCapacity: 5,
      tags,
    });

    // Create RDS database
    const rds = new RdsModule(this, 'rds', {
      vpcId: vpc.vpcId,
      subnetIds: vpc.privateSubnetIds,
      securityGroupIds: [],
      instanceClass: 'db.t3.small',
      engine: 'mysql',
      dbName: 'productiondb',
      username: process.env.RDS_USERNAME || 'admin',
      password: process.env.RDS_PASSWORD || 'ChangeMe123!', // Use a secure password in production
      kmsKeyId: rdsKms.key.arn,
      tags,
    });

    // Enable CloudTrail for logging
    new CloudTrailModule(this, 'cloudtrail', {
      s3BucketName: s3.logBucket.bucket,
      kmsKeyId: mainKms.key.arn,
      tags,
    });

    // Enable AWS Config for compliance monitoring
    new ConfigModule(this, 'config', {
      s3BucketName: s3.logBucket.bucket,
      iamRoleArn: iam.configRole.arn,
      tags,
    });

    // Outputs
    new TerraformOutput(this, 'vpc_id', {
      value: vpc.vpcId,
      description: 'The ID of the VPC',
    });

    new TerraformOutput(this, 'public_subnet_ids', {
      value: vpc.publicSubnetIds,
      description: 'The IDs of the public subnets',
    });

    new TerraformOutput(this, 'private_subnet_ids', {
      value: vpc.privateSubnetIds,
      description: 'The IDs of the private subnets',
    });

    new TerraformOutput(this, 'main_bucket_name', {
      value: s3.mainBucket.bucket,
      description: 'The name of the main S3 bucket',
    });

    new TerraformOutput(this, 'log_bucket_name', {
      value: s3.logBucket.bucket,
      description: 'The name of the log S3 bucket',
    });

    new TerraformOutput(this, 'rds_instance_endpoint', {
      value: rds.dbInstance.endpoint,
      description: 'The connection endpoint for the RDS instance',
    });

    new TerraformOutput(this, 'main_kms_key_arn', {
      value: mainKms.key.arn,
      description: 'The ARN of the main KMS key',
    });

    new TerraformOutput(this, 'rds_kms_key_arn', {
      value: rdsKms.key.arn,
      description: 'The ARN of the RDS KMS key',
    });

    // Additional VPC outputs
    new TerraformOutput(this, 'nat_gateway_ids', {
      value: vpc.natGatewayIds,
      description: 'The IDs of the NAT gateways',
    });

    new TerraformOutput(this, 'internet_gateway_id', {
      value: vpc.internetGatewayId,
      description: 'The ID of the Internet Gateway',
    });

    new TerraformOutput(this, 'vpc_flow_log_id', {
      value: vpc.flowLogId,
      description: 'The ID of the VPC Flow Log',
    });

    // IAM outputs
    new TerraformOutput(this, 'ec2_role_arn', {
      value: iam.ec2Role.arn,
      description: 'The ARN of the EC2 IAM role',
    });

    new TerraformOutput(this, 'ec2_instance_profile_arn', {
      value: iam.ec2InstanceProfile.arn,
      description: 'The ARN of the EC2 instance profile',
    });

    new TerraformOutput(this, 'config_role_arn', {
      value: iam.configRole.arn,
      description: 'The ARN of the Config IAM role',
    });

    // RDS outputs
    new TerraformOutput(this, 'rds_security_group_id', {
      value: rds.dbInstance.vpcSecurityGroupIds,
      description: 'The security groups associated with the RDS instance',
    });

    new TerraformOutput(this, 'rds_subnet_group_name', {
      value: rds.dbInstance.dbSubnetGroupName,
      description: 'The DB subnet group name used by the RDS instance',
    });

    // Security information
    new TerraformOutput(this, 'vpc_cidr_block', {
      value: vpc.vpcId,
      description: 'The CIDR block of the VPC',
    });
    // ! Do NOT create resources directly in this stack.
    // ! Instead, create separate stacks for each resource type.
  }
}
