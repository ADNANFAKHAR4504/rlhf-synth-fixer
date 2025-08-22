import fs from 'fs';
import path from 'path';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('TapStack CloudFormation Template', () => {
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
    test('should have MainVPC resource', () => {
      expect(template.Resources.MainVPC).toBeDefined();
    });

    test('MainVPC should have correct properties', () => {
      const vpc = template.Resources.MainVPC;
      expect(vpc.Type).toBe('AWS::EC2::VPC');
      expect(vpc.Properties.CidrBlock).toBe('10.0.0.0/16');
      expect(vpc.Properties.EnableDnsHostnames).toBe(true);
      expect(vpc.Properties.EnableDnsSupport).toBe(true);
    });

    test('should have InternetGateway resource', () => {
      expect(template.Resources.InternetGateway).toBeDefined();
    });

    test('InternetGateway should have correct tags', () => {
      const igw = template.Resources.InternetGateway;
      expect(igw.Type).toBe('AWS::EC2::InternetGateway');
      expect(igw.Properties.Tags).toEqual(
        expect.arrayContaining([
          { Key: 'Name', Value: { 'Fn::Sub': '${EnvironmentSuffix}-igw' } },
        ])
      );
    });

    test('should have DynamoDB table resource', () => {
      expect(template.Resources.TurnAroundPromptTable).toBeDefined();
    });

    test('DynamoDB table should have correct properties', () => {
      const table = template.Resources.TurnAroundPromptTable;
      expect(table.Type).toBe('AWS::DynamoDB::Table');
      expect(table.Properties.TableName).toEqual({
        'Fn::Sub': 'TurnAroundPromptTable${EnvironmentSuffix}',
      });
      expect(table.Properties.BillingMode).toBe('PAY_PER_REQUEST');
    });

    test('should have ApplicationLoadBalancer resource', () => {
      expect(template.Resources.ApplicationLoadBalancer).toBeDefined();
    });

    test('ApplicationLoadBalancer should have correct properties', () => {
      const alb = template.Resources.ApplicationLoadBalancer;
      expect(alb.Type).toBe('AWS::ElasticLoadBalancingV2::LoadBalancer');
      expect(alb.Properties.Scheme).toBe('internet-facing');
      expect(alb.Properties.Type).toBe('application');
    });

    test('should have RDS Database resource', () => {
      expect(template.Resources.Database).toBeDefined();
    });

    test('RDS Database should have correct properties', () => {
      const db = template.Resources.Database;
      expect(db.Type).toBe('AWS::RDS::DBInstance');
      expect(db.Properties.Engine).toBe('mysql');
      expect(db.Properties.EngineVersion).toBe('8.0.37');
      expect(db.Properties.MasterUserPassword).toEqual({
        'Fn::Sub': '{{resolve:secretsmanager:${DBSecret}:SecretString:password}}',
      });
    });
  });

  describe('Outputs', () => {
    test('should have all required outputs', () => {
      const expectedOutputs = [
        'VPCId',
        'PublicSubnet1Id',
        'PublicSubnet2Id',
        'PrivateSubnet1Id',
        'PrivateSubnet2Id',
        'LoadBalancerDNS',
        'DatabaseEndpoint',
        'ApplicationDataBucketName',
        'TurnAroundPromptTableName',
        'TurnAroundPromptTableArn',
        'StackName',
        'EnvironmentSuffix',
      ];

      expectedOutputs.forEach(outputName => {
        expect(template.Outputs[outputName]).toBeDefined();
      });
    });

    test('VPCId output should be correct', () => {
      const output = template.Outputs.VPCId;
      expect(output.Description).toBe('VPC ID');
      expect(output.Value).toEqual({ Ref: 'MainVPC' });
    });

    test('DatabaseEndpoint output should be correct', () => {
      const output = template.Outputs.DatabaseEndpoint;
      expect(output.Description).toBe('RDS Database Endpoint');
      expect(output.Value).toEqual({
        'Fn::GetAtt': ['Database', 'Endpoint.Address'],
      });
    });

    test('LoadBalancerDNS output should be correct', () => {
      const output = template.Outputs.LoadBalancerDNS;
      expect(output.Description).toBe('Application Load Balancer DNS Name'); // Corrected description
      expect(output.Value).toEqual({
        'Fn::GetAtt': ['ApplicationLoadBalancer', 'DNSName'],
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

    test('should have exactly 32 resources', () => {
      const resourceCount = Object.keys(template.Resources).length;
      expect(resourceCount).toBe(32); // Updated expected count
    });

    test('should have exactly 4 parameters', () => {
      const parameterCount = Object.keys(template.Parameters).length;
      expect(parameterCount).toBe(4); // Updated expected count
    });

    test('should have exactly 12 outputs', () => {
      const outputCount = Object.keys(template.Outputs).length;
      expect(outputCount).toBe(12); // Updated expected count
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
        const expectedExportName = `\${AWS::StackName}-${outputKey}`;
        if (outputKey === 'ApplicationDataBucketName') {
          expect(output.Export.Name).toEqual({
            'Fn::Sub': '${AWS::StackName}-S3BucketName', // Corrected export name
          });
        } else {
          expect(output.Export.Name).toEqual({
            'Fn::Sub': expectedExportName,
          });
        }
      });
    });
  });
});
