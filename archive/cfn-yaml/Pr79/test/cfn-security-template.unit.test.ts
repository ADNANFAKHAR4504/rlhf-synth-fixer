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
      expect(yamlContent).toContain('StorageEncrypted: true');
    });
  });

  describe('Environment-Specific Configuration', () => {
    test('should use environment suffix in resource naming', () => {
      const templatePath = path.join(__dirname, '../lib/IDEAL_RESPONSE.md');
      const content = fs.readFileSync(templatePath, 'utf8');
      const yamlMatch = content.match(/```yaml\s*\n([\s\S]*?)\n```/);
      const yamlContent = yamlMatch![1];
      
      expect(yamlContent).toContain('${EnvironmentSuffix}');
    });

    test('should have proper output exports', () => {
      const templatePath = path.join(__dirname, '../lib/IDEAL_RESPONSE.md');
      const content = fs.readFileSync(templatePath, 'utf8');
      const yamlMatch = content.match(/```yaml\s*\n([\s\S]*?)\n```/);
      const yamlContent = yamlMatch![1];
      
      expect(yamlContent).toContain('Export:');
      expect(yamlContent).toContain('Name:');
    });
  });
}); 