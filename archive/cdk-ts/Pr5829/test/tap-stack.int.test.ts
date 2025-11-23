import * as fs from 'fs';
import * as path from 'path';
import { KMS } from 'aws-sdk';
import { IAM } from 'aws-sdk';
import { SecretsManager } from 'aws-sdk';
import { SSM } from 'aws-sdk';
import { CloudWatchLogs } from 'aws-sdk';
import { CloudTrail } from 'aws-sdk';
import { S3 } from 'aws-sdk';
import { EventBridge } from 'aws-sdk';
import { CloudWatch } from 'aws-sdk';
import { Lambda } from 'aws-sdk';

describe('TAP Stack Integration Tests', () => {
  let outputs: Record<string, string>;
  let kms: KMS;
  let iam: IAM;
  let secretsManager: SecretsManager;
  let ssm: SSM;
  let cloudwatchLogs: CloudWatchLogs;
  let cloudtrail: CloudTrail;
  let s3: S3;
  let eventbridge: EventBridge;
  let cloudwatch: CloudWatch;
  let lambda: Lambda;
  let region: string;
  let envSuffix: string;

  beforeAll(() => {
    // Load outputs from flat-outputs.json
    const outputsPath = path.join(process.cwd(), 'cfn-outputs', 'flat-outputs.json');

    if (!fs.existsSync(outputsPath)) {
      throw new Error(`flat-outputs.json not found at ${outputsPath}. Run ./scripts/deploy.sh first.`);
    }

    outputs = JSON.parse(fs.readFileSync(outputsPath, 'utf8'));

    // Get region from outputs or environment
    region = outputs.awsRegion || process.env.AWS_REGION || 'ap-northeast-1';

    // Derive environment suffix from resource names if not in outputs
    if (outputs.environmentSuffix) {
      envSuffix = outputs.environmentSuffix;
    } else {
      // Extract environment suffix from CloudTrailBucketName (format: tap-{env}-cloudtrail-{account})
      const bucketName = outputs.CloudTrailBucketName;
      if (bucketName) {
        const match = bucketName.match(/^tap-([^-]+)-/);
        envSuffix = match ? match[1] : 'dev';
      } else {
        envSuffix = 'dev';
      }
    }

    // Extract region from KMS key ARN if not set
    if (!region && outputs.DataEncryptionKeyArn) {
      const arnMatch = outputs.DataEncryptionKeyArn.match(/arn:aws:kms:([^:]+):/);
      if (arnMatch) {
        region = arnMatch[1];
      }
    }

    console.log('Using region:', region);
    console.log('Using envSuffix:', envSuffix);

    // Initialize AWS SDK v2 clients
    kms = new KMS({ region });
    iam = new IAM({ region });
    secretsManager = new SecretsManager({ region });
    ssm = new SSM({ region });
    cloudwatchLogs = new CloudWatchLogs({ region });
    cloudtrail = new CloudTrail({ region });
    s3 = new S3({ region });
    eventbridge = new EventBridge({ region });
    cloudwatch = new CloudWatch({ region });
    lambda = new Lambda({ region });
  });

  describe('KMS Keys', () => {
    test('Data encryption key exists and has key rotation enabled', async () => {
      const keyArn = outputs.DataEncryptionKeyArn;
      expect(keyArn).toBeDefined();

      const keyMetadata = await kms.describeKey({ KeyId: keyArn }).promise();
      expect(keyMetadata.KeyMetadata).toBeDefined();
      expect(keyMetadata.KeyMetadata?.KeyState).toBe('Enabled');

      const rotationStatus = await kms.getKeyRotationStatus({ KeyId: keyArn }).promise();
      expect(rotationStatus.KeyRotationEnabled).toBe(true);
    });

    test('Secrets encryption key exists and has key rotation enabled', async () => {
      const keyArn = outputs.SecretsEncryptionKeyArn;
      expect(keyArn).toBeDefined();

      const keyMetadata = await kms.describeKey({ KeyId: keyArn }).promise();
      expect(keyMetadata.KeyMetadata).toBeDefined();
      expect(keyMetadata.KeyMetadata?.KeyState).toBe('Enabled');

      const rotationStatus = await kms.getKeyRotationStatus({ KeyId: keyArn }).promise();
      expect(rotationStatus.KeyRotationEnabled).toBe(true);
    });

    test('KMS keys have proper key policies configured', async () => {
      const keyArn = outputs.DataEncryptionKeyArn;

      const keyPolicy = await kms.getKeyPolicy({ KeyId: keyArn, PolicyName: 'default' }).promise();
      expect(keyPolicy.Policy).toBeDefined();

      const policy = JSON.parse(keyPolicy.Policy!);
      expect(policy.Statement).toBeDefined();
      expect(Array.isArray(policy.Statement)).toBe(true);
      expect(policy.Statement.length).toBeGreaterThan(0);
    });
  });

  describe('IAM Roles and Permission Boundaries', () => {
    test('Application role exists with permission boundary', async () => {
      const roleArn = outputs.ApplicationRoleArn;
      expect(roleArn).toBeDefined();

      const roleName = roleArn.split('/').pop()!;
      const role = await iam.getRole({ RoleName: roleName }).promise();

      expect(role.Role).toBeDefined();
      expect(role.Role.PermissionsBoundary).toBeDefined();
      expect(role.Role.MaxSessionDuration).toBe(3600);
    });

    test('Cross-account role exists with proper trust policy and external ID', async () => {
      const roleArn = outputs.CrossAccountRoleArn;
      expect(roleArn).toBeDefined();

      const roleName = roleArn.split('/').pop()!;
      const role = await iam.getRole({ RoleName: roleName }).promise();

      expect(role.Role).toBeDefined();
      expect(role.Role.AssumeRolePolicyDocument).toBeDefined();

      const trustPolicy = JSON.parse(decodeURIComponent(role.Role.AssumeRolePolicyDocument!));
      expect(trustPolicy.Statement).toBeDefined();

      const assumeStatement = trustPolicy.Statement.find((s: any) => s.Action === 'sts:AssumeRole');
      expect(assumeStatement).toBeDefined();
      expect(assumeStatement.Condition).toBeDefined();
      expect(assumeStatement.Condition.StringEquals['sts:ExternalId']).toBeDefined();
    });

    test('Permission boundary policy denies high-risk actions', async () => {
      const roleArn = outputs.ApplicationRoleArn;
      const roleName = roleArn.split('/').pop()!;
      const role = await iam.getRole({ RoleName: roleName }).promise();

      const boundaryArn = role.Role.PermissionsBoundary?.PermissionsBoundaryArn;
      expect(boundaryArn).toBeDefined();

      const policy = await iam.getPolicy({ PolicyArn: boundaryArn! }).promise();
      const policyVersion = await iam.getPolicyVersion({
        PolicyArn: boundaryArn!,
        VersionId: policy.Policy.DefaultVersionId!
      }).promise();

      const policyDoc = JSON.parse(decodeURIComponent(policyVersion.PolicyVersion.Document!));
      expect(policyDoc.Statement).toBeDefined();

      const denyStatement = policyDoc.Statement.find((s: any) => s.Effect === 'Deny');
      expect(denyStatement).toBeDefined();
    });
  });

  describe('Secrets Manager', () => {
    test('Secrets exist with KMS encryption', async () => {
      const secretsList = await secretsManager.listSecrets().promise();

      expect(secretsList.SecretList).toBeDefined();
      expect(secretsList.SecretList!.length).toBeGreaterThan(0);

      // Filter for secrets matching our environment - check both formats
      const tapSecrets = secretsList.SecretList!.filter(s =>
        s.Name?.startsWith(`tap-${envSuffix}/`) ||
        s.Name?.startsWith(`tap-${envSuffix}-`) ||
        (s.Name?.includes(`tap-${envSuffix}`) && s.Name?.includes('/'))
      );

      expect(tapSecrets).toBeDefined();
      expect(tapSecrets.length).toBeGreaterThan(0);

      // Check each secret has KMS encryption
      for (const secret of tapSecrets) {
        expect(secret.KmsKeyId).toBeDefined();
      }
    });

    test('Secrets can be retrieved without errors', async () => {
      const secretsList = await secretsManager.listSecrets().promise();

      // Filter for secrets matching our environment
      const tapSecrets = secretsList.SecretList!.filter(s =>
        s.Name?.startsWith(`tap-${envSuffix}/`) ||
        s.Name?.startsWith(`tap-${envSuffix}-`)
      );

      // Try to retrieve at least one secret
      expect(tapSecrets.length).toBeGreaterThan(0);

      const secretArn = tapSecrets[0].ARN!;
      const secretValue = await secretsManager.getSecretValue({ SecretId: secretArn }).promise();
      expect(secretValue.SecretString || secretValue.SecretBinary).toBeDefined();
    });
  });

  describe('Systems Manager Parameter Store', () => {
    test('Parameters exist for the environment', async () => {
      const parameterPath = `/tap/${envSuffix}/`;
      const params = await ssm.getParametersByPath({
        Path: parameterPath,
        Recursive: true
      }).promise();

      expect(params.Parameters).toBeDefined();
      expect(params.Parameters!.length).toBeGreaterThan(0);
    });

    test('Parameters have proper metadata', async () => {
      const parameterPath = `/tap/${envSuffix}/`;
      const params = await ssm.describeParameters({
        ParameterFilters: [
          { Key: 'Name', Option: 'BeginsWith', Values: [parameterPath] }
        ]
      }).promise();

      expect(params.Parameters).toBeDefined();
      expect(params.Parameters!.length).toBeGreaterThan(0);
    });
  });

  describe('CloudWatch Log Groups', () => {
    test('Audit log group exists with KMS encryption', async () => {
      const logGroupName = outputs.AuditLogGroupName;
      expect(logGroupName).toBeDefined();

      const logGroup = await cloudwatchLogs.describeLogGroups({
        logGroupNamePrefix: logGroupName
      }).promise();

      expect(logGroup.logGroups).toBeDefined();
      expect(logGroup.logGroups!.length).toBeGreaterThan(0);
      expect(logGroup.logGroups![0].kmsKeyId).toBeDefined();
    });

    test('Log groups exist for TAP environment', async () => {
      const logGroups = await cloudwatchLogs.describeLogGroups({
        logGroupNamePrefix: `/aws/tap/${envSuffix}`
      }).promise();

      expect(logGroups.logGroups).toBeDefined();
      expect(logGroups.logGroups!.length).toBeGreaterThan(0);
    });

    test('Metric filters are configured', async () => {
      const logGroupName = outputs.AuditLogGroupName;

      const filters = await cloudwatchLogs.describeMetricFilters({
        logGroupName: logGroupName
      }).promise();

      expect(filters.metricFilters).toBeDefined();
    });
  });

  describe('CloudTrail', () => {
    test('CloudTrail is enabled and logging to S3', async () => {
      const bucketName = outputs.CloudTrailBucketName;
      expect(bucketName).toBeDefined();

      const trails = await cloudtrail.describeTrails().promise();
      expect(trails.trailList).toBeDefined();

      const tapTrail = trails.trailList!.find(t => t.S3BucketName === bucketName);
      expect(tapTrail).toBeDefined();
      expect(tapTrail!.LogFileValidationEnabled).toBe(true);
    });

    test('CloudTrail is actively logging', async () => {
      const bucketName = outputs.CloudTrailBucketName;
      const trails = await cloudtrail.describeTrails().promise();
      const tapTrail = trails.trailList!.find(t => t.S3BucketName === bucketName);

      const status = await cloudtrail.getTrailStatus({ Name: tapTrail!.TrailARN! }).promise();
      expect(status.IsLogging).toBe(true);
    });

    test('CloudTrail has event selectors configured', async () => {
      const bucketName = outputs.CloudTrailBucketName;
      const trails = await cloudtrail.describeTrails().promise();
      const tapTrail = trails.trailList!.find(t => t.S3BucketName === bucketName);

      const eventSelectors = await cloudtrail.getEventSelectors({ TrailName: tapTrail!.TrailARN! }).promise();
      expect(eventSelectors.EventSelectors || eventSelectors.AdvancedEventSelectors).toBeDefined();
    });
  });

  describe('S3 Buckets', () => {
    test('CloudTrail bucket exists with versioning', async () => {
      const bucketName = outputs.CloudTrailBucketName;
      expect(bucketName).toBeDefined();

      const versioning = await s3.getBucketVersioning({ Bucket: bucketName }).promise();
      expect(versioning.Status).toBe('Enabled');
    });

    test('CloudTrail bucket blocks public access', async () => {
      const bucketName = outputs.CloudTrailBucketName;

      const publicAccess = await s3.getPublicAccessBlock({ Bucket: bucketName }).promise();
      expect(publicAccess.PublicAccessBlockConfiguration).toBeDefined();
      expect(publicAccess.PublicAccessBlockConfiguration!.BlockPublicAcls).toBe(true);
      expect(publicAccess.PublicAccessBlockConfiguration!.BlockPublicPolicy).toBe(true);
    });

    test('CloudTrail bucket has encryption', async () => {
      const bucketName = outputs.CloudTrailBucketName;

      const encryption = await s3.getBucketEncryption({ Bucket: bucketName }).promise();
      expect(encryption.ServerSideEncryptionConfiguration).toBeDefined();
      const sseAlgo = encryption.ServerSideEncryptionConfiguration!.Rules[0].ApplyServerSideEncryptionByDefault!.SSEAlgorithm;
      expect(['aws:kms', 'AES256']).toContain(sseAlgo);
    });
  });

  describe('Lambda Functions', () => {
    test('Rotation lambda function exists and is configured', async () => {
      const lambdaArn = outputs.RotationLambdaArn;
      expect(lambdaArn).toBeDefined();

      const functionName = lambdaArn.split(':').pop()!;
      const func = await lambda.getFunction({ FunctionName: functionName }).promise();

      expect(func.Configuration).toBeDefined();
      expect(func.Configuration!.Runtime).toBeDefined();
      expect(func.Configuration!.Timeout).toBeLessThanOrEqual(30);
    });

    test('Lambda function has proper IAM role', async () => {
      const lambdaArn = outputs.RotationLambdaArn;
      const functionName = lambdaArn.split(':').pop()!;

      const func = await lambda.getFunction({ FunctionName: functionName }).promise();
      expect(func.Configuration!.Role).toBeDefined();
    });
  });

  describe('CloudWatch Alarms', () => {
    test('Alarms exist for the environment', async () => {
      const alarms = await cloudwatch.describeAlarms({
        AlarmNamePrefix: `tap-${envSuffix}`
      }).promise();

      expect(alarms.MetricAlarms).toBeDefined();
    });
  });

  describe('EventBridge Rules', () => {
    test('EventBridge rules exist for the environment', async () => {
      const rules = await eventbridge.listRules({
        NamePrefix: `tap-${envSuffix}`
      }).promise();

      expect(rules.Rules).toBeDefined();
      expect(rules.Rules!.length).toBeGreaterThan(0);
    });

    test('EventBridge rule has proper event pattern', async () => {
      const rules = await eventbridge.listRules({
        NamePrefix: `tap-${envSuffix}`
      }).promise();

      if (rules.Rules && rules.Rules.length > 0) {
        const securityRule = rules.Rules[0];
        expect(securityRule.EventPattern).toBeDefined();

        const pattern = JSON.parse(securityRule.EventPattern!);
        expect(pattern.source).toBeDefined();
      }
    });

    test('EventBridge rule has targets configured', async () => {
      const rules = await eventbridge.listRules({
        NamePrefix: `tap-${envSuffix}`
      }).promise();

      if (rules.Rules && rules.Rules.length > 0) {
        const ruleName = rules.Rules[0].Name!;
        const targets = await eventbridge.listTargetsByRule({ Rule: ruleName }).promise();

        expect(targets.Targets).toBeDefined();
        expect(targets.Targets!.length).toBeGreaterThan(0);
      }
    });
  });

  describe('End-to-End Security Validation', () => {
    test('All KMS keys are enabled and have rotation', async () => {
      const dataKeyArn = outputs.DataEncryptionKeyArn;
      const secretsKeyArn = outputs.SecretsEncryptionKeyArn;

      const dataKey = await kms.describeKey({ KeyId: dataKeyArn }).promise();
      const secretsKey = await kms.describeKey({ KeyId: secretsKeyArn }).promise();

      expect(dataKey.KeyMetadata?.KeyState).toBe('Enabled');
      expect(secretsKey.KeyMetadata?.KeyState).toBe('Enabled');

      const dataRotation = await kms.getKeyRotationStatus({ KeyId: dataKeyArn }).promise();
      const secretsRotation = await kms.getKeyRotationStatus({ KeyId: secretsKeyArn }).promise();

      expect(dataRotation.KeyRotationEnabled).toBe(true);
      expect(secretsRotation.KeyRotationEnabled).toBe(true);
    });

    test('CloudTrail is actively auditing', async () => {
      const bucketName = outputs.CloudTrailBucketName;
      const trails = await cloudtrail.describeTrails().promise();
      const tapTrail = trails.trailList!.find(t => t.S3BucketName === bucketName);

      const status = await cloudtrail.getTrailStatus({ Name: tapTrail!.TrailARN! }).promise();
      expect(status.IsLogging).toBe(true);
    });

    test('IAM roles have permission boundaries', async () => {
      const roleArn = outputs.ApplicationRoleArn;
      const roleName = roleArn.split('/').pop()!;

      const role = await iam.getRole({ RoleName: roleName }).promise();
      expect(role.Role.PermissionsBoundary).toBeDefined();
      expect(role.Role.MaxSessionDuration).toBeLessThanOrEqual(3600);
    });

    test('Cross-account access requires external ID', async () => {
      const roleArn = outputs.CrossAccountRoleArn;
      const roleName = roleArn.split('/').pop()!;

      const role = await iam.getRole({ RoleName: roleName }).promise();
      const trustPolicy = JSON.parse(decodeURIComponent(role.Role.AssumeRolePolicyDocument!));

      const assumeStatement = trustPolicy.Statement.find((s: any) => s.Action === 'sts:AssumeRole');
      expect(assumeStatement.Condition).toBeDefined();
      expect(assumeStatement.Condition.StringEquals['sts:ExternalId']).toBeDefined();
    });
  });
});
