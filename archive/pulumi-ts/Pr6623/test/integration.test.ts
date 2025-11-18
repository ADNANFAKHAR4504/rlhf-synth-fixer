/**
 * Integration tests using deployed infrastructure outputs
 */
import * as AWS from 'aws-sdk';
import * as fs from 'fs';
import * as path from 'path';

describe('Payment Processing Migration Infrastructure Integration Tests', () => {
  let outputs: any;
  let elbv2: AWS.ELBv2;
  let rds: AWS.RDS;
  let dms: AWS.DMS;
  let ecs: AWS.ECS;
  let cloudwatch: AWS.CloudWatch;

  beforeAll(async () => {
    // Load outputs from deployed stack
    const outputsPath = path.join(
      process.cwd(),
      'cfn-outputs',
      'flat-outputs.json'
    );

    if (fs.existsSync(outputsPath)) {
      outputs = JSON.parse(fs.readFileSync(outputsPath, 'utf8'));
    } else {
      throw new Error('Outputs file not found. Deploy the stack first.');
    }

    // Initialize AWS SDK clients
    elbv2 = new AWS.ELBv2({ region: 'us-east-1' });
    rds = new AWS.RDS({ region: 'us-east-1' });
    dms = new AWS.DMS({ region: 'us-east-1' });
    ecs = new AWS.ECS({ region: 'us-east-1' });
    cloudwatch = new AWS.CloudWatch({ region: 'us-east-1' });
  });

  describe('VPC and Networking', () => {
    it('should have a valid VPC ID', () => {
      expect(outputs.vpcId).toBeDefined();
      expect(outputs.vpcId).toMatch(/^vpc-/);
    });
  });

  describe('Application Load Balancer', () => {
    it('should have a valid ALB DNS name', () => {
      expect(outputs.albDnsName).toBeDefined();
      expect(outputs.albDnsName).toContain('elb.amazonaws.com');
    });

    it('should have ALB in active state', async () => {
      const albName = outputs.albDnsName.split('-')[0];

      const result = await elbv2.describeLoadBalancers({}).promise();
      const alb = result.LoadBalancers?.find(
        lb => lb.DNSName === outputs.albDnsName
      );

      expect(alb).toBeDefined();
      expect(alb?.State?.Code).toBe('active');
    });
  });

  describe('RDS Aurora PostgreSQL', () => {
    it('should have a valid RDS cluster endpoint', () => {
      expect(outputs.rdsClusterEndpoint).toBeDefined();
      expect(outputs.rdsClusterEndpoint).toContain('rds.amazonaws.com');
    });

    it('should have cluster in available state', async () => {
      const clusterIdentifier = outputs.rdsClusterEndpoint.split('.')[0];

      const result = await rds
        .describeDBClusters({
          DBClusterIdentifier: clusterIdentifier,
        })
        .promise();

      expect(result.DBClusters).toBeDefined();
      expect(result.DBClusters![0].Status).toBe('available');
    });

    it('should have encryption enabled', async () => {
      const clusterIdentifier = outputs.rdsClusterEndpoint.split('.')[0];

      const result = await rds
        .describeDBClusters({
          DBClusterIdentifier: clusterIdentifier,
        })
        .promise();

      expect(result.DBClusters![0].StorageEncrypted).toBe(true);
    });

    it('should have 3 instances (1 writer + 2 readers)', async () => {
      const clusterIdentifier = outputs.rdsClusterEndpoint.split('.')[0];

      const result = await rds
        .describeDBClusters({
          DBClusterIdentifier: clusterIdentifier,
        })
        .promise();

      const memberCount = result.DBClusters![0].DBClusterMembers?.length;
      expect(memberCount).toBe(3);
    });
  });

  describe('ECS Fargate Service', () => {
    it('should have ECS service running', async () => {
      const clusterName = 'payment-cluster-' + process.env.ENVIRONMENT_SUFFIX;
      const serviceName = 'payment-service-' + process.env.ENVIRONMENT_SUFFIX;

      const result = await ecs
        .describeServices({
          cluster: clusterName,
          services: [serviceName],
        })
        .promise();

      expect(result.services).toBeDefined();
      expect(result.services![0].status).toBe('ACTIVE');
    });

    it('should have at least 3 running tasks', async () => {
      const clusterName = 'payment-cluster-' + process.env.ENVIRONMENT_SUFFIX;
      const serviceName = 'payment-service-' + process.env.ENVIRONMENT_SUFFIX;

      const result = await ecs
        .describeServices({
          cluster: clusterName,
          services: [serviceName],
        })
        .promise();

      expect(result.services![0].runningCount).toBeGreaterThanOrEqual(3);
    });
  });

  describe('DMS Replication', () => {
    it('should have a valid DMS replication task ARN', () => {
      expect(outputs.dmsTaskArn).toBeDefined();
      expect(outputs.dmsTaskArn).toContain('arn:aws:dms');
    });

    it('should have DMS task created', async () => {
      const result = await dms
        .describeReplicationTasks({
          Filters: [
            {
              Name: 'replication-task-arn',
              Values: [outputs.dmsTaskArn],
            },
          ],
        })
        .promise();

      expect(result.ReplicationTasks).toBeDefined();
      expect(result.ReplicationTasks!.length).toBeGreaterThan(0);
    });

    it('should have CDC enabled', async () => {
      const result = await dms
        .describeReplicationTasks({
          Filters: [
            {
              Name: 'replication-task-arn',
              Values: [outputs.dmsTaskArn],
            },
          ],
        })
        .promise();

      const task = result.ReplicationTasks![0];
      expect(task.MigrationType).toBe('full-load-and-cdc');
    });
  });

  describe('CloudWatch Alarms', () => {
    it('should have DMS lag alarm configured', async () => {
      const alarmName = 'payment-dms-lag-' + process.env.ENVIRONMENT_SUFFIX;

      const result = await cloudwatch
        .describeAlarms({
          AlarmNames: [alarmName],
        })
        .promise();

      expect(result.MetricAlarms).toBeDefined();
      expect(result.MetricAlarms!.length).toBeGreaterThan(0);
    });

    it('should have ECS task alarm configured', async () => {
      const alarmName = 'payment-ecs-tasks-' + process.env.ENVIRONMENT_SUFFIX;

      const result = await cloudwatch
        .describeAlarms({
          AlarmNames: [alarmName],
        })
        .promise();

      expect(result.MetricAlarms).toBeDefined();
      expect(result.MetricAlarms!.length).toBeGreaterThan(0);
    });

    it('should have RDS CPU alarm configured', async () => {
      const alarmName = 'payment-rds-cpu-' + process.env.ENVIRONMENT_SUFFIX;

      const result = await cloudwatch
        .describeAlarms({
          AlarmNames: [alarmName],
        })
        .promise();

      expect(result.MetricAlarms).toBeDefined();
      expect(result.MetricAlarms!.length).toBeGreaterThan(0);
    });
  });

  describe('Security and Tags', () => {
    it('should have proper tags on RDS cluster', async () => {
      const clusterIdentifier = outputs.rdsClusterEndpoint.split('.')[0];

      const result = await rds
        .describeDBClusters({
          DBClusterIdentifier: clusterIdentifier,
        })
        .promise();

      const tags = result.DBClusters![0].TagList || [];
      const envTag = tags.find(t => t.Key === 'Environment');
      const costCenterTag = tags.find(t => t.Key === 'CostCenter');
      const migrationPhaseTag = tags.find(t => t.Key === 'MigrationPhase');

      expect(envTag?.Value).toBe('prod-migration');
      expect(costCenterTag?.Value).toBe('finance');
      expect(migrationPhaseTag?.Value).toBe('active');
    });
  });
});
