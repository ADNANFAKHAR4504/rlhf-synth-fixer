import * as cdk from 'aws-cdk-lib';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import { Construct } from 'constructs';

interface DynamoDBStackProps extends cdk.StackProps {
  environmentSuffix: string;
}

export class DynamoDBStack extends cdk.Stack {
  public readonly logsTable: dynamodb.Table;

  constructor(scope: Construct, id: string, props: DynamoDBStackProps) {
    super(scope, id, props);

    // Create DynamoDB table for Lambda invocation logs
    this.logsTable = new dynamodb.Table(this, 'LambdaInvocationLogs', {
      tableName: `lambda-invocation-logs-${props.environmentSuffix}`,
      partitionKey: {
        name: 'requestId',
        type: dynamodb.AttributeType.STRING,
      },
      sortKey: {
        name: 'timestamp',
        type: dynamodb.AttributeType.STRING,
      },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      // Enable point-in-time recovery with configurable periods (latest feature)
      pointInTimeRecoverySpecification: { pointInTimeRecoveryEnabled: true },
      removalPolicy: cdk.RemovalPolicy.DESTROY, // For development only
    });

    // Add global secondary index for querying by timestamp
    this.logsTable.addGlobalSecondaryIndex({
      indexName: 'TimestampIndex',
      partitionKey: {
        name: 'timestamp',
        type: dynamodb.AttributeType.STRING,
      },
    });

    // Add tags
    cdk.Tags.of(this.logsTable).add('Environment', props.environmentSuffix);
    cdk.Tags.of(this.logsTable).add('Purpose', 'LambdaInvocationLogging');

    // Add outputs
    new cdk.CfnOutput(this, 'DynamoDBTableName', {
      value: this.logsTable.tableName,
      description: 'Name of the DynamoDB table for Lambda invocation logs',
      exportName: `DynamoDBTableName-${props.environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'DynamoDBTableArn', {
      value: this.logsTable.tableArn,
      description: 'ARN of the DynamoDB table',
      exportName: `DynamoDBTableArn-${props.environmentSuffix}`,
    });
  }
}
