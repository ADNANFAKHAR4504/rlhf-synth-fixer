import {
  AwsProvider,
  AwsProviderDefaultTags,
} from '@cdktf/provider-aws/lib/provider';
import { S3Backend, TerraformStack, TerraformOutput } from 'cdktf';
import { Construct } from 'constructs';

// ? Import your stacks here
import {
  VpcModule,
  SecurityGroupModule,
  NetworkAclModule,
  KmsModule,
  S3Module,
  IamModule,
  CloudWatchModule,
  VpcModuleConfig,
  SecurityGroupConfig,
  S3ModuleConfig,
  IAMModuleConfig,
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

    // Environment variables and configuration
    const environment = environmentSuffix || 'dev';
    const projectName = process.env.PROJECT_NAME || 'tap-project';

    // Common tags applied to all resources
    const commonTags = {
      Environment: environment,
      Project: projectName,
      ManagedBy: 'terraform',
      Owner: process.env.OWNER || 'infrastructure-team',
    };

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
    // Network configuration - customize CIDR blocks as needed
    const vpcConfig: VpcModuleConfig = {
      vpcCidr: process.env.VPC_CIDR || '10.0.0.0/16',
      publicSubnetCidrs: [
        process.env.PUBLIC_SUBNET_1_CIDR || '10.0.1.0/24',
        process.env.PUBLIC_SUBNET_2_CIDR || '10.0.2.0/24',
      ],
      privateSubnetCidrs: [
        process.env.PRIVATE_SUBNET_1_CIDR || '10.0.10.0/24',
        process.env.PRIVATE_SUBNET_2_CIDR || '10.0.20.0/24',
      ],
      enableDnsHostnames: true,
      enableDnsSupport: true,
      tags: commonTags,
    };

    // Create VPC with public/private subnets and NAT gateway
    const vpc = new VpcModule(this, 'vpc', vpcConfig);

    // Create KMS keys for encryption
    const s3KmsKey = new KmsModule(
      this,
      's3-kms',
      'KMS key for S3 bucket encryption',
      `${projectName}-s3-key`,
      commonTags
    );

    const logsKmsKey = new KmsModule(
      this,
      'logs-kms',
      'KMS key for CloudWatch Logs encryption',
      `${projectName}-logs-key`,
      commonTags
    );

    // Security Group for web servers - allows HTTP, HTTPS, and SSH
    const webSecurityGroupConfig: SecurityGroupConfig = {
      name: `${projectName}-web-sg`,
      description: 'Security group for web servers',
      vpcId: vpc.vpc.id,
      ingressRules: [
        {
          fromPort: 80,
          toPort: 80,
          protocol: 'tcp',
          cidrBlocks: ['0.0.0.0/0'], // Allow HTTP from anywhere
        },
        {
          fromPort: 443,
          toPort: 443,
          protocol: 'tcp',
          cidrBlocks: ['0.0.0.0/0'], // Allow HTTPS from anywhere
        },
        {
          fromPort: 22,
          toPort: 22,
          protocol: 'tcp',
          cidrBlocks: [process.env.SSH_ALLOWED_CIDR || '0.0.0.0/0'], // SSH access - restrict as needed
        },
      ],
      egressRules: [
        {
          fromPort: 0,
          toPort: 0,
          protocol: '-1',
          cidrBlocks: ['0.0.0.0/0'], // Allow all outbound traffic
        },
      ],
      tags: commonTags,
    };

    const webSecurityGroup = new SecurityGroupModule(
      this,
      'web-sg',
      webSecurityGroupConfig
    );

    // Security Group for database servers - allows MySQL/PostgreSQL from web servers only
    const dbSecurityGroupConfig: SecurityGroupConfig = {
      name: `${projectName}-db-sg`,
      description: 'Security group for database servers',
      vpcId: vpc.vpc.id,
      ingressRules: [
        {
          fromPort: 3306,
          toPort: 3306,
          protocol: 'tcp',
          sourceSecurityGroupId: webSecurityGroup.securityGroup.id, // MySQL from web servers
        },
        {
          fromPort: 5432,
          toPort: 5432,
          protocol: 'tcp',
          sourceSecurityGroupId: webSecurityGroup.securityGroup.id, // PostgreSQL from web servers
        },
      ],
      egressRules: [
        {
          fromPort: 0,
          toPort: 0,
          protocol: '-1',
          cidrBlocks: ['0.0.0.0/0'], // Allow all outbound traffic
        },
      ],
      tags: commonTags,
    };

    const dbSecurityGroup = new SecurityGroupModule(
      this,
      'db-sg',
      dbSecurityGroupConfig
    );

    // Create Network ACLs for additional subnet protection
    new NetworkAclModule(
      this,
      'public-nacl',
      vpc.vpc.id,
      vpc.publicSubnets.map(subnet => subnet.id),
      { ...commonTags, Name: `${projectName}-public` }
    );

    new NetworkAclModule(
      this,
      'private-nacl',
      vpc.vpc.id,
      vpc.privateSubnets.map(subnet => subnet.id),
      { ...commonTags, Name: `${projectName}-private` }
    );

    // S3 bucket for application data with KMS encryption
    const dataBucketConfig: S3ModuleConfig = {
      bucketName:
        process.env.DATA_BUCKET_NAME ||
        `${projectName}-data-${environment}-${Date.now()}`,
      kmsKeyId: s3KmsKey.key.arn,
      enableVersioning: true,
      enableLogging: false, // Set to true if you have a separate logging bucket
      tags: { ...commonTags, Purpose: 'application-data' },
    };

    const dataBucket = new S3Module(this, 'data-bucket', dataBucketConfig);

    // S3 bucket for logs with KMS encryption
    const logsBucketConfig: S3ModuleConfig = {
      bucketName:
        process.env.LOGS_BUCKET_NAME ||
        `${projectName}-logs-${environment}-${Date.now()}`,
      kmsKeyId: s3KmsKey.key.arn,
      enableVersioning: true,
      enableLogging: false,
      tags: { ...commonTags, Purpose: 'logs-storage' },
    };

    const logsBucket = new S3Module(this, 'logs-bucket', logsBucketConfig);

    // IAM role for EC2 instances with S3 and CloudWatch permissions
    const ec2RoleConfig: IAMModuleConfig = {
      roleName: `${projectName}-ec2-role`,
      assumeRolePolicy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Action: 'sts:AssumeRole',
            Effect: 'Allow',
            Principal: {
              Service: 'ec2.amazonaws.com',
            },
          },
        ],
      }),
      policies: [
        {
          name: 'S3DataBucketAccess',
          policy: JSON.stringify({
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
                Resource: [dataBucket.bucket.arn, `${dataBucket.bucket.arn}/*`],
              },
              {
                Effect: 'Allow',
                Action: [
                  'kms:Encrypt',
                  'kms:Decrypt',
                  'kms:ReEncrypt*',
                  'kms:GenerateDataKey*',
                  'kms:DescribeKey',
                ],
                Resource: s3KmsKey.key.arn,
              },
            ],
          }),
        },
        {
          name: 'CloudWatchLogsAccess',
          policy: JSON.stringify({
            Version: '2012-10-17',
            Statement: [
              {
                Effect: 'Allow',
                Action: [
                  'logs:CreateLogGroup',
                  'logs:CreateLogStream',
                  'logs:PutLogEvents',
                  'logs:DescribeLogStreams',
                  'logs:DescribeLogGroups',
                ],
                Resource: 'arn:aws:logs:us-east-1:*:*',
              },
              {
                Effect: 'Allow',
                Action: [
                  'kms:Encrypt',
                  'kms:Decrypt',
                  'kms:ReEncrypt*',
                  'kms:GenerateDataKey*',
                  'kms:DescribeKey',
                ],
                Resource: logsKmsKey.key.arn,
              },
            ],
          }),
        },
      ],
      managedPolicyArns: [
        'arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy', // For CloudWatch monitoring
      ],
      tags: commonTags,
    };

    const ec2Role = new IamModule(this, 'ec2-role', ec2RoleConfig);

    // IAM role for Lambda functions with minimal permissions
    const lambdaRoleConfig: IAMModuleConfig = {
      roleName: `${projectName}-lambda-role`,
      assumeRolePolicy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Action: 'sts:AssumeRole',
            Effect: 'Allow',
            Principal: {
              Service: 'lambda.amazonaws.com',
            },
          },
        ],
      }),
      policies: [
        {
          name: 'S3ReadOnlyAccess',
          policy: JSON.stringify({
            Version: '2012-10-17',
            Statement: [
              {
                Effect: 'Allow',
                Action: ['s3:GetObject', 's3:ListBucket'],
                Resource: [dataBucket.bucket.arn, `${dataBucket.bucket.arn}/*`],
              },
            ],
          }),
        },
      ],
      managedPolicyArns: [
        'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole',
      ],
      tags: commonTags,
    };

    const lambdaRole = new IamModule(this, 'lambda-role', lambdaRoleConfig);

    // CloudWatch Log Groups for application and system logs
    const appLogGroup = new CloudWatchModule(
      this,
      'app-logs',
      `/aws/application/${projectName}`,
      30, // 30 days retention
      logsKmsKey.key.arn,
      { ...commonTags, LogType: 'application' }
    );

    const systemLogGroup = new CloudWatchModule(
      this,
      'system-logs',
      `/aws/system/${projectName}`,
      7, // 7 days retention for system logs
      logsKmsKey.key.arn,
      { ...commonTags, LogType: 'system' }
    );

    // Export important resource information as outputs
    new TerraformOutput(this, 'vpc-id', {
      value: vpc.vpc.id,
      description: 'ID of the created VPC',
    });

    new TerraformOutput(this, 'public-subnet-ids', {
      value: vpc.publicSubnets.map(subnet => subnet.id),
      description: 'IDs of the public subnets',
    });

    new TerraformOutput(this, 'private-subnet-ids', {
      value: vpc.privateSubnets.map(subnet => subnet.id),
      description: 'IDs of the private subnets',
    });

    new TerraformOutput(this, 'web-security-group-id', {
      value: webSecurityGroup.securityGroup.id,
      description: 'ID of the web security group',
    });

    new TerraformOutput(this, 'db-security-group-id', {
      value: dbSecurityGroup.securityGroup.id,
      description: 'ID of the database security group',
    });

    new TerraformOutput(this, 'data-bucket-name', {
      value: dataBucket.bucket.id,
      description: 'Name of the data S3 bucket',
    });

    new TerraformOutput(this, 'logs-bucket-name', {
      value: logsBucket.bucket.id,
      description: 'Name of the logs S3 bucket',
    });

    new TerraformOutput(this, 's3-kms-key-id', {
      value: s3KmsKey.key.keyId,
      description: 'ID of the S3 KMS encryption key',
    });

    new TerraformOutput(this, 's3-kms-key-arn', {
      value: s3KmsKey.key.arn,
      description: 'ARN of the S3 KMS encryption key',
    });

    new TerraformOutput(this, 'logs-kms-key-id', {
      value: logsKmsKey.key.keyId,
      description: 'ID of the CloudWatch Logs KMS encryption key',
    });

    new TerraformOutput(this, 'ec2-role-arn', {
      value: ec2Role.role.arn,
      description: 'ARN of the EC2 IAM role',
    });

    new TerraformOutput(this, 'lambda-role-arn', {
      value: lambdaRole.role.arn,
      description: 'ARN of the Lambda IAM role',
    });

    new TerraformOutput(this, 'app-log-group-name', {
      value: appLogGroup.logGroup.name,
      description: 'Name of the application CloudWatch log group',
    });

    new TerraformOutput(this, 'system-log-group-name', {
      value: systemLogGroup.logGroup.name,
      description: 'Name of the system CloudWatch log group',
    });

    new TerraformOutput(this, 'nat-gateway-id', {
      value: vpc.natGateway.id,
      description: 'ID of the NAT gateway',
    });

    new TerraformOutput(this, 'internet-gateway-id', {
      value: vpc.internetGateway.id,
      description: 'ID of the internet gateway',
    });
    // ! Do NOT create resources directly in this stack.
    // ! Instead, create separate stacks for each resource type.
  }
}
