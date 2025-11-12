// test/tap-stack.unit.test.ts
import * as fs from 'fs';
import * as path from 'path';

type CFN = {
  AWSTemplateFormatVersion?: string;
  Description?: string;
  Parameters?: Record<string, any>;
  Mappings?: Record<string, any>;
  Conditions?: Record<string, any>;
  Resources?: Record<string, any>;
  Outputs?: Record<string, any>;
};

const JSON_PATH = path.resolve(__dirname, '../lib/TapStack.json');
const YAML_PATH = path.resolve(__dirname, '../lib/TapStack.yml');

// -------------------- Loaders --------------------
function tryLoadJson(): CFN | undefined {
  if (!fs.existsSync(JSON_PATH)) return undefined;
  const raw = fs.readFileSync(JSON_PATH, 'utf-8');
  return JSON.parse(raw);
}

function tryLoadYamlSafely(): CFN | undefined {
  if (!fs.existsSync(YAML_PATH)) return undefined;
  try {
    // Prefer CloudFormation-aware loader (handles !Ref, !Sub, etc.)
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const yamlCfn = require('yaml-cfn');
    const raw = fs.readFileSync(YAML_PATH, 'utf-8');
    return yamlCfn.yamlParse(raw) as CFN;
  } catch {
    // If yaml-cfn is not installed, silently ignore YAML to avoid !Ref errors.
    return undefined;
  }
}

const cfnJson = tryLoadJson();
const cfnYaml = tryLoadYamlSafely();

if (!cfnJson && !cfnYaml) {
  throw new Error("Neither '../lib/TapStack.json' nor '../lib/TapStack.yml' was found.");
}

// -------------------- Access helpers --------------------
/** Get the first defined value from JSON, then YAML */
const get = <T = any>(selector: (t: CFN) => T | undefined): T | undefined => {
  if (cfnJson) {
    const v = selector(cfnJson);
    if (v !== undefined) return v;
  }
  if (cfnYaml) {
    const v = selector(cfnYaml);
    if (v !== undefined) return v;
  }
  return undefined;
};

/** Must-have getter with helpful error messages */
const must = <T = any>(selector: (t: CFN) => T | undefined, msg: string): T => {
  const v = get(selector);
  if (v === undefined) throw new Error(msg);
  return v as T;
};

// -------------------- Action helpers --------------------
/** Accepts either a literal { Type: 'redirect', ... } or an intrinsic { "Fn::If": [cond, {Type:'redirect'}, {...}] } */
function isRedirectAction(action: any): boolean {
  if (!action) return false;
  if (action.Type === 'redirect') return true;
  if (action['Fn::If'] && Array.isArray(action['Fn::If']) && action['Fn::If'].length === 3) {
    const thenBranch = action['Fn::If'][1];
    return !!thenBranch && thenBranch.Type === 'redirect';
  }
  return false;
}

// -------------------- Tests --------------------
describe('TapStack CloudFormation Template — Unit Tests (JSON preferred; YAML fallback per-field)', () => {
  // 1
  test('Template has AWSTemplateFormatVersion and Description', () => {
    expect(get(t => t.AWSTemplateFormatVersion)).toBeDefined();
    expect(get(t => t.Description)).toBeDefined();
  });

  // 2
  test('EnvironmentSuffix parameter uses AllowedPattern (no hard AllowedValues)', () => {
    const p = must(t => t.Parameters?.EnvironmentSuffix, 'Parameters.EnvironmentSuffix missing');
    expect(p.AllowedPattern).toBeDefined();
    expect(p.AllowedValues).toBeUndefined();
  });

  // 3
  test('Central tag parameters exist: ProjectTag, OwnerTag, CostCenterTag', () => {
    const params = must(t => t.Parameters, 'Parameters missing');
    expect(params.ProjectTag).toBeDefined();
    expect(params.OwnerTag).toBeDefined();
    expect(params.CostCenterTag).toBeDefined();
  });

  // 4
  test('Networking core: VPC exists with Environment tag', () => {
    const vpc = must(t => t.Resources?.VPC, 'Resources.VPC missing');
    const tags = vpc.Properties?.Tags || [];
    const envTag = tags.find((x: any) => x.Key === 'Environment');
    expect(envTag).toBeDefined();
  });

  // 5
  test('Public subnets A/B/C exist with MapPublicIpOnLaunch = true', () => {
    const r = must(t => t.Resources, 'Resources missing');
    expect(r.PublicSubnetA?.Properties?.MapPublicIpOnLaunch).toBe(true);
    expect(r.PublicSubnetB?.Properties?.MapPublicIpOnLaunch).toBe(true);
    expect(r.PublicSubnetC?.Properties?.MapPublicIpOnLaunch).toBe(true);
  });

  // 6
  test('Private subnets A/B/C exist with MapPublicIpOnLaunch = false', () => {
    const r = must(t => t.Resources, 'Resources missing');
    expect(r.PrivateSubnetA?.Properties?.MapPublicIpOnLaunch).toBe(false);
    expect(r.PrivateSubnetB?.Properties?.MapPublicIpOnLaunch).toBe(false);
    expect(r.PrivateSubnetC?.Properties?.MapPublicIpOnLaunch).toBe(false);
  });

  // 7
  test('InternetGateway, NatEip, NatGateway and core route tables exist', () => {
    const r = must(t => t.Resources, 'Resources missing');
    expect(r.InternetGateway).toBeDefined();
    expect(r.NatEip).toBeDefined();
    expect(r.NatGateway).toBeDefined();
    expect(r.PublicRouteTable).toBeDefined();
    expect(r.PrivateRouteTable).toBeDefined();
  });

  // 8
  test('Route table associations present for all subnets', () => {
    const r = must(t => t.Resources, 'Resources missing');
    [
      'PublicSubnetARouteAssoc', 'PublicSubnetBRouteAssoc', 'PublicSubnetCRouteAssoc',
      'PrivateSubnetARouteAssoc', 'PrivateSubnetBRouteAssoc', 'PrivateSubnetCRouteAssoc'
    ].forEach(name => expect(r[name]).toBeDefined());
  });

  // 9
  test('Consolidated security groups: AlbSecurityGroup, AppSecurityGroup, DbSecurityGroup', () => {
    const r = must(t => t.Resources, 'Resources missing');
    expect(r.AlbSecurityGroup).toBeDefined();
    expect(r.AppSecurityGroup).toBeDefined();
    expect(r.DbSecurityGroup).toBeDefined();
  });

  // 10
  test('AlbSecurityGroup allows 80 and 443 from 0.0.0.0/0', () => {
    const sg = must(t => t.Resources?.AlbSecurityGroup, 'AlbSecurityGroup missing');
    const ingress = sg.Properties?.SecurityGroupIngress || [];
    const has80 = ingress.some((x: any) => x.IpProtocol === 'tcp' && x.FromPort === 80 && x.ToPort === 80);
    const has443 = ingress.some((x: any) => x.IpProtocol === 'tcp' && x.FromPort === 443 && x.ToPort === 443);
    expect(has80).toBe(true);
    expect(has443).toBe(true);
  });

  // 11
  test('DbSecurityGroup allows 3306 from AppSecurityGroup', () => {
    const sg = must(t => t.Resources?.DbSecurityGroup, 'DbSecurityGroup missing');
    const ingress = sg.Properties?.SecurityGroupIngress || [];
    const ok = ingress.some((x: any) => x.FromPort === 3306 && x.ToPort === 3306 && x.SourceSecurityGroupId);
    expect(ok).toBe(true);
  });

  // 12
  it('ALB, TargetGroup, and HTTP->HTTPS redirect listener exist', () => {
    const alb = must(t => t.Resources?.Alb, 'Alb missing');
    expect(alb.Type).toBe('AWS::ElasticLoadBalancingV2::LoadBalancer');

    const tg = must(t => t.Resources?.AlbTargetGroup, 'AlbTargetGroup missing');
    expect(tg.Type).toBe('AWS::ElasticLoadBalancingV2::TargetGroup');

    const http = must(t => t.Resources?.AlbListenerHttp, 'AlbListenerHttp missing');
    expect(http.Type).toBe('AWS::ElasticLoadBalancingV2::Listener');

    const defaultActions = http.Properties?.DefaultActions || [];
    expect(Array.isArray(defaultActions)).toBe(true);

    // Pass if either: (a) literal redirect, or (b) Fn::If with redirect in then-branch
    const hasRedirect = defaultActions.some(isRedirectAction);
    expect(hasRedirect).toBe(true);
  });

  // 13
  test('HTTPS listener is present (resource exists; may be conditional)', () => {
    const https = must(t => t.Resources?.AlbListenerHttps, 'AlbListenerHttps missing');
    expect(https).toBeDefined();
  });

  // 14
  test('LaunchTemplate exists with HttpTokens=require', () => {
    const lt = must(t => t.Resources?.WebLaunchTemplate, 'WebLaunchTemplate missing');
    const httpTokens = lt.Properties?.LaunchTemplateData?.MetadataOptions?.HttpTokens;
    expect(httpTokens).toBe('required');
  });

  // 15
  test('Three ASGs (A/B/C) exist and target the ALB TargetGroup', () => {
    const r = must(t => t.Resources, 'Resources missing');
    ['WebAsgA','WebAsgB','WebAsgC'].forEach(n => expect(r[n]).toBeDefined());
    const tgRefs = ['WebAsgA','WebAsgB','WebAsgC']
      .map(n => r[n].Properties?.TargetGroupARNs)
      .filter(Boolean);
    expect(tgRefs.length).toBe(3);
  });

  // 16
  test('AsgProfiles mapping exists with web-small, web-standard, web-large', () => {
    const m = must(t => t.Mappings?.AsgProfiles, 'Mappings.AsgProfiles missing');
    expect(m['web-small']).toBeDefined();
    expect(m['web-standard']).toBeDefined();
    expect(m['web-large']).toBeDefined();
  });

  // 17
  test('AssetsBucket and AssetsBucketPolicy exist; encryption and SecureTransport deny are set', () => {
    const r = must(t => t.Resources, 'Resources missing');
    const bucket = r.AssetsBucket;
    const policy = r.AssetsBucketPolicy;
    expect(bucket).toBeDefined();
    expect(policy).toBeDefined();
    const enc = bucket.Properties?.BucketEncryption?.ServerSideEncryptionConfiguration;
    expect(Array.isArray(enc)).toBe(true);
    const pd = policy.Properties?.PolicyDocument;
    const stmts = pd?.Statement || [];
    const hasDeny = stmts.some((s: any) => s.Sid === 'DenyInsecureTransport' && s.Effect === 'Deny');
    expect(hasDeny).toBe(true);
  });

  // 18
  test('AccessLogsBucket, when defined, uses Retain and lifecycle expiration', () => {
    const b = get(t => t.Resources?.AccessLogsBucket);
    if (!b) return; // optional; pass if not defined
    expect(b.DeletionPolicy).toBe('Retain');
    const rules = b.Properties?.LifecycleConfiguration?.Rules || [];
    const hasExpire = rules.some((r: any) => r.Status === 'Enabled' && (r.ExpirationInDays ?? 0) > 0);
    expect(hasExpire).toBe(true);
  });

  // 19
  test('S3 bucket names are globally unique via StackId-derived suffix', () => {
    const assets = must(t => t.Resources?.AssetsBucket, 'AssetsBucket missing');
    const name = assets.Properties?.BucketName;
    // Intrinsic structure expected (Join/Sub…), not a plain fixed string
    expect(typeof name === 'string').toBe(false);
    expect(name).toBeDefined();
  });

  // 20
  test('Aurora cluster uses ManageMasterUserPassword with DeletionProtection and Snapshot policies', () => {
    const c = must(t => t.Resources?.DbCluster, 'DbCluster missing');
    expect(c.Properties?.ManageMasterUserPassword).toBe(true);
    expect(c.Properties?.DeletionProtection).toBe(true);
    expect(c.DeletionPolicy).toBe('Snapshot');
    expect(c.UpdateReplacePolicy).toBe('Snapshot');
  });

  // 21
  test('DbInstanceWriter and DbInstanceReader exist with Monitoring configured', () => {
    const r = must(t => t.Resources, 'Resources missing');
    const w = r.DbInstanceWriter;
    const rd = r.DbInstanceReader;
    expect(w).toBeDefined();
    expect(rd).toBeDefined();
    expect(w.Properties?.MonitoringInterval).toBe(60);
    expect(rd.Properties?.MonitoringInterval).toBe(60);
    expect(w.Properties?.MonitoringRoleArn).toBeDefined();
    expect(rd.Properties?.MonitoringRoleArn).toBeDefined();
  });

  // 22
  test('RdsMonitoringRole uses correct trust principal and managed policy', () => {
    const role = must(t => t.Resources?.RdsMonitoringRole, 'RdsMonitoringRole missing');
    const principal = role.Properties?.AssumeRolePolicyDocument?.Statement?.[0]?.Principal?.Service;
    const managed = role.Properties?.ManagedPolicyArns || [];
    expect(principal).toBe('monitoring.rds.amazonaws.com');
    const hasManaged = managed.some((arn: string) =>
      typeof arn === 'string' && arn.includes('service-role/AmazonRDSEnhancedMonitoringRole')
    );
    expect(hasManaged).toBe(true);
  });

  // 23
  test('LambdaSharedRole (conditional) exists and avoids Action wildcards; X-Ray resource * is permitted', () => {
    const role = get(t => t.Resources?.LambdaSharedRole);
    if (!role) return; // optional; pass if not enabled
    const policies = (role.Properties?.Policies ?? []).map((p: any) => p.PolicyDocument);
    const anyActionStar = policies.some((doc: any) => {
      const stmts = ([] as any[]).concat(doc?.Statement ?? []);
      return stmts.some((s: any) =>
        (Array.isArray(s.Action) ? s.Action : [s.Action]).some((a: string) => a === '*')
      );
    });
    expect(anyActionStar).toBe(false);

    const invalidResourceStars = policies.some((doc: any) => {
      const stmts = ([] as any[]).concat(doc?.Statement ?? []);
      return stmts.some((s: any) => {
        const actions = (Array.isArray(s.Action) ? s.Action : [s.Action]).filter(Boolean);
        const resource = s.Resource;
        const isXrayOnly =
          actions.every((a: string) => a && a.startsWith('xray:')) && resource === '*';
        return resource === '*' && !isXrayOnly;
      });
    });
    expect(invalidResourceStars).toBe(false);
  });

  // 24
  test('Conditions include UseAlbHttps and CreateLogsBucket', () => {
    const c = must(t => t.Conditions, 'Conditions missing');
    expect(c.UseAlbHttps).toBeDefined();
    expect(c.CreateLogsBucket).toBeDefined();
  });

  // 25
  test('Outputs include ALB DNS, Aurora endpoints, SG IDs, ASG names, and AssetsBucketName', () => {
    const o = must(t => t.Outputs, 'Outputs missing');
    ['AlbDnsName','AuroraClusterEndpoint','AuroraReaderEndpoint','AlbSecurityGroupId',
     'AppSecurityGroupId','DbSecurityGroupId','WebAsgAName','WebAsgBName','WebAsgCName','AssetsBucketName']
      .forEach(k => expect(o[k]).toBeDefined());
  });

  // 26
  test('No legacy S3 AccessControl on AssetsBucket (use BucketPolicy + PAB)', () => {
    const b = must(t => t.Resources?.AssetsBucket, 'AssetsBucket missing');
    expect(b.Properties?.AccessControl).toBeUndefined();
    expect(b.Properties?.PublicAccessBlockConfiguration).toBeDefined();
  });

  // 27
  test('DbClusterParameterGroup exists with UTF8MB4 and UTC settings', () => {
    const pg = must(t => t.Resources?.DbClusterParamGroup, 'DbClusterParamGroup missing');
    const params = pg.Properties?.Parameters || {};
    expect(params['character_set_database']).toBe('utf8mb4');
    expect(params['character_set_server']).toBe('utf8mb4');
    expect(params['time_zone']).toBe('UTC');
  });
});
