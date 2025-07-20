import fs from 'fs';
import path from 'path';

describe('Secure Serverless Application Infrastructure CloudFormation Template', () => {
  let template: any;

  beforeAll(() => {
    const templatePath = path.join(__dirname, '../lib/TapStack.json');
    const templateContent = fs.readFileSync(templatePath, 'utf8');
    template = JSON.parse(templateContent);
  });

  describe('Template Structure', () => {
    test('should have correct CFN version and description', () => {
      expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
      expect(template.Description).toBe(
        'Secure Serverless Application Infrastructure'
      );
    });

    test('should have Parameters, Resources, Outputs sections', () => {
      expect(typeof template.Parameters).toBe('object');
      expect(typeof template.Resources).toBe('object');
      expect(typeof template.Outputs).toBe('object');
    });
  });

  describe('Parameters', () => {
    test('should have EnvironmentSuffix parameter', () => {
      expect(template.Parameters.EnvironmentSuffix).toBeDefined();
      expect(template.Parameters.EnvironmentSuffix.Type).toBe('String');
      expect(template.Parameters.EnvironmentSuffix.Default).toBe('dev');
      expect(template.Parameters.EnvironmentSuffix.Description).toMatch(
        /Environment suffix/
      );
      expect(template.Parameters.EnvironmentSuffix.AllowedPattern).toBe(
        '^[a-zA-Z0-9]+$'
      );
      expect(
        template.Parameters.EnvironmentSuffix.ConstraintDescription
      ).toMatch(/alphanumeric/);
    });

    test('should have LambdaRuntime parameter', () => {
      expect(template.Parameters.LambdaRuntime).toBeDefined();
      expect(template.Parameters.LambdaRuntime.Type).toBe('String');
      expect(template.Parameters.LambdaRuntime.Default).toBe('python3.12');
      expect(template.Parameters.LambdaRuntime.Description).toMatch(
        /Lambda runtime/
      );
    });

    test('should not have unexpected parameters', () => {
      const allowed = ['EnvironmentSuffix', 'LambdaRuntime'];
      expect(Object.keys(template.Parameters).sort()).toEqual(allowed.sort());
    });

    test('EnvironmentSuffix AllowedPattern should be a valid regex', () => {
      const pattern = template.Parameters.EnvironmentSuffix.AllowedPattern;
      expect(() => new RegExp(pattern)).not.toThrow();
    });
  });

  describe('Resources', () => {
    test('should have all expected resources', () => {
      const expected = [
        'VPC',
        'PublicSubnet1',
        'PrivateSubnet1',
        'PrivateSubnet2',
        'InternetGateway',
        'AttachGateway',
        'ElasticIP',
        'NatGateway',
        'PublicRouteTable',
        'PrivateRouteTable',
        'PublicRoute',
        'PrivateRoute',
        'PublicSubnetRouteTableAssociation',
        'PrivateSubnet1RouteTableAssociation',
        'PrivateSubnet2RouteTableAssociation',
        'LambdaSecurityGroup',
        'LambdaExecutionRole',
        'LambdaFunction1',
        'LambdaFunction2',
        'ApiGateway',
        'ApiResource',
        'ApiMethod',
        'LambdaApiInvokePermission',
        'ApiDeployment',
        'SSMParameter',
        'SNSTopic',
        'CloudWatchAlarm',
        'BudgetAlert',
      ];
      expect(Object.keys(template.Resources).sort()).toEqual(expected.sort());
    });

    test('VPC resource should be correct', () => {
      const vpc: any = template.Resources.VPC;
      expect(vpc.Type).toBe('AWS::EC2::VPC');
      expect(vpc.Properties.CidrBlock).toBe('10.1.0.0/16');
      expect(vpc.Properties.EnableDnsSupport).toBe(true);
      expect(vpc.Properties.EnableDnsHostnames).toBe(true);
    });

    test('LambdaExecutionRole should have required EC2 and logs permissions', () => {
      const role: any = template.Resources.LambdaExecutionRole;
      expect(role.Type).toBe('AWS::IAM::Role');
      const statements = role.Properties.Policies[0].PolicyDocument.Statement;
      const ec2Statement = statements.find(
        (s: any) =>
          Array.isArray(s.Action) &&
          s.Action.includes('ec2:CreateNetworkInterface')
      );
      expect(ec2Statement).toBeDefined();
      expect(ec2Statement.Action).toEqual(
        expect.arrayContaining([
          'ec2:CreateNetworkInterface',
          'ec2:DescribeNetworkInterfaces',
          'ec2:DeleteNetworkInterface',
          'ec2:DescribeVpcs',
          'ec2:DescribeSubnets',
          'ec2:DescribeSecurityGroups',
        ])
      );
      const logsStatement = statements.find(
        (s: any) =>
          Array.isArray(s.Action) && s.Action.includes('logs:CreateLogGroup')
      );
      expect(logsStatement).toBeDefined();
    });

    test('Lambda functions should use VPC config and security group', () => {
      ['LambdaFunction1', 'LambdaFunction2'].forEach(fnName => {
        const fn: any = template.Resources[fnName];
        expect(fn.Type).toBe('AWS::Lambda::Function');
        expect(fn.Properties.VpcConfig).toBeDefined();
        expect(fn.Properties.VpcConfig.SecurityGroupIds).toEqual([
          { Ref: 'LambdaSecurityGroup' },
        ]);
        expect(fn.Properties.VpcConfig.SubnetIds).toEqual([
          { Ref: 'PrivateSubnet1' },
          { Ref: 'PrivateSubnet2' },
        ]);
      });
    });

    test('Lambda functions should use expected runtime and handler', () => {
      ['LambdaFunction1', 'LambdaFunction2'].forEach(fnName => {
        const fn: any = template.Resources[fnName];
        expect(fn.Properties.Handler).toBe('index.handler');
        expect(fn.Properties.Runtime).toEqual({ Ref: 'LambdaRuntime' });
      });
    });

    test('ApiGateway, ApiResource, ApiMethod should be present', () => {
      expect(template.Resources.ApiGateway.Type).toBe(
        'AWS::ApiGateway::RestApi'
      );
      expect(template.Resources.ApiResource.Type).toBe(
        'AWS::ApiGateway::Resource'
      );
      expect(template.Resources.ApiMethod.Type).toBe('AWS::ApiGateway::Method');
    });

    test('SSMParameter should be of type String and have correct name', () => {
      const ssm: any = template.Resources.SSMParameter;
      expect(ssm.Type).toBe('AWS::SSM::Parameter');
      expect(ssm.Properties.Type).toBe('String');
      expect(ssm.Properties.Name).toEqual({
        'Fn::Sub': '/secure-${EnvironmentSuffix}/api-key',
      });
    });

    test('CloudWatchAlarm should reference LambdaFunction1', () => {
      const alarm: any = template.Resources.CloudWatchAlarm;
      expect(alarm.Type).toBe('AWS::CloudWatch::Alarm');
      const dim = (alarm.Properties.Dimensions as any[]).find(
        (d: any) => d.Name === 'FunctionName'
      );
      expect(dim).toBeDefined();
      expect(dim.Value).toEqual({ Ref: 'LambdaFunction1' });
    });

    test('BudgetAlert should have budget limit 10 USD monthly', () => {
      const budget: any = template.Resources.BudgetAlert;
      expect(budget.Type).toBe('AWS::Budgets::Budget');
      expect(budget.Properties.Budget.BudgetLimit.Amount).toBe(10);
      expect(budget.Properties.Budget.BudgetLimit.Unit).toBe('USD');
      expect(budget.Properties.Budget.TimeUnit).toBe('MONTHLY');
      expect(budget.Properties.Budget.BudgetType).toBe('COST');
    });

    test('No deprecated or forbidden properties in LambdaExecutionRole', () => {
      const role: any = template.Resources.LambdaExecutionRole;
      expect(role.Properties.RoleName).toBeUndefined();
      expect(role.Properties.ManagedPolicyArns).toBeUndefined();
    });

    test('All resource logical IDs should be unique', () => {
      const ids = Object.keys(template.Resources);
      const unique = new Set(ids);
      expect(unique.size).toBe(ids.length);
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
        'ApiEndpoint',
        'LambdaFunction1Arn',
        'LambdaFunction2Arn',
        'SSMParameterName',
        'CloudWatchAlarmName',
        'SNSTopicArn',
      ];
      expect(Object.keys(template.Outputs).sort()).toEqual(expected.sort());
    });

    test('ApiEndpoint output should use Fn::Sub with ApiGateway', () => {
      const output: any = template.Outputs.ApiEndpoint;
      expect(output.Value).toEqual({
        'Fn::Sub':
          'https://${ApiGateway}.execute-api.${AWS::Region}.amazonaws.com/v1',
      });
    });

    test('LambdaFunction1Arn and LambdaFunction2Arn outputs should use Fn::GetAtt', () => {
      const output1: any = template.Outputs.LambdaFunction1Arn;
      const output2: any = template.Outputs.LambdaFunction2Arn;
      expect(output1.Value).toEqual({
        'Fn::GetAtt': ['LambdaFunction1', 'Arn'],
      });
      expect(output2.Value).toEqual({
        'Fn::GetAtt': ['LambdaFunction2', 'Arn'],
      });
    });

    test('SSMParameterName output should reference SSMParameter', () => {
      const output: any = template.Outputs.SSMParameterName;
      expect(output.Value).toEqual({ Ref: 'SSMParameter' });
    });

    test('CloudWatchAlarmName output should reference CloudWatchAlarm', () => {
      const output: any = template.Outputs.CloudWatchAlarmName;
      expect(output.Value).toEqual({ Ref: 'CloudWatchAlarm' });
    });

    test('SNSTopicArn output should reference SNSTopic', () => {
      const output: any = template.Outputs.SNSTopicArn;
      expect(output.Value).toEqual({ Ref: 'SNSTopic' });
    });

    test('All outputs should have Description and Value', () => {
      Object.values(template.Outputs).forEach((output: any) => {
        expect(output.Description).toBeDefined();
        expect(output.Value).toBeDefined();
      });
    });

    test('All outputs should not be empty values', () => {
      Object.values(template.Outputs).forEach((output: any) => {
        expect(output.Value).toBeDefined();
        if (typeof output.Value === 'string') {
          expect(output.Value.length).toBeGreaterThan(0);
        }
      });
    });
  });

  describe('Edge Cases and Negative Tests', () => {
    test('should not have unexpected parameters', () => {
      const allowed = ['EnvironmentSuffix', 'LambdaRuntime'];
      Object.keys(template.Parameters).forEach(param => {
        expect(allowed).toContain(param);
      });
    });

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

    test('should not have deprecated or forbidden properties in LambdaFunction1', () => {
      const fn: any = template.Resources.LambdaFunction1;
      expect(fn.Properties.ReservedConcurrentExecutions).toBeUndefined();
      expect(fn.Properties.Layers).toBeUndefined();
    });
  });
});
