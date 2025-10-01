import { CfnOutput, Stack, StackProps, Tags } from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as s3n from 'aws-cdk-lib/aws-s3-notifications';
import * as subscriptions from 'aws-cdk-lib/aws-sns-subscriptions';
import { Construct } from 'constructs';
import { LambdaConstruct } from './stacks/lambda-stack';
import { StorageConstruct } from './stacks/storage-stack';

export interface AppStackProps extends StackProps {
  /**
   * Environment name (dev, staging, prod)
   */
  environment: string;

  /**
   * Email address for alarm notifications
   */
  alarmEmail?: string;
}

export class AppStack extends Stack {
  constructor(scope: Construct, id: string, props: AppStackProps) {
    super(scope, id, props);

    const prefix = 'serverless-app';
    const { environment, alarmEmail } = props;

    // Add tags to all resources
    Tags.of(this).add('Project', prefix);
    Tags.of(this).add('Environment', environment);
    Tags.of(this).add('ManagedBy', 'CDK');
    Tags.of(this).add('iac-rlhf-amazon', 'true');

    // Create storage resources
    const storage = new StorageConstruct(this, 'Storage', {
      prefix,
      environment,
    });

    // Create Lambda resources
    const lambdaConstruct = new LambdaConstruct(this, 'Lambda', {
      prefix,
      environment,
      dataBucket: storage.dataBucket,
      metadataTable: storage.metadataTable,
      encryptionKey: storage.encryptionKey,
    });

    // Add S3 event notification to trigger Lambda
    storage.dataBucket.addEventNotification(
      s3.EventType.OBJECT_CREATED,
      new s3n.LambdaDestination(lambdaConstruct.dataProcessor),
      {
        prefix: 'incoming/',
        suffix: '.json',
      }
    );

    // Subscribe email to alarm topic if provided
    if (alarmEmail) {
      lambdaConstruct.alarmTopic.addSubscription(
        new subscriptions.EmailSubscription(alarmEmail)
      );
    }

    // Outputs
    new CfnOutput(this, 'BucketName', {
      value: storage.dataBucket.bucketName,
      description: 'Name of the S3 bucket for data storage',
    });

    new CfnOutput(this, 'TableName', {
      value: storage.metadataTable.tableName,
      description: 'Name of the DynamoDB table for metadata',
    });

    new CfnOutput(this, 'LambdaFunctionName', {
      value: lambdaConstruct.dataProcessor.functionName,
      description: 'Name of the data processor Lambda function',
    });

    new CfnOutput(this, 'AlarmTopicArn', {
      value: lambdaConstruct.alarmTopic.topicArn,
      description: 'ARN of the SNS topic for alarms',
    });
  }
}
