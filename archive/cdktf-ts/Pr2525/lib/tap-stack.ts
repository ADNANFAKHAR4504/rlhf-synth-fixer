import {
  AwsProvider,
  AwsProviderDefaultTags,
} from '@cdktf/provider-aws/lib/provider';
import { S3Backend, TerraformStack, TerraformOutput } from 'cdktf';
import { Construct } from 'constructs';
import { Id } from '@cdktf/provider-random/lib/id';
import { DataAwsCallerIdentity } from '@cdktf/provider-aws/lib/data-aws-caller-identity';
import { RandomProvider } from '@cdktf/provider-random/lib/provider';
import { IamRolePolicy } from '@cdktf/provider-aws/lib/iam-role-policy';

// Import your stacks here
import {
  VpcModule,
  SecurityModule,
  S3Module,
  Ec2Module,
  RdsModule,
  CloudTrailModule,
} from './modules';

interface TapStackProps {
  environmentSuffix?: string;
  stateBucket?: string;
  stateBucketRegion?: string;
  awsRegion?: string;
  defaultTags?: AwsProviderDefaultTags;
}

export class TapStack extends TerraformStack {
  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id);

    const environmentSuffix = props?.environmentSuffix || 'dev';

    // Region selection with us-west-2 as deployment region
    const awsRegion = props?.awsRegion || 'us-west-2';

    const stateBucketRegion = props?.stateBucketRegion || 'us-east-1';
    const stateBucket = props?.stateBucket || 'iac-rlhf-tf-states';
    const defaultTags = props?.defaultTags ? [props.defaultTags] : [];

    // Configure Random Provider for unique resource naming
    new RandomProvider(this, 'random');

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

    // Generate random suffix for unique resource naming
    const bucketSuffix = new Id(this, 'bucket-suffix', {
      byteLength: 4,
    });

    // Get current AWS account information
    const current = new DataAwsCallerIdentity(this, 'current');

    // Add your stack instantiations here
    // Do NOT create resources directly in this stack.
    // Instead, create separate stacks for each resource type.

    // Create VPC infrastructure
    const vpcModule = new VpcModule(this, 'vpc');

    // Create security groups and IAM roles
    const securityModule = new SecurityModule(
      this,
      'security',
      vpcModule.vpc.id
    );

    // Create encrypted S3 bucket (passing accountId as fourth parameter)
    const s3Module = new S3Module(
      this,
      's3',
      bucketSuffix.hex,
      current.accountId
    );

    // Create EC2 instance
    const ec2Module = new Ec2Module(
      this,
      'ec2',
      vpcModule.privateSubnet.id,
      securityModule.ec2SecurityGroup.id,
      securityModule.ec2InstanceProfile.name
    );

    // Create RDS database with Secrets Manager (passing accountId as fourth parameter)
    const rdsModule = new RdsModule(
      this,
      'rds',
      securityModule.rdsSecurityGroup.id,
      current.accountId
    );

    // Add IAM policy for EC2 to access Secrets Manager
    new IamRolePolicy(this, 'ec2-secrets-policy', {
      name: 'tap-ec2-secrets-policy',
      role: securityModule.ec2Role.id,
      policy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Action: [
              'secretsmanager:GetSecretValue',
              'secretsmanager:DescribeSecret',
            ],
            Resource: [
              `arn:aws:secretsmanager:${awsRegion}:${current.accountId}:secret:tap/rds/mysql/credentials*`,
            ],
          },
          {
            Effect: 'Allow',
            Action: ['kms:Decrypt', 'kms:GenerateDataKey*', 'kms:DescribeKey'],
            Resource: [rdsModule.kmsKey.arn],
          },
        ],
      }),
    });

    // Create CloudTrail module (passing accountId as fourth parameter)
    const cloudTrailModule = new CloudTrailModule(
      this,
      'cloudtrail',
      bucketSuffix.hex,
      current.accountId
    );

    // Terraform Outputs for reference
    new TerraformOutput(this, 'vpc-id', {
      value: vpcModule.vpc.id,
      description: 'VPC ID',
    });

    new TerraformOutput(this, 'public-subnet-id', {
      value: vpcModule.publicSubnet.id,
      description: 'Public subnet ID',
    });

    new TerraformOutput(this, 'private-subnet-id', {
      value: vpcModule.privateSubnet.id,
      description: 'Private subnet ID',
    });

    new TerraformOutput(this, 'isolated-subnet-id', {
      value: vpcModule.isolatedSubnet.id,
      description: 'Isolated subnet ID',
    });

    new TerraformOutput(this, 's3-bucket-name', {
      value: s3Module.bucket.bucket,
      description: 'S3 bucket name',
    });

    new TerraformOutput(this, 's3-bucket-arn', {
      value: s3Module.bucket.arn,
      description: 'S3 bucket ARN',
    });

    new TerraformOutput(this, 's3-kms-key-id', {
      value: s3Module.kmsKey.keyId,
      description: 'S3 KMS key ID',
    });

    new TerraformOutput(this, 'ec2-security-group-id', {
      value: securityModule.ec2SecurityGroup.id,
      description: 'EC2 Security Group ID',
    });

    new TerraformOutput(this, 'rds-security-group-id', {
      value: securityModule.rdsSecurityGroup.id,
      description: 'RDS Security Group ID',
    });

    new TerraformOutput(this, 'ec2-iam-role-arn', {
      value: securityModule.ec2Role.arn,
      description: 'EC2 IAM Role ARN',
    });

    new TerraformOutput(this, 'ec2-iam-role-name', {
      value: securityModule.ec2Role.name,
      description: 'EC2 IAM Role name',
    });

    new TerraformOutput(this, 'ec2-instance-id', {
      value: ec2Module.instance.id,
      description: 'EC2 instance ID',
    });

    new TerraformOutput(this, 'ec2-instance-private-ip', {
      value: ec2Module.instance.privateIp,
      description: 'EC2 instance private IP',
    });

    new TerraformOutput(this, 'rds-endpoint', {
      value: rdsModule.database.endpoint,
      description: 'RDS database endpoint',
    });

    new TerraformOutput(this, 'rds-kms-key-id', {
      value: rdsModule.kmsKey.keyId,
      description: 'RDS KMS key ID',
    });

    new TerraformOutput(this, 'db-secret-arn', {
      value: rdsModule.secretsManager.dbSecret.arn,
      description: 'Database credentials secret ARN',
    });

    new TerraformOutput(this, 'db-secret-name', {
      value: rdsModule.secretsManager.dbSecret.name,
      description: 'Database credentials secret name',
    });

    new TerraformOutput(this, 'cloudtrail-arn', {
      value: cloudTrailModule.trail.arn,
      description: 'CloudTrail ARN',
    });

    new TerraformOutput(this, 'cloudtrail-logs-bucket', {
      value: cloudTrailModule.logsBucket.bucket,
      description: 'CloudTrail logs bucket name',
    });

    new TerraformOutput(this, 'cloudtrail-kms-key-id', {
      value: cloudTrailModule.kmsKey.keyId,
      description: 'CloudTrail KMS key ID',
    });

    new TerraformOutput(this, 'aws-account-id', {
      value: current.accountId,
      description: 'Current AWS Account ID',
    });

    new TerraformOutput(this, 'nat-gateway-id', {
      value: vpcModule.natGateway.id,
      description: 'NAT Gateway ID',
    });

    new TerraformOutput(this, 'internet-gateway-id', {
      value: vpcModule.internetGateway.id,
      description: 'Internet Gateway ID',
    });
  }
}
