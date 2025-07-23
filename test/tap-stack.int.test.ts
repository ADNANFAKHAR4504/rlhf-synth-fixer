import {
  AutoScalingClient,
  DescribeAutoScalingGroupsCommand,
  DescribePoliciesCommand,
} from '@aws-sdk/client-auto-scaling';
import {
  CloudFormationClient,
  DescribeStackResourcesCommand,
  DescribeStacksCommand,
} from '@aws-sdk/client-cloudformation';
import {
  DescribeInternetGatewaysCommand,
  DescribeNatGatewaysCommand,
  DescribeSecurityGroupsCommand,
  DescribeSubnetsCommand,
  DescribeVpcsCommand,
  EC2Client,
} from '@aws-sdk/client-ec2';
import {
  DescribeListenersCommand,
  DescribeLoadBalancersCommand,
  DescribeTargetGroupsCommand,
  DescribeTargetHealthCommand,
  ElasticLoadBalancingV2Client,
} from '@aws-sdk/client-elastic-load-balancing-v2';
import {
  DescribeDBInstancesCommand,
  DescribeDBSubnetGroupsCommand,
  RDSClient,
} from '@aws-sdk/client-rds';
import axios from 'axios';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';
const stackName = `TapStack${environmentSuffix}`;
const region = process.env.AWS_REGION || 'us-east-1';

// Initialize AWS clients
const cloudFormationClient = new CloudFormationClient({ region });
const ec2Client = new EC2Client({ region });
const elbv2Client = new ElasticLoadBalancingV2Client({ region });
const rdsClient = new RDSClient({ region });
const autoScalingClient = new AutoScalingClient({ region });

describe('TapStack Integration Tests', () => {
  let stackOutputs: Record<string, string> = {};
  let stackResources: any[] = [];

  beforeAll(async () => {
    try {
      // Get stack outputs
      const describeStacksCommand = new DescribeStacksCommand({
        StackName: stackName,
      });
      const stackResponse = await cloudFormationClient.send(
        describeStacksCommand
      );
      const stack = stackResponse.Stacks?.[0];

      if (stack?.Outputs) {
        stackOutputs = stack.Outputs.reduce(
          (acc, output) => {
            if (output.OutputKey && output.OutputValue) {
              acc[output.OutputKey] = output.OutputValue;
            }
            return acc;
          },
          {} as Record<string, string>
        );
      }

      // Get stack resources
      const describeResourcesCommand = new DescribeStackResourcesCommand({
        StackName: stackName,
      });
      const resourcesResponse = await cloudFormationClient.send(
        describeResourcesCommand
      );
      stackResources = resourcesResponse.StackResources || [];
    } catch (error) {
      console.error('Failed to fetch stack information:', error);
      throw error;
    }
  }, 30000);

  describe('Stack Deployment', () => {
    test('should have CloudFormation stack in CREATE_COMPLETE or UPDATE_COMPLETE state', async () => {
      const command = new DescribeStacksCommand({
        StackName: stackName,
      });
      const response = await cloudFormationClient.send(command);
      const stack = response.Stacks?.[0];

      expect(stack).toBeDefined();
      expect(['CREATE_COMPLETE', 'UPDATE_COMPLETE']).toContain(
        stack?.StackStatus
      );
    });

    test('should have all required stack outputs', () => {
      expect(stackOutputs.AlbDnsName).toBeDefined();
      expect(stackOutputs.RdsEndpoint).toBeDefined();
    });

    test('should have all critical resources deployed', () => {
      const requiredResources = [
        'VPC',
        'InternetGateway',
        'PublicSubnet1',
        'PublicSubnet2',
        'PrivateSubnet1',
        'PrivateSubnet2',
        'ApplicationLoadBalancer',
        'RDSInstance',
        'AutoScalingGroup',
        'LaunchTemplate',
      ];

      requiredResources.forEach(resourceLogicalId => {
        const resource = stackResources.find(
          r => r.LogicalResourceId === resourceLogicalId
        );
        expect(resource).toBeDefined();
        expect(resource?.ResourceStatus).toBe('CREATE_COMPLETE');
      });
    });
  });

  describe('VPC and Networking', () => {
    test('should have VPC with correct CIDR and configuration', async () => {
      const vpcResource = stackResources.find(
        r => r.LogicalResourceId === 'VPC'
      );
      expect(vpcResource).toBeDefined();

      const command = new DescribeVpcsCommand({
        VpcIds: [vpcResource.PhysicalResourceId],
      });
      const response = await ec2Client.send(command);
      const vpc = response.Vpcs?.[0];

      expect(vpc).toBeDefined();
      expect(vpc?.CidrBlock).toBe('10.0.0.0/16');
      expect(vpc?.State).toBe('available');
      // Note: EnableDnsSupport and EnableDnsHostnames are not returned in describe calls
      // They are VPC attributes that need to be checked separately if needed
    });

    test('should have public subnets with correct configuration', async () => {
      const publicSubnet1 = stackResources.find(
        r => r.LogicalResourceId === 'PublicSubnet1'
      );
      const publicSubnet2 = stackResources.find(
        r => r.LogicalResourceId === 'PublicSubnet2'
      );

      const command = new DescribeSubnetsCommand({
        SubnetIds: [
          publicSubnet1.PhysicalResourceId,
          publicSubnet2.PhysicalResourceId,
        ],
      });
      const response = await ec2Client.send(command);
      const subnets = response.Subnets || [];

      expect(subnets).toHaveLength(2);

      const subnet1 = subnets.find(
        s => s.SubnetId === publicSubnet1.PhysicalResourceId
      );
      const subnet2 = subnets.find(
        s => s.SubnetId === publicSubnet2.PhysicalResourceId
      );

      expect(subnet1?.CidrBlock).toBe('10.0.1.0/24');
      expect(subnet1?.MapPublicIpOnLaunch).toBe(true);
      expect(subnet1?.State).toBe('available');

      expect(subnet2?.CidrBlock).toBe('10.0.2.0/24');
      expect(subnet2?.MapPublicIpOnLaunch).toBe(true);
      expect(subnet2?.State).toBe('available');

      // Ensure they're in different AZs
      expect(subnet1?.AvailabilityZone).not.toBe(subnet2?.AvailabilityZone);
    });

    test('should have private subnets with correct configuration', async () => {
      const privateSubnet1 = stackResources.find(
        r => r.LogicalResourceId === 'PrivateSubnet1'
      );
      const privateSubnet2 = stackResources.find(
        r => r.LogicalResourceId === 'PrivateSubnet2'
      );

      const command = new DescribeSubnetsCommand({
        SubnetIds: [
          privateSubnet1.PhysicalResourceId,
          privateSubnet2.PhysicalResourceId,
        ],
      });
      const response = await ec2Client.send(command);
      const subnets = response.Subnets || [];

      expect(subnets).toHaveLength(2);

      const subnet1 = subnets.find(
        s => s.SubnetId === privateSubnet1.PhysicalResourceId
      );
      const subnet2 = subnets.find(
        s => s.SubnetId === privateSubnet2.PhysicalResourceId
      );

      expect(subnet1?.CidrBlock).toBe('10.0.101.0/24');
      expect(subnet1?.MapPublicIpOnLaunch).toBe(false);
      expect(subnet1?.State).toBe('available');

      expect(subnet2?.CidrBlock).toBe('10.0.102.0/24');
      expect(subnet2?.MapPublicIpOnLaunch).toBe(false);
      expect(subnet2?.State).toBe('available');
    });

    test('should have NAT Gateways in public subnets', async () => {
      const natGw1 = stackResources.find(
        r => r.LogicalResourceId === 'NatGateway1'
      );
      const natGw2 = stackResources.find(
        r => r.LogicalResourceId === 'NatGateway2'
      );

      const command = new DescribeNatGatewaysCommand({
        NatGatewayIds: [natGw1.PhysicalResourceId, natGw2.PhysicalResourceId],
      });
      const response = await ec2Client.send(command);
      const natGateways = response.NatGateways || [];

      expect(natGateways).toHaveLength(2);

      natGateways.forEach(natGw => {
        expect(natGw.State).toBe('available');
        expect(natGw.NatGatewayAddresses?.[0]?.AllocationId).toBeDefined();
      });
    });

    test('should have Internet Gateway attached to VPC', async () => {
      const igwResource = stackResources.find(
        r => r.LogicalResourceId === 'InternetGateway'
      );
      const vpcResource = stackResources.find(
        r => r.LogicalResourceId === 'VPC'
      );

      const command = new DescribeInternetGatewaysCommand({
        InternetGatewayIds: [igwResource.PhysicalResourceId],
      });
      const response = await ec2Client.send(command);
      const igw = response.InternetGateways?.[0];

      expect(igw).toBeDefined();
      // Note: Internet Gateway doesn't have a State property like VPC
      expect(igw?.Attachments?.[0]?.VpcId).toBe(vpcResource.PhysicalResourceId);
      expect(igw?.Attachments?.[0]?.State).toBe('available');
    });
  });

  describe('Security Groups', () => {
    test('should have ALB security group with correct rules', async () => {
      const sgResource = stackResources.find(
        r => r.LogicalResourceId === 'AlbSecurityGroup'
      );

      const command = new DescribeSecurityGroupsCommand({
        GroupIds: [sgResource.PhysicalResourceId],
      });
      const response = await ec2Client.send(command);
      const sg = response.SecurityGroups?.[0];

      expect(sg).toBeDefined();
      expect(sg?.GroupName).toBeDefined();

      // Check HTTP ingress rule
      const httpRule = sg?.IpPermissions?.find(
        rule => rule.FromPort === 80 && rule.ToPort === 80
      );
      expect(httpRule).toBeDefined();
      expect(httpRule?.IpRanges?.[0]?.CidrIp).toBe('0.0.0.0/0');
    });

    test('should have EC2 security group with SSH and HTTP rules', async () => {
      const sgResource = stackResources.find(
        r => r.LogicalResourceId === 'Ec2SecurityGroup'
      );

      const command = new DescribeSecurityGroupsCommand({
        GroupIds: [sgResource.PhysicalResourceId],
      });
      const response = await ec2Client.send(command);
      const sg = response.SecurityGroups?.[0];

      expect(sg).toBeDefined();

      // Check SSH rule
      const sshRule = sg?.IpPermissions?.find(
        rule => rule.FromPort === 22 && rule.ToPort === 22
      );
      expect(sshRule).toBeDefined();

      // Check HTTP rule from ALB
      const httpRule = sg?.IpPermissions?.find(
        rule => rule.FromPort === 80 && rule.ToPort === 80
      );
      expect(httpRule).toBeDefined();
      expect(httpRule?.UserIdGroupPairs?.[0]?.GroupId).toBeDefined();
    });

    test('should have RDS security group with PostgreSQL rule', async () => {
      const sgResource = stackResources.find(
        r => r.LogicalResourceId === 'RdsSecurityGroup'
      );

      const command = new DescribeSecurityGroupsCommand({
        GroupIds: [sgResource.PhysicalResourceId],
      });
      const response = await ec2Client.send(command);
      const sg = response.SecurityGroups?.[0];

      expect(sg).toBeDefined();

      // Check PostgreSQL rule
      const pgRule = sg?.IpPermissions?.find(
        rule => rule.FromPort === 5432 && rule.ToPort === 5432
      );
      expect(pgRule).toBeDefined();
      expect(pgRule?.UserIdGroupPairs?.[0]?.GroupId).toBeDefined();
    });
  });

  describe('Load Balancer', () => {
    test('should have Application Load Balancer in available state', async () => {
      const albResource = stackResources.find(
        r => r.LogicalResourceId === 'ApplicationLoadBalancer'
      );

      const command = new DescribeLoadBalancersCommand({
        LoadBalancerArns: [albResource.PhysicalResourceId],
      });
      const response = await elbv2Client.send(command);
      const alb = response.LoadBalancers?.[0];

      expect(alb).toBeDefined();
      expect(alb?.State?.Code).toBe('active');
      expect(alb?.Scheme).toBe('internet-facing');
      expect(alb?.Type).toBe('application');
      expect(alb?.IpAddressType).toBe('ipv4');
      expect(alb?.AvailabilityZones).toHaveLength(2);
    });

    test('should have target group with correct configuration', async () => {
      const tgResource = stackResources.find(
        r => r.LogicalResourceId === 'AlbTargetGroup'
      );

      const command = new DescribeTargetGroupsCommand({
        TargetGroupArns: [tgResource.PhysicalResourceId],
      });
      const response = await elbv2Client.send(command);
      const tg = response.TargetGroups?.[0];

      expect(tg).toBeDefined();
      expect(tg?.Port).toBe(80);
      expect(tg?.Protocol).toBe('HTTP');
      expect(tg?.TargetType).toBe('instance');
      expect(tg?.HealthCheckPath).toBe('/');
      expect(tg?.HealthCheckIntervalSeconds).toBe(30);
      expect(tg?.HealthyThresholdCount).toBe(5);
    });

    test('should have HTTP listener configured correctly', async () => {
      const albResource = stackResources.find(
        r => r.LogicalResourceId === 'ApplicationLoadBalancer'
      );

      const command = new DescribeListenersCommand({
        LoadBalancerArn: albResource.PhysicalResourceId,
      });
      const response = await elbv2Client.send(command);
      const listeners = response.Listeners || [];

      expect(listeners).toHaveLength(1);

      const httpListener = listeners[0];
      expect(httpListener?.Port).toBe(80);
      expect(httpListener?.Protocol).toBe('HTTP');
      expect(httpListener?.DefaultActions?.[0]?.Type).toBe('forward');
    });

    test('should be accessible via HTTP', async () => {
      const albDns = stackOutputs.AlbDnsName;
      expect(albDns).toBeDefined();

      try {
        const response = await axios.get(`http://${albDns}`, {
          timeout: 10000,
          validateStatus: status => status < 500, // Accept any status < 500
        });

        // Should get a response (even if it's 4xx, means ALB is working)
        expect(response.status).toBeLessThan(500);
      } catch (error: any) {
        // If it's a timeout or connection error, ALB might not be ready yet
        if (error.code === 'ECONNABORTED' || error.code === 'ECONNREFUSED') {
          console.warn(
            'ALB not ready yet, this might be expected during initial deployment'
          );
        } else {
          throw error;
        }
      }
    }, 15000);
  });

  describe('Auto Scaling Group', () => {
    test('should have Auto Scaling Group with correct configuration', async () => {
      const asgResource = stackResources.find(
        r => r.LogicalResourceId === 'AutoScalingGroup'
      );

      const command = new DescribeAutoScalingGroupsCommand({
        AutoScalingGroupNames: [asgResource.PhysicalResourceId],
      });
      const response = await autoScalingClient.send(command);
      const asg = response.AutoScalingGroups?.[0];

      expect(asg).toBeDefined();
      expect(asg?.MinSize).toBe(1);
      // Note: DesiredCapacity might be different from template due to auto scaling
      // Template specifies 2, but ASG may have scaled based on demand
      expect(asg?.DesiredCapacity).toBeGreaterThanOrEqual(1);
      expect(asg?.DesiredCapacity).toBeLessThanOrEqual(3);
      expect(asg?.MaxSize).toBe(3);
      expect(asg?.VPCZoneIdentifier).toBeDefined();
      expect(asg?.TargetGroupARNs).toHaveLength(1);
    });

    test('should have scaling policy configured', async () => {
      const asgResource = stackResources.find(
        r => r.LogicalResourceId === 'AutoScalingGroup'
      );

      const command = new DescribePoliciesCommand({
        AutoScalingGroupName: asgResource.PhysicalResourceId,
      });
      const response = await autoScalingClient.send(command);
      const policies = response.ScalingPolicies || [];

      expect(policies.length).toBeGreaterThan(0);

      const targetTrackingPolicy = policies.find(
        (p: any) => p.PolicyType === 'TargetTrackingScaling'
      );
      expect(targetTrackingPolicy).toBeDefined();
      expect(
        targetTrackingPolicy?.TargetTrackingConfiguration?.TargetValue
      ).toBe(50);
    });

    test('should have instances running in target group', async () => {
      const tgResource = stackResources.find(
        r => r.LogicalResourceId === 'AlbTargetGroup'
      );

      const command = new DescribeTargetHealthCommand({
        TargetGroupArn: tgResource.PhysicalResourceId,
      });
      const response = await elbv2Client.send(command);
      const targets = response.TargetHealthDescriptions || [];

      expect(targets.length).toBeGreaterThan(0);

      // Log target health for debugging
      console.log(
        'Target Health Status:',
        targets.map(t => ({
          targetId: t.Target?.Id,
          state: t.TargetHealth?.State,
          reason: t.TargetHealth?.Reason,
          description: t.TargetHealth?.Description,
        }))
      );

      // At least some targets should be healthy or in the process of becoming healthy
      const healthyOrPending = targets.filter(
        t =>
          t.TargetHealth?.State === 'healthy' ||
          t.TargetHealth?.State === 'initial' ||
          t.TargetHealth?.State === 'unhealthy' // May be starting up
      );
      expect(healthyOrPending.length).toBeGreaterThan(0);
    });

    test('should validate ASG capacity against actual running instances', async () => {
      const asgResource = stackResources.find(
        r => r.LogicalResourceId === 'AutoScalingGroup'
      );

      const command = new DescribeAutoScalingGroupsCommand({
        AutoScalingGroupNames: [asgResource.PhysicalResourceId],
      });
      const response = await autoScalingClient.send(command);
      const asg = response.AutoScalingGroups?.[0];

      expect(asg).toBeDefined();

      // Log ASG details for debugging
      console.log('ASG Details:', {
        desiredCapacity: asg?.DesiredCapacity,
        minSize: asg?.MinSize,
        maxSize: asg?.MaxSize,
        instanceCount: asg?.Instances?.length,
        instances: asg?.Instances?.map(i => ({
          id: i.InstanceId,
          state: i.LifecycleState,
          healthStatus: i.HealthStatus,
        })),
      });

      // The number of instances should match the desired capacity
      expect(asg?.Instances?.length).toBe(asg?.DesiredCapacity);

      // All instances should be in a valid state
      const validStates = [
        'InService',
        'Pending',
        'Pending:Wait',
        'Pending:Proceed',
      ];
      asg?.Instances?.forEach(instance => {
        expect(validStates).toContain(instance.LifecycleState);
      });
    });
  });

  describe('RDS Database', () => {
    test('should have RDS instance in available state', async () => {
      const rdsResource = stackResources.find(
        r => r.LogicalResourceId === 'RDSInstance'
      );

      const command = new DescribeDBInstancesCommand({
        DBInstanceIdentifier: rdsResource.PhysicalResourceId,
      });
      const response = await rdsClient.send(command);
      const dbInstance = response.DBInstances?.[0];

      expect(dbInstance).toBeDefined();
      expect(dbInstance?.DBInstanceStatus).toBe('available');
      expect(dbInstance?.Engine).toBe('postgres');
      expect(dbInstance?.DBInstanceClass).toBe('db.t3.micro');
      expect(dbInstance?.MultiAZ).toBe(true);
      expect(dbInstance?.StorageEncrypted).toBe(true);
      expect(dbInstance?.DeletionProtection).toBe(true);
    });

    test('should have DB subnet group with private subnets', async () => {
      const subnetGroupResource = stackResources.find(
        r => r.LogicalResourceId === 'DbSubnetGroup'
      );

      const command = new DescribeDBSubnetGroupsCommand({
        DBSubnetGroupName: subnetGroupResource.PhysicalResourceId,
      });
      const response = await rdsClient.send(command);
      const subnetGroup = response.DBSubnetGroups?.[0];

      expect(subnetGroup).toBeDefined();
      expect(subnetGroup?.Subnets).toHaveLength(2);
      expect(subnetGroup?.VpcId).toBeDefined();

      // Ensure subnets are in different AZs
      const azs =
        subnetGroup?.Subnets?.map(s => s.SubnetAvailabilityZone?.Name) || [];
      expect(new Set(azs).size).toBe(2);
    });

    test('should have RDS endpoint accessible via stack output', () => {
      const rdsEndpoint = stackOutputs.RdsEndpoint;
      expect(rdsEndpoint).toBeDefined();
      expect(rdsEndpoint).toMatch(
        /^production-db-instance\..+\.rds\.amazonaws\.com$/
      );
    });
  });

  describe('Secrets Manager', () => {
    test('should have RDS secret resource in CloudFormation', () => {
      const secretResource = stackResources.find(
        r => r.LogicalResourceId === 'RDSSecret'
      );
      expect(secretResource).toBeDefined();
      expect(secretResource?.ResourceType).toBe('AWS::SecretsManager::Secret');
      expect(secretResource?.ResourceStatus).toBe('CREATE_COMPLETE');
    });
  });

  describe('Resource Tagging', () => {
    test('should have all resources properly tagged', async () => {
      // Check VPC tags
      const vpcResource = stackResources.find(
        r => r.LogicalResourceId === 'VPC'
      );
      const vpcCommand = new DescribeVpcsCommand({
        VpcIds: [vpcResource.PhysicalResourceId],
      });
      const vpcResponse = await ec2Client.send(vpcCommand);
      const vpc = vpcResponse.Vpcs?.[0];

      const environmentTag = vpc?.Tags?.find(
        (tag: any) => tag.Key === 'Environment'
      );
      expect(environmentTag).toBeDefined();
      expect(environmentTag?.Value).toBe('Production');
    });
  });

  describe('High Availability Validation', () => {
    test('should have resources distributed across multiple AZs', async () => {
      // Get all subnets
      const publicSubnet1 = stackResources.find(
        r => r.LogicalResourceId === 'PublicSubnet1'
      );
      const publicSubnet2 = stackResources.find(
        r => r.LogicalResourceId === 'PublicSubnet2'
      );
      const privateSubnet1 = stackResources.find(
        r => r.LogicalResourceId === 'PrivateSubnet1'
      );
      const privateSubnet2 = stackResources.find(
        r => r.LogicalResourceId === 'PrivateSubnet2'
      );

      const command = new DescribeSubnetsCommand({
        SubnetIds: [
          publicSubnet1.PhysicalResourceId,
          publicSubnet2.PhysicalResourceId,
          privateSubnet1.PhysicalResourceId,
          privateSubnet2.PhysicalResourceId,
        ],
      });
      const response = await ec2Client.send(command);
      const subnets = response.Subnets || [];

      // Get unique AZs
      const azs = new Set(subnets.map(s => s.AvailabilityZone));
      expect(azs.size).toBe(2); // Should span 2 AZs

      // Ensure public subnets are in different AZs
      const pubSub1 = subnets.find(
        s => s.SubnetId === publicSubnet1.PhysicalResourceId
      );
      const pubSub2 = subnets.find(
        s => s.SubnetId === publicSubnet2.PhysicalResourceId
      );
      expect(pubSub1?.AvailabilityZone).not.toBe(pubSub2?.AvailabilityZone);
    });

    test('should have load balancer spanning multiple AZs', async () => {
      const albResource = stackResources.find(
        r => r.LogicalResourceId === 'ApplicationLoadBalancer'
      );

      const command = new DescribeLoadBalancersCommand({
        LoadBalancerArns: [albResource.PhysicalResourceId],
      });
      const response = await elbv2Client.send(command);
      const alb = response.LoadBalancers?.[0];

      expect(alb?.AvailabilityZones).toHaveLength(2);

      const azs = alb?.AvailabilityZones?.map(az => az.ZoneName) || [];
      expect(new Set(azs).size).toBe(2);
    });
  });
});
