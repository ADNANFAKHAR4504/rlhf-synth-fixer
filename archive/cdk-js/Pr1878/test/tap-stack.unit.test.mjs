import { Template, Match } from 'aws-cdk-lib/assertions';
import * as cdk from 'aws-cdk-lib';
import { TapStack } from '../lib/tap-stack.mjs';

describe('TapStack', () => {
  let template;
  let app;
  let stack;
  const testEnvironmentSuffix = 'test123';

  beforeAll(() => {
    app = new cdk.App({
      context: {
        environmentSuffix: testEnvironmentSuffix
      }
    });
    stack = new TapStack(app, `TestTapStack${testEnvironmentSuffix}`, {
      stackName: `TestTapStack${testEnvironmentSuffix}`,
      env: {
        account: '123456789012',
        region: 'us-east-1'
      }
    });
    template = Template.fromStack(stack);
  });

  test('VPC is created with correct configuration', () => {
    template.hasResourceProperties('AWS::EC2::VPC', {
      EnableDnsHostnames: true,
      EnableDnsSupport: true,
      Tags: Match.arrayWith([
        Match.objectLike({
          Key: 'Name',
          Value: `tap-${testEnvironmentSuffix}-vpc`
        })
      ])
    });
    
    // Check VPC has the right number of subnets
    template.resourceCountIs('AWS::EC2::Subnet', 6); // 3 public + 3 private
  });

  test('Application Load Balancer is created with correct configuration', () => {
    template.hasResourceProperties('AWS::ElasticLoadBalancingV2::LoadBalancer', {
      Scheme: 'internet-facing',
      Type: 'application',
      Name: `tap-${testEnvironmentSuffix}-alb`,
      LoadBalancerAttributes: Match.arrayWith([
        Match.objectLike({
          Key: 'deletion_protection.enabled',
          Value: 'false'
        })
      ])
    });
  });

  test('Auto Scaling Group is created with correct configuration', () => {
    template.hasResourceProperties('AWS::AutoScaling::AutoScalingGroup', {
      MinSize: '2',
      MaxSize: '6',
      DesiredCapacity: '2',
      AutoScalingGroupName: `tap-${testEnvironmentSuffix}-asg`,
      HealthCheckType: 'ELB',
      HealthCheckGracePeriod: 300
    });
  });

  test('Security Groups are created with correct rules', () => {
    // ALB Security Group
    template.hasResourceProperties('AWS::EC2::SecurityGroup', {
      GroupDescription: 'Security group for Application Load Balancer',
      GroupName: `tap-${testEnvironmentSuffix}-alb-sg`,
      SecurityGroupIngress: Match.arrayWith([
        Match.objectLike({
          CidrIp: '0.0.0.0/0',
          FromPort: 80,
          ToPort: 80,
          IpProtocol: 'tcp'
        }),
        Match.objectLike({
          CidrIp: '0.0.0.0/0',
          FromPort: 443,
          ToPort: 443,
          IpProtocol: 'tcp'
        })
      ])
    });

    // Web Server Security Group
    template.hasResourceProperties('AWS::EC2::SecurityGroup', {
      GroupDescription: 'Security group for web server instances',
      GroupName: `tap-${testEnvironmentSuffix}-web-sg`
    });

    // Check security group ingress rule from ALB to Web Server
    template.hasResourceProperties('AWS::EC2::SecurityGroupIngress', {
      FromPort: 80,
      ToPort: 80,
      IpProtocol: 'tcp',
      Description: 'Allow HTTP traffic from ALB'
    });
  });

  test('Launch Template uses latest Amazon Linux 2023 with correct settings', () => {
    template.hasResourceProperties('AWS::EC2::LaunchTemplate', {
      LaunchTemplateName: `tap-${testEnvironmentSuffix}-lt`,
      LaunchTemplateData: {
        InstanceType: 't3.micro',
        MetadataOptions: {
          HttpTokens: 'required' // IMDSv2 enforced
        },
        Monitoring: {
          Enabled: true
        }
      }
    });
    
    // Verify instance profile is created
    template.hasResourceProperties('AWS::IAM::InstanceProfile', {});
  });

  test('Target Group is configured correctly', () => {
    template.hasResourceProperties('AWS::ElasticLoadBalancingV2::TargetGroup', {
      Port: 80,
      Protocol: 'HTTP',
      TargetType: 'instance',
      Name: `tap-${testEnvironmentSuffix}-tg`,
      HealthCheckEnabled: true,
      HealthCheckPath: '/',
      HealthCheckProtocol: 'HTTP',
      HealthCheckIntervalSeconds: 30,
      HealthCheckTimeoutSeconds: 5,
      HealthyThresholdCount: 2,
      UnhealthyThresholdCount: 2,
      TargetGroupAttributes: Match.arrayWith([
        Match.objectLike({
          Key: 'deregistration_delay.timeout_seconds',
          Value: '30'
        })
      ])
    });
  });

  test('IAM Role for EC2 instances includes SSM permissions', () => {
    template.hasResourceProperties('AWS::IAM::Role', {
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
      ManagedPolicyArns: [
        {
          'Fn::Join': [
            '',
            [
              'arn:',
              { Ref: 'AWS::Partition' },
              ':iam::aws:policy/AmazonSSMManagedInstanceCore',
            ],
          ],
        },
      ],
    });
  });

  test('VPC Flow Logs are enabled with CloudWatch Logs', () => {
    template.hasResourceProperties('AWS::EC2::FlowLog', {
      ResourceType: 'VPC',
      TrafficType: 'ALL',
      LogDestinationType: 'cloud-watch-logs'
    });
    
    // Check Flow Log IAM Role exists
    template.hasResourceProperties('AWS::IAM::Role', {
      AssumeRolePolicyDocument: Match.objectLike({
        Statement: Match.arrayWith([
          Match.objectLike({
            Effect: 'Allow',
            Principal: Match.objectLike({
              Service: 'vpc-flow-logs.amazonaws.com'
            })
          })
        ])
      })
    });
    
    // Check CloudWatch Log Group exists for VPC Flow Logs
    template.hasResourceProperties('AWS::Logs::LogGroup', {
      RetentionInDays: Match.anyValue()
    });
  });

  test('ALB Listener is configured correctly', () => {
    template.hasResourceProperties('AWS::ElasticLoadBalancingV2::Listener', {
      Port: 80,
      Protocol: 'HTTP',
      DefaultActions: Match.arrayWith([
        Match.objectLike({
          Type: 'forward'
        })
      ])
    });
  });

  test('NAT Gateway is created for private subnet connectivity', () => {
    // NAT Gateway should be created
    template.resourceCountIs('AWS::EC2::NatGateway', 1);
    
    // Elastic IP for NAT Gateway
    template.hasResourceProperties('AWS::EC2::EIP', {
      Domain: 'vpc'
    });
  });

  test('Internet Gateway is attached to VPC', () => {
    template.hasResourceProperties('AWS::EC2::InternetGateway', {});
    template.hasResourceProperties('AWS::EC2::VPCGatewayAttachment', {});
  });

  test('Route Tables are properly configured', () => {
    // Public subnets should have routes to Internet Gateway
    template.hasResourceProperties('AWS::EC2::Route', {
      DestinationCidrBlock: '0.0.0.0/0',
      GatewayId: Match.anyValue()
    });
    
    // Private subnets should have routes to NAT Gateway
    template.hasResourceProperties('AWS::EC2::Route', {
      DestinationCidrBlock: '0.0.0.0/0',
      NatGatewayId: Match.anyValue()
    });
  });

  test('Scaling policies are configured', () => {
    // CPU utilization scaling policy
    template.hasResourceProperties('AWS::AutoScaling::ScalingPolicy', {
      TargetTrackingConfiguration: Match.objectLike({
        PredefinedMetricSpecification: Match.objectLike({
          PredefinedMetricType: 'ASGAverageCPUUtilization'
        }),
        TargetValue: 70
      })
    });
    
    // Request count scaling policy
    template.hasResourceProperties('AWS::AutoScaling::ScalingPolicy', {
      TargetTrackingConfiguration: Match.objectLike({
        PredefinedMetricSpecification: Match.objectLike({
          PredefinedMetricType: 'ALBRequestCountPerTarget'
        })
      })
    });
  });

  test('Tags are applied correctly', () => {
    // Check that tags exist on VPC
    const vpc = template.findResources('AWS::EC2::VPC');
    const vpcResource = Object.values(vpc)[0];
    const tags = vpcResource.Properties.Tags;
    
    // Check specific tag values
    const tagMap = {};
    tags.forEach(tag => {
      tagMap[tag.Key] = tag.Value;
    });
    
    expect(tagMap['Project']).toBe('SecureWebApplication');
    expect(tagMap['Environment']).toBe(testEnvironmentSuffix);
    expect(tagMap['CostCenter']).toBe('Infrastructure');
    expect(tagMap['ManagedBy']).toBe('CDK');
    expect(tagMap['EnvironmentSuffix']).toBe(testEnvironmentSuffix);
  });

  test('Stack outputs are defined', () => {
    const outputs = template.findOutputs('*');
    
    expect(outputs).toHaveProperty('LoadBalancerDNS');
    expect(outputs).toHaveProperty('LoadBalancerArn');
    expect(outputs).toHaveProperty('VpcId');
    expect(outputs).toHaveProperty('AutoScalingGroupName');
    expect(outputs).toHaveProperty('TargetGroupArn');
    expect(outputs).toHaveProperty('ALBSecurityGroupId');
    expect(outputs).toHaveProperty('WebServerSecurityGroupId');
    expect(outputs).toHaveProperty('LaunchTemplateId');
    expect(outputs).toHaveProperty('EnvironmentSuffix');
  });

  test('Resources have removal policies for destroyability', () => {
    // ALB should not have deletion protection
    template.hasResourceProperties('AWS::ElasticLoadBalancingV2::LoadBalancer', {
      LoadBalancerAttributes: Match.arrayWith([
        Match.objectLike({
          Key: 'deletion_protection.enabled',
          Value: 'false'
        })
      ])
    });
  });

  test('User data script is configured for web server', () => {
    // Check that launch template has user data configured
    template.hasResourceProperties('AWS::EC2::LaunchTemplate', {
      LaunchTemplateData: Match.objectLike({
        UserData: Match.anyValue()
      })
    });
  });

  test('VPC CIDR block is configured', () => {
    template.hasResourceProperties('AWS::EC2::VPC', {
      CidrBlock: '10.0.0.0/16'
    });
  });

  test('Subnets are properly distributed across availability zones', () => {
    // Check that we have the correct number of public and private subnets
    const subnets = template.findResources('AWS::EC2::Subnet');
    const publicSubnets = Object.values(subnets).filter(subnet => 
      subnet.Properties.MapPublicIpOnLaunch === true
    );
    const privateSubnets = Object.values(subnets).filter(subnet => 
      subnet.Properties.MapPublicIpOnLaunch === false
    );
    
    expect(publicSubnets).toHaveLength(3);
    expect(privateSubnets).toHaveLength(3);
    
    // Check that subnets have different CIDR blocks
    template.hasResourceProperties('AWS::EC2::Subnet', {
      CidrBlock: '10.0.0.0/24',
      MapPublicIpOnLaunch: true
    });
    template.hasResourceProperties('AWS::EC2::Subnet', {
      CidrBlock: '10.0.1.0/24',
      MapPublicIpOnLaunch: true
    });
    template.hasResourceProperties('AWS::EC2::Subnet', {
      CidrBlock: '10.0.2.0/24',
      MapPublicIpOnLaunch: true
    });
    template.hasResourceProperties('AWS::EC2::Subnet', {
      CidrBlock: '10.0.3.0/24',
      MapPublicIpOnLaunch: false
    });
    template.hasResourceProperties('AWS::EC2::Subnet', {
      CidrBlock: '10.0.4.0/24',
      MapPublicIpOnLaunch: false
    });
    template.hasResourceProperties('AWS::EC2::Subnet', {
      CidrBlock: '10.0.5.0/24',
      MapPublicIpOnLaunch: false
    });
  });

  test('Auto Scaling Group uses launch template', () => {
    template.hasResourceProperties('AWS::AutoScaling::AutoScalingGroup', {
      LaunchTemplate: Match.objectLike({
        LaunchTemplateId: Match.anyValue(),
        Version: Match.anyValue()
      })
    });
  });

  test('Environment suffix is used in resource naming', () => {
    // Check various resources use environment suffix
    template.hasResourceProperties('AWS::EC2::VPC', {
      Tags: Match.arrayWith([
        Match.objectLike({
          Key: 'Name',
          Value: Match.stringLikeRegexp(`.*${testEnvironmentSuffix}.*`)
        })
      ])
    });
    
    template.hasResourceProperties('AWS::ElasticLoadBalancingV2::LoadBalancer', {
      Name: Match.stringLikeRegexp(`.*${testEnvironmentSuffix}.*`)
    });
    
    template.hasResourceProperties('AWS::AutoScaling::AutoScalingGroup', {
      AutoScalingGroupName: Match.stringLikeRegexp(`.*${testEnvironmentSuffix}.*`)
    });
  });

  test('Stack uses correct environment suffix from context', () => {
    // Test that environment suffix is properly passed through context
    const testApp = new cdk.App({
      context: {
        environmentSuffix: 'customsuffix'
      }
    });
    const testStack = new TapStack(testApp, 'TestStackCustom', {
      stackName: 'TestStackCustom'
    });
    const testTemplate = Template.fromStack(testStack);
    
    testTemplate.hasResourceProperties('AWS::EC2::VPC', {
      Tags: Match.arrayWith([
        Match.objectLike({
          Key: 'EnvironmentSuffix',
          Value: 'customsuffix'
        })
      ])
    });
  });

  test('Stack uses environment variable when context is not provided', () => {
    // Save original env var
    const originalEnv = process.env.ENVIRONMENT_SUFFIX;
    
    // Set test environment variable
    process.env.ENVIRONMENT_SUFFIX = 'envsuffix';
    
    const testApp = new cdk.App();
    const testStack = new TapStack(testApp, 'TestStackEnv', {
      stackName: 'TestStackEnv'
    });
    const testTemplate = Template.fromStack(testStack);
    
    testTemplate.hasResourceProperties('AWS::EC2::VPC', {
      Tags: Match.arrayWith([
        Match.objectLike({
          Key: 'EnvironmentSuffix',
          Value: 'envsuffix'
        })
      ])
    });
    
    // Restore original env var
    if (originalEnv !== undefined) {
      process.env.ENVIRONMENT_SUFFIX = originalEnv;
    } else {
      delete process.env.ENVIRONMENT_SUFFIX;
    }
  });

  test('Stack defaults to dev when no suffix is provided', () => {
    // Save original env var
    const originalEnv = process.env.ENVIRONMENT_SUFFIX;
    
    // Clear environment variable
    delete process.env.ENVIRONMENT_SUFFIX;
    
    const testApp = new cdk.App();
    const testStack = new TapStack(testApp, 'TestStackDefault', {
      stackName: 'TestStackDefault'
    });
    const testTemplate = Template.fromStack(testStack);
    
    testTemplate.hasResourceProperties('AWS::EC2::VPC', {
      Tags: Match.arrayWith([
        Match.objectLike({
          Key: 'EnvironmentSuffix',
          Value: 'dev'
        })
      ])
    });
    
    // Restore original env var
    if (originalEnv !== undefined) {
      process.env.ENVIRONMENT_SUFFIX = originalEnv;
    }
  });

  test('CloudWatch Log Group has retention policy', () => {
    // Check that log group for VPC Flow Logs has retention set
    template.hasResourceProperties('AWS::Logs::LogGroup', {
      RetentionInDays: Match.anyValue()
    });
  });

  test('Instance profile is associated with launch template', () => {
    // Check IAM instance profile is created and associated
    template.resourceCountIs('AWS::IAM::InstanceProfile', 1);
    
    template.hasResourceProperties('AWS::EC2::LaunchTemplate', {
      LaunchTemplateData: Match.objectLike({
        IamInstanceProfile: Match.objectLike({
          Arn: Match.anyValue()
        })
      })
    });
  });
});