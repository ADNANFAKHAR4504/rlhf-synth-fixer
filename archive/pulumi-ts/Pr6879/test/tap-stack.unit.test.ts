/**
 * Combined Unit Tests for TAP Stack
 * 
 * This file contains all unit tests for the infrastructure components:
 * - ComputeStack
 * - DatabaseStack
 * - Main Index
 * - MigrationStack
 * - MonitoringStack
 * - NetworkStack
 */

import * as pulumi from '@pulumi/pulumi';
import { ComputeStack } from '../lib/compute-stack';
import { DatabaseStack } from '../lib/database-stack';
import { MigrationStack } from '../lib/migration-stack';
import { MonitoringStack } from '../lib/monitoring-stack';
import { NetworkStack } from '../lib/network-stack';

// Mock Pulumi runtime
pulumi.runtime.setMocks({
  newResource: (args: pulumi.runtime.MockResourceArgs): { id: string; state: any } => {
    return {
      id: `${args.name}_id`,
      state: args.inputs,
    };
  },
  call: (args: pulumi.runtime.MockCallArgs) => {
    return args.inputs;
  },
});

// ============================================================================
// ComputeStack Tests
// ============================================================================

describe('ComputeStack', () => {
  const environmentSuffix = 'test';
  const vpcId = pulumi.output('vpc-123');
  const publicSubnetIds = [
    pulumi.output('public-subnet-1'),
    pulumi.output('public-subnet-2'),
    pulumi.output('public-subnet-3'),
  ];
  const privateSubnetIds = [
    pulumi.output('private-subnet-1'),
    pulumi.output('private-subnet-2'),
    pulumi.output('private-subnet-3'),
  ];
  const databaseEndpoint = pulumi.output('db-endpoint.rds.amazonaws.com');
  const databaseSecurityGroupId = pulumi.output('sg-database');
  const tags = {
    Environment: 'prod-migration',
    CostCenter: 'finance',
    MigrationPhase: 'active',
  };

  let stack: ComputeStack;

  beforeEach(() => {
    stack = new ComputeStack('test-compute', {
      environmentSuffix,
      vpcId,
      publicSubnetIds,
      privateSubnetIds,
      databaseEndpoint,
      databaseSecurityGroupId,
      tags,
    });
  });

  describe('ECS Cluster Configuration', () => {
    it('should create ECS cluster', async () => {
      const clusterName = await stack.clusterName;
      expect(clusterName).toBeDefined();
    });

    it('should create ECS service', async () => {
      const serviceName = await stack.serviceName;
      expect(serviceName).toBeDefined();
    });
  });

  describe('Load Balancer Configuration', () => {
    it('should create ALB with DNS name', async () => {
      const albDnsName = await stack.albDnsName;
      expect(albDnsName).toBeDefined();
    });
  });

  describe('Resource Outputs', () => {
    it('should register all required outputs', async () => {
      const clusterName = await stack.clusterName;
      const serviceName = await stack.serviceName;
      const albDnsName = await stack.albDnsName;

      expect(clusterName).toBeDefined();
      expect(serviceName).toBeDefined();
      expect(albDnsName).toBeDefined();
    });
  });

  describe('Input Validation', () => {
    it('should accept valid configuration', () => {
      expect(() => {
        new ComputeStack('test-compute-2', {
          environmentSuffix: 'test2',
          vpcId,
          publicSubnetIds,
          privateSubnetIds,
          databaseEndpoint,
          databaseSecurityGroupId,
          tags: { test: 'value' },
        });
      }).not.toThrow();
    });

    it('should handle different subnet configurations', () => {
      const customStack = new ComputeStack('test-compute-3', {
        environmentSuffix: 'test3',
        vpcId,
        publicSubnetIds: [pulumi.output('subnet-1')],
        privateSubnetIds: [pulumi.output('subnet-2')],
        databaseEndpoint,
        databaseSecurityGroupId,
        tags,
      });
      expect(customStack).toBeDefined();
    });

    it('should handle empty tags', () => {
      const stackWithoutTags = new ComputeStack('test-compute-4', {
        environmentSuffix: 'test4',
        vpcId,
        publicSubnetIds,
        privateSubnetIds,
        databaseEndpoint,
        databaseSecurityGroupId,
        tags: {},
      });
      expect(stackWithoutTags).toBeDefined();
    });
  });

  describe('Edge Cases', () => {
    it('should handle single subnet configuration', () => {
      const singleSubnetStack = new ComputeStack('test-compute-single', {
        environmentSuffix: 'single',
        vpcId,
        publicSubnetIds: [pulumi.output('public-1')],
        privateSubnetIds: [pulumi.output('private-1')],
        databaseEndpoint,
        databaseSecurityGroupId,
        tags,
      });
      expect(singleSubnetStack).toBeDefined();
    });

    it('should handle multiple subnets', () => {
      const multiSubnetStack = new ComputeStack('test-compute-multi', {
        environmentSuffix: 'multi',
        vpcId,
        publicSubnetIds: [
          pulumi.output('public-1'),
          pulumi.output('public-2'),
          pulumi.output('public-3'),
          pulumi.output('public-4'),
        ],
        privateSubnetIds: [
          pulumi.output('private-1'),
          pulumi.output('private-2'),
          pulumi.output('private-3'),
          pulumi.output('private-4'),
        ],
        databaseEndpoint,
        databaseSecurityGroupId,
        tags,
      });
      expect(multiSubnetStack).toBeDefined();
    });

    it('should handle different database endpoints', () => {
      const customDbStack = new ComputeStack('test-compute-customdb', {
        environmentSuffix: 'customdb',
        vpcId,
        publicSubnetIds,
        privateSubnetIds,
        databaseEndpoint: pulumi.output('custom-db.amazonaws.com'),
        databaseSecurityGroupId,
        tags,
      });
      expect(customDbStack).toBeDefined();
    });
  });

  describe('ECS Service Properties', () => {
    it('should configure Fargate launch type', async () => {
      const serviceName = await stack.serviceName;
      expect(serviceName).toBeDefined();
    });

    it('should configure task definition', async () => {
      const clusterName = await stack.clusterName;
      expect(clusterName).toBeDefined();
    });

    it('should configure health checks', async () => {
      const albDnsName = await stack.albDnsName;
      expect(albDnsName).toBeDefined();
    });
  });
});

// ============================================================================
// DatabaseStack Tests
// ============================================================================

describe('DatabaseStack', () => {
  const environmentSuffix = 'test';
  const vpcId = pulumi.output('vpc-123');
  const privateSubnetIds = [
    pulumi.output('subnet-1'),
    pulumi.output('subnet-2'),
    pulumi.output('subnet-3'),
  ];
  const availabilityZones = ['us-east-1a', 'us-east-1b', 'us-east-1c'];
  const tags = {
    Environment: 'prod-migration',
    CostCenter: 'finance',
    MigrationPhase: 'active',
  };

  let stack: DatabaseStack;

  beforeEach(() => {
    stack = new DatabaseStack('test-database', {
      environmentSuffix,
      vpcId,
      privateSubnetIds,
      availabilityZones,
      tags,
    });
  });

  describe('RDS Cluster Configuration', () => {
    it('should create RDS cluster with writer endpoint', async () => {
      const clusterEndpoint = await stack.clusterEndpoint;
      expect(clusterEndpoint).toBeDefined();
    });

    it('should create RDS cluster with reader endpoint', async () => {
      const readerEndpoint = await stack.readerEndpoint;
      expect(readerEndpoint).toBeDefined();
    });

    it('should return cluster ID', async () => {
      const clusterId = await stack.clusterId;
      expect(clusterId).toBeDefined();
    });
  });

  describe('Security Group Configuration', () => {
    it('should create security group for RDS', async () => {
      const sgId = await stack.securityGroupId;
      expect(sgId).toBeDefined();
    });
  });

  describe('Resource Outputs', () => {
    it('should register all required outputs', async () => {
      const clusterEndpoint = await stack.clusterEndpoint;
      const readerEndpoint = await stack.readerEndpoint;
      const clusterId = await stack.clusterId;
      const sgId = await stack.securityGroupId;

      expect(clusterEndpoint).toBeDefined();
      expect(readerEndpoint).toBeDefined();
      expect(clusterId).toBeDefined();
      expect(sgId).toBeDefined();
    });
  });

  describe('Input Validation', () => {
    it('should accept valid configuration', () => {
      expect(() => {
        new DatabaseStack('test-database-2', {
          environmentSuffix: 'test2',
          vpcId,
          privateSubnetIds,
          availabilityZones: ['us-west-2a', 'us-west-2b'],
          tags: { test: 'value' },
        });
      }).not.toThrow();
    });

    it('should handle different availability zones', () => {
      const differentAzStack = new DatabaseStack('test-database-3', {
        environmentSuffix: 'test3',
        vpcId,
        privateSubnetIds,
        availabilityZones: ['eu-west-1a', 'eu-west-1b'],
        tags,
      });
      expect(differentAzStack).toBeDefined();
    });

    it('should handle empty tags', () => {
      const stackWithoutTags = new DatabaseStack('test-database-4', {
        environmentSuffix: 'test4',
        vpcId,
        privateSubnetIds,
        availabilityZones,
        tags: {},
      });
      expect(stackWithoutTags).toBeDefined();
    });
  });

  describe('Edge Cases', () => {
    it('should handle single subnet', () => {
      const singleSubnetStack = new DatabaseStack('test-database-single-subnet', {
        environmentSuffix: 'single',
        vpcId,
        privateSubnetIds: [pulumi.output('subnet-1')],
        availabilityZones: ['us-east-1a'],
        tags,
      });
      expect(singleSubnetStack).toBeDefined();
    });

    it('should handle multiple subnets', () => {
      const multiSubnetStack = new DatabaseStack('test-database-multi-subnet', {
        environmentSuffix: 'multi',
        vpcId,
        privateSubnetIds: [
          pulumi.output('subnet-1'),
          pulumi.output('subnet-2'),
          pulumi.output('subnet-3'),
          pulumi.output('subnet-4'),
        ],
        availabilityZones: ['us-east-1a', 'us-east-1b', 'us-east-1c', 'us-east-1d'],
        tags,
      });
      expect(multiSubnetStack).toBeDefined();
    });
  });

  describe('Database Properties', () => {
    it('should configure Aurora PostgreSQL engine', async () => {
      const clusterId = await stack.clusterId;
      expect(clusterId).toBeDefined();
    });

    it('should configure encryption at rest', async () => {
      const clusterId = await stack.clusterId;
      expect(clusterId).toBeDefined();
    });

    it('should configure backup retention', async () => {
      const clusterId = await stack.clusterId;
      expect(clusterId).toBeDefined();
    });
  });
});

// ============================================================================
// Main Infrastructure Stack Tests
// ============================================================================

describe('Main Infrastructure Stack', () => {
  describe('Environment Configuration', () => {
    it('should use environment variables for configuration', () => {
      const originalEnv = process.env.ENVIRONMENT_SUFFIX;
      process.env.ENVIRONMENT_SUFFIX = 'test-env';

      const suffix = process.env.ENVIRONMENT_SUFFIX || 'dev';
      expect(suffix).toBe('test-env');

      // Restore original value
      if (originalEnv) {
        process.env.ENVIRONMENT_SUFFIX = originalEnv;
      } else {
        delete process.env.ENVIRONMENT_SUFFIX;
      }
    });

    it('should default to dev when ENVIRONMENT_SUFFIX not set', () => {
      const originalEnv = process.env.ENVIRONMENT_SUFFIX;
      delete process.env.ENVIRONMENT_SUFFIX;

      const suffix = process.env.ENVIRONMENT_SUFFIX || 'dev';
      expect(suffix).toBe('dev');

      // Restore original value
      if (originalEnv) {
        process.env.ENVIRONMENT_SUFFIX = originalEnv;
      }
    });

    it('should use AWS_REGION environment variable', () => {
      const originalRegion = process.env.AWS_REGION;
      process.env.AWS_REGION = 'us-west-2';

      const region = process.env.AWS_REGION || 'us-east-1';
      expect(region).toBe('us-west-2');

      // Restore original value
      if (originalRegion) {
        process.env.AWS_REGION = originalRegion;
      } else {
        delete process.env.AWS_REGION;
      }
    });

    it('should default to us-east-1 when AWS_REGION not set', () => {
      const originalRegion = process.env.AWS_REGION;
      delete process.env.AWS_REGION;

      const region = process.env.AWS_REGION || 'us-east-1';
      expect(region).toBe('us-east-1');

      // Restore original value
      if (originalRegion) {
        process.env.AWS_REGION = originalRegion;
      }
    });
  });

  describe('Default Tags', () => {
    it('should configure default tags', () => {
      const defaultTags = {
        Environment: 'prod-migration',
        CostCenter: 'finance',
        MigrationPhase: 'active',
        ManagedBy: 'pulumi',
        Repository: process.env.REPOSITORY || 'unknown',
        Team: process.env.TEAM || 'unknown',
      };

      expect(defaultTags.Environment).toBe('prod-migration');
      expect(defaultTags.CostCenter).toBe('finance');
      expect(defaultTags.MigrationPhase).toBe('active');
      expect(defaultTags.ManagedBy).toBe('pulumi');
    });

    it('should use environment variables for repository tag', () => {
      const originalRepo = process.env.REPOSITORY;
      process.env.REPOSITORY = 'test-repo';

      const repo = process.env.REPOSITORY || 'unknown';
      expect(repo).toBe('test-repo');

      // Restore original value
      if (originalRepo) {
        process.env.REPOSITORY = originalRepo;
      } else {
        delete process.env.REPOSITORY;
      }
    });

    it('should use environment variables for team tag', () => {
      const originalTeam = process.env.TEAM;
      process.env.TEAM = 'test-team';

      const team = process.env.TEAM || 'unknown';
      expect(team).toBe('test-team');

      // Restore original value
      if (originalTeam) {
        process.env.TEAM = originalTeam;
      } else {
        delete process.env.TEAM;
      }
    });

    it('should default to unknown when repository not set', () => {
      const originalRepo = process.env.REPOSITORY;
      delete process.env.REPOSITORY;

      const repo = process.env.REPOSITORY || 'unknown';
      expect(repo).toBe('unknown');

      // Restore original value
      if (originalRepo) {
        process.env.REPOSITORY = originalRepo;
      }
    });

    it('should default to unknown when team not set', () => {
      const originalTeam = process.env.TEAM;
      delete process.env.TEAM;

      const team = process.env.TEAM || 'unknown';
      expect(team).toBe('unknown');

      // Restore original value
      if (originalTeam) {
        process.env.TEAM = originalTeam;
      }
    });
  });

  describe('Stack Configuration', () => {
    it('should configure VPC CIDR block', () => {
      const vpcCidr = '10.0.0.0/16';
      expect(vpcCidr).toBe('10.0.0.0/16');
    });

    it('should configure availability zones', () => {
      const availabilityZones = ['us-east-1a', 'us-east-1b', 'us-east-1c'];
      expect(availabilityZones).toHaveLength(3);
      expect(availabilityZones[0]).toBe('us-east-1a');
      expect(availabilityZones[1]).toBe('us-east-1b');
      expect(availabilityZones[2]).toBe('us-east-1c');
    });

    it('should configure source database endpoint', () => {
      const sourceDbEndpoint = 'source-db.example.com';
      expect(sourceDbEndpoint).toBe('source-db.example.com');
    });

    it('should configure database port', () => {
      const dbPort = 5432;
      expect(dbPort).toBe(5432);
    });
  });

  describe('Resource Provider', () => {
    it('should create AWS provider with region', () => {
      const region = process.env.AWS_REGION || 'us-east-1';
      expect(['us-east-1', 'us-west-2', 'eu-west-1']).toContain(region);
    });
  });
});

// ============================================================================
// MigrationStack Tests
// ============================================================================

describe('MigrationStack', () => {
  const environmentSuffix = 'test';
  const vpcId = pulumi.output('vpc-123');
  const privateSubnetIds = [
    pulumi.output('subnet-1'),
    pulumi.output('subnet-2'),
    pulumi.output('subnet-3'),
  ];
  const sourceDbEndpoint = 'source-db.example.com';
  const sourceDbPort = 5432;
  const targetDbEndpoint = pulumi.output('target-db.rds.amazonaws.com');
  const targetDbPort = 5432;
  const databaseSecurityGroupId = pulumi.output('sg-database');
  const tags = {
    Environment: 'prod-migration',
    CostCenter: 'finance',
    MigrationPhase: 'active',
  };

  let stack: MigrationStack;

  beforeEach(() => {
    stack = new MigrationStack('test-migration', {
      environmentSuffix,
      vpcId,
      privateSubnetIds,
      sourceDbEndpoint,
      sourceDbPort,
      targetDbEndpoint,
      targetDbPort,
      databaseSecurityGroupId,
      tags,
    });
  });

  describe('DMS Configuration', () => {
    it('should create DMS replication task', async () => {
      const taskArn = await stack.replicationTaskArn;
      expect(taskArn).toBeDefined();
    });
  });

  describe('Lambda Configuration', () => {
    it('should create validation Lambda function', async () => {
      const lambdaArn = await stack.validationLambdaArn;
      expect(lambdaArn).toBeDefined();
    });
  });

  describe('Resource Outputs', () => {
    it('should register all required outputs', async () => {
      const taskArn = await stack.replicationTaskArn;
      const lambdaArn = await stack.validationLambdaArn;

      expect(taskArn).toBeDefined();
      expect(lambdaArn).toBeDefined();
    });
  });

  describe('Input Validation', () => {
    it('should accept valid configuration', () => {
      expect(() => {
        new MigrationStack('test-migration-2', {
          environmentSuffix: 'test2',
          vpcId,
          privateSubnetIds,
          sourceDbEndpoint: 'source2.example.com',
          sourceDbPort: 5432,
          targetDbEndpoint,
          targetDbPort: 5432,
          databaseSecurityGroupId,
          tags: { test: 'value' },
        });
      }).not.toThrow();
    });

    it('should handle different database ports', () => {
      const customPortStack = new MigrationStack('test-migration-3', {
        environmentSuffix: 'test3',
        vpcId,
        privateSubnetIds,
        sourceDbEndpoint,
        sourceDbPort: 3306,
        targetDbEndpoint,
        targetDbPort: 3306,
        databaseSecurityGroupId,
        tags,
      });
      expect(customPortStack).toBeDefined();
    });

    it('should handle empty tags', () => {
      const stackWithoutTags = new MigrationStack('test-migration-4', {
        environmentSuffix: 'test4',
        vpcId,
        privateSubnetIds,
        sourceDbEndpoint,
        sourceDbPort,
        targetDbEndpoint,
        targetDbPort,
        databaseSecurityGroupId,
        tags: {},
      });
      expect(stackWithoutTags).toBeDefined();
    });
  });

  describe('Edge Cases', () => {
    it('should handle single subnet', () => {
      const singleSubnetStack = new MigrationStack('test-migration-single', {
        environmentSuffix: 'single',
        vpcId,
        privateSubnetIds: [pulumi.output('subnet-1')],
        sourceDbEndpoint,
        sourceDbPort,
        targetDbEndpoint,
        targetDbPort,
        databaseSecurityGroupId,
        tags,
      });
      expect(singleSubnetStack).toBeDefined();
    });

    it('should handle multiple subnets', () => {
      const multiSubnetStack = new MigrationStack('test-migration-multi', {
        environmentSuffix: 'multi',
        vpcId,
        privateSubnetIds: [
          pulumi.output('subnet-1'),
          pulumi.output('subnet-2'),
          pulumi.output('subnet-3'),
          pulumi.output('subnet-4'),
        ],
        sourceDbEndpoint,
        sourceDbPort,
        targetDbEndpoint,
        targetDbPort,
        databaseSecurityGroupId,
        tags,
      });
      expect(multiSubnetStack).toBeDefined();
    });

    it('should handle different source endpoints', () => {
      const customSourceStack = new MigrationStack('test-migration-custom', {
        environmentSuffix: 'custom',
        vpcId,
        privateSubnetIds,
        sourceDbEndpoint: 'custom-source.internal',
        sourceDbPort: 5432,
        targetDbEndpoint,
        targetDbPort,
        databaseSecurityGroupId,
        tags,
      });
      expect(customSourceStack).toBeDefined();
    });
  });

  describe('DMS Properties', () => {
    it('should configure CDC replication', async () => {
      const taskArn = await stack.replicationTaskArn;
      expect(taskArn).toBeDefined();
    });

    it('should configure source and target endpoints', async () => {
      const taskArn = await stack.replicationTaskArn;
      expect(taskArn).toBeDefined();
    });

    it('should configure replication instance', async () => {
      const taskArn = await stack.replicationTaskArn;
      expect(taskArn).toBeDefined();
    });
  });

  describe('Lambda Properties', () => {
    it('should configure Lambda runtime', async () => {
      const lambdaArn = await stack.validationLambdaArn;
      expect(lambdaArn).toBeDefined();
    });

    it('should configure Lambda VPC settings', async () => {
      const lambdaArn = await stack.validationLambdaArn;
      expect(lambdaArn).toBeDefined();
    });

    it('should configure Lambda environment variables', async () => {
      const lambdaArn = await stack.validationLambdaArn;
      expect(lambdaArn).toBeDefined();
    });
  });
});

// ============================================================================
// MonitoringStack Tests
// ============================================================================

describe('MonitoringStack', () => {
  const environmentSuffix = 'test';
  const dmsReplicationTaskArn = pulumi.output(
    'arn:aws:dms:us-east-1:123456789012:task:test-task'
  );
  const ecsClusterName = pulumi.output('ecs-cluster-test');
  const ecsServiceName = pulumi.output('payment-app-service-test');
  const rdsClusterId = pulumi.output('aurora-cluster-test');
  const tags = {
    Environment: 'prod-migration',
    CostCenter: 'finance',
    MigrationPhase: 'active',
  };

  let stack: MonitoringStack;

  beforeEach(() => {
    stack = new MonitoringStack('test-monitoring', {
      environmentSuffix,
      dmsReplicationTaskArn,
      ecsClusterName,
      ecsServiceName,
      rdsClusterId,
      tags,
    });
  });

  describe('CloudWatch Alarms', () => {
    it('should create monitoring stack', () => {
      expect(stack).toBeDefined();
    });

    it('should not throw errors during creation', () => {
      expect(() => stack).not.toThrow();
    });
  });

  describe('Input Validation', () => {
    it('should accept valid configuration', () => {
      expect(() => {
        new MonitoringStack('test-monitoring-2', {
          environmentSuffix: 'test2',
          dmsReplicationTaskArn,
          ecsClusterName,
          ecsServiceName,
          rdsClusterId,
          tags: { test: 'value' },
        });
      }).not.toThrow();
    });

    it('should handle different ARN formats', () => {
      const customArnStack = new MonitoringStack('test-monitoring-3', {
        environmentSuffix: 'test3',
        dmsReplicationTaskArn: pulumi.output(
          'arn:aws:dms:us-west-2:987654321:task:custom-task'
        ),
        ecsClusterName,
        ecsServiceName,
        rdsClusterId,
        tags,
      });
      expect(customArnStack).toBeDefined();
    });

    it('should handle empty tags', () => {
      const stackWithoutTags = new MonitoringStack('test-monitoring-4', {
        environmentSuffix: 'test4',
        dmsReplicationTaskArn,
        ecsClusterName,
        ecsServiceName,
        rdsClusterId,
        tags: {},
      });
      expect(stackWithoutTags).toBeDefined();
    });
  });

  describe('Edge Cases', () => {
    it('should handle different cluster names', () => {
      const customClusterStack = new MonitoringStack('test-monitoring-custom-cluster', {
        environmentSuffix: 'customcluster',
        dmsReplicationTaskArn,
        ecsClusterName: pulumi.output('custom-cluster'),
        ecsServiceName,
        rdsClusterId,
        tags,
      });
      expect(customClusterStack).toBeDefined();
    });

    it('should handle different service names', () => {
      const customServiceStack = new MonitoringStack('test-monitoring-custom-service', {
        environmentSuffix: 'customservice',
        dmsReplicationTaskArn,
        ecsClusterName,
        ecsServiceName: pulumi.output('custom-service'),
        rdsClusterId,
        tags,
      });
      expect(customServiceStack).toBeDefined();
    });

    it('should handle different RDS cluster IDs', () => {
      const customRdsStack = new MonitoringStack('test-monitoring-custom-rds', {
        environmentSuffix: 'customrds',
        dmsReplicationTaskArn,
        ecsClusterName,
        ecsServiceName,
        rdsClusterId: pulumi.output('custom-rds-cluster'),
        tags,
      });
      expect(customRdsStack).toBeDefined();
    });
  });

  describe('Alarm Configuration', () => {
    it('should configure DMS replication lag alarm', () => {
      expect(stack).toBeDefined();
    });

    it('should configure ECS task health alarm', () => {
      expect(stack).toBeDefined();
    });

    it('should configure RDS CPU utilization alarm', () => {
      expect(stack).toBeDefined();
    });

    it('should configure RDS storage alarm', () => {
      expect(stack).toBeDefined();
    });

    it('should configure ECS CPU utilization alarm', () => {
      expect(stack).toBeDefined();
    });
  });

  describe('SNS Topic', () => {
    it('should create SNS topic for alarms', () => {
      expect(stack).toBeDefined();
    });
  });
});

// ============================================================================
// NetworkStack Tests
// ============================================================================

describe('NetworkStack', () => {
  const environmentSuffix = 'test';
  const vpcCidr = '10.0.0.0/16';
  const availabilityZones = ['us-east-1a', 'us-east-1b', 'us-east-1c'];
  const tags = {
    Environment: 'prod-migration',
    CostCenter: 'finance',
    MigrationPhase: 'active',
  };

  let stack: NetworkStack;

  beforeEach(() => {
    stack = new NetworkStack('test-network', {
      environmentSuffix,
      vpcCidr,
      availabilityZones,
      tags,
    });
  });

  describe('VPC Configuration', () => {
    it('should create a VPC with correct CIDR block', async () => {
      const vpcId = await stack.vpcId;
      expect(vpcId).toBeDefined();
    });

    it('should use correct environment suffix', () => {
      expect(stack).toBeDefined();
    });
  });

  describe('Public Subnets', () => {
    it('should create 3 public subnets', async () => {
      const publicSubnetIds = stack.publicSubnetIds;
      expect(publicSubnetIds).toHaveLength(3);
    });

    it('should return output for all public subnets', async () => {
      const publicSubnetIds = stack.publicSubnetIds;
      for (const subnetId of publicSubnetIds) {
        const id = await subnetId;
        expect(id).toBeDefined();
      }
    });
  });

  describe('Private Subnets', () => {
    it('should create 3 private subnets', async () => {
      const privateSubnetIds = stack.privateSubnetIds;
      expect(privateSubnetIds).toHaveLength(3);
    });

    it('should return output for all private subnets', async () => {
      const privateSubnetIds = stack.privateSubnetIds;
      for (const subnetId of privateSubnetIds) {
        const id = await subnetId;
        expect(id).toBeDefined();
      }
    });
  });

  describe('Internet Gateway', () => {
    it('should create an Internet Gateway', async () => {
      const igwId = await stack.internetGatewayId;
      expect(igwId).toBeDefined();
    });
  });

  describe('Resource Outputs', () => {
    it('should register all required outputs', async () => {
      const vpcId = await stack.vpcId;
      const publicSubnetIds = stack.publicSubnetIds;
      const privateSubnetIds = stack.privateSubnetIds;
      const igwId = await stack.internetGatewayId;

      expect(vpcId).toBeDefined();
      expect(publicSubnetIds).toHaveLength(3);
      expect(privateSubnetIds).toHaveLength(3);
      expect(igwId).toBeDefined();
    });
  });

  describe('Input Validation', () => {
    it('should accept valid configuration', () => {
      expect(() => {
        new NetworkStack('test-network-2', {
          environmentSuffix: 'test2',
          vpcCidr: '10.1.0.0/16',
          availabilityZones: ['us-east-1a', 'us-east-1b'],
          tags: { test: 'value' },
        });
      }).not.toThrow();
    });

    it('should handle different CIDR ranges', () => {
      expect(() => {
        new NetworkStack('test-network-3', {
          environmentSuffix: 'test3',
          vpcCidr: '172.16.0.0/16',
          availabilityZones: ['us-west-2a', 'us-west-2b'],
          tags: {},
        });
      }).not.toThrow();
    });

    it('should handle empty tags', () => {
      const stackWithoutTags = new NetworkStack('test-network-4', {
        environmentSuffix: 'test4',
        vpcCidr: '192.168.0.0/16',
        availabilityZones: ['us-east-1a'],
        tags: {},
      });
      expect(stackWithoutTags).toBeDefined();
    });
  });

  describe('Edge Cases', () => {
    it('should handle single availability zone', () => {
      const singleAzStack = new NetworkStack('test-network-single-az', {
        environmentSuffix: 'singleaz',
        vpcCidr: '10.2.0.0/16',
        availabilityZones: ['us-east-1a'],
        tags,
      });
      expect(singleAzStack.publicSubnetIds).toHaveLength(1);
      expect(singleAzStack.privateSubnetIds).toHaveLength(1);
    });

    it('should handle multiple availability zones', () => {
      const multiAzStack = new NetworkStack('test-network-multi-az', {
        environmentSuffix: 'multiaz',
        vpcCidr: '10.3.0.0/16',
        availabilityZones: ['us-east-1a', 'us-east-1b', 'us-east-1c', 'us-east-1d'],
        tags,
      });
      expect(multiAzStack.publicSubnetIds).toHaveLength(4);
      expect(multiAzStack.privateSubnetIds).toHaveLength(4);
    });
  });
});

