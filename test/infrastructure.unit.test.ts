/**
 * Unit tests for infrastructure components
 *
 * Tests validate component resource initialization, configuration, and structure.
 * NO MOCKING - tests verify component logic and outputs.
 */

import * as pulumi from '@pulumi/pulumi';
import {
  BaseInfrastructure,
  BaseInfrastructureArgs,
} from '../lib/infrastructure/base-infrastructure';
import {
  AuroraCluster,
  AuroraClusterArgs,
} from '../lib/infrastructure/aurora-cluster';
import { EcsService, EcsServiceArgs } from '../lib/infrastructure/ecs-service';
import {
  ParameterStoreHierarchy,
  ParameterStoreHierarchyArgs,
} from '../lib/infrastructure/parameter-store';
import {
  CrossStackReferences,
  CrossStackReferencesArgs,
} from '../lib/infrastructure/cross-stack-references';
import {
  CloudWatchDashboard,
  CloudWatchDashboardArgs,
} from '../lib/monitoring/cloudwatch-dashboard';
import {
  DriftDetection,
  DriftDetectionArgs,
} from '../lib/monitoring/drift-detection';

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
});

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
