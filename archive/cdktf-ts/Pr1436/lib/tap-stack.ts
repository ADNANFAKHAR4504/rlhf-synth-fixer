import {
  AwsProvider,
  AwsProviderDefaultTags,
} from '@cdktf/provider-aws/lib/provider';
import { S3Backend, TerraformStack, TerraformOutput } from 'cdktf';
import { Construct } from 'constructs';

// ? Import your stacks here
import { DataAwsSecretsmanagerSecretVersion } from '@cdktf/provider-aws/lib/data-aws-secretsmanager-secret-version';
import {
  VpcModule,
  SecurityGroupModule,
  IamModule,
  Ec2Module,
  S3Module,
  RdsModule,
  CloudTrailModule,
  CloudWatchModule,
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

    // Configure AWS Provider - this expects AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY to be set in the environment
    new AwsProvider(this, 'aws', {
      region: awsRegion,
      defaultTags: [
        {
          tags: {
            Environment: environmentSuffix,
            Project: 'tap-infrastructure',
            ManagedBy: 'CDKTF',
            Department: 'Infrastructure',
          },
        },
      ],
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

    // Common tags for all resources
    const commonTags = {
      Department: 'Infrastructure',
      Environment: environmentSuffix,
      Project: 'tap-infrastructure',
    };

    // ? Add your stack instantiations here
    // Configuration parameters
    const dbPasswordSecret = new DataAwsSecretsmanagerSecretVersion(
      this,
      'db-password-secret',
      {
        secretId: 'my-db-password',
      }
    );

    const config = {
      vpcCidr: '10.0.0.0/16',
      allowedSshCidr: '203.0.113.0/24', // Corporate network CIDR
      instanceType: 'm5.large', // Meets minimum requirement
      rdsInstanceClass: 'db.t3.medium', // Can be upgraded as needed
      dbUsername: 'admin',
      dbPassword: dbPasswordSecret.secretString,
      dbName: 'corpdb',
    };

    // 1. Create VPC with public and private subnets
    const vpcModule = new VpcModule(this, 'main-vpc', {
      cidrBlock: config.vpcCidr,
      publicSubnetCount: 2,
      privateSubnetCount: 2,
      enableNatGateway: true,
      tags: commonTags,
    });

    // 2. Create Security Groups
    const securityModule = new SecurityGroupModule(this, 'security', {
      vpcId: vpcModule.vpc.id,
      allowedSshCidr: config.allowedSshCidr,
      tags: commonTags,
    });

    // 3. Create IAM roles and policies
    const iamModule = new IamModule(this, 'iam', {
      tags: commonTags,
    });

    // 4. Create S3 buckets
    const s3Module = new S3Module(this, 'storage', {
      bucketNames: ['app-data', 'backups', 'logs'],
      tags: commonTags,
    });

    // 5. Create RDS database in private subnets
    const rdsModule = new RdsModule(this, 'database', {
      subnetIds: vpcModule.privateSubnets.map(subnet => subnet.id),
      securityGroupIds: [securityModule.rdsSecurityGroup.id],
      dbName: config.dbName,
      username: config.dbUsername,
      password: config.dbPassword,
      instanceClass: config.rdsInstanceClass,
      tags: commonTags,
    });

    // 6. Create EC2 instances in private subnets
    const ec2Module = new Ec2Module(this, 'compute', {
      subnetIds: vpcModule.privateSubnets.map(subnet => subnet.id),
      securityGroupIds: [securityModule.ec2SecurityGroup.id],
      instanceType: config.instanceType,
      iamInstanceProfile: iamModule.ec2InstanceProfile.name,
      keyName: 'corp-keypair', // Assumes key pair exists
      tags: commonTags,
    });

    // 7. Set up CloudTrail for audit logging
    new CloudTrailModule(this, 'audit', {
      s3BucketName: s3Module.cloudtrailBucket.bucket,
      tags: commonTags,
    });

    // 8. Set up CloudWatch monitoring and alarms
    const cloudWatchModule = new CloudWatchModule(this, 'monitoring', {
      instanceIds: ec2Module.instances.map(instance => instance.id),
      tags: commonTags,
    });

    // Outputs for key infrastructure components
    new TerraformOutput(this, 'vpc-id', {
      value: vpcModule.vpc.id,
      description: 'ID of the main VPC',
    });

    new TerraformOutput(this, 'public-subnet-ids', {
      value: vpcModule.publicSubnets.map(subnet => subnet.id),
      description: 'IDs of public subnets',
    });

    new TerraformOutput(this, 'private-subnet-ids', {
      value: vpcModule.privateSubnets.map(subnet => subnet.id),
      description: 'IDs of private subnets',
    });

    new TerraformOutput(this, 'ec2-instance-ids', {
      value: ec2Module.instances.map(instance => instance.id),
      description: 'IDs of EC2 instances',
    });

    new TerraformOutput(this, 'ec2-private-ips', {
      value: ec2Module.instances.map(instance => instance.privateIp),
      description: 'Private IP addresses of EC2 instances',
    });

    new TerraformOutput(this, 'rds-endpoint', {
      value: rdsModule.dbInstance.endpoint,
      description: 'RDS database endpoint',
      sensitive: true,
    });

    new TerraformOutput(this, 's3-bucket-names', {
      value: s3Module.buckets.map(bucket => bucket.bucket),
      description: 'Names of S3 buckets',
    });

    new TerraformOutput(this, 'cloudtrail-bucket', {
      value: s3Module.cloudtrailBucket.bucket,
      description: 'CloudTrail S3 bucket name',
    });

    new TerraformOutput(this, 'sns-topic-arn', {
      value: cloudWatchModule.snsTopic.arn,
      description: 'SNS topic ARN for alerts',
    });

    new TerraformOutput(this, 'security-group-ec2', {
      value: securityModule.ec2SecurityGroup.id,
      description: 'EC2 security group ID',
    });

    new TerraformOutput(this, 'security-group-rds', {
      value: securityModule.rdsSecurityGroup.id,
      description: 'RDS security group ID',
    });

    new TerraformOutput(this, 'iam-role-ec2', {
      value: iamModule.ec2Role.arn,
      description: 'EC2 IAM role ARN',
    });
    // ! Do NOT create resources directly in this stack.
    // ! Instead, create separate stacks for each resource type.
  }
}
