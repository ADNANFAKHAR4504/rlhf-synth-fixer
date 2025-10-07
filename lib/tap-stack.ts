import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as cloudwatchActions from 'aws-cdk-lib/aws-cloudwatch-actions';

interface TapStackProps extends cdk.StackProps {
  environmentSuffix?: string;
}

export class TapStack extends cdk.Stack {
  public readonly productInventoryTable: dynamodb.Table;
  public readonly inventoryAlertsTopic: sns.Topic;

  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id, {
      ...props,
      env: {
        region: 'us-west-2',
        ...props?.env,
      },
    });

    // Get environment suffix from props, context, or use 'dev' as default
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const environmentSuffix =
      props?.environmentSuffix ||
      this.node.tryGetContext('environmentSuffix') ||
      'dev';

    // 1. Create SNS Topic for inventory alerts
    this.inventoryAlertsTopic = new sns.Topic(this, 'InventoryAlertsTopic', {
      topicName: 'inventory-alerts',
      displayName: 'Inventory Alerts Topic',
    });

    // Apply removal policy to SNS topic
    this.inventoryAlertsTopic.applyRemovalPolicy(cdk.RemovalPolicy.DESTROY);

    // 2. Create DynamoDB Table with specified configuration
    this.productInventoryTable = new dynamodb.Table(
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
        removalPolicy: cdk.RemovalPolicy.DESTROY,
      }
    );

    // Get the underlying CloudFormation table resource to modify
    const cfnTable = this.productInventoryTable.node
      .defaultChild as dynamodb.CfnTable;

    // ADDED non-deprecated property for Point-in-Time Recovery
    cfnTable.pointInTimeRecoverySpecification = {
      pointInTimeRecoveryEnabled: true,
    };

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
    // The `attributeDefinitions` array is guaranteed to exist by the L2 construct.
    (
      cfnTable.attributeDefinitions as dynamodb.CfnTable.AttributeDefinitionProperty[]
    ).push({
      attributeName: 'stockStatus',
      attributeType: 'S',
    });

    // 4. Add Global Secondary Index after table creation
    this.productInventoryTable.addGlobalSecondaryIndex({
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
      'ConsumedReadCapacityAlarm',
      {
        metric: this.productInventoryTable.metricConsumedReadCapacityUnits({
          statistic: 'Sum',
          period: cdk.Duration.minutes(5),
        }),
        threshold: 10000,
        evaluationPeriods: 1,
        treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
        alarmDescription:
          'Alert when consumed read capacity exceeds 10,000 units in 5 minutes',
        alarmName: `${this.productInventoryTable.tableName}-HighReadCapacity`,
      }
    );

    const writeCapacityAlarm = new cloudwatch.Alarm(
      this,
      'ConsumedWriteCapacityAlarm',
      {
        metric: this.productInventoryTable.metricConsumedWriteCapacityUnits({
          statistic: 'Sum',
          period: cdk.Duration.minutes(5),
        }),
        threshold: 10000,
        evaluationPeriods: 1,
        treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
        alarmDescription:
          'Alert when consumed write capacity exceeds 10,000 units in 5 minutes',
        alarmName: `${this.productInventoryTable.tableName}-HighWriteCapacity`,
      }
    );

    // Add SNS actions to both alarms
    readCapacityAlarm.addAlarmAction(
      new cloudwatchActions.SnsAction(this.inventoryAlertsTopic)
    );

    writeCapacityAlarm.addAlarmAction(
      new cloudwatchActions.SnsAction(this.inventoryAlertsTopic)
    );

    // Apply removal policy to alarms
    readCapacityAlarm.applyRemovalPolicy(cdk.RemovalPolicy.DESTROY);
    writeCapacityAlarm.applyRemovalPolicy(cdk.RemovalPolicy.DESTROY);

    // 6. Create Stack Outputs
    new cdk.CfnOutput(this, 'TableArn', {
      value: this.productInventoryTable.tableArn,
      description: 'ARN of the ProductInventory DynamoDB table',
      exportName: `${this.stackName}-TableArn`,
    });

    new cdk.CfnOutput(this, 'TableStreamArn', {
      value: this.productInventoryTable.tableStreamArn!,
      description: 'ARN of the ProductInventory DynamoDB table stream',
      exportName: `${this.stackName}-TableStreamArn`,
    });
  }
}
