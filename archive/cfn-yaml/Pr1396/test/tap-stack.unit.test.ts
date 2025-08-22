import * as fs from 'fs';
import * as path from 'path';

describe('TapStack SAM Template Unit Tests', () => {
  let templateData: any;
  const environmentSuffix = 'test123';

  beforeAll(() => {
    // Load JSON template
    const jsonPath = path.join(__dirname, '..', 'lib', 'TapStack.json');
    const jsonContent = fs.readFileSync(jsonPath, 'utf8');
    templateData = JSON.parse(jsonContent);
  });

  describe('Template Structure', () => {
    test('should have correct AWSTemplateFormatVersion', () => {
      expect(templateData.AWSTemplateFormatVersion).toBe('2010-09-09');
    });

    test('should have SAM Transform', () => {
      expect(templateData.Transform).toBe('AWS::Serverless-2016-10-31');
    });

    test('should have a description', () => {
      expect(templateData.Description).toBeDefined();
      expect(templateData.Description).toContain('serverless application');
    });

    test('should have Parameters section with EnvironmentSuffix', () => {
      expect(templateData.Parameters).toBeDefined();
      expect(templateData.Parameters.EnvironmentSuffix).toBeDefined();
      expect(templateData.Parameters.EnvironmentSuffix.Type).toBe('String');
      expect(templateData.Parameters.EnvironmentSuffix.Default).toBe('dev');
    });

    test('should have Resources section', () => {
      expect(templateData.Resources).toBeDefined();
      expect(Object.keys(templateData.Resources).length).toBeGreaterThan(0);
    });

    test('should have Outputs section', () => {
      expect(templateData.Outputs).toBeDefined();
      expect(Object.keys(templateData.Outputs).length).toBeGreaterThan(0);
    });

    test('should have Globals section', () => {
      expect(templateData.Globals).toBeDefined();
      expect(templateData.Globals.Function).toBeDefined();
    });
  });

  describe('Globals Configuration', () => {
    test('should have correct global function settings', () => {
      const globals = templateData.Globals.Function;
      expect(globals.Runtime).toBe('nodejs20.x');
      expect(globals.Timeout).toBe(30);
      expect(globals.MemorySize).toBe(128);
      expect(
        globals.Environment.Variables.AWS_NODEJS_CONNECTION_REUSE_ENABLED
      ).toBe(1);
    });
  });

  describe('DynamoDB Tables', () => {
    const tables = ['ItemsTable', 'UsersTable', 'OrdersTable'];
    const primaryKeys = {
      ItemsTable: 'itemId',
      UsersTable: 'userId',
      OrdersTable: 'orderId',
    };

    tables.forEach(tableName => {
      describe(`${tableName}`, () => {
        test('should exist with correct type', () => {
          expect(templateData.Resources[tableName]).toBeDefined();
          expect(templateData.Resources[tableName].Type).toBe(
            'AWS::DynamoDB::Table'
          );
        });

        test('should have PAY_PER_REQUEST billing mode', () => {
          expect(templateData.Resources[tableName].Properties.BillingMode).toBe(
            'PAY_PER_REQUEST'
          );
        });

        test('should have correct primary key', () => {
          const table = templateData.Resources[tableName];
          const primaryKey = primaryKeys[tableName as keyof typeof primaryKeys];

          expect(table.Properties.AttributeDefinitions).toBeDefined();
          expect(table.Properties.AttributeDefinitions[0].AttributeName).toBe(
            primaryKey
          );
          expect(table.Properties.AttributeDefinitions[0].AttributeType).toBe(
            'S'
          );

          expect(table.Properties.KeySchema).toBeDefined();
          expect(table.Properties.KeySchema[0].AttributeName).toBe(primaryKey);
          expect(table.Properties.KeySchema[0].KeyType).toBe('HASH');
        });

        test('should include environment suffix in table name', () => {
          const table = templateData.Resources[tableName];
          expect(table.Properties.TableName).toBeDefined();
          // Check for Fn::Sub structure and that it contains the EnvironmentSuffix parameter
          expect(table.Properties.TableName['Fn::Sub']).toBeDefined();
          expect(table.Properties.TableName['Fn::Sub']).toContain(
            '${EnvironmentSuffix}'
          );
        });
      });
    });
  });

  describe('Serverless Functions', () => {
    const functions = ['ItemsFunction', 'UsersFunction', 'OrdersFunction'];
    const tableRefs = {
      ItemsFunction: 'ItemsTable',
      UsersFunction: 'UsersTable',
      OrdersFunction: 'OrdersTable',
    };

    functions.forEach(functionName => {
      describe(`${functionName}`, () => {
        test('should exist with correct type', () => {
          expect(templateData.Resources[functionName]).toBeDefined();
          expect(templateData.Resources[functionName].Type).toBe(
            'AWS::Serverless::Function'
          );
        });

        test('should have correct handler', () => {
          expect(templateData.Resources[functionName].Properties.Handler).toBe(
            'index.handler'
          );
        });

        test('should have environment variables with table reference', () => {
          const func = templateData.Resources[functionName];
          const tableRef = tableRefs[functionName as keyof typeof tableRefs];

          expect(func.Properties.Environment).toBeDefined();
          expect(func.Properties.Environment.Variables).toBeDefined();

          const envVarName = `${tableRef.replace('Table', '').toUpperCase()}_TABLE_NAME`;
          expect(
            func.Properties.Environment.Variables[envVarName]
          ).toBeDefined();
        });

        test('should include environment suffix in function name', () => {
          const func = templateData.Resources[functionName];
          expect(func.Properties.FunctionName).toBeDefined();
          // Check for Fn::Sub structure and that it contains the EnvironmentSuffix parameter
          expect(func.Properties.FunctionName['Fn::Sub']).toBeDefined();
          expect(func.Properties.FunctionName['Fn::Sub']).toContain(
            '${EnvironmentSuffix}'
          );
        });

        test('should have inline code with DynamoDB operations', () => {
          const func = templateData.Resources[functionName];
          expect(func.Properties.InlineCode).toBeDefined();
          expect(func.Properties.InlineCode).toContain('DynamoDBClient');
          expect(func.Properties.InlineCode).toContain('PutItemCommand');
          expect(func.Properties.InlineCode).toContain('GetItemCommand');
          expect(func.Properties.InlineCode).toContain('exports.handler');
        });

        test('should have DynamoDB policies', () => {
          const func = templateData.Resources[functionName];
          expect(func.Properties.Policies).toBeDefined();
          expect(func.Properties.Policies[0].DynamoDBCrudPolicy).toBeDefined();
        });

        test('should have API events configured', () => {
          const func = templateData.Resources[functionName];
          expect(func.Properties.Events).toBeDefined();
          const apiEvent = Object.values(func.Properties.Events)[0] as any;
          expect(apiEvent.Type).toBe('Api');
          expect(apiEvent.Properties.Method).toBe('ANY');
        });
      });
    });
  });

  describe('API Configuration', () => {
    test('ItemsFunction should have correct API path', () => {
      const func = templateData.Resources.ItemsFunction;
      const apiEvent = func.Properties.Events.ItemsApi;
      expect(apiEvent.Properties.Path).toBe('/items');
    });

    test('UsersFunction should have correct API path', () => {
      const func = templateData.Resources.UsersFunction;
      const apiEvent = func.Properties.Events.UsersApi;
      expect(apiEvent.Properties.Path).toBe('/users');
    });

    test('OrdersFunction should have correct API path', () => {
      const func = templateData.Resources.OrdersFunction;
      const apiEvent = func.Properties.Events.OrdersApi;
      expect(apiEvent.Properties.Path).toBe('/orders');
    });
  });

  describe('Outputs', () => {
    test('should have ApiGatewayUrl output', () => {
      expect(templateData.Outputs.ApiGatewayUrl).toBeDefined();
      expect(templateData.Outputs.ApiGatewayUrl.Description).toContain(
        'API Gateway'
      );
      // Check for Fn::Sub structure and that it contains ServerlessRestApi
      expect(templateData.Outputs.ApiGatewayUrl.Value['Fn::Sub']).toBeDefined();
      expect(templateData.Outputs.ApiGatewayUrl.Value['Fn::Sub']).toContain(
        'ServerlessRestApi'
      );
      // Check export name contains environment suffix
      expect(
        templateData.Outputs.ApiGatewayUrl.Export.Name['Fn::Sub']
      ).toBeDefined();
      expect(
        templateData.Outputs.ApiGatewayUrl.Export.Name['Fn::Sub']
      ).toContain('${EnvironmentSuffix}');
    });

    test('should have table name outputs', () => {
      const tableOutputs = [
        'ItemsTableName',
        'UsersTableName',
        'OrdersTableName',
      ];
      const tableRefs = {
        ItemsTableName: 'ItemsTable',
        UsersTableName: 'UsersTable',
        OrdersTableName: 'OrdersTable',
      };

      tableOutputs.forEach(outputName => {
        expect(templateData.Outputs[outputName]).toBeDefined();
        expect(templateData.Outputs[outputName].Value).toBeDefined();
        // Check export name contains environment suffix
        expect(
          templateData.Outputs[outputName].Export.Name['Fn::Sub']
        ).toBeDefined();
        expect(
          templateData.Outputs[outputName].Export.Name['Fn::Sub']
        ).toContain('${EnvironmentSuffix}');
      });
    });

    test('should have function ARN outputs', () => {
      const functionOutputs = [
        'ItemsFunctionArn',
        'UsersFunctionArn',
        'OrdersFunctionArn',
      ];
      functionOutputs.forEach(outputName => {
        expect(templateData.Outputs[outputName]).toBeDefined();
        expect(templateData.Outputs[outputName].Description).toContain('ARN');
      });
    });
  });

  describe('Resource Count Validation', () => {
    test('should have expected number of resources', () => {
      const resources = Object.keys(templateData.Resources);
      // 3 tables + 3 functions = 6 resources (SAM creates implicit resources)
      expect(resources.length).toBe(6);
    });

    test('should have expected number of outputs', () => {
      const outputs = Object.keys(templateData.Outputs);
      // 1 API URL + 3 table names + 3 function ARNs = 7
      expect(outputs.length).toBe(7);
    });
  });

  describe('Security Best Practices', () => {
    test('should not have any retain deletion policies', () => {
      Object.values(templateData.Resources).forEach((resource: any) => {
        if (resource.DeletionPolicy) {
          expect(resource.DeletionPolicy).not.toBe('Retain');
        }
      });
    });

    test('should use least privilege DynamoDB permissions', () => {
      const functions = ['ItemsFunction', 'UsersFunction', 'OrdersFunction'];
      functions.forEach(functionName => {
        const func = templateData.Resources[functionName];
        expect(func.Properties.Policies).toBeDefined();
        expect(func.Properties.Policies[0].DynamoDBCrudPolicy).toBeDefined();
        expect(
          func.Properties.Policies[0].DynamoDBCrudPolicy.TableName
        ).toBeDefined();
      });
    });
  });

  describe('Lambda Function Code', () => {
    const sampleFunction = 'ItemsFunction';

    test('should handle POST requests correctly', () => {
      const func = templateData.Resources[sampleFunction];
      const code = func.Properties.InlineCode;

      expect(code).toContain("case 'POST':");
      expect(code).toContain('JSON.parse(event.body)');
      expect(code).toContain('PutItemCommand');
      expect(code).toContain('statusCode: 201');
      expect(code).toContain('Item created successfully');
    });

    test('should handle GET requests correctly', () => {
      const func = templateData.Resources[sampleFunction];
      const code = func.Properties.InlineCode;

      expect(code).toContain("case 'GET':");
      expect(code).toContain('event.queryStringParameters');
      expect(code).toContain('GetItemCommand');
      expect(code).toContain('statusCode: 200');
      expect(code).toContain('statusCode: 404');
      expect(code).toContain('Item not found');
    });

    test('should handle errors properly', () => {
      const func = templateData.Resources[sampleFunction];
      const code = func.Properties.InlineCode;

      expect(code).toContain('try {');
      expect(code).toContain('} catch (error)');
      expect(code).toContain('console.error');
      expect(code).toContain('statusCode: 500');
      expect(code).toContain('Internal Server Error');
    });

    test('should validate required parameters', () => {
      const func = templateData.Resources[sampleFunction];
      const code = func.Properties.InlineCode;

      expect(code).toContain('if (!itemId)');
      expect(code).toContain('statusCode: 400');
      expect(code).toContain('Missing itemId query parameter');
    });

    test('should include CORS headers', () => {
      const func = templateData.Resources[sampleFunction];
      const code = func.Properties.InlineCode;

      expect(code).toContain('Access-Control-Allow-Origin');
      expect(code).toContain('Access-Control-Allow-Methods');
      expect(code).toContain('Access-Control-Allow-Headers');
    });
  });

  describe('Consistency Across Functions', () => {
    test('all functions should have consistent Events configuration', () => {
      const functions = ['ItemsFunction', 'UsersFunction', 'OrdersFunction'];
      functions.forEach(functionName => {
        const func = templateData.Resources[functionName];
        expect(func.Properties.Events).toBeDefined();
        const apiEvent = Object.values(func.Properties.Events)[0] as any;
        expect(apiEvent.Type).toBe('Api');
        expect(apiEvent.Properties.Method).toBe('ANY');
      });
    });

    test('all tables should have consistent billing mode', () => {
      const tables = ['ItemsTable', 'UsersTable', 'OrdersTable'];
      const billingModes = tables.map(
        t => templateData.Resources[t].Properties.BillingMode
      );

      expect(new Set(billingModes).size).toBe(1);
      expect(billingModes[0]).toBe('PAY_PER_REQUEST');
    });
  });

  describe('Template Validation', () => {
    test('should have valid JSON structure', () => {
      expect(() => JSON.stringify(templateData)).not.toThrow();
    });

    test('should have required top-level keys', () => {
      expect(templateData).toHaveProperty('AWSTemplateFormatVersion');
      expect(templateData).toHaveProperty('Transform');
      expect(templateData).toHaveProperty('Description');
      expect(templateData).toHaveProperty('Globals');
      expect(templateData).toHaveProperty('Parameters');
      expect(templateData).toHaveProperty('Resources');
      expect(templateData).toHaveProperty('Outputs');
    });

    test('all resources should have Type property', () => {
      Object.entries(templateData.Resources).forEach(
        ([name, resource]: [string, any]) => {
          expect(resource.Type).toBeDefined();
          expect(typeof resource.Type).toBe('string');
        }
      );
    });
  });
});
