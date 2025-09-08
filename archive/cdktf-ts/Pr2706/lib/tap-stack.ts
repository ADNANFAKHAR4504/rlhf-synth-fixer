import {
  AwsProvider,
  AwsProviderDefaultTags,
} from '@cdktf/provider-aws/lib/provider';
import { S3Backend, TerraformStack, TerraformOutput } from 'cdktf';
import { Construct } from 'constructs';
import { RandomProvider } from '@cdktf/provider-random/lib/provider';

// Import your stacks here
import {
  SecurityModule,
  VpcModule,
  ComputeModule,
  DatabaseModule,
  MonitoringModule,
  ComplianceModule,
} from './modules';

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

    // Configure Random Provider for bucket suffix
    new RandomProvider(this, 'random', {});

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

    // Add your stack instantiations here
    // Do NOT create resources directly in this stack.
    // Instead, create separate stacks for each resource type.

    // Security Module - Creates KMS keys, IAM roles, and log bucket
    const securityModule = new SecurityModule(this, 'security');

    // VPC Module - Creates VPC, subnets, security groups, and networking components
    const vpcModule = new VpcModule(this, 'vpc', {
      kmsKey: securityModule.dataKmsKey, // ✅ pass full key object
    });

    // Compute Module - Creates ALB, ASG, Launch Template, and EC2 instances
    const computeModule = new ComputeModule(this, 'compute', {
      vpcId: vpcModule.vpcId,
      publicSubnetIds: vpcModule.publicSubnetIds,
      privateSubnetIds: vpcModule.privateSubnetIds,
      albSecurityGroupId: vpcModule.albSecurityGroupId,
      appSecurityGroupId: vpcModule.appSecurityGroupId,
      kmsKey: securityModule.dataKmsKey, // ✅ pass full key object
      adminRoleArn: securityModule.adminRole.arn,
      logBucketName: securityModule.logBucket.bucket,
    });

    // Database Module - Creates RDS and Redshift instances
    const databaseModule = new DatabaseModule(this, 'database', {
      vpcId: vpcModule.vpcId,
      privateSubnetIds: vpcModule.privateSubnetIds,
      dbSecurityGroupId: vpcModule.dbSecurityGroupId,
      redshiftSecurityGroupId: vpcModule.redshiftSecurityGroupId,
      kmsKey: securityModule.dataKmsKey, // ✅ pass full key object
      logBucketId: securityModule.logBucket.id,
    });

    // Monitoring Module - Creates CloudWatch alarms and SNS topics
    new MonitoringModule(this, 'monitoring', {
      albArn: computeModule.albArn,
      asgName: computeModule.asgName,
      kmsKey: securityModule.dataKmsKey, // ✅ pass full key object
    });

    // Compliance Module - Creates AWS Config resources
    new ComplianceModule(this, 'compliance', {
      logBucketName: securityModule.logBucket.bucket,
      kmsKey: securityModule.dataKmsKey, // ✅ pass full key object
    });

    // Terraform Outputs for reference
    new TerraformOutput(this, 'vpc-id', {
      value: vpcModule.vpcId,
      description: 'VPC ID',
    });

    new TerraformOutput(this, 'public-subnet-ids', {
      value: JSON.stringify(vpcModule.publicSubnetIds),
      description: 'Public subnet IDs',
    });

    new TerraformOutput(this, 'private-subnet-ids', {
      value: JSON.stringify(vpcModule.privateSubnetIds),
      description: 'Private subnet IDs',
    });

    new TerraformOutput(this, 's3-bucket-name', {
      value: securityModule.logBucket.bucket,
      description: 'S3 log bucket name',
    });

    new TerraformOutput(this, 'admin-role-arn', {
      value: securityModule.adminRole.arn,
      description: 'Admin role ARN',
    });

    new TerraformOutput(this, 'alb-security-group-id', {
      value: vpcModule.albSecurityGroupId,
      description: 'ALB Security Group ID',
    });

    new TerraformOutput(this, 'app-security-group-id', {
      value: vpcModule.appSecurityGroupId,
      description: 'Application Security Group ID',
    });

    new TerraformOutput(this, 'db-security-group-id', {
      value: vpcModule.dbSecurityGroupId,
      description: 'Database Security Group ID',
    });

    new TerraformOutput(this, 'redshift-security-group-id', {
      value: vpcModule.redshiftSecurityGroupId,
      description: 'Redshift Security Group ID',
    });

    new TerraformOutput(this, 'alb-arn', {
      value: computeModule.albArn,
      description: 'Application Load Balancer ARN',
    });

    new TerraformOutput(this, 'asg-name', {
      value: computeModule.asgName,
      description: 'Auto Scaling Group name',
    });

    new TerraformOutput(this, 'rds-endpoint', {
      value: databaseModule.rdsEndpoint,
      description: 'RDS database endpoint',
    });

    new TerraformOutput(this, 'redshift-endpoint', {
      value: databaseModule.redshiftEndpoint,
      description: 'Redshift cluster endpoint',
    });

    new TerraformOutput(this, 'kms-key-id', {
      value: securityModule.dataKmsKey.keyId,
      description: 'KMS key ID for encryption',
    });

    new TerraformOutput(this, 'kms-key-arn', {
      value: securityModule.dataKmsKey.arn,
      description: 'KMS key ARN for encryption',
    });
  }
}
