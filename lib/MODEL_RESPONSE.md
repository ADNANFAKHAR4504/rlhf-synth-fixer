```typescript
import * as cdk from 'aws-cdk-lib';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as cloudwatchActions from 'aws-cdk-lib/aws-cloudwatch-actions';
import { Construct } from 'constructs';

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
    const productInventoryTable = new dynamodb.Table(
      this,
      'ProductInventoryTable',
      {
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
      }
    );

    // 3. Add Local Secondary Index during table creation
    productInventoryTable.addLocalSecondaryIndex({
      indexName: 'StatusIndex',
      sortKey: {
        name: 'stockStatus',
        type: dynamodb.AttributeType.STRING,
      },
      projectionType: dynamodb.ProjectionType.ALL,
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

    // 5. Create CloudWatch Alarms for monitoring table metrics

    // Alarm for Consumed Read Capacity Units
    const readCapacityAlarm = new cloudwatch.Alarm(this, 'ReadCapacityAlarm', {
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
      alarmName: `${productInventoryTable.tableName}-ReadCapacityAlarm`,
      alarmDescription:
        'Alert when consumed read capacity exceeds 10,000 units in 5 minutes',
    });

    // Alarm for Consumed Write Capacity Units
    const writeCapacityAlarm = new cloudwatch.Alarm(
      this,
      'WriteCapacityAlarm',
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
        alarmName: `${productInventoryTable.tableName}-WriteCapacityAlarm`,
        alarmDescription:
          'Alert when consumed write capacity exceeds 10,000 units in 5 minutes',
      }
    );

    // Add SNS action to both alarms
    const snsAction = new cloudwatchActions.SnsAction(inventoryAlertsTopic);
    readCapacityAlarm.addAlarmAction(snsAction);
    writeCapacityAlarm.addAlarmAction(snsAction);

    // 6. Create Stack Outputs
    new cdk.CfnOutput(this, 'TableArn', {
      value: productInventoryTable.tableArn,
      description: 'ARN of the ProductInventory DynamoDB table',
      exportName: 'ProductInventoryTableArn',
    });

    new cdk.CfnOutput(this, 'TableStreamArn', {
      value: productInventoryTable.tableStreamArn!,
      description: 'Stream ARN of the ProductInventory DynamoDB table',
      exportName: 'ProductInventoryTableStreamArn',
    });
  }
}

// Example app instantiation (optional - include if you want a complete deployable file)
const app = new cdk.App();
new InventoryManagementStack(app, 'InventoryManagementStack', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: 'us-west-2',
  },
  description:
    'Production-ready DynamoDB table for inventory management system',
});
```
