import * as cdk from 'aws-cdk-lib';
import { Match, Template } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';
const trustedIpRanges = [
  '0.0.0.0/0'
];

describe('TapStack', () => {
  let app: cdk.App;
  let stack: TapStack;
  let template: Template;

  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();

    app = new cdk.App();
    stack = new TapStack(app, 'TestTapStack', { environmentSuffix, trustedIpRanges });
    template = Template.fromStack(stack);
  });

  describe('Stack Resources Creation', () => {
    test('should create KMS key with proper configuration', () => {
      template.hasResourceProperties('AWS::KMS::Key', {
        Description: `KMS key for ServerlessApp encryption - ${environmentSuffix}`,
        EnableKeyRotation: true,
      });
    });

    test('should create DynamoDB table with environment suffix', () => {
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        TableName: `ServerlessApp-ApplicationState-${environmentSuffix}`,
        AttributeDefinitions: [
          {
            AttributeName: 'id',
            AttributeType: 'S'
          }
        ],
        KeySchema: [
          {
            AttributeName: 'id',
            KeyType: 'HASH'
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

    test('should create IAM role with environment suffix', () => {
      // Check the main Lambda role exists with correct name
      template.hasResourceProperties('AWS::IAM::Role', {
        RoleName: `ServerlessApp-LambdaExecutionRole-${environmentSuffix}`,
        AssumeRolePolicyDocument: {
          Statement: [
            {
              Effect: 'Allow',
              Principal: {
                Service: 'lambda.amazonaws.com'
              },
              Action: 'sts:AssumeRole'
            }
          ],
          Version: '2012-10-17'
        },
        // Check for managed policy ARN (it will be an intrinsic function)
        ManagedPolicyArns: [
          Match.anyValue() // CDK generates this as Fn::Join
        ],
        // Check for inline policies
        Policies: [
          {
            PolicyName: 'DynamoDBAccess',
            PolicyDocument: Match.objectLike({
              Statement: Match.arrayWith([
                Match.objectLike({
                  Effect: 'Allow',
                  Action: Match.arrayWith([
                    'dynamodb:GetItem',
                    'dynamodb:PutItem',
                    'dynamodb:UpdateItem',
                    'dynamodb:DeleteItem',
                    'dynamodb:Query',
                    'dynamodb:Scan'
                  ])
                })
              ])
            })
          },
          {
            PolicyName: 'S3LogsAccess',
            PolicyDocument: Match.objectLike({
              Statement: Match.arrayWith([
                Match.objectLike({
                  Effect: 'Allow',
                  Action: [
                    's3:PutObject',
                    's3:PutObjectAcl'
                  ]
                })
              ])
            })
          },
          {
            PolicyName: 'KMSAccess',
            PolicyDocument: Match.objectLike({
              Statement: Match.arrayWith([
                Match.objectLike({
                  Effect: 'Allow',
                  Action: [
                    'kms:Decrypt',
                    'kms:GenerateDataKey'
                  ]
                })
              ])
            })
          }
        ]
      });
    });

    test('should create API Handler Lambda with environment suffix', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        FunctionName: `ServerlessApp-ApiHandler-${environmentSuffix}`,
        Runtime: 'nodejs18.x',
        Handler: 'index.handler',
        Timeout: 60,
        Environment: {
          Variables: {
            DYNAMODB_TABLE: { Ref: Match.anyValue() }, // CDK reference
            LOGS_BUCKET: { Ref: Match.anyValue() },     // CDK reference
            KMS_KEY_ID: { Ref: Match.anyValue() }       // CDK reference
          }
        },
        KmsKeyArn: { 'Fn::GetAtt': Match.anyValue() } // CDK reference
      });
    });

    test('should create Background Processor Lambda with environment suffix', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        FunctionName: `ServerlessApp-BackgroundProcessor-${environmentSuffix}`,
        Runtime: 'nodejs18.x',
        Handler: 'index.handler',
        Timeout: 60,
        Environment: {
          Variables: {
            DYNAMODB_TABLE: { Ref: Match.anyValue() },
            LOGS_BUCKET: { Ref: Match.anyValue() },
            KMS_KEY_ID: { Ref: Match.anyValue() }
          }
        },
        KmsKeyArn: { 'Fn::GetAtt': Match.anyValue() }
      });
    });

    test('should create API Gateway with environment suffix', () => {
      template.hasResourceProperties('AWS::ApiGateway::RestApi', {
        Name: `ServerlessApp-API-${environmentSuffix}`,
        Description: `Serverless Application API - ${environmentSuffix}`,
        EndpointConfiguration: {
          Types: ['REGIONAL']
        },
        Policy: {
          Statement: [
            {
              Effect: 'Allow',
              Principal: { AWS: '*' }, // CDK formats it this way
              Action: 'execute-api:Invoke',
              Resource: '*',
              Condition: {
                IpAddress: {
                  'aws:SourceIp': [
                    '0.0.0.0/0'
                  ]
                }
              }
            }
          ],
          Version: '2012-10-17'
        }
      });
    });

    test('should create CloudWatch alarms with environment suffix', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        AlarmName: `ServerlessApp-ErrorAlarm-${environmentSuffix}`,
        AlarmDescription: `Lambda function error rate is too high - ${environmentSuffix}`,
        Threshold: 5,
        EvaluationPeriods: 2
      });

      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        AlarmName: `ServerlessApp-DurationAlarm-${environmentSuffix}`,
        AlarmDescription: `Lambda function duration is too high - ${environmentSuffix}`,
        Threshold: 30000,
        EvaluationPeriods: 2
      });
    });
  });

  describe('Resource Tagging', () => {

    test('should apply stack-level tags', () => {
      expect(stack.tags.tagValues()).toEqual(
        expect.objectContaining({
          'Environment': environmentSuffix,
          'Application': 'ServerlessApp',
          'CostCenter': 'Engineering'
        })
      );
    });
  });

  describe('IAM Permissions', () => {
    test('should create proper DynamoDB permissions', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        Policies: Match.arrayWith([
          Match.objectLike({
            PolicyName: 'DynamoDBAccess',
            PolicyDocument: {
              Statement: [
                {
                  Effect: 'Allow',
                  Action: [
                    'dynamodb:GetItem',
                    'dynamodb:PutItem',
                    'dynamodb:UpdateItem',
                    'dynamodb:DeleteItem',
                    'dynamodb:Query',
                    'dynamodb:Scan'
                  ],
                  Resource: Match.anyValue()
                }
              ],
              Version: '2012-10-17'
            }
          })
        ])
      });
    });

    test('should create proper S3 permissions', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        Policies: Match.arrayWith([
          Match.objectLike({
            PolicyName: 'S3LogsAccess',
            PolicyDocument: {
              Statement: [
                {
                  Effect: 'Allow',
                  Action: [
                    's3:PutObject',
                    's3:PutObjectAcl'
                  ],
                  Resource: Match.anyValue()
                }
              ],
              Version: '2012-10-17'
            }
          })
        ])
      });
    });

    test('should create proper KMS permissions', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        Policies: Match.arrayWith([
          Match.objectLike({
            PolicyName: 'KMSAccess',
            PolicyDocument: {
              Statement: [
                {
                  Effect: 'Allow',
                  Action: [
                    'kms:Decrypt',
                    'kms:GenerateDataKey'
                  ],
                  Resource: Match.anyValue()
                }
              ],
              Version: '2012-10-17'
            }
          })
        ])
      });
    });
  });

  describe('API Gateway Configuration', () => {
    test('should create proper API Gateway deployment', () => {
      // Check deployment exists (without StageName as CDK handles it separately)
      template.resourceCountIs('AWS::ApiGateway::Deployment', 1);

      // Check stage exists with correct name
      template.hasResourceProperties('AWS::ApiGateway::Stage', {
        StageName: 'prod'
      });
    });

    test('should create proper API Gateway stage with configuration', () => {
      template.hasResourceProperties('AWS::ApiGateway::Stage', {
        StageName: 'prod',
        MethodSettings: Match.arrayWith([
          Match.objectLike({
            ResourcePath: '/*',
            HttpMethod: '*',
            LoggingLevel: 'INFO',
            DataTraceEnabled: true,
            MetricsEnabled: true
          })
        ])
      });

      // Note: CDK may not generate explicit ThrottleSettings, but uses MethodSettings instead
    });

    test('should create API resources and methods', () => {
      // Health resource
      template.hasResourceProperties('AWS::ApiGateway::Resource', {
        PathPart: 'health'
      });

      // Items resource
      template.hasResourceProperties('AWS::ApiGateway::Resource', {
        PathPart: 'items'
      });

      // Methods
      template.hasResourceProperties('AWS::ApiGateway::Method', {
        HttpMethod: 'GET'
      });

      template.hasResourceProperties('AWS::ApiGateway::Method', {
        HttpMethod: 'POST'
      });
    });

    test('should configure CORS properly', () => {
      // Check for OPTIONS method with MOCK integration (CORS preflight)
      template.hasResourceProperties('AWS::ApiGateway::Method', {
        HttpMethod: 'OPTIONS',
        Integration: {
          Type: 'MOCK',
          IntegrationResponses: [
            {
              StatusCode: '204' // CDK uses 204 for OPTIONS
            }
          ]
        }
      });
    });
  });

  describe('Stack Outputs', () => {
    test('should create outputs with environment suffix in export names', () => {
      template.hasOutput('ApiGatewayUrl', {
        Description: 'API Gateway URL',
        Export: {
          Name: `ServerlessApp-ApiGatewayUrl-${environmentSuffix}`
        }
      });

      template.hasOutput('DynamoDBTableName', {
        Description: 'DynamoDB Table Name',
        Export: {
          Name: `ServerlessApp-DynamoDBTableName-${environmentSuffix}`
        }
      });

      template.hasOutput('S3BucketName', {
        Description: 'S3 Logs Bucket Name',
        Export: {
          Name: `ServerlessApp-S3BucketName-${environmentSuffix}`
        }
      });

      template.hasOutput('KMSKeyId', {
        Description: 'KMS Key ID for encryption',
        Export: {
          Name: `ServerlessApp-KMSKeyId-${environmentSuffix}`
        }
      });
    });
  });

  describe('Environment Suffix Handling', () => {
    test('should handle missing environment suffix by defaulting to dev', () => {
      const appWithoutEnv = new cdk.App();
      const stackWithoutEnv = new TapStack(appWithoutEnv, 'TestTapStackNoEnv', { trustedIpRanges });
      const templateWithoutEnv = Template.fromStack(stackWithoutEnv);

      templateWithoutEnv.hasResourceProperties('AWS::DynamoDB::Table', {
        TableName: 'ServerlessApp-ApplicationState-dev'
      });

      templateWithoutEnv.hasResourceProperties('AWS::Lambda::Function', {
        FunctionName: 'ServerlessApp-ApiHandler-dev'
      });
    });

    test('should use provided environment suffix', () => {
      const customEnv = 'staging';
      const appCustom = new cdk.App();
      const stackCustom = new TapStack(appCustom, 'TestTapStackCustom', {
        environmentSuffix: customEnv,
        trustedIpRanges: trustedIpRanges
      });
      const templateCustom = Template.fromStack(stackCustom);

      templateCustom.hasResourceProperties('AWS::DynamoDB::Table', {
        TableName: `ServerlessApp-ApplicationState-${customEnv}`
      });

      templateCustom.hasResourceProperties('AWS::Lambda::Function', {
        FunctionName: `ServerlessApp-ApiHandler-${customEnv}`
      });
    });
  });

  describe('Resource Count Validation', () => {
    test('should create expected number of resources', () => {
      const resources = template.toJSON().Resources;

      // Count specific resource types
      const lambdaFunctions = Object.values(resources).filter(
        (resource: any) => resource.Type === 'AWS::Lambda::Function'
      );
      const dynamoTables = Object.values(resources).filter(
        (resource: any) => resource.Type === 'AWS::DynamoDB::Table'
      );
      const s3Buckets = Object.values(resources).filter(
        (resource: any) => resource.Type === 'AWS::S3::Bucket'
      );
      const kmsKeys = Object.values(resources).filter(
        (resource: any) => resource.Type === 'AWS::KMS::Key'
      );
      const iamRoles = Object.values(resources).filter(
        (resource: any) => resource.Type === 'AWS::IAM::Role'
      );
      const apiGateways = Object.values(resources).filter(
        (resource: any) => resource.Type === 'AWS::ApiGateway::RestApi'
      );
      const cloudWatchAlarms = Object.values(resources).filter(
        (resource: any) => resource.Type === 'AWS::CloudWatch::Alarm'
      );

      // Our application resources (CDK creates additional helper resources)
      expect(lambdaFunctions.length).toBeGreaterThanOrEqual(2); // At least our 2 functions
      expect(dynamoTables).toHaveLength(1);
      expect(s3Buckets).toHaveLength(1);
      expect(kmsKeys).toHaveLength(1);
      expect(iamRoles.length).toBeGreaterThanOrEqual(1); // At least our main role
      expect(apiGateways).toHaveLength(1);
      expect(cloudWatchAlarms).toHaveLength(2); // Error + Duration alarms

      // Find our specific application functions
      const appFunctions = lambdaFunctions.filter((func: any) =>
        func.Properties?.FunctionName?.includes('ServerlessApp')
      );
      expect(appFunctions).toHaveLength(2); // Exactly our 2 application functions
    });
  });

  describe('Security Configuration', () => {
    test('should configure S3 bucket security properly', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        PublicAccessBlockConfiguration: {
          BlockPublicAcls: true,
          BlockPublicPolicy: true,
          IgnorePublicAcls: true,
          RestrictPublicBuckets: true,
        }
      });
    });

    test('should enable DynamoDB encryption and point-in-time recovery', () => {
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        SSESpecification: {
          SSEEnabled: true
        },
        PointInTimeRecoverySpecification: {
          PointInTimeRecoveryEnabled: true
        }
      });
    });

    test('should enable KMS key rotation', () => {
      template.hasResourceProperties('AWS::KMS::Key', {
        EnableKeyRotation: true
      });
    });

    test('should configure Lambda environment encryption', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        KmsKeyArn: Match.anyValue()
      });
    });
  });
});