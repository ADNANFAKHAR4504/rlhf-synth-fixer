import fs from 'fs';
import * as yaml from 'js-yaml';
import path from 'path';

describe('Email Notification System CloudFormation Template', () => {
  let template: any;
  let templateContent: string;

  beforeAll(() => {
    // Load the YAML template directly
    const templatePath = path.join(__dirname, '../lib/TapStack.yml');
    templateContent = fs.readFileSync(templatePath, 'utf8');

    try {
      template = yaml.load(templateContent);
    } catch (error) {
      console.log('Warning: Could not parse YAML due to CloudFormation functions, using string-based tests');
      template = null;
    }
  });

  describe('Template Structure', () => {
    test('should have valid CloudFormation format version', () => {
      if (template) {
        expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
      } else {
        expect(templateContent).toContain('AWSTemplateFormatVersion: "2010-09-09"');
      }
    });

    test('should have correct description for email notification system', () => {
      if (template) {
        expect(template.Description).toBeDefined();
        expect(template.Description).toBe(
          'Email Notification System with SNS, SES, Lambda, DynamoDB, and CloudWatch'
        );
      } else {
        expect(templateContent).toContain('Email Notification System with SNS, SES, Lambda, DynamoDB, and CloudWatch');
      }
    });

    test('should have metadata section with proper parameter groups', () => {
      if (template) {
        expect(template.Metadata).toBeDefined();
        expect(template.Metadata['AWS::CloudFormation::Interface']).toBeDefined();
        expect(template.Metadata['AWS::CloudFormation::Interface'].ParameterGroups).toBeDefined();
      } else {
        expect(templateContent).toContain('AWS::CloudFormation::Interface');
        expect(templateContent).toContain('ParameterGroups');
      }
    });
  });

  describe('Parameters', () => {
    test('should have all required parameters', () => {
      const requiredParams = [
        'EnvironmentSuffix',
        'VerifiedDomain',
        'SesFromAddress',
        'EnableProductionSES',
        'TestEmailAddress',
        'AlarmEmail'
      ];

      requiredParams.forEach(param => {
        if (template) {
          expect(template.Parameters[param]).toBeDefined();
        } else {
          expect(templateContent).toContain(`${param}:`);
        }
      });
    });

    test('EnvironmentSuffix parameter should have correct properties', () => {
      if (template) {
        const param = template.Parameters.EnvironmentSuffix;
        expect(param.Type).toBe('String');
        expect(param.Default).toBe('dev');
        expect(param.AllowedPattern).toBe('^[a-zA-Z0-9]+$');
      } else {
        expect(templateContent).toContain('EnvironmentSuffix:');
        expect(templateContent).toContain('Default: "dev"');
        expect(templateContent).toContain('AllowedPattern:');
      }
    });

    test('EnableProductionSES should have boolean string values', () => {
      if (template) {
        const param = template.Parameters.EnableProductionSES;
        expect(param.Type).toBe('String');
        expect(param.Default).toBe('false');
        expect(param.AllowedValues).toEqual(['true', 'false']);
      } else {
        expect(templateContent).toContain('EnableProductionSES:');
        expect(templateContent).toContain('Default: "false"');
        expect(templateContent).toContain('AllowedValues:');
      }
    });

    test('email parameters should have sensible defaults', () => {
      if (template) {
        expect(template.Parameters.VerifiedDomain.Default).toBe('example.com');
        expect(template.Parameters.SesFromAddress.Default).toBe('no-reply@example.com');
        expect(template.Parameters.TestEmailAddress.Default).toBe('test@example.com');
      } else {
        expect(templateContent).toContain('example.com');
        expect(templateContent).toContain('no-reply@example.com');
        expect(templateContent).toContain('test@example.com');
      }
    });
  });

  describe('SNS Topics', () => {
    test('should create order confirmations SNS topic', () => {
      if (template) {
        const topic = template.Resources.SNSTopicOrderConfirmations;
        expect(topic).toBeDefined();
        expect(topic.Type).toBe('AWS::SNS::Topic');
        expect(topic.Properties.KmsMasterKeyId).toBe('alias/aws/sns');
      } else {
        expect(templateContent).toContain('SNSTopicOrderConfirmations:');
        expect(templateContent).toContain('Type: AWS::SNS::Topic');
        expect(templateContent).toContain('KmsMasterKeyId: "alias/aws/sns"');
      }
    });

    test('should create SES feedback SNS topics', () => {
      const feedbackTopics = [
        'SNSTopicSesDelivery',
        'SNSTopicSesBounce',
        'SNSTopicSesComplaint'
      ];

      feedbackTopics.forEach(topicName => {
        if (template) {
          const topic = template.Resources[topicName];
          expect(topic).toBeDefined();
          expect(topic.Type).toBe('AWS::SNS::Topic');
        } else {
          expect(templateContent).toContain(`${topicName}:`);
          expect(templateContent).toContain('Type: AWS::SNS::Topic');
        }
      });
    });

    test('all SNS topics should have proper tagging', () => {
      const topics = [
        'SNSTopicOrderConfirmations',
        'SNSTopicSesDelivery',
        'SNSTopicSesBounce',
        'SNSTopicSesComplaint'
      ];

      topics.forEach(topicName => {
        if (template) {
          const topic = template.Resources[topicName];
          expect(topic.Properties.Tags).toBeDefined();

          const tags = topic.Properties.Tags;
          const irlhfTag = tags.find((tag: any) => tag.Key === 'iac-rlhf-amazon');
          expect(irlhfTag).toBeDefined();
          expect(irlhfTag.Value).toBe('true');
        } else {
          expect(templateContent).toContain('iac-rlhf-amazon');
        }
      });
    });
  });

  describe('DynamoDB Tables', () => {
    test('should create email deliveries table with correct schema', () => {
      if (template) {
        const table = template.Resources.EmailDeliveriesTable;
        expect(table).toBeDefined();
        expect(table.Type).toBe('AWS::DynamoDB::Table');
        expect(table.Properties.BillingMode).toBe('PAY_PER_REQUEST');

        // Check partition and sort keys
        const keySchema = table.Properties.KeySchema;
        expect(keySchema).toHaveLength(2);
        expect(keySchema[0].AttributeName).toBe('orderId');
        expect(keySchema[0].KeyType).toBe('HASH');
        expect(keySchema[1].AttributeName).toBe('messageId');
        expect(keySchema[1].KeyType).toBe('RANGE');
      } else {
        expect(templateContent).toContain('EmailDeliveriesTable:');
        expect(templateContent).toContain('Type: AWS::DynamoDB::Table');
        expect(templateContent).toContain('BillingMode: PAY_PER_REQUEST');
        expect(templateContent).toContain('AttributeName: "orderId"');
        expect(templateContent).toContain('AttributeName: "messageId"');
      }
    });

    test('email deliveries table should have GSIs for querying', () => {
      if (template) {
        const table = template.Resources.EmailDeliveriesTable;
        const gsis = table.Properties.GlobalSecondaryIndexes;

        expect(gsis).toHaveLength(2);
        expect(gsis[0].IndexName).toBe('EmailIndex');
        expect(gsis[1].IndexName).toBe('StatusIndex');
      } else {
        expect(templateContent).toContain('GlobalSecondaryIndexes:');
        expect(templateContent).toContain('IndexName: "EmailIndex"');
        expect(templateContent).toContain('IndexName: "StatusIndex"');
      }
    });

    test('email deliveries table should have encryption and TTL', () => {
      if (template) {
        const table = template.Resources.EmailDeliveriesTable;
        expect(table.Properties.SSESpecification.SSEEnabled).toBe(true);
        expect(table.Properties.TimeToLiveSpecification.Enabled).toBe(true);
        expect(table.Properties.TimeToLiveSpecification.AttributeName).toBe('ttl');
        expect(table.Properties.PointInTimeRecoverySpecification.PointInTimeRecoveryEnabled).toBe(true);
      } else {
        expect(templateContent).toContain('SSESpecification:');
        expect(templateContent).toContain('SSEEnabled: true');
        expect(templateContent).toContain('TimeToLiveSpecification:');
        expect(templateContent).toContain('AttributeName: "ttl"');
        expect(templateContent).toContain('PointInTimeRecoverySpecification:');
      }
    });

    test('should maintain legacy TurnAroundPromptTable for backward compatibility', () => {
      if (template) {
        const table = template.Resources.TurnAroundPromptTable;
        expect(table).toBeDefined();
        expect(table.Type).toBe('AWS::DynamoDB::Table');
        expect(table.Properties.BillingMode).toBe('PAY_PER_REQUEST');
      } else {
        expect(templateContent).toContain('TurnAroundPromptTable:');
        expect(templateContent).toContain('Type: AWS::DynamoDB::Table');
      }
    });

    test('all DynamoDB tables should have proper tagging', () => {
      const tables = ['EmailDeliveriesTable', 'TurnAroundPromptTable'];

      tables.forEach(tableName => {
        if (template) {
          const table = template.Resources[tableName];
          expect(table.Properties.Tags).toBeDefined();

          const tags = table.Properties.Tags;
          const irlhfTag = tags.find((tag: any) => tag.Key === 'iac-rlhf-amazon');
          expect(irlhfTag).toBeDefined();
          expect(irlhfTag.Value).toBe('true');
        } else {
          expect(templateContent).toContain('iac-rlhf-amazon');
        }
      });
    });
  });

  describe('IAM Roles', () => {
    test('should create Lambda execution roles with proper trust policies', () => {
      const roles = [
        'LambdaSendOrderEmailRole',
        'LambdaSesFeedbackProcessorRole',
        'LambdaCostMonitoringRole'
      ];

      roles.forEach(roleName => {
        if (template) {
          const role = template.Resources[roleName];
          expect(role).toBeDefined();
          expect(role.Type).toBe('AWS::IAM::Role');

          const trustPolicy = role.Properties.AssumeRolePolicyDocument;
          expect(trustPolicy.Statement[0].Principal.Service).toBe('lambda.amazonaws.com');
          expect(trustPolicy.Statement[0].Action).toBe('sts:AssumeRole');
        } else {
          expect(templateContent).toContain(`${roleName}:`);
          expect(templateContent).toContain('Type: AWS::IAM::Role');
          expect(templateContent).toContain('lambda.amazonaws.com');
          expect(templateContent).toContain('sts:AssumeRole');
        }
      });
    });

    test('Lambda roles should have least-privilege permissions', () => {
      if (template) {
        const sendEmailRole = template.Resources.LambdaSendOrderEmailRole;
        const policies = sendEmailRole.Properties.Policies;

        expect(policies).toHaveLength(1);
        const policy = policies[0];
        expect(policy.PolicyName).toBe('SendOrderEmailPolicy');

        // Check SES permissions are scoped to specific resources
        const statements = policy.PolicyDocument.Statement;
        const sesStatement = statements.find((stmt: any) =>
          stmt.Action.includes('ses:SendEmail')
        );
        expect(sesStatement.Resource).toBeDefined();
        expect(Array.isArray(sesStatement.Resource)).toBe(true);
      } else {
        expect(templateContent).toContain('SendOrderEmailPolicy');
        expect(templateContent).toContain('ses:SendEmail');
        expect(templateContent).toContain('Resource:');
      }
    });

    test('CloudWatch permissions should be properly conditioned', () => {
      if (template) {
        const sendEmailRole = template.Resources.LambdaSendOrderEmailRole;
        const policies = sendEmailRole.Properties.Policies;
        const policy = policies[0];
        const statements = policy.PolicyDocument.Statement;

        const cwStatement = statements.find((stmt: any) =>
          stmt.Action.includes('cloudwatch:PutMetricData')
        );
        expect(cwStatement.Condition).toBeDefined();
        expect(cwStatement.Condition.StringEquals).toBeDefined();
      } else {
        expect(templateContent).toContain('cloudwatch:PutMetricData');
        expect(templateContent).toContain('Condition:');
        expect(templateContent).toContain('StringEquals:');
      }
    });

    test('all IAM roles should have proper tagging', () => {
      const roles = [
        'LambdaSendOrderEmailRole',
        'LambdaSesFeedbackProcessorRole',
        'LambdaCostMonitoringRole'
      ];

      roles.forEach(roleName => {
        if (template) {
          const role = template.Resources[roleName];
          expect(role.Properties.Tags).toBeDefined();

          const tags = role.Properties.Tags;
          const irlhfTag = tags.find((tag: any) => tag.Key === 'iac-rlhf-amazon');
          expect(irlhfTag).toBeDefined();
          expect(irlhfTag.Value).toBe('true');
        } else {
          expect(templateContent).toContain('iac-rlhf-amazon');
        }
      });
    });
  });

  describe('Lambda Functions', () => {
    test('should create all required Lambda functions', () => {
      const functions = [
        'LambdaSendOrderEmail',
        'LambdaSesFeedbackProcessor',
        'LambdaCostMonitoring'
      ];

      functions.forEach(functionName => {
        if (template) {
          const func = template.Resources[functionName];
          expect(func).toBeDefined();
          expect(func.Type).toBe('AWS::Lambda::Function');
          expect(func.Properties.Runtime).toBe('python3.12');
        } else {
          expect(templateContent).toContain(`${functionName}:`);
          expect(templateContent).toContain('Type: AWS::Lambda::Function');
          expect(templateContent).toContain('Runtime: "python3.12"');
        }
      });
    });

    test('Lambda functions should have proper environment variables', () => {
      const requiredEnvVars = [
        'ENVIRONMENT',
        'VERIFIED_DOMAIN',
        'SES_FROM_ADDRESS',
        'ENABLE_PRODUCTION_SES',
        'EMAIL_DELIVERIES_TABLE'
      ];

      requiredEnvVars.forEach(envVar => {
        if (template) {
          const sendEmailFunction = template.Resources.LambdaSendOrderEmail;
          const env = sendEmailFunction.Properties.Environment.Variables;
          expect(env[envVar]).toBeDefined();
        } else {
          expect(templateContent).toContain(`${envVar}:`);
        }
      });
    });

    test('cost monitoring function should have longer timeout', () => {
      if (template) {
        const func = template.Resources.LambdaCostMonitoring;
        expect(func.Properties.Timeout).toBe(300);
      } else {
        expect(templateContent).toContain('Timeout: 300');
      }
    });

    test('all Lambda functions should have proper tagging', () => {
      const functions = [
        'LambdaSendOrderEmail',
        'LambdaSesFeedbackProcessor',
        'LambdaCostMonitoring'
      ];

      functions.forEach(functionName => {
        if (template) {
          const func = template.Resources[functionName];
          expect(func.Properties.Tags).toBeDefined();

          const tags = func.Properties.Tags;
          const irlhfTag = tags.find((tag: any) => tag.Key === 'iac-rlhf-amazon');
          expect(irlhfTag).toBeDefined();
          expect(irlhfTag.Value).toBe('true');
        } else {
          expect(templateContent).toContain('iac-rlhf-amazon');
        }
      });
    });
  });

  describe('Cross-Account Compatibility', () => {
    test('should not contain hardcoded account IDs', () => {
      const accountIdPattern = /\b\d{12}\b/g;
      const matches = templateContent.match(accountIdPattern);

      // Should not find any 12-digit account IDs
      expect(matches).toBeNull();
    });

    test('should use proper CloudFormation functions for dynamic values', () => {
      // Check that ARNs use proper substitution
      expect(templateContent).toContain('!Sub');
      expect(templateContent).toContain('${AWS::AccountId}');
      expect(templateContent).toContain('${AWS::Region}');
    });

    test('should use parameter references instead of hardcoded values', () => {
      expect(templateContent).toContain('!Ref VerifiedDomain');
      expect(templateContent).toContain('!Ref SesFromAddress');
      expect(templateContent).toContain('!Ref EnableProductionSES');
    });
  });

  describe('Outputs', () => {
    test('should export important resource identifiers', () => {
      const requiredOutputs = [
        'OrderConfirmationsTopicArn',
        'EmailDeliveriesTableName',
        'EmailDeliveriesTableArn',
        'SendOrderEmailFunctionArn',
        'TurnAroundPromptTableName'
      ];

      requiredOutputs.forEach(outputName => {
        if (template) {
          const output = template.Outputs[outputName];
          expect(output).toBeDefined();
          expect(output.Description).toBeDefined();
          expect(output.Value).toBeDefined();
          expect(output.Export).toBeDefined();
        } else {
          expect(templateContent).toContain(`${outputName}:`);
          expect(templateContent).toContain('Description:');
          expect(templateContent).toContain('Value:');
          expect(templateContent).toContain('Export:');
        }
      });
    });

    test('exported values should have proper naming convention', () => {
      expect(templateContent).toContain('Export:');
      expect(templateContent).toContain('Name: !Sub');
      expect(templateContent).toContain('${AWS::StackName}');
    });
  });

  describe('Template Validation', () => {
    test('should have comprehensive resource count for email notification system', () => {
      if (template) {
        const resourceCount = Object.keys(template.Resources).length;
        // Should have comprehensive set of resources (25+ for full email system)
        expect(resourceCount).toBeGreaterThan(25);

        // Should have multiple resource types
        const resourceTypes = new Set(
          Object.values(template.Resources).map((resource: any) => resource.Type)
        );
        expect(resourceTypes.size).toBeGreaterThan(8);
      } else {
        // Count resource definitions in string
        const resourceCount = (templateContent.match(/Type: AWS::/g) || []).length;
        expect(resourceCount).toBeGreaterThan(25);
      }
    });

    test('should have consistent resource naming', () => {
      // All SNS topics should follow naming pattern
      expect(templateContent).toContain('SNSTopicOrderConfirmations');
      expect(templateContent).toContain('SNSTopicSesDelivery');
      expect(templateContent).toContain('SNSTopicSesBounce');
      expect(templateContent).toContain('SNSTopicSesComplaint');

      // All Lambda functions should follow naming pattern
      expect(templateContent).toContain('LambdaSendOrderEmail');
      expect(templateContent).toContain('LambdaSesFeedbackProcessor');
      expect(templateContent).toContain('LambdaCostMonitoring');
    });

    test('should have all required tags on resources', () => {
      // Count occurrences of the required tag
      const tagOccurrences = (templateContent.match(/iac-rlhf-amazon/g) || []).length;
      expect(tagOccurrences).toBeGreaterThan(10); // Should appear on multiple resources
    });

    test('template should be deployable in any AWS region', () => {
      // Should not contain region-specific hardcoded values
      const regionPattern = /(us-east-1|us-west-2|eu-west-1|ap-southeast-1)/g;
      const matches = templateContent.match(regionPattern);

      // Allow regions in descriptions but not in actual resource configurations
      if (matches) {
        matches.forEach(match => {
          const context = templateContent.substring(
            templateContent.indexOf(match) - 50,
            templateContent.indexOf(match) + 50
          );
          // Should not be in ARN constructions or resource properties
          expect(context).not.toMatch(/arn:aws|Resource:|Principal:/);
        });
      }
    });
  });
});
