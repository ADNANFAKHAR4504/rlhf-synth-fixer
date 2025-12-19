import { Construct } from 'constructs';
import * as codepipeline from 'aws-cdk-lib/aws-codepipeline';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as cloudwatch_actions from 'aws-cdk-lib/aws-cloudwatch-actions';
import * as sns from 'aws-cdk-lib/aws-sns';
import { Duration } from 'aws-cdk-lib';

export interface MonitoringConstructProps {
  environmentSuffix: string;
  pipeline: codepipeline.Pipeline;
  ecsService: ecs.FargateService;
  loadBalancer: elbv2.ApplicationLoadBalancer;
}

export class MonitoringConstruct extends Construct {
  public readonly alarmTopic: sns.Topic;

  constructor(scope: Construct, id: string, props: MonitoringConstructProps) {
    super(scope, id);

    const { environmentSuffix, pipeline, ecsService, loadBalancer } = props;

    // SNS topic for alarms
    this.alarmTopic = new sns.Topic(this, 'AlarmTopic', {
      topicName: `cicd-alarms-${environmentSuffix}`,
      displayName: 'CI/CD Pipeline Alarms',
    });

    // Pipeline failure alarm
    const pipelineFailureMetric = new cloudwatch.Metric({
      namespace: 'AWS/CodePipeline',
      metricName: 'PipelineExecutionFailure',
      dimensionsMap: {
        PipelineName: pipeline.pipelineName,
      },
      statistic: 'Sum',
      period: Duration.minutes(5),
    });

    const pipelineFailureAlarm = new cloudwatch.Alarm(
      this,
      'PipelineFailureAlarm',
      {
        alarmName: `cicd-pipeline-failure-${environmentSuffix}`,
        alarmDescription: 'Alarm when pipeline execution fails',
        metric: pipelineFailureMetric,
        threshold: 1,
        evaluationPeriods: 1,
        comparisonOperator:
          cloudwatch.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
        treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      }
    );

    pipelineFailureAlarm.addAlarmAction(
      new cloudwatch_actions.SnsAction(this.alarmTopic)
    );

    // ECS service unhealthy tasks alarm
    const unhealthyTasksMetric = ecsService.metricCpuUtilization({
      period: Duration.minutes(5),
      statistic: 'Average',
    });

    const highCpuAlarm = new cloudwatch.Alarm(this, 'HighCpuAlarm', {
      alarmName: `cicd-ecs-high-cpu-${environmentSuffix}`,
      alarmDescription: 'Alarm when ECS tasks CPU is high',
      metric: unhealthyTasksMetric,
      threshold: 85,
      evaluationPeriods: 2,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    });

    highCpuAlarm.addAlarmAction(
      new cloudwatch_actions.SnsAction(this.alarmTopic)
    );

    // ALB unhealthy target alarm
    const unhealthyTargetMetric = new cloudwatch.Metric({
      namespace: 'AWS/ApplicationELB',
      metricName: 'UnHealthyHostCount',
      dimensionsMap: {
        LoadBalancer: loadBalancer.loadBalancerFullName,
      },
      statistic: 'Average',
      period: Duration.minutes(5),
    });

    const unhealthyTargetAlarm = new cloudwatch.Alarm(
      this,
      'UnhealthyTargetAlarm',
      {
        alarmName: `cicd-alb-unhealthy-targets-${environmentSuffix}`,
        alarmDescription: 'Alarm when ALB has unhealthy targets',
        metric: unhealthyTargetMetric,
        threshold: 1,
        evaluationPeriods: 2,
        comparisonOperator:
          cloudwatch.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
        treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      }
    );

    unhealthyTargetAlarm.addAlarmAction(
      new cloudwatch_actions.SnsAction(this.alarmTopic)
    );

    // ALB 5xx errors alarm
    const alb5xxMetric = new cloudwatch.Metric({
      namespace: 'AWS/ApplicationELB',
      metricName: 'HTTPCode_Target_5XX_Count',
      dimensionsMap: {
        LoadBalancer: loadBalancer.loadBalancerFullName,
      },
      statistic: 'Sum',
      period: Duration.minutes(5),
    });

    const alb5xxAlarm = new cloudwatch.Alarm(this, 'Alb5xxAlarm', {
      alarmName: `cicd-alb-5xx-errors-${environmentSuffix}`,
      alarmDescription: 'Alarm when ALB returns 5xx errors',
      metric: alb5xxMetric,
      threshold: 10,
      evaluationPeriods: 1,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    });

    alb5xxAlarm.addAlarmAction(
      new cloudwatch_actions.SnsAction(this.alarmTopic)
    );

    // Dashboard
    new cloudwatch.Dashboard(this, 'Dashboard', {
      dashboardName: `cicd-dashboard-${environmentSuffix}`,
      widgets: [
        [
          new cloudwatch.GraphWidget({
            title: 'Pipeline Execution Status',
            left: [pipelineFailureMetric],
            width: 12,
          }),
          new cloudwatch.GraphWidget({
            title: 'ECS CPU Utilization',
            left: [unhealthyTasksMetric],
            width: 12,
          }),
        ],
        [
          new cloudwatch.GraphWidget({
            title: 'ALB Unhealthy Targets',
            left: [unhealthyTargetMetric],
            width: 12,
          }),
          new cloudwatch.GraphWidget({
            title: 'ALB 5xx Errors',
            left: [alb5xxMetric],
            width: 12,
          }),
        ],
      ],
    });
  }
}
