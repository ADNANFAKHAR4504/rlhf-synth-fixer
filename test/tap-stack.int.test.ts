import {
  DescribeInstancesCommand,
  DescribeInternetGatewaysCommand,
  DescribeSecurityGroupsCommand,
  DescribeSubnetsCommand,
  DescribeVpcsCommand,
  EC2Client
} from '@aws-sdk/client-ec2';
import fs from 'fs';

import {
  DescribeListenersCommand,
  DescribeLoadBalancersCommand,
  DescribeTargetGroupsCommand,
  DescribeTargetHealthCommand,
  ElasticLoadBalancingV2Client
} from '@aws-sdk/client-elastic-load-balancing-v2';

// Load outputs if available, otherwise skip integration tests
let outputs: any = {};
try {
  if (fs.existsSync('cfn-outputs/flat-outputs.json')) {
    outputs = JSON.parse(fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8'));
  }
} catch (error) {
  // If outputs file is missing, tests will be skipped, which is fine.
  console.warn('cfn-outputs/flat-outputs.json not found, some tests may be skipped.');
}

// Initialize AWS clients
const ec2Client = new EC2Client({ region: 'us-east-1' });
const elbClient = new ElasticLoadBalancingV2Client({ region: 'us-east-1' });

// --- Static resource names defined in the CloudFormation template ---
const vpcName = 'ProdVPC';
const subnet1Name = 'ProdPublicSubnet1';
const subnet2Name = 'ProdPublicSubnet2';
const igwName = 'ProdInternetGateway';
const albSgName = 'ProdALBSecurityGroup';
const ec2SgName = 'ProdEC2SecurityGroup';
const instance1Name = 'ProdInstance1';
const instance2Name = 'ProdInstance2';
const albName = 'ProdLoadBalancer';
const targetGroupName = 'ProdTargetGroup';

describe('CloudFormation High-Availability Web Application Integration Tests', () => {

  describe('VPC Infrastructure', () => {
    test('should have created ProdVPC with correct configuration', async () => {
      const vpcId = outputs.VpcId;
      if (!vpcId) {
        return test.skip('VPC ID not found in outputs, skipping VPC tests.');
      }

      const command = new DescribeVpcsCommand({ VpcIds: [vpcId] });
      const response = await ec2Client.send(command);
      const vpc = response.Vpcs?.[0];

      expect(vpc).toBeDefined();
      expect(vpc?.CidrBlock).toBe('10.0.0.0/16');
      expect(vpc?.State).toBe('available');
      const nameTag = vpc?.Tags?.find(tag => tag.Key === 'Name');
      expect(nameTag?.Value).toBe(vpcName);
    });

    test('should have created two public subnets in different AZs', async () => {
      const vpcId = outputs.VpcId;
      if (!vpcId) {
        return test.skip('VPC ID not found in outputs, skipping subnet tests.');
      }

      const command = new DescribeSubnetsCommand({
        Filters: [
          { Name: 'vpc-id', Values: [vpcId] },
          { Name: 'tag:Name', Values: [subnet1Name, subnet2Name] }
        ]
      });

      const response = await ec2Client.send(command);
      const subnets = response.Subnets || [];
      expect(subnets).toHaveLength(2);

      const subnet1 = subnets.find(s => s.Tags?.some(t => t.Value === subnet1Name));
      const subnet2 = subnets.find(s => s.Tags?.some(t => t.Value === subnet2Name));

      expect(subnet1).toBeDefined();
      expect(subnet2).toBeDefined();
      expect(subnet1?.AvailabilityZone).not.toBe(subnet2?.AvailabilityZone);
    });

    test('should have internet gateway attached to VPC', async () => {
      const vpcId = outputs.VpcId;
      if (!vpcId) {
        return test.skip('VPC ID not found in outputs, skipping IGW tests.');
      }

      const command = new DescribeInternetGatewaysCommand({
        Filters: [
          { Name: 'attachment.vpc-id', Values: [vpcId] },
          { Name: 'tag:Name', Values: [igwName] }
        ]
      });

      const response = await ec2Client.send(command);
      const internetGateways = response.InternetGateways || [];
      expect(internetGateways).toHaveLength(1);
    });
  });

  describe('Security Groups', () => {
    test('should have ALB security group allowing HTTP from internet', async () => {
      const vpcId = outputs.VpcId;
      if (!vpcId) {
        return test.skip('VPC ID not found, skipping security group tests.');
      }

      const command = new DescribeSecurityGroupsCommand({
        Filters: [
          { Name: 'vpc-id', Values: [vpcId] },
          { Name: 'tag:Name', Values: [albSgName] }
        ]
      });

      const response = await ec2Client.send(command);
      const securityGroups = response.SecurityGroups || [];
      expect(securityGroups).toHaveLength(1);
      const albSG = securityGroups[0];
      const httpRule = albSG.IpPermissions?.find(p => p.FromPort === 80 && p.IpRanges?.some(r => r.CidrIp === '0.0.0.0/0'));
      expect(httpRule).toBeDefined();
    });

    test('should have EC2 security group allowing HTTP only from ALB', async () => {
      const vpcId = outputs.VpcId;
      if (!vpcId) {
        return test.skip('VPC ID not found, skipping security group tests.');
      }

      const command = new DescribeSecurityGroupsCommand({
        Filters: [
          { Name: 'vpc-id', Values: [vpcId] },
          { Name: 'tag:Name', Values: [ec2SgName, albSgName] }
        ]
      });

      const response = await ec2Client.send(command);
      const securityGroups = response.SecurityGroups || [];
      const ec2SG = securityGroups.find(sg => sg.Tags?.some(t => t.Value === ec2SgName));
      const albSG = securityGroups.find(sg => sg.Tags?.some(t => t.Value === albSgName));

      expect(ec2SG).toBeDefined();
      expect(albSG).toBeDefined();

      const httpRule = ec2SG?.IpPermissions?.find(p => p.FromPort === 80 && p.UserIdGroupPairs?.some(pair => pair.GroupId === albSG?.GroupId));
      expect(httpRule).toBeDefined();
    });
  });

  describe('EC2 Instances', () => {
    test('should have created two EC2 instances with correct configuration', async () => {
      const instance1Id = outputs.EC2Instance1Id;
      const instance2Id = outputs.EC2Instance2Id;
      if (!instance1Id || !instance2Id) {
        return test.skip('EC2 Instance IDs not found, skipping EC2 tests.');
      }

      const command = new DescribeInstancesCommand({ InstanceIds: [instance1Id, instance2Id] });
      const response = await ec2Client.send(command);
      const instances = response.Reservations?.flatMap(r => r.Instances || []) || [];
      expect(instances).toHaveLength(2);

      const nameTags = instances.map(i => i.Tags?.find(t => t.Key === 'Name')?.Value);
      expect(nameTags).toContain(instance1Name);
      expect(nameTags).toContain(instance2Name);
      expect(instances[0].SubnetId).not.toBe(instances[1].SubnetId);
    });
  });

  describe('Application Load Balancer', () => {
    test('should have created internet-facing ALB with correct configuration', async () => {
      const command = new DescribeLoadBalancersCommand({ Names: [albName] });
      const response = await elbClient.send(command);
      const loadBalancers = response.LoadBalancers || [];
      expect(loadBalancers).toHaveLength(1);

      const alb = loadBalancers[0];
      expect(alb.Scheme).toBe('internet-facing');
      expect(alb.Type).toBe('application');
      expect(alb.State?.Code).toBe('active');
      expect(alb.DNSName).toBe(outputs.LoadBalancerDNSName);
    });

    test('should have target group with correct configuration', async () => {
      const command = new DescribeTargetGroupsCommand({ Names: [targetGroupName] });
      const response = await elbClient.send(command);
      const targetGroups = response.TargetGroups || [];
      expect(targetGroups).toHaveLength(1);

      const targetGroup = targetGroups[0];
      expect(targetGroup.Protocol).toBe('HTTP');
      expect(targetGroup.Port).toBe(80);
      expect(targetGroup.HealthCheckPath).toBe('/');
      expect(targetGroup.Matcher?.HttpCode).toBe('200');
    });

    test('should have listener configured for HTTP traffic', async () => {
      const lbResponse = await elbClient.send(new DescribeLoadBalancersCommand({ Names: [albName] }));
      const loadBalancerArn = lbResponse.LoadBalancers?.[0]?.LoadBalancerArn;
      if (!loadBalancerArn) {
        throw new Error('Load balancer not found to test listener.');
      }

      const listenersResponse = await elbClient.send(new DescribeListenersCommand({ LoadBalancerArn: loadBalancerArn }));
      const listeners = listenersResponse.Listeners || [];
      expect(listeners).toHaveLength(1);

      const listener = listeners[0];
      expect(listener.Protocol).toBe('HTTP');
      expect(listener.Port).toBe(80);
      expect(listener.DefaultActions?.[0]?.Type).toBe('forward');
    });

    test('should have both EC2 instances registered as targets', async () => {
      const tgResponse = await elbClient.send(new DescribeTargetGroupsCommand({ Names: [targetGroupName] }));
      const targetGroupArn = tgResponse.TargetGroups?.[0]?.TargetGroupArn;
      if (!targetGroupArn) {
        throw new Error('Target group not found to test targets.');
      }
      
      const healthResponse = await elbClient.send(new DescribeTargetHealthCommand({ TargetGroupArn: targetGroupArn }));
      const healthDescriptions = healthResponse.TargetHealthDescriptions || [];
      expect(healthDescriptions).toHaveLength(2);

      const targetIds = healthDescriptions.map(thd => thd.Target?.Id);
      expect(targetIds).toContain(outputs.EC2Instance1Id);
      expect(targetIds).toContain(outputs.EC2Instance2Id);
    });
  });

  describe('End-to-End Functionality', () => {
    test('should be able to resolve ALB DNS name', async () => {
        const albDNS = outputs.LoadBalancerDNSName;
        if (!albDNS) {
            return test.skip('ALB DNS not found, skipping DNS resolution test.');
        }

        const dns = require('dns').promises;
        await expect(dns.resolve4(albDNS)).resolves.toBeDefined();
    }, 20000); // Increased timeout for DNS propagation
  });
});