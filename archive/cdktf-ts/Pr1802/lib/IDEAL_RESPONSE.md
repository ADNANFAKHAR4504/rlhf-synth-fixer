## modules.ts

```typescript
import { Construct } from 'constructs';
import { Vpc } from '@cdktf/provider-aws/lib/vpc';
import { Subnet } from '@cdktf/provider-aws/lib/subnet';
import { InternetGateway } from '@cdktf/provider-aws/lib/internet-gateway';
import { RouteTable } from '@cdktf/provider-aws/lib/route-table';
import { Route } from '@cdktf/provider-aws/lib/route';
import { RouteTableAssociation } from '@cdktf/provider-aws/lib/route-table-association';
import { SecurityGroup } from '@cdktf/provider-aws/lib/security-group';
import { KmsKey } from '@cdktf/provider-aws/lib/kms-key';
import { KmsAlias } from '@cdktf/provider-aws/lib/kms-alias';
import { S3Bucket } from '@cdktf/provider-aws/lib/s3-bucket';
import { S3BucketServerSideEncryptionConfigurationA } from '@cdktf/provider-aws/lib/s3-bucket-server-side-encryption-configuration';
import { s3BucketLogging } from '@cdktf/provider-aws';
import { S3BucketPublicAccessBlock } from '@cdktf/provider-aws/lib/s3-bucket-public-access-block';
import { S3BucketVersioningA } from '@cdktf/provider-aws/lib/s3-bucket-versioning';
import { IamRole } from '@cdktf/provider-aws/lib/iam-role';
import { IamPolicy } from '@cdktf/provider-aws/lib/iam-policy';
import { IamRolePolicyAttachment } from '@cdktf/provider-aws/lib/iam-role-policy-attachment';
import { LambdaFunction } from '@cdktf/provider-aws/lib/lambda-function';
import { CloudwatchLogGroup } from '@cdktf/provider-aws/lib/cloudwatch-log-group';
import { DataAwsCallerIdentity } from '@cdktf/provider-aws/lib/data-aws-caller-identity';

export interface SecureInfraConfig {
  vpcCidr: string;
  publicSubnetCidrs: string[];
  privateSubnetCidrs: string[];
  availabilityZones: string[];
  environment: string;
  projectName: string;
  awsRegion: string;
}

export class SecureInfrastructure extends Construct {
  public readonly vpc: Vpc;
  public readonly publicSubnets: Subnet[];
  public readonly privateSubnets: Subnet[];
  public readonly kmsKey: KmsKey;
  public readonly s3Bucket: S3Bucket;
  public readonly s3LoggingBucket: S3Bucket;
  public readonly lambdaRole: IamRole;
  public readonly lambdaFunction: LambdaFunction;
  public readonly lambdaLogGroup: CloudwatchLogGroup;

  constructor(scope: Construct, id: string, config: SecureInfraConfig) {
    super(scope, id);

    // Create VPC with DNS support enabled for proper service resolution
    this.vpc = new Vpc(this, 'secure-vpc', {
      cidrBlock: config.vpcCidr,
      enableDnsHostnames: true,
      enableDnsSupport: true,
      tags: {
        Name: `${config.projectName}-${config.environment}-vpc`,
        Environment: config.environment,
        // Tag for security compliance - helps identify resources in security audits
        SecurityCompliance: 'high',
      },
    });

    // Internet Gateway for public subnet internet access
    const igw = new InternetGateway(this, 'igw', {
      vpcId: this.vpc.id,
      tags: {
        Name: `${config.projectName}-${config.environment}-igw`,
        Environment: config.environment,
      },
    });

    // Create public subnets - these will host NAT gateways and load balancers
    this.publicSubnets = config.publicSubnetCidrs.map((cidr, index) => {
      return new Subnet(this, `public-subnet-${index}`, {
        vpcId: this.vpc.id,
        cidrBlock: cidr,
        availabilityZone: config.availabilityZones[index],
        mapPublicIpOnLaunch: true, // Auto-assign public IPs for NAT gateways
        tags: {
          Name: `${config.projectName}-${config.environment}-public-${index + 1}`,
          Type: 'public',
          Environment: config.environment,
        },
      });
    });

    // Create private subnets - these will host our secure workloads
    this.privateSubnets = config.privateSubnetCidrs.map((cidr, index) => {
      return new Subnet(this, `private-subnet-${index}`, {
        vpcId: this.vpc.id,
        cidrBlock: cidr,
        availabilityZone: config.availabilityZones[index],
        mapPublicIpOnLaunch: false, // No public IPs for security
        tags: {
          Name: `${config.projectName}-${config.environment}-private-${index + 1}`,
          Type: 'private',
          Environment: config.environment,
        },
      });
    });

    // Route table for public subnets
    const publicRouteTable = new RouteTable(this, 'public-rt', {
      vpcId: this.vpc.id,
      tags: {
        Name: `${config.projectName}-${config.environment}-public-rt`,
        Environment: config.environment,
      },
    });

    // Route to internet gateway for public subnets
    new Route(this, 'public-route', {
      routeTableId: publicRouteTable.id,
      destinationCidrBlock: '0.0.0.0/0',
      gatewayId: igw.id,
    });

    // Associate public subnets with public route table
    this.publicSubnets.forEach((subnet, index) => {
      new RouteTableAssociation(this, `public-rta-${index}`, {
        subnetId: subnet.id,
        routeTableId: publicRouteTable.id,
      });
    });

    const callerIdentity = new DataAwsCallerIdentity(this, 'current', {});

    // KMS key for encryption at rest - separate key for better security isolation
    this.kmsKey = new KmsKey(this, 'encryption-key', {
      description: `${config.projectName} ${config.environment} encryption key`,
      enableKeyRotation: true,
      deletionWindowInDays: 30,
      policy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Sid: 'Enable IAM User Permissions',
            Effect: 'Allow',
            Principal: {
              AWS: `arn:aws:iam::${callerIdentity.accountId}:root`,
            },
            Action: 'kms:*',
            Resource: '*',
          },
          {
            // Specific policy for CloudWatch Logs
            Sid: 'Allow CloudWatch Logs',
            Effect: 'Allow',
            Principal: {
              Service: `logs.${config.awsRegion}.amazonaws.com`, // Use actual region
            },
            Action: [
              'kms:Encrypt',
              'kms:Decrypt',
              'kms:ReEncrypt*',
              'kms:GenerateDataKey*',
              'kms:DescribeKey',
            ],
            Resource: '*',
            Condition: {
              ArnEquals: {
                'kms:EncryptionContext:aws:logs:arn': `arn:aws:logs:${config.awsRegion}:${callerIdentity.accountId}:log-group:/aws/lambda/${config.projectName}-${config.environment}-function`,
              },
            },
          },
          {
            Sid: 'Allow AWS Services',
            Effect: 'Allow',
            Principal: {
              Service: [
                's3.amazonaws.com',
                'lambda.amazonaws.com',
                'rds.amazonaws.com',
              ],
            },
            Action: [
              'kms:Decrypt',
              'kms:GenerateDataKey',
              'kms:CreateGrant',
              'kms:DescribeKey',
            ],
            Resource: '*',
          },
        ],
      }),
      tags: {
        Name: `${config.projectName}-${config.environment}-kms-key`,
        Environment: config.environment,
        Purpose: 'data-encryption',
      },
    });

    // KMS alias for easier key reference
    new KmsAlias(this, 'encryption-key-alias', {
      name: `alias/${config.projectName}-${config.environment}-encryption`,
      targetKeyId: this.kmsKey.keyId,
    });

    // S3 bucket for access logs - must be created first as main bucket depends on it
    this.s3LoggingBucket = new S3Bucket(this, 's3-access-logs', {
      bucket: `${config.projectName}-${config.environment}-access-logs-${Date.now()}`,
      // Force destroy allows Terraform to delete bucket even with objects
      forceDestroy: true,
      tags: {
        Name: `${config.projectName}-${config.environment}-access-logs`,
        Environment: config.environment,
        Purpose: 'access-logging',
      },
    });

    // Block all public access to logging bucket - security best practice
    new S3BucketPublicAccessBlock(this, 's3-logging-bucket-pab', {
      bucket: this.s3LoggingBucket.id,
      blockPublicAcls: true,
      blockPublicPolicy: true,
      ignorePublicAcls: true,
      restrictPublicBuckets: true,
    });

    // Enable versioning on logging bucket for audit trail integrity
    new S3BucketVersioningA(this, 's3-logging-bucket-versioning', {
      bucket: this.s3LoggingBucket.id,
      versioningConfiguration: {
        status: 'Enabled',
      },
    });

    // Encrypt logging bucket with KMS
    new S3BucketServerSideEncryptionConfigurationA(
      this,
      's3-logging-bucket-encryption',
      {
        bucket: this.s3LoggingBucket.id,
        rule: [
          {
            applyServerSideEncryptionByDefault: {
              sseAlgorithm: 'aws:kms',
              kmsMasterKeyId: this.kmsKey.arn,
            },
            // Encrypt all objects, not just new ones
            bucketKeyEnabled: true,
          },
        ],
      }
    );

    // Main S3 bucket for application data
    this.s3Bucket = new S3Bucket(this, 'main-s3-bucket', {
      bucket: `${config.projectName}-${config.environment}-data-${Date.now()}`,
      forceDestroy: true,
      tags: {
        Name: `${config.projectName}-${config.environment}-data`,
        Environment: config.environment,
        Purpose: 'application-data',
      },
    });

    // Block all public access to main bucket - critical security control
    new S3BucketPublicAccessBlock(this, 's3-bucket-pab', {
      bucket: this.s3Bucket.id,
      blockPublicAcls: true,
      blockPublicPolicy: true,
      ignorePublicAcls: true,
      restrictPublicBuckets: true,
    });

    // Enable versioning for data protection and compliance
    new S3BucketVersioningA(this, 's3-bucket-versioning', {
      bucket: this.s3Bucket.id,
      versioningConfiguration: {
        status: 'Enabled',
      },
    });

    // Encrypt main bucket with our KMS key
    new S3BucketServerSideEncryptionConfigurationA(
      this,
      's3-bucket-encryption',
      {
        bucket: this.s3Bucket.id,
        rule: [
          {
            applyServerSideEncryptionByDefault: {
              sseAlgorithm: 'aws:kms',
              kmsMasterKeyId: this.kmsKey.arn,
            },
            // Encrypt all objects, not just new ones
            bucketKeyEnabled: true,
          },
        ],
      }
    );

    // Enable access logging on main bucket - security monitoring requirement
    new s3BucketLogging.S3BucketLoggingA(this, 's3-bucket-logging', {
      bucket: this.s3Bucket.id,
      targetBucket: this.s3LoggingBucket.id,
      targetPrefix: 'access-logs/',
    });

    // CloudWatch Log Group for Lambda - created first to set retention and encryption
    this.lambdaLogGroup = new CloudwatchLogGroup(this, 'lambda-log-group', {
      name: `/aws/lambda/${config.projectName}-${config.environment}-function`,
      // Retain logs for 30 days for security analysis while managing costs
      retentionInDays: 30,
      // Encrypt logs with our KMS key
      kmsKeyId: this.kmsKey.arn,
      tags: {
        Name: `${config.projectName}-${config.environment}-lambda-logs`,
        Environment: config.environment,
        Purpose: 'lambda-logging',
      },
    });

    // IAM role for Lambda with minimal required permissions
    this.lambdaRole = new IamRole(this, 'lambda-execution-role', {
      name: `${config.projectName}-${config.environment}-lambda-role`,
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
      tags: {
        Name: `${config.projectName}-${config.environment}-lambda-role`,
        Environment: config.environment,
        Purpose: 'lambda-execution',
      },
    });

    // Custom policy with least privilege access for Lambda
    const lambdaPolicy = new IamPolicy(this, 'lambda-policy', {
      name: `${config.projectName}-${config.environment}-lambda-policy`,
      description: 'Minimal permissions for Lambda function',
      policy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            // CloudWatch Logs permissions - only for this specific log group
            Effect: 'Allow',
            Action: ['logs:CreateLogStream', 'logs:PutLogEvents'],
            Resource: `${this.lambdaLogGroup.arn}:*`,
          },
          {
            // VPC permissions for Lambda to run in private subnets
            Effect: 'Allow',
            Action: [
              'ec2:CreateNetworkInterface',
              'ec2:DescribeNetworkInterfaces',
              'ec2:DeleteNetworkInterface',
              'ec2:AttachNetworkInterface',
              'ec2:DetachNetworkInterface',
            ],
            Resource: '*', // These actions require * resource
          },
          {
            // Additional EC2 permissions needed for VPC Lambda
            Effect: 'Allow',
            Action: [
              'ec2:DescribeSubnets',
              'ec2:DescribeSecurityGroups',
              'ec2:DescribeVpcs',
            ],
            Resource: '*',
          },
          {
            // S3 permissions - only for our specific bucket
            Effect: 'Allow',
            Action: ['s3:GetObject', 's3:PutObject', 's3:DeleteObject'],
            Resource: `${this.s3Bucket.arn}/*`,
          },
          {
            // KMS permissions for decrypting/encrypting data
            Effect: 'Allow',
            Action: ['kms:Decrypt', 'kms:GenerateDataKey', 'kms:DescribeKey'],
            Resource: this.kmsKey.arn,
          },
        ],
      }),
    });

    // Attach custom policy to Lambda role
    new IamRolePolicyAttachment(this, 'lambda-policy-attachment', {
      role: this.lambdaRole.name,
      policyArn: lambdaPolicy.arn,
    });

    // Security group for Lambda - restrictive outbound rules
    const lambdaSecurityGroup = new SecurityGroup(this, 'lambda-sg', {
      name: `${config.projectName}-${config.environment}-lambda-sg`,
      description: 'Security group for Lambda function',
      vpcId: this.vpc.id,
      // No inbound rules - Lambda doesn't need inbound access
      egress: [
        {
          // HTTPS outbound for AWS API calls
          fromPort: 443,
          toPort: 443,
          protocol: 'tcp',
          cidrBlocks: ['0.0.0.0/0'],
          description: 'HTTPS outbound for AWS APIs',
        },
        {
          // DNS outbound for name resolution
          fromPort: 53,
          toPort: 53,
          protocol: 'udp',
          cidrBlocks: ['0.0.0.0/0'],
          description: 'DNS resolution',
        },
      ],
      tags: {
        Name: `${config.projectName}-${config.environment}-lambda-sg`,
        Environment: config.environment,
        Purpose: 'lambda-security',
      },
    });

    // Lambda function with security best practices
    this.lambdaFunction = new LambdaFunction(this, 'secure-lambda', {
      functionName: `${config.projectName}-${config.environment}-function`,
      role: this.lambdaRole.arn,
      handler: 'index.handler',
      runtime: 'python3.9',
      // Simple function code - in practice, this would come from a deployment package
      s3Bucket: 'corp-image-uploads',
      s3Key: 'lambda-deployment.zip',
      sourceCodeHash: 'dummy-hash', // This should be the actual file hash

      // Run Lambda in private subnets for security
      vpcConfig: {
        subnetIds: this.privateSubnets.map(subnet => subnet.id),
        securityGroupIds: [lambdaSecurityGroup.id],
      },

      // Environment variables with KMS encryption
      environment: {
        variables: {
          S3_BUCKET: this.s3Bucket.bucket,
          KMS_KEY_ID: this.kmsKey.keyId,
          ENVIRONMENT: config.environment,
        },
      },

      // Encrypt environment variables with our KMS key
      kmsKeyArn: this.kmsKey.arn,

      // Timeout and memory limits for cost control
      timeout: 30,
      memorySize: 128,

      // Explicit dependency on log group to ensure proper ordering
      dependsOn: [this.lambdaLogGroup],

      tags: {
        Name: `${config.projectName}-${config.environment}-function`,
        Environment: config.environment,
        Purpose: 'secure-processing',
      },
    });
  }
}
```

## tap-stack.ts

```typescript
import {
  AwsProvider,
  AwsProviderDefaultTags,
} from '@cdktf/provider-aws/lib/provider';
import { S3Backend, TerraformStack, TerraformOutput } from 'cdktf';
import { Construct } from 'constructs';

// ? Import your stacks here
import { SecureInfrastructure, SecureInfraConfig } from './modules';
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

const AWS_REGION_OVERRIDE = 'us-east-1';

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
            Project: 'SecureTap',
            ManagedBy: 'CDKTF',
            SecurityLevel: 'High',
            DataClassification: 'Confidential',
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

    // ? Add your stack instantiations here
    // Configuration for our secure infrastructure
    const infraConfig: SecureInfraConfig = {
      // VPC CIDR provides 65,536 IP addresses
      vpcCidr: '10.0.0.0/16',

      // Public subnets for NAT gateways and load balancers (256 IPs each)
      publicSubnetCidrs: ['10.0.1.0/24', '10.0.2.0/24'],

      // Private subnets for secure workloads (256 IPs each)
      privateSubnetCidrs: ['10.0.10.0/24', '10.0.20.0/24'],

      // Multi-AZ deployment for high availability
      availabilityZones: ['us-east-1a', 'us-east-1b'],

      environment: 'production',
      projectName: 'secure-tap',
      awsRegion: awsRegion,
    };

    // Create the secure infrastructure
    const infrastructure = new SecureInfrastructure(
      this,
      'secure-infrastructure',
      infraConfig
    );

    // Outputs for other stacks or external systems to reference

    // VPC information
    new TerraformOutput(this, 'vpc-id', {
      value: infrastructure.vpc.id,
      description: 'ID of the secure VPC',
      sensitive: false,
    });

    new TerraformOutput(this, 'vpc-cidr', {
      value: infrastructure.vpc.cidrBlock,
      description: 'CIDR block of the secure VPC',
      sensitive: false,
    });

    // Subnet information for deploying additional resources
    new TerraformOutput(this, 'private-subnet-ids', {
      value: infrastructure.privateSubnets.map(subnet => subnet.id),
      description: 'IDs of private subnets for secure workloads',
      sensitive: false,
    });

    new TerraformOutput(this, 'public-subnet-ids', {
      value: infrastructure.publicSubnets.map(subnet => subnet.id),
      description: 'IDs of public subnets for load balancers',
      sensitive: false,
    });

    // Security resources
    new TerraformOutput(this, 'kms-key-id', {
      value: infrastructure.kmsKey.keyId,
      description: 'KMS key ID for encryption',
      sensitive: false,
    });

    new TerraformOutput(this, 'kms-key-arn', {
      value: infrastructure.kmsKey.arn,
      description: 'KMS key ARN for encryption',
      sensitive: false,
    });

    // S3 resources
    new TerraformOutput(this, 'main-s3-bucket-name', {
      value: infrastructure.s3Bucket.bucket,
      description: 'Name of the main S3 bucket',
      sensitive: false,
    });

    new TerraformOutput(this, 'main-s3-bucket-arn', {
      value: infrastructure.s3Bucket.arn,
      description: 'ARN of the main S3 bucket',
      sensitive: false,
    });

    new TerraformOutput(this, 'logging-s3-bucket-name', {
      value: infrastructure.s3LoggingBucket.bucket,
      description: 'Name of the S3 access logging bucket',
      sensitive: false,
    });

    // Lambda resources
    new TerraformOutput(this, 'lambda-function-name', {
      value: infrastructure.lambdaFunction.functionName,
      description: 'Name of the secure Lambda function',
      sensitive: false,
    });

    new TerraformOutput(this, 'lambda-function-arn', {
      value: infrastructure.lambdaFunction.arn,
      description: 'ARN of the secure Lambda function',
      sensitive: false,
    });

    new TerraformOutput(this, 'lambda-role-arn', {
      value: infrastructure.lambdaRole.arn,
      description: 'ARN of the Lambda execution role',
      sensitive: false,
    });

    new TerraformOutput(this, 'lambda-log-group-name', {
      value: infrastructure.lambdaLogGroup.name,
      description: 'Name of the Lambda CloudWatch log group',
      sensitive: false,
    });

    // Security compliance outputs
    new TerraformOutput(this, 'security-summary', {
      value: {
        encryption_at_rest: 'Enabled with customer-managed KMS key',
        logging_enabled: 'S3 access logs and Lambda execution logs',
        network_isolation: 'All resources in private subnets',
        iam_compliance:
          'Least privilege policies with resource-specific permissions',
        public_access: 'Blocked on all S3 buckets',
        key_rotation: 'Enabled on KMS key',
        log_retention: '30 days for Lambda logs',
      },
      description: 'Security compliance summary',
      sensitive: false,
    });
    // ! Do NOT create resources directly in this stack.
    // ! Instead, create separate stacks for each resource type.
  }
}
```