import fs from 'fs';
import path from 'path';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('CloudFormation Security Template Unit Tests', () => {
  let template: any;
  
  beforeAll(() => {
    // Load the CloudFormation template from IDEAL_RESPONSE.md
    const templatePath = path.join(__dirname, '../lib/IDEAL_RESPONSE.md');
    const content = fs.readFileSync(templatePath, 'utf8');
    
    // Extract YAML content from code blocks
    const yamlMatch = content.match(/```yaml\s*\n([\s\S]*?)\n```/);
    if (yamlMatch) {
      const yamlContent = yamlMatch[1];
      expect(yamlContent).toContain('AWSTemplateFormatVersion');
    } else {
      throw new Error('Could not find YAML template in IDEAL_RESPONSE.md');
    }
  });

  describe('Template Content Validation', () => {
    test('should contain CloudFormation template structure', () => {
      const templatePath = path.join(__dirname, '../lib/IDEAL_RESPONSE.md');
      const content = fs.readFileSync(templatePath, 'utf8');
      const yamlMatch = content.match(/```yaml\s*\n([\s\S]*?)\n```/);
      
      expect(yamlMatch).toBeTruthy();
      const yamlContent = yamlMatch![1];
      
      // Basic structure checks
      expect(yamlContent).toContain('AWSTemplateFormatVersion: \'2010-09-09\'');
      expect(yamlContent).toContain('Description:');
      expect(yamlContent).toContain('Parameters:');
      expect(yamlContent).toContain('Resources:');
      expect(yamlContent).toContain('Outputs:');
    });

    test('should include VPC resources', () => {
      const templatePath = path.join(__dirname, '../lib/IDEAL_RESPONSE.md');
      const content = fs.readFileSync(templatePath, 'utf8');
      const yamlMatch = content.match(/```yaml\s*\n([\s\S]*?)\n```/);
      const yamlContent = yamlMatch![1];
      
      expect(yamlContent).toContain('AWS::EC2::VPC');
      expect(yamlContent).toContain('AWS::EC2::Subnet');
      expect(yamlContent).toContain('AWS::EC2::InternetGateway');
    });

    test('should include security resources', () => {
      const templatePath = path.join(__dirname, '../lib/IDEAL_RESPONSE.md');
      const content = fs.readFileSync(templatePath, 'utf8');
      const yamlMatch = content.match(/```yaml\s*\n([\s\S]*?)\n```/);
      const yamlContent = yamlMatch![1];
      
      expect(yamlContent).toContain('AWS::IAM::Role');
      expect(yamlContent).toContain('AWS::EC2::SecurityGroup');
      expect(yamlContent).toContain('AWS::KMS::Key');
    });

    test('should include database resources', () => {
      const templatePath = path.join(__dirname, '../lib/IDEAL_RESPONSE.md');
      const content = fs.readFileSync(templatePath, 'utf8');
      const yamlMatch = content.match(/```yaml\s*\n([\s\S]*?)\n```/);
      const yamlContent = yamlMatch![1];
      
      expect(yamlContent).toContain('AWS::RDS::DBInstance');
      expect(yamlContent).toContain('MultiAZ: true');
    });

    test('should include storage resources', () => {
      const templatePath = path.join(__dirname, '../lib/IDEAL_RESPONSE.md');
      const content = fs.readFileSync(templatePath, 'utf8');
      const yamlMatch = content.match(/```yaml\s*\n([\s\S]*?)\n```/);
      const yamlContent = yamlMatch![1];
      
      expect(yamlContent).toContain('AWS::S3::Bucket');
      expect(yamlContent).toContain('BucketEncryption');
    });

    test('should include load balancer and auto scaling', () => {
      const templatePath = path.join(__dirname, '../lib/IDEAL_RESPONSE.md');
      const content = fs.readFileSync(templatePath, 'utf8');
      const yamlMatch = content.match(/```yaml\s*\n([\s\S]*?)\n```/);
      const yamlContent = yamlMatch![1];
      
      expect(yamlContent).toContain('AWS::ElasticLoadBalancingV2::LoadBalancer');
      expect(yamlContent).toContain('AWS::AutoScaling::AutoScalingGroup');
    });

    test('should include CloudFront and WAF', () => {
      const templatePath = path.join(__dirname, '../lib/IDEAL_RESPONSE.md');
      const content = fs.readFileSync(templatePath, 'utf8');
      const yamlMatch = content.match(/```yaml\s*\n([\s\S]*?)\n```/);
      const yamlContent = yamlMatch![1];
      
      expect(yamlContent).toContain('AWS::CloudFront::Distribution');
      expect(yamlContent).toContain('AWS::WAFv2::WebACL');
    });

    test('should include monitoring resources', () => {
      const templatePath = path.join(__dirname, '../lib/IDEAL_RESPONSE.md');
      const content = fs.readFileSync(templatePath, 'utf8');
      const yamlMatch = content.match(/```yaml\s*\n([\s\S]*?)\n```/);
      const yamlContent = yamlMatch![1];
      
      expect(yamlContent).toContain('AWS::CloudWatch::Alarm');
    });
  });

  describe('Security Best Practices', () => {
    test('should use least privilege IAM policies', () => {
      const templatePath = path.join(__dirname, '../lib/IDEAL_RESPONSE.md');
      const content = fs.readFileSync(templatePath, 'utf8');
      const yamlMatch = content.match(/```yaml\s*\n([\s\S]*?)\n```/);
      const yamlContent = yamlMatch![1];
      
      // Check that IAM policies don't use overly broad wildcard permissions
      // Allow KMS policies to use Resource: "*" as that's standard practice
      const iamPolicySection = yamlContent.match(/PolicyDocument:([\s\S]*?)(?=\n\s{2,8}[A-Z]|$)/g);
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
      const yamlMatch = content.match(/```yaml\s*\n([\s\S]*?)\n```/);
      const yamlContent = yamlMatch![1];
      
      // Check for encryption configurations
      expect(yamlContent).toContain('BucketEncryption');
      expect(yamlContent).toContain('StorageEncrypted: true');
    });

    test('should not expose sensitive information', () => {
      const templatePath = path.join(__dirname, '../lib/IDEAL_RESPONSE.md');
      const content = fs.readFileSync(templatePath, 'utf8');
      const yamlMatch = content.match(/```yaml\s*\n([\s\S]*?)\n```/);
      const yamlContent = yamlMatch![1];
      
      // Check that no hardcoded secrets are present (but allow AWS service names)
      expect(yamlContent).not.toContain('password123');
      expect(yamlContent).not.toContain('hardcoded-secret-key');
      expect(yamlContent).not.toContain('AKIA'); // AWS Access Key pattern
      
      // Check that we're using proper secret management
      expect(yamlContent).toContain('AWS::SecretsManager::Secret');
      expect(yamlContent).toContain('resolve:secretsmanager');
    });
  });
}); 