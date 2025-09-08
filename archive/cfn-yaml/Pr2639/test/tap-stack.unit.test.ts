import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';

// Configure YAML schema to handle CloudFormation intrinsic functions
const CLOUDFORMATION_SCHEMA = yaml.DEFAULT_SCHEMA.extend([
  new yaml.Type('!Sub', {
    kind: 'scalar',
    construct: (data) => ({ 'Fn::Sub': data }),
  }),
  new yaml.Type('!Ref', {
    kind: 'scalar',
    construct: (data) => ({ Ref: data }),
  }),
  new yaml.Type('!GetAtt', {
    kind: 'scalar',
    construct: (data) => ({ 'Fn::GetAtt': data.split('.') }),
  }),
  new yaml.Type('!Join', {
    kind: 'sequence',
    construct: (data) => ({ 'Fn::Join': data }),
  }),
]);

// Interface definitions for the CloudFormation template
interface CloudFormationTemplate {
  AWSTemplateFormatVersion: string;
  Description: string;
  Parameters: Record<string, Parameter>;
  Resources: Record<string, Resource>;
  Outputs: Record<string, Output>;
}

interface Parameter {
  Type: string;
  Default?: string;
  Description: string;
  AllowedValues?: string[];
  AllowedPattern?: string;
  MinLength?: number;
  MaxLength?: number;
}

interface Resource {
  Type: string;
  Properties: Record<string, any>;
  DependsOn?: string | string[];
  Condition?: string;
}

interface Output {
  Description: string;
  Value: string | { [key: string]: any };
  Export?: {
    Name: string;
  };
}

// Helper function to check if a value is a CloudFormation intrinsic function
function isIntrinsicFunction(obj: any): boolean {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    (obj.Ref !== undefined ||
      obj['Fn::Sub'] !== undefined ||
      obj['Fn::GetAtt'] !== undefined ||
      obj['Fn::Join'] !== undefined)
  );
}

// Test suite
describe('TapStack CloudFormation Template Validation', () => {
  let template: CloudFormationTemplate;

  beforeAll(() => {
    // Load and parse the YAML template with CloudFormation schema
    const templatePath = path.join(__dirname, '../lib/TapStack.yml');
    const templateContent = fs.readFileSync(templatePath, 'utf8');
    template = yaml.load(templateContent, {
      schema: CLOUDFORMATION_SCHEMA,
    }) as CloudFormationTemplate;
  });

  describe('Template Structure Validation', () => {
    test('should have correct AWSTemplateFormatVersion', () => {
      expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
    });

    test('should have a description', () => {
      expect(template.Description).toBeDefined();
      expect(template.Description.length).toBeGreaterThan(0);
    });

    test('should have parameters defined', () => {
      expect(template.Parameters).toBeDefined();
      expect(Object.keys(template.Parameters).length).toBeGreaterThan(0);
    });

    test('should have resources defined', () => {
      expect(template.Resources).toBeDefined();
      expect(Object.keys(template.Resources).length).toBeGreaterThan(0);
    });

    test('should have outputs defined', () => {
      expect(template.Outputs).toBeDefined();
      expect(Object.keys(template.Outputs).length).toBeGreaterThan(0);
    });
  });

  describe('Parameters Validation', () => {
    test('Environment parameter should have correct properties', () => {
      const envParam = template.Parameters.Environment;
      expect(envParam.Type).toBe('String');
      expect(envParam.Default).toBe('Production');
      expect(envParam.Description).toBeDefined();
    });

    test('LambdaFunctionName parameter should have correct properties', () => {
      const lambdaParam = template.Parameters.LambdaFunctionName;
      expect(lambdaParam.Type).toBe('String');
      expect(lambdaParam.Default).toBe('ServerlessFunction');
      expect(lambdaParam.Description).toBeDefined();
    });

    test('DynamoDBTableName parameter should have correct properties', () => {
      const dynamoParam = template.Parameters.DynamoDBTableName;
      expect(dynamoParam.Type).toBe('String');
      expect(dynamoParam.Default).toBe('ServerlessTable');
      expect(dynamoParam.Description).toBeDefined();
    });

    test('S3LogsBucketName parameter should have correct properties', () => {
      const s3Param = template.Parameters.S3LogsBucketName;
      expect(s3Param.Type).toBe('String');
      expect(s3Param.Default).toBe('serverless-logs');
      expect(s3Param.Description).toBeDefined();
    });
  });

  describe('S3 Bucket Validation', () => {
    test('LogsBucket should have correct properties', () => {
      const bucket = template.Resources.LogsBucket;
      expect(bucket.Type).toBe('AWS::S3::Bucket');
      
      const props = bucket.Properties;
      expect(props.BucketEncryption.ServerSideEncryptionConfiguration[0]
        .ServerSideEncryptionByDefault.SSEAlgorithm).toBe('AES256');
      expect(props.VersioningConfiguration.Status).toBe('Enabled');
      expect(props.PublicAccessBlockConfiguration.BlockPublicAcls).toBe(true);
      expect(props.Tags).toBeDefined();
    });

    test('S3 bucket name should include account ID and region reference', () => {
      const bucketName = template.Resources.LogsBucket.Properties.BucketName;
      expect(isIntrinsicFunction(bucketName)).toBe(true);
      expect(bucketName['Fn::Sub']).toContain('${S3LogsBucketName}');
      expect(bucketName['Fn::Sub']).toContain('${AWS::AccountId}');
      expect(bucketName['Fn::Sub']).toContain('${AWS::Region}');
    });
  });

  describe('DynamoDB Table Validation', () => {
    test('ServerlessTable should have correct properties', () => {
      const table = template.Resources.ServerlessTable;
      expect(table.Type).toBe('AWS::DynamoDB::Table');
      
      const props = table.Properties;
      expect(props.AttributeDefinitions[0].AttributeName).toBe('id');
      expect(props.AttributeDefinitions[0].AttributeType).toBe('S');
      expect(props.KeySchema[0].AttributeName).toBe('id');
      expect(props.KeySchema[0].KeyType).toBe('HASH');
      expect(props.ProvisionedThroughput.ReadCapacityUnits).toBe(5);
      expect(props.ProvisionedThroughput.WriteCapacityUnits).toBe(5);
      expect(props.SSESpecification.SSEEnabled).toBe(true);
    });
  });

  describe('IAM Roles Validation', () => {
    test('LambdaExecutionRole should have correct trust policy', () => {
      const role = template.Resources.LambdaExecutionRole;
      expect(role.Type).toBe('AWS::IAM::Role');
      
      const trustPolicy = role.Properties.AssumeRolePolicyDocument;
      expect(trustPolicy.Statement[0].Principal.Service).toBe('lambda.amazonaws.com');
      expect(trustPolicy.Statement[0].Action).toBe('sts:AssumeRole');
    });

    test('LambdaExecutionRole should have DynamoDB access policy', () => {
      const role = template.Resources.LambdaExecutionRole;
      const policies = role.Properties.Policies;
      
      expect(policies[0].PolicyName).toBe('DynamoDBAccess');
      expect(policies[0].PolicyDocument.Statement[0].Action).toContain('dynamodb:GetItem');
      expect(isIntrinsicFunction(policies[0].PolicyDocument.Statement[0].Resource)).toBe(true);
    });

    test('ApiGatewayCloudWatchRole should have correct trust policy', () => {
      const role = template.Resources.ApiGatewayCloudWatchRole;
      expect(role.Type).toBe('AWS::IAM::Role');
      
      const trustPolicy = role.Properties.AssumeRolePolicyDocument;
      expect(trustPolicy.Statement[0].Principal.Service).toBe('apigateway.amazonaws.com');
    });
  });

  describe('Lambda Function Validation', () => {
    test('ServerlessFunction should have correct properties', () => {
      const lambda = template.Resources.ServerlessFunction;
      expect(lambda.Type).toBe('AWS::Lambda::Function');
      
      const props = lambda.Properties;
      expect(props.Runtime).toBe('nodejs22.x');
      expect(props.Handler).toBe('index.handler');
      expect(props.Timeout).toBe(30);
      expect(props.MemorySize).toBe(128);
      expect(isIntrinsicFunction(props.Environment.Variables.DYNAMODB_TABLE_NAME)).toBe(true);
    });

    test('Lambda function code should be inline and contain expected logic', () => {
      const lambda = template.Resources.ServerlessFunction;
      const code = lambda.Properties.Code.ZipFile;
      
      expect(typeof code).toBe('string');
      expect(code).toContain('const AWS = require(\'aws-sdk\')');
      expect(code).toContain('exports.handler');
      expect(code).toContain('dynamodb.get');
      expect(code).toContain('statusCode: 200');
      expect(code).toContain('statusCode: 500');
    });
  });

  describe('API Gateway Validation', () => {
    test('ServerlessApi should be a REST API', () => {
      const api = template.Resources.ServerlessApi;
      expect(api.Type).toBe('AWS::ApiGateway::RestApi');
      expect(api.Properties.EndpointConfiguration.Types[0]).toBe('REGIONAL');
    });

    test('API should have GET and OPTIONS methods', () => {
      const getMethod = template.Resources.ApiMethod;
      const optionsMethod = template.Resources.ApiMethodOptions;
      
      expect(getMethod.Properties.HttpMethod).toBe('GET');
      expect(optionsMethod.Properties.HttpMethod).toBe('OPTIONS');
      expect(getMethod.Properties.Integration.Type).toBe('AWS_PROXY');
      expect(optionsMethod.Properties.Integration.Type).toBe('MOCK');
    });

    test('API should have CORS headers configured', () => {
      const optionsMethod = template.Resources.ApiMethodOptions;
      const integrationResponses = optionsMethod.Properties.Integration.IntegrationResponses[0];
      
      expect(integrationResponses.ResponseParameters['method.response.header.Access-Control-Allow-Origin']).toBeDefined();
      expect(integrationResponses.ResponseParameters['method.response.header.Access-Control-Allow-Methods']).toBeDefined();
      expect(integrationResponses.ResponseParameters['method.response.header.Access-Control-Allow-Headers']).toBeDefined();
    });

    test('API Deployment should depend on methods', () => {
      const deployment = template.Resources.ApiDeployment;
      expect(deployment.DependsOn).toContain('ApiMethod');
      expect(deployment.DependsOn).toContain('ApiMethodOptions');
    });
  });

  describe('CloudWatch Logs Validation', () => {
    test('LambdaLogGroup should have correct retention period', () => {
      const logGroup = template.Resources.LambdaLogGroup;
      expect(logGroup.Type).toBe('AWS::Logs::LogGroup');
      expect(logGroup.Properties.RetentionInDays).toBe(14);
    });

    test('ApiLogGroup should have correct retention period', () => {
      const logGroup = template.Resources.ApiLogGroup;
      expect(logGroup.Type).toBe('AWS::Logs::LogGroup');
      expect(logGroup.Properties.RetentionInDays).toBe(14);
    });
  });

  describe('Outputs Validation', () => {
    test('should have ApiEndpoint output', () => {
      const output = template.Outputs.ApiEndpoint;
      expect(output.Description).toBe('API Gateway endpoint URL');
      expect(isIntrinsicFunction(output.Value)).toBe(true);
      expect(output?.Export?.Name).toBeDefined();
    });

    test('should have LambdaFunctionArn output', () => {
      const output = template.Outputs.LambdaFunctionArn;
      expect(output.Description).toBe('Lambda function ARN');
      expect(isIntrinsicFunction(output.Value)).toBe(true);
      expect(output?.Export?.Name).toBeDefined();
    });

    test('should have DynamoDBTableName output', () => {
      const output = template.Outputs.DynamoDBTableName;
      expect(output.Description).toBe('DynamoDB table name');
      expect(isIntrinsicFunction(output.Value)).toBe(true);
      expect(output?.Export?.Name).toBeDefined();
    });

    test('should have S3LogsBucketName output', () => {
              const output = template.Outputs.S3LogsBucketName;
              expect(output.Description).toBe('S3 logs bucket name');
              expect(isIntrinsicFunction(output.Value)).toBe(true);
              expect(output?.Export?.Name).toBeDefined();
    });
  });

  describe('Security and Compliance Validation', () => {
    test('all resources should have Environment tags', () => {
      const resources = template.Resources;
      
      Object.entries(resources).forEach(([resourceName, resource]) => {
        if (resource.Properties && resource.Properties.Tags) {
          const hasEnvTag = resource.Properties.Tags.some((tag: any) => 
            tag.Key === 'Environment' && 
            (typeof tag.Value === 'string' || isIntrinsicFunction(tag.Value))
          );
          expect(hasEnvTag).toBe(true);
        }
      });
    });

    test('S3 bucket should have proper encryption and public access blocking', () => {
      const bucket = template.Resources.LogsBucket.Properties;
      
      expect(bucket.BucketEncryption).toBeDefined();
      expect(bucket.PublicAccessBlockConfiguration.BlockPublicAcls).toBe(true);
      expect(bucket.PublicAccessBlockConfiguration.BlockPublicPolicy).toBe(true);
    });

    test('DynamoDB table should have encryption enabled', () => {
      const table = template.Resources.ServerlessTable.Properties;
      expect(table.SSESpecification.SSEEnabled).toBe(true);
    });
  });

  describe('Resource Dependencies Validation', () => {
    test('Lambda function should reference execution role', () => {
      const lambda = template.Resources.ServerlessFunction;
      expect(isIntrinsicFunction(lambda.Properties.Role)).toBe(true);
      expect(lambda.Properties.Role['Fn::GetAtt']).toContain('LambdaExecutionRole');
    });

    test('API Gateway methods should reference correct resources', () => {
      const getMethod = template.Resources.ApiMethod;
      expect(isIntrinsicFunction(getMethod.Properties.RestApiId)).toBe(true);
      expect(isIntrinsicFunction(getMethod.Properties.ResourceId)).toBe(true);
    });

    test('Lambda permission should reference API Gateway', () => {
      const permission = template.Resources.LambdaApiGatewayPermission;
      expect(isIntrinsicFunction(permission.Properties.FunctionName)).toBe(true);
      expect(isIntrinsicFunction(permission.Properties.SourceArn)).toBe(true);
    });
  });
});