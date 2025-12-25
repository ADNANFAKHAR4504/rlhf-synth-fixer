import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';

/**
 * CloudFormation Template Validation Tests
 * 
 * This is a pure CFN YAML template task with no CDK/TypeScript infrastructure code.
 * These tests validate the static YAML template structure.
 */
describe('CloudFormation Template Validation', () => {
  const templatePath = path.join(__dirname, '..', 'lib', 'TapStack.yml');
  let template: any;

  beforeAll(() => {
    const templateContent = fs.readFileSync(templatePath, 'utf8');
    template = yaml.load(templateContent);
  });

  test('template file exists', () => {
    expect(fs.existsSync(templatePath)).toBe(true);
  });

  test('template is valid YAML', () => {
    expect(template).toBeDefined();
    expect(typeof template).toBe('object');
  });

  test('template has required CloudFormation sections', () => {
    expect(template).toHaveProperty('Resources');
  });

  test('template contains S3 bucket resources', () => {
    const resources = template.Resources || {};
    const s3Buckets = Object.entries(resources).filter(
      ([, resource]: [string, any]) => resource.Type === 'AWS::S3::Bucket'
    );
    expect(s3Buckets.length).toBeGreaterThan(0);
  });

  test('template contains IAM role resources', () => {
    const resources = template.Resources || {};
    const iamRoles = Object.entries(resources).filter(
      ([, resource]: [string, any]) => resource.Type === 'AWS::IAM::Role'
    );
    expect(iamRoles.length).toBeGreaterThan(0);
  });

  test('S3 buckets have encryption configured', () => {
    const resources = template.Resources || {};
    const s3Buckets = Object.entries(resources).filter(
      ([, resource]: [string, any]) => resource.Type === 'AWS::S3::Bucket'
    );

    s3Buckets.forEach(([name, bucket]: [string, any]) => {
      expect(bucket.Properties).toHaveProperty('BucketEncryption');
    });
  });

  test('template resources use secureapp prefix', () => {
    const resources = template.Resources || {};
    const resourceNames = Object.keys(resources);
    
    // At least some resources should use the prefix
    const prefixedResources = resourceNames.filter(name => 
      name.toLowerCase().includes('secure') || 
      (resources[name].Properties?.BucketName?.toLowerCase().includes('secureapp'))
    );
    
    expect(prefixedResources.length).toBeGreaterThan(0);
  });
});
