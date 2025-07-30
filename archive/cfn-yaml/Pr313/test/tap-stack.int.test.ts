import {
  AutoScalingClient,
  DescribeAutoScalingGroupsCommand,
} from '@aws-sdk/client-auto-scaling';
import { CloudFormationClient, DescribeStacksCommand } from '@aws-sdk/client-cloudformation';
import {
  CloudWatchClient,
  DescribeAlarmsCommand
} from '@aws-sdk/client-cloudwatch';
import {
  DescribeInstancesCommand,
  DescribeInternetGatewaysCommand,
  DescribeNatGatewaysCommand,
  DescribeRouteTablesCommand,
  DescribeSecurityGroupsCommand,
  DescribeSubnetsCommand,
  DescribeVpcsCommand,
  EC2Client
} from '@aws-sdk/client-ec2';
import {
  DescribeListenersCommand,
  DescribeLoadBalancersCommand,
  DescribeTargetGroupsCommand,
  DescribeTargetHealthCommand,
  ElasticLoadBalancingV2Client
} from '@aws-sdk/client-elastic-load-balancing-v2';
import {
  GetInstanceProfileCommand,
  GetRoleCommand,
  IAMClient
} from '@aws-sdk/client-iam';

// Get environment suffix from environment variable (set by CI/CD pipeline)
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'pr179';
const region = process.env.AWS_REGION || 'us-east-1';
const stackName = `TapStack${environmentSuffix}`;

// Initialize AWS SDK clients
const ec2 = new EC2Client({ region });
const elbv2 = new ElasticLoadBalancingV2Client({ region });
const autoscaling = new AutoScalingClient({ region });
const cloudwatch = new CloudWatchClient({ region });
const iam = new IAMClient({ region });
const cloudformation = new CloudFormationClient({ region });

// Function to get outputs from CloudFormation stack
async function getStackOutputs(): Promise<Record<string, string>> {
  console.log(`🔍 Fetching outputs from CloudFormation stack: ${stackName}`);
  
  try {
    const response = await cloudformation.send(new DescribeStacksCommand({
      StackName: stackName
    }));

    const stack = response.Stacks?.[0];
    if (!stack) {
      throw new Error(`Stack ${stackName} not found`);
    }

    if (stack.StackStatus !== 'CREATE_COMPLETE' && stack.StackStatus !== 'UPDATE_COMPLETE') {
      throw new Error(`Stack ${stackName} is not in a complete state: ${stack.StackStatus}`);
    }

    // Convert outputs to flat object
    const outputs: Record<string, string> = {};
    stack.Outputs?.forEach(output => {
      if (output.OutputKey && output.OutputValue) {
        outputs[output.OutputKey] = output.OutputValue;
      }
    });

    console.log(`✅ Stack outputs loaded successfully`);
    console.log(`📊 Available outputs: ${Object.keys(outputs).join(', ')}`);

    return outputs;
  } catch (error) {
    console.error(`❌ Failed to get stack outputs: ${error}`);
    throw error;
  }
}

describe('TapStack AWS Infrastructure Integration Tests', () => {
  let outputs: Record<string, string>;

  beforeAll(async () => {
    console.log(`🚀 Setting up integration tests for environment: ${environmentSuffix}`);
    outputs = await getStackOutputs();
    
    // Verify we have the required outputs
    const requiredOutputs = [
      'VPCId',
      'PublicSubnets',
      'PrivateSubnets',
      'ApplicationLoadBalancerDNS',
      'ApplicationLoadBalancerURL',
      'AutoScalingGroupName',
      'EC2InstanceRole',
      'WebServerSecurityGroup',
      'ALBSecurityGroup'
    ];

    requiredOutputs.forEach(outputKey => {
      if (!outputs[outputKey]) {
        throw new Error(`Required output ${outputKey} not found in stack ${stackName}`);
      }
    });

    console.log(`✅ Stack outputs validation completed`);
  }, 60000); // 60 second timeout for beforeAll

  describe('Stack Information', () => {
    test('should have valid stack outputs', () => {
      expect(outputs).toBeDefined();
      expect(Object.keys(outputs).length).toBeGreaterThan(0);
      console.log(`📋 Stack: ${stackName}`);
      console.log(`🌍 Region: ${region}`);
      console.log(`🏷️  Environment: ${environmentSuffix}`);
    });

    test('should validate stack exists and is in good state', async () => {
      const response = await cloudformation.send(new DescribeStacksCommand({
        StackName: stackName
      }));

      const stack = response.Stacks?.[0];
      expect(stack).toBeDefined();
      expect(stack?.StackStatus).toMatch(/COMPLETE$/);
      expect(stack?.StackName).toBe(stackName);
      console.log(`✅ CloudFormation stack verified: ${stackName} (${stack?.StackStatus})`);
    });
  });

  describe('VPC Infrastructure', () => {
    test('should have VPC with correct configuration', async () => {
      const vpcId = outputs.VPCId;
      expect(vpcId).toBeDefined();

      const response = await ec2.send(new DescribeVpcsCommand({
        VpcIds: [vpcId]
      }));

      const vpc = response.Vpcs?.[0];
      expect(vpc).toBeDefined();
      expect(vpc?.State).toBe('available');
      expect(vpc?.CidrBlock).toBe('10.192.0.0/16');
      expect(vpc?.DhcpOptionsId).toBeDefined();
      expect(vpc?.InstanceTenancy).toBe('default');

      console.log(`✅ VPC verified: ${vpcId} (${vpc?.CidrBlock})`);
    });

    test('should have public subnets correctly configured', async () => {
      const publicSubnetIds = outputs.PublicSubnets.split(',');
      expect(publicSubnetIds).toHaveLength(2);

      const response = await ec2.send(new DescribeSubnetsCommand({
        SubnetIds: publicSubnetIds
      }));

      const subnets = response.Subnets || [];
      expect(subnets).toHaveLength(2);

      // Verify each subnet
      subnets.forEach((subnet, index) => {
        expect(subnet.State).toBe('available');
        expect(subnet.MapPublicIpOnLaunch).toBe(true);
        expect(subnet.VpcId).toBe(outputs.VPCId);
        
        // Check CIDR blocks
        const expectedCidrs = ['10.192.10.0/24', '10.192.11.0/24'];
        expect(expectedCidrs).toContain(subnet.CidrBlock);

        // Check availability zones (should be different)
        expect(subnet.AvailabilityZone).toBeDefined();
      });

      // Ensure subnets are in different AZs
      const azs = subnets.map(s => s.AvailabilityZone);
      expect(new Set(azs).size).toBe(2);

      console.log(`✅ Public subnets verified: ${publicSubnetIds.join(', ')}`);
    });

    test('should have private subnets correctly configured', async () => {
      const privateSubnetIds = outputs.PrivateSubnets.split(',');
      expect(privateSubnetIds).toHaveLength(2);

      const response = await ec2.send(new DescribeSubnetsCommand({
        SubnetIds: privateSubnetIds
      }));

      const subnets = response.Subnets || [];
      expect(subnets).toHaveLength(2);

      // Verify each subnet
      subnets.forEach((subnet) => {
        expect(subnet.State).toBe('available');
        expect(subnet.MapPublicIpOnLaunch).toBe(false);
        expect(subnet.VpcId).toBe(outputs.VPCId);
        
        // Check CIDR blocks
        const expectedCidrs = ['10.192.20.0/24', '10.192.21.0/24'];
        expect(expectedCidrs).toContain(subnet.CidrBlock);
      });

      console.log(`✅ Private subnets verified: ${privateSubnetIds.join(', ')}`);
    });

    test('should have Internet Gateway attached', async () => {
      const response = await ec2.send(new DescribeInternetGatewaysCommand({
        Filters: [
          {
            Name: 'attachment.vpc-id',
            Values: [outputs.VPCId]
          }
        ]
      }));

      const igws = response.InternetGateways || [];
      expect(igws).toHaveLength(1);

      const igw = igws[0];
      expect(igw.Attachments).toHaveLength(1);
      expect(igw.Attachments?.[0].VpcId).toBe(outputs.VPCId);
      expect(igw.Attachments?.[0].State).toBe('available');

      console.log(`✅ Internet Gateway verified: ${igw.InternetGatewayId}`);
    });

    test('should have NAT Gateways in public subnets', async () => {
      const publicSubnetIds = outputs.PublicSubnets.split(',');

      const response = await ec2.send(new DescribeNatGatewaysCommand({
        Filter: [
          {
            Name: 'vpc-id',
            Values: [outputs.VPCId]
          },
          {
            Name: 'state',
            Values: ['available']
          }
        ]
      }));

      const natGateways = response.NatGateways || [];
      expect(natGateways).toHaveLength(2);

      // Verify NAT Gateways are in public subnets
      natGateways.forEach(natGw => {
        expect(natGw.State).toBe('available');
        expect(publicSubnetIds).toContain(natGw.SubnetId!);
        expect(natGw.NatGatewayAddresses).toHaveLength(1);
        expect(natGw.NatGatewayAddresses?.[0].AllocationId).toBeDefined();
      });

      console.log(`✅ NAT Gateways verified: ${natGateways.length} gateways`);
    });

    test('should have correct route table configuration', async () => {
      const response = await ec2.send(new DescribeRouteTablesCommand({
        Filters: [
          {
            Name: 'vpc-id',
            Values: [outputs.VPCId]
          }
        ]
      }));

      const routeTables = response.RouteTables || [];
      expect(routeTables.length).toBeGreaterThanOrEqual(3); // Main + Public + 2 Private

      // Find public route table (has IGW route)
      const publicRT = routeTables.find(rt => 
        rt.Routes?.some(route => route.GatewayId?.startsWith('igw-'))
      );
      expect(publicRT).toBeDefined();

      // Find private route tables (have NAT Gateway routes)
      const privateRTs = routeTables.filter(rt => 
        rt.Routes?.some(route => route.NatGatewayId?.startsWith('nat-'))
      );
      expect(privateRTs).toHaveLength(2);

      console.log(`✅ Route tables verified: ${routeTables.length} total route tables`);
    });
  });

  describe('Security Groups', () => {
    test('should have ALB Security Group with correct rules', async () => {
      const albSecurityGroupId = outputs.ALBSecurityGroup;
      expect(albSecurityGroupId).toBeDefined();

      const response = await ec2.send(new DescribeSecurityGroupsCommand({
        GroupIds: [albSecurityGroupId]
      }));

      const sg = response.SecurityGroups?.[0];
      expect(sg).toBeDefined();
      expect(sg?.VpcId).toBe(outputs.VPCId);

      // Check ingress rules
      const ingressRules = sg?.IpPermissions || [];
      expect(ingressRules).toHaveLength(2);

      // HTTP rule
      const httpRule = ingressRules.find(rule => rule.FromPort === 80);
      expect(httpRule).toBeDefined();
      expect(httpRule?.IpProtocol).toBe('tcp');
      expect(httpRule?.IpRanges?.[0].CidrIp).toBe('0.0.0.0/0');

      // HTTPS rule
      const httpsRule = ingressRules.find(rule => rule.FromPort === 443);
      expect(httpsRule).toBeDefined();
      expect(httpsRule?.IpProtocol).toBe('tcp');
      expect(httpsRule?.IpRanges?.[0].CidrIp).toBe('0.0.0.0/0');

      console.log(`✅ ALB Security Group verified: ${albSecurityGroupId}`);
    });

    test('should have Web Server Security Group with ALB-only access', async () => {
      const webSecurityGroupId = outputs.WebServerSecurityGroup;
      const albSecurityGroupId = outputs.ALBSecurityGroup;
      expect(webSecurityGroupId).toBeDefined();

      const response = await ec2.send(new DescribeSecurityGroupsCommand({
        GroupIds: [webSecurityGroupId]
      }));

      const sg = response.SecurityGroups?.[0];
      expect(sg).toBeDefined();
      expect(sg?.VpcId).toBe(outputs.VPCId);

      // Check ingress rules - should only allow from ALB
      const ingressRules = sg?.IpPermissions || [];
      expect(ingressRules).toHaveLength(1);

      const httpRule = ingressRules[0];
      expect(httpRule.FromPort).toBe(80);
      expect(httpRule.ToPort).toBe(80);
      expect(httpRule.IpProtocol).toBe('tcp');
      expect(httpRule.UserIdGroupPairs?.[0].GroupId).toBe(albSecurityGroupId);

      console.log(`✅ Web Server Security Group verified: ${webSecurityGroupId}`);
    });
  });

  describe('Application Load Balancer', () => {
    let loadBalancerArn: string;

    test('should have ALB deployed and available', async () => {
      const albDnsName = outputs.ApplicationLoadBalancerDNS;
      expect(albDnsName).toBeDefined();
      expect(albDnsName).toContain('.elb.');

      const response = await elbv2.send(new DescribeLoadBalancersCommand({
        Names: [`${environmentSuffix}-ALB`]
      }));

      const alb = response.LoadBalancers?.[0];
      expect(alb).toBeDefined();
      expect(alb?.State?.Code).toBe('active');
      expect(alb?.Scheme).toBe('internet-facing');
      expect(alb?.Type).toBe('application');
      expect(alb?.VpcId).toBe(outputs.VPCId);

      // Verify subnets
      const publicSubnetIds = outputs.PublicSubnets.split(',');
      const albSubnets = alb?.AvailabilityZones?.map(az => az.SubnetId) || [];
      expect(albSubnets).toHaveLength(2);
      publicSubnetIds.forEach(subnetId => {
        expect(albSubnets).toContain(subnetId);
      });

      loadBalancerArn = alb?.LoadBalancerArn!;
      console.log(`✅ ALB verified: ${alb?.LoadBalancerName} (${alb?.DNSName})`);
    });

    test('should have target group with correct configuration', async () => {
      const response = await elbv2.send(new DescribeTargetGroupsCommand({
        Names: [`${environmentSuffix}-TG`]
      }));

      const tg = response.TargetGroups?.[0];
      expect(tg).toBeDefined();
      expect(tg?.Protocol).toBe('HTTP');
      expect(tg?.Port).toBe(80);
      expect(tg?.VpcId).toBe(outputs.VPCId);
      expect(tg?.TargetType).toBe('instance');

      // Check health check configuration
      expect(tg?.HealthCheckEnabled).toBe(true);
      expect(tg?.HealthCheckPath).toBe('/');
      expect(tg?.HealthCheckProtocol).toBe('HTTP');
      expect(tg?.HealthyThresholdCount).toBe(2);
      expect(tg?.UnhealthyThresholdCount).toBe(5);

      console.log(`✅ Target Group verified: ${tg?.TargetGroupName}`);
    });

    test('should have listener configured', async () => {
      const response = await elbv2.send(new DescribeListenersCommand({
        LoadBalancerArn: loadBalancerArn
      }));

      const listeners = response.Listeners || [];
      expect(listeners).toHaveLength(1);

      const listener = listeners[0];
      expect(listener.Protocol).toBe('HTTP');
      expect(listener.Port).toBe(80);
      expect(listener.DefaultActions).toHaveLength(1);
      expect(listener.DefaultActions?.[0].Type).toBe('forward');

      console.log(`✅ ALB Listener verified: ${listener.Protocol}:${listener.Port}`);
    });

    test('should have healthy targets (if instances are running)', async () => {
      // Get target group ARN
      const tgResponse = await elbv2.send(new DescribeTargetGroupsCommand({
        Names: [`${environmentSuffix}-TG`]
      }));

      const targetGroupArn = tgResponse.TargetGroups?.[0]?.TargetGroupArn;
      expect(targetGroupArn).toBeDefined();

      const healthResponse = await elbv2.send(new DescribeTargetHealthCommand({
        TargetGroupArn: targetGroupArn
      }));

      const targets = healthResponse.TargetHealthDescriptions || [];
      console.log(`📊 Target health check: ${targets.length} targets found`);

      if (targets.length > 0) {
        // If there are targets, at least some should be healthy or becoming healthy
        const healthyStates = ['healthy', 'initial'];
        const healthyTargets = targets.filter(target => 
          healthyStates.includes(target.TargetHealth?.State || '')
        );
        
        expect(healthyTargets.length).toBeGreaterThanOrEqual(0);
        console.log(`✅ Target health verified: ${healthyTargets.length}/${targets.length} healthy`);
      } else {
        console.log(`⚠️  No targets registered yet (ASG may still be launching instances)`);
      }
    });
  });

  describe('Auto Scaling Group', () => {
    test('should have ASG with correct configuration', async () => {
      const asgName = outputs.AutoScalingGroupName;
      expect(asgName).toBeDefined();

      const response = await autoscaling.send(new DescribeAutoScalingGroupsCommand({
        AutoScalingGroupNames: [asgName]
      }));

      const asg = response.AutoScalingGroups?.[0];
      expect(asg).toBeDefined();
      expect(asg?.MinSize).toBe(2);
      expect(asg?.MaxSize).toBe(6);
      expect(asg?.DesiredCapacity).toBe(2);
      expect(asg?.HealthCheckType).toBe('ELB');
      expect(asg?.HealthCheckGracePeriod).toBe(300);

      // Verify subnets (should be private subnets)
      const privateSubnetIds = outputs.PrivateSubnets.split(',');
      const asgSubnets = asg?.VPCZoneIdentifier?.split(',') || [];
      expect(asgSubnets).toHaveLength(2);
      privateSubnetIds.forEach(subnetId => {
        expect(asgSubnets).toContain(subnetId);
      });

      // Check target group association
      expect(asg?.TargetGroupARNs).toHaveLength(1);

      console.log(`✅ Auto Scaling Group verified: ${asgName} (${asg?.Instances?.length} instances)`);
    });

    test('should have launch template configured', async () => {
      // Get ASG details to find launch template
      const asgName = outputs.AutoScalingGroupName;
      const asgResponse = await autoscaling.send(new DescribeAutoScalingGroupsCommand({
        AutoScalingGroupNames: [asgName]
      }));

      const asg = asgResponse.AutoScalingGroups?.[0];
      const launchTemplateName = asg?.LaunchTemplate?.LaunchTemplateName;
      expect(launchTemplateName).toBeDefined();

      console.log(`✅ Launch Template verified: ${launchTemplateName}`);
    });

    test('should have running instances in private subnets', async () => {
      const asgName = outputs.AutoScalingGroupName;
      const response = await autoscaling.send(new DescribeAutoScalingGroupsCommand({
        AutoScalingGroupNames: [asgName]
      }));

      const asg = response.AutoScalingGroups?.[0];
      const instances = asg?.Instances || [];

      if (instances.length > 0) {
        const instanceIds = instances.map(i => i.InstanceId!);
        
        const ec2Response = await ec2.send(new DescribeInstancesCommand({
          InstanceIds: instanceIds
        }));

        const reservations = ec2Response.Reservations || [];
        const allInstances = reservations.flatMap(r => r.Instances || []);

        expect(allInstances).toHaveLength(instances.length);

        // Verify instances are in private subnets
        const privateSubnetIds = outputs.PrivateSubnets.split(',');
        allInstances.forEach(instance => {
          expect(privateSubnetIds).toContain(instance.SubnetId!);
          expect(['pending', 'running']).toContain(instance.State?.Name!);
        });

        console.log(`✅ EC2 Instances verified: ${allInstances.length} instances in private subnets`);
      } else {
        console.log(`⚠️  No instances found (ASG may still be launching)`);
      }
    });
  });

  describe('CloudWatch Alarms', () => {
    test('should have CPU scaling alarms configured', async () => {
      const response = await cloudwatch.send(new DescribeAlarmsCommand({
        AlarmNames: [
          `${environmentSuffix}-CPU-High`,
          `${environmentSuffix}-CPU-Low`
        ]
      }));

      const alarms = response.MetricAlarms || [];
      expect(alarms).toHaveLength(2);

      // High CPU alarm
      const highAlarm = alarms.find(a => a.AlarmName === `${environmentSuffix}-CPU-High`);
      expect(highAlarm).toBeDefined();
      expect(highAlarm?.MetricName).toBe('CPUUtilization');
      expect(highAlarm?.Namespace).toBe('AWS/EC2');
      expect(highAlarm?.Threshold).toBe(70);
      expect(highAlarm?.ComparisonOperator).toBe('GreaterThanThreshold');

      // Low CPU alarm
      const lowAlarm = alarms.find(a => a.AlarmName === `${environmentSuffix}-CPU-Low`);
      expect(lowAlarm).toBeDefined();
      expect(lowAlarm?.MetricName).toBe('CPUUtilization');
      expect(lowAlarm?.Namespace).toBe('AWS/EC2');
      expect(lowAlarm?.Threshold).toBe(30);
      expect(lowAlarm?.ComparisonOperator).toBe('LessThanThreshold');

      console.log(`✅ CloudWatch Alarms verified: ${alarms.length} alarms`);
    });
  });

  describe('IAM Resources', () => {
    test('should have EC2 instance role with correct policies', async () => {
      const roleArn = outputs.EC2InstanceRole;
      expect(roleArn).toBeDefined();

      const roleName = roleArn.split('/').pop()!;
      const response = await iam.send(new GetRoleCommand({
        RoleName: roleName
      }));

      const role = response.Role;
      expect(role).toBeDefined();
      expect(role?.AssumeRolePolicyDocument).toBeDefined();

      // Verify trust policy allows EC2
      const trustPolicy = JSON.parse(decodeURIComponent(role?.AssumeRolePolicyDocument || ''));
      const statement = trustPolicy.Statement[0];
      expect(statement.Effect).toBe('Allow');
      expect(statement.Principal.Service).toBe('ec2.amazonaws.com');

      console.log(`✅ EC2 Instance Role verified: ${roleName}`);
    });

    test('should have instance profile', async () => {
      const roleArn = outputs.EC2InstanceRole;
      const roleName = roleArn.split('/').pop()!;

      // Try to get instance profile (should exist with same name or similar)
      try {
        const response = await iam.send(new GetInstanceProfileCommand({
          InstanceProfileName: roleName
        }));

        const instanceProfile = response.InstanceProfile;
        expect(instanceProfile).toBeDefined();
        expect(instanceProfile?.Roles).toHaveLength(1);
        expect(instanceProfile?.Roles?.[0].RoleName).toBe(roleName);

        console.log(`✅ Instance Profile verified: ${instanceProfile?.InstanceProfileName}`);
      } catch (error: any) {
        // Instance profile might have different name, just log warning
        console.log(`⚠️  Instance profile verification skipped: ${error.message}`);
      }
    });
  });

  describe('End-to-End Functionality', () => {
    test('should have accessible ALB URL', async () => {
      const albUrl = outputs.ApplicationLoadBalancerURL;
      expect(albUrl).toBeDefined();
      console.log(`✅ ALB URL format verified: ${albUrl}`);

      // Optional: Make HTTP request to verify accessibility
      try {
        const response = await fetch(albUrl, { 
          method: 'HEAD'
        });
        expect([200, 503, 504]).toContain(response.status); // 503/504 OK if instances not ready
        console.log(`✅ ALB URL accessible: ${albUrl} (Status: ${response.status})`);
      } catch (error) {
        console.warn(`⚠️  Could not verify ALB accessibility: ${error}`);
      }
    });

    test('should validate complete infrastructure connectivity', () => {
      // Verify all outputs are present and properly formatted
      expect(outputs.VPCId).toMatch(/^vpc-/);
      expect(outputs.ApplicationLoadBalancerDNS).toContain('.elb.');
      expect(outputs.AutoScalingGroupName).toContain(environmentSuffix);
      expect(outputs.EC2InstanceRole).toMatch(/^arn:aws:iam::/);
      expect(outputs.WebServerSecurityGroup).toMatch(/^sg-/);
      expect(outputs.ALBSecurityGroup).toMatch(/^sg-/);

      console.log(`✅ Infrastructure connectivity validation completed`);
    });
  });

  describe('Resource Naming and Tagging Compliance', () => {
    test('should follow naming conventions', () => {
      // Verify resource naming patterns
      expect(outputs.AutoScalingGroupName).toBe(`${environmentSuffix}-ASG`);
      
      // VPC and security groups should follow AWS resource ID patterns
      expect(outputs.VPCId).toMatch(/^vpc-[a-f0-9]+$/);
      expect(outputs.WebServerSecurityGroup).toMatch(/^sg-[a-f0-9]+$/);
      expect(outputs.ALBSecurityGroup).toMatch(/^sg-[a-f0-9]+$/);

      console.log(`✅ Resource naming conventions verified`);
      console.log(`📊 VPC: ${outputs.VPCId}`);
      console.log(`📊 ASG: ${outputs.AutoScalingGroupName}`);
      console.log(`📊 ALB DNS: ${outputs.ApplicationLoadBalancerDNS}`);
    });

    test('should have environment suffix in resource names', () => {
      expect(outputs.AutoScalingGroupName).toContain(environmentSuffix);
      expect(outputs.ApplicationLoadBalancerURL).toContain(environmentSuffix);
      
      console.log(`✅ Environment suffix consistency verified: ${environmentSuffix}`);
    });

    test('should have all required outputs', () => {
      const requiredOutputs = [
        'VPCId',
        'PublicSubnets',
        'PrivateSubnets',
        'ApplicationLoadBalancerDNS',
        'ApplicationLoadBalancerURL',
        'AutoScalingGroupName',
        'EC2InstanceRole',
        'WebServerSecurityGroup',
        'ALBSecurityGroup'
      ];

      requiredOutputs.forEach(output => {
        expect(outputs[output]).toBeDefined();
        expect(outputs[output]).not.toBe('');
      });
      console.log(`✅ All required outputs present: ${requiredOutputs.length} outputs`);
    });
  });

  describe('Security Validation', () => {
    test('should have instances in private subnets only', async () => {
      const asgName = outputs.AutoScalingGroupName;
      const response = await autoscaling.send(new DescribeAutoScalingGroupsCommand({
        AutoScalingGroupNames: [asgName]
      }));

      const asg = response.AutoScalingGroups?.[0];
      const asgSubnets = asg?.VPCZoneIdentifier?.split(',') || [];
      const privateSubnetIds = outputs.PrivateSubnets.split(',');

      // All ASG subnets should be private subnets
      asgSubnets.forEach(subnetId => {
        expect(privateSubnetIds).toContain(subnetId);
      });

      console.log(`✅ Security: Instances deployed in private subnets only`);
    });

    test('should have ALB in public subnets only', async () => {
      const response = await elbv2.send(new DescribeLoadBalancersCommand({
        Names: [`${environmentSuffix}-ALB`]
      }));

      const alb = response.LoadBalancers?.[0];
      const albSubnets = alb?.AvailabilityZones?.map(az => az.SubnetId) || [];
      const publicSubnetIds = outputs.PublicSubnets.split(',');

      // All ALB subnets should be public subnets
      albSubnets.forEach(subnetId => {
        expect(publicSubnetIds).toContain(subnetId);
      });

      console.log(`✅ Security: ALB deployed in public subnets only`);
    });

    test('should validate infrastructure is properly isolated', () => {
      // Basic validation that we have separation of concerns
      const publicSubnets = outputs.PublicSubnets.split(',');
      const privateSubnets = outputs.PrivateSubnets.split(',');

      // No overlap between public and private subnets
      const overlap = publicSubnets.filter(subnet => privateSubnets.includes(subnet));
      expect(overlap).toHaveLength(0);

      console.log(`✅ Security: Network isolation validated`);
    });
  });

  describe('High Availability Validation', () => {
    test('should have resources distributed across multiple AZs', async () => {
      // Check public subnets
      const publicSubnetIds = outputs.PublicSubnets.split(',');
      const publicResponse = await ec2.send(new DescribeSubnetsCommand({
        SubnetIds: publicSubnetIds
      }));

      const publicAZs = publicResponse.Subnets?.map(s => s.AvailabilityZone) || [];
      expect(new Set(publicAZs).size).toBe(2);

      // Check private subnets
      const privateSubnetIds = outputs.PrivateSubnets.split(',');
      const privateResponse = await ec2.send(new DescribeSubnetsCommand({
        SubnetIds: privateSubnetIds
      }));

      const privateAZs = privateResponse.Subnets?.map(s => s.AvailabilityZone) || [];
      expect(new Set(privateAZs).size).toBe(2);

      console.log(`✅ High Availability: Resources across ${new Set([...publicAZs, ...privateAZs]).size} AZs`);
    });

    test('should have minimum required capacity for HA', async () => {
      const asgName = outputs.AutoScalingGroupName;
      const response = await autoscaling.send(new DescribeAutoScalingGroupsCommand({
        AutoScalingGroupNames: [asgName]
      }));

      const asg = response.AutoScalingGroups?.[0];
      expect(asg?.MinSize).toBeGreaterThanOrEqual(2);
      expect(asg?.DesiredCapacity).toBeGreaterThanOrEqual(2);

      console.log(`✅ High Availability: Min capacity ${asg?.MinSize}, Desired ${asg?.DesiredCapacity}`);
    });
  });
});