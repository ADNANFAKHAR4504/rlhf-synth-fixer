import {
  EC2Client,
  DescribeVpcsCommand,
  DescribeSubnetsCommand,
  DescribeSecurityGroupsCommand,
} from '@aws-sdk/client-ec2';
import {
  RDSClient,
  DescribeDBClustersCommand,
  DescribeDBInstancesCommand,
} from '@aws-sdk/client-rds';
import {
  SecretsManagerClient,
  DescribeSecretCommand,
  GetSecretValueCommand,
} from '@aws-sdk/client-secrets-manager';
import {
  EFSClient,
  DescribeFileSystemsCommand,
  DescribeMountTargetsCommand,
} from '@aws-sdk/client-efs';
import {
  KMSClient,
  DescribeKeyCommand,
} from '@aws-sdk/client-kms';
import {
  LambdaClient,
  GetFunctionCommand,
} from '@aws-sdk/client-lambda';
import fs from 'fs';
import path from 'path';

describe('Healthcare Infrastructure Integration Tests', () => {
  let outputs: any;
  const region = process.env.AWS_REGION || 'eu-central-1';

  const ec2Client = new EC2Client({ region });
  const rdsClient = new RDSClient({ region });
  const secretsClient = new SecretsManagerClient({ region });
  const efsClient = new EFSClient({ region });
  const kmsClient = new KMSClient({ region });
  const lambdaClient = new LambdaClient({ region });

  beforeAll(() => {
    const outputsPath = path.join(process.cwd(), 'cfn-outputs/flat-outputs.json');
    if (fs.existsSync(outputsPath)) {
      outputs = JSON.parse(fs.readFileSync(outputsPath, 'utf8'));
    } else {
      throw new Error('cfn-outputs/flat-outputs.json not found. Deploy the stack first.');
    }
  });

  describe('VPC and Networking', () => {
    test('VPC should exist and be available', async () => {
      const command = new DescribeVpcsCommand({
        VpcIds: [outputs.VPCId],
      });
      const response = await ec2Client.send(command);

      expect(response.Vpcs).toHaveLength(1);
      expect(response.Vpcs[0].State).toBe('available');
      expect(response.Vpcs[0].CidrBlock).toBe('10.0.0.0/16');
    }, 30000);

    test('all three private subnets should exist', async () => {
      const subnetIds = [
        outputs.PrivateSubnetAZ1Id,
        outputs.PrivateSubnetAZ2Id,
        outputs.PrivateSubnetAZ3Id,
      ];

      const command = new DescribeSubnetsCommand({
        SubnetIds: subnetIds,
      });
      const response = await ec2Client.send(command);

      expect(response.Subnets).toHaveLength(3);
      response.Subnets.forEach((subnet) => {
        expect(subnet.State).toBe('available');
        expect(subnet.VpcId).toBe(outputs.VPCId);
      });
    }, 30000);

    test('subnets should span different availability zones', async () => {
      const subnetIds = [
        outputs.PrivateSubnetAZ1Id,
        outputs.PrivateSubnetAZ2Id,
        outputs.PrivateSubnetAZ3Id,
      ];

      const command = new DescribeSubnetsCommand({
        SubnetIds: subnetIds,
      });
      const response = await ec2Client.send(command);

      const azs = response.Subnets.map((subnet) => subnet.AvailabilityZone);
      const uniqueAZs = new Set(azs);
      expect(uniqueAZs.size).toBe(3);
    }, 30000);
  });

  describe('Security Groups', () => {
    test('RDS security group should exist with correct rules', async () => {
      const command = new DescribeSecurityGroupsCommand({
        GroupIds: [outputs.RDSSecurityGroupId],
      });
      const response = await ec2Client.send(command);

      expect(response.SecurityGroups).toHaveLength(1);
      const sg = response.SecurityGroups[0];
      expect(sg.VpcId).toBe(outputs.VPCId);

      const mysqlRule = sg.IpPermissions.find(
        (rule) => rule.FromPort === 3306 && rule.ToPort === 3306
      );
      expect(mysqlRule).toBeDefined();
    }, 30000);

    test('EFS security group should exist with correct rules', async () => {
      const command = new DescribeSecurityGroupsCommand({
        GroupIds: [outputs.EFSSecurityGroupId],
      });
      const response = await ec2Client.send(command);

      expect(response.SecurityGroups).toHaveLength(1);
      const sg = response.SecurityGroups[0];
      expect(sg.VpcId).toBe(outputs.VPCId);

      const nfsRule = sg.IpPermissions.find(
        (rule) => rule.FromPort === 2049 && rule.ToPort === 2049
      );
      expect(nfsRule).toBeDefined();
    }, 30000);
  });

  describe('KMS Keys', () => {
    test('RDS KMS key should be enabled', async () => {
      const keyId = outputs.RDSKMSKeyArn.split('/').pop();
      const command = new DescribeKeyCommand({
        KeyId: keyId,
      });
      const response = await kmsClient.send(command);

      expect(response.KeyMetadata.KeyState).toBe('Enabled');
      expect(response.KeyMetadata.Enabled).toBe(true);
    }, 30000);

    test('EFS KMS key should be enabled', async () => {
      const keyId = outputs.EFSKMSKeyArn.split('/').pop();
      const command = new DescribeKeyCommand({
        KeyId: keyId,
      });
      const response = await kmsClient.send(command);

      expect(response.KeyMetadata.KeyState).toBe('Enabled');
      expect(response.KeyMetadata.Enabled).toBe(true);
    }, 30000);
  });

  describe('Secrets Manager', () => {
    test('database secret should exist', async () => {
      const command = new DescribeSecretCommand({
        SecretId: outputs.DBSecretArn,
      });
      const response = await secretsClient.send(command);

      expect(response.ARN).toBe(outputs.DBSecretArn);
      expect(response.Name).toBeDefined();
    }, 30000);

    test('database secret should have rotation enabled', async () => {
      const command = new DescribeSecretCommand({
        SecretId: outputs.DBSecretArn,
      });
      const response = await secretsClient.send(command);

      expect(response.RotationEnabled).toBe(true);
      expect(response.RotationRules).toBeDefined();
      expect(response.RotationRules.AutomaticallyAfterDays).toBe(30);
    }, 30000);

    test('database secret should contain username and password', async () => {
      const command = new GetSecretValueCommand({
        SecretId: outputs.DBSecretArn,
      });
      const response = await secretsClient.send(command);

      const secret = JSON.parse(response.SecretString);
      expect(secret.username).toBeDefined();
      expect(secret.password).toBeDefined();
      expect(secret.password.length).toBeGreaterThanOrEqual(32);
    }, 30000);
  });

  describe('RDS Database', () => {
    test('RDS cluster should be available', async () => {
      const clusterIdentifier = outputs.DBClusterArn.split(':').pop();
      const command = new DescribeDBClustersCommand({
        DBClusterIdentifier: clusterIdentifier,
      });
      const response = await rdsClient.send(command);

      expect(response.DBClusters).toHaveLength(1);
      const cluster = response.DBClusters[0];
      expect(cluster.Status).toBe('available');
    }, 30000);

    test('RDS cluster should be encrypted', async () => {
      const clusterIdentifier = outputs.DBClusterArn.split(':').pop();
      const command = new DescribeDBClustersCommand({
        DBClusterIdentifier: clusterIdentifier,
      });
      const response = await rdsClient.send(command);

      const cluster = response.DBClusters[0];
      expect(cluster.StorageEncrypted).toBe(true);
      expect(cluster.KmsKeyId).toBeDefined();
    }, 30000);

    test('RDS cluster should have correct endpoint', async () => {
      const clusterIdentifier = outputs.DBClusterArn.split(':').pop();
      const command = new DescribeDBClustersCommand({
        DBClusterIdentifier: clusterIdentifier,
      });
      const response = await rdsClient.send(command);

      const cluster = response.DBClusters[0];
      expect(cluster.Endpoint).toBe(outputs.DBClusterEndpoint);
    }, 30000);

    test('RDS cluster should have backup retention configured', async () => {
      const clusterIdentifier = outputs.DBClusterArn.split(':').pop();
      const command = new DescribeDBClustersCommand({
        DBClusterIdentifier: clusterIdentifier,
      });
      const response = await rdsClient.send(command);

      const cluster = response.DBClusters[0];
      expect(cluster.BackupRetentionPeriod).toBeGreaterThanOrEqual(7);
    }, 30000);

    test('RDS instance should be available', async () => {
      const clusterIdentifier = outputs.DBClusterArn.split(':').pop();
      const command = new DescribeDBInstancesCommand({
        Filters: [
          {
            Name: 'db-cluster-id',
            Values: [clusterIdentifier],
          },
        ],
      });
      const response = await rdsClient.send(command);

      expect(response.DBInstances.length).toBeGreaterThan(0);
      const instance = response.DBInstances[0];
      expect(instance.DBInstanceStatus).toBe('available');
    }, 30000);

    test('RDS instance should not be publicly accessible', async () => {
      const clusterIdentifier = outputs.DBClusterArn.split(':').pop();
      const command = new DescribeDBInstancesCommand({
        Filters: [
          {
            Name: 'db-cluster-id',
            Values: [clusterIdentifier],
          },
        ],
      });
      const response = await rdsClient.send(command);

      const instance = response.DBInstances[0];
      expect(instance.PubliclyAccessible).toBe(false);
    }, 30000);
  });

  describe('Lambda Function for Secret Rotation', () => {
    test('secret rotation Lambda should exist', async () => {
      const secretDesc = await secretsClient.send(
        new DescribeSecretCommand({
          SecretId: outputs.DBSecretArn,
        })
      );

      const lambdaArn = secretDesc.RotationLambdaARN;
      expect(lambdaArn).toBeDefined();

      const functionName = lambdaArn.split(':').pop();
      const command = new GetFunctionCommand({
        FunctionName: functionName,
      });
      const response = await lambdaClient.send(command);

      expect(response.Configuration.FunctionName).toBeDefined();
      expect(response.Configuration.Runtime).toBe('python3.11');
    }, 30000);

    test('Lambda should be configured in VPC', async () => {
      const secretDesc = await secretsClient.send(
        new DescribeSecretCommand({
          SecretId: outputs.DBSecretArn,
        })
      );

      const lambdaArn = secretDesc.RotationLambdaARN;
      const functionName = lambdaArn.split(':').pop();
      const command = new GetFunctionCommand({
        FunctionName: functionName,
      });
      const response = await lambdaClient.send(command);

      expect(response.Configuration.VpcConfig).toBeDefined();
      expect(response.Configuration.VpcConfig.VpcId).toBe(outputs.VPCId);
    }, 30000);
  });

  describe('EFS File System', () => {
    test('EFS file system should be available', async () => {
      const command = new DescribeFileSystemsCommand({
        FileSystemId: outputs.EFSFileSystemId,
      });
      const response = await efsClient.send(command);

      expect(response.FileSystems).toHaveLength(1);
      const fs = response.FileSystems[0];
      expect(fs.LifeCycleState).toBe('available');
    }, 30000);

    test('EFS file system should be encrypted', async () => {
      const command = new DescribeFileSystemsCommand({
        FileSystemId: outputs.EFSFileSystemId,
      });
      const response = await efsClient.send(command);

      const fs = response.FileSystems[0];
      expect(fs.Encrypted).toBe(true);
      expect(fs.KmsKeyId).toBeDefined();
    }, 30000);

    test('EFS should have mount targets in all three AZs', async () => {
      const command = new DescribeMountTargetsCommand({
        FileSystemId: outputs.EFSFileSystemId,
      });
      const response = await efsClient.send(command);

      expect(response.MountTargets.length).toBeGreaterThanOrEqual(3);
      response.MountTargets.forEach((mt) => {
        expect(mt.LifeCycleState).toBe('available');
      });

      const azs = new Set(response.MountTargets.map((mt) => mt.AvailabilityZoneName));
      expect(azs.size).toBeGreaterThanOrEqual(3);
    }, 30000);
  });

  describe('HIPAA Compliance Verification', () => {
    test('all data at rest should be encrypted', async () => {
      const rdsClusterIdentifier = outputs.DBClusterArn.split(':').pop();
      const rdsResponse = await rdsClient.send(
        new DescribeDBClustersCommand({
          DBClusterIdentifier: rdsClusterIdentifier,
        })
      );
      expect(rdsResponse.DBClusters[0].StorageEncrypted).toBe(true);

      const efsResponse = await efsClient.send(
        new DescribeFileSystemsCommand({
          FileSystemId: outputs.EFSFileSystemId,
        })
      );
      expect(efsResponse.FileSystems[0].Encrypted).toBe(true);
    }, 30000);

    test('secrets should have rotation enabled', async () => {
      const response = await secretsClient.send(
        new DescribeSecretCommand({
          SecretId: outputs.DBSecretArn,
        })
      );

      expect(response.RotationEnabled).toBe(true);
      expect(response.RotationRules.AutomaticallyAfterDays).toBe(30);
    }, 30000);

    test('database should not be publicly accessible', async () => {
      const clusterIdentifier = outputs.DBClusterArn.split(':').pop();
      const response = await rdsClient.send(
        new DescribeDBInstancesCommand({
          Filters: [
            {
              Name: 'db-cluster-id',
              Values: [clusterIdentifier],
            },
          ],
        })
      );

      response.DBInstances.forEach((instance) => {
        expect(instance.PubliclyAccessible).toBe(false);
      });
    }, 30000);
  });
});
