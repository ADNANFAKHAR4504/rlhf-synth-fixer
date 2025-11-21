import { readFileSync } from 'fs';
import { join } from 'path';

describe('Crypto Alert System CloudFormation Template - Unit Tests', () => {
  let template: any;

  beforeAll(() => {
    const templatePath = join(__dirname, '..', 'lib', 'crypto-alert-system.json');
    const templateContent = readFileSync(templatePath, 'utf8');
    template = JSON.parse(templateContent);
  });

  describe('Template Structure', () => {
    test('should have valid CloudFormation version', () => {
      expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
    });

    test('should have a description', () => {
      expect(template.Description).toBeDefined();
      expect(template.Description).toContain('Serverless Crypto Price Alert');
    });

    test('should have EnvironmentSuffix parameter', () => {
      expect(template.Parameters).toBeDefined();
      expect(template.Parameters.EnvironmentSuffix).toBeDefined();
      expect(template.Parameters.EnvironmentSuffix.Type).toBe('String');
      expect(template.Parameters.EnvironmentSuffix.Default).toBe('dev');
    });

    test('should have Resources section', () => {
      expect(template.Resources).toBeDefined();
      expect(Object.keys(template.Resources).length).toBeGreaterThan(0);
    });

    test('should have Outputs section', () => {
      expect(template.Outputs).toBeDefined();
      expect(Object.keys(template.Outputs).length).toBeGreaterThan(0);
    });
  });

  describe('DynamoDB Table', () => {
    let cryptoAlertsTable: any;

    beforeAll(() => {
      cryptoAlertsTable = template.Resources.CryptoAlertsTable;
    });

    test('should exist', () => {
      expect(cryptoAlertsTable).toBeDefined();
    });

    test('should be of type AWS::DynamoDB::Table', () => {
      expect(cryptoAlertsTable.Type).toBe('AWS::DynamoDB::Table');
    });

    test('should have TableName with EnvironmentSuffix', () => {
      expect(cryptoAlertsTable.Properties.TableName).toBeDefined();
      expect(cryptoAlertsTable.Properties.TableName['Fn::Sub']).toContain('${EnvironmentSuffix}');
    });

    test('should use PAY_PER_REQUEST billing mode', () => {
      expect(cryptoAlertsTable.Properties.BillingMode).toBe('PAY_PER_REQUEST');
    });

    test('should have correct key schema', () => {
      const keySchema = cryptoAlertsTable.Properties.KeySchema;
      expect(keySchema).toHaveLength(2);
      expect(keySchema[0].AttributeName).toBe('userId');
      expect(keySchema[0].KeyType).toBe('HASH');
      expect(keySchema[1].AttributeName).toBe('alertId');
      expect(keySchema[1].KeyType).toBe('RANGE');
    });

    test('should have correct attribute definitions', () => {
      const attrDefs = cryptoAlertsTable.Properties.AttributeDefinitions;
      expect(attrDefs).toHaveLength(2);
      expect(attrDefs[0].AttributeName).toBe('userId');
      expect(attrDefs[0].AttributeType).toBe('S');
      expect(attrDefs[1].AttributeName).toBe('alertId');
      expect(attrDefs[1].AttributeType).toBe('S');
    });

    test('should have point-in-time recovery enabled', () => {
      expect(cryptoAlertsTable.Properties.PointInTimeRecoverySpecification.PointInTimeRecoveryEnabled).toBe(true);
    });

    test('should have appropriate tags', () => {
      const tags = cryptoAlertsTable.Properties.Tags;
      expect(tags).toBeDefined();
      expect(tags.length).toBeGreaterThan(0);
      const envTag = tags.find((t: any) => t.Key === 'Environment');
      expect(envTag).toBeDefined();
    });

    test('should not have DeletionProtection', () => {
      expect(cryptoAlertsTable.Properties.DeletionProtectionEnabled).toBeFalsy();
    });
  });

  describe('Lambda Functions', () => {
    describe('PriceWebhookProcessor Lambda', () => {
      let lambda: any;
      let role: any;
      let logGroup: any;

      beforeAll(() => {
        lambda = template.Resources.PriceWebhookProcessor;
        role = template.Resources.PriceWebhookProcessorRole;
        logGroup = template.Resources.PriceWebhookProcessorLogGroup;
      });

      test('should exist', () => {
        expect(lambda).toBeDefined();
      });

      test('should be of type AWS::Lambda::Function', () => {
        expect(lambda.Type).toBe('AWS::Lambda::Function');
      });

      test('should have FunctionName with EnvironmentSuffix', () => {
        expect(lambda.Properties.FunctionName['Fn::Sub']).toContain('${EnvironmentSuffix}');
      });

      test('should use python3.11 runtime', () => {
        expect(lambda.Properties.Runtime).toBe('python3.11');
      });

      test('should use arm64 architecture', () => {
        expect(lambda.Properties.Architectures).toEqual(['arm64']);
      });

      test('should have 1GB memory', () => {
        expect(lambda.Properties.MemorySize).toBe(1024);
      });

      test('should have 5 minute timeout', () => {
        expect(lambda.Properties.Timeout).toBe(300);
      });

      test('should have reserved concurrent executions of 10', () => {
        expect(lambda.Properties.ReservedConcurrentExecutions).toBe(10);
      });

      test('should have environment variables', () => {
        const envVars = lambda.Properties.Environment.Variables;
        expect(envVars.DYNAMODB_TABLE).toBeDefined();
        expect(envVars.ENVIRONMENT).toBeDefined();
      });

      test('should have inline code', () => {
        expect(lambda.Properties.Code.ZipFile).toBeDefined();
        expect(lambda.Properties.Code.ZipFile).toContain('def handler(event, context):');
      });

      test('should depend on log group', () => {
        expect(lambda.DependsOn).toBe('PriceWebhookProcessorLogGroup');
      });

      test('should have IAM role', () => {
        expect(role).toBeDefined();
        expect(role.Type).toBe('AWS::IAM::Role');
      });

      test('IAM role should have DynamoDB permissions', () => {
        const policies = role.Properties.Policies;
        const dynamoPolicy = policies.find((p: any) => p.PolicyName === 'DynamoDBAccess');
        expect(dynamoPolicy).toBeDefined();
        const actions = dynamoPolicy.PolicyDocument.Statement[0].Action;
        expect(actions).toContain('dynamodb:PutItem');
        expect(actions).toContain('dynamodb:GetItem');
        expect(actions).toContain('dynamodb:UpdateItem');
        expect(actions).toContain('dynamodb:Query');
      });

      test('IAM role should have CloudWatch Logs permissions', () => {
        const policies = role.Properties.Policies;
        const logsPolicy = policies.find((p: any) => p.PolicyName === 'CloudWatchLogs');
        expect(logsPolicy).toBeDefined();
        const actions = logsPolicy.PolicyDocument.Statement[0].Action;
        expect(actions).toContain('logs:CreateLogStream');
        expect(actions).toContain('logs:PutLogEvents');
      });

      test('IAM role should not have wildcard actions', () => {
        const policies = role.Properties.Policies;
        policies.forEach((policy: any) => {
          policy.PolicyDocument.Statement.forEach((statement: any) => {
            const actions = Array.isArray(statement.Action) ? statement.Action : [statement.Action];
            actions.forEach((action: string) => {
              expect(action).not.toContain('*');
            });
          });
        });
      });

      test('should have CloudWatch Log Group', () => {
        expect(logGroup).toBeDefined();
        expect(logGroup.Type).toBe('AWS::Logs::LogGroup');
      });

      test('log group should have 3 day retention', () => {
        expect(logGroup.Properties.RetentionInDays).toBe(3);
      });

      test('log group should not have KMS encryption', () => {
        expect(logGroup.Properties.KmsKeyId).toBeUndefined();
      });
    });

    describe('AlertMatcher Lambda', () => {
      let lambda: any;
      let role: any;
      let logGroup: any;

      beforeAll(() => {
        lambda = template.Resources.AlertMatcher;
        role = template.Resources.AlertMatcherRole;
        logGroup = template.Resources.AlertMatcherLogGroup;
      });

      test('should exist', () => {
        expect(lambda).toBeDefined();
      });

      test('should be of type AWS::Lambda::Function', () => {
        expect(lambda.Type).toBe('AWS::Lambda::Function');
      });

      test('should have FunctionName with EnvironmentSuffix', () => {
        expect(lambda.Properties.FunctionName['Fn::Sub']).toContain('${EnvironmentSuffix}');
      });

      test('should use python3.11 runtime', () => {
        expect(lambda.Properties.Runtime).toBe('python3.11');
      });

      test('should use arm64 architecture', () => {
        expect(lambda.Properties.Architectures).toEqual(['arm64']);
      });

      test('should have 2GB memory', () => {
        expect(lambda.Properties.MemorySize).toBe(2048);
      });

      test('should have 5 minute timeout', () => {
        expect(lambda.Properties.Timeout).toBe(300);
      });

      test('should have reserved concurrent executions of 5', () => {
        expect(lambda.Properties.ReservedConcurrentExecutions).toBe(5);
      });

      test('should have environment variables', () => {
        const envVars = lambda.Properties.Environment.Variables;
        expect(envVars.DYNAMODB_TABLE).toBeDefined();
        expect(envVars.ENVIRONMENT).toBeDefined();
      });

      test('should have inline code', () => {
        expect(lambda.Properties.Code.ZipFile).toBeDefined();
        expect(lambda.Properties.Code.ZipFile).toContain('def handler(event, context):');
      });

      test('should depend on log group', () => {
        expect(lambda.DependsOn).toBe('AlertMatcherLogGroup');
      });

      test('should have IAM role', () => {
        expect(role).toBeDefined();
        expect(role.Type).toBe('AWS::IAM::Role');
      });

      test('IAM role should have DynamoDB read permissions', () => {
        const policies = role.Properties.Policies;
        const dynamoPolicy = policies.find((p: any) => p.PolicyName === 'DynamoDBAccess');
        expect(dynamoPolicy).toBeDefined();
        const actions = dynamoPolicy.PolicyDocument.Statement[0].Action;
        expect(actions).toContain('dynamodb:Scan');
        expect(actions).toContain('dynamodb:Query');
        expect(actions).toContain('dynamodb:GetItem');
      });

      test('IAM role should not have wildcard actions', () => {
        const policies = role.Properties.Policies;
        policies.forEach((policy: any) => {
          policy.PolicyDocument.Statement.forEach((statement: any) => {
            const actions = Array.isArray(statement.Action) ? statement.Action : [statement.Action];
            actions.forEach((action: string) => {
              expect(action).not.toContain('*');
            });
          });
        });
      });

      test('should have CloudWatch Log Group', () => {
        expect(logGroup).toBeDefined();
        expect(logGroup.Type).toBe('AWS::Logs::LogGroup');
      });

      test('log group should have 3 day retention', () => {
        expect(logGroup.Properties.RetentionInDays).toBe(3);
      });
    });

    describe('ProcessedAlerts Lambda', () => {
      let lambda: any;
      let role: any;
      let logGroup: any;

      beforeAll(() => {
        lambda = template.Resources.ProcessedAlerts;
        role = template.Resources.ProcessedAlertsRole;
        logGroup = template.Resources.ProcessedAlertsLogGroup;
      });

      test('should exist', () => {
        expect(lambda).toBeDefined();
      });

      test('should be of type AWS::Lambda::Function', () => {
        expect(lambda.Type).toBe('AWS::Lambda::Function');
      });

      test('should have FunctionName with EnvironmentSuffix', () => {
        expect(lambda.Properties.FunctionName['Fn::Sub']).toContain('${EnvironmentSuffix}');
      });

      test('should use python3.11 runtime', () => {
        expect(lambda.Properties.Runtime).toBe('python3.11');
      });

      test('should use arm64 architecture', () => {
        expect(lambda.Properties.Architectures).toEqual(['arm64']);
      });

      test('should have 512MB memory', () => {
        expect(lambda.Properties.MemorySize).toBe(512);
      });

      test('should have 5 minute timeout', () => {
        expect(lambda.Properties.Timeout).toBe(300);
      });

      test('should not have reserved concurrent executions', () => {
        expect(lambda.Properties.ReservedConcurrentExecutions).toBeUndefined();
      });

      test('should have environment variables', () => {
        const envVars = lambda.Properties.Environment.Variables;
        expect(envVars.DYNAMODB_TABLE).toBeDefined();
        expect(envVars.ENVIRONMENT).toBeDefined();
      });

      test('should have inline code', () => {
        expect(lambda.Properties.Code.ZipFile).toBeDefined();
        expect(lambda.Properties.Code.ZipFile).toContain('def handler(event, context):');
      });

      test('should depend on log group', () => {
        expect(lambda.DependsOn).toBe('ProcessedAlertsLogGroup');
      });

      test('should have IAM role', () => {
        expect(role).toBeDefined();
        expect(role.Type).toBe('AWS::IAM::Role');
      });

      test('IAM role should have DynamoDB write permissions', () => {
        const policies = role.Properties.Policies;
        const dynamoPolicy = policies.find((p: any) => p.PolicyName === 'DynamoDBAccess');
        expect(dynamoPolicy).toBeDefined();
        const actions = dynamoPolicy.PolicyDocument.Statement[0].Action;
        expect(actions).toContain('dynamodb:PutItem');
        expect(actions).toContain('dynamodb:UpdateItem');
      });

      test('IAM role should not have wildcard actions', () => {
        const policies = role.Properties.Policies;
        policies.forEach((policy: any) => {
          policy.PolicyDocument.Statement.forEach((statement: any) => {
            const actions = Array.isArray(statement.Action) ? statement.Action : [statement.Action];
            actions.forEach((action: string) => {
              expect(action).not.toContain('*');
            });
          });
        });
      });

      test('should have CloudWatch Log Group', () => {
        expect(logGroup).toBeDefined();
        expect(logGroup.Type).toBe('AWS::Logs::LogGroup');
      });

      test('log group should have 3 day retention', () => {
        expect(logGroup.Properties.RetentionInDays).toBe(3);
      });
    });
  });

  describe('Lambda Destinations', () => {
    let destinationConfig: any;
    let permission: any;

    beforeAll(() => {
      destinationConfig = template.Resources.AlertMatcherDestinationConfig;
      permission = template.Resources.ProcessedAlertsInvokePermission;
    });

    test('should have EventInvokeConfig', () => {
      expect(destinationConfig).toBeDefined();
      expect(destinationConfig.Type).toBe('AWS::Lambda::EventInvokeConfig');
    });

    test('should configure success destination', () => {
      expect(destinationConfig.Properties.DestinationConfig.OnSuccess).toBeDefined();
      expect(destinationConfig.Properties.DestinationConfig.OnSuccess.Destination).toBeDefined();
    });

    test('should have maximum retry attempts', () => {
      expect(destinationConfig.Properties.MaximumRetryAttempts).toBe(2);
    });

    test('should use $LATEST qualifier', () => {
      expect(destinationConfig.Properties.Qualifier).toBe('$LATEST');
    });

    test('should have Lambda permission for invocation', () => {
      expect(permission).toBeDefined();
      expect(permission.Type).toBe('AWS::Lambda::Permission');
    });

    test('Lambda permission should allow InvokeFunction', () => {
      expect(permission.Properties.Action).toBe('lambda:InvokeFunction');
    });

    test('Lambda permission should have correct principal', () => {
      expect(permission.Properties.Principal).toBe('lambda.amazonaws.com');
    });
  });

  describe('EventBridge Schedule', () => {
    let schedule: any;
    let scheduleRole: any;
    let permission: any;

    beforeAll(() => {
      schedule = template.Resources.AlertMatcherSchedule;
      scheduleRole = template.Resources.AlertMatcherScheduleRole;
      permission = template.Resources.AlertMatcherSchedulePermission;
    });

    test('should exist', () => {
      expect(schedule).toBeDefined();
    });

    test('should be of type AWS::Events::Rule', () => {
      expect(schedule.Type).toBe('AWS::Events::Rule');
    });

    test('should have name with EnvironmentSuffix', () => {
      expect(schedule.Properties.Name['Fn::Sub']).toContain('${EnvironmentSuffix}');
    });

    test('should use rate expression', () => {
      expect(schedule.Properties.ScheduleExpression).toBe('rate(1 minute)');
      expect(schedule.Properties.ScheduleExpression).toContain('rate');
      expect(schedule.Properties.ScheduleExpression).not.toContain('cron');
    });

    test('should be enabled', () => {
      expect(schedule.Properties.State).toBe('ENABLED');
    });

    test('should have target configured', () => {
      expect(schedule.Properties.Targets).toHaveLength(1);
      expect(schedule.Properties.Targets[0].Id).toBe('AlertMatcherTarget');
    });

    test('should have IAM role for EventBridge', () => {
      expect(scheduleRole).toBeDefined();
      expect(scheduleRole.Type).toBe('AWS::IAM::Role');
    });

    test('IAM role should allow EventBridge to assume it', () => {
      const assumePolicy = scheduleRole.Properties.AssumeRolePolicyDocument;
      expect(assumePolicy.Statement[0].Principal.Service).toBe('events.amazonaws.com');
    });

    test('IAM role should have Lambda invoke permission', () => {
      const policies = scheduleRole.Properties.Policies;
      const invokePolicy = policies.find((p: any) => p.PolicyName === 'InvokeLambda');
      expect(invokePolicy).toBeDefined();
      expect(invokePolicy.PolicyDocument.Statement[0].Action).toBe('lambda:InvokeFunction');
    });

    test('should have Lambda permission for EventBridge', () => {
      expect(permission).toBeDefined();
      expect(permission.Type).toBe('AWS::Lambda::Permission');
    });

    test('Lambda permission should allow events.amazonaws.com', () => {
      expect(permission.Properties.Principal).toBe('events.amazonaws.com');
    });
  });

  describe('Stack Outputs', () => {
    test('should export PriceWebhookProcessorArn', () => {
      const output = template.Outputs.PriceWebhookProcessorArn;
      expect(output).toBeDefined();
      expect(output.Description).toContain('PriceWebhookProcessor');
      expect(output.Export).toBeDefined();
    });

    test('should export AlertMatcherArn', () => {
      const output = template.Outputs.AlertMatcherArn;
      expect(output).toBeDefined();
      expect(output.Description).toContain('AlertMatcher');
      expect(output.Export).toBeDefined();
    });

    test('should export ProcessedAlertsArn', () => {
      const output = template.Outputs.ProcessedAlertsArn;
      expect(output).toBeDefined();
      expect(output.Description).toContain('ProcessedAlerts');
      expect(output.Export).toBeDefined();
    });

    test('should export CryptoAlertsTableName', () => {
      const output = template.Outputs.CryptoAlertsTableName;
      expect(output).toBeDefined();
      expect(output.Description).toContain('DynamoDB table');
      expect(output.Export).toBeDefined();
    });

    test('should export CryptoAlertsTableArn', () => {
      const output = template.Outputs.CryptoAlertsTableArn;
      expect(output).toBeDefined();
      expect(output.Description).toContain('ARN');
      expect(output.Export).toBeDefined();
    });

    test('all outputs should have Export names with EnvironmentSuffix', () => {
      Object.keys(template.Outputs).forEach(outputKey => {
        const output = template.Outputs[outputKey];
        expect(output.Export).toBeDefined();
        expect(output.Export.Name['Fn::Sub']).toContain('${EnvironmentSuffix}');
      });
    });
  });

  describe('Resource Naming Conventions', () => {
    test('all resources with names should include EnvironmentSuffix', () => {
      const resourcesWithNames = [
        'CryptoAlertsTable',
        'PriceWebhookProcessor',
        'AlertMatcher',
        'ProcessedAlerts',
        'AlertMatcherSchedule',
        'PriceWebhookProcessorLogGroup',
        'AlertMatcherLogGroup',
        'ProcessedAlertsLogGroup',
        'PriceWebhookProcessorRole',
        'AlertMatcherRole',
        'ProcessedAlertsRole',
        'AlertMatcherScheduleRole'
      ];

      resourcesWithNames.forEach(resourceKey => {
        const resource = template.Resources[resourceKey];
        if (resource && resource.Properties) {
          const nameProps = ['TableName', 'FunctionName', 'Name', 'RoleName', 'LogGroupName'];
          nameProps.forEach(prop => {
            if (resource.Properties[prop]) {
              const nameValue = resource.Properties[prop];
              if (nameValue['Fn::Sub']) {
                expect(nameValue['Fn::Sub']).toContain('${EnvironmentSuffix}');
              }
            }
          });
        }
      });
    });

    test('no resources should have Retain deletion policy', () => {
      Object.keys(template.Resources).forEach(resourceKey => {
        const resource = template.Resources[resourceKey];
        expect(resource.DeletionPolicy).not.toBe('Retain');
      });
    });

    test('no resources should have DeletionProtection', () => {
      Object.keys(template.Resources).forEach(resourceKey => {
        const resource = template.Resources[resourceKey];
        if (resource.Properties) {
          expect(resource.Properties.DeletionProtectionEnabled).not.toBe(true);
        }
      });
    });
  });

  describe('Security Best Practices', () => {
    test('all IAM roles should have least privilege policies', () => {
      const roles = [
        'PriceWebhookProcessorRole',
        'AlertMatcherRole',
        'ProcessedAlertsRole',
        'AlertMatcherScheduleRole'
      ];

      roles.forEach(roleKey => {
        const role = template.Resources[roleKey];
        expect(role.Properties.Policies).toBeDefined();
        expect(role.Properties.Policies.length).toBeGreaterThan(0);
      });
    });

    test('no IAM policies should have wildcard resources', () => {
      const roles = [
        'PriceWebhookProcessorRole',
        'AlertMatcherRole',
        'ProcessedAlertsRole',
        'AlertMatcherScheduleRole'
      ];

      roles.forEach(roleKey => {
        const role = template.Resources[roleKey];
        role.Properties.Policies.forEach((policy: any) => {
          policy.PolicyDocument.Statement.forEach((statement: any) => {
            if (statement.Resource) {
              const resources = Array.isArray(statement.Resource) ? statement.Resource : [statement.Resource];
              resources.forEach((resource: any) => {
                if (typeof resource === 'string') {
                  // Allow wildcards at the end of specific resources (like log streams)
                  // But not standalone '*'
                  if (resource === '*') {
                    throw new Error('Found wildcard resource: *');
                  }
                }
              });
            }
          });
        });
      });
    });

    test('all Lambda functions should have execution roles', () => {
      const lambdas = ['PriceWebhookProcessor', 'AlertMatcher', 'ProcessedAlerts'];

      lambdas.forEach(lambdaKey => {
        const lambda = template.Resources[lambdaKey];
        expect(lambda.Properties.Role).toBeDefined();
      });
    });
  });

  describe('Cost Optimization', () => {
    test('DynamoDB should use on-demand billing', () => {
      const table = template.Resources.CryptoAlertsTable;
      expect(table.Properties.BillingMode).toBe('PAY_PER_REQUEST');
    });

    test('Lambda functions should use ARM64 architecture', () => {
      const lambdas = ['PriceWebhookProcessor', 'AlertMatcher', 'ProcessedAlerts'];

      lambdas.forEach(lambdaKey => {
        const lambda = template.Resources[lambdaKey];
        expect(lambda.Properties.Architectures).toEqual(['arm64']);
      });
    });

    test('CloudWatch Logs should have short retention period', () => {
      const logGroups = [
        'PriceWebhookProcessorLogGroup',
        'AlertMatcherLogGroup',
        'ProcessedAlertsLogGroup'
      ];

      logGroups.forEach(logGroupKey => {
        const logGroup = template.Resources[logGroupKey];
        expect(logGroup.Properties.RetentionInDays).toBe(3);
      });
    });

    test('CloudWatch Logs should not use KMS encryption', () => {
      const logGroups = [
        'PriceWebhookProcessorLogGroup',
        'AlertMatcherLogGroup',
        'ProcessedAlertsLogGroup'
      ];

      logGroups.forEach(logGroupKey => {
        const logGroup = template.Resources[logGroupKey];
        expect(logGroup.Properties.KmsKeyId).toBeUndefined();
      });
    });
  });
});
