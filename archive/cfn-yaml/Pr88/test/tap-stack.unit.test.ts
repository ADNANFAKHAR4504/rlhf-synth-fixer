import fs from 'fs';
import path from 'path';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

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

    test('should have a description', () => {
      expect(template.Description).toBeDefined();
      expect(typeof template.Description).toBe('string');
      expect(template.Description.length).toBeGreaterThan(0);
    });

    test('should have Parameters, Resources, Outputs sections', () => {
      expect(typeof template.Parameters).toBe('object');
      expect(typeof template.Resources).toBe('object');
      expect(typeof template.Outputs).toBe('object');
    });
  });

  describe('Parameters', () => {
    test('should have all required parameters', () => {
      const expected = [
        'EnvironmentSuffix',
        'LambdaRuntime',
        'DynamoDBTableName',
      ];
      expect(Object.keys(template.Parameters).sort()).toEqual(expected.sort());
    });

    test('EnvironmentSuffix parameter should have correct properties', () => {
      const p = template.Parameters.EnvironmentSuffix;
      expect(p.Type).toBe('String');
      expect(p.Default).toBe('dev');
      expect(p.Description).toMatch(/environment suffix/i);
      expect(p.AllowedPattern).toBe('^[a-zA-Z0-9]+$');
      expect(p.ConstraintDescription).toMatch(/alphanumeric/i);
    });

    test('LambdaRuntime parameter should have correct properties', () => {
      const p = template.Parameters.LambdaRuntime;
      expect(p.Type).toBe('String');
      expect(p.Default).toBe('nodejs20.x');
      expect(p.AllowedValues).toContain('nodejs20.x');
      expect(p.AllowedValues).toContain('python3.12');
    });

    test('DynamoDBTableName parameter should have correct properties', () => {
      const p = template.Parameters.DynamoDBTableName;
      expect(p.Type).toBe('String');
      expect(p.Default).toBe('RequestData');
    });
  });

  describe('Resources', () => {
    test('should have all expected resources', () => {
      const expected = [
        'TurnAroundPromptTable',
        'LambdaExecutionRole',
        'LambdaFunction1',
        'LambdaFunction2',
        'DynamoDBTable',
        'ApiGatewayRestApi',
        'ApiGatewayResource',
        'ApiGatewayMethod1',
        'ApiGatewayMethod2',
        'LambdaPermission1',
        'LambdaPermission2',
        'ApiGatewayDeployment',
        'ApiGatewayStage',
      ];
      expect(Object.keys(template.Resources).sort()).toEqual(expected.sort());
    });

    test('TurnAroundPromptTable should be a DynamoDB table with correct properties', () => {
      const r = template.Resources.TurnAroundPromptTable;
      expect(r.Type).toBe('AWS::DynamoDB::Table');
      expect(r.Properties.TableName['Fn::Sub']).toMatch(
        /TurnAroundPromptTable\${EnvironmentSuffix}/
      );
      expect(r.Properties.BillingMode).toBe('PAY_PER_REQUEST');
      expect(r.Properties.DeletionProtectionEnabled).toBe(false);
      expect(r.DeletionPolicy).toBe('Delete');
      expect(r.UpdateReplacePolicy).toBe('Delete');
    });

    test('LambdaExecutionRole should be an IAM role with correct policies', () => {
      const r = template.Resources.LambdaExecutionRole;
      expect(r.Type).toBe('AWS::IAM::Role');
      expect(r.Properties.AssumeRolePolicyDocument).toBeDefined();
      const policies = r.Properties.Policies[0].PolicyDocument.Statement;
      const logsStatement = policies.find((s: any) =>
        s.Action.includes('logs:CreateLogGroup')
      );
      expect(logsStatement).toBeDefined();
      const dynamoStatement = policies.find(
        (s: any) =>
          Array.isArray(s.Action) && s.Action.includes('dynamodb:PutItem')
      );
      expect(dynamoStatement).toBeDefined();
    });

    test('LambdaFunction1 and LambdaFunction2 should be Lambda functions with correct properties', () => {
      ['LambdaFunction1', 'LambdaFunction2'].forEach(fnName => {
        const fn = template.Resources[fnName];
        expect(fn.Type).toBe('AWS::Lambda::Function');
        expect(fn.Properties.Runtime).toEqual({ Ref: 'LambdaRuntime' });
        expect(fn.Properties.Handler).toBe('index.handler');
        expect(fn.Properties.Role['Fn::GetAtt'][0]).toBe('LambdaExecutionRole');
        expect(fn.Properties.Code.ZipFile).toMatch(/exports\.handler/);
      });
    });

    test('DynamoDBTable should be a DynamoDB table with correct properties', () => {
      const r = template.Resources.DynamoDBTable;
      expect(r.Type).toBe('AWS::DynamoDB::Table');
      expect(r.Properties.TableName['Fn::Sub']).toMatch(
        /\${DynamoDBTableName}-\${EnvironmentSuffix}/
      );
      expect(r.Properties.BillingMode).toBe('PAY_PER_REQUEST');
      expect(r.Properties.AttributeDefinitions[0].AttributeName).toBe(
        'RequestId'
      );
      expect(r.Properties.KeySchema[0].AttributeName).toBe('RequestId');
    });

    test('API Gateway resources should be present and wired up', () => {
      const restApi = template.Resources.ApiGatewayRestApi;
      expect(restApi.Type).toBe('AWS::ApiGateway::RestApi');
      const resource = template.Resources.ApiGatewayResource;
      expect(resource.Type).toBe('AWS::ApiGateway::Resource');
      expect(resource.Properties.ParentId['Fn::GetAtt'][0]).toBe(
        'ApiGatewayRestApi'
      );
      expect(resource.Properties.PathPart).toBe('requests');
      expect(resource.Properties.RestApiId).toEqual({
        Ref: 'ApiGatewayRestApi',
      });
    });

    test('API Gateway methods should reference correct Lambdas', () => {
      const m1 = template.Resources.ApiGatewayMethod1;
      expect(m1.Type).toBe('AWS::ApiGateway::Method');
      expect(m1.Properties.Integration.Uri['Fn::Sub']).toContain(
        '${LambdaFunction1.Arn}'
      );
      const m2 = template.Resources.ApiGatewayMethod2;
      expect(m2.Type).toBe('AWS::ApiGateway::Method');
      expect(m2.Properties.Integration.Uri['Fn::Sub']).toContain(
        '${LambdaFunction2.Arn}'
      );
    });

    test('API Gateway deployment and stage should be present', () => {
      const dep = template.Resources.ApiGatewayDeployment;
      const stage = template.Resources.ApiGatewayStage;
      expect(dep.Type).toBe('AWS::ApiGateway::Deployment');
      expect(stage.Type).toBe('AWS::ApiGateway::Stage');
      expect(stage.Properties.StageName).toBe('prod');
      expect(stage.Properties.RestApiId).toEqual({ Ref: 'ApiGatewayRestApi' });
      expect(stage.Properties.DeploymentId).toEqual({
        Ref: 'ApiGatewayDeployment',
      });
    });

    test('Lambda permissions should reference correct functions', () => {
      const perm1 = template.Resources.LambdaPermission1;
      expect(perm1.Type).toBe('AWS::Lambda::Permission');
      expect(perm1.Properties.FunctionName['Fn::GetAtt'][0]).toBe(
        'LambdaFunction1'
      );
      const perm2 = template.Resources.LambdaPermission2;
      expect(perm2.Type).toBe('AWS::Lambda::Permission');
      expect(perm2.Properties.FunctionName['Fn::GetAtt'][0]).toBe(
        'LambdaFunction2'
      );
    });

    test('All resources should have Type and Properties', () => {
      Object.values(template.Resources).forEach((resource: any) => {
        expect(resource.Type).toBeDefined();
        expect(resource.Properties).toBeDefined();
      });
    });
  });

  describe('Outputs', () => {
    test('should have all required outputs', () => {
      const expected = [
        'TurnAroundPromptTableName',
        'TurnAroundPromptTableArn',
        'StackName',
        'EnvironmentSuffix',
        'ApiEndpoint',
        'Function1Arn',
        'Function2Arn',
        'DynamoDBTableArn',
        'DynamoDBTableNameOutput',
        'ExecutionRoleName',
      ];
      expect(Object.keys(template.Outputs).sort()).toEqual(expected.sort());
    });

    test('ApiEndpoint output should use prod stage', () => {
      const o = template.Outputs.ApiEndpoint;
      expect(o.Value['Fn::Sub']).toContain(
        '.execute-api.${AWS::Region}.amazonaws.com/prod/requests'
      );
    });

    test('Function1Arn and Function2Arn outputs should use Fn::GetAtt', () => {
      expect(template.Outputs.Function1Arn.Value['Fn::GetAtt'][0]).toBe(
        'LambdaFunction1'
      );
      expect(template.Outputs.Function2Arn.Value['Fn::GetAtt'][0]).toBe(
        'LambdaFunction2'
      );
    });

    test('DynamoDBTableArn output should use Fn::GetAtt', () => {
      expect(template.Outputs.DynamoDBTableArn.Value['Fn::GetAtt'][0]).toBe(
        'DynamoDBTable'
      );
    });

    test('DynamoDBTableNameOutput output should use Ref', () => {
      expect(template.Outputs.DynamoDBTableNameOutput.Value).toEqual({
        Ref: 'DynamoDBTable',
      });
    });

    test('ExecutionRoleName output should use Ref', () => {
      expect(template.Outputs.ExecutionRoleName.Value).toEqual({
        Ref: 'LambdaExecutionRole',
      });
    });

    test('All outputs should have Value', () => {
      Object.values(template.Outputs).forEach((output: any) => {
        expect(output.Value).toBeDefined();
      });
    });
  });

  describe('Naming and Conventions', () => {
    test('All resource names and tags should include environment suffix', () => {
      Object.values(template.Resources).forEach((resource: any) => {
        if (
          resource.Properties &&
          resource.Properties.TableName &&
          typeof resource.Properties.TableName['Fn::Sub'] === 'string'
        ) {
          expect(resource.Properties.TableName['Fn::Sub']).toMatch(
            /\${EnvironmentSuffix}/
          );
        }
        if (
          resource.Properties &&
          resource.Properties.FunctionName &&
          typeof resource.Properties.FunctionName['Fn::Sub'] === 'string'
        ) {
          expect(resource.Properties.FunctionName['Fn::Sub']).toMatch(
            /\${EnvironmentSuffix}/
          );
        }
        if (
          resource.Properties &&
          resource.Properties.Name &&
          typeof resource.Properties.Name['Fn::Sub'] === 'string'
        ) {
          expect(resource.Properties.Name['Fn::Sub']).toMatch(
            /\${EnvironmentSuffix}/
          );
        }
      });
    });
  });

  describe('Edge Cases and Validation', () => {
    test('should not have any undefined or null required sections', () => {
      [
        'AWSTemplateFormatVersion',
        'Description',
        'Parameters',
        'Resources',
        'Outputs',
      ].forEach(key => {
        expect(template[key]).toBeDefined();
        expect(template[key]).not.toBeNull();
      });
    });
    test('All resources should have unique logical IDs', () => {
      const ids = Object.keys(template.Resources);
      const unique = new Set(ids);
      expect(unique.size).toBe(ids.length);
    });
  });
});
