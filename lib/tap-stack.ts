// lib/tap-stack.ts
import {
  AwsProvider,
  AwsProviderDefaultTags,
} from '@cdktf/provider-aws/lib/provider';
import { S3Backend, TerraformOutput, TerraformStack } from 'cdktf';
import { Construct } from 'constructs';
import { DataAwsCallerIdentity } from '@cdktf/provider-aws/lib/data-aws-caller-identity';
import { Instance } from '@cdktf/provider-aws/lib/instance';
import { SecurityGroup } from '@cdktf/provider-aws/lib/security-group';
import { SecurityGroupRule } from '@cdktf/provider-aws/lib/security-group-rule';
import { DataAwsAmi } from '@cdktf/provider-aws/lib/data-aws-ami';

// Import modules
import {
  CommonTags,
  SecureVpc,
  KmsKeyConstruct,
  EncryptedS3Bucket,
  SecureRdsInstance,
  CloudWatchLogGroup,
  CloudWatchAlarm,
  NotificationTopic,
  CostBudget,
  IamRoleConstruct,
  MfaEnforcementPolicy,
} from './modules';

interface TapStackProps {
  environmentSuffix?: string;
  stateBucket?: string;
  stateBucketRegion?: string;
  awsRegion?: string;
  awsRegionOverride?: string; // Add this
  defaultTags?: AwsProviderDefaultTags;
}

export class TapStack extends TerraformStack {
  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id);

    const environmentSuffix = props?.environmentSuffix || 'dev';
    const AWS_REGION_OVERRIDE =
      props?.awsRegionOverride || process.env.AWS_REGION_OVERRIDE || '';
    const awsRegion = AWS_REGION_OVERRIDE
      ? AWS_REGION_OVERRIDE
      : props?.awsRegion || 'us-east-1';
    const stateBucketRegion = props?.stateBucketRegion || 'us-east-1';
    const stateBucket = props?.stateBucket || 'iac-rlhf-tf-states';
    const defaultTags = props?.defaultTags ? [props.defaultTags] : [];

    // Configure AWS Provider
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
    this.addOverride('terraform.backend.s3.use_lockfile', true);

    // Get current AWS account identity
    const current = new DataAwsCallerIdentity(this, 'current', {});

    // Common tags for all resources
    const commonTags: CommonTags = {
      Project: id, // Use capitalized keys consistently
      Environment: environmentSuffix,
      Owner: 'infrastructure-team',
      CostCenter: 'engineering', // Remove hyphens from keys
    };

    // Create KMS key for encryption with CloudTrail support
    const kmsModule = new KmsKeyConstruct(this, 'main-kms', {
      name: `${id}-${environmentSuffix}-main`,
      description: `Main KMS key for ${id} ${environmentSuffix} environment`,
      enableKeyRotation: true,
      accountId: current.accountId, // Add this line
      tags: commonTags,
    });

    // Create VPC with public and private subnets
    const vpcModule = new SecureVpc(this, 'main-vpc', {
      name: `${id}-${environmentSuffix}-vpc`,
      cidr: '10.0.0.0/16',
      azCount: 2,
      publicSubnetCidrs: ['10.0.1.0/24', '10.0.2.0/24'],
      privateSubnetCidrs: ['10.0.10.0/24', '10.0.11.0/24'],
      enableNat: true,
      tags: commonTags,
    });

    // Create SNS topic for notifications
    const notificationTopic = new NotificationTopic(
      this,
      'notification-topic',
      `${id}-${environmentSuffix}-alerts`,
      commonTags
    );

    // Create Security Groups
    const publicSecurityGroup = new SecurityGroup(this, 'public-sg', {
      name: `${id}-${environmentSuffix}-public-sg`,
      description: 'Security group for public instances',
      vpcId: vpcModule.vpc.id,
      tags: { ...commonTags, Name: `${id}-${environmentSuffix}-public-sg` },
    });

    // Allow inbound HTTP/HTTPS
    new SecurityGroupRule(this, 'public-sg-http', {
      type: 'ingress',
      fromPort: 80,
      toPort: 80,
      protocol: 'tcp',
      cidrBlocks: ['0.0.0.0/0'],
      securityGroupId: publicSecurityGroup.id,
    });

    new SecurityGroupRule(this, 'public-sg-https', {
      type: 'ingress',
      fromPort: 443,
      toPort: 443,
      protocol: 'tcp',
      cidrBlocks: ['0.0.0.0/0'],
      securityGroupId: publicSecurityGroup.id,
    });

    // Allow SSH from specific IP (update as needed)
    new SecurityGroupRule(this, 'public-sg-ssh', {
      type: 'ingress',
      fromPort: 22,
      toPort: 22,
      protocol: 'tcp',
      cidrBlocks: ['10.0.0.0/16'], // Restrict to VPC CIDR
      securityGroupId: publicSecurityGroup.id,
    });

    new SecurityGroupRule(this, 'public-sg-egress', {
      type: 'egress',
      fromPort: 0,
      toPort: 0,
      protocol: '-1',
      cidrBlocks: ['0.0.0.0/0'],
      securityGroupId: publicSecurityGroup.id,
    });

    const privateSecurityGroup = new SecurityGroup(this, 'private-sg', {
      name: `${id}-${environmentSuffix}-private-sg`,
      description: 'Security group for private instances',
      vpcId: vpcModule.vpc.id,
      tags: { ...commonTags, Name: `${id}-${environmentSuffix}-private-sg` },
    });

    // Allow inbound from public security group
    new SecurityGroupRule(this, 'private-sg-from-public', {
      type: 'ingress',
      fromPort: 0,
      toPort: 65535,
      protocol: 'tcp',
      sourceSecurityGroupId: publicSecurityGroup.id,
      securityGroupId: privateSecurityGroup.id,
    });

    new SecurityGroupRule(this, 'private-sg-egress', {
      type: 'egress',
      fromPort: 0,
      toPort: 0,
      protocol: '-1',
      cidrBlocks: ['0.0.0.0/0'],
      securityGroupId: privateSecurityGroup.id,
    });

    // RDS Security Group
    const rdsSecurityGroup = new SecurityGroup(this, 'rds-sg', {
      name: `${id}-${environmentSuffix}-rds-sg`,
      description: 'Security group for RDS instances',
      vpcId: vpcModule.vpc.id,
      tags: { ...commonTags, Name: `${id}-${environmentSuffix}-rds-sg` },
    });

    new SecurityGroupRule(this, 'rds-sg-ingress', {
      type: 'ingress',
      fromPort: 3306,
      toPort: 3306,
      protocol: 'tcp',
      sourceSecurityGroupId: privateSecurityGroup.id,
      securityGroupId: rdsSecurityGroup.id,
    });

    // Get latest Amazon Linux 2 AMI
    const ami = new DataAwsAmi(this, 'amazon-linux-2', {
      mostRecent: true,
      owners: ['amazon'],
      filter: [
        {
          name: 'name',
          values: ['amzn2-ami-hvm-*-x86_64-gp2'],
        },
      ],
    });

    // Create IAM role for EC2 instances
    const ec2Role = new IamRoleConstruct(this, 'ec2-role', {
      name: `${id}-${environmentSuffix}-ec2-role`,
      assumeRolePolicy: {
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Principal: {
              Service: 'ec2.amazonaws.com',
            },
            Action: 'sts:AssumeRole',
          },
        ],
      },
      createInstanceProfile: true, // Add this flag
      inlinePolicies: {
        's3-access': {
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Action: [
                's3:GetObject',
                's3:PutObject',
                's3:DeleteObject',
                's3:ListBucket',
              ],
              Resource: ['arn:aws:s3:::*/*', 'arn:aws:s3:::*'],
            },
          ],
        },
      },
      tags: commonTags,
    });

    // Create public EC2 instance
    const publicEc2Module = {
      instance: new Instance(this, 'public-ec2', {
        ami: ami.id,
        instanceType: 't3.micro',
        subnetId: vpcModule.publicSubnets[0].id,
        vpcSecurityGroupIds: [publicSecurityGroup.id],
        associatePublicIpAddress: true,
        iamInstanceProfile: ec2Role.instanceProfile?.name, // Use instance profile
        rootBlockDevice: {
          encrypted: true,
          volumeType: 'gp3',
          volumeSize: 20,
        },
        tags: { ...commonTags, Name: `${id}-${environmentSuffix}-public-ec2` },
      }),
    };

    // Create private EC2 instance
    const privateEc2Module = {
      instance: new Instance(this, 'private-ec2', {
        ami: ami.id,
        instanceType: 't3.micro',
        subnetId: vpcModule.privateSubnets[0].id,
        vpcSecurityGroupIds: [privateSecurityGroup.id],
        iamInstanceProfile: ec2Role.instanceProfile?.name, // Use instance profile
        rootBlockDevice: {
          encrypted: true,
          volumeType: 'gp3',
          volumeSize: 20,
        },
        tags: { ...commonTags, Name: `${id}-${environmentSuffix}-private-ec2` },
      }),
    };

    // Create public S3 bucket for app assets
    const publicS3Module = new EncryptedS3Bucket(this, 'public-s3', {
      name: `${id.toLowerCase()}-${environmentSuffix}-public-assets`, // Add .toLowerCase()
      versioning: true,
      kmsKeyArn: kmsModule.keyArn,
      lifecycleRules: [
        {
          id: 'expire-old-versions',
          status: 'Enabled',
          filter: {}, // Add empty filter
          noncurrentVersionExpiration: {
            noncurrent_days: 90, // Change from 'days' to 'noncurrentDays'
          },
        },
      ],
      tags: commonTags,
    });

    // Create private S3 bucket for internal data
    const privateS3Module = new EncryptedS3Bucket(this, 'private-s3', {
      name: `${id.toLowerCase()}-${environmentSuffix}-private-data`, // Add .toLowerCase()
      versioning: true,
      kmsKeyArn: kmsModule.keyArn,
      lifecycleRules: [
        {
          id: 'transition-to-ia',
          status: 'Enabled',
          filter: {}, // Add empty filter
          transition: [
            {
              days: 30,
              storageClass: 'STANDARD_IA',
            },
            {
              days: 90,
              storageClass: 'GLACIER',
            },
          ],
        },
      ],
      tags: commonTags,
    });

    // Create RDS instance
    const rdsModule = new SecureRdsInstance(this, 'main-rds', {
      name: `db-${id.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${environmentSuffix}`,
      engine: 'mysql',
      instanceClass: 'db.t3.micro',
      allocatedStorage: 20,
      username: 'admin',
      dbSubnetGroupName: vpcModule.dbSubnetGroup.name,
      vpcSecurityGroupIds: [rdsSecurityGroup.id],
      kmsKeyId: kmsModule.keyArn,
      backupRetentionPeriod: 7,
      deletionProtection: environmentSuffix === 'prod',
      enabledCloudwatchLogsExports: ['error', 'general', 'slowquery'],
      tags: commonTags,
    });

    // Create CloudWatch Log Groups
    new CloudWatchLogGroup(
      this,
      'app-logs',
      `/aws/application/${id}-${environmentSuffix}`,
      30,
      commonTags
    );

    // Create CloudWatch Alarms
    new CloudWatchAlarm(this, 'high-cpu-alarm', {
      name: `${id}-${environmentSuffix}-high-cpu`,
      metricName: 'CPUUtilization',
      namespace: 'AWS/EC2',
      statistic: 'Average',
      period: 300,
      evaluationPeriods: 2,
      threshold: 80,
      comparisonOperator: 'GreaterThanThreshold',
      dimensions: {
        InstanceId: publicEc2Module.instance.id,
      },
      snsTopicArn: notificationTopic.topic.arn,
    });

    // Create Budget Alert
    new CostBudget(this, 'cost-budget', {
      name: `${id}-${environmentSuffix}-monthly-budget`,
      limitAmount: '100',
      limitUnit: 'USD',
      timeUnit: 'MONTHLY',
      snsTopicArn: notificationTopic.topic.arn,
      thresholds: [80, 100],
      tags: commonTags,
    });

    // Create MFA Enforcement Policy
    new MfaEnforcementPolicy(this, 'mfa-policy', commonTags);

    // Terraform Outputs
    new TerraformOutput(this, 'vpc-id', {
      value: vpcModule.vpc.id,
      description: 'VPC ID',
    });

    new TerraformOutput(this, 'public-subnet-ids', {
      value: vpcModule.publicSubnets.map(subnet => subnet.id),
      description: 'Public subnet IDs',
    });

    new TerraformOutput(this, 'private-subnet-ids', {
      value: vpcModule.privateSubnets.map(subnet => subnet.id),
      description: 'Private subnet IDs',
    });

    new TerraformOutput(this, 'public-ec2-instance-id', {
      value: publicEc2Module.instance.id,
      description: 'Public EC2 instance ID',
    });

    new TerraformOutput(this, 'public-ec2-public-ip', {
      value: publicEc2Module.instance.publicIp,
      description: 'Public EC2 instance public IP address',
    });

    new TerraformOutput(this, 'private-ec2-instance-id', {
      value: privateEc2Module.instance.id,
      description: 'Private EC2 instance ID',
    });

    new TerraformOutput(this, 'private-ec2-private-ip', {
      value: privateEc2Module.instance.privateIp,
      description: 'Private EC2 instance private IP address',
    });

    new TerraformOutput(this, 'public-s3-bucket-name', {
      value: publicS3Module.bucket.bucket,
      description: 'Public S3 bucket name for app assets',
    });

    new TerraformOutput(this, 'private-s3-bucket-name', {
      value: privateS3Module.bucket.bucket,
      description: 'Private S3 bucket name for internal data',
    });

    new TerraformOutput(this, 'rds-endpoint', {
      value: rdsModule.instance.endpoint,
      description: 'RDS instance endpoint',
    });

    new TerraformOutput(this, 'kms-key-id', {
      value: kmsModule.keyId || '',
      description: 'KMS key ID',
    });

    new TerraformOutput(this, 'aws-account-id', {
      value: current.accountId,
      description: 'Current AWS Account ID',
    });

    new TerraformOutput(this, 'sns-topic-arn', {
      value: notificationTopic.topic.arn,
      description: 'SNS topic ARN for notifications',
    });
  }
}
