### Complete Solution

This document contains the complete, production-ready CDK application for secure financial data processing infrastructure.

```ts
// bin/tap.ts
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
const prNumber = process.env.PR_NUMBER || 'unknown';
const team = process.env.TEAM || 'unknown';
const createdAt = new Date().toISOString();

// Apply tags to all stacks in this app
Tags.of(app).add('Environment', environmentSuffix);
Tags.of(app).add('Repository', repositoryName);
Tags.of(app).add('Author', commitAuthor);
Tags.of(app).add('PRNumber', prNumber);
Tags.of(app).add('Team', team);
Tags.of(app).add('CreatedAt', createdAt);

new TapStack(app, stackName, {
  stackName: stackName,
  environmentSuffix: environmentSuffix,
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
});
```

```ts
// lib/tap-stack.ts
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

    // VPC & Endpoints
    const vpc = new ec2.Vpc(this, 'SecureVPC', {
      vpcName: `secure-financial-vpc-${environmentSuffix}`,
      maxAzs: 3,
      natGateways: 0,
      subnetConfiguration: [
        {
          name: 'Private',
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
          cidrMask: 24,
        },
      ],
    });

    const lambdaSG = new ec2.SecurityGroup(this, 'LambdaSecurityGroup', {
      vpc,
      description: 'Security group for Lambda functions in VPC',
      allowAllOutbound: false,
    });

    const endpointSG = new ec2.SecurityGroup(this, 'VPCEndpointSecurityGroup', {
      vpc,
      description: 'Security group for VPC endpoints',
      allowAllOutbound: false,
    });

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

    const s3Endpoint = vpc.addGatewayEndpoint('S3Endpoint', {
      service: ec2.GatewayVpcEndpointAwsService.S3,
      subnets: [
        {
          subnets: vpc.isolatedSubnets,
        },
      ],
    });

    const dynamodbEndpoint = vpc.addGatewayEndpoint('DynamoDBEndpoint', {
      service: ec2.GatewayVpcEndpointAwsService.DYNAMODB,
      subnets: [
        {
          subnets: vpc.isolatedSubnets,
        },
      ],
    });

    vpc.addInterfaceEndpoint('CloudWatchLogsEndpoint', {
      service: ec2.InterfaceVpcEndpointAwsService.CLOUDWATCH_LOGS,
      subnets: {
        subnets: vpc.isolatedSubnets,
      },
      securityGroups: [endpointSG],
      privateDnsEnabled: true,
    });

    vpc.addInterfaceEndpoint('KMSEndpoint', {
      service: ec2.InterfaceVpcEndpointAwsService.KMS,
      subnets: {
        subnets: vpc.isolatedSubnets,
      },
      securityGroups: [endpointSG],
      privateDnsEnabled: true,
    });

    // SNS Topic for Security Alerts
    const securityAlertTopic = new sns.Topic(this, 'SecurityAlertTopic', {
      topicName: `secure-financial-security-alerts-${environmentSuffix}`,
      displayName: 'Security Alerts for Financial Data Processing',
    });

    // KMS Keys
    const inputBucketKey = new kms.Key(this, 'InputBucketKMSKey', {
      alias: `alias/secure-financial-input-bucket-${environmentSuffix}`,
      description: 'KMS key for encrypting input financial data',
      enableKeyRotation: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const outputBucketKey = new kms.Key(this, 'OutputBucketKMSKey', {
      alias: `alias/secure-financial-output-bucket-${environmentSuffix}`,
      description: 'KMS key for encrypting processed financial data',
      enableKeyRotation: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const dynamoDbKey = new kms.Key(this, 'DynamoDbKMSKey', {
      alias: `alias/secure-financial-dynamodb-${environmentSuffix}`,
      description: 'KMS key for encrypting DynamoDB transaction metadata',
      enableKeyRotation: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // S3 Buckets
    const inputBucket = new s3.Bucket(this, 'InputDataBucket', {
      bucketName: `secure-financial-input-${this.account}-${this.region}-${environmentSuffix}`,
      encryption: s3.BucketEncryption.KMS,
      encryptionKey: inputBucketKey,
      bucketKeyEnabled: true,
      versioned: true,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      enforceSSL: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      lifecycleRules: [
        {
          id: 'TransitionToIA',
          enabled: true,
          transitions: [
            {
              storageClass: s3.StorageClass.INFREQUENT_ACCESS,
              transitionAfter: cdk.Duration.days(30),
            },
          ],
        },
      ],
    });

    const outputBucket = new s3.Bucket(this, 'OutputDataBucket', {
      bucketName: `secure-financial-output-${this.account}-${this.region}-${environmentSuffix}`,
      encryption: s3.BucketEncryption.KMS,
      encryptionKey: outputBucketKey,
      bucketKeyEnabled: true,
      versioned: true,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      enforceSSL: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      lifecycleRules: [
        {
          id: 'TransitionToIA',
          enabled: true,
          transitions: [
            {
              storageClass: s3.StorageClass.INFREQUENT_ACCESS,
              transitionAfter: cdk.Duration.days(60),
            },
          ],
        },
      ],
    });

    // DynamoDB Table
    const transactionTable = new dynamodb.Table(
      this,
      'TransactionMetadataTable',
      {
        tableName: `secure-financial-transactions-${environmentSuffix}`,
        partitionKey: {
          name: 'transactionId',
          type: dynamodb.AttributeType.STRING,
        },
        sortKey: { name: 'timestamp', type: dynamodb.AttributeType.NUMBER },
        billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
        encryption: dynamodb.TableEncryption.CUSTOMER_MANAGED,
        encryptionKey: dynamoDbKey,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
      }
    );

    // Use escape hatch to set point-in-time recovery
    const cfnTable = transactionTable.node.defaultChild as dynamodb.CfnTable;
    cfnTable.pointInTimeRecoverySpecification = {
      pointInTimeRecoveryEnabled: true,
    };

    // Lambda Functions
    // Grant CloudWatch Logs permission to use the KMS key for log encryption
    inputBucketKey.addToResourcePolicy(
      new iam.PolicyStatement({
        sid: 'AllowCloudWatchLogs',
        effect: iam.Effect.ALLOW,
        principals: [
          new iam.ServicePrincipal(`logs.${this.region}.amazonaws.com`),
        ],
        actions: [
          'kms:Encrypt',
          'kms:Decrypt',
          'kms:ReEncrypt*',
          'kms:GenerateDataKey*',
          'kms:DescribeKey',
        ],
        resources: ['*'],
      })
    );

    const lambdaLogGroup = new logs.LogGroup(this, 'ProcessorLambdaLogGroup', {
      logGroupName: `/aws/lambda/secure-financial-processor-${environmentSuffix}`,
      retention: logs.RetentionDays.SEVEN_YEARS,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      encryptionKey: inputBucketKey,
    });

    const lambdaRole = new iam.Role(this, 'ProcessorLambdaRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      description: 'Least-privilege role for financial data processor Lambda',
    });

    lambdaRole.addManagedPolicy(
      iam.ManagedPolicy.fromAwsManagedPolicyName(
        'service-role/AWSLambdaVPCAccessExecutionRole'
      )
    );

    lambdaRole.addToPolicy(
      new iam.PolicyStatement({
        sid: 'AllowS3ReadFromInput',
        effect: iam.Effect.ALLOW,
        actions: ['s3:GetObject', 's3:GetObjectVersion', 's3:ListBucket'],
        resources: [inputBucket.bucketArn, `${inputBucket.bucketArn}/*`],
      })
    );

    lambdaRole.addToPolicy(
      new iam.PolicyStatement({
        sid: 'AllowS3WriteToOutput',
        effect: iam.Effect.ALLOW,
        actions: ['s3:PutObject'],
        resources: [`${outputBucket.bucketArn}/*`],
      })
    );

    lambdaRole.addToPolicy(
      new iam.PolicyStatement({
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
      })
    );

    lambdaRole.addToPolicy(
      new iam.PolicyStatement({
        sid: 'AllowDynamoDBOperations',
        effect: iam.Effect.ALLOW,
        actions: [
          'dynamodb:PutItem',
          'dynamodb:GetItem',
          'dynamodb:Query',
          'dynamodb:UpdateItem',
        ],
        resources: [transactionTable.tableArn],
      })
    );

    lambdaRole.addToPolicy(
      new iam.PolicyStatement({
        sid: 'AllowCloudWatchLogs',
        effect: iam.Effect.ALLOW,
        actions: ['logs:CreateLogStream', 'logs:PutLogEvents'],
        resources: [lambdaLogGroup.logGroupArn],
      })
    );

    // IAM Policies (Least Privilege + Deny)
    lambdaRole.addToPolicy(
      new iam.PolicyStatement({
        sid: 'ExplicitDenyDangerousS3Operations',
        effect: iam.Effect.DENY,
        actions: [
          's3:DeleteBucket',
          's3:DeleteBucketPolicy',
          's3:PutBucketAcl',
          's3:PutBucketPolicy',
          's3:PutBucketPublicAccessBlock',
        ],
        resources: ['*'],
      })
    );

    lambdaRole.addToPolicy(
      new iam.PolicyStatement({
        sid: 'ExplicitDenyDangerousKMSOperations',
        effect: iam.Effect.DENY,
        actions: [
          'kms:DisableKey',
          'kms:DeleteAlias',
          'kms:ScheduleKeyDeletion',
          'kms:PutKeyPolicy',
        ],
        resources: ['*'],
      })
    );

    lambdaRole.addToPolicy(
      new iam.PolicyStatement({
        sid: 'ExplicitDenyDangerousDynamoOperations',
        effect: iam.Effect.DENY,
        actions: ['dynamodb:DeleteTable', 'dynamodb:DeleteBackup'],
        resources: ['*'],
      })
    );

    const processorLambda = new lambda.Function(this, 'DataProcessorLambda', {
      functionName: `secure-financial-processor-${environmentSuffix}`,
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
              
              const inputData = await s3.getObject({
                Bucket: bucket,
                Key: key
              }).promise();
              
              const processedData = JSON.stringify({
                processed: true,
                timestamp: new Date().toISOString(),
                dataHash: crypto.createHash('sha256').update(inputData.Body).digest('hex')
              });
              
              const transactionId = crypto.randomUUID();
              const timestamp = Date.now();
              const outputKey = \`processed/\${timestamp}-\${key}\`;
              
              await s3.putObject({
                Bucket: process.env.OUTPUT_BUCKET,
                Key: outputKey,
                Body: processedData,
                ServerSideEncryption: 'aws:kms',
                SSEKMSKeyId: process.env.OUTPUT_KMS_KEY,
              }).promise();
              
              await dynamodb.put({
                TableName: process.env.TRANSACTION_TABLE,
                Item: {
                  transactionId: transactionId,
                  timestamp: timestamp,
                  inputKey: key,
                  outputKey: outputKey,
                  processedAt: new Date().toISOString(),
                  status: 'SUCCESS',
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
      logGroup: lambdaLogGroup,
      environmentEncryption: inputBucketKey,
    });

    inputBucketKey.grantDecrypt(processorLambda);
    outputBucketKey.grantEncrypt(processorLambda);
    dynamoDbKey.grant(processorLambda, 'kms:Decrypt', 'kms:Encrypt');

    inputBucket.addEventNotification(
      s3.EventType.OBJECT_CREATED,
      new s3n.LambdaDestination(processorLambda),
      { prefix: 'incoming/' }
    );

    s3Endpoint.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        principals: [lambdaRole],
        actions: ['s3:*'],
        resources: [
          inputBucket.bucketArn,
          `${inputBucket.bucketArn}/*`,
          outputBucket.bucketArn,
          `${outputBucket.bucketArn}/*`,
        ],
      })
    );

    dynamodbEndpoint.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        principals: [lambdaRole],
        actions: ['dynamodb:*'],
        resources: [transactionTable.tableArn],
      })
    );

    // Logs & Alarms
    const unauthorizedAccessFilter = new logs.MetricFilter(
      this,
      'UnauthorizedAccessFilter',
      {
        logGroup: lambdaLogGroup,
        filterPattern: logs.FilterPattern.literal(
          '[time, request_id, level = ERROR, msg = *AccessDenied* || msg = *Forbidden* || msg = *Unauthorized*]'
        ),
        metricName: 'UnauthorizedAccessAttempts',
        metricNamespace: 'SecureFinancial/Security',
        metricValue: '1',
        defaultValue: 0,
      }
    );

    const failedInvocationsAlarm = new cloudwatch.Alarm(
      this,
      'FailedInvocationsAlarm',
      {
        metric: processorLambda.metricErrors({
          period: cdk.Duration.minutes(1),
        }),
        threshold: 1,
        evaluationPeriods: 1,
        alarmDescription: 'Alert when Lambda function fails',
        treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      }
    );

    const unauthorizedAccessAlarm = new cloudwatch.Alarm(
      this,
      'UnauthorizedAccessAlarm',
      {
        metric: unauthorizedAccessFilter.metric({
          period: cdk.Duration.minutes(5),
          statistic: cloudwatch.Stats.SUM,
        }),
        threshold: 1,
        evaluationPeriods: 1,
        alarmDescription: 'Alert on unauthorized access attempts',
        treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      }
    );

    failedInvocationsAlarm.addAlarmAction(
      new cloudwatchActions.SnsAction(securityAlertTopic)
    );
    unauthorizedAccessAlarm.addAlarmAction(
      new cloudwatchActions.SnsAction(securityAlertTopic)
    );

    // Apply tags
    cdk.Tags.of(this).add('Environment', 'Production');
    cdk.Tags.of(this).add('Project', 'SecureFinancialProcessing');
    cdk.Tags.of(this).add('ManagedBy', 'CDK');
    cdk.Tags.of(this).add('DataClassification', 'Sensitive');

    // Stack Outputs
    new cdk.CfnOutput(this, 'VPCId', {
      value: vpc.vpcId,
      description: 'VPC ID for secure processing environment',
      exportName: `TapStack-${environmentSuffix}-VPCId`,
    });

    new cdk.CfnOutput(this, 'InputBucketName', {
      value: inputBucket.bucketName,
      description: 'Input S3 bucket name',
      exportName: `TapStack-${environmentSuffix}-InputBucketName`,
    });

    new cdk.CfnOutput(this, 'InputBucketArn', {
      value: inputBucket.bucketArn,
      description: 'Input S3 bucket ARN',
      exportName: `TapStack-${environmentSuffix}-InputBucketArn`,
    });

    new cdk.CfnOutput(this, 'OutputBucketName', {
      value: outputBucket.bucketName,
      description: 'Output S3 bucket name',
      exportName: `TapStack-${environmentSuffix}-OutputBucketName`,
    });

    new cdk.CfnOutput(this, 'OutputBucketArn', {
      value: outputBucket.bucketArn,
      description: 'Output S3 bucket ARN',
      exportName: `TapStack-${environmentSuffix}-OutputBucketArn`,
    });

    new cdk.CfnOutput(this, 'ProcessorLambdaArn', {
      value: processorLambda.functionArn,
      description: 'Data processor Lambda function ARN',
      exportName: `TapStack-${environmentSuffix}-ProcessorLambdaArn`,
    });

    new cdk.CfnOutput(this, 'ProcessorLambdaName', {
      value: processorLambda.functionName,
      description: 'Data processor Lambda function name',
      exportName: `TapStack-${environmentSuffix}-ProcessorLambdaName`,
    });

    new cdk.CfnOutput(this, 'TransactionTableName', {
      value: transactionTable.tableName,
      description: 'DynamoDB transaction metadata table name',
      exportName: `TapStack-${environmentSuffix}-TransactionTableName`,
    });

    new cdk.CfnOutput(this, 'TransactionTableArn', {
      value: transactionTable.tableArn,
      description: 'DynamoDB transaction metadata table ARN',
      exportName: `TapStack-${environmentSuffix}-TransactionTableArn`,
    });

    new cdk.CfnOutput(this, 'SecurityAlertTopicArn', {
      value: securityAlertTopic.topicArn,
      description: 'SNS topic ARN for security alerts',
      exportName: `TapStack-${environmentSuffix}-SecurityAlertTopicArn`,
    });

    new cdk.CfnOutput(this, 'InputBucketKMSKeyArn', {
      value: inputBucketKey.keyArn,
      description: 'KMS key ARN for input bucket encryption',
      exportName: `TapStack-${environmentSuffix}-InputBucketKMSKeyArn`,
    });

    new cdk.CfnOutput(this, 'OutputBucketKMSKeyArn', {
      value: outputBucketKey.keyArn,
      description: 'KMS key ARN for output bucket encryption',
      exportName: `TapStack-${environmentSuffix}-OutputBucketKMSKeyArn`,
    });

    new cdk.CfnOutput(this, 'DynamoDBKMSKeyArn', {
      value: dynamoDbKey.keyArn,
      description: 'KMS key ARN for DynamoDB encryption',
      exportName: `TapStack-${environmentSuffix}-DynamoDBKMSKeyArn`,
    });

    new cdk.CfnOutput(this, 'LambdaLogGroupName', {
      value: lambdaLogGroup.logGroupName,
      description: 'CloudWatch Log Group name for Lambda function',
      exportName: `TapStack-${environmentSuffix}-LambdaLogGroupName`,
    });
  }
}
```
