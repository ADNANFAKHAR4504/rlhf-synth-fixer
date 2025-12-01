import fs from 'fs';
import path from 'path';

describe('CloudFormation Template Optimization Tests', () => {
  let optimizedTemplate: any;
  let modelTemplate: any;
  let baselineTemplate: any;

  beforeAll(() => {
    // Load all templates for comparison
    const optimizedPath = path.join(__dirname, '../lib/optimized-stack.json');
    const modelPath = path.join(__dirname, '../lib/model-stack.json');
    const baselinePath = path.join(__dirname, '../lib/baseline-stack.json');

    optimizedTemplate = JSON.parse(fs.readFileSync(optimizedPath, 'utf8'));
    modelTemplate = JSON.parse(fs.readFileSync(modelPath, 'utf8'));
    baselineTemplate = JSON.parse(fs.readFileSync(baselinePath, 'utf8'));
  });

  describe('Optimized Template Structure', () => {
    test('should have valid CloudFormation format version', () => {
      expect(optimizedTemplate.AWSTemplateFormatVersion).toBe('2010-09-09');
    });

    test('should have a description', () => {
      expect(optimizedTemplate.Description).toBeDefined();
      expect(optimizedTemplate.Description).toContain('Optimized');
    });

    test('should have metadata section with CloudFormation Designer', () => {
      expect(optimizedTemplate.Metadata).toBeDefined();
      expect(optimizedTemplate.Metadata['AWS::CloudFormation::Designer']).toBeDefined();
    });

    test('should have Mappings section for environment configurations', () => {
      expect(optimizedTemplate.Mappings).toBeDefined();
      expect(optimizedTemplate.Mappings.EnvironmentConfig).toBeDefined();
      expect(optimizedTemplate.Mappings.EnvironmentConfig.dev).toBeDefined();
      expect(optimizedTemplate.Mappings.EnvironmentConfig.staging).toBeDefined();
      expect(optimizedTemplate.Mappings.EnvironmentConfig.prod).toBeDefined();
    });

    test('should have RegionAMI mapping with multiple regions', () => {
      expect(optimizedTemplate.Mappings.RegionAMI).toBeDefined();
      const regions = Object.keys(optimizedTemplate.Mappings.RegionAMI);
      expect(regions.length).toBeGreaterThanOrEqual(3);
      expect(regions).toContain('us-east-1');
    });

    test('should have Conditions section', () => {
      expect(optimizedTemplate.Conditions).toBeDefined();
      expect(optimizedTemplate.Conditions.IsProduction).toBeDefined();
      expect(optimizedTemplate.Conditions.IsNotProduction).toBeDefined();
      expect(optimizedTemplate.Conditions.EnableMultiAZ).toBeDefined();
    });
  });

  describe('Parameters Validation', () => {
    test('should have Environment parameter with AllowedValues', () => {
      expect(optimizedTemplate.Parameters.Environment).toBeDefined();
      expect(optimizedTemplate.Parameters.Environment.AllowedValues).toEqual(['dev', 'staging', 'prod']);
    });

    test('should have EnvironmentSuffix parameter with validation', () => {
      expect(optimizedTemplate.Parameters.EnvironmentSuffix).toBeDefined();
      expect(optimizedTemplate.Parameters.EnvironmentSuffix.AllowedPattern).toBeDefined();
      expect(optimizedTemplate.Parameters.EnvironmentSuffix.MinLength).toBeDefined();
      expect(optimizedTemplate.Parameters.EnvironmentSuffix.MaxLength).toBeDefined();
    });

    test('should have VpcCIDR parameter with AllowedPattern', () => {
      expect(optimizedTemplate.Parameters.VpcCIDR).toBeDefined();
      expect(optimizedTemplate.Parameters.VpcCIDR.AllowedPattern).toBeDefined();
      expect(optimizedTemplate.Parameters.VpcCIDR.ConstraintDescription).toBeDefined();
    });

    test('should have DBMasterUsername parameter', () => {
      expect(optimizedTemplate.Parameters.DBMasterUsername).toBeDefined();
      expect(optimizedTemplate.Parameters.DBMasterUsername.AllowedPattern).toBeDefined();
    });
  });

  describe('Security Group Consolidation (15 → 3)', () => {
    test('optimized template should have exactly 3 security groups', () => {
      const securityGroups = Object.keys(optimizedTemplate.Resources).filter(
        key => optimizedTemplate.Resources[key].Type === 'AWS::EC2::SecurityGroup'
      );
      expect(securityGroups).toHaveLength(3);
      expect(securityGroups).toContain('WebSecurityGroup');
      expect(securityGroups).toContain('AppSecurityGroup');
      expect(securityGroups).toContain('DataSecurityGroup');
    });

    test('baseline template should have 15 security groups', () => {
      const securityGroups = Object.keys(baselineTemplate.Resources).filter(
        key => baselineTemplate.Resources[key].Type === 'AWS::EC2::SecurityGroup'
      );
      expect(securityGroups.length).toBeGreaterThanOrEqual(15);
    });
  });

  describe('Fn::Sub instead of Fn::Join', () => {
    test('optimized template should use Fn::Sub for resource naming', () => {
      const vpcNameTag = optimizedTemplate.Resources.VPC.Properties.Tags[0].Value;
      expect(vpcNameTag).toHaveProperty('Fn::Sub');
      expect(vpcNameTag['Fn::Sub']).toContain('${EnvironmentSuffix}');
    });

    test('model template should still use Fn::Join (showing the problem)', () => {
      const vpcNameTag = modelTemplate.Resources.VPC.Properties.Tags[0].Value;
      expect(vpcNameTag).toHaveProperty('Fn::Join');
    });
  });

  describe('DeletionPolicy and UpdateReplacePolicy', () => {
    test('AuroraCluster should have Snapshot DeletionPolicy', () => {
      expect(optimizedTemplate.Resources.AuroraCluster.DeletionPolicy).toBe('Snapshot');
      expect(optimizedTemplate.Resources.AuroraCluster.UpdateReplacePolicy).toBe('Snapshot');
    });

    test('LogBucket should have Delete DeletionPolicy for clean teardown', () => {
      expect(optimizedTemplate.Resources.LogBucket.DeletionPolicy).toBe('Delete');
      expect(optimizedTemplate.Resources.LogBucket.UpdateReplacePolicy).toBe('Delete');
    });

    test('SecurityGroups should have Delete DeletionPolicy', () => {
      expect(optimizedTemplate.Resources.WebSecurityGroup.DeletionPolicy).toBe('Delete');
      expect(optimizedTemplate.Resources.AppSecurityGroup.DeletionPolicy).toBe('Delete');
      expect(optimizedTemplate.Resources.DataSecurityGroup.DeletionPolicy).toBe('Delete');
    });
  });

  describe('IMDSv2 Configuration', () => {
    test('LaunchConfiguration should have MetadataOptions with HttpTokens required', () => {
      const launchConfig = optimizedTemplate.Resources.LaunchConfiguration;
      expect(launchConfig.Properties.MetadataOptions).toBeDefined();
      expect(launchConfig.Properties.MetadataOptions.HttpTokens).toBe('required');
      expect(launchConfig.Properties.MetadataOptions.HttpEndpoint).toBe('enabled');
      expect(launchConfig.Properties.MetadataOptions.HttpPutResponseHopLimit).toBe(1);
    });

    test('model template should NOT have IMDSv2 configuration (showing the problem)', () => {
      const launchConfig = modelTemplate.Resources.LaunchConfiguration;
      expect(launchConfig.Properties.MetadataOptions).toBeUndefined();
    });
  });

  describe('Pseudo Parameters Usage', () => {
    test('should use Fn::GetAZs with AWS::Region instead of hardcoded AZs', () => {
      const publicSubnet1 = optimizedTemplate.Resources.PublicSubnet1.Properties;
      expect(publicSubnet1.AvailabilityZone).toHaveProperty('Fn::Select');
      expect(publicSubnet1.AvailabilityZone['Fn::Select'][1]).toHaveProperty('Fn::GetAZs');
    });

    test('should use AWS::AccountId in S3 bucket name', () => {
      const bucketName = optimizedTemplate.Resources.LogBucket.Properties.BucketName;
      expect(bucketName['Fn::Sub']).toContain('${AWS::AccountId}');
    });

    test('should use AWS::StackName in exports', () => {
      const vpcExport = optimizedTemplate.Outputs.VPCId.Export.Name;
      expect(vpcExport['Fn::Sub']).toContain('${AWS::StackName}');
    });
  });

  describe('Security Configuration', () => {
    test('RedisReplicationGroup should have TransitEncryptionEnabled true', () => {
      const redisReplicationGroup = optimizedTemplate.Resources.RedisReplicationGroup;
      expect(redisReplicationGroup.Properties.TransitEncryptionEnabled).toBe(true);
      expect(redisReplicationGroup.Properties.AtRestEncryptionEnabled).toBe(true);
    });

    test('AuroraCluster should use ManageMasterUserPassword', () => {
      const auroraCluster = optimizedTemplate.Resources.AuroraCluster;
      expect(auroraCluster.Properties.ManageMasterUserPassword).toBe(true);
      expect(auroraCluster.Properties.MasterUserPassword).toBeUndefined();
    });

    test('AuroraCluster should have StorageEncrypted enabled', () => {
      const auroraCluster = optimizedTemplate.Resources.AuroraCluster;
      expect(auroraCluster.Properties.StorageEncrypted).toBe(true);
    });

    test('LogBucket should have encryption and public access block', () => {
      const logBucket = optimizedTemplate.Resources.LogBucket;
      expect(logBucket.Properties.BucketEncryption).toBeDefined();
      expect(logBucket.Properties.PublicAccessBlockConfiguration).toBeDefined();
      expect(logBucket.Properties.PublicAccessBlockConfiguration.BlockPublicAcls).toBe(true);
    });
  });

  describe('Conditional Resource Creation', () => {
    test('AuroraInstance2 should have EnableMultiAZ condition', () => {
      expect(optimizedTemplate.Resources.AuroraInstance2.Condition).toBe('EnableMultiAZ');
    });

    test('RedisReplicationGroup should have IsProduction condition', () => {
      expect(optimizedTemplate.Resources.RedisReplicationGroup.Condition).toBe('IsProduction');
    });

    test('RedisCluster should have IsNotProduction condition', () => {
      expect(optimizedTemplate.Resources.RedisCluster.Condition).toBe('IsNotProduction');
    });
  });

  describe('Template Size Optimization', () => {
    test('optimized template should be smaller than baseline', () => {
      const optimizedSize = JSON.stringify(optimizedTemplate).length;
      const baselineSize = JSON.stringify(baselineTemplate).length;
      expect(optimizedSize).toBeLessThan(baselineSize);
    });

    test('optimized template should have fewer resources than baseline', () => {
      const optimizedResourceCount = Object.keys(optimizedTemplate.Resources).length;
      const baselineResourceCount = Object.keys(baselineTemplate.Resources).length;
      expect(optimizedResourceCount).toBeLessThan(baselineResourceCount);
    });
  });

  describe('Model Template Comparison (Showing Failures)', () => {
    test('model template should NOT have Mappings section', () => {
      expect(modelTemplate.Mappings).toBeUndefined();
    });

    test('model template should NOT have Conditions section', () => {
      expect(modelTemplate.Conditions).toBeUndefined();
    });

    test('model template should NOT have Metadata section', () => {
      expect(modelTemplate.Metadata).toBeUndefined();
    });

    test('model template should NOT have DeletionPolicy on resources', () => {
      expect(modelTemplate.Resources.AuroraCluster.DeletionPolicy).toBeUndefined();
    });
  });

  describe('Resource Structure Validation', () => {
    test('should have all required networking resources', () => {
      expect(optimizedTemplate.Resources.VPC).toBeDefined();
      expect(optimizedTemplate.Resources.InternetGateway).toBeDefined();
      expect(optimizedTemplate.Resources.PublicSubnet1).toBeDefined();
      expect(optimizedTemplate.Resources.PublicSubnet2).toBeDefined();
      expect(optimizedTemplate.Resources.PublicSubnet3).toBeDefined();
      expect(optimizedTemplate.Resources.PrivateSubnet1).toBeDefined();
      expect(optimizedTemplate.Resources.PrivateSubnet2).toBeDefined();
      expect(optimizedTemplate.Resources.PrivateSubnet3).toBeDefined();
    });

    test('should have all required application resources', () => {
      expect(optimizedTemplate.Resources.ApplicationLoadBalancer).toBeDefined();
      expect(optimizedTemplate.Resources.TargetGroup).toBeDefined();
      expect(optimizedTemplate.Resources.AutoScalingGroup).toBeDefined();
      expect(optimizedTemplate.Resources.LaunchConfiguration).toBeDefined();
    });

    test('should have all required data tier resources', () => {
      expect(optimizedTemplate.Resources.AuroraCluster).toBeDefined();
      expect(optimizedTemplate.Resources.AuroraInstance1).toBeDefined();
      expect(optimizedTemplate.Resources.RedisReplicationGroup).toBeDefined();
      expect(optimizedTemplate.Resources.RedisCluster).toBeDefined();
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
        expect(optimizedTemplate.Outputs[outputName]).toBeDefined();
      });
    });

    test('outputs should have exports with AWS::StackName', () => {
      const outputsWithExports = ['VPCId', 'LoadBalancerDNS', 'AuroraClusterEndpoint'];
      outputsWithExports.forEach(outputName => {
        expect(optimizedTemplate.Outputs[outputName].Export).toBeDefined();
        expect(optimizedTemplate.Outputs[outputName].Export.Name['Fn::Sub']).toContain('${AWS::StackName}');
      });
    });
  });

  describe('Environment Configuration Mappings', () => {
    test('dev environment should have minimal resources', () => {
      const devConfig = optimizedTemplate.Mappings.EnvironmentConfig.dev;
      expect(devConfig.InstanceType).toBe('t3.micro');
      expect(devConfig.MinSize).toBe('1');
      expect(devConfig.MultiAZ).toBe('false');
    });

    test('prod environment should have production-grade resources', () => {
      const prodConfig = optimizedTemplate.Mappings.EnvironmentConfig.prod;
      expect(prodConfig.InstanceType).toBe('t3.medium');
      expect(prodConfig.MinSize).toBe('2');
      expect(prodConfig.MultiAZ).toBe('true');
      expect(prodConfig.DBInstanceClass).toBe('db.r5.large');
    });
  });
});
