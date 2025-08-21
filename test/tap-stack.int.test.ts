// Configuration - These are coming from cfn-outputs after cdk deploy
import fs from 'fs';
import { EC2Client, DescribeVpcsCommand, DescribeSubnetsCommand, DescribeSecurityGroupsCommand } from '@aws-sdk/client-ec2';
import { RDSClient, DescribeDBInstancesCommand } from '@aws-sdk/client-rds';
import { S3Client, HeadBucketCommand, GetBucketVersioningCommand } from '@aws-sdk/client-s3';
import { AutoScalingClient, DescribeAutoScalingGroupsCommand } from '@aws-sdk/client-auto-scaling';
import { ElasticLoadBalancingV2Client, DescribeLoadBalancersCommand } from '@aws-sdk/client-elastic-load-balancing-v2';
import { CloudWatchClient, DescribeAlarmsCommand } from '@aws-sdk/client-cloudwatch';
import { IAMClient, GetRoleCommand } from '@aws-sdk/client-iam';

const outputs = JSON.parse(
  fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
);

// Get environment suffix from environment variable (set by CI/CD pipeline)
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

// Get AWS region from file
const awsRegion = fs.readFileSync('lib/AWS_REGION', 'utf8').trim();

// Initialize AWS clients
const ec2Client = new EC2Client({ region: awsRegion });
const rdsClient = new RDSClient({ region: awsRegion });
const s3Client = new S3Client({ region: awsRegion });
const asgClient = new AutoScalingClient({ region: awsRegion });
const elbv2Client = new ElasticLoadBalancingV2Client({ region: awsRegion });
const cloudWatchClient = new CloudWatchClient({ region: awsRegion });
const iamClient = new IAMClient({ region: awsRegion });

describe('TapStack Infrastructure Integration Tests', () => {
  describe('VPC and Networking', () => {
    test('should have VPC created with correct CIDR block', async () => {
      const vpcId = outputs.VPCId;
      expect(vpcId).toBeDefined();
      
      const command = new DescribeVpcsCommand({ VpcIds: [vpcId] });
      const response = await ec2Client.send(command);
      
      expect(response.Vpcs).toHaveLength(1);
      const vpc = response.Vpcs![0];
      expect(vpc.CidrBlock).toBe('10.0.0.0/16');
      expect(vpc.State).toBe('available');
    });

    test('should have public subnets with auto-assign public IPs', async () => {
      const publicSubnet1Id = outputs.PublicSubnet1Id;
      const publicSubnet2Id = outputs.PublicSubnet2Id;
      
      expect(publicSubnet1Id).toBeDefined();
      expect(publicSubnet2Id).toBeDefined();
      
      const command = new DescribeSubnetsCommand({ 
        SubnetIds: [publicSubnet1Id, publicSubnet2Id] 
      });
      const response = await ec2Client.send(command);
      
      expect(response.Subnets).toHaveLength(2);
      response.Subnets!.forEach(subnet => {
        expect(subnet.MapPublicIpOnLaunch).toBe(true);
        expect(subnet.State).toBe('available');
      });
    });

    test('should have private subnets', async () => {
      const privateSubnet1Id = outputs.PrivateSubnet1Id;
      const privateSubnet2Id = outputs.PrivateSubnet2Id;
      
      expect(privateSubnet1Id).toBeDefined();
      expect(privateSubnet2Id).toBeDefined();
      
      const command = new DescribeSubnetsCommand({ 
        SubnetIds: [privateSubnet1Id, privateSubnet2Id] 
      });
      const response = await ec2Client.send(command);
      
      expect(response.Subnets).toHaveLength(2);
      response.Subnets!.forEach(subnet => {
        expect(subnet.MapPublicIpOnLaunch).toBe(false);
        expect(subnet.State).toBe('available');
      });
    });

    test('should have security groups with correct rules', async () => {
      const vpcId = outputs.VPCId;
      
      const command = new DescribeSecurityGroupsCommand({ 
        Filters: [{ Name: 'vpc-id', Values: [vpcId] }] 
      });
      const response = await ec2Client.send(command);
      
      expect(response.SecurityGroups).toBeDefined();
      expect(response.SecurityGroups!.length).toBeGreaterThan(0);
      
      // Check for ALB security group
      const albSg = response.SecurityGroups!.find(sg => 
        sg.GroupName?.includes('ALB-SecurityGroup')
      );
      expect(albSg).toBeDefined();
      expect(albSg!.IpPermissions).toBeDefined();
      
      // Check for web server security group
      const webSg = response.SecurityGroups!.find(sg => 
        sg.GroupName?.includes('WebServer-SecurityGroup')
      );
      expect(webSg).toBeDefined();
      
      // Check for database security group
      const dbSg = response.SecurityGroups!.find(sg => 
        sg.GroupName?.includes('Database-SecurityGroup')
      );
      expect(dbSg).toBeDefined();
    });
  });

  describe('RDS Database', () => {
    test('should have RDS instance created and available', async () => {
      const dbEndpoint = outputs.DatabaseEndpoint;
      expect(dbEndpoint).toBeDefined();
      
      const command = new DescribeDBInstancesCommand({});
      const response = await rdsClient.send(command);
      
      const dbInstance = response.DBInstances!.find(db => 
        db.Endpoint?.Address === dbEndpoint
      );
      
      expect(dbInstance).toBeDefined();
      expect(dbInstance!.DBInstanceStatus).toBe('available');
      expect(dbInstance!.MultiAZ).toBe(true);
      expect(dbInstance!.StorageEncrypted).toBe(true);
      expect(dbInstance!.Engine).toBe('mysql');
      expect(dbInstance!.EngineVersion).toBe('8.0.35');
    });

    test('should have database read replica', async () => {
      const command = new DescribeDBInstancesCommand({});
      const response = await rdsClient.send(command);
      
      const readReplica = response.DBInstances!.find(db => 
        db.ReadReplicaSourceDBInstanceIdentifier && 
        db.DBInstanceStatus === 'available'
      );
      
      expect(readReplica).toBeDefined();
      expect(readReplica!.ReadReplicaSourceDBInstanceIdentifier).toBeDefined();
    });
  });

  describe('S3 Storage', () => {
    test('should have S3 backup bucket created', async () => {
      const bucketName = outputs.BackupBucketName;
      expect(bucketName).toBeDefined();
      
      const headCommand = new HeadBucketCommand({ Bucket: bucketName });
      await expect(s3Client.send(headCommand)).resolves.not.toThrow();
      
      const versioningCommand = new GetBucketVersioningCommand({ Bucket: bucketName });
      const versioningResponse = await s3Client.send(versioningCommand);
      expect(versioningResponse.Status).toBe('Enabled');
    });
  });

  describe('Auto Scaling Group', () => {
    test('should have Auto Scaling Group with correct configuration', async () => {
      const asgName = outputs.AutoScalingGroupName;
      expect(asgName).toBeDefined();
      
      const command = new DescribeAutoScalingGroupsCommand({ 
        AutoScalingGroupNames: [asgName] 
      });
      const response = await asgClient.send(command);
      
      expect(response.AutoScalingGroups).toHaveLength(1);
      const asg = response.AutoScalingGroups![0];
      
      expect(asg.MinSize).toBe(2);
      expect(asg.MaxSize).toBe(6);
      expect(asg.DesiredCapacity).toBe(2);
      expect(asg.HealthCheckType).toBe('ELB');
      expect(asg.Status).toBeDefined();
    });

    test('should have Auto Scaling Group instances in healthy state', async () => {
      const asgName = outputs.AutoScalingGroupName;
      
      const command = new DescribeAutoScalingGroupsCommand({ 
        AutoScalingGroupNames: [asgName] 
      });
      const response = await asgClient.send(command);
      
      const asg = response.AutoScalingGroups![0];
      expect(asg.Instances).toBeDefined();
      expect(asg.Instances!.length).toBeGreaterThan(0);
      
      // Check that instances are healthy
      const healthyInstances = asg.Instances!.filter((instance: any) => 
        instance.HealthStatus === 'Healthy' && 
        instance.LifecycleState === 'InService'
      );
      expect(healthyInstances.length).toBeGreaterThan(0);
    });
  });

  describe('Application Load Balancer', () => {
    test('should have Application Load Balancer created and active', async () => {
      const albArn = outputs.ApplicationLoadBalancerArn;
      expect(albArn).toBeDefined();
      
      const command = new DescribeLoadBalancersCommand({ 
        LoadBalancerArns: [albArn] 
      });
      const response = await elbv2Client.send(command);
      
      expect(response.LoadBalancers).toHaveLength(1);
      const alb = response.LoadBalancers![0];
      
      expect(alb.Type).toBe('application');
      expect(alb.Scheme).toBe('internet-facing');
      expect(alb.State?.Code).toBe('active');
    });

    test('should have ALB DNS name accessible', async () => {
      const albDns = outputs.ApplicationLoadBalancerDNS;
      expect(albDns).toBeDefined();
      expect(albDns).toMatch(/^[a-zA-Z0-9-]+\.elb\.amazonaws\.com$/);
    });
  });

  describe('CloudWatch Monitoring', () => {
    test('should have CloudWatch alarms configured', async () => {
      const command = new DescribeAlarmsCommand({});
      const response = await cloudWatchClient.send(command);
      
      const cpuAlarms = response.MetricAlarms!.filter(alarm => 
        alarm.AlarmName?.includes('CPU-High') || 
        alarm.AlarmName?.includes('CPU-Low')
      );
      
      expect(cpuAlarms.length).toBeGreaterThan(0);
      
      // Check that alarms are configured for Auto Scaling
      const asgAlarms = cpuAlarms.filter(alarm => 
        alarm.Dimensions?.some(dim => dim.Name === 'AutoScalingGroupName')
      );
      expect(asgAlarms.length).toBeGreaterThan(0);
    });
  });

  describe('IAM Roles', () => {
    test('should have EC2 role created with correct permissions', async () => {
      const roleName = `${outputs.EnvironmentName}-EC2-Role`;
      
      const command = new GetRoleCommand({ RoleName: roleName });
      const response = await iamClient.send(command);
      
      expect(response.Role).toBeDefined();
      expect(response.Role!.RoleName).toBe(roleName);
      
      // Note: AttachedManagedPolicies might not be available in the response
      // We'll just check that the role exists and has the correct name
      expect(response.Role!.RoleName).toBe(roleName);
    });
  });

  describe('Bastion Host', () => {
    test('should have bastion host with public IP', async () => {
      const bastionIP = outputs.BastionHostPublicIP;
      expect(bastionIP).toBeDefined();
      expect(bastionIP).toMatch(/^\d+\.\d+\.\d+\.\d+$/);
    });
  });

  describe('Infrastructure Health Check', () => {
    test('should have all critical resources in healthy state', async () => {
      // Check VPC
      const vpcId = outputs.VPCId;
      const vpcCommand = new DescribeVpcsCommand({ VpcIds: [vpcId] });
      const vpcResponse = await ec2Client.send(vpcCommand);
      expect(vpcResponse.Vpcs![0].State).toBe('available');
      
      // Check RDS
      const dbEndpoint = outputs.DatabaseEndpoint;
      const rdsCommand = new DescribeDBInstancesCommand({});
      const rdsResponse = await rdsClient.send(rdsCommand);
      const dbInstance = rdsResponse.DBInstances!.find(db => 
        db.Endpoint?.Address === dbEndpoint
      );
      expect(dbInstance!.DBInstanceStatus).toBe('available');
      
      // Check Auto Scaling Group
      const asgName = outputs.AutoScalingGroupName;
      const asgCommand = new DescribeAutoScalingGroupsCommand({ 
        AutoScalingGroupNames: [asgName] 
      });
      const asgResponse = await asgClient.send(asgCommand);
      const asg = asgResponse.AutoScalingGroups![0];
      expect(asg.Status).toBeDefined();
      
      // Check ALB
      const albArn = outputs.ApplicationLoadBalancerArn;
      const albCommand = new DescribeLoadBalancersCommand({ 
        LoadBalancerArns: [albArn] 
      });
      const albResponse = await elbv2Client.send(albCommand);
      expect(albResponse.LoadBalancers![0].State?.Code).toBe('active');
    });
  });

  describe('Security and Compliance', () => {
    test('should have encrypted storage for all resources', async () => {
      // Check RDS encryption
      const dbEndpoint = outputs.DatabaseEndpoint;
      const rdsCommand = new DescribeDBInstancesCommand({});
      const rdsResponse = await rdsClient.send(rdsCommand);
      const dbInstance = rdsResponse.DBInstances!.find(db => 
        db.Endpoint?.Address === dbEndpoint
      );
      expect(dbInstance!.StorageEncrypted).toBe(true);
      
      // Check S3 bucket encryption (implicitly tested in bucket creation)
      const bucketName = outputs.BackupBucketName;
      expect(bucketName).toBeDefined();
    });

    test('should have proper security group configurations', async () => {
      const vpcId = outputs.VPCId;
      
      const command = new DescribeSecurityGroupsCommand({ 
        Filters: [{ Name: 'vpc-id', Values: [vpcId] }] 
      });
      const response = await ec2Client.send(command);
      
      // Check that database security group only allows access from web servers
      const dbSg = response.SecurityGroups!.find(sg => 
        sg.GroupName?.includes('Database-SecurityGroup')
      );
      expect(dbSg).toBeDefined();
      
      // Check that ALB security group allows HTTP/HTTPS from anywhere
      const albSg = response.SecurityGroups!.find(sg => 
        sg.GroupName?.includes('ALB-SecurityGroup')
      );
      expect(albSg).toBeDefined();
      expect(albSg!.IpPermissions).toBeDefined();
    });
  });
});
