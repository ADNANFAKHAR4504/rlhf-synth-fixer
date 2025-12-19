// test/tapstack.unit.test.ts
import * as fs from 'fs';
import * as path from 'path';

type CfnTemplate = {
  AWSTemplateFormatVersion?: string;
  Description?: string;
  Parameters?: Record<string, any>;
  Conditions?: Record<string, any>;
  Mappings?: Record<string, any>;
  Resources?: Record<string, any>;
  Outputs?: Record<string, any>;
};

// --------- Helpers ---------
function loadJsonTemplate(rel: string): CfnTemplate {
  const p = path.resolve(__dirname, rel);
  const raw = fs.readFileSync(p, 'utf8');
  return JSON.parse(raw);
}

function fileExists(rel: string): boolean {
  const p = path.resolve(__dirname, rel);
  return fs.existsSync(p);
}

function getRes(t: CfnTemplate, type: string): [string, any][] {
  const out: [string, any][] = [];
  for (const [k, v] of Object.entries(t.Resources || {})) {
    if (v && v.Type === type) out.push([k, v]);
  }
  return out;
}

function getResByLogicalId(t: CfnTemplate, logicalId: string) {
  return (t.Resources || {})[logicalId];
}

function hasSubStringified(value: any, needle: string): boolean {
  const s = JSON.stringify(value);
  return s.includes(needle);
}

function getParam(t: CfnTemplate, name: string) {
  return (t.Parameters || {})[name];
}

function getOutput(t: CfnTemplate, name: string) {
  return (t.Outputs || {})[name];
}

// if value is { "Fn::Sub": "..." } return that string, if already string return as-is.
function unwrapSubString(v: any): string | undefined {
  if (typeof v === 'string') return v;
  if (v && typeof v === 'object' && ('Fn::Sub' in v)) {
    const s = (v as any)['Fn::Sub'];
    if (typeof s === 'string') return s;
  }
  return undefined;
}

// Try to parse a JSON string safely. If not parseable, return undefined.
function tryParseJsonString(s?: string): any | undefined {
  if (!s) return undefined;
  try {
    return JSON.parse(s);
  } catch {
    return undefined;
  }
}

// --------- Load templates once ---------
const yamlPath = '../lib/TapStack.yml';
const jsonPath = '../lib/TapStack.json';

describe('TapStack — Template presence', () => {
  test('YAML file exists and is non-empty', () => {
    expect(fileExists(yamlPath)).toBe(true);
    const p = path.resolve(__dirname, yamlPath);
    const size = fs.statSync(p).size;
    expect(size).toBeGreaterThan(50);
  });

  test('JSON file exists and is valid JSON', () => {
    expect(fileExists(jsonPath)).toBe(true);
    expect(() => loadJsonTemplate(jsonPath)).not.toThrow();
  });
});

const tpl = loadJsonTemplate(jsonPath);

describe('TapStack — Basic shape', () => {
  test('Has core top-level sections', () => {
    expect(tpl.AWSTemplateFormatVersion).toBeDefined();
    expect(tpl.Parameters).toBeDefined();
    expect(tpl.Resources).toBeDefined();
    expect(Object.keys(tpl.Resources!).length).toBeGreaterThan(5);
  });

  test('EnvironmentSuffix parameter uses regex pattern (no AllowedValues)', () => {
    const p = getParam(tpl, 'EnvironmentSuffix');
    expect(p).toBeDefined();
    expect(p.Type).toBe('String');
    const pattern = p.AllowedPattern || p.AllowedPatternRegex;
    expect(pattern).toBeDefined();
    expect(String(pattern)).toMatch(/^\^\[a-z0-9-]\{2,20\}\$$/);
    expect(p.AllowedValues).toBeUndefined();
  });
});

describe('TapStack — Conditions for features', () => {
  test('Has conditions for central topic / OAM / remediation (where defined)', () => {
    const c = tpl.Conditions || {};
    expect(typeof c).toBe('object');
    expect(Object.keys(c).length).toBeGreaterThanOrEqual(2);
    expect(Object.keys(c)).toEqual(expect.arrayContaining(['HasCentralTopic', 'CreateOAM']));
  });
});

describe('TapStack — KMS key & alias', () => {
  test('KMS Key present with alias', () => {
    const key = getResByLogicalId(tpl, 'ObservabilityKmsKey');
    const alias = getResByLogicalId(tpl, 'ObservabilityKmsAlias');
    expect(key?.Type).toBe('AWS::KMS::Key');
    expect(alias?.Type).toBe('AWS::KMS::Alias');
    expect(hasSubStringified(key, ':root')).toBe(true);
  });
});

describe('TapStack — Log groups', () => {
  test('Encrypted log groups with retention for API, Lambda, App', () => {
    const api = getResByLogicalId(tpl, 'ApiGatewayAccessLogs');
    const lam = getResByLogicalId(tpl, 'LambdaAppLogs');
    const app = getResByLogicalId(tpl, 'ApplicationLogs');
    for (const lg of [api, lam, app]) {
      expect(lg?.Type).toBe('AWS::Logs::LogGroup');
      expect(lg?.Properties?.KmsKeyId).toBeDefined();
      expect(lg?.Properties?.RetentionInDays).toBeDefined();
    }
  });
});

describe('TapStack — Metric filters & custom metrics', () => {
  test('Metric filters for success, failures, and processing time exist', () => {
    expect(getResByLogicalId(tpl, 'MfTransactionSuccess')?.Type).toBe('AWS::Logs::MetricFilter');
    expect(getResByLogicalId(tpl, 'MfTransactionFailureCode')?.Type).toBe('AWS::Logs::MetricFilter');
    expect(getResByLogicalId(tpl, 'MfProcessingTimeMs')?.Type).toBe('AWS::Logs::MetricFilter');
  });

  test('Metric filters emit to Payments/${EnvironmentSuffix} namespace', () => {
    const mf1 = getResByLogicalId(tpl, 'MfTransactionSuccess');
    const mf2 = getResByLogicalId(tpl, 'MfTransactionFailureCode');
    const mf3 = getResByLogicalId(tpl, 'MfProcessingTimeMs');
    for (const mf of [mf1, mf2, mf3]) {
      expect(hasSubStringified(mf, 'Payments/${EnvironmentSuffix}')).toBe(true);
    }
  });
});

describe('TapStack — Anomaly detectors', () => {
  test('Anomaly detectors exist for transaction volume & error rate', () => {
    const ad1 = getResByLogicalId(tpl, 'AdTransactionVolume');
    const ad2 = getResByLogicalId(tpl, 'AdErrorRate');
    expect(ad1?.Type).toBe('AWS::CloudWatch::AnomalyDetector');
    expect(ad2?.Type).toBe('AWS::CloudWatch::AnomalyDetector');
  });
});

describe('TapStack — Synthetics canary', () => {
  test('Artifacts bucket encrypted with SSE-KMS', () => {
    const b = getResByLogicalId(tpl, 'CanaryArtifactsBucket');
    expect(b?.Type).toBe('AWS::S3::Bucket');
    expect(hasSubStringified(b, 'aws:kms')).toBe(true);
  });

  test('Canary execution role trust allows BOTH synthetics and lambda', () => {
    const role = getResByLogicalId(tpl, 'CanaryExecutionRole');
    expect(role?.Type).toBe('AWS::IAM::Role');
    const trust = role?.Properties?.AssumeRolePolicyDocument;
    expect(hasSubStringified(trust, 'synthetics.amazonaws.com')).toBe(true);
    expect(hasSubStringified(trust, 'lambda.amazonaws.com')).toBe(true);
  });

  test('Canary configured with rate(minutes) and active tracing', () => {
    const c = getResByLogicalId(tpl, 'PaymentsCanary');
    expect(c?.Type).toBe('AWS::Synthetics::Canary');
    // Fn::Sub may wrap the expression; check substring on full object
    expect(hasSubStringified(c, 'rate(${CanaryScheduleRateMinutes} minutes)')).toBe(true);
    expect(hasSubStringified(c, 'ActiveTracing')).toBe(true);
  });
});

describe('TapStack — X-Ray sampling rule', () => {
  test('Sampling rule has Version: 1 and non-zero priority', () => {
    const xr = getResByLogicalId(tpl, 'XraySamplingRule');
    expect(xr?.Type).toBe('AWS::XRay::SamplingRule');
    const rule = xr?.Properties?.SamplingRule;
    expect(rule?.Version ?? rule?.version).toBe(1);
    const pr = rule?.Priority ?? rule?.priority;
    expect(typeof pr).toBe('number');
    expect(pr).toBeGreaterThanOrEqual(1);
  });
});

describe('TapStack — Contributor Insights rules', () => {
  test('Rules exist and use CloudWatchLogRule with JSON format (with Filters)', () => {
    const r1 = getResByLogicalId(tpl, 'ApiAccessContributorInsights');
    const r2 = getResByLogicalId(tpl, 'ErrorProneEndpointsInsights');
    for (const r of [r1, r2]) {
      expect(r?.Type).toBe('AWS::CloudWatch::InsightRule');
      const rb = r?.Properties?.RuleBody;
      const bodyStr = unwrapSubString(rb) ?? (typeof rb === 'string' ? rb : JSON.stringify(rb));
      // must contain schema name and LogFormat
      expect(bodyStr).toContain('CloudWatchLogRule');
      expect(bodyStr.replace(/\s+/g, '')).toContain('"LogFormat":"JSON"');
      expect(bodyStr).toContain('"LogGroupNames"');
      // Filters key must exist (empty or non-empty)
      expect(bodyStr).toContain('"Filters"');
    }
  });
});

describe('TapStack — Alarms & composite', () => {
  test('Single-metric alarms for failures and latency exist', () => {
    expect(getResByLogicalId(tpl, 'AlarmHighFailures')?.Type).toBe('AWS::CloudWatch::Alarm');
    expect(getResByLogicalId(tpl, 'AlarmHighLatency')?.Type).toBe('AWS::CloudWatch::Alarm');
  });

  test('Composite alarm depends on both underlying alarms', () => {
    const comp = getResByLogicalId(tpl, 'CompositeErrorAndLatency');
    expect(comp?.Type).toBe('AWS::CloudWatch::CompositeAlarm');
    const ar = comp?.Properties?.AlarmRule;
    const arStr = unwrapSubString(ar) ?? JSON.stringify(ar);
    // allow either ALARM(${LogicalId}) or ALARM(LogicalId)
    expect(arStr).toMatch(/ALARM\(\$\{?AlarmHighFailures\}?\)/);
    expect(arStr).toMatch(/ALARM\(\$\{?AlarmHighLatency\}?\)/);
  });

  test('Alarms have SNS actions (local; central optional) — ensure AlarmActions array present and non-empty where configured', () => {
    const a = getResByLogicalId(tpl, 'AlarmHighFailures');
    expect(Array.isArray(a?.Properties?.AlarmActions)).toBe(true);
    expect(a?.Properties?.AlarmActions.length).toBeGreaterThan(0);
  });
});

describe('TapStack — SNS topic & subscription', () => {
  test('LocalAlarmsTopic and email subscription present', () => {
    const topic = getResByLogicalId(tpl, 'LocalAlarmsTopic');
    const sub = getResByLogicalId(tpl, 'LocalAlarmsSubscription');
    expect(topic?.Type).toBe('AWS::SNS::Topic');
    expect(sub?.Type).toBe('AWS::SNS::Subscription');
    expect(sub?.Properties?.TopicArn).toBeDefined();
  });
});

describe('TapStack — Logs Insights QueryDefinitions', () => {
  test('Three saved queries exist', () => {
    const qdefs = getRes(tpl, 'AWS::Logs::QueryDefinition');
    expect(qdefs.length).toBeGreaterThanOrEqual(3);
    const names = qdefs.map(([id]) => id);
    expect(names).toEqual(expect.arrayContaining(['QdTopErrorCodes', 'QdSlowestEndpoints', 'QdColdStarts']));
  });
});

describe('TapStack — CloudWatch Dashboard', () => {
  test('Dashboard exists with SuccessRate expression and latency percentiles', () => {
    const d = getResByLogicalId(tpl, 'ObservabilityDashboard');
    expect(d?.Type).toBe('AWS::CloudWatch::Dashboard');
    const bodyRaw = d?.Properties?.DashboardBody;
    const bodyStr = unwrapSubString(bodyRaw) ?? (typeof bodyRaw === 'string' ? bodyRaw : JSON.stringify(bodyRaw));
    expect(bodyStr).toContain('su/(su+fa)');
    // Accept "p50"/"p90"/"p99" either as labels or stats fields
    expect(/"p50"|stat"\s*:\s*"p50"/.test(bodyStr)).toBe(true);
    expect(/"p90"|stat"\s*:\s*"p90"/.test(bodyStr)).toBe(true);
    expect(/"p99"|stat"\s*:\s*"p99"/.test(bodyStr)).toBe(true);
  });
});

describe('TapStack — Names include EnvironmentSuffix', () => {
  test('Key named resources include -${EnvironmentSuffix}', () => {
    const checks: Array<[string, string]> = [
      ['ObservabilityDashboard', 'payments-observability-${EnvironmentSuffix}'],
      ['PaymentsCanary', 'payments-canary-${EnvironmentSuffix}'],
      ['LocalAlarmsTopic', 'payments-alarms-${EnvironmentSuffix}'],
      ['CompositeErrorAndLatency', 'composite-error-latency-${EnvironmentSuffix}'],
    ];
    for (const [logicalId, fragment] of checks) {
      const r = getResByLogicalId(tpl, logicalId);
      expect(hasSubStringified(r, fragment)).toBe(true);
    }
  });
});

describe('TapStack — Outputs', () => {
  test('Expected outputs exist', () => {
    const expected = [
      'DashboardName',
      'KmsKeyArn',
      'LogGroupNames',
      'CanaryName',
      'CompositeAlarmName',
      'CentralAlarmActionArn',
    ];
    for (const name of expected) {
      const o = getOutput(tpl, name);
      expect(o).toBeDefined();
      expect(o.Value).toBeDefined();
    }
  });

  test('OAMLinkArn output is conditional (may or may not exist)', () => {
    const o = getOutput(tpl, 'OAMLinkArn');
    if (o) {
      expect(o.Value).toBeDefined();
    } else {
      expect(o).toBeUndefined();
    }
  });
});

describe('TapStack — Parameters sanity', () => {
  test('ApiEndpointUrls is List<String> and has a default (comma-delimited OK)', () => {
    const p = getParam(tpl, 'ApiEndpointUrls');
    expect(p?.Type).toBe('List<String>');
    expect(p?.Default).toBeDefined();
  });

  test('LogsRetentionDays has sensible bounds', () => {
    const p = getParam(tpl, 'LogsRetentionDays');
    expect(p?.Type).toBe('Number');
    expect(p?.MinValue).toBeGreaterThanOrEqual(7);
    expect(p?.MaxValue).toBeGreaterThanOrEqual(365);
  });

  test('CanaryScheduleRateMinutes has range 1–15', () => {
    const p = getParam(tpl, 'CanaryScheduleRateMinutes');
    expect(p?.Type).toBe('Number');
    expect(p?.MinValue).toBe(1);
    expect(p?.MaxValue).toBe(15);
  });
});
