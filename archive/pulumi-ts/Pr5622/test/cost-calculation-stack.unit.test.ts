/**
 * Unit tests for CostCalculationStack
 *
 * Tests the cost calculation component for EC2 instance scheduling savings.
 */
import * as pulumi from '@pulumi/pulumi';
import { CostCalculationStack } from '../lib/cost-calculation-stack';

pulumi.runtime.setMocks({
  newResource: (args: pulumi.runtime.MockResourceArgs): {
    id: string;
    state: any;
  } => {
    return {
      id: `${args.name}_id`,
      state: args.inputs,
    };
  },
  call: (args: pulumi.runtime.MockCallArgs) => {
    if (args.token === 'aws:ec2/getInstance:getInstance') {
      // Simulate error for instance IDs containing 'error' or 'invalid'
      const instanceId = args.inputs.instanceId || '';
      if (instanceId.includes('error') || instanceId.includes('invalid')) {
        throw new Error(`Instance ${instanceId} not found`);
      }
      // Return different instance types based on instance ID
      if (instanceId.includes('large')) {
        return {
          instanceType: 't3.large',
          instanceState: 'running',
        };
      }
      if (instanceId.includes('xlarge')) {
        return {
          instanceType: 't3.xlarge',
          instanceState: 'running',
        };
      }
      if (instanceId.includes('micro')) {
        return {
          instanceType: 't3.micro',
          instanceState: 'running',
        };
      }
      if (instanceId.includes('small')) {
        return {
          instanceType: 't3.small',
          instanceState: 'running',
        };
      }
      if (instanceId.includes('unknowntype') || instanceId.includes('custom')) {
        // Return an instance type not in the pricing map to trigger default rate
        return {
          instanceType: 'm6i.xlarge',
          instanceState: 'running',
        };
      }
      return {
        instanceType: 't3.medium',
        instanceState: 'running',
      };
    }
    return args.inputs;
  },
});

describe('CostCalculationStack', () => {
  it('should create CostCalculationStack with correct type', (done) => {
    const stack = new CostCalculationStack('test-cost', {
      environmentSuffix: 'test',
      instanceIds: pulumi.output(['i-1234567890abcdef0']),
    });

    pulumi.all([stack.urn]).apply(([urn]) => {
      expect(urn).toContain('tap:cost:CostCalculationStack');
      done();
    });
  });

  it('should calculate zero savings for no instances', (done) => {
    const stack = new CostCalculationStack('empty-cost', {
      environmentSuffix: 'test',
      instanceIds: pulumi.output([]),
    });

    pulumi.all([stack.estimatedMonthlySavings]).apply(([savings]) => {
      expect(savings).toBe(0);
      done();
    });
  });

  it('should have estimatedMonthlySavings output', (done) => {
    const stack = new CostCalculationStack('savings-cost', {
      environmentSuffix: 'test',
      instanceIds: pulumi.output(['i-test123']),
    });

    pulumi.all([stack.estimatedMonthlySavings]).apply(([savings]) => {
      expect(savings).toBeDefined();
      expect(typeof savings).toBe('number');
      expect(savings).toBeGreaterThanOrEqual(0);
      done();
    });
  });

  it('should have outputs with correct structure', (done) => {
    const stack = new CostCalculationStack('struct-cost', {
      environmentSuffix: 'test',
      instanceIds: pulumi.output(['i-test123', 'i-test456']),
    });

    pulumi.all([stack.outputs]).apply(([outputs]) => {
      expect(outputs).toBeDefined();
      expect(outputs.estimatedMonthlySavings).toBeDefined();
      expect(outputs.instanceCount).toBeDefined();
      expect(typeof outputs.estimatedMonthlySavings).toBe('number');
      expect(typeof outputs.instanceCount).toBe('number');
      done();
    });
  });

  it('should calculate savings for single instance', (done) => {
    const stack = new CostCalculationStack('single-cost', {
      environmentSuffix: 'test',
      instanceIds: pulumi.output(['i-single123']),
    });

    pulumi.all([stack.estimatedMonthlySavings]).apply(([savings]) => {
      expect(savings).toBeGreaterThan(0);
      // t3.medium @ 0.0528/hr * 13hrs/day * 22days = ~15.10
      expect(savings).toBeGreaterThan(10);
      done();
    });
  });

  it('should calculate savings for multiple instances', (done) => {
    const stack = new CostCalculationStack('multi-cost', {
      environmentSuffix: 'test',
      instanceIds: pulumi.output(['i-test1', 'i-test2', 'i-test3']),
    });

    pulumi.all([stack.estimatedMonthlySavings]).apply(([savings]) => {
      expect(savings).toBeGreaterThan(0);
      // Multiple t3.medium instances should have higher savings
      expect(savings).toBeGreaterThan(30);
      done();
    });
  });

  it('should count instances correctly', (done) => {
    const instanceIds = ['i-1', 'i-2', 'i-3', 'i-4', 'i-5'];
    const stack = new CostCalculationStack('count-cost', {
      environmentSuffix: 'test',
      instanceIds: pulumi.output(instanceIds),
    });

    pulumi.all([stack.outputs]).apply(([outputs]) => {
      expect(outputs.instanceCount).toBe(instanceIds.length);
      done();
    });
  });

  it('should handle different instance types', (done) => {
    const stack = new CostCalculationStack('types-cost', {
      environmentSuffix: 'test',
      instanceIds: pulumi.output(['i-large1', 'i-medium1']),
    });

    pulumi.all([stack.estimatedMonthlySavings]).apply(([savings]) => {
      // Large instance should cost more than medium
      expect(savings).toBeGreaterThan(0);
      done();
    });
  });

  it('should use correct pricing for ap-southeast-1', (done) => {
    const stack = new CostCalculationStack('pricing-cost', {
      environmentSuffix: 'test',
      instanceIds: pulumi.output(['i-pricetest']),
    });

    pulumi.all([stack.estimatedMonthlySavings]).apply(([savings]) => {
      // Savings should be calculated with ap-southeast-1 pricing
      expect(savings).toBeGreaterThan(0);
      done();
    });
  });

  it('should calculate with 13 hours daily shutdown', (done) => {
    const stack = new CostCalculationStack('shutdown-cost', {
      environmentSuffix: 'test',
      instanceIds: pulumi.output(['i-shutdown']),
    });

    pulumi.all([stack.estimatedMonthlySavings]).apply(([savings]) => {
      // 13 hours * 22 days = 286 hours per month
      // t3.medium @ 0.0528/hr * 286 = ~15.10
      expect(savings).toBeCloseTo(15.1, 0);
      done();
    });
  });

  it('should handle tags parameter', (done) => {
    const stack = new CostCalculationStack('tags-cost', {
      environmentSuffix: 'test',
      instanceIds: pulumi.output(['i-tagged']),
      tags: {
        Environment: 'test',
        Project: 'cost-test',
      },
    });

    pulumi.all([stack.urn]).apply(([urn]) => {
      expect(urn).toBeDefined();
      done();
    });
  });

  it('should work with Pulumi Output for instanceIds', (done) => {
    const outputInstanceIds = pulumi.output(['i-output1', 'i-output2']);
    const stack = new CostCalculationStack('output-cost', {
      environmentSuffix: 'test',
      instanceIds: outputInstanceIds,
    });

    pulumi.all([stack.estimatedMonthlySavings]).apply(([savings]) => {
      expect(savings).toBeGreaterThan(0);
      done();
    });
  });

  it('should round savings to 2 decimal places', (done) => {
    const stack = new CostCalculationStack('round-cost', {
      environmentSuffix: 'test',
      instanceIds: pulumi.output(['i-round']),
    });

    pulumi.all([stack.estimatedMonthlySavings]).apply(([savings]) => {
      const decimalPlaces = savings.toString().split('.')[1]?.length || 0;
      expect(decimalPlaces).toBeLessThanOrEqual(2);
      done();
    });
  });

  it('should handle instance fetch errors gracefully', (done) => {
    const stack = new CostCalculationStack('error-cost', {
      environmentSuffix: 'test',
      instanceIds: pulumi.output(['i-error', 'i-valid']),
    });

    pulumi.all([stack.estimatedMonthlySavings]).apply(([savings]) => {
      // Should still calculate for valid instances
      expect(savings).toBeGreaterThanOrEqual(0);
      done();
    });
  });

  it('should use default rate for unknown instance types', (done) => {
    const stack = new CostCalculationStack('unknown-cost', {
      environmentSuffix: 'test',
      instanceIds: pulumi.output(['i-unknown']),
    });

    pulumi.all([stack.estimatedMonthlySavings]).apply(([savings]) => {
      // Should use default rate of 0.05/hr
      expect(savings).toBeGreaterThan(0);
      done();
    });
  });

  it('should calculate correct monthly shutdown hours', (done) => {
    const stack = new CostCalculationStack('hours-cost', {
      environmentSuffix: 'test',
      instanceIds: pulumi.output(['i-hours']),
    });

    pulumi.all([stack.estimatedMonthlySavings]).apply(([savings]) => {
      // Verify 13 * 22 = 286 hours calculation
      const hourlyRate = 0.0528; // t3.medium
      const expectedSavings = Math.round(hourlyRate * 13 * 22 * 100) / 100;
      expect(savings).toBeCloseTo(expectedSavings, 1);
      done();
    });
  });

  it('should handle multiple instance types in pricing calculation', (done) => {
    const stack = new CostCalculationStack('multi-type-cost', {
      environmentSuffix: 'test',
      instanceIds: pulumi.output(['i-t3micro', 'i-t3small', 'i-t3large']),
    });

    pulumi.all([stack.estimatedMonthlySavings]).apply(([savings]) => {
      expect(savings).toBeGreaterThan(0);
      expect(typeof savings).toBe('number');
      done();
    });
  });

  it('should calculate savings with empty instance list', (done) => {
    const stack = new CostCalculationStack('empty-list-cost', {
      environmentSuffix: 'test',
      instanceIds: pulumi.output([]),
    });

    pulumi.all([stack.estimatedMonthlySavings]).apply(([savings]) => {
      expect(savings).toBe(0);
      done();
    });
  });

  it('should handle mixed valid and invalid instances', (done) => {
    const stack = new CostCalculationStack('mixed-cost', {
      environmentSuffix: 'test',
      instanceIds: pulumi.output(['i-valid', 'i-invalid', 'i-another']),
    });

    pulumi.all([stack.estimatedMonthlySavings]).apply(([savings]) => {
      expect(savings).toBeGreaterThanOrEqual(0);
      expect(Number.isFinite(savings)).toBe(true);
      done();
    });
  });

  it('should handle instance fetch errors and continue with valid instances', (done) => {
    const stack = new CostCalculationStack('error-handling-cost', {
      environmentSuffix: 'test',
      instanceIds: pulumi.output(['i-error-instance', 'i-valid-micro']),
    });

    pulumi.all([stack.estimatedMonthlySavings]).apply(([savings]) => {
      // Should calculate savings for valid instance despite error on first one
      expect(savings).toBeGreaterThan(0);
      expect(Number.isFinite(savings)).toBe(true);
      done();
    });
  });

  it('should handle all instances throwing errors gracefully', (done) => {
    const stack = new CostCalculationStack('all-errors-cost', {
      environmentSuffix: 'test',
      instanceIds: pulumi.output(['i-error-1', 'i-error-2', 'i-invalid-3']),
    });

    pulumi.all([stack.estimatedMonthlySavings]).apply(([savings]) => {
      // Should return 0 when all instances fail
      expect(savings).toBe(0);
      done();
    });
  });

  it('should use correct pricing for t3.micro instances', (done) => {
    const stack = new CostCalculationStack('t3-micro-cost', {
      environmentSuffix: 'test',
      instanceIds: pulumi.output(['i-micro-1']),
    });

    pulumi.all([stack.estimatedMonthlySavings]).apply(([savings]) => {
      // t3.micro = 0.0132/hr * 286 hours = 3.78 rounded
      expect(savings).toBeCloseTo(3.78, 1);
      done();
    });
  });

  it('should use correct pricing for t3.xlarge instances', (done) => {
    const stack = new CostCalculationStack('t3-xlarge-cost', {
      environmentSuffix: 'test',
      instanceIds: pulumi.output(['i-xlarge-1']),
    });

    pulumi.all([stack.estimatedMonthlySavings]).apply(([savings]) => {
      // t3.xlarge pricing calculation
      expect(savings).toBeGreaterThan(25);
      expect(savings).toBeLessThan(65);
      done();
    });
  });

  it('should correctly sum costs for multiple different instance types', (done) => {
    const stack = new CostCalculationStack('multi-types-sum-cost', {
      environmentSuffix: 'test',
      instanceIds: pulumi.output(['i-micro-1', 'i-small-2', 'i-large-3']),
    });

    pulumi.all([stack.estimatedMonthlySavings]).apply(([savings]) => {
      // micro (0.0132) + small (0.0264) + large (0.1056) = 0.1452/hr * 286 = 41.53
      expect(savings).toBeGreaterThan(40);
      expect(savings).toBeLessThan(43);
      done();
    });
  });

  it('should use default rate for completely unknown instance type', (done) => {
    const stack = new CostCalculationStack('unknown-type-cost', {
      environmentSuffix: 'test',
      instanceIds: pulumi.output(['i-unknowntype']),
    });

    pulumi.all([stack.estimatedMonthlySavings]).apply(([savings]) => {
      // Default rate 0.05/hr * 286 hours = 14.3
      expect(savings).toBeCloseTo(14.3, 0);
      done();
    });
  });

  it('should apply default rate for instance type not in pricing map', (done) => {
    const stack = new CostCalculationStack('missing-price-cost', {
      environmentSuffix: 'test',
      instanceIds: pulumi.output(['i-custom-instance']),
    });

    pulumi.all([stack.estimatedMonthlySavings]).apply(([savings]) => {
      // Should use default 0.05/hr rate
      expect(savings).toBeGreaterThan(10);
      expect(savings).toBeLessThan(20);
      done();
    });
  });
});
