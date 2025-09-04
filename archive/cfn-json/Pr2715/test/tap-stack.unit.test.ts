import * as fs from 'fs';
import * as path from 'path';

interface CloudFormationTemplate {
  AWSTemplateFormatVersion: string;
  Description: string;
  Parameters: Record<string, any>;
  Resources: Record<string, any>;
  Outputs: Record<string, any>;
}

describe('TapStack CloudFormation Template', () => {
  let template: CloudFormationTemplate;

  beforeAll(() => {
    const templatePath = path.resolve(__dirname, '../lib/TapStack.json');
    const templateContent = fs.readFileSync(templatePath, 'utf-8');
    template = JSON.parse(templateContent);
  });

  describe('Template Structure Validation', () => {
    test('should have correct template format version', () => {
      expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
    });

    test('should have meaningful description', () => {
      expect(template.Description).toContain('Secure serverless infrastructure');
      expect(template.Description).toContain('Lambda');
      expect(template.Description).toContain('S3');
      expect(template.Description).toContain('API Gateway');
    });

    test('should have parameters section', () => {
      expect(template.Parameters).toBeDefined();
    });

    test('should have resources section', () => {
      expect(template.Resources).toBeDefined();
      expect(Object.keys(template.Resources).length).toBeGreaterThan(0);
    });

    test('should have outputs section', () => {
      expect(template.Outputs).toBeDefined();
      expect(Object.keys(template.Outputs).length).toBeGreaterThan(0);
    });
  });

  describe('Parameters Validation', () => {
    test('should have EnvironmentName parameter with correct properties', () => {
      const param = template.Parameters.EnvironmentName;
      expect(param).toBeDefined();
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('dev');
      expect(param.AllowedValues).toEqual(['dev', 'staging', 'prod']);
      expect(param.ConstraintDescription).toBe('Must be dev, staging, or prod');
    });
  });

  describe('S3 Bucket Validation', () => {
    test('should have AppDataBucket resource', () => {
      expect(template.Resources.AppDataBucket).toBeDefined();
      expect(template.Resources.AppDataBucket.Type).toBe('AWS::S3::Bucket');
    });

    test('should have server-side encryption enabled', () => {
      const bucket = template.Resources.AppDataBucket;
      expect(bucket.Properties.BucketEncryption).toBeDefined();
      expect(bucket.Properties.BucketEncryption.ServerSideEncryptionConfiguration).toHaveLength(1);
      expect(bucket.Properties.BucketEncryption.ServerSideEncryptionConfiguration[0].ServerSideEncryptionByDefault.SSEAlgorithm).toBe('AES256');
    });

    test('should have public access blocked', () => {
      const bucket = template.Resources.AppDataBucket;
      expect(bucket.Properties.PublicAccessBlockConfiguration).toBeDefined();
      expect(bucket.Properties.PublicAccessBlockConfiguration.BlockPublicAcls).toBe(true);
      expect(bucket.Properties.PublicAccessBlockConfiguration.BlockPublicPolicy).toBe(true);
      expect(bucket.Properties.PublicAccessBlockConfiguration.IgnorePublicAcls).toBe(true);
      expect(bucket.Properties.PublicAccessBlockConfiguration.RestrictPublicBuckets).toBe(true);
    });

    test('should have versioning enabled', () => {
      const bucket = template.Resources.AppDataBucket;
      expect(bucket.Properties.VersioningConfiguration).toBeDefined();
      expect(bucket.Properties.VersioningConfiguration.Status).toBe('Enabled');
    });
  });

  describe('IAM Roles Validation', () => {
    test('should have LambdaExecutionRole with correct trust policy', () => {
      const role = template.Resources.LambdaExecutionRole;
      expect(role).toBeDefined();
      expect(role.Type).toBe('AWS::IAM::Role');
      
      const trustPolicy = role.Properties.AssumeRolePolicyDocument;
      expect(trustPolicy.Statement[0].Principal.Service).toBe('lambda.amazonaws.com');
      expect(trustPolicy.Statement[0].Action).toBe('sts:AssumeRole');
      expect(trustPolicy.Statement[0].Effect).toBe('Allow');
    });

    test('should have basic execution policy for Lambda', () => {
      const role = template.Resources.LambdaExecutionRole;
      expect(role.Properties.ManagedPolicyArns).toContain(
        'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole'
      );
    });

    test('should have S3 read-only access policy', () => {
      const role = template.Resources.LambdaExecutionRole;
      const policies = role.Properties.Policies;
      expect(policies).toHaveLength(1);
      
      const s3Policy = policies[0];
      expect(s3Policy.PolicyName).toBe('S3ReadOnlyAccess');
      expect(s3Policy.PolicyDocument.Statement[0].Action).toEqual([
        's3:GetObject',
        's3:GetObjectVersion'
      ]);
    });

    test('should have S3NotificationRole with correct permissions', () => {
      const role = template.Resources.S3NotificationRole;
      expect(role).toBeDefined();
      
      const policies = role.Properties.Policies;
      expect(policies).toHaveLength(1);
      
      const notificationPolicy = policies[0];
      expect(notificationPolicy.PolicyName).toBe('S3NotificationPolicy');
      
      const statements = notificationPolicy.PolicyDocument.Statement;
      expect(statements).toHaveLength(2);
      
      // Check S3 permissions
      expect(statements[0].Action).toEqual([
        's3:PutBucketNotification',
        's3:GetBucketNotification'
      ]);
      
      // Check Lambda permissions
      expect(statements[1].Action).toEqual([
        'lambda:GetFunction',
        'lambda:AddPermission',
        'lambda:RemovePermission'
      ]);
    });
  });

  describe('Lambda Functions Validation', () => {
    test('should have ProcessDataLambda function', () => {
      const lambda = template.Resources.ProcessDataLambda;
      expect(lambda).toBeDefined();
      expect(lambda.Type).toBe('AWS::Lambda::Function');
      expect(lambda.Properties.Runtime).toBe('python3.9');
      expect(lambda.Properties.Handler).toBe('index.lambda_handler');
      expect(lambda.Properties.MemorySize).toBe(128);
      expect(lambda.Properties.Timeout).toBe(30);
    });

    test('should have environment variables in ProcessDataLambda', () => {
      const lambda = template.Resources.ProcessDataLambda;
      const envVars = lambda.Properties.Environment.Variables;
      
      expect(envVars.BUCKET_NAME.Ref).toBe('AppDataBucket');
      expect(envVars.ENVIRONMENT.Ref).toBe('EnvironmentName');
    });

    test('should have S3NotificationFunction for custom resource', () => {
      const lambda = template.Resources.S3NotificationFunction;
      expect(lambda).toBeDefined();
      expect(lambda.Properties.Runtime).toBe('python3.9');
      expect(lambda.Properties.Handler).toBe('index.handler');
      expect(lambda.Properties.Timeout).toBe(300);
    });

    test('should have inline code in both Lambda functions', () => {
      const processLambda = template.Resources.ProcessDataLambda;
      const notificationLambda = template.Resources.S3NotificationFunction;
      
      expect(processLambda.Properties.Code.ZipFile).toBeDefined();
      expect(notificationLambda.Properties.Code.ZipFile).toBeDefined();
      expect(processLambda.Properties.Code.ZipFile).toContain('lambda_handler');
      expect(notificationLambda.Properties.Code.ZipFile).toContain('handler');
    });
  });

  describe('Lambda Permissions Validation', () => {
    test('should have S3 event permission for Lambda', () => {
      const permission = template.Resources.S3BucketEventPermission;
      expect(permission).toBeDefined();
      expect(permission.Type).toBe('AWS::Lambda::Permission');
      expect(permission.Properties.Action).toBe('lambda:InvokeFunction');
      expect(permission.Properties.Principal).toBe('s3.amazonaws.com');
    });

    test('should have API Gateway permission for Lambda', () => {
      const permission = template.Resources.ApiGatewayLambdaPermission;
      expect(permission).toBeDefined();
      expect(permission.Properties.Action).toBe('lambda:InvokeFunction');
      expect(permission.Properties.Principal).toBe('apigateway.amazonaws.com');
    });
  });

  describe('API Gateway Validation', () => {
    test('should have REST API resource', () => {
      const api = template.Resources.ApiGatewayRestApi;
      expect(api).toBeDefined();
      expect(api.Type).toBe('AWS::ApiGateway::RestApi');
      expect(api.Properties.EndpointConfiguration.Types).toEqual(['REGIONAL']);
    });

    test('should have API resource and method', () => {
      const resource = template.Resources.ApiGatewayResource;
      const method = template.Resources.ApiGatewayMethod;
      
      expect(resource).toBeDefined();
      expect(resource.Properties.PathPart).toBe('process');
      
      expect(method).toBeDefined();
      expect(method.Properties.HttpMethod).toBe('POST');
      expect(method.Properties.AuthorizationType).toBe('NONE');
      expect(method.Properties.ApiKeyRequired).toBe(true);
    });

    test('should have OPTIONS method for CORS', () => {
      const optionsMethod = template.Resources.ApiGatewayOptionsMethod;
      expect(optionsMethod).toBeDefined();
      expect(optionsMethod.Properties.HttpMethod).toBe('OPTIONS');
      expect(optionsMethod.Properties.Integration.Type).toBe('MOCK');
    });

    test('should have API Gateway deployment', () => {
      const deployment = template.Resources.ApiGatewayDeployment;
      expect(deployment).toBeDefined();
      expect(deployment.DependsOn).toContain('ApiGatewayMethod');
      expect(deployment.DependsOn).toContain('ApiGatewayOptionsMethod');
    });

    test('should have usage plan with throttling and quotas', () => {
      const usagePlan = template.Resources.ApiGatewayUsagePlan;
      expect(usagePlan).toBeDefined();
      
      expect(usagePlan.Properties.Throttle.BurstLimit).toBe(50);
      expect(usagePlan.Properties.Throttle.RateLimit).toBe(25);
      expect(usagePlan.Properties.Quota.Limit).toBe(10000);
      expect(usagePlan.Properties.Quota.Period).toBe('MONTH');
    });

    test('should have API key and usage plan key', () => {
      const apiKey = template.Resources.ApiGatewayApiKey;
      const usagePlanKey = template.Resources.ApiGatewayUsagePlanKey;
      
      expect(apiKey).toBeDefined();
      expect(apiKey.Properties.Enabled).toBe(true);
      
      expect(usagePlanKey).toBeDefined();
      expect(usagePlanKey.Properties.KeyType).toBe('API_KEY');
    });
  });

  describe('Custom Resources Validation', () => {
    test('should have custom resource for S3 bucket notification', () => {
      const customResource = template.Resources.S3BucketNotificationConfig;
      expect(customResource).toBeDefined();
      expect(customResource.Type).toBe('Custom::S3BucketNotification');
      
      expect(customResource.Properties.BucketName.Ref).toBe('AppDataBucket');
      expect(customResource.Properties.LambdaArn['Fn::GetAtt']).toEqual(['ProcessDataLambda', 'Arn']);
    });
  });

  describe('Outputs Validation', () => {
    const expectedOutputs = [
      'S3BucketName',
      'S3BucketArn',
      'LambdaFunctionName',
      'LambdaFunctionArn',
      'ApiGatewayUrl',
      'ApiGatewayId',
      'ApiKey',
      'UsagePlanId'
    ];

    test('should have all expected outputs', () => {
      expectedOutputs.forEach(outputName => {
        expect(template.Outputs[outputName]).toBeDefined();
      });
    });

    test('should have S3 bucket outputs with correct values', () => {
      expect(template.Outputs.S3BucketName.Value.Ref).toBe('AppDataBucket');
      expect(template.Outputs.S3BucketArn.Value['Fn::GetAtt']).toEqual(['AppDataBucket', 'Arn']);
    });

    test('should have Lambda function outputs with correct values', () => {
      expect(template.Outputs.LambdaFunctionName.Value.Ref).toBe('ProcessDataLambda');
      expect(template.Outputs.LambdaFunctionArn.Value['Fn::GetAtt']).toEqual(['ProcessDataLambda', 'Arn']);
    });

    test('should have API Gateway outputs with correct values', () => {
      expect(template.Outputs.ApiGatewayUrl.Value['Fn::Sub']).toContain('ApiGatewayRestApi');
      expect(template.Outputs.ApiGatewayId.Value.Ref).toBe('ApiGatewayRestApi');
    });

    test('should have security-related outputs', () => {
      expect(template.Outputs.ApiKey.Value.Ref).toBe('ApiGatewayApiKey');
      expect(template.Outputs.UsagePlanId.Value.Ref).toBe('ApiGatewayUsagePlan');
    });

    test('should have export names for all outputs', () => {
      Object.values(template.Outputs).forEach(output => {
        expect(output.Export).toBeDefined();
        expect(output.Export.Name['Fn::Sub']).toBeDefined();
      });
    });
  });

  describe('Security Best Practices Validation', () => {
    test('should use regional API Gateway endpoint', () => {
      const api = template.Resources.ApiGatewayRestApi;
      expect(api.Properties.EndpointConfiguration.Types).toEqual(['REGIONAL']);
    });

    test('should require API key for API access', () => {
      const method = template.Resources.ApiGatewayMethod;
      expect(method.Properties.ApiKeyRequired).toBe(true);
    });

    test('should have proper CORS headers', () => {
      const method = template.Resources.ApiGatewayMethod;
      const optionsMethod = template.Resources.ApiGatewayOptionsMethod;
      
      // Check POST method CORS headers
      const integrationResponse = method.Properties.Integration.IntegrationResponses[0];
      expect(integrationResponse.ResponseParameters['method.response.header.Access-Control-Allow-Origin']).toBe("'*'");
      
      // Check OPTIONS method CORS headers
      const optionsIntegrationResponse = optionsMethod.Properties.Integration.IntegrationResponses[0];
      expect(optionsIntegrationResponse.ResponseParameters['method.response.header.Access-Control-Allow-Origin']).toBe("'*'");
      expect(optionsIntegrationResponse.ResponseParameters['method.response.header.Access-Control-Allow-Methods']).toBe("'POST,OPTIONS'");
    });

    test('should have proper resource-based policies', () => {
      const s3Permission = template.Resources.S3BucketEventPermission;
      expect(s3Permission.Properties.SourceArn['Fn::GetAtt']).toEqual(['AppDataBucket', 'Arn']);
      
      const apiPermission = template.Resources.ApiGatewayLambdaPermission;
      expect(apiPermission.Properties.SourceArn['Fn::Sub']).toContain('ApiGatewayRestApi');
    });
  });

  describe('Dependency Validation', () => {
    test('should have proper dependencies between resources', () => {
      const deployment = template.Resources.ApiGatewayDeployment;
      expect(deployment.DependsOn).toContain('ApiGatewayMethod');
      expect(deployment.DependsOn).toContain('ApiGatewayOptionsMethod');
      
      const usagePlan = template.Resources.ApiGatewayUsagePlan;
      expect(usagePlan.DependsOn).toBe('ApiGatewayDeployment');
    });

    test('should have correct references between resources', () => {
      // Lambda function should reference IAM role
      const lambda = template.Resources.ProcessDataLambda;
      expect(lambda.Properties.Role['Fn::GetAtt']).toEqual(['LambdaExecutionRole', 'Arn']);
      
      // Custom resource should reference notification Lambda
      const customResource = template.Resources.S3BucketNotificationConfig;
      expect(customResource.Properties.ServiceToken['Fn::GetAtt']).toEqual(['S3NotificationFunction', 'Arn']);
    });
  });
});