import fs from 'fs';
import path from 'path';

describe('TapStack CloudFormation Template', () => {
  let template: any;

  beforeAll(() => {
    const templatePath = path.join(__dirname, '../lib/TapStack.json');
    const templateContent = fs.readFileSync(templatePath, 'utf8');
    template = JSON.parse(templateContent);
  });

  describe('Template Structure', () => {
    test('has CFN format, description, and core sections', () => {
      expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
      expect(template.Description).toBeDefined();
      expect(template.Description).toContain('Production-ready single-region environment');
      expect(template.Description).toContain('VPC, ALB+ASG, RDS Multi-AZ, S3');
      expect(template.Description).toContain('No global resources');
      expect(template.Parameters).toBeDefined();
      expect(template.Resources).toBeDefined();
      expect(template.Outputs).toBeDefined();
      expect(template.Conditions).toBeDefined();
      expect(template.Mappings).toBeUndefined();
      expect(template.Transform).toBeUndefined();
    });
  });

  describe('Parameters', () => {
    test('key parameters exist with types and descriptions', () => {
      const mustHave = [
        'EnvironmentName','VpcCidr','AZCount','PublicSubnetCidrs','PrivateSubnetCidrs',
        'S3BucketNameOverride','EnableS3Replication','ReplicationDestinationBucketArn',
        'DBSecretArn','DBInstanceClass','DBName','DBEngine','PostgresEngineVersion','MySqlEngineVersion',
        'DBDeletionProtection','EC2InstanceType','AsgMinSize','AsgMaxSize','AsgDesiredCapacity',
        'AllowedCidrIngress','HostedZoneId','ACMCertificateArn','Project','Owner','UseNamedIam'
      ];
      mustHave.forEach((p) => {
        expect(template.Parameters[p]).toBeDefined();
        expect(template.Parameters[p].Type).toBeDefined();
        expect(template.Parameters[p].Description).toBeDefined();
      });
    });

    test('EnvironmentName config', () => {
      const p = template.Parameters.EnvironmentName;
      expect(p.Type).toBe('String');
      expect(p.Default).toBe('prod-regional');
    });

    test('VpcCidr regex is correct', () => {
      const p = template.Parameters.VpcCidr;
      expect(p.Type).toBe('String');
      expect(p.Default).toBe('10.0.0.0/16');
      expect(() => new RegExp(p.AllowedPattern)).not.toThrow();
    });

    test('AZCount range', () => {
      const p = template.Parameters.AZCount;
      expect(p.Type).toBe('Number');
      expect(p.Default).toBe(2);
      expect(p.MinValue).toBe(2);
      expect(p.MaxValue).toBe(3);
    });

    test('subnet CIDR params', () => {
      const pub = template.Parameters.PublicSubnetCidrs;
      expect(pub.Type).toBe('CommaDelimitedList');
      expect(pub.Default).toBe('10.0.1.0/24,10.0.2.0/24');
      const priv = template.Parameters.PrivateSubnetCidrs;
      expect(priv.Type).toBe('CommaDelimitedList');
      expect(priv.Default).toBe('10.0.10.0/24,10.0.20.0/24');
    });

    test('S3 override param (no global bucket param)', () => {
      const p = template.Parameters.S3BucketNameOverride;
      expect(p.Type).toBe('String');
      expect(p.AllowedPattern).toBe('^$|^[a-z0-9][a-z0-9-]{1,61}[a-z0-9]$');
    });

    test('DB params reflect supported versions', () => {
      const eng = template.Parameters.DBEngine;
      expect(eng.Type).toBe('String');
      expect(eng.Default).toBe('postgres');
      expect(eng.AllowedValues).toEqual(['postgres', 'mysql']);

      const pg = template.Parameters.PostgresEngineVersion;
      expect(pg.Type).toBe('String');
      expect(pg.Default).toBe('14.18');
      expect(pg.AllowedValues).toEqual(['17.5','16.9','15.13','14.18','13.21']);

      const my = template.Parameters.MySqlEngineVersion;
      expect(my.Type).toBe('String');
      expect(my.Default).toBe('8.0.35');
      expect(() => new RegExp(my.AllowedPattern)).not.toThrow();
    });

    test('ASG + EC2 params', () => {
      const it = template.Parameters.EC2InstanceType;
      expect(it.Type).toBe('String');
      expect(it.Default).toBe('t3.medium');
      expect(it.AllowedValues).toEqual(['t3.medium']);

      const min = template.Parameters.AsgMinSize;
      expect(min.Type).toBe('Number');
      expect(min.Default).toBe(2);
      expect(min.MinValue).toBe(2);

      const max = template.Parameters.AsgMaxSize;
      expect(max.Type).toBe('Number');
      expect(max.Default).toBe(6);
      expect(max.MinValue).toBe(2);

      const des = template.Parameters.AsgDesiredCapacity;
      expect(des.Type).toBe('Number');
      expect(des.Default).toBe(2);
      expect(des.MinValue).toBe(2);
    });

    test('Networking + DNS params', () => {
      const allow = template.Parameters.AllowedCidrIngress;
      expect(allow.Type).toBe('CommaDelimitedList');
      expect(allow.Default).toBe('0.0.0.0/0');

      const hz = template.Parameters.HostedZoneId;
      expect(hz.Type).toBe('String');
      expect(hz.Default).toBe('');

      const acm = template.Parameters.ACMCertificateArn;
      expect(acm.Type).toBe('String');
      expect(acm.Default).toBe('');
    });
  });

  describe('Conditions', () => {
    test('expected conditions exist', () => {
      const required = [
        'EnableReplication','CreateRoute53Records','EnableHTTPS','UseThreeAZs','IsPostgres',
        'DeletionProtectionOn','HasBucketOverride','HasDBSecretArn','CreateDBSecret','UseNamedIamCond'
      ];
      required.forEach((c) => expect(template.Conditions[c]).toBeDefined());
    });

    test('EnableReplication logic', () => {
      const c = template.Conditions.EnableReplication;
      expect(c['Fn::And']).toBeDefined();
      expect(c['Fn::And'][0]).toEqual({ 'Fn::Equals': [{ Ref: 'EnableS3Replication' }, 'true'] });
      expect(c['Fn::And'][1]).toEqual({ 'Fn::Not': [{ 'Fn::Equals': [{ Ref: 'ReplicationDestinationBucketArn' }, ''] }] });
    });
  });

  describe('Networking', () => {
    test('VPC base config', () => {
      const vpc = template.Resources.VPC;
      expect(vpc.Type).toBe('AWS::EC2::VPC');
      expect(vpc.Properties.CidrBlock).toEqual({ Ref: 'VpcCidr' });
      expect(vpc.Properties.EnableDnsHostnames).toBe(true);
      expect(vpc.Properties.EnableDnsSupport).toBe(true);
    });

    test('Subnets + routing wired correctly', () => {
      const ps1 = template.Resources.PublicSubnet1;
      expect(ps1.Type).toBe('AWS::EC2::Subnet');
      expect(ps1.Properties.MapPublicIpOnLaunch).toBe(true);

      const pr1 = template.Resources.PrivateRt1;
      const def1 = template.Resources.PrivateDefaultRoute1;
      expect(pr1.Type).toBe('AWS::EC2::RouteTable');
      expect(def1.Type).toBe('AWS::EC2::Route');
      expect(def1.Properties.NatGatewayId).toEqual({ Ref: 'NatGw1' });

      const pubRoute = template.Resources.PublicDefaultRoute;
      expect(pubRoute.Type).toBe('AWS::EC2::Route');
      expect(pubRoute.Properties.GatewayId).toEqual({ Ref: 'InternetGateway' });
    });

    test('NACL basics', () => {
      const pubNaclIn = template.Resources.PublicNaclInbound;
      expect(pubNaclIn.Properties.Protocol).toBe(-1);
      expect(pubNaclIn.Properties.RuleAction).toBe('allow');

      const privNaclIn = template.Resources.PrivateNaclInbound;
      expect(privNaclIn.Properties.CidrBlock).toEqual({ Ref: 'VpcCidr' });
    });
  });

  describe('Security Groups', () => {
    test('ALB SG allows HTTP/HTTPS from AllowedCidrIngress[0]', () => {
      const sg = template.Resources.ALBSecurityGroup;
      const rules = sg.Properties.SecurityGroupIngress;
      expect(rules).toHaveLength(2);
      expect(rules[0]).toMatchObject({
        IpProtocol: 'tcp',
        FromPort: 80,
        ToPort: 80,
        CidrIp: { 'Fn::Select': [0, { Ref: 'AllowedCidrIngress' }] },
      });
      expect(rules[1]).toMatchObject({
        IpProtocol: 'tcp',
        FromPort: 443,
        ToPort: 443,
      });
    });

    test('Web tier SG accepts from ALB + SSH from allowed', () => {
      const sg = template.Resources.WebTierSecurityGroup;
      const rules = sg.Properties.SecurityGroupIngress;
      expect(rules).toHaveLength(3);
      expect(rules[0].SourceSecurityGroupId).toEqual({ Ref: 'ALBSecurityGroup' });
      expect(rules[1].SourceSecurityGroupId).toEqual({ Ref: 'ALBSecurityGroup' });
      expect(rules[2].CidrIp).toEqual({ 'Fn::Select': [0, { Ref: 'AllowedCidrIngress' }] });
    });

    test('DB SG gated by web tier, port conditioned by engine', () => {
      const rule = template.Resources.DatabaseSecurityGroup.Properties.SecurityGroupIngress[0];
      expect(rule.SourceSecurityGroupId).toEqual({ Ref: 'WebTierSecurityGroup' });
      expect(rule.FromPort).toEqual({ 'Fn::If': ['IsPostgres', 5432, 3306] });
      expect(rule.ToPort).toEqual({ 'Fn::If': ['IsPostgres', 5432, 3306] });
    });
  });

  describe('IAM', () => {
    test('EC2 instance role + policies', () => {
      const role = template.Resources.EC2InstanceRole;
      expect(role.Type).toBe('AWS::IAM::Role');
      expect(role.Properties.ManagedPolicyArns).toContain('arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore');

      const policies = role.Properties.Policies;
      const s3 = policies.find((p: any) => p.PolicyName === 's3-access');
      const sm = policies.find((p: any) => p.PolicyName === 'secretsmanager-read-db');
      expect(s3).toBeDefined();
      expect(sm).toBeDefined();
      expect(sm.PolicyDocument.Statement[0].Action).toEqual(['secretsmanager:GetSecretValue']);
    });

    test('RDS monitoring role', () => {
      const role = template.Resources.RDSMonitoringRole;
      expect(role.Type).toBe('AWS::IAM::Role');
      expect(role.Properties.AssumeRolePolicyDocument.Statement[0].Principal.Service).toBe('monitoring.rds.amazonaws.com');
    });

    test('S3 replication role & separate policy are conditional', () => {
      const role = template.Resources.S3ReplicationRole;
      const pol = template.Resources.S3ReplicationPolicy;
      expect(role.Condition).toBe('EnableReplication');
      expect(pol.Condition).toBe('EnableReplication');
      expect(pol.Type).toBe('AWS::IAM::Policy');
      // object deep-compare for array entries
      expect(pol.Properties.Roles).toContainEqual({ Ref: 'S3ReplicationRole' });
    });

    test('instance profile references the role', () => {
      const prof = template.Resources.EC2InstanceProfile;
      expect(prof.Type).toBe('AWS::IAM::InstanceProfile');
      expect(prof.Properties.Roles).toEqual([{ Ref: 'EC2InstanceRole' }]);
    });
  });

  describe('Compute & ALB', () => {
    test('LaunchTemplate hardening', () => {
      const lt = template.Resources.LaunchTemplate;
      const data = lt.Properties.LaunchTemplateData;
      expect(data.InstanceType).toEqual({ Ref: 'EC2InstanceType' });
      expect(data.ImageId).toBe('{{resolve:ssm:/aws/service/ami-amazon-linux-latest/amzn2-ami-hvm-x86_64-gp2}}');
      expect(data.MetadataOptions.HttpTokens).toBe('required');
      expect(data.MetadataOptions.HttpEndpoint).toBe('enabled');
      expect(data.MetadataOptions.HttpPutResponseHopLimit).toBe(2);
      expect(data.BlockDeviceMappings[0].Ebs.Encrypted).toBe(true);
      expect(data.BlockDeviceMappings[0].Ebs.VolumeType).toBe('gp3');
      expect(data.Monitoring.Enabled).toBe(true);
    });

    test('ASG uses private subnets and ELB health checks', () => {
      const asg = template.Resources.AutoScalingGroup;
      expect(asg.Properties.VPCZoneIdentifier[0]).toEqual({ Ref: 'PrivateSubnet1' });
      expect(asg.Properties.VPCZoneIdentifier[1]).toEqual({ Ref: 'PrivateSubnet2' });
      expect(asg.Properties.HealthCheckType).toBe('ELB');
      expect(asg.Properties.HealthCheckGracePeriod).toBe(300);
    });

    test('ALB and listeners', () => {
      const alb = template.Resources.ApplicationLoadBalancer;
      expect(alb.Type).toBe('AWS::ElasticLoadBalancingV2::LoadBalancer');
      expect(alb.Properties.Scheme).toBe('internet-facing');
      expect(alb.Properties.Subnets[0]).toEqual({ Ref: 'PublicSubnet1' });
      expect(alb.Properties.Subnets[1]).toEqual({ Ref: 'PublicSubnet2' });

      const tg = template.Resources.ALBTargetGroup;
      expect(tg.Properties.HealthCheckPath).toBe('/');

      const http = template.Resources.ALBListenerHttp;
      expect(http.Properties.Port).toBe(80);
      const https = template.Resources.ALBListenerHttps;
      expect(https.Condition).toBe('EnableHTTPS');
      expect(https.Properties.Port).toBe(443);
      expect(https.Properties.Protocol).toBe('HTTPS');
    });
  });

  describe('RDS', () => {
    test('DB subnets are private', () => {
      const dbsg = template.Resources.DBSubnetGroup;
      expect(dbsg.Properties.SubnetIds[0]).toEqual({ Ref: 'PrivateSubnet1' });
      expect(dbsg.Properties.SubnetIds[1]).toEqual({ Ref: 'PrivateSubnet2' });
    });

    test('DB instance production settings', () => {
      const rds = template.Resources.RDSInstance;
      expect(rds.DeletionPolicy).toBe('Snapshot');
      expect(rds.UpdateReplacePolicy).toBe('Snapshot');

      const p = rds.Properties;
      expect(p.MultiAZ).toBe(true);
      expect(p.StorageEncrypted).toBe(true);
      expect(p.StorageType).toBe('gp3');
      expect(p.AllocatedStorage).toBe(100);
      expect(p.BackupRetentionPeriod).toBe(7);
      expect(p.EnablePerformanceInsights).toBe(true);
      expect(p.MonitoringInterval).toBe(60);
      expect(p.PubliclyAccessible).toBe(false);
      expect(p.AutoMinorVersionUpgrade).toBe(true);
      expect(p.CopyTagsToSnapshot).toBe(true);

      // Secrets resolution is inside Fn::If branches with Fn::Sub in each branch.
      const extractSubStrings = (expr: any): string[] => {
        if (!expr) return [];
        if (expr['Fn::Sub']) return [expr['Fn::Sub'] as string];
        if (expr['Fn::If']) {
          const [, thenVal, elseVal] = expr['Fn::If'] as [string, any, any];
          const thenStr = thenVal && thenVal['Fn::Sub'];
          const elseStr = elseVal && elseVal['Fn::Sub'];
          return [thenStr, elseStr].filter(Boolean);
        }
        return [];
      };

      const userSubs = extractSubStrings(p.MasterUsername);
      const passSubs = extractSubStrings(p.MasterUserPassword);

      expect(userSubs.length).toBeGreaterThan(0);
      expect(passSubs.length).toBeGreaterThan(0);
      userSubs.forEach((s) => expect(s).toContain('secretsmanager'));
      passSubs.forEach((s) => expect(s).toContain('secretsmanager'));
    });
  });

  describe('S3', () => {
    test('secure bucket config + CRR conditional', () => {
      const b = template.Resources.S3Bucket;
      expect(b.Properties.VersioningConfiguration.Status).toBe('Enabled');
      expect(b.Properties.BucketEncryption.ServerSideEncryptionConfiguration[0].ServerSideEncryptionByDefault.SSEAlgorithm).toBe('AES256');
      const pab = b.Properties.PublicAccessBlockConfiguration;
      expect(pab.BlockPublicAcls).toBe(true);
      expect(pab.BlockPublicPolicy).toBe(true);
      expect(pab.IgnorePublicAcls).toBe(true);
      expect(pab.RestrictPublicBuckets).toBe(true);

      const rep = b.Properties.ReplicationConfiguration;
      expect(rep['Fn::If'][0]).toBe('EnableReplication');
      expect(rep['Fn::If'][2]).toEqual({ Ref: 'AWS::NoValue' });
    });
  });

  describe('Route53 (conditional)', () => {
    test('records attached to ALB with proper condition', () => {
      const a = template.Resources.ApplicationLoadBalancerRecordA;
      const aaaa = template.Resources.ApplicationLoadBalancerRecordAAAA;
      [a, aaaa].forEach((rec) => {
        expect(rec.Type).toBe('AWS::Route53::RecordSet');
        expect(rec.Condition).toBe('CreateRoute53Records');
        expect(rec.Properties.HostedZoneId).toEqual({ Ref: 'HostedZoneId' });
        expect(rec.Properties.AliasTarget.DNSName).toEqual({ 'Fn::GetAtt': ['ApplicationLoadBalancer', 'DNSName'] });
        expect(rec.Properties.AliasTarget.HostedZoneId).toEqual({ 'Fn::GetAtt': ['ApplicationLoadBalancer', 'CanonicalHostedZoneID'] });
      });
      expect(a.Properties.Type).toBe('A');
      expect(aaaa.Properties.Type).toBe('AAAA');
    });
  });

  describe('Outputs', () => {
    test('core outputs exist and reference right things', () => {
      const expected = [
        'VpcId','PublicSubnets','PrivateSubnets','SecurityGroups',
        'LaunchTemplateId','AsgName','AlbDnsName','S3BucketNameOut',
        'S3BucketArnOut','RdsEndpoint'
      ];
      expected.forEach((o) => {
        expect(template.Outputs[o]).toBeDefined();
        expect(template.Outputs[o].Description).toBeDefined();
      });

      expect(template.Outputs.VpcId.Value).toEqual({ Ref: 'VPC' });
      expect(template.Outputs.AlbDnsName.Value).toEqual({ 'Fn::GetAtt': ['ApplicationLoadBalancer', 'DNSName'] });
      expect(template.Outputs.S3BucketArnOut.Value).toEqual({ 'Fn::GetAtt': ['S3Bucket', 'Arn'] });
      expect(template.Outputs.RdsEndpoint.Value).toEqual({ 'Fn::GetAtt': ['RDSInstance', 'Endpoint.Address'] });

      const pub = template.Outputs.PublicSubnets.Value['Fn::Join'][1];
      const priv = template.Outputs.PrivateSubnets.Value['Fn::Join'][1];
      expect(pub[0]).toEqual({ Ref: 'PublicSubnet1' });
      expect(pub[1]).toEqual({ Ref: 'PublicSubnet2' });
      expect(pub[2]).toEqual({ 'Fn::If': ['UseThreeAZs', { Ref: 'PublicSubnet3' }, { Ref: 'AWS::NoValue' }] });
      expect(priv[2]).toEqual({ 'Fn::If': ['UseThreeAZs', { Ref: 'PrivateSubnet3' }, { Ref: 'AWS::NoValue' }] });
    });
  });

  describe('Basic integrity checks', () => {
    test('all Refs point to existing params/resources (or AWS pseudo-params)', () => {
      const resourceNames = Object.keys(template.Resources);
      const paramNames = Object.keys(template.Parameters);
      JSON.stringify(template, (_key, value) => {
        if (value && typeof value === 'object' && Object.prototype.hasOwnProperty.call(value, 'Ref')) {
          const ref = value.Ref as string;
          if (
            !paramNames.includes(ref) &&
            !resourceNames.includes(ref) &&
            !ref.startsWith('AWS::')
          ) {
            throw new Error(`Invalid Ref: ${ref}`);
          }
        }
        return value;
      });
    });
  });
});
