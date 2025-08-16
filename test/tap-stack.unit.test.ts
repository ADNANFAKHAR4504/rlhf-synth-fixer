import * as fs from 'fs';
import * as path from 'path';

describe('TapStack CloudFormation Template Unit Tests', () => {
  let templateJson: any;
  const environmentSuffix = 'test123';

  beforeAll(() => {
    // Load JSON template
    const jsonPath = path.join(__dirname, '..', 'lib', 'TapStack.json');
    const jsonContent = fs.readFileSync(jsonPath, 'utf8');
    templateJson = JSON.parse(jsonContent);
  });

  describe('Template Structure', () => {
    test('should have correct AWSTemplateFormatVersion', () => {
      expect(templateJson.AWSTemplateFormatVersion).toBe('2010-09-09');
    });

    test('should have a description', () => {
      expect(templateJson.Description).toBeDefined();
      expect(templateJson.Description).toContain('serverless application');
    });

    test('should have Parameters section with EnvironmentSuffix', () => {
      expect(templateJson.Parameters).toBeDefined();
      expect(templateJson.Parameters.EnvironmentSuffix).toBeDefined();
      expect(templateJson.Parameters.EnvironmentSuffix.Type).toBe('String');
      expect(templateJson.Parameters.EnvironmentSuffix.Default).toBe('dev');
    });

    test('should have Resources section', () => {
      expect(templateJson.Resources).toBeDefined();
      expect(Object.keys(templateJson.Resources).length).toBeGreaterThan(0);
    });

    test('should have Outputs section', () => {
      expect(templateJson.Outputs).toBeDefined();
      expect(Object.keys(templateJson.Outputs).length).toBeGreaterThan(0);
    });
  });

  describe('IAM Role', () => {
    test('should have LambdaExecutionRole', () => {
      expect(templateJson.Resources.LambdaExecutionRole).toBeDefined();
      expect(templateJson.Resources.LambdaExecutionRole.Type).toBe('AWS::IAM::Role');
    });

    test('should have correct AssumeRolePolicyDocument', () => {
      const role = templateJson.Resources.LambdaExecutionRole;
      expect(role.Properties.AssumeRolePolicyDocument).toBeDefined();
      expect(role.Properties.AssumeRolePolicyDocument.Statement[0].Effect).toBe('Allow');
      expect(role.Properties.AssumeRolePolicyDocument.Statement[0].Principal.Service).toBe('lambda.amazonaws.com');
      expect(role.Properties.AssumeRolePolicyDocument.Statement[0].Action).toBe('sts:AssumeRole');
    });

    test('should have CloudWatch Logs policy', () => {
      const role = templateJson.Resources.LambdaExecutionRole;
      const cloudWatchPolicy = role.Properties.Policies.find((p: any) => p.PolicyName === 'CloudWatchLogsPolicy');
      expect(cloudWatchPolicy).toBeDefined();
      expect(cloudWatchPolicy.PolicyDocument.Statement[0].Action).toContain('logs:CreateLogGroup');
      expect(cloudWatchPolicy.PolicyDocument.Statement[0].Action).toContain('logs:CreateLogStream');
      expect(cloudWatchPolicy.PolicyDocument.Statement[0].Action).toContain('logs:PutLogEvents');
    });

    test('should have DynamoDB policy with least privilege', () => {
      const role = templateJson.Resources.LambdaExecutionRole;
      const dynamoPolicy = role.Properties.Policies.find((p: any) => p.PolicyName === 'DynamoDBPolicy');
      expect(dynamoPolicy).toBeDefined();
      
      const statements = dynamoPolicy.PolicyDocument.Statement;
      expect(statements.length).toBe(3); // One for each table
      
      statements.forEach((statement: any) => {
        expect(statement.Effect).toBe('Allow');
        expect(statement.Action).toContain('dynamodb:GetItem');
        expect(statement.Action).toContain('dynamodb:PutItem');
        expect(statement.Action).toContain('dynamodb:UpdateItem');
        expect(statement.Resource).toBeDefined();
      });
    });
  });

  describe('DynamoDB Tables', () => {
    const tables = ['ItemsTable', 'UsersTable', 'OrdersTable'];
    const primaryKeys = {
      ItemsTable: 'itemId',
      UsersTable: 'userId',
      OrdersTable: 'orderId'
    };

    tables.forEach(tableName => {
      describe(`${tableName}`, () => {
        test('should exist with correct type', () => {
          expect(templateJson.Resources[tableName]).toBeDefined();
          expect(templateJson.Resources[tableName].Type).toBe('AWS::DynamoDB::Table');
        });

        test('should have PAY_PER_REQUEST billing mode', () => {
          expect(templateJson.Resources[tableName].Properties.BillingMode).toBe('PAY_PER_REQUEST');
        });

        test('should have correct primary key', () => {
          const table = templateJson.Resources[tableName];
          const primaryKey = primaryKeys[tableName as keyof typeof primaryKeys];
          
          expect(table.Properties.AttributeDefinitions).toBeDefined();
          expect(table.Properties.AttributeDefinitions[0].AttributeName).toBe(primaryKey);
          expect(table.Properties.AttributeDefinitions[0].AttributeType).toBe('S');
          
          expect(table.Properties.KeySchema).toBeDefined();
          expect(table.Properties.KeySchema[0].AttributeName).toBe(primaryKey);
          expect(table.Properties.KeySchema[0].KeyType).toBe('HASH');
        });

        test('should include environment suffix in table name', () => {
          const table = templateJson.Resources[tableName];
          expect(table.Properties.TableName).toBeDefined();
          expect(table.Properties.TableName['Fn::Sub']).toContain('${EnvironmentSuffix}');
        });
      });
    });
  });

  describe('Lambda Functions', () => {
    const functions = ['ItemsFunction', 'UsersFunction', 'OrdersFunction'];
    const tableRefs = {
      ItemsFunction: 'ItemsTable',
      UsersFunction: 'UsersTable',
      OrdersFunction: 'OrdersTable'
    };

    functions.forEach(functionName => {
      describe(`${functionName}`, () => {
        test('should exist with correct type', () => {
          expect(templateJson.Resources[functionName]).toBeDefined();
          expect(templateJson.Resources[functionName].Type).toBe('AWS::Lambda::Function');
        });

        test('should use nodejs20.x runtime', () => {
          expect(templateJson.Resources[functionName].Properties.Runtime).toBe('nodejs20.x');
        });

        test('should have correct handler', () => {
          expect(templateJson.Resources[functionName].Properties.Handler).toBe('index.handler');
        });

        test('should have appropriate timeout and memory', () => {
          expect(templateJson.Resources[functionName].Properties.Timeout).toBe(30);
          expect(templateJson.Resources[functionName].Properties.MemorySize).toBe(128);
        });

        test('should reference LambdaExecutionRole', () => {
          const func = templateJson.Resources[functionName];
          expect(func.Properties.Role).toBeDefined();
          expect(func.Properties.Role['Fn::GetAtt']).toEqual(['LambdaExecutionRole', 'Arn']);
        });

        test('should have environment variables with table reference', () => {
          const func = templateJson.Resources[functionName];
          const tableRef = tableRefs[functionName as keyof typeof tableRefs];
          
          expect(func.Properties.Environment).toBeDefined();
          expect(func.Properties.Environment.Variables).toBeDefined();
          
          const envVarName = `${tableRef.replace('Table', '').toUpperCase()}_TABLE_NAME`;
          expect(func.Properties.Environment.Variables[envVarName]).toBeDefined();
          expect(func.Properties.Environment.Variables[envVarName].Ref).toBe(tableRef);
        });

        test('should include environment suffix in function name', () => {
          const func = templateJson.Resources[functionName];
          expect(func.Properties.FunctionName).toBeDefined();
          expect(func.Properties.FunctionName['Fn::Sub']).toContain('${EnvironmentSuffix}');
        });

        test('should have inline code with DynamoDB operations', () => {
          const func = templateJson.Resources[functionName];
          expect(func.Properties.Code).toBeDefined();
          expect(func.Properties.Code.ZipFile).toBeDefined();
          expect(func.Properties.Code.ZipFile).toContain('DynamoDBClient');
          expect(func.Properties.Code.ZipFile).toContain('PutItemCommand');
          expect(func.Properties.Code.ZipFile).toContain('GetItemCommand');
          expect(func.Properties.Code.ZipFile).toContain('exports.handler');
        });
      });
    });
  });

  describe('API Gateway', () => {
    test('should have ApiGateway RestApi', () => {
      expect(templateJson.Resources.ApiGateway).toBeDefined();
      expect(templateJson.Resources.ApiGateway.Type).toBe('AWS::ApiGateway::RestApi');
    });

    test('should have REGIONAL endpoint configuration', () => {
      const api = templateJson.Resources.ApiGateway;
      expect(api.Properties.EndpointConfiguration).toBeDefined();
      expect(api.Properties.EndpointConfiguration.Types).toContain('REGIONAL');
    });

    test('should include environment suffix in API name', () => {
      const api = templateJson.Resources.ApiGateway;
      expect(api.Properties.Name).toBeDefined();
      expect(api.Properties.Name['Fn::Sub']).toContain('${EnvironmentSuffix}');
    });

    describe('API Resources', () => {
      const resources = ['ItemsResource', 'UsersResource', 'OrdersResource'];
      const pathParts = {
        ItemsResource: 'items',
        UsersResource: 'users',
        OrdersResource: 'orders'
      };

      resources.forEach(resourceName => {
        test(`should have ${resourceName}`, () => {
          expect(templateJson.Resources[resourceName]).toBeDefined();
          expect(templateJson.Resources[resourceName].Type).toBe('AWS::ApiGateway::Resource');
          
          const resource = templateJson.Resources[resourceName];
          expect(resource.Properties.RestApiId.Ref).toBe('ApiGateway');
          expect(resource.Properties.PathPart).toBe(pathParts[resourceName as keyof typeof pathParts]);
        });
      });
    });

    describe('API Methods', () => {
      const methods = ['ItemsMethod', 'UsersMethod', 'OrdersMethod'];
      const functionRefs = {
        ItemsMethod: 'ItemsFunction',
        UsersMethod: 'UsersFunction',
        OrdersMethod: 'OrdersFunction'
      };

      methods.forEach(methodName => {
        test(`should have ${methodName}`, () => {
          expect(templateJson.Resources[methodName]).toBeDefined();
          expect(templateJson.Resources[methodName].Type).toBe('AWS::ApiGateway::Method');
          
          const method = templateJson.Resources[methodName];
          expect(method.Properties.HttpMethod).toBe('ANY');
          expect(method.Properties.AuthorizationType).toBe('NONE');
          expect(method.Properties.Integration.Type).toBe('AWS_PROXY');
          expect(method.Properties.Integration.IntegrationHttpMethod).toBe('POST');
          
          const functionRef = functionRefs[methodName as keyof typeof functionRefs];
          expect(method.Properties.Integration.Uri['Fn::Sub']).toContain(`\${${functionRef}.Arn}`);
        });
      });
    });

    test('should have ApiDeployment', () => {
      expect(templateJson.Resources.ApiDeployment).toBeDefined();
      expect(templateJson.Resources.ApiDeployment.Type).toBe('AWS::ApiGateway::Deployment');
      
      const deployment = templateJson.Resources.ApiDeployment;
      expect(deployment.Properties.StageName).toBe('Prod');
      expect(deployment.DependsOn).toContain('ItemsMethod');
      expect(deployment.DependsOn).toContain('UsersMethod');
      expect(deployment.DependsOn).toContain('OrdersMethod');
    });
  });

  describe('Lambda Permissions', () => {
    const permissions = ['ItemsFunctionPermission', 'UsersFunctionPermission', 'OrdersFunctionPermission'];
    const functionRefs = {
      ItemsFunctionPermission: 'ItemsFunction',
      UsersFunctionPermission: 'UsersFunction',
      OrdersFunctionPermission: 'OrdersFunction'
    };

    permissions.forEach(permissionName => {
      test(`should have ${permissionName}`, () => {
        expect(templateJson.Resources[permissionName]).toBeDefined();
        expect(templateJson.Resources[permissionName].Type).toBe('AWS::Lambda::Permission');
        
        const permission = templateJson.Resources[permissionName];
        const functionRef = functionRefs[permissionName as keyof typeof functionRefs];
        
        expect(permission.Properties.FunctionName.Ref).toBe(functionRef);
        expect(permission.Properties.Action).toBe('lambda:InvokeFunction');
        expect(permission.Properties.Principal).toBe('apigateway.amazonaws.com');
        expect(permission.Properties.SourceArn['Fn::Sub']).toContain('${ApiGateway}');
      });
    });
  });

  describe('Outputs', () => {
    test('should have ApiGatewayUrl output', () => {
      expect(templateJson.Outputs.ApiGatewayUrl).toBeDefined();
      expect(templateJson.Outputs.ApiGatewayUrl.Description).toContain('API Gateway');
      expect(templateJson.Outputs.ApiGatewayUrl.Value['Fn::Sub']).toContain('https://${ApiGateway}');
      expect(templateJson.Outputs.ApiGatewayUrl.Export.Name['Fn::Sub']).toContain('${EnvironmentSuffix}');
    });

    test('should have table name outputs', () => {
      const tableOutputs = ['ItemsTableName', 'UsersTableName', 'OrdersTableName'];
      const tableRefs = {
        ItemsTableName: 'ItemsTable',
        UsersTableName: 'UsersTable',
        OrdersTableName: 'OrdersTable'
      };

      tableOutputs.forEach(outputName => {
        expect(templateJson.Outputs[outputName]).toBeDefined();
        expect(templateJson.Outputs[outputName].Value.Ref).toBe(tableRefs[outputName as keyof typeof tableRefs]);
        expect(templateJson.Outputs[outputName].Export.Name['Fn::Sub']).toContain('${EnvironmentSuffix}');
      });
    });
  });

  describe('Resource Count Validation', () => {
    test('should have expected number of resources', () => {
      const resources = Object.keys(templateJson.Resources);
      // 1 IAM role + 3 tables + 3 functions + 1 API + 3 resources + 3 methods + 1 deployment + 3 permissions = 18
      expect(resources.length).toBe(18);
    });

    test('should have expected number of outputs', () => {
      const outputs = Object.keys(templateJson.Outputs);
      // 1 API URL + 3 table names = 4
      expect(outputs.length).toBe(4);
    });
  });

  describe('Security Best Practices', () => {
    test('should not have any retain deletion policies', () => {
      Object.values(templateJson.Resources).forEach((resource: any) => {
        if (resource.DeletionPolicy) {
          expect(resource.DeletionPolicy).not.toBe('Retain');
        }
      });
    });

    test('should use least privilege IAM permissions', () => {
      const role = templateJson.Resources.LambdaExecutionRole;
      const dynamoPolicy = role.Properties.Policies.find((p: any) => p.PolicyName === 'DynamoDBPolicy');
      
      // Check that permissions are scoped to specific resources
      dynamoPolicy.PolicyDocument.Statement.forEach((statement: any) => {
        expect(statement.Resource).not.toBe('*');
        expect(statement.Resource['Fn::GetAtt']).toBeDefined();
      });
    });

    test('API methods should have authorization type defined', () => {
      const methods = ['ItemsMethod', 'UsersMethod', 'OrdersMethod'];
      methods.forEach(methodName => {
        const method = templateJson.Resources[methodName];
        expect(method.Properties.AuthorizationType).toBeDefined();
      });
    });
  });

  describe('Lambda Function Code', () => {
    const sampleFunction = 'ItemsFunction';

    test('should handle POST requests correctly', () => {
      const func = templateJson.Resources[sampleFunction];
      const code = func.Properties.Code.ZipFile;
      
      expect(code).toContain("case 'POST':");
      expect(code).toContain('JSON.parse(event.body)');
      expect(code).toContain('PutItemCommand');
      expect(code).toContain('statusCode: 201');
      expect(code).toContain('Item created successfully');
    });

    test('should handle GET requests correctly', () => {
      const func = templateJson.Resources[sampleFunction];
      const code = func.Properties.Code.ZipFile;
      
      expect(code).toContain("case 'GET':");
      expect(code).toContain('event.queryStringParameters');
      expect(code).toContain('GetItemCommand');
      expect(code).toContain('statusCode: 200');
      expect(code).toContain('statusCode: 404');
      expect(code).toContain('Item not found');
    });

    test('should handle errors properly', () => {
      const func = templateJson.Resources[sampleFunction];
      const code = func.Properties.Code.ZipFile;
      
      expect(code).toContain('try {');
      expect(code).toContain('} catch (error)');
      expect(code).toContain('console.error');
      expect(code).toContain('statusCode: 500');
      expect(code).toContain('Internal Server Error');
    });

    test('should validate required parameters', () => {
      const func = templateJson.Resources[sampleFunction];
      const code = func.Properties.Code.ZipFile;
      
      expect(code).toContain('if (!itemId)');
      expect(code).toContain('statusCode: 400');
      expect(code).toContain('Missing itemId query parameter');
    });
  });

  describe('Consistency Across Functions', () => {
    test('all Lambda functions should have consistent configuration', () => {
      const functions = ['ItemsFunction', 'UsersFunction', 'OrdersFunction'];
      const runtimes = functions.map(f => templateJson.Resources[f].Properties.Runtime);
      const timeouts = functions.map(f => templateJson.Resources[f].Properties.Timeout);
      const memories = functions.map(f => templateJson.Resources[f].Properties.MemorySize);
      
      expect(new Set(runtimes).size).toBe(1);
      expect(new Set(timeouts).size).toBe(1);
      expect(new Set(memories).size).toBe(1);
    });

    test('all tables should have consistent billing mode', () => {
      const tables = ['ItemsTable', 'UsersTable', 'OrdersTable'];
      const billingModes = tables.map(t => templateJson.Resources[t].Properties.BillingMode);
      
      expect(new Set(billingModes).size).toBe(1);
      expect(billingModes[0]).toBe('PAY_PER_REQUEST');
    });
  });

  describe('Template Validation', () => {
    test('should have valid JSON structure', () => {
      expect(() => JSON.stringify(templateJson)).not.toThrow();
    });

    test('should have required top-level keys', () => {
      expect(templateJson).toHaveProperty('AWSTemplateFormatVersion');
      expect(templateJson).toHaveProperty('Description');
      expect(templateJson).toHaveProperty('Parameters');
      expect(templateJson).toHaveProperty('Resources');
      expect(templateJson).toHaveProperty('Outputs');
    });

    test('all resources should have Type property', () => {
      Object.entries(templateJson.Resources).forEach(([name, resource]: [string, any]) => {
        expect(resource.Type).toBeDefined();
        expect(typeof resource.Type).toBe('string');
      });
    });
  });
});