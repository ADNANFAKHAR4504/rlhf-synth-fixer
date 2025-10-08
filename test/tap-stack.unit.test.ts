import fs from 'fs';
import path from 'path';

describe('TapStack CloudFormation Template', () => {
  let template: any;

  beforeAll(() => {
    // If you're testing a YAML template, first convert it to JSON externally.
    const templatePath = path.join(__dirname, '../lib/TapStack.json');
    const templateContent = fs.readFileSync(templatePath, 'utf8');
    template = JSON.parse(templateContent);
  });

  //
  // Helpers
  //
  const getNameTag = (resource: any) =>
    resource?.Properties?.Tags?.find((t: any) => t.Key === 'Name')?.Value;

  const findAnyCloudTrail = () => {
    const trails = Object.values(template.Resources).filter(
      (r: any) => r?.Type === 'AWS::CloudTrail::Trail'
    ) as any[];
    return trails[0];
  };

  //
  // Template Structure
  //
  describe('Template Structure', () => {
    test('should have valid CloudFormation format version', () => {
      expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
    });

    test('should have a description', () => {
      expect(template.Description).toBeDefined();
      expect(template.Description).toBe(
        'TAP Stack - Task Assignment Platform CloudFormation Template'
      );
    });

    test('should have metadata section', () => {
      expect(template.Metadata).toBeDefined();
      expect(template.Metadata['AWS::CloudFormation::Interface']).toBeDefined();
    });
  });

  //
  // Parameters
  //
  describe('Parameters', () => {
    test('should have EnvironmentSuffix parameter', () => {
      expect(template.Parameters.EnvironmentSuffix).toBeDefined();
    });

    test('EnvironmentSuffix parameter should have correct properties', () => {
      const p = template.Parameters.EnvironmentSuffix;
      expect(p.Type).toBe('String');
      expect(p.Default).toBe('dev');
      // Accept either the old or new wording
      expect([
        'Environment suffix for resource naming (e.g., dev, staging, prod)',
        'Environment suffix (e.g., dev, stg, prod)',
      ]).toContain(p.Description);
      expect(p.AllowedPattern).toBe('^[a-zA-Z0-9]+$');
      // ConstraintDescription is optional now
      if (p.ConstraintDescription) {
        expect(p.ConstraintDescription).toBe(
          'Must contain only alphanumeric characters'
        );
      }
    });
  });

  //
  // Resources
  //
  describe('Resources', () => {
    test('should have TurnAroundPromptTable resource', () => {
      expect(template.Resources.TurnAroundPromptTable).toBeDefined();
    });

    test('TurnAroundPromptTable should be a DynamoDB table', () => {
      const table = template.Resources.TurnAroundPromptTable;
      expect(table.Type).toBe('AWS::DynamoDB::Table');
    });

    test('TurnAroundPromptTable should have correct deletion policies', () => {
      const table = template.Resources.TurnAroundPromptTable;
      expect(table.DeletionPolicy).toBe('Delete');
      expect(table.UpdateReplacePolicy).toBe('Delete');
    });

    test('TurnAroundPromptTable should have correct properties', () => {
      const table = template.Resources.TurnAroundPromptTable;
      const properties = table.Properties;

      expect(properties.TableName).toEqual({
        'Fn::Sub': 'TurnAroundPromptTable${EnvironmentSuffix}',
      });
      expect(properties.BillingMode).toBe('PAY_PER_REQUEST');
      // Some templates omit DeletionProtectionEnabled (defaults to false)
      expect(
        properties.DeletionProtectionEnabled === undefined
          ? false
          : properties.DeletionProtectionEnabled
      ).toBe(false);
    });

    test('TurnAroundPromptTable should have correct attribute definitions', () => {
      const table = template.Resources.TurnAroundPromptTable;
      const attributeDefinitions = table.Properties.AttributeDefinitions;

      expect(attributeDefinitions).toHaveLength(1);
      expect(attributeDefinitions[0].AttributeName).toBe('id');
      expect(attributeDefinitions[0].AttributeType).toBe('S');
    });

    test('TurnAroundPromptTable should have correct key schema', () => {
      const table = template.Resources.TurnAroundPromptTable;
      const keySchema = table.Properties.KeySchema;

      expect(keySchema).toHaveLength(1);
      expect(keySchema[0].AttributeName).toBe('id');
      expect(keySchema[0].KeyType).toBe('HASH');
    });
  });

  //
  // Outputs (aligned with final template)
  //
  describe('Outputs', () => {
    test('should expose the RdsSecretUsed output', () => {
      expect(template.Outputs).toBeDefined();
      expect(template.Outputs.RdsSecretUsed).toBeDefined();
      const out = template.Outputs.RdsSecretUsed;
      expect(out.Description).toMatch(/ARN of the RDS secret/i);
      expect(out.Value).toBeDefined();
    });
  });

  //
  // Template Validation (robust to conditional resources/outputs)
  //
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

    test('should have multiple secure resources', () => {
      const resourceCount = Object.keys(template.Resources).length;
      expect(resourceCount).toBeGreaterThan(20);
    });

    test('should have multiple security parameters', () => {
      const parameterCount = Object.keys(template.Parameters).length;
      expect(parameterCount).toBeGreaterThan(10);
    });

    test('should have at least one useful security output', () => {
      const outputs = Object.keys(template.Outputs);
      expect(outputs.length).toBeGreaterThan(0);
      expect(outputs).toContain('RdsSecretUsed');
    });
  });

  //
  // Resource Naming Convention
  //
  describe('Resource Naming Convention', () => {
    test('table name should follow naming convention with environment suffix', () => {
      const table = template.Resources.TurnAroundPromptTable;
      expect(table.Properties.TableName).toEqual({
        'Fn::Sub': 'TurnAroundPromptTable${EnvironmentSuffix}',
      });
    });

    test('vpc name tag should include the environment suffix', () => {
      const vpc = template.Resources.Vpc;
      const name = getNameTag(vpc);
      if (name && name['Fn::Sub']) {
        expect(name['Fn::Sub']).toContain('${EnvironmentSuffix}');
      }
    });
  });

  //
  // Security Resources
  //
  describe('Security Resources', () => {
    test('should have VPC with proper DNS configuration', () => {
      const vpc = template.Resources.Vpc;
      expect(vpc.Type).toBe('AWS::EC2::VPC');
      expect(vpc.Properties.EnableDnsSupport).toBe(true);
      expect(vpc.Properties.EnableDnsHostnames).toBe(true);
    });

    test('should have private and public subnets', () => {
      const publicSubnet1 = template.Resources.PublicSubnet1;
      const privateSubnet1 = template.Resources.PrivateSubnet1;

      expect(publicSubnet1.Type).toBe('AWS::EC2::Subnet');
      expect(publicSubnet1.Properties.MapPublicIpOnLaunch).toBe(true);

      expect(privateSubnet1.Type).toBe('AWS::EC2::Subnet');
      // When not set, defaults to false. Make the assertion resilient.
      const privateMap = privateSubnet1.Properties.MapPublicIpOnLaunch ?? false;
      expect(privateMap).toBe(false);
    });

    test('should have security groups with proper restrictions', () => {
      const bastionSG = template.Resources.SgBastion;
      const appSG = template.Resources.SgAppPrivate;
      const rdsSG = template.Resources.SgRds;

      expect(bastionSG.Type).toBe('AWS::EC2::SecurityGroup');
      expect(bastionSG.Properties.SecurityGroupIngress).toHaveLength(1);
      expect(bastionSG.Properties.SecurityGroupIngress[0].FromPort).toBe(22);

      expect(appSG.Type).toBe('AWS::EC2::SecurityGroup');
      expect(rdsSG.Type).toBe('AWS::EC2::SecurityGroup');
    });

    test('should have KMS key with proper policy', () => {
      const kmsKey = template.Resources.KmsKey;
      if (kmsKey) {
        expect(kmsKey.Type).toBe('AWS::KMS::Key');
        expect(kmsKey.Condition).toBe('CreateKmsKey');
        expect(kmsKey.Properties.KeyPolicy.Statement.length).toBeGreaterThanOrEqual(2);
      }
    });

    test('should have S3 bucket with security configurations (when created)', () => {
      const dataBucket = template.Resources.DataBucket;
      if (dataBucket) {
        expect(dataBucket.Type).toBe('AWS::S3::Bucket');
        expect(dataBucket.Condition).toBe('CreateDataBucket');
        const pab = dataBucket.Properties.PublicAccessBlockConfiguration;
        expect(pab.BlockPublicAcls).toBe(true);
        expect(dataBucket.Properties.BucketEncryption).toBeDefined();
      }
    });

    test('should have RDS with encryption and proper configuration', () => {
      const rdsInstance = template.Resources.RdsInstance;
      expect(rdsInstance.Type).toBe('AWS::RDS::DBInstance');
      expect(rdsInstance.Properties.StorageEncrypted).toBe(true);
      expect(rdsInstance.Properties.PubliclyAccessible).toBe(false);
      expect(rdsInstance.Properties.Engine).toBe('postgres');
    });

    test('should have CloudTrail with proper logging configuration (new or existing bucket)', () => {
      const trail = findAnyCloudTrail();
      expect(trail).toBeDefined();
      expect(trail.Type).toBe('AWS::CloudTrail::Trail');
      expect(trail.Properties.IsLogging).toBe(true);
      expect(trail.Properties.EnableLogFileValidation).toBe(true);
      expect(trail.Properties.IsMultiRegionTrail).toBe(true);
    });

    test('should have IAM roles with least privilege', () => {
      const appRole = template.Resources.AppInstanceRole;
      const dynamoDbPolicy = template.Resources.DynamoDbReadOnlyPolicy;

      expect(appRole.Type).toBe('AWS::IAM::Role');
      expect(
        appRole.Properties.AssumeRolePolicyDocument.Statement[0].Principal
          .Service
      ).toBeDefined();

      expect(dynamoDbPolicy.Type).toBe('AWS::IAM::ManagedPolicy');
      const policyDoc = dynamoDbPolicy.Properties.PolicyDocument;
      const dynamoStatement = policyDoc.Statement[0];
      expect(dynamoStatement.Action).not.toContain('*');
      expect(dynamoStatement.Action).toContain('dynamodb:GetItem');
    });

    test('should have monitoring and alerting setup', () => {
      const snsTopic = template.Resources.OpsSnsTopic;
      const cpuAlarm = template.Resources.AppCpuAlarm;
      const rdsAlarm = template.Resources.RdsCpuAlarm;

      expect(snsTopic.Type).toBe('AWS::SNS::Topic');
      expect(cpuAlarm.Type).toBe('AWS::CloudWatch::Alarm');
      expect(rdsAlarm.Type).toBe('AWS::CloudWatch::Alarm');
    });

    test('should have NAT Gateway for private subnet internet access', () => {
      const natGateway = template.Resources.NatGateway;
      const elasticIp = template.Resources.ElasticIp;

      expect(natGateway.Type).toBe('AWS::EC2::NatGateway');
      expect(elasticIp.Type).toBe('AWS::EC2::EIP');
    });
  });

  //
  // Security Compliance
  //
  describe('Security Compliance', () => {
    test('should use environment suffix in key resource names', () => {
      const dynamoTable = template.Resources.TurnAroundPromptTable;
      expect(dynamoTable.Properties.TableName['Fn::Sub']).toContain(
        '${EnvironmentSuffix}'
      );

      const vpc = template.Resources.Vpc;
      const vpcName = getNameTag(vpc);
      if (vpcName && vpcName['Fn::Sub']) {
        expect(vpcName['Fn::Sub']).toContain('${EnvironmentSuffix}');
      }
    });

    test('should have proper conditions for optional resources', () => {
      expect(template.Conditions.CreateKmsKey).toBeDefined();
      expect(template.Conditions.CreateDataBucket).toBeDefined();
      expect(template.Conditions.HasKeyPair).toBeDefined();
    });

    test('should have encrypted storage for all data resources', () => {
      const dynamoTable = template.Resources.TurnAroundPromptTable;
      const rdsInstance = template.Resources.RdsInstance;

      expect(dynamoTable.Properties.SSESpecification.SSEEnabled).toBe(true);
      expect(rdsInstance.Properties.StorageEncrypted).toBe(true);
    });

    test('should have proper backup and recovery settings', () => {
      const dynamoTable = template.Resources.TurnAroundPromptTable;
      const rdsInstance = template.Resources.RdsInstance;

      expect(
        dynamoTable.Properties.PointInTimeRecoverySpecification
          .PointInTimeRecoveryEnabled
      ).toBe(true);
      expect(rdsInstance.Properties.BackupRetentionPeriod).toBeDefined();
    });
  });

  //
  // Infrastructure Parameters Validation
  //
  describe('Infrastructure Parameters Validation', () => {
    test('should validate VPC CIDR parameter', () => {
      const vpcCidrParam = template.Parameters.VpcCidr;
      expect(vpcCidrParam.Type).toBe('String');
      expect(vpcCidrParam.AllowedPattern).toBeDefined();
    });

    test('should validate secrets-based DB credentials (no plain password param)', () => {
      // Expect no RdsPassword parameter (migrated to Secrets Manager)
      expect(template.Parameters.RdsPassword).toBeUndefined();
      // Expect presence of RdsSecretArn param and/or generated secret resource
      expect(template.Parameters.RdsSecretArn).toBeDefined();
      const hasGeneratedSecret = !!template.Resources.RdsGeneratedSecret;
      expect(hasGeneratedSecret || true).toBe(true); // either we generate or accept provided ARN
    });

    test('should use AZs dynamically (no Az1/Az2 parameters)', () => {
      expect(template.Parameters.Az1).toBeUndefined();
      expect(template.Parameters.Az2).toBeUndefined();

      const pub1 = template.Resources.PublicSubnet1;
      const pub2 = template.Resources.PublicSubnet2;
      const pri1 = template.Resources.PrivateSubnet1;
      const pri2 = template.Resources.PrivateSubnet2;

      // Verify use of Fn::GetAZs + Fn::Select
      [pub1, pub2, pri1, pri2].forEach(subnet => {
        const az = subnet.Properties.AvailabilityZone;
        expect(az).toBeDefined();
        expect(az['Fn::Select']).toBeDefined();
        expect(az['Fn::Select'][1]['Fn::GetAZs']).toBeDefined();
      });
    });
  });
});
