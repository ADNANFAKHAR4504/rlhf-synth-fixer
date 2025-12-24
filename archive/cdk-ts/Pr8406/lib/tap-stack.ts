#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';

// Import your stacks here
import { DynamoDBStack } from './stacks/dynamodb-stack';
import { LambdaStack } from './stacks/lambda-stack';
import { MonitoringStack } from './stacks/monitoring-stack';
import { S3Stack } from './stacks/s3-stack';
import { SQSStack } from './stacks/sqs-stack';

interface TapStackProps extends cdk.StackProps {
  environmentSuffix?: string;
}

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id, props);

    // Get environment suffix from props, context, or use 'prod' as default
    const environmentSuffix =
      props?.environmentSuffix ||
      this.node.tryGetContext('environmentSuffix') ||
      'prod';

    // Environment configuration
    const environment = environmentSuffix;
    const region = this.region;

    // Determine if this is the primary region
    const isPrimary = region === 'us-east-1';

    // Create all resource stacks for this region
    const s3Stack = new S3Stack(this, 'S3Stack', {
      environment,
      isPrimary,
      region,
    });

    const dynamoDBStack = new DynamoDBStack(this, 'DynamoDBStack', {
      environment,
      isPrimary,
      region,
    });

    const sqsStack = new SQSStack(this, 'SQSStack', {
      environment,
      isPrimary,
      region,
    });

    const lambdaStack = new LambdaStack(this, 'LambdaStack', {
      environment,
      isPrimary,
      region,
    });

    const monitoringStack = new MonitoringStack(this, 'MonitoringStack', {
      environment,
      isPrimary,
      region,
    });

    // Export all outputs from nested stacks to root stack

    // S3 Stack Outputs
    new cdk.CfnOutput(this, 'DataIngestionBucketName', {
      value: s3Stack.dataIngestionBucket.bucketName,
      description: 'Name of the data ingestion S3 bucket',
    });

    new cdk.CfnOutput(this, 'DataIngestionBucketArn', {
      value: s3Stack.dataIngestionBucket.bucketArn,
      description: 'ARN of the data ingestion S3 bucket',
    });

    // DynamoDB Stack Outputs
    new cdk.CfnOutput(this, 'ProcessedDataTableName', {
      value: dynamoDBStack.tableName,
      description: 'Name of the processed data DynamoDB table',
    });

    new cdk.CfnOutput(this, 'ProcessedDataTableArn', {
      value: dynamoDBStack.processedDataTable.tableArn,
      description: 'ARN of the processed data DynamoDB table',
    });

    new cdk.CfnOutput(this, 'ProcessedDataTableStreamArn', {
      value: dynamoDBStack.processedDataTable.tableStreamArn || 'N/A',
      description: 'Stream ARN of the processed data DynamoDB table',
    });

    // SQS Stack Outputs
    new cdk.CfnOutput(this, 'DeadLetterQueueName', {
      value: sqsStack.deadLetterQueue.queueName,
      description: 'Name of the dead letter queue',
    });

    new cdk.CfnOutput(this, 'DeadLetterQueueArn', {
      value: sqsStack.deadLetterQueue.queueArn,
      description: 'ARN of the dead letter queue',
    });

    new cdk.CfnOutput(this, 'DeadLetterQueueUrl', {
      value: sqsStack.deadLetterQueue.queueUrl,
      description: 'URL of the dead letter queue',
    });

    // Lambda Stack Outputs
    new cdk.CfnOutput(this, 'DataProcessorFunctionName', {
      value: lambdaStack.dataProcessorFunction.functionName,
      description: 'Name of the data processor Lambda function',
    });

    new cdk.CfnOutput(this, 'DataProcessorFunctionArn', {
      value: lambdaStack.dataProcessorFunction.functionArn,
      description: 'ARN of the data processor Lambda function',
    });

    new cdk.CfnOutput(this, 'DataProcessorFunctionRoleArn', {
      value: lambdaStack.dataProcessorFunction.role?.roleArn || 'N/A',
      description: 'ARN of the data processor Lambda function execution role',
    });

    // Monitoring Stack Outputs
    new cdk.CfnOutput(this, 'AlarmTopicArn', {
      value: monitoringStack.alarmTopic.topicArn,
      description: 'ARN of the SNS topic for alarms',
    });

    new cdk.CfnOutput(this, 'DashboardName', {
      value: monitoringStack.dashboard.dashboardName,
      description: 'Name of the CloudWatch dashboard',
    });

    // Environment Information
    new cdk.CfnOutput(this, 'Environment', {
      value: environment,
      description: 'Environment name',
    });

    new cdk.CfnOutput(this, 'Region', {
      value: region,
      description: 'AWS region',
    });

    new cdk.CfnOutput(this, 'IsPrimaryRegion', {
      value: isPrimary.toString(),
      description: 'Whether this is the primary region',
    });
  }
}
