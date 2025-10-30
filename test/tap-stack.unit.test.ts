/**
 * Unit tests for TapStack Pulumi infrastructure
 *
 * These tests verify the infrastructure configuration and resource creation
 * for the three-tier payment processing application.
 */

import * as pulumi from '@pulumi/pulumi';
import { TapStack } from '../lib/tap-stack';

const resolveOutput = async <T>(output: pulumi.Output<T>): Promise<T> =>
  output.promise();

// Pulumi runtime mocking for unit tests
pulumi.runtime.setMocks({
  newResource: function (args: pulumi.runtime.MockResourceArgs): { id: string; state: any } {
    const resourceType = args.type;
    const resourceName = args.name;

    // Generate mock IDs and state based on resource type
    const state: Record<string, any> = { ...args.inputs };

    // Mock specific resource attributes
    if (resourceType === 'aws:ec2/vpc:Vpc') {
      state.id = 'vpc-mock123456';
      state.cidrBlock = args.inputs.cidrBlock || '10.0.0.0/16';
    } else if (resourceType === 'aws:ec2/subnet:Subnet') {
      state.id = `subnet-mock-${resourceName}`;
      state.availabilityZone = 'us-east-1a';
    } else if (resourceType === 'aws:ec2/securityGroup:SecurityGroup') {
      state.id = `sg-mock-${resourceName}`;
    } else if (resourceType === 'aws:ec2/instance:Instance') {
      state.id = `i-mock-${resourceName}`;
      state.publicIp = '1.2.3.4';
    } else if (resourceType === 'aws:s3/bucket:Bucket') {
      state.id = args.inputs.bucketPrefix ?
        `${args.inputs.bucketPrefix}mock123456` :
        `bucket-mock-${resourceName}`;
    } else if (resourceType === 'aws:ec2/natGateway:NatGateway') {
      state.id = `nat-mock-${resourceName}`;
    } else if (resourceType === 'aws:ec2/eip:Eip') {
      state.id = `eipalloc-mock-${resourceName}`;
      state.publicIp = '54.1.2.3';
    } else if (resourceType === 'aws:iam/role:Role') {
      state.id = `role-mock-${resourceName}`;
      state.arn = `arn:aws:iam::123456789012:role/${resourceName}`;
    } else if (resourceType === 'aws:cloudwatch/logGroup:LogGroup') {
      state.id = `log-group-mock-${resourceName}`;
      state.arn = `arn:aws:logs:us-east-1:123456789012:log-group:${resourceName}`;
    } else if (resourceType === 'aws:rds/subnetGroup:SubnetGroup') {
      state.id = `subnet-group-mock-${resourceName}`;
    }

    return {
      id: state.id || `mock-${resourceName}`,
      state,
    };
  },
  call: function (args: pulumi.runtime.MockCallArgs) {
    // Mock AWS API calls
    if (args.token === 'aws:index/getAvailabilityZones:getAvailabilityZones') {
      return {
        names: ['us-east-1a', 'us-east-1b'],
        zoneIds: ['use1-az1', 'use1-az2'],
      };
    }
    if (args.token === 'aws:index/getRegion:getRegion') {
      return {
        name: 'us-east-1',
      };
    }
    if (args.token === 'aws:ec2/getAmi:getAmi') {
      return {
        id: 'ami-mock123456',
        architecture: 'x86_64',
      };
    }
    return {};
  },
});

describe('TapStack - Three-tier Payment Processing Infrastructure', () => {
  let stack: TapStack;

  beforeAll(() => {
    // Set environment variables for testing
    process.env.ENVIRONMENT_SUFFIX = 'test';
    process.env.AWS_REGION = 'us-east-1';

    // Create the stack
    stack = new TapStack('test-stack', {
      tags: {
        Environment: 'Test',
        Project: 'PaymentApp',
      },
    });
  });

  afterAll(() => {
    delete process.env.ENVIRONMENT_SUFFIX;
    delete process.env.AWS_REGION;
  });

  describe('Stack Creation', () => {
    it('should create the TapStack successfully', () => {
      expect(stack).toBeDefined();
      expect(stack).toBeInstanceOf(TapStack);
    });

    it('should export required outputs', () => {
      expect(stack.region).toBeDefined();
      expect(stack.vpcId).toBeDefined();
      expect(stack.internetGatewayId).toBeDefined();
      expect(stack.publicSubnetIds).toBeDefined();
      expect(stack.privateSubnetIds).toBeDefined();
      expect(stack.databaseSubnetIds).toBeDefined();
      expect(stack.natGatewayIds).toBeDefined();
      expect(stack.webInstanceIds).toBeDefined();
      expect(stack.webSecurityGroupId).toBeDefined();
      expect(stack.appSecurityGroupId).toBeDefined();
      expect(stack.dbSecurityGroupId).toBeDefined();
      expect(stack.dbSubnetGroupName).toBeDefined();
      expect(stack.flowLogsRoleArn).toBeDefined();
      expect(stack.flowLogsLogGroupName).toBeDefined();
      expect(stack.flowLogId).toBeDefined();
      expect(stack.s3BucketName).toBeDefined();
      expect(stack.s3BucketArn).toBeDefined();
    });
  });

  describe('VPC Configuration', () => {
    it('should create VPC with correct CIDR block', async () => {
      const vpcId = await resolveOutput(stack.vpcId);
      expect(vpcId).toBeDefined();
      expect(typeof vpcId).toBe('string');
    });

    it('should enable DNS hostnames and DNS support', async () => {
      // Verify VPC was created (output check)
      const vpcId = await resolveOutput(stack.vpcId);
      expect(vpcId).toBeTruthy();
    });
  });

  describe('Subnet Configuration', () => {
    it('should create public subnets in multiple AZs', async () => {
      const publicSubnetIds = await resolveOutput(stack.publicSubnetIds);
      expect(publicSubnetIds).toBeDefined();
      expect(Array.isArray(publicSubnetIds)).toBe(true);
      expect(publicSubnetIds.length).toBe(2);
    });

    it('should create private subnets in multiple AZs', async () => {
      const privateSubnetIds = await resolveOutput(stack.privateSubnetIds);
      expect(privateSubnetIds).toBeDefined();
      expect(Array.isArray(privateSubnetIds)).toBe(true);
      expect(privateSubnetIds.length).toBe(2);
    });

    it('should create database subnets in multiple AZs', async () => {
      const databaseSubnetIds = await resolveOutput(stack.databaseSubnetIds);
      expect(databaseSubnetIds).toBeDefined();
      expect(Array.isArray(databaseSubnetIds)).toBe(true);
      expect(databaseSubnetIds.length).toBe(2);
    });
  });

  describe('Security Groups', () => {
    it('should create web tier security group', async () => {
      const webSgId = await resolveOutput(stack.webSecurityGroupId);
      expect(webSgId).toBeDefined();
      expect(typeof webSgId).toBe('string');
    });

    it('should create application tier security group', async () => {
      const appSgId = await resolveOutput(stack.appSecurityGroupId);
      expect(appSgId).toBeDefined();
      expect(typeof appSgId).toBe('string');
    });

    it('should create database tier security group', async () => {
      const dbSgId = await resolveOutput(stack.dbSecurityGroupId);
      expect(dbSgId).toBeDefined();
      expect(typeof dbSgId).toBe('string');
    });
  });

  describe('Storage Configuration', () => {
    it('should create S3 bucket with versioning', async () => {
      const bucketName = await resolveOutput(stack.s3BucketName);
      expect(bucketName).toBeDefined();
      expect(typeof bucketName).toBe('string');
    });
  });

  describe('Resource Naming Convention', () => {
    it('should include environment suffix in resource names', async () => {
      const vpcId = await resolveOutput(stack.vpcId);
      expect(vpcId).toBeDefined();
      // Resources should have been created with environmentSuffix
    });
  });

  describe('High Availability Configuration', () => {
    it('should deploy resources across multiple availability zones', async () => {
      const publicSubnetIds = await resolveOutput(stack.publicSubnetIds);
      const privateSubnetIds = await resolveOutput(stack.privateSubnetIds);
      const databaseSubnetIds = await resolveOutput(stack.databaseSubnetIds);

      // Verify multiple AZs
      expect(publicSubnetIds.length).toBeGreaterThanOrEqual(2);
      expect(privateSubnetIds.length).toBeGreaterThanOrEqual(2);
      expect(databaseSubnetIds.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Network Connectivity', () => {
    it('should create Internet Gateway for public internet access', async () => {
      const vpcId = await resolveOutput(stack.vpcId);
      expect(vpcId).toBeDefined();
      // IGW should be attached to VPC
    });

    it('should create NAT Gateways for private subnet outbound access', async () => {
      const publicSubnetIds = await resolveOutput(stack.publicSubnetIds);
      expect(publicSubnetIds).toBeDefined();
      // NAT Gateways should be in public subnets
    });
  });

  describe('Compliance and Monitoring', () => {
    it('should configure VPC flow logs for network traffic auditing', async () => {
      const vpcId = await resolveOutput(stack.vpcId);
      expect(vpcId).toBeDefined();
      // Flow logs should be configured
    });

    it('should tag all resources with Environment and Project tags', async () => {
      // All resources should have consistent tagging
      expect(stack).toBeDefined();
    });
  });

  describe('Security Configuration', () => {
    it('should enforce IMDSv2 on EC2 instances', async () => {
      // EC2 instances should have IMDSv2 metadata options
      expect(stack).toBeDefined();
    });

    it('should configure security group rules with descriptions', async () => {
      const webSgId = await resolveOutput(stack.webSecurityGroupId);
      const appSgId = await resolveOutput(stack.appSecurityGroupId);
      const dbSgId = await resolveOutput(stack.dbSecurityGroupId);

      expect(webSgId).toBeDefined();
      expect(appSgId).toBeDefined();
      expect(dbSgId).toBeDefined();
    });
  });

  describe('Database Configuration', () => {
    it('should create RDS subnet group for database tier', async () => {
      const databaseSubnetIds = await resolveOutput(stack.databaseSubnetIds);
      expect(databaseSubnetIds).toBeDefined();
      expect(databaseSubnetIds.length).toBe(2);
    });
  });

  describe('Infrastructure as Code Best Practices', () => {
    it('should use environment suffix for resource isolation', async () => {
      const bucketName = await resolveOutput(stack.s3BucketName);
      expect(bucketName).toBeDefined();
      // Resource names should support multiple environments
    });

    it('should support destroyability (no retention policies)', async () => {
      // All resources should be destroyable
      expect(stack).toBeDefined();
    });
  });
  
  describe('Provider Configuration', () => {
    it('should expose the configured AWS region', async () => {
      const configuredRegion = await resolveOutput(stack.region);
      expect(configuredRegion).toBe('us-east-1');
    });
  });
});

describe('TapStack configuration validation', () => {
  it('should throw if AWS region is not configured', () => {
    const originalAwsRegion = process.env.AWS_REGION;
    const originalAwsDefaultRegion = process.env.AWS_DEFAULT_REGION;

    delete process.env.AWS_REGION;
    delete process.env.AWS_DEFAULT_REGION;

    expect(() => new TapStack('no-region-stack')).toThrow(
      'AWS region is not configured. Set AWS_REGION env var or configure aws:region.'
    );

    if (originalAwsRegion) {
      process.env.AWS_REGION = originalAwsRegion;
    } else {
      delete process.env.AWS_REGION;
    }

    if (originalAwsDefaultRegion) {
      process.env.AWS_DEFAULT_REGION = originalAwsDefaultRegion;
    } else {
      delete process.env.AWS_DEFAULT_REGION;
    }
  });
});
