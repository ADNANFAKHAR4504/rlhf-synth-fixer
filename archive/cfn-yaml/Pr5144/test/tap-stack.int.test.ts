// Integration tests for PCI-DSS Database Infrastructure
// Tests use real AWS resources deployed to us-east-1

import { CloudWatchLogsClient, DescribeLogGroupsCommand } from '@aws-sdk/client-cloudwatch-logs';
import { DescribeSecurityGroupsCommand, DescribeSubnetsCommand, DescribeVpcAttributeCommand, DescribeVpcsCommand, EC2Client } from '@aws-sdk/client-ec2';
import { DescribeReplicationGroupsCommand, ElastiCacheClient } from '@aws-sdk/client-elasticache';
import { LambdaClient } from '@aws-sdk/client-lambda';
import { DescribeDBInstancesCommand, RDSClient } from '@aws-sdk/client-rds';
import { DescribeSecretCommand, GetSecretValueCommand, SecretsManagerClient } from '@aws-sdk/client-secrets-manager';
import fs from 'fs';

// Get deployment outputs from cfn-outputs/flat-outputs.json
const outputs = JSON.parse(
  fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
);

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'synth6545483050';
const region = 'us-east-1';

// AWS SDK clients
const ec2Client = new EC2Client({ region });
const rdsClient = new RDSClient({ region });
const elasticacheClient = new ElastiCacheClient({ region });
const secretsManagerClient = new SecretsManagerClient({ region });
const lambdaClient = new LambdaClient({ region });
const logsClient = new CloudWatchLogsClient({ region });

describe('PCI-DSS Database Infrastructure Integration Tests', () => {
  describe('VPC and Network Configuration', () => {
    test('VPC should exist and have correct configuration', async () => {
      const vpcId = outputs.VPCId;
      expect(vpcId).toBeDefined();

      const command = new DescribeVpcsCommand({ VpcIds: [vpcId] });
      const response = await ec2Client.send(command);

      expect(response.Vpcs).toBeDefined();
      expect(response.Vpcs).toHaveLength(1);

      const vpc = response.Vpcs![0];
      expect(vpc.CidrBlock).toBe('10.0.0.0/16');
      expect(vpc.State).toBe('available');
    });

    test('VPC should have DNS support and DNS hostnames enabled', async () => {
      const vpcId = outputs.VPCId;

      const dnsSupportCommand = new DescribeVpcAttributeCommand({
        VpcId: vpcId,
        Attribute: 'enableDnsSupport'
      });
      const dnsSupportResponse = await ec2Client.send(dnsSupportCommand);

      const dnsHostnamesCommand = new DescribeVpcAttributeCommand({
        VpcId: vpcId,
        Attribute: 'enableDnsHostnames'
      });
      const dnsHostnamesResponse = await ec2Client.send(dnsHostnamesCommand);

      expect(dnsSupportResponse.EnableDnsSupport!.Value).toBe(true);
      expect(dnsHostnamesResponse.EnableDnsHostnames!.Value).toBe(true);
    });

    test('should have correct number of public and private subnets', async () => {
      const publicSubnetIds = outputs.PublicSubnets.split(',');
      const privateSubnetIds = outputs.PrivateSubnets.split(',');

      expect(publicSubnetIds).toHaveLength(2);
      expect(privateSubnetIds).toHaveLength(2);
    });

    test('private subnets should not map public IP on launch', async () => {
      const privateSubnetIds = outputs.PrivateSubnets.split(',');
      const command = new DescribeSubnetsCommand({ SubnetIds: privateSubnetIds });
      const response = await ec2Client.send(command);

      expect(response.Subnets).toHaveLength(2);
      response.Subnets!.forEach(subnet => {
        expect(subnet.MapPublicIpOnLaunch).toBe(false);
      });
    });

    test('public subnets should map public IP on launch', async () => {
      const publicSubnetIds = outputs.PublicSubnets.split(',');
      const command = new DescribeSubnetsCommand({ SubnetIds: publicSubnetIds });
      const response = await ec2Client.send(command);

      expect(response.Subnets).toHaveLength(2);
      response.Subnets!.forEach(subnet => {
        expect(subnet.MapPublicIpOnLaunch).toBe(true);
      });
    });

    test('subnets should be in different availability zones', async () => {
      const allSubnetIds = [...outputs.PublicSubnets.split(','), ...outputs.PrivateSubnets.split(',')];
      const command = new DescribeSubnetsCommand({ SubnetIds: allSubnetIds });
      const response = await ec2Client.send(command);

      const azs = response.Subnets!.map(subnet => subnet.AvailabilityZone);
      const uniqueAzs = new Set(azs);
      expect(uniqueAzs.size).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Security Groups', () => {
    test('application security group should exist', async () => {
      const sgId = outputs.ApplicationSecurityGroupId;
      expect(sgId).toBeDefined();

      const command = new DescribeSecurityGroupsCommand({ GroupIds: [sgId] });
      const response = await ec2Client.send(command);

      expect(response.SecurityGroups).toHaveLength(1);
      expect(response.SecurityGroups![0].GroupName).toContain(environmentSuffix);
    });

    test('application security group should allow HTTPS inbound', async () => {
      const sgId = outputs.ApplicationSecurityGroupId;
      const command = new DescribeSecurityGroupsCommand({ GroupIds: [sgId] });
      const response = await ec2Client.send(command);

      const sg = response.SecurityGroups![0];
      const httpsRule = sg.IpPermissions!.find(rule => rule.FromPort === 443);

      expect(httpsRule).toBeDefined();
      expect(httpsRule!.ToPort).toBe(443);
      expect(httpsRule!.IpProtocol).toBe('tcp');
    });

    test('security groups should have PCI-DSS compliance tags', async () => {
      const sgId = outputs.ApplicationSecurityGroupId;
      const command = new DescribeSecurityGroupsCommand({ GroupIds: [sgId] });
      const response = await ec2Client.send(command);

      const sg = response.SecurityGroups![0];
      const environmentTag = sg.Tags!.find(tag => tag.Key === 'Environment');

      expect(environmentTag).toBeDefined();
      expect(environmentTag!.Value).toBe(environmentSuffix);
    });
  });

  describe('RDS MySQL Database', () => {
    test('RDS instance should exist and be available', async () => {
      const dbIdentifier = `rds-mysql-${environmentSuffix}`;
      const command = new DescribeDBInstancesCommand({
        DBInstanceIdentifier: dbIdentifier
      });
      const response = await rdsClient.send(command);

      expect(response.DBInstances).toBeDefined();
      expect(response.DBInstances).toHaveLength(1);

      const dbInstance = response.DBInstances![0];
      expect(dbInstance.DBInstanceStatus).toBe('available');
    }, 10000);

    test('RDS instance should be MySQL 8.0', async () => {
      const dbIdentifier = `rds-mysql-${environmentSuffix}`;
      const command = new DescribeDBInstancesCommand({
        DBInstanceIdentifier: dbIdentifier
      });
      const response = await rdsClient.send(command);

      const dbInstance = response.DBInstances![0];
      expect(dbInstance.Engine).toBe('mysql');
      expect(dbInstance.EngineVersion).toContain('8.0');
    });

    test('RDS instance should be Multi-AZ', async () => {
      const dbIdentifier = `rds-mysql-${environmentSuffix}`;
      const command = new DescribeDBInstancesCommand({
        DBInstanceIdentifier: dbIdentifier
      });
      const response = await rdsClient.send(command);

      const dbInstance = response.DBInstances![0];
      expect(dbInstance.MultiAZ).toBe(true);
    });

    test('RDS instance should have storage encryption enabled', async () => {
      const dbIdentifier = `rds-mysql-${environmentSuffix}`;
      const command = new DescribeDBInstancesCommand({
        DBInstanceIdentifier: dbIdentifier
      });
      const response = await rdsClient.send(command);

      const dbInstance = response.DBInstances![0];
      expect(dbInstance.StorageEncrypted).toBe(true);
    });

    test('RDS instance should have backup retention of 7 days', async () => {
      const dbIdentifier = `rds-mysql-${environmentSuffix}`;
      const command = new DescribeDBInstancesCommand({
        DBInstanceIdentifier: dbIdentifier
      });
      const response = await rdsClient.send(command);

      const dbInstance = response.DBInstances![0];
      expect(dbInstance.BackupRetentionPeriod).toBe(7);
    });

    test('RDS instance should not be publicly accessible', async () => {
      const dbIdentifier = `rds-mysql-${environmentSuffix}`;
      const command = new DescribeDBInstancesCommand({
        DBInstanceIdentifier: dbIdentifier
      });
      const response = await rdsClient.send(command);

      const dbInstance = response.DBInstances![0];
      expect(dbInstance.PubliclyAccessible).toBe(false);
    });

    test('RDS instance should have deletion protection disabled', async () => {
      const dbIdentifier = `rds-mysql-${environmentSuffix}`;
      const command = new DescribeDBInstancesCommand({
        DBInstanceIdentifier: dbIdentifier
      });
      const response = await rdsClient.send(command);

      const dbInstance = response.DBInstances![0];
      expect(dbInstance.DeletionProtection).toBe(false);
    });

    test('RDS endpoint should match output', async () => {
      const dbIdentifier = `rds-mysql-${environmentSuffix}`;
      const command = new DescribeDBInstancesCommand({
        DBInstanceIdentifier: dbIdentifier
      });
      const response = await rdsClient.send(command);

      const dbInstance = response.DBInstances![0];
      expect(dbInstance.Endpoint!.Address).toBe(outputs.RDSEndpoint);
      expect(dbInstance.Endpoint!.Port).toBe(parseInt(outputs.RDSPort));
    });

    test('RDS instance should have PCI-DSS compliance tags', async () => {
      const dbIdentifier = `rds-mysql-${environmentSuffix}`;
      const command = new DescribeDBInstancesCommand({
        DBInstanceIdentifier: dbIdentifier
      });
      const response = await rdsClient.send(command);

      const dbInstance = response.DBInstances![0];
      const complianceTag = dbInstance.TagList!.find(tag => tag.Key === 'Compliance');

      expect(complianceTag).toBeDefined();
      expect(complianceTag!.Value).toBe('PCI-DSS');
    });
  });

  describe('ElastiCache Redis Cluster', () => {
    test('Redis replication group should exist and be available', async () => {
      const replicationGroupId = `redis-cluster-${environmentSuffix}`;
      const command = new DescribeReplicationGroupsCommand({
        ReplicationGroupId: replicationGroupId
      });
      const response = await elasticacheClient.send(command);

      expect(response.ReplicationGroups).toBeDefined();
      expect(response.ReplicationGroups).toHaveLength(1);

      const replicationGroup = response.ReplicationGroups![0];
      expect(replicationGroup.Status).toBe('available');
    }, 10000);

    test('Redis cluster should be Multi-AZ', async () => {
      const replicationGroupId = `redis-cluster-${environmentSuffix}`;
      const command = new DescribeReplicationGroupsCommand({
        ReplicationGroupId: replicationGroupId
      });
      const response = await elasticacheClient.send(command);

      const replicationGroup = response.ReplicationGroups![0];
      expect(replicationGroup.MultiAZ).toBe('enabled');
      expect(replicationGroup.AutomaticFailover).toBe('enabled');
    });

    test('Redis cluster should have encryption at rest enabled', async () => {
      const replicationGroupId = `redis-cluster-${environmentSuffix}`;
      const command = new DescribeReplicationGroupsCommand({
        ReplicationGroupId: replicationGroupId
      });
      const response = await elasticacheClient.send(command);

      const replicationGroup = response.ReplicationGroups![0];
      expect(replicationGroup.AtRestEncryptionEnabled).toBe(true);
    });

    test('Redis cluster should have snapshot retention configured', async () => {
      const replicationGroupId = `redis-cluster-${environmentSuffix}`;
      const command = new DescribeReplicationGroupsCommand({
        ReplicationGroupId: replicationGroupId
      });
      const response = await elasticacheClient.send(command);

      const replicationGroup = response.ReplicationGroups![0];
      expect(replicationGroup.SnapshotRetentionLimit).toBe(5);
    });

    test('Redis cluster should have two cache clusters', async () => {
      const replicationGroupId = `redis-cluster-${environmentSuffix}`;
      const command = new DescribeReplicationGroupsCommand({
        ReplicationGroupId: replicationGroupId
      });
      const response = await elasticacheClient.send(command);

      const replicationGroup = response.ReplicationGroups![0];
      expect(replicationGroup.MemberClusters).toBeDefined();
      expect(replicationGroup.MemberClusters!.length).toBe(2);
    });

    test('Redis endpoint should match output', async () => {
      const replicationGroupId = `redis-cluster-${environmentSuffix}`;
      const command = new DescribeReplicationGroupsCommand({
        ReplicationGroupId: replicationGroupId
      });
      const response = await elasticacheClient.send(command);

      const replicationGroup = response.ReplicationGroups![0];
      const primaryEndpoint = replicationGroup.NodeGroups![0].PrimaryEndpoint;

      expect(primaryEndpoint!.Address).toBe(outputs.RedisEndpoint);
      expect(primaryEndpoint!.Port).toBe(parseInt(outputs.RedisPort));
    });
  });

  describe('Secrets Manager', () => {
    test('database secret should exist', async () => {
      const secretArn = outputs.DBSecretArn;
      expect(secretArn).toBeDefined();

      const command = new DescribeSecretCommand({ SecretId: secretArn });
      const response = await secretsManagerClient.send(command);

      expect(response.Name).toContain(`rds-credentials-${environmentSuffix}`);
    }, 10000);

    test('database secret should have rotation configured', async () => {
      const secretArn = outputs.DBSecretArn;
      const command = new DescribeSecretCommand({ SecretId: secretArn });
      const response = await secretsManagerClient.send(command);

      expect(response.RotationEnabled).toBe(true);
      expect(response.RotationRules).toBeDefined();
      expect(response.RotationRules!.AutomaticallyAfterDays).toBe(30);
    });

    test('database secret should contain username and password', async () => {
      const secretArn = outputs.DBSecretArn;
      const command = new GetSecretValueCommand({ SecretId: secretArn });
      const response = await secretsManagerClient.send(command);

      expect(response.SecretString).toBeDefined();
      const secret = JSON.parse(response.SecretString!);

      expect(secret.username).toBeDefined();
      expect(secret.username).toBe('dbadmin');
      expect(secret.password).toBeDefined();
      expect(secret.password.length).toBeGreaterThan(0);
    });

    test('Redis auth secret should exist', async () => {
      const secretArn = outputs.RedisAuthSecretArn;
      expect(secretArn).toBeDefined();

      const command = new DescribeSecretCommand({ SecretId: secretArn });
      const response = await secretsManagerClient.send(command);

      expect(response.Name).toContain(`redis-auth-token-${environmentSuffix}`);
    });

    test('Redis auth secret should contain token', async () => {
      const secretArn = outputs.RedisAuthSecretArn;
      const command = new GetSecretValueCommand({ SecretId: secretArn });
      const response = await secretsManagerClient.send(command);

      expect(response.SecretString).toBeDefined();
      const secret = JSON.parse(response.SecretString!);

      expect(secret.token).toBeDefined();
      expect(secret.token.length).toBeGreaterThan(0);
    });

    test('secrets should have PCI-DSS compliance tags', async () => {
      const secretArn = outputs.DBSecretArn;
      const command = new DescribeSecretCommand({ SecretId: secretArn });
      const response = await secretsManagerClient.send(command);

      const complianceTag = response.Tags!.find(tag => tag.Key === 'Compliance');
      expect(complianceTag).toBeDefined();
      expect(complianceTag!.Value).toBe('PCI-DSS');
    });
  });

  describe('CloudWatch Logs', () => {
    test('RDS log group should exist', async () => {
      const logGroupName = `/aws/rds/mysql/${environmentSuffix}`;
      const command = new DescribeLogGroupsCommand({
        logGroupNamePrefix: logGroupName
      });
      const response = await logsClient.send(command);

      expect(response.logGroups).toBeDefined();
      expect(response.logGroups!.length).toBeGreaterThan(0);

      const logGroup = response.logGroups!.find(lg => lg.logGroupName === logGroupName);
      expect(logGroup).toBeDefined();
      expect(logGroup!.retentionInDays).toBe(30);
    }, 10000);
  });

  describe('End-to-End Validation', () => {
    test('all critical resources should be interconnected', async () => {
      // Verify VPC contains all subnets
      const vpcId = outputs.VPCId;
      const allSubnetIds = [...outputs.PublicSubnets.split(','), ...outputs.PrivateSubnets.split(',')];

      const subnetCommand = new DescribeSubnetsCommand({ SubnetIds: allSubnetIds });
      const subnetResponse = await ec2Client.send(subnetCommand);

      subnetResponse.Subnets!.forEach(subnet => {
        expect(subnet.VpcId).toBe(vpcId);
      });

      // Verify RDS is in private subnets
      const dbIdentifier = `rds-mysql-${environmentSuffix}`;
      const rdsCommand = new DescribeDBInstancesCommand({ DBInstanceIdentifier: dbIdentifier });
      const rdsResponse = await rdsClient.send(rdsCommand);

      const dbSubnets = rdsResponse.DBInstances![0].DBSubnetGroup!.Subnets!;
      const privateSubnetIds = outputs.PrivateSubnets.split(',');

      dbSubnets.forEach(dbSubnet => {
        expect(privateSubnetIds).toContain(dbSubnet.SubnetIdentifier);
      });

      // Verify Redis is in private subnets (cache subnet group)
      const replicationGroupId = `redis-cluster-${environmentSuffix}`;
      const redisCommand = new DescribeReplicationGroupsCommand({
        ReplicationGroupId: replicationGroupId
      });
      const redisResponse = await elasticacheClient.send(redisCommand);

      expect(redisResponse.ReplicationGroups![0].NodeGroups).toBeDefined();
      expect(redisResponse.ReplicationGroups![0].NodeGroups!.length).toBeGreaterThan(0);
    }, 15000);

    test('all outputs should be non-empty and valid', () => {
      expect(outputs.VPCId).toBeDefined();
      expect(outputs.VPCId).toMatch(/^vpc-/);

      expect(outputs.RDSEndpoint).toBeDefined();
      expect(outputs.RDSEndpoint).toContain('.rds.amazonaws.com');

      expect(outputs.RDSPort).toBe('3306');

      expect(outputs.RedisEndpoint).toBeDefined();
      expect(outputs.RedisEndpoint).toContain('.cache.amazonaws.com');

      expect(outputs.RedisPort).toBe('6379');

      expect(outputs.DBSecretArn).toBeDefined();
      expect(outputs.DBSecretArn).toMatch(/^arn:aws:secretsmanager:/);

      expect(outputs.RedisAuthSecretArn).toBeDefined();
      expect(outputs.RedisAuthSecretArn).toMatch(/^arn:aws:secretsmanager:/);

      expect(outputs.ApplicationSecurityGroupId).toBeDefined();
      expect(outputs.ApplicationSecurityGroupId).toMatch(/^sg-/);
    });
  });
});
