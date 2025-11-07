import * as cdk from 'aws-cdk-lib';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as applicationautoscaling from 'aws-cdk-lib/aws-applicationautoscaling';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as cloudwatch_actions from 'aws-cdk-lib/aws-cloudwatch-actions';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as ce from 'aws-cdk-lib/aws-ce';
import { Construct } from 'constructs';

interface TapStackProps extends cdk.StackProps {
  environmentSuffix?: string;
  clusterName?: string;
  serviceNames?: string[];
  albArn?: string;
  targetGroupArns?: string[];
}

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id, props);

    const environmentSuffix =
      props?.environmentSuffix ||
      this.node.tryGetContext('environmentSuffix') ||
      'dev';

    const clusterName =
      props?.clusterName ||
      this.node.tryGetContext('clusterName') ||
      'financial-services-cluster';

    const serviceNames =
      props?.serviceNames ||
      this.node.tryGetContext('serviceNames')?.split(',') ||
      Array.from({ length: 12 }, (_, i) => `service-${i + 1}`);

    const albArn =
      props?.albArn ||
      this.node.tryGetContext('albArn');

    const targetGroupArns =
      props?.targetGroupArns ||
      this.node.tryGetContext('targetGroupArns')?.split(',') ||
      [];

    cdk.Tags.of(this).add('Service', 'FinancialServices');
    cdk.Tags.of(this).add('Environment', environmentSuffix);

    const cluster = ecs.Cluster.fromClusterName(
      this,
      'ExistingCluster',
      clusterName
    );

    const snsTopic = new sns.Topic(this, 'CostAnomalyTopic', {
      topicName: `cost-anomaly-${environmentSuffix}`,
      displayName: 'Cost Anomaly Detection Alerts',
    });

    cdk.Tags.of(snsTopic).add('Service', 'FinancialServices');
    cdk.Tags.of(snsTopic).add('Environment', environmentSuffix);

    const costAnomalyDetector = new ce.CfnAnomalyDetector(this, 'CostAnomalyDetector', {
      anomalyDetectorName: `financial-services-cost-${environmentSuffix}`,
      monitorType: 'DIMENSIONAL',
      monitorSpecification: JSON.stringify({
        Dimension: 'SERVICE',
        MatchOptions: ['EQUALS'],
        Values: ['Amazon Elastic Container Service'],
      }),
    });

    cdk.Tags.of(costAnomalyDetector).add('Service', 'FinancialServices');
    cdk.Tags.of(costAnomalyDetector).add('Environment', environmentSuffix);

    new ce.CfnAnomalySubscription(this, 'CostAnomalySubscription', {
      subscriptionName: `cost-anomaly-subscription-${environmentSuffix}`,
      monitorArnList: [costAnomalyDetector.attrMonitorArn],
      subscribers: [
        {
          type: 'SNS',
          address: snsTopic.topicArn,
        },
      ],
      threshold: 50.0,
      frequency: 'IMMEDIATE',
    });

    const scalingRole = new iam.Role(this, 'ScalingRole', {
      assumedBy: new iam.ServicePrincipal('application-autoscaling.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/ApplicationAutoScalingForECSService'),
      ],
      inlinePolicies: {
        ScalingPolicy: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                'ecs:DescribeServices',
                'ecs:UpdateService',
                'cloudwatch:PutMetricAlarm',
                'cloudwatch:DescribeAlarms',
                'cloudwatch:GetMetricStatistics',
              ],
              resources: ['*'],
            }),
          ],
        }),
      },
    });

    cdk.Tags.of(scalingRole).add('Service', 'FinancialServices');
    cdk.Tags.of(scalingRole).add('Environment', environmentSuffix);

    const dashboard = new cloudwatch.Dashboard(this, 'ECSDashboard', {
      dashboardName: `ecs-cost-optimization-${environmentSuffix}`,
    });

    cdk.Tags.of(dashboard).add('Service', 'FinancialServices');
    cdk.Tags.of(dashboard).add('Environment', environmentSuffix);

    serviceNames.forEach((serviceName, index) => {
      const serviceArn = cdk.Stack.of(this).formatArn({
        service: 'ecs',
        resource: 'service',
        resourceName: `${clusterName}/${serviceName}`,
      });

      const service = ecs.FargateService.fromFargateServiceAttributes(
        this,
        `Service${index}`,
        {
          serviceArn,
          cluster,
        }
      );

      const scalableTarget = new applicationautoscaling.ScalableTarget(
        this,
        `ScalableTarget${index}`,
        {
          serviceNamespace: applicationautoscaling.ServiceNamespace.ECS,
          scalableDimension: 'ecs:service:DesiredCount',
          resourceId: `service/${clusterName}/${serviceName}`,
          minCapacity: 2,
          maxCapacity: 20,
          role: scalingRole,
        }
      );

      cdk.Tags.of(scalableTarget).add('Service', 'FinancialServices');
      cdk.Tags.of(scalableTarget).add('Environment', environmentSuffix);

      const targetTrackingCpu = new applicationautoscaling.TargetTrackingScalingPolicy(
        this,
        `CpuTargetTracking${index}`,
        {
          policyName: `cpu-target-tracking-${serviceName}-${environmentSuffix}`,
          scalingTarget: scalableTarget,
          targetValue: 60.0,
          scaleInCooldown: cdk.Duration.seconds(300),
          scaleOutCooldown: cdk.Duration.seconds(60),
          customMetric: new cloudwatch.Metric({
            namespace: 'AWS/ECS',
            metricName: 'CPUUtilization',
            dimensionsMap: {
              ServiceName: serviceName,
              ClusterName: clusterName,
            },
            statistic: 'Average',
            period: cdk.Duration.minutes(1),
          }),
        }
      );

      cdk.Tags.of(targetTrackingCpu).add('Service', 'FinancialServices');
      cdk.Tags.of(targetTrackingCpu).add('Environment', environmentSuffix);

      const targetTrackingMemory = new applicationautoscaling.TargetTrackingScalingPolicy(
        this,
        `MemoryTargetTracking${index}`,
        {
          policyName: `memory-target-tracking-${serviceName}-${environmentSuffix}`,
          scalingTarget: scalableTarget,
          targetValue: 60.0,
          scaleInCooldown: cdk.Duration.seconds(300),
          scaleOutCooldown: cdk.Duration.seconds(60),
          customMetric: new cloudwatch.Metric({
            namespace: 'AWS/ECS',
            metricName: 'MemoryUtilization',
            dimensionsMap: {
              ServiceName: serviceName,
              ClusterName: clusterName,
            },
            statistic: 'Average',
            period: cdk.Duration.minutes(1),
          }),
        }
      );

      cdk.Tags.of(targetTrackingMemory).add('Service', 'FinancialServices');
      cdk.Tags.of(targetTrackingMemory).add('Environment', environmentSuffix);

      const stepScalingAlarm = new cloudwatch.Alarm(this, `StepScalingAlarm${index}`, {
        alarmName: `ecs-${serviceName}-step-scaling-${environmentSuffix}`,
        metric: new cloudwatch.Metric({
          namespace: 'AWS/ECS',
          metricName: 'CPUUtilization',
          dimensionsMap: {
            ServiceName: serviceName,
            ClusterName: clusterName,
          },
          statistic: 'Average',
          period: cdk.Duration.minutes(1),
        }),
        threshold: 70,
        evaluationPeriods: 1,
        treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      });

      const stepScaling = new applicationautoscaling.StepScalingPolicy(
        this,
        `StepScaling${index}`,
        {
          scalingTarget: scalableTarget,
          metric: stepScalingAlarm.metric,
          adjustmentType: applicationautoscaling.AdjustmentType.CHANGE_IN_CAPACITY,
          cooldown: cdk.Duration.seconds(60),
          minAdjustmentMagnitude: 1,
        }
      );

      stepScaling.addAdjustment({
        adjustmentType: applicationautoscaling.AdjustmentType.CHANGE_IN_CAPACITY,
        scalingAdjustment: 2,
        lowerBound: 0,
        upperBound: 50,
      });

      stepScaling.addAdjustment({
        adjustmentType: applicationautoscaling.AdjustmentType.CHANGE_IN_CAPACITY,
        scalingAdjustment: 4,
        lowerBound: 50,
        upperBound: 75,
      });

      stepScaling.addAdjustment({
        adjustmentType: applicationautoscaling.AdjustmentType.CHANGE_IN_CAPACITY,
        scalingAdjustment: 6,
        lowerBound: 75,
      });

      stepScalingAlarm.addAlarmAction(
        new applicationautoscaling.StepScalingAction(stepScaling)
      );

      cdk.Tags.of(stepScaling).add('Service', 'FinancialServices');
      cdk.Tags.of(stepScaling).add('Environment', environmentSuffix);

      scalableTarget.addScheduledAction(
        applicationautoscaling.Schedule.cron({
          hour: '9',
          minute: '0',
          timeZone: 'America/New_York',
        }),
        {
          minCapacity: 10,
          maxCapacity: 20,
        }
      );

      scalableTarget.addScheduledAction(
        applicationautoscaling.Schedule.cron({
          hour: '18',
          minute: '0',
          timeZone: 'America/New_York',
        }),
        {
          minCapacity: 2,
          maxCapacity: 10,
        }
      );

      if (targetGroupArns[index]) {
        const targetGroup = elbv2.ApplicationTargetGroup.fromTargetGroupAttributes(
          this,
          `TargetGroup${index}`,
          {
            targetGroupArn: targetGroupArns[index],
            loadBalancerArns: albArn ? [albArn] : undefined,
          }
        );

        targetGroup.setAttribute('deregistration_delay.timeout_seconds', '60');
      }

      const cpuAlarm = new cloudwatch.Alarm(this, `CpuAlarm${index}`, {
        alarmName: `ecs-${serviceName}-cpu-high-${environmentSuffix}`,
        metric: new cloudwatch.Metric({
          namespace: 'AWS/ECS',
          metricName: 'CPUUtilization',
          dimensionsMap: {
            ServiceName: serviceName,
            ClusterName: clusterName,
          },
          statistic: 'Average',
          period: cdk.Duration.minutes(5),
        }),
        threshold: 80,
        evaluationPeriods: 2,
        treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      });

      cpuAlarm.addAlarmAction(new cloudwatch_actions.SnsAction(snsTopic));

      cdk.Tags.of(cpuAlarm).add('Service', 'FinancialServices');
      cdk.Tags.of(cpuAlarm).add('Environment', environmentSuffix);

      const memoryAlarm = new cloudwatch.Alarm(this, `MemoryAlarm${index}`, {
        alarmName: `ecs-${serviceName}-memory-high-${environmentSuffix}`,
        metric: new cloudwatch.Metric({
          namespace: 'AWS/ECS',
          metricName: 'MemoryUtilization',
          dimensionsMap: {
            ServiceName: serviceName,
            ClusterName: clusterName,
          },
          statistic: 'Average',
          period: cdk.Duration.minutes(5),
        }),
        threshold: 80,
        evaluationPeriods: 2,
        treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      });

      memoryAlarm.addAlarmAction(new cloudwatch_actions.SnsAction(snsTopic));

      cdk.Tags.of(memoryAlarm).add('Service', 'FinancialServices');
      cdk.Tags.of(memoryAlarm).add('Environment', environmentSuffix);

      dashboard.addWidgets(
        new cloudwatch.GraphWidget({
          title: `${serviceName} - Task Count`,
          left: [
            new cloudwatch.Metric({
              namespace: 'AWS/ECS',
              metricName: 'DesiredTaskCount',
              dimensionsMap: {
                ServiceName: serviceName,
                ClusterName: clusterName,
              },
              statistic: 'Average',
            }),
            new cloudwatch.Metric({
              namespace: 'AWS/ECS',
              metricName: 'RunningTaskCount',
              dimensionsMap: {
                ServiceName: serviceName,
                ClusterName: clusterName,
              },
              statistic: 'Average',
            }),
          ],
          width: 12,
        }),
        new cloudwatch.GraphWidget({
          title: `${serviceName} - CPU/Memory`,
          left: [
            new cloudwatch.Metric({
              namespace: 'AWS/ECS',
              metricName: 'CPUUtilization',
              dimensionsMap: {
                ServiceName: serviceName,
                ClusterName: clusterName,
              },
              statistic: 'Average',
            }),
            new cloudwatch.Metric({
              namespace: 'AWS/ECS',
              metricName: 'MemoryUtilization',
              dimensionsMap: {
                ServiceName: serviceName,
                ClusterName: clusterName,
              },
              statistic: 'Average',
            }),
          ],
          width: 12,
        })
      );
    });

    if (albArn) {
      const alb = elbv2.ApplicationLoadBalancer.fromApplicationLoadBalancerAttributes(
        this,
        'ExistingALB',
        {
          loadBalancerArn: albArn,
          securityGroupId: this.node.tryGetContext('albSecurityGroupId') || '',
        }
      );

      const requestRateMetric = new cloudwatch.Metric({
        namespace: 'AWS/ApplicationELB',
        metricName: 'RequestCount',
        dimensionsMap: {
          LoadBalancer: alb.loadBalancerFullName,
        },
        statistic: 'Sum',
        period: cdk.Duration.minutes(1),
      });

      const error5xxMetric = new cloudwatch.Metric({
        namespace: 'AWS/ApplicationELB',
        metricName: 'HTTPCode_Target_5XX_Count',
        dimensionsMap: {
          LoadBalancer: alb.loadBalancerFullName,
        },
        statistic: 'Sum',
        period: cdk.Duration.minutes(1),
      });

      dashboard.addWidgets(
        new cloudwatch.GraphWidget({
          title: 'ALB - Request Rate',
          left: [requestRateMetric],
          width: 12,
        }),
        new cloudwatch.GraphWidget({
          title: 'ALB - 5xx Errors',
          left: [error5xxMetric],
          width: 12,
        })
      );

      const error5xxAlarm = new cloudwatch.Alarm(this, 'Error5xxAlarm', {
        alarmName: `alb-5xx-errors-${environmentSuffix}`,
        metric: error5xxMetric,
        threshold: 10,
        evaluationPeriods: 2,
        treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      });

      error5xxAlarm.addAlarmAction(new cloudwatch_actions.SnsAction(snsTopic));

      cdk.Tags.of(error5xxAlarm).add('Service', 'FinancialServices');
      cdk.Tags.of(error5xxAlarm).add('Environment', environmentSuffix);
    }

    const costMetric = new cloudwatch.Metric({
      namespace: 'AWS/Billing',
      metricName: 'EstimatedCharges',
      dimensionsMap: {
        ServiceName: 'Amazon Elastic Container Service',
        Currency: 'USD',
      },
      statistic: 'Maximum',
      period: cdk.Duration.hours(1),
    });

    dashboard.addWidgets(
      new cloudwatch.GraphWidget({
        title: 'Cost Signals - ECS Estimated Charges',
        left: [costMetric],
        width: 24,
      })
    );
  }
}
