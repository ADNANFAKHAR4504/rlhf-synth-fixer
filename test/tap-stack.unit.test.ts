import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { ProjectXInfrastructureStack } from '../lib/tap-stack';

describe('ProjectXInfrastructureStack', () => {
  let app: cdk.App;
  let stack: ProjectXInfrastructureStack;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();
    stack = new ProjectXInfrastructureStack(app, 'TestProjectXStack', {
      description: `ProjectX Infrastructure Stack - test`,
      environmentSuffix: 'test',
      env: { account: '123456789012', region: 'us-west-2' },
    });
    template = Template.fromStack(stack);
  });

  describe('Environment Configuration', () => {
    test('should use environmentSuffix from props when provided', () => {
      const testApp = new cdk.App();
      const testStack = new ProjectXInfrastructureStack(testApp, 'TestStack', {
        environmentSuffix: 'prod',
        env: { account: '123456789012', region: 'us-west-2' },
      });
      const testTemplate = Template.fromStack(testStack);
      
      // Verify the stack uses the provided environment suffix
      testTemplate.hasOutput('VpcId', {
        Export: {
          Name: 'ProjectX-VpcId-prod',
        },
      });
    });

    test('should use environmentSuffix from context when not in props', () => {
      const contextApp = new cdk.App();
      contextApp.node.setContext('environmentSuffix', 'staging');
      
      const contextStack = new ProjectXInfrastructureStack(contextApp, 'ContextStack', {
        env: { account: '123456789012', region: 'us-west-2' },
      });
      const contextTemplate = Template.fromStack(contextStack);
      
      // Verify the stack uses the context environment suffix
      contextTemplate.hasOutput('VpcId', {
        Export: {
          Name: 'ProjectX-VpcId-staging',
        },
      });
    });

    test('should use default environmentSuffix when not in props or context', () => {
      const defaultApp = new cdk.App();
      
      const defaultStack = new ProjectXInfrastructureStack(defaultApp, 'DefaultStack', {
        env: { account: '123456789012', region: 'us-west-2' },
      });
      const defaultTemplate = Template.fromStack(defaultStack);
      
      // Verify the stack uses the default environment suffix
      defaultTemplate.hasOutput('VpcId', {
        Export: {
          Name: 'ProjectX-VpcId-dev',
        },
      });
    });

    test('should prioritize props over context for environmentSuffix', () => {
      const priorityApp = new cdk.App();
      priorityApp.node.setContext('environmentSuffix', 'staging');
      
      const priorityStack = new ProjectXInfrastructureStack(priorityApp, 'PriorityStack', {
        environmentSuffix: 'prod', // This should take precedence
        env: { account: '123456789012', region: 'us-west-2' },
      });
      const priorityTemplate = Template.fromStack(priorityStack);
      
      // Verify props take precedence over context
      priorityTemplate.hasOutput('VpcId', {
        Export: {
          Name: 'ProjectX-VpcId-prod',
        },
      });
    });
  });

  describe('VPC Resources', () => {
    test('should create VPC with correct CIDR', () => {
      template.hasResourceProperties('AWS::EC2::VPC', {
        CidrBlock: '10.0.0.0/16',
        EnableDnsHostnames: true,
        EnableDnsSupport: true,
      });
    });

    test('should create public subnets', () => {
      template.hasResourceProperties('AWS::EC2::Subnet', {
        MapPublicIpOnLaunch: true,
      });
    });

    test('should create internet gateway', () => {
      template.hasResourceProperties('AWS::EC2::InternetGateway', {});
    });
  });

  describe('Security Group Resources', () => {
    test('should create security group with HTTP/HTTPS/SSH access', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupDescription: 'Security group for ProjectX web servers allowing HTTP/HTTPS traffic',
        GroupName: 'projectX-web-server-sg',
        SecurityGroupIngress: [
          {
            CidrIp: '0.0.0.0/0',
            FromPort: 80,
            ToPort: 80,
            IpProtocol: 'tcp',
            Description: 'Allow HTTP traffic from internet',
          },
          {
            CidrIp: '0.0.0.0/0',
            FromPort: 443,
            ToPort: 443,
            IpProtocol: 'tcp',
            Description: 'Allow HTTPS traffic from internet',
          },
          {
            CidrIp: '10.0.0.0/8',
            FromPort: 22,
            ToPort: 22,
            IpProtocol: 'tcp',
            Description: 'Allow SSH from office network only',
          },
        ],
      });
    });
  });

  describe('Auto Scaling Group Resources', () => {
    test('should create Auto Scaling Group with correct configuration', () => {
      template.hasResourceProperties('AWS::AutoScaling::AutoScalingGroup', {
        AutoScalingGroupName: 'projectX-asg',
        MinSize: '2',
        MaxSize: '6',
        DesiredCapacity: '2',
        HealthCheckType: 'EC2',
      });
    });

    test('should create scaling policy', () => {
      template.hasResourceProperties('AWS::AutoScaling::ScalingPolicy', {
        PolicyType: 'TargetTrackingScaling',
        TargetTrackingConfiguration: {
          PredefinedMetricSpecification: {
            PredefinedMetricType: 'ASGAverageCPUUtilization',
          },
          TargetValue: 70,
        },
      });
    });
  });

  describe('IAM Resources', () => {
    test('should create IAM role for EC2 instances', () => {
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
    });

    test('should create instance profile', () => {
      template.hasResourceProperties('AWS::IAM::InstanceProfile', {
        InstanceProfileName: 'projectX-instance-profile',
      });
    });
  });

  describe('Launch Template Resources', () => {
    test('should create launch template with correct configuration', () => {
      template.hasResourceProperties('AWS::EC2::LaunchTemplate', {
        LaunchTemplateName: 'projectX-launch-template',
        LaunchTemplateData: {
          InstanceType: 't3.micro',
          Monitoring: {
            Enabled: true,
          },
          BlockDeviceMappings: [
            {
              DeviceName: '/dev/xvda',
              Ebs: {
                Encrypted: true,
                DeleteOnTermination: true,
                VolumeType: 'gp3',
                VolumeSize: 20,
              },
            },
          ],
        },
      });
    });
  });

  describe('CloudWatch Alarms', () => {
    test('should create CPU utilization alarm', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        MetricName: 'CPUUtilization',
        Namespace: 'AWS/AutoScaling',
        Threshold: 80,
        EvaluationPeriods: 2,
        AlarmDescription: 'ProjectX Auto Scaling Group CPU utilization is high',
      });
    });

    test('should create instance count alarm', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        MetricName: 'GroupDesiredCapacity',
        Namespace: 'AWS/AutoScaling',
        Threshold: 4,
        EvaluationPeriods: 2,
        AlarmDescription: 'ProjectX Auto Scaling Group instance count is high',
      });
    });

    test('should create healthy host count alarm', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        MetricName: 'GroupInServiceInstances',
        Namespace: 'AWS/AutoScaling',
        Threshold: 1,
        EvaluationPeriods: 2,
        AlarmDescription: 'ProjectX Auto Scaling Group healthy host count is low',
      });
    });
  });

  describe('Output Values', () => {
    test('should export VPC ID', () => {
      template.hasOutput('VpcId', {
        Description: 'VPC ID for ProjectX infrastructure',
        Export: {
          Name: 'ProjectX-VpcId-test',
        },
      });
    });

    test('should export VPC CIDR', () => {
      template.hasOutput('VpcCidr', {
        Description: 'VPC CIDR block',
        Export: {
          Name: 'ProjectX-VpcCidr-test',
        },
      });
    });

    test('should export public subnet IDs', () => {
      template.hasOutput('PublicSubnetIds', {
        Description: 'Public subnet IDs across multiple AZs',
        Export: {
          Name: 'ProjectX-PublicSubnetIds-test',
        },
      });
    });

    test('should export security group ID', () => {
      template.hasOutput('SecurityGroupId', {
        Description: 'Security Group ID for web servers',
        Export: {
          Name: 'ProjectX-SecurityGroupId-test',
        },
      });
    });

    test('should export Auto Scaling Group name', () => {
      template.hasOutput('AutoScalingGroupName', {
        Description: 'Auto Scaling Group name',
        Export: {
          Name: 'ProjectX-AutoScalingGroupName-test',
        },
      });
    });

    test('should export availability zones', () => {
      template.hasOutput('AvailabilityZones', {
        Description: 'Availability Zones used by the infrastructure',
        Export: {
          Name: 'ProjectX-AvailabilityZones-test',
        },
      });
    });
  });
});
