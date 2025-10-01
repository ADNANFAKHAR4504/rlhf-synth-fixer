import fs from 'fs';
import path from 'path';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('TapStack Integration Tests', () => {
  let template: any;

  beforeAll(() => {
    const templatePath = path.join(__dirname, '../lib/TapStack.json');
    const templateContent = fs.readFileSync(templatePath, 'utf8');
    template = JSON.parse(templateContent);
  });

  describe('Deployment Readiness', () => {
    test('template should have all required sections', () => {
      expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
      expect(template.Resources).toBeDefined();
      expect(template.Parameters).toBeDefined();
      expect(template.Outputs).toBeDefined();
    });

    test('all resources should have valid AWS types', () => {
      const validTypes = [
        'AWS::DynamoDB::Table',
        'AWS::KMS::Key',
        'AWS::KMS::Alias',
        'AWS::SNS::Topic',
        'AWS::CloudWatch::Alarm',
        'AWS::CloudWatch::Dashboard'
      ];

      Object.keys(template.Resources).forEach(resourceName => {
        const resource = template.Resources[resourceName];
        expect(validTypes).toContain(resource.Type);
      });
    });
  });

  describe('Resource Dependencies', () => {
    test('DynamoDB table should reference KMS key', () => {
      const table = template.Resources.TurnAroundPromptTable;
      expect(table.Properties.SSESpecification.KMSMasterKeyId).toEqual({ Ref: 'KMSKey' });
    });

    test('CloudWatch alarms should reference SNS topic', () => {
      const alarms = Object.keys(template.Resources).filter(
        key => template.Resources[key].Type === 'AWS::CloudWatch::Alarm'
      );

      alarms.forEach(alarmName => {
        const alarm = template.Resources[alarmName];
        expect(alarm.Properties.AlarmActions[0]).toEqual({ Ref: 'SNSTopic' });
      });
    });
  });

  describe('Security Configuration', () => {
    test('DynamoDB should have KMS encryption enabled', () => {
      const table = template.Resources.TurnAroundPromptTable;
      expect(table.Properties.SSESpecification.SSEEnabled).toBe(true);
      expect(table.Properties.SSESpecification.SSEType).toBe('KMS');
    });

    test('SNS topic should have encryption', () => {
      const topic = template.Resources.SNSTopic;
      expect(topic.Properties.KmsMasterKeyId).toBeDefined();
    });

    test('all major resources should have proper tags', () => {
      const resources = ['KMSKey', 'TurnAroundPromptTable', 'SNSTopic'];

      resources.forEach(resourceName => {
        const resource = template.Resources[resourceName];
        const tags = resource.Properties.Tags;
        expect(tags).toBeDefined();
        expect(tags.some((t: any) => t.Key === 'Environment')).toBe(true);
      });
    });
  });

  describe('Monitoring Configuration', () => {
    test('should have multiple CloudWatch alarms', () => {
      const alarms = Object.keys(template.Resources).filter(
        key => template.Resources[key].Type === 'AWS::CloudWatch::Alarm'
      );
      expect(alarms.length).toBeGreaterThanOrEqual(4);
    });

    test('alarms should monitor DynamoDB metrics', () => {
      const alarms = Object.keys(template.Resources).filter(
        key => template.Resources[key].Type === 'AWS::CloudWatch::Alarm'
      );

      const metrics = alarms.map(
        alarmName => template.Resources[alarmName].Properties.MetricName
      );

      expect(metrics).toContain('UserErrors');
      expect(metrics).toContain('SystemErrors');
    });

    test('should have CloudWatch dashboard', () => {
      expect(template.Resources.CloudWatchDashboard).toBeDefined();
      expect(template.Resources.CloudWatchDashboard.Type).toBe('AWS::CloudWatch::Dashboard');
    });
  });

  describe('Best Practices', () => {
    test('DynamoDB should use on-demand billing', () => {
      const table = template.Resources.TurnAroundPromptTable;
      expect(table.Properties.BillingMode).toBe('PAY_PER_REQUEST');
    });

    test('DynamoDB should have streams enabled', () => {
      const table = template.Resources.TurnAroundPromptTable;
      expect(table.Properties.StreamSpecification.StreamViewType).toBe('NEW_AND_OLD_IMAGES');
    });

    test('template should use parameterized values', () => {
      const templateString = JSON.stringify(template);
      expect(templateString).toContain('${EnvironmentSuffix}');
      expect(templateString).toContain('${ProjectName}');
    });

    test('resources should be deletable', () => {
      const table = template.Resources.TurnAroundPromptTable;
      expect(table.DeletionPolicy).toBe('Delete');
    });
  });
});
