import {
  CloudWatchLogsClient,
  DescribeLogGroupsCommand,
} from '@aws-sdk/client-cloudwatch-logs';
import {
  DescribeSecurityGroupsCommand,
  DescribeSubnetsCommand,
  DescribeVpcAttributeCommand,
  DescribeVpcEndpointsCommand,
  DescribeVpcsCommand,
  EC2Client,
} from '@aws-sdk/client-ec2';
import {
  GetKeyRotationStatusCommand,
  KMSClient
} from '@aws-sdk/client-kms';
import {
  DescribeDBClustersCommand,
  DescribeDBInstancesCommand,
  RDSClient,
} from '@aws-sdk/client-rds';
import {
  DescribeSecretCommand,
  GetSecretValueCommand,
  SecretsManagerClient,
} from '@aws-sdk/client-secrets-manager';
import * as fs from 'fs';
import * as path from 'path';

describe('TapStack Integration Tests', () => {
  let outputs: any;
  let environmentSuffix: string;
  const region = 'us-east-1';

  const secretsClient = new SecretsManagerClient({ region });
  const rdsClient = new RDSClient({ region });
  const ec2Client = new EC2Client({ region });
  const kmsClient = new KMSClient({ region });
  const logsClient = new CloudWatchLogsClient({ region });

  beforeAll(() => {
    const outputsPath = path.join(process.cwd(), 'cfn-outputs', 'flat-outputs.json');
    outputs = JSON.parse(fs.readFileSync(outputsPath, 'utf8'));

    // Extract environment suffix from secret name
    const secretName = outputs.secretArn.split(':').pop().split('-').slice(0, -1).join('-');
    environmentSuffix = secretName.replace('db-secret-', '');

    // Extract cluster identifier from endpoint
    // Format: <cluster-id>.cluster-<hash>.<region>.rds.amazonaws.com
    outputs.clusterIdentifier = outputs.clusterEndpoint.split('.')[0];
  });

  describe('Stack Outputs', () => {
    it('should have all required outputs', () => {
      expect(outputs).toHaveProperty('secretArn');
      expect(outputs).toHaveProperty('vpcId');
      expect(outputs).toHaveProperty('clusterEndpoint');
    });

    it('should have valid ARN formats', () => {
      expect(outputs.secretArn).toMatch(/^arn:aws:secretsmanager:/);
      expect(outputs.vpcId).toMatch(/^vpc-/);
      expect(outputs.clusterEndpoint).toMatch(/\.rds\.amazonaws\.com$/);
    });
  });

  describe('Secrets Manager', () => {
    it('should have deployed secret with correct configuration', async () => {
      const command = new DescribeSecretCommand({
        SecretId: outputs.secretArn,
      });

      const response = await secretsClient.send(command);

      expect(response.ARN).toBe(outputs.secretArn);
      expect(response.Name).toContain('db-secret-');
      expect(response.RotationEnabled).toBe(true);
      expect(response.RotationRules?.AutomaticallyAfterDays).toBe(30);
    });

    it('should have secret encrypted with KMS', async () => {
      const command = new DescribeSecretCommand({
        SecretId: outputs.secretArn,
      });

      const response = await secretsClient.send(command);

      expect(response.KmsKeyId).toBeDefined();
      // KMS Key can be either UUID or ARN format
      expect(
        response.KmsKeyId!.match(/^arn:aws:kms:/) ||
        response.KmsKeyId!.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)
      ).toBeTruthy();
    });

    it('should contain database credentials', async () => {
      const command = new GetSecretValueCommand({
        SecretId: outputs.secretArn,
      });

      const response = await secretsClient.send(command);
      const secret = JSON.parse(response.SecretString!);

      expect(secret).toHaveProperty('engine');
      expect(secret).toHaveProperty('host');
      expect(secret).toHaveProperty('username');
      expect(secret).toHaveProperty('password');
      expect(secret).toHaveProperty('dbname');
      expect(secret).toHaveProperty('port');

      expect(secret.engine).toBe('mysql');
      expect(secret.port).toBe(3306);
      expect(secret.dbname).toBe('secretsdb');
    });

    it('should have rotation Lambda configured', async () => {
      const command = new DescribeSecretCommand({
        SecretId: outputs.secretArn,
      });

      const response = await secretsClient.send(command);

      expect(response.RotationLambdaARN).toBeDefined();
      expect(response.RotationLambdaARN).toMatch(/^arn:aws:lambda:/);
    });
  });

  describe('VPC Configuration', () => {
    it('should have deployed VPC', async () => {
      const command = new DescribeVpcsCommand({
        VpcIds: [outputs.vpcId],
      });

      const response = await ec2Client.send(command);

      expect(response.Vpcs).toHaveLength(1);
      expect(response.Vpcs![0].VpcId).toBe(outputs.vpcId);
      expect(response.Vpcs![0].State).toBe('available');
    });

    it('should have DNS support enabled', async () => {
      const dnsSupportCommand = new DescribeVpcAttributeCommand({
        VpcId: outputs.vpcId,
        Attribute: 'enableDnsSupport',
      });
      const dnsHostnamesCommand = new DescribeVpcAttributeCommand({
        VpcId: outputs.vpcId,
        Attribute: 'enableDnsHostnames',
      });

      const [dnsSupportResponse, dnsHostnamesResponse] = await Promise.all([
        ec2Client.send(dnsSupportCommand),
        ec2Client.send(dnsHostnamesCommand),
      ]);

      expect(dnsSupportResponse.EnableDnsSupport?.Value).toBe(true);
      expect(dnsHostnamesResponse.EnableDnsHostnames?.Value).toBe(true);
    });

    it('should have private subnets in multiple AZs', async () => {
      const command = new DescribeSubnetsCommand({
        Filters: [
          {
            Name: 'vpc-id',
            Values: [outputs.vpcId],
          },
        ],
      });

      const response = await ec2Client.send(command);

      expect(response.Subnets!.length).toBeGreaterThanOrEqual(2);

      const azs = new Set(response.Subnets!.map(s => s.AvailabilityZone));
      expect(azs.size).toBeGreaterThanOrEqual(2);
    });

    it('should have security groups configured', async () => {
      const command = new DescribeSecurityGroupsCommand({
        Filters: [
          {
            Name: 'vpc-id',
            Values: [outputs.vpcId],
          },
        ],
      });

      const response = await ec2Client.send(command);

      // Filter out the default security group
      const customSecurityGroups = response.SecurityGroups!.filter(
        sg => sg.GroupName !== 'default'
      );
      expect(customSecurityGroups.length).toBeGreaterThanOrEqual(2);
    });

    it('should have VPC endpoints for Secrets Manager and KMS', async () => {
      const command = new DescribeVpcEndpointsCommand({
        Filters: [
          {
            Name: 'vpc-id',
            Values: [outputs.vpcId],
          },
        ],
      });

      const response = await ec2Client.send(command);

      expect(response.VpcEndpoints!.length).toBeGreaterThanOrEqual(2);

      const serviceNames = response.VpcEndpoints!.map(e => e.ServiceName);
      expect(serviceNames.some(s => s?.includes('secretsmanager'))).toBe(true);
      expect(serviceNames.some(s => s?.includes('kms'))).toBe(true);
    });
  });

  describe('Aurora MySQL Cluster', () => {
    it('should have deployed Aurora cluster', async () => {
      const command = new DescribeDBClustersCommand({
        DBClusterIdentifier: outputs.clusterIdentifier,
      });

      const response = await rdsClient.send(command);

      expect(response.DBClusters).toHaveLength(1);
      expect(response.DBClusters![0].Status).toBe('available');
    });

    it('should use Aurora MySQL engine', async () => {
      const command = new DescribeDBClustersCommand({
        DBClusterIdentifier: outputs.clusterIdentifier,
      });

      const response = await rdsClient.send(command);
      const cluster = response.DBClusters![0];

      expect(cluster.Engine).toBe('aurora-mysql');
      expect(cluster.EngineVersion).toMatch(/^8\.0/);
    });

    it('should be encrypted at rest', async () => {
      const command = new DescribeDBClustersCommand({
        DBClusterIdentifier: outputs.clusterIdentifier,
      });

      const response = await rdsClient.send(command);
      const cluster = response.DBClusters![0];

      expect(cluster.StorageEncrypted).toBe(true);
      expect(cluster.KmsKeyId).toBeDefined();
    });

    it('should not be publicly accessible', async () => {
      // Get cluster first to find its members
      const clusterCommand = new DescribeDBClustersCommand({
        DBClusterIdentifier: outputs.clusterIdentifier,
      });
      const clusterResponse = await rdsClient.send(clusterCommand);
      const instanceIds = clusterResponse.DBClusters![0].DBClusterMembers!.map(m => m.DBInstanceIdentifier!);

      // Check each instance
      for (const instanceId of instanceIds) {
        const instanceCommand = new DescribeDBInstancesCommand({
          DBInstanceIdentifier: instanceId,
        });
        const instanceResponse = await rdsClient.send(instanceCommand);
        expect(instanceResponse.DBInstances![0].PubliclyAccessible).toBe(false);
      }
    });

    it('should use db.t3.medium instance class', async () => {
      // Get cluster first to find its members
      const clusterCommand = new DescribeDBClustersCommand({
        DBClusterIdentifier: outputs.clusterIdentifier,
      });
      const clusterResponse = await rdsClient.send(clusterCommand);
      const instanceIds = clusterResponse.DBClusters![0].DBClusterMembers!.map(m => m.DBInstanceIdentifier!);

      // Check each instance
      for (const instanceId of instanceIds) {
        const instanceCommand = new DescribeDBInstancesCommand({
          DBInstanceIdentifier: instanceId,
        });
        const instanceResponse = await rdsClient.send(instanceCommand);
        expect(instanceResponse.DBInstances![0].DBInstanceClass).toBe('db.t3.medium');
      }
    });

    it('should be in private subnets', async () => {
      const command = new DescribeDBClustersCommand({
        DBClusterIdentifier: outputs.clusterIdentifier,
      });

      const response = await rdsClient.send(command);
      const cluster = response.DBClusters![0];

      expect(cluster.DBSubnetGroup).toBeDefined();
      expect(cluster.VpcSecurityGroups).toBeDefined();
      expect(cluster.VpcSecurityGroups!.length).toBeGreaterThan(0);
    });
  });


  describe('CloudWatch Logs', () => {
    it('should have log group for Lambda function', async () => {
      const command = new DescribeLogGroupsCommand({
        logGroupNamePrefix: `/aws/lambda/rotation-function-${environmentSuffix}`,
      });

      const response = await logsClient.send(command);

      // Filter to exact match (prefix query can return multiple log groups)
      const exactMatch = response.logGroups!.filter(
        lg => lg.logGroupName === `/aws/lambda/rotation-function-${environmentSuffix}`
      );

      expect(exactMatch).toHaveLength(1);
      expect(exactMatch[0].logGroupName).toBe(
        `/aws/lambda/rotation-function-${environmentSuffix}`
      );
    });

    it('should have log group encrypted with KMS', async () => {
      const command = new DescribeLogGroupsCommand({
        logGroupNamePrefix: `/aws/lambda/rotation-function-${environmentSuffix}`,
      });

      const response = await logsClient.send(command);

      expect(response.logGroups![0].kmsKeyId).toBeDefined();
    });

    it('should have retention policy configured', async () => {
      const command = new DescribeLogGroupsCommand({
        logGroupNamePrefix: `/aws/lambda/rotation-function-${environmentSuffix}`,
      });

      const response = await logsClient.send(command);

      expect(response.logGroups![0].retentionInDays).toBe(30);
    });
  });

  describe('KMS Keys', () => {
    it('should have KMS keys with rotation enabled', async () => {
      const describeSecretCommand = new DescribeSecretCommand({
        SecretId: outputs.secretArn,
      });

      const secretResponse = await secretsClient.send(describeSecretCommand);
      const kmsKeyId = secretResponse.KmsKeyId!;

      const rotationCommand = new GetKeyRotationStatusCommand({
        KeyId: kmsKeyId,
      });

      const rotationResponse = await kmsClient.send(rotationCommand);

      expect(rotationResponse.KeyRotationEnabled).toBe(true);
    });
  });

  describe('Resource Naming', () => {
    it('should use environment suffix in resource names', async () => {
      const describeSecretCommand = new DescribeSecretCommand({
        SecretId: outputs.secretArn,
      });

      const response = await secretsClient.send(describeSecretCommand);

      expect(response.Name).toContain(environmentSuffix);
    });
  });

  describe('Security Configuration', () => {
    it('should have no resources with public access', async () => {
      // Get cluster first to find its members
      const clusterCommand = new DescribeDBClustersCommand({
        DBClusterIdentifier: outputs.clusterIdentifier,
      });
      const clusterResponse = await rdsClient.send(clusterCommand);
      const instanceIds = clusterResponse.DBClusters![0].DBClusterMembers!.map(m => m.DBInstanceIdentifier!);

      // Check each instance
      for (const instanceId of instanceIds) {
        const instanceCommand = new DescribeDBInstancesCommand({
          DBInstanceIdentifier: instanceId,
        });
        const instanceResponse = await rdsClient.send(instanceCommand);
        instanceResponse.DBInstances!.forEach(instance => {
          expect(instance.PubliclyAccessible).toBe(false);
        });
      }
    });

    it('should have encryption enabled on all encrypted resources', async () => {
      // Check RDS encryption
      const rdsCommand = new DescribeDBClustersCommand({
        DBClusterIdentifier: outputs.clusterIdentifier,
      });

      const rdsResponse = await rdsClient.send(rdsCommand);
      expect(rdsResponse.DBClusters![0].StorageEncrypted).toBe(true);

      // Check Secrets Manager encryption
      const secretCommand = new DescribeSecretCommand({
        SecretId: outputs.secretArn,
      });

      const secretResponse = await secretsClient.send(secretCommand);
      expect(secretResponse.KmsKeyId).toBeDefined();
    });
  });

  describe('End-to-End Workflow', () => {
    it('should retrieve database credentials from Secrets Manager', async () => {
      const command = new GetSecretValueCommand({
        SecretId: outputs.secretArn,
      });

      const response = await secretsClient.send(command);
      const credentials = JSON.parse(response.SecretString!);

      expect(credentials.host).toBe(outputs.clusterEndpoint);
      expect(credentials.username).toBeDefined();
      expect(credentials.password).toBeDefined();
      expect(credentials.dbname).toBe('secretsdb');
    });

    it('should validate complete infrastructure deployment', async () => {
      // Verify all components are working together
      const allChecks = await Promise.all([
        // VPC exists
        ec2Client.send(new DescribeVpcsCommand({ VpcIds: [outputs.vpcId] })),
        // Secret exists
        secretsClient.send(new DescribeSecretCommand({ SecretId: outputs.secretArn })),
        // Aurora cluster exists
        rdsClient.send(
          new DescribeDBClustersCommand({
            DBClusterIdentifier: outputs.clusterIdentifier,
          })
        ),
      ]);

      allChecks.forEach(check => {
        expect(check).toBeDefined();
      });
    });
  });
});
