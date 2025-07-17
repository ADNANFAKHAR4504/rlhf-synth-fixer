import fs from 'fs';
import path from 'path';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('CloudFormation Security Template Unit Tests', () => {
  let template: any;
  
  beforeAll(() => {
    // Load the CloudFormation template from IDEAL_RESPONSE.md
    const templatePath = path.join(__dirname, '../lib/IDEAL_RESPONSE.md');
    const content = fs.readFileSync(templatePath, 'utf8');
    
    // Extract YAML content and convert to JSON for testing
    // Note: In production, you'd run `pipenv run cfn-flip-to-json` to convert YAML to JSON
    const yamlMatch = content.match(/```yaml\s*\n([\s\S]*?)\n```/);
    if (yamlMatch) {
      // For now, we'll test the structure by checking the raw YAML content
      // In a real scenario, you'd convert this to JSON first
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
      
      // Check that IAM policies don't use wildcard permissions
      expect(content).not.toContain('Effect: Allow\n        Action: "*"');
      expect(content).not.toContain('Resource: "*"');
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
      
      // Check that no hardcoded secrets are present
      expect(content).not.toContain('password123');
      expect(content).not.toContain('secret');
      expect(content).not.toContain('AKIA'); // AWS Access Key pattern
    });
  });
}); 