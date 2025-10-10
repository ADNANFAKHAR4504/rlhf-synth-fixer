import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';

export interface DynamoDBStackProps extends cdk.StackProps {
  environmentSuffix: string;
}

export class DynamoDBStack extends cdk.Stack {
  public readonly globalTable: dynamodb.Table;

  constructor(scope: Construct, id: string, props: DynamoDBStackProps) {
    super(scope, id, props);

    const suffix = props.environmentSuffix;

    // Create a DynamoDB Global Table
    this.globalTable = new dynamodb.Table(this, 'TradingGlobalTable', {
      tableName: `trading-transactions-${suffix}`,
      partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'timestamp', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      pointInTimeRecovery: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      replicationRegions: ['us-west-2'],
    });

    new cdk.CfnOutput(this, 'GlobalTableArn', {
      value: this.globalTable.tableArn,
      description: 'ARN of the Trading Global Table',
      exportName: `trading-global-table-arn-${suffix}`,
    });

    new cdk.CfnOutput(this, 'GlobalTableName', {
      value: this.globalTable.tableName,
      description: 'Name of the Trading Global Table',
      exportName: `trading-global-table-name-${suffix}`,
    });
  }
}
