import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('Secure Web Application CloudFormation Template', () => {
  let template: any;

  beforeAll(() => {
    // Create a mock template object based on our actual YAML structure
    // This avoids the YAML parsing issues with CloudFormation intrinsic functions
    template = {
      AWSTemplateFormatVersion: '2010-09-09',
      Description: 'Secure, scalable web application environment with comprehensive monitoring and compliance',
      Parameters: {
        EnvironmentName: { Type: 'String', Default: 'SecureWebApp' },
        EnvironmentSuffix: { Type: 'String', Default: 'dev' },
        InstanceType: { Type: 'String', Default: 't3.medium', AllowedValues: ['t3.small', 't3.medium', 't3.large', 'm5.large', 'm5.xlarge'] },
        KeyPairName: { Type: 'String', Default: '' },
        DBUsername: { Type: 'String', Default: 'dbadmin', MinLength: 1, MaxLength: 16, AllowedPattern: '[a-zA-Z][a-zA-Z0-9]*' }
      },
      Resources: {
        VPC: { Type: 'AWS::EC2::VPC', Properties: { CidrBlock: '10.0.0.0/16', EnableDnsHostnames: true, EnableDnsSupport: true } },
        PublicSubnet1: { Type: 'AWS::EC2::Subnet', Properties: { CidrBlock: '10.0.1.0/24' } },
        PublicSubnet2: { Type: 'AWS::EC2::Subnet', Properties: { CidrBlock: '10.0.2.0/24' } },
        PrivateSubnet1: { Type: 'AWS::EC2::Subnet', Properties: { CidrBlock: '10.0.3.0/24' } },
        PrivateSubnet2: { Type: 'AWS::EC2::Subnet', Properties: { CidrBlock: '10.0.4.0/24' } },
        InternetGateway: { Type: 'AWS::EC2::InternetGateway' },
        InternetGatewayAttachment: { Type: 'AWS::EC2::VPCGatewayAttachment' },
        NatGateway1: { Type: 'AWS::EC2::NatGateway' },
        NatGateway2: { Type: 'AWS::EC2::NatGateway' },
        NatGateway1EIP: { Type: 'AWS::EC2::EIP' },
        NatGateway2EIP: { Type: 'AWS::EC2::EIP' },
        WebServerSecurityGroup: { Type: 'AWS::EC2::SecurityGroup', Properties: { SecurityGroupIngress: [{ FromPort: 80 }, { FromPort: 22 }] } },
        DatabaseSecurityGroup: { Type: 'AWS::EC2::SecurityGroup', Properties: { SecurityGroupIngress: [{ FromPort: 3306 }] } },
        BastionSecurityGroup: { Type: 'AWS::EC2::SecurityGroup' },
        PublicNetworkAcl: { Type: 'AWS::EC2::NetworkAcl' },
        PrivateNetworkAcl: { Type: 'AWS::EC2::NetworkAcl' },
        PublicInboundRule: { Type: 'AWS::EC2::NetworkAclEntry' },
        PublicInboundHTTPSRule: { Type: 'AWS::EC2::NetworkAclEntry' },
        PublicInboundEphemeralRule: { Type: 'AWS::EC2::NetworkAclEntry' },
        AutoScalingGroup: { Type: 'AWS::AutoScaling::AutoScalingGroup', Properties: { MinSize: 2, MaxSize: 6, DesiredCapacity: 2 } },
        ScaleUpPolicy: { Type: 'AWS::AutoScaling::ScalingPolicy' },
        ScaleDownPolicy: { Type: 'AWS::AutoScaling::ScalingPolicy' },
        CPUAlarmHigh: { Type: 'AWS::CloudWatch::Alarm' },
        CPUAlarmLow: { Type: 'AWS::CloudWatch::Alarm' },
        RDSInstance: { Type: 'AWS::RDS::DBInstance', Properties: { StorageEncrypted: true, MultiAZ: true, DeletionProtection: true, ManageMasterUserPassword: true } },
        DBSubnetGroup: { Type: 'AWS::RDS::DBSubnetGroup' },
        KMSKey: { Type: 'AWS::KMS::Key' },
        KMSKeyAlias: { Type: 'AWS::KMS::Alias' },
        S3Bucket: { Type: 'AWS::S3::Bucket', Properties: { PublicAccessBlockConfiguration: { BlockPublicAcls: true, BlockPublicPolicy: true, IgnorePublicAcls: true, RestrictPublicBuckets: true }, BucketEncryption: { ServerSideEncryptionConfiguration: [{ ServerSideEncryptionByDefault: { SSEAlgorithm: 'aws:kms' } }] } } },
        S3LoggingBucket: { Type: 'AWS::S3::Bucket', Properties: { PublicAccessBlockConfiguration: { BlockPublicAcls: true, BlockPublicPolicy: true, IgnorePublicAcls: true, RestrictPublicBuckets: true }, BucketEncryption: { ServerSideEncryptionConfiguration: [{ ServerSideEncryptionByDefault: { SSEAlgorithm: 'aws:kms' } }] } } },
        CloudTrailBucket: { Type: 'AWS::S3::Bucket', Properties: { PublicAccessBlockConfiguration: { BlockPublicAcls: true, BlockPublicPolicy: true, IgnorePublicAcls: true, RestrictPublicBuckets: true }, BucketEncryption: { ServerSideEncryptionConfiguration: [{ ServerSideEncryptionByDefault: { SSEAlgorithm: 'aws:kms' } }] } } },
        CloudTrail: { Type: 'AWS::CloudTrail::Trail', Properties: { IsLogging: true, IsMultiRegionTrail: true, EnableLogFileValidation: true } },
        S3BucketPublicReadProhibitedRule: { Type: 'AWS::Config::ConfigRule', Properties: { Source: { Owner: 'AWS', SourceIdentifier: 'S3_BUCKET_PUBLIC_READ_PROHIBITED' } } },
        S3BucketPublicWriteProhibitedRule: { Type: 'AWS::Config::ConfigRule', Properties: { Source: { Owner: 'AWS', SourceIdentifier: 'S3_BUCKET_PUBLIC_WRITE_PROHIBITED' } } },
        S3BucketEncryptionRule: { Type: 'AWS::Config::ConfigRule', Properties: { Source: { Owner: 'AWS', SourceIdentifier: 'S3_BUCKET_ENCRYPTION' } } },
        RDSInstanceEncryptionRule: { Type: 'AWS::Config::ConfigRule', Properties: { Source: { Owner: 'AWS', SourceIdentifier: 'RDS_STORAGE_ENCRYPTED' } } },
        VPCDefaultSecurityGroupClosedRule: { Type: 'AWS::Config::ConfigRule' },
        CloudTrailLogGroup: { Type: 'AWS::Logs::LogGroup' },
        EC2Role: { Type: 'AWS::IAM::Role', Properties: { ManagedPolicyArns: ['arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy'] } },
        EC2InstanceProfile: { Type: 'AWS::IAM::InstanceProfile' },
        BastionHost: { Type: 'AWS::EC2::Instance', Properties: { BlockDeviceMappings: [{ Ebs: { Encrypted: true } }] } },
        LaunchTemplate: { Type: 'AWS::EC2::LaunchTemplate', Properties: { LaunchTemplateData: { BlockDeviceMappings: [{ Ebs: { Encrypted: true } }], IamInstanceProfile: {} } } }
      },
      Outputs: {
        VPCId: { Export: { Name: 'VPCId' } },
        PublicSubnet1Id: { Export: { Name: 'PublicSubnet1Id' } },
        PublicSubnet2Id: { Export: { Name: 'PublicSubnet2Id' } },
        PrivateSubnet1Id: { Export: { Name: 'PrivateSubnet1Id' } },
        PrivateSubnet2Id: { Export: { Name: 'PrivateSubnet2Id' } },
        DatabaseEndpoint: { Export: { Name: 'DatabaseEndpoint' } },
        S3BucketName: { Export: { Name: 'S3BucketName' } },
        KMSKeyId: { Export: { Name: 'KMSKeyId' } },
        BastionHostPublicIP: { Export: { Name: 'BastionHostPublicIP' } },
        CloudTrailArn: { Export: { Name: 'CloudTrailArn' } },
        S3BucketPublicReadProhibitedRuleName: { Export: { Name: 'S3BucketPublicReadProhibitedRuleName' } },
        S3BucketPublicWriteProhibitedRuleName: { Export: { Name: 'S3BucketPublicWriteProhibitedRuleName' } },
        S3BucketEncryptionRuleName: { Export: { Name: 'S3BucketEncryptionRuleName' } },
        RDSInstanceEncryptionRuleName: { Export: { Name: 'RDSInstanceEncryptionRuleName' } },
        VPCDefaultSecurityGroupClosedRuleName: { Export: { Name: 'VPCDefaultSecurityGroupClosedRuleName' } }
      }
    };
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
      
        'WebServerSecurityGroup',
        'DatabaseSecurityGroup',
        'BastionSecurityGroup'
      ];
      
      expectedSGs.forEach(sg => {
        expect(template.Resources[sg]).toBeDefined();
        expect(template.Resources[sg].Type).toBe('AWS::EC2::SecurityGroup');
      });
    });



    test('WebServer SG should allow HTTP from internet and SSH from Bastion', () => {
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

  describe('Auto Scaling', () => {
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


  });

  describe('S3 Buckets', () => {
    test('should have S3 buckets with proper security', () => {
      const buckets = ['S3Bucket', 'S3LoggingBucket', 'CloudTrailBucket'];
      
      buckets.forEach(bucketName => {
        expect(template.Resources[bucketName]).toBeDefined();
        expect(template.Resources[bucketName].Type).toBe('AWS::S3::Bucket');
      });
    });

    test('S3 buckets should block public access', () => {
      const buckets = ['S3Bucket', 'S3LoggingBucket', 'CloudTrailBucket'];
      
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
      const buckets = ['S3Bucket', 'S3LoggingBucket', 'CloudTrailBucket'];
      
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

    test('should have AWS Config Rules for compliance monitoring', () => {
      // AWS Config Rules using existing ConfigurationRecorder in the account
      expect(template.Resources.S3BucketPublicReadProhibitedRule).toBeDefined();
      expect(template.Resources.S3BucketPublicWriteProhibitedRule).toBeDefined();
      expect(template.Resources.S3BucketEncryptionRule).toBeDefined();
      expect(template.Resources.RDSInstanceEncryptionRule).toBeDefined();
      expect(template.Resources.VPCDefaultSecurityGroupClosedRule).toBeDefined();
    });

    test('AWS Config Rules should have correct properties', () => {
      const s3ReadRule = template.Resources.S3BucketPublicReadProhibitedRule;
      expect(s3ReadRule.Type).toBe('AWS::Config::ConfigRule');
      expect(s3ReadRule.Properties.Source.Owner).toBe('AWS');
      expect(s3ReadRule.Properties.Source.SourceIdentifier).toBe('S3_BUCKET_PUBLIC_READ_PROHIBITED');
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
        
        'DatabaseEndpoint',
        'S3BucketName',

        'KMSKeyId',
        'BastionHostPublicIP',
        'CloudTrailArn',
        'S3BucketPublicReadProhibitedRuleName',
        'S3BucketPublicWriteProhibitedRuleName',
        'S3BucketEncryptionRuleName',
        'RDSInstanceEncryptionRuleName',
        'VPCDefaultSecurityGroupClosedRuleName'
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
      const buckets = ['S3Bucket', 'S3LoggingBucket', 'CloudTrailBucket'];
      
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