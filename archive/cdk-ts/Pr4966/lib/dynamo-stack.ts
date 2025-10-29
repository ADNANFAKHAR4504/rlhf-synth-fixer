import * as cdk from 'aws-cdk-lib';
import * as applicationautoscaling from 'aws-cdk-lib/aws-applicationautoscaling';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import { Construct } from 'constructs';

interface DynamoStackProps extends cdk.StackProps {
  environmentSuffix: string;
}

export class DynamoStack extends cdk.Stack {
  public readonly table: dynamodb.Table;

  constructor(scope: Construct, id: string, props: DynamoStackProps) {
    super(scope, id, props);

    const { environmentSuffix } = props;

    // Create DynamoDB table with auto-scaling
    this.table = new dynamodb.Table(this, `ItemsTable${environmentSuffix}`, {
      tableName: `tap-api-items-${environmentSuffix}`,
      partitionKey: {
        name: 'id',
        type: dynamodb.AttributeType.STRING,
      },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY, // For development/testing only
      pointInTimeRecovery: true,
    });

    // Add Global Secondary Index for potential query patterns
    this.table.addGlobalSecondaryIndex({
      indexName: 'createdAt-index',
      partitionKey: {
        name: 'createdAt',
        type: dynamodb.AttributeType.STRING,
      },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    // Enable auto-scaling for read capacity
    const readScaling = new applicationautoscaling.ScalableTarget(
      this,
      `DynamoReadScaling${environmentSuffix}`,
      {
        serviceNamespace: applicationautoscaling.ServiceNamespace.DYNAMODB,
        resourceId: `table/${this.table.tableName}/index/*`,
        scalableDimension: 'dynamodb:index:ReadCapacityUnits',
        minCapacity: 5,
        maxCapacity: 400,
        role: undefined, // Use default role
      }
    );

    readScaling.scaleToTrackMetric('DynamoReadScalingPolicy', {
      targetValue: 70.0,
      predefinedMetric:
        applicationautoscaling.PredefinedMetric
          .DYNAMODB_READ_CAPACITY_UTILIZATION,
    });

    // Enable auto-scaling for write capacity
    const writeScaling = new applicationautoscaling.ScalableTarget(
      this,
      `DynamoWriteScaling${environmentSuffix}`,
      {
        serviceNamespace: applicationautoscaling.ServiceNamespace.DYNAMODB,
        resourceId: `table/${this.table.tableName}/index/*`,
        scalableDimension: 'dynamodb:index:WriteCapacityUnits',
        minCapacity: 5,
        maxCapacity: 400,
        role: undefined, // Use default role
      }
    );

    writeScaling.scaleToTrackMetric('DynamoWriteScalingPolicy', {
      targetValue: 70.0,
      predefinedMetric:
        applicationautoscaling.PredefinedMetric
          .DYNAMODB_WRITE_CAPACITY_UTILIZATION,
    });

    // Add CloudWatch alarms for monitoring
    this.table
      .metricConsumedReadCapacityUnits({
        statistic: 'Maximum',
      })
      .createAlarm(this, `DynamoReadCapacityAlarm${environmentSuffix}`, {
        alarmName: `tap-dynamo-read-capacity-${environmentSuffix}`,
        threshold: 300,
        evaluationPeriods: 2,
        alarmDescription: 'DynamoDB read capacity utilization is high',
      });

    this.table
      .metricConsumedWriteCapacityUnits({
        statistic: 'Maximum',
      })
      .createAlarm(this, `DynamoWriteCapacityAlarm${environmentSuffix}`, {
        alarmName: `tap-dynamo-write-capacity-${environmentSuffix}`,
        threshold: 300,
        evaluationPeriods: 2,
        alarmDescription: 'DynamoDB write capacity utilization is high',
      });
  }
}
