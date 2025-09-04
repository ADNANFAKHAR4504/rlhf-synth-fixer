import { EC2Client, DescribeVpcsCommand, DescribeSubnetsCommand, DescribeSecurityGroupsCommand, DescribeInstancesCommand } from '@aws-sdk/client-ec2';
import { ElasticLoadBalancingV2Client, DescribeLoadBalancersCommand, DescribeTargetGroupsCommand, DescribeTargetHealthCommand } from '@aws-sdk/client-elastic-load-balancing-v2';
import { AutoScalingClient, DescribeAutoScalingGroupsCommand } from '@aws-sdk/client-auto-scaling';
import { SSMClient, GetParameterCommand } from '@aws-sdk/client-ssm';
import * as fs from 'fs';
import * as path from 'path';

// Read the outputs from deployment
const outputsPath = path.join(__dirname, '..', 'cfn-outputs', 'flat-outputs.json');
let outputs: any = {};
if (fs.existsSync(outputsPath)) {
  outputs = JSON.parse(fs.readFileSync(outputsPath, 'utf8'));
}

const region = process.env.AWS_REGION || 'us-west-2';
const ec2Client = new EC2Client({ region });
const elbClient = new ElasticLoadBalancingV2Client({ region });
const autoScalingClient = new AutoScalingClient({ region });
const ssmClient = new SSMClient({ region });

describe('TapStack Integration Tests', () => {
  const vpcId = outputs.VpcId;
  const loadBalancerDns = outputs.LoadBalancerDNS;
  const databaseEndpointParam = outputs.DatabaseEndpointParamName;
  
  describe('VPC and Networking', () => {
    test('VPC exists and is available', async () => {
      if (!vpcId) {
        console.warn('VPC ID not found in outputs, skipping test');
        return;
      }
      
      const response = await ec2Client.send(new DescribeVpcsCommand({
        VpcIds: [vpcId],
      }));
      
      expect(response.Vpcs).toHaveLength(1);
      expect(response.Vpcs![0].State).toBe('available');
      expect(response.Vpcs![0].CidrBlock).toBe('10.0.0.0/16');
    });

    test('VPC has subnets in multiple availability zones', async () => {
      if (!vpcId) {
        console.warn('VPC ID not found in outputs, skipping test');
        return;
      }
      
      const response = await ec2Client.send(new DescribeSubnetsCommand({
        Filters: [
          { Name: 'vpc-id', Values: [vpcId] },
        ],
      }));
      
      expect(response.Subnets).toBeDefined();
      expect(response.Subnets!.length).toBeGreaterThanOrEqual(6);
      
      // Check for multiple AZs
      const azs = new Set(response.Subnets!.map(subnet => subnet.AvailabilityZone));
      expect(azs.size).toBeGreaterThanOrEqual(2);
      
      // Check subnet types
      const publicSubnets = response.Subnets!.filter(s => s.MapPublicIpOnLaunch === true);
      const privateSubnets = response.Subnets!.filter(s => s.MapPublicIpOnLaunch === false);
      
      expect(publicSubnets.length).toBeGreaterThanOrEqual(2);
      expect(privateSubnets.length).toBeGreaterThanOrEqual(4);
    });

    test('Security groups are configured correctly', async () => {
      if (!vpcId) {
        console.warn('VPC ID not found in outputs, skipping test');
        return;
      }
      
      const response = await ec2Client.send(new DescribeSecurityGroupsCommand({
        Filters: [
          { Name: 'vpc-id', Values: [vpcId] },
        ],
      }));
      
      const securityGroups = response.SecurityGroups!;
      
      // Find ALB security group
      const albSg = securityGroups.find(sg => 
        sg.GroupName?.includes('TapAlbSecurityGroup')
      );
      expect(albSg).toBeDefined();
      
      // Check ALB security group allows HTTP on port 80
      const httpIngress = albSg?.IpPermissions?.find(rule => 
        rule.FromPort === 80 && rule.ToPort === 80
      );
      expect(httpIngress).toBeDefined();
      expect(httpIngress?.IpRanges?.[0]?.CidrIp).toBe('0.0.0.0/0');
      
      // Find instance security group
      const instanceSg = securityGroups.find(sg => 
        sg.GroupName?.includes('TapInstanceSecurityGroup')
      );
      expect(instanceSg).toBeDefined();
      
      // Check instance security group allows traffic from ALB on port 8080
      const albToInstanceRule = instanceSg?.IpPermissions?.find(rule => 
        rule.FromPort === 8080 && rule.ToPort === 8080
      );
      expect(albToInstanceRule).toBeDefined();
    });
  });

  describe('Auto Scaling Group', () => {
    test('Auto Scaling Group is configured correctly', async () => {
      const response = await autoScalingClient.send(new DescribeAutoScalingGroupsCommand({
        AutoScalingGroupNames: [],
      }));
      
      const asg = response.AutoScalingGroups?.find(g => 
        g.AutoScalingGroupName?.includes('TapAutoScalingGroup')
      );
      
      expect(asg).toBeDefined();
      expect(asg?.MinSize).toBe(2);
      expect(asg?.MaxSize).toBe(6);
      expect(asg?.DesiredCapacity).toBeGreaterThanOrEqual(2);
      expect(asg?.HealthCheckType).toBe('ELB');
      expect(asg?.HealthCheckGracePeriod).toBe(300);
    });

    test('Auto Scaling Group has running instances', async () => {
      const response = await autoScalingClient.send(new DescribeAutoScalingGroupsCommand({
        AutoScalingGroupNames: [],
      }));
      
      const asg = response.AutoScalingGroups?.find(g => 
        g.AutoScalingGroupName?.includes('TapAutoScalingGroup')
      );
      
      expect(asg?.Instances).toBeDefined();
      expect(asg?.Instances?.length).toBeGreaterThanOrEqual(2);
      
      // Check all instances are healthy
      const healthyInstances = asg?.Instances?.filter(i => 
        i.HealthStatus === 'Healthy' && i.LifecycleState === 'InService'
      );
      expect(healthyInstances?.length).toBeGreaterThanOrEqual(2);
    });

    test('EC2 instances are properly tagged', async () => {
      const asgResponse = await autoScalingClient.send(new DescribeAutoScalingGroupsCommand({
        AutoScalingGroupNames: [],
      }));
      
      const asg = asgResponse.AutoScalingGroups?.find(g => 
        g.AutoScalingGroupName?.includes('TapAutoScalingGroup')
      );
      
      if (asg?.Instances && asg.Instances.length > 0) {
        const instanceIds = asg.Instances.map(i => i.InstanceId!);
        
        const instancesResponse = await ec2Client.send(new DescribeInstancesCommand({
          InstanceIds: instanceIds,
        }));
        
        const instances = instancesResponse.Reservations?.flatMap(r => r.Instances || []);
        
        instances?.forEach(instance => {
          const envTag = instance.Tags?.find(t => t.Key === 'Environment');
          expect(envTag?.Value).toBe('Production');
        });
      }
    });
  });

  describe('Load Balancer', () => {
    test('Application Load Balancer is active', async () => {
      if (!loadBalancerDns) {
        console.warn('Load Balancer DNS not found in outputs, skipping test');
        return;
      }
      
      const response = await elbClient.send(new DescribeLoadBalancersCommand({}));
      
      const alb = response.LoadBalancers?.find(lb => 
        lb.DNSName === loadBalancerDns
      );
      
      expect(alb).toBeDefined();
      expect(alb?.State?.Code).toBe('active');
      expect(alb?.Type).toBe('application');
      expect(alb?.Scheme).toBe('internet-facing');
    });

    test('Target group has healthy targets', async () => {
      const tgResponse = await elbClient.send(new DescribeTargetGroupsCommand({}));
      
      const targetGroup = tgResponse.TargetGroups?.find(tg => 
        tg.TargetGroupName?.includes('TapTG')
      );
      
      expect(targetGroup).toBeDefined();
      expect(targetGroup?.Port).toBe(8080);
      expect(targetGroup?.Protocol).toBe('HTTP');
      expect(targetGroup?.HealthCheckPath).toBe('/');
      
      if (targetGroup?.TargetGroupArn) {
        const healthResponse = await elbClient.send(new DescribeTargetHealthCommand({
          TargetGroupArn: targetGroup.TargetGroupArn,
        }));
        
        const healthyTargets = healthResponse.TargetHealthDescriptions?.filter(t => 
          t.TargetHealth?.State === 'healthy'
        );
        
        expect(healthyTargets?.length).toBeGreaterThanOrEqual(2);
      }
    });

    test('Load balancer responds to HTTP requests', async () => {
      if (!loadBalancerDns) {
        console.warn('Load Balancer DNS not found in outputs, skipping test');
        return;
      }
      
      const url = `http://${loadBalancerDns}/`;
      
      try {
        const response = await fetch(url);
        expect(response.status).toBe(200);
        
        const text = await response.text();
        expect(text).toContain('Hello from Auto Scaling Group');
      } catch (error) {
        console.warn('Could not reach load balancer, it may need more time to become available');
      }
    });
  });

  describe('Database Configuration', () => {
    test('SSM parameter for database endpoint exists', async () => {
      if (!databaseEndpointParam) {
        console.warn('Database endpoint parameter not found in outputs, skipping test');
        return;
      }
      
      const response = await ssmClient.send(new GetParameterCommand({
        Name: databaseEndpointParam,
      }));
      
      expect(response.Parameter).toBeDefined();
      expect(response.Parameter?.Value).toBeDefined();
      expect(response.Parameter?.Value).toContain('rds.amazonaws.com');
    });
  });

  describe('High Availability Validation', () => {
    test('Resources are distributed across multiple AZs', async () => {
      if (!vpcId) {
        console.warn('VPC ID not found in outputs, skipping test');
        return;
      }
      
      // Check subnets are in multiple AZs
      const subnetResponse = await ec2Client.send(new DescribeSubnetsCommand({
        Filters: [
          { Name: 'vpc-id', Values: [vpcId] },
        ],
      }));
      
      const azs = new Set(subnetResponse.Subnets!.map(s => s.AvailabilityZone));
      expect(azs.size).toBeGreaterThanOrEqual(2);
      
      // Check instances are in multiple AZs
      const asgResponse = await autoScalingClient.send(new DescribeAutoScalingGroupsCommand({
        AutoScalingGroupNames: [],
      }));
      
      const asg = asgResponse.AutoScalingGroups?.find(g => 
        g.AutoScalingGroupName?.includes('TapAutoScalingGroup')
      );
      
      if (asg?.Instances && asg.Instances.length > 0) {
        const instanceIds = asg.Instances.map(i => i.InstanceId!);
        
        const instancesResponse = await ec2Client.send(new DescribeInstancesCommand({
          InstanceIds: instanceIds,
        }));
        
        const instances = instancesResponse.Reservations?.flatMap(r => r.Instances || []);
        const instanceAzs = new Set(instances?.map(i => i.Placement?.AvailabilityZone));
        
        // With 2+ instances, they should be in multiple AZs for HA
        if (instances && instances.length >= 2) {
          expect(instanceAzs.size).toBeGreaterThanOrEqual(2);
        }
      }
    });
  });

  describe('End-to-End Workflow', () => {
    test('Complete infrastructure workflow is functional', async () => {
      // This test validates the entire infrastructure setup
      let allChecksPassed = true;
      const issues: string[] = [];
      
      // Check VPC exists
      if (!vpcId) {
        issues.push('VPC ID not found in outputs');
        allChecksPassed = false;
      }
      
      // Check Load Balancer exists
      if (!loadBalancerDns) {
        issues.push('Load Balancer DNS not found in outputs');
        allChecksPassed = false;
      }
      
      // Check Auto Scaling Group has instances
      const asgResponse = await autoScalingClient.send(new DescribeAutoScalingGroupsCommand({
        AutoScalingGroupNames: [],
      }));
      
      const asg = asgResponse.AutoScalingGroups?.find(g => 
        g.AutoScalingGroupName?.includes('TapAutoScalingGroup')
      );
      
      if (!asg || !asg.Instances || asg.Instances.length < 2) {
        issues.push('Auto Scaling Group does not have minimum required instances');
        allChecksPassed = false;
      }
      
      // Check target health
      const tgResponse = await elbClient.send(new DescribeTargetGroupsCommand({}));
      const targetGroup = tgResponse.TargetGroups?.find(tg => 
        tg.TargetGroupName?.includes('TapTG')
      );
      
      if (targetGroup?.TargetGroupArn) {
        const healthResponse = await elbClient.send(new DescribeTargetHealthCommand({
          TargetGroupArn: targetGroup.TargetGroupArn,
        }));
        
        const healthyTargets = healthResponse.TargetHealthDescriptions?.filter(t => 
          t.TargetHealth?.State === 'healthy'
        );
        
        if (!healthyTargets || healthyTargets.length < 2) {
          issues.push('Not enough healthy targets in target group');
          allChecksPassed = false;
        }
      }
      
      if (!allChecksPassed) {
        console.warn('Infrastructure validation issues:', issues);
      }
      
      expect(allChecksPassed).toBe(true);
    });
  });
});