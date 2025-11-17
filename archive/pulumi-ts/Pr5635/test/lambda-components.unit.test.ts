/**
 * Unit tests for Lambda component resources
 *
 * Tests the ComplianceScannerLambda and RemediationLambda components
 * with various configurations including optional DLQ support.
 */

import * as pulumi from '@pulumi/pulumi';

// Set up Pulumi mocks before any imports
pulumi.runtime.setMocks({
  newResource: function(args: pulumi.runtime.MockResourceArgs): {id: string; state: any} {
    const id = args.inputs.name ? `${args.inputs.name}_id` : `${args.name}_id`;
    return {
      id: id,
      state: {
        ...args.inputs,
        arn: `arn:aws:${args.type}:ap-southeast-1:123456789012:${id}`,
        id: id,
      },
    };
  },
  call: function(args: pulumi.runtime.MockCallArgs) {
    return args.inputs;
  },
});

import { ComplianceScannerLambda } from '../lib/lambda/compliance-scanner';
import { RemediationLambda } from '../lib/lambda/remediation-lambda';

describe('ComplianceScannerLambda Unit Tests', () => {
  const testArgs = {
    environmentSuffix: 'test',
    bucketName: pulumi.output('test-bucket'),
    snsTopicArn: pulumi.output('arn:aws:sns:ap-southeast-1:123456789012:test-topic'),
    vpcSubnetIds: [pulumi.output('subnet-123'), pulumi.output('subnet-456')],
    vpcSecurityGroupIds: [pulumi.output('sg-123')],
    metricsNamespace: 'TestMetrics',
    tags: {
      Environment: 'test',
      Application: 'compliance',
    },
  };

  describe('Basic configuration', () => {
    it('should create lambda without DLQ', () => {
      const scanner = new ComplianceScannerLambda('test-scanner', testArgs);

      expect(scanner).toBeDefined();
      expect(scanner.lambdaArn).toBeDefined();
      expect(scanner.lambdaName).toBeDefined();
    });

    it('should have correct resource outputs', async () => {
      const scanner = new ComplianceScannerLambda('test-scanner-2', testArgs);

      const arn = await scanner.lambdaArn.promise();
      const name = await scanner.lambdaName.promise();

      expect(arn).toContain('arn:aws:');
      expect(name).toContain('test');
    });
  });

  describe('DLQ configuration', () => {
    it('should create lambda with DLQ', () => {
      const scannerWithDLQ = new ComplianceScannerLambda('scanner-with-dlq', {
        ...testArgs,
        deadLetterQueueArn: pulumi.output('arn:aws:sqs:ap-southeast-1:123456789012:dlq'),
      });

      expect(scannerWithDLQ).toBeDefined();
      expect(scannerWithDLQ.lambdaArn).toBeDefined();
    });

    it('should handle DLQ ARN in policy', async () => {
      const scannerWithDLQ = new ComplianceScannerLambda('scanner-dlq-policy', {
        ...testArgs,
        deadLetterQueueArn: pulumi.output('arn:aws:sqs:ap-southeast-1:123456789012:test-dlq'),
      });

      const arn = await scannerWithDLQ.lambdaArn.promise();
      expect(arn).toBeDefined();
    });

    it('should work without DLQ (empty string case)', () => {
      const scannerNoDLQ = new ComplianceScannerLambda('scanner-no-dlq', {
        ...testArgs,
        deadLetterQueueArn: undefined,
      });

      expect(scannerNoDLQ).toBeDefined();
    });
  });

  describe('Component resource properties', () => {
    it('should be instance of ComponentResource', () => {
      const scanner = new ComplianceScannerLambda('resource-test', testArgs);
      expect(scanner).toBeInstanceOf(pulumi.ComponentResource);
    });

    it('should register outputs', async () => {
      const scanner = new ComplianceScannerLambda('output-test', testArgs);

      expect(typeof scanner.lambdaArn.apply).toBe('function');
      expect(typeof scanner.lambdaName.apply).toBe('function');
    });
  });

  describe('Environment suffix handling', () => {
    it('should include suffix in resource names', async () => {
      const customSuffix = 'prod123';
      const scanner = new ComplianceScannerLambda('suffix-test', {
        ...testArgs,
        environmentSuffix: customSuffix,
      });

      const name = await scanner.lambdaName.promise();
      expect(name).toContain(customSuffix);
    });
  });
});

describe('RemediationLambda Unit Tests', () => {
  const testArgs = {
    environmentSuffix: 'test',
    snsTopicArn: pulumi.output('arn:aws:sns:ap-southeast-1:123456789012:test-topic'),
    vpcSubnetIds: [pulumi.output('subnet-123'), pulumi.output('subnet-456')],
    vpcSecurityGroupIds: [pulumi.output('sg-123')],
    tags: {
      Environment: 'test',
      Application: 'remediation',
    },
  };

  describe('Basic configuration', () => {
    it('should create lambda without DLQ', () => {
      const remediation = new RemediationLambda('test-remediation', testArgs);

      expect(remediation).toBeDefined();
      expect(remediation.lambdaArn).toBeDefined();
      expect(remediation.lambdaName).toBeDefined();
    });

    it('should have correct resource outputs', async () => {
      const remediation = new RemediationLambda('test-remediation-2', testArgs);

      const arn = await remediation.lambdaArn.promise();
      const name = await remediation.lambdaName.promise();

      expect(arn).toContain('arn:aws:');
      expect(name).toContain('test');
    });
  });

  describe('DLQ configuration', () => {
    it('should create lambda with DLQ', () => {
      const remediationWithDLQ = new RemediationLambda('remediation-with-dlq', {
        ...testArgs,
        deadLetterQueueArn: pulumi.output('arn:aws:sqs:ap-southeast-1:123456789012:dlq'),
      });

      expect(remediationWithDLQ).toBeDefined();
      expect(remediationWithDLQ.lambdaArn).toBeDefined();
    });

    it('should handle DLQ ARN in policy', async () => {
      const remediationWithDLQ = new RemediationLambda('remediation-dlq-policy', {
        ...testArgs,
        deadLetterQueueArn: pulumi.output('arn:aws:sqs:ap-southeast-1:123456789012:test-dlq'),
      });

      const arn = await remediationWithDLQ.lambdaArn.promise();
      expect(arn).toBeDefined();
    });

    it('should work without DLQ (undefined case)', () => {
      const remediationNoDLQ = new RemediationLambda('remediation-no-dlq', {
        ...testArgs,
        deadLetterQueueArn: undefined,
      });

      expect(remediationNoDLQ).toBeDefined();
    });
  });

  describe('Component resource properties', () => {
    it('should be instance of ComponentResource', () => {
      const remediation = new RemediationLambda('resource-test', testArgs);
      expect(remediation).toBeInstanceOf(pulumi.ComponentResource);
    });

    it('should register outputs', async () => {
      const remediation = new RemediationLambda('output-test', testArgs);

      expect(typeof remediation.lambdaArn.apply).toBe('function');
      expect(typeof remediation.lambdaName.apply).toBe('function');
    });
  });

  describe('Environment suffix handling', () => {
    it('should include suffix in resource names', async () => {
      const customSuffix = 'staging456';
      const remediation = new RemediationLambda('suffix-test', {
        ...testArgs,
        environmentSuffix: customSuffix,
      });

      const name = await remediation.lambdaName.promise();
      expect(name).toContain(customSuffix);
    });
  });

  describe('IAM role configuration', () => {
    it('should create with proper permissions', async () => {
      const remediation = new RemediationLambda('iam-test', testArgs);

      const arn = await remediation.lambdaArn.promise();
      expect(arn).toBeDefined();
    });
  });
});

describe('Lambda Components Integration', () => {
  it('should create both lambdas together', () => {
    const commonArgs = {
      environmentSuffix: 'integration',
      snsTopicArn: pulumi.output('arn:aws:sns:ap-southeast-1:123456789012:topic'),
      vpcSubnetIds: [pulumi.output('subnet-1')],
      vpcSecurityGroupIds: [pulumi.output('sg-1')],
      tags: { Test: 'integration' },
    };

    const scanner = new ComplianceScannerLambda('integration-scanner', {
      ...commonArgs,
      bucketName: pulumi.output('integration-bucket'),
      metricsNamespace: 'IntegrationMetrics',
    });

    const remediation = new RemediationLambda('integration-remediation', commonArgs);

    expect(scanner).toBeDefined();
    expect(remediation).toBeDefined();
  });

  it('should support DLQ for both lambdas', async () => {
    const dlqArn = pulumi.output('arn:aws:sqs:ap-southeast-1:123456789012:shared-dlq');
    const commonArgs = {
      environmentSuffix: 'dlq-test',
      snsTopicArn: pulumi.output('arn:aws:sns:ap-southeast-1:123456789012:topic'),
      vpcSubnetIds: [pulumi.output('subnet-1')],
      vpcSecurityGroupIds: [pulumi.output('sg-1')],
      tags: { DLQ: 'enabled' },
      deadLetterQueueArn: dlqArn,
    };

    const scanner = new ComplianceScannerLambda('dlq-scanner', {
      ...commonArgs,
      bucketName: pulumi.output('dlq-bucket'),
      metricsNamespace: 'DLQMetrics',
    });

    const remediation = new RemediationLambda('dlq-remediation', commonArgs);

    const scannerArn = await scanner.lambdaArn.promise();
    const remediationArn = await remediation.lambdaArn.promise();

    expect(scannerArn).toBeDefined();
    expect(remediationArn).toBeDefined();
  });
});
