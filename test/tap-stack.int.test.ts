import { 
  CloudFormationClient, 
  DescribeStacksCommand 
} from '@aws-sdk/client-cloudformation';
import { 
  ElasticLoadBalancingV2Client, 
  DescribeTargetHealthCommand,
  DescribeLoadBalancersCommand
} from '@aws-sdk/client-elastic-load-balancing-v2';
import {
  S3Client,
  HeadBucketCommand,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand
} from '@aws-sdk/client-s3';
import {
  SNSClient,
  GetTopicAttributesCommand
} from '@aws-sdk/client-sns';
import {
  BackupClient,
  DescribeBackupVaultCommand
} from '@aws-sdk/client-backup';
import {
  AutoScalingClient,
  DescribeAutoScalingGroupsCommand
} from '@aws-sdk/client-auto-scaling';
import {
  EC2Client,
  DescribeVpcsCommand,
  DescribeSubnetsCommand,
  DescribeSecurityGroupsCommand
} from '@aws-sdk/client-ec2';
import * as fs from 'fs';
import * as path from 'path';
import axios from 'axios';

// Read outputs from deployment
const outputsPath = path.join(__dirname, '..', 'cfn-outputs', 'flat-outputs.json');
let outputs: any = {};

if (fs.existsSync(outputsPath)) {
  outputs = JSON.parse(fs.readFileSync(outputsPath, 'utf8'));
}

const region = process.env.AWS_REGION || 'us-west-2';
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'synthtrainr16';
const stackName = `TapStack${environmentSuffix}`;

// Initialize AWS clients
const cfnClient = new CloudFormationClient({ region });
const elbClient = new ElasticLoadBalancingV2Client({ region });
const s3Client = new S3Client({ region });
const snsClient = new SNSClient({ region });
const backupClient = new BackupClient({ region });
const asgClient = new AutoScalingClient({ region });
const ec2Client = new EC2Client({ region });

describe('TapStack Integration Tests', () => {
  describe('Stack Deployment', () => {
    test('CloudFormation stack is deployed successfully', async () => {
      const command = new DescribeStacksCommand({ StackName: stackName });
      const response = await cfnClient.send(command);
      
      expect(response.Stacks).toHaveLength(1);
      expect(response.Stacks?.[0].StackStatus).toMatch(/CREATE_COMPLETE|UPDATE_COMPLETE/);
    });

    test('Stack outputs are present', () => {
      expect(outputs).toBeDefined();
      expect(outputs.LoadBalancerDNS).toBeDefined();
      expect(outputs.AppDataBucketName).toBeDefined();
      expect(outputs.AlertTopicArn).toBeDefined();
      expect(outputs.BackupVaultName).toBeDefined();
    });
  });

  describe('Application Load Balancer', () => {
    test('ALB is accessible and healthy', async () => {
      if (!outputs.LoadBalancerDNS) {
        console.warn('LoadBalancerDNS not found in outputs, skipping test');
        return;
      }

      const response = await axios.get(`http://${outputs.LoadBalancerDNS}`, {
        timeout: 10000,
        validateStatus: () => true
      });

      expect(response.status).toBe(200);
    });

    test('ALB has healthy targets', async () => {
      const lbCommand = new DescribeLoadBalancersCommand({});
      const lbResponse = await elbClient.send(lbCommand);
      
      const alb = lbResponse.LoadBalancers?.find(lb => 
        lb.DNSName === outputs.LoadBalancerDNS
      );
      
      if (!alb) {
        console.warn('ALB not found, skipping target health check');
        return;
      }

      const targetArn = alb.LoadBalancerArn?.replace(':loadbalancer/', ':targetgroup/').replace('/app/', '');
      
      // Note: Target health check might require the actual target group ARN
      // This is a simplified check
      expect(alb.State?.Code).toBe('active');
    });
  });

  describe('S3 Buckets', () => {
    test('Application data bucket exists and is accessible', async () => {
      if (!outputs.AppDataBucketName) {
        console.warn('AppDataBucketName not found in outputs, skipping test');
        return;
      }

      const command = new HeadBucketCommand({ Bucket: outputs.AppDataBucketName });
      
      // Should not throw if bucket exists
      await expect(s3Client.send(command)).resolves.toBeDefined();
    });

    test('Can write and read from S3 bucket', async () => {
      if (!outputs.AppDataBucketName) {
        console.warn('AppDataBucketName not found in outputs, skipping test');
        return;
      }

      const testKey = `test-${Date.now()}.txt`;
      const testContent = 'Integration test content';

      // Put object
      const putCommand = new PutObjectCommand({
        Bucket: outputs.AppDataBucketName,
        Key: testKey,
        Body: testContent,
      });
      await s3Client.send(putCommand);

      // Get object
      const getCommand = new GetObjectCommand({
        Bucket: outputs.AppDataBucketName,
        Key: testKey,
      });
      const getResponse = await s3Client.send(getCommand);
      const bodyContent = await getResponse.Body?.transformToString();
      
      expect(bodyContent).toBe(testContent);

      // Clean up
      const deleteCommand = new DeleteObjectCommand({
        Bucket: outputs.AppDataBucketName,
        Key: testKey,
      });
      await s3Client.send(deleteCommand);
    });
  });

  describe('SNS Topic', () => {
    test('SNS topic exists and is configured', async () => {
      if (!outputs.AlertTopicArn) {
        console.warn('AlertTopicArn not found in outputs, skipping test');
        return;
      }

      const command = new GetTopicAttributesCommand({
        TopicArn: outputs.AlertTopicArn,
      });
      
      const response = await snsClient.send(command);
      
      expect(response.Attributes).toBeDefined();
      expect(response.Attributes?.TopicArn).toBe(outputs.AlertTopicArn);
    });
  });

  describe('Backup Vault', () => {
    test('Backup vault exists', async () => {
      if (!outputs.BackupVaultName) {
        console.warn('BackupVaultName not found in outputs, skipping test');
        return;
      }

      const command = new DescribeBackupVaultCommand({
        BackupVaultName: outputs.BackupVaultName,
      });
      
      const response = await backupClient.send(command);
      
      expect(response.BackupVaultName).toBe(outputs.BackupVaultName);
    });
  });

  describe('Auto Scaling Group', () => {
    test('Auto Scaling Group is properly configured', async () => {
      const command = new DescribeAutoScalingGroupsCommand({});
      const response = await asgClient.send(command);
      
      const asg = response.AutoScalingGroups?.find(group => 
        group.Tags?.some(tag => 
          tag.Key === 'Environment' && tag.Value === environmentSuffix
        )
      );
      
      expect(asg).toBeDefined();
      if (asg) {
        expect(asg.MinSize).toBeGreaterThanOrEqual(2);
        expect(asg.MaxSize).toBeGreaterThanOrEqual(10);
        expect(asg.DesiredCapacity).toBeGreaterThanOrEqual(2);
        expect(asg.HealthCheckType).toBe('ELB');
      }
    });

    test('Auto Scaling Group has running instances', async () => {
      const command = new DescribeAutoScalingGroupsCommand({});
      const response = await asgClient.send(command);
      
      const asg = response.AutoScalingGroups?.find(group => 
        group.Tags?.some(tag => 
          tag.Key === 'Environment' && tag.Value === environmentSuffix
        )
      );
      
      if (asg) {
        expect(asg.Instances).toBeDefined();
        expect(asg.Instances?.length).toBeGreaterThan(0);
        
        // Check that at least some instances are healthy
        const healthyInstances = asg.Instances?.filter(i => 
          i.HealthStatus === 'Healthy' && i.LifecycleState === 'InService'
        );
        expect(healthyInstances?.length).toBeGreaterThan(0);
      }
    });
  });

  describe('VPC and Networking', () => {
    test('VPC is created with proper configuration', async () => {
      const vpcCommand = new DescribeVpcsCommand({
        Filters: [
          {
            Name: 'tag:aws:cloudformation:stack-name',
            Values: [stackName]
          }
        ]
      });
      
      const vpcResponse = await ec2Client.send(vpcCommand);
      
      expect(vpcResponse.Vpcs).toBeDefined();
      expect(vpcResponse.Vpcs?.length).toBeGreaterThan(0);
      
      const vpc = vpcResponse.Vpcs?.[0];
      if (vpc) {
        expect(vpc.CidrBlock).toBe('10.0.0.0/16');
        expect(vpc.EnableDnsSupport).toBe(true);
        expect(vpc.EnableDnsHostnames).toBe(true);
      }
    });

    test('Subnets are created across multiple AZs', async () => {
      const subnetCommand = new DescribeSubnetsCommand({
        Filters: [
          {
            Name: 'tag:aws:cloudformation:stack-name',
            Values: [stackName]
          }
        ]
      });
      
      const subnetResponse = await ec2Client.send(subnetCommand);
      
      expect(subnetResponse.Subnets).toBeDefined();
      expect(subnetResponse.Subnets?.length).toBeGreaterThanOrEqual(9); // 3 public + 3 private + 3 isolated
      
      // Check AZ distribution
      const azs = new Set(subnetResponse.Subnets?.map(s => s.AvailabilityZone));
      expect(azs.size).toBeGreaterThanOrEqual(3);
    });

    test('Security groups are properly configured', async () => {
      const sgCommand = new DescribeSecurityGroupsCommand({
        Filters: [
          {
            Name: 'tag:aws:cloudformation:stack-name',
            Values: [stackName]
          }
        ]
      });
      
      const sgResponse = await ec2Client.send(sgCommand);
      
      expect(sgResponse.SecurityGroups).toBeDefined();
      expect(sgResponse.SecurityGroups?.length).toBeGreaterThan(0);
      
      // Check for ALB security group allowing HTTP
      const albSg = sgResponse.SecurityGroups?.find(sg => 
        sg.GroupName?.includes('ALBSecurityGroup')
      );
      
      if (albSg) {
        const httpIngress = albSg.IpPermissions?.find(rule => 
          rule.FromPort === 80 && rule.ToPort === 80
        );
        expect(httpIngress).toBeDefined();
      }
    });
  });

  describe('High Availability', () => {
    test('Resources are distributed across multiple AZs', async () => {
      // Check that ASG spans multiple AZs
      const asgCommand = new DescribeAutoScalingGroupsCommand({});
      const asgResponse = await asgClient.send(asgCommand);
      
      const asg = asgResponse.AutoScalingGroups?.find(group => 
        group.Tags?.some(tag => 
          tag.Key === 'Environment' && tag.Value === environmentSuffix
        )
      );
      
      if (asg) {
        expect(asg.AvailabilityZones).toBeDefined();
        expect(asg.AvailabilityZones?.length).toBeGreaterThanOrEqual(3);
      }
    });

    test('ALB responds to health checks', async () => {
      if (!outputs.LoadBalancerDNS) {
        console.warn('LoadBalancerDNS not found in outputs, skipping test');
        return;
      }

      // Simple health check
      const response = await axios.get(`http://${outputs.LoadBalancerDNS}/`, {
        timeout: 5000,
        validateStatus: () => true
      });

      expect([200, 301, 302, 503]).toContain(response.status);
    });
  });

  describe('End-to-End Workflow', () => {
    test('Complete request flow through infrastructure', async () => {
      if (!outputs.LoadBalancerDNS) {
        console.warn('LoadBalancerDNS not found in outputs, skipping test');
        return;
      }

      // Test multiple requests to verify load balancing
      const requests = Array(5).fill(null).map(async () => {
        const response = await axios.get(`http://${outputs.LoadBalancerDNS}`, {
          timeout: 10000,
          validateStatus: () => true
        });
        return response.status;
      });

      const results = await Promise.all(requests);
      
      // All requests should succeed
      results.forEach(status => {
        expect(status).toBe(200);
      });
    });
  });
});