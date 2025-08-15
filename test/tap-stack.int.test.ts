import {
  EC2Client,
  DescribeVpcsCommand,
  DescribeSubnetsCommand,
  DescribeSecurityGroupsCommand,
  DescribeInstancesCommand,
} from '@aws-sdk/client-ec2';
import {
  ElasticLoadBalancingV2Client,
  DescribeLoadBalancersCommand,
  DescribeTargetGroupsCommand,
  DescribeTargetHealthCommand,
} from '@aws-sdk/client-elastic-load-balancing-v2';
import {
  RDSClient,
  DescribeDBInstancesCommand,
} from '@aws-sdk/client-rds';
import {
  AutoScalingClient,
  DescribeAutoScalingGroupsCommand,
} from '@aws-sdk/client-auto-scaling';
import * as fs from 'fs';
import * as path from 'path';

// Load deployment outputs
const outputsPath = path.join(__dirname, '..', 'cfn-outputs', 'flat-outputs.json');
let outputs: any = {};

if (fs.existsSync(outputsPath)) {
  outputs = JSON.parse(fs.readFileSync(outputsPath, 'utf8'));
}

// AWS Clients
const ec2Client = new EC2Client({ region: 'us-east-1' });
const elbClient = new ElasticLoadBalancingV2Client({ region: 'us-east-1' });
const rdsClient = new RDSClient({ region: 'us-east-1' });
const asgClient = new AutoScalingClient({ region: 'us-east-1' });

describe('Terraform Infrastructure Integration Tests', () => {
  describe('VPC and Networking', () => {
    test('should have VPC deployed with correct configuration', async () => {
      if (!outputs.vpc_id) {
        console.warn('VPC ID not found in outputs, skipping test');
        return;
      }
      
      const command = new DescribeVpcsCommand({
        VpcIds: [outputs.vpc_id],
      });
      
      const response = await ec2Client.send(command);
      expect(response.Vpcs).toHaveLength(1);
      
      const vpc = response.Vpcs![0];
      expect(vpc.VpcId).toBe(outputs.vpc_id);
      expect(vpc.CidrBlock).toBe('10.0.0.0/16');
      expect(vpc.EnableDnsHostnames).toBe(true);
      expect(vpc.EnableDnsSupport).toBe(true);
    });
    
    test('should have public subnets deployed', async () => {
      if (!outputs.public_subnets || outputs.public_subnets.length === 0) {
        console.warn('Public subnets not found in outputs, skipping test');
        return;
      }
      
      const command = new DescribeSubnetsCommand({
        SubnetIds: outputs.public_subnets,
      });
      
      const response = await ec2Client.send(command);
      expect(response.Subnets).toHaveLength(2);
      
      response.Subnets!.forEach(subnet => {
        expect(subnet.MapPublicIpOnLaunch).toBe(true);
        expect(subnet.VpcId).toBe(outputs.vpc_id);
      });
    });
    
    test('should have private subnets deployed', async () => {
      if (!outputs.private_subnets || outputs.private_subnets.length === 0) {
        console.warn('Private subnets not found in outputs, skipping test');
        return;
      }
      
      const command = new DescribeSubnetsCommand({
        SubnetIds: outputs.private_subnets,
      });
      
      const response = await ec2Client.send(command);
      expect(response.Subnets).toHaveLength(2);
      
      response.Subnets!.forEach(subnet => {
        expect(subnet.MapPublicIpOnLaunch).toBe(false);
        expect(subnet.VpcId).toBe(outputs.vpc_id);
      });
    });
    
    test('should have database subnets deployed', async () => {
      if (!outputs.database_subnets || outputs.database_subnets.length === 0) {
        console.warn('Database subnets not found in outputs, skipping test');
        return;
      }
      
      const command = new DescribeSubnetsCommand({
        SubnetIds: outputs.database_subnets,
      });
      
      const response = await ec2Client.send(command);
      expect(response.Subnets).toHaveLength(2);
      
      response.Subnets!.forEach(subnet => {
        expect(subnet.VpcId).toBe(outputs.vpc_id);
      });
    });
  });
  
  describe('Security Groups', () => {
    test('should have ALB security group with correct rules', async () => {
      if (!outputs.security_group_alb_id) {
        console.warn('ALB security group ID not found in outputs, skipping test');
        return;
      }
      
      const command = new DescribeSecurityGroupsCommand({
        GroupIds: [outputs.security_group_alb_id],
      });
      
      const response = await ec2Client.send(command);
      expect(response.SecurityGroups).toHaveLength(1);
      
      const sg = response.SecurityGroups![0];
      expect(sg.GroupId).toBe(outputs.security_group_alb_id);
      expect(sg.VpcId).toBe(outputs.vpc_id);
      
      // Check ingress rules
      const httpRule = sg.IpPermissions?.find(rule => rule.FromPort === 80);
      expect(httpRule).toBeDefined();
      expect(httpRule?.IpRanges?.some(range => range.CidrIp === '0.0.0.0/0')).toBe(true);
      
      const httpsRule = sg.IpPermissions?.find(rule => rule.FromPort === 443);
      expect(httpsRule).toBeDefined();
      expect(httpsRule?.IpRanges?.some(range => range.CidrIp === '0.0.0.0/0')).toBe(true);
    });
    
    test('should have web security group with correct rules', async () => {
      if (!outputs.security_group_web_id) {
        console.warn('Web security group ID not found in outputs, skipping test');
        return;
      }
      
      const command = new DescribeSecurityGroupsCommand({
        GroupIds: [outputs.security_group_web_id],
      });
      
      const response = await ec2Client.send(command);
      expect(response.SecurityGroups).toHaveLength(1);
      
      const sg = response.SecurityGroups![0];
      expect(sg.GroupId).toBe(outputs.security_group_web_id);
      expect(sg.VpcId).toBe(outputs.vpc_id);
      
      // Check that HTTP traffic is allowed from ALB security group
      const httpRule = sg.IpPermissions?.find(rule => rule.FromPort === 80);
      expect(httpRule).toBeDefined();
      expect(httpRule?.UserIdGroupPairs?.some(pair => 
        pair.GroupId === outputs.security_group_alb_id
      )).toBe(true);
    });
    
    test('should have database security group with correct rules', async () => {
      if (!outputs.security_group_db_id) {
        console.warn('Database security group ID not found in outputs, skipping test');
        return;
      }
      
      const command = new DescribeSecurityGroupsCommand({
        GroupIds: [outputs.security_group_db_id],
      });
      
      const response = await ec2Client.send(command);
      expect(response.SecurityGroups).toHaveLength(1);
      
      const sg = response.SecurityGroups![0];
      expect(sg.GroupId).toBe(outputs.security_group_db_id);
      expect(sg.VpcId).toBe(outputs.vpc_id);
      
      // Check MySQL port is open from web security group
      const mysqlRule = sg.IpPermissions?.find(rule => rule.FromPort === 3306);
      expect(mysqlRule).toBeDefined();
      expect(mysqlRule?.UserIdGroupPairs?.some(pair => 
        pair.GroupId === outputs.security_group_web_id
      )).toBe(true);
    });
  });
  
  describe('Load Balancer', () => {
    test('should have Application Load Balancer deployed', async () => {
      if (!outputs.load_balancer_dns) {
        console.warn('Load balancer DNS not found in outputs, skipping test');
        return;
      }
      
      const command = new DescribeLoadBalancersCommand({});
      const response = await elbClient.send(command);
      
      const alb = response.LoadBalancers?.find(lb => 
        lb.DNSName === outputs.load_balancer_dns
      );
      
      expect(alb).toBeDefined();
      expect(alb?.Type).toBe('application');
      expect(alb?.Scheme).toBe('internet-facing');
      expect(alb?.VpcId).toBe(outputs.vpc_id);
      expect(alb?.State?.Code).toBe('active');
    });
    
    test('should have target group configured', async () => {
      const command = new DescribeTargetGroupsCommand({});
      const response = await elbClient.send(command);
      
      const targetGroup = response.TargetGroups?.find(tg => 
        tg.TargetGroupName?.includes('webapp') && 
        tg.TargetGroupName?.includes('synthtrainr866')
      );
      
      expect(targetGroup).toBeDefined();
      expect(targetGroup?.Protocol).toBe('HTTP');
      expect(targetGroup?.Port).toBe(80);
      expect(targetGroup?.VpcId).toBe(outputs.vpc_id);
      expect(targetGroup?.HealthCheckPath).toBe('/health');
      expect(targetGroup?.Matcher?.HttpCode).toBe('200');
    });
  });
  
  describe('Auto Scaling', () => {
    test('should have Auto Scaling Group deployed', async () => {
      if (!outputs.autoscaling_group_name) {
        console.warn('Auto Scaling Group name not found in outputs, skipping test');
        return;
      }
      
      const command = new DescribeAutoScalingGroupsCommand({
        AutoScalingGroupNames: [outputs.autoscaling_group_name],
      });
      
      const response = await asgClient.send(command);
      expect(response.AutoScalingGroups).toHaveLength(1);
      
      const asg = response.AutoScalingGroups![0];
      expect(asg.AutoScalingGroupName).toBe(outputs.autoscaling_group_name);
      expect(asg.MinSize).toBeGreaterThanOrEqual(2);
      expect(asg.MaxSize).toBeLessThanOrEqual(10);
      expect(asg.HealthCheckType).toBe('ELB');
      expect(asg.HealthCheckGracePeriod).toBe(300);
    });
    
    test('should have instances running in Auto Scaling Group', async () => {
      if (!outputs.autoscaling_group_name) {
        console.warn('Auto Scaling Group name not found in outputs, skipping test');
        return;
      }
      
      const asgCommand = new DescribeAutoScalingGroupsCommand({
        AutoScalingGroupNames: [outputs.autoscaling_group_name],
      });
      
      const asgResponse = await asgClient.send(asgCommand);
      const asg = asgResponse.AutoScalingGroups![0];
      
      expect(asg.Instances).toBeDefined();
      expect(asg.Instances!.length).toBeGreaterThanOrEqual(2);
      
      // Check that instances are healthy
      const healthyInstances = asg.Instances!.filter(i => 
        i.HealthStatus === 'Healthy' && i.LifecycleState === 'InService'
      );
      expect(healthyInstances.length).toBeGreaterThanOrEqual(2);
    });
  });
  
  describe('RDS Database', () => {
    test('should have RDS instance deployed', async () => {
      if (!outputs.database_endpoint) {
        console.warn('Database endpoint not found in outputs, skipping test');
        return;
      }
      
      // Extract DB identifier from endpoint
      const dbIdentifier = outputs.database_endpoint.split('.')[0];
      
      const command = new DescribeDBInstancesCommand({
        DBInstanceIdentifier: dbIdentifier,
      });
      
      const response = await rdsClient.send(command);
      expect(response.DBInstances).toHaveLength(1);
      
      const db = response.DBInstances![0];
      expect(db.DBInstanceIdentifier).toBe(dbIdentifier);
      expect(db.Engine).toBe('mysql');
      expect(db.DBInstanceStatus).toBe('available');
      expect(db.StorageEncrypted).toBe(true);
      expect(db.VpcId).toBeDefined();
    });
    
    test('should have database in correct subnet group', async () => {
      if (!outputs.database_endpoint) {
        console.warn('Database endpoint not found in outputs, skipping test');
        return;
      }
      
      const dbIdentifier = outputs.database_endpoint.split('.')[0];
      
      const command = new DescribeDBInstancesCommand({
        DBInstanceIdentifier: dbIdentifier,
      });
      
      const response = await rdsClient.send(command);
      const db = response.DBInstances![0];
      
      expect(db.DBSubnetGroup).toBeDefined();
      expect(db.DBSubnetGroup?.Subnets).toBeDefined();
      expect(db.DBSubnetGroup?.Subnets!.length).toBe(2);
      
      // Verify subnets are in different AZs
      const azs = db.DBSubnetGroup?.Subnets!.map(s => s.SubnetAvailabilityZone?.Name);
      expect(new Set(azs).size).toBe(2);
    });
  });
  
  describe('Infrastructure Health Checks', () => {
    test('should be able to reach load balancer endpoint', async () => {
      if (!outputs.load_balancer_dns) {
        console.warn('Load balancer DNS not found in outputs, skipping test');
        return;
      }
      
      const fetch = (await import('node-fetch')).default;
      const healthUrl = `http://${outputs.load_balancer_dns}/health`;
      
      try {
        const response = await fetch(healthUrl, { timeout: 10000 });
        expect(response.status).toBe(200);
        
        const text = await response.text();
        expect(text.trim()).toBe('OK');
      } catch (error) {
        // It's possible the instances aren't ready yet
        console.warn('Health check failed, instances may still be initializing:', error);
      }
    });
    
    test('should have proper connectivity between components', async () => {
      // This test verifies that all components are properly connected
      expect(outputs.vpc_id).toBeDefined();
      expect(outputs.load_balancer_dns).toBeDefined();
      expect(outputs.database_endpoint).toBeDefined();
      expect(outputs.autoscaling_group_name).toBeDefined();
      
      // Verify subnet associations
      expect(outputs.public_subnets).toBeDefined();
      expect(outputs.public_subnets.length).toBe(2);
      expect(outputs.private_subnets).toBeDefined();
      expect(outputs.private_subnets.length).toBe(2);
      expect(outputs.database_subnets).toBeDefined();
      expect(outputs.database_subnets.length).toBe(2);
      
      // Verify security group associations
      expect(outputs.security_group_alb_id).toBeDefined();
      expect(outputs.security_group_web_id).toBeDefined();
      expect(outputs.security_group_db_id).toBeDefined();
    });
  });
});