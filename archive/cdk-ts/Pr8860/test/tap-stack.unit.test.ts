import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'test';

describe('TapStack', () => {
  let app: cdk.App;
  let stack: TapStack;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();
    stack = new TapStack(app, 'TestTapStack', {
      environmentSuffix,
      env: {
        account: '123456789012',
        region: 'us-east-1',
      },
    });
    template = Template.fromStack(stack);
  });

  describe('VPC Configuration', () => {
    test('creates VPC with correct configuration', () => {
      template.hasResourceProperties('AWS::EC2::VPC', {
        CidrBlock: '10.1.0.0/16',
        EnableDnsHostnames: true,
        EnableDnsSupport: true,
      });
    });

    test('creates public subnets in 2 availability zones', () => {
      template.resourceCountIs('AWS::EC2::Subnet', 2);

      template.hasResourceProperties('AWS::EC2::Subnet', {
        MapPublicIpOnLaunch: true,
      });
    });

    test('creates internet gateway and attaches to VPC', () => {
      template.hasResourceProperties('AWS::EC2::InternetGateway', {});
      template.hasResourceProperties('AWS::EC2::VPCGatewayAttachment', {});
    });

    test('creates route tables with internet gateway routes', () => {
      template.hasResourceProperties('AWS::EC2::Route', {
        DestinationCidrBlock: '0.0.0.0/0',
      });
    });

    test('does not create NAT gateways', () => {
      template.resourceCountIs('AWS::EC2::NatGateway', 0);
      template.resourceCountIs('AWS::EC2::EIP', 0);
    });
  });

  describe('Security Groups', () => {
    test('creates EC2 security group with correct egress rules', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupDescription: 'Security group for EC2 instances',
        SecurityGroupEgress: [
          {
            CidrIp: '0.0.0.0/0',
            Description: 'Allow all outbound traffic by default',
            IpProtocol: '-1',
          },
        ],
      });
    });

    test('creates ALB security group with HTTP and HTTPS ingress', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupDescription: 'Security group for Application Load Balancer',
        SecurityGroupIngress: Match.arrayWith([
          Match.objectLike({
            CidrIp: '0.0.0.0/0',
            Description: 'Allow HTTP traffic',
            FromPort: 80,
            ToPort: 80,
          }),
          Match.objectLike({
            CidrIp: '0.0.0.0/0',
            Description: 'Allow HTTPS traffic',
            FromPort: 443,
            ToPort: 443,
          }),
        ]),
      });
    });

    test('allows traffic from ALB to EC2 instances', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroupIngress', {
        Description: 'Allow traffic from ALB',
        FromPort: 80,
        ToPort: 80,
        IpProtocol: 'tcp',
      });
    });
  });

  describe('IAM Roles', () => {
    test('creates EC2 role with correct managed policies', () => {
      const template_json = template.toJSON();
      const ec2Role = Object.entries(template_json.Resources).find(
        ([_, resource]: [string, any]) =>
          resource.Type === 'AWS::IAM::Role' &&
          resource.Properties?.AssumeRolePolicyDocument?.Statement?.[0]
            ?.Principal?.Service === 'ec2.amazonaws.com'
      );

      expect(ec2Role).toBeDefined();
      expect(ec2Role![1].Properties.ManagedPolicyArns).toHaveLength(2);
      expect(
        JSON.stringify(ec2Role![1].Properties.ManagedPolicyArns)
      ).toContain('CloudWatchAgentServerPolicy');
      expect(
        JSON.stringify(ec2Role![1].Properties.ManagedPolicyArns)
      ).toContain('AmazonSSMManagedInstanceCore');
    });

    test('creates Bedrock Agent role with correct permissions', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        AssumeRolePolicyDocument: {
          Statement: [
            {
              Action: 'sts:AssumeRole',
              Effect: 'Allow',
              Principal: {
                Service: 'bedrock.amazonaws.com',
              },
            },
          ],
        },
      });
    });

    test('Bedrock role has correct inline policy', () => {
      const template_json = template.toJSON();
      const bedrockRole = Object.entries(template_json.Resources).find(
        ([_, resource]: [string, any]) =>
          resource.Type === 'AWS::IAM::Role' &&
          resource.Properties?.AssumeRolePolicyDocument?.Statement?.[0]
            ?.Principal?.Service === 'bedrock.amazonaws.com'
      );

      expect(bedrockRole).toBeDefined();
      expect(bedrockRole![1].Properties.Policies).toBeDefined();
      expect(bedrockRole![1].Properties.Policies[0].PolicyName).toBe(
        'BedrockAgentCorePolicy'
      );

      const policyStatement =
        bedrockRole![1].Properties.Policies[0].PolicyDocument.Statement[0];
      expect(policyStatement.Effect).toBe('Allow');
      expect(policyStatement.Action).toContain('bedrock:InvokeModel');
      expect(policyStatement.Action).toContain(
        'bedrock:InvokeModelWithResponseStream'
      );
      expect(policyStatement.Action).toContain('bedrock-agentcore:*');
    });
  });

  describe('EC2 and Auto Scaling', () => {
    test('creates launch configuration with correct configuration', () => {
      template.hasResourceProperties('AWS::AutoScaling::LaunchConfiguration', {
        InstanceType: 't3.micro',
        UserData: Match.anyValue(),
      });
    });

    test('creates auto scaling group with correct capacity settings', () => {
      template.hasResourceProperties('AWS::AutoScaling::AutoScalingGroup', {
        MinSize: '1',
        MaxSize: '3',
        DesiredCapacity: '1',
      });
    });

    test('creates CPU-based scaling policy', () => {
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

    test('instance profile is created for EC2 instances', () => {
      template.hasResourceProperties('AWS::IAM::InstanceProfile', {});
    });
  });

  describe('Load Balancer', () => {
    test('creates application load balancer', () => {
      template.hasResourceProperties(
        'AWS::ElasticLoadBalancingV2::LoadBalancer',
        {
          Type: 'application',
          Scheme: 'internet-facing',
          Name: `multi-app-${environmentSuffix}-alb`,
        }
      );
    });

    test('creates target group with health check', () => {
      template.hasResourceProperties(
        'AWS::ElasticLoadBalancingV2::TargetGroup',
        {
          Port: 80,
          Protocol: 'HTTP',
          HealthCheckEnabled: true,
          HealthCheckPath: '/',
          HealthCheckProtocol: 'HTTP',
          HealthCheckIntervalSeconds: 30,
          HealthCheckTimeoutSeconds: 5,
          HealthyThresholdCount: 2,
          UnhealthyThresholdCount: 2,
          Matcher: {
            HttpCode: '200',
          },
        }
      );
    });

    test('creates listener on port 80', () => {
      template.hasResourceProperties('AWS::ElasticLoadBalancingV2::Listener', {
        Port: 80,
        Protocol: 'HTTP',
        DefaultActions: [
          {
            Type: 'forward',
          },
        ],
      });
    });
  });

  describe('S3 Bucket', () => {
    test('creates S3 bucket with versioning and encryption', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketName: Match.stringLikeRegexp(
          `multi-app-${environmentSuffix}-content-.*`
        ),
        VersioningConfiguration: {
          Status: 'Enabled',
        },
        BucketEncryption: {
          ServerSideEncryptionConfiguration: [
            {
              ServerSideEncryptionByDefault: {
                SSEAlgorithm: 'AES256',
              },
            },
          ],
        },
      });
    });

    test('has lifecycle rules configured', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        LifecycleConfiguration: {
          Rules: Match.arrayWith([
            Match.objectLike({
              Id: 'DeleteIncompleteMultipartUploads',
              Status: 'Enabled',
              AbortIncompleteMultipartUpload: {
                DaysAfterInitiation: 7,
              },
            }),
            Match.objectLike({
              Id: 'TransitionToIA',
              Status: 'Enabled',
              Transitions: Match.arrayWith([
                Match.objectLike({
                  StorageClass: 'STANDARD_IA',
                  TransitionInDays: 30,
                }),
                Match.objectLike({
                  StorageClass: 'GLACIER',
                  TransitionInDays: 90,
                }),
              ]),
            }),
          ]),
        },
      });
    });

    test('has public access blocked', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        PublicAccessBlockConfiguration: {
          BlockPublicAcls: true,
          BlockPublicPolicy: true,
          IgnorePublicAcls: true,
          RestrictPublicBuckets: true,
        },
      });
    });

    test('has SSL-only bucket policy', () => {
      template.hasResourceProperties('AWS::S3::BucketPolicy', {
        PolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Effect: 'Deny',
              Action: 's3:*',
              Condition: {
                Bool: {
                  'aws:SecureTransport': 'false',
                },
              },
            }),
          ]),
        },
      });
    });

    test('has auto-delete objects configured', () => {
      template.hasResource('Custom::S3AutoDeleteObjects', {});
    });
  });

  describe('CloudWatch', () => {
    test('creates CPU alarm', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        MetricName: 'CPUUtilization',
        Namespace: 'AWS/EC2',
        Statistic: 'Average',
        Period: 300,
        EvaluationPeriods: 2,
        Threshold: 80,
        ComparisonOperator: 'GreaterThanOrEqualToThreshold',
      });
    });
  });

  describe('Systems Manager Parameters', () => {
    test('creates VPC ID parameter', () => {
      template.hasResourceProperties('AWS::SSM::Parameter', {
        Name: `/multi-app/development/us-east-1/vpc-id`,
        Type: 'String',
        Description: Match.stringLikeRegexp('.*VPC ID.*'),
      });
    });

    test('creates ALB DNS parameter', () => {
      template.hasResourceProperties('AWS::SSM::Parameter', {
        Name: `/multi-app/development/us-east-1/alb-dns`,
        Type: 'String',
        Description: Match.stringLikeRegexp('.*ALB DNS.*'),
      });
    });

    test('creates S3 bucket name parameter', () => {
      template.hasResourceProperties('AWS::SSM::Parameter', {
        Name: `/multi-app/development/us-east-1/s3-bucket-name`,
        Type: 'String',
        Description: Match.stringLikeRegexp('.*S3 bucket.*'),
      });
    });

    test('creates Bedrock Agent role ARN parameter', () => {
      template.hasResourceProperties('AWS::SSM::Parameter', {
        Name: `/multi-app/development/us-east-1/bedrock-agent-role-arn`,
        Type: 'String',
        Description: Match.stringLikeRegexp('.*Bedrock Agent.*'),
      });
    });

    test('creates EKS cluster placeholder parameter for production', () => {
      // This test would only apply if environment is production
      if (environmentSuffix === 'prod') {
        template.hasResourceProperties('AWS::SSM::Parameter', {
          Name: Match.stringLikeRegexp('.*/eks-cluster-name'),
          Value: 'eks-cluster-placeholder',
        });
      }
    });
  });

  describe('EventBridge Scheduler', () => {
    test('creates scheduler role with correct permissions', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        AssumeRolePolicyDocument: {
          Statement: [
            {
              Action: 'sts:AssumeRole',
              Effect: 'Allow',
              Principal: {
                Service: 'scheduler.amazonaws.com',
              },
            },
          ],
        },
      });
    });

    test('creates maintenance Lambda function', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        Runtime: 'python3.9',
        Handler: 'index.handler',
        Environment: {
          Variables: {
            ENVIRONMENT: 'development',
            APPLICATION_NAME: 'multi-app',
          },
        },
      });
    });

    test('creates backup schedule for development environment', () => {
      template.hasResourceProperties('AWS::Scheduler::Schedule', {
        Name: `multi-app-${environmentSuffix}-backup-schedule`,
        Description: 'Automated backup schedule for infrastructure maintenance',
        ScheduleExpression: 'rate(12 hours)',
        ScheduleExpressionTimezone: 'UTC',
        FlexibleTimeWindow: {
          Mode: 'FLEXIBLE',
          MaximumWindowInMinutes: 15,
        },
        State: 'ENABLED',
      });
    });

    test('creates scaling schedule for peak hours', () => {
      template.hasResourceProperties('AWS::Scheduler::Schedule', {
        Name: `multi-app-${environmentSuffix}-scaling-schedule`,
        Description: 'Automated scaling schedule for peak hours',
        ScheduleExpression: 'cron(0 8 ? * MON-FRI *)',
        ScheduleExpressionTimezone: 'America/New_York',
        FlexibleTimeWindow: {
          Mode: 'FLEXIBLE',
          MaximumWindowInMinutes: 30,
        },
        State: 'DISABLED', // Disabled for development
      });
    });

    test('grants Lambda permission for scheduler invocation', () => {
      template.hasResourceProperties('AWS::Lambda::Permission', {
        Action: 'lambda:InvokeFunction',
        Principal: 'scheduler.amazonaws.com',
      });
    });

    test('stores scheduler role ARN in SSM parameter', () => {
      template.hasResourceProperties('AWS::SSM::Parameter', {
        Name: `/multi-app/development/us-east-1/scheduler-role-arn`,
        Type: 'String',
        Description: Match.stringLikeRegexp('.*EventBridge Scheduler role ARN.*'),
      });
    });
  });

  describe('Stack Outputs', () => {
    test('has VPC ID output', () => {
      template.hasOutput('VPCId', {
        Description: 'VPC ID',
      });
    });

    test('has Load Balancer DNS output', () => {
      template.hasOutput('LoadBalancerDNS', {
        Description: 'Load Balancer DNS Name',
      });
    });

    test('has S3 Bucket Name output', () => {
      template.hasOutput('BucketName', {
        Description: 'S3 Bucket Name',
      });
    });

    test('has Maintenance Function Name output', () => {
      template.hasOutput('MaintenanceFunctionName', {
        Description: 'EventBridge Scheduler Maintenance Function',
      });
    });

    test('has Application Name output', () => {
      template.hasOutput('ApplicationName', {
        Value: 'multi-app',
        Description: 'Application Name',
      });
    });

    test('has Environment output', () => {
      template.hasOutput('Environment', {
        Value: 'development',
        Description: 'Environment',
      });
    });
  });

  describe('Resource Tagging', () => {
    test('stack has correct tags applied', () => {
      const stackTags = stack.tags.tagValues();
      expect(stackTags).toMatchObject({
        Environment: 'development',
        Application: 'multi-app',
        Region: 'us-east-1',
        ManagedBy: 'CDK',
        Scheduler: 'EventBridge',
        EnhancedFeatures: 'EventBridgeScheduler',
      });
    });
  });

  describe('Environment-specific configuration', () => {
    test('uses development CIDR for non-prod environment', () => {
      template.hasResourceProperties('AWS::EC2::VPC', {
        CidrBlock: '10.1.0.0/16',
      });
    });

    test('uses correct capacity for development environment', () => {
      template.hasResourceProperties('AWS::AutoScaling::AutoScalingGroup', {
        MinSize: '1',
        MaxSize: '3',
        DesiredCapacity: '1',
      });
    });
  });

  describe('Production Environment', () => {
    test('production environment uses different configuration', () => {
      const prodApp = new cdk.App();
      const prodStack = new TapStack(prodApp, 'ProdStack', {
        environmentSuffix: 'prod',
        env: {
          account: '123456789012',
          region: 'us-east-1',
        },
      });
      const prodTemplate = Template.fromStack(prodStack);

      // Production should use different CIDR
      prodTemplate.hasResourceProperties('AWS::EC2::VPC', {
        CidrBlock: '10.0.0.0/16',
      });

      // Production should have higher capacity
      prodTemplate.hasResourceProperties('AWS::AutoScaling::AutoScalingGroup', {
        MinSize: '2',
        MaxSize: '6',
        DesiredCapacity: '2',
      });
    });
  });
});
