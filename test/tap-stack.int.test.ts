import * as fs from 'fs';
import * as path from 'path';
import * as AWS from 'aws-sdk';
import { describe, test, expect } from '@jest/globals';

// Load CDK outputs JSON file
// Adjust the path if your file is elsewhere (e.g., ../cdk-outputs.json)
const outputsPath = path.resolve(__dirname, '../cdk-outputs.json');
if (!fs.existsSync(outputsPath)) {
  throw new Error(`CDK outputs file not found at: ${outputsPath}`);
}

const outputs = JSON.parse(fs.readFileSync(outputsPath, 'utf-8'));

// Change "TapStack-dev" to match your deployed stack name in outputs
const stackName = Object.keys(outputs)[0];
const stackOutputs = outputs[stackName];

// Extract values from outputs instead of process.env
const environmentSuffix = 'dev';
const region = process.env.AWS_REGION || 'us-east-1';

const vpcId = stackOutputs.VpcId;
const databaseEndpoint = stackOutputs.DatabaseEndpoint;
const kmsKeyId = stackOutputs.KmsKeyId;
const ec2Instance1Id = stackOutputs.Ec2Instance1Id;
const ec2Instance2Id = stackOutputs.Ec2Instance2Id;
const ec2SecurityGroupId = stackOutputs.Ec2SecurityGroupId;
const rdsSecurityGroupId = stackOutputs.RdsSecurityGroupId;

// AWS Clients
const ec2 = new AWS.EC2({ region });
const rds = new AWS.RDS({ region });
const kms = new AWS.KMS({ region });
const cloudWatchLogs = new AWS.CloudWatchLogs({ region });

// Check if we have all required outputs
const hasAllOutputs = [
  vpcId,
  databaseEndpoint,
  kmsKeyId,
  ec2Instance1Id,
  ec2Instance2Id,
  ec2SecurityGroupId,
  rdsSecurityGroupId,
].every(v => v);

describe('TAP Infrastructure Integration Tests - Live Resources', () => {
  if (!hasAllOutputs) {
    test.skip('Skipping all tests - required CDK outputs not set properly', () => {});
    return;
  }

  describe('VPC Infrastructure Validation', () => {
    test('VPC exists and is in available state', async () => {
      const response = await ec2.describeVpcs({ VpcIds: [vpcId!] }).promise();

      expect(response.Vpcs).toHaveLength(1);
      expect(response.Vpcs![0].State).toBe('available');
      expect(response.Vpcs![0].VpcId).toBe(vpcId);
    });

    test('VPC has required subnets', async () => {
      const response = await ec2
        .describeSubnets({
          Filters: [{ Name: 'vpc-id', Values: [vpcId!] }],
        })
        .promise();

      const subnetTypes = response.Subnets!.map(
        s => s.Tags?.find(t => t.Key === 'aws-cdk:subnet-type')?.Value
      );

      expect(subnetTypes).toContain('Public');
      expect(subnetTypes).toContain('Private');
      expect(subnetTypes).toContain('Isolated');
    });
  });

  describe('Security Groups Validation', () => {
    test('EC2 Security Group allows HTTP/HTTPS inbound', async () => {
      const response = await ec2
        .describeSecurityGroups({
          GroupIds: [ec2SecurityGroupId!],
        })
        .promise();

      const securityGroup = response.SecurityGroups![0];
      const httpRule = securityGroup.IpPermissions?.find(
        p => p.FromPort === 80 && p.ToPort === 80 && p.IpProtocol === 'tcp'
      );
      const httpsRule = securityGroup.IpPermissions?.find(
        p => p.FromPort === 443 && p.ToPort === 443 && p.IpProtocol === 'tcp'
      );

      expect(httpRule).toBeDefined();
      expect(httpsRule).toBeDefined();
    });

    test('RDS Security Group allows PostgreSQL from EC2 Security Group', async () => {
      const response = await ec2
        .describeSecurityGroups({
          GroupIds: [rdsSecurityGroupId!],
        })
        .promise();

      const securityGroup = response.SecurityGroups![0];
      const postgresRule = securityGroup.IpPermissions?.find(
        p => p.FromPort === 5432 && p.ToPort === 5432 && p.IpProtocol === 'tcp'
      );

      expect(postgresRule).toBeDefined();
      expect(postgresRule?.UserIdGroupPairs?.[0]?.GroupId).toBe(
        ec2SecurityGroupId
      );
    });
  });

  describe('EC2 Instances Validation', () => {
    test('EC2 instances are running', async () => {
      const response = await ec2
        .describeInstances({
          InstanceIds: [ec2Instance1Id!, ec2Instance2Id!],
        })
        .promise();

      const instances = response.Reservations!.flatMap(r => r.Instances!);

      expect(instances).toHaveLength(2);
      instances.forEach(instance => {
        expect(instance.State?.Name).toBe('running');
      });
    });

    test('EC2 instances have encrypted volumes', async () => {
      const response = await ec2
        .describeInstances({
          InstanceIds: [ec2Instance1Id!, ec2Instance2Id!],
        })
        .promise();

      const instances = response.Reservations!.flatMap(r => r.Instances!);

      for (const instance of instances) {
        const blockDevices = instance.BlockDeviceMappings || [];
        for (const device of blockDevices) {
          const volumeResponse = await ec2
            .describeVolumes({
              VolumeIds: [device.Ebs!.VolumeId!],
            })
            .promise();

          expect(volumeResponse.Volumes![0].Encrypted).toBe(true);
        }
      }
    }, 30000);
  });

  describe('RDS Database Validation', () => {
    test('RDS instance is available and encrypted', async () => {
      const dbIdentifier = databaseEndpoint!.split('.')[0];

      const response = await rds
        .describeDBInstances({
          DBInstanceIdentifier: dbIdentifier,
        })
        .promise();

      const dbInstance = response.DBInstances![0];

      expect(dbInstance.DBInstanceStatus).toBe('available');
      expect(dbInstance.StorageEncrypted).toBe(true);
      expect(dbInstance.MultiAZ).toBe(true);
      expect(dbInstance.PubliclyAccessible).toBe(false);
    });

    test('RDS has Performance Insights enabled', async () => {
      const dbIdentifier = databaseEndpoint!.split('.')[0];

      const response = await rds
        .describeDBInstances({
          DBInstanceIdentifier: dbIdentifier,
        })
        .promise();

      const dbInstance = response.DBInstances![0];

      expect(dbInstance.PerformanceInsightsEnabled).toBe(true);
      expect(dbInstance.PerformanceInsightsKMSKeyId).toBe(kmsKeyId);
    });
  });

  describe('KMS Encryption Validation', () => {
    test('KMS key exists and is enabled', async () => {
      const response = await kms.describeKey({ KeyId: kmsKeyId! }).promise();

      expect(response.KeyMetadata!.KeyState).toBe('Enabled');
      expect(response.KeyMetadata!.Enabled).toBe(true);
    });

    test('KMS key has rotation enabled', async () => {
      const response = await kms
        .getKeyRotationStatus({ KeyId: kmsKeyId! })
        .promise();

      expect(response.KeyRotationEnabled).toBe(true);
    });
  });

  describe('Network Connectivity Validation', () => {
    test('Private subnets have NAT gateway routes', async () => {
      const subnetsResponse = await ec2
        .describeSubnets({
          Filters: [
            { Name: 'vpc-id', Values: [vpcId!] },
            { Name: 'tag:aws-cdk:subnet-type', Values: ['Private'] },
          ],
        })
        .promise();

      for (const subnet of subnetsResponse.Subnets!) {
        const routeTablesResponse = await ec2
          .describeRouteTables({
            Filters: [
              { Name: 'association.subnet-id', Values: [subnet.SubnetId!] },
            ],
          })
          .promise();

        const hasNatRoute = routeTablesResponse.RouteTables![0].Routes?.some(
          route => route.NatGatewayId !== undefined
        );

        expect(hasNatRoute).toBe(true);
      }
    });

    test('Database subnets are isolated', async () => {
      const subnetsResponse = await ec2
        .describeSubnets({
          Filters: [
            { Name: 'vpc-id', Values: [vpcId!] },
            { Name: 'tag:aws-cdk:subnet-type', Values: ['Isolated'] },
          ],
        })
        .promise();

      for (const subnet of subnetsResponse.Subnets!) {
        const routeTablesResponse = await ec2
          .describeRouteTables({
            Filters: [
              { Name: 'association.subnet-id', Values: [subnet.SubnetId!] },
            ],
          })
          .promise();

        const hasInternetRoute =
          routeTablesResponse.RouteTables![0].Routes?.some(
            route => route.GatewayId && route.GatewayId.startsWith('igw-')
          );

        expect(hasInternetRoute).toBe(false);
      }
    });
  });

  describe('Monitoring Validation', () => {
    test('CloudWatch log groups exist for EC2 instances', async () => {
      const logGroupsResponse = await cloudWatchLogs
        .describeLogGroups({
          logGroupNamePrefix: `/aws/ec2/tap-${environmentSuffix}`,
        })
        .promise();

      expect(logGroupsResponse.logGroups!.length).toBeGreaterThan(0);
    });
  });
});
