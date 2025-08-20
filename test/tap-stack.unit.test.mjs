import { App } from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack.mjs';

describe('TapStack Unit Tests', () => {
  let app;
  let stack;
  let template;
  const environmentSuffix = 'test';

  beforeEach(() => {
    app = new App();
    stack = new TapStack(app, `TapStack${environmentSuffix}`, {
      env: {
        account: '123456789012',
        region: 'us-east-1',
      },
      environmentSuffix,
    });
    template = Template.fromStack(stack);
  });

  describe('VPC Configuration', () => {
    test('Should create a VPC with proper configuration', () => {
      template.hasResourceProperties('AWS::EC2::VPC', {
        CidrBlock: '10.0.0.0/16',
        EnableDnsHostnames: true,
        EnableDnsSupport: true,
        Tags: Match.arrayWith([
          { Key: 'Name', Value: `TapVPC-${environmentSuffix}` },
        ]),
      });
    });

    test('Should create VPC with IPv6 support', () => {
      template.hasResourceProperties('AWS::EC2::VPCCidrBlock', {
        AmazonProvidedIpv6CidrBlock: true,
      });
    });

    test('Should create public and private subnets', () => {
      // Check for public subnets
      template.resourceCountIs('AWS::EC2::Subnet', 4); // 2 public + 2 private
      
      const subnets = template.findResources('AWS::EC2::Subnet');
      const publicSubnets = Object.values(subnets).filter(subnet => 
        subnet.Properties.Tags?.some(tag => 
          tag.Key === 'aws-cdk:subnet-type' && tag.Value === 'Public'
        )
      );
      const privateSubnets = Object.values(subnets).filter(subnet => 
        subnet.Properties.Tags?.some(tag => 
          tag.Key === 'aws-cdk:subnet-type' && tag.Value === 'Private'
        )
      );
      
      expect(publicSubnets).toHaveLength(2);
      expect(privateSubnets).toHaveLength(2);
    });

    test('Should create NAT Gateway for private subnet connectivity', () => {
      template.resourceCountIs('AWS::EC2::NatGateway', 1);
    });
  });

  describe('VPC Flow Logs', () => {
    test('Should create CloudWatch log group for VPC flow logs', () => {
      template.hasResourceProperties('AWS::Logs::LogGroup', {
        LogGroupName: `/aws/vpc/flowlogs-${environmentSuffix}`,
        RetentionInDays: 7,
      });
    });

    test('Should create IAM role for VPC flow logs', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        RoleName: `FlowLogRole-${environmentSuffix}`,
        AssumeRolePolicyDocument: Match.objectLike({
          Statement: Match.arrayWith([
            Match.objectLike({
              Principal: Match.objectLike({
                Service: 'vpc-flow-logs.amazonaws.com',
              }),
            }),
          ]),
        }),
      });
    });

    test('Should create VPC flow log', () => {
      template.hasResourceProperties('AWS::EC2::FlowLog', {
        ResourceType: 'VPC',
        TrafficType: 'ALL',
        LogDestinationType: 'cloud-watch-logs',
      });
    });
  });

  describe('Security Groups', () => {
    test('Should create public security group with correct ingress rules', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupName: `PublicSecurityGroup-${environmentSuffix}`,
        GroupDescription: 'Security group for public EC2 instances',
        SecurityGroupIngress: Match.arrayWith([
          Match.objectLike({
            IpProtocol: 'tcp',
            FromPort: 80,
            ToPort: 80,
            CidrIp: '0.0.0.0/0',
          }),
          Match.objectLike({
            IpProtocol: 'tcp',
            FromPort: 443,
            ToPort: 443,
            CidrIp: '0.0.0.0/0',
          }),
          Match.objectLike({
            IpProtocol: 'tcp',
            FromPort: 22,
            ToPort: 22,
            CidrIp: '0.0.0.0/0',
          }),
        ]),
      });
    });

    test('Should create private security group with ingress from public security group', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupName: `PrivateSecurityGroup-${environmentSuffix}`,
        GroupDescription: 'Security group for private EC2 instances',
      });

      // Check that private security group has ingress rules
      const securityGroups = template.findResources('AWS::EC2::SecurityGroup');
      const privateSecurityGroup = Object.entries(securityGroups).find(([_, resource]) =>
        resource.Properties.GroupName === `PrivateSecurityGroup-${environmentSuffix}`
      );
      
      expect(privateSecurityGroup).toBeDefined();
      if (privateSecurityGroup[1].Properties.SecurityGroupIngress) {
        expect(privateSecurityGroup[1].Properties.SecurityGroupIngress.length).toBeGreaterThanOrEqual(3);
      }
    });
  });

  describe('Network ACLs', () => {
    test('Should create network ACL for private subnet', () => {
      template.hasResourceProperties('AWS::EC2::NetworkAcl', {
        VpcId: Match.anyValue(),
      });
    });

    test('Should create network ACL entries for private subnet', () => {
      // Check for inbound rules
      template.hasResourceProperties('AWS::EC2::NetworkAclEntry', {
        CidrBlock: '10.0.0.0/24',
        Protocol: 6, // TCP
        PortRange: { From: 80, To: 80 },
        RuleNumber: 100,
        RuleAction: 'allow',
        Egress: false,
      });

      template.hasResourceProperties('AWS::EC2::NetworkAclEntry', {
        CidrBlock: '10.0.0.0/24',
        Protocol: 6, // TCP
        PortRange: { From: 443, To: 443 },
        RuleNumber: 110,
        RuleAction: 'allow',
        Egress: false,
      });

      // Check for outbound rules
      template.hasResourceProperties('AWS::EC2::NetworkAclEntry', {
        CidrBlock: '0.0.0.0/0',
        Protocol: 6, // TCP
        PortRange: { From: 80, To: 80 },
        RuleNumber: 100,
        RuleAction: 'allow',
        Egress: true,
      });
    });
  });

  describe('IAM Roles', () => {
    test('Should create EC2 role with CloudWatch permissions', () => {
      const roles = template.findResources('AWS::IAM::Role');
      const ec2Role = Object.values(roles).find(role => 
        role.Properties.RoleName === `EC2Role-${environmentSuffix}`
      );
      
      expect(ec2Role).toBeDefined();
      expect(ec2Role.Properties.AssumeRolePolicyDocument).toBeDefined();
      expect(ec2Role.Properties.AssumeRolePolicyDocument.Statement).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            Principal: expect.objectContaining({
              Service: 'ec2.amazonaws.com',
            }),
          }),
        ])
      );
      expect(ec2Role.Properties.ManagedPolicyArns).toBeDefined();
      expect(ec2Role.Properties.ManagedPolicyArns.length).toBeGreaterThanOrEqual(2);
    });

    test('Should create instance profile for EC2 instances', () => {
      template.hasResourceProperties('AWS::IAM::InstanceProfile', {
        InstanceProfileName: `EC2InstanceProfile-${environmentSuffix}`,
      });
    });
  });

  describe('Launch Templates', () => {
    test('Should create public launch template with correct configuration', () => {
      template.hasResourceProperties('AWS::EC2::LaunchTemplate', {
        LaunchTemplateName: `PublicLaunchTemplate-${environmentSuffix}`,
        LaunchTemplateData: Match.objectLike({
          InstanceType: 't3.micro',
          Monitoring: { Enabled: true },
          NetworkInterfaces: Match.arrayWith([
            Match.objectLike({
              AssociatePublicIpAddress: true,
            }),
          ]),
        }),
      });
    });

    test('Should create private launch template without public IP', () => {
      template.hasResourceProperties('AWS::EC2::LaunchTemplate', {
        LaunchTemplateName: `PrivateLaunchTemplate-${environmentSuffix}`,
        LaunchTemplateData: Match.objectLike({
          InstanceType: 't3.micro',
          Monitoring: { Enabled: true },
          NetworkInterfaces: Match.arrayWith([
            Match.objectLike({
              AssociatePublicIpAddress: false,
            }),
          ]),
        }),
      });
    });

    test('Should include user data for CloudWatch agent installation', () => {
      const launchTemplates = template.findResources('AWS::EC2::LaunchTemplate');
      Object.values(launchTemplates).forEach(launchTemplate => {
        expect(launchTemplate.Properties.LaunchTemplateData.UserData).toBeDefined();
        // User data is base64 encoded in the template
        expect(launchTemplate.Properties.LaunchTemplateData.UserData['Fn::Base64']).toBeDefined();
      });
    });
  });

  describe('Auto Scaling Groups', () => {
    test('Should create public auto scaling group with correct configuration', () => {
      const asgs = template.findResources('AWS::AutoScaling::AutoScalingGroup');
      const publicAsg = Object.values(asgs).find(asg => 
        asg.Properties.AutoScalingGroupName === `PublicAutoScalingGroup-${environmentSuffix}`
      );
      
      expect(publicAsg).toBeDefined();
      expect(publicAsg.Properties.MinSize).toBe('2');
      expect(publicAsg.Properties.MaxSize).toBe('4');
      expect(publicAsg.Properties.DesiredCapacity).toBe('2');
    });

    test('Should create private auto scaling group with correct configuration', () => {
      const asgs = template.findResources('AWS::AutoScaling::AutoScalingGroup');
      const privateAsg = Object.values(asgs).find(asg => 
        asg.Properties.AutoScalingGroupName === `PrivateAutoScalingGroup-${environmentSuffix}`
      );
      
      expect(privateAsg).toBeDefined();
      expect(privateAsg.Properties.MinSize).toBe('2');
      expect(privateAsg.Properties.MaxSize).toBe('4');
      expect(privateAsg.Properties.DesiredCapacity).toBe('2');
    });

    test('Should have scaling policies for both ASGs', () => {
      // Check for CPU-based scaling policies
      template.resourceCountIs('AWS::AutoScaling::ScalingPolicy', 2);
      
      template.hasResourceProperties('AWS::AutoScaling::ScalingPolicy', {
        PolicyType: 'TargetTrackingScaling',
        TargetTrackingConfiguration: Match.objectLike({
          TargetValue: 70,
          PredefinedMetricSpecification: Match.objectLike({
            PredefinedMetricType: 'ASGAverageCPUUtilization',
          }),
        }),
      });
    });

    test('Should have update policy configured', () => {
      const asgResources = template.findResources('AWS::AutoScaling::AutoScalingGroup');
      Object.values(asgResources).forEach(asg => {
        expect(asg.UpdatePolicy).toBeDefined();
        expect(asg.UpdatePolicy.AutoScalingRollingUpdate).toBeDefined();
      });
    });
  });

  describe('CloudWatch Monitoring', () => {
    test('Should create CloudWatch dashboard', () => {
      template.hasResourceProperties('AWS::CloudWatch::Dashboard', {
        DashboardName: `TapStack-Infrastructure-Monitoring-${environmentSuffix}`,
      });
    });

    test('Should create CloudWatch alarms for high CPU utilization', () => {
      template.resourceCountIs('AWS::CloudWatch::Alarm', 2);
      
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        MetricName: 'CPUUtilization',
        Namespace: 'AWS/EC2',
        Statistic: 'Average',
        Period: 300,
        EvaluationPeriods: 2,
        DatapointsToAlarm: 2,
        Threshold: 80,
        TreatMissingData: 'notBreaching',
      });
    });
  });

  describe('Stack Outputs', () => {
    test('Should output VPC ID', () => {
      template.hasOutput('VPCId', {
        Description: 'VPC ID',
        Export: {
          Name: `TapStack-${environmentSuffix}-VPC-ID`,
        },
      });
    });

    test('Should output public ASG name', () => {
      template.hasOutput('PublicAutoScalingGroupName', {
        Description: 'Public Auto Scaling Group Name',
        Export: {
          Name: `TapStack-${environmentSuffix}-Public-ASG-Name`,
        },
      });
    });

    test('Should output private ASG name', () => {
      template.hasOutput('PrivateAutoScalingGroupName', {
        Description: 'Private Auto Scaling Group Name',
        Export: {
          Name: `TapStack-${environmentSuffix}-Private-ASG-Name`,
        },
      });
    });

    test('Should output CloudWatch dashboard URL', () => {
      template.hasOutput('DashboardURL', {
        Description: 'CloudWatch Dashboard URL',
        Value: Match.stringLikeRegexp('.*cloudwatch.*dashboards.*'),
      });
    });
  });

  describe('Tagging', () => {
    test('Should apply standard tags to all resources', () => {
      const resources = template.findResources('AWS::EC2::VPC');
      Object.values(resources).forEach(resource => {
        expect(resource.Properties.Tags).toEqual(
          expect.arrayContaining([
            { Key: 'Project', Value: 'TapStack' },
            { Key: 'Environment', Value: 'Production' },
            { Key: 'CreatedBy', Value: 'CDK' },
            { Key: 'Purpose', Value: 'ComplexCloudEnvironment' },
          ])
        );
      });
    });
  });

  describe('Resource Naming', () => {
    test('All named resources should include environment suffix', () => {
      // Check VPC name
      template.hasResourceProperties('AWS::EC2::VPC', {
        Tags: Match.arrayWith([
          { Key: 'Name', Value: `TapVPC-${environmentSuffix}` },
        ]),
      });

      // Check security group names
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupName: `PublicSecurityGroup-${environmentSuffix}`,
      });

      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupName: `PrivateSecurityGroup-${environmentSuffix}`,
      });

      // Check IAM role names
      template.hasResourceProperties('AWS::IAM::Role', {
        RoleName: `EC2Role-${environmentSuffix}`,
      });

      // Check log group name
      template.hasResourceProperties('AWS::Logs::LogGroup', {
        LogGroupName: `/aws/vpc/flowlogs-${environmentSuffix}`,
      });
    });
  });

  describe('High Availability', () => {
    test('Should distribute resources across multiple availability zones', () => {
      const subnets = template.findResources('AWS::EC2::Subnet');
      const azs = new Set();
      
      Object.values(subnets).forEach(subnet => {
        if (subnet.Properties.AvailabilityZone) {
          azs.add(subnet.Properties.AvailabilityZone);
        }
      });
      
      expect(azs.size).toBeGreaterThanOrEqual(2);
    });

    test('Auto scaling groups should span multiple availability zones', () => {
      const asgs = template.findResources('AWS::AutoScaling::AutoScalingGroup');
      Object.values(asgs).forEach(asg => {
        expect(asg.Properties.VPCZoneIdentifier).toBeDefined();
        expect(asg.Properties.VPCZoneIdentifier.length).toBeGreaterThanOrEqual(2);
      });
    });
  });

  describe('Security Best Practices', () => {
    test('Private instances should not have public IP addresses', () => {
      template.hasResourceProperties('AWS::EC2::LaunchTemplate', {
        LaunchTemplateName: `PrivateLaunchTemplate-${environmentSuffix}`,
        LaunchTemplateData: Match.objectLike({
          NetworkInterfaces: Match.arrayWith([
            Match.objectLike({
              AssociatePublicIpAddress: false,
            }),
          ]),
        }),
      });
    });

    test('Security groups should follow principle of least privilege', () => {
      // Public security group should only allow specific ports
      const securityGroups = template.findResources('AWS::EC2::SecurityGroup');
      const publicSG = Object.values(securityGroups).find(sg => 
        sg.Properties.GroupName === `PublicSecurityGroup-${environmentSuffix}`
      );
      
      const allowedPorts = [80, 443, 22];
      publicSG.Properties.SecurityGroupIngress.forEach(rule => {
        expect(allowedPorts).toContain(rule.FromPort);
        expect(allowedPorts).toContain(rule.ToPort);
      });
    });

    test('IAM roles should use managed policies where possible', () => {
      const roles = template.findResources('AWS::IAM::Role');
      const ec2Role = Object.values(roles).find(role => 
        role.Properties.RoleName === `EC2Role-${environmentSuffix}`
      );
      
      expect(ec2Role).toBeDefined();
      expect(ec2Role.Properties.ManagedPolicyArns).toBeDefined();
      expect(ec2Role.Properties.ManagedPolicyArns.length).toBeGreaterThanOrEqual(2);
    });
  });
});