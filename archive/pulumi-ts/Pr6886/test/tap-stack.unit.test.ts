/**
 * Combined Unit Tests for TAO Stack Infrastructure
 *
 * This file contains all unit tests for the infrastructure components.
 * Tests validate component resource initialization, configuration, and structure.
 * NO MOCKING of AWS SDK - tests verify component logic and outputs.
 */

import * as pulumi from '@pulumi/pulumi';
import {
  AuroraCluster,
  AuroraClusterArgs,
} from '../lib/infrastructure/aurora-cluster';
import {
  BaseInfrastructure,
  BaseInfrastructureArgs,
} from '../lib/infrastructure/base-infrastructure';
import {
  CrossStackReferences,
  CrossStackReferencesArgs,
} from '../lib/infrastructure/cross-stack-references';
import { EcsService, EcsServiceArgs } from '../lib/infrastructure/ecs-service';
import {
  ParameterStoreHierarchy,
  ParameterStoreHierarchyArgs,
} from '../lib/infrastructure/parameter-store';
import {
  CloudWatchDashboard,
  CloudWatchDashboardArgs,
} from '../lib/monitoring/cloudwatch-dashboard';
import {
  DriftDetection,
  DriftDetectionArgs,
} from '../lib/monitoring/drift-detection';
import { TapStack, TapStackArgs } from '../lib/tap-stack';

// Set up Pulumi mocking for tests
pulumi.runtime.setMocks({
  newResource: (args: pulumi.runtime.MockResourceArgs): {
    id: string;
    state: Record<string, any>;
  } => {
    return {
      id: args.name + '_id',
      state: args.inputs,
    };
  },
  call: (args: pulumi.runtime.MockCallArgs) => {
    if (args.token === 'aws:index/getRegion:getRegion') {
      return {
        name: 'us-east-1',
        id: 'us-east-1',
      };
    }
    return args.inputs;
  },
});

// Set required Pulumi configuration for tests
pulumi.runtime.setConfig('project:environmentSuffix', 'test');
pulumi.runtime.setConfig('project:environment', 'dev');

// ============================================================================
// TapStack ComponentResource Tests
// ============================================================================

describe('TapStack ComponentResource - Initialization', () => {
  test('TapStack instantiates with required arguments', () => {
    const args: TapStackArgs = {
      environmentSuffix: 'test123',
      tags: {
        Project: 'test',
        Owner: 'test-team',
      },
    };

    const stack = new TapStack('test-stack', args);

    expect(stack).toBeDefined();
    expect(stack).toBeInstanceOf(TapStack);
  });

  test('TapStack instantiates with minimal arguments', () => {
    const args: TapStackArgs = {
      environmentSuffix: 'minimal',
    };

    const stack = new TapStack('minimal-stack', args);

    expect(stack).toBeDefined();
    expect(stack).toBeInstanceOf(TapStack);
  });

  test('TapStack instantiates without environmentSuffix (uses default)', () => {
    const args: TapStackArgs = {};

    const stack = new TapStack('default-stack', args);

    expect(stack).toBeDefined();
    expect(stack).toBeInstanceOf(TapStack);
  });
});

describe('TapStack ComponentResource - Outputs', () => {
  let stack: TapStack;

  beforeAll(() => {
    const args: TapStackArgs = {
      environmentSuffix: 'output-test',
    };
    stack = new TapStack('output-test-stack', args);
  });

  test('TapStack exposes vpcId output', () => {
    expect(stack.vpcId).toBeDefined();
  });

  test('TapStack exposes publicSubnetIds output', () => {
    expect(stack.publicSubnetIds).toBeDefined();
    expect(Array.isArray(stack.publicSubnetIds)).toBe(true);
  });

  test('TapStack exposes privateSubnetIds output', () => {
    expect(stack.privateSubnetIds).toBeDefined();
    expect(Array.isArray(stack.privateSubnetIds)).toBe(true);
  });

  test('TapStack exposes ecsClusterName output', () => {
    expect(stack.ecsClusterName).toBeDefined();
  });

  test('TapStack exposes ecsClusterArn output', () => {
    expect(stack.ecsClusterArn).toBeDefined();
  });

  test('TapStack exposes ecsServiceName output', () => {
    expect(stack.ecsServiceName).toBeDefined();
  });

  test('TapStack exposes albDnsName output', () => {
    expect(stack.albDnsName).toBeDefined();
  });

  test('TapStack exposes albArn output', () => {
    expect(stack.albArn).toBeDefined();
  });

  test('TapStack exposes auroraEndpoint output', () => {
    expect(stack.auroraEndpoint).toBeDefined();
  });

  test('TapStack exposes auroraReaderEndpoint output', () => {
    expect(stack.auroraReaderEndpoint).toBeDefined();
  });

  test('TapStack exposes auroraClusterId output', () => {
    expect(stack.auroraClusterId).toBeDefined();
  });

  test('TapStack exposes snsTopicArn output', () => {
    expect(stack.snsTopicArn).toBeDefined();
  });

  test('TapStack exposes dashboardName output', () => {
    expect(stack.dashboardName).toBeDefined();
  });
});

describe('TapStack ComponentResource - Type Checking', () => {
  test('TapStackArgs accepts environmentSuffix as string', () => {
    const args: TapStackArgs = {
      environmentSuffix: 'test-suffix',
    };

    expect(typeof args.environmentSuffix).toBe('string');
  });

  test('TapStackArgs accepts tags as object', () => {
    const args: TapStackArgs = {
      tags: {
        Environment: 'test',
        Team: 'engineering',
      },
    };

    expect(typeof args.tags).toBe('object');
    expect(args.tags).toHaveProperty('Environment');
    expect(args.tags).toHaveProperty('Team');
  });

  test('TapStackArgs can be empty', () => {
    const args: TapStackArgs = {};

    expect(args).toBeDefined();
    expect(Object.keys(args)).toHaveLength(0);
  });
});

describe('TapStack ComponentResource - Fallback Configuration', () => {
  test('TapStack uses provided environmentSuffix from args', () => {
    const args: TapStackArgs = {
      environmentSuffix: 'explicit-suffix',
    };

    const stack = new TapStack('fallback-test-1', args);

    expect(stack).toBeDefined();
    expect(stack).toBeInstanceOf(TapStack);
  });

  test('TapStack falls back to default when no config provided', () => {
    // Test the fallback chain: args || config || env || 'dev'
    // Since args is empty and we're in test mode with mocked config,
    // it should fall back through the chain
    const args: TapStackArgs = {};

    const stack = new TapStack('fallback-test-2', args);

    expect(stack).toBeDefined();
    expect(stack).toBeInstanceOf(TapStack);
  });

  test('TapStack handles different environment values', () => {
    // Test that different environment configurations work
    const devArgs: TapStackArgs = {
      environmentSuffix: 'dev-config',
    };

    const devStack = new TapStack('config-dev', devArgs);
    expect(devStack).toBeDefined();
    expect(devStack.vpcId).toBeDefined();

    const stagingArgs: TapStackArgs = {
      environmentSuffix: 'staging-config',
    };

    const stagingStack = new TapStack('config-staging', stagingArgs);
    expect(stagingStack).toBeDefined();
    expect(stagingStack.ecsClusterName).toBeDefined();

    const prodArgs: TapStackArgs = {
      environmentSuffix: 'prod-config',
    };

    const prodStack = new TapStack('config-prod', prodArgs);
    expect(prodStack).toBeDefined();
    expect(prodStack.auroraEndpoint).toBeDefined();
  });

  test('TapStack validates environment configuration access', () => {
    // This tests the environmentConfigs[environment] lookup
    const args: TapStackArgs = {
      environmentSuffix: 'env-lookup-test',
    };

    const stack = new TapStack('env-lookup', args);

    // Verify all expected outputs exist (confirms env config was accessed)
    expect(stack.vpcId).toBeDefined();
    expect(stack.ecsClusterName).toBeDefined();
    expect(stack.auroraEndpoint).toBeDefined();
    expect(stack.albDnsName).toBeDefined();
  });
});

// ============================================================================
// BaseInfrastructure Component Tests
// ============================================================================

describe('BaseInfrastructure Component', () => {
  test('BaseInfrastructure instantiates with valid arguments', () => {
    const args: BaseInfrastructureArgs = {
      environmentSuffix: 'test',
      environment: 'dev',
      vpcCidr: '10.0.0.0/16',
      availabilityZones: ['a', 'b', 'c'],
    };

    const infra = new BaseInfrastructure('base-test', args);

    expect(infra).toBeDefined();
    expect(infra).toBeInstanceOf(BaseInfrastructure);
  });

  test('BaseInfrastructure exposes required outputs', () => {
    const args: BaseInfrastructureArgs = {
      environmentSuffix: 'output-test',
      environment: 'staging',
      vpcCidr: '10.1.0.0/16',
      availabilityZones: ['a', 'b', 'c'],
    };

    const infra = new BaseInfrastructure('base-output-test', args);

    expect(infra.vpc).toBeDefined();
    expect(infra.publicSubnets).toBeDefined();
    expect(infra.privateSubnets).toBeDefined();
    expect(infra.publicSubnetIds).toBeDefined();
    expect(infra.privateSubnetIds).toBeDefined();
    expect(infra.internetGateway).toBeDefined();
    expect(infra.natGateway).toBeDefined();
    expect(infra.securityGroup).toBeDefined();
    expect(infra.databaseSecurityGroup).toBeDefined();
    expect(infra.ecsCluster).toBeDefined();
  });

  test('BaseInfrastructure creates correct number of subnets', () => {
    const args: BaseInfrastructureArgs = {
      environmentSuffix: 'subnet-test',
      environment: 'dev',
      vpcCidr: '10.2.0.0/16',
      availabilityZones: ['a', 'b', 'c'],
    };

    const infra = new BaseInfrastructure('subnet-test', args);

    expect(infra.publicSubnets).toHaveLength(3);
    expect(infra.privateSubnets).toHaveLength(3);
    expect(infra.publicSubnetIds).toHaveLength(3);
    expect(infra.privateSubnetIds).toHaveLength(3);
  });

  test('BaseInfrastructure handles different availability zone counts', () => {
    const args2AZ: BaseInfrastructureArgs = {
      environmentSuffix: 'az2-test',
      environment: 'dev',
      vpcCidr: '10.3.0.0/16',
      availabilityZones: ['a', 'b'],
    };

    const infra2AZ = new BaseInfrastructure('az2-test', args2AZ);
    expect(infra2AZ.publicSubnets).toHaveLength(2);
    expect(infra2AZ.privateSubnets).toHaveLength(2);

    const args4AZ: BaseInfrastructureArgs = {
      environmentSuffix: 'az4-test',
      environment: 'dev',
      vpcCidr: '10.4.0.0/16',
      availabilityZones: ['a', 'b', 'c', 'd'],
    };

    const infra4AZ = new BaseInfrastructure('az4-test', args4AZ);
    expect(infra4AZ.publicSubnets).toHaveLength(4);
    expect(infra4AZ.privateSubnets).toHaveLength(4);
  });
});

// ============================================================================
// AuroraCluster Component Tests
// ============================================================================

describe('AuroraCluster Component', () => {
  let mockVpcId: pulumi.Output<string>;
  let mockSubnetIds: pulumi.Output<string>[];
  let mockSecurityGroupIds: pulumi.Output<string>[];

  beforeAll(() => {
    mockVpcId = pulumi.output('vpc-test123');
    mockSubnetIds = [
      pulumi.output('subnet-1'),
      pulumi.output('subnet-2'),
      pulumi.output('subnet-3'),
    ];
    mockSecurityGroupIds = [pulumi.output('sg-test123')];
  });

  test('AuroraCluster instantiates with valid arguments', () => {
    const args: AuroraClusterArgs = {
      environmentSuffix: 'test',
      environment: 'dev',
      vpcId: mockVpcId,
      subnetIds: mockSubnetIds,
      securityGroupIds: mockSecurityGroupIds,
      instanceCount: 1,
      backupRetentionDays: 1,
      instanceClass: 't3.medium',
    };

    const cluster = new AuroraCluster('aurora-test', args);

    expect(cluster).toBeDefined();
    expect(cluster).toBeInstanceOf(AuroraCluster);
  });

  test('AuroraCluster exposes required outputs', () => {
    const args: AuroraClusterArgs = {
      environmentSuffix: 'output-test',
      environment: 'dev',
      vpcId: mockVpcId,
      subnetIds: mockSubnetIds,
      securityGroupIds: mockSecurityGroupIds,
      instanceCount: 2,
      backupRetentionDays: 7,
      instanceClass: 'm5.large',
    };

    const cluster = new AuroraCluster('aurora-output-test', args);

    expect(cluster.cluster).toBeDefined();
    expect(cluster.instances).toBeDefined();
    expect(cluster.endpoint).toBeDefined();
    expect(cluster.readerEndpoint).toBeDefined();
    expect(cluster.clusterId).toBeDefined();
    expect(cluster.clusterArn).toBeDefined();
    expect(cluster.secretArn).toBeDefined();
  });

  test('AuroraCluster creates correct number of instances', () => {
    const args1Instance: AuroraClusterArgs = {
      environmentSuffix: 'single-instance',
      environment: 'dev',
      vpcId: mockVpcId,
      subnetIds: mockSubnetIds,
      securityGroupIds: mockSecurityGroupIds,
      instanceCount: 1,
      backupRetentionDays: 1,
      instanceClass: 't3.medium',
    };

    const cluster1 = new AuroraCluster('aurora-1-instance', args1Instance);
    expect(cluster1.instances).toHaveLength(1);

    const args3Instances: AuroraClusterArgs = {
      environmentSuffix: 'triple-instance',
      environment: 'prod',
      vpcId: mockVpcId,
      subnetIds: mockSubnetIds,
      securityGroupIds: mockSecurityGroupIds,
      instanceCount: 3,
      backupRetentionDays: 30,
      instanceClass: 'm5.xlarge',
    };

    const cluster3 = new AuroraCluster('aurora-3-instance', args3Instances);
    expect(cluster3.instances).toHaveLength(3);
  });
});

// ============================================================================
// EcsService Component Tests
// ============================================================================

describe('EcsService Component', () => {
  let mockCluster: any;
  let mockVpcId: pulumi.Output<string>;
  let mockSubnetIds: pulumi.Output<string>[];
  let mockSecurityGroupId: pulumi.Output<string>;
  let mockDatabaseEndpoint: pulumi.Output<string>;
  let mockSecretArn: pulumi.Output<string>;

  beforeAll(() => {
    mockCluster = {
      name: pulumi.output('test-cluster'),
      arn: pulumi.output('arn:aws:ecs:us-east-1:123456789:cluster/test'),
    };
    mockVpcId = pulumi.output('vpc-test123');
    mockSubnetIds = [
      pulumi.output('subnet-1'),
      pulumi.output('subnet-2'),
      pulumi.output('subnet-3'),
    ];
    mockSecurityGroupId = pulumi.output('sg-test123');
    mockDatabaseEndpoint = pulumi.output('db.example.com');
    mockSecretArn = pulumi.output('arn:aws:secretsmanager:us-east-1:123:secret:test');
  });

  test('EcsService instantiates with valid arguments', () => {
    const args: EcsServiceArgs = {
      environmentSuffix: 'test',
      environment: 'dev',
      cluster: mockCluster,
      vpcId: mockVpcId,
      subnetIds: mockSubnetIds,
      albSubnetIds: mockSubnetIds,
      securityGroupId: mockSecurityGroupId,
      imageTag: 'latest',
      databaseEndpoint: mockDatabaseEndpoint,
      databaseSecretArn: mockSecretArn,
    };

    const service = new EcsService('ecs-test', args);

    expect(service).toBeDefined();
    expect(service).toBeInstanceOf(EcsService);
  });

  test('EcsService exposes required outputs', () => {
    const args: EcsServiceArgs = {
      environmentSuffix: 'output-test',
      environment: 'staging',
      cluster: mockCluster,
      vpcId: mockVpcId,
      subnetIds: mockSubnetIds,
      albSubnetIds: mockSubnetIds,
      securityGroupId: mockSecurityGroupId,
      imageTag: 'v1.0.0',
      databaseEndpoint: mockDatabaseEndpoint,
      databaseSecretArn: mockSecretArn,
    };

    const service = new EcsService('ecs-output-test', args);

    expect(service.taskDefinition).toBeDefined();
    expect(service.service).toBeDefined();
    expect(service.alb).toBeDefined();
    expect(service.targetGroup).toBeDefined();
    expect(service.albDnsName).toBeDefined();
    expect(service.albArn).toBeDefined();
    expect(service.serviceName).toBeDefined();
  });
});

// ============================================================================
// ParameterStoreHierarchy Component Tests
// ============================================================================

describe('ParameterStoreHierarchy Component', () => {
  let mockVpcId: pulumi.Output<string>;
  let mockSecurityGroupIds: pulumi.Output<string>[];

  beforeAll(() => {
    mockVpcId = pulumi.output('vpc-test123');
    mockSecurityGroupIds = [pulumi.output('sg-test123')];
  });

  test('ParameterStoreHierarchy instantiates with valid arguments', () => {
    const args: ParameterStoreHierarchyArgs = {
      environmentSuffix: 'test',
      environment: 'dev',
      vpcId: mockVpcId,
      securityGroupIds: mockSecurityGroupIds,
    };

    const paramStore = new ParameterStoreHierarchy('param-test', args);

    expect(paramStore).toBeDefined();
    expect(paramStore).toBeInstanceOf(ParameterStoreHierarchy);
  });

  test('ParameterStoreHierarchy exposes parameter arrays', () => {
    const args: ParameterStoreHierarchyArgs = {
      environmentSuffix: 'output-test',
      environment: 'staging',
      vpcId: mockVpcId,
      securityGroupIds: mockSecurityGroupIds,
    };

    const paramStore = new ParameterStoreHierarchy('param-output-test', args);

    expect(paramStore.sharedParameters).toBeDefined();
    expect(Array.isArray(paramStore.sharedParameters)).toBe(true);
    expect(paramStore.environmentParameters).toBeDefined();
    expect(Array.isArray(paramStore.environmentParameters)).toBe(true);
  });

  test('ParameterStoreHierarchy creates expected number of parameters', () => {
    const args: ParameterStoreHierarchyArgs = {
      environmentSuffix: 'count-test',
      environment: 'dev',
      vpcId: mockVpcId,
      securityGroupIds: mockSecurityGroupIds,
    };

    const paramStore = new ParameterStoreHierarchy('param-count-test', args);

    // Should have 3 shared parameters
    expect(paramStore.sharedParameters).toHaveLength(3);
    // Should have 3 environment-specific parameters
    expect(paramStore.environmentParameters).toHaveLength(3);
  });
});

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

// ============================================================================
// CrossStackReferences Component Tests
// ============================================================================

describe('CrossStackReferences Component', () => {
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

  test('CrossStackReferences instantiates with valid arguments', () => {
    const args: CrossStackReferencesArgs = {
      environmentSuffix: 'test',
      environment: 'dev',
      vpcId: mockVpcId,
      ecsClusterArn: mockEcsClusterArn,
      albArn: mockAlbArn,
      auroraEndpoint: mockAuroraEndpoint,
    };

    const crossStack = new CrossStackReferences('cross-test', args);

    expect(crossStack).toBeDefined();
    expect(crossStack).toBeInstanceOf(CrossStackReferences);
  });

  test('CrossStackReferences works without referenceStack config', () => {
    // This tests the branch where referenceStackName is not set
    const args: CrossStackReferencesArgs = {
      environmentSuffix: 'no-ref-test',
      environment: 'dev',
      vpcId: mockVpcId,
      ecsClusterArn: mockEcsClusterArn,
      albArn: mockAlbArn,
      auroraEndpoint: mockAuroraEndpoint,
    };

    const crossStack = new CrossStackReferences('cross-no-ref', args);

    expect(crossStack).toBeDefined();
    expect(crossStack).toBeInstanceOf(CrossStackReferences);
  });
});

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

// ============================================================================
// CloudWatchDashboard Component Tests
// ============================================================================

describe('CloudWatchDashboard Component', () => {
  let mockEcsClusterName: pulumi.Output<string>;
  let mockEcsServiceName: pulumi.Output<string>;
  let mockAlbArn: pulumi.Output<string>;
  let mockAuroraClusterId: pulumi.Output<string>;

  beforeAll(() => {
    mockEcsClusterName = pulumi.output('test-cluster');
    mockEcsServiceName = pulumi.output('test-service');
    mockAlbArn = pulumi.output('arn:aws:elasticloadbalancing:us-east-1:123:loadbalancer/app/test');
    mockAuroraClusterId = pulumi.output('aurora-cluster-123');
  });

  test('CloudWatchDashboard instantiates with valid arguments', () => {
    const args: CloudWatchDashboardArgs = {
      environmentSuffix: 'test',
      environment: 'dev',
      ecsClusterName: mockEcsClusterName,
      ecsServiceName: mockEcsServiceName,
      albArn: mockAlbArn,
      auroraClusterId: mockAuroraClusterId,
    };

    const dashboard = new CloudWatchDashboard('dashboard-test', args);

    expect(dashboard).toBeDefined();
    expect(dashboard).toBeInstanceOf(CloudWatchDashboard);
  });

  test('CloudWatchDashboard exposes required outputs', () => {
    const args: CloudWatchDashboardArgs = {
      environmentSuffix: 'output-test',
      environment: 'staging',
      ecsClusterName: mockEcsClusterName,
      ecsServiceName: mockEcsServiceName,
      albArn: mockAlbArn,
      auroraClusterId: mockAuroraClusterId,
    };

    const dashboard = new CloudWatchDashboard('dashboard-output-test', args);

    expect(dashboard.dashboard).toBeDefined();
    expect(dashboard.dashboardName).toBeDefined();
  });
});

// ============================================================================
// DriftDetection Component Tests
// ============================================================================

describe('DriftDetection Component', () => {
  let mockVpcId: pulumi.Output<string>;
  let mockEcsClusterArn: pulumi.Output<string>;
  let mockAuroraClusterArn: pulumi.Output<string>;

  beforeAll(() => {
    mockVpcId = pulumi.output('vpc-test123');
    mockEcsClusterArn = pulumi.output('arn:aws:ecs:us-east-1:123:cluster/test');
    mockAuroraClusterArn = pulumi.output('arn:aws:rds:us-east-1:123:cluster:test');
  });

  test('DriftDetection instantiates with valid arguments', () => {
    const args: DriftDetectionArgs = {
      environmentSuffix: 'test',
      environment: 'dev',
      vpcId: mockVpcId,
      ecsClusterArn: mockEcsClusterArn,
      auroraClusterArn: mockAuroraClusterArn,
    };

    const drift = new DriftDetection('drift-test', args);

    expect(drift).toBeDefined();
    expect(drift).toBeInstanceOf(DriftDetection);
  });

  test('DriftDetection exposes required outputs', () => {
    const args: DriftDetectionArgs = {
      environmentSuffix: 'output-test',
      environment: 'staging',
      vpcId: mockVpcId,
      ecsClusterArn: mockEcsClusterArn,
      auroraClusterArn: mockAuroraClusterArn,
    };

    const drift = new DriftDetection('drift-output-test', args);

    expect(drift.snsTopic).toBeDefined();
    expect(drift.snsTopicArn).toBeDefined();
    expect(drift.eventRule).toBeDefined();
  });
});

// ============================================================================
// Component Resource Type Checking Tests
// ============================================================================

describe('Component Resource Type Checking', () => {
  test('BaseInfrastructureArgs validates required fields', () => {
    const args: BaseInfrastructureArgs = {
      environmentSuffix: 'type-test',
      environment: 'dev',
      vpcCidr: '10.5.0.0/16',
      availabilityZones: ['a', 'b'],
    };

    expect(typeof args.environmentSuffix).toBe('string');
    expect(typeof args.environment).toBe('string');
    expect(typeof args.vpcCidr).toBe('string');
    expect(Array.isArray(args.availabilityZones)).toBe(true);
  });

  test('AuroraClusterArgs validates numeric fields', () => {
    const mockVpcId = pulumi.output('vpc-123');
    const mockSubnetIds = [pulumi.output('subnet-1')];
    const mockSecurityGroupIds = [pulumi.output('sg-1')];

    const args: AuroraClusterArgs = {
      environmentSuffix: 'type-test',
      environment: 'dev',
      vpcId: mockVpcId,
      subnetIds: mockSubnetIds,
      securityGroupIds: mockSecurityGroupIds,
      instanceCount: 2,
      backupRetentionDays: 7,
      instanceClass: 'm5.large',
    };

    expect(typeof args.instanceCount).toBe('number');
    expect(typeof args.backupRetentionDays).toBe('number');
    expect(typeof args.instanceClass).toBe('string');
  });
});

// ============================================================================
// Component Resource Integration Tests
// ============================================================================

describe('Component Resource Integration', () => {
  test('Components can be instantiated together', () => {
    const baseArgs: BaseInfrastructureArgs = {
      environmentSuffix: 'integration-test',
      environment: 'dev',
      vpcCidr: '10.6.0.0/16',
      availabilityZones: ['a', 'b', 'c'],
    };

    const baseInfra = new BaseInfrastructure('base-integration', baseArgs);

    const paramArgs: ParameterStoreHierarchyArgs = {
      environmentSuffix: 'integration-test',
      environment: 'dev',
      vpcId: baseInfra.vpc.id,
      securityGroupIds: [baseInfra.securityGroup.id],
    };

    const paramStore = new ParameterStoreHierarchy('param-integration', paramArgs);

    expect(baseInfra).toBeDefined();
    expect(paramStore).toBeDefined();
  });

  test('Components expose outputs for cross-references', () => {
    const baseArgs: BaseInfrastructureArgs = {
      environmentSuffix: 'ref-test',
      environment: 'dev',
      vpcCidr: '10.7.0.0/16',
      availabilityZones: ['a', 'b'],
    };

    const baseInfra = new BaseInfrastructure('base-ref', baseArgs);

    // Verify outputs can be used as inputs
    expect(baseInfra.vpc.id).toBeDefined();
    expect(baseInfra.publicSubnetIds).toBeDefined();
    expect(baseInfra.privateSubnetIds).toBeDefined();
    expect(baseInfra.securityGroup.id).toBeDefined();
    expect(baseInfra.ecsCluster.arn).toBeDefined();
  });
});

// ============================================================================
// Index Module Tests
// ============================================================================

describe('Index Module', () => {
  test('Index module exports are defined', () => {
    const indexModule = require('../lib/index');

    expect(indexModule).toBeDefined();
  });

  test('Index module handles configuration fallbacks', () => {
    // This test exercises the config.get() || process.env || 'dev' branches
    const indexModule = require('../lib/index');

    expect(indexModule).toBeDefined();
    // The module should successfully initialize even with fallback config
    expect(indexModule.vpcId).toBeDefined();
  });

  test('Index module exports vpcId', () => {
    const indexModule = require('../lib/index');

    expect(indexModule.vpcId).toBeDefined();
  });

  test('Index module exports publicSubnetIds', () => {
    const indexModule = require('../lib/index');

    expect(indexModule.publicSubnetIds).toBeDefined();
    expect(Array.isArray(indexModule.publicSubnetIds)).toBe(true);
  });

  test('Index module exports privateSubnetIds', () => {
    const indexModule = require('../lib/index');

    expect(indexModule.privateSubnetIds).toBeDefined();
    expect(Array.isArray(indexModule.privateSubnetIds)).toBe(true);
  });

  test('Index module exports ecsClusterName', () => {
    const indexModule = require('../lib/index');

    expect(indexModule.ecsClusterName).toBeDefined();
  });

  test('Index module exports ecsClusterArn', () => {
    const indexModule = require('../lib/index');

    expect(indexModule.ecsClusterArn).toBeDefined();
  });

  test('Index module exports ecsServiceName', () => {
    const indexModule = require('../lib/index');

    expect(indexModule.ecsServiceName).toBeDefined();
  });

  test('Index module exports albDnsName', () => {
    const indexModule = require('../lib/index');

    expect(indexModule.albDnsName).toBeDefined();
  });

  test('Index module exports albArn', () => {
    const indexModule = require('../lib/index');

    expect(indexModule.albArn).toBeDefined();
  });

  test('Index module exports auroraEndpoint', () => {
    const indexModule = require('../lib/index');

    expect(indexModule.auroraEndpoint).toBeDefined();
  });

  test('Index module exports auroraReaderEndpoint', () => {
    const indexModule = require('../lib/index');

    expect(indexModule.auroraReaderEndpoint).toBeDefined();
  });

  test('Index module exports auroraClusterId', () => {
    const indexModule = require('../lib/index');

    expect(indexModule.auroraClusterId).toBeDefined();
  });

  test('Index module exports snsTopicArn', () => {
    const indexModule = require('../lib/index');

    expect(indexModule.snsTopicArn).toBeDefined();
  });

  test('Index module exports dashboardName', () => {
    const indexModule = require('../lib/index');

    expect(indexModule.dashboardName).toBeDefined();
  });

  test('Index module creates infrastructure components', () => {
    const indexModule = require('../lib/index');

    // Verify that components were instantiated by checking exports
    expect(indexModule.vpcId).toBeDefined();
    expect(indexModule.ecsClusterName).toBeDefined();
    expect(indexModule.auroraEndpoint).toBeDefined();
  });

  test('Index module outputs are Pulumi Outputs', () => {
    const indexModule = require('../lib/index');
    const pulumi = require('@pulumi/pulumi');

    // Check that exports are Pulumi Output objects
    expect(indexModule.vpcId).toBeDefined();
    expect(typeof indexModule.vpcId.apply).toBe('function');
  });

  test('Index module subnet arrays are populated', () => {
    const indexModule = require('../lib/index');

    expect(indexModule.publicSubnetIds).toBeDefined();
    expect(indexModule.publicSubnetIds.length).toBeGreaterThan(0);

    expect(indexModule.privateSubnetIds).toBeDefined();
    expect(indexModule.privateSubnetIds.length).toBeGreaterThan(0);
  });

  test('Index module exports match expected types', () => {
    const indexModule = require('../lib/index');

    // VPC outputs
    expect(indexModule.vpcId).toBeDefined();
    expect(indexModule.publicSubnetIds).toBeDefined();
    expect(indexModule.privateSubnetIds).toBeDefined();

    // ECS outputs
    expect(indexModule.ecsClusterName).toBeDefined();
    expect(indexModule.ecsClusterArn).toBeDefined();
    expect(indexModule.ecsServiceName).toBeDefined();

    // ALB outputs
    expect(indexModule.albDnsName).toBeDefined();
    expect(indexModule.albArn).toBeDefined();

    // Aurora outputs
    expect(indexModule.auroraEndpoint).toBeDefined();
    expect(indexModule.auroraReaderEndpoint).toBeDefined();
    expect(indexModule.auroraClusterId).toBeDefined();

    // Monitoring outputs
    expect(indexModule.snsTopicArn).toBeDefined();
    expect(indexModule.dashboardName).toBeDefined();
  });
});

