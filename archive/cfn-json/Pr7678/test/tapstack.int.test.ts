import {
  RDSClient,
  DescribeDBClustersCommand,
  DescribeDBInstancesCommand,
  DBCluster,
  DBInstance,
  DBClusterMember,
  DBSubnetGroup,
} from '@aws-sdk/client-rds';
import {
  KMSClient,
  DescribeKeyCommand,
  GetKeyRotationStatusCommand,
  KeyMetadata,
} from '@aws-sdk/client-kms';
import {
  EC2Client,
  DescribeSecurityGroupsCommand,
  SecurityGroup,
} from '@aws-sdk/client-ec2';
import * as fs from 'fs';
import * as path from 'path';

interface StackOutputs {
  ClusterEndpoint: string;
  ReaderEndpoint: string;
  ClusterPort: string;
  KmsKeyArn: string;
  ClusterIdentifier: string;
  SecurityGroupId: string;
}

describe('CloudFormation Stack Integration Tests', () => {
  let outputs: StackOutputs;
  let rdsClient: RDSClient;
  let kmsClient: KMSClient;
  let ec2Client: EC2Client;
  let region: string;

  beforeAll(() => {
    // Load deployment outputs
    const outputsPath = path.join(__dirname, '../cfn-outputs/flat-outputs.json');

    if (!fs.existsSync(outputsPath)) {
      throw new Error('Deployment outputs not found. Please deploy the stack first.');
    }

    outputs = JSON.parse(fs.readFileSync(outputsPath, 'utf8'));

    // Get region from AWS_REGION or lib/AWS_REGION file
    region = process.env.AWS_REGION || 'us-east-1';
    const regionFilePath = path.join(__dirname, '../lib/AWS_REGION');
    if (fs.existsSync(regionFilePath)) {
      region = fs.readFileSync(regionFilePath, 'utf8').trim();
    }

    // Initialize AWS clients
    rdsClient = new RDSClient({ region });
    kmsClient = new KMSClient({ region });
    ec2Client = new EC2Client({ region });
  });

  describe('Stack Outputs Validation', () => {
    it('should have ClusterEndpoint output', () => {
      expect(outputs.ClusterEndpoint).toBeDefined();
      expect(typeof outputs.ClusterEndpoint).toBe('string');
      expect(outputs.ClusterEndpoint).toMatch(/\.rds\.amazonaws\.com$/);
    });

    it('should have ReaderEndpoint output', () => {
      expect(outputs.ReaderEndpoint).toBeDefined();
      expect(typeof outputs.ReaderEndpoint).toBe('string');
      expect(outputs.ReaderEndpoint).toMatch(/\.rds\.amazonaws\.com$/);
    });

    it('should have ClusterPort output', () => {
      expect(outputs.ClusterPort).toBeDefined();
      expect(parseInt(outputs.ClusterPort)).toBe(3306);
    });

    it('should have KmsKeyArn output', () => {
      expect(outputs.KmsKeyArn).toBeDefined();
      expect(outputs.KmsKeyArn).toMatch(/^arn:aws:kms:/);
    });

    it('should have ClusterIdentifier output', () => {
      expect(outputs.ClusterIdentifier).toBeDefined();
      expect(typeof outputs.ClusterIdentifier).toBe('string');
    });

    it('should have SecurityGroupId output', () => {
      expect(outputs.SecurityGroupId).toBeDefined();
      expect(outputs.SecurityGroupId).toMatch(/^sg-/);
    });
  });

  describe('Aurora Cluster Validation', () => {
    let cluster: DBCluster;

    beforeAll(async () => {
      const command = new DescribeDBClustersCommand({
        DBClusterIdentifier: outputs.ClusterIdentifier,
      });
      const response = await rdsClient.send(command);
      cluster = response.DBClusters![0];
    });

    it('should have cluster in available state', () => {
      expect(cluster).toBeDefined();
      expect(cluster.Status).toBe('available');
    });

    it('should use MySQL 8.0 engine', () => {
      expect(cluster.Engine).toBe('aurora-mysql');
      expect(cluster.EngineVersion).toMatch(/^8\.0/);
    });

    it('should have storage encryption enabled', () => {
      expect(cluster.StorageEncrypted).toBe(true);
      expect(cluster.KmsKeyId).toBeDefined();
    });

    it('should have 30-day backup retention', () => {
      expect(cluster.BackupRetentionPeriod).toBe(30);
    });

    it('should have correct backup window', () => {
      expect(cluster.PreferredBackupWindow).toBe('03:00-04:00');
    });

    it('should have CloudWatch logs enabled', () => {
      expect(cluster.EnabledCloudwatchLogsExports).toBeDefined();
      expect(cluster.EnabledCloudwatchLogsExports).toContain('audit');
      expect(cluster.EnabledCloudwatchLogsExports).toContain('error');
    });

    it('should match cluster endpoint output', () => {
      expect(cluster.Endpoint).toBe(outputs.ClusterEndpoint);
    });

    it('should match reader endpoint output', () => {
      expect(cluster.ReaderEndpoint).toBe(outputs.ReaderEndpoint);
    });

    it('should have correct port', () => {
      expect(cluster.Port).toBe(3306);
    });

    it('should be Multi-AZ enabled', () => {
      expect(cluster.MultiAZ).toBe(true);
    });
  });

  describe('DB Instances Validation', () => {
    let instances: DBInstance[];
    let clusterMembers: DBClusterMember[];

    beforeAll(async () => {
      const instancesCommand = new DescribeDBInstancesCommand({
        Filters: [
          {
            Name: 'db-cluster-id',
            Values: [outputs.ClusterIdentifier],
          },
        ],
      });
      const instancesResponse = await rdsClient.send(instancesCommand);
      instances = instancesResponse.DBInstances!;

      // Get cluster members to check writer/reader roles
      const clusterCommand = new DescribeDBClustersCommand({
        DBClusterIdentifier: outputs.ClusterIdentifier,
      });
      const clusterResponse = await rdsClient.send(clusterCommand);
      clusterMembers = clusterResponse.DBClusters![0].DBClusterMembers!;
    });

    it('should have exactly 3 DB instances', () => {
      expect(instances).toBeDefined();
      expect(instances.length).toBe(3);
    });

    it('should have all instances in available state', () => {
      instances.forEach(instance => {
        expect(instance.DBInstanceStatus).toBe('available');
      });
    });

    it('should have correct instance class', () => {
      instances.forEach(instance => {
        expect(instance.DBInstanceClass).toBe('db.r5.large');
      });
    });

    it('should have Performance Insights enabled', () => {
      instances.forEach(instance => {
        expect(instance.PerformanceInsightsEnabled).toBe(true);
        expect(instance.PerformanceInsightsRetentionPeriod).toBe(7);
        expect(instance.PerformanceInsightsKMSKeyId).toBeDefined();
      });
    });

    it('should not be publicly accessible', () => {
      instances.forEach(instance => {
        expect(instance.PubliclyAccessible).toBe(false);
      });
    });

    it('should have one writer and two readers', () => {
      // Check cluster members for writer/reader roles
      expect(clusterMembers).toBeDefined();
      expect(clusterMembers.length).toBe(3);

      const writers = clusterMembers.filter(m => m.IsClusterWriter === true);
      const readers = clusterMembers.filter(m => m.IsClusterWriter === false);

      // Should have exactly one writer
      expect(writers.length).toBe(1);
      // Should have exactly two readers
      expect(readers.length).toBe(2);
    });

    it('should use the same KMS key for encryption', () => {
      const kmsKeyId = instances[0].KmsKeyId;
      instances.forEach(instance => {
        expect(instance.KmsKeyId).toBe(kmsKeyId);
      });
    });

    it('should be in private subnets', () => {
      instances.forEach((instance: DBInstance) => {
        expect(instance.DBSubnetGroup).toBeDefined();
        expect(instance.DBSubnetGroup!.Subnets!.length).toBeGreaterThanOrEqual(3);
      });
    });
  });

  describe('KMS Key Validation', () => {
    let keyMetadata: KeyMetadata;
    let keyRotationStatus: boolean | undefined;

    beforeAll(async () => {
      const keyId = outputs.KmsKeyArn;

      const describeCommand = new DescribeKeyCommand({ KeyId: keyId });
      const describeResponse = await kmsClient.send(describeCommand);
      keyMetadata = describeResponse.KeyMetadata!;

      const rotationCommand = new GetKeyRotationStatusCommand({ KeyId: keyId });
      const rotationResponse = await kmsClient.send(rotationCommand);
      keyRotationStatus = rotationResponse.KeyRotationEnabled;
    });

    it('should have key rotation enabled', () => {
      expect(keyRotationStatus).toBe(true);
    });

    it('should be in enabled state', () => {
      expect(keyMetadata.KeyState).toBe('Enabled');
    });

    it('should be a customer managed key', () => {
      expect(keyMetadata.KeyManager).toBe('CUSTOMER');
    });

    it('should match the ARN in outputs', () => {
      expect(keyMetadata.Arn).toBe(outputs.KmsKeyArn);
    });
  });

  describe('Security Group Validation', () => {
    let securityGroup: SecurityGroup;

    beforeAll(async () => {
      const command = new DescribeSecurityGroupsCommand({
        GroupIds: [outputs.SecurityGroupId],
      });
      const response = await ec2Client.send(command);
      securityGroup = response.SecurityGroups![0];
    });

    it('should exist and be active', () => {
      expect(securityGroup).toBeDefined();
    });

    it('should have MySQL ingress rules', () => {
      expect(securityGroup.IpPermissions).toBeDefined();
      expect(securityGroup.IpPermissions!.length).toBeGreaterThanOrEqual(1);

      const mysqlRules = securityGroup.IpPermissions!.filter(
        rule => rule.FromPort === 3306 && rule.ToPort === 3306
      );
      expect(mysqlRules.length).toBeGreaterThanOrEqual(1);

      // Count total CIDR rules across all ingress rules
      const totalCidrRules = securityGroup.IpPermissions!.reduce(
        (sum: number, rule) => sum + (rule.IpRanges?.length || 0),
        0
      );
      expect(totalCidrRules).toBe(3);
    });

    it('should allow TCP traffic on port 3306', () => {
      const mysqlRules = securityGroup.IpPermissions!.filter(
        rule => rule.IpProtocol === 'tcp' && rule.FromPort === 3306
      );
      expect(mysqlRules.length).toBeGreaterThanOrEqual(1);

      // Verify total CIDR entries across all MySQL rules
      const totalCidrRules = mysqlRules.reduce(
        (sum: number, rule) => sum + (rule.IpRanges?.length || 0),
        0
      );
      expect(totalCidrRules).toBe(3);
    });

    it('should have CIDR-based ingress rules', () => {
      const mysqlRules = securityGroup.IpPermissions!.filter(
        rule => rule.FromPort === 3306
      );

      mysqlRules.forEach(rule => {
        expect(rule.IpRanges).toBeDefined();
        expect(rule.IpRanges!.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Resource Naming Convention', () => {
    it('should have environment suffix in cluster identifier', () => {
      expect(outputs.ClusterIdentifier).toMatch(/aurora-mysql-cluster-/);
    });

    it('should have consistent naming across resources', () => {
      const environmentSuffix = outputs.ClusterIdentifier.split('-').pop();
      expect(environmentSuffix).toBeDefined();
      expect(environmentSuffix!.length).toBeGreaterThan(0);
    });
  });

  describe('Endpoint Connectivity', () => {
    it('should have valid DNS names for endpoints', () => {
      expect(outputs.ClusterEndpoint).toMatch(/^aurora-mysql-cluster-.*\..*\.rds\.amazonaws\.com$/);
      expect(outputs.ReaderEndpoint).toMatch(/^aurora-mysql-cluster-.*\..*\.rds\.amazonaws\.com$/);
    });

    it('should have different endpoints for writer and reader', () => {
      expect(outputs.ClusterEndpoint).not.toBe(outputs.ReaderEndpoint);
    });
  });

  describe('High Availability Configuration', () => {
    let instances: DBInstance[];
    let subnetGroup: DBSubnetGroup | undefined;

    beforeAll(async () => {
      const clusterCommand = new DescribeDBClustersCommand({
        DBClusterIdentifier: outputs.ClusterIdentifier,
      });
      const clusterResponse = await rdsClient.send(clusterCommand);

      const instancesCommand = new DescribeDBInstancesCommand({
        Filters: [
          {
            Name: 'db-cluster-id',
            Values: [outputs.ClusterIdentifier],
          },
        ],
      });
      const instancesResponse = await rdsClient.send(instancesCommand);
      instances = instancesResponse.DBInstances!;

      // Get subnet group from one of the instances
      if (instances!.length > 0) {
        subnetGroup = instances![0].DBSubnetGroup;
      }
    });

    it('should have instances in multiple availability zones', () => {
      const azs = new Set(instances.map(i => i.AvailabilityZone));
      expect(azs.size).toBeGreaterThanOrEqual(2);
    });

    it('should have subnet group spanning multiple AZs', () => {
      expect(subnetGroup).toBeDefined();
      expect(subnetGroup!.Subnets).toBeDefined();
      expect(subnetGroup!.Subnets!.length).toBe(3);

      const azs = new Set(
        subnetGroup!.Subnets!.map(s => s.SubnetAvailabilityZone?.Name)
      );
      expect(azs.size).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Encryption Configuration', () => {
    let cluster: DBCluster;
    let instances: DBInstance[];

    beforeAll(async () => {
      const clusterCommand = new DescribeDBClustersCommand({
        DBClusterIdentifier: outputs.ClusterIdentifier,
      });
      const clusterResponse = await rdsClient.send(clusterCommand);
      cluster = clusterResponse.DBClusters![0];

      const instancesCommand = new DescribeDBInstancesCommand({
        Filters: [
          {
            Name: 'db-cluster-id',
            Values: [outputs.ClusterIdentifier],
          },
        ],
      });
      const instancesResponse = await rdsClient.send(instancesCommand);
      instances = instancesResponse.DBInstances!;
    });

    it('should use same KMS key for cluster and instances', () => {
      const clusterKmsKey = cluster.KmsKeyId;
      instances.forEach((instance: DBInstance) => {
        expect(instance.KmsKeyId).toBe(clusterKmsKey);
      });
    });

    it('should use same KMS key for Performance Insights', () => {
      const clusterKmsKey = cluster.KmsKeyId;
      instances.forEach((instance: DBInstance) => {
        if (instance.PerformanceInsightsEnabled) {
          // Performance Insights KMS key should match cluster KMS key
          expect(instance.PerformanceInsightsKMSKeyId).toContain(
            clusterKmsKey!.split('/').pop()!
          );
        }
      });
    });
  });
});
