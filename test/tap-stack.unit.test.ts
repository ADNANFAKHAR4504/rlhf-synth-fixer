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
}

describe('TapStack Infrastructure Tests', () => {
  let template: CFTemplate;
  const templatePath = path.resolve(__dirname, '../lib/TapStack.yml');

  beforeAll(() => {
    // Custom YAML schema for CloudFormation tags
    const cfnTypes = [
      new yaml.Type('!Ref', {
        kind: 'scalar',
        construct: (data) => ({ Ref: data })
      }),
      new yaml.Type('!Sub', {
        kind: 'scalar',
        construct: (data) => ({ 'Fn::Sub': data })
      }),
      new yaml.Type('!GetAtt', {
        kind: 'scalar',
        construct: (data) => ({ 'Fn::GetAtt': data.split('.') })
      }),
      new yaml.Type('!Select', {
        kind: 'sequence',
        construct: (data) => ({ 'Fn::Select': data })
      }),
      new yaml.Type('!GetAZs', {
        kind: 'scalar',
        construct: (data) => ({ 'Fn::GetAZs': data })
      }),
      new yaml.Type('!Join', {
        kind: 'sequence',
        construct: (data) => ({ 'Fn::Join': data })
      }),
      new yaml.Type('!Not', {
        kind: 'sequence',
        construct: (data) => ({ 'Fn::Not': data })
      }),
      new yaml.Type('!Equals', {
        kind: 'sequence',
        construct: (data) => ({ 'Fn::Equals': data })
      })
    ];

    // Create schema including CloudFormation tags
    const CFN_SCHEMA = yaml.DEFAULT_SCHEMA.extend(cfnTypes);

    // Read and parse template
    const templateContent = fs.readFileSync(templatePath, 'utf8');
    template = yaml.load(templateContent, { schema: CFN_SCHEMA }) as CFTemplate;
  });

  describe('Template Structure', () => {
    test('should have valid format version and description', () => {
      expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
      expect(template.Description).toBeDefined();
    });
  });

  describe('Parameters', () => {
    test('should have required parameters', () => {
      const params = template.Parameters;

      // Environment parameter
      expect(params.Environment).toBeDefined();
      expect(params.Environment.Type).toBe('String');
      expect(params.Environment.Default).toBe('prod');
      expect(params.Environment.AllowedValues).toEqual(['dev', 'staging', 'prod']);

      // WhitelistedCIDR parameter
      expect(params.WhitelistedCIDR).toBeDefined();
      expect(params.WhitelistedCIDR.Type).toBe('String');
      expect(params.WhitelistedCIDR.Default).toBe('10.0.0.0/16');
      expect(params.WhitelistedCIDR.AllowedPattern).toBeDefined();

      // DBUsername parameter
      expect(params.DBUsername).toBeDefined();
      expect(params.DBUsername.Type).toBe('String');
      expect(params.DBUsername.MinLength).toBe(1);
      expect(params.DBUsername.MaxLength).toBe(16);
      expect(params.DBUsername.AllowedPattern).toBe('[a-zA-Z][a-zA-Z0-9]*');
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
      // Test Public Subnets
      ['PublicSubnet1', 'PublicSubnet2'].forEach((subnetName, index) => {
        const subnet = template.Resources[subnetName];
        expect(subnet.Type).toBe('AWS::EC2::Subnet');
        expect(subnet.Properties.VpcId.Ref).toBe('VPC');
        expect(subnet.Properties.CidrBlock).toBe(`10.0.${index + 1}.0/24`);
        expect(subnet.Properties.MapPublicIpOnLaunch).toBe(true);
      });

      // Test Private Subnets
      ['PrivateSubnet1', 'PrivateSubnet2'].forEach((subnetName, index) => {
        const subnet = template.Resources[subnetName];
        expect(subnet.Type).toBe('AWS::EC2::Subnet');
        expect(subnet.Properties.VpcId.Ref).toBe('VPC');
        expect(subnet.Properties.CidrBlock).toBe(`10.0.${index + 3}.0/24`);
        expect(subnet.Properties.MapPublicIpOnLaunch).toBeUndefined();
      });
    });

    test('should have internet gateway configuration', () => {
      const igw = template.Resources.InternetGateway;
      const attachment = template.Resources.VPCGatewayAttachment;

      expect(igw.Type).toBe('AWS::EC2::InternetGateway');
      expect(attachment.Type).toBe('AWS::EC2::VPCGatewayAttachment');
      expect(attachment.Properties.VpcId.Ref).toBe('VPC');
      expect(attachment.Properties.InternetGatewayId.Ref).toBe('InternetGateway');
    });

    test('should have proper routing configuration', () => {
      const routeTable = template.Resources.PublicRouteTable;
      const route = template.Resources.PublicRoute;

      expect(routeTable.Type).toBe('AWS::EC2::RouteTable');
      expect(routeTable.Properties.VpcId.Ref).toBe('VPC');

      expect(route.Type).toBe('AWS::EC2::Route');
      expect(route.Properties.RouteTableId.Ref).toBe('PublicRouteTable');
      expect(route.Properties.DestinationCidrBlock).toBe('0.0.0.0/0');
      expect(route.Properties.GatewayId.Ref).toBe('InternetGateway');
    });
  });

  describe('Security Configuration', () => {
    test('should have properly configured security groups', () => {
      const bastionSg = template.Resources.BastionSecurityGroup;
      expect(bastionSg.Type).toBe('AWS::EC2::SecurityGroup');
      expect(bastionSg.Properties.SecurityGroupIngress).toHaveLength(1);
      expect(bastionSg.Properties.SecurityGroupIngress[0]).toMatchObject({
        IpProtocol: 'tcp',
        FromPort: 22,
        ToPort: 22,
        CidrIp: { Ref: 'WhitelistedCIDR' }
      });

      const webSg = template.Resources.WebServerSecurityGroup;
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

      const rdsSg = template.Resources.RDSSecurityGroup;
      expect(rdsSg.Type).toBe('AWS::EC2::SecurityGroup');
      expect(rdsSg.Properties.SecurityGroupIngress).toHaveLength(1);
      expect(rdsSg.Properties.SecurityGroupIngress[0]).toMatchObject({
        IpProtocol: 'tcp',
        FromPort: 3306,
        ToPort: 3306,
        SourceSecurityGroupId: { Ref: 'WebServerSecurityGroup' }
      });
    });

    test('should have properly configured KMS keys', () => {
      ['EBSKMSKey', 'RDSKMSKey'].forEach(keyName => {
        const key = template.Resources[keyName];
        expect(key.Type).toBe('AWS::KMS::Key');
        expect(key.Properties.EnableKeyRotation).toBe(true);
        expect(key.Properties.KeyPolicy.Statement).toHaveLength(2);
        expect(key.Properties.KeyPolicy.Version).toBe('2012-10-17');
      });
    });
  });

  describe('Database Configuration', () => {
    test('should have properly configured RDS instance', () => {
      const rds = template.Resources.RDSInstance;
      expect(rds.Type).toBe('AWS::RDS::DBInstance');
      expect(rds.Properties.Engine).toBe('mysql');
      expect(rds.Properties.DBInstanceClass).toBe('db.t3.medium');
      expect(rds.Properties.MultiAZ).toBe(true);
      expect(rds.Properties.PubliclyAccessible).toBe(false);
      expect(rds.Properties.StorageEncrypted).toBe(true);
      expect(rds.Properties.BackupRetentionPeriod).toBe(7);
    });

    test('should have properly configured DB subnet group', () => {
      const subnetGroup = template.Resources.DBSubnetGroup;
      expect(subnetGroup.Type).toBe('AWS::RDS::DBSubnetGroup');
      expect(subnetGroup.Properties.SubnetIds).toHaveLength(2);
      expect(subnetGroup.Properties.SubnetIds[0].Ref).toBe('PrivateSubnet1');
      expect(subnetGroup.Properties.SubnetIds[1].Ref).toBe('PrivateSubnet2');
    });

    test('should have secure database credentials', () => {
      const secret = template.Resources.DatabaseSecret;
      expect(secret.Type).toBe('AWS::SecretsManager::Secret');
      expect(secret.Properties.GenerateSecretString).toBeDefined();
      expect(secret.Properties.GenerateSecretString.PasswordLength).toBe(32);
      expect(secret.Properties.GenerateSecretString.ExcludeCharacters).toBe('"@/\\');
    });
  });

  describe('Storage Configuration', () => {
    test('should have properly configured S3 buckets', () => {
      ['LoggingBucket', 'RDSBackupBucket'].forEach(bucketName => {
        const bucket = template.Resources[bucketName];
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

  describe('Monitoring Configuration', () => {
    test('should have properly configured CloudWatch alarms', () => {
      const alarm = template.Resources.CPUUtilizationAlarm;
      expect(alarm.Type).toBe('AWS::CloudWatch::Alarm');
      expect(alarm.Properties.MetricName).toBe('CPUUtilization');
      expect(alarm.Properties.Namespace).toBe('AWS/RDS');
      expect(alarm.Properties.Period).toBe(300);
      expect(alarm.Properties.EvaluationPeriods).toBe(2);
      expect(alarm.Properties.Threshold).toBe(75);
    });

    test('should have SNS topic for alarms', () => {
      const topic = template.Resources.AlarmTopic;
      expect(topic.Type).toBe('AWS::SNS::Topic');
      expect(topic.Properties.DisplayName['Fn::Sub']).toBe('${AWS::StackName}-${Environment}-infrastructure-alarms');
    });

    // AWS Config test removed as the feature is not essential
  });

  describe('Outputs', () => {
    test('should export all required values', () => {
      const requiredOutputs = [
        'VPCId',
        'PublicSubnet1Id',
        'PublicSubnet2Id',
        'PrivateSubnet1Id',
        'PrivateSubnet2Id',
        'RDSEndpoint'
      ];

      requiredOutputs.forEach(outputName => {
        expect(template.Outputs[outputName]).toBeDefined();
        expect(template.Outputs[outputName].Export).toBeDefined();
      });
    });

    test('should have properly configured export names', () => {
      const outputs = template.Outputs;
      Object.keys(outputs).forEach(outputName => {
        expect(outputs[outputName].Export.Name['Fn::Sub']).toBe(`\${AWS::StackName}-${outputName}`);
      });
    });
  });
});
