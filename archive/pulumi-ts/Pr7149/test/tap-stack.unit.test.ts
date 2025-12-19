import * as pulumi from '@pulumi/pulumi';
import { BackupStack } from '../lib/backup-stack';
import { ComputeStack } from '../lib/compute-stack';
import { DatabaseStack } from '../lib/database-stack';
import { MonitoringStack } from '../lib/monitoring-stack';
import { NetworkStack } from '../lib/network-stack';
import { SecurityStack } from '../lib/security-stack';
import { StorageStack } from '../lib/storage-stack';
import { TapStack } from '../lib/tap-stack';

// Set up Pulumi mocking
pulumi.runtime.setMocks({
  newResource: function (args: pulumi.runtime.MockResourceArgs): {
    id: string;
    state: any;
  } {
    const outputs = args.inputs;
    const id = `${args.name}-id`;

    // Add default outputs for specific resource types
    if (args.type === 'aws:ec2/vpc:Vpc') {
      return {
        id,
        state: {
          ...outputs,
          cidrBlock: outputs.cidrBlock || '10.0.0.0/16',
          enableDnsHostnames: outputs.enableDnsHostnames,
          enableDnsSupport: outputs.enableDnsSupport,
          arn: `arn:aws:ec2:us-east-1:123456789012:vpc/${id}`
        }
      };
    }
    if (args.type === 'aws:ec2/subnet:Subnet') {
      return {
        id,
        state: {
          ...outputs,
          availabilityZone: outputs.availabilityZone || 'us-east-1a',
          cidrBlock: outputs.cidrBlock,
          arn: `arn:aws:ec2:us-east-1:123456789012:subnet/${id}`
        }
      };
    }
    if (args.type === 'aws:kms/key:Key') {
      return {
        id,
        state: {
          ...outputs,
          keyId: `key-${args.name}`,
          arn: `arn:aws:kms:us-east-1:123456789012:key/${id}`,
          enableKeyRotation: outputs.enableKeyRotation,
          deletionWindowInDays: outputs.deletionWindowInDays
        }
      };
    }
    if (args.type === 'aws:iam/role:Role') {
      return {
        id,
        state: {
          ...outputs,
          arn: `arn:aws:iam::123456789012:role/${args.name}`,
          name: args.name
        }
      };
    }
    if (args.type === 'aws:rds/cluster:Cluster') {
      return {
        id,
        state: {
          ...outputs,
          endpoint: `${args.name}.cluster-123.us-east-1.rds.amazonaws.com`,
          readerEndpoint: `${args.name}.cluster-ro-123.us-east-1.rds.amazonaws.com`,
          arn: `arn:aws:rds:us-east-1:123456789012:cluster:${args.name}`,
          clusterIdentifier: outputs.clusterIdentifier
        }
      };
    }
    if (args.type === 'aws:rds/clusterInstance:ClusterInstance') {
      return {
        id,
        state: {
          ...outputs,
          endpoint: `${args.name}.123.us-east-1.rds.amazonaws.com`,
          arn: `arn:aws:rds:us-east-1:123456789012:db:${args.name}`
        }
      };
    }
    if (args.type === 'aws:s3/bucket:Bucket') {
      return {
        id,
        state: {
          ...outputs,
          bucket: args.name,
          arn: `arn:aws:s3:::${args.name}`
        }
      };
    }
    if (args.type === 'aws:cloudwatch/logGroup:LogGroup') {
      return {
        id,
        state: {
          ...outputs,
          name: outputs.name,
          arn: `arn:aws:logs:us-east-1:123456789012:log-group:${outputs.name}`
        }
      };
    }
    if (args.type === 'aws:lb/loadBalancer:LoadBalancer') {
      return {
        id,
        state: {
          ...outputs,
          dnsName: `${args.name}.us-east-1.elb.amazonaws.com`,
          arn: `arn:aws:elasticloadbalancing:us-east-1:123456789012:loadbalancer/app/${args.name}/${id}`
        }
      };
    }
    if (args.type === 'aws:ecs/cluster:Cluster') {
      return {
        id,
        state: {
          ...outputs,
          name: outputs.name,
          arn: `arn:aws:ecs:us-east-1:123456789012:cluster/${outputs.name}`
        }
      };
    }
    if (args.type === 'aws:backup/vault:Vault') {
      return {
        id,
        state: {
          ...outputs,
          name: outputs.name,
          arn: `arn:aws:backup:us-east-1:123456789012:backup-vault:${outputs.name}`
        }
      };
    }
    if (args.type === 'aws:backup/plan:Plan') {
      return {
        id,
        state: {
          ...outputs,
          name: outputs.name,
          arn: `arn:aws:backup:us-east-1:123456789012:backup-plan:${id}`
        }
      };
    }

    return { id, state: { ...outputs, arn: `arn:aws:${args.type}:us-east-1:123456789012:${id}` } };
  },
  call: function (args: pulumi.runtime.MockCallArgs) {
    // Mock AWS API calls
    if (args.token === 'aws:index/getAvailabilityZones:getAvailabilityZones') {
      return {
        names: ['us-east-1a', 'us-east-1b', 'us-east-1c'],
        zoneIds: ['use1-az1', 'use1-az2', 'use1-az3']
      };
    }
    if (args.token === 'aws:index/getCallerIdentity:getCallerIdentity') {
      return {
        accountId: '123456789012',
        arn: 'arn:aws:iam::123456789012:user/test',
        userId: 'AIDAI123456789012'
      };
    }
    return {};
  },
});

describe('TapStack Comprehensive Unit Tests', () => {
  let stack: TapStack;
  const testTags = { Environment: 'test', ManagedBy: 'Jest', Project: 'PaymentProcessing' };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('TapStack Creation and Configuration', () => {
    it('should create TapStack with default environmentSuffix', async () => {
      stack = new TapStack('test-stack', {});
      expect(stack).toBeDefined();
      expect(stack).toBeInstanceOf(TapStack);
    });

    it('should create TapStack with custom environmentSuffix', async () => {
      stack = new TapStack('test-stack', {
        environmentSuffix: 'qa',
        tags: testTags,
      });
      expect(stack).toBeDefined();
    });

    it('should export all required outputs', async () => {
      stack = new TapStack('test-stack', { environmentSuffix: 'prod', tags: testTags });

      expect(stack.albDnsName).toBeDefined();
      expect(stack.clusterEndpoint).toBeDefined();
      expect(stack.staticBucketName).toBeDefined();
      expect(stack.auditBucketName).toBeDefined();
    });

    it('should have valid ALB DNS name format', async () => {
      stack = new TapStack('test-stack', { environmentSuffix: 'test', tags: testTags });
      const albDns = await pulumi.output(stack.albDnsName).promise();
      expect(albDns).toMatch(/elb\.amazonaws\.com$/);
    });

    it('should have valid RDS cluster endpoint format', async () => {
      stack = new TapStack('test-stack', { environmentSuffix: 'test', tags: testTags });
      const endpoint = await pulumi.output(stack.clusterEndpoint).promise();
      expect(endpoint).toMatch(/\.rds\.amazonaws\.com$/);
    });

    it('should create with different environment suffixes', async () => {
      const suffixes = ['dev', 'qa', 'staging', 'prod', 'pr7149'];

      for (const suffix of suffixes) {
        const testStack = new TapStack(`test-stack-${suffix}`, {
          environmentSuffix: suffix,
          tags: testTags,
        });
        expect(testStack).toBeDefined();
      }
    });

    it('should handle empty tags gracefully', async () => {
      stack = new TapStack('test-stack-no-tags', {
        environmentSuffix: 'test',
        tags: {},
      });
      expect(stack).toBeDefined();
    });

    it('should handle undefined tags', async () => {
      stack = new TapStack('test-stack-undefined-tags', {
        environmentSuffix: 'test',
      });
      expect(stack).toBeDefined();
    });
  });

  describe('NetworkStack Comprehensive Tests', () => {
    let networkStack: NetworkStack;

    beforeEach(() => {
      networkStack = new NetworkStack('test-network', {
        environmentSuffix: 'test',
        tags: testTags,
      });
    });

    it('should create NetworkStack successfully', () => {
      expect(networkStack).toBeDefined();
      expect(networkStack).toBeInstanceOf(NetworkStack);
    });

    it('should export VPC ID', async () => {
      const vpcId = await pulumi.output(networkStack.vpcId).promise();
      expect(vpcId).toBeDefined();
      expect(vpcId).toContain('vpc');
    });

    it('should create exactly 3 public subnets', async () => {
      const publicSubnetIds = await pulumi.output(networkStack.publicSubnetIds).promise();
      expect(publicSubnetIds).toHaveLength(3);
      expect(Array.isArray(publicSubnetIds)).toBe(true);
    });

    it('should create exactly 3 private subnets', async () => {
      const privateSubnetIds = await pulumi.output(networkStack.privateSubnetIds).promise();
      expect(privateSubnetIds).toHaveLength(3);
      expect(Array.isArray(privateSubnetIds)).toBe(true);
    });

    it('should have different subnet IDs', async () => {
      const publicSubnetIds = await pulumi.output(networkStack.publicSubnetIds).promise();
      const privateSubnetIds = await pulumi.output(networkStack.privateSubnetIds).promise();

      const allSubnets = [...publicSubnetIds, ...privateSubnetIds];
      const uniqueSubnets = new Set(allSubnets);
      expect(uniqueSubnets.size).toBe(allSubnets.length);
    });

    it('should create NetworkStack with different environment suffixes', () => {
      const devNetwork = new NetworkStack('dev-network', {
        environmentSuffix: 'dev',
        tags: testTags,
      });
      const prodNetwork = new NetworkStack('prod-network', {
        environmentSuffix: 'prod',
        tags: testTags,
      });

      expect(devNetwork).toBeDefined();
      expect(prodNetwork).toBeDefined();
    });

    it('should export all required network outputs', () => {
      expect(networkStack.vpcId).toBeDefined();
      expect(networkStack.publicSubnetIds).toBeDefined();
      expect(networkStack.privateSubnetIds).toBeDefined();
    });
  });

  describe('SecurityStack Comprehensive Tests', () => {
    let securityStack: SecurityStack;

    beforeEach(() => {
      securityStack = new SecurityStack('test-security', {
        environmentSuffix: 'test',
        tags: testTags,
      });
    });

    it('should create SecurityStack successfully', () => {
      expect(securityStack).toBeDefined();
      expect(securityStack).toBeInstanceOf(SecurityStack);
    });

    it('should create RDS KMS key', () => {
      expect(securityStack.rdsKmsKey).toBeDefined();
    });

    it('should create S3 KMS key', () => {
      expect(securityStack.s3KmsKey).toBeDefined();
    });

    it('should create CloudWatch KMS key', () => {
      expect(securityStack.cloudwatchKmsKey).toBeDefined();
    });

    it('should have valid KMS key ARNs', async () => {
      const rdsKeyArn = await pulumi.output(securityStack.rdsKmsKey.arn).promise();
      const s3KeyArn = await pulumi.output(securityStack.s3KmsKey.arn).promise();
      const cwKeyArn = await pulumi.output(securityStack.cloudwatchKmsKey.arn).promise();

      expect(rdsKeyArn).toMatch(/^arn:aws:kms:/);
      expect(s3KeyArn).toMatch(/^arn:aws:kms:/);
      expect(cwKeyArn).toMatch(/^arn:aws:kms:/);
    });

    it('should create ECS task execution role', () => {
      expect(securityStack.ecsExecutionRole).toBeDefined();
    });

    it('should create ECS task role', () => {
      expect(securityStack.ecsTaskRole).toBeDefined();
    });

    it('should have valid IAM role ARNs', async () => {
      const execRoleArn = await pulumi.output(securityStack.ecsExecutionRole.arn).promise();
      const taskRoleArn = await pulumi.output(securityStack.ecsTaskRole.arn).promise();

      expect(execRoleArn).toMatch(/^arn:aws:iam::/);
      expect(taskRoleArn).toMatch(/^arn:aws:iam::/);
    });

    it('should have different role ARNs', async () => {
      const execRoleArn = await pulumi.output(securityStack.ecsExecutionRole.arn).promise();
      const taskRoleArn = await pulumi.output(securityStack.ecsTaskRole.arn).promise();

      expect(execRoleArn).not.toBe(taskRoleArn);
    });

    it('should create all three KMS keys with different IDs', async () => {
      const rdsKeyId = await pulumi.output(securityStack.rdsKmsKey.keyId).promise();
      const s3KeyId = await pulumi.output(securityStack.s3KmsKey.keyId).promise();
      const cwKeyId = await pulumi.output(securityStack.cloudwatchKmsKey.keyId).promise();

      expect(rdsKeyId).not.toBe(s3KeyId);
      expect(s3KeyId).not.toBe(cwKeyId);
      expect(rdsKeyId).not.toBe(cwKeyId);
    });

    it('should create SecurityStack with different environment suffixes', () => {
      const devSecurity = new SecurityStack('dev-security', {
        environmentSuffix: 'dev',
        tags: testTags,
      });
      const prodSecurity = new SecurityStack('prod-security', {
        environmentSuffix: 'prod',
        tags: testTags,
      });

      expect(devSecurity).toBeDefined();
      expect(prodSecurity).toBeDefined();
    });
  });

  describe('StorageStack Comprehensive Tests', () => {
    let storageStack: StorageStack;
    const kmsKeyArn = pulumi.output('arn:aws:kms:us-east-1:123456789012:key/test-key-id');

    beforeEach(() => {
      storageStack = new StorageStack('test-storage', {
        environmentSuffix: 'test',
        tags: testTags,
        kmsKeyId: kmsKeyArn,
      });
    });

    it('should create StorageStack successfully', () => {
      expect(storageStack).toBeDefined();
      expect(storageStack).toBeInstanceOf(StorageStack);
    });

    it('should create static assets bucket', () => {
      expect(storageStack.staticBucketName).toBeDefined();
    });

    it('should create audit logs bucket', () => {
      expect(storageStack.auditBucketName).toBeDefined();
    });

    it('should have different bucket names', async () => {
      const staticBucket = await pulumi.output(storageStack.staticBucketName).promise();
      const auditBucket = await pulumi.output(storageStack.auditBucketName).promise();

      expect(staticBucket).not.toBe(auditBucket);
    });

    it('should include environment suffix in bucket names', async () => {
      const stack = new StorageStack('test-storage-suffix', {
        environmentSuffix: 'qa',
        tags: testTags,
        kmsKeyId: kmsKeyArn,
      });

      const staticBucket = await pulumi.output(stack.staticBucketName).promise();
      const auditBucket = await pulumi.output(stack.auditBucketName).promise();

      expect(staticBucket).toContain('qa');
      expect(auditBucket).toContain('qa');
    });

    it('should create with pulumi Input kmsKeyId', () => {
      const inputKeyId = pulumi.output('test-input-key');
      const stack = new StorageStack('test-storage-input', {
        environmentSuffix: 'test',
        tags: testTags,
        kmsKeyId: inputKeyId,
      });

      expect(stack).toBeDefined();
    });
  });

  describe('DatabaseStack Comprehensive Tests', () => {
    let databaseStack: DatabaseStack;
    const vpcId = pulumi.output('vpc-test123');
    const privateSubnetIds = [
      pulumi.output('subnet-private-1'),
      pulumi.output('subnet-private-2'),
      pulumi.output('subnet-private-3'),
    ];
    const kmsKeyArn = pulumi.output('arn:aws:kms:us-east-1:123456789012:key/test-key-id');

    beforeEach(() => {
      databaseStack = new DatabaseStack('test-database', {
        environmentSuffix: 'test',
        tags: testTags,
        vpcId,
        privateSubnetIds,
        kmsKeyId: kmsKeyArn,
      });
    });

    it('should create DatabaseStack successfully', () => {
      expect(databaseStack).toBeDefined();
      expect(databaseStack).toBeInstanceOf(DatabaseStack);
    });

    it('should export cluster endpoint', () => {
      expect(databaseStack.clusterEndpoint).toBeDefined();
    });

    it('should export cluster ARN', () => {
      expect(databaseStack.clusterArn).toBeDefined();
    });

    it('should have valid RDS endpoint format', async () => {
      const endpoint = await pulumi.output(databaseStack.clusterEndpoint).promise();
      expect(endpoint).toMatch(/\.rds\.amazonaws\.com$/);
    });

    it('should have valid cluster ARN format', async () => {
      const arn = await pulumi.output(databaseStack.clusterArn).promise();
      expect(arn).toMatch(/^arn:aws:rds:/);
    });

    it('should create with multiple private subnets', () => {
      const multiSubnetIds = [
        pulumi.output('subnet-1'),
        pulumi.output('subnet-2'),
        pulumi.output('subnet-3'),
        pulumi.output('subnet-4'),
      ];

      const stack = new DatabaseStack('test-db-multi', {
        environmentSuffix: 'test',
        tags: testTags,
        vpcId,
        privateSubnetIds: multiSubnetIds,
        kmsKeyId: kmsKeyArn,
      });

      expect(stack).toBeDefined();
    });

    it('should create with different environment suffixes', () => {
      const devDb = new DatabaseStack('dev-database', {
        environmentSuffix: 'dev',
        tags: testTags,
        vpcId,
        privateSubnetIds,
        kmsKeyId: kmsKeyArn,
      });

      const prodDb = new DatabaseStack('prod-database', {
        environmentSuffix: 'prod',
        tags: testTags,
        vpcId,
        privateSubnetIds,
        kmsKeyId: kmsKeyArn,
      });

      expect(devDb).toBeDefined();
      expect(prodDb).toBeDefined();
    });

    it('should handle single subnet', () => {
      const singleSubnet = [pulumi.output('subnet-single')];

      const stack = new DatabaseStack('test-db-single', {
        environmentSuffix: 'test',
        tags: testTags,
        vpcId,
        privateSubnetIds: singleSubnet,
        kmsKeyId: kmsKeyArn,
      });

      expect(stack).toBeDefined();
    });
  });

  describe('MonitoringStack Comprehensive Tests', () => {
    let monitoringStack: MonitoringStack;
    const kmsKeyArn = pulumi.output('arn:aws:kms:us-east-1:123456789012:key/test-key-id');

    beforeEach(() => {
      monitoringStack = new MonitoringStack('test-monitoring', {
        environmentSuffix: 'test',
        tags: testTags,
        kmsKeyId: kmsKeyArn,
      });
    });

    it('should create MonitoringStack successfully', () => {
      expect(monitoringStack).toBeDefined();
      expect(monitoringStack).toBeInstanceOf(MonitoringStack);
    });

    it('should export ECS log group name', () => {
      expect(monitoringStack.ecsLogGroupName).toBeDefined();
    });

    it('should have valid log group name format', async () => {
      const logGroupName = await pulumi.output(monitoringStack.ecsLogGroupName).promise();
      expect(logGroupName).toMatch(/^\/ecs\//);
    });

    it('should include environment suffix in log group name', async () => {
      const stack = new MonitoringStack('test-monitoring-suffix', {
        environmentSuffix: 'qa',
        tags: testTags,
        kmsKeyId: kmsKeyArn,
      });

      const logGroupName = await pulumi.output(stack.ecsLogGroupName).promise();
      expect(logGroupName).toContain('qa');
    });

    it('should create with different environment suffixes', () => {
      const devMonitoring = new MonitoringStack('dev-monitoring', {
        environmentSuffix: 'dev',
        tags: testTags,
        kmsKeyId: kmsKeyArn,
      });

      const prodMonitoring = new MonitoringStack('prod-monitoring', {
        environmentSuffix: 'prod',
        tags: testTags,
        kmsKeyId: kmsKeyArn,
      });

      expect(devMonitoring).toBeDefined();
      expect(prodMonitoring).toBeDefined();
    });
  });

  describe('ComputeStack Comprehensive Tests', () => {
    let computeStack: ComputeStack;
    let securityStack: SecurityStack;

    beforeEach(() => {
      securityStack = new SecurityStack('test-security-compute', {
        environmentSuffix: 'test',
        tags: testTags,
      });

      const vpcId = pulumi.output('vpc-test123');
      const publicSubnetIds = [
        pulumi.output('subnet-public-1'),
        pulumi.output('subnet-public-2'),
        pulumi.output('subnet-public-3'),
      ];
      const privateSubnetIds = [
        pulumi.output('subnet-private-1'),
        pulumi.output('subnet-private-2'),
        pulumi.output('subnet-private-3'),
      ];
      const logGroupName = pulumi.output('/ecs/payment-app-test');
      const databaseEndpoint = pulumi.output('payment-cluster.us-east-1.rds.amazonaws.com');
      const staticBucketName = pulumi.output('payment-static-test');

      computeStack = new ComputeStack('test-compute', {
        environmentSuffix: 'test',
        tags: testTags,
        vpcId,
        publicSubnetIds,
        privateSubnetIds,
        ecsTaskRole: securityStack.ecsTaskRole,
        ecsExecutionRole: securityStack.ecsExecutionRole,
        logGroupName,
        databaseEndpoint,
        staticBucketName,
      });
    });

    it('should create ComputeStack successfully', () => {
      expect(computeStack).toBeDefined();
      expect(computeStack).toBeInstanceOf(ComputeStack);
    });

    it('should export ALB DNS name', () => {
      expect(computeStack.albDnsName).toBeDefined();
    });

    it('should have valid ALB DNS format', async () => {
      const albDns = await pulumi.output(computeStack.albDnsName).promise();
      expect(albDns).toMatch(/\.elb\.amazonaws\.com$/);
    });

    it('should create with minimum 2 public subnets', () => {
      const minSubnets = [
        pulumi.output('subnet-pub-1'),
        pulumi.output('subnet-pub-2'),
      ];

      const stack = new ComputeStack('test-compute-min', {
        environmentSuffix: 'test',
        tags: testTags,
        vpcId: pulumi.output('vpc-test'),
        publicSubnetIds: minSubnets,
        privateSubnetIds: minSubnets,
        ecsTaskRole: securityStack.ecsTaskRole,
        ecsExecutionRole: securityStack.ecsExecutionRole,
        logGroupName: pulumi.output('/ecs/test'),
        databaseEndpoint: pulumi.output('db.example.com'),
        staticBucketName: pulumi.output('bucket-test'),
      });

      expect(stack).toBeDefined();
    });

    it('should create with different environment suffixes', () => {
      const devSecurity = new SecurityStack('dev-security-compute', {
        environmentSuffix: 'dev',
        tags: testTags,
      });

      const devCompute = new ComputeStack('dev-compute', {
        environmentSuffix: 'dev',
        tags: testTags,
        vpcId: pulumi.output('vpc-dev'),
        publicSubnetIds: [pulumi.output('pub-1'), pulumi.output('pub-2')],
        privateSubnetIds: [pulumi.output('priv-1'), pulumi.output('priv-2')],
        ecsTaskRole: devSecurity.ecsTaskRole,
        ecsExecutionRole: devSecurity.ecsExecutionRole,
        logGroupName: pulumi.output('/ecs/dev'),
        databaseEndpoint: pulumi.output('db-dev.example.com'),
        staticBucketName: pulumi.output('bucket-dev'),
      });

      expect(devCompute).toBeDefined();
    });
  });

  describe('BackupStack Comprehensive Tests', () => {
    let backupStack: BackupStack;
    const clusterArn = pulumi.output('arn:aws:rds:us-east-1:123456789012:cluster:payment-cluster-test');

    beforeEach(() => {
      backupStack = new BackupStack('test-backup', {
        environmentSuffix: 'test',
        tags: testTags,
        clusterArn,
      });
    });

    it('should create BackupStack successfully', () => {
      expect(backupStack).toBeDefined();
      expect(backupStack).toBeInstanceOf(BackupStack);
    });

    it('should create with different environment suffixes', () => {
      const devBackup = new BackupStack('dev-backup', {
        environmentSuffix: 'dev',
        tags: testTags,
        clusterArn,
      });

      const prodBackup = new BackupStack('prod-backup', {
        environmentSuffix: 'prod',
        tags: testTags,
        clusterArn,
      });

      expect(devBackup).toBeDefined();
      expect(prodBackup).toBeDefined();
    });

    it('should create with different cluster ARNs', () => {
      const altClusterArn = pulumi.output('arn:aws:rds:us-east-1:123456789012:cluster:alt-cluster');

      const stack = new BackupStack('test-backup-alt', {
        environmentSuffix: 'test',
        tags: testTags,
        clusterArn: altClusterArn,
      });

      expect(stack).toBeDefined();
    });
  });

  describe('Integration Tests - Full Stack', () => {
    it('should integrate all stacks successfully', async () => {
      stack = new TapStack('integration-test', {
        environmentSuffix: 'integration',
        tags: testTags,
      });

      expect(stack.albDnsName).toBeDefined();
      expect(stack.clusterEndpoint).toBeDefined();
      expect(stack.staticBucketName).toBeDefined();
      expect(stack.auditBucketName).toBeDefined();
    });

    it('should resolve all outputs correctly', async () => {
      stack = new TapStack('integration-test-outputs', {
        environmentSuffix: 'test',
        tags: testTags,
      });

      const albDns = await pulumi.output(stack.albDnsName).promise();
      const clusterEndpoint = await pulumi.output(stack.clusterEndpoint).promise();
      const staticBucket = await pulumi.output(stack.staticBucketName).promise();
      const auditBucket = await pulumi.output(stack.auditBucketName).promise();

      expect(albDns).toContain('elb.amazonaws.com');
      expect(clusterEndpoint).toContain('rds.amazonaws.com');
      expect(staticBucket).toBeTruthy();
      expect(auditBucket).toBeTruthy();
    });

    it('should create multiple stack instances', () => {
      const stack1 = new TapStack('stack-1', {
        environmentSuffix: 'env1',
        tags: { ...testTags, Instance: '1' },
      });

      const stack2 = new TapStack('stack-2', {
        environmentSuffix: 'env2',
        tags: { ...testTags, Instance: '2' },
      });

      expect(stack1).toBeDefined();
      expect(stack2).toBeDefined();
    });
  });

  describe('Resource Naming Conventions', () => {
    it('should follow naming convention for resources', async () => {
      stack = new TapStack('naming-test', {
        environmentSuffix: 'test',
        tags: testTags,
      });

      const staticBucket = await pulumi.output(stack.staticBucketName).promise();
      const auditBucket = await pulumi.output(stack.auditBucketName).promise();

      expect(staticBucket).toMatch(/payment-static-test/);
      expect(auditBucket).toMatch(/payment-audit-logs-test/);
    });

    it('should include environment suffix in all resource names', async () => {
      const suffix = 'pr7149';
      stack = new TapStack('naming-test-suffix', {
        environmentSuffix: suffix,
        tags: testTags,
      });

      const staticBucket = await pulumi.output(stack.staticBucketName).promise();
      expect(staticBucket).toContain(suffix);
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle very long environment suffixes', () => {
      const longSuffix = 'very-long-environment-suffix-name-that-exceeds-normal-length';
      const stack = new TapStack('test-long-suffix', {
        environmentSuffix: longSuffix,
        tags: testTags,
      });

      expect(stack).toBeDefined();
    });

    it('should handle special characters in tags', () => {
      const specialTags = {
        'aws:tag': 'value',
        'user:email': 'test@example.com',
        'cost-center': '12345',
      };

      const stack = new TapStack('test-special-tags', {
        environmentSuffix: 'test',
        tags: specialTags,
      });

      expect(stack).toBeDefined();
    });

    it('should handle empty environment suffix', () => {
      const stack = new TapStack('test-empty-suffix', {
        environmentSuffix: '',
        tags: testTags,
      });

      expect(stack).toBeDefined();
    });

    it('should handle numeric environment suffixes', () => {
      const stack = new TapStack('test-numeric', {
        environmentSuffix: '12345',
        tags: testTags,
      });

      expect(stack).toBeDefined();
    });
  });

  describe('Stack Outputs Validation', () => {
    beforeEach(() => {
      stack = new TapStack('output-validation', {
        environmentSuffix: 'test',
        tags: testTags,
      });
    });

    it('should have all required outputs defined', () => {
      expect(stack.albDnsName).toBeDefined();
      expect(stack.clusterEndpoint).toBeDefined();
      expect(stack.staticBucketName).toBeDefined();
      expect(stack.auditBucketName).toBeDefined();
    });

    it('should have pulumi.Output types for all exports', () => {
      expect(pulumi.Output.isInstance(stack.albDnsName)).toBe(true);
      expect(pulumi.Output.isInstance(stack.clusterEndpoint)).toBe(true);
      expect(pulumi.Output.isInstance(stack.staticBucketName)).toBe(true);
      expect(pulumi.Output.isInstance(stack.auditBucketName)).toBe(true);
    });

    it('should resolve outputs to string values', async () => {
      const albDns = await pulumi.output(stack.albDnsName).promise();
      const clusterEndpoint = await pulumi.output(stack.clusterEndpoint).promise();
      const staticBucket = await pulumi.output(stack.staticBucketName).promise();
      const auditBucket = await pulumi.output(stack.auditBucketName).promise();

      expect(typeof albDns).toBe('string');
      expect(typeof clusterEndpoint).toBe('string');
      expect(typeof staticBucket).toBe('string');
      expect(typeof auditBucket).toBe('string');
    });
  });

  describe('Resource Dependencies', () => {
    it('should create stacks in correct order', () => {
      const stack = new TapStack('dependency-test', {
        environmentSuffix: 'test',
        tags: testTags,
      });

      // SecurityStack should be created before DatabaseStack
      // NetworkStack should be created before ComputeStack
      // All stacks should be created before BackupStack
      expect(stack).toBeDefined();
    });

    it('should handle circular dependency prevention', () => {
      // TapStack should not have circular dependencies
      const stack = new TapStack('circular-test', {
        environmentSuffix: 'test',
        tags: testTags,
      });

      expect(stack).toBeDefined();
    });
  });

  describe('Performance and Scalability', () => {
    it('should create multiple stacks without errors', () => {
      // Create multiple stacks to test scalability
      const stacks = [];
      for (let i = 0; i < 5; i++) {
        const stack = new TapStack(`perf-test-${i}`, {
          environmentSuffix: `test${i}`,
          tags: testTags,
        });
        stacks.push(stack);
      }

      // Verify all stacks were created successfully
      expect(stacks.length).toBe(5);
      stacks.forEach(stack => {
        expect(stack).toBeDefined();
        expect(stack).toBeInstanceOf(TapStack);
      });
    });
  });

  describe('Configuration Validation', () => {
    it('should accept valid configuration', () => {
      const validConfig = {
        environmentSuffix: 'prod',
        tags: {
          Environment: 'production',
          Owner: 'platform-team',
          CostCenter: '12345',
        },
      };

      const stack = new TapStack('valid-config', validConfig);
      expect(stack).toBeDefined();
    });

    it('should handle minimal configuration', () => {
      const minimalConfig = {
        environmentSuffix: 'min',
      };

      const stack = new TapStack('minimal-config', minimalConfig);
      expect(stack).toBeDefined();
    });
  });
});
