import fs from 'fs';
import path from 'path';

describe('CloudFormation Template Optimization Tests', () => {
  let tapStackTemplate: any;
  let metadata: any;

  beforeAll(() => {
    // Load TapStack template
    const tapStackPath = path.join(__dirname, '../lib/TapStack.json');
    tapStackTemplate = JSON.parse(fs.readFileSync(tapStackPath, 'utf8'));

    // Load metadata for validation
    const metadataPath = path.join(__dirname, '../metadata.json');
    metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
  });

  describe('Metadata Validation', () => {
    test('should have correct platform', () => {
      expect(metadata.platform).toBe('cfn');
    });

    test('should have correct language', () => {
      expect(metadata.language).toBe('json');
    });

    test('should have required AWS services', () => {
      const requiredServices = ['VPC', 'EC2', 'Auto Scaling', 'Elastic Load Balancing', 'RDS', 'ElastiCache', 'S3', 'IAM'];
      requiredServices.forEach(service => {
        expect(metadata.aws_services).toContain(service);
      });
    });

    test('should have subject labels for optimization requirements', () => {
      expect(metadata.subject_labels).toBeDefined();
      expect(metadata.subject_labels.length).toBeGreaterThanOrEqual(10);
    });
  });

  describe('TapStack Template Structure', () => {
    test('should have valid CloudFormation format version', () => {
      expect(tapStackTemplate.AWSTemplateFormatVersion).toBe('2010-09-09');
    });

    test('should have a description', () => {
      expect(tapStackTemplate.Description).toBeDefined();
      expect(tapStackTemplate.Description).toContain('Optimized');
    });

    test('should have metadata section with CloudFormation Designer', () => {
      expect(tapStackTemplate.Metadata).toBeDefined();
      expect(tapStackTemplate.Metadata['AWS::CloudFormation::Designer']).toBeDefined();
    });

    test('should have Mappings section for environment configurations', () => {
      expect(tapStackTemplate.Mappings).toBeDefined();
      expect(tapStackTemplate.Mappings.EnvironmentConfig).toBeDefined();
      expect(tapStackTemplate.Mappings.EnvironmentConfig.dev).toBeDefined();
      expect(tapStackTemplate.Mappings.EnvironmentConfig.staging).toBeDefined();
      expect(tapStackTemplate.Mappings.EnvironmentConfig.prod).toBeDefined();
    });

    test('should have RegionAMI mapping with multiple regions', () => {
      expect(tapStackTemplate.Mappings.RegionAMI).toBeDefined();
      const regions = Object.keys(tapStackTemplate.Mappings.RegionAMI);
      expect(regions.length).toBeGreaterThanOrEqual(3);
      expect(regions).toContain('us-east-1');
    });

    test('should have Conditions section', () => {
      expect(tapStackTemplate.Conditions).toBeDefined();
      expect(tapStackTemplate.Conditions.IsProduction).toBeDefined();
      expect(tapStackTemplate.Conditions.IsNotProduction).toBeDefined();
      expect(tapStackTemplate.Conditions.EnableMultiAZ).toBeDefined();
    });
  });

  describe('Parameters Validation', () => {
    test('should have Environment parameter with AllowedValues', () => {
      expect(tapStackTemplate.Parameters.Environment).toBeDefined();
      expect(tapStackTemplate.Parameters.Environment.AllowedValues).toEqual(['dev', 'staging', 'prod']);
    });

    test('should have EnvironmentSuffix parameter with validation', () => {
      expect(tapStackTemplate.Parameters.EnvironmentSuffix).toBeDefined();
      expect(tapStackTemplate.Parameters.EnvironmentSuffix.AllowedPattern).toBeDefined();
      expect(tapStackTemplate.Parameters.EnvironmentSuffix.MinLength).toBeDefined();
      expect(tapStackTemplate.Parameters.EnvironmentSuffix.MaxLength).toBeDefined();
    });

    test('should have VpcCIDR parameter with AllowedPattern', () => {
      expect(tapStackTemplate.Parameters.VpcCIDR).toBeDefined();
      expect(tapStackTemplate.Parameters.VpcCIDR.AllowedPattern).toBeDefined();
      expect(tapStackTemplate.Parameters.VpcCIDR.ConstraintDescription).toBeDefined();
    });

    test('should have DBMasterUsername parameter', () => {
      expect(tapStackTemplate.Parameters.DBMasterUsername).toBeDefined();
      expect(tapStackTemplate.Parameters.DBMasterUsername.AllowedPattern).toBeDefined();
    });
  });

  describe('Security Group Consolidation', () => {
    test('template should have exactly 3 security groups', () => {
      const securityGroups = Object.keys(tapStackTemplate.Resources).filter(
        key => tapStackTemplate.Resources[key].Type === 'AWS::EC2::SecurityGroup'
      );
      expect(securityGroups).toHaveLength(3);
      expect(securityGroups).toContain('WebSecurityGroup');
      expect(securityGroups).toContain('AppSecurityGroup');
      expect(securityGroups).toContain('DataSecurityGroup');
    });
  });

  describe('Fn::Sub Usage', () => {
    test('template should use Fn::Sub for resource naming', () => {
      const vpcNameTag = tapStackTemplate.Resources.VPC.Properties.Tags[0].Value;
      expect(vpcNameTag).toHaveProperty('Fn::Sub');
      expect(vpcNameTag['Fn::Sub']).toContain('${EnvironmentSuffix}');
    });
  });

  describe('DeletionPolicy and UpdateReplacePolicy', () => {
    test('AuroraCluster should have Snapshot DeletionPolicy', () => {
      expect(tapStackTemplate.Resources.AuroraCluster.DeletionPolicy).toBe('Snapshot');
      expect(tapStackTemplate.Resources.AuroraCluster.UpdateReplacePolicy).toBe('Snapshot');
    });

    test('LogBucket should have Delete DeletionPolicy for clean teardown', () => {
      expect(tapStackTemplate.Resources.LogBucket.DeletionPolicy).toBe('Delete');
      expect(tapStackTemplate.Resources.LogBucket.UpdateReplacePolicy).toBe('Delete');
    });

    test('SecurityGroups should have Delete DeletionPolicy', () => {
      expect(tapStackTemplate.Resources.WebSecurityGroup.DeletionPolicy).toBe('Delete');
      expect(tapStackTemplate.Resources.AppSecurityGroup.DeletionPolicy).toBe('Delete');
      expect(tapStackTemplate.Resources.DataSecurityGroup.DeletionPolicy).toBe('Delete');
    });
  });

  describe('IMDSv2 Configuration', () => {
    test('LaunchTemplate should have MetadataOptions with HttpTokens required', () => {
      const launchTemplate = tapStackTemplate.Resources.LaunchTemplate;
      expect(launchTemplate.Properties.LaunchTemplateData.MetadataOptions).toBeDefined();
      expect(launchTemplate.Properties.LaunchTemplateData.MetadataOptions.HttpTokens).toBe('required');
      expect(launchTemplate.Properties.LaunchTemplateData.MetadataOptions.HttpEndpoint).toBe('enabled');
      expect(launchTemplate.Properties.LaunchTemplateData.MetadataOptions.HttpPutResponseHopLimit).toBe(1);
    });
  });

  describe('Pseudo Parameters Usage', () => {
    test('should use Fn::GetAZs with AWS::Region instead of hardcoded AZs', () => {
      const publicSubnet1 = tapStackTemplate.Resources.PublicSubnet1.Properties;
      expect(publicSubnet1.AvailabilityZone).toHaveProperty('Fn::Select');
      expect(publicSubnet1.AvailabilityZone['Fn::Select'][1]).toHaveProperty('Fn::GetAZs');
    });

    test('should use AWS::AccountId in S3 bucket name', () => {
      const bucketName = tapStackTemplate.Resources.LogBucket.Properties.BucketName;
      expect(bucketName['Fn::Sub']).toContain('${AWS::AccountId}');
    });

    test('should use AWS::StackName in exports', () => {
      const vpcExport = tapStackTemplate.Outputs.VPCId.Export.Name;
      expect(vpcExport['Fn::Sub']).toContain('${AWS::StackName}');
    });
  });

  describe('Security Configuration', () => {
    test('RedisReplicationGroup should have TransitEncryptionEnabled true', () => {
      const redisReplicationGroup = tapStackTemplate.Resources.RedisReplicationGroup;
      expect(redisReplicationGroup.Properties.TransitEncryptionEnabled).toBe(true);
      expect(redisReplicationGroup.Properties.AtRestEncryptionEnabled).toBe(true);
    });

    test('AuroraCluster should use ManageMasterUserPassword', () => {
      const auroraCluster = tapStackTemplate.Resources.AuroraCluster;
      expect(auroraCluster.Properties.ManageMasterUserPassword).toBe(true);
      expect(auroraCluster.Properties.MasterUserPassword).toBeUndefined();
    });

    test('AuroraCluster should have StorageEncrypted enabled', () => {
      const auroraCluster = tapStackTemplate.Resources.AuroraCluster;
      expect(auroraCluster.Properties.StorageEncrypted).toBe(true);
    });

    test('LogBucket should have encryption and public access block', () => {
      const logBucket = tapStackTemplate.Resources.LogBucket;
      expect(logBucket.Properties.BucketEncryption).toBeDefined();
      expect(logBucket.Properties.PublicAccessBlockConfiguration).toBeDefined();
      expect(logBucket.Properties.PublicAccessBlockConfiguration.BlockPublicAcls).toBe(true);
    });
  });

  describe('Conditional Resource Creation', () => {
    test('AuroraInstance2 should have EnableMultiAZ condition', () => {
      expect(tapStackTemplate.Resources.AuroraInstance2.Condition).toBe('EnableMultiAZ');
    });

    test('RedisReplicationGroup should have IsProduction condition', () => {
      expect(tapStackTemplate.Resources.RedisReplicationGroup.Condition).toBe('IsProduction');
    });

    test('RedisCluster should have IsNotProduction condition', () => {
      expect(tapStackTemplate.Resources.RedisCluster.Condition).toBe('IsNotProduction');
    });
  });

  describe('Resource Structure Validation', () => {
    test('should have all required networking resources', () => {
      expect(tapStackTemplate.Resources.VPC).toBeDefined();
      expect(tapStackTemplate.Resources.InternetGateway).toBeDefined();
      expect(tapStackTemplate.Resources.PublicSubnet1).toBeDefined();
      expect(tapStackTemplate.Resources.PublicSubnet2).toBeDefined();
      expect(tapStackTemplate.Resources.PublicSubnet3).toBeDefined();
      expect(tapStackTemplate.Resources.PrivateSubnet1).toBeDefined();
      expect(tapStackTemplate.Resources.PrivateSubnet2).toBeDefined();
      expect(tapStackTemplate.Resources.PrivateSubnet3).toBeDefined();
    });

    test('should have all required application resources', () => {
      expect(tapStackTemplate.Resources.ApplicationLoadBalancer).toBeDefined();
      expect(tapStackTemplate.Resources.TargetGroup).toBeDefined();
      expect(tapStackTemplate.Resources.AutoScalingGroup).toBeDefined();
      expect(tapStackTemplate.Resources.LaunchTemplate).toBeDefined();
    });

    test('should have all required data tier resources', () => {
      expect(tapStackTemplate.Resources.AuroraCluster).toBeDefined();
      expect(tapStackTemplate.Resources.AuroraInstance1).toBeDefined();
      expect(tapStackTemplate.Resources.RedisReplicationGroup).toBeDefined();
      expect(tapStackTemplate.Resources.RedisCluster).toBeDefined();
    });
  });

  describe('Outputs Validation', () => {
    test('should have all required outputs', () => {
      const requiredOutputs = [
        'VPCId',
        'LoadBalancerDNS',
        'LoadBalancerURL',
        'AuroraClusterEndpoint',
        'AuroraClusterReadEndpoint',
        'RedisEndpoint',
        'LogBucketName',
        'Environment',
        'Region',
        'AccountId'
      ];

      requiredOutputs.forEach(outputName => {
        expect(tapStackTemplate.Outputs[outputName]).toBeDefined();
      });
    });

    test('outputs should have exports with AWS::StackName', () => {
      const outputsWithExports = ['VPCId', 'LoadBalancerDNS', 'AuroraClusterEndpoint'];
      outputsWithExports.forEach(outputName => {
        expect(tapStackTemplate.Outputs[outputName].Export).toBeDefined();
        expect(tapStackTemplate.Outputs[outputName].Export.Name['Fn::Sub']).toContain('${AWS::StackName}');
      });
    });
  });

  describe('Environment Configuration Mappings', () => {
    test('dev environment should have minimal resources', () => {
      const devConfig = tapStackTemplate.Mappings.EnvironmentConfig.dev;
      expect(devConfig.InstanceType).toBe('t3.micro');
      expect(devConfig.MinSize).toBe('1');
      expect(devConfig.MultiAZ).toBe('false');
    });

    test('prod environment should have production-grade resources', () => {
      const prodConfig = tapStackTemplate.Mappings.EnvironmentConfig.prod;
      expect(prodConfig.InstanceType).toBe('t3.medium');
      expect(prodConfig.MinSize).toBe('2');
      expect(prodConfig.MultiAZ).toBe('true');
      expect(prodConfig.DBInstanceClass).toBe('db.r5.large');
    });
  });
});
