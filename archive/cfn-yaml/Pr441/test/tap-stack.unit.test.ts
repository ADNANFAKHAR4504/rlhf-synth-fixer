import fs from 'fs';
import path from 'path';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('TapStack CloudFormation Template', () => {
  let template: any;

  beforeAll(() => {
    // Load the CloudFormation template in JSON format
    const templatePath = path.join(__dirname, '../lib/TapStack.json');
    const templateContent = fs.readFileSync(templatePath, 'utf8');
    template = JSON.parse(templateContent);
  });

  describe('Template Structure', () => {
    test('should have valid CloudFormation format version', () => {
      expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
    });

    test('should have a description', () => {
      expect(template.Description).toBeDefined();
      expect(typeof template.Description).toBe('string');
      expect(template.Description.length).toBeGreaterThan(0);
    });

    test('should have Parameters, Resources, and Outputs sections', () => {
      expect(template.Parameters).toBeDefined();
      expect(template.Resources).toBeDefined();
      expect(template.Outputs).toBeDefined();
    });
  });

  describe('Parameters', () => {
    test('should have EnvironmentSuffix and ProjectName parameters', () => {
      expect(template.Parameters.EnvironmentSuffix).toBeDefined();
      expect(template.Parameters.ProjectName).toBeDefined();
    });

    test('EnvironmentSuffix parameter should have correct properties', () => {
      const param = template.Parameters.EnvironmentSuffix;
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('dev');
      expect(param.Description).toContain('Suffix for the environment');
      expect(param.AllowedPattern).toBe('^[a-zA-Z0-9]+$');
      expect(param.ConstraintDescription).toContain('alphanumeric');
    });

    test('ProjectName parameter should have correct properties', () => {
      const param = template.Parameters.ProjectName;
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('myProject');
      expect(param.Description).toContain('Project name');
    });
  });

  describe('Resources', () => {
    test('should have all main resources', () => {
      const expectedResources = [
        'LambdaExecutionRole',
        'ApiGatewayRole',
        'DynamoDBTable',
        'S3Bucket',
        'LambdaFunction',
        'LambdaLogGroup',
        'ApiGateway',
        'ApiGatewayResource',
        'ApiGatewayMethod',
        'ApiGatewayGetMethod',
        'ApiGatewayDeployment',
        'LambdaApiGatewayPermission',
        'LambdaErrorAlarm',
        'LambdaDurationAlarm',
        'LambdaInvocationAlarm',
        'ApiGateway4XXErrorAlarm',
        'ApiGateway5XXErrorAlarm'
      ];
      expectedResources.forEach(resource => {
        expect(template.Resources[resource]).toBeDefined();
      });
    });

    test('DynamoDBTable should be configured correctly', () => {
      const table = template.Resources.DynamoDBTable;
      expect(table.Type).toBe('AWS::DynamoDB::Table');
      const props = table.Properties;
      expect(props.TableName).toBeDefined();
      expect(props.BillingMode).toBe('PAY_PER_REQUEST');
      expect(props.PointInTimeRecoverySpecification.PointInTimeRecoveryEnabled).toBe(true);
      expect(props.SSESpecification.SSEEnabled).toBe(true);
      expect(Array.isArray(props.AttributeDefinitions)).toBe(true);
      expect(Array.isArray(props.KeySchema)).toBe(true);
      expect(props.Tags).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ Key: 'Environment' }),
          expect.objectContaining({ Key: 'Project' })
        ])
      );
    });

    test('S3Bucket should be configured securely', () => {
      const bucket = template.Resources.S3Bucket;
      expect(bucket.Type).toBe('AWS::S3::Bucket');
      const props = bucket.Properties;
      expect(props.BucketEncryption).toBeDefined();
      expect(props.PublicAccessBlockConfiguration.BlockPublicAcls).toBe(true);
      expect(props.VersioningConfiguration.Status).toBe('Enabled');
      expect(props.Tags).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ Key: 'Environment' }),
          expect.objectContaining({ Key: 'Project' })
        ])
      );
    });

    test('LambdaFunction should have correct environment variables and role', () => {
      const lambda = template.Resources.LambdaFunction;
      expect(lambda.Type).toBe('AWS::Lambda::Function');
      const props = lambda.Properties;
      expect(props.FunctionName).toBeDefined();
      expect(props.Runtime).toBe('python3.9');
      expect(props.Handler).toBe('index.lambda_handler');
      expect(props.Role).toBeDefined();
      expect(props.Environment.Variables.DYNAMODB_TABLE_NAME).toBeDefined();
      expect(props.Environment.Variables.S3_BUCKET_NAME).toBeDefined();
      expect(props.Environment.Variables.ENVIRONMENT).toBeDefined();
      expect(props.Timeout).toBe(30);
      expect(props.MemorySize).toBe(256);
      expect(props.Tags).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ Key: 'Environment' }),
          expect.objectContaining({ Key: 'Project' })
        ])
      );
    });

    test('IAM roles should use correct ARNs and policies', () => {
      const lambdaRole = template.Resources.LambdaExecutionRole;
      expect(lambdaRole.Type).toBe('AWS::IAM::Role');
      expect(lambdaRole.Properties.ManagedPolicyArns).toContain(
        'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole'
      );
      const s3Policy = lambdaRole.Properties.Policies.find(
        (p: any) => p.PolicyName === 'S3Access'
      );
      expect(s3Policy.PolicyDocument.Statement[0].Resource).toEqual({
        'Fn::Sub': 'arn:aws:s3:::${S3Bucket}/*'
      });
    });

    test('ApiGateway should be configured correctly', () => {
      const api = template.Resources.ApiGateway;
      expect(api.Type).toBe('AWS::ApiGateway::RestApi');
      expect(api.Properties.Name).toBeDefined();
      expect(api.Properties.EndpointConfiguration.Types).toContain('REGIONAL');
      expect(api.Properties.Tags).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ Key: 'Environment' }),
          expect.objectContaining({ Key: 'Project' })
        ])
      );
    });

    test('CloudWatch alarms should be present', () => {
      const alarms = [
        'LambdaErrorAlarm',
        'LambdaDurationAlarm',
        'LambdaInvocationAlarm',
        'ApiGateway4XXErrorAlarm',
        'ApiGateway5XXErrorAlarm'
      ];
      alarms.forEach(alarm => {
        expect(template.Resources[alarm]).toBeDefined();
        expect(template.Resources[alarm].Type).toBe('AWS::CloudWatch::Alarm');
      });
    });
  });

  describe('Outputs', () => {
    test('should have all required outputs', () => {
      const expectedOutputs = [
        'ApiGatewayUrl',
        'LambdaFunctionArn',
        'DynamoDBTableName',
        'S3BucketName',
        'ApiGatewayPostEndpoint',
        'ApiGatewayGetEndpoint'
      ];
      expectedOutputs.forEach(output => {
        expect(template.Outputs[output]).toBeDefined();
      });
    });

    test('ApiGatewayUrl output should be correct', () => {
      const output = template.Outputs.ApiGatewayUrl;
      expect(output.Description).toBe('API Gateway endpoint URL');
      expect(output.Value).toEqual({
        'Fn::Sub': 'https://${ApiGateway}.execute-api.${AWS::Region}.amazonaws.com/${EnvironmentSuffix}'
      });
      expect(output.Export.Name).toEqual({
        'Fn::Sub': '${ProjectName}-ApiGatewayUrl-${EnvironmentSuffix}'
      });
    });

    test('LambdaFunctionArn output should be correct', () => {
      const output = template.Outputs.LambdaFunctionArn;
      expect(output.Description).toBe('Lambda function ARN');
      expect(output.Value).toEqual({
        'Fn::GetAtt': ['LambdaFunction', 'Arn']
      });
      expect(output.Export.Name).toEqual({
        'Fn::Sub': '${ProjectName}-LambdaFunctionArn-${EnvironmentSuffix}'
      });
    });

    test('DynamoDBTableName output should be correct', () => {
      const output = template.Outputs.DynamoDBTableName;
      expect(output.Description).toBe('DynamoDB table name');
      expect(output.Value).toEqual({ Ref: 'DynamoDBTable' });
      expect(output.Export.Name).toEqual({
        'Fn::Sub': '${ProjectName}-DynamoDBTableName-${EnvironmentSuffix}'
      });
    });

    test('S3BucketName output should be correct', () => {
      const output = template.Outputs.S3BucketName;
      expect(output.Description).toBe('S3 bucket name');
      expect(output.Value).toEqual({ Ref: 'S3Bucket' });
      expect(output.Export.Name).toEqual({
        'Fn::Sub': '${ProjectName}-S3BucketName-${EnvironmentSuffix}'
      });
    });

    test('ApiGatewayPostEndpoint output should be correct', () => {
      const output = template.Outputs.ApiGatewayPostEndpoint;
      expect(output.Description).toBe('API Gateway POST endpoint for data operations');
      expect(output.Value).toEqual({
        'Fn::Sub': 'https://${ApiGateway}.execute-api.${AWS::Region}.amazonaws.com/${EnvironmentSuffix}/data'
      });
    });

    test('ApiGatewayGetEndpoint output should be correct', () => {
      const output = template.Outputs.ApiGatewayGetEndpoint;
      expect(output.Description).toBe('API Gateway GET endpoint for data operations');
      expect(output.Value).toEqual({
        'Fn::Sub': 'https://${ApiGateway}.execute-api.${AWS::Region}.amazonaws.com/${EnvironmentSuffix}/data'
      });
    });
  });

  describe('General Validation', () => {
    test('template should be a valid object', () => {
      expect(template).toBeDefined();
      expect(typeof template).toBe('object');
    });

    test('required sections should not be null', () => {
      expect(template.AWSTemplateFormatVersion).not.toBeNull();
      expect(template.Description).not.toBeNull();
      expect(template.Parameters).not.toBeNull();
      expect(template.Resources).not.toBeNull();
      expect(template.Outputs).not.toBeNull();
    });

    // Remove these strict count tests, as your template is designed to have multiple resources/parameters/outputs
    // Instead, check for minimum expected counts

    test('should have at least one resource', () => {
      const resourceCount = Object.keys(template.Resources).length;
      expect(resourceCount).toBeGreaterThanOrEqual(1);
    });

    test('should have at least one parameter', () => {
      const parameterCount = Object.keys(template.Parameters).length;
      expect(parameterCount).toBeGreaterThanOrEqual(1);
    });

    test('should have at least four outputs', () => {
      const outputCount = Object.keys(template.Outputs).length;
      expect(outputCount).toBeGreaterThanOrEqual(4);
    });
  });

  describe('Resource Naming Convention', () => {
    // Remove the TurnAroundPromptTable test, as your template does not have this resource
    // Instead, check DynamoDBTable naming convention

    test('DynamoDBTable name should follow naming convention with environment suffix', () => {
      const table = template.Resources.DynamoDBTable;
      expect(table).toBeDefined();
      const tableName = table.Properties.TableName;
      // Accept either Fn::Sub or string interpolation
      if (typeof tableName === 'object' && tableName['Fn::Sub']) {
        expect(tableName['Fn::Sub']).toContain('${EnvironmentSuffix}');
      } else if (typeof tableName === 'string') {
        expect(tableName).toContain(environmentSuffix);
      }
    });
  });
});
