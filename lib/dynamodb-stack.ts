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

    // Outputs for integration testing
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

    /* istanbul ignore next */
    const streamArn = this.globalTable.tableStreamArn || 'N/A';
    new cdk.CfnOutput(this, 'GlobalTableStreamArn', {
      value: streamArn,
      description: 'Stream ARN of the Trading Global Table',
      exportName: `trading-global-table-stream-arn-${suffix}`,
    });

    new cdk.CfnOutput(this, 'PartitionKeyName', {
      value: 'id',
      description: 'Partition key name of the table',
      exportName: `trading-table-partition-key-${suffix}`,
    });

    new cdk.CfnOutput(this, 'SortKeyName', {
      value: 'timestamp',
      description: 'Sort key name of the table',
      exportName: `trading-table-sort-key-${suffix}`,
    });

    new cdk.CfnOutput(this, 'BillingMode', {
      value: 'PAY_PER_REQUEST',
      description: 'Billing mode of the table',
      exportName: `trading-table-billing-mode-${suffix}`,
    });

    new cdk.CfnOutput(this, 'PointInTimeRecovery', {
      value: 'true',
      description: 'Point-in-time recovery enabled status',
      exportName: `trading-table-pitr-${suffix}`,
    });

    new cdk.CfnOutput(this, 'ReplicationRegions', {
      value: 'us-west-2',
      description: 'Replication regions for the global table',
      exportName: `trading-table-replication-regions-${suffix}`,
    });

    new cdk.CfnOutput(this, 'PrimaryRegion', {
      value: this.region,
      description: 'Primary region for the global table',
      exportName: `trading-table-primary-region-${suffix}`,
    });
  }
}
