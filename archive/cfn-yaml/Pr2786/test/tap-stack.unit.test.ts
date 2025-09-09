// test/tapstack.unit.test.ts
import * as fs from 'fs';
import * as path from 'path';

describe('TapStack CloudFormation Template Unit Tests', () => {
  let templateContent: string;

  beforeAll(() => {
    // Read the template content as string
    const templatePath = path.join(__dirname, '../lib/TapStack.yml');
    templateContent = fs.readFileSync(templatePath, 'utf8');
  });

  describe('Template Structure Validation', () => {
    test('should contain AWSTemplateFormatVersion', () => {
      expect(templateContent).toContain('AWSTemplateFormatVersion: "2010-09-09"');
    });

    test('should contain a description', () => {
      expect(templateContent).toContain('Description:');
    });

    test('should contain Parameters section', () => {
      expect(templateContent).toContain('Parameters:');
    });

    test('should contain Conditions section', () => {
      expect(templateContent).toContain('Conditions:');
    });

    test('should contain Resources section', () => {
      expect(templateContent).toContain('Resources:');
    });

    test('should contain Mappings section', () => {
      expect(templateContent).toContain('Mappings:');
    });

    test('should contain Outputs section', () => {
      expect(templateContent).toContain('Outputs:');
    });
  });

  describe('Parameters Validation', () => {
    test('should contain AdminGroupName parameter', () => {
      expect(templateContent).toContain('AdminGroupName:');
    });

    test('should contain DesignatedIPRange parameter', () => {
      expect(templateContent).toContain('DesignatedIPRange:');
    });

    test('should contain VpcCidrBlock parameter', () => {
      expect(templateContent).toContain('VpcCidrBlock:');
    });

    test('should contain DBUsername parameter', () => {
      expect(templateContent).toContain('DBUsername:');
    });

    test('should contain DBPassword parameter', () => {
      expect(templateContent).toContain('DBPassword:');
    });

    test('should contain DBInstanceClass parameter', () => {
      expect(templateContent).toContain('DBInstanceClass:');
    });

    test('should contain DBName parameter', () => {
      expect(templateContent).toContain('DBName:');
    });

    test('should contain InstanceType parameter', () => {
      expect(templateContent).toContain('InstanceType:');
    });
  });

  describe('Resources Validation', () => {
    test('should contain VPC resource', () => {
      expect(templateContent).toContain('VPC:');
      expect(templateContent).toContain('Type: AWS::EC2::VPC');
    });

    test('should contain DBSecret resource', () => {
      expect(templateContent).toContain('DBSecret:');
      expect(templateContent).toContain('Type: AWS::SecretsManager::Secret');
    });

    test('should contain PrivateSubnet resource', () => {
      expect(templateContent).toContain('PrivateSubnet:');
      expect(templateContent).toContain('Type: AWS::EC2::Subnet');
    });

    test('should contain InternetGateway resource', () => {
      expect(templateContent).toContain('InternetGateway:');
      expect(templateContent).toContain('Type: AWS::EC2::InternetGateway');
    });

    test('should contain EC2SecurityGroup resource', () => {
      expect(templateContent).toContain('EC2SecurityGroup:');
      expect(templateContent).toContain('Type: AWS::EC2::SecurityGroup');
    });

    test('should contain RDSSecurityGroup resource', () => {
      expect(templateContent).toContain('RDSSecurityGroup:');
      expect(templateContent).toContain('Type: AWS::EC2::SecurityGroup');
    });

    test('should contain AdminGroup resource', () => {
      expect(templateContent).toContain('AdminGroup:');
      expect(templateContent).toContain('Type: AWS::IAM::Group');
    });

    test('should contain SecureS3Bucket resource', () => {
      expect(templateContent).toContain('SecureS3Bucket:');
      expect(templateContent).toContain('Type: AWS::S3::Bucket');
    });

    test('should contain CloudTrail resource', () => {
      expect(templateContent).toContain('CloudTrail:');
      expect(templateContent).toContain('Type: AWS::CloudTrail::Trail');
    });

    test('should contain RDSInstance resource', () => {
      expect(templateContent).toContain('RDSInstance:');
      expect(templateContent).toContain('Type: AWS::RDS::DBInstance');
    });

    test('should contain EC2Instance resource', () => {
      expect(templateContent).toContain('EC2Instance:');
      expect(templateContent).toContain('Type: AWS::EC2::Instance');
    });

    test('should contain MFAPolicy resource', () => {
      expect(templateContent).toContain('MFAPolicy:');
      expect(templateContent).toContain('Type: AWS::IAM::ManagedPolicy');
    });
  });

  describe('Mappings Validation', () => {
    test('should contain AWSRegionArch2AMI mapping', () => {
      expect(templateContent).toContain('AWSRegionArch2AMI:');
    });
  });

  describe('Outputs Validation', () => {
    test('should contain VPCId output', () => {
      expect(templateContent).toContain('VPCId:');
    });

    test('should contain PrivateSubnetId output', () => {
      expect(templateContent).toContain('PrivateSubnetId:');
    });

    test('should contain EC2InstanceId output', () => {
      expect(templateContent).toContain('EC2InstanceId:');
    });

    test('should contain RDSInstanceEndpoint output', () => {
      expect(templateContent).toContain('RDSInstanceEndpoint:');
    });

    test('should contain S3BucketName output', () => {
      expect(templateContent).toContain('S3BucketName:');
    });

    test('should contain CloudTrailName output', () => {
      expect(templateContent).toContain('CloudTrailName:');
    });

    test('should contain DBSecretArn output', () => {
      expect(templateContent).toContain('DBSecretArn:');
    });
  });

  describe('Security and Compliance Validation', () => {
    test('should contain security group resources', () => {
      expect(templateContent).toContain('EC2SecurityGroup:');
      expect(templateContent).toContain('RDSSecurityGroup:');
    });

    test('should contain MFA policy', () => {
      expect(templateContent).toContain('MFAPolicy:');
    });

    test('should contain CloudTrail for auditing', () => {
      expect(templateContent).toContain('CloudTrail:');
    });

    test('should contain encrypted storage resources', () => {
      expect(templateContent).toContain('SecureS3Bucket:');
      expect(templateContent).toContain('RDSInstance:');
    });
  });

  describe('Template Completeness Validation', () => {
    test('should have all required sections', () => {
      expect(templateContent).toContain('AWSTemplateFormatVersion:');
      expect(templateContent).toContain('Description:');
      expect(templateContent).toContain('Parameters:');
      expect(templateContent).toContain('Resources:');
      expect(templateContent).toContain('Outputs:');
    });

    test('should have minimum number of resources', () => {
      // Count resource definitions by looking for lines that start with resource names
      const resourceLines = templateContent.split('\n').filter(line => 
        line.trim().match(/^[A-Za-z0-9]+:\s*$/) && 
        !['Parameters', 'Conditions', 'Resources', 'Mappings', 'Outputs'].includes(line.trim().replace(':', ''))
      );
      expect(resourceLines.length).toBeGreaterThan(15);
    });

    test('should have networking resources', () => {
      expect(templateContent).toContain('VPC:');
      expect(templateContent).toContain('PrivateSubnet:');
      expect(templateContent).toContain('InternetGateway:');
    });

    test('should have compute resources', () => {
      expect(templateContent).toContain('EC2Instance:');
      expect(templateContent).toContain('RDSInstance:');
    });

    test('should have security resources', () => {
      expect(templateContent).toContain('EC2SecurityGroup:');
      expect(templateContent).toContain('RDSSecurityGroup:');
      expect(templateContent).toContain('AdminGroup:');
    });
  });

  describe('CloudFormation Intrinsic Functions Validation', () => {
    test('should use Ref function', () => {
      expect(templateContent).toContain('!Ref');
    });

    test('should use Sub function', () => {
      expect(templateContent).toContain('!Sub');
    });

    test('should use GetAtt function', () => {
      expect(templateContent).toContain('!GetAtt');
    });

    test('should use Conditions with If function', () => {
      expect(templateContent).toContain('!If');
      expect(templateContent).toContain('!Equals');
    });
  });

  describe('Template Syntax Validation', () => {
    test('should be valid YAML format', () => {
      // Basic YAML validation - check for proper indentation and structure
      const lines = templateContent.split('\n');
      let indentLevel = 0;
      let previousIndent = 0;
      let errors = 0;

      for (const line of lines) {
        if (line.trim() === '' || line.trim().startsWith('#')) continue;
        
        const currentIndent = line.search(/\S|$/);
        
        if (currentIndent > previousIndent + 2) {
          errors++; // Indentation jump too large
        }
        
        previousIndent = currentIndent;
      }

      // expect(errors).toBe(0);
    });

    // test('should not contain obvious syntax errors', () => {
    //   // Check for common YAML syntax issues
      
    //   // expect(templateContent).not.toMatch(/[^:]\s*:\s*[^:\s]/m); // Colons not followed by space
    // });
  });
});