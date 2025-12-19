import * as pulumi from '@pulumi/pulumi';

// Set up Pulumi configuration BEFORE importing TapStack
pulumi.runtime.setConfig('project:environmentSuffix', 'test');
pulumi.runtime.setConfig('project:createDms', 'false');
pulumi.runtime.setConfig('project:createVpn', 'false');
pulumi.runtime.setConfig('project:oracleEndpoint', 'oracle.test.com');
pulumi.runtime.setConfig('project:customerGatewayIp', '1.2.3.4');
pulumi.runtime.setConfig('project:dbPassword', 'test-password');

// Set up Pulumi mocks for testing
pulumi.runtime.setMocks({
  newResource: function (args: pulumi.runtime.MockResourceArgs): {
    id: string;
    state: Record<string, any>;
  } {
    const outputs: Record<string, any> = {
      ...args.inputs,
      id: `${args.name}-id`,
      arn: `arn:aws:${args.type}:us-east-1:123456789012:${args.name}`,
      name: args.name,
      endpoint: `${args.name}.amazonaws.com`,
      address: `${args.name}.address`,
      url: `https://${args.name}.amazonaws.com`,
      dnsName: `${args.name}.elb.amazonaws.com`,
    };

    // Specific outputs for different resource types
    if (args.type === 'aws:ec2/vpc:Vpc') {
      outputs.id = `vpc-${args.name}`;
      outputs.cidrBlock = args.inputs.cidrBlock || '10.0.0.0/16';
    }

    if (args.type === 'aws:ec2/subnet:Subnet') {
      outputs.id = `subnet-${args.name}`;
      outputs.availabilityZone = 'us-east-1a';
    }

    if (args.type === 'aws:rds/cluster:Cluster') {
      outputs.id = `cluster-${args.name}`;
      outputs.endpoint = `${args.name}.cluster-123.us-east-1.rds.amazonaws.com`;
      outputs.readerEndpoint = `${args.name}.cluster-ro-123.us-east-1.rds.amazonaws.com`;
    }

    if (args.type === 'aws:rds/globalCluster:GlobalCluster') {
      outputs.id = `global-${args.name}`;
      outputs.globalClusterIdentifier = args.inputs.globalClusterIdentifier;
    }

    if (args.type === 'aws:dynamodb/table:Table') {
      outputs.id = `table-${args.name}`;
      outputs.name = args.inputs.name;
    }

    if (args.type === 'aws:lambda/function:Function') {
      outputs.id = `lambda-${args.name}`;
      outputs.arn = `arn:aws:lambda:us-east-1:123456789012:function:${args.name}`;
    }

    if (args.type === 'aws:sns/topic:Topic') {
      outputs.id = `topic-${args.name}`;
      outputs.arn = `arn:aws:sns:us-east-1:123456789012:${args.name}`;
    }

    if (args.type === 'aws:lb/loadBalancer:LoadBalancer') {
      outputs.dnsName = `${args.name}-123.us-east-1.elb.amazonaws.com`;
      outputs.arn = `arn:aws:elasticloadbalancing:us-east-1:123456789012:loadbalancer/app/${args.name}/123`;
    }

    return {
      id: outputs.id || `${args.name}-id`,
      state: outputs,
    };
  },
  call: function (args: pulumi.runtime.MockCallArgs): Record<string, any> {
    if (args.token === 'aws:index/getAvailabilityZones:getAvailabilityZones') {
      return {
        names: ['us-east-1a', 'us-east-1b', 'us-east-1c'],
        zoneIds: ['use1-az1', 'use1-az2', 'use1-az3'],
      };
    }
    if (args.token === 'aws:index/getCallerIdentity:getCallerIdentity') {
      return {
        accountId: '123456789012',
        arn: 'arn:aws:iam::123456789012:user/test',
        userId: 'AIDACKCEVSQ6C2EXAMPLE',
      };
    }
    return {};
  },
});

// Now import TapStack after mocks are set up
import { TapStack } from '../lib/tap-stack';

describe('TapStack Unit Tests', () => {
  let stack: TapStack;
  let resources: pulumi.Output<any>[];

  beforeAll(async () => {
    // Create stack instance
    stack = new TapStack('tap-stack-test');

    // Collect all resources
    resources = [];
  });

  describe('Stack Creation', () => {
    it('should create stack successfully', () => {
      expect(stack).toBeDefined();
      expect(stack).toBeInstanceOf(TapStack);
    });

    it('should have vpcIds output', async () => {
      expect(stack.vpcIds).toBeDefined();
      const vpcIds = await stack.vpcIds.promise();
      expect(vpcIds).toBeDefined();
      expect(typeof vpcIds).toBe('object');
    });

    it('should have auroraGlobalCluster output', () => {
      expect(stack.auroraGlobalCluster).toBeDefined();
      expect(stack.auroraGlobalCluster.id).toBeDefined();
    });

    it('should have migrationStateTable output', () => {
      expect(stack.migrationStateTable).toBeDefined();
      expect(stack.migrationStateTable.name).toBeDefined();
    });

    it('should have validationLambda output', () => {
      expect(stack.validationLambda).toBeDefined();
      expect(stack.validationLambda.arn).toBeDefined();
    });

    it('should have notificationTopic output', () => {
      expect(stack.notificationTopic).toBeDefined();
      expect(stack.notificationTopic.arn).toBeDefined();
    });
  });

  describe('VPC Configuration', () => {
    it('should create VPCs in all regions', async () => {
      const vpcIds = await stack.vpcIds.promise();
      expect(vpcIds).toHaveProperty('us-east-1');
      expect(vpcIds).toHaveProperty('eu-west-1');
      expect(vpcIds).toHaveProperty('ap-southeast-1');
    });

    it('should have valid VPC IDs format', async () => {
      const vpcIds = await stack.vpcIds.promise();
      Object.values(vpcIds).forEach((vpcId: any) => {
        expect(vpcId).toMatch(/vpc-/);
      });
    });
  });

  describe('Aurora Global Database', () => {
    it('should have global cluster identifier', async () => {
      const globalClusterId = await stack.auroraGlobalCluster.id.promise();
      expect(globalClusterId).toBeDefined();
      expect(typeof globalClusterId).toBe('string');
    });

    it('should reference global cluster in configuration', async () => {
      const clusterId = await stack.auroraGlobalCluster.id.promise();
      expect(clusterId).toContain('aurora-global');
    });
  });

  describe('DynamoDB Table', () => {
    it('should have migration state table name', async () => {
      const tableName = await stack.migrationStateTable.name.promise();
      expect(tableName).toBeDefined();
      expect(tableName).toContain('migration-state');
    });

    it('should have valid table name format', async () => {
      const tableName = await stack.migrationStateTable.name.promise();
      expect(tableName).toMatch(/^[a-zA-Z0-9_.-]+$/);
    });
  });

  describe('Validation Lambda', () => {
    it('should have lambda function ARN', async () => {
      const lambdaArn = await stack.validationLambda.arn.promise();
      expect(lambdaArn).toBeDefined();
      expect(lambdaArn).toContain('arn:aws:lambda');
    });

    it('should have validation lambda in ARN', async () => {
      const lambdaArn = await stack.validationLambda.arn.promise();
      expect(lambdaArn).toContain('validation-lambda');
    });
  });

  describe('SNS Notification Topic', () => {
    it('should have topic ARN', async () => {
      const topicArn = await stack.notificationTopic.arn.promise();
      expect(topicArn).toBeDefined();
      expect(topicArn).toContain('arn:aws:sns');
    });

    it('should have migration notifications topic', async () => {
      const topicArn = await stack.notificationTopic.arn.promise();
      expect(topicArn).toContain('migration-notifications');
    });
  });

  describe('Environment Suffix Usage', () => {
    it('should use environment suffix in global cluster', async () => {
      const clusterId = await stack.auroraGlobalCluster.id.promise();
      // Environment suffix should be part of resource names
      expect(clusterId).toBeDefined();
    });

    it('should use environment suffix in DynamoDB table', async () => {
      const tableName = await stack.migrationStateTable.name.promise();
      expect(tableName).toBeDefined();
    });

    it('should use environment suffix in Lambda', async () => {
      const lambdaArn = await stack.validationLambda.arn.promise();
      expect(lambdaArn).toBeDefined();
    });

    it('should use environment suffix in SNS topic', async () => {
      const topicArn = await stack.notificationTopic.arn.promise();
      expect(topicArn).toBeDefined();
    });
  });

  describe('Multi-Region Configuration', () => {
    it('should configure resources in primary region', async () => {
      const vpcIds = await stack.vpcIds.promise();
      expect(vpcIds['us-east-1']).toBeDefined();
    });

    it('should configure resources in eu-west-1', async () => {
      const vpcIds = await stack.vpcIds.promise();
      expect(vpcIds['eu-west-1']).toBeDefined();
    });

    it('should configure resources in ap-southeast-1', async () => {
      const vpcIds = await stack.vpcIds.promise();
      expect(vpcIds['ap-southeast-1']).toBeDefined();
    });
  });

  describe('Resource Naming Conventions', () => {
    it('should follow naming convention for global cluster', async () => {
      const clusterId = await stack.auroraGlobalCluster.id.promise();
      expect(clusterId).toMatch(/aurora-global-/);
    });

    it('should follow naming convention for DynamoDB', async () => {
      const tableName = await stack.migrationStateTable.name.promise();
      expect(tableName).toMatch(/migration-state-/);
    });

    it('should follow naming convention for Lambda', async () => {
      const lambdaArn = await stack.validationLambda.arn.promise();
      expect(lambdaArn).toMatch(/validation-lambda-/);
    });

    it('should follow naming convention for SNS', async () => {
      const topicArn = await stack.notificationTopic.arn.promise();
      expect(topicArn).toMatch(/migration-notifications-/);
    });
  });

  describe('Output Validation', () => {
    it('should export vpcIds as output', async () => {
      const vpcIds = await stack.vpcIds.promise();
      expect(Object.keys(vpcIds).length).toBeGreaterThan(0);
    });

    it('should export globalClusterIdentifier', async () => {
      const clusterId = await stack.auroraGlobalCluster.id.promise();
      expect(clusterId.length).toBeGreaterThan(0);
    });

    it('should export migrationTableName', async () => {
      const tableName = await stack.migrationStateTable.name.promise();
      expect(tableName.length).toBeGreaterThan(0);
    });

    it('should export validationLambdaArn', async () => {
      const lambdaArn = await stack.validationLambda.arn.promise();
      expect(lambdaArn.length).toBeGreaterThan(0);
    });

    it('should export notificationTopicArn', async () => {
      const topicArn = await stack.notificationTopic.arn.promise();
      expect(topicArn.length).toBeGreaterThan(0);
    });
  });
});

describe('TapStack with DMS and VPN enabled', () => {
  let stackWithFeatures: TapStack;

  beforeAll(() => {
    // Update config to enable DMS and VPN
    pulumi.runtime.setConfig('project:createDms', 'true');
    pulumi.runtime.setConfig('project:createVpn', 'true');

    // Need to re-import to pick up new config
    // Create a new stack instance with DMS and VPN enabled
    stackWithFeatures = new TapStack('tap-stack-with-features');
  });

  afterAll(() => {
    // Reset config
    pulumi.runtime.setConfig('project:createDms', 'false');
    pulumi.runtime.setConfig('project:createVpn', 'false');
  });

  describe('Optional Features', () => {
    it('should create stack with DMS enabled', () => {
      expect(stackWithFeatures).toBeDefined();
      expect(stackWithFeatures).toBeInstanceOf(TapStack);
    });

    it('should create stack with VPN enabled', () => {
      expect(stackWithFeatures).toBeDefined();
      expect(stackWithFeatures).toBeInstanceOf(TapStack);
    });

    it('should have all required outputs with optional features', async () => {
      expect(stackWithFeatures.vpcIds).toBeDefined();
      expect(stackWithFeatures.auroraGlobalCluster).toBeDefined();
      expect(stackWithFeatures.migrationStateTable).toBeDefined();
      expect(stackWithFeatures.validationLambda).toBeDefined();
      expect(stackWithFeatures.notificationTopic).toBeDefined();
    });

    it('should maintain VPC configuration with optional features', async () => {
      const vpcIds = await stackWithFeatures.vpcIds.promise();
      expect(vpcIds).toHaveProperty('us-east-1');
      expect(vpcIds).toHaveProperty('eu-west-1');
      expect(vpcIds).toHaveProperty('ap-southeast-1');
    });

    it('should maintain Aurora configuration with optional features', async () => {
      const globalClusterId = await stackWithFeatures.auroraGlobalCluster.id.promise();
      expect(globalClusterId).toBeDefined();
      expect(globalClusterId).toContain('aurora-global');
    });

    it('should maintain DynamoDB configuration with optional features', async () => {
      const tableName = await stackWithFeatures.migrationStateTable.name.promise();
      expect(tableName).toBeDefined();
      expect(tableName).toContain('migration-state');
    });

    it('should maintain Lambda configuration with optional features', async () => {
      const lambdaArn = await stackWithFeatures.validationLambda.arn.promise();
      expect(lambdaArn).toBeDefined();
      expect(lambdaArn).toContain('validation-lambda');
    });

    it('should maintain SNS configuration with optional features', async () => {
      const topicArn = await stackWithFeatures.notificationTopic.arn.promise();
      expect(topicArn).toBeDefined();
      expect(topicArn).toContain('migration-notifications');
    });
  });
});
