import {
  DescribeInstanceConnectEndpointsCommand,
  DescribeInstancesCommand,
  DescribeSecurityGroupsCommand,
  DescribeSubnetsCommand,
  DescribeVpcsCommand,
  EC2Client,
} from '@aws-sdk/client-ec2';
import {
  DescribeDBInstancesCommand,
  RDSClient,
} from '@aws-sdk/client-rds';
import {
  GetSecretValueCommand,
  SecretsManagerClient,
} from '@aws-sdk/client-secrets-manager';
import fs from 'fs';

// Configuration - These are coming from cfn-outputs after cdk deploy
const outputs = JSON.parse(
  fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
);

const region = process.env.AWS_REGION;
const ec2Client = new EC2Client({ region });
const rdsClient = new RDSClient({ region });
const secretsClient = new SecretsManagerClient({ region });

describe('WebApp Infrastructure Integration Tests', () => {
  const vpcId = outputs.VPCId;
  const ec2InstanceId = outputs.EC2InstanceId;
  const instanceConnectEndpointId = outputs.InstanceConnectEndpointId;
  const rdsEndpoint = outputs.RDSEndpoint;
  const databaseSecretArn = outputs.DatabaseSecretArn;

  describe('VPC Infrastructure', () => {
    test('VPC exists with correct CIDR block', async () => {
      const command = new DescribeVpcsCommand({
        VpcIds: [vpcId],
      });
      const response = await ec2Client.send(command);

      expect(response.Vpcs).toBeDefined();
      expect(response.Vpcs!.length).toBe(1);
      expect(response.Vpcs![0].CidrBlock).toBe('10.0.0.0/16');
      expect(response.Vpcs![0].State).toBe('available');
    });

    test('VPC has exactly three subnets', async () => {
      const command = new DescribeSubnetsCommand({
        Filters: [
          {
            Name: 'vpc-id',
            Values: [vpcId],
          },
        ],
      });
      const response = await ec2Client.send(command);

      expect(response.Subnets).toBeDefined();
      expect(response.Subnets!.length).toBe(3);
    });
  });

  describe('EC2 Instance', () => {
    test('EC2 instance exists and is running', async () => {
      const command = new DescribeInstancesCommand({
        InstanceIds: [ec2InstanceId],
      });
      const response = await ec2Client.send(command);

      expect(response.Reservations).toBeDefined();
      expect(response.Reservations!.length).toBe(1);

      const instance = response.Reservations![0].Instances![0];
      expect(instance.State!.Name).toMatch(/running|pending/);
      expect(instance.VpcId).toBe(vpcId);
    });

    test('EC2 Instance Connect Endpoint exists', async () => {
      const command = new DescribeInstanceConnectEndpointsCommand({
        InstanceConnectEndpointIds: [instanceConnectEndpointId],
      });
      const response = await ec2Client.send(command);

      expect(response.InstanceConnectEndpoints).toBeDefined();
      expect(response.InstanceConnectEndpoints!.length).toBe(1);
    });
  });

  describe('RDS Database', () => {
    test('RDS instance exists and is available', async () => {
      const dbInstanceIdentifier = rdsEndpoint.split('.')[0];
      const command = new DescribeDBInstancesCommand({
        DBInstanceIdentifier: dbInstanceIdentifier,
      });
      const response = await rdsClient.send(command);

      expect(response.DBInstances).toBeDefined();
      expect(response.DBInstances!.length).toBe(1);

      const dbInstance = response.DBInstances![0];
      expect(dbInstance.DBInstanceStatus).toMatch(/available|creating|backing-up/);
      expect(dbInstance.MultiAZ).toBe(true);
      expect(dbInstance.StorageEncrypted).toBe(true);
    });

    test('RDS is in the same VPC as EC2', async () => {
      const dbInstanceIdentifier = rdsEndpoint.split('.')[0];
      const command = new DescribeDBInstancesCommand({
        DBInstanceIdentifier: dbInstanceIdentifier,
      });
      const response = await rdsClient.send(command);

      const dbInstance = response.DBInstances![0];
      expect(dbInstance.DBSubnetGroup!.VpcId).toBe(vpcId);
    });

    test('Database credentials are stored in Secrets Manager', async () => {
      const command = new GetSecretValueCommand({
        SecretId: databaseSecretArn,
      });
      const response = await secretsClient.send(command);

      expect(response.SecretString).toBeDefined();

      const secret = JSON.parse(response.SecretString!);
      expect(secret.username).toBe('admin');
      expect(secret.password).toBeDefined();
      expect(secret.host).toBeDefined();
      expect(secret.port).toBe(3306);
    });
  });

  describe('Security Configuration', () => {
    test('EC2 and RDS security groups are properly linked', async () => {
      const instanceResponse = await ec2Client.send(
        new DescribeInstancesCommand({
          InstanceIds: [ec2InstanceId],
        })
      );

      const dbInstanceIdentifier = rdsEndpoint.split('.')[0];
      const rdsResponse = await rdsClient.send(
        new DescribeDBInstancesCommand({
          DBInstanceIdentifier: dbInstanceIdentifier,
        })
      );

      const ec2SecurityGroupId = instanceResponse.Reservations![0]
        .Instances![0].SecurityGroups![0].GroupId;
      const rdsSecurityGroupId = rdsResponse.DBInstances![0]
        .VpcSecurityGroups![0].VpcSecurityGroupId;

      const rdsSgResponse = await ec2Client.send(
        new DescribeSecurityGroupsCommand({
          GroupIds: [rdsSecurityGroupId!],
        })
      );

      const rdsSecurityGroup = rdsSgResponse.SecurityGroups![0];
      const ingressFromEc2 = rdsSecurityGroup.IpPermissions!.find(
        (rule) =>
          rule.FromPort === 3306 &&
          rule.UserIdGroupPairs?.some((pair) => pair.GroupId === ec2SecurityGroupId)
      );

      expect(ingressFromEc2).toBeDefined();
    });
  });
});
