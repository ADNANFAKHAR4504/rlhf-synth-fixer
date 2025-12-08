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

    // sanitize suffix so resource names and CFN identifiers are safe
    const rawSuffix = (props.environmentSuffix || 'dev').toString();
    const environmentSuffix = rawSuffix.replace(/[^A-Za-z0-9_]/g, '');

    // decide whether this looks like production (simple heuristic)
    const isProd = /^(prod|production)$/i.test(environmentSuffix);

    // DynamoDB table to store drift detection results
    const driftTable = new dynamodb.Table(this, 'DriftTable', {
      // physical name — keep stable and CF-friendly
      tableName: `drift_detection_${environmentSuffix}`,
      partitionKey: {
        name: 'stackName',
        type: dynamodb.AttributeType.STRING,
      },
      sortKey: {
        name: 'timestamp',
        type: dynamodb.AttributeType.NUMBER,
      },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: isProd
        ? cdk.RemovalPolicy.RETAIN
        : cdk.RemovalPolicy.DESTROY,
    });

    // SNS topic for drift alerts
    const alertTopic = new sns.Topic(this, 'AlertTopic', {
      topicName: `drift_alerts_${environmentSuffix}`,
      displayName: `CloudFormation Drift Detection Alerts (${environmentSuffix})`,
    });

    // Add email subscription if provided and looks like an email
    if (props.alertEmail && /\S+@\S+\.\S+/.test(props.alertEmail)) {
      alertTopic.addSubscription(
        new subscriptions.EmailSubscription(props.alertEmail)
      );
    }

    // Lambda function for drift detection
    const driftFunction = new lambda.Function(this, 'DriftFunction', {
      functionName: `drift_detector_${environmentSuffix}`,
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

    // Grant Lambda permissions to perform CloudFormation drift operations.
    // Note: CloudFormation drift APIs often require '*' resource. If you have a small set of stack ARNs,
    // replace '*' with those ARNs to follow least-privilege.
    driftFunction.addToRolePolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          'cloudformation:DescribeStacks',
          'cloudformation:ListStacks',
          'cloudformation:DetectStackDrift',
          'cloudformation:DescribeStackDriftDetectionStatus',
          'cloudformation:DescribeStackResourceDrifts',
          'cloudformation:DescribeStackResources',
        ],
        resources: ['*'],
      })
    );

    // Grant Lambda permissions to write to DynamoDB and publish to SNS
    driftTable.grantWriteData(driftFunction);
    alertTopic.grantPublish(driftFunction);

    // EventBridge rule to trigger Lambda every 6 hours
    const driftSchedule = new events.Rule(this, 'DriftSchedule', {
      ruleName: `drift_detection_schedule_${environmentSuffix}`,
      description: 'Triggers drift detection every 6 hours',
      schedule: events.Schedule.rate(cdk.Duration.hours(6)),
    });

    driftSchedule.addTarget(new targets.LambdaFunction(driftFunction));

    // CloudFormation outputs
    new cdk.CfnOutput(this, 'DriftTableName', {
      value: driftTable.tableName,
      description: 'DynamoDB table for drift detection results',
    });

    new cdk.CfnOutput(this, 'DriftFunctionName', {
      value: driftFunction.functionName,
      description: 'Lambda function for drift detection',
    });

    new cdk.CfnOutput(this, 'AlertTopicArn', {
      value: alertTopic.topicArn,
      description: 'SNS topic for drift alerts',
    });

    new cdk.CfnOutput(this, 'ScheduleRuleName', {
      value: driftSchedule.ruleName,
      description: 'EventBridge rule for drift detection schedule',
    });
  }
}
