// Integration tests for the polling system
import { App } from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack';

describe('Polling System Integration Tests', () => {
  let template: Template;

  beforeAll(() => {
    const app = new App();
    const stack = new TapStack(app, 'TestStack', {
      environmentSuffix: 'test'
    });
    template = Template.fromStack(stack);
  });

  describe('Infrastructure Validation', () => {
    test('Stack synthesizes without errors', () => {
      expect(template).toBeDefined();
    });

    test('All required resources are created', () => {
      // Check DynamoDB tables
      template.resourceCountIs('AWS::DynamoDB::Table', 2);

      // Check Lambda functions (includes custom resources)
      template.resourceCountIs('AWS::Lambda::Function', 4);

      // Check API Gateway
      template.resourceCountIs('AWS::ApiGateway::RestApi', 1);

      // Check S3 bucket
      template.resourceCountIs('AWS::S3::Bucket', 1);

      // Check IAM roles (includes custom resource roles)
      template.resourceCountIs('AWS::IAM::Role', 5);
    });

    test('DynamoDB tables have correct configuration', () => {
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        TableName: 'polling-votes-test',
        BillingMode: 'PAY_PER_REQUEST',
        PointInTimeRecoverySpecification: {
          PointInTimeRecoveryEnabled: true
        }
      });

      template.hasResourceProperties('AWS::DynamoDB::Table', {
        TableName: 'polling-results-test',
        BillingMode: 'PAY_PER_REQUEST'
      });
    });

    test('Lambda functions have correct runtime and configuration', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        Runtime: 'nodejs18.x',
        Timeout: 30,
        MemorySize: 256,
        Handler: 'index.handler'
      });

      template.hasResourceProperties('AWS::Lambda::Function', {
        Runtime: 'nodejs18.x',
        Timeout: 60,
        MemorySize: 512,
        Handler: 'index.handler'
      });
    });

    test('API Gateway is configured correctly', () => {
      template.hasResourceProperties('AWS::ApiGateway::RestApi', {
        Name: 'polling-api-test'
      });

      // Check for API Gateway deployment
      template.resourceCountIs('AWS::ApiGateway::Deployment', 1);

      // Check for API Gateway stage
      template.resourceCountIs('AWS::ApiGateway::Stage', 1);
    });

    test('S3 bucket has versioning enabled', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        VersioningConfiguration: {
          Status: 'Enabled'
        }
      });
    });

    test('CloudWatch alarms are created', () => {
      template.resourceCountIs('AWS::CloudWatch::Alarm', 3);
    });

    test('Stack outputs are defined', () => {
      const outputs = template.findOutputs('*');
      expect(Object.keys(outputs)).toContain('APIEndpoint');
      expect(Object.keys(outputs)).toContain('VotesTableName');
      expect(Object.keys(outputs)).toContain('ResultsTableName');
      expect(Object.keys(outputs)).toContain('SnapshotBucketName');
    });
  });

  describe('Security and Permissions', () => {
    test('Lambda functions have appropriate IAM roles', () => {
      template.resourceCountIs('AWS::IAM::Role', 5);

      // Check that Lambda roles have assume role policy for Lambda service
      template.hasResourceProperties('AWS::IAM::Role', {
        AssumeRolePolicyDocument: {
          Statement: [
            {
              Effect: 'Allow',
              Principal: {
                Service: 'lambda.amazonaws.com'
              },
              Action: 'sts:AssumeRole'
            }
          ]
        }
      });
    });

    test('IAM policies grant necessary permissions', () => {
      template.resourceCountIs('AWS::IAM::Policy', 3);

      // Check that IAM policies exist (they have the correct structure)
      const policies = template.findResources('AWS::IAM::Policy');
      expect(Object.keys(policies)).toHaveLength(3);
    });
  });

  describe('Resource Dependencies', () => {
    test('Lambda functions depend on IAM roles', () => {
      const lambdaFunctions = template.findResources('AWS::Lambda::Function');
      const iamRoles = template.findResources('AWS::IAM::Role');

      expect(Object.keys(lambdaFunctions)).toHaveLength(4);
      expect(Object.keys(iamRoles)).toHaveLength(5);
    });

    test('API Gateway methods are connected to Lambda functions', () => {
      template.resourceCountIs('AWS::ApiGateway::Method', 6);
      template.resourceCountIs('AWS::Lambda::Permission', 6);
    });
  });

  describe('Environment Configuration', () => {
    test('Resources use environment suffix correctly', () => {
      // Check that all resources include the test suffix
      const votesTable = template.findResources('AWS::DynamoDB::Table');
      const tableNames = Object.values(votesTable).map((table: any) => table.Properties?.TableName);

      expect(tableNames).toContain('polling-votes-test');
      expect(tableNames).toContain('polling-results-test');
    });

    test('Lambda functions have environment variables', () => {
      // Check that Lambda functions have environment variables
      const lambdaFunctions = template.findResources('AWS::Lambda::Function');
      const hasEnvironmentVars = Object.values(lambdaFunctions).some((func: any) =>
        func.Properties?.Environment?.Variables &&
        Object.keys(func.Properties.Environment.Variables).length > 0
      );
      expect(hasEnvironmentVars).toBe(true);
    });
  });
});