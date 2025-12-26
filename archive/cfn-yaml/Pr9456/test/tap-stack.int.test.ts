// Configuration - These are coming from cfn-outputs after cdk deploy
import AWS from 'aws-sdk';
import fs from 'fs';

const outputs = JSON.parse(
  fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
);

// Get environment suffix from environment variable (set by CI/CD pipeline)
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

// LocalStack configuration
const isLocalStack = !!process.env.AWS_ENDPOINT_URL;
const endpointUrl = process.env.AWS_ENDPOINT_URL || undefined;
const region = process.env.AWS_REGION || 'us-east-1';

const awsConfig: AWS.ConfigurationOptions = {
  region,
  ...(isLocalStack && {
    endpoint: endpointUrl,
    s3ForcePathStyle: true,
    credentials: {
      accessKeyId: 'test',
      secretAccessKey: 'test',
    },
  }),
};

const s3 = new AWS.S3(awsConfig);
const dynamodb = new AWS.DynamoDB(awsConfig);
const lambda = new AWS.Lambda(awsConfig);
const secretsManager = new AWS.SecretsManager(awsConfig);

// Helper: check if a string is non-empty
const isNonEmptyString = (val: any) => typeof val === 'string' && val.length > 0;

describe('Turn Around Prompt API Integration Tests', () => {
  describe('Write Integration TESTS', () => {
    // test('Dont forget!', async () => {
    //   expect(false).toBe(true);
    // });
  });

  describe('TapStack Integration Tests', () => {
    test('All required outputs should exist and be non-empty', () => {
      const requiredOutputs = [
        'S3BucketName',
        'DynamoDBTableName',
        'LambdaFunctionName',
        'SecretName',
        'KMSKeyId',
        'MFAEnforcementPolicyArn',
      ];
      requiredOutputs.forEach(key => {
        expect(outputs[key]).toBeDefined();
        expect(isNonEmptyString(outputs[key])).toBe(true);
      });
    });

    test('S3 bucket should exist and be accessible', async () => {
      const bucket = outputs.S3BucketName;
      const result = await s3.headBucket({ Bucket: bucket }).promise();
      expect(result).toBeDefined();
    });

    test('DynamoDB table should exist', async () => {
      const tableName = outputs.DynamoDBTableName;
      const result = await dynamodb.describeTable({ TableName: tableName }).promise();
      expect(result.Table).toBeDefined();
      expect(result.Table!.TableName).toBe(tableName);
      expect(result.Table!.TableStatus).toMatch(/ACTIVE|UPDATING/);
    });

    test('Lambda function should exist', async () => {
      const functionName = outputs.LambdaFunctionName;
      const result = await lambda.getFunction({ FunctionName: functionName }).promise();
      expect(result.Configuration).toBeDefined();
      expect(result.Configuration!.FunctionName).toBe(functionName);
      expect(result.Configuration!.Runtime).toMatch(/python3/);
    });

    test('Secret should exist and be retrievable', async () => {
      const secretName = outputs.SecretName;
      const result = await secretsManager.getSecretValue({ SecretId: secretName }).promise();
      expect(result.SecretString).toContain('ApiKey');
    });

    test('KMS key should exist', async () => {
      const kms = new AWS.KMS(awsConfig);
      const keyId = outputs.KMSKeyId;
      const result = await kms.describeKey({ KeyId: keyId }).promise();
      expect(result.KeyMetadata).toBeDefined();
      expect(result.KeyMetadata!.KeyId).toBeDefined();
      expect(result.KeyMetadata!.Description).toMatch(/KMS Key for ApplicationDataBucket encryption/);
    });

    test('MFA enforcement policy should exist', async () => {
      const iam = new AWS.IAM(awsConfig);
      const policyArn = outputs.MFAEnforcementPolicyArn;
      const result = await iam.getPolicy({ PolicyArn: policyArn }).promise();
      expect(result.Policy).toBeDefined();
      expect(result.Policy!.PolicyName).toContain('MFAEnforcementPolicy');
    });
  });
});
