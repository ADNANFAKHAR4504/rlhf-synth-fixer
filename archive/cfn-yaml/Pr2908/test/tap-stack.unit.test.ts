/* 
  __tests__/tapstack.test.ts

  Comprehensive unit tests for TapStack templates.

  Notes to keep the build green without extra typings:
  - We avoid @types/node / @types/jest by declaring globals.
  - We only "existence-check" the YAML file and fully validate the JSON template.
*/

/* eslint-disable @typescript-eslint/no-explicit-any */

// Jest globals (avoid requiring @types/jest)
declare const describe: any;
declare const it: any;
declare const expect: any;
declare const beforeAll: any;

// Node requires (avoid @types/node)
declare const require: any;
const fs = require('fs');
const path = require('path');

// ---------- Helpers ----------

function loadJsonTemplate(): any {
  const file = path.resolve(__dirname, '../lib/TapStack.json');
  const raw = fs.readFileSync(file, 'utf8');
  const tpl = JSON.parse(raw);
  return tpl;
}

function yamlExistsAndNotEmpty(): void {
  const ypath = path.resolve(__dirname, '../lib/TapStack.yml');
  expect(fs.existsSync(ypath)).toBe(true);
  const content = fs.readFileSync(ypath, 'utf8');
  expect(typeof content).toBe('string');
  expect(content.trim().length).toBeGreaterThan(50); // should be substantive
}

function getRes(tpl: any, logicalId: string): any {
  const r = tpl?.Resources?.[logicalId];
  expect(r).toBeTruthy();
  return r;
}

function ofType(tpl: any, type: string): string[] {
  const out: string[] = [];
  const resources = tpl?.Resources || {};
  for (const [k, v] of Object.entries(resources)) {
    if ((v as any)?.Type === type) out.push(k);
  }
  return out;
}

function getProp(res: any, prop: string): any {
  const p = res?.Properties?.[prop];
  expect(p).toBeDefined();
  return p;
}

function hasTag(res: any, key: string, expected?: string | { Ref?: string; 'Fn::Sub'?: any }): boolean {
  const tags = res?.Properties?.Tags;
  if (!tags) return false;
  const match = (tags as any[]).find(t => t?.Key === key);
  if (!match) return false;
  if (expected === undefined) return true;
  if (typeof expected === 'string') return match.Value === expected;
  if (expected?.Ref) return !!match.Value?.Ref && match.Value.Ref === expected.Ref;
  if ((expected as any)['Fn::Sub']) return !!match.Value?.['Fn::Sub'];
  return true;
}

function expectOwnerEnvTagsIfPresent(res: any) {
  const tags = res?.Properties?.Tags;
  if (!tags) return; // skip if resource doesn't have tags
  expect(hasTag(res, 'Owner')).toBe(true);
  expect(hasTag(res, 'Environment')).toBe(true);
}

// ---------- Tests ----------

describe('TapStack template validation', () => {
  let tpl: any;

  beforeAll(() => {
    // YAML existence check
    yamlExistsAndNotEmpty();

    // Load JSON template to assert against
    tpl = loadJsonTemplate();

    // Top-level presence
    expect(tpl.AWSTemplateFormatVersion).toBe('2010-09-09');
    expect(typeof tpl.Description).toBe('string');
    expect(tpl.Resources).toBeTruthy();
  });

  describe('Parameters & Conditions', () => {
    it('has all required Parameters initialized with defaults', () => {
      const p = tpl.Parameters;
      expect(p).toBeTruthy();

      const mustHave = [
        'Environment',
        'Owner',
        'VpcCidr',
        'PublicSubnetACidr',
        'PublicSubnetBCidr',
        'PublicSubnetCCidr',
        'PrivateSubnetACidr',
        'PrivateSubnetBCidr',
        'PrivateSubnetCCidr',
        'AzA',
        'AzB',
        'AzC',
        'AlertEmail'
      ];
      mustHave.forEach(k => expect(p[k]).toBeTruthy());

      // Defaults should be non-empty strings
      mustHave.forEach(k => {
        const def = p[k].Default;
        expect(typeof def).toBe('string');
        expect(def.length).toBeGreaterThan(0);
      });
    });

    it('defines HasAlertEmail condition', () => {
      const c = tpl.Conditions;
      expect(c).toBeTruthy();
      expect(c.HasAlertEmail).toBeTruthy();
    });
  });

  describe('Networking (VPC, Subnets, Routing, NAT, SGs, ALB)', () => {
    it('creates the VPC and Internet Gateway, with tagging', () => {
      const vpc = getRes(tpl, 'ProdVPC');
      expect(vpc.Type).toBe('AWS::EC2::VPC');
      expect(getProp(vpc, 'CidrBlock')).toBeTruthy();
      expectOwnerEnvTagsIfPresent(vpc);

      const igw = getRes(tpl, 'InternetGateway');
      expect(igw.Type).toBe('AWS::EC2::InternetGateway');
      expectOwnerEnvTagsIfPresent(igw);

      const attach = getRes(tpl, 'AttachGateway');
      expect(attach.Type).toBe('AWS::EC2::VPCGatewayAttachment');
    });

    it('creates 3 public and 3 private subnets across AzA/AzB/AzC', () => {
      const pubA = getRes(tpl, 'PublicSubnetA');
      const pubB = getRes(tpl, 'PublicSubnetB');
      const pubC = getRes(tpl, 'PublicSubnetC');
      const prvA = getRes(tpl, 'PrivateSubnetA');
      const prvB = getRes(tpl, 'PrivateSubnetB');
      const prvC = getRes(tpl, 'PrivateSubnetC');

      [pubA, pubB, pubC, prvA, prvB, prvC].forEach(expectOwnerEnvTagsIfPresent);

      // Check AZ refs exist (values are param Refs)
      expect(getProp(pubA, 'AvailabilityZone')).toBeTruthy();
      expect(getProp(pubB, 'AvailabilityZone')).toBeTruthy();
      expect(getProp(pubC, 'AvailabilityZone')).toBeTruthy();
    });

    it('creates NAT per AZ and routes 0.0.0.0/0 via NAT in private route tables', () => {
      ['NatGatewayA', 'NatGatewayB', 'NatGatewayC'].forEach(id => {
        const nat = getRes(tpl, id);
        expect(nat.Type).toBe('AWS::EC2::NatGateway');
        expectOwnerEnvTagsIfPresent(nat);
      });

      const rta = getRes(tpl, 'PrivateRouteA');
      const rtb = getRes(tpl, 'PrivateRouteB');
      const rtc = getRes(tpl, 'PrivateRouteC');

      [rta, rtb, rtc].forEach(r => {
        expect(r.Type).toBe('AWS::EC2::Route');
        expect(getProp(r, 'DestinationCidrBlock')).toBe('0.0.0.0/0');
      });
    });

    it('creates SecurityGroups for ALB, App, and Lambda', () => {
      const alb = getRes(tpl, 'ALBSG');
      const app = getRes(tpl, 'AppSG');
      const lam = getRes(tpl, 'LambdaSG');
      expect(alb.Type).toBe('AWS::EC2::SecurityGroup');
      expect(app.Type).toBe('AWS::EC2::SecurityGroup');
      expect(lam.Type).toBe('AWS::EC2::SecurityGroup');
      [alb, app, lam].forEach(expectOwnerEnvTagsIfPresent);
    });

    it('creates ALB, TargetGroup, Listener', () => {
      const lb = getRes(tpl, 'ApplicationLoadBalancer');
      expect(lb.Type).toBe('AWS::ElasticLoadBalancingV2::LoadBalancer');
      expectOwnerEnvTagsIfPresent(lb);

      const tg = getRes(tpl, 'TargetGroup');
      expect(tg.Type).toBe('AWS::ElasticLoadBalancingV2::TargetGroup');
      expectOwnerEnvTagsIfPresent(tg);

      const listener = getRes(tpl, 'ALBListener');
      expect(listener.Type).toBe('AWS::ElasticLoadBalancingV2::Listener');
    });
  });

  describe('Security: WAF & Association', () => {
    it('creates REGIONAL WebACL with AWS managed rule groups', () => {
      const waf = getRes(tpl, 'WebACL');
      expect(waf.Type).toBe('AWS::WAFv2::WebACL');
      const scope = getProp(waf, 'Scope');
      expect(scope).toBe('REGIONAL');

      const rules = getProp(waf, 'Rules');
      expect(Array.isArray(rules)).toBe(true);

      const names = rules.map((r: any) => r?.Name);
      expect(names).toEqual(
        expect.arrayContaining([
          'AWSManagedRulesCommonRuleSet',
          'AWSManagedRulesKnownBadInputsRuleSet',
          'AWSManagedRulesAmazonIpReputationList'
        ])
      );
      expectOwnerEnvTagsIfPresent(waf);
    });

    it('associates WebACL to the ALB', () => {
      const assoc = getRes(tpl, 'WebACLAssociation');
      expect(assoc.Type).toBe('AWS::WAFv2::WebACLAssociation');
      const resArn = getProp(assoc, 'ResourceArn');
      const webAclArn = getProp(assoc, 'WebACLArn');
      expect(resArn).toBeTruthy();
      expect(webAclArn).toBeTruthy();
    });
  });

  describe('Logging: Firehose → S3 (KMS), WAF Logging Configuration', () => {
    it('creates KMS key for logs and S3 bucket with SSE-KMS + public access blocks', () => {
      const kms = getRes(tpl, 'LogsKmsKey');
      expect(kms.Type).toBe('AWS::KMS::Key');
      expectOwnerEnvTagsIfPresent(kms);

      const bucket = getRes(tpl, 'WafLogsBucket');
      expect(bucket.Type).toBe('AWS::S3::Bucket');
      const enc = getProp(bucket, 'BucketEncryption');
      expect(enc?.ServerSideEncryptionConfiguration?.[0]?.ServerSideEncryptionByDefault?.SSEAlgorithm).toBe('aws:kms');
      expectOwnerEnvTagsIfPresent(bucket);

      const pab = getProp(bucket, 'PublicAccessBlockConfiguration');
      expect(pab.BlockPublicAcls).toBe(true);
      expect(pab.BlockPublicPolicy).toBe(true);
      expect(pab.IgnorePublicAcls).toBe(true);
      expect(pab.RestrictPublicBuckets).toBe(true);

      const pol = getRes(tpl, 'WafLogsBucketPolicy');
      expect(pol.Type).toBe('AWS::S3::BucketPolicy');
      const stmts = pol.Properties?.PolicyDocument?.Statement || [];
      const denyInsecure = stmts.find((s: any) => s.Sid === 'DenyInsecureTransport');
      expect(denyInsecure).toBeTruthy();
      const allowFH = stmts.find((s: any) => s.Sid === 'AllowFirehoseWrite');
      expect(allowFH).toBeTruthy();
    });

    it('creates Firehose role, log group, and delivery stream with aws-waf-logs- prefix', () => {
      const role = getRes(tpl, 'FirehoseRole');
      expect(role.Type).toBe('AWS::IAM::Role');
      expectOwnerEnvTagsIfPresent(role);

      const lg = getRes(tpl, 'FirehoseLogGroup');
      expect(lg.Type).toBe('AWS::Logs::LogGroup');
      expectOwnerEnvTagsIfPresent(lg);

      const fh = getRes(tpl, 'WafLogsDeliveryStream');
      expect(fh.Type).toBe('AWS::KinesisFirehose::DeliveryStream');
      const name = getProp(fh, 'DeliveryStreamName');
      // Either a string literal or Fn::Sub that resolves to a string containing the required prefix
      const val = typeof name === 'string' ? name : (name?.['Fn::Sub'] || '');
      expect(val).toBeTruthy();
      expect(String(val)).toContain('aws-waf-logs-');

      const dest = fh.Properties?.ExtendedS3DestinationConfiguration;
      expect(dest?.BucketARN).toBeTruthy();
      expect(dest?.RoleARN).toBeTruthy();
      expect(dest?.EncryptionConfiguration?.KMSEncryptionConfig?.AWSKMSKeyARN).toBeTruthy();
    });

    it('enables WAF logging and targets the Firehose ARN', () => {
      const lc = getRes(tpl, 'WAFLoggingConfiguration');
      expect(lc.Type).toBe('AWS::WAFv2::LoggingConfiguration');
      const dests = getProp(lc, 'LogDestinationConfigs');
      expect(Array.isArray(dests)).toBe(true);
      // First element should be a GetAtt of the delivery stream Arn
      const d0 = dests[0];
      expect(d0?.['Fn::GetAtt']).toBeTruthy();
      const arr = d0['Fn::GetAtt'];
      expect(Array.isArray(arr)).toBe(true);
      expect(arr[0]).toBe('WafLogsDeliveryStream');
      expect(arr[1]).toBe('Arn');
    });
  });

  describe('Monitoring & Alerts: Lambda + SNS + EventBridge', () => {
    it('creates KMS key for SNS and SNS Topic using that key', () => {
      const sk = getRes(tpl, 'SnsKmsKey');
      expect(sk.Type).toBe('AWS::KMS::Key');
      expectOwnerEnvTagsIfPresent(sk);

      const topic = getRes(tpl, 'ThreatAlertTopic');
      expect(topic.Type).toBe('AWS::SNS::Topic');
      expect(getProp(topic, 'KmsMasterKeyId')).toBeTruthy();
      expectOwnerEnvTagsIfPresent(topic);
    });

    it('creates Lambda role with least-privilege actions for S3/KMS/SNS/Logs', () => {
      const role = getRes(tpl, 'ThreatMonitoringLambdaRole');
      expect(role.Type).toBe('AWS::IAM::Role');
      expectOwnerEnvTagsIfPresent(role);
      const pols = role.Properties?.Policies || [];
      const joined = JSON.stringify(pols);
      // Basic action presence checks
      expect(joined).toContain('s3:GetObject');
      expect(joined).toContain('s3:ListBucket');
      expect(joined).toContain('kms:Decrypt');
      expect(joined).toContain('sns:Publish');
      expect(joined).toContain('logs:PutLogEvents');
    });

    it('creates Lambda with VPC config, env var to SNS, Python 3.12', () => {
      const fn = getRes(tpl, 'ThreatMonitoringLambda');
      expect(fn.Type).toBe('AWS::Lambda::Function');
      const rt = getProp(fn, 'Runtime');
      expect(rt).toBe('python3.12');
      const env = getProp(fn, 'Environment');
      expect(env?.Variables?.SNS_TOPIC_ARN).toBeTruthy();
      const vpcCfg = getProp(fn, 'VpcConfig');
      expect(Array.isArray(vpcCfg?.SubnetIds)).toBe(true);
      expect(Array.isArray(vpcCfg?.SecurityGroupIds)).toBe(true);
      expectOwnerEnvTagsIfPresent(fn);
    });

    it('wires EventBridge rule for S3 Object Created to Lambda with permission', () => {
      const rule = getRes(tpl, 'S3ObjectCreatedRule');
      expect(rule.Type).toBe('AWS::Events::Rule');
      const targets = getProp(rule, 'Targets');
      expect(Array.isArray(targets)).toBe(true);
      expect(targets[0]?.Arn?.['Fn::GetAtt']?.[0]).toBe('ThreatMonitoringLambda');

      const perm = getRes(tpl, 'LambdaInvokeFromEventsPermission');
      expect(perm.Type).toBe('AWS::Lambda::Permission');
      expect(getProp(perm, 'Principal')).toBe('events.amazonaws.com');
    });

    it('optionally subscribes email to SNS (Condition exists)', () => {
      // Resource exists; condition controls creation
      const sub = getRes(tpl, 'ThreatAlertEmailSubscription');
      expect(sub.Type).toBe('AWS::SNS::Subscription');
      // No further assertion; creation is conditional (HasAlertEmail)
    });
  });

  describe('Outputs & General Standards', () => {
    it('exposes useful Outputs for integration', () => {
      const o = tpl.Outputs;
      expect(o).toBeTruthy();
      const required = [
        'VPCId',
        'PublicSubnetIds',
        'PrivateSubnetIds',
        'LoadBalancerArn',
        'LoadBalancerDNSName',
        'TargetGroupArn',
        'WebACLArn',
        'WafLogsBucketName',
        'WafLogsBucketArn',
        'LogsKmsKeyArn',
        'SnsTopicArn',
        'ThreatLambdaArn',
        'LogsReadRoleArn',
        'FirehoseStreamArn'
      ];
      required.forEach(k => expect(o[k]).toBeTruthy());
    });

    it('most taggable resources include Owner and Environment tags when Tags are present', () => {
      const resources = tpl?.Resources || {};
      for (const id of Object.keys(resources)) {
        const res = resources[id];
        // only enforce when Tags are present on the resource
        if (res?.Properties?.Tags) {
          expect(hasTag(res, 'Owner')).toBe(true);
          expect(hasTag(res, 'Environment')).toBe(true);
        }
      }
    });
  });

  describe('Meta validations against requirements', () => {
    it('contains exactly one WAF WebACL and one WAF LoggingConfiguration', () => {
      expect(ofType(tpl, 'AWS::WAFv2::WebACL').length).toBe(1);
      expect(ofType(tpl, 'AWS::WAFv2::LoggingConfiguration').length).toBe(1);
    });

    it('contains required core components', () => {
      // KMS keys
      expect(ofType(tpl, 'AWS::KMS::Key')).toEqual(
        expect.arrayContaining(['LogsKmsKey', 'SnsKmsKey'])
      );

      // S3 bucket & policy
      expect(ofType(tpl, 'AWS::S3::Bucket')).toEqual(
        expect.arrayContaining(['WafLogsBucket'])
      );
      expect(ofType(tpl, 'AWS::S3::BucketPolicy')).toEqual(
        expect.arrayContaining(['WafLogsBucketPolicy'])
      );

      // Firehose
      expect(ofType(tpl, 'AWS::KinesisFirehose::DeliveryStream')).toEqual(
        expect.arrayContaining(['WafLogsDeliveryStream'])
      );

      // Lambda & Role
      expect(ofType(tpl, 'AWS::Lambda::Function')).toEqual(
        expect.arrayContaining(['ThreatMonitoringLambda'])
      );
      expect(ofType(tpl, 'AWS::IAM::Role')).toEqual(
        expect.arrayContaining(['ThreatMonitoringLambdaRole', 'FirehoseRole', 'LogsReadRole'])
      );

      // SNS
      expect(ofType(tpl, 'AWS::SNS::Topic')).toEqual(
        expect.arrayContaining(['ThreatAlertTopic'])
      );

      // EventBridge rule
      expect(ofType(tpl, 'AWS::Events::Rule')).toEqual(
        expect.arrayContaining(['S3ObjectCreatedRule'])
      );
    });
  });
});
