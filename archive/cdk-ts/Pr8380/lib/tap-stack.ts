import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';

// ? Import your stacks here
import { ServerlessStack } from './serverless-stack';

interface TapStackProps extends cdk.StackProps {
  environmentSuffix?: string;
}

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id, props);

    // Get environment suffix from props, context, or use 'dev' as default

    const environmentSuffix =
      props?.environmentSuffix ||
      this.node.tryGetContext('environmentSuffix') ||
      'dev';

    // ? Add your stack instantiations here
    // ! Do NOT create resources directly in this stack.
    // ! Instead, create separate stacks for each resource type.

    // Create the serverless data processing stack
    const serverlessStack = new ServerlessStack(
      this,
      'ServerlessDataProcessing',
      {
        environmentSuffix: environmentSuffix,
        env: {
          account: cdk.Stack.of(this).account,
          region: cdk.Stack.of(this).region,
        },
      }
    );

    // Expose nested stack outputs at root level
    new cdk.CfnOutput(this, 'DynamoDBTableName', {
      value: serverlessStack.ordersTableName,
      description: 'DynamoDB Table Name for orders',
    });

    new cdk.CfnOutput(this, 'LambdaFunctionName', {
      value: serverlessStack.lambdaFunctionName,
      description: 'Lambda function name for order processing',
    });

    new cdk.CfnOutput(this, 'S3BucketName', {
      value: serverlessStack.s3BucketName,
      description: 'S3 bucket name for processed data',
    });

    new cdk.CfnOutput(this, 'DLQUrl', {
      value: serverlessStack.dlqUrl,
      description: 'Dead Letter Queue URL',
    });

    new cdk.CfnOutput(this, 'CloudWatchAlarmName', {
      value: serverlessStack.lambdaErrorAlarmName,
      description: 'CloudWatch Alarm name for Lambda errors',
    });

    new cdk.CfnOutput(this, 'LambdaDurationAlarmName', {
      value: serverlessStack.lambdaDurationAlarmName,
      description: 'CloudWatch Alarm name for Lambda duration',
    });

    new cdk.CfnOutput(this, 'LambdaMemoryAlarmName', {
      value: serverlessStack.lambdaMemoryAlarmName,
      description: 'CloudWatch Alarm name for Lambda memory usage',
    });

    new cdk.CfnOutput(this, 'DLQMessageAlarmName', {
      value: serverlessStack.dlqMessageAlarmName,
      description: 'CloudWatch Alarm name for DLQ messages',
    });

    new cdk.CfnOutput(this, 'SQSMessageAgeAlarmName', {
      value: serverlessStack.sqsMessageAgeAlarmName,
      description: 'CloudWatch Alarm name for SQS message age',
    });

    new cdk.CfnOutput(this, 'StreamIteratorAlarmName', {
      value: serverlessStack.streamIteratorAlarmName,
      description: 'CloudWatch Alarm name for DynamoDB stream iterator age',
    });

    new cdk.CfnOutput(this, 'LambdaThrottleAlarmName', {
      value: serverlessStack.lambdaThrottleAlarmName,
      description: 'CloudWatch Alarm name for Lambda throttles',
    });

    new cdk.CfnOutput(this, 'S3ErrorAlarmName', {
      value: serverlessStack.s3ErrorAlarmName,
      description: 'CloudWatch Alarm name for S3 errors',
    });

    new cdk.CfnOutput(this, 'DynamoReadAlarmName', {
      value: serverlessStack.dynamoReadAlarmName,
      description: 'CloudWatch Alarm name for DynamoDB read throttles',
    });

    new cdk.CfnOutput(this, 'DynamoWriteAlarmName', {
      value: serverlessStack.dynamoWriteAlarmName,
      description: 'CloudWatch Alarm name for DynamoDB write throttles',
    });

    new cdk.CfnOutput(this, 'AuditTableName', {
      value: serverlessStack.auditTableName,
      description: 'DynamoDB table name for audit logs',
    });

    new cdk.CfnOutput(this, 'AuditLambdaName', {
      value: serverlessStack.auditLambdaName,
      description: 'Lambda function name for audit processing',
    });
  }
}
