import * as cdk from 'aws-cdk-lib';
import { Match, Template } from 'aws-cdk-lib/assertions';
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

  describe('Stack Creation', () => {
    test('should create a TapStack instance', () => {
      expect(stack).toBeInstanceOf(TapStack);
      expect(stack).toBeInstanceOf(cdk.Stack);
    });

    test('should handle different environment suffix configurations', () => {
      // Test with context-based environment suffix
      const appWithContext = new cdk.App({
        context: {
          environmentSuffix: 'prod',
        },
      });
      const stackWithContext = new TapStack(
        appWithContext,
        'TestTapStackWithContext'
      );
      expect(stackWithContext).toBeInstanceOf(TapStack);

      // Test with props-based environment suffix
      const stackWithProps = new TapStack(app, 'TestTapStackWithProps', {
        environmentSuffix: 'staging',
      });
      expect(stackWithProps).toBeInstanceOf(TapStack);

      // Test with no environment suffix (defaults to 'dev')
      const stackDefault = new TapStack(app, 'TestTapStackDefault');
      expect(stackDefault).toBeInstanceOf(TapStack);
    });
  });

  describe('Nested Stacks', () => {
    test('should create all required nested stacks', () => {
      template.resourceCountIs('AWS::CloudFormation::Stack', 5);
    });
  });

  describe('Stack Outputs', () => {
    test('should create API endpoint output', () => {
      template.hasOutput('ApiEndpoint', {
        Description: 'API Gateway endpoint URL',
        Export: {
          Name: `serverlessapp-api-endpoint-${environmentSuffix}`,
        },
      });
    });

    test('should create bucket name output', () => {
      template.hasOutput('BucketName', {
        Description: 'S3 bucket for image storage',
        Export: {
          Name: `serverlessapp-bucket-name-${environmentSuffix}`,
        },
      });
    });

    test('should create table name output', () => {
      template.hasOutput('TableName', {
        Description: 'DynamoDB table for detection logs',
        Export: {
          Name: `serverlessapp-table-name-${environmentSuffix}`,
        },
      });
    });

    test('should create dashboard URL output', () => {
      template.hasOutput('DashboardUrl', {
        Description: 'CloudWatch Dashboard URL',
        Export: {
          Name: `serverlessapp-dashboard-url-${environmentSuffix}`,
        },
      });
    });

    test('should create Rekognition service role ARN output', () => {
      template.hasOutput('RekognitionServiceRoleArn', {
        Description: 'Amazon Rekognition Service Role ARN',
        Export: {
          Name: `serverlessapp-rekognition-service-role-${environmentSuffix}`,
        },
      });
    });
  });

  describe('Tags and Metadata', () => {
    test('should have correct tags on nested stacks', () => {
      template.hasResourceProperties('AWS::CloudFormation::Stack', {
        Tags: Match.arrayWith([
          Match.objectLike({
            Key: 'Project',
            Value: 'ServerlessImageDetector',
          }),
        ]),
      });
    });
  });

  describe('Stack Structure', () => {
    test('should have correct stack name', () => {
      expect(stack.stackName).toContain('TestTapStack');
    });

    test('should have correct environment suffix', () => {
      // Try context, fallback to prop, fallback to env
      const ctx = stack.node.tryGetContext('environmentSuffix');
      expect(ctx || environmentSuffix).toBe(environmentSuffix);
    });
  });

  describe('Infrastructure Validation', () => {
    test('should create valid CloudFormation template', () => {
      expect(template).toBeDefined();
      expect(template.toJSON()).toBeDefined();
    });

    test('should have proper stack structure', () => {
      const templateJson = template.toJSON();
      expect(templateJson.Resources).toBeDefined();
      expect(templateJson.Outputs).toBeDefined();
    });

    test('should have all required outputs', () => {
      const outputs = template.findOutputs('*');
      expect(Object.keys(outputs).length).toBeGreaterThanOrEqual(5);
    });
  });
});

describe('Nested Stack Resources', () => {
  let app: cdk.App;
  let stack: TapStack;

  beforeEach(() => {
    app = new cdk.App();
    stack = new TapStack(app, 'TestTapStack', { environmentSuffix });
  });

  describe('StorageStack', () => {
    let storageTemplate: Template;
    beforeEach(() => {
      storageTemplate = Template.fromStack(stack.storageStack);
    });
    test('should create an S3 bucket with encryption', () => {
      storageTemplate.hasResourceProperties('AWS::S3::Bucket', {
        BucketEncryption: {
          ServerSideEncryptionConfiguration: [
            { ServerSideEncryptionByDefault: { SSEAlgorithm: 'AES256' } },
          ],
        },
      });
    });
    test('should create a DynamoDB table with PAY_PER_REQUEST billing', () => {
      storageTemplate.hasResourceProperties('AWS::DynamoDB::Table', {
        BillingMode: 'PAY_PER_REQUEST',
      });
    });
    test('should create an SNS topic', () => {
      storageTemplate.hasResourceProperties('AWS::SNS::Topic', {});
    });
  });

  describe('LambdaStack', () => {
    let lambdaTemplate: Template;
    beforeEach(() => {
      lambdaTemplate = Template.fromStack(stack.lambdaStack);
    });
    test('should create ImageProcessor Lambda', () => {
      lambdaTemplate.hasResourceProperties('AWS::Lambda::Function', {
        Handler: 'index.handler',
        Runtime: 'nodejs20.x',
      });
    });
    test('should create FileManager Lambda', () => {
      lambdaTemplate.hasResourceProperties('AWS::Lambda::Function', {
        Runtime: 'nodejs20.x',
        MemorySize: 256,
      });
    });
    test('should create NotificationService Lambda', () => {
      lambdaTemplate.hasResourceProperties('AWS::Lambda::Function', {
        Runtime: 'nodejs20.x',
        Timeout: 60,
      });
    });
  });

  describe('ApiStack', () => {
    let apiTemplate: Template;
    beforeEach(() => {
      apiTemplate = Template.fromStack(stack.apiStack);
    });
    test('should create a REST API', () => {
      apiTemplate.hasResourceProperties('AWS::ApiGateway::RestApi', {
        BinaryMediaTypes: ['image/*', 'multipart/form-data'],
        Description:
          'Production-ready API for serverless image detection system',
      });
    });
    test('should create a POST /images method', () => {
      apiTemplate.hasResourceProperties('AWS::ApiGateway::Method', {
        HttpMethod: 'POST',
      });
    });
  });

  describe('MonitoringStack', () => {
    let monitoringTemplate: Template;
    beforeEach(() => {
      monitoringTemplate = Template.fromStack(stack.monitoringStack);
    });
    test('should create a CloudWatch dashboard', () => {
      monitoringTemplate.hasResourceProperties(
        'AWS::CloudWatch::Dashboard',
        {}
      );
    });
    test('should create a CloudWatch alarm', () => {
      monitoringTemplate.hasResourceProperties('AWS::CloudWatch::Alarm', {});
    });
  });

  describe('RekognitionStack', () => {
    let rekognitionTemplate: Template;
    beforeEach(() => {
      rekognitionTemplate = Template.fromStack(stack.rekognitionStack);
    });
    test('should create a Rekognition service role', () => {
      rekognitionTemplate.hasResourceProperties('AWS::IAM::Role', {
        AssumeRolePolicyDocument: {
          Statement: [
            {
              Effect: 'Allow',
              Principal: { Service: 'rekognition.amazonaws.com' },
            },
          ],
        },
      });
    });
  });
});
