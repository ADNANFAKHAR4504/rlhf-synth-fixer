import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as config from 'aws-cdk-lib/aws-config';
import { Construct } from 'constructs';

interface TapStackProps extends cdk.StackProps {
  environmentSuffix?: string;
}

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id, props);

    const environmentSuffix =
      props?.environmentSuffix ||
      this.node.tryGetContext('environmentSuffix') ||
      'dev';

    // VPC Configuration
    const vpc = new ec2.Vpc(this, 'TradingVpc', {
      vpcName: `trading-vpc-${environmentSuffix}`,
      ipAddresses: ec2.IpAddresses.cidr('10.0.0.0/16'),
      maxAzs: 3,
      natGateways: 3,
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: 'Public',
          subnetType: ec2.SubnetType.PUBLIC,
        },
        {
          cidrMask: 24,
          name: 'Private',
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
      ],
    });

    // VPC Flow Logs
    const flowLogGroup = new logs.LogGroup(this, 'VpcFlowLogGroup', {
      logGroupName: `/aws/vpc/flowlogs-${environmentSuffix}`,
      retention: logs.RetentionDays.ONE_WEEK,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    vpc.addFlowLog('VpcFlowLogs', {
      destination: ec2.FlowLogDestination.toCloudWatchLogs(flowLogGroup),
      trafficType: ec2.FlowLogTrafficType.ALL,
    });

    // KMS Keys (fixed: removed hardcoded alias parameter)
    const dbEncryptionKey = new kms.Key(this, 'DbEncryptionKey', {
      enableKeyRotation: true,
      description: 'KMS key for database encryption',
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // KMS alias created for reference (intentionally unused variable)
    new kms.Alias(this, 'DbEncryptionKeyAlias', {
      aliasName: `alias/database-key-${environmentSuffix}`,
      targetKey: dbEncryptionKey,
    });

    const s3EncryptionKey = new kms.Key(this, 'S3EncryptionKey', {
      enableKeyRotation: true,
      description: 'KMS key for S3 bucket encryption',
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // KMS alias created for reference (intentionally unused variable)
    new kms.Alias(this, 'S3EncryptionKeyAlias', {
      aliasName: `alias/s3-key-${environmentSuffix}`,
      targetKey: s3EncryptionKey,
    });

    const lambdaEncryptionKey = new kms.Key(this, 'LambdaEncryptionKey', {
      enableKeyRotation: true,
      description: 'KMS key for Lambda environment variables',
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // KMS alias created for reference (intentionally unused variable)
    new kms.Alias(this, 'LambdaEncryptionKeyAlias', {
      aliasName: `alias/lambda-key-${environmentSuffix}`,
      targetKey: lambdaEncryptionKey,
    });

    // Aurora Serverless v2 Cluster
    const dbCluster = new rds.DatabaseCluster(this, 'TradingDatabase', {
      engine: rds.DatabaseClusterEngine.auroraPostgres({
        version: rds.AuroraPostgresEngineVersion.VER_15_8,
      }),
      serverlessV2MinCapacity: 0.5,
      serverlessV2MaxCapacity: 2,
      writer: rds.ClusterInstance.serverlessV2('writer'),
      vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
      },
      storageEncrypted: true,
      storageEncryptionKey: dbEncryptionKey,
      backup: {
        retention: cdk.Duration.days(7),
      },
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // DynamoDB Tables (fixed: using CUSTOMER_MANAGED encryption with KMS)
    const dynamoEncryptionKey = new kms.Key(this, 'DynamoEncryptionKey', {
      enableKeyRotation: true,
      description: 'KMS key for DynamoDB encryption',
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const sessionsTable = new dynamodb.Table(this, 'SessionsTable', {
      tableName: `user-sessions-${environmentSuffix}`,
      partitionKey: { name: 'sessionId', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      pointInTimeRecovery: true,
      encryption: dynamodb.TableEncryption.CUSTOMER_MANAGED,
      encryptionKey: dynamoEncryptionKey,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const apiKeysTable = new dynamodb.Table(this, 'ApiKeysTable', {
      tableName: `api-keys-${environmentSuffix}`,
      partitionKey: { name: 'apiKeyId', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      pointInTimeRecovery: true,
      encryption: dynamodb.TableEncryption.CUSTOMER_MANAGED,
      encryptionKey: dynamoEncryptionKey,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // S3 Logging Bucket for access logs
    const loggingBucket = new s3.Bucket(this, 'LoggingBucket', {
      bucketName: `logs-${environmentSuffix}-${this.account}`,
      encryption: s3.BucketEncryption.KMS,
      encryptionKey: s3EncryptionKey,
      enforceSSL: true,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      lifecycleRules: [
        {
          enabled: true,
          transitions: [
            {
              storageClass: s3.StorageClass.GLACIER,
              transitionAfter: cdk.Duration.days(30),
            },
          ],
          expiration: cdk.Duration.days(365),
        },
      ],
    });

    // S3 Buckets (fixed: added autoDeleteObjects, removalPolicy, enforceSSL, and access logging)
    const ingestionBucket = new s3.Bucket(this, 'IngestionBucket', {
      bucketName: `trading-ingestion-${environmentSuffix}-${this.account}`,
      encryption: s3.BucketEncryption.KMS,
      encryptionKey: s3EncryptionKey,
      versioned: true,
      enforceSSL: true,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      serverAccessLogsBucket: loggingBucket,
      serverAccessLogsPrefix: 'ingestion/',
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      lifecycleRules: [
        {
          enabled: true,
          transitions: [
            {
              storageClass: s3.StorageClass.GLACIER,
              transitionAfter: cdk.Duration.days(90),
            },
          ],
        },
      ],
    });

    const analyticsBucket = new s3.Bucket(this, 'AnalyticsBucket', {
      bucketName: `trading-analytics-${environmentSuffix}-${this.account}`,
      encryption: s3.BucketEncryption.KMS,
      encryptionKey: s3EncryptionKey,
      versioned: true,
      enforceSSL: true,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      serverAccessLogsBucket: loggingBucket,
      serverAccessLogsPrefix: 'analytics/',
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      lifecycleRules: [
        {
          enabled: true,
          transitions: [
            {
              storageClass: s3.StorageClass.GLACIER,
              transitionAfter: cdk.Duration.days(90),
            },
          ],
        },
      ],
    });

    const archivalBucket = new s3.Bucket(this, 'ArchivalBucket', {
      bucketName: `trading-archival-${environmentSuffix}-${this.account}`,
      encryption: s3.BucketEncryption.KMS,
      encryptionKey: s3EncryptionKey,
      versioned: true,
      enforceSSL: true,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      serverAccessLogsBucket: loggingBucket,
      serverAccessLogsPrefix: 'archival/',
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      lifecycleRules: [
        {
          enabled: true,
          transitions: [
            {
              storageClass: s3.StorageClass.DEEP_ARCHIVE,
              transitionAfter: cdk.Duration.days(90),
            },
          ],
        },
      ],
    });

    // Lambda Function for Data Processing (fixed: added explicit IAM policy with regional restrictions)
    const lambdaRole = new iam.Role(this, 'DataProcessingLambdaRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      description:
        'Role for data processing Lambda function with least-privilege access',
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'service-role/AWSLambdaVPCAccessExecutionRole'
        ),
      ],
    });

    // Add explicit regional restrictions
    lambdaRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.DENY,
        actions: ['*'],
        resources: ['*'],
        conditions: {
          StringNotEquals: {
            'aws:RequestedRegion': ['us-east-1'],
          },
        },
      })
    );

    const dataProcessingFunction = new lambda.Function(
      this,
      'DataProcessingFunction',
      {
        functionName: `data-processor-${environmentSuffix}`,
        runtime: lambda.Runtime.NODEJS_18_X,
        handler: 'index.handler',
        code: lambda.Code.fromAsset('lib/lambda/data-processor'),
        architecture: lambda.Architecture.ARM_64,
        environment: {
          ENVIRONMENT: environmentSuffix,
          SESSIONS_TABLE: sessionsTable.tableName,
          API_KEYS_TABLE: apiKeysTable.tableName,
        },
        environmentEncryption: lambdaEncryptionKey,
        logRetention: logs.RetentionDays.ONE_MONTH,
        role: lambdaRole,
        timeout: cdk.Duration.seconds(30),
        memorySize: 512,
        description: 'Processes trade data and manages sessions',
      }
    );

    // Grant Lambda permissions with least privilege
    sessionsTable.grantReadWriteData(dataProcessingFunction);
    apiKeysTable.grantReadWriteData(dataProcessingFunction);
    ingestionBucket.grantRead(dataProcessingFunction);
    analyticsBucket.grantWrite(dataProcessingFunction);

    // API Gateway (fixed: added CloudWatch role for logging)
    const apiLogGroup = new logs.LogGroup(this, 'ApiGatewayLogGroup', {
      logGroupName: `/aws/apigateway/trading-api-${environmentSuffix}`,
      retention: logs.RetentionDays.ONE_MONTH,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const api = new apigateway.RestApi(this, 'TradingApi', {
      restApiName: `trading-api-${environmentSuffix}`,
      description: 'API for trading analytics platform',
      deployOptions: {
        stageName: environmentSuffix,
        loggingLevel: apigateway.MethodLoggingLevel.INFO,
        dataTraceEnabled: true,
        accessLogDestination: new apigateway.LogGroupLogDestination(
          apiLogGroup
        ),
        accessLogFormat: apigateway.AccessLogFormat.jsonWithStandardFields(),
      },
      cloudWatchRole: true,
    });

    const apiIntegration = new apigateway.LambdaIntegration(
      dataProcessingFunction
    );
    const dataResource = api.root.addResource('data');
    dataResource.addMethod('POST', apiIntegration, {
      apiKeyRequired: true,
    });

    // Usage Plan
    const usagePlan = api.addUsagePlan('UsagePlan', {
      name: `trading-usage-plan-${environmentSuffix}`,
      throttle: {
        rateLimit: 1000,
        burstLimit: 2000,
      },
    });

    usagePlan.addApiStage({
      stage: api.deploymentStage,
    });

    const apiKey = api.addApiKey('ApiKey', {
      apiKeyName: `trading-api-key-${environmentSuffix}`,
    });

    usagePlan.addApiKey(apiKey);

    // AWS Config
    // Note: Config recorder, delivery channel, role, and bucket already exist in this AWS account
    // Only create Config rules to leverage the existing recorder
    // This avoids the MaxNumberOfConfigurationRecordersExceededException error

    // Config Rules for PCI-DSS Compliance
    new config.ManagedRule(this, 'EncryptedVolumes', {
      identifier: 'ENCRYPTED_VOLUMES',
      description: 'Check that EBS volumes are encrypted',
    });

    new config.ManagedRule(this, 'RdsEncryption', {
      identifier: 'RDS_STORAGE_ENCRYPTED',
      description: 'Check that RDS storage is encrypted',
    });

    new config.ManagedRule(this, 'S3BucketPublicRead', {
      identifier: 'S3_BUCKET_PUBLIC_READ_PROHIBITED',
      description: 'Check that S3 buckets do not allow public read access',
    });

    new config.ManagedRule(this, 'S3BucketPublicWrite', {
      identifier: 'S3_BUCKET_PUBLIC_WRITE_PROHIBITED',
      description: 'Check that S3 buckets do not allow public write access',
    });

    new config.ManagedRule(this, 'S3BucketLoggingEnabled', {
      identifier: 'S3_BUCKET_LOGGING_ENABLED',
      description: 'Check that S3 buckets have access logging enabled',
    });

    // Tagging
    cdk.Tags.of(this).add('Environment', environmentSuffix);
    cdk.Tags.of(this).add('CostCenter', 'trading-platform');
    cdk.Tags.of(this).add('Compliance', 'PCI-DSS');
    cdk.Tags.of(this).add('DataClassification', 'Confidential');

    // CloudFormation Outputs
    new cdk.CfnOutput(this, 'VpcId', {
      value: vpc.vpcId,
      description: 'VPC ID',
      exportName: `VpcId-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'DatabaseEndpoint', {
      value: dbCluster.clusterEndpoint.hostname,
      description: 'Database cluster endpoint',
      exportName: `DatabaseEndpoint-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'ApiUrl', {
      value: api.url,
      description: 'API Gateway URL',
      exportName: `ApiUrl-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'IngestionBucketName', {
      value: ingestionBucket.bucketName,
      description: 'Ingestion S3 bucket name',
      exportName: `IngestionBucket-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'AnalyticsBucketName', {
      value: analyticsBucket.bucketName,
      description: 'Analytics S3 bucket name',
      exportName: `AnalyticsBucket-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'ArchivalBucketName', {
      value: archivalBucket.bucketName,
      description: 'Archival S3 bucket name',
      exportName: `ArchivalBucket-${environmentSuffix}`,
    });
  }
}
