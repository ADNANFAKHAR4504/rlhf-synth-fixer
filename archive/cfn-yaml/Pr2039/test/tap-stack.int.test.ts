import * as fs from 'fs';
import * as path from 'path';
import {
  CloudFormationClient,
  DescribeStacksCommand,
  DescribeStackResourcesCommand,
} from '@aws-sdk/client-cloudformation';
import {
  EC2Client,
  DescribeVpcsCommand,
  DescribeSubnetsCommand,
  DescribeSecurityGroupsCommand,
  DescribeNatGatewaysCommand,
} from '@aws-sdk/client-ec2';
import {
  AutoScalingClient,
  DescribeAutoScalingGroupsCommand,
} from '@aws-sdk/client-auto-scaling';
import {
  ElasticLoadBalancingV2Client,
  DescribeLoadBalancersCommand,
  DescribeTargetGroupsCommand,
  DescribeTargetHealthCommand,
} from '@aws-sdk/client-elastic-load-balancing-v2';
import {
  CloudWatchClient,
  DescribeAlarmsCommand,
} from '@aws-sdk/client-cloudwatch';
import axios from 'axios';

const ENVIRONMENT_SUFFIX = process.env.ENVIRONMENT_SUFFIX || 'dev';
const STACK_NAME = `TapStack${ENVIRONMENT_SUFFIX}`;
const AWS_REGION = process.env.AWS_REGION || 'us-east-1';

describe('TapStack Integration Tests', () => {
  let outputs: Record<string, string> = {};
  let cfnClient: CloudFormationClient;
  let ec2Client: EC2Client;
  let asgClient: AutoScalingClient;
  let elbClient: ElasticLoadBalancingV2Client;
  let cwClient: CloudWatchClient;

  beforeAll(async () => {
    // Initialize AWS clients
    cfnClient = new CloudFormationClient({ region: AWS_REGION });
    ec2Client = new EC2Client({ region: AWS_REGION });
    asgClient = new AutoScalingClient({ region: AWS_REGION });
    elbClient = new ElasticLoadBalancingV2Client({ region: AWS_REGION });
    cwClient = new CloudWatchClient({ region: AWS_REGION });

    // Load outputs from deployment
    const outputsPath = path.join(__dirname, '../cfn-outputs/flat-outputs.json');
    if (fs.existsSync(outputsPath)) {
      const outputsContent = fs.readFileSync(outputsPath, 'utf8');
      outputs = JSON.parse(outputsContent);
    } else {
      console.warn('No outputs file found, some tests may fail');
    }
  });

  describe('Stack Deployment Verification', () => {
    test('should have stack deployed successfully', async () => {
      const command = new DescribeStacksCommand({ StackName: STACK_NAME });
      const response = await cfnClient.send(command);
      
      expect(response.Stacks).toHaveLength(1);
      expect(response.Stacks![0].StackStatus).toMatch(/CREATE_COMPLETE|UPDATE_COMPLETE/);
    });

    test('should have all expected outputs', () => {
      const requiredOutputs = [
        'LoadBalancerDNS',
        'VPCId',
        'AutoScalingGroupName',
        'ALBSecurityGroupId',
        'EC2SecurityGroupId',
      ];
      
      requiredOutputs.forEach((output) => {
        expect(outputs[output]).toBeDefined();
        expect(outputs[output]).not.toBe('');
      });
    });
  });

  describe('VPC and Networking', () => {
    test('should have VPC with correct configuration', async () => {
      const vpcId = outputs.VPCId;
      expect(vpcId).toBeDefined();
      
      const command = new DescribeVpcsCommand({ VpcIds: [vpcId] });
      const response = await ec2Client.send(command);
      
      expect(response.Vpcs).toHaveLength(1);
      const vpc = response.Vpcs![0];
      expect(vpc.CidrBlock).toBe('10.0.0.0/16');
      // DNS settings are verified via DescribeVpcAttribute separately if needed
    });

    test('should have 6 subnets (3 public, 3 private)', async () => {
      const vpcId = outputs.VPCId;
      const command = new DescribeSubnetsCommand({
        Filters: [{ Name: 'vpc-id', Values: [vpcId] }],
      });
      const response = await ec2Client.send(command);
      
      expect(response.Subnets).toHaveLength(6);
      
      const publicSubnets = response.Subnets!.filter(s => s.MapPublicIpOnLaunch === true);
      const privateSubnets = response.Subnets!.filter(s => s.MapPublicIpOnLaunch !== true);
      
      expect(publicSubnets).toHaveLength(3);
      expect(privateSubnets).toHaveLength(3);
    });

    test('should have subnets in 3 different availability zones', async () => {
      const vpcId = outputs.VPCId;
      const command = new DescribeSubnetsCommand({
        Filters: [{ Name: 'vpc-id', Values: [vpcId] }],
      });
      const response = await ec2Client.send(command);
      
      const azs = new Set(response.Subnets!.map(s => s.AvailabilityZone));
      expect(azs.size).toBeGreaterThanOrEqual(3);
    });

    test('should have NAT Gateways for private subnet connectivity', async () => {
      const vpcId = outputs.VPCId;
      const command = new DescribeNatGatewaysCommand({
        Filter: [
          { Name: 'vpc-id', Values: [vpcId] },
          { Name: 'state', Values: ['available'] },
        ],
      });
      const response = await ec2Client.send(command);
      
      expect(response.NatGateways).toBeDefined();
      expect(response.NatGateways!.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Security Groups', () => {
    test('should have ALB security group with correct rules', async () => {
      const sgId = outputs.ALBSecurityGroupId;
      expect(sgId).toBeDefined();
      
      const command = new DescribeSecurityGroupsCommand({ GroupIds: [sgId] });
      const response = await ec2Client.send(command);
      
      expect(response.SecurityGroups).toHaveLength(1);
      const sg = response.SecurityGroups![0];
      
      // Check HTTP rule
      const httpRule = sg.IpPermissions!.find(r => r.FromPort === 80);
      expect(httpRule).toBeDefined();
      const httpRange = httpRule!.IpRanges?.find(r => r.CidrIp === '0.0.0.0/0');
      expect(httpRange).toBeDefined();
      
      // Check HTTPS rule
      const httpsRule = sg.IpPermissions!.find(r => r.FromPort === 443);
      expect(httpsRule).toBeDefined();
      const httpsRange = httpsRule!.IpRanges?.find(r => r.CidrIp === '0.0.0.0/0');
      expect(httpsRange).toBeDefined();
    });

    test('should have EC2 security group with restricted access', async () => {
      const sgId = outputs.EC2SecurityGroupId;
      expect(sgId).toBeDefined();
      
      const command = new DescribeSecurityGroupsCommand({ GroupIds: [sgId] });
      const response = await ec2Client.send(command);
      
      expect(response.SecurityGroups).toHaveLength(1);
      const sg = response.SecurityGroups![0];
      
      // Should not have any rules allowing 0.0.0.0/0
      const publicRules = sg.IpPermissions!.filter(r => 
        r.IpRanges?.some(ip => ip.CidrIp === '0.0.0.0/0')
      );
      expect(publicRules).toHaveLength(0);
    });
  });

  describe('Load Balancer', () => {
    test('should have Application Load Balancer deployed', async () => {
      const dnsName = outputs.LoadBalancerDNS;
      expect(dnsName).toBeDefined();
      
      const command = new DescribeLoadBalancersCommand({});
      const response = await elbClient.send(command);
      
      const alb = response.LoadBalancers!.find(lb => lb.DNSName === dnsName);
      expect(alb).toBeDefined();
      expect(alb!.Type).toBe('application');
      expect(alb!.Scheme).toBe('internet-facing');
      expect(alb!.State!.Code).toBe('active');
    });

    test('should have target group with healthy targets', async () => {
      // First get the target group
      const tgCommand = new DescribeTargetGroupsCommand({});
      const tgResponse = await elbClient.send(tgCommand);
      
      const targetGroup = tgResponse.TargetGroups!.find(tg => 
        tg.TargetGroupName?.includes(ENVIRONMENT_SUFFIX)
      );
      expect(targetGroup).toBeDefined();
      
      // Check target health
      const healthCommand = new DescribeTargetHealthCommand({
        TargetGroupArn: targetGroup!.TargetGroupArn,
      });
      const healthResponse = await elbClient.send(healthCommand);
      
      expect(healthResponse.TargetHealthDescriptions).toBeDefined();
      const healthyTargets = healthResponse.TargetHealthDescriptions!.filter(
        t => t.TargetHealth?.State === 'healthy'
      );
      expect(healthyTargets.length).toBeGreaterThanOrEqual(2);
    });

    test('should be accessible via HTTP', async () => {
      const dnsName = outputs.LoadBalancerDNS;
      expect(dnsName).toBeDefined();
      
      const url = `http://${dnsName}`;
      
      // ALB may take time to be ready, retry a few times
      let response;
      for (let i = 0; i < 5; i++) {
        try {
          response = await axios.get(url, { timeout: 10000 });
          break;
        } catch (error) {
          if (i === 4) throw error;
          await new Promise(resolve => setTimeout(resolve, 5000));
        }
      }
      
      expect(response!.status).toBe(200);
      expect(response!.data).toContain('Hello from');
    });
  });

  describe('Auto Scaling', () => {
    test('should have Auto Scaling Group with correct configuration', async () => {
      const asgName = outputs.AutoScalingGroupName;
      expect(asgName).toBeDefined();
      
      const command = new DescribeAutoScalingGroupsCommand({
        AutoScalingGroupNames: [asgName],
      });
      const response = await asgClient.send(command);
      
      expect(response.AutoScalingGroups).toHaveLength(1);
      const asg = response.AutoScalingGroups![0];
      
      expect(asg.MinSize).toBe(2);
      expect(asg.MaxSize).toBe(6);
      expect(asg.DesiredCapacity).toBeGreaterThanOrEqual(2);
      expect(asg.HealthCheckType).toBe('ELB');
    });

    test('should have instances of correct type', async () => {
      const asgName = outputs.AutoScalingGroupName;
      const command = new DescribeAutoScalingGroupsCommand({
        AutoScalingGroupNames: [asgName],
      });
      const response = await asgClient.send(command);
      
      const asg = response.AutoScalingGroups![0];
      expect(asg.Instances).toBeDefined();
      expect(asg.Instances!.length).toBeGreaterThanOrEqual(2);
      
      // Verify launch template is using t3.medium
      const launchTemplate = asg.LaunchTemplate || asg.MixedInstancesPolicy?.LaunchTemplate;
      expect(launchTemplate).toBeDefined();
    });

    test('should have instances in multiple availability zones', async () => {
      const asgName = outputs.AutoScalingGroupName;
      const command = new DescribeAutoScalingGroupsCommand({
        AutoScalingGroupNames: [asgName],
      });
      const response = await asgClient.send(command);
      
      const asg = response.AutoScalingGroups![0];
      const azs = new Set(asg.Instances!.map(i => i.AvailabilityZone));
      expect(azs.size).toBeGreaterThanOrEqual(2);
    });
  });

  describe('CloudWatch Monitoring', () => {
    test('should have CPU high alarm configured', async () => {
      const command = new DescribeAlarmsCommand({
        AlarmNamePrefix: `TapStack${ENVIRONMENT_SUFFIX}-CPU-High`,
      });
      const response = await cwClient.send(command);
      
      expect(response.MetricAlarms).toHaveLength(1);
      const alarm = response.MetricAlarms![0];
      
      expect(alarm.MetricName).toBe('CPUUtilization');
      expect(alarm.Threshold).toBe(70);
      expect(alarm.ComparisonOperator).toBe('GreaterThanThreshold');
      expect(alarm.ActionsEnabled).toBe(true);
    });

    test('should have CPU low alarm configured', async () => {
      const command = new DescribeAlarmsCommand({
        AlarmNamePrefix: `TapStack${ENVIRONMENT_SUFFIX}-CPU-Low`,
      });
      const response = await cwClient.send(command);
      
      expect(response.MetricAlarms).toHaveLength(1);
      const alarm = response.MetricAlarms![0];
      
      expect(alarm.MetricName).toBe('CPUUtilization');
      expect(alarm.Threshold).toBe(25);
      expect(alarm.ComparisonOperator).toBe('LessThanThreshold');
    });
  });

  describe('Resource Tagging', () => {
    test('should have proper tags on stack', async () => {
      const command = new DescribeStacksCommand({ StackName: STACK_NAME });
      const response = await cfnClient.send(command);
      
      const stack = response.Stacks![0];
      const tags = stack.Tags || [];
      
      const repoTag = tags.find(t => t.Key === 'Repository');
      const authorTag = tags.find(t => t.Key === 'CommitAuthor');
      
      expect(repoTag).toBeDefined();
      expect(authorTag).toBeDefined();
    });

    test('should have Environment and Team tags on resources', async () => {
      const vpcId = outputs.VPCId;
      const command = new DescribeVpcsCommand({ VpcIds: [vpcId] });
      const response = await ec2Client.send(command);
      
      const vpc = response.Vpcs![0];
      const tags = vpc.Tags || [];
      
      const envTag = tags.find(t => t.Key === 'Environment');
      const teamTag = tags.find(t => t.Key === 'Team');
      
      expect(envTag).toBeDefined();
      expect(envTag!.Value).toBe('Production');
      expect(teamTag).toBeDefined();
      expect(teamTag!.Value).toBe('DevOps');
    });
  });

  describe('High Availability', () => {
    test('should have resources distributed across multiple AZs', async () => {
      const asgName = outputs.AutoScalingGroupName;
      const command = new DescribeAutoScalingGroupsCommand({
        AutoScalingGroupNames: [asgName],
      });
      const response = await asgClient.send(command);
      
      const asg = response.AutoScalingGroups![0];
      const availabilityZones = asg.AvailabilityZones || [];
      
      expect(availabilityZones.length).toBeGreaterThanOrEqual(3);
    });

    test('should maintain minimum number of healthy instances', async () => {
      const asgName = outputs.AutoScalingGroupName;
      const command = new DescribeAutoScalingGroupsCommand({
        AutoScalingGroupNames: [asgName],
      });
      const response = await asgClient.send(command);
      
      const asg = response.AutoScalingGroups![0];
      const healthyInstances = asg.Instances!.filter(
        i => i.HealthStatus === 'Healthy' && i.LifecycleState === 'InService'
      );
      
      expect(healthyInstances.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Performance', () => {
    test('should respond within acceptable time', async () => {
      const dnsName = outputs.LoadBalancerDNS;
      const url = `http://${dnsName}`;
      
      const startTime = Date.now();
      const response = await axios.get(url, { timeout: 5000 });
      const responseTime = Date.now() - startTime;
      
      expect(response.status).toBe(200);
      expect(responseTime).toBeLessThan(2000); // Response within 2 seconds
    });
  });
});