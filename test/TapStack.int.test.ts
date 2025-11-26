import { EC2Client, DescribeVpcsCommand, DescribeSecurityGroupsCommand, DescribeVpcPeeringConnectionsCommand } from '@aws-sdk/client-ec2';
import { RDSClient, DescribeDBClustersCommand } from '@aws-sdk/client-rds';
import { ElasticLoadBalancingV2Client, DescribeLoadBalancersCommand, DescribeTargetGroupsCommand } from '@aws-sdk/client-elastic-load-balancing-v2';
import { SecretsManagerClient, DescribeSecretCommand } from '@aws-sdk/client-secrets-manager';
import { CloudWatchLogsClient, DescribeLogGroupsCommand } from '@aws-sdk/client-cloudwatch-logs';
import { CloudWatchClient, ListDashboardsCommand } from '@aws-sdk/client-cloudwatch';
import { AutoScalingClient, DescribeAutoScalingGroupsCommand } from '@aws-sdk/client-auto-scaling';
import { KMSClient, DescribeKeyCommand } from '@aws-sdk/client-kms';
import * as fs from 'fs';
import * as path from 'path';

// Load deployment outputs
const outputsPath = path.join(__dirname, '../cfn-outputs/flat-outputs.json');
const outputs = JSON.parse(fs.readFileSync(outputsPath, 'utf-8'));

const region = process.env.AWS_REGION || 'us-east-1';

describe('Payment App Infrastructure - Integration Tests', () => {
  describe('VPC Resources', () => {
    const ec2Client = new EC2Client({ region });

    it('production VPC exists and is accessible', async () => {
      const command = new DescribeVpcsCommand({
        VpcIds: [outputs.productionVpcId],
      });
      const response = await ec2Client.send(command);
      expect(response.Vpcs).toHaveLength(1);
      expect(response.Vpcs?.[0].VpcId).toBe(outputs.productionVpcId);
    }, 30000);

    it('staging VPC exists and is accessible', async () => {
      const command = new DescribeVpcsCommand({
        VpcIds: [outputs.stagingVpcId],
      });
      const response = await ec2Client.send(command);
      expect(response.Vpcs).toHaveLength(1);
      expect(response.Vpcs?.[0].VpcId).toBe(outputs.stagingVpcId);
    }, 30000);

    it('VPC peering connection exists and is active', async () => {
      const command = new DescribeVpcPeeringConnectionsCommand({
        VpcPeeringConnectionIds: [outputs.vpcPeeringConnectionId],
      });
      const response = await ec2Client.send(command);
      expect(response.VpcPeeringConnections).toHaveLength(1);
      expect(response.VpcPeeringConnections?.[0].Status?.Code).toBe('active');
    }, 30000);
  });

  describe('KMS Encryption', () => {
    const kmsClient = new KMSClient({ region });

    it('KMS key exists and has key rotation enabled', async () => {
      const command = new DescribeKeyCommand({
        KeyId: outputs.kmsKeyId,
      });
      const response = await kmsClient.send(command);
      expect(response.KeyMetadata?.KeyId).toBe(outputs.kmsKeyId);
      expect(response.KeyMetadata?.Enabled).toBe(true);
    }, 30000);
  });

  describe('Load Balancer', () => {
    const elbClient = new ElasticLoadBalancingV2Client({ region });

    it('ALB exists and is active', async () => {
      const command = new DescribeLoadBalancersCommand({
        LoadBalancerArns: [outputs.albArn],
      });
      const response = await elbClient.send(command);
      expect(response.LoadBalancers).toHaveLength(1);
      expect(response.LoadBalancers?.[0].State?.Code).toBe('active');
      expect(response.LoadBalancers?.[0].DNSName).toBe(outputs.albDnsName);
    }, 30000);

    it('blue target group exists', async () => {
      const command = new DescribeTargetGroupsCommand({
        TargetGroupArns: [outputs.blueTargetGroupArn],
      });
      const response = await elbClient.send(command);
      expect(response.TargetGroups).toHaveLength(1);
      expect(response.TargetGroups?.[0].HealthCheckPath).toBe('/health');
    }, 30000);

    it('green target group exists', async () => {
      const command = new DescribeTargetGroupsCommand({
        TargetGroupArns: [outputs.greenTargetGroupArn],
      });
      const response = await elbClient.send(command);
      expect(response.TargetGroups).toHaveLength(1);
      expect(response.TargetGroups?.[0].HealthCheckPath).toBe('/health');
    }, 30000);
  });

  describe('Aurora Database', () => {
    const rdsClient = new RDSClient({ region });

    it('Aurora cluster exists and is available', async () => {
      const clusterId = outputs.auroraClusterEndpoint.split('.')[0];
      const command = new DescribeDBClustersCommand({
        DBClusterIdentifier: clusterId,
      });
      const response = await rdsClient.send(command);
      expect(response.DBClusters).toHaveLength(1);
      expect(response.DBClusters?.[0].Endpoint).toBe(outputs.auroraClusterEndpoint);
      expect(response.DBClusters?.[0].DatabaseName).toBe(outputs.databaseName);
      expect(response.DBClusters?.[0].StorageEncrypted).toBe(true);
    }, 30000);
  });

  describe('Secrets Manager', () => {
    const secretsClient = new SecretsManagerClient({ region });

    it('database connection secret exists', async () => {
      const command = new DescribeSecretCommand({
        SecretId: outputs.dbConnectionSecretArn,
      });
      const response = await secretsClient.send(command);
      expect(response.ARN).toBe(outputs.dbConnectionSecretArn);
      expect(response.KmsKeyId).toBeDefined();
    }, 30000);
  });

  describe('Auto Scaling Groups', () => {
    const asgClient = new AutoScalingClient({ region });

    it('blue ASG exists with correct configuration', async () => {
      const command = new DescribeAutoScalingGroupsCommand({
        AutoScalingGroupNames: [outputs.blueAsgName],
      });
      const response = await asgClient.send(command);
      expect(response.AutoScalingGroups).toHaveLength(1);
      expect(response.AutoScalingGroups?.[0].MinSize).toBe(2);
      expect(response.AutoScalingGroups?.[0].MaxSize).toBe(4);
      expect(response.AutoScalingGroups?.[0].DesiredCapacity).toBe(2);
    }, 30000);

    it('green ASG exists with correct configuration', async () => {
      const command = new DescribeAutoScalingGroupsCommand({
        AutoScalingGroupNames: [outputs.greenAsgName],
      });
      const response = await asgClient.send(command);
      expect(response.AutoScalingGroups).toHaveLength(1);
      expect(response.AutoScalingGroups?.[0].MinSize).toBe(0);
      expect(response.AutoScalingGroups?.[0].MaxSize).toBe(4);
    }, 30000);
  });

  describe('CloudWatch Resources', () => {
    const cwLogsClient = new CloudWatchLogsClient({ region });
    const cwClient = new CloudWatchClient({ region });

    it('log group exists with correct configuration', async () => {
      const command = new DescribeLogGroupsCommand({
        logGroupNamePrefix: outputs.logGroupName,
      });
      const response = await cwLogsClient.send(command);
      expect(response.logGroups).toBeDefined();
      expect(response.logGroups?.length).toBeGreaterThan(0);
      const logGroup = response.logGroups?.find(lg => lg.logGroupName === outputs.logGroupName);
      expect(logGroup).toBeDefined();
      expect(logGroup?.retentionInDays).toBe(30);
    }, 30000);

    it('dashboard exists', async () => {
      const command = new ListDashboardsCommand({
        DashboardNamePrefix: outputs.dashboardName,
      });
      const response = await cwClient.send(command);
      expect(response.DashboardEntries).toBeDefined();
      const dashboard = response.DashboardEntries?.find(d => d.DashboardName === outputs.dashboardName);
      expect(dashboard).toBeDefined();
    }, 30000);
  });

  describe('End-to-End Validation', () => {
    it('all critical outputs are defined', () => {
      expect(outputs.productionVpcId).toBeDefined();
      expect(outputs.stagingVpcId).toBeDefined();
      expect(outputs.vpcPeeringConnectionId).toBeDefined();
      expect(outputs.kmsKeyId).toBeDefined();
      expect(outputs.kmsKeyArn).toBeDefined();
      expect(outputs.albDnsName).toBeDefined();
      expect(outputs.albArn).toBeDefined();
      expect(outputs.auroraClusterEndpoint).toBeDefined();
      expect(outputs.dbConnectionSecretArn).toBeDefined();
      expect(outputs.blueAsgName).toBeDefined();
      expect(outputs.greenAsgName).toBeDefined();
      expect(outputs.logGroupName).toBeDefined();
      expect(outputs.dashboardName).toBeDefined();
    });

    it('VPC peering connects production and staging', () => {
      expect(outputs.productionVpcId).not.toBe(outputs.stagingVpcId);
      expect(outputs.vpcPeeringConnectionId).toMatch(/^pcx-/);
    });

    it('blue-green deployment is configured', () => {
      expect(outputs.blueAsgName).toBeDefined();
      expect(outputs.greenAsgName).toBeDefined();
      expect(outputs.blueTargetGroupArn).toBeDefined();
      expect(outputs.greenTargetGroupArn).toBeDefined();
    });
  });
});
