import fs from 'fs';
import path from 'path';

describe('TapStack CloudFormation Template - Unit Tests', () => {
  const templatePath = path.join(__dirname, '../../lib/TapStack.yml');

  describe('Template File', () => {
    test('should exist at the expected location', () => {
      expect(fs.existsSync(templatePath)).toBe(true);
    });

    test('should be a valid YAML file', () => {
      const templateContent = fs.readFileSync(templatePath, 'utf8');
      expect(templateContent).toBeDefined();
      expect(templateContent.length).toBeGreaterThan(0);
    });

    test('should contain AWSTemplateFormatVersion', () => {
      const templateContent = fs.readFileSync(templatePath, 'utf8');
      expect(templateContent).toContain('AWSTemplateFormatVersion');
      expect(templateContent).toContain('2010-09-09');
    });

    test('should contain required CloudFormation sections', () => {
      const templateContent = fs.readFileSync(templatePath, 'utf8');
      expect(templateContent).toContain('Parameters:');
      expect(templateContent).toContain('Resources:');
      expect(templateContent).toContain('Outputs:');
    });

    test('should contain VPC resource', () => {
      const templateContent = fs.readFileSync(templatePath, 'utf8');
      expect(templateContent).toContain('VPC:');
      expect(templateContent).toContain('AWS::EC2::VPC');
    });

    test('should contain ECS cluster', () => {
      const templateContent = fs.readFileSync(templatePath, 'utf8');
      expect(templateContent).toContain('ECSCluster:');
      expect(templateContent).toContain('AWS::ECS::Cluster');
    });

    test('should contain Aurora DB cluster', () => {
      const templateContent = fs.readFileSync(templatePath, 'utf8');
      expect(templateContent).toContain('AuroraDBCluster:');
      expect(templateContent).toContain('AWS::RDS::DBCluster');
    });

    test('should contain Application Load Balancer', () => {
      const templateContent = fs.readFileSync(templatePath, 'utf8');
      expect(templateContent).toContain('ApplicationLoadBalancer:');
      expect(templateContent).toContain('AWS::ElasticLoadBalancingV2::LoadBalancer');
    });

    test('should contain EnvironmentSuffix parameter', () => {
      const templateContent = fs.readFileSync(templatePath, 'utf8');
      expect(templateContent).toContain('EnvironmentSuffix:');
    });

    test('should contain KMS encryption key', () => {
      const templateContent = fs.readFileSync(templatePath, 'utf8');
      expect(templateContent).toContain('EncryptionKey:');
      expect(templateContent).toContain('AWS::KMS::Key');
    });
  });
});
