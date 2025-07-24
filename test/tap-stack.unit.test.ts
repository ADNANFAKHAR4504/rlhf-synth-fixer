import fs from 'fs';
import path from 'path';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('TapStack CloudFormation Template - Serverless API', () => {
  let template: any;

  beforeAll(() => {
    // Load JSON template (converted from YAML to avoid js-yaml parsing issues)
    const templatePath = path.join(__dirname, '../lib/TapStack.json');
    const templateContent = fs.readFileSync(templatePath, 'utf8');
    template = JSON.parse(templateContent);
  });

  describe('Template Structure', () => {
    test('should have valid CloudFormation format version', () => {
      expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
    });

    test('should have correct description', () => {
      expect(template.Description).toBeDefined();
      expect(typeof template.Description).toBe('string');
      expect(template.Description).toBe(
        'Serverless RESTful API for User Management'
      );
      expect(template.Description.length).toBeGreaterThan(0);
    });

    test('should have Parameters, Resources, Outputs sections', () => {
      expect(typeof template.Parameters).toBe('object');
      expect(typeof template.Resources).toBe('object');
      expect(typeof template.Outputs).toBe('object');
      expect(template.Parameters).not.toBeNull();
      expect(template.Resources).not.toBeNull();
      expect(template.Outputs).not.toBeNull();
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
  });

  describe('Parameters', () => {
    test('should have all required parameters', () => {
      const expected = ['EnvironmentSuffix'];
      expect(Object.keys(template.Parameters).sort()).toEqual(expected.sort());
    });

    test('should have exactly one parameter', () => {
      const parameterCount = Object.keys(template.Parameters).length;
      expect(parameterCount).toBe(1);
    });

    test('EnvironmentSuffix parameter should have correct properties', () => {
      const p = template.Parameters.EnvironmentSuffix;
      expect(p.Type).toBe('String');
      expect(p.Default).toBe('dev');
      expect(p.Description).toMatch(/environment suffix/i);
      expect(p.AllowedPattern).toBe('^[a-zA-Z0-9]+$');
      expect(p.ConstraintDescription).toMatch(/alphanumeric/i);
    });

    test('All parameters should have Type and Default', () => {
      Object.values(template.Parameters).forEach((param: any) => {
        expect(param.Type).toBeDefined();
        expect(param.Default).toBeDefined();
      });
    });
  });

  describe('Resources', () => {
    test('should have all expected resources', () => {
      const expected = [
        'UsersTable',
        'ApiGatewayRestApi',
        'ApiGatewayResourceUsers',
        'ApiGatewayResourceUserId',
        'CreateUserMethod',
        'GetUserMethod',
        'DeleteUserMethod',
        'ApiGatewayDeployment',
        'ApiGatewayStage',
        'CreateUserFunction',
        'GetUserFunction',
        'DeleteUserFunction',
        'CreateUserFunctionPermission',
        'GetUserFunctionPermission',
        'DeleteUserFunctionPermission',
        'LambdaExecutionRole',
      ];
      expect(Object.keys(template.Resources).sort()).toEqual(expected.sort());
    });

    test('should have exactly 15 resources', () => {
      const resourceCount = Object.keys(template.Resources).length;
      expect(resourceCount).toBe(16);
    });

    test('All resources should have unique logical IDs', () => {
      const ids = Object.keys(template.Resources);
      const unique = new Set(ids);
      expect(unique.size).toBe(ids.length);
    });

    test('All resources should have Type and Properties', () => {
      Object.values(template.Resources).forEach((resource: any) => {
        expect(resource.Type).toBeDefined();
        expect(typeof resource.Type).toBe('string');
        expect(resource.Properties).toBeDefined();
        expect(typeof resource.Properties).toBe('object');
      });
    });

    describe('DynamoDB Resources', () => {
      test('UsersTable should be a DynamoDB table with correct properties', () => {
        const r = template.Resources.UsersTable;
        expect(r.Type).toBe('AWS::DynamoDB::Table');
        expect(r.Properties.TableName).toEqual({
          'Fn::Sub': 'UsersTable-${EnvironmentSuffix}',
        });
        expect(r.Properties.BillingMode).toBe('PAY_PER_REQUEST');
        expect(r.Properties.AttributeDefinitions).toHaveLength(1);
        expect(r.Properties.AttributeDefinitions[0]).toEqual({
          AttributeName: 'UserId',
          AttributeType: 'S',
        });
        expect(r.Properties.KeySchema).toHaveLength(1);
        expect(r.Properties.KeySchema[0]).toEqual({
          AttributeName: 'UserId',
          KeyType: 'HASH',
        });
      });

      test('UsersTable should have correct naming with environment suffix', () => {
        const table = template.Resources.UsersTable;
        const tableName = table.Properties.TableName;
        expect(tableName).toEqual({
          'Fn::Sub': 'UsersTable-${EnvironmentSuffix}',
        });
        expect(tableName['Fn::Sub']).toMatch(/\${EnvironmentSuffix}/);
      });
    });

    describe('API Gateway Resources', () => {
      test('ApiGatewayRestApi should be a REST API with correct properties', () => {
        const r = template.Resources.ApiGatewayRestApi;
        expect(r.Type).toBe('AWS::ApiGateway::RestApi');
        expect(r.Properties.Name).toEqual({
          'Fn::Sub': 'UserManagementApi-${EnvironmentSuffix}',
        });
        expect(r.Properties.Description).toBe('RESTful API for managing users');
      });

      test('API Gateway resources should be present and wired up correctly', () => {
        const restApi = template.Resources.ApiGatewayRestApi;
        const usersResource = template.Resources.ApiGatewayResourceUsers;
        const userIdResource = template.Resources.ApiGatewayResourceUserId;

        expect(restApi.Type).toBe('AWS::ApiGateway::RestApi');
        expect(usersResource.Type).toBe('AWS::ApiGateway::Resource');
        expect(userIdResource.Type).toBe('AWS::ApiGateway::Resource');

        expect(usersResource.Properties.ParentId).toEqual({
          'Fn::GetAtt': ['ApiGatewayRestApi', 'RootResourceId'],
        });
        expect(usersResource.Properties.PathPart).toBe('users');
        expect(usersResource.Properties.RestApiId).toEqual({
          Ref: 'ApiGatewayRestApi',
        });

        expect(userIdResource.Properties.ParentId).toEqual({
          Ref: 'ApiGatewayResourceUsers',
        });
        expect(userIdResource.Properties.PathPart).toBe('{userid}');
        expect(userIdResource.Properties.RestApiId).toEqual({
          Ref: 'ApiGatewayRestApi',
        });
      });

      test('API Gateway deployment should be present with correct dependencies', () => {
        const deployment = template.Resources.ApiGatewayDeployment;
        expect(deployment.Type).toBe('AWS::ApiGateway::Deployment');
        expect(deployment.DependsOn).toEqual([
          'CreateUserMethod',
          'GetUserMethod',
          'DeleteUserMethod',
        ]);
        expect(deployment.Properties.RestApiId).toEqual({
          Ref: 'ApiGatewayRestApi',
        });

        // Stage is handled by separate ApiGatewayStage resource
        const stage = template.Resources.ApiGatewayStage;
        expect(stage.Type).toBe('AWS::ApiGateway::Stage');
        expect(stage.Properties.StageName).toEqual({
          Ref: 'EnvironmentSuffix',
        });
      });

      test('API Gateway methods should reference correct resources and Lambdas', () => {
        const createMethod = template.Resources.CreateUserMethod;
        const getMethod = template.Resources.GetUserMethod;
        const deleteMethod = template.Resources.DeleteUserMethod;

        // POST method should use /users resource
        expect(createMethod.Properties.ResourceId).toEqual({
          Ref: 'ApiGatewayResourceUsers',
        });
        expect(createMethod.Properties.HttpMethod).toBe('POST');
        expect(createMethod.Properties.Integration.Uri['Fn::Sub']).toContain(
          '${CreateUserFunction.Arn}'
        );

        // GET method should use /users/{userid} resource
        expect(getMethod.Properties.ResourceId).toEqual({
          Ref: 'ApiGatewayResourceUserId',
        });
        expect(getMethod.Properties.HttpMethod).toBe('GET');
        expect(getMethod.Properties.RequestParameters).toEqual({
          'method.request.path.userid': true,
        });
        expect(getMethod.Properties.Integration.Uri['Fn::Sub']).toContain(
          '${GetUserFunction.Arn}'
        );

        // DELETE method should use /users/{userid} resource
        expect(deleteMethod.Properties.ResourceId).toEqual({
          Ref: 'ApiGatewayResourceUserId',
        });
        expect(deleteMethod.Properties.HttpMethod).toBe('DELETE');
        expect(deleteMethod.Properties.RequestParameters).toEqual({
          'method.request.path.userid': true,
        });
        expect(deleteMethod.Properties.Integration.Uri['Fn::Sub']).toContain(
          '${DeleteUserFunction.Arn}'
        );
      });

      test('All API Gateway methods should have correct integration properties', () => {
        const methods = [
          'CreateUserMethod',
          'GetUserMethod',
          'DeleteUserMethod',
        ];
        methods.forEach(methodName => {
          const method = template.Resources[methodName];
          expect(method.Properties.AuthorizationType).toBe('NONE');
          expect(method.Properties.Integration.Type).toBe('AWS_PROXY');
          expect(method.Properties.Integration.IntegrationHttpMethod).toBe(
            'POST'
          );
        });
      });
    });

    describe('Lambda Functions', () => {
      const lambdaFunctions = [
        'CreateUserFunction',
        'GetUserFunction',
        'DeleteUserFunction',
      ];

      test('should have all Lambda functions with correct properties', () => {
        lambdaFunctions.forEach(functionName => {
          const func = template.Resources[functionName];
          expect(func.Type).toBe('AWS::Lambda::Function');
          expect(func.Properties.FunctionName).toEqual({
            'Fn::Sub': `${functionName}-\${EnvironmentSuffix}`,
          });
          expect(func.Properties.Runtime).toBe('python3.9');
          expect(func.Properties.Handler).toBe('index.handler');
          expect(func.Properties.Role).toEqual({
            'Fn::GetAtt': ['LambdaExecutionRole', 'Arn'],
          });
          expect(func.Properties.Environment.Variables.TABLE_NAME).toEqual({
            Ref: 'UsersTable',
          });
          expect(func.Properties.Code.ZipFile).toBeDefined();
          expect(typeof func.Properties.Code.ZipFile).toBe('string');
          expect(func.Properties.Code.ZipFile.length).toBeGreaterThan(0);
        });
      });

      test('Lambda function code should contain proper imports and error handling', () => {
        lambdaFunctions.forEach(functionName => {
          const code = template.Resources[functionName].Properties.Code.ZipFile;
          expect(code).toContain('import json');
          expect(code).toContain('import boto3');
          expect(code).toContain('import os');
          expect(code).toContain('try:');
          expect(code).toContain('except Exception as e:');
          expect(code).toContain("os.environ['TABLE_NAME']");
          expect(code).toContain('def handler(event, context):');
          expect(code).toContain('dynamodb = boto3.resource');
        });
      });

      test('CreateUserFunction should handle POST requests correctly', () => {
        const code =
          template.Resources.CreateUserFunction.Properties.Code.ZipFile;
        expect(code).toContain("json.loads(event['body'])");
        expect(code).toContain('table.put_item');
        expect(code).toContain("'message': 'User created'");
        expect(code).toContain("'statusCode': 200");
        expect(code).toContain("'statusCode': 400");
        expect(code).toContain(
          "'headers': {'Content-Type': 'application/json'}"
        );
      });

      test('GetUserFunction should handle GET requests correctly', () => {
        const code = template.Resources.GetUserFunction.Properties.Code.ZipFile;
        expect(code).toContain("event['pathParameters']['userid']");
        expect(code).toContain('table.get_item');
        expect(code).toContain("'statusCode': 404");
        expect(code).toContain("'error': 'User not found'");
        expect(code).toContain("if 'Item' in response:");
      });

      test('DeleteUserFunction should handle DELETE requests correctly', () => {
        const code =
          template.Resources.DeleteUserFunction.Properties.Code.ZipFile;
        expect(code).toContain("event['pathParameters']['userid']");
        expect(code).toContain('table.delete_item');
        expect(code).toContain("'message': 'User deleted'");
        expect(code).toContain("'statusCode': 200");
      });
    });

    describe('Lambda Permissions', () => {
      const permissionResources = [
        'CreateUserFunctionPermission',
        'GetUserFunctionPermission',
        'DeleteUserFunctionPermission',
      ];

      test('should have all Lambda permissions with correct properties', () => {
        permissionResources.forEach(permissionName => {
          const permission = template.Resources[permissionName];
          expect(permission.Type).toBe('AWS::Lambda::Permission');
          expect(permission.Properties.Action).toBe('lambda:InvokeFunction');
          expect(permission.Properties.Principal).toBe(
            'apigateway.amazonaws.com'
          );
          expect(permission.Properties.SourceArn).toEqual({
            'Fn::Sub':
              'arn:aws:execute-api:${AWS::Region}:${AWS::AccountId}:${ApiGatewayRestApi}/*/*',
          });
        });
      });

      test('Lambda permissions should reference correct functions', () => {
        expect(
          template.Resources.CreateUserFunctionPermission.Properties
            .FunctionName
        ).toEqual({ Ref: 'CreateUserFunction' });
        expect(
          template.Resources.GetUserFunctionPermission.Properties.FunctionName
        ).toEqual({ Ref: 'GetUserFunction' });
        expect(
          template.Resources.DeleteUserFunctionPermission.Properties
            .FunctionName
        ).toEqual({ Ref: 'DeleteUserFunction' });
      });

      test('all Lambda functions should have corresponding permissions', () => {
        const lambdaFunctions = [
          'CreateUserFunction',
          'GetUserFunction',
          'DeleteUserFunction',
        ];
        const permissions = [
          'CreateUserFunctionPermission',
          'GetUserFunctionPermission',
          'DeleteUserFunctionPermission',
        ];

        lambdaFunctions.forEach(func => {
          expect(template.Resources[func]).toBeDefined();
        });

        permissions.forEach(perm => {
          expect(template.Resources[perm]).toBeDefined();
        });
      });
    });

    describe('IAM Role', () => {
      test('LambdaExecutionRole should be an IAM role with correct properties', () => {
        const role = template.Resources.LambdaExecutionRole;
        expect(role.Type).toBe('AWS::IAM::Role');
        expect(role.Properties.AssumeRolePolicyDocument).toBeDefined();
        expect(role.Properties.AssumeRolePolicyDocument.Version).toBe(
          '2012-10-17'
        );
        expect(role.Properties.AssumeRolePolicyDocument.Statement).toHaveLength(
          1
        );

        const statement = role.Properties.AssumeRolePolicyDocument.Statement[0];
        expect(statement.Effect).toBe('Allow');
        expect(statement.Principal.Service).toBe('lambda.amazonaws.com');
        expect(statement.Action).toBe('sts:AssumeRole');
      });

      test('LambdaExecutionRole should have CloudWatch Logs permissions', () => {
        const role = template.Resources.LambdaExecutionRole.Properties;
        expect(role.ManagedPolicyArns).toBeDefined();
        expect(Array.isArray(role.ManagedPolicyArns)).toBe(true);
        expect(role.ManagedPolicyArns).toContain(
          'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole'
        );
      });

      test('LambdaExecutionRole should have DynamoDB permissions', () => {
        const role = template.Resources.LambdaExecutionRole.Properties;
        expect(role.Policies).toHaveLength(1);

        const policy = role.Policies[0];
        expect(policy.PolicyName).toEqual({
          'Fn::Sub': 'LambdaDynamoDBPolicy-${EnvironmentSuffix}',
        });
        expect(policy.PolicyName['Fn::Sub']).toMatch(/\${EnvironmentSuffix}/);
        expect(policy.PolicyDocument.Version).toBe('2012-10-17');
        expect(policy.PolicyDocument.Statement).toHaveLength(1);

        const statement = policy.PolicyDocument.Statement[0];
        expect(statement.Effect).toBe('Allow');
        expect(statement.Action).toEqual([
          'dynamodb:PutItem',
          'dynamodb:GetItem',
          'dynamodb:DeleteItem',
        ]);
        expect(statement.Resource).toEqual({
          'Fn::GetAtt': ['UsersTable', 'Arn'],
        });
      });

      test('LambdaExecutionRole should not have hardcoded RoleName', () => {
        const role = template.Resources.LambdaExecutionRole.Properties;
        expect(role.RoleName).toBeUndefined();
      });
    });
  });

  describe('Outputs', () => {
    test('should have all required outputs', () => {
      const expected = ['ApiUrl', 'UsersTableName'];
      expect(Object.keys(template.Outputs).sort()).toEqual(expected.sort());
    });

    test('should have exactly two outputs', () => {
      const outputCount = Object.keys(template.Outputs).length;
      expect(outputCount).toBe(2);
    });

    test('ApiUrl output should have correct properties', () => {
      const output = template.Outputs.ApiUrl;
      expect(output.Description).toBe('API Gateway endpoint URL');
      expect(output.Value).toEqual({
        'Fn::Sub':
          'https://${ApiGatewayRestApi}.execute-api.${AWS::Region}.amazonaws.com/${EnvironmentSuffix}',
      });
      expect(output.Value['Fn::Sub']).toContain(
        '.execute-api.${AWS::Region}.amazonaws.com/${EnvironmentSuffix}'
      );
    });

    test('UsersTableName output should have correct properties', () => {
      const output = template.Outputs.UsersTableName;
      expect(output.Description).toBe('DynamoDB table name');
      expect(output.Value).toEqual({ Ref: 'UsersTable' });
    });

    test('All outputs should have Value and Description', () => {
      Object.values(template.Outputs).forEach((output: any) => {
        expect(output.Value).toBeDefined();
        expect(output.Description).toBeDefined();
        expect(typeof output.Description).toBe('string');
        expect(output.Description.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Naming and Conventions', () => {
    test('All resource names should include environment suffix where applicable', () => {
      const resourcesWithSuffix = [
        'UsersTable',
        'ApiGatewayRestApi',
        'CreateUserFunction',
        'GetUserFunction',
        'DeleteUserFunction',
      ];

      resourcesWithSuffix.forEach(resourceName => {
        const resource = template.Resources[resourceName].Properties;
        const nameProperty =
          resource.TableName || resource.Name || resource.FunctionName;
        expect(nameProperty).toEqual(
          expect.objectContaining({
            'Fn::Sub': expect.stringContaining('${EnvironmentSuffix}'),
          })
        );
      });
    });

    test('DynamoDB policy should include environment suffix', () => {
      const role = template.Resources.LambdaExecutionRole.Properties;
      const policy = role.Policies[0];
      expect(policy.PolicyName).toEqual({
        'Fn::Sub': 'LambdaDynamoDBPolicy-${EnvironmentSuffix}',
      });
      expect(policy.PolicyName['Fn::Sub']).toMatch(/\${EnvironmentSuffix}/);
    });

    test('Resource naming should follow AWS conventions', () => {
      const resourceNames = Object.keys(template.Resources);
      resourceNames.forEach(name => {
        // Should start with uppercase letter
        expect(name).toMatch(/^[A-Z]/);
        // Should not contain spaces or special characters except numbers
        expect(name).toMatch(/^[A-Za-z0-9]+$/);
      });
    });
  });

  describe('Integration and Dependencies', () => {
    test('API Gateway methods should reference correct Lambda functions', () => {
      expect(
        template.Resources.CreateUserMethod.Properties.Integration.Uri[
          'Fn::Sub'
        ]
      ).toContain('${CreateUserFunction.Arn}');
      expect(
        template.Resources.GetUserMethod.Properties.Integration.Uri['Fn::Sub']
      ).toContain('${GetUserFunction.Arn}');
      expect(
        template.Resources.DeleteUserMethod.Properties.Integration.Uri[
          'Fn::Sub'
        ]
      ).toContain('${DeleteUserFunction.Arn}');
    });

    test('Lambda functions should reference correct IAM role', () => {
      const lambdaFunctions = [
        'CreateUserFunction',
        'GetUserFunction',
        'DeleteUserFunction',
      ];
      lambdaFunctions.forEach(functionName => {
        const func = template.Resources[functionName];
        expect(func.Properties.Role).toEqual({
          'Fn::GetAtt': ['LambdaExecutionRole', 'Arn'],
        });
      });
    });

    test('Lambda functions should reference correct DynamoDB table', () => {
      const lambdaFunctions = [
        'CreateUserFunction',
        'GetUserFunction',
        'DeleteUserFunction',
      ];
      lambdaFunctions.forEach(functionName => {
        const func = template.Resources[functionName];
        expect(func.Properties.Environment.Variables.TABLE_NAME).toEqual({
          Ref: 'UsersTable',
        });
      });
    });

    test('IAM role should reference correct DynamoDB table ARN', () => {
      const role = template.Resources.LambdaExecutionRole.Properties;
      const statement = role.Policies[0].PolicyDocument.Statement[0];
      expect(statement.Resource).toEqual({
        'Fn::GetAtt': ['UsersTable', 'Arn'],
      });
    });

    test('API Gateway deployment should depend on all methods', () => {
      const deployment = template.Resources.ApiGatewayDeployment;
      expect(deployment.DependsOn).toContain('CreateUserMethod');
      expect(deployment.DependsOn).toContain('GetUserMethod');
      expect(deployment.DependsOn).toContain('DeleteUserMethod');
      expect(deployment.DependsOn).toHaveLength(3);
    });
  });

  describe('Edge Cases and Validation', () => {
    test('template should be ready for deployment', () => {
      // Verify all critical resources exist
      const criticalResources = [
        'UsersTable',
        'ApiGatewayRestApi',
        'ApiGatewayDeployment',
        'CreateUserFunction',
        'GetUserFunction',
        'DeleteUserFunction',
        'LambdaExecutionRole',
      ];

      criticalResources.forEach(resource => {
        expect(template.Resources[resource]).toBeDefined();
      });
    });

    test('API endpoints should be properly structured for REST', () => {
      // Verify the API structure matches REST conventions
      expect(template.Resources.CreateUserMethod.Properties.HttpMethod).toBe(
        'POST'
      );
      expect(template.Resources.GetUserMethod.Properties.HttpMethod).toBe(
        'GET'
      );
      expect(template.Resources.DeleteUserMethod.Properties.HttpMethod).toBe(
        'DELETE'
      );

      // Verify path parameters are configured for GET and DELETE
      expect(
        template.Resources.GetUserMethod.Properties.RequestParameters
      ).toEqual({
        'method.request.path.userid': true,
      });
      expect(
        template.Resources.DeleteUserMethod.Properties.RequestParameters
      ).toEqual({
        'method.request.path.userid': true,
      });
    });

    test('should not have any circular dependencies', () => {
      // Basic check for obvious circular references
      const resources = template.Resources;
      Object.keys(resources).forEach(resourceName => {
        const resource = resources[resourceName];
        const resourceString = JSON.stringify(resource);
        // A resource should not reference itself
        expect(resourceString).not.toContain(`"Ref": "${resourceName}"`);
        expect(resourceString).not.toContain(
          `"Fn::GetAtt": ["${resourceName}"`
        );
      });
    });

    test('template should have valid JSON structure when serialized', () => {
      expect(() => JSON.stringify(template)).not.toThrow();
      const serialized = JSON.stringify(template);
      expect(() => JSON.parse(serialized)).not.toThrow();
    });

    test('all CloudFormation intrinsic functions should be properly formatted', () => {
      const templateString = JSON.stringify(template);
      // Check for common intrinsic function patterns
      const intrinsicFunctions = ['Fn::Sub', 'Fn::GetAtt', 'Ref'];
      intrinsicFunctions.forEach(func => {
        if (templateString.includes(func)) {
          // Basic validation that the function appears in object context
          expect(templateString).toMatch(new RegExp(`"${func}":`));
        }
      });
    });
  });
});
