import fs from 'fs';
import path from 'path';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('TapStack CloudFormation Template', () => {
  let template: any;

  beforeAll(() => {
    // If youre testing a yaml template. run `pipenv run cfn-flip-to-json > lib/TapStack.json`
    // Otherwise, ensure the template is in JSON format.
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
        'TAP Stack - Task Assignment Platform CloudFormation Template'
      );
    });

    test('should have metadata section', () => {
      expect(template.Metadata).toBeDefined();
      expect(template.Metadata['AWS::CloudFormation::Interface']).toBeDefined();
    });
  });

  describe('Parameters', () => {
    test('should have EnvironmentSuffix parameter', () => {
      expect(template.Parameters.EnvironmentSuffix).toBeDefined();
    });

    test('EnvironmentSuffix parameter should have correct properties', () => {
      const envSuffixParam = template.Parameters.EnvironmentSuffix;
      expect(envSuffixParam.Type).toBe('String');
      expect(envSuffixParam.Default).toBe('dev');
      expect(envSuffixParam.Description).toBe(
        'Environment suffix for resource naming (e.g., dev, staging, prod)'
      );
      expect(envSuffixParam.AllowedPattern).toBe('^[a-zA-Z0-9]+$');
      expect(envSuffixParam.ConstraintDescription).toBe(
        'Must contain only alphanumeric characters'
      );
    });
  });

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
      expect(properties.DeletionProtectionEnabled).toBe(false);
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

  describe('Outputs', () => {
    test('should have all required outputs', () => {
      const expectedOutputs = [
        'TurnAroundPromptTableName',
        'TurnAroundPromptTableArn',
        'StackName',
        'EnvironmentSuffix',
      ];

      expectedOutputs.forEach(outputName => {
        expect(template.Outputs[outputName]).toBeDefined();
      });
    });

    test('TurnAroundPromptTableName output should be correct', () => {
      const output = template.Outputs.TurnAroundPromptTableName;
      expect(output.Description).toBe('Name of the DynamoDB table');
      expect(output.Value).toEqual({ Ref: 'TurnAroundPromptTable' });
      expect(output.Export.Name).toEqual({
        'Fn::Sub': '${AWS::StackName}-TurnAroundPromptTableName',
      });
    });

    test('TurnAroundPromptTableArn output should be correct', () => {
      const output = template.Outputs.TurnAroundPromptTableArn;
      expect(output.Description).toBe('ARN of the DynamoDB table');
      expect(output.Value).toEqual({
        'Fn::GetAtt': ['TurnAroundPromptTable', 'Arn'],
      });
      expect(output.Export.Name).toEqual({
        'Fn::Sub': '${AWS::StackName}-TurnAroundPromptTableArn',
      });
    });

    test('StackName output should be correct', () => {
      const output = template.Outputs.StackName;
      expect(output.Description).toBe('Name of this CloudFormation stack');
      expect(output.Value).toEqual({ Ref: 'AWS::StackName' });
      expect(output.Export.Name).toEqual({
        'Fn::Sub': '${AWS::StackName}-StackName',
      });
    });

    test('EnvironmentSuffix output should be correct', () => {
      const output = template.Outputs.EnvironmentSuffix;
      expect(output.Description).toBe(
        'Environment suffix used for this deployment'
      );
      expect(output.Value).toEqual({ Ref: 'EnvironmentSuffix' });
      expect(output.Export.Name).toEqual({
        'Fn::Sub': '${AWS::StackName}-EnvironmentSuffix',
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

    test('should have multiple secure resources', () => {
      const resourceCount = Object.keys(template.Resources).length;
      expect(resourceCount).toBeGreaterThan(20); // We have many security resources
    });

    test('should have multiple security parameters', () => {
      const parameterCount = Object.keys(template.Parameters).length;
      expect(parameterCount).toBeGreaterThan(10); // We have many security parameters
    });

    test('should have comprehensive security outputs', () => {
      const outputCount = Object.keys(template.Outputs).length;
      expect(outputCount).toBeGreaterThan(10); // We export many security resources
    });
  });

  describe('Resource Naming Convention', () => {
    test('table name should follow naming convention with environment suffix', () => {
      const table = template.Resources.TurnAroundPromptTable;
      const tableName = table.Properties.TableName;

      expect(tableName).toEqual({
        'Fn::Sub': 'TurnAroundPromptTable${EnvironmentSuffix}',
      });
    });

    test('core export names should follow stack naming convention', () => {
      const coreOutputs = [
        'TurnAroundPromptTableName',
        'TurnAroundPromptTableArn',
        'StackName',
        'EnvironmentSuffix',
      ];
      coreOutputs.forEach(outputKey => {
        const output = template.Outputs[outputKey];
        expect(output.Export.Name).toEqual({
          'Fn::Sub': `\${AWS::StackName}-${outputKey}`,
        });
      });
    });

    test('infrastructure export names should follow project naming convention', () => {
      const infraOutputs = [
        'VpcId',
        'PublicSubnetIds',
        'PrivateSubnetIds',
        'BastionSecurityGroupId',
      ];
      infraOutputs.forEach(outputKey => {
        if (template.Outputs[outputKey]) {
          const output = template.Outputs[outputKey];
          expect(output.Export.Name['Fn::Sub']).toContain('${ProjectPrefix}');
          expect(output.Export.Name['Fn::Sub']).toContain('${Environment}');
          expect(output.Export.Name['Fn::Sub']).toContain(
            '${EnvironmentSuffix}'
          );
        }
      });
    });
  });

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
      expect(privateSubnet1.Properties.MapPublicIpOnLaunch).toBe(false);
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
      expect(kmsKey.Type).toBe('AWS::KMS::Key');
      expect(kmsKey.Condition).toBe('CreateKmsKey');
      expect(kmsKey.Properties.KeyPolicy.Statement).toHaveLength(2);
    });

    test('should have S3 bucket with security configurations', () => {
      const dataBucket = template.Resources.DataBucket;
      expect(dataBucket.Type).toBe('AWS::S3::Bucket');
      expect(dataBucket.Condition).toBe('CreateDataBucket');
      expect(
        dataBucket.Properties.PublicAccessBlockConfiguration.BlockPublicAcls
      ).toBe(true);
      expect(
        dataBucket.Properties.BucketEncryption.ServerSideEncryptionConfiguration
      ).toBeDefined();
    });

    test('should have RDS with encryption and proper configuration', () => {
      const rdsInstance = template.Resources.RdsInstance;
      expect(rdsInstance.Type).toBe('AWS::RDS::DBInstance');
      expect(rdsInstance.Properties.StorageEncrypted).toBe(true);
      expect(rdsInstance.Properties.PubliclyAccessible).toBe(false);
      expect(rdsInstance.Properties.Engine).toBe('postgres');
    });

    test('should have CloudTrail with proper logging configuration', () => {
      const cloudTrail = template.Resources.CloudTrail;
      expect(cloudTrail.Type).toBe('AWS::CloudTrail::Trail');
      expect(cloudTrail.Properties.IsLogging).toBe(true);
      expect(cloudTrail.Properties.EnableLogFileValidation).toBe(true);
      expect(cloudTrail.Properties.IsMultiRegionTrail).toBe(true);
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

  describe('Security Compliance', () => {
    test('should use environment suffix in all resource names', () => {
      const dynamoTable = template.Resources.TurnAroundPromptTable;
      const vpc = template.Resources.Vpc;
      const bastionSG = template.Resources.SgBastion;

      expect(dynamoTable.Properties.TableName['Fn::Sub']).toContain(
        '${EnvironmentSuffix}'
      );
      expect(
        vpc.Properties.Tags.find((tag: any) => tag.Key === 'Name').Value[
          'Fn::Sub'
        ]
      ).toContain('${EnvironmentSuffix}');
      expect(bastionSG.Properties.GroupName['Fn::Sub']).toContain(
        '${EnvironmentSuffix}'
      );
    });

    test('should have proper conditions for optional resources', () => {
      expect(template.Conditions.CreateKmsKey).toBeDefined();
      expect(template.Conditions.CreateDataBucket).toBeDefined();
      expect(template.Conditions.HasKeyPair).toBeDefined();
    });

    test('should have encrypted storage for all data resources', () => {
      const dynamoTable = template.Resources.TurnAroundPromptTable;
      const dataBucket = template.Resources.DataBucket;
      const rdsInstance = template.Resources.RdsInstance;

      expect(dynamoTable.Properties.SSESpecification.SSEEnabled).toBe(true);
      expect(dataBucket.Properties.BucketEncryption).toBeDefined();
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

  describe('Infrastructure Parameters Validation', () => {
    test('should validate VPC CIDR parameter', () => {
      const vpcCidrParam = template.Parameters.VpcCidr;
      expect(vpcCidrParam.Type).toBe('String');
      expect(vpcCidrParam.AllowedPattern).toBeDefined();
    });

    test('should validate password parameter security', () => {
      const passwordParam = template.Parameters.RdsPassword;
      expect(passwordParam.NoEcho).toBe(true);
      expect(passwordParam.MinLength).toBe(8);
      expect(passwordParam.AllowedPattern).toBeDefined();
    });

    test('should have availability zone parameters', () => {
      const az1Param = template.Parameters.Az1;
      const az2Param = template.Parameters.Az2;

      expect(az1Param.Type).toBe('AWS::EC2::AvailabilityZone::Name');
      expect(az2Param.Type).toBe('AWS::EC2::AvailabilityZone::Name');
    });
  });
});
