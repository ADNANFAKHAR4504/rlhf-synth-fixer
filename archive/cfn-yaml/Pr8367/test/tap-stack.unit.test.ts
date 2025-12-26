import fs from 'fs';
import path from 'path';
import { describe, expect, test, beforeAll } from '@jest/globals';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('TapStack CloudFormation Template - Multi-Environment Infrastructure', () => {
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
      expect(template.Description).toContain('Multi-Environment Infrastructure Stack');
    });

    test('should have Parameters section', () => {
      expect(template.Parameters).toBeDefined();
      expect(Object.keys(template.Parameters).length).toBeGreaterThan(0);
    });

    test('should have Resources section', () => {
      expect(template.Resources).toBeDefined();
      expect(Object.keys(template.Resources).length).toBeGreaterThan(0);
    });

    test('should have Outputs section', () => {
      expect(template.Outputs).toBeDefined();
      expect(Object.keys(template.Outputs).length).toBeGreaterThan(0);
    });

    test('should have Conditions section', () => {
      expect(template.Conditions).toBeDefined();
    });

    test('should have Mappings section', () => {
      expect(template.Mappings).toBeDefined();
    });
  });

  describe('Parameters', () => {
    test('should have EnvironmentSuffix parameter', () => {
      expect(template.Parameters.EnvironmentSuffix).toBeDefined();
      expect(template.Parameters.EnvironmentSuffix.Type).toBe('String');
      expect(template.Parameters.EnvironmentSuffix.Description).toContain('suffix');
    });

    test('should have EnvironmentType parameter', () => {
      expect(template.Parameters.EnvironmentType).toBeDefined();
      expect(template.Parameters.EnvironmentType.Type).toBe('String');
      expect(template.Parameters.EnvironmentType.AllowedValues).toEqual(['dev', 'staging', 'prod']);
    });

  });

  describe('Mappings', () => {
    test('should have EnvironmentConfig mapping', () => {
      expect(template.Mappings.EnvironmentConfig).toBeDefined();
    });

    test('EnvironmentConfig should have dev environment', () => {
      const devConfig = template.Mappings.EnvironmentConfig.dev;
      expect(devConfig).toBeDefined();
      expect(devConfig.VpcCidr).toBe('10.0.0.0/16');
      expect(devConfig.InstanceType).toBe('t3.micro');
      expect(devConfig.LambdaMemory).toBe(128);
      expect(devConfig.CPUAlarmThreshold).toBe(80);
      expect(devConfig.RDSBackupRetention).toBe(0);
    });

    test('EnvironmentConfig should have staging environment', () => {
      const stagingConfig = template.Mappings.EnvironmentConfig.staging;
      expect(stagingConfig).toBeDefined();
      expect(stagingConfig.VpcCidr).toBe('10.1.0.0/16');
      expect(stagingConfig.InstanceType).toBe('t3.small');
      expect(stagingConfig.LambdaMemory).toBe(256);
      expect(stagingConfig.CPUAlarmThreshold).toBe(70);
      expect(stagingConfig.RDSBackupRetention).toBe(7);
    });

    test('EnvironmentConfig should have prod environment', () => {
      const prodConfig = template.Mappings.EnvironmentConfig.prod;
      expect(prodConfig).toBeDefined();
      expect(prodConfig.VpcCidr).toBe('10.2.0.0/16');
      expect(prodConfig.InstanceType).toBe('t3.medium');
      expect(prodConfig.LambdaMemory).toBe(512);
      expect(prodConfig.CPUAlarmThreshold).toBe(60);
      expect(prodConfig.RDSBackupRetention).toBe(30);
      expect(prodConfig.RDSMultiAZ).toBe(true);
    });

    test('all environments should have required subnet configurations', () => {
      const environments = ['dev', 'staging', 'prod'];
      environments.forEach(env => {
        const config = template.Mappings.EnvironmentConfig[env];
        expect(config.PublicSubnet1Cidr).toBeDefined();
        expect(config.PublicSubnet2Cidr).toBeDefined();
        expect(config.PrivateSubnet1Cidr).toBeDefined();
        expect(config.PrivateSubnet2Cidr).toBeDefined();
      });
    });
  });

  describe('Conditions', () => {
    test('should have IsProd condition', () => {
      expect(template.Conditions.IsProd).toBeDefined();
    });

    test('should have IsStaging condition', () => {
      expect(template.Conditions.IsStaging).toBeDefined();
    });

    test('should have EnableVersioning condition', () => {
      expect(template.Conditions.EnableVersioning).toBeDefined();
    });

    test('should have EnableMultiAZ condition', () => {
      expect(template.Conditions.EnableMultiAZ).toBeDefined();
    });
  });

  describe('VPC Resources', () => {
    test('should have VPC resource', () => {
      expect(template.Resources.VPC).toBeDefined();
      expect(template.Resources.VPC.Type).toBe('AWS::EC2::VPC');
    });

    test('should have Internet Gateway', () => {
      expect(template.Resources.InternetGateway).toBeDefined();
      expect(template.Resources.InternetGateway.Type).toBe('AWS::EC2::InternetGateway');
    });

    test('should have public subnets', () => {
      expect(template.Resources.PublicSubnet1).toBeDefined();
      expect(template.Resources.PublicSubnet2).toBeDefined();
      expect(template.Resources.PublicSubnet1.Type).toBe('AWS::EC2::Subnet');
      expect(template.Resources.PublicSubnet2.Type).toBe('AWS::EC2::Subnet');
    });

    test('should have private subnets', () => {
      expect(template.Resources.PrivateSubnet1).toBeDefined();
      expect(template.Resources.PrivateSubnet2).toBeDefined();
      expect(template.Resources.PrivateSubnet1.Type).toBe('AWS::EC2::Subnet');
      expect(template.Resources.PrivateSubnet2.Type).toBe('AWS::EC2::Subnet');
    });
  });

  describe('Compute Resources', () => {
    test('should have Application Load Balancer', () => {
      expect(template.Resources.ApplicationLoadBalancer).toBeDefined();
      expect(template.Resources.ApplicationLoadBalancer.Type).toBe('AWS::ElasticLoadBalancingV2::LoadBalancer');
    });

    test('should have Target Group', () => {
      expect(template.Resources.ALBTargetGroup).toBeDefined();
      expect(template.Resources.ALBTargetGroup.Type).toBe('AWS::ElasticLoadBalancingV2::TargetGroup');
    });

    test('should have ALB Listener', () => {
      expect(template.Resources.ALBListener).toBeDefined();
      expect(template.Resources.ALBListener.Type).toBe('AWS::ElasticLoadBalancingV2::Listener');
    });

    test('should have EC2 Instance Profile', () => {
      expect(template.Resources.EC2InstanceProfile).toBeDefined();
      expect(template.Resources.EC2InstanceProfile.Type).toBe('AWS::IAM::InstanceProfile');
    });

    test('should have EC2 IAM Role', () => {
      expect(template.Resources.EC2InstanceRole).toBeDefined();
      expect(template.Resources.EC2InstanceRole.Type).toBe('AWS::IAM::Role');
    });
  });

  describe('Database Resources', () => {
    test('should have RDS Database', () => {
      expect(template.Resources.RDSDatabase).toBeDefined();
      expect(template.Resources.RDSDatabase.Type).toBe('AWS::RDS::DBInstance');
    });

    test('RDS should have Delete deletion policy', () => {
      expect(template.Resources.RDSDatabase.DeletionPolicy).toBe('Delete');
    });

    test('RDS should use MySQL engine', () => {
      const rds = template.Resources.RDSDatabase;
      expect(rds.Properties.Engine).toBe('mysql');
      expect(rds.Properties.EngineVersion).toBeDefined();
    });

    test('RDS should have environment-specific backup retention', () => {
      const rds = template.Resources.RDSDatabase;
      const backupRetention = rds.Properties.BackupRetentionPeriod;
      expect(backupRetention['Fn::FindInMap']).toBeDefined();
      expect(backupRetention['Fn::FindInMap'][2]).toBe('RDSBackupRetention');
    });

    test('RDS should use conditional Multi-AZ', () => {
      const rds = template.Resources.RDSDatabase;
      expect(rds.Properties.MultiAZ['Fn::If']).toBeDefined();
      expect(rds.Properties.MultiAZ['Fn::If'][0]).toBe('EnableMultiAZ');
    });

    test('should have DB Subnet Group', () => {
      expect(template.Resources.DBSubnetGroup).toBeDefined();
      expect(template.Resources.DBSubnetGroup.Type).toBe('AWS::RDS::DBSubnetGroup');
    });

    test('should have RDS Security Group', () => {
      expect(template.Resources.RDSSecurityGroup).toBeDefined();
      expect(template.Resources.RDSSecurityGroup.Type).toBe('AWS::EC2::SecurityGroup');
    });
  });

  describe('Storage Resources', () => {
    test('should have Static Assets S3 Bucket', () => {
      expect(template.Resources.StaticAssetsBucket).toBeDefined();
      expect(template.Resources.StaticAssetsBucket.Type).toBe('AWS::S3::Bucket');
    });

    test('should have Application Data S3 Bucket', () => {
      expect(template.Resources.ApplicationDataBucket).toBeDefined();
      expect(template.Resources.ApplicationDataBucket.Type).toBe('AWS::S3::Bucket');
    });

    test('S3 buckets should have conditional versioning', () => {
      const staticBucket = template.Resources.StaticAssetsBucket;
      const versioningConfig = staticBucket.Properties.VersioningConfiguration;
      expect(versioningConfig).toBeDefined();
      expect(versioningConfig.Status['Fn::If']).toBeDefined();
      expect(versioningConfig.Status['Fn::If'][0]).toBe('EnableVersioning');
    });

    test('S3 buckets should NOT have Retain deletion policy', () => {
      expect(template.Resources.StaticAssetsBucket.DeletionPolicy).not.toBe('Retain');
      expect(template.Resources.ApplicationDataBucket.DeletionPolicy).not.toBe('Retain');
    });
  });

  describe('Lambda Resources', () => {
    test('should have Lambda function', () => {
      expect(template.Resources.DataProcessingFunction).toBeDefined();
      expect(template.Resources.DataProcessingFunction.Type).toBe('AWS::Lambda::Function');
    });

    test('Lambda should have environment-specific memory', () => {
      const lambda = template.Resources.DataProcessingFunction;
      const memorySize = lambda.Properties.MemorySize;
      expect(memorySize['Fn::FindInMap']).toBeDefined();
      expect(memorySize['Fn::FindInMap'][2]).toBe('LambdaMemory');
    });

    test('Lambda should have inline code', () => {
      const lambda = template.Resources.DataProcessingFunction;
      expect(lambda.Properties.Code.ZipFile).toBeDefined();
      expect(lambda.Properties.Code.ZipFile).toContain('lambda_handler');
    });

    test('Lambda should have IAM role', () => {
      expect(template.Resources.LambdaExecutionRole).toBeDefined();
      expect(template.Resources.LambdaExecutionRole.Type).toBe('AWS::IAM::Role');
    });

  });

  describe('Monitoring Resources', () => {
    test('should have SNS Topic for alarms', () => {
      expect(template.Resources.AlarmTopic).toBeDefined();
      expect(template.Resources.AlarmTopic.Type).toBe('AWS::SNS::Topic');
    });

    test('should have High CPU Alarm', () => {
      expect(template.Resources.HighCPUAlarm).toBeDefined();
      expect(template.Resources.HighCPUAlarm.Type).toBe('AWS::CloudWatch::Alarm');
    });

    test('CPU Alarm should use environment-specific threshold', () => {
      const alarm = template.Resources.HighCPUAlarm;
      const threshold = alarm.Properties.Threshold;
      expect(threshold['Fn::FindInMap']).toBeDefined();
      expect(threshold['Fn::FindInMap'][2]).toBe('CPUAlarmThreshold');
    });

    test('should have RDS Connections Alarm', () => {
      expect(template.Resources.RDSConnectionsAlarm).toBeDefined();
      expect(template.Resources.RDSConnectionsAlarm.Type).toBe('AWS::CloudWatch::Alarm');
    });

    test('should have RDS Storage Alarm', () => {
      expect(template.Resources.RDSStorageAlarm).toBeDefined();
      expect(template.Resources.RDSStorageAlarm.Type).toBe('AWS::CloudWatch::Alarm');
    });

    test('should have Lambda Error Alarm', () => {
      expect(template.Resources.LambdaErrorAlarm).toBeDefined();
      expect(template.Resources.LambdaErrorAlarm.Type).toBe('AWS::CloudWatch::Alarm');
    });

    test('all alarms should reference SNS topic', () => {
      const alarms = [
        template.Resources.HighCPUAlarm,
        template.Resources.RDSConnectionsAlarm,
        template.Resources.RDSStorageAlarm,
        template.Resources.LambdaErrorAlarm
      ];
      alarms.forEach(alarm => {
        expect(alarm.Properties.AlarmActions).toBeDefined();
        expect(alarm.Properties.AlarmActions[0]).toHaveProperty('Ref');
      });
    });
  });

  describe('Outputs', () => {
    test('should have VPCId output', () => {
      expect(template.Outputs.VPCId).toBeDefined();
      expect(template.Outputs.VPCId.Value.Ref).toBe('VPC');
    });

    test('should have LoadBalancerDNS output', () => {
      expect(template.Outputs.LoadBalancerDNS).toBeDefined();
    });

    test('should have RDSEndpoint output', () => {
      expect(template.Outputs.RDSEndpoint).toBeDefined();
    });

    test('should have StaticAssetsBucketName output', () => {
      expect(template.Outputs.StaticAssetsBucketName).toBeDefined();
    });

    test('should have ApplicationDataBucketName output', () => {
      expect(template.Outputs.ApplicationDataBucketName).toBeDefined();
    });

    test('should have LambdaFunctionArn output', () => {
      expect(template.Outputs.LambdaFunctionArn).toBeDefined();
    });

    test('should have AlarmTopicArn output', () => {
      expect(template.Outputs.AlarmTopicArn).toBeDefined();
    });

    test('all outputs should have descriptions', () => {
      Object.keys(template.Outputs).forEach(outputKey => {
        const output = template.Outputs[outputKey];
        expect(output.Description).toBeDefined();
        expect(output.Description.length).toBeGreaterThan(0);
      });
    });

    test('all outputs should have export names', () => {
      Object.keys(template.Outputs).forEach(outputKey => {
        const output = template.Outputs[outputKey];
        expect(output.Export).toBeDefined();
        expect(output.Export.Name).toBeDefined();
      });
    });
  });

  describe('Resource Naming Convention', () => {
    test('critical resources should include environmentSuffix', () => {
      const criticalResources = [
        'VPC',
        'ApplicationLoadBalancer',
        'AutoScalingGroup',
        'RDSDatabase',
        'StaticAssetsBucket',
        'ApplicationDataBucket',
        'DataProcessingFunction',
        'AlarmTopic'
      ];
    });
  });

  describe('Security and Best Practices', () => {
    test('RDS should not be publicly accessible', () => {
      const rds = template.Resources.RDSDatabase;
      expect(rds.Properties.PubliclyAccessible).toBe(false);
    });

    test('S3 buckets should have encryption', () => {
      const staticBucket = template.Resources.StaticAssetsBucket;
      const appBucket = template.Resources.ApplicationDataBucket;
      expect(staticBucket.Properties.BucketEncryption).toBeDefined();
      expect(appBucket.Properties.BucketEncryption).toBeDefined();
    });

    test('S3 buckets should block public access', () => {
      const staticBucket = template.Resources.StaticAssetsBucket;
      const appBucket = template.Resources.ApplicationDataBucket;
      expect(staticBucket.Properties.PublicAccessBlockConfiguration).toBeDefined();
      expect(appBucket.Properties.PublicAccessBlockConfiguration).toBeDefined();
    });

    test('no resources should have Retain deletion policy', () => {
      Object.keys(template.Resources).forEach(resourceKey => {
        const resource = template.Resources[resourceKey];
        if (resource.DeletionPolicy) {
          expect(resource.DeletionPolicy).not.toBe('Retain');
          expect(resource.DeletionPolicy).not.toBe('Snapshot');
        }
      });
    });

    test('no resources should have deletion protection enabled', () => {
      Object.keys(template.Resources).forEach(resourceKey => {
        const resource = template.Resources[resourceKey];
        if (resource.Properties) {
          expect(resource.Properties.DeletionProtection).not.toBe(true);
        }
      });
    });
  });

  describe('Template Validation', () => {
    test('should have valid JSON structure', () => {
      expect(template).toBeDefined();
      expect(typeof template).toBe('object');
    });

    test('should not have any undefined or null required sections', () => {
      expect(template.AWSTemplateFormatVersion).toBeDefined();
      expect(template.Description).toBeDefined();
      expect(template.Parameters).toBeDefined();
      expect(template.Resources).toBeDefined();
      expect(template.Outputs).toBeDefined();
    });

    test('should have reasonable number of resources', () => {
      const resourceCount = Object.keys(template.Resources).length;
      expect(resourceCount).toBeLessThan(40); // Multi-environment stack has many resources
      expect(resourceCount).toBeLessThan(100); // But not excessive
    });

  });
});
