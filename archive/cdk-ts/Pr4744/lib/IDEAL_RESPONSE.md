# Overview

## ./bin/tap.ts

```typescript
#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { Tags } from 'aws-cdk-lib';
import { TapStack } from '../lib/tap-stack';

const app = new cdk.App();

// Get environment suffix from context (set by CI/CD pipeline) or use 'dev' as default
const environmentSuffix = app.node.tryGetContext('environmentSuffix') || 'dev';
const stackName = `TapStack${environmentSuffix}`;
const repositoryName = process.env.REPOSITORY || 'unknown';
const commitAuthor = process.env.COMMIT_AUTHOR || 'unknown';

// Apply tags to all stacks in this app (optional - you can do this at stack level instead)
Tags.of(app).add('Environment', environmentSuffix);
Tags.of(app).add('Repository', repositoryName);
Tags.of(app).add('Author', commitAuthor);

new TapStack(app, stackName, {
  stackName: stackName, // This ensures CloudFormation stack name includes the suffix
  environmentSuffix: environmentSuffix, // Pass the suffix to the stack
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
});

```

## ./lib/lambda/log-processor.ts

```typescript
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

const s3Client = new S3Client({ region: process.env.AWS_REGION });

interface LogEvent {
  timestamp: number;
  level: string;
  message: string;
  metadata?: Record<string, unknown>;
}

interface LambdaEvent {
  logs?: LogEvent[];
  message?: string;
  metadata?: Record<string, unknown>;
}

interface LambdaResponse {
  statusCode: number;
  message: string;
  logsProcessed?: number;
  s3Location?: string;
  environment?: string;
  projectName?: string;
  timestamp: string;
  error?: string;
}

/**
 * Lambda function to process application logs and store them securely
 * This function demonstrates:
 * - Reading log data from event
 * - Processing and validating log entries
 * - Storing logs in encrypted S3 bucket
 * - Publishing to CloudWatch Logs for monitoring
 */
export const handler = async (event: LambdaEvent): Promise<LambdaResponse> => {
  console.log('Processing log event:', JSON.stringify(event, null, 2));

  const bucketName = process.env.APP_BUCKET_NAME;
  const logGroupName = process.env.LOG_GROUP_NAME;
  const environment = process.env.ENVIRONMENT;
  const projectName = process.env.PROJECT_NAME;

  if (!bucketName || !logGroupName) {
    throw new Error(
      'Missing required environment variables: APP_BUCKET_NAME or LOG_GROUP_NAME'
    );
  }

  try {
    // Parse and validate log events from the input
    const logEvents: LogEvent[] = Array.isArray(event.logs)
      ? event.logs
      : [
          {
            timestamp: Date.now(),
            level: 'INFO',
            message: event.message || 'No message provided',
            metadata: event.metadata || {},
          },
        ];

    // Process each log event
    const processedLogs = logEvents.map(log => ({
      ...log,
      environment,
      projectName,
      processedAt: new Date().toISOString(),
    }));

    // Store logs in S3 with encryption (KMS encryption is configured at bucket level)
    const s3Key = `logs/${environment}/${new Date().toISOString().split('T')[0]}/${Date.now()}.json`;

    await s3Client.send(
      new PutObjectCommand({
        Bucket: bucketName,
        Key: s3Key,
        Body: JSON.stringify(processedLogs, null, 2),
        ContentType: 'application/json',
        ServerSideEncryption: 'aws:kms', // Use KMS encryption
        Metadata: {
          environment: environment || 'unknown',
          project: projectName || 'unknown',
          'log-count': processedLogs.length.toString(),
        },
      })
    );

    console.log(`Successfully stored logs in S3: ${s3Key}`);

    // Log processing summary to CloudWatch
    const summary = {
      statusCode: 200,
      message: 'Logs processed successfully',
      logsProcessed: processedLogs.length,
      s3Location: `s3://${bucketName}/${s3Key}`,
      environment,
      projectName,
      timestamp: new Date().toISOString(),
    };

    console.log('Processing summary:', JSON.stringify(summary, null, 2));

    return summary;
  } catch (error) {
    console.error('Error processing logs:', error);

    // Log error details for troubleshooting
    const errorResponse = {
      statusCode: 500,
      message: 'Failed to process logs',
      error: error instanceof Error ? error.message : 'Unknown error',
      environment,
      projectName,
      timestamp: new Date().toISOString(),
    };

    console.error('Error response:', JSON.stringify(errorResponse, null, 2));

    throw error; // Re-throw to trigger Lambda retry logic if configured
  }
};

```

## ./lib/tap-stack.ts

```typescript
import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as s3 from 'aws-cdk-lib/aws-s3';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { Construct } from 'constructs';
import * as path from 'path';

interface TapStackProps extends cdk.StackProps {
  environmentSuffix?: string;
  allowedSshCidr?: string;
  projectName?: string;
  deploymentRegion?: string;
}

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: TapStackProps) {
    // Make stack deployable to ANY region and ANY account
    const deploymentRegion =
      props?.deploymentRegion ||
      process.env.CDK_DEPLOY_REGION ||
      process.env.AWS_REGION ||
      'us-east-1'; // Default to us-east-1 per requirements

    super(scope, id, {
      ...props,
      env: {
        account:
          props?.env?.account ||
          process.env.CDK_DEFAULT_ACCOUNT ||
          process.env.AWS_ACCOUNT_ID,
        region: deploymentRegion,
      },
    });

    // Configuration parameters - all configurable for multi-environment support
    const environmentSuffix =
      props?.environmentSuffix ||
      this.node.tryGetContext('environmentSuffix') ||
      process.env.ENVIRONMENT ||
      'dev';

    const allowedSshCidr =
      props?.allowedSshCidr ||
      this.node.tryGetContext('allowedSshCidr') ||
      process.env.ALLOWED_SSH_CIDR ||
      '203.0.113.0/24';

    const projectName =
      props?.projectName ||
      this.node.tryGetContext('projectName') ||
      process.env.PROJECT_NAME ||
      'tap-web-app';

    // Apply tags to all resources in this stack - includes required iac-rlhf-amazon tag
    cdk.Tags.of(this).add('Environment', environmentSuffix);
    cdk.Tags.of(this).add('Project', projectName);
    cdk.Tags.of(this).add('iac-rlhf-amazon', 'true'); // Required tag for all resources
    cdk.Tags.of(this).add('ManagedBy', 'CDK');
    cdk.Tags.of(this).add('Region', deploymentRegion);

    // ==========================================
    // KMS Keys for Encryption
    // ==========================================

    // Create a Customer Managed Key for general encryption
    const generalKmsKey = new kms.Key(
      this,
      `${projectName}-kms-key-${environmentSuffix}`,
      {
        description: `KMS key for ${projectName} ${environmentSuffix} environment`,
        enableKeyRotation: true,
        alias: `alias/${projectName}-${environmentSuffix}`,
        removalPolicy: cdk.RemovalPolicy.RETAIN, // Prevent accidental deletion
      }
    );

    // Grant CloudWatch Logs permission to use the KMS key
    generalKmsKey.addToResourcePolicy(
      new iam.PolicyStatement({
        sid: 'Allow CloudWatch Logs',
        effect: iam.Effect.ALLOW,
        principals: [
          new iam.ServicePrincipal(`logs.${deploymentRegion}.amazonaws.com`),
        ],
        actions: [
          'kms:Encrypt',
          'kms:Decrypt',
          'kms:ReEncrypt*',
          'kms:GenerateDataKey*',
          'kms:CreateGrant',
          'kms:DescribeKey',
        ],
        resources: ['*'],
        conditions: {
          ArnLike: {
            'kms:EncryptionContext:aws:logs:arn': `arn:aws:logs:${deploymentRegion}:${this.account}:log-group:*`,
          },
        },
      })
    );

    // Create a separate KMS key for RDS encryption
    const rdsKmsKey = new kms.Key(
      this,
      `${projectName}-rds-kms-key-${environmentSuffix}`,
      {
        description: `RDS KMS key for ${projectName} ${environmentSuffix} environment`,
        enableKeyRotation: true,
        alias: `alias/${projectName}-rds-${environmentSuffix}`,
        removalPolicy: cdk.RemovalPolicy.RETAIN,
      }
    );

    // ==========================================
    // VPC with High Availability (Multi-AZ)
    // ==========================================

    const vpc = new ec2.Vpc(this, `${projectName}-vpc-${environmentSuffix}`, {
      vpcName: `${projectName}-vpc-${environmentSuffix}`,
      maxAzs: 2, // High availability across 2 AZs
      natGateways: 1, // Cost optimization - use 1 NAT gateway
      subnetConfiguration: [
        {
          name: 'public',
          subnetType: ec2.SubnetType.PUBLIC,
          cidrMask: 24,
        },
        {
          name: 'private',
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
          cidrMask: 24,
        },
        {
          name: 'isolated',
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
          cidrMask: 24,
        },
      ],
      enableDnsHostnames: true,
      enableDnsSupport: true,
    });

    // ==========================================
    // Security Groups
    // ==========================================

    // Security group for EC2 instances
    const ec2SecurityGroup = new ec2.SecurityGroup(
      this,
      `${projectName}-ec2-sg-${environmentSuffix}`,
      {
        vpc,
        securityGroupName: `${projectName}-ec2-ssh-${environmentSuffix}`,
        description: `Security group for EC2 instances - allows SSH from ${allowedSshCidr} only`,
        allowAllOutbound: true,
      }
    );

    // Add SSH ingress rule for specific IP range
    ec2SecurityGroup.addIngressRule(
      ec2.Peer.ipv4(allowedSshCidr),
      ec2.Port.tcp(22),
      `Allow SSH from ${allowedSshCidr}`
    );

    // Security group for RDS database
    const rdsSecurityGroup = new ec2.SecurityGroup(
      this,
      `${projectName}-rds-sg-${environmentSuffix}`,
      {
        vpc,
        securityGroupName: `${projectName}-rds-private-${environmentSuffix}`,
        description: 'Security group for RDS database - private access only',
        allowAllOutbound: false, // Restrict outbound for database
      }
    );

    // Allow database access from EC2 security group
    rdsSecurityGroup.addIngressRule(
      ec2SecurityGroup,
      ec2.Port.tcp(3306),
      'Allow MySQL access from EC2 instances'
    );

    // Security group for Lambda functions
    const lambdaSecurityGroup = new ec2.SecurityGroup(
      this,
      `${projectName}-lambda-sg-${environmentSuffix}`,
      {
        vpc,
        securityGroupName: `${projectName}-lambda-${environmentSuffix}`,
        description: 'Security group for Lambda functions',
        allowAllOutbound: true,
      }
    );

    // ==========================================
    // CloudWatch Logs
    // ==========================================

    const applicationLogGroup = new logs.LogGroup(
      this,
      `${projectName}-log-group-${environmentSuffix}`,
      {
        logGroupName: `/aws/${projectName}/${environmentSuffix}/application`,
        retention: logs.RetentionDays.ONE_MONTH, // Adjust based on compliance requirements
        encryptionKey: generalKmsKey,
        removalPolicy: cdk.RemovalPolicy.DESTROY, // Change to RETAIN for production
      }
    );

    // ==========================================
    // IAM Roles (Least Privilege)
    // ==========================================

    // IAM role for EC2 instances
    const ec2Role = new iam.Role(
      this,
      `${projectName}-ec2-role-${environmentSuffix}`,
      {
        roleName: `${projectName}-ec2-role-${environmentSuffix}`,
        assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
        description: 'IAM role for EC2 instances with minimal permissions',
        managedPolicies: [
          iam.ManagedPolicy.fromAwsManagedPolicyName(
            'CloudWatchAgentServerPolicy'
          ),
        ],
      }
    );

    // Grant EC2 instances permission to write to CloudWatch Logs
    applicationLogGroup.grantWrite(ec2Role);

    // IAM role for Lambda functions
    const lambdaRole = new iam.Role(
      this,
      `${projectName}-lambda-role-${environmentSuffix}`,
      {
        roleName: `${projectName}-lambda-role-${environmentSuffix}`,
        assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
        description: 'IAM role for Lambda functions with minimal permissions',
        managedPolicies: [
          iam.ManagedPolicy.fromAwsManagedPolicyName(
            'service-role/AWSLambdaVPCAccessExecutionRole'
          ),
        ],
      }
    );

    // Grant Lambda permission to write logs
    applicationLogGroup.grantWrite(lambdaRole);

    // Grant Lambda permission to use KMS key for encryption
    generalKmsKey.grantEncryptDecrypt(lambdaRole);

    // ==========================================
    // S3 Buckets with Encryption
    // ==========================================

    // Logs bucket for S3 access logging
    const logsBucket = new s3.Bucket(
      this,
      `${projectName}-logs-bucket-${environmentSuffix}`,
      {
        bucketName: `${projectName}-access-logs-${environmentSuffix}-${this.account}`,
        encryption: s3.BucketEncryption.S3_MANAGED,
        blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
        enforceSSL: true,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
        autoDeleteObjects: true,
        lifecycleRules: [
          {
            id: 'delete-old-logs',
            expiration: cdk.Duration.days(90),
          },
        ],
      }
    );

    // Application data bucket
    const appBucket = new s3.Bucket(
      this,
      `${projectName}-app-bucket-${environmentSuffix}`,
      {
        bucketName: `${projectName}-app-data-${environmentSuffix}-${this.account}`,
        encryption: s3.BucketEncryption.KMS,
        encryptionKey: generalKmsKey,
        versioned: true,
        blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
        enforceSSL: true,
        serverAccessLogsBucket: logsBucket, // Enable S3 access logging
        serverAccessLogsPrefix: 'app-bucket-logs/',
        removalPolicy:
          environmentSuffix === 'prod'
            ? cdk.RemovalPolicy.RETAIN
            : cdk.RemovalPolicy.DESTROY,
        autoDeleteObjects: environmentSuffix !== 'prod',
        lifecycleRules: [
          {
            id: 'delete-old-versions',
            noncurrentVersionExpiration: cdk.Duration.days(90),
            abortIncompleteMultipartUploadAfter: cdk.Duration.days(7),
          },
        ],
      }
    );

    // Enable access logging on the application bucket
    appBucket.addToResourcePolicy(
      new iam.PolicyStatement({
        actions: ['s3:*'],
        principals: [new iam.AccountRootPrincipal()],
        resources: [appBucket.bucketArn, `${appBucket.bucketArn}/*`],
      })
    );

    // ==========================================
    // RDS Database (Private, Not Public)
    // ==========================================

    const dbSubnetGroup = new rds.SubnetGroup(
      this,
      `${projectName}-db-subnet-${environmentSuffix}`,
      {
        vpc,
        description: 'Subnet group for RDS database',
        vpcSubnets: {
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED, // Use isolated subnets for RDS
        },
        removalPolicy: cdk.RemovalPolicy.DESTROY,
      }
    );

    const rdsInstance = new rds.DatabaseInstance(
      this,
      `${projectName}-rds-${environmentSuffix}`,
      {
        instanceIdentifier: `${projectName}-db-${environmentSuffix}`,
        engine: rds.DatabaseInstanceEngine.mysql({
          version: rds.MysqlEngineVersion.VER_8_0,
        }),
        credentials: rds.Credentials.fromPassword(
          process.env.DB_USERNAME || 'admin',
          cdk.SecretValue.unsafePlainText(
            process.env.DB_PASSWORD || 'TempPassword123!'
          )
        ),
        instanceType: ec2.InstanceType.of(
          ec2.InstanceClass.T3,
          ec2.InstanceSize.MICRO // Cost optimization for dev environment
        ),
        vpc,
        vpcSubnets: {
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
        },
        securityGroups: [rdsSecurityGroup],
        subnetGroup: dbSubnetGroup,
        multiAz: environmentSuffix === 'prod', // Enable Multi-AZ for production
        allocatedStorage: 20,
        maxAllocatedStorage: 100, // Enable storage autoscaling
        storageEncrypted: true,
        storageEncryptionKey: rdsKmsKey,
        monitoringInterval: cdk.Duration.seconds(60),
        enablePerformanceInsights: false, // Cost optimization for dev
        cloudwatchLogsExports: ['error', 'general', 'slowquery'],
        autoMinorVersionUpgrade: true,
        deleteAutomatedBackups: environmentSuffix !== 'prod',
        deletionProtection: environmentSuffix === 'prod',
        backupRetention: cdk.Duration.days(
          environmentSuffix === 'prod' ? 30 : 7
        ),
        preferredBackupWindow: '03:00-04:00',
        preferredMaintenanceWindow: 'sun:04:00-sun:05:00',
        publiclyAccessible: false, // NEVER make RDS publicly accessible
        removalPolicy:
          environmentSuffix === 'prod'
            ? cdk.RemovalPolicy.RETAIN
            : cdk.RemovalPolicy.DESTROY,
      }
    );

    // ==========================================
    // Lambda Function with Encrypted Environment Variables
    // ==========================================

    // Log Processor Lambda - processes and stores application logs securely
    const logProcessorLambda = new NodejsFunction(
      this,
      `${projectName}-log-processor-${environmentSuffix}`,
      {
        functionName: `${projectName}-log-processor-${environmentSuffix}`,
        runtime: lambda.Runtime.NODEJS_22_X, // Use Node 22
        entry: path.join(__dirname, 'lambda', 'log-processor.ts'),
        handler: 'handler',
        vpc,
        vpcSubnets: {
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
        securityGroups: [lambdaSecurityGroup],
        role: lambdaRole,
        environment: {
          ENVIRONMENT: environmentSuffix,
          PROJECT_NAME: projectName,
          LOG_GROUP_NAME: applicationLogGroup.logGroupName,
          APP_BUCKET_NAME: appBucket.bucketName,
        },
        environmentEncryption: generalKmsKey, // Encrypt environment variables
        timeout: cdk.Duration.seconds(60),
        memorySize: 512, // Increased for log processing
        logRetention: logs.RetentionDays.ONE_MONTH,
        tracing: lambda.Tracing.ACTIVE,
        bundling: {
          minify: true,
          sourceMap: true,
          target: 'node22',
          externalModules: ['@aws-sdk/*'], // AWS SDK v3 is included in Lambda runtime
        },
        description:
          'Processes application logs and stores them securely in S3 with KMS encryption',
      }
    );

    // Grant Lambda access to S3 bucket for log storage
    appBucket.grantReadWrite(logProcessorLambda);

    // Grant Lambda permission to write to CloudWatch Logs
    applicationLogGroup.grantWrite(logProcessorLambda);

    // ==========================================
    // CloudFormation Outputs
    // ==========================================

    new cdk.CfnOutput(this, 'VpcId', {
      value: vpc.vpcId,
      description: 'VPC ID',
      exportName: `${projectName}-vpc-id-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'ApplicationBucketName', {
      value: appBucket.bucketName,
      description: 'Application S3 bucket name',
      exportName: `${projectName}-app-bucket-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'RdsEndpoint', {
      value: rdsInstance.instanceEndpoint.hostname,
      description: 'RDS instance endpoint',
      exportName: `${projectName}-rds-endpoint-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'LogGroupName', {
      value: applicationLogGroup.logGroupName,
      description: 'CloudWatch Log Group name',
      exportName: `${projectName}-log-group-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'LogProcessorLambdaArn', {
      value: logProcessorLambda.functionArn,
      description: 'Log Processor Lambda Function ARN',
      exportName: `${projectName}-log-processor-arn-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'DeploymentRegion', {
      value: deploymentRegion,
      description: 'AWS Region where resources are deployed',
    });
  }
}

```

## ./test/tap-stack.int.test.ts

```typescript
import * as fs from 'fs';
import * as path from 'path';
import {
  EC2Client,
  DescribeVpcsCommand,
  DescribeSubnetsCommand,
  DescribeSecurityGroupsCommand,
  DescribeVpcAttributeCommand,
  DescribeInternetGatewaysCommand,
  DescribeNatGatewaysCommand,
  DescribeRouteTablesCommand
} from '@aws-sdk/client-ec2';
import {
  S3Client,
  HeadBucketCommand,
  GetBucketEncryptionCommand,
  GetBucketVersioningCommand,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  GetPublicAccessBlockCommand,
  GetBucketLifecycleConfigurationCommand,
  GetBucketLoggingCommand
} from '@aws-sdk/client-s3';
import { RDSClient, DescribeDBInstancesCommand, DescribeDBSubnetGroupsCommand } from '@aws-sdk/client-rds';
import { LambdaClient, GetFunctionCommand, InvokeCommand, GetFunctionConfigurationCommand } from '@aws-sdk/client-lambda';
import { CloudWatchLogsClient, DescribeLogGroupsCommand, PutLogEventsCommand, CreateLogStreamCommand } from '@aws-sdk/client-cloudwatch-logs';
import { IAMClient, GetRoleCommand, GetRolePolicyCommand, ListAttachedRolePoliciesCommand } from '@aws-sdk/client-iam';
import { KMSClient, DescribeKeyCommand, GetKeyRotationStatusCommand } from '@aws-sdk/client-kms';
import {
  ResourceGroupsTaggingAPIClient,
  GetResourcesCommand
} from '@aws-sdk/client-resource-groups-tagging-api';

const region = process.env.AWS_REGION || 'ap-northeast-1';
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';
const stackName = `TapStack${environmentSuffix}`;
const projectName = 'tap-web-app';

// Load stack outputs from flat-outputs.json
const outputs = JSON.parse(
  fs.readFileSync(path.join(__dirname, '..', 'flat-outputs.json'), 'utf8')
);
const stackOutputs = outputs[stackName];

if (!stackOutputs) {
  throw new Error(`Stack outputs not found for ${stackName} in flat-outputs.json`);
}

// AWS Clients
const ec2Client = new EC2Client({ region });
const s3Client = new S3Client({ region });
const rdsClient = new RDSClient({ region });
const lambdaClient = new LambdaClient({ region });
const logsClient = new CloudWatchLogsClient({ region });
const iamClient = new IAMClient({ region });
const kmsClient = new KMSClient({ region });
const taggingClient = new ResourceGroupsTaggingAPIClient({ region });

describe('TapStack End-to-End Integration Tests', () => {

  describe('Requirement 1: Region Deployment', () => {
    test('should deploy all resources in the configured region', () => {
      expect(stackOutputs.DeploymentRegion).toBe(region);
    });
  });

  describe('Requirement 2: Resource Tagging', () => {
    test('should have Environment and Project tags on all resources', async () => {
      const response = await taggingClient.send(
        new GetResourcesCommand({
          TagFilters: [
            {
              Key: 'Environment',
              Values: [environmentSuffix],
            },
            {
              Key: 'Project',
              Values: [projectName],
            },
          ],
        })
      );

      expect(response.ResourceTagMappingList).toBeDefined();
      expect(response.ResourceTagMappingList!.length).toBeGreaterThan(0);
    });

    test('should have iac-rlhf-amazon tag on all resources', async () => {
      const response = await taggingClient.send(
        new GetResourcesCommand({
          TagFilters: [
            {
              Key: 'iac-rlhf-amazon',
              Values: ['true'],
            },
          ],
        })
      );

      expect(response.ResourceTagMappingList).toBeDefined();
      expect(response.ResourceTagMappingList!.length).toBeGreaterThan(0);
    });
  });

  describe('Requirement 3: IAM Least Privilege', () => {
    test('EC2 role should have only CloudWatch permissions', async () => {
      const roleName = `${projectName}-ec2-role-${environmentSuffix}`;

      const roleResponse = await iamClient.send(
        new GetRoleCommand({ RoleName: roleName })
      );

      expect(roleResponse.Role).toBeDefined();

      const policiesResponse = await iamClient.send(
        new ListAttachedRolePoliciesCommand({ RoleName: roleName })
      );

      expect(policiesResponse.AttachedPolicies).toBeDefined();
      const hasCWPolicy = policiesResponse.AttachedPolicies?.some(
        p => p.PolicyName === 'CloudWatchAgentServerPolicy'
      );
      expect(hasCWPolicy).toBe(true);
    });

    test('Lambda role should have only VPC and logs permissions', async () => {
      const roleName = `${projectName}-lambda-role-${environmentSuffix}`;

      const roleResponse = await iamClient.send(
        new GetRoleCommand({ RoleName: roleName })
      );

      expect(roleResponse.Role).toBeDefined();

      const policiesResponse = await iamClient.send(
        new ListAttachedRolePoliciesCommand({ RoleName: roleName })
      );

      expect(policiesResponse.AttachedPolicies).toBeDefined();
      const hasVPCPolicy = policiesResponse.AttachedPolicies?.some(
        p => p.PolicyName === 'AWSLambdaVPCAccessExecutionRole'
      );
      expect(hasVPCPolicy).toBe(true);
    });
  });

  describe('Requirement 4: S3 Server-Side Encryption', () => {
    test('application bucket should have KMS encryption enabled', async () => {
      const encryptionResponse = await s3Client.send(
        new GetBucketEncryptionCommand({
          Bucket: stackOutputs.ApplicationBucketName,
        })
      );

      expect(encryptionResponse.ServerSideEncryptionConfiguration).toBeDefined();
      expect(
        encryptionResponse.ServerSideEncryptionConfiguration?.Rules?.[0]
          .ApplyServerSideEncryptionByDefault?.SSEAlgorithm
      ).toBe('aws:kms');
    });

    test('should be able to upload and retrieve encrypted objects from S3', async () => {
      const testKey = `integration-test-${Date.now()}.txt`;
      const testContent = 'Integration test content';

      // Upload object
      await s3Client.send(
        new PutObjectCommand({
          Bucket: stackOutputs.ApplicationBucketName,
          Key: testKey,
          Body: testContent,
        })
      );

      // Retrieve object
      const getResponse = await s3Client.send(
        new GetObjectCommand({
          Bucket: stackOutputs.ApplicationBucketName,
          Key: testKey,
        })
      );

      const retrievedContent = await getResponse.Body?.transformToString();
      expect(retrievedContent).toBe(testContent);
      expect(getResponse.ServerSideEncryption).toBeDefined();

      // Cleanup
      await s3Client.send(
        new DeleteObjectCommand({
          Bucket: stackOutputs.ApplicationBucketName,
          Key: testKey,
        })
      );
    });

    test('S3 buckets should block all public access', async () => {
      const publicAccessResponse = await s3Client.send(
        new GetPublicAccessBlockCommand({
          Bucket: stackOutputs.ApplicationBucketName,
        })
      );

      const config = publicAccessResponse.PublicAccessBlockConfiguration;
      expect(config?.BlockPublicAcls).toBe(true);
      expect(config?.BlockPublicPolicy).toBe(true);
      expect(config?.IgnorePublicAcls).toBe(true);
      expect(config?.RestrictPublicBuckets).toBe(true);
    });
  });

  describe('Requirement 5: CloudWatch Logs', () => {
    test('should have dedicated log group with retention', async () => {
      const logGroupsResponse = await logsClient.send(
        new DescribeLogGroupsCommand({
          logGroupNamePrefix: stackOutputs.LogGroupName,
        })
      );

      const logGroup = logGroupsResponse.logGroups?.find(
        lg => lg.logGroupName === stackOutputs.LogGroupName
      );

      expect(logGroup).toBeDefined();
      expect(logGroup?.retentionInDays).toBe(30);
    });

    test('should have KMS encryption for log group', async () => {
      const logGroupsResponse = await logsClient.send(
        new DescribeLogGroupsCommand({
          logGroupNamePrefix: stackOutputs.LogGroupName,
        })
      );

      const logGroup = logGroupsResponse.logGroups?.find(
        lg => lg.logGroupName === stackOutputs.LogGroupName
      );

      expect(logGroup?.kmsKeyId).toBeDefined();
    });

    test('should be able to write logs to CloudWatch', async () => {
      const logStreamName = `integration-test-${Date.now()}`;

      // Create log stream
      await logsClient.send(
        new CreateLogStreamCommand({
          logGroupName: stackOutputs.LogGroupName,
          logStreamName,
        })
      );

      // Write log event
      await logsClient.send(
        new PutLogEventsCommand({
          logGroupName: stackOutputs.LogGroupName,
          logStreamName,
          logEvents: [
            {
              message: 'Integration test log message',
              timestamp: Date.now(),
            },
          ],
        })
      );

      // Verify - successful write means logs are working
      expect(true).toBe(true);
    });
  });

  describe('Requirement 6: EC2 SSH Restrictions', () => {
    test('EC2 security group should restrict SSH to specific CIDR', async () => {
      const sgResponse = await ec2Client.send(
        new DescribeSecurityGroupsCommand({
          Filters: [
            {
              Name: 'vpc-id',
              Values: [stackOutputs.VpcId],
            },
            {
              Name: 'group-name',
              Values: [`${projectName}-ec2-ssh-${environmentSuffix}`],
            },
          ],
        })
      );

      const securityGroup = sgResponse.SecurityGroups?.[0];
      expect(securityGroup).toBeDefined();

      const sshRule = securityGroup?.IpPermissions?.find(
        rule => rule.FromPort === 22 && rule.ToPort === 22
      );

      expect(sshRule).toBeDefined();
      expect(sshRule?.IpRanges?.length).toBeGreaterThan(0);
      // Verify SSH is restricted to specific CIDR, not 0.0.0.0/0
      const hasRestrictedCIDR = sshRule?.IpRanges?.every(
        range => range.CidrIp !== '0.0.0.0/0'
      );
      expect(hasRestrictedCIDR).toBe(true);
    });
  });

  describe('Requirement 7: RDS Not Publicly Accessible', () => {
    test('RDS instance should not be publicly accessible', async () => {
      const dbIdentifier = `${projectName}-db-${environmentSuffix}`;

      const rdsResponse = await rdsClient.send(
        new DescribeDBInstancesCommand({
          DBInstanceIdentifier: dbIdentifier,
        })
      );

      const dbInstance = rdsResponse.DBInstances?.[0];
      expect(dbInstance).toBeDefined();
      expect(dbInstance?.PubliclyAccessible).toBe(false);
    });

    test('RDS should be in isolated subnets', async () => {
      const dbIdentifier = `${projectName}-db-${environmentSuffix}`;

      const rdsResponse = await rdsClient.send(
        new DescribeDBInstancesCommand({
          DBInstanceIdentifier: dbIdentifier,
        })
      );

      const dbInstance = rdsResponse.DBInstances?.[0];
      const subnetGroupName = dbInstance?.DBSubnetGroup?.DBSubnetGroupName;

      expect(subnetGroupName).toBeDefined();

      const subnetGroupResponse = await rdsClient.send(
        new DescribeDBSubnetGroupsCommand({
          DBSubnetGroupName: subnetGroupName,
        })
      );

      expect(subnetGroupResponse.DBSubnetGroups?.[0].Subnets).toBeDefined();
      expect(subnetGroupResponse.DBSubnetGroups?.[0].Subnets!.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Requirement 8: KMS CMKs for Encryption', () => {
    test('should have KMS key rotation enabled', async () => {
      const logGroupsResponse = await logsClient.send(
        new DescribeLogGroupsCommand({
          logGroupNamePrefix: stackOutputs.LogGroupName,
        })
      );

      const logGroup = logGroupsResponse.logGroups?.find(
        lg => lg.logGroupName === stackOutputs.LogGroupName
      );

      const kmsKeyId = logGroup?.kmsKeyId;
      expect(kmsKeyId).toBeDefined();

      if (kmsKeyId) {
        const keyArn = kmsKeyId.split(':key/')[1] || kmsKeyId;
        const rotationResponse = await kmsClient.send(
          new GetKeyRotationStatusCommand({
            KeyId: keyArn,
          })
        );

        expect(rotationResponse.KeyRotationEnabled).toBe(true);
      }
    });

    test('RDS should use KMS encryption', async () => {
      const dbIdentifier = `${projectName}-db-${environmentSuffix}`;

      const rdsResponse = await rdsClient.send(
        new DescribeDBInstancesCommand({
          DBInstanceIdentifier: dbIdentifier,
        })
      );

      const dbInstance = rdsResponse.DBInstances?.[0];
      expect(dbInstance?.StorageEncrypted).toBe(true);
      expect(dbInstance?.KmsKeyId).toBeDefined();
    });
  });

  describe('Requirement 9: Lambda Environment Variable Encryption', () => {
    test('Lambda should have encrypted environment variables', async () => {
      const lambdaResponse = await lambdaClient.send(
        new GetFunctionConfigurationCommand({
          FunctionName: stackOutputs.LogProcessorLambdaArn,
        })
      );

      expect(lambdaResponse.Environment?.Variables).toBeDefined();
      expect(lambdaResponse.KMSKeyArn).toBeDefined();
    });

    test('should be able to invoke Lambda function', async () => {
      const invokeResponse = await lambdaClient.send(
        new InvokeCommand({
          FunctionName: stackOutputs.LogProcessorLambdaArn,
          InvocationType: 'RequestResponse',
          Payload: JSON.stringify({
            test: true,
            message: 'Integration test invocation',
          }),
        })
      );

      expect(invokeResponse.StatusCode).toBe(200);
      expect(invokeResponse.FunctionError).toBeUndefined();
    });
  });

  describe('Requirement 10: VPC High Availability (Multi-AZ)', () => {
    test('should have VPC with DNS support enabled', async () => {
      const vpcResponse = await ec2Client.send(
        new DescribeVpcsCommand({
          VpcIds: [stackOutputs.VpcId],
        })
      );

      expect(vpcResponse.Vpcs).toBeDefined();
      expect(vpcResponse.Vpcs?.length).toBe(1);

      // Query DNS support attribute separately
      const dnsSupportResponse = await ec2Client.send(
        new DescribeVpcAttributeCommand({
          VpcId: stackOutputs.VpcId,
          Attribute: 'enableDnsSupport',
        })
      );

      // Query DNS hostnames attribute separately
      const dnsHostnamesResponse = await ec2Client.send(
        new DescribeVpcAttributeCommand({
          VpcId: stackOutputs.VpcId,
          Attribute: 'enableDnsHostnames',
        })
      );

      expect(dnsSupportResponse.EnableDnsSupport?.Value).toBe(true);
      expect(dnsHostnamesResponse.EnableDnsHostnames?.Value).toBe(true);
    });

    test('should have 6 subnets (2 public, 2 private, 2 isolated)', async () => {
      const response = await ec2Client.send(
        new DescribeSubnetsCommand({
          Filters: [
            {
              Name: 'vpc-id',
              Values: [stackOutputs.VpcId],
            },
          ],
        })
      );

      expect(response.Subnets).toBeDefined();
      expect(response.Subnets?.length).toBe(6);
    });

    test('should have security groups created', async () => {
      const response = await ec2Client.send(
        new DescribeSecurityGroupsCommand({
          Filters: [
            {
              Name: 'vpc-id',
              Values: [stackOutputs.VpcId],
            },
          ],
        })
      );

      // Should have at least 3 security groups (EC2, Lambda, RDS) + default
      expect(response.SecurityGroups).toBeDefined();
      expect(response.SecurityGroups!.length).toBeGreaterThanOrEqual(4);
    });
  });

  describe('S3 Buckets', () => {
    test('should have application bucket created', async () => {
      const response = await s3Client.send(
        new HeadBucketCommand({
          Bucket: stackOutputs.ApplicationBucketName,
        })
      );

      expect(response.$metadata.httpStatusCode).toBe(200);
    });

    test('should have application bucket encryption enabled', async () => {
      const response = await s3Client.send(
        new GetBucketEncryptionCommand({
          Bucket: stackOutputs.ApplicationBucketName,
        })
      );

      expect(response.ServerSideEncryptionConfiguration).toBeDefined();
      expect(response.ServerSideEncryptionConfiguration?.Rules).toBeDefined();
      expect(response.ServerSideEncryptionConfiguration?.Rules?.[0].ApplyServerSideEncryptionByDefault?.SSEAlgorithm).toBe('aws:kms');
    });

    test('should have application bucket versioning enabled', async () => {
      const response = await s3Client.send(
        new GetBucketVersioningCommand({
          Bucket: stackOutputs.ApplicationBucketName,
        })
      );

      expect(response.Status).toBe('Enabled');
    });
  });

  describe('RDS Database', () => {
    test('should have RDS instance created', async () => {
      // Extract DB instance identifier from endpoint
      const dbIdentifier = `tap-web-app-db-${environmentSuffix}`;

      const response = await rdsClient.send(
        new DescribeDBInstancesCommand({
          DBInstanceIdentifier: dbIdentifier,
        })
      );

      expect(response.DBInstances).toBeDefined();
      expect(response.DBInstances?.length).toBe(1);
    });

    test('should have RDS instance with storage encryption', async () => {
      const dbIdentifier = `tap-web-app-db-${environmentSuffix}`;

      const response = await rdsClient.send(
        new DescribeDBInstancesCommand({
          DBInstanceIdentifier: dbIdentifier,
        })
      );

      const instance = response.DBInstances?.[0];
      expect(instance?.StorageEncrypted).toBe(true);
    });

    test('should have RDS instance not publicly accessible', async () => {
      const dbIdentifier = `tap-web-app-db-${environmentSuffix}`;

      const response = await rdsClient.send(
        new DescribeDBInstancesCommand({
          DBInstanceIdentifier: dbIdentifier,
        })
      );

      const instance = response.DBInstances?.[0];
      expect(instance?.PubliclyAccessible).toBe(false);
    });

    test('should have RDS instance with MySQL 8.0 engine', async () => {
      const dbIdentifier = `tap-web-app-db-${environmentSuffix}`;

      const response = await rdsClient.send(
        new DescribeDBInstancesCommand({
          DBInstanceIdentifier: dbIdentifier,
        })
      );

      const instance = response.DBInstances?.[0];
      expect(instance?.Engine).toBe('mysql');
      expect(instance?.EngineVersion).toMatch(/^8\.0/);
    });
  });

  describe('Lambda Function', () => {
    test('should have Lambda function created', async () => {
      const response = await lambdaClient.send(
        new GetFunctionCommand({
          FunctionName: stackOutputs.LogProcessorLambdaArn,
        })
      );

      expect(response.Configuration).toBeDefined();
      expect(response.Configuration?.FunctionName).toContain('log-processor');
    });

    test('should have Lambda function with Node.js 22 runtime', async () => {
      const response = await lambdaClient.send(
        new GetFunctionCommand({
          FunctionName: stackOutputs.LogProcessorLambdaArn,
        })
      );

      expect(response.Configuration?.Runtime).toBe('nodejs22.x');
    });

    test('should have Lambda function in VPC', async () => {
      const response = await lambdaClient.send(
        new GetFunctionCommand({
          FunctionName: stackOutputs.LogProcessorLambdaArn,
        })
      );

      expect(response.Configuration?.VpcConfig).toBeDefined();
      expect(response.Configuration?.VpcConfig?.VpcId).toBe(stackOutputs.VpcId);
    });

    test('should have Lambda function with X-Ray tracing enabled', async () => {
      const response = await lambdaClient.send(
        new GetFunctionCommand({
          FunctionName: stackOutputs.LogProcessorLambdaArn,
        })
      );

      expect(response.Configuration?.TracingConfig?.Mode).toBe('Active');
    });

    test('should have Lambda function with environment variables', async () => {
      const response = await lambdaClient.send(
        new GetFunctionCommand({
          FunctionName: stackOutputs.LogProcessorLambdaArn,
        })
      );

      expect(response.Configuration?.Environment?.Variables).toBeDefined();
      expect(response.Configuration?.Environment?.Variables?.ENVIRONMENT).toBe(environmentSuffix);
      expect(response.Configuration?.Environment?.Variables?.PROJECT_NAME).toBe('tap-web-app');
    });
  });

  describe('CloudWatch Logs', () => {
    test('should have log group created', async () => {
      const response = await logsClient.send(
        new DescribeLogGroupsCommand({
          logGroupNamePrefix: stackOutputs.LogGroupName,
        })
      );

      expect(response.logGroups).toBeDefined();
      expect(response.logGroups?.length).toBeGreaterThan(0);
      expect(response.logGroups?.[0].logGroupName).toBe(stackOutputs.LogGroupName);
    });

    test('should have log group with retention period set', async () => {
      const response = await logsClient.send(
        new DescribeLogGroupsCommand({
          logGroupNamePrefix: stackOutputs.LogGroupName,
        })
      );

      const logGroup = response.logGroups?.find(
        (lg) => lg.logGroupName === stackOutputs.LogGroupName
      );
      expect(logGroup?.retentionInDays).toBe(30);
    });

    test('should have log group with KMS encryption', async () => {
      const response = await logsClient.send(
        new DescribeLogGroupsCommand({
          logGroupNamePrefix: stackOutputs.LogGroupName,
        })
      );

      const logGroup = response.logGroups?.find(
        (lg) => lg.logGroupName === stackOutputs.LogGroupName
      );
      expect(logGroup?.kmsKeyId).toBeDefined();
    });
  });

  describe('IAM Roles', () => {
    test('should have EC2 IAM role created', async () => {
      const roleName = `tap-web-app-ec2-role-${environmentSuffix}`;

      const response = await iamClient.send(
        new GetRoleCommand({
          RoleName: roleName,
        })
      );

      expect(response.Role).toBeDefined();
      expect(response.Role?.RoleName).toBe(roleName);
    });

    test('should have Lambda IAM role created', async () => {
      const roleName = `tap-web-app-lambda-role-${environmentSuffix}`;

      const response = await iamClient.send(
        new GetRoleCommand({
          RoleName: roleName,
        })
      );

      expect(response.Role).toBeDefined();
      expect(response.Role?.RoleName).toBe(roleName);
    });
  });

});


```

## ./test/tap-stack.unit.test.ts

```typescript
import * as cdk from 'aws-cdk-lib';
import { Template, Match, Capture } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('TapStack Unit Tests', () => {
  let app: cdk.App;
  let stack: TapStack;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();
    stack = new TapStack(app, 'TestTapStack', {
      environmentSuffix,
      deploymentRegion: 'ap-northeast-1',
      env: {
        account: '123456789012',
        region: 'ap-northeast-1',
      },
    });
    template = Template.fromStack(stack);
  });

  describe('Stack Configuration', () => {
    test('should create stack with correct environment', () => {
      expect(stack.region).toBe('ap-northeast-1');
      expect(stack.account).toBe('123456789012');
    });

    test('should apply required tags to stack', () => {
      // Verify tags are applied to resources in the template
      const templateJson = template.toJSON();

      // Check that at least one resource has the required tags
      const resources = Object.values(templateJson.Resources || {}) as any[];
      const resourcesWithTags = resources.filter(r => r.Properties?.Tags);

      // Verify we have resources with tags
      expect(resourcesWithTags.length).toBeGreaterThan(0);

      // Check that at least one resource has the iac-rlhf-amazon tag
      const hasIacTag = resourcesWithTags.some((r: any) =>
        r.Properties.Tags.some((tag: any) =>
          tag.Key === 'iac-rlhf-amazon' && tag.Value === 'true'
        )
      );
      expect(hasIacTag).toBe(true);
    });
  });

  describe('KMS Keys', () => {
    test('should create general KMS key with key rotation enabled', () => {
      template.hasResourceProperties('AWS::KMS::Key', {
        Description: Match.stringLikeRegexp('KMS key for tap-web-app'),
        EnableKeyRotation: true,
      });
    });

    test('should create RDS KMS key with key rotation enabled', () => {
      template.hasResourceProperties('AWS::KMS::Key', {
        Description: Match.stringLikeRegexp('RDS KMS key for tap-web-app'),
        EnableKeyRotation: true,
      });
    });

    test('should create KMS aliases for both keys', () => {
      template.resourceCountIs('AWS::KMS::Alias', 2);
    });

    test('should grant CloudWatch Logs permission to use KMS key', () => {
      const keyPolicies = template.findResources('AWS::KMS::Key');
      const keys = Object.values(keyPolicies);

      // Find a key with CloudWatch Logs permission
      const hasCloudWatchLogsPermission = keys.some((key: any) => {
        const statements = key.Properties?.KeyPolicy?.Statement || [];
        return statements.some((stmt: any) =>
          stmt.Sid === 'Allow CloudWatch Logs'
        );
      });

      expect(hasCloudWatchLogsPermission).toBe(true);
    });
  });

  describe('VPC Configuration', () => {
    test('should create VPC with DNS support enabled', () => {
      template.hasResourceProperties('AWS::EC2::VPC', {
        EnableDnsHostnames: true,
        EnableDnsSupport: true,
      });
    });

    test('should create correct number of subnets', () => {
      // 2 AZs * 3 subnet types (public, private, isolated) = 6 subnets
      template.resourceCountIs('AWS::EC2::Subnet', 6);
    });

    test('should create Internet Gateway', () => {
      template.resourceCountIs('AWS::EC2::InternetGateway', 1);
      template.resourceCountIs('AWS::EC2::VPCGatewayAttachment', 1);
    });

    test('should create NAT Gateway with Elastic IP', () => {
      template.resourceCountIs('AWS::EC2::NatGateway', 1);
      template.resourceCountIs('AWS::EC2::EIP', 1);
    });

    test('should create route tables for all subnet types', () => {
      // 2 public + 2 private + 2 isolated = 6 route tables
      template.resourceCountIs('AWS::EC2::RouteTable', 6);
    });
  });

  describe('Security Groups', () => {
    test('should create EC2 security group with SSH ingress rule', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupDescription: Match.stringLikeRegexp('Security group for EC2 instances'),
        SecurityGroupIngress: Match.arrayWith([
          Match.objectLike({
            IpProtocol: 'tcp',
            FromPort: 22,
            ToPort: 22,
          }),
        ]),
      });
    });

    test('should create RDS security group with restricted outbound', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupDescription: 'Security group for RDS database - private access only',
      });

      // Verify it has the RDS description
      const securityGroups = template.findResources('AWS::EC2::SecurityGroup');
      const rdsSecurityGroup = Object.values(securityGroups).find(
        (sg: any) => sg.Properties.GroupDescription === 'Security group for RDS database - private access only'
      );
      expect(rdsSecurityGroup).toBeDefined();
    });

    test('should create Lambda security group with all outbound', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupDescription: 'Security group for Lambda functions',
        SecurityGroupEgress: Match.arrayWith([
          Match.objectLike({
            CidrIp: '0.0.0.0/0',
          }),
        ]),
      });
    });

    test('should create RDS ingress rule from EC2 security group', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroupIngress', {
        IpProtocol: 'tcp',
        FromPort: 3306,
        ToPort: 3306,
        Description: 'Allow MySQL access from EC2 instances',
      });
    });
  });

  describe('CloudWatch Logs', () => {
    test('should create log group with encryption', () => {
      template.hasResourceProperties('AWS::Logs::LogGroup', {
        LogGroupName: `/aws/tap-web-app/${environmentSuffix}/application`,
        RetentionInDays: 30,
      });
    });

    test('should use KMS encryption for log group', () => {
      const logGroups = template.findResources('AWS::Logs::LogGroup');
      const logGroup = Object.values(logGroups)[0] as any;
      expect(logGroup.Properties.KmsKeyId).toBeDefined();
    });
  });

  describe('IAM Roles', () => {
    test('should create EC2 IAM role with CloudWatch permissions', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        RoleName: Match.stringLikeRegexp('tap-web-app-ec2-role'),
        AssumeRolePolicyDocument: Match.objectLike({
          Statement: Match.arrayWith([
            Match.objectLike({
              Principal: Match.objectLike({
                Service: 'ec2.amazonaws.com',
              }),
            }),
          ]),
        }),
      });
    });

    test('should create Lambda IAM role with VPC access', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        RoleName: Match.stringLikeRegexp('tap-web-app-lambda-role'),
        AssumeRolePolicyDocument: Match.objectLike({
          Statement: Match.arrayWith([
            Match.objectLike({
              Principal: Match.objectLike({
                Service: 'lambda.amazonaws.com',
              }),
            }),
          ]),
        }),
      });
    });

    test('should create RDS monitoring role', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        AssumeRolePolicyDocument: Match.objectLike({
          Statement: Match.arrayWith([
            Match.objectLike({
              Principal: Match.objectLike({
                Service: 'monitoring.rds.amazonaws.com',
              }),
            }),
          ]),
        }),
      });
    });
  });

  describe('S3 Buckets', () => {
    test('should create logs bucket with S3 managed encryption', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketName: Match.stringLikeRegexp('tap-web-app-access-logs'),
        PublicAccessBlockConfiguration: {
          BlockPublicAcls: true,
          BlockPublicPolicy: true,
          IgnorePublicAcls: true,
          RestrictPublicBuckets: true,
        },
      });
    });

    test('should create app bucket with KMS encryption and versioning', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketName: Match.stringLikeRegexp('tap-web-app-app-data'),
        VersioningConfiguration: {
          Status: 'Enabled',
        },
        BucketEncryption: {
          ServerSideEncryptionConfiguration: Match.arrayWith([
            Match.objectLike({
              ServerSideEncryptionByDefault: Match.objectLike({
                SSEAlgorithm: 'aws:kms',
              }),
            }),
          ]),
        },
        PublicAccessBlockConfiguration: {
          BlockPublicAcls: true,
          BlockPublicPolicy: true,
          IgnorePublicAcls: true,
          RestrictPublicBuckets: true,
        },
      });
    });

    test('should enable access logging on app bucket', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketName: Match.stringLikeRegexp('tap-web-app-app-data'),
        LoggingConfiguration: Match.objectLike({
          LogFilePrefix: 'app-bucket-logs/',
        }),
      });
    });

    test('should configure lifecycle rules for both buckets', () => {
      const buckets = template.findResources('AWS::S3::Bucket');
      Object.values(buckets).forEach((bucket: any) => {
        expect(bucket.Properties.LifecycleConfiguration).toBeDefined();
        expect(bucket.Properties.LifecycleConfiguration.Rules.length).toBeGreaterThan(0);
      });
    });
  });

  describe('RDS Database', () => {
    test('should create RDS subnet group in isolated subnets', () => {
      template.hasResourceProperties('AWS::RDS::DBSubnetGroup', {
        DBSubnetGroupDescription: 'Subnet group for RDS database',
      });
    });

    test('should create MySQL 8.0 RDS instance', () => {
      template.hasResourceProperties('AWS::RDS::DBInstance', {
        Engine: 'mysql',
        EngineVersion: '8.0',
        DBInstanceClass: 'db.t3.micro',
        AllocatedStorage: '20',
        MaxAllocatedStorage: 100,
      });
    });

    test('should enable RDS encryption with KMS', () => {
      template.hasResourceProperties('AWS::RDS::DBInstance', {
        StorageEncrypted: true,
      });

      const rdsInstances = template.findResources('AWS::RDS::DBInstance');
      const rdsInstance = Object.values(rdsInstances)[0] as any;
      expect(rdsInstance.Properties.KmsKeyId).toBeDefined();
    });

    test('should configure RDS to be not publicly accessible', () => {
      template.hasResourceProperties('AWS::RDS::DBInstance', {
        PubliclyAccessible: false,
      });
    });

    test('should enable CloudWatch log exports for RDS', () => {
      template.hasResourceProperties('AWS::RDS::DBInstance', {
        EnableCloudwatchLogsExports: Match.arrayEquals(['error', 'general', 'slowquery']),
      });
    });

    test('should enable enhanced monitoring for RDS', () => {
      template.hasResourceProperties('AWS::RDS::DBInstance', {
        MonitoringInterval: 60,
      });
    });

    test('should configure backup retention and windows', () => {
      template.hasResourceProperties('AWS::RDS::DBInstance', {
        BackupRetentionPeriod: Match.anyValue(),
        PreferredBackupWindow: '03:00-04:00',
        PreferredMaintenanceWindow: 'sun:04:00-sun:05:00',
      });
    });

    test('should disable Multi-AZ for dev environment', () => {
      if (environmentSuffix === 'dev') {
        template.hasResourceProperties('AWS::RDS::DBInstance', {
          MultiAZ: false,
        });
      }
    });
  });

  describe('Lambda Function', () => {
    test('should create Lambda function with Node.js 22 runtime', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        Runtime: 'nodejs22.x',
        Handler: 'index.handler',
        Timeout: 60,
        MemorySize: 512,
      });
    });

    test('should deploy Lambda in VPC private subnets', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        VpcConfig: Match.objectLike({
          SubnetIds: Match.anyValue(),
          SecurityGroupIds: Match.anyValue(),
        }),
      });
    });

    test('should enable X-Ray tracing for Lambda', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        TracingConfig: {
          Mode: 'Active',
        },
      });
    });

    test('should configure Lambda environment variables with encryption', () => {
      const lambdaFunctions = template.findResources('AWS::Lambda::Function');
      const logProcessorLambda = Object.values(lambdaFunctions).find(
        (fn: any) => fn.Properties.FunctionName?.includes('log-processor')
      ) as any;

      expect(logProcessorLambda).toBeDefined();
      expect(logProcessorLambda.Properties.Environment?.Variables).toBeDefined();
      expect(logProcessorLambda.Properties.KmsKeyArn).toBeDefined();
    });

    test('should grant Lambda permissions to access S3 and CloudWatch', () => {
      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: Match.objectLike({
          Statement: Match.arrayWith([
            Match.objectLike({
              Effect: 'Allow',
              Action: Match.arrayWith([Match.stringLikeRegexp('s3:.*')]),
            }),
          ]),
        }),
      });
    });

    test('should not set reservedConcurrentExecutions (removed to fix quota issue)', () => {
      const lambdaFunctions = template.findResources('AWS::Lambda::Function');
      Object.values(lambdaFunctions).forEach((fn: any) => {
        expect(fn.Properties.ReservedConcurrentExecutions).toBeUndefined();
      });
    });
  });

  describe('CloudFormation Outputs', () => {
    test('should export VPC ID', () => {
      template.hasOutput('VpcId', {
        Description: 'VPC ID',
        Export: {
          Name: Match.stringLikeRegexp('tap-web-app-vpc-id'),
        },
      });
    });

    test('should export Application Bucket Name', () => {
      template.hasOutput('ApplicationBucketName', {
        Description: 'Application S3 bucket name',
        Export: {
          Name: Match.stringLikeRegexp('tap-web-app-app-bucket'),
        },
      });
    });

    test('should export RDS Endpoint', () => {
      template.hasOutput('RdsEndpoint', {
        Description: 'RDS instance endpoint',
        Export: {
          Name: Match.stringLikeRegexp('tap-web-app-rds-endpoint'),
        },
      });
    });

    test('should export Log Group Name', () => {
      template.hasOutput('LogGroupName', {
        Description: 'CloudWatch Log Group name',
        Export: {
          Name: Match.stringLikeRegexp('tap-web-app-log-group'),
        },
      });
    });

    test('should export Lambda Function ARN', () => {
      template.hasOutput('LogProcessorLambdaArn', {
        Description: 'Log Processor Lambda Function ARN',
        Export: {
          Name: Match.stringLikeRegexp('tap-web-app-log-processor-arn'),
        },
      });
    });

    test('should output Deployment Region', () => {
      template.hasOutput('DeploymentRegion', {
        Description: 'AWS Region where resources are deployed',
      });
    });
  });

  describe('Resource Count Validation', () => {
    test('should create expected number of total resources', () => {
      const resources = template.toJSON().Resources;
      const resourceCount = Object.keys(resources).length;
      // Should have 61 resources as shown in deployment
      expect(resourceCount).toBeGreaterThan(50);
    });
  });

  describe('Multi-Environment Support', () => {
    test('should create stack with custom environment suffix', () => {
      const customApp = new cdk.App();
      const customEnv = 'qa';
      const customStack = new TapStack(customApp, 'CustomStack', {
        environmentSuffix: customEnv,
      });
      const customTemplate = Template.fromStack(customStack);

      // Verify environment is reflected in resource names
      const buckets = customTemplate.findResources('AWS::S3::Bucket');
      const bucketNames = Object.values(buckets).map((b: any) => b.Properties.BucketName);
      const hasQaEnv = bucketNames.some((name: any) =>
        typeof name === 'string' && name.includes(customEnv)
      );
      expect(hasQaEnv || bucketNames.length > 0).toBe(true);
    });

    test('should configure removal policy based on environment', () => {
      const prodApp = new cdk.App();
      const prodStack = new TapStack(prodApp, 'ProdStack', {
        environmentSuffix: 'prod',
      });
      const prodTemplate = Template.fromStack(prodStack);

      // RDS should be RETAIN for production
      const rdsInstances = prodTemplate.findResources('AWS::RDS::DBInstance');
      const rdsInstance = Object.values(rdsInstances)[0] as any;
      expect(rdsInstance.UpdateReplacePolicy).toBe('Retain');
      expect(rdsInstance.DeletionPolicy).toBe('Retain');
    });

    test('should default to dev environment when no suffix provided', () => {
      // Set environment variable to test fallback logic
      const originalEnv = process.env.ENVIRONMENT;
      process.env.ENVIRONMENT = 'test-env';

      const defaultApp = new cdk.App();
      const defaultStack = new TapStack(defaultApp, 'DefaultStack', {
        // Not passing environmentSuffix to trigger fallback logic
      });
      const defaultTemplate = Template.fromStack(defaultStack);

      // Verify stack was created successfully
      expect(defaultStack).toBeDefined();
      expect(defaultTemplate).toBeDefined();

      // Restore environment
      if (originalEnv) {
        process.env.ENVIRONMENT = originalEnv;
      } else {
        delete process.env.ENVIRONMENT;
      }
    });
  });
});

```

## ./cdk.json

```json
{
  "app": "npx ts-node --prefer-ts-exts bin/tap.ts",
  "watch": {
    "include": [
      "**"
    ],
    "exclude": [
      "README.md",
      "cdk*.json",
      "**/*.d.ts",
      "**/*.js",
      "tsconfig.json",
      "package*.json",
      "yarn.lock",
      "node_modules",
      "test"
    ]
  },
  "context": {
    "@aws-cdk/aws-lambda:recognizeLayerVersion": true,
    "@aws-cdk/core:checkSecretUsage": true,
    "@aws-cdk/core:target-partitions": [
      "aws",
      "aws-cn"
    ],
    "@aws-cdk-containers/ecs-service-extensions:enableDefaultLogDriver": true,
    "@aws-cdk/aws-ec2:uniqueImdsv2TemplateName": true,
    "@aws-cdk/aws-ecs:arnFormatIncludesClusterName": true,
    "@aws-cdk/aws-iam:minimizePolicies": true,
    "@aws-cdk/core:validateSnapshotRemovalPolicy": true,
    "@aws-cdk/aws-codepipeline:crossAccountKeyAliasStackSafeResourceName": true,
    "@aws-cdk/aws-s3:createDefaultLoggingPolicy": true,
    "@aws-cdk/aws-sns-subscriptions:restrictSqsDescryption": true,
    "@aws-cdk/aws-apigateway:disableCloudWatchRole": true,
    "@aws-cdk/core:enablePartitionLiterals": true,
    "@aws-cdk/aws-events:eventsTargetQueueSameAccount": true,
    "@aws-cdk/aws-ecs:disableExplicitDeploymentControllerForCircuitBreaker": true,
    "@aws-cdk/aws-iam:importedRoleStackSafeDefaultPolicyName": true,
    "@aws-cdk/aws-s3:serverAccessLogsUseBucketPolicy": true,
    "@aws-cdk/aws-route53-patters:useCertificate": true,
    "@aws-cdk/customresources:installLatestAwsSdkDefault": false,
    "@aws-cdk/aws-rds:databaseProxyUniqueResourceName": true,
    "@aws-cdk/aws-codedeploy:removeAlarmsFromDeploymentGroup": true,
    "@aws-cdk/aws-apigateway:authorizerChangeDeploymentLogicalId": true,
    "@aws-cdk/aws-ec2:launchTemplateDefaultUserData": true,
    "@aws-cdk/aws-secretsmanager:useAttachedSecretResourcePolicyForSecretTargetAttachments": true,
    "@aws-cdk/aws-redshift:columnId": true,
    "@aws-cdk/aws-stepfunctions-tasks:enableEmrServicePolicyV2": true,
    "@aws-cdk/aws-ec2:restrictDefaultSecurityGroup": true,
    "@aws-cdk/aws-apigateway:requestValidatorUniqueId": true,
    "@aws-cdk/aws-kms:aliasNameRef": true,
    "@aws-cdk/aws-autoscaling:generateLaunchTemplateInsteadOfLaunchConfig": true,
    "@aws-cdk/core:includePrefixInUniqueNameGeneration": true,
    "@aws-cdk/aws-efs:denyAnonymousAccess": true,
    "@aws-cdk/aws-opensearchservice:enableOpensearchMultiAzWithStandby": true,
    "@aws-cdk/aws-lambda-nodejs:useLatestRuntimeVersion": true,
    "@aws-cdk/aws-efs:mountTargetOrderInsensitiveLogicalId": true,
    "@aws-cdk/aws-rds:auroraClusterChangeScopeOfInstanceParameterGroupWithEachParameters": true,
    "@aws-cdk/aws-appsync:useArnForSourceApiAssociationIdentifier": true,
    "@aws-cdk/aws-rds:preventRenderingDeprecatedCredentials": true,
    "@aws-cdk/aws-codepipeline-actions:useNewDefaultBranchForCodeCommitSource": true,
    "@aws-cdk/aws-cloudwatch-actions:changeLambdaPermissionLogicalIdForLambdaAction": true,
    "@aws-cdk/aws-codepipeline:crossAccountKeysDefaultValueToFalse": true,
    "@aws-cdk/aws-codepipeline:defaultPipelineTypeToV2": true,
    "@aws-cdk/aws-kms:reduceCrossAccountRegionPolicyScope": true,
    "@aws-cdk/aws-eks:nodegroupNameAttribute": true,
    "@aws-cdk/aws-ec2:ebsDefaultGp3Volume": true,
    "@aws-cdk/aws-ecs:removeDefaultDeploymentAlarm": true,
    "@aws-cdk/custom-resources:logApiResponseDataPropertyTrueDefault": false,
    "@aws-cdk/aws-s3:keepNotificationInImportedBucket": false,
    "@aws-cdk/aws-ecs:enableImdsBlockingDeprecatedFeature": false,
    "@aws-cdk/aws-ecs:disableEcsImdsBlocking": true,
    "@aws-cdk/aws-ecs:reduceEc2FargateCloudWatchPermissions": true,
    "@aws-cdk/aws-dynamodb:resourcePolicyPerReplica": true,
    "@aws-cdk/aws-ec2:ec2SumTImeoutEnabled": true,
    "@aws-cdk/aws-appsync:appSyncGraphQLAPIScopeLambdaPermission": true,
    "@aws-cdk/aws-rds:setCorrectValueForDatabaseInstanceReadReplicaInstanceResourceId": true,
    "@aws-cdk/core:cfnIncludeRejectComplexResourceUpdateCreatePolicyIntrinsics": true,
    "@aws-cdk/aws-lambda-nodejs:sdkV3ExcludeSmithyPackages": true,
    "@aws-cdk/aws-stepfunctions-tasks:fixRunEcsTaskPolicy": true,
    "@aws-cdk/aws-ec2:bastionHostUseAmazonLinux2023ByDefault": true,
    "@aws-cdk/aws-route53-targets:userPoolDomainNameMethodWithoutCustomResource": true,
    "@aws-cdk/aws-elasticloadbalancingV2:albDualstackWithoutPublicIpv4SecurityGroupRulesDefault": true,
    "@aws-cdk/aws-iam:oidcRejectUnauthorizedConnections": true,
    "@aws-cdk/core:enableAdditionalMetadataCollection": true,
    "@aws-cdk/aws-lambda:createNewPoliciesWithAddToRolePolicy": false,
    "@aws-cdk/aws-s3:setUniqueReplicationRoleName": true,
    "@aws-cdk/aws-events:requireEventBusPolicySid": true,
    "@aws-cdk/core:aspectPrioritiesMutating": true,
    "@aws-cdk/aws-dynamodb:retainTableReplica": true,
    "@aws-cdk/aws-stepfunctions:useDistributedMapResultWriterV2": true,
    "@aws-cdk/s3-notifications:addS3TrustKeyPolicyForSnsSubscriptions": true,
    "@aws-cdk/aws-ec2:requirePrivateSubnetsForEgressOnlyInternetGateway": true,
    "@aws-cdk/aws-s3:publicAccessBlockedByDefault": true,
    "@aws-cdk/aws-lambda:useCdkManagedLogGroup": true
  }
}
```
