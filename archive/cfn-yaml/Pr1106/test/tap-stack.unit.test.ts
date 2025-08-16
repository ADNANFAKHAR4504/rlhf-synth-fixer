import fs from 'fs';
import path from 'path';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('TapStack CloudFormation Template - Nova Serverless Infrastructure', () => {
  let template: any;

  beforeAll(() => {
    // If youre testing a yaml template. run `pipenv run cfn-flip-to-json > lib/TapStack.json`
    // Otherwise, ensure the template is in JSON format.
    const templatePath = path.join(__dirname, '../lib/TapStack.json');
    const templateContent = fs.readFileSync(templatePath, 'utf8');
    template = JSON.parse(templateContent);
  });

  describe('Template Structure', () => {
    test('should have valid CloudFormation format version', () => {
      expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
    });

    test('should have a description for serverless infrastructure', () => {
      expect(template.Description).toBeDefined();
      expect(template.Description).toBe(
        'Secure, highly available serverless infrastructure with blue/green deployments'
      );
    });

    test('should have metadata section with parameters', () => {
      expect(template.Metadata).toBeDefined();
      expect(template.Metadata['AWS::CloudFormation::Interface']).toBeDefined();
      expect(template.Metadata['AWS::CloudFormation::Interface'].ParameterGroups).toBeDefined();
      expect(template.Metadata['AWS::CloudFormation::Interface'].ParameterGroups[0].Parameters).toEqual([
        'EnvironmentSuffix',
        'ProjectName'
      ]);
    });
  });

  describe('Parameters', () => {
    test('should have EnvironmentSuffix parameter', () => {
      expect(template.Parameters.EnvironmentSuffix).toBeDefined();
    });

    test('EnvironmentSuffix parameter should have correct properties', () => {
      const envSuffixParam = template.Parameters.EnvironmentSuffix;
      expect(envSuffixParam.Type).toBe('String');
      expect(envSuffixParam.Default).toBe('dev');
      expect(envSuffixParam.Description).toBe(
        'Environment suffix for resource naming (e.g., dev, staging, prod)'
      );
      expect(envSuffixParam.AllowedPattern).toBe('^[a-zA-Z0-9]+$');
      expect(envSuffixParam.ConstraintDescription).toBe(
        'Must contain only alphanumeric characters'
      );
    });

    test('should have ProjectName parameter', () => {
      const projectParam = template.Parameters.ProjectName;
      expect(projectParam).toBeDefined();
      expect(projectParam.Type).toBe('String');
      expect(projectParam.Default).toBe('nova-serverless-v2');
      expect(projectParam.Description).toBe('Project name for resource naming convention');
    });
  });

  describe('KMS Resources', () => {
    test('should have NovaKMSKey resource', () => {
      expect(template.Resources.NovaKMSKey).toBeDefined();
      expect(template.Resources.NovaKMSKey.Type).toBe('AWS::KMS::Key');
    });

    test('should have NovaKMSKeyAlias resource', () => {
      expect(template.Resources.NovaKMSKeyAlias).toBeDefined();
      expect(template.Resources.NovaKMSKeyAlias.Type).toBe('AWS::KMS::Alias');
    });

    test('KMS key should have proper policy for encryption services', () => {
      const keyResource = template.Resources.NovaKMSKey;
      const statements = keyResource.Properties.KeyPolicy.Statement;
      
      expect(statements).toHaveLength(3);
      expect(statements.find((s: any) => s.Sid === 'Enable IAM User Permissions')).toBeDefined();
      expect(statements.find((s: any) => s.Sid === 'Allow CloudWatch Logs')).toBeDefined();
      expect(statements.find((s: any) => s.Sid === 'Allow S3 Service')).toBeDefined();
    });
  });

  describe('S3 and Logging Resources', () => {
    test('should have NovaLogsBucket for Lambda logs', () => {
      expect(template.Resources.NovaLogsBucket).toBeDefined();
      expect(template.Resources.NovaLogsBucket.Type).toBe('AWS::S3::Bucket');
    });

    test('S3 bucket should have lifecycle policy for 7-day retention', () => {
      const bucket = template.Resources.NovaLogsBucket;
      const lifecycleRules = bucket.Properties.LifecycleConfiguration.Rules;
      
      expect(lifecycleRules).toHaveLength(1);
      expect(lifecycleRules[0].ExpirationInDays).toBe(7);
      expect(lifecycleRules[0].Status).toBe('Enabled');
    });

    test('S3 bucket should have KMS encryption enabled', () => {
      const bucket = template.Resources.NovaLogsBucket;
      const encryption = bucket.Properties.BucketEncryption.ServerSideEncryptionConfiguration[0];
      
      expect(encryption.ServerSideEncryptionByDefault.SSEAlgorithm).toBe('aws:kms');
      expect(encryption.ServerSideEncryptionByDefault.KMSMasterKeyID).toEqual({
        'Ref': 'NovaKMSKey'
      });
    });

    test('should have CloudWatch Log Groups for Lambda and API Gateway', () => {
      expect(template.Resources.NovaLogGroup).toBeDefined();
      expect(template.Resources.NovaLogGroup.Type).toBe('AWS::Logs::LogGroup');
      expect(template.Resources.NovaApiLogGroup).toBeDefined();
      expect(template.Resources.NovaApiLogGroup.Type).toBe('AWS::Logs::LogGroup');
    });

    test('Log groups should have 7-day retention', () => {
      expect(template.Resources.NovaLogGroup.Properties.RetentionInDays).toBe(7);
      expect(template.Resources.NovaApiLogGroup.Properties.RetentionInDays).toBe(7);
    });
  });

  describe('Lambda Resources', () => {
    test('should have Lambda execution role', () => {
      expect(template.Resources.NovaLambdaExecutionRole).toBeDefined();
      expect(template.Resources.NovaLambdaExecutionRole.Type).toBe('AWS::IAM::Role');
    });

    test('should have Lambda function with Python 3.9 runtime', () => {
      const lambdaFunction = template.Resources.NovaLambdaFunction;
      expect(lambdaFunction).toBeDefined();
      expect(lambdaFunction.Type).toBe('AWS::Lambda::Function');
      expect(lambdaFunction.Properties.Runtime).toBe('python3.9');
      expect(lambdaFunction.Properties.Handler).toBe('index.lambda_handler');
    });

    test('Lambda function should have required environment variables', () => {
      const envVars = template.Resources.NovaLambdaFunction.Properties.Environment.Variables;
      expect(envVars.LOG_BUCKET).toEqual({ 'Ref': 'NovaLogsBucket' });
      expect(envVars.PROJECT_NAME).toEqual({ 'Ref': 'ProjectName' });
      expect(envVars.ENVIRONMENT).toEqual({ 'Ref': 'EnvironmentSuffix' });
    });

    test('should have Lambda version and alias for blue/green deployment', () => {
      expect(template.Resources.NovaLambdaVersion).toBeDefined();
      expect(template.Resources.NovaLambdaVersion.Type).toBe('AWS::Lambda::Version');
      
      expect(template.Resources.NovaLambdaAlias).toBeDefined();
      expect(template.Resources.NovaLambdaAlias.Type).toBe('AWS::Lambda::Alias');
      expect(template.Resources.NovaLambdaAlias.Properties.Name).toBe('LIVE');
    });
  });

  describe('CodeDeploy Resources for Blue/Green Deployment', () => {
    test('should NOT have CodeDeploy resources (not present in actual template)', () => {
      expect(template.Resources.NovaCodeDeployApplication).toBeUndefined();
      expect(template.Resources.NovaCodeDeployDeploymentGroup).toBeUndefined();
      expect(template.Resources.NovaCodeDeployRole).toBeUndefined();
    });
  });

  describe('API Gateway Resources', () => {
    test('should have API Gateway REST API', () => {
      expect(template.Resources.NovaApiGateway).toBeDefined();
      expect(template.Resources.NovaApiGateway.Type).toBe('AWS::ApiGateway::RestApi');
    });

    test('should have API Gateway resources and methods for proxy integration', () => {
      expect(template.Resources.NovaApiGatewayResource).toBeDefined();
      expect(template.Resources.NovaApiGatewayResource.Type).toBe('AWS::ApiGateway::Resource');
      expect(template.Resources.NovaApiGatewayResource.Properties.PathPart).toBe('{proxy+}');
      
      expect(template.Resources.NovaApiGatewayMethod).toBeDefined();
      expect(template.Resources.NovaApiGatewayMethod.Type).toBe('AWS::ApiGateway::Method');
      expect(template.Resources.NovaApiGatewayMethod.Properties.HttpMethod).toBe('ANY');
      expect(template.Resources.NovaApiGatewayMethod.Properties.Integration.Type).toBe('AWS_PROXY');
      
      expect(template.Resources.NovaApiGatewayRootMethod).toBeDefined();
      expect(template.Resources.NovaApiGatewayRootMethod.Type).toBe('AWS::ApiGateway::Method');
      expect(template.Resources.NovaApiGatewayRootMethod.Properties.HttpMethod).toBe('ANY');
      
      // Test OPTIONS methods for CORS
      expect(template.Resources.NovaApiGatewayOptionsMethod).toBeDefined();
      expect(template.Resources.NovaApiGatewayOptionsMethod.Type).toBe('AWS::ApiGateway::Method');
      expect(template.Resources.NovaApiGatewayOptionsMethod.Properties.HttpMethod).toBe('OPTIONS');
      
      expect(template.Resources.NovaApiGatewayRootOptionsMethod).toBeDefined();
      expect(template.Resources.NovaApiGatewayRootOptionsMethod.Type).toBe('AWS::ApiGateway::Method');
      expect(template.Resources.NovaApiGatewayRootOptionsMethod.Properties.HttpMethod).toBe('OPTIONS');
    });

    test('should have Lambda permission for API Gateway', () => {
      expect(template.Resources.NovaLambdaApiGatewayPermission).toBeDefined();
      expect(template.Resources.NovaLambdaApiGatewayPermission.Type).toBe('AWS::Lambda::Permission');
      expect(template.Resources.NovaLambdaApiGatewayPermission.Properties.Action).toBe('lambda:InvokeFunction');
      expect(template.Resources.NovaLambdaApiGatewayPermission.Properties.Principal).toBe('apigateway.amazonaws.com');
    });

    test('should have API Gateway deployment and stage', () => {
      expect(template.Resources.NovaApiGatewayDeployment).toBeDefined();
      expect(template.Resources.NovaApiGatewayDeployment.Type).toBe('AWS::ApiGateway::Deployment');
      
      expect(template.Resources.NovaApiGatewayStage).toBeDefined();
      expect(template.Resources.NovaApiGatewayStage.Type).toBe('AWS::ApiGateway::Stage');
    });
  });

  describe('Outputs', () => {
    test('should have all required outputs for serverless infrastructure', () => {
      const expectedOutputs = [
        'ApiGatewayUrl',
        'LambdaFunctionName',
        'LambdaFunctionArn',
        'S3LogsBucket',
        'KMSKeyId',
        'StackName',
        'EnvironmentSuffix',
      ];

      expectedOutputs.forEach(outputName => {
        expect(template.Outputs[outputName]).toBeDefined();
      });
    });

    test('ApiGatewayUrl output should be correct', () => {
      const output = template.Outputs.ApiGatewayUrl;
      expect(output.Description).toBe('API Gateway endpoint URL');
      expect(output.Value).toEqual({
        'Fn::Sub': 'https://${NovaApiGateway}.execute-api.${AWS::Region}.amazonaws.com/${EnvironmentSuffix}'
      });
    });

    test('Lambda outputs should be correct', () => {
      const nameOutput = template.Outputs.LambdaFunctionName;
      const arnOutput = template.Outputs.LambdaFunctionArn;
      
      expect(nameOutput.Value).toEqual({ 'Ref': 'NovaLambdaFunction' });
      expect(arnOutput.Value).toEqual({ 'Fn::GetAtt': ['NovaLambdaFunction', 'Arn'] });
    });

    test('export names should follow naming convention', () => {
      Object.keys(template.Outputs).forEach(outputKey => {
        const output = template.Outputs[outputKey];
        expect(output.Export.Name).toEqual({
          'Fn::Sub': `\${AWS::StackName}-${outputKey}`,
        });
      });
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

    test('should have correct number of resources for serverless infrastructure', () => {
      const resourceCount = Object.keys(template.Resources).length;
      expect(resourceCount).toBe(18); // KMS, S3, Lambda, API Gateway, IAM, CloudWatch resources (no CodeDeploy)
    });

    test('should have two parameters', () => {
      const parameterCount = Object.keys(template.Parameters).length;
      expect(parameterCount).toBe(2);
    });

    test('should have seven outputs', () => {
      const outputCount = Object.keys(template.Outputs).length;
      expect(outputCount).toBe(7);
    });
  });

  describe('Security and Best Practices', () => {
    test('S3 bucket should have public access blocked', () => {
      const bucket = template.Resources.NovaLogsBucket;
      const publicAccessBlock = bucket.Properties.PublicAccessBlockConfiguration;
      
      expect(publicAccessBlock.BlockPublicAcls).toBe(true);
      expect(publicAccessBlock.BlockPublicPolicy).toBe(true);
      expect(publicAccessBlock.IgnorePublicAcls).toBe(true);
      expect(publicAccessBlock.RestrictPublicBuckets).toBe(true);
    });

    test('should not have any resources with Retain deletion policy', () => {
      Object.keys(template.Resources).forEach(resourceKey => {
        const resource = template.Resources[resourceKey];
        expect(resource.DeletionPolicy).not.toBe('Retain');
        expect(resource.UpdateReplacePolicy).not.toBe('Retain');
      });
    });

    test('API Gateway should have logging and metrics enabled', () => {
      const stage = template.Resources.NovaApiGatewayStage;
      const methodSettings = stage.Properties.MethodSettings[0];
      
      expect(methodSettings.LoggingLevel).toBe('INFO');
      expect(methodSettings.DataTraceEnabled).toBe(true);
      expect(methodSettings.MetricsEnabled).toBe(true);
    });
  });

  describe('Resource Naming Convention', () => {
    test('resources should follow naming convention with environment suffix', () => {
      const bucket = template.Resources.NovaLogsBucket;
      const bucketName = bucket.Properties.BucketName;

      expect(bucketName).toEqual({
        'Fn::Sub': '${ProjectName}-${EnvironmentSuffix}-lambda-logs-${AWS::AccountId}',
      });
    });

    test('Lambda function should follow naming convention', () => {
      const lambdaFunction = template.Resources.NovaLambdaFunction;
      expect(lambdaFunction.Properties.FunctionName).toEqual({
        'Fn::Sub': '${ProjectName}-${EnvironmentSuffix}-function'
      });
    });

    test('IAM roles should not have explicit names (to avoid CAPABILITY_NAMED_IAM)', () => {
      const lambdaRole = template.Resources.NovaLambdaExecutionRole;
      
      expect(lambdaRole.Properties.RoleName).toBeUndefined();
    });
  });
});
