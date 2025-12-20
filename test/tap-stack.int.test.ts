/**
 * test/tap-stack.integration.test.ts
 *
 * Integration tests for the deployed CloudFormation stack
 * Tests actual AWS resources and their interactions for secure, highly available infrastructure
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
  DescribeTargetHealthCommand,
} from '@aws-sdk/client-elastic-load-balancing-v2';
import {
  S3Client,
  HeadBucketCommand,
  GetBucketEncryptionCommand,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import {
  CloudFormationClient,
  DescribeStacksCommand,
  DescribeStackResourcesCommand,
} from '@aws-sdk/client-cloudformation';
import {
  IAMClient,
  GetRoleCommand,
  ListAttachedRolePoliciesCommand,
  GetInstanceProfileCommand,
} from '@aws-sdk/client-iam';
import fs from 'fs';
import path from 'path';

// Configuration - Load from cfn-outputs after stack deployment
const outputs = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../cfn-outputs/flat-outputs.json'), 'utf8')
);

// Get environment suffix from environment variable (set by CI/CD pipeline)
const AWS_ENDPOINT = process.env.AWS_ENDPOINT_URL || 'http://localhost:4566';
const AWS_REGION = process.env.AWS_REGION || 'us-west-2';
const isLocalStack = AWS_ENDPOINT.includes('localhost');
const stackName = isLocalStack ? 'tap-stack-localstack' : `TapStack${process.env.ENVIRONMENT_SUFFIX || 'dev'}`;

// Extract outputs for testing
const VPC_ID = outputs[`${stackName}-VPC-ID`] || outputs['VPCId'];
const PUBLIC_SUBNET_ID = outputs[`${stackName}-PublicSubnet1-ID`] || outputs['PublicSubnetId'];
const LOAD_BALANCER_URL = outputs['LoadBalancerURL'];

// AWS SDK v3 clients pointed to LocalStack when applicable
const sharedConfig = {
  region: AWS_REGION,
  endpoint: AWS_ENDPOINT,
  forcePathStyle: true,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || 'test',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || 'test'
  }
};

const ec2Client = new EC2Client(sharedConfig);
const elbv2Client = new ElasticLoadBalancingV2Client(sharedConfig);
const s3Client = new S3Client(sharedConfig);
const cloudFormationClient = new CloudFormationClient(sharedConfig);
const iamClient = new IAMClient(sharedConfig);

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
  if (!LOAD_BALANCER_URL) return null;
  const dnsName = LOAD_BALANCER_URL.replace('http://', '').replace('https://', '');
  const command = new DescribeLoadBalancersCommand({});
  const response = await elbv2Client.send(command);
  return response.LoadBalancers!.find((lb: any) => lb.DNSName === dnsName);
}

async function getS3BucketName() {
  // Get S3 bucket from stack resources since we don't have it in outputs
  const command = new DescribeStackResourcesCommand({ StackName: stackName });
  const response = await cloudFormationClient.send(command);
  const s3Resource = response.StackResources?.find(
    (resource: any) => resource.ResourceType === 'AWS::S3::Bucket'
  );
  return s3Resource?.PhysicalResourceId;
}

describe('TapStack Integration Tests', () => {
  let stackParameters: { [key: string]: string } = {};
  let s3BucketName: string;

  // Setup validation
  beforeAll(async () => {
    console.log('Validating stack deployment...');
    const stack = await getStackInfo();
    stackParameters = await getStackParameters();
    s3BucketName = await getS3BucketName() || '';
    
    console.log(`Stack ${stackName} is in ${stack.StackStatus} state`);
    console.log(`Stack parameters:`, stackParameters);
    
    // Log key infrastructure endpoints
    console.log(`VPC ID: ${VPC_ID}`);
    console.log(`Public Subnet ID: ${PUBLIC_SUBNET_ID}`);
    console.log(`Load Balancer URL: ${LOAD_BALANCER_URL}`);
    console.log(`S3 Bucket: ${s3BucketName}`);
  });

  describe('Infrastructure Validation', () => {
    test('should have valid VPC ID', () => {
      expect(VPC_ID).toBeDefined();
      expect(VPC_ID).toMatch(/^vpc-[a-f0-9]+$/);
    });

    test('should have valid Public Subnet ID', () => {
      expect(PUBLIC_SUBNET_ID).toBeDefined();
      expect(PUBLIC_SUBNET_ID).toMatch(/^subnet-[a-f0-9]+$/);
    });

    test('should have valid Load Balancer URL', () => {
      expect(LOAD_BALANCER_URL).toBeDefined();
      const awsPattern = /^http:\/\/.*\.elb\.amazonaws\.com$/;
      const localPattern = /^http:\/\/.*\.elb\.localhost\.localstack\.cloud$/;
      expect(LOAD_BALANCER_URL).toMatch(isLocalStack ? localPattern : awsPattern);
    });

    test('should have valid S3 bucket name', () => {
      expect(s3BucketName).toBeDefined();
      expect(s3BucketName).toMatch(/^[a-z0-9-]+$/);
    });

    test('should validate stack parameters', async () => {
      // Check that all 4 expected parameters exist (matching unit test)
      expect(stackParameters.Environment).toBeDefined();
      expect(stackParameters.KeyPairName).toBeDefined();
      expect(stackParameters.AmiId).toBeDefined();
      expect(stackParameters.InstanceType).toBeDefined();
      
      console.log(`Environment: ${stackParameters.Environment}`);
      console.log(`KeyPair: ${stackParameters.KeyPairName || 'Not specified'}`);
      console.log(`AMI ID: ${stackParameters.AmiId}`);
      console.log(`Instance Type: ${stackParameters.InstanceType}`);
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
      if (!isLocalStack) {
        expect(dnsHostnamesResponse.EnableDnsHostnames?.Value).toBe(true);
      }

      const dnsSupportCommand = new DescribeVpcAttributeCommand({
        VpcId: vpc.VpcId!,
        Attribute: 'enableDnsSupport'
      });
      const dnsSupportResponse = await ec2Client.send(dnsSupportCommand);
      if (!isLocalStack) {
        expect(dnsSupportResponse.EnableDnsSupport?.Value).toBe(true);
      }
      
      console.log(`VPC ${VPC_ID} is available with CIDR 10.0.0.0/16`);
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
        expect(['10.0.1.0/24', '10.0.4.0/24']).toContain(subnet.CidrBlock);
      });

      // Verify AZ distribution - should be in different AZs
      const azs = [...new Set(publicSubnets.map((s: any) => s.AvailabilityZone))];
      expect(azs.length).toBe(2);
      
      console.log(`Found ${publicSubnets.length} public subnets across ${azs.length} AZs: ${azs.join(', ')}`);
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
        expect(['10.0.2.0/24', '10.0.3.0/24']).toContain(subnet.CidrBlock);
      });
      
      // Verify AZ distribution
      const azs = [...new Set(privateSubnets.map((s: any) => s.AvailabilityZone))];
      expect(azs.length).toBe(2);
      
      console.log(`Found ${privateSubnets.length} private subnets across ${azs.length} AZs`);
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
      
      console.log(`NAT Gateways are healthy with public IPs: ${natGateways.map((nat: any) => nat.NatGatewayAddresses![0].PublicIp).join(', ')}`);
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
      
      console.log(`Internet Gateway ${igws[0].InternetGatewayId} is attached`);
    });

    test('should have proper route table configuration', async () => {
      const command = new DescribeRouteTablesCommand({
        Filters: [{ Name: 'vpc-id', Values: [VPC_ID] }]
      });
      const response = await ec2Client.send(command);
      const routeTables = response.RouteTables!.filter((rt: any) => 
        rt.Tags?.some((tag: any) => 
          tag.Key === 'aws:cloudformation:stack-name' && 
          tag.Value === stackName
        )
      );

      // Should have 3 route tables: 1 public, 2 private (LocalStack may omit tags)
      if (!isLocalStack) {
        expect(routeTables.length).toBe(3);
      }
      
      // Check public route table has internet gateway route
      if (!isLocalStack) {
        const publicRT = routeTables.find((rt: any) => 
          rt.Tags?.some((tag: any) => tag.Value?.includes('PublicRouteTable'))
        );
        expect(publicRT).toBeDefined();
        
        const igwRoute = publicRT!.Routes!.find((route: any) => 
          route.DestinationCidrBlock === '0.0.0.0/0' && route.GatewayId?.startsWith('igw-')
        );
        expect(igwRoute).toBeDefined();
        
        // Check private route tables have NAT gateway routes
        const privateRTs = routeTables.filter((rt: any) => 
          rt.Tags?.some((tag: any) => tag.Value?.includes('PrivateRouteTable'))
        );
        expect(privateRTs.length).toBe(2);
        
        privateRTs.forEach((rt: any) => {
          const natRoute = rt.Routes!.find((route: any) => 
            route.DestinationCidrBlock === '0.0.0.0/0' && route.NatGatewayId?.startsWith('nat-')
          );
          expect(natRoute).toBeDefined();
        });
        
        console.log(`Route tables properly configured: 1 public, 2 private`);
      } else {
        console.log('LOCALSTACK COMPATIBILITY: Skipping detailed route table assertions; tagging/routes not fully returned.');
      }
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
      
      console.log(`ALB ${alb!.LoadBalancerName} is active and internet-facing`);
    });

    test('should respond to HTTP requests', async () => {
      if (isLocalStack) {
        console.log('LOCALSTACK COMPATIBILITY: Skipping ALB HTTP probe; ELB data plane not emulated.');
        return;
      }
      console.log(`Testing HTTP connectivity to ${LOAD_BALANCER_URL}...`);
      
      const response = await fetch(LOAD_BALANCER_URL, {
        method: 'GET',
        signal: AbortSignal.timeout(10000), // 10 second timeout
      });

      // Accept any response that indicates connectivity (even 5xx if instances are starting)
      expect(response.status).toBeLessThan(600);
      
      console.log(`ALB responded with status: ${response.status}`);
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
      
      console.log(`Target Group ${stackTG!.TargetGroupName} configured correctly`);
    });

    test('should have listener forwarding to target group', async () => {
      const alb = await getLoadBalancerInfo();
      if (alb) {
        const command = new DescribeListenersCommand({
          LoadBalancerArn: alb.LoadBalancerArn
        });
        const response = await elbv2Client.send(command);
        
        expect(response.Listeners!.length).toBe(1);
        const listener = response.Listeners![0];
        
        if (!isLocalStack) {
          expect(listener.Port).toBe(80);
        }
        expect(listener.Protocol).toBe('HTTP');
        expect(listener.DefaultActions![0].Type).toBe('forward');
        
        console.log(`Listener configured for port ${listener.Port}/${listener.Protocol}`);
      }
    });
  });

  describe('EC2 Instances Health Check', () => {
    test('should have running EC2 instances in private subnets', async () => {
      if (isLocalStack) {
        console.log('LOCALSTACK COMPATIBILITY: Skipping EC2 instance runtime checks; EC2 data plane not emulated.');
        return;
      }
      const command = new DescribeInstancesCommand({
        Filters: [
          { Name: 'vpc-id', Values: [VPC_ID] },
          { Name: 'instance-state-name', Values: ['running', 'pending'] }
        ]
      });
      const response = await ec2Client.send(command);

      let instances: any[] = [];
      response.Reservations!.forEach((reservation: any) => {
        instances.push(...reservation.Instances!);
      });

      // Filter instances created by our stack
      const stackInstances = instances.filter((instance: any) =>
        instance.Tags?.some((tag: any) => 
          tag.Key === 'aws:cloudformation:stack-name' && 
          tag.Value === stackName
        )
      );

      expect(stackInstances.length).toBe(2);
      
      // Use for...of loop to properly handle async operations
      for (const instance of stackInstances) {
        expect(['running', 'pending']).toContain(instance.State!.Name);
        expect(instance.InstanceType).toBe(stackParameters.InstanceType || 't3.micro');
        
        // Verify instances are in private subnets
        const subnetCommand = new DescribeSubnetsCommand({
          SubnetIds: [instance.SubnetId!]
        });
        const subnetResponse = await ec2Client.send(subnetCommand);
        const subnet = subnetResponse.Subnets![0];
        expect(subnet.MapPublicIpOnLaunch).toBe(false);
        expect(['10.0.2.0/24', '10.0.3.0/24']).toContain(subnet.CidrBlock);
        
        // Check proper security groups
        const sgIds = instance.SecurityGroups!.map((sg: any) => sg.GroupId);
        expect(sgIds.length).toBe(2); // DefaultSecurityGroup + EC2SecurityGroup
      }
      
      console.log(`Found ${stackInstances.length} EC2 instances in private subnets`);
    }, 30000);

    test('should have instances with proper IAM role', async () => {
      const command = new DescribeInstancesCommand({
        Filters: [
          { Name: 'vpc-id', Values: [VPC_ID] },
          { Name: 'instance-state-name', Values: ['running', 'pending'] }
        ]
      });
      const response = await ec2Client.send(command);

      let instances: any[] = [];
      response.Reservations!.forEach((reservation: any) => {
        instances.push(...reservation.Instances!);
      });

      const stackInstances = instances.filter((instance: any) =>
        instance.Tags?.some((tag: any) => 
          tag.Key === 'aws:cloudformation:stack-name' && 
          tag.Value === stackName
        )
      );

      if (stackInstances.length > 0) {
        const instance = stackInstances[0];
        expect(instance.IamInstanceProfile).toBeDefined();
        
        // Get the instance profile name
        const profileArn = instance.IamInstanceProfile.Arn;
        const profileName = profileArn.split('/').pop();
        
        const profileCommand = new GetInstanceProfileCommand({
          InstanceProfileName: profileName
        });
        const profileResponse = await iamClient.send(profileCommand);
        
        expect(profileResponse.InstanceProfile!.Roles!.length).toBe(1);
        const roleName = profileResponse.InstanceProfile!.Roles![0].RoleName!;
        
        // Check role has ReadOnlyAccess policy
        const policiesCommand = new ListAttachedRolePoliciesCommand({
          RoleName: roleName
        });
        const policiesResponse = await iamClient.send(policiesCommand);
        
        const readOnlyPolicy = policiesResponse.AttachedPolicies!.find(
          (policy: any) => policy.PolicyArn === 'arn:aws:iam::aws:policy/ReadOnlyAccess'
        );
        expect(readOnlyPolicy).toBeDefined();
        
        console.log(`EC2 instances have proper IAM role with ReadOnlyAccess`);
      }
    });
  });

  describe('S3 Storage Health Check', () => {
    test('should have accessible S3 bucket', async () => {
      const command = new HeadBucketCommand({ Bucket: s3BucketName });
      const response = await s3Client.send(command);
      
      expect(response.$metadata.httpStatusCode).toBe(200);
      console.log(`S3 bucket ${s3BucketName} is accessible`);
    });

    test('should have server-side encryption enabled', async () => {
      const command = new GetBucketEncryptionCommand({ Bucket: s3BucketName });
      const response = await s3Client.send(command);
      
      expect(response.ServerSideEncryptionConfiguration).toBeDefined();
      const rule = response.ServerSideEncryptionConfiguration!.Rules![0];
      expect(rule.ApplyServerSideEncryptionByDefault!.SSEAlgorithm).toBe('AES256');
      
      console.log(`S3 bucket has AES256 server-side encryption enabled`);
    });

    test('should support object operations', async () => {
      const testKey = `integration-test-${Date.now()}.txt`;
      const testContent = 'TapStack integration test content';

      try {
        // Upload test object
        const putCommand = new PutObjectCommand({
          Bucket: s3BucketName,
          Key: testKey,
          Body: testContent,
          ContentType: 'text/plain'
        });
        await s3Client.send(putCommand);

        // Retrieve test object
        const getCommand = new GetObjectCommand({
          Bucket: s3BucketName,
          Key: testKey
        });
        const getResponse = await s3Client.send(getCommand);
        const retrievedContent = await getResponse.Body!.transformToString();

        expect(retrievedContent).toBe(testContent);

        // Clean up
        const deleteCommand = new DeleteObjectCommand({
          Bucket: s3BucketName,
          Key: testKey
        });
        await s3Client.send(deleteCommand);
        
        console.log(`S3 object operations successful for ${testKey}`);
      } catch (error: any) {
        // Ensure cleanup on error
        try {
          const deleteCommand = new DeleteObjectCommand({
            Bucket: s3BucketName,
            Key: testKey
          });
          await s3Client.send(deleteCommand);
        } catch (cleanupError) {
          // Ignore cleanup errors
        }
        throw error;
      }
    });
  });

  describe('Security Validation', () => {
    test('should have properly configured security groups', async () => {
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

      if (!isLocalStack) {
        expect(stackSGs.length).toBeGreaterThanOrEqual(3);
      }
      
      // Find ALB security group
      const albSG = stackSGs.find((sg: any) => 
        sg.Tags?.some((tag: any) => tag.Value?.includes('ALB-SG'))
      );
      expect(albSG).toBeDefined();
      
      // Check ALB SG allows HTTP/HTTPS from internet
      const httpRule = albSG!.IpPermissions!.find((rule: any) => rule.FromPort === 80);
      const httpsRule = albSG!.IpPermissions!.find((rule: any) => rule.FromPort === 443);
      
      if (!isLocalStack) {
        expect(httpRule).toBeDefined();
        expect(httpsRule).toBeDefined();
        expect(httpRule!.IpRanges!.some((range: any) => range.CidrIp === '0.0.0.0/0')).toBe(true);
        expect(httpsRule!.IpRanges!.some((range: any) => range.CidrIp === '0.0.0.0/0')).toBe(true);
        console.log(`Security groups properly configured for web traffic`);
      }
    });

    test('should have EC2 security group allowing traffic from ALB only', async () => {
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

      // Find EC2 security group
      const ec2SG = stackSGs.find((sg: any) => 
        sg.Tags?.some((tag: any) => tag.Value?.includes('EC2-SG'))
      );

      expect(ec2SG).toBeDefined();
      
      // Find ALB security group
      const albSG = stackSGs.find((sg: any) => 
        sg.Tags?.some((tag: any) => tag.Value?.includes('ALB-SG'))
      );

      // Check EC2 SG allows HTTP from ALB SG only
      const httpRule = ec2SG!.IpPermissions!.find((rule: any) => rule.FromPort === 80);
      if (!isLocalStack) {
        expect(httpRule).toBeDefined();
        expect(httpRule!.UserIdGroupPairs!.length).toBe(1);
        expect(httpRule!.UserIdGroupPairs![0].GroupId).toBe(albSG!.GroupId);
        console.log(`EC2 security group allows traffic from ALB only`);
      }
    });

    test('should have default security group allowing internal traffic only', async () => {
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

      // Find default security group
      const defaultSG = stackSGs.find((sg: any) => 
        sg.Tags?.some((tag: any) => tag.Value?.includes('DefaultSG'))
      );

      expect(defaultSG).toBeDefined();
      
      // Check it allows traffic from itself only
      const selfRule = defaultSG!.IpPermissions!.find((rule: any) => 
        rule.UserIdGroupPairs?.some((pair: any) => pair.GroupId === defaultSG!.GroupId)
      );
      expect(selfRule).toBeDefined();
      
      console.log(`Default security group allows internal traffic only`);
    });
  });

  describe('High Availability Validation', () => {
    test('should have resources distributed across multiple AZs', async () => {
      // Check subnets are in different AZs
      const subnetCommand = new DescribeSubnetsCommand({
        Filters: [{ Name: 'vpc-id', Values: [VPC_ID] }]
      });
      const subnetResponse = await ec2Client.send(subnetCommand);
      
      const azs = [...new Set(subnetResponse.Subnets!.map((s: any) => s.AvailabilityZone))];
      expect(azs.length).toBe(2);
      
      // Check EC2 instances are in different AZs
      const ec2Command = new DescribeInstancesCommand({
        Filters: [
          { Name: 'vpc-id', Values: [VPC_ID] },
          { Name: 'instance-state-name', Values: ['running', 'pending'] }
        ]
      });
      const ec2Response = await ec2Client.send(ec2Command);
      
      let instances: any[] = [];
      ec2Response.Reservations!.forEach((reservation: any) => {
        instances.push(...reservation.Instances!);
      });

      const stackInstances = instances.filter((instance: any) =>
        instance.Tags?.some((tag: any) => 
          tag.Key === 'aws:cloudformation:stack-name' && 
          tag.Value === stackName
        )
      );

      if (stackInstances.length > 0) {
        const instanceAZs = [...new Set(stackInstances.map((i: any) => i.Placement!.AvailabilityZone))];
        expect(instanceAZs.length).toBe(2);
        
        console.log(`High availability ensured across AZs: ${azs.join(', ')}`);
      }
    });

    test('should have load balancer spanning multiple AZs', async () => {
      const alb = await getLoadBalancerInfo();
      
      if (alb) {
        expect(alb.AvailabilityZones!.length).toBe(2);
        
        // Check ALB is in public subnets
        const subnetIds = alb.AvailabilityZones!.map((az: any) => az.SubnetId);
        const subnetCommand = new DescribeSubnetsCommand({ SubnetIds: subnetIds });
        const subnetResponse = await ec2Client.send(subnetCommand);
        
        subnetResponse.Subnets!.forEach((subnet: any) => {
          expect(subnet.MapPublicIpOnLaunch).toBe(true);
        });
        
        console.log(`ALB spans ${alb.AvailabilityZones!.length} AZs in public subnets`);
      }
    });
  });

  describe('Environment and Tagging Validation', () => {
    test('should have consistent environment tagging', async () => {
      // Check stack resources have proper Environment tags
      const command = new DescribeStackResourcesCommand({ StackName: stackName });
      const response = await cloudFormationClient.send(command);
      
      expect(response.StackResources!.length).toBeGreaterThan(30);
      
      // Sample a few key resources and verify their Environment tags
      const vpcCommand = new DescribeVpcsCommand({ VpcIds: [VPC_ID] });
      const vpcResponse = await ec2Client.send(vpcCommand);
      const vpc = vpcResponse.Vpcs![0];
      
      const envTag = vpc.Tags!.find((tag: any) => tag.Key === 'Environment');
      expect(envTag).toBeDefined();
      expect(envTag!.Value).toBe(stackParameters.Environment);
      
      console.log(`Resources properly tagged with Environment: ${stackParameters.Environment}`);
    });

    test('should have CloudFormation stack tags', async () => {
      const stack = await getStackInfo();
      
      // Verify stack has proper identification tags
      const nameTag = stack.Tags!.find((tag: any) => tag.Key === 'Name');
      if (nameTag) {
        expect(nameTag.Value).toContain(stackName);
      }
      
      console.log(`Stack has proper identification tags`);
    });
  });

  describe('Template Output Validation', () => {
    test('should have all required outputs', () => {
      expect(VPC_ID).toBeDefined();
      expect(PUBLIC_SUBNET_ID).toBeDefined();
      expect(LOAD_BALANCER_URL).toBeDefined();
      
      console.log(`All required outputs are available`);
    });

    test('should have properly formatted output values', () => {
      expect(VPC_ID).toMatch(/^vpc-[a-f0-9]+$/);
      expect(PUBLIC_SUBNET_ID).toMatch(/^subnet-[a-f0-9]+$/);
      const awsPattern = /^http:\/\/.*\.elb\.amazonaws\.com$/;
      const localPattern = /^http:\/\/.*\.elb\.localhost\.localstack\.cloud$/;
      expect(LOAD_BALANCER_URL).toMatch(isLocalStack ? localPattern : awsPattern);
      
      console.log(`Output values are properly formatted`);
    });
  });
});
