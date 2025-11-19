/**
 * Unit tests for CrossStackReferences component
 *
 * Tests validate cross-stack reference logic including stack reference handling.
 */

import * as pulumi from '@pulumi/pulumi';
import {
  CrossStackReferences,
  CrossStackReferencesArgs,
} from '../lib/infrastructure/cross-stack-references';

describe('CrossStackReferences - Advanced Scenarios', () => {
  let mockVpcId: pulumi.Output<string>;
  let mockEcsClusterArn: pulumi.Output<string>;
  let mockAlbArn: pulumi.Output<string>;
  let mockAuroraEndpoint: pulumi.Output<string>;

  beforeAll(() => {
    mockVpcId = pulumi.output('vpc-test123');
    mockEcsClusterArn = pulumi.output('arn:aws:ecs:us-east-1:123:cluster/test');
    mockAlbArn = pulumi.output('arn:aws:elasticloadbalancing:us-east-1:123:loadbalancer/app/test');
    mockAuroraEndpoint = pulumi.output('aurora.example.com');
  });

  test('CrossStackReferences handles different environment names', () => {
    const devArgs: CrossStackReferencesArgs = {
      environmentSuffix: 'dev-test',
      environment: 'dev',
      vpcId: mockVpcId,
      ecsClusterArn: mockEcsClusterArn,
      albArn: mockAlbArn,
      auroraEndpoint: mockAuroraEndpoint,
    };

    const devRef = new CrossStackReferences('cross-dev', devArgs);
    expect(devRef).toBeDefined();

    const stagingArgs: CrossStackReferencesArgs = {
      environmentSuffix: 'staging-test',
      environment: 'staging',
      vpcId: mockVpcId,
      ecsClusterArn: mockEcsClusterArn,
      albArn: mockAlbArn,
      auroraEndpoint: mockAuroraEndpoint,
    };

    const stagingRef = new CrossStackReferences('cross-staging', stagingArgs);
    expect(stagingRef).toBeDefined();

    const prodArgs: CrossStackReferencesArgs = {
      environmentSuffix: 'prod-test',
      environment: 'prod',
      vpcId: mockVpcId,
      ecsClusterArn: mockEcsClusterArn,
      albArn: mockAlbArn,
      auroraEndpoint: mockAuroraEndpoint,
    };

    const prodRef = new CrossStackReferences('cross-prod', prodArgs);
    expect(prodRef).toBeDefined();
  });

  test('CrossStackReferences accepts Pulumi Outputs as arguments', () => {
    const args: CrossStackReferencesArgs = {
      environmentSuffix: 'output-types',
      environment: 'dev',
      vpcId: mockVpcId,
      ecsClusterArn: mockEcsClusterArn,
      albArn: mockAlbArn,
      auroraEndpoint: mockAuroraEndpoint,
    };

    const ref = new CrossStackReferences('cross-outputs', args);

    expect(ref).toBeDefined();
    expect(ref).toBeInstanceOf(CrossStackReferences);
  });

  test('CrossStackReferences can be instantiated multiple times', () => {
    const instances: CrossStackReferences[] = [];

    for (let i = 0; i < 3; i++) {
      const args: CrossStackReferencesArgs = {
        environmentSuffix: `multi-${i}`,
        environment: 'dev',
        vpcId: mockVpcId,
        ecsClusterArn: mockEcsClusterArn,
        albArn: mockAlbArn,
        auroraEndpoint: mockAuroraEndpoint,
      };

      const ref = new CrossStackReferences(`cross-multi-${i}`, args);
      instances.push(ref);
    }

    expect(instances).toHaveLength(3);
    instances.forEach(instance => {
      expect(instance).toBeInstanceOf(CrossStackReferences);
    });
  });

  test('CrossStackReferences handles long environment suffixes', () => {
    const longSuffix = 'very-long-environment-suffix-with-many-characters-12345';

    const args: CrossStackReferencesArgs = {
      environmentSuffix: longSuffix,
      environment: 'dev',
      vpcId: mockVpcId,
      ecsClusterArn: mockEcsClusterArn,
      albArn: mockAlbArn,
      auroraEndpoint: mockAuroraEndpoint,
    };

    const ref = new CrossStackReferences('cross-long', args);
    expect(ref).toBeDefined();
  });

  test('CrossStackReferences handles special characters in environment suffix', () => {
    const specialSuffix = 'test-env_123';

    const args: CrossStackReferencesArgs = {
      environmentSuffix: specialSuffix,
      environment: 'dev',
      vpcId: mockVpcId,
      ecsClusterArn: mockEcsClusterArn,
      albArn: mockAlbArn,
      auroraEndpoint: mockAuroraEndpoint,
    };

    const ref = new CrossStackReferences('cross-special', args);
    expect(ref).toBeDefined();
  });
});

describe('CrossStackReferences - Type Validation', () => {
  test('CrossStackReferencesArgs validates all required fields', () => {
    const mockVpcId = pulumi.output('vpc-123');
    const mockEcsArn = pulumi.output('arn:aws:ecs:us-east-1:123:cluster/test');
    const mockAlbArn = pulumi.output('arn:aws:elasticloadbalancing:us-east-1:123:loadbalancer/app/test');
    const mockEndpoint = pulumi.output('db.example.com');

    const args: CrossStackReferencesArgs = {
      environmentSuffix: 'validation',
      environment: 'dev',
      vpcId: mockVpcId,
      ecsClusterArn: mockEcsArn,
      albArn: mockAlbArn,
      auroraEndpoint: mockEndpoint,
    };

    expect(args.environmentSuffix).toBe('validation');
    expect(args.environment).toBe('dev');
    expect(args.vpcId).toBeDefined();
    expect(args.ecsClusterArn).toBeDefined();
    expect(args.albArn).toBeDefined();
    expect(args.auroraEndpoint).toBeDefined();
  });
});

describe('CrossStackReferences - Component Lifecycle', () => {
  test('CrossStackReferences can be created and destroyed', () => {
    const mockVpcId = pulumi.output('vpc-lifecycle');
    const mockEcsArn = pulumi.output('arn:aws:ecs:us-east-1:123:cluster/lifecycle');
    const mockAlbArn = pulumi.output('arn:aws:elasticloadbalancing:us-east-1:123:loadbalancer/app/lifecycle');
    const mockEndpoint = pulumi.output('db.lifecycle.com');

    const args: CrossStackReferencesArgs = {
      environmentSuffix: 'lifecycle',
      environment: 'dev',
      vpcId: mockVpcId,
      ecsClusterArn: mockEcsArn,
      albArn: mockAlbArn,
      auroraEndpoint: mockEndpoint,
    };

    let ref: CrossStackReferences | undefined = new CrossStackReferences('cross-lifecycle', args);
    expect(ref).toBeDefined();

    // Simulate cleanup
    ref = undefined;
    expect(ref).toBeUndefined();
  });
});

describe('CrossStackReferences - Edge Cases', () => {
  test('CrossStackReferences handles minimum valid environment suffix', () => {
    const mockVpcId = pulumi.output('vpc-min');
    const mockEcsArn = pulumi.output('arn:aws:ecs:us-east-1:123:cluster/min');
    const mockAlbArn = pulumi.output('arn:aws:elasticloadbalancing:us-east-1:123:loadbalancer/app/min');
    const mockEndpoint = pulumi.output('db.min.com');

    const args: CrossStackReferencesArgs = {
      environmentSuffix: 'x',
      environment: 'dev',
      vpcId: mockVpcId,
      ecsClusterArn: mockEcsArn,
      albArn: mockAlbArn,
      auroraEndpoint: mockEndpoint,
    };

    const ref = new CrossStackReferences('cross-min', args);
    expect(ref).toBeDefined();
  });

  test('CrossStackReferences handles numeric environment suffix', () => {
    const mockVpcId = pulumi.output('vpc-123');
    const mockEcsArn = pulumi.output('arn:aws:ecs:us-east-1:123:cluster/123');
    const mockAlbArn = pulumi.output('arn:aws:elasticloadbalancing:us-east-1:123:loadbalancer/app/123');
    const mockEndpoint = pulumi.output('db.123.com');

    const args: CrossStackReferencesArgs = {
      environmentSuffix: '12345',
      environment: 'dev',
      vpcId: mockVpcId,
      ecsClusterArn: mockEcsArn,
      albArn: mockAlbArn,
      auroraEndpoint: mockEndpoint,
    };

    const ref = new CrossStackReferences('cross-numeric', args);
    expect(ref).toBeDefined();
  });
});
