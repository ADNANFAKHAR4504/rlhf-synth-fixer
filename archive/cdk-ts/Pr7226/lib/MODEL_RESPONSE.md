### Reasoning Trace
---

This is a comprehensive request for a highly secure AWS CDK application for processing sensitive financial records. Let me break down the requirements:

1. **VPC & Networking:**
   - VPC with 3 private subnets across 3 AZs
   - No Internet Gateway or NAT Gateway
   - VPC Endpoints for S3, DynamoDB, and potentially CloudWatch Logs
   - Strict security groups

2. **KMS & Encryption:**
   - Customer-managed KMS keys for S3 buckets and DynamoDB
   - Restricted key policies

3. **S3 Buckets:**
   - Input and output buckets with SSE-KMS
   - Versioning enabled
   - Lifecycle policies
   - Bucket policies enforcing TLS-only

4. **Lambda Functions:**
   - Run in VPC private subnets
   - Triggered by S3 events
   - Least-privilege IAM with explicit denies
   - 7-year log retention

5. **DynamoDB:**
   - Transaction metadata table
   - Encryption at rest
   - VPC endpoint access only

6. **IAM:**
   - Least privilege with explicit deny statements
   - Specific deny for dangerous operations

7. **Monitoring:**
   - CloudWatch Log Groups with 7-year retention
   - Alarms for failed invocations
   - Alarms for unauthorized access attempts

Let me create the two files:
### Answer 
---

```typescript
// main.ts
import * as cdk from 'aws-cdk-lib';
import { SecureFinancialDataProcessingStack } from './tapstack';

const app = new cdk.App();

// Deploy secure financial data processing infrastructure
new SecureFinancialDataProcessingStack(app, 'SecureFinancialDataProcessingStack', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: 'us-east-1',
  },
  description: 'Highly secure financial data processing pipeline with complete isolation and encryption',
  tags: {
    Environment: 'Production',
    Project: 'SecureFinancialProcessing',
    ManagedBy: 'CDK',
    DataClassification: 'Sensitive',
    Compliance: 'PCI-DSS,SOC2'
  },
});

app.synth();
```

```typescript
// tapstack.ts
import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as cloudwatchActions from 'aws-cdk-lib/aws-cloudwatch-actions';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as s3n from 'aws-cdk-lib/aws-s3-notifications';
import { Construct } from 'constructs';

export class SecureFinancialDataProcessingStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // 🔹 VPC & Endpoints
    // Create VPC with 3 private subnets across 3 AZs - NO internet access
    const vpc = new ec2.Vpc(this, 'SecureVPC', {
      vpcName: 'secure-financial-vpc',
      maxAzs: 3,
      natGateways: 0, // No NAT Gateway
      subnetConfiguration: [
        {
          name: 'Private',
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED, // No NAT, no IGW
          cidrMask: 24,
        },
      ],
      flowLogs: {
        'VPCFlowLogs': {
          destination: ec2.FlowLogDestination.toCloudWatchLogs(),
          trafficType: ec2.FlowLogTrafficType.ALL,
        }
      },
    });

    // Security group for Lambda functions
    const lambdaSG = new ec2.SecurityGroup(this, 'LambdaSecurityGroup', {
      vpc,
      description: 'Security group for Lambda functions in VPC',
      allowAllOutbound: false, // Explicit egress rules only
    });

    // Security group for VPC endpoints
    const endpointSG = new ec2.SecurityGroup(this, 'VPCEndpointSecurityGroup', {
      vpc,
      description: 'Security group for VPC endpoints',
      allowAllOutbound: false,
    });

    // Allow Lambda to connect to endpoints on port 443
    endpointSG.addIngressRule(
      lambdaSG,
      ec2.Port.tcp(443),
      'Allow HTTPS from Lambda functions'
    );

    lambdaSG.addEgressRule(
      endpointSG,
      ec2.Port.tcp(443),
      'Allow HTTPS to VPC endpoints'
    );

    // VPC Gateway Endpoint for S3
    const s3Endpoint = vpc.addGatewayEndpoint('S3Endpoint', {
      service: ec2.GatewayVpcEndpointAwsService.S3,
      subnets: [{
        subnets: vpc.isolatedSubnets
      }],
    });

    // VPC Gateway Endpoint for DynamoDB
    const dynamodbEndpoint = vpc.addGatewayEndpoint('DynamoDBEndpoint', {
      service: ec2.GatewayVpcEndpointAwsService.DYNAMODB,
      subnets: [{
        subnets: vpc.isolatedSubnets
      }],
    });

    // VPC Interface Endpoint for CloudWatch Logs
    vpc.addInterfaceEndpoint('CloudWatchLogsEndpoint', {
      service: ec2.InterfaceVpcEndpointAwsService.CLOUDWATCH_LOGS,
      subnets: {
        subnets: vpc.isolatedSubnets
      },
      securityGroups: [endpointSG],
      privateDnsEnabled: true,
    });

    // VPC Interface Endpoint for KMS
    vpc.addInterfaceEndpoint('KMSEndpoint', {
      service: ec2.InterfaceVpcEndpointAwsService.KMS,
      subnets: {
        subnets: vpc.isolatedSubnets
      },
      securityGroups: [endpointSG],
      privateDnsEnabled: true,
    });

    // VPC Interface Endpoint for Lambda (for invoking other lambdas if needed)
    vpc.addInterfaceEndpoint('LambdaEndpoint', {
      service: ec2.InterfaceVpcEndpointAwsService.LAMBDA,
      subnets: {
        subnets: vpc.isolatedSubnets
      },
      securityGroups: [endpointSG],
      privateDnsEnabled: true,
    });

    // 🔹 SNS Topic for Security Alerts
    const securityAlertTopic = new sns.Topic(this, 'SecurityAlertTopic', {
      topicName: 'secure-financial-security-alerts',
      displayName: 'Security Alerts for Financial Data Processing',
    });

    // 🔹 KMS Keys
    // Customer-managed KMS key for input bucket
    const inputBucketKey = new kms.Key(this, 'InputBucketKMSKey', {
      alias: 'alias/secure-financial-input-bucket',
      description: 'KMS key for encrypting input financial data',
      enableKeyRotation: true,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      pendingWindow: cdk.Duration.days(30),
    });

    // Customer-managed KMS key for output bucket
    const outputBucketKey = new kms.Key(this, 'OutputBucketKMSKey', {
      alias: 'alias/secure-financial-output-bucket',
      description: 'KMS key for encrypting processed financial data',
      enableKeyRotation: true,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      pendingWindow: cdk.Duration.days(30),
    });

    // Customer-managed KMS key for DynamoDB
    const dynamoDbKey = new kms.Key(this, 'DynamoDbKMSKey', {
      alias: 'alias/secure-financial-dynamodb',
      description: 'KMS key for encrypting DynamoDB transaction metadata',
      enableKeyRotation: true,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      pendingWindow: cdk.Duration.days(30),
    });

    // 🔹 S3 Buckets
    // Input bucket with KMS encryption
    const inputBucket = new s3.Bucket(this, 'InputDataBucket', {
      bucketName: `secure-financial-input-${this.account}-${this.region}`,
      encryption: s3.BucketEncryption.KMS,
      encryptionKey: inputBucketKey,
      bucketKeyEnabled: true,
      versioned: true,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      enforceSSL: true,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      lifecycleRules: [
        {
          id: 'TransitionToIA',
          enabled: true,
          transitions: [{
            storageClass: s3.StorageClass.INFREQUENT_ACCESS,
            transitionAfter: cdk.Duration.days(30),
          }],
        },
        {
          id: 'TransitionToGlacier',
          enabled: true,
          transitions: [{
            storageClass: s3.StorageClass.GLACIER,
            transitionAfter: cdk.Duration.days(90),
          }],
        },
        {
          id: 'ExpireOldVersions',
          enabled: true,
          noncurrentVersionExpiration: cdk.Duration.days(365),
        },
      ],
    });

    // Output bucket with KMS encryption
    const outputBucket = new s3.Bucket(this, 'OutputDataBucket', {
      bucketName: `secure-financial-output-${this.account}-${this.region}`,
      encryption: s3.BucketEncryption.KMS,
      encryptionKey: outputBucketKey,
      bucketKeyEnabled: true,
      versioned: true,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      enforceSSL: true,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      lifecycleRules: [
        {
          id: 'TransitionToIA',
          enabled: true,
          transitions: [{
            storageClass: s3.StorageClass.INFREQUENT_ACCESS,
            transitionAfter: cdk.Duration.days(60),
          }],
        },
        {
          id: 'TransitionToDeepArchive',
          enabled: true,
          transitions: [{
            storageClass: s3.StorageClass.DEEP_ARCHIVE,
            transitionAfter: cdk.Duration.days(180),
          }],
        },
      ],
    });

    // 🔹 DynamoDB Table
    const transactionTable = new dynamodb.Table(this, 'TransactionMetadataTable', {
      tableName: 'secure-financial-transactions',
      partitionKey: { name: 'transactionId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'timestamp', type: dynamodb.AttributeType.NUMBER },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      encryption: dynamodb.TableEncryption.CUSTOMER_MANAGED,
      encryptionKey: dynamoDbKey,
      pointInTimeRecovery: true,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    // 🔹 Lambda Functions
    // CloudWatch Log Group for Lambda with 7-year retention
    const lambdaLogGroup = new logs.LogGroup(this, 'ProcessorLambdaLogGroup', {
      logGroupName: '/aws/lambda/secure-financial-processor',
      retention: logs.RetentionDays.SEVEN_YEARS, // Exactly 7 years as required
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      encryptionKey: inputBucketKey, // Reuse KMS key for logs encryption
    });

    // IAM role for Lambda with least privilege and explicit denies
    const lambdaRole = new iam.Role(this, 'ProcessorLambdaRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      description: 'Least-privilege role for financial data processor Lambda',
      maxSessionDuration: cdk.Duration.hours(1),
    });

    // Attach VPC execution policy
    lambdaRole.addManagedPolicy(
      iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaVPCAccessExecutionRole')
    );

    // Add specific permissions for S3
    lambdaRole.addToPolicy(new iam.PolicyStatement({
      sid: 'AllowS3ReadFromInput',
      effect: iam.Effect.ALLOW,
      actions: [
        's3:GetObject',
        's3:GetObjectVersion',
        's3:ListBucket',
      ],
      resources: [
        inputBucket.bucketArn,
        `${inputBucket.bucketArn}/*`,
      ],
    }));

    lambdaRole.addToPolicy(new iam.PolicyStatement({
      sid: 'AllowS3WriteToOutput',
      effect: iam.Effect.ALLOW,
      actions: [
        's3:PutObject',
        's3:PutObjectAcl',
      ],
      resources: [`${outputBucket.bucketArn}/*`],
    }));

    // Add permissions for KMS
    lambdaRole.addToPolicy(new iam.PolicyStatement({
      sid: 'AllowKMSOperations',
      effect: iam.Effect.ALLOW,
      actions: [
        'kms:Decrypt',
        'kms:Encrypt',
        'kms:GenerateDataKey',
        'kms:DescribeKey',
      ],
      resources: [
        inputBucketKey.keyArn,
        outputBucketKey.keyArn,
        dynamoDbKey.keyArn,
      ],
    }));

    // Add permissions for DynamoDB
    lambdaRole.addToPolicy(new iam.PolicyStatement({
      sid: 'AllowDynamoDBOperations',
      effect: iam.Effect.ALLOW,
      actions: [
        'dynamodb:PutItem',
        'dynamodb:GetItem',
        'dynamodb:Query',
        'dynamodb:UpdateItem',
      ],
      resources: [transactionTable.tableArn],
    }));

    // Add permissions for CloudWatch Logs
    lambdaRole.addToPolicy(new iam.PolicyStatement({
      sid: 'AllowCloudWatchLogs',
      effect: iam.Effect.ALLOW,
      actions: [
        'logs:CreateLogStream',
        'logs:PutLogEvents',
      ],
      resources: [lambdaLogGroup.logGroupArn],
    }));

    // EXPLICIT DENY statements for dangerous operations
    lambdaRole.addToPolicy(new iam.PolicyStatement({
      sid: 'ExplicitDenyDangerousS3Operations',
      effect: iam.Effect.DENY,
      actions: [
        's3:DeleteBucket',
        's3:DeleteBucketPolicy',
        's3:PutBucketAcl',
        's3:PutBucketPolicy',
        's3:PutBucketPublicAccessBlock',
        's3:PutObjectAcl',
      ],
      resources: ['*'],
    }));

    lambdaRole.addToPolicy(new iam.PolicyStatement({
      sid: 'ExplicitDenyDangerousKMSOperations',
      effect: iam.Effect.DENY,
      actions: [
        'kms:DisableKey',
        'kms:DeleteAlias',
        'kms:ScheduleKeyDeletion',
        'kms:CancelKeyDeletion',
        'kms:PutKeyPolicy',
        'kms:CreateGrant',
      ],
      resources: ['*'],
    }));

    lambdaRole.addToPolicy(new iam.PolicyStatement({
      sid: 'ExplicitDenyDangerousDynamoOperations',
      effect: iam.Effect.DENY,
      actions: [
        'dynamodb:DeleteTable',
        'dynamodb:DeleteBackup',
      ],
      resources: ['*'],
    }));

    lambdaRole.addToPolicy(new iam.PolicyStatement({
      sid: 'ExplicitDenyNetworkChanges',
      effect: iam.Effect.DENY,
      actions: [
        'ec2:*',
        'iam:*',
      ],
      resources: ['*'],
    }));

    // Data processor Lambda function
    const processorLambda = new lambda.Function(this, 'DataProcessorLambda', {
      functionName: 'secure-financial-processor',
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      code: lambda.Code.fromInline(`
        const AWS = require('aws-sdk');
        const s3 = new AWS.S3();
        const dynamodb = new AWS.DynamoDB.DocumentClient();
        const crypto = require('crypto');
        
        exports.handler = async (event) => {
          console.log('Processing financial data event:', JSON.stringify(event, null, 2));
          
          try {
            for (const record of event.Records) {
              const bucket = record.s3.bucket.name;
              const key = decodeURIComponent(record.s3.object.key.replace(/\\+/g, ' '));
              
              // Read from input bucket
              const inputData = await s3.getObject({
                Bucket: bucket,
                Key: key
              }).promise();
              
              // Process data (placeholder for actual processing logic)
              const processedData = processData(inputData.Body);
              
              // Generate transaction ID
              const transactionId = crypto.randomUUID();
              const timestamp = Date.now();
              
              // Write to output bucket
              const outputKey = \`processed/\${timestamp}-\${key}\`;
              await s3.putObject({
                Bucket: process.env.OUTPUT_BUCKET,
                Key: outputKey,
                Body: processedData,
                ServerSideEncryption: 'aws:kms',
                SSEKMSKeyId: process.env.OUTPUT_KMS_KEY,
                Metadata: {
                  'transaction-id': transactionId,
                  'processed-at': new Date().toISOString(),
                  'source-key': key
                }
              }).promise();
              
              // Log transaction metadata to DynamoDB
              await dynamodb.put({
                TableName: process.env.TRANSACTION_TABLE,
                Item: {
                  transactionId: transactionId,
                  timestamp: timestamp,
                  inputKey: key,
                  outputKey: outputKey,
                  processedAt: new Date().toISOString(),
                  status: 'SUCCESS',
                  inputBucket: bucket,
                  outputBucket: process.env.OUTPUT_BUCKET,
                  dataSize: inputData.ContentLength,
                  checksum: crypto.createHash('sha256').update(inputData.Body).digest('hex')
                }
              }).promise();
              
              console.log(\`Successfully processed transaction: \${transactionId}\`);
            }
            
            return {
              statusCode: 200,
              body: JSON.stringify({ message: 'Processing complete' })
            };
          } catch (error) {
            console.error('Processing error:', error);
            throw error;
          }
        };
        
        function processData(data) {
          // Placeholder for actual data processing logic
          // In production, implement actual financial data transformations
          return JSON.stringify({
            processed: true,
            timestamp: new Date().toISOString(),
            dataHash: crypto.createHash('sha256').update(data).digest('hex')
          });
        }
      `),
      environment: {
        OUTPUT_BUCKET: outputBucket.bucketName,
        OUTPUT_KMS_KEY: outputBucketKey.keyArn,
        TRANSACTION_TABLE: transactionTable.tableName,
      },
      role: lambdaRole,
      vpc: vpc,
      vpcSubnets: {
        subnets: vpc.isolatedSubnets,
      },
      securityGroups: [lambdaSG],
      timeout: cdk.Duration.minutes(5),
      memorySize: 1024,
      reservedConcurrentExecutions: 10, // Limit concurrent executions for control
      logGroup: lambdaLogGroup,
      deadLetterQueueEnabled: true,
      retryAttempts: 1,
      environmentEncryption: inputBucketKey, // Encrypt environment variables
      tracing: lambda.Tracing.ACTIVE,
    });

    // Grant KMS permissions to Lambda
    inputBucketKey.grantDecrypt(processorLambda);
    outputBucketKey.grantEncrypt(processorLambda);
    dynamoDbKey.grant(processorLambda, 'kms:Decrypt', 'kms:Encrypt');

    // Add S3 event notification to trigger Lambda
    inputBucket.addEventNotification(
      s3.EventType.OBJECT_CREATED,
      new s3n.LambdaDestination(processorLambda),
      { prefix: 'incoming/' }
    );

    // Update VPC endpoint policies to restrict access
    s3Endpoint.addToPolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      principals: [lambdaRole],
      actions: ['s3:*'],
      resources: [
        inputBucket.bucketArn,
        `${inputBucket.bucketArn}/*`,
        outputBucket.bucketArn,
        `${outputBucket.bucketArn}/*`,
      ],
    }));

    dynamodbEndpoint.addToPolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      principals: [lambdaRole],
      actions: ['dynamodb:*'],
      resources: [transactionTable.tableArn],
    }));

    // 🔹 Logs & Alarms
    // Metric filter for unauthorized access attempts
    const unauthorizedAccessFilter = new logs.MetricFilter(this, 'UnauthorizedAccessFilter', {
      logGroup: lambdaLogGroup,
      filterPattern: logs.FilterPattern.literal('[time, request_id, level = ERROR, msg = *AccessDenied* || msg = *Forbidden* || msg = *Unauthorized*]'),
      metricName: 'UnauthorizedAccessAttempts',
      metricNamespace: 'SecureFinancial/Security',
      metricValue: '1',
      defaultValue: 0,
    });

    // Alarm for failed Lambda invocations
    const failedInvocationsAlarm = new cloudwatch.Alarm(this, 'FailedInvocationsAlarm', {
      metric: processorLambda.metricErrors({
        period: cdk.Duration.minutes(1),
      }),
      threshold: 1,
      evaluationPeriods: 1,
      alarmDescription: 'Alert when Lambda function fails',
      alarmName: 'secure-financial-processor-failures',
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    });

    // Alarm for unauthorized access attempts
    const unauthorizedAccessAlarm = new cloudwatch.Alarm(this, 'UnauthorizedAccessAlarm', {
      metric: unauthorizedAccessFilter.metric({
        period: cdk.Duration.minutes(5),
        statistic: cloudwatch.Stats.SUM,
      }),
      threshold: 1,
      evaluationPeriods: 1,
      alarmDescription: 'Alert on unauthorized access attempts',
      alarmName: 'secure-financial-unauthorized-access',
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    });

    // Alarm for Lambda throttles
    const throttlesAlarm = new cloudwatch.Alarm(this, 'ThrottlesAlarm', {
      metric: processorLambda.metricThrottles({
        period: cdk.Duration.minutes(5),
      }),
      threshold: 5,
      evaluationPeriods: 1,
      alarmDescription: 'Alert when Lambda is throttled',
      alarmName: 'secure-financial-processor-throttles',
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    });

    // Alarm for Lambda duration (potential timeout)
    const durationAlarm = new cloudwatch.Alarm(this, 'DurationAlarm', {
      metric: processorLambda.metricDuration({
        period: cdk.Duration.minutes(5),
        statistic: cloudwatch.Stats.AVERAGE,
      }),
      threshold: 240000, // 4 minutes (80% of 5 min timeout)
      evaluationPeriods: 2,
      alarmDescription: 'Alert when Lambda execution is close to timeout',
      alarmName: 'secure-financial-processor-duration',
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    });

    // Connect alarms to SNS topic
    failedInvocationsAlarm.addAlarmAction(new cloudwatchActions.SnsAction(securityAlertTopic));
    unauthorizedAccessAlarm.addAlarmAction(new cloudwatchActions.SnsAction(securityAlertTopic));
    throttlesAlarm.addAlarmAction(new cloudwatchActions.SnsAction(securityAlertTopic));
    durationAlarm.addAlarmAction(new cloudwatchActions.SnsAction(securityAlertTopic));

    // CloudTrail log group for audit (optional but recommended)
    const auditLogGroup = new logs.LogGroup(this, 'AuditLogGroup', {
      logGroupName: '/aws/cloudtrail/secure-financial-audit',
      retention: logs.RetentionDays.SEVEN_YEARS,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      encryptionKey: inputBucketKey,
    });

    // Output important resource ARNs
    new cdk.CfnOutput(this, 'VPCId', {
      value: vpc.vpcId,
      description: 'VPC ID for secure processing environment',
    });

    new cdk.CfnOutput(this, 'InputBucketArn', {
      value: inputBucket.bucketArn,
      description: 'Input S3 bucket ARN',
    });

    new cdk.CfnOutput(this, 'OutputBucketArn', {
      value: outputBucket.bucketArn,
      description: 'Output S3 bucket ARN',
    });

    new cdk.CfnOutput(this, 'ProcessorLambdaArn', {
      value: processorLambda.functionArn,
      description: 'Data processor Lambda function ARN',
    });

    new cdk.CfnOutput(this, 'TransactionTableArn', {
      value: transactionTable.tableArn,
      description: 'DynamoDB transaction metadata table ARN',
    });

    new cdk.CfnOutput(this, 'SecurityAlertTopicArn', {
      value: securityAlertTopic.topicArn,
      description: 'SNS topic ARN for security alerts',
    });

    // Apply tags to all resources
    cdk.Tags.of(this).add('Environment', 'Production');
    cdk.Tags.of(this).add('Project', 'SecureFinancialProcessing');
    cdk.Tags.of(this).add('ManagedBy', 'CDK');
    cdk.Tags.of(this).add('DataClassification', 'Sensitive');
    cdk.Tags.of(this).add('Compliance', 'PCI-DSS,SOC2');
  }
}
```