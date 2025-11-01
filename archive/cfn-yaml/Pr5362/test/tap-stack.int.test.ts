import fs from 'fs';
import path from 'path';

// AWS SDK v3 clients & commands
import {
  CloudWatchLogsClient,
  DescribeLogGroupsCommand,
} from '@aws-sdk/client-cloudwatch-logs';
import {
  DescribeRuleCommand,
  EventBridgeClient,
} from '@aws-sdk/client-eventbridge';
import {
  DescribeKeyCommand,
  GetKeyRotationStatusCommand,
  KMSClient,
  ListAliasesCommand,
} from '@aws-sdk/client-kms';
import {
  GetFunctionCommand,
  InvokeCommand,
  LambdaClient,
} from '@aws-sdk/client-lambda';
import {
  GetBucketEncryptionCommand,
  GetBucketLifecycleConfigurationCommand,
  GetBucketVersioningCommand,
  GetPublicAccessBlockCommand,
  HeadBucketCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import {
  GetTopicAttributesCommand,
  SNSClient,
} from '@aws-sdk/client-sns';

// -------------------------------
// Load outputs & resolve region
// -------------------------------
const outputsPath = path.join(process.cwd(), 'cfn-outputs', 'flat-outputs.json');
const outputs = JSON.parse(fs.readFileSync(outputsPath, 'utf8'));

// Prefer lib/AWS_REGION like your reference suite
let awsRegion = 'eu-central-1';
try {
  const regionFile = path.join(process.cwd(), 'lib', 'AWS_REGION');
  if (fs.existsSync(regionFile)) {
    awsRegion = fs.readFileSync(regionFile, 'utf8').trim() || awsRegion;
  }
} catch {
  // ignore; fallback handled below
}
const regionFromArn = (arn?: string) => {
  if (!arn || typeof arn !== 'string') return undefined;
  const parts = arn.split(':');
  return parts[3];
};
awsRegion =
  process.env.AWS_REGION ||
  awsRegion ||
  regionFromArn(outputs.AnalyzerFunctionArn) ||
  regionFromArn(outputs.PeriodicScanFunctionArn) ||
  'eu-central-1';

// -------------------------------
// v3 clients (region-scoped)
// -------------------------------
const s3 = new S3Client({ region: awsRegion });
const lambda = new LambdaClient({ region: awsRegion });
const sns = new SNSClient({ region: awsRegion });
const kms = new KMSClient({ region: awsRegion });
const logs = new CloudWatchLogsClient({ region: awsRegion });
const events = new EventBridgeClient({ region: awsRegion });

// -------------------------------
// Helpers
// -------------------------------
const functionNameFromArn = (arn: string) => arn.split(':').slice(-1)[0]; // arn:...:function:NAME
const ruleNameFromArn = (arn: string) => {
  const idx = arn.lastIndexOf('/');
  return idx >= 0 ? arn.slice(idx + 1) : arn;
};

jest.setTimeout(180000);

describe('Compliance Validation System — Live Integration (AWS SDK v3)', () => {
  test('flat outputs must include required keys', () => {
    const required = [
      'KMSKeyId',
      'KMSKeyAlias',
      'ComplianceReportsBucketArn',
      'ComplianceReportsBucketName',
      'AnalysisResultsBucketArn',
      'AnalysisResultsBucketName',
      'AnalyzerFunctionArn',
      'PeriodicScanFunctionArn',
      'ComplianceViolationsTopicArn',
      'StackChangeEventRuleArn',
      'PeriodicScanScheduleRuleArn',
      'ReportsBaseURI',
    ];
    required.forEach((k) => {
      expect(outputs[k]).toBeDefined();
      expect(String(outputs[k]).length).toBeGreaterThan(0);
    });
  });

  // -------------------------------
  // S3 Buckets
  // -------------------------------
  describe('S3 Buckets', () => {
    test('Compliance Reports bucket exists, KMS-encrypted, versioned, public-blocked, lifecycle→GLACIER@90d', async () => {
      const bucket = outputs.ComplianceReportsBucketName as string;

      // Exists
      await s3.send(new HeadBucketCommand({ Bucket: bucket }));

      // Encryption (KMS)
      const enc = await s3.send(new GetBucketEncryptionCommand({ Bucket: bucket }));
      const rule =
        enc.ServerSideEncryptionConfiguration?.Rules?.[0]?.ApplyServerSideEncryptionByDefault;
      expect(rule?.SSEAlgorithm).toBe('aws:kms');
      expect(rule?.KMSMasterKeyID).toBeDefined();

      // Versioning
      const ver = await s3.send(new GetBucketVersioningCommand({ Bucket: bucket }));
      expect(ver.Status).toBe('Enabled');

      // Public access block
      const pab = await s3.send(new GetPublicAccessBlockCommand({ Bucket: bucket }));
      const cfg = pab.PublicAccessBlockConfiguration!;
      expect(cfg.BlockPublicAcls).toBe(true);
      expect(cfg.BlockPublicPolicy).toBe(true);
      expect(cfg.IgnorePublicAcls).toBe(true);
      expect(cfg.RestrictPublicBuckets).toBe(true);

      // Lifecycle -> GLACIER after 90 days (current & noncurrent)
      const lc = await s3.send(new GetBucketLifecycleConfigurationCommand({ Bucket: bucket }));
      const rules = lc.Rules || [];
      expect(rules.length).toBeGreaterThan(0);

      // Current-object transition uses 'Days'
      const hasCurrentGlacier90 = rules.some((r) =>
        (r.Transitions || []).some(
          (t) =>
            Number(t.Days) === 90 &&
            (t.StorageClass === 'GLACIER' || t.StorageClass === 'GLACIER_IR')
        )
      );
      expect(hasCurrentGlacier90).toBe(true);

      // Noncurrent-version transition uses 'NoncurrentDays'
      const hasNoncurrentGlacier90 = rules.some((r) =>
        (r.NoncurrentVersionTransitions || []).some(
          (t) =>
            Number(t.NoncurrentDays) === 90 &&
            (t.StorageClass === 'GLACIER' || t.StorageClass === 'GLACIER_IR')
        )
      );
      expect(hasNoncurrentGlacier90).toBe(true);
    });

    test('Analysis Results bucket exists, KMS-encrypted, versioned, lifecycle→GLACIER@90d', async () => {
      const bucket = outputs.AnalysisResultsBucketName as string;

      // Exists
      await s3.send(new HeadBucketCommand({ Bucket: bucket }));

      // Encryption (KMS)
      const enc = await s3.send(new GetBucketEncryptionCommand({ Bucket: bucket }));
      const rule =
        enc.ServerSideEncryptionConfiguration?.Rules?.[0]?.ApplyServerSideEncryptionByDefault;
      expect(rule?.SSEAlgorithm).toBe('aws:kms');
      expect(rule?.KMSMasterKeyID).toBeDefined();

      // Versioning
      const ver = await s3.send(new GetBucketVersioningCommand({ Bucket: bucket }));
      expect(ver.Status).toBe('Enabled');

      // Lifecycle -> GLACIER after 90 days (current & noncurrent)
      const lc = await s3.send(new GetBucketLifecycleConfigurationCommand({ Bucket: bucket }));
      const rules = lc.Rules || [];
      expect(rules.length).toBeGreaterThan(0);

      // Current-object transition -> 'Days'
      const hasCurrentGlacier90 = rules.some((r) =>
        (r.Transitions || []).some(
          (t) =>
            Number(t.Days) === 90 &&
            (t.StorageClass === 'GLACIER' || t.StorageClass === 'GLACIER_IR')
        )
      );
      expect(hasCurrentGlacier90).toBe(true);

      // Noncurrent-version transition -> 'NoncurrentDays'
      const hasNoncurrentGlacier90 = rules.some((r) =>
        (r.NoncurrentVersionTransitions || []).some(
          (t) =>
            Number(t.NoncurrentDays) === 90 &&
            (t.StorageClass === 'GLACIER' || t.StorageClass === 'GLACIER_IR')
        )
      );
      expect(hasNoncurrentGlacier90).toBe(true);
    });
  });

  // -------------------------------
  // Lambda Functions
  // -------------------------------
  describe('Lambda Functions', () => {
    test('Analyzer Lambda configured correctly', async () => {
      const arn = outputs.AnalyzerFunctionArn as string;
      const name = functionNameFromArn(arn);

      const resp = await lambda.send(new GetFunctionCommand({ FunctionName: name }));
      const cfg = resp.Configuration!;
      expect(cfg.Runtime).toBe('python3.12');
      expect(cfg.Handler).toBe('index.handler');
      expect(cfg.Timeout).toBe(300);
      expect(cfg.MemorySize).toBe(1024);

      const env = cfg.Environment?.Variables || {};
      expect(env?.COMPLIANCE_BUCKET).toBeDefined();
      expect(env?.ANALYSIS_BUCKET).toBeDefined();
      expect(env?.SNS_TOPIC_ARN).toBeDefined();

      // Log group exists with retention 365
      const lgName = `/aws/lambda/${name}`;
      const lgs = await logs.send(new DescribeLogGroupsCommand({ logGroupNamePrefix: lgName }));
      const lg = (lgs.logGroups || []).find((g) => g.logGroupName === lgName);
      expect(lg).toBeDefined();
      expect(lg?.retentionInDays).toBe(365);
    });

    test('Periodic Scan Lambda configured correctly', async () => {
      const arn = outputs.PeriodicScanFunctionArn as string;
      const name = functionNameFromArn(arn);

      const resp = await lambda.send(new GetFunctionCommand({ FunctionName: name }));
      const cfg = resp.Configuration!;
      expect(cfg.Runtime).toBe('python3.12');
      expect(cfg.Handler).toBe('index.handler');
      expect(cfg.Timeout).toBe(300);
      expect(cfg.MemorySize).toBe(512);

      const env = cfg.Environment?.Variables || {};
      expect(env?.ANALYZER_FUNCTION_ARN).toBeDefined();

      const lgName = `/aws/lambda/${name}`;
      const lgs = await logs.send(new DescribeLogGroupsCommand({ logGroupNamePrefix: lgName }));
      const lg = (lgs.logGroups || []).find((g) => g.logGroupName === lgName);
      expect(lg).toBeDefined();
      expect(lg?.retentionInDays).toBe(365);
    });
  });

  // -------------------------------
  // SNS Topic
  // -------------------------------
  describe('SNS Topic', () => {
    test('Compliance Violations topic exists and is KMS-protected with display name', async () => {
      const topicArn = outputs.ComplianceViolationsTopicArn as string;
      const resp = await sns.send(new GetTopicAttributesCommand({ TopicArn: topicArn }));
      expect(resp.Attributes?.KmsMasterKeyId).toBeDefined();
      expect(resp.Attributes?.DisplayName).toBe('Compliance Violations Alert');
    });
  });

  // -------------------------------
  // KMS Key
  // -------------------------------
  describe('KMS Key', () => {
    test('Customer-managed key is Enabled, rotated, and aliased', async () => {
      const keyId = outputs.KMSKeyId as string;
      const aliasName = outputs.KMSKeyAlias as string; // e.g., alias/compliance-validation-key

      const desc = await kms.send(new DescribeKeyCommand({ KeyId: keyId }));
      const meta = desc.KeyMetadata!;
      expect(meta.KeyState).toBe('Enabled');
      expect(meta.KeyUsage).toBe('ENCRYPT_DECRYPT');
      expect(meta.KeySpec).toBe('SYMMETRIC_DEFAULT');

      const rot = await kms.send(new GetKeyRotationStatusCommand({ KeyId: keyId }));
      expect(rot.KeyRotationEnabled).toBe(true);

      // Alias attached to this key
      const aliases = await kms.send(new ListAliasesCommand({ KeyId: keyId }));
      const found =
        (aliases.Aliases || []).find((a) => a.AliasName === aliasName) ||
        (await kms.send(new ListAliasesCommand({}))).Aliases?.find((a) => a.AliasName === aliasName);
      expect(found).toBeDefined();
      expect(found?.TargetKeyId).toBe(meta.KeyId);
    });
  });

  // -------------------------------
  // EventBridge Rules
  // -------------------------------
  describe('EventBridge Rules', () => {
    test('Stack change rule exists and ENABLED with CloudFormation source', async () => {
      const arn = outputs.StackChangeEventRuleArn as string;
      const name = ruleNameFromArn(arn);
      const rule = await events.send(new DescribeRuleCommand({ Name: name }));
      expect(rule.State).toBe('ENABLED');
      expect(rule.EventPattern).toContain('aws.cloudformation');
    });

    test('Periodic scan rule exists, ENABLED, with schedule expression', async () => {
      const arn = outputs.PeriodicScanScheduleRuleArn as string;
      const name = ruleNameFromArn(arn);
      const rule = await events.send(new DescribeRuleCommand({ Name: name }));
      expect(rule.State).toBe('ENABLED');
      expect(rule.ScheduleExpression).toBeDefined();
    });
  });

  // -------------------------------
  // End-to-End Lambda Invocations
  // -------------------------------
  describe('End-to-End workflow (Lambda)', () => {
    test('Analyzer function processes a test event and returns a report stub', async () => {
      const arn = outputs.AnalyzerFunctionArn as string;
      const name = functionNameFromArn(arn);

      const invoke = await lambda.send(
        new InvokeCommand({
          FunctionName: name,
          InvocationType: 'RequestResponse',
          Payload: Buffer.from(
            JSON.stringify({ source: 'test', triggerType: 'manual', testExecution: true })
          ),
        })
      );

      expect(invoke.StatusCode).toBe(200);
      const payload = JSON.parse(Buffer.from(invoke.Payload ?? []).toString('utf8') || '{}');
      expect(payload.statusCode).toBe(200);

      const body = JSON.parse(payload.body);
      expect(typeof body.evaluationId).toBe('string');
      expect(typeof body.findingsCount).toBe('number');
      expect(typeof body.violationsCount).toBe('number');
    });

    test('Periodic scan function acknowledges and initiates analyzer', async () => {
      const arn = outputs.PeriodicScanFunctionArn as string;
      const name = functionNameFromArn(arn);

      const invoke = await lambda.send(
        new InvokeCommand({
          FunctionName: name,
          InvocationType: 'RequestResponse',
          Payload: Buffer.from(
            JSON.stringify({ source: 'scheduled', triggerType: 'test' })
          ),
        })
      );

      expect(invoke.StatusCode).toBe(200);
      const payload = JSON.parse(Buffer.from(invoke.Payload ?? []).toString('utf8') || '{}');
      expect(payload.statusCode).toBe(200);

      const body = JSON.parse(payload.body);
      expect(body.message).toBe('Periodic scan initiated');
    });
  });
});
