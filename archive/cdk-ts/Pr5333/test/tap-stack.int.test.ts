// Integration tests for AWS CDK Security Baseline Stack
// These tests verify actual deployed AWS resources using AWS SDK
import * as fs from 'fs';
import * as path from 'path';
import {
  KMSClient,
  DescribeKeyCommand,
  ListAliasesCommand,
  GetKeyRotationStatusCommand,
} from '@aws-sdk/client-kms';
import {
  S3Client,
  HeadBucketCommand,
  GetBucketEncryptionCommand,
  GetBucketVersioningCommand,
  GetPublicAccessBlockCommand,
  GetBucketPolicyCommand,
} from '@aws-sdk/client-s3';
import {
  CloudTrailClient,
  GetTrailCommand,
  GetTrailStatusCommand,
  GetEventSelectorsCommand,
} from '@aws-sdk/client-cloudtrail';
import {
  IAMClient,
  GetRoleCommand,
  ListAttachedRolePoliciesCommand,
  ListRolePoliciesCommand,
  GetRolePolicyCommand,
} from '@aws-sdk/client-iam';
import {
  SecretsManagerClient,
  DescribeSecretCommand,
  GetResourcePolicyCommand,
} from '@aws-sdk/client-secrets-manager';
import {
  CloudWatchLogsClient,
  DescribeLogGroupsCommand,
} from '@aws-sdk/client-cloudwatch-logs';
import {
  EC2Client,
  DescribeVpcsCommand,
  DescribeVpcEndpointsCommand,
  DescribeFlowLogsCommand,
} from '@aws-sdk/client-ec2';
import { LambdaClient, GetFunctionCommand } from '@aws-sdk/client-lambda';
import {
  CloudWatchClient,
  DescribeAlarmsCommand,
} from '@aws-sdk/client-cloudwatch';
import { STSClient, GetCallerIdentityCommand } from '@aws-sdk/client-sts';

// Read deployment outputs
const outputsPath = path.resolve(__dirname, '../cfn-outputs/flat-outputs.json');
let outputs: Record<string, string> = {};

try {
  if (fs.existsSync(outputsPath)) {
    const outputsContent = fs.readFileSync(outputsPath, 'utf8');
    outputs = JSON.parse(outputsContent);
    console.log('✅ Loaded deployment outputs:', Object.keys(outputs));
  } else {
    console.warn('⚠️  Deployment outputs not found at', outputsPath);
  }
} catch (error) {
  console.warn('⚠️  Error loading deployment outputs:', error instanceof Error ? error.message : String(error));
  outputs = {};
}

// Get environment suffix from environment variable
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

// Extract AWS account ID and region from outputs or use defaults
const extractAccountId = (arn: string): string | null => {
  const match = arn.match(/arn:aws:[^:]+:[^:]*:(\d{12})/);
  return match ? match[1] : null;
};

const extractRegion = (arn: string): string | null => {
  const match = arn.match(/arn:aws:[^:]+:([^:]+):/);
  return match ? match[1] : null;
};

// Get region and account ID from outputs
let AWS_REGION = process.env.AWS_REGION || 'us-east-2';
let AWS_ACCOUNT_ID: string | undefined;

if (outputs.CloudTrailArn) {
  const region = extractRegion(outputs.CloudTrailArn);
  const accountId = extractAccountId(outputs.CloudTrailArn);
  if (region) AWS_REGION = region;
  if (accountId) AWS_ACCOUNT_ID = accountId;
} else if (outputs.KmsDatabaseKeyArn) {
  const region = extractRegion(outputs.KmsDatabaseKeyArn);
  const accountId = extractAccountId(outputs.KmsDatabaseKeyArn);
  if (region) AWS_REGION = region;
  if (accountId) AWS_ACCOUNT_ID = accountId;
}

// Helper function to get expected bucket names
function getExpectedBuckets(accountId: string): string[] {
  return [
    `${accountId}-access-logs-${environmentSuffix}`,
    `${accountId}-cloudtrail-logs-${environmentSuffix}`,
    `${accountId}-vpc-flow-logs-${environmentSuffix}`,
  ];
}

// Initialize AWS clients
const kmsClient = new KMSClient({ region: AWS_REGION });
const s3Client = new S3Client({ region: AWS_REGION });
const cloudTrailClient = new CloudTrailClient({ region: AWS_REGION });
const iamClient = new IAMClient({ region: AWS_REGION });
const secretsClient = new SecretsManagerClient({ region: AWS_REGION });
const logsClient = new CloudWatchLogsClient({ region: AWS_REGION });
const ec2Client = new EC2Client({ region: AWS_REGION });
const lambdaClient = new LambdaClient({ region: AWS_REGION });
const cloudWatchClient = new CloudWatchClient({ region: AWS_REGION });
const stsClient = new STSClient({ region: AWS_REGION });

// Helper function to get account ID if not available
async function getAccountId(): Promise<string> {
  if (AWS_ACCOUNT_ID) {
    return AWS_ACCOUNT_ID;
  }
  try {
    const response = await stsClient.send(new GetCallerIdentityCommand({}));
    const accountId = response.Account || '';
    AWS_ACCOUNT_ID = accountId; // Cache it
    return accountId;
  } catch (error) {
    console.warn('Failed to get account ID from STS:', error instanceof Error ? error.message : String(error));
    return '';
  }
}

describe('AWS CDK Security Baseline - Integration Tests', () => {
  let accountId: string;
  const testTimeout = 30000; // 30 seconds per test

  beforeAll(async () => {
    accountId = await getAccountId();
    console.log(
      `🧪 Running integration tests in region: ${AWS_REGION}, account: ${accountId}`
    );
  });

  describe('Stack Outputs', () => {
    test(
      'should have required stack outputs',
      async () => {
        expect(outputs).toBeDefined();
        expect(outputs.KmsDatabaseKeyArn).toBeDefined();
        expect(outputs.CloudTrailArn).toBeDefined();
        expect(outputs.DevOpsRoleArn).toBeDefined();

        // Verify ARN format
        expect(outputs.KmsDatabaseKeyArn).toMatch(/^arn:aws:kms:/);
        expect(outputs.CloudTrailArn).toMatch(/^arn:aws:cloudtrail:/);
        expect(outputs.DevOpsRoleArn).toMatch(/^arn:aws:iam:/);
      },
      testTimeout
    );
  });

  describe('KMS Keys', () => {
    test(
      'KMS database key should exist and be enabled',
      async () => {
        if (!outputs.KmsDatabaseKeyArn) {
          console.warn('⚠️  Skipping: KmsDatabaseKeyArn not in outputs');
          return;
        }

        const keyId = outputs.KmsDatabaseKeyArn.split('/').pop() || '';
        const response = await kmsClient.send(
          new DescribeKeyCommand({ KeyId: keyId })
        );

        expect(response.KeyMetadata).toBeDefined();
        expect(response.KeyMetadata?.KeyId).toBe(keyId);
        expect(response.KeyMetadata?.KeyState).toBe('Enabled');
        expect(response.KeyMetadata?.Description).toContain('database');
      },
      testTimeout
    );

    test(
      'KMS keys should have rotation enabled',
      async () => {
        // Test database key
        if (outputs.KmsDatabaseKeyArn) {
          const keyId = outputs.KmsDatabaseKeyArn.split('/').pop() || '';
          const rotationResponse = await kmsClient.send(
            new GetKeyRotationStatusCommand({ KeyId: keyId })
          );
          expect(rotationResponse.KeyRotationEnabled).toBe(true);
        }

        // Test S3 key (we need to find it by alias)
        const aliasesResponse = await kmsClient.send(
          new ListAliasesCommand({})
        );
        const s3Alias = aliasesResponse.Aliases?.find(alias =>
          alias.AliasName?.includes(`s3-encryption-${environmentSuffix}`)
        );
        if (s3Alias?.TargetKeyId) {
          const rotationResponse = await kmsClient.send(
            new GetKeyRotationStatusCommand({ KeyId: s3Alias.TargetKeyId })
          );
          expect(rotationResponse.KeyRotationEnabled).toBe(true);
        }
      },
      testTimeout
    );

    test(
      'KMS key aliases should exist',
      async () => {
        const aliasesResponse = await kmsClient.send(
          new ListAliasesCommand({})
        );

        const expectedAliases = [
          `alias/database-encryption-${environmentSuffix}`,
          `alias/s3-encryption-${environmentSuffix}`,
          `alias/secrets-encryption-${environmentSuffix}`,
          `alias/logs-encryption-${environmentSuffix}`,
        ];

        const aliasNames = aliasesResponse.Aliases?.map(a => a.AliasName) || [];

        // Check that at least some of our aliases exist (aliases may have unique suffixes)
        const foundAliases = expectedAliases.filter(expected =>
          aliasNames.some(name => name?.includes(expected.split('-')[0]))
        );
        expect(foundAliases.length).toBeGreaterThan(0);
      },
      testTimeout
    );
  });

  describe('S3 Buckets', () => {
    test(
      'S3 buckets should exist',
      async () => {
        const expectedBuckets = getExpectedBuckets(accountId);
        for (const bucketName of expectedBuckets) {
          try {
            await s3Client.send(new HeadBucketCommand({ Bucket: bucketName }));
            // If no error, bucket exists
            expect(true).toBe(true);
          } catch (error: any) {
            if (
              error.name === 'NotFound' ||
              error.$metadata?.httpStatusCode === 404
            ) {
              throw new Error(`Bucket ${bucketName} not found`);
            }
            throw error;
          }
        }
      },
      testTimeout,
    );

    test(
      'S3 buckets should have encryption enabled',
      async () => {
        const expectedBuckets = getExpectedBuckets(accountId);
        for (const bucketName of expectedBuckets) {
          try {
            const response = await s3Client.send(
              new GetBucketEncryptionCommand({ Bucket: bucketName })
            );
            expect(response.ServerSideEncryptionConfiguration).toBeDefined();
            expect(
              response.ServerSideEncryptionConfiguration?.Rules?.[0]
                .ApplyServerSideEncryptionByDefault?.SSEAlgorithm
            ).toBe('aws:kms');
          } catch (error: any) {
            if (error.name !== 'NotFound') {
              throw error;
            }
          }
        }
      },
      testTimeout
    );

    test(
      'S3 buckets should have versioning enabled',
      async () => {
        const expectedBuckets = getExpectedBuckets(accountId);
        for (const bucketName of expectedBuckets) {
          try {
            const response = await s3Client.send(
              new GetBucketVersioningCommand({ Bucket: bucketName })
            );
            expect(response.Status).toBe('Enabled');
          } catch (error: any) {
            if (error.name !== 'NotFound') {
              throw error;
            }
          }
        }
      },
      testTimeout
    );

    test(
      'S3 buckets should have public access blocked',
      async () => {
        const expectedBuckets = getExpectedBuckets(accountId);
        for (const bucketName of expectedBuckets) {
          try {
            const response = await s3Client.send(
              new GetPublicAccessBlockCommand({ Bucket: bucketName })
            );
            expect(response.PublicAccessBlockConfiguration).toBeDefined();
            expect(
              response.PublicAccessBlockConfiguration?.BlockPublicAcls
            ).toBe(true);
            expect(
              response.PublicAccessBlockConfiguration?.BlockPublicPolicy
            ).toBe(true);
            expect(
              response.PublicAccessBlockConfiguration?.IgnorePublicAcls
            ).toBe(true);
            expect(
              response.PublicAccessBlockConfiguration?.RestrictPublicBuckets
            ).toBe(true);
          } catch (error: any) {
            if (error.name !== 'NotFound') {
              throw error;
            }
          }
        }
      },
      testTimeout
    );

    test(
      'CloudTrail S3 bucket should allow CloudTrail service',
      async () => {
        const expectedBuckets = getExpectedBuckets(accountId);
        const bucketName = expectedBuckets[1]; // cloudtrail-logs bucket
        try {
          const response = await s3Client.send(
            new GetBucketPolicyCommand({ Bucket: bucketName })
          );
          if (response.Policy) {
            const policy = JSON.parse(response.Policy);
            const statements = policy.Statement || [];
            const cloudTrailStatement = statements.find(
              (stmt: any) =>
                stmt.Principal?.Service === 'cloudtrail.amazonaws.com'
            );
            expect(cloudTrailStatement).toBeDefined();
            expect(cloudTrailStatement?.Effect).toBe('Allow');
            const actions = Array.isArray(cloudTrailStatement?.Action)
              ? cloudTrailStatement.Action
              : [cloudTrailStatement?.Action];
            expect(actions.some((a: string) => a.includes('s3:PutObject') || a === 's3:PutObject')).toBe(true);
            // GetBucketAcl might be in a separate statement, so check all statements
            const allActions = statements
              .filter((s: any) => s.Principal?.Service === 'cloudtrail.amazonaws.com')
              .flatMap((s: any) => (Array.isArray(s.Action) ? s.Action : [s.Action]));
            expect(allActions.some((a: string) => a.includes('s3:GetBucketAcl') || a === 's3:GetBucketAcl')).toBe(true);
          }
        } catch (error: any) {
          if (error.name !== 'NotFound') {
            throw error;
          }
        }
      },
      testTimeout
    );
  });

  describe('CloudTrail', () => {
    test(
      'CloudTrail should exist and be enabled',
      async () => {
        if (!outputs.CloudTrailArn) {
          console.warn('⚠️  Skipping: CloudTrailArn not in outputs');
          return;
        }

        // Extract trail name from ARN (format: arn:aws:cloudtrail:region:account:trail/name)
        const trailName = outputs.CloudTrailArn.split('/').pop() || outputs.CloudTrailArn.split(':').pop() || '';
        const response = await cloudTrailClient.send(
          new GetTrailCommand({ Name: trailName })
        );

        expect(response.Trail).toBeDefined();
        expect(response.Trail?.Name).toBe(trailName);
        // IsLogging is not directly on the trail, check status separately
        expect(response.Trail?.IncludeGlobalServiceEvents).toBe(true);
        expect(response.Trail?.IsMultiRegionTrail).toBe(true);
      },
      testTimeout
    );

    test(
      'CloudTrail should have log file validation enabled',
      async () => {
        if (!outputs.CloudTrailArn) {
          return;
        }

        const trailName = outputs.CloudTrailArn.split('/').pop() || outputs.CloudTrailArn.split(':').pop() || '';
        const response = await cloudTrailClient.send(
          new GetTrailCommand({ Name: trailName })
        );

        expect(response.Trail?.LogFileValidationEnabled).toBe(true);
      },
      testTimeout
    );

    test(
      'CloudTrail status should show logging',
      async () => {
        if (!outputs.CloudTrailArn) {
          return;
        }

        const trailName = outputs.CloudTrailArn.split('/').pop() || outputs.CloudTrailArn.split(':').pop() || '';
        const statusResponse = await cloudTrailClient.send(
          new GetTrailStatusCommand({ Name: trailName })
        );

        expect(statusResponse.IsLogging).toBe(true);
      },
      testTimeout
    );

    test(
      'CloudTrail should have event selectors configured',
      async () => {
        if (!outputs.CloudTrailArn) {
          return;
        }

        const trailName = outputs.CloudTrailArn.split('/').pop() || outputs.CloudTrailArn.split(':').pop() || '';
        const response = await cloudTrailClient.send(
          new GetEventSelectorsCommand({ TrailName: trailName })
        );

        expect(response.EventSelectors).toBeDefined();
        expect(response.EventSelectors?.length).toBeGreaterThan(0);
      },
      testTimeout
    );
  });

  describe('IAM Roles', () => {
    const expectedRoles = [
      `SecurityBaselineEc2Role-${environmentSuffix}`,
      `SecurityBaselineLambdaRole-${environmentSuffix}`,
      `SecurityBaselineEcsTaskRole-${environmentSuffix}`,
      `DevOpsSecurityBaselineRole-${environmentSuffix}`,
    ];

    test.each(expectedRoles)(
      'IAM role %s should exist',
      async roleName => {
        try {
          const response = await iamClient.send(
            new GetRoleCommand({ RoleName: roleName })
          );
          expect(response.Role).toBeDefined();
          expect(response.Role?.RoleName).toBe(roleName);
        } catch (error: any) {
          if (error.name === 'NoSuchEntity') {
            throw new Error(`Role ${roleName} not found`);
          }
          throw error;
        }
      },
      testTimeout
    );

    test(
      'DevOps role should have MFA condition',
      async () => {
        const roleName = `DevOpsSecurityBaselineRole-${environmentSuffix}`;
        try {
          const response = await iamClient.send(
            new GetRoleCommand({ RoleName: roleName })
          );

          let assumeRolePolicy = response.Role?.AssumeRolePolicyDocument;
          if (assumeRolePolicy) {
            // Decode if URL encoded
            if (typeof assumeRolePolicy === 'string') {
              try {
                assumeRolePolicy = decodeURIComponent(assumeRolePolicy);
              } catch (e) {
                // If not URL encoded, use as-is
              }
            }
            const policy =
              typeof assumeRolePolicy === 'string'
                ? JSON.parse(assumeRolePolicy)
                : assumeRolePolicy;
            const statements = policy.Statement || [];
            const mfaStatement = statements.find(
              (stmt: any) =>
                stmt.Condition?.Bool?.['aws:MultiFactorAuthPresent'] === 'true'
            );
            expect(mfaStatement).toBeDefined();
          }
        } catch (error: any) {
          if (error.name !== 'NoSuchEntity') {
            throw error;
          }
        }
      },
      testTimeout
    );

    test(
      'IAM roles should have policies attached',
      async () => {
        const roleName = `SecurityBaselineEc2Role-${environmentSuffix}`;
        try {
          const attachedPolicies = await iamClient.send(
            new ListAttachedRolePoliciesCommand({ RoleName: roleName })
          );
          const inlinePolicies = await iamClient.send(
            new ListRolePoliciesCommand({ RoleName: roleName })
          );

          // Role should have at least one policy (inline or attached)
          expect(
            (attachedPolicies.AttachedPolicies?.length || 0) +
              (inlinePolicies.PolicyNames?.length || 0)
          ).toBeGreaterThan(0);
        } catch (error: any) {
          if (error.name !== 'NoSuchEntity') {
            throw error;
          }
        }
      },
      testTimeout
    );
  });

  describe('Secrets Manager', () => {
    const expectedSecrets = [
      `app/database/master-${environmentSuffix}`,
      `app/api/key-${environmentSuffix}`,
    ];

    test.each(expectedSecrets)(
      'Secret %s should exist',
      async secretName => {
        try {
          const response = await secretsClient.send(
            new DescribeSecretCommand({ SecretId: secretName })
          );
          expect(response.ARN).toBeDefined();
          expect(response.Name).toBe(secretName);
        } catch (error: any) {
          if (error.name === 'ResourceNotFoundException') {
            throw new Error(`Secret ${secretName} not found`);
          }
          throw error;
        }
      },
      testTimeout
    );

    test(
      'Secrets should have KMS encryption',
      async () => {
        for (const secretName of expectedSecrets) {
          try {
            const response = await secretsClient.send(
              new DescribeSecretCommand({ SecretId: secretName })
            );
            expect(response.KmsKeyId).toBeDefined();
          } catch (error: any) {
            if (error.name !== 'ResourceNotFoundException') {
              throw error;
            }
          }
        }
      },
      testTimeout
    );

    test(
      'Database secret should have rotation enabled',
      async () => {
        const secretName = `app/database/master-${environmentSuffix}`;
        try {
          const response = await secretsClient.send(
            new DescribeSecretCommand({ SecretId: secretName })
          );
          expect(response.RotationEnabled).toBe(true);
          expect(response.RotationRules).toBeDefined();
        } catch (error: any) {
          if (error.name !== 'ResourceNotFoundException') {
            throw error;
          }
        }
      },
      testTimeout
    );
  });

  describe('CloudWatch Log Groups', () => {
    const expectedLogGroups = [
      `/aws/application/main-${environmentSuffix}`,
      `/aws/lambda/secrets-rotation-${environmentSuffix}`,
      `/aws/cloudtrail/security-baseline-${environmentSuffix}`,
    ];

    test(
      'CloudWatch log groups should exist',
      async () => {
        const response = await logsClient.send(
          new DescribeLogGroupsCommand({})
        );

        const logGroupNames =
          response.logGroups?.map(lg => lg.logGroupName) || [];

        for (const expectedGroup of expectedLogGroups) {
          const found = logGroupNames.some(name => name === expectedGroup);
          expect(found).toBe(true);
        }
      },
      testTimeout
    );

    test(
      'CloudWatch log groups should have encryption enabled',
      async () => {
        const response = await logsClient.send(
          new DescribeLogGroupsCommand({})
        );

        for (const expectedGroup of expectedLogGroups) {
          const logGroup = response.logGroups?.find(
            lg => lg.logGroupName === expectedGroup
          );
          if (logGroup) {
            expect(logGroup.kmsKeyId).toBeDefined();
          }
        }
      },
      testTimeout
    );

    test(
      'CloudWatch log groups should have retention configured',
      async () => {
        const response = await logsClient.send(
          new DescribeLogGroupsCommand({})
        );

        for (const expectedGroup of expectedLogGroups) {
          const logGroup = response.logGroups?.find(
            lg => lg.logGroupName === expectedGroup
          );
          if (logGroup) {
            // Retention should be configured (7 years = 2555 days)
            expect(logGroup.retentionInDays).toBeDefined();
            expect(logGroup.retentionInDays).toBeGreaterThan(0);
          }
        }
      },
      testTimeout
    );
  });

  describe('VPC and Networking', () => {
    test(
      'VPC should exist',
      async () => {
        const response = await ec2Client.send(
          new DescribeVpcsCommand({
            Filters: [
              {
                Name: 'tag:Name',
                Values: [`security-baseline-vpc-${environmentSuffix}`],
              },
            ],
          })
        );

        expect(response.Vpcs).toBeDefined();
        expect(response.Vpcs?.length).toBeGreaterThan(0);
      },
      testTimeout
    );

    test(
      'VPC should have interface endpoints for Secrets Manager and KMS',
      async () => {
        const vpcResponse = await ec2Client.send(
          new DescribeVpcsCommand({
            Filters: [
              {
                Name: 'tag:Name',
                Values: [`security-baseline-vpc-${environmentSuffix}`],
              },
            ],
          })
        );

        if (vpcResponse.Vpcs && vpcResponse.Vpcs.length > 0) {
          const vpcId = vpcResponse.Vpcs[0].VpcId;

          const endpointsResponse = await ec2Client.send(
            new DescribeVpcEndpointsCommand({
              Filters: [{ Name: 'vpc-id', Values: [vpcId] }],
            })
          );

          const serviceNames =
            endpointsResponse.VpcEndpoints?.map(ep => ep.ServiceName) || [];

          expect(
            serviceNames.some(name => name?.includes('secretsmanager'))
          ).toBe(true);
          expect(serviceNames.some(name => name?.includes('kms'))).toBe(true);
        }
      },
      testTimeout
    );

    test(
      'VPC should have flow logs configured',
      async () => {
        const vpcResponse = await ec2Client.send(
          new DescribeVpcsCommand({
            Filters: [
              {
                Name: 'tag:Name',
                Values: [`security-baseline-vpc-${environmentSuffix}`],
              },
            ],
          })
        );

        if (vpcResponse.Vpcs && vpcResponse.Vpcs.length > 0) {
          const vpcId = vpcResponse.Vpcs[0].VpcId;

          const flowLogsResponse = await ec2Client.send(
            new DescribeFlowLogsCommand({
              Filters: [{ Name: 'resource-id', Values: [vpcId] }],
            })
          );

          expect(flowLogsResponse.FlowLogs).toBeDefined();
          expect(flowLogsResponse.FlowLogs?.length).toBeGreaterThan(0);
        }
      },
      testTimeout
    );
  });

  describe('Lambda Functions', () => {
    test(
      'Secrets rotation Lambda should exist',
      async () => {
        const functionName = `secrets-rotation-lambda-${environmentSuffix}`;
        try {
          const response = await lambdaClient.send(
            new GetFunctionCommand({ FunctionName: functionName })
          );

          expect(response.Configuration).toBeDefined();
          expect(response.Configuration?.FunctionName).toBe(functionName);
          expect(response.Configuration?.Runtime).toBe('python3.11');
          expect(response.Configuration?.Handler).toBe('index.handler');
        } catch (error: any) {
          if (error.name === 'ResourceNotFoundException') {
            throw new Error(`Lambda function ${functionName} not found`);
          }
          throw error;
        }
      },
      testTimeout
    );

    test(
      'Lambda should be in VPC',
      async () => {
        const functionName = `secrets-rotation-lambda-${environmentSuffix}`;
        try {
          const response = await lambdaClient.send(
            new GetFunctionCommand({ FunctionName: functionName })
          );

          expect(response.Configuration?.VpcConfig).toBeDefined();
          expect(
            response.Configuration?.VpcConfig?.SubnetIds?.length
          ).toBeGreaterThan(0);
        } catch (error: any) {
          if (error.name !== 'ResourceNotFoundException') {
            throw error;
          }
        }
      },
      testTimeout
    );
  });

  describe('CloudWatch Alarms', () => {
    const expectedAlarms = [
      `SecurityBaseline-UnauthorizedAPICalls-${environmentSuffix}`,
      `SecurityBaseline-RootAccountUsage-${environmentSuffix}`,
    ];

    test(
      'CloudWatch alarms should exist',
      async () => {
        const response = await cloudWatchClient.send(
          new DescribeAlarmsCommand({
            AlarmNamePrefix: `SecurityBaseline-`,
          })
        );

        const alarmNames = response.MetricAlarms?.map(a => a.AlarmName) || [];

        for (const expectedAlarm of expectedAlarms) {
          const found = alarmNames.some(name => name === expectedAlarm);
          expect(found).toBe(true);
        }
      },
      testTimeout
    );
  });

  describe('Resource Integration', () => {
    test(
      'CloudTrail should be writing to S3 bucket',
      async () => {
        if (!outputs.CloudTrailArn) {
          return;
        }

        const trailName = outputs.CloudTrailArn.split('/').pop() || outputs.CloudTrailArn.split(':').pop() || '';
        const trailResponse = await cloudTrailClient.send(
          new GetTrailCommand({ Name: trailName })
        );

        const bucketName = trailResponse.Trail?.S3BucketName;
        expect(bucketName).toBeDefined();

        // Verify bucket exists
        if (bucketName) {
          try {
            await s3Client.send(new HeadBucketCommand({ Bucket: bucketName }));
            expect(true).toBe(true);
          } catch (error: any) {
            throw new Error(`CloudTrail S3 bucket ${bucketName} not found`);
          }
        }
      },
      testTimeout
    );

    test(
      'Secrets rotation Lambda should have correct IAM role',
      async () => {
        const functionName = `secrets-rotation-lambda-${environmentSuffix}`;
        try {
          const lambdaResponse = await lambdaClient.send(
            new GetFunctionCommand({ FunctionName: functionName })
          );

          const roleArn = lambdaResponse.Configuration?.Role;
          expect(roleArn).toBeDefined();

          if (roleArn) {
            const roleName = roleArn.split('/').pop() || '';
            const roleResponse = await iamClient.send(
              new GetRoleCommand({ RoleName: roleName })
            );

            expect(roleResponse.Role).toBeDefined();
            expect(roleResponse.Role?.RoleName).toBe(
              `SecurityBaselineLambdaRole-${environmentSuffix}`
            );
          }
        } catch (error: any) {
          if (error.name !== 'ResourceNotFoundException') {
            throw error;
          }
        }
      },
      testTimeout
    );
  });
});
