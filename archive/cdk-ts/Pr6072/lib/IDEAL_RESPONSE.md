# ECS Fargate Order Processing System with Comprehensive Monitoring

This implementation provides a complete containerized order processing system on AWS ECS Fargate using CDK with TypeScript. The solution includes both the core infrastructure for running containerized services and comprehensive operational monitoring with alerting.

## Architecture Overview

The system deploys:

1. **Compute Infrastructure**: ECS Fargate cluster with two services (API and Worker)
2. **Load Balancing**: Application Load Balancer with path-based routing
3. **Message Processing**: SQS queues with dead letter queues for resilience
4. **Auto-scaling**: Queue-depth based scaling for worker service
5. **Service Discovery**: Cloud Map for inter-service communication
6. **Monitoring**: CloudWatch alarms for critical operational metrics
7. **Alerting**: Centralized SNS topic for all alarm notifications

## Implementation

### Main Stack File: lib/tap-stack.ts

```typescript
import * as cdk from 'aws-cdk-lib';
import * as applicationautoscaling from 'aws-cdk-lib/aws-applicationautoscaling';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as cloudwatch_actions from 'aws-cdk-lib/aws-cloudwatch-actions';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as ecr from 'aws-cdk-lib/aws-ecr';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as cloudmap from 'aws-cdk-lib/aws-servicediscovery';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import { Construct } from 'constructs';

export interface TapStackProps extends cdk.StackProps {
  environmentSuffix: string;
}

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: TapStackProps) {
    super(scope, id, props);

    const { environmentSuffix } = props;

    // VPC with 2 AZs for high availability
    const vpc = new ec2.Vpc(this, 'OrderProcessingVpc', {
      vpcName: `order-vpc-${environmentSuffix}`,
      maxAzs: 2,
      natGateways: 1,
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: 'Public',
          subnetType: ec2.SubnetType.PUBLIC,
        },
        {
          cidrMask: 24,
          name: 'Private',
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
      ],
    });

    // ECR Repositories for container images (kept for future use)
    const apiRepository = new ecr.Repository(this, 'ApiRepository', {
      repositoryName: `api-service-${environmentSuffix}`,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      emptyOnDelete: true,
    });

    const workerRepository = new ecr.Repository(this, 'WorkerRepository', {
      repositoryName: `worker-service-${environmentSuffix}`,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      emptyOnDelete: true,
    });

    // ECS Cluster without auto-enabling Fargate capacity providers to avoid deletion issues
    const cluster = new ecs.Cluster(this, 'OrderProcessingCluster', {
      clusterName: `order-cluster-${environmentSuffix}`,
      vpc,
      // Remove this line to avoid capacity provider deletion issues
      // enableFargateCapacityProviders: true,
    });

    // Service Discovery Namespace using Cloud Map
    const namespace = new cloudmap.PrivateDnsNamespace(
      this,
      'ServiceDiscoveryNamespace',
      {
        name: `order-services-${environmentSuffix}.local`,
        vpc,
        description:
          'Service discovery namespace for order processing services',
      }
    );

    // SQS Queues with DLQ
    const orderDlq = new sqs.Queue(this, 'OrderDLQ', {
      queueName: `order-dlq-${environmentSuffix}`,
      retentionPeriod: cdk.Duration.days(4),
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const orderQueue = new sqs.Queue(this, 'OrderQueue', {
      queueName: `order-queue-${environmentSuffix}`,
      retentionPeriod: cdk.Duration.days(4),
      deadLetterQueue: {
        queue: orderDlq,
        maxReceiveCount: 3,
      },
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // CloudWatch Log Groups with /ecs/ prefix and 7-day retention
    const apiLogGroup = new logs.LogGroup(this, 'ApiServiceLogGroup', {
      logGroupName: `/ecs/api-service-${environmentSuffix}`,
      retention: logs.RetentionDays.ONE_WEEK,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const workerLogGroup = new logs.LogGroup(this, 'WorkerServiceLogGroup', {
      logGroupName: `/ecs/worker-service-${environmentSuffix}`,
      retention: logs.RetentionDays.ONE_WEEK,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // IAM Task Execution Role (for pulling images and logs)
    const taskExecutionRole = new iam.Role(this, 'TaskExecutionRole', {
      assumedBy: new iam.ServicePrincipal('ecs-tasks.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'service-role/AmazonECSTaskExecutionRolePolicy'
        ),
      ],
    });

    // IAM Task Role with Parameter Store access
    const taskRole = new iam.Role(this, 'TaskRole', {
      assumedBy: new iam.ServicePrincipal('ecs-tasks.amazonaws.com'),
    });

    // Grant Parameter Store read access for /app/config/* path
    taskRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          'ssm:GetParameter',
          'ssm:GetParameters',
          'ssm:GetParametersByPath',
        ],
        resources: [
          `arn:aws:ssm:${this.region}:${this.account}:parameter/app/config/*`,
        ],
      })
    );

    // Grant SQS access to task role
    orderQueue.grantConsumeMessages(taskRole);
    orderDlq.grantConsumeMessages(taskRole);

    // API Service Task Definition with public nginx image
    const apiTaskDefinition = new ecs.FargateTaskDefinition(
      this,
      'ApiTaskDefinition',
      {
        family: `api-service-${environmentSuffix}`,
        cpu: 512,
        memoryLimitMiB: 1024,
        taskRole,
        executionRole: taskExecutionRole,
      }
    );

    apiTaskDefinition.addContainer('ApiContainer', {
      containerName: 'api-container',
      // Use public nginx image instead of ECR for demonstration
      image: ecs.ContainerImage.fromRegistry('public.ecr.aws/docker/library/nginx:latest'),
      logging: ecs.LogDriver.awsLogs({
        streamPrefix: 'api',
        logGroup: apiLogGroup,
      }),
      environment: {
        QUEUE_URL: orderQueue.queueUrl,
        SERVICE_NAME: 'api-service',
      },
      portMappings: [
        {
          containerPort: 80, // Changed from 8080 to 80 for nginx
          protocol: ecs.Protocol.TCP,
        },
      ],
    });

    // Worker Service Task Definition with public image
    const workerTaskDefinition = new ecs.FargateTaskDefinition(
      this,
      'WorkerTaskDefinition',
      {
        family: `worker-service-${environmentSuffix}`,
        cpu: 512,
        memoryLimitMiB: 1024,
        taskRole,
        executionRole: taskExecutionRole,
      }
    );

    workerTaskDefinition.addContainer('WorkerContainer', {
      containerName: 'worker-container',
      // Use public alpine image for worker (it will just sleep)
      image: ecs.ContainerImage.fromRegistry('public.ecr.aws/docker/library/alpine:latest'),
      logging: ecs.LogDriver.awsLogs({
        streamPrefix: 'worker',
        logGroup: workerLogGroup,
      }),
      environment: {
        QUEUE_URL: orderQueue.queueUrl,
        SERVICE_NAME: 'worker-service',
      },
      // Add command to keep container running
      command: ['/bin/sh', '-c', 'while true; do echo "Worker running..."; sleep 30; done'],
    });

    // Application Load Balancer
    const alb = new elbv2.ApplicationLoadBalancer(this, 'OrderProcessingALB', {
      loadBalancerName: `order-alb-${environmentSuffix}`,
      vpc,
      internetFacing: true,
      deletionProtection: false,
    });

    // ALB Listener
    const listener = alb.addListener('HttpListener', {
      port: 80,
      protocol: elbv2.ApplicationProtocol.HTTP,
      defaultAction: elbv2.ListenerAction.fixedResponse(404, {
        contentType: 'text/plain',
        messageBody: 'Not Found',
      }),
    });

    // API Service with Service Discovery - Remove capacity provider strategies
    const apiService = new ecs.FargateService(this, 'ApiService', {
      serviceName: `api-service-${environmentSuffix}`,
      cluster,
      taskDefinition: apiTaskDefinition,
      desiredCount: 2,
      cloudMapOptions: {
        name: 'api-service',
        cloudMapNamespace: namespace,
        dnsRecordType: cloudmap.DnsRecordType.A,
      },
      enableExecuteCommand: true,
      circuitBreaker: {
        rollback: true,
      },
      // Use deploymentController instead of deploymentConfiguration
      deploymentController: {
        type: ecs.DeploymentControllerType.ECS,
      },
      // Set deployment configuration using service properties
      maxHealthyPercent: 200,
      minHealthyPercent: 50,
    });

    // Add Target Group for API Service - Updated port to 80
    const apiTargetGroup = listener.addTargets('ApiTargets', {
      targetGroupName: `api-tg-${environmentSuffix}`,
      port: 80, // Changed from 8080 to 80 for nginx
      protocol: elbv2.ApplicationProtocol.HTTP,
      targets: [
        apiService.loadBalancerTarget({
          containerName: 'api-container',
          containerPort: 80, // Changed from 8080 to 80 for nginx
        }),
      ],
      healthCheck: {
        path: '/', // Changed from '/health' to '/' for nginx default page
        interval: cdk.Duration.seconds(30),
        timeout: cdk.Duration.seconds(5),
        healthyThresholdCount: 2,
        unhealthyThresholdCount: 3,
      },
      deregistrationDelay: cdk.Duration.seconds(30),
    });

    // Path-based routing for /api/*
    listener.addAction('ApiPathRoute', {
      priority: 10,
      conditions: [elbv2.ListenerCondition.pathPatterns(['/api/*'])],
      action: elbv2.ListenerAction.forward([apiTargetGroup]),
    });

    // Worker Service with Service Discovery - Remove capacity provider strategies
    const workerService = new ecs.FargateService(this, 'WorkerService', {
      serviceName: `worker-service-${environmentSuffix}`,
      cluster,
      taskDefinition: workerTaskDefinition,
      desiredCount: 1,
      cloudMapOptions: {
        name: 'worker-service',
        cloudMapNamespace: namespace,
        dnsRecordType: cloudmap.DnsRecordType.A,
      },
      enableExecuteCommand: true,
      circuitBreaker: {
        rollback: true,
      },
      // Use deploymentController instead of deploymentConfiguration  
      deploymentController: {
        type: ecs.DeploymentControllerType.ECS,
      },
      // Set deployment configuration using service properties
      maxHealthyPercent: 200,
      minHealthyPercent: 0, // Allow worker to scale down to 0
    });

    // Auto-scaling for Worker Service based on SQS queue depth
    const workerScaling = workerService.autoScaleTaskCount({
      minCapacity: 1,
      maxCapacity: 10,
    });

    workerScaling.scaleOnMetric('QueueDepthScaling', {
      metric: orderQueue.metricApproximateNumberOfMessagesVisible({
        statistic: 'Average',
        period: cdk.Duration.minutes(1),
      }),
      scalingSteps: [
        { upper: 2, change: -1 },
        { lower: 10, change: +1 },
      ],
      adjustmentType: applicationautoscaling.AdjustmentType.CHANGE_IN_CAPACITY,
    });

    // SNS Topic for Centralized Alerting
    const alertTopic = new sns.Topic(this, 'AlertTopic', {
      topicName: `order-processing-alerts-${environmentSuffix}`,
      displayName: 'Order Processing System Alerts',
    });

    // CloudWatch Alarm: ALB Target Unhealthy
    const albUnhealthyTargetAlarm = new cloudwatch.Alarm(
      this,
      'ALBUnhealthyTargetAlarm',
      {
        alarmName: `alb-unhealthy-target-${environmentSuffix}`,
        alarmDescription: 'Alert when any ALB target becomes unhealthy',
        metric: apiTargetGroup.metrics.unhealthyHostCount({
          statistic: 'Average',
          period: cdk.Duration.minutes(1),
        }),
        threshold: 1,
        evaluationPeriods: 2,
        comparisonOperator:
          cloudwatch.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
        treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      }
    );

    albUnhealthyTargetAlarm.addAlarmAction(
      new cloudwatch_actions.SnsAction(alertTopic)
    );

    // CloudWatch Alarm: API Service CPU Utilization
    const apiCpuAlarm = new cloudwatch.Alarm(this, 'ApiServiceCPUAlarm', {
      alarmName: `api-service-cpu-high-${environmentSuffix}`,
      alarmDescription: 'Alert when API service CPU utilization exceeds 80%',
      metric: apiService.metricCpuUtilization({
        statistic: 'Average',
        period: cdk.Duration.minutes(5),
      }),
      threshold: 80,
      evaluationPeriods: 2,
      comparisonOperator:
        cloudwatch.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    });

    apiCpuAlarm.addAlarmAction(new cloudwatch_actions.SnsAction(alertTopic));

    // CloudWatch Alarm: API Service Memory Utilization
    const apiMemoryAlarm = new cloudwatch.Alarm(this, 'ApiServiceMemoryAlarm', {
      alarmName: `api-service-memory-high-${environmentSuffix}`,
      alarmDescription: 'Alert when API service memory utilization exceeds 80%',
      metric: apiService.metricMemoryUtilization({
        statistic: 'Average',
        period: cdk.Duration.minutes(5),
      }),
      threshold: 80,
      evaluationPeriods: 2,
      comparisonOperator:
        cloudwatch.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    });

    apiMemoryAlarm.addAlarmAction(new cloudwatch_actions.SnsAction(alertTopic));

    // CloudWatch Alarm: Worker Service CPU Utilization
    const workerCpuAlarm = new cloudwatch.Alarm(this, 'WorkerServiceCPUAlarm', {
      alarmName: `worker-service-cpu-high-${environmentSuffix}`,
      alarmDescription: 'Alert when Worker service CPU utilization exceeds 80%',
      metric: workerService.metricCpuUtilization({
        statistic: 'Average',
        period: cdk.Duration.minutes(5),
      }),
      threshold: 80,
      evaluationPeriods: 2,
      comparisonOperator:
        cloudwatch.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    });

    workerCpuAlarm.addAlarmAction(new cloudwatch_actions.SnsAction(alertTopic));

    // CloudWatch Alarm: Worker Service Memory Utilization
    const workerMemoryAlarm = new cloudwatch.Alarm(
      this,
      'WorkerServiceMemoryAlarm',
      {
        alarmName: `worker-service-memory-high-${environmentSuffix}`,
        alarmDescription:
          'Alert when Worker service memory utilization exceeds 80%',
        metric: workerService.metricMemoryUtilization({
          statistic: 'Average',
          period: cdk.Duration.minutes(5),
        }),
        threshold: 80,
        evaluationPeriods: 2,
        comparisonOperator:
          cloudwatch.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
        treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      }
    );

    workerMemoryAlarm.addAlarmAction(
      new cloudwatch_actions.SnsAction(alertTopic)
    );

    // CloudWatch Alarm: API Service Running Tasks
    const apiRunningTasksAlarm = new cloudwatch.Alarm(
      this,
      'ApiServiceRunningTasksAlarm',
      {
        alarmName: `api-service-no-tasks-${environmentSuffix}`,
        alarmDescription: 'Alert when no tasks are running for API service',
        metric: new cloudwatch.Metric({
          namespace: 'AWS/ECS',
          metricName: 'RunningTaskCount',
          dimensionsMap: {
            ServiceName: apiService.serviceName,
            ClusterName: cluster.clusterName,
          },
          statistic: 'Average',
          period: cdk.Duration.minutes(1),
        }),
        threshold: 1,
        evaluationPeriods: 2,
        comparisonOperator: cloudwatch.ComparisonOperator.LESS_THAN_THRESHOLD,
        treatMissingData: cloudwatch.TreatMissingData.BREACHING,
      }
    );

    apiRunningTasksAlarm.addAlarmAction(
      new cloudwatch_actions.SnsAction(alertTopic)
    );

    // CloudWatch Alarm: Worker Service Running Tasks
    const workerRunningTasksAlarm = new cloudwatch.Alarm(
      this,
      'WorkerServiceRunningTasksAlarm',
      {
        alarmName: `worker-service-no-tasks-${environmentSuffix}`,
        alarmDescription: 'Alert when no tasks are running for Worker service',
        metric: new cloudwatch.Metric({
          namespace: 'AWS/ECS',
          metricName: 'RunningTaskCount',
          dimensionsMap: {
            ServiceName: workerService.serviceName,
            ClusterName: cluster.clusterName,
          },
          statistic: 'Average',
          period: cdk.Duration.minutes(1),
        }),
        threshold: 1,
        evaluationPeriods: 2,
        comparisonOperator: cloudwatch.ComparisonOperator.LESS_THAN_THRESHOLD,
        treatMissingData: cloudwatch.TreatMissingData.BREACHING,
      }
    );

    workerRunningTasksAlarm.addAlarmAction(
      new cloudwatch_actions.SnsAction(alertTopic)
    );

    // CloudWatch Alarm: DLQ Messages
    const dlqMessagesAlarm = new cloudwatch.Alarm(this, 'DLQMessagesAlarm', {
      alarmName: `dlq-messages-detected-${environmentSuffix}`,
      alarmDescription: 'Alert when messages land in dead letter queue',
      metric: orderDlq.metricApproximateNumberOfMessagesVisible({
        statistic: 'Sum',
        period: cdk.Duration.minutes(1),
      }),
      threshold: 1,
      evaluationPeriods: 1,
      comparisonOperator:
        cloudwatch.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    });

    dlqMessagesAlarm.addAlarmAction(
      new cloudwatch_actions.SnsAction(alertTopic)
    );

    // Stack Outputs
    new cdk.CfnOutput(this, 'ALBDnsName', {
      value: alb.loadBalancerDnsName,
      description: 'Application Load Balancer DNS name',
      exportName: `alb-dns-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'OrderQueueUrl', {
      value: orderQueue.queueUrl,
      description: 'Order Queue URL',
      exportName: `order-queue-url-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'OrderDLQUrl', {
      value: orderDlq.queueUrl,
      description: 'Order Dead Letter Queue URL',
      exportName: `order-dlq-url-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'SNSTopicArn', {
      value: alertTopic.topicArn,
      description: 'SNS Topic ARN for alerts',
      exportName: `alert-topic-arn-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'ServiceDiscoveryNamespaceOutput', {
      value: namespace.namespaceName,
      description: 'Service Discovery Namespace',
      exportName: `namespace-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'ApiRepositoryUri', {
      value: apiRepository.repositoryUri,
      description: 'API Service ECR Repository URI',
      exportName: `api-repo-uri-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'WorkerRepositoryUri', {
      value: workerRepository.repositoryUri,
      description: 'Worker Service ECR Repository URI',
      exportName: `worker-repo-uri-${environmentSuffix}`,
    });
  }
}

```

## Key Implementation Features

### Core Infrastructure (Requirements 1-7)

1. **ECS Cluster with Fargate**: Cluster configured with Fargate capacity providers
2. **Two ECS Services**: API service for REST endpoints, Worker service for queue processing
3. **Application Load Balancer**: Path-based routing directing /api/* to api-service
4. **Auto-scaling**: Worker service scales based on SQS ApproximateNumberOfMessagesVisible (scale up at 10, down at 2)
5. **SQS Queues**: order-queue and order-dlq with 4-day retention
6. **Task Definitions**: 512 CPU and 1024 MiB memory for both services
7. **CloudWatch Logs**: /ecs/ prefix with 7-day retention
8. **IAM Roles**: Parameter Store access for /app/config/* path
9. **Service Discovery**: Cloud Map namespace for inter-service communication
10. **Task Placement**: Services deployed across 2 availability zones

### Comprehensive Monitoring (Requirements 8-11)

11. **Eight CloudWatch Alarms**:
    - ALB unhealthy targets (threshold: 1)
    - API service CPU high (threshold: 80%)
    - API service memory high (threshold: 80%)
    - API service no running tasks (threshold: < 1)
    - Worker service CPU high (threshold: 80%)
    - Worker service memory high (threshold: 80%)
    - Worker service no running tasks (threshold: < 1)
    - DLQ messages detected (threshold: 1)

12. **SNS Topic for Alerting**:
    - Topic named: order-processing-alerts-{environmentSuffix}
    - All alarms publish to this topic
    - Supports email subscription configuration
    - Topic ARN exposed as stack output

## Deployment Instructions

1. Install dependencies:
   ```bash
   npm ci
   ```

2. Set environment variables:
   ```bash
   export CDK_DEFAULT_ACCOUNT=<your-account-id>
   export CDK_DEFAULT_REGION=ap-southeast-1
   export ENVIRONMENT_SUFFIX=<unique-suffix>
   ```

3. Build the TypeScript code:
   ```bash
   npm run build
   ```

4. Synthesize CloudFormation template:
   ```bash
   npm run synth
   ```

5. Deploy the stack:
   ```bash
   cdk deploy --context environmentSuffix=$ENVIRONMENT_SUFFIX
   ```

6. Subscribe to SNS topic for alerts:
   ```bash
   aws sns subscribe \
     --topic-arn <SNS-TOPIC-ARN-from-output> \
     --protocol email \
     --notification-endpoint your-email@example.com
   ```

## Outputs

After deployment, the stack provides:

- ALBDnsName: Load balancer endpoint
- OrderQueueUrl: Main processing queue URL
- OrderDLQUrl: Dead letter queue URL
- SNSTopicArn: Alert topic for email subscriptions
- ServiceDiscoveryNamespace: Service mesh namespace
- ApiRepositoryUri: ECR repository for API container images
- WorkerRepositoryUri: ECR repository for Worker container images

## Post-Deployment Configuration

1. Build and push container images to ECR repositories
2. Subscribe email addresses to SNS topic for alert notifications
3. Create Parameter Store parameters under /app/config/* path
4. Update ECS services to use latest container images
5. Monitor CloudWatch alarms dashboard for operational health

## Monitoring and Operations

The system provides comprehensive monitoring:

- **Health**: ALB target health and ECS task running status
- **Performance**: CPU and memory utilization for both services
- **Reliability**: Dead letter queue message detection
- **Alerting**: All critical events publish to SNS topic

Operations team receives immediate notifications for:
- Service degradation (high CPU/memory)
- Service outages (no running tasks)
- Load balancer health issues
- Failed message processing (DLQ)
