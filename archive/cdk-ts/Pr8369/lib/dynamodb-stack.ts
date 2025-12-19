import * as cdk from 'aws-cdk-lib';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import { Construct } from 'constructs';

interface DynamoDbStackProps extends cdk.StackProps {
  environmentSuffix: string;
}

export class DynamoDbStack extends cdk.Stack {
  public readonly userDataTable: dynamodb.Table;
  public readonly orderDataTable: dynamodb.Table;
  public readonly analyticsTable: dynamodb.Table;

  constructor(scope: Construct, id: string, props: DynamoDbStackProps) {
    super(scope, id, props);

    // User Data Table with DynamoDB Streams
    this.userDataTable = new dynamodb.Table(this, 'UserDataTable', {
      tableName: `${props.environmentSuffix}-userdata-synth`,
      partitionKey: { name: 'userId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'timestamp', type: dynamodb.AttributeType.NUMBER },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      stream: dynamodb.StreamViewType.NEW_AND_OLD_IMAGES,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      pointInTimeRecovery: true,
    });

    // Order Data Table with DynamoDB Streams
    this.orderDataTable = new dynamodb.Table(this, 'OrderDataTable', {
      tableName: `${props.environmentSuffix}-orderdata-synth`,
      partitionKey: { name: 'orderId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'createdAt', type: dynamodb.AttributeType.NUMBER },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      stream: dynamodb.StreamViewType.NEW_AND_OLD_IMAGES,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      pointInTimeRecovery: true,
    });

    // Analytics Table for processed data
    this.analyticsTable = new dynamodb.Table(this, 'AnalyticsTable', {
      tableName: `${props.environmentSuffix}-analytics-synth`,
      partitionKey: { name: 'dataType', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'processedAt', type: dynamodb.AttributeType.NUMBER },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Output table ARNs and stream ARNs for other stacks
    new cdk.CfnOutput(this, 'UserDataTableArn', {
      value: this.userDataTable.tableArn,
      exportName: `${props.environmentSuffix}-UserDataTableArn`,
    });

    new cdk.CfnOutput(this, 'UserDataStreamArn', {
      value: this.userDataTable.tableStreamArn!,
      exportName: `${props.environmentSuffix}-UserDataStreamArn`,
    });

    new cdk.CfnOutput(this, 'OrderDataTableArn', {
      value: this.orderDataTable.tableArn,
      exportName: `${props.environmentSuffix}-OrderDataTableArn`,
    });

    new cdk.CfnOutput(this, 'OrderDataStreamArn', {
      value: this.orderDataTable.tableStreamArn!,
      exportName: `${props.environmentSuffix}-OrderDataStreamArn`,
    });
  }
}
