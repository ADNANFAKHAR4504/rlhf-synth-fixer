/**
 * Comprehensive Integration Tests for Terraform Infrastructure
 * 
 * These tests validate actual deployed AWS resources using the AWS SDK,
 * rather than just checking file existence. The tests cover:
 * 
 * - VPC and networking components (VPC, subnets, security groups)
 * - Compute resources (Auto Scaling Groups, Load Balancer, scaling policies)
 * - Database resources (RDS instance, subnet groups)
 * - Storage resources (S3 buckets)
 * - Security components (Secrets Manager)
 * - Monitoring (CloudWatch alarms)
 * - Infrastructure outputs validation
 * 
 * Tests use stack outputs from cfn-outputs/flat-outputs.json to identify
 * deployed resources and validate their configuration and state.
 */

import * as fs from 'fs';
import * as path from 'path';
import { EC2Client, DescribeVpcsCommand, DescribeSubnetsCommand, DescribeSecurityGroupsCommand } from '@aws-sdk/client-ec2';
import { RDSClient, DescribeDBInstancesCommand, DescribeDBSubnetGroupsCommand } from '@aws-sdk/client-rds';
import { AutoScalingClient, DescribeAutoScalingGroupsCommand, DescribePoliciesCommand } from '@aws-sdk/client-auto-scaling';
import { ElasticLoadBalancingV2Client, DescribeLoadBalancersCommand, DescribeTargetGroupsCommand } from '@aws-sdk/client-elastic-load-balancing-v2';
import { CloudWatchClient, DescribeAlarmsCommand } from '@aws-sdk/client-cloudwatch';
import { S3Client, GetBucketLocationCommand, HeadBucketCommand } from '@aws-sdk/client-s3';
import { SecretsManagerClient, DescribeSecretCommand } from '@aws-sdk/client-secrets-manager';

// Load stack outputs
const outputsPath = path.join(__dirname, '..', 'cfn-outputs', 'flat-outputs.json');
let stackOutputs: any = {};

if (fs.existsSync(outputsPath)) {
  const rawOutputs = JSON.parse(fs.readFileSync(outputsPath, 'utf-8'));
  // Transform Terraform output format {value: "...", sensitive: false, type: "..."} to flat format
  for (const [key, value] of Object.entries(rawOutputs)) {
    if (typeof value === 'object' && value !== null && 'value' in value) {
      stackOutputs[key] = (value as any).value;
    } else {
      stackOutputs[key] = value;
    }
  }
}

// AWS Clients - Configure for LocalStack
const region = process.env.AWS_REGION || 'us-east-1';
const endpoint = process.env.AWS_ENDPOINT_URL || 'http://localhost:4566';

const clientConfig = {
  region,
  endpoint,
  credentials: {
    accessKeyId: 'test',
    secretAccessKey: 'test',
  },
  forcePathStyle: true,
};

const ec2Client = new EC2Client(clientConfig);
const rdsClient = new RDSClient(clientConfig);
const autoScalingClient = new AutoScalingClient(clientConfig);
const elbClient = new ElasticLoadBalancingV2Client(clientConfig);
const cloudWatchClient = new CloudWatchClient(clientConfig);
const s3Client = new S3Client(clientConfig);
const secretsClient = new SecretsManagerClient(clientConfig);

describe('Terraform Integration Tests', () => {
  beforeAll(() => {
    expect(stackOutputs).toBeDefined();
    expect(Object.keys(stackOutputs).length).toBeGreaterThan(0);
  });

  describe('VPC and Networking Resources', () => {
    test('VPC exists and is properly configured', async () => {
      const vpcId = stackOutputs.vpc_id;
      expect(vpcId).toBeDefined();
      expect(vpcId).toMatch(/^vpc-[a-z0-9]+$/);

      const response = await ec2Client.send(new DescribeVpcsCommand({ VpcIds: [vpcId] }));
      expect(response.Vpcs).toHaveLength(1);
      
      const vpc = response.Vpcs![0];
      expect(vpc.State).toBe('available');
      expect(vpc.CidrBlock).toBeDefined();
      
      // VPC DNS attributes are not available in the DescribeVpcs response
      // They would need to be checked via DescribeVpcAttribute if needed
    });

    test('Public and private subnets exist in multiple AZs', async () => {
      const publicSubnetIds = Array.isArray(stackOutputs.public_subnet_ids)
        ? stackOutputs.public_subnet_ids
        : JSON.parse(stackOutputs.public_subnet_ids);
      const privateSubnetIds = Array.isArray(stackOutputs.private_subnet_ids)
        ? stackOutputs.private_subnet_ids
        : JSON.parse(stackOutputs.private_subnet_ids);
      
      expect(publicSubnetIds).toHaveLength(2);
      expect(privateSubnetIds).toHaveLength(2);

      // Verify public subnets
      const publicSubnetsResponse = await ec2Client.send(
        new DescribeSubnetsCommand({ SubnetIds: publicSubnetIds })
      );
      expect(publicSubnetsResponse.Subnets).toHaveLength(2);
      
      const publicAzs = new Set(publicSubnetsResponse.Subnets!.map(s => s.AvailabilityZone));
      expect(publicAzs.size).toBe(2); // Multiple AZs
      
      publicSubnetsResponse.Subnets!.forEach(subnet => {
        expect(subnet.State).toBe('available');
        expect(subnet.MapPublicIpOnLaunch).toBe(true);
        expect(subnet.VpcId).toBe(stackOutputs.vpc_id);
      });

      // Verify private subnets
      const privateSubnetsResponse = await ec2Client.send(
        new DescribeSubnetsCommand({ SubnetIds: privateSubnetIds })
      );
      expect(privateSubnetsResponse.Subnets).toHaveLength(2);
      
      const privateAzs = new Set(privateSubnetsResponse.Subnets!.map(s => s.AvailabilityZone));
      expect(privateAzs.size).toBe(2); // Multiple AZs
      
      privateSubnetsResponse.Subnets!.forEach(subnet => {
        expect(subnet.State).toBe('available');
        expect(subnet.MapPublicIpOnLaunch).toBe(false);
        expect(subnet.VpcId).toBe(stackOutputs.vpc_id);
      });
    });
  });

  describe('Security Groups', () => {
    test('Security groups are properly configured', async () => {
      const vpcId = stackOutputs.vpc_id;
      
      const response = await ec2Client.send(
        new DescribeSecurityGroupsCommand({
          Filters: [
            { Name: 'vpc-id', Values: [vpcId] },
            { Name: 'group-name', Values: ['*alb*', '*web*', '*rds*'] }
          ]
        })
      );
      
      expect(response.SecurityGroups!.length).toBeGreaterThanOrEqual(3);
      
      // Check for ALB security group
      const albSg = response.SecurityGroups!.find(sg => sg.GroupName?.includes('alb'));
      expect(albSg).toBeDefined();
      expect(albSg!.IpPermissions!.some(rule => rule.FromPort === 80)).toBe(true);
      expect(albSg!.IpPermissions!.some(rule => rule.FromPort === 443)).toBe(true);
      
      // Check for Web security group
      const webSg = response.SecurityGroups!.find(sg => sg.GroupName?.includes('web'));
      expect(webSg).toBeDefined();
      expect(webSg!.IpPermissions!.some(rule => rule.FromPort === 80)).toBe(true);
      expect(webSg!.IpPermissions!.some(rule => rule.FromPort === 22)).toBe(true);
      
      // Check for RDS security group
      const rdsSg = response.SecurityGroups!.find(sg => sg.GroupName?.includes('rds'));
      expect(rdsSg).toBeDefined();
      expect(rdsSg!.IpPermissions!.some(rule => rule.FromPort === 3306)).toBe(true);
    });
  });

  describe('Compute Resources', () => {
    test('Auto Scaling Group is properly configured', async () => {
      // Find ASG by looking for one with the expected naming pattern
      const response = await autoScalingClient.send(new DescribeAutoScalingGroupsCommand({}));
      const asg = response.AutoScalingGroups!.find(asg => 
        asg.AutoScalingGroupName?.includes('wapp') || asg.AutoScalingGroupName?.includes('asg')
      );
      
      expect(asg).toBeDefined();
      expect(asg!.MinSize).toBeGreaterThanOrEqual(1);
      expect(asg!.MaxSize).toBeGreaterThanOrEqual(asg!.MinSize!);
      expect(asg!.DesiredCapacity).toBeGreaterThanOrEqual(asg!.MinSize!);
      expect(asg!.VPCZoneIdentifier).toBeDefined();
      
      // Verify it's deployed across multiple AZs
      const subnetIds = asg!.VPCZoneIdentifier!.split(',');
      expect(subnetIds.length).toBeGreaterThanOrEqual(2);
    });

    test('Auto Scaling policies exist', async () => {
      const response = await autoScalingClient.send(new DescribePoliciesCommand({}));
      const policies = response.ScalingPolicies!.filter(policy => 
        policy.PolicyName?.includes('wapp') || policy.PolicyName?.includes('scale')
      );
      
      expect(policies.length).toBeGreaterThanOrEqual(2);
      
      const scaleUpPolicy = policies.find(p => p.PolicyName?.includes('up'));
      const scaleDownPolicy = policies.find(p => p.PolicyName?.includes('down'));
      
      expect(scaleUpPolicy).toBeDefined();
      expect(scaleDownPolicy).toBeDefined();
      expect(scaleUpPolicy!.ScalingAdjustment).toBeGreaterThan(0);
      expect(scaleDownPolicy!.ScalingAdjustment).toBeLessThan(0);
    });

    test('Application Load Balancer is accessible', async () => {
      const loadBalancerDns = stackOutputs.load_balancer_dns;
      expect(loadBalancerDns).toBeDefined();
      // LocalStack uses .elb.localhost.localstack.cloud format, AWS uses .elb.amazonaws.com
      expect(loadBalancerDns).toMatch(/\.elb\.amazonaws\.com|\.elb\.localhost\.localstack\.cloud/);

      // Find ALB by DNS name
      const response = await elbClient.send(new DescribeLoadBalancersCommand({}));
      const alb = response.LoadBalancers!.find(lb => lb.DNSName === loadBalancerDns);
      
      expect(alb).toBeDefined();
      expect(alb!.State!.Code).toBe('active');
      expect(alb!.Type).toBe('application');
      // LocalStack may not return Scheme field
      if (alb!.Scheme) {
        expect(alb!.Scheme).toBe('internet-facing');
      }
      
      // Verify target groups
      const targetGroupsResponse = await elbClient.send(
        new DescribeTargetGroupsCommand({ LoadBalancerArn: alb!.LoadBalancerArn })
      );
      expect(targetGroupsResponse.TargetGroups!.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Database Resources', () => {
    test('RDS instance is available and properly configured', async () => {
      const rdsEndpoint = stackOutputs.rds_endpoint;
      expect(rdsEndpoint).toBeDefined();
      // LocalStack uses localhost.localstack.cloud format, AWS uses .rds.amazonaws.com
      expect(rdsEndpoint).toMatch(/\.rds\.amazonaws\.com|localhost\.localstack\.cloud/);

      // For LocalStack, need to get DB identifier from deployed resources
      // Extract DB identifier - for LocalStack it's in the format localhost.localstack.cloud:port
      const isLocalStack = rdsEndpoint.includes('localstack');
      let dbIdentifier: string;

      if (isLocalStack) {
        // For LocalStack, get the DB instance from the deployed resources
        const allInstances = await rdsClient.send(new DescribeDBInstancesCommand({}));
        const projectInstances = allInstances.DBInstances?.filter(db =>
          db.DBInstanceIdentifier?.startsWith('wapp')
        );
        expect(projectInstances).toBeDefined();
        expect(projectInstances!.length).toBeGreaterThan(0);
        dbIdentifier = projectInstances![0].DBInstanceIdentifier!;
      } else {
        // For AWS, extract from endpoint
        dbIdentifier = rdsEndpoint.split('.')[0];
      }
      
      const response = await rdsClient.send(
        new DescribeDBInstancesCommand({ DBInstanceIdentifier: dbIdentifier })
      );
      
      expect(response.DBInstances).toHaveLength(1);
      const dbInstance = response.DBInstances![0];
      
      expect(dbInstance.DBInstanceStatus).toBe('available');
      expect(dbInstance.Engine).toBe('mysql');
      expect(dbInstance.StorageEncrypted).toBe(true);
      expect(dbInstance.BackupRetentionPeriod).toBeGreaterThan(0);
      expect(dbInstance.MultiAZ).toBeDefined();
    });

    test('DB subnet group spans multiple AZs', async () => {
      const response = await rdsClient.send(new DescribeDBSubnetGroupsCommand({}));
      const subnetGroup = response.DBSubnetGroups!.find(sg => 
        sg.DBSubnetGroupName?.includes('wapp') || sg.DBSubnetGroupName?.includes('db-subnet')
      );
      
      expect(subnetGroup).toBeDefined();
      expect(subnetGroup!.Subnets!.length).toBeGreaterThanOrEqual(2);
      
      const availabilityZones = new Set(subnetGroup!.Subnets!.map(s => s.SubnetAvailabilityZone?.Name));
      expect(availabilityZones.size).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Storage Resources', () => {
    test('S3 buckets exist and are accessible', async () => {
      const backupBucket = stackOutputs.backup_bucket_name;
      const logsBucket = stackOutputs.logs_bucket_name;
      
      expect(backupBucket).toBeDefined();
      expect(logsBucket).toBeDefined();
      
      // Test backup bucket
      await expect(s3Client.send(new HeadBucketCommand({ Bucket: backupBucket })))
        .resolves.toBeDefined();
      
      // Test logs bucket
      await expect(s3Client.send(new HeadBucketCommand({ Bucket: logsBucket })))
        .resolves.toBeDefined();
    });
  });

  describe('Secrets Management', () => {
    test('Database credentials secret exists', async () => {
      const secretArn = stackOutputs.secrets_manager_secret_arn;
      expect(secretArn).toBeDefined();
      expect(secretArn).toContain('arn:aws:secretsmanager');
      
      const response = await secretsClient.send(
        new DescribeSecretCommand({ SecretId: secretArn })
      );
      
      expect(response.ARN).toBe(secretArn);
      expect(response.Name).toContain('db-credentials');
    });
  });

  describe('CloudWatch Monitoring', () => {
    test('CloudWatch alarms are configured', async () => {
      // CloudWatch alarms are disabled by default for LocalStack Community Edition
      // (enable_cloudwatch_alarms = false in variables.tf due to serialization issues)
      const isLocalStack = endpoint.includes('localstack') || endpoint.includes('4566');

      const response = await cloudWatchClient.send(new DescribeAlarmsCommand({}));

      // Filter for project-specific alarms (based on observed naming pattern)
      const alarms = response.MetricAlarms!.filter(alarm =>
        alarm.AlarmName?.startsWith('dev-') ||
        alarm.AlarmName?.toLowerCase().includes('wapp')
      );

      if (isLocalStack) {
        // For LocalStack, alarms are disabled by default - just verify the API works
        expect(alarms).toBeDefined();
        // Don't enforce alarm count for LocalStack since they're intentionally disabled
      } else {
        // For AWS, expect alarms to be configured
        expect(alarms.length).toBeGreaterThanOrEqual(3);

        // Check for specific alarm types based on observed naming pattern
        const cpuAlarms = alarms.filter(a => a.AlarmName?.includes('cpu'));
        const dbAlarms = alarms.filter(a => a.AlarmName?.includes('rds'));
        const albAlarms = alarms.filter(a => a.AlarmName?.includes('alb'));

        expect(cpuAlarms.length).toBeGreaterThanOrEqual(2); // high and low CPU
        expect(dbAlarms.length).toBeGreaterThanOrEqual(1); // RDS alarms
        expect(albAlarms.length).toBeGreaterThanOrEqual(1); // ALB alarms
      }
      
      // Verify alarm states are valid
      alarms.forEach(alarm => {
        expect(['OK', 'ALARM', 'INSUFFICIENT_DATA']).toContain(alarm.StateValue);
      });
    });
  });

  describe('Infrastructure Outputs', () => {
    test('All required outputs are available', async () => {
      const requiredOutputs = [
        'vpc_id',
        'public_subnet_ids',
        'private_subnet_ids',
        'load_balancer_dns',
        'rds_endpoint',
        'backup_bucket_name',
        'logs_bucket_name',
        'secrets_manager_secret_arn',
        'elastic_ips'
      ];
      
      requiredOutputs.forEach(output => {
        expect(stackOutputs[output]).toBeDefined();
        expect(stackOutputs[output]).not.toBe('');
      });
    });
  });
});
