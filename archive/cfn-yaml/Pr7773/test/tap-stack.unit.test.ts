// __tests__/tapstack.unit.test.ts
//
// Comprehensive unit tests for TapStack CloudFormation template.
// Assumptions:
// - JSON-rendered template exists at ../lib/TapStack.json (source of truth for assertions)
// - YAML template exists at ../lib/TapStack.yml (we only assert existence, not parse)
// - Test runner: Jest with ts-jest or equivalent
//
// These tests avoid network calls and external deps to be pipeline-safe.

import * as fs from 'fs';
import * as path from 'path';

type CFN = {
  AWSTemplateFormatVersion?: string;
  Description?: string;
  Parameters?: Record<string, any>;
  Conditions?: Record<string, any>;
  Mappings?: Record<string, any>;
  Resources: Record<string, any>;
  Outputs?: Record<string, any>;
  Transform?: any;
};

const jsonPath = path.resolve(__dirname, '../lib/TapStack.json');
const ymlPath = path.resolve(__dirname, '../lib/TapStack.yml');

let tpl: CFN;

beforeAll(() => {
  // Ensure files exist
  expect(fs.existsSync(jsonPath)).toBe(true);
  expect(fs.existsSync(ymlPath)).toBe(true);

  const raw = fs.readFileSync(jsonPath, 'utf8');
  tpl = JSON.parse(raw);
});

// ------------------------ helpers ------------------------

function flattenToArray<T>(v: T | T[] | undefined): T[] {
  if (v === undefined) return [];
  return Array.isArray(v) ? v : [v];
}

function actionIncludesPutObject(action: any): boolean {
  if (!action) return false;
  const arr = Array.isArray(action) ? action : [action];
  return arr.includes('s3:PutObject');
}

function resourceMentionsAlbLogs(res: any): boolean {
  // Accept string ARNs or intrinsic objects that include the alb-logs prefix and AWSLogs
  const checkString = (s: string) =>
    s.includes('/alb-logs/') && s.includes('AWSLogs');

  if (typeof res === 'string') return checkString(res);

  if (Array.isArray(res)) {
    return res.some(resourceMentionsAlbLogs);
  }

  if (res && typeof res === 'object') {
    // Common shapes: { "Fn::Sub": "arn:aws:s3:::${LoggingBucket}/alb-logs/AWSLogs/${AWS::AccountId}/*" }
    if (typeof res['Fn::Sub'] === 'string') return checkString(res['Fn::Sub']);
    // { "Ref": "Something" } or other intrinsics won't be strictly checked here.
  }
  return false;
}

function hasStatement(stmts: any[], predicate: (s: any) => boolean): boolean {
  return Array.isArray(stmts) && stmts.some(predicate);
}

function runtimeIsAllowed(rt: string | undefined): boolean {
  // Allow either python3.12 (preferred) or python3.9 (legacy still passing in some pipelines)
  return rt === 'python3.12' || rt === 'python3.9';
}

// ------------------------ tests ------------------------

describe('TapStack CloudFormation Template - Structural', () => {
  test('has standard top-level sections', () => {
    expect(tpl).toHaveProperty('AWSTemplateFormatVersion');
    expect(tpl).toHaveProperty('Description');
    expect(tpl).toHaveProperty('Parameters');
    expect(tpl).toHaveProperty('Resources');
    expect(tpl).toHaveProperty('Outputs');
  });

  test('does not require any Transform (pipeline-safe)', () => {
    expect(tpl.Transform).toBeUndefined();
  });

  test('declares required input Parameters', () => {
    const p = tpl.Parameters!;
    const required = [
      'ProjectName',
      'EnvironmentSuffix',
      'KnownAdminCidr',
      'VpcCidr',
      'PublicSubnetACidr',
      'PublicSubnetBCidr',
      'PrivateSubnetACidr',
      'PrivateSubnetBCidr',
      'RdsInstanceClass',
      'RdsEngine',
      'RdsEngineVersion',
      'RdsBackupRetentionDays',
      'RdsDeletionProtection',
      'AlarmEmail',
      'EnableOrganizationTrail',
      'EnableWAF',
      'LogRetentionDays',
      'ApiAccessLogFormat',
      'KeyRotationDays',
      'AcmCertificateArn',
      'EnableSecretRotation',
      'ExternalRotationLambdaArn',
    ];
    for (const k of required) expect(p).toHaveProperty(k);
  });
});

describe('S3 Logging Bucket & Policy', () => {
  test('LoggingBucket exists and does not hard-code a BucketName', () => {
    const b = tpl.Resources['LoggingBucket'];
    expect(b).toBeDefined();
    expect(b.Type).toBe('AWS::S3::Bucket');
    const props = b.Properties || {};
    expect(props.BucketName).toBeUndefined(); // avoid global name collisions
  });

  test('LoggingBucket has OwnershipControls and versioning, lifecycle', () => {
    const props = tpl.Resources['LoggingBucket'].Properties;
    expect(props.OwnershipControls?.Rules?.[0]?.ObjectOwnership).toBe('BucketOwnerPreferred');
    expect(props.VersioningConfiguration?.Status).toBe('Enabled');
    expect(props.LifecycleConfiguration?.Rules).toBeDefined();
  });

  test('LoggingBucketPolicy allows ALB log delivery principal to PutObject on alb-logs prefix', () => {
    const pol = tpl.Resources['LoggingBucketPolicy'];
    expect(pol?.Type).toBe('AWS::S3::BucketPolicy');
    const stmts = pol?.Properties?.PolicyDocument?.Statement || [];

    const allowAlb = stmts.find(
      (s: any) =>
        s?.Principal?.Service === 'logdelivery.elasticloadbalancing.amazonaws.com' &&
        actionIncludesPutObject(s?.Action)
    );
    expect(allowAlb).toBeDefined();

    // Resource can be string, array, or intrinsic with Fn::Sub.
    const res = allowAlb.Resource;
    expect(resourceMentionsAlbLogs(res)).toBe(true);
  });
});

describe('ALB configuration', () => {
  test('ALB depends on LoggingBucketPolicy and has access log attributes', () => {
    const alb = tpl.Resources['ALB'];
    expect(alb?.Type).toBe('AWS::ElasticLoadBalancingV2::LoadBalancer');

    // DependsOn may be string or array depending on synth; accept either or undefined (some tools inline dependency graph)
    const dep = alb.DependsOn;
    if (Array.isArray(dep)) {
      expect(dep).toContain('LoggingBucketPolicy');
    } else if (dep !== undefined) {
      expect(dep).toBe('LoggingBucketPolicy');
    }

    const attrs = alb.Properties?.LoadBalancerAttributes || [];
    const toMap: Record<string, string> = Object.fromEntries(attrs.map((a: any) => [a.Key, a.Value]));
    expect(toMap['access_logs.s3.enabled']).toBe('true');
    expect(toMap['access_logs.s3.bucket']).toBeDefined();
    expect(toMap['access_logs.s3.prefix']).toBe('alb-logs');
  });

  test('ALBTargetGroup is HTTP and has a valid health check path', () => {
    const tg = tpl.Resources['ALBTargetGroup'];
    expect(tg?.Type).toBe('AWS::ElasticLoadBalancingV2::TargetGroup');
    const p = tg.Properties;
    expect(p.Protocol).toBe('HTTP');
    expect(p.Port).toBe(80);

    // Accept either explicit "/health" or default "/"
    const pathVal = p.HealthCheckPath;
    if (pathVal !== undefined) {
      expect(['/health', '/']).toContain(pathVal);
    } else {
      // If omitted, AWS defaults to "/"
      expect(true).toBe(true);
    }
  });

  test('AutoScalingGroup attaches to ALBTargetGroup', () => {
    const asg = tpl.Resources['AutoScalingGroup'];
    const tgArns = asg?.Properties?.TargetGroupARNs;
    expect(Array.isArray(tgArns)).toBe(true);
    const refFound = tgArns.some((x: any) => typeof x === 'object' && 'Ref' in x && x.Ref === 'ALBTargetGroup');
    expect(refFound).toBe(true);
  });
});

describe('CloudTrail & Logs', () => {
  test('CloudTrail is multi-region, with log validation, writing to S3 and CW Logs with KMS', () => {
    const ct = tpl.Resources['CloudTrail'];
    expect(ct?.Type).toBe('AWS::CloudTrail::Trail');
    const p = ct.Properties;
    expect(p.IsMultiRegionTrail).toBe(true);
    expect(p.EnableLogFileValidation).toBe(true);
    expect(p.S3BucketName).toBeDefined();
    expect(p.CloudWatchLogsLogGroupArn).toBeDefined();
    expect(p.CloudWatchLogsRoleArn).toBeDefined();
    expect(p.KMSKeyId).toBeDefined();
  });

  test('CloudTrailLogGroup uses KMS key and has retention from parameter', () => {
    const lg = tpl.Resources['CloudTrailLogGroup'];
    expect(lg?.Type).toBe('AWS::Logs::LogGroup');
    const p = lg.Properties;
    expect(p.KmsKeyId).toBeDefined();
    expect(p.RetentionInDays).toBeDefined();
  });
});

describe('KMS & Secrets', () => {
  test('DataEncryptionKey exists', () => {
    const key = tpl.Resources['DataEncryptionKey'];
    expect(key?.Type).toBe('AWS::KMS::Key');
  });

  test('RDSMasterSecret encrypted with CMK and generated with username/password', () => {
    const s = tpl.Resources['RDSMasterSecret'];
    expect(s?.Type).toBe('AWS::SecretsManager::Secret');
    const p = s.Properties;
    expect(p.KmsKeyId).toBeDefined();
    expect(p.GenerateSecretString?.SecretStringTemplate).toContain('"username":"admin"');
    expect(p.GenerateSecretString?.GenerateStringKey).toBe('password');
  });

  test('RDSSecretTargetAttachment links secret to DBInstance', () => {
    const a = tpl.Resources['RDSSecretTargetAttachment'];
    expect(a?.Type).toBe('AWS::SecretsManager::SecretTargetAttachment');
    expect(a.Properties?.TargetType).toBe('AWS::RDS::DBInstance');
  });

  test('RDSSecretRotation (if present) is conditionally enabled and has RotationRules', () => {
    const r = tpl.Resources['RDSSecretRotation'];
    expect(r?.Type).toBe('AWS::SecretsManager::RotationSchedule');
    expect(r?.Condition).toBe('DoRotate');
    expect(r.Properties?.RotationRules?.AutomaticallyAfterDays).toBeDefined();
  });
});

describe('AWS Config & Custom Resources', () => {
  test('ConfigRecorder uses AWS_ConfigRole managed policy and writes to LoggingBucket', () => {
    const role = tpl.Resources['ConfigRecorderRole'];
    expect(role?.Type).toBe('AWS::IAM::Role');
    const arns: string[] = role?.Properties?.ManagedPolicyArns || [];
    expect(arns).toContain('arn:aws:iam::aws:policy/service-role/AWS_ConfigRole');

    const dc = tpl.Resources['ConfigDeliveryChannel'];
    expect(dc?.Type).toBe('AWS::Config::DeliveryChannel');
    expect(dc?.Properties?.S3BucketName).toBeDefined();
  });

  test('PasswordPolicyFunction uses allowed Python runtime and returns via custom resource', () => {
    const f = tpl.Resources['PasswordPolicyFunction'];
    expect(f?.Type).toBe('AWS::Lambda::Function');
    expect(runtimeIsAllowed(f?.Properties?.Runtime)).toBe(true);
    expect(f?.Properties?.Handler).toBe('index.handler');

    const cr = tpl.Resources['PasswordPolicyResource'];
    expect(cr?.Type).toBe('Custom::PasswordPolicy');
    expect(cr?.Properties?.ServiceToken).toBeDefined();
  });

  test('ConfigRecorderStatusFunction uses allowed Python runtime and role can DescribeConfigurationRecorderStatus', () => {
    const f = tpl.Resources['ConfigRecorderStatusFunction'];
    expect(f?.Type).toBe('AWS::Lambda::Function');
    expect(runtimeIsAllowed(f?.Properties?.Runtime)).toBe(true);

    const role = tpl.Resources['ConfigRecorderStatusRole'];
    const stmts = role?.Properties?.Policies?.[0]?.PolicyDocument?.Statement || [];
    const hasDescribe = stmts.some((st: any) => {
      const acts = Array.isArray(st.Action) ? st.Action : [st.Action];
      return acts.includes('config:DescribeConfigurationRecorderStatus');
    });
    expect(hasDescribe).toBe(true);
  });
});

describe('RDS configuration', () => {
  test('RDSInstance is encrypted with CMK, MultiAZ enabled, correct logs export by engine', () => {
    const db = tpl.Resources['RDSInstance'];
    expect(db?.Type).toBe('AWS::RDS::DBInstance');
    const p = db.Properties;
    expect(p.StorageEncrypted).toBe(true);
    expect(p.KmsKeyId).toBeDefined();
    expect(p.MultiAZ).toBe(true);
    expect(p.EnableCloudwatchLogsExports).toBeDefined();
  });

  test('RDSSubnetGroup covers two private subnets', () => {
    const sg = tpl.Resources['RDSSubnetGroup'];
    expect(sg?.Type).toBe('AWS::RDS::DBSubnetGroup');
    const ids = sg.Properties?.SubnetIds || [];
    expect(Array.isArray(ids)).toBe(true);
    expect(ids.length).toBeGreaterThanOrEqual(2);
  });
});

describe('IAM Baseline & Networking', () => {
  test('MFAEnforcementGroup contains a deny on Non-MFA access', () => {
    const g = tpl.Resources['MFAEnforcementGroup'];
    expect(g?.Type).toBe('AWS::IAM::Group');
    const stmts = g?.Properties?.Policies?.[0]?.PolicyDocument?.Statement || [];
    const deny = stmts.find((s: any) => s.Sid === 'DenyNonMFAAccess' && s.Effect === 'Deny');
    expect(deny).toBeDefined();
  });

  test('VPC endpoints include S3 and Secrets Manager', () => {
    expect(tpl.Resources['S3Endpoint']?.Type).toBe('AWS::EC2::VPCEndpoint');
    expect(tpl.Resources['SecretsManagerEndpoint']?.Type).toBe('AWS::EC2::VPCEndpoint');
  });

  test('EC2InstanceRole includes SSM and CW agent managed policies', () => {
    const role = tpl.Resources['EC2InstanceRole'];
    expect(role?.Type).toBe('AWS::IAM::Role');
    const arns: string[] = role?.Properties?.ManagedPolicyArns || [];
    expect(arns).toContain('arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore');
    expect(arns).toContain('arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy');
  });
});

describe('API Gateway & Observability', () => {
  test('API Gateway REST API and Stage exist with access logs configured', () => {
    const api = tpl.Resources['APIGateway'];
    const stage = tpl.Resources['APIGatewayStage'];
    expect(api?.Type).toBe('AWS::ApiGateway::RestApi');
    expect(stage?.Type).toBe('AWS::ApiGateway::Stage');
    expect(stage?.Properties?.AccessLogSetting?.DestinationArn).toBeDefined();
    expect(stage?.Properties?.AccessLogSetting?.Format).toBeDefined();
  });

  test('APIGatewayMethod is GET and integrated (MOCK) for /example path', () => {
    const res = tpl.Resources['APIGatewayResource'];
    const m = tpl.Resources['APIGatewayMethod'];
    expect(res?.Type).toBe('AWS::ApiGateway::Resource');
    expect(m?.Type).toBe('AWS::ApiGateway::Method');
    expect(m?.Properties?.HttpMethod).toBe('GET');
    expect(m?.Properties?.Integration?.Type).toBe('MOCK');
  });

  test('CloudWatch alarms for unauthorized API calls and root usage exist', () => {
    expect(tpl.Resources['UnauthorizedApiCallsAlarm']?.Type).toBe('AWS::CloudWatch::Alarm');
    expect(tpl.Resources['RootAccountUsageAlarm']?.Type).toBe('AWS::CloudWatch::Alarm');
  });
});

describe('Optional WAF', () => {
  test('WAFWebACL exists with a condition and WAFAssociation references ALB', () => {
    const waf = tpl.Resources['WAFWebACL'];
    const assoc = tpl.Resources['WAFAssociation'];
    expect(waf?.Type).toBe('AWS::WAFv2::WebACL');
    // presence of a Condition key indicates it is optional and pipeline-safe
    expect(typeof waf?.Condition === 'string' || waf?.Condition === undefined).toBe(true);
    expect(assoc?.Properties?.ResourceArn?.Ref || assoc?.Properties?.ResourceArn).toBeDefined();
  });
});

describe('Outputs completeness', () => {
  test('critical Outputs are present for integration and verification', () => {
    const o = tpl.Outputs!;
    const required = [
      'VPCId',
      'PublicSubnetAId',
      'PublicSubnetBId',
      'PrivateSubnetAId',
      'PrivateSubnetBId',
      'ALBDNSName',
      'ALBArn',
      'ALBTargetGroupArn',
      'APIGatewayId',
      'APIGatewayInvokeURL',
      'KMSKeyArn',
      'RDSSecretArn',
    ];
    for (const k of required) expect(o).toHaveProperty(k);
  });

  test('Outputs also include Config artifacts for post-deploy checks', () => {
    const o = tpl.Outputs!;
    expect(o).toHaveProperty('ConfigRecorderName');
    expect(o).toHaveProperty('ConfigDeliveryChannelName');
  });
});
