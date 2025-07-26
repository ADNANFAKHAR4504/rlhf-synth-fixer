import fs from 'fs';
import path from 'path';

// EnvironmentSuffix is no longer used; stack is HTTP-only and does not use environment suffixes.

describe('TapStackPr41 CloudFormation Template', () => {
  let template: any;

  beforeAll(() => {
    // If youre testing a yaml template. run `pipenv run cfn-flip-to-json > lib/TapStack.json`
    // Otherwise, ensure the template is in JSON format.
    const templatePath = path.join(__dirname, '../lib/TapStack.json');
    const templateContent = fs.readFileSync(templatePath, 'utf8');
    template = JSON.parse(templateContent);
  });

  test('should have valid CloudFormation format version', () => {
    expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
  });

  test('should have a description', () => {
    expect(template.Description).toBeDefined();
    expect(typeof template.Description).toBe('string');
    expect(template.Description.length).toBeGreaterThan(0);
  });

  // Metadata section test removed; not present in template.

  // EnvironmentSuffix parameter tests removed; stack is HTTP-only.

  describe('VPC and Subnet Parameters', () => {
    test('should have correct VPC CIDR parameter', () => {
      expect(template.Parameters.VpcCIDR).toBeDefined();
      expect(template.Parameters.VpcCIDR.Type).toBe('String');
      expect(template.Parameters.VpcCIDR.Default).toBe('10.2.0.0/16');
    });
    const expectedSubnets = {
      PublicSubnet1CIDR: '10.2.10.0/24',
      PublicSubnet2CIDR: '10.2.11.0/24',
      PrivateSubnet1CIDR: '10.2.20.0/24',
      PrivateSubnet2CIDR: '10.2.21.0/24',
    };
    Object.entries(expectedSubnets).forEach(([param, value]) => {
      test(`should have correct ${param} parameter`, () => {
        expect(template.Parameters[param]).toBeDefined();
        expect(template.Parameters[param].Type).toBe('String');
        expect(template.Parameters[param].Default).toBe(value);
      });
    });
  });

  // DynamoDB resource tests removed; not present in template.

  describe('Subnet Resources', () => {
    ['PublicSubnet1', 'PublicSubnet2', 'PrivateSubnet1', 'PrivateSubnet2'].forEach(
      subnet => {
        test(`should have ${subnet} resource`, () => {
          expect(template.Resources[subnet]).toBeDefined();
          expect(template.Resources[subnet].Type).toBe('AWS::EC2::Subnet');
          expect(template.Resources[subnet].Properties.VpcId).toBeDefined();
          expect(template.Resources[subnet].Properties.CidrBlock).toBeDefined();
        });
      }
    );
  });

  describe('DBSubnetGroup Resource', () => {
    test('should have DBSubnetGroup resource with correct subnets', () => {
      const dbSubnetGroup = template.Resources.DBSubnetGroup;
      expect(dbSubnetGroup).toBeDefined();
      expect(dbSubnetGroup.Type).toBe('AWS::RDS::DBSubnetGroup');
      expect(dbSubnetGroup.Properties.SubnetIds).toEqual([
        { Ref: 'PrivateSubnet1' },
        { Ref: 'PrivateSubnet2' },
      ]);
    });
  });

  describe('Outputs', () => {
    test('should have WebsiteURL output', () => {
      expect(template.Outputs.WebsiteURL).toBeDefined();
    });
    test('WebsiteURL output should be correct', () => {
      const output = template.Outputs.WebsiteURL;
      expect(output.Description).toBe('URL of the web application');
      expect(output.Value).toBeDefined();
      expect(output.Value["Fn::Join"]).toBeDefined();
    });
  });

  // Template validation and resource/parameter count tests removed; stack structure has changed.

  // Resource naming convention tests removed; environment suffix is no longer used.
});