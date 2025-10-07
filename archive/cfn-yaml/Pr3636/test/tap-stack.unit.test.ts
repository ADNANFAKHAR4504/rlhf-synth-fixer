/* eslint-env jest */
import fs from 'fs';
import path from 'path';

type CfnTemplate = {
  AWSTemplateFormatVersion?: string;
  Description?: string;
  Parameters?: Record<string, any>;
  Mappings?: Record<string, any>;
  Resources?: Record<string, any>;
  Outputs?: Record<string, any>;
};

function fileExists(p: string): boolean {
  try {
    fs.accessSync(p, fs.constants.R_OK);
    return true;
  } catch {
    return false;
  }
}

function loadTemplate(): CfnTemplate {
  // Prefer JSON if present (CDK synth or pre-rendered)
  const jsonPath = path.join(__dirname, '../lib/TapStack.json');
  if (fileExists(jsonPath)) {
    return JSON.parse(fs.readFileSync(jsonPath, 'utf8')) as CfnTemplate;
  }

  // Else try YAML (your current template)
  const yamlPath = fileExists(path.join(__dirname, '../lib/TapStack.yml'))
    ? path.join(__dirname, '../lib/TapStack.yml')
    : path.join(__dirname, '../lib/TapStack.yaml');

  if (fileExists(yamlPath)) {
    // Try to parse via js-yaml if available, otherwise throw a helpful error
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires, global-require, import/no-extraneous-dependencies
      const yaml = require('js-yaml');
      return yaml.load(fs.readFileSync(yamlPath, 'utf8')) as CfnTemplate;
    } catch (err) {
      throw new Error(
        `Could not parse ${yamlPath}. Install js-yaml: ` +
        '`npm i -D js-yaml` or ensure TapStack.json exists.'
      );
    }
  }

  throw new Error(
    'Template not found. Looked for lib/TapStack.json and lib/TapStack.(yml|yaml).'
  );
}

describe('TapStack CloudFormation Template', () => {
  let template: CfnTemplate;

  beforeAll(() => {
    template = loadTemplate();
  });

  describe('Template Structure', () => {
    test('should have valid CloudFormation format version', () => {
      expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
    });

    test('should have a description', () => {
      expect(template.Description).toBeDefined();
      // current description from your working template
      expect(template.Description).toBe(
        'Secure, highly available web app in eu-central-1 with ALB+WAF (HTTP), CloudTrail, monitoring. NOTE: No ACM/HTTPS.'
      );
    });
  });

  describe('Parameters', () => {
    test('expected parameters exist with sane shapes', () => {
      const expected = [
        'ProjectName',
        'Environment',
        'VPCCidr',
        'InstanceType',
        'LatestAmiId',
        'AlertEmail',
      ];
      expect(template.Parameters).toBeDefined();
      expected.forEach((p) => {
        const param = template.Parameters![p];
        expect(param).toBeDefined();
        expect(param.Type).toBeDefined();
        expect(param.Description).toBeDefined();
      });
    });

    test('ProjectName properties', () => {
      const param = template.Parameters!.ProjectName;
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('secure-webapp');
      expect(param.AllowedPattern).toBe('^[a-z0-9][a-z0-9-]*$');
      expect(param.MinLength).toBe(1);
      expect(param.MaxLength).toBe(50);
    });

    test('Environment allowed values', () => {
      const param = template.Parameters!.Environment;
      expect(param.AllowedValues).toEqual(['dev', 'stg', 'prod']);
      expect(param.Default).toBe('prod');
    });

    test('VPCCidr has CIDR regex', () => {
      const param = template.Parameters!.VPCCidr;
      expect(param.Default).toBe('10.0.0.0/16');
      expect(param.AllowedPattern).toMatch(/^\^.*\$$/);
    });

    test('AlertEmail pattern', () => {
      const param = template.Parameters!.AlertEmail;
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('admin@example.com');
      expect(param.AllowedPattern).toBe(
        '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$'
      );
    });

    test('parameter count is reasonable (>=6)', () => {
      expect(Object.keys(template.Parameters || {}).length).toBeGreaterThanOrEqual(6);
    });
  });

  describe('Mappings', () => {
    test('SubnetConfig present with required entries', () => {
      expect(template.Mappings?.SubnetConfig).toBeDefined();
      const sc = template.Mappings!.SubnetConfig;
      ['PublicSubnet1', 'PublicSubnet2', 'PrivateSubnet1', 'PrivateSubnet2'].forEach((n) => {
        expect(sc[n]).toBeDefined();
        expect(sc[n].CIDR).toBeDefined();
      });
    });
  });

  describe('VPC Resources', () => {
    test('VPC basics', () => {
      const vpc = template.Resources!.VPC;
      expect(vpc.Type).toBe('AWS::EC2::VPC');
      expect(vpc.Properties.EnableDnsHostnames).toBe(true);
      expect(vpc.Properties.EnableDnsSupport).toBe(true);
    });

    test('IGW & attachment', () => {
      expect(template.Resources!.InternetGateway?.Type).toBe('AWS::EC2::InternetGateway');
      expect(template.Resources!.AttachGateway?.Type).toBe('AWS::EC2::VPCGatewayAttachment');
    });

    test('Subnets & routes', () => {
      const r = template.Resources!;
      ['PublicSubnet1', 'PublicSubnet2', 'PrivateSubnet1', 'PrivateSubnet2'].forEach((n) => {
        expect(r[n]?.Type).toBe('AWS::EC2::Subnet');
      });
      ['PublicRouteTable', 'PrivateRouteTable1', 'PrivateRouteTable2'].forEach((n) => {
        expect(r[n]?.Type).toBe('AWS::EC2::RouteTable');
      });
      ['PublicRoute', 'PrivateRoute1', 'PrivateRoute2'].forEach((n) => {
        expect(r[n]?.Type).toBe('AWS::EC2::Route');
        expect(r[n].Properties.DestinationCidrBlock).toBe('0.0.0.0/0');
      });
      ['NATGateway1', 'NATGateway2'].forEach((n) => {
        expect(r[n]?.Type).toBe('AWS::EC2::NatGateway');
      });
      ['EIPForNATGateway1', 'EIPForNATGateway2'].forEach((n) => {
        expect(r[n]?.Type).toBe('AWS::EC2::EIP');
        expect(r[n].Properties.Domain).toBe('vpc');
      });
    });
  });

  describe('Security Groups', () => {
    test('ALB SG allows only 80/tcp', () => {
      const sg = template.Resources!.ALBSecurityGroup;
      expect(sg.Type).toBe('AWS::EC2::SecurityGroup');
      const in0 = sg.Properties.SecurityGroupIngress?.[0];
      expect(in0.FromPort).toBe(80);
      expect(in0.ToPort).toBe(80);
      expect(in0.IpProtocol).toBe('tcp');
    });

    test('EC2 SG + rules', () => {
      expect(template.Resources!.EC2SecurityGroup?.Type).toBe('AWS::EC2::SecurityGroup');
      const ingress = template.Resources!.EC2SecurityGroupIngressFromALB;
      expect(ingress.Type).toBe('AWS::EC2::SecurityGroupIngress');
      expect(ingress.Properties.FromPort).toBe(80);
      expect(ingress.Properties.ToPort).toBe(80);
      expect(template.Resources!.ALBToEC2Egress?.Type).toBe('AWS::EC2::SecurityGroupEgress');
    });
  });

  describe('S3 Buckets', () => {
    const buckets = ['CentralLogsBucket', 'CloudTrailLogsBucket', 'AccessLogsBucket'] as const;

    test('all S3 buckets are locked down', () => {
      buckets.forEach((b) => {
        const res = template.Resources![b];
        expect(res.Type).toBe('AWS::S3::Bucket');
        expect(
          res.Properties.BucketEncryption.ServerSideEncryptionConfiguration[0]
            .ServerSideEncryptionByDefault.SSEAlgorithm
        ).toBe('AES256');
        const pab = res.Properties.PublicAccessBlockConfiguration;
        expect(pab.BlockPublicAcls).toBe(true);
        expect(pab.BlockPublicPolicy).toBe(true);
        expect(pab.IgnorePublicAcls).toBe(true);
        expect(pab.RestrictPublicBuckets).toBe(true);
      });
    });

    test('CloudTrail bucket policy exists', () => {
      const bp = template.Resources!.CloudTrailLogsBucketPolicy;
      expect(bp.Type).toBe('AWS::S3::BucketPolicy');
      expect((bp.Properties.PolicyDocument.Statement || []).length).toBeGreaterThan(0);
    });
  });

  describe('IAM Resources', () => {
    test('EC2 role & instance profile', () => {
      const role = template.Resources!.EC2InstanceRole;
      expect(role.Type).toBe('AWS::IAM::Role');
      expect(role.Properties.AssumeRolePolicyDocument).toBeDefined();
      expect(role.Properties.ManagedPolicyArns).toContain(
        'arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy'
      );
      const profile = template.Resources!.EC2InstanceProfile;
      expect(profile.Type).toBe('AWS::IAM::InstanceProfile');
    });

    test('CloudTrail role exists', () => {
      const role = template.Resources!.CloudTrailRole;
      expect(role.Type).toBe('AWS::IAM::Role');
      expect(role.Properties.Policies).toBeDefined();
    });
  });

  describe('ALB / TG / Listener', () => {
    test('ALB & TG & HTTP listener', () => {
      const alb = template.Resources!.ApplicationLoadBalancer;
      expect(alb.Type).toBe('AWS::ElasticLoadBalancingV2::LoadBalancer');
      expect(alb.Properties.Type).toBe('application');
      expect(alb.Properties.Scheme).toBe('internet-facing');

      const tg = template.Resources!.TargetGroup;
      expect(tg.Type).toBe('AWS::ElasticLoadBalancingV2::TargetGroup');
      expect(tg.Properties.Port).toBe(80);
      expect(tg.Properties.Protocol).toBe('HTTP');
      expect(tg.Properties.HealthCheckEnabled).toBe(true);

      const http = template.Resources!.HTTPListener;
      expect(http.Type).toBe('AWS::ElasticLoadBalancingV2::Listener');
      expect(http.Properties.Port).toBe(80);
      expect(http.Properties.Protocol).toBe('HTTP');
    });
  });

  describe('WAF', () => {
    test('WebACL + association + rules', () => {
      const webacl = template.Resources!.WAFWebACL;
      expect(webacl.Type).toBe('AWS::WAFv2::WebACL');
      expect(webacl.Properties.Scope).toBe('REGIONAL');
      const rules = webacl.Properties.Rules || [];
      expect(rules.length).toBeGreaterThan(0);
      const names = rules.map((r: any) => r.Name);
      expect(names).toEqual(
        expect.arrayContaining([
          'RateLimitRule',
          'AWSManagedRulesCommonRuleSet',
          'AWSManagedRulesSQLiRuleSet',
        ])
      );

      const assoc = template.Resources!.WAFAssociation;
      expect(assoc.Type).toBe('AWS::WAFv2::WebACLAssociation');
    });
  });

  describe('EC2 Auto Scaling', () => {
    test('Launch template & ASG', () => {
      const lt = template.Resources!.EC2LaunchTemplate;
      expect(lt.Type).toBe('AWS::EC2::LaunchTemplate');
      expect(lt.Properties.LaunchTemplateData.UserData).toBeDefined();

      const asg = template.Resources!.AutoScalingGroup;
      expect(asg.Type).toBe('AWS::AutoScaling::AutoScalingGroup');
      expect(asg.Properties.MinSize).toBe('2');
      expect(asg.Properties.MaxSize).toBe('4');
      expect(asg.Properties.DesiredCapacity).toBe('2');
      expect(asg.Properties.HealthCheckType).toBe('ELB');
    });
  });

  describe('CloudTrail & Monitoring', () => {
    test('Trail, LogGroup, SNS, Alarms, Filters', () => {
      const trail = template.Resources!.CloudTrail;
      expect(trail.Type).toBe('AWS::CloudTrail::Trail');
      expect(trail.Properties.IsMultiRegionTrail).toBe(true);
      expect(trail.Properties.EnableLogFileValidation).toBe(true);

      const lg = template.Resources!.CloudTrailLogGroup;
      expect(lg.Type).toBe('AWS::Logs::LogGroup');
      expect(lg.Properties.RetentionInDays).toBe(90);

      const topic = template.Resources!.AlertTopic;
      expect(topic.Type).toBe('AWS::SNS::Topic');
      expect(topic.Properties.Subscription).toBeDefined();

      ['UnauthorizedAPICallsAlarm', 'AWSBruteForceReportAlarm'].forEach((n) => {
        const a = template.Resources![n];
        expect(a.Type).toBe('AWS::CloudWatch::Alarm');
        expect(a.Properties.ComparisonOperator).toBe('GreaterThanThreshold');
      });

      ['UnauthorizedAPICallsMetricFilter', 'BruteForceMetricFilter'].forEach((n) => {
        const f = template.Resources![n];
        expect(f.Type).toBe('AWS::Logs::MetricFilter');
        expect(f.Properties.FilterPattern).toBeDefined();
      });
    });
  });

  // Optional AWS Config (only if you kept it in the template)
  describe('AWS Config (optional)', () => {
    test('Config rule, if present, is correct', () => {
      const r = template.Resources?.UnrestrictedSSHConfigRule;
      if (r) {
        expect(r.Type).toBe('AWS::Config::ConfigRule');
        expect(r.Properties.Source.SourceIdentifier).toBe('INCOMING_SSH_DISABLED');
      } else {
        // ok if omitted
        expect(true).toBe(true);
      }
    });
  });

  describe('Outputs', () => {
    test('expected outputs exist', () => {
      const expected = [
        'VPCId',
        'ALBDNSName',
        'ALBUrl',
        'CloudTrailBucket',
        'AccessLogsBucketName',
        'CentralLogsBucketName',
        'WAFWebACLArn',
        'AlertTopicArn',
        'PublicSubnet1Id',
        'PublicSubnet2Id',
        'PrivateSubnet1Id',
        'PrivateSubnet2Id',
      ];
      expected.forEach((o) => {
        const out = template.Outputs?.[o];
        expect(out).toBeDefined();
        expect(out.Description).toBeDefined();
        expect(out.Value).toBeDefined();
      });
    });

    test('exports (if any) have names', () => {
      Object.values(template.Outputs || {}).forEach((out: any) => {
        if (out.Export) {
          expect(out.Export.Name).toBeDefined();
        }
      });
    });
  });

  describe('Resource Naming & Tags', () => {
    test('Name tags use ${ProjectName}-${Environment}-*', () => {
      const vpc = template.Resources!.VPC;
      expect(vpc.Properties.Tags?.[0]?.Value).toEqual({
        'Fn::Sub': '${ProjectName}-${Environment}-vpc',
      });
    });

    test('a few key resources have tags', () => {
      ['VPC', 'InternetGateway', 'PublicSubnet1', 'ApplicationLoadBalancer'].forEach((r) => {
        const res = template.Resources![r];
        expect(res.Properties.Tags).toBeDefined();
        expect(res.Properties.Tags.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Security checks', () => {
    test('Buckets use SSE-S3 and block public', () => {
      ['CentralLogsBucket', 'CloudTrailLogsBucket', 'AccessLogsBucket'].forEach((b) => {
        const res = template.Resources![b];
        expect(
          res.Properties.BucketEncryption.ServerSideEncryptionConfiguration[0]
            .ServerSideEncryptionByDefault.SSEAlgorithm
        ).toBe('AES256');
        const pab = res.Properties.PublicAccessBlockConfiguration;
        expect(pab.BlockPublicAcls).toBe(true);
        expect(pab.BlockPublicPolicy).toBe(true);
        expect(pab.IgnorePublicAcls).toBe(true);
        expect(pab.RestrictPublicBuckets).toBe(true);
      });
    });

    test('ALB SG only allows HTTP', () => {
      const albSG = template.Resources!.ALBSecurityGroup;
      const ingress = albSG.Properties.SecurityGroupIngress || [];
      expect(ingress.length).toBe(1);
      expect(ingress[0].FromPort).toBe(80);
      expect(ingress[0].ToPort).toBe(80);
    });

    test('EC2 ingress only from ALB SG', () => {
      const ingress = template.Resources!.EC2SecurityGroupIngressFromALB;
      expect(ingress.Properties.SourceSecurityGroupId).toEqual({ Ref: 'ALBSecurityGroup' });
    });
  });

  describe('Template sanity', () => {
    test('has all core sections', () => {
      expect(template.AWSTemplateFormatVersion).toBeDefined();
      expect(template.Description).toBeDefined();
      expect(template.Parameters).toBeDefined();
      expect(template.Mappings).toBeDefined();
      expect(template.Resources).toBeDefined();
      expect(template.Outputs).toBeDefined();
    });

    test('resource count is reasonable (>= 40)', () => {
      expect(Object.keys(template.Resources || {}).length).toBeGreaterThanOrEqual(40);
    });
  });
});
