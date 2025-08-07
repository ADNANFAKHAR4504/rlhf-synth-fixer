import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { ProjectXInfrastructureStack } from '../lib/tap-stack';

describe('ProjectX Infrastructure Integration Tests', () => {
  let app: cdk.App;
  let stack: ProjectXInfrastructureStack;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();
    stack = new ProjectXInfrastructureStack(app, 'TestProjectXStack', {
      description: 'ProjectX Infrastructure Stack - test',
      env: { account: '123456789012', region: 'us-west-2' },
    });
    template = Template.fromStack(stack);
  });

  describe('Infrastructure Validation', () => {
    test('should have proper infrastructure setup', () => {
      // Verify VPC is created with correct configuration
      template.hasResourceProperties('AWS::EC2::VPC', {
        CidrBlock: '10.0.0.0/16',
        EnableDnsHostnames: true,
        EnableDnsSupport: true,
      });

      // Verify Auto Scaling Group is created
      template.hasResourceProperties('AWS::AutoScaling::AutoScalingGroup', {
        MinSize: '2',
        MaxSize: '6',
        DesiredCapacity: '2',
        HealthCheckType: 'EC2',
      });

      // Verify Security Group has restricted SSH access
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupDescription: 'Security group for ProjectX web servers allowing HTTP/HTTPS traffic',
        SecurityGroupIngress: [
          {
            CidrIp: '0.0.0.0/0',
            FromPort: 80,
            ToPort: 80,
            IpProtocol: 'tcp',
          },
          {
            CidrIp: '0.0.0.0/0',
            FromPort: 443,
            ToPort: 443,
            IpProtocol: 'tcp',
          },
          {
            CidrIp: '10.0.0.0/8', // Office network only
            FromPort: 22,
            ToPort: 22,
            IpProtocol: 'tcp',
          },
        ],
      });

      // Verify CloudWatch Alarms are created
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        MetricName: 'CPUUtilization',
        Namespace: 'AWS/AutoScaling',
        Threshold: 80,
        EvaluationPeriods: 2,
      });

      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        MetricName: 'GroupDesiredCapacity',
        Namespace: 'AWS/AutoScaling',
        Threshold: 4,
        EvaluationPeriods: 2,
      });

      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        MetricName: 'GroupInServiceInstances',
        Namespace: 'AWS/AutoScaling',
        Threshold: 1,
        EvaluationPeriods: 2,
      });
    });

    test('should have proper output values for integration', () => {
      // Verify all required outputs are present
      template.hasOutput('VpcId', {
        Description: 'VPC ID for ProjectX infrastructure',
      });

      template.hasOutput('PublicSubnetIds', {
        Description: 'Public subnet IDs across multiple AZs',
      });

      template.hasOutput('SecurityGroupId', {
        Description: 'Security Group ID for web servers',
      });

      template.hasOutput('AutoScalingGroupName', {
        Description: 'Auto Scaling Group name',
      });

      template.hasOutput('AvailabilityZones', {
        Description: 'Availability Zones used by the infrastructure',
      });
    });

    test('should have proper IAM roles and policies', () => {
      // Verify EC2 role is created with correct policies
      template.hasResourceProperties('AWS::IAM::Role', {
        RoleName: 'projectX-ec2-role',
        AssumeRolePolicyDocument: {
          Statement: [
            {
              Action: 'sts:AssumeRole',
              Effect: 'Allow',
              Principal: {
                Service: 'ec2.amazonaws.com',
              },
            },
          ],
        },
      });

      // Verify instance profile is created
      template.hasResourceProperties('AWS::IAM::InstanceProfile', {
        InstanceProfileName: 'projectX-instance-profile',
      });
    });

    test('should have proper launch template configuration', () => {
      // Verify launch template is created with correct configuration
      template.hasResourceProperties('AWS::EC2::LaunchTemplate', {
        LaunchTemplateName: 'projectX-launch-template',
        LaunchTemplateData: {
          InstanceType: 't3.micro',
          Monitoring: {
            Enabled: true,
          },
        },
      });
    });

    test('should have proper resource tagging', () => {
      // Verify VPC exists
      template.hasResourceProperties('AWS::EC2::VPC', {
        CidrBlock: '10.0.0.0/16',
      });

      // Verify Auto Scaling Group has proper tags
      template.hasResourceProperties('AWS::AutoScaling::AutoScalingGroup', {
        Tags: [
          {
            Key: 'Name',
            Value: 'projectX-asg',
            PropagateAtLaunch: true,
          },
          {
            Key: 'Project',
            Value: 'ProjectX',
            PropagateAtLaunch: true,
          },
        ],
      });
    });
  });
});
