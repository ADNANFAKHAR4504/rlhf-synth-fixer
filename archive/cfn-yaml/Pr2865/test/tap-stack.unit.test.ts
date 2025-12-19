import fs from 'fs';
import path from 'path';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('TapStack CloudFormation Template', () => {
  let template: any;

  beforeAll(() => {
    // If youre testing a yaml template. run `pipenv run cfn-flip-to-json > lib/TapStack.json`
    // Otherwise, ensure the template is in JSON format.
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
      // Accept any non-empty string for description
      expect(typeof template.Description).toBe('string');
      expect(template.Description.length).toBeGreaterThan(0);
    });
    test('should not require metadata section', () => {
      // Metadata is optional in TapStack.yml
      expect(template.Metadata).toBeUndefined();
    });
  });

  describe('Parameters', () => {
    const expectedParameters = [
      'Environment',
      'CostCenter',
      'ProjectName',
      'DestinationBucketName',
      'VpcId',
      'RouteTableIds',
      'NotificationEmail',
    ];
    test('should have all required parameters', () => {
      expectedParameters.forEach(param => {
        expect(template.Parameters[param]).toBeDefined();
      });
    });
  });

  describe('Resources', () => {
    const expectedResources = [
      'SourceBucket',
      'ReplicationRole',
      'ReplicationLogGroup',
      'ReplicationNotificationTopic',
      'ReplicationLatencyAlarm',
      'SecurityAlarm',
      'ReplicationSuccessAlarm',
      'ReplicationMetadataTable',
      'S3VpcEndpoint',
    ];
    test('should have all required resources', () => {
      expectedResources.forEach(resource => {
        expect(template.Resources[resource]).toBeDefined();
      });
    });
  });

  describe('Outputs', () => {
    const expectedOutputs = [
      'SourceBucketName',
      'SourceBucketArn',
      'ReplicationRoleArn',
      'SNSTopicArn',
      'DynamoDBTableName',
    ];
    test('should have all required outputs', () => {
      expectedOutputs.forEach(output => {
        expect(template.Outputs[output]).toBeDefined();
      });
    });
    test('export names should follow naming convention', () => {
      Object.keys(template.Outputs).forEach(outputKey => {
        const output = template.Outputs[outputKey];
        // Accept export name as ${AWS::StackName}-<OutputName> or ${AWS::StackName}-<custom>
        expect(output.Export.Name['Fn::Sub']).toMatch(/\${AWS::StackName}-[\w-]+/);
      });
    });
  });

  describe('Resource Properties', () => {
    test('SourceBucket should have versioning enabled', () => {
      expect(template.Resources.SourceBucket.Properties.VersioningConfiguration.Status).toBe('Enabled');
    });
    test('SourceBucket should have KMS encryption', () => {
      const enc = template.Resources.SourceBucket.Properties.BucketEncryption.ServerSideEncryptionConfiguration[0].ServerSideEncryptionByDefault;
      expect(enc.SSEAlgorithm).toBe('aws:kms');
      expect(enc.KMSMasterKeyID).toBe('alias/aws/s3');
    });
    test('ReplicationRole should have correct AssumeRolePolicyDocument', () => {
      const assumeRole = template.Resources.ReplicationRole.Properties.AssumeRolePolicyDocument.Statement[0];
      expect(assumeRole.Principal.Service).toBe('s3.amazonaws.com');
      expect(assumeRole.Action).toBe('sts:AssumeRole');
    });
    test('ReplicationMetadataTable should be DynamoDB table with correct properties', () => {
      const table = template.Resources.ReplicationMetadataTable;
      expect(table.Type).toBe('AWS::DynamoDB::Table');
      expect(table.Properties.BillingMode).toBe('PAY_PER_REQUEST');
      expect(table.Properties.PointInTimeRecoverySpecification.PointInTimeRecoveryEnabled).toBe(true);
      expect(table.Properties.SSESpecification.SSEEnabled).toBe(true);
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
    test('should have at least one resource', () => {
      const resourceCount = Object.keys(template.Resources).length;
      expect(resourceCount).toBeGreaterThanOrEqual(1);
    });
    test('should have at least one parameter', () => {
      const parameterCount = Object.keys(template.Parameters).length;
      expect(parameterCount).toBeGreaterThanOrEqual(1);
    });
    test('should have at least one output', () => {
      const outputCount = Object.keys(template.Outputs).length;
      expect(outputCount).toBeGreaterThanOrEqual(1);
    });
  });
});
