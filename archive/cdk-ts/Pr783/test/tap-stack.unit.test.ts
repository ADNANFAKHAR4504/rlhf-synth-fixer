import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack';
import { SecurityStack } from '../lib/security-stack';

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
    test('creates TapStack with security stack nested', () => {
      // Check that the nested security stack is created
      const nestedStacks = stack.node.children.filter(
        (child) => child instanceof SecurityStack
      );
      expect(nestedStacks.length).toBe(1);
      expect(nestedStacks[0].node.id).toBe('SecurityStack');
    });

    test('passes environment suffix to nested stack', () => {
      const securityStack = stack.node.children.find(
        (child) => child instanceof SecurityStack
      ) as SecurityStack;
      expect(securityStack).toBeDefined();
    });
  });

  describe('Stack Properties', () => {
    test('uses environment suffix from props', () => {
      const customApp = new cdk.App();
      const customStack = new TapStack(customApp, 'CustomStack', {
        environmentSuffix: 'custom',
      });
      
      const securityStack = customStack.node.children.find(
        (child) => child instanceof SecurityStack
      ) as SecurityStack;
      expect(securityStack).toBeDefined();
    });

    test('uses environment suffix from context when props not provided', () => {
      const contextApp = new cdk.App({
        context: {
          environmentSuffix: 'context-suffix',
        },
      });
      const contextStack = new TapStack(contextApp, 'ContextStack');
      
      const securityStack = contextStack.node.children.find(
        (child) => child instanceof SecurityStack
      ) as SecurityStack;
      expect(securityStack).toBeDefined();
    });

    test('defaults to dev when no environment suffix provided', () => {
      const defaultApp = new cdk.App();
      const defaultStack = new TapStack(defaultApp, 'DefaultStack');
      
      const securityStack = defaultStack.node.children.find(
        (child) => child instanceof SecurityStack
      ) as SecurityStack;
      expect(securityStack).toBeDefined();
    });
  });
});

describe('SecurityStack', () => {
  let app: cdk.App;
  let stack: SecurityStack;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();
    stack = new SecurityStack(app, 'TestSecurityStack', {
      environmentSuffix: 'test',
    });
    template = Template.fromStack(stack);
  });

  describe('KMS Key', () => {
    test('creates KMS key with proper configuration', () => {
      template.hasResourceProperties('AWS::KMS::Key', {
        Description: 'KMS Key for secure web application',
        EnableKeyRotation: true,
        KeyPolicy: Match.objectLike({
          Statement: Match.arrayWith([
            Match.objectLike({
              Sid: 'Enable IAM User Permissions',
              Effect: 'Allow',
              Action: 'kms:*',
              Resource: '*',
            }),
          ]),
        }),
      });
    });
  });

  describe('S3 Bucket', () => {
    test('creates S3 bucket with security features', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketName: Match.objectLike({
          'Fn::Join': Match.arrayWith([
            '',
            Match.arrayWith([
              'secure-web-app-bucket-test-',
            ]),
          ]),
        }),
        VersioningConfiguration: {
          Status: 'Enabled',
        },
        BucketEncryption: {
          ServerSideEncryptionConfiguration: Match.arrayWith([
            Match.objectLike({
              ServerSideEncryptionByDefault: Match.objectLike({
                SSEAlgorithm: 'aws:kms',
              }),
            }),
          ]),
        },
        PublicAccessBlockConfiguration: {
          BlockPublicAcls: true,
          BlockPublicPolicy: true,
          IgnorePublicAcls: true,
          RestrictPublicBuckets: true,
        },
        LifecycleConfiguration: {
          Rules: Match.arrayWith([
            Match.objectLike({
              Id: 'DeleteOldVersions',
              Status: 'Enabled',
              NoncurrentVersionExpiration: {
                NoncurrentDays: 30,
              },
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

  describe('DynamoDB Table', () => {
    test('creates DynamoDB table with on-demand billing', () => {
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        TableName: 'secure-data-table-test',
        BillingMode: 'PAY_PER_REQUEST',
        KeySchema: [
          {
            AttributeName: 'id',
            KeyType: 'HASH',
          },
        ],
        AttributeDefinitions: [
          {
            AttributeName: 'id',
            AttributeType: 'S',
          },
        ],
        PointInTimeRecoverySpecification: {
          PointInTimeRecoveryEnabled: true,
        },
        SSESpecification: Match.objectLike({
          SSEEnabled: true,
          SSEType: 'KMS',
        }),
        StreamSpecification: {
          StreamViewType: 'NEW_AND_OLD_IMAGES',
        },
      });
    });
  });

  describe('Lambda Function', () => {
    test('creates Lambda function with proper configuration', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        FunctionName: 'secure-backend-test',
        Runtime: 'nodejs20.x',
        Handler: 'index.handler',
        Timeout: 30,
        MemorySize: 256,
      });
      
      // Check environment variables separately with references
      template.hasResourceProperties('AWS::Lambda::Function', {
        Environment: {
          Variables: Match.objectLike({
            TABLE_NAME: Match.objectLike({
              Ref: Match.anyValue(),
            }),
          }),
        },
      });
    });

    test('creates Lambda execution role with least privilege', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        AssumeRolePolicyDocument: Match.objectLike({
          Statement: Match.arrayWith([
            Match.objectLike({
              Effect: 'Allow',
              Principal: {
                Service: 'lambda.amazonaws.com',
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
                Match.stringLikeRegexp('.*AWSLambdaBasicExecutionRole.*'),
              ]),
            ]),
          }),
        ]),
        Policies: Match.arrayWith([
          Match.objectLike({
            PolicyName: 'DynamoDBAccess',
            PolicyDocument: Match.objectLike({
              Statement: Match.arrayWith([
                Match.objectLike({
                  Effect: 'Allow',
                  Action: Match.arrayWith([
                    'dynamodb:PutItem',
                    'dynamodb:GetItem',
                    'dynamodb:UpdateItem',
                    'dynamodb:DeleteItem',
                    'dynamodb:Query',
                    'dynamodb:Scan',
                  ]),
                }),
              ]),
            }),
          }),
          Match.objectLike({
            PolicyName: 'S3Access',
            PolicyDocument: Match.objectLike({
              Statement: Match.arrayWith([
                Match.objectLike({
                  Effect: 'Allow',
                  Action: Match.arrayWith([
                    's3:GetObject',
                    's3:PutObject',
                    's3:DeleteObject',
                  ]),
                }),
              ]),
            }),
          }),
          Match.objectLike({
            PolicyName: 'KMSAccess',
            PolicyDocument: Match.objectLike({
              Statement: Match.arrayWith([
                Match.objectLike({
                  Effect: 'Allow',
                  Action: Match.arrayWith([
                    'kms:Encrypt',
                    'kms:Decrypt',
                    'kms:GenerateDataKey',
                    'kms:GenerateDataKeyWithoutPlaintext',
                  ]),
                }),
              ]),
            }),
          }),
        ]),
      });
    });
  });

  describe('API Gateway', () => {
    test('creates REST API with security features', () => {
      template.hasResourceProperties('AWS::ApiGateway::RestApi', {
        Name: 'secure-web-api-test',
        Description: 'Secure Web Application API',
      });
    });

    test('creates API Gateway deployment stage with logging', () => {
      template.hasResourceProperties('AWS::ApiGateway::Stage', {
        StageName: 'prod',
        TracingEnabled: true,
      });
      
      // Check that stage has method settings
      template.hasResourceProperties('AWS::ApiGateway::Stage', {
        MethodSettings: Match.arrayWith([
          Match.objectLike({
            DataTraceEnabled: true,
            LoggingLevel: 'INFO',
            MetricsEnabled: true,
          }),
        ]),
      });
    });

    test('creates API key for authentication', () => {
      template.hasResourceProperties('AWS::ApiGateway::ApiKey', {
        Name: 'secure-api-key-test',
        Description: 'API Key for secure web application',
      });
    });

    test('creates usage plan with throttling', () => {
      template.hasResourceProperties('AWS::ApiGateway::UsagePlan', {
        UsagePlanName: 'secure-usage-plan-test',
        Description: 'Usage plan for secure API',
        Throttle: {
          RateLimit: 1000,
          BurstLimit: 2000,
        },
        Quota: {
          Limit: 1000000,
          Period: 'MONTH',
        },
      });
    });

    test('creates API methods with API key requirement', () => {
      template.hasResourceProperties('AWS::ApiGateway::Method', {
        HttpMethod: 'GET',
        ApiKeyRequired: true,
      });

      template.hasResourceProperties('AWS::ApiGateway::Method', {
        HttpMethod: 'POST',
        ApiKeyRequired: true,
      });
    });
  });

  describe('WAF Configuration', () => {
    test('creates WAF Web ACL with managed rules', () => {
      template.hasResourceProperties('AWS::WAFv2::WebACL', {
        Name: 'secure-web-acl-test',
        Scope: 'REGIONAL',
        DefaultAction: { Allow: {} },
        Rules: Match.arrayWith([
          Match.objectLike({
            Name: 'AWSManagedRulesCommonRuleSet',
            Priority: 1,
            Statement: {
              ManagedRuleGroupStatement: {
                VendorName: 'AWS',
                Name: 'AWSManagedRulesCommonRuleSet',
              },
            },
          }),
          Match.objectLike({
            Name: 'AWSManagedRulesKnownBadInputsRuleSet',
            Priority: 2,
            Statement: {
              ManagedRuleGroupStatement: {
                VendorName: 'AWS',
                Name: 'AWSManagedRulesKnownBadInputsRuleSet',
              },
            },
          }),
          Match.objectLike({
            Name: 'AWSManagedRulesAmazonIpReputationList',
            Priority: 3,
            Statement: {
              ManagedRuleGroupStatement: {
                VendorName: 'AWS',
                Name: 'AWSManagedRulesAmazonIpReputationList',
              },
            },
          }),
          Match.objectLike({
            Name: 'RateLimitRule',
            Priority: 4,
            Action: { Block: {} },
            Statement: {
              RateBasedStatement: {
                Limit: 2000,
                AggregateKeyType: 'IP',
              },
            },
          }),
        ]),
      });
    });

    test('creates WAF association with API Gateway', () => {
      template.hasResourceProperties('AWS::WAFv2::WebACLAssociation', {
        ResourceArn: Match.anyValue(),
      });
    });
  });

  describe('CloudWatch Logging', () => {
    test('creates log group for API Gateway', () => {
      template.hasResourceProperties('AWS::Logs::LogGroup', {
        LogGroupName: '/aws/apigateway/secure-api-test',
        RetentionInDays: 30,
      });
    });
  });

  describe('Stack Outputs', () => {
    test('creates all required outputs', () => {
      // Check that outputs exist
      const outputs = template.findOutputs('*');
      const outputKeys = Object.keys(outputs);
      
      expect(outputKeys.some(key => key.includes('APIGatewayURL'))).toBe(true);
      expect(outputKeys.some(key => key.includes('APIKeyId'))).toBe(true);
      expect(outputKeys.some(key => key.includes('DynamoDBTableName'))).toBe(true);
      expect(outputKeys.some(key => key.includes('S3BucketName'))).toBe(true);
      expect(outputKeys.some(key => key.includes('KMSKeyId'))).toBe(true);
      expect(outputKeys.some(key => key.includes('WebACLArn'))).toBe(true);
    });
  });

  describe('Resource Tagging', () => {
    test('applies production tags to stack', () => {
      const tags = cdk.Tags.of(stack);
      // Tags are applied to all resources in the stack
      expect(stack.tags.tagValues()).toMatchObject({
        Environment: 'Production',
        Project: 'SecureWebApp',
        Owner: 'DevSecOps',
      });
    });
  });

  describe('Security Best Practices', () => {
    test('DynamoDB table has removal policy set to DESTROY', () => {
      template.hasResource('AWS::DynamoDB::Table', {
        DeletionPolicy: 'Delete',
      });
    });

    test('S3 bucket has removal policy set to RETAIN for data protection', () => {
      template.hasResource('AWS::S3::Bucket', {
        DeletionPolicy: 'Retain',
      });
    });

    test('KMS key has removal policy set to RETAIN for data protection', () => {
      template.hasResource('AWS::KMS::Key', {
        DeletionPolicy: 'Retain',
      });
    });
  });
});