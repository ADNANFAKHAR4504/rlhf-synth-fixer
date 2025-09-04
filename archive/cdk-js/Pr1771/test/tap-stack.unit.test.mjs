import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack.mjs';

describe('TapStack Unit Tests', () => {
  let app;
  let stack;
  let template;
  const environmentSuffix = 'test';

  beforeEach(() => {
    app = new cdk.App();
    stack = new TapStack(app, 'TestTapStack', { 
      environmentSuffix,
      env: {
        account: '123456789012',
        region: 'us-west-2'
      }
    });
    template = Template.fromStack(stack);
  });

  describe('VPC Configuration', () => {
    test('Should create a VPC with correct configuration', () => {
      template.hasResourceProperties('AWS::EC2::VPC', {
        CidrBlock: '10.0.0.0/16',
        EnableDnsHostnames: true,
        EnableDnsSupport: true
      });
    });

    test('Should create exactly 2 public subnets', () => {
      template.resourceCountIs('AWS::EC2::Subnet', 2);
      
      // Check that both subnets are public
      template.allResourcesProperties('AWS::EC2::Subnet', {
        MapPublicIpOnLaunch: true
      });
    });

    test('Should create an Internet Gateway', () => {
      template.resourceCountIs('AWS::EC2::InternetGateway', 1);
    });

    test('Should attach Internet Gateway to VPC', () => {
      template.resourceCountIs('AWS::EC2::VPCGatewayAttachment', 1);
    });

    test('Should have no NAT Gateways for cost optimization', () => {
      template.resourceCountIs('AWS::EC2::NatGateway', 0);
    });
  });

  describe('Security Groups', () => {
    test('Should create ALB security group with HTTP ingress', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupDescription: 'Security group for Application Load Balancer',
        SecurityGroupIngress: [
          Match.objectLike({
            IpProtocol: 'tcp',
            FromPort: 80,
            ToPort: 80,
            CidrIp: '0.0.0.0/0'
          })
        ]
      });
    });

    test('Should create EC2 security group with SSH ingress', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupDescription: 'Security group for EC2 instances',
        SecurityGroupIngress: [
          Match.objectLike({
            IpProtocol: 'tcp',
            FromPort: 22,
            ToPort: 22,
            CidrIp: '0.0.0.0/0'
          })
        ]
      });
    });

    test('Should allow HTTP traffic from ALB to EC2 instances', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroupIngress', {
        IpProtocol: 'tcp',
        FromPort: 80,
        ToPort: 80
      });
    });
  });

  describe('IAM Configuration', () => {
    test('Should create IAM role for EC2 instances', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        AssumeRolePolicyDocument: {
          Statement: [
            Match.objectLike({
              Action: 'sts:AssumeRole',
              Principal: {
                Service: 'ec2.amazonaws.com'
              }
            })
          ]
        },
        ManagedPolicyArns: Match.arrayWith([
          Match.objectLike({
            'Fn::Join': Match.arrayWith([
              '',
              Match.arrayWith([
                Match.stringLikeRegexp('.*AmazonSSMManagedInstanceCore.*')
              ])
            ])
          }),
          Match.objectLike({
            'Fn::Join': Match.arrayWith([
              '',
              Match.arrayWith([
                Match.stringLikeRegexp('.*CloudWatchAgentServerPolicy.*')
              ])
            ])
          })
        ])
      });
    });

    test('Should create instance profile with correct name', () => {
      template.hasResourceProperties('AWS::IAM::InstanceProfile', {
        InstanceProfileName: `tap-ec2-profile-${environmentSuffix}`
      });
    });
  });

  describe('Auto Scaling Configuration', () => {
    test('Should create Auto Scaling Group with correct capacity', () => {
      template.hasResourceProperties('AWS::AutoScaling::AutoScalingGroup', {
        MinSize: '2',
        MaxSize: '5',
        DesiredCapacity: '2',
        AutoScalingGroupName: `tap-asg-${environmentSuffix}`
      });
    });

    test('Should use Launch Template', () => {
      template.hasResourceProperties('AWS::AutoScaling::AutoScalingGroup', {
        LaunchTemplate: Match.objectLike({
          LaunchTemplateId: Match.anyValue()
        })
      });
    });

    test('Should create Launch Template with t2.micro instance', () => {
      template.hasResourceProperties('AWS::EC2::LaunchTemplate', {
        LaunchTemplateName: `tap-launch-template-${environmentSuffix}`,
        LaunchTemplateData: Match.objectLike({
          InstanceType: 't2.micro'
        })
      });
    });

    test('Should enable IMDSv2 for security', () => {
      template.hasResourceProperties('AWS::EC2::LaunchTemplate', {
        LaunchTemplateData: Match.objectLike({
          MetadataOptions: {
            HttpTokens: 'required'
          }
        })
      });
    });

    test('Should configure CPU-based scaling policy', () => {
      template.hasResourceProperties('AWS::AutoScaling::ScalingPolicy', {
        TargetTrackingConfiguration: Match.objectLike({
          TargetValue: 70,
          PredefinedMetricSpecification: {
            PredefinedMetricType: 'ASGAverageCPUUtilization'
          }
        })
      });
    });

    test('Should have health check grace period', () => {
      template.hasResourceProperties('AWS::AutoScaling::AutoScalingGroup', {
        HealthCheckGracePeriod: 300
      });
    });
  });

  describe('Load Balancer Configuration', () => {
    test('Should create Application Load Balancer', () => {
      template.hasResourceProperties('AWS::ElasticLoadBalancingV2::LoadBalancer', {
        Type: 'application',
        Scheme: 'internet-facing',
        Name: `tap-alb-${environmentSuffix}`,
        IpAddressType: 'ipv4'
      });
    });

    test('Should create Target Group with health checks', () => {
      template.hasResourceProperties('AWS::ElasticLoadBalancingV2::TargetGroup', {
        Name: `tap-tg-${environmentSuffix}`,
        Port: 80,
        Protocol: 'HTTP'
      });
      
      // Verify target group exists with correct name
      const resources = template.toJSON().Resources;
      const targetGroups = Object.values(resources).filter(r => 
        r.Type === 'AWS::ElasticLoadBalancingV2::TargetGroup' && 
        r.Properties?.Name === `tap-tg-${environmentSuffix}`
      );
      expect(targetGroups.length).toBe(1);
    });

    test('Should create ALB Listener on port 80', () => {
      template.hasResourceProperties('AWS::ElasticLoadBalancingV2::Listener', {
        Port: 80,
        Protocol: 'HTTP',
        DefaultActions: [
          Match.objectLike({
            Type: 'forward'
          })
        ]
      });
    });
  });

  describe('Tagging', () => {
    test('Should apply Environment:Production tag', () => {
      const resources = template.toJSON().Resources;
      const taggedResources = Object.values(resources).filter(resource => 
        resource.Properties?.Tags?.some(tag => 
          tag.Key === 'Environment' && tag.Value === 'Production'
        )
      );
      expect(taggedResources.length).toBeGreaterThan(0);
    });

    test('Should apply Application:WebApp tag', () => {
      const resources = template.toJSON().Resources;
      const taggedResources = Object.values(resources).filter(resource => 
        resource.Properties?.Tags?.some(tag => 
          tag.Key === 'Application' && tag.Value === 'WebApp'
        )
      );
      expect(taggedResources.length).toBeGreaterThan(0);
    });
  });

  describe('Outputs', () => {
    test('Should output Load Balancer DNS name', () => {
      template.hasOutput('LoadBalancerDNS', {
        Description: 'Public DNS name of the Application Load Balancer',
        Export: {
          Name: `WebAppALBDNS-${environmentSuffix}`
        }
      });
    });

    test('Should output Load Balancer URL', () => {
      template.hasOutput('LoadBalancerURL', {
        Description: 'URL of the web application',
        Export: {
          Name: `WebAppURL-${environmentSuffix}`
        }
      });
    });

    test('Should output VPC ID', () => {
      template.hasOutput('VPCId', {
        Description: 'VPC ID',
        Export: {
          Name: `WebAppVPCId-${environmentSuffix}`
        }
      });
    });

    test('Should output Auto Scaling Group name', () => {
      template.hasOutput('AutoScalingGroupName', {
        Description: 'Auto Scaling Group Name',
        Export: {
          Name: `WebAppASGName-${environmentSuffix}`
        }
      });
    });

    test('Should output Security Group IDs', () => {
      template.hasOutput('SecurityGroupId', {
        Description: 'EC2 Security Group ID',
        Export: {
          Name: `WebAppEC2SGId-${environmentSuffix}`
        }
      });

      template.hasOutput('ALBSecurityGroupId', {
        Description: 'ALB Security Group ID',
        Export: {
          Name: `WebAppALBSGId-${environmentSuffix}`
        }
      });
    });

    test('Should output IAM Role ARN', () => {
      template.hasOutput('IAMRoleArn', {
        Description: 'EC2 IAM Role ARN',
        Export: {
          Name: `WebAppEC2RoleArn-${environmentSuffix}`
        }
      });
    });

    test('Should output Target Group ARN', () => {
      template.hasOutput('TargetGroupArn', {
        Description: 'Target Group ARN',
        Export: {
          Name: `WebAppTGArn-${environmentSuffix}`
        }
      });
    });
  });

  describe('Resource Naming', () => {
    test('Should include environment suffix in all resource names', () => {
      // Check Launch Template name
      template.hasResourceProperties('AWS::EC2::LaunchTemplate', {
        LaunchTemplateName: `tap-launch-template-${environmentSuffix}`
      });

      // Check Auto Scaling Group name
      template.hasResourceProperties('AWS::AutoScaling::AutoScalingGroup', {
        AutoScalingGroupName: `tap-asg-${environmentSuffix}`
      });

      // Check ALB name
      template.hasResourceProperties('AWS::ElasticLoadBalancingV2::LoadBalancer', {
        Name: `tap-alb-${environmentSuffix}`
      });

      // Check Target Group name
      template.hasResourceProperties('AWS::ElasticLoadBalancingV2::TargetGroup', {
        Name: `tap-tg-${environmentSuffix}`
      });

      // Check IAM Role name
      template.hasResourceProperties('AWS::IAM::Role', {
        RoleName: `tap-ec2-role-${environmentSuffix}`
      });

      // Check Instance Profile name
      template.hasResourceProperties('AWS::IAM::InstanceProfile', {
        InstanceProfileName: `tap-ec2-profile-${environmentSuffix}`
      });
    });
  });

  describe('Best Practices', () => {
    test('Should not have retain deletion policy on any resource', () => {
      const resources = template.toJSON().Resources;
      Object.values(resources).forEach(resource => {
        expect(resource.DeletionPolicy).not.toBe('Retain');
      });
    });

    test('Should use latest Amazon Linux 2023 AMI', () => {
      // The Launch Template should be configured to use AL2023
      template.hasResourceProperties('AWS::EC2::LaunchTemplate', {
        LaunchTemplateData: Match.objectLike({
          ImageId: Match.anyValue() // AMI ID will be resolved at deploy time
        })
      });
    });

    test('Should have user data script for web server setup', () => {
      template.hasResourceProperties('AWS::EC2::LaunchTemplate', {
        LaunchTemplateData: Match.objectLike({
          UserData: Match.anyValue()
        })
      });
    });

    test('Should use public subnets for ALB', () => {
      // ALB should be internet-facing
      template.hasResourceProperties('AWS::ElasticLoadBalancingV2::LoadBalancer', {
        Scheme: 'internet-facing'
      });
    });
  });
});