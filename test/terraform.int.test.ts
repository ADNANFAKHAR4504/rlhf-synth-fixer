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
    expect(fs.existsSync(outputsPath)).toBe(true);

    const outputsContent = fs.readFileSync(outputsPath, 'utf-8');
    outputs = JSON.parse(outputsContent);

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
      const vpcId = outputs.vpc_id.value;
      expect(vpcId).toBeTruthy();
      expect(vpcId).toMatch(/^vpc-/);

      const command = new DescribeVpcsCommand({ VpcIds: [vpcId] });
      const response = await ec2Client.send(command);

      expect(response.Vpcs).toHaveLength(1);
      expect(response.Vpcs![0].CidrBlock).toBe('10.0.0.0/16');
      expect(response.Vpcs![0].State).toBe('available');
    });

    it('Public subnets should exist in multiple AZs', async () => {
      const publicSubnetIds = outputs.public_subnet_ids.value;
      expect(publicSubnetIds).toHaveLength(2);

      const command = new DescribeSubnetsCommand({ SubnetIds: publicSubnetIds });
      const response = await ec2Client.send(command);

      expect(response.Subnets).toHaveLength(2);

      // Check different availability zones
      const azs = response.Subnets!.map(s => s.AvailabilityZone);
      expect(new Set(azs).size).toBe(2);

      // Check public subnets have map_public_ip_on_launch enabled
      response.Subnets!.forEach(subnet => {
        expect(subnet.MapPublicIpOnLaunch).toBe(true);
      });
    });

    it('Private subnets should exist in multiple AZs', async () => {
      const privateSubnetIds = outputs.private_subnet_ids.value;
      expect(privateSubnetIds).toHaveLength(2);

      const command = new DescribeSubnetsCommand({ SubnetIds: privateSubnetIds });
      const response = await ec2Client.send(command);

      expect(response.Subnets).toHaveLength(2);

      // Check different availability zones
      const azs = response.Subnets!.map(s => s.AvailabilityZone);
      expect(new Set(azs).size).toBe(2);

      // Check private subnets do not have map_public_ip_on_launch enabled
      response.Subnets!.forEach(subnet => {
        expect(subnet.MapPublicIpOnLaunch).toBe(false);
      });
    });
  });

  describe('Application Load Balancer', () => {
    it('ALB should be active and internet-facing', async () => {
      const albArn = outputs.alb_arn.value;
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
      const albDnsName = outputs.alb_dns_name.value;
      expect(albDnsName).toBeTruthy();
      expect(albDnsName).toMatch(/\.elb\.amazonaws\.com$/);
      expect(albDnsName).toContain('fintech-payment-dev-alb');
    });

    it('Target group should exist with correct configuration', async () => {
      const targetGroupArn = outputs.target_group_arn.value;
      expect(targetGroupArn).toBeTruthy();

      const command = new DescribeTargetGroupsCommand({ TargetGroupArns: [targetGroupArn] });
      const response = await elbClient.send(command);

      expect(response.TargetGroups).toHaveLength(1);
      const tg = response.TargetGroups![0];

      expect(tg.Protocol).toBe('HTTP');
      expect(tg.Port).toBe(80);
      expect(tg.TargetType).toBe('instance');
      expect(tg.VpcId).toBe(outputs.vpc_id.value);
    });
  });

  describe('RDS Database', () => {
    it('RDS instance should be available', async () => {
      const rdsInstanceId = outputs.rds_instance_id.value;
      expect(rdsInstanceId).toBeTruthy();

      const command = new DescribeDBInstancesCommand({ DBInstanceIdentifier: rdsInstanceId });
      const response = await rdsClient.send(command);

      expect(response.DBInstances).toHaveLength(1);
      const db = response.DBInstances![0];

      expect(db.DBInstanceStatus).toBe('available');
      expect(db.Engine).toBe('postgres');
      expect(db.DBInstanceClass).toBe('db.t3.micro');
      expect(db.StorageEncrypted).toBe(true);
    });

    it('RDS endpoint should be accessible format', () => {
      const rdsEndpoint = outputs.rds_endpoint.value;
      expect(rdsEndpoint).toBeTruthy();
      expect(rdsEndpoint).toMatch(/\.rds\.amazonaws\.com:5432$/);
      expect(rdsEndpoint).toContain('fintech-payment-dev-db');
    });

    it('RDS should not have deletion protection for dev environment', async () => {
      const rdsInstanceId = outputs.rds_instance_id.value;

      const command = new DescribeDBInstancesCommand({ DBInstanceIdentifier: rdsInstanceId });
      const response = await rdsClient.send(command);

      const db = response.DBInstances![0];
      expect(db.DeletionProtection).toBe(false);
    });

    it('RDS should not be multi-AZ for dev environment', async () => {
      const rdsInstanceId = outputs.rds_instance_id.value;

      const command = new DescribeDBInstancesCommand({ DBInstanceIdentifier: rdsInstanceId });
      const response = await rdsClient.send(command);

      const db = response.DBInstances![0];
      expect(db.MultiAZ).toBe(false);
    });
  });

  describe('Auto Scaling Group', () => {
    it('ASG should exist with correct configuration', async () => {
      const asgName = outputs.asg_name.value;
      expect(asgName).toBeTruthy();
      expect(asgName).toContain('fintech-payment-dev-asg');

      const command = new DescribeAutoScalingGroupsCommand({ AutoScalingGroupNames: [asgName] });
      const response = await asgClient.send(command);

      expect(response.AutoScalingGroups).toHaveLength(1);
      const asg = response.AutoScalingGroups![0];

      expect(asg.MinSize).toBeGreaterThanOrEqual(1);
      expect(asg.MaxSize).toBeGreaterThanOrEqual(asg.MinSize!);
      expect(asg.DesiredCapacity).toBeGreaterThanOrEqual(asg.MinSize!);
      expect(asg.DesiredCapacity).toBeLessThanOrEqual(asg.MaxSize!);
    });

    it('ASG should be associated with correct target group', async () => {
      const asgName = outputs.asg_name.value;
      const targetGroupArn = outputs.target_group_arn.value;

      const command = new DescribeAutoScalingGroupsCommand({ AutoScalingGroupNames: [asgName] });
      const response = await asgClient.send(command);

      const asg = response.AutoScalingGroups![0];
      expect(asg.TargetGroupARNs).toContain(targetGroupArn);
    });

    it('ASG should be in correct subnets', async () => {
      const asgName = outputs.asg_name.value;
      const publicSubnetIds = outputs.public_subnet_ids.value;

      const command = new DescribeAutoScalingGroupsCommand({ AutoScalingGroupNames: [asgName] });
      const response = await asgClient.send(command);

      const asg = response.AutoScalingGroups![0];
      const asgSubnets = asg.VPCZoneIdentifier?.split(',') || [];

      // ASG should be in public subnets
      publicSubnetIds.forEach((subnetId: string) => {
        expect(asgSubnets).toContain(subnetId);
      });
    });
  });

  describe('Resource Naming and Tags', () => {
    it('All resources should use environment suffix', () => {
      expect(outputs.asg_name.value).toMatch(/s101938$/);
      expect(outputs.alb_dns_name.value).toMatch(/s101938/);
      expect(outputs.rds_endpoint.value).toMatch(/s101938/);
    });

    it('Environment output should match workspace', () => {
      expect(outputs.environment.value).toBe('dev');
      expect(outputs.workspace.value).toBe('dev');
    });

    it('VPC CIDR should be correct for dev environment', () => {
      expect(outputs.vpc_cidr.value).toBe('10.0.0.0/16');
    });
  });

  describe('Security Configuration', () => {
    it('Security groups should exist and be properly configured', async () => {
      const vpcId = outputs.vpc_id.value;

      // Get all security groups for the VPC
      const command = new DescribeSecurityGroupsCommand({
        Filters: [{ Name: 'vpc-id', Values: [vpcId] }]
      });
      const response = await ec2Client.send(command);

      // Should have at least 4 security groups (default + ALB + ASG + DB)
      expect(response.SecurityGroups!.length).toBeGreaterThanOrEqual(4);

      // Check for ALB security group
      const albSg = response.SecurityGroups!.find(sg =>
        sg.GroupName?.includes('alb') && sg.GroupName?.includes('s101938')
      );
      expect(albSg).toBeTruthy();
      expect(albSg!.GroupName).toMatch(/fintech-payment-dev-alb-sg/);

      // Check for ASG security group
      const asgSg = response.SecurityGroups!.find(sg =>
        sg.GroupName?.includes('asg') && sg.GroupName?.includes('s101938')
      );
      expect(asgSg).toBeTruthy();
      expect(asgSg!.GroupName).toMatch(/fintech-payment-dev-asg-sg/);

      // Check for DB security group
      const dbSg = response.SecurityGroups!.find(sg =>
        sg.GroupName?.includes('db') && sg.GroupName?.includes('s101938')
      );
      expect(dbSg).toBeTruthy();
      expect(dbSg!.GroupName).toMatch(/fintech-payment-dev-db-sg/);
    });
  });

  describe('Multi-Environment Readiness', () => {
    it('Infrastructure should support workspace-based deployment', () => {
      expect(outputs.workspace.value).toBe('dev');
      expect(outputs.environment.value).toBe('dev');

      // Verify resources are named with environment
      expect(outputs.vpc_id.value).toBeTruthy();
      expect(outputs.asg_name.value).toContain('dev');
      expect(outputs.alb_dns_name.value).toContain('dev');
    });

    it('CIDR block should not overlap with other environments', () => {
      const cidr = outputs.vpc_cidr.value;
      expect(cidr).toBe('10.0.0.0/16');

      // Dev: 10.0.0.0/16, Staging: 10.1.0.0/16, Prod: 10.2.0.0/16
      expect(cidr).not.toBe('10.1.0.0/16');
      expect(cidr).not.toBe('10.2.0.0/16');
    });
  });
});
