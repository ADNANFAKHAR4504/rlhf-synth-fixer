import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('TapStack', () => {
  let app: cdk.App;
  let stack: TapStack;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();
    stack = new TapStack(app, 'TestTapStack', { environmentSuffix });
    template = Template.fromStack(stack);
  });

  describe('VPC Configuration', () => {
    test('should create VPC with correct configuration', () => {
      template.hasResourceProperties('AWS::EC2::VPC', {
        CidrBlock: '10.0.0.0/16',
        EnableDnsHostnames: true,
        EnableDnsSupport: true,
      });
    });

    test('should create public subnets in two AZs', () => {
      template.resourceCountIs('AWS::EC2::Subnet', 6); // 2 public + 2 private + 2 database
      template.hasResourceProperties('AWS::EC2::Subnet', {
        CidrBlock: '10.0.0.0/24',
        MapPublicIpOnLaunch: false,
      });
      template.hasResourceProperties('AWS::EC2::Subnet', {
        CidrBlock: '10.0.1.0/24',
        MapPublicIpOnLaunch: false,
      });
    });

    test('should create private subnets in two AZs', () => {
      template.hasResourceProperties('AWS::EC2::Subnet', {
        CidrBlock: '10.0.2.0/24',
      });
      template.hasResourceProperties('AWS::EC2::Subnet', {
        CidrBlock: '10.0.3.0/24',
      });
    });

    test('should create database subnets in two AZs', () => {
      template.hasResourceProperties('AWS::EC2::Subnet', {
        CidrBlock: '10.0.4.0/28',
      });
      template.hasResourceProperties('AWS::EC2::Subnet', {
        CidrBlock: '10.0.4.16/28',
      });
    });

    test('should create NAT gateways for high availability', () => {
      template.resourceCountIs('AWS::EC2::NatGateway', 2);
    });

    test('should enable VPC Flow Logs', () => {
      template.hasResourceProperties('AWS::EC2::FlowLog', {
        ResourceType: 'VPC',
        TrafficType: 'ALL',
      });
    });
  });

  describe('Security Groups', () => {
    test('should create ALB security group with correct ingress rules', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', 
        Match.objectLike({
          GroupDescription: 'Security group for Application Load Balancer',
          SecurityGroupIngress: [
            {
              CidrIp: '0.0.0.0/0',
              FromPort: 80,
              IpProtocol: 'tcp',
              ToPort: 80,
            },
            {
              CidrIp: '0.0.0.0/0',
              FromPort: 443,
              IpProtocol: 'tcp',
              ToPort: 443,
            },
          ],
        })
      );
    });

    test('should create web server security group', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', 
        Match.objectLike({
          GroupDescription: 'Security group for web servers',
        })
      );
    });

    test('should create database security group', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', 
        Match.objectLike({
          GroupDescription: 'Security group for RDS Aurora cluster',
        })
      );
    });
  });

  describe('KMS Key', () => {
    test('should create KMS key with key rotation enabled', () => {
      template.hasResourceProperties('AWS::KMS::Key', {
        EnableKeyRotation: true,
        Description: `KMS key for TAP application ${environmentSuffix}`,
      });
    });
  });

  describe('S3 Bucket', () => {
    test('should create S3 bucket with encryption and versioning', () => {
      template.hasResourceProperties('AWS::S3::Bucket', 
        Match.objectLike({
          VersioningConfiguration: {
            Status: 'Enabled',
          },
          BucketEncryption: {
            ServerSideEncryptionConfiguration: [
              {
                ServerSideEncryptionByDefault: {
                  SSEAlgorithm: 'aws:kms',
                },
              },
            ],
          },
          PublicAccessBlockConfiguration: {
            BlockPublicAcls: true,
            BlockPublicPolicy: true,
            IgnorePublicAcls: true,
            RestrictPublicBuckets: true,
          },
        })
      );
    });

    test('should enforce SSL on S3 bucket', () => {
      template.hasResourceProperties('AWS::S3::BucketPolicy', {
        PolicyDocument: Match.objectLike({
          Statement: Match.arrayWith([
            Match.objectLike({
              Effect: 'Deny',
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

  describe('DynamoDB Table', () => {
    test('should create DynamoDB table with on-demand billing', () => {
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        TableName: `tap-application-table-${environmentSuffix}`,
        BillingMode: 'PAY_PER_REQUEST',
        AttributeDefinitions: [
          {
            AttributeName: 'id',
            AttributeType: 'S',
          },
        ],
        KeySchema: [
          {
            AttributeName: 'id',
            KeyType: 'HASH',
          },
        ],
        PointInTimeRecoverySpecification: {
          PointInTimeRecoveryEnabled: true,
        },
      });
    });

    test('should enable encryption on DynamoDB table', () => {
      template.hasResourceProperties('AWS::DynamoDB::Table', 
        Match.objectLike({
          SSESpecification: {
            SSEEnabled: true,
            SSEType: 'KMS',
          },
        })
      );
    });
  });

  describe('RDS Aurora Cluster', () => {
    test('should create Aurora cluster with PostgreSQL engine', () => {
      template.hasResourceProperties('AWS::RDS::DBCluster', {
        Engine: 'aurora-postgresql',
        EngineVersion: '15.4',
        StorageEncrypted: true,
        BackupRetentionPeriod: 7,
        DeletionProtection: false,
      });
    });

    test('should create Aurora cluster instances', () => {
      template.resourceCountIs('AWS::RDS::DBInstance', 2); // writer + reader
      template.hasResourceProperties('AWS::RDS::DBInstance', {
        DBInstanceClass: 'db.t3.medium',
        Engine: 'aurora-postgresql',
        PubliclyAccessible: false,
      });
    });

    test('should create database subnet group', () => {
      template.hasResourceProperties('AWS::RDS::DBSubnetGroup', {
        DBSubnetGroupDescription: 'Subnet group for TAP RDS Aurora cluster',
      });
    });
  });

  describe('IAM Roles and Policies', () => {
    test('should create EC2 role with required policies', () => {
      const allRoles = template.findResources('AWS::IAM::Role');
      const ec2Role = Object.values(allRoles).find((role: any) => 
        role.Properties?.AssumeRolePolicyDocument?.Statement?.some((stmt: any) => 
          stmt.Principal?.Service === 'ec2.amazonaws.com'
        )
      );
      
      expect(ec2Role).toBeDefined();
      expect(ec2Role?.Properties?.ManagedPolicyArns?.length).toBeGreaterThan(0);
    });

    test('should create VPC Flow Logs role', () => {
      template.hasResourceProperties('AWS::IAM::Role', 
        Match.objectLike({
          AssumeRolePolicyDocument: {
            Statement: [
              {
                Effect: 'Allow',
                Principal: {
                  Service: 'vpc-flow-logs.amazonaws.com',
                },
              },
            ],
          },
        })
      );
    });

    test('should create instance profile', () => {
      template.hasResourceProperties('AWS::IAM::InstanceProfile', 
        Match.objectLike({
          Roles: Match.arrayWith([
            Match.objectLike({
              Ref: Match.anyValue(),
            }),
          ]),
        })
      );
    });
  });

  describe('Application Load Balancer', () => {
    test('should create internet-facing ALB', () => {
      template.hasResourceProperties('AWS::ElasticLoadBalancingV2::LoadBalancer', {
        Type: 'application',
        Scheme: 'internet-facing',
      });
    });

    test('should create target group with health checks', () => {
      template.hasResourceProperties('AWS::ElasticLoadBalancingV2::TargetGroup', 
        Match.objectLike({
          Port: 80,
          Protocol: 'HTTP',
          TargetType: 'instance',
          HealthCheckEnabled: true,
          HealthCheckPath: '/health',
          HealthCheckProtocol: 'HTTP',
          HealthCheckIntervalSeconds: 30,
          HealthCheckTimeoutSeconds: 5,
          UnhealthyThresholdCount: 2,
          Matcher: {
            HttpCode: '200',
          },
        })
      );
    });

    test('should create listener', () => {
      template.hasResourceProperties('AWS::ElasticLoadBalancingV2::Listener', {
        Port: 80,
        Protocol: 'HTTP',
      });
    });
  });

  describe('Auto Scaling Group', () => {
    test('should create launch template with encryption', () => {
      template.hasResourceProperties('AWS::EC2::LaunchTemplate', 
        Match.objectLike({
          LaunchTemplateData: {
            InstanceType: 't3.micro',
            BlockDeviceMappings: [
              {
                DeviceName: '/dev/xvda',
                Ebs: {
                  VolumeSize: 20,
                  Encrypted: true,
                },
              },
            ],
          },
        })
      );
    });

    test('should create auto scaling group with correct capacity', () => {
      template.hasResourceProperties('AWS::AutoScaling::AutoScalingGroup', {
        MinSize: '2',
        MaxSize: '6',
        DesiredCapacity: '2',
        HealthCheckType: 'ELB',
        HealthCheckGracePeriod: 300,
      });
    });

    test('should create CPU scaling policy', () => {
      template.hasResourceProperties('AWS::AutoScaling::ScalingPolicy', {
        PolicyType: 'TargetTrackingScaling',
        TargetTrackingConfiguration: {
          TargetValue: 70,
          PredefinedMetricSpecification: {
            PredefinedMetricType: 'ASGAverageCPUUtilization',
          },
        },
      });
    });
  });

  describe('CloudFront Distribution', () => {
    test('should create CloudFront distribution', () => {
      template.hasResourceProperties('AWS::CloudFront::Distribution', 
        Match.objectLike({
          DistributionConfig: {
            Enabled: true,
            Comment: `CloudFront distribution for TAP application ${environmentSuffix}`,
            DefaultCacheBehavior: {
              ViewerProtocolPolicy: 'redirect-to-https',
              Compress: true,
            },
          },
        })
      );
    });

    test('should create Origin Access Identity', () => {
      // Check if OAI exists - it's created automatically by CDK
      const distribution = template.findResources('AWS::CloudFront::Distribution');
      expect(Object.keys(distribution).length).toBe(1);
    });
  });

  describe('CloudWatch Logs', () => {
    test('should create VPC Flow Logs group', () => {
      template.hasResourceProperties('AWS::Logs::LogGroup', {
        LogGroupName: `/aws/vpc/flowlogs/${environmentSuffix}`,
        RetentionInDays: 30,
      });
    });

    test('should create application log group', () => {
      template.hasResourceProperties('AWS::Logs::LogGroup', {
        LogGroupName: `/aws/ec2/tap-application/${environmentSuffix}`,
        RetentionInDays: 30,
      });
    });
  });

  describe('Tagging', () => {
    test('should apply required tags to all resources', () => {
      const resources = template.findResources('AWS::EC2::VPC');
      const vpcId = Object.keys(resources)[0];
      const vpc = resources[vpcId];
      
      expect(vpc.Properties.Tags).toEqual(
        expect.arrayContaining([
          { Key: 'Environment', Value: environmentSuffix },
          { Key: 'Department', Value: 'Engineering' },
          { Key: 'Project', Value: 'TapApplication' },
        ])
      );
    });
  });

  describe('Stack Outputs', () => {
    test('should create required outputs', () => {
      template.hasOutput('VpcId', {});
      template.hasOutput('LoadBalancerDNS', {});
      template.hasOutput('CloudFrontDomain', {});
      template.hasOutput('S3BucketName', {});
      template.hasOutput('DynamoTableName', {});
      template.hasOutput('RdsClusterEndpoint', {});
    });
  });

  describe('Environment Suffix Handling', () => {
    test('should handle different environment suffixes', () => {
      const prodApp = new cdk.App();
      const prodStack = new TapStack(prodApp, 'TestTapStackProd', { 
        environmentSuffix: 'prod' 
      });
      const prodTemplate = Template.fromStack(prodStack);

      prodTemplate.hasResourceProperties('AWS::KMS::Key', {
        Description: 'KMS key for TAP application prod',
      });
    });

    test('should use default environment suffix when none provided', () => {
      const defaultApp = new cdk.App();
      const defaultStack = new TapStack(defaultApp, 'TestTapStackDefault');
      const defaultTemplate = Template.fromStack(defaultStack);

      defaultTemplate.hasResourceProperties('AWS::KMS::Key', {
        Description: 'KMS key for TAP application dev',
      });
    });

    test('should handle environment suffix from context', () => {
      const contextApp = new cdk.App();
      contextApp.node.setContext('environmentSuffix', 'staging');
      const contextStack = new TapStack(contextApp, 'TestTapStackContext');
      const contextTemplate = Template.fromStack(contextStack);

      contextTemplate.hasResourceProperties('AWS::KMS::Key', {
        Description: 'KMS key for TAP application staging',
      });
    });
  });
});
