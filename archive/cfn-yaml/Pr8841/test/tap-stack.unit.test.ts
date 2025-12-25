import fs from 'fs';
import path from 'path';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('TapStack CloudFormation Template', () => {
  let template: any;

  beforeAll(() => {
    const templatePath = path.join(__dirname, '../lib/TapStack.json');
    const templateContent = fs.readFileSync(templatePath, 'utf8');
    template = JSON.parse(templateContent);
  });

  describe('Parameters', () => {
    test('should have EnvironmentSuffix, TeamName, and Owner parameters', () => {
      expect(template.Parameters.EnvironmentSuffix).toBeDefined();
      expect(template.Parameters.TeamName).toBeDefined();
      expect(template.Parameters.Owner).toBeDefined();
    });
  });

  describe('Resources', () => {
    test('should have SecurityKMSKey resource', () => {
      expect(template.Resources.SecurityKMSKey).toBeDefined();
      expect(template.Resources.SecurityKMSKey.Type).toBe('AWS::KMS::Key');
    });

    test('should have SecurityKMSKeyAlias resource', () => {
      expect(template.Resources.SecurityKMSKeyAlias).toBeDefined();
      expect(template.Resources.SecurityKMSKeyAlias.Type).toBe('AWS::KMS::Alias');
    });

    test('should have SecureS3Bucket, ALBLogsBucket, and CloudTrailLogsBucket resources', () => {
      expect(template.Resources.SecureS3Bucket).toBeDefined();
      expect(template.Resources.ALBLogsBucket).toBeDefined();
      expect(template.Resources.CloudTrailLogsBucket).toBeDefined();
    });

    test('should have CloudTrailLogsBucketPolicy resource', () => {
      expect(template.Resources.CloudTrailLogsBucketPolicy).toBeDefined();
      expect(template.Resources.CloudTrailLogsBucketPolicy.Type).toBe('AWS::S3::BucketPolicy');
    });

    test('should have TurnAroundPromptTable DynamoDB resource', () => {
      expect(template.Resources.TurnAroundPromptTable).toBeDefined();
      expect(template.Resources.TurnAroundPromptTable.Type).toBe('AWS::DynamoDB::Table');
    });

    test('should have LambdaExecutionRole and SecureLambdaFunction resources', () => {
      expect(template.Resources.LambdaExecutionRole).toBeDefined();
      expect(template.Resources.LambdaExecutionRole.Type).toBe('AWS::IAM::Role');
      expect(template.Resources.SecureLambdaFunction).toBeDefined();
      expect(template.Resources.SecureLambdaFunction.Type).toBe('AWS::Lambda::Function');
    });

    test('should have GuardDuty resource', () => {
      expect(template.Resources.GuardDuty).toBeDefined();
      expect(template.Resources.GuardDuty.Type).toBe('AWS::GuardDuty::Detector');
    });
  });

  describe('CloudTrail and S3 Integration', () => {
    test('CloudTrailLogsBucketPolicy should allow CloudTrail to write logs with KMS encryption', () => {
      const policy = template.Resources.CloudTrailLogsBucketPolicy.Properties.PolicyDocument;
      const writeStatement = policy.Statement.find(
        (s: any) => s.Sid === 'AWSCloudTrailWrite'
      );
      expect(writeStatement).toBeDefined();
      expect(writeStatement.Principal.Service).toBe('cloudtrail.amazonaws.com');
      expect(writeStatement.Action).toBe('s3:PutObject');
      expect(writeStatement.Condition.StringEquals['s3:x-amz-server-side-encryption']).toBe('aws:kms');
    });

    test('CloudTrailLogsBucket should use KMS encryption', () => {
      const bucket = template.Resources.CloudTrailLogsBucket;
      const enc = bucket.Properties.BucketEncryption.ServerSideEncryptionConfiguration[0];
      expect(enc.ServerSideEncryptionByDefault.SSEAlgorithm).toBe('aws:kms');
      expect(enc.ServerSideEncryptionByDefault.KMSMasterKeyID).toBeDefined();
    });
  });

  describe('DynamoDB Table', () => {
    test('TurnAroundPromptTable should have point-in-time recovery enabled', () => {
      const table = template.Resources.TurnAroundPromptTable;
      expect(table.Properties.PointInTimeRecoverySpecification.PointInTimeRecoveryEnabled).toBe(true);
    });

    test('TurnAroundPromptTable should have server-side encryption enabled', () => {
      const table = template.Resources.TurnAroundPromptTable;
      expect(table.Properties.SSESpecification.SSEEnabled).toBe(true);
    });
  });

  describe('Lambda Function', () => {
    test('SecureLambdaFunction should use KMS key for environment variables', () => {
      const lambda = template.Resources.SecureLambdaFunction;
      expect(lambda.Properties.KmsKeyArn).toBeDefined();
    });

    test('SecureLambdaFunction should reference LambdaExecutionRole', () => {
      const lambda = template.Resources.SecureLambdaFunction;
      expect(lambda.Properties.Role).toBeDefined();
    });
  });

  describe('Outputs', () => {
    const expectedOutputs = [
      'TurnAroundPromptTableName',
      'TurnAroundPromptTableArn',
      'SecurityKMSKeyId',
      'SecurityKMSKeyArn',
      'SecureS3BucketName',
      'ALBLogsBucketName',
      'CloudTrailLogsBucketName',
      'LambdaFunctionArn',
      'GuardDutyDetectorId',
      'StackName',
      'EnvironmentSuffix',
    ];

    test('should have all required outputs', () => {
      expectedOutputs.forEach(outputName => {
        expect(template.Outputs[outputName]).toBeDefined();
      });
    });

  });

  describe('Tagging', () => {
    test('all resources should have Owner and Environment tags', () => {
      Object.values(template.Resources).forEach((resource: any) => {
        if (resource.Properties && resource.Properties.Tags) {
          const tags = resource.Properties.Tags;
          const ownerTag = tags.find((t: any) => t.Key === 'Owner');
          const envTag = tags.find((t: any) => t.Key === 'Environment');

          expect(ownerTag).toBeDefined();
          expect(envTag).toBeDefined();
        }
      });
    });
  });
});
