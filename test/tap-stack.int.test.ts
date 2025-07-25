// Configuration - These are coming from cfn-outputs after deployment
import fs from 'fs';
import path from 'path';
import { EC2Client, DescribeVpcsCommand, DescribeSubnetsCommand, DescribeInternetGatewaysCommand, DescribeSecurityGroupsCommand, DescribeTagsCommand } from '@aws-sdk/client-ec2';
import { ElasticLoadBalancingV2Client, DescribeLoadBalancersCommand, DescribeTargetGroupsCommand, DescribeListenersCommand } from '@aws-sdk/client-elastic-load-balancing-v2';
import { CloudFormationClient, DescribeStacksCommand } from '@aws-sdk/client-cloudformation';
import { AutoScalingClient, DescribeAutoScalingGroupsCommand } from '@aws-sdk/client-auto-scaling';
import { CloudWatchClient, DescribeAlarmsCommand } from '@aws-sdk/client-cloudwatch';
import axios from 'axios';

// Configure AWS SDK clients
const region = 'us-east-1';
const ec2 = new EC2Client({ region });
const elbv2 = new ElasticLoadBalancingV2Client({ region });
const cloudformation = new CloudFormationClient({ region });
const autoscaling = new AutoScalingClient({ region });
const cloudwatch = new CloudWatchClient({ region });

// Get environment suffix from environment variable (set by CI/CD pipeline)
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';
const stackName = process.env.STACK_NAME || `TapStack${environmentSuffix}`;

let outputs: any = {};

// Try to load outputs from file, fallback to CloudFormation API
try {
  if (fs.existsSync('cfn-outputs/flat-outputs.json')) {
    outputs = JSON.parse(fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8'));
  }
} catch (error) {
  console.log('Could not load outputs from file, will use CloudFormation API');
}

describe('Web Application Infrastructure Integration Tests', () => {
  let stackOutputs: any = {};

  beforeAll(async () => {
    // Get stack outputs if not loaded from file
    if (Object.keys(outputs).length === 0) {
      try {
        const command = new DescribeStacksCommand({ StackName: stackName });
        const response = await cloudformation.send(command);
        const stack = response.Stacks?.[0];
        if (stack?.Outputs) {
          stackOutputs = stack.Outputs.reduce((acc: any, output: any) => {
            acc[output.OutputKey!] = output.OutputValue;
            return acc;
          }, {});
        }
      } catch (error) {
        console.error('Failed to get stack outputs:', error);
        throw error;
      }
    } else {
      stackOutputs = outputs;
    }
  }, 30000);

  describe('Infrastructure Deployment', () => {
    test('should have deployed stack successfully', async () => {
      const command = new DescribeStacksCommand({ StackName: stackName });
      const response = await cloudformation.send(command);
      const stack = response.Stacks?.[0];
      
      expect(stack).toBeDefined();
      expect(stack?.StackStatus).toBe('CREATE_COMPLETE');
    });

    test('should have all required outputs', () => {
      expect(stackOutputs.LoadBalancerDNSName).toBeDefined();
      expect(stackOutputs.ApplicationHTTPURL).toBeDefined();
      expect(stackOutputs.ApplicationHTTPSURL).toBeDefined();
      expect(stackOutputs.VPCId).toBeDefined();
      expect(stackOutputs.AutoScalingGroupName).toBeDefined();
    });
  });

  describe('VPC and Networking', () => {
    test('should have VPC with correct configuration', async () => {
      const vpcId = stackOutputs.VPCId;
      expect(vpcId).toBeDefined();

      const command = new DescribeVpcsCommand({ VpcIds: [vpcId] });
      const response = await ec2.send(command);
      const vpc = response.Vpcs?.[0];

      expect(vpc).toBeDefined();
      expect(vpc?.CidrBlock).toBe('10.0.0.0/16');
      expect(vpc?.State).toBe('available');
    });

    test('should have three public subnets in different AZs', async () => {
      const vpcId = stackOutputs.VPCId;
      const command = new DescribeSubnetsCommand({
        Filters: [
          { Name: 'vpc-id', Values: [vpcId] },
          { Name: 'tag:Name', Values: ['*Public*'] }
        ]
      });
      const response = await ec2.send(command);

      const subnets = response.Subnets || [];
      expect(subnets).toHaveLength(3);

      const azs = subnets.map(subnet => subnet.AvailabilityZone);
      expect(azs).toContain('us-east-1a');
      expect(azs).toContain('us-east-1b');
      expect(azs).toContain('us-east-1c');
    });

    test('should have internet gateway attached', async () => {
      const vpcId = stackOutputs.VPCId;
      const command = new DescribeInternetGatewaysCommand({
        Filters: [{ Name: 'attachment.vpc-id', Values: [vpcId] }]
      });
      const response = await ec2.send(command);

      expect(response.InternetGateways).toHaveLength(1);
      expect(response.InternetGateways?.[0].Attachments?.[0].State).toBe('available');
    });
  });

  describe('Load Balancer', () => {
    test('should have Application Load Balancer running', async () => {
      const dnsName = stackOutputs.LoadBalancerDNSName;
      expect(dnsName).toBeDefined();

      const command = new DescribeLoadBalancersCommand({
        Names: ['WebApp-ALB']
      });
      const response = await elbv2.send(command);

      const alb = response.LoadBalancers?.[0];
      expect(alb).toBeDefined();
      expect(alb?.State?.Code).toBe('active');
      expect(alb?.Scheme).toBe('internet-facing');
      expect(alb?.Type).toBe('application');
    });

    test('should have target group with health checks', async () => {
      const command = new DescribeTargetGroupsCommand({
        Names: ['WebApp-TargetGroup']
      });
      const response = await elbv2.send(command);

      const targetGroup = response.TargetGroups?.[0];
      expect(targetGroup).toBeDefined();
      expect(targetGroup?.HealthCheckPath).toBe('/health');
      expect(targetGroup?.HealthCheckEnabled).toBe(true);
    });

    test('should have HTTP and HTTPS listeners', async () => {
      const command = new DescribeLoadBalancersCommand({
        Names: ['WebApp-ALB']
      });
      const response = await elbv2.send(command);
      const arn = response.LoadBalancers?.[0]?.LoadBalancerArn;

      const listenersCommand = new DescribeListenersCommand({
        LoadBalancerArn: arn
      });
      const listenersResponse = await elbv2.send(listenersCommand);

      const listeners = listenersResponse.Listeners || [];
      expect(listeners).toHaveLength(2);

      const ports = listeners.map(l => l.Port);
      expect(ports).toContain(80);
      expect(ports).toContain(443);
    });
  });

  describe('Auto Scaling Group', () => {
    test('should have auto scaling group with correct configuration', async () => {
      const asgName = stackOutputs.AutoScalingGroupName;
      expect(asgName).toBeDefined();

      const command = new DescribeAutoScalingGroupsCommand({
        AutoScalingGroupNames: [asgName]
      });
      const response = await autoscaling.send(command);

      const asg = response.AutoScalingGroups?.[0];
      expect(asg).toBeDefined();
      expect(asg?.MinSize).toBe(2);
      expect(asg?.MaxSize).toBe(4);
      expect(asg?.DesiredCapacity).toBe(2);
    });

    test('should have instances running in different AZs', async () => {
      const asgName = stackOutputs.AutoScalingGroupName;
      const command = new DescribeAutoScalingGroupsCommand({
        AutoScalingGroupNames: [asgName]
      });
      const response = await autoscaling.send(command);

      const instances = response.AutoScalingGroups?.[0]?.Instances || [];
      expect(instances.length).toBeGreaterThanOrEqual(2);

      // Check instances are healthy
      instances.forEach((instance: any) => {
        expect(instance.HealthStatus).toBe('Healthy');
        expect(instance.LifecycleState).toBe('InService');
      });
    });
  });

  describe('Application Health', () => {
    test('should respond to HTTP requests', async () => {
      const httpUrl = stackOutputs.ApplicationHTTPURL;
      expect(httpUrl).toBeDefined();

      try {
        const response = await axios.get(httpUrl, { timeout: 10000 });
        expect(response.status).toBe(200);
        expect(response.data).toContain('Production Web Application');
      } catch (error) {
        // Retry once after a delay for eventual consistency
        await new Promise(resolve => setTimeout(resolve, 5000));
        const response = await axios.get(httpUrl, { timeout: 10000 });
        expect(response.status).toBe(200);
        expect(response.data).toContain('Production Web Application');
      }
    }, 20000);

    test('should have health check endpoint working', async () => {
      const httpUrl = stackOutputs.ApplicationHTTPURL;
      const healthUrl = `${httpUrl}/health`;

      try {
        const response = await axios.get(healthUrl, { timeout: 5000 });
        expect(response.status).toBe(200);
        expect(response.data.trim()).toBe('OK');
      } catch (error) {
        // Retry once for eventual consistency
        await new Promise(resolve => setTimeout(resolve, 3000));
        const response = await axios.get(healthUrl, { timeout: 5000 });
        expect(response.status).toBe(200);
        expect(response.data.trim()).toBe('OK');
      }
    }, 15000);

    test('should redirect HTTPS to HTTP', async () => {
      const httpsUrl = stackOutputs.ApplicationHTTPSURL;
      expect(httpsUrl).toBeDefined();

      try {
        const response = await axios.get(httpsUrl, { 
          timeout: 10000,
          maxRedirects: 0,
          validateStatus: (status) => status === 301
        });
        expect(response.status).toBe(301);
        expect(response.headers.location).toContain('http://');
      } catch (error: any) {
        if (error.response?.status === 301) {
          expect(error.response.headers.location).toContain('http://');
        } else {
          throw error;
        }
      }
    }, 15000);
  });

  describe('Security Configuration', () => {
    test('should have security groups with correct rules', async () => {
      const vpcId = stackOutputs.VPCId;
      const command = new DescribeSecurityGroupsCommand({
        Filters: [
          { Name: 'vpc-id', Values: [vpcId] },
          { Name: 'group-name', Values: ['ALB-SecurityGroup', 'EC2-SecurityGroup'] }
        ]
      });
      const response = await ec2.send(command);

      const securityGroups = response.SecurityGroups || [];
      expect(securityGroups).toHaveLength(2);

      const albSG = securityGroups.find((sg: any) => sg.GroupName === 'ALB-SecurityGroup');
      const ec2SG = securityGroups.find((sg: any) => sg.GroupName === 'EC2-SecurityGroup');

      expect(albSG).toBeDefined();
      expect(ec2SG).toBeDefined();

      // ALB should allow HTTP/HTTPS from anywhere
      const albInbound = albSG?.IpPermissions || [];
      expect(albInbound.some((rule: any) => rule.FromPort === 80 && rule.IpRanges?.some((ip: any) => ip.CidrIp === '0.0.0.0/0'))).toBe(true);
      expect(albInbound.some((rule: any) => rule.FromPort === 443 && rule.IpRanges?.some((ip: any) => ip.CidrIp === '0.0.0.0/0'))).toBe(true);
    });
  });

  describe('Performance and Scaling', () => {
    test('should handle multiple concurrent requests', async () => {
      const httpUrl = stackOutputs.ApplicationHTTPURL;
      const requests = Array(10).fill(null).map(() => 
        axios.get(httpUrl, { timeout: 10000 })
      );

      const responses = await Promise.all(requests);
      responses.forEach(response => {
        expect(response.status).toBe(200);
      });
    }, 30000);

    test('should have CloudWatch alarms configured', async () => {
      const command = new DescribeAlarmsCommand({
        AlarmNames: ['WebApp-CPU-High', 'WebApp-CPU-Low']
      });
      const response = await cloudwatch.send(command);

      expect(response.MetricAlarms).toHaveLength(2);
      response.MetricAlarms?.forEach((alarm: any) => {
        expect(alarm.StateValue).toBeDefined();
        expect(['OK', 'ALARM', 'INSUFFICIENT_DATA']).toContain(alarm.StateValue);
      });
    });
  });

  describe('Resource Tagging', () => {
    test('should have proper tags on resources', async () => {
      const vpcId = stackOutputs.VPCId;
      const command = new DescribeTagsCommand({
        Filters: [
          { Name: 'resource-id', Values: [vpcId] },
          { Name: 'key', Values: ['Environment'] }
        ]
      });
      const response = await ec2.send(command);

      expect(response.Tags).toHaveLength(1);
      expect(response.Tags?.[0].Value).toBe('Production');
    });
  });
});
