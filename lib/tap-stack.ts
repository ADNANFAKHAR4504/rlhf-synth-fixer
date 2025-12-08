import * as cdk from 'aws-cdk-lib';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as events from 'aws-cdk-lib/aws-events';
import * as targets from 'aws-cdk-lib/aws-events-targets';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as subscriptions from 'aws-cdk-lib/aws-sns-subscriptions';
import { Construct } from 'constructs';
import * as path from 'path';

export interface TapStackProps extends cdk.StackProps {
  environmentSuffix: string;
  alertEmail?: string;
}

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: TapStackProps) {
    super(scope, id, props);

    const { environmentSuffix, alertEmail } = props;

    // DynamoDB table to store drift detection results
    const driftTable = new dynamodb.Table(this, 'DriftTable', {
      tableName: `drift-detection-${environmentSuffix}`,
      partitionKey: {
        name: 'stackName',
        type: dynamodb.AttributeType.STRING,
      },
      sortKey: {
        name: 'timestamp',
        type: dynamodb.AttributeType.NUMBER,
      },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // SNS topic for drift alerts
    const alertTopic = new sns.Topic(this, 'AlertTopic', {
      topicName: `drift-alerts-${environmentSuffix}`,
      displayName: 'CloudFormation Drift Detection Alerts',
    });

    // Add email subscription if provided
    if (alertEmail) {
      alertTopic.addSubscription(
        new subscriptions.EmailSubscription(alertEmail)
      );
    }

    // Lambda function for drift detection
    const driftFunction = new lambda.Function(this, 'DriftFunction', {
      functionName: `drift-detector-${environmentSuffix}`,
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, 'lambda')),
      timeout: cdk.Duration.minutes(15),
      memorySize: 512,
      environment: {
        DRIFT_TABLE_NAME: driftTable.tableName,
        ALERT_TOPIC_ARN: alertTopic.topicArn,
        ENVIRONMENT_SUFFIX: environmentSuffix,
      },
    });

    // Grant Lambda permissions to read CloudFormation stacks
    driftFunction.addToRolePolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          'cloudformation:DescribeStacks',
          'cloudformation:ListStacks',
          'cloudformation:DetectStackDrift',
          'cloudformation:DescribeStackDriftDetectionStatus',
          'cloudformation:DescribeStackResourceDrifts',
        ],
        resources: ['*'],
      })
    );

    // Grant Lambda permissions to write to DynamoDB
    driftTable.grantWriteData(driftFunction);

    // Grant Lambda permissions to publish to SNS
    alertTopic.grantPublish(driftFunction);

    // EventBridge rule to trigger Lambda every 6 hours
    const driftSchedule = new events.Rule(this, 'DriftSchedule', {
      ruleName: `drift-detection-schedule-${environmentSuffix}`,
      description: 'Triggers drift detection every 6 hours',
      schedule: events.Schedule.rate(cdk.Duration.hours(6)),
    });

    driftSchedule.addTarget(new targets.LambdaFunction(driftFunction));

    // CloudFormation outputs
    new cdk.CfnOutput(this, 'DriftTableName', {
      value: driftTable.tableName,
      description: 'DynamoDB table for drift detection results',
      exportName: `DriftTableName-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'DriftFunctionName', {
      value: driftFunction.functionName,
      description: 'Lambda function for drift detection',
      exportName: `DriftFunctionName-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'AlertTopicArn', {
      value: alertTopic.topicArn,
      description: 'SNS topic for drift alerts',
      exportName: `AlertTopicArn-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'ScheduleRuleName', {
      value: driftSchedule.ruleName,
      description: 'EventBridge rule for drift detection schedule',
      exportName: `ScheduleRuleName-${environmentSuffix}`,
    });
  }
}
