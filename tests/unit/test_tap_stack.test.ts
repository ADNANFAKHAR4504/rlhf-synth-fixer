/**
 * test_tap_stack.test.ts
 *
 * Unit tests for BrazilCart E-Commerce Infrastructure
 * Tests CloudFormation template structure and resource configurations
 */

import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';

describe('Infrastructure Template Tests', () => {
  let template: any;

  beforeAll(() => {
    const templatePath = path.join(__dirname, '..', '..', 'lib', 'TapStack.yaml');
    const fileContents = fs.readFileSync(templatePath, 'utf8');
    template = yaml.load(fileContents);
  });

  describe('Template Structure', () => {
    test('should have required top-level sections', () => {
      expect(template).toHaveProperty('AWSTemplateFormatVersion');
      expect(template).toHaveProperty('Description');
      expect(template).toHaveProperty('Parameters');
      expect(template).toHaveProperty('Resources');
      expect(template).toHaveProperty('Outputs');
    });

    test('should have correct template version', () => {
      expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
    });

    test('should have a description', () => {
      expect(template.Description).toBeDefined();
      expect(typeof template.Description).toBe('string');
      expect(template.Description.length).toBeGreaterThan(0);
    });
  });

  describe('Parameters', () => {
    test('should have EnvironmentSuffix parameter', () => {
      expect(template.Parameters).toHaveProperty('EnvironmentSuffix');
      expect(template.Parameters.EnvironmentSuffix.Type).toBe('String');
    });

    test('EnvironmentSuffix should have allowed pattern', () => {
      const envParam = template.Parameters.EnvironmentSuffix;
      expect(envParam).toHaveProperty('AllowedPattern');
      expect(envParam).toHaveProperty('Default');
      expect(envParam).toHaveProperty('ConstraintDescription');
    });

    test('should have VpcCidr parameter', () => {
      expect(template.Parameters).toHaveProperty('VpcCidr');
      expect(template.Parameters.VpcCidr.Type).toBe('String');
      expect(template.Parameters.VpcCidr.Default).toBe('10.0.0.0/16');
    });
  });
});

describe('VPC and Networking', () => {
  let template: any;
  let resources: any;

  beforeAll(() => {
    const templatePath = path.join(__dirname, '..', '..', 'lib', 'TapStack.yaml');
    const fileContents = fs.readFileSync(templatePath, 'utf8');
    template = yaml.load(fileContents);
    resources = template.Resources;
  });

  describe('VPC Configuration', () => {
    test('should have VPC resource', () => {
      expect(resources).toHaveProperty('VPC');
      expect(resources.VPC.Type).toBe('AWS::EC2::VPC');
    });

    test('VPC should have DNS support enabled', () => {
      const vpc = resources.VPC;
      expect(vpc.Properties.EnableDnsSupport).toBe(true);
      expect(vpc.Properties.EnableDnsHostnames).toBe(true);
    });

    test('VPC should have proper tags', () => {
      const vpc = resources.VPC;
      expect(vpc.Properties.Tags).toBeDefined();
      expect(Array.isArray(vpc.Properties.Tags)).toBe(true);
      expect(vpc.Properties.Tags.length).toBeGreaterThan(0);

      const tagKeys = vpc.Properties.Tags.map((tag: any) => tag.Key);
      expect(tagKeys).toContain('Name');
      expect(tagKeys).toContain('Environment');
    });
  });

  describe('Internet Gateway', () => {
    test('should have Internet Gateway', () => {
      expect(resources).toHaveProperty('InternetGateway');
      expect(resources.InternetGateway.Type).toBe('AWS::EC2::InternetGateway');
    });

    test('should have IGW attachment to VPC', () => {
      expect(resources).toHaveProperty('AttachGateway');
      expect(resources.AttachGateway.Type).toBe('AWS::EC2::VPCGatewayAttachment');
      expect(resources.AttachGateway.Properties).toHaveProperty('VpcId');
      expect(resources.AttachGateway.Properties).toHaveProperty('InternetGatewayId');
    });
  });

  describe('Subnets', () => {
    test('should have public subnets', () => {
      expect(resources).toHaveProperty('PublicSubnet1');
      expect(resources).toHaveProperty('PublicSubnet2');

      expect(resources.PublicSubnet1.Type).toBe('AWS::EC2::Subnet');
      expect(resources.PublicSubnet2.Type).toBe('AWS::EC2::Subnet');
    });

    test('public subnets should map public IPs', () => {
      expect(resources.PublicSubnet1.Properties.MapPublicIpOnLaunch).toBe(true);
      expect(resources.PublicSubnet2.Properties.MapPublicIpOnLaunch).toBe(true);
    });

    test('subnets should be in different availability zones', () => {
      const az1 = resources.PublicSubnet1.Properties.AvailabilityZone;
      const az2 = resources.PublicSubnet2.Properties.AvailabilityZone;

      expect(az1).toBeDefined();
      expect(az2).toBeDefined();
      // They should use different indices in GetAZs
      expect(JSON.stringify(az1)).not.toEqual(JSON.stringify(az2));
    });
  });
});

describe('Security Groups', () => {
  let resources: any;

  beforeAll(() => {
    const templatePath = path.join(__dirname, '..', '..', 'lib', 'TapStack.yaml');
    const fileContents = fs.readFileSync(templatePath, 'utf8');
    const template = yaml.load(fileContents);
    resources = template.Resources;
  });

  test('should have ALB security group', () => {
    expect(resources).toHaveProperty('ALBSecurityGroup');
    expect(resources.ALBSecurityGroup.Type).toBe('AWS::EC2::SecurityGroup');
  });

  test('ALB security group should allow HTTP and HTTPS', () => {
    const sg = resources.ALBSecurityGroup;
    const ingress = sg.Properties.SecurityGroupIngress;

    expect(Array.isArray(ingress)).toBe(true);

    const ports = ingress.map((rule: any) => rule.FromPort);
    expect(ports).toContain(80);
    expect(ports).toContain(443);
  });

  test('all security groups should have descriptions', () => {
    const securityGroups = Object.keys(resources).filter(
      (key) => resources[key].Type === 'AWS::EC2::SecurityGroup'
    );

    expect(securityGroups.length).toBeGreaterThan(0);

    securityGroups.forEach((sgName) => {
      const sg = resources[sgName];
      expect(sg.Properties).toHaveProperty('GroupDescription');
      expect(sg.Properties.GroupDescription).toBeTruthy();
    });
  });

  test('security groups should have proper names with environment suffix', () => {
    const securityGroups = Object.keys(resources).filter(
      (key) => resources[key].Type === 'AWS::EC2::SecurityGroup'
    );

    securityGroups.forEach((sgName) => {
      const sg = resources[sgName];
      const groupName = sg.Properties.GroupName;

      // GroupName should use Fn::Sub with EnvironmentSuffix
      if (groupName && typeof groupName === 'object' && groupName['Fn::Sub']) {
        expect(groupName['Fn::Sub']).toContain('${EnvironmentSuffix}');
      }
    });
  });
});

describe('KMS Encryption', () => {
  let resources: any;

  beforeAll(() => {
    const templatePath = path.join(__dirname, '..', '..', 'lib', 'TapStack.yaml');
    const fileContents = fs.readFileSync(templatePath, 'utf8');
    const template = yaml.load(fileContents);
    resources = template.Resources;
  });

  test('should have KMS encryption key', () => {
    expect(resources).toHaveProperty('EncryptionKey');
    expect(resources.EncryptionKey.Type).toBe('AWS::KMS::Key');
  });

  test('KMS key should have a key policy', () => {
    const key = resources.EncryptionKey;
    expect(key.Properties).toHaveProperty('KeyPolicy');
    expect(key.Properties.KeyPolicy).toHaveProperty('Statement');
    expect(Array.isArray(key.Properties.KeyPolicy.Statement)).toBe(true);
    expect(key.Properties.KeyPolicy.Statement.length).toBeGreaterThan(0);
  });

  test('KMS key should have a description', () => {
    const key = resources.EncryptionKey;
    expect(key.Properties).toHaveProperty('Description');
    expect(key.Properties.Description).toBeTruthy();
  });

  test('KMS key should have tags', () => {
    const key = resources.EncryptionKey;
    expect(key.Properties).toHaveProperty('Tags');
    expect(Array.isArray(key.Properties.Tags)).toBe(true);
  });
});

describe('CloudFormation Outputs', () => {
  let outputs: any;

  beforeAll(() => {
    const templatePath = path.join(__dirname, '..', '..', 'lib', 'TapStack.yaml');
    const fileContents = fs.readFileSync(templatePath, 'utf8');
    const template = yaml.load(fileContents);
    outputs = template.Outputs;
  });

  test('should have VPCId output', () => {
    expect(outputs).toHaveProperty('VPCId');
    expect(outputs.VPCId).toHaveProperty('Description');
    expect(outputs.VPCId).toHaveProperty('Value');
    expect(outputs.VPCId).toHaveProperty('Export');
  });

  test('all outputs should have descriptions', () => {
    Object.keys(outputs).forEach((outputName) => {
      const output = outputs[outputName];
      expect(output).toHaveProperty('Description');
      expect(output.Description).toBeTruthy();
    });
  });

  test('all outputs should have export names', () => {
    Object.keys(outputs).forEach((outputName) => {
      const output = outputs[outputName];
      expect(output).toHaveProperty('Export');
      expect(output.Export).toHaveProperty('Name');
    });
  });

  test('export names should use stack name', () => {
    Object.keys(outputs).forEach((outputName) => {
      const output = outputs[outputName];
      const exportName = output.Export.Name;

      // Export name should use Fn::Sub with AWS::StackName
      if (exportName && typeof exportName === 'object' && exportName['Fn::Sub']) {
        expect(exportName['Fn::Sub']).toContain('${AWS::StackName}');
      }
    });
  });
});

describe('Resource Naming Convention', () => {
  let resources: any;

  beforeAll(() => {
    const templatePath = path.join(__dirname, '..', '..', 'lib', 'TapStack.yaml');
    const fileContents = fs.readFileSync(templatePath, 'utf8');
    const template = yaml.load(fileContents);
    resources = template.Resources;
  });

  test('resources should use EnvironmentSuffix in names', () => {
    let resourcesWithEnvSuffix = 0;

    Object.keys(resources).forEach((resourceName) => {
      const resource = resources[resourceName];
      const tags = resource.Properties?.Tags || [];

      const nameTag = tags.find((tag: any) => tag.Key === 'Name');
      if (nameTag && nameTag.Value) {
        const nameValue = nameTag.Value;
        if (typeof nameValue === 'object' && nameValue['Fn::Sub']) {
          if (nameValue['Fn::Sub'].includes('${EnvironmentSuffix}')) {
            resourcesWithEnvSuffix++;
          }
        }
      }
    });

    expect(resourcesWithEnvSuffix).toBeGreaterThan(0);
  });
});

describe('AWS Region Configuration', () => {
  test('AWS_REGION file should exist', () => {
    const regionPath = path.join(__dirname, '..', '..', 'lib', 'AWS_REGION');
    expect(fs.existsSync(regionPath)).toBe(true);
  });

  test('AWS_REGION file should contain valid region', () => {
    const regionPath = path.join(__dirname, '..', '..', 'lib', 'AWS_REGION');
    const region = fs.readFileSync(regionPath, 'utf8').trim();

    // Valid AWS region format
    expect(region).toMatch(/^[a-z]+-[a-z]+-\d+$/);
    expect(region).toBe('eu-south-2');
  });
});
