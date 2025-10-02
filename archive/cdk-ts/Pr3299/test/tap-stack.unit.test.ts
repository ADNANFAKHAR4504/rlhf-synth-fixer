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

  describe('S3 Bucket', () => {
    test('should create Lambda code bucket with correct configuration', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
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

    test('should have auto-delete objects enabled for dev environment', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        Tags: Match.arrayWith([
          {
            Key: 'aws-cdk:auto-delete-objects',
            Value: 'true',
          },
        ]),
      });
    });
  });

  describe('DynamoDB Table', () => {
    test('should create events table with correct keys', () => {
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        KeySchema: [
          {
            AttributeName: 'id',
            KeyType: 'HASH',
          },
          {
            AttributeName: 'timestamp',
            KeyType: 'RANGE',
          },
        ],
        BillingMode: 'PAY_PER_REQUEST',
      });
    });

    test('should have correct attribute definitions', () => {
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        AttributeDefinitions: [
          {
            AttributeName: 'id',
            AttributeType: 'S',
          },
          {
            AttributeName: 'timestamp',
            AttributeType: 'S',
          },
        ],
      });
    });
  });

  describe('SNS Topic', () => {
    test('should create alarm topic', () => {
      template.hasResourceProperties('AWS::SNS::Topic', {
        DisplayName: `${environmentSuffix}-Lambda Function Alarms`,
        TopicName: `${environmentSuffix}-lambda-alarms`,
      });
    });
  });

  describe('IAM Role - Lambda Execution', () => {
    test('should create Lambda execution role', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
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

    test('should have correct managed policies', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
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
        ManagedPolicyArns: Match.arrayWith([
          Match.objectLike({
            'Fn::Sub': Match.stringLikeRegexp('AWSLambdaBasicExecutionRole'),
          }),
        ]),
      });
    });

    test('should have S3 permissions policy', () => {
      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Action: ['s3:GetObject', 's3:PutObject', 's3:ListBucket'],
              Effect: 'Allow',
            }),
          ]),
        },
      });
    });

    test('should have DynamoDB permissions policy', () => {
      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Action: [
                'dynamodb:GetItem',
                'dynamodb:PutItem',
                'dynamodb:UpdateItem',
                'dynamodb:DeleteItem',
                'dynamodb:Query',
                'dynamodb:Scan',
              ],
              Effect: 'Allow',
            }),
          ]),
        },
      });
    });
  });

  describe('IAM Role - API Gateway CloudWatch', () => {
    test('should create API Gateway CloudWatch role', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        AssumeRolePolicyDocument: {
          Statement: [
            {
              Action: 'sts:AssumeRole',
              Effect: 'Allow',
              Principal: {
                Service: 'apigateway.amazonaws.com',
              },
            },
          ],
        },
      });
    });
  });

  describe('Lambda Function', () => {
    test('should create API handler Lambda function', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        Runtime: 'nodejs18.x',
        MemorySize: 512,
        Timeout: 30,
        TracingConfig: {
          Mode: 'Active',
        },
      });
    });

    test('should have correct environment variables', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        Environment: {
          Variables: {
            NODE_ENV: 'development',
          },
        },
      });
    });

    test('should have Lambda Insights enabled', () => {
      const functions = template.findResources('AWS::Lambda::Function');
      const apiHandler = Object.values(functions).find((f: any) =>
        f.Properties.FunctionName && f.Properties.FunctionName.includes('api-handler')
      );
      expect(apiHandler).toBeDefined();
      expect(apiHandler?.Properties.Layers).toBeDefined();
      expect(apiHandler?.Properties.Layers.length).toBeGreaterThan(0);
      // Lambda Insights version is referenced via Fn::FindInMap
      expect(apiHandler?.Properties.Layers[0]).toHaveProperty('Fn::FindInMap');
    });
  });

  describe('CloudWatch Alarms', () => {
    test('should create Lambda errors alarm', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        MetricName: 'Errors',
        Namespace: 'AWS/Lambda',
        Threshold: 1,
        ComparisonOperator: 'GreaterThanOrEqualToThreshold',
        EvaluationPeriods: 1,
      });
    });

    test('should create Lambda throttles alarm', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        MetricName: 'Throttles',
        Namespace: 'AWS/Lambda',
        Threshold: 1,
        ComparisonOperator: 'GreaterThanOrEqualToThreshold',
        EvaluationPeriods: 1,
      });
    });

    test('should have alarm actions configured', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        ActionsEnabled: true,
        AlarmActions: Match.arrayWith([Match.objectLike({ Ref: Match.anyValue() })]),
      });
    });
  });

  describe('API Gateway', () => {
    test('should create REST API', () => {
      template.hasResourceProperties('AWS::ApiGateway::RestApi', {
        Name: `${environmentSuffix}-serverless-api`,
        Description: 'Serverless API with Lambda integration',
        EndpointConfiguration: {
          Types: ['REGIONAL'],
        },
      });
    });

    test('should create API Gateway stage', () => {
      template.hasResourceProperties('AWS::ApiGateway::Stage', {
        StageName: environmentSuffix,
        MethodSettings: [
          {
            DataTraceEnabled: true,
            HttpMethod: '*',
            LoggingLevel: 'INFO',
            MetricsEnabled: true,
            ResourcePath: '/*',
          },
        ],
      });
    });

    test('should create /api/events resource', () => {
      template.hasResourceProperties('AWS::ApiGateway::Resource', {
        PathPart: 'events',
      });
    });

    test('should create /api/events/{id} resource', () => {
      template.hasResourceProperties('AWS::ApiGateway::Resource', {
        PathPart: '{id}',
      });
    });

    test('should create GET method for /api/events', () => {
      template.hasResourceProperties('AWS::ApiGateway::Method', {
        HttpMethod: 'GET',
        AuthorizationType: 'NONE',
      });
    });

    test('should create POST method for /api/events', () => {
      template.hasResourceProperties('AWS::ApiGateway::Method', {
        HttpMethod: 'POST',
        AuthorizationType: 'NONE',
      });
    });

    test('should create DELETE method for /api/events/{id}', () => {
      template.hasResourceProperties('AWS::ApiGateway::Method', {
        HttpMethod: 'DELETE',
        AuthorizationType: 'NONE',
      });
    });

    test('should have CORS enabled with OPTIONS methods', () => {
      const optionsMethods = template.findResources('AWS::ApiGateway::Method', {
        Properties: {
          HttpMethod: 'OPTIONS',
        },
      });
      expect(Object.keys(optionsMethods).length).toBeGreaterThan(0);
    });
  });

  describe('CloudWatch Log Groups', () => {
    test('should create API Gateway access log group', () => {
      template.hasResourceProperties('AWS::Logs::LogGroup', {
        LogGroupName: `/aws/apigateway/${environmentSuffix}-api`,
        RetentionInDays: 14,
      });
    });
  });

  describe('Lambda Permissions', () => {
    test('should grant API Gateway permission to invoke Lambda', () => {
      template.hasResourceProperties('AWS::Lambda::Permission', {
        Action: 'lambda:InvokeFunction',
        Principal: 'apigateway.amazonaws.com',
      });
    });

    test('should have multiple Lambda permissions for different API methods', () => {
      const permissions = template.findResources('AWS::Lambda::Permission');
      expect(Object.keys(permissions).length).toBeGreaterThan(4);
    });
  });

  describe('Stack Outputs', () => {
    test('should have API URL output', () => {
      template.hasOutput('ApiUrl', {
        Description: 'API Gateway URL',
      });
    });

    test('should have DynamoDB table name output', () => {
      template.hasOutput('DynamoDBTableName', {
        Description: 'DynamoDB Table Name',
      });
    });

    test('should have Lambda function name output', () => {
      template.hasOutput('LambdaFunction', {
        Description: 'Lambda Function Name',
      });
    });
  });

  describe('Resource Count', () => {
    test('should create expected number of resources', () => {
      const resources = template.findResources('AWS::Lambda::Function');
      expect(Object.keys(resources).length).toBeGreaterThanOrEqual(2);
    });

    test('should have API Gateway account configured', () => {
      const accounts = template.findResources('AWS::ApiGateway::Account');
      expect(Object.keys(accounts).length).toBeGreaterThanOrEqual(1);
    });

    test('should have correct number of CloudWatch alarms', () => {
      template.resourceCountIs('AWS::CloudWatch::Alarm', 2);
    });
  });

  describe('Tagging', () => {
    test('should have iac-rlhf-amazon tag on resources', () => {
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        Tags: Match.arrayWith([
          {
            Key: 'iac-rlhf-amazon',
            Value: 'true',
          },
        ]),
      });
    });
  });

  describe('Production vs Non-Production Configuration', () => {
    test('should configure dev environment with destroy policy', () => {
      const devApp = new cdk.App();
      const devStack = new TapStack(devApp, 'DevStack', {
        environmentSuffix: 'dev',
      });
      const devTemplate = Template.fromStack(devStack);

      devTemplate.hasResource('AWS::DynamoDB::Table', {
        UpdateReplacePolicy: 'Delete',
        DeletionPolicy: 'Delete',
      });
    });

    test('should use environment-specific resource prefix', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        FunctionName: `${environmentSuffix}-api-handler`,
      });
    });
  });

  describe('Optional Features - Notification Email', () => {
    test('should add email subscription when notification email is provided', () => {
      const emailApp = new cdk.App();
      const stackWithEmail = new TapStack(emailApp, 'StackWithEmail', {
        environmentSuffix: 'dev',
        notificationEmail: 'test@example.com',
      });
      const emailTemplate = Template.fromStack(stackWithEmail);

      emailTemplate.hasResourceProperties('AWS::SNS::Subscription', {
        Protocol: 'email',
        Endpoint: 'test@example.com',
      });
    });

    test('should not add email subscription when notification email is not provided', () => {
      const emailTemplate = Template.fromStack(stack);
      const subscriptions = emailTemplate.findResources('AWS::SNS::Subscription');
      expect(Object.keys(subscriptions).length).toBe(0);
    });
  });

  describe('Optional Features - Custom Domain', () => {
    test('should create custom domain resources when domain name and hosted zone are provided', () => {
      const domainApp = new cdk.App();
      const stackWithDomain = new TapStack(domainApp, 'StackWithDomain', {
        env: { account: '123456789012', region: 'us-east-1' },
        environmentSuffix: 'dev',
        customDomainName: 'api.example.com',
        hostedZoneName: 'example.com',
        hostedZoneId: 'Z1234567890ABC',
      });
      const domainTemplate = Template.fromStack(stackWithDomain);

      domainTemplate.hasResourceProperties('AWS::CertificateManager::Certificate', {
        DomainName: 'api.example.com',
      });

      domainTemplate.hasResourceProperties('AWS::ApiGateway::DomainName', {
        DomainName: 'api.example.com',
        SecurityPolicy: 'TLS_1_2',
      });

      domainTemplate.hasResourceProperties('AWS::ApiGateway::BasePathMapping', {});

      domainTemplate.hasResourceProperties('AWS::Route53::RecordSet', {
        Name: 'api.example.com.',
        Type: 'A',
      });
    });

    test('should create custom domain without hostedZoneId using lookup', () => {
      const domainApp2 = new cdk.App();
      const stackWithDomain2 = new TapStack(domainApp2, 'StackWithDomain2', {
        env: { account: '123456789012', region: 'us-east-1' },
        environmentSuffix: 'dev',
        customDomainName: 'api.example.com',
        hostedZoneName: 'example.com',
      });
      const domainTemplate2 = Template.fromStack(stackWithDomain2);

      domainTemplate2.hasResourceProperties('AWS::CertificateManager::Certificate', {
        DomainName: 'api.example.com',
      });

      domainTemplate2.hasOutput('ApiCustomDomain', {
        Description: 'API Gateway Custom Domain URL',
      });
    });

    test('should not create custom domain resources when domain name is not provided', () => {
      const domainTemplate = Template.fromStack(stack);
      const certificates = domainTemplate.findResources('AWS::CertificateManager::Certificate');
      const domainNames = domainTemplate.findResources('AWS::ApiGateway::DomainName');

      expect(Object.keys(certificates).length).toBe(0);
      expect(Object.keys(domainNames).length).toBe(0);
    });
  });

  describe('Production Environment Configuration', () => {
    test('should configure production environment with retain policy', () => {
      const prodApp1 = new cdk.App();
      const prodStack = new TapStack(prodApp1, 'ProdStack', {
        environmentSuffix: 'prod',
      });
      const prodTemplate = Template.fromStack(prodStack);

      prodTemplate.hasResource('AWS::DynamoDB::Table', {
        UpdateReplacePolicy: 'Retain',
        DeletionPolicy: 'Retain',
      });

      prodTemplate.hasResourceProperties('AWS::DynamoDB::Table', {
        PointInTimeRecoverySpecification: {
          PointInTimeRecoveryEnabled: true,
        },
      });
    });

    test('should configure production S3 bucket with versioning and retain policy', () => {
      const prodApp2 = new cdk.App();
      const prodStack = new TapStack(prodApp2, 'ProdStack2', {
        environmentSuffix: 'prod',
      });
      const prodTemplate = Template.fromStack(prodStack);

      prodTemplate.hasResourceProperties('AWS::S3::Bucket', {
        VersioningConfiguration: {
          Status: 'Enabled',
        },
      });

      prodTemplate.hasResource('AWS::S3::Bucket', {
        UpdateReplacePolicy: 'Retain',
        DeletionPolicy: 'Retain',
      });
    });

    test('should configure production API Gateway with prod stage name', () => {
      const prodApp3 = new cdk.App();
      const prodStack = new TapStack(prodApp3, 'ProdStack3', {
        environmentSuffix: 'prod',
      });
      const prodTemplate = Template.fromStack(prodStack);

      prodTemplate.hasResourceProperties('AWS::ApiGateway::Stage', {
        StageName: 'prod',
      });
    });

    test('should configure production with production NODE_ENV', () => {
      const prodApp4 = new cdk.App();
      const prodStack = new TapStack(prodApp4, 'ProdStack4', {
        environmentSuffix: 'prod',
      });
      const prodTemplate = Template.fromStack(prodStack);

      prodTemplate.hasResourceProperties('AWS::Lambda::Function', {
        Environment: {
          Variables: {
            NODE_ENV: 'production',
          },
        },
      });
    });

    test('should disable auto-delete objects in production', () => {
      const prodApp5 = new cdk.App();
      const prodStack = new TapStack(prodApp5, 'ProdStack5', {
        environmentSuffix: 'prod',
      });
      const prodTemplate = Template.fromStack(prodStack);

      const buckets = prodTemplate.findResources('AWS::S3::Bucket', {
        Properties: Match.objectLike({
          Tags: Match.arrayWith([
            {
              Key: 'aws-cdk:auto-delete-objects',
              Value: 'true',
            },
          ]),
        }),
      });

      expect(Object.keys(buckets).length).toBe(0);
    });

    test('should use prod- prefix for production resources', () => {
      const prodApp6 = new cdk.App();
      const prodStack = new TapStack(prodApp6, 'ProdStack6', {
        environmentSuffix: 'prod',
      });
      const prodTemplate = Template.fromStack(prodStack);

      prodTemplate.hasResourceProperties('AWS::Lambda::Function', {
        FunctionName: 'prod-api-handler',
      });

      prodTemplate.hasResourceProperties('AWS::DynamoDB::Table', {
        TableName: 'prod-events-table',
      });
    });

    test('should disable data trace in production for security', () => {
      const prodApp7 = new cdk.App();
      const prodStack = new TapStack(prodApp7, 'ProdStack7', {
        environmentSuffix: 'prod',
      });
      const prodTemplate = Template.fromStack(prodStack);

      prodTemplate.hasResourceProperties('AWS::ApiGateway::Stage', {
        MethodSettings: [
          {
            DataTraceEnabled: false,
            HttpMethod: '*',
            LoggingLevel: 'INFO',
            MetricsEnabled: true,
            ResourcePath: '/*',
          },
        ],
      });
    });
  });
});
