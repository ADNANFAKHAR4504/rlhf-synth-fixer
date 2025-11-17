import { Construct } from 'constructs';
import { LambdaFunction } from '@cdktf/provider-aws/lib/lambda-function';
import { CloudwatchLogGroup } from '@cdktf/provider-aws/lib/cloudwatch-log-group';
import { AssetType, TerraformAsset } from 'cdktf';
import * as path from 'path';

export interface LambdaStackProps {
  environmentSuffix: string;
  transactionProcessorRoleArn: string;
  statusCheckerRoleArn: string;
  dynamodbTableName: string;
  sqsQueueUrl: string;
  snsTopicArn: string;
  securityGroupIds: string[];
  subnetIds: string[];
}

export class LambdaStack extends Construct {
  public readonly transactionProcessor: LambdaFunction;
  public readonly statusChecker: LambdaFunction;

  constructor(scope: Construct, id: string, props: LambdaStackProps) {
    super(scope, id);

    const {
      environmentSuffix,
      transactionProcessorRoleArn,
      statusCheckerRoleArn,
      dynamodbTableName,
      sqsQueueUrl,
      snsTopicArn,
      securityGroupIds,
      subnetIds,
    } = props;

    // CloudWatch Log Group for transaction processor
    const transactionProcessorLogGroup = new CloudwatchLogGroup(
      this,
      'transaction_processor_log_group',
      {
        name: `/aws/lambda/transaction-processor-${environmentSuffix}`,
        retentionInDays: 30,
        tags: {
          Name: `transaction-processor-logs-${environmentSuffix}`,
        },
      }
    );

    // Create asset for transaction processor Lambda code
    const transactionProcessorAsset = new TerraformAsset(
      this,
      'transaction_processor_asset',
      {
        path: path.resolve(__dirname, 'lambda/transaction-processor'),
        type: AssetType.ARCHIVE,
      }
    );

    // Transaction processor Lambda function
    this.transactionProcessor = new LambdaFunction(
      this,
      'transaction_processor',
      {
        functionName: `transaction-processor-${environmentSuffix}`,
        role: transactionProcessorRoleArn,
        handler: 'index.handler',
        runtime: 'nodejs18.x',
        memorySize: 512,
        timeout: 30,
        reservedConcurrentExecutions: 10,
        filename: transactionProcessorAsset.path,
        sourceCodeHash: transactionProcessorAsset.assetHash,
        environment: {
          variables: {
            DYNAMODB_TABLE: dynamodbTableName,
            SQS_QUEUE_URL: sqsQueueUrl,
            SNS_TOPIC_ARN: snsTopicArn,
            ENVIRONMENT: environmentSuffix,
          },
        },
        vpcConfig: {
          subnetIds: subnetIds,
          securityGroupIds: securityGroupIds,
        },
        tracingConfig: {
          mode: 'Active',
        },
        dependsOn: [transactionProcessorLogGroup],
        tags: {
          Name: `transaction-processor-${environmentSuffix}`,
        },
      }
    );

    // CloudWatch Log Group for status checker
    const statusCheckerLogGroup = new CloudwatchLogGroup(
      this,
      'status_checker_log_group',
      {
        name: `/aws/lambda/status-checker-${environmentSuffix}`,
        retentionInDays: 30,
        tags: {
          Name: `status-checker-logs-${environmentSuffix}`,
        },
      }
    );

    // Create asset for status checker Lambda code
    const statusCheckerAsset = new TerraformAsset(
      this,
      'status_checker_asset',
      {
        path: path.resolve(__dirname, 'lambda/status-checker'),
        type: AssetType.ARCHIVE,
      }
    );

    // Status checker Lambda function
    this.statusChecker = new LambdaFunction(this, 'status_checker', {
      functionName: `status-checker-${environmentSuffix}`,
      role: statusCheckerRoleArn,
      handler: 'index.handler',
      runtime: 'nodejs18.x',
      memorySize: 512,
      timeout: 30,
      reservedConcurrentExecutions: 5,
      filename: statusCheckerAsset.path,
      sourceCodeHash: statusCheckerAsset.assetHash,
      environment: {
        variables: {
          DYNAMODB_TABLE: dynamodbTableName,
          ENVIRONMENT: environmentSuffix,
        },
      },
      vpcConfig: {
        subnetIds: subnetIds,
        securityGroupIds: securityGroupIds,
      },
      tracingConfig: {
        mode: 'Active',
      },
      dependsOn: [statusCheckerLogGroup],
      tags: {
        Name: `status-checker-${environmentSuffix}`,
      },
    });
  }
}
