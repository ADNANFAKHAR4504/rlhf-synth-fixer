import { ValidationRegistry } from '../lib/core/validation-registry';
import { StackComparator } from '../lib/comparator/stack-comparator';
import { RuleEngine } from '../lib/rules/rule-engine';
import * as fs from 'fs';
import * as path from 'path';
// eslint-disable-next-line import/no-extraneous-dependencies
import * as yaml from 'js-yaml';

describe('Validation Framework Components Unit Tests', () => {
  describe('ValidationRegistry', () => {
    beforeEach(() => {
      ValidationRegistry.clear();
    });

    afterEach(() => {
      ValidationRegistry.clear();
    });

    test('adds findings correctly', () => {
      ValidationRegistry.addFinding({
        severity: 'critical',
        category: 'S3',
        resource: 'test-bucket',
        message: 'Test message',
        remediation: 'Test remediation',
        executionTime: 10,
      });

      const findings = ValidationRegistry.getFindings();
      expect(findings).toHaveLength(1);
      expect(findings[0].severity).toBe('critical');
      expect(findings[0].category).toBe('S3');
    });

    test('gets findings by severity', () => {
      ValidationRegistry.addFinding({
        severity: 'critical',
        category: 'S3',
        resource: 'bucket1',
        message: 'Critical issue',
        remediation: 'Fix it',
        executionTime: 5,
      });

      ValidationRegistry.addFinding({
        severity: 'warning',
        category: 'Lambda',
        resource: 'function1',
        message: 'Warning issue',
        remediation: 'Consider fixing',
        executionTime: 3,
      });

      const criticalFindings = ValidationRegistry.getFindingsBySeverity('critical');
      const warningFindings = ValidationRegistry.getFindingsBySeverity('warning');
      const infoFindings = ValidationRegistry.getFindingsBySeverity('info');

      expect(criticalFindings).toHaveLength(1);
      expect(warningFindings).toHaveLength(1);
      expect(infoFindings).toHaveLength(0);
    });

    test('gets findings by category', () => {
      ValidationRegistry.addFinding({
        severity: 'critical',
        category: 'S3',
        resource: 'bucket1',
        message: 'S3 issue',
        remediation: 'Fix S3',
        executionTime: 5,
      });

      ValidationRegistry.addFinding({
        severity: 'warning',
        category: 'Lambda',
        resource: 'function1',
        message: 'Lambda issue',
        remediation: 'Fix Lambda',
        executionTime: 3,
      });

      const s3Findings = ValidationRegistry.getFindingsByCategory('S3');
      const lambdaFindings = ValidationRegistry.getFindingsByCategory('Lambda');
      const rdsFindings = ValidationRegistry.getFindingsByCategory('RDS');

      expect(s3Findings).toHaveLength(1);
      expect(lambdaFindings).toHaveLength(1);
      expect(rdsFindings).toHaveLength(0);
    });

    test('generates correct summary', () => {
      ValidationRegistry.addFinding({
        severity: 'critical',
        category: 'S3',
        resource: 'bucket1',
        message: 'Critical S3',
        remediation: 'Fix',
        executionTime: 5,
      });

      ValidationRegistry.addFinding({
        severity: 'warning',
        category: 'Lambda',
        resource: 'func1',
        message: 'Warning Lambda',
        remediation: 'Fix',
        executionTime: 3,
      });

      ValidationRegistry.addFinding({
        severity: 'info',
        category: 'S3',
        resource: 'bucket2',
        message: 'Info S3',
        remediation: 'No action',
        executionTime: 2,
      });

      const summary = ValidationRegistry.getSummary();

      expect(summary.total).toBe(3);
      expect(summary.critical).toBe(1);
      expect(summary.warning).toBe(1);
      expect(summary.info).toBe(1);
      expect(summary.categories).toEqual({ S3: 2, Lambda: 1 });
    });

    test('clears findings', () => {
      ValidationRegistry.addFinding({
        severity: 'critical',
        category: 'S3',
        resource: 'bucket1',
        message: 'Test',
        remediation: 'Fix',
        executionTime: 5,
      });

      expect(ValidationRegistry.getFindings()).toHaveLength(1);

      ValidationRegistry.clear();

      expect(ValidationRegistry.getFindings()).toHaveLength(0);
      const summary = ValidationRegistry.getSummary();
      expect(summary.total).toBe(0);
    });

    test('includes metadata in findings', () => {
      ValidationRegistry.addFinding({
        severity: 'warning',
        category: 'Lambda',
        resource: 'function1',
        message: 'Test',
        remediation: 'Fix',
        executionTime: 5,
        metadata: {
          functionName: 'test-function',
          timeout: 900,
        },
      });

      const findings = ValidationRegistry.getFindings();
      expect(findings[0].metadata).toBeDefined();
      expect(findings[0].metadata?.functionName).toBe('test-function');
      expect(findings[0].metadata?.timeout).toBe(900);
    });
  });

  describe('StackComparator', () => {
    const testTemplate1 = {
      Resources: {
        Bucket1: {
          Type: 'AWS::S3::Bucket',
          Properties: {
            BucketName: 'test-bucket',
            Versioned: true,
          },
        },
        Lambda1: {
          Type: 'AWS::Lambda::Function',
          Properties: {
            FunctionName: 'test-function',
            Runtime: 'nodejs18.x',
          },
        },
      },
      Outputs: {
        BucketArn: {
          Value: 'arn:aws:s3:::test-bucket',
        },
      },
      Parameters: {
        Environment: {
          Type: 'String',
        },
      },
    };

    const testTemplate2 = {
      Resources: {
        Bucket1: {
          Type: 'AWS::S3::Bucket',
          Properties: {
            BucketName: 'test-bucket',
            Versioned: false, // Changed
          },
        },
        Lambda2: {
          // Lambda1 removed, Lambda2 added
          Type: 'AWS::Lambda::Function',
          Properties: {
            FunctionName: 'new-function',
            Runtime: 'nodejs18.x',
          },
        },
      },
      Outputs: {
        BucketArn: {
          Value: 'arn:aws:s3:::test-bucket',
        },
        NewOutput: {
          // Added
          Value: 'new-value',
        },
      },
      Parameters: {
        Environment: {
          Type: 'String',
        },
      },
    };

    beforeAll(() => {
      // Create test template files
      fs.writeFileSync('test-template-1.json', JSON.stringify(testTemplate1, null, 2));
      fs.writeFileSync('test-template-2.json', JSON.stringify(testTemplate2, null, 2));
    });

    afterAll(() => {
      // Clean up test files
      try {
        fs.unlinkSync('test-template-1.json');
        fs.unlinkSync('test-template-2.json');
      } catch (e) {
        // Ignore errors
      }
    });

    test('detects added resources', () => {
      const differences = StackComparator.compareTemplates(
        'test-template-1.json',
        'test-template-2.json'
      );

      const addedResources = differences.filter((d) => d.type === 'added' && d.path.startsWith('Resources.'));
      expect(addedResources.length).toBeGreaterThan(0);

      const addedLambda = addedResources.find((d) => d.path.includes('Lambda2'));
      expect(addedLambda).toBeDefined();
    });

    test('detects removed resources', () => {
      const differences = StackComparator.compareTemplates(
        'test-template-1.json',
        'test-template-2.json'
      );

      const removedResources = differences.filter((d) => d.type === 'removed' && d.path.startsWith('Resources.'));
      expect(removedResources.length).toBeGreaterThan(0);

      const removedLambda = removedResources.find((d) => d.path.includes('Lambda1'));
      expect(removedLambda).toBeDefined();
    });

    test('detects modified properties', () => {
      const differences = StackComparator.compareTemplates(
        'test-template-1.json',
        'test-template-2.json'
      );

      const modifiedProps = differences.filter((d) => d.type === 'modified');
      expect(modifiedProps.length).toBeGreaterThan(0);

      const versioningChange = modifiedProps.find((d) => d.path.includes('Versioned'));
      expect(versioningChange).toBeDefined();
      expect(versioningChange?.oldValue).toBe(true);
      expect(versioningChange?.newValue).toBe(false);
    });

    test('detects added outputs', () => {
      const differences = StackComparator.compareTemplates(
        'test-template-1.json',
        'test-template-2.json'
      );

      const addedOutputs = differences.filter((d) => d.type === 'added' && d.path.startsWith('Outputs.'));
      expect(addedOutputs.length).toBeGreaterThan(0);
    });

    test('generates human-readable report', () => {
      const differences = StackComparator.compareTemplates(
        'test-template-1.json',
        'test-template-2.json'
      );

      const report = StackComparator.generateReport(differences);

      expect(report).toContain('Stack Comparison Report');
      expect(report).toContain('difference(s)');
      expect(report).toContain('Added');
      expect(report).toContain('Removed');
      expect(report).toContain('Modified');
    });

    test('handles identical templates', () => {
      const differences = StackComparator.compareTemplates(
        'test-template-1.json',
        'test-template-1.json'
      );

      expect(differences).toHaveLength(0);

      const report = StackComparator.generateReport(differences);
      expect(report).toContain('No differences found');
    });
  });

  describe('RuleEngine', () => {
    const testRulesConfig = {
      rules: [
        {
          name: 's3-versioning-test',
          severity: 'warning',
          category: 'S3',
          resourceType: 'AWS::S3::Bucket',
          condition: {
            property: 'Versioned',
            operator: 'equals',
            value: true,
          },
          message: 'S3 bucket should have versioning enabled',
          remediation: 'Enable versioning',
        },
        {
          name: 'lambda-timeout-test',
          severity: 'critical',
          category: 'Lambda',
          resourceType: 'AWS::Lambda::Function',
          condition: {
            property: 'Timeout',
            operator: 'greaterThan',
            value: 300,
          },
          message: 'Lambda timeout exceeds maximum',
          remediation: 'Reduce timeout',
        },
        {
          name: 'rds-encryption-test',
          severity: 'critical',
          category: 'RDS',
          resourceType: 'AWS::RDS::DBInstance',
          condition: {
            property: 'StorageEncrypted',
            operator: 'exists',
          },
          message: 'RDS encryption must be configured',
          remediation: 'Enable encryption',
        },
      ],
    };

    beforeAll(() => {
      // Create test rules file
      fs.writeFileSync('test-rules.yaml', yaml.dump(testRulesConfig));
    });

    afterAll(() => {
      // Clean up
      try {
        fs.unlinkSync('test-rules.yaml');
      } catch (e) {
        // Ignore
      }
      ValidationRegistry.clear();
    });

    beforeEach(() => {
      ValidationRegistry.clear();
    });

    test('loads rules from YAML file', () => {
      const engine = new RuleEngine('test-rules.yaml');
      expect(engine).toBeDefined();
    });

    test('does not fail with missing config file', () => {
      const engine = new RuleEngine('non-existent.yaml');
      expect(engine).toBeDefined();
    });

    test('handles equals operator', () => {
      const engine = new RuleEngine('test-rules.yaml');
      const mockNode = { node: { path: 'Test/Bucket' } } as any;

      engine.evaluateRules(mockNode, 'AWS::S3::Bucket', {
        Versioned: false, // Does not match rule (requires true)
      });

      const findings = ValidationRegistry.getFindings();
      expect(findings.length).toBeGreaterThan(0);
      expect(findings[0].category).toBe('S3');
    });

    test('handles greaterThan operator', () => {
      const engine = new RuleEngine('test-rules.yaml');
      const mockNode = { node: { path: 'Test/Function' } } as any;

      engine.evaluateRules(mockNode, 'AWS::Lambda::Function', {
        Timeout: 600, // Exceeds 300
      });

      const findings = ValidationRegistry.getFindings();
      expect(findings.length).toBeGreaterThan(0);
      const lambdaFindings = findings.filter((f) => f.category === 'Lambda');
      expect(lambdaFindings.length).toBeGreaterThan(0);
    });

    test('handles exists operator', () => {
      const engine = new RuleEngine('test-rules.yaml');
      const mockNode = { node: { path: 'Test/DBInstance' } } as any;

      engine.evaluateRules(mockNode, 'AWS::RDS::DBInstance', {
        // StorageEncrypted property is missing
      });

      const findings = ValidationRegistry.getFindings();
      expect(findings.length).toBeGreaterThan(0);
      const rdsFindings = findings.filter((f) => f.category === 'RDS');
      expect(rdsFindings.length).toBeGreaterThan(0);
    });

    test('does not create finding when rule passes', () => {
      const engine = new RuleEngine('test-rules.yaml');
      const mockNode = { node: { path: 'Test/Bucket' } } as any;

      engine.evaluateRules(mockNode, 'AWS::S3::Bucket', {
        Versioned: true, // Matches rule requirement
      });

      const findings = ValidationRegistry.getFindings();
      const s3Findings = findings.filter((f) => f.category === 'S3');
      expect(s3Findings).toHaveLength(0);
    });

    test('only evaluates rules for matching resource types', () => {
      const engine = new RuleEngine('test-rules.yaml');
      const mockNode = { node: { path: 'Test/Bucket' } } as any;

      // Evaluate S3 bucket against Lambda rules
      engine.evaluateRules(mockNode, 'AWS::S3::Bucket', {
        Timeout: 600, // This is a Lambda property
      });

      const findings = ValidationRegistry.getFindings();
      const lambdaFindings = findings.filter((f) => f.category === 'Lambda');
      expect(lambdaFindings).toHaveLength(0); // Should not create Lambda findings for S3 resource
    });

    test('handles nested property paths', () => {
      const engine = new RuleEngine();
      const mockNode = { node: { path: 'Test/Resource' } } as any;

      engine.loadRules('test-rules.yaml');

      // Test with nested properties
      engine.evaluateRules(mockNode, 'AWS::Lambda::Function', {
        Environment: {
          Variables: {
            LOG_LEVEL: 'DEBUG',
          },
        },
      });

      // Should not throw error when accessing nested properties
      expect(engine).toBeDefined();
    });

    test('handles null in nested property path', () => {
      const engine = new RuleEngine();

      // Create rules config with nested property check
      const nestedRulesConfig = {
        rules: [
          {
            name: 'nested-null-test',
            severity: 'warning',
            category: 'Test',
            resourceType: 'AWS::Test::Resource',
            condition: {
              property: 'nested.deep.value',
              operator: 'exists',
            },
            message: 'Nested property check',
            remediation: 'Add nested property',
          },
        ],
      };

      fs.writeFileSync('test-nested-rules.yaml', yaml.dump(nestedRulesConfig));

      engine.loadRules('test-nested-rules.yaml');
      const mockNode = { node: { path: 'Test/Resource' } } as any;

      // Test with null in property path - should handle gracefully
      engine.evaluateRules(mockNode, 'AWS::Test::Resource', {
        nested: null, // null in path should return undefined
      });

      // Clean up
      fs.unlinkSync('test-nested-rules.yaml');

      // Should create finding since property doesn't exist
      const findings = ValidationRegistry.getFindings();
      expect(findings.length).toBeGreaterThan(0);
    });

    test('handles unknown operator in rule condition', () => {
      const engine = new RuleEngine();

      // Create rules config with unknown operator
      const unknownOpRulesConfig = {
        rules: [
          {
            name: 'unknown-op-test',
            severity: 'warning',
            category: 'Test',
            resourceType: 'AWS::Test::Resource',
            condition: {
              property: 'value',
              operator: 'unknownOperator', // Invalid operator
              value: 'test',
            },
            message: 'Unknown operator test',
            remediation: 'Fix operator',
          },
        ],
      };

      fs.writeFileSync('test-unknown-op-rules.yaml', yaml.dump(unknownOpRulesConfig));

      engine.loadRules('test-unknown-op-rules.yaml');
      const mockNode = { node: { path: 'Test/Resource' } } as any;

      // Should not throw with unknown operator - defaults to pass=true
      engine.evaluateRules(mockNode, 'AWS::Test::Resource', {
        value: 'test',
      });

      // Clean up
      fs.unlinkSync('test-unknown-op-rules.yaml');

      // Unknown operator defaults to pass=true, so no violation should be found
      const findings = ValidationRegistry.getFindingsByCategory('Test');
      expect(findings).toHaveLength(0);
    });

    test('handles notEquals operator', () => {
      const engine = new RuleEngine();

      const notEqualsRulesConfig = {
        rules: [
          {
            name: 'not-equals-test',
            severity: 'warning',
            category: 'Test',
            resourceType: 'AWS::Test::Resource',
            condition: {
              property: 'status',
              operator: 'notEquals',
              value: 'active',
            },
            message: 'Status should not be active',
            remediation: 'Change status',
          },
        ],
      };

      fs.writeFileSync('test-not-equals-rules.yaml', yaml.dump(notEqualsRulesConfig));

      engine.loadRules('test-not-equals-rules.yaml');
      const mockNode = { node: { path: 'Test/Resource' } } as any;

      // Test with value that is different - should NOT create finding (rule passes)
      // Rule says "status notEquals 'active'" meaning status should NOT be active
      // Since status is 'inactive', the rule passes and no finding is created
      engine.evaluateRules(mockNode, 'AWS::Test::Resource', {
        status: 'inactive',
      });

      fs.unlinkSync('test-not-equals-rules.yaml');

      const findings = ValidationRegistry.getFindingsByCategory('Test');
      expect(findings).toHaveLength(0);
    });

    test('handles notExists operator', () => {
      const engine = new RuleEngine();

      const notExistsRulesConfig = {
        rules: [
          {
            name: 'not-exists-test',
            severity: 'warning',
            category: 'Test',
            resourceType: 'AWS::Test::Resource',
            condition: {
              property: 'deprecated',
              operator: 'notExists',
            },
            message: 'Deprecated property should not exist',
            remediation: 'Remove deprecated property',
          },
        ],
      };

      fs.writeFileSync('test-not-exists-rules.yaml', yaml.dump(notExistsRulesConfig));

      engine.loadRules('test-not-exists-rules.yaml');
      const mockNode = { node: { path: 'Test/Resource' } } as any;

      // Test with property that exists - should create finding (violation)
      engine.evaluateRules(mockNode, 'AWS::Test::Resource', {
        deprecated: 'old-value',
      });

      fs.unlinkSync('test-not-exists-rules.yaml');

      const findings = ValidationRegistry.getFindingsByCategory('Test');
      expect(findings.length).toBeGreaterThan(0);
    });

    test('handles contains operator', () => {
      const engine = new RuleEngine();

      const containsRulesConfig = {
        rules: [
          {
            name: 'contains-test',
            severity: 'warning',
            category: 'Test',
            resourceType: 'AWS::Test::Resource',
            condition: {
              property: 'tags',
              operator: 'contains',
              value: 'production',
            },
            message: 'Should contain production tag',
            remediation: 'Add production tag',
          },
        ],
      };

      fs.writeFileSync('test-contains-rules.yaml', yaml.dump(containsRulesConfig));

      engine.loadRules('test-contains-rules.yaml');
      const mockNode = { node: { path: 'Test/Resource' } } as any;

      // Test with array that does not contain value - should create finding
      engine.evaluateRules(mockNode, 'AWS::Test::Resource', {
        tags: ['development', 'test'],
      });

      fs.unlinkSync('test-contains-rules.yaml');

      const findings = ValidationRegistry.getFindingsByCategory('Test');
      expect(findings.length).toBeGreaterThan(0);
    });

    test('handles lessThan operator', () => {
      const engine = new RuleEngine();

      const lessThanRulesConfig = {
        rules: [
          {
            name: 'less-than-test',
            severity: 'warning',
            category: 'Test',
            resourceType: 'AWS::Test::Resource',
            condition: {
              property: 'memory',
              operator: 'lessThan',
              value: 256,
            },
            message: 'Memory is too low',
            remediation: 'Increase memory',
          },
        ],
      };

      fs.writeFileSync('test-less-than-rules.yaml', yaml.dump(lessThanRulesConfig));

      engine.loadRules('test-less-than-rules.yaml');
      const mockNode = { node: { path: 'Test/Resource' } } as any;

      // Test with value less than threshold - should create finding (violation)
      engine.evaluateRules(mockNode, 'AWS::Test::Resource', {
        memory: 128,
      });

      fs.unlinkSync('test-less-than-rules.yaml');

      const findings = ValidationRegistry.getFindingsByCategory('Test');
      expect(findings.length).toBeGreaterThan(0);
    });
  });

  describe('StackComparator - Edge Cases', () => {
    test('detects removed properties in output comparison', () => {
      const template1 = {
        Resources: {},
        Outputs: {
          Output1: { Value: 'value1' },
          Output2: { Value: 'value2' },
        },
        Parameters: {},
      };

      const template2 = {
        Resources: {},
        Outputs: {
          Output1: { Value: 'value1' },
          // Output2 is removed
        },
        Parameters: {},
      };

      fs.writeFileSync('test-removed-output-1.json', JSON.stringify(template1));
      fs.writeFileSync('test-removed-output-2.json', JSON.stringify(template2));

      const differences = StackComparator.compareTemplates(
        'test-removed-output-1.json',
        'test-removed-output-2.json'
      );

      fs.unlinkSync('test-removed-output-1.json');
      fs.unlinkSync('test-removed-output-2.json');

      const removedOutputs = differences.filter(
        (d) => d.type === 'removed' && d.path.includes('Outputs')
      );
      expect(removedOutputs.length).toBeGreaterThan(0);
    });

    test('detects removed parameters', () => {
      const template1 = {
        Resources: {},
        Outputs: {},
        Parameters: {
          Param1: { Type: 'String' },
          Param2: { Type: 'Number' },
        },
      };

      const template2 = {
        Resources: {},
        Outputs: {},
        Parameters: {
          Param1: { Type: 'String' },
          // Param2 is removed
        },
      };

      fs.writeFileSync('test-removed-param-1.json', JSON.stringify(template1));
      fs.writeFileSync('test-removed-param-2.json', JSON.stringify(template2));

      const differences = StackComparator.compareTemplates(
        'test-removed-param-1.json',
        'test-removed-param-2.json'
      );

      fs.unlinkSync('test-removed-param-1.json');
      fs.unlinkSync('test-removed-param-2.json');

      const removedParams = differences.filter(
        (d) => d.type === 'removed' && d.path.includes('Parameters')
      );
      expect(removedParams.length).toBeGreaterThan(0);
    });
  });
});
