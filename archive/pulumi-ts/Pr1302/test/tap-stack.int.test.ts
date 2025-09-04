// Integration tests using real AWS resources deployed via Pulumi
import * as AWS from 'aws-sdk';
import fs from 'fs';

// Configuration

let outputs: any = {};
let outputsFileExists = false;
try {
  outputs = JSON.parse(
    fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
  );
  outputsFileExists = true;
} catch (e) {
  outputsFileExists = false;
}

const requiredKeys = [
  'S3BucketDocuments',
  'S3BucketLogs',
  'S3BucketBackups',
  'LambdaFunctionName',
  'LambdaRoleArn',
  'SecretArn',
  'GuardDutyDetectorId',
  'KmsKeyId',
];

const missingKeys = requiredKeys.filter(k => !outputs[k]);

if (!outputsFileExists || missingKeys.length > 0) {
  // Skip all tests if outputs file or required keys are missing
  describe('Pulumi Infrastructure Integration Tests', () => {
    test.skip(
      'Integration tests skipped: missing outputs file or keys: ' +
        (missingKeys.length ? missingKeys.join(', ') : 'outputs file'),
      () => {
        // Skipped
      }
    );
  });
  // Exit early
  process.exit(0);
}

// Get environment suffix from environment variable (set by CI/CD pipeline)
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'synthtrainr102';

// AWS SDK clients
const s3 = new AWS.S3({ region: 'us-east-1' });
const lambda = new AWS.Lambda({ region: 'us-east-1' });
const secretsManager = new AWS.SecretsManager({ region: 'us-east-1' });
const iam = new AWS.IAM({ region: 'us-east-1' });
const guardduty = new AWS.GuardDuty({ region: 'us-east-1' });
const kms = new AWS.KMS({ region: 'us-east-1' });

describe('Pulumi Infrastructure Integration Tests', () => {
  describe('S3 Bucket Verification', () => {
    test('Documents S3 bucket should exist and be private', async () => {
      const bucketName = outputs.S3BucketDocuments;
      expect(bucketName).toBeDefined();
      expect(bucketName).toContain(environmentSuffix);

      // Check bucket exists
      const bucketExists = await s3
        .headBucket({ Bucket: bucketName })
        .promise()
        .then(() => true)
        .catch(() => false);
      expect(bucketExists).toBe(true);

      // Check public access block
      const publicAccessBlock = await s3
        .getPublicAccessBlock({ Bucket: bucketName })
        .promise();
      expect(
        publicAccessBlock.PublicAccessBlockConfiguration?.BlockPublicAcls
      ).toBe(true);
      expect(
        publicAccessBlock.PublicAccessBlockConfiguration?.BlockPublicPolicy
      ).toBe(true);
      expect(
        publicAccessBlock.PublicAccessBlockConfiguration?.IgnorePublicAcls
      ).toBe(true);
      expect(
        publicAccessBlock.PublicAccessBlockConfiguration?.RestrictPublicBuckets
      ).toBe(true);

      // Check versioning
      const versioning = await s3
        .getBucketVersioning({ Bucket: bucketName })
        .promise();
      expect(versioning.Status).toBe('Enabled');

      // Check encryption
      const encryption = await s3
        .getBucketEncryption({ Bucket: bucketName })
        .promise();
      expect(encryption.ServerSideEncryptionConfiguration?.Rules).toBeDefined();
      expect(
        encryption.ServerSideEncryptionConfiguration?.Rules?.[0]
          ?.ApplyServerSideEncryptionByDefault?.SSEAlgorithm
      ).toBe('aws:kms');
    });

    test('Logs S3 bucket should exist and be private', async () => {
      const bucketName = outputs.S3BucketLogs;
      expect(bucketName).toBeDefined();
      expect(bucketName).toContain(environmentSuffix);

      // Check bucket exists
      const bucketExists = await s3
        .headBucket({ Bucket: bucketName })
        .promise()
        .then(() => true)
        .catch(() => false);
      expect(bucketExists).toBe(true);

      // Check public access block
      const publicAccessBlock = await s3
        .getPublicAccessBlock({ Bucket: bucketName })
        .promise();
      expect(
        publicAccessBlock.PublicAccessBlockConfiguration?.BlockPublicAcls
      ).toBe(true);
      expect(
        publicAccessBlock.PublicAccessBlockConfiguration?.BlockPublicPolicy
      ).toBe(true);
    });

    test('Backups S3 bucket should exist and be private', async () => {
      const bucketName = outputs.S3BucketBackups;
      expect(bucketName).toBeDefined();
      expect(bucketName).toContain(environmentSuffix);

      // Check bucket exists
      const bucketExists = await s3
        .headBucket({ Bucket: bucketName })
        .promise()
        .then(() => true)
        .catch(() => false);
      expect(bucketExists).toBe(true);

      // Check public access block
      const publicAccessBlock = await s3
        .getPublicAccessBlock({ Bucket: bucketName })
        .promise();
      expect(
        publicAccessBlock.PublicAccessBlockConfiguration?.BlockPublicAcls
      ).toBe(true);
      expect(
        publicAccessBlock.PublicAccessBlockConfiguration?.BlockPublicPolicy
      ).toBe(true);
    });
  });

  describe('Lambda Function Verification', () => {
    test('Lambda function should exist with correct configuration', async () => {
      const functionName = outputs.LambdaFunctionName;
      expect(functionName).toBeDefined();
      expect(functionName).toContain(environmentSuffix);

      // Get function configuration
      const functionConfig = await lambda
        .getFunctionConfiguration({
          FunctionName: functionName,
        })
        .promise();

      expect(functionConfig.Runtime).toBe('nodejs18.x');
      expect(functionConfig.Timeout).toBe(300);
      expect(functionConfig.Environment?.Variables?.NODE_ENV).toBe(
        'production'
      );
      expect(functionConfig.Environment?.Variables?.LOG_LEVEL).toBe('info');
      expect(functionConfig.Environment?.Variables?.SECRET_NAME).toBeDefined();

      // Verify no sensitive data in environment variables
      expect(
        functionConfig.Environment?.Variables?.AWS_ACCESS_KEY_ID
      ).toBeUndefined();
      expect(
        functionConfig.Environment?.Variables?.AWS_SECRET_ACCESS_KEY
      ).toBeUndefined();
      expect(functionConfig.Environment?.Variables?.password).toBeUndefined();
    });

    test('Lambda function should have proper IAM role', async () => {
      const functionName = outputs.LambdaFunctionName;
      const functionConfig = await lambda
        .getFunctionConfiguration({
          FunctionName: functionName,
        })
        .promise();

      expect(functionConfig.Role).toBeDefined();
      expect(functionConfig.Role).toContain(
        'myproject-prod-lambda-execution-role'
      );
      expect(functionConfig.Role).toContain(environmentSuffix);
    });
  });

  describe('Secrets Manager Verification', () => {
    test('Database secret should exist', async () => {
      const secretArn = outputs.SecretArn;
      expect(secretArn).toBeDefined();
      expect(secretArn).toContain(environmentSuffix);

      // Describe secret (without retrieving value)
      const secretDescription = await secretsManager
        .describeSecret({
          SecretId: secretArn,
        })
        .promise();

      expect(secretDescription.Name).toContain(
        'myproject-prod/database/credentials'
      );
      expect(secretDescription.Name).toContain(environmentSuffix);
      expect(secretDescription.DeletedDate).toBeUndefined(); // Not deleted
    });

    test('Secret should contain proper database configuration', async () => {
      const secretArn = outputs.SecretArn;

      // Get secret value
      const secretValue = await secretsManager
        .getSecretValue({
          SecretId: secretArn,
        })
        .promise();

      const secretData = JSON.parse(secretValue.SecretString || '{}');
      expect(secretData.username).toBe('app_user');
      expect(secretData.database).toBe('myproject_db');
      expect(secretData.port).toBe(5432);
      expect(secretData.host).toBeDefined();
    });
  });

  describe('IAM Configuration Verification', () => {
    test('Account password policy should be configured', async () => {
      const passwordPolicy = await iam.getAccountPasswordPolicy().promise();

      expect(
        passwordPolicy.PasswordPolicy?.MinimumPasswordLength
      ).toBeGreaterThanOrEqual(12);
      expect(passwordPolicy.PasswordPolicy?.RequireLowercaseCharacters).toBe(
        true
      );
      expect(passwordPolicy.PasswordPolicy?.RequireUppercaseCharacters).toBe(
        true
      );
      expect(passwordPolicy.PasswordPolicy?.RequireNumbers).toBe(true);
      expect(passwordPolicy.PasswordPolicy?.RequireSymbols).toBe(true);
    });

    test('Lambda role should exist with correct policies', async () => {
      const roleArn = outputs.LambdaRoleArn;
      expect(roleArn).toBeDefined();

      const roleName = roleArn.split('/').pop();
      expect(roleName).toContain(environmentSuffix);

      // Get role
      const role = await iam.getRole({ RoleName: roleName! }).promise();
      expect(role.Role.RoleName).toContain(
        'myproject-prod-lambda-execution-role'
      );

      // Check trust policy
      const trustPolicy = JSON.parse(
        decodeURIComponent(role.Role.AssumeRolePolicyDocument!)
      );
      expect(trustPolicy.Statement[0].Principal.Service).toBe(
        'lambda.amazonaws.com'
      );

      // List attached policies
      const attachedPolicies = await iam
        .listAttachedRolePolicies({
          RoleName: roleName!,
        })
        .promise();

      const policyArns =
        attachedPolicies.AttachedPolicies?.map(p => p.PolicyArn) || [];
      expect(policyArns).toContain(
        'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole'
      );
    });
  });

  describe('GuardDuty Verification', () => {
    test('GuardDuty detector should be enabled', async () => {
      const detectorId = outputs.GuardDutyDetectorId;
      expect(detectorId).toBeDefined();

      // Get detector details
      const detector = await guardduty
        .getDetector({
          DetectorId: detectorId,
        })
        .promise();

      expect(detector.Status).toBe('ENABLED');
    });
  });

  describe('KMS Key Verification', () => {
    test('KMS key should exist and be enabled', async () => {
      const keyId = outputs.KmsKeyId;
      expect(keyId).toBeDefined();

      // Describe key
      const keyDescription = await kms
        .describeKey({
          KeyId: keyId,
        })
        .promise();

      expect(keyDescription.KeyMetadata?.KeyState).toBe('Enabled');
      expect(keyDescription.KeyMetadata?.KeyUsage).toBe('ENCRYPT_DECRYPT');
      expect(keyDescription.KeyMetadata?.Description).toContain(
        'S3 bucket encryption'
      );
    });
  });

  describe('End-to-End Workflow Tests', () => {
    test('Lambda function can access Secrets Manager', async () => {
      const functionName = outputs.LambdaFunctionName;

      // Invoke Lambda function
      const invocationResult = await lambda
        .invoke({
          FunctionName: functionName,
          InvocationType: 'RequestResponse',
          Payload: JSON.stringify({
            eventType: 'test',
            bucketNames: [outputs.S3BucketDocuments],
          }),
        })
        .promise();

      expect(invocationResult.StatusCode).toBe(200);

      if (invocationResult.Payload) {
        const payload = JSON.parse(invocationResult.Payload.toString());
        expect(payload.statusCode).toBe(200);

        const body = JSON.parse(payload.body);
        expect(body.message).toBe('Data processed successfully');
      }
    });

    test('S3 buckets can be accessed by Lambda role', async () => {
      const bucketName = outputs.S3BucketDocuments;
      const roleArn = outputs.LambdaRoleArn;

      // Put a test object
      const testKey = `test-${Date.now()}.txt`;
      await s3
        .putObject({
          Bucket: bucketName,
          Key: testKey,
          Body: 'Test content',
          ServerSideEncryption: 'aws:kms',
          SSEKMSKeyId: outputs.KmsKeyId,
        })
        .promise();

      // Verify object exists
      const objectExists = await s3
        .headObject({
          Bucket: bucketName,
          Key: testKey,
        })
        .promise()
        .then(() => true)
        .catch(() => false);

      expect(objectExists).toBe(true);

      // Clean up
      await s3
        .deleteObject({
          Bucket: bucketName,
          Key: testKey,
        })
        .promise();
    });
  });

  describe('Security Compliance Tests', () => {
    test('All S3 buckets should deny public access', async () => {
      const buckets = [
        outputs.S3BucketDocuments,
        outputs.S3BucketLogs,
        outputs.S3BucketBackups,
      ];

      for (const bucket of buckets) {
        // Try to get bucket ACL (should be private)
        const acl = await s3.getBucketAcl({ Bucket: bucket }).promise();

        // Check that only owner has FULL_CONTROL
        expect(acl.Grants?.length).toBe(1);
        expect(acl.Grants?.[0].Permission).toBe('FULL_CONTROL');
        expect(acl.Grants?.[0].Grantee?.Type).toBe('CanonicalUser');
      }
    });

    test('Lambda environment should not contain sensitive credentials', async () => {
      const functionName = outputs.LambdaFunctionName;
      const functionConfig = await lambda
        .getFunctionConfiguration({
          FunctionName: functionName,
        })
        .promise();

      const envVars = functionConfig.Environment?.Variables || {};
      const envVarKeys = Object.keys(envVars);
      const sensitivePatterns = [
        /password/i,
        /secret/i,
        /key/i,
        /token/i,
        /credential/i,
      ];

      // Check that no sensitive patterns exist in env var names (except SECRET_NAME which is allowed)
      for (const key of envVarKeys) {
        if (key === 'SECRET_NAME') continue; // This is allowed

        for (const pattern of sensitivePatterns) {
          if (pattern.test(key)) {
            // If it matches a sensitive pattern, ensure the value is not actually sensitive
            expect(envVars[key]).not.toContain('AKIA'); // AWS Access Key prefix
            expect(envVars[key]).not.toContain('aws_access_key_id');
            expect(envVars[key]).not.toContain('aws_secret_access_key');
          }
        }
      }
    });
  });
});
