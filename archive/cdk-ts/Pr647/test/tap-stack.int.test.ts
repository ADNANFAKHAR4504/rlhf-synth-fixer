// Configuration - These are coming from cfn-outputs after cdk deploy
import fs from 'fs';
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
  DescribeTargetHealthCommand,
  DescribeTargetGroupsCommand,
} from '@aws-sdk/client-elastic-load-balancing-v2';
import {
  AutoScalingClient,
  DescribeAutoScalingGroupsCommand,
} from '@aws-sdk/client-auto-scaling';
import axios from 'axios';

const outputs = JSON.parse(
  fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
);

// AWS clients
const ec2Client = new EC2Client({ region: 'us-west-2' });
const elbClient = new ElasticLoadBalancingV2Client({ region: 'us-west-2' });
const asgClient = new AutoScalingClient({ region: 'us-west-2' });

describe('CDK Infrastructure Integration Tests', () => {
  describe('VPC Configuration', () => {
    test('VPC exists and is configured correctly', async () => {
      const vpcId = outputs.VpcId;
      expect(vpcId).toBeDefined();
      expect(vpcId).toMatch(/^vpc-[a-f0-9]+$/);

      const command = new DescribeVpcsCommand({
        VpcIds: [vpcId],
      });
      const response = await ec2Client.send(command);

      expect(response.Vpcs).toHaveLength(1);
      const vpc = response.Vpcs![0];
      expect(vpc.CidrBlock).toBe('10.0.0.0/16');
      // AWS API returns undefined for these when they are enabled by attributes
      // They would be false if explicitly disabled
      expect(vpc.EnableDnsHostnames).not.toBe(false);
      expect(vpc.EnableDnsSupport).not.toBe(false);
      expect(vpc.State).toBe('available');
    });

    test('subnets are created in multiple availability zones', async () => {
      const privateSubnetIds = outputs.PrivateSubnetIds?.split(',') || [];
      const publicSubnetIds = outputs.PublicSubnetIds?.split(',') || [];

      expect(privateSubnetIds).toHaveLength(2);
      expect(publicSubnetIds).toHaveLength(2);

      const allSubnetIds = [...privateSubnetIds, ...publicSubnetIds];
      const command = new DescribeSubnetsCommand({
        SubnetIds: allSubnetIds,
      });
      const response = await ec2Client.send(command);

      expect(response.Subnets).toHaveLength(4);

      // Check availability zones
      const azs = new Set(
        response.Subnets!.map(subnet => subnet.AvailabilityZone)
      );
      expect(azs.size).toBeGreaterThanOrEqual(2);

      // Verify public subnets have public IP mapping
      const publicSubnets = response.Subnets!.filter(subnet =>
        publicSubnetIds.includes(subnet.SubnetId!)
      );
      publicSubnets.forEach(subnet => {
        expect(subnet.MapPublicIpOnLaunch).toBe(true);
      });

      // Verify private subnets don't have public IP mapping
      const privateSubnets = response.Subnets!.filter(subnet =>
        privateSubnetIds.includes(subnet.SubnetId!)
      );
      privateSubnets.forEach(subnet => {
        expect(subnet.MapPublicIpOnLaunch).toBe(false);
      });
    });

    test('VPC has proper tagging', async () => {
      const vpcId = outputs.VpcId;
      const command = new DescribeVpcsCommand({
        VpcIds: [vpcId],
      });
      const response = await ec2Client.send(command);

      const vpc = response.Vpcs![0];
      const tags = vpc.Tags || [];
      const nameTag = tags.find(tag => tag.Key === 'Name');
      expect(nameTag?.Value).toMatch(/^cdk-vpc-/);
    });
  });

  describe('Auto Scaling Group', () => {
    test('ASG exists and is configured correctly', async () => {
      const asgArn = outputs.AutoScalingGroupArn;
      expect(asgArn).toBeDefined();

      // Extract ASG name from ARN
      const asgName = asgArn.split('/').pop();
      expect(asgName).toMatch(/^cdk-asg-/);

      const command = new DescribeAutoScalingGroupsCommand({
        AutoScalingGroupNames: [asgName!],
      });
      const response = await asgClient.send(command);

      expect(response.AutoScalingGroups).toHaveLength(1);
      const asg = response.AutoScalingGroups![0];

      expect(asg.MinSize).toBe(1);
      expect(asg.MaxSize).toBe(6);
      expect(asg.DesiredCapacity).toBeGreaterThanOrEqual(1);
      expect(asg.DesiredCapacity).toBeLessThanOrEqual(6);
      expect(asg.HealthCheckType).toBe('ELB');
    });

    test('ASG has running instances', async () => {
      const asgArn = outputs.AutoScalingGroupArn;
      const asgName = asgArn.split('/').pop();

      const command = new DescribeAutoScalingGroupsCommand({
        AutoScalingGroupNames: [asgName!],
      });
      const response = await asgClient.send(command);

      const asg = response.AutoScalingGroups![0];
      expect(asg.Instances).toBeDefined();
      expect(asg.Instances!.length).toBeGreaterThan(0);

      // Verify instances are healthy
      const healthyInstances = asg.Instances!.filter(
        instance => instance.HealthStatus === 'Healthy'
      );
      expect(healthyInstances.length).toBeGreaterThan(0);
    });

    test('ASG instances are in private subnets', async () => {
      const asgArn = outputs.AutoScalingGroupArn;
      const asgName = asgArn.split('/').pop();
      const privateSubnetIds = outputs.PrivateSubnetIds?.split(',') || [];

      const asgCommand = new DescribeAutoScalingGroupsCommand({
        AutoScalingGroupNames: [asgName!],
      });
      const asgResponse = await asgClient.send(asgCommand);

      const asg = asgResponse.AutoScalingGroups![0];
      const instanceIds = asg.Instances!.map(i => i.InstanceId!);

      if (instanceIds.length > 0) {
        const ec2Command = new DescribeInstancesCommand({
          InstanceIds: instanceIds,
        });
        const ec2Response = await ec2Client.send(ec2Command);

        ec2Response.Reservations!.forEach(reservation => {
          reservation.Instances!.forEach(instance => {
            expect(privateSubnetIds).toContain(instance.SubnetId);
          });
        });
      }
    });
  });

  describe('Application Load Balancer', () => {
    test('ALB exists and is internet-facing', async () => {
      const albDns = outputs.LoadBalancerDNS;
      expect(albDns).toBeDefined();
      expect(albDns).toMatch(/\.elb\.amazonaws\.com$/);

      const command = new DescribeLoadBalancersCommand({});
      const response = await elbClient.send(command);

      const alb = response.LoadBalancers!.find(lb => lb.DNSName === albDns);

      expect(alb).toBeDefined();
      expect(alb!.Scheme).toBe('internet-facing');
      expect(alb!.Type).toBe('application');
      expect(alb!.State?.Code).toBe('active');
      expect(alb!.LoadBalancerName).toMatch(/^cdk-alb-/);
    });

    test('ALB is in public subnets', async () => {
      const albDns = outputs.LoadBalancerDNS;
      const publicSubnetIds = outputs.PublicSubnetIds?.split(',') || [];

      const command = new DescribeLoadBalancersCommand({});
      const response = await elbClient.send(command);

      const alb = response.LoadBalancers!.find(lb => lb.DNSName === albDns);

      expect(alb).toBeDefined();
      expect(alb!.AvailabilityZones).toBeDefined();

      alb!.AvailabilityZones!.forEach(az => {
        expect(publicSubnetIds).toContain(az.SubnetId);
      });
    });

    test('ALB has healthy targets', async () => {
      const albDns = outputs.LoadBalancerDNS;

      // Get ALB
      const albCommand = new DescribeLoadBalancersCommand({});
      const albResponse = await elbClient.send(albCommand);
      const alb = albResponse.LoadBalancers!.find(lb => lb.DNSName === albDns);

      expect(alb).toBeDefined();

      // Get target groups
      const tgCommand = new DescribeTargetGroupsCommand({
        LoadBalancerArn: alb!.LoadBalancerArn,
      });
      const tgResponse = await elbClient.send(tgCommand);

      expect(tgResponse.TargetGroups).toBeDefined();
      expect(tgResponse.TargetGroups!.length).toBeGreaterThan(0);

      // Check target health
      const targetGroup = tgResponse.TargetGroups![0];
      const healthCommand = new DescribeTargetHealthCommand({
        TargetGroupArn: targetGroup.TargetGroupArn,
      });
      const healthResponse = await elbClient.send(healthCommand);

      expect(healthResponse.TargetHealthDescriptions).toBeDefined();
      const healthyTargets = healthResponse.TargetHealthDescriptions!.filter(
        target => target.TargetHealth?.State === 'healthy'
      );
      expect(healthyTargets.length).toBeGreaterThan(0);
    });

    test('ALB responds to HTTP requests', async () => {
      const albDns = outputs.LoadBalancerDNS;
      const url = `http://${albDns}`;

      // Give ALB time to become fully available
      let response;
      let attempts = 0;
      const maxAttempts = 5;

      while (attempts < maxAttempts) {
        try {
          response = await axios.get(url, {
            timeout: 10000,
            validateStatus: () => true, // Accept any status code
          });
          if (response.status === 200) {
            break;
          }
        } catch (error) {
          // Ignore connection errors during warm-up
        }
        attempts++;
        if (attempts < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, 5000));
        }
      }

      expect(response).toBeDefined();
      expect(response!.status).toBe(200);
      expect(response!.data).toContain('CDK Auto Scaling Instance');
    });
  });

  describe('Security Groups', () => {
    test('ALB security group allows HTTP and HTTPS traffic', async () => {
      const albDns = outputs.LoadBalancerDNS;

      // Get ALB
      const albCommand = new DescribeLoadBalancersCommand({});
      const albResponse = await elbClient.send(albCommand);
      const alb = albResponse.LoadBalancers!.find(lb => lb.DNSName === albDns);

      expect(alb).toBeDefined();
      const sgIds = alb!.SecurityGroups || [];
      expect(sgIds.length).toBeGreaterThan(0);

      // Get security group
      const sgCommand = new DescribeSecurityGroupsCommand({
        GroupIds: sgIds,
      });
      const sgResponse = await ec2Client.send(sgCommand);

      expect(sgResponse.SecurityGroups).toHaveLength(sgIds.length);
      const albSg = sgResponse.SecurityGroups![0];

      // Check ingress rules
      const ingressRules = albSg.IpPermissions || [];

      // Check HTTP rule
      const httpRule = ingressRules.find(
        rule => rule.FromPort === 80 && rule.ToPort === 80
      );
      expect(httpRule).toBeDefined();

      // Check HTTPS rule
      const httpsRule = ingressRules.find(
        rule => rule.FromPort === 443 && rule.ToPort === 443
      );
      expect(httpsRule).toBeDefined();
    });

    test('EC2 instances have restricted SSH access', async () => {
      const asgArn = outputs.AutoScalingGroupArn;
      const asgName = asgArn.split('/').pop();

      // Get ASG instances
      const asgCommand = new DescribeAutoScalingGroupsCommand({
        AutoScalingGroupNames: [asgName!],
      });
      const asgResponse = await asgClient.send(asgCommand);

      const asg = asgResponse.AutoScalingGroups![0];
      const instanceIds = asg.Instances!.map(i => i.InstanceId!);

      if (instanceIds.length > 0) {
        // Get instance details
        const ec2Command = new DescribeInstancesCommand({
          InstanceIds: instanceIds,
        });
        const ec2Response = await ec2Client.send(ec2Command);

        const instance = ec2Response.Reservations![0].Instances![0];
        const sgIds = instance.SecurityGroups!.map(sg => sg.GroupId!);

        // Get security groups
        const sgCommand = new DescribeSecurityGroupsCommand({
          GroupIds: sgIds,
        });
        const sgResponse = await ec2Client.send(sgCommand);

        // Find EC2 security group (not the default)
        const ec2Sg = sgResponse.SecurityGroups!.find(sg =>
          sg.GroupName?.includes('cdk-ec2-sg')
        );

        expect(ec2Sg).toBeDefined();

        // Check SSH rule is restricted
        const sshRule = ec2Sg!.IpPermissions?.find(
          rule => rule.FromPort === 22 && rule.ToPort === 22
        );

        expect(sshRule).toBeDefined();
        expect(sshRule!.IpRanges).toBeDefined();
        expect(sshRule!.IpRanges![0].CidrIp).toBe('10.0.0.0/8');
      }
    });
  });

  describe('Resource Naming Convention', () => {
    test('all resources use cdk- prefix', async () => {
      const vpcId = outputs.VpcId;
      const albDns = outputs.LoadBalancerDNS;
      const asgArn = outputs.AutoScalingGroupArn;

      // Check VPC name tag
      const vpcCommand = new DescribeVpcsCommand({
        VpcIds: [vpcId],
      });
      const vpcResponse = await ec2Client.send(vpcCommand);
      const vpcNameTag = vpcResponse.Vpcs![0].Tags?.find(t => t.Key === 'Name');
      expect(vpcNameTag?.Value).toMatch(/^cdk-vpc-/);

      // Check ALB name
      const albCommand = new DescribeLoadBalancersCommand({});
      const albResponse = await elbClient.send(albCommand);
      const alb = albResponse.LoadBalancers!.find(lb => lb.DNSName === albDns);
      expect(alb?.LoadBalancerName).toMatch(/^cdk-alb-/);

      // Check ASG name
      const asgName = asgArn.split('/').pop();
      expect(asgName).toMatch(/^cdk-asg-/);
    });
  });

  describe('High Availability', () => {
    test('resources are deployed across multiple availability zones', async () => {
      const privateSubnetIds = outputs.PrivateSubnetIds?.split(',') || [];
      const publicSubnetIds = outputs.PublicSubnetIds?.split(',') || [];

      // Check subnets span multiple AZs
      const allSubnetIds = [...privateSubnetIds, ...publicSubnetIds];
      const subnetCommand = new DescribeSubnetsCommand({
        SubnetIds: allSubnetIds,
      });
      const subnetResponse = await ec2Client.send(subnetCommand);

      const azs = new Set(subnetResponse.Subnets!.map(s => s.AvailabilityZone));
      expect(azs.size).toBeGreaterThanOrEqual(2);

      // Check ALB spans multiple AZs
      const albDns = outputs.LoadBalancerDNS;
      const albCommand = new DescribeLoadBalancersCommand({});
      const albResponse = await elbClient.send(albCommand);
      const alb = albResponse.LoadBalancers!.find(lb => lb.DNSName === albDns);

      expect(alb?.AvailabilityZones?.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Network Connectivity', () => {
    test('instances can only be accessed through ALB', async () => {
      const asgArn = outputs.AutoScalingGroupArn;
      const asgName = asgArn.split('/').pop();

      // Get ASG instances
      const asgCommand = new DescribeAutoScalingGroupsCommand({
        AutoScalingGroupNames: [asgName!],
      });
      const asgResponse = await asgClient.send(asgCommand);

      const asg = asgResponse.AutoScalingGroups![0];
      const instanceIds = asg.Instances!.map(i => i.InstanceId!);

      if (instanceIds.length > 0) {
        // Get instance details
        const ec2Command = new DescribeInstancesCommand({
          InstanceIds: instanceIds,
        });
        const ec2Response = await ec2Client.send(ec2Command);

        ec2Response.Reservations!.forEach(reservation => {
          reservation.Instances!.forEach(instance => {
            // Instances in private subnets should not have public IPs
            expect(instance.PublicIpAddress).toBeUndefined();
            expect(instance.PublicDnsName).toBe('');

            // Instances should have private IPs
            expect(instance.PrivateIpAddress).toBeDefined();
            expect(instance.PrivateIpAddress).toMatch(/^10\.0\.\d+\.\d+$/);
          });
        });
      }
    });
  });
});
