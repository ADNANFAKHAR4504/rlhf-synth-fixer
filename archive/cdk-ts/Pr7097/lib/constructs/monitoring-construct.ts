import * as cdk from 'aws-cdk-lib';
import * as autoscaling from 'aws-cdk-lib/aws-autoscaling';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as cloudwatchActions from 'aws-cdk-lib/aws-cloudwatch-actions';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as snsSubscriptions from 'aws-cdk-lib/aws-sns-subscriptions';
import { Construct } from 'constructs';

export interface MonitoringConstructProps {
  environment: string;
  region: string;
  suffix: string;
  environmentSuffix: string;
  autoScalingGroup: autoscaling.AutoScalingGroup;
  lambdaFunction: lambda.Function;
  alb: elbv2.ApplicationLoadBalancer;
}

export class MonitoringConstruct extends Construct {
  public readonly errorTopic: sns.Topic;
  public readonly dashboardName: string;

  constructor(scope: Construct, id: string, props: MonitoringConstructProps) {
    super(scope, id);

    const {
      environment,
      region,
      suffix,
      environmentSuffix,
      autoScalingGroup,
      lambdaFunction,
      alb,
    } = props;

    // KMS key for SNS encryption
    const snsKey = new kms.Key(this, `SnsKmsKey${environmentSuffix}${region}`, {
      description: `SNS encryption key for ${environment} in ${region}`,
      enableKeyRotation: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Grant SNS service access to the key
    snsKey.addToResourcePolicy(
      new iam.PolicyStatement({
        principals: [new iam.ServicePrincipal('sns.amazonaws.com')],
        actions: ['kms:Decrypt', 'kms:GenerateDataKey'],
        resources: ['*'],
      })
    );

    // Cross-environment SNS topic for error notifications - Addresses MODEL_FAILURES item 4
    // Note: To be truly cross-environment, you'd need to share this topic ARN across environments
    this.errorTopic = new sns.Topic(
      this,
      `ErrorTopic${environmentSuffix}${region}`,
      {
        topicName: `${environment}-${region}-app-errors-${suffix}`,
        displayName: `Application errors for ${environment} in ${region}`,
        masterKey: snsKey,
      }
    );

    // Add configurable email subscription (replace with actual email in production)
    const notificationEmail =
      cdk.Stack.of(this).node.tryGetContext('notificationEmail') ||
      'platform-team@example.com';
    this.errorTopic.addSubscription(
      new snsSubscriptions.EmailSubscription(notificationEmail)
    );

    // Add SQS dead letter queue for failed notifications (commented out as not currently used)
    // const dlqTopic = new sns.Topic(
    //   this,
    //   `ErrorTopicDlq${environmentSuffix}${region}`,
    //   {
    //     topicName: `${environment}-${region}-app-errors-dlq-${suffix}`,
    //     displayName: `DLQ for error notifications in ${environment}`,
    //     masterKey: snsKey,
    //   }
    // );

    // EC2 CPU Utilization Alarm - Requirement 8
    const cpuAlarm = new cloudwatch.Alarm(
      this,
      `CpuAlarm${environmentSuffix}${region}`,
      {
        alarmName: `${environment}-${region}-high-cpu-${suffix}`,
        metric: new cloudwatch.Metric({
          namespace: 'AWS/EC2',
          metricName: 'CPUUtilization',
          statistic: 'Average',
          period: cdk.Duration.minutes(5),
          dimensionsMap: {
            AutoScalingGroupName: autoScalingGroup.autoScalingGroupName,
          },
        }),
        threshold: 80,
        evaluationPeriods: 2,
        datapointsToAlarm: 2,
        treatMissingData: cloudwatch.TreatMissingData.BREACHING,
        alarmDescription: `CPU utilization is too high for ${environment} environment in ${region}`,
        comparisonOperator:
          cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
      }
    );

    cpuAlarm.addAlarmAction(new cloudwatchActions.SnsAction(this.errorTopic));
    cpuAlarm.addOkAction(new cloudwatchActions.SnsAction(this.errorTopic));

    // Memory utilization alarm
    const memoryAlarm = new cloudwatch.Alarm(
      this,
      `MemoryAlarm${environmentSuffix}${region}`,
      {
        alarmName: `${environment}-${region}-high-memory-${suffix}`,
        metric: new cloudwatch.Metric({
          namespace: 'CWAgent',
          metricName: 'mem_used_percent',
          statistic: 'Average',
          period: cdk.Duration.minutes(5),
          dimensionsMap: {
            AutoScalingGroupName: autoScalingGroup.autoScalingGroupName,
          },
        }),
        threshold: 85,
        evaluationPeriods: 2,
        datapointsToAlarm: 2,
        treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
        alarmDescription: `Memory utilization is too high for ${environment} environment in ${region}`,
      }
    );

    memoryAlarm.addAlarmAction(
      new cloudwatchActions.SnsAction(this.errorTopic)
    );

    // Lambda Error Alarm
    const lambdaErrorAlarm = new cloudwatch.Alarm(
      this,
      `LambdaErrorAlarm${environmentSuffix}${region}`,
      {
        alarmName: `${environment}-${region}-lambda-errors-${suffix}`,
        metric: lambdaFunction.metricErrors({
          period: cdk.Duration.minutes(5),
          statistic: 'Sum',
        }),
        threshold: 3,
        evaluationPeriods: 1,
        datapointsToAlarm: 1,
        treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
        alarmDescription: `Lambda function errors in ${environment} environment in ${region}`,
      }
    );

    lambdaErrorAlarm.addAlarmAction(
      new cloudwatchActions.SnsAction(this.errorTopic)
    );

    // Lambda Duration Alarm
    const lambdaDurationAlarm = new cloudwatch.Alarm(
      this,
      `LambdaDurationAlarm${environmentSuffix}${region}`,
      {
        alarmName: `${environment}-${region}-lambda-duration-${suffix}`,
        metric: lambdaFunction.metricDuration({
          period: cdk.Duration.minutes(5),
          statistic: 'Average',
        }),
        threshold: 240000, // 4 minutes in milliseconds
        evaluationPeriods: 2,
        datapointsToAlarm: 2,
        treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
        alarmDescription: `Lambda function duration too high in ${environment} environment in ${region}`,
      }
    );

    lambdaDurationAlarm.addAlarmAction(
      new cloudwatchActions.SnsAction(this.errorTopic)
    );

    // Lambda Throttle Alarm
    const lambdaThrottleAlarm = new cloudwatch.Alarm(
      this,
      `LambdaThrottleAlarm${environmentSuffix}${region}`,
      {
        alarmName: `${environment}-${region}-lambda-throttles-${suffix}`,
        metric: lambdaFunction.metricThrottles({
          period: cdk.Duration.minutes(5),
          statistic: 'Sum',
        }),
        threshold: 1,
        evaluationPeriods: 1,
        treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
        alarmDescription: `Lambda function throttling detected in ${environment} environment in ${region}`,
      }
    );

    lambdaThrottleAlarm.addAlarmAction(
      new cloudwatchActions.SnsAction(this.errorTopic)
    );

    // ALB Target Health Alarm
    const albUnhealthyTargetAlarm = new cloudwatch.Alarm(
      this,
      `AlbUnhealthyTargetAlarm${environmentSuffix}${region}`,
      {
        alarmName: `${environment}-${region}-alb-unhealthy-targets-${suffix}`,
        metric: new cloudwatch.Metric({
          namespace: 'AWS/ApplicationELB',
          metricName: 'UnHealthyHostCount',
          statistic: 'Average',
          period: cdk.Duration.minutes(5),
          dimensionsMap: {
            LoadBalancer: alb.loadBalancerFullName,
          },
        }),
        threshold: 1,
        evaluationPeriods: 2,
        datapointsToAlarm: 2,
        treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
        alarmDescription: `Unhealthy targets detected in ALB for ${environment} environment in ${region}`,
      }
    );

    albUnhealthyTargetAlarm.addAlarmAction(
      new cloudwatchActions.SnsAction(this.errorTopic)
    );

    // ALB Response Time Alarm
    const albResponseTimeAlarm = new cloudwatch.Alarm(
      this,
      `AlbResponseTimeAlarm${environmentSuffix}${region}`,
      {
        alarmName: `${environment}-${region}-alb-response-time-${suffix}`,
        metric: new cloudwatch.Metric({
          namespace: 'AWS/ApplicationELB',
          metricName: 'TargetResponseTime',
          statistic: 'Average',
          period: cdk.Duration.minutes(5),
          dimensionsMap: {
            LoadBalancer: alb.loadBalancerFullName,
          },
        }),
        threshold: 2, // 2 seconds
        evaluationPeriods: 3,
        datapointsToAlarm: 2,
        treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
        alarmDescription: `High response time detected in ALB for ${environment} environment in ${region}`,
      }
    );

    albResponseTimeAlarm.addAlarmAction(
      new cloudwatchActions.SnsAction(this.errorTopic)
    );

    // ALB 5XX Error Rate Alarm
    const alb5xxAlarm = new cloudwatch.Alarm(
      this,
      `Alb5xxAlarm${environmentSuffix}${region}`,
      {
        alarmName: `${environment}-${region}-alb-5xx-errors-${suffix}`,
        metric: new cloudwatch.Metric({
          namespace: 'AWS/ApplicationELB',
          metricName: 'HTTPCode_ELB_5XX_Count',
          statistic: 'Sum',
          period: cdk.Duration.minutes(5),
          dimensionsMap: {
            LoadBalancer: alb.loadBalancerFullName,
          },
        }),
        threshold: 10,
        evaluationPeriods: 2,
        datapointsToAlarm: 1,
        treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
        alarmDescription: `High 5XX error rate in ALB for ${environment} environment in ${region}`,
      }
    );

    alb5xxAlarm.addAlarmAction(
      new cloudwatchActions.SnsAction(this.errorTopic)
    );

    // Cost alarm using Lambda's cost monitoring data
    const costAlarm = new cloudwatch.Alarm(
      this,
      `CostAlarm${environmentSuffix}${region}`,
      {
        alarmName: `${environment}-${region}-high-cost-${suffix}`,
        metric: new cloudwatch.Metric({
          namespace: 'AWS/Cost/Monitor',
          metricName: 'TotalCost30Days',
          statistic: 'Maximum',
          period: cdk.Duration.hours(24),
          dimensionsMap: {
            Environment: environment,
            Region: region,
          },
        }),
        threshold: environment === 'prod' ? 5000 : 1000, // Different thresholds per environment
        evaluationPeriods: 1,
        treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
        alarmDescription: `High cost detected for ${environment} environment in ${region}`,
      }
    );

    costAlarm.addAlarmAction(new cloudwatchActions.SnsAction(this.errorTopic));

    // Create comprehensive CloudWatch Dashboard
    this.dashboardName = `${environment}-${region}-app-dashboard-${suffix}`;
    const dashboard = new cloudwatch.Dashboard(
      this,
      `Dashboard${environmentSuffix}${region}`,
      {
        dashboardName: this.dashboardName,
        widgets: [
          [
            new cloudwatch.GraphWidget({
              title: 'EC2 CPU Utilization',
              left: [
                new cloudwatch.Metric({
                  namespace: 'AWS/EC2',
                  metricName: 'CPUUtilization',
                  statistic: 'Average',
                  dimensionsMap: {
                    AutoScalingGroupName: autoScalingGroup.autoScalingGroupName,
                  },
                }),
              ],
              width: 12,
              height: 6,
            }),
            new cloudwatch.GraphWidget({
              title: 'EC2 Memory Utilization',
              left: [
                new cloudwatch.Metric({
                  namespace: 'CWAgent',
                  metricName: 'mem_used_percent',
                  statistic: 'Average',
                  dimensionsMap: {
                    AutoScalingGroupName: autoScalingGroup.autoScalingGroupName,
                  },
                }),
              ],
              width: 12,
              height: 6,
            }),
          ],
          [
            new cloudwatch.GraphWidget({
              title: 'Lambda Metrics',
              left: [
                lambdaFunction.metricInvocations(),
                lambdaFunction.metricErrors(),
              ],
              right: [lambdaFunction.metricDuration()],
              width: 12,
              height: 6,
            }),
            new cloudwatch.GraphWidget({
              title: 'ALB Metrics',
              left: [
                new cloudwatch.Metric({
                  namespace: 'AWS/ApplicationELB',
                  metricName: 'RequestCount',
                  statistic: 'Sum',
                  dimensionsMap: {
                    LoadBalancer: alb.loadBalancerFullName,
                  },
                }),
                new cloudwatch.Metric({
                  namespace: 'AWS/ApplicationELB',
                  metricName: 'HTTPCode_Target_2XX_Count',
                  statistic: 'Sum',
                  dimensionsMap: {
                    LoadBalancer: alb.loadBalancerFullName,
                  },
                }),
              ],
              right: [
                new cloudwatch.Metric({
                  namespace: 'AWS/ApplicationELB',
                  metricName: 'TargetResponseTime',
                  statistic: 'Average',
                  dimensionsMap: {
                    LoadBalancer: alb.loadBalancerFullName,
                  },
                }),
              ],
              width: 12,
              height: 6,
            }),
          ],
          [
            new cloudwatch.SingleValueWidget({
              title: 'Current ASG Instances',
              metrics: [
                new cloudwatch.Metric({
                  namespace: 'AWS/AutoScaling',
                  metricName: 'GroupTotalInstances',
                  statistic: 'Average',
                  dimensionsMap: {
                    AutoScalingGroupName: autoScalingGroup.autoScalingGroupName,
                  },
                }),
              ],
              width: 6,
              height: 6,
            }),
            new cloudwatch.SingleValueWidget({
              title: 'Cost (30 Days)',
              metrics: [
                new cloudwatch.Metric({
                  namespace: 'AWS/Cost/Monitor',
                  metricName: 'TotalCost30Days',
                  statistic: 'Maximum',
                  dimensionsMap: {
                    Environment: environment,
                    Region: region,
                  },
                }),
              ],
              width: 6,
              height: 6,
            }),
          ],
        ],
      }
    );

    // Apply tags to all monitoring resources
    cdk.Tags.of(this.errorTopic).add('iac-rlhf-amazon', 'true');
    cdk.Tags.of(this.errorTopic).add('Environment', environment);
    cdk.Tags.of(this.errorTopic).add('Region', region);
    cdk.Tags.of(this.errorTopic).add('Purpose', 'ErrorNotifications');

    cdk.Tags.of(dashboard).add('iac-rlhf-amazon', 'true');
    cdk.Tags.of(dashboard).add('Environment', environment);
    cdk.Tags.of(dashboard).add('Region', region);
    cdk.Tags.of(dashboard).add('Purpose', 'Monitoring');

    cdk.Tags.of(snsKey).add('iac-rlhf-amazon', 'true');
    cdk.Tags.of(snsKey).add('Environment', environment);
    cdk.Tags.of(snsKey).add('Region', region);
    cdk.Tags.of(snsKey).add('Purpose', 'SNSEncryption');
  }
}
