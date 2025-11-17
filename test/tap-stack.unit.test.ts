import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack';

describe('TapStack Unit Tests', () => {
  let app: cdk.App;
  let stack: TapStack;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();
  });

  describe('Dev Environment', () => {
    beforeEach(() => {
      stack = new TapStack(app, 'TestStack', {
        environmentSuffix: 'dev',
        env: { account: '123456789012', region: 'us-east-1' },
      });
      template = Template.fromStack(stack);
    });

    test('VPC created with dev CIDR block', () => {
      template.hasResourceProperties('AWS::EC2::VPC', {
        CidrBlock: '10.0.0.0/16',
      });
    });

    test('RDS cluster created with t3.medium instance', () => {
      template.hasResourceProperties('AWS::RDS::DBCluster', {
        Engine: 'aurora-postgresql',
        DatabaseName: 'paymentdb',
        StorageEncrypted: true,
      });

      template.hasResourceProperties('AWS::RDS::DBInstance', {
        DBInstanceClass: 'db.t3.medium',
        Engine: 'aurora-postgresql',
      });
    });

    test('All RDS resources have DESTROY removal policy', () => {
      template.hasResource('AWS::RDS::DBCluster', {
        DeletionPolicy: 'Delete',
        UpdateReplacePolicy: 'Delete',
      });
    });

    test('SQS queues created with correct retention', () => {
      template.hasResourceProperties('AWS::SQS::Queue', {
        MessageRetentionPeriod: 86400, // 1 day for dev
      });
    });

    test('Dead letter queue configured', () => {
      template.hasResourceProperties('AWS::SQS::Queue', {
        RedrivePolicy: {
          maxReceiveCount: 3,
        },
      });
    });

    test('S3 bucket has 7-day lifecycle policy', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        LifecycleConfiguration: {
          Rules: [
            {
              ExpirationInDays: 7,
              Status: 'Enabled',
            },
            {
              Status: 'Enabled',
              Transitions: [
                {
                  StorageClass: 'STANDARD_IA',
                  TransitionInDays: 3, // 7/2 = 3.5, floor to 3
                },
              ],
            },
          ],
        },
      });
    });

    test('S3 bucket has DESTROY removal policy', () => {
      template.hasResource('AWS::S3::Bucket', {
        DeletionPolicy: 'Delete',
        UpdateReplacePolicy: 'Delete',
      });
    });

    test('Lambda function created with correct configuration', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        Runtime: 'nodejs20.x',
        Timeout: 30,
        MemorySize: 512,
        Environment: {
          Variables: {
            SSM_CONFIG_PATH: '/dev/payment-service/config/settings',
            ENVIRONMENT: 'dev',
            DB_NAME: 'paymentdb',
          },
        },
      });
    });

    test('Lambda has IAM permissions for SSM', () => {
      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: {
          Statement: [
            {
              Action: ['ssm:GetParameter', 'ssm:GetParameters'],
              Effect: 'Allow',
              Resource: {
                'Fn::Join': [
                  '',
                  [
                    'arn:aws:ssm:',
                    { Ref: 'AWS::Region' },
                    ':',
                    { Ref: 'AWS::AccountId' },
                    ':parameter/dev/payment-service/config/*',
                  ],
                ],
              },
            },
          ],
        },
      });
    });

    test('API Gateway created with dev stage', () => {
      template.hasResourceProperties('AWS::ApiGateway::RestApi', {
        Name: 'payment-api-dev',
      });

      template.hasResourceProperties('AWS::ApiGateway::Stage', {
        StageName: 'dev',
      });
    });

    test('WAF Web ACL created with rate limiting', () => {
      template.hasResourceProperties('AWS::WAFv2::WebACL', {
        Name: 'payment-waf-dev',
        Scope: 'REGIONAL',
        Rules: [
          {
            Name: 'RateLimitRule',
            Priority: 1,
            Statement: {
              RateBasedStatement: {
                Limit: 500, // Dev limit
                AggregateKeyType: 'IP',
              },
            },
            Action: {
              Block: {},
            },
          },
        ],
      });
    });

    test('SSM parameter created for dev config', () => {
      template.hasResourceProperties('AWS::SSM::Parameter', {
        Name: '/dev/payment-service/config/settings',
        Type: 'String',
      });
    });

    test('CloudFormation outputs created', () => {
      const outputs = template.findOutputs('*');
      expect(Object.keys(outputs)).toContain('VpcId');
      expect(Object.keys(outputs)).toContain('DatabaseEndpoint');
      expect(Object.keys(outputs)).toContain('ApiUrl');
      expect(Object.keys(outputs)).toContain('QueueUrl');
      expect(Object.keys(outputs)).toContain('BucketName');
      expect(Object.keys(outputs)).toContain('LambdaFunctionName');
      expect(Object.keys(outputs)).toContain('WafAclArn');
    });
  });

  describe('Staging Environment', () => {
    beforeEach(() => {
      stack = new TapStack(app, 'TestStack', {
        environmentSuffix: 'staging',
        env: { account: '123456789012', region: 'us-east-1' },
      });
      template = Template.fromStack(stack);
    });

    test('VPC created with staging CIDR block', () => {
      template.hasResourceProperties('AWS::EC2::VPC', {
        CidrBlock: '10.1.0.0/16',
      });
    });

    test('RDS cluster created with r5.large instance', () => {
      template.hasResourceProperties('AWS::RDS::DBInstance', {
        DBInstanceClass: 'db.r5.large',
      });
    });

    test('SQS queue has 7-day retention', () => {
      template.hasResourceProperties('AWS::SQS::Queue', {
        MessageRetentionPeriod: 604800, // 7 days
      });
    });

    test('S3 bucket has 30-day lifecycle policy', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        LifecycleConfiguration: {
          Rules: [
            {
              ExpirationInDays: 30,
              Status: 'Enabled',
            },
            {
              Status: 'Enabled',
              Transitions: [
                {
                  StorageClass: 'STANDARD_IA',
                  TransitionInDays: 15, // 30/2 = 15
                },
              ],
            },
          ],
        },
      });
    });
  });

  describe('Production Environment', () => {
    beforeEach(() => {
      stack = new TapStack(app, 'TestStack', {
        environmentSuffix: 'prod',
        env: { account: '123456789012', region: 'us-east-1' },
      });
      template = Template.fromStack(stack);
    });

    test('VPC created with prod CIDR block', () => {
      template.hasResourceProperties('AWS::EC2::VPC', {
        CidrBlock: '10.2.0.0/16',
      });
    });

    test('RDS cluster created with r5.xlarge instance', () => {
      template.hasResourceProperties('AWS::RDS::DBInstance', {
        DBInstanceClass: 'db.r5.xlarge',
      });
    });

    test('SQS queue has 14-day retention', () => {
      template.hasResourceProperties('AWS::SQS::Queue', {
        MessageRetentionPeriod: 1209600, // 14 days
      });
    });

    test('S3 bucket has 90-day lifecycle policy', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        LifecycleConfiguration: {
          Rules: [
            {
              ExpirationInDays: 90,
              Status: 'Enabled',
            },
            {
              Status: 'Enabled',
              Transitions: [
                {
                  StorageClass: 'STANDARD_IA',
                  TransitionInDays: 45, // 90/2 = 45
                },
              ],
            },
          ],
        },
      });
    });

    test('API Gateway has production throttling', () => {
      template.hasResourceProperties('AWS::ApiGateway::Stage', {
        ThrottlingBurstLimit: 5000,
        ThrottlingRateLimit: 2000,
      });
    });

    test('WAF has production rate limits', () => {
      template.hasResourceProperties('AWS::WAFv2::WebACL', {
        Rules: [
          {
            Name: 'RateLimitRule',
            Statement: {
              RateBasedStatement: {
                Limit: 2000, // Prod limit
              },
            },
          },
        ],
      });
    });
  });

  describe('Configuration Validation', () => {
    test('Invalid environment throws error', () => {
      expect(() => {
        new TapStack(app, 'TestStack', {
          environmentSuffix: 'invalid',
        });
      }).toThrow('Environment configuration not found for: invalid');
    });
  });

  describe('Resource Counting', () => {
    beforeEach(() => {
      stack = new TapStack(app, 'TestStack', {
        environmentSuffix: 'dev',
        env: { account: '123456789012', region: 'us-east-1' },
      });
      template = Template.fromStack(stack);
    });

    test('Has VPC resources', () => {
      template.resourceCountIs('AWS::EC2::VPC', 1);
    });

    test('Has RDS cluster and instance', () => {
      template.resourceCountIs('AWS::RDS::DBCluster', 1);
      template.resourceCountIs('AWS::RDS::DBInstance', 1);
    });

    test('Has two SQS queues (main + DLQ)', () => {
      template.resourceCountIs('AWS::SQS::Queue', 2);
    });

    test('Has S3 bucket', () => {
      template.resourceCountIs('AWS::S3::Bucket', 1);
    });

    test('Has Lambda function', () => {
      template.resourceCountIs('AWS::Lambda::Function', 1);
    });

    test('Has API Gateway', () => {
      template.resourceCountIs('AWS::ApiGateway::RestApi', 1);
    });

    test('Has WAF Web ACL', () => {
      template.resourceCountIs('AWS::WAFv2::WebACL', 1);
    });

    test('Has SSM parameter', () => {
      template.resourceCountIs('AWS::SSM::Parameter', 1);
    });
  });
});
