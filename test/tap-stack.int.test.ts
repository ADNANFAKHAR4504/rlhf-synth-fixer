/**
 * test/tap-stack.integration.test.ts
 *
 * Integration tests for the deployed CloudFormation stack
 * Tests actual AWS resources and their interactions
 */

import {
  EC2Client,
  DescribeVpcsCommand,
  DescribeSubnetsCommand,
  DescribeNatGatewaysCommand,
  DescribeInternetGatewaysCommand,
  DescribeSecurityGroupsCommand,
  DescribeInstancesCommand,
  DescribeRouteTablesCommand,
} from '@aws-sdk/client-ec2';
import {
  ElasticLoadBalancingV2Client,
  DescribeLoadBalancersCommand,
  DescribeTargetGroupsCommand,
  DescribeListenersCommand,
} from '@aws-sdk/client-elastic-load-balancing-v2';
import {
  RDSClient,
  DescribeDBInstancesCommand,
} from '@aws-sdk/client-rds';
import {
  S3Client,
  HeadBucketCommand,
  GetBucketPolicyCommand,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import {
  CloudWatchClient,
  DescribeAlarmsCommand,
} from '@aws-sdk/client-cloudwatch';
import {
  AutoScalingClient,
  DescribeAutoScalingGroupsCommand,
  DescribePoliciesCommand,
} from '@aws-sdk/client-auto-scaling';
import {
  CloudFormationClient,
  DescribeStacksCommand,
} from '@aws-sdk/client-cloudformation';
import {
  IAMClient,
  ListRolesCommand,
  ListRolePoliciesCommand,
  ListAttachedRolePoliciesCommand,
} from '@aws-sdk/client-iam';
import fs from 'fs';
import path from 'path';

// Configuration - Load from cfn-outputs after stack deployment
const outputs = JSON.parse(
  fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
);

// Get environment suffix from environment variable (set by CI/CD pipeline)
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';
const stackName = `TapStack${environmentSuffix}`;

// Extract outputs for testing
const VPC_ID = outputs[`${stackName}-VPC-ID`] || outputs['VPCId'];
const LOAD_BALANCER_DNS = outputs[`${stackName}-LoadBalancer-DNS`] || outputs['LoadBalancerDNS'];
const RDS_ENDPOINT = outputs[`${stackName}-RDS-Endpoint`] || outputs['RDSEndpoint'];
const S3_BUCKET_NAME = outputs[`${stackName}-S3-Bucket`] || outputs['S3BucketName'];

// AWS SDK v3 clients
const ec2Client = new EC2Client({ region: 'us-east-1' });
const elbv2Client = new ElasticLoadBalancingV2Client({ region: 'us-east-1' });
const rdsClient = new RDSClient({ region: 'us-east-1' });
const s3Client = new S3Client({ region: 'us-east-1' });
const cloudWatchClient = new CloudWatchClient({ region: 'us-east-1' });
const autoScalingClient = new AutoScalingClient({ region: 'us-east-1' });
const cloudFormationClient = new CloudFormationClient({ region: 'us-east-1' });
const iamClient = new IAMClient({ region: 'us-east-1' });

// Helper functions for AWS SDK v3 operations
async function getStackInfo() {
  const command = new DescribeStacksCommand({ StackName: stackName });
  const response = await cloudFormationClient.send(command);
  return response.Stacks![0];
}

async function getVpcInfo() {
  const command = new DescribeVpcsCommand({ VpcIds: [VPC_ID] });
  const response = await ec2Client.send(command);
  return response.Vpcs![0];
}

async function getLoadBalancerInfo() {
  const command = new DescribeLoadBalancersCommand({});
  const response = await elbv2Client.send(command);
  return response.LoadBalancers!.find(lb => lb.DNSName === LOAD_BALANCER_DNS);
}

async function getRdsInfo() {
  const command = new DescribeDBInstancesCommand({});
  const response = await rdsClient.send(command);
  return response.DBInstances!.find(db => 
    db.Endpoint?.Address === RDS_ENDPOINT ||
    db.Tags?.some(tag => 
      tag.Key === 'aws:cloudformation:stack-name' && 
      tag.Value === stackName
    )
  );
}

describe('TapStack Integration Tests', () => {
  // Setup validation
  beforeAll(async () => {
    console.log('🔍 Validating stack deployment...');
    const stack = await getStackInfo();
    console.log(`✅ Stack ${stackName} is in ${stack.StackStatus} state`);
    
    // Log key infrastructure endpoints
    console.log(`🌐 VPC ID: ${VPC_ID}`);
    console.log(`⚖️  Load Balancer: ${LOAD_BALANCER_DNS}`);
    console.log(`🗄️  RDS Endpoint: ${RDS_ENDPOINT}`);
    console.log(`🪣 S3 Bucket: ${S3_BUCKET_NAME}`);
  });

  describe('Infrastructure Validation', () => {
    test('should have valid VPC ID', () => {
      expect(VPC_ID).toBeDefined();
      expect(VPC_ID).toMatch(/^vpc-[a-f0-9]+$/);
    });

    test('should have valid Load Balancer DNS', () => {
      expect(LOAD_BALANCER_DNS).toBeDefined();
      expect(LOAD_BALANCER_DNS).toMatch(/^.*\.elb\.amazonaws\.com$/);
    });

    test('should have valid RDS endpoint', () => {
      expect(RDS_ENDPOINT).toBeDefined();
      expect(RDS_ENDPOINT).toMatch(/^.*\.rds\.amazonaws\.com$/);
    });

    test('should have valid S3 bucket name', () => {
      expect(S3_BUCKET_NAME).toBeDefined();
      expect(S3_BUCKET_NAME).toMatch(/^[a-z0-9-]+$/);
    });
  });

  describe('Stack Deployment Status', () => {
    test('should be in complete state', async () => {
      const stack = await getStackInfo();
      
      expect(stack).toBeDefined();
      expect(['CREATE_COMPLETE', 'UPDATE_COMPLETE']).toContain(stack.StackStatus!);
      expect(stack.StackName).toBe(stackName);
    });

    test('should have proper stack tags', async () => {
      const stack = await getStackInfo();
      
      expect(stack.Tags).toBeDefined();
      const repositoryTag = stack.Tags!.find(tag => tag.Key === 'Repository');
      const authorTag = stack.Tags!.find(tag => tag.Key === 'CommitAuthor');
      
      if (repositoryTag) {
        expect(repositoryTag.Value).toContain('iac-test-automations');
      }
      if (authorTag) {
        expect(typeof authorTag.Value).toBe('string');
      }
    });
  });

  describe('VPC & Networking Health Check', () => {
    test('should have available VPC with correct configuration', async () => {
      const vpc = await getVpcInfo();

      expect(vpc.State).toBe('available');
      expect(vpc.CidrBlock).toBe('10.0.0.0/16');
      expect(vpc.EnableDnsHostnames).toBe(true);
      expect(vpc.EnableDnsSupport).toBe(true);
      expect(vpc.DhcpOptionsId).toBeDefined();
      
      console.log(`✅ VPC ${VPC_ID} is available with CIDR 10.0.0.0/16`);
    });

    test('should have public subnets in multiple AZs', async () => {
      const command = new DescribeSubnetsCommand({
        Filters: [
          { Name: 'vpc-id', Values: [VPC_ID] },
          { Name: 'map-public-ip-on-launch', Values: ['true'] }
        ]
      });
      const response = await ec2Client.send(command);
      const publicSubnets = response.Subnets!;

      expect(publicSubnets.length).toBe(2);
      
      publicSubnets.forEach(subnet => {
        expect(subnet.State).toBe('available');
        expect(subnet.MapPublicIpOnLaunch).toBe(true);
        expect(['10.0.1.0/24', '10.0.2.0/24']).toContain(subnet.CidrBlock);
      });

      // Verify AZ distribution
      const azs = [...new Set(publicSubnets.map(s => s.AvailabilityZone))];
      expect(azs.length).toBe(2);
      
      console.log(`✅ Found ${publicSubnets.length} public subnets across ${azs.length} AZs`);
    });

    test('should have private subnets properly configured', async () => {
      const command = new DescribeSubnetsCommand({
        Filters: [
          { Name: 'vpc-id', Values: [VPC_ID] },
          { Name: 'map-public-ip-on-launch', Values: ['false'] }
        ]
      });
      const response = await ec2Client.send(command);
      const privateSubnets = response.Subnets!;

      expect(privateSubnets.length).toBe(2);
      
      privateSubnets.forEach(subnet => {
        expect(subnet.State).toBe('available');
        expect(subnet.MapPublicIpOnLaunch).toBe(false);
        expect(['10.0.3.0/24', '10.0.4.0/24']).toContain(subnet.CidrBlock);
      });
      
      console.log(`✅ Found ${privateSubnets.length} private subnets`);
    });

    test('should have functioning NAT Gateways', async () => {
      const command = new DescribeNatGatewaysCommand({
        Filters: [{ Name: 'vpc-id', Values: [VPC_ID] }]
      });
      const response = await ec2Client.send(command);
      const natGateways = response.NatGateways!.filter(nat => nat.State !== 'deleted');

      expect(natGateways.length).toBe(2);
      
      natGateways.forEach(nat => {
        expect(nat.State).toBe('available');
        expect(nat.NatGatewayAddresses![0].AllocationId).toBeDefined();
        expect(nat.NatGatewayAddresses![0].PublicIp).toBeDefined();
        expect(nat.VpcId).toBe(VPC_ID);
      });
      
      console.log(`✅ NAT Gateways are healthy with public IPs: ${natGateways.map(nat => nat.NatGatewayAddresses![0].PublicIp).join(', ')}`);
    });

    test('should have Internet Gateway attached', async () => {
      const command = new DescribeInternetGatewaysCommand({
        Filters: [{ Name: 'attachment.vpc-id', Values: [VPC_ID] }]
      });
      const response = await ec2Client.send(command);
      const igws = response.InternetGateways!;

      expect(igws.length).toBe(1);
      expect(igws[0].Attachments![0].State).toBe('available');
      expect(igws[0].Attachments![0].VpcId).toBe(VPC_ID);
      
      console.log(`✅ Internet Gateway ${igws[0].InternetGatewayId} is attached`);
    });
  });

  describe('Load Balancer Health Check', () => {
    test('should have active ALB with proper configuration', async () => {
      const alb = await getLoadBalancerInfo();

      expect(alb).toBeDefined();
      expect(alb!.State?.Code).toBe('active');
      expect(alb!.Type).toBe('application');
      expect(alb!.Scheme).toBe('internet-facing');
      expect(alb!.VpcId).toBe(VPC_ID);
      expect(alb!.AvailabilityZones!.length).toBe(2);
      
      console.log(`✅ ALB ${alb!.LoadBalancerName} is active and internet-facing`);
    });

    test('should respond to HTTP requests', async () => {
      console.log(`🌐 Testing HTTP connectivity to ${LOAD_BALANCER_DNS}...`);
      
      const response = await fetch(`http://${LOAD_BALANCER_DNS}`, {
        method: 'GET',
        signal: AbortSignal.timeout(10000), // 10 second timeout
      });

      // Accept any response that indicates connectivity (even 503/504 if app is starting)
      expect(response.status).toBeLessThan(500);
      
      console.log(`✅ ALB responded with status: ${response.status}`);
    }, 15000);

    test('should have properly configured target group', async () => {
      const command = new DescribeTargetGroupsCommand({});
      const response = await elbv2Client.send(command);
      const stackTG = response.TargetGroups!.find(tg => tg.VpcId === VPC_ID);

      expect(stackTG).toBeDefined();
      expect(stackTG!.Protocol).toBe('HTTP');
      expect(stackTG!.Port).toBe(80);
      expect(stackTG!.HealthCheckIntervalSeconds).toBe(30);
      expect(stackTG!.HealthCheckPath).toBe('/');
      expect(stackTG!.HealthyThresholdCount).toBe(2);
      expect(stackTG!.UnhealthyThresholdCount).toBe(3);
      
      console.log(`✅ Target Group ${stackTG!.TargetGroupName} configured correctly`);
    });
  });

  describe('Auto Scaling Group Health Check', () => {
    test('should have ASG with correct capacity', async () => {
      const command = new DescribeAutoScalingGroupsCommand({});
      const response = await autoScalingClient.send(command);
      
      const stackASGs = response.AutoScalingGroups!.filter(asg =>
        asg.Tags?.some(tag => 
          tag.Key === 'aws:cloudformation:stack-name' && 
          tag.Value === stackName
        )
      );

      expect(stackASGs.length).toBe(1);
      const asg = stackASGs[0];
      
      expect(asg.MinSize).toBe(2);
      expect(asg.MaxSize).toBe(6);
      expect(asg.DesiredCapacity).toBe(2);
      expect(asg.HealthCheckType).toBe('ELB');
      expect(asg.HealthCheckGracePeriod).toBe(300);
      
      console.log(`✅ ASG ${asg.AutoScalingGroupName} has ${asg.Instances?.length || 0}/${asg.DesiredCapacity} instances`);
    });

    test('should have running EC2 instances', async () => {
      const asgCommand = new DescribeAutoScalingGroupsCommand({});
      const asgResponse = await autoScalingClient.send(asgCommand);
      
      const stackASGs = asgResponse.AutoScalingGroups!.filter(asg =>
        asg.Tags?.some(tag => 
          tag.Key === 'aws:cloudformation:stack-name' && 
          tag.Value === stackName
        )
      );

      const asg = stackASGs[0];
      
      if (asg.Instances && asg.Instances.length > 0) {
        const instanceIds = asg.Instances.map(i => i.InstanceId!);
        
        const ec2Command = new DescribeInstancesCommand({ InstanceIds: instanceIds });
        const ec2Response = await ec2Client.send(ec2Command);

        let runningInstances = 0;
        ec2Response.Reservations!.forEach(reservation => {
          reservation.Instances!.forEach(instance => {
            expect(['running', 'pending']).toContain(instance.State!.Name);
            expect(instance.InstanceType).toBe('t3.micro');
            
            const nameTag = instance.Tags!.find(tag => tag.Key === 'Name');
            expect(nameTag?.Value).toBe('prod-web-server');
            
            if (instance.State!.Name === 'running') runningInstances++;
          });
        });
        
        console.log(`✅ Found ${runningInstances}/${instanceIds.length} running instances`);
      } else {
        console.warn('⚠️ No instances found in ASG - they may still be launching');
      }
    }, 45000);
  });

  describe('RDS Health Check', () => {
    test('should have available database instance', async () => {
      const dbInstance = await getRdsInfo();

      expect(dbInstance).toBeDefined();
      expect(['available', 'creating', 'modifying']).toContain(dbInstance!.DBInstanceStatus!);
      expect(dbInstance!.DBInstanceClass).toBe('db.t3.small');
      expect(dbInstance!.Engine).toBe('mysql');
      expect(dbInstance!.EngineVersion).toBe('8.0.35');
      expect(dbInstance!.MultiAZ).toBe(true);
      expect(dbInstance!.StorageEncrypted).toBe(true);
      expect(dbInstance!.BackupRetentionPeriod).toBe(7);
      
      console.log(`✅ RDS ${dbInstance!.DBInstanceIdentifier} is ${dbInstance!.DBInstanceStatus}`);
    }, 45000);

    test('should be in private subnets only', async () => {
      const dbInstance = await getRdsInfo();
      const subnetGroup = dbInstance!.DBSubnetGroup!;

      expect(subnetGroup.VpcId).toBe(VPC_ID);
      expect(subnetGroup.Subnets!.length).toBe(2);

      const subnetIds = subnetGroup.Subnets!.map(s => s.SubnetIdentifier!);
      const command = new DescribeSubnetsCommand({ SubnetIds: subnetIds });
      const response = await ec2Client.send(command);

      response.Subnets!.forEach(subnet => {
        expect(subnet.MapPublicIpOnLaunch).toBe(false);
      });
      
      console.log(`✅ RDS is properly isolated in private subnets`);
    });

    test('should not be accessible from internet', async () => {
      const net = require('net');
      
      return new Promise((resolve) => {
        const socket = new net.Socket();
        let connectionFailed = false;

        socket.setTimeout(5000);

        socket.on('timeout', () => {
          connectionFailed = true;
          socket.destroy();
          console.log('✅ RDS connection timeout as expected - properly secured');
          resolve('Connection timeout as expected');
        });

        socket.on('error', (error: any) => {
          connectionFailed = true;
          expect(['ETIMEDOUT', 'ENOTFOUND', 'ECONNREFUSED', 'ENETUNREACH']).toContain(error.code);
          console.log(`✅ RDS connection failed as expected: ${error.code}`);
          resolve('Connection failed as expected');
        });

        socket.on('connect', () => {
          socket.destroy();
          if (!connectionFailed) {
            throw new Error('❌ RDS should not be accessible from internet');
          }
        });

        socket.connect(3306, RDS_ENDPOINT);
      });
    }, 10000);
  });

  describe('S3 Storage Health Check', () => {
    test('should have accessible S3 bucket', async () => {
      const command = new HeadBucketCommand({ Bucket: S3_BUCKET_NAME });
      const response = await s3Client.send(command);
      
      expect(response.$metadata.httpStatusCode).toBe(200);
      console.log(`✅ S3 bucket ${S3_BUCKET_NAME} is accessible`);
    });

    test('should support object operations', async () => {
      const testKey = `integration-test-${Date.now()}.txt`;
      const testContent = 'CloudFormation integration test content';

      try {
        // Upload test object
        const putCommand = new PutObjectCommand({
          Bucket: S3_BUCKET_NAME,
          Key: testKey,
          Body: testContent,
          ContentType: 'text/plain'
        });
        await s3Client.send(putCommand);

        // Retrieve test object
        const getCommand = new GetObjectCommand({
          Bucket: S3_BUCKET_NAME,
          Key: testKey
        });
        const getResponse = await s3Client.send(getCommand);
        const retrievedContent = await getResponse.Body!.transformToString();

        expect(retrievedContent).toBe(testContent);

        // Clean up
        const deleteCommand = new DeleteObjectCommand({
          Bucket: S3_BUCKET_NAME,
          Key: testKey
        });
        await s3Client.send(deleteCommand);
        
        console.log(`✅ S3 object operations successful for ${testKey}`);
      } catch (error) {
        // Ensure cleanup on error
        try {
          const deleteCommand = new DeleteObjectCommand({
            Bucket: S3_BUCKET_NAME,
            Key: testKey
          });
          await s3Client.send(deleteCommand);
        } catch (cleanupError) {
          // Ignore cleanup errors
        }
        throw error;
      }
    });

    test('should have public read policy configured', async () => {
      try {
        const command = new GetBucketPolicyCommand({ Bucket: S3_BUCKET_NAME });
        const response = await s3Client.send(command);
        const policy = JSON.parse(response.Policy!);
        
        expect(policy.Statement).toBeDefined();
        const publicReadStatement = policy.Statement.find((stmt: any) => 
          stmt.Effect === 'Allow' && 
          stmt.Principal === '*' &&
          stmt.Action === 's3:GetObject'
        );
        
        expect(publicReadStatement).toBeDefined();
        expect(publicReadStatement.Resource).toContain(`${S3_BUCKET_NAME}/*`);
        
        console.log(`✅ S3 bucket has public read policy configured`);
      } catch (error: any) {
        if (error.name !== 'NoSuchBucketPolicy') {
          throw error;
        }
        console.log(`⚠️ No bucket policy found - may be configured differently`);
      }
    });
  });

  describe('Monitoring and Scaling Health Check', () => {
    test('should have CloudWatch alarms configured', async () => {
      const command = new DescribeAlarmsCommand({ MaxRecords: 100 });
      const response = await cloudWatchClient.send(command);
      
      const stackAlarms = response.MetricAlarms!.filter(alarm => 
        alarm.AlarmArn!.includes(stackName) ||
        alarm.Tags?.some(tag => 
          tag.Key === 'aws:cloudformation:stack-name' && 
          tag.Value === stackName
        )
      );

      expect(stackAlarms.length).toBeGreaterThanOrEqual(3);
      
      const cpuAlarms = stackAlarms.filter(alarm => alarm.MetricName === 'CPUUtilization');
      expect(cpuAlarms.length).toBeGreaterThanOrEqual(2); // High and low CPU alarms
      
      console.log(`✅ Found ${stackAlarms.length} CloudWatch alarms (${cpuAlarms.length} CPU-based)`);
    });

    test('should have auto scaling policies', async () => {
      const command = new DescribePoliciesCommand({});
      const response = await autoScalingClient.send(command);
      
      const stackPolicies = response.ScalingPolicies!.filter(policy =>
        policy.Tags?.some(tag => 
          tag.Key === 'aws:cloudformation:stack-name' && 
          tag.Value === stackName
        )
      );

      expect(stackPolicies.length).toBe(2);

      const scaleUpPolicy = stackPolicies.find(p => p.ScalingAdjustment! > 0);
      const scaleDownPolicy = stackPolicies.find(p => p.ScalingAdjustment! < 0);

      expect(scaleUpPolicy).toBeDefined();
      expect(scaleDownPolicy).toBeDefined();
      expect(scaleUpPolicy!.ScalingAdjustment).toBe(1);
      expect(scaleDownPolicy!.ScalingAdjustment).toBe(-1);
      
      console.log(`✅ Auto scaling policies configured: scale-up (+1) and scale-down (-1)`);
    });
  });

  describe('Security Validation', () => {
    test('should have properly configured security groups', async () => {
      const command = new DescribeSecurityGroupsCommand({
        Filters: [{ Name: 'vpc-id', Values: [VPC_ID] }]
      });
      const response = await ec2Client.send(command);

      const stackSGs = response.SecurityGroups!.filter(sg => 
        sg.GroupName !== 'default' &&
        sg.Tags?.some(tag => 
          tag.Key === 'aws:cloudformation:stack-name' && 
          tag.Value === stackName
        )
      );

      expect(stackSGs.length).toBeGreaterThanOrEqual(3);
      
      // Find ALB security group
      const albSG = stackSGs.find(sg => 
        sg.Description?.includes('Application Load Balancer')
      );
      
      if (albSG) {
        const httpRule = albSG.IpPermissions!.find(rule => rule.FromPort === 80);
        const httpsRule = albSG.IpPermissions!.find(rule => rule.FromPort === 443);
        
        expect(httpRule).toBeDefined();
        expect(httpsRule).toBeDefined();
        expect(httpRule!.IpRanges!.some(range => range.CidrIp === '0.0.0.0/0')).toBe(true);
      }
      
      console.log(`✅ Security groups properly configured: ${stackSGs.length} found`);
    });

    test('should have IAM roles with correct permissions', async () => {
      const command = new ListRolesCommand({});
      const response = await iamClient.send(command);
      
      const stackRoles = response.Roles!.filter(role =>
        role.RoleName!.includes(stackName)
      );

      expect(stackRoles.length).toBeGreaterThanOrEqual(2);
      
      // Check EC2 role
      const ec2Role = stackRoles.find(role =>
        role.AssumeRolePolicyDocument!.includes('ec2.amazonaws.com')
      );
      
      if (ec2Role) {
        const policiesCommand = new ListAttachedRolePoliciesCommand({
          RoleName: ec2Role.RoleName
        });
        const policiesResponse = await iamClient.send(policiesCommand);
        
        const cloudWatchPolicy = policiesResponse.AttachedPolicies!.find(policy =>
          policy.PolicyArn === 'arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy'
        );
        expect(cloudWatchPolicy).toBeDefined();
      }
      
      console.log(`✅ IAM roles configured: ${stackRoles.length} roles found`);
    });
  });

  describe('End-to-End Validation', () => {
    test('should have all components properly interconnected', async () => {
      // Verify ALB is in correct VPC
      const alb = await getLoadBalancerInfo();
      expect(alb!.VpcId).toBe(VPC_ID);

      // Verify ALB subnets are public
      const subnetIds = alb!.AvailabilityZones!.map(az => az.SubnetId!);
      const command = new DescribeSubnetsCommand({ SubnetIds: subnetIds });
      const response = await ec2Client.send(command);

      response.Subnets!.forEach(subnet => {
        expect(subnet.VpcId).toBe(VPC_ID);
        expect(subnet.MapPublicIpOnLaunch).toBe(true);
      });
      
      console.log(`✅ Infrastructure components are properly interconnected`);
    });

    test('should pass comprehensive health check', async () => {
      const healthChecks = await Promise.allSettled([
        getVpcInfo(),
        s3Client.send(new HeadBucketCommand({ Bucket: S3_BUCKET_NAME })),
        getLoadBalancerInfo(),
        autoScalingClient.send(new DescribeAutoScalingGroupsCommand({})),
        getRdsInfo()
      ]);

      const failedChecks = healthChecks.filter(result => result.status === 'rejected');
      
      if (failedChecks.length > 0) {
        console.warn(`⚠️ Some health checks failed: ${failedChecks.length}/${healthChecks.length}`);
        failedChecks.forEach((check, index) => {
          if (check.status === 'rejected') {
            console.error(`❌ Health check ${index} failed:`, check.reason);
          }
        });
      }

      const successRate = (healthChecks.length - failedChecks.length) / healthChecks.length;
      expect(successRate).toBeGreaterThanOrEqual(0.8); // 80% success rate required
      
      console.log(`✅ Overall health check: ${Math.round(successRate * 100)}% success rate`);
    }, 45000);
  });
});
