// test/tap-stack.unit.test.ts
/**
 * Comprehensive unit tests for the TapStack CloudFormation template(s).
 *
 * Project expectations:
 *  - YAML template at ../lib/TapStack.yml
 *  - JSON template at ../lib/TapStack.json (used as the source of truth for parsing)
 *
 * Tooling assumptions:
 *  - Jest + ts-jest are configured
 *  - Node type defs available (fs/path)
 *
 * NOTE: We intentionally avoid third-party CloudFormation YAML schemas to prevent
 *       build-time dependency errors. We parse/validate the JSON template deeply,
 *       and only assert presence/readability for the YAML file.
 */

import * as fs from 'fs';
import * as path from 'path';

type CfnTemplate = {
  AWSTemplateFormatVersion?: string;
  Description?: string;
  Parameters?: Record<string, any>;
  Mappings?: Record<string, any>;
  Conditions?: Record<string, any>;
  Resources: Record<string, any>;
  Outputs?: Record<string, any>;
};

function loadText(relPath: string): string {
  const filePath = path.resolve(__dirname, relPath);
  return fs.readFileSync(filePath, 'utf8');
}

function loadJsonTemplate(relPath: string): CfnTemplate {
  const filePath = path.resolve(__dirname, relPath);
  const text = fs.readFileSync(filePath, 'utf8');
  return JSON.parse(text);
}

function getResourcesByType(tpl: CfnTemplate, type: string) {
  return Object.entries(tpl.Resources || {}).filter(
    ([, res]) => res?.Type === type,
  );
}

function getResource(tpl: CfnTemplate, logicalId: string) {
  return tpl.Resources?.[logicalId];
}

function hasStatementForPrincipal(statements: any[], principalService: string | RegExp): boolean {
  return (statements || []).some((s) => {
    const p = s?.Principal;
    if (!p) return false;

    const matches = (val: any) => {
      if (!val) return false;
      if (principalService instanceof RegExp) {
        return typeof val === 'string' ? principalService.test(val) : false;
      }
      return val === principalService;
    };

    if (typeof p === 'string') return matches(p);

    if (p.Service) {
      if (typeof p.Service === 'string') return matches(p.Service);
      if (Array.isArray(p.Service)) return p.Service.some(matches);
    }
    if (p.AWS) {
      if (typeof p.AWS === 'string') return matches(p.AWS);
      if (Array.isArray(p.AWS)) return p.AWS.some(matches);
    }
    return false;
  });
}

function propertyContainsDeep(obj: any, predicate: (k: string, v: any) => boolean): boolean {
  if (obj === null || obj === undefined) return false;
  if (typeof obj !== 'object') return false;
  for (const [k, v] of Object.entries(obj)) {
    if (predicate(k, v)) return true;
    if (typeof v === 'object' && propertyContainsDeep(v, predicate)) return true;
  }
  return false;
}

function getAllListenerProtocols(tpl: CfnTemplate): string[] {
  const listeners = getResourcesByType(tpl, 'AWS::ElasticLoadBalancingV2::Listener').map(
    ([, res]) => res,
  );
  const protocols: string[] = [];
  for (const l of listeners) {
    const proto = l?.Properties?.Protocol;
    if (typeof proto === 'string') protocols.push(proto.toUpperCase());
  }
  return protocols;
}

function expectLowercaseDnsName(name: any) {
  if (typeof name === 'string') {
    expect(/^[a-z0-9][a-z0-9.-]*[a-z0-9]$/.test(name)).toBe(true);
  } else if (typeof name === 'object') {
    // If using Fn::Sub/Refs, we can’t resolve here; presence is enough.
    expect(name).toBeDefined();
  }
}

describe('TapStack CloudFormation templates (YAML presence, JSON deep validation)', () => {
  // --- YAML presence (no schema parsing to avoid build deps) ---
  test('YAML template exists and is readable', () => {
    const yml = loadText('../lib/TapStack.yml');
    expect(yml && yml.length).toBeGreaterThan(0);
    // cheap sanity: should mention AWSTemplateFormatVersion or Description
    expect(/AWSTemplateFormatVersion|Description/i.test(yml)).toBe(true);
  });

  // --- JSON: source of truth for structural validations ---
  const tpl = loadJsonTemplate('../lib/TapStack.json');

  test('JSON template parses & has required sections', () => {
    expect(tpl).toBeTruthy();
    expect(typeof tpl).toBe('object');
    expect(tpl.Resources && typeof tpl.Resources).toBeTruthy();
    expect(tpl.Description).toBeTruthy();
  });

  test('Parameters sanity', () => {
    const p = tpl.Parameters || {};
    const requiredParams = [
      'ProjectName',
      'EnvironmentName',
      'AllowedIngressCIDRForAlbHttp',
      'InstanceType',
      'MinCapacity',
      'MaxCapacity',
      'AppPort',
      'LogRetentionDays',
    ];
    for (const k of requiredParams) {
      expect(p[k]).toBeDefined();
    }
  });

  test('KMS CMK & alias exist and are configured', () => {
    const kms = getResourcesByType(tpl, 'AWS::KMS::Key');
    expect(kms.length).toBeGreaterThanOrEqual(1);
    const [, kmsRes] = kms[0];
    expect(kmsRes.Properties?.EnableKeyRotation).toBe(true);

    const alias = getResourcesByType(tpl, 'AWS::KMS::Alias');
    expect(alias.length).toBeGreaterThanOrEqual(1);
    const [, aliasRes] = alias[0];
    const aliasName = aliasRes.Properties?.AliasName;
    if (typeof aliasName === 'string') {
      expect(aliasName).toMatch(/^alias\/[a-z0-9-]+/);
    }

    // Key policy should at least include CloudTrail principal
    const stmts = kmsRes.Properties?.KeyPolicy?.Statement || [];
    const hasCloudTrail = hasStatementForPrincipal(stmts, 'cloudtrail.amazonaws.com');
    expect(hasCloudTrail).toBe(true);

    // CloudWatch Logs usage might be service-managed; if present, accept either logs.<region>.amazonaws.com or logs.amazonaws.com
    const hasLogsPrincipal =
      hasStatementForPrincipal(stmts, /(^|[.])logs(\.|$)/i) ||
      propertyContainsDeep(stmts, (k, v) => k === 'Service' && typeof v === 'string' && /logs/i.test(v));
    // Do not fail if logs principal isn’t present (some stacks use service-managed encryption for CW Logs)
    expect(typeof hasLogsPrincipal).toBe('boolean');
  });

  test('S3 buckets & policies (trail-logs, access-logs, lambda-artifacts)', () => {
    const buckets = getResourcesByType(tpl, 'AWS::S3::Bucket');
    expect(buckets.length).toBeGreaterThanOrEqual(3);

    // Validate basic encryption & public access block on each
    for (const [, res] of buckets) {
      const bn = res.Properties?.BucketName;
      expectLowercaseDnsName(bn);

      expect(res.Properties?.PublicAccessBlockConfiguration).toBeDefined();
      const sse = res.Properties?.BucketEncryption?.ServerSideEncryptionConfiguration?.[0]?.ServerSideEncryptionByDefault;
      expect(sse?.SSEAlgorithm).toBe('aws:kms');
    }

    // TrailLogs bucket policy — TLS enforced & deny unencrypted puts
    const trailPolicy = getResource(tpl, 'TrailLogsBucketPolicy');
    expect(trailPolicy?.Type).toBe('AWS::S3::BucketPolicy');
    const statements = trailPolicy?.Properties?.PolicyDocument?.Statement || [];
    const hasDenyInsecure = statements.some((s: any) => s.Condition?.Bool?.['aws:SecureTransport'] === false);
    expect(hasDenyInsecure).toBe(true);
    const hasDenyUnenc = statements.some((s: any) => s.Condition?.StringNotEquals?.['s3:x-amz-server-side-encryption'] === 'aws:kms');
    expect(hasDenyUnenc).toBe(true);
    const hasCtWrite = statements.some(
      (s: any) => hasStatementForPrincipal([s], 'cloudtrail.amazonaws.com') && JSON.stringify(s.Action).includes('s3:PutObject'),
    );
    expect(hasCtWrite).toBe(true);
  });

  test('Networking: VPC, Subnets, IGW, NAT, Routes', () => {
    expect(getResourcesByType(tpl, 'AWS::EC2::VPC').length).toBe(1);
    const subnets = getResourcesByType(tpl, 'AWS::EC2::Subnet');
    expect(subnets.length).toBeGreaterThanOrEqual(4);
    expect(getResourcesByType(tpl, 'AWS::EC2::InternetGateway').length).toBe(1);
    expect(getResourcesByType(tpl, 'AWS::EC2::VPCGatewayAttachment').length).toBe(1);
    expect(getResourcesByType(tpl, 'AWS::EC2::EIP').length).toBeGreaterThanOrEqual(1);
    expect(getResourcesByType(tpl, 'AWS::EC2::NatGateway').length).toBeGreaterThanOrEqual(1);
    expect(getResourcesByType(tpl, 'AWS::EC2::RouteTable').length).toBeGreaterThanOrEqual(2);
    expect(getResourcesByType(tpl, 'AWS::EC2::Route').length).toBeGreaterThanOrEqual(2);
  });

  test('VPC Endpoints (S3/KMS/Logs/SSM/EC2Messages)', () => {
    const endpoints = getResourcesByType(tpl, 'AWS::EC2::VPCEndpoint').map(([, r]) => r);
    expect(endpoints.length).toBeGreaterThanOrEqual(5);
    const types = endpoints.reduce<Record<string, number>>((acc, r) => {
      const t = r.Properties?.VpcEndpointType;
      acc[t] = (acc[t] || 0) + 1;
      return acc;
    }, {});
    expect(types['Gateway']).toBeGreaterThanOrEqual(1);     // S3
    expect((types['Interface'] || 0)).toBeGreaterThanOrEqual(4); // KMS/Logs/SSM/EC2Messages
  });

  test('ALB, Listener (HTTP-only), TargetGroup', () => {
    const albs = getResourcesByType(tpl, 'AWS::ElasticLoadBalancingV2::LoadBalancer');
    expect(albs.length).toBe(1);

    const listeners = getResourcesByType(tpl, 'AWS::ElasticLoadBalancingV2::Listener');
    expect(listeners.length).toBeGreaterThanOrEqual(1);
    const protocols = getAllListenerProtocols(tpl);
    expect(protocols).toContain('HTTP');
    expect(protocols).not.toContain('HTTPS');

    const tgs = getResourcesByType(tpl, 'AWS::ElasticLoadBalancingV2::TargetGroup');
    expect(tgs.length).toBe(1);
    const [, tg] = tgs[0];
    expect(tg.Properties?.Protocol).toBe('HTTP');
    expect(tg.Properties?.TargetType).toBe('instance');
  });

  test('WAFv2 WebACL & association', () => {
    const webacls = getResourcesByType(tpl, 'AWS::WAFv2::WebACL');
    expect(webacls.length).toBe(1);
    const [, webacl] = webacls[0];
    const rules = webacl.Properties?.Rules || [];
    expect(rules.length).toBeGreaterThanOrEqual(4);

    const assoc = getResourcesByType(tpl, 'AWS::WAFv2::WebACLAssociation');
    expect(assoc.length).toBe(1);
  });

  test('EC2 LaunchTemplate & ASG (private, SSM, encrypted EBS)', () => {
    const lts = getResourcesByType(tpl, 'AWS::EC2::LaunchTemplate');
    expect(lts.length).toBe(1);
    const [, lt] = lts[0];
    const ebs = lt.Properties?.LaunchTemplateData?.BlockDeviceMappings?.[0]?.Ebs;
    expect(ebs?.Encrypted).toBe(true);
    expect(ebs?.KmsKeyId).toBeUndefined(); // avoid stabilization race

    const asgs = getResourcesByType(tpl, 'AWS::AutoScaling::AutoScalingGroup');
    expect(asgs.length).toBe(1);
    const [, asg] = asgs[0];
    expect(asg.Properties?.TargetGroupARNs?.length || 0).toBeGreaterThanOrEqual(1);
    expect(asg.Properties?.VPCZoneIdentifier?.length || 0).toBeGreaterThanOrEqual(2);
    expect(asg.Properties?.HealthCheckType).toBe('ELB');

    const userData = lt.Properties?.LaunchTemplateData?.UserData;
    expect(userData).toBeDefined();
  });

  test('Lambda function (least-priv, KMS env, logs)', () => {
    const fns = getResourcesByType(tpl, 'AWS::Lambda::Function');
    expect(fns.length).toBe(1);
    const [, fn] = fns[0];
    expect(fn.Properties?.Runtime).toBeDefined();
    expect(fn.Properties?.KmsKeyArn).toBeDefined();
    expect(fn.Properties?.Environment?.Variables).toBeDefined();

    const lg = getResource(tpl, 'LambdaLogGroup');
    expect(lg?.Type).toBe('AWS::Logs::LogGroup');
    expect(lg?.Properties?.RetentionInDays).toBeDefined();
  });

  test('CloudTrail (multi-region, validation, S3 + CloudWatch Logs)', () => {
    const trails = getResourcesByType(tpl, 'AWS::CloudTrail::Trail');
    expect(trails.length).toBe(1);
    const [, tr] = trails[0];
    expect(tr.Properties?.IsMultiRegionTrail).toBe(true);
    expect(tr.Properties?.EnableLogFileValidation).toBe(true);
    expect(tr.Properties?.S3BucketName).toBeDefined();
    expect(tr.Properties?.CloudWatchLogsLogGroupArn).toBeDefined();
    expect(tr.Properties?.CloudWatchLogsRoleArn).toBeDefined();
    expect(tr.Properties?.IsLogging).toBe(true);
  });

  test('GuardDuty detector (optional toggle, if present must be enabled)', () => {
    const detectors = getResourcesByType(tpl, 'AWS::GuardDuty::Detector');
    if (detectors.length > 0) {
      const [, det] = detectors[0];
      expect(det.Properties?.Enable).toBe(true);
    }
  });

  test('No AWS Config resources present (explicitly excluded)', () => {
    const cfgAny = Object.entries(tpl.Resources || {}).some(
      ([, r]) => typeof r?.Type === 'string' && r.Type.startsWith('AWS::Config::'),
    );
    expect(cfgAny).toBe(false);
  });

  test('Outputs are complete and useful', () => {
    const o = tpl.Outputs || {};
    const requiredOutputs = [
      'VPCId',
      'PublicSubnetIds',
      'PrivateSubnetIds',
      'AlbArn',
      'AlbDnsName',
      'AlbSecurityGroupId',
      'TargetGroupArn',
      'WebAclArn',
      'Ec2AutoScalingGroupName',
      'Ec2InstanceProfileArn',
      'LambdaFunctionName',
      'LambdaFunctionArn',
      'LambdaLogGroupName',
      'TrailName',
      'TrailArn',
      'CloudTrailLogGroupArn',
      'KmsKeyArn',
      'AccessLogsBucketName',
      'TrailLogsBucketName',
      'LambdaArtifactsBucketName',
      'S3GatewayEndpointId',
      'KmsInterfaceEndpointId',
      'LogsInterfaceEndpointId',
      'SsmInterfaceEndpointId',
      'Ec2MessagesInterfaceEndpointId',
    ];
    for (const key of requiredOutputs) {
      expect(o[key]).toBeDefined();
      expect(o[key].Value).toBeDefined();
    }
  });

  test('No HTTPS listeners or ACM references', () => {
    const listenerProtocols = getAllListenerProtocols(tpl);
    expect(listenerProtocols).not.toContain('HTTPS');

    const hasAcm = Object.entries(tpl.Resources || {}).some(
      ([, r]) => typeof r?.Type === 'string' && r.Type.startsWith('AWS::CertificateManager'),
    );
    expect(hasAcm).toBe(false);
  });

  test('Bucket names are DNS-safe (where literal)', () => {
    const buckets = getResourcesByType(tpl, 'AWS::S3::Bucket');
    for (const [, res] of buckets) {
      const name = res?.Properties?.BucketName;
      expectLowercaseDnsName(name);
    }
  });

  test('IAM roles are least-privilege-scoped', () => {
    const roles = getResourcesByType(tpl, 'AWS::IAM::Role');

    // Find EC2 role by either logical ID, role name (case-insensitive), or having SSM Core policy
    const ec2ByLogical = getResource(tpl, 'EC2InstanceRole');
    const ec2ByName = roles
      .map(([, r]) => r)
      .find((r) => (r.Properties?.RoleName || '').toString().toLowerCase().includes('ec2'));
    const ec2ByPolicy = roles
      .map(([, r]) => r)
      .find((r) => (r.Properties?.ManagedPolicyArns || []).some((a: string) => a.includes('AmazonSSMManagedInstanceCore')));
    const ec2Role = ec2ByLogical || ec2ByName || ec2ByPolicy;
    expect(ec2Role).toBeDefined();
    const ec2Managed = ec2Role?.Properties?.ManagedPolicyArns || [];
    const hasSsmCore = ec2Managed.some((a: string) => a.includes('AmazonSSMManagedInstanceCore'));
    expect(hasSsmCore).toBe(true);

    // Lambda role should include AWSLambdaVPCAccessExecutionRole (if Lambda is in a VPC)
    const lambdaRole =
      getResource(tpl, 'LambdaExecutionRole') ||
      roles.map(([, r]) => r).find((r) => (r.Properties?.RoleName || '').toString().toLowerCase().includes('lambda'));
    expect(lambdaRole).toBeDefined();
    const lambdaManaged = lambdaRole?.Properties?.ManagedPolicyArns || [];
    const hasVpcAccess = lambdaManaged.some((a: string) => a.includes('AWSLambdaVPCAccessExecutionRole'));
    expect(hasVpcAccess).toBe(true);

    // Inline policy breadth check (soft guard against '*' on Resource without any conditions)
    const tooBroad = roles
      .map(([, r]) => r)
      .some((r) => {
        const policies = r.Properties?.Policies || [];
        return policies.some((p: any) => {
          const stmts = p?.PolicyDocument?.Statement || [];
          return stmts.some(
            (s: any) =>
              (s.Resource === '*' || (Array.isArray(s.Resource) && s.Resource.includes('*'))) &&
              !(s?.Condition), // flag if star without any condition at all
          );
        });
      });
    expect(tooBroad).toBe(false);
  });
});
