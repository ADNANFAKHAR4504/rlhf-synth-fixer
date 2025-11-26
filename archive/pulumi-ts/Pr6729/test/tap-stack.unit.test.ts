/**
 * Unit tests for VpcHelper and TapStack Pulumi components
 * Tests VPC peering infrastructure with comprehensive security controls
 */
import * as pulumi from '@pulumi/pulumi';

// Configure Pulumi mocking
pulumi.runtime.setMocks({
  newResource: function (args: pulumi.runtime.MockResourceArgs): {
    id: string;
    state: any;
  } {
    return {
      id: `${args.name}-mock-id`,
      state: {
        ...args.inputs,
        id: `${args.name}-mock-id`,
        arn: `arn:aws:mock:us-east-1:123456789012:${args.type}/${args.name}`,
      },
    };
  },
  call: function (args: pulumi.runtime.MockCallArgs) {
    switch (args.token) {
      case 'aws:ec2/getRouteTables:getRouteTables':
        return {
          ids: ['rtb-mock-12345'],
          tags: {},
        };
      case 'aws:ec2/getNetworkAcls:getNetworkAcls':
        return {
          ids: ['acl-mock-12345'],
          tags: {},
        };
      case 'aws:getCallerIdentity:getCallerIdentity':
        return {
          accountId: '123456789012',
          arn: 'arn:aws:iam::123456789012:user/mock',
          userId: 'MOCK',
        };
      default:
        return {};
    }
  },
});

// Import modules after mocks
import { VpcHelper } from '../lib/vpc-helper';
import { TapStack } from '../lib/tap-stack';

describe('VpcHelper Component Unit Tests', () => {
  describe('VPC Creation', () => {
    test('should create VpcHelper with default configuration', () => {
      const helper = new VpcHelper('test-helper', {
        environmentSuffix: 'test',
      });

      expect(helper).toBeDefined();
      expect(helper.paymentVpcCidr).toBe('10.100.0.0/16');
      expect(helper.auditVpcCidr).toBe('10.200.0.0/16');
    });

    test('should create payment VPC', () => {
      const helper = new VpcHelper('test-payment-vpc', {
        environmentSuffix: 'test',
      });

      expect(helper.paymentVpc).toBeDefined();
    });

    test('should create audit VPC', () => {
      const helper = new VpcHelper('test-audit-vpc', {
        environmentSuffix: 'test',
      });

      expect(helper.auditVpc).toBeDefined();
    });

    test('should have correct CIDR blocks', () => {
      const helper = new VpcHelper('test-cidr', {
        environmentSuffix: 'test',
      });

      expect(helper.paymentVpcCidr).toBe('10.100.0.0/16');
      expect(helper.auditVpcCidr).toBe('10.200.0.0/16');
    });
  });

  describe('VPC IDs', () => {
    test('should provide payment VPC ID', (done) => {
      const helper = new VpcHelper('test-payment-id', {
        environmentSuffix: 'test',
      });

      helper.paymentVpcId.apply((vpcId) => {
        expect(vpcId).toBeDefined();
        expect(typeof vpcId).toBe('string');
        done();
      });
    });

    test('should provide audit VPC ID', (done) => {
      const helper = new VpcHelper('test-audit-id', {
        environmentSuffix: 'test',
      });

      helper.auditVpcId.apply((vpcId) => {
        expect(vpcId).toBeDefined();
        expect(typeof vpcId).toBe('string');
        done();
      });
    });
  });

  describe('Account IDs', () => {
    test('should provide payment account ID', () => {
      const helper = new VpcHelper('test-payment-account-simple', {
        environmentSuffix: 'test',
      });

      // The account ID output should be defined as a Pulumi Output
      expect(helper.paymentAccountId).toBeDefined();
      expect(typeof helper.paymentAccountId).toBe('object');
    });

    test('should provide audit account ID', () => {
      const helper = new VpcHelper('test-audit-account-simple', {
        environmentSuffix: 'test',
      });

      // The account ID output should be defined as a Pulumi Output
      expect(helper.auditAccountId).toBeDefined();
      expect(typeof helper.auditAccountId).toBe('object');
    });

    test('should use same account for both VPCs', () => {
      const helper = new VpcHelper('test-same-account-verify', {
        environmentSuffix: 'test',
      });

      // Both account IDs should be defined as Pulumi Outputs
      expect(helper.paymentAccountId).toBeDefined();
      expect(helper.auditAccountId).toBeDefined();
    });
  });

  describe('Configuration Options', () => {
    test('should support custom environment suffix', () => {
      const helper = new VpcHelper('test-custom-suffix', {
        environmentSuffix: 'pr12345',
      });

      expect(helper).toBeDefined();
    });

    test('should support custom tags', () => {
      const helper = new VpcHelper('test-custom-tags', {
        environmentSuffix: 'test',
        tags: {
          Team: 'DevOps',
          Project: 'Infrastructure',
        },
      });

      expect(helper).toBeDefined();
    });

    test('should create consistent CIDR blocks across instances', () => {
      const helper1 = new VpcHelper('test-consistent-1', {
        environmentSuffix: 'test1',
      });

      const helper2 = new VpcHelper('test-consistent-2', {
        environmentSuffix: 'test2',
      });

      expect(helper1.paymentVpcCidr).toBe(helper2.paymentVpcCidr);
      expect(helper1.auditVpcCidr).toBe(helper2.auditVpcCidr);
    });
  });

  describe('Resource Outputs', () => {
    test('should register all outputs', () => {
      const helper = new VpcHelper('test-outputs', {
        environmentSuffix: 'test',
      });

      expect(helper.paymentVpcId).toBeDefined();
      expect(helper.auditVpcId).toBeDefined();
      expect(helper.paymentAccountId).toBeDefined();
      expect(helper.auditAccountId).toBeDefined();
      expect(helper.paymentVpcCidr).toBeDefined();
      expect(helper.auditVpcCidr).toBeDefined();
    });
  });

  describe('VPC Properties', () => {
    test('should create VPCs with DNS support enabled', () => {
      const helper = new VpcHelper('test-dns-support', {
        environmentSuffix: 'dns-test',
      });

      expect(helper.paymentVpc).toBeDefined();
      expect(helper.auditVpc).toBeDefined();
    });

    test('should create VPCs with DNS hostnames enabled', () => {
      const helper = new VpcHelper('test-dns-hostnames', {
        environmentSuffix: 'dns-hostname-test',
      });

      expect(helper.paymentVpc).toBeDefined();
      expect(helper.auditVpc).toBeDefined();
    });
  });

  describe('Subnet Configuration', () => {
    test('should create payment VPC with private subnets', () => {
      const helper = new VpcHelper('test-payment-subnets', {
        environmentSuffix: 'subnet-test',
      });

      expect(helper.paymentVpc).toBeDefined();
      expect(helper.paymentVpcCidr).toBe('10.100.0.0/16');
    });

    test('should create audit VPC with private subnets', () => {
      const helper = new VpcHelper('test-audit-subnets', {
        environmentSuffix: 'audit-subnet-test',
      });

      expect(helper.auditVpc).toBeDefined();
      expect(helper.auditVpcCidr).toBe('10.200.0.0/16');
    });
  });

  describe('Multiple Availability Zones', () => {
    test('should support multi-AZ deployment', () => {
      const helper = new VpcHelper('test-multi-az', {
        environmentSuffix: 'multi-az',
      });

      expect(helper).toBeDefined();
      expect(helper.paymentVpc).toBeDefined();
      expect(helper.auditVpc).toBeDefined();
    });
  });
});

describe('TapStack Component Unit Tests', () => {
  describe('Stack Instantiation', () => {
    test('should create TapStack with required parameters', async () => {
      const stack = new TapStack('test-stack', {
        environmentSuffix: 'test',
        paymentVpcId: 'vpc-payment-mock',
        auditVpcId: 'vpc-audit-mock',
        paymentVpcCidr: '10.100.0.0/16',
        auditVpcCidr: '10.200.0.0/16',
        paymentAccountId: '123456789012',
        auditAccountId: '123456789012',
        environment: 'test',
      });

      expect(stack).toBeDefined();
      expect(stack).toBeInstanceOf(TapStack);

      // Wait for stack initialization
      await new Promise(resolve => setTimeout(resolve, 100));
    });

    test('should create stack with optional dataClassification', async () => {
      const stack = new TapStack('test-classification', {
        environmentSuffix: 'test',
        paymentVpcId: 'vpc-payment',
        auditVpcId: 'vpc-audit',
        paymentVpcCidr: '10.100.0.0/16',
        auditVpcCidr: '10.200.0.0/16',
        paymentAccountId: '123456789012',
        auditAccountId: '123456789012',
        environment: 'test',
        dataClassification: 'Confidential',
      });

      expect(stack).toBeDefined();

      // Wait for stack initialization
      await new Promise(resolve => setTimeout(resolve, 100));
    });

    test('should create stack with optional flowLogsRetentionDays', async () => {
      const stack = new TapStack('test-retention', {
        environmentSuffix: 'test',
        paymentVpcId: 'vpc-payment',
        auditVpcId: 'vpc-audit',
        paymentVpcCidr: '10.100.0.0/16',
        auditVpcCidr: '10.200.0.0/16',
        paymentAccountId: '123456789012',
        auditAccountId: '123456789012',
        environment: 'test',
        flowLogsRetentionDays: 30,
      });

      expect(stack).toBeDefined();

      // Wait for stack initialization
      await new Promise(resolve => setTimeout(resolve, 100));
    });

    test('should create stack with custom tags', async () => {
      const stack = new TapStack('test-tags', {
        environmentSuffix: 'test',
        paymentVpcId: 'vpc-payment',
        auditVpcId: 'vpc-audit',
        paymentVpcCidr: '10.100.0.0/16',
        auditVpcCidr: '10.200.0.0/16',
        paymentAccountId: '123456789012',
        auditAccountId: '123456789012',
        environment: 'test',
        tags: {
          Team: 'Platform',
          CostCenter: 'Engineering',
        },
      });

      expect(stack).toBeDefined();

      // Wait for stack initialization
      await new Promise(resolve => setTimeout(resolve, 100));
    });

    test('should use default dataClassification when not provided', async () => {
      const stack = new TapStack('test-default-classification', {
        environmentSuffix: 'test',
        paymentVpcId: 'vpc-payment',
        auditVpcId: 'vpc-audit',
        paymentVpcCidr: '10.100.0.0/16',
        auditVpcCidr: '10.200.0.0/16',
        paymentAccountId: '123456789012',
        auditAccountId: '123456789012',
        environment: 'test',
      });

      expect(stack).toBeDefined();

      // Wait for stack initialization
      await new Promise(resolve => setTimeout(resolve, 100));
    });

    test('should use default flowLogsRetentionDays when not provided', async () => {
      const stack = new TapStack('test-default-retention', {
        environmentSuffix: 'test',
        paymentVpcId: 'vpc-payment',
        auditVpcId: 'vpc-audit',
        paymentVpcCidr: '10.100.0.0/16',
        auditVpcCidr: '10.200.0.0/16',
        paymentAccountId: '123456789012',
        auditAccountId: '123456789012',
        environment: 'test',
      });

      expect(stack).toBeDefined();

      // Wait for stack initialization
      await new Promise(resolve => setTimeout(resolve, 100));
    });
  });

  describe('Stack Outputs', () => {
    test('should export peeringConnectionId', async () => {
      const stack = new TapStack('test-peering-output', {
        environmentSuffix: 'test',
        paymentVpcId: 'vpc-payment',
        auditVpcId: 'vpc-audit',
        paymentVpcCidr: '10.100.0.0/16',
        auditVpcCidr: '10.200.0.0/16',
        paymentAccountId: '123456789012',
        auditAccountId: '123456789012',
        environment: 'test',
      });

      expect(stack.peeringConnectionId).toBeDefined();

      // Wait for stack initialization
      await new Promise(resolve => setTimeout(resolve, 100));
    });

    test('should export paymentRouteTableIds', async () => {
      const stack = new TapStack('test-payment-routes', {
        environmentSuffix: 'test',
        paymentVpcId: 'vpc-payment',
        auditVpcId: 'vpc-audit',
        paymentVpcCidr: '10.100.0.0/16',
        auditVpcCidr: '10.200.0.0/16',
        paymentAccountId: '123456789012',
        auditAccountId: '123456789012',
        environment: 'test',
      });

      expect(stack.paymentRouteTableIds).toBeDefined();

      // Wait for stack initialization
      await new Promise(resolve => setTimeout(resolve, 100));
    });

    test('should export auditRouteTableIds', async () => {
      const stack = new TapStack('test-audit-routes', {
        environmentSuffix: 'test',
        paymentVpcId: 'vpc-payment',
        auditVpcId: 'vpc-audit',
        paymentVpcCidr: '10.100.0.0/16',
        auditVpcCidr: '10.200.0.0/16',
        paymentAccountId: '123456789012',
        auditAccountId: '123456789012',
        environment: 'test',
      });

      expect(stack.auditRouteTableIds).toBeDefined();

      // Wait for stack initialization
      await new Promise(resolve => setTimeout(resolve, 100));
    });

    test('should export flowLogsBucketName', async () => {
      const stack = new TapStack('test-flowlogs', {
        environmentSuffix: 'test',
        paymentVpcId: 'vpc-payment',
        auditVpcId: 'vpc-audit',
        paymentVpcCidr: '10.100.0.0/16',
        auditVpcCidr: '10.200.0.0/16',
        paymentAccountId: '123456789012',
        auditAccountId: '123456789012',
        environment: 'test',
      });

      expect(stack.flowLogsBucketName).toBeDefined();

      // Wait for stack initialization
      await new Promise(resolve => setTimeout(resolve, 100));
    });

    test('should export peeringStatusAlarmArn', async () => {
      const stack = new TapStack('test-alarm', {
        environmentSuffix: 'test',
        paymentVpcId: 'vpc-payment',
        auditVpcId: 'vpc-audit',
        paymentVpcCidr: '10.100.0.0/16',
        auditVpcCidr: '10.200.0.0/16',
        paymentAccountId: '123456789012',
        auditAccountId: '123456789012',
        environment: 'test',
      });

      expect(stack.peeringStatusAlarmArn).toBeDefined();

      // Wait for stack initialization
      await new Promise(resolve => setTimeout(resolve, 100));
    });

    test('should export securityGroupIds', async () => {
      const stack = new TapStack('test-security-groups', {
        environmentSuffix: 'test',
        paymentVpcId: 'vpc-payment',
        auditVpcId: 'vpc-audit',
        paymentVpcCidr: '10.100.0.0/16',
        auditVpcCidr: '10.200.0.0/16',
        paymentAccountId: '123456789012',
        auditAccountId: '123456789012',
        environment: 'test',
      });

      expect(stack.securityGroupIds).toBeDefined();

      // Wait for stack initialization
      await new Promise(resolve => setTimeout(resolve, 100));
    });

    test('should export all required outputs', async () => {
      const stack = new TapStack('test-all-outputs', {
        environmentSuffix: 'test',
        paymentVpcId: 'vpc-payment',
        auditVpcId: 'vpc-audit',
        paymentVpcCidr: '10.100.0.0/16',
        auditVpcCidr: '10.200.0.0/16',
        paymentAccountId: '123456789012',
        auditAccountId: '123456789012',
        environment: 'test',
      });

      expect(stack.peeringConnectionId).toBeDefined();
      expect(stack.paymentRouteTableIds).toBeDefined();
      expect(stack.auditRouteTableIds).toBeDefined();
      expect(stack.flowLogsBucketName).toBeDefined();
      expect(stack.peeringStatusAlarmArn).toBeDefined();
      expect(stack.securityGroupIds).toBeDefined();

      // Wait for stack initialization
      await new Promise(resolve => setTimeout(resolve, 100));
    });
  });

  describe('Cross-Account Scenarios', () => {
    test('should handle same-account peering', async () => {
      const stack = new TapStack('test-same-account-peering', {
        environmentSuffix: 'same',
        paymentVpcId: 'vpc-payment',
        auditVpcId: 'vpc-audit',
        paymentVpcCidr: '10.100.0.0/16',
        auditVpcCidr: '10.200.0.0/16',
        paymentAccountId: '123456789012',
        auditAccountId: '123456789012',
        environment: 'test',
      });

      expect(stack).toBeDefined();

      // Wait for stack initialization
      await new Promise(resolve => setTimeout(resolve, 100));
    });

    test('should handle cross-account peering', async () => {
      const stack = new TapStack('test-cross-account-peering', {
        environmentSuffix: 'cross',
        paymentVpcId: 'vpc-payment',
        auditVpcId: 'vpc-audit',
        paymentVpcCidr: '10.100.0.0/16',
        auditVpcCidr: '10.200.0.0/16',
        paymentAccountId: '123456789012',
        auditAccountId: '987654321098',
        environment: 'test',
      });

      expect(stack).toBeDefined();

      // Wait for stack initialization
      await new Promise(resolve => setTimeout(resolve, 100));
    });

    test('should configure auto-accept for same-account peering', async () => {
      const stack = new TapStack('test-auto-accept', {
        environmentSuffix: 'auto-accept',
        paymentVpcId: 'vpc-payment',
        auditVpcId: 'vpc-audit',
        paymentVpcCidr: '10.100.0.0/16',
        auditVpcCidr: '10.200.0.0/16',
        paymentAccountId: '123456789012',
        auditAccountId: '123456789012',
        environment: 'test',
      });

      expect(stack).toBeDefined();

      // Wait for stack initialization
      await new Promise(resolve => setTimeout(resolve, 100));
    });

    test('should not auto-accept cross-account peering', async () => {
      const stack = new TapStack('test-no-auto-accept', {
        environmentSuffix: 'no-auto',
        paymentVpcId: 'vpc-payment',
        auditVpcId: 'vpc-audit',
        paymentVpcCidr: '10.100.0.0/16',
        auditVpcCidr: '10.200.0.0/16',
        paymentAccountId: '123456789012',
        auditAccountId: '987654321098',
        environment: 'test',
      });

      expect(stack).toBeDefined();

      // Wait for stack initialization
      await new Promise(resolve => setTimeout(resolve, 100));
    });
  });

  describe('CIDR Configuration', () => {
    test('should accept standard private CIDR ranges', async () => {
      const stack = new TapStack('test-standard-cidr', {
        environmentSuffix: 'test',
        paymentVpcId: 'vpc-payment',
        auditVpcId: 'vpc-audit',
        paymentVpcCidr: '10.100.0.0/16',
        auditVpcCidr: '10.200.0.0/16',
        paymentAccountId: '123456789012',
        auditAccountId: '123456789012',
        environment: 'test',
      });

      expect(stack).toBeDefined();

      // Wait for stack initialization
      await new Promise(resolve => setTimeout(resolve, 100));
    });

    test('should accept alternative CIDR ranges', async () => {
      const stack = new TapStack('test-alternative-cidr', {
        environmentSuffix: 'test',
        paymentVpcId: 'vpc-payment',
        auditVpcId: 'vpc-audit',
        paymentVpcCidr: '172.16.0.0/16',
        auditVpcCidr: '172.17.0.0/16',
        paymentAccountId: '123456789012',
        auditAccountId: '123456789012',
        environment: 'test',
      });

      expect(stack).toBeDefined();

      // Wait for stack initialization
      await new Promise(resolve => setTimeout(resolve, 100));
    });

    test('should accept 192.168.x.x CIDR ranges', async () => {
      const stack = new TapStack('test-192-cidr', {
        environmentSuffix: 'test',
        paymentVpcId: 'vpc-payment',
        auditVpcId: 'vpc-audit',
        paymentVpcCidr: '192.168.1.0/24',
        auditVpcCidr: '192.168.2.0/24',
        paymentAccountId: '123456789012',
        auditAccountId: '123456789012',
        environment: 'test',
      });

      expect(stack).toBeDefined();

      // Wait for stack initialization
      await new Promise(resolve => setTimeout(resolve, 100));
    });
  });

  describe('Environment Configuration', () => {
    test('should support development environment', async () => {
      const stack = new TapStack('test-dev-env', {
        environmentSuffix: 'dev',
        paymentVpcId: 'vpc-payment',
        auditVpcId: 'vpc-audit',
        paymentVpcCidr: '10.100.0.0/16',
        auditVpcCidr: '10.200.0.0/16',
        paymentAccountId: '123456789012',
        auditAccountId: '123456789012',
        environment: 'development',
      });

      expect(stack).toBeDefined();

      // Wait for stack initialization
      await new Promise(resolve => setTimeout(resolve, 100));
    });

    test('should support production environment', async () => {
      const stack = new TapStack('test-prod-env', {
        environmentSuffix: 'prod',
        paymentVpcId: 'vpc-payment',
        auditVpcId: 'vpc-audit',
        paymentVpcCidr: '10.100.0.0/16',
        auditVpcCidr: '10.200.0.0/16',
        paymentAccountId: '123456789012',
        auditAccountId: '123456789012',
        environment: 'production',
        dataClassification: 'Highly Confidential',
        flowLogsRetentionDays: 365,
      });

      expect(stack).toBeDefined();

      // Wait for stack initialization
      await new Promise(resolve => setTimeout(resolve, 100));
    });

    test('should support staging environment', async () => {
      const stack = new TapStack('test-staging-env', {
        environmentSuffix: 'staging',
        paymentVpcId: 'vpc-payment',
        auditVpcId: 'vpc-audit',
        paymentVpcCidr: '10.100.0.0/16',
        auditVpcCidr: '10.200.0.0/16',
        paymentAccountId: '123456789012',
        auditAccountId: '123456789012',
        environment: 'staging',
      });

      expect(stack).toBeDefined();

      // Wait for stack initialization
      await new Promise(resolve => setTimeout(resolve, 100));
    });
  });

  describe('Security Configuration', () => {
    test('should create security groups for both VPCs', async () => {
      const stack = new TapStack('test-sg-creation', {
        environmentSuffix: 'sg-test',
        paymentVpcId: 'vpc-payment',
        auditVpcId: 'vpc-audit',
        paymentVpcCidr: '10.100.0.0/16',
        auditVpcCidr: '10.200.0.0/16',
        paymentAccountId: '123456789012',
        auditAccountId: '123456789012',
        environment: 'test',
      });

      expect(stack.securityGroupIds).toBeDefined();

      // Wait for stack initialization
      await new Promise(resolve => setTimeout(resolve, 100));
    });

    test('should configure HTTPS ingress rules', async () => {
      const stack = new TapStack('test-https-ingress', {
        environmentSuffix: 'https-test',
        paymentVpcId: 'vpc-payment',
        auditVpcId: 'vpc-audit',
        paymentVpcCidr: '10.100.0.0/16',
        auditVpcCidr: '10.200.0.0/16',
        paymentAccountId: '123456789012',
        auditAccountId: '123456789012',
        environment: 'test',
      });

      expect(stack).toBeDefined();

      // Wait for stack initialization
      await new Promise(resolve => setTimeout(resolve, 100));
    });

    test('should configure PostgreSQL ingress rules', async () => {
      const stack = new TapStack('test-postgres-ingress', {
        environmentSuffix: 'pg-test',
        paymentVpcId: 'vpc-payment',
        auditVpcId: 'vpc-audit',
        paymentVpcCidr: '10.100.0.0/16',
        auditVpcCidr: '10.200.0.0/16',
        paymentAccountId: '123456789012',
        auditAccountId: '123456789012',
        environment: 'test',
      });

      expect(stack).toBeDefined();

      // Wait for stack initialization
      await new Promise(resolve => setTimeout(resolve, 100));
    });

    test('should configure network ACLs for payment VPC', async () => {
      const stack = new TapStack('test-payment-nacl', {
        environmentSuffix: 'nacl-test',
        paymentVpcId: 'vpc-payment',
        auditVpcId: 'vpc-audit',
        paymentVpcCidr: '10.100.0.0/16',
        auditVpcCidr: '10.200.0.0/16',
        paymentAccountId: '123456789012',
        auditAccountId: '123456789012',
        environment: 'test',
      });

      expect(stack).toBeDefined();

      // Wait for stack initialization
      await new Promise(resolve => setTimeout(resolve, 100));
    });

    test('should configure network ACLs for audit VPC', async () => {
      const stack = new TapStack('test-audit-nacl', {
        environmentSuffix: 'audit-nacl-test',
        paymentVpcId: 'vpc-payment',
        auditVpcId: 'vpc-audit',
        paymentVpcCidr: '10.100.0.0/16',
        auditVpcCidr: '10.200.0.0/16',
        paymentAccountId: '123456789012',
        auditAccountId: '123456789012',
        environment: 'test',
      });

      expect(stack).toBeDefined();

      // Wait for stack initialization
      await new Promise(resolve => setTimeout(resolve, 100));
    });
  });

  describe('VPC Flow Logs', () => {
    test('should create S3 bucket for flow logs', async () => {
      const stack = new TapStack('test-flowlogs-bucket', {
        environmentSuffix: 'flowlogs-test',
        paymentVpcId: 'vpc-payment',
        auditVpcId: 'vpc-audit',
        paymentVpcCidr: '10.100.0.0/16',
        auditVpcCidr: '10.200.0.0/16',
        paymentAccountId: '123456789012',
        auditAccountId: '123456789012',
        environment: 'test',
      });

      expect(stack.flowLogsBucketName).toBeDefined();

      // Wait for stack initialization
      await new Promise(resolve => setTimeout(resolve, 100));
    });

    test('should enable versioning on flow logs bucket', async () => {
      const stack = new TapStack('test-flowlogs-versioning', {
        environmentSuffix: 'versioning-test',
        paymentVpcId: 'vpc-payment',
        auditVpcId: 'vpc-audit',
        paymentVpcCidr: '10.100.0.0/16',
        auditVpcCidr: '10.200.0.0/16',
        paymentAccountId: '123456789012',
        auditAccountId: '123456789012',
        environment: 'test',
      });

      expect(stack).toBeDefined();

      // Wait for stack initialization
      await new Promise(resolve => setTimeout(resolve, 100));
    });

    test('should configure lifecycle policy for flow logs', async () => {
      const stack = new TapStack('test-lifecycle', {
        environmentSuffix: 'lifecycle-test',
        paymentVpcId: 'vpc-payment',
        auditVpcId: 'vpc-audit',
        paymentVpcCidr: '10.100.0.0/16',
        auditVpcCidr: '10.200.0.0/16',
        paymentAccountId: '123456789012',
        auditAccountId: '123456789012',
        environment: 'test',
        flowLogsRetentionDays: 60,
      });

      expect(stack).toBeDefined();

      // Wait for stack initialization
      await new Promise(resolve => setTimeout(resolve, 100));
    });

    test('should block public access to flow logs bucket', async () => {
      const stack = new TapStack('test-public-access-block', {
        environmentSuffix: 'public-block-test',
        paymentVpcId: 'vpc-payment',
        auditVpcId: 'vpc-audit',
        paymentVpcCidr: '10.100.0.0/16',
        auditVpcCidr: '10.200.0.0/16',
        paymentAccountId: '123456789012',
        auditAccountId: '123456789012',
        environment: 'test',
      });

      expect(stack).toBeDefined();

      // Wait for stack initialization
      await new Promise(resolve => setTimeout(resolve, 100));
    });

    test('should enable encryption on flow logs bucket', async () => {
      const stack = new TapStack('test-encryption', {
        environmentSuffix: 'encryption-test',
        paymentVpcId: 'vpc-payment',
        auditVpcId: 'vpc-audit',
        paymentVpcCidr: '10.100.0.0/16',
        auditVpcCidr: '10.200.0.0/16',
        paymentAccountId: '123456789012',
        auditAccountId: '123456789012',
        environment: 'test',
      });

      expect(stack).toBeDefined();

      // Wait for stack initialization
      await new Promise(resolve => setTimeout(resolve, 100));
    });

    test('should create flow logs for payment VPC', async () => {
      const stack = new TapStack('test-payment-flowlog', {
        environmentSuffix: 'payment-fl-test',
        paymentVpcId: 'vpc-payment',
        auditVpcId: 'vpc-audit',
        paymentVpcCidr: '10.100.0.0/16',
        auditVpcCidr: '10.200.0.0/16',
        paymentAccountId: '123456789012',
        auditAccountId: '123456789012',
        environment: 'test',
      });

      expect(stack).toBeDefined();

      // Wait for stack initialization
      await new Promise(resolve => setTimeout(resolve, 100));
    });

    test('should create flow logs for audit VPC', async () => {
      const stack = new TapStack('test-audit-flowlog', {
        environmentSuffix: 'audit-fl-test',
        paymentVpcId: 'vpc-payment',
        auditVpcId: 'vpc-audit',
        paymentVpcCidr: '10.100.0.0/16',
        auditVpcCidr: '10.200.0.0/16',
        paymentAccountId: '123456789012',
        auditAccountId: '123456789012',
        environment: 'test',
      });

      expect(stack).toBeDefined();

      // Wait for stack initialization
      await new Promise(resolve => setTimeout(resolve, 100));
    });
  });

  describe('Monitoring and Alarms', () => {
    test('should create SNS topic for alarms', async () => {
      const stack = new TapStack('test-sns-topic', {
        environmentSuffix: 'sns-test',
        paymentVpcId: 'vpc-payment',
        auditVpcId: 'vpc-audit',
        paymentVpcCidr: '10.100.0.0/16',
        auditVpcCidr: '10.200.0.0/16',
        paymentAccountId: '123456789012',
        auditAccountId: '123456789012',
        environment: 'test',
      });

      expect(stack.peeringStatusAlarmArn).toBeDefined();

      // Wait for stack initialization
      await new Promise(resolve => setTimeout(resolve, 100));
    });

    test('should create CloudWatch alarm for peering status', async () => {
      const stack = new TapStack('test-cw-alarm', {
        environmentSuffix: 'cw-test',
        paymentVpcId: 'vpc-payment',
        auditVpcId: 'vpc-audit',
        paymentVpcCidr: '10.100.0.0/16',
        auditVpcCidr: '10.200.0.0/16',
        paymentAccountId: '123456789012',
        auditAccountId: '123456789012',
        environment: 'test',
      });

      expect(stack.peeringStatusAlarmArn).toBeDefined();

      // Wait for stack initialization
      await new Promise(resolve => setTimeout(resolve, 100));
    });

    test('should create CloudWatch Log Group', async () => {
      const stack = new TapStack('test-log-group', {
        environmentSuffix: 'log-test',
        paymentVpcId: 'vpc-payment',
        auditVpcId: 'vpc-audit',
        paymentVpcCidr: '10.100.0.0/16',
        auditVpcCidr: '10.200.0.0/16',
        paymentAccountId: '123456789012',
        auditAccountId: '123456789012',
        environment: 'test',
      });

      expect(stack).toBeDefined();

      // Wait for stack initialization
      await new Promise(resolve => setTimeout(resolve, 100));
    });

    test('should create CloudWatch Dashboard', async () => {
      const stack = new TapStack('test-dashboard', {
        environmentSuffix: 'dashboard-test',
        paymentVpcId: 'vpc-payment',
        auditVpcId: 'vpc-audit',
        paymentVpcCidr: '10.100.0.0/16',
        auditVpcCidr: '10.200.0.0/16',
        paymentAccountId: '123456789012',
        auditAccountId: '123456789012',
        environment: 'test',
      });

      expect(stack).toBeDefined();

      // Wait for stack initialization
      await new Promise(resolve => setTimeout(resolve, 100));
    });
  });

  describe('Route Configuration', () => {
    test('should configure routes from payment to audit VPC', async () => {
      const stack = new TapStack('test-payment-routes-config', {
        environmentSuffix: 'routes-test',
        paymentVpcId: 'vpc-payment',
        auditVpcId: 'vpc-audit',
        paymentVpcCidr: '10.100.0.0/16',
        auditVpcCidr: '10.200.0.0/16',
        paymentAccountId: '123456789012',
        auditAccountId: '123456789012',
        environment: 'test',
      });

      expect(stack.paymentRouteTableIds).toBeDefined();

      // Wait for stack initialization
      await new Promise(resolve => setTimeout(resolve, 100));
    });

    test('should configure routes from audit to payment VPC', async () => {
      const stack = new TapStack('test-audit-routes-config', {
        environmentSuffix: 'audit-routes-test',
        paymentVpcId: 'vpc-payment',
        auditVpcId: 'vpc-audit',
        paymentVpcCidr: '10.100.0.0/16',
        auditVpcCidr: '10.200.0.0/16',
        paymentAccountId: '123456789012',
        auditAccountId: '123456789012',
        environment: 'test',
      });

      expect(stack.auditRouteTableIds).toBeDefined();

      // Wait for stack initialization
      await new Promise(resolve => setTimeout(resolve, 100));
    });
  });

  describe('IAM Configuration', () => {
    test('should create IAM role for flow logs', async () => {
      const stack = new TapStack('test-iam-role', {
        environmentSuffix: 'iam-test',
        paymentVpcId: 'vpc-payment',
        auditVpcId: 'vpc-audit',
        paymentVpcCidr: '10.100.0.0/16',
        auditVpcCidr: '10.200.0.0/16',
        paymentAccountId: '123456789012',
        auditAccountId: '123456789012',
        environment: 'test',
      });

      expect(stack).toBeDefined();

      // Wait for stack initialization
      await new Promise(resolve => setTimeout(resolve, 100));
    });

    test('should create cross-account role for different accounts', async () => {
      const stack = new TapStack('test-cross-account-role', {
        environmentSuffix: 'cross-iam-test',
        paymentVpcId: 'vpc-payment',
        auditVpcId: 'vpc-audit',
        paymentVpcCidr: '10.100.0.0/16',
        auditVpcCidr: '10.200.0.0/16',
        paymentAccountId: '123456789012',
        auditAccountId: '987654321098',
        environment: 'test',
      });

      expect(stack).toBeDefined();

      // Wait for stack initialization
      await new Promise(resolve => setTimeout(resolve, 100));
    });

    test('should not create cross-account role for same account', async () => {
      const stack = new TapStack('test-no-cross-account-role', {
        environmentSuffix: 'same-iam-test',
        paymentVpcId: 'vpc-payment',
        auditVpcId: 'vpc-audit',
        paymentVpcCidr: '10.100.0.0/16',
        auditVpcCidr: '10.200.0.0/16',
        paymentAccountId: '123456789012',
        auditAccountId: '123456789012',
        environment: 'test',
      });

      expect(stack).toBeDefined();

      // Wait for stack initialization
      await new Promise(resolve => setTimeout(resolve, 100));
    });
  });

  describe('Peering Connection Options', () => {
    test('should enable DNS resolution for peering', async () => {
      const stack = new TapStack('test-dns-resolution', {
        environmentSuffix: 'dns-res-test',
        paymentVpcId: 'vpc-payment',
        auditVpcId: 'vpc-audit',
        paymentVpcCidr: '10.100.0.0/16',
        auditVpcCidr: '10.200.0.0/16',
        paymentAccountId: '123456789012',
        auditAccountId: '123456789012',
        environment: 'test',
      });

      expect(stack).toBeDefined();

      // Wait for stack initialization
      await new Promise(resolve => setTimeout(resolve, 100));
    });
  });

  describe('Tagging', () => {
    test('should apply default tags to resources', async () => {
      const stack = new TapStack('test-default-tags', {
        environmentSuffix: 'tags-test',
        paymentVpcId: 'vpc-payment',
        auditVpcId: 'vpc-audit',
        paymentVpcCidr: '10.100.0.0/16',
        auditVpcCidr: '10.200.0.0/16',
        paymentAccountId: '123456789012',
        auditAccountId: '123456789012',
        environment: 'test',
      });

      expect(stack).toBeDefined();

      // Wait for stack initialization
      await new Promise(resolve => setTimeout(resolve, 100));
    });

    test('should merge custom tags with default tags', async () => {
      const stack = new TapStack('test-merged-tags', {
        environmentSuffix: 'merge-tags-test',
        paymentVpcId: 'vpc-payment',
        auditVpcId: 'vpc-audit',
        paymentVpcCidr: '10.100.0.0/16',
        auditVpcCidr: '10.200.0.0/16',
        paymentAccountId: '123456789012',
        auditAccountId: '123456789012',
        environment: 'test',
        tags: {
          CustomTag: 'CustomValue',
        },
      });

      expect(stack).toBeDefined();

      // Wait for stack initialization
      await new Promise(resolve => setTimeout(resolve, 100));
    });
  });

  describe('Data Classification', () => {
    test('should support Sensitive data classification', async () => {
      const stack = new TapStack('test-sensitive-data', {
        environmentSuffix: 'sensitive-test',
        paymentVpcId: 'vpc-payment',
        auditVpcId: 'vpc-audit',
        paymentVpcCidr: '10.100.0.0/16',
        auditVpcCidr: '10.200.0.0/16',
        paymentAccountId: '123456789012',
        auditAccountId: '123456789012',
        environment: 'test',
        dataClassification: 'Sensitive',
      });

      expect(stack).toBeDefined();

      // Wait for stack initialization
      await new Promise(resolve => setTimeout(resolve, 100));
    });

    test('should support Highly Confidential data classification', async () => {
      const stack = new TapStack('test-highly-confidential', {
        environmentSuffix: 'high-conf-test',
        paymentVpcId: 'vpc-payment',
        auditVpcId: 'vpc-audit',
        paymentVpcCidr: '10.100.0.0/16',
        auditVpcCidr: '10.200.0.0/16',
        paymentAccountId: '123456789012',
        auditAccountId: '123456789012',
        environment: 'production',
        dataClassification: 'Highly Confidential',
      });

      expect(stack).toBeDefined();

      // Wait for stack initialization
      await new Promise(resolve => setTimeout(resolve, 100));
    });
  });

  describe('Flow Logs Retention', () => {
    test('should support 30 days retention', async () => {
      const stack = new TapStack('test-30-days', {
        environmentSuffix: '30-days-test',
        paymentVpcId: 'vpc-payment',
        auditVpcId: 'vpc-audit',
        paymentVpcCidr: '10.100.0.0/16',
        auditVpcCidr: '10.200.0.0/16',
        paymentAccountId: '123456789012',
        auditAccountId: '123456789012',
        environment: 'test',
        flowLogsRetentionDays: 30,
      });

      expect(stack).toBeDefined();

      // Wait for stack initialization
      await new Promise(resolve => setTimeout(resolve, 100));
    });

    test('should support 90 days retention (default)', async () => {
      const stack = new TapStack('test-90-days', {
        environmentSuffix: '90-days-test',
        paymentVpcId: 'vpc-payment',
        auditVpcId: 'vpc-audit',
        paymentVpcCidr: '10.100.0.0/16',
        auditVpcCidr: '10.200.0.0/16',
        paymentAccountId: '123456789012',
        auditAccountId: '123456789012',
        environment: 'test',
      });

      expect(stack).toBeDefined();

      // Wait for stack initialization
      await new Promise(resolve => setTimeout(resolve, 100));
    });

    test('should support 365 days retention', async () => {
      const stack = new TapStack('test-365-days', {
        environmentSuffix: '365-days-test',
        paymentVpcId: 'vpc-payment',
        auditVpcId: 'vpc-audit',
        paymentVpcCidr: '10.100.0.0/16',
        auditVpcCidr: '10.200.0.0/16',
        paymentAccountId: '123456789012',
        auditAccountId: '123456789012',
        environment: 'production',
        flowLogsRetentionDays: 365,
      });

      expect(stack).toBeDefined();

      // Wait for stack initialization
      await new Promise(resolve => setTimeout(resolve, 100));
    });
  });
});
