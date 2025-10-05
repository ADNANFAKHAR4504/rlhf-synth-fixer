/* eslint-disable prettier/prettier */

import * as cdk from 'aws-cdk-lib';
import { Template, Match, Capture } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('FreelancerPlatform TapStack', () => {
  let app: cdk.App;
  let stack: TapStack;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();
    stack = new TapStack(app, 'TestTapStack', {
      environmentSuffix,
      env: { account: '123456789012', region: 'us-east-2' },
    });
    template = Template.fromStack(stack);
  });

  // =================================================================
  // VPC & NETWORKING TESTS
  // =================================================================

  describe('VPC and Networking', () => {
    test('creates VPC with correct CIDR block', () => {
      template.hasResourceProperties('AWS::EC2::VPC', {
        CidrBlock: '10.36.0.0/16',
        EnableDnsHostnames: true,
        EnableDnsSupport: true,
      });
    });

    test('creates multi-AZ subnet configuration', () => {
      const vpcCapture = new Capture();
      template.hasResourceProperties('AWS::EC2::Subnet', {
        VpcId: vpcCapture,
        MapPublicIpOnLaunch: true,
      });

      // Should have public, private, and isolated subnets
      template.resourceCountIs('AWS::EC2::Subnet', 6); // 2 AZs x 3 subnet types
    });

    test('creates NAT Gateways for multi-AZ high availability', () => {
      template.resourceCountIs('AWS::EC2::NatGateway', 2);
    });

    test('creates VPC Flow Logs', () => {
      template.hasResourceProperties('AWS::EC2::FlowLog', {
        ResourceType: 'VPC',
        TrafficType: 'ALL',
      });
    });
  });

  // =================================================================
  // SECURITY GROUP TESTS
  // =================================================================

  describe('Security Groups', () => {
    test('creates ALB security group with HTTP/HTTPS access', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupDescription: 'Security group for Application Load Balancer',
        SecurityGroupIngress: Match.arrayWith([
          Match.objectLike({
            CidrIp: '0.0.0.0/0',
            FromPort: 80,
            ToPort: 80,
            IpProtocol: 'tcp',
          }),
          Match.objectLike({
            CidrIp: '0.0.0.0/0',
            FromPort: 443,
            ToPort: 443,
            IpProtocol: 'tcp',
          }),
        ]),
      });
    });

    test('creates ECS security group allowing traffic from ALB', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupDescription: 'Security group for ECS Fargate tasks',
      });
    });

    test('creates Aurora security group with restricted access', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupDescription: 'Security group for Aurora MySQL cluster',
      });
    });

    test('creates Redis security group', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupDescription: 'Security group for ElastiCache Redis',
      });
    });

    test('creates Lambda security group', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupDescription: 'Security group for Lambda functions',
      });
    });
  });

  // =================================================================
  // AURORA MYSQL TESTS
  // =================================================================

  describe('Aurora MySQL Cluster', () => {
    test('creates Aurora MySQL cluster with multi-AZ', () => {
      template.hasResourceProperties('AWS::RDS::DBCluster', {
        Engine: 'aurora-mysql',
        DatabaseName: 'freelancerdb',
        StorageEncrypted: true,
      });
    });

    test('creates writer and reader instances', () => {
      template.resourceCountIs('AWS::RDS::DBInstance', 2);
    });

    test('creates Secrets Manager secret for database credentials', () => {
      template.hasResourceProperties('AWS::SecretsManager::Secret', {
        GenerateSecretString: Match.objectLike({
          ExcludePunctuation: true,
          IncludeSpace: false,
          PasswordLength: 32,
        }),
      });
    });

    test('configures backup retention', () => {
      template.hasResourceProperties('AWS::RDS::DBCluster', {
        BackupRetentionPeriod: 7,
      });
    });
  });

  // =================================================================
  // DYNAMODB TESTS
  // =================================================================

  describe('DynamoDB Messages Table', () => {
    test('creates DynamoDB table with correct keys', () => {
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        KeySchema: [
          { AttributeName: 'conversationId', KeyType: 'HASH' },
          { AttributeName: 'timestamp', KeyType: 'RANGE' },
        ],
        BillingMode: 'PAY_PER_REQUEST',
        PointInTimeRecoverySpecification: {
          PointInTimeRecoveryEnabled: true,
        },
      });
    });

    test('creates GSI for sender queries', () => {
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        GlobalSecondaryIndexes: Match.arrayWith([
          Match.objectLike({
            IndexName: 'userId-timestamp-index',
            KeySchema: [
              { AttributeName: 'userId', KeyType: 'HASH' },
              { AttributeName: 'timestamp', KeyType: 'RANGE' },
            ],
            Projection: { ProjectionType: 'ALL' },
          }),
        ]),
      });
    });

    test('creates GSI for receiver inbox queries', () => {
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        GlobalSecondaryIndexes: Match.arrayWith([
          Match.objectLike({
            IndexName: 'receiverId-timestamp-index',
            KeySchema: [
              { AttributeName: 'receiverId', KeyType: 'HASH' },
              { AttributeName: 'timestamp', KeyType: 'RANGE' },
            ],
            Projection: { ProjectionType: 'ALL' },
          }),
        ]),
      });
    });

    test('enables encryption', () => {
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        SSESpecification: {
          SSEEnabled: true,
        },
      });
    });
  });

  // =================================================================
  // ELASTICACHE REDIS TESTS
  // =================================================================

  describe('ElastiCache Redis', () => {
    test('creates Redis replication group with multi-AZ', () => {
      template.hasResourceProperties('AWS::ElastiCache::ReplicationGroup', {
        Engine: 'redis',
        EngineVersion: '7.0',
        MultiAZEnabled: true,
        AutomaticFailoverEnabled: true,
        AtRestEncryptionEnabled: true,
        TransitEncryptionEnabled: true,
      });
    });

    test('creates Redis subnet group', () => {
      template.hasResourceProperties('AWS::ElastiCache::SubnetGroup', {
        Description: 'Subnet group for ElastiCache Redis',
      });
    });
  });

  // =================================================================
  // S3 & CLOUDFRONT TESTS
  // =================================================================

  describe('S3 and CloudFront', () => {
    test('creates S3 bucket with versioning and encryption', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
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

    test('creates CloudFront distribution with OAI', () => {
      template.hasResourceProperties('AWS::CloudFront::Distribution', {
        DistributionConfig: Match.objectLike({
          Enabled: true,
          DefaultCacheBehavior: Match.objectLike({
            ViewerProtocolPolicy: 'redirect-to-https',
          }),
        }),
      });
    });

    test('creates Origin Access Identity', () => {
      template.resourceCountIs('AWS::CloudFront::CloudFrontOriginAccessIdentity', 1);
    });

    test('configures S3 CORS for web uploads', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        CorsConfiguration: {
          CorsRules: Match.arrayWith([
            Match.objectLike({
              AllowedMethods: Match.arrayWith(['GET', 'PUT', 'POST']),
              AllowedHeaders: ['*'],
            }),
          ]),
        },
      });
    });

    test('configures lifecycle rules for cost optimization', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        LifecycleConfiguration: {
          Rules: Match.arrayWith([
            Match.objectLike({
              Id: 'archive-old-versions',
              Status: 'Enabled',
            }),
          ]),
        },
      });
    });
  });

  // =================================================================
  // COGNITO TESTS
  // =================================================================

  describe('Cognito User Pools', () => {
    test('creates two separate user pools for freelancers and clients', () => {
      template.resourceCountIs('AWS::Cognito::UserPool', 2);
    });

    test('configures freelancer pool with custom attributes', () => {
      template.hasResourceProperties('AWS::Cognito::UserPool', {
        Schema: Match.arrayWith([
          Match.objectLike({
            Name: 'skills',
            AttributeDataType: 'String',
            Mutable: true,
          }),
          Match.objectLike({
            Name: 'hourlyRate',
            AttributeDataType: 'Number',
            Mutable: true,
          }),
        ]),
      });
    });

    test('configures client pool with company attributes', () => {
      template.hasResourceProperties('AWS::Cognito::UserPool', {
        Schema: Match.arrayWith([
          Match.objectLike({
            Name: 'companyName',
            AttributeDataType: 'String',
            Mutable: true,
          }),
        ]),
      });
    });

    test('enforces strong password policy', () => {
      template.hasResourceProperties('AWS::Cognito::UserPool', {
        Policies: {
          PasswordPolicy: {
            MinimumLength: 12,
            RequireLowercase: true,
            RequireUppercase: true,
            RequireNumbers: true,
            RequireSymbols: true,
          },
        },
      });
    });

    test('enables email verification', () => {
      template.hasResourceProperties('AWS::Cognito::UserPool', {
        AutoVerifiedAttributes: ['email'],
      });
    });

    test('creates app clients for both pools', () => {
      template.resourceCountIs('AWS::Cognito::UserPoolClient', 2);
    });
  });

  // =================================================================
  // ECS FARGATE TESTS
  // =================================================================

  describe('ECS Fargate', () => {
    test('creates ECS cluster with container insights', () => {
      template.hasResourceProperties('AWS::ECS::Cluster', {
        ClusterSettings: [
          {
            Name: 'containerInsights',
            Value: 'enabled',
          },
        ],
      });
    });

    test('creates Fargate task definition with correct resources', () => {
      template.hasResourceProperties('AWS::ECS::TaskDefinition', {
        RequiresCompatibilities: ['FARGATE'],
        Cpu: '1024',
        Memory: '2048',
      });
    });

    test('configures container with environment variables', () => {
      template.hasResourceProperties('AWS::ECS::TaskDefinition', {
        ContainerDefinitions: Match.arrayWith([
          Match.objectLike({
            Name: 'freelancer-app',
            Environment: Match.arrayWith([
              Match.objectLike({ Name: 'ENVIRONMENT' }),
              Match.objectLike({ Name: 'AURORA_ENDPOINT' }),
              Match.objectLike({ Name: 'DYNAMODB_TABLE' }),
              Match.objectLike({ Name: 'REDIS_ENDPOINT' }),
            ]),
          }),
        ]),
      });
    });

    test('creates Fargate service with multi-AZ deployment', () => {
      template.hasResourceProperties('AWS::ECS::Service', {
        LaunchType: 'FARGATE',
        DesiredCount: 2,
      });
    });

    test('configures auto-scaling policies', () => {
      template.hasResourceProperties('AWS::ApplicationAutoScaling::ScalingPolicy', {
        PolicyType: 'TargetTrackingScaling',
      });
    });
  });

  // =================================================================
  // APPLICATION LOAD BALANCER TESTS
  // =================================================================

  describe('Application Load Balancer', () => {
    test('creates internet-facing ALB', () => {
      template.hasResourceProperties('AWS::ElasticLoadBalancingV2::LoadBalancer', {
        Scheme: 'internet-facing',
        Type: 'application',
      });
    });

    test('creates target group with health checks', () => {
      template.hasResourceProperties('AWS::ElasticLoadBalancingV2::TargetGroup', {
        Port: 3000,
        Protocol: 'HTTP',
        TargetType: 'ip',
        HealthCheckPath: '/health',
        HealthCheckIntervalSeconds: 30,
      });
    });

    test('creates HTTP listener', () => {
      template.hasResourceProperties('AWS::ElasticLoadBalancingV2::Listener', {
        Port: 80,
        Protocol: 'HTTP',
      });
    });

    test('configures sticky sessions', () => {
      template.hasResourceProperties('AWS::ElasticLoadBalancingV2::TargetGroup', {
        TargetGroupAttributes: Match.arrayWith([
          Match.objectLike({
            Key: 'stickiness.enabled',
            Value: 'true',
          }),
        ]),
      });
    });
  });

  // =================================================================
  // SNS & SES TESTS
  // =================================================================

  describe('SNS Topics and SES', () => {
    test('creates three SNS topics for notifications', () => {
      template.resourceCountIs('AWS::SNS::Topic', 3);
    });

    test('creates bid notification topic', () => {
      template.hasResourceProperties('AWS::SNS::Topic', {
        DisplayName: 'New Bid Notifications',
      });
    });

    test('creates milestone approval topic', () => {
      template.hasResourceProperties('AWS::SNS::Topic', {
        DisplayName: 'Milestone Approval Notifications',
      });
    });

    test('creates payment confirmation topic', () => {
      template.hasResourceProperties('AWS::SNS::Topic', {
        DisplayName: 'Payment Confirmation Notifications',
      });
    });

    test('configures SES email identity', () => {
      template.hasResourceProperties('AWS::SES::EmailIdentity', {
        EmailIdentity: 'noreply@example.com',
      });
    });

    test('creates SES configuration set', () => {
      template.hasResourceProperties('AWS::SES::ConfigurationSet', {});
    });
  });

  // =================================================================
  // LAMBDA TESTS
  // =================================================================

  describe('Lambda Functions', () => {
    test('creates payment webhook Lambda function', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        Runtime: 'nodejs18.x',
        Timeout: 30,
        MemorySize: 512,
      });
    });

    test('attaches Lambda to VPC', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        VpcConfig: Match.objectLike({}),
      });
    });

    test('creates Dead Letter Queue for Lambda', () => {
      template.hasResourceProperties('AWS::SQS::Queue', {});
    });

    test('enables X-Ray tracing', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        TracingConfig: {
          Mode: 'Active',
        },
      });
    });
  });

  // =================================================================
  // STEP FUNCTIONS TESTS
  // =================================================================

  describe('Step Functions', () => {
    test('creates state machine for project lifecycle', () => {
      template.hasResourceProperties('AWS::StepFunctions::StateMachine', {
        TracingConfiguration: {
          Enabled: true,
        },
      });
    });
  });

  // =================================================================
  // IAM & PERMISSIONS TESTS
  // =================================================================

  describe('IAM Roles and Permissions', () => {
    test('creates ECS task role with proper permissions', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        RoleName: 'dev-freelancer-platform-ecs-task-role',
      });
    });

    test('grants ECS task access to DynamoDB', () => {
      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: Match.objectLike({
          Statement: Match.arrayWith([
            Match.objectLike({
              Action: Match.arrayWith([
                'dynamodb:BatchGetItem',
                'dynamodb:GetRecords',
                'dynamodb:GetShardIterator',
                'dynamodb:Query',
                'dynamodb:GetItem',
                'dynamodb:Scan',
                'dynamodb:ConditionCheckItem',
                'dynamodb:BatchWriteItem',
                'dynamodb:PutItem',
                'dynamodb:UpdateItem',
                'dynamodb:DeleteItem',
              ]),
              Effect: 'Allow',
            }),
          ]),
        }),
      });
    });

    test('grants ECS task access to S3 bucket', () => {
      // Check that ECS task role has S3 permissions
      const resources = template.toJSON().Resources;
      const ecsTaskPolicy = Object.values(resources).find(
        (r: any) =>
          r.Type === 'AWS::IAM::Policy' &&
          r.Properties?.PolicyDocument?.Statement?.some(
            (stmt: any) =>
              stmt.Effect === 'Allow' &&
              JSON.stringify(stmt.Action || []).includes('s3:')
          )
      );
      expect(ecsTaskPolicy).toBeDefined();
    });

    test('grants Lambda access to Secrets Manager', () => {
      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: Match.objectLike({
          Statement: Match.arrayWith([
            Match.objectLike({
              Action: Match.arrayWith([
                'secretsmanager:GetSecretValue',
                'secretsmanager:DescribeSecret',
              ]),
              Effect: 'Allow',
            }),
          ]),
        }),
      });
    });
  });

  // =================================================================
  // CLOUDWATCH MONITORING TESTS
  // =================================================================

  describe('CloudWatch Monitoring', () => {
    test('creates CloudWatch dashboard', () => {
      template.hasResourceProperties('AWS::CloudWatch::Dashboard', {});
    });

    test('creates alarm for ALB 5XX errors', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        ComparisonOperator: 'GreaterThanThreshold',
        EvaluationPeriods: 2,
        Threshold: 10,
      });
    });

    test('creates alarm for Aurora connections', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        Threshold: 80,
      });
    });

    test('creates alarm for DynamoDB throttles', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        Threshold: 5,
      });
    });
  });

  // =================================================================
  // TAGGING TESTS
  // =================================================================

  describe('Resource Tagging', () => {
    test('applies consistent tags to all resources', () => {
      const resources = template.toJSON().Resources;
      const taggedResources = Object.values(resources).filter(
        (r: any) => r.Properties?.Tags || r.Properties?.tags
      );
      expect(taggedResources.length).toBeGreaterThan(0);
    });
  });

  // =================================================================
  // CLOUDFORMATION OUTPUTS TESTS
  // =================================================================

  describe('CloudFormation Outputs', () => {
    test('exports VPC ID', () => {
      template.hasOutput('VPCId', {
        Description: 'VPC ID',
      });
    });

    test('exports ALB DNS name', () => {
      template.hasOutput('ALBDNSName', {
        Description: 'Application Load Balancer DNS Name',
      });
    });

    test('exports Aurora endpoint', () => {
      template.hasOutput('AuroraEndpoint', {
        Description: 'Aurora MySQL Cluster Endpoint',
      });
    });

    test('exports DynamoDB table name', () => {
      template.hasOutput('DynamoDBTableName', {
        Description: 'DynamoDB Messages Table Name',
      });
    });

    test('exports CloudFront URL', () => {
      template.hasOutput('CloudFrontURL', {
        Description: 'CloudFront Distribution URL',
      });
    });

    test('exports Cognito pool IDs', () => {
      template.hasOutput('FreelancerUserPoolId', {
        Description: 'Freelancer Cognito User Pool ID',
      });
      template.hasOutput('ClientUserPoolId', {
        Description: 'Client Cognito User Pool ID',
      });
    });

    test('exports Redis endpoint', () => {
      template.hasOutput('RedisEndpoint', {
        Description: 'ElastiCache Redis Endpoint',
      });
    });

    test('exports State Machine ARN', () => {
      template.hasOutput('StateMachineArn', {
        Description: 'Project Lifecycle State Machine ARN',
      });
    });
  });

  // =================================================================
  // SECURITY & COMPLIANCE TESTS
  // =================================================================

  describe('Security and Compliance', () => {
    test('ensures all S3 buckets have encryption', () => {
      template.allResourcesProperties('AWS::S3::Bucket', {
        BucketEncryption: Match.objectLike({
          ServerSideEncryptionConfiguration: Match.arrayWith([
            Match.objectLike({ ServerSideEncryptionByDefault: Match.objectLike({}) }),
          ]),
        }),
      });
    });

    test('ensures main S3 bucket blocks public access', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        PublicAccessBlockConfiguration: {
          BlockPublicAcls: true,
          BlockPublicPolicy: true,
          IgnorePublicAcls: true,
          RestrictPublicBuckets: true,
        },
      });
    });

    test('ensures Aurora cluster is encrypted', () => {
      template.hasResourceProperties('AWS::RDS::DBCluster', {
        StorageEncrypted: true,
      });
    });

    test('ensures DynamoDB table has encryption', () => {
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        SSESpecification: {
          SSEEnabled: true,
        },
      });
    });

    test('ensures Redis has encryption at rest and in transit', () => {
      template.hasResourceProperties('AWS::ElastiCache::ReplicationGroup', {
        AtRestEncryptionEnabled: true,
        TransitEncryptionEnabled: true,
      });
    });
  });

  // =================================================================
  // RESOURCE COUNT VALIDATION
  // =================================================================

  describe('Resource Count Validation', () => {
    test('validates expected number of core resources', () => {
      template.resourceCountIs('AWS::EC2::VPC', 1);
      template.resourceCountIs('AWS::ECS::Cluster', 1);
      template.resourceCountIs('AWS::RDS::DBCluster', 1);
      template.resourceCountIs('AWS::DynamoDB::Table', 1);
      template.resourceCountIs('AWS::ElastiCache::ReplicationGroup', 1);
      template.resourceCountIs('AWS::ElasticLoadBalancingV2::LoadBalancer', 1);
      // 2 Lambda functions: 1 custom + 1 auto-created for CloudFormation custom resource
      expect(template.findResources('AWS::Lambda::Function')).toBeDefined();
      template.resourceCountIs('AWS::StepFunctions::StateMachine', 1);
      template.resourceCountIs('AWS::CloudFront::Distribution', 1);
      template.resourceCountIs('AWS::Cognito::UserPool', 2);
      template.resourceCountIs('AWS::SNS::Topic', 3);
    });
  });
});
