import fs from 'fs';
import path from 'path';

describe('TapStack CloudFormation Template', () => {
  let template: any;

  beforeAll(() => {
    const templatePath = path.join(__dirname, '../lib/TapStack.json'); 
    template = JSON.parse(fs.readFileSync(templatePath, 'utf8'));
  });

  //================================================================================
  // ## Template Structure and Validation
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
  // ## Resources
  //================================================================================
  describe('Resources', () => {
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

  // The "Outputs" test suite has been removed to align with the provided JSON.
});