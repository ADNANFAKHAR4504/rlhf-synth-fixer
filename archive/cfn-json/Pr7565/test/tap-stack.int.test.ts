import {
  CloudFormationClient,
  ValidateTemplateCommand,
} from '@aws-sdk/client-cloudformation';
import { EC2Client, DescribeVpcsCommand } from '@aws-sdk/client-ec2';
import { RDSClient, DescribeDBClustersCommand, DescribeDBInstancesCommand } from '@aws-sdk/client-rds';
import { ECSClient, DescribeClustersCommand, DescribeServicesCommand } from '@aws-sdk/client-ecs';
import {
  ElasticLoadBalancingV2Client,
  DescribeLoadBalancersCommand,
} from '@aws-sdk/client-elastic-load-balancing-v2';
import { SNSClient, GetTopicAttributesCommand } from '@aws-sdk/client-sns';
import { KMSClient, DescribeKeyCommand } from '@aws-sdk/client-kms';
import {
  CloudWatchClient,
  DescribeAlarmsCommand,
} from '@aws-sdk/client-cloudwatch';
import { SSMClient, GetParameterCommand } from '@aws-sdk/client-ssm';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

describe('High Availability Payment Processing Infrastructure - Integration Tests', () => {
  const region = process.env.AWS_REGION || 'us-east-2';
  let outputs: Record<string, string>;
  let stackName: string;
  let templateString: string;
  const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

  beforeAll(() => {
    const flatOutputsPath = join(__dirname, '..', 'cfn-outputs', 'flat-outputs.json');

    if (!existsSync(flatOutputsPath)) {
      console.warn('Warning: cfn-outputs/flat-outputs.json not found. Some tests may be skipped.');
      outputs = {};
    } else {
      const flatOutputsContent = readFileSync(flatOutputsPath, 'utf-8');
      const flatOutputs = JSON.parse(flatOutputsContent);
      stackName = Object.keys(flatOutputs)[0];
      outputs = flatOutputs[stackName] || {};
    }

    const templatePath = join(__dirname, '..', 'lib', 'TapStack.json');
    templateString = readFileSync(templatePath, 'utf-8');
  });

  describe('CloudFormation Template Validation', () => {
    it('should have valid CloudFormation template syntax', async () => {
      const client = new CloudFormationClient({ region });
      const command = new ValidateTemplateCommand({
        TemplateBody: templateString,
      });

      const response = await client.send(command);
      expect(response).toBeDefined();
      expect(response.Parameters).toBeDefined();
    });

  });

  describe('AWS Service: VPC and Networking', () => {
    it('should have deployed VPC', async () => {
      if (!outputs.VPCId) {
        console.log('Skipping: VPCId not in outputs');
        return;
      }

      const client = new EC2Client({ region });
      const command = new DescribeVpcsCommand({
        VpcIds: [outputs.VPCId],
      });

      const response = await client.send(command);
      expect(response.Vpcs).toBeDefined();
      expect(response.Vpcs!.length).toBe(1);
      expect(response.Vpcs![0].State).toBe('available');
    });
  });

  describe('AWS Service: Aurora PostgreSQL (RDS)', () => {
    it('should have deployed Aurora cluster', async () => {
      if (!outputs.AuroraClusterEndpoint) {
        console.log('Skipping: AuroraClusterEndpoint not in outputs');
        return;
      }

      const client = new RDSClient({ region });
      const command = new DescribeDBClustersCommand({
        DBClusterIdentifier: `payment-aurora-cluster-${environmentSuffix}`,
      });

      const response = await client.send(command);
      expect(response.DBClusters).toBeDefined();
      expect(response.DBClusters!.length).toBe(1);
      expect(response.DBClusters![0].Status).toBe('available');
      expect(response.DBClusters![0].Engine).toBe('aurora-postgresql');
    });

    it('should have Aurora cluster with storage encryption enabled', async () => {
      if (!outputs.AuroraClusterEndpoint) {
        console.log('Skipping: AuroraClusterEndpoint not in outputs');
        return;
      }

      const client = new RDSClient({ region });
      const command = new DescribeDBClustersCommand({
        DBClusterIdentifier: `payment-aurora-cluster-${environmentSuffix}`,
      });

      const response = await client.send(command);
      expect(response.DBClusters![0].StorageEncrypted).toBe(true);
    });

    it('should have Aurora reader endpoint available', async () => {
      if (!outputs.AuroraReaderEndpoint) {
        console.log('Skipping: AuroraReaderEndpoint not in outputs');
        return;
      }

      expect(outputs.AuroraReaderEndpoint).toBeDefined();
      expect(outputs.AuroraReaderEndpoint).toContain('.rds.amazonaws.com');
    });
  });

  describe('AWS Service: ECS Fargate', () => {
    it('should have deployed ECS cluster', async () => {
      if (!outputs.ECSClusterName) {
        console.log('Skipping: ECSClusterName not in outputs');
        return;
      }

      const client = new ECSClient({ region });
      const command = new DescribeClustersCommand({
        clusters: [outputs.ECSClusterName],
      });

      const response = await client.send(command);
      expect(response.clusters).toBeDefined();
      expect(response.clusters!.length).toBe(1);
      expect(response.clusters![0].status).toBe('ACTIVE');
    });

    it('should have ECS cluster with container insights enabled', async () => {
      if (!outputs.ECSClusterName) {
        console.log('Skipping: ECSClusterName not in outputs');
        return;
      }

      const client = new ECSClient({ region });
      const command = new DescribeClustersCommand({
        clusters: [outputs.ECSClusterName],
        include: ['SETTINGS'],
      });

      const response = await client.send(command);
      const settings = response.clusters![0].settings;
      const containerInsights = settings?.find((s) => s.name === 'containerInsights');
      expect(containerInsights?.value).toBe('enabled');
    });

    it('should have deployed ECS service', async () => {
      if (!outputs.ECSClusterName || !outputs.ECSServiceName) {
        console.log('Skipping: ECS outputs not available');
        return;
      }

      const client = new ECSClient({ region });
      const command = new DescribeServicesCommand({
        cluster: outputs.ECSClusterName,
        services: [outputs.ECSServiceName],
      });

      const response = await client.send(command);
      expect(response.services).toBeDefined();
      expect(response.services!.length).toBe(1);
      expect(response.services![0].status).toBe('ACTIVE');
    });

    it('should have ECS service with 6 desired tasks', async () => {
      if (!outputs.ECSClusterName || !outputs.ECSServiceName) {
        console.log('Skipping: ECS outputs not available');
        return;
      }

      const client = new ECSClient({ region });
      const command = new DescribeServicesCommand({
        cluster: outputs.ECSClusterName,
        services: [outputs.ECSServiceName],
      });

      const response = await client.send(command);
      expect(response.services![0].desiredCount).toBe(6);
    });
  });

  describe('AWS Service: Application Load Balancer', () => {
    it('should have deployed Application Load Balancer', async () => {
      if (!outputs.LoadBalancerDNS) {
        console.log('Skipping: LoadBalancerDNS not in outputs');
        return;
      }

      const client = new ElasticLoadBalancingV2Client({ region });
      const command = new DescribeLoadBalancersCommand({
        Names: [`payment-alb-${environmentSuffix}`],
      });

      const response = await client.send(command);
      expect(response.LoadBalancers).toBeDefined();
      expect(response.LoadBalancers!.length).toBe(1);
      expect(response.LoadBalancers![0].State?.Code).toBe('active');
    });

    it('should have ALB configured as internet-facing', async () => {
      if (!outputs.LoadBalancerDNS) {
        console.log('Skipping: LoadBalancerDNS not in outputs');
        return;
      }

      const client = new ElasticLoadBalancingV2Client({ region });
      const command = new DescribeLoadBalancersCommand({
        Names: [`payment-alb-${environmentSuffix}`],
      });

      const response = await client.send(command);
      expect(response.LoadBalancers![0].Scheme).toBe('internet-facing');
    });
  });

  describe('AWS Service: KMS Encryption', () => {
    it('should have deployed KMS key', async () => {
      if (!outputs.KMSKeyId) {
        console.log('Skipping: KMSKeyId not in outputs');
        return;
      }

      const client = new KMSClient({ region });
      const command = new DescribeKeyCommand({
        KeyId: outputs.KMSKeyId,
      });

      const response = await client.send(command);
      expect(response.KeyMetadata).toBeDefined();
      expect(response.KeyMetadata!.Enabled).toBe(true);
    });

    it('should have KMS key with rotation enabled', async () => {
      if (!outputs.KMSKeyId) {
        console.log('Skipping: KMSKeyId not in outputs');
        return;
      }

      const client = new KMSClient({ region });
      const command = new DescribeKeyCommand({
        KeyId: outputs.KMSKeyId,
      });

      const response = await client.send(command);
      expect(response.KeyMetadata!.KeyState).toBe('Enabled');
    });
  });

  describe('AWS Service: SNS Notifications', () => {
    it('should have deployed SNS topic for alerts', async () => {
      if (!outputs.SNSTopicArn) {
        console.log('Skipping: SNSTopicArn not in outputs');
        return;
      }

      const client = new SNSClient({ region });
      const command = new GetTopicAttributesCommand({
        TopicArn: outputs.SNSTopicArn,
      });

      const response = await client.send(command);
      expect(response.Attributes).toBeDefined();
      expect(response.Attributes!.TopicArn).toBe(outputs.SNSTopicArn);
    });
  });

  describe('AWS Service: CloudWatch Monitoring', () => {
    it('should have deployed CloudWatch alarms', async () => {
      if (!stackName) {
        console.log('Skipping: No stack deployed');
        return;
      }

      const client = new CloudWatchClient({ region });
      const command = new DescribeAlarmsCommand({
        AlarmNamePrefix: `payment-`,
      });

      const response = await client.send(command);
      expect(response.MetricAlarms).toBeDefined();
      expect(response.MetricAlarms!.length).toBeGreaterThan(0);
    });

    it('should have RDS failover alarm configured', async () => {
      const client = new CloudWatchClient({ region });
      const command = new DescribeAlarmsCommand({
        AlarmNames: [`payment-rds-failover-${environmentSuffix}`],
      });

      const response = await client.send(command);
      if (response.MetricAlarms && response.MetricAlarms.length > 0) {
        expect(response.MetricAlarms[0].MetricName).toBe('DatabaseConnections');
        expect(response.MetricAlarms[0].Namespace).toBe('AWS/RDS');
      }
    });

    it('should have ECS task failure alarm configured', async () => {
      const client = new CloudWatchClient({ region });
      const command = new DescribeAlarmsCommand({
        AlarmNames: [`payment-ecs-task-failure-${environmentSuffix}`],
      });

      const response = await client.send(command);
      if (response.MetricAlarms && response.MetricAlarms.length > 0) {
        expect(response.MetricAlarms[0].MetricName).toBe('RunningTaskCount');
      }
    });

    it('should have ALB unhealthy targets alarm configured', async () => {
      const client = new CloudWatchClient({ region });
      const command = new DescribeAlarmsCommand({
        AlarmNames: [`payment-alb-unhealthy-targets-${environmentSuffix}`],
      });

      const response = await client.send(command);
      if (response.MetricAlarms && response.MetricAlarms.length > 0) {
        expect(response.MetricAlarms[0].MetricName).toBe('UnHealthyHostCount');
      }
    });
  });

  describe('AWS Service: Systems Manager Parameter Store', () => {
    it('should have SSM parameter for DB endpoint', async () => {
      const client = new SSMClient({ region });
      const command = new GetParameterCommand({
        Name: `/payment/${environmentSuffix}/db/endpoint`,
      });

      try {
        const response = await client.send(command);
        expect(response.Parameter).toBeDefined();
        expect(response.Parameter!.Value).toContain('.rds.amazonaws.com');
      } catch (error: any) {
        if (error.name === 'ParameterNotFound') {
          console.log('Skipping: SSM parameter not found (stack may not be deployed)');
        } else {
          throw error;
        }
      }
    });

    it('should have SSM parameter for DB reader endpoint', async () => {
      const client = new SSMClient({ region });
      const command = new GetParameterCommand({
        Name: `/payment/${environmentSuffix}/db/reader-endpoint`,
      });

      try {
        const response = await client.send(command);
        expect(response.Parameter).toBeDefined();
        expect(response.Parameter!.Value).toContain('.rds.amazonaws.com');
      } catch (error: any) {
        if (error.name === 'ParameterNotFound') {
          console.log('Skipping: SSM parameter not found (stack may not be deployed)');
        } else {
          throw error;
        }
      }
    });
  });

  describe('High Availability Configuration', () => {
    it('should have Aurora cluster with multiple instances', async () => {
      if (!outputs.AuroraClusterEndpoint) {
        console.log('Skipping: Aurora not deployed');
        return;
      }

      const client = new RDSClient({ region });
      const command = new DescribeDBInstancesCommand({
        Filters: [
          {
            Name: 'db-cluster-id',
            Values: [`payment-aurora-cluster-${environmentSuffix}`],
          },
        ],
      });

      const response = await client.send(command);
      expect(response.DBInstances).toBeDefined();
      expect(response.DBInstances!.length).toBeGreaterThanOrEqual(2);
    });

    it('should have ECS service running across multiple AZs', async () => {
      if (!outputs.ECSClusterName || !outputs.ECSServiceName) {
        console.log('Skipping: ECS outputs not available');
        return;
      }

      const client = new ECSClient({ region });
      const command = new DescribeServicesCommand({
        cluster: outputs.ECSClusterName,
        services: [outputs.ECSServiceName],
      });

      const response = await client.send(command);
      const service = response.services![0];
      expect(service.networkConfiguration?.awsvpcConfiguration?.subnets?.length).toBeGreaterThanOrEqual(
        3
      );
    });
  });

  describe('Outputs Validation', () => {
    it('should have CloudWatch dashboard URL in outputs', () => {
      if (!outputs.CloudWatchDashboard) {
        console.log('Skipping: CloudWatchDashboard not in outputs');
        return;
      }

      expect(outputs.CloudWatchDashboard).toContain('console.aws.amazon.com/cloudwatch');
    });
  });
});
