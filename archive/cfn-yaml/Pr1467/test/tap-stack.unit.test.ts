import fs from 'fs';
import path from 'path';

describe('Security CloudFormation Template', () => {
  let template: any;

  beforeAll(() => {
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
      expect(template.Description).toContain('Security-focused AWS infrastructure');
    });

    test('should have Parameters, Resources, and Outputs sections', () => {
      expect(template.Parameters).toBeDefined();
      expect(template.Resources).toBeDefined();
      expect(template.Outputs).toBeDefined();
    });
  });

  describe('Parameters', () => {
    test('should have Environment parameter', () => {
      expect(template.Parameters.Environment).toBeDefined();
      expect(template.Parameters.Environment.Type).toBe('String');
      expect(template.Parameters.Environment.AllowedValues).toContain('dev');
      expect(template.Parameters.Environment.AllowedValues).toContain('staging');
      expect(template.Parameters.Environment.AllowedValues).toContain('prod');
    });

    test('should have Project parameter', () => {
      expect(template.Parameters.Project).toBeDefined();
      expect(template.Parameters.Project.Type).toBe('String');
    });
  });

  describe('Resources', () => {
    test('should have KMS key', () => {
      expect(template.Resources.SecurityKMSKey).toBeDefined();
      expect(template.Resources.SecurityKMSKey.Type).toBe('AWS::KMS::Key');
    });

    test('should have KMS alias', () => {
      expect(template.Resources.SecurityKMSKeyAlias).toBeDefined();
      expect(template.Resources.SecurityKMSKeyAlias.Type).toBe('AWS::KMS::Alias');
    });

    test('should have VPC', () => {
      const vpc = template.Resources.SecurityVPC;
      expect(vpc).toBeDefined();
      expect(vpc.Type).toBe('AWS::EC2::VPC');
      expect(vpc.Properties.CidrBlock).toBe('10.0.0.0/16');
    });

    test('should have S3 buckets with encryption', () => {
      ['SecureDataBucket', 'CloudTrailBucket', 'LoggingBucket'].forEach(bucketName => {
        const bucket = template.Resources[bucketName];
        expect(bucket).toBeDefined();
        expect(bucket.Type).toBe('AWS::S3::Bucket');
        expect(bucket.Properties.BucketEncryption).toBeDefined();
      });
    });

    test('should have RDS instance with encryption', () => {
      const db = template.Resources.DatabaseInstance;
      expect(db).toBeDefined();
      expect(db.Type).toBe('AWS::RDS::DBInstance');
      expect(db.Properties.StorageEncrypted).toBe(true);
    });

    test('should have Lambda function with VPC config', () => {
      const fn = template.Resources.SecureLambdaFunction;
      expect(fn).toBeDefined();
      expect(fn.Type).toBe('AWS::Lambda::Function');
      expect(fn.Properties.VpcConfig).toBeDefined();
    });

    test('should have IAM roles', () => {
      expect(template.Resources.LambdaExecutionRole).toBeDefined();
      expect(template.Resources.RDSEnhancedMonitoringRole).toBeDefined();
      expect(template.Resources.VPCFlowLogsRole).toBeDefined();
    });

    test('should have VPC Flow Logs', () => {
      const flow = template.Resources.VPCFlowLogs;
      expect(flow).toBeDefined();
      expect(flow.Type).toBe('AWS::EC2::FlowLog');
    });

    test('should have Security Groups', () => {
      ['DatabaseSecurityGroup', 'LambdaSecurityGroup', 'RestrictedSecurityGroup'].forEach(sg => {
        expect(template.Resources[sg]).toBeDefined();
        expect(template.Resources[sg].Type).toBe('AWS::EC2::SecurityGroup');
      });
    });
  });

  describe('Outputs', () => {
    const expectedOutputs = [
      'KMSKeyId',
      'SecureDataBucketName',
      'DatabaseEndpoint',
      'LambdaFunctionArn',
      'VPCId'
    ];

    expectedOutputs.forEach(out => {
      test(`should have ${out} output`, () => {
        const output = template.Outputs[out];
        expect(output).toBeDefined();
        expect(output.Export).toBeDefined();
        expect(output.Export.Name).toHaveProperty('Fn::Sub');
        expect(typeof output.Export.Name['Fn::Sub']).toBe('string');
      });
    });
  });

  describe('Template Validation', () => {
    test('should be valid JSON', () => {
      expect(typeof template).toBe('object');
    });

    test('required sections should not be null', () => {
      expect(template.Parameters).not.toBeNull();
      expect(template.Resources).not.toBeNull();
      expect(template.Outputs).not.toBeNull();
    });
  });
});
