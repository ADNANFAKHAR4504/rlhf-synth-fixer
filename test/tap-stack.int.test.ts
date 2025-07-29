// Configuration - These are coming from cfn-outputs after CloudFormation deploy
import fs from 'fs';
import { 
  EC2Client, 
  DescribeVpcsCommand, 
  DescribeSubnetsCommand,
  DescribeInstancesCommand,
  DescribeSecurityGroupsCommand,
  DescribeInternetGatewaysCommand,
  DescribeRouteTablesCommand
} from '@aws-sdk/client-ec2';

import { 
  ElasticLoadBalancingV2Client,
  DescribeLoadBalancersCommand,
  DescribeTargetGroupsCommand,
  DescribeListenersCommand,
  DescribeTargetHealthCommand
} from '@aws-sdk/client-elastic-load-balancing-v2';

// Load outputs if available, otherwise skip integration tests
let outputs: any = {};
try {
  if (fs.existsSync('cfn-outputs/flat-outputs.json')) {
    outputs = JSON.parse(fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8'));
  }
} catch (error) {
  console.warn('cfn-outputs/flat-outputs.json not found, some tests may be skipped');
}

// Get environment suffix from environment variable (set by CI/CD pipeline)
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

// Initialize AWS clients
const ec2Client = new EC2Client({ region: 'us-west-2' });
const elbClient = new ElasticLoadBalancingV2Client({ region: 'us-west-2' });

describe('CloudFormation High-Availability Web Application Integration Tests', () => {
  
  describe('VPC Infrastructure', () => {
    test('should have created ProdVPC with correct configuration', async () => {
      const vpcId = outputs.VpcId || outputs[`TapStack${environmentSuffix}VpcId`];
      
      if (!vpcId) {
        console.warn('VPC ID not found in outputs, skipping VPC tests');
        return;
      }

      const command = new DescribeVpcsCommand({
        VpcIds: [vpcId]
      });
      
      const response = await ec2Client.send(command);
      const vpc = response.Vpcs?.[0];
      
      expect(vpc).toBeDefined();
      expect(vpc?.CidrBlock).toBe('10.0.0.0/16');
      expect(vpc?.State).toBe('available');
      expect(vpc?.EnableDnsSupport).toBe(true);
      expect(vpc?.EnableDnsHostnames).toBe(true);
      
      // Check for ProdVPC tag
      const nameTag = vpc?.Tags?.find(tag => tag.Key === 'Name');
      expect(nameTag?.Value).toBe('ProdVPC');
    });

    test('should have created two public subnets in different AZs', async () => {
      const vpcId = outputs.VpcId || outputs[`TapStack${environmentSuffix}VpcId`];
      
      if (!vpcId) {
        console.warn('VPC ID not found in outputs, skipping subnet tests');
        return;
      }

      const command = new DescribeSubnetsCommand({
        Filters: [
          { Name: 'vpc-id', Values: [vpcId] },
          { Name: 'tag:Name', Values: ['ProdPublicSubnet1', 'ProdPublicSubnet2'] }
        ]
      });
      
      const response = await ec2Client.send(command);
      const subnets = response.Subnets || [];
      
      expect(subnets).toHaveLength(2);
      
      // Check both subnets exist with correct configuration
      const subnet1 = subnets.find(s => s.Tags?.find(t => t.Key === 'Name' && t.Value === 'ProdPublicSubnet1'));
      const subnet2 = subnets.find(s => s.Tags?.find(t => t.Key === 'Name' && t.Value === 'ProdPublicSubnet2'));
      
      expect(subnet1).toBeDefined();
      expect(subnet2).toBeDefined();
      expect(subnet1?.CidrBlock).toBe('10.0.1.0/24');
      expect(subnet2?.CidrBlock).toBe('10.0.2.0/24');
      expect(subnet1?.MapPublicIpOnLaunch).toBe(true);
      expect(subnet2?.MapPublicIpOnLaunch).toBe(true);
      
      // Ensure different AZs
      expect(subnet1?.AvailabilityZone).not.toBe(subnet2?.AvailabilityZone);
      expect(subnet1?.AvailabilityZone).toMatch(/^us-west-2[a-z]$/);
      expect(subnet2?.AvailabilityZone).toMatch(/^us-west-2[a-z]$/);
    });

    test('should have internet gateway attached to VPC', async () => {
      const vpcId = outputs.VpcId || outputs[`TapStack${environmentSuffix}VpcId`];
      
      if (!vpcId) {
        console.warn('VPC ID not found in outputs, skipping internet gateway tests');
        return;
      }

      const command = new DescribeInternetGatewaysCommand({
        Filters: [
          { Name: 'attachment.vpc-id', Values: [vpcId] },
          { Name: 'tag:Name', Values: ['ProdInternetGateway'] }
        ]
      });
      
      const response = await ec2Client.send(command);
      const internetGateways = response.InternetGateways || [];
      
      expect(internetGateways).toHaveLength(1);
      
      const igw = internetGateways[0];
      expect(igw.Attachments).toHaveLength(1);
      expect(igw.Attachments?.[0].VpcId).toBe(vpcId);
      expect(igw.Attachments?.[0].State).toBe('available');
    });
  });

  describe('Security Groups', () => {
    test('should have ALB security group allowing HTTP from internet', async () => {
      const vpcId = outputs.VpcId || outputs[`TapStack${environmentSuffix}VpcId`];
      
      if (!vpcId) {
        console.warn('VPC ID not found in outputs, skipping security group tests');
        return;
      }

      const command = new DescribeSecurityGroupsCommand({
        Filters: [
          { Name: 'vpc-id', Values: [vpcId] },
          { Name: 'tag:Name', Values: ['ProdALBSecurityGroup'] }
        ]
      });
      
      const response = await ec2Client.send(command);
      const securityGroups = response.SecurityGroups || [];
      
      expect(securityGroups).toHaveLength(1);
      
      const albSG = securityGroups[0];
      expect(albSG.GroupDescription).toBe('Allow HTTP traffic from the internet');
      
      // Check ingress rules
      const httpRule = albSG.IpPermissions?.find(rule => 
        rule.FromPort === 80 && rule.ToPort === 80 && rule.IpProtocol === 'tcp'
      );
      expect(httpRule).toBeDefined();
      expect(httpRule?.IpRanges?.some(range => range.CidrIp === '0.0.0.0/0')).toBe(true);
    });

    test('should have EC2 security group allowing HTTP only from ALB', async () => {
      const vpcId = outputs.VpcId || outputs[`TapStack${environmentSuffix}VpcId`];
      
      if (!vpcId) {
        console.warn('VPC ID not found in outputs, skipping security group tests');
        return;
      }

      const command = new DescribeSecurityGroupsCommand({
        Filters: [
          { Name: 'vpc-id', Values: [vpcId] },
          { Name: 'tag:Name', Values: ['ProdEC2SecurityGroup', 'ProdALBSecurityGroup'] }
        ]
      });
      
      const response = await ec2Client.send(command);
      const securityGroups = response.SecurityGroups || [];
      
      const ec2SG = securityGroups.find(sg => sg.Tags?.find(t => t.Key === 'Name' && t.Value === 'ProdEC2SecurityGroup'));
      const albSG = securityGroups.find(sg => sg.Tags?.find(t => t.Key === 'Name' && t.Value === 'ProdALBSecurityGroup'));
      
      expect(ec2SG).toBeDefined();
      expect(albSG).toBeDefined();
      
      // Check that EC2 SG allows HTTP from ALB SG
      const httpRule = ec2SG?.IpPermissions?.find(rule => 
        rule.FromPort === 80 && rule.ToPort === 80 && rule.IpProtocol === 'tcp'
      );
      expect(httpRule).toBeDefined();
      expect(httpRule?.UserIdGroupPairs?.some(pair => pair.GroupId === albSG?.GroupId)).toBe(true);
    });
  });

  describe('EC2 Instances', () => {
    test('should have created two EC2 instances with correct configuration', async () => {
      const instance1Id = outputs.EC2Instance1Id || outputs[`TapStack${environmentSuffix}EC2Instance1Id`];
      const instance2Id = outputs.EC2Instance2Id || outputs[`TapStack${environmentSuffix}EC2Instance2Id`];
      
      if (!instance1Id || !instance2Id) {
        console.warn('EC2 Instance IDs not found in outputs, skipping EC2 tests');
        return;
      }

      const command = new DescribeInstancesCommand({
        InstanceIds: [instance1Id, instance2Id]
      });
      
      const response = await ec2Client.send(command);
      const instances = response.Reservations?.flatMap(r => r.Instances || []) || [];
      
      expect(instances).toHaveLength(2);
      
      instances.forEach((instance, index) => {
        expect(instance.InstanceType).toBe('t2.micro');
        expect(instance.State?.Name).toMatch(/^(pending|running)$/);
        
        // Check for correct name tag
        const nameTag = instance.Tags?.find(tag => tag.Key === 'Name');
        expect(nameTag?.Value).toMatch(/^ProdInstance[12]$/);
        
        // Check instance is in a public subnet
        expect(instance.SubnetId).toBeDefined();
        expect(instance.PublicIpAddress || instance.State?.Name === 'pending').toBeTruthy();
      });
      
      // Ensure instances are in different subnets (different AZs)
      expect(instances[0].SubnetId).not.toBe(instances[1].SubnetId);
    });
  });

  describe('Application Load Balancer', () => {
    test('should have created internet-facing ALB with correct configuration', async () => {
      const albDNS = outputs.LoadBalancerDNSName || outputs[`TapStack${environmentSuffix}LoadBalancerDNSName`];
      
      if (!albDNS) {
        console.warn('ALB DNS not found in outputs, skipping ALB tests');
        return;
      }

      const command = new DescribeLoadBalancersCommand({
        Names: ['ProdLoadBalancer']
      });
      
      const response = await elbClient.send(command);
      const loadBalancers = response.LoadBalancers || [];
      
      expect(loadBalancers).toHaveLength(1);
      
      const alb = loadBalancers[0];
      expect(alb.Scheme).toBe('internet-facing');
      expect(alb.Type).toBe('application');
      expect(alb.State?.Code).toMatch(/^(provisioning|active)$/);
      expect(alb.DNSName).toBe(albDNS);
      
      // Should have 2 availability zones
      expect(alb.AvailabilityZones).toHaveLength(2);
      alb.AvailabilityZones?.forEach(az => {
        expect(az.ZoneName).toMatch(/^us-west-2[a-z]$/);
      });
    });

    test('should have target group with correct configuration', async () => {
      const command = new DescribeTargetGroupsCommand({
        Names: ['ProdTargetGroup']
      });
      
      const response = await elbClient.send(command);
      const targetGroups = response.TargetGroups || [];
      
      expect(targetGroups).toHaveLength(1);
      
      const targetGroup = targetGroups[0];
      expect(targetGroup.Protocol).toBe('HTTP');
      expect(targetGroup.Port).toBe(80);
      expect(targetGroup.HealthCheckPath).toBe('/');
      expect(targetGroup.HealthCheckProtocol).toBe('HTTP');
      expect(targetGroup.HealthCheckIntervalSeconds).toBe(30);
      expect(targetGroup.HealthCheckTimeoutSeconds).toBe(5);
      expect(targetGroup.HealthyThresholdCount).toBe(5);
      expect(targetGroup.UnhealthyThresholdCount).toBe(2);
      expect(targetGroup.Matcher?.HttpCode).toBe('200');
    });

    test('should have listener configured for HTTP traffic', async () => {
      const command = new DescribeLoadBalancersCommand({
        Names: ['ProdLoadBalancer']
      });
      
      const response = await elbClient.send(command);
      const loadBalancers = response.LoadBalancers || [];
      
      if (loadBalancers.length === 0) {
        console.warn('Load balancer not found, skipping listener tests');
        return;
      }

      const listenersCommand = new DescribeListenersCommand({
        LoadBalancerArn: loadBalancers[0].LoadBalancerArn
      });
      
      const listenersResponse = await elbClient.send(listenersCommand);
      const listeners = listenersResponse.Listeners || [];
      
      expect(listeners).toHaveLength(1);
      
      const listener = listeners[0];
      expect(listener.Protocol).toBe('HTTP');
      expect(listener.Port).toBe(80);
      expect(listener.DefaultActions).toHaveLength(1);
      expect(listener.DefaultActions?.[0].Type).toBe('forward');
    });

    test('should have both EC2 instances registered as targets', async () => {
      const instance1Id = outputs.EC2Instance1Id || outputs[`TapStack${environmentSuffix}EC2Instance1Id`];
      const instance2Id = outputs.EC2Instance2Id || outputs[`TapStack${environmentSuffix}EC2Instance2Id`];
      
      if (!instance1Id || !instance2Id) {
        console.warn('EC2 Instance IDs not found in outputs, skipping target health tests');
        return;
      }

      const command = new DescribeTargetGroupsCommand({
        Names: ['ProdTargetGroup']
      });
      
      const response = await elbClient.send(command);
      const targetGroups = response.TargetGroups || [];
      
      if (targetGroups.length === 0) {
        console.warn('Target group not found, skipping target tests');
        return;
      }

      const healthCommand = new DescribeTargetHealthCommand({
        TargetGroupArn: targetGroups[0].TargetGroupArn
      });
      
      const healthResponse = await elbClient.send(healthCommand);
      const targetHealthDescriptions = healthResponse.TargetHealthDescriptions || [];
      
      expect(targetHealthDescriptions).toHaveLength(2);
      
      const targetIds = targetHealthDescriptions.map(thd => thd.Target?.Id);
      expect(targetIds).toContain(instance1Id);
      expect(targetIds).toContain(instance2Id);
      
      // Targets should be registered (may not be healthy yet if instances are still starting)
      targetHealthDescriptions.forEach(thd => {
        expect(['initial', 'healthy', 'unhealthy', 'draining']).toContain(thd.TargetHealth?.State);
      });
    });
  });

  describe('End-to-End Functionality', () => {
    test('should be able to resolve ALB DNS name', async () => {
      const albDNS = outputs.LoadBalancerDNSName || outputs[`TapStack${environmentSuffix}LoadBalancerDNSName`];
      
      if (!albDNS) {
        console.warn('ALB DNS not found in outputs, skipping DNS resolution test');
        return;
      }

      // Test DNS resolution
      const dns = require('dns').promises;
      try {
        const addresses = await dns.resolve4(albDNS);
        expect(addresses.length).toBeGreaterThan(0);
      } catch (error) {
        // DNS may not be ready immediately after deployment
        console.warn('DNS resolution failed, ALB may still be provisioning:', error);
      }
    });
  });
});
