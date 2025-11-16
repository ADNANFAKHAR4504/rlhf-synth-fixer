import { CloudFormationClient } from '@aws-sdk/client-cloudformation';
import * as fs from 'fs';
import * as yaml from 'js-yaml';
import * as path from 'path';

// Define CloudFormation intrinsic function tags
const cfnSchema = yaml.CORE_SCHEMA.extend([
  new yaml.Type('!Ref', { kind: 'scalar' }),
  new yaml.Type('!GetAtt', { kind: 'scalar' }),
  new yaml.Type('!Sub', { kind: 'scalar' }),
  new yaml.Type('!Join', { kind: 'sequence' }),
  new yaml.Type('!Select', { kind: 'sequence' }),
  new yaml.Type('!Split', { kind: 'sequence' }),
  new yaml.Type('!GetAZs', { kind: 'scalar' }),
  new yaml.Type('!ImportValue', { kind: 'scalar' }),
  new yaml.Type('!If', { kind: 'sequence' }),
  new yaml.Type('!Not', { kind: 'sequence' }),
  new yaml.Type('!Equals', { kind: 'sequence' }),
  new yaml.Type('!And', { kind: 'sequence' }),
  new yaml.Type('!Or', { kind: 'sequence' }),
  new yaml.Type('!Condition', { kind: 'scalar' }),
  new yaml.Type('!FindInMap', { kind: 'sequence' }),
  new yaml.Type('!Base64', { kind: 'scalar' })
]);

describe('CloudFormation Template Unit Tests', () => {
  let template: any;
  let cfnClient: CloudFormationClient;

  beforeAll(() => {
    // Load the CloudFormation template
    const templatePath = path.join(__dirname, '..', 'lib', 'TapStack.yml');
    const templateContent = fs.readFileSync(templatePath, 'utf8');
    template = yaml.load(templateContent, { schema: cfnSchema });

    // Initialize CloudFormation client
    cfnClient = new CloudFormationClient({ region: 'us-east-1' });
  });

  describe('Template Structure', () => {
    test('Template has required sections', () => {
      expect(template).toHaveProperty('AWSTemplateFormatVersion');
      expect(template).toHaveProperty('Description');
      expect(template).toHaveProperty('Parameters');
      expect(template).toHaveProperty('Resources');
      expect(template).toHaveProperty('Outputs');
    });

    test('Template description indicates PCI DSS compliance', () => {
      expect(template.Description).toContain('PCI-DSS');
      expect(template.Description).toContain('payment');
    });

    test('Template uses proper YAML format', () => {
      // Should contain CloudFormation intrinsic functions
      const templateYaml = fs.readFileSync(path.join(__dirname, '..', 'lib', 'TapStack.yml'), 'utf8');
      expect(templateYaml).toMatch(/!Ref/);
      expect(templateYaml).toMatch(/!Sub/);
      expect(templateYaml).toMatch(/!GetAtt/);
    });
  });

  describe('Parameters', () => {
    test('EnvironmentSuffix parameter is properly configured', () => {
      expect(template.Parameters.EnvironmentSuffix).toBeDefined();
      expect(template.Parameters.EnvironmentSuffix.Type).toBe('String');
      expect(template.Parameters.EnvironmentSuffix.Default).toBe('dev');
      expect(template.Parameters.EnvironmentSuffix.AllowedPattern).toBe('[a-z0-9-]+');
    });

    test('Database secret is properly configured', () => {
      expect(template.Resources.DBSecret).toBeDefined();
      expect(template.Resources.DBSecret.Type).toBe('AWS::SecretsManager::Secret');
      expect(template.Resources.DBSecret.Properties.GenerateSecretString).toBeDefined();
      expect(template.Resources.DBSecret.Properties.GenerateSecretString.SecretStringTemplate).toEqual('{"username": "dbadmin"}');
    });
  });

  describe('VPC and Network Resources', () => {
    test('VPC is properly configured', () => {
      expect(template.Resources.PaymentVPC).toBeDefined();
      expect(template.Resources.PaymentVPC.Type).toBe('AWS::EC2::VPC');
      expect(template.Resources.PaymentVPC.Properties.CidrBlock).toBe('10.0.0.0/16');
      expect(template.Resources.PaymentVPC.Properties.EnableDnsHostnames).toBe(true);
    });

    test('Subnets are properly configured', () => {
      const subnets = ['PrivateSubnet1', 'PrivateSubnet2', 'PrivateSubnet3', 'PublicSubnet1', 'PublicSubnet2', 'PublicSubnet3'];
      subnets.forEach(subnet => {
        expect(template.Resources[subnet]).toBeDefined();
        expect(template.Resources[subnet].Type).toBe('AWS::EC2::Subnet');
        expect(template.Resources[subnet].Properties.VpcId).toEqual("PaymentVPC");
      });
    });

    test('Internet Gateway and Route Tables are configured', () => {
      expect(template.Resources.InternetGateway).toBeDefined();
      expect(template.Resources.PublicRouteTable).toBeDefined();
      expect(template.Resources.PublicRoute).toBeDefined();
    });
  });

  describe('Security Resources', () => {
    test('KMS Key for RDS is properly configured', () => {
      expect(template.Resources.RDSKMSKey).toBeDefined();
      expect(template.Resources.RDSKMSKey.Type).toBe('AWS::KMS::Key');
      expect(template.Resources.RDSKMSKey.Properties.EnableKeyRotation).toBe(true);
    });

    test('Security Groups are properly configured', () => {
      expect(template.Resources.DBSecurityGroup).toBeDefined();
      expect(template.Resources.ApplicationSecurityGroup).toBeDefined();
      expect(template.Resources.DBSecurityGroupIngress).toBeDefined();
    });
  });

  describe('Database Resources', () => {
    test('RDS Subnet Group is properly configured', () => {
      expect(template.Resources.DBSubnetGroup).toBeDefined();
      expect(template.Resources.DBSubnetGroup.Type).toBe('AWS::RDS::DBSubnetGroup');
      expect(template.Resources.DBSubnetGroup.Properties.SubnetIds).toHaveLength(3);
    });

    test('RDS Instance is properly configured', () => {
      expect(template.Resources.PaymentDatabase).toBeDefined();
      expect(template.Resources.PaymentDatabase.Type).toBe('AWS::RDS::DBInstance');
      expect(template.Resources.PaymentDatabase.Properties.Engine).toBe('postgres');
      expect(template.Resources.PaymentDatabase.Properties.MultiAZ).toBe(true);
      expect(template.Resources.PaymentDatabase.Properties.StorageEncrypted).toBe(true);
      expect(template.Resources.PaymentDatabase.Properties.BackupRetentionPeriod).toBe(30);
    });
  });

  describe('Storage Resources', () => {
    test('S3 Bucket is properly configured', () => {
      expect(template.Resources.AuditLogBucket).toBeDefined();
      expect(template.Resources.AuditLogBucket.Type).toBe('AWS::S3::Bucket');
      expect(template.Resources.AuditLogBucket.Properties.VersioningConfiguration.Status).toBe('Enabled');
      expect(template.Resources.AuditLogBucket.Properties.PublicAccessBlockConfiguration.BlockPublicAcls).toBe(true);
    });

    test('S3 Bucket Policy is configured', () => {
      expect(template.Resources.AuditLogBucketPolicy).toBeDefined();
      expect(template.Resources.AuditLogBucketPolicy.Type).toBe('AWS::S3::BucketPolicy');
    });
  });

  describe('Monitoring and Logging', () => {
    test('VPC Flow Logs are configured', () => {
      expect(template.Resources.VPCFlowLog).toBeDefined();
      expect(template.Resources.VPCFlowLog.Type).toBe('AWS::EC2::FlowLog');
      expect(template.Resources.VPCFlowLog.Properties.TrafficType).toBe('ALL');
    });

    test('CloudWatch Log Group is configured', () => {
      expect(template.Resources.ApplicationLogGroup).toBeDefined();
      expect(template.Resources.ApplicationLogGroup.Type).toBe('AWS::Logs::LogGroup');
      expect(template.Resources.ApplicationLogGroup.Properties.RetentionInDays).toBe(90);
    });

    test('CloudTrail is configured', () => {
      expect(template.Resources.PaymentCloudTrail).toBeDefined();
      expect(template.Resources.PaymentCloudTrail.Type).toBe('AWS::CloudTrail::Trail');
      expect(template.Resources.PaymentCloudTrail.Properties.IsMultiRegionTrail).toBe(true);
      expect(template.Resources.PaymentCloudTrail.Properties.EnableLogFileValidation).toBe(true);
    });
  });

  describe('IAM Resources', () => {
    test('EC2 Instance Role is properly configured', () => {
      expect(template.Resources.EC2InstanceRole).toBeDefined();
      expect(template.Resources.EC2InstanceRole.Type).toBe('AWS::IAM::Role');
      expect(template.Resources.EC2InstanceRole.Properties.AssumeRolePolicyDocument.Statement[0].Principal.Service).toBe('ec2.amazonaws.com');
    });

    test('EC2 Instance Profile is configured', () => {
      expect(template.Resources.EC2InstanceProfile).toBeDefined();
      expect(template.Resources.EC2InstanceProfile.Type).toBe('AWS::IAM::InstanceProfile');
    });
  });

  describe('Outputs', () => {
    test('All required outputs are present', () => {
      const expectedOutputs = [
        'VPCId', 'PrivateSubnet1Id', 'PrivateSubnet2Id', 'PrivateSubnet3Id',
        'DBEndpoint', 'DBPort', 'AuditLogBucketName', 'ApplicationLogGroupName',
        'EC2InstanceProfileArn', 'RDSKMSKeyId', 'ApplicationSecurityGroupId', 'DBSecurityGroupId'
      ];

      expectedOutputs.forEach(output => {
        expect(template.Outputs[output]).toBeDefined();
        expect(template.Outputs[output].Export).toBeDefined();
      });
    });
  });
});
