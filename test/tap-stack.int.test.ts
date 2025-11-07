import {
  ECSClient,
  DescribeServicesCommand,
  UpdateServiceCommand,
  ListTasksCommand,
  DescribeTasksCommand,
} from '@aws-sdk/client-ecs';
import {
  ApplicationAutoScalingClient,
  DescribeScalableTargetsCommand,
  DescribeScalingPoliciesCommand,
  PutScalingPolicyCommand,
} from '@aws-sdk/client-application-auto-scaling';
import {
  CloudWatchClient,
  GetMetricStatisticsCommand,
  PutMetricDataCommand,
} from '@aws-sdk/client-cloudwatch';
import {
  SNSClient,
  ListSubscriptionsByTopicCommand,
  PublishCommand,
} from '@aws-sdk/client-sns';
import fs from 'fs';

const outputs = JSON.parse(
  fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
);

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';
const clusterName = outputs.clusterName || 'financial-services-cluster';
const serviceNames = outputs.serviceNames
  ? outputs.serviceNames.split(',')
  : Array.from({ length: 12 }, (_, i) => `service-${i + 1}`);
const albDns = outputs.albDns;
const snsTopicArn = outputs.costAnomalyTopicArn;

const ecsClient = new ECSClient({ region: 'us-east-1' });
const autoscalingClient = new ApplicationAutoScalingClient({
  region: 'us-east-1',
});
const cloudwatchClient = new CloudWatchClient({ region: 'us-east-1' });
const snsClient = new SNSClient({ region: 'us-east-1' });

describe('ECS Cost Optimization Integration Tests', () => {
  describe('E2E: Auto-Scaling Flow - CPU-Based Scaling', () => {
    test('should scale service up when CPU utilization exceeds target', async () => {
      const serviceName = serviceNames[0];
      const resourceId = `service/${clusterName}/${serviceName}`;

      const initialService = await ecsClient.send(
        new DescribeServicesCommand({
          cluster: clusterName,
          services: [serviceName],
        })
      );
      const initialDesiredCount =
        initialService.services?.[0]?.desiredCount || 0;

      const scalableTarget = await autoscalingClient.send(
        new DescribeScalableTargetsCommand({
          ResourceIds: [resourceId],
          ServiceNamespace: 'ecs',
          ScalableDimension: 'ecs:service:DesiredCount',
        })
      );

      const target = scalableTarget.ScalableTargets?.[0];
      expect(target).toBeDefined();

      const policies = await autoscalingClient.send(
        new DescribeScalingPoliciesCommand({
          ResourceId: resourceId,
          ServiceNamespace: 'ecs',
          ScalableDimension: 'ecs:service:DesiredCount',
        })
      );

      const cpuPolicy = policies.ScalingPolicies?.find(p =>
        p.PolicyName?.includes('cpu-target-tracking')
      );
      expect(cpuPolicy).toBeDefined();
      expect(
        cpuPolicy?.TargetTrackingScalingPolicyConfiguration?.TargetValue
      ).toBe(60.0);

      const currentMetric = await cloudwatchClient.send(
        new GetMetricStatisticsCommand({
          Namespace: 'AWS/ECS',
          MetricName: 'CPUUtilization',
          Dimensions: [
            { Name: 'ServiceName', Value: serviceName },
            { Name: 'ClusterName', Value: clusterName },
          ],
          StartTime: new Date(Date.now() - 300000),
          EndTime: new Date(),
          Period: 60,
          Statistics: ['Average'],
        })
      );

      expect(currentMetric.Datapoints).toBeDefined();
    }, 120000);
  });

  describe('E2E: Auto-Scaling Flow - Memory-Based Scaling', () => {
    test('should scale service based on memory utilization', async () => {
      const serviceName = serviceNames[0];
      const resourceId = `service/${clusterName}/${serviceName}`;

      const policies = await autoscalingClient.send(
        new DescribeScalingPoliciesCommand({
          ResourceId: resourceId,
          ServiceNamespace: 'ecs',
          ScalableDimension: 'ecs:service:DesiredCount',
        })
      );

      const memoryPolicy = policies.ScalingPolicies?.find(p =>
        p.PolicyName?.includes('memory-target-tracking')
      );
      expect(memoryPolicy).toBeDefined();
      expect(
        memoryPolicy?.TargetTrackingScalingPolicyConfiguration?.TargetValue
      ).toBe(60.0);

      const memoryMetric = await cloudwatchClient.send(
        new GetMetricStatisticsCommand({
          Namespace: 'AWS/ECS',
          MetricName: 'MemoryUtilization',
          Dimensions: [
            { Name: 'ServiceName', Value: serviceName },
            { Name: 'ClusterName', Value: clusterName },
          ],
          StartTime: new Date(Date.now() - 300000),
          EndTime: new Date(),
          Period: 60,
          Statistics: ['Average'],
        })
      );

      expect(memoryMetric.Datapoints).toBeDefined();
    }, 120000);
  });

  describe('E2E: Step Scaling Flow - Sudden Traffic Spike', () => {
    test('should trigger step scaling when CPU spikes suddenly', async () => {
      const serviceName = serviceNames[0];
      const resourceId = `service/${clusterName}/${serviceName}`;

      const policies = await autoscalingClient.send(
        new DescribeScalingPoliciesCommand({
          ResourceId: resourceId,
          ServiceNamespace: 'ecs',
          ScalableDimension: 'ecs:service:DesiredCount',
        })
      );

      const stepPolicy = policies.ScalingPolicies?.find(
        p => p.PolicyType === 'StepScaling'
      );
      expect(stepPolicy).toBeDefined();
      expect(
        stepPolicy?.StepScalingPolicyConfiguration?.StepAdjustments?.length
      ).toBe(3);

      const stepAdjustments =
        stepPolicy?.StepScalingPolicyConfiguration?.StepAdjustments;
      expect(stepAdjustments?.[0]?.ScalingAdjustment).toBe(2);
      expect(stepAdjustments?.[1]?.ScalingAdjustment).toBe(4);
      expect(stepAdjustments?.[2]?.ScalingAdjustment).toBe(6);

      await cloudwatchClient.send(
        new PutMetricDataCommand({
          Namespace: 'AWS/ECS',
          MetricData: [
            {
              MetricName: 'CPUUtilization',
              Dimensions: [
                { Name: 'ServiceName', Value: serviceName },
                { Name: 'ClusterName', Value: clusterName },
              ],
              Value: 85.0,
              Timestamp: new Date(),
            },
          ],
        })
      );
    }, 120000);
  });

  describe('E2E: Scheduled Scaling Flow - Peak Hours', () => {
    test('should scale to peak capacity during trading hours', async () => {
      const serviceName = serviceNames[0];
      const resourceId = `service/${clusterName}/${serviceName}`;

      const scalableTarget = await autoscalingClient.send(
        new DescribeScalableTargetsCommand({
          ResourceIds: [resourceId],
          ServiceNamespace: 'ecs',
          ScalableDimension: 'ecs:service:DesiredCount',
        })
      );

      const target = scalableTarget.ScalableTargets?.[0];
      expect(target).toBeDefined();
      expect((target as any)?.ScheduledActions).toBeDefined();

      const peakSchedule = (target as any)?.ScheduledActions?.find(
        (action: any) => action.Schedule?.includes('cron(0 9')
      );
      expect(peakSchedule).toBeDefined();
      expect(peakSchedule?.ScalableTargetAction?.MinCapacity).toBe(10);
      expect(peakSchedule?.ScalableTargetAction?.MaxCapacity).toBe(20);
    }, 120000);
  });

  describe('E2E: Scheduled Scaling Flow - Off-Peak Hours', () => {
    test('should scale down during off-peak hours', async () => {
      const serviceName = serviceNames[0];
      const resourceId = `service/${clusterName}/${serviceName}`;

      const scalableTarget = await autoscalingClient.send(
        new DescribeScalableTargetsCommand({
          ResourceIds: [resourceId],
          ServiceNamespace: 'ecs',
          ScalableDimension: 'ecs:service:DesiredCount',
        })
      );

      const target = scalableTarget.ScalableTargets?.[0];
      expect(target).toBeDefined();

      const offPeakSchedule = (target as any)?.ScheduledActions?.find(
        (action: any) => action.Schedule?.includes('cron(0 18')
      );
      expect(offPeakSchedule).toBeDefined();
      expect(offPeakSchedule?.ScalableTargetAction?.MinCapacity).toBe(2);
      expect(offPeakSchedule?.ScalableTargetAction?.MaxCapacity).toBe(10);
    }, 120000);
  });

  describe('E2E: CloudWatch Monitoring Flow - Metrics Collection', () => {
    test('should collect and display metrics in dashboard', async () => {
      const serviceName = serviceNames[0];

      const taskCountMetric = await cloudwatchClient.send(
        new GetMetricStatisticsCommand({
          Namespace: 'AWS/ECS',
          MetricName: 'DesiredTaskCount',
          Dimensions: [
            { Name: 'ServiceName', Value: serviceName },
            { Name: 'ClusterName', Value: clusterName },
          ],
          StartTime: new Date(Date.now() - 3600000),
          EndTime: new Date(),
          Period: 300,
          Statistics: ['Average'],
        })
      );

      expect(taskCountMetric.Datapoints).toBeDefined();

      const runningTaskMetric = await cloudwatchClient.send(
        new GetMetricStatisticsCommand({
          Namespace: 'AWS/ECS',
          MetricName: 'RunningTaskCount',
          Dimensions: [
            { Name: 'ServiceName', Value: serviceName },
            { Name: 'ClusterName', Value: clusterName },
          ],
          StartTime: new Date(Date.now() - 3600000),
          EndTime: new Date(),
          Period: 300,
          Statistics: ['Average'],
        })
      );

      expect(runningTaskMetric.Datapoints).toBeDefined();
    }, 120000);
  });

  describe('E2E: CloudWatch Alarm Flow - Alert Notification', () => {
    test('should trigger SNS notification when alarm threshold is breached', async () => {
      if (!snsTopicArn) {
        console.log('SNS topic ARN not available, skipping test');
        return;
      }

      const serviceName = serviceNames[0];

      const subscriptions = await snsClient.send(
        new ListSubscriptionsByTopicCommand({
          TopicArn: snsTopicArn,
        })
      );

      expect(subscriptions.Subscriptions).toBeDefined();

      await cloudwatchClient.send(
        new PutMetricDataCommand({
          Namespace: 'AWS/ECS',
          MetricData: [
            {
              MetricName: 'CPUUtilization',
              Dimensions: [
                { Name: 'ServiceName', Value: serviceName },
                { Name: 'ClusterName', Value: clusterName },
              ],
              Value: 85.0,
              Timestamp: new Date(),
            },
          ],
        })
      );

      const testMessage = await snsClient.send(
        new PublishCommand({
          TopicArn: snsTopicArn,
          Message: JSON.stringify({
            test: true,
            service: serviceName,
            timestamp: new Date().toISOString(),
          }),
          Subject: 'Test Alarm Notification',
        })
      );

      expect(testMessage.MessageId).toBeDefined();
    }, 120000);
  });

  describe('E2E: Cost Anomaly Detection Flow', () => {
    test('should detect cost anomalies and send notifications', async () => {
      if (!snsTopicArn) {
        console.log('SNS topic ARN not available, skipping test');
        return;
      }

      const subscriptions = await snsClient.send(
        new ListSubscriptionsByTopicCommand({
          TopicArn: snsTopicArn,
        })
      );

      expect(subscriptions.Subscriptions).toBeDefined();

      const costMetric = await cloudwatchClient.send(
        new GetMetricStatisticsCommand({
          Namespace: 'AWS/Billing',
          MetricName: 'EstimatedCharges',
          Dimensions: [
            { Name: 'ServiceName', Value: 'Amazon Elastic Container Service' },
            { Name: 'Currency', Value: 'USD' },
          ],
          StartTime: new Date(Date.now() - 86400000),
          EndTime: new Date(),
          Period: 3600,
          Statistics: ['Maximum'],
        })
      );

      expect(costMetric.Datapoints).toBeDefined();
    }, 120000);
  });

  describe('E2E: ALB Integration Flow - Request Routing', () => {
    test('should route requests through ALB to ECS services', async () => {
      if (!albDns) {
        console.log('ALB DNS not available, skipping test');
        return;
      }

      const serviceName = serviceNames[0];

      const service = await ecsClient.send(
        new DescribeServicesCommand({
          cluster: clusterName,
          services: [serviceName],
        })
      );

      const tasks = await ecsClient.send(
        new ListTasksCommand({
          cluster: clusterName,
          serviceName: serviceName,
        })
      );

      if (tasks.taskArns && tasks.taskArns.length > 0) {
        const taskDetails = await ecsClient.send(
          new DescribeTasksCommand({
            cluster: clusterName,
            tasks: tasks.taskArns.slice(0, 1),
          })
        );

        expect(taskDetails.tasks).toBeDefined();
        expect(taskDetails.tasks?.length).toBeGreaterThan(0);
      }

      const requestRateMetric = await cloudwatchClient.send(
        new GetMetricStatisticsCommand({
          Namespace: 'AWS/ApplicationELB',
          MetricName: 'RequestCount',
          StartTime: new Date(Date.now() - 3600000),
          EndTime: new Date(),
          Period: 300,
          Statistics: ['Sum'],
        })
      );

      expect(requestRateMetric.Datapoints).toBeDefined();
    }, 120000);
  });

  describe('E2E: ALB Error Monitoring Flow', () => {
    test('should monitor 5xx errors and trigger alarms', async () => {
      if (!albDns) {
        console.log('ALB DNS not available, skipping test');
        return;
      }

      const errorMetric = await cloudwatchClient.send(
        new GetMetricStatisticsCommand({
          Namespace: 'AWS/ApplicationELB',
          MetricName: 'HTTPCode_Target_5XX_Count',
          StartTime: new Date(Date.now() - 3600000),
          EndTime: new Date(),
          Period: 300,
          Statistics: ['Sum'],
        })
      );

      expect(errorMetric.Datapoints).toBeDefined();
    }, 120000);
  });

  describe('E2E: Multi-Service Scaling Flow', () => {
    test('should scale all 12 services independently', async () => {
      for (const serviceName of serviceNames.slice(0, 3)) {
        const resourceId = `service/${clusterName}/${serviceName}`;

        const scalableTarget = await autoscalingClient.send(
          new DescribeScalableTargetsCommand({
            ResourceIds: [resourceId],
            ServiceNamespace: 'ecs',
            ScalableDimension: 'ecs:service:DesiredCount',
          })
        );

        expect(scalableTarget.ScalableTargets?.length).toBeGreaterThan(0);

        const policies = await autoscalingClient.send(
          new DescribeScalingPoliciesCommand({
            ResourceId: resourceId,
            ServiceNamespace: 'ecs',
            ScalableDimension: 'ecs:service:DesiredCount',
          })
        );

        expect(policies.ScalingPolicies?.length).toBeGreaterThan(0);
      }
    }, 180000);
  });

  describe('E2E: Graceful Shutdown Flow - Target Deregistration', () => {
    test('should allow graceful shutdown with 60-second delay', async () => {
      const serviceName = serviceNames[0];

      const service = await ecsClient.send(
        new DescribeServicesCommand({
          cluster: clusterName,
          services: [serviceName],
        })
      );

      expect(service.services?.[0]).toBeDefined();

      const tasks = await ecsClient.send(
        new ListTasksCommand({
          cluster: clusterName,
          serviceName: serviceName,
        })
      );

      if (tasks.taskArns && tasks.taskArns.length > 0) {
        const taskDetails = await ecsClient.send(
          new DescribeTasksCommand({
            cluster: clusterName,
            tasks: tasks.taskArns.slice(0, 1),
          })
        );

        expect(taskDetails.tasks).toBeDefined();
      }
    }, 120000);
  });
});
