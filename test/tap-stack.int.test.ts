import fs from 'fs';
import path from 'path';
import {
  CloudFormationClient,
  DescribeStacksCommand,
} from '@aws-sdk/client-cloudformation';
import {
  EC2Client,
  DescribeVpcsCommand,
  DescribeSubnetsCommand,
  DescribeSecurityGroupsCommand,
  DescribeInstancesCommand,
} from '@aws-sdk/client-ec2';
import {
  ElasticLoadBalancingV2Client,
  DescribeLoadBalancersCommand,
  DescribeTargetGroupsCommand,
  DescribeTargetHealthCommand,
} from '@aws-sdk/client-elastic-load-balancing-v2';
import {
  RDSClient,
  DescribeDBClustersCommand,
  DescribeDBInstancesCommand,
} from '@aws-sdk/client-rds';
import {
  S3Client,
  HeadBucketCommand,
  GetBucketEncryptionCommand,
  GetBucketVersioningCommand,
  GetBucketLifecycleConfigurationCommand,
  PutObjectCommand,
  GetObjectCommand,
  ListObjectsV2Command,
} from '@aws-sdk/client-s3';
import {
  AutoScalingClient,
  DescribeAutoScalingGroupsCommand,
} from '@aws-sdk/client-auto-scaling';

const region = process.env.AWS_REGION || 'us-east-1';
const outputs = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../cfn-outputs/flat-outputs.json'), 'utf8')
);

describe('PaymentProcessing Stack - Integration Tests', () => {
  const cfnClient = new CloudFormationClient({ region });
  const ec2Client = new EC2Client({ region });
  const elbClient = new ElasticLoadBalancingV2Client({ region });
  const rdsClient = new RDSClient({ region });
  const s3Client = new S3Client({ region });
  const asgClient = new AutoScalingClient({ region });

  describe('Stack Outputs Validation', () => {
    test('should have all required outputs', () => {
      expect(outputs.ALBDNSName).toBeDefined();
      expect(outputs.RDSEndpoint).toBeDefined();
      expect(outputs.RDSPort).toBeDefined();
      expect(outputs.S3BucketName).toBeDefined();
      expect(outputs.S3BucketArn).toBeDefined();
      expect(outputs.VPCId).toBeDefined();
      expect(outputs.EnvironmentType).toBeDefined();
    });

    test('ALB DNS name should be valid format', () => {
      expect(outputs.ALBDNSName).toMatch(/^PaymentProcessing-ALB-.*\.elb\.amazonaws\.com$/);
    });

    test('RDS endpoint should be valid format', () => {
      expect(outputs.RDSEndpoint).toMatch(/^paymentprocessing-cluster-.*\.rds\.amazonaws\.com$/);
    });

    test('S3 bucket name should include environment and account ID', () => {
      expect(outputs.S3BucketName).toMatch(/^paymentprocessing-logs-.*-\d+$/);
    });

    test('VPC ID should be valid format', () => {
      expect(outputs.VPCId).toMatch(/^vpc-[a-f0-9]{17}$/);
    });

    test('Environment type should be dev', () => {
      expect(outputs.EnvironmentType).toBe('dev');
    });
  });

  describe('VPC and Network Infrastructure', () => {
    test('VPC should exist and be available', async () => {
      const command = new DescribeVpcsCommand({
        VpcIds: [outputs.VPCId],
      });
      const response = await ec2Client.send(command);

      expect(response.Vpcs).toHaveLength(1);
      expect(response.Vpcs[0].State).toBe('available');
      expect(response.Vpcs[0].CidrBlock).toBe('10.0.0.0/16');
    });

    test('VPC should have DNS support enabled', async () => {
      const command = new DescribeVpcsCommand({
        VpcIds: [outputs.VPCId],
      });
      const response = await ec2Client.send(command);

      expect(response.Vpcs[0].EnableDnsSupport).toBe(true);
      expect(response.Vpcs[0].EnableDnsHostnames).toBe(true);
    });

    test('should have exactly 4 subnets (2 public, 2 private)', async () => {
      const command = new DescribeSubnetsCommand({
        Filters: [
          {
            Name: 'vpc-id',
            Values: [outputs.VPCId],
          },
        ],
      });
      const response = await ec2Client.send(command);

      expect(response.Subnets).toHaveLength(4);
    });

    test('should have public subnets in different availability zones', async () => {
      const command = new DescribeSubnetsCommand({
        Filters: [
          {
            Name: 'vpc-id',
            Values: [outputs.VPCId],
          },
          {
            Name: 'tag:Name',
            Values: ['*PublicSubnet*'],
          },
        ],
      });
      const response = await ec2Client.send(command);

      expect(response.Subnets).toHaveLength(2);
      const azs = response.Subnets.map(s => s.AvailabilityZone);
      expect(new Set(azs).size).toBe(2);
    });

    test('public subnets should have auto-assign public IP enabled', async () => {
      const command = new DescribeSubnetsCommand({
        Filters: [
          {
            Name: 'vpc-id',
            Values: [outputs.VPCId],
          },
          {
            Name: 'tag:Name',
            Values: ['*PublicSubnet*'],
          },
        ],
      });
      const response = await ec2Client.send(command);

      response.Subnets.forEach(subnet => {
        expect(subnet.MapPublicIpOnLaunch).toBe(true);
      });
    });
  });

  describe('Security Groups', () => {
    test('should have ALB security group with correct ingress rules', async () => {
      const command = new DescribeSecurityGroupsCommand({
        Filters: [
          {
            Name: 'vpc-id',
            Values: [outputs.VPCId],
          },
          {
            Name: 'group-name',
            Values: ['*ALB-SG*'],
          },
        ],
      });
      const response = await ec2Client.send(command);

      expect(response.SecurityGroups).toHaveLength(1);
      const sg = response.SecurityGroups[0];
      expect(sg.IpPermissions).toHaveLength(2);

      const ports = sg.IpPermissions.map(rule => rule.FromPort);
      expect(ports).toContain(80);
      expect(ports).toContain(443);
    });

    test('should have Instance security group', async () => {
      const command = new DescribeSecurityGroupsCommand({
        Filters: [
          {
            Name: 'vpc-id',
            Values: [outputs.VPCId],
          },
          {
            Name: 'group-name',
            Values: ['*Instance-SG*'],
          },
        ],
      });
      const response = await ec2Client.send(command);

      expect(response.SecurityGroups).toHaveLength(1);
    });

    test('should have Database security group allowing PostgreSQL', async () => {
      const command = new DescribeSecurityGroupsCommand({
        Filters: [
          {
            Name: 'vpc-id',
            Values: [outputs.VPCId],
          },
          {
            Name: 'group-name',
            Values: ['*DB-SG*'],
          },
        ],
      });
      const response = await ec2Client.send(command);

      expect(response.SecurityGroups).toHaveLength(1);
      const sg = response.SecurityGroups[0];
      const pgRule = sg.IpPermissions.find(rule => rule.FromPort === 5432);
      expect(pgRule).toBeDefined();
    });
  });

  describe('Application Load Balancer', () => {
    let albArn: string;

    test('ALB should exist and be active', async () => {
      const command = new DescribeLoadBalancersCommand({
        Names: [outputs.ALBDNSName.split('.')[0]],
      });
      const response = await elbClient.send(command);

      expect(response.LoadBalancers).toHaveLength(1);
      expect(response.LoadBalancers[0].State.Code).toBe('active');
      expect(response.LoadBalancers[0].Type).toBe('application');
      expect(response.LoadBalancers[0].Scheme).toBe('internet-facing');

      albArn = response.LoadBalancers[0].LoadBalancerArn;
    });

    test('ALB should be in multiple availability zones', async () => {
      const command = new DescribeLoadBalancersCommand({
        Names: [outputs.ALBDNSName.split('.')[0]],
      });
      const response = await elbClient.send(command);

      expect(response.LoadBalancers[0].AvailabilityZones).toHaveLength(2);
    });

    test('Target group should exist with correct health check', async () => {
      const command = new DescribeTargetGroupsCommand({
        Names: [`PaymentProcessing-TG-${outputs.EnvironmentType}`],
      });
      const response = await elbClient.send(command);

      expect(response.TargetGroups).toHaveLength(1);
      const tg = response.TargetGroups[0];
      expect(tg.Protocol).toBe('HTTP');
      expect(tg.Port).toBe(80);
      expect(tg.HealthCheckProtocol).toBe('HTTP');
      expect(tg.HealthCheckPath).toBe('/');
      expect(tg.HealthCheckIntervalSeconds).toBe(30);
    });
  });

  describe('Auto Scaling Group', () => {
    test('ASG should exist with correct configuration for dev environment', async () => {
      const command = new DescribeAutoScalingGroupsCommand({
        AutoScalingGroupNames: [`PaymentProcessing-ASG-${outputs.EnvironmentType}`],
      });
      const response = await asgClient.send(command);

      expect(response.AutoScalingGroups).toHaveLength(1);
      const asg = response.AutoScalingGroups[0];
      expect(asg.MinSize).toBe(1);
      expect(asg.MaxSize).toBe(2);
      expect(asg.DesiredCapacity).toBe(1);
      expect(asg.HealthCheckType).toBe('ELB');
      expect(asg.HealthCheckGracePeriod).toBe(300);
    });

    test('ASG should be in multiple availability zones', async () => {
      const command = new DescribeAutoScalingGroupsCommand({
        AutoScalingGroupNames: [`PaymentProcessing-ASG-${outputs.EnvironmentType}`],
      });
      const response = await asgClient.send(command);

      const asg = response.AutoScalingGroups[0];
      expect(asg.AvailabilityZones.length).toBeGreaterThanOrEqual(2);
    });

    test('ASG instances should be using t3.micro for dev environment', async () => {
      const command = new DescribeAutoScalingGroupsCommand({
        AutoScalingGroupNames: [`PaymentProcessing-ASG-${outputs.EnvironmentType}`],
      });
      const response = await asgClient.send(command);

      const asg = response.AutoScalingGroups[0];
      if (asg.Instances && asg.Instances.length > 0) {
        const instanceId = asg.Instances[0].InstanceId;
        const instanceCommand = new DescribeInstancesCommand({
          InstanceIds: [instanceId],
        });
        const instanceResponse = await ec2Client.send(instanceCommand);

        const instance = instanceResponse.Reservations[0].Instances[0];
        expect(instance.InstanceType).toBe('t3.micro');
      }
    });
  });

  describe('RDS Aurora PostgreSQL Cluster', () => {
    test('Aurora cluster should exist and be available', async () => {
      const clusterName = outputs.RDSEndpoint.split('.')[0];
      const command = new DescribeDBClustersCommand({
        DBClusterIdentifier: clusterName,
      });
      const response = await rdsClient.send(command);

      expect(response.DBClusters).toHaveLength(1);
      const cluster = response.DBClusters[0];
      expect(cluster.Status).toBe('available');
      expect(cluster.Engine).toBe('aurora-postgresql');
      expect(cluster.StorageEncrypted).toBe(true);
    });

    test('Aurora cluster should have correct database name', async () => {
      const clusterName = outputs.RDSEndpoint.split('.')[0];
      const command = new DescribeDBClustersCommand({
        DBClusterIdentifier: clusterName,
      });
      const response = await rdsClient.send(command);

      expect(response.DBClusters[0].DatabaseName).toBe('paymentdb');
    });

    test('Aurora cluster should have correct backup retention for dev', async () => {
      const clusterName = outputs.RDSEndpoint.split('.')[0];
      const command = new DescribeDBClustersCommand({
        DBClusterIdentifier: clusterName,
      });
      const response = await rdsClient.send(command);

      expect(response.DBClusters[0].BackupRetentionPeriod).toBe(7);
    });

    test('Aurora cluster should be in VPC', async () => {
      const clusterName = outputs.RDSEndpoint.split('.')[0];
      const command = new DescribeDBClustersCommand({
        DBClusterIdentifier: clusterName,
      });
      const response = await rdsClient.send(command);

      expect(response.DBClusters[0].VpcSecurityGroups).toBeDefined();
      expect(response.DBClusters[0].VpcSecurityGroups.length).toBeGreaterThan(0);
    });

    test('should have one DB instance for dev environment', async () => {
      const command = new DescribeDBInstancesCommand({
        Filters: [
          {
            Name: 'db-cluster-id',
            Values: [outputs.RDSEndpoint.split('.')[0]],
          },
        ],
      });
      const response = await rdsClient.send(command);

      expect(response.DBInstances).toHaveLength(1);
      expect(response.DBInstances[0].Engine).toBe('aurora-postgresql');
      expect(response.DBInstances[0].DBInstanceClass).toBe('db.t3.medium');
      expect(response.DBInstances[0].PubliclyAccessible).toBe(false);
    });
  });

  describe('S3 Transaction Logs Bucket', () => {
    test('S3 bucket should exist and be accessible', async () => {
      const command = new HeadBucketCommand({
        Bucket: outputs.S3BucketName,
      });

      await expect(s3Client.send(command)).resolves.not.toThrow();
    });

    test('S3 bucket should have encryption enabled', async () => {
      const command = new GetBucketEncryptionCommand({
        Bucket: outputs.S3BucketName,
      });
      const response = await s3Client.send(command);

      expect(response.ServerSideEncryptionConfiguration).toBeDefined();
      expect(response.ServerSideEncryptionConfiguration.Rules).toHaveLength(1);
      expect(
        response.ServerSideEncryptionConfiguration.Rules[0].ApplyServerSideEncryptionByDefault.SSEAlgorithm
      ).toBe('AES256');
    });

    test('S3 bucket should have versioning enabled', async () => {
      const command = new GetBucketVersioningCommand({
        Bucket: outputs.S3BucketName,
      });
      const response = await s3Client.send(command);

      expect(response.Status).toBe('Enabled');
    });

    test('S3 bucket should have lifecycle policy with 30 days retention for dev', async () => {
      const command = new GetBucketLifecycleConfigurationCommand({
        Bucket: outputs.S3BucketName,
      });
      const response = await s3Client.send(command);

      expect(response.Rules).toHaveLength(1);
      expect(response.Rules[0].Status).toBe('Enabled');
      expect(response.Rules[0].Expiration.Days).toBe(30);
      expect(response.Rules[0].NoncurrentVersionExpiration.NoncurrentDays).toBe(30);
    });

    test('should be able to put and get objects from S3 bucket', async () => {
      const testKey = `test-transaction-${Date.now()}.log`;
      const testContent = 'Test transaction log entry';

      const putCommand = new PutObjectCommand({
        Bucket: outputs.S3BucketName,
        Key: testKey,
        Body: testContent,
      });
      await s3Client.send(putCommand);

      const getCommand = new GetObjectCommand({
        Bucket: outputs.S3BucketName,
        Key: testKey,
      });
      const response = await s3Client.send(getCommand);

      expect(response.Body).toBeDefined();
      const body = await response.Body.transformToString();
      expect(body).toBe(testContent);
    });

    test('should be able to list objects in S3 bucket', async () => {
      const command = new ListObjectsV2Command({
        Bucket: outputs.S3BucketName,
        MaxKeys: 10,
      });
      const response = await s3Client.send(command);

      expect(response.$metadata.httpStatusCode).toBe(200);
    });
  });

  describe('Resource Tagging', () => {
    test('VPC should have correct tags', async () => {
      const command = new DescribeVpcsCommand({
        VpcIds: [outputs.VPCId],
      });
      const response = await ec2Client.send(command);

      const tags = response.Vpcs[0].Tags || [];
      const envTag = tags.find(t => t.Key === 'Environment');
      const appTag = tags.find(t => t.Key === 'Application');

      expect(envTag).toBeDefined();
      expect(envTag.Value).toBe(outputs.EnvironmentType);
      expect(appTag).toBeDefined();
      expect(appTag.Value).toBe('PaymentProcessing');
    });
  });

  describe('Cross-Resource Integration', () => {
    test('ALB should be connected to target group', async () => {
      const lbCommand = new DescribeLoadBalancersCommand({
        Names: [outputs.ALBDNSName.split('.')[0]],
      });
      const lbResponse = await elbClient.send(lbCommand);
      const albArn = lbResponse.LoadBalancers[0].LoadBalancerArn;

      const tgCommand = new DescribeTargetGroupsCommand({
        LoadBalancerArn: albArn,
      });
      const tgResponse = await elbClient.send(tgCommand);

      expect(tgResponse.TargetGroups).toHaveLength(1);
    });

    test('Aurora cluster should be in private subnets', async () => {
      const clusterName = outputs.RDSEndpoint.split('.')[0];
      const command = new DescribeDBClustersCommand({
        DBClusterIdentifier: clusterName,
      });
      const response = await rdsClient.send(command);

      const subnetGroup = response.DBClusters[0].DBSubnetGroup;
      expect(subnetGroup).toBeDefined();
      expect(subnetGroup.Subnets.length).toBeGreaterThanOrEqual(2);
    });

    test('EC2 instances should have access to S3 bucket', async () => {
      const asgCommand = new DescribeAutoScalingGroupsCommand({
        AutoScalingGroupNames: [`PaymentProcessing-ASG-${outputs.EnvironmentType}`],
      });
      const asgResponse = await asgClient.send(asgCommand);

      const asg = asgResponse.AutoScalingGroups[0];
      expect(asg.Instances).toBeDefined();

      if (asg.Instances.length > 0) {
        const instanceId = asg.Instances[0].InstanceId;
        const ec2Command = new DescribeInstancesCommand({
          InstanceIds: [instanceId],
        });
        const ec2Response = await ec2Client.send(ec2Command);

        const instance = ec2Response.Reservations[0].Instances[0];
        expect(instance.IamInstanceProfile).toBeDefined();
      }
    });
  });

  describe('High Availability and Resilience', () => {
    test('infrastructure should span multiple availability zones', async () => {
      const subnetCommand = new DescribeSubnetsCommand({
        Filters: [
          {
            Name: 'vpc-id',
            Values: [outputs.VPCId],
          },
        ],
      });
      const subnetResponse = await ec2Client.send(subnetCommand);

      const azs = new Set(subnetResponse.Subnets.map(s => s.AvailabilityZone));
      expect(azs.size).toBeGreaterThanOrEqual(2);
    });

    test('ALB should have at least 2 availability zones', async () => {
      const command = new DescribeLoadBalancersCommand({
        Names: [outputs.ALBDNSName.split('.')[0]],
      });
      const response = await elbClient.send(command);

      expect(response.LoadBalancers[0].AvailabilityZones.length).toBeGreaterThanOrEqual(2);
    });
  });
});
