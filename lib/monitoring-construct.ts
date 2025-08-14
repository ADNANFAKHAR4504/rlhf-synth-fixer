import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';

export interface MonitoringConstructProps {
  environmentSuffix: string;
  region: string;
  alb: cdk.aws_elasticloadbalancingv2.ApplicationLoadBalancer;
  lambdaFunction: cdk.aws_lambda.Function;
  rdsCluster: cdk.aws_rds.DatabaseCluster;
  dynamoDbTable: cdk.aws_dynamodb.Table;
}

export class MonitoringConstruct extends Construct {
  constructor(scope: Construct, id: string, props: MonitoringConstructProps) {
    super(scope, id);

    const {
      environmentSuffix,
      region,
      alb,
      lambdaFunction,
      rdsCluster,
      dynamoDbTable,
    } = props;

    // CloudWatch Dashboard
    const dashboard = new cdk.aws_cloudwatch.Dashboard(this, 'MainDashboard', {
      dashboardName: `${environmentSuffix}-dashboard-${region}`,
    });

    // ALB Metrics
    const albRequestCountMetric = alb.metrics.requestCount();
    const albResponseTimeMetric = alb.metrics.targetResponseTime();

    // Lambda Metrics
    const lambdaInvocationsMetric = lambdaFunction.metricInvocations();
    const lambdaDurationMetric = lambdaFunction.metricDuration();
    const lambdaErrorsMetric = lambdaFunction.metricErrors();

    // RDS Metrics
    const rdsConnectionsMetric = new cdk.aws_cloudwatch.Metric({
      namespace: 'AWS/RDS',
      metricName: 'DatabaseConnections',
      dimensionsMap: {
        DBClusterIdentifier: rdsCluster.clusterIdentifier,
      },
    });

    // DynamoDB Metrics
    const dynamoReadCapacityMetric =
      dynamoDbTable.metricConsumedReadCapacityUnits();
    const dynamoWriteCapacityMetric =
      dynamoDbTable.metricConsumedWriteCapacityUnits();

    // Dashboard widgets
    dashboard.addWidgets(
      new cdk.aws_cloudwatch.GraphWidget({
        title: 'ALB Request Count',
        left: [albRequestCountMetric],
        width: 12,
        height: 6,
      }),
      new cdk.aws_cloudwatch.GraphWidget({
        title: 'ALB Response Time',
        left: [albResponseTimeMetric],
        width: 12,
        height: 6,
      })
    );

    dashboard.addWidgets(
      new cdk.aws_cloudwatch.GraphWidget({
        title: 'Lambda Invocations',
        left: [lambdaInvocationsMetric],
        width: 8,
        height: 6,
      }),
      new cdk.aws_cloudwatch.GraphWidget({
        title: 'Lambda Duration',
        left: [lambdaDurationMetric],
        width: 8,
        height: 6,
      }),
      new cdk.aws_cloudwatch.GraphWidget({
        title: 'Lambda Errors',
        left: [lambdaErrorsMetric],
        width: 8,
        height: 6,
      })
    );

    dashboard.addWidgets(
      new cdk.aws_cloudwatch.GraphWidget({
        title: 'RDS Connections',
        left: [rdsConnectionsMetric],
        width: 12,
        height: 6,
      }),
      new cdk.aws_cloudwatch.GraphWidget({
        title: 'DynamoDB Capacity',
        left: [dynamoReadCapacityMetric, dynamoWriteCapacityMetric],
        width: 12,
        height: 6,
      })
    );

    // SNS Topic for alerts
    const alertsTopic = this.createSnsTopicForAlerts(environmentSuffix, region);

    // CloudWatch Alarms with SNS notifications
    const highErrorRateAlarm = new cdk.aws_cloudwatch.Alarm(
      this,
      'HighErrorRate',
      {
        alarmName: `${environmentSuffix}-lambda-high-error-rate-${region}`,
        metric: lambdaErrorsMetric,
        threshold: 10,
        evaluationPeriods: 2,
        comparisonOperator:
          cdk.aws_cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
        alarmDescription: 'Lambda function error rate is too high',
      }
    );

    const highResponseTimeAlarm = new cdk.aws_cloudwatch.Alarm(
      this,
      'HighResponseTime',
      {
        alarmName: `${environmentSuffix}-alb-high-response-time-${region}`,
        metric: albResponseTimeMetric,
        threshold: 1000, // 1 second
        evaluationPeriods: 3,
        comparisonOperator:
          cdk.aws_cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
        alarmDescription: 'ALB response time is too high',
      }
    );

    // Add SNS notifications to alarms
    highErrorRateAlarm.addAlarmAction(
      new cdk.aws_cloudwatch_actions.SnsAction(alertsTopic)
    );
    highResponseTimeAlarm.addAlarmAction(
      new cdk.aws_cloudwatch_actions.SnsAction(alertsTopic)
    );

    // Log Groups for centralized logging
    new cdk.aws_logs.LogGroup(this, 'ApplicationLogGroup', {
      logGroupName: `/aws/lambda/${lambdaFunction.functionName}`,
      retention: cdk.aws_logs.RetentionDays.ONE_MONTH,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });
  }

  private createSnsTopicForAlerts(
    environmentSuffix: string,
    region: string
  ): cdk.aws_sns.Topic {
    return new cdk.aws_sns.Topic(this, 'AlertsTopic', {
      topicName: `${environmentSuffix}-alerts-${region}`,
      displayName: `Alerts for ${environmentSuffix} environment in ${region}`,
    });
  }
}
