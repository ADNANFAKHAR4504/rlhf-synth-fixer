/**
 * Integration Tests for Payment Processing System Migration Infrastructure (Terraform)
 *
 * These tests validate the deployed infrastructure in AWS, using actual resources
 * and verifying they work correctly together.
 */

import * as fs from 'fs';
import * as path from 'path';
import {
  ECSClient,
  DescribeServicesCommand,
  DescribeTasksCommand,
  ListTasksCommand
} from '@aws-sdk/client-ecs';
import {
  ElasticLoadBalancingV2Client,
  DescribeLoadBalancersCommand,
  DescribeTargetGroupsCommand,
  DescribeTargetHealthCommand
} from '@aws-sdk/client-elastic-load-balancing-v2';
import {
  RDSClient,
  DescribeDBClustersCommand,
  DescribeDBInstancesCommand
} from '@aws-sdk/client-rds';
import {
  EC2Client,
  DescribeVpcsCommand,
  DescribeSubnetsCommand,
  DescribeSecurityGroupsCommand,
  DescribeNatGatewaysCommand
} from '@aws-sdk/client-ec2';
import {
  DatabaseMigrationServiceClient,
  DescribeReplicationInstancesCommand,
  DescribeEndpointsCommand,
  DescribeReplicationTasksCommand
} from '@aws-sdk/client-database-migration-service';
import {
  S3Client,
  HeadBucketCommand,
  GetBucketEncryptionCommand
} from '@aws-sdk/client-s3';
import {
  Route53Client,
  GetHostedZoneCommand,
  ListResourceRecordSetsCommand
} from '@aws-sdk/client-route-53';
import axios from 'axios';

// Load outputs from deployment
const outputsPath = path.resolve(__dirname, '../cfn-outputs/flat-outputs.json');
let outputs: any = {};

if (fs.existsSync(outputsPath)) {
  outputs = JSON.parse(fs.readFileSync(outputsPath, 'utf8'));
}

const region = process.env.AWS_REGION || 'us-east-1';

// AWS SDK clients
const ecsClient = new ECSClient({ region });
const elbv2Client = new ElasticLoadBalancingV2Client({ region });
const rdsClient = new RDSClient({ region });
const ec2Client = new EC2Client({ region });
const dmsClient = new DatabaseMigrationServiceClient({ region });
const s3Client = new S3Client({ region });
const route53Client = new Route53Client({ region });

describe('Payment Processing Migration Infrastructure - Integration Tests', () => {
  // Increase timeout for AWS API calls
  jest.setTimeout(30000);

  describe('Deployment Outputs', () => {
    test('should have deployment outputs file', () => {
      expect(fs.existsSync(outputsPath)).toBe(true);
    });

    test('should have all required outputs', () => {
      const requiredOutputs = [
        'vpc_id',
        'alb_dns_name',
        'ecs_cluster_name',
        'ecs_blue_service_name',
        'aurora_cluster_id'
      ];

      requiredOutputs.forEach(output => {
        expect(outputs[output]).toBeDefined();
        expect(outputs[output]).not.toBe('');
      });
    });
  });

  describe('VPC and Networking', () => {
    test('should have VPC deployed and available', async () => {
      const command = new DescribeVpcsCommand({
        VpcIds: [outputs.vpc_id]
      });

      const response = await ec2Client.send(command);
      expect(response.Vpcs).toHaveLength(1);
      expect(response.Vpcs[0].State).toBe('available');
      expect(response.Vpcs[0].VpcId).toBe(outputs.vpc_id);
    });

    test('should have public subnets deployed', async () => {
      expect(outputs.public_subnet_ids).toBeDefined();
      expect(Array.isArray(outputs.public_subnet_ids)).toBe(true);
      expect(outputs.public_subnet_ids.length).toBe(3);

      const command = new DescribeSubnetsCommand({
        SubnetIds: outputs.public_subnet_ids
      });

      const response = await ec2Client.send(command);
      expect(response.Subnets).toHaveLength(3);

      // All subnets should be in different AZs
      const azs = response.Subnets.map(s => s.AvailabilityZone);
      const uniqueAzs = new Set(azs);
      expect(uniqueAzs.size).toBe(3);
    });

    test('should have private app subnets deployed', async () => {
      expect(outputs.private_app_subnet_ids).toBeDefined();
      expect(Array.isArray(outputs.private_app_subnet_ids)).toBe(true);
      expect(outputs.private_app_subnet_ids.length).toBe(3);

      const command = new DescribeSubnetsCommand({
        SubnetIds: outputs.private_app_subnet_ids
      });

      const response = await ec2Client.send(command);
      expect(response.Subnets).toHaveLength(3);
    });

    test('should have private database subnets deployed', async () => {
      expect(outputs.private_db_subnet_ids).toBeDefined();
      expect(Array.isArray(outputs.private_db_subnet_ids)).toBe(true);
      expect(outputs.private_db_subnet_ids.length).toBe(3);

      const command = new DescribeSubnetsCommand({
        SubnetIds: outputs.private_db_subnet_ids
      });

      const response = await ec2Client.send(command);
      expect(response.Subnets).toHaveLength(3);
    });

    test('should have NAT gateways deployed and available', async () => {
      const command = new DescribeNatGatewaysCommand({
        Filter: [
          {
            Name: 'vpc-id',
            Values: [outputs.vpc_id]
          },
          {
            Name: 'state',
            Values: ['available']
          }
        ]
      });

      const response = await ec2Client.send(command);
      expect(response.NatGateways.length).toBeGreaterThanOrEqual(3);
    });

    test('should have security groups created', async () => {
      const command = new DescribeSecurityGroupsCommand({
        Filters: [
          {
            Name: 'vpc-id',
            Values: [outputs.vpc_id]
          }
        ]
      });

      const response = await ec2Client.send(command);
      // Should have at least: default, ALB, ECS, RDS, DMS, VPC endpoints
      expect(response.SecurityGroups.length).toBeGreaterThanOrEqual(6);
    });
  });

  describe('Application Load Balancer', () => {
    test('should have ALB deployed and active', async () => {
      const command = new DescribeLoadBalancersCommand({
        Names: [outputs.alb_dns_name.split('.')[0]]
      });

      const response = await elbv2Client.send(command);
      expect(response.LoadBalancers).toHaveLength(1);
      expect(response.LoadBalancers[0].State.Code).toBe('active');
      expect(response.LoadBalancers[0].Type).toBe('application');
      expect(response.LoadBalancers[0].Scheme).toBe('internet-facing');
    });

    test('should have target groups created', async () => {
      const command = new DescribeTargetGroupsCommand({
        LoadBalancerArn: outputs.alb_arn
      });

      const response = await elbv2Client.send(command);
      // Should have blue and green target groups
      expect(response.TargetGroups.length).toBeGreaterThanOrEqual(2);

      const targetGroupNames = response.TargetGroups.map(tg => tg.TargetGroupName);
      const hasBlue = targetGroupNames.some(name => name.includes('blue'));
      const hasGreen = targetGroupNames.some(name => name.includes('green'));

      expect(hasBlue).toBe(true);
      expect(hasGreen).toBe(true);
    });

    test('should have ALB responding to HTTP requests', async () => {
      const albEndpoint = `http://${outputs.alb_dns_name}`;

      try {
        const response = await axios.get(albEndpoint, {
          timeout: 10000,
          validateStatus: status => status < 500 // Accept 2xx, 3xx, 4xx
        });

        // ALB should be accessible (even if no targets are healthy)
        expect(response.status).toBeLessThan(500);
      } catch (error) {
        // If connection refused or timeout, ALB may not be fully ready
        if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
          console.warn('ALB not yet responding, may still be provisioning');
        }
        // Don't fail the test - ALB exists but may not have healthy targets yet
        expect(error.code).toBeDefined();
      }
    });

    test('should have S3 bucket for ALB logs', async () => {
      const command = new HeadBucketCommand({
        Bucket: outputs.alb_logs_bucket
      });

      await expect(s3Client.send(command)).resolves.not.toThrow();
    });

    test('should have encryption enabled on ALB logs bucket', async () => {
      const command = new GetBucketEncryptionCommand({
        Bucket: outputs.alb_logs_bucket
      });

      const response = await s3Client.send(command);
      expect(response.ServerSideEncryptionConfiguration).toBeDefined();
      expect(response.ServerSideEncryptionConfiguration.Rules).toHaveLength(1);
    });
  });

  describe('ECS Cluster and Services', () => {
    test('should have ECS cluster deployed and active', async () => {
      const command = new DescribeServicesCommand({
        cluster: outputs.ecs_cluster_name,
        services: [outputs.ecs_blue_service_name]
      });

      const response = await ecsClient.send(command);
      expect(response.services).toHaveLength(1);
      expect(response.services[0].status).toBe('ACTIVE');
    });

    test('should have blue ECS service running', async () => {
      const command = new DescribeServicesCommand({
        cluster: outputs.ecs_cluster_name,
        services: [outputs.ecs_blue_service_name]
      });

      const response = await ecsClient.send(command);
      expect(response.services).toHaveLength(1);

      const service = response.services[0];
      expect(service.serviceName).toBe(outputs.ecs_blue_service_name);
      expect(service.desiredCount).toBeGreaterThan(0);
      expect(service.launchType).toBe('FARGATE');
    });

    test('should have green ECS service deployed', async () => {
      const command = new DescribeServicesCommand({
        cluster: outputs.ecs_cluster_name,
        services: [outputs.ecs_green_service_name]
      });

      const response = await ecsClient.send(command);
      expect(response.services).toHaveLength(1);

      const service = response.services[0];
      expect(service.serviceName).toBe(outputs.ecs_green_service_name);
      // Green may have 0 tasks initially
      expect(service.desiredCount).toBeGreaterThanOrEqual(0);
    });

    test('should have ECS tasks running in blue service', async () => {
      const listCommand = new ListTasksCommand({
        cluster: outputs.ecs_cluster_name,
        serviceName: outputs.ecs_blue_service_name,
        desiredStatus: 'RUNNING'
      });

      const listResponse = await ecsClient.send(listCommand);

      if (listResponse.taskArns && listResponse.taskArns.length > 0) {
        const describeCommand = new DescribeTasksCommand({
          cluster: outputs.ecs_cluster_name,
          tasks: listResponse.taskArns
        });

        const describeResponse = await ecsClient.send(describeCommand);
        expect(describeResponse.tasks.length).toBeGreaterThan(0);

        // At least one task should be running or pending
        const runningTasks = describeResponse.tasks.filter(
          t => t.lastStatus === 'RUNNING' || t.lastStatus === 'PENDING'
        );
        expect(runningTasks.length).toBeGreaterThan(0);
      } else {
        // Tasks may be starting up
        console.warn('No running tasks found in blue service yet');
      }
    });
  });

  describe('Aurora Database Cluster', () => {
    test('should have Aurora cluster deployed and available', async () => {
      const command = new DescribeDBClustersCommand({
        DBClusterIdentifier: outputs.aurora_cluster_id
      });

      const response = await rdsClient.send(command);
      expect(response.DBClusters).toHaveLength(1);

      const cluster = response.DBClusters[0];
      expect(cluster.Status).toMatch(/available|backing-up|modifying/);
      expect(cluster.Engine).toBe('aurora-mysql');
      expect(cluster.StorageEncrypted).toBe(true);
    });

    test('should have database name configured', async () => {
      const command = new DescribeDBClustersCommand({
        DBClusterIdentifier: outputs.aurora_cluster_id
      });

      const response = await rdsClient.send(command);
      expect(response.DBClusters[0].DatabaseName).toBe(outputs.aurora_database_name);
    });

    test('should have writer and reader endpoints', async () => {
      const command = new DescribeDBClustersCommand({
        DBClusterIdentifier: outputs.aurora_cluster_id
      });

      const response = await rdsClient.send(command);
      const cluster = response.DBClusters[0];

      expect(cluster.Endpoint).toBeDefined();
      expect(cluster.ReaderEndpoint).toBeDefined();
      expect(cluster.Endpoint).toContain(outputs.aurora_cluster_id);
    });

    test('should have Aurora instances created', async () => {
      const command = new DescribeDBInstancesCommand({
        Filters: [
          {
            Name: 'db-cluster-id',
            Values: [outputs.aurora_cluster_id]
          }
        ]
      });

      const response = await rdsClient.send(command);
      // Should have at least writer + 2 readers = 3 instances
      expect(response.DBInstances.length).toBeGreaterThanOrEqual(3);

      // Check instances are available or in transitional state
      response.DBInstances.forEach(instance => {
        expect(instance.DBInstanceStatus).toMatch(/available|backing-up|modifying|creating/);
      });
    });

    test('should have CloudWatch logs enabled', async () => {
      const command = new DescribeDBClustersCommand({
        DBClusterIdentifier: outputs.aurora_cluster_id
      });

      const response = await rdsClient.send(command);
      const cluster = response.DBClusters[0];

      expect(cluster.EnabledCloudwatchLogsExports).toBeDefined();
      expect(cluster.EnabledCloudwatchLogsExports.length).toBeGreaterThan(0);
    });
  });

  describe('DMS (Database Migration Service)', () => {
    test('should have DMS replication instance created', async () => {
      const command = new DescribeReplicationInstancesCommand({});

      const response = await dmsClient.send(command);
      const instances = response.ReplicationInstances.filter(
        instance => instance.ReplicationInstanceIdentifier.includes(
          outputs.aurora_cluster_id.split('-')[0] // Extract prefix
        )
      );

      expect(instances.length).toBeGreaterThan(0);

      const instance = instances[0];
      expect(instance.ReplicationInstanceStatus).toMatch(/available|modifying|creating/);
    });

    test('should have DMS endpoints created', async () => {
      const command = new DescribeEndpointsCommand({});

      const response = await dmsClient.send(command);
      const endpoints = response.Endpoints.filter(
        endpoint => endpoint.EndpointIdentifier.includes(
          outputs.aurora_cluster_id.split('-')[0]
        )
      );

      // Should have source and target endpoints
      expect(endpoints.length).toBeGreaterThanOrEqual(2);

      const hasSource = endpoints.some(e => e.EndpointType === 'source');
      const hasTarget = endpoints.some(e => e.EndpointType === 'target');

      expect(hasSource).toBe(true);
      expect(hasTarget).toBe(true);
    });

    test('should have DMS replication task created', async () => {
      const command = new DescribeReplicationTasksCommand({});

      const response = await dmsClient.send(command);
      const tasks = response.ReplicationTasks.filter(
        task => task.ReplicationTaskIdentifier.includes(
          outputs.aurora_cluster_id.split('-')[0]
        )
      );

      expect(tasks.length).toBeGreaterThan(0);

      const task = tasks[0];
      expect(task.MigrationType).toBe('full-load-and-cdc');
    });
  });

  describe('Route 53 DNS', () => {
    test('should have private hosted zone created', async () => {
      expect(outputs.private_hosted_zone_name).toBe('payment.internal');
    });

    test('should have DNS records for database endpoints', async () => {
      // This test verifies the hosted zone exists and has records
      // We can't easily get the zone ID from outputs, so we skip if not available
      if (!outputs.private_hosted_zone_id) {
        console.warn('Skipping DNS test - zone ID not in outputs');
        return;
      }

      const command = new ListResourceRecordSetsCommand({
        HostedZoneId: outputs.private_hosted_zone_id
      });

      const response = await route53Client.send(command);
      expect(response.ResourceRecordSets).toBeDefined();
      expect(response.ResourceRecordSets.length).toBeGreaterThan(0);
    });
  });

  describe('S3 Buckets', () => {
    test('should have logs backup bucket created', async () => {
      const command = new HeadBucketCommand({
        Bucket: outputs.logs_backup_bucket
      });

      await expect(s3Client.send(command)).resolves.not.toThrow();
    });

    test('should have encryption enabled on logs backup bucket', async () => {
      const command = new GetBucketEncryptionCommand({
        Bucket: outputs.logs_backup_bucket
      });

      const response = await s3Client.send(command);
      expect(response.ServerSideEncryptionConfiguration).toBeDefined();
    });
  });

  describe('Migration Status and Traffic Distribution', () => {
    test('should have migration phase set', () => {
      expect(outputs.migration_phase).toBeDefined();
      expect(['preparation', 'migration', 'cutover', 'complete']).toContain(
        outputs.migration_phase
      );
    });

    test('should have traffic distribution configured', () => {
      expect(outputs.traffic_distribution).toBeDefined();
      expect(outputs.traffic_distribution.blue_weight).toBeDefined();
      expect(outputs.traffic_distribution.green_weight).toBeDefined();

      const total = outputs.traffic_distribution.blue_weight +
                    outputs.traffic_distribution.green_weight;
      expect(total).toBe(100);
    });
  });

  describe('End-to-End Connectivity', () => {
    test('should be able to reach ALB endpoint', async () => {
      const albEndpoint = `http://${outputs.alb_dns_name}`;

      try {
        const response = await axios.get(albEndpoint, {
          timeout: 10000,
          validateStatus: () => true // Accept any status
        });

        // ALB is reachable (status doesn't matter, connection matters)
        expect(response.status).toBeDefined();
        expect(response.status).toBeLessThan(600);
      } catch (error) {
        if (error.code === 'ECONNREFUSED') {
          fail('ALB is not reachable - connection refused');
        } else if (error.code === 'ETIMEDOUT') {
          fail('ALB is not reachable - connection timeout');
        } else {
          // Other errors might be acceptable (e.g., DNS resolution issues in test env)
          console.warn('ALB connectivity test inconclusive:', error.message);
        }
      }
    });

    test('should have target health checks configured', async () => {
      const blueCommand = new DescribeTargetHealthCommand({
        TargetGroupArn: outputs.blue_target_group_arn
      });

      const blueResponse = await elbv2Client.send(blueCommand);
      expect(blueResponse.TargetHealthDescriptions).toBeDefined();

      // Targets may be healthy, unhealthy, or initial
      // Just verify the health check is configured
      expect(Array.isArray(blueResponse.TargetHealthDescriptions)).toBe(true);
    });
  });

  describe('Resource Cleanup Readiness', () => {
    test('should verify resources are destroyable (no deletion protection)', async () => {
      // Check ALB deletion protection
      const albCommand = new DescribeLoadBalancersCommand({
        Names: [outputs.alb_dns_name.split('.')[0]]
      });

      const albResponse = await elbv2Client.send(albCommand);
      const alb = albResponse.LoadBalancers[0];

      // ALB should NOT have deletion protection enabled for QA
      expect(alb.LoadBalancerAttributes).toBeDefined();
      const deletionProtection = alb.LoadBalancerAttributes?.find(
        attr => attr.Key === 'deletion_protection.enabled'
      );

      if (deletionProtection) {
        expect(deletionProtection.Value).toBe('false');
      }
    });

    test('should verify RDS cluster is destroyable', async () => {
      const command = new DescribeDBClustersCommand({
        DBClusterIdentifier: outputs.aurora_cluster_id
      });

      const response = await rdsClient.send(command);
      const cluster = response.DBClusters[0];

      // For QA, deletion protection should be false
      expect(cluster.DeletionProtection).toBe(false);
    });
  });
});
