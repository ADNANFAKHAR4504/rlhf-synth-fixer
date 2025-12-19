import * as cdk from 'aws-cdk-lib';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as logs from 'aws-cdk-lib/aws-logs';
import { Construct } from 'constructs';

interface MonitoringStackProps {
  environmentSuffix: string;
}

export class MonitoringStack extends cdk.NestedStack {
  public readonly logGroup: logs.LogGroup;

  constructor(scope: Construct, id: string, props: MonitoringStackProps) {
    super(scope, id);

    this.logGroup = new logs.LogGroup(this, 'TrainingLogGroup', {
      logGroupName: `/aws/sagemaker/training-jobs-${props.environmentSuffix}`,
      retention: logs.RetentionDays.ONE_MONTH,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const dashboard = new cloudwatch.Dashboard(this, 'TrainingDashboard', {
      dashboardName: `sagemaker-training-${props.environmentSuffix}`,
      widgets: [
        [
          new cloudwatch.GraphWidget({
            title: 'Training Job Metrics',
            width: 12,
            height: 6,
            left: [
              new cloudwatch.Metric({
                namespace: 'AWS/SageMaker',
                metricName: 'ModelLatency',
                dimensionsMap: {
                  EndpointName: 'ALL',
                },
                statistic: 'Average',
              }),
            ],
            right: [
              new cloudwatch.Metric({
                namespace: 'AWS/SageMaker',
                metricName: 'CPUUtilization',
                dimensionsMap: {
                  Host: 'ALL',
                },
                statistic: 'Average',
              }),
            ],
          }),
          new cloudwatch.GraphWidget({
            title: 'Memory Utilization',
            width: 12,
            height: 6,
            left: [
              new cloudwatch.Metric({
                namespace: 'AWS/SageMaker',
                metricName: 'MemoryUtilization',
                dimensionsMap: {
                  Host: 'ALL',
                },
                statistic: 'Average',
              }),
            ],
          }),
        ],
        [
          new cloudwatch.GraphWidget({
            title: 'Training Job Status',
            width: 24,
            height: 6,
            left: [
              new cloudwatch.Metric({
                namespace: 'AWS/SageMaker',
                metricName: 'TrainingJobsCount',
                statistic: 'Sum',
              }),
            ],
          }),
        ],
      ],
    });

    new cloudwatch.Alarm(this, 'TrainingJobFailureAlarm', {
      metric: new cloudwatch.Metric({
        namespace: 'AWS/SageMaker',
        metricName: 'TrainingJobsFailed',
        statistic: 'Sum',
        period: cdk.Duration.minutes(5),
      }),
      threshold: 1,
      evaluationPeriods: 1,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      alarmDescription: 'Alert when training jobs fail',
    });

    // Outputs
    new cdk.CfnOutput(this, 'LogGroupName', {
      value: this.logGroup.logGroupName,
      description: 'CloudWatch log group name',
    });

    new cdk.CfnOutput(this, 'DashboardName', {
      value: dashboard.dashboardName,
      description: 'CloudWatch dashboard name',
    });
  }
}
