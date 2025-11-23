import fs from 'fs';
import path from 'path';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('TapStack Serverless CloudFormation Template', () => {
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

    test('should have correct description for serverless application', () => {
      expect(template.Description).toBeDefined();
      expect(template.Description).toBe(
        'Serverless application with API Gateway and Lambda for logging to S3 and CloudWatch'
      );
    });

    test('should have metadata section with deployment instructions', () => {
      expect(template.Metadata).toBeDefined();
      expect(template.Metadata['AWS::CloudFormation::Interface']).toBeDefined();
      expect(template.Metadata.DeploymentInstructions).toBeDefined();
      expect(template.Metadata.DeploymentInstructions.Validation).toBeDefined();
      expect(template.Metadata.DeploymentInstructions.Deployment).toBeDefined();
      expect(template.Metadata.DeploymentInstructions.Verification).toBeDefined();
      expect(template.Metadata.DeploymentInstructions.Cleanup).toBeDefined();
    });
  });

  describe('Parameters', () => {
    test('should have EnvironmentSuffix parameter', () => {
      expect(template.Parameters.EnvironmentSuffix).toBeDefined();
      const envSuffixParam = template.Parameters.EnvironmentSuffix;
      expect(envSuffixParam.Type).toBe('String');
      expect(envSuffixParam.Default).toBe('dev');
      expect(envSuffixParam.AllowedPattern).toBe('^[a-zA-Z0-9]+$');
    });

    test('should have ProjectName parameter', () => {
      expect(template.Parameters.ProjectName).toBeDefined();
      const projectNameParam = template.Parameters.ProjectName;
      expect(projectNameParam.Type).toBe('String');
      expect(projectNameParam.Default).toBe('serverless-demo');
      expect(projectNameParam.Description).toBe('Project name for tagging');
    });
  });

  describe('S3 Resources', () => {
    test('should have LogsBucket resource', () => {
      expect(template.Resources.LogsBucket).toBeDefined();
      const bucket = template.Resources.LogsBucket;
      expect(bucket.Type).toBe('AWS::S3::Bucket');
      expect(bucket.DeletionPolicy).toBe('Delete');
      expect(bucket.UpdateReplacePolicy).toBe('Delete');
    });

    test('LogsBucket should have correct naming with environment suffix', () => {
      const bucket = template.Resources.LogsBucket;
      expect(bucket.Properties.BucketName).toEqual({
        'Fn::Sub': 'project-logs-${EnvironmentSuffix}',
      });
    });

    test('LogsBucket should have versioning enabled', () => {
      const bucket = template.Resources.LogsBucket;
      expect(bucket.Properties.VersioningConfiguration.Status).toBe('Enabled');
    });

    test('LogsBucket should have lifecycle configuration', () => {
      const bucket = template.Resources.LogsBucket;
      expect(bucket.Properties.LifecycleConfiguration.Rules).toHaveLength(1);
      expect(bucket.Properties.LifecycleConfiguration.Rules[0].ExpirationInDays).toBe(30);
    });

    test('LogsBucket should have public access blocked', () => {
      const bucket = template.Resources.LogsBucket;
      const publicAccessConfig = bucket.Properties.PublicAccessBlockConfiguration;
      expect(publicAccessConfig.BlockPublicAcls).toBe(true);
      expect(publicAccessConfig.BlockPublicPolicy).toBe(true);
      expect(publicAccessConfig.IgnorePublicAcls).toBe(true);
      expect(publicAccessConfig.RestrictPublicBuckets).toBe(true);
    });

    test('LogsBucket should have proper tags', () => {
      const bucket = template.Resources.LogsBucket;
      const tags = bucket.Properties.Tags;
      expect(tags).toHaveLength(2);
      expect(tags.find((tag: any) => tag.Key === 'environment')).toBeDefined();
      expect(tags.find((tag: any) => tag.Key === 'project')).toBeDefined();
    });
  });

  describe('Lambda Resources', () => {
    test('should have LambdaExecutionRole with correct assume role policy', () => {
      expect(template.Resources.LambdaExecutionRole).toBeDefined();
      const role = template.Resources.LambdaExecutionRole;
      expect(role.Type).toBe('AWS::IAM::Role');

      const assumePolicy = role.Properties.AssumeRolePolicyDocument;
      expect(assumePolicy.Statement[0].Principal.Service).toBe('lambda.amazonaws.com');
      expect(assumePolicy.Statement[0].Action).toBe('sts:AssumeRole');
    });

    test('LambdaExecutionRole should have least privilege permissions', () => {
      const role = template.Resources.LambdaExecutionRole;
      const policy = role.Properties.Policies[0].PolicyDocument;

      // Check CloudWatch permissions are scoped to specific log group
      const logsStatement = policy.Statement[0];
      expect(logsStatement.Action).toContain('logs:CreateLogGroup');
      expect(logsStatement.Action).toContain('logs:CreateLogStream');
      expect(logsStatement.Action).toContain('logs:PutLogEvents');
      expect(logsStatement.Resource).toEqual({
        'Fn::Sub': 'arn:aws:logs:${AWS::Region}:${AWS::AccountId}:log-group:/aws/lambda/serverless-lambda-${EnvironmentSuffix}:*',
      });

      // Check S3 permissions are scoped to specific bucket
      const s3Statement = policy.Statement[1];
      expect(s3Statement.Action).toEqual(['s3:PutObject']);
      expect(s3Statement.Resource).toEqual({
        'Fn::Sub': 'arn:aws:s3:::${LogsBucket}/*',
      });
    });

    test('should have LambdaFunction with correct properties', () => {
      expect(template.Resources.LambdaFunction).toBeDefined();
      const lambda = template.Resources.LambdaFunction;
      expect(lambda.Type).toBe('AWS::Lambda::Function');
      expect(lambda.Properties.Runtime).toBe('python3.9');
      expect(lambda.Properties.Handler).toBe('index.handler');
      expect(lambda.Properties.FunctionName).toEqual({
        'Fn::Sub': 'serverless-lambda-${EnvironmentSuffix}',
      });
    });

    test('LambdaFunction should have environment variables', () => {
      const lambda = template.Resources.LambdaFunction;
      const envVars = lambda.Properties.Environment.Variables;
      expect(envVars.ENVIRONMENT).toEqual({ Ref: 'EnvironmentSuffix' });
      expect(envVars.LOGS_BUCKET).toEqual({ Ref: 'LogsBucket' });
    });

    test('LambdaFunction should have inline code for logging to S3', () => {
      const lambda = template.Resources.LambdaFunction;
      const code = lambda.Properties.Code.ZipFile['Fn::Join'][1];
      expect(code.join('\n')).toContain('import json');
      expect(code.join('\n')).toContain('import boto3');
      expect(code.join('\n')).toContain('s3.put_object');
      expect(code.join('\n')).toContain('datetime');
    });

    test('should have LambdaLogGroup', () => {
      expect(template.Resources.LambdaLogGroup).toBeDefined();
      const logGroup = template.Resources.LambdaLogGroup;
      expect(logGroup.Type).toBe('AWS::Logs::LogGroup');
      expect(logGroup.Properties.LogGroupName).toEqual({
        'Fn::Sub': '/aws/lambda/serverless-lambda-${EnvironmentSuffix}',
      });
      expect(logGroup.Properties.RetentionInDays).toBe(7);
    });
  });

  describe('API Gateway Resources', () => {
    test('should have ApiGatewayCloudWatchRole', () => {
      expect(template.Resources.ApiGatewayCloudWatchRole).toBeDefined();
      const role = template.Resources.ApiGatewayCloudWatchRole;
      expect(role.Type).toBe('AWS::IAM::Role');
      expect(role.Properties.ManagedPolicyArns).toContain(
        'arn:aws:iam::aws:policy/service-role/AmazonAPIGatewayPushToCloudWatchLogs'
      );
    });

    test('should have ApiGateway with correct configuration', () => {
      expect(template.Resources.ApiGateway).toBeDefined();
      const api = template.Resources.ApiGateway;
      expect(api.Type).toBe('AWS::ApiGateway::RestApi');
      expect(api.Properties.Name).toEqual({
        'Fn::Sub': 'serverless-api-${EnvironmentSuffix}',
      });
      expect(api.Properties.EndpointConfiguration.Types).toContain('REGIONAL');
    });

    test('should have v1 resource path structure', () => {
      expect(template.Resources.ApiGatewayV1Resource).toBeDefined();
      expect(template.Resources.ApiGatewayResourceResource).toBeDefined();

      const v1Resource = template.Resources.ApiGatewayV1Resource;
      expect(v1Resource.Properties.PathPart).toBe('v1');

      const resourceResource = template.Resources.ApiGatewayResourceResource;
      expect(resourceResource.Properties.PathPart).toBe('resource');
    });

    test('should have GET and POST methods', () => {
      expect(template.Resources.ApiGatewayMethodGet).toBeDefined();
      expect(template.Resources.ApiGatewayMethodPost).toBeDefined();

      const getMethod = template.Resources.ApiGatewayMethodGet;
      expect(getMethod.Properties.HttpMethod).toBe('GET');
      expect(getMethod.Properties.Integration.Type).toBe('AWS_PROXY');

      const postMethod = template.Resources.ApiGatewayMethodPost;
      expect(postMethod.Properties.HttpMethod).toBe('POST');
      expect(postMethod.Properties.Integration.Type).toBe('AWS_PROXY');
    });

    test('should have deployment and stage', () => {
      expect(template.Resources.ApiGatewayDeployment).toBeDefined();
      expect(template.Resources.ApiGatewayStage).toBeDefined();

      const stage = template.Resources.ApiGatewayStage;
      expect(stage.Properties.StageName).toBe('prod');
      expect(stage.Properties.MethodSettings[0].LoggingLevel).toBe('INFO');
      expect(stage.Properties.MethodSettings[0].DataTraceEnabled).toBe(true);
    });

    test('should have ApiGatewayLogGroup', () => {
      expect(template.Resources.ApiGatewayLogGroup).toBeDefined();
      const logGroup = template.Resources.ApiGatewayLogGroup;
      expect(logGroup.Type).toBe('AWS::Logs::LogGroup');
      expect(logGroup.Properties.LogGroupName).toEqual({
        'Fn::Sub': '/aws/apigateway/serverless-api-${EnvironmentSuffix}',
      });
    });

    test('should have LambdaInvokePermission', () => {
      expect(template.Resources.LambdaInvokePermission).toBeDefined();
      const permission = template.Resources.LambdaInvokePermission;
      expect(permission.Type).toBe('AWS::Lambda::Permission');
      expect(permission.Properties.Action).toBe('lambda:InvokeFunction');
      expect(permission.Properties.Principal).toBe('apigateway.amazonaws.com');
    });
  });

  describe('Outputs', () => {
    test('should have all required outputs', () => {
      const expectedOutputs = ['ApiEndpoint', 'LambdaFunctionArn', 'S3BucketName'];
      expectedOutputs.forEach(outputName => {
        expect(template.Outputs[outputName]).toBeDefined();
      });
    });

    test('ApiEndpoint output should provide correct API URL', () => {
      const output = template.Outputs.ApiEndpoint;
      expect(output.Description).toBe('API Gateway endpoint URL');
      expect(output.Value).toEqual({
        'Fn::Sub': 'https://${ApiGateway}.execute-api.${AWS::Region}.amazonaws.com/prod/v1/resource',
      });
    });

    test('LambdaFunctionArn output should provide Lambda ARN', () => {
      const output = template.Outputs.LambdaFunctionArn;
      expect(output.Description).toBe('Lambda function ARN');
      expect(output.Value).toEqual({
        'Fn::GetAtt': ['LambdaFunction', 'Arn'],
      });
    });

    test('S3BucketName output should provide bucket name', () => {
      const output = template.Outputs.S3BucketName;
      expect(output.Description).toBe('S3 bucket name for logs');
      expect(output.Value).toEqual({ Ref: 'LogsBucket' });
    });
  });

  describe('Security and Best Practices', () => {
    test('all IAM resources should have least privilege permissions', () => {
      const lambdaRole = template.Resources.LambdaExecutionRole;
      const statements = lambdaRole.Properties.Policies[0].PolicyDocument.Statement;

      // Verify no wildcard resources
      statements.forEach((statement: any) => {
        expect(statement.Resource).not.toBe('*');
        if (Array.isArray(statement.Resource)) {
          statement.Resource.forEach((resource: any) => {
            expect(resource).not.toBe('*');
          });
        }
      });
    });

    test('all resources should have proper tags', () => {
      const resourcesWithTags = [
        'LogsBucket',
        'LambdaExecutionRole',
        'LambdaFunction',
        'LambdaLogGroup',
        'ApiGatewayCloudWatchRole',
        'ApiGateway',
        'ApiGatewayStage',
        'ApiGatewayLogGroup'
      ];

      resourcesWithTags.forEach(resourceName => {
        const resource = template.Resources[resourceName];
        expect(resource.Properties.Tags).toBeDefined();
        expect(resource.Properties.Tags).toHaveLength(2);

        const environmentTag = resource.Properties.Tags.find((tag: any) => tag.Key === 'environment');
        const projectTag = resource.Properties.Tags.find((tag: any) => tag.Key === 'project');

        expect(environmentTag).toBeDefined();
        expect(projectTag).toBeDefined();
        expect(environmentTag.Value).toEqual({ Ref: 'EnvironmentSuffix' });
        expect(projectTag.Value).toEqual({ Ref: 'ProjectName' });
      });
    });

    test('all resources should be deletable (no retention policies)', () => {
      Object.keys(template.Resources).forEach(resourceName => {
        const resource = template.Resources[resourceName];
        if (resource.DeletionPolicy) {
          expect(resource.DeletionPolicy).toBe('Delete');
        }
        if (resource.UpdateReplacePolicy) {
          expect(resource.UpdateReplacePolicy).toBe('Delete');
        }
      });
    });

    test('resource names should include environment suffix', () => {
      const resourcesWithNaming = {
        LogsBucket: 'project-logs-${EnvironmentSuffix}',
        LambdaExecutionRole: 'serverless-lambda-role-${EnvironmentSuffix}',
        LambdaFunction: 'serverless-lambda-${EnvironmentSuffix}',
        ApiGatewayCloudWatchRole: 'serverless-apigateway-role-${EnvironmentSuffix}',
        ApiGateway: 'serverless-api-${EnvironmentSuffix}'
      };

      Object.entries(resourcesWithNaming).forEach(([resourceName, expectedPattern]) => {
        const resource = template.Resources[resourceName];
        const nameProperty = resource.Properties.BucketName ||
          resource.Properties.RoleName ||
          resource.Properties.FunctionName ||
          resource.Properties.Name;

        if (nameProperty) {
          expect(nameProperty).toEqual({ 'Fn::Sub': expectedPattern });
        }
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

    test('should have correct number of resources for serverless architecture', () => {
      const resourceCount = Object.keys(template.Resources).length;
      expect(resourceCount).toBe(15); // All serverless resources
    });

    test('should have correct number of parameters', () => {
      const parameterCount = Object.keys(template.Parameters).length;
      expect(parameterCount).toBe(2); // EnvironmentSuffix and ProjectName
    });

    test('should have correct number of outputs', () => {
      const outputCount = Object.keys(template.Outputs).length;
      expect(outputCount).toBe(3); // ApiEndpoint, LambdaFunctionArn, S3BucketName
    });
  });

  describe('Integration Dependencies', () => {
    test('API Gateway deployment should depend on methods', () => {
      const deployment = template.Resources.ApiGatewayDeployment;
      expect(deployment.DependsOn).toContain('ApiGatewayMethodGet');
      expect(deployment.DependsOn).toContain('ApiGatewayMethodPost');
    });

    test('Lambda should reference execution role', () => {
      const lambda = template.Resources.LambdaFunction;
      expect(lambda.Properties.Role).toEqual({
        'Fn::GetAtt': ['LambdaExecutionRole', 'Arn'],
      });
    });

    test('API Gateway stage should reference deployment', () => {
      const stage = template.Resources.ApiGatewayStage;
      expect(stage.Properties.DeploymentId).toEqual({
        Ref: 'ApiGatewayDeployment',
      });
    });
  });
});
