import { beforeAll, describe, expect, test } from '@jest/globals';
import * as fs from 'fs';
import * as yaml from 'js-yaml';
import * as path from 'path';

interface CFResource {
  Type: string;
  Properties: Record<string, any>;
  DeletionPolicy?: string;
  UpdateReplacePolicy?: string;
  Condition?: string;
}

interface CFTemplate {
  AWSTemplateFormatVersion?: string;
  Description?: string;
  Parameters: Record<string, any>;
  Resources: Record<string, CFResource>;
  Outputs: Record<string, any>;
  Conditions?: Record<string, any>;
}

describe('TapStack Infrastructure Tests', () => {
  let template: CFTemplate;
  const templatePath = path.resolve(__dirname, '../lib/TapStack.yml');

  beforeAll(() => {
    // Custom YAML schema for CloudFormation tags
    const cfnTags = {
      '!Ref': (value: string) => ({ Ref: value }),
      '!Sub': (value: string) => ({ 'Fn::Sub': value }),
      '!GetAtt': (value: string[]) => ({ 'Fn::GetAtt': value }),
      '!Select': (value: any[]) => ({ 'Fn::Select': value }),
      '!GetAZs': (value: string) => ({ 'Fn::GetAZs': value }),
      '!Not': (value: any[]) => ({ 'Fn::Not': value })
    };

    // Create YAML types for each CloudFormation tag
    const cfnTypes = Object.entries(cfnTags).map(([tag, construct]) =>
      new yaml.Type(tag, {
        kind: 'scalar',
        construct: construct
      })
    );

    // Create a custom schema including CloudFormation tags
    const CFN_SCHEMA = yaml.DEFAULT_SCHEMA.extend(cfnTypes);

    // Read and parse the template with custom schema
    const templateContent = fs.readFileSync(templatePath, 'utf8');
    template = yaml.load(templateContent, { schema: CFN_SCHEMA }) as CFTemplate;
  });

  describe('Parameters', () => {
    test('should have required parameters', () => {
      const params = template.Parameters;
      expect(params.Environment).toBeDefined();
      expect(params.Environment.Type).toBe('String');
      expect(params.Environment.AllowedValues).toEqual(['dev', 'staging', 'prod']);

      expect(params.WhitelistedCIDR).toBeDefined();
      expect(params.WhitelistedCIDR.Type).toBe('String');
      expect(params.WhitelistedCIDR.Default).toBe('10.0.0.0/16');

      expect(params.DBUsername).toBeDefined();
      expect(params.DBUsername.Type).toBe('String');
      expect(params.DBUsername.MinLength).toBe(1);
      expect(params.DBUsername.MaxLength).toBe(16);
    });
  });

  describe('Network Infrastructure', () => {
    test('should have properly configured VPC', () => {
      const vpc = template.Resources.VPC;
      expect(vpc.Type).toBe('AWS::EC2::VPC');
      expect(vpc.Properties.CidrBlock).toBe('10.0.0.0/16');
      expect(vpc.Properties.EnableDnsHostnames).toBe(true);
      expect(vpc.Properties.EnableDnsSupport).toBe(true);
    });

    test('should have properly configured subnets', () => {
      const publicSubnet1 = template.Resources.PublicSubnet1;
      const publicSubnet2 = template.Resources.PublicSubnet2;
      const privateSubnet1 = template.Resources.PrivateSubnet1;
      const privateSubnet2 = template.Resources.PrivateSubnet2;

      [publicSubnet1, publicSubnet2].forEach((subnet, index) => {
        expect(subnet.Type).toBe('AWS::EC2::Subnet');
        expect(subnet.Properties.MapPublicIpOnLaunch).toBe(true);
        expect(subnet.Properties.CidrBlock).toBe(`10.0.${index + 1}.0/24`);
      });

      [privateSubnet1, privateSubnet2].forEach((subnet, index) => {
        expect(subnet.Type).toBe('AWS::EC2::Subnet');
        expect(subnet.Properties.MapPublicIpOnLaunch).toBeUndefined();
        expect(subnet.Properties.CidrBlock).toBe(`10.0.${index + 3}.0/24`);
      });
    });
  });

  describe('Security Groups', () => {
    test('should have properly configured security groups', () => {
      const bastionSg = template.Resources.BastionSecurityGroup;
      const webServerSg = template.Resources.WebServerSecurityGroup;
      const rdsSg = template.Resources.RDSSecurityGroup;

      expect(bastionSg.Type).toBe('AWS::EC2::SecurityGroup');
      expect(bastionSg.Properties.SecurityGroupIngress).toHaveLength(1);
      expect(bastionSg.Properties.SecurityGroupIngress[0]).toMatchObject({
        IpProtocol: 'tcp',
        FromPort: 22,
        ToPort: 22
      });

      expect(webServerSg.Type).toBe('AWS::EC2::SecurityGroup');
      expect(webServerSg.Properties.SecurityGroupIngress).toHaveLength(2);
      expect(webServerSg.Properties.SecurityGroupIngress).toContainEqual(
        expect.objectContaining({
          IpProtocol: 'tcp',
          FromPort: 80,
          ToPort: 80,
          CidrIp: '0.0.0.0/0'
        })
      );

      expect(rdsSg.Type).toBe('AWS::EC2::SecurityGroup');
      expect(rdsSg.Properties.SecurityGroupIngress).toHaveLength(1);
      expect(rdsSg.Properties.SecurityGroupIngress[0]).toMatchObject({
        IpProtocol: 'tcp',
        FromPort: 3306,
        ToPort: 3306
      });
    });
  });

  describe('Database Configuration', () => {
    test('should have properly configured RDS instance', () => {
      const rds = template.Resources.RDSInstance;
      expect(rds.Type).toBe('AWS::RDS::DBInstance');
      expect(rds.Properties.Engine).toBe('mysql');
      expect(rds.Properties.MultiAZ).toBe(true);
      expect(rds.Properties.PubliclyAccessible).toBe(false);
      expect(rds.Properties.StorageEncrypted).toBe(true);
      expect(rds.Properties.BackupRetentionPeriod).toBe(7);
    });

    test('should have database secret', () => {
      const secret = template.Resources.DatabaseSecret;
      expect(secret.Type).toBe('AWS::SecretsManager::Secret');
      expect(secret.Properties.GenerateSecretString).toBeDefined();
      expect(secret.Properties.GenerateSecretString.PasswordLength).toBe(32);
    });
  });

  describe('Storage Configuration', () => {
    test('should have properly configured S3 buckets', () => {
      const loggingBucket = template.Resources.LoggingBucket;
      const rdsBackupBucket = template.Resources.RDSBackupBucket;

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
      });
    });
  });

  describe('Monitoring Configuration', () => {
    test('should have properly configured CloudWatch alarms', () => {
      const cpuAlarm = template.Resources.CPUUtilizationAlarm;
      expect(cpuAlarm.Type).toBe('AWS::CloudWatch::Alarm');
      expect(cpuAlarm.Properties.MetricName).toBe('CPUUtilization');
      expect(cpuAlarm.Properties.Period).toBe(300);
      expect(cpuAlarm.Properties.EvaluationPeriods).toBe(2);
      expect(cpuAlarm.Properties.Threshold).toBe(75);
    });

    test('should have properly configured AWS Config components', () => {
      // Check Lambda function for checking Config Recorder existence
      const checkFunction = template.Resources.CheckConfigRecorderFunction;
      expect(checkFunction.Type).toBe('AWS::Lambda::Function');
      expect(checkFunction.Properties.Runtime).toBe('python3.9');
      expect(checkFunction.Properties.Handler).toBe('index.handler');

      // Check Lambda execution role
      const lambdaRole = template.Resources.LambdaExecutionRole;
      expect(lambdaRole.Type).toBe('AWS::IAM::Role');
      expect(lambdaRole.Properties.ManagedPolicyArns).toContain(
        'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole'
      );
      expect(lambdaRole.Properties.Policies[0].PolicyDocument.Statement[0].Action)
        .toContain('config:DescribeConfigurationRecorders');

      // Check Config Recorder (conditional resource)
      const configRecorder = template.Resources.ConfigRecorder;
      expect(configRecorder.Type).toBe('AWS::Config::ConfigurationRecorder');
      expect(configRecorder.Condition).toBe('CreateConfigRecorder');
      expect(configRecorder.Properties.RecordingGroup.AllSupported).toBe(true);
      expect(configRecorder.Properties.RecordingGroup.IncludeGlobalResourceTypes).toBe(true);

      // Check Config Role (conditional resource)
      const configRole = template.Resources.ConfigRole;
      expect(configRole.Type).toBe('AWS::IAM::Role');
      expect(configRole.Condition).toBe('CreateConfigRecorder');
      expect(configRole.Properties.ManagedPolicyArns).toContain(
        'arn:aws:iam::aws:policy/service-role/AWS_ConfigRole'
      );

      // Check Custom Resource for Config Recorder existence check
      const configRecorderExists = template.Resources.ConfigRecorderExists;
      expect(configRecorderExists.Type).toBe('Custom::ConfigRecorderExists');
      expect(configRecorderExists.Properties).toBeDefined();
    });
  });

  describe('Outputs', () => {
    test('should export all required values', () => {
      const outputs = template.Outputs;
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
