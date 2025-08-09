// integration.test.ts

import fs from 'fs';
import AWS from 'aws-sdk';
import path from 'path';
import { S3, KMS, SecretsManager } from 'aws-sdk';

// Load CloudFormation outputs
const outputs = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../cfn-outputs/flat-outputs.json'), 'utf8')
);

// Get environment suffix from environment variable (set by CI/CD pipeline)
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

// Extract stack outputs
const bucketName: string = outputs['MyEncryptedBucket'];
const secretArn: string = outputs['MyAppSecret'];
const kmsKeyArn: string = outputs['S3KMSKey'];

// AWS SDK clients
const s3 = new AWS.S3();
const kms = new AWS.KMS();
const secretsManager = new AWS.SecretsManager();

// Typing for encryption rules
interface ServerSideEncryptionRule {
  ApplyServerSideEncryptionByDefault?: {
    SSEAlgorithm: string;
    KMSMasterKeyID?: string;
  };
}

describe('EncryptedS3SecretsStack Integration Tests', () => {

  test('S3 bucket exists and is encrypted with the correct KMS key', async () => {
    const encryption = await s3.getBucketEncryption({ Bucket: bucketName }).promise();

    const rules: ServerSideEncryptionRule[] =
      encryption.ServerSideEncryptionConfiguration?.Rules || [];

    expect(rules.length).toBeGreaterThan(0);

    const kmsRule = rules.find(
      (rule: ServerSideEncryptionRule) =>
        rule.ApplyServerSideEncryptionByDefault?.SSEAlgorithm === 'aws:kms'
    );

    expect(kmsRule).toBeDefined();
    expect(kmsRule?.ApplyServerSideEncryptionByDefault?.KMSMasterKeyID).toContain(
      kmsKeyArn.split('/')[1] // Key ID portion of the ARN
    );
  });

  test('KMS alias exists and points to the correct key', async () => {
    const aliasesResponse = await kms.listAliases().promise();

    const alias = aliasesResponse.Aliases?.find(
      (a: KMS.AliasListEntry) => a.AliasName === 'alias/s3-bucket-encryption'
    );

    expect(alias).toBeDefined();
    expect(alias?.TargetKeyId).toBeDefined();

    const keyMetadata = await kms.describeKey({ KeyId: alias!.TargetKeyId! }).promise();

    expect(keyMetadata.KeyMetadata?.Arn).toBe(kmsKeyArn);
  });

  test('Secrets Manager secret exists and contains expected keys', async () => {
    const secret = await secretsManager.getSecretValue({ SecretId: secretArn }).promise();

    expect(secret.SecretString).toBeDefined();

    const parsedSecret = JSON.parse(secret.SecretString!);
    expect(parsedSecret).toHaveProperty('username');
    expect(parsedSecret).toHaveProperty('password');
  });

});
