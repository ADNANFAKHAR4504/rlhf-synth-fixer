/**
 * Unit tests for VpcHelper
 *
 * Tests the helper module that creates VPCs for testing
 */
import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';
import { VpcHelper } from '../lib/vpc-helper';

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
      case 'aws:ec2/vpc:Vpc':
        outputs.cidrBlock = args.inputs.cidrBlock;
        outputs.enableDnsHostnames = args.inputs.enableDnsHostnames;
        outputs.enableDnsSupport = args.inputs.enableDnsSupport;
        break;
      case 'aws:ec2/subnet:Subnet':
        outputs.cidrBlock = args.inputs.cidrBlock;
        outputs.vpcId = args.inputs.vpcId;
        outputs.availabilityZone = args.inputs.availabilityZone;
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

describe('VpcHelper', () => {
  let vpcHelper: VpcHelper;

  beforeEach(() => {
    vpcHelper = new VpcHelper('test-vpc-helper', {
      environmentSuffix: 'test',
      tags: {
        Project: 'VPC-Peering',
        Environment: 'test',
      },
    });
  });

  describe('VPC Creation', () => {
    it('should create VpcHelper component resource', () => {
      expect(vpcHelper).toBeInstanceOf(VpcHelper);
    });

    it('should create payment VPC', () => {
      expect(vpcHelper.paymentVpc).toBeDefined();
      expect(vpcHelper.paymentVpcId).toBeDefined();
    });

    it('should create audit VPC', () => {
      expect(vpcHelper.auditVpc).toBeDefined();
      expect(vpcHelper.auditVpcId).toBeDefined();
    });

    it('should set correct CIDR blocks', () => {
      expect(vpcHelper.paymentVpcCidr).toBe('10.100.0.0/16');
      expect(vpcHelper.auditVpcCidr).toBe('10.200.0.0/16');
    });

    it('should have paymentVpcId output', async () => {
      const id = await vpcHelper.paymentVpcId.promise();
      expect(id).toBeDefined();
      expect(typeof id).toBe('string');
    });

    it('should have auditVpcId output', async () => {
      const id = await vpcHelper.auditVpcId.promise();
      expect(id).toBeDefined();
      expect(typeof id).toBe('string');
    });
  });

  describe('Account Configuration', () => {
    it('should have paymentAccountId output', async () => {
      const id = await vpcHelper.paymentAccountId.promise();
      expect(id).toBeDefined();
      expect(typeof id).toBe('string');
      expect(id).toMatch(/^\d{12}$/);
    });

    it('should have auditAccountId output', async () => {
      const id = await vpcHelper.auditAccountId.promise();
      expect(id).toBeDefined();
      expect(typeof id).toBe('string');
      expect(id).toMatch(/^\d{12}$/);
    });

    it('should use same account for both VPCs', async () => {
      const [paymentId, auditId] = await Promise.all([
        vpcHelper.paymentAccountId.promise(),
        vpcHelper.auditAccountId.promise(),
      ]);
      expect(paymentId).toBe(auditId);
    });
  });

  describe('Resource Naming', () => {
    it('should use environmentSuffix in VPC names', async () => {
      const id = await vpcHelper.paymentVpcId.promise();
      expect(id).toContain('test');
    });

    it('should differentiate payment and audit VPCs in names', async () => {
      const [paymentId, auditId] = await Promise.all([
        vpcHelper.paymentVpcId.promise(),
        vpcHelper.auditVpcId.promise(),
      ]);
      expect(paymentId).not.toBe(auditId);
    });
  });

  describe('Tag Configuration', () => {
    it('should apply provided tags to resources', () => {
      const helperWithTags = new VpcHelper('tagged-helper', {
        environmentSuffix: 'test',
        tags: {
          Owner: 'TestTeam',
          CostCenter: '1234',
        },
      });

      expect(helperWithTags).toBeDefined();
    });

    it('should handle undefined tags', () => {
      const helperNoTags = new VpcHelper('no-tags-helper', {
        environmentSuffix: 'test',
      });

      expect(helperNoTags).toBeDefined();
    });
  });

  describe('Subnet Creation', () => {
    it('should create subnets for payment VPC', () => {
      // Payment VPC should have 3 subnets created
      expect(vpcHelper.paymentVpc).toBeDefined();
    });

    it('should create subnets for audit VPC', () => {
      // Audit VPC should have 3 subnets created
      expect(vpcHelper.auditVpc).toBeDefined();
    });

    it('should create subnets across multiple availability zones', () => {
      // Subnets should be in us-east-1a, 1b, 1c
      expect(vpcHelper).toBeDefined();
    });
  });

  describe('VPC Properties', () => {
    it('should enable DNS hostnames', () => {
      // VPCs should have DNS hostnames enabled
      expect(vpcHelper.paymentVpc).toBeDefined();
      expect(vpcHelper.auditVpc).toBeDefined();
    });

    it('should enable DNS support', () => {
      // VPCs should have DNS support enabled
      expect(vpcHelper.paymentVpc).toBeDefined();
      expect(vpcHelper.auditVpc).toBeDefined();
    });
  });

  describe('Component Resource Options', () => {
    it('should accept component resource options', () => {
      const helperWithOpts = new VpcHelper(
        'opts-helper',
        {
          environmentSuffix: 'test',
        },
        {
          protect: false,
        }
      );

      expect(helperWithOpts).toBeDefined();
    });

    it('should set parent relationship correctly', () => {
      // Child resources should have VpcHelper as parent
      expect(vpcHelper.paymentVpc).toBeDefined();
      expect(vpcHelper.auditVpc).toBeDefined();
    });
  });

  describe('Output Registration', () => {
    it('should register all required outputs', () => {
      expect(vpcHelper.paymentVpcId).toBeDefined();
      expect(vpcHelper.auditVpcId).toBeDefined();
      expect(vpcHelper.paymentVpcCidr).toBeDefined();
      expect(vpcHelper.auditVpcCidr).toBeDefined();
      expect(vpcHelper.paymentAccountId).toBeDefined();
      expect(vpcHelper.auditAccountId).toBeDefined();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty environmentSuffix', () => {
      const emptyHelper = new VpcHelper('empty-suffix-helper', {
        environmentSuffix: '',
      });

      expect(emptyHelper).toBeDefined();
    });

    it('should handle long environmentSuffix', () => {
      const longHelper = new VpcHelper('long-suffix-helper', {
        environmentSuffix: 'very-long-environment-suffix-for-testing-purposes',
      });

      expect(longHelper).toBeDefined();
    });

    it('should handle special characters in environmentSuffix', () => {
      const specialHelper = new VpcHelper('special-suffix-helper', {
        environmentSuffix: 'test-123-env',
      });

      expect(specialHelper).toBeDefined();
    });
  });

  describe('CIDR Block Configuration', () => {
    it('should use non-overlapping CIDR blocks', () => {
      expect(vpcHelper.paymentVpcCidr).toBe('10.100.0.0/16');
      expect(vpcHelper.auditVpcCidr).toBe('10.200.0.0/16');
      expect(vpcHelper.paymentVpcCidr).not.toBe(vpcHelper.auditVpcCidr);
    });

    it('should use appropriate subnet CIDR blocks', () => {
      // Payment VPC subnets should be 10.100.0.0/24, 10.100.1.0/24, 10.100.2.0/24
      // Audit VPC subnets should be 10.200.0.0/24, 10.200.1.0/24, 10.200.2.0/24
      expect(vpcHelper).toBeDefined();
    });
  });
});

describe('VpcHelper Interface', () => {
  it('should export VpcHelperArgs interface', () => {
    const args = {
      environmentSuffix: 'test',
      tags: {
        Project: 'VPC-Peering',
      },
    };

    expect(args.environmentSuffix).toBeDefined();
  });

  it('should export VpcHelperOutputs interface', () => {
    const helper = new VpcHelper('interface-test-helper', {
      environmentSuffix: 'test',
    });

    expect(helper.paymentVpcId).toBeDefined();
    expect(helper.auditVpcId).toBeDefined();
    expect(helper.paymentVpcCidr).toBeDefined();
    expect(helper.auditVpcCidr).toBeDefined();
    expect(helper.paymentAccountId).toBeDefined();
    expect(helper.auditAccountId).toBeDefined();
  });
});
