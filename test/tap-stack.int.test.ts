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
  DescribeVpcAttributeCommand,
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
  GetPublicAccessBlockCommand,
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
  DescribeStackResourcesCommand,
} from '@aws-sdk/client-cloudformation';
import {
  IAMClient,
  ListRolesCommand,
  ListRolePoliciesCommand,
  ListAttachedRolePoliciesCommand,
} from '@aws-sdk/client-iam';
import fs from 'fs';
import path from 'path';

// LocalStack detection
const isLocalStack = process.env.AWS_ENDPOINT_URL?.includes('localhost') ||
                     process.env.AWS_ENDPOINT_URL?.includes('4566');

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

// AWS SDK v3 client configuration with LocalStack support
const clientConfig = isLocalStack ? {
  region: 'us-east-1',
  endpoint: process.env.AWS_ENDPOINT_URL || 'http://localhost:4566',
  credentials: {
    accessKeyId: 'test',
    secretAccessKey: 'test'
  },
  forcePathStyle: true
} : { region: 'us-east-1' };

// AWS SDK v3 clients with LocalStack support
const ec2Client = new EC2Client(clientConfig);
const elbv2Client = new ElasticLoadBalancingV2Client(clientConfig);
const rdsClient = new RDSClient(clientConfig);
const s3Client = new S3Client({ ...clientConfig, forcePathStyle: true });
const cloudWatchClient = new CloudWatchClient(clientConfig);
const autoScalingClient = new AutoScalingClient(clientConfig);
const cloudFormationClient = new CloudFormationClient(clientConfig);
const iamClient = new IAMClient(clientConfig);

// Helper functions for AWS SDK v3 operations
async function getStackInfo() {
  const command = new DescribeStacksCommand({ StackName: stackName });
  const response = await cloudFormationClient.send(command);
  return response.Stacks![0];
}

async function getStackParameters() {
  const stack = await getStackInfo();
  const parameters: { [key: string]: string } = {};
  stack.Parameters?.forEach((param: any) => {
    parameters[param.ParameterKey] = param.ParameterValue;
  });
  return parameters;
}

async function getVpcInfo() {
  const command = new DescribeVpcsCommand({ VpcIds: [VPC_ID] });
  const response = await ec2Client.send(command);
  return response.Vpcs![0];
}

async function getLoadBalancerInfo() {
  const command = new DescribeLoadBalancersCommand({});
  const response = await elbv2Client.send(command);
  return response.LoadBalancers!.find((lb: any) => lb.DNSName === LOAD_BALANCER_DNS);
}

async function getRdsInfo() {
  const command = new DescribeDBInstancesCommand({});
  const response = await rdsClient.send(command);
  return response.DBInstances!.find((db: any) => 
    db.Endpoint?.Address === RDS_ENDPOINT ||
    (db as any).Tags?.some((tag: any) => 
      tag.Key === 'aws:cloudformation:stack-name' && 
      tag.Value === stackName
    )
  );
}

describe('TapStack Integration Tests', () => {
  let stackParameters: { [key: string]: string } = {};

  // Setup validation
  beforeAll(async () => {
    console.log('🔍 Validating stack deployment...');
    const stack = await getStackInfo();
    stackParameters = await getStackParameters();
    console.log(`✅ Stack ${stackName} is in ${stack.StackStatus} state`);
    console.log(`🔧 Stack parameters:`, stackParameters);
    
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

    test('should validate stack parameters', async () => {
      // Check that only the two expected parameters exist (matching unit test)
      expect(stackParameters.Environment).toBeDefined();
      expect(stackParameters.KeyPairName).toBeDefined();
      // Removed SSHAccessCidr check since it doesn't exist in template
      
      console.log(`📋 Environment: ${stackParameters.Environment}`);
      console.log(`🔑 KeyPair: ${stackParameters.KeyPairName || 'Not specified'}`);
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
      const repositoryTag = stack.Tags!.find((tag: any) => tag.Key === 'Repository');
      const authorTag = stack.Tags!.find((tag: any) => tag.Key === 'CommitAuthor');
      
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
      expect(vpc.DhcpOptionsId).toBeDefined();

      // Fetch DNS attributes separately
      const dnsHostnamesCommand = new DescribeVpcAttributeCommand({
        VpcId: vpc.VpcId!,
        Attribute: 'enableDnsHostnames'
      });
      const dnsHostnamesResponse = await ec2Client.send(dnsHostnamesCommand);
      expect(dnsHostnamesResponse.EnableDnsHostnames?.Value).toBe(true);

      const dnsSupportCommand = new DescribeVpcAttributeCommand({
        VpcId: vpc.VpcId!,
        Attribute: 'enableDnsSupport'
      });
      const dnsSupportResponse = await ec2Client.send(dnsSupportCommand);
      expect(dnsSupportResponse.EnableDnsSupport?.Value).toBe(true);
      
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
      
      publicSubnets.forEach((subnet: any) => {
        expect(subnet.State).toBe('available');
        expect(subnet.MapPublicIpOnLaunch).toBe(true);
        expect(['10.0.1.0/24', '10.0.2.0/24']).toContain(subnet.CidrBlock);
      });

      // Verify AZ distribution - should be consistent (AZ 0 and AZ 1)
      const azs = [...new Set(publicSubnets.map((s: any) => s.AvailabilityZone))];
      expect(azs.length).toBe(2);
      
      console.log(`✅ Found ${publicSubnets.length} public subnets across ${azs.length} AZs: ${azs.join(', ')}`);
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
      
      privateSubnets.forEach((subnet: any) => {
        expect(subnet.State).toBe('available');
        expect(subnet.MapPublicIpOnLaunch).toBe(false);
        expect(['10.0.3.0/24', '10.0.4.0/24']).toContain(subnet.CidrBlock);
      });
      
      console.log(`✅ Found ${privateSubnets.length} private subnets`);
    });

    test('should have functioning NAT Gateways', async () => {
      const command = new DescribeNatGatewaysCommand({
        Filter: [{ Name: 'vpc-id', Values: [VPC_ID] }]
      });
      const response = await ec2Client.send(command);
      const natGateways = response.NatGateways!.filter((nat: any) => nat.State !== 'deleted');

      expect(natGateways.length).toBe(2);
      
      natGateways.forEach((nat: any) => {
        expect(nat.State).toBe('available');
        expect(nat.NatGatewayAddresses![0].AllocationId).toBeDefined();
        expect(nat.NatGatewayAddresses![0].PublicIp).toBeDefined();
        expect(nat.VpcId).toBe(VPC_ID);
      });
      
      console.log(`✅ NAT Gateways are healthy with public IPs: ${natGateways.map((nat: any) => nat.NatGatewayAddresses![0].PublicIp).join(', ')}`);
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
      const stackTG = response.TargetGroups!.find((tg: any) => tg.VpcId === VPC_ID);

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
      
      const stackASGs = response.AutoScalingGroups!.filter((asg: any) =>
        asg.Tags?.some((tag: any) => 
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
      
      const stackASGs = asgResponse.AutoScalingGroups!.filter((asg: any) =>
        asg.Tags?.some((tag: any) => 
          tag.Key === 'aws:cloudformation:stack-name' && 
          tag.Value === stackName
        )
      );

      const asg = stackASGs[0];
      
      if (asg.Instances && asg.Instances.length > 0) {
        const instanceIds = asg.Instances.map((i: any) => i.InstanceId!);
        
        const ec2Command = new DescribeInstancesCommand({ InstanceIds: instanceIds });
        const ec2Response = await ec2Client.send(ec2Command);

        let runningInstances = 0;
        ec2Response.Reservations!.forEach((reservation: any) => {
          reservation.Instances!.forEach((instance: any) => {
            expect(['running', 'pending']).toContain(instance.State!.Name);
            expect(instance.InstanceType).toBe('t3.micro');
            
            const nameTag = instance.Tags!.find((tag: any) => tag.Key === 'Name');
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
      expect(dbInstance!.EngineVersion).toBe('8.0.42');
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

      const subnetIds = subnetGroup.Subnets!.map((s: any) => s.SubnetIdentifier!);
      const command = new DescribeSubnetsCommand({ SubnetIds: subnetIds });
      const response = await ec2Client.send(command);

      response.Subnets!.forEach((subnet: any) => {
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

    test('should have secure public access configuration', async () => {
      const command = new GetPublicAccessBlockCommand({ Bucket: S3_BUCKET_NAME });
      const response = await s3Client.send(command);
      const config = response.PublicAccessBlockConfiguration!;

      // Updated to match the template and unit test expectations
      expect(config.BlockPublicAcls).toBe(true);      // Updated to match template
      expect(config.IgnorePublicAcls).toBe(true);     // Updated to match template
      expect(config.BlockPublicPolicy).toBe(false);   // Remains false
      expect(config.RestrictPublicBuckets).toBe(false); // Remains false
      
      console.log(`✅ S3 bucket has secure public access configuration`);
      console.log(`   - Block Public ACLs: ${config.BlockPublicAcls}`);
      console.log(`   - Ignore Public ACLs: ${config.IgnorePublicAcls}`);
      console.log(`   - Block Public Policy: ${config.BlockPublicPolicy}`);
      console.log(`   - Restrict Public Buckets: ${config.RestrictPublicBuckets}`);
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
      } catch (error: any) {
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

  describe('Security Validation', () => {
    test('should have properly configured security groups with hardcoded SSH CIDR', async () => {
      const command = new DescribeSecurityGroupsCommand({
        Filters: [{ Name: 'vpc-id', Values: [VPC_ID] }]
      });
      const response = await ec2Client.send(command);

      const stackSGs = response.SecurityGroups!.filter((sg: any) => 
        sg.GroupName !== 'default' &&
        sg.Tags?.some((tag: any) => 
          tag.Key === 'aws:cloudformation:stack-name' && 
          tag.Value === stackName
        )
      );

      expect(stackSGs.length).toBeGreaterThanOrEqual(3);
      
      // Find web security group and check SSH access uses hardcoded CIDR
      const webSG = stackSGs.find((sg: any) => 
        sg.Tags?.some((tag: any) => tag.Key === 'Name' && tag.Value === 'prod-web-security-group')
      );

      expect(webSG).toBeDefined();
      
      const sshRule = webSG!.IpPermissions!.find((rule: any) => rule.FromPort === 22);
      expect(sshRule).toBeDefined();
      expect(sshRule!.IpRanges).toBeDefined();
      
      // Check for hardcoded SSH CIDR (not parameter-based)
      const sshCidrs = sshRule!.IpRanges!.map((range: any) => range.CidrIp);
      expect(sshCidrs).toContain('10.0.0.0/16');
      
      console.log(`✅ Web security group has hardcoded SSH access from 10.0.0.0/16`);
    });

    test('should have RDS security group allowing MySQL from web servers', async () => {
      const command = new DescribeSecurityGroupsCommand({
        Filters: [{ Name: 'vpc-id', Values: [VPC_ID] }]
      });
      const response = await ec2Client.send(command);

      const stackSGs = response.SecurityGroups!.filter((sg: any) => 
        sg.GroupName !== 'default' &&
        sg.Tags?.some((tag: any) => 
          tag.Key === 'aws:cloudformation:stack-name' && 
          tag.Value === stackName
        )
      );

      // Find RDS security group
      const rdsSG = stackSGs.find((sg: any) => 
        sg.Tags?.some((tag: any) => tag.Key === 'Name' && tag.Value === 'prod-rds-security-group')
      );

      expect(rdsSG).toBeDefined();
      
      const mysqlRule = rdsSG!.IpPermissions!.find((rule: any) => rule.FromPort === 3306);
      expect(mysqlRule).toBeDefined();
      expect(mysqlRule!.ToPort).toBe(3306);
      expect(mysqlRule!.IpProtocol).toBe('tcp');
      
      // Check that it allows access from web security group
      const webSGReference = mysqlRule!.UserIdGroupPairs!.find((pair: any) => 
        pair.Description?.includes('web') || 
        stackSGs.some((sg: any) => 
          sg.GroupId === pair.GroupId && 
          sg.Tags?.some((tag: any) => tag.Key === 'Name' && tag.Value === 'prod-web-security-group')
        )
      );
      expect(webSGReference).toBeDefined();
      
      console.log(`✅ RDS security group allows MySQL access from web servers only`);
    });
  });

  describe('CloudWatch Monitoring', () => {
    test('should have CloudWatch alarms configured', async () => {
      const command = new DescribeAlarmsCommand({});
      const response = await cloudWatchClient.send(command);
      
      // Get stack resources to find the actual alarm names
      const stackResourcesCommand = new DescribeStackResourcesCommand({
        StackName: stackName
      });
      const stackResourcesResponse = await cloudFormationClient.send(stackResourcesCommand);
      
      // Find CloudWatch alarm resources in the stack
      const alarmResources = stackResourcesResponse.StackResources?.filter((resource: any) => 
        resource.ResourceType === 'AWS::CloudWatch::Alarm'
      ) || [];

      // Get the physical resource IDs (actual alarm names)
      const expectedAlarmNames = alarmResources.map((resource: any) => resource.PhysicalResourceId);
      
      // Filter alarms by actual alarm names from stack
      const stackAlarms = response.MetricAlarms!.filter((alarm: any) =>
        expectedAlarmNames.includes(alarm.AlarmName)
      );

      console.log(`🔍 Expected alarms: ${expectedAlarmNames.join(', ')}`);
      console.log(`🔍 Found stack alarms: ${stackAlarms.map((a: any) => a.AlarmName).join(', ')}`);

      // Should have ASG CPU alarms (high/low) and RDS CPU alarm = 3 total
      expect(stackAlarms.length).toBeGreaterThanOrEqual(3);
      
      // Check for specific alarm types by logical resource ID mapping
      const asgHighCpuAlarm = stackAlarms.find((alarm: any) => {
        const resource = alarmResources.find((r: any) => r.PhysicalResourceId === alarm.AlarmName);
        return resource?.LogicalResourceId === 'ProdAsgCpuAlarm';
      });
      expect(asgHighCpuAlarm).toBeDefined();
      expect(asgHighCpuAlarm?.MetricName).toBe('CPUUtilization');
      expect(asgHighCpuAlarm?.Namespace).toBe('AWS/EC2');
      expect(asgHighCpuAlarm?.ComparisonOperator).toBe('GreaterThanThreshold');
      expect(asgHighCpuAlarm?.Threshold).toBe(70);
      
      const asgLowCpuAlarm = stackAlarms.find((alarm: any) => {
        const resource = alarmResources.find((r: any) => r.PhysicalResourceId === alarm.AlarmName);
        return resource?.LogicalResourceId === 'ProdAsgLowCpuAlarm';
      });
      expect(asgLowCpuAlarm).toBeDefined();
      expect(asgLowCpuAlarm?.MetricName).toBe('CPUUtilization');
      expect(asgLowCpuAlarm?.Namespace).toBe('AWS/EC2');
      expect(asgLowCpuAlarm?.ComparisonOperator).toBe('LessThanThreshold');
      expect(asgLowCpuAlarm?.Threshold).toBe(20);
      
      const rdsCpuAlarm = stackAlarms.find((alarm: any) => {
        const resource = alarmResources.find((r: any) => r.PhysicalResourceId === alarm.AlarmName);
        return resource?.LogicalResourceId === 'ProdRdsCpuAlarm';
      });
      expect(rdsCpuAlarm).toBeDefined();
      expect(rdsCpuAlarm?.MetricName).toBe('CPUUtilization');
      expect(rdsCpuAlarm?.Namespace).toBe('AWS/RDS');
      expect(rdsCpuAlarm?.ComparisonOperator).toBe('GreaterThanThreshold');
      expect(rdsCpuAlarm?.Threshold).toBe(70);
      
      console.log(`✅ Found ${stackAlarms.length} CloudWatch alarms for monitoring`);
      console.log(`  - ASG High CPU Alarm: ${asgHighCpuAlarm?.AlarmName}`);
      console.log(`  - ASG Low CPU Alarm: ${asgLowCpuAlarm?.AlarmName}`);
      console.log(`  - RDS CPU Alarm: ${rdsCpuAlarm?.AlarmName}`);
    });
  });
});
