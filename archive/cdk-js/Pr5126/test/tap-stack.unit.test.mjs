import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack.mjs';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('TapStack Unit Tests', () => {
  let app;
  let stack;
  let template;

  beforeEach(() => {
    app = new cdk.App();
    stack = new TapStack(app, 'TestTapStack', { 
      environmentSuffix,
      env: {
        account: '123456789012',
        region: 'us-east-1'
      }
    });
    template = Template.fromStack(stack);
  });

  describe('Advanced ML Monitoring and Drift Detection', () => {
    test('should create multiple sophisticated alarms for different failure modes', () => {
      template.resourceCountIs('AWS::CloudWatch::Alarm', 5);
      
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        MetricName: 'ModelLatency',
        ComparisonOperator: 'GreaterThanThreshold',
        Threshold: 500
      });
      
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        MetricName: 'PredictionConfidence',
        ComparisonOperator: 'LessThanThreshold',
        Threshold: 0.7
      });
    });

    test('should create EventBridge rules for comprehensive alerting', () => {
      template.hasResourceProperties('AWS::Events::Rule', {
        EventPattern: {
          source: ['aws.cloudwatch'],
          'detail-type': ['CloudWatch Alarm State Change']
        }
      });
    });
  });

  describe('Environment Suffix Configuration', () => {
    test('should use environmentSuffix from props when provided', () => {
      const testApp = new cdk.App();
      const testStack = new TapStack(testApp, 'TestStack1', {
        environmentSuffix: 'prod',
        env: { account: '123456789012', region: 'us-east-1' }
      });
      const testTemplate = Template.fromStack(testStack);
      
      testTemplate.hasResourceProperties('AWS::CloudWatch::Dashboard', {
        DashboardName: 'FraudDetection-us-east-1-prod'
      });
    });

    test('should use environmentSuffix from context when props not provided', () => {
      const testApp = new cdk.App({
        context: {
          environmentSuffix: 'staging'
        }
      });
      const testStack = new TapStack(testApp, 'TestStack2', {
        env: { account: '123456789012', region: 'us-west-1' }
      });
      const testTemplate = Template.fromStack(testStack);
      
      testTemplate.hasResourceProperties('AWS::CloudWatch::Dashboard', {
        DashboardName: 'FraudDetection-us-west-1-staging'
      });
    });

    test('should default to dev when no environmentSuffix provided', () => {
      const testApp = new cdk.App();
      const testStack = new TapStack(testApp, 'TestStack3', {
        env: { account: '123456789012', region: 'eu-west-1' }
      });
      const testTemplate = Template.fromStack(testStack);
      
      testTemplate.hasResourceProperties('AWS::CloudWatch::Dashboard', {
        DashboardName: 'FraudDetection-eu-west-1-dev'
      });
    });
  });

  describe('ECR Model Repository', () => {
    test('should create ECR repository', () => {
      template.hasResourceProperties('AWS::ECR::Repository', {
        RepositoryName: `fraud-detection-${environmentSuffix}`,
        ImageScanningConfiguration: {
          ScanOnPush: true
        }
      });
    });

    test('should have proper tags', () => {
      template.hasResourceProperties('AWS::ECR::Repository', {
        Tags: Match.arrayWith([
          Match.objectLike({ Key: 'Owner', Value: 'FinTechMLOps' })
        ])
      });
    });
  });

  describe('S3 Model Artifacts Bucket', () => {
    test('should create versioned S3 bucket with encryption', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        VersioningConfiguration: {
          Status: 'Enabled'
        },
        BucketEncryption: {
          ServerSideEncryptionConfiguration: [
            {
              ServerSideEncryptionByDefault: {
                SSEAlgorithm: 'AES256'
              }
            }
          ]
        },
        PublicAccessBlockConfiguration: {
          BlockPublicAcls: true,
          BlockPublicPolicy: true,
          IgnorePublicAcls: true,
          RestrictPublicBuckets: true
        }
      });
    });

    test('should have proper tags', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        Tags: Match.arrayWith([
          Match.objectLike({ Key: 'Owner', Value: 'FinTechMLOps' })
        ])
      });
    });
  });

  describe('DynamoDB Prediction Table', () => {
    test('should create table with correct schema', () => {
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        KeySchema: [
          { AttributeName: 'requestId', KeyType: 'HASH' },
          { AttributeName: 'timestamp', KeyType: 'RANGE' }
        ],
        AttributeDefinitions: Match.arrayWith([
          { AttributeName: 'requestId', AttributeType: 'S' },
          { AttributeName: 'timestamp', AttributeType: 'S' },
          { AttributeName: 'modelVersion', AttributeType: 'S' }
        ]),
        BillingMode: 'PAY_PER_REQUEST'
      });
    });

    test('should have ModelVersionIndex GSI', () => {
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        GlobalSecondaryIndexes: Match.arrayWith([
          {
            IndexName: 'ModelVersionIndex',
            KeySchema: [
              { AttributeName: 'modelVersion', KeyType: 'HASH' },
              { AttributeName: 'timestamp', KeyType: 'RANGE' }
            ],
            Projection: {
              ProjectionType: 'ALL'
            }
          }
        ])
      });
    });

    test('should have CorrelationIdIndex GSI', () => {
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        GlobalSecondaryIndexes: Match.arrayWith([
          {
            IndexName: 'CorrelationIdIndex',
            KeySchema: [
              { AttributeName: 'correlationId', KeyType: 'HASH' },
              { AttributeName: 'timestamp', KeyType: 'RANGE' }
            ],
            Projection: {
              ProjectionType: 'ALL'
            }
          }
        ])
      });
    });

    test('should have DynamoDB attribute definitions for GSIs', () => {
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        AttributeDefinitions: Match.arrayWith([
          { AttributeName: 'requestId', AttributeType: 'S' },
          { AttributeName: 'timestamp', AttributeType: 'S' },
          { AttributeName: 'modelVersion', AttributeType: 'S' },
          { AttributeName: 'correlationId', AttributeType: 'S' }
        ])
      });
    });

    test('should have point-in-time recovery enabled', () => {
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        PointInTimeRecoverySpecification: {
          PointInTimeRecoveryEnabled: true
        }
      });
    });
  });

  describe('SageMaker Infrastructure', () => {
    test('should create SageMaker model', () => {
      template.hasResourceProperties('AWS::SageMaker::Model', {
        PrimaryContainer: Match.objectLike({
          Image: Match.stringLikeRegexp('pytorch-inference'),
          Environment: {
            MODEL_VERSION: '1.0.0'
          }
        })
      });
    });

    test('should create endpoint configuration', () => {
      template.hasResourceProperties('AWS::SageMaker::EndpointConfig', {
        ProductionVariants: [
          {
            InitialInstanceCount: 2,
            InstanceType: 'ml.t2.medium',
            VariantName: 'AllTraffic',
            InitialVariantWeight: 1
          }
        ]
      });
    });

    test('should enable data capture', () => {
      template.hasResourceProperties('AWS::SageMaker::EndpointConfig', {
        DataCaptureConfig: {
          EnableCapture: true,
          InitialSamplingPercentage: 20,
          CaptureOptions: [
            { CaptureMode: 'Input' },
            { CaptureMode: 'Output' }
          ]
        }
      });
    });

    test('should create SageMaker endpoint', () => {
      template.resourceCountIs('AWS::SageMaker::Endpoint', 1);
    });
  });

  describe('Lambda Function', () => {
    test('should create preprocessing Lambda', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        Runtime: 'nodejs20.x',
        Handler: 'index.handler',
        Timeout: 30,
        MemorySize: 1024
      });
    });

    test('should have environment variables', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        Environment: {
          Variables: {
            ENDPOINT_NAME: Match.anyValue(),
            PREDICTION_TABLE: Match.anyValue()
          }
        }
      });
    });
  });

  describe('API Gateway', () => {
    test('should create REST API', () => {
      template.hasResourceProperties('AWS::ApiGateway::RestApi', {
        EndpointConfiguration: {
          Types: ['REGIONAL']
        }
      });
    });

    test('should create POST method with API key requirement', () => {
      template.hasResourceProperties('AWS::ApiGateway::Method', {
        HttpMethod: 'POST',
        ApiKeyRequired: true
      });
    });

    test('should create API key', () => {
      template.resourceCountIs('AWS::ApiGateway::ApiKey', 1);
    });

    test('should create usage plan with quotas', () => {
      template.hasResourceProperties('AWS::ApiGateway::UsagePlan', {
        Throttle: {
          RateLimit: 10,
          BurstLimit: 20
        },
        Quota: {
          Limit: 500000,
          Period: 'DAY'
        }
      });
    });
  });

  describe('CloudWatch Monitoring', () => {
    test('should create CloudWatch dashboard', () => {
      template.resourceCountIs('AWS::CloudWatch::Dashboard', 1);
    });

    test('should create latency alarm', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        ComparisonOperator: 'GreaterThanThreshold',
        EvaluationPeriods: 3,
        Threshold: 500
      });
    });

    test('should create drift alarm', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        ComparisonOperator: 'LessThanThreshold',
        EvaluationPeriods: 24,
        Threshold: 0.7
      });
    });
  });

  describe('EventBridge', () => {
    test('should create EventBridge rule for drift events', () => {
      template.hasResourceProperties('AWS::Events::Rule', {
        EventPattern: {
          source: ['aws.cloudwatch'],
          'detail-type': ['CloudWatch Alarm State Change']
        }
      });
    });
  });

  describe('SNS Topics', () => {
    test('should create alert topic', () => {
      template.hasResourceProperties('AWS::SNS::Topic', {
        DisplayName: `Fraud Model Alerts (${environmentSuffix})`,
        TopicName: `fraud-alerts-${environmentSuffix}`
      });
    });
  });

  describe('IAM Roles and Policies', () => {
    test('should create SageMaker execution role', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        AssumeRolePolicyDocument: {
          Statement: [
            {
              Action: 'sts:AssumeRole',
              Effect: 'Allow',
              Principal: {
                Service: 'sagemaker.amazonaws.com'
              }
            }
          ]
        }
      });
    });

    test('SageMaker should have ECR pull permissions', () => {
      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Action: 'ecr:GetAuthorizationToken',
              Effect: 'Allow',
              Resource: '*'
            }),
            Match.objectLike({
              Action: Match.arrayWith([
                'ecr:BatchCheckLayerAvailability',
                'ecr:GetDownloadUrlForLayer',
                'ecr:BatchGetImage'
              ]),
              Effect: 'Allow'
            })
          ])
        }
      });
    });

    test('should create Lambda execution role', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        AssumeRolePolicyDocument: {
          Statement: [
            {
              Action: 'sts:AssumeRole',
              Effect: 'Allow',
              Principal: {
                Service: 'lambda.amazonaws.com'
              }
            }
          ]
        }
      });
    });

    test('Lambda should have SageMaker invoke permissions', () => {
      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Action: 'sagemaker:InvokeEndpoint',
              Effect: 'Allow'
            })
          ])
        }
      });
    });

    test('Lambda should have DynamoDB write permissions', () => {
      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Action: Match.arrayWith(['dynamodb:PutItem']),
              Effect: 'Allow'
            })
          ])
        }
      });
    });

    test('Lambda should have CloudWatch permissions', () => {
      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Action: Match.arrayWith([
                'logs:CreateLogGroup',
                'logs:CreateLogStream',
                'logs:PutLogEvents',
                'cloudwatch:PutMetricData'
              ]),
              Effect: 'Allow'
            })
          ])
        }
      });
    });
  });

  describe('Stack Outputs', () => {
    test('should export API endpoint', () => {
      template.hasOutput('ApiEndpoint', {
        Description: 'Fraud Detection API endpoint URL'
      });
    });

    test('should export SageMaker endpoint name', () => {
      template.hasOutput('SageMakerEndpoint', {
        Description: 'SageMaker endpoint name'
      });
    });

    test('should export model bucket name', () => {
      template.hasOutput('ModelBucketName', {
        Description: 'S3 bucket for model artifacts'
      });
    });

    test('should export prediction table name', () => {
      template.hasOutput('PredictionTableName', {
        Description: 'DynamoDB table for prediction records'
      });
    });

    test('should export API key ID', () => {
      template.hasOutput('ApiKeyId', {
        Description: 'API Gateway API Key ID'
      });
    });

    test('should export model repository URI', () => {
      template.hasOutput('ModelRepositoryUri', {
        Description: 'ECR repository URI for fraud detection model container'
      });
    });
  });

  describe('Resource Tagging', () => {
    test('all resources should have required tags', () => {
      const resources = template.findResources('AWS::S3::Bucket');
      const bucketKeys = Object.keys(resources);
      
      expect(bucketKeys.length).toBeGreaterThan(0);
      
      template.hasResourceProperties('AWS::S3::Bucket', {
        Tags: Match.arrayWith([
          Match.objectLike({ Key: 'Owner', Value: 'FinTechMLOps' })
        ])
      });
    });
  });

  describe('Security Configuration', () => {
    test('S3 bucket should enforce SSL', () => {
      template.hasResourceProperties('AWS::S3::BucketPolicy', {
        PolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Action: 's3:*',
              Condition: {
                Bool: {
                  'aws:SecureTransport': 'false'
                }
              },
              Effect: 'Deny'
            })
          ])
        }
      });
    });

    test('DynamoDB should use encryption', () => {
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        SSESpecification: {
          SSEEnabled: true
        }
      });
    });
  });

  describe('Security Hub Configuration', () => {
    test('should create Security Hub enablement Lambda function', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        Runtime: 'python3.12',
        Handler: 'index.handler',
        Timeout: 120
      });
    });

    test('Security Hub Lambda should have required permissions', () => {
      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Action: Match.arrayWith([
                'securityhub:DescribeHub',
                'securityhub:EnableSecurityHub',
                'securityhub:GetFindings',
                'securityhub:ListEnabledProductsForImport',
                'securityhub:BatchEnableStandards',
                'securityhub:GetEnabledStandards',
                'securityhub:TagResource'
              ]),
              Effect: 'Allow',
              Resource: '*'
            })
          ])
        }
      });
    });

    test('should create Security Hub custom resource', () => {
      const resources = template.findResources('AWS::CloudFormation::CustomResource');
      const securityHubResources = Object.values(resources).filter(r => 
        r.Properties?.Region !== undefined
      );
      expect(securityHubResources.length).toBeGreaterThan(0);
    });

    test('Security Hub Lambda code should check if already enabled', () => {
      const resources = template.findResources('AWS::Lambda::Function');
      const securityHubFunctions = Object.values(resources).filter(r => 
        r.Properties?.Code?.ZipFile?.includes('describe_hub')
      );
      expect(securityHubFunctions.length).toBeGreaterThan(0);
    });

    test('Security Hub Lambda code should enable PCI-DSS standard', () => {
      const resources = template.findResources('AWS::Lambda::Function');
      const securityHubFunctions = Object.values(resources).filter(r => 
        r.Properties?.Code?.ZipFile?.includes('pci-dss')
      );
      expect(securityHubFunctions.length).toBeGreaterThan(0);
    });

    test('Security Hub Lambda code should enable AWS Foundational Security Best Practices', () => {
      const resources = template.findResources('AWS::Lambda::Function');
      const securityHubFunctions = Object.values(resources).filter(r => 
        r.Properties?.Code?.ZipFile?.includes('aws-foundational-security-best-practices')
      );
      expect(securityHubFunctions.length).toBeGreaterThan(0);
    });

    test('Security Hub Lambda should handle already enabled scenarios', () => {
      const resources = template.findResources('AWS::Lambda::Function');
      const securityHubFunctions = Object.values(resources).filter(r => 
        r.Properties?.Code?.ZipFile?.includes('already exists') || 
        r.Properties?.Code?.ZipFile?.includes('already subscribed')
      );
      expect(securityHubFunctions.length).toBeGreaterThan(0);
    });
  });

  describe('API Gateway Request Validation and CORS', () => {
    test('should create request validator', () => {
      template.hasResourceProperties('AWS::ApiGateway::RequestValidator', {
        ValidateRequestBody: true,
        ValidateRequestParameters: true
      });
    });

    test('should create request model for predictions', () => {
      template.hasResourceProperties('AWS::ApiGateway::Model', {
        ContentType: 'application/json',
        Name: 'PredictionRequest'
      });
    });

    test('should have CORS configured in API Gateway', () => {
      // CORS is configured via defaultCorsPreflightOptions
      // CDK automatically creates OPTIONS method for CORS
      const resources = template.findResources('AWS::ApiGateway::Method');
      const optionsMethods = Object.values(resources).filter(r => 
        r.Properties?.HttpMethod === 'OPTIONS'
      );
      expect(optionsMethods.length).toBeGreaterThan(0);
    });

    test('POST method should use request validator', () => {
      template.hasResourceProperties('AWS::ApiGateway::Method', {
        HttpMethod: 'POST',
        RequestValidatorId: Match.anyValue()
      });
    });
  });

  describe('Lambda Structured Logging and Correlation IDs', () => {
    test('Lambda should support correlation ID tracking', () => {
      const resources = template.findResources('AWS::Lambda::Function');
      const lambdaFunctions = Object.values(resources).filter(r => 
        r.Properties?.Code?.ZipFile?.includes('correlationId')
      );
      expect(lambdaFunctions.length).toBeGreaterThan(0);
    });

    test('Lambda should use structured logging', () => {
      const resources = template.findResources('AWS::Lambda::Function');
      const lambdaFunctions = Object.values(resources).filter(r => 
        r.Properties?.Code?.ZipFile?.includes('JSON.stringify') &&
        r.Properties?.Code?.ZipFile?.includes('level')
      );
      expect(lambdaFunctions.length).toBeGreaterThan(0);
    });

    test('Lambda should log request processing stages', () => {
      const resources = template.findResources('AWS::Lambda::Function');
      const lambdaFunctions = Object.values(resources).filter(r => 
        r.Properties?.Code?.ZipFile?.includes('Processing fraud detection request') &&
        r.Properties?.Code?.ZipFile?.includes('Request processed successfully')
      );
      expect(lambdaFunctions.length).toBeGreaterThan(0);
    });

    test('Lambda error responses should include correlation ID', () => {
      const resources = template.findResources('AWS::Lambda::Function');
      const lambdaFunctions = Object.values(resources).filter(r => 
        r.Properties?.Code?.ZipFile?.includes('X-Correlation-ID')
      );
      expect(lambdaFunctions.length).toBeGreaterThan(0);
    });
  });

  describe('DynamoDB Correlation ID Index', () => {
    test('should have CorrelationIdIndex GSI', () => {
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        GlobalSecondaryIndexes: Match.arrayWith([
          {
            IndexName: 'CorrelationIdIndex',
            KeySchema: [
              { AttributeName: 'correlationId', KeyType: 'HASH' },
              { AttributeName: 'timestamp', KeyType: 'RANGE' }
            ],
            Projection: {
              ProjectionType: 'ALL'
            }
          }
        ])
      });
    });

    test('should have DynamoDB streams enabled', () => {
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        StreamSpecification: {
          StreamViewType: 'NEW_AND_OLD_IMAGES'
        }
      });
    });
  });

  describe('Resource Naming with Environment Suffix', () => {
    test('ECR repository should include environmentSuffix', () => {
      template.hasResourceProperties('AWS::ECR::Repository', {
        RepositoryName: `fraud-detection-${environmentSuffix}`
      });
    });

    test('S3 bucket should include environmentSuffix', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketName: Match.stringLikeRegexp(`fraud-model-artifacts-${environmentSuffix}-.*`)
      });
    });

    test('DynamoDB table should include environmentSuffix', () => {
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        TableName: `fraud-predictions-${environmentSuffix}`
      });
    });

    test('SNS topic should include environmentSuffix', () => {
      template.hasResourceProperties('AWS::SNS::Topic', {
        TopicName: `fraud-alerts-${environmentSuffix}`
      });
    });

    test('SageMaker model should include environmentSuffix', () => {
      template.hasResourceProperties('AWS::SageMaker::Model', {
        ModelName: `fraud-model-${environmentSuffix}`
      });
    });

    test('SageMaker endpoint should include environmentSuffix', () => {
      template.hasResourceProperties('AWS::SageMaker::Endpoint', {
        EndpointName: `fraud-endpoint-${environmentSuffix}`
      });
    });

    test('API Gateway should include environmentSuffix', () => {
      template.hasResourceProperties('AWS::ApiGateway::RestApi', {
        Name: `fraud-detection-api-${environmentSuffix}`
      });
    });
  });

  describe('CloudWatch Custom Metrics', () => {
    test('Lambda should emit FeatureMagnitude metric', () => {
      const resources = template.findResources('AWS::Lambda::Function');
      const lambdaFunctions = Object.values(resources).filter(r => 
        r.Properties?.Code?.ZipFile?.includes('FeatureMagnitude')
      );
      expect(lambdaFunctions.length).toBeGreaterThan(0);
    });

    test('Lambda should emit AnomalyDetections metric', () => {
      const resources = template.findResources('AWS::Lambda::Function');
      const lambdaFunctions = Object.values(resources).filter(r => 
        r.Properties?.Code?.ZipFile?.includes('AnomalyDetections')
      );
      expect(lambdaFunctions.length).toBeGreaterThan(0);
    });

    test('Lambda should emit HighRiskPredictions metric', () => {
      const resources = template.findResources('AWS::Lambda::Function');
      const lambdaFunctions = Object.values(resources).filter(r => 
        r.Properties?.Code?.ZipFile?.includes('HighRiskPredictions')
      );
      expect(lambdaFunctions.length).toBeGreaterThan(0);
    });

    test('Lambda should emit error metrics on failure', () => {
      const resources = template.findResources('AWS::Lambda::Function');
      const lambdaFunctions = Object.values(resources).filter(r => 
        r.Properties?.Code?.ZipFile?.includes('ProcessingErrors') &&
        r.Properties?.Code?.ZipFile?.includes('ErrorRate')
      );
      expect(lambdaFunctions.length).toBeGreaterThan(0);
    });
  });

  describe('Environment Tags', () => {
    test('SageMaker model should have Environment tag', () => {
      template.hasResourceProperties('AWS::SageMaker::Model', {
        Tags: Match.arrayWith([
          Match.objectLike({ Key: 'Environment', Value: environmentSuffix })
        ])
      });
    });

    test('SageMaker endpoint should have Environment tag', () => {
      template.hasResourceProperties('AWS::SageMaker::Endpoint', {
        Tags: Match.arrayWith([
          Match.objectLike({ Key: 'Environment', Value: environmentSuffix })
        ])
      });
    });

    test('SageMaker endpoint config should have Environment tag', () => {
      template.hasResourceProperties('AWS::SageMaker::EndpointConfig', {
        Tags: Match.arrayWith([
          Match.objectLike({ Key: 'Environment', Value: environmentSuffix })
        ])
      });
    });
  });
});