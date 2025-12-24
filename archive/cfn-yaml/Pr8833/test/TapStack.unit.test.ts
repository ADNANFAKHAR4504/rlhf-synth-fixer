import { readFileSync } from 'fs';
import { join } from 'path';

interface CloudFormationTemplate {
  AWSTemplateFormatVersion?: string;
  Description?: string;
  Parameters?: Record<string, any>;
  Resources?: Record<string, any>;
  Outputs?: Record<string, any>;
}

describe('Hub-and-Spoke CloudFormation Template Unit Tests', () => {
  let template: CloudFormationTemplate;

  beforeAll(() => {
    const templatePath = join(process.cwd(), 'lib', 'TapStack.json');
    const templateContent = readFileSync(templatePath, 'utf8');
    template = JSON.parse(templateContent);
  });

  describe('Template Structure', () => {
    test('should have valid CloudFormation version', () => {
      expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
    });

    test('should have description', () => {
      expect(template.Description).toBeDefined();
      expect(template.Description).toContain('Hub-and-Spoke');
    });

    test('should have Parameters section', () => {
      expect(template.Parameters).toBeDefined();
      expect(template.Parameters?.EnvironmentSuffix).toBeDefined();
      expect(template.Parameters?.Environment).toBeDefined();
    });

    test('should have Resources section', () => {
      expect(template.Resources).toBeDefined();
      expect(Object.keys(template.Resources || {}).length).toBeGreaterThan(0);
    });

    test('should have Outputs section', () => {
      expect(template.Outputs).toBeDefined();
      expect(Object.keys(template.Outputs || {}).length).toBeGreaterThan(0);
    });
  });

  describe('VPC Resources', () => {
    test('should have Hub VPC', () => {
      expect(template.Resources?.HubVPC).toBeDefined();
      expect(template.Resources?.HubVPC.Type).toBe('AWS::EC2::VPC');
    });

    test('should have Finance VPC', () => {
      expect(template.Resources?.FinanceVPC).toBeDefined();
      expect(template.Resources?.FinanceVPC.Type).toBe('AWS::EC2::VPC');
    });

    test('should have Engineering VPC', () => {
      expect(template.Resources?.EngineeringVPC).toBeDefined();
      expect(template.Resources?.EngineeringVPC.Type).toBe('AWS::EC2::VPC');
    });

    test('should have Marketing VPC', () => {
      expect(template.Resources?.MarketingVPC).toBeDefined();
      expect(template.Resources?.MarketingVPC.Type).toBe('AWS::EC2::VPC');
    });
  });

  describe('Transit Gateway', () => {
    test('should have Transit Gateway resource', () => {
      expect(template.Resources?.TransitGateway).toBeDefined();
      expect(template.Resources?.TransitGateway.Type).toBe('AWS::EC2::TransitGateway');
    });

    test('should have Transit Gateway attachments', () => {
      const resources = template.Resources || {};
      const attachments = Object.values(resources).filter(
        (r: any) => r.Type === 'AWS::EC2::TransitGatewayAttachment'
      );
      expect(attachments.length).toBeGreaterThanOrEqual(4);
    });
  });

  describe('Outputs', () => {
    test('should output VPC IDs', () => {
      expect(template.Outputs?.HubVpcId).toBeDefined();
      expect(template.Outputs?.FinanceVpcId).toBeDefined();
      expect(template.Outputs?.EngineeringVpcId).toBeDefined();
      expect(template.Outputs?.MarketingVpcId).toBeDefined();
    });

    test('should output Transit Gateway ID', () => {
      expect(template.Outputs?.TransitGatewayId).toBeDefined();
    });
  });
});
