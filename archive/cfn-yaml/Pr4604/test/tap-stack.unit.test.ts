import fs from 'fs';
import path from 'path';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('TapStack CloudFormation Template - Comprehensive Unit Tests', () => {
  let template: any;

  beforeAll(() => {
    const templatePath = path.join(__dirname, '../lib/TapStack.json');
    const templateContent = fs.readFileSync(templatePath, 'utf8');
    template = JSON.parse(templateContent);
  });

  // ---------------------------
  // Template Structure
  // ---------------------------
  describe('Template Structure', () => {
    test('should have valid CloudFormation format version', () => {
      expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
    });

    test('should have correct description', () => {
      expect(template.Description).toBe(
        'Secure production-ready AWS environment with private compute, multi-AZ database, and comprehensive security controls'
      );
    });

    test('should have all required top-level sections', () => {
      expect(template.Parameters).toBeDefined();
      expect(template.Conditions).toBeDefined();
      expect(template.Resources).toBeDefined();
      expect(template.Outputs).toBeDefined();
    });
  });

  // ---------------------------
  // Parameters Validation
  // ---------------------------
  describe('Parameters Validation', () => {
    const expectedParameters = [
      'VPCCIDRBlock', 'PublicSubnet1CIDR', 'PublicSubnet2CIDR',
      'PrivateSubnet1CIDR', 'PrivateSubnet2CIDR', 'DBSubnet1CIDR', 'DBSubnet2CIDR',
      'AllowedCIDRForALB', 'InstanceType', 'LatestAmiId', 'DBInstanceClass',
      'DBEngine', 'DBEngineVersion', 'DBBackupRetention', 'LogRetentionDays', 'EnableCloudFront'
    ];

    test('should have all required parameters', () => {
      expectedParameters.forEach(param => {
        expect(template.Parameters[param]).toBeDefined();
      });
    });

    test('VPC CIDR should have correct default and pattern', () => {
      const param = template.Parameters.VPCCIDRBlock;
      expect(param.Default).toBe('10.0.0.0/16');
      expect(param.AllowedPattern).toBe('^(10\\.|172\\.(1[6-9]|2[0-9]|3[01])\\.|192\\.168\\.).*');
    });

    test('instance type should have allowed values', () => {
      const param = template.Parameters.InstanceType;
      expect(param.AllowedValues).toEqual(['t3.micro', 't3.small', 't3.medium', 't3.large']);
      expect(param.Default).toBe('t3.micro');
    });

    test('DB parameters should have correct defaults and patterns', () => {
      expect(template.Parameters.DBEngine.Default).toBe('postgres');
      // Region-safe: leave DBEngineVersion blank by default
      expect(template.Parameters.DBEngineVersion.Default).toBe('');
      // Pattern allows "", semantic versions, and optional "-rN" suffix
      expect(template.Parameters.DBEngineVersion.AllowedPattern)
        .toBe('^$|^[0-9]+(\\.[0-9]+){0,2}(-r[0-9]+)?$');
      expect(template.Parameters.DBInstanceClass.Default).toBe('db.t3.micro');
      expect(template.Parameters.DBBackupRetention.Default).toBe(7);
    });

    test('LatestAmiId should be an SSM parameter reference type', () => {
      expect(template.Parameters.LatestAmiId.Type)
        .toBe('AWS::SSM::Parameter::Value<AWS::EC2::Image::Id>');
    });
  });

  // ---------------------------
  // Conditions
  // ---------------------------
  describe('Conditions', () => {
    test('should have CreateCloudFront condition', () => {
      expect(template.Conditions.CreateCloudFront).toEqual({
        'Fn::Equals': [{ 'Ref': 'EnableCloudFront' }, 'true']
      });
    });

    test('should have IsPostgres condition', () => {
      expect(template.Conditions.IsPostgres).toEqual({
        'Fn::Equals': [{ 'Ref': 'DBEngine' }, 'postgres']
      });
    });

    test('should have HasDBEngineVersion condition', () => {
      expect(template.Conditions.HasDBEngineVersion).toEqual({
        'Fn::Not': [{ 'Fn::Equals': [{ 'Ref': 'DBEngineVersion' }, ''] }]
      });
    });
  });

  // ---------------------------
  // Network Infrastructure
  // ---------------------------
  describe('Network Infrastructure', () => {
    test('should create VPC with DNS support', () => {
      const vpc = template.Resources.VPC;
      expect(vpc.Type).toBe('AWS::EC2::VPC');
      expect(vpc.Properties.EnableDnsHostnames).toBe(true);
      expect(vpc.Properties.EnableDnsSupport).toBe(true);
    });

    test('should create Internet Gateway', () => {
      const igw = template.Resources.InternetGateway;
      expect(igw.Type).toBe('AWS::EC2::InternetGateway');
    });

    test('should create all required subnets', () => {
      const subnets = ['PublicSubnet1', 'PublicSubnet2', 'PrivateSubnet1', 'PrivateSubnet2', 'DBSubnet1', 'DBSubnet2'];
      subnets.forEach(subnet => {
        expect(template.Resources[subnet]).toBeDefined();
        expect(template.Resources[subnet].Type).toBe('AWS::EC2::Subnet');
      });
    });

    test('should have proper subnet CIDR blocks', () => {
      expect(template.Resources.PublicSubnet1.Properties.CidrBlock).toEqual({ 'Ref': 'PublicSubnet1CIDR' });
      expect(template.Resources.PrivateSubnet1.Properties.CidrBlock).toEqual({ 'Ref': 'PrivateSubnet1CIDR' });
      expect(template.Resources.DBSubnet1.Properties.CidrBlock).toEqual({ 'Ref': 'DBSubnet1CIDR' });
    });

    test('should create key VPC endpoints', () => {
      const endpoints = ['S3Endpoint', 'DynamoDBEndpoint', 'SSMEndpoint', 'LogsEndpoint', 'KMSEndpoint'];
      endpoints.forEach(endpoint => {
        expect(template.Resources[endpoint]).toBeDefined();
        expect(template.Resources[endpoint].Type).toBe('AWS::EC2::VPCEndpoint');
      });
    });
  });

  // ---------------------------
  // Security Groups
  // ---------------------------
  describe('Security Groups', () => {
    test('should create ALB security group with HTTP access', () => {
      const sg = template.Resources.ALBSecurityGroup;
      expect(sg.Type).toBe('AWS::EC2::SecurityGroup');
      const ingress = sg.Properties.SecurityGroupIngress[0];
      expect(ingress.FromPort).toBe(80);
      expect(ingress.ToPort).toBe(80);
      expect(ingress.IpProtocol).toBe('tcp');
    });

    test('should create EC2 security group with restricted access from ALB', () => {
      const sg = template.Resources.EC2SecurityGroup;
      expect(sg.Type).toBe('AWS::EC2::SecurityGroup');
      const ingress = sg.Properties.SecurityGroupIngress[0];
      expect(ingress.SourceSecurityGroupId).toEqual({ 'Ref': 'ALBSecurityGroup' });
    });

    test('should create RDS security group referenced by EC2 SG', () => {
      const sg = template.Resources.RDSSecurityGroup;
      expect(sg.Type).toBe('AWS::EC2::SecurityGroup');
      expect(sg.Properties.SecurityGroupIngress[0].SourceSecurityGroupId).toEqual({ 'Ref': 'EC2SecurityGroup' });
    });
  });

  // ---------------------------
  // KMS Keys
  // ---------------------------
  describe('KMS Keys', () => {
    test('should create database KMS key with rotation', () => {
      const key = template.Resources.DatabaseKMSKey;
      expect(key.Type).toBe('AWS::KMS::Key');
      expect(key.Properties.EnableKeyRotation).toBe(true);
      expect(key.Properties.Description).toBe('KMS key for RDS database encryption');
    });

    test('should create S3 KMS key', () => {
      const key = template.Resources.S3KMSKey;
      expect(key.Type).toBe('AWS::KMS::Key');
      expect(key.Properties.EnableKeyRotation).toBe(true);
    });

    test('should create CloudWatch Logs KMS key', () => {
      const key = template.Resources.LogsKMSKey;
      expect(key.Type).toBe('AWS::KMS::Key');
      expect(key.Properties.EnableKeyRotation).toBe(true);
    });
  });

  // ---------------------------
  // S3 Buckets
  // ---------------------------
  describe('S3 Buckets', () => {
    const buckets = ['TrailLogsBucket', 'ALBLogsBucket', 'AppLogsBucket', 'ConfigBucket'];

    test('should create all required S3 buckets', () => {
      buckets.forEach(bucket => {
        expect(template.Resources[bucket]).toBeDefined();
        expect(template.Resources[bucket].Type).toBe('AWS::S3::Bucket');
      });
    });

    test('should have versioning enabled on all buckets', () => {
      buckets.forEach(bucket => {
        const bucketResource = template.Resources[bucket];
        expect(bucketResource.Properties.VersioningConfiguration.Status).toBe('Enabled');
      });
    });

    test('should have public access blocked', () => {
      buckets.forEach(bucket => {
        const bucketResource = template.Resources[bucket];
        const config = bucketResource.Properties.PublicAccessBlockConfiguration;
        expect(config.BlockPublicAcls).toBe(true);
        expect(config.BlockPublicPolicy).toBe(true);
        expect(config.IgnorePublicAcls).toBe(true);
        expect(config.RestrictPublicBuckets).toBe(true);
      });
    });

    test('bucket names should be lowercase/deterministic by account/region', () => {
      const trail = template.Resources.TrailLogsBucket.Properties.BucketName;
      const alb = template.Resources.ALBLogsBucket.Properties.BucketName;
      const app = template.Resources.AppLogsBucket.Properties.BucketName;
      const cfg = template.Resources.ConfigBucket.Properties.BucketName;

      const expectSub = (bn: any) => {
        expect(bn).toEqual({ 'Fn::Sub': expect.stringContaining('${AWS::AccountId}-${AWS::Region}-') });
      };

      expectSub(trail);
      expectSub(alb);
      expectSub(app);
      expectSub(cfg);
    });

    test('ALB logs bucket policy should allow ALB log delivery service principal', () => {
      const pol = template.Resources.ALBLogsBucketPolicy;
      expect(pol).toBeDefined();
      const statements = pol.Properties.PolicyDocument.Statement;
      const allowStmt = statements.find((s: any) => s.Sid === 'AllowALBLogDelivery');
      expect(allowStmt).toBeDefined();
      expect(allowStmt.Principal).toEqual({ Service: 'logdelivery.elasticloadbalancing.amazonaws.com' });
      expect(allowStmt.Action).toBe('s3:PutObject');
    });
  });

  // ---------------------------
  // IAM Roles
  // ---------------------------
  describe('IAM Roles', () => {
    test('should create EC2 role with SSM & CloudWatch Agent policies', () => {
      const role = template.Resources.EC2Role;
      expect(role.Type).toBe('AWS::IAM::Role');
      expect(role.Properties.ManagedPolicyArns).toContain('arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore');
      expect(role.Properties.ManagedPolicyArns).toContain('arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy');
    });

    test('should NOT include any AWS Config service roles (account already has one)', () => {
      const resourceKeys = Object.keys(template.Resources);
      // none of these should exist
      expect(resourceKeys).not.toContain('ConfigRole');
      expect(resourceKeys).not.toContain('ConfigRecorder');
      expect(resourceKeys).not.toContain('ConfigDeliveryChannel');

      // also assert no AWS::Config::* resource types exist
      const hasConfigTypes = resourceKeys.some((k) => {
        const r = template.Resources[k];
        return r.Type && String(r.Type).startsWith('AWS::Config::');
      });
      expect(hasConfigTypes).toBe(false);
    });
  });

  // ---------------------------
  // CloudWatch Logs
  // ---------------------------
  describe('CloudWatch Resources', () => {
    test('should create application log groups', () => {
      const logGroups = ['ApplicationLogGroup', 'ALBLogGroup', 'WAFLogGroup', 'CloudTrailLogGroup'];
      logGroups.forEach(lg => {
        expect(template.Resources[lg]).toBeDefined();
        expect(template.Resources[lg].Type).toBe('AWS::Logs::LogGroup');
      });
    });

    test('should have KMS encryption on log groups', () => {
      const logGroup = template.Resources.ApplicationLogGroup;
      expect(logGroup.Properties.KmsKeyId).toEqual({ 'Fn::GetAtt': ['LogsKMSKey', 'Arn'] });
    });
  });

  // ---------------------------
  // Compute Resources
  // ---------------------------
  describe('Compute Resources', () => {
    test('should create launch template with security hardening', () => {
      const lt = template.Resources.LaunchTemplate;
      expect(lt.Type).toBe('AWS::EC2::LaunchTemplate');
      expect(lt.Properties.LaunchTemplateData.MetadataOptions.HttpTokens).toBe('required');
      expect(lt.Properties.LaunchTemplateData.MetadataOptions.HttpPutResponseHopLimit).toBe(1);
    });

    test('should create auto scaling group with health checks', () => {
      const asg = template.Resources.AutoScalingGroup;
      expect(asg.Type).toBe('AWS::AutoScaling::AutoScalingGroup');
      expect(asg.Properties.HealthCheckType).toBe('ELB');
      expect(asg.Properties.HealthCheckGracePeriod).toBe(300);
    });
  });

  // ---------------------------
  // Load Balancer
  // ---------------------------
  describe('Load Balancer', () => {
    test('should create ALB with logging enabled', () => {
      const alb = template.Resources.ApplicationLoadBalancer;
      expect(alb.Type).toBe('AWS::ElasticLoadBalancingV2::LoadBalancer');
      const logAttr = alb.Properties.LoadBalancerAttributes.find(
        (attr: any) => attr.Key === 'access_logs.s3.enabled'
      );
      expect(logAttr.Value).toBe('true');

      const bucketAttr = alb.Properties.LoadBalancerAttributes.find(
        (attr: any) => attr.Key === 'access_logs.s3.bucket'
      );
      expect(bucketAttr.Value).toEqual({ Ref: 'ALBLogsBucket' });
    });

    test('should create target group with health checks', () => {
      const tg = template.Resources.TargetGroup;
      expect(tg.Type).toBe('AWS::ElasticLoadBalancingV2::TargetGroup');
      expect(tg.Properties.HealthCheckEnabled).toBe(true);
      expect(tg.Properties.HealthCheckPath).toBe('/');
    });
  });

  // ---------------------------
  // Database
  // ---------------------------
  describe('Database', () => {
    test('should create RDS with encryption and backups', () => {
      const db = template.Resources.DBInstance;
      expect(db.Type).toBe('AWS::RDS::DBInstance');
      expect(db.Properties.StorageEncrypted).toBe(true);
      expect(db.Properties.MultiAZ).toBe(true);
      expect(db.Properties.DeletionProtection).toBe(true);
      // EngineVersion is conditional and omitted when blank (region-safe)
      expect(db.Properties.EngineVersion).toEqual({
        'Fn::If': ['HasDBEngineVersion', { Ref: 'DBEngineVersion' }, { Ref: 'AWS::NoValue' }]
      });
    });

    test('should use Secrets Manager for password and exclude risky characters', () => {
      const secret = template.Resources.DBPasswordSecret;
      expect(secret.Type).toBe('AWS::SecretsManager::Secret');
      // exact heredoc-resolve form
      const db = template.Resources.DBInstance;
      expect(db.Properties.MasterUserPassword).toEqual({
        'Fn::Sub': '{{resolve:secretsmanager:${DBPasswordSecret}:SecretString:password}}'
      });

      // Tolerant check: ensure risky characters are excluded regardless of escaping style
      const excluded: string = secret.Properties.GenerateSecretString.ExcludeCharacters;
      expect(typeof excluded).toBe('string');
      const set = new Set(excluded.split(''));
      ['\\', '"', '@', '/'].forEach(ch => expect(set.has(ch)).toBe(true));
      expect(/\s/.test(excluded)).toBe(false);
    });
  });

  // ---------------------------
  // WAF
  // ---------------------------
  describe('WAF Configuration', () => {
    test('should create regional WAF without description (to avoid regex validation issues)', () => {
      const waf = template.Resources.WAFWebACL;
      expect(waf.Type).toBe('AWS::WAFv2::WebACL');
      expect(waf.Properties.Scope).toBe('REGIONAL');
      expect(waf.Properties.Description).toBeUndefined();
    });

    test('should create WAF with AWS managed rules', () => {
      const waf = template.Resources.WAFWebACL;
      const rules = waf.Properties.Rules;
      expect(Array.isArray(rules)).toBe(true);
      expect(rules.length).toBe(3);
      const names = rules.map((r: any) => r.Name).sort();
      expect(names).toEqual([
        'AWS-AWSManagedRulesCommonRuleSet',
        'AWS-AWSManagedRulesKnownBadInputsRuleSet',
        'AWS-AWSManagedRulesSQLiRuleSet'
      ].sort());
    });

    test('should associate WAF with ALB', () => {
      const assoc = template.Resources.WAFAssociation;
      expect(assoc.Type).toBe('AWS::WAFv2::WebACLAssociation');
      expect(assoc.Properties.WebACLArn).toEqual({ 'Fn::GetAtt': ['WAFWebACL', 'Arn'] });
      expect(assoc.Properties.ResourceArn).toEqual({ Ref: 'ApplicationLoadBalancer' });
    });
  });

  // ---------------------------
  // Monitoring and Alarms
  // ---------------------------
  describe('Monitoring and Alarms', () => {
    test('should create CloudWatch alarms for critical metrics', () => {
      const alarms = ['EC2StatusCheckAlarm', 'EC2HighCPUAlarm', 'TargetGroup5XXAlarm', 'DBFreeableMemoryAlarm', 'DBFreeStorageAlarm'];
      alarms.forEach(alarm => {
        expect(template.Resources[alarm]).toBeDefined();
        expect(template.Resources[alarm].Type).toBe('AWS::CloudWatch::Alarm');
      });
    });
  });

  // ---------------------------
  // Security Services
  // ---------------------------
  describe('Security Services', () => {
    test('should enable CloudTrail with encryption and CW logs', () => {
      const trail = template.Resources.CloudTrail;
      expect(trail.Type).toBe('AWS::CloudTrail::Trail');
      expect(trail.Properties.IsLogging).toBe(true);
      expect(trail.Properties.EnableLogFileValidation).toBe(true);
      expect(trail.Properties.CloudWatchLogsLogGroupArn).toEqual({ 'Fn::GetAtt': ['CloudTrailLogGroup', 'Arn'] });
      expect(trail.Properties.CloudWatchLogsRoleArn).toEqual({ 'Fn::GetAtt': ['CloudTrailLogStreamRole', 'Arn'] });
      expect(trail.Properties.KMSKeyId).toEqual({ Ref: 'S3KMSKey' });
    });

    test('should NOT include GuardDuty in this template (optional service)', () => {
      expect(template.Resources.GuardDutyDetector).toBeUndefined();
    });
  });

  // ---------------------------
  // Outputs
  // ---------------------------
  describe('Output Validation', () => {
    test('should have all critical outputs', () => {
      const requiredOutputs = [
        'VPCId', 'ALBDNSName', 'DatabaseEndpoint', 'TrailLogsBucketName',
        'ALBLogsBucketName', 'ApplicationLogGroupName', 'DatabaseKMSKeyArn'
      ];
      requiredOutputs.forEach(output => {
        expect(template.Outputs[output]).toBeDefined();
      });
    });

    test('CloudFront output should be conditional on CreateCloudFront', () => {
      const out = template.Outputs.CloudFrontDistributionDomainName;
      expect(out).toBeDefined();
      expect(out.Condition).toBe('CreateCloudFront');
    });
  });

  // ---------------------------
  // Resource Naming & Completeness
  // ---------------------------
  describe('Resource Naming', () => {
    test('resources should use stack name in Name tags where present', () => {
      const resources = ['VPC', 'ALBSecurityGroup', 'EC2SecurityGroup', 'RDSSecurityGroup'];
      resources.forEach(resource => {
        const r = template.Resources[resource];
        const tags = r?.Properties?.Tags;
        if (tags) {
          const nameTag = tags.find((tag: any) => tag.Key === 'Name');
          expect(nameTag.Value).toEqual({ 'Fn::Sub': expect.stringContaining('${AWS::StackName}') });
        }
      });
    });
  });

  describe('Template Completeness', () => {
    test('should have a substantial number of resources', () => {
      const resourceCount = Object.keys(template.Resources).length;
      expect(resourceCount).toBeGreaterThan(50); // robust threshold for this infra
    });

    test('should have comprehensive parameter coverage', () => {
      const paramCount = Object.keys(template.Parameters).length;
      expect(paramCount).toBe(16);
    });

    test('should have many outputs', () => {
      const outputCount = Object.keys(template.Outputs).length;
      expect(outputCount).toBeGreaterThanOrEqual(20);
    });
  });
});
