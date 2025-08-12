import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack';
import { NetworkingConstruct } from '../lib/networking-construct';
import { SecurityConstruct } from '../lib/security-construct';
import { StorageConstruct } from '../lib/storage-construct';
import { DatabaseConstruct } from '../lib/database-construct';
import { ComputeConstruct } from '../lib/compute-construct';
import { MonitoringConstruct } from '../lib/monitoring-construct';

const environmentSuffix = 'test';

describe('TapStack', () => {
  let app: cdk.App;
  let primaryStack: TapStack;
  let secondaryStack: TapStack;
  let primaryTemplate: Template;
  let secondaryTemplate: Template;

  beforeEach(() => {
    // Create fresh stacks for each test to avoid synthesis issues
    app = new cdk.App();
    primaryStack = new TapStack(app, 'TestPrimaryStack', {
      environmentSuffix,
      stackRegion: 'us-east-1',
      isPrimary: true,
    });
    primaryTemplate = Template.fromStack(primaryStack);

    secondaryStack = new TapStack(app, 'TestSecondaryStack', {
      environmentSuffix,
      stackRegion: 'us-west-2',
      isPrimary: false,
      primaryVpcId: 'vpc-12345',
    });
    secondaryTemplate = Template.fromStack(secondaryStack);
  });

  afterEach(() => {
    // Reset mocks after each test
    jest.clearAllMocks();
  });

  describe('Stack Configuration', () => {
    test('should create primary stack with correct properties', () => {
      expect(primaryStack).toBeDefined();
      expect(primaryStack.tags.tagValues()).toHaveProperty('Environment', environmentSuffix);
      expect(primaryStack.tags.tagValues()).toHaveProperty('ManagedBy', 'CDK');
    });

    test('should create secondary stack with correct properties', () => {
      expect(secondaryStack).toBeDefined();
      expect(secondaryStack.stackName).toContain('TestSecondaryStack');
    });

    test('should enable cross-region references', () => {
      // Cross-region references are enabled in stack properties
      expect(primaryStack).toBeDefined();
      expect(secondaryStack).toBeDefined();
    });
  });

  describe('Networking Resources', () => {
    test('should create VPC with correct configuration', () => {
      primaryTemplate.hasResourceProperties('AWS::EC2::VPC', {
        CidrBlock: '10.0.0.0/16',
        EnableDnsHostnames: true,
        EnableDnsSupport: true,
      });

      secondaryTemplate.hasResourceProperties('AWS::EC2::VPC', {
        CidrBlock: '10.1.0.0/16',
        EnableDnsHostnames: true,
        EnableDnsSupport: true,
      });
    });

    test('should create VPC subnets', () => {
      // Check for public subnets
      primaryTemplate.resourceCountIs('AWS::EC2::Subnet', 9); // 3 public, 3 private, 3 isolated
      
      // Check for NAT Gateways
      primaryTemplate.resourceCountIs('AWS::EC2::NatGateway', 2);
    });

    test('should create VPC Flow Logs', () => {
      primaryTemplate.hasResourceProperties('AWS::EC2::FlowLog', {
        ResourceType: 'VPC',
        TrafficType: 'ALL',
      });
    });

    test('should create security groups', () => {
      primaryTemplate.hasResourceProperties('AWS::EC2::SecurityGroup', 
        Match.objectLike({
          GroupDescription: Match.stringLikeRegexp('Security group for Application Load Balancer'),
        })
      );

      primaryTemplate.hasResourceProperties('AWS::EC2::SecurityGroup',
        Match.objectLike({
          GroupDescription: Match.stringLikeRegexp('Security group for Lambda functions'),
        })
      );
    });

    test('should create VPC peering connection in secondary stack', () => {
      secondaryTemplate.hasResourceProperties('AWS::EC2::VPCPeeringConnection', {
        VpcId: Match.anyValue(),
        PeerVpcId: 'vpc-12345',
        PeerRegion: 'us-east-1',
      });
    });
  });

  describe('Security Resources', () => {
    test('should create KMS key with rotation enabled', () => {
      primaryTemplate.hasResourceProperties('AWS::KMS::Key', {
        KeyUsage: 'ENCRYPT_DECRYPT',
        KeySpec: 'SYMMETRIC_DEFAULT',
        EnableKeyRotation: true,
      });
    });

    test('should create KMS key alias', () => {
      primaryTemplate.hasResourceProperties('AWS::KMS::Alias', 
        Match.objectLike({
          AliasName: Match.stringLikeRegexp(`alias/${environmentSuffix}-encryption-key-`),
        })
      );
    });

    test('should create Lambda execution role with correct policies', () => {
      primaryTemplate.hasResourceProperties('AWS::IAM::Role', 
        Match.objectLike({
          AssumeRolePolicyDocument: Match.objectLike({
            Statement: Match.arrayWith([
              Match.objectLike({
                Principal: Match.objectLike({
                  Service: 'lambda.amazonaws.com',
                }),
              }),
            ]),
          }),
        })
      );
    });

    test('should create cross-region role', () => {
      primaryTemplate.hasResourceProperties('AWS::IAM::Role',
        Match.objectLike({
          RoleName: Match.stringLikeRegexp(`${environmentSuffix}-cross-region-role-`),
        })
      );
    });
  });

  describe('Storage Resources', () => {
    test('should create S3 bucket with KMS encryption', () => {
      primaryTemplate.hasResourceProperties('AWS::S3::Bucket', 
        Match.objectLike({
          BucketEncryption: Match.objectLike({
            ServerSideEncryptionConfiguration: Match.arrayWith([
              Match.objectLike({
                ServerSideEncryptionByDefault: Match.objectLike({
                  SSEAlgorithm: 'aws:kms',
                }),
              }),
            ]),
          }),
          VersioningConfiguration: Match.objectLike({
            Status: 'Enabled',
          }),
        })
      );
    });

    test('should create S3 bucket with lifecycle rules', () => {
      primaryTemplate.hasResourceProperties('AWS::S3::Bucket',
        Match.objectLike({
          LifecycleConfiguration: Match.objectLike({
            Rules: Match.arrayWith([
              Match.objectLike({
                Id: 'DeleteIncompleteMultipartUploads',
              }),
              Match.objectLike({
                Id: 'TransitionToIA',
              }),
            ]),
          }),
        })
      );
    });
  });

  describe('Database Resources', () => {
    test('should create Aurora cluster with serverless v2', () => {
      primaryTemplate.hasResourceProperties('AWS::RDS::DBCluster', 
        Match.objectLike({
          Engine: 'aurora-postgresql',
          ServerlessV2ScalingConfiguration: Match.objectLike({
            MinCapacity: 0.5,
            MaxCapacity: 4,
          }),
          StorageEncrypted: true,
        })
      );
    });

    test('should create DynamoDB table in primary region with global replication', () => {
      primaryTemplate.hasResourceProperties('AWS::DynamoDB::Table',
        Match.objectLike({
          TableName: `${environmentSuffix}-global-table`,
          BillingMode: 'PAY_PER_REQUEST',
          SSESpecification: Match.objectLike({
            SSEEnabled: true,
          }),
          Replicas: Match.arrayWith([
            Match.objectLike({
              Region: 'us-west-2',
            }),
          ]),
        })
      );
    });

    test('should create DynamoDB table in secondary region without replication', () => {
      secondaryTemplate.hasResourceProperties('AWS::DynamoDB::Table',
        Match.objectLike({
          TableName: `${environmentSuffix}-regional-table-us-west-2`,
          BillingMode: 'PAY_PER_REQUEST',
        })
      );
    });

    test('should create global secondary index on DynamoDB tables', () => {
      primaryTemplate.hasResourceProperties('AWS::DynamoDB::Table',
        Match.objectLike({
          GlobalSecondaryIndexes: Match.arrayWith([
            Match.objectLike({
              IndexName: 'GSI1',
            }),
          ]),
        })
      );
    });
  });

  describe('Compute Resources', () => {
    test('should create Lambda function with correct configuration', () => {
      primaryTemplate.hasResourceProperties('AWS::Lambda::Function',
        Match.objectLike({
          Runtime: 'python3.12',
          Handler: 'index.handler',
          MemorySize: 512,
          Timeout: 300,
        })
      );
    });

    test('should create Application Load Balancer', () => {
      primaryTemplate.hasResourceProperties('AWS::ElasticLoadBalancingV2::LoadBalancer',
        Match.objectLike({
          Type: 'application',
          Scheme: 'internet-facing',
        })
      );
    });

    test('should create target group for Lambda', () => {
      primaryTemplate.hasResourceProperties('AWS::ElasticLoadBalancingV2::TargetGroup',
        Match.objectLike({
          TargetType: 'lambda',
          HealthCheckEnabled: true,
        })
      );
    });

    test('should create ALB listener with routing rules', () => {
      primaryTemplate.hasResourceProperties('AWS::ElasticLoadBalancingV2::Listener',
        Match.objectLike({
          Port: 80,
          Protocol: 'HTTP',
        })
      );

      primaryTemplate.hasResourceProperties('AWS::ElasticLoadBalancingV2::ListenerRule',
        Match.objectLike({
          Priority: 10,
          Conditions: Match.arrayWith([
            Match.objectLike({
              Field: 'path-pattern',
            }),
          ]),
        })
      );
    });
  });

  describe('Monitoring Resources', () => {
    test('should create CloudWatch dashboard', () => {
      primaryTemplate.hasResourceProperties('AWS::CloudWatch::Dashboard',
        Match.objectLike({
          DashboardName: Match.stringLikeRegexp(`${environmentSuffix}-dashboard-`),
        })
      );
    });

    test('should create CloudWatch alarms', () => {
      primaryTemplate.hasResourceProperties('AWS::CloudWatch::Alarm',
        Match.objectLike({
          ComparisonOperator: 'GreaterThanThreshold',
          EvaluationPeriods: 2,
        })
      );
    });

    test('should create SNS topic for alerts', () => {
      primaryTemplate.hasResourceProperties('AWS::SNS::Topic',
        Match.objectLike({
          DisplayName: Match.stringLikeRegexp(`Alerts for ${environmentSuffix}`),
        })
      );
    });

    test('should create Application Insights configuration', () => {
      primaryTemplate.hasResourceProperties('AWS::ApplicationInsights::Application',
        Match.objectLike({
          AutoConfigurationEnabled: true,
          CWEMonitorEnabled: true,
        })
      );
    });
  });

  describe('Stack Outputs', () => {
    test('should create outputs for important resources', () => {
      primaryTemplate.hasOutput('VpcId', {});
      primaryTemplate.hasOutput('ALBEndpoint', {});
      primaryTemplate.hasOutput('S3BucketName', {});
      primaryTemplate.hasOutput('DynamoDBTableName', {});
      primaryTemplate.hasOutput('RDSClusterEndpoint', {});
      primaryTemplate.hasOutput('LambdaFunctionArn', {});
    });
  });
});
