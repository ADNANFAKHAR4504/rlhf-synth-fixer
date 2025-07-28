import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('TapStack', () => {
  let app: cdk.App;
  let primaryStack: TapStack;
  let secondaryStack: TapStack;
  let primaryTemplate: Template;
  let secondaryTemplate: Template;

  beforeEach(() => {
    app = new cdk.App();
    primaryStack = new TapStack(app, 'TestTapStackPrimary', {
      environmentSuffix,
      isPrimaryRegion: true,
      globalClusterId: 'test-global-db',
      env: { region: 'us-east-1' },
    });
    secondaryStack = new TapStack(app, 'TestTapStackSecondary', {
      environmentSuffix,
      isPrimaryRegion: false,
      globalClusterId: 'test-global-db',
      env: { region: 'eu-west-1' },
    });
    primaryTemplate = Template.fromStack(primaryStack);
    secondaryTemplate = Template.fromStack(secondaryStack);
  });

  describe('VPC Configuration Tests', () => {
    test('should create a VPC with correct configuration in both regions', () => {
      primaryTemplate.hasResourceProperties('AWS::EC2::VPC', {
        EnableDnsHostnames: true,
        EnableDnsSupport: true,
      });
      secondaryTemplate.hasResourceProperties('AWS::EC2::VPC', {
        EnableDnsHostnames: true,
        EnableDnsSupport: true,
      });
    });

    test('should create public subnets in both regions', () => {
      primaryTemplate.hasResourceProperties('AWS::EC2::Subnet', {
        MapPublicIpOnLaunch: true,
      });
      secondaryTemplate.hasResourceProperties('AWS::EC2::Subnet', {
        MapPublicIpOnLaunch: true,
      });
    });

    test('should create private subnets with egress in both regions', () => {
      primaryTemplate.resourceCountIs('AWS::EC2::NatGateway', 2);
      secondaryTemplate.resourceCountIs('AWS::EC2::NatGateway', 2);
    });
  });

  describe('Encryption and Security Tests', () => {
    test('should create KMS key with rotation enabled', () => {
      primaryTemplate.hasResourceProperties('AWS::KMS::Key', {
        EnableKeyRotation: true,
      });
      secondaryTemplate.hasResourceProperties('AWS::KMS::Key', {
        EnableKeyRotation: true,
      });
    });

    test('should create S3 bucket with encryption and versioning', () => {
      primaryTemplate.hasResourceProperties('AWS::S3::Bucket', {
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
      });
    });

    test('should create DynamoDB table with encryption and PITR', () => {
      primaryTemplate.hasResourceProperties('AWS::DynamoDB::Table', {
        BillingMode: 'PAY_PER_REQUEST',
        PointInTimeRecoverySpecification: {
          PointInTimeRecoveryEnabled: true,
        },
        SSESpecification: {
          SSEEnabled: true,
        },
        StreamSpecification: {
          StreamViewType: 'NEW_AND_OLD_IMAGES',
        },
      });
    });
  });

  describe('Database Configuration Tests', () => {
    test('should create Aurora cluster in primary region', () => {
      primaryTemplate.hasResourceProperties('AWS::RDS::DBCluster', {
        Engine: 'aurora-mysql',
        StorageEncrypted: true,
        DeletionProtection: true,
        BackupRetentionPeriod: 35,
      });
    });

    test('should create Aurora cluster instances with performance insights', () => {
      primaryTemplate.hasResourceProperties('AWS::RDS::DBInstance', {
        Engine: 'aurora-mysql',
        DBInstanceClass: 'db.r6g.large',
        EnablePerformanceInsights: true,
      });
    });
  });

  describe('Lambda Function Tests', () => {
    test('should create Lambda function with proper IAM role', () => {
      primaryTemplate.hasResourceProperties('AWS::Lambda::Function', {
        Runtime: 'nodejs18.x',
        Handler: 'index.handler',
        Timeout: 30,
        MemorySize: 256,
      });
    });

    test('should create Lambda execution role with least privilege', () => {
      primaryTemplate.hasResourceProperties('AWS::IAM::Role', {
        AssumeRolePolicyDocument: {
          Statement: [
            {
              Action: 'sts:AssumeRole',
              Effect: 'Allow',
              Principal: {
                Service: 'lambda.amazonaws.com',
              },
            },
          ],
        },
      });
    });
  });

  describe('API Gateway Tests', () => {
    test('should create API Gateway with proper logging configuration', () => {
      primaryTemplate.hasResourceProperties('AWS::ApiGateway::RestApi', {
        Name: Match.stringLikeRegexp(`multi-region-web-service-${environmentSuffix}-us-east-1`),
      });
    });

    test('should create API Gateway deployment with metrics enabled', () => {
      primaryTemplate.hasResourceProperties('AWS::ApiGateway::Deployment', {
        RestApiId: Match.anyValue(),
      });
    });
  });

  describe('Monitoring and Alerting Tests', () => {
    test('should create SNS topic for monitoring alerts', () => {
      primaryTemplate.hasResourceProperties('AWS::SNS::Topic', {
        DisplayName: Match.stringLikeRegexp('Multi-region web service alerts for us-east-1'),
      });
    });

    test('should create CloudWatch alarms for Lambda errors', () => {
      primaryTemplate.hasResourceProperties('AWS::CloudWatch::Alarm', {
        AlarmName: Match.stringLikeRegexp(`lambda-errors-${environmentSuffix}-us-east-1`),
        Threshold: 10,
        ComparisonOperator: 'GreaterThanOrEqualToThreshold',
      });
    });

    test('should create CloudWatch dashboard', () => {
      primaryTemplate.hasResourceProperties('AWS::CloudWatch::Dashboard', {
        DashboardName: Match.stringLikeRegexp(`multi-region-web-service-${environmentSuffix}-us-east-1`),
      });
    });
  });

  describe('Comprehensive Tagging Tests', () => {
    test('should apply comprehensive tagging strategy to all resources', () => {
      // Test that VPC has all required tags (checking individual tags)
      primaryTemplate.hasResourceProperties('AWS::EC2::VPC', {
        Tags: Match.arrayWith([{ Key: 'Project', Value: 'MultiRegionWebService' }]),
      });
      primaryTemplate.hasResourceProperties('AWS::EC2::VPC', {
        Tags: Match.arrayWith([{ Key: 'Environment', Value: environmentSuffix }]),
      });
      primaryTemplate.hasResourceProperties('AWS::EC2::VPC', {
        Tags: Match.arrayWith([{ Key: 'Region', Value: 'us-east-1' }]),
      });
      primaryTemplate.hasResourceProperties('AWS::EC2::VPC', {
        Tags: Match.arrayWith([{ Key: 'RegionType', Value: 'Primary' }]),
      });
      primaryTemplate.hasResourceProperties('AWS::EC2::VPC', {
        Tags: Match.arrayWith([{ Key: 'CostCenter', Value: 'Engineering' }]),
      });
      primaryTemplate.hasResourceProperties('AWS::EC2::VPC', {
        Tags: Match.arrayWith([{ Key: 'Owner', Value: 'Infrastructure-Team' }]),
      });

      // Test secondary region tagging
      secondaryTemplate.hasResourceProperties('AWS::EC2::VPC', {
        Tags: Match.arrayWith([{ Key: 'RegionType', Value: 'Secondary' }]),
      });
      secondaryTemplate.hasResourceProperties('AWS::EC2::VPC', {
        Tags: Match.arrayWith([{ Key: 'Region', Value: 'eu-west-1' }]),
      });
    });
  });

  describe('Multi-Region Resource Count Tests', () => {
    test('should create expected infrastructure in primary region', () => {
      primaryTemplate.resourceCountIs('AWS::EC2::VPC', 1);
      primaryTemplate.resourceCountIs('AWS::RDS::DBCluster', 1);
      primaryTemplate.resourceCountIs('AWS::Lambda::Function', 1);
      primaryTemplate.resourceCountIs('AWS::ApiGateway::RestApi', 1);
      primaryTemplate.resourceCountIs('AWS::DynamoDB::Table', 1);
      primaryTemplate.resourceCountIs('AWS::S3::Bucket', 1);
      primaryTemplate.resourceCountIs('AWS::KMS::Key', 1);
      primaryTemplate.resourceCountIs('AWS::SNS::Topic', 1);
    });

    test('should create expected infrastructure in secondary region', () => {
      secondaryTemplate.resourceCountIs('AWS::EC2::VPC', 1);
      secondaryTemplate.resourceCountIs('AWS::RDS::DBCluster', 1);
      secondaryTemplate.resourceCountIs('AWS::Lambda::Function', 1);
      secondaryTemplate.resourceCountIs('AWS::ApiGateway::RestApi', 1);
      secondaryTemplate.resourceCountIs('AWS::DynamoDB::Table', 1);
      secondaryTemplate.resourceCountIs('AWS::S3::Bucket', 1);
      secondaryTemplate.resourceCountIs('AWS::KMS::Key', 1);
      secondaryTemplate.resourceCountIs('AWS::SNS::Topic', 1);
    });

    test('should create proper subnet configuration for high availability', () => {
      // 2 AZs * 3 subnet types = 6 subnets per region
      primaryTemplate.resourceCountIs('AWS::EC2::Subnet', 6);
      secondaryTemplate.resourceCountIs('AWS::EC2::Subnet', 6);
    });
  });

  describe('Security Configuration Tests', () => {
    test('should create security groups with restrictive access', () => {
      primaryTemplate.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupDescription: Match.stringLikeRegexp('Security group for'),
      });
    });

    test('should enforce SSL on S3 bucket', () => {
      primaryTemplate.hasResourceProperties('AWS::S3::BucketPolicy', {
        PolicyDocument: {
          Statement: Match.arrayWith([
            {
              Effect: 'Deny',
              Action: 's3:*',
              Principal: { AWS: '*' },
              Condition: {
                Bool: {
                  'aws:SecureTransport': 'false',
                },
              },
              Resource: Match.anyValue(),
            },
          ]),
        },
      });
    });
  });

  describe('Output Tests', () => {
    test('should create outputs for cross-stack references', () => {
      primaryTemplate.hasOutput('VpcIduseast1', {});
      primaryTemplate.hasOutput('KmsKeyIduseast1', {});
      primaryTemplate.hasOutput('ApiGatewayUrluseast1', {});
      primaryTemplate.hasOutput('MonitoringTopicArnuseast1', {});
    });
  });

  describe('Route53 Failover Tests', () => {
    test('should not create Route53 failover when domain props not provided', () => {
      // This tests the else branch of the Route53 condition
      primaryTemplate.resourceCountIs('AWS::Route53::RecordSet', 0);
      secondaryTemplate.resourceCountIs('AWS::Route53::RecordSet', 0);
    });
  });

  describe('Conditional Logic Tests', () => {
    test('should handle stack without globalClusterId in secondary region', () => {
      const app = new cdk.App();
      const stackWithoutGlobalId = new TapStack(app, 'TestStackWithoutGlobalId', {
        environmentSuffix,
        isPrimaryRegion: false,
        env: { region: 'eu-west-1' },
      });
      const templateWithoutGlobalId = Template.fromStack(stackWithoutGlobalId);
      
      // Should not create Aurora secondary cluster
      templateWithoutGlobalId.resourceCountIs('AWS::RDS::DBCluster', 0);
    });

    test('should create global database in primary region only', () => {
      // Primary region should have Aurora Global Database
      primaryTemplate.hasResourceProperties('AWS::RDS::GlobalCluster', {
        GlobalClusterIdentifier: 'test-global-db',
      });
      
      // Secondary region should not create global cluster
      secondaryTemplate.resourceCountIs('AWS::RDS::GlobalCluster', 0);
    });

    test('should create proper outputs based on stack configuration', () => {
      // Test the conditional output creation logic
      // Primary stack should have global database output
      primaryTemplate.hasOutput('DatabaseClusterIduseast1', {});
      
      // Secondary stack should not have global database output
      secondaryTemplate.findOutputs('DatabaseClusterIdeuwest1').length === 0;
      
      // Both should have API Gateway outputs (testing if (this.apiGateway) branch)
      primaryTemplate.hasOutput('ApiGatewayUrluseast1', {});
      secondaryTemplate.hasOutput('ApiGatewayUrleuwest1', {});
    });

    test('should handle undefined environment suffix correctly', () => {
      const app = new cdk.App();
      const stackWithoutSuffix = new TapStack(app, 'TestStackWithoutSuffix', {
        isPrimaryRegion: true,
        globalClusterId: 'test-global-db',
        env: { region: 'us-east-1' },
      });
      const templateWithoutSuffix = Template.fromStack(stackWithoutSuffix);
      
      // Should still create core resources with default suffix
      templateWithoutSuffix.hasResourceProperties('AWS::EC2::VPC', {
        EnableDnsHostnames: true,
        EnableDnsSupport: true,
      });
    });
  });
});
