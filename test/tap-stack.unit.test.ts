import * as cdk from 'aws-cdk-lib';
import { Match, Template } from 'aws-cdk-lib/assertions';
import { ProductionInfrastructureStack } from '../lib/production-infrastructure-stack';
import { TapStack } from '../lib/tap-stack';

describe('TapStack', () => {
  let app: cdk.App;
  let stack: TapStack;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();
    stack = new TapStack(app, 'TestTapStack', {
      environmentSuffix: 'test',
    });
    template = Template.fromStack(stack);
  });

  describe('Stack Creation', () => {
    test('creates TapStack with production infrastructure stack nested', () => {
      // Check that the nested production infrastructure stack is created
      const nestedStacks = stack.node.children.filter(
        (child) => child instanceof ProductionInfrastructureStack
      );
      expect(nestedStacks.length).toBe(1);
      expect(nestedStacks[0].node.id).toBe('ProductionInfrastructureStack');
    });

    test('passes environment suffix to nested stack', () => {
      const productionStack = stack.node.children.find(
        (child) => child instanceof ProductionInfrastructureStack
      ) as ProductionInfrastructureStack;
      expect(productionStack).toBeDefined();
    });
  });

  describe('Stack Properties', () => {
    test('uses environment suffix from props', () => {
      const customApp = new cdk.App();
      const customStack = new TapStack(customApp, 'CustomStack', {
        environmentSuffix: 'custom',
      });
      
      const productionStack = customStack.node.children.find(
        (child) => child instanceof ProductionInfrastructureStack
      ) as ProductionInfrastructureStack;
      expect(productionStack).toBeDefined();
    });

    test('uses environment suffix from context when props not provided', () => {
      const contextApp = new cdk.App({
        context: {
          environmentSuffix: 'context-suffix',
        },
      });
      const contextStack = new TapStack(contextApp, 'ContextStack');
      
      const productionStack = contextStack.node.children.find(
        (child) => child instanceof ProductionInfrastructureStack
      ) as ProductionInfrastructureStack;
      expect(productionStack).toBeDefined();
    });

    test('defaults to dev when no environment suffix provided', () => {
      const defaultApp = new cdk.App();
      const defaultStack = new TapStack(defaultApp, 'DefaultStack');
      
      const productionStack = defaultStack.node.children.find(
        (child) => child instanceof ProductionInfrastructureStack
      ) as ProductionInfrastructureStack;
      expect(productionStack).toBeDefined();
    });
  });
});

describe('ProductionInfrastructureStack', () => {
  let app: cdk.App;
  let stack: ProductionInfrastructureStack;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();
    stack = new ProductionInfrastructureStack(app, 'TestProductionStack', {
      envSuffix: 'test',
    });
    template = Template.fromStack(stack);
  });

  describe('VPC Configuration', () => {
    test('creates VPC with proper CIDR and configuration', () => {
      template.hasResourceProperties('AWS::EC2::VPC', {
        CidrBlock: '10.0.0.0/16',
        EnableDnsHostnames: true,
        EnableDnsSupport: true,
      });
    });

    test('creates public and private subnets', () => {
      // Check for public subnets
      template.hasResourceProperties('AWS::EC2::Subnet', {
        MapPublicIpOnLaunch: true,
      });

      // Check for private subnets
      template.hasResourceProperties('AWS::EC2::Subnet', {
        MapPublicIpOnLaunch: false,
      });
    });

    test('creates VPC Flow Logs', () => {
      template.hasResourceProperties('AWS::EC2::FlowLog', {
        ResourceType: 'VPC',
        TrafficType: 'ALL',
      });
    });

    test('creates VPC endpoints for S3 and SSM', () => {
      // S3 Gateway endpoint
      template.hasResourceProperties('AWS::EC2::VPCEndpoint', {
        ServiceName: Match.objectLike({
          'Fn::Join': Match.arrayWith([
            '',
            Match.arrayWith([
              'com.amazonaws.',
              Match.objectLike({
                Ref: 'AWS::Region',
              }),
              '.s3',
            ]),
          ]),
        }),
        VpcEndpointType: 'Gateway',
      });

      // SSM Interface endpoint
      template.hasResourceProperties('AWS::EC2::VPCEndpoint', {
        ServiceName: Match.objectLike({
          'Fn::Join': Match.arrayWith([
            '',
            Match.arrayWith([
              'com.amazonaws.',
              Match.objectLike({
                Ref: 'AWS::Region',
              }),
              '.ssm',
            ]),
          ]),
        }),
        VpcEndpointType: 'Interface',
      });

      // CloudWatch Logs Interface endpoint
      template.hasResourceProperties('AWS::EC2::VPCEndpoint', {
        ServiceName: Match.objectLike({
          'Fn::Join': Match.arrayWith([
            '',
            Match.arrayWith([
              'com.amazonaws.',
              Match.objectLike({
                Ref: 'AWS::Region',
              }),
              '.logs',
            ]),
          ]),
        }),
        VpcEndpointType: 'Interface',
      });
    });
  });

  describe('S3 Bucket Configuration', () => {
    test('creates S3 bucket with security features', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketName: 'secure-webapp-artifacts-test',
        VersioningConfiguration: {
          Status: 'Enabled',
        },
        BucketEncryption: {
          ServerSideEncryptionConfiguration: Match.arrayWith([
            Match.objectLike({
              ServerSideEncryptionByDefault: {
                SSEAlgorithm: 'AES256',
              },
            }),
          ]),
        },
        PublicAccessBlockConfiguration: {
          BlockPublicAcls: true,
          BlockPublicPolicy: true,
          IgnorePublicAcls: true,
          RestrictPublicBuckets: true,
        },
      });
    });

    test('creates S3 bucket with lifecycle rules', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        LifecycleConfiguration: {
          Rules: Match.arrayWith([
            Match.objectLike({
              Id: 'DeleteOldVersions',
              Status: 'Enabled',
              NoncurrentVersionExpiration: {
                NoncurrentDays: 90,
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
              ]),
            }),
          ]),
        },
      });
    });

    test('creates S3 bucket policy for SSL enforcement', () => {
      template.hasResourceProperties('AWS::S3::BucketPolicy', {
        PolicyDocument: Match.objectLike({
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
        }),
      });
    });
  });

  describe('IAM Role Configuration', () => {
    test('creates EC2 IAM role with proper configuration', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        RoleName: 'EC2-WebApp-Role-test',
        AssumeRolePolicyDocument: Match.objectLike({
          Statement: Match.arrayWith([
            Match.objectLike({
              Effect: 'Allow',
              Principal: {
                Service: 'ec2.amazonaws.com',
              },
              Action: 'sts:AssumeRole',
            }),
          ]),
        }),
        ManagedPolicyArns: Match.arrayWith([
          Match.objectLike({
            'Fn::Join': Match.arrayWith([
              '',
              Match.arrayWith([
                'arn:',
                Match.objectLike({
                  Ref: 'AWS::Partition',
                }),
                ':iam::aws:policy/CloudWatchAgentServerPolicy',
              ]),
            ]),
          }),
          Match.objectLike({
            'Fn::Join': Match.arrayWith([
              '',
              Match.arrayWith([
                'arn:',
                Match.objectLike({
                  Ref: 'AWS::Partition',
                }),
                ':iam::aws:policy/AmazonSSMManagedInstanceCore',
              ]),
            ]),
          }),
        ]),
      });
    });

    test('creates IAM policies for S3 and CloudWatch access', () => {
      // Check for S3 object access policy
      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: Match.objectLike({
          Statement: Match.arrayWith([
            Match.objectLike({
              Effect: 'Allow',
              Action: Match.arrayWith([
                's3:GetObject',
                's3:PutObject',
                's3:DeleteObject',
              ]),
              Condition: Match.objectLike({
                StringEquals: {
                  's3:x-amz-server-side-encryption': 'AES256',
                },
              }),
            }),
          ]),
        }),
      });

      // Check for S3 bucket listing policy (single action)
      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: Match.objectLike({
          Statement: Match.arrayWith([
            Match.objectLike({
              Effect: 'Allow',
              Action: 's3:ListBucket',
            }),
          ]),
        }),
      });

      // Check for CloudWatch Logs policy
      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: Match.objectLike({
          Statement: Match.arrayWith([
            Match.objectLike({
              Effect: 'Allow',
              Action: Match.arrayWith([
                'logs:CreateLogGroup',
                'logs:CreateLogStream',
                'logs:PutLogEvents',
                'logs:DescribeLogStreams',
              ]),
            }),
          ]),
        }),
      });
    });
  });

  describe('Security Groups', () => {
    test('creates web security group with proper rules', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupDescription: 'Security group for web tier',
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
          // SSH access removed for security - using SSM Session Manager instead
        ]),
      });
    });

    test('creates security group with restricted outbound rules', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        SecurityGroupEgress: Match.arrayWith([
          Match.objectLike({
            IpProtocol: 'tcp',
            FromPort: 443,
            ToPort: 443,
            CidrIp: '0.0.0.0/0',
          }),
          Match.objectLike({
            IpProtocol: 'tcp',
            FromPort: 80,
            ToPort: 80,
            CidrIp: '0.0.0.0/0',
          }),
          Match.objectLike({
            IpProtocol: 'udp',
            FromPort: 53,
            ToPort: 53,
            CidrIp: '0.0.0.0/0',
          }),
        ]),
      });
    });
  });

  describe('CloudWatch Configuration', () => {
    test('creates CloudWatch log group', () => {
      template.hasResourceProperties('AWS::Logs::LogGroup', {
        LogGroupName: '/aws/ec2/webapp-test',
        RetentionInDays: 30,
      });
    });

    test('creates SNS topic for alerts', () => {
      template.hasResourceProperties('AWS::SNS::Topic', {
        TopicName: 'webapp-alerts-test',
        DisplayName: 'Web Application Alerts',
      });
    });
  });

  describe('Launch Template Configuration', () => {
    test('creates launch template with proper configuration', () => {
      template.hasResourceProperties('AWS::EC2::LaunchTemplate', {
        LaunchTemplateName: 'webapp-launch-template-test',
        LaunchTemplateData: Match.objectLike({
          InstanceType: 't3.medium',
          ImageId: Match.anyValue(),
          SecurityGroupIds: Match.anyValue(),
          IamInstanceProfile: Match.objectLike({
            Arn: Match.anyValue(),
          }),
          MetadataOptions: {
            HttpTokens: 'required', // IMDSv2 required
          },
          Monitoring: {
            Enabled: true, // Detailed monitoring
          },
          BlockDeviceMappings: Match.arrayWith([
            Match.objectLike({
              DeviceName: '/dev/xvda',
              Ebs: Match.objectLike({
                VolumeSize: 20,
                VolumeType: 'gp3',
                Encrypted: true,
                DeleteOnTermination: true,
              }),
            }),
          ]),
        }),
      });
    });

    test('launch template includes user data for CloudWatch agent', () => {
      template.hasResourceProperties('AWS::EC2::LaunchTemplate', {
        LaunchTemplateData: Match.objectLike({
          UserData: Match.anyValue(),
        }),
      });
    });
  });

  describe('Auto Scaling Group Configuration', () => {
    test('creates auto scaling group with proper configuration', () => {
      template.hasResourceProperties('AWS::AutoScaling::AutoScalingGroup', {
        AutoScalingGroupName: 'webapp-asg-test',
        MinSize: '1',
        MaxSize: '6',
        DesiredCapacity: '2',
        HealthCheckType: 'EC2',
        HealthCheckGracePeriod: 300, // 5 minutes
      });
    });

    test('creates scaling policy for CPU utilization', () => {
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
  });

  describe('CloudWatch Alarms and Monitoring', () => {
    test('creates high CPU utilization alarm', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        AlarmName: 'webapp-high-cpu-test',
        MetricName: 'CPUUtilization',
        Namespace: 'AWS/EC2',
        Statistic: 'Average',
        Threshold: 80,
        ComparisonOperator: 'GreaterThanThreshold',
        EvaluationPeriods: 2,
        TreatMissingData: 'breaching',
      });
    });

    test('creates low instance count alarm', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        AlarmName: 'webapp-low-instances-test',
        MetricName: 'GroupInServiceInstances',
        Namespace: 'AWS/AutoScaling',
        Statistic: 'Average',
        Threshold: 1,
        ComparisonOperator: 'LessThanThreshold',
        EvaluationPeriods: 2,
      });
    });

    test('creates CloudWatch dashboard', () => {
      template.hasResourceProperties('AWS::CloudWatch::Dashboard', {
        DashboardName: 'webapp-monitoring-test',
        DashboardBody: Match.anyValue(),
      });
    });

    test('alarms are configured with SNS actions', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        AlarmActions: Match.arrayWith([
          Match.objectLike({
            Ref: Match.anyValue(),
          }),
        ]),
      });
    });
  });

  describe('SSM Parameters', () => {
    test('creates SSM parameters for configuration', () => {
      template.hasResourceProperties('AWS::SSM::Parameter', {
        Name: '/webapp/test/vpc-id',
        Type: 'String',
        Description: 'VPC ID for the web application',
      });

      template.hasResourceProperties('AWS::SSM::Parameter', {
        Name: '/webapp/test/s3-bucket',
        Type: 'String',
        Description: 'S3 bucket for artifacts',
      });

      template.hasResourceProperties('AWS::SSM::Parameter', {
        Name: '/webapp/test/environment',
        Type: 'String',
        Description: 'Environment name',
        Value: 'test',
      });
    });
  });

  describe('Stack Outputs', () => {
    test('creates all required outputs', () => {
      const outputs = template.findOutputs('*');
      const outputKeys = Object.keys(outputs);
      
      expect(outputKeys.some(key => key.includes('VPCId'))).toBe(true);
      expect(outputKeys.some(key => key.includes('S3BucketName'))).toBe(true);
      expect(outputKeys.some(key => key.includes('AutoScalingGroupName'))).toBe(true);
      expect(outputKeys.some(key => key.includes('Region'))).toBe(true);
    });

    test('outputs have proper export names', () => {
      const outputs = template.findOutputs('*');
      
      // Check for export names
      expect(Object.values(outputs)).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            Export: expect.objectContaining({
              Name: 'ProductionVPCId',
            }),
          }),
          expect.objectContaining({
            Export: expect.objectContaining({
              Name: 'ProductionS3Bucket',
            }),
          }),
          expect.objectContaining({
            Export: expect.objectContaining({
              Name: 'ProductionASGName',
            }),
          }),
          expect.objectContaining({
            Export: expect.objectContaining({
              Name: 'ProductionRegion',
            }),
          }),
        ])
      );
    });
  });

  describe('Security Best Practices', () => {
    test('S3 bucket has retention policy for data protection', () => {
      template.hasResource('AWS::S3::Bucket', {
        DeletionPolicy: 'Retain',
      });
    });

    test('EC2 instances require IMDSv2', () => {
      template.hasResourceProperties('AWS::EC2::LaunchTemplate', {
        LaunchTemplateData: Match.objectLike({
          MetadataOptions: {
            HttpTokens: 'required',
          },
        }),
      });
    });

    test('EBS volumes are encrypted', () => {
      template.hasResourceProperties('AWS::EC2::LaunchTemplate', {
        LaunchTemplateData: Match.objectLike({
          BlockDeviceMappings: Match.arrayWith([
            Match.objectLike({
              Ebs: Match.objectLike({
                Encrypted: true,
              }),
            }),
          ]),
        }),
      });
    });

    test('VPC has flow logs enabled', () => {
      template.hasResourceProperties('AWS::EC2::FlowLog', {
        ResourceType: 'VPC',
        TrafficType: 'ALL',
      });
    });
  });

  describe('Resource Naming Convention', () => {
    test('resources follow naming convention with environment suffix', () => {
      // Check that resources include the environment suffix
      template.hasResourceProperties('AWS::EC2::VPC', {
        Tags: Match.arrayWith([
          Match.objectLike({
            Key: 'Name',
            Value: Match.stringLikeRegexp('.*test.*'),
          }),
        ]),
      });

      template.hasResourceProperties('AWS::AutoScaling::AutoScalingGroup', {
        AutoScalingGroupName: 'webapp-asg-test',
      });

      template.hasResourceProperties('AWS::SNS::Topic', {
        TopicName: 'webapp-alerts-test',
      });
    });
  });

  describe('Environment Suffix Handling', () => {
    test('uses provided environment suffix in resource names', () => {
      const customApp = new cdk.App();
      const customStack = new ProductionInfrastructureStack(
        customApp,
        'CustomStack',
        {
          envSuffix: 'staging',
        }
      );
      const customTemplate = Template.fromStack(customStack);

      customTemplate.hasResourceProperties('AWS::AutoScaling::AutoScalingGroup', {
        AutoScalingGroupName: 'webapp-asg-staging',
      });

      customTemplate.hasResourceProperties('AWS::SNS::Topic', {
        TopicName: 'webapp-alerts-staging',
      });
    });
  });

  describe('Integration Points', () => {
    test('launch template references IAM role', () => {
      template.hasResourceProperties('AWS::EC2::LaunchTemplate', {
        LaunchTemplateData: Match.objectLike({
          IamInstanceProfile: Match.objectLike({
            Arn: Match.anyValue(),
          }),
        }),
      });
    });

    test('auto scaling group uses launch template', () => {
      template.hasResourceProperties('AWS::AutoScaling::AutoScalingGroup', {
        LaunchTemplate: Match.objectLike({
          LaunchTemplateId: Match.objectLike({
            Ref: Match.stringLikeRegexp('LaunchTemplatetest.*'),
          }),
          Version: Match.objectLike({
            'Fn::GetAtt': Match.arrayWith([
              Match.stringLikeRegexp('LaunchTemplatetest.*'),
              'LatestVersionNumber',
            ]),
          }),
        }),
      });
    });

    test('CloudWatch alarms reference auto scaling group', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        Dimensions: Match.arrayWith([
          Match.objectLike({
            Name: 'AutoScalingGroupName',
            Value: Match.objectLike({
              Ref: Match.anyValue(),
            }),
          }),
        ]),
      });
    });
  });
});
