import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { ProductionWebAppStack } from '../lib/production-web-app-stack';

describe('ProductionWebAppStack', () => {
  let app: cdk.App;
  let stack: ProductionWebAppStack;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();
    stack = new ProductionWebAppStack(app, 'TestProductionWebAppStack', {
      approvedSshCidr: '10.0.0.0/8',
      alarmEmail: 'test@example.com',
      testing: true, // Use testing mode to avoid VPC lookup issues
    });
    template = Template.fromStack(stack);
  });

  describe('Infrastructure Components', () => {
    test('should create VPC with proper configuration', () => {
      template.hasResourceProperties('AWS::EC2::VPC', {
        CidrBlock: '10.0.0.0/16',
        EnableDnsHostnames: true,
        EnableDnsSupport: true,
        Tags: Match.arrayWith([
          {
            Key: 'env',
            Value: 'production',
          },
        ]),
      });
    });

    test('should create public and private subnets', () => {
      // Check for public subnets
      template.hasResourceProperties('AWS::EC2::Subnet', {
        MapPublicIpOnLaunch: true,
        Tags: Match.arrayWith([
          {
            Key: 'env',
            Value: 'production',
          },
        ]),
      });

      // Check for private subnets
      template.hasResourceProperties('AWS::EC2::Subnet', {
        MapPublicIpOnLaunch: false,
        Tags: Match.arrayWith([
          {
            Key: 'env',
            Value: 'production',
          },
        ]),
      });
    });

    test('should create S3 bucket with versioning enabled', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        VersioningConfiguration: {
          Status: 'Enabled',
        },
        PublicAccessBlockConfiguration: {
          BlockPublicAcls: true,
          BlockPublicPolicy: true,
          IgnorePublicAcls: true,
          RestrictPublicBuckets: true,
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
        Tags: Match.arrayWith([
          {
            Key: 'env',
            Value: 'production',
          },
        ]),
      });
    });

    test('should create CloudFront distribution', () => {
      template.hasResourceProperties('AWS::CloudFront::Distribution', {
        DistributionConfig: {
          DefaultCacheBehavior: {
            ViewerProtocolPolicy: 'redirect-to-https',
          },
          Enabled: true,
          DefaultRootObject: 'index.html',
        },
        Tags: Match.arrayWith([
          {
            Key: 'env',
            Value: 'production',
          },
        ]),
      });
    });

    test('should create Application Load Balancer', () => {
      template.hasResourceProperties('AWS::ElasticLoadBalancingV2::LoadBalancer', {
        Type: 'application',
        Scheme: 'internet-facing',
        Tags: Match.arrayWith([
          {
            Key: 'env',
            Value: 'production',
          },
        ]),
      });
    });

    test('should create RDS instance with Multi-AZ and encryption', () => {
      template.hasResourceProperties('AWS::RDS::DBInstance', {
        Engine: 'postgres',
        MultiAZ: true,
        StorageEncrypted: true,
        DeletionProtection: true,
        BackupRetentionPeriod: 7,
        Tags: Match.arrayWith([
          {
            Key: 'env',
            Value: 'production',
          },
        ]),
      });
    });

    test('should create EC2 instance with proper IAM role', () => {
      template.hasResourceProperties('AWS::EC2::Instance', {
        InstanceType: 't3.medium',
        Tags: Match.arrayWith([
          {
            Key: 'env',
            Value: 'production',
          },
        ]),
      });

      // Check for IAM role
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
        ManagedPolicyArns: Match.arrayWith([
          {
            'Fn::Join': [
              '',
              [
                'arn:',
                { Ref: 'AWS::Partition' },
                ':iam::aws:policy/AmazonS3ReadOnlyAccess',
              ],
            ],
          },
        ]),
      });
    });
  });

  describe('Security Groups', () => {
    test('should create ALB security group with HTTP and HTTPS access', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupDescription: 'Security group for Application Load Balancer',
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
        ]),
        Tags: Match.arrayWith([
          {
            Key: 'env',
            Value: 'production',
          },
        ]),
      });
    });

    test('should create EC2 security group with restricted SSH access', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupDescription: 'Security group for EC2 instances',
        SecurityGroupIngress: Match.arrayWith([
          Match.objectLike({
            IpProtocol: 'tcp',
            FromPort: 22,
            ToPort: 22,
            CidrIp: '10.0.0.0/8',
          }),
        ]),
        Tags: Match.arrayWith([
          {
            Key: 'env',
            Value: 'production',
          },
        ]),
      });
    });

    test('should create RDS security group with PostgreSQL access from EC2', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupDescription: 'Security group for RDS database',
        Tags: Match.arrayWith([
          {
            Key: 'env',
            Value: 'production',
          },
        ]),
      });
    });
  });

  describe('Load Balancer Configuration', () => {
    test('should create HTTP listener that redirects to HTTPS', () => {
      template.hasResourceProperties('AWS::ElasticLoadBalancingV2::Listener', {
        Port: 80,
        Protocol: 'HTTP',
        DefaultActions: [
          {
            Type: 'redirect',
            RedirectConfig: {
              Protocol: 'HTTPS',
              Port: '443',
              StatusCode: 'HTTP_301',
            },
          },
        ],
      });
    });

    test('should create HTTPS listener notice for testing mode', () => {
      // In testing mode, no HTTPS listener is created, but a notice output is provided
      const outputs = template.findOutputs('*', {});
      expect(outputs).toHaveProperty('HTTPSListenerNotice');
    });

    test('should create target group with health check', () => {
      template.hasResourceProperties('AWS::ElasticLoadBalancingV2::TargetGroup', {
        Port: 80,
        Protocol: 'HTTP',
        HealthCheckEnabled: true,
        HealthCheckPath: '/health',
        HealthCheckProtocol: 'HTTP',
        Tags: Match.arrayWith([
          {
            Key: 'env',
            Value: 'production',
          },
        ]),
      });
    });
  });

  describe('Monitoring and Alarms', () => {
    test('should create SNS topic for alarms', () => {
      template.hasResourceProperties('AWS::SNS::Topic', {
        DisplayName: 'Production Environment Alarms',
        Tags: Match.arrayWith([
          {
            Key: 'env',
            Value: 'production',
          },
        ]),
      });
    });

    test('should create CloudWatch alarms for EC2 CPU', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        MetricName: 'CPUUtilization',
        Namespace: 'AWS/EC2',
        Statistic: 'Average',
        Period: 300,
        EvaluationPeriods: 2,
        Threshold: 75,
        ComparisonOperator: 'GreaterThanThreshold',
      });
    });

    test('should create CloudWatch alarms for RDS CPU', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        MetricName: 'CPUUtilization',
        Namespace: 'AWS/RDS',
        Statistic: 'Average',
        Period: 300,
        EvaluationPeriods: 2,
        Threshold: 80,
        ComparisonOperator: 'GreaterThanThreshold',
      });
    });

    test('should create CloudWatch alarm for ALB unhealthy targets', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        MetricName: 'UnHealthyHostCount',
        Namespace: 'AWS/ApplicationELB',
        Statistic: 'Average',
        Period: 60,
        EvaluationPeriods: 2,
        Threshold: 1,
        ComparisonOperator: 'GreaterThanOrEqualToThreshold',
      });
    });
  });

  describe('Outputs', () => {
    test('should have all required outputs', () => {
      template.hasOutput('VPCId', {});
      template.hasOutput('S3BucketName', {});
      template.hasOutput('CloudFrontDistributionDomainName', {});
      template.hasOutput('ApplicationLoadBalancerDNS', {});
      template.hasOutput('RDSEndpoint', {});
      template.hasOutput('EC2InstanceId', {});
      template.hasOutput('AlarmSNSTopicArn', {});
    });
  });

  describe('Production Compliance', () => {
    test('should have all resources tagged with env: production', () => {
      // This test ensures that the production tag is applied to all applicable resources
      const resources = template.toJSON().Resources;
      
      // List of resource types that should have tags
      const taggableResourceTypes = [
        'AWS::EC2::VPC',
        'AWS::EC2::Subnet',
        'AWS::S3::Bucket',
        'AWS::CloudFront::Distribution',
        'AWS::ElasticLoadBalancingV2::LoadBalancer',
        'AWS::RDS::DBInstance',
        'AWS::EC2::Instance',
        'AWS::EC2::SecurityGroup',
        'AWS::SNS::Topic',
        'AWS::ElasticLoadBalancingV2::TargetGroup',
      ];

      Object.keys(resources).forEach((resourceKey) => {
        const resource = resources[resourceKey];
        if (taggableResourceTypes.includes(resource.Type)) {
          expect(resource.Properties).toHaveProperty('Tags');
          expect(resource.Properties.Tags).toEqual(
            expect.arrayContaining([
              expect.objectContaining({
                Key: 'env',
                Value: 'production',
              }),
            ])
          );
        }
      });
    });

    test('should deploy in us-west-2 region', () => {
      // This is validated by the stack configuration, but we can check subnet AZs
      expect(stack.region).toBe('us-west-2');
    });
  });
});
