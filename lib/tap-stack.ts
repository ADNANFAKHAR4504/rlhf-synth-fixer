import {
  AwsProvider,
  AwsProviderDefaultTags,
} from '@cdktf/provider-aws/lib/provider';
import {
  S3Backend,
  TerraformStack,
  TerraformVariable,
  TerraformOutput,
} from 'cdktf';
import { Construct } from 'constructs';

// ? Import your stacks here
import { DataAwsSecretsmanagerSecretVersion } from '@cdktf/provider-aws/lib/data-aws-secretsmanager-secret-version';
import {
  VpcModule,
  SecurityGroupModule,
  S3Module,
  IAMModule,
  EC2Module,
  RDSModule,
  CloudWatchLogsModule,
} from './modules';
import { Fn } from 'cdktf';
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
    // Project identification variables
    const projectName = new TerraformVariable(this, 'project_name', {
      type: 'string',
      description: 'Name of the project for resource tagging',
      default: 'tap-infrastructure',
    });

    const environment = new TerraformVariable(this, 'environment', {
      type: 'string',
      description: 'Environment name (dev, staging, production)',
      default: 'dev',
    });

    // Network configuration variables
    const vpcCidr = new TerraformVariable(this, 'vpc_cidr', {
      type: 'string',
      description: 'CIDR block for the VPC',
      default: '10.0.0.0/16',
    });

    const allowedSshCidrs = new TerraformVariable(this, 'allowed_ssh_cidrs', {
      type: 'list(string)',
      description: 'List of CIDR blocks allowed to SSH to EC2 instances',
      default: ['152.59.56.198/32'], // Replace with your IP or CIDR block
    });

    const firstCidr = Fn.element(allowedSshCidrs.listValue, 0);

    // EC2 configuration variables
    const ec2InstanceType = new TerraformVariable(this, 'ec2_instance_type', {
      type: 'string',
      description: 'EC2 instance type',
      default: 't3.medium',
    });

    const keyPairName = new TerraformVariable(this, 'key_pair_name', {
      type: 'string',
      description: 'Name of the EC2 Key Pair for SSH access',
      default: 'MyKeyPair', // Replace with your key pair name
    });

    // S3 configuration variables
    const s3BucketName = new TerraformVariable(this, 's3_bucket_name', {
      type: 'string',
      description: 'Name of the S3 bucket (must be globally unique)',
      default: 'tap-infrastructure-bucket-12345',
    });

    // RDS configuration variables
    const rdsInstanceClass = new TerraformVariable(this, 'rds_instance_class', {
      type: 'string',
      description: 'RDS instance class',
      default: 'db.t3.medium',
    });

    const rdsAllocatedStorage = new TerraformVariable(
      this,
      'rds_allocated_storage',
      {
        type: 'number',
        description: 'RDS allocated storage in GB',
        default: 20,
      }
    );

    const rdsDbName = new TerraformVariable(this, 'rds_db_name', {
      type: 'string',
      description: 'RDS database name',
      default: 'tapdb',
    });

    const rdsUsername = new TerraformVariable(this, 'rds_username', {
      type: 'string',
      description: 'RDS master username',
      default: 'admin',
    });

    const dbPasswordSecret = new DataAwsSecretsmanagerSecretVersion(
      this,
      'db-password-secret',
      {
        secretId: 'my-db-password',
      }
    );

    // CloudWatch configuration variables
    const logRetentionDays = new TerraformVariable(this, 'log_retention_days', {
      type: 'number',
      description: 'CloudWatch Logs retention period in days',
      default: 14,
    });

    // =============================================================================
    // INFRASTRUCTURE MODULES INSTANTIATION
    // =============================================================================

    // 1. Create VPC with public and private subnets
    const vpc = new VpcModule(this, 'vpc', {
      cidrBlock: vpcCidr.stringValue,
      projectName: projectName.stringValue,
      environment: environment.stringValue,
    });

    // 2. Create security groups for EC2 and RDS
    const securityGroups = new SecurityGroupModule(this, 'security-groups', {
      vpcId: vpc.vpc.id,
      allowedSshCidrs: [firstCidr],
      projectName: projectName.stringValue,
      environment: environment.stringValue,
    });

    // 3. Create IAM roles and instance profiles
    const iam = new IAMModule(this, 'iam', {
      projectName: projectName.stringValue,
      environment: environment.stringValue,
    });

    // 4. Create CloudWatch Log Group for EC2 monitoring
    const cloudWatchLogs = new CloudWatchLogsModule(this, 'cloudwatch-logs', {
      logGroupName: `${projectName.stringValue}-${environment.stringValue}-ec2-logs`,
      retentionInDays: logRetentionDays.numberValue,
      projectName: projectName.stringValue,
      environment: environment.stringValue,
    });

    // 5. Create EC2 instance in public subnet with monitoring
    const ec2 = new EC2Module(this, 'ec2', {
      instanceType: ec2InstanceType.stringValue,
      subnetId: vpc.publicSubnet.id,
      securityGroupIds: [securityGroups.ec2SecurityGroup.id],
      iamInstanceProfile: iam.ec2InstanceProfile.name,
      keyName: keyPairName.stringValue || undefined,
      projectName: projectName.stringValue,
      environment: environment.stringValue,
    });

    // 6. Create RDS instance in private subnet with encryption
    const rds = new RDSModule(
      this,
      'rds',
      {
        instanceClass: rdsInstanceClass.stringValue,
        allocatedStorage: rdsAllocatedStorage.numberValue,
        dbName: rdsDbName.stringValue,
        username: rdsUsername.stringValue,
        password: dbPasswordSecret.secretString,
        subnetGroupName: `${projectName.stringValue}-${environment.stringValue}-db-subnet-group`,
        securityGroupIds: [securityGroups.rdsSecurityGroup.id],
        projectName: projectName.stringValue,
        environment: environment.stringValue,
      },
      [vpc.privateSubnet.id, vpc.publicSubnet.id]
    ); // Need multiple subnets for RDS

    // 7. Create S3 bucket with encryption and versioning
    const s3 = new S3Module(this, 's3', {
      bucketName: s3BucketName.stringValue,
      projectName: projectName.stringValue,
      environment: environment.stringValue,
    });

    // =============================================================================
    // TERRAFORM OUTPUTS - Export important resource information
    // =============================================================================

    // VPC Outputs
    new TerraformOutput(this, 'vpc_id', {
      value: vpc.vpc.id,
      description: 'ID of the VPC',
    });

    new TerraformOutput(this, 'public_subnet_id', {
      value: vpc.publicSubnet.id,
      description: 'ID of the public subnet',
    });

    new TerraformOutput(this, 'private_subnet_id', {
      value: vpc.privateSubnet.id,
      description: 'ID of the private subnet',
    });

    // EC2 Outputs
    new TerraformOutput(this, 'ec2_instance_id', {
      value: ec2.instance.id,
      description: 'ID of the EC2 instance',
    });

    new TerraformOutput(this, 'ec2_public_ip', {
      value: ec2.instance.publicIp,
      description: 'Public IP address of the EC2 instance',
    });

    new TerraformOutput(this, 'ec2_private_ip', {
      value: ec2.instance.privateIp,
      description: 'Private IP address of the EC2 instance',
    });

    // RDS Outputs
    new TerraformOutput(this, 'rds_endpoint', {
      value: rds.dbInstance.endpoint,
      description: 'RDS instance endpoint',
      sensitive: false,
    });

    new TerraformOutput(this, 'rds_port', {
      value: rds.dbInstance.port,
      description: 'RDS instance port',
    });

    // S3 Outputs
    new TerraformOutput(this, 's3_bucket_name_output', {
      value: s3.bucket.bucket,
      description: 'Name of the S3 bucket',
    });

    new TerraformOutput(this, 's3_bucket_arn', {
      value: s3.bucket.arn,
      description: 'ARN of the S3 bucket',
    });

    // Security Group Outputs
    new TerraformOutput(this, 'ec2_security_group_id', {
      value: securityGroups.ec2SecurityGroup.id,
      description: 'ID of the EC2 security group',
    });

    new TerraformOutput(this, 'rds_security_group_id', {
      value: securityGroups.rdsSecurityGroup.id,
      description: 'ID of the RDS security group',
    });

    // IAM Outputs
    new TerraformOutput(this, 'ec2_role_arn', {
      value: iam.ec2Role.arn,
      description: 'ARN of the EC2 IAM role',
    });

    // CloudWatch Outputs
    new TerraformOutput(this, 'cloudwatch_log_group_name', {
      value: cloudWatchLogs.logGroup.name,
      description: 'Name of the CloudWatch Log Group',
    });

    // SSH Connection Information
    new TerraformOutput(this, 'ssh_connection_command', {
      value: keyPairName.stringValue
        ? `ssh -i ~/.ssh/${keyPairName.stringValue}.pem ec2-user@${ec2.instance.publicIp}`
        : 'SSH key pair not specified. Use AWS Systems Manager Session Manager for secure access.',
      description: 'SSH command to connect to the EC2 instance',
    });
    // ! Do NOT create resources directly in this stack.
    // ! Instead, create separate stacks for each resource type.
  }
}
