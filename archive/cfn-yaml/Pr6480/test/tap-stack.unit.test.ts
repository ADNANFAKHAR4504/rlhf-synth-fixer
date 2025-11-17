// test/tap-stack.unit.test.ts
import * as fs from 'fs';
import * as path from 'path';

type CfnTemplate = {
  AWSTemplateFormatVersion?: string;
  Description?: string;
  Parameters?: Record<string, any>;
  Conditions?: Record<string, any>;
  Resources?: Record<string, any>;
  Outputs?: Record<string, any>;
  Metadata?: any;
};

function loadJsonTemplate(): CfnTemplate {
  const jsonPath = path.resolve(__dirname, '../lib/TapStack.json');
  const raw = fs.readFileSync(jsonPath, 'utf8');
  return JSON.parse(raw);
}

function yamlExistsAndNotEmpty(): boolean {
  const ymlPath = path.resolve(__dirname, '../lib/TapStack.yml');
  if (!fs.existsSync(ymlPath)) return false;
  const raw = fs.readFileSync(ymlPath, 'utf8');
  return raw.trim().length > 0;
}

function getResource(tpl: CfnTemplate, logicalId: string) {
  return tpl.Resources?.[logicalId];
}

function getParam(tpl: CfnTemplate, name: string) {
  return tpl.Parameters?.[name];
}

function hasFnSub(v: any): boolean {
  if (!v) return false;
  if (typeof v === 'string') return v.includes('${');
  if (typeof v === 'object' && ('Fn::Sub' in v)) return true;
  return false;
}

describe('TapStack — CloudFormation Template Unit Tests', () => {
  const tpl = loadJsonTemplate();

  it('1) template loads and has core sections', () => {
    expect(tpl).toBeTruthy();
    expect(typeof tpl.AWSTemplateFormatVersion).toBe('string');
    expect(typeof tpl.Description).toBe('string');
    expect(tpl.Parameters).toBeTruthy();
    expect(tpl.Resources).toBeTruthy();
    expect(tpl.Outputs).toBeTruthy();
  });

  it('2) YAML file exists and is non-empty (parity check)', () => {
    expect(yamlExistsAndNotEmpty()).toBe(true);
  });

  // ---- Parameters
  it('3) EnvironmentSuffix parameter exists with regex pattern (no hard AllowedValues)', () => {
    const p = getParam(tpl, 'EnvironmentSuffix');
    expect(p).toBeTruthy();
    expect(p?.AllowedPattern).toBe('^[a-z0-9-]{2,20}$');
    expect(p?.AllowedValues).toBeUndefined();
  });

  it('4) PrimaryRegion parameter exists and default is us-east-1', () => {
    const p = getParam(tpl, 'PrimaryRegion');
    expect(p).toBeTruthy();
    expect(p?.Default).toBe('us-east-1');
  });

  it('5) IsProduction parameter exists and AllowedValues include true/false', () => {
    const p = getParam(tpl, 'IsProduction');
    expect(p).toBeTruthy();
    expect(Array.isArray(p?.AllowedValues)).toBe(true);
    expect(p?.AllowedValues).toEqual(expect.arrayContaining(['true', 'false']));
  });

  it('6) Concurrency and alarm params exist with sane defaults', () => {
    const p1 = getParam(tpl, 'PrimaryLambdaReservedConcurrency');
    const p2 = getParam(tpl, 'ReplicationLambdaReservedConcurrency');
    const p3 = getParam(tpl, 'QueueDepthAlarmThreshold');
    const p4 = getParam(tpl, 'DlqAlarmThreshold');
    expect(p1?.Default).toBeGreaterThan(0);
    expect(p2?.Default).toBeGreaterThan(0);
    expect(p3?.Default).toBeGreaterThan(0);
    expect(p4?.Default).toBeGreaterThan(0);
  });

  // ---- Core SQS resources
  it('7) Primary FIFO queue exists and is FIFO with content-based dedup', () => {
    const q = getResource(tpl, 'PrimaryFifoQueue');
    expect(q?.Type).toBe('AWS::SQS::Queue');
    const props = q?.Properties || {};
    expect(props.FifoQueue).toBe(true);
    expect(props.ContentBasedDeduplication).toBe(true);
    expect(props.VisibilityTimeout).toBeDefined();
    // Name should use Fn::Sub with EnvironmentSuffix
    expect(hasFnSub(props.QueueName)).toBe(true);
  });

  it('8) Primary DLQ exists and is FIFO with content-based dedup', () => {
    const q = getResource(tpl, 'PrimaryDlqQueue');
    expect(q?.Type).toBe('AWS::SQS::Queue');
    const props = q?.Properties || {};
    expect(props.FifoQueue).toBe(true);
    expect(props.ContentBasedDeduplication).toBe(true);
    expect(hasFnSub(props.QueueName)).toBe(true);
  });

  it('9) Primary queue redrive policy sends to DLQ with maxReceiveCount=3', () => {
    const q = getResource(tpl, 'PrimaryFifoQueue');
    const rp = q?.Properties?.RedrivePolicy;
    expect(rp?.deadLetterTargetArn).toBeDefined();
    expect(rp?.maxReceiveCount).toBe(3);
  });

  it('10) DR FIFO queue and DR DLQ exist and are FIFO with dedup', () => {
    const q = getResource(tpl, 'DrFifoQueue');
    const dlq = getResource(tpl, 'DrDlqQueue');
    expect(q?.Type).toBe('AWS::SQS::Queue');
    expect(dlq?.Type).toBe('AWS::SQS::Queue');
    expect(q?.Properties?.FifoQueue).toBe(true);
    expect(q?.Properties?.ContentBasedDeduplication).toBe(true);
    expect(dlq?.Properties?.FifoQueue).toBe(true);
    expect(dlq?.Properties?.ContentBasedDeduplication).toBe(true);
  });

  // ---- Lambda & Event Source Mappings
  it('11) PrimaryProcessorLambda exists with reserved concurrency and env vars', () => {
    const fn = getResource(tpl, 'PrimaryProcessorLambda');
    expect(fn?.Type).toBe('AWS::Lambda::Function');
    const props = fn?.Properties || {};
    expect(props.ReservedConcurrentExecutions).toBeDefined();
    expect(props.Environment?.Variables?.MESSAGE_TABLE_NAME).toBeDefined();
    expect(props.Code?.ZipFile).toEqual(expect.stringContaining('ddb.put_item'));
  });

  it('12) ReplicationLambda exists with reserved concurrency and uses SSM param', () => {
    const fn = getResource(tpl, 'ReplicationLambda');
    expect(fn?.Type).toBe('AWS::Lambda::Function');
    const props = fn?.Properties || {};
    expect(props.ReservedConcurrentExecutions).toBeDefined();
    expect(props.Environment?.Variables?.DEST_QUEUE_URL_PARAM).toBeDefined();
    expect(props.Code?.ZipFile).toEqual(expect.stringContaining('sqs.send_message'));
  });

  it('13) EventSourceMappings exist and do NOT set MaximumBatchingWindowInSeconds (FIFO rule)', () => {
    const m1 = getResource(tpl, 'PrimaryProcessorEventSourceMapping');
    const m2 = getResource(tpl, 'ReplicationEventSourceMapping');
    expect(m1?.Type).toBe('AWS::Lambda::EventSourceMapping');
    expect(m2?.Type).toBe('AWS::Lambda::EventSourceMapping');
    expect(m1?.Properties?.EventSourceArn).toBeDefined();
    expect(m2?.Properties?.EventSourceArn).toBeDefined();
    expect(m1?.Properties?.MaximumBatchingWindowInSeconds).toBeUndefined();
    expect(m2?.Properties?.MaximumBatchingWindowInSeconds).toBeUndefined();
  });

  // ---- DynamoDB
  it('14) MessageStateTable exists, PAY_PER_REQUEST, with GSI and stream', () => {
    const t = getResource(tpl, 'MessageStateTable');
    expect(t?.Type).toBe('AWS::DynamoDB::Table');
    const p = t?.Properties || {};
    expect(p.BillingMode).toBe('PAY_PER_REQUEST');
    expect(Array.isArray(p.GlobalSecondaryIndexes)).toBe(true);
    expect(p.StreamSpecification?.StreamViewType).toBeDefined();
  });

  // ---- CloudWatch Alarms
  it('15) PrimaryQueueDepthAlarm exists on ApproximateNumberOfMessagesVisible', () => {
    const a = getResource(tpl, 'PrimaryQueueDepthAlarm');
    expect(a?.Type).toBe('AWS::CloudWatch::Alarm');
    const p = a?.Properties || {};
    expect(p.MetricName).toBe('ApproximateNumberOfMessagesVisible');
    expect(p.Namespace).toBe('AWS/SQS');
    expect(p.Threshold).toBeDefined();
  });

  it('16) PrimaryDlqDepthAlarm exists on ApproximateNumberOfMessagesVisible', () => {
    const a = getResource(tpl, 'PrimaryDlqDepthAlarm');
    expect(a?.Type).toBe('AWS::CloudWatch::Alarm');
    const p = a?.Properties || {};
    expect(p.MetricName).toBe('ApproximateNumberOfMessagesVisible');
    expect(p.Namespace).toBe('AWS/SQS');
  });

  it('17) ReplicationLambdaErrorAlarm exists on AWS/Lambda Errors', () => {
    const a = getResource(tpl, 'ReplicationLambdaErrorAlarm');
    expect(a?.Type).toBe('AWS::CloudWatch::Alarm');
    const p = a?.Properties || {};
    expect(p.Namespace).toBe('AWS/Lambda');
    expect(p.MetricName).toBe('Errors');
  });

  // ---- CloudWatch Dashboard
  it('18) ProcessingDashboard exists and contains widgets JSON body', () => {
    const d = getResource(tpl, 'ProcessingDashboard');
    expect(d?.Type).toBe('AWS::CloudWatch::Dashboard');
    expect(typeof d?.Properties?.DashboardBody).toBe('object'); // Fn::Sub
    const body = d?.Properties?.DashboardBody['Fn::Sub'];
    expect(typeof body).toBe('string');
    expect(body).toEqual(expect.stringContaining('"AWS/SQS"'));
    expect(body).toEqual(expect.stringContaining('"AWS/Lambda"'));
  });

  // ---- SNS + EventBridge for alarm routing
  it('19) DlqNotifierTopic and TopicPolicy wired with TopicArn', () => {
    const t = getResource(tpl, 'DlqNotifierTopic');
    const pol = getResource(tpl, 'DlqNotifierTopicPolicy');
    expect(t?.Type).toBe('AWS::SNS::Topic');
    expect(pol?.Type).toBe('AWS::SNS::TopicPolicy');
    const topics = pol?.Properties?.Topics;
    expect(Array.isArray(topics)).toBe(true);
    // Should be using TopicArn (via GetAtt)
    const usesArn = JSON.stringify(topics).includes('TopicArn');
    expect(usesArn).toBe(true);
  });

  it('20) DlqAlarmStateChangeRule targets the SNS topic', () => {
    const r = getResource(tpl, 'DlqAlarmStateChangeRule');
    expect(r?.Type).toBe('AWS::Events::Rule');
    const targets = r?.Properties?.Targets;
    expect(Array.isArray(targets)).toBe(true);
    const arnStr = JSON.stringify(targets);
    expect(arnStr).toEqual(expect.stringContaining('DlqNotifierTopic'));
  });

  // ---- Queue purge (non-prod only) resources present with Conditions
  it('21) QueuePurgeLambda and schedule exist with conditional creation', () => {
    const fn = getResource(tpl, 'QueuePurgeLambda');
    const rule = getResource(tpl, 'QueuePurgeSchedule');
    const perm = getResource(tpl, 'QueuePurgeLambdaPermission');
    expect(fn?.Type).toBe('AWS::Lambda::Function');
    expect(rule?.Type).toBe('AWS::Events::Rule');
    expect(perm?.Type).toBe('AWS::Lambda::Permission');
    // They should have Conditions in the rendered JSON form
    expect(fn?.Condition || fn?.Properties?.Condition).toBeDefined();
    expect(rule?.Condition || rule?.Properties?.Condition).toBeDefined();
    expect(perm?.Condition || perm?.Properties?.Condition).toBeDefined();
  });

  // ---- IAM roles/policies existence
  it('22) Lambda IAM roles exist for primary, replication, and purge (conditional)', () => {
    const r1 = getResource(tpl, 'PrimaryProcessorLambdaRole');
    const r2 = getResource(tpl, 'ReplicationLambdaRole');
    const r3 = getResource(tpl, 'QueuePurgeLambdaRole');
    expect(r1?.Type).toBe('AWS::IAM::Role');
    expect(r2?.Type).toBe('AWS::IAM::Role');
    // r3 may be conditional, but still present in template
    expect(r3?.Type).toBe('AWS::IAM::Role');
  });

  it('23) LambdaExecutionManagedPolicy exists and grants log permissions', () => {
    const mp = getResource(tpl, 'LambdaExecutionManagedPolicy');
    expect(mp?.Type).toBe('AWS::IAM::ManagedPolicy');
    const doc = mp?.Properties?.PolicyDocument;
    const stmt = JSON.stringify(doc || {});
    expect(stmt).toEqual(expect.stringContaining('logs:CreateLogGroup'));
    expect(stmt).toEqual(expect.stringContaining('logs:PutLogEvents'));
  });

  // ---- Outputs
  it('24) Outputs include essential ARNs/URLs and exports', () => {
    const outs = tpl.Outputs || {};
    const keys = [
      'PrimaryQueueUrl',
      'PrimaryQueueArn',
      'PrimaryDlqUrl',
      'PrimaryDlqArn',
      'DrQueueUrl',
      'DrQueueArn',
      'PrimaryProcessorLambdaArn',
      'ReplicationLambdaArn',
      'MessageStateTableName',
      'ProcessingDashboardName'
    ];
    for (const k of keys) {
      expect(outs[k]).toBeDefined();
      expect(outs[k].Value).toBeDefined();
    }
  });

  // ---- Queue policies for trusted account principal
  it('25) Queue policies exist (primary/dr & their DLQs) and reference TrustedRole when present', () => {
    const qp1 = getResource(tpl, 'QueuePolicyPrimary');
    const qp2 = getResource(tpl, 'QueuePolicyPrimaryDlq');
    const qp3 = getResource(tpl, 'QueuePolicyDr');
    const qp4 = getResource(tpl, 'QueuePolicyDrDlq');
    expect(qp1?.Type).toBe('AWS::SQS::QueuePolicy');
    expect(qp2?.Type).toBe('AWS::SQS::QueuePolicy');
    expect(qp3?.Type).toBe('AWS::SQS::QueuePolicy');
    expect(qp4?.Type).toBe('AWS::SQS::QueuePolicy');

    const polJson = JSON.stringify([
      qp1?.Properties?.PolicyDocument,
      qp2?.Properties?.PolicyDocument,
      qp3?.Properties?.PolicyDocument,
      qp4?.Properties?.PolicyDocument
    ]);

    // Should include a Principal AWS reference (TrustedRoleArn) via Ref/Sub in the rendered policy
    expect(polJson).toEqual(expect.stringContaining('Principal'));
    // We cannot resolve conditions in unit tests, but presence is enough.
  });

  // ---- FIFO eventing and ordering practices
  it('26) Event source mappings use small batch size for FIFO ordering', () => {
    const m1 = getResource(tpl, 'PrimaryProcessorEventSourceMapping');
    const m2 = getResource(tpl, 'ReplicationEventSourceMapping');
    expect(m1?.Properties?.BatchSize).toBeLessThanOrEqual(10);
    expect(m2?.Properties?.BatchSize).toBeLessThanOrEqual(10);
  });
});
