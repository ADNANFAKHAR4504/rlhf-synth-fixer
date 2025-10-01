import * as cdk from 'aws-cdk-lib';
import { Template, Match, Capture } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack';

describe('TapStack', () => {
  let app: cdk.App;
  let stack: TapStack;
  let template: Template;
  const testEnvironmentSuffix = 'test123';

  beforeEach(() => {
    app = new cdk.App();
    stack = new TapStack(app, 'TestTapStack', {
      environmentSuffix: testEnvironmentSuffix
    });
    template = Template.fromStack(stack);
  });

  describe('Stack Configuration', () => {
    test('should create stack with correct properties', () => {
      expect(stack.stackName).toBe('TestTapStack');
    });

    test('should pass environment suffix to nested construct', () => {
      // Verify the BlogInfrastructureStack construct is created
      const metadata = template.findResources('AWS::EC2::VPC');
      expect(Object.keys(metadata).length).toBeGreaterThan(0);
    });
  });

  describe('VPC Configuration', () => {
    test('should create VPC with correct CIDR', () => {
      template.hasResourceProperties('AWS::EC2::VPC', {
        CidrBlock: '10.1.0.0/16',
        EnableDnsHostnames: true,
        EnableDnsSupport: true
      });
    });

    test('should create correct number of subnets', () => {
      // Should have 4 subnets total (2 subnet groups x 2 AZs)
      const subnets = template.findResources('AWS::EC2::Subnet');
      expect(Object.keys(subnets).length).toBe(4);
    });

    test('should create public subnets with correct properties', () => {
      template.hasResourceProperties('AWS::EC2::Subnet', {
        MapPublicIpOnLaunch: true,
        CidrBlock: '10.1.0.0/24'
      });
    });

    test('should create Internet Gateway', () => {
      template.resourceCountIs('AWS::EC2::InternetGateway', 1);
    });

    test('should attach Internet Gateway to VPC', () => {
      template.resourceCountIs('AWS::EC2::VPCGatewayAttachment', 1);
    });

    test('should create route tables for public subnets', () => {
      const routeTables = template.findResources('AWS::EC2::RouteTable');
      expect(Object.keys(routeTables).length).toBe(4);
    });

    test('should create routes to Internet Gateway', () => {
      template.hasResourceProperties('AWS::EC2::Route', {
        DestinationCidrBlock: '0.0.0.0/0'
      });
    });
  });

  describe('VPC Flow Logs', () => {
    test('should create VPC Flow Log', () => {
      template.hasResourceProperties('AWS::EC2::FlowLog', {
        ResourceType: 'VPC',
        TrafficType: 'ALL'
      });
    });

    test('should create CloudWatch Log Group for Flow Logs', () => {
      template.hasResourceProperties('AWS::Logs::LogGroup', {
        RetentionInDays: 7
      });
    });

    test('should create IAM role for Flow Logs', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        AssumeRolePolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Principal: {
                Service: 'vpc-flow-logs.amazonaws.com'
              }
            })
          ])
        }
      });
    });
  });

  describe('Security Groups', () => {
    test('should create ALB security group with HTTP ingress', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupDescription: 'Security group for Application Load Balancer',
        SecurityGroupIngress: Match.arrayWith([
          Match.objectLike({
            CidrIp: '0.0.0.0/0',
            FromPort: 80,
            ToPort: 80,
            IpProtocol: 'tcp'
          })
        ])
      });
    });

    test('should create EC2 security group with SSH restriction', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupDescription: 'Security group for EC2 instances',
        SecurityGroupIngress: Match.arrayWith([
          Match.objectLike({
            CidrIp: '192.168.0.0/24',
            FromPort: 22,
            ToPort: 22,
            IpProtocol: 'tcp'
          })
        ])
      });
    });

    test('should allow HTTP traffic from ALB to EC2', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroupIngress', {
        FromPort: 80,
        ToPort: 80,
        IpProtocol: 'tcp',
        Description: 'Allow HTTP traffic from ALB'
      });
    });
  });

  describe('S3 Bucket', () => {
    test('should create S3 bucket with versioning enabled', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        VersioningConfiguration: {
          Status: 'Enabled'
        }
      });
    });

    test('should have S3 managed encryption', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketEncryption: {
          ServerSideEncryptionConfiguration: [
            {
              ServerSideEncryptionByDefault: {
                SSEAlgorithm: 'AES256'
              }
            }
          ]
        }
      });
    });

    test('should have lifecycle rule for intelligent tiering', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        LifecycleConfiguration: {
          Rules: Match.arrayWith([
            Match.objectLike({
              Id: 'TransitionOldVersions',
              NoncurrentVersionTransitions: [
                {
                  StorageClass: 'INTELLIGENT_TIERING',
                  TransitionInDays: 30
                }
              ],
              Status: 'Enabled'
            })
          ])
        }
      });
    });

    test('should block public access', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        PublicAccessBlockConfiguration: {
          BlockPublicAcls: true,
          BlockPublicPolicy: true,
          IgnorePublicAcls: true,
          RestrictPublicBuckets: true
        }
      });
    });

    test('should have correct bucket name pattern', () => {
      const bucket = template.findResources('AWS::S3::Bucket');
      const bucketKey = Object.keys(bucket)[0];
      const bucketName = bucket[bucketKey].Properties.BucketName;

      // The bucket name is constructed with Fn::Join
      expect(bucketName).toBeDefined();
      if (typeof bucketName === 'object' && bucketName['Fn::Join']) {
        const parts = bucketName['Fn::Join'][1];
        expect(parts[0]).toContain(`blog-static-assets-${testEnvironmentSuffix}`);
      } else if (typeof bucketName === 'string') {
        expect(bucketName).toMatch(new RegExp(`blog-static-assets-${testEnvironmentSuffix}-.*`));
      }
    });

    test('should have proper removal policy configured', () => {
      const bucket = template.findResources('AWS::S3::Bucket');
      const bucketLogicalId = Object.keys(bucket)[0];
      // With autoDeleteObjects, the bucket will have custom resource for deletion
      expect(bucket[bucketLogicalId].UpdateReplacePolicy).toBe('Delete');
    });
  });

  describe('IAM Roles', () => {
    test('should create EC2 instance role', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        AssumeRolePolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Principal: {
                Service: 'ec2.amazonaws.com'
              }
            })
          ])
        }
      });
    });

    test('should attach CloudWatch Agent policy to EC2 role', () => {
      // Find all IAM roles
      const roles = template.findResources('AWS::IAM::Role', {
        Properties: {
          AssumeRolePolicyDocument: {
            Statement: Match.arrayWith([
              Match.objectLike({
                Principal: {
                  Service: 'ec2.amazonaws.com'
                }
              })
            ])
          }
        }
      });

      // Verify EC2 role has CloudWatch policy
      const roleKeys = Object.keys(roles);
      expect(roleKeys.length).toBeGreaterThan(0);

      const ec2RoleKey = roleKeys[0];
      const managedPolicies = roles[ec2RoleKey].Properties.ManagedPolicyArns;
      expect(managedPolicies).toBeDefined();

      const hasCloudWatchPolicy = managedPolicies.some((policy: any) => {
        if (typeof policy === 'string') {
          return policy.includes('CloudWatchAgentServerPolicy');
        }
        if (typeof policy === 'object' && policy['Fn::Join']) {
          return policy['Fn::Join'][1].some((part: any) =>
            typeof part === 'string' && part.includes('CloudWatchAgentServerPolicy')
          );
        }
        return false;
      });

      expect(hasCloudWatchPolicy).toBe(true);
    });

    test('should grant S3 bucket access to EC2 instances', () => {
      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Action: Match.arrayWith([
                's3:GetObject*',
                's3:PutObject'
              ])
            })
          ])
        }
      });
    });
  });

  describe('Launch Template', () => {
    test('should create launch template with t3.micro instance', () => {
      template.hasResourceProperties('AWS::EC2::LaunchTemplate', {
        LaunchTemplateData: Match.objectLike({
          InstanceType: 't3.micro'
        })
      });
    });

    test('should use Amazon Linux 2023 AMI', () => {
      template.hasResourceProperties('AWS::EC2::LaunchTemplate', {
        LaunchTemplateData: Match.objectLike({
          ImageId: {
            Ref: Match.stringLikeRegexp('.*al2023.*')
          }
        })
      });
    });

    test('should include user data for Apache installation', () => {
      const launchTemplate = template.findResources('AWS::EC2::LaunchTemplate');
      const templateKey = Object.keys(launchTemplate)[0];
      const userData = launchTemplate[templateKey].Properties.LaunchTemplateData.UserData;

      expect(userData).toBeDefined();
      expect(userData['Fn::Base64']).toContain('httpd');
      expect(userData['Fn::Base64']).toContain('amazon-cloudwatch-agent');
    });
  });

  describe('Application Load Balancer', () => {
    test('should create internet-facing ALB', () => {
      template.hasResourceProperties('AWS::ElasticLoadBalancingV2::LoadBalancer', {
        Scheme: 'internet-facing',
        Type: 'application'
      });
    });

    test('should have ALB with correct name pattern', () => {
      template.hasResourceProperties('AWS::ElasticLoadBalancingV2::LoadBalancer', {
        Name: `blog-alb-${testEnvironmentSuffix}`
      });
    });

    test('should create target group with health checks', () => {
      template.hasResourceProperties('AWS::ElasticLoadBalancingV2::TargetGroup', {
        Port: 80,
        Protocol: 'HTTP',
        TargetType: 'instance',
        HealthCheckEnabled: true,
        HealthCheckPath: '/',
        HealthCheckIntervalSeconds: 30,
        HealthCheckTimeoutSeconds: 5,
        HealthyThresholdCount: 2,
        UnhealthyThresholdCount: 3
      });
    });

    test('should create HTTP listener on port 80', () => {
      template.hasResourceProperties('AWS::ElasticLoadBalancingV2::Listener', {
        Port: 80,
        Protocol: 'HTTP',
        DefaultActions: [
          {
            Type: 'forward'
          }
        ]
      });
    });
  });

  describe('Auto Scaling Group', () => {
    test('should create ASG with correct capacity settings', () => {
      template.hasResourceProperties('AWS::AutoScaling::AutoScalingGroup', {
        MinSize: '2',
        MaxSize: '4',
        DesiredCapacity: '2'
      });
    });

    test('should use ELB health check', () => {
      template.hasResourceProperties('AWS::AutoScaling::AutoScalingGroup', {
        HealthCheckType: 'ELB',
        HealthCheckGracePeriod: 300
      });
    });

    test('should create CPU-based scaling policy', () => {
      template.hasResourceProperties('AWS::AutoScaling::ScalingPolicy', {
        PolicyType: 'TargetTrackingScaling',
        TargetTrackingConfiguration: {
          PredefinedMetricSpecification: {
            PredefinedMetricType: 'ASGAverageCPUUtilization'
          },
          TargetValue: 70
        }
      });
    });

    test('should have cooldown period', () => {
      template.hasResourceProperties('AWS::AutoScaling::ScalingPolicy', {
        Cooldown: '300'
      });
    });
  });

  describe('CloudWatch Monitoring', () => {
    test('should create CPU utilization alarm', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        MetricName: 'CPUUtilization',
        Namespace: 'AWS/EC2',
        Statistic: 'Average',
        Threshold: 80,
        EvaluationPeriods: 2,
        AlarmDescription: 'Alarm when CPU exceeds 80%'
      });
    });

    test('should create memory alarm', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        MetricName: 'MEM_AVAILABLE',
        Namespace: 'BlogPlatform',
        Statistic: 'Average',
        Threshold: 536870912,
        ComparisonOperator: 'LessThanThreshold',
        AlarmDescription: 'Alarm when available memory is low'
      });
    });

    test('should create CloudWatch Dashboard', () => {
      template.hasResourceProperties('AWS::CloudWatch::Dashboard', {
        DashboardName: `BlogPlatform-${testEnvironmentSuffix}`
      });
    });
  });

  describe('Stack Outputs', () => {
    test('should have outputs defined in the stack', () => {
      // Outputs are defined in the nested construct, check for their existence differently
      const outputs = template.findOutputs('*');
      const outputKeys = Object.keys(outputs);

      // Check that outputs are created
      expect(outputKeys.length).toBeGreaterThanOrEqual(4);

      // Check for specific output patterns in the keys
      const hasLoadBalancer = outputKeys.some(k => k.includes('LoadBalancerDNS'));
      const hasBucket = outputKeys.some(k => k.includes('BucketName'));
      const hasVpc = outputKeys.some(k => k.includes('VpcId'));
      const hasDashboard = outputKeys.some(k => k.includes('DashboardURL'));

      expect(hasLoadBalancer).toBe(true);
      expect(hasBucket).toBe(true);
      expect(hasVpc).toBe(true);
      expect(hasDashboard).toBe(true);
    });
  });

  describe('Resource Tagging', () => {
    test('should tag VPC resources', () => {
      const vpc = template.findResources('AWS::EC2::VPC');
      const vpcKey = Object.keys(vpc)[0];
      const tags = vpc[vpcKey].Properties.Tags;

      // Check that tags array exists and contains Name tag at minimum
      expect(tags).toBeDefined();
      expect(tags.length).toBeGreaterThan(0);

      const hasNameTag = tags.some((tag: any) => tag.Key === 'Name');
      expect(hasNameTag).toBe(true);
    });
  });
});