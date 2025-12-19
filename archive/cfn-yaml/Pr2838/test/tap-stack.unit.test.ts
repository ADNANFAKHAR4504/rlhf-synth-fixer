/**
 * test/tap-stack.unit.test.ts
 *
 * Comprehensive unit tests for TapStack CloudFormation template.
 * - Parses YAML with CloudFormation short-form intrinsics (!Ref, !Sub, etc.) via custom js-yaml schema.
 * - Validates core requirements, resource wiring, security posture, encryption, and outputs.
 */

import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';

// ---- CFN-aware YAML schema (support short-form intrinsics) ------------------

const cfnTypes: yaml.Type[] = [
  // !Ref scalar
  new yaml.Type('!Ref', {
    kind: 'scalar',
    construct: (data: any) => ({ Ref: data }),
  }),
  // !Sub scalar or sequence
  new yaml.Type('!Sub', {
    kind: 'scalar',
    construct: (data: any) => ({ 'Fn::Sub': data }),
  }),
  new yaml.Type('!Sub', {
    kind: 'sequence',
    construct: (data: any) => ({ 'Fn::Sub': data }),
  }),
  // !GetAtt scalar "Res.Attr" or sequence [Res, Attr]
  new yaml.Type('!GetAtt', {
    kind: 'scalar',
    construct: (data: string) => {
      const idx = data.indexOf('.');
      if (idx === -1) return { 'Fn::GetAtt': [data, ''] };
      return { 'Fn::GetAtt': [data.slice(0, idx), data.slice(idx + 1)] };
    },
  }),
  new yaml.Type('!GetAtt', {
    kind: 'sequence',
    construct: (data: any) => ({ 'Fn::GetAtt': data }),
  }),
  // Condition / Fn helpers (sequence)
  new yaml.Type('!If', {
    kind: 'sequence',
    construct: (data: any) => ({ 'Fn::If': data }),
  }),
  new yaml.Type('!Equals', {
    kind: 'sequence',
    construct: (data: any) => ({ 'Fn::Equals': data }),
  }),
  new yaml.Type('!And', {
    kind: 'sequence',
    construct: (data: any) => ({ 'Fn::And': data }),
  }),
  new yaml.Type('!Or', {
    kind: 'sequence',
    construct: (data: any) => ({ 'Fn::Or': data }),
  }),
  new yaml.Type('!Not', {
    kind: 'sequence',
    construct: (data: any) => ({ 'Fn::Not': data }),
  }),
  // Other Fn helpers
  new yaml.Type('!FindInMap', {
    kind: 'sequence',
    construct: (data: any) => ({ 'Fn::FindInMap': data }),
  }),
  new yaml.Type('!Join', {
    kind: 'sequence',
    construct: (data: any) => ({ 'Fn::Join': data }),
  }),
  new yaml.Type('!Select', {
    kind: 'sequence',
    construct: (data: any) => ({ 'Fn::Select': data }),
  }),
  new yaml.Type('!ImportValue', {
    kind: 'scalar',
    construct: (data: any) => ({ 'Fn::ImportValue': data }),
  }),
  new yaml.Type('!GetAZs', {
    kind: 'scalar',
    construct: (data: any) => ({ 'Fn::GetAZs': data }),
  }),
  new yaml.Type('!GetAZs', {
    kind: 'sequence',
    construct: (data: any) => ({ 'Fn::GetAZs': data }),
  }),
  new yaml.Type('!Base64', {
    kind: 'scalar',
    construct: (data: any) => ({ 'Fn::Base64': data }),
  }),
];

const CFN_SCHEMA = yaml.DEFAULT_SCHEMA.extend(cfnTypes);

// ---- Types ------------------------------------------------------------------

type CFNTemplate = {
  AWSTemplateFormatVersion?: string;
  Description?: string;
  Parameters?: Record<string, any>;
  Mappings?: Record<string, any>;
  Conditions?: Record<string, any>;
  Resources: Record<string, any>;
  Outputs?: Record<string, any>;
};

// ---- Helpers ----------------------------------------------------------------

function loadYamlTemplate(): CFNTemplate {
  const p = path.resolve(__dirname, '../lib/TapStack.yml');
  const raw = fs.readFileSync(p, 'utf8');
  const doc = yaml.load(raw, { schema: CFN_SCHEMA }) as CFNTemplate;
  if (!doc || !doc.Resources) {
    throw new Error('YAML template did not parse or has no Resources');
  }
  return doc;
}

function loadJsonTemplate(): CFNTemplate {
  const p = path.resolve(__dirname, '../lib/TapStack.json');
  const raw = fs.readFileSync(p, 'utf8');
  const doc = JSON.parse(raw) as CFNTemplate;
  if (!doc || !doc.Resources) {
    throw new Error('JSON template did not parse or has no Resources');
  }
  return doc;
}

function findResourcesByType(tpl: CFNTemplate, type: string): Array<[string, any]> {
  return Object.entries(tpl.Resources).filter(([, r]) => r?.Type === type);
}

function getResource(tpl: CFNTemplate, logicalId: string) {
  const r = tpl.Resources[logicalId];
  if (!r) throw new Error(`Resource ${logicalId} not found`);
  return r;
}

function getOutputsKeys(tpl: CFNTemplate): string[] {
  return Object.keys(tpl.Outputs || {});
}

// ---- Tests ------------------------------------------------------------------

describe('TapStack CloudFormation Template (YAML)', () => {
  const tpl = loadYamlTemplate();

  test('01 - Template has version, description, resources', () => {
    expect(tpl.AWSTemplateFormatVersion).toBeDefined();
    expect(tpl.Description).toMatch(/TapStack/i);
    expect(tpl.Resources).toBeDefined();
  });

  test('02 - Parameters have sane defaults (Env, DBEngineVersion=auto, etc.)', () => {
    const p = tpl.Parameters || {};
    expect(p.EnvironmentName?.Default).toBeDefined();
    expect(['Production', 'Staging']).toContain(p.EnvironmentName.Default);

    expect(p.DBEngineVersion?.Default).toBe('auto');
    expect(p.DBInstanceClass?.Default).toBeDefined();
    expect(p.AppInstanceType?.Default).toBeDefined();
    expect(p.DBName?.Default).toBeDefined();
    expect(p.DBUsername?.Default).toBeDefined();
  });

  test('03 - VPC has CIDR 10.0.0.0/16', () => {
    const vpc = getResource(tpl, 'VPC');
    expect(vpc.Type).toBe('AWS::EC2::VPC');
    expect(vpc.Properties?.CidrBlock).toBe('10.0.0.0/16');
  });

  test('04 - Public and Private subnets have expected CIDRs', () => {
    const pub = getResource(tpl, 'PublicSubnet');
    const priv = getResource(tpl, 'PrivateSubnet');
    expect(pub.Properties?.CidrBlock).toBe('10.0.1.0/24');
    expect(priv.Properties?.CidrBlock).toBe('10.0.2.0/24');
  });

  test('05 - InternetGateway + PublicRoute to IGW exist', () => {
    const igw = getResource(tpl, 'InternetGateway');
    expect(igw.Type).toBe('AWS::EC2::InternetGateway');

    const publicRoute = getResource(tpl, 'PublicRoute');
    expect(publicRoute.Properties?.DestinationCidrBlock).toBe('0.0.0.0/0');
    // GatewayId is a Ref to InternetGateway
    expect(publicRoute.Properties?.GatewayId?.Ref).toBe('InternetGateway');
  });

  test('06 - PrivateRouteTable exists and has no default route to IGW', () => {
    const privateRT = getResource(tpl, 'PrivateRouteTable');
    expect(privateRT.Type).toBe('AWS::EC2::RouteTable');
    const routes = findResourcesByType(tpl, 'AWS::EC2::Route');
    const extraDefaults = routes.filter(
      ([name, r]) =>
        name !== 'PublicRoute' &&
        r.Properties?.DestinationCidrBlock === '0.0.0.0/0' &&
        (r.Properties?.GatewayId || r.Properties?.NatGatewayId)
    );
    expect(extraDefaults.length).toBe(0);
  });

  test('09 - ALB is internet-facing and has HTTP :80 listener only', () => {
    const alb = getResource(tpl, 'ApplicationLoadBalancer');
    expect(alb.Properties?.Scheme).toBe('internet-facing');
    const listener = getResource(tpl, 'HTTPListener');
    expect(listener.Properties?.Port).toBe(80);
    expect(listener.Properties?.Protocol).toBe('HTTP');

    const listeners = findResourcesByType(tpl, 'AWS::ElasticLoadBalancingV2::Listener');
    const hasHTTPS = listeners.some(([, r]) => r.Properties?.Protocol === 'HTTPS' || r.Properties?.Port === 443);
    expect(hasHTTPS).toBe(false);
  });

  test('10 - ALB access logging is enabled to S3LogsBucket', () => {
    const alb = getResource(tpl, 'ApplicationLoadBalancer');
    const attrs = alb.Properties?.LoadBalancerAttributes || [];
    const map: Record<string, string> = {};
    for (const a of attrs) map[a.Key] = a.Value;
    expect(map['access_logs.s3.enabled']).toBe('true');
    expect(map['access_logs.s3.bucket']).toBeDefined();
  });

  test('11 - ALB SG allows inbound 80/tcp from the internet', () => {
    const albSg = getResource(tpl, 'ALBSecurityGroup');
    const ingress = albSg.Properties?.SecurityGroupIngress || [];
    const rule = ingress.find((r: any) => r.FromPort === 80 && r.ToPort === 80 && r.CidrIp === '0.0.0.0/0');
    expect(rule).toBeDefined();
  });

  test('12 - App SG allows 80/tcp from ALB SG and no SG-to-SG egress (avoids cycles)', () => {
    const appSg = getResource(tpl, 'AppSecurityGroup');
    const ingress = appSg.Properties?.SecurityGroupIngress || [];
    const fromAlb = ingress.find((r: any) => r.FromPort === 80 && r.SourceSecurityGroupId?.Ref === 'ALBSecurityGroup');
    expect(fromAlb).toBeDefined();

    const egress = appSg.Properties?.SecurityGroupEgress || [];
    const hasDestSg = egress.some((r: any) => r.DestinationSecurityGroupId);
    expect(hasDestSg).toBe(false);
  });

  test('13 - RDS SG allows 5432/tcp from App SG', () => {
    const rdsSg = getResource(tpl, 'RDSSecurityGroup');
    const ingress = rdsSg.Properties?.SecurityGroupIngress || [];
    const fromApp = ingress.find((r: any) => r.FromPort === 5432 && r.SourceSecurityGroupId?.Ref === 'AppSecurityGroup');
    expect(fromApp).toBeDefined();
  });

  test('14 - AutoScalingGroup capacity min=2, max=5, desired=2', () => {
    const asg = getResource(tpl, 'AutoScalingGroup');
    expect(asg.Properties?.MinSize).toBe(2);
    expect(asg.Properties?.MaxSize).toBe(5);
    expect(asg.Properties?.DesiredCapacity).toBe(2);
  });

  test('15 - LaunchTemplate uses Amazon Linux 2 via public SSM param', () => {
    const lt = getResource(tpl, 'LaunchTemplate');
    const imageId = lt.Properties?.LaunchTemplateData?.ImageId;
    expect(typeof imageId).toBe('string');
    expect(imageId).toMatch(/\/aws\/service\/ami-amazon-linux-latest\/amzn2-ami-hvm-x86_64-gp2/);
  });

  test('16 - DynamoDB: 5/5 capacity, SSE and PITR enabled', () => {
    const tbl = getResource(tpl, 'DynamoDBTable');
    expect(tbl.Properties?.ProvisionedThroughput?.ReadCapacityUnits).toBe(5);
    expect(tbl.Properties?.ProvisionedThroughput?.WriteCapacityUnits).toBe(5);
    expect(tbl.Properties?.SSESpecification?.SSEEnabled).toBe(true);
    expect(tbl.Properties?.PointInTimeRecoverySpecification?.PointInTimeRecoveryEnabled).toBe(true);
  });

  test('17 - RDS: Postgres, Multi-AZ, encrypted, not public', () => {
    const rds = getResource(tpl, 'RDSInstance');
    expect(rds.Properties?.Engine).toBe('postgres');
    expect(rds.Properties?.MultiAZ).toBe(true);
    expect(rds.Properties?.StorageEncrypted).toBe(true);
    expect(rds.Properties?.PubliclyAccessible).toBe(false);
  });

  test('18 - RDS EngineVersion is conditional (auto default -> omit via Fn::If)', () => {
    const rds = getResource(tpl, 'RDSInstance');
    const ev = rds.Properties?.EngineVersion;
    expect(ev?.['Fn::If']).toBeDefined();
    expect(ev['Fn::If'][0]).toBe('UseAutoDBVersion');
  });

  test('19 - RDS Master password is from Secrets Manager (dynamic reference)', () => {
    const rds = getResource(tpl, 'RDSInstance');
    const mup = rds.Properties?.MasterUserPassword;
    expect(mup?.['Fn::Sub']).toBeDefined();
    const sub: string = mup['Fn::Sub'];
    expect(sub).toMatch(/resolve:secretsmanager:\$\{DBMasterSecret\}:SecretString/);
  });

  test('20 - S3 logs buckets: encryption enabled and access logging configured', () => {
    const logs = getResource(tpl, 'S3LogsBucket');
    const access = getResource(tpl, 'S3AccessLogsBucket');
    const enc1 = logs.Properties?.BucketEncryption?.ServerSideEncryptionConfiguration?.[0]?.ServerSideEncryptionByDefault?.SSEAlgorithm;
    const enc2 = access.Properties?.BucketEncryption?.ServerSideEncryptionConfiguration?.[0]?.ServerSideEncryptionByDefault?.SSEAlgorithm;
    expect(enc1).toBe('AES256');
    expect(enc2).toBe('AES256');
    expect(logs.Properties?.LoggingConfiguration?.DestinationBucketName?.Ref).toBe('S3AccessLogsBucket');
  });

  test('21 - IAM InstanceRole has CloudWatchAgentServerPolicy + inline SSM/S3/DDB policies', () => {
    const role = getResource(tpl, 'InstanceRole');
    const managed = role.Properties?.ManagedPolicyArns || [];
    expect(managed).toContain('arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy');

    const inline = role.Properties?.Policies || [];
    const names = inline.map((p: any) => p.PolicyName);
    expect(names).toEqual(expect.arrayContaining(['SSMParameterAccess', 'S3Access', 'DynamoDBAccess']));
  });

  test('22 - CloudWatch Log Group is KMS-encrypted; KMS Key and Alias exist', () => {
    const lg = getResource(tpl, 'LogGroup');
    expect(lg.Properties?.KmsKeyId).toBeDefined();
    const kmsKey = getResource(tpl, 'LogsKmsKey');
    const kmsAlias = getResource(tpl, 'LogsKmsAlias');
    expect(kmsKey.Type).toBe('AWS::KMS::Key');
    expect(kmsAlias.Type).toBe('AWS::KMS::Alias');
  });

  test('23 - CloudWatch Dashboard exists', () => {
    const d = getResource(tpl, 'CloudWatchDashboard');
    expect(d.Type).toBe('AWS::CloudWatch::Dashboard');
    expect(d.Properties?.DashboardName?.['Fn::Sub']).toBeDefined();
  });

  test('24 - S3 BucketPolicy for ALB log delivery exists with statements', () => {
    const pol = getResource(tpl, 'S3LogsBucketPolicy');
    const stmt = pol.Properties?.PolicyDocument?.Statement || [];
    expect(Array.isArray(stmt)).toBe(true);
    expect(stmt.length).toBeGreaterThanOrEqual(2);
  });

  test('25 - No ACM Certificates and no HTTPS listeners (per requirement)', () => {
    const certs = findResourcesByType(tpl, 'AWS::CertificateManager::Certificate');
    expect(certs.length).toBe(0);
    const listeners = findResourcesByType(tpl, 'AWS::ElasticLoadBalancingV2::Listener');
    const https = listeners.filter(([, r]) => r.Properties?.Protocol === 'HTTPS' || r.Properties?.Port === 443);
    expect(https.length).toBe(0);
  });

  test('26 - Outputs include key exports (VPC, Subnets, ALB, ASG, RDS, DDB, S3, CW)', () => {
    const outs = getOutputsKeys(tpl);
    const expected = [
      'VpcId',
      'PublicSubnetId',
      'PrivateSubnetId',
      'AlbArn',
      'AlbDnsName',
      'AutoScalingGroupName',
      'RdsEndpoint',
      'DynamoTableName',
      'S3LogsBucketName',
      'CloudWatchDashboardName',
      'LogGroupName',
    ];
    expected.forEach((k) => expect(outs).toContain(k));
  });

  test('27 - EnvSlugMap mapping exists (for lowercase bucket names)', () => {
    expect(tpl.Mappings?.EnvSlugMap).toBeDefined();
    expect(tpl.Mappings!.EnvSlugMap!.Production?.Slug).toBeDefined();
    expect(tpl.Mappings!.EnvSlugMap!.Staging?.Slug).toBeDefined();
  });

  test('28 - LaunchTemplate has no TagSpecifications; ASG propagates tags', () => {
    const lt = getResource(tpl, 'LaunchTemplate');
    expect(lt.Properties?.LaunchTemplateData?.TagSpecifications).toBeUndefined();
    const asg = getResource(tpl, 'AutoScalingGroup');
    const tags = asg.Properties?.Tags || [];
    const envTag = tags.find((t: any) => t.Key === 'Environment');
    expect(envTag).toBeDefined();
    expect(envTag.PropagateAtLaunch).toBe(true);
  });

  test('29 - VPCEndpointSecurityGroup exists and is referenced by interface endpoints', () => {
    const sg = getResource(tpl, 'VPCEndpointSecurityGroup');
    expect(sg.Type).toBe('AWS::EC2::SecurityGroup');
    const eps = findResourcesByType(tpl, 'AWS::EC2::VPCEndpoint');
    const ifaceRefers = eps
      .filter(([, r]) => r.Properties?.VpcEndpointType === 'Interface')
      .every(([, r]) => {
        const sgs = r.Properties?.SecurityGroupIds || [];
        return sgs.some((id: any) => id.Ref === 'VPCEndpointSecurityGroup');
      });
    expect(ifaceRefers).toBe(true);
  });
});

describe('TapStack CloudFormation Template (JSON)', () => {
  let tplJson: CFNTemplate | null = null;

  test('A1 - JSON template parses and has Resources', () => {
    tplJson = loadJsonTemplate();
    expect(tplJson.Resources).toBeDefined();
  });

  test('A2 - JSON template includes a VPC and an ALB', () => {
    if (!tplJson) return;
    const vpcs = findResourcesByType(tplJson, 'AWS::EC2::VPC');
    const albs = findResourcesByType(tplJson, 'AWS::ElasticLoadBalancingV2::LoadBalancer');
    expect(vpcs.length).toBeGreaterThan(0);
    expect(albs.length).toBeGreaterThan(0);
  });

  test('A3 - JSON template includes an AutoScalingGroup with min/max bounds', () => {
    if (!tplJson) return;
    const asgs = findResourcesByType(tplJson, 'AWS::AutoScaling::AutoScalingGroup');
    expect(asgs.length).toBeGreaterThan(0);
    const [, asg] = asgs[0];
    expect(asg.Properties?.MinSize).toBeDefined();
    expect(asg.Properties?.MaxSize).toBeDefined();
  });
});
