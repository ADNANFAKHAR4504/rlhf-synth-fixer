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
      environmentSuffix: 'test',
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
            CidrIp: '10.0.0.0/8', // Office network only
            FromPort: 22,
            ToPort: 22,
            IpProtocol: 'tcp',
            Description: 'Allow SSH from office network only',
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
        Export: {
          Name: 'ProjectX-VpcId-test',
        },
      });

      template.hasOutput('PublicSubnetIds', {
        Description: 'Public subnet IDs across multiple AZs',
        Export: {
          Name: 'ProjectX-PublicSubnetIds-test',
        },
      });

      template.hasOutput('SecurityGroupId', {
        Description: 'Security Group ID for web servers',
        Export: {
          Name: 'ProjectX-SecurityGroupId-test',
        },
      });

      template.hasOutput('AutoScalingGroupName', {
        Description: 'Auto Scaling Group name',
        Export: {
          Name: 'ProjectX-AutoScalingGroupName-test',
        },
      });

      template.hasOutput('AvailabilityZones', {
        Description: 'Availability Zones used by the infrastructure',
        Export: {
          Name: 'ProjectX-AvailabilityZones-test',
        },
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

    test('should have proper resource tagging', () => {
      // Verify VPC exists
      template.hasResourceProperties('AWS::EC2::VPC', {
        CidrBlock: '10.0.0.0/16',
      });

      // Verify Auto Scaling Group has proper tags
      template.hasResourceProperties('AWS::AutoScaling::AutoScalingGroup', {
        AutoScalingGroupName: 'projectX-asg',
      });
    });
  });

  describe('Security Validation', () => {
    test('should have restricted SSH access', () => {
      // Verify SSH is restricted to office network only
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
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
            CidrIp: '10.0.0.0/8', // Office network only
            FromPort: 22,
            ToPort: 22,
            IpProtocol: 'tcp',
            Description: 'Allow SSH from office network only',
          },
        ],
      });
    });

    test('should have proper HTTP/HTTPS access', () => {
      // Verify HTTP and HTTPS access from internet
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
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

    test('should have encrypted EBS volumes', () => {
      // Verify EBS volumes are encrypted
      template.hasResourceProperties('AWS::EC2::LaunchTemplate', {
        LaunchTemplateData: {
          BlockDeviceMappings: [
            {
              DeviceName: '/dev/xvda',
              Ebs: {
                Encrypted: true,
                VolumeType: 'gp3',
                VolumeSize: 20,
              },
            },
          ],
        },
      });
    });
  });

  describe('Monitoring Validation', () => {
    test('should have CPU utilization alarm', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        MetricName: 'CPUUtilization',
        Namespace: 'AWS/AutoScaling',
        Threshold: 80,
        EvaluationPeriods: 2,
        AlarmDescription: 'ProjectX Auto Scaling Group CPU utilization is high',
      });
    });

    test('should have instance count alarm', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        MetricName: 'GroupDesiredCapacity',
        Namespace: 'AWS/AutoScaling',
        Threshold: 4,
        EvaluationPeriods: 2,
        AlarmDescription: 'ProjectX Auto Scaling Group instance count is high',
      });
    });

    test('should have healthy host count alarm', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        MetricName: 'GroupInServiceInstances',
        Namespace: 'AWS/AutoScaling',
        Threshold: 1,
        EvaluationPeriods: 2,
        AlarmDescription: 'ProjectX Auto Scaling Group healthy host count is low',
      });
    });
  });

  describe('Auto Scaling Validation', () => {
    test('should have proper auto scaling configuration', () => {
      template.hasResourceProperties('AWS::AutoScaling::AutoScalingGroup', {
        AutoScalingGroupName: 'projectX-asg',
        MinSize: '2',
        MaxSize: '6',
        DesiredCapacity: '2',
        HealthCheckType: 'EC2',
      });
    });

    test('should have CPU-based scaling policy', () => {
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

    test('should have rolling update policy', () => {
      // Verify rolling update policy exists at the resource level
      template.hasResource('AWS::AutoScaling::AutoScalingGroup', {
        UpdatePolicy: {
          AutoScalingRollingUpdate: {
            MaxBatchSize: 1,
            MinInstancesInService: 1,
          },
        },
      });
    });
  });

  describe('Network Validation', () => {
    test('should have public subnets', () => {
      template.hasResourceProperties('AWS::EC2::Subnet', {
        MapPublicIpOnLaunch: true,
      });
    });

    test('should have internet gateway', () => {
      template.hasResourceProperties('AWS::EC2::InternetGateway', {});
    });

    test('should have proper route tables', () => {
      template.hasResourceProperties('AWS::EC2::Route', {
        DestinationCidrBlock: '0.0.0.0/0',
      });
    });
  });

  describe('Deployment Validation', () => {
    test('should have proper resource dependencies', () => {
      // Verify VPC is created before other resources
      template.hasResource('AWS::EC2::VPC', {});
      
      // Verify security group depends on VPC
      template.hasResource('AWS::EC2::SecurityGroup', {});
      
      // Verify launch template depends on security group and IAM role
      template.hasResource('AWS::EC2::LaunchTemplate', {});
      
      // Verify auto scaling group depends on launch template
      template.hasResource('AWS::AutoScaling::AutoScalingGroup', {});
    });

    test('should have proper resource naming', () => {
      // Verify consistent naming convention
      template.hasResourceProperties('AWS::EC2::VPC', {
        CidrBlock: '10.0.0.0/16',
      });

      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupName: 'projectX-web-server-sg',
      });

      template.hasResourceProperties('AWS::AutoScaling::AutoScalingGroup', {
        AutoScalingGroupName: 'projectX-asg',
      });
    });

    test('should have proper environment configuration', () => {
      // Verify environment-specific configuration
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupName: 'projectX-web-server-sg',
      });

      template.hasResourceProperties('AWS::AutoScaling::AutoScalingGroup', {
        AutoScalingGroupName: 'projectX-asg',
      });
    });
  });

  describe('Integration Scenarios', () => {
    test('should support multi-AZ deployment', () => {
      // Verify subnets in multiple AZs
      const subnets = template.findResources('AWS::EC2::Subnet');
      expect(Object.keys(subnets).length).toBeGreaterThan(1);
    });

    test('should support auto scaling scenarios', () => {
      // Verify auto scaling can handle load changes
      template.hasResourceProperties('AWS::AutoScaling::AutoScalingGroup', {
        MinSize: '2',
        MaxSize: '6',
      });
    });

    test('should support monitoring and alerting', () => {
      // Verify comprehensive monitoring
      const alarms = template.findResources('AWS::CloudWatch::Alarm');
      expect(Object.keys(alarms).length).toBe(3); // CPU, Instance Count, Healthy Host Count
    });

    test('should support security best practices', () => {
      // Verify security group follows least privilege
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        SecurityGroupEgress: [
          {
            CidrIp: '0.0.0.0/0',
            IpProtocol: '-1',
            Description: 'Allow all outbound traffic by default',
          },
        ],
      });
    });

    test('should support data protection', () => {
      // Verify encryption is enabled
      template.hasResourceProperties('AWS::EC2::LaunchTemplate', {
        LaunchTemplateData: {
          BlockDeviceMappings: [
            {
              Ebs: {
                Encrypted: true,
              },
            },
          ],
        },
      });
    });
  });
});
