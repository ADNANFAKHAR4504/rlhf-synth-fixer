```typescript
import _ as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import _ as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import _ as sns from 'aws-cdk-lib/aws-sns';
import _ as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as cloudwatchActions from 'aws-cdk-lib/aws-cloudwatch-actions';

export class DynamoInventoryStack extends cdk.Stack {
constructor(scope: Construct, id: string, props?: cdk.StackProps) {
super(scope, id, {
...props,
env: {
// Configure the stack for the us-west-2 region as required
region: 'us-west-2',
},
});

    // 1. Create SNS Topic for inventory alerts
    const inventoryAlertsTopic = new sns.Topic(this, 'InventoryAlertsTopic', {
      topicName: 'inventory-alerts',
      displayName: 'Inventory Alerts Topic',
    });
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
        stream: dynamodb.StreamViewType.NEW_AND_OLD_IMAGES,
        contributorInsightsEnabled: true,
        timeToLiveAttribute: 'expirationTime',
        encryption: dynamodb.TableEncryption.AWS_MANAGED,
        deletionProtection: true,
        removalPolicy: cdk.RemovalPolicy.DESTROY,

        // 3. Define the Local Secondary Index during table creation
        localSecondaryIndexes: [
          {
            indexName: 'StatusIndex',
            sortKey: {
              name: 'stockStatus',
              type: dynamodb.AttributeType.STRING,
            },
            projectionType: dynamodb.ProjectionType.ALL,
          },
        ],
      }
    );

    // Use an escape hatch to set the non-deprecated PointInTimeRecoverySpecification
    const cfnTable = productInventoryTable.node.defaultChild as dynamodb.CfnTable;
    cfnTable.pointInTimeRecoverySpecification = {
      pointInTimeRecoveryEnabled: true,
    };

    // 4. Add the Global Secondary Index after table creation
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
    const readCapacityAlarm = new cloudwatch.Alarm(
      this,
      'HighReadCapacityAlarm',
      {
        alarmName: `${productInventoryTable.tableName}-HighReadCapacity`,
        alarmDescription: 'Alert when consumed read capacity exceeds 10,000 units in 5 minutes',
        metric: productInventoryTable.metricConsumedReadCapacityUnits({
          statistic: 'Sum',
          period: cdk.Duration.minutes(5),
        }),
        threshold: 10000,
        evaluationPeriods: 1,
        treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      }
    );
    readCapacityAlarm.addAlarmAction(new cloudwatchActions.SnsAction(inventoryAlertsTopic));
    readCapacityAlarm.applyRemovalPolicy(cdk.RemovalPolicy.DESTROY);

    const writeCapacityAlarm = new cloudwatch.Alarm(
      this,
      'HighWriteCapacityAlarm',
      {
        alarmName: `${productInventoryTable.tableName}-HighWriteCapacity`,
        alarmDescription: 'Alert when consumed write capacity exceeds 10,000 units in 5 minutes',
        metric: productInventoryTable.metricConsumedWriteCapacityUnits({
          statistic: 'Sum',
          period: cdk.Duration.minutes(5),
        }),
        threshold: 10000,
        evaluationPeriods: 1,
        treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      }
    );
    writeCapacityAlarm.addAlarmAction(new cloudwatchActions.SnsAction(inventoryAlertsTopic));
    writeCapacityAlarm.applyRemovalPolicy(cdk.RemovalPolicy.DESTROY);

    // 6. Create Stack Outputs
    new cdk.CfnOutput(this, 'TableArnOutput', {
      value: productInventoryTable.tableArn,
      description: 'ARN of the ProductInventory DynamoDB table',
      exportName: `${this.stackName}-TableArn`,
    });

    new cdk.CfnOutput(this, 'TableStreamArnOutput', {
      value: productInventoryTable.tableStreamArn!,
      description: 'ARN of the ProductInventory DynamoDB table stream',
      exportName: `${this.stackName}-TableStreamArn`,
    });

}
}
```
