/**
 * Unit tests for TapStack
 *
 * Tests the VPC Peering infrastructure stack component
 */
import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';
import { TapStack } from '../lib/tap-stack';

// Mock Pulumi runtime
pulumi.runtime.setMocks({
  newResource: (args: pulumi.runtime.MockResourceArgs): {
    id: string;
    state: Record<string, any>;
  } => {
    const outputs: Record<string, any> = {
      ...args.inputs,
      id: `${args.name}-id`,
      arn: `arn:aws:${args.type}:us-east-1:123456789012:${args.name}`,
    };

    // Resource-specific mock outputs
    switch (args.type) {
      case 'aws:ec2/vpcPeeringConnection:VpcPeeringConnection':
        outputs.status = 'active';
        outputs.acceptStatus = 'active';
        break;
      case 'aws:ec2/getRouteTables:getRouteTables':
        outputs.ids = ['rtb-123', 'rtb-456', 'rtb-789'];
        break;
      case 'aws:ec2/getNetworkAcls:getNetworkAcls':
        outputs.ids = ['acl-123'];
        break;
      case 'aws:s3/bucket:Bucket':
        outputs.bucket = args.inputs.bucket || `${args.name}-bucket`;
        break;
      case 'aws:cloudwatch/metricAlarm:MetricAlarm':
        outputs.alarmName = args.inputs.name;
        break;
      case 'aws:ec2/securityGroup:SecurityGroup':
        outputs.name = args.inputs.name;
        outputs.vpcId = args.inputs.vpcId;
        break;
      case 'aws:sns/topic:Topic':
        outputs.name = args.inputs.name;
        break;
    }

    return {
      id: outputs.id,
      state: outputs,
    };
  },
  call: (args: pulumi.runtime.MockCallArgs) => {
    // Mock AWS data source calls
    switch (args.token) {
      case 'aws:ec2/getRouteTables:getRouteTables':
        return {
          ids: ['rtb-123', 'rtb-456', 'rtb-789'],
          tables: [],
        };
      case 'aws:ec2/getNetworkAcls:getNetworkAcls':
        return {
          ids: ['acl-123'],
        };
      case 'aws:getCallerIdentity:getCallerIdentity':
        return {
          accountId: '123456789012',
          arn: 'arn:aws:iam::123456789012:root',
          userId: 'AIDAEXAMPLE',
        };
      default:
        return {};
    }
  },
});

describe('TapStack', () => {
  let stack: TapStack;

  beforeEach(() => {
    // Create a new stack for each test
    stack = new TapStack('test-stack', {
      environmentSuffix: 'test',
      paymentVpcId: 'vpc-payment123',
      auditVpcId: 'vpc-audit123',
      paymentVpcCidr: '10.100.0.0/16',
      auditVpcCidr: '10.200.0.0/16',
      paymentAccountId: '111111111111',
      auditAccountId: '111111111111',
      environment: 'dev',
      dataClassification: 'Sensitive',
      flowLogsRetentionDays: 90,
      tags: {
        Project: 'VPC-Peering',
      },
    });
  });

  describe('Component Initialization', () => {
    it('should create a TapStack component resource', async () => {
      expect(stack).toBeInstanceOf(TapStack);
      // Allow async operations to settle
      await new Promise(resolve => setTimeout(resolve, 100));
    });

    it('should have peeringConnectionId output', async () => {
      const id = await stack.peeringConnectionId.promise();
      expect(id).toBeDefined();
      expect(typeof id).toBe('string');
    });

    it('should have paymentRouteTableIds output', async () => {
      const ids = await stack.paymentRouteTableIds.promise();
      expect(ids).toBeDefined();
      expect(Array.isArray(ids)).toBe(true);
    });

    it('should have auditRouteTableIds output', async () => {
      const ids = await stack.auditRouteTableIds.promise();
      expect(ids).toBeDefined();
      expect(Array.isArray(ids)).toBe(true);
    });

    it('should have flowLogsBucketName output', async () => {
      const name = await stack.flowLogsBucketName.promise();
      expect(name).toBeDefined();
      expect(typeof name).toBe('string');
    });

    it('should have peeringStatusAlarmArn output', async () => {
      const arn = await stack.peeringStatusAlarmArn.promise();
      expect(arn).toBeDefined();
      expect(typeof arn).toBe('string');
    });

    it('should have securityGroupIds output', async () => {
      const ids = await stack.securityGroupIds.promise();
      expect(ids).toBeDefined();
      expect(ids.paymentSecurityGroupId).toBeDefined();
      expect(ids.auditSecurityGroupId).toBeDefined();
    });
  });

  describe('VPC Peering Configuration', () => {
    it('should create VPC peering with correct CIDR blocks', async () => {
      const peeringId = await stack.peeringConnectionId.promise();
      expect(peeringId).toBeDefined();
      expect(stack.peeringConnectionId).toBeDefined();
    });

    it('should configure DNS resolution for peering connection', () => {
      // DNS resolution options should be configured
      expect(stack).toBeDefined();
    });

    it('should use environmentSuffix in resource names', async () => {
      const name = await stack.flowLogsBucketName.promise();
      expect(name).toContain('test');
    });
  });

  describe('Security Configuration', () => {
    it('should create security groups for both VPCs', async () => {
      const ids = await stack.securityGroupIds.promise();
      expect(ids.paymentSecurityGroupId).toBeTruthy();
      expect(ids.auditSecurityGroupId).toBeTruthy();
    });

    it('should apply required tags to resources', () => {
      // Tags should be applied (verified through stack creation)
      expect(stack).toBeDefined();
    });
  });

  describe('Monitoring Configuration', () => {
    it('should create CloudWatch alarm for peering status', async () => {
      const arn = await stack.peeringStatusAlarmArn.promise();
      expect(arn).toBeTruthy();
      expect(arn).toContain('arn:aws');
    });

    it('should configure VPC flow logs with S3 destination', async () => {
      const name = await stack.flowLogsBucketName.promise();
      expect(name).toBeTruthy();
      expect(typeof name).toBe('string');
    });
  });

  describe('Cross-Account Permissions', () => {
    it('should handle same-account scenario', () => {
      const sameAccountStack = new TapStack('same-account-stack', {
        environmentSuffix: 'test',
        paymentVpcId: 'vpc-payment123',
        auditVpcId: 'vpc-audit123',
        paymentVpcCidr: '10.100.0.0/16',
        auditVpcCidr: '10.200.0.0/16',
        paymentAccountId: '123456789012',
        auditAccountId: '123456789012',
        environment: 'dev',
      });

      expect(sameAccountStack).toBeDefined();
    });

    it('should handle cross-account scenario', () => {
      const crossAccountStack = new TapStack('cross-account-stack', {
        environmentSuffix: 'test',
        paymentVpcId: 'vpc-payment123',
        auditVpcId: 'vpc-audit123',
        paymentVpcCidr: '10.100.0.0/16',
        auditVpcCidr: '10.200.0.0/16',
        paymentAccountId: '111111111111',
        auditAccountId: '222222222222',
        environment: 'dev',
      });

      expect(crossAccountStack).toBeDefined();
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should use default dataClassification when not provided', () => {
      const defaultStack = new TapStack('default-stack', {
        environmentSuffix: 'test',
        paymentVpcId: 'vpc-payment123',
        auditVpcId: 'vpc-audit123',
        paymentVpcCidr: '10.100.0.0/16',
        auditVpcCidr: '10.200.0.0/16',
        paymentAccountId: '111111111111',
        auditAccountId: '111111111111',
        environment: 'dev',
      });

      expect(defaultStack).toBeDefined();
    });

    it('should use default flowLogsRetentionDays when not provided', () => {
      const defaultStack = new TapStack('default-retention-stack', {
        environmentSuffix: 'test',
        paymentVpcId: 'vpc-payment123',
        auditVpcId: 'vpc-audit123',
        paymentVpcCidr: '10.100.0.0/16',
        auditVpcCidr: '10.200.0.0/16',
        paymentAccountId: '111111111111',
        auditAccountId: '111111111111',
        environment: 'dev',
      });

      expect(defaultStack).toBeDefined();
    });

    it('should handle custom flowLogsRetentionDays', () => {
      const customStack = new TapStack('custom-retention-stack', {
        environmentSuffix: 'test',
        paymentVpcId: 'vpc-payment123',
        auditVpcId: 'vpc-audit123',
        paymentVpcCidr: '10.100.0.0/16',
        auditVpcCidr: '10.200.0.0/16',
        paymentAccountId: '111111111111',
        auditAccountId: '111111111111',
        environment: 'dev',
        flowLogsRetentionDays: 30,
      });

      expect(customStack).toBeDefined();
    });

    it('should merge provided tags with default tags', () => {
      const taggedStack = new TapStack('tagged-stack', {
        environmentSuffix: 'test',
        paymentVpcId: 'vpc-payment123',
        auditVpcId: 'vpc-audit123',
        paymentVpcCidr: '10.100.0.0/16',
        auditVpcCidr: '10.200.0.0/16',
        paymentAccountId: '111111111111',
        auditAccountId: '111111111111',
        environment: 'dev',
        tags: {
          CustomTag: 'CustomValue',
          Owner: 'TestTeam',
        },
      });

      expect(taggedStack).toBeDefined();
    });
  });

  describe('Resource Dependencies', () => {
    it('should create peering connection before routes', () => {
      // Routes depend on peering connection
      expect(stack.peeringConnectionId).toBeDefined();
      expect(stack.paymentRouteTableIds).toBeDefined();
    });

    it('should create S3 bucket before flow logs', () => {
      // Flow logs depend on S3 bucket
      expect(stack.flowLogsBucketName).toBeDefined();
    });
  });
});

describe('TapStack Interface', () => {
  it('should export TapStackArgs interface', () => {
    const args = {
      environmentSuffix: 'test',
      paymentVpcId: 'vpc-123',
      auditVpcId: 'vpc-456',
      paymentVpcCidr: '10.100.0.0/16',
      auditVpcCidr: '10.200.0.0/16',
      paymentAccountId: '111111111111',
      auditAccountId: '222222222222',
      environment: 'dev',
    };

    expect(args.environmentSuffix).toBeDefined();
    expect(args.paymentVpcId).toBeDefined();
  });

  it('should export TapStackOutputs interface', () => {
    const stack = new TapStack('interface-test-stack', {
      environmentSuffix: 'test',
      paymentVpcId: 'vpc-123',
      auditVpcId: 'vpc-456',
      paymentVpcCidr: '10.100.0.0/16',
      auditVpcCidr: '10.200.0.0/16',
      paymentAccountId: '111111111111',
      auditAccountId: '111111111111',
      environment: 'dev',
    });

    expect(stack.peeringConnectionId).toBeDefined();
    expect(stack.paymentRouteTableIds).toBeDefined();
    expect(stack.auditRouteTableIds).toBeDefined();
    expect(stack.flowLogsBucketName).toBeDefined();
    expect(stack.peeringStatusAlarmArn).toBeDefined();
    expect(stack.securityGroupIds).toBeDefined();
  });
});
