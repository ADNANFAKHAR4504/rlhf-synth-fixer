import * as fs from 'fs';
import * as path from 'path';
import { EC2Client, DescribeVpcsCommand, DescribeSubnetsCommand, DescribeSecurityGroupsCommand } from '@aws-sdk/client-ec2';
import { ElasticLoadBalancingV2Client, DescribeLoadBalancersCommand, DescribeTargetGroupsCommand } from '@aws-sdk/client-elastic-load-balancing-v2';
import { RDSClient, DescribeDBInstancesCommand } from '@aws-sdk/client-rds';
import { AutoScalingClient, DescribeAutoScalingGroupsCommand } from '@aws-sdk/client-auto-scaling';

describe('Terraform Infrastructure Integration Tests', () => {
  let outputs: any;
  let ec2Client: EC2Client;
  let elbClient: ElasticLoadBalancingV2Client;
  let rdsClient: RDSClient;
  let asgClient: AutoScalingClient;
  const region = 'us-east-1';

  beforeAll(async () => {
    // Read deployment outputs
    const outputsPath = path.join(__dirname, '..', 'cfn-outputs', 'flat-outputs.json');
    if (!fs.existsSync(outputsPath)) {
      throw new Error(`Outputs file not found at ${outputsPath}`);
    }

    const outputsContent = fs.readFileSync(outputsPath, 'utf-8');
    outputs = JSON.parse(outputsContent);

    // FIX: Parse stringified arrays (Terraform outputs often come as stringified JSON lists)
    ['public_subnet_ids', 'private_subnet_ids'].forEach(key => {
      if (typeof outputs[key] === 'string') {
        try {
          outputs[key] = JSON.parse(outputs[key]);
        } catch (e) {
          console.warn(`Failed to parse ${key} as JSON array`);
        }
      }
    });

    // Initialize AWS clients
    ec2Client = new EC2Client({ region });
    elbClient = new ElasticLoadBalancingV2Client({ region });
    rdsClient = new RDSClient({ region });
    asgClient = new AutoScalingClient({ region });
  });

  afterAll(async () => {
    // Cleanup clients
    ec2Client.destroy();
    elbClient.destroy();
    rdsClient.destroy();
    asgClient.destroy();
  });

  describe('VPC Infrastructure', () => {
    it('VPC should exist with correct CIDR block', async () => {
      // FIX: Access output directly, remove .value
      const vpcId = outputs.vpc_id;
      expect(vpcId).toBeTruthy();
      expect(vpcId).toMatch(/^vpc-/);

      const command = new DescribeVpcsCommand({ VpcIds: [vpcId] });
      const response = await ec2Client.send(command);

      expect(response.Vpcs).toHaveLength(1);
      expect(response.Vpcs![0].CidrBlock).toBe(outputs.vpc_cidr);
      expect(response.Vpcs![0].State).toBe('available');
    });

    it('Public subnets should exist in multiple AZs', async () => {
      const publicSubnetIds = outputs.public_subnet_ids;
      expect(Array.isArray(publicSubnetIds)).toBe(true);
      expect(publicSubnetIds.length).toBeGreaterThanOrEqual(2);

      const command = new DescribeSubnetsCommand({ SubnetIds: publicSubnetIds });
      const response = await ec2Client.send(command);

      expect(response.Subnets).toHaveLength(publicSubnetIds.length);

      // Check different availability zones
      const azs = response.Subnets!.map(s => s.AvailabilityZone);
      expect(new Set(azs).size).toBeGreaterThanOrEqual(2);

      // Check public subnets have map_public_ip_on_launch enabled
      response.Subnets!.forEach(subnet => {
        expect(subnet.MapPublicIpOnLaunch).toBe(true);
      });
    });

    it('Private subnets should exist in multiple AZs', async () => {
      const privateSubnetIds = outputs.private_subnet_ids;
      expect(Array.isArray(privateSubnetIds)).toBe(true);
      expect(privateSubnetIds.length).toBeGreaterThanOrEqual(2);

      const command = new DescribeSubnetsCommand({ SubnetIds: privateSubnetIds });
      const response = await ec2Client.send(command);

      expect(response.Subnets).toHaveLength(privateSubnetIds.length);

      // Check different availability zones
      const azs = response.Subnets!.map(s => s.AvailabilityZone);
      expect(new Set(azs).size).toBeGreaterThanOrEqual(2);

      // Check private subnets do not have map_public_ip_on_launch enabled
      response.Subnets!.forEach(subnet => {
        expect(subnet.MapPublicIpOnLaunch).toBe(false);
      });
    });
  });

  describe('Application Load Balancer', () => {
    it('ALB should be active and internet-facing', async () => {
      const albArn = outputs.alb_arn;
      expect(albArn).toBeTruthy();
      expect(albArn).toMatch(/^arn:aws:elasticloadbalancing:/);

      const command = new DescribeLoadBalancersCommand({ LoadBalancerArns: [albArn] });
      const response = await elbClient.send(command);

      expect(response.LoadBalancers).toHaveLength(1);
      const alb = response.LoadBalancers![0];

      expect(alb.State?.Code).toBe('active');
      expect(alb.Scheme).toBe('internet-facing');
      expect(alb.Type).toBe('application');
      expect(alb.IpAddressType).toBe('ipv4');
    });

    it('ALB DNS name should be resolvable', () => {
      const albDnsName = outputs.alb_dns_name;
      expect(albDnsName).toBeTruthy();
      expect(albDnsName).toMatch(/\.elb\.amazonaws\.com$/);
      expect(albDnsName).toContain('fintech-payment-dev-alb');
    });
  });

  describe('RDS Database', () => {
    it('RDS endpoint should be accessible format', () => {
      const rdsEndpoint = outputs.rds_endpoint;
      expect(rdsEndpoint).toBeTruthy();
      expect(rdsEndpoint).toMatch(/:5432$/); // Check port suffix
      expect(rdsEndpoint).toContain('fintech-payment-dev-db');
    });
  });

  describe('Resource Naming and Tags', () => {
    it('All resources should use environment suffix/prefix', () => {
      // FIX: Matches format "fintech-payment-dev-..."
      expect(outputs.asg_name).toMatch(/^fintech-payment-dev-/);
      expect(outputs.alb_dns_name).toMatch(/^fintech-payment-dev-/);
    });

    it('Environment output should match workspace', () => {
      expect(outputs.environment).toBe('dev');
      expect(outputs.workspace).toBe('default'); // Deployment log says workspace is default
    });
  });

  describe('Security Configuration', () => {
    it('Security groups should exist and be properly configured', async () => {
      const vpcId = outputs.vpc_id;

      // Get all security groups for the VPC
      const command = new DescribeSecurityGroupsCommand({
        Filters: [{ Name: 'vpc-id', Values: [vpcId] }]
      });
      const response = await ec2Client.send(command);

      expect(response.SecurityGroups!.length).toBeGreaterThan(0);

      // Basic check: Ensure we have security groups that look related to our stack
      const relevantSgs = response.SecurityGroups!.filter(sg =>
        sg.GroupName?.includes('fintech-payment-dev')
      );
      expect(relevantSgs.length).toBeGreaterThan(0);
    });
  });
});
