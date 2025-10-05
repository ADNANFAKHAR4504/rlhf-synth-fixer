/* eslint-disable prettier/prettier */

import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('FreelancerPlatform Integration Tests', () => {
  let app: cdk.App;
  let stack: TapStack;
  let template: Template;

  beforeAll(() => {
    app = new cdk.App();
    stack = new TapStack(app, 'IntegrationTestStack', {
      environmentSuffix,
      env: { account: '123456789012', region: 'us-east-2' },
    });
    template = Template.fromStack(stack);
  });

  // =================================================================
  // CROSS-SERVICE INTEGRATION TESTS
  // =================================================================

  describe('ALB to ECS Integration', () => {
    test('validates ALB target group connects to ECS service', () => {
      // ALB target group should exist with correct configuration
      template.hasResourceProperties('AWS::ElasticLoadBalancingV2::TargetGroup', {
        Port: 3000,
        Protocol: 'HTTP',
        TargetType: 'ip',
        VpcId: {
          Ref: expect.stringMatching(/FreelancerVPC/),
        },
      });

      // ECS service should be created
      template.hasResourceProperties('AWS::ECS::Service', {
        LaunchType: 'FARGATE',
        LoadBalancers: [
          {
            ContainerName: 'freelancer-app',
            ContainerPort: 3000,
            TargetGroupArn: {
              Ref: expect.stringMatching(/TargetGroup/),
            },
          },
        ],
      });
    });

    test('validates security group rules allow ALB to reach ECS', () => {
      // ECS security group should allow ingress from ALB
      const resources = template.toJSON().Resources;
      const ecsSecurityGroupRules = Object.values(resources).filter(
        (r: any) =>
          r.Type === 'AWS::EC2::SecurityGroupIngress' &&
          r.Properties?.Description === 'Allow traffic from ALB on container port'
      );
      expect(ecsSecurityGroupRules.length).toBeGreaterThan(0);
    });

    test('validates health check configuration', () => {
      template.hasResourceProperties('AWS::ElasticLoadBalancingV2::TargetGroup', {
        HealthCheckEnabled: true,
        HealthCheckPath: '/health',
        HealthCheckIntervalSeconds: 30,
        HealthCheckTimeoutSeconds: 5,
        HealthyThresholdCount: 2,
        UnhealthyThresholdCount: 3,
      });
    });
  });

  describe('ECS to Aurora Integration', () => {
    test('validates ECS task has Aurora endpoint as environment variable', () => {
      template.hasResourceProperties('AWS::ECS::TaskDefinition', {
        ContainerDefinitions: [
          {
            Name: 'freelancer-app',
            Environment: expect.arrayContaining([
              expect.objectContaining({
                Name: 'AURORA_ENDPOINT',
              }),
            ]),
          },
        ],
      });
    });

    test('validates ECS task role has Secrets Manager access', () => {
      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: {
          Statement: expect.arrayContaining([
            expect.objectContaining({
              Action: expect.arrayContaining([
                'secretsmanager:GetSecretValue',
                'secretsmanager:DescribeSecret',
              ]),
              Effect: 'Allow',
            }),
          ]),
        },
      });
    });

    test('validates security group allows ECS to reach Aurora on port 3306', () => {
      const resources = template.toJSON().Resources;
      const auroraIngressRules = Object.values(resources).filter(
        (r: any) =>
          r.Type === 'AWS::EC2::SecurityGroupIngress' &&
          r.Properties?.IpProtocol === 'tcp' &&
          r.Properties?.FromPort === 3306 &&
          r.Properties?.ToPort === 3306 &&
          r.Properties?.Description === 'Allow MySQL from ECS tasks'
      );
      expect(auroraIngressRules.length).toBeGreaterThan(0);
    });
  });

  describe('ECS to DynamoDB Integration', () => {
    test('validates ECS task has DynamoDB table name as environment variable', () => {
      template.hasResourceProperties('AWS::ECS::TaskDefinition', {
        ContainerDefinitions: [
          {
            Name: 'freelancer-app',
            Environment: expect.arrayContaining([
              expect.objectContaining({
                Name: 'DYNAMODB_TABLE',
              }),
            ]),
          },
        ],
      });
    });

    test('validates ECS task role has DynamoDB read/write permissions', () => {
      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: {
          Statement: expect.arrayContaining([
            expect.objectContaining({
              Action: expect.arrayContaining([
                'dynamodb:BatchGetItem',
                'dynamodb:GetItem',
                'dynamodb:Query',
                'dynamodb:Scan',
                'dynamodb:PutItem',
                'dynamodb:UpdateItem',
                'dynamodb:DeleteItem',
              ]),
              Effect: 'Allow',
            }),
          ]),
        },
      });
    });
  });

  describe('ECS to ElastiCache Redis Integration', () => {
    test('validates ECS task has Redis endpoint as environment variable', () => {
      template.hasResourceProperties('AWS::ECS::TaskDefinition', {
        ContainerDefinitions: [
          {
            Name: 'freelancer-app',
            Environment: expect.arrayContaining([
              expect.objectContaining({
                Name: 'REDIS_ENDPOINT',
              }),
            ]),
          },
        ],
      });
    });

    test('validates security group allows ECS to reach Redis on port 6379', () => {
      const resources = template.toJSON().Resources;
      const redisIngressRules = Object.values(resources).filter(
        (r: any) =>
          r.Type === 'AWS::EC2::SecurityGroupIngress' &&
          r.Properties?.IpProtocol === 'tcp' &&
          r.Properties?.FromPort === 6379 &&
          r.Properties?.ToPort === 6379 &&
          r.Properties?.Description === 'Allow Redis from ECS tasks'
      );
      expect(redisIngressRules.length).toBeGreaterThan(0);
    });

    test('validates Redis is configured for multi-AZ deployment', () => {
      template.hasResourceProperties('AWS::ElastiCache::ReplicationGroup', {
        MultiAZEnabled: true,
        AutomaticFailoverEnabled: true,
      });
    });
  });

  describe('Lambda to Aurora Integration', () => {
    test('validates Lambda has Aurora endpoint as environment variable', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        Environment: {
          Variables: expect.objectContaining({
            AURORA_ENDPOINT: expect.anything(),
            DB_SECRET_ARN: expect.anything(),
          }),
        },
      });
    });

    test('validates Lambda is attached to VPC', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        VpcConfig: expect.objectContaining({
          SubnetIds: expect.any(Array),
          SecurityGroupIds: expect.any(Array),
        }),
      });
    });

    test('validates Lambda role has Secrets Manager access', () => {
      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: {
          Statement: expect.arrayContaining([
            expect.objectContaining({
              Action: expect.arrayContaining([
                'secretsmanager:GetSecretValue',
                'secretsmanager:DescribeSecret',
              ]),
              Effect: 'Allow',
            }),
          ]),
        },
      });
    });

    test('validates security group allows Lambda to reach Aurora', () => {
      const resources = template.toJSON().Resources;
      const auroraIngressRules = Object.values(resources).filter(
        (r: any) =>
          r.Type === 'AWS::EC2::SecurityGroupIngress' &&
          r.Properties?.Description === 'Allow MySQL from Lambda'
      );
      expect(auroraIngressRules.length).toBeGreaterThan(0);
    });
  });

  describe('Lambda to SNS Integration', () => {
    test('validates Lambda has SNS topic ARN as environment variable', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        Environment: {
          Variables: expect.objectContaining({
            PAYMENT_TOPIC_ARN: expect.anything(),
          }),
        },
      });
    });

    test('validates Lambda role has SNS publish permissions', () => {
      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: {
          Statement: expect.arrayContaining([
            expect.objectContaining({
              Action: 'sns:Publish',
              Effect: 'Allow',
            }),
          ]),
        },
      });
    });
  });

  describe('Step Functions Integration', () => {
    test('validates state machine integrates with SNS topics', () => {
      template.hasResourceProperties('AWS::StepFunctions::StateMachine', {
        DefinitionString: expect.stringContaining('sns:Publish'),
      });
    });

    test('validates state machine integrates with Lambda function', () => {
      template.hasResourceProperties('AWS::StepFunctions::StateMachine', {
        DefinitionString: expect.stringContaining('lambda:InvokeFunction'),
      });
    });

    test('validates state machine role has required permissions', () => {
      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: {
          Statement: expect.arrayContaining([
            expect.objectContaining({
              Action: 'sns:Publish',
              Effect: 'Allow',
            }),
          ]),
        },
      });
    });
  });

  describe('S3 to CloudFront Integration', () => {
    test('validates CloudFront uses S3 as origin', () => {
      template.hasResourceProperties('AWS::CloudFront::Distribution', {
        DistributionConfig: expect.objectContaining({
          Origins: expect.arrayContaining([
            expect.objectContaining({
              S3OriginConfig: expect.objectContaining({
                OriginAccessIdentity: expect.stringContaining('origin-access-identity'),
              }),
            }),
          ]),
        }),
      });
    });

    test('validates S3 bucket policy allows CloudFront OAI access', () => {
      template.hasResourceProperties('AWS::S3::BucketPolicy', {
        PolicyDocument: {
          Statement: expect.arrayContaining([
            expect.objectContaining({
              Action: ['s3:GetObject*', 's3:GetBucket*', 's3:List*'],
              Effect: 'Allow',
              Principal: expect.objectContaining({
                CanonicalUser: expect.anything(),
              }),
            }),
          ]),
        },
      });
    });

    test('validates CloudFront enforces HTTPS', () => {
      template.hasResourceProperties('AWS::CloudFront::Distribution', {
        DistributionConfig: expect.objectContaining({
          DefaultCacheBehavior: expect.objectContaining({
            ViewerProtocolPolicy: 'redirect-to-https',
          }),
        }),
      });
    });
  });

  describe('Cognito Integration', () => {
    test('validates ECS task has Cognito pool IDs as environment variables', () => {
      template.hasResourceProperties('AWS::ECS::TaskDefinition', {
        ContainerDefinitions: [
          {
            Name: 'freelancer-app',
            Environment: expect.arrayContaining([
              expect.objectContaining({
                Name: 'FREELANCER_POOL_ID',
              }),
              expect.objectContaining({
                Name: 'FREELANCER_CLIENT_ID',
              }),
              expect.objectContaining({
                Name: 'CLIENT_POOL_ID',
              }),
              expect.objectContaining({
                Name: 'CLIENT_CLIENT_ID',
              }),
            ]),
          },
        ],
      });
    });

    test('validates separate user pools for tenant isolation', () => {
      const resources = template.toJSON().Resources;
      const userPools = Object.values(resources).filter(
        (r: any) => r.Type === 'AWS::Cognito::UserPool'
      );
      expect(userPools.length).toBe(2);
    });
  });

  describe('CloudWatch Monitoring Integration', () => {
    test('validates alarms are configured for critical metrics', () => {
      const resources = template.toJSON().Resources;
      const alarms = Object.values(resources).filter(
        (r: any) => r.Type === 'AWS::CloudWatch::Alarm'
      );
      expect(alarms.length).toBeGreaterThanOrEqual(3);
    });

    test('validates dashboard includes key metrics', () => {
      template.hasResourceProperties('AWS::CloudWatch::Dashboard', {
        DashboardBody: expect.stringContaining('ALB'),
      });
    });
  });

  // =================================================================
  // NETWORKING & CONNECTIVITY TESTS
  // =================================================================

  describe('VPC Connectivity', () => {
    test('validates private subnets have NAT Gateway routes', () => {
      template.hasResourceProperties('AWS::EC2::Route', {
        RouteTableId: expect.anything(),
        DestinationCidrBlock: '0.0.0.0/0',
        NatGatewayId: expect.anything(),
      });
    });

    test('validates database subnets are isolated', () => {
      const resources = template.toJSON().Resources;
      const databaseSubnets = Object.values(resources).filter(
        (r: any) =>
          r.Type === 'AWS::EC2::Subnet' &&
          r.Properties?.Tags?.some((t: any) => t.Value?.includes('Database'))
      );
      expect(databaseSubnets.length).toBeGreaterThan(0);
    });
  });

  // =================================================================
  // ERROR HANDLING & RESILIENCE TESTS
  // =================================================================

  describe('Error Handling and Resilience', () => {
    test('validates Lambda has Dead Letter Queue configured', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        DeadLetterConfig: {
          TargetArn: expect.anything(),
        },
      });
    });

    test('validates ECS auto-scaling for resilience', () => {
      template.hasResourceProperties('AWS::ApplicationAutoScaling::ScalableTarget', {
        MinCapacity: 2,
        MaxCapacity: 10,
      });
    });

    test('validates Aurora has backup retention configured', () => {
      template.hasResourceProperties('AWS::RDS::DBCluster', {
        BackupRetentionPeriod: 7,
      });
    });

    test('validates DynamoDB has point-in-time recovery', () => {
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        PointInTimeRecoverySpecification: {
          PointInTimeRecoveryEnabled: true,
        },
      });
    });
  });

  // =================================================================
  // PERFORMANCE OPTIMIZATION TESTS
  // =================================================================

  describe('Performance Optimization', () => {
    test('validates CloudFront uses optimized caching policy', () => {
      template.hasResourceProperties('AWS::CloudFront::Distribution', {
        DistributionConfig: expect.objectContaining({
          DefaultCacheBehavior: expect.objectContaining({
            CachePolicyId: expect.anything(),
          }),
        }),
      });
    });

    test('validates DynamoDB uses on-demand billing for variable workloads', () => {
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        BillingMode: 'PAY_PER_REQUEST',
      });
    });

    test('validates Redis cluster mode for horizontal scaling', () => {
      template.hasResourceProperties('AWS::ElastiCache::ReplicationGroup', {
        NumNodeGroups: 1,
        ReplicasPerNodeGroup: 1,
      });
    });
  });

  // =================================================================
  // COST OPTIMIZATION TESTS
  // =================================================================

  describe('Cost Optimization', () => {
    test('validates S3 lifecycle policies for cost reduction', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        LifecycleConfiguration: {
          Rules: expect.arrayContaining([
            expect.objectContaining({
              NoncurrentVersionTransitions: expect.arrayContaining([
                expect.objectContaining({
                  StorageClass: 'GLACIER',
                }),
              ]),
            }),
          ]),
        },
      });
    });

    test('validates CloudFront price class for cost optimization', () => {
      template.hasResourceProperties('AWS::CloudFront::Distribution', {
        DistributionConfig: expect.objectContaining({
          PriceClass: 'PriceClass_100',
        }),
      });
    });
  });

  // =================================================================
  // COMPLIANCE & AUDIT TESTS
  // =================================================================

  describe('Compliance and Audit', () => {
    test('validates VPC Flow Logs are enabled', () => {
      template.hasResourceProperties('AWS::EC2::FlowLog', {
        ResourceType: 'VPC',
        TrafficType: 'ALL',
      });
    });

    test('validates CloudFront logging is enabled', () => {
      template.hasResourceProperties('AWS::CloudFront::Distribution', {
        DistributionConfig: expect.objectContaining({
          Logging: expect.objectContaining({
            Bucket: expect.anything(),
          }),
        }),
      });
    });

    test('validates ECS uses CloudWatch Logs', () => {
      template.hasResourceProperties('AWS::ECS::TaskDefinition', {
        ContainerDefinitions: [
          {
            Name: 'freelancer-app',
            LogConfiguration: expect.objectContaining({
              LogDriver: 'awslogs',
            }),
          },
        ],
      });
    });

    test('validates Lambda has X-Ray tracing enabled', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        TracingConfig: {
          Mode: 'Active',
        },
      });
    });
  });

  // =================================================================
  // END-TO-END WORKFLOW VALIDATION
  // =================================================================

  describe('End-to-End Workflow', () => {
    test('validates complete message flow: ECS -> DynamoDB with GSI queries', () => {
      // ECS has DynamoDB permissions
      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: {
          Statement: expect.arrayContaining([
            expect.objectContaining({
              Action: expect.arrayContaining(['dynamodb:Query']),
            }),
          ]),
        },
      });

      // DynamoDB has both GSIs configured
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        GlobalSecondaryIndexes: expect.arrayContaining([
          expect.objectContaining({
            IndexName: 'userId-timestamp-index',
          }),
          expect.objectContaining({
            IndexName: 'receiverId-timestamp-index',
          }),
        ]),
      });
    });

    test('validates complete project lifecycle: State Machine -> Lambda -> SNS', () => {
      // State machine exists with Lambda and SNS integration
      template.hasResourceProperties('AWS::StepFunctions::StateMachine', {
        DefinitionString: expect.stringContaining('lambda:InvokeFunction'),
      });

      // Lambda can publish to SNS
      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: {
          Statement: expect.arrayContaining([
            expect.objectContaining({
              Action: 'sns:Publish',
              Effect: 'Allow',
            }),
          ]),
        },
      });
    });

    test('validates complete authentication flow: Cognito -> ECS -> Aurora', () => {
      // ECS has Cognito pool IDs
      template.hasResourceProperties('AWS::ECS::TaskDefinition', {
        ContainerDefinitions: [
          {
            Environment: expect.arrayContaining([
              expect.objectContaining({
                Name: 'FREELANCER_POOL_ID',
              }),
            ]),
          },
        ],
      });

      // ECS can access Aurora
      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: {
          Statement: expect.arrayContaining([
            expect.objectContaining({
              Action: expect.arrayContaining(['secretsmanager:GetSecretValue']),
            }),
          ]),
        },
      });
    });

    test('validates complete content delivery: S3 -> CloudFront -> Users', () => {
      // CloudFront uses S3 as origin with OAI
      template.hasResourceProperties('AWS::CloudFront::Distribution', {
        DistributionConfig: expect.objectContaining({
          Origins: expect.arrayContaining([
            expect.objectContaining({
              S3OriginConfig: expect.anything(),
            }),
          ]),
        }),
      });

      // S3 bucket policy allows CloudFront
      template.hasResourceProperties('AWS::S3::BucketPolicy', {
        PolicyDocument: {
          Statement: expect.arrayContaining([
            expect.objectContaining({
              Principal: expect.objectContaining({
                CanonicalUser: expect.anything(),
              }),
            }),
          ]),
        },
      });
    });
  });
});
