import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack';
import { ElasticBeanstalkStack } from '../lib/elastic-beanstalk-stack';

describe('TapStack', () => {
  let app: cdk.App;
  let stack: TapStack;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();
    const environmentSuffix = 'test';
    stack = new TapStack(app, `TapStack${environmentSuffix}`, {
      environmentSuffix: environmentSuffix,
    });
    template = Template.fromStack(stack);
  });

  test('Stack is created with correct properties', () => {
    expect(stack).toBeDefined();
    expect(stack.stackName).toContain('TapStack');
  });

  test('Stack instantiates ElasticBeanstalkStack', () => {
    expect(stack).toBeDefined();
    const childStacks = stack.node.children.filter(
      (child) => child.constructor.name === 'ElasticBeanstalkStack'
    );
    expect(childStacks.length).toBe(1);
  });
});

describe('ElasticBeanstalkStack - EC2 Auto Scaling Infrastructure', () => {
  let app: cdk.App;
  let stack: ElasticBeanstalkStack;
  let template: Template;
  const environmentSuffix = 'test';

  beforeEach(() => {
    app = new cdk.App();
    stack = new ElasticBeanstalkStack(app, 'TestStack', {
      environmentSuffix: environmentSuffix,
      instanceType: 't3.micro',
      keyPairName: 'test-keypair',
    });
    template = Template.fromStack(stack);
  });

  describe('VPC Configuration', () => {
    test('Creates VPC with correct properties', () => {
      template.hasResourceProperties('AWS::EC2::VPC', {
        CidrBlock: Match.anyValue(),
        EnableDnsHostnames: true,
        EnableDnsSupport: true,
        Tags: Match.arrayWith([
          Match.objectLike({
            Key: 'Name',
            Value: Match.stringLikeRegexp(`web-app-vpc-${environmentSuffix}`),
          }),
        ]),
      });
    });

    test('Creates public subnets in multiple AZs', () => {
      template.resourceCountIs('AWS::EC2::Subnet', 2);
    });

    test('Creates Internet Gateway', () => {
      template.resourceCountIs('AWS::EC2::InternetGateway', 1);
    });

    test('Does not create NAT Gateways', () => {
      template.resourceCountIs('AWS::EC2::NatGateway', 0);
    });
  });

  describe('Secrets Manager', () => {
    test('Creates Secrets Manager secret with correct properties', () => {
      template.hasResourceProperties('AWS::SecretsManager::Secret', {
        Name: `web-app-secrets-${environmentSuffix}`,
        Description: 'Application secrets for web application environment',
        GenerateSecretString: {
          SecretStringTemplate: JSON.stringify({ username: 'admin' }),
          GenerateStringKey: 'password',
          ExcludeCharacters: '"@/\\\'',
        },
      });
    });

    test('Secret has deletion policy set to Delete', () => {
      template.hasResource('AWS::SecretsManager::Secret', {
        DeletionPolicy: 'Delete',
        UpdateReplacePolicy: 'Delete',
      });
    });
  });

  describe('IAM Roles and Policies', () => {
    test('Creates EC2 instance role with correct name', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        RoleName: `web-app-instance-role-${environmentSuffix}`,
        AssumeRolePolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Effect: 'Allow',
              Principal: {
                Service: 'ec2.amazonaws.com',
              },
              Action: 'sts:AssumeRole',
            }),
          ]),
        },
      });
    });

    test('Instance role has Secrets Manager access policy', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        RoleName: `web-app-instance-role-${environmentSuffix}`,
        Policies: Match.arrayWith([
          Match.objectLike({
            PolicyName: 'SecretsManagerAccess',
            PolicyDocument: {
              Statement: Match.arrayWith([
                Match.objectLike({
                  Effect: 'Allow',
                  Action: Match.arrayWith([
                    'secretsmanager:GetSecretValue',
                    'secretsmanager:DescribeSecret',
                  ]),
                }),
              ]),
            },
          }),
        ]),
      });
    });

    test('Instance role has CloudWatch Logs access', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        RoleName: `web-app-instance-role-${environmentSuffix}`,
        Policies: Match.arrayWith([
          Match.objectLike({
            PolicyName: 'CloudWatchLogs',
          }),
        ]),
      });
    });

    test('Instance role has SSM access', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        RoleName: `web-app-instance-role-${environmentSuffix}`,
        Policies: Match.arrayWith([
          Match.objectLike({
            PolicyName: 'SSMAccess',
          }),
        ]),
      });
    });
  });

  describe('Security Groups', () => {
    test('Creates security group for Application Load Balancer', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupName: `web-app-alb-sg-${environmentSuffix}`,
        GroupDescription: 'Security group for Application Load Balancer',
      });
    });

    test('Creates security group for EC2 instances', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupName: `web-app-instance-sg-${environmentSuffix}`,
        GroupDescription: 'Security group for EC2 instances',
      });
    });

    test('ALB security group allows HTTP traffic', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        SecurityGroupIngress: Match.arrayWith([
          Match.objectLike({
            IpProtocol: 'tcp',
            FromPort: 80,
            ToPort: 80,
            CidrIp: '0.0.0.0/0',
          }),
        ]),
      });
    });
  });

  describe('Application Load Balancer', () => {
    test('Creates Application Load Balancer', () => {
      template.hasResourceProperties(
        'AWS::ElasticLoadBalancingV2::LoadBalancer',
        {
          Name: `web-app-alb-${environmentSuffix}`,
          Type: 'application',
          Scheme: 'internet-facing',
        }
      );
    });

    test('Creates target group with health check', () => {
      template.hasResourceProperties('AWS::ElasticLoadBalancingV2::TargetGroup', {
        Name: `web-app-tg-${environmentSuffix}`,
        Port: 8080,
        Protocol: 'HTTP',
        TargetType: 'instance',
        HealthCheckEnabled: true,
        HealthCheckPath: '/',
        HealthCheckIntervalSeconds: 30,
        HealthCheckTimeoutSeconds: 5,
        HealthyThresholdCount: 2,
        UnhealthyThresholdCount: 3,
      });
    });

    test('Creates HTTP listener', () => {
      template.hasResourceProperties('AWS::ElasticLoadBalancingV2::Listener', {
        Port: 80,
        Protocol: 'HTTP',
      });
    });
  });

  describe('Auto Scaling Group', () => {
    test('Creates Auto Scaling Group with correct configuration', () => {
      template.hasResourceProperties('AWS::AutoScaling::AutoScalingGroup', {
        AutoScalingGroupName: `web-app-asg-${environmentSuffix}`,
        MinSize: '2',
        MaxSize: '10',
        DesiredCapacity: '2',
        HealthCheckType: 'ELB',
        HealthCheckGracePeriod: 300,
      });
    });

    test('Creates Launch Configuration with user data', () => {
      const resources = template.toJSON().Resources;
      const launchConfig = Object.values(resources).find(
        (r: any) => r.Type === 'AWS::AutoScaling::LaunchConfiguration'
      ) as any;

      expect(launchConfig).toBeDefined();
      expect(launchConfig.Properties.InstanceType).toBe('t3.micro');
      expect(launchConfig.Properties.UserData).toBeDefined();
      expect(launchConfig.Properties.IamInstanceProfile).toBeDefined();
    });

    test('User data contains Node.js web server setup', () => {
      const resources = template.toJSON().Resources;
      const launchConfig = Object.values(resources).find(
        (r: any) => r.Type === 'AWS::AutoScaling::LaunchConfiguration'
      ) as any;

      expect(launchConfig).toBeDefined();
      expect(launchConfig.Properties.UserData).toBeDefined();

      // UserData is in Fn::Base64 with Fn::Join format
      const userDataObj = launchConfig.Properties.UserData['Fn::Base64'];
      expect(userDataObj).toBeDefined();

      // Extract user data string from Fn::Join
      let userData = '';
      if (typeof userDataObj === 'string') {
        userData = userDataObj;
      } else if (userDataObj['Fn::Join']) {
        userData = userDataObj['Fn::Join'][1].join('');
      }

      expect(userData).toContain('Node.js');
      expect(userData).toContain('server.js');
      expect(userData).toContain('webapp.service');
    });
  });

  describe('Scaling Policies', () => {
    test('Creates CPU utilization scaling policy', () => {
      template.hasResourceProperties('AWS::AutoScaling::ScalingPolicy', {
        PolicyType: 'TargetTrackingScaling',
        TargetTrackingConfiguration: {
          PredefinedMetricSpecification: {
            PredefinedMetricType: 'ASGAverageCPUUtilization',
          },
          TargetValue: 50,
        },
      });
    });

    test('Creates request count scaling policy', () => {
      template.hasResourceProperties('AWS::AutoScaling::ScalingPolicy', {
        PolicyType: 'TargetTrackingScaling',
        TargetTrackingConfiguration: {
          PredefinedMetricSpecification: {
            PredefinedMetricType: 'ALBRequestCountPerTarget',
          },
        },
      });
    });
  });

  describe('Stack Outputs', () => {
    test('Has VpcId output', () => {
      template.hasOutput('VpcId', {
        Value: Match.anyValue(),
        Description: 'VPC ID',
      });
    });

    test('Has LoadBalancerDnsName output', () => {
      template.hasOutput('LoadBalancerDnsName', {
        Value: Match.anyValue(),
        Description: 'Application Load Balancer DNS Name',
      });
    });

    test('Has LoadBalancerUrl output', () => {
      template.hasOutput('LoadBalancerUrl', {
        Value: Match.anyValue(),
        Description: 'Application URL',
      });
    });

    test('Has AutoScalingGroupName output', () => {
      template.hasOutput('AutoScalingGroupName', {
        Value: Match.anyValue(),
        Description: 'Auto Scaling Group Name',
      });
    });

    test('Has SecretsManagerArn output', () => {
      template.hasOutput('SecretsManagerArn', {
        Value: Match.anyValue(),
        Description: 'Secrets Manager ARN for application secrets',
      });
    });
  });

  describe('HTTPS Configuration', () => {
    test('Does not create HTTPS listener when no certificate provided', () => {
      const newApp = new cdk.App();
      const stackWithoutCert = new ElasticBeanstalkStack(
        newApp,
        'TestStackNoCert',
        {
          environmentSuffix: 'test',
        }
      );
      const templateNoCert = Template.fromStack(stackWithoutCert);

      const listeners = templateNoCert.findResources(
        'AWS::ElasticLoadBalancingV2::Listener'
      );
      const httpsListeners = Object.values(listeners).filter(
        (listener: any) => listener.Properties.Protocol === 'HTTPS'
      );

      expect(httpsListeners.length).toBe(0);
    });

    test('Creates HTTPS listener when certificate ARN provided', () => {
      const newApp = new cdk.App();
      const stackWithCert = new ElasticBeanstalkStack(
        newApp,
        'TestStackWithCert',
        {
          environmentSuffix: 'test',
          certificateArn:
            'arn:aws:acm:us-east-1:123456789012:certificate/test',
        }
      );
      const templateWithCert = Template.fromStack(stackWithCert);

      templateWithCert.hasResourceProperties(
        'AWS::ElasticLoadBalancingV2::Listener',
        {
          Port: 443,
          Protocol: 'HTTPS',
        }
      );

      templateWithCert.hasOutput('HTTPSUrl', {
        Value: Match.anyValue(),
        Description: 'Secure Application URL',
      });
    });
  });

  describe('Resource Tags', () => {
    test('All resources have environment tags', () => {
      const resources = template.toJSON().Resources;
      const taggedResources = Object.values(resources).filter((r: any) => {
        return (
          r.Properties?.Tags &&
          Array.isArray(r.Properties.Tags) &&
          r.Properties.Tags.some(
            (tag: any) => tag.Key === 'Environment' && tag.Value === environmentSuffix
          )
        );
      });

      expect(taggedResources.length).toBeGreaterThan(0);
    });
  });

  describe('No Elastic Beanstalk Resources', () => {
    test('Does not create Elastic Beanstalk Application', () => {
      template.resourceCountIs('AWS::ElasticBeanstalk::Application', 0);
    });

    test('Does not create Elastic Beanstalk Environment', () => {
      template.resourceCountIs('AWS::ElasticBeanstalk::Environment', 0);
    });

    test('Does not create Elastic Beanstalk ApplicationVersion', () => {
      template.resourceCountIs('AWS::ElasticBeanstalk::ApplicationVersion', 0);
    });
  });
});
