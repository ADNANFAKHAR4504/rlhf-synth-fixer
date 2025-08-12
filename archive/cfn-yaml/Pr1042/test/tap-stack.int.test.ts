import fs from 'fs';
import path from 'path';

import { S3Client, GetBucketEncryptionCommand } from '@aws-sdk/client-s3';
import { KMSClient, ListAliasesCommand, DescribeKeyCommand } from '@aws-sdk/client-kms';
import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager';

// Load flat outputs
const outputs = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../cfn-outputs/flat-outputs.json'), 'utf8')
);

// Use correct keys from flat output structure
const bucketName: string = outputs['BucketName'];
const secretArn: string = outputs['SecretArn'];
const kmsKeyArn: string = outputs['KMSKeyArn'];

const s3 = new S3Client({});
const kms = new KMSClient({});
const secretsManager = new SecretsManagerClient({});

describe('Infrastructure Integration Tests (AWS SDK v3)', () => {
  test('S3 bucket is encrypted with the correct KMS key', async () => {
    const encryption = await s3.send(new GetBucketEncryptionCommand({ Bucket: bucketName }));
    const rules = encryption.ServerSideEncryptionConfiguration?.Rules || [];

    expect(rules.length).toBeGreaterThan(0);

    const kmsRule = rules.find(
      (rule) => rule.ApplyServerSideEncryptionByDefault?.SSEAlgorithm === 'aws:kms'
    );

    expect(kmsRule).toBeDefined();

    const kmsKeyIdInRule = kmsRule?.ApplyServerSideEncryptionByDefault?.KMSMasterKeyID;
    expect(kmsKeyIdInRule).toBeDefined();

    const kmsKeyIdFromArn = kmsKeyArn.split('/').pop(); // Extract the key ID
    expect(kmsKeyIdInRule).toBe(kmsKeyIdFromArn);
  });

  test('KMS alias "alias/s3-bucket-encryption" points to the correct key', async () => {
    const aliasesResp = await kms.send(new ListAliasesCommand({}));

    const alias = aliasesResp.Aliases?.find(
      (a) => a.AliasName === 'alias/s3-bucket-encryption'
    );

    expect(alias).toBeDefined();
    expect(alias?.TargetKeyId).toBeDefined();

    const key = await kms.send(new DescribeKeyCommand({ KeyId: alias!.TargetKeyId! }));
    expect(key.KeyMetadata?.Arn).toBe(kmsKeyArn);
  });

  test('Secrets Manager secret exists and contains "username" and "password"', async () => {
    const secretResp = await secretsManager.send(
      new GetSecretValueCommand({ SecretId: secretArn })
    );

    expect(secretResp.SecretString).toBeDefined();

    const parsed = JSON.parse(secretResp.SecretString!);
    expect(parsed).toHaveProperty('username');
    expect(parsed).toHaveProperty('password');
  });
});
