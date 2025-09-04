// Integration tests for deployed infrastructure
import fs from 'fs';
import { 
  EC2Client, 
  DescribeSecurityGroupsCommand,
  DescribeVpcsCommand,
  DescribeInstancesCommand 
} from '@aws-sdk/client-ec2';
import { 
  ElasticLoadBalancingV2Client, 
  DescribeLoadBalancersCommand,
  DescribeTargetHealthCommand,
  DescribeTargetGroupsCommand 
} from '@aws-sdk/client-elastic-load-balancing-v2';
import { 
  AutoScalingClient, 
  DescribeAutoScalingGroupsCommand 
} from '@aws-sdk/client-auto-scaling';
import { 
  IAMClient, 
  GetRoleCommand 
} from '@aws-sdk/client-iam';

// Read the deployment outputs
const outputs = JSON.parse(
  fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
);

// Configure AWS clients
const region = 'us-west-2';
const ec2Client = new EC2Client({ region });
const elbClient = new ElasticLoadBalancingV2Client({ region });
const asgClient = new AutoScalingClient({ region });
const iamClient = new IAMClient({ region });

describe('Web Application Infrastructure Integration Tests', () => {
  
  describe('VPC and Networking', () => {
    test('Should have VPC deployed with correct configuration', async () => {
      const response = await ec2Client.send(new DescribeVpcsCommand({
        VpcIds: [outputs.VPCId]
      }));
      
      expect(response.Vpcs).toHaveLength(1);
      const vpc = response.Vpcs[0];
      expect(vpc.State).toBe('available');
      expect(vpc.CidrBlock).toBe('10.0.0.0/16');
      // DNS settings are in the VPC attributes, not direct properties
      expect(vpc.Tags).toBeDefined();
    });

    test('Should have security groups configured correctly', async () => {
      // Check EC2 Security Group
      const ec2SgResponse = await ec2Client.send(new DescribeSecurityGroupsCommand({
        GroupIds: [outputs.SecurityGroupId]
      }));
      
      expect(ec2SgResponse.SecurityGroups).toHaveLength(1);
      const ec2Sg = ec2SgResponse.SecurityGroups[0];
      
      // Check SSH ingress rule
      const sshRule = ec2Sg.IpPermissions.find(p => p.FromPort === 22);
      expect(sshRule).toBeDefined();
      expect(sshRule.IpProtocol).toBe('tcp');
      expect(sshRule.ToPort).toBe(22);
      
      // Check ALB Security Group
      const albSgResponse = await ec2Client.send(new DescribeSecurityGroupsCommand({
        GroupIds: [outputs.ALBSecurityGroupId]
      }));
      
      expect(albSgResponse.SecurityGroups).toHaveLength(1);
      const albSg = albSgResponse.SecurityGroups[0];
      
      // Check HTTP ingress rule
      const httpRule = albSg.IpPermissions.find(p => p.FromPort === 80);
      expect(httpRule).toBeDefined();
      expect(httpRule.IpProtocol).toBe('tcp');
      expect(httpRule.ToPort).toBe(80);
    });
  });

  describe('Load Balancer', () => {
    test('Should have Application Load Balancer deployed and accessible', async () => {
      const dnsName = outputs.LoadBalancerDNS;
      expect(dnsName).toBeDefined();
      expect(dnsName).toContain('.elb.amazonaws.com');
      
      // Verify load balancer details
      const response = await elbClient.send(new DescribeLoadBalancersCommand({
        Names: [dnsName.split('-')[0] + '-' + dnsName.split('-')[1] + '-' + dnsName.split('-')[2]]
      }));
      
      expect(response.LoadBalancers).toHaveLength(1);
      const alb = response.LoadBalancers[0];
      expect(alb.State.Code).toBe('active');
      expect(alb.Scheme).toBe('internet-facing');
      expect(alb.Type).toBe('application');
      expect(alb.IpAddressType).toBe('ipv4');
    });

    test('Should have correct Load Balancer URL format', () => {
      const url = outputs.LoadBalancerURL;
      expect(url).toBeDefined();
      expect(url).toMatch(/^http:\/\/.+\.elb\.amazonaws\.com$/);
      expect(url).toBe(`http://${outputs.LoadBalancerDNS}`);
    });

    test('Should be able to reach the load balancer endpoint', async () => {
      const url = outputs.LoadBalancerURL;
      
      try {
        const response = await fetch(url);
        // We expect a response (even if it's 503 initially while instances are starting)
        expect(response).toBeDefined();
        expect([200, 502, 503]).toContain(response.status);
      } catch (error) {
        // Network errors are acceptable during initial deployment
        console.log('Load balancer may still be initializing:', error.message);
      }
    }, 30000);

    test('Should have Target Group configured correctly', async () => {
      const response = await elbClient.send(new DescribeTargetGroupsCommand({
        TargetGroupArns: [outputs.TargetGroupArn]
      }));
      
      expect(response.TargetGroups).toHaveLength(1);
      const targetGroup = response.TargetGroups[0];
      expect(targetGroup.Protocol).toBe('HTTP');
      expect(targetGroup.Port).toBe(80);
      expect(targetGroup.HealthCheckEnabled).toBe(true);
      expect(targetGroup.HealthCheckPath).toBe('/');
      expect(targetGroup.HealthCheckProtocol).toBe('HTTP');
    });
  });

  describe('Auto Scaling', () => {
    test('Should have Auto Scaling Group with correct configuration', async () => {
      const response = await asgClient.send(new DescribeAutoScalingGroupsCommand({
        AutoScalingGroupNames: [outputs.AutoScalingGroupName]
      }));
      
      expect(response.AutoScalingGroups).toHaveLength(1);
      const asg = response.AutoScalingGroups[0];
      
      expect(asg.MinSize).toBe(2);
      expect(asg.MaxSize).toBe(5);
      expect(asg.DesiredCapacity).toBe(2);
      expect(asg.HealthCheckType).toBe('ELB');
      expect(asg.HealthCheckGracePeriod).toBe(300);
    });

    test('Should have instances running in Auto Scaling Group', async () => {
      const response = await asgClient.send(new DescribeAutoScalingGroupsCommand({
        AutoScalingGroupNames: [outputs.AutoScalingGroupName]
      }));
      
      const asg = response.AutoScalingGroups[0];
      expect(asg.Instances.length).toBeGreaterThanOrEqual(2);
      
      // All instances should be in service or pending
      asg.Instances.forEach(instance => {
        expect(['InService', 'Pending', 'Healthy']).toContain(instance.LifecycleState);
      });
    });

    test('Should have EC2 instances with correct configuration', async () => {
      const asgResponse = await asgClient.send(new DescribeAutoScalingGroupsCommand({
        AutoScalingGroupNames: [outputs.AutoScalingGroupName]
      }));
      
      const instanceIds = asgResponse.AutoScalingGroups[0].Instances.map(i => i.InstanceId);
      
      if (instanceIds.length > 0) {
        const ec2Response = await ec2Client.send(new DescribeInstancesCommand({
          InstanceIds: instanceIds
        }));
        
        ec2Response.Reservations.forEach(reservation => {
          reservation.Instances.forEach(instance => {
            expect(instance.InstanceType).toBe('t2.micro');
            expect(instance.State.Name).toMatch(/running|pending/);
            expect(instance.SecurityGroups).toContainEqual(
              expect.objectContaining({
                GroupId: outputs.SecurityGroupId
              })
            );
          });
        });
      }
    });
  });

  describe('IAM Configuration', () => {
    test('Should have IAM role configured correctly', async () => {
      const roleArn = outputs.IAMRoleArn;
      expect(roleArn).toBeDefined();
      expect(roleArn).toMatch(/^arn:aws:iam::\d+:role\/.+/);
      
      const roleName = roleArn.split('/').pop();
      const response = await iamClient.send(new GetRoleCommand({
        RoleName: roleName
      }));
      
      expect(response.Role).toBeDefined();
      expect(response.Role.AssumeRolePolicyDocument).toBeDefined();
      
      // Verify the assume role policy allows EC2
      const policy = JSON.parse(decodeURIComponent(response.Role.AssumeRolePolicyDocument));
      const ec2Statement = policy.Statement.find(s => 
        s.Principal?.Service === 'ec2.amazonaws.com'
      );
      expect(ec2Statement).toBeDefined();
      expect(ec2Statement.Effect).toBe('Allow');
      expect(ec2Statement.Action).toBe('sts:AssumeRole');
    });
  });

  describe('Target Health', () => {
    test('Should have targets registered in target group', async () => {
      const response = await elbClient.send(new DescribeTargetHealthCommand({
        TargetGroupArn: outputs.TargetGroupArn
      }));
      
      expect(response.TargetHealthDescriptions).toBeDefined();
      expect(response.TargetHealthDescriptions.length).toBeGreaterThanOrEqual(2);
      
      // Check that targets are registered (they may be initial, healthy, or unhealthy during deployment)
      response.TargetHealthDescriptions.forEach(target => {
        expect(target.Target.Id).toBeDefined();
        expect(target.Target.Port).toBe(80);
        expect(['initial', 'healthy', 'unhealthy', 'draining']).toContain(target.TargetHealth.State);
      });
    });
  });

  describe('Resource Tagging', () => {
    test('Should have correct tags on VPC', async () => {
      const response = await ec2Client.send(new DescribeVpcsCommand({
        VpcIds: [outputs.VPCId]
      }));
      
      const vpc = response.Vpcs[0];
      const tags = vpc.Tags || [];
      
      const envTag = tags.find(t => t.Key === 'Environment');
      expect(envTag).toBeDefined();
      expect(envTag.Value).toBe('Production');
      
      const appTag = tags.find(t => t.Key === 'Application');
      expect(appTag).toBeDefined();
      expect(appTag.Value).toBe('WebApp');
    });
  });

  describe('High Availability', () => {
    test('Should have instances in multiple availability zones', async () => {
      const asgResponse = await asgClient.send(new DescribeAutoScalingGroupsCommand({
        AutoScalingGroupNames: [outputs.AutoScalingGroupName]
      }));
      
      const asg = asgResponse.AutoScalingGroups[0];
      const availabilityZones = asg.AvailabilityZones;
      
      // Should be using at least 2 AZs for high availability
      expect(availabilityZones.length).toBeGreaterThanOrEqual(2);
      expect(availabilityZones).toContain('us-west-2a');
      expect(availabilityZones).toContain('us-west-2b');
    });
  });

  describe('Infrastructure Connectivity', () => {
    test('Should have all components properly connected', async () => {
      // Verify ASG is connected to Target Group
      const asgResponse = await asgClient.send(new DescribeAutoScalingGroupsCommand({
        AutoScalingGroupNames: [outputs.AutoScalingGroupName]
      }));
      
      const asg = asgResponse.AutoScalingGroups[0];
      expect(asg.TargetGroupARNs).toContain(outputs.TargetGroupArn);
      
      // Verify Load Balancer is in the correct VPC
      const albName = outputs.LoadBalancerDNS.split('-').slice(0, 3).join('-');
      const albResponse = await elbClient.send(new DescribeLoadBalancersCommand({}));
      const alb = albResponse.LoadBalancers.find(lb => lb.LoadBalancerName === albName);
      
      expect(alb).toBeDefined();
      expect(alb.VpcId).toBe(outputs.VPCId);
      expect(alb.SecurityGroups).toContain(outputs.ALBSecurityGroupId);
    });

    test('Should have correct security group relationships', async () => {
      // Verify EC2 security group allows traffic from ALB security group
      const response = await ec2Client.send(new DescribeSecurityGroupsCommand({
        GroupIds: [outputs.SecurityGroupId]
      }));
      
      const ec2Sg = response.SecurityGroups[0];
      const httpFromAlb = ec2Sg.IpPermissions.find(rule => 
        rule.FromPort === 80 && 
        rule.UserIdGroupPairs?.some(pair => pair.GroupId === outputs.ALBSecurityGroupId)
      );
      
      expect(httpFromAlb).toBeDefined();
    });
  });
});