import {
  AwsProvider,
  AwsProviderDefaultTags,
} from '@cdktf/provider-aws/lib/provider';
import { S3Backend, TerraformStack, TerraformOutput } from 'cdktf';
import { Construct } from 'constructs';
import { VpcStack } from './vpc-stack';
import { KmsStack } from './kms-stack';
import { DynamodbStack } from './dynamodb-stack';
import { SqsStack } from './sqs-stack';
import { SnsStack } from './sns-stack';
import { IamStack } from './iam-stack';
import { LambdaStack } from './lambda-stack';
import { ApiGatewayStack } from './api-gateway-stack';
import { CloudwatchStack } from './cloudwatch-stack';

interface TapStackProps {
  environmentSuffix?: string;
  stateBucket?: string;
  stateBucketRegion?: string;
  awsRegion?: string;
  defaultTags?: AwsProviderDefaultTags[];
}

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
    const defaultTags = props?.defaultTags || [];

    // Configure AWS Provider
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

    // Create VPC infrastructure
    const vpcStack = new VpcStack(this, 'VpcStack', {
      environmentSuffix,
    });

    // Create KMS encryption key
    const kmsStack = new KmsStack(this, 'KmsStack', {
      environmentSuffix,
    });

    // Create DynamoDB table
    const dynamodbStack = new DynamodbStack(this, 'DynamodbStack', {
      environmentSuffix,
      kmsKeyArn: kmsStack.encryptionKey.arn,
    });

    // Create SQS queue
    const sqsStack = new SqsStack(this, 'SqsStack', {
      environmentSuffix,
    });

    // Create SNS topic
    const snsStack = new SnsStack(this, 'SnsStack', {
      environmentSuffix,
      emailEndpoint: 'admin@example.com', // Replace with actual email
    });

    // Create IAM roles
    const iamStack = new IamStack(this, 'IamStack', {
      environmentSuffix,
      dynamodbTableArn: dynamodbStack.transactionsTable.arn,
      sqsQueueArn: sqsStack.transactionQueue.arn,
      snsTopicArn: snsStack.notificationTopic.arn,
      kmsKeyArn: kmsStack.encryptionKey.arn,
    });

    // Create Lambda functions
    const lambdaStack = new LambdaStack(this, 'LambdaStack', {
      environmentSuffix,
      transactionProcessorRoleArn: iamStack.transactionProcessorRole.arn,
      statusCheckerRoleArn: iamStack.statusCheckerRole.arn,
      dynamodbTableName: dynamodbStack.transactionsTable.name,
      sqsQueueUrl: sqsStack.transactionQueue.url,
      snsTopicArn: snsStack.notificationTopic.arn,
      securityGroupIds: [vpcStack.lambdaSecurityGroup.id],
      subnetIds: vpcStack.privateSubnets.map(subnet => subnet.id),
    });

    // Create API Gateway
    const apiGatewayStack = new ApiGatewayStack(this, 'ApiGatewayStack', {
      environmentSuffix,
      transactionProcessorArn: lambdaStack.transactionProcessor.arn,
      transactionProcessorInvokeArn: lambdaStack.transactionProcessor.invokeArn,
      statusCheckerArn: lambdaStack.statusChecker.arn,
      statusCheckerInvokeArn: lambdaStack.statusChecker.invokeArn,
    });

    // Create CloudWatch dashboard and alarms
    new CloudwatchStack(this, 'CloudwatchStack', {
      environmentSuffix,
      transactionProcessorName: lambdaStack.transactionProcessor.functionName,
      statusCheckerName: lambdaStack.statusChecker.functionName,
      dynamodbTableName: dynamodbStack.transactionsTable.name,
      snsTopicArn: snsStack.notificationTopic.arn,
    });

    // Outputs
    new TerraformOutput(this, 'api_url', {
      value: apiGatewayStack.apiUrl,
      description: 'API Gateway URL',
    });

    new TerraformOutput(this, 'dynamodb_table_name', {
      value: dynamodbStack.transactionsTable.name,
      description: 'DynamoDB table name',
    });

    new TerraformOutput(this, 'sqs_queue_url', {
      value: sqsStack.transactionQueue.url,
      description: 'SQS queue URL',
    });

    new TerraformOutput(this, 'sqs_dlq_url', {
      value: sqsStack.transactionDlq.url,
      description: 'SQS Dead Letter Queue URL',
    });

    new TerraformOutput(this, 'sns_topic_arn', {
      value: snsStack.notificationTopic.arn,
      description: 'SNS topic ARN',
    });
  }
}
