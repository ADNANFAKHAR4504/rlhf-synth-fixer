import fs from 'fs';
import path from 'path';

describe('TapStack CloudFormation Template', () => {
  let template: any;

  beforeAll(() => {
    // Adjust the path as needed
    const templatePath = path.join(__dirname, '../lib/TapStack.json');
    const templateContent = fs.readFileSync(templatePath, 'utf8');
    template = JSON.parse(templateContent);
  });

  test('Template structure is valid', () => {
    expect(template).toBeDefined();
    expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
    expect(template.Description).toContain('serverless API stack');
    expect(template.Parameters).toBeDefined();
    expect(template.Resources).toBeDefined();
    expect(template.Outputs).toBeDefined();
  });

  describe('Parameters', () => {
    it('defines all required parameters with correct defaults', () => {
      expect(template.Parameters.EnvironmentSuffix).toBeDefined();
      expect(template.Parameters.Name).toBeDefined();
      expect(template.Parameters.Name.Default).toBe('tapstack');
      expect(template.Parameters.Team).toBeDefined();
      expect(template.Parameters.Team.Default).toBe('team');
      expect(template.Parameters.Region).toBeDefined();
      expect(template.Parameters.Region.Default).toBe('us-east-1');
    });

    it('all parameter types are String', () => {
      Object.values(template.Parameters).forEach((param: any) => {
        expect(param.Type).toBe('String');
      });
    });

    it('does not allow extra parameters', () => {
      const allowed = ['EnvironmentSuffix', 'Name', 'Team', 'Region'];
      Object.keys(template.Parameters).forEach(key => {
        expect(allowed).toContain(key);
      });
    });
  });

  describe('Resources', () => {
    it('defines LambdaExecutionRole with correct assume role and policies', () => {
      const role = template.Resources.LambdaExecutionRole;
      expect(role).toBeDefined();
      expect(role.Type).toBe('AWS::IAM::Role');
      const assume = role.Properties.AssumeRolePolicyDocument.Statement[0];
      expect(assume.Principal.Service).toBe('lambda.amazonaws.com');
      expect(assume.Action).toBe('sts:AssumeRole');
      const policy = role.Properties.Policies[0].PolicyDocument.Statement[0];
      expect(policy.Action).toContain('dynamodb:PutItem');
      expect(policy.Action).toContain('dynamodb:GetItem');
      expect(policy.Resource['Fn::GetAtt']).toEqual(['DynamoDBTable', 'Arn']);
    });

    it('defines MyLambdaFunction with inline code and correct env', () => {
      const lambda = template.Resources.MyLambdaFunction;
      expect(lambda).toBeDefined();
      expect(lambda.Type).toBe('AWS::Lambda::Function');
      expect(lambda.Properties.Runtime).toBe('python3.9');
      expect(lambda.Properties.Handler).toBe('index.handler');
      expect(lambda.Properties.Role['Fn::GetAtt']).toContain(
        'LambdaExecutionRole'
      );
      expect(lambda.Properties.Code.ZipFile).toContain('def handler');
      expect(lambda.Properties.MemorySize).toBe(512);
      expect(lambda.Properties.Timeout).toBe(15);
      expect(lambda.Properties.Environment.Variables.TABLE_NAME.Ref).toBe(
        'DynamoDBTable'
      );
      expect(lambda.Properties.TracingConfig.Mode).toBe('Active');
    });

    it('defines DynamoDBTable with correct schema', () => {
      const table = template.Resources.DynamoDBTable;
      expect(table).toBeDefined();
      expect(table.Type).toBe('AWS::DynamoDB::Table');
      expect(table.Properties.BillingMode).toBe('PAY_PER_REQUEST');
      expect(table.Properties.AttributeDefinitions[0].AttributeName).toBe('id');
      expect(table.Properties.AttributeDefinitions[0].AttributeType).toBe('S');
      expect(table.Properties.KeySchema[0].AttributeName).toBe('id');
      expect(table.Properties.KeySchema[0].KeyType).toBe('HASH');
    });

    it('defines ApiGateway with REGIONAL endpoint', () => {
      const api = template.Resources.ApiGateway;
      expect(api).toBeDefined();
      expect(api.Type).toBe('AWS::ApiGateway::RestApi');
      expect(api.Properties.EndpointConfiguration.Types).toContain('REGIONAL');
      expect(api.Properties.Name['Fn::Sub']).toContain('${EnvironmentSuffix}');
      expect(api.Properties.Description).toBe('Serverless API');
    });

    it('defines ApiGatewayRootMethod with Lambda proxy integration', () => {
      const method = template.Resources.ApiGatewayRootMethod;
      expect(method).toBeDefined();
      expect(method.Type).toBe('AWS::ApiGateway::Method');
      expect(method.Properties.HttpMethod).toBe('ANY');
      expect(method.Properties.Integration.Type).toBe('AWS_PROXY');
      expect(method.Properties.Integration.Uri['Fn::Sub']).toContain(
        'apigateway:${Region}:lambda:path'
      );
      expect(method.Properties.AuthorizationType).toBe('NONE');
    });

    it('defines ApiGatewayDeployment with correct dependencies', () => {
      const deploy = template.Resources.ApiGatewayDeployment;
      expect(deploy).toBeDefined();
      expect(deploy.Type).toBe('AWS::ApiGateway::Deployment');
      expect(deploy.DependsOn).toBe('ApiGatewayRootMethod');
      expect(deploy.Properties.RestApiId.Ref).toBe('ApiGateway');
      expect(deploy.Properties.StageName.Ref).toBe('EnvironmentSuffix');
    });

    it('defines LambdaApiInvokePermission for API Gateway', () => {
      const perm = template.Resources.LambdaApiInvokePermission;
      expect(perm).toBeDefined();
      expect(perm.Type).toBe('AWS::Lambda::Permission');
      expect(perm.Properties.FunctionName['Fn::GetAtt']).toEqual([
        'MyLambdaFunction',
        'Arn',
      ]);
      expect(perm.Properties.Action).toBe('lambda:InvokeFunction');
      expect(perm.Properties.Principal).toBe('apigateway.amazonaws.com');
      expect(perm.Properties.SourceArn['Fn::Sub']).toContain(
        'execute-api:${Region}'
      );
    });

    it('defines LogGroup with correct retention', () => {
      const logGroup = template.Resources.LogGroup;
      expect(logGroup).toBeDefined();
      expect(logGroup.Type).toBe('AWS::Logs::LogGroup');
      expect(logGroup.Properties.RetentionInDays).toBe(14);
      expect(logGroup.Properties.LogGroupName['Fn::Sub']).toContain(
        '/aws/apigateway/'
      );
    });

    it('defines LambdaErrorAlarm with correct properties', () => {
      const alarm = template.Resources.LambdaErrorAlarm;
      expect(alarm).toBeDefined();
      expect(alarm.Type).toBe('AWS::CloudWatch::Alarm');
      expect(alarm.Properties.MetricName).toBe('Errors');
      expect(alarm.Properties.Namespace).toBe('AWS/Lambda');
      expect(alarm.Properties.Statistic).toBe('Sum');
      expect(alarm.Properties.Period).toBe(300);
      expect(alarm.Properties.EvaluationPeriods).toBe(1);
      expect(alarm.Properties.Threshold).toBe(1);
      expect(alarm.Properties.ComparisonOperator).toBe(
        'GreaterThanOrEqualToThreshold'
      );
      expect(Array.isArray(alarm.Properties.AlarmActions)).toBe(true);
      expect(alarm.Properties.Dimensions[0].Name).toBe('FunctionName');
      expect(alarm.Properties.Dimensions[0].Value.Ref).toBe('MyLambdaFunction');
      expect(alarm.Properties.AlarmName['Fn::Sub']).toContain(
        '${EnvironmentSuffix}'
      );
    });

    it('all resource logical IDs are unique', () => {
      const ids = Object.keys(template.Resources);
      const unique = Array.from(new Set(ids));
      expect(ids.length).toBe(unique.length);
    });
  });

  describe('Outputs', () => {
    it('outputs ApiEndpoint with correct substitution', () => {
      const output = template.Outputs.ApiEndpoint;
      expect(output).toBeDefined();
      expect(output.Value['Fn::Sub']).toContain(
        'https://${ApiGateway}.execute-api.${Region}.amazonaws.com/${EnvironmentSuffix}'
      );
    });

    it('outputs LambdaArn', () => {
      const output = template.Outputs.LambdaArn;
      expect(output).toBeDefined();
      expect(output.Value['Fn::GetAtt']).toEqual(['MyLambdaFunction', 'Arn']);
    });

    it('outputs DynamoDBTable', () => {
      const output = template.Outputs.DynamoDBTable;
      expect(output).toBeDefined();
      expect(output.Value.Ref).toBe('DynamoDBTable');
    });

    it('outputs LogGroupName', () => {
      const output = template.Outputs.LogGroupName;
      expect(output).toBeDefined();
      expect(output.Value.Ref).toBe('LogGroup');
    });

    it('outputs AlarmName', () => {
      const output = template.Outputs.AlarmName;
      expect(output).toBeDefined();
      expect(output.Value['Fn::Sub']).toContain('${EnvironmentSuffix}');
    });

    it('all outputs reference valid resources or parameters', () => {
      Object.values(template.Outputs).forEach((output: any) => {
        if (output.Value.Ref) {
          expect(template.Resources[output.Value.Ref]).toBeDefined();
        }
        if (output.Value['Fn::GetAtt']) {
          const logicalId = output.Value['Fn::GetAtt'][0];
          expect(template.Resources[logicalId]).toBeDefined();
        }
      });
    });
  });

  describe('Edge Cases and Negative Checks', () => {
    it('should not define forbidden or deprecated resources', () => {
      expect(template.Resources.ArtifactsBucket).toBeUndefined();
      expect(template.Resources.ApiGatewayDomain).toBeUndefined();
    });

    it('should not define forbidden outputs', () => {
      expect(template.Outputs.CustomDomain).toBeUndefined();
      expect(template.Outputs.ArtifactsBucketName).toBeUndefined();
      expect(template.Outputs.AlarmArn).toBeUndefined();
    });

    it('fails gracefully if resource is missing', () => {
      expect(template.Resources.NonExistentResource).toBeUndefined();
    });
  });
});
