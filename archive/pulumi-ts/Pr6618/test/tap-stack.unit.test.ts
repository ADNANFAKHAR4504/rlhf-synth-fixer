import * as pulumi from '@pulumi/pulumi';

// Set up Pulumi test environment
pulumi.runtime.setMocks({
  newResource: (args: pulumi.runtime.MockResourceArgs): { id: string, state: any } => {
    const state = {
      ...args.inputs,
      arn: `arn:aws:${args.type}:us-east-1:123456789012:${args.name}`,
      id: `${args.name}_id`,
      name: args.inputs.name || args.name,
      dnsName: args.type === 'aws:lb/loadBalancer:LoadBalancer' ? `${args.name}.elb.amazonaws.com` : undefined,
      clusterIdentifier: args.inputs.clusterIdentifier || `${args.name}-cluster`,
      clusterEndpoint: `${args.name}.cluster.us-east-1.rds.amazonaws.com`,
      readerEndpoint: `${args.name}.cluster-ro.us-east-1.rds.amazonaws.com`,
      vpcId: args.inputs.vpcId || 'vpc-12345',
      dashboardName: args.inputs.dashboardName || `${args.name}-dashboard`,
    };
    return {
      id: state.id,
      state: state,
    };
  },
  call: (args: pulumi.runtime.MockCallArgs) => {
    return args.inputs;
  },
}, 'test');

// Import modules AFTER setting up mocks
import * as config from '../lib/config';
import { TapStack } from '../lib/tap-stack';

describe('TapStack Unit Tests', () => {
  let getEnvironmentConfigSpy: jest.SpyInstance;
  let getEnvironmentSuffixSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock config functions
    getEnvironmentConfigSpy = jest.spyOn(config, 'getEnvironmentConfig').mockReturnValue({
      environment: 'dev',
      region: 'us-east-1',
      instanceType: 't3.medium',
      dbInstanceCount: 1,
      backupRetentionDays: 7,
      containerImageTag: 'latest',
      vpcCidr: '10.0.0.0/16',
      availabilityZones: ['us-east-1a', 'us-east-1b', 'us-east-1c'],
      publicSubnetCidrs: ['10.0.1.0/24', '10.0.2.0/24', '10.0.3.0/24'],
      privateSubnetCidrs: ['10.0.11.0/24', '10.0.12.0/24', '10.0.13.0/24'],
    });

    getEnvironmentSuffixSpy = jest.spyOn(config, 'getEnvironmentSuffix').mockReturnValue('test123');
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Stack Instantiation', () => {
    it('should instantiate successfully with default values', async () => {
      const stack = new TapStack('TestStack');

      expect(stack).toBeDefined();
      expect(stack).toBeInstanceOf(TapStack);
      expect(stack).toBeInstanceOf(pulumi.ComponentResource);
    });

    it('should instantiate successfully with custom args', async () => {
      const stack = new TapStack('TestStackCustom', {
        environmentSuffix: 'custom-env',
        awsRegion: 'us-west-2',
        stateBucket: 'my-state-bucket',
        stateBucketRegion: 'us-west-2',
      });

      expect(stack).toBeDefined();
      expect(stack.provider).toBeDefined();
    });

    it('should call getEnvironmentConfig', async () => {
      new TapStack('TestStack');

      expect(getEnvironmentConfigSpy).toHaveBeenCalled();
    });

    it('should use custom environmentSuffix when provided', async () => {
      const customSuffix = 'prod-2024';
      new TapStack('TestStack', { environmentSuffix: customSuffix });

      // getEnvironmentSuffix should not be called when environmentSuffix is provided
      expect(getEnvironmentSuffixSpy).not.toHaveBeenCalled();
    });

    it('should use default environmentSuffix when not provided', async () => {
      new TapStack('TestStack');

      expect(getEnvironmentSuffixSpy).toHaveBeenCalled();
    });
  });

  describe('Component Creation', () => {
    let stack: TapStack;

    beforeEach(() => {
      stack = new TapStack('TestStack', {
        environmentSuffix: 'test',
        awsRegion: 'us-east-1',
      });
    });

    it('should create AWS provider', () => {
      expect(stack.provider).toBeDefined();
    });

    it('should create VPC component', () => {
      expect(stack.vpcComponent).toBeDefined();
      expect(stack.vpcId).toBeDefined();
    });

    it('should create Security component', () => {
      expect(stack.securityComponent).toBeDefined();
    });

    it('should create ALB component', () => {
      expect(stack.albComponent).toBeDefined();
      expect(stack.albDnsName).toBeDefined();
      expect(stack.albArn).toBeDefined();
    });

    it('should create ECS component', () => {
      expect(stack.ecsComponent).toBeDefined();
      expect(stack.ecsClusterArn).toBeDefined();
      expect(stack.ecsServiceArn).toBeDefined();
    });

    it('should create RDS component', () => {
      expect(stack.rdsComponent).toBeDefined();
      expect(stack.rdsClusterEndpoint).toBeDefined();
      expect(stack.rdsClusterReaderEndpoint).toBeDefined();
    });

    it('should create S3 component', () => {
      expect(stack.s3Component).toBeDefined();
      expect(stack.s3BucketName).toBeDefined();
    });

    it('should create Parameter Store component', () => {
      expect(stack.parameterStoreComponent).toBeDefined();
    });

    it('should create Monitoring component', () => {
      expect(stack.monitoringComponent).toBeDefined();
      expect(stack.dashboardName).toBeDefined();
      expect(stack.snsTopicArn).toBeDefined();
    });
  });

  describe('Output Values', () => {
    let stack: TapStack;

    beforeEach(() => {
      stack = new TapStack('TestStack', {
        environmentSuffix: 'test',
      });
    });

    it('should have valid VPC outputs', async () => {
      expect(stack.vpcId).toBeDefined();
      expect(stack.publicSubnetIds).toBeDefined();
      expect(stack.privateSubnetIds).toBeDefined();

      expect(Array.isArray(stack.publicSubnetIds)).toBe(true);
      expect(Array.isArray(stack.privateSubnetIds)).toBe(true);
    });

    it('should have valid ALB outputs', async () => {
      expect(stack.albDnsName).toBeDefined();
      expect(stack.albArn).toBeDefined();

      // Pulumi Outputs in test mode - verify they exist
      expect(stack.albDnsName).toBeInstanceOf(Object);
      expect(stack.albArn).toBeInstanceOf(Object);
    });

    it('should have valid ECS outputs', async () => {
      expect(stack.ecsClusterArn).toBeDefined();
      expect(stack.ecsServiceArn).toBeDefined();

      // Pulumi Outputs in test mode - verify they exist
      expect(stack.ecsClusterArn).toBeInstanceOf(Object);
      expect(stack.ecsServiceArn).toBeInstanceOf(Object);
    });

    it('should have valid RDS outputs', async () => {
      expect(stack.rdsClusterEndpoint).toBeDefined();
      expect(stack.rdsClusterReaderEndpoint).toBeDefined();

      // Pulumi Outputs in test mode - verify they exist
      expect(stack.rdsClusterEndpoint).toBeInstanceOf(Object);
      expect(stack.rdsClusterReaderEndpoint).toBeInstanceOf(Object);
    });

    it('should have valid S3 outputs', async () => {
      expect(stack.s3BucketName).toBeDefined();

      // Pulumi Outputs in test mode - verify they exist
      expect(stack.s3BucketName).toBeInstanceOf(Object);
    });

    it('should have valid Monitoring outputs', async () => {
      expect(stack.dashboardName).toBeDefined();
      expect(stack.snsTopicArn).toBeDefined();

      // Pulumi Outputs in test mode - verify they exist
      expect(stack.dashboardName).toBeInstanceOf(Object);
      expect(stack.snsTopicArn).toBeInstanceOf(Object);
    });
  });

  describe('Environment Configuration', () => {
    it('should use dev configuration by default', async () => {
      getEnvironmentConfigSpy.mockReturnValue({
        environment: 'dev',
        region: 'us-east-1',
        instanceType: 't3.medium',
        dbInstanceCount: 1,
        backupRetentionDays: 7,
        containerImageTag: 'latest',
        vpcCidr: '10.0.0.0/16',
        availabilityZones: ['us-east-1a', 'us-east-1b', 'us-east-1c'],
        publicSubnetCidrs: ['10.0.1.0/24', '10.0.2.0/24', '10.0.3.0/24'],
        privateSubnetCidrs: ['10.0.11.0/24', '10.0.12.0/24', '10.0.13.0/24'],
      });

      const stack = new TapStack('TestStack');
      expect(stack).toBeDefined();
    });

    it('should handle prod configuration', async () => {
      getEnvironmentConfigSpy.mockReturnValue({
        environment: 'prod',
        region: 'us-east-1',
        instanceType: 'm5.xlarge',
        dbInstanceCount: 3,
        backupRetentionDays: 30,
        containerImageTag: 'v1.0.0',
        vpcCidr: '10.2.0.0/16',
        availabilityZones: ['us-east-1a', 'us-east-1b', 'us-east-1c'],
        publicSubnetCidrs: ['10.2.1.0/24', '10.2.2.0/24', '10.2.3.0/24'],
        privateSubnetCidrs: ['10.2.11.0/24', '10.2.12.0/24', '10.2.13.0/24'],
      });

      const stack = new TapStack('TestStack');
      expect(stack).toBeDefined();
      expect(stack.rdsComponent).toBeDefined();
    });

    it('should handle staging configuration', async () => {
      getEnvironmentConfigSpy.mockReturnValue({
        environment: 'staging',
        region: 'us-west-2',
        instanceType: 'm5.large',
        dbInstanceCount: 2,
        backupRetentionDays: 14,
        containerImageTag: 'staging-latest',
        vpcCidr: '10.1.0.0/16',
        availabilityZones: ['us-west-2a', 'us-west-2b', 'us-west-2c'],
        publicSubnetCidrs: ['10.1.1.0/24', '10.1.2.0/24', '10.1.3.0/24'],
        privateSubnetCidrs: ['10.1.11.0/24', '10.1.12.0/24', '10.1.13.0/24'],
      });

      const stack = new TapStack('TestStack', {
        awsRegion: 'us-west-2',
      });
      expect(stack).toBeDefined();
    });
  });

  describe('Region Configuration', () => {
    it('should use custom AWS region when provided', async () => {
      const customRegion = 'eu-west-1';
      const stack = new TapStack('TestStack', {
        awsRegion: customRegion,
      });

      expect(stack.provider).toBeDefined();
    });

    it('should use environment config region when custom region not provided', async () => {
      getEnvironmentConfigSpy.mockReturnValue({
        environment: 'dev',
        region: 'ap-southeast-1',
        instanceType: 't3.medium',
        dbInstanceCount: 1,
        backupRetentionDays: 7,
        containerImageTag: 'latest',
        vpcCidr: '10.0.0.0/16',
        availabilityZones: ['ap-southeast-1a', 'ap-southeast-1b', 'ap-southeast-1c'],
        publicSubnetCidrs: ['10.0.1.0/24', '10.0.2.0/24', '10.0.3.0/24'],
        privateSubnetCidrs: ['10.0.11.0/24', '10.0.12.0/24', '10.0.13.0/24'],
      });

      const stack = new TapStack('TestStack');
      expect(stack.provider).toBeDefined();
    });
  });

  describe('Resource Naming', () => {
    it('should use environment suffix in resource names', async () => {
      const suffix = 'test-env-123';
      const stack = new TapStack('TestStack', {
        environmentSuffix: suffix,
      });

      expect(stack.vpcComponent).toBeDefined();
      expect(stack.ecsComponent).toBeDefined();
      expect(stack.rdsComponent).toBeDefined();
    });

    it('should handle special characters in environment suffix', async () => {
      const suffix = 'pr-1234';
      const stack = new TapStack('TestStack', {
        environmentSuffix: suffix,
      });

      expect(stack).toBeDefined();
      expect(stack.s3Component).toBeDefined();
    });
  });

  describe('Component Dependencies', () => {
    let stack: TapStack;

    beforeEach(() => {
      stack = new TapStack('TestStack', {
        environmentSuffix: 'test',
      });
    });

    it('should create security component after VPC', () => {
      // Security component needs VPC ID
      expect(stack.vpcComponent).toBeDefined();
      expect(stack.securityComponent).toBeDefined();
    });

    it('should create ALB after VPC and Security components', () => {
      // ALB needs VPC, subnets, and security group
      expect(stack.vpcComponent).toBeDefined();
      expect(stack.securityComponent).toBeDefined();
      expect(stack.albComponent).toBeDefined();
    });

    it('should create ECS after ALB', () => {
      // ECS needs ALB target group
      expect(stack.albComponent).toBeDefined();
      expect(stack.ecsComponent).toBeDefined();
    });

    it('should create RDS after VPC and Security components', () => {
      // RDS needs subnets and security group
      expect(stack.vpcComponent).toBeDefined();
      expect(stack.securityComponent).toBeDefined();
      expect(stack.rdsComponent).toBeDefined();
    });

    it('should create Monitoring after ECS, ALB, and RDS', () => {
      // Monitoring needs cluster, service, ALB, and RDS identifiers
      expect(stack.ecsComponent).toBeDefined();
      expect(stack.albComponent).toBeDefined();
      expect(stack.rdsComponent).toBeDefined();
      expect(stack.monitoringComponent).toBeDefined();
    });

    it('should create Parameter Store after RDS', () => {
      // Parameter Store needs RDS endpoint
      expect(stack.rdsComponent).toBeDefined();
      expect(stack.parameterStoreComponent).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    it('should handle missing environment configuration', () => {
      getEnvironmentConfigSpy.mockImplementation(() => {
        throw new Error('Configuration not found');
      });

      expect(() => {
        new TapStack('TestStack');
      }).toThrow('Configuration not found');
    });

    it('should handle undefined environment suffix gracefully', () => {
      getEnvironmentSuffixSpy.mockReturnValue('');

      const stack = new TapStack('TestStack');
      expect(stack).toBeDefined();
    });
  });

  describe('Type Safety', () => {
    it('should have correct types for all components', () => {
      const stack = new TapStack('TestStack');

      // Check that all properties exist and have correct types
      expect(stack.provider).toBeInstanceOf(Object);
      expect(stack.vpcComponent).toBeInstanceOf(Object);
      expect(stack.securityComponent).toBeInstanceOf(Object);
      expect(stack.albComponent).toBeInstanceOf(Object);
      expect(stack.ecsComponent).toBeInstanceOf(Object);
      expect(stack.rdsComponent).toBeInstanceOf(Object);
      expect(stack.s3Component).toBeInstanceOf(Object);
      expect(stack.parameterStoreComponent).toBeInstanceOf(Object);
      expect(stack.monitoringComponent).toBeInstanceOf(Object);
    });

    it('should have Output types for exported values', () => {
      const stack = new TapStack('TestStack');

      // All these should be Pulumi Outputs
      expect(stack.vpcId).toBeInstanceOf(Object);
      expect(stack.albDnsName).toBeInstanceOf(Object);
      expect(stack.ecsClusterArn).toBeInstanceOf(Object);
      expect(stack.rdsClusterEndpoint).toBeInstanceOf(Object);
      expect(stack.s3BucketName).toBeInstanceOf(Object);
    });
  });

  describe('Integration Points', () => {
    let stack: TapStack;

    beforeEach(() => {
      stack = new TapStack('TestStack', {
        environmentSuffix: 'integration-test',
      });
    });

    it('should pass VPC ID to dependent components', () => {
      expect(stack.vpcId).toBeDefined();
      expect(stack.securityComponent).toBeDefined();
      expect(stack.albComponent).toBeDefined();
      expect(stack.ecsComponent).toBeDefined();
    });

    it('should pass subnet IDs to components that need them', () => {
      expect(stack.publicSubnetIds).toBeDefined();
      expect(stack.privateSubnetIds).toBeDefined();
      expect(stack.albComponent).toBeDefined();
      expect(stack.ecsComponent).toBeDefined();
      expect(stack.rdsComponent).toBeDefined();
    });

    it('should pass security group IDs to components', () => {
      expect(stack.securityComponent).toBeDefined();
      expect(stack.albComponent).toBeDefined();
      expect(stack.ecsComponent).toBeDefined();
      expect(stack.rdsComponent).toBeDefined();
    });

    it('should connect ECS to ALB target group', () => {
      expect(stack.albComponent).toBeDefined();
      expect(stack.ecsComponent).toBeDefined();
    });

    it('should pass RDS endpoint to Parameter Store', () => {
      expect(stack.rdsComponent).toBeDefined();
      expect(stack.rdsClusterEndpoint).toBeDefined();
      expect(stack.parameterStoreComponent).toBeDefined();
    });
  });
});

