import * as fs from 'fs';
import * as path from 'path';
import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import { RuleEngine } from '../lib/rules/rule-engine';
import { ValidationRegistry } from '../lib/core/validation-registry';

describe('Rule Engine Unit Tests', () => {
  const testConfigPath = path.join(__dirname, 'test-rules.yaml');

  beforeEach(() => {
    ValidationRegistry.clear();
  });

  afterEach(() => {
    ValidationRegistry.clear();
    if (fs.existsSync(testConfigPath)) {
      fs.unlinkSync(testConfigPath);
    }
  });

  describe('Rule Loading', () => {
    test('loads rules from YAML file', () => {
      const config = `
rules:
  - name: test-rule
    severity: warning
    category: Test
    resourceType: AWS::S3::Bucket
    condition:
      property: BucketName
      operator: exists
    message: Test message
    remediation: Test remediation
`;
      fs.writeFileSync(testConfigPath, config);

      const engine = new RuleEngine(testConfigPath);
      expect(engine).toBeDefined();
    });

    test('handles missing config file', () => {
      const engine = new RuleEngine('/nonexistent/path.yaml');
      expect(engine).toBeDefined();
    });
  });

  describe('Condition Operators', () => {
    test('equals operator works correctly', () => {
      const config = `
rules:
  - name: equals-test
    severity: critical
    category: Test
    resourceType: AWS::S3::Bucket
    condition:
      property: BucketName
      operator: equals
      value: test-bucket
    message: Bucket name matches
    remediation: Change bucket name
`;
      fs.writeFileSync(testConfigPath, config);

      const app = new cdk.App();
      const stack = new cdk.Stack(app, 'TestStack');
      const bucket = new s3.CfnBucket(stack, 'TestBucket', {
        bucketName: 'test-bucket'
      });

      const engine = new RuleEngine(testConfigPath);
      engine.evaluateRules(bucket, 'AWS::S3::Bucket', {
        BucketName: 'test-bucket'
      });

      const findings = ValidationRegistry.getFindings();
      expect(findings.length).toBe(0); // Rule passes, so no finding
    });

    test('notEquals operator works correctly', () => {
      const config = `
rules:
  - name: notequals-test
    severity: warning
    category: Test
    resourceType: AWS::S3::Bucket
    condition:
      property: BucketName
      operator: notEquals
      value: forbidden-name
    message: Bucket has forbidden name
    remediation: Use different name
`;
      fs.writeFileSync(testConfigPath, config);

      const app = new cdk.App();
      const stack = new cdk.Stack(app, 'TestStack');
      const bucket = new s3.CfnBucket(stack, 'TestBucket', {
        bucketName: 'forbidden-name'
      });

      const engine = new RuleEngine(testConfigPath);
      engine.evaluateRules(bucket, 'AWS::S3::Bucket', {
        BucketName: 'forbidden-name'
      });

      const findings = ValidationRegistry.getFindings();
      expect(findings.length).toBeGreaterThan(0);
      expect(findings[0].message).toContain('forbidden name');
    });

    test('exists operator detects missing properties', () => {
      const config = `
rules:
  - name: exists-test
    severity: critical
    category: Test
    resourceType: AWS::S3::Bucket
    condition:
      property: BucketEncryption
      operator: exists
    message: Bucket must have encryption
    remediation: Add encryption configuration
`;
      fs.writeFileSync(testConfigPath, config);

      const app = new cdk.App();
      const stack = new cdk.Stack(app, 'TestStack');
      const bucket = new s3.CfnBucket(stack, 'TestBucket', {
        bucketName: 'test-bucket'
      });

      const engine = new RuleEngine(testConfigPath);
      engine.evaluateRules(bucket, 'AWS::S3::Bucket', {
        BucketName: 'test-bucket'
        // BucketEncryption is missing
      });

      const findings = ValidationRegistry.getFindings();
      expect(findings.length).toBeGreaterThan(0);
      expect(findings[0].severity).toBe('critical');
    });

    test('notExists operator works correctly', () => {
      const config = `
rules:
  - name: notexists-test
    severity: info
    category: Test
    resourceType: AWS::S3::Bucket
    condition:
      property: WebsiteConfiguration
      operator: notExists
    message: Bucket is not configured as website
    remediation: This is expected for non-website buckets
`;
      fs.writeFileSync(testConfigPath, config);

      const app = new cdk.App();
      const stack = new cdk.Stack(app, 'TestStack');
      const bucket = new s3.CfnBucket(stack, 'TestBucket', {
        bucketName: 'test-bucket',
        websiteConfiguration: { indexDocument: 'index.html' }
      });

      const engine = new RuleEngine(testConfigPath);
      engine.evaluateRules(bucket, 'AWS::S3::Bucket', {
        BucketName: 'test-bucket',
        WebsiteConfiguration: { IndexDocument: 'index.html' }
      });

      const findings = ValidationRegistry.getFindings();
      expect(findings.length).toBeGreaterThan(0);
    });

    test('greaterThan operator works correctly', () => {
      const config = `
rules:
  - name: greaterthan-test
    severity: warning
    category: Test
    resourceType: AWS::Lambda::Function
    condition:
      property: Timeout
      operator: greaterThan
      value: 300
    message: Function timeout is too high
    remediation: Reduce timeout to 300 or less
`;
      fs.writeFileSync(testConfigPath, config);

      const app = new cdk.App();
      const stack = new cdk.Stack(app, 'TestStack');
      const mockConstruct = new cdk.CfnResource(stack, 'TestFunction', {
        type: 'AWS::Lambda::Function'
      });

      const engine = new RuleEngine(testConfigPath);
      engine.evaluateRules(mockConstruct, 'AWS::Lambda::Function', {
        Timeout: 600
      });

      const findings = ValidationRegistry.getFindings();
      expect(findings.length).toBeGreaterThan(0);
      expect(findings[0].message).toContain('timeout is too high');
    });

    test('lessThan operator works correctly', () => {
      const config = `
rules:
  - name: lessthan-test
    severity: info
    category: Test
    resourceType: AWS::Lambda::Function
    condition:
      property: MemorySize
      operator: lessThan
      value: 256
    message: Function has low memory
    remediation: Consider increasing memory
`;
      fs.writeFileSync(testConfigPath, config);

      const app = new cdk.App();
      const stack = new cdk.Stack(app, 'TestStack');
      const mockConstruct = new cdk.CfnResource(stack, 'TestFunction', {
        type: 'AWS::Lambda::Function'
      });

      const engine = new RuleEngine(testConfigPath);
      engine.evaluateRules(mockConstruct, 'AWS::Lambda::Function', {
        MemorySize: 128
      });

      const findings = ValidationRegistry.getFindings();
      expect(findings.length).toBeGreaterThan(0);
      expect(findings[0].message).toContain('low memory');
    });

    test('contains operator works with arrays', () => {
      const config = `
rules:
  - name: contains-test
    severity: critical
    category: Test
    resourceType: AWS::S3::Bucket
    condition:
      property: Tags
      operator: contains
      value: production
    message: Bucket must have production tag
    remediation: Add production tag
`;
      fs.writeFileSync(testConfigPath, config);

      const app = new cdk.App();
      const stack = new cdk.Stack(app, 'TestStack');
      const bucket = new s3.CfnBucket(stack, 'TestBucket', {
        bucketName: 'test-bucket'
      });

      const engine = new RuleEngine(testConfigPath);
      engine.evaluateRules(bucket, 'AWS::S3::Bucket', {
        Tags: ['development', 'testing']
      });

      const findings = ValidationRegistry.getFindings();
      expect(findings.length).toBeGreaterThan(0);
      expect(findings[0].severity).toBe('critical');
    });
  });

  describe('Nested Property Access', () => {
    test('accesses nested properties with dot notation', () => {
      const config = `
rules:
  - name: nested-test
    severity: critical
    category: Test
    resourceType: AWS::S3::Bucket
    condition:
      property: BucketEncryption.ServerSideEncryptionConfiguration
      operator: exists
    message: Must have encryption configuration
    remediation: Add ServerSideEncryptionConfiguration
`;
      fs.writeFileSync(testConfigPath, config);

      const app = new cdk.App();
      const stack = new cdk.Stack(app, 'TestStack');
      const bucket = new s3.CfnBucket(stack, 'TestBucket', {
        bucketName: 'test-bucket'
      });

      const engine = new RuleEngine(testConfigPath);
      engine.evaluateRules(bucket, 'AWS::S3::Bucket', {
        BucketName: 'test-bucket',
        BucketEncryption: {}
        // ServerSideEncryptionConfiguration is missing
      });

      const findings = ValidationRegistry.getFindings();
      expect(findings.length).toBeGreaterThan(0);
    });
  });

  describe('Rule Metadata', () => {
    test('includes rule name in findings', () => {
      const config = `
rules:
  - name: metadata-test-rule
    severity: warning
    category: Test
    resourceType: AWS::S3::Bucket
    condition:
      property: NonExistentProperty
      operator: exists
    message: Test message
    remediation: Test remediation
`;
      fs.writeFileSync(testConfigPath, config);

      const app = new cdk.App();
      const stack = new cdk.Stack(app, 'TestStack');
      const bucket = new s3.CfnBucket(stack, 'TestBucket', {
        bucketName: 'test-bucket'
      });

      const engine = new RuleEngine(testConfigPath);
      engine.evaluateRules(bucket, 'AWS::S3::Bucket', {
        BucketName: 'test-bucket'
      });

      const findings = ValidationRegistry.getFindings();
      expect(findings[0].metadata?.rule).toBe('metadata-test-rule');
    });

    test('includes actual value in metadata', () => {
      const config = `
rules:
  - name: value-test
    severity: warning
    category: Test
    resourceType: AWS::S3::Bucket
    condition:
      property: BucketName
      operator: equals
      value: expected-name
    message: Bucket name mismatch
    remediation: Fix bucket name
`;
      fs.writeFileSync(testConfigPath, config);

      const app = new cdk.App();
      const stack = new cdk.Stack(app, 'TestStack');
      const bucket = new s3.CfnBucket(stack, 'TestBucket', {
        bucketName: 'actual-name'
      });

      const engine = new RuleEngine(testConfigPath);
      engine.evaluateRules(bucket, 'AWS::S3::Bucket', {
        BucketName: 'actual-name'
      });

      const findings = ValidationRegistry.getFindings();
      expect(findings[0].metadata?.actualValue).toBe('actual-name');
    });
  });

  describe('Multiple Rules', () => {
    test('evaluates all applicable rules', () => {
      const config = `
rules:
  - name: rule1
    severity: critical
    category: Test
    resourceType: AWS::S3::Bucket
    condition:
      property: BucketEncryption
      operator: exists
    message: Rule 1 message
    remediation: Rule 1 remediation
  - name: rule2
    severity: warning
    category: Test
    resourceType: AWS::S3::Bucket
    condition:
      property: Versioning
      operator: exists
    message: Rule 2 message
    remediation: Rule 2 remediation
`;
      fs.writeFileSync(testConfigPath, config);

      const app = new cdk.App();
      const stack = new cdk.Stack(app, 'TestStack');
      const bucket = new s3.CfnBucket(stack, 'TestBucket', {
        bucketName: 'test-bucket'
      });

      const engine = new RuleEngine(testConfigPath);
      engine.evaluateRules(bucket, 'AWS::S3::Bucket', {
        BucketName: 'test-bucket'
      });

      const findings = ValidationRegistry.getFindings();
      expect(findings.length).toBe(2);
    });

    test('only evaluates rules for matching resource type', () => {
      const config = `
rules:
  - name: s3-rule
    severity: critical
    category: Test
    resourceType: AWS::S3::Bucket
    condition:
      property: BucketName
      operator: exists
    message: S3 rule
    remediation: Fix S3
  - name: lambda-rule
    severity: critical
    category: Test
    resourceType: AWS::Lambda::Function
    condition:
      property: FunctionName
      operator: exists
    message: Lambda rule
    remediation: Fix Lambda
`;
      fs.writeFileSync(testConfigPath, config);

      const app = new cdk.App();
      const stack = new cdk.Stack(app, 'TestStack');
      const bucket = new s3.CfnBucket(stack, 'TestBucket', {
        bucketName: 'test-bucket'
      });

      const engine = new RuleEngine(testConfigPath);
      engine.evaluateRules(bucket, 'AWS::S3::Bucket', {
        BucketName: 'test-bucket'
      });

      const findings = ValidationRegistry.getFindings();
      // Should not trigger Lambda rule
      expect(findings.every(f => !f.message.includes('Lambda'))).toBe(true);
    });
  });
});
