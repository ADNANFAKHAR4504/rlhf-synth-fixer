/**
 * tap-stack.ts
 *
 * Serverless Fraud Detection System
 * Complete Pulumi TypeScript infrastructure for processing millions of
 * daily transaction events with fraud detection capabilities.
 */
import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';
import { ResourceOptions } from '@pulumi/pulumi';

/**
 * TapStackArgs defines the input arguments for the TapStack Pulumi component.
 */
export interface TapStackArgs {
  /**
   * An optional suffix for identifying the deployment environment (e.g., 'dev', 'prod').
   * Defaults to 'dev' if not provided.
   */
  environmentSuffix?: string;

  /**
   * Optional default tags to apply to resources.
   */
  tags?: pulumi.Input<{ [key: string]: string }>;
}

/**
 * Serverless Fraud Detection Stack
 *
 * This component creates a complete serverless fraud detection system with:
 * - VPC with private subnets and VPC endpoints (no NAT Gateway)
 * - DynamoDB table for transaction storage
 * - Lambda functions for ingestion, detection, and alerting
 * - SQS queues with DLQs for reliable message processing
 * - API Gateway for transaction ingestion
 * - EventBridge for scheduled batch processing
 * - SNS topic for fraud alerts
 * - KMS encryption for Lambda environment variables
 * - CloudWatch logs with 7-day retention
 */
export class TapStack extends pulumi.ComponentResource {
  public readonly apiEndpoint: pulumi.Output<string>;
  public readonly tableArn: pulumi.Output<string>;
  public readonly tableName: pulumi.Output<string>;
  public readonly ingestionFunctionName: pulumi.Output<string>;
  public readonly detectorFunctionName: pulumi.Output<string>;
  public readonly alertFunctionName: pulumi.Output<string>;
  public readonly queueUrl: pulumi.Output<string>;
  public readonly topicArn: pulumi.Output<string>;

  /**
   * Creates a new TapStack component.
   * @param name The logical name of this Pulumi component.
   * @param args Configuration arguments including environment suffix and tags.
   * @param opts Pulumi options.
   */
  constructor(name: string, args: TapStackArgs, opts?: ResourceOptions) {
    super('tap:stack:TapStack', name, args, opts);

    const environmentSuffix = args.environmentSuffix || 'dev';
    const tags = args.tags || {};

    // Get current AWS region
    const region = aws.getRegionOutput({}, { parent: this }).name;

    // ===========================================
    // VPC and Networking Configuration
    // ===========================================

    // VPC for Lambda functions
    const vpc = new aws.ec2.Vpc(
      `fraud-vpc-${environmentSuffix}`,
      {
        cidrBlock: '10.0.0.0/16',
        enableDnsHostnames: true,
        enableDnsSupport: true,
        tags: { ...tags, Name: `fraud-vpc-${environmentSuffix}` },
      },
      { parent: this }
    );

    // Get availability zones
    const azs = aws.getAvailabilityZonesOutput(
      {
        state: 'available',
      },
      { parent: this }
    );

    // Private subnets across 3 AZs
    const privateSubnet1 = new aws.ec2.Subnet(
      `fraud-private-subnet-1-${environmentSuffix}`,
      {
        vpcId: vpc.id,
        cidrBlock: '10.0.1.0/24',
        availabilityZone: azs.names[0],
        tags: { ...tags, Name: `fraud-private-subnet-1-${environmentSuffix}` },
      },
      { parent: this }
    );

    const privateSubnet2 = new aws.ec2.Subnet(
      `fraud-private-subnet-2-${environmentSuffix}`,
      {
        vpcId: vpc.id,
        cidrBlock: '10.0.2.0/24',
        availabilityZone: azs.names[1],
        tags: { ...tags, Name: `fraud-private-subnet-2-${environmentSuffix}` },
      },
      { parent: this }
    );

    const privateSubnet3 = new aws.ec2.Subnet(
      `fraud-private-subnet-3-${environmentSuffix}`,
      {
        vpcId: vpc.id,
        cidrBlock: '10.0.3.0/24',
        availabilityZone: azs.names[2],
        tags: { ...tags, Name: `fraud-private-subnet-3-${environmentSuffix}` },
      },
      { parent: this }
    );

    const privateSubnets = [privateSubnet1, privateSubnet2, privateSubnet3];

    // Security group for VPC endpoints
    const vpcEndpointSg = new aws.ec2.SecurityGroup(
      `vpc-endpoint-sg-${environmentSuffix}`,
      {
        vpcId: vpc.id,
        description: 'Security group for VPC endpoints',
        ingress: [
          {
            protocol: 'tcp',
            fromPort: 443,
            toPort: 443,
            cidrBlocks: ['10.0.0.0/16'],
            description: 'HTTPS from VPC',
          },
        ],
        egress: [
          {
            protocol: '-1',
            fromPort: 0,
            toPort: 0,
            cidrBlocks: ['0.0.0.0/0'],
            description: 'All outbound',
          },
        ],
        tags: { ...tags, Name: `vpc-endpoint-sg-${environmentSuffix}` },
      },
      { parent: this }
    );

    // Route table for private subnets
    const privateRouteTable = new aws.ec2.RouteTable(
      `fraud-private-rt-${environmentSuffix}`,
      {
        vpcId: vpc.id,
        tags: { ...tags, Name: `fraud-private-rt-${environmentSuffix}` },
      },
      { parent: this }
    );

    // Associate route table with private subnets
    new aws.ec2.RouteTableAssociation(
      `fraud-rta-1-${environmentSuffix}`,
      {
        subnetId: privateSubnet1.id,
        routeTableId: privateRouteTable.id,
      },
      { parent: this }
    );

    new aws.ec2.RouteTableAssociation(
      `fraud-rta-2-${environmentSuffix}`,
      {
        subnetId: privateSubnet2.id,
        routeTableId: privateRouteTable.id,
      },
      { parent: this }
    );

    new aws.ec2.RouteTableAssociation(
      `fraud-rta-3-${environmentSuffix}`,
      {
        subnetId: privateSubnet3.id,
        routeTableId: privateRouteTable.id,
      },
      { parent: this }
    );

    // VPC Gateway Endpoint for DynamoDB (cost-effective)
    new aws.ec2.VpcEndpoint(
      `dynamodb-endpoint-${environmentSuffix}`,
      {
        vpcId: vpc.id,
        serviceName: pulumi.interpolate`com.amazonaws.${region}.dynamodb`,
        vpcEndpointType: 'Gateway',
        routeTableIds: [privateRouteTable.id],
        tags: { ...tags, Name: `dynamodb-endpoint-${environmentSuffix}` },
      },
      { parent: this }
    );

    // VPC Interface Endpoint for SQS
    new aws.ec2.VpcEndpoint(
      `sqs-endpoint-${environmentSuffix}`,
      {
        vpcId: vpc.id,
        serviceName: pulumi.interpolate`com.amazonaws.${region}.sqs`,
        vpcEndpointType: 'Interface',
        subnetIds: privateSubnets.map(s => s.id),
        securityGroupIds: [vpcEndpointSg.id],
        privateDnsEnabled: true,
        tags: { ...tags, Name: `sqs-endpoint-${environmentSuffix}` },
      },
      { parent: this }
    );

    // VPC Interface Endpoint for SNS
    new aws.ec2.VpcEndpoint(
      `sns-endpoint-${environmentSuffix}`,
      {
        vpcId: vpc.id,
        serviceName: pulumi.interpolate`com.amazonaws.${region}.sns`,
        vpcEndpointType: 'Interface',
        subnetIds: privateSubnets.map(s => s.id),
        securityGroupIds: [vpcEndpointSg.id],
        privateDnsEnabled: true,
        tags: { ...tags, Name: `sns-endpoint-${environmentSuffix}` },
      },
      { parent: this }
    );

    // ===========================================
    // KMS Key for Lambda Environment Variables
    // ===========================================

    const kmsKey = new aws.kms.Key(
      `fraud-lambda-kms-${environmentSuffix}`,
      {
        description: 'KMS key for Lambda environment variable encryption',
        enableKeyRotation: true,
        tags: { ...tags, Name: `fraud-lambda-kms-${environmentSuffix}` },
      },
      { parent: this }
    );

    new aws.kms.Alias(
      `fraud-lambda-kms-alias-${environmentSuffix}`,
      {
        name: `alias/fraud-lambda-${environmentSuffix}`,
        targetKeyId: kmsKey.id,
      },
      { parent: this }
    );

    // ===========================================
    // DynamoDB Table for Transaction Storage
    // ===========================================

    const fraudTable = new aws.dynamodb.Table(
      `fraud-transactions-${environmentSuffix}`,
      {
        name: `fraud-transactions-${environmentSuffix}`,
        billingMode: 'PAY_PER_REQUEST',
        hashKey: 'transactionId',
        rangeKey: 'timestamp',
        attributes: [
          { name: 'transactionId', type: 'S' },
          { name: 'timestamp', type: 'N' },
        ],
        pointInTimeRecovery: { enabled: true },
        tags: { ...tags, Name: `fraud-transactions-${environmentSuffix}` },
      },
      { parent: this }
    );

    // ===========================================
    // SNS Topic for Fraud Alerts
    // ===========================================

    const fraudAlertsTopic = new aws.sns.Topic(
      `fraud-alerts-${environmentSuffix}`,
      {
        name: `fraud-alerts-${environmentSuffix}`,
        tags: { ...tags, Name: `fraud-alerts-${environmentSuffix}` },
      },
      { parent: this }
    );

    // ===========================================
    // SQS Queues with Dead Letter Queues
    // ===========================================

    // Dead Letter Queue for analysis queue
    const analysisQueueDlq = new aws.sqs.Queue(
      `fraud-analysis-dlq-${environmentSuffix}`,
      {
        name: `fraud-analysis-dlq-${environmentSuffix}`,
        messageRetentionSeconds: 1209600, // 14 days
        tags: { ...tags, Name: `fraud-analysis-dlq-${environmentSuffix}` },
      },
      { parent: this }
    );

    // Dead Letter Queue for alert queue
    const alertQueueDlq = new aws.sqs.Queue(
      `alert-dlq-${environmentSuffix}`,
      {
        name: `alert-dlq-${environmentSuffix}`,
        messageRetentionSeconds: 1209600, // 14 days
        tags: { ...tags, Name: `alert-dlq-${environmentSuffix}` },
      },
      { parent: this }
    );

    // Main analysis queue
    const fraudAnalysisQueue = new aws.sqs.Queue(
      `fraud-analysis-queue-${environmentSuffix}`,
      {
        name: `fraud-analysis-queue-${environmentSuffix}`,
        visibilityTimeoutSeconds: 300,
        redrivePolicy: pulumi.jsonStringify({
          deadLetterTargetArn: analysisQueueDlq.arn,
          maxReceiveCount: 3,
        }),
        tags: { ...tags, Name: `fraud-analysis-queue-${environmentSuffix}` },
      },
      { parent: this }
    );

    // Alert queue
    const alertQueue = new aws.sqs.Queue(
      `alert-queue-${environmentSuffix}`,
      {
        name: `alert-queue-${environmentSuffix}`,
        visibilityTimeoutSeconds: 300,
        redrivePolicy: pulumi.jsonStringify({
          deadLetterTargetArn: alertQueueDlq.arn,
          maxReceiveCount: 3,
        }),
        tags: { ...tags, Name: `alert-queue-${environmentSuffix}` },
      },
      { parent: this }
    );

    // ===========================================
    // Lambda Security Group
    // ===========================================

    const lambdaSg = new aws.ec2.SecurityGroup(
      `lambda-sg-${environmentSuffix}`,
      {
        vpcId: vpc.id,
        description: 'Security group for Lambda functions',
        egress: [
          {
            protocol: '-1',
            fromPort: 0,
            toPort: 0,
            cidrBlocks: ['0.0.0.0/0'],
            description: 'All outbound',
          },
        ],
        tags: { ...tags, Name: `lambda-sg-${environmentSuffix}` },
      },
      { parent: this }
    );

    // ===========================================
    // Lambda Function: Transaction Ingestion
    // ===========================================

    // IAM Role for transaction-ingestion Lambda
    const ingestionRole = new aws.iam.Role(
      `transaction-ingestion-role-${environmentSuffix}`,
      {
        name: `transaction-ingestion-role-${environmentSuffix}`,
        assumeRolePolicy: aws.iam.assumeRolePolicyForPrincipal({
          Service: 'lambda.amazonaws.com',
        }),
        tags: {
          ...tags,
          Name: `transaction-ingestion-role-${environmentSuffix}`,
        },
      },
      { parent: this }
    );

    new aws.iam.RolePolicyAttachment(
      `ingestion-vpc-policy-${environmentSuffix}`,
      {
        role: ingestionRole.name,
        policyArn:
          'arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole',
      },
      { parent: this }
    );

    new aws.iam.RolePolicy(
      `ingestion-policy-${environmentSuffix}`,
      {
        role: ingestionRole.id,
        policy: pulumi
          .all([fraudTable.arn, fraudAnalysisQueue.arn, kmsKey.arn])
          .apply(([tableArn, queueArn, kmsArn]) =>
            JSON.stringify({
              Version: '2012-10-17',
              Statement: [
                {
                  Effect: 'Allow',
                  Action: ['dynamodb:PutItem', 'dynamodb:UpdateItem'],
                  Resource: tableArn,
                },
                {
                  Effect: 'Allow',
                  Action: ['sqs:SendMessage'],
                  Resource: queueArn,
                },
                {
                  Effect: 'Allow',
                  Action: ['kms:Decrypt', 'kms:DescribeKey'],
                  Resource: kmsArn,
                },
              ],
            })
          ),
      },
      { parent: this }
    );

    // CloudWatch Log Group for ingestion Lambda
    const ingestionLogGroup = new aws.cloudwatch.LogGroup(
      `/aws/lambda/transaction-ingestion-${environmentSuffix}`,
      {
        name: `/aws/lambda/transaction-ingestion-${environmentSuffix}`,
        retentionInDays: 7,
        tags: {
          ...tags,
          Name: `/aws/lambda/transaction-ingestion-${environmentSuffix}`,
        },
      },
      { parent: this }
    );

    // Transaction Ingestion Lambda Function
    const ingestionLambda = new aws.lambda.Function(
      `transaction-ingestion-${environmentSuffix}`,
      {
        name: `transaction-ingestion-${environmentSuffix}`,
        runtime: 'nodejs20.x',
        architectures: ['arm64'], // Graviton2
        handler: 'index.handler',
        role: ingestionRole.arn,
        code: new pulumi.asset.AssetArchive({
          'index.js': new pulumi.asset.StringAsset(`
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand } = require('@aws-sdk/lib-dynamodb');
const { SQSClient, SendMessageCommand } = require('@aws-sdk/client-sqs');

const ddbClient = new DynamoDBClient({});
const dynamodb = DynamoDBDocumentClient.from(ddbClient);
const sqs = new SQSClient({});

exports.handler = async (event) => {
  console.log('Received event:', JSON.stringify(event, null, 2));

  const body = JSON.parse(event.body || '{}');
  const transactionId = body.transactionId || \`txn-\${Date.now()}\`;
  const timestamp = Date.now();

  try {
    // Store in DynamoDB
    await dynamodb.send(new PutCommand({
      TableName: process.env.TABLE_NAME,
      Item: {
        transactionId,
        timestamp,
        amount: body.amount || 0,
        userId: body.userId || 'unknown',
        status: 'pending',
        createdAt: new Date().toISOString(),
        ...body,
      },
    }));

    // Send to SQS for analysis
    await sqs.send(new SendMessageCommand({
      QueueUrl: process.env.QUEUE_URL,
      MessageBody: JSON.stringify({ transactionId, timestamp, ...body }),
    }));

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: 'Transaction received',
        transactionId,
        timestamp,
      }),
    };
  } catch (error) {
    console.error('Error processing transaction:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: 'Error processing transaction',
        error: error.message,
      }),
    };
  }
};
          `),
        }),
        environment: {
          variables: {
            TABLE_NAME: fraudTable.name,
            QUEUE_URL: fraudAnalysisQueue.url,
          },
        },
        kmsKeyArn: kmsKey.arn,
        vpcConfig: {
          subnetIds: privateSubnets.map(s => s.id),
          securityGroupIds: [lambdaSg.id],
        },
        reservedConcurrentExecutions: 50,
        timeout: 30,
        memorySize: 512,
        tags: { ...tags, Name: `transaction-ingestion-${environmentSuffix}` },
      },
      { parent: this, dependsOn: [ingestionLogGroup] }
    );

    // ===========================================
    // Lambda Function: Fraud Detector
    // ===========================================

    // IAM Role for fraud-detector Lambda
    const detectorRole = new aws.iam.Role(
      `fraud-detector-role-${environmentSuffix}`,
      {
        name: `fraud-detector-role-${environmentSuffix}`,
        assumeRolePolicy: aws.iam.assumeRolePolicyForPrincipal({
          Service: 'lambda.amazonaws.com',
        }),
        tags: { ...tags, Name: `fraud-detector-role-${environmentSuffix}` },
      },
      { parent: this }
    );

    new aws.iam.RolePolicyAttachment(
      `detector-vpc-policy-${environmentSuffix}`,
      {
        role: detectorRole.name,
        policyArn:
          'arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole',
      },
      { parent: this }
    );

    new aws.iam.RolePolicy(
      `detector-policy-${environmentSuffix}`,
      {
        role: detectorRole.id,
        policy: pulumi
          .all([
            fraudTable.arn,
            fraudAnalysisQueue.arn,
            alertQueue.arn,
            kmsKey.arn,
          ])
          .apply(([tableArn, analysisQueueArn, alertQueueArn, kmsArn]) =>
            JSON.stringify({
              Version: '2012-10-17',
              Statement: [
                {
                  Effect: 'Allow',
                  Action: [
                    'dynamodb:GetItem',
                    'dynamodb:Query',
                    'dynamodb:UpdateItem',
                  ],
                  Resource: tableArn,
                },
                {
                  Effect: 'Allow',
                  Action: [
                    'sqs:ReceiveMessage',
                    'sqs:DeleteMessage',
                    'sqs:GetQueueAttributes',
                  ],
                  Resource: analysisQueueArn,
                },
                {
                  Effect: 'Allow',
                  Action: ['sqs:SendMessage'],
                  Resource: alertQueueArn,
                },
                {
                  Effect: 'Allow',
                  Action: ['kms:Decrypt', 'kms:DescribeKey'],
                  Resource: kmsArn,
                },
              ],
            })
          ),
      },
      { parent: this }
    );

    // CloudWatch Log Group for detector Lambda
    const detectorLogGroup = new aws.cloudwatch.LogGroup(
      `/aws/lambda/fraud-detector-${environmentSuffix}`,
      {
        name: `/aws/lambda/fraud-detector-${environmentSuffix}`,
        retentionInDays: 7,
        tags: {
          ...tags,
          Name: `/aws/lambda/fraud-detector-${environmentSuffix}`,
        },
      },
      { parent: this }
    );

    // Fraud Detector Lambda Function
    const detectorLambda = new aws.lambda.Function(
      `fraud-detector-${environmentSuffix}`,
      {
        name: `fraud-detector-${environmentSuffix}`,
        runtime: 'nodejs20.x',
        architectures: ['arm64'], // Graviton2
        handler: 'index.handler',
        role: detectorRole.arn,
        code: new pulumi.asset.AssetArchive({
          'index.js': new pulumi.asset.StringAsset(`
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, UpdateCommand } = require('@aws-sdk/lib-dynamodb');
const { SQSClient, SendMessageCommand } = require('@aws-sdk/client-sqs');

const ddbClient = new DynamoDBClient({});
const dynamodb = DynamoDBDocumentClient.from(ddbClient);
const sqs = new SQSClient({});

exports.handler = async (event) => {
  console.log('Received event:', JSON.stringify(event, null, 2));

  // Process SQS messages or EventBridge scheduled event
  const records = event.Records || [];

  if (records.length === 0) {
    console.log('EventBridge scheduled trigger - no messages to process');
    return { statusCode: 200, body: 'No messages to process' };
  }

  for (const record of records) {
    try {
      const transaction = JSON.parse(record.body);
      console.log('Processing transaction:', transaction.transactionId);

      // Simple fraud detection logic
      const amount = transaction.amount || 0;
      const isFraudulent = amount > 10000;
      const fraudScore = isFraudulent ? 0.9 : 0.1;

      // Update DynamoDB
      await dynamodb.send(new UpdateCommand({
        TableName: process.env.TABLE_NAME,
        Key: {
          transactionId: transaction.transactionId,
          timestamp: transaction.timestamp,
        },
        UpdateExpression: 'SET #status = :status, fraudScore = :score, analyzedAt = :analyzedAt',
        ExpressionAttributeNames: { '#status': 'status' },
        ExpressionAttributeValues: {
          ':status': isFraudulent ? 'flagged' : 'approved',
          ':score': fraudScore,
          ':analyzedAt': new Date().toISOString(),
        },
      }));

      // Send to alert queue if fraudulent
      if (isFraudulent) {
        await sqs.send(new SendMessageCommand({
          QueueUrl: process.env.ALERT_QUEUE_URL,
          MessageBody: JSON.stringify({
            ...transaction,
            fraudScore,
            reason: 'High transaction amount detected',
            detectedAt: new Date().toISOString(),
          }),
        }));
        console.log('Fraudulent transaction sent to alert queue:', transaction.transactionId);
      }
    } catch (error) {
      console.error('Error processing transaction:', error);
      throw error; // Let SQS handle retry/DLQ
    }
  }

  return { statusCode: 200, body: JSON.stringify({ processed: records.length }) };
};
          `),
        }),
        environment: {
          variables: {
            TABLE_NAME: fraudTable.name,
            ALERT_QUEUE_URL: alertQueue.url,
          },
        },
        kmsKeyArn: kmsKey.arn,
        vpcConfig: {
          subnetIds: privateSubnets.map(s => s.id),
          securityGroupIds: [lambdaSg.id],
        },
        reservedConcurrentExecutions: 30,
        timeout: 60,
        memorySize: 512,
        tags: { ...tags, Name: `fraud-detector-${environmentSuffix}` },
      },
      { parent: this, dependsOn: [detectorLogGroup] }
    );

    // Event source mapping for fraud detector (SQS trigger)
    new aws.lambda.EventSourceMapping(
      `fraud-detector-sqs-trigger-${environmentSuffix}`,
      {
        eventSourceArn: fraudAnalysisQueue.arn,
        functionName: detectorLambda.name,
        batchSize: 10,
        maximumBatchingWindowInSeconds: 5,
      },
      { parent: this }
    );

    // ===========================================
    // Lambda Function: Alert Dispatcher
    // ===========================================

    // IAM Role for alert-dispatcher Lambda
    const alertRole = new aws.iam.Role(
      `alert-dispatcher-role-${environmentSuffix}`,
      {
        name: `alert-dispatcher-role-${environmentSuffix}`,
        assumeRolePolicy: aws.iam.assumeRolePolicyForPrincipal({
          Service: 'lambda.amazonaws.com',
        }),
        tags: { ...tags, Name: `alert-dispatcher-role-${environmentSuffix}` },
      },
      { parent: this }
    );

    new aws.iam.RolePolicyAttachment(
      `alert-vpc-policy-${environmentSuffix}`,
      {
        role: alertRole.name,
        policyArn:
          'arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole',
      },
      { parent: this }
    );

    new aws.iam.RolePolicy(
      `alert-policy-${environmentSuffix}`,
      {
        role: alertRole.id,
        policy: pulumi
          .all([alertQueue.arn, fraudAlertsTopic.arn, kmsKey.arn])
          .apply(([queueArn, topicArn, kmsArn]) =>
            JSON.stringify({
              Version: '2012-10-17',
              Statement: [
                {
                  Effect: 'Allow',
                  Action: [
                    'sqs:ReceiveMessage',
                    'sqs:DeleteMessage',
                    'sqs:GetQueueAttributes',
                  ],
                  Resource: queueArn,
                },
                {
                  Effect: 'Allow',
                  Action: ['sns:Publish'],
                  Resource: topicArn,
                },
                {
                  Effect: 'Allow',
                  Action: ['kms:Decrypt', 'kms:DescribeKey'],
                  Resource: kmsArn,
                },
              ],
            })
          ),
      },
      { parent: this }
    );

    // CloudWatch Log Group for alert Lambda
    const alertLogGroup = new aws.cloudwatch.LogGroup(
      `/aws/lambda/alert-dispatcher-${environmentSuffix}`,
      {
        name: `/aws/lambda/alert-dispatcher-${environmentSuffix}`,
        retentionInDays: 7,
        tags: {
          ...tags,
          Name: `/aws/lambda/alert-dispatcher-${environmentSuffix}`,
        },
      },
      { parent: this }
    );

    // Alert Dispatcher Lambda Function
    const alertLambda = new aws.lambda.Function(
      `alert-dispatcher-${environmentSuffix}`,
      {
        name: `alert-dispatcher-${environmentSuffix}`,
        runtime: 'nodejs20.x',
        architectures: ['arm64'], // Graviton2
        handler: 'index.handler',
        role: alertRole.arn,
        code: new pulumi.asset.AssetArchive({
          'index.js': new pulumi.asset.StringAsset(`
const { SNSClient, PublishCommand } = require('@aws-sdk/client-sns');

const sns = new SNSClient({});

exports.handler = async (event) => {
  console.log('Received event:', JSON.stringify(event, null, 2));

  // Process SQS messages
  const records = event.Records || [];

  for (const record of records) {
    try {
      const alert = JSON.parse(record.body);
      console.log('Processing alert for transaction:', alert.transactionId);

      // Send SNS notification
      await sns.send(new PublishCommand({
        TopicArn: process.env.TOPIC_ARN,
        Subject: \`Fraud Alert - Transaction \${alert.transactionId}\`,
        Message: JSON.stringify({
          transactionId: alert.transactionId,
          amount: alert.amount,
          userId: alert.userId,
          fraudScore: alert.fraudScore,
          reason: alert.reason,
          detectedAt: alert.detectedAt,
          timestamp: alert.timestamp,
        }, null, 2),
      }));

      console.log('Alert sent for transaction:', alert.transactionId);
    } catch (error) {
      console.error('Error sending alert:', error);
      throw error; // Let SQS handle retry/DLQ
    }
  }

  return { statusCode: 200, body: JSON.stringify({ alerts: records.length }) };
};
          `),
        }),
        environment: {
          variables: {
            TOPIC_ARN: fraudAlertsTopic.arn,
          },
        },
        kmsKeyArn: kmsKey.arn,
        vpcConfig: {
          subnetIds: privateSubnets.map(s => s.id),
          securityGroupIds: [lambdaSg.id],
        },
        reservedConcurrentExecutions: 20,
        timeout: 30,
        memorySize: 256,
        tags: { ...tags, Name: `alert-dispatcher-${environmentSuffix}` },
      },
      { parent: this, dependsOn: [alertLogGroup] }
    );

    // Event source mapping for alert dispatcher (SQS trigger)
    new aws.lambda.EventSourceMapping(
      `alert-dispatcher-sqs-trigger-${environmentSuffix}`,
      {
        eventSourceArn: alertQueue.arn,
        functionName: alertLambda.name,
        batchSize: 10,
        maximumBatchingWindowInSeconds: 5,
      },
      { parent: this }
    );

    // ===========================================
    // EventBridge Rule for Batch Processing
    // ===========================================

    const batchProcessingRule = new aws.cloudwatch.EventRule(
      `fraud-batch-rule-${environmentSuffix}`,
      {
        name: `fraud-batch-rule-${environmentSuffix}`,
        description:
          'Trigger fraud detector every 5 minutes for batch processing',
        scheduleExpression: 'rate(5 minutes)',
        tags: { ...tags, Name: `fraud-batch-rule-${environmentSuffix}` },
      },
      { parent: this }
    );

    new aws.lambda.Permission(
      `fraud-batch-permission-${environmentSuffix}`,
      {
        action: 'lambda:InvokeFunction',
        function: detectorLambda.name,
        principal: 'events.amazonaws.com',
        sourceArn: batchProcessingRule.arn,
      },
      { parent: this }
    );

    new aws.cloudwatch.EventTarget(
      `fraud-batch-target-${environmentSuffix}`,
      {
        rule: batchProcessingRule.name,
        arn: detectorLambda.arn,
      },
      { parent: this }
    );

    // ===========================================
    // API Gateway REST API
    // ===========================================

    const api = new aws.apigateway.RestApi(
      `fraud-api-${environmentSuffix}`,
      {
        name: `fraud-api-${environmentSuffix}`,
        description: 'Fraud Detection API',
        tags: { ...tags, Name: `fraud-api-${environmentSuffix}` },
      },
      { parent: this }
    );

    const transactionsResource = new aws.apigateway.Resource(
      `transactions-resource-${environmentSuffix}`,
      {
        restApi: api.id,
        parentId: api.rootResourceId,
        pathPart: 'transactions',
      },
      { parent: this }
    );

    // Request validator for API Gateway
    const requestValidator = new aws.apigateway.RequestValidator(
      `request-validator-${environmentSuffix}`,
      {
        restApi: api.id,
        name: `request-validator-${environmentSuffix}`,
        validateRequestBody: true,
      },
      { parent: this }
    );

    const postMethod = new aws.apigateway.Method(
      `post-method-${environmentSuffix}`,
      {
        restApi: api.id,
        resourceId: transactionsResource.id,
        httpMethod: 'POST',
        authorization: 'NONE',
        requestValidatorId: requestValidator.id,
      },
      { parent: this }
    );

    const postIntegration = new aws.apigateway.Integration(
      `post-integration-${environmentSuffix}`,
      {
        restApi: api.id,
        resourceId: transactionsResource.id,
        httpMethod: postMethod.httpMethod,
        integrationHttpMethod: 'POST',
        type: 'AWS_PROXY',
        uri: ingestionLambda.invokeArn,
      },
      { parent: this }
    );

    new aws.lambda.Permission(
      `api-lambda-permission-${environmentSuffix}`,
      {
        action: 'lambda:InvokeFunction',
        function: ingestionLambda.name,
        principal: 'apigateway.amazonaws.com',
        sourceArn: pulumi.interpolate`${api.executionArn}/*/*`,
      },
      { parent: this }
    );

    const deployment = new aws.apigateway.Deployment(
      `api-deployment-${environmentSuffix}`,
      {
        restApi: api.id,
        triggers: {
          redeployment: pulumi
            .all([transactionsResource.id, postMethod.id])
            .apply(([resourceId, methodId]) =>
              JSON.stringify({ resourceId, methodId })
            ),
        },
      },
      { parent: this, dependsOn: [postMethod, postIntegration] }
    );

    const stage = new aws.apigateway.Stage(
      `api-stage-${environmentSuffix}`,
      {
        deployment: deployment.id,
        restApi: api.id,
        stageName: environmentSuffix,
        tags: { ...tags, Name: `api-stage-${environmentSuffix}` },
      },
      { parent: this }
    );

    // Stage throttling settings (1000 req/s)
    new aws.apigateway.MethodSettings(
      `method-settings-${environmentSuffix}`,
      {
        restApi: api.id,
        stageName: stage.stageName,
        methodPath: '*/*',
        settings: {
          throttlingBurstLimit: 1000,
          throttlingRateLimit: 1000,
        },
      },
      { parent: this }
    );

    // ===========================================
    // Outputs
    // ===========================================

    this.apiEndpoint = pulumi.interpolate`https://${api.id}.execute-api.${region}.amazonaws.com/${stage.stageName}/transactions`;
    this.tableArn = fraudTable.arn;
    this.tableName = fraudTable.name;
    this.ingestionFunctionName = ingestionLambda.name;
    this.detectorFunctionName = detectorLambda.name;
    this.alertFunctionName = alertLambda.name;
    this.queueUrl = fraudAnalysisQueue.url;
    this.topicArn = fraudAlertsTopic.arn;

    this.registerOutputs({
      apiEndpoint: this.apiEndpoint,
      tableArn: this.tableArn,
      tableName: this.tableName,
      ingestionFunctionName: this.ingestionFunctionName,
      detectorFunctionName: this.detectorFunctionName,
      alertFunctionName: this.alertFunctionName,
      queueUrl: fraudAnalysisQueue.url,
      topicArn: fraudAlertsTopic.arn,
      vpcId: vpc.id,
      privateSubnetIds: pulumi.all(privateSubnets.map(s => s.id)),
    });
  }
}
