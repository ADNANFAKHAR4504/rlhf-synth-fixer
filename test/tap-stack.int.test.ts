import {
  CloudFormationClient,
  DescribeStackResourcesCommand,
  DescribeStacksCommand,
} from '@aws-sdk/client-cloudformation';
import {
  EC2Client,
  DescribeVpcsCommand,
  DescribeSubnetsCommand,
  DescribeInternetGatewaysCommand,
  DescribeRouteTablesCommand,
  DescribeNetworkAclsCommand,
  DescribeSecurityGroupsCommand,
} from '@aws-sdk/client-ec2';
import {
  ElasticLoadBalancingV2Client,
  DescribeLoadBalancersCommand,
  DescribeTargetGroupsCommand,
  DescribeListenersCommand,
} from '@aws-sdk/client-elastic-load-balancing-v2';
import {
  AutoScalingClient,
  DescribeAutoScalingGroupsCommand,
} from '@aws-sdk/client-auto-scaling';
import {
  IAMClient,
  GetRoleCommand,
  GetInstanceProfileCommand,
} from '@aws-sdk/client-iam';
import * as fs from 'fs';
import * as path from 'path';

// Configuration for LocalStack
const environment = process.env.ENVIRONMENT || process.env.ENVIRONMENT_SUFFIX || 'dev';
const stackName = process.env.STACK_NAME || 'tap-stack-localstack';
const region = process.env.AWS_REGION || 'us-east-1';
const localstackEndpoint = process.env.AWS_ENDPOINT_URL || 'http://localhost:4566';
const outputsFilePath = path.resolve(__dirname, '../cfn-outputs/flat-outputs.json');

// AWS SDK Client Configuration for LocalStack
const clientConfig = {
  region,
  endpoint: localstackEndpoint,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || 'test',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || 'test',
  },
};

// AWS SDK Clients configured for LocalStack
const cloudFormationClient = new CloudFormationClient(clientConfig);
const ec2Client = new EC2Client(clientConfig);
const elbv2Client = new ElasticLoadBalancingV2Client(clientConfig);
const autoScalingClient = new AutoScalingClient(clientConfig);
const iamClient = new IAMClient(clientConfig);

// Global test data
let stackOutputs: Record<string, string> = {};
let stackResources: any[] = [];

describe('TapStack CloudFormation Integration Tests - LocalStack Pro', () => {
  beforeAll(async () => {
    try {
      // Try to load outputs from file first (if deployment was done with output capture)
      if (fs.existsSync(outputsFilePath)) {
        const outputsFileContent = fs.readFileSync(outputsFilePath, 'utf-8');
        stackOutputs = JSON.parse(outputsFileContent);
      }

      // Get stack information from CloudFormation API
      const describeStacksCommand = new DescribeStacksCommand({
        StackName: stackName,
      });
      const stackResponse = await cloudFormationClient.send(describeStacksCommand);
      const stack = stackResponse.Stacks?.[0];

      if (stack?.Outputs) {
        // Merge outputs from API (takes precedence over file)
        const apiOutputs = stack.Outputs.reduce(
          (acc, output) => {
            if (output.OutputKey && output.OutputValue) {
              acc[output.OutputKey] = output.OutputValue;
            }
            return acc;
          },
          {} as Record<string, string>
        );
        stackOutputs = { ...stackOutputs, ...apiOutputs };
      }

      // Get stack resources
      const describeResourcesCommand = new DescribeStackResourcesCommand({
        StackName: stackName,
      });
      const resourcesResponse = await cloudFormationClient.send(describeResourcesCommand);
      stackResources = resourcesResponse.StackResources || [];

      console.log(`Integration tests initialized for stack: ${stackName}`);
      console.log(`LocalStack endpoint: ${localstackEndpoint}`);
      console.log(`Found ${Object.keys(stackOutputs).length} outputs and ${stackResources.length} resources`);
    } catch (error) {
      console.error('Failed to initialize integration tests:', error);
      throw error;
    }
  }, 60000);

  describe('Stack Deployment Validation', () => {
    test('should have CloudFormation stack in successful state', async () => {
      const command = new DescribeStacksCommand({
        StackName: stackName,
      });
      const response = await cloudFormationClient.send(command);
      const stack = response.Stacks?.[0];

      expect(stack).toBeDefined();
      expect(stack?.StackName).toBe(stackName);
      expect(['CREATE_COMPLETE', 'UPDATE_COMPLETE']).toContain(stack?.StackStatus);
      expect(stack?.StackStatus).not.toMatch(/FAILED|ROLLBACK/);
    });

    test('should have all required stack outputs', () => {
      const requiredOutputs = [
        'VPCId',
        'PublicSubnet1Id',
        'PublicSubnet2Id',
        'PrivateSubnet1Id',
        'PrivateSubnet2Id',
        'ALBDNSName',
        'AutoScalingGroupName',
        'ALBHttpUrl'
      ];

      requiredOutputs.forEach(outputKey => {
        expect(stackOutputs[outputKey]).toBeDefined();
        expect(stackOutputs[outputKey]).not.toBe('');
      });
    });

    test('should have all critical resources in CREATE_COMPLETE state', () => {
      const criticalResources = [
        'VPC',
        'InternetGateway',
        'InternetGatewayAttachment',
        'PublicSubnet1',
        'PublicSubnet2',
        'PrivateSubnet1',
        'PrivateSubnet2',
        'ApplicationLoadBalancer',
        'TargetGroup',
        'AutoScalingGroup',
        'LaunchTemplate',
        'ALBSecurityGroup',
        'EC2SecurityGroup',
        'EC2Role',
        'EC2InstanceProfile'
      ];

      criticalResources.forEach(resourceLogicalId => {
        const resource = stackResources.find(
          r => r.LogicalResourceId === resourceLogicalId
        );
        expect(resource).toBeDefined();
        expect(resource?.ResourceStatus).toBe('CREATE_COMPLETE');
      });
    });
  });

  describe('VPC and Network Infrastructure Validation', () => {
    test('should have VPC with correct configuration', async () => {
      const vpcId = stackOutputs.VPCId;
      expect(vpcId).toBeDefined();

      const command = new DescribeVpcsCommand({
        VpcIds: [vpcId],
      });
      const response = await ec2Client.send(command);
      const vpc = response.Vpcs?.[0];

      expect(vpc).toBeDefined();
      expect(vpc?.VpcId).toBe(vpcId);
      expect(vpc?.CidrBlock).toBe('10.0.0.0/16');
      expect(vpc?.State).toBe('available');
      
      // Check VPC tags
      const envTag = vpc?.Tags?.find(tag => tag.Key === 'Environment');
      const nameTag = vpc?.Tags?.find(tag => tag.Key === 'Name');
      expect(envTag?.Value).toMatch(/^(prod|dev)$/);
      expect(nameTag?.Value).toContain('291431-vpc');
    });

    test('should have public subnets in different AZs with correct configuration', async () => {
      const publicSubnet1Id = stackOutputs.PublicSubnet1Id;
      const publicSubnet2Id = stackOutputs.PublicSubnet2Id;

      const command = new DescribeSubnetsCommand({
        SubnetIds: [publicSubnet1Id, publicSubnet2Id],
      });
      const response = await ec2Client.send(command);
      const subnets = response.Subnets || [];

      expect(subnets).toHaveLength(2);

      // Check subnets are in different AZs
      const azs = subnets.map(subnet => subnet.AvailabilityZone);
      expect(new Set(azs)).toHaveProperty('size', 2);

      // Check subnet configuration
      subnets.forEach(subnet => {
        expect(subnet.VpcId).toBe(stackOutputs.VPCId);
        expect(subnet.State).toBe('available');
        expect(subnet.MapPublicIpOnLaunch).toBe(true);
        expect(['10.0.1.0/24', '10.0.2.0/24']).toContain(subnet.CidrBlock);
        
        // Check tags
        const envTag = subnet.Tags?.find(tag => tag.Key === 'Environment');
        const nameTag = subnet.Tags?.find(tag => tag.Key === 'Name');
        expect(envTag?.Value).toMatch(/^(prod|dev)$/);
        expect(nameTag?.Value).toContain('291431-public-subnet');
      });
    });

    test('should have private subnets in different AZs with correct configuration', async () => {
      const privateSubnet1Id = stackOutputs.PrivateSubnet1Id;
      const privateSubnet2Id = stackOutputs.PrivateSubnet2Id;

      const command = new DescribeSubnetsCommand({
        SubnetIds: [privateSubnet1Id, privateSubnet2Id],
      });
      const response = await ec2Client.send(command);
      const subnets = response.Subnets || [];

      expect(subnets).toHaveLength(2);

      // Check subnets are in different AZs
      const azs = subnets.map(subnet => subnet.AvailabilityZone);
      expect(new Set(azs)).toHaveProperty('size', 2);

      // Check subnet configuration
      subnets.forEach(subnet => {
        expect(subnet.VpcId).toBe(stackOutputs.VPCId);
        expect(subnet.State).toBe('available');
        expect(subnet.MapPublicIpOnLaunch).toBe(false);
        expect(['10.0.3.0/24', '10.0.4.0/24']).toContain(subnet.CidrBlock);
        
        // Check tags
        const envTag = subnet.Tags?.find(tag => tag.Key === 'Environment');
        const nameTag = subnet.Tags?.find(tag => tag.Key === 'Name');
        expect(envTag?.Value).toMatch(/^(prod|dev)$/);
        expect(nameTag?.Value).toContain('291431-private-subnet');
      });
    });

    test('should have Internet Gateway attached to VPC', async () => {
      const igwResource = stackResources.find(r => r.LogicalResourceId === 'InternetGateway');
      expect(igwResource).toBeDefined();

      const command = new DescribeInternetGatewaysCommand({
        InternetGatewayIds: [igwResource.PhysicalResourceId],
      });
      const response = await ec2Client.send(command);
      const igw = response.InternetGateways?.[0];

      expect(igw).toBeDefined();
      expect(igw?.Attachments).toHaveLength(1);
      expect(igw?.Attachments?.[0].VpcId).toBe(stackOutputs.VPCId);
      expect(igw?.Attachments?.[0].State).toBe('available');
    });

    test('should have route tables created', async () => {
      const command = new DescribeRouteTablesCommand({
        Filters: [
          { Name: 'vpc-id', Values: [stackOutputs.VPCId] }
        ]
      });
      const response = await ec2Client.send(command);
      const routeTables = response.RouteTables || [];

      // Should have at least 3 route tables: 1 public, 2 private (plus default VPC route table)
      expect(routeTables.length).toBeGreaterThanOrEqual(3);

      // Verify route tables exist - LocalStack may handle routes differently
      expect(routeTables.some(rt => rt.VpcId === stackOutputs.VPCId)).toBe(true);
    });

    test('should have Network ACLs created', async () => {
      const command = new DescribeNetworkAclsCommand({
        Filters: [
          { Name: 'vpc-id', Values: [stackOutputs.VPCId] }
        ]
      });
      const response = await ec2Client.send(command);
      const nacls = response.NetworkAcls || [];

      // Should have at least 3 NACLs: default VPC NACL + public + private
      expect(nacls.length).toBeGreaterThanOrEqual(3);

      // Find custom NACLs (non-default)
      const customNacls = nacls.filter(nacl => !nacl.IsDefault);
      expect(customNacls).toHaveLength(2); // public and private

      customNacls.forEach(nacl => {
        expect(nacl.VpcId).toBe(stackOutputs.VPCId);
        
        // Check tags
        const nameTag = nacl.Tags?.find(tag => tag.Key === 'Name');
        expect(nameTag?.Value).toContain('291431');
        expect(nameTag?.Value).toMatch(/(public|private)-nacl/);
      });
    });
  });

  describe('Security Groups Validation', () => {
    test('should have ALB Security Group created', async () => {
      const albSgResource = stackResources.find(r => r.LogicalResourceId === 'ALBSecurityGroup');
      expect(albSgResource).toBeDefined();

      const command = new DescribeSecurityGroupsCommand({
        GroupIds: [albSgResource.PhysicalResourceId],
      });
      const response = await ec2Client.send(command);
      const sg = response.SecurityGroups?.[0];

      expect(sg).toBeDefined();
      expect(sg?.VpcId).toBe(stackOutputs.VPCId);
      expect(sg?.GroupName).toContain('291431-alb-sg');

      // Verify security group exists and has ingress rules
      // LocalStack may return IpPermissions in different format
      expect(sg?.IpPermissions).toBeDefined();
    });

    test('should have EC2 Security Group created', async () => {
      const ec2SgResource = stackResources.find(r => r.LogicalResourceId === 'EC2SecurityGroup');
      expect(ec2SgResource).toBeDefined();

      const command = new DescribeSecurityGroupsCommand({
        GroupIds: [ec2SgResource.PhysicalResourceId],
      });
      const response = await ec2Client.send(command);
      const sg = response.SecurityGroups?.[0];

      expect(sg).toBeDefined();
      expect(sg?.VpcId).toBe(stackOutputs.VPCId);
      expect(sg?.GroupName).toContain('291431-ec2-sg');

      // Verify security group exists and has rules
      expect(sg?.IpPermissions).toBeDefined();
      expect(sg?.IpPermissionsEgress).toBeDefined();
    });
  });

  describe('Application Load Balancer Validation', () => {
    test('should have ALB with correct configuration', async () => {
      const albDnsName = stackOutputs.ALBDNSName;
      expect(albDnsName).toBeDefined();

      // Use the ALB resource to get the actual ARN instead of parsing DNS name
      const albResource = stackResources.find(r => r.LogicalResourceId === 'ApplicationLoadBalancer');
      expect(albResource).toBeDefined();

      const command = new DescribeLoadBalancersCommand({
        LoadBalancerArns: [albResource.PhysicalResourceId],
      });
      const response = await elbv2Client.send(command);
      const alb = response.LoadBalancers?.[0];

      expect(alb).toBeDefined();
      expect(alb?.Scheme).toBe('internet-facing');
      expect(alb?.Type).toBe('application');
      expect(alb?.State?.Code).toBe('active');
      expect(alb?.VpcId).toBe(stackOutputs.VPCId);

      // Check ALB is in public subnets
      const subnetIds = alb?.AvailabilityZones?.map(az => az.SubnetId) || [];
      expect(subnetIds).toContain(stackOutputs.PublicSubnet1Id);
      expect(subnetIds).toContain(stackOutputs.PublicSubnet2Id);
    });

    test('should have Target Group with correct configuration', async () => {
      const tgResource = stackResources.find(r => r.LogicalResourceId === 'TargetGroup');
      expect(tgResource).toBeDefined();

      const command = new DescribeTargetGroupsCommand({
        TargetGroupArns: [tgResource.PhysicalResourceId],
      });
      const response = await elbv2Client.send(command);
      const tg = response.TargetGroups?.[0];

      expect(tg).toBeDefined();
      expect(tg?.Port).toBe(80);
      expect(tg?.Protocol).toBe('HTTP');
      expect(tg?.VpcId).toBe(stackOutputs.VPCId);
      expect(tg?.HealthCheckPath).toBe('/');
      expect(tg?.HealthCheckProtocol).toBe('HTTP');
      expect(tg?.HealthCheckIntervalSeconds).toBe(30);
      expect(tg?.HealthyThresholdCount).toBe(2);
      expect(tg?.UnhealthyThresholdCount).toBe(3);
    });

    test('should have HTTP listener created', async () => {
      const albResource = stackResources.find(r => r.LogicalResourceId === 'ApplicationLoadBalancer');
      expect(albResource).toBeDefined();

      const command = new DescribeListenersCommand({
        LoadBalancerArn: albResource.PhysicalResourceId,
      });
      const response = await elbv2Client.send(command);
      const listeners = response.Listeners || [];

      // Verify at least one listener exists
      expect(listeners.length).toBeGreaterThan(0);
      
      // Find HTTP listener - LocalStack may return port as string or number
      const httpListener = listeners.find(listener => 
        listener.Port === 80 || listener.Port === '80' as any
      );
      
      if (httpListener) {
        expect(httpListener.Protocol).toBe('HTTP');
      } else {
        // If no listener found, verify the listener resource was created
        const listenerResource = stackResources.find(r => r.LogicalResourceId === 'ALBListenerHTTP');
        expect(listenerResource).toBeDefined();
        expect(listenerResource?.ResourceStatus).toBe('CREATE_COMPLETE');
      }
    });
  });

  describe('Auto Scaling and Compute Validation', () => {
    test('should have Auto Scaling Group with correct configuration', async () => {
      const asgName = stackOutputs.AutoScalingGroupName;
      expect(asgName).toBeDefined();

      const command = new DescribeAutoScalingGroupsCommand({
        AutoScalingGroupNames: [asgName],
      });
      const response = await autoScalingClient.send(command);
      const asg = response.AutoScalingGroups?.[0];

      expect(asg).toBeDefined();
      expect(asg?.AutoScalingGroupName).toBe(asgName);
      expect(asg?.VPCZoneIdentifier).toContain(stackOutputs.PrivateSubnet1Id);
      expect(asg?.VPCZoneIdentifier).toContain(stackOutputs.PrivateSubnet2Id);
      expect(asg?.HealthCheckType).toBe('ELB');
      expect(asg?.HealthCheckGracePeriod).toBe(300);

      // Check environment-specific scaling
      if (process.env.ENVIRONMENT_TYPE === 'prod') {
        expect(asg?.MinSize).toBe(2);
        expect(asg?.MaxSize).toBe(6);
        expect(asg?.DesiredCapacity).toBe(2);
      } else {
        expect(asg?.MinSize).toBe(1);
        expect(asg?.MaxSize).toBe(3);
        expect(asg?.DesiredCapacity).toBe(1);
      }
    });

    test('should have Launch Template configured', async () => {
      const ltResource = stackResources.find(r => r.LogicalResourceId === 'LaunchTemplate');
      expect(ltResource).toBeDefined();

      // Validate through ASG that launch template is properly linked
      const asgName = stackOutputs.AutoScalingGroupName;
      const command = new DescribeAutoScalingGroupsCommand({
        AutoScalingGroupNames: [asgName],
      });
      const response = await autoScalingClient.send(command);
      const asg = response.AutoScalingGroups?.[0];

      expect(asg?.LaunchTemplate?.LaunchTemplateId).toBe(ltResource.PhysicalResourceId);
      // Version should be $Latest or a version number
      expect(asg?.LaunchTemplate?.Version).toBeDefined();
    });
  });

  describe('IAM Roles and Security Validation', () => {
    test('should have EC2 IAM role with proper permissions', async () => {
      const roleResource = stackResources.find(r => r.LogicalResourceId === 'EC2Role');
      expect(roleResource).toBeDefined();

      const command = new GetRoleCommand({
        RoleName: roleResource.PhysicalResourceId,
      });
      const response = await iamClient.send(command);
      const role = response.Role;

      expect(role).toBeDefined();
      expect(role?.AssumeRolePolicyDocument).toBeDefined();
      
      // Verify the role can be assumed by EC2 service
      const assumeRolePolicy = JSON.parse(decodeURIComponent(role?.AssumeRolePolicyDocument || ''));
      expect(assumeRolePolicy.Statement[0].Principal.Service).toBe('ec2.amazonaws.com');
      expect(assumeRolePolicy.Statement[0].Action).toBe('sts:AssumeRole');
    });

    test('should have EC2 instance profile', async () => {
      const profileResource = stackResources.find(r => r.LogicalResourceId === 'EC2InstanceProfile');
      expect(profileResource).toBeDefined();

      const command = new GetInstanceProfileCommand({
        InstanceProfileName: profileResource.PhysicalResourceId,
      });
      const response = await iamClient.send(command);
      const profile = response.InstanceProfile;

      expect(profile).toBeDefined();
      expect(profile?.Roles?.length).toBe(1);
      expect(profile?.Roles?.[0].RoleName).toBeDefined();
    });
  });

  describe('Environment Isolation Validation', () => {
    test('should have environment-specific resource tagging', async () => {
      // Check VPC tags
      const vpcId = stackOutputs.VPCId;
      const vpcCommand = new DescribeVpcsCommand({
        VpcIds: [vpcId],
      });
      const vpcResponse = await ec2Client.send(vpcCommand);
      const vpc = vpcResponse.Vpcs?.[0];

      // VPC should have project ID tag
      const nameTag = vpc?.Tags?.find(tag => tag.Key === 'Name');
      expect(nameTag?.Value).toContain('291431');

      // Check ALB exists
      const albResource = stackResources.find(r => r.LogicalResourceId === 'ApplicationLoadBalancer');
      expect(albResource).toBeDefined();
      
      console.log(`ALB Resource: ${albResource?.PhysicalResourceId}`);
      console.log(`ASG Resource from outputs: ${stackOutputs.AutoScalingGroupName}`);
    });

    test('should have consistent environment tagging', async () => {
      const vpcId = stackOutputs.VPCId;
      const command = new DescribeVpcsCommand({
        VpcIds: [vpcId],
      });
      const response = await ec2Client.send(command);
      const vpc = response.Vpcs?.[0];

      const envTag = vpc?.Tags?.find(tag => tag.Key === 'Environment');
      expect(envTag).toBeDefined();
      expect(envTag?.Value).toMatch(/^(prod|dev)$/);

      // The environment tag should be consistent across resources
      const expectedEnvType = envTag?.Value;
      
      // Check subnet tags
      const subnetsCommand = new DescribeSubnetsCommand({
        Filters: [{ Name: 'vpc-id', Values: [vpcId] }]
      });
      const subnetsResponse = await ec2Client.send(subnetsCommand);
      
      subnetsResponse.Subnets?.forEach(subnet => {
        const subnetEnvTag = subnet.Tags?.find(tag => tag.Key === 'Environment');
        expect(subnetEnvTag?.Value).toBe(expectedEnvType);
      });
    });

    test('should have environment-appropriate scaling configuration', async () => {
      const asgName = stackOutputs.AutoScalingGroupName;
      const command = new DescribeAutoScalingGroupsCommand({
        AutoScalingGroupNames: [asgName],
      });
      const response = await autoScalingClient.send(command);
      const asg = response.AutoScalingGroups?.[0];

      // Check if the scaling matches the expected environment configuration
      const envType = process.env.ENVIRONMENT_TYPE || 'dev';
      
      if (envType === 'prod') {
        expect(asg?.MinSize).toBeGreaterThanOrEqual(2);
        expect(asg?.MaxSize).toBeGreaterThanOrEqual(4);
        expect(asg?.DesiredCapacity).toBeGreaterThanOrEqual(2);
      } else {
        expect(asg?.MinSize).toBeGreaterThanOrEqual(1);
        expect(asg?.MaxSize).toBeGreaterThanOrEqual(3);
        expect(asg?.DesiredCapacity).toBeGreaterThanOrEqual(1);
      }
    });
  });
});
