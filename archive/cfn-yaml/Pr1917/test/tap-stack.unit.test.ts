import fs from 'fs';
import path from 'path';

describe('TapStack CloudFormation Template', () => {
  let template: any;

  beforeAll(() => {
    // Read the JSON template
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
      expect(template.Description).toContain('Security Configuration as Code');
    });

    test('should have metadata section', () => {
      expect(template.Metadata).toBeDefined();
      expect(template.Metadata['AWS::CloudFormation::Interface']).toBeDefined();
    });

    test('should have parameter groups', () => {
      const paramGroups = template.Metadata['AWS::CloudFormation::Interface'].ParameterGroups;
      expect(paramGroups).toHaveLength(2);
      expect(paramGroups[0].Label.default).toBe('Environment Configuration');
      expect(paramGroups[1].Label.default).toBe('Security Configuration');
    });
  });

  describe('Parameters', () => {
    test('should have EnvironmentSuffix parameter', () => {
      expect(template.Parameters.EnvironmentSuffix).toBeDefined();
      expect(template.Parameters.EnvironmentSuffix.Type).toBe('String');
      expect(template.Parameters.EnvironmentSuffix.Default).toBe('dev');
    });

    test('should have NotificationEmail parameter', () => {
      expect(template.Parameters.NotificationEmail).toBeDefined();
      expect(template.Parameters.NotificationEmail.Type).toBe('String');
      expect(template.Parameters.NotificationEmail.Default).toBe('security@example.com');
      expect(template.Parameters.NotificationEmail.AllowedPattern).toBeDefined();
    });

    test('should have EnableMacie parameter', () => {
      expect(template.Parameters.EnableMacie).toBeDefined();
      expect(template.Parameters.EnableMacie.Type).toBe('String');
      expect(template.Parameters.EnableMacie.Default).toBe('false');
      expect(template.Parameters.EnableMacie.AllowedValues).toEqual(['true', 'false']);
    });

    test('parameters should have proper validation', () => {
      const envSuffix = template.Parameters.EnvironmentSuffix;
      expect(envSuffix.AllowedPattern).toBe('^[a-zA-Z0-9]+$');
      expect(envSuffix.ConstraintDescription).toBe('Must contain only alphanumeric characters');

      const email = template.Parameters.NotificationEmail;
      expect(email.AllowedPattern).toBe('^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$');
      expect(email.ConstraintDescription).toBe('Must be a valid email address');
    });
  });

  describe('Conditions', () => {
    test('should have ShouldCreateMacie condition', () => {
      expect(template.Conditions.ShouldCreateMacie).toBeDefined();
      expect(template.Conditions.ShouldCreateMacie['Fn::And']).toBeDefined();
      
      const andConditions = template.Conditions.ShouldCreateMacie['Fn::And'];
      expect(andConditions).toHaveLength(2);
      
      // First condition: EnableMacie equals 'true'
      expect(andConditions[0]['Fn::Equals']).toBeDefined();
      expect(andConditions[0]['Fn::Equals'][0].Ref).toBe('EnableMacie');
      expect(andConditions[0]['Fn::Equals'][1]).toBe('true');
      
      // Second condition: NOT (region equals 'us-east-1')
      expect(andConditions[1]['Fn::Not']).toBeDefined();
      expect(andConditions[1]['Fn::Not'][0]['Fn::Equals']).toBeDefined();
      expect(andConditions[1]['Fn::Not'][0]['Fn::Equals'][0].Ref).toBe('AWS::Region');
      expect(andConditions[1]['Fn::Not'][0]['Fn::Equals'][1]).toBe('us-east-1');
    });
  });

  describe('Resources - Security Services', () => {
    test('should have KMS key for security services', () => {
      expect(template.Resources.SecurityServicesKMSKey).toBeDefined();
      expect(template.Resources.SecurityServicesKMSKey.Type).toBe('AWS::KMS::Key');
      
      const keyPolicy = template.Resources.SecurityServicesKMSKey.Properties.KeyPolicy;
      expect(keyPolicy).toBeDefined();
      expect(keyPolicy.Version).toBe('2012-10-17');
      expect(keyPolicy.Statement).toHaveLength(1);
    });

    test('should have KMS key alias', () => {
      expect(template.Resources.SecurityServicesKMSKeyAlias).toBeDefined();
      expect(template.Resources.SecurityServicesKMSKeyAlias.Type).toBe('AWS::KMS::Alias');
      expect(template.Resources.SecurityServicesKMSKeyAlias.Properties.TargetKeyId.Ref).toBe('SecurityServicesKMSKey');
    });

    test('should have SNS topic for notifications', () => {
      expect(template.Resources.SecurityNotificationsTopic).toBeDefined();
      expect(template.Resources.SecurityNotificationsTopic.Type).toBe('AWS::SNS::Topic');
      expect(template.Resources.SecurityNotificationsTopic.Properties.KmsMasterKeyId.Ref).toBe('SecurityServicesKMSKey');
    });

    test('should have SNS subscription', () => {
      expect(template.Resources.SecurityNotificationsSubscription).toBeDefined();
      expect(template.Resources.SecurityNotificationsSubscription.Type).toBe('AWS::SNS::Subscription');
      expect(template.Resources.SecurityNotificationsSubscription.Properties.Protocol).toBe('email');
      expect(template.Resources.SecurityNotificationsSubscription.Properties.TopicArn.Ref).toBe('SecurityNotificationsTopic');
    });

    test('should have Security Hub', () => {
      expect(template.Resources.SecurityHub).toBeDefined();
      expect(template.Resources.SecurityHub.Type).toBe('AWS::SecurityHub::Hub');
      expect(template.Resources.SecurityHub.Properties.EnableDefaultStandards).toBe(true);
      expect(template.Resources.SecurityHub.Properties.ControlFindingGenerator).toBe('SECURITY_CONTROL');
    });

    test('should have Macie session with condition', () => {
      expect(template.Resources.MacieSession).toBeDefined();
      expect(template.Resources.MacieSession.Type).toBe('AWS::Macie2::Session');
      expect(template.Resources.MacieSession.Condition).toBe('ShouldCreateMacie');
      expect(template.Resources.MacieSession.Properties.Status).toBe('ENABLED');
    });
  });

  describe('Resources - EventBridge Rules', () => {
    test('should have GuardDuty event rule', () => {
      expect(template.Resources.GuardDutyEventRule).toBeDefined();
      expect(template.Resources.GuardDutyEventRule.Type).toBe('AWS::Events::Rule');
      
      const eventPattern = template.Resources.GuardDutyEventRule.Properties.EventPattern;
      expect(eventPattern.source).toEqual(['aws.guardduty']);
      expect(eventPattern['detail-type']).toEqual(['GuardDuty Finding']);
      expect(eventPattern.detail.severity).toBeDefined();
      expect(eventPattern.detail.severity.length).toBeGreaterThan(0);
    });

    test('should have Security Hub event rule', () => {
      expect(template.Resources.SecurityHubEventRule).toBeDefined();
      expect(template.Resources.SecurityHubEventRule.Type).toBe('AWS::Events::Rule');
      
      const eventPattern = template.Resources.SecurityHubEventRule.Properties.EventPattern;
      expect(eventPattern.source).toEqual(['aws.securityhub']);
      expect(eventPattern['detail-type']).toEqual(['Security Hub Findings - Imported']);
      expect(eventPattern.detail.findings.Severity.Label).toEqual(['CRITICAL', 'HIGH']);
    });

    test('event rules should target SNS topic', () => {
      const guardDutyTargets = template.Resources.GuardDutyEventRule.Properties.Targets;
      expect(guardDutyTargets).toHaveLength(1);
      expect(guardDutyTargets[0].Arn.Ref).toBe('SecurityNotificationsTopic');

      const secHubTargets = template.Resources.SecurityHubEventRule.Properties.Targets;
      expect(secHubTargets).toHaveLength(1);
      expect(secHubTargets[0].Arn.Ref).toBe('SecurityNotificationsTopic');
    });
  });

  describe('Resources - DynamoDB Table', () => {
    test('should have TurnAroundPromptTable resource', () => {
      expect(template.Resources.TurnAroundPromptTable).toBeDefined();
      expect(template.Resources.TurnAroundPromptTable.Type).toBe('AWS::DynamoDB::Table');
    });

    test('table should have correct deletion policies', () => {
      const table = template.Resources.TurnAroundPromptTable;
      expect(table.DeletionPolicy).toBe('Delete');
      expect(table.UpdateReplacePolicy).toBe('Delete');
    });

    test('table should have correct properties', () => {
      const table = template.Resources.TurnAroundPromptTable;
      const properties = table.Properties;

      expect(properties.TableName).toEqual({
        'Fn::Sub': 'TurnAroundPromptTable${EnvironmentSuffix}',
      });
      expect(properties.BillingMode).toBe('PAY_PER_REQUEST');
      expect(properties.DeletionProtectionEnabled).toBe(false);
    });

    test('table should have encryption enabled', () => {
      const sseSpec = template.Resources.TurnAroundPromptTable.Properties.SSESpecification;
      expect(sseSpec.SSEEnabled).toBe(true);
      expect(sseSpec.SSEType).toBe('KMS');
      expect(sseSpec.KMSMasterKeyId.Ref).toBe('SecurityServicesKMSKey');
    });

    test('table should have point-in-time recovery enabled', () => {
      const pitr = template.Resources.TurnAroundPromptTable.Properties.PointInTimeRecoverySpecification;
      expect(pitr.PointInTimeRecoveryEnabled).toBe(true);
    });

    test('table should have correct key schema', () => {
      const table = template.Resources.TurnAroundPromptTable;
      const keySchema = table.Properties.KeySchema;

      expect(keySchema).toHaveLength(1);
      expect(keySchema[0].AttributeName).toBe('id');
      expect(keySchema[0].KeyType).toBe('HASH');
    });
  });

  describe('Outputs', () => {
    test('should have all required outputs', () => {
      const expectedOutputs = [
        'TurnAroundPromptTableName',
        'TurnAroundPromptTableArn',
        'StackName',
        'EnvironmentSuffix',
        'KMSKeyId',
        'SecurityHubArn',
        'SecurityNotificationsTopicArn',
        'MacieSessionArn',
        'GuardDutyInfo',
        'ConfigInfo',
        'CloudTrailInfo'
      ];

      expectedOutputs.forEach(outputName => {
        expect(template.Outputs[outputName]).toBeDefined();
      });
    });

    test('outputs should have descriptions', () => {
      Object.keys(template.Outputs).forEach(outputKey => {
        expect(template.Outputs[outputKey].Description).toBeDefined();
      });
    });

    test('outputs should have export names', () => {
      Object.keys(template.Outputs).forEach(outputKey => {
        expect(template.Outputs[outputKey].Export).toBeDefined();
        expect(template.Outputs[outputKey].Export.Name).toBeDefined();
      });
    });

    test('MacieSessionArn should use conditional', () => {
      const macieOutput = template.Outputs.MacieSessionArn;
      expect(macieOutput.Value['Fn::If']).toBeDefined();
      expect(macieOutput.Value['Fn::If'][0]).toBe('ShouldCreateMacie');
      expect(macieOutput.Value['Fn::If'][2]).toBe('Not Created (disabled or unsupported region)');
    });
  });

  describe('Resource Tagging', () => {
    test('all taggable resources should have tags', () => {
      const taggableResources = [
        'SecurityServicesKMSKey',
        'SecurityNotificationsTopic',
        'TurnAroundPromptTable'
      ];

      taggableResources.forEach(resourceName => {
        const resource = template.Resources[resourceName];
        expect(resource.Properties.Tags).toBeDefined();
        expect(resource.Properties.Tags.length).toBeGreaterThan(0);
        
        const hasNameTag = resource.Properties.Tags.some((tag: any) => tag.Key === 'Name');
        const hasEnvTag = resource.Properties.Tags.some((tag: any) => tag.Key === 'Environment');
        
        expect(hasNameTag).toBe(true);
        expect(hasEnvTag).toBe(true);
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
      expect(template.Description).not.toBeNull();
      expect(template.Parameters).not.toBeNull();
      expect(template.Resources).not.toBeNull();
      expect(template.Outputs).not.toBeNull();
    });

    test('should have reasonable number of resources', () => {
      const resourceCount = Object.keys(template.Resources).length;
      expect(resourceCount).toBeGreaterThan(5);
      expect(resourceCount).toBeLessThan(20);
    });

    test('should have appropriate number of parameters', () => {
      const parameterCount = Object.keys(template.Parameters).length;
      expect(parameterCount).toBe(3);
    });

    test('should have appropriate number of outputs', () => {
      const outputCount = Object.keys(template.Outputs).length;
      expect(outputCount).toBeGreaterThan(8);
    });
  });

  describe('Security Best Practices', () => {
    test('KMS key should have proper permissions', () => {
      const keyPolicy = template.Resources.SecurityServicesKMSKey.Properties.KeyPolicy;
      const rootStatement = keyPolicy.Statement[0];
      
      expect(rootStatement.Sid).toBe('Enable IAM User Permissions');
      expect(rootStatement.Effect).toBe('Allow');
      expect(rootStatement.Action).toBe('kms:*');
    });

    test('SNS topic should use KMS encryption', () => {
      const topic = template.Resources.SecurityNotificationsTopic;
      expect(topic.Properties.KmsMasterKeyId).toBeDefined();
      expect(topic.Properties.KmsMasterKeyId.Ref).toBe('SecurityServicesKMSKey');
    });

    test('DynamoDB table should have encryption at rest', () => {
      const table = template.Resources.TurnAroundPromptTable;
      expect(table.Properties.SSESpecification).toBeDefined();
      expect(table.Properties.SSESpecification.SSEEnabled).toBe(true);
    });

    test('resources should not have retention policies', () => {
      Object.keys(template.Resources).forEach(resourceName => {
        const resource = template.Resources[resourceName];
        if (resource.DeletionPolicy) {
          expect(resource.DeletionPolicy).not.toBe('Retain');
        }
      });
    });
  });

  describe('Resource Naming Convention', () => {
    test('resources should use environment suffix in names', () => {
      const namedResources = [
        { name: 'SecurityNotificationsTopic', property: 'TopicName' },
        { name: 'TurnAroundPromptTable', property: 'TableName' },
        { name: 'GuardDutyEventRule', property: 'Name' },
        { name: 'SecurityHubEventRule', property: 'Name' }
      ];

      namedResources.forEach(({ name, property }) => {
        const resource = template.Resources[name];
        if (resource && resource.Properties && resource.Properties[property]) {
          const nameValue = resource.Properties[property];
          if (nameValue['Fn::Sub']) {
            expect(nameValue['Fn::Sub']).toContain('${EnvironmentSuffix}');
          }
        }
      });
    });
  });
});