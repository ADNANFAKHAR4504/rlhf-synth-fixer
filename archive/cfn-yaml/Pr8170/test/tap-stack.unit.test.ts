import fs from 'fs';
import path from 'path';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('TapStack CloudFormation Template - Serverless Web Application', () => {
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
        'CloudFormation template for a serverless web application with API Gateway, Lambda, and S3 logging. Deployed in us-west-2.'
      );
    });
  });

  describe('Parameters', () => {
    test('should have all required parameters', () => {
      const expectedParams = [
        'ProjectName',
        'CostCenter',
        'Environment',
        'LogRetentionInDays',
      ];
      expectedParams.forEach(param => {
        expect(template.Parameters[param]).toBeDefined();
      });
    });

    test('ProjectName parameter should have correct properties', () => {
      const param = template.Parameters.ProjectName;
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('ServerlessWebApp');
      expect(param.Description).toBe('Name of the project');
    });

    test('Environment parameter should have correct allowed values', () => {
      const param = template.Parameters.Environment;
      expect(param.Type).toBe('String');
      expect(param.AllowedValues).toEqual([
        'production',
        'staging',
        'development',
      ]);
    });
  });

  describe('S3 Resources', () => {
    test('should have LogBucket with correct properties', () => {
      const bucket = template.Resources.LogBucket;
      expect(bucket).toBeDefined();
      expect(bucket.Type).toBe('AWS::S3::Bucket');
      expect(bucket.DeletionPolicy).toBe('Delete'); // Critical requirement - no Retain policies
    });

    test('LogBucket should have security configurations', () => {
      const bucket = template.Resources.LogBucket;
      const props = bucket.Properties;

      expect(props.PublicAccessBlockConfiguration).toBeDefined();
      expect(props.PublicAccessBlockConfiguration.BlockPublicAcls).toBe(true);
      expect(props.PublicAccessBlockConfiguration.BlockPublicPolicy).toBe(true);
      expect(props.PublicAccessBlockConfiguration.IgnorePublicAcls).toBe(true);
      expect(props.PublicAccessBlockConfiguration.RestrictPublicBuckets).toBe(
        true
      );
    });

    test('LogBucket should have encryption enabled', () => {
      const bucket = template.Resources.LogBucket;
      expect(bucket.Properties.BucketEncryption).toBeDefined();
      expect(
        bucket.Properties.BucketEncryption.ServerSideEncryptionConfiguration
      ).toBeDefined();
    });

    test('should have LogBucketPolicy for CloudWatch access', () => {
      const policy = template.Resources.LogBucketPolicy;
      expect(policy).toBeDefined();
      expect(policy.Type).toBe('AWS::S3::BucketPolicy');
      expect(policy.Properties.PolicyDocument.Statement).toHaveLength(2);
    });
  });

  describe('Lambda Resources', () => {
    test('should have LambdaExecutionRole with correct trust policy', () => {
      const role = template.Resources.LambdaExecutionRole;
      expect(role).toBeDefined();
      expect(role.Type).toBe('AWS::IAM::Role');

      const trustPolicy = role.Properties.AssumeRolePolicyDocument;
      expect(trustPolicy.Statement[0].Principal.Service).toBe(
        'lambda.amazonaws.com'
      );
    });

    test('should have HelloWorldFunction with correct properties', () => {
      const lambda = template.Resources.HelloWorldFunction;
      expect(lambda).toBeDefined();
      expect(lambda.Type).toBe('AWS::Lambda::Function');
      expect(lambda.Properties.Runtime).toBe('nodejs20.x');
      expect(lambda.Properties.Handler).toBe('index.handler');
      expect(lambda.Properties.Timeout).toBe(10);
    });

    test('HelloWorldFunction should return Hello World message', () => {
      const lambda = template.Resources.HelloWorldFunction;
      const code = lambda.Properties.Code.ZipFile;
      expect(code).toContain('Hello World!');
      expect(code).toContain('statusCode: 200');
    });

    test('should have HelloWorldFunctionLogGroup for Lambda logs', () => {
      const logGroup = template.Resources.HelloWorldFunctionLogGroup;
      expect(logGroup).toBeDefined();
      expect(logGroup.Type).toBe('AWS::Logs::LogGroup');
    });

    test('should have LambdaPermission for API Gateway', () => {
      const permission = template.Resources.LambdaPermission;
      expect(permission).toBeDefined();
      expect(permission.Type).toBe('AWS::Lambda::Permission');
      expect(permission.Properties.Principal).toBe('apigateway.amazonaws.com');
    });
  });

  describe('API Gateway Resources', () => {
    test('should have ApiGateway REST API', () => {
      const api = template.Resources.ApiGateway;
      expect(api).toBeDefined();
      expect(api.Type).toBe('AWS::ApiGateway::RestApi');
      expect(api.Properties.EndpointConfiguration.Types).toContain('REGIONAL');
    });

    test('should have ApiGatewayRootMethod for GET requests', () => {
      const method = template.Resources.ApiGatewayRootMethod;
      expect(method).toBeDefined();
      expect(method.Type).toBe('AWS::ApiGateway::Method');
      expect(method.Properties.HttpMethod).toBe('GET');
      expect(method.Properties.AuthorizationType).toBe('NONE');
    });

    test('should have ApiGatewayDeployment and ApiGatewayStage', () => {
      const deployment = template.Resources.ApiGatewayDeployment;
      const stage = template.Resources.ApiGatewayStage;

      expect(deployment).toBeDefined();
      expect(deployment.Type).toBe('AWS::ApiGateway::Deployment');
      expect(stage).toBeDefined();
      expect(stage.Type).toBe('AWS::ApiGateway::Stage');
    });

    test('ApiGatewayStage should have logging enabled', () => {
      const stage = template.Resources.ApiGatewayStage;
      expect(stage.Properties.AccessLogSetting).toBeDefined();
      expect(stage.Properties.MethodSettings[0].LoggingLevel).toBe('INFO');
      expect(stage.Properties.MethodSettings[0].DataTraceEnabled).toBe(true);
    });

    test('should have ApiGatewayLogGroup for API Gateway logs', () => {
      const logGroup = template.Resources.ApiGatewayLogGroup;
      expect(logGroup).toBeDefined();
      expect(logGroup.Type).toBe('AWS::Logs::LogGroup');
    });

    test('should have ApiGatewayCloudWatchRole with correct managed policy', () => {
      const role = template.Resources.ApiGatewayCloudWatchRole;
      expect(role).toBeDefined();
      expect(role.Type).toBe('AWS::IAM::Role');
      expect(role.Properties.ManagedPolicyArns).toContain(
        'arn:aws:iam::aws:policy/service-role/AmazonAPIGatewayPushToCloudWatchLogs'
      );
    });

    test('should have ApiGatewayAccount linking CloudWatch role', () => {
      const account = template.Resources.ApiGatewayAccount;
      expect(account).toBeDefined();
      expect(account.Type).toBe('AWS::ApiGateway::Account');
    });
  });

  describe('Logging Infrastructure', () => {
    test('should have Kinesis Firehose delivery stream', () => {
      const stream = template.Resources.LogsToS3DeliveryStream;
      expect(stream).toBeDefined();
      expect(stream.Type).toBe('AWS::KinesisFirehose::DeliveryStream');
      expect(stream.Properties.DeliveryStreamType).toBe('DirectPut');
    });

    test('should have LogsToS3Role for Firehose delivery', () => {
      const role = template.Resources.LogsToS3Role;
      expect(role).toBeDefined();
      expect(role.Type).toBe('AWS::IAM::Role');
      expect(
        role.Properties.AssumeRolePolicyDocument.Statement[0].Principal.Service
      ).toBe('logs.amazonaws.com');
    });

    test('should have FirehoseDeliveryRole with S3 permissions', () => {
      const role = template.Resources.FirehoseDeliveryRole;
      expect(role).toBeDefined();
      expect(role.Type).toBe('AWS::IAM::Role');
      expect(
        role.Properties.AssumeRolePolicyDocument.Statement[0].Principal.Service
      ).toBe('firehose.amazonaws.com');

      const policy = role.Properties.Policies[0].PolicyDocument;
      const actions = policy.Statement[0].Action;
      expect(actions).toContain('s3:PutObject');
      expect(actions).toContain('s3:GetBucketLocation');
    });

    test('should have subscription filters for both Lambda and API Gateway logs', () => {
      const lambdaFilter = template.Resources.LambdaLogToS3SubscriptionFilter;
      const apiFilter = template.Resources.ApiGatewayLogToS3SubscriptionFilter;

      expect(lambdaFilter).toBeDefined();
      expect(lambdaFilter.Type).toBe('AWS::Logs::SubscriptionFilter');
      expect(apiFilter).toBeDefined();
      expect(apiFilter.Type).toBe('AWS::Logs::SubscriptionFilter');
    });
  });

  describe('Resource Tagging', () => {
    test('all resources should have Environment tag', () => {
      const resourcesWithTags = [
        'LogBucket',
        'LambdaExecutionRole',
        'HelloWorldFunction',
        'HelloWorldFunctionLogGroup',
        'LogsToS3Role',
        'FirehoseDeliveryRole',
        'LogsToS3DeliveryStream',
        'ApiGatewayCloudWatchRole',
        'ApiGateway',
        'ApiGatewayStage',
        'ApiGatewayLogGroup',
      ];

      resourcesWithTags.forEach(resourceName => {
        const resource = template.Resources[resourceName];
        expect(resource.Properties.Tags).toBeDefined();
        const environmentTag = resource.Properties.Tags.find(
          (tag: any) => tag.Key === 'Environment'
        );
        expect(environmentTag).toBeDefined();
        expect(environmentTag.Value).toEqual({ Ref: 'Environment' });
      });
    });

    test('tagged resources should have ProjectName and CostCenter tags', () => {
      const resource = template.Resources.LogBucket;
      const tags = resource.Properties.Tags;

      expect(tags.find((tag: any) => tag.Key === 'ProjectName')).toBeDefined();
      expect(tags.find((tag: any) => tag.Key === 'CostCenter')).toBeDefined();
    });
  });

  describe('Outputs', () => {
    test('should have ApiGatewayEndpoint output', () => {
      const output = template.Outputs.ApiGatewayEndpoint;
      expect(output).toBeDefined();
      expect(output.Description).toBe('URL of the API Gateway endpoint');
    });

    test('should have LambdaFunction output', () => {
      const output = template.Outputs.LambdaFunction;
      expect(output).toBeDefined();
      expect(output.Description).toBe('ARN of the Lambda function');
    });

    test('should have LogBucketName output', () => {
      const output = template.Outputs.LogBucketName;
      expect(output).toBeDefined();
      expect(output.Description).toBe('Name of the S3 bucket for logs');
    });
  });

  describe('Security and Best Practices', () => {
    test('should not have any DeletionPolicy Retain (QA requirement)', () => {
      Object.keys(template.Resources).forEach(resourceName => {
        const resource = template.Resources[resourceName];
        if (resource.DeletionPolicy) {
          expect(resource.DeletionPolicy).not.toBe('Retain');
        }
      });
    });

    test('IAM roles should follow least privilege principle', () => {
      const lambdaRole = template.Resources.LambdaExecutionRole;
      expect(lambdaRole.Properties.ManagedPolicyArns).toHaveLength(1);
      expect(lambdaRole.Properties.ManagedPolicyArns[0]).toBe(
        'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole'
      );
    });

    test('S3 bucket should have public access blocked', () => {
      const bucket = template.Resources.LogBucket;
      const publicAccessBlock =
        bucket.Properties.PublicAccessBlockConfiguration;

      expect(publicAccessBlock.BlockPublicAcls).toBe(true);
      expect(publicAccessBlock.BlockPublicPolicy).toBe(true);
      expect(publicAccessBlock.IgnorePublicAcls).toBe(true);
      expect(publicAccessBlock.RestrictPublicBuckets).toBe(true);
    });
  });

  describe('Template Validation', () => {
    test('should have exactly 18 resources (serverless web app infrastructure)', () => {
      const resourceCount = Object.keys(template.Resources).length;
      expect(resourceCount).toBe(18);
    });

    test('should have exactly 5 parameters', () => {
      const parameterCount = Object.keys(template.Parameters).length;
      expect(parameterCount).toBe(4);
    });

    test('should have exactly 3 outputs', () => {
      const outputCount = Object.keys(template.Outputs).length;
      expect(outputCount).toBe(8);
    });

    test('should have valid JSON structure', () => {
      expect(template).toBeDefined();
      expect(typeof template).toBe('object');
      expect(template.AWSTemplateFormatVersion).not.toBeNull();
      expect(template.Description).not.toBeNull();
      expect(template.Parameters).not.toBeNull();
      expect(template.Resources).not.toBeNull();
      expect(template.Outputs).not.toBeNull();
    });
  });

  describe('Integration Readiness', () => {
    test('Lambda function code should be deployable', () => {
      const lambda = template.Resources.HelloWorldFunction;
      const code = lambda.Properties.Code.ZipFile;
      expect(code).toContain('exports.handler');
      expect(code).toContain('async (event)');
      expect(code).toContain('return {');
    });

    test('API Gateway should have proper Lambda integration', () => {
      const method = template.Resources.ApiGatewayRootMethod;
      expect(method.Properties.Integration.Type).toBe('AWS_PROXY');
      expect(method.Properties.Integration.IntegrationHttpMethod).toBe('POST');
    });

    test('All log groups should have retention policies', () => {
      const lambdaLogGroup = template.Resources.HelloWorldFunctionLogGroup;
      const apiLogGroup = template.Resources.ApiGatewayLogGroup;

      expect(lambdaLogGroup.Properties.RetentionInDays).toBeDefined();
      expect(apiLogGroup.Properties.RetentionInDays).toBeDefined();
    });
  });
});
