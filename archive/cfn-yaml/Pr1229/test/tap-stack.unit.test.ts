import fs from 'fs';
import path from 'path';

describe('TapStack CloudFormation Template', () => {
  let template: any;

  beforeAll(() => {
    // Convert YAML to JSON before running these tests (use cfn-flip or similar)
    const templatePath = path.join(__dirname, '../lib/TapStack.json');
    const templateContent = fs.readFileSync(templatePath, 'utf8');
    template = JSON.parse(templateContent);
  });

  test('should have valid CloudFormation format version', () => {
    expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
  });

  test('should have a description', () => {
    expect(template.Description).toBeDefined();
    expect(template.Description).toMatch(/secure event-driven data processing pipeline/i);
  });

  test('should not have any parameters (self-contained)', () => {
    expect(template.Parameters).toBeUndefined();
  });

  describe('Resources', () => {
    test('should have all required resources', () => {
      const expectedResources = [
        'ApplicationDataBucketKMSKey',
        'ApplicationDataBucketKMSKeyAlias',
        'ApplicationDataBucket',
        'ProcessedResultsDB',
        'ApplicationSecret',
        'LambdaExecutionRole',
        'MFAEnforcementPolicy',
        'LambdaLogGroup',
        'S3DataProcessor',
        'LambdaInvokePermission',
      ];
      expectedResources.forEach(res => {
        expect(template.Resources[res]).toBeDefined();
      });
    });

    test('S3 bucket should have KMS encryption and public access blocked', () => {
      const bucket = template.Resources.ApplicationDataBucket;
      expect(bucket.Type).toBe('AWS::S3::Bucket');
      const enc = bucket.Properties.BucketEncryption.ServerSideEncryptionConfiguration[0].ServerSideEncryptionByDefault;
      expect(enc.SSEAlgorithm).toBe('aws:kms');
      expect(bucket.Properties.PublicAccessBlockConfiguration.BlockPublicAcls).toBe(true);
      expect(bucket.Properties.PublicAccessBlockConfiguration.BlockPublicPolicy).toBe(true);
      expect(bucket.Properties.PublicAccessBlockConfiguration.IgnorePublicAcls).toBe(true);
      expect(bucket.Properties.PublicAccessBlockConfiguration.RestrictPublicBuckets).toBe(true);
    });

    test('DynamoDB table should have correct schema and billing mode', () => {
      const table = template.Resources.ProcessedResultsDB;
      expect(table.Type).toBe('AWS::DynamoDB::Table');
      expect(table.Properties.BillingMode).toMatch(/PAY_PER_REQUEST|ON_DEMAND/);
      expect(table.Properties.AttributeDefinitions[0].AttributeName).toBe('recordId');
      expect(table.Properties.KeySchema[0].AttributeName).toBe('recordId');
      expect(table.Properties.KeySchema[0].KeyType).toBe('HASH');
    });

    test('Lambda function should have correct runtime, handler, and environment', () => {
      const lambda = template.Resources.S3DataProcessor;
      expect(lambda.Type).toBe('AWS::Lambda::Function');
      expect(lambda.Properties.Runtime).toMatch(/python3/);
      expect(lambda.Properties.Handler).toBe('index.lambda_handler');
      expect(lambda.Properties.Environment.Variables.DYNAMODB_TABLE).toBeDefined();
      expect(lambda.Properties.Environment.Variables.SECRET_NAME).toBeDefined();
    });

    test('Lambda execution role should have least privilege policies', () => {
      const role = template.Resources.LambdaExecutionRole;
      expect(role.Type).toBe('AWS::IAM::Role');
      const policyDoc = role.Properties.Policies[0].PolicyDocument;
      const actions = policyDoc.Statement.flatMap((s: any) => s.Action);
      expect(actions).toContain('s3:GetObject');
      expect(actions).toContain('dynamodb:PutItem');
      expect(actions).toContain('logs:CreateLogGroup');
      expect(actions).toContain('logs:CreateLogStream');
      expect(actions).toContain('logs:PutLogEvents');
      expect(actions).toContain('secretsmanager:GetSecretValue');
      expect(actions).toContain('kms:Decrypt');
    });

    test('All resources should be tagged with Environment: Production', () => {
      Object.values(template.Resources).forEach((res: any) => {
        if (res.Properties && res.Properties.Tags) {
          const envTag = res.Properties.Tags.find((t: any) => t.Key === 'Environment');
          expect(envTag).toBeDefined();
          expect(envTag.Value).toBe('Production');
        }
      });
    });
  });

  describe('Outputs', () => {
    test('should have all required outputs', () => {
      const expectedOutputs = [
        'S3BucketName',
        'DynamoDBTableName',
        'LambdaFunctionName',
        'SecretName',
        'KMSKeyId',
        'MFAEnforcementPolicyArn',
      ];
      expectedOutputs.forEach(output => {
        expect(template.Outputs[output]).toBeDefined();
      });
    });
    test('outputs should reference correct resources', () => {
      expect(template.Outputs.S3BucketName.Value).toBeDefined();
      expect(template.Outputs.DynamoDBTableName.Value).toBeDefined();
      expect(template.Outputs.LambdaFunctionName.Value).toBeDefined();
      expect(template.Outputs.SecretName.Value).toBeDefined();
      expect(template.Outputs.KMSKeyId.Value).toBeDefined();
      expect(template.Outputs.MFAEnforcementPolicyArn.Value).toBeDefined();
    });
  });
});
