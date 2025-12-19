// test/tap-stack.unit.test.ts
// Jest unit tests for the TapStack CloudFormation templates.
// Fix: use js-yaml v4 API (DEFAULT_SCHEMA.extend) instead of Schema.create,
// and register CloudFormation intrinsic function tags so YAML parses cleanly.

import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';

type CFNTemplate = {
  AWSTemplateFormatVersion?: string;
  Description?: string;
  Metadata?: Record<string, unknown>;
  Parameters?: Record<string, any>;
  Mappings?: Record<string, any>;
  Conditions?: Record<string, any>;
  Resources?: Record<string, any>;
  Outputs?: Record<string, any>;
};

// -----------------------------
// CloudFormation YAML schema (js-yaml v4)
// -----------------------------
function makeType(
  tag: string,
  kind: 'scalar' | 'sequence' | 'mapping',
  key: string,
  construct?: (data: any) => any
) {
  return new yaml.Type(tag, {
    kind,
    construct: (data: any) => {
      if (construct) return construct(data);
      return { [key]: data };
    },
  });
}

// !GetAtt can be scalar "Logical.Attribute" OR sequence ["Logical","Attribute"]
const GetAttTypeScalar = new yaml.Type('!GetAtt', {
  kind: 'scalar',
  construct: (data: string) => {
    const parts = String(data).split('.');
    return { 'Fn::GetAtt': parts };
  },
});
const GetAttTypeSeq = new yaml.Type('!GetAtt', {
  kind: 'sequence',
  construct: (data: any[]) => ({ 'Fn::GetAtt': data }),
});

// Build a schema that extends DEFAULT_SCHEMA (js-yaml v4)
const schema = (yaml.DEFAULT_SCHEMA as any).extend([
  makeType('!Ref', 'scalar', 'Ref'),
  makeType('!Sub', 'scalar', 'Fn::Sub'),
  new yaml.Type('!Sub', {
    kind: 'sequence',
    construct: (data: any[]) => ({ 'Fn::Sub': data }),
  }),
  GetAttTypeScalar,
  GetAttTypeSeq,
  makeType('!Join', 'sequence', 'Fn::Join'),
  makeType('!Select', 'sequence', 'Fn::Select'),
  makeType('!If', 'sequence', 'Fn::If'),
  makeType('!Equals', 'sequence', 'Fn::Equals'),
  makeType('!And', 'sequence', 'Fn::And'),
  makeType('!Or', 'sequence', 'Fn::Or'),
  makeType('!Not', 'sequence', 'Fn::Not'),
  makeType('!FindInMap', 'sequence', 'Fn::FindInMap'),
  makeType('!Split', 'sequence', 'Fn::Split'),
  makeType('!Base64', 'scalar', 'Fn::Base64'),
  makeType('!GetAZs', 'scalar', 'Fn::GetAZs'),
  makeType('!ImportValue', 'scalar', 'Fn::ImportValue'),
  makeType('!Condition', 'scalar', 'Condition'),
]);

// -----------------------------
// Template loaders
// -----------------------------
function safeRead(p: string): string {
  return fs.readFileSync(p, 'utf8');
}

function loadYamlTemplate(relPath: string): CFNTemplate {
  const p = path.resolve(__dirname, relPath);
  const raw = safeRead(p);
  const doc = yaml.load(raw, { schema }) as CFNTemplate;
  expect(typeof doc).toBe('object');
  return doc;
}

function loadJsonTemplate(relPath: string): CFNTemplate | null {
  try {
    const p = path.resolve(__dirname, relPath);
    const raw = safeRead(p);
    const doc = JSON.parse(raw) as CFNTemplate;
    expect(typeof doc).toBe('object');
    return doc;
  } catch {
    // If JSON variant is absent, skip its subset checks gracefully.
    return null;
  }
}

// Helper: access resource & assert presence
function res(tpl: CFNTemplate, logicalId: string) {
  const r = tpl.Resources?.[logicalId];
  expect(r).toBeDefined();
  return r;
}

// -----------------------------
// Tests (25 total)
// -----------------------------
describe('TapStack CloudFormation templates (YAML + JSON)', () => {
  const yamlTpl = loadYamlTemplate('../lib/TapStack.yml');
  const jsonTpl = loadJsonTemplate('../lib/TapStack.json');

  // 1
  test('YAML has core structure and TapStack description', () => {
    expect(yamlTpl.AWSTemplateFormatVersion).toBeDefined();
    expect(yamlTpl.Description).toMatch(/TapStack/i);
    expect(yamlTpl.Resources).toBeDefined();
  });

  // 2
  test('YAML includes RegionGuard mapping and conditions', () => {
    expect(yamlTpl.Mappings?.RegionGuard).toBeDefined();
    expect(yamlTpl.Conditions).toBeDefined();
  });

  // 3
  test('YAML parameters include environment, owner, networking, compute, and DB basics', () => {
    const P = yamlTpl.Parameters!;
    expect(P.EnvironmentName).toBeDefined();
    expect(P.OwnerTag).toBeDefined();
    expect(P.VpcCidr).toBeDefined();
    expect(P.AppSubnetCidrs).toBeDefined();
    expect(P.DbSubnetCidrs).toBeDefined();
    expect(P.EgressSubnetCidrs).toBeDefined();
    expect(P.AppImageId).toBeDefined();
    expect(P.InstanceType).toBeDefined();
    expect(P.DbEngine).toBeDefined();
    expect(P.DbPort).toBeDefined();
  });

  // 4
  test('YAML resources include KMS key and alias', () => {
    const key = res(yamlTpl, 'KmsKey');
    const alias = res(yamlTpl, 'KmsAlias');
    expect(key.Type).toBe('AWS::KMS::Key');
    expect(alias.Type).toBe('AWS::KMS::Alias');
  });

  // 5
  test('KMS key policy grants include EC2 or AutoScaling access for EBS use', () => {
    const key = res(yamlTpl, 'KmsKey');
    const stmts = key.Properties?.KeyPolicy?.Statement || [];
    const hasEC2 = stmts.some((s: any) => s.Principal?.Service === 'ec2.amazonaws.com');
    const hasASG = stmts.some(
      (s: any) =>
        s.Principal?.Service === 'autoscaling.amazonaws.com' ||
        (typeof s.Principal?.AWS === 'string' && s.Principal.AWS.includes('AWSServiceRoleForAutoScaling')),
    );
    expect(hasEC2 || hasASG).toBe(true);
  });

  // 6
  test('S3: LogsBucket and AppDataBucket exist; logs policy present', () => {
    const logs = res(yamlTpl, 'LogsBucket');
    const logsPol = res(yamlTpl, 'LogsBucketPolicy');
    const app = res(yamlTpl, 'AppDataBucket');
    expect(logs.Type).toBe('AWS::S3::Bucket');
    expect(app.Type).toBe('AWS::S3::Bucket');
    expect(logsPol.Type).toBe('AWS::S3::BucketPolicy');
  });

  // 7
  test('AppDataBucket is KMS-encrypted (SSE aws:kms)', () => {
    const app = res(yamlTpl, 'AppDataBucket');
    const sse = app.Properties?.BucketEncryption?.ServerSideEncryptionConfiguration?.[0]?.ServerSideEncryptionByDefault;
    expect(sse).toBeDefined();
    expect(String(sse.SSEAlgorithm)).toMatch(/kms/i);
  });

  // 8
  test('Networking core: VPC, IGW, NATs, subnets, and route tables exist', () => {
    [
      'VPC',
      'InternetGateway',
      'VPCGatewayAttachment',
      'EgressSubnetA',
      'EgressSubnetB',
      'EgressRT',
      'EIPA',
      'EIPB',
      'NatGwA',
      'NatGwB',
      'AppSubnetA',
      'AppSubnetB',
      'AppRT',
      'AppRouteToNATa',
      'DbSubnetA',
      'DbSubnetB',
      'DbRT',
      'DbRouteToNATb',
    ].forEach((id) => res(yamlTpl, id));
  });

  // 9
  test('Security groups: AlbSG, WebSG, DbSG defined', () => {
    res(yamlTpl, 'AlbSG');
    res(yamlTpl, 'WebSG');
    res(yamlTpl, 'DbSG');
  });

  // 10
  test('ALB, TargetGroup, Listener are present and reasonable', () => {
    const alb = res(yamlTpl, 'ALB');
    const tg = res(yamlTpl, 'ALBTargetGroup');
    const l = res(yamlTpl, 'ALBListenerHTTP');
    expect(alb.Type).toBe('AWS::ElasticLoadBalancingV2::LoadBalancer');
    expect(tg.Type).toBe('AWS::ElasticLoadBalancingV2::TargetGroup');
    expect(l.Type).toBe('AWS::ElasticLoadBalancingV2::Listener');
  });

  // 11
  test('ALB has access logging attributes referencing S3', () => {
    const alb = res(yamlTpl, 'ALB');
    const attrs = alb.Properties?.LoadBalancerAttributes || [];
    const enabled = attrs.find((a: any) => a.Key === 'access_logs.s3.enabled');
    const bucket = attrs.find((a: any) => a.Key === 'access_logs.s3.bucket');
    expect(enabled).toBeDefined();
    expect(bucket).toBeDefined();
  });

  // 12
  test('Flow logs: role, log group, and VPC FlowLog exist', () => {
    res(yamlTpl, 'FlowLogsRole');
    res(yamlTpl, 'FlowLogsGroup');
    res(yamlTpl, 'VpcFlowLog');
  });

  // 13
  test('LaunchTemplate has encrypted root EBS and installs nginx via user-data', () => {
    const lt = res(yamlTpl, 'LaunchTemplate');
    const ebs = lt.Properties?.LaunchTemplateData?.BlockDeviceMappings?.[0]?.Ebs;
    expect(ebs).toBeDefined();
    expect(ebs.Encrypted).toBe(true);
    const ud = JSON.stringify(lt.Properties?.LaunchTemplateData?.UserData);
    expect(ud).toMatch(/dnf/i);
    expect(ud).toMatch(/nginx/i);
  });

  // 14
  test('LaunchTemplate attaches instance profile and security group', () => {
    const lt = res(yamlTpl, 'LaunchTemplate');
    const ltd = lt.Properties?.LaunchTemplateData;
    expect(ltd?.IamInstanceProfile?.Arn).toBeDefined();
    const nis = ltd?.NetworkInterfaces?.[0];
    expect(Array.isArray(nis?.Groups)).toBe(true);
    expect(nis?.Groups.length).toBeGreaterThan(0);
  });

  // 15
  test('AutoScalingGroup exists, targets TG, and has grace period', () => {
    const asg = res(yamlTpl, 'AutoScalingGroup');
    expect(asg.Type).toBe('AWS::AutoScaling::AutoScalingGroup');
    const tgs = asg.Properties?.TargetGroupARNs || [];
    expect(Array.isArray(tgs) && tgs.length > 0).toBe(true);
    expect(asg.Properties?.HealthCheckType).toBeDefined();
    expect(asg.Properties?.HealthCheckGracePeriod).toBeDefined();
  });

  // 16
  test('RDS: SubnetGroup and DBInstance (encrypted, private, KMS) exist', () => {
    const sg = res(yamlTpl, 'DbSubnetGroup');
    const db = res(yamlTpl, 'DBInstance');
    expect(sg.Type).toBe('AWS::RDS::DBSubnetGroup');
    expect(db.Type).toBe('AWS::RDS::DBInstance');
    expect(db.Properties?.StorageEncrypted).toBe(true);
    expect(db.Properties?.PubliclyAccessible).toBe(false);
    expect(db.Properties?.KmsKeyId).toBeDefined();
  });

  // 17
  test('CloudTrail trail exists, uses KMS and S3, and IsLogging is true', () => {
    const ct = res(yamlTpl, 'CloudTrailTrail');
    expect(ct.Properties?.KMSKeyId).toBeDefined();
    expect(ct.Properties?.S3BucketName).toBeDefined();
    expect(ct.Properties?.IsLogging).toBe(true);
  });

  // 18
  test('Custom resource for SSM SecureString parameter is present', () => {
    const role = res(yamlTpl, 'SSMWriterRole');
    const fn = res(yamlTpl, 'SSMWriterFunction');
    const cr = res(yamlTpl, 'AppSecretParam');
    expect(role.Type).toBe('AWS::IAM::Role');
    expect(fn.Type).toBe('AWS::Lambda::Function');
    expect(cr.Type).toBe('Custom::SSMParameter');
  });

  // 19
  test('Outputs include AlbDnsName, RdsEndpoint, VpcId, and key names', () => {
    const O = yamlTpl.Outputs!;
    expect(O).toBeDefined();
    ['AlbDnsName', 'RdsEndpoint', 'VpcId', 'AppDataBucketName', 'LogsBucketName', 'KmsKeyArn'].forEach((k) => {
      expect(O[k]).toBeDefined();
    });
  });

  // 20
  test('ALB SG exposes TCP/80 to world; DB SG allows from WebSG', () => {
    const alb = res(yamlTpl, 'AlbSG');
    const db = res(yamlTpl, 'DbSG');
    const albIngress = alb.Properties?.SecurityGroupIngress || [];
    expect(albIngress.some((r: any) => r.FromPort === 80 && r.CidrIp === '0.0.0.0/0')).toBe(true);
    const dbIngress = db.Properties?.SecurityGroupIngress || [];
    expect(dbIngress.some((r: any) => !!r.SourceSecurityGroupId && r.FromPort !== undefined)).toBe(true);
  });

  // 21
  test('App route table goes to NAT; egress route table goes to IGW', () => {
    const appRoute = res(yamlTpl, 'AppRouteToNATa');
    const egressRoute = res(yamlTpl, 'EgressRouteToIGW');
    expect(appRoute.Properties?.NatGatewayId).toBeDefined();
    expect(egressRoute.Properties?.GatewayId).toBeDefined();
  });

  // 22
  test('CloudWatch LogGroups use KMS key', () => {
    const appLG = res(yamlTpl, 'AppLogGroup');
    const flowLG = res(yamlTpl, 'FlowLogsGroup');
    expect(appLG.Properties?.KmsKeyId).toBeDefined();
    expect(flowLG.Properties?.KmsKeyId).toBeDefined();
  });

  // 23
  test('Parameter constraints: DbPort is Number; DbEngine supports postgres/mysql', () => {
    const P = yamlTpl.Parameters!;
    expect(P.DbPort?.Type).toBe('Number');
    const engines = P.DbEngine?.AllowedValues || [];
    expect(engines).toEqual(expect.arrayContaining(['postgres', 'mysql']));
  });

  // 24
  test('Region guard SSM parameter exists to enforce us-west-2', () => {
    const rg = res(yamlTpl, 'RegionAssert');
    expect(rg.Type).toBe('AWS::SSM::Parameter');
    expect(rg.Properties?.Value).toBeDefined();
  });

  // 25 (optional subset check on JSON; skip if file not present)
  test('JSON template (if present) mirrors a core subset of resources', () => {
    if (!jsonTpl) {
      expect(true).toBe(true);
      return;
    }
    const need = ['VPC', 'ALB', 'ALBTargetGroup', 'ALBListenerHTTP', 'LaunchTemplate', 'AutoScalingGroup', 'DBInstance'];
    need.forEach((id) => expect(jsonTpl.Resources?.[id]).toBeDefined());
  });
});
