import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { BaseStack, BaseStackProps } from './base-stack';

export class DynamoDbStack extends BaseStack {
  public readonly ordersTable: dynamodb.Table;

  constructor(scope: Construct, id: string, props: BaseStackProps) {
    super(scope, id, props);

    // Create DynamoDB table with environment-specific configuration
    this.ordersTable = new dynamodb.Table(this, 'OrdersTable', {
      tableName: this.getResourceName('orders'),
      partitionKey: {
        name: 'orderId',
        type: dynamodb.AttributeType.STRING,
      },
      sortKey: {
        name: 'timestamp',
        type: dynamodb.AttributeType.STRING,
      },
      billingMode: dynamodb.BillingMode.PROVISIONED,
      readCapacity: this.environmentConfig.dynamoConfig.readCapacity,
      writeCapacity: this.environmentConfig.dynamoConfig.writeCapacity,
      pointInTimeRecovery:
        this.environmentConfig.dynamoConfig.pointInTimeRecovery,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      encryption: dynamodb.TableEncryption.AWS_MANAGED,
    });

    // Add GSI for customer queries
    this.ordersTable.addGlobalSecondaryIndex({
      indexName: 'CustomerIndex',
      partitionKey: {
        name: 'customerId',
        type: dynamodb.AttributeType.STRING,
      },
      sortKey: {
        name: 'timestamp',
        type: dynamodb.AttributeType.STRING,
      },
      readCapacity: this.environmentConfig.dynamoConfig.readCapacity,
      writeCapacity: this.environmentConfig.dynamoConfig.writeCapacity,
      projectionType: dynamodb.ProjectionType.ALL,
    });

    // Enable auto-scaling for production
    if (this.environmentConfig.name === 'prod') {
      const readScaling = this.ordersTable.autoScaleReadCapacity({
        minCapacity: this.environmentConfig.dynamoConfig.readCapacity,
        maxCapacity: this.environmentConfig.dynamoConfig.readCapacity * 4,
      });

      readScaling.scaleOnUtilization({
        targetUtilizationPercent: 70,
      });

      const writeScaling = this.ordersTable.autoScaleWriteCapacity({
        minCapacity: this.environmentConfig.dynamoConfig.writeCapacity,
        maxCapacity: this.environmentConfig.dynamoConfig.writeCapacity * 4,
      });

      writeScaling.scaleOnUtilization({
        targetUtilizationPercent: 70,
      });
    }

    // Export table name and ARN
    this.exportToParameterStore(
      'orders-table-name',
      this.ordersTable.tableName
    );
    this.exportToParameterStore('orders-table-arn', this.ordersTable.tableArn);
  }
}
