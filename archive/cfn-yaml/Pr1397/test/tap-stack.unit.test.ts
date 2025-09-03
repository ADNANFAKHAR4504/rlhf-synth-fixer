import * as fs from 'fs';
import * as path from 'path';

describe('TapStack CloudFormation Template Unit Tests', () => {
  let template: any;

  beforeAll(() => {
    // Load JSON template (YAML has CloudFormation functions that js-yaml doesn't understand)
    // The JSON is already converted from YAML using cfn-flip
    const jsonPath = path.join(__dirname, '..', 'lib', 'TapStack.json');
    const jsonContent = fs.readFileSync(jsonPath, 'utf8');
    template = JSON.parse(jsonContent);
  });

  describe('Template Structure', () => {
    test('should have correct AWSTemplateFormatVersion', () => {
      expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
    });

    test('should have a description', () => {
      expect(template.Description).toBeDefined();
      expect(template.Description.toLowerCase()).toContain('serverless');
      expect(template.Description).toContain('e-commerce');
    });

    test('should have Parameters section', () => {
      expect(template.Parameters).toBeDefined();
      expect(Object.keys(template.Parameters).length).toBeGreaterThan(0);
    });

    test('should have Resources section', () => {
      expect(template.Resources).toBeDefined();
      expect(Object.keys(template.Resources).length).toBeGreaterThan(0);
    });

    test('should have Outputs section', () => {
      expect(template.Outputs).toBeDefined();
      expect(Object.keys(template.Outputs).length).toBeGreaterThan(0);
    });
  });

  describe('Parameters', () => {
    test('should have ProjectName parameter', () => {
      expect(template.Parameters.ProjectName).toBeDefined();
      expect(template.Parameters.ProjectName.Type).toBe('String');
      expect(template.Parameters.ProjectName.Default).toBe('ecommerce-orders');
      expect(template.Parameters.ProjectName.AllowedPattern).toBe(
        '^[a-z0-9-]+$'
      );
    });

    test('should have Environment parameter', () => {
      expect(template.Parameters.Environment).toBeDefined();
      expect(template.Parameters.Environment.Type).toBe('String');
      expect(template.Parameters.Environment.Default).toBe('dev');
      expect(template.Parameters.Environment.AllowedValues).toContain('dev');
      expect(template.Parameters.Environment.AllowedValues).toContain(
        'staging'
      );
      expect(template.Parameters.Environment.AllowedValues).toContain('prod');
    });

    test('should have EnvironmentSuffix parameter', () => {
      expect(template.Parameters.EnvironmentSuffix).toBeDefined();
      expect(template.Parameters.EnvironmentSuffix.Type).toBe('String');
      expect(template.Parameters.EnvironmentSuffix.Default).toBe('dev');
      expect(template.Parameters.EnvironmentSuffix.AllowedPattern).toBe(
        '^[a-z0-9-]+$'
      );
    });

    test('should have AlertEmailAddress parameter', () => {
      expect(template.Parameters.AlertEmailAddress).toBeDefined();
      expect(template.Parameters.AlertEmailAddress.Type).toBe('String');
      expect(
        template.Parameters.AlertEmailAddress.AllowedPattern
      ).toBeDefined();
    });
  });

  describe('Security Resources', () => {
    test('should have KMS key for encryption', () => {
      expect(template.Resources.OrderProcessingKMSKey).toBeDefined();
      expect(template.Resources.OrderProcessingKMSKey.Type).toBe(
        'AWS::KMS::Key'
      );
    });

    test('should have KMS key alias', () => {
      expect(template.Resources.OrderProcessingKMSKeyAlias).toBeDefined();
      expect(template.Resources.OrderProcessingKMSKeyAlias.Type).toBe(
        'AWS::KMS::Alias'
      );
    });

    test('should have SNS topic for alerts', () => {
      expect(template.Resources.AlertingTopic).toBeDefined();
      expect(template.Resources.AlertingTopic.Type).toBe('AWS::SNS::Topic');
    });

    test('should have Dead Letter Queue', () => {
      expect(template.Resources.DeadLetterQueue).toBeDefined();
      expect(template.Resources.DeadLetterQueue.Type).toBe('AWS::SQS::Queue');
    });
  });

  describe('DynamoDB Table', () => {
    test('should have OrdersTable resource', () => {
      expect(template.Resources.OrdersTable).toBeDefined();
      expect(template.Resources.OrdersTable.Type).toBe('AWS::DynamoDB::Table');
    });

    test('should have correct DeletionPolicy', () => {
      expect(template.Resources.OrdersTable.DeletionPolicy).toBe('Delete');
    });

    test('should use EnvironmentSuffix in table name', () => {
      const tableName = template.Resources.OrdersTable.Properties.TableName;
      expect(tableName).toBeDefined();
      expect(tableName['Fn::Sub']).toContain('${EnvironmentSuffix}');
    });

    test('should have orderId as partition key', () => {
      const attributeDefs =
        template.Resources.OrdersTable.Properties.AttributeDefinitions;
      expect(attributeDefs).toHaveLength(3);
      expect(attributeDefs[0].AttributeName).toBe('orderId');
      expect(attributeDefs[0].AttributeType).toBe('S');

      const keySchema = template.Resources.OrdersTable.Properties.KeySchema;
      expect(keySchema).toHaveLength(1);
      expect(keySchema[0].AttributeName).toBe('orderId');
      expect(keySchema[0].KeyType).toBe('HASH');
    });

    test('should use ON_DEMAND billing mode', () => {
      expect(template.Resources.OrdersTable.Properties.BillingMode).toBe(
        'PAY_PER_REQUEST'
      );
    });

    test('should have Point-in-Time Recovery enabled', () => {
      const pitr =
        template.Resources.OrdersTable.Properties
          .PointInTimeRecoverySpecification;
      expect(pitr).toBeDefined();
      expect(pitr.PointInTimeRecoveryEnabled).toBe(true);
    });

    test('should have Server-Side Encryption enabled with KMS', () => {
      const sse = template.Resources.OrdersTable.Properties.SSESpecification;
      expect(sse).toBeDefined();
      expect(sse.SSEEnabled).toBe(true);
      expect(sse.SSEType).toBe('KMS');
      expect(sse.KMSMasterKeyId).toBeDefined();
    });

    test('should have Global Secondary Index', () => {
      const gsi =
        template.Resources.OrdersTable.Properties.GlobalSecondaryIndexes;
      expect(gsi).toBeDefined();
      expect(gsi).toHaveLength(1);
      expect(gsi[0].IndexName).toBe('CustomerIndex');
    });

    test('should have DynamoDB Stream enabled', () => {
      const stream =
        template.Resources.OrdersTable.Properties.StreamSpecification;
      expect(stream).toBeDefined();
      expect(stream.StreamViewType).toBe('NEW_AND_OLD_IMAGES');
    });

    test('should have proper tags', () => {
      const tags = template.Resources.OrdersTable.Properties.Tags;
      expect(tags).toBeDefined();
      expect(tags).toHaveLength(2);
      expect(tags.some((tag: any) => tag.Key === 'Project')).toBe(true);
      expect(tags.some((tag: any) => tag.Key === 'Environment')).toBe(true);
    });
  });

  describe('IAM Role', () => {
    test('should have OrderProcessorLambdaRole resource', () => {
      expect(template.Resources.OrderProcessorLambdaRole).toBeDefined();
      expect(template.Resources.OrderProcessorLambdaRole.Type).toBe(
        'AWS::IAM::Role'
      );
    });

    test('should have correct AssumeRolePolicyDocument', () => {
      const policy =
        template.Resources.OrderProcessorLambdaRole.Properties
          .AssumeRolePolicyDocument;
      expect(policy.Version).toBe('2012-10-17');
      expect(policy.Statement[0].Effect).toBe('Allow');
      expect(policy.Statement[0].Principal.Service).toBe(
        'lambda.amazonaws.com'
      );
      expect(policy.Statement[0].Action).toBe('sts:AssumeRole');
    });

    test('should have required managed policies', () => {
      const managedPolicies =
        template.Resources.OrderProcessorLambdaRole.Properties
          .ManagedPolicyArns;
      expect(managedPolicies).toContain(
        'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole'
      );
      expect(managedPolicies).toContain(
        'arn:aws:iam::aws:policy/AWSXRayDaemonWriteAccess'
      );
    });

    test('should have enhanced DynamoDB access policy', () => {
      const policies =
        template.Resources.OrderProcessorLambdaRole.Properties.Policies;
      expect(policies).toHaveLength(4); // Enhanced DynamoDB, KMS, CloudWatch, SQS
      expect(policies[0].PolicyName).toBe('EnhancedDynamoDBAccess');

      const statement = policies[0].PolicyDocument.Statement[0];
      expect(statement.Effect).toBe('Allow');
      expect(statement.Action).toContain('dynamodb:PutItem');
      expect(statement.Action).toContain('dynamodb:GetItem');
      expect(statement.Action).toContain('dynamodb:UpdateItem');
      expect(statement.Action).toContain('dynamodb:Query');
      expect(statement.Action).toContain('dynamodb:BatchGetItem');
    });

    test('should have KMS access policy', () => {
      const policies =
        template.Resources.OrderProcessorLambdaRole.Properties.Policies;
      const kmsPolicy = policies.find((p: any) => p.PolicyName === 'KMSAccess');
      expect(kmsPolicy).toBeDefined();
      expect(kmsPolicy.PolicyDocument.Statement[0].Action).toContain(
        'kms:Decrypt'
      );
    });

    test('should have CloudWatch metrics policy', () => {
      const policies =
        template.Resources.OrderProcessorLambdaRole.Properties.Policies;
      const cwPolicy = policies.find(
        (p: any) => p.PolicyName === 'CloudWatchMetrics'
      );
      expect(cwPolicy).toBeDefined();
      expect(cwPolicy.PolicyDocument.Statement[0].Action).toContain(
        'cloudwatch:PutMetricData'
      );
    });

    test('should have SQS access policy for DLQ', () => {
      const policies =
        template.Resources.OrderProcessorLambdaRole.Properties.Policies;
      const sqsPolicy = policies.find((p: any) => p.PolicyName === 'SQSAccess');
      expect(sqsPolicy).toBeDefined();
      expect(sqsPolicy.PolicyDocument.Statement[0].Action).toContain(
        'sqs:SendMessage'
      );
    });
  });

  describe('Lambda Function', () => {
    test('should have OrderProcessorFunction resource', () => {
      expect(template.Resources.OrderProcessorFunction).toBeDefined();
      expect(template.Resources.OrderProcessorFunction.Type).toBe(
        'AWS::Lambda::Function'
      );
    });

    test('should use EnvironmentSuffix in function name', () => {
      const functionName =
        template.Resources.OrderProcessorFunction.Properties.FunctionName;
      expect(functionName).toBeDefined();
      expect(functionName['Fn::Sub']).toContain('${EnvironmentSuffix}');
    });

    test('should have correct runtime and handler', () => {
      const props = template.Resources.OrderProcessorFunction.Properties;
      expect(props.Runtime).toBe('python3.11');
      expect(props.Handler).toBe('index.lambda_handler');
    });

    test('should have correct memory and timeout settings', () => {
      const props = template.Resources.OrderProcessorFunction.Properties;
      expect(props.MemorySize).toBe(512);
      expect(props.Timeout).toBe(30);
    });

    test('should have Dead Letter Queue configuration', () => {
      const dlq =
        template.Resources.OrderProcessorFunction.Properties.DeadLetterConfig;
      expect(dlq).toBeDefined();
      expect(dlq.TargetArn).toBeDefined();
    });

    test('should have X-Ray tracing enabled', () => {
      const tracing =
        template.Resources.OrderProcessorFunction.Properties.TracingConfig;
      expect(tracing).toBeDefined();
      expect(tracing.Mode).toBe('Active');
    });

    test('should reference IAM role correctly', () => {
      const role = template.Resources.OrderProcessorFunction.Properties.Role;
      expect(role['Fn::GetAtt']).toEqual(['OrderProcessorLambdaRole', 'Arn']);
    });

    test('should have enhanced environment variables', () => {
      const envVars =
        template.Resources.OrderProcessorFunction.Properties.Environment
          .Variables;
      expect(envVars.ORDERS_TABLE_NAME).toBeDefined();
      expect(envVars.ORDERS_TABLE_NAME.Ref).toBe('OrdersTable');
      expect(envVars.ENVIRONMENT).toBeDefined();
      expect(envVars.ENVIRONMENT.Ref).toBe('Environment');
      expect(envVars.KMS_KEY_ID).toBeDefined();
      expect(envVars.CUSTOM_METRICS_NAMESPACE).toBeDefined();
    });

    test('should have inline code with enhanced features', () => {
      const code =
        template.Resources.OrderProcessorFunction.Properties.Code.ZipFile;
      expect(code).toBeDefined();
      expect(code).toContain('lambda_handler');
      expect(code).toContain('dynamodb');
      expect(code).toContain('orderId');
      expect(code).toContain('xray_recorder');
      expect(code).toContain('validate_order_input');
      expect(code).toContain('put_custom_metric');
    });
  });

  describe('API Gateway', () => {
    test('should have OrdersHttpApi resource', () => {
      expect(template.Resources.OrdersHttpApi).toBeDefined();
      expect(template.Resources.OrdersHttpApi.Type).toBe(
        'AWS::ApiGatewayV2::Api'
      );
    });

    test('should use EnvironmentSuffix in API name', () => {
      const apiName = template.Resources.OrdersHttpApi.Properties.Name;
      expect(apiName).toBeDefined();
      expect(apiName['Fn::Sub']).toContain('${EnvironmentSuffix}');
    });

    test('should be HTTP protocol type', () => {
      expect(template.Resources.OrdersHttpApi.Properties.ProtocolType).toBe(
        'HTTP'
      );
    });

    test('should have enhanced CORS configuration', () => {
      const cors =
        template.Resources.OrdersHttpApi.Properties.CorsConfiguration;
      expect(cors).toBeDefined();
      expect(cors.AllowCredentials).toBe(false);
      expect(cors.AllowMethods).toContain('POST');
      expect(cors.AllowMethods).toContain('OPTIONS');
      expect(cors.AllowOrigins).toContain('*');
      expect(cors.AllowHeaders).toContain('Content-Type');
      expect(cors.AllowHeaders).toContain('Authorization');
      expect(cors.MaxAge).toBe(300);
    });

    test('should have OrdersApiIntegration resource', () => {
      expect(template.Resources.OrdersApiIntegration).toBeDefined();
      expect(template.Resources.OrdersApiIntegration.Type).toBe(
        'AWS::ApiGatewayV2::Integration'
      );
    });

    test('should have correct integration type with timeout', () => {
      const integration = template.Resources.OrdersApiIntegration.Properties;
      expect(integration.IntegrationType).toBe('AWS_PROXY');
      expect(integration.PayloadFormatVersion).toBe('2.0');
      expect(integration.TimeoutInMillis).toBe(30000);
    });

    test('should have OrdersApiRoute resource', () => {
      expect(template.Resources.OrdersApiRoute).toBeDefined();
      expect(template.Resources.OrdersApiRoute.Type).toBe(
        'AWS::ApiGatewayV2::Route'
      );
    });

    test('should have correct route configuration', () => {
      const route = template.Resources.OrdersApiRoute.Properties;
      expect(route.RouteKey).toBe('POST /orders');
      expect(route.AuthorizationType).toBe('NONE');
    });

    test('should have OrdersApiStage resource', () => {
      expect(template.Resources.OrdersApiStage).toBeDefined();
      expect(template.Resources.OrdersApiStage.Type).toBe(
        'AWS::ApiGatewayV2::Stage'
      );
    });

    test('should have AutoDeploy enabled with throttling', () => {
      const stage = template.Resources.OrdersApiStage.Properties;
      expect(stage.AutoDeploy).toBe(true);
      expect(stage.DefaultRouteSettings).toBeDefined();
      expect(stage.DefaultRouteSettings.ThrottlingRateLimit).toBe(1000);
      expect(stage.DefaultRouteSettings.ThrottlingBurstLimit).toBe(2000);
    });

    test('should have access logging configured', () => {
      const stage = template.Resources.OrdersApiStage.Properties;
      expect(stage.AccessLogSettings).toBeDefined();
      expect(stage.AccessLogSettings.DestinationArn).toBeDefined();
      expect(stage.AccessLogSettings.Format).toBeDefined();
    });
  });

  describe('CloudWatch Monitoring', () => {
    test('should have multiple CloudWatch alarms', () => {
      const alarms = [
        'LambdaErrorAlarm',
        'LambdaDurationAlarm',
        'LambdaThrottleAlarm',
        'ApiGateway4XXAlarm',
        'ApiGateway5XXAlarm',
        'DynamoDBThrottleAlarm',
      ];

      alarms.forEach(alarmName => {
        expect(template.Resources[alarmName]).toBeDefined();
        expect(template.Resources[alarmName].Type).toBe(
          'AWS::CloudWatch::Alarm'
        );
      });
    });

    test('should have log groups with KMS encryption', () => {
      expect(template.Resources.ApiGatewayLogGroup).toBeDefined();
      expect(template.Resources.LambdaLogGroup).toBeDefined();

      expect(
        template.Resources.ApiGatewayLogGroup.Properties.KmsKeyId
      ).toBeDefined();
      expect(
        template.Resources.LambdaLogGroup.Properties.KmsKeyId
      ).toBeDefined();
    });

    test('should have log retention set to 14 days', () => {
      expect(
        template.Resources.ApiGatewayLogGroup.Properties.RetentionInDays
      ).toBe(14);
      expect(template.Resources.LambdaLogGroup.Properties.RetentionInDays).toBe(
        14
      );
    });
  });

  describe('Lambda Permission', () => {
    test('should have ApiGatewayLambdaPermission resource', () => {
      expect(template.Resources.ApiGatewayLambdaPermission).toBeDefined();
      expect(template.Resources.ApiGatewayLambdaPermission.Type).toBe(
        'AWS::Lambda::Permission'
      );
    });

    test('should have correct permission properties', () => {
      const permission =
        template.Resources.ApiGatewayLambdaPermission.Properties;
      expect(permission.Action).toBe('lambda:InvokeFunction');
      expect(permission.Principal).toBe('apigateway.amazonaws.com');
      expect(permission.FunctionName.Ref).toBe('OrderProcessorFunction');
    });

    test('should have correct SourceArn format', () => {
      const sourceArn =
        template.Resources.ApiGatewayLambdaPermission.Properties.SourceArn;
      expect(sourceArn['Fn::Sub']).toContain('arn:aws:execute-api');
      expect(sourceArn['Fn::Sub']).toContain('${AWS::Region}');
      expect(sourceArn['Fn::Sub']).toContain('${AWS::AccountId}');
      expect(sourceArn['Fn::Sub']).toContain('${OrdersHttpApi}');
    });
  });

  describe('Outputs', () => {
    test('should have ApiGatewayEndpoint output', () => {
      expect(template.Outputs.ApiGatewayEndpoint).toBeDefined();
      expect(template.Outputs.ApiGatewayEndpoint.Description).toContain(
        'API Gateway endpoint'
      );
      expect(template.Outputs.ApiGatewayEndpoint.Value['Fn::Sub']).toContain(
        'https://'
      );
      expect(template.Outputs.ApiGatewayEndpoint.Value['Fn::Sub']).toContain(
        '/orders'
      );
    });

    test('should have DynamoDBTableName output', () => {
      expect(template.Outputs.DynamoDBTableName).toBeDefined();
      expect(template.Outputs.DynamoDBTableName.Description).toContain(
        'DynamoDB table'
      );
      expect(template.Outputs.DynamoDBTableName.Value.Ref).toBe('OrdersTable');
    });

    test('should have LambdaFunctionArn output', () => {
      expect(template.Outputs.LambdaFunctionArn).toBeDefined();
      expect(template.Outputs.LambdaFunctionArn.Description).toContain(
        'Lambda function ARN'
      );
      expect(template.Outputs.LambdaFunctionArn.Value['Fn::GetAtt']).toEqual([
        'OrderProcessorFunction',
        'Arn',
      ]);
    });

    test('should have enhanced outputs', () => {
      const expectedOutputs = [
        'ApiGatewayEndpoint',
        'DynamoDBTableName',
        'LambdaFunctionArn',
        'LambdaFunctionName',
        'ApiGatewayId',
        'KMSKeyId',
        'DeadLetterQueueUrl',
        'SNSTopicArn',
      ];

      expectedOutputs.forEach(outputName => {
        expect(template.Outputs[outputName]).toBeDefined();
      });
    });

    test('all outputs should have Export names', () => {
      Object.keys(template.Outputs).forEach(outputKey => {
        expect(template.Outputs[outputKey].Export).toBeDefined();
        expect(template.Outputs[outputKey].Export.Name).toBeDefined();
      });
    });
  });

  describe('Template Consistency', () => {
    test('should have consistent resource references', () => {
      // Check that Lambda permission references the function
      expect(
        template.Resources.ApiGatewayLambdaPermission.Properties.FunctionName
          .Ref
      ).toBe('OrderProcessorFunction');

      // Check that API integration references the Lambda function
      expect(
        template.Resources.OrdersApiIntegration.Properties.IntegrationUri[
          'Fn::Sub'
        ]
      ).toContain('${OrderProcessorFunction.Arn}');

      // Check that API route references the integration
      expect(
        template.Resources.OrdersApiRoute.Properties.Target['Fn::Sub']
      ).toContain('${OrdersApiIntegration}');

      // Check that API stage references the API
      expect(template.Resources.OrdersApiStage.Properties.ApiId.Ref).toBe(
        'OrdersHttpApi'
      );
    });
  });

  describe('High Availability and Scalability', () => {
    test('should use services that support auto-scaling', () => {
      // Lambda auto-scales by default
      expect(template.Resources.OrderProcessorFunction.Type).toBe(
        'AWS::Lambda::Function'
      );

      // DynamoDB with ON_DEMAND billing auto-scales
      expect(template.Resources.OrdersTable.Properties.BillingMode).toBe(
        'PAY_PER_REQUEST'
      );

      // API Gateway HTTP API auto-scales
      expect(template.Resources.OrdersHttpApi.Type).toBe(
        'AWS::ApiGatewayV2::Api'
      );
      expect(template.Resources.OrdersHttpApi.Properties.ProtocolType).toBe(
        'HTTP'
      );
    });

    test('should not have any single points of failure', () => {
      // All AWS services used are multi-AZ by default
      const resourceTypes = Object.values(template.Resources).map(
        (r: any) => r.Type
      );

      const multiAZServices = [
        'AWS::DynamoDB::Table',
        'AWS::Lambda::Function',
        'AWS::Lambda::Permission',
        'AWS::ApiGatewayV2::Api',
        'AWS::ApiGatewayV2::Integration',
        'AWS::ApiGatewayV2::Route',
        'AWS::ApiGatewayV2::Stage',
        'AWS::IAM::Role',
        'AWS::Logs::LogGroup',
        'AWS::KMS::Key',
        'AWS::KMS::Alias',
        'AWS::SNS::Topic',
        'AWS::SNS::Subscription',
        'AWS::SQS::Queue',
        'AWS::CloudWatch::Alarm',
      ];

      resourceTypes.forEach(type => {
        expect(
          multiAZServices.some(
            service => type === service || type.startsWith(service)
          )
        ).toBe(true);
      });
    });
  });

  describe('Security Best Practices', () => {
    test('should follow least privilege principle for IAM', () => {
      const policies =
        template.Resources.OrderProcessorLambdaRole.Properties.Policies;
      const dynamoPolicy = policies[0].PolicyDocument.Statement[0];

      // Should have required DynamoDB actions for enhanced functionality
      expect(dynamoPolicy.Action).toHaveLength(5); // Updated for enhanced template
      expect(dynamoPolicy.Action).toContain('dynamodb:PutItem');
      expect(dynamoPolicy.Action).toContain('dynamodb:GetItem');
      expect(dynamoPolicy.Action).toContain('dynamodb:UpdateItem');
      expect(dynamoPolicy.Action).toContain('dynamodb:Query');
      expect(dynamoPolicy.Action).toContain('dynamodb:BatchGetItem');

      // Should reference specific table ARN, not wildcard
      expect(dynamoPolicy.Resource).toHaveLength(2); // Table + indexes
    });

    test('should have comprehensive encryption enabled', () => {
      // DynamoDB encryption with KMS
      expect(
        template.Resources.OrdersTable.Properties.SSESpecification.SSEEnabled
      ).toBe(true);
      expect(
        template.Resources.OrdersTable.Properties.SSESpecification.SSEType
      ).toBe('KMS');

      // SQS encryption
      expect(
        template.Resources.DeadLetterQueue.Properties.KmsMasterKeyId
      ).toBeDefined();

      // SNS encryption
      expect(
        template.Resources.AlertingTopic.Properties.KmsMasterKeyId
      ).toBeDefined();

      // CloudWatch Logs encryption
      expect(
        template.Resources.ApiGatewayLogGroup.Properties.KmsKeyId
      ).toBeDefined();
      expect(
        template.Resources.LambdaLogGroup.Properties.KmsKeyId
      ).toBeDefined();
    });

    test('should have appropriate deletion policies', () => {
      // For test environments, resources should be deletable
      expect(template.Resources.OrdersTable.DeletionPolicy).toBe('Delete');
      expect(template.Resources.ApiGatewayLogGroup.DeletionPolicy).toBe(
        'Delete'
      );
      expect(template.Resources.LambdaLogGroup.DeletionPolicy).toBe('Delete');
    });
  });

  describe('Resource Count Validation', () => {
    test('should have expected number of resources for enhanced template', () => {
      const resources = Object.keys(template.Resources);
      // Enhanced template has many more resources than basic template
      expect(resources.length).toBeGreaterThan(15);
    });

    test('should have expected number of outputs for enhanced template', () => {
      const outputs = Object.keys(template.Outputs);
      // Enhanced template has 8 outputs
      expect(outputs.length).toBe(8);
    });
  });
});
