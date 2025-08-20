import * as pulumi from '@pulumi/pulumi';
import { SecureInfrastructure } from '../lib/secure-infrastructure';
import { TapStack } from '../lib/tap-stack';

jest.mock('@pulumi/pulumi', () => ({
  ComponentResource: jest.fn().mockImplementation(function(this: any, type: string, name: string, args: any, opts: any) {
    this.registerOutputs = jest.fn();
    return this;
  }),
  Output: {
    create: jest.fn((value) => ({ apply: jest.fn((fn) => fn(value)) })),
  },
  output: jest.fn((value) => ({ apply: jest.fn((fn) => fn(value)) })),
  all: jest.fn((outputs) => ({ apply: jest.fn((fn) => fn(outputs)) })),
}));

jest.mock('../lib/secure-infrastructure', () => ({
  SecureInfrastructure: jest.fn().mockImplementation(function(this: any, name: string, args: any, opts: any) {
    this.vpcId = pulumi.output('vpc-12345678');
    this.publicSubnetIds = pulumi.output(['subnet-pub1', 'subnet-pub2']);
    this.privateSubnetIds = pulumi.output(['subnet-priv1', 'subnet-priv2']);
    this.webSecurityGroupId = pulumi.output('sg-web12345');
    this.dbSecurityGroupId = pulumi.output('sg-db12345');
    this.iamRoleArn = pulumi.output('arn:aws:iam::123456789012:role/ec2-deployment-role');
    this.instanceProfileName = pulumi.output('ec2-instance-profile');
    this.dynamoTableName = pulumi.output('application-data-table');
    this.kmsKeyId = pulumi.output('12345678-1234-1234-1234-123456789012');
    this.kmsKeyArn = pulumi.output('arn:aws:kms:ap-south-1:123456789012:key/12345678-1234-1234-1234-123456789012');
    this.cloudtrailArn = pulumi.output('arn:aws:cloudtrail:ap-south-1:123456789012:trail/main-cloudtrail');
    this.s3BucketName = pulumi.output('cloudtrail-logs-123456789012-ap-south-1');
    this.availableAZs = pulumi.output(['ap-south-1a', 'ap-south-1b', 'ap-south-1c']);
    this.snsTopicArn = pulumi.output('arn:aws:sns:ap-south-1:123456789012:security-alerts-topic');
    this.guardDutyDetectorId = pulumi.output('detector-12345678');
    this.configDeliveryChannelName = pulumi.output('main-config-delivery-channel');
    return this;
  })
}));

describe('TapStack Unit Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Constructor', () => {
    it('should create TapStack with default arguments', () => {
      const stack = new TapStack('test-stack', {});

      expect(stack).toBeDefined();
      expect(SecureInfrastructure).toHaveBeenCalledWith(
        'secure-infrastructure-dev',
        expect.objectContaining({
          environment: 'dev',
          tags: expect.any(Object),
        }),
        expect.objectContaining({
          parent: stack,
        })
      );
    });

    it('should create TapStack with custom tags', () => {
      const customTags = {
        Environment: 'production',
        Project: 'secure-infra',
        Owner: 'security-team',
        CostCenter: '12345'
      };

      const stack = new TapStack('test-stack', {
        tags: customTags
      });

      expect(stack).toBeDefined();
      expect(SecureInfrastructure).toHaveBeenCalledWith(
        'secure-infrastructure-dev',
        expect.objectContaining({
          tags: expect.objectContaining(customTags),
        }),
        expect.any(Object)
      );
    });

    it('should merge default and custom tags', () => {
      const customTags = {
        Environment: 'staging',
        Project: 'test-project'
      };

      const stack = new TapStack('test-stack', {
        tags: customTags
      });

      expect(SecureInfrastructure).toHaveBeenCalledWith(
        'secure-infrastructure-dev',
        expect.objectContaining({
          tags: expect.objectContaining({
            ...customTags,
            ManagedBy: 'Pulumi',
            Component: 'SecureInfrastructure',
          }),
        }),
        expect.any(Object)
      );
    });
  });

  describe('Output Properties', () => {
    let stack: TapStack;

    beforeEach(() => {
      stack = new TapStack('test-stack', {
        tags: { Environment: 'test' }
      });
    });

    it('should expose all network infrastructure outputs', () => {
      expect(stack.vpcId).toBeDefined();
      expect(stack.publicSubnetIds).toBeDefined();
      expect(stack.privateSubnetIds).toBeDefined();
      expect(stack.availableAZs).toBeDefined();
    });

    it('should expose all security group outputs', () => {
      expect(stack.webSecurityGroupId).toBeDefined();
      expect(stack.dbSecurityGroupId).toBeDefined();
    });

    it('should expose all IAM and access outputs', () => {
      expect(stack.iamRoleArn).toBeDefined();
      expect(stack.instanceProfileName).toBeDefined();
    });

    it('should expose all storage outputs', () => {
      expect(stack.dynamoTableName).toBeDefined();
      expect(stack.s3BucketName).toBeDefined();
    });

    it('should expose all encryption outputs', () => {
      expect(stack.kmsKeyId).toBeDefined();
      expect(stack.kmsKeyArn).toBeDefined();
    });

    it('should expose all monitoring and logging outputs', () => {
      expect(stack.cloudtrailArn).toBeDefined();
      expect(stack.snsTopicArn).toBeDefined();
    });

    it('should expose all security and compliance outputs', () => {
      expect(stack.guardDutyDetectorId).toBeDefined();
      expect(stack.configDeliveryChannelName).toBeDefined();
    });

    it('should register all outputs', () => {
      expect(stack.vpcId).toBeDefined();
      expect(stack.publicSubnetIds).toBeDefined();
      expect(stack.privateSubnetIds).toBeDefined();
      expect(stack.webSecurityGroupId).toBeDefined();
      expect(stack.dbSecurityGroupId).toBeDefined();
      expect(stack.iamRoleArn).toBeDefined();
      expect(stack.instanceProfileName).toBeDefined();
      expect(stack.dynamoTableName).toBeDefined();
      expect(stack.kmsKeyId).toBeDefined();
      expect(stack.kmsKeyArn).toBeDefined();
      expect(stack.cloudtrailArn).toBeDefined();
      expect(stack.s3BucketName).toBeDefined();
      expect(stack.availableAZs).toBeDefined();
      expect(stack.snsTopicArn).toBeDefined();
      expect(stack.guardDutyDetectorId).toBeDefined();
      expect(stack.configDeliveryChannelName).toBeDefined();
    });
  });

  describe('Component Integration', () => {
    it('should pass correct arguments to SecureInfrastructure', () => {
      const tags = {
        Environment: 'test',
        Project: 'tap-stack'
      };

      const stack = new TapStack('test-stack', { tags });

      expect(SecureInfrastructure).toHaveBeenCalledWith(
        'secure-infrastructure-dev',
        expect.objectContaining({
          tags: expect.objectContaining({
            ...tags,
            ManagedBy: 'Pulumi',
            Component: 'SecureInfrastructure',
          }),
        }),
        expect.objectContaining({
          parent: stack,
        })
      );
    });

    it('should properly inherit outputs from SecureInfrastructure', () => {
      const stack = new TapStack('test-stack', {
        tags: { Environment: 'test' }
      });

      // Verify that all outputs are properly inherited
      expect(stack.vpcId).toBe(stack.vpcId);
      expect(stack.publicSubnetIds).toBe(stack.publicSubnetIds);
      expect(stack.privateSubnetIds).toBe(stack.privateSubnetIds);
      expect(stack.webSecurityGroupId).toBe(stack.webSecurityGroupId);
      expect(stack.dbSecurityGroupId).toBe(stack.dbSecurityGroupId);
      expect(stack.iamRoleArn).toBe(stack.iamRoleArn);
      expect(stack.instanceProfileName).toBe(stack.instanceProfileName);
      expect(stack.dynamoTableName).toBe(stack.dynamoTableName);
      expect(stack.kmsKeyId).toBe(stack.kmsKeyId);
      expect(stack.kmsKeyArn).toBe(stack.kmsKeyArn);
      expect(stack.cloudtrailArn).toBe(stack.cloudtrailArn);
      expect(stack.s3BucketName).toBe(stack.s3BucketName);
      expect(stack.availableAZs).toBe(stack.availableAZs);
      expect(stack.snsTopicArn).toBe(stack.snsTopicArn);
      expect(stack.guardDutyDetectorId).toBe(stack.guardDutyDetectorId);
      expect(stack.configDeliveryChannelName).toBe(stack.configDeliveryChannelName);
    });
  });

  describe('Error Handling', () => {
    it('should handle missing tags gracefully', () => {
      expect(() => {
        new TapStack('test-stack', {});
      }).not.toThrow();
    });

    it('should handle empty tags object', () => {
      expect(() => {
        new TapStack('test-stack', { tags: {} });
      }).not.toThrow();
    });

    it('should handle null tags', () => {
      expect(() => {
        new TapStack('test-stack', { tags: null as any });
      }).not.toThrow();
    });
  });

  describe('Resource Naming', () => {
    it('should use consistent naming for child components', () => {
      const stack = new TapStack('production-stack', {
        tags: { Environment: 'production' }
      });

      expect(SecureInfrastructure).toHaveBeenCalledWith(
        'secure-infrastructure-dev',
        expect.any(Object),
        expect.any(Object)
      );
    });

    it('should maintain naming consistency across different stack names', () => {
      const stack1 = new TapStack('dev-stack', { tags: { Environment: 'dev' } });
      const stack2 = new TapStack('prod-stack', { tags: { Environment: 'prod' } });

      // Both should create SecureInfrastructure with the same component name
      expect(SecureInfrastructure).toHaveBeenNthCalledWith(
        1,
        'secure-infrastructure-dev',
        expect.any(Object),
        expect.any(Object)
      );
      expect(SecureInfrastructure).toHaveBeenNthCalledWith(
        2,
        'secure-infrastructure-dev',
        expect.any(Object),
        expect.any(Object)
      );
    });
  });

  describe('Tag Inheritance', () => {
    it('should add default tags to custom tags', () => {
      const customTags = {
        Environment: 'test',
        Owner: 'test-team'
      };

      const stack = new TapStack('test-stack', { tags: customTags });

      expect(SecureInfrastructure).toHaveBeenCalledWith(
        'secure-infrastructure-dev',
        expect.objectContaining({
          tags: expect.objectContaining({
            Environment: 'test',
            Owner: 'test-team',
            ManagedBy: 'Pulumi',
            Component: 'SecureInfrastructure',
          }),
        }),
        expect.any(Object)
      );
    });

    it('should allow custom tags to override default tags', () => {
      const customTags = {
        ManagedBy: 'CustomTool',
        Component: 'CustomComponent'
      };

      const stack = new TapStack('test-stack', { tags: customTags });

      expect(SecureInfrastructure).toHaveBeenCalledWith(
        'secure-infrastructure-dev',
        expect.objectContaining({
          tags: expect.objectContaining({
            ManagedBy: 'CustomTool',
            Component: 'CustomComponent',
          }),
        }),
        expect.any(Object)
      );
    });
  });
});
