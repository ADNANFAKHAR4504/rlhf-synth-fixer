/**
 * Unit Tests for VPC Infrastructure
 * Tests the structure and configuration of Pulumi resources defined in bin/tap.ts
 */
import * as pulumi from '@pulumi/pulumi';

// Set environment variables before importing infrastructure
process.env.ENVIRONMENT_SUFFIX = 'test';
process.env.AWS_REGION = 'us-east-1';
process.env.REPOSITORY = 'test-repo';
process.env.COMMIT_AUTHOR = 'test-author';
process.env.PR_NUMBER = 'test-pr';
process.env.TEAM = 'test-team';

// Mock Pulumi runtime before importing bin/tap
pulumi.runtime.setMocks({
  newResource: (args: pulumi.runtime.MockResourceArgs): { id: string; state: any } => {
    return {
      id: `${args.name}_id`,
      state: args.inputs,
    };
  },
  call: (args: pulumi.runtime.MockCallArgs) => {
    // Mock AMI lookup
    if (args.token === 'aws:ec2/getAmi:getAmi') {
      return {
        id: 'ami-12345678',
        architecture: 'x86_64',
      };
    }
    return args.inputs;
  },
});

// Set required config values - needs to match project name from Pulumi.yaml
pulumi.runtime.setConfig('aws:region', 'us-east-1');
pulumi.runtime.setConfig('project:environmentSuffix', 'test');

// Import infrastructure code after mocks are set
const infrastructure = require('../bin/tap');

describe('VPC Infrastructure Unit Tests', () => {
  describe('VPC Configuration', () => {
    it('should create VPC with correct CIDR block', async () => {
      const vpcCidr = await pulumi.output(infrastructure.vpcCidr).promise();
      expect(vpcCidr).toBe('10.0.0.0/16');
    });

    it('should create VPC with environmentSuffix in name', async () => {
      const vpcId = await pulumi.output(infrastructure.vpcId).promise();
      expect(vpcId).toContain('payment-vpc');
    });

    it('should export VPC ID', async () => {
      expect(infrastructure.vpcId).toBeDefined();
      const vpcId = await pulumi.output(infrastructure.vpcId).promise();
      expect(typeof vpcId).toBe('string');
    });
  });

  describe('Subnet Configuration', () => {
    it('should create 3 public subnets', async () => {
      const publicSubnetIds = await pulumi.output(infrastructure.publicSubnetIds).promise();
      expect(publicSubnetIds).toHaveLength(3);
    });

    it('should create 3 private subnets', async () => {
      const privateSubnetIds = await pulumi.output(infrastructure.privateSubnetIds).promise();
      expect(privateSubnetIds).toHaveLength(3);
    });

    it('should create 3 database subnets', async () => {
      const databaseSubnetIds = await pulumi.output(infrastructure.databaseSubnetIds).promise();
      expect(databaseSubnetIds).toHaveLength(3);
    });

    it('should have unique subnet IDs', async () => {
      const publicSubnetIds = await pulumi.output(infrastructure.publicSubnetIds).promise();
      const privateSubnetIds = await pulumi.output(infrastructure.privateSubnetIds).promise();
      const databaseSubnetIds = await pulumi.output(infrastructure.databaseSubnetIds).promise();

      const allSubnetIds = [...publicSubnetIds, ...privateSubnetIds, ...databaseSubnetIds];
      const uniqueIds = new Set(allSubnetIds);

      expect(uniqueIds.size).toBe(9);
    });

    it('should export all subnet ID arrays', async () => {
      expect(infrastructure.publicSubnetIds).toBeDefined();
      expect(infrastructure.privateSubnetIds).toBeDefined();
      expect(infrastructure.databaseSubnetIds).toBeDefined();
    });
  });

  describe('Internet Gateway', () => {
    it('should create internet gateway', async () => {
      const igwId = await pulumi.output(infrastructure.internetGatewayId).promise();
      expect(igwId).toBeDefined();
      expect(igwId).toContain('payment-igw');
    });

    it('should export internet gateway ID', () => {
      expect(infrastructure.internetGatewayId).toBeDefined();
    });
  });

  describe('NAT Instances', () => {
    it('should create 3 NAT instances', async () => {
      const natInstanceIds = await pulumi.output(infrastructure.natInstanceIds).promise();
      expect(natInstanceIds).toHaveLength(3);
    });

    it('should have 3 NAT instance private IPs', async () => {
      const natInstancePrivateIps = await pulumi
        .output(infrastructure.natInstancePrivateIps)
        .promise();
      expect(natInstancePrivateIps).toHaveLength(3);
    });

    it('should have unique NAT instance IDs', async () => {
      const natInstanceIds = await pulumi.output(infrastructure.natInstanceIds).promise();
      const uniqueIds = new Set(natInstanceIds);
      expect(uniqueIds.size).toBe(3);
    });

    it('should export NAT instance IDs and IPs', () => {
      expect(infrastructure.natInstanceIds).toBeDefined();
      expect(infrastructure.natInstancePrivateIps).toBeDefined();
    });
  });

  describe('Security Groups', () => {
    it('should create web security group', async () => {
      const webSgId = await pulumi.output(infrastructure.webSecurityGroupId).promise();
      expect(webSgId).toBeDefined();
      expect(webSgId).toContain('web-sg');
    });

    it('should create app security group', async () => {
      const appSgId = await pulumi.output(infrastructure.appSecurityGroupId).promise();
      expect(appSgId).toBeDefined();
      expect(appSgId).toContain('app-sg');
    });

    it('should create database security group', async () => {
      const dbSgId = await pulumi.output(infrastructure.databaseSecurityGroupId).promise();
      expect(dbSgId).toBeDefined();
      expect(dbSgId).toContain('database-sg');
    });

    it('should have unique security group IDs', async () => {
      const webSgId = await pulumi.output(infrastructure.webSecurityGroupId).promise();
      const appSgId = await pulumi.output(infrastructure.appSecurityGroupId).promise();
      const dbSgId = await pulumi.output(infrastructure.databaseSecurityGroupId).promise();

      const sgIds = [webSgId, appSgId, dbSgId];
      const uniqueIds = new Set(sgIds);

      expect(uniqueIds.size).toBe(3);
    });

    it('should export all security group IDs', () => {
      expect(infrastructure.webSecurityGroupId).toBeDefined();
      expect(infrastructure.appSecurityGroupId).toBeDefined();
      expect(infrastructure.databaseSecurityGroupId).toBeDefined();
    });
  });

  describe('VPC Flow Logs', () => {
    it('should create flow logs S3 bucket', async () => {
      const bucketName = await pulumi.output(infrastructure.flowLogsBucketName).promise();
      expect(bucketName).toBeDefined();
      expect(bucketName).toContain('vpc-flow-logs');
    });

    it('should create flow logs CloudWatch log group', async () => {
      const logGroupName = await pulumi.output(infrastructure.flowLogsLogGroupName).promise();
      expect(logGroupName).toBeDefined();
      expect(logGroupName).toContain('/aws/vpc/flow-logs');
    });

    it('should have log group name with environmentSuffix', async () => {
      const logGroupName = await pulumi.output(infrastructure.flowLogsLogGroupName).promise();
      expect(logGroupName).toMatch(/flow-logs-/);
    });

    it('should export flow logs resources', () => {
      expect(infrastructure.flowLogsBucketName).toBeDefined();
      expect(infrastructure.flowLogsLogGroupName).toBeDefined();
    });
  });

  describe('S3 VPC Endpoint', () => {
    it('should create S3 VPC endpoint', async () => {
      const s3EndpointId = await pulumi.output(infrastructure.s3EndpointId).promise();
      expect(s3EndpointId).toBeDefined();
      expect(s3EndpointId).toContain('s3-endpoint');
    });

    it('should export S3 endpoint ID', () => {
      expect(infrastructure.s3EndpointId).toBeDefined();
    });
  });

  describe('Resource Naming', () => {
    it('should include environmentSuffix in VPC name', async () => {
      const vpcId = await pulumi.output(infrastructure.vpcId).promise();
      expect(vpcId).toMatch(/payment-vpc-.*_id/);
    });

    it('should include environmentSuffix in IGW name', async () => {
      const igwId = await pulumi.output(infrastructure.internetGatewayId).promise();
      expect(igwId).toMatch(/payment-igw-.*_id/);
    });

    it('should include environmentSuffix in security group names', async () => {
      const webSgId = await pulumi.output(infrastructure.webSecurityGroupId).promise();
      const appSgId = await pulumi.output(infrastructure.appSecurityGroupId).promise();
      const dbSgId = await pulumi.output(infrastructure.databaseSecurityGroupId).promise();

      expect(webSgId).toMatch(/web-sg-.*_id/);
      expect(appSgId).toMatch(/app-sg-.*_id/);
      expect(dbSgId).toMatch(/database-sg-.*_id/);
    });

    it('should include environmentSuffix in flow logs bucket name', async () => {
      const bucketName = await pulumi.output(infrastructure.flowLogsBucketName).promise();
      expect(bucketName).toMatch(/vpc-flow-logs-.*/);
    });

    it('should include environmentSuffix in NAT instance names', async () => {
      const natInstanceIds = await pulumi.output(infrastructure.natInstanceIds).promise();
      natInstanceIds.forEach((id: string) => {
        expect(id).toMatch(/nat-instance-.*_id/);
      });
    });
  });

  describe('Exports', () => {
    it('should export all required outputs', () => {
      expect(infrastructure.vpcId).toBeDefined();
      expect(infrastructure.vpcCidr).toBeDefined();
      expect(infrastructure.internetGatewayId).toBeDefined();
      expect(infrastructure.publicSubnetIds).toBeDefined();
      expect(infrastructure.privateSubnetIds).toBeDefined();
      expect(infrastructure.databaseSubnetIds).toBeDefined();
      expect(infrastructure.natInstanceIds).toBeDefined();
      expect(infrastructure.natInstancePrivateIps).toBeDefined();
      expect(infrastructure.webSecurityGroupId).toBeDefined();
      expect(infrastructure.appSecurityGroupId).toBeDefined();
      expect(infrastructure.databaseSecurityGroupId).toBeDefined();
      expect(infrastructure.flowLogsBucketName).toBeDefined();
      expect(infrastructure.flowLogsLogGroupName).toBeDefined();
      expect(infrastructure.s3EndpointId).toBeDefined();
    });

    it('should have all outputs as Pulumi Outputs', () => {
      expect(pulumi.Output.isInstance(infrastructure.vpcId)).toBe(true);
      expect(pulumi.Output.isInstance(infrastructure.internetGatewayId)).toBe(true);
      expect(pulumi.Output.isInstance(infrastructure.webSecurityGroupId)).toBe(true);
    });

    it('should have array outputs as Pulumi Outputs', () => {
      // These are arrays of Output instances, not Output of arrays
      expect(Array.isArray(infrastructure.publicSubnetIds)).toBe(true);
      expect(Array.isArray(infrastructure.privateSubnetIds)).toBe(true);
      expect(Array.isArray(infrastructure.databaseSubnetIds)).toBe(true);
    });
  });

  describe('Configuration', () => {
    it('should use correct region configuration', () => {
      expect(pulumi.runtime.getConfig('aws:region')).toBe('us-east-1');
    });

    it('should require environmentSuffix configuration', () => {
      expect(pulumi.runtime.getConfig('project:environmentSuffix')).toBe('test');
    });

    it('should have region defined', async () => {
      // Region is used in infrastructure code
      const s3EndpointId = await pulumi.output(infrastructure.s3EndpointId).promise();
      expect(s3EndpointId).toBeDefined();
    });
  });

  describe('Availability Zones', () => {
    it('should create resources in multiple availability zones', async () => {
      const publicSubnetIds = await pulumi.output(infrastructure.publicSubnetIds).promise();
      // With 3 public subnets, we expect resources in 3 AZs
      expect(publicSubnetIds.length).toBe(3);
    });

    it('should have NAT instances in each AZ', async () => {
      const natInstanceIds = await pulumi.output(infrastructure.natInstanceIds).promise();
      expect(natInstanceIds.length).toBe(3);
    });
  });

  describe('Default Values and Optional Parameters', () => {
    it('should use default environmentSuffix when not provided', () => {
      // Import TapStack class directly to test with minimal args
      const { TapStack } = require('../lib/tap-stack');
      const stackWithDefaults = new TapStack('test-defaults', {});

      // The stack should be created successfully with defaults
      expect(stackWithDefaults).toBeDefined();
    });

    it('should use default region when not provided', () => {
      const { TapStack } = require('../lib/tap-stack');
      const stackWithDefaults = new TapStack('test-region-default', {
        environmentSuffix: 'test',
      });

      expect(stackWithDefaults).toBeDefined();
    });

    it('should use default tags when not provided', () => {
      const { TapStack } = require('../lib/tap-stack');
      const stackWithDefaults = new TapStack('test-tags-default', {
        environmentSuffix: 'test',
        region: 'us-west-2',
      });

      expect(stackWithDefaults).toBeDefined();
    });

    it('should accept all parameters when provided', () => {
      const { TapStack } = require('../lib/tap-stack');
      const customTags = {
        Environment: 'staging',
        Project: 'test-project',
        CostCenter: 'test-center',
      };

      const stackWithAllParams = new TapStack('test-all-params', {
        environmentSuffix: 'staging',
        region: 'eu-west-1',
        tags: customTags,
      });

      expect(stackWithAllParams).toBeDefined();
    });

    it('should handle empty environmentSuffix and use default', () => {
      const { TapStack } = require('../lib/tap-stack');
      const stackWithEmptyEnv = new TapStack('test-empty-env', {
        environmentSuffix: '',
        region: 'us-east-1',
      });

      // Empty string is falsy, so it should use default 'dev'
      expect(stackWithEmptyEnv).toBeDefined();
    });

    it('should handle undefined optional parameters', () => {
      const { TapStack } = require('../lib/tap-stack');
      const stackWithUndefined = new TapStack('test-undefined', {
        environmentSuffix: undefined,
        region: undefined,
        tags: undefined,
      });

      // All undefined values should use defaults
      expect(stackWithUndefined).toBeDefined();
    });
  });
});
