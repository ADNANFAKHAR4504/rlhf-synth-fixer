import * as fs from 'fs';
import * as path from 'path';

describe('TapStack CloudFormation Template Unit Tests', () => {
  let template: any;

  beforeAll(() => {
    const templatePath = path.join(__dirname, '../lib/TapStack.json');
    const templateContent = fs.readFileSync(templatePath, 'utf8');
    template = JSON.parse(templateContent);
  });

  // ---------------- Template Structure ----------------
  describe('Template Structure', () => {
    test('should have valid CloudFormation format version', () => {
      expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
    });

    test('should have a description', () => {
      expect(template.Description).toBeDefined();
      expect(typeof template.Description).toBe('string');
      expect(template.Description.length).toBeGreaterThan(0);
    });

    test('should have all required top-level sections', () => {
      expect(template).toHaveProperty('AWSTemplateFormatVersion');
      expect(template).toHaveProperty('Description');
      expect(template).toHaveProperty('Parameters');
      expect(template).toHaveProperty('Resources');
      expect(template).toHaveProperty('Outputs');
    });

    test('should have valid JSON structure', () => {
      expect(template).toBeDefined();
      expect(typeof template).toBe('object');
      expect(template).not.toBeNull();
    });
  });

  // ---------------- Parameters Validation ----------------
  describe('Parameters Validation', () => {
    test('should have all required parameters', () => {
      const expectedParams = [
        'EnvironmentSuffix',
        'VPCCidr',
        'PublicSubnet1Cidr',
        'PublicSubnet2Cidr',
        'PrivateSubnet1Cidr',
        'PrivateSubnet2Cidr',
        'InstanceType',
        'LatestAmiId',
        'DBUsername',
        'DBInstanceClass'
      ];
      expectedParams.forEach((param: string) => {
        expect(template.Parameters).toHaveProperty(param);
      });
    });

    test('EnvironmentSuffix parameter should have correct properties', () => {
      const p = template.Parameters.EnvironmentSuffix;
      expect(p.Type).toBe('String');
      expect(p.Default).toBe('dev');
      expect(p.AllowedPattern).toBe('^[a-z0-9]+$');
      expect(typeof p.Description).toBe('string');
    });

    test('VPCCidr parameter should have CIDR pattern validation', () => {
      const p = template.Parameters.VPCCidr;
      expect(p.Type).toBe('String');
      expect(p.Default).toBe('10.0.0.0/16');
      expect(p.AllowedPattern).toBeDefined();
    });

    test('InstanceType parameter should have allowed values', () => {
      const p = template.Parameters.InstanceType;
      expect(p.Type).toBe('String');
      expect(p.AllowedValues).toEqual(['t3.micro', 't3.small', 't3.medium', 't3.large']);
    });

    test('LatestAmiId parameter should be SSM reference', () => {
      const p = template.Parameters.LatestAmiId;
      expect(p.Type).toBe('AWS::SSM::Parameter::Value<AWS::EC2::Image::Id>');
      expect(typeof p.Default).toBe('string');
    });

    test('DBUsername parameter should forbid "admin" and start with a letter', () => {
      const u = template.Parameters.DBUsername;
      expect(u.Type).toBe('String');
      expect(u.AllowedPattern).toBe("^(?!admin$)[a-zA-Z][a-zA-Z0-9_]*$");
      expect(Number(u.MinLength)).toBeGreaterThanOrEqual(1);
      expect(Number(u.MaxLength)).toBeGreaterThan(1);
    });

    test('DBInstanceClass parameter should be defined with allowed values', () => {
      const p = template.Parameters.DBInstanceClass;
      expect(p.Type).toBe('String');
      expect(p.AllowedValues).toEqual(['db.t3.micro', 'db.t3.small', 'db.t3.medium']);
    });
  });

  // ---------------- VPC Resources ----------------
  describe('VPC Resources', () => {
    test('should have VPC resource', () => {
      expect(template.Resources.VPC).toBeDefined();
      expect(template.Resources.VPC.Type).toBe('AWS::EC2::VPC');
    });

    test('VPC should have DNS enabled and reference VPCCidr', () => {
      const vpc = template.Resources.VPC;
      expect(vpc.Properties.EnableDnsHostnames).toBe(true);
      expect(vpc.Properties.EnableDnsSupport).toBe(true);
      expect(vpc.Properties.CidrBlock).toEqual({ Ref: 'VPCCidr' });
    });

    test('should have Internet Gateway and VPC Gateway Attachment', () => {
      expect(template.Resources.InternetGateway?.Type).toBe('AWS::EC2::InternetGateway');
      const att = template.Resources.AttachGateway;
      expect(att).toBeDefined();
      expect(att.Type).toBe('AWS::EC2::VPCGatewayAttachment');
      expect(att.Properties.VpcId).toEqual({ Ref: 'VPC' });
      expect(att.Properties.InternetGatewayId).toEqual({ Ref: 'InternetGateway' });
    });
  });

  // ---------------- Subnet Resources ----------------
  describe('Subnet Resources', () => {
    test('should have public subnets in 2 AZs and map public IPs', () => {
      const s1 = template.Resources.PublicSubnet1;
      const s2 = template.Resources.PublicSubnet2;
      expect(s1?.Type).toBe('AWS::EC2::Subnet');
      expect(s2?.Type).toBe('AWS::EC2::Subnet');
      expect(s1.Properties.MapPublicIpOnLaunch).toBe(true);
      expect(s2.Properties.MapPublicIpOnLaunch).toBe(true);
      expect(s1.Properties.AvailabilityZone).toEqual({ 'Fn::Select': [0, { 'Fn::GetAZs': '' }] });
      expect(s2.Properties.AvailabilityZone).toEqual({ 'Fn::Select': [1, { 'Fn::GetAZs': '' }] });
    });

    test('should have private subnets in 2 AZs', () => {
      const s1 = template.Resources.PrivateSubnet1;
      const s2 = template.Resources.PrivateSubnet2;
      expect(s1?.Type).toBe('AWS::EC2::Subnet');
      expect(s2?.Type).toBe('AWS::EC2::Subnet');
      expect(s1.Properties.AvailabilityZone).toEqual({ 'Fn::Select': [0, { 'Fn::GetAZs': '' }] });
      expect(s2.Properties.AvailabilityZone).toEqual({ 'Fn::Select': [1, { 'Fn::GetAZs': '' }] });
    });
  });

  // ---------------- NAT Gateway Resources ----------------
  describe('NAT Gateway Resources', () => {
    test('should have EIP with dependency on gateway attachment', () => {
      const eip = template.Resources.NATGatewayEIP;
      expect(eip?.Type).toBe('AWS::EC2::EIP');
      expect(eip.DependsOn).toBe('AttachGateway');
    });

    test('should have NAT Gateway in PublicSubnet1', () => {
      const nat = template.Resources.NATGateway;
      expect(nat?.Type).toBe('AWS::EC2::NatGateway');
      expect(nat.Properties.SubnetId).toEqual({ Ref: 'PublicSubnet1' });
    });
  });

  // ---------------- Route Table Resources ----------------
  describe('Route Table Resources', () => {
    test('should have public route table and default route to IGW', () => {
      expect(template.Resources.PublicRouteTable?.Type).toBe('AWS::EC2::RouteTable');
      const r = template.Resources.PublicRoute;
      expect(r?.Type).toBe('AWS::EC2::Route');
      expect(r.Properties.DestinationCidrBlock).toBe('0.0.0.0/0');
      expect(r.Properties.GatewayId).toEqual({ Ref: 'InternetGateway' });
      expect(r.DependsOn).toBe('AttachGateway');
    });

    test('should have private route table and route to NAT', () => {
      expect(template.Resources.PrivateRouteTable?.Type).toBe('AWS::EC2::RouteTable');
      const r = template.Resources.PrivateRoute;
      expect(r?.Type).toBe('AWS::EC2::Route');
      expect(r.Properties.NatGatewayId).toEqual({ Ref: 'NATGateway' });
    });

    test('should have subnet route table associations', () => {
      const keys = [
        'PublicSubnet1RouteTableAssociation',
        'PublicSubnet2RouteTableAssociation',
        'PrivateSubnet1RouteTableAssociation',
        'PrivateSubnet2RouteTableAssociation'
      ];
      keys.forEach((k: string) => expect(template.Resources[k]).toBeDefined());
    });
  });

  // ---------------- Security Group Resources ----------------
  describe('Security Group Resources', () => {
    test('should have ALB, EC2, RDS, and Bastion security groups', () => {
      ['ALBSecurityGroup', 'EC2SecurityGroup', 'RDSSecurityGroup', 'BastionSecurityGroup']
        .forEach((k: string) => expect(template.Resources[k]?.Type).toBe('AWS::EC2::SecurityGroup'));
    });

    test('ALB security group should allow HTTP and HTTPS from anywhere', () => {
      const sg = template.Resources.ALBSecurityGroup;
      const ing = sg.Properties.SecurityGroupIngress;
      const http = ing.find((r: any) => r.FromPort === 80);
      const https = ing.find((r: any) => r.FromPort === 443);
      expect(http?.CidrIp).toBe('0.0.0.0/0');
      expect(https?.CidrIp).toBe('0.0.0.0/0');
    });

    test('EC2 security group should allow 80 from ALB and 22 from Bastion', () => {
      const sg = template.Resources.EC2SecurityGroup;
      const ing = sg.Properties.SecurityGroupIngress;
      const http = ing.find((r: any) => r.FromPort === 80);
      const ssh = ing.find((r: any) => r.FromPort === 22);
      expect(http?.SourceSecurityGroupId).toEqual({ Ref: 'ALBSecurityGroup' });
      expect(ssh?.SourceSecurityGroupId).toEqual({ Ref: 'BastionSecurityGroup' });
    });

    test('RDS SG should allow PostgreSQL 5432 from EC2 SG', () => {
      const sg = template.Resources.RDSSecurityGroup;
      const rule = sg.Properties.SecurityGroupIngress?.[0];
      expect(rule.FromPort).toBe(5432);
      expect(rule.SourceSecurityGroupId).toEqual({ Ref: 'EC2SecurityGroup' });
    });
  });

  // ---------------- S3 Bucket Resources ----------------
  describe('S3 Bucket Resources', () => {
    test('should have Log, Data, and Content buckets', () => {
      ['LogBucket', 'DataBucket', 'ContentBucket'].forEach((k: string) => {
        expect(template.Resources[k]?.Type).toBe('AWS::S3::Bucket');
      });
    });

    test('All buckets should have KMS encryption and public access blocked', () => {
      ['LogBucket', 'DataBucket', 'ContentBucket'].forEach((name: string) => {
        const b = template.Resources[name].Properties;
        const cfg = b.BucketEncryption.ServerSideEncryptionConfiguration[0].ServerSideEncryptionByDefault;
        expect(cfg.SSEAlgorithm).toBe('aws:kms');
        expect(cfg.KMSMasterKeyID).toEqual({ Ref: 'KMSKey' });

        const pab = b.PublicAccessBlockConfiguration;
        expect(pab.BlockPublicAcls).toBe(true);
        expect(pab.BlockPublicPolicy).toBe(true);
        expect(pab.IgnorePublicAcls).toBe(true);
        expect(pab.RestrictPublicBuckets).toBe(true);
      });
    });

    test('Data & Content buckets should log to LogBucket; LogBucket should have lifecycle rule', () => {
      const data = template.Resources.DataBucket.Properties;
      const content = template.Resources.ContentBucket.Properties;
      expect(data.LoggingConfiguration.DestinationBucketName).toEqual({ Ref: 'LogBucket' });
      expect(content.LoggingConfiguration.DestinationBucketName).toEqual({ Ref: 'LogBucket' });

      const log = template.Resources.LogBucket.Properties;
      const rule = log.LifecycleConfiguration.Rules[0];
      expect(rule.Status).toBe('Enabled');
      expect(rule.ExpirationInDays).toBe(90);
    });

    test('Bucket policies should enforce TLS and OAI access for content', () => {
      const dataPol = template.Resources.DataBucketPolicy.Properties.PolicyDocument.Statement;
      const contentPol = template.Resources.ContentBucketPolicy.Properties.PolicyDocument.Statement;
      const logPol = template.Resources.LogBucketPolicy.Properties.PolicyDocument.Statement;

      // Deny insecure (TLS) on Data and Content and Log buckets
      const denyInsecure = (stmts: any[]) =>
        stmts.find((s: any) => s.Effect === 'Deny' && s.Condition?.Bool?.['aws:SecureTransport'] === 'false');
      expect(denyInsecure(dataPol)).toBeDefined();
      expect(denyInsecure(contentPol)).toBeDefined();
      expect(denyInsecure(logPol)).toBeDefined();

      // OAI allow on Content bucket
      const allowOai = contentPol.find((s: any) => s.Sid === 'AllowCloudFrontOAICanonicalUserAccess');
      expect(allowOai?.Principal?.CanonicalUser).toBeDefined();

      // S3 server access logs delivery to LogBucket
      const allowLog = logPol.find((s: any) => s.Sid === 'AllowS3ServerAccessLogsDelivery');
      expect(allowLog?.Principal?.Service).toBe('logging.s3.amazonaws.com');
      expect(allowLog?.Condition?.StringEquals?.['s3:x-amz-acl']).toBe('bucket-owner-full-control');
    });
  });

  // ---------------- KMS Resources ----------------
  describe('KMS Resources', () => {
    test('should have KMS Key and Alias', () => {
      expect(template.Resources.KMSKey?.Type).toBe('AWS::KMS::Key');
      expect(template.Resources.KMSAlias?.Type).toBe('AWS::KMS::Alias');
      expect(template.Resources.KMSAlias.Properties.TargetKeyId).toEqual({ Ref: 'KMSKey' });
    });

    test('KMS key should have rotation enabled', () => {
      expect(template.Resources.KMSKey.Properties.EnableKeyRotation).toBe(true);
    });
  });

  // ---------------- IAM Resources ----------------
  describe('IAM Resources', () => {
    test('should have EC2 IAM Role and Instance Profile', () => {
      expect(template.Resources.EC2Role?.Type).toBe('AWS::IAM::Role');
      const profile = template.Resources.EC2InstanceProfile;
      expect(profile?.Type).toBe('AWS::IAM::InstanceProfile');
      expect(profile.Properties.Roles).toContainEqual({ Ref: 'EC2Role' });
    });

    test('EC2 Role should have CloudWatch & SSM managed policies', () => {
      const role = template.Resources.EC2Role;
      expect(role.Properties.ManagedPolicyArns).toContain('arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy');
      expect(role.Properties.ManagedPolicyArns).toContain('arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore');
    });

    test('EC2 Role inline policy should grant least-privilege S3 + KMS access', () => {
      const role = template.Resources.EC2Role;
      const policies: any[] = role.Properties.Policies;
      expect(Array.isArray(policies)).toBe(true);
      const doc = policies[0].PolicyDocument;
      const actions = doc.Statement.flatMap((s: any) => s.Action);
      expect(actions).toEqual(expect.arrayContaining(['s3:ListBucket', 's3:GetObject', 's3:PutObject']));
      expect(actions).toEqual(expect.arrayContaining(['kms:Decrypt', 'kms:Encrypt', 'kms:GenerateDataKey', 'kms:DescribeKey']));
    });
  });

  // ---------------- Load Balancer Resources ----------------
  describe('Load Balancer Resources', () => {
    test('should have Application Load Balancer, Target Group and Listener', () => {
      expect(template.Resources.ApplicationLoadBalancer?.Type).toBe('AWS::ElasticLoadBalancingV2::LoadBalancer');
      expect(template.Resources.ALBTargetGroup?.Type).toBe('AWS::ElasticLoadBalancingV2::TargetGroup');
      expect(template.Resources.ALBListener?.Type).toBe('AWS::ElasticLoadBalancingV2::Listener');
    });

    test('ALB should be internet-facing and span two public subnets', () => {
      const alb = template.Resources.ApplicationLoadBalancer;
      expect(alb.Properties.Scheme).toBe('internet-facing');
      expect(alb.Properties.Type).toBe('application');
      expect(alb.Properties.Subnets).toContainEqual({ Ref: 'PublicSubnet1' });
      expect(alb.Properties.Subnets).toContainEqual({ Ref: 'PublicSubnet2' });
    });
  });

  // ---------------- Auto Scaling Resources ----------------
  describe('Auto Scaling Resources', () => {
    test('should have Launch Template using LatestAmiId and Instance Profile', () => {
      const lt = template.Resources.LaunchTemplate;
      expect(lt?.Type).toBe('AWS::EC2::LaunchTemplate');
      expect(lt.Properties.LaunchTemplateData.ImageId).toEqual({ Ref: 'LatestAmiId' });
      expect(lt.Properties.LaunchTemplateData.IamInstanceProfile.Name).toEqual({ Ref: 'EC2InstanceProfile' });

      const ebs = lt.Properties.LaunchTemplateData.BlockDeviceMappings[0].Ebs;
      expect(ebs.Encrypted).toBe(true);
      expect(ebs.KmsKeyId).toBeUndefined();
    });

    test('should have Auto Scaling Group referencing LaunchTemplate LatestVersionNumber', () => {
      const asg = template.Resources.AutoScalingGroup;
      expect(asg?.Type).toBe('AWS::AutoScaling::AutoScalingGroup');
      expect(asg.Properties.LaunchTemplate.Version).toEqual({ 'Fn::GetAtt': ['LaunchTemplate', 'LatestVersionNumber'] });
      expect(asg.Properties.VPCZoneIdentifier).toContainEqual({ Ref: 'PrivateSubnet1' });
      expect(asg.Properties.VPCZoneIdentifier).toContainEqual({ Ref: 'PrivateSubnet2' });
      expect(asg.Properties.TargetGroupARNs).toContainEqual({ Ref: 'ALBTargetGroup' });
    });

    test('should have simple step scaling policies and CPU alarms', () => {
      ['ScaleUpPolicy', 'ScaleDownPolicy', 'CPUAlarmHigh', 'CPUAlarmLow']
        .forEach((k: string) => expect(template.Resources[k]).toBeDefined());
    });
  });

  // ---------------- RDS Resources ----------------
  describe('RDS Resources', () => {
    test('should have DB Subnet Group using private subnets', () => {
      const sg = template.Resources.DBSubnetGroup;
      expect(sg?.Type).toBe('AWS::RDS::DBSubnetGroup');
      expect(sg.Properties.SubnetIds).toContainEqual({ Ref: 'PrivateSubnet1' });
      expect(sg.Properties.SubnetIds).toContainEqual({ Ref: 'PrivateSubnet2' });
    });

    test('should have DB Secret in Secrets Manager with env suffix', () => {
      const sec = template.Resources.DBSecret;
      expect(sec?.Type).toBe('AWS::SecretsManager::Secret');
      expect(sec.Properties.Name).toEqual({ 'Fn::Sub': 'TapStack${EnvironmentSuffix}/db/master' });
    });

    test('should have RDS PostgreSQL 15.10, encrypted, private, Multi-AZ, CW logs', () => {
      const db = template.Resources.DBInstance;
      expect(db?.Type).toBe('AWS::RDS::DBInstance');
      expect(db.DeletionPolicy).toBe('Delete');
      expect(db.UpdateReplacePolicy).toBe('Delete');

      const p = db.Properties;
      expect(p.Engine).toBe('postgres');
      expect(p.EngineVersion).toBe('15.10');
      expect(p.MasterUsername).toEqual({ Ref: 'DBUsername' });
      expect(p.MasterUserPassword?.['Fn::Sub']).toContain('resolve:secretsmanager');
      expect(p.StorageEncrypted).toBe(true);
      expect(p.KmsKeyId).toEqual({ Ref: 'KMSKey' });
      expect(p.PubliclyAccessible).toBe(false);
      expect(p.MultiAZ).toBe(true);
      expect(p.EnableCloudwatchLogsExports).toContain('postgresql');
    });
  });

  // ---------------- CloudWatch Resources ----------------
  describe('CloudWatch Resources', () => {
    test('should have CPU high/low alarms tied to ASG policies', () => {
      const hi = template.Resources.CPUAlarmHigh.Properties;
      const lo = template.Resources.CPUAlarmLow.Properties;
      expect(hi.MetricName).toBe('CPUUtilization');
      expect(lo.MetricName).toBe('CPUUtilization');
      expect(hi.AlarmActions).toContainEqual({ Ref: 'ScaleUpPolicy' });
      expect(lo.AlarmActions).toContainEqual({ Ref: 'ScaleDownPolicy' });
    });
  });

  // ---------------- Lambda (S3 notifications) ----------------
  describe('Lambda Resources', () => {
    test('should have Lambda function, role and S3 invoke permission', () => {
      expect(template.Resources.LogProcessorFunction?.Type).toBe('AWS::Lambda::Function');
      expect(template.Resources.LambdaExecutionRole?.Type).toBe('AWS::IAM::Role');
      expect(template.Resources.LambdaS3Permission?.Type).toBe('AWS::Lambda::Permission');
    });

    test('Log bucket should notify Lambda on object create', () => {
      const lb = template.Resources.LogBucket.Properties;
      const notif = lb.NotificationConfiguration.LambdaConfigurations?.[0];
      expect(notif?.Event).toBe('s3:ObjectCreated:*');
      expect(notif?.Function).toEqual({ 'Fn::GetAtt': ['LogProcessorFunction', 'Arn'] });
    });
  });

  // ---------------- Outputs ----------------
  describe('Outputs', () => {
    test('should have all required outputs', () => {
      [
        'VPCId',
        'ALBDNSName',
        'CloudFrontURL',
        'BastionPublicIP',
        'DataBucketName',
        'RDSEndpoint',
        'LambdaFunctionArn'
      ].forEach((k: string) => expect(template.Outputs[k]).toBeDefined());
    });

    test('output export names should use environment suffix', () => {
      const expected: Record<string, string> = {
        VPCId: 'TapStack${EnvironmentSuffix}-VPC-ID',
        ALBDNSName: 'TapStack${EnvironmentSuffix}-ALB-DNS',
        CloudFrontURL: 'TapStack${EnvironmentSuffix}-CloudFront-URL',
        BastionPublicIP: 'TapStack${EnvironmentSuffix}-Bastion-IP',
        DataBucketName: 'TapStack${EnvironmentSuffix}-DataBucket',
        RDSEndpoint: 'TapStack${EnvironmentSuffix}-RDS-Endpoint',
        LambdaFunctionArn: 'TapStack${EnvironmentSuffix}-Lambda-ARN'
      };
      Object.entries(expected).forEach(([k, subVal]: [string, string]) => {
        const out = template.Outputs[k];
        expect(out.Export?.Name).toEqual({ 'Fn::Sub': subVal });
      });
    });
  });

  // ---------------- High Availability ----------------
  describe('High Availability', () => {
    test('resources should be distributed across multiple AZs', () => {
      expect(template.Resources.PublicSubnet1).toBeDefined();
      expect(template.Resources.PublicSubnet2).toBeDefined();
      expect(template.Resources.PrivateSubnet1).toBeDefined();
      expect(template.Resources.PrivateSubnet2).toBeDefined();
      expect(template.Resources.DBInstance.Properties.MultiAZ).toBe(true);
    });

    test('Auto Scaling and Load Balancer should span multiple AZs', () => {
      const asg = template.Resources.AutoScalingGroup;
      expect(asg.Properties.VPCZoneIdentifier.length).toBeGreaterThanOrEqual(2);

      const alb = template.Resources.ApplicationLoadBalancer;
      expect(alb.Properties.Subnets.length).toBeGreaterThanOrEqual(2);
    });
  });

  // ---------------- Template Validation ----------------
  describe('Template Validation', () => {
    test('should not have null sections', () => {
      expect(template.AWSTemplateFormatVersion).not.toBeNull();
      expect(template.Description).not.toBeNull();
      expect(template.Parameters).not.toBeNull();
      expect(template.Resources).not.toBeNull();
      expect(template.Outputs).not.toBeNull();
    });

    test('should have a reasonable number of resources/parameters/outputs', () => {
      const rc = Object.keys(template.Resources).length;
      const pc = Object.keys(template.Parameters).length;
      const oc = Object.keys(template.Outputs).length;
      expect(rc).toBeGreaterThan(20);
      expect(pc).toBeGreaterThan(5);
      expect(oc).toBeGreaterThanOrEqual(7);
    });
  });
});
