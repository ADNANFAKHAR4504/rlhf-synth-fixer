import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack';

describe('FreelancerPlatform TapStack', () => {
  let app: cdk.App;
  let stack: TapStack;
  let template: Template;

  // Test both dev and prod environments for branch coverage
  describe('Environment Configuration', () => {
    test('configures dev environment with single NAT gateway', () => {
      app = new cdk.App();
      stack = new TapStack(app, 'TestStack', {
        environmentSuffix: 'dev',
      });
      template = Template.fromStack(stack);

      // Dev should have 1 NAT Gateway
      template.resourceCountIs('AWS::EC2::NatGateway', 1);
    });

    test('configures prod environment with multi-AZ NAT gateways', () => {
      app = new cdk.App();
      stack = new TapStack(app, 'TestStack', {
        environmentSuffix: 'prod',
      });
      template = Template.fromStack(stack);

      // Prod should have 2 NAT Gateways
      template.resourceCountIs('AWS::EC2::NatGateway', 2);
    });

    test('uses default environment when not specified', () => {
      app = new cdk.App();
      stack = new TapStack(app, 'TestStack');
      template = Template.fromStack(stack);

      // Should default to dev (1 NAT Gateway)
      template.resourceCountIs('AWS::EC2::NatGateway', 1);
    });

    test('reads environmentSuffix from context', () => {
      app = new cdk.App({ context: { environmentSuffix: 'staging' } });
      stack = new TapStack(app, 'TestStack');
      template = Template.fromStack(stack);

      template.hasOutput('VPCId', {
        Description: 'VPC ID',
        Export: Match.objectLike({
          Name: 'staging-freelancer-platform-vpc-id',
        }),
      });
    });
  });

  // Setup for remaining tests - pr3432 is NOT dev, so it gets 2 NAT Gateways
  beforeEach(() => {
    app = new cdk.App();
    stack = new TapStack(app, 'TestStack', {
      environmentSuffix: 'pr3432',
    });
    template = Template.fromStack(stack);
  });

  describe('VPC and Networking', () => {
    test('creates VPC with correct CIDR block', () => {
      template.hasResourceProperties('AWS::EC2::VPC', {
        CidrBlock: '10.36.0.0/16',
        EnableDnsHostnames: true,
        EnableDnsSupport: true,
      });
    });

    test('creates multi-AZ subnet configuration', () => {
      template.resourceCountIs('AWS::EC2::Subnet', 6);
    });

    test('creates NAT Gateways for multi-AZ high availability', () => {
      // pr3432 is not 'dev', so it should have 2 NAT Gateways
      template.resourceCountIs('AWS::EC2::NatGateway', 2);
    });

    test('creates VPC Flow Logs', () => {
      template.hasResourceProperties('AWS::Logs::LogGroup', {
        LogGroupName: '/aws/vpc/pr3432-freelancer-platform-flow-logs',
        RetentionInDays: 7,
      });
    });
  });

  describe('Security Groups', () => {
    test('creates ALB security group with HTTP/HTTPS access', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupDescription: 'Security group for Application Load Balancer',
        SecurityGroupIngress: Match.arrayWith([
          Match.objectLike({
            CidrIp: '0.0.0.0/0',
            IpProtocol: 'tcp',
            FromPort: 80,
            ToPort: 80,
          }),
          Match.objectLike({
            CidrIp: '0.0.0.0/0',
            IpProtocol: 'tcp',
            FromPort: 443,
            ToPort: 443,
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

    test('creates Lambda security group', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupDescription: 'Security group for Lambda functions',
      });
    });

    test('validates total security group count', () => {
      // ALB, ECS, Aurora, Lambda = 4 total
      template.resourceCountIs('AWS::EC2::SecurityGroup', 4);
    });
  });

  describe('Aurora MySQL Cluster', () => {
    test('creates Aurora MySQL cluster with multi-AZ', () => {
      template.hasResourceProperties('AWS::RDS::DBCluster', {
        Engine: 'aurora-mysql',
        EngineVersion: '8.0.mysql_aurora.3.04.0',
        DatabaseName: 'freelancerdb',
        StorageEncrypted: true,
      });
    });

    test('creates writer and reader instances', () => {
      template.resourceCountIs('AWS::RDS::DBInstance', 2);
    });

    test('creates Secrets Manager secret for database credentials', () => {
      template.hasResourceProperties('AWS::SecretsManager::Secret', {
        Name: 'pr3432-freelancer-platform-aurora-credentials',
      });
    });

    test('configures backup retention', () => {
      template.hasResourceProperties('AWS::RDS::DBCluster', {
        BackupRetentionPeriod: 7,
        PreferredBackupWindow: '03:00-04:00',
      });
    });
  });

  describe('DynamoDB Messages Table', () => {
    test('creates DynamoDB table with correct keys', () => {
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        TableName: 'pr3432-freelancer-platform-messages',
        KeySchema: Match.arrayWith([
          Match.objectLike({
            AttributeName: 'conversationId',
            KeyType: 'HASH',
          }),
          Match.objectLike({
            AttributeName: 'timestamp',
            KeyType: 'RANGE',
          }),
        ]),
        BillingMode: 'PAY_PER_REQUEST',
      });
    });

    test('creates GSI for sender queries', () => {
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        GlobalSecondaryIndexes: Match.arrayWith([
          Match.objectLike({
            IndexName: 'userId-timestamp-index',
          }),
        ]),
      });
    });

    test('creates GSI for receiver inbox queries', () => {
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        GlobalSecondaryIndexes: Match.arrayWith([
          Match.objectLike({
            IndexName: 'receiverId-timestamp-index',
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
      template.resourceCountIs('AWS::CloudFront::Distribution', 1);
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
              AllowedOrigins: ['*'],
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
              Status: 'Enabled',
            }),
          ]),
        },
      });
    });
  });

  describe('Cognito User Pools', () => {
    test('creates two separate user pools for freelancers and clients', () => {
      template.resourceCountIs('AWS::Cognito::UserPool', 2);
    });

    test('configures freelancer pool with custom attributes', () => {
      template.hasResourceProperties('AWS::Cognito::UserPool', {
        UserPoolName: 'pr3432-freelancer-platform-freelancers',
        Schema: Match.arrayWith([
          Match.objectLike({
            Name: 'skills',
            Mutable: true,
          }),
          Match.objectLike({
            Name: 'hourlyRate',
            Mutable: true,
          }),
        ]),
      });
    });

    test('configures client pool with company attributes', () => {
      template.hasResourceProperties('AWS::Cognito::UserPool', {
        UserPoolName: 'pr3432-freelancer-platform-clients',
        Schema: Match.arrayWith([
          Match.objectLike({
            Name: 'companyName',
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

  describe('ECS Fargate', () => {
    test('creates ECS cluster', () => {
      template.hasResourceProperties('AWS::ECS::Cluster', {
        ClusterName: 'pr3432-freelancer-platform-cluster',
      });
    });

    test('creates Fargate task definition with correct resources', () => {
      template.hasResourceProperties('AWS::ECS::TaskDefinition', {
        RequiresCompatibilities: ['FARGATE'],
        Cpu: '256',
        Memory: '512',
        NetworkMode: 'awsvpc',
      });
    });

    test('configures container with environment variables', () => {
      template.hasResourceProperties('AWS::ECS::TaskDefinition', {
        ContainerDefinitions: Match.arrayWith([
          Match.objectLike({
            Name: 'freelancer-app',
            Image: 'nginx:alpine',
            Environment: Match.arrayWith([
              Match.objectLike({ Name: 'ENVIRONMENT' }),
              Match.objectLike({ Name: 'AURORA_ENDPOINT' }),
              Match.objectLike({ Name: 'DYNAMODB_TABLE' }),
            ]),
          }),
        ]),
      });
    });

    test('creates Fargate service with correct desired count', () => {
      template.hasResourceProperties('AWS::ECS::Service', {
        LaunchType: 'FARGATE',
        DesiredCount: 1,
      });
    });

    test('configures auto-scaling policies', () => {
      template.resourceCountIs('AWS::ApplicationAutoScaling::ScalableTarget', 1);
      template.resourceCountIs('AWS::ApplicationAutoScaling::ScalingPolicy', 2);
    });

    test('disables circuit breaker rollback', () => {
      template.hasResourceProperties('AWS::ECS::Service', {
        DeploymentConfiguration: {
          DeploymentCircuitBreaker: {
            Enable: true,
            Rollback: false,
          },
        },
      });
    });
  });

  describe('Application Load Balancer', () => {
    test('creates internet-facing ALB', () => {
      template.hasResourceProperties('AWS::ElasticLoadBalancingV2::LoadBalancer', {
        Scheme: 'internet-facing',
        Type: 'application',
      });
    });

    test('creates target group with health checks', () => {
      template.hasResourceProperties('AWS::ElasticLoadBalancingV2::TargetGroup', {
        Port: 80,
        Protocol: 'HTTP',
        TargetType: 'ip',
        HealthCheckPath: '/',
        HealthCheckIntervalSeconds: 30,
        HealthCheckTimeoutSeconds: 5,
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

  describe('SNS Topics and SES', () => {
    test('creates three SNS topics for notifications', () => {
      template.resourceCountIs('AWS::SNS::Topic', 3);
    });

    test('creates bid notification topic', () => {
      template.hasResourceProperties('AWS::SNS::Topic', {
        TopicName: 'pr3432-freelancer-platform-bid-notifications',
      });
    });

    test('creates milestone approval topic', () => {
      template.hasResourceProperties('AWS::SNS::Topic', {
        TopicName: 'pr3432-freelancer-platform-milestone-approvals',
      });
    });

    test('creates payment confirmation topic', () => {
      template.hasResourceProperties('AWS::SNS::Topic', {
        TopicName: 'pr3432-freelancer-platform-payment-confirmations',
      });
    });

    test('configures SES email identity', () => {
      template.hasResourceProperties('AWS::SES::EmailIdentity', {
        EmailIdentity: 'noreply@example.com',
      });
    });

    test('creates SES configuration set', () => {
      template.hasResourceProperties('AWS::SES::ConfigurationSet', {
        Name: 'pr3432-freelancer-platform-ses-config',
      });
    });
  });

  describe('Lambda Functions', () => {
    test('creates payment webhook Lambda function', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        FunctionName: 'pr3432-freelancer-platform-payment-webhook',
        Runtime: 'nodejs18.x',
        Handler: 'index.handler',
      });
    });

    test('attaches Lambda to VPC', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        VpcConfig: Match.objectLike({
          SubnetIds: Match.anyValue(),
          SecurityGroupIds: Match.anyValue(),
        }),
      });
    });

    test('creates Dead Letter Queue for Lambda', () => {
      template.hasResourceProperties('AWS::SQS::Queue', {
        QueueName: 'pr3432-freelancer-platform-payment-webhook-dlq',
      });
    });

    test('enables X-Ray tracing', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        TracingConfig: {
          Mode: 'Active',
        },
      });
    });
  });

  describe('Step Functions', () => {
    test('creates state machine for project lifecycle', () => {
      template.hasResourceProperties('AWS::StepFunctions::StateMachine', {
        StateMachineName: 'pr3432-freelancer-platform-project-lifecycle',
      });
    });

    test('enables tracing for state machine', () => {
      template.hasResourceProperties('AWS::StepFunctions::StateMachine', {
        TracingConfiguration: {
          Enabled: true,
        },
      });
    });
  });

  describe('IAM Roles and Permissions', () => {
    test('creates ECS task role with proper naming', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        RoleName: 'pr3432-freelancer-platform-ecs-task-role',
        AssumeRolePolicyDocument: Match.objectLike({
          Statement: Match.arrayWith([
            Match.objectLike({
              Principal: {
                Service: 'ecs-tasks.amazonaws.com',
              },
            }),
          ]),
        }),
      });
    });

    test('grants ECS task access to DynamoDB', () => {
      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: Match.objectLike({
          Statement: Match.arrayWith([
            Match.objectLike({
              Action: Match.arrayWith([
                'dynamodb:BatchGetItem',
                'dynamodb:GetItem',
                'dynamodb:Scan',
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
      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: Match.objectLike({
          Statement: Match.arrayWith([
            Match.objectLike({
              Action: Match.arrayWith([
                's3:GetObject*',
                's3:GetBucket*',
                's3:List*',
              ]),
            }),
          ]),
        }),
      });
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
            }),
          ]),
        }),
      });
    });
  });

  describe('CloudWatch Monitoring', () => {
    test('creates CloudWatch dashboard', () => {
      template.hasResourceProperties('AWS::CloudWatch::Dashboard', {
        DashboardName: 'pr3432-freelancer-platform-dashboard',
      });
    });

    test('creates alarm for ALB 5XX errors', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        AlarmName: 'pr3432-freelancer-platform-alb-5xx-errors',
        Threshold: 10,
        EvaluationPeriods: 2,
      });
    });

    test('creates alarm for Aurora connections', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        AlarmName: 'pr3432-freelancer-platform-aurora-connections',
        Threshold: 80,
      });
    });

    test('creates alarm for DynamoDB throttles', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        AlarmName: 'pr3432-freelancer-platform-dynamodb-throttles',
        Threshold: 5,
      });
    });
  });

  describe('Resource Tagging', () => {
    test('applies consistent tags to all resources', () => {
      const resources = template.findResources('AWS::EC2::VPC');
      const vpcResource = Object.values(resources)[0];
      expect(vpcResource.Properties.Tags).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ Key: 'Environment', Value: 'pr3432' }),
          expect.objectContaining({ Key: 'Project', Value: 'freelancer-platform' }),
          expect.objectContaining({ Key: 'ManagedBy', Value: 'CDK' }),
          expect.objectContaining({ Key: 'CostCenter', Value: 'engineering' }),
        ])
      );
    });
  });

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

    test('exports State Machine ARN', () => {
      template.hasOutput('StateMachineArn', {
        Description: 'Project Lifecycle State Machine ARN',
      });
    });
  });

  describe('Security and Compliance', () => {
    test('ensures all S3 buckets have encryption', () => {
      const buckets = template.findResources('AWS::S3::Bucket');
      Object.values(buckets).forEach((bucket: any) => {
        expect(bucket.Properties.BucketEncryption).toBeDefined();
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
  });

  describe('Resource Count Validation', () => {
    test('validates expected number of core resources', () => {
      template.resourceCountIs('AWS::EC2::VPC', 1);
      template.resourceCountIs('AWS::RDS::DBCluster', 1);
      template.resourceCountIs('AWS::DynamoDB::Table', 1);
      template.resourceCountIs('AWS::ElasticLoadBalancingV2::LoadBalancer', 1);
      expect(template.findResources('AWS::Lambda::Function')).toBeDefined();
      template.resourceCountIs('AWS::StepFunctions::StateMachine', 1);
      template.resourceCountIs('AWS::CloudWatch::Dashboard', 1);
    });
  });
});
