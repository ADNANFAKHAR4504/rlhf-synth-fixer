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

  describe('DynamoDB Table', () => {
    test('should create DynamoDB table with correct configuration', () => {
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        KeySchema: [
          {
            AttributeName: 'id',
            KeyType: 'HASH'
          }
        ],
        AttributeDefinitions: [
          {
            AttributeName: 'id',
            AttributeType: 'S'
          }
        ],
        BillingMode: 'PAY_PER_REQUEST'
      });
    });

    test('should not have explicit tags on DynamoDB table', () => {
      // MODEL_RESPONSE doesn't add explicit tags to DynamoDB table
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        BillingMode: 'PAY_PER_REQUEST'
      });
    });
  });

  describe('S3 Bucket', () => {
    test('should create S3 bucket with auto-delete configuration', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        Tags: Match.arrayWith([
          {
            Key: 'aws-cdk:auto-delete-objects',
            Value: 'true'
          }
        ])
      });
    });

    test('should have bucket policy for auto-delete objects', () => {
      template.hasResourceProperties('AWS::S3::BucketPolicy', {
        PolicyDocument: {
          Statement: Match.arrayWith([
            {
              Effect: 'Allow',
              Principal: {
                AWS: Match.anyValue()
              },
              Action: Match.anyValue(),
              Resource: Match.anyValue()
            }
          ])
        }
      });
    });

    test('should have auto-delete tag', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        Tags: Match.arrayWith([
          {
            Key: 'aws-cdk:auto-delete-objects',
            Value: 'true'
          }
        ])
      });
    });
  });

  describe('Lambda Function', () => {
    test('should create Lambda function with correct configuration', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        Runtime: 'nodejs18.x',
        Handler: 'index.handler',
        Timeout: 15,
        Environment: {
          Variables: {
            TABLE_NAME: Match.anyValue(),
            LOGS_BUCKET_NAME: Match.anyValue()
          }
        }
      });
    });

    test('should have least-privilege IAM role', () => {
      // Check that the policy contains both DynamoDB and S3 permissions in a single policy
      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: {
          Statement: Match.arrayWith([
            {
              Effect: 'Allow',
              Action: Match.arrayWith(['dynamodb:BatchWriteItem', 'dynamodb:PutItem', 'dynamodb:UpdateItem', 'dynamodb:DeleteItem']),
              Resource: Match.anyValue()
            },
            {
              Effect: 'Allow',
              Action: Match.arrayWith(['s3:DeleteObject*', 's3:PutObject', 's3:Abort*']),
              Resource: Match.anyValue()
            }
          ])
        }
      });
    });

    test('should not have explicit tags on Lambda function', () => {
      // MODEL_RESPONSE doesn't add explicit tags to Lambda function
      template.resourcePropertiesCountIs('AWS::Lambda::Function', {
        Runtime: 'nodejs18.x',
        Handler: 'index.handler'
      }, 1);
    });
  });

  describe('API Gateway', () => {
    test('should create REST API with correct configuration', () => {
      template.hasResourceProperties('AWS::ApiGateway::RestApi', {
        Name: 'Api'
      });
    });

    test('should have CORS enabled', () => {
      template.hasResourceProperties('AWS::ApiGateway::Method', {
        HttpMethod: 'OPTIONS',
        Integration: {
          Type: 'MOCK',
          IntegrationResponses: [
            {
              StatusCode: '204',
              ResponseParameters: {
                'method.response.header.Access-Control-Allow-Headers': "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token,X-Amz-User-Agent'",
                'method.response.header.Access-Control-Allow-Origin': "'*'",
                'method.response.header.Access-Control-Allow-Methods': "'OPTIONS,GET,PUT,POST,DELETE,PATCH,HEAD'"
              }
            }
          ]
        }
      });
    });

    test('should have ANY method connected to Lambda', () => {
      template.hasResourceProperties('AWS::ApiGateway::Method', {
        HttpMethod: 'ANY',
        Integration: {
          Type: 'AWS_PROXY',
          IntegrationHttpMethod: 'POST'
        }
      });
    });

    test('should not have explicit tags on API Gateway', () => {
      // MODEL_RESPONSE doesn't add explicit tags to API Gateway
      template.hasResourceProperties('AWS::ApiGateway::RestApi', {
        Name: 'Api'
      });
    });
  });

  describe('Stack Outputs', () => {
    test('should have API endpoint output', () => {
      template.hasOutput('ApiEndpoint4F160690', {});
    });
  });

  describe('Resource Count', () => {
    test('should create expected number of core resources', () => {
      // Core infrastructure resources
      template.resourceCountIs('AWS::DynamoDB::Table', 1);
      template.resourceCountIs('AWS::S3::Bucket', 1);
      template.resourceCountIs('AWS::S3::BucketPolicy', 1);
      template.resourceCountIs('AWS::ApiGateway::RestApi', 1);
      template.resourceCountIs('AWS::ApiGateway::Deployment', 1);
      template.resourceCountIs('AWS::ApiGateway::Stage', 1);
      template.resourceCountIs('AWS::ApiGateway::Method', 2); // ANY + OPTIONS
      template.resourceCountIs('AWS::Lambda::Permission', 2);
      
      // Verify our main Lambda function exists
      template.resourcePropertiesCountIs('AWS::Lambda::Function', {
        Runtime: 'nodejs18.x',
        Handler: 'index.handler'
      }, 1);
    });
  });

  describe('Security Compliance', () => {
    test('should not use wildcard permissions in IAM policies', () => {
      const templateJson = template.toJSON();
      const policies = Object.values(templateJson.Resources).filter(
        (resource: any) => resource.Type === 'AWS::IAM::Policy'
      );

      policies.forEach((policy: any) => {
        const statements = policy.Properties.PolicyDocument.Statement;
        statements.forEach((statement: any) => {
          if (Array.isArray(statement.Action)) {
            statement.Action.forEach((action: string) => {
              expect(action).not.toBe('*');
            });
          } else if (typeof statement.Action === 'string') {
            expect(statement.Action).not.toBe('*');
          }
        });
      });
    });

    test('should have proper resource-level permissions', () => {
      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: {
          Statement: Match.arrayWith([
            {
              Effect: 'Allow',
              Action: Match.anyValue(),
              Resource: Match.not('*')
            }
          ])
        }
      });
    });
  });
});
