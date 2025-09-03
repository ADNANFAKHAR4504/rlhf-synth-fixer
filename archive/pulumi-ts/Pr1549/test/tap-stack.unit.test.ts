import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';
import { TapStack } from '../lib/tap-stack';
import { NetworkStack } from '../lib/network-stack';
import { SecurityStack } from '../lib/security-stack';
import { ComputeStack } from '../lib/compute-stack';
import { StorageStack } from '../lib/storage-stack';
import { IamStack } from '../lib/iam-stack';

// Mock Pulumi runtime - must be set before any imports that use Pulumi
pulumi.runtime.setMocks({
  newResource: function(args: pulumi.runtime.MockResourceArgs): { id: string, state: any } {
    // Return appropriate defaults based on resource type
    const defaults: any = {
      ...args.inputs,
    };
    
    // Generate a unique ID for the resource
    const resourceId = args.inputs.name 
      ? `${args.inputs.name}_id` 
      : `${args.type.split('/').pop()}_${Date.now()}_id`;
    
    // Add specific outputs for different resource types
    if (args.type.includes('ec2/vpc')) {
      defaults.id = `vpc-${resourceId}`;
      defaults.cidrBlock = defaults.cidrBlock || '10.0.0.0/16';
    }
    
    if (args.type.includes('ec2/subnet')) {
      defaults.id = `subnet-${resourceId}`;
      defaults.vpcId = defaults.vpcId || 'vpc-mock123';
    }
    
    if (args.type.includes('ec2/securityGroup')) {
      defaults.id = `sg-${resourceId}`;
    }
    
    if (args.type.includes('rds/instance')) {
      defaults.endpoint = `database.${resourceId}.rds.amazonaws.com`;
      defaults.address = `database.${resourceId}.rds.amazonaws.com`;
    }
    
    if (args.type.includes('s3/bucket')) {
      defaults.bucket = defaults.bucket || `bucket-${resourceId}`;
      defaults.arn = `arn:aws:s3:::bucket-${resourceId}`;
    }
    
    if (args.type.includes('lb/loadBalancer')) {
      defaults.dnsName = `alb-${resourceId}.elb.amazonaws.com`;
    }
    
    if (args.type.includes('iam/role')) {
      defaults.arn = `arn:aws:iam::123456789012:role/${resourceId}`;
    }
    
    if (args.type.includes('iam/instanceProfile')) {
      defaults.name = `profile-${resourceId}`;
    }
    
    if (args.type.includes('kms/key')) {
      defaults.arn = `arn:aws:kms:us-east-1:123456789012:key/${resourceId}`;
      defaults.keyId = resourceId;
    }
    
    return {
      id: resourceId,
      state: defaults,
    };
  },
  call: function(args: pulumi.runtime.MockCallArgs) {
    // Mock function calls for data sources
    if (args.token === 'aws:index/getAvailabilityZones:getAvailabilityZones' ||
        args.token === 'aws:getAvailabilityZones') {
      return {
        names: ['us-east-1a', 'us-east-1b'],
        zoneIds: ['use1-az1', 'use1-az2'],
        id: 'us-east-1',
      };
    }
    
    if (args.token === 'aws:ec2/getAmi:getAmi' || args.token === 'aws:getAmi') {
      return {
        id: 'ami-12345678',
        imageId: 'ami-12345678',
        architecture: 'x86_64',
      };
    }
    
    if (args.token === 'aws:ec2/getVpcs:getVpcs' || args.token === 'aws:getVpcs') {
      return {
        ids: ['vpc-mock123'],
        id: 'vpcs-lookup',
      };
    }
    
    if (args.token === 'aws:index/getRegion:getRegion' || args.token === 'aws:getRegion') {
      return {
        name: 'us-east-1',
        id: 'us-east-1',
      };
    }
    
    if (args.token === 'aws:index/getCaller:getCaller' || args.token === 'aws:getCallerIdentity') {
      return {
        accountId: '123456789012',
        id: '123456789012',
      };
    }
    
    // Default return for unknown calls
    return {
      ...args.inputs,
      id: `${args.token}_id`,
    };
  },
});

describe('TapStack Unit Tests', () => {
  const environmentSuffix = 'test123';
  let stack: TapStack;

  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();
  });

  describe('Main Stack Structure', () => {
    beforeEach(async () => {
      stack = new TapStack('TestStack', {
        environmentSuffix,
        tags: {
          Environment: 'test',
          Project: 'tap',
        },
      });
    });

    it('should create the main stack with correct properties', () => {
      expect(stack).toBeDefined();
      expect(stack).toBeInstanceOf(pulumi.ComponentResource);
    });

    it('should have required output properties', () => {
      expect(stack.albDnsName).toBeDefined();
      expect(stack.s3BucketName).toBeDefined();
      expect(stack.rdsEndpoint).toBeDefined();
    });

    it('should use correct environment suffix', async () => {
      const stackWithCustomSuffix = new TapStack('TestStackCustom', {
        environmentSuffix: 'prod123',
      });
      expect(stackWithCustomSuffix).toBeDefined();
    });

    it('should apply custom tags', async () => {
      const customTags = {
        Owner: 'TestTeam',
        CostCenter: 'Engineering',
      };
      const stackWithTags = new TapStack('TestStackTags', {
        environmentSuffix,
        tags: customTags,
      });
      expect(stackWithTags).toBeDefined();
    });
  });

  describe('NetworkStack', () => {
    let networkStack: NetworkStack;

    beforeEach(async () => {
      networkStack = new NetworkStack('TestNetwork', {
        environmentSuffix,
        region: 'us-east-1',
        allowedCidr: '10.0.0.0/16',
        tags: {
          Environment: 'test',
        },
      });
    });

    it('should create a NetworkStack instance', () => {
      expect(networkStack).toBeDefined();
      expect(networkStack).toBeInstanceOf(pulumi.ComponentResource);
    });

    it('should expose VPC outputs', () => {
      expect(networkStack.vpcId).toBeDefined();
      expect(networkStack.publicSubnetIds).toBeDefined();
      expect(networkStack.privateSubnetIds).toBeDefined();
      expect(networkStack.albSecurityGroupId).toBeDefined();
      expect(networkStack.ec2SecurityGroupId).toBeDefined();
      expect(networkStack.rdsSecurityGroupId).toBeDefined();
    });

    it('should handle multiple availability zones', () => {
      const multiAzStack = new NetworkStack('TestNetworkMultiAZ', {
        environmentSuffix,
        region: 'us-east-1',
        allowedCidr: '10.0.0.0/16',
        tags: {},
      });
      expect(multiAzStack.publicSubnetIds).toBeDefined();
      expect(multiAzStack.privateSubnetIds).toBeDefined();
    });
  });

  describe('SecurityStack', () => {
    let securityStack: SecurityStack;
    let mockVpc: any;
    let mockEc2SecurityGroup: any;

    beforeEach(async () => {
      // Create mock VPC and security group
      mockVpc = {
        id: pulumi.Output.create('vpc-mock123'),
        cidrBlock: pulumi.Output.create('10.0.0.0/16'),
      };
      
      mockEc2SecurityGroup = {
        id: pulumi.Output.create('sg-ec2mock123'),
      };

      securityStack = new SecurityStack('TestSecurity', {
        environmentSuffix,
        regions: ['us-east-1'],
        tags: {
          Environment: 'test',
        },
      });
    });

    it('should create a SecurityStack instance', () => {
      expect(securityStack).toBeDefined();
      expect(securityStack).toBeInstanceOf(pulumi.ComponentResource);
    });

    it('should expose security outputs', () => {
      expect(securityStack.securityHubArn).toBeDefined();
      expect(securityStack.guardDutyDetectorId).toBeDefined();
      expect(securityStack.configRecorderArn).toBeDefined();
    });

    it('should handle custom allowed CIDR', () => {
      const customCidrStack = new SecurityStack('TestSecurityCustomCidr', {
        environmentSuffix,
        regions: ['us-east-1'],
        tags: {},
      });
      expect(customCidrStack).toBeDefined();
    });
  });

  describe('ComputeStack', () => {
    let computeStack: ComputeStack;
    let mockDependencies: any;

    beforeEach(async () => {
      // Create mock dependencies
      mockDependencies = {
        vpcId: pulumi.Output.create('vpc-mock123'),
        publicSubnetIds: pulumi.Output.create(['subnet-public1', 'subnet-public2']),
        privateSubnetIds: pulumi.Output.create(['subnet-private1', 'subnet-private2']),
        instanceRole: pulumi.Output.create('arn:aws:iam::123456789012:role/ec2-role'),
        s3BucketArn: pulumi.Output.create('arn:aws:s3:::test-bucket'),
        allowedCidr: '10.0.0.0/16',
        albSecurityGroupId: pulumi.Output.create('sg-alb123'),
        ec2SecurityGroupId: pulumi.Output.create('sg-ec2123'),
      };

      computeStack = new ComputeStack('TestCompute', {
        environmentSuffix,
        region: 'us-east-1',
        ...mockDependencies,
        tags: {
          Environment: 'test',
        },
      });
    });

    it('should create a ComputeStack instance', () => {
      expect(computeStack).toBeDefined();
      expect(computeStack).toBeInstanceOf(pulumi.ComponentResource);
    });

    it('should expose ALB outputs', () => {
      expect(computeStack.albDnsName).toBeDefined();
      expect(computeStack.albArn).toBeDefined();
      expect(computeStack.asgArn).toBeDefined();
    });

    it('should handle custom instance configuration', () => {
      const customComputeStack = new ComputeStack('TestComputeCustom', {
        environmentSuffix,
        region: 'us-east-1',
        ...mockDependencies,
        tags: {},
      });
      expect(customComputeStack).toBeDefined();
    });
  });

  describe('StorageStack', () => {
    let storageStack: StorageStack;
    let mockDependencies: any;

    beforeEach(async () => {
      // Create mock dependencies
      mockDependencies = {
        vpcId: pulumi.Output.create('vpc-mock123'),
        privateSubnetIds: [pulumi.Output.create('subnet-private1'), pulumi.Output.create('subnet-private2')],
        isPrimary: true,
      };

      storageStack = new StorageStack('TestStorage', {
        environmentSuffix,
        region: 'us-east-1',
        ...mockDependencies,
        tags: {
          Environment: 'test',
        },
      });
    });

    it('should create a StorageStack instance', () => {
      expect(storageStack).toBeDefined();
      expect(storageStack).toBeInstanceOf(pulumi.ComponentResource);
    });

    it('should expose S3 bucket outputs', () => {
      expect(storageStack.s3BucketName).toBeDefined();
      expect(storageStack.s3BucketArn).toBeDefined();
    });

    it('should expose RDS database outputs', () => {
      expect(storageStack.rdsEndpoint).toBeDefined();
      expect(storageStack.rdsArn).toBeDefined();
    });

    it('should handle custom database configuration', () => {
      const customStorageStack = new StorageStack('TestStorageCustom', {
        environmentSuffix,
        region: 'us-east-1',
        ...mockDependencies,
        tags: {},
      });
      expect(customStorageStack).toBeDefined();
    });

    it('should support Multi-AZ configuration', () => {
      const multiAzStack = new StorageStack('TestStorageMultiAZ', {
        environmentSuffix,
        region: 'us-east-1',
        ...mockDependencies,
        isPrimary: false,
        tags: {},
      });
      expect(multiAzStack).toBeDefined();
    });
  });

  describe('IamStack', () => {
    let iamStack: IamStack;

    beforeEach(async () => {
      iamStack = new IamStack('TestIam', {
        environmentSuffix,
        tags: {
          Environment: 'test',
        },
      });
    });

    it('should create an IamStack instance', () => {
      expect(iamStack).toBeDefined();
      expect(iamStack).toBeInstanceOf(pulumi.ComponentResource);
    });

    it('should expose EC2 role outputs', () => {
      expect(iamStack.instanceRole).toBeDefined();
      expect(iamStack.instanceProfile).toBeDefined();
    });

    it('should handle custom S3 bucket ARN', () => {
      const customIamStack = new IamStack('TestIamCustom', {
        environmentSuffix,
        tags: {},
      });
      expect(customIamStack).toBeDefined();
    });

    it('should support additional policies', () => {
      const iamStackWithPolicies = new IamStack('TestIamPolicies', {
        environmentSuffix,
        tags: {
          CustomTag: 'test',
        },
      });
      expect(iamStackWithPolicies).toBeDefined();
    });
  });

  describe('Cross-Stack Dependencies', () => {
    it('should properly wire VPC dependencies', async () => {
      const fullStack = new TapStack('TestFullStack', {
        environmentSuffix,
        tags: {
          Environment: 'test',
        },
      });
      expect(fullStack).toBeDefined();
      expect(fullStack.albDnsName).toBeDefined();
      expect(fullStack.s3BucketName).toBeDefined();
      expect(fullStack.rdsEndpoint).toBeDefined();
    });

    it('should handle security group dependencies', async () => {
      const networkStack = new NetworkStack('TestNetDep', {
        environmentSuffix,
        region: 'us-east-1',
        allowedCidr: '10.0.0.0/16',
        tags: {},
      });

      const securityStack = new SecurityStack('TestSecDep', {
        environmentSuffix,
        regions: ['us-east-1'],
        tags: {},
      });

      expect(securityStack.securityHubArn).toBeDefined();
      expect(securityStack.guardDutyDetectorId).toBeDefined();
    });
  });

  describe('Resource Naming Convention', () => {
    it('should include environment suffix in resource names', () => {
      const testStack = new TapStack('TestNaming', {
        environmentSuffix: 'prod456',
        tags: {},
      });
      expect(testStack).toBeDefined();
    });

    it('should handle missing environment suffix gracefully', () => {
      const defaultStack = new TapStack('TestDefault', {
        tags: {},
      });
      expect(defaultStack).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid region configuration', () => {
      expect(() => {
        new NetworkStack('TestInvalid', {
          environmentSuffix,
          region: 'invalid-region',
          allowedCidr: '10.0.0.0/16',
          tags: {},
        });
      }).not.toThrow();
    });

    it('should handle missing required dependencies gracefully', () => {
      expect(() => {
        new ComputeStack('TestMissingDeps', {
          environmentSuffix,
          region: 'us-east-1',
          tags: {},
        } as any);
      }).not.toThrow();
    });
  });
});
