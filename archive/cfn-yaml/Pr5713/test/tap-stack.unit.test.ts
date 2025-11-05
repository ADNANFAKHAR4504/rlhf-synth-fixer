// test/tap-stack.unit.test.ts
import * as fs from 'fs';
import * as path from 'path';

type CfnTemplate = {
  AWSTemplateFormatVersion?: string;
  Description?: string;
  Parameters?: Record<string, any>;
  Resources?: Record<string, any>;
  Outputs?: Record<string, any>;
};

function loadTemplate(): CfnTemplate {
  const jsonPath = path.resolve(__dirname, '../lib/TapStack.json');
  const raw = fs.readFileSync(jsonPath, 'utf8');
  return JSON.parse(raw);
}

function fileExists(relPath: string): boolean {
  const p = path.resolve(__dirname, relPath);
  try {
    fs.accessSync(p, fs.constants.R_OK);
    return true;
  } catch {
    return false;
  }
}

function getResourceByLogicalId(tpl: CfnTemplate, id: string) {
  return tpl.Resources?.[id];
}

function getResourcesByType(tpl: CfnTemplate, type: string) {
  return Object.entries(tpl.Resources ?? {}).filter(
    ([, v]: [string, any]) => v.Type === type
  );
}

describe('TapStack — CloudFormation unit tests', () => {
  const template = loadTemplate();

  // 1. Template basics
  it('1) has a valid AWSTemplateFormatVersion and Description', () => {
    expect(template.AWSTemplateFormatVersion).toBeDefined();
    expect(template.Description).toBeDefined();
    expect(typeof template.Description).toBe('string');
  });

  // 2. Files present
  it('2) YAML file exists alongside JSON (../lib/TapStack.yml)', () => {
    expect(fileExists('../lib/TapStack.yml')).toBe(true);
  });

  // 3. Parameters presence
  it('3) defines required Parameters', () => {
    const p = template.Parameters ?? {};
    expect(p.EnvironmentSuffix).toBeDefined();
    expect(p.SecurityAlertEmail).toBeDefined();
    expect(p.AuditBucketPrefix).toBeDefined();
    expect(p.LambdaMemoryMB).toBeDefined();
    expect(p.LambdaTimeoutSeconds).toBeDefined();
    expect(p.EventArchiveRetentionDays).toBeDefined();
    expect(p.LogRetentionDays).toBeDefined();
  });

  // 4. Parameter defaults
  it('4) has sane defaults for key parameters', () => {
    const p = template.Parameters!;
    expect(p.EnvironmentSuffix.Default).toBeDefined();
    expect(p.SecurityAlertEmail.Default).toBeDefined();
    expect(p.AuditBucketPrefix.Default).toBeDefined();
    expect(p.LambdaMemoryMB.Default).toBeGreaterThanOrEqual(128);
    expect(p.LambdaTimeoutSeconds.Default).toBeGreaterThanOrEqual(10);
    expect(p.EventArchiveRetentionDays.Default).toBeGreaterThan(0);
    expect(p.LogRetentionDays.Default).toBeDefined();
  });

  // 5. S3 Bucket exists
  it('5) creates the audit S3 bucket (AES256, versioned, PAB enabled)', () => {
    const bucket = getResourceByLogicalId(template, 'AuditBucket');
    expect(bucket?.Type).toBe('AWS::S3::Bucket');
    const props = bucket?.Properties ?? {};
    expect(props.VersioningConfiguration?.Status).toBe('Enabled');
    const enc = props.BucketEncryption?.ServerSideEncryptionConfiguration?.[0]?.ServerSideEncryptionByDefault?.SSEAlgorithm;
    expect(enc).toBe('AES256');
    expect(props.PublicAccessBlockConfiguration?.BlockPublicAcls).toBe(true);
    expect(props.PublicAccessBlockConfiguration?.BlockPublicPolicy).toBe(true);
    expect(props.PublicAccessBlockConfiguration?.IgnorePublicAcls).toBe(true);
    expect(props.PublicAccessBlockConfiguration?.RestrictPublicBuckets).toBe(true);
  });

  // 6. S3 Bucket Policy denies insecure transport
  it('6) bucket policy denies insecure transport', () => {
    const bp = getResourceByLogicalId(template, 'AuditBucketPolicy');
    expect(bp?.Type).toBe('AWS::S3::BucketPolicy');
    const stmts = bp?.Properties?.PolicyDocument?.Statement ?? [];
    const denyInsecure = stmts.find((s: any) => s.Sid === 'DenyInsecureTransport');
    expect(denyInsecure?.Effect).toBe('Deny');
    expect(denyInsecure?.Condition?.Bool?.['aws:SecureTransport']).toBe('false');
  });

  // 7. GuardDuty detector enabled
  it('7) enables GuardDuty with S3Logs and EKS audit logs', () => {
    const det = getResourceByLogicalId(template, 'GuardDutyDetector');
    expect(det?.Type).toBe('AWS::GuardDuty::Detector');
    expect(det?.Properties?.Enable).toBe(true);
    expect(det?.Properties?.DataSources?.S3Logs?.Enable).toBe(true);
    expect(det?.Properties?.DataSources?.Kubernetes?.AuditLogs?.Enable).toBe(true);
  });

  // 8. SNS topic and email subscription
  it('8) provisions SNS topic and email subscription', () => {
    const [topic] = getResourcesByType(template, 'AWS::SNS::Topic');
    const sub = getResourceByLogicalId(template, 'AlertsSubscriptionEmail');
    expect(topic).toBeDefined();
    expect(sub?.Type).toBe('AWS::SNS::Subscription');
    expect(sub?.Properties?.Protocol).toBe('email');
    expect(sub?.Properties?.TopicArn).toBeDefined();
  });

  // 9. Log group exists with parameterized retention
  it('9) creates explicit log group with retention days parameter', () => {
    const lg = getResourceByLogicalId(template, 'EnricherLogGroup');
    expect(lg?.Type).toBe('AWS::Logs::LogGroup');
    expect(lg?.Properties?.RetentionInDays).toEqual({ Ref: 'LogRetentionDays' });
    expect(typeof lg?.Properties?.LogGroupName?.['Fn::Sub']).toBe('string');
  });

  // 10. IAM role trust policy (Lambda assume role)
  it('10) IAM role allows lambda.amazonaws.com to assume', () => {
    const role = getResourceByLogicalId(template, 'EnricherRole');
    expect(role?.Type).toBe('AWS::IAM::Role');
    const stmt = role?.Properties?.AssumeRolePolicyDocument?.Statement ?? [];
    const allow = stmt.find((s: any) => s.Effect === 'Allow' && s.Principal?.Service === 'lambda.amazonaws.com');
    expect(allow?.Action).toBe('sts:AssumeRole');
  });

  // 11. IAM policy logs write scoped to specific log group ARN
  it('11) logs write policy is scoped to specific log group ARN', () => {
    const role = getResourceByLogicalId(template, 'EnricherRole');
    const pols = role?.Properties?.Policies ?? [];
    const logsPol = pols.find((p: any) => p.PolicyName === 'logs-write-specific');
    const resArn = logsPol?.PolicyDocument?.Statement?.[0]?.Resource;
    expect(typeof resArn?.['Fn::Sub']).toBe('string');
    expect(resArn['Fn::Sub']).toContain('/aws/lambda/guardduty-enricher-${EnvironmentSuffix}');
  });

  // 12. SNS publish policy is restricted to AlertsTopic ARN
  it('12) SNS publish policy targets only the AlertsTopic', () => {
    const role = getResourceByLogicalId(template, 'EnricherRole');
    const pols = role?.Properties?.Policies ?? [];
    const snsPol = pols.find((p: any) => p.PolicyName === 'sns-publish-alerts');
    expect(snsPol?.PolicyDocument?.Statement?.[0]?.Action).toBe('sns:Publish');
    const res = snsPol?.PolicyDocument?.Statement?.[0]?.Resource;
    expect(res).toBeDefined();
    // It should Ref AlertsTopic
    expect(res?.Ref).toBe('AlertsTopic');
  });

  // 13. S3 PutObject policy is constrained to findings prefix
  it('13) S3 PutObject permission constrained to findings/*', () => {
    const role = getResourceByLogicalId(template, 'EnricherRole');
    const pols = role?.Properties?.Policies ?? [];
    const s3Pol = pols.find((p: any) => p.PolicyName === 's3-write-audit');
    const stmts = s3Pol?.PolicyDocument?.Statement ?? [];
    const putStmt = stmts.find((s: any) => (Array.isArray(s.Action) ? s.Action.includes('s3:PutObject') : s.Action === 's3:PutObject'));
    const res = putStmt?.Resource;
    expect(typeof res?.['Fn::Sub']).toBe('string');
    expect(res['Fn::Sub']).toContain('${AuditBucket}/findings/*');
  });

  // 14. Lambda function configured correctly
  it('14) Lambda function runtime/handler/memory/timeout are parameterized', () => {
    const fn = getResourceByLogicalId(template, 'EnricherFunction');
    expect(fn?.Type).toBe('AWS::Lambda::Function');
    expect(fn?.Properties?.Runtime).toBe('python3.12');
    expect(fn?.Properties?.Handler).toBe('index.handler');
    expect(fn?.Properties?.MemorySize).toEqual({ Ref: 'LambdaMemoryMB' });
    expect(fn?.Properties?.Timeout).toEqual({ Ref: 'LambdaTimeoutSeconds' });
  });

  // 15. Lambda environment variables present
  it('15) Lambda env vars include SNS topic ARN, bucket name, and env suffix', () => {
    const vars = getResourceByLogicalId(template, 'EnricherFunction')?.Properties?.Environment?.Variables ?? {};
    expect(vars.ALERTS_TOPIC_ARN).toEqual({ Ref: 'AlertsTopic' });
    expect(vars.AUDIT_BUCKET_NAME).toEqual({ Ref: 'AuditBucket' });
    expect(vars.ENVIRONMENT_SUFFIX).toEqual({ Ref: 'EnvironmentSuffix' });
  });

  // 16. EventBridge rule exists with proper pattern
  it('16) EventBridge rule filters MEDIUM and HIGH severities', () => {
    const rule = getResourceByLogicalId(template, 'FindingsRule');
    expect(rule?.Type).toBe('AWS::Events::Rule');
    const pattern = rule?.Properties?.EventPattern ?? {};
    expect(pattern.source).toEqual(['aws.guardduty']);
    expect(pattern['detail-type']).toEqual(['GuardDuty Finding']);
    const sev = pattern.detail?.severity ?? [];
    // Expect two numeric clauses (>=7) and (>=4,<7)
    expect(sev.length).toBe(2);
    expect(sev[0].numeric).toEqual([">=", 7]);
    expect(sev[1].numeric).toEqual([">=", 4, "<", 7]);
  });

  // 17. EventBridge rule targets Lambda
  it('17) EventBridge rule targets the Lambda function', () => {
    const rule = getResourceByLogicalId(template, 'FindingsRule');
    const targets = rule?.Properties?.Targets ?? [];
    expect(targets.length).toBeGreaterThan(0);
    const t0Arn = targets[0]?.Arn;
    expect(t0Arn?.['Fn::GetAtt']).toEqual(['EnricherFunction', 'Arn']);
  });

  // 18. Lambda permission allows only this rule to invoke
  it('18) Lambda permission scoped to FindingsRule ARN', () => {
    const perm = getResourceByLogicalId(template, 'FindingsRuleInvokePermission');
    expect(perm?.Type).toBe('AWS::Lambda::Permission');
    expect(perm?.Properties?.Principal).toBe('events.amazonaws.com');
    const srcArn = perm?.Properties?.SourceArn;
    expect(srcArn?.['Fn::GetAtt']).toEqual(['FindingsRule', 'Arn']);
  });

  // 19. EventBridge archive configured and parameterized
  it('19) EventBridge archive exists with parameterized retention days', () => {
    const arch = getResourceByLogicalId(template, 'FindingsArchive');
    expect(arch?.Type).toBe('AWS::Events::Archive');
    expect(arch?.Properties?.RetentionDays).toEqual({ Ref: 'EventArchiveRetentionDays' });
    const arnSub = arch?.Properties?.SourceArn?.['Fn::Sub'];
    expect(typeof arnSub).toBe('string');
    expect(arnSub).toContain('event-bus/default');
  });

  // 20. Topic name and function name include EnvironmentSuffix
  it('20) names include EnvironmentSuffix for multi-env safety', () => {
    const topic = getResourceByLogicalId(template, 'AlertsTopic');
    const fn = getResourceByLogicalId(template, 'EnricherFunction');
    expect(topic?.Properties?.TopicName?.['Fn::Sub']).toContain('${EnvironmentSuffix}');
    expect(fn?.Properties?.FunctionName?.['Fn::Sub']).toContain('${EnvironmentSuffix}');
  });

  // 21. Outputs present and export names include EnvironmentSuffix
  it('21) outputs include required exports with env suffix', () => {
    const o = template.Outputs ?? {};
    const required = [
      'GuardDutyDetectorId',
      'GuardDutyS3ProtectionStatus',
      'GuardDutyEKSAuditLogsStatus',
      'FindingRuleArn',
      'EventArchiveArn',
      'AuditBucketName',
      'SnsTopicArn',
      'LambdaFunctionName',
      'LambdaLogGroupName'
    ];
    required.forEach(k => {
      expect(o[k]).toBeDefined();
      const exp = o[k].Export?.Name;
      if (exp?.['Fn::Sub']) {
        expect(exp['Fn::Sub']).toContain('${EnvironmentSuffix}');
      } else {
        // Some exports might be static strings with env suffix concatenated
        expect(typeof exp).toBe('string');
      }
    });
  });

  // 22. Lambda Role policies avoid wildcard Resource for write actions
  it('22) write actions (sns:Publish, s3:PutObject, logs:PutLogEvents) are not wildcard Resource', () => {
    const role = getResourceByLogicalId(template, 'EnricherRole');
    const pols = role?.Properties?.Policies ?? [];
    const allStmts = pols.flatMap((p: any) => p.PolicyDocument?.Statement ?? []);

    const writeActionsToCheck = [
      'sns:Publish',
      's3:PutObject',
      'logs:PutLogEvents'
    ];

    writeActionsToCheck.forEach(action => {
      const stmts = allStmts.filter((s: any) => {
        const acts = Array.isArray(s.Action) ? s.Action : [s.Action];
        return acts.includes(action);
      });
      stmts.forEach((s: any) => {
        expect(s.Resource).toBeDefined();
        // Ensure it's not a literal "*"
        expect(s.Resource).not.toBe('*');
      });
    });
  });

  // 23. SNS subscription endpoint references the email parameter
  it('23) SNS subscription uses SecurityAlertEmail parameter', () => {
    const sub = getResourceByLogicalId(template, 'AlertsSubscriptionEmail');
    expect(sub?.Properties?.Endpoint).toEqual({ Ref: 'SecurityAlertEmail' });
  });

  // 24. Bucket name pattern uses prefix + EnvironmentSuffix + AccountId
  it('24) bucket name composes prefix, env suffix, and account id', () => {
    const b = getResourceByLogicalId(template, 'AuditBucket');
    const nameSub = b?.Properties?.BucketName?.['Fn::Sub'];
    expect(typeof nameSub).toBe('string');
    expect(nameSub).toContain('${AuditBucketPrefix}');
    expect(nameSub).toContain('${EnvironmentSuffix}');
    expect(nameSub).toContain('${AWS::AccountId}');
  });

  // 25. Detector is tagged for compliance context
  it('25) GuardDuty detector includes standard tags', () => {
    const det = getResourceByLogicalId(template, 'GuardDutyDetector');
    const tags = det?.Properties?.Tags ?? [];
    const keys = tags.map((t: any) => t.Key);
    expect(keys).toEqual(expect.arrayContaining(['Environment', 'Owner', 'Classification']));
  });
});
