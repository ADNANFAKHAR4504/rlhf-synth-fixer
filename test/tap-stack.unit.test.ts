import fs from 'fs';
import path from 'path';

describe('Greeting API CloudFormation Template', () => {
  let template: any;

  beforeAll(() => {
    // Load the JSON version of the CloudFormation template
    // The user should ensure the YAML is converted to JSON before running tests.
    const templatePath = path.join(__dirname, '../lib/TapStack.json'); // Assumes the JSON file is named TapStack.json
    const templateContent = fs.readFileSync(templatePath, 'utf8');
    template = JSON.parse(templateContent);
  });

  describe('Template Structure', () => {
    test('should have a valid CloudFormation format version', () => {
      expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
    });

    test('should have a description', () => {
      expect(template.Description).toBeDefined();
      expect(template.Description).toContain(
        'A secure, serverless greeting API using API Gateway and Lambda.'
      );
    });

    test('should not have any parameters', () => {
      expect(template.Parameters).toBeUndefined();
    });
  });

  describe('Resources', () => {
    const expectedResources = [
      'GreetingApi',
      'GreetingResource',
      'GreetingMethod',
      'GreetingDeployment',
      'GreetingStage',
      'LambdaExecutionRole',
      'GreetingFunction',
      'LambdaInvokePermission',
      'LogGroup',
    ];

    test('should have all required resources', () => {
      expectedResources.forEach(resourceId => {
        expect(template.Resources[resourceId]).toBeDefined();
      });
      const resourceCount = Object.keys(template.Resources).length;
      expect(resourceCount).toBe(expectedResources.length);
    });

    describe('GreetingFunction', () => {
      let func: any;
      beforeAll(() => {
        func = template.Resources.GreetingFunction;
      });

      test('should be an AWS Lambda Function', () => {
        expect(func.Type).toBe('AWS::Lambda::Function');
      });

      test('should use python3.12 runtime', () => {
        expect(func.Properties.Runtime).toBe('python3.12');
      });

      test('should have the correct handler', () => {
        expect(func.Properties.Handler).toBe('index.handler');
      });

      test('should have the correct environment variable for the greeting message', () => {
        const envVars = func.Properties.Environment.Variables;
        expect(envVars.GREETING_MESSAGE).toBe('Hello from a secure, serverless API!');
      });

      test('should be linked to the correct IAM Role', () => {
        expect(func.Properties.Role['Fn::GetAtt'][0]).toBe('LambdaExecutionRole');
      });
    });

    describe('LambdaExecutionRole', () => {
      let role: any;
      beforeAll(() => {
        role = template.Resources.LambdaExecutionRole;
      });

      test('should be an AWS IAM Role', () => {
        expect(role.Type).toBe('AWS::IAM::Role');
      });

      test('should have a trust policy for the Lambda service', () => {
        const policy = role.Properties.AssumeRolePolicyDocument.Statement[0];
        expect(policy.Effect).toBe('Allow');
        expect(policy.Principal.Service).toBe('lambda.amazonaws.com');
        expect(policy.Action).toBe('sts:AssumeRole');
      });

      test('should have a policy to write logs to the correct LogGroup', () => {
        const policy = role.Properties.Policies[0].PolicyDocument.Statement[0];
        expect(policy.Effect).toBe('Allow');
        expect(policy.Action).toEqual(['logs:CreateLogStream', 'logs:PutLogEvents']);
        expect(policy.Resource['Fn::GetAtt'][0]).toBe('LogGroup');
      });
    });

    describe('LogGroup', () => {
      let logGroup: any;
      beforeAll(() => {
        logGroup = template.Resources.LogGroup;
      });

      test('should be an AWS Logs LogGroup', () => {
        expect(logGroup.Type).toBe('AWS::Logs::LogGroup');
      });

      test('should have the correct static log group name', () => {
        expect(logGroup.Properties.LogGroupName).toBe('/aws/lambda/GreetingApiFunction');
      });

      test('should have a retention policy of 7 days', () => {
        expect(logGroup.Properties.RetentionInDays).toBe(7);
      });
    });

    describe('API Gateway', () => {
      test('GreetingApi should be an AWS ApiGateway RestApi', () => {
        expect(template.Resources.GreetingApi.Type).toBe('AWS::ApiGateway::RestApi');
      });

      test('GreetingResource should have the correct path part', () => {
        expect(template.Resources.GreetingResource.Properties.PathPart).toBe('greet');
      });

      test('GreetingMethod should be a GET method', () => {
        expect(template.Resources.GreetingMethod.Properties.HttpMethod).toBe('GET');
      });

      test('GreetingStage should be named "prod"', () => {
        expect(template.Resources.GreetingStage.Properties.StageName).toBe('prod');
      });
    });

    describe('LambdaInvokePermission', () => {
      let permission: any;
      beforeAll(() => {
        permission = template.Resources.LambdaInvokePermission;
      });

      test('should be an AWS Lambda Permission', () => {
        expect(permission.Type).toBe('AWS::Lambda::Permission');
      });

      test('should allow invocation from API Gateway', () => {
        expect(permission.Properties.Principal).toBe('apigateway.amazonaws.com');
      });

      test('should have a source ARN to restrict invocation to the specific API Gateway', () => {
        const sourceArn = permission.Properties.SourceArn['Fn::Sub'];
        expect(sourceArn).toContain('arn:${AWS::Partition}:execute-api:${AWS::Region}:${AWS::AccountId}:${GreetingApi}/*/GET/greet');
      });
    });
  });

  describe('Outputs', () => {
    test('should have exactly one output', () => {
      const outputCount = Object.keys(template.Outputs).length;
      expect(outputCount).toBe(1);
    });

    test('should have the ApiUrl output', () => {
      expect(template.Outputs.ApiUrl).toBeDefined();
    });

    test('ApiUrl output should be correctly configured', () => {
      const output = template.Outputs.ApiUrl;
      expect(output.Description).toBe('URL for invoking the Greeting API');
      const urlSub = output.Value['Fn::Sub'];
      expect(urlSub).toBe('https://${GreetingApi}.execute-api.${AWS::Region}.amazonaws.com/prod/greet');
    });
  });
});
