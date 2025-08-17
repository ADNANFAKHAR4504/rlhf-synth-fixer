/**
 * Unit tests for lib/TapStack.yml
 * - No named IAM (RoleName/UserName absent)
 * - SSM Parameter Type is String, dynamic Name via !If
 * - Required resources exist
 * - SG is restricted to 443
 * - CloudTrail S3 policy denies delete & enforces TLS
 * - SecurityHub/AWS Config are conditionalized
 */

import * as fs from 'fs';
import * as yaml from 'js-yaml';
import * as path from 'path';

const tplPath = path.join(__dirname, '..', 'lib', 'TapStack.yml');
const raw = fs.readFileSync(tplPath, 'utf8');
const tpl = yaml.load(raw) as any;

function walk(obj: any, cb: (key: string, val: any, parent: any) => void) {
  if (Array.isArray(obj)) {
    for (const v of obj) walk(v, cb);
    return;
  }
  if (obj && typeof obj === 'object') {
    for (const [k, v] of Object.entries(obj)) {
      cb(k, v, obj);
      walk(v, cb);
    }
  }
}

describe('TapStack.yml (unit)', () => {
  it('has basic template properties', () => {
    expect(tpl).toBeTruthy();
    expect(tpl.AWSTemplateFormatVersion).toBeDefined();
    expect(tpl.Resources).toBeDefined();
    expect(typeof tpl.Resources).toBe('object');
  });

  it('does not specify RoleName or UserName anywhere (no named IAM, no IAM users)', () => {
    let foundRoleName = false;
    let foundUserName = false;
    walk(tpl, (k, _v) => {
      if (k === 'RoleName') foundRoleName = true;
      if (k === 'UserName') foundUserName = true;
    });
    expect(foundRoleName).toBe(false);
    expect(foundUserName).toBe(false);
  });

  it('includes required resources', () => {
    const r = tpl.Resources || {};
    const required = [
      'AppKmsKey',
      'VPC',
      'PublicSubnetA', 'PublicSubnetB', 'PrivateSubnetA', 'PrivateSubnetB',
      'AppBucket', 'CloudTrailBucket', 'ConfigBucket',
      'CloudTrailLogGroup', 'Trail',
      'VpcFlowLogGroup', 'VpcFlowLogs',
      'LambdaExecutionRole', 'AppLambda',
      'AppDbPasswordParam',
      'UnauthorizedMetricFilter', 'UnauthorizedAccessAlarm',
    ];
    for (const name of required) {
      expect(r[name]).toBeDefined();
    }
  });

  it('SSM parameter is Type=String and Name is conditional (!If)', () => {
    const p = tpl.Resources?.AppDbPasswordParam?.Properties;
    expect(p).toBeDefined();
    expect(p.Type).toBe('String');
    // Name must be an !If – after YAML load it becomes an object with Fn::If
    const ifObj = p.Name;
    expect(ifObj).toBeDefined();
    // Accept either short or long form depending on loader:
    const isIf = !!(ifObj?.['Fn::If'] || ifObj?.['!If']); // js-yaml normalizes to Fn::If
    expect(isIf).toBe(true);
  });

  it('Security Group only allows 443 inbound and 443 egress', () => {
    const sg = tpl.Resources?.WebSecurityGroup?.Properties;
    expect(sg).toBeDefined();
    const inRules = sg.SecurityGroupIngress;
    const outRules = sg.SecurityGroupEgress;
    expect(Array.isArray(inRules)).toBe(true);
    expect(Array.isArray(outRules)).toBe(true);

    // Ingress: only TCP 443
    for (const r of inRules) {
      expect(r.IpProtocol).toBe('tcp');
      expect(r.FromPort).toBe(443);
      expect(r.ToPort).toBe(443);
    }
    // Egress: only TCP 443 to 0.0.0.0/0
    for (const r of outRules) {
      expect(r.IpProtocol).toBe('tcp');
      expect(r.FromPort).toBe(443);
      expect(r.ToPort).toBe(443);
      expect(r.CidrIp).toBe('0.0.0.0/0');
    }
  });

  it('CloudTrail bucket policy denies delete and enforces TLS', () => {
    const pol = tpl.Resources?.CloudTrailBucketPolicy?.Properties?.PolicyDocument;
    expect(pol).toBeDefined();
    const stmts: any[] = pol.Statement || [];
    const denyDelete = stmts.find(s =>
      s.Sid === 'DenyDeleteCloudTrailLogs' ||
      (Array.isArray(s.Action) && s.Action.includes('s3:DeleteObject'))
    );
    expect(denyDelete).toBeDefined();
    const enforceTLS = stmts.find(s => s.Sid === 'EnforceTLS' && s.Effect === 'Deny');
    expect(enforceTLS).toBeDefined();
  });

  it('Security Hub and AWS Config resources are conditionalized', () => {
    const r = tpl.Resources || {};
    // Security Hub
    if (r.SecurityHubHub) expect(r.SecurityHubHub.Condition).toBe('CreateSecurityHub');
    if (r.SecurityHubFSBP) expect(r.SecurityHubFSBP.Condition).toBe('CreateSecurityHub');
    // AWS Config
    const cfgLogical = [
      'ConfigRole','ConfigRecorder','ConfigDeliveryChannel',
      'ConfigRuleCloudTrailEnabled','ConfigRuleS3SSE','ConfigRuleIamNoAdminStatements','ConfigRuleDefaultSgClosed',
    ];
    for (const name of cfgLogical) {
      if (r[name]) expect(r[name].Condition).toBe('CreateAWSConfig');
    }
  });
});
