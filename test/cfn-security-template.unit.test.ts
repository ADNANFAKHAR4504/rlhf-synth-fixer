import fs from 'fs';
import path from 'path';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('CloudFormation Security Template', () => {
  describe('Template Structure', () => {
    test('should have correct template format version', () => {
      const templatePath = path.join(__dirname, '../lib/IDEAL_RESPONSE.md');
      const content = fs.readFileSync(templatePath, 'utf8');
      const yamlMatch = content.match(/```yaml\s*\n([\s\S]*?)\n```/);
      const yamlContent = yamlMatch![1];
      
      expect(yamlContent).toContain('AWSTemplateFormatVersion: \'2010-09-09\'');
      expect(yamlContent).toContain('Description: \'Unified Template: Deploys a Primary stack or a Replica stack based on parameters. v2.0\'');
    });

    test('should define required parameters', () => {
      const templatePath = path.join(__dirname, '../lib/IDEAL_RESPONSE.md');
      const content = fs.readFileSync(templatePath, 'utf8');
      const yamlMatch = content.match(/```yaml\s*\n([\s\S]*?)\n```/);
      const yamlContent = yamlMatch![1];
      
      expect(yamlContent).toContain('DeploymentType:');
      expect(yamlContent).toContain('EnvironmentSuffix:');
      expect(yamlContent).toContain('DomainName:');
      expect(yamlContent).toContain('Subdomain:');
    });

    test('should define conditions for deployment types', () => {
      const templatePath = path.join(__dirname, '../lib/IDEAL_RESPONSE.md');
      const content = fs.readFileSync(templatePath, 'utf8');
      const yamlMatch = content.match(/```yaml\s*\n([\s\S]*?)\n```/);
      const yamlContent = yamlMatch![1];
      
      expect(yamlContent).toContain('IsPrimaryDeployment:');
      expect(yamlContent).toContain('IsReplicaDeployment:');
    });
  });

  describe('Infrastructure Resources', () => {
    test('should include networking resources', () => {
      const templatePath = path.join(__dirname, '../lib/IDEAL_RESPONSE.md');
      const content = fs.readFileSync(templatePath, 'utf8');
      const yamlMatch = content.match(/```yaml\s*\n([\s\S]*?)\n```/);
      const yamlContent = yamlMatch![1];
      
      expect(yamlContent).toContain('AWS::EC2::VPC');
      expect(yamlContent).toContain('AWS::EC2::InternetGateway');
      expect(yamlContent).toContain('AWS::EC2::Subnet');
      expect(yamlContent).toContain('AWS::EC2::RouteTable');
      expect(yamlContent).toContain('AWS::EC2::NatGateway');
      expect(yamlContent).toContain('AWS::EC2::SecurityGroup');
    });

    test('should include database resources', () => {
      const templatePath = path.join(__dirname, '../lib/IDEAL_RESPONSE.md');
      const content = fs.readFileSync(templatePath, 'utf8');
      const yamlMatch = content.match(/```yaml\s*\n([\s\S]*?)\n```/);
      const yamlContent = yamlMatch![1];
      
      expect(yamlContent).toContain('AWS::RDS::DBInstance');
      expect(yamlContent).toContain('AWS::RDS::DBSubnetGroup');
      expect(yamlContent).toContain('MultiAZ: false');
    });

    test('should include storage and CDN resources', () => {
      const templatePath = path.join(__dirname, '../lib/IDEAL_RESPONSE.md');
      const content = fs.readFileSync(templatePath, 'utf8');
      const yamlMatch = content.match(/```yaml\s*\n([\s\S]*?)\n```/);
      const yamlContent = yamlMatch![1];
      
      expect(yamlContent).toContain('AWS::S3::Bucket');
      expect(yamlContent).toContain('BucketEncryption');
      expect(yamlContent).toContain('AWS::CloudFront::Distribution');
      expect(yamlContent).toContain('AWS::CloudFront::CloudFrontOriginAccessIdentity');
    });

    test('should include security and encryption resources', () => {
      const templatePath = path.join(__dirname, '../lib/IDEAL_RESPONSE.md');
      const content = fs.readFileSync(templatePath, 'utf8');
      const yamlMatch = content.match(/```yaml\s*\n([\s\S]*?)\n```/);
      const yamlContent = yamlMatch![1];
      
      expect(yamlContent).toContain('AWS::KMS::Key');
      expect(yamlContent).toContain('AWS::SecretsManager::Secret');
    });
  });

  describe('Security Best Practices', () => {
    test('should use least privilege IAM policies', () => {
      const templatePath = path.join(__dirname, '../lib/IDEAL_RESPONSE.md');
      const content = fs.readFileSync(templatePath, 'utf8');
      
      // Check that IAM policies don't use overly broad wildcard permissions
      // Allow KMS policies to use Resource: "*" as that's standard practice
      const iamPolicySection = content.match(/PolicyDocument:([\s\S]*?)(?=\n\s{2,8}[A-Z]|$)/g);
      if (iamPolicySection) {
        iamPolicySection.forEach(section => {
          // Check for overly permissive actions like Action: "*"
          expect(section).not.toContain('Action: "*"');
          expect(section).not.toContain('Action:\n        - "*"');
        });
      }
    });

    test('should use encryption for sensitive resources', () => {
      const templatePath = path.join(__dirname, '../lib/IDEAL_RESPONSE.md');
      const content = fs.readFileSync(templatePath, 'utf8');
      
      // Check for encryption configurations
      expect(content).toContain('BucketEncryption');
      expect(content).toContain('StorageEncrypted: true');
    });

    test('should not expose sensitive information', () => {
      const templatePath = path.join(__dirname, '../lib/IDEAL_RESPONSE.md');
      const content = fs.readFileSync(templatePath, 'utf8');
      
      // Check that no hardcoded secrets are present (but allow AWS service names)
      expect(content).not.toContain('password123');
      expect(content).not.toContain('hardcoded-secret-key');
      expect(content).not.toContain('AKIA'); // AWS Access Key pattern
      
      // Check that we're using proper secret management
      expect(content).toContain('AWS::SecretsManager::Secret');
      expect(content).toContain('resolve:secretsmanager');
    });

    test('should use environment-specific naming', () => {
      const templatePath = path.join(__dirname, '../lib/IDEAL_RESPONSE.md');
      const content = fs.readFileSync(templatePath, 'utf8');
      const yamlMatch = content.match(/```yaml\s*\n([\s\S]*?)\n```/);
      const yamlContent = yamlMatch![1];
      
      // Check that resources use EnvironmentSuffix for naming
      expect(yamlContent).toContain('${EnvironmentSuffix}');
    });
  });
}); 