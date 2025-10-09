```typescript
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as cloudwatchActions from 'aws-cdk-lib/aws-cloudwatch-actions';

export class InventoryManagementStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, {
      ...props,
      env: {
        region: 'us-west-2',
        ...props?.env,
      },
    });

    // 1. Create SNS Topic for inventory alerts
    const inventoryAlertsTopic = new sns.Topic(this, 'InventoryAlertsTopic', {
      topicName: 'inventory-alerts',
      displayName: 'Inventory Alerts Topic',
    });

    // Apply removal policy to SNS topic
    inventoryAlertsTopic.applyRemovalPolicy(cdk.RemovalPolicy.DESTROY);

    // 2. Create DynamoDB Table with specified configuration
    const productInventoryTable = new dynamodb.Table(this, 'ProductInventory', {
      tableName: 'ProductInventory',
      partitionKey: {
        name: 'productId',
        type: dynamodb.AttributeType.STRING,
      },
      sortKey: {
        name: 'warehouseId',
        type: dynamodb.AttributeType.STRING,
      },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      pointInTimeRecovery: true,
      stream: dynamodb.StreamViewType.NEW_AND_OLD_IMAGES,
      contributorInsightsEnabled: true,
      timeToLiveAttribute: 'expirationTime',
      encryption: dynamodb.TableEncryption.AWS_MANAGED,
      deletionProtection: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // 3. Add Local Secondary Index during table creation
    // Note: LSIs must be added during table creation in CDK v2
    // We need to use the lower-level CFN resource to add LSI
    const cfnTable = productInventoryTable.node
      .defaultChild as dynamodb.CfnTable;

    // Add LSI to the CloudFormation template
    cfnTable.localSecondaryIndexes = [
      {
        indexName: 'StatusIndex',
        keySchema: [
          {
            attributeName: 'productId',
            keyType: 'HASH',
          },
          {
            attributeName: 'stockStatus',
            keyType: 'RANGE',
          },
        ],
        projection: {
          projectionType: 'ALL',
        },
      },
    ];

    // Add the stockStatus attribute definition
    cfnTable.attributeDefinitions?.push({
      attributeName: 'stockStatus',
      attributeType: 'S',
    });

    // 4. Add Global Secondary Index after table creation
    productInventoryTable.addGlobalSecondaryIndex({
      indexName: 'WarehouseIndex',
      partitionKey: {
        name: 'warehouseId',
        type: dynamodb.AttributeType.STRING,
      },
      sortKey: {
        name: 'lastUpdated',
        type: dynamodb.AttributeType.STRING,
      },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    // 5. Create CloudWatch Alarms for table metrics

    // Alarm for Consumed Read Capacity Units
    const readCapacityAlarm = new cloudwatch.Alarm(
      this,
      'ConsumedReadCapacityAlarm',
      {
        metric: new cloudwatch.Metric({
          namespace: 'AWS/DynamoDB',
          metricName: 'ConsumedReadCapacityUnits',
          dimensionsMap: {
            TableName: productInventoryTable.tableName,
          },
          statistic: 'Sum',
          period: cdk.Duration.minutes(5),
        }),
        threshold: 10000,
        evaluationPeriods: 1,
        treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
        alarmDescription:
          'Alert when consumed read capacity exceeds 10,000 units in 5 minutes',
        alarmName: `${productInventoryTable.tableName}-HighReadCapacity`,
      }
    );

    // Alarm for Consumed Write Capacity Units
    const writeCapacityAlarm = new cloudwatch.Alarm(
      this,
      'ConsumedWriteCapacityAlarm',
      {
        metric: new cloudwatch.Metric({
          namespace: 'AWS/DynamoDB',
          metricName: 'ConsumedWriteCapacityUnits',
          dimensionsMap: {
            TableName: productInventoryTable.tableName,
          },
          statistic: 'Sum',
          period: cdk.Duration.minutes(5),
        }),
        threshold: 10000,
        evaluationPeriods: 1,
        treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
        alarmDescription:
          'Alert when consumed write capacity exceeds 10,000 units in 5 minutes',
        alarmName: `${productInventoryTable.tableName}-HighWriteCapacity`,
      }
    );

    // Add SNS actions to both alarms
    readCapacityAlarm.addAlarmAction(
      new cloudwatchActions.SnsAction(inventoryAlertsTopic)
    );

    writeCapacityAlarm.addAlarmAction(
      new cloudwatchActions.SnsAction(inventoryAlertsTopic)
    );

    // Apply removal policy to alarms
    readCapacityAlarm.applyRemovalPolicy(cdk.RemovalPolicy.DESTROY);
    writeCapacityAlarm.applyRemovalPolicy(cdk.RemovalPolicy.DESTROY);

    // 6. Create Stack Outputs
    new cdk.CfnOutput(this, 'TableArn', {
      value: productInventoryTable.tableArn,
      description: 'ARN of the ProductInventory DynamoDB table',
      exportName: `${this.stackName}-TableArn`,
    });

    new cdk.CfnOutput(this, 'TableStreamArn', {
      value: productInventoryTable.tableStreamArn!,
      description: 'ARN of the ProductInventory DynamoDB table stream',
      exportName: `${this.stackName}-TableStreamArn`,
    });
  }
}

// Example app instantiation (optional, for testing)
const app = new cdk.App();
new InventoryManagementStack(app, 'InventoryManagementStack', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: 'us-west-2',
  },
  description:
    'Production-ready DynamoDB table stack for inventory management system',
});
```
