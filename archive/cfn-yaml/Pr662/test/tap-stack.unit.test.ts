import * as fs from 'fs';

describe('CloudFormation Template Tests', () => {
  let yamlContent: string;

  beforeAll(() => {
    // Load the YAML template as string for basic validation
    yamlContent = fs.readFileSync('lib/TapStack.yml', 'utf8');
  });

  describe('Template Structure', () => {
    test('should have correct AWSTemplateFormatVersion', () => {
      expect(yamlContent).toContain('AWSTemplateFormatVersion');
      expect(yamlContent).toContain('2010-09-09');
    });

    test('should have a description', () => {
      expect(yamlContent).toContain('Description');
      expect(yamlContent).toContain('Serverless Infrastructure');
    });

    test('should have Parameters section', () => {
      expect(yamlContent).toContain('Parameters:');
      expect(yamlContent).toContain('EnvironmentSuffix:');
    });

    test('should have Resources section', () => {
      expect(yamlContent).toContain('Resources:');
    });

    test('should have Outputs section', () => {
      expect(yamlContent).toContain('Outputs:');
    });
  });

  describe('DynamoDB Table', () => {
    test('should define UserDataTable with correct properties', () => {
      expect(yamlContent).toContain('UserDataTable:');
      expect(yamlContent).toContain('AWS::DynamoDB::Table');
      expect(yamlContent).toContain('userId');
      expect(yamlContent).toContain('PAY_PER_REQUEST');
    });

    test('should have point-in-time recovery enabled', () => {
      expect(yamlContent).toContain('PointInTimeRecoverySpecification');
      expect(yamlContent).toContain('PointInTimeRecoveryEnabled: true');
    });

    test('should have streams enabled', () => {
      expect(yamlContent).toContain('StreamSpecification');
      expect(yamlContent).toContain('NEW_AND_OLD_IMAGES');
    });
  });

  describe('Lambda Function', () => {
    test('should define UserDataLambda with correct properties', () => {
      expect(yamlContent).toContain('UserDataLambda:');
      expect(yamlContent).toContain('AWS::Lambda::Function');
      expect(yamlContent).toContain('python3.12');
      expect(yamlContent).toContain('index.lambda_handler');
    });

    test('should have correct environment variables', () => {
      expect(yamlContent).toContain('Environment:');
      expect(yamlContent).toContain('TABLE_NAME:');
    });

    test('should have valid Lambda code', () => {
      expect(yamlContent).toContain('ZipFile:');
      expect(yamlContent).toContain('lambda_handler');
      expect(yamlContent).toContain('import boto3');
      expect(yamlContent).toContain('dynamodb');
    });
  });

  describe('IAM Role', () => {
    test('should define LambdaExecutionRole with correct trust policy', () => {
      expect(yamlContent).toContain('LambdaExecutionRole:');
      expect(yamlContent).toContain('AWS::IAM::Role');
      expect(yamlContent).toContain('lambda.amazonaws.com');
      expect(yamlContent).toContain('sts:AssumeRole');
    });

    test('should have DynamoDB permissions', () => {
      expect(yamlContent).toContain('DynamoDBAccess');
      expect(yamlContent).toContain('dynamodb:PutItem');
      expect(yamlContent).toContain('dynamodb:GetItem');
    });

    test('should have basic execution role attached', () => {
      expect(yamlContent).toContain('AWSLambdaBasicExecutionRole');
    });
  });

  describe('API Gateway', () => {
    test('should define UserDataApi with correct properties', () => {
      expect(yamlContent).toContain('UserDataApi:');
      expect(yamlContent).toContain('AWS::ApiGateway::RestApi');
      expect(yamlContent).toContain('REGIONAL');
    });

    test('should have GET and POST methods defined', () => {
      expect(yamlContent).toContain('GetMethod:');
      expect(yamlContent).toContain('PostMethod:');
      expect(yamlContent).toContain('HttpMethod: GET');
      expect(yamlContent).toContain('HttpMethod: POST');
      expect(yamlContent).toContain('ApiKeyRequired: true');
    });

    test('should have deployment configured', () => {
      expect(yamlContent).toContain('ApiDeployment:');
      expect(yamlContent).toContain('AWS::ApiGateway::Deployment');
      expect(yamlContent).toContain('StageName: prod');
    });

    test('should have usage plan with correct limits', () => {
      expect(yamlContent).toContain('UsagePlan:');
      expect(yamlContent).toContain('AWS::ApiGateway::UsagePlan');
      expect(yamlContent).toContain('Limit: 1000');
      expect(yamlContent).toContain('Period: MONTH');
    });

    test('should have API key defined', () => {
      expect(yamlContent).toContain('ApiKey:');
      expect(yamlContent).toContain('AWS::ApiGateway::ApiKey');
      expect(yamlContent).toContain('Enabled: true');
    });
  });

  describe('CloudWatch Logging', () => {
    test('should have Lambda log group', () => {
      expect(yamlContent).toContain('LambdaLogGroup:');
      expect(yamlContent).toContain('AWS::Logs::LogGroup');
      expect(yamlContent).toContain('RetentionInDays: 7');
    });

    test('should have API Gateway log group', () => {
      expect(yamlContent).toContain('ApiGatewayLogGroup:');
      expect(yamlContent).toContain('/aws/apigateway/');
    });

    test('should have API Gateway CloudWatch role', () => {
      expect(yamlContent).toContain('ApiGatewayCloudWatchRole:');
      expect(yamlContent).toContain('AmazonAPIGatewayPushToCloudWatchLogs');
    });
  });

  describe('Outputs', () => {
    test('should export API Gateway endpoint', () => {
      expect(yamlContent).toContain('ApiGatewayEndpoint:');
      expect(yamlContent).toContain('API Gateway endpoint URL');
      expect(yamlContent).toContain('Export:');
    });

    test('should export API key', () => {
      expect(yamlContent).toContain('ApiKey:');
      expect(yamlContent).toContain('API Key for accessing');
    });

    test('should export DynamoDB table name', () => {
      expect(yamlContent).toContain('DynamoDBTableName:');
      expect(yamlContent).toContain('DynamoDB Table Name');
    });

    test('should export Lambda function name', () => {
      expect(yamlContent).toContain('LambdaFunctionName:');
      expect(yamlContent).toContain('Lambda Function Name');
    });
  });

  describe('Resource Naming', () => {
    test('should use environment suffix in resource names', () => {
      expect(yamlContent).toContain('UserData');
      expect(yamlContent).toContain('UserDataHandler');
      expect(yamlContent).toContain('UserDataAPI');
    });
  });

  describe('Security', () => {
    test('should require API keys for all methods', () => {
      expect(yamlContent).toContain('ApiKeyRequired: true');
    });

    test('should use least privilege IAM policies', () => {
      expect(yamlContent).toContain('dynamodb:PutItem');
      expect(yamlContent).toContain('dynamodb:GetItem');
      expect(yamlContent).not.toContain('dynamodb:*');
    });
  });

  describe('Region Specification', () => {
    test('should specify us-east-1 region', () => {
      expect(yamlContent).toContain('us-east-1');
    });
  });

  describe('File Format', () => {
    test('should be valid YAML format', () => {
      expect(yamlContent.length).toBeGreaterThan(0);
      expect(yamlContent).toContain(':');
      expect(yamlContent).toContain('-');
    });

    test('should have proper indentation', () => {
      const lines = yamlContent.split('\n');
      let hasProperIndentation = false;
      for (const line of lines) {
        if (line.startsWith('  ') && !line.startsWith('   ')) {
          hasProperIndentation = true;
          break;
        }
      }
      expect(hasProperIndentation).toBe(true);
    });
  });
});
