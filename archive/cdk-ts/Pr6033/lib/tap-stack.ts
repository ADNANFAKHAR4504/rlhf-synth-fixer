import * as cdk from 'aws-cdk-lib';
import * as applicationautoscaling from 'aws-cdk-lib/aws-applicationautoscaling';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as cloudwatch_actions from 'aws-cdk-lib/aws-cloudwatch-actions';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as custom_resources from 'aws-cdk-lib/custom-resources';
import { Construct } from 'constructs';

interface TapStackProps extends cdk.StackProps {
  environmentSuffix?: string;
  clusterName?: string;
  serviceNames?: string[];
  albArn?: string;
  targetGroupArns?: string[];
  vpcId?: string;
  containerImage?: string;
  containerPort?: number;
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

    const vpcId = props?.vpcId || this.node.tryGetContext('vpcId') || undefined;

    const containerImage =
      props?.containerImage ||
      this.node.tryGetContext('containerImage') ||
      'public.ecr.aws/aws-containers/hello-app-runner:latest';

    const containerPort =
      props?.containerPort || this.node.tryGetContext('containerPort') || 8000;

    cdk.Tags.of(this).add('Service', 'FinancialServices');
    cdk.Tags.of(this).add('Environment', environmentSuffix);

    // Get VPC from provided VPC ID or create cluster with new VPC for test environment
    let vpc: ec2.IVpc | undefined;
    if (vpcId) {
      vpc = ec2.Vpc.fromLookup(this, 'Vpc', {
        vpcId: vpcId,
      });
    }

    // Reference existing ECS cluster or create it for test environment
    let cluster: ecs.ICluster;
    if (vpc) {
      // If VPC is available, we can properly reference the cluster
      cluster = ecs.Cluster.fromClusterAttributes(this, 'ExistingCluster', {
        clusterName: clusterName,
        vpc: vpc,
        securityGroups: [],
      });
    } else {
      // For test environment without VPC, create a new cluster
      // Note: This requires VPC, so we'll create a basic VPC for test
      const testVpc = new ec2.Vpc(this, 'TestVpc', {
        maxAzs: 3,
        natGateways: 1,
      });
      vpc = testVpc;

      cluster = new ecs.Cluster(this, 'Cluster', {
        clusterName: clusterName,
        vpc: testVpc,
      });

      cdk.Tags.of(cluster).add('Service', 'FinancialServices');
      cdk.Tags.of(cluster).add('Environment', environmentSuffix);
    }

    // Reference or create ALB
    let alb: elbv2.IApplicationLoadBalancer | undefined;
    let albSecurityGroup: ec2.ISecurityGroup | undefined;
    let albDnsName: string | undefined;
    if (albArn) {
      // For existing ALB, reference it by ARN
      // Note: fromApplicationLoadBalancerAttributes requires securityGroupId and loadBalancerDnsName
      // For test environment, we'll create a new ALB if VPC is available
      // Otherwise, ALB operations will be skipped
      if (vpc) {
        // Extract DNS name from ARN or use placeholder
        // When referencing existing ALB, DNS name should be looked up or provided
        const albArnStr = albArn as string;
        const loadBalancerFullName = albArnStr
          .split('/')
          .slice(-2)
          .join('/')
          .replace('loadbalancer/', '');
        // Use a placeholder DNS name format for referenced ALBs
        // In real scenarios, this should be looked up from AWS
        albDnsName = `${loadBalancerFullName}.elb.amazonaws.com`;

        alb =
          elbv2.ApplicationLoadBalancer.fromApplicationLoadBalancerAttributes(
            this,
            'ExistingALB',
            {
              loadBalancerArn: albArnStr,
              securityGroupId: 'sg-placeholder', // Placeholder - actual SG will be looked up at runtime
              loadBalancerDnsName: albDnsName,
            }
          );
      }
    } else if (vpc) {
      // Create ALB for test environment if VPC is available
      albSecurityGroup = new ec2.SecurityGroup(this, 'ALBSecurityGroup', {
        vpc: vpc,
        description: 'Security group for ALB',
        allowAllOutbound: true,
      });

      albSecurityGroup.addIngressRule(
        ec2.Peer.anyIpv4(),
        ec2.Port.tcp(80),
        'Allow HTTP from anywhere'
      );

      alb = new elbv2.ApplicationLoadBalancer(this, 'ALB', {
        vpc: vpc,
        internetFacing: true,
        securityGroup: albSecurityGroup,
      });

      cdk.Tags.of(alb).add('Service', 'FinancialServices');
      cdk.Tags.of(alb).add('Environment', environmentSuffix);
    }

    // Create security group for ECS tasks if VPC is available
    let taskSecurityGroup: ec2.ISecurityGroup | undefined;
    if (vpc) {
      taskSecurityGroup = new ec2.SecurityGroup(this, 'TaskSecurityGroup', {
        vpc: vpc,
        description: 'Security group for ECS tasks',
        allowAllOutbound: true,
      });

      // Allow traffic from ALB security group specifically
      if (albSecurityGroup) {
        taskSecurityGroup.addIngressRule(
          ec2.Peer.securityGroupId(albSecurityGroup.securityGroupId),
          ec2.Port.tcp(containerPort),
          'Allow traffic from ALB security group'
        );
      } else if (alb) {
        // Fallback: allow from VPC CIDR if ALB security group not available
        taskSecurityGroup.addIngressRule(
          ec2.Peer.ipv4(vpc.vpcCidrBlock),
          ec2.Port.tcp(containerPort),
          'Allow traffic from VPC (ALB)'
        );
      }

      cdk.Tags.of(taskSecurityGroup).add('Service', 'FinancialServices');
      cdk.Tags.of(taskSecurityGroup).add('Environment', environmentSuffix);
    }

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
      inlinePolicies: {
        ScalingPolicy: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                'ecs:DescribeServices',
                'ecs:UpdateService',
                'ecs:DescribeTasks',
                'ecs:ListTasks',
                'cloudwatch:PutMetricAlarm',
                'cloudwatch:DescribeAlarms',
                'cloudwatch:GetMetricStatistics',
                'cloudwatch:PutMetricData',
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

    // Note: Fargate capacity providers (FARGATE and FARGATE_SPOT) are enabled by default
    // on ECS clusters. No need to explicitly enable them.

    // Create a shared target group for all services in test environment
    let sharedTargetGroup: elbv2.IApplicationTargetGroup | undefined;
    let listener: elbv2.ApplicationListener | undefined;
    if (alb && !albArn && vpc) {
      // Create a single target group for all services in test environment
      sharedTargetGroup = new elbv2.ApplicationTargetGroup(
        this,
        'SharedTargetGroup',
        {
          vpc: vpc,
          port: containerPort,
          protocol: elbv2.ApplicationProtocol.HTTP,
          targetType: elbv2.TargetType.IP,
          healthCheck: {
            enabled: true,
            path: '/',
            interval: cdk.Duration.seconds(30),
            timeout: cdk.Duration.seconds(20),
            healthyThresholdCount: 2,
            unhealthyThresholdCount: 5,
            healthyHttpCodes: '200-499',
          },
          deregistrationDelay: cdk.Duration.seconds(60),
        }
      );

      cdk.Tags.of(sharedTargetGroup).add('Service', 'FinancialServices');
      cdk.Tags.of(sharedTargetGroup).add('Environment', environmentSuffix);

      // Create listener with the shared target group
      listener = alb.addListener('DefaultListener', {
        port: 80,
        protocol: elbv2.ApplicationProtocol.HTTP,
        defaultTargetGroups: [sharedTargetGroup],
      });
      cdk.Tags.of(listener).add('Service', 'FinancialServices');
      cdk.Tags.of(listener).add('Environment', environmentSuffix);
    }

    serviceNames.forEach((serviceName: string, index: number) => {
      // Create task definition
      const taskDefinition = new ecs.FargateTaskDefinition(
        this,
        `TaskDefinition${index}`,
        {
          family: serviceName,
          cpu: 256,
          memoryLimitMiB: 512,
        }
      );

      const container = taskDefinition.addContainer(`Container${index}`, {
        image: ecs.ContainerImage.fromRegistry(containerImage),
        logging: ecs.LogDrivers.awsLogs({
          streamPrefix: serviceName,
        }),
      });

      container.addPortMappings({
        containerPort: containerPort,
        protocol: ecs.Protocol.TCP,
      });

      cdk.Tags.of(taskDefinition).add('Service', 'FinancialServices');
      cdk.Tags.of(taskDefinition).add('Environment', environmentSuffix);

      // Use shared target group for test environment, or reference provided target groups
      let targetGroup: elbv2.IApplicationTargetGroup | undefined;
      if (targetGroupArns && targetGroupArns[index]) {
        // Use provided target group ARN
        targetGroup = elbv2.ApplicationTargetGroup.fromTargetGroupAttributes(
          this,
          `TargetGroup${index}`,
          {
            targetGroupArn: targetGroupArns[index],
          }
        );
      } else if (sharedTargetGroup) {
        // Use shared target group for test environment
        targetGroup = sharedTargetGroup;
      }

      // Create Fargate service with capacity provider strategy
      const serviceProps: ecs.FargateServiceProps = {
        cluster: cluster,
        serviceName: serviceName,
        taskDefinition: taskDefinition,
        desiredCount: 2,
        capacityProviderStrategies: [
          {
            capacityProvider: 'FARGATE',
            weight: 1,
            base: 1, // Maintain at least one on-demand task
          },
          {
            capacityProvider: 'FARGATE_SPOT',
            weight: 3,
            base: 0, // No base requirement for Spot
          },
        ],
        healthCheckGracePeriod: cdk.Duration.seconds(300),
        // Add network configuration if VPC is available
        ...(vpc && {
          vpcSubnets: {
            subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
          },
          securityGroups: taskSecurityGroup ? [taskSecurityGroup] : undefined,
          assignPublicIp: false,
        }),
        // Deployment configuration for stability
        minHealthyPercent: 50,
        maxHealthyPercent: 200,
        circuitBreaker: {
          enable: true,
          rollback: true,
        },
      };

      const service = new ecs.FargateService(
        this,
        `Service${index}`,
        serviceProps
      );

      if (targetGroup) {
        // Ensure target group is ready before service attaches to it
        service.node.addDependency(targetGroup);
        service.attachToApplicationTargetGroup(targetGroup);
      }

      cdk.Tags.of(service).add('Service', 'FinancialServices');
      cdk.Tags.of(service).add('Environment', environmentSuffix);

      // Create scalable target for the service
      // Must depend on the service being created first
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

      // Ensure scalable target depends on the service being created
      scalableTarget.node.addDependency(service);

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

      const stepScalingMetric = new cloudwatch.Metric({
        namespace: 'AWS/ECS',
        metricName: 'CPUUtilization',
        dimensionsMap: {
          ServiceName: serviceName,
          ClusterName: clusterName,
        },
        statistic: 'Average',
        period: cdk.Duration.minutes(1),
      });

      const stepScalingAlarm = new cloudwatch.Alarm(
        this,
        `StepScalingAlarm${index}`,
        {
          alarmName: `ecs-${serviceName}-step-scaling-${environmentSuffix}`,
          metric: stepScalingMetric,
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
          metric: stepScalingMetric,
          adjustmentType:
            applicationautoscaling.AdjustmentType.CHANGE_IN_CAPACITY,
          cooldown: cdk.Duration.seconds(60),
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

      // Connect alarm to step scaling policy
      stepScalingAlarm.addAlarmAction(
        new cloudwatch_actions.SnsAction(snsTopic)
      );

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

    // CloudFormation outputs for integration tests
    new cdk.CfnOutput(this, 'ClusterName', {
      value: clusterName,
      description: 'ECS Cluster Name',
    });

    new cdk.CfnOutput(this, 'ServiceNames', {
      value: serviceNames.join(','),
      description: 'Comma-separated list of ECS service names',
    });

    if (alb) {
      // Use stored DNS name for referenced ALBs, or get from created ALB
      const dnsName = albDnsName || alb.loadBalancerDnsName;
      if (dnsName) {
        new cdk.CfnOutput(this, 'AlbDns', {
          value: dnsName,
          description: 'Application Load Balancer DNS Name',
        });
      }
    }

    new cdk.CfnOutput(this, 'CostAnomalyTopicArn', {
      value: snsTopic.topicArn,
      description: 'SNS Topic ARN for Cost Anomaly Detection',
    });
  }
}
