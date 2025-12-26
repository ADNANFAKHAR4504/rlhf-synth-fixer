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
  S3Module,
  IamRoleModule,
  CloudTrailModule,
  SecretsManagerModule,
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

const AWS_REGION_OVERRIDE = 'us-west-2';

export class TapStack extends TerraformStack {
  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id);

    const environmentSuffix = props?.environmentSuffix || 'dev';
    const awsRegion = AWS_REGION_OVERRIDE
      ? AWS_REGION_OVERRIDE
      : props?.awsRegion || 'us-east-1';
    const stateBucketRegion = props?.stateBucketRegion || 'us-east-1';
    const stateBucket = props?.stateBucket || 'iac-rlhf-tf-states';

    // Detect LocalStack environment
    const isLocalStack =
      process.env.AWS_ENDPOINT_URL !== undefined ||
      process.env.LOCALSTACK_HOSTNAME !== undefined;

    // Configure AWS Provider - this expects AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY to be set in the environment
    const providerConfig: any = {
      region: awsRegion,
      defaultTags: [
        {
          tags: {
            Project: 'TAP-Secure-Infrastructure',
            ManagedBy: 'CDKTF',
            Environment: environmentSuffix,
          },
        },
      ],
    };

    // Add LocalStack endpoints
    if (isLocalStack) {
      const localstackEndpoint =
        process.env.AWS_ENDPOINT_URL || 'http://localhost:4566';
      providerConfig.endpoints = [
        {
          s3: localstackEndpoint,
          iam: localstackEndpoint,
          ec2: localstackEndpoint,
          cloudtrail: localstackEndpoint,
          secretsmanager: localstackEndpoint,
          kms: localstackEndpoint,
        },
      ];
      providerConfig.s3UsePathStyle = true;
      providerConfig.skipCredentialsValidation = true;
      providerConfig.skipMetadataApiCheck = true;
      providerConfig.skipRequestingAccountId = true;
    }

    new AwsProvider(this, 'aws', providerConfig);

    // Configure S3 Backend with native state locking (skip for LocalStack)
    if (!isLocalStack) {
      new S3Backend(this, {
        bucket: stateBucket,
        key: `${environmentSuffix}/${id}.tfstate`,
        region: stateBucketRegion,
        encrypt: true,
      });
      // Using an escape hatch instead of S3Backend construct - CDKTF still does not support S3 state locking natively
      // ref - https://developer.hashicorp.com/terraform/cdktf/concepts/resources#escape-hatch
      this.addOverride('terraform.backend.s3.use_lockfile', true);
    }

    // ? Add your stack instantiations here
    // Environment variables and configuration
    const allowedIpRanges = process.env.ALLOWED_IP_RANGES?.split(',') || [
      '10.0.0.0/8', // Default to private IP ranges if not specified
      '172.16.0.0/12',
      '192.168.0.0/16',
    ];

    const projectName = process.env.PROJECT_NAME || 'tap-secure';

    // Create VPC with proper CIDR block
    const vpcModule = new VpcModule(this, 'vpc', {
      name: `${projectName}-vpc`,
      cidrBlock: '10.0.0.0/16',
      enableDnsHostnames: true,
      enableDnsSupport: true,
    });

    // Create Security Group for web traffic
    const webSecurityGroup = new SecurityGroupModule(this, 'web-sg', {
      name: `${projectName}-web-sg`,
      description: 'Security group for web servers with restricted access',
      vpcId: vpcModule.vpc.id,
      allowedIpRanges: allowedIpRanges,
      allowHttp: true,
      allowHttps: true,
    });

    // Create Security Group for SSH access
    const sshSecurityGroup = new SecurityGroupModule(this, 'ssh-sg', {
      name: `${projectName}-ssh-sg`,
      description: 'Security group for SSH access with restricted IP ranges',
      vpcId: vpcModule.vpc.id,
      allowedIpRanges: allowedIpRanges,
      allowSsh: true,
    });

    // Create S3 bucket for application data
    const appDataBucket = new S3Module(this, 'app-data-bucket', {
      bucketName: `${projectName}-app-data-${environmentSuffix}`,
      enableVersioning: true,
    });

    // Create S3 bucket for CloudTrail logs
    const cloudtrailBucket = new S3Module(this, 'cloudtrail-bucket', {
      bucketName: `${projectName}-cloudtrail-logs-${environmentSuffix}`,
      enableVersioning: true,
    });

    // Create S3 bucket for access logs
    const accessLogsBucket = new S3Module(this, 'access-logs-bucket', {
      bucketName: `${projectName}-access-logs-${environmentSuffix}`,
      enableVersioning: false,
    });

    // Configure logging for app data bucket
    new S3Module(this, 'app-data-bucket-with-logging', {
      bucketName: `${projectName}-app-data-logged-${environmentSuffix}`,
      enableVersioning: true,
      enableLogging: true,
      loggingTargetBucket: accessLogsBucket.bucket.id,
      loggingTargetPrefix: 'app-data-access-logs/',
    });

    // Create IAM role for EC2 instances
    const ec2Role = new IamRoleModule(this, 'ec2-role', {
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
        'arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore', // For Systems Manager
      ],
      customPolicyDocument: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Action: ['s3:GetObject', 's3:PutObject', 's3:DeleteObject'],
            Resource: `${appDataBucket.bucket.arn}/*`,
          },
          {
            Effect: 'Allow',
            Action: ['s3:ListBucket'],
            Resource: appDataBucket.bucket.arn,
          },
          {
            Effect: 'Allow',
            Action: ['secretsmanager:GetSecretValue'],
            // Simplified for LocalStack - removed complex tag-based condition
            Resource: '*',
          },
        ],
      }),
    });

    // Create IAM role for CloudTrail
    const cloudtrailRole = new IamRoleModule(this, 'cloudtrail-role', {
      roleName: `${projectName}-cloudtrail-role`,
      assumeRolePolicy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Action: 'sts:AssumeRole',
            Effect: 'Allow',
            Principal: {
              Service: 'cloudtrail.amazonaws.com',
            },
          },
        ],
      }),
      customPolicyDocument: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Action: ['s3:PutObject', 's3:GetBucketAcl'],
            Resource: [
              cloudtrailBucket.bucket.arn,
              `${cloudtrailBucket.bucket.arn}/*`,
            ],
          },
        ],
      }),
    });

    // Create CloudTrail for audit logging
    const cloudtrail = new CloudTrailModule(this, 'cloudtrail', {
      name: `${projectName}-cloudtrail`,
      s3BucketName: cloudtrailBucket.bucket.id,
      s3KeyPrefix: 'cloudtrail-logs/',
      includeGlobalServiceEvents: true,
      isMultiRegionTrail: true,
      enableLogFileValidation: true,
    });

    // Create secrets for application configuration
    const databaseSecret = new SecretsManagerModule(this, 'database-secret', {
      secretName: `${projectName}/database/credentials`,
      description: 'Database credentials for the application',
      secretValue: {
        username: process.env.DB_USERNAME || 'admin',
        password: process.env.DB_PASSWORD || 'change-me-in-production',
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || '5432',
        database: process.env.DB_NAME || 'tapdb',
      },
      recoveryWindowInDays: 7,
    });

    // Create secrets for API keys
    const apiKeysSecret = new SecretsManagerModule(this, 'api-keys-secret', {
      secretName: `${projectName}/api/keys`,
      description: 'API keys and tokens for external services',
      secretValue: {
        external_api_key: process.env.EXTERNAL_API_KEY || 'placeholder-key',
        jwt_secret: process.env.JWT_SECRET || 'placeholder-jwt-secret',
        encryption_key:
          process.env.ENCRYPTION_KEY || 'placeholder-encryption-key',
      },
      recoveryWindowInDays: 7,
    });

    // Define outputs for key infrastructure components
    new TerraformOutput(this, 'vpc_id', {
      value: vpcModule.vpc.id,
      description: 'ID of the VPC',
    });

    new TerraformOutput(this, 'vpc_cidr_block', {
      value: vpcModule.vpc.cidrBlock,
      description: 'CIDR block of the VPC',
    });

    new TerraformOutput(this, 'public_subnet_ids', {
      value: vpcModule.publicSubnets.map(subnet => subnet.id),
      description: 'IDs of the public subnets',
    });

    new TerraformOutput(this, 'private_subnet_ids', {
      value: vpcModule.privateSubnets.map(subnet => subnet.id),
      description: 'IDs of the private subnets',
    });

    new TerraformOutput(this, 'web_security_group_id', {
      value: webSecurityGroup.securityGroup.id,
      description: 'ID of the web security group',
    });

    new TerraformOutput(this, 'ssh_security_group_id', {
      value: sshSecurityGroup.securityGroup.id,
      description: 'ID of the SSH security group',
    });

    new TerraformOutput(this, 'app_data_bucket_name', {
      value: appDataBucket.bucket.id,
      description: 'Name of the application data S3 bucket',
    });

    new TerraformOutput(this, 'app_data_bucket_arn', {
      value: appDataBucket.bucket.arn,
      description: 'ARN of the application data S3 bucket',
    });

    new TerraformOutput(this, 'cloudtrail_bucket_name', {
      value: cloudtrailBucket.bucket.id,
      description: 'Name of the CloudTrail logs S3 bucket',
    });

    new TerraformOutput(this, 'access_logs_bucket_name', {
      value: accessLogsBucket.bucket.id,
      description: 'Name of the access logs S3 bucket',
    });

    new TerraformOutput(this, 'ec2_role_arn', {
      value: ec2Role.role.arn,
      description: 'ARN of the EC2 IAM role',
    });

    new TerraformOutput(this, 'ec2_role_name', {
      value: ec2Role.role.name,
      description: 'Name of the EC2 IAM role',
    });

    new TerraformOutput(this, 'cloudtrail_role_arn', {
      value: cloudtrailRole.role.arn,
      description: 'ARN of the CloudTrail IAM role',
    });

    new TerraformOutput(this, 'cloudtrail_arn', {
      value: cloudtrail.trail.arn,
      description: 'ARN of the CloudTrail',
    });

    new TerraformOutput(this, 'database_secret_arn', {
      value: databaseSecret.secret.arn,
      description: 'ARN of the database credentials secret',
    });

    new TerraformOutput(this, 'api_keys_secret_arn', {
      value: apiKeysSecret.secret.arn,
      description: 'ARN of the API keys secret',
    });

    new TerraformOutput(this, 'kms_key_ids', {
      value: [
        appDataBucket.kmsKey.keyId,
        cloudtrailBucket.kmsKey.keyId,
        accessLogsBucket.kmsKey.keyId,
      ],
      description: 'IDs of the KMS keys used for S3 encryption',
    });
    // ! Do NOT create resources directly in this stack.
    // ! Instead, create separate stacks for each resource type.
  }
}
