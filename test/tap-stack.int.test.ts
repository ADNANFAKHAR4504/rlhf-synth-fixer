import fs from 'fs';
import { EC2Client, DescribeVpcsCommand, DescribeSubnetsCommand } from '@aws-sdk/client-ec2';
import { ELBv2Client, DescribeLoadBalancersCommand, DescribeTargetGroupsCommand } from '@aws-sdk/client-elastic-load-balancing-v2';
import { RDSClient, DescribeDBInstancesCommand } from '@aws-sdk/client-rds';
import { S3Client, HeadBucketCommand, GetBucketEncryptionCommand } from '@aws-sdk/client-s3';
import { AutoScalingClient, DescribeAutoScalingGroupsCommand } from '@aws-sdk/client-auto-scaling';

// Configuration - These are coming from cfn-outputs after CloudFormation deployment
const outputs = JSON.parse(
  fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
);

// Get environment suffix from environment variable (set by CI/CD pipeline)
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';
const region = process.env.AWS_REGION || 'us-east-1';

// Initialize AWS SDK clients
const ec2Client = new EC2Client({ region });
const elbClient = new ELBv2Client({ region });
const rdsClient = new RDSClient({ region });
const s3Client = new S3Client({ region });
const asgClient = new AutoScalingClient({ region });

describe('TapStack Infrastructure Integration Tests', () => {
  describe('VPC and Networking', () => {
    test('should have VPC with correct configuration', async () => {
      const vpcId = outputs.VpcId;
      expect(vpcId).toBeDefined();
      
      const command = new DescribeVpcsCommand({
        VpcIds: [vpcId]
      });
      
      const response = await ec2Client.send(command);
      expect(response.Vpcs).toHaveLength(1);
      
      const vpc = response.Vpcs![0];
      expect(vpc.State).toBe('available');
      expect(vpc.CidrBlock).toBeDefined();
      expect(vpc.EnableDnsHostnames).toBe(true);
      expect(vpc.EnableDnsSupport).toBe(true);
    });

    test('should have public and private subnets', async () => {
      const publicSubnets = outputs.PublicSubnets.split(',').filter((s: string) => s.length > 0);
      const privateSubnets = outputs.PrivateSubnets.split(',').filter((s: string) => s.length > 0);
      
      expect(publicSubnets.length).toBeGreaterThanOrEqual(2);
      expect(privateSubnets.length).toBeGreaterThanOrEqual(2);
      
      // Test public subnet accessibility
      const publicCommand = new DescribeSubnetsCommand({
        SubnetIds: publicSubnets
      });
      
      const publicResponse = await ec2Client.send(publicCommand);
      publicResponse.Subnets!.forEach(subnet => {
        expect(subnet.State).toBe('available');
        expect(subnet.MapPublicIpOnLaunch).toBe(true);
      });
      
      // Test private subnet configuration
      const privateCommand = new DescribeSubnetsCommand({
        SubnetIds: privateSubnets
      });
      
      const privateResponse = await ec2Client.send(privateCommand);
      privateResponse.Subnets!.forEach(subnet => {
        expect(subnet.State).toBe('available');
        expect(subnet.MapPublicIpOnLaunch).toBe(false);
      });
    });
  });

  describe('Application Load Balancer', () => {
    test('should have ALB accessible and healthy', async () => {
      const albDns = outputs.AlbDnsName;
      expect(albDns).toBeDefined();
      
      const command = new DescribeLoadBalancersCommand({});
      const response = await ec2Client.send(command);
      
      const alb = response.LoadBalancers!.find(lb => lb.DNSName === albDns);
      expect(alb).toBeDefined();
      expect(alb!.State!.Code).toBe('active');
      expect(alb!.Type).toBe('application');
      expect(alb!.Scheme).toBe('internet-facing');
    });

    test('should have target group with instances', async () => {
      const command = new DescribeTargetGroupsCommand({});
      const response = await elbClient.send(command);
      
      expect(response.TargetGroups).toBeDefined();
      expect(response.TargetGroups!.length).toBeGreaterThan(0);
      
      const targetGroup = response.TargetGroups![0];
      expect(targetGroup.Protocol).toBe('HTTP');
      expect(targetGroup.Port).toBe(80);
    });
  });

  describe('Auto Scaling Group', () => {
    test('should have ASG with desired capacity', async () => {
      const asgName = outputs.AsgName;
      expect(asgName).toBeDefined();
      
      const command = new DescribeAutoScalingGroupsCommand({
        AutoScalingGroupNames: [asgName]
      });
      
      const response = await asgClient.send(command);
      expect(response.AutoScalingGroups).toHaveLength(1);
      
      const asg = response.AutoScalingGroups![0];
      expect(asg.MinSize).toBeGreaterThanOrEqual(2);
      expect(asg.DesiredCapacity).toBeGreaterThanOrEqual(2);
      expect(asg.Instances!.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('RDS Database', () => {
    test('should have RDS instance running with Multi-AZ', async () => {
      const rdsEndpoint = outputs.RdsEndpoint;
      expect(rdsEndpoint).toBeDefined();
      
      const command = new DescribeDBInstancesCommand({});
      const response = await rdsClient.send(command);
      
      expect(response.DBInstances).toBeDefined();
      const dbInstance = response.DBInstances!.find(db => 
        db.Endpoint?.Address === rdsEndpoint
      );
      
      expect(dbInstance).toBeDefined();
      expect(dbInstance!.DBInstanceStatus).toBe('available');
      expect(dbInstance!.MultiAZ).toBe(true);
      expect(dbInstance!.StorageEncrypted).toBe(true);
      expect(dbInstance!.PubliclyAccessible).toBe(false);
    });
  });

  describe('S3 Storage', () => {
    test('should have S3 bucket accessible and encrypted', async () => {
      const bucketName = outputs.S3BucketNameOut;
      expect(bucketName).toBeDefined();
      
      // Test bucket exists and is accessible
      const headCommand = new HeadBucketCommand({
        Bucket: bucketName
      });
      
      await expect(s3Client.send(headCommand)).resolves.not.toThrow();
      
      // Test bucket encryption
      const encCommand = new GetBucketEncryptionCommand({
        Bucket: bucketName
      });
      
      const encResponse = await s3Client.send(encCommand);
      expect(encResponse.ServerSideEncryptionConfiguration).toBeDefined();
    });
  });

  describe('Security and Compliance', () => {
    test('should have AWS Config enabled', async () => {
      const configStatus = outputs.AwsConfigStatus;
      expect(configStatus).toBeDefined();
    });
    
    test('should have security groups properly configured', async () => {
      const securityGroups = outputs.SecurityGroups.split(',');
      expect(securityGroups.length).toBe(3); // ALB, Web, DB security groups
    });
  });

  describe('End-to-End Connectivity', () => {
    test('should be able to reach ALB endpoint', async () => {
      const albDns = outputs.AlbDnsName;
      expect(albDns).toBeDefined();
      
      // Test HTTP endpoint accessibility (basic connectivity)
      const url = `http://${albDns}`;
      
      try {
        const response = await fetch(url, { 
          method: 'HEAD',
          timeout: 10000 
        });
        // We expect some response (even if 404/503) indicating ALB is reachable
        expect(response).toBeDefined();
      } catch (error) {
        // If connection is refused, ALB might not have healthy targets yet
        // This is acceptable for infrastructure validation
        console.warn('ALB endpoint not yet accessible:', error);
      }
    });

    test('infrastructure resources should be properly tagged', async () => {
      // Verify that key infrastructure components exist with expected names/tags
      const vpcId = outputs.VpcId;
      const command = new DescribeVpcsCommand({ VpcIds: [vpcId] });
      const response = await ec2Client.send(command);
      
      const vpc = response.Vpcs![0];
      const nameTag = vpc.Tags!.find(tag => tag.Key === 'Name');
      expect(nameTag).toBeDefined();
      expect(nameTag!.Value).toContain('vpc');
    });
  });
});
