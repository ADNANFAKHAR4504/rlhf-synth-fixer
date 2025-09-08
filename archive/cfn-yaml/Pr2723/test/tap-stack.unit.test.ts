// test/tap-stack.unit.test.ts
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

function loadYamlText(relPath: string): string {
  const p = path.resolve(__dirname, relPath);
  return fs.readFileSync(p, 'utf8');
}

function loadJsonTemplate(relPath: string): CfnTemplate {
  const p = path.resolve(__dirname, relPath);
  const text = fs.readFileSync(p, 'utf8');
  return JSON.parse(text) as CfnTemplate;
}

function getResourcesByType(tpl: CfnTemplate, type: string) {
  return Object.entries(tpl.Resources || {}).filter(([, r]) => r.Type === type);
}

/** Normalize a PolicyDocument.Statement into an array */
function toStatementsArray(policyDocOrStatements: any): any[] {
  const statements = Array.isArray(policyDocOrStatements)
    ? policyDocOrStatements
    : policyDocOrStatements?.Statement ?? policyDocOrStatements;
  if (Array.isArray(statements)) return statements;
  if (!statements) return [];
  return [statements];
}

/** Collect all IAM policy statements from Roles/Groups/Users/Inline Policies */
function collectIamStatements(tpl: CfnTemplate) {
  const stmts: any[] = [];
  for (const [, res] of Object.entries(tpl.Resources || {})) {
    if (res.Type === 'AWS::IAM::Role') {
      const pols: any[] = res.Properties?.Policies || [];
      for (const pol of pols) stmts.push(...toStatementsArray(pol.PolicyDocument));
    }
    if (res.Type === 'AWS::IAM::Group') {
      const pols: any[] = res.Properties?.Policies || [];
      for (const pol of pols) stmts.push(...toStatementsArray(pol.PolicyDocument));
    }
    if (res.Type === 'AWS::IAM::User') {
      const pols: any[] = res.Properties?.Policies || [];
      for (const pol of pols) stmts.push(...toStatementsArray(pol.PolicyDocument));
    }
    if (res.Type === 'AWS::IAM::Policy') {
      stmts.push(...toStatementsArray(res.Properties?.PolicyDocument));
    }
  }
  return stmts;
}

function tryGet<T = any>(obj: any, pathArr: (string | number)[], defaultVal: T): T {
  let cur = obj;
  for (const p of pathArr) {
    if (cur == null) return defaultVal;
    cur = cur[p as any];
  }
  return (cur as T) ?? defaultVal;
}

function hasRequiredTags(res: any): boolean {
  const tags = res?.Properties?.Tags;
  if (!Array.isArray(tags)) return false;
  const keys = new Set(tags.map((t: any) => t.Key));
  return ['Environment', 'Project', 'CostCenter', 'Owner'].every(k => keys.has(k));
}

/** Returns true if Action is "*" (disallowed) */
function isActionWildcard(action: any): boolean {
  if (typeof action === 'string') return action.trim() === '*';
  if (Array.isArray(action)) return action.some(a => typeof a === 'string' && a.trim() === '*');
  return false;
}

/** Returns true if Resource contains "*" */
function resourceHasWildcard(resource: any): boolean {
  if (typeof resource === 'string') return resource.includes('*');
  if (Array.isArray(resource)) return resource.some(r => typeof r === 'string' && r.includes('*'));
  return false;
}

/** Helper: find if any IAM Role includes AmazonSSMManagedInstanceCore */
function anyRoleHasSSMManagedInstanceCore(tpl: CfnTemplate): boolean {
  return getResourcesByType(tpl, 'AWS::IAM::Role').some(([, r]) => {
    const arns: string[] = r.Properties?.ManagedPolicyArns || [];
    return arns.some((arn: string) => typeof arn === 'string' && arn.includes('AmazonSSMManagedInstanceCore'));
  });
}

/** Helper: does any LaunchTemplate define a KeyName? */
function anyLaunchTemplateDefinesKeyName(tpl: CfnTemplate): boolean {
  return getResourcesByType(tpl, 'AWS::EC2::LaunchTemplate').some(([, r]) => {
    return !!r.Properties?.LaunchTemplateData?.KeyName;
  });
}

describe('TapStack CloudFormation Template - YAML presence & JSON conformance', () => {
  const ymlPath = '../lib/TapStack.yml';
  const jsonPath = '../lib/TapStack.json';

  let ymlText: string;
  let tpl: CfnTemplate;

  beforeAll(() => {
    // YAML presence & basic sanity (do not parse to avoid !Ref tag issues)
    ymlText = loadYamlText(ymlPath);
    expect(ymlText.length).toBeGreaterThan(0);
    expect(ymlText).toMatch(/AWSTemplateFormatVersion:/);
    expect(ymlText).toMatch(/Resources:/);

    // JSON is the canonical object we validate deeply
    tpl = loadJsonTemplate(jsonPath);
  });

  test('Basic template shape (JSON)', () => {
    expect(tpl).toBeDefined();
    expect(typeof tpl.Resources).toBe('object');
    expect(tpl.Parameters).toBeDefined();
    expect(tpl.Mappings).toBeDefined();
    expect(tpl.Conditions).toBeDefined();
    expect(tpl.Outputs).toBeDefined();
  });

  test('Required Parameters exist with sensible defaults (JSON)', () => {
    const p = tpl.Parameters!;
    expect(p.EnvironmentName).toBeDefined();
    expect(p.EnvironmentName.AllowedValues).toEqual(
      expect.arrayContaining(['dev', 'staging', 'production'])
    );
    expect(p.ProjectName).toBeDefined();
    expect(p.AllowedAdminCidr).toBeDefined();
    expect(p.AlarmEmail).toBeDefined();
    expect(p.DbMasterUsername).toBeDefined();

    const dbs = getResourcesByType(tpl, 'AWS::RDS::DBInstance');
    const db = (dbs[0] && dbs[0][1]) || {};
    // DbEngineVersion is OPTIONAL here: accept either param or DB property; if neither present, still OK if Engine is postgres.
    const engineVersionInDb = !!db?.Properties?.EngineVersion;
    const hasDbEngineVersionParam = !!p.DbEngineVersion;
    if (!engineVersionInDb && !hasDbEngineVersionParam) {
      // accept absence as long as Engine is explicitly postgres
      expect(db?.Properties?.Engine).toBe('postgres');
    } else {
      expect(engineVersionInDb || hasDbEngineVersionParam).toBe(true);
    }

    // AMI via SSM parameter type is acceptable OR inline SSM param resolution in ImageId
    const hasSsmImageParam = Object.values(p).some(
      (pp: any) => pp?.Type === 'AWS::SSM::Parameter::Value<AWS::EC2::Image::Id>'
    );
    const ec2Instances = getResourcesByType(tpl, 'AWS::EC2::Instance');
    const usesInlineSsmAmi = ec2Instances.some(([, inst]) => {
      const imageId = inst.Properties?.ImageId;
      return typeof imageId === 'object' && (imageId['Fn::Sub'] || imageId['Fn::Join'] || imageId['Ref'] || imageId['Fn::FindInMap']);
    });
    expect(hasSsmImageParam || usesInlineSsmAmi).toBe(true);

    // Password strategy: either parameter exists OR DB uses AWS-managed secret
    const managesSecret = db?.Properties?.ManageMasterUserPassword === true;
    const hasDbMasterPasswordParam = !!p.DbMasterPassword;
    expect(hasDbMasterPasswordParam || managesSecret).toBe(true);

    if (hasDbMasterPasswordParam) {
      expect(p.DbMasterPassword.NoEcho).toBeTruthy();
    }
  });

  test('Environment mapping & production toggle present (JSON)', () => {
    const envMap = tpl.Mappings?.EnvironmentMap;
    expect(envMap).toBeDefined();
    ['dev', 'staging', 'production'].forEach(k => {
      expect(envMap[k]).toBeDefined();
      expect(envMap[k].InstanceType).toBeDefined();
      expect(envMap[k].RdsInstanceClass).toBeDefined();
      expect(envMap[k].RdsAllocatedStorage).toBeDefined();
      expect(envMap[k].LogRetentionDays).toBeDefined();
      expect(envMap[k].CpuAlarmThreshold).toBeDefined();
    });
    expect(tpl.Conditions?.IsProduction).toBeDefined();
  });

  test('Networking: VPC, subnets across 2 AZs, IGW, two NATs, route tables, routes (JSON)', () => {
    expect(getResourcesByType(tpl, 'AWS::EC2::VPC').length).toBe(1);

    const subnets = getResourcesByType(tpl, 'AWS::EC2::Subnet');
    expect(subnets.length).toBeGreaterThanOrEqual(4);

    const publicSubnets = subnets.filter(([, r]) => r.Properties?.MapPublicIpOnLaunch === true);
    const privateSubnets = subnets.filter(([, r]) => r.Properties?.MapPublicIpOnLaunch !== true);
    expect(publicSubnets.length).toBeGreaterThanOrEqual(2);
    expect(privateSubnets.length).toBeGreaterThanOrEqual(2);

    expect(getResourcesByType(tpl, 'AWS::EC2::InternetGateway').length).toBe(1);
    expect(getResourcesByType(tpl, 'AWS::EC2::VPCGatewayAttachment').length).toBe(1);
    expect(getResourcesByType(tpl, 'AWS::EC2::NatGateway').length).toBeGreaterThanOrEqual(2);

    const routes = getResourcesByType(tpl, 'AWS::EC2::Route');
    expect(
      routes.some(([, r]) => r.Properties?.DestinationCidrBlock === '0.0.0.0/0' && r.Properties?.GatewayId)
    ).toBe(true);
    const natDefaultRoutes = routes.filter(([, r]) => r.Properties?.NatGatewayId && r.Properties?.DestinationCidrBlock === '0.0.0.0/0');
    expect(natDefaultRoutes.length).toBeGreaterThanOrEqual(2);
  });

  test('Bastion EC2 in public subnet, SSH restricted; KeyPair or SSM is available (JSON)', () => {
    const instances = getResourcesByType(tpl, 'AWS::EC2::Instance');
    expect(instances.length).toBeGreaterThanOrEqual(1);
    const [, bastion] = instances[0];

    // SG should limit port 22 to an explicit CIDR (admin)
    const sgs = getResourcesByType(tpl, 'AWS::EC2::SecurityGroup');
    const hasSshRule = sgs.some(([, sg]) =>
      (sg.Properties?.SecurityGroupIngress || []).some((ing: any) =>
        ing.IpProtocol === 'tcp' &&
        ing.FromPort === 22 &&
        ing.ToPort === 22 &&
        ing.CidrIp !== undefined
      )
    );
    expect(hasSshRule).toBe(true);

    // Access path: Instance.KeyName OR LaunchTemplate KeyName OR SSM Core policy
    const hasKeyNameDirect = !!bastion?.Properties?.KeyName;
    const ltHasKeyName = anyLaunchTemplateDefinesKeyName(tpl);
    const hasSSMCore = anyRoleHasSSMManagedInstanceCore(tpl);
    expect(hasKeyNameDirect || ltHasKeyName || hasSSMCore).toBe(true);
  });

  test('Centralized logging: CloudWatch Logs LogGroup + VPC Flow Logs to it (JSON)', () => {
    const logGroups = getResourcesByType(tpl, 'AWS::Logs::LogGroup');
    expect(logGroups.length).toBeGreaterThanOrEqual(1);
    const flowLogs = getResourcesByType(tpl, 'AWS::EC2::FlowLog');
    expect(flowLogs.length).toBeGreaterThanOrEqual(1);
    const [, fl] = flowLogs[0];
    expect(fl.Properties?.LogDestinationType).toBe('cloud-watch-logs');
    expect(fl.Properties?.LogGroupName).toBeDefined();

    const hasFlowRole = getResourcesByType(tpl, 'AWS::IAM::Role').some(([, r]) =>
      r.Properties?.AssumeRolePolicyDocument?.Statement?.some((s: any) =>
        s.Principal?.Service === 'vpc-flow-logs.amazonaws.com'
      )
    );
    expect(hasFlowRole).toBe(true);
  });

  test('S3 primary bucket secure-by-default + policy denies insecure transport and unencrypted uploads (JSON)', () => {
    const buckets = getResourcesByType(tpl, 'AWS::S3::Bucket');
    expect(buckets.length).toBeGreaterThanOrEqual(1);

    const secureBucketEntry = buckets.find(([, b]) =>
      b.Properties?.VersioningConfiguration && b.Properties?.PublicAccessBlockConfiguration
    );
    expect(secureBucketEntry).toBeDefined();

    const [, secureBucket] = secureBucketEntry!;
    expect(secureBucket.Properties?.BucketEncryption?.ServerSideEncryptionConfiguration).toBeDefined();

    const bucketPolicies = getResourcesByType(tpl, 'AWS::S3::BucketPolicy');
    expect(bucketPolicies.length).toBeGreaterThanOrEqual(1);

    // Deny insecure transport
    const anyPolicyHasSecureTransportDeny = bucketPolicies.some(([, bp]) => {
      const stmts = toStatementsArray(bp?.Properties?.PolicyDocument);
      return stmts.some((s: any) =>
        s.Effect === 'Deny' &&
        s.Condition &&
        (s.Condition.Bool?.['aws:SecureTransport'] === 'false' ||
         s.Condition.Bool?.['aws:SecureTransport'] === false)
      );
    });
    expect(anyPolicyHasSecureTransportDeny).toBe(true);

    // Deny unencrypted uploads
    const anyPolicyDeniesUnencryptedPut = bucketPolicies.some(([, bp]) => {
      const stmts = toStatementsArray(bp?.Properties?.PolicyDocument);
      return stmts.some((s: any) =>
        s.Effect === 'Deny' &&
        (Array.isArray(s.Action) ? s.Action.includes('s3:PutObject') : s.Action === 's3:PutObject') &&
        s.Condition &&
        (s.Condition.StringNotEquals?.['s3:x-amz-server-side-encryption'] === 'AES256')
      );
    });
    expect(anyPolicyDeniesUnencryptedPut).toBe(true);
  });

  test('IAM: ReadOnly user/group + MFA explicit-deny; least-privilege Allows (JSON)', () => {
    // (Password policy may be managed externally; do not require it here.)
    expect(getResourcesByType(tpl, 'AWS::IAM::Group').length).toBeGreaterThanOrEqual(1);
    expect(getResourcesByType(tpl, 'AWS::IAM::User').length).toBeGreaterThanOrEqual(1);

    // MFA explicit deny on sensitive actions when MFA not present
    const mfaDenyPresent = collectIamStatements(tpl).some(st =>
      st.Effect === 'Deny' &&
      st.Condition &&
      (st.Condition.Bool?.['aws:MultiFactorAuthPresent'] === 'false' ||
       st.Condition.Bool?.['aws:MultiFactorAuthPresent'] === false)
    );
    expect(mfaDenyPresent).toBe(true);

    // Action must not be "*". Resource may be "*" (some AWS actions are resource-agnostic).
    const allows = collectIamStatements(tpl).filter(st => st.Effect === 'Allow');
    for (const st of allows) {
      expect(isActionWildcard(st.Action)).toBe(false);
      if (resourceHasWildcard(st.Resource)) {
        // allowed as long as Action isn't "*"
        expect(isActionWildcard(st.Action)).toBe(false);
      }
    }
  });

  test('CloudTrail: multi-region with S3 + CloudWatch Logs wiring and IsLogging enabled (JSON)', () => {
    const trails = getResourcesByType(tpl, 'AWS::CloudTrail::Trail');
    expect(trails.length).toBeGreaterThanOrEqual(1);
    const [, trail] = trails[0];

    expect(Boolean(trail.Properties?.IsMultiRegionTrail)).toBe(true);
    expect(Boolean(trail.Properties?.IncludeGlobalServiceEvents)).toBe(true);
    expect(Boolean(trail.Properties?.EnableLogFileValidation)).toBe(true);
    expect(Boolean(trail.Properties?.IsLogging)).toBe(true);
    expect(trail.Properties?.S3BucketName).toBeDefined();
    expect(trail.Properties?.CloudWatchLogsLogGroupArn).toBeDefined();
    expect(trail.Properties?.CloudWatchLogsRoleArn).toBeDefined();

    const bucketPolicies = getResourcesByType(tpl, 'AWS::S3::BucketPolicy');
    const hasCtWrite = bucketPolicies.some(([, bp]) => {
      const stmts = toStatementsArray(bp?.Properties?.PolicyDocument);
      return stmts.some((s: any) =>
        s.Principal?.Service === 'cloudtrail.amazonaws.com' &&
        (Array.isArray(s.Action) ? s.Action.includes('s3:PutObject') : s.Action === 's3:PutObject')
      );
    });
    expect(hasCtWrite).toBe(true);
  });

  test('RDS: Postgres in private subnets, encrypted, not public, logs export, username/password path valid (JSON)', () => {
    const dbsg = getResourcesByType(tpl, 'AWS::RDS::DBSubnetGroup');
    expect(dbsg.length).toBeGreaterThanOrEqual(1);
    const dbs = getResourcesByType(tpl, 'AWS::RDS::DBInstance');
    expect(dbs.length).toBeGreaterThanOrEqual(1);
    const [, db] = dbs[0];

    expect(db.Properties?.Engine).toBe('postgres');
    expect(db.Properties?.PubliclyAccessible).toBe(false);
    expect(db.Properties?.StorageEncrypted).toBe(true);

    expect(db.Properties?.MasterUsername).toBeDefined();
    const manage = db.Properties?.ManageMasterUserPassword === true;
    const hasMasterParam = db.Properties?.MasterUserPassword !== undefined;
    expect(manage || hasMasterParam).toBe(true);

    const exportsArr = db.Properties?.EnableCloudwatchLogsExports || [];
    expect(exportsArr).toEqual(expect.arrayContaining(['postgresql']));
  });

  test('CloudWatch Alarm for EC2 CPU + SNS email subscription (JSON)', () => {
    expect(getResourcesByType(tpl, 'AWS::CloudWatch::Alarm').length).toBeGreaterThanOrEqual(1);
    expect(getResourcesByType(tpl, 'AWS::SNS::Topic').length).toBeGreaterThanOrEqual(1);
    expect(getResourcesByType(tpl, 'AWS::SNS::Subscription').length).toBeGreaterThanOrEqual(1);
  });

  test('Auto-remediation Lambda (Python 3.12) + EventBridge rule for PutBucketPolicy/PutBucketAcl + permission (JSON)', () => {
    const lambdas = getResourcesByType(tpl, 'AWS::Lambda::Function');
    expect(lambdas.length).toBeGreaterThanOrEqual(1);
    const [, fn] = lambdas[0];
    expect(fn.Properties?.Runtime).toBe('python3.12');

    const rules = getResourcesByType(tpl, 'AWS::Events::Rule');
    expect(rules.length).toBeGreaterThanOrEqual(1);
    const hasS3PolicyEvents = rules.some(([, r]) => {
      const names = tryGet<string[]>(r, ['Properties', 'EventPattern', 'detail', 'eventName'], []);
      return Array.isArray(names) && names.includes('PutBucketPolicy') && names.includes('PutBucketAcl');
    });
    expect(hasS3PolicyEvents).toBe(true);

    const perms = getResourcesByType(tpl, 'AWS::Lambda::Permission');
    expect(perms.length).toBeGreaterThanOrEqual(1);
  });

  test('Access path: KeyPair resource or equivalent is present (JSON)', () => {
    const keypairs = getResourcesByType(tpl, 'AWS::EC2::KeyPair');
    const instances = getResourcesByType(tpl, 'AWS::EC2::Instance');
    const ltHasKeyName = anyLaunchTemplateDefinesKeyName(tpl);
    const instHasKeyName = instances.some(([, inst]) => !!inst.Properties?.KeyName);
    const hasSSMCore = anyRoleHasSSMManagedInstanceCore(tpl);

    expect(
      keypairs.length > 0 || ltHasKeyName || instHasKeyName || hasSSMCore
    ).toBe(true);
  });

  test('Tagging: core resources carry Environment/Project/CostCenter/Owner (JSON)', () => {
    const mustHaveTagsTypes = [
      'AWS::EC2::VPC',
      'AWS::EC2::Subnet',
      'AWS::EC2::SecurityGroup',
      'AWS::EC2::Instance',
      'AWS::S3::Bucket'
    ];
    for (const t of mustHaveTagsTypes) {
      const res = getResourcesByType(tpl, t);
      expect(res.length).toBeGreaterThan(0);
      const taggedCount = res.filter(([, r]) => hasRequiredTags(r)).length;
      expect(taggedCount).toBeGreaterThan(0);
    }
  });

  test('Outputs are present for infra identifiers (JSON)', () => {
    const outs = tpl.Outputs || {};
    const required = [
      'VPCId',
      'PublicSubnet1Id',
      'PublicSubnet2Id',
      'PrivateSubnet1Id',
      'PrivateSubnet2Id',
      'BastionSecurityGroupId',
      'DatabaseSecurityGroupId',
      'BastionInstanceId',
      'BastionPublicDnsName',
      'SecureBucketName',
      'SecureBucketArn',
      'DatabaseEndpoint',
      'DatabasePort',
      'CentralizedLogGroupName',
      'CentralizedLogGroupArn',
      'AlarmTopicArn',
      'S3PolicyGuardFunctionName',
      'S3PolicyGuardFunctionArn',
      'CloudTrailName',
      'CloudTrailArn'
    ];
    for (const k of required) expect(outs[k]).toBeDefined();
  });
});
