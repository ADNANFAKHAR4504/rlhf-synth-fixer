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
    test('should have all required parameters', () => {
      const params = [
        'ProjectName', 'Region1', 'Region2', 'VpcCidr1', 'VpcCidr2',
        'PublicSubnet1Cidr1', 'PublicSubnet2Cidr1', 'PrivateSubnet1Cidr1', 'PrivateSubnet2Cidr1',
        'PublicSubnet1Cidr2', 'PublicSubnet2Cidr2', 'PrivateSubnet1Cidr2', 'PrivateSubnet2Cidr2',
        'InstanceType', 'DBInstanceType', 'DBAllocatedStorage', 'DBUsername', 'DBPassword'
      ];
      params.forEach(param => {
        expect(template.Parameters[param]).toBeDefined();
      });
    });
    test('should have correct default values for VPC and subnet CIDRs', () => {
      expect(template.Parameters.VpcCidr1.Default).toBe('10.0.0.0/16');
      expect(template.Parameters.VpcCidr2.Default).toBe('10.1.0.0/16');
      expect(template.Parameters.PublicSubnet1Cidr1.Default).toBe('10.0.1.0/24');
      expect(template.Parameters.PublicSubnet2Cidr1.Default).toBe('10.0.2.0/24');
      expect(template.Parameters.PrivateSubnet1Cidr1.Default).toBe('10.0.101.0/24');
      expect(template.Parameters.PrivateSubnet2Cidr1.Default).toBe('10.0.102.0/24');
      expect(template.Parameters.PublicSubnet1Cidr2.Default).toBe('10.1.1.0/24');
      expect(template.Parameters.PublicSubnet2Cidr2.Default).toBe('10.1.2.0/24');
      expect(template.Parameters.PrivateSubnet1Cidr2.Default).toBe('10.1.101.0/24');
      expect(template.Parameters.PrivateSubnet2Cidr2.Default).toBe('10.1.102.0/24');
    });
  });

  describe('Resources', () => {
    test('should have VpcR1 and VpcR2 resources', () => {
      expect(template.Resources.VpcR1).toBeDefined();
      expect(template.Resources.VpcR2).toBeDefined();
    });
    test('should have all subnet resources for both regions', () => {
      [
        'PublicSubnet1R1', 'PublicSubnet2R1', 'PrivateSubnet1R1', 'PrivateSubnet2R1',
        'PublicSubnet1R2', 'PublicSubnet2R2', 'PrivateSubnet1R2', 'PrivateSubnet2R2'
      ].forEach(subnet => {
        expect(template.Resources[subnet]).toBeDefined();
      });
    });
    test('should have InternetGateways and attachments for both regions', () => {
      expect(template.Resources.InternetGatewayR1).toBeDefined();
      expect(template.Resources.InternetGatewayR2).toBeDefined();
      expect(template.Resources.AttachIgwR1).toBeDefined();
      expect(template.Resources.AttachIgwR2).toBeDefined();
    });
    test('should have NAT Gateways and EIPs for both regions', () => {
      expect(template.Resources.NatGatewayR1).toBeDefined();
      expect(template.Resources.NatGatewayR2).toBeDefined();
      expect(template.Resources.NatEIPR1).toBeDefined();
      expect(template.Resources.NatEIPR2).toBeDefined();
    });
    test('should have route tables and associations for both regions', () => {
      [
        'PublicRouteTableR1', 'PublicRouteTableR2', 'PrivateRouteTableR1', 'PrivateRouteTableR2',
        'PublicRouteR1', 'PublicRouteR2', 'PrivateRouteR1', 'PrivateRouteR2',
        'PublicSubnet1RouteTableAssociationR1', 'PublicSubnet2RouteTableAssociationR1',
        'PublicSubnet1RouteTableAssociationR2', 'PublicSubnet2RouteTableAssociationR2',
        'PrivateSubnet1RouteTableAssociationR1', 'PrivateSubnet2RouteTableAssociationR1',
        'PrivateSubnet1RouteTableAssociationR2', 'PrivateSubnet2RouteTableAssociationR2'
      ].forEach(rt => {
        expect(template.Resources[rt]).toBeDefined();
      });
    });
    test('should have security groups for both regions', () => {
      expect(template.Resources.ELBSecurityGroupR1).toBeDefined();
      expect(template.Resources.AppSecurityGroupR1).toBeDefined();
      expect(template.Resources.ELBSecurityGroupR2).toBeDefined();
      expect(template.Resources.AppSecurityGroupR2).toBeDefined();
    });
    test('should have EC2 and RDS resources for both regions', () => {
      expect(template.Resources.EC2InstanceR1).toBeDefined();
      expect(template.Resources.EC2InstanceR2).toBeDefined();
      expect(template.Resources.RDSInstanceR1).toBeDefined();
      expect(template.Resources.RDSInstanceR2).toBeDefined();
    });
    test('should have DBSubnetGroups for both regions', () => {
      expect(template.Resources.DBSubnetGroupR1).toBeDefined();
      expect(template.Resources.DBSubnetGroupR2).toBeDefined();
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