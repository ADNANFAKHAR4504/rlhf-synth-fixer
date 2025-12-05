import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack';
import { ValidationRegistry } from '../lib/core/validation-registry';

const environmentSuffix = 'test';

describe('Validation Aspects Unit Tests', () => {
  beforeEach(() => {
    ValidationRegistry.clear();
  });

  afterEach(() => {
    ValidationRegistry.clear();
  });

  describe('S3 Encryption Aspect', () => {
    test('detects S3 bucket without encryption', () => {
      const app = new cdk.App();
      const stack = new TapStack(app, 'TestStack', { environmentSuffix });

      // Synthesize to trigger aspects
      app.synth();

      const findings = ValidationRegistry.getFindings();
      const s3Findings = findings.filter(f => f.category === 'S3');

      // Should find at least one critical finding for unencrypted bucket
      const criticalS3Findings = s3Findings.filter(f => f.severity === 'critical');
      expect(criticalS3Findings.length).toBeGreaterThan(0);

      // Check that the finding has proper structure
      criticalS3Findings.forEach(finding => {
        expect(finding).toHaveProperty('severity');
        expect(finding).toHaveProperty('category');
        expect(finding).toHaveProperty('resource');
        expect(finding).toHaveProperty('message');
        expect(finding).toHaveProperty('remediation');
        expect(finding).toHaveProperty('executionTime');
      });
    });

    test('detects S3 bucket with encryption (info level)', () => {
      const app = new cdk.App();
      new TapStack(app, 'TestStack', { environmentSuffix });

      app.synth();

      const findings = ValidationRegistry.getFindings();
      const infoFindings = findings.filter(f =>
        f.category === 'S3' && f.severity === 'info'
      );

      // Should find info level findings for properly configured buckets
      expect(infoFindings.length).toBeGreaterThan(0);

      infoFindings.forEach(finding => {
        expect(finding.message).toContain('encryption enabled');
      });
    });
  });

  describe('IAM Policy Aspect', () => {
    test('detects wildcard IAM policies', () => {
      const app = new cdk.App();
      new TapStack(app, 'TestStack', { environmentSuffix });

      app.synth();

      const findings = ValidationRegistry.getFindings();
      const iamFindings = findings.filter(f => f.category === 'IAM');

      // Should find IAM policy issues
      expect(iamFindings.length).toBeGreaterThan(0);

      // Check for wildcard detection
      const wildcardFindings = iamFindings.filter(f =>
        f.message.includes('wildcard')
      );
      expect(wildcardFindings.length).toBeGreaterThan(0);
    });

    test('IAM findings have proper severity levels', () => {
      const app = new cdk.App();
      new TapStack(app, 'TestStack', { environmentSuffix });

      app.synth();

      const findings = ValidationRegistry.getFindings();
      const iamFindings = findings.filter(f => f.category === 'IAM');

      // Wildcard on both actions and resources should be critical
      const criticalFindings = iamFindings.filter(f =>
        f.severity === 'critical' &&
        f.message.includes('both actions and resources')
      );
      expect(criticalFindings.length).toBeGreaterThan(0);
    });
  });

  describe('Lambda Config Aspect', () => {
    test('detects excessive Lambda timeout', () => {
      const app = new cdk.App();
      new TapStack(app, 'TestStack', { environmentSuffix });

      app.synth();

      const findings = ValidationRegistry.getFindings();
      const lambdaFindings = findings.filter(f => f.category === 'Lambda');

      // Should find Lambda timeout issue
      const timeoutFindings = lambdaFindings.filter(f =>
        f.message.includes('timeout')
      );
      expect(timeoutFindings.length).toBeGreaterThan(0);
    });

    test('detects low Lambda memory configuration', () => {
      const app = new cdk.App();
      new TapStack(app, 'TestStack', { environmentSuffix });

      app.synth();

      const findings = ValidationRegistry.getFindings();
      const lambdaFindings = findings.filter(f => f.category === 'Lambda');

      // Should find memory warning
      const memoryFindings = lambdaFindings.filter(f =>
        f.message.includes('memory')
      );
      expect(memoryFindings.length).toBeGreaterThan(0);
    });

    test('detects missing environment variables', () => {
      const app = new cdk.App();
      new TapStack(app, 'TestStack', { environmentSuffix });

      app.synth();

      const findings = ValidationRegistry.getFindings();
      const lambdaFindings = findings.filter(f => f.category === 'Lambda');

      // Should find missing env vars
      const envFindings = lambdaFindings.filter(f =>
        f.message.includes('environment variables')
      );
      expect(envFindings.length).toBeGreaterThan(0);
    });
  });

  describe('Validation Execution Time', () => {
    test('all findings have execution time recorded', () => {
      const app = new cdk.App();
      new TapStack(app, 'TestStack', { environmentSuffix });

      app.synth();

      const findings = ValidationRegistry.getFindings();

      findings.forEach(finding => {
        expect(finding.executionTime).toBeGreaterThanOrEqual(0);
        expect(typeof finding.executionTime).toBe('number');
      });
    });

    test('execution times are reasonable', () => {
      const app = new cdk.App();
      new TapStack(app, 'TestStack', { environmentSuffix });

      app.synth();

      const findings = ValidationRegistry.getFindings();

      // Each validation should complete in less than 1 second
      findings.forEach(finding => {
        expect(finding.executionTime).toBeLessThan(1000);
      });
    });
  });

  describe('Validation Registry', () => {
    test('can filter findings by severity', () => {
      const app = new cdk.App();
      new TapStack(app, 'TestStack', { environmentSuffix });

      app.synth();

      const criticalFindings = ValidationRegistry.getFindingsBySeverity('critical');
      const warningFindings = ValidationRegistry.getFindingsBySeverity('warning');
      const infoFindings = ValidationRegistry.getFindingsBySeverity('info');

      expect(criticalFindings.length).toBeGreaterThan(0);
      expect(warningFindings.length).toBeGreaterThan(0);
      expect(infoFindings.length).toBeGreaterThan(0);

      criticalFindings.forEach(f => expect(f.severity).toBe('critical'));
      warningFindings.forEach(f => expect(f.severity).toBe('warning'));
      infoFindings.forEach(f => expect(f.severity).toBe('info'));
    });

    test('can filter findings by category', () => {
      const app = new cdk.App();
      new TapStack(app, 'TestStack', { environmentSuffix });

      app.synth();

      const s3Findings = ValidationRegistry.getFindingsByCategory('S3');
      const iamFindings = ValidationRegistry.getFindingsByCategory('IAM');
      const lambdaFindings = ValidationRegistry.getFindingsByCategory('Lambda');

      expect(s3Findings.length).toBeGreaterThan(0);
      expect(iamFindings.length).toBeGreaterThan(0);
      expect(lambdaFindings.length).toBeGreaterThan(0);

      s3Findings.forEach(f => expect(f.category).toBe('S3'));
      iamFindings.forEach(f => expect(f.category).toBe('IAM'));
      lambdaFindings.forEach(f => expect(f.category).toBe('Lambda'));
    });

    test('getSummary provides correct counts', () => {
      const app = new cdk.App();
      new TapStack(app, 'TestStack', { environmentSuffix });

      app.synth();

      const summary = ValidationRegistry.getSummary();

      expect(summary.total).toBeGreaterThan(0);
      expect(summary.critical).toBeGreaterThan(0);
      expect(summary.warning).toBeGreaterThan(0);
      expect(summary.info).toBeGreaterThan(0);

      // Total should equal sum of all severity levels
      expect(summary.total).toBe(
        summary.critical + summary.warning + summary.info
      );

      // Categories should be properly counted
      expect(summary.categories).toHaveProperty('S3');
      expect(summary.categories).toHaveProperty('IAM');
      expect(summary.categories).toHaveProperty('Lambda');
    });

    test('clear() removes all findings', () => {
      const app = new cdk.App();
      new TapStack(app, 'TestStack', { environmentSuffix });

      app.synth();

      const findingsBefore = ValidationRegistry.getFindings();
      expect(findingsBefore.length).toBeGreaterThan(0);

      ValidationRegistry.clear();

      const findingsAfter = ValidationRegistry.getFindings();
      expect(findingsAfter.length).toBe(0);
    });
  });

  describe('Remediation Guidance', () => {
    test('all findings include remediation steps', () => {
      const app = new cdk.App();
      new TapStack(app, 'TestStack', { environmentSuffix });

      app.synth();

      const findings = ValidationRegistry.getFindings();

      findings.forEach(finding => {
        expect(finding.remediation).toBeDefined();
        expect(finding.remediation.length).toBeGreaterThan(0);
        expect(typeof finding.remediation).toBe('string');
      });
    });

    test('remediation includes actionable guidance', () => {
      const app = new cdk.App();
      new TapStack(app, 'TestStack', { environmentSuffix });

      app.synth();

      const findings = ValidationRegistry.getFindings();

      // Check that remediation contains actionable words
      const actionableWords = ['enable', 'configure', 'set', 'add', 'remove', 'replace', 'update', 'increase'];

      findings.forEach(finding => {
        const hasActionableWord = actionableWords.some(word =>
          finding.remediation.toLowerCase().includes(word)
        );
        expect(hasActionableWord).toBe(true);
      });
    });
  });
});
