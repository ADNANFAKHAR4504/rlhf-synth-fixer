import fs from 'fs';
import path from 'path';

describe('CloudFormation Template', () => {
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
      expect(typeof template.Description).toBe('string');
      expect(template.Description.length).toBeGreaterThan(0);
    });
    test('should have Parameters, Resources, and Outputs sections', () => {
      expect(template.Parameters).toBeDefined();
      expect(template.Resources).toBeDefined();
      expect(template.Outputs).toBeDefined();
    });
  });

  describe('Parameters', () => {
    test('should define required parameters', () => {
      const required = ['Environment', 'AllowedSSHCIDR', 'DBUsername'];
      required.forEach(param =>
        expect(template.Parameters[param]).toBeDefined()
      );
    });
    test('should have correct Environment parameter', () => {
      const p = template.Parameters.Environment;
      expect(p.Type).toBe('String');
      expect(p.Default).toBe('production');
    });
    test('should have correct AllowedSSHCIDR parameter', () => {
      const p = template.Parameters.AllowedSSHCIDR;
      expect(p.Type).toBe('String');
      expect(p.Default).toBe('203.0.113.0/32');
      expect(p.AllowedPattern).toBeDefined();
    });
  });

  describe('Resources', () => {
    test('should create a VPC', () => {
      expect(
        Object.values(template.Resources).some(
          (r: any) => r.Type === 'AWS::EC2::VPC'
        )
      ).toBe(true);
    });
    test('should create at least one public and one private subnet', () => {
      const subnets = Object.values(template.Resources).filter(
        (r: any) => r.Type === 'AWS::EC2::Subnet'
      );
      const publicSubnets = subnets.filter(
        (s: any) => s.Properties && s.Properties.MapPublicIpOnLaunch
      );
      const privateSubnets = subnets.filter(
        (s: any) => s.Properties && !s.Properties.MapPublicIpOnLaunch
      );
      expect(publicSubnets.length).toBeGreaterThanOrEqual(1);
      expect(privateSubnets.length).toBeGreaterThanOrEqual(1);
    });
    test('should create an Internet Gateway and attach it', () => {
      expect(
        Object.values(template.Resources).some(
          (r: any) => r.Type === 'AWS::EC2::InternetGateway'
        )
      ).toBe(true);
      expect(
        Object.values(template.Resources).some(
          (r: any) => r.Type === 'AWS::EC2::VPCGatewayAttachment'
        )
      ).toBe(true);
    });
    test('should define security groups', () => {
      expect(
        Object.values(template.Resources).some(
          (r: any) => r.Type === 'AWS::EC2::SecurityGroup'
        )
      ).toBe(true);
    });
    test('should define a WAF WebACL', () => {
      expect(
        Object.values(template.Resources).some(
          (r: any) =>
            r.Type &&
            (r.Type.includes('AWS::WAF') || r.Type.includes('AWS::WAFv2'))
        )
      ).toBe(true);
    });
    test('should define an RDS database that is not publicly accessible', () => {
      const rds = Object.values(template.Resources).find(
        (r: any) => r.Type === 'AWS::RDS::DBInstance'
      );
      expect(rds).toBeDefined();
      if (rds) {
        expect((rds as any).Properties.PubliclyAccessible).toBe(false);
      }
    });
    test('should use encrypted storage for RDS database', () => {
      const rds = Object.values(template.Resources).find(
        (r: any) => r.Type === 'AWS::RDS::DBInstance'
      );
      expect(rds).toBeDefined();
      if (rds) {
        expect((rds as any).Properties.StorageEncrypted).toBe(true);
      }
    });
  });

  describe('Outputs', () => {
    test('should have all required outputs', () => {
      const expected = [
        'VPCId',
        'PublicSubnetId',
        'WebSecurityGroupId',
        'PrivateSubnetId',
        'WebACLArn',
        'DatabaseEndpoint',
      ];
      expected.forEach(key => expect(template.Outputs[key]).toBeDefined());
    });
    test('should have correct output descriptions and export names', () => {
      const outputs = template.Outputs;
      expect(outputs.VPCId.Description).toMatch(/VPC ID/i);
      expect(outputs.PublicSubnetId.Description).toMatch(/Public Subnet ID/i);
      expect(outputs.WebSecurityGroupId.Description).toMatch(
        /Web Security Group ID/i
      );
      expect(outputs.PrivateSubnetId.Description).toMatch(/Private Subnet ID/i);
      expect(outputs.WebACLArn.Description).toMatch(/WAF Web ACL ARN/i);
      expect(outputs.DatabaseEndpoint.Description).toMatch(
        /Database Endpoint/i
      );
      // Export.Name is an object with Fn::Sub
      expect(outputs.VPCId.Export.Name['Fn::Sub']).toMatch(
        /\$\{AWS::StackName\}-VPC-ID/
      );
      expect(outputs.PublicSubnetId.Export.Name['Fn::Sub']).toMatch(
        /\$\{AWS::StackName\}-Public-Subnet-ID/
      );
      expect(outputs.WebSecurityGroupId.Export.Name['Fn::Sub']).toMatch(
        /\$\{AWS::StackName\}-Web-SG-ID/
      );
      expect(outputs.PrivateSubnetId.Export.Name['Fn::Sub']).toMatch(
        /\$\{AWS::StackName\}-Private-Subnet-ID/
      );
      expect(outputs.WebACLArn.Export.Name['Fn::Sub']).toMatch(
        /\$\{AWS::StackName\}-WebACL-ARN/
      );
      expect(outputs.DatabaseEndpoint.Export.Name['Fn::Sub']).toMatch(
        /\$\{AWS::StackName\}-DB-Endpoint/
      );
    });
  });

  describe('Template Validation', () => {
    test('should be a valid object', () => {
      expect(typeof template).toBe('object');
      expect(template).toBeDefined();
    });
    test('should not have any undefined or null required sections', () => {
      expect(template.AWSTemplateFormatVersion).not.toBeNull();
      expect(template.Description).not.toBeNull();
      expect(template.Parameters).not.toBeNull();
      expect(template.Resources).not.toBeNull();
      expect(template.Outputs).not.toBeNull();
    });
    test('should have at least 3 parameters', () => {
      expect(Object.keys(template.Parameters).length).toBeGreaterThanOrEqual(3);
    });
    test('should have at least 6 outputs', () => {
      expect(Object.keys(template.Outputs).length).toBeGreaterThanOrEqual(6);
    });
  });

  describe('Resource Naming Convention', () => {
    test('should follow naming conventions for outputs', () => {
      // All outputs should have Export.Name as Fn::Sub with ${AWS::StackName}- prefix
      Object.values(template.Outputs).forEach((output: any) => {
        expect(output.Export.Name['Fn::Sub']).toMatch(/^\$\{AWS::StackName\}-/);
      });
    });
    test('should apply tags to resources where required', () => {
      // All taggable resources should have Tags property
      const taggableTypes = [
        'AWS::EC2::VPC',
        'AWS::EC2::Subnet',
        'AWS::EC2::SecurityGroup',
        'AWS::RDS::DBInstance',
      ];
      Object.values(template.Resources).forEach((res: any) => {
        if (taggableTypes.includes(res.Type)) {
          expect(res.Properties.Tags).toBeDefined();
        }
      });
    });
  });
});
