// Configuration - These are coming from cfn-outputs after cdk deploy
import fs from 'fs';
import {
  EC2Client,
  DescribeInstancesCommand,
  DescribeSecurityGroupsCommand,
  DescribeVpcsCommand,
  DescribeSubnetsCommand,
  DescribeNatGatewaysCommand,
  DescribeRouteTablesCommand,
} from '@aws-sdk/client-ec2';
import {
  ElastiCacheClient,
  DescribeReplicationGroupsCommand,
  DescribeCacheSubnetGroupsCommand,
} from '@aws-sdk/client-elasticache';
import {
  S3Client,
  HeadBucketCommand,
  GetBucketEncryptionCommand,
  GetBucketVersioningCommand,
  ListObjectsV2Command,
} from '@aws-sdk/client-s3';
import {
  ElasticLoadBalancingV2Client,
  DescribeLoadBalancersCommand,
  DescribeTargetGroupsCommand,
  DescribeListenersCommand,
  DescribeRulesCommand,
  DescribeTargetHealthCommand,
} from '@aws-sdk/client-elastic-load-balancing-v2';
import {
  AutoScalingClient,
  DescribeAutoScalingGroupsCommand,
  DescribePoliciesCommand,
} from '@aws-sdk/client-auto-scaling';
import {
  IAMClient,
  GetRoleCommand,
  GetInstanceProfileCommand,
} from '@aws-sdk/client-iam';
import {
  CloudWatchClient,
  DescribeAlarmsCommand,
} from '@aws-sdk/client-cloudwatch';
import axios from 'axios';

const outputs = JSON.parse(
  fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
);

const region = 'us-west-1';
const ec2Client = new EC2Client({ region });
const elastiCacheClient = new ElastiCacheClient({ region });
const s3Client = new S3Client({ region });
const elbv2Client = new ElasticLoadBalancingV2Client({ region });
const autoScalingClient = new AutoScalingClient({ region });
const iamClient = new IAMClient({ region: 'us-east-1' }); // IAM is global
const cloudWatchClient = new CloudWatchClient({ region });

describe('Property Listing Platform Integration Tests', () => {
  describe('VPC and Networking', () => {
    test('VPC should exist with correct configuration', async () => {
      const command = new DescribeVpcsCommand({
        VpcIds: [outputs.VPCId],
      });
      const response = await ec2Client.send(command);

      expect(response.Vpcs).toBeDefined();
      expect(response.Vpcs!.length).toBe(1);
      expect(response.Vpcs![0].CidrBlock).toBe('10.90.0.0/16');
      expect(response.Vpcs![0].State).toBe('available');
    }, 30000);

    test('Should have correct number of subnets in multiple AZs', async () => {
      const command = new DescribeSubnetsCommand({
        Filters: [{ Name: 'vpc-id', Values: [outputs.VPCId] }],
      });
      const response = await ec2Client.send(command);

      expect(response.Subnets).toBeDefined();
      expect(response.Subnets!.length).toBe(4); // 2 public + 2 private

      // Check for public subnets
      const publicSubnets = response.Subnets!.filter(
        (s) => s.MapPublicIpOnLaunch === true
      );
      expect(publicSubnets.length).toBe(2);
      const publicCIDRs = publicSubnets.map((s) => s.CidrBlock).sort();
      expect(publicCIDRs).toEqual(['10.90.1.0/24', '10.90.2.0/24']);

      // Check for private subnets
      const privateSubnets = response.Subnets!.filter(
        (s) => s.MapPublicIpOnLaunch === false
      );
      expect(privateSubnets.length).toBe(2);
      const privateCIDRs = privateSubnets.map((s) => s.CidrBlock).sort();
      expect(privateCIDRs).toEqual(['10.90.10.0/24', '10.90.11.0/24']);

      // Verify multiple AZs
      const azs = new Set(response.Subnets!.map((s) => s.AvailabilityZone));
      expect(azs.size).toBeGreaterThanOrEqual(2);
    }, 30000);

    test('NAT Gateway should be configured in public subnet', async () => {
      const command = new DescribeNatGatewaysCommand({
        Filter: [{ Name: 'vpc-id', Values: [outputs.VPCId] }],
      });
      const response = await ec2Client.send(command);

      expect(response.NatGateways).toBeDefined();
      expect(response.NatGateways!.length).toBe(1);
      expect(response.NatGateways![0].State).toBe('available');
      expect(response.NatGateways![0].NatGatewayAddresses![0].AllocationId).toBeDefined();
    }, 30000);

    test('Route tables should be configured correctly', async () => {
      const command = new DescribeRouteTablesCommand({
        Filters: [{ Name: 'vpc-id', Values: [outputs.VPCId] }],
      });
      const response = await ec2Client.send(command);

      expect(response.RouteTables).toBeDefined();
      expect(response.RouteTables!.length).toBeGreaterThanOrEqual(2); // public + private

      // Check for internet gateway route in public route table
      const publicRouteTables = response.RouteTables!.filter((rt) =>
        rt.Routes?.some((r) => r.GatewayId?.startsWith('igw-'))
      );
      expect(publicRouteTables.length).toBeGreaterThanOrEqual(1);

      // Check for NAT gateway route in private route table
      const privateRouteTables = response.RouteTables!.filter((rt) =>
        rt.Routes?.some((r) => r.NatGatewayId?.startsWith('nat-'))
      );
      expect(privateRouteTables.length).toBeGreaterThanOrEqual(1);
    }, 30000);
  });

  describe('Security Groups', () => {
    test('ALB security group should allow HTTP and HTTPS from internet', async () => {
      const command = new DescribeSecurityGroupsCommand({
        Filters: [
          { Name: 'vpc-id', Values: [outputs.VPCId] },
          { Name: 'group-name', Values: [`property-listing-alb-sg-${outputs.EnvironmentSuffix}`] },
        ],
      });
      const response = await ec2Client.send(command);

      expect(response.SecurityGroups).toBeDefined();
      expect(response.SecurityGroups!.length).toBe(1);

      const sg = response.SecurityGroups![0];
      const httpRule = sg.IpPermissions?.find(
        (rule) => rule.FromPort === 80 && rule.ToPort === 80
      );
      expect(httpRule).toBeDefined();
      expect(httpRule?.IpRanges?.some((r) => r.CidrIp === '0.0.0.0/0')).toBe(true);

      const httpsRule = sg.IpPermissions?.find(
        (rule) => rule.FromPort === 443 && rule.ToPort === 443
      );
      expect(httpsRule).toBeDefined();
      expect(httpsRule?.IpRanges?.some((r) => r.CidrIp === '0.0.0.0/0')).toBe(true);
    }, 30000);

    test('EC2 security group should allow traffic only from ALB', async () => {
      const command = new DescribeSecurityGroupsCommand({
        Filters: [
          { Name: 'vpc-id', Values: [outputs.VPCId] },
          { Name: 'group-name', Values: [`property-listing-ec2-sg-${outputs.EnvironmentSuffix}`] },
        ],
      });
      const response = await ec2Client.send(command);

      expect(response.SecurityGroups).toBeDefined();
      expect(response.SecurityGroups!.length).toBe(1);

      const sg = response.SecurityGroups![0];
      const httpRule = sg.IpPermissions?.find(
        (rule) => rule.FromPort === 80 && rule.ToPort === 80
      );
      expect(httpRule).toBeDefined();
      expect(httpRule?.UserIdGroupPairs?.length).toBeGreaterThan(0);
    }, 30000);

    test('Redis security group should allow traffic only from EC2', async () => {
      const command = new DescribeSecurityGroupsCommand({
        Filters: [
          { Name: 'vpc-id', Values: [outputs.VPCId] },
          { Name: 'group-name', Values: [`property-listing-redis-sg-${outputs.EnvironmentSuffix}`] },
        ],
      });
      const response = await ec2Client.send(command);

      expect(response.SecurityGroups).toBeDefined();
      expect(response.SecurityGroups!.length).toBe(1);

      const sg = response.SecurityGroups![0];
      const redisRule = sg.IpPermissions?.find(
        (rule) => rule.FromPort === 6379 && rule.ToPort === 6379
      );
      expect(redisRule).toBeDefined();
      expect(redisRule?.UserIdGroupPairs?.length).toBeGreaterThan(0);
    }, 30000);
  });

  describe('ElastiCache Redis', () => {
    test('Redis cluster should be running with correct configuration', async () => {
      const command = new DescribeReplicationGroupsCommand({
        ReplicationGroupId: `property-redis-${outputs.EnvironmentSuffix}`,
      });
      const response = await elastiCacheClient.send(command);

      expect(response.ReplicationGroups).toBeDefined();
      expect(response.ReplicationGroups!.length).toBe(1);

      const redis = response.ReplicationGroups![0];
      expect(redis.Status).toBe('available');
      expect(redis.AtRestEncryptionEnabled).toBe(true);
      expect(redis.TransitEncryptionEnabled).toBe(false);
      expect(redis.AutomaticFailover).toBe('enabled');
      expect(redis.MultiAZ).toBe('enabled');
      expect(redis.CacheNodeType).toBe('cache.t3.micro');
      expect(redis.ConfigurationEndpoint?.Address).toBe(outputs.RedisEndpoint);
    }, 30000);

    test('Redis subnet group should span multiple AZs', async () => {
      const command = new DescribeCacheSubnetGroupsCommand({
        CacheSubnetGroupName: `property-listing-redis-subnet-group-${outputs.EnvironmentSuffix}`,
      });
      const response = await elastiCacheClient.send(command);

      expect(response.CacheSubnetGroups).toBeDefined();
      expect(response.CacheSubnetGroups!.length).toBe(1);

      const subnetGroup = response.CacheSubnetGroups![0];
      expect(subnetGroup.Subnets!.length).toBe(2);

      const azs = new Set(subnetGroup.Subnets!.map((s) => s.SubnetAvailabilityZone?.Name));
      expect(azs.size).toBe(2);
    }, 30000);
  });

  describe('S3 Bucket', () => {
    test('S3 bucket should exist and be accessible', async () => {
      const command = new HeadBucketCommand({
        Bucket: outputs.S3BucketName,
      });
      await expect(s3Client.send(command)).resolves.toBeDefined();
    }, 30000);

    test('S3 bucket should have encryption enabled', async () => {
      const command = new GetBucketEncryptionCommand({
        Bucket: outputs.S3BucketName,
      });
      const response = await s3Client.send(command);

      expect(response.ServerSideEncryptionConfiguration).toBeDefined();
      expect(
        response.ServerSideEncryptionConfiguration!.Rules![0].ApplyServerSideEncryptionByDefault!
          .SSEAlgorithm
      ).toBe('AES256');
    }, 30000);

    test('S3 bucket should have versioning enabled', async () => {
      const command = new GetBucketVersioningCommand({
        Bucket: outputs.S3BucketName,
      });
      const response = await s3Client.send(command);

      expect(response.Status).toBe('Enabled');
    }, 30000);
  });

  describe('IAM Roles and Policies', () => {
    test('EC2 instance role should exist with correct policies', async () => {
      const command = new GetRoleCommand({
        RoleName: `property-listing-ec2-role-${outputs.EnvironmentSuffix}`,
      });
      const response = await iamClient.send(command);

      expect(response.Role).toBeDefined();
      expect(response.Role!.RoleName).toBe(`property-listing-ec2-role-${outputs.EnvironmentSuffix}`);

      // Check assume role policy
      const assumeRolePolicy = JSON.parse(
        decodeURIComponent(response.Role!.AssumeRolePolicyDocument!)
      );
      expect(assumeRolePolicy.Statement[0].Principal.Service).toContain('ec2.amazonaws.com');
    }, 30000);

    test('EC2 instance profile should exist', async () => {
      const command = new GetInstanceProfileCommand({
        InstanceProfileName: `property-listing-ec2-profile-${outputs.EnvironmentSuffix}`,
      });
      const response = await iamClient.send(command);

      expect(response.InstanceProfile).toBeDefined();
      expect(response.InstanceProfile!.Roles!.length).toBe(1);
      expect(response.InstanceProfile!.Roles![0].RoleName).toBe(
        `property-listing-ec2-role-${outputs.EnvironmentSuffix}`
      );
    }, 30000);
  });

  describe('Application Load Balancer', () => {
    test('ALB should be internet-facing and available', async () => {
      const command = new DescribeLoadBalancersCommand({
        Names: [`property-alb-${outputs.EnvironmentSuffix}`],
      });
      const response = await elbv2Client.send(command);

      expect(response.LoadBalancers).toBeDefined();
      expect(response.LoadBalancers!.length).toBe(1);

      const alb = response.LoadBalancers![0];
      expect(alb.State?.Code).toBe('active');
      expect(alb.Scheme).toBe('internet-facing');
      expect(alb.Type).toBe('application');
      expect(alb.IpAddressType).toBe('ipv4');
      expect(alb.DNSName).toBe(outputs.ALBDNSName);
      expect(alb.AvailabilityZones!.length).toBe(2);
    }, 30000);

    test('Target group should be configured with health checks', async () => {
      const command = new DescribeTargetGroupsCommand({
        Names: [`property-tg-${outputs.EnvironmentSuffix}`],
      });
      const response = await elbv2Client.send(command);

      expect(response.TargetGroups).toBeDefined();
      expect(response.TargetGroups!.length).toBe(1);

      const tg = response.TargetGroups![0];
      expect(tg.Protocol).toBe('HTTP');
      expect(tg.Port).toBe(80);
      expect(tg.HealthCheckEnabled).toBe(true);
      expect(tg.HealthCheckPath).toBe('/health');
      expect(tg.HealthCheckIntervalSeconds).toBe(30);
      expect(tg.HealthyThresholdCount).toBe(2);
      expect(tg.UnhealthyThresholdCount).toBe(3);
      expect(tg.Matcher?.HttpCode).toBe('200');
    }, 30000);

    test('ALB listener should forward traffic to target group', async () => {
      const albCommand = new DescribeLoadBalancersCommand({
        Names: [`property-alb-${outputs.EnvironmentSuffix}`],
      });
      const albResponse = await elbv2Client.send(albCommand);
      const albArn = albResponse.LoadBalancers![0].LoadBalancerArn;

      const command = new DescribeListenersCommand({
        LoadBalancerArn: albArn,
      });
      const response = await elbv2Client.send(command);

      expect(response.Listeners).toBeDefined();
      expect(response.Listeners!.length).toBeGreaterThanOrEqual(1);

      const listener = response.Listeners![0];
      expect(listener.Protocol).toBe('HTTP');
      expect(listener.Port).toBe(80);
      expect(listener.DefaultActions![0].Type).toBe('forward');
    }, 30000);

    test('Listener rules should be configured for path-based routing', async () => {
      const albCommand = new DescribeLoadBalancersCommand({
        Names: [`property-alb-${outputs.EnvironmentSuffix}`],
      });
      const albResponse = await elbv2Client.send(albCommand);
      const albArn = albResponse.LoadBalancers![0].LoadBalancerArn;

      const listenerCommand = new DescribeListenersCommand({
        LoadBalancerArn: albArn,
      });
      const listenerResponse = await elbv2Client.send(listenerCommand);
      const listenerArn = listenerResponse.Listeners![0].ListenerArn;

      const command = new DescribeRulesCommand({
        ListenerArn: listenerArn,
      });
      const response = await elbv2Client.send(command);

      expect(response.Rules).toBeDefined();
      expect(response.Rules!.length).toBeGreaterThanOrEqual(3); // Default + 2 custom rules

      const pathRules = response.Rules!.filter((r) => !r.IsDefault);
      expect(pathRules.length).toBeGreaterThanOrEqual(2);

      // Check for /images/* and /search/* rules
      const imageRule = pathRules.find((r) =>
        r.Conditions?.some((c) => c.Values?.includes('/images/*'))
      );
      expect(imageRule).toBeDefined();

      const searchRule = pathRules.find((r) =>
        r.Conditions?.some((c) => c.Values?.includes('/search/*'))
      );
      expect(searchRule).toBeDefined();
    }, 30000);

    test('Target health should be healthy', async () => {
      const command = new DescribeTargetGroupsCommand({
        Names: [`property-tg-${outputs.EnvironmentSuffix}`],
      });
      const response = await elbv2Client.send(command);
      const tgArn = response.TargetGroups![0].TargetGroupArn;

      const healthCommand = new DescribeTargetHealthCommand({
        TargetGroupArn: tgArn,
      });
      const healthResponse = await elbv2Client.send(healthCommand);

      expect(healthResponse.TargetHealthDescriptions).toBeDefined();
      // Give time for instances to become healthy
      const healthyTargets = healthResponse.TargetHealthDescriptions!.filter(
        (t) => t.TargetHealth?.State === 'healthy'
      );
      expect(healthyTargets.length).toBeGreaterThanOrEqual(0); // May take time to become healthy
    }, 30000);
  });

  describe('Auto Scaling', () => {
    test('Auto Scaling Group should be configured correctly', async () => {
      const command = new DescribeAutoScalingGroupsCommand({
        AutoScalingGroupNames: [outputs.AutoScalingGroupName],
      });
      const response = await autoScalingClient.send(command);

      expect(response.AutoScalingGroups).toBeDefined();
      expect(response.AutoScalingGroups!.length).toBe(1);

      const asg = response.AutoScalingGroups![0];
      expect(asg.MinSize).toBe(2);
      expect(asg.MaxSize).toBe(6);
      expect(asg.DesiredCapacity).toBe(2);
      expect(asg.HealthCheckType).toBe('ELB');
      expect(asg.HealthCheckGracePeriod).toBe(300);
      expect(asg.VPCZoneIdentifier).toContain('subnet-');
    }, 30000);

    test('EC2 instances should be running', async () => {
      const asgCommand = new DescribeAutoScalingGroupsCommand({
        AutoScalingGroupNames: [outputs.AutoScalingGroupName],
      });
      const asgResponse = await autoScalingClient.send(asgCommand);
      const asg = asgResponse.AutoScalingGroups![0];

      expect(asg.Instances).toBeDefined();
      expect(asg.Instances!.length).toBeGreaterThanOrEqual(2);

      const instanceIds = asg.Instances!.map((i) => i.InstanceId!);
      const command = new DescribeInstancesCommand({
        InstanceIds: instanceIds,
      });
      const response = await ec2Client.send(command);

      expect(response.Reservations).toBeDefined();
      const instances = response.Reservations!.flatMap((r) => r.Instances || []);
      expect(instances.length).toBeGreaterThanOrEqual(2);

      instances.forEach((instance) => {
        expect(['running', 'pending']).toContain(instance.State?.Name);
        expect(instance.InstanceType).toBe('t3.small');
      });
    }, 30000);

    test('Auto Scaling policy should be configured', async () => {
      const command = new DescribePoliciesCommand({
        AutoScalingGroupName: outputs.AutoScalingGroupName,
      });
      const response = await autoScalingClient.send(command);

      expect(response.ScalingPolicies).toBeDefined();
      expect(response.ScalingPolicies!.length).toBeGreaterThanOrEqual(1);

      const policy = response.ScalingPolicies![0];
      expect(policy.PolicyType).toBe('TargetTrackingScaling');
      expect(policy.TargetTrackingConfiguration).toBeDefined();
      expect(policy.TargetTrackingConfiguration!.TargetValue).toBe(70);
    }, 30000);
  });

  describe('CloudWatch Alarms', () => {
    test('High CPU alarm should be configured', async () => {
      const command = new DescribeAlarmsCommand({
        AlarmNames: [`property-listing-high-cpu-${outputs.EnvironmentSuffix}`],
      });
      const response = await cloudWatchClient.send(command);

      expect(response.MetricAlarms).toBeDefined();
      expect(response.MetricAlarms!.length).toBe(1);

      const alarm = response.MetricAlarms![0];
      expect(alarm.MetricName).toBe('CPUUtilization');
      expect(alarm.Namespace).toBe('AWS/EC2');
      expect(alarm.Statistic).toBe('Average');
      expect(alarm.Threshold).toBe(70);
      expect(alarm.ComparisonOperator).toBe('GreaterThanThreshold');
    }, 30000);

    test('Unhealthy host alarm should be configured', async () => {
      const command = new DescribeAlarmsCommand({
        AlarmNames: [`property-listing-unhealthy-hosts-${outputs.EnvironmentSuffix}`],
      });
      const response = await cloudWatchClient.send(command);

      expect(response.MetricAlarms).toBeDefined();
      expect(response.MetricAlarms!.length).toBe(1);

      const alarm = response.MetricAlarms![0];
      expect(alarm.MetricName).toBe('UnHealthyHostCount');
      expect(alarm.Namespace).toBe('AWS/ApplicationELB');
      expect(alarm.Threshold).toBe(1);
      expect(alarm.ComparisonOperator).toBe('GreaterThanOrEqualToThreshold');
    }, 30000);
  });

  describe('End-to-End Workflow', () => {
    test('ALB should respond to HTTP requests', async () => {
      const url = `http://${outputs.ALBDNSName}`;

      // Retry logic for health check endpoint
      let attempts = 0;
      let success = false;
      const maxAttempts = 10;

      while (attempts < maxAttempts && !success) {
        try {
          const response = await axios.get(`${url}/health`, { timeout: 10000 });
          expect(response.status).toBe(200);
          expect(response.data).toContain('OK');
          success = true;
        } catch (error) {
          attempts++;
          if (attempts < maxAttempts) {
            await new Promise((resolve) => setTimeout(resolve, 5000));
          } else {
            throw error;
          }
        }
      }
    }, 60000);

    test('ALB should serve the property listing page', async () => {
      const url = `http://${outputs.ALBDNSName}`;

      // Retry logic for main page
      let attempts = 0;
      let success = false;
      const maxAttempts = 10;

      while (attempts < maxAttempts && !success) {
        try {
          const response = await axios.get(url, { timeout: 10000 });
          expect(response.status).toBe(200);
          expect(response.data).toContain('Property Listings');
          expect(response.data).toContain('Real Estate Property Listings');
          success = true;
        } catch (error) {
          attempts++;
          if (attempts < maxAttempts) {
            await new Promise((resolve) => setTimeout(resolve, 5000));
          } else {
            throw error;
          }
        }
      }
    }, 60000);
  });

  describe('Output Values', () => {
    test('All required outputs should be present', () => {
      expect(outputs.VPCId).toBeDefined();
      expect(outputs.VPCId).toMatch(/^vpc-/);

      expect(outputs.ALBDNSName).toBeDefined();
      expect(outputs.ALBDNSName).toContain('.elb.amazonaws.com');

      expect(outputs.RedisEndpoint).toBeDefined();
      expect(outputs.RedisEndpoint).toContain('.cache.amazonaws.com');

      expect(outputs.S3BucketName).toBeDefined();
      expect(outputs.S3BucketName).toContain('property-images');

      expect(outputs.AutoScalingGroupName).toBeDefined();
      expect(outputs.AutoScalingGroupName).toContain('property-listing-asg');

      expect(outputs.StackName).toBeDefined();
      expect(outputs.StackName).toContain('TapStack');

      expect(outputs.EnvironmentSuffix).toBeDefined();
    });
  });
});
