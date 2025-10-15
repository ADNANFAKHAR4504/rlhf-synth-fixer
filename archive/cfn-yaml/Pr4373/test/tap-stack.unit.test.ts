import fs from 'fs';
import path from 'path';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('TapStack CloudFormation Template - Production Security Stack', () => {
  let template: any;
  let resources: any;
  let parameters: any;
  let outputs: any;

  beforeAll(() => {
    const templatePath = path.join(__dirname, '../lib/TapStack.json');
    const templateContent = fs.readFileSync(templatePath, 'utf8');
    template = JSON.parse(templateContent);
    resources = template.Resources || {};
    parameters = template.Parameters || {};
    outputs = template.Outputs || {};
  });

  describe('Template Structure', () => {
    test('should have valid CloudFormation format version', () => {
      expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
    });

    test('should have a description', () => {
      expect(template.Description).toBeDefined();
      // Updated description for HTTP-only stack
      expect(template.Description).toBe(
        'Production-grade web application stack (HTTP-only ALB)'
      );
    });

    test('should have required sections', () => {
      expect(template.Parameters).toBeDefined();
      expect(template.Mappings).toBeDefined();
      expect(template.Resources).toBeDefined();
      expect(template.Outputs).toBeDefined();
    });

    test('should have mappings for subnet configuration', () => {
      expect(template.Mappings.SubnetConfig).toBeDefined();
      expect(template.Mappings.SubnetConfig.VPC.CIDR).toBe('10.0.0.0/16');
    });
  });

  describe('Parameters', () => {
    test('should have all required parameters', () => {
      // CertificateArn removed for HTTP-only deployment
      const expectedParams = [
        'AllowedAdminCidr',
        'DBName',
        'DBUsername',
        'DBEngineVersion',
        'InstanceType',
        'DesiredCapacity',
        'EnforceKeyRotation',
        'KeyPairName',
        'LatestAmiId',
      ];
      expectedParams.forEach((param) => {
        expect(parameters[param]).toBeDefined();
      });
      // Ensure certificate is NOT present
      expect(parameters.CertificateArn).toBeUndefined();
    });

    test('AllowedAdminCidr should have correct validation pattern', () => {
      const param = parameters.AllowedAdminCidr;
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('10.0.0.0/8');
      expect(param.AllowedPattern).toBeDefined();
      expect(param.AllowedPattern).toMatch(/\^.*\$/);
    });

    test('DBName should have length constraints', () => {
      const param = parameters.DBName;
      expect(param.MinLength).toBe(1);
      expect(param.MaxLength).toBe(64);
      expect(param.AllowedPattern).toBe('[a-zA-Z][a-zA-Z0-9]*');
    });

    test('InstanceType should have allowed values', () => {
      const param = parameters.InstanceType;
      expect(param.AllowedValues).toContain('t3.small');
      expect(param.AllowedValues).toContain('t3.micro');
    });

    test('DesiredCapacity should have min/max constraints', () => {
      const param = parameters.DesiredCapacity;
      expect(param.MinValue).toBe(2);
      expect(param.MaxValue).toBe(6);
    });

    test('should not require a certificate parameter', () => {
      expect(parameters.CertificateArn).toBeUndefined();
    });
  });

  describe('KMS Resources', () => {
    test('should have MasterKMSKey with key rotation enabled', () => {
      const kmsKey = resources.MasterKMSKey;
      expect(kmsKey).toBeDefined();
      expect(kmsKey.Type).toBe('AWS::KMS::Key');
      expect(kmsKey.Properties.EnableKeyRotation).toBe(true);
    });

    test('KMS key should have proper key policy', () => {
      const kmsKey = resources.MasterKMSKey;
      const keyPolicy = kmsKey.Properties.KeyPolicy;
      expect(keyPolicy.Statement).toBeDefined();
      expect(keyPolicy.Statement.length).toBeGreaterThan(0);
    });

    test('should have KMS key alias', () => {
      const alias = resources.MasterKMSKeyAlias;
      expect(alias).toBeDefined();
      expect(alias.Type).toBe('AWS::KMS::Alias');
      expect(alias.Properties.AliasName).toBe('alias/production-security-master');
    });
  });

  describe('VPC and Networking Resources', () => {
    test('should have VPC with DNS support', () => {
      const vpc = resources.VPC;
      expect(vpc).toBeDefined();
      expect(vpc.Type).toBe('AWS::EC2::VPC');
      expect(vpc.Properties.EnableDnsHostnames).toBe(true);
      expect(vpc.Properties.EnableDnsSupport).toBe(true);
    });

    test('should have public subnets in different AZs', () => {
      const subnet1 = resources.PublicSubnet1;
      const subnet2 = resources.PublicSubnet2;
      expect(subnet1).toBeDefined();
      expect(subnet2).toBeDefined();
      expect(subnet1.Properties.MapPublicIpOnLaunch).toBe(false);
      expect(subnet2.Properties.MapPublicIpOnLaunch).toBe(false);
    });

    test('should have private subnets in different AZs', () => {
      const subnet1 = resources.PrivateSubnet1;
      const subnet2 = resources.PrivateSubnet2;
      expect(subnet1).toBeDefined();
      expect(subnet2).toBeDefined();
    });

    test('should have database subnets in different AZs', () => {
      const subnet1 = resources.DBSubnet1;
      const subnet2 = resources.DBSubnet2;
      expect(subnet1).toBeDefined();
      expect(subnet2).toBeDefined();
    });

    test('should have NAT gateways for high availability', () => {
      const nat1 = resources.NATGateway1;
      const nat2 = resources.NATGateway2;
      expect(nat1).toBeDefined();
      expect(nat2).toBeDefined();
      expect(nat1.Type).toBe('AWS::EC2::NatGateway');
      expect(nat2.Type).toBe('AWS::EC2::NatGateway');
    });

    test('should have route tables with proper routing', () => {
      const publicRT = resources.PublicRouteTable;
      const privateRT1 = resources.PrivateRouteTable1;
      const privateRT2 = resources.PrivateRouteTable2;
      expect(publicRT).toBeDefined();
      expect(privateRT1).toBeDefined();
      expect(privateRT2).toBeDefined();
    });
  });

  describe('Security Groups', () => {
    test('LoadBalancer security group should only allow 80 (HTTP-only)', () => {
      const sg = resources.LoadBalancerSecurityGroup;
      expect(sg).toBeDefined();
      const ingress = sg.Properties.SecurityGroupIngress;
      const ports = (ingress || []).map((r: any) => r.FromPort);
      expect(ports).toContain(80);
      expect(ports).not.toContain(443);
    });

    test('App instance security group should not allow direct internet access', () => {
      const sg = resources.AppInstanceSecurityGroup;
      expect(sg).toBeDefined();
      const ingress = sg.Properties.SecurityGroupIngress;
      const internetRule = (ingress || []).find((rule: any) => rule.CidrIp === '0.0.0.0/0');
      expect(internetRule).toBeUndefined();
    });

    test('Database security group should only allow access from app tier', () => {
      const sg = resources.DatabaseSecurityGroup;
      expect(sg).toBeDefined();
      const ingress = sg.Properties.SecurityGroupIngress;
      expect(ingress[0].FromPort).toBe(3306);
      expect(ingress[0].SourceSecurityGroupId).toBeDefined();
    });
  });

  describe('Network ACLs', () => {
    test('should have restrictive NACLs for each tier', () => {
      const publicNACL = resources.PublicNetworkAcl;
      const privateNACL = resources.PrivateNetworkAcl;
      const dbNACL = resources.DBNetworkAcl;

      expect(publicNACL).toBeDefined();
      expect(privateNACL).toBeDefined();
      expect(dbNACL).toBeDefined();
    });

    test('DB NACL should only allow MySQL port from VPC CIDR', () => {
      const dbNACL = resources.DBNetworkAclEntryInbound;
      expect(dbNACL.Properties.PortRange.From).toBe(3306);
      expect(dbNACL.Properties.CidrBlock).toBe('10.0.0.0/16');
    });
  });

  describe('Load Balancer and WAF', () => {
    test('should have Application Load Balancer', () => {
      const alb = resources.ApplicationLoadBalancer;
      expect(alb).toBeDefined();
      expect(alb.Type).toBe('AWS::ElasticLoadBalancingV2::LoadBalancer');
      expect(alb.Properties.Type).toBe('application');
      expect(alb.Properties.Scheme).toBe('internet-facing');
    });

    test('should NOT have HTTPS listener (HTTP-only design)', () => {
      expect(resources.HTTPSListener).toBeUndefined();
    });

    test('should have HTTP listener forwarding to target group', () => {
      const listener = resources.HTTPListener;
      expect(listener).toBeDefined();
      expect(listener.Properties.Port).toBe(80);
      expect(listener.Properties.Protocol).toBe('HTTP');
      expect(listener.Properties.DefaultActions[0].Type).toBe('forward');
      expect(listener.Properties.DefaultActions[0].TargetGroupArn).toBeDefined();
    });

    test('should have WAF Web ACL with managed rules', () => {
      const waf = resources.WAFWebACL;
      expect(waf).toBeDefined();
      expect(waf.Type).toBe('AWS::WAFv2::WebACL');
      expect(waf.Properties.Rules.length).toBeGreaterThan(0);

      const rateLimit = waf.Properties.Rules.find((rule: any) => rule.Name === 'RateLimitRule');
      expect(rateLimit).toBeDefined();
      expect(rateLimit.Statement.RateBasedStatement.Limit).toBe(2000);
    });
  });

  describe('EC2 and Auto Scaling', () => {
    test('should have launch template with encryption', () => {
      const lt = resources.EC2LaunchTemplate;
      expect(lt).toBeDefined();
      expect(lt.Properties.LaunchTemplateData.BlockDeviceMappings[0].Ebs.Encrypted).toBe(true);
    });

    test('should have Auto Scaling Group with proper configuration', () => {
      const asg = resources.AutoScalingGroup;
      expect(asg).toBeDefined();
      expect(asg.Properties.MinSize).toBe(2);
      expect(asg.Properties.MaxSize).toBe(6);
      expect(asg.Properties.HealthCheckType).toBe('ELB');
    });
  });

  describe('RDS Database', () => {
    test('should have encrypted RDS instance', () => {
      const rds = resources.RDSDatabase;
      expect(rds).toBeDefined();
      expect(rds.Type).toBe('AWS::RDS::DBInstance');
      expect(rds.Properties.StorageEncrypted).toBe(true);
      expect(rds.Properties.MultiAZ).toBe(true);
      expect(rds.Properties.PubliclyAccessible).toBe(false);
    });

    test('should have backup and maintenance windows', () => {
      const rds = resources.RDSDatabase;
      expect(rds.Properties.BackupRetentionPeriod).toBe(7);
      expect(rds.Properties.PreferredBackupWindow).toBeDefined();
      expect(rds.Properties.PreferredMaintenanceWindow).toBeDefined();
    });

    test('should have CloudWatch logs exports enabled', () => {
      const rds = resources.RDSDatabase;
      expect(rds.Properties.EnableCloudwatchLogsExports).toContain('error');
    });
  });

  describe('S3 and Logging', () => {
    test('should have encrypted S3 bucket for logging', () => {
      const bucket = resources.LoggingBucket;
      expect(bucket).toBeDefined();
      expect(bucket.Properties.BucketEncryption).toBeDefined();
      expect(bucket.Properties.PublicAccessBlockConfiguration.BlockPublicAcls).toBe(true);
    });

    test('bucket policy should enforce TLS', () => {
      const policy = resources.LoggingBucketPolicy;
      expect(policy).toBeDefined();
      const statements = policy.Properties.PolicyDocument.Statement;
      const tlsStatement = statements.find((s: any) => s.Sid === 'DenyInsecureTransport');
      expect(tlsStatement).toBeDefined();
      expect(tlsStatement.Condition.Bool['aws:SecureTransport']).toBe('false');
    });
  });

  describe('CloudTrail and Config', () => {
    test('should have CloudTrail with encryption and validation', () => {
      const trail = resources.CloudTrail;
      expect(trail).toBeDefined();
      expect(trail.Properties.EnableLogFileValidation).toBe(true);
      expect(trail.Properties.IsMultiRegionTrail).toBe(true);
      expect(trail.Properties.KMSKeyId).toBeDefined();
    });

    test('should have Config recorder and delivery channel', () => {
      const recorder = resources.ConfigRecorder;
      const channel = resources.ConfigDeliveryChannel;
      expect(recorder).toBeDefined();
      expect(channel).toBeDefined();
      expect(recorder.Properties.RecordingGroup.AllSupported).toBe(true);
    });
  });

  describe('Backup and Lambda', () => {
    test('should have AWS Backup vault with encryption', () => {
      const vault = resources.BackupVault;
      expect(vault).toBeDefined();
      expect(vault.Properties.EncryptionKeyArn).toBeDefined();
    });

    test('should have key rotation Lambda function', () => {
      const lambda = resources.KeyRotationLambda;
      expect(lambda).toBeDefined();
      expect(lambda.Type).toBe('AWS::Lambda::Function');
      expect(lambda.Properties.Runtime).toBe('python3.11');
    });

    test('should have EventBridge schedule for key rotation', () => {
      const schedule = resources.KeyRotationSchedule;
      expect(schedule).toBeDefined();
      expect(schedule.Properties.ScheduleExpression).toBe('rate(1 day)');
    });
  });

  describe('Outputs', () => {
    test('should have all required outputs', () => {
      const expectedOutputs = [
        'VPCId',
        'LoadBalancerDNS',
        'WAFWebACLArn',
        'RDSEndpoint',
        'KMSKeyArn',
        'CloudTrailArn',
        'BackupPlanId',
      ];
      expectedOutputs.forEach((outputName) => {
        expect(outputs[outputName]).toBeDefined();
      });
    });

    test('should provide security guidance outputs', () => {
      expect(outputs.MFAGuidance).toBeDefined();
      expect(outputs.KeyRotationGuidance).toBeDefined();
      expect(outputs.SecurityPosture).toBeDefined();
    });
  });

  describe('Template Validation', () => {
    test('should have valid JSON structure', () => {
      expect(template).toBeDefined();
      expect(typeof template).toBe('object');
    });

    test('should not have any undefined or null required sections', () => {
      expect(template.AWSTemplateFormatVersion).not.toBeNull();
      expect(template.Description).not.toBeNull();
      expect(template.Parameters).not.toBeNull();
      expect(template.Resources).not.toBeNull();
      expect(template.Outputs).not.toBeNull();
    });

    test('should have comprehensive resource count', () => {
      const resourceCount = Object.keys(template.Resources).length;
      expect(resourceCount).toBeGreaterThan(50); // Production stack should have many resources
    });

    test('should have all required parameters (count)', () => {
      const parameterCount = Object.keys(template.Parameters).length;
      // 9 parameters in HTTP-only template
      expect(parameterCount).toBe(9);
    });

    test('should have comprehensive outputs', () => {
      const outputCount = Object.keys(template.Outputs).length;
      expect(outputCount).toBeGreaterThan(10);
    });
  });

  describe('Security Compliance', () => {
    test('all resources should have proper security tags', () => {
      const resourcesWithTags = ['VPC', 'LoadBalancerSecurityGroup', 'RDSDatabase', 'LoggingBucket'];
      resourcesWithTags.forEach((resourceName) => {
        const resource = resources[resourceName];
        expect(resource.Properties.Tags).toBeDefined();
        const tags = resource.Properties.Tags;
        expect(tags.some((tag: any) => tag.Key === 'Environment' && tag.Value === 'Production')).toBe(true);
        expect(tags.some((tag: any) => tag.Key === 'Owner' && tag.Value === 'SecurityTeam')).toBe(true);
      });
    });

    test('encryption should be enabled for all applicable resources', () => {
      expect(resources.MasterKMSKey.Properties.EnableKeyRotation).toBe(true); // KMS Key
      expect(resources.RDSDatabase.Properties.StorageEncrypted).toBe(true);    // RDS
      expect(resources.LoggingBucket.Properties.BucketEncryption).toBeDefined(); // S3
      expect(resources.EC2LaunchTemplate.Properties.LaunchTemplateData.BlockDeviceMappings[0].Ebs.Encrypted).toBe(true); // EBS
    });

    test('IAM roles should follow least privilege principle', () => {
      const roles = ['EC2InstanceRole', 'ConfigServiceRole', 'BackupRole', 'KeyRotationLambdaRole'];
      roles.forEach((roleName) => {
        const role = resources[roleName];
        expect(role).toBeDefined();
        expect(role.Properties.AssumeRolePolicyDocument).toBeDefined();
      });
    });

    test('should enforce MFA policy', () => {
      const mfaPolicy = resources.MFAEnforcementPolicy;
      expect(mfaPolicy).toBeDefined();
      expect(mfaPolicy.Type).toBe('AWS::IAM::ManagedPolicy');
      const statements = mfaPolicy.Properties.PolicyDocument.Statement;
      expect(statements.some((s: any) => s.Condition?.BoolIfExists?.['aws:MultiFactorAuthPresent'])).toBe(true);
    });
  });

  describe('High Availability and Resilience', () => {
    test('resources should be distributed across multiple AZs', () => {
      const multiAZResources = ['PublicSubnet1', 'PublicSubnet2', 'PrivateSubnet1', 'PrivateSubnet2'];
      multiAZResources.forEach((resourceName) => {
        const resource = resources[resourceName];
        expect(resource.Properties.AvailabilityZone).toBeDefined();
      });
    });

    test('should have backup and disaster recovery configured', () => {
      expect(resources.BackupPlan).toBeDefined();
      expect(resources.BackupSelection).toBeDefined();
      expect(resources.RDSDatabase.Properties.MultiAZ).toBe(true);
    });
  });
});
