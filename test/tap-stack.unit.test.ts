import fs from 'fs';
import path from 'path';

describe('CloudFormation Template', () => {
  let template: any;

  beforeAll(() => {
    const templatePath = path.join(__dirname, '../lib/TapStack.json');
    const templateContent = fs.readFileSync(templatePath, 'utf8');
    template = JSON.parse(templateContent);
  });

  describe('Template Structure', () => {
    test('should have AWSTemplateFormatVersion defined', () => {
      expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
    });

    test('should have Description defined', () => {
      expect(template.Description).toBeDefined();
      expect(typeof template.Description).toBe('string');
    });

    test('should have Resources section', () => {
      expect(template.Resources).toBeDefined();
    });

    test('should have Outputs section', () => {
      expect(template.Outputs).toBeDefined();
    });
  });

  describe('Parameters', () => {
    test('should not have Parameters section (none expected)', () => {
      expect(template.Parameters).toBeUndefined();
    });
  });

  describe('Resources', () => {
    test('should define a VPC with correct properties', () => {
      const vpc = template.Resources.VPC;
      expect(vpc).toBeDefined();
      expect(vpc.Type).toBe('AWS::EC2::VPC');
      expect(vpc.Properties.CidrBlock).toBe('10.0.0.0/16');
      expect(vpc.Properties.EnableDnsSupport).toBe(true);
      expect(vpc.Properties.EnableDnsHostnames).toBe(true);
    });

    test('should define 2 public and 2 private subnets', () => {
      expect(template.Resources.PublicSubnet1).toBeDefined();
      expect(template.Resources.PublicSubnet2).toBeDefined();
      expect(template.Resources.PrivateSubnet1).toBeDefined();
      expect(template.Resources.PrivateSubnet2).toBeDefined();
    });

    test('should define Internet Gateway', () => {
      expect(template.Resources.InternetGateway).toBeDefined();
      // NAT Gateway removed for LocalStack Community Edition compatibility
      // (EIP allocation for NAT Gateway does not work in LocalStack Community)
    });

    test('should define IAM roles for EC2 and RDS', () => {
      expect(template.Resources.EC2InstanceRole).toBeDefined();
      expect(template.Resources.RDSInstanceRole).toBeDefined();
    });

    test('should define WebSecurityGroup with HTTPS rule', () => {
      const sg = template.Resources.WebSecurityGroup;
      expect(sg).toBeDefined();
      const ingress = sg.Properties.SecurityGroupIngress[0];
      expect(ingress.FromPort).toBe(443);
      expect(ingress.ToPort).toBe(443);
    });
  });

  describe('Outputs', () => {
    test('should define outputs for VPC and subnets', () => {
      expect(template.Outputs.VPCId).toBeDefined();
      expect(template.Outputs.PublicSubnet1Id).toBeDefined();
      expect(template.Outputs.PublicSubnet2Id).toBeDefined();
      expect(template.Outputs.PrivateSubnet1Id).toBeDefined();
      expect(template.Outputs.PrivateSubnet2Id).toBeDefined();
    });

    test('should define outputs for EC2 and RDS IAM roles', () => {
      expect(template.Outputs.EC2InstanceRoleArn).toBeDefined();
      expect(template.Outputs.RDSInstanceRoleArn).toBeDefined();
    });
  });

  describe('Template Validation', () => {
    test('should have valid resource count', () => {
      const resourceCount = Object.keys(template.Resources).length;
      expect(resourceCount).toBeGreaterThan(10);
    });

    test('should have reasonable output count', () => {
      const outputCount = Object.keys(template.Outputs).length;
      expect(outputCount).toBe(8);
    });
  });

  describe('Resource Naming Convention', () => {
    test('should tag resources with Name', () => {
      const resourcesWithTags = [
        'VPC',
        'PublicSubnet1',
        'PublicSubnet2',
        'PrivateSubnet1',
        'PrivateSubnet2',
        'InternetGateway',
        // 'NatGateway' removed - not present in LocalStack-compatible template
      ];

      resourcesWithTags.forEach(resourceName => {
        const tags = template.Resources[resourceName]?.Properties?.Tags;
        expect(tags).toBeDefined();
        const nameTag = tags.find((tag: any) => tag.Key === 'Name');
        expect(nameTag).toBeDefined();
      });
    });
  });
});
