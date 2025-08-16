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

  describe('Security and Compliance', () => {
    test('all resources should have Environment:Production tag', () => {
      const resources = template.Resources;
      
      Object.keys(resources).forEach(resourceName => {
        const resource = resources[resourceName];
        if (resource.Properties && resource.Properties.Tags) {
          const environmentTag = resource.Properties.Tags.find(
            (tag: any) => tag.Key === 'Environment' && tag.Value === 'Production'
          );
          expect(environmentTag).toBeDefined();
        }
      });
    });

    test('all taggable resources should be destroyable', () => {
      const resources = template.Resources;
      
      Object.keys(resources).forEach(resourceName => {
        const resource = resources[resourceName];
        if (resource.DeletionPolicy) {
          expect(resource.DeletionPolicy).toBe('Delete');
        }
      });
    });

    test('security group should only allow SSH and HTTPS', () => {
      const sg = template.Resources.ApplicationSecurityGroup;
      const ingress = sg.Properties.SecurityGroupIngress;
      
      expect(ingress).toHaveLength(2);
      expect(ingress.some((rule: any) => rule.FromPort === 22 && rule.ToPort === 22)).toBe(true);
      expect(ingress.some((rule: any) => rule.FromPort === 443 && rule.ToPort === 443)).toBe(true);
      expect(ingress.every((rule: any) => rule.FromPort === 22 || rule.FromPort === 443)).toBe(true);
    });

    test('S3 bucket should have encryption enabled', () => {
      const bucket = template.Resources.ApplicationBucket;
      const encryption = bucket.Properties.BucketEncryption;
      
      expect(encryption).toBeDefined();
      expect(encryption.ServerSideEncryptionConfiguration[0].ServerSideEncryptionByDefault.SSEAlgorithm).toBe('AES256');
    });
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

    test('should have parameter groups in metadata', () => {
      const parameterGroups = template.Metadata['AWS::CloudFormation::Interface'].ParameterGroups;
      expect(parameterGroups).toBeDefined();
      expect(parameterGroups).toHaveLength(2);
      expect(parameterGroups[0].Label.default).toBe('Environment Configuration');
      expect(parameterGroups[1].Label.default).toBe('Infrastructure Settings');
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

    test('should have VpcId parameter', () => {
      expect(template.Parameters.VpcId).toBeDefined();
      expect(template.Parameters.VpcId.Type).toBe('AWS::EC2::VPC::Id');
      expect(template.Parameters.VpcId.Default).toBe('vpc-12345abcde');
    });

    test('should have SubnetId parameter', () => {
      expect(template.Parameters.SubnetId).toBeDefined();
      expect(template.Parameters.SubnetId.Type).toBe('AWS::EC2::Subnet::Id');
    });

    test('should have InstanceType parameter', () => {
      expect(template.Parameters.InstanceType).toBeDefined();
      expect(template.Parameters.InstanceType.Type).toBe('String');
      expect(template.Parameters.InstanceType.Default).toBe('t3.micro');
      expect(template.Parameters.InstanceType.AllowedValues).toContain('t3.micro');
    });

    test('should have ingress CIDR parameters', () => {
      expect(template.Parameters.IngressCidrSsh).toBeDefined();
      expect(template.Parameters.IngressCidrHttps).toBeDefined();
      expect(template.Parameters.IngressCidrSsh.Default).toBe('0.0.0.0/0');
      expect(template.Parameters.IngressCidrHttps.Default).toBe('0.0.0.0/0');
    });

    test('should have LatestAmiId parameter', () => {
      expect(template.Parameters.LatestAmiId).toBeDefined();
      expect(template.Parameters.LatestAmiId.Type).toBe('AWS::SSM::Parameter::Value<AWS::EC2::Image::Id>');
      expect(template.Parameters.LatestAmiId.Default).toBe('/aws/service/ami-amazon-linux-latest/amzn2-ami-hvm-x86_64-gp2');
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

    test('should have ApplicationSecurityGroup resource', () => {
      expect(template.Resources.ApplicationSecurityGroup).toBeDefined();
      expect(template.Resources.ApplicationSecurityGroup.Type).toBe('AWS::EC2::SecurityGroup');
    });

    test('ApplicationSecurityGroup should have correct deletion policy', () => {
      const sg = template.Resources.ApplicationSecurityGroup;
      expect(sg.DeletionPolicy).toBe('Delete');
    });

    test('ApplicationSecurityGroup should have correct properties', () => {
      const sg = template.Resources.ApplicationSecurityGroup;
      const properties = sg.Properties;

      expect(properties.GroupName).toEqual({
        'Fn::Sub': 'ApplicationSecurityGroup${EnvironmentSuffix}',
      });
      expect(properties.GroupDescription).toBe('Security group allowing SSH and HTTPS traffic only');
      expect(properties.VpcId).toEqual({ Ref: 'VpcId' });
    });

    test('ApplicationSecurityGroup should have correct ingress rules', () => {
      const sg = template.Resources.ApplicationSecurityGroup;
      const ingress = sg.Properties.SecurityGroupIngress;

      expect(ingress).toHaveLength(2);
      expect(ingress[0].IpProtocol).toBe('tcp');
      expect(ingress[0].FromPort).toBe(22);
      expect(ingress[0].ToPort).toBe(22);
      expect(ingress[1].IpProtocol).toBe('tcp');
      expect(ingress[1].FromPort).toBe(443);
      expect(ingress[1].ToPort).toBe(443);
    });

    test('should have ApplicationInstance resource', () => {
      expect(template.Resources.ApplicationInstance).toBeDefined();
      expect(template.Resources.ApplicationInstance.Type).toBe('AWS::EC2::Instance');
    });

    test('ApplicationInstance should have correct deletion policy', () => {
      const instance = template.Resources.ApplicationInstance;
      expect(instance.DeletionPolicy).toBe('Delete');
    });

    test('ApplicationInstance should have correct properties', () => {
      const instance = template.Resources.ApplicationInstance;
      const properties = instance.Properties;

      expect(properties.ImageId).toEqual({ Ref: 'LatestAmiId' });
      expect(properties.InstanceType).toEqual({ Ref: 'InstanceType' });
      expect(properties.SubnetId).toEqual({ Ref: 'SubnetId' });
      expect(properties.SecurityGroupIds).toHaveLength(1);
      expect(properties.SecurityGroupIds[0]).toEqual({ Ref: 'ApplicationSecurityGroup' });
    });

    test('should have ApplicationBucket resource', () => {
      expect(template.Resources.ApplicationBucket).toBeDefined();
      expect(template.Resources.ApplicationBucket.Type).toBe('AWS::S3::Bucket');
    });

    test('ApplicationBucket should have correct deletion policy', () => {
      const bucket = template.Resources.ApplicationBucket;
      expect(bucket.DeletionPolicy).toBe('Delete');
    });

    test('ApplicationBucket should have correct properties', () => {
      const bucket = template.Resources.ApplicationBucket;
      const properties = bucket.Properties;

      expect(properties.BucketName).toEqual({
        'Fn::Sub': 'application-bucket-${EnvironmentSuffix}-${AWS::AccountId}-${AWS::Region}',
      });
      expect(properties.BucketEncryption).toBeDefined();
      expect(properties.BucketEncryption.ServerSideEncryptionConfiguration[0].ServerSideEncryptionByDefault.SSEAlgorithm).toBe('AES256');
    });
  });

  describe('Outputs', () => {
    test('should have all required outputs', () => {
      const expectedOutputs = [
        'TurnAroundPromptTableName',
        'TurnAroundPromptTableArn',
        'SecurityGroupId',
        'InstanceId',
        'InstancePublicIp',
        'BucketName',
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

    test('should have exactly four resources', () => {
      const resourceCount = Object.keys(template.Resources).length;
      expect(resourceCount).toBe(4);
    });

    test('should have exactly seven parameters', () => {
      const parameterCount = Object.keys(template.Parameters).length;
      expect(parameterCount).toBe(7);
    });

    test('should have exactly eight outputs', () => {
      const outputCount = Object.keys(template.Outputs).length;
      expect(outputCount).toBe(8);
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

    test('export names should follow naming convention', () => {
      Object.keys(template.Outputs).forEach(outputKey => {
        const output = template.Outputs[outputKey];
        expect(output.Export.Name).toEqual({
          'Fn::Sub': `\${AWS::StackName}-${outputKey}`,
        });
      });
    });
  });
});
