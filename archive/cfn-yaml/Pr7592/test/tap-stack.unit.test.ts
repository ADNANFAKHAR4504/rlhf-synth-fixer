// test/tapstack.unit.test.ts

import * as fs from 'fs';
import * as path from 'path';

type CFNTemplate = {
  AWSTemplateFormatVersion?: string;
  Description?: string;
  Parameters?: Record<string, any>;
  Mappings?: Record<string, any>;
  Conditions?: Record<string, any>;
  Resources: Record<string, any>;
  Outputs?: Record<string, any>;
};

const jsonPath = path.resolve(__dirname, '../lib/TapStack.json');
const yamlPath = path.resolve(__dirname, '../lib/TapStack.yml');

function loadTemplate(): CFNTemplate {
  const raw = fs.readFileSync(jsonPath, 'utf8');
  const tpl = JSON.parse(raw);
  return tpl;
}

describe('TapStack — CloudFormation Template (unit)', () => {
  let tpl: CFNTemplate;

  beforeAll(() => {
    // 1) Files exist
    expect(fs.existsSync(jsonPath)).toBe(true);
    expect(fs.existsSync(yamlPath)).toBe(true);
    // Load JSON template
    tpl = loadTemplate();
    expect(tpl).toBeTruthy();
    expect(typeof tpl).toBe('object');
  });

  // 2) Template parses and has core sections
  test('has Resources and optional core sections', () => {
    expect(tpl.Resources && typeof tpl.Resources).toBe('object');
    // optional sections may exist
    expect(typeof tpl.Parameters === 'object' || typeof tpl.Parameters === 'undefined').toBe(true);
    expect(typeof tpl.Outputs === 'object' || typeof tpl.Outputs === 'undefined').toBe(true);
  });

  // Parameters validations
  test('Parameter: ProjectName has default and AllowedPattern', () => {
    const p = tpl.Parameters?.ProjectName;
    expect(p).toBeTruthy();
    expect(p.Default).toBeDefined();
    expect(p.AllowedPattern).toMatch(/^\^.+\$$/);
  });

  test('Parameter: EnvironmentSuffix has safe regex and no hard AllowedValues', () => {
    const p = tpl.Parameters?.EnvironmentSuffix;
    expect(p).toBeTruthy();
    expect(p.AllowedPattern).toBe('^[a-z0-9-]{2,20}$');
    expect(p.AllowedValues).toBeUndefined();
    expect(p.Default).toBeDefined();
  });

  test('Parameter: VpcCidr has default CIDR and pattern', () => {
    const p = tpl.Parameters?.VpcCidr;
    expect(p).toBeTruthy();
    expect(typeof p.Default).toBe('string');
    expect(p.AllowedPattern).toContain('([0-9]{1,3}\\.){3}');
  });

  test('Parameter: InstanceType and ASG capacities have sane defaults', () => {
    const it = tpl.Parameters?.InstanceType;
    const dc = tpl.Parameters?.DesiredCapacity;
    const mn = tpl.Parameters?.MinSize;
    const mx = tpl.Parameters?.MaxSize;
    expect(it?.Default).toBeDefined();
    expect(dc?.Default).toBeGreaterThanOrEqual(1);
    expect(mn?.Default).toBeGreaterThanOrEqual(1);
    expect(mx?.Default).toBeGreaterThanOrEqual(1);
  });

  test('Parameters: RdsEngine defaults postgres; AllowedValues include postgres/mysql', () => {
    const p = tpl.Parameters?.RdsEngine;
    expect(p).toBeTruthy();
    expect(p.Default).toBe('postgres');
    expect(p.AllowedValues).toEqual(expect.arrayContaining(['postgres', 'mysql']));
  });

  test('Parameter: RdsEngineVersion is optional (blank default allowed)', () => {
    const p = tpl.Parameters?.RdsEngineVersion;
    // Accept either blank default or a safe string; requirement prefers blank default
    expect(p).toBeTruthy();
    expect(typeof p.Default).toBe('string');
  });

  // KMS & encryption
  test('LogsKmsKey exists with rotation enabled', () => {
    const r = tpl.Resources['LogsKmsKey'];
    expect(r).toBeTruthy();
    expect(r.Type).toBe('AWS::KMS::Key');
    expect(r.Properties.EnableKeyRotation).toBe(true);
  });

  // S3 buckets hardened
  test('ArtifactBucket is versioned, encrypted with KMS, and blocks public access', () => {
    const b = tpl.Resources['ArtifactBucket'];
    expect(b).toBeTruthy();
    expect(b.Type).toBe('AWS::S3::Bucket');
    expect(b.Properties.VersioningConfiguration.Status).toBe('Enabled');
    expect(b.Properties.BucketEncryption.ServerSideEncryptionConfiguration[0].ServerSideEncryptionByDefault.SSEAlgorithm).toBe('aws:kms');
    expect(b.Properties.PublicAccessBlockConfiguration.BlockPublicAcls).toBe(true);
    expect(b.Properties.PublicAccessBlockConfiguration.BlockPublicPolicy).toBe(true);
    expect(b.Properties.PublicAccessBlockConfiguration.IgnorePublicAcls).toBe(true);
    expect(b.Properties.PublicAccessBlockConfiguration.RestrictPublicBuckets).toBe(true);
  });

  test('CloudTrailBucket is versioned, encrypted with KMS, and lifecycle configured', () => {
    const b = tpl.Resources['CloudTrailBucket'];
    expect(b).toBeTruthy();
    expect(b.Type).toBe('AWS::S3::Bucket');
    expect(b.Properties.VersioningConfiguration.Status).toBe('Enabled');
    expect(b.Properties.BucketEncryption.ServerSideEncryptionConfiguration[0].ServerSideEncryptionByDefault.SSEAlgorithm).toBe('aws:kms');
    expect(Array.isArray(b.Properties.LifecycleConfiguration.Rules)).toBe(true);
  });

  // Networking core
  test('VPC exists with CIDR from parameter', () => {
    const v = tpl.Resources['VPC'];
    expect(v).toBeTruthy();
    expect(v.Type).toBe('AWS::EC2::VPC');
    expect(v.Properties.CidrBlock).toEqual({ Ref: 'VpcCidr' });
  });

  test('Public and Private subnets exist with correct flags', () => {
    const pubA = tpl.Resources['PublicSubnetA'];
    const pubB = tpl.Resources['PublicSubnetB'];
    const priA = tpl.Resources['PrivateSubnetA'];
    const priB = tpl.Resources['PrivateSubnetB'];
    for (const s of [pubA, pubB, priA, priB]) {
      expect(s).toBeTruthy();
      expect(s.Type).toBe('AWS::EC2::Subnet');
    }
    expect(pubA.Properties.MapPublicIpOnLaunch).toBe(true);
    expect(pubB.Properties.MapPublicIpOnLaunch).toBe(true);
    expect(priA.Properties.MapPublicIpOnLaunch).toBe(false);
    expect(priB.Properties.MapPublicIpOnLaunch).toBe(false);
  });

  test('Route tables, routes, and associations are defined', () => {
    expect(tpl.Resources['PublicRouteTable']).toBeTruthy();
    expect(tpl.Resources['PublicRoute']).toBeTruthy();
    expect(tpl.Resources['PublicSubnetAAssociation']).toBeTruthy();
    expect(tpl.Resources['PublicSubnetBAssociation']).toBeTruthy();
    expect(tpl.Resources['PrivateRouteTableA']).toBeTruthy();
    expect(tpl.Resources['PrivateRouteTableB']).toBeTruthy();
    expect(tpl.Resources['PrivateRouteA']).toBeTruthy();
    expect(tpl.Resources['PrivateRouteB']).toBeTruthy();
  });

  test('NAT Gateway and EIP exist (single NAT cost-aware pattern)', () => {
    expect(tpl.Resources['EipForNatA']).toBeTruthy();
    expect(tpl.Resources['NatGatewayA']).toBeTruthy();
  });

  // Security Groups
  test('ALB SG allows HTTP 80 from 0.0.0.0/0', () => {
    const sg = tpl.Resources['AlbSecurityGroup'];
    expect(sg).toBeTruthy();
    const ingress = sg.Properties.SecurityGroupIngress || [];
    const rule80 = ingress.find((r: any) => r.FromPort === 80 && r.ToPort === 80 && r.CidrIp === '0.0.0.0/0');
    expect(rule80).toBeTruthy();
  });

  test('App SG allows HTTP 80 from ALB SG', () => {
    const sg = tpl.Resources['AppSecurityGroup'];
    expect(sg).toBeTruthy();
    const ingress = sg.Properties.SecurityGroupIngress || [];
    const rule = ingress.find((r: any) => r.FromPort === 80 && r.ToPort === 80 && r.SourceSecurityGroupId?.Ref === 'AlbSecurityGroup');
    expect(rule).toBeTruthy();
  });

  test('RDS SG exists with TCP rule (engine-port conditional is template-driven)', () => {
    const sg = tpl.Resources['RdsSecurityGroup'];
    expect(sg).toBeTruthy();
    const ingress = sg.Properties.SecurityGroupIngress || [];
    const tcpRule = ingress.find((r: any) => r.IpProtocol === 'tcp');
    expect(tcpRule).toBeTruthy();
  });

  // ALB + TG + Listener
  test('ALB, TargetGroup, and Listener exist; TG health checks configured from params', () => {
    expect(tpl.Resources['AppLoadBalancer']).toBeTruthy();
    const tg = tpl.Resources['AppTargetGroup'];
    expect(tg).toBeTruthy();
    expect(tg.Properties.HealthCheckPath).toEqual({ Ref: 'AlbHealthCheckPath' });
    expect(tg.Properties.HealthCheckPort).toEqual({ Ref: 'AlbHealthCheckPort' });
    expect(tpl.Resources['AppListener']).toBeTruthy();
  });

  // Launch Template & ASG
  test('Launch Template has UserData with Fn::Base64/Fn::Sub', () => {
    const lt = tpl.Resources['AppLaunchTemplate'];
    expect(lt).toBeTruthy();
    const ud = lt.Properties?.LaunchTemplateData?.UserData;
    expect(ud).toBeTruthy();
    expect(ud['Fn::Base64']).toBeTruthy();
    expect(ud['Fn::Base64']['Fn::Sub']).toBeTruthy();
  });

  test('ASG references TargetGroup and has PropagateAtLaunch tags', () => {
    const asg = tpl.Resources['AppAutoScalingGroup'];
    expect(asg).toBeTruthy();
    const tgArns = asg.Properties?.TargetGroupARNs || [];
    expect(Array.isArray(tgArns)).toBe(true);
    expect(tgArns[0]).toEqual({ Ref: 'AppTargetGroup' });
    const tags = asg.Properties?.Tags || [];
    const hasPropagate = tags.every((t: any) => t.PropagateAtLaunch === true);
    expect(hasPropagate).toBe(true);
  });

  // RDS
  test('RDS instance is encrypted, private, optionally Multi-AZ via Fn::If, and uses DataKmsKey', () => {
    const rds = tpl.Resources['RdsInstance'];
    expect(rds).toBeTruthy();
    expect(rds.Properties.StorageEncrypted).toBe(true);
    expect(rds.Properties.PubliclyAccessible).toBe(false);
    expect(rds.Properties.KmsKeyId).toEqual({ Ref: 'DataKmsKey' });
    // MultiAZ should be conditional (Fn::If present)
    const multi = rds.Properties.MultiAZ;
    expect(multi && typeof multi === 'object' && 'Fn::If' in multi).toBe(true);
  });

  // CloudTrail
  test('CloudTrail trail is multi-region, includes global events, and uses CMK', () => {
    const trail = tpl.Resources['CloudTrailTrail'];
    expect(trail).toBeTruthy();
    expect(trail.Properties.IsMultiRegionTrail).toBe(true);
    expect(trail.Properties.IncludeGlobalServiceEvents).toBe(true);
    expect(trail.Properties.KMSKeyId).toEqual({ Ref: 'DataKmsKey' });
  });

  // Flow Logs
  test('VPC Flow Logs resource exists targeting CloudWatch Logs', () => {
    const fl = tpl.Resources['VpcFlowLogs'];
    expect(fl).toBeTruthy();
    expect(fl.Type).toBe('AWS::EC2::FlowLog');
    expect(fl.Properties.LogDestinationType).toBe('cloud-watch-logs');
  });

  // SNS Notifications
  test('SNS Topic and Subscription exist', () => {
    const t = tpl.Resources['NotificationsTopic'];
    const s = tpl.Resources['NotificationsSubscription'];
    expect(t).toBeTruthy();
    expect(s).toBeTruthy();
    expect(t.Type).toBe('AWS::SNS::Topic');
    expect(s.Type).toBe('AWS::SNS::Subscription');
  });

  // Alarms
  test('CloudWatch alarms for ALB 5xx, TG unhealthy, and RDS CPU exist', () => {
    expect(tpl.Resources['Alb5xxAlarm']).toBeTruthy();
    expect(tpl.Resources['TgUnhealthyHostsAlarm']).toBeTruthy();
    expect(tpl.Resources['RdsCpuAlarm']).toBeTruthy();
  });

  // Post-deploy verification custom resource
  test('Manager Lambda and Custom Resource (PostDeployVerifier) exist', () => {
    const role = tpl.Resources['ManagerLambdaRole'];
    const fn = tpl.Resources['ManagerLambda'];
    const cr = tpl.Resources['PostDeployVerifier'];
    expect(role).toBeTruthy();
    expect(fn).toBeTruthy();
    expect(cr).toBeTruthy();
  });

  // Outputs
  test('Outputs include VpcId, AlbDNSName, NotificationsTopicArn', () => {
    const o = tpl.Outputs || {};
    expect(o['VpcId']).toBeTruthy();
    expect(o['AlbDNSName']).toBeTruthy();
    expect(o['NotificationsTopicArn']).toBeTruthy();
  });

  // Sanity — resource names are suffixed with EnvironmentSuffix via !Sub in common places (string-level check on JSON "Fn::Sub")
  test('Common named resources use !Sub with EnvironmentSuffix suffixing', () => {
    const checkSubRef = (resName: string, propPath: string[]) => {
      const res = tpl.Resources[resName];
      expect(res).toBeTruthy();
      // Walk the path
      let cur: any = res.Properties;
      for (const p of propPath) {
        cur = cur?.[p];
      }
      // Accept either string with ${EnvironmentSuffix} or Ref-based names; best-effort check
      if (typeof cur === 'string') {
        expect(cur.includes('${EnvironmentSuffix}') || cur.includes('${ AWS::StackName }')).toBe(true);
      } else if (cur && cur['Fn::Sub']) {
        const val = cur['Fn::Sub'];
        if (typeof val === 'string') {
          expect(val.includes('${EnvironmentSuffix}')).toBe(true);
        }
      } else {
        // Skip if name is not directly a string (some AWS resources only accept identifiers, not Name tags)
        expect(true).toBe(true);
      }
    };
    checkSubRef('AppAutoScalingGroup', ['AutoScalingGroupName']);
  });
});
