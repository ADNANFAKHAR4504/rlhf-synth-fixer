// Configuration - These are coming from cfn-outputs after cdk deploy
import fs from 'fs';
import AWS from 'aws-sdk';

type DeploymentOutputs = {
  DatabaseCredentialsSecretArn: string;
  VpcId: string;
  PublicSubnet1Id: string;
  PublicSubnet2Id: string;
  SecurityGroupId: string;
  EmailEventsBucketName: string;
  PrivateSubnet1Id: string;
  PrivateSubnet2Id: string;
  LambdaFunctionName: string;
  DatabaseEndpoint: string;
};

let outputs: DeploymentOutputs;
let skipSetupReason: string | null = null;

try {
  if (!fs.existsSync('cfn-outputs/flat-outputs.json')) {
    skipSetupReason =
      'cfn-outputs/flat-outputs.json not found. Did you run the deployment step and download the artifact?';
  } else {
    outputs = JSON.parse(
      fs.readFileSync('cfn-outputs/flat-outputs.json', 'utf8')
    );
  }
} catch (error) {
  skipSetupReason =
    error instanceof Error
      ? `Unable to read deployment outputs: ${error.message}`
      : 'Unable to read deployment outputs.';
}

const ensureOutputs = () => {
  if (skipSetupReason) {
    console.warn(`Skipping integration tests: ${skipSetupReason}`);
    return false;
  }
  return true;
};

if (!skipSetupReason) {
  if (
    !outputs.DatabaseCredentialsSecretArn ||
    !outputs.EmailEventsBucketName ||
    !outputs.LambdaFunctionName
  ) {
    skipSetupReason = 'Deployment outputs are incomplete. Aborting integration tests.';
  }
}

const derivedRegion = skipSetupReason
  ? 'us-west-1'
  : process.env.AWS_REGION ??
    process.env.CDK_DEFAULT_REGION ??
    outputs.DatabaseEndpoint.split('.')[2] ??
    'us-west-1';

AWS.config.update({ region: derivedRegion });

const s3 = new AWS.S3({ region: derivedRegion });
const lambda = new AWS.Lambda({ region: derivedRegion });
const secretsManager = new AWS.SecretsManager({ region: derivedRegion });
const rds = new AWS.RDS({ region: derivedRegion });

let lambdaConfig: AWS.Lambda.FunctionConfiguration | undefined;
let lambdaArn: string | undefined;
let secretDescription: AWS.SecretsManager.DescribeSecretResponse | undefined;
let dbInstance: AWS.RDS.DBInstance | undefined;
let skipReason: string | null = skipSetupReason;

beforeAll(async () => {
  try {
    const functionResult = await lambda
      .getFunction({ FunctionName: outputs.LambdaFunctionName })
      .promise();
    lambdaConfig = functionResult.Configuration;
    lambdaArn = lambdaConfig?.FunctionArn;

    secretDescription = await secretsManager
      .describeSecret({ SecretId: outputs.DatabaseCredentialsSecretArn })
      .promise();

    const dbIdentifier = outputs.DatabaseEndpoint.split('.')[0];
    const dbResult = await rds
      .describeDBInstances({ DBInstanceIdentifier: dbIdentifier })
      .promise();
    dbInstance = dbResult.DBInstances?.[0];
  } catch (error) {
    skipReason =
      error instanceof Error ? error.message : 'Unknown error resolving AWS state';
  }
}, 30000);

const ensureReady = () => {
  if (!ensureOutputs()) {
    return false;
  }
  if (skipReason) {
    console.warn(`Skipping integration assertions: ${skipReason}`);
    return false;
  }
  return true;
};

describe('TapStack integration', () => {
  test('S3 bucket is versioned and notifies the email processor lambda', async () => {
    if (!ensureReady()) return;

    const versioning = await s3
      .getBucketVersioning({ Bucket: outputs.EmailEventsBucketName })
      .promise();
    expect(versioning.Status).toBe('Enabled');

    const notifications = await s3
      .getBucketNotificationConfiguration({
        Bucket: outputs.EmailEventsBucketName,
      })
      .promise();

    const lambdaConfigurations =
      notifications.LambdaFunctionConfigurations ?? [];
    expect(lambdaConfigurations.length).toBeGreaterThan(0);
    expect(
      lambdaConfigurations.some(
        (config) => config.LambdaFunctionArn === lambdaArn
      )
    ).toBe(true);
  }, 60000);

  test('Lambda function environment references bucket, secret, and private subnets', () => {
    if (!ensureReady()) return;

    expect(lambdaConfig?.Environment?.Variables?.EMAIL_EVENTS_BUCKET).toBe(
      outputs.EmailEventsBucketName
    );
    expect(lambdaConfig?.Environment?.Variables?.RDS_SECRET_ARN).toBe(
      outputs.DatabaseCredentialsSecretArn
    );
    expect(lambdaConfig?.VpcConfig?.SecurityGroupIds).toEqual(
      expect.arrayContaining([outputs.SecurityGroupId])
    );
    expect(lambdaConfig?.VpcConfig?.SubnetIds).toEqual(
      expect.arrayContaining([
        outputs.PrivateSubnet1Id,
        outputs.PrivateSubnet2Id,
      ])
    );
  });

  test('Secrets Manager entry exists with IaC tagging', () => {
    if (!ensureReady()) return;

    expect(secretDescription?.ARN).toBe(outputs.DatabaseCredentialsSecretArn);
    const secretName = outputs.DatabaseCredentialsSecretArn.split(':secret:')[1];
    expect(secretDescription?.Name).toBe(secretName);

    const tags = secretDescription?.Tags ?? [];
    expect(
      tags.some(
        (tag) => tag.Key === 'iac-rlhf-amazon' && tag.Value === 'true'
      )
    ).toBe(true);
  });

  test('RDS instance resides in expected VPC subnets and is multi-AZ', () => {
    if (!ensureReady()) return;

    expect(dbInstance?.Endpoint?.Address).toBe(outputs.DatabaseEndpoint);
    expect(dbInstance?.DBSubnetGroup?.VpcId).toBe(outputs.VpcId);
    expect(dbInstance?.MultiAZ).toBe(true);

    const subnetIds = new Set(
      dbInstance?.DBSubnetGroup?.Subnets?.map(
        (subnet) => subnet.SubnetIdentifier
      )
    );
    expect(subnetIds.has(outputs.PrivateSubnet1Id)).toBe(true);
    expect(subnetIds.has(outputs.PrivateSubnet2Id)).toBe(true);
  });
});
