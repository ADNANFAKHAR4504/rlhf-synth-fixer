import * as pulumi from '@pulumi/pulumi';
import { TapStack } from '../lib/tap-stack';
import { NetworkStack } from '../lib/network-stack';
import { SecurityStack } from '../lib/security-stack';
import { StorageStack } from '../lib/storage-stack';
import { DatabaseStack } from '../lib/database-stack';
import { MonitoringStack } from '../lib/monitoring-stack';
import { ComputeStack } from '../lib/compute-stack';
import { BackupStack } from '../lib/backup-stack';

// Set up Pulumi mocking
pulumi.runtime.setMocks({
  newResource: function (args: pulumi.runtime.MockResourceArgs): {
    id: string;
    state: any;
  } {
    const outputs = args.inputs;
    // Generate a unique ID for the resource
    const id = `${args.name}-id`;

    // Add default outputs for specific resource types
    if (args.type === 'aws:ec2/vpc:Vpc') {
      return { id, state: { ...outputs, cidrBlock: '10.0.0.0/16' } };
    }
    if (args.type === 'aws:ec2/subnet:Subnet') {
      return { id, state: { ...outputs, availabilityZone: 'us-east-1a' } };
    }
    if (args.type === 'aws:kms/key:Key') {
      return { id, state: { ...outputs, keyId: `key-${args.name}`, arn: `arn:aws:kms:us-east-1:123456789012:key/${id}` } };
    }
    if (args.type === 'aws:iam/role:Role') {
      return { id, state: { ...outputs, arn: `arn:aws:iam::123456789012:role/${args.name}` } };
    }
    if (args.type === 'aws:rds/cluster:Cluster') {
      return { id, state: { ...outputs, endpoint: 'payment-cluster.cluster-123.us-east-1.rds.amazonaws.com', arn: `arn:aws:rds:us-east-1:123456789012:cluster:${args.name}` } };
    }
    if (args.type === 'aws:s3/bucket:Bucket') {
      return { id, state: { ...outputs, bucket: args.name } };
    }
    if (args.type === 'aws:cloudwatch/logGroup:LogGroup') {
      return { id, state: { ...outputs, name: `/ecs/payment-app-${outputs.name}` } };
    }
    if (args.type === 'aws:lb/loadBalancer:LoadBalancer') {
      return { id, state: { ...outputs, dnsName: `${args.name}.us-east-1.elb.amazonaws.com` } };
    }

    return { id, state: outputs };
  },
  call: function (args: pulumi.runtime.MockCallArgs) {
    // Mock AWS API calls
    if (args.token === 'aws:index/getAvailabilityZones:getAvailabilityZones') {
      return { names: ['us-east-1a', 'us-east-1b', 'us-east-1c'] };
    }
    if (args.token === 'aws:index/getCallerIdentity:getCallerIdentity') {
      return { accountId: '123456789012', arn: 'arn:aws:iam::123456789012:user/test', userId: 'AIDAI123456789012' };
    }
    return {};
  },
});

describe('TapStack Unit Tests', () => {
  let stack: TapStack;
  const testTags = { Environment: 'test', ManagedBy: 'Jest' };

  beforeEach(() => {
    // Clear any previous mocks
    jest.clearAllMocks();
  });

  describe('TapStack Creation', () => {
    it('should create TapStack with default environmentSuffix', async () => {
      stack = new TapStack('test-stack', {});
      expect(stack).toBeDefined();
      expect(stack.albDnsName).toBeDefined();
      expect(stack.clusterEndpoint).toBeDefined();
      expect(stack.staticBucketName).toBeDefined();
      expect(stack.auditBucketName).toBeDefined();
    });

    it('should create TapStack with custom environmentSuffix', async () => {
      stack = new TapStack('test-stack', {
        environmentSuffix: 'qa',
        tags: testTags,
      });
      expect(stack).toBeDefined();
      expect(stack.albDnsName).toBeDefined();
      expect(stack.clusterEndpoint).toBeDefined();
      expect(stack.staticBucketName).toBeDefined();
      expect(stack.auditBucketName).toBeDefined();
    });

    it('should export all required outputs', async () => {
      stack = new TapStack('test-stack', { environmentSuffix: 'prod', tags: testTags });

      const albDnsName = await pulumi.output(stack.albDnsName).promise();
      const clusterEndpoint = await pulumi.output(stack.clusterEndpoint).promise();
      const staticBucketName = await pulumi.output(stack.staticBucketName).promise();
      const auditBucketName = await pulumi.output(stack.auditBucketName).promise();

      expect(albDnsName).toBeDefined();
      expect(clusterEndpoint).toBeDefined();
      expect(staticBucketName).toBeDefined();
      expect(auditBucketName).toBeDefined();
    });
  });

  describe('NetworkStack Tests', () => {
    it('should create NetworkStack with required outputs', async () => {
      const networkStack = new NetworkStack('test-network', {
        environmentSuffix: 'test',
        tags: testTags,
      });

      expect(networkStack).toBeDefined();
      expect(networkStack.vpcId).toBeDefined();
      expect(networkStack.publicSubnetIds).toBeDefined();
      expect(networkStack.privateSubnetIds).toBeDefined();

      const vpcId = await pulumi.output(networkStack.vpcId).promise();
      const publicSubnetIds = await pulumi.output(networkStack.publicSubnetIds).promise();
      const privateSubnetIds = await pulumi.output(networkStack.privateSubnetIds).promise();

      expect(vpcId).toBeDefined();
      expect(publicSubnetIds).toHaveLength(3);
      expect(privateSubnetIds).toHaveLength(3);
    });
  });

  describe('SecurityStack Tests', () => {
    it('should create SecurityStack with KMS keys and IAM roles', async () => {
      const securityStack = new SecurityStack('test-security', {
        environmentSuffix: 'test',
        tags: testTags,
      });

      expect(securityStack).toBeDefined();
      expect(securityStack.rdsKmsKey).toBeDefined();
      expect(securityStack.s3KmsKey).toBeDefined();
      expect(securityStack.cloudwatchKmsKey).toBeDefined();
      expect(securityStack.ecsTaskRole).toBeDefined();
      expect(securityStack.ecsExecutionRole).toBeDefined();
    });
  });

  describe('StorageStack Tests', () => {
    it('should create StorageStack with S3 buckets', async () => {
      const kmsKeyId = pulumi.output('test-kms-key-id');
      const storageStack = new StorageStack('test-storage', {
        environmentSuffix: 'test',
        tags: testTags,
        kmsKeyId,
      });

      expect(storageStack).toBeDefined();
      expect(storageStack.staticBucketName).toBeDefined();
      expect(storageStack.auditBucketName).toBeDefined();
    });
  });

  describe('DatabaseStack Tests', () => {
    it('should create DatabaseStack with RDS cluster', async () => {
      const vpcId = pulumi.output('test-vpc-id');
      const privateSubnetIds = [
        pulumi.output('subnet-1'),
        pulumi.output('subnet-2'),
        pulumi.output('subnet-3'),
      ];
      const kmsKeyId = pulumi.output('test-kms-key-id');

      const databaseStack = new DatabaseStack('test-database', {
        environmentSuffix: 'test',
        tags: testTags,
        vpcId,
        privateSubnetIds,
        kmsKeyId,
      });

      expect(databaseStack).toBeDefined();
      expect(databaseStack.clusterEndpoint).toBeDefined();
      expect(databaseStack.clusterArn).toBeDefined();
    });
  });

  describe('MonitoringStack Tests', () => {
    it('should create MonitoringStack with CloudWatch log groups', async () => {
      const kmsKeyId = pulumi.output('test-kms-key-id');
      const monitoringStack = new MonitoringStack('test-monitoring', {
        environmentSuffix: 'test',
        tags: testTags,
        kmsKeyId,
      });

      expect(monitoringStack).toBeDefined();
      expect(monitoringStack.ecsLogGroupName).toBeDefined();
    });
  });

  describe('ComputeStack Tests', () => {
    it('should create ComputeStack with ECS and ALB', async () => {
      const securityStack = new SecurityStack('test-security', {
        environmentSuffix: 'test',
        tags: testTags,
      });

      const vpcId = pulumi.output('test-vpc-id');
      const publicSubnetIds = [pulumi.output('pub-subnet-1'), pulumi.output('pub-subnet-2')];
      const privateSubnetIds = [pulumi.output('priv-subnet-1'), pulumi.output('priv-subnet-2')];
      const logGroupName = pulumi.output('/ecs/payment-app-test');
      const databaseEndpoint = pulumi.output('db-endpoint.amazonaws.com');
      const staticBucketName = pulumi.output('payment-static-test');

      const computeStack = new ComputeStack('test-compute', {
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

      expect(computeStack).toBeDefined();
      expect(computeStack.albDnsName).toBeDefined();
    });
  });

  describe('BackupStack Tests', () => {
    it('should create BackupStack with AWS Backup resources', async () => {
      const clusterArn = pulumi.output('arn:aws:rds:us-east-1:123456789012:cluster:test-cluster');
      const backupStack = new BackupStack('test-backup', {
        environmentSuffix: 'test',
        tags: testTags,
        clusterArn,
      });

      expect(backupStack).toBeDefined();
    });
  });

  describe('Integration of All Stacks', () => {
    it('should integrate all stacks properly', async () => {
      stack = new TapStack('integration-test-stack', {
        environmentSuffix: 'integration',
        tags: testTags,
      });

      // Verify all outputs are available
      expect(stack.albDnsName).toBeDefined();
      expect(stack.clusterEndpoint).toBeDefined();
      expect(stack.staticBucketName).toBeDefined();
      expect(stack.auditBucketName).toBeDefined();

      // Wait for outputs to resolve
      const albDns = await pulumi.output(stack.albDnsName).promise();
      const clusterEndpoint = await pulumi.output(stack.clusterEndpoint).promise();
      const staticBucket = await pulumi.output(stack.staticBucketName).promise();
      const auditBucket = await pulumi.output(stack.auditBucketName).promise();

      expect(albDns).toContain('elb.amazonaws.com');
      expect(clusterEndpoint).toContain('rds.amazonaws.com');
      expect(staticBucket).toBeDefined();
      expect(auditBucket).toBeDefined();
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle empty tags', async () => {
      stack = new TapStack('test-stack-no-tags', {
        environmentSuffix: 'test',
      });
      expect(stack).toBeDefined();
    });

    it('should handle different environmentSuffix values', async () => {
      const suffixes = ['dev', 'qa', 'staging', 'prod', 'pr123'];
      for (const suffix of suffixes) {
        const testStack = new TapStack(`test-stack-${suffix}`, {
          environmentSuffix: suffix,
          tags: testTags,
        });
        expect(testStack).toBeDefined();
      }
    });
  });
});
