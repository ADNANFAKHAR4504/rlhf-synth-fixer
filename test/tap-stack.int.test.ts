import fs from 'fs';
import path from 'path';

import { S3Client, GetBucketEncryptionCommand } from '@aws-sdk/client-s3';
import { KMSClient, ListAliasesCommand, DescribeKeyCommand } from '@aws-sdk/client-kms';
import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager';

const outputs = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../cfn-outputs/flat-outputs.json'), 'utf8')
);

const bucketName: string = outputs['MyEncryptedBucket'];
const secretArn: string = outputs['MyAppSecret'];
const kmsKeyArn: string = outputs['S3KMSKey'];

const s3 = new S3Client({});
const kms = new KMSClient({});
const secretsManager = new SecretsManagerClient({});

describe('Infrastructure Integration Tests (AWS SDK v3)', () => {
  test('S3 bucket exists and is encrypted with the correct KMS key', async () => {
    const encryption = await s3.send(new GetBucketEncryptionCommand({ Bucket: bucketName }));

    const rules = encryption.ServerSideEncryptionConfiguration?.Rules || [];
    expect(rules.length).toBeGreaterThan(0);

    const kmsRule = rules.find(
      (rule) => rule.ApplyServerSideEncryptionByDefault?.SSEAlgorithm === 'aws:kms'
    );

    expect(kmsRule).toBeDefined();

    // Correct property name is KMSMasterKeyID (capital "ID")
    expect(kmsRule?.ApplyServerSideEncryptionByDefault?.KMSMasterKeyID).toContain(kmsKeyArn);
  });

  test('KMS alias exists and points to the correct key', async () => {
    const aliasesResp = await kms.send(new ListAliasesCommand({}));
    const alias = aliasesResp.Aliases?.find(
      (a) => a.AliasName === 'alias/s3-bucket-encryption'
    );

    expect(alias).toBeDefined();
    expect(alias?.TargetKeyId).toBeDefined();

    const key = await kms.send(new DescribeKeyCommand({ KeyId: alias!.TargetKeyId! }));
    expect(key.KeyMetadata?.Arn).toBe(kmsKeyArn);
  });

  test('Secrets Manager secret exists and contains expected keys', async () => {
    const secret = await secretsManager.send(new GetSecretValueCommand({ SecretId: secretArn }));

    expect(secret.SecretString).toBeDefined();

    const parsedSecret = JSON.parse(secret.SecretString!);
    expect(parsedSecret).toHaveProperty('username');
    expect(parsedSecret).toHaveProperty('password');
  });
});
