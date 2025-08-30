import { describe, expect, test } from '@jest/globals';
import * as fs from 'fs';
import * as yaml from 'js-yaml';
import * as path from 'path';

interface CFResource {
  Type: string;
  Properties: Record<string, any>;
  DeletionPolicy?: string;
  UpdateReplacePolicy?: string;
}

interface CFTemplate {
  Parameters: Record<string, any>;
  Resources: Record<string, CFResource>;
  Outputs: Record<string, any>;
}

describe('TapStack Infrastructure Tests', () => {
  const yamlTemplate = yaml.load(fs.readFileSync(path.resolve(__dirname, '../lib/TapStack.yml'), 'utf8')) as CFTemplate;

  describe('Parameters', () => {
    test('should have required parameters', () => {
      const params = yamlTemplate.Parameters;
      expect(params.Environment).toBeDefined();
      expect(params.Environment.Type).toBe('String');
      expect(params.Environment.AllowedValues).toEqual(['dev', 'staging', 'prod']);

      expect(params.WhitelistedCIDR).toBeDefined();
      expect(params.WhitelistedCIDR.Type).toBe('String');
      expect(params.WhitelistedCIDR.AllowedPattern).toBeDefined();

      expect(params.DBUsername).toBeDefined();
      expect(params.DBUsername.Type).toBe('String');
      expect(params.DBUsername.MinLength).toBe(1);
      expect(params.DBUsername.MaxLength).toBe(16);
    });
  });

  describe('Network Infrastructure', () => {
    test('should have properly configured VPC', () => {
      const vpc = yamlTemplate.Resources.VPC;
      expect(vpc.Type).toBe('AWS::EC2::VPC');
      expect(vpc.Properties.CidrBlock).toBe('10.0.0.0/16');
      expect(vpc.Properties.EnableDnsHostnames).toBe(true);
      expect(vpc.Properties.EnableDnsSupport).toBe(true);
    });

    test('should have properly configured subnets', () => {
      const publicSubnet1 = yamlTemplate.Resources.PublicSubnet1;
      const publicSubnet2 = yamlTemplate.Resources.PublicSubnet2;
      const privateSubnet1 = yamlTemplate.Resources.PrivateSubnet1;
      const privateSubnet2 = yamlTemplate.Resources.PrivateSubnet2;

      // Public Subnets
      [publicSubnet1, publicSubnet2].forEach((subnet, index) => {
        expect(subnet.Type).toBe('AWS::EC2::Subnet');
        expect(subnet.Properties.MapPublicIpOnLaunch).toBe(true);
        expect(subnet.Properties.CidrBlock).toBe(`10.0.${index + 1}.0/24`);
      });

      // Private Subnets
      [privateSubnet1, privateSubnet2].forEach((subnet, index) => {
        expect(subnet.Type).toBe('AWS::EC2::Subnet');
        expect(subnet.Properties.MapPublicIpOnLaunch).toBeUndefined();
        expect(subnet.Properties.CidrBlock).toBe(`10.0.${index + 3}.0/24`);
      });
    });
  });

  describe('Security Groups', () => {
    test('should have properly configured bastion security group', () => {
      const bastionSg = yamlTemplate.Resources.BastionSecurityGroup;
      expect(bastionSg.Type).toBe('AWS::EC2::SecurityGroup');
      expect(bastionSg.Properties.SecurityGroupIngress).toHaveLength(1);
      expect(bastionSg.Properties.SecurityGroupIngress[0]).toEqual({
        IpProtocol: 'tcp',
        FromPort: 22,
        ToPort: 22,
        CidrIp: { Ref: 'WhitelistedCIDR' }
      });
    });

    test('should have properly configured web server security group', () => {
      const webSg = yamlTemplate.Resources.WebServerSecurityGroup;
      expect(webSg.Type).toBe('AWS::EC2::SecurityGroup');
      expect(webSg.Properties.SecurityGroupIngress).toHaveLength(2);
      expect(webSg.Properties.SecurityGroupIngress).toContainEqual({
        IpProtocol: 'tcp',
        FromPort: 80,
        ToPort: 80,
        CidrIp: '0.0.0.0/0'
      });
      expect(webSg.Properties.SecurityGroupIngress).toContainEqual({
        IpProtocol: 'tcp',
        FromPort: 443,
        ToPort: 443,
        CidrIp: '0.0.0.0/0'
      });
    });

    test('should have properly configured RDS security group', () => {
      const rdsSg = yamlTemplate.Resources.RDSSecurityGroup;
      expect(rdsSg.Type).toBe('AWS::EC2::SecurityGroup');
      expect(rdsSg.Properties.SecurityGroupIngress).toHaveLength(1);
      expect(rdsSg.Properties.SecurityGroupIngress[0]).toEqual({
        IpProtocol: 'tcp',
        FromPort: 3306,
        ToPort: 3306,
        SourceSecurityGroupId: { Ref: 'WebServerSecurityGroup' }
      });
    });
  });

  describe('Database Configuration', () => {
    test('should have properly configured RDS instance', () => {
      const rds = yamlTemplate.Resources.RDSInstance;
      expect(rds.Type).toBe('AWS::RDS::DBInstance');
      expect(rds.Properties.Engine).toBe('mysql');
      expect(rds.Properties.MultiAZ).toBe(true);
      expect(rds.Properties.PubliclyAccessible).toBe(false);
      expect(rds.Properties.StorageEncrypted).toBe(true);
      expect(rds.Properties.BackupRetentionPeriod).toBe(7);
    });

    test('should have secure database credentials', () => {
      const dbSecret = yamlTemplate.Resources.DatabaseSecret;
      expect(dbSecret.Type).toBe('AWS::SecretsManager::Secret');
      expect(dbSecret.Properties.GenerateSecretString).toBeDefined();
      expect(dbSecret.Properties.GenerateSecretString.PasswordLength).toBe(32);
    });
  });

  describe('Storage Configuration', () => {
    test('should have properly configured S3 buckets', () => {
      const loggingBucket = yamlTemplate.Resources.LoggingBucket;
      const rdsBackupBucket = yamlTemplate.Resources.RDSBackupBucket;

      [loggingBucket, rdsBackupBucket].forEach(bucket => {
        expect(bucket.Type).toBe('AWS::S3::Bucket');
        expect(bucket.DeletionPolicy).toBe('Retain');
        expect(bucket.UpdateReplacePolicy).toBe('Retain');
        expect(bucket.Properties.BucketEncryption.ServerSideEncryptionConfiguration[0]
          .ServerSideEncryptionByDefault.SSEAlgorithm).toBe('AES256');
        expect(bucket.Properties.PublicAccessBlockConfiguration).toEqual({
          BlockPublicAcls: true,
          BlockPublicPolicy: true,
          IgnorePublicAcls: true,
          RestrictPublicBuckets: true
        });
        expect(bucket.Properties.VersioningConfiguration.Status).toBe('Enabled');
      });
    });
  });

  describe('Monitoring and Compliance', () => {
    test('should have properly configured CloudWatch alarms', () => {
      const cpuAlarm = yamlTemplate.Resources.CPUUtilizationAlarm;
      expect(cpuAlarm.Type).toBe('AWS::CloudWatch::Alarm');
      expect(cpuAlarm.Properties.MetricName).toBe('CPUUtilization');
      expect(cpuAlarm.Properties.Period).toBe(300);
      expect(cpuAlarm.Properties.EvaluationPeriods).toBe(2);
      expect(cpuAlarm.Properties.Threshold).toBe(75);
    });

    test('should have properly configured AWS Config', () => {
      const configRecorder = yamlTemplate.Resources.ConfigRecorder;
      const configRole = yamlTemplate.Resources.ConfigRole;

      expect(configRecorder.Type).toBe('AWS::Config::ConfigurationRecorder');
      expect(configRecorder.Properties.RecordingGroup.AllSupported).toBe(true);
      expect(configRecorder.Properties.RecordingGroup.IncludeGlobalResourceTypes).toBe(true);

      expect(configRole.Type).toBe('AWS::IAM::Role');
      expect(configRole.Properties.ManagedPolicyArns).toContain(
        'arn:aws:iam::aws:policy/service-role/AWS_ConfigRole'
      );
    });
  });

  describe('Outputs', () => {
    test('should export all required values', () => {
      const outputs = yamlTemplate.Outputs;
      const requiredOutputs = [
        'VPCId',
        'PublicSubnet1Id',
        'PublicSubnet2Id',
        'PrivateSubnet1Id',
        'PrivateSubnet2Id',
        'RDSEndpoint',
        'LoggingBucketName',
        'RDSBackupBucketName'
      ];

      requiredOutputs.forEach(output => {
        expect(outputs[output]).toBeDefined();
        expect(outputs[output].Export).toBeDefined();
      });
    });
  });
});
