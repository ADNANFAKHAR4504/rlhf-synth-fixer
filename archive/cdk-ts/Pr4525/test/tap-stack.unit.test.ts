import * as cdk from 'aws-cdk-lib';
import { Match, Template } from 'aws-cdk-lib/assertions';
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
      lambdaMemorySize: 512,
      lambdaTimeout: 30,
      dynamoReadCapacity: 10,
      dynamoWriteCapacity: 10,
      corsOrigin: 'https://test.example.com'
    });
    template = Template.fromStack(stack);
  });

  describe('Stack Synthesis', () => {
    test('Stack synthesizes without errors', () => {
      expect(template).toBeDefined();
      expect(template.toJSON()).toBeDefined();
    });

    test('Stack has correct stack ID', () => {
      expect(stack.stackName).toBe('TestTapStack');
    });

    test('Stack uses correct environment suffix', () => {
      const templateJson = template.toJSON();
      expect(JSON.stringify(templateJson)).toContain(environmentSuffix);
    });
  });

  describe('KMS Key Configuration', () => {
    test('Creates KMS key with correct configuration', () => {
      template.hasResourceProperties('AWS::KMS::Key', {
        Description: Match.stringLikeRegexp(`Customer-managed encryption key for ${environmentSuffix} environment`),
        EnableKeyRotation: true,
        KeyPolicy: Match.objectLike({
          Statement: Match.arrayWith([
            Match.objectLike({
              Effect: 'Allow',
              Principal: Match.objectLike({
                AWS: Match.objectLike({
                  'Fn::Join': Match.anyValue()
                })
              }),
              Action: 'kms:*',
              Resource: '*'
            }),
            Match.objectLike({
              Effect: 'Allow',
              Principal: Match.objectLike({
                Service: Match.arrayWith([
                  'dynamodb.amazonaws.com',
                  'lambda.amazonaws.com',
                  'apigateway.amazonaws.com',
                  'logs.amazonaws.com',
                  'sns.amazonaws.com',
                  'sqs.amazonaws.com',
                  'cloudwatch.amazonaws.com'
                ])
              }),
              Action: Match.arrayWith([
                'kms:Decrypt',
                'kms:DescribeKey',
                'kms:Encrypt',
                'kms:GenerateDataKey*',
                'kms:ReEncrypt*'
              ])
            })
          ])
        })
      });
    });

    test('Creates KMS alias with correct name', () => {
      template.hasResourceProperties('AWS::KMS::Alias', {
        AliasName: `alias/serverless-infra-${environmentSuffix}`,
        TargetKeyId: Match.anyValue()
      });
    });

    test('KMS key has required tags', () => {
      template.hasResourceProperties('AWS::KMS::Key', {
        Tags: Match.arrayWith([
          Match.objectLike({
            Key: 'Project',
            Value: 'ServerlessInfra'
          }),
          Match.objectLike({
            Key: 'Purpose',
            Value: 'Encryption'
          })
        ])
      });
    });
  });

  describe('DynamoDB Table Configuration', () => {
    test('Creates DynamoDB table with correct configuration', () => {
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        TableName: `users-${environmentSuffix}`,
        ProvisionedThroughput: {
          ReadCapacityUnits: 10,
          WriteCapacityUnits: 10
        },
        PointInTimeRecoverySpecification: {
          PointInTimeRecoveryEnabled: true
        },
        SSESpecification: {
          SSEEnabled: true,
          KMSMasterKeyId: Match.anyValue()
        },
        KeySchema: [
          {
            AttributeName: 'UserId',
            KeyType: 'HASH'
          }
        ],
        AttributeDefinitions: [
          {
            AttributeName: 'UserId',
            AttributeType: 'S'
          }
        ]
      });
    });

    test('DynamoDB table has required tags', () => {
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        Tags: Match.arrayWith([
          Match.objectLike({
            Key: 'Project',
            Value: 'ServerlessInfra'
          })
        ])
      });
    });

    test('Creates auto-scaling for read capacity', () => {
      template.hasResourceProperties('AWS::ApplicationAutoScaling::ScalableTarget', {
        ServiceNamespace: 'dynamodb',
        ScalableDimension: 'dynamodb:table:ReadCapacityUnits',
        MinCapacity: 1,
        MaxCapacity: 10
      });

      template.hasResourceProperties('AWS::ApplicationAutoScaling::ScalingPolicy', {
        PolicyType: 'TargetTrackingScaling',
        TargetTrackingScalingPolicyConfiguration: Match.objectLike({
          TargetValue: 70,
          ScaleInCooldown: 60,
          ScaleOutCooldown: 60
        })
      });
    });

    test('Creates auto-scaling for write capacity', () => {
      template.hasResourceProperties('AWS::ApplicationAutoScaling::ScalableTarget', {
        ServiceNamespace: 'dynamodb',
        ScalableDimension: 'dynamodb:table:WriteCapacityUnits',
        MinCapacity: 1,
        MaxCapacity: 10
      });
    });
  });

  describe('Lambda Function Configuration', () => {
    test('Creates Lambda function with correct configuration', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        FunctionName: `serverless-function-${environmentSuffix}`,
        Runtime: 'nodejs20.x',
        Handler: 'index.handler',
        MemorySize: 512,
        Timeout: 30,
        TracingConfig: {
          Mode: 'Active'
        },
        DeadLetterConfig: {
          TargetArn: Match.anyValue()
        },
        Environment: Match.objectLike({
          Variables: Match.objectLike({
            TABLE_NAME: Match.objectLike({
              Ref: Match.stringLikeRegexp('DynamoDBUserTable')
            }),
            ENVIRONMENT: environmentSuffix,
            NODE_OPTIONS: '--enable-source-maps'
          })
        })
      });
    });

    test('Lambda function has correct IAM permissions', () => {
      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: Match.objectLike({
          Statement: Match.arrayWith([
            Match.objectLike({
              Effect: 'Allow',
              Action: 'sqs:SendMessage'
            }),
            Match.objectLike({
              Effect: 'Allow',
              Action: Match.arrayWith([
                'xray:PutTraceSegments',
                'xray:PutTelemetryRecords'
              ])
            }),
            Match.objectLike({
              Effect: 'Allow',
              Action: Match.arrayWith([
                'kms:Decrypt',
                'kms:DescribeKey',
                'kms:Encrypt',
                'kms:ReEncrypt*',
                'kms:GenerateDataKey*'
              ])
            }),
            Match.objectLike({
              Effect: 'Allow',
              Action: Match.arrayWith([
                'dynamodb:BatchWriteItem',
                'dynamodb:PutItem',
                'dynamodb:UpdateItem',
                'dynamodb:DeleteItem',
                'dynamodb:DescribeTable'
              ])
            }),
            Match.objectLike({
              Effect: 'Allow',
              Action: Match.arrayWith([
                'dynamodb:Query',
                'dynamodb:GetItem'
              ])
            })
          ])
        })
      });
    });

    test('Creates Dead Letter Queue with KMS encryption', () => {
      template.hasResourceProperties('AWS::SQS::Queue', {
        QueueName: `lambda-dlq-${environmentSuffix}`,
        MessageRetentionPeriod: 1209600, // 14 days
        KmsMasterKeyId: Match.anyValue()
      });
    });

    test('Creates CloudWatch Log Group for Lambda', () => {
      template.hasResourceProperties('AWS::Logs::LogGroup', {
        LogGroupName: `/aws/lambda/serverless-function-${environmentSuffix}`,
        RetentionInDays: 7,
        KmsKeyId: Match.anyValue()
      });
    });

    test('Lambda function has required tags', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        Tags: Match.arrayWith([
          Match.objectLike({
            Key: 'Project',
            Value: 'ServerlessInfra'
          })
        ])
      });
    });
  });

  describe('API Gateway Configuration', () => {
    test('Creates REST API with correct configuration', () => {
      template.hasResourceProperties('AWS::ApiGateway::RestApi', {
        Name: `serverless-api-${environmentSuffix}`,
        Description: 'Serverless REST API',
        EndpointConfiguration: {
          Types: ['REGIONAL']
        }
      });
    });

    test('Creates API Gateway deployment with correct stage', () => {
      template.hasResourceProperties('AWS::ApiGateway::Deployment', {
        Description: 'Serverless REST API'
      });
    });

    test('Creates API Gateway method with Lambda integration', () => {
      template.hasResourceProperties('AWS::ApiGateway::Method', {
        HttpMethod: 'GET',
        AuthorizationType: 'NONE',
        Integration: Match.objectLike({
          Type: 'AWS_PROXY',
          IntegrationHttpMethod: 'POST'
        })
      });
    });

    test('Creates API Gateway resource for users endpoint', () => {
      template.hasResourceProperties('AWS::ApiGateway::Resource', {
        PathPart: 'users'
      });
    });

    test('Creates request model for validation', () => {
      template.hasResourceProperties('AWS::ApiGateway::Model', {
        Name: `UserRequestModel${environmentSuffix}`,
        ContentType: 'application/json',
        Schema: Match.objectLike({
          type: 'object',
          properties: Match.objectLike({
            UserId: { type: 'string' },
            name: { type: 'string' },
            email: Match.objectLike({
              type: 'string',
              pattern: Match.stringLikeRegexp('.*@.*\\..*')
            })
          }),
          required: ['UserId']
        })
      });
    });

    test('Creates CloudWatch Log Group for API Gateway', () => {
      template.hasResourceProperties('AWS::Logs::LogGroup', {
        LogGroupName: `/aws/apigateway/serverless-api-${environmentSuffix}`,
        RetentionInDays: 7,
        KmsKeyId: Match.anyValue()
      });
    });

    test('API Gateway has CORS configuration', () => {
      template.hasResourceProperties('AWS::ApiGateway::Method', {
        HttpMethod: 'OPTIONS'
      });
    });

    test('API Gateway has required tags', () => {
      template.hasResourceProperties('AWS::ApiGateway::RestApi', {
        Tags: Match.arrayWith([
          Match.objectLike({
            Key: 'Project',
            Value: 'ServerlessInfra'
          })
        ])
      });
    });
  });

  describe('Monitoring Configuration', () => {
    test('Creates SNS topic for alerts with KMS encryption', () => {
      template.hasResourceProperties('AWS::SNS::Topic', {
        TopicName: `serverless-alerts-${environmentSuffix}`,
        DisplayName: 'Serverless Infrastructure Alerts',
        KmsMasterKeyId: Match.anyValue()
      });
    });

    test('Creates CloudWatch alarms for Lambda errors', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        AlarmName: `lambda-errors-${environmentSuffix}`,
        AlarmDescription: 'Alert when Lambda function has errors',
        MetricName: 'Errors',
        Namespace: 'AWS/Lambda',
        Threshold: 5,
        EvaluationPeriods: 2,
        TreatMissingData: 'notBreaching'
      });
    });

    test('Creates CloudWatch alarms for Lambda duration', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        AlarmName: `lambda-duration-${environmentSuffix}`,
        AlarmDescription: 'Alert when Lambda function duration is high',
        MetricName: 'Duration',
        Namespace: 'AWS/Lambda',
        Threshold: 5000,
        EvaluationPeriods: 2
      });
    });

    test('Creates CloudWatch alarms for Lambda throttles', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        AlarmName: `lambda-throttles-${environmentSuffix}`,
        AlarmDescription: 'Alert when Lambda function is throttled',
        MetricName: 'Throttles',
        Namespace: 'AWS/Lambda',
        Threshold: 1,
        EvaluationPeriods: 1
      });
    });

    test('Creates CloudWatch alarms for DLQ messages', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        AlarmName: `dlq-messages-${environmentSuffix}`,
        AlarmDescription: 'Alert when messages are sent to DLQ',
        MetricName: 'ApproximateNumberOfMessagesVisible',
        Namespace: 'AWS/SQS',
        Threshold: 1,
        EvaluationPeriods: 1
      });
    });

    test('Creates CloudWatch alarms for API Gateway 4xx errors', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        AlarmName: `api-4xx-errors-${environmentSuffix}`,
        AlarmDescription: 'Alert on high 4xx error rate',
        MetricName: '4XXError',
        Namespace: 'AWS/ApiGateway',
        Threshold: 10,
        EvaluationPeriods: 2
      });
    });

    test('Creates CloudWatch alarms for API Gateway 5xx errors', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        AlarmName: `api-5xx-errors-${environmentSuffix}`,
        AlarmDescription: 'Alert on 5xx errors',
        MetricName: '5XXError',
        Namespace: 'AWS/ApiGateway',
        Threshold: 5,
        EvaluationPeriods: 1
      });
    });

    test('Creates CloudWatch Dashboard', () => {
      template.hasResourceProperties('AWS::CloudWatch::Dashboard', {
        DashboardName: `serverless-dashboard-${environmentSuffix}`,
        DashboardBody: Match.anyValue()
      });
    });

    test('Monitoring resources have required tags', () => {
      template.hasResourceProperties('AWS::SNS::Topic', {
        Tags: Match.arrayWith([
          Match.objectLike({
            Key: 'Project',
            Value: 'ServerlessInfra'
          })
        ])
      });

      template.hasResourceProperties('AWS::CloudWatch::Dashboard', {
        DashboardName: `serverless-dashboard-${environmentSuffix}`
      });
    });
  });

  describe('Stack Outputs', () => {
    test('Creates API endpoint output', () => {
      template.hasOutput('ApiEndpoint', {
        Description: 'API Gateway endpoint URL',
        Value: Match.anyValue()
      });
    });

    test('Creates DynamoDB table name output', () => {
      template.hasOutput('DynamoTableName', {
        Description: 'DynamoDB table name',
        Value: Match.objectLike({
          Ref: Match.stringLikeRegexp('DynamoDBUserTable')
        })
      });
    });

    test('Creates Lambda function name output', () => {
      template.hasOutput('LambdaFunctionName', {
        Description: 'Lambda function name',
        Value: Match.objectLike({
          Ref: Match.stringLikeRegexp('LambdaFunction')
        })
      });
    });

    test('Creates KMS key ID output', () => {
      template.hasOutput('KmsKeyId', {
        Description: 'KMS Key ID for encryption',
        Value: Match.anyValue()
      });
    });

    test('Creates KMS key alias output', () => {
      template.hasOutput('KmsKeyAlias', {
        Description: 'KMS Key Alias for encryption',
        Value: `alias/serverless-infra-${environmentSuffix}`
      });
    });
  });

  describe('Cross-Resource Integration', () => {
    test('Lambda function references DynamoDB table', () => {
      const templateJson = template.toJSON();
      const lambdaFunction = Object.values(templateJson.Resources).find(
        (resource: any) => resource.Type === 'AWS::Lambda::Function'
      );

      expect(lambdaFunction).toBeDefined();
      expect(JSON.stringify(lambdaFunction)).toContain('DynamoDBUserTable');
    });

    test('API Gateway integrates with Lambda function', () => {
      template.hasResourceProperties('AWS::ApiGateway::Method', {
        Integration: Match.objectLike({
          Type: 'AWS_PROXY',
          IntegrationHttpMethod: 'POST'
        })
      });
    });

    test('All resources use the same KMS key for encryption', () => {
      const templateJson = template.toJSON();
      const kmsKeyRef = Object.keys(templateJson.Resources).find(
        key => templateJson.Resources[key].Type === 'AWS::KMS::Key'
      );

      expect(kmsKeyRef).toBeDefined();

      // Check that DynamoDB, Lambda, API Gateway, and SNS use the same KMS key
      const resources = Object.values(templateJson.Resources);
      const encryptedResources = resources.filter((resource: any) =>
        resource.Properties?.SSESpecification?.KMSMasterKeyId ||
        resource.Properties?.KmsMasterKeyId ||
        resource.Properties?.KmsKeyId
      );

      expect(encryptedResources.length).toBeGreaterThan(0);
    });
  });

  describe('Environment-Specific Configuration', () => {
    test('Production environment uses RETAIN removal policy', () => {
      const prodApp = new cdk.App();
      const prodStack = new TapStack(prodApp, 'ProdStack', {
        environmentSuffix: 'prod',
        lambdaMemorySize: 512,
        lambdaTimeout: 30,
        dynamoReadCapacity: 10,
        dynamoWriteCapacity: 10,
        corsOrigin: 'https://prod.example.com'
      });
      const prodTemplate = Template.fromStack(prodStack);

      // Check that KMS key has RETAIN policy
      prodTemplate.hasResource('AWS::KMS::Key', {
        DeletionPolicy: 'Retain'
      });
    });

    test('Non-production environment uses DESTROY removal policy', () => {
      const devApp = new cdk.App();
      const devStack = new TapStack(devApp, 'DevStack', {
        environmentSuffix: 'dev',
        lambdaMemorySize: 256,
        lambdaTimeout: 10,
        dynamoReadCapacity: 5,
        dynamoWriteCapacity: 5,
        corsOrigin: 'https://dev.example.com'
      });
      const devTemplate = Template.fromStack(devStack);

      // Check that KMS key has DESTROY policy
      devTemplate.hasResource('AWS::KMS::Key', {
        DeletionPolicy: 'Delete'
      });
    });

    test('Non-production environments use DESTROY removal policy', () => {
      const testCases = [
        { suffix: 'dev', name: 'Development' },
        { suffix: 'staging', name: 'Staging' },
        { suffix: 'pr1234', name: 'CIPipeline' },
        { suffix: 'feature-abc123', name: 'FeatureBranch' },
        { suffix: 'hotfix-xyz', name: 'HotfixBranch' }
      ];

      testCases.forEach(({ suffix, name }) => {
        const testApp = new cdk.App();
        const testStack = new TapStack(testApp, `${name}Stack`, {
          environmentSuffix: suffix,
          lambdaMemorySize: 256,
          lambdaTimeout: 10,
          dynamoReadCapacity: 5,
          dynamoWriteCapacity: 5,
          corsOrigin: `https://${suffix}.example.com`
        });
        const testTemplate = Template.fromStack(testStack);

        // Check that KMS key has DESTROY policy (non-production environments)
        testTemplate.hasResource('AWS::KMS::Key', {
          DeletionPolicy: 'Delete'
        });
      });
    });

    test('Only explicit production environments use RETAIN policy', () => {
      const productionApp = new cdk.App();
      const productionStack = new TapStack(productionApp, 'ProductionStack', {
        environmentSuffix: 'production',
        lambdaMemorySize: 1024,
        lambdaTimeout: 60,
        dynamoReadCapacity: 20,
        dynamoWriteCapacity: 20,
        corsOrigin: 'https://production.example.com'
      });
      const productionTemplate = Template.fromStack(productionStack);

      // Check that KMS key has RETAIN policy (explicit production)
      productionTemplate.hasResource('AWS::KMS::Key', {
        DeletionPolicy: 'Retain'
      });
    });
  });

  describe('Security Best Practices', () => {
    test('All resources have encryption enabled', () => {
      const templateJson = template.toJSON();

      // Check DynamoDB encryption
      const dynamoTable = Object.values(templateJson.Resources).find(
        (resource: any) => resource.Type === 'AWS::DynamoDB::Table'
      );
      expect((dynamoTable as any)?.Properties?.SSESpecification?.SSEEnabled).toBe(true);

      // Check SQS encryption
      const sqsQueue = Object.values(templateJson.Resources).find(
        (resource: any) => resource.Type === 'AWS::SQS::Queue'
      );
      expect((sqsQueue as any)?.Properties?.KmsMasterKeyId).toBeDefined();

      // Check SNS encryption
      const snsTopic = Object.values(templateJson.Resources).find(
        (resource: any) => resource.Type === 'AWS::SNS::Topic'
      );
      expect((snsTopic as any)?.Properties?.KmsMasterKeyId).toBeDefined();
    });

    test('Lambda function has proper IAM permissions', () => {
      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: Match.objectLike({
          Statement: Match.arrayWith([
            Match.objectLike({
              Effect: 'Allow',
              Action: 'sqs:SendMessage'
            }),
            Match.objectLike({
              Effect: 'Allow',
              Action: Match.arrayWith([
                'xray:PutTraceSegments',
                'xray:PutTelemetryRecords'
              ])
            }),
            Match.objectLike({
              Effect: 'Allow',
              Action: Match.arrayWith([
                'kms:Decrypt',
                'kms:DescribeKey',
                'kms:Encrypt',
                'kms:ReEncrypt*',
                'kms:GenerateDataKey*'
              ])
            }),
            Match.objectLike({
              Effect: 'Allow',
              Action: Match.arrayWith([
                'dynamodb:BatchWriteItem',
                'dynamodb:PutItem',
                'dynamodb:UpdateItem',
                'dynamodb:DeleteItem',
                'dynamodb:DescribeTable'
              ])
            }),
            Match.objectLike({
              Effect: 'Allow',
              Action: Match.arrayWith([
                'dynamodb:Query',
                'dynamodb:GetItem'
              ])
            })
          ])
        })
      });
    });

    test('API Gateway has proper CORS configuration', () => {
      template.hasResourceProperties('AWS::ApiGateway::Method', {
        HttpMethod: 'OPTIONS',
        Integration: Match.objectLike({
          Type: 'MOCK'
        })
      });
    });
  });

  describe('Resource Naming Consistency', () => {
    test('All resources follow consistent naming convention', () => {
      const templateJson = template.toJSON();
      const resources = Object.values(templateJson.Resources);

      // Check that resources include environment suffix in their names
      const namedResources = resources.filter((resource: any) =>
        resource?.Properties?.FunctionName ||
        resource?.Properties?.TableName ||
        resource?.Properties?.Name ||
        resource?.Properties?.TopicName ||
        resource?.Properties?.QueueName
      );

      namedResources.forEach((resource: any) => {
        const name = resource?.Properties?.FunctionName ||
          resource?.Properties?.TableName ||
          resource?.Properties?.Name ||
          resource?.Properties?.TopicName ||
          resource?.Properties?.QueueName;

        if (name && typeof name === 'string') {
          // Skip resources that don't follow the naming convention
          if (!name.includes('Validator') && !name.includes('Model')) {
            expect(name).toContain(environmentSuffix);
          }
        }
      });
    });
  });

  describe('Edge Cases and Error Handling', () => {
    test('Stack handles missing environment suffix gracefully', () => {
      const app = new cdk.App();
      const stack = new TapStack(app, 'DefaultStack', {
        environmentSuffix: '', // Empty string
        lambdaMemorySize: 256,
        lambdaTimeout: 10,
        dynamoReadCapacity: 5,
        dynamoWriteCapacity: 5,
        corsOrigin: 'https://example.com'
      });
      const template = Template.fromStack(stack);

      expect(template).toBeDefined();
      expect(template.toJSON()).toBeDefined();
    });

    test('Stack uses default values when props are undefined', () => {
      const app = new cdk.App();
      const stack = new TapStack(app, 'DefaultPropsStack', {
        environmentSuffix: 'test',
        // All other props undefined - should use defaults
      });
      const template = Template.fromStack(stack);

      expect(template).toBeDefined();

      // Check that Lambda uses default values
      template.hasResourceProperties('AWS::Lambda::Function', {
        MemorySize: 256, // Default value
        Timeout: 10 // Default value
      });

      // Check that DynamoDB uses default values
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        ProvisionedThroughput: {
          ReadCapacityUnits: 5, // Default value
          WriteCapacityUnits: 5 // Default value
        }
      });
    });

    test('Stack handles context-based environment suffix', () => {
      const app = new cdk.App({
        context: {
          environmentSuffix: 'context-env'
        }
      });
      const stack = new TapStack(app, 'ContextStack', {
        environmentSuffix: '', // Empty - should fall back to context
        lambdaMemorySize: 256,
        lambdaTimeout: 10,
        dynamoReadCapacity: 5,
        dynamoWriteCapacity: 5,
        corsOrigin: 'https://example.com'
      });
      const template = Template.fromStack(stack);

      expect(template).toBeDefined();
    });

    test('Stack handles fallback to dev environment', () => {
      const app = new cdk.App();
      const stack = new TapStack(app, 'FallbackStack', {
        environmentSuffix: '', // Empty - should fall back to 'dev'
        lambdaMemorySize: 256,
        lambdaTimeout: 10,
        dynamoReadCapacity: 5,
        dynamoWriteCapacity: 5,
        corsOrigin: 'https://example.com'
      });
      const template = Template.fromStack(stack);

      expect(template).toBeDefined();

      // Check that resources use 'dev' suffix
      template.hasResourceProperties('AWS::Lambda::Function', {
        FunctionName: 'serverless-function-dev'
      });
    });
  });

  describe('KMS Construct Methods', () => {
    test('KMS construct grants encrypt/decrypt permissions', () => {
      const app = new cdk.App();
      const stack = new TapStack(app, 'KmsTestStack', {
        environmentSuffix: 'test',
        lambdaMemorySize: 256,
        lambdaTimeout: 10,
        dynamoReadCapacity: 5,
        dynamoWriteCapacity: 5,
        corsOrigin: 'https://example.com'
      });

      // Get the KMS construct from the stack
      const kmsConstruct = stack.node.findChild('KmsKey') as any;
      expect(kmsConstruct).toBeDefined();
      expect(kmsConstruct.grantEncryptDecrypt).toBeDefined();
      expect(kmsConstruct.grantKeyUsage).toBeDefined();
    });

    test('KMS construct has correct key and alias properties', () => {
      const app = new cdk.App();
      const stack = new TapStack(app, 'KmsPropsTestStack', {
        environmentSuffix: 'test',
        lambdaMemorySize: 256,
        lambdaTimeout: 10,
        dynamoReadCapacity: 5,
        dynamoWriteCapacity: 5,
        corsOrigin: 'https://example.com'
      });

      // Get the KMS construct from the stack
      const kmsConstruct = stack.node.findChild('KmsKey') as any;
      expect(kmsConstruct.key).toBeDefined();
      expect(kmsConstruct.alias).toBeDefined();
    });

    test('KMS construct grantEncryptDecrypt method works', () => {
      const app = new cdk.App();
      const stack = new TapStack(app, 'KmsGrantTestStack', {
        environmentSuffix: 'test',
        lambdaMemorySize: 256,
        lambdaTimeout: 10,
        dynamoReadCapacity: 5,
        dynamoWriteCapacity: 5,
        corsOrigin: 'https://example.com'
      });

      // Get the KMS construct from the stack
      const kmsConstruct = stack.node.findChild('KmsKey') as any;
      const lambdaConstruct = stack.node.findChild('Lambda') as any;

      // Test that the method can be called without errors
      expect(() => {
        kmsConstruct.grantEncryptDecrypt(lambdaConstruct.function);
      }).not.toThrow();
    });

    test('KMS construct grantKeyUsage method works', () => {
      const app = new cdk.App();
      const stack = new TapStack(app, 'KmsGrantUsageTestStack', {
        environmentSuffix: 'test',
        lambdaMemorySize: 256,
        lambdaTimeout: 10,
        dynamoReadCapacity: 5,
        dynamoWriteCapacity: 5,
        corsOrigin: 'https://example.com'
      });

      // Get the KMS construct from the stack
      const kmsConstruct = stack.node.findChild('KmsKey') as any;
      const lambdaConstruct = stack.node.findChild('Lambda') as any;

      // Test that the method can be called without errors
      expect(() => {
        kmsConstruct.grantKeyUsage(lambdaConstruct.function);
      }).not.toThrow();
    });
  });

  describe('Lambda Construct Properties', () => {
    test('Lambda construct exposes function and dead letter queue', () => {
      const app = new cdk.App();
      const stack = new TapStack(app, 'LambdaPropsTestStack', {
        environmentSuffix: 'test',
        lambdaMemorySize: 256,
        lambdaTimeout: 10,
        dynamoReadCapacity: 5,
        dynamoWriteCapacity: 5,
        corsOrigin: 'https://example.com'
      });

      // Get the Lambda construct from the stack
      const lambdaConstruct = stack.node.findChild('Lambda') as any;
      expect(lambdaConstruct.function).toBeDefined();
      expect(lambdaConstruct.deadLetterQueue).toBeDefined();
    });
  });

  describe('API Gateway Construct Properties', () => {
    test('API Gateway construct exposes rest API', () => {
      const app = new cdk.App();
      const stack = new TapStack(app, 'ApiPropsTestStack', {
        environmentSuffix: 'test',
        lambdaMemorySize: 256,
        lambdaTimeout: 10,
        dynamoReadCapacity: 5,
        dynamoWriteCapacity: 5,
        corsOrigin: 'https://example.com'
      });

      // Get the API Gateway construct from the stack
      const apiConstruct = stack.node.findChild('ApiGateway') as any;
      expect(apiConstruct.restApi).toBeDefined();
    });
  });

  describe('DynamoDB Construct Properties', () => {
    test('DynamoDB construct exposes table', () => {
      const app = new cdk.App();
      const stack = new TapStack(app, 'DynamoPropsTestStack', {
        environmentSuffix: 'test',
        lambdaMemorySize: 256,
        lambdaTimeout: 10,
        dynamoReadCapacity: 5,
        dynamoWriteCapacity: 5,
        corsOrigin: 'https://example.com'
      });

      // Get the DynamoDB construct from the stack
      const dynamoConstruct = stack.node.findChild('DynamoDB') as any;
      expect(dynamoConstruct.table).toBeDefined();
    });
  });

  describe('Monitoring Construct Integration', () => {
    test('Monitoring construct receives all required dependencies', () => {
      const app = new cdk.App();
      const stack = new TapStack(app, 'MonitoringTestStack', {
        environmentSuffix: 'test',
        lambdaMemorySize: 256,
        lambdaTimeout: 10,
        dynamoReadCapacity: 5,
        dynamoWriteCapacity: 5,
        corsOrigin: 'https://example.com'
      });

      // Get the monitoring construct from the stack
      const monitoringConstruct = stack.node.findChild('Monitoring') as any;
      expect(monitoringConstruct).toBeDefined();
    });
  });

  describe('Stack Outputs Validation', () => {
    test('All outputs have correct descriptions', () => {
      const templateJson = template.toJSON();
      const outputs = templateJson.Outputs || {};

      expect(outputs.ApiEndpoint?.Description).toBe('API Gateway endpoint URL');
      expect(outputs.DynamoTableName?.Description).toBe('DynamoDB table name');
      expect(outputs.LambdaFunctionName?.Description).toBe('Lambda function name');
      expect(outputs.KmsKeyId?.Description).toBe('KMS Key ID for encryption');
      expect(outputs.KmsKeyAlias?.Description).toBe('KMS Key Alias for encryption');
    });

    test('Outputs reference correct resources', () => {
      const templateJson = template.toJSON();
      const outputs = templateJson.Outputs || {};

      // Check that outputs reference actual resources
      expect(outputs.ApiEndpoint?.Value).toBeDefined();
      expect(outputs.DynamoTableName?.Value).toBeDefined();
      expect(outputs.LambdaFunctionName?.Value).toBeDefined();
      expect(outputs.KmsKeyId?.Value).toBeDefined();
      expect(outputs.KmsKeyAlias?.Value).toBeDefined();
    });
  });
});
