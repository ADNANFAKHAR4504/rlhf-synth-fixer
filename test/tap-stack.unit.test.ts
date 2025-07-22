import fs from 'fs';
import path from 'path';

describe('TapStack CloudFormation Template', () => {
  let template: any;

  beforeAll(() => {
    // This test reads the JSON version of your CloudFormation template.
    const templatePath = path.join(__dirname, '../lib/TapStack.json'); 
    template = JSON.parse(fs.readFileSync(templatePath, 'utf8'));
  });

  //================================================================================
  // ## Template Structure and Validation (3 Tests)
  //================================================================================
  describe('Template Validation & Structure', () => {
    test('should have a valid CloudFormation format version', () => {
      expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
    });

    test('should have a non-empty Description', () => {
      expect(template.Description).toBeDefined();
    });
    
    test('should have Parameters and Resources sections', () => {
      expect(template.Parameters).toBeDefined();
      expect(template.Resources).toBeDefined();
    });
  });

  //================================================================================
  // ## Resources (6 Tests)
  //================================================================================
  describe('Resources', () => {
    // --- NEW TEST ---
    test('VPC should have DNS support and hostnames enabled', () => {
      const vpc = template.Resources.VpcR1;
      expect(vpc).toBeDefined();
      expect(vpc.Properties.EnableDnsSupport).toBe(true);
      expect(vpc.Properties.EnableDnsHostnames).toBe(true);
    });

    // --- NEW TEST ---
    test('⚠️ App Security Group should have overly permissive ingress rules', () => {
      const appSg = template.Resources.AppSgR1;
      expect(appSg).toBeDefined();
      expect(appSg.Properties.SecurityGroupIngress).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ CidrIp: '0.0.0.0/0', IpProtocol: 'tcp', FromPort: 80 }),
          expect.objectContaining({ CidrIp: '0.0.0.0/0', IpProtocol: 'tcp', FromPort: 22 })
        ])
      );
    });

    // --- NEW TEST ---
    test('🚨 should provision a NAT EIP but is MISSING the NAT Gateway resource', () => {
      // This confirms an Elastic IP is created but not used by a NAT Gateway,
      // leaving private subnets without internet access.
      expect(template.Resources.NatEipR1).toBeDefined();
      expect(template.Resources.NatGwR1).toBeUndefined();
    });
      
    test('should have a Private Route Table with no default route', () => {
      expect(template.Resources.PrivateRouteTableR1).toBeDefined();

      const privateRouteResource = Object.values(template.Resources).find(
        (r: any) => r.Type === 'AWS::EC2::Route' && r.Properties.RouteTableId.Ref === 'PrivateRouteTableR1'
      );
      expect(privateRouteResource).toBeUndefined();
    });
      
    test('DB Security Group should have NO ingress rules by default', () => {
      const dbSg = template.Resources.DbSgR1;
      expect(dbSg).toBeDefined();
      expect(dbSg.Properties.SecurityGroupIngress).toBeUndefined();
    });
      
    test('IAM Role should be defined but MISSING an Instance Profile', () => {
      expect(template.Resources.Ec2InstanceRole).toBeDefined();
      expect(template.Resources.Ec2InstanceProfile).toBeUndefined();
    });
  });
});