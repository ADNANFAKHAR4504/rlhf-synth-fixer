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
