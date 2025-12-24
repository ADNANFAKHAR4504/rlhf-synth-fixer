import fs from 'fs';
import path from 'path';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'prod';

describe('TapStack CloudFormation Template', () => {
  let template: any;

  beforeAll(() => {
    const templatePath = path.join(__dirname, '../lib/TapStack.json');
    const templateContent = fs.readFileSync(templatePath, 'utf8');
    template = JSON.parse(templateContent);
  });

  describe('Template Structure', () => {
    test('should have valid CloudFormation format version', () => {
      expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
    });

    test('should have correct description', () => {
      expect(template.Description).toBe(
        'Serverless image processing service with S3, Lambda, DynamoDB, and API Gateway - Enhanced with security and performance best practices'
      );
    });

    test('should have metadata section with interface', () => {
      expect(template.Metadata).toBeDefined();
      expect(template.Metadata['AWS::CloudFormation::Interface']).toBeDefined();

      const interface_ = template.Metadata['AWS::CloudFormation::Interface'];
      expect(interface_.ParameterGroups).toBeDefined();
      expect(interface_.ParameterLabels).toBeDefined();
    });

    test('should have correct parameter groups', () => {
      const interface_ = template.Metadata['AWS::CloudFormation::Interface'];
      const groups = interface_.ParameterGroups;

      expect(groups).toHaveLength(3);
      expect(groups[0].Label.default).toBe('Environment Configuration');
      expect(groups[1].Label.default).toBe('Logging Configuration');
      expect(groups[2].Label.default).toBe('Performance Configuration');
    });

    test('should have correct parameter labels', () => {
      const interface_ = template.Metadata['AWS::CloudFormation::Interface'];
      const labels = interface_.ParameterLabels;

      expect(labels.EnvironmentSuffix.default).toBe(
        'Environment Suffix (e.g., dev, staging, prod)'
      );
      expect(labels.LogRetentionInDays.default).toBe(
        'CloudWatch Logs Retention Period'
      );
      expect(labels.LambdaMemorySize.default).toBe('Lambda Memory Allocation');
      expect(labels.LambdaTimeout.default).toBe('Lambda Timeout');
    });
  });

  describe('Parameters', () => {
    test('should have EnvironmentSuffix parameter', () => {
      const param = template.Parameters.EnvironmentSuffix;
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('prod');
      expect(param.Description).toBe(
        'Environment suffix for resource naming and tagging'
      );
    });

    test('should have LogRetentionInDays parameter', () => {
      const param = template.Parameters.LogRetentionInDays;
      expect(param.Type).toBe('Number');
      expect(param.Default).toBe(30);
      expect(param.AllowedValues).toContain(1);
      expect(param.AllowedValues).toContain(365);
      expect(param.AllowedValues).toContain(3653);
      expect(param.Description).toBe(
        'CloudWatch Logs retention period in days for compliance'
      );
    });

    test('should have LambdaMemorySize parameter', () => {
      const param = template.Parameters.LambdaMemorySize;
      expect(param.Type).toBe('Number');
      expect(param.Default).toBe(1024);
      expect(param.MinValue).toBe(128);
      expect(param.MaxValue).toBe(10240);
      expect(param.Description).toBe(
        'Memory allocation for Lambda function (MB)'
      );
    });

    test('should have LambdaTimeout parameter', () => {
      const param = template.Parameters.LambdaTimeout;
      expect(param.Type).toBe('Number');
      expect(param.Default).toBe(300);
      expect(param.MinValue).toBe(1);
      expect(param.MaxValue).toBe(900);
      expect(param.Description).toBe('Lambda function timeout in seconds');
    });
  });

  describe('DynamoDB Table Resources', () => {
    test('should have ImageProcessingTable resource', () => {
      expect(template.Resources.ImageProcessingTable).toBeDefined();
    });

    test('ImageProcessingTable should be DynamoDB table with correct properties', () => {
      const table = template.Resources.ImageProcessingTable;
      expect(table.Type).toBe('AWS::DynamoDB::Table');

      const props = table.Properties;
      expect(props.TableName).toEqual({
        'Fn::Sub': 'image-processing-${EnvironmentSuffix}',
      });
      expect(props.BillingMode).toBe('PAY_PER_REQUEST');
      expect(
        props.PointInTimeRecoverySpecification.PointInTimeRecoveryEnabled
      ).toBe(true);
      expect(props.SSESpecification.SSEEnabled).toBe(true);
      expect(props.StreamSpecification.StreamViewType).toBe(
        'NEW_AND_OLD_IMAGES'
      );
      expect(props.DeletionProtectionEnabled).toBe(false);
    });

    test('ImageProcessingTable should have correct attribute definitions', () => {
      const table = template.Resources.ImageProcessingTable;
      const attrs = table.Properties.AttributeDefinitions;

      expect(attrs).toHaveLength(2);
      expect(attrs[0].AttributeName).toBe('ImageID');
      expect(attrs[0].AttributeType).toBe('S');
      expect(attrs[1].AttributeName).toBe('ProcessedAt');
      expect(attrs[1].AttributeType).toBe('S');
    });

    test('ImageProcessingTable should have correct key schema', () => {
      const table = template.Resources.ImageProcessingTable;
      const keySchema = table.Properties.KeySchema;

      expect(keySchema).toHaveLength(1);
      expect(keySchema[0].AttributeName).toBe('ImageID');
      expect(keySchema[0].KeyType).toBe('HASH');
    });

    test('ImageProcessingTable should have correct GSI', () => {
      const table = template.Resources.ImageProcessingTable;
      const gsis = table.Properties.GlobalSecondaryIndexes;

      expect(gsis).toHaveLength(1);
      expect(gsis[0].IndexName).toBe('ProcessedAtIndex');
      expect(gsis[0].KeySchema[0].AttributeName).toBe('ProcessedAt');
      expect(gsis[0].KeySchema[0].KeyType).toBe('HASH');
      expect(gsis[0].Projection.ProjectionType).toBe('ALL');
    });

    test('ImageProcessingTable should have correct tags', () => {
      const table = template.Resources.ImageProcessingTable;
      const tags = table.Properties.Tags;

      expect(tags).toHaveLength(4);
      expect(tags[0].Key).toBe('Environment');
      expect(tags[1].Key).toBe('Project');
      expect(tags[2].Key).toBe('ManagedBy');
      expect(tags[3].Key).toBe('StackName');
    });
  });

  describe('IAM Role Resources', () => {
    test('should have ImageProcessorRole resource', () => {
      expect(template.Resources.ImageProcessorRole).toBeDefined();
    });

    test('ImageProcessorRole should have correct properties', () => {
      const role = template.Resources.ImageProcessorRole;
      expect(role.Type).toBe('AWS::IAM::Role');

      const props = role.Properties;
      expect(props.RoleName).toEqual({
        'Fn::Sub': 'image-processor-role-${EnvironmentSuffix}',
      });
      expect(props.AssumeRolePolicyDocument.Version).toBe('2012-10-17');
      expect(props.ManagedPolicyArns).toContain(
        'arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole'
      );
    });

    test('ImageProcessorRole should have correct assume role policy', () => {
      const role = template.Resources.ImageProcessorRole;
      const assumePolicy = role.Properties.AssumeRolePolicyDocument;

      expect(assumePolicy.Statement).toHaveLength(1);
      expect(assumePolicy.Statement[0].Effect).toBe('Allow');
      expect(assumePolicy.Statement[0].Principal.Service).toBe(
        'lambda.amazonaws.com'
      );
      expect(assumePolicy.Statement[0].Action).toBe('sts:AssumeRole');
    });

    test('ImageProcessorRole should have correct inline policies', () => {
      const role = template.Resources.ImageProcessorRole;
      const policies = role.Properties.Policies;

      expect(policies).toHaveLength(1);
      expect(policies[0].PolicyName).toBe('ImageProcessorPolicy');
      expect(policies[0].PolicyDocument.Version).toBe('2012-10-17');

      const statements = policies[0].PolicyDocument.Statement;
      expect(statements).toHaveLength(6);

      // S3 permissions
      expect(statements[0].Effect).toBe('Allow');
      expect(statements[0].Action).toContain('s3:GetObject');
      expect(statements[0].Action).toContain('s3:GetObjectVersion');

      // DynamoDB permissions
      expect(statements[2].Effect).toBe('Allow');
      expect(statements[2].Action).toContain('dynamodb:PutItem');
      expect(statements[2].Action).toContain('dynamodb:UpdateItem');

      // CloudWatch Logs permissions
      expect(statements[3].Effect).toBe('Allow');
      expect(statements[3].Action).toContain('logs:CreateLogGroup');
      expect(statements[3].Action).toContain('logs:PutLogEvents');

      // X-Ray permissions
      expect(statements[4].Effect).toBe('Allow');
      expect(statements[4].Action).toContain('xray:PutTraceSegments');

      // SQS permissions
      expect(statements[5].Effect).toBe('Allow');
      expect(statements[5].Action).toContain('sqs:SendMessage');
    });
  });

  describe('CloudWatch Logs Resources', () => {
    test('should have ImageProcessorLogGroup resource', () => {
      expect(template.Resources.ImageProcessorLogGroup).toBeDefined();
    });

    test('ImageProcessorLogGroup should have correct properties', () => {
      const logGroup = template.Resources.ImageProcessorLogGroup;
      expect(logGroup.Type).toBe('AWS::Logs::LogGroup');

      const props = logGroup.Properties;
      expect(props.LogGroupName).toEqual({
        'Fn::Sub': '/aws/lambda/image-processor-${EnvironmentSuffix}',
      });
      expect(props.RetentionInDays).toEqual({ Ref: 'LogRetentionInDays' });
      expect(props.KmsKeyId).toEqual({
        'Fn::GetAtt': ['LogGroupKMSKey', 'Arn'],
      });
    });

    test('should have LogGroupKMSKey resource', () => {
      expect(template.Resources.LogGroupKMSKey).toBeDefined();
    });

    test('LogGroupKMSKey should have correct properties', () => {
      const kmsKey = template.Resources.LogGroupKMSKey;
      expect(kmsKey.Type).toBe('AWS::KMS::Key');

      const props = kmsKey.Properties;
      expect(props.Description).toEqual({
        'Fn::Sub':
          'KMS Key for encrypting CloudWatch Logs - ${EnvironmentSuffix}',
      });
      expect(props.KeyPolicy.Version).toBe('2012-10-17');
    });

    test('LogGroupKMSKey should have correct key policy', () => {
      const kmsKey = template.Resources.LogGroupKMSKey;
      const keyPolicy = kmsKey.Properties.KeyPolicy;

      expect(keyPolicy.Statement).toHaveLength(2);

      // Root account access
      expect(keyPolicy.Statement[0].Effect).toBe('Allow');
      expect(keyPolicy.Statement[0].Principal.AWS).toEqual({
        'Fn::Sub': 'arn:aws:iam::${AWS::AccountId}:root',
      });
      expect(keyPolicy.Statement[0].Action).toContain('kms:*');

      // CloudWatch Logs service access
      expect(keyPolicy.Statement[1].Effect).toBe('Allow');
      expect(keyPolicy.Statement[1].Principal.Service).toEqual({
        'Fn::Sub': 'logs.${AWS::Region}.amazonaws.com',
      });
      expect(keyPolicy.Statement[1].Action).toContain('kms:Encrypt');
      expect(keyPolicy.Statement[1].Action).toContain('kms:Decrypt');
    });

    test('should have LogGroupKMSKeyAlias resource', () => {
      expect(template.Resources.LogGroupKMSKeyAlias).toBeDefined();
    });

    test('LogGroupKMSKeyAlias should have correct properties', () => {
      const alias = template.Resources.LogGroupKMSKeyAlias;
      expect(alias.Type).toBe('AWS::KMS::Alias');

      const props = alias.Properties;
      expect(props.AliasName).toEqual({
        'Fn::Sub': 'alias/logs-key-${EnvironmentSuffix}',
      });
      expect(props.TargetKeyId).toEqual({ Ref: 'LogGroupKMSKey' });
    });
  });

  describe('SQS Resources', () => {
    test('should have ImageProcessorDLQ resource', () => {
      expect(template.Resources.ImageProcessorDLQ).toBeDefined();
    });

    test('ImageProcessorDLQ should have correct properties', () => {
      const dlq = template.Resources.ImageProcessorDLQ;
      expect(dlq.Type).toBe('AWS::SQS::Queue');

      const props = dlq.Properties;
      expect(props.QueueName).toEqual({
        'Fn::Sub': 'image-processor-dlq-${EnvironmentSuffix}',
      });
      expect(props.MessageRetentionPeriod).toBe(1209600);
      expect(props.KmsMasterKeyId).toBe('alias/aws/sqs');
    });
  });

  describe('Lambda Function Resources', () => {
    test('should have ImageProcessorFunction resource', () => {
      expect(template.Resources.ImageProcessorFunction).toBeDefined();
    });

    test('ImageProcessorFunction should have correct properties', () => {
      const lambda = template.Resources.ImageProcessorFunction;
      expect(lambda.Type).toBe('AWS::Lambda::Function');
      expect(lambda.DependsOn).toBe('ImageProcessorLogGroup');

      const props = lambda.Properties;
      expect(props.FunctionName).toEqual({
        'Fn::Sub': 'image-processor-${EnvironmentSuffix}',
      });
      expect(props.Runtime).toBe('python3.12');
      expect(props.Handler).toBe('index.lambda_handler');
      expect(props.Role).toEqual({
        'Fn::GetAtt': ['ImageProcessorRole', 'Arn'],
      });
      expect(props.Timeout).toEqual({ Ref: 'LambdaTimeout' });
      expect(props.MemorySize).toEqual({ Ref: 'LambdaMemorySize' });
      expect(props.TracingConfig.Mode).toBe('Active');
    });

    test('ImageProcessorFunction should have correct dead letter config', () => {
      const lambda = template.Resources.ImageProcessorFunction;
      const dlq = lambda.Properties.DeadLetterConfig;

      expect(dlq.TargetArn).toEqual({
        'Fn::GetAtt': ['ImageProcessorDLQ', 'Arn'],
      });
    });

    test('ImageProcessorFunction should have correct environment variables', () => {
      const lambda = template.Resources.ImageProcessorFunction;
      const env = lambda.Properties.Environment.Variables;

      expect(env.DYNAMODB_TABLE).toEqual({ Ref: 'ImageProcessingTable' });
      expect(env.LOG_LEVEL).toBe('INFO');
      expect(env.POWERTOOLS_SERVICE_NAME).toBe('image-processor');
      expect(env.POWERTOOLS_METRICS_NAMESPACE).toBe('ServerlessApp');
      expect(env.ENVIRONMENT).toEqual({ Ref: 'EnvironmentSuffix' });
    });

    test('ImageProcessorFunction should have embedded code', () => {
      const lambda = template.Resources.ImageProcessorFunction;
      const code = lambda.Properties.Code.ZipFile;

      expect(typeof code).toBe('string');
      expect(code).toContain('import json');
      expect(code).toContain('import boto3');
      expect(code).toContain('def lambda_handler');
      expect(code).toContain('process_image_from_s3');
    });
  });

  describe('S3 Bucket Resources', () => {
    test('should have ImageUploadBucket resource', () => {
      expect(template.Resources.ImageUploadBucket).toBeDefined();
    });

    test('ImageUploadBucket should have correct properties', () => {
      const bucket = template.Resources.ImageUploadBucket;
      expect(bucket.Type).toBe('AWS::S3::Bucket');

      const props = bucket.Properties;
      expect(props.BucketName).toEqual({
        'Fn::Sub': 'image-uploads-${AWS::AccountId}-${EnvironmentSuffix}',
      });
      expect(props.VersioningConfiguration.Status).toBe('Enabled');
      expect(props.PublicAccessBlockConfiguration.BlockPublicAcls).toBe(true);
      expect(props.PublicAccessBlockConfiguration.BlockPublicPolicy).toBe(true);
      expect(props.PublicAccessBlockConfiguration.IgnorePublicAcls).toBe(true);
      expect(props.PublicAccessBlockConfiguration.RestrictPublicBuckets).toBe(
        true
      );
    });

    test('ImageUploadBucket should have encryption configuration', () => {
      const bucket = template.Resources.ImageUploadBucket;
      const encryption =
        bucket.Properties.BucketEncryption.ServerSideEncryptionConfiguration[0];

      expect(encryption.ServerSideEncryptionByDefault.SSEAlgorithm).toBe(
        'AES256'
      );
      expect(encryption.BucketKeyEnabled).toBe(true);
    });

    test('ImageUploadBucket should have lifecycle configuration', () => {
      const bucket = template.Resources.ImageUploadBucket;
      const lifecycle = bucket.Properties.LifecycleConfiguration.Rules;

      expect(lifecycle).toHaveLength(2);

      // Transition rule
      expect(lifecycle[0].Id).toBe('TransitionNonCurrentVersions');
      expect(lifecycle[0].Status).toBe('Enabled');
      expect(lifecycle[0].NoncurrentVersionTransitions).toHaveLength(2);

      // Cleanup rule
      expect(lifecycle[1].Id).toBe('DeleteIncompleteMultipartUploads');
      expect(lifecycle[1].Status).toBe('Enabled');
      expect(
        lifecycle[1].AbortIncompleteMultipartUpload.DaysAfterInitiation
      ).toBe(1);
    });
  });

  describe('EventBridge Resources', () => {
    test('should have S3ObjectCreatedRule resource', () => {
      expect(template.Resources.S3ObjectCreatedRule).toBeDefined();
    });

    test('S3ObjectCreatedRule should have correct properties', () => {
      const rule = template.Resources.S3ObjectCreatedRule;
      expect(rule.Type).toBe('AWS::Events::Rule');

      const props = rule.Properties;
      expect(props.Name).toEqual({
        'Fn::Sub': 's3-object-created-${EnvironmentSuffix}',
      });
      expect(props.Description).toEqual({
        'Fn::Sub':
          'Triggers Lambda when images are uploaded to S3 - ${EnvironmentSuffix}',
      });
      expect(props.State).toBe('ENABLED');
    });

    test('S3ObjectCreatedRule should have correct event pattern', () => {
      const rule = template.Resources.S3ObjectCreatedRule;
      const pattern = rule.Properties.EventPattern;

      expect(pattern.source).toEqual(['aws.s3']);
      expect(pattern['detail-type']).toEqual(['Object Created']);
      expect(pattern.detail.bucket.name).toEqual([
        { Ref: 'ImageUploadBucket' },
      ]);
      expect(pattern.detail.object.key).toHaveLength(4);
      expect(pattern.detail.object.key).toContainEqual({ suffix: '.jpg' });
      expect(pattern.detail.object.key).toContainEqual({ suffix: '.png' });
    });

    test('S3ObjectCreatedRule should have correct target', () => {
      const rule = template.Resources.S3ObjectCreatedRule;
      const targets = rule.Properties.Targets;

      expect(targets).toHaveLength(1);
      expect(targets[0].Id).toBe('ImageProcessorTarget');
      expect(targets[0].Arn).toEqual({
        'Fn::GetAtt': ['ImageProcessorFunction', 'Arn'],
      });
    });
  });

  describe('Lambda Permission Resources', () => {
    test('should have EventBridgeInvokeLambdaPermission resource', () => {
      expect(
        template.Resources.EventBridgeInvokeLambdaPermission
      ).toBeDefined();
    });

    test('EventBridgeInvokeLambdaPermission should have correct properties', () => {
      const permission = template.Resources.EventBridgeInvokeLambdaPermission;
      expect(permission.Type).toBe('AWS::Lambda::Permission');

      const props = permission.Properties;
      expect(props.Action).toBe('lambda:InvokeFunction');
      expect(props.FunctionName).toEqual({ Ref: 'ImageProcessorFunction' });
      expect(props.Principal).toBe('events.amazonaws.com');
      expect(props.SourceArn).toEqual({
        'Fn::GetAtt': ['S3ObjectCreatedRule', 'Arn'],
      });
    });

    test('should have ApiGatewayInvokeLambdaPermission resource', () => {
      expect(template.Resources.ApiGatewayInvokeLambdaPermission).toBeDefined();
    });

    test('ApiGatewayInvokeLambdaPermission should have correct properties', () => {
      const permission = template.Resources.ApiGatewayInvokeLambdaPermission;
      expect(permission.Type).toBe('AWS::Lambda::Permission');

      const props = permission.Properties;
      expect(props.Action).toBe('lambda:InvokeFunction');
      expect(props.FunctionName).toEqual({ Ref: 'ImageProcessorFunction' });
      expect(props.Principal).toBe('apigateway.amazonaws.com');
      expect(props.SourceArn).toEqual({
        'Fn::Sub':
          'arn:aws:execute-api:${AWS::Region}:${AWS::AccountId}:${ImageProcessingApi}/*/POST/process-image',
      });
    });
  });

  describe('API Gateway Resources', () => {
    test('should have ImageProcessingApi resource', () => {
      expect(template.Resources.ImageProcessingApi).toBeDefined();
    });

    test('ImageProcessingApi should have correct properties', () => {
      const api = template.Resources.ImageProcessingApi;
      expect(api.Type).toBe('AWS::ApiGateway::RestApi');

      const props = api.Properties;
      expect(props.Name).toEqual({
        'Fn::Sub': 'image-processing-api-${EnvironmentSuffix}',
      });
      expect(props.Description).toEqual({
        'Fn::Sub':
          'API for manual image processing triggers with enhanced security - ${EnvironmentSuffix}',
      });
      expect(props.EndpointConfiguration.Types).toEqual(['REGIONAL']);
    });

    test('ImageProcessingApi should have resource policy', () => {
      const api = template.Resources.ImageProcessingApi;
      const policy = api.Properties.Policy;

      expect(policy.Version).toBe('2012-10-17');
      expect(policy.Statement[0].Effect).toBe('Allow');
      expect(policy.Statement[0].Principal).toBe('*');
      expect(policy.Statement[0].Action).toBe('execute-api:Invoke');
    });

    test('should have ApiRequestValidator resource', () => {
      expect(template.Resources.ApiRequestValidator).toBeDefined();
    });

    test('ApiRequestValidator should have correct properties', () => {
      const validator = template.Resources.ApiRequestValidator;
      expect(validator.Type).toBe('AWS::ApiGateway::RequestValidator');

      const props = validator.Properties;
      expect(props.RestApiId).toEqual({ Ref: 'ImageProcessingApi' });
      expect(props.ValidateRequestBody).toBe(true);
      expect(props.ValidateRequestParameters).toBe(true);
    });

    test('should have ImageProcessingModel resource', () => {
      expect(template.Resources.ImageProcessingModel).toBeDefined();
    });

    test('ImageProcessingModel should have correct properties', () => {
      const model = template.Resources.ImageProcessingModel;
      expect(model.Type).toBe('AWS::ApiGateway::Model');

      const props = model.Properties;
      expect(props.RestApiId).toEqual({ Ref: 'ImageProcessingApi' });
      expect(props.ContentType).toBe('application/json');
      expect(props.Schema.type).toBe('object');
      expect(props.Schema.properties.key).toBeDefined();
      expect(props.Schema.properties.bucket).toBeDefined();
      expect(props.Schema.required).toContain('key');
    });

    test('should have ProcessImageResource resource', () => {
      expect(template.Resources.ProcessImageResource).toBeDefined();
    });

    test('ProcessImageResource should have correct properties', () => {
      const resource = template.Resources.ProcessImageResource;
      expect(resource.Type).toBe('AWS::ApiGateway::Resource');

      const props = resource.Properties;
      expect(props.RestApiId).toEqual({ Ref: 'ImageProcessingApi' });
      expect(props.PathPart).toBe('process-image');
    });

    test('should have ProcessImageMethod resource', () => {
      expect(template.Resources.ProcessImageMethod).toBeDefined();
    });

    test('ProcessImageMethod should have correct properties', () => {
      const method = template.Resources.ProcessImageMethod;
      expect(method.Type).toBe('AWS::ApiGateway::Method');

      const props = method.Properties;
      expect(props.RestApiId).toEqual({ Ref: 'ImageProcessingApi' });
      expect(props.HttpMethod).toBe('POST');
      expect(props.AuthorizationType).toBe('NONE');
      expect(props.RequestValidatorId).toEqual({ Ref: 'ApiRequestValidator' });
    });

    test('ProcessImageMethod should have correct integration', () => {
      const method = template.Resources.ProcessImageMethod;
      const integration = method.Properties.Integration;

      expect(integration.Type).toBe('AWS_PROXY');
      expect(integration.IntegrationHttpMethod).toBe('POST');
      expect(integration.Uri).toEqual({
        'Fn::Sub':
          'arn:aws:apigateway:${AWS::Region}:lambda:path/2015-03-31/functions/${ImageProcessorFunction.Arn}/invocations',
      });
    });

    test('should have ApiUsagePlan resource', () => {
      expect(template.Resources.ApiUsagePlan).toBeDefined();
    });

    test('ApiUsagePlan should have correct properties', () => {
      const usagePlan = template.Resources.ApiUsagePlan;
      expect(usagePlan.Type).toBe('AWS::ApiGateway::UsagePlan');
      expect(usagePlan.DependsOn).toBe('ApiDeployment');

      const props = usagePlan.Properties;
      expect(props.UsagePlanName).toEqual({
        'Fn::Sub': 'usage-plan-${EnvironmentSuffix}',
      });
      expect(props.Throttle.RateLimit).toBe(100);
      expect(props.Throttle.BurstLimit).toBe(200);
      expect(props.Quota.Limit).toBe(10000);
      expect(props.Quota.Period).toBe('DAY');
    });

    test('should have ApiKey resource', () => {
      expect(template.Resources.ApiKey).toBeDefined();
    });

    test('ApiKey should have correct properties', () => {
      const apiKey = template.Resources.ApiKey;
      expect(apiKey.Type).toBe('AWS::ApiGateway::ApiKey');

      const props = apiKey.Properties;
      expect(props.Name).toEqual({
        'Fn::Sub': 'api-key-${EnvironmentSuffix}',
      });
      expect(props.Enabled).toBe(true);
    });

    test('should have ApiUsagePlanKey resource', () => {
      expect(template.Resources.ApiUsagePlanKey).toBeDefined();
    });

    test('ApiUsagePlanKey should have correct properties', () => {
      const usagePlanKey = template.Resources.ApiUsagePlanKey;
      expect(usagePlanKey.Type).toBe('AWS::ApiGateway::UsagePlanKey');

      const props = usagePlanKey.Properties;
      expect(props.KeyId).toEqual({ Ref: 'ApiKey' });
      expect(props.KeyType).toBe('API_KEY');
      expect(props.UsagePlanId).toEqual({ Ref: 'ApiUsagePlan' });
    });

    test('should have ApiDeployment resource', () => {
      expect(template.Resources.ApiDeployment).toBeDefined();
    });

    test('ApiDeployment should have correct properties', () => {
      const deployment = template.Resources.ApiDeployment;
      expect(deployment.Type).toBe('AWS::ApiGateway::Deployment');
      expect(deployment.DependsOn).toBe('ProcessImageMethod');

      const props = deployment.Properties;
      expect(props.RestApiId).toEqual({ Ref: 'ImageProcessingApi' });
      expect(props.StageName).toBe('prod');
    });
  });

  describe('Outputs', () => {
    test('should have all required outputs', () => {
      const expectedOutputs = [
        'S3BucketName',
        'S3BucketArn',
        'DynamoDBTableName',
        'DynamoDBTableArn',
        'LambdaFunctionName',
        'LambdaFunctionArn',
        'LambdaRoleArn',
        'ApiGatewayEndpoint',
        'ApiGatewayId',
        'ApiKeyId',
        'CloudWatchLogGroup',
        'DeadLetterQueueUrl',
        'DeadLetterQueueArn',
        'KMSKeyArn',
        'StackRegion',
        'StackId',
        'EnvironmentSuffixOutput',
        'LogRetentionDays',
        'LambdaMemoryConfiguration',
        'LambdaTimeoutConfiguration',
      ];

      expectedOutputs.forEach(outputName => {
        expect(template.Outputs[outputName]).toBeDefined();
      });
    });

    test('S3 outputs should be correct', () => {
      expect(template.Outputs.S3BucketName.Value).toEqual({
        Ref: 'ImageUploadBucket',
      });
      expect(template.Outputs.S3BucketArn.Value).toEqual({
        'Fn::GetAtt': ['ImageUploadBucket', 'Arn'],
      });
    });

    test('DynamoDB outputs should be correct', () => {
      expect(template.Outputs.DynamoDBTableName.Value).toEqual({
        Ref: 'ImageProcessingTable',
      });
      expect(template.Outputs.DynamoDBTableArn.Value).toEqual({
        'Fn::GetAtt': ['ImageProcessingTable', 'Arn'],
      });
    });

    test('Lambda outputs should be correct', () => {
      expect(template.Outputs.LambdaFunctionName.Value).toEqual({
        Ref: 'ImageProcessorFunction',
      });
      expect(template.Outputs.LambdaFunctionArn.Value).toEqual({
        'Fn::GetAtt': ['ImageProcessorFunction', 'Arn'],
      });
      expect(template.Outputs.LambdaRoleArn.Value).toEqual({
        'Fn::GetAtt': ['ImageProcessorRole', 'Arn'],
      });
    });

    test('API Gateway outputs should be correct', () => {
      expect(template.Outputs.ApiGatewayEndpoint.Value).toEqual({
        'Fn::Sub':
          'https://${ImageProcessingApi}.execute-api.${AWS::Region}.amazonaws.com/prod/process-image',
      });
      expect(template.Outputs.ApiGatewayId.Value).toEqual({
        Ref: 'ImageProcessingApi',
      });
      expect(template.Outputs.ApiKeyId.Value).toEqual({ Ref: 'ApiKey' });
    });

    test('CloudWatch and SQS outputs should be correct', () => {
      expect(template.Outputs.CloudWatchLogGroup.Value).toEqual({
        Ref: 'ImageProcessorLogGroup',
      });
      expect(template.Outputs.DeadLetterQueueUrl.Value).toEqual({
        Ref: 'ImageProcessorDLQ',
      });
      expect(template.Outputs.DeadLetterQueueArn.Value).toEqual({
        'Fn::GetAtt': ['ImageProcessorDLQ', 'Arn'],
      });
    });

    test('KMS output should be correct', () => {
      expect(template.Outputs.KMSKeyArn.Value).toEqual({
        'Fn::GetAtt': ['LogGroupKMSKey', 'Arn'],
      });
    });

    test('Stack metadata outputs should be correct', () => {
      expect(template.Outputs.StackRegion.Value).toEqual({
        Ref: 'AWS::Region',
      });
      expect(template.Outputs.StackId.Value).toEqual({ Ref: 'AWS::StackId' });
      expect(template.Outputs.EnvironmentSuffixOutput.Value).toEqual({
        Ref: 'EnvironmentSuffix',
      });
    });

    test('Configuration outputs should be correct', () => {
      expect(template.Outputs.LogRetentionDays.Value).toEqual({
        Ref: 'LogRetentionInDays',
      });
      expect(template.Outputs.LambdaMemoryConfiguration.Value).toEqual({
        Ref: 'LambdaMemorySize',
      });
      expect(template.Outputs.LambdaTimeoutConfiguration.Value).toEqual({
        Ref: 'LambdaTimeout',
      });
    });
  });

  describe('Resource Dependencies and Relationships', () => {
    test('Lambda function should depend on log group', () => {
      const lambda = template.Resources.ImageProcessorFunction;
      expect(lambda.DependsOn).toBe('ImageProcessorLogGroup');
    });

    test('API deployment should depend on method', () => {
      const deployment = template.Resources.ApiDeployment;
      expect(deployment.DependsOn).toBe('ProcessImageMethod');
    });

    test('Usage plan should depend on deployment', () => {
      const usagePlan = template.Resources.ApiUsagePlan;
      expect(usagePlan.DependsOn).toBe('ApiDeployment');
    });

    test('Resources should reference each other correctly', () => {
      // Lambda references IAM role
      const lambda = template.Resources.ImageProcessorFunction;
      expect(lambda.Properties.Role).toEqual({
        'Fn::GetAtt': ['ImageProcessorRole', 'Arn'],
      });

      // Log group references KMS key
      const logGroup = template.Resources.ImageProcessorLogGroup;
      expect(logGroup.Properties.KmsKeyId).toEqual({
        'Fn::GetAtt': ['LogGroupKMSKey', 'Arn'],
      });

      // EventBridge rule references Lambda
      const rule = template.Resources.S3ObjectCreatedRule;
      expect(rule.Properties.Targets[0].Arn).toEqual({
        'Fn::GetAtt': ['ImageProcessorFunction', 'Arn'],
      });
    });
  });

  describe('Security and Compliance', () => {
    test('S3 bucket should have public access blocked', () => {
      const bucket = template.Resources.ImageUploadBucket;
      const publicAccess = bucket.Properties.PublicAccessBlockConfiguration;

      expect(publicAccess.BlockPublicAcls).toBe(true);
      expect(publicAccess.BlockPublicPolicy).toBe(true);
      expect(publicAccess.IgnorePublicAcls).toBe(true);
      expect(publicAccess.RestrictPublicBuckets).toBe(true);
    });

    test('S3 bucket should have encryption enabled', () => {
      const bucket = template.Resources.ImageUploadBucket;
      const encryption = bucket.Properties.BucketEncryption;

      expect(encryption.ServerSideEncryptionConfiguration).toBeDefined();
      expect(
        encryption.ServerSideEncryptionConfiguration[0]
          .ServerSideEncryptionByDefault.SSEAlgorithm
      ).toBe('AES256');
    });

    test('DynamoDB table should have encryption enabled', () => {
      const table = template.Resources.ImageProcessingTable;
      expect(table.Properties.SSESpecification.SSEEnabled).toBe(true);
    });

    test('DynamoDB table should have point-in-time recovery enabled', () => {
      const table = template.Resources.ImageProcessingTable;
      expect(
        table.Properties.PointInTimeRecoverySpecification
          .PointInTimeRecoveryEnabled
      ).toBe(true);
    });

    test('Lambda function should have X-Ray tracing enabled', () => {
      const lambda = template.Resources.ImageProcessorFunction;
      expect(lambda.Properties.TracingConfig.Mode).toBe('Active');
    });

    test('KMS key should have restrictive policy', () => {
      const kmsKey = template.Resources.LogGroupKMSKey;
      const policy = kmsKey.Properties.KeyPolicy;

      // Only root account and CloudWatch Logs service should have access
      expect(policy.Statement).toHaveLength(2);
      expect(policy.Statement[0].Principal.AWS).toEqual({
        'Fn::Sub': 'arn:aws:iam::${AWS::AccountId}:root',
      });
      expect(policy.Statement[1].Principal.Service).toEqual({
        'Fn::Sub': 'logs.${AWS::Region}.amazonaws.com',
      });
    });
  });

  describe('Performance and Scalability', () => {
    test('DynamoDB table should use on-demand billing', () => {
      const table = template.Resources.ImageProcessingTable;
      expect(table.Properties.BillingMode).toBe('PAY_PER_REQUEST');
    });

    test('Lambda function should have configurable memory and timeout', () => {
      const lambda = template.Resources.ImageProcessorFunction;
      expect(lambda.Properties.MemorySize).toEqual({ Ref: 'LambdaMemorySize' });
      expect(lambda.Properties.Timeout).toEqual({ Ref: 'LambdaTimeout' });
    });

    test('API Gateway should have throttling configured', () => {
      const usagePlan = template.Resources.ApiUsagePlan;
      expect(usagePlan.Properties.Throttle.RateLimit).toBe(100);
      expect(usagePlan.Properties.Throttle.BurstLimit).toBe(200);
    });

    test('S3 bucket should have lifecycle policies for cost optimization', () => {
      const bucket = template.Resources.ImageUploadBucket;
      const lifecycle = bucket.Properties.LifecycleConfiguration.Rules;

      // Should transition to cheaper storage classes
      expect(lifecycle[0].NoncurrentVersionTransitions).toHaveLength(2);
      expect(lifecycle[0].NoncurrentVersionTransitions[0].StorageClass).toBe(
        'STANDARD_IA'
      );
      expect(lifecycle[0].NoncurrentVersionTransitions[1].StorageClass).toBe(
        'GLACIER'
      );
    });
  });

  describe('Template Validation', () => {
    test('should have valid JSON structure', () => {
      expect(template).toBeDefined();
      expect(typeof template).toBe('object');
    });

    test('should not have any undefined or null required sections', () => {
      expect(template.AWSTemplateFormatVersion).not.toBeNull();
      expect(template.Description).not.toBeNull();
      expect(template.Parameters).not.toBeNull();
      expect(template.Resources).not.toBeNull();
      expect(template.Outputs).not.toBeNull();
    });

    test('should have correct number of resources', () => {
      const resourceCount = Object.keys(template.Resources).length;
      expect(resourceCount).toBe(20); // Total number of resources in the template
    });

    test('should have correct number of parameters', () => {
      const parameterCount = Object.keys(template.Parameters).length;
      expect(parameterCount).toBe(4);
    });

    test('should have correct number of outputs', () => {
      const outputCount = Object.keys(template.Outputs).length;
      expect(outputCount).toBe(20);
    });

    test('all resources should have required properties', () => {
      Object.keys(template.Resources).forEach(resourceName => {
        const resource = template.Resources[resourceName];
        expect(resource.Type).toBeDefined();
        expect(resource.Properties).toBeDefined();
      });
    });

    test('all parameters should have required properties', () => {
      Object.keys(template.Parameters).forEach(paramName => {
        const param = template.Parameters[paramName];
        expect(param.Type).toBeDefined();
        expect(param.Description).toBeDefined();
      });
    });

    test('all outputs should have required properties', () => {
      Object.keys(template.Outputs).forEach(outputName => {
        const output = template.Outputs[outputName];
        expect(output.Description).toBeDefined();
        expect(output.Value).toBeDefined();
      });
    });
  });
});
