import * as cdk from 'aws-cdk-lib';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as cloudwatchActions from 'aws-cdk-lib/aws-cloudwatch-actions';
import * as snsSubscriptions from 'aws-cdk-lib/aws-sns-subscriptions';

export class MonitoringStack extends cdk.Stack {
  constructor(scope, id, props) {
    super(scope, id, props);

    const environmentSuffix = props?.environmentSuffix || 'dev';
    const { autoScalingGroup, targetGroup, database } = props;

    // SNS Topic for operational alerts
    this.alertTopic = new sns.Topic(this, `WebAppAlerts${environmentSuffix}`, {
      displayName: `Web Application Alerts - ${environmentSuffix}`,
      topicName: `WebAppAlerts${environmentSuffix}`,
    });

    // Add email subscription for demo (in production, configure as needed)
    // this.alertTopic.addSubscription(
    //   new snsSubscriptions.EmailSubscription('admin@example.com')
    // );

    // CloudWatch Alarm for Auto Scaling Group CPU Utilization
    // Monitor when CPU exceeds threshold for scale-out decisions
    const highCpuAlarm = new cloudwatch.Alarm(this, `HighCPUAlarm${environmentSuffix}`, {
      metric: new cloudwatch.Metric({
        namespace: 'AWS/EC2',
        metricName: 'CPUUtilization',
        dimensionsMap: {
          'AutoScalingGroupName': autoScalingGroup.autoScalingGroupName,
        },
        period: cdk.Duration.minutes(5),
        statistic: 'Average',
      }),
      threshold: 80, // Alert when CPU > 80% (higher than scale-out threshold)
      evaluationPeriods: 2,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      alarmDescription: `High CPU utilization detected in Auto Scaling Group - ${environmentSuffix}`,
      alarmName: `HighCPUAlarm${environmentSuffix}`,
    });

    highCpuAlarm.addAlarmAction(new cloudwatchActions.SnsAction(this.alertTopic));

    // CloudWatch Alarm for ALB Unhealthy Targets
    const unhealthyTargetAlarm = new cloudwatch.Alarm(this, `UnhealthyTargetAlarm${environmentSuffix}`, {
      metric: new cloudwatch.Metric({
        namespace: 'AWS/ApplicationELB',
        metricName: 'UnHealthyHostCount',
        dimensionsMap: {
          'TargetGroup': targetGroup.targetGroupFullName,
        },
        period: cdk.Duration.minutes(1),
        statistic: 'Maximum',
      }),
      threshold: 1,
      evaluationPeriods: 2,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      alarmDescription: `Unhealthy targets detected in target group - ${environmentSuffix}`,
      alarmName: `UnhealthyTargetAlarm${environmentSuffix}`,
    });

    unhealthyTargetAlarm.addAlarmAction(new cloudwatchActions.SnsAction(this.alertTopic));

    // CloudWatch Alarm for Database Connection Count
    const dbConnectionAlarm = new cloudwatch.Alarm(this, `DBConnectionAlarm${environmentSuffix}`, {
      metric: new cloudwatch.Metric({
        namespace: 'AWS/RDS',
        metricName: 'DatabaseConnections',
        dimensionsMap: {
          'DBInstanceIdentifier': database.instanceIdentifier,
        },
        period: cdk.Duration.minutes(5),
        statistic: 'Average',
      }),
      threshold: 80, // Alert when connection count is high
      evaluationPeriods: 2,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      alarmDescription: `High database connection count detected - ${environmentSuffix}`,
      alarmName: `DBConnectionAlarm${environmentSuffix}`,
    });

    dbConnectionAlarm.addAlarmAction(new cloudwatchActions.SnsAction(this.alertTopic));

    // CloudWatch Alarm for Database CPU Utilization
    const dbCpuAlarm = new cloudwatch.Alarm(this, `DBCPUAlarm${environmentSuffix}`, {
      metric: new cloudwatch.Metric({
        namespace: 'AWS/RDS',
        metricName: 'CPUUtilization',
        dimensionsMap: {
          'DBInstanceIdentifier': database.instanceIdentifier,
        },
        period: cdk.Duration.minutes(5),
        statistic: 'Average',
      }),
      threshold: 80,
      evaluationPeriods: 2,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      alarmDescription: `High database CPU utilization detected - ${environmentSuffix}`,
      alarmName: `DBCPUAlarm${environmentSuffix}`,
    });

    dbCpuAlarm.addAlarmAction(new cloudwatchActions.SnsAction(this.alertTopic));

    // CloudWatch Alarm for ALB Response Time
    const responseTimeAlarm = new cloudwatch.Alarm(this, `ResponseTimeAlarm${environmentSuffix}`, {
      metric: new cloudwatch.Metric({
        namespace: 'AWS/ApplicationELB',
        metricName: 'TargetResponseTime',
        dimensionsMap: {
          'TargetGroup': targetGroup.targetGroupFullName,
        },
        period: cdk.Duration.minutes(5),
        statistic: 'Average',
      }),
      threshold: 2, // Alert when response time > 2 seconds
      evaluationPeriods: 2,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      alarmDescription: `High response time detected - ${environmentSuffix}`,
      alarmName: `ResponseTimeAlarm${environmentSuffix}`,
    });

    responseTimeAlarm.addAlarmAction(new cloudwatchActions.SnsAction(this.alertTopic));

    // Apply environment tags
    cdk.Tags.of(this.alertTopic).add('Environment', environmentSuffix);
    cdk.Tags.of(this.alertTopic).add('Service', 'WebApp');
    cdk.Tags.of(highCpuAlarm).add('Environment', environmentSuffix);
    cdk.Tags.of(unhealthyTargetAlarm).add('Environment', environmentSuffix);
    cdk.Tags.of(dbConnectionAlarm).add('Environment', environmentSuffix);
    cdk.Tags.of(dbCpuAlarm).add('Environment', environmentSuffix);
    cdk.Tags.of(responseTimeAlarm).add('Environment', environmentSuffix);

    // Outputs
    new cdk.CfnOutput(this, `SNSTopicArn${environmentSuffix}`, {
      value: this.alertTopic.topicArn,
      exportName: `WebAppSNSTopicArn${environmentSuffix}`,
      description: 'SNS Topic ARN for web application alerts',
    });

    new cdk.CfnOutput(this, `SNSTopicName${environmentSuffix}`, {
      value: this.alertTopic.topicName,
      exportName: `WebAppSNSTopicName${environmentSuffix}`,
      description: 'SNS Topic name for web application alerts',
    });

    new cdk.CfnOutput(this, `HighCPUAlarmName${environmentSuffix}`, {
      value: highCpuAlarm.alarmName,
      exportName: `WebAppHighCPUAlarmName${environmentSuffix}`,
      description: 'High CPU alarm name',
    });

    new cdk.CfnOutput(this, `UnhealthyTargetAlarmName${environmentSuffix}`, {
      value: unhealthyTargetAlarm.alarmName,
      exportName: `WebAppUnhealthyTargetAlarmName${environmentSuffix}`,
      description: 'Unhealthy target alarm name',
    });

    new cdk.CfnOutput(this, `DBConnectionAlarmName${environmentSuffix}`, {
      value: dbConnectionAlarm.alarmName,
      exportName: `WebAppDBConnectionAlarmName${environmentSuffix}`,
      description: 'Database connection alarm name',
    });
  }
}