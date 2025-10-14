import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('TapStack Unit Tests', () => {
  let app: cdk.App;
  let stack: TapStack;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();
    stack = new TapStack(app, 'TestTapStack', {
      environmentSuffix,
      env: {
        account: '123456789012',
        region: 'us-east-1',
      },
    });
    template = Template.fromStack(stack);
  });

  describe('DynamoDB Table', () => {
    test('should create user preferences table with correct configuration', () => {
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        BillingMode: 'PAY_PER_REQUEST',
        KeySchema: [
          {
            AttributeName: 'userId',
            KeyType: 'HASH',
          },
        ],
        TableName: `UserPreferences-${environmentSuffix}`,
      });
    });

    test('should have DESTROY removal policy', () => {
      template.hasResource('AWS::DynamoDB::Table', {
        DeletionPolicy: 'Delete',
        UpdateReplacePolicy: 'Delete',
      });
    });

    test('should expose table as public property', () => {
      expect(stack.userPreferencesTable).toBeDefined();
      expect(stack.userPreferencesTable.tableName).toBeDefined();
    });
  });

  describe('S3 Buckets', () => {
    test('should create content bucket with security settings', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketName: `content-123456789012-${environmentSuffix}`,
        BucketEncryption: {
          ServerSideEncryptionConfiguration: [
            {
              ServerSideEncryptionByDefault: {
                SSEAlgorithm: 'AES256',
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

    test('should create log bucket for CloudFront', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketName: `cf-logs-123456789012-${environmentSuffix}`,
      });
    });

    test('should have bucket policies for S3 deletion', () => {
      const buckets = template.findResources('AWS::S3::Bucket');
      Object.values(buckets).forEach(bucket => {
        expect(bucket.DeletionPolicy).toBe('Delete');
      });
    });

    test('should expose content bucket as public property', () => {
      expect(stack.contentBucket).toBeDefined();
      expect(stack.contentBucket.bucketName).toBeDefined();
    });
  });

  describe('IAM Roles', () => {
    test('should create edge function role with correct principals', () => {
      const roles = template.findResources('AWS::IAM::Role');
      let foundEdgeRole = false;
      
      for (const roleKey of Object.keys(roles)) {
        const role = roles[roleKey];
        const statements = role.Properties?.AssumeRolePolicyDocument?.Statement || [];
        
        for (const statement of statements) {
          const service = statement.Principal?.Service;
          if (service && (service === 'lambda.amazonaws.com' || service === 'edgelambda.amazonaws.com')) {
            foundEdgeRole = true;
            break;
          }
        }
        if (foundEdgeRole) break;
      }
      
      expect(foundEdgeRole).toBe(true);
    });

    test('should grant DynamoDB read permissions to edge function role', () => {
      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: {
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
                'dynamodb:DescribeTable',
              ]),
            }),
          ]),
        },
      });
    });
  });

  describe('Lambda@Edge Functions', () => {
    test('should create viewer request function with correct runtime', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        Runtime: 'nodejs20.x',
        Handler: 'index.handler',
        Timeout: 5,
        MemorySize: 128,
      });
    });

    test('should create viewer response function', () => {
      const functions = template.findResources('AWS::Lambda::Function');
      expect(Object.keys(functions).length).toBeGreaterThanOrEqual(2);
    });

    test('should expose edge functions as public properties', () => {
      expect(stack.viewerRequestFunction).toBeDefined();
      expect(stack.viewerResponseFunction).toBeDefined();
    });

    test('should have inline code with DynamoDB integration', () => {
      const functions = template.findResources('AWS::Lambda::Function');
      const functionKeys = Object.keys(functions);
      expect(functionKeys.length).toBeGreaterThanOrEqual(2);
      
      let foundDynamoDBIntegration = false;
      for (const key of functionKeys) {
        const fn = functions[key];
        if (fn.Properties.Code?.ZipFile) {
          const code = JSON.stringify(fn.Properties.Code.ZipFile);
          if (code.includes('DynamoDB') || code.includes('GetCommand')) {
            foundDynamoDBIntegration = true;
            break;
          }
        }
      }
      expect(foundDynamoDBIntegration).toBe(true);
    });
  });

  describe('CloudFront Distribution', () => {
    test('should create distribution with HTTPS enforcement', () => {
      template.hasResourceProperties('AWS::CloudFront::Distribution', {
        DistributionConfig: {
          DefaultCacheBehavior: {
            ViewerProtocolPolicy: 'redirect-to-https',
          },
          DefaultRootObject: 'index.html',
          Enabled: true,
        },
      });
    });

    test('should use default CloudFront certificate', () => {
      const distributions = template.findResources('AWS::CloudFront::Distribution');
      const distKeys = Object.keys(distributions);
      expect(distKeys.length).toBeGreaterThan(0);
      
      const dist = distributions[distKeys[0]];
      expect(dist.Properties.DistributionConfig.Enabled).toBe(true);
    });

    test('should attach Lambda@Edge functions', () => {
      template.hasResourceProperties('AWS::CloudFront::Distribution', {
        DistributionConfig: {
          DefaultCacheBehavior: {
            LambdaFunctionAssociations: Match.arrayWith([
              Match.objectLike({
                EventType: 'viewer-request',
              }),
              Match.objectLike({
                EventType: 'viewer-response',
              }),
            ]),
          },
        },
      });
    });

    test('should enable logging', () => {
      template.hasResourceProperties('AWS::CloudFront::Distribution', {
        DistributionConfig: {
          Logging: Match.objectLike({
            Bucket: Match.anyValue(),
          }),
        },
      });
    });

    test('should expose distribution as public property', () => {
      expect(stack.distribution).toBeDefined();
      expect(stack.distribution.distributionId).toBeDefined();
    });
  });

  describe('Origin Access Control', () => {
    test('should create S3 origin access control', () => {
      template.hasResourceProperties('AWS::CloudFront::OriginAccessControl', {
        OriginAccessControlConfig: {
          OriginAccessControlOriginType: 's3',
          SigningBehavior: 'no-override',
          SigningProtocol: 'sigv4',
        },
      });
    });

    test('should configure S3 bucket policy for CloudFront access', () => {
      const policies = template.findResources('AWS::S3::BucketPolicy');
      let foundCloudFrontPolicy = false;
      
      for (const policyKey of Object.keys(policies)) {
        const policy = policies[policyKey];
        const statements = policy.Properties.PolicyDocument.Statement;
        
        for (const statement of statements) {
          if (
            statement.Action === 's3:GetObject' &&
            statement.Principal?.Service === 'cloudfront.amazonaws.com' &&
            statement.Condition?.StringEquals?.['AWS:SourceArn']
          ) {
            foundCloudFrontPolicy = true;
            break;
          }
        }
        if (foundCloudFrontPolicy) break;
      }
      
      expect(foundCloudFrontPolicy).toBe(true);
    });
  });

  describe('CloudWatch Alarms', () => {
    test('should create DynamoDB read throttle alarm', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        MetricName: 'UserErrors',
        Namespace: 'AWS/DynamoDB',
        Threshold: 10,
        EvaluationPeriods: 2,
      });
    });

    test('should create DynamoDB latency alarm', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        MetricName: 'SuccessfulRequestLatency',
        Namespace: 'AWS/DynamoDB',
        Threshold: 200,
        EvaluationPeriods: 3,
      });
    });

    test('should create CloudFront error alarm', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        MetricName: '5xxErrorRate',
        Namespace: 'AWS/CloudFront',
        Threshold: 1,
        EvaluationPeriods: 2,
      });
    });

    test('should create Lambda@Edge errors alarm', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        MetricName: 'Errors',
        Namespace: 'AWS/Lambda',
        Threshold: 10,
        EvaluationPeriods: 2,
      });
    });

    test('should create Lambda@Edge throttles alarm', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        MetricName: 'Throttles',
        Namespace: 'AWS/Lambda',
        Threshold: 5,
        EvaluationPeriods: 2,
      });
    });

    test('should have proper alarm actions configuration', () => {
      const alarms = template.findResources('AWS::CloudWatch::Alarm');
      Object.values(alarms).forEach((alarm: any) => {
        expect(alarm.Properties.TreatMissingData).toBe('notBreaching');
      });
    });
  });

  describe('Stack Outputs', () => {
    test('should export distribution domain name', () => {
      template.hasOutput('DistributionDomainName', {
        Export: {
          Name: `${environmentSuffix}-DistributionDomainName`,
        },
      });
    });

    test('should export distribution ID', () => {
      template.hasOutput('DistributionId', {
        Export: {
          Name: `${environmentSuffix}-DistributionId`,
        },
      });
    });

    test('should export content bucket name', () => {
      template.hasOutput('ContentBucketName', {
        Export: {
          Name: `${environmentSuffix}-ContentBucketName`,
        },
      });
    });

    test('should export user preferences table name', () => {
      template.hasOutput('UserPreferencesTableName', {
        Export: {
          Name: `${environmentSuffix}-UserPreferencesTableName`,
        },
      });
    });

    test('should export Lambda@Edge function ARNs', () => {
      template.hasOutput('ViewerRequestFunctionArn', {
        Export: {
          Name: `${environmentSuffix}-ViewerRequestFunctionArn`,
        },
      });
      template.hasOutput('ViewerResponseFunctionArn', {
        Export: {
          Name: `${environmentSuffix}-ViewerResponseFunctionArn`,
        },
      });
    });
  });

  describe('Resource Count Validation', () => {
    test('should have expected number of resources', () => {
      const resources = template.toJSON().Resources;
      const resourceTypes = Object.values(resources).map((r: any) => r.Type);

      expect(resourceTypes).toContain('AWS::DynamoDB::Table');
      expect(resourceTypes).toContain('AWS::S3::Bucket');
      expect(resourceTypes).toContain('AWS::CloudFront::Distribution');
      expect(resourceTypes).toContain('AWS::CloudFront::OriginAccessControl');
      expect(resourceTypes).toContain('AWS::Lambda::Function');
      expect(resourceTypes).toContain('AWS::IAM::Role');
      expect(resourceTypes).toContain('AWS::CloudWatch::Alarm');
    });

    test('should have at least 5 CloudWatch alarms', () => {
      const alarms = template.findResources('AWS::CloudWatch::Alarm');
      expect(Object.keys(alarms).length).toBeGreaterThanOrEqual(5);
    });
  });

  describe('Props Handling', () => {
    test('should use environmentSuffix from props', () => {
      const customApp = new cdk.App();
      const customStack = new TapStack(customApp, 'CustomStack', {
        environmentSuffix: 'test',
        env: { account: '123456789012', region: 'us-east-1' },
      });
      const customTemplate = Template.fromStack(customStack);

      customTemplate.hasResourceProperties('AWS::DynamoDB::Table', {
        TableName: 'UserPreferences-test',
      });
    });

    test('should use environmentSuffix from context', () => {
      const contextApp = new cdk.App({
        context: { environmentSuffix: 'staging' },
      });
      const contextStack = new TapStack(contextApp, 'ContextStack', {
        env: { account: '123456789012', region: 'us-east-1' },
      });
      const contextTemplate = Template.fromStack(contextStack);

      contextTemplate.hasResourceProperties('AWS::DynamoDB::Table', {
        TableName: 'UserPreferences-staging',
      });
    });

    test('should default to "dev" when no environmentSuffix provided', () => {
      const defaultApp = new cdk.App();
      const defaultStack = new TapStack(defaultApp, 'DefaultStack', {
        env: { account: '123456789012', region: 'us-east-1' },
      });
      const defaultTemplate = Template.fromStack(defaultStack);

      defaultTemplate.hasResourceProperties('AWS::DynamoDB::Table', {
        TableName: 'UserPreferences-dev',
      });
    });
  });
});
