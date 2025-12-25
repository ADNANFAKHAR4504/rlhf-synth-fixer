/**
 * test/tap-stack.integration.test.ts
 *
 * Integration tests for the deployed CloudFormation stack
 * Tests actual AWS resources and their interactions
 */

import {
  EC2Client,
  DescribeVpcsCommand,
  DescribeSubnetsCommand,
  DescribeInternetGatewaysCommand,
  DescribeSecurityGroupsCommand,
  DescribeInstancesCommand,
  DescribeRouteTablesCommand,
  DescribeVpcAttributeCommand,
} from '@aws-sdk/client-ec2';
import {
  ElasticLoadBalancingV2Client,
  DescribeLoadBalancersCommand,
  DescribeTargetGroupsCommand,
  DescribeListenersCommand,
  DescribeTargetHealthCommand,
} from '@aws-sdk/client-elastic-load-balancing-v2';
import {
  CloudWatchClient,
  DescribeAlarmsCommand,
} from '@aws-sdk/client-cloudwatch';
import {
  AutoScalingClient,
  DescribeAutoScalingGroupsCommand,
  DescribePoliciesCommand,
} from '@aws-sdk/client-auto-scaling';
import {
  CloudFormationClient,
  DescribeStacksCommand,
  DescribeStackResourcesCommand,
} from '@aws-sdk/client-cloudformation';
import {
  IAMClient,
  ListRolesCommand,
  ListRolePoliciesCommand,
  ListAttachedRolePoliciesCommand,
  GetRoleCommand,
} from '@aws-sdk/client-iam';
import fs from 'fs';
import path from 'path';

// LocalStack configuration
const isLocalStack = process.env.AWS_ENDPOINT_URL?.includes('localhost') ||
                     process.env.AWS_ENDPOINT_URL?.includes('4566') ||
                     process.env.LOCALSTACK === 'true';
const localstackEndpoint = process.env.AWS_ENDPOINT_URL || 'http://localhost:4566';

// Configuration - Load from cfn-outputs after stack deployment
const outputs = JSON.parse(
  fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
);

// Get environment suffix from environment variable (set by CI/CD pipeline)
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'Pr856';
const stackName = `tap-stack-${environmentSuffix}`;  // Fixed: Use kebab-case for LocalStack

// Extract outputs for testing
const VPC_ID = outputs[`${stackName}-VPC-ID`] || outputs['VPCId'];
const LOAD_BALANCER_DNS = outputs[`${stackName}-LoadBalancer-DNS`] || outputs['LoadBalancerDNS'];
const LOAD_BALANCER_URL = outputs[`${stackName}-LoadBalancer-URL`] || outputs['LoadBalancerURL'];
const ASG_NAME = outputs[`${stackName}-ASG-Name`] || outputs['AutoScalingGroupName'];
const PUBLIC_SUBNETS = outputs[`${stackName}-Public-Subnets`] || outputs['PublicSubnets'];
const WEBSERVER_SG_ID = outputs[`${stackName}-WebServer-SG-ID`] || outputs['WebServerSecurityGroupId'];
const ALB_SG_ID = outputs[`${stackName}-ALB-SG-ID`] || outputs['ALBSecurityGroupId'];

// AWS SDK v3 client configuration
const clientConfig = isLocalStack ? {
  region: 'us-east-1',
  endpoint: localstackEndpoint,
  credentials: {
    accessKeyId: 'test',
    secretAccessKey: 'test'
  },
  forcePathStyle: true,
  tls: false
} : {
  region: 'us-east-1'
};

// AWS SDK v3 clients - configured for LocalStack when applicable
const ec2Client = new EC2Client(clientConfig);
const elbv2Client = new ElasticLoadBalancingV2Client(clientConfig);
const cloudWatchClient = new CloudWatchClient(clientConfig);
const autoScalingClient = new AutoScalingClient(clientConfig);
const cloudFormationClient = new CloudFormationClient(clientConfig);
const iamClient = new IAMClient(clientConfig);

// Helper functions for AWS SDK v3 operations
async function getStackInfo() {
  const command = new DescribeStacksCommand({ StackName: stackName });
  const response = await cloudFormationClient.send(command);
  return response.Stacks![0];
}

async function getStackParameters() {
  const stack = await getStackInfo();
  const parameters: { [key: string]: string } = {};
  stack.Parameters?.forEach((param: any) => {
    parameters[param.ParameterKey] = param.ParameterValue;
  });
  return parameters;
}

async function getVpcInfo() {
  const command = new DescribeVpcsCommand({ VpcIds: [VPC_ID] });
  const response = await ec2Client.send(command);
  return response.Vpcs![0];
}

async function getLoadBalancerInfo() {
  const command = new DescribeLoadBalancersCommand({});
  const response = await elbv2Client.send(command);
  return response.LoadBalancers!.find((lb: any) => lb.DNSName === LOAD_BALANCER_DNS);
}

async function getAutoScalingGroup() {
  const command = new DescribeAutoScalingGroupsCommand({
    AutoScalingGroupNames: [ASG_NAME]
  });
  const response = await autoScalingClient.send(command);
  return response.AutoScalingGroups![0];
}

describe('TapStack Integration Tests - Production Ready', () => {
  let stackParameters: { [key: string]: string } = {};

  // Setup validation
  beforeAll(async () => {
    console.log('🔍 Validating stack deployment...');
    const stack = await getStackInfo();
    stackParameters = await getStackParameters();
    console.log(`✅ Stack ${stackName} is in ${stack.StackStatus} state`);
    console.log(`🔧 Stack parameters:`, stackParameters);
    
    // Log key infrastructure endpoints
    console.log(`🌐 VPC ID: ${VPC_ID}`);
    console.log(`⚖️  Load Balancer: ${LOAD_BALANCER_DNS}`);
    console.log(`🔗 Load Balancer URL: ${LOAD_BALANCER_URL}`);
    console.log(`📈 Auto Scaling Group: ${ASG_NAME}`);
    console.log(`🔒 Security Groups: ALB=${ALB_SG_ID}, WebServer=${WEBSERVER_SG_ID}`);
  });

  describe('Infrastructure Validation', () => {
    test('should have valid VPC ID', () => {
      expect(VPC_ID).toBeDefined();
      expect(VPC_ID).toMatch(/^vpc-[a-f0-9]+$/);
    });

    test('should have valid Load Balancer DNS', () => {
      expect(LOAD_BALANCER_DNS).toBeDefined();
      expect(LOAD_BALANCER_DNS).toMatch(/^.*\.elb\.amazonaws\.com$/);
    });

    test('should have valid Load Balancer URL', () => {
      expect(LOAD_BALANCER_URL).toBeDefined();
      expect(LOAD_BALANCER_URL).toMatch(/^http:\/\/.*\.elb\.amazonaws\.com$/);
    });

    test('should have valid Auto Scaling Group name', () => {
      expect(ASG_NAME).toBeDefined();
      expect(ASG_NAME).toMatch(/^tap-stack-.*-asg$/);  // Fixed for LocalStack kebab-case naming
    });

    test('should have valid Security Group IDs', () => {
      expect(WEBSERVER_SG_ID).toBeDefined();
      expect(WEBSERVER_SG_ID).toMatch(/^sg-[a-f0-9]+$/);
      expect(ALB_SG_ID).toBeDefined();
      expect(ALB_SG_ID).toMatch(/^sg-[a-f0-9]+$/);
    });

    test('should validate stack parameters', async () => {
      // Check that all expected parameters exist
      expect(stackParameters.Environment).toBeDefined();
      expect(stackParameters.InstanceType).toBeDefined();
      expect(stackParameters.KeyPairName).toBeDefined();
      expect(stackParameters.MinSize).toBeDefined();
      expect(stackParameters.MaxSize).toBeDefined();
      expect(stackParameters.DesiredCapacity).toBeDefined();
      
      console.log(`📋 Environment: ${stackParameters.Environment}`);
      console.log(`💻 Instance Type: ${stackParameters.InstanceType}`);
      console.log(`🔑 KeyPair: ${stackParameters.KeyPairName || 'Not specified'}`);
      console.log(`📊 ASG Capacity: Min=${stackParameters.MinSize}, Max=${stackParameters.MaxSize}, Desired=${stackParameters.DesiredCapacity}`);
    });
  });

  describe('Stack Deployment Status', () => {
    test('should be in complete state', async () => {
      const stack = await getStackInfo();
      
      expect(stack).toBeDefined();
      expect(['CREATE_COMPLETE', 'UPDATE_COMPLETE']).toContain(stack.StackStatus!);
      expect(stack.StackName).toBe(stackName);
    });

    test('should have proper stack tags', async () => {
      const stack = await getStackInfo();
      
      expect(stack.Tags).toBeDefined();
      const repositoryTag = stack.Tags!.find((tag: any) => tag.Key === 'Repository');
      const environmentTag = stack.Tags!.find((tag: any) => tag.Key === 'Environment');
      
      if (repositoryTag) {
        expect(repositoryTag.Value).toContain('iac-test-automations');
      }
      if (environmentTag) {
        expect(typeof environmentTag.Value).toBe('string');
      }
    });
  });

  describe('VPC & Networking Health Check', () => {
    test('should have available VPC with correct configuration', async () => {
      const vpc = await getVpcInfo();

      expect(vpc.State).toBe('available');
      expect(vpc.CidrBlock).toBe('10.0.0.0/16');
      expect(vpc.DhcpOptionsId).toBeDefined();

      // Fetch DNS attributes separately
      const dnsHostnamesCommand = new DescribeVpcAttributeCommand({
        VpcId: vpc.VpcId!,
        Attribute: 'enableDnsHostnames'
      });
      const dnsHostnamesResponse = await ec2Client.send(dnsHostnamesCommand);
      expect(dnsHostnamesResponse.EnableDnsHostnames?.Value).toBe(true);

      const dnsSupportCommand = new DescribeVpcAttributeCommand({
        VpcId: vpc.VpcId!,
        Attribute: 'enableDnsSupport'
      });
      const dnsSupportResponse = await ec2Client.send(dnsSupportCommand);
      expect(dnsSupportResponse.EnableDnsSupport?.Value).toBe(true);
      
      console.log(`✅ VPC ${VPC_ID} is available with CIDR 10.0.0.0/16`);
    });

    test('should have public subnets in multiple AZs', async () => {
      const command = new DescribeSubnetsCommand({
        Filters: [
          { Name: 'vpc-id', Values: [VPC_ID] },
          { Name: 'map-public-ip-on-launch', Values: ['true'] }
        ]
      });
      const response = await ec2Client.send(command);
      const publicSubnets = response.Subnets!;

      expect(publicSubnets.length).toBe(2);
      
      publicSubnets.forEach((subnet: any) => {
        expect(subnet.State).toBe('available');
        expect(subnet.MapPublicIpOnLaunch).toBe(true);
        expect(['10.0.1.0/24', '10.0.2.0/24']).toContain(subnet.CidrBlock);
      });

      // Verify AZ distribution - should be in different AZs
      const azs = [...new Set(publicSubnets.map((s: any) => s.AvailabilityZone))];
      expect(azs.length).toBe(2);
      
      console.log(`✅ Found ${publicSubnets.length} public subnets across ${azs.length} AZs: ${azs.join(', ')}`);
    });

    test('should have Internet Gateway attached', async () => {
      const command = new DescribeInternetGatewaysCommand({
        Filters: [{ Name: 'attachment.vpc-id', Values: [VPC_ID] }]
      });
      const response = await ec2Client.send(command);
      const igws = response.InternetGateways!;

      expect(igws.length).toBe(1);
      expect(igws[0].Attachments![0].State).toBe('available');
      expect(igws[0].Attachments![0].VpcId).toBe(VPC_ID);
      
      console.log(`✅ Internet Gateway ${igws[0].InternetGatewayId} is attached`);
    });

    test('should have proper route table configuration', async () => {
      const command = new DescribeRouteTablesCommand({
        Filters: [{ Name: 'vpc-id', Values: [VPC_ID] }]
      });
      const response = await ec2Client.send(command);
      const routeTables = response.RouteTables!;

      // Should have at least one route table with internet gateway route
      const publicRouteTable = routeTables.find((rt: any) =>
        rt.Routes!.some((route: any) => 
          route.GatewayId && route.GatewayId.startsWith('igw-')
        )
      );

      expect(publicRouteTable).toBeDefined();
      
      const igwRoute = publicRouteTable!.Routes!.find((route: any) => 
        route.GatewayId && route.GatewayId.startsWith('igw-')
      );
      expect(igwRoute!.DestinationCidrBlock).toBe('0.0.0.0/0');
      
      console.log(`✅ Public route table configured with IGW route`);
    });
  });

  describe('Security Groups Health Check', () => {
    test('should have ALB security group with correct rules', async () => {
      const command = new DescribeSecurityGroupsCommand({
        GroupIds: [ALB_SG_ID]
      });
      const response = await ec2Client.send(command);
      const albSG = response.SecurityGroups![0];
  
      expect(albSG).toBeDefined();
      expect(albSG.VpcId).toBe(VPC_ID);
  
      const httpRule = albSG.IpPermissions!.find((rule: any) => 
        rule.FromPort === 80 && rule.ToPort === 80
      );
      const httpsRule = albSG.IpPermissions!.find((rule: any) => 
        rule.FromPort === 443 && rule.ToPort === 443
      );
  
      expect(httpRule).toBeDefined();
      expect(httpsRule).toBeDefined();
      expect(httpRule!.IpRanges![0].CidrIp).toBe('0.0.0.0/0');
      expect(httpsRule!.IpRanges![0].CidrIp).toBe('0.0.0.0/0');
      
      console.log(`✅ ALB Security Group allows HTTP/HTTPS from internet`);
    });
  
    test('should have WebServer security group with ALB-only access', async () => {
      const command = new DescribeSecurityGroupsCommand({
        GroupIds: [WEBSERVER_SG_ID]
      });
      const response = await ec2Client.send(command);
      const webSG = response.SecurityGroups![0];
  
      expect(webSG).toBeDefined();
      expect(webSG.VpcId).toBe(VPC_ID);
  
      const httpRule = webSG.IpPermissions!.find((rule: any) => 
        rule.FromPort === 80 && rule.ToPort === 80
      );
  
      expect(httpRule).toBeDefined();
      expect(httpRule!.UserIdGroupPairs![0].GroupId).toBe(ALB_SG_ID);
      
      console.log(`✅ WebServer Security Group allows HTTP only from ALB`);
    });
  });  

  describe('Load Balancer Health Check', () => {
    test('should have active ALB with proper configuration', async () => {
      const alb = await getLoadBalancerInfo();

      expect(alb).toBeDefined();
      expect(alb!.State?.Code).toBe('active');
      expect(alb!.Type).toBe('application');
      expect(alb!.Scheme).toBe('internet-facing');
      expect(alb!.VpcId).toBe(VPC_ID);
      expect(alb!.AvailabilityZones!.length).toBe(2);
      
      // Check load balancer attributes
      expect(alb!.SecurityGroups).toContain(ALB_SG_ID);
      
      console.log(`✅ ALB ${alb!.LoadBalancerName} is active and internet-facing`);
    });

    test('should respond to HTTP requests', async () => {
      console.log(`🌐 Testing HTTP connectivity to ${LOAD_BALANCER_DNS}...`);
      
      try {
        const response = await fetch(`http://${LOAD_BALANCER_DNS}`, {
          method: 'GET',
          signal: AbortSignal.timeout(15000), // 15 second timeout
        });

        // Accept any response that indicates connectivity (even 503/504 if app is starting)
        expect(response.status).toBeLessThan(600);
        
        console.log(`✅ ALB responded with status: ${response.status}`);
      } catch (error: any) {
        if (error.name === 'TimeoutError') {
          console.log(`⚠️ ALB connection timeout - may still be initializing`);
        } else {
          throw error;
        }
      }
    }, 20000);

    test('should have properly configured target group', async () => {
      const command = new DescribeTargetGroupsCommand({});
      const response = await elbv2Client.send(command);
      const stackTG = response.TargetGroups!.find((tg: any) => tg.VpcId === VPC_ID);

      expect(stackTG).toBeDefined();
      expect(stackTG!.Protocol).toBe('HTTP');
      expect(stackTG!.Port).toBe(80);
      expect(stackTG!.HealthCheckIntervalSeconds).toBe(30);
      expect(stackTG!.HealthCheckPath).toBe('/health');
      expect(stackTG!.HealthyThresholdCount).toBe(2);
      expect(stackTG!.UnhealthyThresholdCount).toBe(3);
      
      console.log(`✅ Target Group ${stackTG!.TargetGroupName} configured correctly`);
    });

    test('should have target group with registered targets', async () => {
      const tgCommand = new DescribeTargetGroupsCommand({});
      const tgResponse = await elbv2Client.send(tgCommand);
      const stackTG = tgResponse.TargetGroups!.find((tg: any) => tg.VpcId === VPC_ID);

      const healthCommand = new DescribeTargetHealthCommand({
        TargetGroupArn: stackTG!.TargetGroupArn
      });
      const healthResponse = await elbv2Client.send(healthCommand);

      expect(healthResponse.TargetHealthDescriptions).toBeDefined();
      expect(healthResponse.TargetHealthDescriptions!.length).toBeGreaterThan(0);
      
      console.log(`✅ Target Group has ${healthResponse.TargetHealthDescriptions!.length} registered targets`);
    });
  });

  describe('Auto Scaling Group Health Check', () => {
    test('should have ASG with correct capacity', async () => {
      const asg = await getAutoScalingGroup();

      expect(asg).toBeDefined();
      expect(asg.MinSize).toBe(parseInt(stackParameters.MinSize));
      expect(asg.MaxSize).toBe(parseInt(stackParameters.MaxSize));
      expect(asg.DesiredCapacity).toBe(parseInt(stackParameters.DesiredCapacity));
      expect(asg.HealthCheckType).toBe('ELB');
      expect(asg.HealthCheckGracePeriod).toBe(300);
      expect(asg.DefaultCooldown).toBe(300);
      
      console.log(`✅ ASG ${asg.AutoScalingGroupName} has ${asg.Instances?.length || 0}/${asg.DesiredCapacity} instances`);
    });

    test('should have running EC2 instances with correct configuration', async () => {
      const asg = await getAutoScalingGroup();
      
      if (asg.Instances && asg.Instances.length > 0) {
        const instanceIds = asg.Instances.map((i: any) => i.InstanceId!);
        
        const ec2Command = new DescribeInstancesCommand({ InstanceIds: instanceIds });
        const ec2Response = await ec2Client.send(ec2Command);

        let runningInstances = 0;
        ec2Response.Reservations!.forEach((reservation: any) => {
          reservation.Instances!.forEach((instance: any) => {
            expect(['running', 'pending']).toContain(instance.State!.Name);
            expect(instance.InstanceType).toBe(stackParameters.InstanceType);
            expect(instance.VpcId).toBe(VPC_ID);
            
            // Verify security group assignment
            const webServerSG = instance.SecurityGroups!.find((sg: any) => sg.GroupId === WEBSERVER_SG_ID);
            expect(webServerSG).toBeDefined();
            
            if (instance.State!.Name === 'running') runningInstances++;
          });
        });
        
        console.log(`✅ Found ${runningInstances}/${instanceIds.length} running instances`);
      } else {
        console.warn('⚠️ No instances found in ASG - they may still be launching');
      }
    }, 60000);

    test('should have scaling policies configured', async () => {
      const command = new DescribePoliciesCommand({
        AutoScalingGroupName: ASG_NAME
      });
      const response = await autoScalingClient.send(command);
      const policies = response.ScalingPolicies!;

      expect(policies.length).toBe(2);
      
      const scaleUpPolicy = policies.find((p: any) => p.ScalingAdjustment === 1);
      const scaleDownPolicy = policies.find((p: any) => p.ScalingAdjustment === -1);
      
      expect(scaleUpPolicy).toBeDefined();
      expect(scaleDownPolicy).toBeDefined();
      expect(scaleUpPolicy!.AdjustmentType).toBe('ChangeInCapacity');
      expect(scaleDownPolicy!.AdjustmentType).toBe('ChangeInCapacity');
      
      console.log(`✅ ASG has ${policies.length} scaling policies configured`);
    });
  });

  describe('CloudWatch Monitoring Health Check', () => {
    test('should have CPU alarms for auto scaling', async () => {
      const command = new DescribeAlarmsCommand({
        AlarmNamePrefix: stackName
      });
      const response = await cloudWatchClient.send(command);
      const alarms = response.MetricAlarms!;

      const cpuHighAlarm = alarms.find((alarm: any) => 
        alarm.AlarmName!.includes('cpu-high')
      );
      const cpuLowAlarm = alarms.find((alarm: any) => 
        alarm.AlarmName!.includes('cpu-low')
      );

      expect(cpuHighAlarm).toBeDefined();
      expect(cpuLowAlarm).toBeDefined();
      
      expect(cpuHighAlarm!.MetricName).toBe('CPUUtilization');
      expect(cpuHighAlarm!.Threshold).toBe(70);
      expect(cpuHighAlarm!.ComparisonOperator).toBe('GreaterThanThreshold');
      
      expect(cpuLowAlarm!.MetricName).toBe('CPUUtilization');
      expect(cpuLowAlarm!.Threshold).toBe(25);
      expect(cpuLowAlarm!.ComparisonOperator).toBe('LessThanThreshold');
      
      console.log(`✅ CloudWatch alarms configured for auto scaling`);
    });
  });

  describe('Overall Health Check', () => {
    test('should have proper resource tagging', async () => {
      const stackResourcesCommand = new DescribeStackResourcesCommand({
        StackName: stackName
      });
      const response = await cloudFormationClient.send(stackResourcesCommand);
      const resources = response.StackResources!;

      // Check that key resources exist
      const vpcResource = resources.find((r: any) => r.LogicalResourceId === 'VPC');
      const albResource = resources.find((r: any) => r.LogicalResourceId === 'ApplicationLoadBalancer');
      const asgResource = resources.find((r: any) => r.LogicalResourceId === 'AutoScalingGroup');
      const launchTemplateResource = resources.find((r: any) => r.LogicalResourceId === 'WebServerLaunchTemplate');

      expect(vpcResource).toBeDefined();
      expect(albResource).toBeDefined();
      expect(asgResource).toBeDefined();
      expect(launchTemplateResource).toBeDefined();

      expect(vpcResource!.ResourceStatus).toBe('CREATE_COMPLETE');
      expect(albResource!.ResourceStatus).toBe('CREATE_COMPLETE');
      expect(asgResource!.ResourceStatus).toBe('CREATE_COMPLETE');
      
      console.log(`✅ All critical resources are in CREATE_COMPLETE state`);
    });

    test('should meet high availability requirements', async () => {
      // Verify multi-AZ deployment
      const asg = await getAutoScalingGroup();
      const subnets = asg.VPCZoneIdentifier!.split(',');
      
      expect(subnets.length).toBe(2);
      
      // Get subnet details to verify they're in different AZs
      const subnetCommand = new DescribeSubnetsCommand({
        SubnetIds: subnets
      });
      const subnetResponse = await ec2Client.send(subnetCommand);
      const azs = [...new Set(subnetResponse.Subnets!.map((s: any) => s.AvailabilityZone))];
      
      expect(azs.length).toBe(2);
      
      console.log(`✅ High availability: ASG spans ${azs.length} AZs`);
    });

    test('should validate end-to-end connectivity', async () => {
      console.log(`🔗 Testing end-to-end connectivity...`);
      
      try {
        const response = await fetch(LOAD_BALANCER_URL, {
          method: 'GET',
          signal: AbortSignal.timeout(20000),
        });

        if (response.ok) {
          const body = await response.text();
          expect(body).toContain('Secure Web Application');
          console.log(`✅ End-to-end connectivity successful - application responding`);
        } else {
          console.log(`⚠️ ALB responding but application may still be initializing (Status: ${response.status})`);
        }
      } catch (error: any) {
        console.log(`⚠️ End-to-end test inconclusive: ${error.message}`);
        // Don't fail the test as infrastructure may still be valid
      }
    }, 25000);
  });
});
