import {
  DescribeInstancesCommand,
  DescribeSecurityGroupsCommand,
  DescribeSubnetsCommand,
  DescribeVpcsCommand,
  EC2Client
} from "@aws-sdk/client-ec2";
import { DescribeClustersCommand, ECSClient } from "@aws-sdk/client-ecs";
import { DescribeLoadBalancersCommand, ElasticLoadBalancingV2Client } from "@aws-sdk/client-elastic-load-balancing-v2";
import { DescribeKeyCommand, KMSClient } from "@aws-sdk/client-kms";
import { DescribeDBInstancesCommand, RDSClient } from "@aws-sdk/client-rds";
import { HeadBucketCommand, S3Client } from "@aws-sdk/client-s3";
import fs from 'fs';

describe('Infrastructure Integration Tests', () => {
  const region = "us-east-1";

  const ec2Client = new EC2Client({ region });
  const s3Client = new S3Client({ region });
  const ecsClient = new ECSClient({ region });
  const elbv2Client = new ElasticLoadBalancingV2Client({ region });
  const rdsClient = new RDSClient({ region });
  const kmsClient = new KMSClient({ region });

  // CloudFormation stack outputs
  const outputs = JSON.parse(
    fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
  );

  // VPC Tests
  describe('VPC Resources', () => {
    test('VPC should exist', async () => {
      const result = await ec2Client.send(new DescribeVpcsCommand({
        VpcIds: [outputs.VPCId]
      }));

      expect(result.Vpcs).toBeDefined();
      expect(result.Vpcs!.length).toBe(1);
      expect(result.Vpcs![0].VpcId).toBe(outputs.VPCId);
      expect(result.Vpcs![0].State).toBe('available');
    });

    test('All subnets should exist', async () => {
      const subnetIds = [
        outputs.PrivateSubnet1Id,
        outputs.PrivateSubnet2Id,
        outputs.PublicSubnet1Id,
        outputs.PublicSubnet2Id
      ];

      const result = await ec2Client.send(new DescribeSubnetsCommand({
        SubnetIds: subnetIds
      }));

      expect(result.Subnets).toBeDefined();
      expect(result.Subnets!.length).toBe(4);

      subnetIds.forEach(subnetId => {
        const subnet = result.Subnets!.find(s => s.SubnetId === subnetId);
        expect(subnet).toBeDefined();
        expect(subnet!.State).toBe('available');
        expect(subnet!.VpcId).toBe(outputs.VPCId);
      });
    });

    test('Private subnets should not auto-assign public IPs', async () => {
      const privateSubnetIds = [outputs.PrivateSubnet1Id, outputs.PrivateSubnet2Id];

      const result = await ec2Client.send(new DescribeSubnetsCommand({
        SubnetIds: privateSubnetIds
      }));

      result.Subnets!.forEach(subnet => {
        expect(subnet.MapPublicIpOnLaunch).toBe(false);
      });
    });

    test('Public subnets should auto-assign public IPs', async () => {
      const publicSubnetIds = [outputs.PublicSubnet1Id, outputs.PublicSubnet2Id];

      const result = await ec2Client.send(new DescribeSubnetsCommand({
        SubnetIds: publicSubnetIds
      }));

      result.Subnets!.forEach(subnet => {
        expect(subnet.MapPublicIpOnLaunch).toBe(true);
      });
    });
  });

  // Security Group Tests
  describe('Security Groups', () => {
    test('All security groups should exist', async () => {
      const securityGroupIds = [
        outputs.ECSSecurityGroupId,
        outputs.DatabaseSecurityGroupId,
        outputs.WebServerSecurityGroupId
      ];

      const result = await ec2Client.send(new DescribeSecurityGroupsCommand({
        GroupIds: securityGroupIds
      }));

      expect(result.SecurityGroups).toBeDefined();
      expect(result.SecurityGroups!.length).toBe(3);

      securityGroupIds.forEach(sgId => {
        const sg = result.SecurityGroups!.find(s => s.GroupId === sgId);
        expect(sg).toBeDefined();
        expect(sg!.VpcId).toBe(outputs.VPCId);
      });
    });

    test('ECS security group should allow port 80 from web server SG', async () => {
      const result = await ec2Client.send(new DescribeSecurityGroupsCommand({
        GroupIds: [outputs.ECSSecurityGroupId]
      }));

      const ecsSg = result.SecurityGroups![0];
      const port80Rule = ecsSg.IpPermissions!.find(rule =>
        rule.FromPort === 80 && rule.ToPort === 80
      );

      expect(port80Rule).toBeDefined();
      expect(port80Rule!.UserIdGroupPairs![0].GroupId).toBe(outputs.WebServerSecurityGroupId);
    });

    test('Database security group should allow port 3306 from web server SG', async () => {
      const result = await ec2Client.send(new DescribeSecurityGroupsCommand({
        GroupIds: [outputs.DatabaseSecurityGroupId]
      }));

      const dbSg = result.SecurityGroups![0];
      const mysqlRule = dbSg.IpPermissions!.find(rule =>
        rule.FromPort === 3306 && rule.ToPort === 3306
      );

      expect(mysqlRule).toBeDefined();
      expect(mysqlRule!.UserIdGroupPairs![0].GroupId).toBe(outputs.WebServerSecurityGroupId);
    });
  });

  // EC2 Tests
  describe('EC2 Resources', () => {
    test('EC2 instance should exist and be running', async () => {
      const result = await ec2Client.send(new DescribeInstancesCommand({
        InstanceIds: [outputs.EC2InstanceId]
      }));

      expect(result.Reservations).toBeDefined();
      expect(result.Reservations!.length).toBe(1);

      const instance = result.Reservations![0].Instances![0];
      expect(instance.InstanceId).toBe(outputs.EC2InstanceId);
      expect(['running', 'pending']).toContain(instance.State!.Name);
      expect(instance.VpcId).toBe(outputs.VPCId);
    });


  });

  // S3 Tests
  describe('S3 Resources', () => {
    test('Application bucket should exist', async () => {
      await expect(s3Client.send(new HeadBucketCommand({
        Bucket: outputs.ApplicationBucketName
      }))).resolves.not.toThrow();
    });

    test('Logging bucket should exist', async () => {
      await expect(s3Client.send(new HeadBucketCommand({
        Bucket: outputs.LoggingBucketName
      }))).resolves.not.toThrow();
    });

    test('Backup bucket should exist', async () => {
      await expect(s3Client.send(new HeadBucketCommand({
        Bucket: outputs.BackupBucketName
      }))).resolves.not.toThrow();
    });
  });

  // KMS Tests
  describe('KMS Resources', () => {
    test('Infrastructure KMS key should exist', async () => {
      const result = await kmsClient.send(new DescribeKeyCommand({
        KeyId: outputs.InfrastructureKMSKeyId
      }));

      expect(result.KeyMetadata).toBeDefined();
      expect(result.KeyMetadata!.KeyId).toBe(outputs.InfrastructureKMSKeyId);
      expect(result.KeyMetadata!.KeyState).toBe('Enabled');
      expect(result.KeyMetadata!.KeyUsage).toBe('ENCRYPT_DECRYPT');
    });
  });

  // ECS Tests
  describe('ECS Resources', () => {
    test('ECS cluster should exist and be active', async () => {
      const result = await ecsClient.send(new DescribeClustersCommand({
        clusters: [outputs.ECSClusterName]
      }));

      expect(result.clusters).toBeDefined();
      expect(result.clusters!.length).toBe(1);
      expect(result.clusters![0].clusterName).toBe(outputs.ECSClusterName);
      expect(result.clusters![0].status).toBe('ACTIVE');
    });
  });

  // Load Balancer Tests
  describe('Load Balancer Resources', () => {
    test('Application Load Balancer should exist', async () => {
      const result = await elbv2Client.send(new DescribeLoadBalancersCommand({}));

      const alb = result.LoadBalancers!.find(lb =>
        lb.DNSName === outputs.LoadBalancerDNS
      );

      expect(alb).toBeDefined();
      expect(alb!.State!.Code).toBe('active');
      expect(alb!.Scheme).toBe('internal');
      expect(alb!.VpcId).toBe(outputs.VPCId);
    });
  });

  // RDS Tests
  describe('RDS Resources', () => {
    test('RDS instance should exist and be available', async () => {
      const result = await rdsClient.send(new DescribeDBInstancesCommand({}));

      const dbInstance = result.DBInstances!.find(db =>
        db.Endpoint!.Address === outputs.RDSEndpoint
      );

      expect(dbInstance).toBeDefined();
      expect(['available', 'creating']).toContain(dbInstance!.DBInstanceStatus);
      expect(dbInstance!.Engine).toBe('mysql');
      expect(dbInstance!.StorageEncrypted).toBe(true);
      expect(dbInstance!.MultiAZ).toBe(true);
    });
  });
});
