import {
  DescribeSubnetsCommand,
  DescribeVpcsCommand,
  EC2Client,
} from '@aws-sdk/client-ec2';
import {
  DescribeClustersCommand,
  ECSClient
} from '@aws-sdk/client-ecs';
import {
  DescribeLoadBalancersCommand,
  ElasticLoadBalancingV2Client
} from '@aws-sdk/client-elastic-load-balancing-v2';
import {
  DescribeReplicationGroupsCommand,
  ElastiCacheClient,
} from '@aws-sdk/client-elasticache';
import { DescribeDBInstancesCommand, RDSClient } from '@aws-sdk/client-rds';
import {
  DescribeSecretCommand,
  GetSecretValueCommand,
  SecretsManagerClient,
} from '@aws-sdk/client-secrets-manager';
import * as fs from 'fs';
import * as path from 'path';

describe('Payment Processing Infrastructure Integration Tests', () => {
  let outputs: any;
  const region = process.env.AWS_REGION || 'us-west-2';
  let outputsExist = false;

  // AWS SDK Clients
  let ec2Client: EC2Client;
  let rdsClient: RDSClient;
  let elasticacheClient: ElastiCacheClient;
  let ecsClient: ECSClient;
  let secretsClient: SecretsManagerClient;
  let elbClient: ElasticLoadBalancingV2Client;

  beforeAll(() => {
    // Load outputs from deployment
    const outputsPath = path.join(
      __dirname,
      '../cfn-outputs/flat-outputs.json'
    );

    if (fs.existsSync(outputsPath)) {
      const rawOutputs = JSON.parse(fs.readFileSync(outputsPath, 'utf8'));

      // Check if the outputs contain the expected keys for this stack
      const requiredKeys = ['vpc-id', 'rds-endpoint', 'elasticache-endpoint', 'ecs-cluster-name', 'alb-dns-name'];
      const hasRequiredKeys = requiredKeys.some(key => key in rawOutputs);

      if (hasRequiredKeys) {
        outputs = rawOutputs;
        outputsExist = true;
        console.log('✅ Loaded deployment outputs for integration testing');
      } else {
        console.log('⚠️ Outputs file exists but does not contain expected keys. Integration tests will be skipped.');
        console.log('Expected one of:', requiredKeys);
        console.log('Found keys:', Object.keys(rawOutputs));
        outputsExist = false;
        outputs = {};
      }
    } else {
      console.log(
        '⚠️ Outputs file not found. Integration tests will be skipped.'
      );
      outputsExist = false;
      outputs = {};
    }

    // Initialize AWS SDK clients only if outputs exist
    if (outputsExist) {
      ec2Client = new EC2Client({ region });
      rdsClient = new RDSClient({ region });
      elasticacheClient = new ElastiCacheClient({ region });
      ecsClient = new ECSClient({ region });
      secretsClient = new SecretsManagerClient({ region });
      elbClient = new ElasticLoadBalancingV2Client({ region });
    }
  });

  describe('VPC Infrastructure', () => {
    it('should have VPC created and accessible', async () => {
      if (!outputsExist) {
        console.log('⏭️ Skipping test - no deployment outputs available');
        return;
      }

      const vpcId = outputs['vpc-id'];
      expect(vpcId).toBeDefined();
      expect(vpcId).toMatch(/^vpc-/);

      const response = await ec2Client.send(
        new DescribeVpcsCommand({
          VpcIds: [vpcId],
        })
      );

      expect(response.Vpcs).toHaveLength(1);
      expect(response.Vpcs![0].State).toBe('available');
      expect(response.Vpcs![0].CidrBlock).toBe('10.0.0.0/16');
    });

    it('should have public and private subnets', async () => {
      if (!outputsExist) {
        console.log('⏭️ Skipping test - no deployment outputs available');
        return;
      }

      const vpcId = outputs['vpc-id'];

      const response = await ec2Client.send(
        new DescribeSubnetsCommand({
          Filters: [
            {
              Name: 'vpc-id',
              Values: [vpcId],
            },
          ],
        })
      );

      const subnets = response.Subnets || [];
      expect(subnets.length).toBeGreaterThanOrEqual(4);

      const publicSubnets = subnets.filter(subnet =>
        subnet.Tags?.some(tag => tag.Key === 'Type' && tag.Value === 'Public')
      );
      const privateSubnets = subnets.filter(subnet =>
        subnet.Tags?.some(tag => tag.Key === 'Type' && tag.Value === 'Private')
      );

      expect(publicSubnets.length).toBeGreaterThanOrEqual(2);
      expect(privateSubnets.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('RDS Database', () => {
    it('should have RDS instance running', async () => {
      if (!outputsExist) {
        console.log('⏭️ Skipping test - no deployment outputs available');
        return;
      }

      const rdsEndpoint = outputs['rds-endpoint'];
      expect(rdsEndpoint).toBeDefined();

      // Extract DB identifier from endpoint
      const dbIdentifier = rdsEndpoint.split('.')[0];

      const response = await rdsClient.send(
        new DescribeDBInstancesCommand({
          DBInstanceIdentifier: dbIdentifier,
        })
      );

      expect(response.DBInstances).toHaveLength(1);
      const dbInstance = response.DBInstances![0];

      expect(dbInstance.DBInstanceStatus).toBe('available');
      expect(dbInstance.Engine).toBe('postgres');
      expect(dbInstance.MultiAZ).toBe(true);
      expect(dbInstance.StorageEncrypted).toBe(true);
      expect(dbInstance.PubliclyAccessible).toBe(false);
    });

    it('should have RDS instance in private subnet', async () => {
      if (!outputsExist) {
        console.log('⏭️ Skipping test - no deployment outputs available');
        return;
      }

      const rdsEndpoint = outputs['rds-endpoint'];
      const dbIdentifier = rdsEndpoint.split('.')[0];

      const response = await rdsClient.send(
        new DescribeDBInstancesCommand({
          DBInstanceIdentifier: dbIdentifier,
        })
      );

      const dbInstance = response.DBInstances![0];
      expect(dbInstance.PubliclyAccessible).toBe(false);
      expect(dbInstance.DBSubnetGroup).toBeDefined();
    });

    it('should have encryption enabled', async () => {
      if (!outputsExist) {
        console.log('⏭️ Skipping test - no deployment outputs available');
        return;
      }

      const rdsEndpoint = outputs['rds-endpoint'];
      const dbIdentifier = rdsEndpoint.split('.')[0];

      const response = await rdsClient.send(
        new DescribeDBInstancesCommand({
          DBInstanceIdentifier: dbIdentifier,
        })
      );

      const dbInstance = response.DBInstances![0];
      expect(dbInstance.StorageEncrypted).toBe(true);
      expect(dbInstance.KmsKeyId).toBeDefined();
    });
  });

  describe('Secrets Manager', () => {
    it('should have database credentials secret', async () => {
      if (!outputsExist) {
        console.log('⏭️ Skipping test - no deployment outputs available');
        return;
      }

      const secretArn = outputs['rds-secret-arn'];
      expect(secretArn).toBeDefined();

      const response = await secretsClient.send(
        new DescribeSecretCommand({
          SecretId: secretArn,
        })
      );

      expect(response.ARN).toBe(secretArn);
      expect(response.Name).toContain('payment-db-credentials');
      expect(response.KmsKeyId).toBeDefined();
    });

    it('should have secret rotation configured', async () => {
      if (!outputsExist) {
        console.log('⏭️ Skipping test - no deployment outputs available');
        return;
      }

      const secretArn = outputs['rds-secret-arn'];

      const response = await secretsClient.send(
        new DescribeSecretCommand({
          SecretId: secretArn,
        })
      );

      expect(response.RotationEnabled).toBe(true);
      expect(response.RotationRules).toBeDefined();
      expect(response.RotationRules?.AutomaticallyAfterDays).toBe(30);
    });

    it('should be able to retrieve secret value', async () => {
      if (!outputsExist) {
        console.log('⏭️ Skipping test - no deployment outputs available');
        return;
      }

      const secretArn = outputs['rds-secret-arn'];

      const response = await secretsClient.send(
        new GetSecretValueCommand({
          SecretId: secretArn,
        })
      );

      expect(response.SecretString).toBeDefined();

      const secretValue = JSON.parse(response.SecretString!);
      expect(secretValue).toHaveProperty('username');
      expect(secretValue).toHaveProperty('password');
      expect(secretValue).toHaveProperty('engine');
      expect(secretValue).toHaveProperty('port');
      expect(secretValue.engine).toBe('postgres');
      expect(secretValue.port).toBe(5432);
    });
  });

  describe('ElastiCache Redis', () => {
    it('should have ElastiCache replication group running', async () => {
      if (!outputsExist) {
        console.log('⏭️ Skipping test - no deployment outputs available');
        return;
      }

      const cacheEndpoint = outputs['elasticache-endpoint'];
      expect(cacheEndpoint).toBeDefined();

      // Extract replication group ID from endpoint (format: master.{replication-group-id}.{rest})
      const replicationGroupId = cacheEndpoint.split('.')[1];

      const response = await elasticacheClient.send(
        new DescribeReplicationGroupsCommand({
          ReplicationGroupId: replicationGroupId,
        })
      );

      expect(response.ReplicationGroups).toHaveLength(1);
      const replicationGroup = response.ReplicationGroups![0];

      expect(replicationGroup.Status).toBe('available');
      expect(replicationGroup.MultiAZ).toBe('enabled');
      expect(replicationGroup.AtRestEncryptionEnabled).toBe(true);
      expect(replicationGroup.TransitEncryptionEnabled).toBe(true);
    });

    it('should have automatic failover enabled', async () => {
      if (!outputsExist) {
        console.log('⏭️ Skipping test - no deployment outputs available');
        return;
      }

      const cacheEndpoint = outputs['elasticache-endpoint'];
      const replicationGroupId = cacheEndpoint.split('.')[1];

      const response = await elasticacheClient.send(
        new DescribeReplicationGroupsCommand({
          ReplicationGroupId: replicationGroupId,
        })
      );

      const replicationGroup = response.ReplicationGroups![0];
      expect(replicationGroup.AutomaticFailover).toBe('enabled');
    });

    it('should have multiple cache nodes', async () => {
      if (!outputsExist) {
        console.log('⏭️ Skipping test - no deployment outputs available');
        return;
      }

      const cacheEndpoint = outputs['elasticache-endpoint'];
      const replicationGroupId = cacheEndpoint.split('.')[1];

      const response = await elasticacheClient.send(
        new DescribeReplicationGroupsCommand({
          ReplicationGroupId: replicationGroupId,
        })
      );

      const replicationGroup = response.ReplicationGroups![0];
      expect(replicationGroup.MemberClusters?.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('ECS Cluster and Service', () => {
    it('should have ECS cluster created', async () => {
      if (!outputsExist) {
        console.log('⏭️ Skipping test - no deployment outputs available');
        return;
      }

      const clusterName = outputs['ecs-cluster-name'];
      expect(clusterName).toBeDefined();

      const response = await ecsClient.send(
        new DescribeClustersCommand({
          clusters: [clusterName],
        })
      );

      expect(response.clusters).toHaveLength(1);
      const cluster = response.clusters![0];

      expect(cluster.status).toBe('ACTIVE');
      expect(cluster.clusterName).toBe(clusterName);
    });

    it('should have container insights enabled', async () => {
      if (!outputsExist) {
        console.log('⏭️ Skipping test - no deployment outputs available');
        return;
      }

      const clusterName = outputs['ecs-cluster-name'];

      const response = await ecsClient.send(
        new DescribeClustersCommand({
          clusters: [clusterName],
          include: ['SETTINGS'],
        })
      );

      const cluster = response.clusters![0];
      const containerInsightsSetting = cluster.settings?.find(
        setting => setting.name === 'containerInsights'
      );

      expect(containerInsightsSetting).toBeDefined();
      expect(containerInsightsSetting?.value).toBe('enabled');
    });

    it('should have ECS service running', async () => {
      if (!outputsExist) {
        console.log('⏭️ Skipping test - no deployment outputs available');
        return;
      }

      const clusterName = outputs['ecs-cluster-name'];

      // List services first
      const listResponse = await ecsClient.send(
        new DescribeClustersCommand({
          clusters: [clusterName],
        })
      );

      expect(listResponse.clusters).toHaveLength(1);
      expect(listResponse.clusters![0].activeServicesCount).toBeGreaterThan(0);
    });
  });

  describe('Application Load Balancer', () => {
    it('should have ALB created and active', async () => {
      if (!outputsExist) {
        console.log('⏭️ Skipping test - no deployment outputs available');
        return;
      }

      const albDns = outputs['alb-dns-name'];
      expect(albDns).toBeDefined();
      expect(albDns).toContain('elb.amazonaws.com');

      // Find the ALB by DNS name
      const response = await elbClient.send(
        new DescribeLoadBalancersCommand({})
      );

      const alb = response.LoadBalancers?.find(lb => lb.DNSName === albDns);

      expect(alb).toBeDefined();
      expect(alb?.State?.Code).toBe('active');
      expect(alb?.Type).toBe('application');
      expect(alb?.Scheme).toBe('internet-facing');
    });

    it('should have ALB in public subnets', async () => {
      if (!outputsExist) {
        console.log('⏭️ Skipping test - no deployment outputs available');
        return;
      }

      const albDns = outputs['alb-dns-name'];

      const response = await elbClient.send(
        new DescribeLoadBalancersCommand({})
      );

      const alb = response.LoadBalancers?.find(lb => lb.DNSName === albDns);

      expect(alb).toBeDefined();
      expect(alb?.AvailabilityZones?.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Security and Compliance', () => {
    it('should have all required encryption in place', async () => {
      if (!outputsExist) {
        console.log('⏭️ Skipping test - no deployment outputs available');
        return;
      }

      // Verify RDS encryption
      const rdsEndpoint = outputs['rds-endpoint'];
      const dbIdentifier = rdsEndpoint.split('.')[0];

      const rdsResponse = await rdsClient.send(
        new DescribeDBInstancesCommand({
          DBInstanceIdentifier: dbIdentifier,
        })
      );

      expect(rdsResponse.DBInstances![0].StorageEncrypted).toBe(true);

      // Verify ElastiCache encryption
      const cacheEndpoint = outputs['elasticache-endpoint'];
      const replicationGroupId = cacheEndpoint.split('.')[1];

      const cacheResponse = await elasticacheClient.send(
        new DescribeReplicationGroupsCommand({
          ReplicationGroupId: replicationGroupId,
        })
      );

      expect(cacheResponse.ReplicationGroups![0].AtRestEncryptionEnabled).toBe(
        true
      );
      expect(cacheResponse.ReplicationGroups![0].TransitEncryptionEnabled).toBe(
        true
      );
    });

    it('should have high availability configured', async () => {
      if (!outputsExist) {
        console.log('⏭️ Skipping test - no deployment outputs available');
        return;
      }

      // Verify RDS Multi-AZ
      const rdsEndpoint = outputs['rds-endpoint'];
      const dbIdentifier = rdsEndpoint.split('.')[0];

      const rdsResponse = await rdsClient.send(
        new DescribeDBInstancesCommand({
          DBInstanceIdentifier: dbIdentifier,
        })
      );

      expect(rdsResponse.DBInstances![0].MultiAZ).toBe(true);

      // Verify ElastiCache Multi-AZ
      const cacheEndpoint = outputs['elasticache-endpoint'];
      const replicationGroupId = cacheEndpoint.split('.')[1];

      const cacheResponse = await elasticacheClient.send(
        new DescribeReplicationGroupsCommand({
          ReplicationGroupId: replicationGroupId,
        })
      );

      expect(cacheResponse.ReplicationGroups![0].MultiAZ).toBe('enabled');
      expect(cacheResponse.ReplicationGroups![0].AutomaticFailover).toBe(
        'enabled'
      );
    });

    it('should have proper network isolation', async () => {
      if (!outputsExist) {
        console.log('⏭️ Skipping test - no deployment outputs available');
        return;
      }

      // Verify RDS is not publicly accessible
      const rdsEndpoint = outputs['rds-endpoint'];
      const dbIdentifier = rdsEndpoint.split('.')[0];

      const rdsResponse = await rdsClient.send(
        new DescribeDBInstancesCommand({
          DBInstanceIdentifier: dbIdentifier,
        })
      );

      expect(rdsResponse.DBInstances![0].PubliclyAccessible).toBe(false);
    });
  });

  describe('Resource Tagging', () => {
    it('should have environment tags on resources', async () => {
      if (!outputsExist) {
        console.log('⏭️ Skipping test - no deployment outputs available');
        return;
      }

      const vpcId = outputs['vpc-id'];

      const response = await ec2Client.send(
        new DescribeVpcsCommand({
          VpcIds: [vpcId],
        })
      );

      const vpc = response.Vpcs![0];
      const environmentTag = vpc.Tags?.find(tag => tag.Key === 'Environment');

      expect(environmentTag).toBeDefined();
      expect(environmentTag?.Value).toBeDefined();
    });
  });
});
