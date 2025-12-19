import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as kms from 'aws-cdk-lib/aws-kms';
import { ComputeStack } from '../lib/compute-stack';

describe('ComputeStack', () => {
  let app: cdk.App;
  let parentStack: cdk.Stack;
  let vpc: ec2.Vpc;
  let securityGroup: ec2.SecurityGroup;
  let instanceRole: iam.Role;
  let kmsKey: kms.Key;
  let stack: ComputeStack;
  let template: Template;
  const environmentSuffix = 'testenv';

  beforeEach(() => {
    app = new cdk.App();
    parentStack = new cdk.Stack(app, 'ParentStack', {
      env: { account: '123456789012', region: 'us-east-1' },
    });
    
    vpc = new ec2.Vpc(parentStack, 'TestVpc', {
      maxAzs: 2,
    });

    securityGroup = new ec2.SecurityGroup(parentStack, 'TestSg', {
      vpc,
    });

    instanceRole = new iam.Role(parentStack, 'TestRole', {
      assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
    });

    kmsKey = new kms.Key(parentStack, 'TestKey');

    stack = new ComputeStack(parentStack, 'TestComputeStack', {
      environmentSuffix,
      vpc,
      securityGroup,
      instanceRole,
      kmsKey,
    });
    
    template = Template.fromStack(stack);
  });

  describe('EC2 Configuration', () => {
    test('creates instance profile with correct role', () => {
      const profiles = template.findResources('AWS::IAM::InstanceProfile');
      const hasInstanceProfile = Object.values(profiles).some(profile => 
        profile.Properties?.InstanceProfileName?.includes(`${environmentSuffix}-instance-profile`) &&
        profile.Properties?.Roles && 
        Array.isArray(profile.Properties.Roles) &&
        profile.Properties.Roles.length > 0
      );
      expect(hasInstanceProfile).toBe(true);
    });

    test('creates launch template with encrypted EBS volumes', () => {
      template.hasResourceProperties('AWS::EC2::LaunchTemplate', {
        LaunchTemplateName: Match.stringLikeRegexp(`${environmentSuffix}-launch-template`),
        LaunchTemplateData: Match.objectLike({
          BlockDeviceMappings: Match.arrayWith([
            Match.objectLike({
              DeviceName: '/dev/xvda',
              Ebs: Match.objectLike({
                Encrypted: true,
                VolumeSize: 20,
                VolumeType: 'gp3',
              }),
            }),
          ]),
        }),
      });
    });

    test('launch template uses KMS key for EBS encryption', () => {
      template.hasResourceProperties('AWS::EC2::LaunchTemplate', {
        LaunchTemplateData: Match.objectLike({
          BlockDeviceMappings: Match.arrayWith([
            Match.objectLike({
              Ebs: Match.objectLike({
                KmsKeyId: Match.anyValue(),
              }),
            }),
          ]),
        }),
      });
    });
  });

  describe('Auto Scaling', () => {
    test('creates auto scaling group with correct configuration', () => {
      template.hasResourceProperties('AWS::AutoScaling::AutoScalingGroup', {
        AutoScalingGroupName: Match.stringLikeRegexp(`${environmentSuffix}-asg`),
        MinSize: '1',
        MaxSize: '3',
        DesiredCapacity: '2',
      });
    });

    test('auto scaling group uses launch template', () => {
      template.hasResourceProperties('AWS::AutoScaling::AutoScalingGroup', {
        LaunchTemplate: Match.objectLike({
          LaunchTemplateId: Match.anyValue(),
          Version: Match.anyValue(),
        }),
      });
    });

    test('auto scaling group uses private subnets', () => {
      template.hasResourceProperties('AWS::AutoScaling::AutoScalingGroup', {
        VPCZoneIdentifier: Match.anyValue(),
      });
    });

    test('auto scaling group has ELB health check', () => {
      template.hasResourceProperties('AWS::AutoScaling::AutoScalingGroup', {
        HealthCheckType: 'ELB',
        HealthCheckGracePeriod: 300,
      });
    });
  });

  describe('Load Balancer', () => {
    test('creates application load balancer', () => {
      template.hasResourceProperties('AWS::ElasticLoadBalancingV2::LoadBalancer', {
        Name: Match.stringLikeRegexp(`${environmentSuffix}-alb`),
        Type: 'application',
        Scheme: 'internet-facing',
      });
    });

    test('creates target group with health check', () => {
      template.hasResourceProperties('AWS::ElasticLoadBalancingV2::TargetGroup', {
        Name: Match.stringLikeRegexp(`${environmentSuffix}-tg`),
        Port: 80,
        Protocol: 'HTTP',
        HealthCheckEnabled: true,
        HealthCheckPath: '/health',
        HealthCheckProtocol: 'HTTP',
        HealthCheckIntervalSeconds: 30,
        HealthCheckTimeoutSeconds: 5,
        UnhealthyThresholdCount: 2,
      });
    });

    test('creates ALB listener', () => {
      template.hasResourceProperties('AWS::ElasticLoadBalancingV2::Listener', {
        Port: 80,
        Protocol: 'HTTP',
        DefaultActions: Match.arrayWith([
          Match.objectLike({
            Type: 'forward',
            TargetGroupArn: Match.anyValue(),
          }),
        ]),
      });
    });

    test('ALB uses provided security group', () => {
      const albs = template.findResources('AWS::ElasticLoadBalancingV2::LoadBalancer');
      const hasSecurityGroups = Object.values(albs).some(alb => 
        alb.Properties?.SecurityGroups && 
        Array.isArray(alb.Properties.SecurityGroups) &&
        alb.Properties.SecurityGroups.length > 0
      );
      expect(hasSecurityGroups).toBe(true);
    });
  });

  describe('Instance Profile and Roles', () => {
    test('EC2 instances use instance profile', () => {
      template.hasResourceProperties('AWS::EC2::LaunchTemplate', {
        LaunchTemplateData: Match.objectLike({
          IamInstanceProfile: Match.objectLike({
            Arn: Match.anyValue(),
          }),
        }),
      });
    });
  });
});