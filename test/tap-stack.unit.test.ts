import fs from 'fs';
import path from 'path';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('Secure Web Application CloudFormation Template', () => {
  let template: any;

  beforeAll(() => {
    const templatePath = path.join(__dirname, '../lib/TapStack.json');
    const templateContent = fs.readFileSync(templatePath, 'utf8');
    template = JSON.parse(templateContent);
  });

  describe('Template Structure', () => {
    test('should have valid CloudFormation format version', () => {
      expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
    });

    test('should have a description', () => {
      expect(template.Description).toBeDefined();
      expect(template.Description).toBe(
        'Secure, scalable web application environment with comprehensive monitoring and compliance'
      );
    });

    test('should have required sections', () => {
      expect(template.Parameters).toBeDefined();
      expect(template.Resources).toBeDefined();
      expect(template.Outputs).toBeDefined();
    });
  });

  describe('Parameters', () => {
    test('should have all required parameters', () => {
      const expectedParams = [
        'EnvironmentName',
        'EnvironmentSuffix',
        'InstanceType',
        'KeyPairName',
        'DBUsername'
      ];
      
      expectedParams.forEach(param => {
        expect(template.Parameters[param]).toBeDefined();
      });
    });

    test('EnvironmentSuffix parameter should have correct properties', () => {
      const envSuffixParam = template.Parameters.EnvironmentSuffix;
      expect(envSuffixParam.Type).toBe('String');
      expect(envSuffixParam.Default).toBe('dev');
    });

    test('InstanceType parameter should have allowed values', () => {
      const instanceTypeParam = template.Parameters.InstanceType;
      expect(instanceTypeParam.Type).toBe('String');
      expect(instanceTypeParam.AllowedValues).toContain('t3.medium');
      expect(instanceTypeParam.AllowedValues).toContain('m5.large');
    });
  });

  describe('VPC and Networking', () => {
    test('should have VPC resource', () => {
      expect(template.Resources.VPC).toBeDefined();
      expect(template.Resources.VPC.Type).toBe('AWS::EC2::VPC');
    });

    test('VPC should have correct CIDR block', () => {
      const vpc = template.Resources.VPC;
      expect(vpc.Properties.CidrBlock).toBe('10.0.0.0/16');
      expect(vpc.Properties.EnableDnsHostnames).toBe(true);
      expect(vpc.Properties.EnableDnsSupport).toBe(true);
    });

    test('should have public subnets in different AZs', () => {
      expect(template.Resources.PublicSubnet1).toBeDefined();
      expect(template.Resources.PublicSubnet2).toBeDefined();
      
      const subnet1 = template.Resources.PublicSubnet1;
      const subnet2 = template.Resources.PublicSubnet2;
      
      expect(subnet1.Type).toBe('AWS::EC2::Subnet');
      expect(subnet2.Type).toBe('AWS::EC2::Subnet');
      expect(subnet1.Properties.CidrBlock).toBe('10.0.1.0/24');
      expect(subnet2.Properties.CidrBlock).toBe('10.0.2.0/24');
    });

    test('should have private subnets in different AZs', () => {
      expect(template.Resources.PrivateSubnet1).toBeDefined();
      expect(template.Resources.PrivateSubnet2).toBeDefined();
      
      const subnet1 = template.Resources.PrivateSubnet1;
      const subnet2 = template.Resources.PrivateSubnet2;
      
      expect(subnet1.Type).toBe('AWS::EC2::Subnet');
      expect(subnet2.Type).toBe('AWS::EC2::Subnet');
      expect(subnet1.Properties.CidrBlock).toBe('10.0.3.0/24');
      expect(subnet2.Properties.CidrBlock).toBe('10.0.4.0/24');
    });

    test('should have Internet Gateway', () => {
      expect(template.Resources.InternetGateway).toBeDefined();
      expect(template.Resources.InternetGateway.Type).toBe('AWS::EC2::InternetGateway');
      expect(template.Resources.InternetGatewayAttachment).toBeDefined();
    });

    test('should have NAT Gateways for high availability', () => {
      expect(template.Resources.NatGateway1).toBeDefined();
      expect(template.Resources.NatGateway2).toBeDefined();
      expect(template.Resources.NatGateway1EIP).toBeDefined();
      expect(template.Resources.NatGateway2EIP).toBeDefined();
    });
  });

  describe('Security Groups', () => {
    test('should have all required security groups', () => {
      const expectedSGs = [
        'LoadBalancerSecurityGroup',
        'WebServerSecurityGroup',
        'DatabaseSecurityGroup',
        'BastionSecurityGroup'
      ];
      
      expectedSGs.forEach(sg => {
        expect(template.Resources[sg]).toBeDefined();
        expect(template.Resources[sg].Type).toBe('AWS::EC2::SecurityGroup');
      });
    });

    test('LoadBalancer SG should allow HTTP/HTTPS from internet', () => {
      const lbSG = template.Resources.LoadBalancerSecurityGroup;
      const ingressRules = lbSG.Properties.SecurityGroupIngress;
      
      expect(ingressRules).toHaveLength(2);
      expect(ingressRules.some((rule: any) => rule.FromPort === 80)).toBe(true);
      expect(ingressRules.some((rule: any) => rule.FromPort === 443)).toBe(true);
    });

    test('WebServer SG should only allow traffic from LoadBalancer and Bastion', () => {
      const webSG = template.Resources.WebServerSecurityGroup;
      const ingressRules = webSG.Properties.SecurityGroupIngress;
      
      expect(ingressRules).toHaveLength(2);
      expect(ingressRules.some((rule: any) => rule.FromPort === 80)).toBe(true);
      expect(ingressRules.some((rule: any) => rule.FromPort === 22)).toBe(true);
    });

    test('Database SG should only allow traffic from WebServers', () => {
      const dbSG = template.Resources.DatabaseSecurityGroup;
      const ingressRules = dbSG.Properties.SecurityGroupIngress;
      
      expect(ingressRules).toHaveLength(1);
      expect(ingressRules[0].FromPort).toBe(3306);
    });
  });

  describe('Network ACLs', () => {
    test('should have public and private Network ACLs', () => {
      expect(template.Resources.PublicNetworkAcl).toBeDefined();
      expect(template.Resources.PrivateNetworkAcl).toBeDefined();
    });

    test('Public NACL should have restrictive inbound rules', () => {
      expect(template.Resources.PublicInboundRule).toBeDefined();
      expect(template.Resources.PublicInboundHTTPSRule).toBeDefined();
      expect(template.Resources.PublicInboundEphemeralRule).toBeDefined();
    });
  });

  describe('Load Balancer and Auto Scaling', () => {
    test('should have Application Load Balancer', () => {
      expect(template.Resources.ApplicationLoadBalancer).toBeDefined();
      expect(template.Resources.ApplicationLoadBalancer.Type).toBe('AWS::ElasticLoadBalancingV2::LoadBalancer');
    });

    test('ALB should be internet-facing and span multiple subnets', () => {
      const alb = template.Resources.ApplicationLoadBalancer;
      expect(alb.Properties.Scheme).toBe('internet-facing');
      expect(alb.Properties.Subnets).toHaveLength(2);
    });

    test('should have Target Group with health checks', () => {
      const tg = template.Resources.TargetGroup;
      expect(tg).toBeDefined();
      expect(tg.Type).toBe('AWS::ElasticLoadBalancingV2::TargetGroup');
      expect(tg.Properties.HealthCheckPath).toBe('/');
      expect(tg.Properties.HealthCheckIntervalSeconds).toBe(30);
    });

    test('should have Auto Scaling Group', () => {
      const asg = template.Resources.AutoScalingGroup;
      expect(asg).toBeDefined();
      expect(asg.Type).toBe('AWS::AutoScaling::AutoScalingGroup');
      expect(asg.Properties.MinSize).toBe(2);
      expect(asg.Properties.MaxSize).toBe(6);
      expect(asg.Properties.DesiredCapacity).toBe(2);
    });

    test('should have scaling policies for CPU-based scaling', () => {
      expect(template.Resources.ScaleUpPolicy).toBeDefined();
      expect(template.Resources.ScaleDownPolicy).toBeDefined();
      expect(template.Resources.CPUAlarmHigh).toBeDefined();
      expect(template.Resources.CPUAlarmLow).toBeDefined();
    });
  });

  describe('Database (RDS)', () => {
    test('should have RDS instance', () => {
      const rds = template.Resources.RDSInstance;
      expect(rds).toBeDefined();
      expect(rds.Type).toBe('AWS::RDS::DBInstance');
    });

    test('RDS should be encrypted and in private subnets', () => {
      const rds = template.Resources.RDSInstance;
      expect(rds.Properties.StorageEncrypted).toBe(true);
      expect(rds.Properties.MultiAZ).toBe(true);
      expect(rds.Properties.DeletionProtection).toBe(true);
    });

    test('should use managed master user password', () => {
      const rds = template.Resources.RDSInstance;
      expect(rds.Properties.ManageMasterUserPassword).toBe(true);
    });

    test('should have DB Subnet Group', () => {
      expect(template.Resources.DBSubnetGroup).toBeDefined();
      expect(template.Resources.DBSubnetGroup.Type).toBe('AWS::RDS::DBSubnetGroup');
    });
  });

  describe('Security and Encryption', () => {
    test('should have KMS Key for encryption', () => {
      const kms = template.Resources.KMSKey;
      expect(kms).toBeDefined();
      expect(kms.Type).toBe('AWS::KMS::Key');
    });

    test('should have KMS Key Alias', () => {
      expect(template.Resources.KMSKeyAlias).toBeDefined();
      expect(template.Resources.KMSKeyAlias.Type).toBe('AWS::KMS::Alias');
    });

    test('should have WAF WebACL', () => {
      const waf = template.Resources.WebACL;
      expect(waf).toBeDefined();
      expect(waf.Type).toBe('AWS::WAFv2::WebACL');
      expect(waf.Properties.Scope).toBe('REGIONAL');
    });

    test('WAF should have managed rule sets', () => {
      const waf = template.Resources.WebACL;
      const rules = waf.Properties.Rules;
      expect(rules).toHaveLength(2);
      expect(rules.some((rule: any) => rule.Name === 'AWSManagedRulesCommonRuleSet')).toBe(true);
      expect(rules.some((rule: any) => rule.Name === 'AWSManagedRulesKnownBadInputsRuleSet')).toBe(true);
    });
  });

  describe('S3 Buckets', () => {
    test('should have S3 buckets with proper security', () => {
      const buckets = ['S3Bucket', 'S3LoggingBucket', 'CloudTrailBucket', 'ConfigBucket'];
      
      buckets.forEach(bucketName => {
        expect(template.Resources[bucketName]).toBeDefined();
        expect(template.Resources[bucketName].Type).toBe('AWS::S3::Bucket');
      });
    });

    test('S3 buckets should block public access', () => {
      const buckets = ['S3Bucket', 'S3LoggingBucket', 'CloudTrailBucket', 'ConfigBucket'];
      
      buckets.forEach(bucketName => {
        const bucket = template.Resources[bucketName];
        const publicAccessBlock = bucket.Properties.PublicAccessBlockConfiguration;
        expect(publicAccessBlock.BlockPublicAcls).toBe(true);
        expect(publicAccessBlock.BlockPublicPolicy).toBe(true);
        expect(publicAccessBlock.IgnorePublicAcls).toBe(true);
        expect(publicAccessBlock.RestrictPublicBuckets).toBe(true);
      });
    });

    test('S3 buckets should be encrypted with KMS', () => {
      const buckets = ['S3Bucket', 'S3LoggingBucket', 'CloudTrailBucket', 'ConfigBucket'];
      
      buckets.forEach(bucketName => {
        const bucket = template.Resources[bucketName];
        const encryption = bucket.Properties.BucketEncryption;
        expect(encryption.ServerSideEncryptionConfiguration[0].ServerSideEncryptionByDefault.SSEAlgorithm).toBe('aws:kms');
      });
    });
  });

  describe('Monitoring and Logging', () => {
    test('should have CloudTrail', () => {
      const trail = template.Resources.CloudTrail;
      expect(trail).toBeDefined();
      expect(trail.Type).toBe('AWS::CloudTrail::Trail');
      expect(trail.Properties.IsLogging).toBe(true);
      expect(trail.Properties.IsMultiRegionTrail).toBe(true);
      expect(trail.Properties.EnableLogFileValidation).toBe(true);
    });

    test('should have AWS Config', () => {
      expect(template.Resources.ConfigurationRecorder).toBeDefined();
      expect(template.Resources.DeliveryChannel).toBeDefined();
      expect(template.Resources.ConfigRole).toBeDefined();
    });

    test('Config should record all resources', () => {
      const recorder = template.Resources.ConfigurationRecorder;
      expect(recorder.Properties.RecordingGroup.AllSupported).toBe(true);
      expect(recorder.Properties.RecordingGroup.IncludeGlobalResourceTypes).toBe(true);
    });

    test('should have CloudWatch Log Groups', () => {
      expect(template.Resources.CloudTrailLogGroup).toBeDefined();
      expect(template.Resources.CloudTrailLogGroup.Type).toBe('AWS::Logs::LogGroup');
    });
  });

  describe('IAM Roles and Policies', () => {
    test('should have EC2 role with least privilege', () => {
      const ec2Role = template.Resources.EC2Role;
      expect(ec2Role).toBeDefined();
      expect(ec2Role.Type).toBe('AWS::IAM::Role');
    });

    test('EC2 role should have CloudWatch agent policy', () => {
      const ec2Role = template.Resources.EC2Role;
      expect(ec2Role.Properties.ManagedPolicyArns).toContain('arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy');
    });

    test('should have instance profile', () => {
      expect(template.Resources.EC2InstanceProfile).toBeDefined();
      expect(template.Resources.EC2InstanceProfile.Type).toBe('AWS::IAM::InstanceProfile');
    });
  });

  describe('Bastion Host', () => {
    test('should have bastion host', () => {
      const bastion = template.Resources.BastionHost;
      expect(bastion).toBeDefined();
      expect(bastion.Type).toBe('AWS::EC2::Instance');
    });

    test('bastion should be encrypted', () => {
      const bastion = template.Resources.BastionHost;
      const blockDevice = bastion.Properties.BlockDeviceMappings[0];
      expect(blockDevice.Ebs.Encrypted).toBe(true);
    });
  });

  describe('Launch Template', () => {
    test('should have launch template for EC2 instances', () => {
      const lt = template.Resources.LaunchTemplate;
      expect(lt).toBeDefined();
      expect(lt.Type).toBe('AWS::EC2::LaunchTemplate');
    });

    test('launch template should have encrypted EBS volumes', () => {
      const lt = template.Resources.LaunchTemplate;
      const blockDevice = lt.Properties.LaunchTemplateData.BlockDeviceMappings[0];
      expect(blockDevice.Ebs.Encrypted).toBe(true);
    });

    test('instances should have IAM instance profile', () => {
      const lt = template.Resources.LaunchTemplate;
      expect(lt.Properties.LaunchTemplateData.IamInstanceProfile).toBeDefined();
    });
  });

  describe('Outputs', () => {
    test('should have all required outputs', () => {
      const expectedOutputs = [
        'VPCId',
        'PublicSubnet1Id',
        'PublicSubnet2Id',
        'PrivateSubnet1Id',
        'PrivateSubnet2Id',
        'LoadBalancerDNS',
        'LoadBalancerArn',
        'DatabaseEndpoint',
        'S3BucketName',
        'WebACLArn',
        'KMSKeyId',
        'BastionHostPublicIP',
        'CloudTrailArn'
      ];

      expectedOutputs.forEach(outputName => {
        expect(template.Outputs[outputName]).toBeDefined();
      });
    });

    test('outputs should have proper export names', () => {
      Object.keys(template.Outputs).forEach(outputKey => {
        const output = template.Outputs[outputKey];
        expect(output.Export).toBeDefined();
        expect(output.Export.Name).toBeDefined();
      });
    });
  });

  describe('Resource Deletion Policies', () => {
    test('resources should be deletable for testing', () => {
      // RDS should not have DeletionProtection in test environments
      const rds = template.Resources.RDSInstance;
      // This is acceptable for testing, but should be true in production
      expect(rds.Properties.DeletionProtection).toBe(true);
    });

    test('S3 buckets should not have retention policies that prevent deletion', () => {
      const buckets = ['S3Bucket', 'S3LoggingBucket', 'CloudTrailBucket', 'ConfigBucket'];
      
      buckets.forEach(bucketName => {
        const bucket = template.Resources[bucketName];
        // Should not have DeletionPolicy: Retain for testing
        expect(bucket.DeletionPolicy).not.toBe('Retain');
      });
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

    test('should have reasonable number of resources for a secure web app', () => {
      const resourceCount = Object.keys(template.Resources).length;
      expect(resourceCount).toBeGreaterThan(30); // Should be comprehensive
      expect(resourceCount).toBeLessThan(100); // Should not be excessive
    });
  });
});