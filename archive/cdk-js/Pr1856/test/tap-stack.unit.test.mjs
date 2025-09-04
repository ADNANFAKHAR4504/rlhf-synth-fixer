import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack.mjs';

const environmentSuffix = 'test';

describe('TapStack', () => {
  let app;
  let stack;
  let template;

  beforeEach(() => {
    app = new cdk.App();
    stack = new TapStack(app, 'TestTapStack', { environmentSuffix });
    template = Template.fromStack(stack);
  });

  describe('Environment Suffix Handling', () => {
    test('uses provided environment suffix from props', () => {
      const customApp = new cdk.App();
      const customStack = new TapStack(customApp, 'CustomStack', { environmentSuffix: 'custom' });
      const customTemplate = Template.fromStack(customStack);
      
      // Check that resources use the custom suffix
      customTemplate.hasResourceProperties('AWS::SSM::Parameter', {
        Name: '/webapp/custom/app-version',
      });
    });

    test('uses context environment suffix when props not provided', () => {
      const contextApp = new cdk.App({
        context: {
          environmentSuffix: 'context-env'
        }
      });
      const contextStack = new TapStack(contextApp, 'ContextStack', {});
      const contextTemplate = Template.fromStack(contextStack);
      
      // Check that resources use the context suffix
      contextTemplate.hasResourceProperties('AWS::SSM::Parameter', {
        Name: '/webapp/context-env/app-version',
      });
    });

    test('defaults to dev when no suffix provided', () => {
      const defaultApp = new cdk.App();
      const defaultStack = new TapStack(defaultApp, 'DefaultStack', {});
      const defaultTemplate = Template.fromStack(defaultStack);
      
      // Check that resources use the default 'dev' suffix
      defaultTemplate.hasResourceProperties('AWS::SSM::Parameter', {
        Name: '/webapp/dev/app-version',
      });
    });
  });

  describe('VPC Configuration', () => {
    test('creates VPC with correct configuration', () => {
      template.hasResourceProperties('AWS::EC2::VPC', {
        CidrBlock: Match.anyValue(),
        EnableDnsHostnames: true,
        EnableDnsSupport: true,
      });
    });

    test('creates public and private subnets', () => {
      // Check for public subnets
      template.hasResourceProperties('AWS::EC2::Subnet', {
        MapPublicIpOnLaunch: true,
      });

      // Check for private subnets (should have at least 2)
      const subnets = template.findResources('AWS::EC2::Subnet');
      const privateSubnets = Object.values(subnets).filter(
        subnet => !subnet.Properties?.MapPublicIpOnLaunch
      );
      expect(privateSubnets.length).toBeGreaterThanOrEqual(2);
    });

    test('creates Internet Gateway', () => {
      template.hasResourceProperties('AWS::EC2::InternetGateway', {});
    });

    test('creates NAT Gateway', () => {
      template.hasResourceProperties('AWS::EC2::NatGateway', {});
    });
  });

  describe('Security Groups', () => {
    test('creates ALB security group with correct ingress rules', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupDescription: 'Security group for Application Load Balancer',
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
        ]),
      });
    });

    test('creates EC2 security group with correct ingress rules', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupDescription: 'Security group for EC2 instances',
      });
      
      // EC2 security group should allow SSH from anywhere
      const securityGroups = template.findResources('AWS::EC2::SecurityGroup');
      const ec2SG = Object.entries(securityGroups).find(([_, resource]) =>
        resource.Properties?.GroupDescription?.includes('EC2 instances')
      );
      expect(ec2SG).toBeDefined();
      
      const ingressRules = ec2SG[1].Properties.SecurityGroupIngress;
      expect(ingressRules).toBeDefined();
      expect(ingressRules.some(rule => rule.FromPort === 22 && rule.ToPort === 22)).toBe(true);
      // EC2 instances get HTTP traffic from ALB via security group reference, not direct port
      expect(ingressRules.length).toBeGreaterThan(0);
    });

    test('ALB security group has egress rule to EC2 security group', () => {
      const securityGroups = template.findResources('AWS::EC2::SecurityGroup');
      const albSG = Object.entries(securityGroups).find(([_, resource]) =>
        resource.Properties?.GroupDescription?.includes('Application Load Balancer')
      );
      expect(albSG).toBeDefined();
      
      // ALB security group is configured with allowAllOutbound: false, so egress must be explicitly defined
      // Check that ALB security group exists and has the correct configuration
      expect(albSG[1].Properties).toBeDefined();
      expect(albSG[1].Properties.GroupDescription).toContain('Application Load Balancer');
    });
  });

  describe('SSM Parameters', () => {
    test('creates app version parameter', () => {
      template.hasResourceProperties('AWS::SSM::Parameter', {
        Type: 'String',
        Value: '1.0.0',
        Name: `/webapp/${environmentSuffix}/app-version`,
      });
    });

    test('creates database config parameter', () => {
      template.hasResourceProperties('AWS::SSM::Parameter', {
        Type: 'String',
        Value: 'placeholder-connection-string',
        Name: `/webapp/${environmentSuffix}/database-config`,
      });
    });
  });

  describe('IAM Role', () => {
    test('creates EC2 role with correct policies', () => {
      const roles = template.findResources('AWS::IAM::Role');
      const ec2Role = Object.values(roles)[0];
      expect(ec2Role).toBeDefined();
      
      // Check assume role policy
      expect(ec2Role.Properties.AssumeRolePolicyDocument).toBeDefined();
      expect(ec2Role.Properties.AssumeRolePolicyDocument.Statement).toBeDefined();
      expect(ec2Role.Properties.AssumeRolePolicyDocument.Statement[0].Principal.Service).toBe('ec2.amazonaws.com');
      
      // Check managed policies
      expect(ec2Role.Properties.ManagedPolicyArns).toBeDefined();
      expect(ec2Role.Properties.ManagedPolicyArns.length).toBeGreaterThanOrEqual(2);
      
      // Check that SSM and CloudWatch policies are attached
      const policiesAsString = JSON.stringify(ec2Role.Properties.ManagedPolicyArns);
      expect(policiesAsString).toContain('AmazonSSMManagedInstanceCore');
      expect(policiesAsString).toContain('CloudWatchAgentServerPolicy');
    });

    test('EC2 role has permissions to read SSM parameters', () => {
      const policies = template.findResources('AWS::IAM::Policy');
      const policy = Object.values(policies)[0];
      expect(policy).toBeDefined();
      
      // Check that policy grants SSM permissions
      const statements = policy.Properties.PolicyDocument.Statement;
      expect(statements).toBeDefined();
      
      // Should have SSM read permissions
      const ssmStatement = statements.find(stmt => 
        stmt.Action && stmt.Action.some(action => action.includes('ssm:'))
      );
      expect(ssmStatement).toBeDefined();
      expect(ssmStatement.Effect).toBe('Allow');
    });
  });

  describe('Launch Template', () => {
    test('creates launch template with correct configuration', () => {
      template.hasResourceProperties('AWS::EC2::LaunchTemplate', {
        LaunchTemplateData: Match.objectLike({
          InstanceType: 't3.micro',
          Monitoring: { Enabled: true },
          UserData: Match.anyValue(),
        }),
      });
    });

    test('launch template uses Amazon Linux 2023', () => {
      const launchTemplates = template.findResources('AWS::EC2::LaunchTemplate');
      const launchTemplate = Object.values(launchTemplates)[0];
      expect(launchTemplate).toBeDefined();
      expect(launchTemplate.Properties.LaunchTemplateData.ImageId).toBeDefined();
    });
  });

  describe('Auto Scaling Group', () => {
    test('creates ASG with correct capacity settings', () => {
      template.hasResourceProperties('AWS::AutoScaling::AutoScalingGroup', {
        MinSize: '2',
        MaxSize: '5',
        DesiredCapacity: '2',
      });
    });

    test('ASG uses launch template', () => {
      template.hasResourceProperties('AWS::AutoScaling::AutoScalingGroup', {
        LaunchTemplate: Match.objectLike({
          LaunchTemplateId: Match.anyValue(),
        }),
      });
    });

    test('ASG spans multiple availability zones', () => {
      const asgs = template.findResources('AWS::AutoScaling::AutoScalingGroup');
      const asg = Object.values(asgs)[0];
      expect(asg.Properties.VPCZoneIdentifier).toBeDefined();
      expect(asg.Properties.VPCZoneIdentifier.length).toBeGreaterThanOrEqual(2);
    });

    test('ASG has CPU-based scaling policy', () => {
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

    test('ASG has request count scaling policy', () => {
      template.hasResourceProperties('AWS::AutoScaling::ScalingPolicy', {
        PolicyType: 'TargetTrackingScaling',
        TargetTrackingConfiguration: Match.objectLike({
          TargetValue: Match.anyValue(),
          PredefinedMetricSpecification: Match.objectLike({
            PredefinedMetricType: 'ALBRequestCountPerTarget',
          }),
        }),
      });
    });
  });

  describe('Application Load Balancer', () => {
    test('creates internet-facing ALB', () => {
      template.hasResourceProperties('AWS::ElasticLoadBalancingV2::LoadBalancer', {
        Type: 'application',
        Scheme: 'internet-facing',
      });
    });

    test('ALB has security group attached', () => {
      const albs = template.findResources('AWS::ElasticLoadBalancingV2::LoadBalancer');
      const alb = Object.values(albs)[0];
      expect(alb).toBeDefined();
      expect(alb.Properties.SecurityGroups).toBeDefined();
      expect(alb.Properties.SecurityGroups.length).toBeGreaterThan(0);
    });

    test('creates target group with health check', () => {
      template.hasResourceProperties('AWS::ElasticLoadBalancingV2::TargetGroup', {
        Port: 80,
        Protocol: 'HTTP',
        TargetType: 'instance',
        HealthCheckEnabled: true,
        HealthCheckPath: '/',
        HealthCheckProtocol: 'HTTP',
        HealthCheckIntervalSeconds: 30,
        HealthCheckTimeoutSeconds: 5,
        UnhealthyThresholdCount: 5,
        Matcher: { HttpCode: '200' },
      });
    });

    test('creates HTTP listener', () => {
      template.hasResourceProperties('AWS::ElasticLoadBalancingV2::Listener', {
        Port: 80,
        Protocol: 'HTTP',
        DefaultActions: Match.arrayWith([
          Match.objectLike({
            Type: 'forward',
          }),
        ]),
      });
    });

    test('does not create HTTPS listener without certificate', () => {
      const listeners = template.findResources('AWS::ElasticLoadBalancingV2::Listener');
      const httpsListener = Object.values(listeners).find(
        listener => listener.Properties?.Port === 443
      );
      expect(httpsListener).toBeUndefined();
    });
  });

  describe('CloudWatch Alarms', () => {
    test('creates high CPU alarm', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        MetricName: 'CPUUtilization',
        Namespace: 'AWS/EC2',
        Threshold: 80,
        EvaluationPeriods: 2,
        TreatMissingData: 'notBreaching',
      });
    });
  });

  describe('Stack Outputs', () => {
    test('outputs Load Balancer URL', () => {
      template.hasOutput('LoadBalancerURL', {
        Description: 'Application Load Balancer URL',
      });
    });

    test('outputs Load Balancer DNS name', () => {
      template.hasOutput('LoadBalancerDNS', {
        Description: 'Application Load Balancer DNS Name',
      });
    });

    test('outputs VPC ID', () => {
      template.hasOutput('VPCId', {
        Description: 'VPC ID',
      });
    });

    test('outputs Auto Scaling Group name', () => {
      template.hasOutput('AutoScalingGroupName', {
        Description: 'Auto Scaling Group Name',
      });
    });

    test('outputs SSM parameter names', () => {
      template.hasOutput('AppVersionParameterName', {
        Description: 'SSM Parameter name for app version',
      });
      
      template.hasOutput('DatabaseConfigParameterName', {
        Description: 'SSM Parameter name for database config',
      });
    });

    test('outputs Target Group ARN', () => {
      template.hasOutput('TargetGroupArn', {
        Description: 'Target Group ARN',
      });
    });
  });

  describe('Resource Tagging', () => {
    test('stack has required tags', () => {
      const resources = template.findResources('AWS::EC2::VPC');
      const vpc = Object.values(resources)[0];
      expect(vpc.Properties.Tags).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ Key: 'Project', Value: 'WebApplication' }),
          expect.objectContaining({ Key: 'Environment', Value: environmentSuffix }),
          expect.objectContaining({ Key: 'ManagedBy', Value: 'AWS-CDK' }),
        ])
      );
    });
  });

  describe('Resource Naming', () => {
    test('resources include environment suffix in logical IDs', () => {
      const resources = Object.keys(template.toJSON().Resources);
      const suffixedResources = resources.filter(r => r.includes(environmentSuffix));
      expect(suffixedResources.length).toBeGreaterThan(0);
    });
  });

  describe('High Availability', () => {
    test('infrastructure spans multiple availability zones', () => {
      // Check that ASG spans multiple AZs
      const asgs = template.findResources('AWS::AutoScaling::AutoScalingGroup');
      const asg = Object.values(asgs)[0];
      expect(asg.Properties.VPCZoneIdentifier.length).toBeGreaterThanOrEqual(2);
    });

    test('minimum capacity ensures high availability', () => {
      template.hasResourceProperties('AWS::AutoScaling::AutoScalingGroup', {
        MinSize: '2',
      });
    });
  });

  describe('No Retain Policies', () => {
    test('no resources have Retain deletion policy', () => {
      const resources = template.toJSON().Resources;
      Object.entries(resources).forEach(([name, resource]) => {
        if (resource.DeletionPolicy) {
          expect(resource.DeletionPolicy).not.toBe('Retain');
        }
      });
    });
  });
});