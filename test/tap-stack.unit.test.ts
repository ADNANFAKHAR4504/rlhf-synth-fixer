import fs from 'fs';
import path from 'path';

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
  });

  describe('Parameters', () => {
    test('should have ProjectName, VpcCidr1, and VpcCidr2 parameters', () => {
      expect(template.Parameters.ProjectName).toBeDefined();
      expect(template.Parameters.VpcCidr1).toBeDefined();
      expect(template.Parameters.VpcCidr2).toBeDefined();
    });

    test('VpcCidr1 and VpcCidr2 should have default values', () => {
      expect(template.Parameters.VpcCidr1.Default).toBe('10.0.0.0/16');
      expect(template.Parameters.VpcCidr2.Default).toBe('10.1.0.0/16');
    });
  });

  describe('Resources', () => {
    test('should have VpcR1 and VpcR2 resources', () => {
      expect(template.Resources.VpcR1).toBeDefined();
      expect(template.Resources.VpcR2).toBeDefined();
    });

    test('VpcR1 and VpcR2 should be VPCs with correct CIDR blocks', () => {
      expect(template.Resources.VpcR1.Type).toBe('AWS::EC2::VPC');
      expect(template.Resources.VpcR1.Properties.CidrBlock).toEqual({ Ref: 'VpcCidr1' });
      expect(template.Resources.VpcR2.Type).toBe('AWS::EC2::VPC');
      expect(template.Resources.VpcR2.Properties.CidrBlock).toEqual({ Ref: 'VpcCidr2' });
    });

    test('should have ELBSecurityGroupR1 and AppSecurityGroupR1', () => {
      expect(template.Resources.ELBSecurityGroupR1).toBeDefined();
      expect(template.Resources.AppSecurityGroupR1).toBeDefined();
    });

    test('ELBSecurityGroupR1 should allow HTTP and HTTPS from anywhere', () => {
      const ingress = template.Resources.ELBSecurityGroupR1.Properties.SecurityGroupIngress;
      expect(ingress).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ FromPort: 80, ToPort: 80, CidrIp: '0.0.0.0/0' }),
          expect.objectContaining({ FromPort: 443, ToPort: 443, CidrIp: '0.0.0.0/0' }),
        ])
      );
    });

    test('AppSecurityGroupR1 should allow HTTP from ELBSecurityGroupR1 and SSH from anywhere', () => {
      const ingress = template.Resources.AppSecurityGroupR1.Properties.SecurityGroupIngress;
      expect(ingress).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ FromPort: 80, ToPort: 80, SourceSecurityGroupId: { Ref: 'ELBSecurityGroupR1' } }),
          expect.objectContaining({ FromPort: 22, ToPort: 22, CidrIp: '0.0.0.0/0' }),
        ])
      );
    });
  });

  describe('Outputs', () => {
    test('should have VpcIdR1 and VpcIdR2 outputs', () => {
      expect(template.Outputs.VpcIdR1).toBeDefined();
      expect(template.Outputs.VpcIdR2).toBeDefined();
    });

    test('VpcIdR1 and VpcIdR2 outputs should reference correct resources', () => {
      expect(template.Outputs.VpcIdR1.Value).toEqual({ Ref: 'VpcR1' });
      expect(template.Outputs.VpcIdR2.Value).toEqual({ Ref: 'VpcR2' });
    });
  });

  describe('Template Validation', () => {
    test('should have valid JSON structure', () => {
      expect(template).toBeDefined();
      expect(typeof template).toBe('object');
    });

    test('should not have any undefined or null required sections', () => {
      expect(template.AWSTemplateFormatVersion).not.toBeNull();
      expect(template.Parameters).not.toBeNull();
      expect(template.Resources).not.toBeNull();
      expect(template.Outputs).not.toBeNull();
    });
  });
});