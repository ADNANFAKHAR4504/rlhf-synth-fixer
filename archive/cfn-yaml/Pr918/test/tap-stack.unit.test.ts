import fs from 'fs';
import path from 'path';

// Helper to escape regex special chars
const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

type Block = { name: string; content: string };

function readTemplateJsonIfExists(): any | null {
  const jsonPath = path.join(__dirname, '../lib/TapStack.json');
  try {
    if (fs.existsSync(jsonPath)) {
      const json = fs.readFileSync(jsonPath, 'utf8');
      return JSON.parse(json);
    }
  } catch {}
  return null;
}

let templateJson: any | null = null;

function readTemplate(): string {
  const templatePath = path.join(__dirname, '../lib/TapStack.yml');
  const yaml = fs.readFileSync(templatePath, 'utf8');
  expect(yaml && typeof yaml === 'string').toBeTruthy();
  return yaml;
}

function getResourceBlock(yaml: string, resourceName: string): Block | null {
  const lines = yaml.split(/\r?\n/);
  let start = -1;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].trim() === `${resourceName}:` && lines[i].startsWith('  ')) {
      start = i;
      break;
    }
  }
  if (start === -1) return null;
  let end = lines.length;
  for (let j = start + 1; j < lines.length; j++) {
    const line = lines[j];
    if (line.startsWith('  ') && !line.startsWith('    ') && line.trim().endsWith(':')) {
      end = j;
      break;
    }
  }
  const content = lines.slice(start, end).join('\n');
  return { name: resourceName, content };
}

function expectLineIncludes(content: string, search: string | RegExp) {
  if (search instanceof RegExp) {
    expect(content).toMatch(search);
  } else {
    expect(content).toContain(search);
  }
}

function expectResourceHasType(yaml: string, name: string, type: string) {
  const block = getResourceBlock(yaml, name);
  expect(block).not.toBeNull();
  expect(block!.content).toMatch(new RegExp(`\\n\\s*Type:\\s*${escapeRegExp(type)}\\b`));
}

describe('TapStack.yml - Unit Tests', () => {
  let yaml: string;

  beforeAll(() => {
    yaml = readTemplate();
    templateJson = readTemplateJsonIfExists();
  });

  describe('Template header', () => {
    test('has AWSTemplateFormatVersion', () => {
      expect(yaml).toMatch(/AWSTemplateFormatVersion:\s*'2010-09-09'/);
    });
    test('has Description with key security statements', () => {
      expect(yaml).toMatch(/Secure parameterized CloudFormation template/);
      expect(yaml).toMatch(/KMS/);
      expect(yaml).toMatch(/S3 buckets default to SSE-S3/);
      expect(yaml).toMatch(/WAF \(regional\) with managed rules/);
      expect(yaml).toMatch(/CloudTrail \(multi-region\)/);
      expect(yaml).toMatch(/VPC with parameterized subnets/);
    });
    test('has Metadata with ParameterGroups', () => {
      expect(yaml).toMatch(/Metadata:/);
      expect(yaml).toMatch(/AWS::CloudFormation::Interface/);
      expect(yaml).toMatch(/ParameterGroups:/);
      expect(yaml).toMatch(/Deployment/);
      expect(yaml).toMatch(/Networking/);
    });
      });

  describe('Parameters', () => {
    test('defines all expected parameters with constraints/defaults', () => {
      const expected = [
        'Environment:',
        'BucketSuffix:',
        'EnableExampleALB:',
        'VpcCidr:',
        'AvailabilityZonesToUse:',
        'CreateNatGateways:',
        'AdminCIDR:',
        'CloudTrailLogRetentionDays:',
      ];
      expected.forEach(x => expect(yaml).toContain(x));

      expect(yaml).toMatch(/Environment:[\s\S]*?AllowedValues:\s*\[ dev, staging, prod \]/);
      expect(yaml).toMatch(/EnableExampleALB:[\s\S]*?AllowedValues:\s*\[ 'true', 'false' \]/);
      expect(yaml).toMatch(/CreateNatGateways:[\s\S]*?AllowedValues:\s*\[ 'true', 'false' \]/);
      expect(yaml).toMatch(/AvailabilityZonesToUse:[\s\S]*?Type:\s*Number[\s\S]*?MinValue:\s*1[\s\S]*?MaxValue:\s*3/);
      expect(yaml).toMatch(/VpcCidr:[\s\S]*?Default:\s*'10.0.0.0\/16'/);
      expect(yaml).toMatch(/CloudTrailLogRetentionDays:[\s\S]*?Default:\s*365/);
    });
  });

  describe('Conditions', () => {
    test('defines UseExampleALB, UseNatGateways, IsProdEnv', () => {
      expect(yaml).toMatch(/Conditions:/);
      expect(yaml).toMatch(/UseExampleALB: \!Equals \[ \!Ref EnableExampleALB, 'true' \]/);
      expect(yaml).toMatch(/UseNatGateways: \!Equals \[ \!Ref CreateNatGateways, 'true' \]/);
      expect(yaml).toMatch(/IsProdEnv: \!Equals \[ \!Ref Environment, 'prod' \]/);
    });
  });

  describe('Resources: KMS', () => {
    test('PrimaryKmsKey', () => {
      expectResourceHasType(yaml, 'PrimaryKmsKey', 'AWS::KMS::Key');
      const block = getResourceBlock(yaml, 'PrimaryKmsKey')!;
      expectLineIncludes(block.content, /EnableKeyRotation:\s*true/);
      expectLineIncludes(block.content, /KeyPolicy:/);
      expectLineIncludes(block.content, /logs.amazonaws.com/);
      expectLineIncludes(block.content, /cloudtrail.amazonaws.com/);
      expectLineIncludes(block.content, /kms:Encrypt/);
      expectLineIncludes(block.content, /kms:Decrypt/);
      expectLineIncludes(block.content, /kms:GenerateDataKey\*/);
    });
    test('PrimaryKmsAlias', () => {
      expectResourceHasType(yaml, 'PrimaryKmsAlias', 'AWS::KMS::Alias');
      const block = getResourceBlock(yaml, 'PrimaryKmsAlias')!;
      expectLineIncludes(block.content, /AliasName:\s*\!Sub 'alias\/\$\{Environment\}-primary-cmk'/);
      expectLineIncludes(block.content, /TargetKeyId:\s*\!Ref PrimaryKmsKey/);
    });
  });

  describe('Resources: VPC/Subnets/IGW/Routes', () => {
    test('VPC with DNS settings', () => {
      expectResourceHasType(yaml, 'VPC', 'AWS::EC2::VPC');
      const block = getResourceBlock(yaml, 'VPC')!;
      expectLineIncludes(block.content, /CidrBlock:\s*\!Ref VpcCidr/);
      expectLineIncludes(block.content, /EnableDnsSupport:\s*true/);
      expectLineIncludes(block.content, /EnableDnsHostnames:\s*true/);
      // Ensure IsProd tag is wired to IsProdEnv condition
      expectLineIncludes(block.content, /Key:\s*IsProd/);
      expectLineIncludes(block.content, /\!If \[ IsProdEnv, 'true', 'false' \]/);
    });
    test('Public subnets map public IP on launch', () => {
      expectResourceHasType(yaml, 'PublicSubnet1', 'AWS::EC2::Subnet');
      expectResourceHasType(yaml, 'PublicSubnet2', 'AWS::EC2::Subnet');
      const s1 = getResourceBlock(yaml, 'PublicSubnet1')!;
      const s2 = getResourceBlock(yaml, 'PublicSubnet2')!;
      expectLineIncludes(s1.content, /MapPublicIpOnLaunch:\s*true/);
      expectLineIncludes(s2.content, /MapPublicIpOnLaunch:\s*true/);
    });
    test('Private subnets exist', () => {
      expectResourceHasType(yaml, 'PrivateSubnet1', 'AWS::EC2::Subnet');
      expectResourceHasType(yaml, 'PrivateSubnet2', 'AWS::EC2::Subnet');
    });
    test('InternetGateway and attachment', () => {
      expectResourceHasType(yaml, 'InternetGateway', 'AWS::EC2::InternetGateway');
      expectResourceHasType(yaml, 'AttachInternetGateway', 'AWS::EC2::VPCGatewayAttachment');
    });
    test('Route tables and default routes', () => {
      expectResourceHasType(yaml, 'PublicRouteTable', 'AWS::EC2::RouteTable');
      expectResourceHasType(yaml, 'PublicDefaultRoute', 'AWS::EC2::Route');
      const rt = getResourceBlock(yaml, 'PublicDefaultRoute')!;
      expectLineIncludes(rt.content, /DestinationCidrBlock:\s*0.0.0.0\/0/);
      expectLineIncludes(rt.content, /GatewayId:\s*\!Ref InternetGateway/);
      expectResourceHasType(yaml, 'PrivateRouteTable1', 'AWS::EC2::RouteTable');
      expectResourceHasType(yaml, 'PrivateRouteTable2', 'AWS::EC2::RouteTable');
    });
    test('NAT resources are conditional on UseNatGateways', () => {
      const ngw = getResourceBlock(yaml, 'NatGateway1')!;
      const eip = getResourceBlock(yaml, 'NatEIP1')!;
      expectLineIncludes(ngw.content, /Condition:\s*UseNatGateways/);
      expectLineIncludes(eip.content, /Condition:\s*UseNatGateways/);
      const pr1 = getResourceBlock(yaml, 'PrivateDefaultRoute1')!;
      const pr2 = getResourceBlock(yaml, 'PrivateDefaultRoute2')!;
      expectLineIncludes(pr1.content, /Condition:\s*UseNatGateways/);
      expectLineIncludes(pr2.content, /Condition:\s*UseNatGateways/);
    });
  });

  describe('Resources: Network ACLs', () => {
    test('Private NACL with internal allow inbound and all outbound', () => {
      expectResourceHasType(yaml, 'PrivateNetworkAcl', 'AWS::EC2::NetworkAcl');
      expectResourceHasType(yaml, 'PrivateNetworkAclInbound', 'AWS::EC2::NetworkAclEntry');
      expectResourceHasType(yaml, 'PrivateNetworkAclOutbound', 'AWS::EC2::NetworkAclEntry');
      const inb = getResourceBlock(yaml, 'PrivateNetworkAclInbound')!;
      const out = getResourceBlock(yaml, 'PrivateNetworkAclOutbound')!;
      expectLineIncludes(inb.content, /RuleAction:\s*allow/);
      expectLineIncludes(inb.content, /CidrBlock:\s*\!Ref VpcCidr/);
      expectLineIncludes(inb.content, /Egress:\s*false/);
      expectLineIncludes(out.content, /CidrBlock:\s*0.0.0.0\/0/);
      expectLineIncludes(out.content, /Egress:\s*true/);
    });
    test('Public NACL with HTTP/HTTPS inbound and all outbound', () => {
      expectResourceHasType(yaml, 'PublicNetworkAcl', 'AWS::EC2::NetworkAcl');
      expectResourceHasType(yaml, 'PublicInboundHTTP', 'AWS::EC2::NetworkAclEntry');
      expectResourceHasType(yaml, 'PublicInboundHTTPS', 'AWS::EC2::NetworkAclEntry');
      expectResourceHasType(yaml, 'PublicOutboundAllowAll', 'AWS::EC2::NetworkAclEntry');
      const http = getResourceBlock(yaml, 'PublicInboundHTTP')!;
      const https = getResourceBlock(yaml, 'PublicInboundHTTPS')!;
      expectLineIncludes(http.content, /PortRange:[\s\S]*From:\s*80[\s\S]*To:\s*80/);
      expectLineIncludes(https.content, /PortRange:[\s\S]*From:\s*443[\s\S]*To:\s*443/);
    });
  });

  describe('Resources: IAM', () => {
    test('CloudTrailRole least privilege for logs', () => {
      expectResourceHasType(yaml, 'CloudTrailRole', 'AWS::IAM::Role');
      const block = getResourceBlock(yaml, 'CloudTrailRole')!;
      expectLineIncludes(block.content, /cloudtrail.amazonaws.com/);
      expectLineIncludes(block.content, /logs:CreateLogGroup/);
      expectLineIncludes(block.content, /logs:CreateLogStream/);
      expectLineIncludes(block.content, /logs:PutLogEvents/);
    });
    test('EC2InstanceRole with SSM and CloudWatch and least-privilege S3/KMS', () => {
      expectResourceHasType(yaml, 'EC2InstanceRole', 'AWS::IAM::Role');
      const block = getResourceBlock(yaml, 'EC2InstanceRole')!;
      expectLineIncludes(block.content, /AmazonSSMManagedInstanceCore/);
      expectLineIncludes(block.content, /CloudWatchAgentServerPolicy/);
      expectLineIncludes(block.content, /s3:GetObject/);
      expectLineIncludes(block.content, /s3:PutObject/);
      expectLineIncludes(block.content, /s3:DeleteObject/);
      expectLineIncludes(block.content, /s3:ListBucket/);
      expectLineIncludes(block.content, /kms:Decrypt/);
      expectLineIncludes(block.content, /kms:GenerateDataKey/);
    });
    test('EC2InstanceProfile exists', () => {
      expectResourceHasType(yaml, 'EC2InstanceProfile', 'AWS::IAM::InstanceProfile');
    });
  });

  describe('Resources: S3 and Bucket Policies', () => {
    test('FinancialDataBucket SSE-S3, versioning, access logging and PAB', () => {
      expectResourceHasType(yaml, 'FinancialDataBucket', 'AWS::S3::Bucket');
      const b = getResourceBlock(yaml, 'FinancialDataBucket')!;
      expectLineIncludes(b.content, /SSEAlgorithm:\s*AES256/);
      expectLineIncludes(b.content, /VersioningConfiguration:[\s\S]*Status:\s*Enabled/);
      expectLineIncludes(b.content, /PublicAccessBlockConfiguration:[\s\S]*BlockPublicAcls:\s*true[\s\S]*IgnorePublicAcls:\s*true[\s\S]*BlockPublicPolicy:\s*true[\s\S]*RestrictPublicBuckets:\s*true/);
      expectLineIncludes(b.content, /LoggingConfiguration:[\s\S]*DestinationBucketName:\s*\!Ref LoggingBucket/);
    });
    test('FinancialDataBucketPolicy denies unencrypted uploads', () => {
      expectResourceHasType(yaml, 'FinancialDataBucketPolicy', 'AWS::S3::BucketPolicy');
      const p = getResourceBlock(yaml, 'FinancialDataBucketPolicy')!;
      expectLineIncludes(p.content, /DenyUnEncryptedObjectUploads/);
      expectLineIncludes(p.content, /Action:\s*'s3:PutObject'/);
      expectLineIncludes(p.content, /StringNotEquals:[\s\S]*s3:x-amz-server-side-encryption:\s*AES256/);
    });
    test('LoggingBucket and CloudTrailBucket have SSE-S3 and PAB', () => {
      expectResourceHasType(yaml, 'LoggingBucket', 'AWS::S3::Bucket');
      expectResourceHasType(yaml, 'CloudTrailBucket', 'AWS::S3::Bucket');
      const lb = getResourceBlock(yaml, 'LoggingBucket')!;
      const ct = getResourceBlock(yaml, 'CloudTrailBucket')!;
      [lb, ct].forEach(bl => {
        expectLineIncludes(bl.content, /SSEAlgorithm:\s*AES256/);
        expectLineIncludes(bl.content, /PublicAccessBlockConfiguration:/);
      });
    });
    test('CloudTrailBucketPolicy permits CloudTrail put with bucket-owner-full-control', () => {
      expectResourceHasType(yaml, 'CloudTrailBucketPolicy', 'AWS::S3::BucketPolicy');
      const p = getResourceBlock(yaml, 'CloudTrailBucketPolicy')!;
      expectLineIncludes(p.content, /cloudtrail.amazonaws.com/);
      expectLineIncludes(p.content, /s3:x-amz-acl:\s*bucket-owner-full-control/);
    });
  });

  describe('Resources: CloudWatch Logs and CloudTrail', () => {
    test('CloudTrailLogGroup encrypted with KMS and retention from param', () => {
      expectResourceHasType(yaml, 'CloudTrailLogGroup', 'AWS::Logs::LogGroup');
      const lg = getResourceBlock(yaml, 'CloudTrailLogGroup')!;
      expectLineIncludes(lg.content, /LogGroupName:\s*\!Sub '\/aws\/cloudtrail\/\$\{Environment\}'/);
      expectLineIncludes(lg.content, /RetentionInDays:\s*\!Ref CloudTrailLogRetentionDays/);
      expectLineIncludes(lg.content, /KmsKeyId:\s*\!GetAtt PrimaryKmsKey\.Arn/);
    });
    test('S3AccessLogGroup encrypted with KMS and retention 365', () => {
      expectResourceHasType(yaml, 'S3AccessLogGroup', 'AWS::Logs::LogGroup');
      const lg = getResourceBlock(yaml, 'S3AccessLogGroup')!;
      expectLineIncludes(lg.content, /LogGroupName:\s*\!Sub '\/aws\/s3\/\$\{Environment\}-access'/);
      expectLineIncludes(lg.content, /RetentionInDays:\s*365/);
      expectLineIncludes(lg.content, /KmsKeyId:\s*\!GetAtt PrimaryKmsKey\.Arn/);
    });
    test('CloudTrail Trail is multi-region and logs to CloudWatch', () => {
      expectResourceHasType(yaml, 'CloudTrail', 'AWS::CloudTrail::Trail');
      const tr = getResourceBlock(yaml, 'CloudTrail')!;
      expectLineIncludes(tr.content, /IncludeGlobalServiceEvents:\s*true/);
      expectLineIncludes(tr.content, /IsMultiRegionTrail:\s*true/);
      expectLineIncludes(tr.content, /EnableLogFileValidation:\s*true/);
      expectLineIncludes(tr.content, /CloudWatchLogsLogGroupArn:\s*\!GetAtt CloudTrailLogGroup.Arn/);
      expectLineIncludes(tr.content, /CloudWatchLogsRoleArn:\s*\!GetAtt CloudTrailRole.Arn/);
      expectLineIncludes(tr.content, /IsLogging:\s*true/);
    });
  });

  describe('Resources: WAF and ALB', () => {
    test('FinancialWebACL with managed rule groups', () => {
      expectResourceHasType(yaml, 'FinancialWebACL', 'AWS::WAFv2::WebACL');
      const acl = getResourceBlock(yaml, 'FinancialWebACL')!;
      expectLineIncludes(acl.content, /Scope:\s*REGIONAL/);
      expectLineIncludes(acl.content, /DefaultAction:[\s\S]*Allow:/);
      expectLineIncludes(acl.content, /AWSManagedRulesCommonRuleSet/);
      expectLineIncludes(acl.content, /AWSManagedRulesSQLiRuleSet/);
    });
    test('ApplicationLoadBalancer optional and associated to WAF when enabled', () => {
      expectResourceHasType(yaml, 'ApplicationLoadBalancer', 'AWS::ElasticLoadBalancingV2::LoadBalancer');
      const alb = getResourceBlock(yaml, 'ApplicationLoadBalancer')!;
      expectLineIncludes(alb.content, /Condition:\s*UseExampleALB/);
      expectLineIncludes(alb.content, /Scheme:\s*internet-facing/);
      expectLineIncludes(alb.content, /Type:\s*application/);
      expectLineIncludes(alb.content, /Subnets:[\s\S]*\!Ref PublicSubnet1[\s\S]*\!Ref PublicSubnet2/);
      expectResourceHasType(yaml, 'LoadBalancerSecurityGroup', 'AWS::EC2::SecurityGroup');
      const lsg = getResourceBlock(yaml, 'LoadBalancerSecurityGroup')!;
      expectLineIncludes(lsg.content, /FromPort:\s*80/);
      expectLineIncludes(lsg.content, /FromPort:\s*443/);
      expectResourceHasType(yaml, 'WebACLAssociationToALB', 'AWS::WAFv2::WebACLAssociation');
      const assoc = getResourceBlock(yaml, 'WebACLAssociationToALB')!;
      expectLineIncludes(assoc.content, /Condition:\s*UseExampleALB/);
      expectLineIncludes(assoc.content, /WebACLArn:\s*\!GetAtt FinancialWebACL.Arn/);
    });
    test('App and DB security groups', () => {
      expectResourceHasType(yaml, 'WebServerSecurityGroup', 'AWS::EC2::SecurityGroup');
      const wsg = getResourceBlock(yaml, 'WebServerSecurityGroup')!;
      expectLineIncludes(wsg.content, /SourceSecurityGroupId:\s*\!Ref LoadBalancerSecurityGroup/);
      expectResourceHasType(yaml, 'DatabaseSecurityGroup', 'AWS::EC2::SecurityGroup');
      const dbg = getResourceBlock(yaml, 'DatabaseSecurityGroup')!;
      expectLineIncludes(dbg.content, /FromPort:\s*3306/);
      expectLineIncludes(dbg.content, /SourceSecurityGroupId:\s*\!Ref WebServerSecurityGroup/);
    });
  });

  const describeIfJson: typeof describe = templateJson ? describe : describe.skip;

  describeIfJson('JSON Template Validation (optional if TapStack.json is present)', () => {
    test('has format version and description', () => {
      expect(templateJson!.AWSTemplateFormatVersion).toBe('2010-09-09');
      expect(typeof templateJson!.Description).toBe('string');
    });

    test('parameters exist with key constraints', () => {
      const p = templateJson!.Parameters || {};
      const keys = [
        'Environment',
        'BucketSuffix',
        'EnableExampleALB',
        'VpcCidr',
        'AvailabilityZonesToUse',
        'CreateNatGateways',
        'AdminCIDR',
        'CloudTrailLogRetentionDays',
      ];
      keys.forEach(k => expect(p[k]).toBeDefined());
      expect(p.Environment.AllowedValues).toEqual(['dev', 'staging', 'prod']);
      expect(p.VpcCidr.Default).toBe('10.0.0.0/16');
      expect(p.CloudTrailLogRetentionDays.Default).toBe(365);
    });

    test('conditions defined', () => {
      const c = templateJson!.Conditions || {};
      ['UseExampleALB', 'UseNatGateways', 'IsProdEnv'].forEach(k => expect(c[k]).toBeDefined());
    });

    test('resources structure and critical settings', () => {
      const r = templateJson!.Resources;
      expect(r.PrimaryKmsKey.Type).toBe('AWS::KMS::Key');
      expect(r.PrimaryKmsKey.Properties.EnableKeyRotation).toBe(true);
      expect(r.PrimaryKmsAlias.Type).toBe('AWS::KMS::Alias');

      // VPC
      expect(r.VPC.Type).toBe('AWS::EC2::VPC');
      expect(r.VPC.Properties.EnableDnsSupport).toBe(true);
      expect(r.VPC.Properties.EnableDnsHostnames).toBe(true);

      // S3 SSE-S3
      const ssePath = (bucket: any) => bucket.Properties.BucketEncryption.ServerSideEncryptionConfiguration[0].ServerSideEncryptionByDefault.SSEAlgorithm;
      expect(ssePath(r.FinancialDataBucket)).toBe('AES256');
      expect(ssePath(r.LoggingBucket)).toBe('AES256');
      expect(ssePath(r.CloudTrailBucket)).toBe('AES256');

      // FinancialDataBucketPolicy denies unencrypted PUT
      const statements = r.FinancialDataBucketPolicy.Properties.PolicyDocument.Statement;
      const deny = statements.find((s: any) => s.Sid === 'DenyUnEncryptedObjectUploads');
      expect(deny).toBeDefined();
      expect(deny.Action).toBe('s3:PutObject');
      expect(deny.Condition.StringNotEquals['s3:x-amz-server-side-encryption']).toBe('AES256');

      // CloudTrail log group retention and KMS
      expect(r.CloudTrailLogGroup.Properties.RetentionInDays).toEqual({ Ref: 'CloudTrailLogRetentionDays' });
      expect(r.CloudTrailLogGroup.Properties.KmsKeyId).toEqual({ 'Fn::GetAtt': ['PrimaryKmsKey', 'Arn'] });

      // CloudTrail Trail core settings
      expect(r.CloudTrail.Properties.IsMultiRegionTrail).toBe(true);
      expect(r.CloudTrail.Properties.IncludeGlobalServiceEvents).toBe(true);
      expect(r.CloudTrail.Properties.EnableLogFileValidation).toBe(true);

      // WAF managed rule names
      const ruleNames = r.FinancialWebACL.Properties.Rules.map((x: any) => x.Name);
      expect(ruleNames).toEqual(expect.arrayContaining(['AWSManagedCommon', 'AWSManagedSQLi']));
    });

    test('outputs exist and reference correct resources', () => {
      const o = templateJson!.Outputs;
      const keys = [
        'VPCId',
        'PublicSubnet1Id',
        'PublicSubnet2Id',
        'PrivateSubnet1Id',
        'PrivateSubnet2Id',
        'FinancialDataBucketName',
        'LoggingBucketName',
        'CloudTrailBucketName',
        'PrimaryKmsKeyId',
        'CloudTrailLogGroupArn',
        'WebACLArn',
        'ALBDNS',
      ];
      keys.forEach(k => expect(o[k]).toBeDefined());
      expect(o.VPCId.Value).toEqual({ Ref: 'VPC' });
      expect(o.WebACLArn.Value).toEqual({ 'Fn::GetAtt': ['FinancialWebACL', 'Arn'] });
    });
  });

  describe('Outputs', () => {
    test('Output keys exist', () => {
      const outputs = [
        'VPCId',
        'PublicSubnet1Id',
        'PublicSubnet2Id',
        'PrivateSubnet1Id',
        'PrivateSubnet2Id',
        'FinancialDataBucketName',
        'LoggingBucketName',
        'CloudTrailBucketName',
        'PrimaryKmsKeyId',
        'CloudTrailLogGroupArn',
        'WebACLArn',
        'ALBDNS',
        'AdminCIDROut',
        'AvailabilityZonesToUseOut',
        'BucketSuffixOut',
      ];
      outputs.forEach(o => {
        const pattern = new RegExp(`(?:^|\\r?\\n)\\s*${o}:`);
        expect(yaml).toMatch(pattern);
      });
    });
    test('Outputs reference correct resources and exports are named', () => {
      expect(yaml).toMatch(/VPCId:[\s\S]*Value:\s*\!Ref VPC[\s\S]*Export:[\s\S]*Name:\s*\!Sub '\$\{Environment\}-VPC-ID'/);
      expect(yaml).toMatch(/FinancialDataBucketName:[\s\S]*Value:\s*\!Ref FinancialDataBucket[\s\S]*Export:[\s\S]*\$\{Environment\}-FinancialDataBucket-Name/);
      expect(yaml).toMatch(/WebACLArn:[\s\S]*Value:\s*\!GetAtt FinancialWebACL.Arn/);
      expect(yaml).toMatch(/ALBDNS:[\s\S]*Condition:\s*UseExampleALB[\s\S]*Value:\s*\!GetAtt ApplicationLoadBalancer.DNSName/);
    });
  });
});
