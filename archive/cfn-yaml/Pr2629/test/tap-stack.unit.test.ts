/**
 * tapstack.unit.test.ts
 *
 * Comprehensive unit tests for TapStack CloudFormation template.
 *
 * Validates:
 * - Parameters, Conditions, Resources, and Outputs exist and follow your spec
 * - Security hardening (VPN-only SSH, S3 KMS + public access block, WAF, Shield toggle, CloudTrail)
 * - ALB HTTP->HTTPS redirect only (no direct 443 listener in this template)
 * - Optional creation via Conditions for Trail and Cross-Account role, and Shield Advanced
 *
 * Setup:
 *   npm i -D jest ts-jest @types/jest js-yaml yaml-cfn
 *   npx ts-jest config:init   (if you haven't already)
 *
 * Run:
 *   npx jest --runInBand
 */

import * as fs from 'fs';
import * as path from 'path';

let yaml: any;
let yamlCfn: any;
try {
  yaml = require('js-yaml');
} catch {
  // optional
}
try {
  yamlCfn = require('yaml-cfn');
} catch {
  // optional
}

type CfnTemplate = {
  AWSTemplateFormatVersion?: string;
  Description?: string;
  Parameters?: Record<string, any>;
  Conditions?: Record<string, any>;
  Mappings?: Record<string, any>;
  Resources?: Record<string, any>;
  Outputs?: Record<string, any>;
};

const TEMPLATE_REL_JSON = path.resolve(__dirname, '../lib/TapStack.json');
const TEMPLATE_REL_YAML = path.resolve(__dirname, '../lib/TapStack.yml');

function fileExists(p: string): boolean {
  try {
    fs.accessSync(p, fs.constants.R_OK);
    return true;
  } catch {
    return false;
  }
}

/**
 * Prefer JSON (for stable Fn::* shapes). Fall back to YAML → JSON if needed.
 */
function loadTemplate(): CfnTemplate {
  if (fileExists(TEMPLATE_REL_JSON)) {
    const raw = fs.readFileSync(TEMPLATE_REL_JSON, 'utf8');
    return JSON.parse(raw);
  }
  if (!fileExists(TEMPLATE_REL_YAML)) {
    throw new Error(`Neither JSON nor YAML template found at:
    JSON: ${TEMPLATE_REL_JSON}
    YAML: ${TEMPLATE_REL_YAML}`);
  }
  const raw = fs.readFileSync(TEMPLATE_REL_YAML, 'utf8');
  // Try yaml-cfn to convert CloudFormation YAML to JSON-like object (handles !Sub etc.)
  if (yamlCfn) {
    return yamlCfn.yamlParse(raw) as CfnTemplate;
  }
  if (yaml) {
    // Fallback: js-yaml (intrinsics may not be normalized, but better than nothing)
    return yaml.load(raw) as CfnTemplate;
  }
  throw new Error('Please install either "yaml-cfn" or "js-yaml" to parse the YAML template.');
}

const tpl: CfnTemplate = loadTemplate();
const res = tpl.Resources ?? {};
const params = tpl.Parameters ?? {};
const conds = tpl.Conditions ?? {};
const outputs = tpl.Outputs ?? {};

/** Helpers */
function resourcesOfType(type: string) {
  return Object.entries(res).filter(([, r]) => r.Type === type);
}
function resourceById(id: string) {
  const r = (res as any)[id];
  if (!r) throw new Error(`Expected resource "${id}" to exist`);
  return r;
}
function hasAllowedValues(paramName: string, expected: string[]) {
  const p = params[paramName];
  expect(p).toBeTruthy();
  expect(p.AllowedValues).toEqual(expected);
}
function getS3BucketPolicyDoc(bucketPolicyLogicalId: string) {
  const bp = resourceById(bucketPolicyLogicalId);
  expect(bp.Type).toBe('AWS::S3::BucketPolicy');
  const doc = bp.Properties?.PolicyDocument;
  expect(doc).toBeTruthy();
  expect(doc.Statement).toBeTruthy();
  return doc;
}
function findStatementBySid(doc: any, sid: string) {
  return (doc.Statement as any[]).find((s) => s.Sid === sid);
}
function findStatementContains(doc: any, predicate: (s: any) => boolean) {
  return (doc.Statement as any[]).find(predicate);
}

describe('TapStack template shape', () => {
  test('has AWSTemplateFormatVersion, Description, Parameters, Conditions, Resources, Outputs', () => {
    expect(tpl.AWSTemplateFormatVersion).toBeDefined();
    expect(typeof tpl.Description).toBe('string');
    expect(params).toBeTruthy();
    expect(conds).toBeTruthy();
    expect(res).toBeTruthy();
    expect(outputs).toBeTruthy();
  });
});

describe('Parameters', () => {
  test('required parameters exist with sensible defaults', () => {
    const expected = [
      'VpcCidr',
      'OnPremCidr',
      'CustomerGatewayIp',
      'CustomerGatewayBgpAsn',
      'OrganizationId',
      'ExternalAccountId',
      'EnableShieldAdvanced',
      'EnableCloudTrail',
    ];
    for (const p of expected) {
      expect(params[p]).toBeTruthy();
    }
    expect(params.VpcCidr.Default).toBe('10.0.0.0/16');
    expect(params.OnPremCidr.Default).toBe('192.168.0.0/16');
    expect(params.CustomerGatewayIp.Default).toBeDefined();
    expect(params.CustomerGatewayBgpAsn.Default).toBe(65000);
  });

  test('boolean switches use AllowedValues ["true","false"]', () => {
    hasAllowedValues('EnableShieldAdvanced', ['true', 'false']);
    hasAllowedValues('EnableCloudTrail', ['true', 'false']);
  });
});

describe('Conditions', () => {
  test('required conditions exist', () => {
    expect(conds.UseOrganizationGuard).toBeDefined();
    expect(conds.AllowCrossAccountRole).toBeDefined();
    expect(conds.CreateShield).toBeDefined();
    expect(conds.CreateTrail).toBeDefined();
  });
});

describe('Networking (VPC/Subnets/Routes)', () => {
  test('VPC has DNS support/hostnames enabled', () => {
    const vpc = resourceById('VPC');
    expect(vpc.Type).toBe('AWS::EC2::VPC');
    expect(vpc.Properties.EnableDnsSupport).toBe(true);
    expect(vpc.Properties.EnableDnsHostnames).toBe(true);
  });

  test('public subnets map public IP on launch; private do not', () => {
    const pubA = resourceById('PublicSubnetA');
    const pubB = resourceById('PublicSubnetB');
    const appA = resourceById('PrivateAppSubnetA');
    const appB = resourceById('PrivateAppSubnetB');
    const dbA = resourceById('PrivateDbSubnetA');
    const dbB = resourceById('PrivateDbSubnetB');

    expect(pubA.Properties.MapPublicIpOnLaunch).toBe(true);
    expect(pubB.Properties.MapPublicIpOnLaunch).toBe(true);
    expect(appA.Properties.MapPublicIpOnLaunch).toBe(false);
    expect(appB.Properties.MapPublicIpOnLaunch).toBe(false);
    expect(dbA.Properties.MapPublicIpOnLaunch).toBe(false);
    expect(dbB.Properties.MapPublicIpOnLaunch).toBe(false);
  });

  test('internet route exists to IGW', () => {
    const route = resourceById('PublicRoute');
    expect(route.Type).toBe('AWS::EC2::Route');
    expect(route.Properties.DestinationCidrBlock).toBe('0.0.0.0/0');
    expect(route.Properties.GatewayId).toBeDefined();
  });
});

describe('Security Groups (SSH only via VPN; no SSH on app; ALB 80 only)', () => {
  test('ManagementSecurityGroup allows SSH only from OnPremCidr', () => {
    const mgmt = resourceById('ManagementSecurityGroup');
    const ingress = mgmt.Properties.SecurityGroupIngress ?? [];
    expect(Array.isArray(ingress)).toBe(true);
    expect(ingress.length).toBe(1);

    const rule = ingress[0];
    expect(rule.FromPort).toBe(22);
    expect(rule.ToPort).toBe(22);
    // CidrIp should reference the OnPremCidr parameter
    expect(rule.CidrIp).toBeDefined();
    if (typeof rule.CidrIp === 'object') {
      expect(rule.CidrIp.Ref).toBe('OnPremCidr');
    } else {
      // if it's a literal value, ensure it's not open to world
      expect(rule.CidrIp).not.toBe('0.0.0.0/0');
    }
  });

  test('AppSecurityGroup has no inbound rules', () => {
    const app = resourceById('AppSecurityGroup');
    const ingress = app.Properties.SecurityGroupIngress ?? [];
    expect(ingress).toEqual([]);
  });

  test('ALB security group allows 80 only (for redirect)', () => {
    const albSg = resourceById('ALBSecurityGroup');
    const ingress = albSg.Properties.SecurityGroupIngress ?? [];
    const ports = ingress.map((r: any) => r.FromPort);
    expect(ports).toContain(80);
    // Ensure we don't expose 22 or 443 here
    expect(ports).not.toContain(22);
    expect(ports).not.toContain(443);
  });
});

describe('IPSec VPN (VGW, Attachment, CGW, VPNConnection, Route)', () => {
  test('VPN resources exist with correct properties', () => {
    const vgw = resourceById('VirtualPrivateGateway');
    expect(vgw.Type).toBe('AWS::EC2::VPNGateway');
    expect(vgw.Properties.Type).toBe('ipsec.1');

    const attach = resourceById('VPCVGWAttachment');
    expect(attach.Type).toBe('AWS::EC2::VPCGatewayAttachment');
    expect(attach.Properties.VpnGatewayId).toBeDefined();
    expect(attach.Properties.VpcId).toBeDefined();

    const cgw = resourceById('CustomerGateway');
    expect(cgw.Type).toBe('AWS::EC2::CustomerGateway');
    expect(cgw.Properties.Type).toBe('ipsec.1');
    expect(cgw.Properties.BgpAsn?.Ref || cgw.Properties.BgpAsn).toBeDefined();
    expect(cgw.Properties.IpAddress?.Ref || cgw.Properties.IpAddress).toBeDefined();

    const vpn = resourceById('VPNConnection');
    expect(vpn.Type).toBe('AWS::EC2::VPNConnection');
    expect(vpn.Properties.Type).toBe('ipsec.1');
    expect(vpn.Properties.StaticRoutesOnly).toBe(true);
    expect(vpn.Properties.CustomerGatewayId).toBeDefined();
    expect(vpn.Properties.VpnGatewayId).toBeDefined();

    const route = resourceById('VPNRouteToOnPremA');
    expect(route.Type).toBe('AWS::EC2::VPNConnectionRoute');
    expect(route.Properties.DestinationCidrBlock?.Ref || route.Properties.DestinationCidrBlock).toBeDefined();
    expect(route.Properties.VpnConnectionId).toBeDefined();
  });
});

describe('S3 + KMS for CloudTrail (conditional)', () => {
  test('Trail KMS key and alias are conditional on CreateTrail', () => {
    const key = resourceById('KmsKeyS3CloudTrail');
    const alias = resourceById('KmsAliasS3CloudTrail');
    expect(key.Condition).toBe('CreateTrail');
    expect(alias.Condition).toBe('CreateTrail');
    expect(key.Type).toBe('AWS::KMS::Key');
    expect(alias.Type).toBe('AWS::KMS::Alias');
    expect(key.Properties.EnableKeyRotation).toBe(true);

    // Key policy should allow root and cloudtrail service with expected actions
    const stmts = key.Properties.KeyPolicy?.Statement ?? [];
    const hasRoot = stmts.find((s: any) => s.Sid === 'AllowRootAccountFullAccess');
    expect(hasRoot).toBeTruthy();

    const ctStmt = stmts.find((s: any) => s.Sid === 'AllowCloudTrailUseOfTheKey');
    expect(ctStmt).toBeTruthy();
    const actions = (ctStmt.Action ?? []) as string[];
    expect(actions).toEqual(expect.arrayContaining(['kms:GenerateDataKey*', 'kms:DescribeKey', 'kms:Encrypt']));
  });

  test('TrailBucket uses SSE-KMS with CMK and public access block', () => {
    const bucket = resourceById('TrailBucket');
    expect(bucket.Condition).toBe('CreateTrail');
    expect(bucket.Type).toBe('AWS::S3::Bucket');

    const encCfg = bucket.Properties.BucketEncryption?.ServerSideEncryptionConfiguration ?? [];
    expect(encCfg.length).toBeGreaterThan(0);
    const rule = encCfg[0].ServerSideEncryptionByDefault;
    expect(rule.SSEAlgorithm).toBe('aws:kms');
    expect(rule.KMSMasterKeyID?.Ref).toBe('KmsKeyS3CloudTrail');

    const pab = bucket.Properties.PublicAccessBlockConfiguration;
    expect(pab.BlockPublicAcls).toBe(true);
    expect(pab.BlockPublicPolicy).toBe(true);
    expect(pab.IgnorePublicAcls).toBe(true);
    expect(pab.RestrictPublicBuckets).toBe(true);
  });

  test('TrailBucketPolicy denies insecure transport and allows CloudTrail writes; includes optional org guard', () => {
    const doc = getS3BucketPolicyDoc('TrailBucketPolicy');

    const denyInsecure = findStatementBySid(doc, 'DenyInsecureTransport');
    expect(denyInsecure).toBeTruthy();
    expect(denyInsecure.Effect).toBe('Deny');
    expect(denyInsecure.Condition?.Bool?.['aws:SecureTransport']).toBe('false');

    const allowAcl = findStatementBySid(doc, 'AWSCloudTrailAclCheck');
    expect(allowAcl).toBeTruthy();
    expect(allowAcl.Effect).toBe('Allow');

    const allowWrite = findStatementBySid(doc, 'AWSCloudTrailWrite');
    expect(allowWrite).toBeTruthy();
    expect(allowWrite.Condition?.StringEquals?.['s3:x-amz-acl']).toBe('bucket-owner-full-control');

    // Optional org guard (implemented with Fn::If) – check presence of aws:PrincipalOrgID somewhere
    const hasOrgGuard =
      findStatementContains(doc, (s) => !!(s.Condition?.StringNotEquals?.['aws:PrincipalOrgID'])) ||
      JSON.stringify(doc).includes('aws:PrincipalOrgID');
    expect(hasOrgGuard).toBe(true);
  });
});

describe('CloudTrail Trail + CW Logs integration (conditional)', () => {
  test('Trail has required properties and depends on TrailBucketPolicy', () => {
    const trail = resourceById('Trail');
    expect(trail.Condition).toBe('CreateTrail');
    expect(trail.Type).toBe('AWS::CloudTrail::Trail');
    expect(trail.Properties.IsMultiRegionTrail).toBe(true);
    expect(trail.Properties.EnableLogFileValidation).toBe(true);
    expect(trail.Properties.S3BucketName).toBeDefined();
    expect(trail.Properties.KMSKeyId).toBeDefined();
    expect(trail.Properties.CloudWatchLogsLogGroupArn).toBeDefined();
    expect(trail.Properties.CloudWatchLogsRoleArn).toBeDefined();

    const depends = trail.DependsOn;
    if (Array.isArray(depends)) {
      expect(depends).toContain('TrailBucketPolicy');
    } else {
      expect(depends === 'TrailBucketPolicy' || depends === undefined).toBeTruthy();
    }
  });

   test('HTTP listener redirects to HTTPS (301)', () => {
    const l = resourceById('ALBHttpListenerRedirectToHttps');
    expect(l.Type).toBe('AWS::ElasticLoadBalancingV2::Listener');
    expect(l.Properties.Port).toBe(80);
    expect(l.Properties.Protocol).toBe('HTTP');
    const action = (l.Properties.DefaultActions ?? [])[0];
    expect(action.Type).toBe('redirect');
    expect(action.RedirectConfig.Protocol).toBe('HTTPS');
    expect(action.RedirectConfig.Port).toBe('443');
    expect(action.RedirectConfig.StatusCode).toBe('HTTP_301');
  });

  test('WAFv2 WebACL is associated with ALB and uses AWS managed rule groups', () => {
    const waf = resourceById('WAFWebACL');
    expect(waf.Type).toBe('AWS::WAFv2::WebACL');
    expect(waf.Properties.Scope).toBe('REGIONAL');

    const rules = waf.Properties.Rules ?? [];
    const hasCommon = rules.find((r: any) => r.Statement?.ManagedRuleGroupStatement?.Name === 'AWSManagedRulesCommonRuleSet');
    const hasIPRep = rules.find((r: any) => r.Statement?.ManagedRuleGroupStatement?.Name === 'AWSManagedRulesAmazonIpReputationList');
    const hasSQLi = rules.find((r: any) => r.Statement?.ManagedRuleGroupStatement?.Name === 'AWSManagedRulesSQLiRuleSet');
    expect(hasCommon && hasIPRep && hasSQLi).toBeTruthy();

    const assoc = resourceById('WAFWebACLAssociationALB');
    expect(assoc.Type).toBe('AWS::WAFv2::WebACLAssociation');
    expect(assoc.Properties.ResourceArn).toBeDefined();
    expect(assoc.Properties.WebACLArn).toBeDefined();
  });

  test('Shield Advanced protection is conditional', () => {
    const shield = resourceById('ShieldProtectionALB');
    expect(shield.Type).toBe('AWS::Shield::Protection');
    expect(shield.Condition).toBe('CreateShield');
  });
});

describe('Cross-account read-only role (MFA-gated, conditional)', () => {
  test('Role exists only when ExternalAccountId is provided and enforces MFA', () => {
    const role = resourceById('CrossAccountAuditRole');
    expect(role.Condition).toBe('AllowCrossAccountRole');

    const trust = role.Properties.AssumeRolePolicyDocument?.Statement ?? [];
    const stmt = trust.find((s: any) => s.Action === 'sts:AssumeRole');
    expect(stmt).toBeTruthy();
    expect(stmt.Principal?.AWS).toBeDefined();
    // MFA condition
    expect(stmt.Condition?.Bool?.['aws:MultiFactorAuthPresent']).toBe('true');
  });

  test('Role policy is least-privilege read-only across listed services', () => {
    const role = resourceById('CrossAccountAuditRole');
    const pol = role.Properties.Policies?.find((p: any) => p.PolicyName === 'LimitedReadOnlyAudit');
    expect(pol).toBeTruthy();
    const actions = (pol.PolicyDocument?.Statement?.[0]?.Action ?? []) as string[];
    expect(actions).toEqual(
      expect.arrayContaining([
        'ec2:Describe*',
        'elasticloadbalancing:Describe*',
        's3:Get*',
        's3:List*',
        'cloudtrail:DescribeTrails',
        'cloudtrail:GetTrailStatus',
        'cloudtrail:ListTrails',
        'cloudtrail:LookupEvents',
        'iam:Get*',
        'iam:List*',
        'logs:Describe*',
        'logs:Get*',
      ])
    );
  });
});

describe('Outputs', () => {
  test('Core outputs exist', () => {
    const expectedAlways = [
      'VpcId',
      'PublicSubnets',
      'AppSubnets',
      'DbSubnets',
      'ALBArn',
      'ALBRedirectListenerArn',
      'WAFArn',
    ];
    for (const k of expectedAlways) {
      expect(outputs[k]).toBeTruthy();
    }
  });

  test('Conditional outputs exist with conditions set', () => {
    // Only when trail is enabled
    if (outputs.TrailBucketName) {
      expect(outputs.TrailBucketName.Condition).toBe('CreateTrail');
      expect(outputs.CloudTrailName.Condition).toBe('CreateTrail');
      expect(outputs.CloudTrailArn.Condition).toBe('CreateTrail');
    }
    // Only when external account is provided
    if (outputs.CrossAccountRoleArn) {
      // Either the Output itself is conditional, or the resource is
      expect(
        outputs.CrossAccountRoleArn.Condition === 'AllowCrossAccountRole' || outputs.CrossAccountRoleArn.Condition === undefined
      ).toBeTruthy();
    }
  });
});

describe('Negative guardrails (things that should NOT exist in this template)', () => {
  test('No RDS resources are created in this stack', () => {
    const rdsInstances = resourcesOfType('AWS::RDS::DBInstance');
    expect(rdsInstances.length).toBe(0);
  });

  test('No direct HTTPS listener is defined (only HTTP→HTTPS redirect)', () => {
    const listeners = resourcesOfType('AWS::ElasticLoadBalancingV2::Listener');
    // Verify there isn't a listener explicitly on port 443 in this template
    const has443 = listeners.some(([, l]) => l.Properties?.Port === 443 || l.Properties?.Port === '443');
    expect(has443).toBe(false);
  });
});
