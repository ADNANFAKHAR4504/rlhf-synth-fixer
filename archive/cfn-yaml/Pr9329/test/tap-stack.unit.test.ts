import fs from 'fs';
import path from 'path';

describe('TapStack CloudFormation Template - Unit Tests', () => {
  let template: any;

  beforeAll(() => {
    // Load the JSON template (convert YAML to JSON first if needed)
    const templatePath = path.join(__dirname, '../lib/TapStack.json');
    if (!fs.existsSync(templatePath)) {
      throw new Error(
        'TapStack.json not found. Run: pipenv run cfn-flip lib/TapStack.yml lib/TapStack.json'
      );
    }
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
      expect(template.Description).toContain('LocalStack Compatible');
    });

    test('should have required top-level sections', () => {
      expect(template.Parameters).toBeDefined();
      expect(template.Resources).toBeDefined();
      expect(template.Outputs).toBeDefined();
    });

    test('should have valid JSON structure', () => {
      expect(template).toBeDefined();
      expect(typeof template).toBe('object');
      expect(Array.isArray(template)).toBe(false);
    });
  });

  describe('Parameters', () => {
    test('should have all required parameters', () => {
      expect(template.Parameters.EnvironmentSuffix).toBeDefined();
      expect(template.Parameters.DynamoDBReadCapacity).toBeDefined();
      expect(template.Parameters.DynamoDBWriteCapacity).toBeDefined();
      expect(template.Parameters.LogRetentionDays).toBeDefined();
    });

    test('EnvironmentSuffix parameter should have correct properties', () => {
      const param = template.Parameters.EnvironmentSuffix;
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('dev');
      expect(param.Description).toContain('Environment suffix');
    });

    test('DynamoDB capacity parameters should have correct bounds', () => {
      const readCapParam = template.Parameters.DynamoDBReadCapacity;
      const writeCapParam = template.Parameters.DynamoDBWriteCapacity;
      
      expect(readCapParam.Type).toBe('Number');
      expect(readCapParam.Default).toBe(5);
      expect(readCapParam.MinValue).toBe(1);
      expect(readCapParam.MaxValue).toBe(10);
      
      expect(writeCapParam.Type).toBe('Number');
      expect(writeCapParam.Default).toBe(5);
      expect(writeCapParam.MinValue).toBe(1);
      expect(writeCapParam.MaxValue).toBe(10);
    });

    test('LogRetentionDays parameter should have valid allowed values', () => {
      const param = template.Parameters.LogRetentionDays;
      expect(param.Type).toBe('Number');
      expect(param.Default).toBe(7);
      expect(param.AllowedValues).toContain(7);
      expect(param.AllowedValues).toContain(30);
      expect(param.AllowedValues).toContain(90);
    });
  });

  describe('DynamoDB Table', () => {
    test('should have UserProfilesTable resource', () => {
      expect(template.Resources.UserProfilesTable).toBeDefined();
      expect(template.Resources.UserProfilesTable.Type).toBe('AWS::DynamoDB::Table');
    });

    test('should have correct billing mode', () => {
      const table = template.Resources.UserProfilesTable;
      expect(table.Properties.BillingMode).toBe('PROVISIONED');
    });

    test('should have correct key schema with userId as HASH key', () => {
      const table = template.Resources.UserProfilesTable;
      const keySchema = table.Properties.KeySchema;

      expect(keySchema).toHaveLength(1);
      expect(keySchema[0].AttributeName).toBe('userId');
      expect(keySchema[0].KeyType).toBe('HASH');
    });

    test('should have all required attribute definitions', () => {
      const table = template.Resources.UserProfilesTable;
      const attrs = table.Properties.AttributeDefinitions;

      expect(attrs).toHaveLength(3);
      
      const attrNames = attrs.map((a: any) => a.AttributeName);
      expect(attrNames).toContain('userId');
      expect(attrNames).toContain('email');
      expect(attrNames).toContain('createdAt');

      attrs.forEach((attr: any) => {
        expect(attr.AttributeType).toBe('S');
      });
    });

    test('should have Global Secondary Indexes', () => {
      const table = template.Resources.UserProfilesTable;
      const gsis = table.Properties.GlobalSecondaryIndexes;

      expect(gsis).toHaveLength(2);
      expect(gsis[0].IndexName).toBe('EmailIndex');
      expect(gsis[1].IndexName).toBe('CreatedAtIndex');
    });

    test('should have encryption enabled', () => {
      const table = template.Resources.UserProfilesTable;
      const sseSpec = table.Properties.SSESpecification;

      expect(sseSpec).toBeDefined();
      expect(sseSpec.SSEEnabled).toBe(true);
    });

    test('should NOT have point-in-time recovery (LocalStack incompatible)', () => {
      const table = template.Resources.UserProfilesTable;
      expect(table.Properties.PointInTimeRecoverySpecification).toBeUndefined();
    });
  });

  describe('IAM Role', () => {
    test('should have LambdaExecutionRole', () => {
      expect(template.Resources.LambdaExecutionRole).toBeDefined();
      expect(template.Resources.LambdaExecutionRole.Type).toBe('AWS::IAM::Role');
    });

    test('Lambda role should NOT have X-Ray policy (LocalStack incompatible)', () => {
      const role = template.Resources.LambdaExecutionRole;
      const managedPolicies = role.Properties.ManagedPolicyArns || [];
      const hasXRay = managedPolicies.some((p: string) => p.includes('XRay'));
      expect(hasXRay).toBe(false);
    });
  });

  describe('Lambda Functions', () => {
    const lambdaFunctions = [
      'CreateUserFunction',
      'GetUserFunction',
      'UpdateUserFunction',
      'DeleteUserFunction',
      'ListUsersFunction'
    ];

    test('should have all CRUD Lambda functions', () => {
      lambdaFunctions.forEach(functionName => {
        expect(template.Resources[functionName]).toBeDefined();
        expect(template.Resources[functionName].Type).toBe('AWS::Lambda::Function');
      });
    });

    test('Lambda functions should have correct runtime', () => {
      lambdaFunctions.forEach(functionName => {
        const func = template.Resources[functionName];
        expect(func.Properties.Runtime).toBe('python3.9');
      });
    });

    test('Lambda functions should NOT have X-Ray tracing (LocalStack incompatible)', () => {
      lambdaFunctions.forEach(functionName => {
        const func = template.Resources[functionName];
        expect(func.Properties.TracingConfig).toBeUndefined();
      });
    });
  });

  describe('API Gateway', () => {
    test('should have REST API', () => {
      expect(template.Resources.RestApi).toBeDefined();
      expect(template.Resources.RestApi.Type).toBe('AWS::ApiGateway::RestApi');
    });

    test('API stage should NOT have tracing enabled (LocalStack incompatible)', () => {
      const stage = template.Resources.ApiStage;
      expect(stage.Properties.TracingEnabled).toBeUndefined();
    });

    test('API deployment should NOT depend on ApiGatewayAccount (LocalStack incompatible)', () => {
      const deployment = template.Resources.ApiDeployment;
      expect(deployment.DependsOn).not.toContain('ApiGatewayAccount');
    });
  });

  describe('LocalStack Compatibility', () => {
    test('should NOT have Application Auto Scaling resources', () => {
      expect(template.Resources.TableReadCapacityScalableTarget).toBeUndefined();
      expect(template.Resources.TableWriteCapacityScalableTarget).toBeUndefined();
      expect(template.Resources.TableReadScalingPolicy).toBeUndefined();
      expect(template.Resources.TableWriteScalingPolicy).toBeUndefined();
    });

    test('should NOT have CloudWatch Alarms', () => {
      const resources = Object.keys(template.Resources);
      const alarms = resources.filter(r => 
        template.Resources[r].Type === 'AWS::CloudWatch::Alarm'
      );
      expect(alarms).toHaveLength(0);
    });

    test('should NOT have CloudWatch Dashboard', () => {
      const resources = Object.keys(template.Resources);
      const dashboards = resources.filter(r => 
        template.Resources[r].Type === 'AWS::CloudWatch::Dashboard'
      );
      expect(dashboards).toHaveLength(0);
    });

    test('should NOT have API Gateway Account', () => {
      expect(template.Resources.ApiGatewayAccount).toBeUndefined();
      expect(template.Resources.ApiGatewayCloudWatchLogsRole).toBeUndefined();
    });
  });

  describe('Outputs', () => {
    test('should have API endpoint output', () => {
      expect(template.Outputs.ApiEndpoint).toBeDefined();
    });

    test('should have DynamoDB table name output', () => {
      expect(template.Outputs.DynamoDBTableName).toBeDefined();
    });

    test('should have Lambda function ARN outputs', () => {
      expect(template.Outputs.CreateUserFunctionArn).toBeDefined();
      expect(template.Outputs.GetUserFunctionArn).toBeDefined();
      expect(template.Outputs.UpdateUserFunctionArn).toBeDefined();
      expect(template.Outputs.DeleteUserFunctionArn).toBeDefined();
      expect(template.Outputs.ListUsersFunctionArn).toBeDefined();
    });
  });

  describe('Resource Count Validation', () => {
    test('should have expected number of resources', () => {
      const resourceCount = Object.keys(template.Resources).length;
      expect(resourceCount).toBe(32);
    });
  });
});
