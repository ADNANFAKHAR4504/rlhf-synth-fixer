/**
 * Unit tests for ParameterStoreHierarchy component
 *
 * Tests validate parameter store logic including environment-specific values.
 */

import * as pulumi from '@pulumi/pulumi';
import {
  ParameterStoreHierarchy,
  ParameterStoreHierarchyArgs,
} from '../lib/infrastructure/parameter-store';

describe('ParameterStoreHierarchy - Environment-Specific Values', () => {
  let mockVpcId: pulumi.Output<string>;
  let mockSecurityGroupIds: pulumi.Output<string>[];

  beforeAll(() => {
    mockVpcId = pulumi.output('vpc-param-test');
    mockSecurityGroupIds = [pulumi.output('sg-param-test')];
  });

  test('ParameterStoreHierarchy creates dev environment parameters', () => {
    const args: ParameterStoreHierarchyArgs = {
      environmentSuffix: 'dev-params',
      environment: 'dev',
      vpcId: mockVpcId,
      securityGroupIds: mockSecurityGroupIds,
    };

    const paramStore = new ParameterStoreHierarchy('param-dev', args);

    expect(paramStore).toBeDefined();
    expect(paramStore.sharedParameters).toBeDefined();
    expect(paramStore.environmentParameters).toBeDefined();
  });

  test('ParameterStoreHierarchy creates staging environment parameters', () => {
    const args: ParameterStoreHierarchyArgs = {
      environmentSuffix: 'staging-params',
      environment: 'staging',
      vpcId: mockVpcId,
      securityGroupIds: mockSecurityGroupIds,
    };

    const paramStore = new ParameterStoreHierarchy('param-staging', args);

    expect(paramStore).toBeDefined();
    expect(paramStore.sharedParameters).toHaveLength(3);
    expect(paramStore.environmentParameters).toHaveLength(3);
  });

  test('ParameterStoreHierarchy creates prod environment parameters', () => {
    const args: ParameterStoreHierarchyArgs = {
      environmentSuffix: 'prod-params',
      environment: 'prod',
      vpcId: mockVpcId,
      securityGroupIds: mockSecurityGroupIds,
    };

    const paramStore = new ParameterStoreHierarchy('param-prod', args);

    expect(paramStore).toBeDefined();
    expect(paramStore.sharedParameters).toHaveLength(3);
    expect(paramStore.environmentParameters).toHaveLength(3);
  });

  test('ParameterStoreHierarchy handles custom environment names', () => {
    const args: ParameterStoreHierarchyArgs = {
      environmentSuffix: 'qa-params',
      environment: 'qa',
      vpcId: mockVpcId,
      securityGroupIds: mockSecurityGroupIds,
    };

    const paramStore = new ParameterStoreHierarchy('param-qa', args);

    expect(paramStore).toBeDefined();
    expect(paramStore.sharedParameters).toHaveLength(3);
    expect(paramStore.environmentParameters).toHaveLength(3);
  });
});

describe('ParameterStoreHierarchy - Multiple Security Groups', () => {
  let mockVpcId: pulumi.Output<string>;

  beforeAll(() => {
    mockVpcId = pulumi.output('vpc-multi-sg');
  });

  test('ParameterStoreHierarchy handles single security group', () => {
    const args: ParameterStoreHierarchyArgs = {
      environmentSuffix: 'single-sg',
      environment: 'dev',
      vpcId: mockVpcId,
      securityGroupIds: [pulumi.output('sg-1')],
    };

    const paramStore = new ParameterStoreHierarchy('param-single-sg', args);
    expect(paramStore).toBeDefined();
  });

  test('ParameterStoreHierarchy handles multiple security groups', () => {
    const args: ParameterStoreHierarchyArgs = {
      environmentSuffix: 'multi-sg',
      environment: 'dev',
      vpcId: mockVpcId,
      securityGroupIds: [
        pulumi.output('sg-1'),
        pulumi.output('sg-2'),
        pulumi.output('sg-3'),
      ],
    };

    const paramStore = new ParameterStoreHierarchy('param-multi-sg', args);
    expect(paramStore).toBeDefined();
  });
});

describe('ParameterStoreHierarchy - Parameter Arrays', () => {
  test('ParameterStoreHierarchy shared parameters array is accessible', () => {
    const mockVpcId = pulumi.output('vpc-array-test');
    const mockSecurityGroupIds = [pulumi.output('sg-array-test')];

    const args: ParameterStoreHierarchyArgs = {
      environmentSuffix: 'array-test',
      environment: 'dev',
      vpcId: mockVpcId,
      securityGroupIds: mockSecurityGroupIds,
    };

    const paramStore = new ParameterStoreHierarchy('param-array', args);

    expect(paramStore.sharedParameters).toBeDefined();
    expect(Array.isArray(paramStore.sharedParameters)).toBe(true);
    expect(paramStore.sharedParameters.length).toBeGreaterThan(0);
  });

  test('ParameterStoreHierarchy environment parameters array is accessible', () => {
    const mockVpcId = pulumi.output('vpc-env-array');
    const mockSecurityGroupIds = [pulumi.output('sg-env-array')];

    const args: ParameterStoreHierarchyArgs = {
      environmentSuffix: 'env-array',
      environment: 'dev',
      vpcId: mockVpcId,
      securityGroupIds: mockSecurityGroupIds,
    };

    const paramStore = new ParameterStoreHierarchy('param-env-array', args);

    expect(paramStore.environmentParameters).toBeDefined();
    expect(Array.isArray(paramStore.environmentParameters)).toBe(true);
    expect(paramStore.environmentParameters.length).toBeGreaterThan(0);
  });
});

describe('ParameterStoreHierarchy - Edge Cases', () => {
  test('ParameterStoreHierarchy handles short environment suffix', () => {
    const mockVpcId = pulumi.output('vpc-short');
    const mockSecurityGroupIds = [pulumi.output('sg-short')];

    const args: ParameterStoreHierarchyArgs = {
      environmentSuffix: 'x',
      environment: 'dev',
      vpcId: mockVpcId,
      securityGroupIds: mockSecurityGroupIds,
    };

    const paramStore = new ParameterStoreHierarchy('param-short', args);
    expect(paramStore).toBeDefined();
  });

  test('ParameterStoreHierarchy handles long environment suffix', () => {
    const mockVpcId = pulumi.output('vpc-long');
    const mockSecurityGroupIds = [pulumi.output('sg-long')];

    const args: ParameterStoreHierarchyArgs = {
      environmentSuffix: 'very-long-environment-suffix-for-testing-parameter-store',
      environment: 'dev',
      vpcId: mockVpcId,
      securityGroupIds: mockSecurityGroupIds,
    };

    const paramStore = new ParameterStoreHierarchy('param-long', args);
    expect(paramStore).toBeDefined();
  });

  test('ParameterStoreHierarchy handles numeric environment suffix', () => {
    const mockVpcId = pulumi.output('vpc-numeric');
    const mockSecurityGroupIds = [pulumi.output('sg-numeric')];

    const args: ParameterStoreHierarchyArgs = {
      environmentSuffix: '12345',
      environment: 'dev',
      vpcId: mockVpcId,
      securityGroupIds: mockSecurityGroupIds,
    };

    const paramStore = new ParameterStoreHierarchy('param-numeric', args);
    expect(paramStore).toBeDefined();
  });
});

describe('ParameterStoreHierarchy - Type Validation', () => {
  test('ParameterStoreHierarchyArgs validates required fields', () => {
    const mockVpcId = pulumi.output('vpc-validation');
    const mockSecurityGroupIds = [pulumi.output('sg-validation')];

    const args: ParameterStoreHierarchyArgs = {
      environmentSuffix: 'validation',
      environment: 'dev',
      vpcId: mockVpcId,
      securityGroupIds: mockSecurityGroupIds,
    };

    expect(typeof args.environmentSuffix).toBe('string');
    expect(typeof args.environment).toBe('string');
    expect(args.vpcId).toBeDefined();
    expect(Array.isArray(args.securityGroupIds)).toBe(true);
  });
});
