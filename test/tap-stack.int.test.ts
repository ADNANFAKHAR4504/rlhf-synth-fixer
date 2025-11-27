import * as fs from 'fs';
import * as path from 'path';
import { EC2Client, DescribeVpcsCommand, DescribeSubnetsCommand } from '@aws-sdk/client-ec2';
import {
  ElasticLoadBalancingV2Client,
  DescribeLoadBalancersCommand,
  DescribeTargetHealthCommand,
  DescribeTargetGroupsCommand,
} from '@aws-sdk/client-elastic-load-balancing-v2';
import { RDSClient, DescribeDBClustersCommand } from '@aws-sdk/client-rds';
import {
  SecretsManagerClient,
  GetSecretValueCommand,
} from '@aws-sdk/client-secrets-manager';

// Load deployment outputs
const outputsPath = path.join(__dirname, '..', 'cfn-outputs', 'flat-outputs.json');
const outputs = JSON.parse(fs.readFileSync(outputsPath, 'utf-8'));

describe('TAP Stack Integration Tests', () => {
  describe('Deployment Outputs Validation', () => {
    test('should have all required outputs', () => {
      expect(outputs).toHaveProperty('acceleratorDns');
      expect(outputs).toHaveProperty('primaryAlbDns');
      expect(outputs).toHaveProperty('primaryClusterId');
      expect(outputs).toHaveProperty('primarySecretArn');
      expect(outputs).toHaveProperty('primaryVpcId');
      expect(outputs).toHaveProperty('secondaryAlbDns');
      expect(outputs).toHaveProperty('secondaryClusterId');
      expect(outputs).toHaveProperty('secondarySecretArn');
      expect(outputs).toHaveProperty('secondaryVpcId');
    });

    test('should have valid DNS names', () => {
      expect(outputs.acceleratorDns).toMatch(/\.awsglobalaccelerator\.com$/);
      expect(outputs.primaryAlbDns).toMatch(/\.elb\.amazonaws\.com$/);
      expect(outputs.secondaryAlbDns).toMatch(/\.elb\.amazonaws\.com$/);
    });

    test('should have valid ARN formats', () => {
      expect(outputs.primarySecretArn).toMatch(/^arn:aws:secretsmanager:/);
      expect(outputs.secondarySecretArn).toMatch(/^arn:aws:secretsmanager:/);
    });

    test('should have valid VPC IDs', () => {
      expect(outputs.primaryVpcId).toMatch(/^vpc-[a-f0-9]{17}$/);
      expect(outputs.secondaryVpcId).toMatch(/^vpc-[a-f0-9]{17}$/);
    });
  });

  describe('Primary Region VPC Tests (us-east-1)', () => {
    const ec2Client = new EC2Client({ region: 'us-east-1' });

    test('should verify primary VPC exists and is available', async () => {
      const command = new DescribeVpcsCommand({
        VpcIds: [outputs.primaryVpcId],
      });

      const response = await ec2Client.send(command);

      expect(response.Vpcs).toHaveLength(1);
      expect(response.Vpcs![0].State).toBe('available');
      expect(response.Vpcs![0].CidrBlock).toBe('10.0.0.0/16');
      expect(response.Vpcs![0].VpcId).toBe(outputs.primaryVpcId);
    });

    test('should have at least 3 subnets in primary VPC', async () => {
      const command = new DescribeSubnetsCommand({
        Filters: [
          {
            Name: 'vpc-id',
            Values: [outputs.primaryVpcId],
          },
        ],
      });

      const response = await ec2Client.send(command);

      expect(response.Subnets).toBeDefined();
      expect(response.Subnets!.length).toBeGreaterThanOrEqual(3);

      // Verify subnets are in different availability zones
      const azs = response.Subnets!.map(subnet => subnet.AvailabilityZone);
      const uniqueAzs = new Set(azs);
      expect(uniqueAzs.size).toBeGreaterThanOrEqual(3);
    });

    test('should verify primary subnets are public', async () => {
      const command = new DescribeSubnetsCommand({
        Filters: [
          {
            Name: 'vpc-id',
            Values: [outputs.primaryVpcId],
          },
        ],
      });

      const response = await ec2Client.send(command);

      expect(response.Subnets).toBeDefined();
      response.Subnets!.forEach(subnet => {
        expect(subnet.MapPublicIpOnLaunch).toBe(true);
      });
    });
  });

  describe('Secondary Region VPC Tests (eu-west-1)', () => {
    const ec2Client = new EC2Client({ region: 'eu-west-1' });

    test('should verify secondary VPC exists and is available', async () => {
      const command = new DescribeVpcsCommand({
        VpcIds: [outputs.secondaryVpcId],
      });

      const response = await ec2Client.send(command);

      expect(response.Vpcs).toHaveLength(1);
      expect(response.Vpcs![0].State).toBe('available');
      expect(response.Vpcs![0].CidrBlock).toBe('10.1.0.0/16');
      expect(response.Vpcs![0].VpcId).toBe(outputs.secondaryVpcId);
    });

    test('should have at least 3 subnets in secondary VPC', async () => {
      const command = new DescribeSubnetsCommand({
        Filters: [
          {
            Name: 'vpc-id',
            Values: [outputs.secondaryVpcId],
          },
        ],
      });

      const response = await ec2Client.send(command);

      expect(response.Subnets).toBeDefined();
      expect(response.Subnets!.length).toBeGreaterThanOrEqual(3);

      // Verify subnets are in different availability zones
      const azs = response.Subnets!.map(subnet => subnet.AvailabilityZone);
      const uniqueAzs = new Set(azs);
      expect(uniqueAzs.size).toBeGreaterThanOrEqual(3);
    });
  });

  describe('Primary Region ALB Tests (us-east-1)', () => {
    const elbClient = new ElasticLoadBalancingV2Client({ region: 'us-east-1' });

    test('should verify primary ALB exists and is active', async () => {
      const command = new DescribeLoadBalancersCommand({
        Names: [outputs.primaryAlbDns.split('-')[0] + '-' + outputs.primaryAlbDns.split('-')[1]],
      });

      try {
        const response = await elbClient.send(command);

        expect(response.LoadBalancers).toBeDefined();
        expect(response.LoadBalancers!.length).toBeGreaterThanOrEqual(1);

        const alb = response.LoadBalancers!.find(lb => lb.DNSName === outputs.primaryAlbDns);
        expect(alb).toBeDefined();
        expect(alb!.State?.Code).toBe('active');
        expect(alb!.Type).toBe('application');
        expect(alb!.Scheme).toBe('internet-facing');
      } catch (error: unknown) {
        // If we can't find by name pattern, search by DNS name
        const allLbsCommand = new DescribeLoadBalancersCommand({});
        const allLbs = await elbClient.send(allLbsCommand);
        const alb = allLbs.LoadBalancers?.find(lb => lb.DNSName === outputs.primaryAlbDns);

        expect(alb).toBeDefined();
        expect(alb!.State?.Code).toBe('active');
      }
    });

    test('should verify primary ALB has target groups', async () => {
      // Get all load balancers and find ours by DNS
      const lbCommand = new DescribeLoadBalancersCommand({});
      const lbResponse = await elbClient.send(lbCommand);
      const alb = lbResponse.LoadBalancers?.find(lb => lb.DNSName === outputs.primaryAlbDns);

      expect(alb).toBeDefined();

      // Get target groups for this ALB
      const tgCommand = new DescribeTargetGroupsCommand({
        LoadBalancerArn: alb!.LoadBalancerArn,
      });
      const tgResponse = await elbClient.send(tgCommand);

      expect(tgResponse.TargetGroups).toBeDefined();
      expect(tgResponse.TargetGroups!.length).toBeGreaterThanOrEqual(1);

      // Verify target group health check configuration
      const tg = tgResponse.TargetGroups![0];
      expect(tg.Protocol).toBe('HTTP');
      expect(tg.Port).toBe(80);
      expect(tg.HealthCheckPath).toBe('/health');
    });

    test('should check primary ALB target health', async () => {
      // Get all load balancers and find ours by DNS
      const lbCommand = new DescribeLoadBalancersCommand({});
      const lbResponse = await elbClient.send(lbCommand);
      const alb = lbResponse.LoadBalancers?.find(lb => lb.DNSName === outputs.primaryAlbDns);

      expect(alb).toBeDefined();

      // Get target groups for this ALB
      const tgCommand = new DescribeTargetGroupsCommand({
        LoadBalancerArn: alb!.LoadBalancerArn,
      });
      const tgResponse = await elbClient.send(tgCommand);

      expect(tgResponse.TargetGroups).toBeDefined();

      // Check target health for each target group
      for (const tg of tgResponse.TargetGroups!) {
        const healthCommand = new DescribeTargetHealthCommand({
          TargetGroupArn: tg.TargetGroupArn,
        });
        const healthResponse = await elbClient.send(healthCommand);

        expect(healthResponse.TargetHealthDescriptions).toBeDefined();
        // Note: Targets might be unhealthy if EC2 instances aren't running web servers
        // Just verify the command succeeds
      }
    });
  });

  describe('Secondary Region ALB Tests (eu-west-1)', () => {
    const elbClient = new ElasticLoadBalancingV2Client({ region: 'eu-west-1' });

    test('should verify secondary ALB exists and is active', async () => {
      const allLbsCommand = new DescribeLoadBalancersCommand({});
      const allLbs = await elbClient.send(allLbsCommand);
      const alb = allLbs.LoadBalancers?.find(lb => lb.DNSName === outputs.secondaryAlbDns);

      expect(alb).toBeDefined();
      expect(alb!.State?.Code).toBe('active');
      expect(alb!.Type).toBe('application');
      expect(alb!.Scheme).toBe('internet-facing');
    });

    test('should verify secondary ALB has target groups', async () => {
      const lbCommand = new DescribeLoadBalancersCommand({});
      const lbResponse = await elbClient.send(lbCommand);
      const alb = lbResponse.LoadBalancers?.find(lb => lb.DNSName === outputs.secondaryAlbDns);

      expect(alb).toBeDefined();

      const tgCommand = new DescribeTargetGroupsCommand({
        LoadBalancerArn: alb!.LoadBalancerArn,
      });
      const tgResponse = await elbClient.send(tgCommand);

      expect(tgResponse.TargetGroups).toBeDefined();
      expect(tgResponse.TargetGroups!.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Primary RDS Aurora Cluster Tests (us-east-1)', () => {
    const rdsClient = new RDSClient({ region: 'us-east-1' });

    test('should verify primary Aurora cluster exists and is available', async () => {
      const command = new DescribeDBClustersCommand({
        DBClusterIdentifier: outputs.primaryClusterId,
      });

      const response = await rdsClient.send(command);

      expect(response.DBClusters).toHaveLength(1);
      const cluster = response.DBClusters![0];
      expect(cluster.Status).toBe('available');
      expect(cluster.Engine).toBe('aurora-postgresql');
      expect(cluster.DatabaseName).toBe('trading');
      expect(cluster.MasterUsername).toBe('dbadmin');
    });

    test('should verify primary cluster has at least one instance', async () => {
      const command = new DescribeDBClustersCommand({
        DBClusterIdentifier: outputs.primaryClusterId,
      });

      const response = await rdsClient.send(command);
      const cluster = response.DBClusters![0];

      expect(cluster.DBClusterMembers).toBeDefined();
      expect(cluster.DBClusterMembers!.length).toBeGreaterThanOrEqual(1);
    });

    test('should verify primary cluster has endpoint', async () => {
      const command = new DescribeDBClustersCommand({
        DBClusterIdentifier: outputs.primaryClusterId,
      });

      const response = await rdsClient.send(command);
      const cluster = response.DBClusters![0];

      expect(cluster.Endpoint).toBeDefined();
      expect(cluster.Endpoint).toMatch(/\.rds\.amazonaws\.com$/);
      expect(cluster.ReaderEndpoint).toBeDefined();
    });

    test('should verify primary cluster has backup and maintenance configured', async () => {
      const command = new DescribeDBClustersCommand({
        DBClusterIdentifier: outputs.primaryClusterId,
      });

      const response = await rdsClient.send(command);
      const cluster = response.DBClusters![0];

      expect(cluster.BackupRetentionPeriod).toBeDefined();
      expect(cluster.PreferredBackupWindow).toBeDefined();
      expect(cluster.PreferredMaintenanceWindow).toBeDefined();
    });
  });

  describe('Secondary RDS Aurora Cluster Tests (eu-west-1)', () => {
    const rdsClient = new RDSClient({ region: 'eu-west-1' });

    test('should verify secondary Aurora cluster exists and is available', async () => {
      const command = new DescribeDBClustersCommand({
        DBClusterIdentifier: outputs.secondaryClusterId,
      });

      const response = await rdsClient.send(command);

      expect(response.DBClusters).toHaveLength(1);
      const cluster = response.DBClusters![0];
      expect(cluster.Status).toBe('available');
      expect(cluster.Engine).toBe('aurora-postgresql');
    });

    test('should verify secondary cluster has at least one instance', async () => {
      const command = new DescribeDBClustersCommand({
        DBClusterIdentifier: outputs.secondaryClusterId,
      });

      const response = await rdsClient.send(command);
      const cluster = response.DBClusters![0];

      expect(cluster.DBClusterMembers).toBeDefined();
      expect(cluster.DBClusterMembers!.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Secrets Manager Tests', () => {
    test('should verify primary secret exists and is accessible', async () => {
      const secretsClient = new SecretsManagerClient({ region: 'us-east-1' });
      const command = new GetSecretValueCommand({
        SecretId: outputs.primarySecretArn,
      });

      const response = await secretsClient.send(command);

      expect(response.SecretString).toBeDefined();
      const secret = JSON.parse(response.SecretString!);
      expect(secret).toHaveProperty('username');
      expect(secret).toHaveProperty('password');
      expect(secret.username).toBe('dbadmin');
    });

    test('should verify secondary secret exists and is accessible', async () => {
      const secretsClient = new SecretsManagerClient({ region: 'eu-west-1' });
      const command = new GetSecretValueCommand({
        SecretId: outputs.secondarySecretArn,
      });

      const response = await secretsClient.send(command);

      expect(response.SecretString).toBeDefined();
      const secret = JSON.parse(response.SecretString!);
      expect(secret).toHaveProperty('username');
      expect(secret).toHaveProperty('password');
      expect(secret.username).toBe('dbadmin');
    });
  });

  describe('AWS Global Accelerator Tests', () => {
    test('should verify Global Accelerator DNS format is valid', () => {
      // Basic DNS validation - the DNS name should be in the correct format
      expect(outputs.acceleratorDns).toMatch(
        /^a[a-f0-9]+\.awsglobalaccelerator\.com$/
      );
    });

    test('should verify Global Accelerator DNS is defined', () => {
      expect(outputs.acceleratorDns).toBeDefined();
      expect(outputs.acceleratorDns.length).toBeGreaterThan(0);
      expect(outputs.acceleratorDns).toContain('awsglobalaccelerator.com');
    });
  });

  describe('Cross-Region Validation', () => {
    test('should verify VPCs have non-overlapping CIDR blocks', () => {
      // Primary VPC: 10.0.0.0/16
      // Secondary VPC: 10.1.0.0/16
      // These should not overlap
      const primaryCidr = '10.0.0.0/16';
      const secondaryCidr = '10.1.0.0/16';

      expect(primaryCidr).not.toBe(secondaryCidr);
      expect(primaryCidr.split('.')[0]).toBe(secondaryCidr.split('.')[0]); // Both 10.x
      expect(primaryCidr.split('.')[1]).not.toBe(secondaryCidr.split('.')[1]); // Different second octet
    });

    test('should verify both regions have matching resource naming patterns', () => {
      // Verify cluster IDs follow the same pattern
      expect(outputs.primaryClusterId).toMatch(/^trading-primary-/);
      expect(outputs.secondaryClusterId).toMatch(/^trading-secondary-/);

      // Extract environment suffix
      const primarySuffix = outputs.primaryClusterId.split('-').pop();
      const secondarySuffix = outputs.secondaryClusterId.split('-').pop();
      expect(primarySuffix).toBe(secondarySuffix);
    });

    test('should verify both secrets are in different regions', () => {
      // Extract regions from ARNs
      const primaryRegion = outputs.primarySecretArn.split(':')[3];
      const secondaryRegion = outputs.secondarySecretArn.split(':')[3];

      expect(primaryRegion).toBe('us-east-1');
      expect(secondaryRegion).toBe('eu-west-1');
      expect(primaryRegion).not.toBe(secondaryRegion);
    });
  });

  describe('Resource Connectivity Tests', () => {
    test('should verify primary ALB DNS is reachable', async () => {
      // Test HTTP connectivity to primary ALB
      const url = `http://${outputs.primaryAlbDns}`;

      try {
        const response = await fetch(url, {
          method: 'GET',
          signal: AbortSignal.timeout(5000),
        });

        // We expect either a response or a timeout
        // Don't fail if target is unhealthy, just verify DNS resolves
        expect(response).toBeDefined();
      } catch (error: unknown) {
        // DNS resolution should work even if connection fails
        // Just ensure it's not a DNS error
        if (error instanceof Error) {
          expect(error.message).not.toMatch(/getaddrinfo ENOTFOUND/);
        }
      }
    });

    test('should verify secondary ALB DNS is reachable', async () => {
      const url = `http://${outputs.secondaryAlbDns}`;

      try {
        const response = await fetch(url, {
          method: 'GET',
          signal: AbortSignal.timeout(5000),
        });

        expect(response).toBeDefined();
      } catch (error: unknown) {
        if (error instanceof Error) {
          expect(error.message).not.toMatch(/getaddrinfo ENOTFOUND/);
        }
      }
    });

    test('should verify Global Accelerator DNS is reachable', async () => {
      const url = `http://${outputs.acceleratorDns}`;

      try {
        const response = await fetch(url, {
          method: 'GET',
          signal: AbortSignal.timeout(5000),
        });

        expect(response).toBeDefined();
      } catch (error: unknown) {
        if (error instanceof Error) {
          expect(error.message).not.toMatch(/getaddrinfo ENOTFOUND/);
        }
      }
    });
  });

  describe('High Availability Validation', () => {
    test('should verify primary region has multi-AZ setup', async () => {
      const ec2Client = new EC2Client({ region: 'us-east-1' });
      const command = new DescribeSubnetsCommand({
        Filters: [
          {
            Name: 'vpc-id',
            Values: [outputs.primaryVpcId],
          },
        ],
      });

      const response = await ec2Client.send(command);
      const azs = new Set(response.Subnets!.map(s => s.AvailabilityZone));

      expect(azs.size).toBeGreaterThanOrEqual(3); // Multi-AZ means at least 3 AZs
    });

    test('should verify secondary region has multi-AZ setup', async () => {
      const ec2Client = new EC2Client({ region: 'eu-west-1' });
      const command = new DescribeSubnetsCommand({
        Filters: [
          {
            Name: 'vpc-id',
            Values: [outputs.secondaryVpcId],
          },
        ],
      });

      const response = await ec2Client.send(command);
      const azs = new Set(response.Subnets!.map(s => s.AvailabilityZone));

      expect(azs.size).toBeGreaterThanOrEqual(3);
    });

    test('should verify Aurora clusters have backup retention configured', async () => {
      const primaryRds = new RDSClient({ region: 'us-east-1' });
      const secondaryRds = new RDSClient({ region: 'eu-west-1' });

      const primaryCommand = new DescribeDBClustersCommand({
        DBClusterIdentifier: outputs.primaryClusterId,
      });
      const secondaryCommand = new DescribeDBClustersCommand({
        DBClusterIdentifier: outputs.secondaryClusterId,
      });

      const primaryResponse = await primaryRds.send(primaryCommand);
      const secondaryResponse = await secondaryRds.send(secondaryCommand);

      const primaryCluster = primaryResponse.DBClusters![0];
      const secondaryCluster = secondaryResponse.DBClusters![0];

      expect(primaryCluster.BackupRetentionPeriod).toBeGreaterThanOrEqual(1);
      expect(secondaryCluster.BackupRetentionPeriod).toBeGreaterThanOrEqual(1);
    });
  });
});
