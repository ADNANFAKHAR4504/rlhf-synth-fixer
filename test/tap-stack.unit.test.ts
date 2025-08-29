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
        BillingMode: 'PAY_PER_REQUEST',
        SSESpecification: {
          SSEEnabled: true
        },
        PointInTimeRecoverySpecification: {
          PointInTimeRecoveryEnabled: true
        }
      });
    });

    test('should have Environment: Production tag', () => {
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        Tags: Match.arrayWith([
          {
            Key: 'Environment',
            Value: 'Production'
          }
        ])
      });
    });
  });

  describe('S3 Bucket', () => {
    test('should create S3 bucket with security best practices', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        VersioningConfiguration: {
          Status: 'Enabled'
        },
        PublicAccessBlockConfiguration: {
          BlockPublicAcls: true,
          BlockPublicPolicy: true,
          IgnorePublicAcls: true,
          RestrictPublicBuckets: true
        }
      });
    });

    test('should have bucket policy enforcing SSL', () => {
      template.hasResourceProperties('AWS::S3::BucketPolicy', {
        PolicyDocument: {
          Statement: Match.arrayWith([
            {
              Effect: 'Deny',
              Principal: {
                AWS: '*'
              },
              Action: 's3:*',
              Resource: Match.anyValue(),
              Condition: {
                Bool: {
                  'aws:SecureTransport': 'false'
                }
              }
            }
          ])
        }
      });
    });

    test('should have Environment: Production tag', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        Tags: Match.arrayWith([
          {
            Key: 'Environment',
            Value: 'Production'
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

    test('should have Environment: Production tag', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        Tags: Match.arrayWith([
          {
            Key: 'Environment',
            Value: 'Production'
          }
        ])
      });
    });
  });

  describe('API Gateway', () => {
    test('should create REST API with correct configuration', () => {
      template.hasResourceProperties('AWS::ApiGateway::RestApi', {
        Name: `TapApi-${environmentSuffix}`,
        Description: 'API Gateway for Tap Lambda function'
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

    test('should have Environment: Production tag', () => {
      template.hasResourceProperties('AWS::ApiGateway::RestApi', {
        Tags: Match.arrayWith([
          {
            Key: 'Environment',
            Value: 'Production'
          }
        ])
      });
    });
  });

  describe('Stack Outputs', () => {
    test('should have required outputs', () => {
      template.hasOutput('ApiUrl', {
        Description: 'API Gateway URL'
      });

      template.hasOutput('TableName', {
        Description: 'DynamoDB Table Name'
      });

      template.hasOutput('LogsBucketName', {
        Description: 'S3 Logs Bucket Name'
      });
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
