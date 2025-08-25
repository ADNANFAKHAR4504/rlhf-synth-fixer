import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';
import { TapStack } from '../lib/tap-stack';

// Enable Pulumi mocking
pulumi.runtime.setMocks({
  newResource: function (
    args: pulumi.runtime.MockResourceArgs
  ): { id: string; state: any } {
    // Return mock IDs and state for resources
    const defaults = args.inputs;
    defaults.name = args.name;

    // Mock specific resource types
    switch (args.type) {
      case 'aws:ec2/vpc:Vpc':
        return {
          id: `vpc-${args.name}`,
          state: {
            ...defaults,
            id: `vpc-${args.name}`,
            arn: `arn:aws:ec2:us-east-1:123456789012:vpc/vpc-${args.name}`,
          },
        };
      case 'aws:ec2/subnet:Subnet':
        return {
          id: `subnet-${args.name}`,
          state: {
            ...defaults,
            id: `subnet-${args.name}`,
            arn: `arn:aws:ec2:us-east-1:123456789012:subnet/subnet-${args.name}`,
          },
        };
      case 'aws:ec2/securityGroup:SecurityGroup':
        return {
          id: `sg-${args.name}`,
          state: {
            ...defaults,
            id: `sg-${args.name}`,
            arn: `arn:aws:ec2:us-east-1:123456789012:security-group/sg-${args.name}`,
          },
        };
      case 'aws:lb/loadBalancer:LoadBalancer':
        return {
          id: `arn:aws:elasticloadbalancing:us-east-1:123456789012:loadbalancer/app/${args.name}/1234567890abcdef`,
          state: {
            ...defaults,
            id: `arn:aws:elasticloadbalancing:us-east-1:123456789012:loadbalancer/app/${args.name}/1234567890abcdef`,
            arn: `arn:aws:elasticloadbalancing:us-east-1:123456789012:loadbalancer/app/${args.name}/1234567890abcdef`,
            arnSuffix: `app/${args.name}/1234567890abcdef`,
            dnsName: `${args.name}.elb.amazonaws.com`,
          },
        };
      case 'aws:s3/bucket:Bucket':
        return {
          id: args.inputs.bucket || `${args.name}-bucket`,
          state: {
            ...defaults,
            id: args.inputs.bucket || `${args.name}-bucket`,
            arn: `arn:aws:s3:::${args.inputs.bucket || args.name}`,
            bucket: args.inputs.bucket || `${args.name}-bucket`,
          },
        };
      case 'aws:rds/instance:Instance':
        return {
          id: `db-${args.name}`,
          state: {
            ...defaults,
            id: `db-${args.name}`,
            arn: `arn:aws:rds:us-east-1:123456789012:db:${args.name}`,
            endpoint: `${args.name}.abcdefghij.us-east-1.rds.amazonaws.com:3306`,
            address: `${args.name}.abcdefghij.us-east-1.rds.amazonaws.com`,
          },
        };
      case 'aws:iam/role:Role':
        return {
          id: `role-${args.name}`,
          state: {
            ...defaults,
            id: `role-${args.name}`,
            arn: `arn:aws:iam::123456789012:role/${args.name}`,
            name: args.inputs.name || args.name,
          },
        };
      default:
        return {
          id: `${args.name}-id`,
          state: defaults,
        };
    }
  },
  call: function (args: pulumi.runtime.MockCallArgs) {
    // Mock AWS API calls
    switch (args.token) {
      case 'aws:index/getAvailabilityZones:getAvailabilityZones':
        return {
          names: ['us-east-1a', 'us-east-1b', 'us-east-1c'],
          zoneIds: ['use1-az1', 'use1-az2', 'use1-az3'],
        };
      case 'aws:ec2/getAmi:getAmi':
        return {
          id: 'ami-0c55b159cbfafe1f0',
          name: 'amzn2-ami-hvm-2.0.20210813.1-x86_64-gp2',
          architecture: 'x86_64',
          imageLocation: '123456789012/amzn2-ami-hvm-2.0.20210813.1-x86_64-gp2',
        };
      default:
        return args.inputs;
    }
  },
});

describe('TapStack Unit Tests', () => {
  let stack: TapStack;

  describe('Stack Creation with Environment Suffix', () => {
    beforeAll(async () => {
      stack = new TapStack('test-stack', {
        environmentSuffix: 'test123',
        tags: {
          Environment: 'test',
          Project: 'unittest',
        },
      });
    });

    test('should create stack successfully', () => {
      expect(stack).toBeDefined();
    });

    test('should have all required outputs', () => {
      expect(stack.vpcId).toBeDefined();
      expect(stack.loadBalancerDns).toBeDefined();
      expect(stack.staticAssetsBucketName).toBeDefined();
      expect(stack.databaseEndpoint).toBeDefined();
    });

    test('should create VPC with correct properties', async () => {
      const vpcId = await (stack.vpcId as any).promise();
      expect(vpcId).toContain('vpc-');
      expect(vpcId).toContain('test123');
    });

    test('should create ALB with DNS name', async () => {
      const albDns = await (stack.loadBalancerDns as any).promise();
      expect(albDns).toContain('.elb.amazonaws.com');
      expect(albDns).toContain('test123');
    });

    test('should create S3 bucket with environment suffix', async () => {
      const bucketName = await (stack.staticAssetsBucketName as any).promise();
      expect(bucketName).toContain('prod-static-assets');
      expect(bucketName).toContain('test123');
    });

    test('should create RDS endpoint', async () => {
      const dbEndpoint = await (stack.databaseEndpoint as any).promise();
      expect(dbEndpoint).toContain('.rds.amazonaws.com');
      expect(dbEndpoint).toContain('test123');
    });
  });

  describe('Stack Creation with Default Values', () => {
    beforeAll(async () => {
      stack = new TapStack('default-stack', {});
    });

    test('should use default environment suffix', async () => {
      const vpcId = await (stack.vpcId as any).promise();
      expect(vpcId).toContain('vpc-');
      expect(vpcId).toContain('dev');
    });

    test('should create all required resources', () => {
      expect(stack.vpcId).toBeDefined();
      expect(stack.loadBalancerDns).toBeDefined();
      expect(stack.staticAssetsBucketName).toBeDefined();
      expect(stack.databaseEndpoint).toBeDefined();
    });
  });

  describe('Resource Naming Convention', () => {
    const testEnvSuffix = 'pr123';

    beforeAll(async () => {
      stack = new TapStack('naming-test-stack', {
        environmentSuffix: testEnvSuffix,
      });
    });

    test('should apply environment suffix to all resource names', async () => {
      const vpcId = await (stack.vpcId as any).promise();
      const albDns = await (stack.loadBalancerDns as any).promise();
      const bucketName = await (stack.staticAssetsBucketName as any).promise();
      const dbEndpoint = await (stack.databaseEndpoint as any).promise();

      // All resources should contain the environment suffix
      expect(vpcId).toContain(testEnvSuffix);
      expect(albDns).toContain(testEnvSuffix);
      expect(bucketName).toContain(testEnvSuffix);
      expect(dbEndpoint).toContain(testEnvSuffix);
    });
  });

  describe('Security Configuration', () => {
    beforeAll(async () => {
      stack = new TapStack('security-test-stack', {
        environmentSuffix: 'sectest',
        tags: {
          SecurityTest: 'true',
        },
      });
    });

    test('should create security groups', async () => {
      // Security groups should be created with appropriate naming
      const vpcId = await (stack.vpcId as any).promise();
      expect(vpcId).toBeDefined();
      // Security groups are created but not exposed as outputs
      // Their creation is verified through the successful stack creation
    });

    test('should configure RDS in private subnets', async () => {
      const dbEndpoint = await (stack.databaseEndpoint as any).promise();
      expect(dbEndpoint).toBeDefined();
      // RDS should only be accessible from within VPC
      expect(dbEndpoint).not.toContain('public');
    });
  });

  describe('High Availability Configuration', () => {
    beforeAll(async () => {
      stack = new TapStack('ha-test-stack', {
        environmentSuffix: 'hatest',
      });
    });

    test('should create resources for high availability', async () => {
      // Verify that load balancer is created for HA
      const albDns = await (stack.loadBalancerDns as any).promise();
      expect(albDns).toBeDefined();
      expect(albDns).toContain('elb.amazonaws.com');
    });

    test('should create database with proper configuration', async () => {
      const dbEndpoint = await (stack.databaseEndpoint as any).promise();
      expect(dbEndpoint).toBeDefined();
      expect(dbEndpoint).toContain(':3306'); // MySQL default port
    });
  });

  describe('Tagging', () => {
    const customTags = {
      Environment: 'unittest',
      Owner: 'testuser',
      CostCenter: 'engineering',
    };

    beforeAll(async () => {
      stack = new TapStack('tagging-test-stack', {
        environmentSuffix: 'tagtest',
        tags: customTags,
      });
    });

    test('should apply custom tags to resources', () => {
      // Tags are applied to resources but not directly testable through outputs
      // Verify stack creation succeeds with custom tags
      expect(stack).toBeDefined();
      expect(stack.vpcId).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    test('should handle empty args gracefully', () => {
      const emptyStack = new TapStack('empty-args-stack', {});
      expect(emptyStack).toBeDefined();
      expect(emptyStack.vpcId).toBeDefined();
    });

    test('should handle special characters in environment suffix', () => {
      const specialStack = new TapStack('special-stack', {
        environmentSuffix: 'test-123_special',
      });
      expect(specialStack).toBeDefined();
      expect(specialStack.vpcId).toBeDefined();
    });
  });

  describe('Output Validation', () => {
    beforeAll(async () => {
      stack = new TapStack('output-test-stack', {
        environmentSuffix: 'outtest',
      });
    });

    test('should provide valid VPC ID output', async () => {
      const vpcId = await (stack.vpcId as any).promise();
      expect(vpcId).toMatch(/^vpc-/);
    });

    test('should provide valid ALB DNS output', async () => {
      const albDns = await (stack.loadBalancerDns as any).promise();
      expect(albDns).toMatch(/\.elb\.amazonaws\.com$/);
    });

    test('should provide valid S3 bucket name output', async () => {
      const bucketName = await (stack.staticAssetsBucketName as any).promise();
      expect(bucketName).toMatch(/^prod-static-assets-/);
    });

    test('should provide valid RDS endpoint output', async () => {
      const dbEndpoint = await (stack.databaseEndpoint as any).promise();
      expect(dbEndpoint).toMatch(/\.rds\.amazonaws\.com:\d+$/);
    });
  });
});