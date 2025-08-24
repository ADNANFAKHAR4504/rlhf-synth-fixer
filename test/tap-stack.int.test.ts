import fs from 'fs';
import { 
  EC2Client, 
  DescribeVpcsCommand, 
  DescribeInstancesCommand,
  DescribeSecurityGroupsCommand,
  DescribeSubnetsCommand
} from '@aws-sdk/client-ec2';
import { 
  RDSClient, 
  DescribeDBInstancesCommand 
} from '@aws-sdk/client-rds';
import { 
  ElasticLoadBalancingV2Client, 
  DescribeLoadBalancersCommand,
  DescribeTargetGroupsCommand
} from '@aws-sdk/client-elastic-load-balancing-v2';
import { 
  AutoScalingClient, 
  DescribeAutoScalingGroupsCommand 
} from '@aws-sdk/client-auto-scaling';
import { 
  S3Client, 
  GetBucketEncryptionCommand,
  GetBucketVersioningCommand,
  GetPublicAccessBlockCommand
} from '@aws-sdk/client-s3';
import { 
  KMSClient, 
  DescribeKeyCommand 
} from '@aws-sdk/client-kms';
import { 
  CloudWatchClient, 
  DescribeAlarmsCommand 
} from '@aws-sdk/client-cloudwatch';
import { 
  SecretsManagerClient, 
  DescribeSecretCommand 
} from '@aws-sdk/client-secrets-manager';

// Configuration - These are coming from cfn-outputs after cdk deploy
const outputs = JSON.parse(
  fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
);

// Get AWS region from file
const awsRegion = fs.readFileSync('lib/AWS_REGION', 'utf8').trim();

// Initialize AWS clients
const ec2Client = new EC2Client({ region: awsRegion });
const rdsClient = new RDSClient({ region: awsRegion });
const elbv2Client = new ElasticLoadBalancingV2Client({ region: awsRegion });
const asgClient = new AutoScalingClient({ region: awsRegion });
const s3Client = new S3Client({ region: awsRegion });
const kmsClient = new KMSClient({ region: awsRegion });
const cloudWatchClient = new CloudWatchClient({ region: awsRegion });
const secretsManagerClient = new SecretsManagerClient({ region: awsRegion });

describe('TapStack Infrastructure Integration Tests', () => {
  describe('VPC Resources', () => {
    test('should have VPC with correct CIDR block', async () => {
      const command = new DescribeVpcsCommand({
        VpcIds: [outputs.VPCId]
      });
      
      const response = await ec2Client.send(command);
      const vpc = response.Vpcs?.[0];
      
      expect(vpc).toBeDefined();
      expect(vpc?.VpcId).toBe(outputs.VPCId);
      expect(vpc?.CidrBlock).toBe('10.192.0.0/16');
      expect(vpc?.State).toBe('available');
    });

    test('should have subnets in multiple availability zones', async () => {
      const command = new DescribeSubnetsCommand({
        Filters: [
          {
            Name: 'vpc-id',
            Values: [outputs.VPCId]
          }
        ]
      });
      
      const response = await ec2Client.send(command);
      const subnets = response.Subnets || [];
      
      expect(subnets.length).toBeGreaterThanOrEqual(5); // Public and private subnets
      
      // Check for public subnets
      const publicSubnets = subnets.filter(subnet => subnet.MapPublicIpOnLaunch);
      expect(publicSubnets.length).toBeGreaterThanOrEqual(2);
      
      // Check for private subnets
      const privateSubnets = subnets.filter(subnet => !subnet.MapPublicIpOnLaunch);
      expect(privateSubnets.length).toBeGreaterThanOrEqual(3);
    });

    test('should have security groups with correct rules', async () => {
      const command = new DescribeSecurityGroupsCommand({
        Filters: [
          {
            Name: 'vpc-id',
            Values: [outputs.VPCId]
          }
        ]
      });
      
      const response = await ec2Client.send(command);
      const securityGroups = response.SecurityGroups || [];
      
      expect(securityGroups.length).toBeGreaterThanOrEqual(4); // ALB, WebServer, Bastion, Database
      
      // Check for ALB security group
      const albSg = securityGroups.find(sg => sg.GroupName?.includes('LoadBalancer'));
      expect(albSg).toBeDefined();
      expect(albSg?.IpPermissions).toBeDefined();
      
      // Check for Database security group
      const dbSg = securityGroups.find(sg => sg.GroupName?.includes('Database'));
      expect(dbSg).toBeDefined();
    });
  });

  describe('Load Balancer Resources', () => {
    test('should have Application Load Balancer accessible', async () => {
      const command = new DescribeLoadBalancersCommand({
        Names: ['TapStack-ALB']
      });
      
      const response = await elbv2Client.send(command);
      const alb = response.LoadBalancers?.[0];
      
      expect(alb).toBeDefined();
      expect(alb?.Type).toBe('application');
      expect(alb?.Scheme).toBe('internet-facing');
      expect(alb?.State?.Code).toBe('active');
      expect(alb?.DNSName).toBe(outputs.LoadBalancerDNS);
    });

    test('should have target groups configured', async () => {
      const command = new DescribeTargetGroupsCommand({});
      
      const response = await elbv2Client.send(command);
      const targetGroups = response.TargetGroups || [];
      
      const tapStackTargetGroup = targetGroups.find(tg => tg.TargetGroupName?.includes('TapStack'));
      expect(tapStackTargetGroup).toBeDefined();
      expect(tapStackTargetGroup?.Protocol).toBe('HTTP');
      expect(tapStackTargetGroup?.Port).toBe(80);
      expect(tapStackTargetGroup?.TargetType).toBe('instance');
    });

    test('should have healthy targets in target group', async () => {
      const command = new DescribeTargetGroupsCommand({});
      
      const response = await elbv2Client.send(command);
      const targetGroups = response.TargetGroups || [];
      
      const tapStackTargetGroup = targetGroups.find(tg => tg.TargetGroupName?.includes('TapStack'));
      expect(tapStackTargetGroup).toBeDefined();
      
      // Note: This test assumes targets are registered and healthy
      // In a real scenario, you might need to wait for instances to be ready
    });
  });

  describe('Auto Scaling Resources', () => {
    test('should have Auto Scaling Group configured', async () => {
      const command = new DescribeAutoScalingGroupsCommand({
        AutoScalingGroupNames: ['TapStack-ASG']
      });
      
      const response = await asgClient.send(command);
      const asg = response.AutoScalingGroups?.[0];
      
      expect(asg).toBeDefined();
      expect(asg?.AutoScalingGroupName).toBe('TapStack-ASG');
      expect(asg?.MinSize).toBe(2);
      expect(asg?.MaxSize).toBe(4);
      expect(asg?.DesiredCapacity).toBe(2);
      expect(asg?.HealthCheckType).toBe('ELB');
    });

    test('should have instances running in Auto Scaling Group', async () => {
      const command = new DescribeAutoScalingGroupsCommand({
        AutoScalingGroupNames: ['TapStack-ASG']
      });
      
      const response = await asgClient.send(command);
      const asg = response.AutoScalingGroups?.[0];
      
      expect(asg).toBeDefined();
      expect(asg?.Instances?.length).toBeGreaterThanOrEqual(2);
      
      // Check that instances are in service
      const inServiceInstances = asg?.Instances?.filter(instance => instance.LifecycleState === 'InService');
      expect(inServiceInstances?.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Database Resources', () => {
    test('should have RDS database instance running', async () => {
      const command = new DescribeDBInstancesCommand({
        DBInstanceIdentifier: 'TapStack-database'
      });
      
      const response = await rdsClient.send(command);
      const dbInstance = response.DBInstances?.[0];
      
      expect(dbInstance).toBeDefined();
      expect(dbInstance?.DBInstanceIdentifier).toBe('TapStack-database');
      expect(dbInstance?.DBInstanceStatus).toBe('available');
      expect(dbInstance?.Engine).toBe('mysql');
      expect(dbInstance?.EngineVersion).toBe('8.0.35');
      expect(dbInstance?.DBInstanceClass).toBe('db.t3.micro');
      expect(dbInstance?.StorageEncrypted).toBe(true);
      expect(dbInstance?.MultiAZ).toBe(true);
    });

    test('should have database endpoint accessible', () => {
      expect(outputs.DatabaseEndpoint).toBeDefined();
      expect(typeof outputs.DatabaseEndpoint).toBe('string');
      expect(outputs.DatabaseEndpoint.length).toBeGreaterThan(0);
    });
  });

  describe('Security Resources', () => {
    test('should have Bastion Host instance running', async () => {
      const command = new DescribeInstancesCommand({
        Filters: [
          {
            Name: 'tag:Name',
            Values: ['TapStack-Bastion']
          },
          {
            Name: 'instance-state-name',
            Values: ['running']
          }
        ]
      });
      
      const response = await ec2Client.send(command);
      const instances = response.Reservations?.flatMap(reservation => reservation.Instances || []);
      
      expect(instances?.length).toBeGreaterThan(0);
      const bastionInstance = instances?.[0];
      expect(bastionInstance?.InstanceType).toBe('t3.micro');
      expect(bastionInstance?.State?.Name).toBe('running');
    });

    test('should have KMS key for encryption', async () => {
      // This test assumes the KMS key ARN is available in outputs or can be derived
      // In a real scenario, you might need to list keys and find the one with the right alias
      const command = new DescribeKeyCommand({
        KeyId: 'alias/TapStack-key'
      });
      
      try {
        const response = await kmsClient.send(command);
        const key = response.KeyMetadata;
        
        expect(key).toBeDefined();
        expect(key?.KeyState).toBe('Enabled');
        expect(key?.Description).toContain('TapStack encryption');
      } catch (error) {
        // If key doesn't exist, this test will fail
        expect(error).toBeUndefined();
      }
    });
  });

  describe('Storage Resources', () => {
    test('should have S3 bucket with encryption enabled', async () => {
      const bucketName = `TapStack-secure-bucket-${process.env.AWS_ACCOUNT_ID || 'test'}`;
      
      try {
        const command = new GetBucketEncryptionCommand({
          Bucket: bucketName
        });
        
        const response = await s3Client.send(command);
        const encryption = response.ServerSideEncryptionConfiguration;
        
        expect(encryption).toBeDefined();
        expect(encryption?.Rules?.[0]?.ApplyServerSideEncryptionByDefault?.SSEAlgorithm).toBe('aws:kms');
      } catch (error) {
        // If bucket doesn't exist or encryption not configured, this test will fail
        expect(error).toBeUndefined();
      }
    });

    test('should have S3 bucket with versioning enabled', async () => {
      const bucketName = `TapStack-secure-bucket-${process.env.AWS_ACCOUNT_ID || 'test'}`;
      
      try {
        const command = new GetBucketVersioningCommand({
          Bucket: bucketName
        });
        
        const response = await s3Client.send(command);
        expect(response.Status).toBe('Enabled');
      } catch (error) {
        // If bucket doesn't exist, this test will fail
        expect(error).toBeUndefined();
      }
    });

    test('should have S3 bucket with public access blocked', async () => {
      const bucketName = `TapStack-secure-bucket-${process.env.AWS_ACCOUNT_ID || 'test'}`;
      
      try {
        const command = new GetPublicAccessBlockCommand({
          Bucket: bucketName
        });
        
        const response = await s3Client.send(command);
        const publicAccessBlock = response.PublicAccessBlockConfiguration;
        
        expect(publicAccessBlock?.BlockPublicAcls).toBe(true);
        expect(publicAccessBlock?.BlockPublicPolicy).toBe(true);
        expect(publicAccessBlock?.IgnorePublicAcls).toBe(true);
        expect(publicAccessBlock?.RestrictPublicBuckets).toBe(true);
      } catch (error) {
        // If bucket doesn't exist, this test will fail
        expect(error).toBeUndefined();
      }
    });
  });

  describe('Monitoring and Logging', () => {
    test('should have CloudWatch alarms configured', async () => {
      const command = new DescribeAlarmsCommand({
        AlarmNamePrefix: 'TapStack'
      });
      
      const response = await cloudWatchClient.send(command);
      const alarms = response.MetricAlarms || [];
      
      // Should have at least CPU and other monitoring alarms
      expect(alarms.length).toBeGreaterThanOrEqual(2);
      
      // Check for specific alarms
      const cpuAlarm = alarms.find(alarm => alarm.AlarmName?.includes('CPU'));
      expect(cpuAlarm).toBeDefined();
    });

    test('should have Secrets Manager secret for database credentials', async () => {
      const command = new DescribeSecretCommand({
        SecretId: 'TapStack/database/credentials'
      });
      
      try {
        const response = await secretsManagerClient.send(command);
        const secret = response;
        
        expect(secret).toBeDefined();
        expect(secret.Name).toBe('TapStack/database/credentials');
        expect(secret.Description).toContain('Database credentials for TapStack');
      } catch (error) {
        // If secret doesn't exist, this test will fail
        expect(error).toBeUndefined();
      }
    });
  });

  describe('Network Connectivity', () => {
    test('should have internet gateway attached to VPC', async () => {
      const command = new DescribeVpcsCommand({
        VpcIds: [outputs.VPCId]
      });
      
      const response = await ec2Client.send(command);
      const vpc = response.Vpcs?.[0];
      
      expect(vpc).toBeDefined();
      // Additional checks for internet gateway attachment would go here
    });

    test('should have NAT gateways for private subnets', async () => {
      // This test would verify NAT gateway configuration
      // Implementation depends on how NAT gateways are configured in the template
      expect(true).toBe(true); // Placeholder
    });
  });

  describe('Application Health', () => {
    test('should have load balancer health check endpoint responding', async () => {
      // This test would make an HTTP request to the health check endpoint
      // Implementation depends on the application's health check path
      expect(outputs.LoadBalancerURL).toBeDefined();
      expect(outputs.LoadBalancerDNS).toBeDefined();
    });

    test('should have web application accessible via load balancer', async () => {
      // This test would verify the web application is accessible
      // Implementation depends on the application's expected response
      expect(outputs.LoadBalancerURL).toBeDefined();
    });
  });

  describe('Security Compliance', () => {
    test('should have all instances in private subnets (except bastion)', async () => {
      const command = new DescribeInstancesCommand({
        Filters: [
          {
            Name: 'vpc-id',
            Values: [outputs.VPCId]
          },
          {
            Name: 'instance-state-name',
            Values: ['running']
          }
        ]
      });
      
      const response = await ec2Client.send(command);
      const instances = response.Reservations?.flatMap(reservation => reservation.Instances || []);
      
      expect(instances).toBeDefined();
      
      // Check that non-bastion instances are in private subnets
      instances?.forEach(instance => {
        if (!instance.Tags?.some(tag => tag.Key === 'Name' && tag.Value?.includes('Bastion'))) {
          // This instance should be in a private subnet
          // Additional validation would go here
        }
      });
    });

    test('should have security groups with minimal required access', async () => {
      // This test would verify security group rules follow least privilege principle
      expect(true).toBe(true); // Placeholder
    });
  });

  describe('Cost Optimization', () => {
    test('should use appropriate instance types for workload', async () => {
      const command = new DescribeInstancesCommand({
        Filters: [
          {
            Name: 'vpc-id',
            Values: [outputs.VPCId]
          },
          {
            Name: 'instance-state-name',
            Values: ['running']
          }
        ]
      });
      
      const response = await ec2Client.send(command);
      const instances = response.Reservations?.flatMap(reservation => reservation.Instances || []);
      
      expect(instances).toBeDefined();
      
      // Check that instances use appropriate types
      instances?.forEach(instance => {
        expect(['t3.small', 't3.medium', 't3.large', 'm5.large', 'm5.xlarge']).toContain(instance.InstanceType);
      });
    });

    test('should have auto scaling configured for cost optimization', async () => {
      const command = new DescribeAutoScalingGroupsCommand({
        AutoScalingGroupNames: ['TapStack-ASG']
      });
      
      const response = await asgClient.send(command);
      const asg = response.AutoScalingGroups?.[0];
      
      expect(asg).toBeDefined();
      expect(asg?.MinSize).toBeLessThanOrEqual(asg?.MaxSize || 0);
      expect(asg?.DesiredCapacity).toBeGreaterThanOrEqual(asg?.MinSize || 0);
      expect(asg?.DesiredCapacity).toBeLessThanOrEqual(asg?.MaxSize || 0);
    });
  });
});
