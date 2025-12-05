import * as fs from 'fs';
import * as path from 'path';
import {
  ECSClient,
  DescribeServicesCommand,
  DescribeClustersCommand,
  DescribeTaskDefinitionCommand,
} from '@aws-sdk/client-ecs';
import {
  CloudWatchClient,
  DescribeAlarmsCommand,
} from '@aws-sdk/client-cloudwatch';
import {
  IAMClient,
  GetPolicyCommand,
  GetPolicyVersionCommand,
} from '@aws-sdk/client-iam';

describe('ECS Optimized Infrastructure Integration Tests', () => {
  let outputs: Record<string, string>;
  const ecsClient = new ECSClient({ region: process.env.AWS_REGION || 'us-east-1' });
  const cloudwatchClient = new CloudWatchClient({
    region: process.env.AWS_REGION || 'us-east-1',
  });
  const iamClient = new IAMClient({ region: process.env.AWS_REGION || 'us-east-1' });

  beforeAll(() => {
    const outputsPath = path.join(__dirname, '..', 'cfn-outputs', 'flat-outputs.json');
    if (fs.existsSync(outputsPath)) {
      outputs = JSON.parse(fs.readFileSync(outputsPath, 'utf-8'));
    } else {
      throw new Error(
        'Stack outputs not found. Please deploy the stack first: pulumi up'
      );
    }
  });

  describe('ECS Resource Optimization', () => {
    it('should have optimized CPU allocation (512 units)', async () => {
      const clusterArn = outputs.clusterArn;
      const serviceArn = outputs.serviceArn;

      expect(clusterArn).toBeDefined();
      expect(serviceArn).toBeDefined();

      const servicesCommand = new DescribeServicesCommand({
        cluster: clusterArn,
        services: [serviceArn],
      });
      const servicesResponse = await ecsClient.send(servicesCommand);

      expect(servicesResponse.services).toHaveLength(1);
      const service = servicesResponse.services![0];

      // Get task definition
      const taskDefArn = service.taskDefinition!;
      const taskDefCommand = new DescribeTaskDefinitionCommand({
        taskDefinition: taskDefArn,
      });
      const taskDefResponse = await ecsClient.send(taskDefCommand);

      expect(taskDefResponse.taskDefinition?.cpu).toBe('512');
    });

    it('should have memory configured to 1024 MB', async () => {
      const taskDefArn = outputs.taskDefinitionArn;

      const taskDefCommand = new DescribeTaskDefinitionCommand({
        taskDefinition: taskDefArn,
      });
      const taskDefResponse = await ecsClient.send(taskDefCommand);

      expect(taskDefResponse.taskDefinition?.memory).toBe('1024');
    });

    it('should have Container Insights enabled on cluster', async () => {
      const clusterArn = outputs.clusterArn;

      const clustersCommand = new DescribeClustersCommand({
        clusters: [clusterArn],
        include: ['SETTINGS'],
      });
      const clustersResponse = await ecsClient.send(clustersCommand);

      expect(clustersResponse.clusters).toHaveLength(1);
      const cluster = clustersResponse.clusters![0];

      const containerInsightsSetting = cluster.settings?.find(
        (s) => s.name === 'containerInsights'
      );
      expect(containerInsightsSetting).toBeDefined();
      expect(containerInsightsSetting?.value).toBe('enabled');
    });
  });

  describe('CloudWatch Alarms', () => {
    it('should have CPU alarm configured with 80% threshold', async () => {
      const cpuAlarmName = outputs.cpuAlarmName;
      expect(cpuAlarmName).toBeDefined();

      const alarmsCommand = new DescribeAlarmsCommand({
        AlarmNames: [cpuAlarmName],
      });
      const alarmsResponse = await cloudwatchClient.send(alarmsCommand);

      expect(alarmsResponse.MetricAlarms).toHaveLength(1);
      const alarm = alarmsResponse.MetricAlarms![0];

      expect(alarm.MetricName).toBe('CPUUtilization');
      expect(alarm.Threshold).toBe(80);
      expect(alarm.ComparisonOperator).toBe('GreaterThanThreshold');
    });

    it('should have memory alarm configured with 90% threshold', async () => {
      const memoryAlarmName = outputs.memoryAlarmName;
      expect(memoryAlarmName).toBeDefined();

      const alarmsCommand = new DescribeAlarmsCommand({
        AlarmNames: [memoryAlarmName],
      });
      const alarmsResponse = await cloudwatchClient.send(alarmsCommand);

      expect(alarmsResponse.MetricAlarms).toHaveLength(1);
      const alarm = alarmsResponse.MetricAlarms![0];

      expect(alarm.MetricName).toBe('MemoryUtilization');
      expect(alarm.Threshold).toBe(90);
      expect(alarm.ComparisonOperator).toBe('GreaterThanThreshold');
    });
  });

  describe('CloudWatch Logging', () => {
    it('should have log group created for ECS tasks', () => {
      const logGroupName = outputs.logGroupName;
      expect(logGroupName).toBeDefined();
      expect(logGroupName).toMatch(/^\/ecs\/tap-/);
    });
  });
});
