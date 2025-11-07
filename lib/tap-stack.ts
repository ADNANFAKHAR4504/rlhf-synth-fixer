import * as cdk from 'aws-cdk-lib';
import * as applicationautoscaling from 'aws-cdk-lib/aws-applicationautoscaling';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as cloudwatch_actions from 'aws-cdk-lib/aws-cloudwatch-actions';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as custom_resources from 'aws-cdk-lib/custom-resources';
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

    const albArn = props?.albArn || this.node.tryGetContext('albArn');

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const targetGroupArns =
      props?.targetGroupArns ||
      this.node.tryGetContext('targetGroupArns')?.split(',') ||
      [];

    cdk.Tags.of(this).add('Service', 'FinancialServices');
    cdk.Tags.of(this).add('Environment', environmentSuffix);

    const snsTopic = new sns.Topic(this, 'CostAnomalyTopic', {
      topicName: `cost-anomaly-${environmentSuffix}`,
      displayName: 'Cost Anomaly Detection Alerts',
    });

    cdk.Tags.of(snsTopic).add('Service', 'FinancialServices');
    cdk.Tags.of(snsTopic).add('Environment', environmentSuffix);

    // Cost Anomaly Detection is not supported directly in CloudFormation
    // Use a Custom Resource Lambda to create/update/delete via Cost Explorer API
    const costAnomalyHandler = new lambda.Function(this, 'CostAnomalyHandler', {
      runtime: lambda.Runtime.PYTHON_3_11,
      handler: 'index.handler',
      timeout: cdk.Duration.minutes(5),
      code: lambda.Code.fromInline(`
import json
import boto3
import cfnresponse

ce = boto3.client('ce')

def handler(event, context):
    request_type = event['RequestType']
    props = event['ResourceProperties']
    
    detector_name = props['DetectorName']
    subscription_name = props['SubscriptionName']
    sns_topic_arn = props['SnsTopicArn']
    
    try:
        if request_type == 'Delete':
            # Delete subscription first, then detector
            try:
                subscriptions = ce.get_anomaly_subscriptions()
                for sub in subscriptions.get('AnomalySubscriptions', []):
                    if sub['SubscriptionName'] == subscription_name:
                        ce.delete_anomaly_subscription(
                            SubscriptionArn=sub['SubscriptionArn']
                        )
            except Exception as e:
                print(f"Error deleting subscription: {e}")
            
            try:
                detectors = ce.list_anomaly_detectors()
                for det in detectors.get('AnomalyDetectors', []):
                    if det['AnomalyDetectorName'] == detector_name:
                        ce.delete_anomaly_detector(
                            AnomalyDetectorArn=det['AnomalyDetectorArn']
                        )
            except Exception as e:
                print(f"Error deleting detector: {e}")
            
            cfnresponse.send(event, context, cfnresponse.SUCCESS, {})
            return
        
        # Create or update detector
        detector_arn = None
        detectors = ce.list_anomaly_detectors()
        for det in detectors.get('AnomalyDetectors', []):
            if det['AnomalyDetectorName'] == detector_name:
                detector_arn = det['AnomalyDetectorArn']
                break
        
        if not detector_arn:
            response = ce.create_anomaly_detector(
                AnomalyDetectorName=detector_name,
                MonitorType='DIMENSIONAL',
                MonitorSpecification={
                    'Dimension': 'SERVICE',
                    'MatchOptions': ['EQUALS'],
                    'Values': ['Amazon Elastic Container Service']
                }
            )
            detector_arn = response['AnomalyDetectorArn']
        
        # Create or update subscription
        subscription_arn = None
        subscriptions = ce.get_anomaly_subscriptions()
        for sub in subscriptions.get('AnomalySubscriptions', []):
            if sub['SubscriptionName'] == subscription_name:
                subscription_arn = sub['SubscriptionArn']
                # Update existing subscription
                ce.update_anomaly_subscription(
                    SubscriptionArn=subscription_arn,
                    MonitorArnList=[detector_arn],
                    Subscribers=[
                        {
                            'Type': 'SNS',
                            'Address': sns_topic_arn
                        }
                    ],
                    Threshold=50.0,
                    Frequency='IMMEDIATE'
                )
                break
        
        if not subscription_arn:
            response = ce.create_anomaly_subscription(
                AnomalySubscription={
                    'SubscriptionName': subscription_name,
                    'MonitorArnList': [detector_arn],
                    'Subscribers': [
                        {
                            'Type': 'SNS',
                            'Address': sns_topic_arn
                        }
                    ],
                    'Threshold': 50.0,
                    'Frequency': 'IMMEDIATE'
                }
            )
            subscription_arn = response['SubscriptionArn']
        
        cfnresponse.send(event, context, cfnresponse.SUCCESS, {
            'DetectorArn': detector_arn,
            'SubscriptionArn': subscription_arn
        })
    except Exception as e:
        print(f"Error: {str(e)}")
        cfnresponse.send(event, context, cfnresponse.FAILED, {}, reason=str(e))
`),
    });

    costAnomalyHandler.addToRolePolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          'ce:CreateAnomalyDetector',
          'ce:DeleteAnomalyDetector',
          'ce:ListAnomalyDetectors',
          'ce:CreateAnomalySubscription',
          'ce:UpdateAnomalySubscription',
          'ce:DeleteAnomalySubscription',
          'ce:GetAnomalySubscriptions',
        ],
        resources: ['*'],
      })
    );

    const costAnomalyProvider = new custom_resources.Provider(
      this,
      'CostAnomalyProvider',
      {
        onEventHandler: costAnomalyHandler,
      }
    );

    const costAnomalyResource = new cdk.CustomResource(
      this,
      'CostAnomalyResource',
      {
        serviceToken: costAnomalyProvider.serviceToken,
        properties: {
          DetectorName: `financial-services-cost-${environmentSuffix}`,
          SubscriptionName: `cost-anomaly-subscription-${environmentSuffix}`,
          SnsTopicArn: snsTopic.topicArn,
        },
      }
    );

    cdk.Tags.of(costAnomalyHandler).add('Service', 'FinancialServices');
    cdk.Tags.of(costAnomalyHandler).add('Environment', environmentSuffix);
    cdk.Tags.of(costAnomalyProvider).add('Service', 'FinancialServices');
    cdk.Tags.of(costAnomalyProvider).add('Environment', environmentSuffix);
    cdk.Tags.of(costAnomalyResource).add('Service', 'FinancialServices');
    cdk.Tags.of(costAnomalyResource).add('Environment', environmentSuffix);

    const scalingRole = new iam.Role(this, 'ScalingRole', {
      assumedBy: new iam.ServicePrincipal(
        'application-autoscaling.amazonaws.com'
      ),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'service-role/ApplicationAutoScalingForECSService'
        ),
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

    serviceNames.forEach((serviceName: string, index: number) => {
      // Note: Capacity provider strategy for existing services should be configured
      // via AWS Console, CLI, or a custom resource Lambda function.
      // The strategy should use FARGATE (weight: 1, base: 1) and FARGATE_SPOT (weight: 3, base: 0)
      // to bias toward Spot when safe while maintaining at least one on-demand task.

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

      const targetTrackingCpu =
        new applicationautoscaling.TargetTrackingScalingPolicy(
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

      const targetTrackingMemory =
        new applicationautoscaling.TargetTrackingScalingPolicy(
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

      const stepScalingAlarm = new cloudwatch.Alarm(
        this,
        `StepScalingAlarm${index}`,
        {
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
        }
      );

      const stepScaling = new applicationautoscaling.StepScalingPolicy(
        this,
        `StepScaling${index}`,
        {
          scalingTarget: scalableTarget,
          metric: stepScalingAlarm.metric,
          adjustmentType:
            applicationautoscaling.AdjustmentType.CHANGE_IN_CAPACITY,
          cooldown: cdk.Duration.seconds(60),
          minAdjustmentMagnitude: 1,
          scalingSteps: [
            {
              lower: 0,
              upper: 50,
              change: 2,
            },
            {
              lower: 50,
              upper: 75,
              change: 4,
            },
            {
              lower: 75,
              change: 6,
            },
          ],
        }
      );

      // Step scaling policy is automatically triggered when alarm breaches threshold

      cdk.Tags.of(stepScaling).add('Service', 'FinancialServices');
      cdk.Tags.of(stepScaling).add('Environment', environmentSuffix);

      const cfnScalableTarget = scalableTarget.node
        .defaultChild as applicationautoscaling.CfnScalableTarget;

      cfnScalableTarget.addPropertyOverride('ScheduledActions', [
        {
          ScheduledActionName: `peak-${serviceName}-${environmentSuffix}`,
          Schedule: 'cron(0 9 * * ? *)',
          Timezone: 'America/New_York',
          ScalableTargetAction: {
            MinCapacity: 10,
            MaxCapacity: 20,
          },
        },
        {
          ScheduledActionName: `offpeak-${serviceName}-${environmentSuffix}`,
          Schedule: 'cron(0 18 * * ? *)',
          Timezone: 'America/New_York',
          ScalableTargetAction: {
            MinCapacity: 2,
            MaxCapacity: 10,
          },
        },
      ]);

      // Note: Target group deregistration delay should be configured via AWS Console or CLI
      // using: aws elbv2 modify-target-group-attributes --target-group-arn <arn> --attributes Key=deregistration_delay.timeout_seconds,Value=60

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
      const albArnStr = albArn as string;
      const loadBalancerFullName = albArnStr
        .split('/')
        .slice(-2)
        .join('/')
        .replace('loadbalancer/', '');

      const requestRateMetric = new cloudwatch.Metric({
        namespace: 'AWS/ApplicationELB',
        metricName: 'RequestCount',
        dimensionsMap: {
          LoadBalancer: loadBalancerFullName,
        },
        statistic: 'Sum',
        period: cdk.Duration.minutes(1),
      });

      const error5xxMetric = new cloudwatch.Metric({
        namespace: 'AWS/ApplicationELB',
        metricName: 'HTTPCode_Target_5XX_Count',
        dimensionsMap: {
          LoadBalancer: loadBalancerFullName,
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
