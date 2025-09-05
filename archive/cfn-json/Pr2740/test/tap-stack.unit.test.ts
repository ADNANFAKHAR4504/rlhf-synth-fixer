import fs from 'fs';
import path from 'path';

describe('Web Application CloudFormation Template', () => {
  let template: any;

  beforeAll(() => {
    // Read and parse the CloudFormation template in JSON format
    const templatePath = path.join(__dirname, '../lib/TapStack.json');
    const templateContent = fs.readFileSync(templatePath, 'utf8');
    template = JSON.parse(templateContent);
  });

  describe('Template Structure', () => {
    test('should have a valid CloudFormation format version', () => {
      expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
    });

    test('should have a description', () => {
      expect(template.Description).toBeDefined();
      expect(template.Description).toBe(
        'A complete CloudFormation template for a highly available web application with VPC, subnets, EC2, ELB, RDS, S3, and IAM roles, updated to use modern security best practices.'
      );
    });

    test('should have a Parameters section', () => {
      expect(template.Parameters).toBeDefined();
    });

    test('should have a Resources section', () => {
      expect(template.Resources).toBeDefined();
    });

    test('should have an Outputs section', () => {
      expect(template.Outputs).toBeDefined();
    });
  });

  describe('Parameters', () => {
    test('should have all required parameters', () => {
      const requiredParameters = [
        'VpcCIDR',
        'PublicSubnet1CIDR',
        'PublicSubnet2CIDR',
        'PrivateSubnet1CIDR',
        'PrivateSubnet2CIDR',
        'InstanceType',
        'KeyName',
        'DBInstanceType',
        'DBName'
      ];
      requiredParameters.forEach(param => {
        expect(template.Parameters[param]).toBeDefined();
      });
    });

    test('DBName parameter should have correct properties', () => {
      const dbNameParam = template.Parameters.DBName;
      expect(dbNameParam.Type).toBe('String');
      expect(dbNameParam.Default).toBe('webappdb');
    });
  });

  describe('Resources', () => {
    
    test('should have a VPC resource of type AWS::EC2::VPC', () => {
      expect(template.Resources.VPC).toBeDefined();
      expect(template.Resources.VPC.Type).toBe('AWS::EC2::VPC');
    });

    test('should have an RDS DB instance resource of type AWS::RDS::DBInstance', () => {
      expect(template.Resources.RDSDBInstance).toBeDefined();
      expect(template.Resources.RDSDBInstance.Type).toBe('AWS::RDS::DBInstance');
    });

    test('should have a DatabaseSecret resource of type AWS::SecretsManager::Secret', () => {
      expect(template.Resources.DatabaseSecret).toBeDefined();
      expect(template.Resources.DatabaseSecret.Type).toBe('AWS::SecretsManager::Secret');
    });

    test('DatabaseSecret should be configured to generate a password', () => {
      const secret = template.Resources.DatabaseSecret.Properties;
      expect(secret.GenerateSecretString).toBeDefined();
      expect(secret.GenerateSecretString.GenerateStringKey).toBe('password');
      expect(secret.GenerateSecretString.PasswordLength).toBe(16);
    });

    test('RDSDBInstance should use Secrets Manager for username and password', () => {
      const dbInstance = template.Resources.RDSDBInstance.Properties;
      expect(dbInstance.MasterUsername).toBe('{{resolve:secretsmanager:DatabaseSecret:SecretString:username}}');
      expect(dbInstance.MasterUserPassword).toBe('{{resolve:secretsmanager:DatabaseSecret:SecretString:password}}');
    });
  });

  describe('Outputs', () => {
    test('should have all required outputs', () => {
      const expectedOutputs = [
        'VPCId',
        'ALBDNSName',
        'DBEndpoint',
        'DatabaseSecretARN'
      ];
      expectedOutputs.forEach(outputName => {
        expect(template.Outputs[outputName]).toBeDefined();
      });
    });

    test('DatabaseSecretARN output should be correct', () => {
      const output = template.Outputs.DatabaseSecretARN;
      expect(output.Description).toBe('The ARN of the Secrets Manager secret for the database credentials');
      expect(output.Value).toEqual({ Ref: 'DatabaseSecret' });
    });

    test('ALBDNSName output should get the correct attribute', () => {
      const output = template.Outputs.ALBDNSName;
      expect(output.Value['Fn::GetAtt']).toEqual(['ALB', 'DNSName']);
    });
  });
});
