import fs from 'fs';
import path from 'path';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('TapStack CloudFormation SAM Template', () => {
  let template: any;

  beforeAll(() => {
    // Load the JSON template
    const templatePath = path.join(__dirname, '../lib/TapStack.json');
    const templateContent = fs.readFileSync(templatePath, 'utf8');
    template = JSON.parse(templateContent);
  });

  describe('Template Structure', () => {
    test('should have valid CloudFormation format version', () => {
      expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
    });

    test('should have SAM transform', () => {
      expect(template.Transform).toBe('AWS::Serverless-2016-10-31');
    });

    test('should have a description', () => {
      expect(template.Description).toBeDefined();
      expect(template.Description).toContain('serverless application');
      expect(template.Description).toContain('Lambda functions');
      expect(template.Description).toContain('DynamoDB tables');
      expect(template.Description).toContain('API Gateway');
    });

    test('should have Globals section', () => {
      expect(template.Globals).toBeDefined();
      expect(template.Globals.Function).toBeDefined();
    });

    test('Globals should define common Lambda properties', () => {
      const globals = template.Globals.Function;
      expect(globals.Runtime).toBe('nodejs20.x');
      expect(globals.Timeout).toBe(30);
      expect(globals.MemorySize).toBe(128);
    });
  });

  describe('IAM Role', () => {
    test('should have LambdaExecutionRole resource', () => {
      expect(template.Resources.LambdaExecutionRole).toBeDefined();
    });

    test('LambdaExecutionRole should be an IAM role', () => {
      const role = template.Resources.LambdaExecutionRole;
      expect(role.Type).toBe('AWS::IAM::Role');
    });

    test('LambdaExecutionRole should have correct trust policy', () => {
      const role = template.Resources.LambdaExecutionRole;
      const trustPolicy = role.Properties.AssumeRolePolicyDocument;
      
      expect(trustPolicy.Version).toBe('2012-10-17');
      expect(trustPolicy.Statement).toHaveLength(1);
      expect(trustPolicy.Statement[0].Effect).toBe('Allow');
      expect(trustPolicy.Statement[0].Principal.Service).toBe('lambda.amazonaws.com');
      expect(trustPolicy.Statement[0].Action).toBe('sts:AssumeRole');
    });

    test('LambdaExecutionRole should have CloudWatch Logs policy', () => {
      const role = template.Resources.LambdaExecutionRole;
      const policies = role.Properties.Policies;
      
      const logsPolicy = policies.find((p: any) => p.PolicyName === 'CloudWatchLogsPolicy');
      expect(logsPolicy).toBeDefined();
      
      const statement = logsPolicy.PolicyDocument.Statement[0];
      expect(statement.Effect).toBe('Allow');
      expect(statement.Action).toContain('logs:CreateLogGroup');
      expect(statement.Action).toContain('logs:CreateLogStream');
      expect(statement.Action).toContain('logs:PutLogEvents');
    });

    test('LambdaExecutionRole should have DynamoDB policy', () => {
      const role = template.Resources.LambdaExecutionRole;
      const policies = role.Properties.Policies;
      
      const dynamoPolicy = policies.find((p: any) => p.PolicyName === 'DynamoDBPolicy');
      expect(dynamoPolicy).toBeDefined();
      
      const statements = dynamoPolicy.PolicyDocument.Statement;
      expect(statements).toHaveLength(3); // One for each table
      
      statements.forEach((statement: any) => {
        expect(statement.Effect).toBe('Allow');
        expect(statement.Action).toContain('dynamodb:GetItem');
        expect(statement.Action).toContain('dynamodb:PutItem');
        expect(statement.Action).toContain('dynamodb:UpdateItem');
      });
    });
  });

  describe('DynamoDB Tables', () => {
    const tableNames = ['ItemsTable', 'UsersTable', 'OrdersTable'];

    tableNames.forEach(tableName => {
      describe(`${tableName}`, () => {
        test('should exist', () => {
          expect(template.Resources[tableName]).toBeDefined();
        });

        test('should be a DynamoDB table', () => {
          const table = template.Resources[tableName];
          expect(table.Type).toBe('AWS::DynamoDB::Table');
        });

        test('should use on-demand billing', () => {
          const table = template.Resources[tableName];
          expect(table.Properties.BillingMode).toBe('PAY_PER_REQUEST');
        });

        test('should have correct table name with stack name prefix', () => {
          const table = template.Resources[tableName];
          const expectedSuffix = tableName.toLowerCase().replace('table', '');
          expect(table.Properties.TableName['Fn::Sub']).toBe(`\${AWS::StackName}-${expectedSuffix}`);
        });

        test('should have attribute definitions', () => {
          const table = template.Resources[tableName];
          expect(table.Properties.AttributeDefinitions).toHaveLength(1);
          
          const attribute = table.Properties.AttributeDefinitions[0];
          const expectedAttrName = tableName.toLowerCase().replace('stable', 'Id');
          expect(attribute.AttributeName).toBe(expectedAttrName);
          expect(attribute.AttributeType).toBe('S');
        });

        test('should have key schema', () => {
          const table = template.Resources[tableName];
          expect(table.Properties.KeySchema).toHaveLength(1);
          
          const key = table.Properties.KeySchema[0];
          const expectedKeyName = tableName.toLowerCase().replace('stable', 'Id');
          expect(key.AttributeName).toBe(expectedKeyName);
          expect(key.KeyType).toBe('HASH');
        });
      });
    });
  });

  describe('Lambda Functions', () => {
    const functionNames = ['ItemsFunction', 'UsersFunction', 'OrdersFunction'];

    functionNames.forEach(functionName => {
      describe(`${functionName}`, () => {
        test('should exist', () => {
          expect(template.Resources[functionName]).toBeDefined();
        });

        test('should be a Serverless function', () => {
          const func = template.Resources[functionName];
          expect(func.Type).toBe('AWS::Serverless::Function');
        });

        test('should have correct function name', () => {
          const func = template.Resources[functionName];
          const expectedSuffix = functionName.toLowerCase().replace('function', '-function');
          expect(func.Properties.FunctionName['Fn::Sub']).toBe(`\${AWS::StackName}-${expectedSuffix}`);
        });

        test('should have correct code URI', () => {
          const func = template.Resources[functionName];
          const expectedCodeUri = `./src/${functionName.toLowerCase().replace('function', '-function')}`;
          expect(func.Properties.CodeUri).toBe(expectedCodeUri);
        });

        test('should have correct handler', () => {
          const func = template.Resources[functionName];
          expect(func.Properties.Handler).toBe('index.handler');
        });

        test('should reference the Lambda execution role', () => {
          const func = template.Resources[functionName];
          expect(func.Properties.Role['Fn::GetAtt']).toEqual(['LambdaExecutionRole', 'Arn']);
        });

        test('should have environment variables', () => {
          const func = template.Resources[functionName];
          expect(func.Properties.Environment).toBeDefined();
          expect(func.Properties.Environment.Variables).toBeDefined();
          
          const tableName = functionName.replace('Function', 'Table');
          const envVarName = `${functionName.replace('Function', '').toUpperCase()}_TABLE_NAME`;
          expect(func.Properties.Environment.Variables[envVarName]).toEqual({ Ref: tableName });
        });

        test('should have API event configuration', () => {
          const func = template.Resources[functionName];
          expect(func.Properties.Events).toBeDefined();
          
          const eventKey = `${functionName.replace('Function', '')}Api`;
          expect(func.Properties.Events[eventKey]).toBeDefined();
          
          const event = func.Properties.Events[eventKey];
          expect(event.Type).toBe('Api');
          expect(event.Properties.RestApiId).toEqual({ Ref: 'ServerlessApi' });
          expect(event.Properties.Path).toBe(`/${functionName.toLowerCase().replace('function', '')}`);
          expect(event.Properties.Method).toBe('ANY');
        });
      });
    });
  });

  describe('API Gateway', () => {
    test('should have ServerlessApi resource', () => {
      expect(template.Resources.ServerlessApi).toBeDefined();
    });

    test('ServerlessApi should be a Serverless API', () => {
      const api = template.Resources.ServerlessApi;
      expect(api.Type).toBe('AWS::Serverless::Api');
    });

    test('ServerlessApi should have correct properties', () => {
      const api = template.Resources.ServerlessApi;
      expect(api.Properties.Name['Fn::Sub']).toBe('${AWS::StackName}-api');
      expect(api.Properties.StageName).toBe('Prod');
    });

    test('ServerlessApi should have CORS configuration', () => {
      const api = template.Resources.ServerlessApi;
      expect(api.Properties.Cors).toBeDefined();
      expect(api.Properties.Cors.AllowMethods).toBe("'*'");
      expect(api.Properties.Cors.AllowHeaders).toBe("'*'");
      expect(api.Properties.Cors.AllowOrigin).toBe("'*'");
    });
  });

  describe('Outputs', () => {
    test('should have all required outputs', () => {
      const expectedOutputs = [
        'ApiGatewayUrl',
        'ItemsTableName',
        'UsersTableName',
        'OrdersTableName',
        'ItemsFunctionArn',
        'UsersFunctionArn',
        'OrdersFunctionArn'
      ];

      expectedOutputs.forEach(outputName => {
        expect(template.Outputs[outputName]).toBeDefined();
      });
    });

    test('ApiGatewayUrl output should be correct', () => {
      const output = template.Outputs.ApiGatewayUrl;
      expect(output.Description).toContain('API Gateway');
      expect(output.Value['Fn::Sub']).toBe('https://${ServerlessApi}.execute-api.${AWS::Region}.amazonaws.com/Prod');
    });

    test('table name outputs should reference correct resources', () => {
      const tableOutputs = ['ItemsTableName', 'UsersTableName', 'OrdersTableName'];
      
      tableOutputs.forEach(outputName => {
        const output = template.Outputs[outputName];
        const tableName = outputName.replace('Name', '');
        expect(output.Value).toEqual({ Ref: tableName });
      });
    });

    test('function ARN outputs should use GetAtt', () => {
      const functionOutputs = ['ItemsFunctionArn', 'UsersFunctionArn', 'OrdersFunctionArn'];
      
      functionOutputs.forEach(outputName => {
        const output = template.Outputs[outputName];
        const functionName = outputName.replace('Arn', '');
        expect(output.Value['Fn::GetAtt']).toEqual([functionName, 'Arn']);
      });
    });

    test('all outputs should have export names', () => {
      Object.keys(template.Outputs).forEach(outputKey => {
        const output = template.Outputs[outputKey];
        expect(output.Export).toBeDefined();
        expect(output.Export.Name['Fn::Sub']).toContain('${AWS::StackName}');
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
      expect(template.Transform).not.toBeNull();
      expect(template.Description).not.toBeNull();
      expect(template.Resources).not.toBeNull();
      expect(template.Outputs).not.toBeNull();
    });

    test('should have correct number of resources', () => {
      const resourceCount = Object.keys(template.Resources).length;
      expect(resourceCount).toBe(8); // 1 IAM role, 3 tables, 3 functions, 1 API
    });

    test('should have correct number of outputs', () => {
      const outputCount = Object.keys(template.Outputs).length;
      expect(outputCount).toBe(7); // 1 API URL, 3 table names, 3 function ARNs
    });
  });

  describe('Resource Dependencies', () => {
    test('Lambda functions should depend on IAM role', () => {
      const functionNames = ['ItemsFunction', 'UsersFunction', 'OrdersFunction'];
      
      functionNames.forEach(functionName => {
        const func = template.Resources[functionName];
        expect(func.Properties.Role['Fn::GetAtt'][0]).toBe('LambdaExecutionRole');
      });
    });

    test('Lambda functions should reference their respective tables', () => {
      const mappings = [
        { func: 'ItemsFunction', table: 'ItemsTable', envVar: 'ITEMS_TABLE_NAME' },
        { func: 'UsersFunction', table: 'UsersTable', envVar: 'USERS_TABLE_NAME' },
        { func: 'OrdersFunction', table: 'OrdersTable', envVar: 'ORDERS_TABLE_NAME' }
      ];

      mappings.forEach(({ func, table, envVar }) => {
        const function_ = template.Resources[func];
        expect(function_.Properties.Environment.Variables[envVar]).toEqual({ Ref: table });
      });
    });

    test('IAM role should reference all DynamoDB tables', () => {
      const role = template.Resources.LambdaExecutionRole;
      const dynamoPolicy = role.Properties.Policies.find((p: any) => p.PolicyName === 'DynamoDBPolicy');
      const statements = dynamoPolicy.PolicyDocument.Statement;
      
      const expectedTables = ['ItemsTable', 'UsersTable', 'OrdersTable'];
      statements.forEach((statement: any, index: number) => {
        expect(statement.Resource['Fn::GetAtt'][0]).toBe(expectedTables[index]);
        expect(statement.Resource['Fn::GetAtt'][1]).toBe('Arn');
      });
    });
  });

  describe('Security Best Practices', () => {
    test('IAM role should follow principle of least privilege', () => {
      const role = template.Resources.LambdaExecutionRole;
      const dynamoPolicy = role.Properties.Policies.find((p: any) => p.PolicyName === 'DynamoDBPolicy');
      
      dynamoPolicy.PolicyDocument.Statement.forEach((statement: any) => {
        // Check that only specific actions are allowed
        expect(statement.Action).toHaveLength(3);
        expect(statement.Action).toContain('dynamodb:GetItem');
        expect(statement.Action).toContain('dynamodb:PutItem');
        expect(statement.Action).toContain('dynamodb:UpdateItem');
        
        // Check that resource is specific (not *)
        expect(statement.Resource).not.toBe('*');
        expect(statement.Resource['Fn::GetAtt']).toBeDefined();
      });
    });

    test('DynamoDB tables should not have deletion protection', () => {
      const tableNames = ['ItemsTable', 'UsersTable', 'OrdersTable'];
      
      tableNames.forEach(tableName => {
        const table = template.Resources[tableName];
        // DeletionProtectionEnabled should either be false or not defined (defaults to false)
        if (table.Properties.DeletionProtectionEnabled !== undefined) {
          expect(table.Properties.DeletionProtectionEnabled).toBe(false);
        }
      });
    });
  });
});