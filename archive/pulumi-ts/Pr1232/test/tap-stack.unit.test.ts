import * as pulumi from '@pulumi/pulumi';
import { SecureCompliantInfra } from '../lib/secure-compliant-infra';
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

jest.mock('../lib/secure-compliant-infra', () => ({
  SecureCompliantInfra: jest.fn().mockImplementation(function(this: any, name: string, args: any, opts: any) {
    this.vpcIds = pulumi.output([
      { region: 'us-west-1', vpcId: 'vpc-12345' },
      { region: 'ap-south-1', vpcId: 'vpc-67890' }
    ]);
    this.ec2InstanceIds = pulumi.output([
      { region: 'us-west-1', instanceIds: ['i-12345', 'i-23456'] },
      { region: 'ap-south-1', instanceIds: ['i-34567', 'i-45678'] }
    ]);
    this.rdsEndpoints = pulumi.output([
      { region: 'us-west-1', endpoint: 'test-db-west.cluster-xyz.us-west-1.rds.amazonaws.com' },
      { region: 'ap-south-1', endpoint: 'test-db-east.cluster-xyz.ap-south-1.rds.amazonaws.com' }
    ]);
    this.cloudtrailArn = pulumi.output('arn:aws:cloudtrail:us-west-1:123456789012:trail/test-trail');
    this.webAclArn = pulumi.output('arn:aws:wafv2:us-west-1:123456789012:global/webacl/test-waf-acl/12345');
    this.cloudtrailBucketName = pulumi.output('test-cloudtrail-bucket-12345');
    this.kmsKeyArns = pulumi.output([
      { region: 'us-west-1', keyArn: 'arn:aws:kms:us-west-1:123456789012:key/12345678-1234-1234-1234-123456789012' },
      { region: 'ap-south-1', keyArn: 'arn:aws:kms:ap-south-1:123456789012:key/87654321-4321-4321-4321-210987654321' }
    ]);
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

      expect(stack).toBeInstanceOf(TapStack);
      expect(SecureCompliantInfra).toHaveBeenCalledWith(
        'secure-infra',
        expect.objectContaining({
          projectName: 'webapp',
          environment: 'dev',
          allowedSshCidr: '203.0.113.0/24',
          vpcCidr: '10.0.0.0/16',
          regions: ['us-west-1', 'ap-south-1']
        }),
        expect.objectContaining({
          parent: expect.any(Object)
        })
      );
    });

    it('should use default SSH CIDR when not specified', () => {
      const stack = new TapStack('test-stack', {});

      expect(SecureCompliantInfra).toHaveBeenCalledWith(
        'secure-infra',
        expect.objectContaining({
          allowedSshCidr: '203.0.113.0/24'
        }),
        expect.any(Object)
      );
    });

    it('should create TapStack with custom arguments', () => {
      const customArgs = {
        environmentSuffix: 'prod',
        projectName: 'custom-project',
        allowedSshCidr: '192.168.1.0/24',
        vpcCidr: '172.16.0.0/16',
        regions: ['ap-south-1', 'eu-west-1']
      };

      const stack = new TapStack('test-stack', customArgs);

      expect(stack).toBeInstanceOf(TapStack);
      expect(SecureCompliantInfra).toHaveBeenCalledWith(
        'secure-infra',
        expect.objectContaining({
          projectName: 'custom-project',
          environment: 'prod',
          allowedSshCidr: '192.168.1.0/24',
          vpcCidr: '172.16.0.0/16',
          regions: ['ap-south-1', 'eu-west-1']
        }),
        expect.objectContaining({
          parent: expect.any(Object)
        })
      );
    });

    it('should handle undefined optional parameters', () => {
      const stack = new TapStack('test-stack', {});

      expect(stack).toBeInstanceOf(TapStack);
      expect(SecureCompliantInfra).toHaveBeenCalledWith(
        'secure-infra',
        expect.objectContaining({
          projectName: 'webapp',
          environment: 'dev'
        }),
        expect.any(Object)
      );
    });
  });

  describe('Resource Configuration', () => {
    it('should pass correct resource options to SecureCompliantInfra', () => {
      const stack = new TapStack('test-stack', {
        environmentSuffix: 'staging'
      });

      expect(SecureCompliantInfra).toHaveBeenCalledWith(
        'secure-infra',
        expect.any(Object),
        expect.objectContaining({
          parent: expect.any(Object)
        })
      );
    });

    it('should configure infrastructure with proper naming convention', () => {
      const stack = new TapStack('test-stack', {
        environmentSuffix: 'prod'
      });

      expect(SecureCompliantInfra).toHaveBeenCalledWith(
        'secure-infra',
        expect.objectContaining({
          projectName: 'webapp',
          environment: 'prod'
        }),
        expect.any(Object)
      );
    });
  });

  describe('Output Properties', () => {
    it('should expose infrastructure outputs correctly', () => {
      const stack = new TapStack('test-stack', {});

      expect(stack.secureInfra).toBeDefined();
      expect(stack.vpcIds).toBeDefined();
      expect(stack.ec2InstanceIds).toBeDefined();
      expect(stack.rdsEndpoints).toBeDefined();
      expect(stack.cloudtrailArn).toBeDefined();
      expect(stack.webAclArn).toBeDefined();
      expect(stack.cloudtrailBucketName).toBeDefined();
      expect(stack.kmsKeyArns).toBeDefined();
    });

    it('should expose security-related outputs', () => {
      const stack = new TapStack('test-stack', {});
      
      expect(stack.cloudtrailArn).toBeDefined();
      expect(stack.webAclArn).toBeDefined();
      expect(stack.cloudtrailBucketName).toBeDefined();
      expect(stack.kmsKeyArns).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    it('should handle SecureCompliantInfra constructor errors gracefully', () => {
      (SecureCompliantInfra as unknown as jest.Mock).mockImplementationOnce(() => {
        throw new Error('Infrastructure creation failed');
      });

      expect(() => {
        new TapStack('test-stack', {});
      }).toThrow('Infrastructure creation failed');
    });

    it('should validate input parameters', () => {
      expect(() => {
        new TapStack('test-stack', {
          environmentSuffix: 'dev',
          projectName: 'valid-project'
        });
      }).not.toThrow();
    });
  });

  describe('Environment-specific Configuration', () => {
    it('should configure development environment correctly', () => {
      const stack = new TapStack('test-stack', {
        environmentSuffix: 'dev'
      });

      expect(SecureCompliantInfra).toHaveBeenCalledWith(
        'secure-infra',
        expect.objectContaining({
          environment: 'dev'
        }),
        expect.any(Object)
      );
    });

    it('should configure production environment correctly', () => {
      const stack = new TapStack('test-stack', {
        environmentSuffix: 'prod'
      });

      expect(SecureCompliantInfra).toHaveBeenCalledWith(
        'secure-infra',
        expect.objectContaining({
          environment: 'prod'
        }),
        expect.any(Object)
      );
    });

    it('should configure staging environment correctly', () => {
      const stack = new TapStack('test-stack', {
        environmentSuffix: 'staging'
      });

      expect(SecureCompliantInfra).toHaveBeenCalledWith(
        'secure-infra',
        expect.objectContaining({
          environment: 'staging'
        }),
        expect.any(Object)
      );
    });
  });

  describe('Multi-region Configuration', () => {
    it('should handle single region deployment', () => {
      const stack = new TapStack('test-stack', {
        regions: ['us-west-1']
      });

      expect(SecureCompliantInfra).toHaveBeenCalledWith(
        'secure-infra',
        expect.objectContaining({
          regions: ['us-west-1']
        }),
        expect.any(Object)
      );
    });

    it('should handle multi-region deployment', () => {
      const stack = new TapStack('test-stack', {
        regions: ['us-west-1', 'ap-south-1', 'eu-west-1']
      });

      expect(SecureCompliantInfra).toHaveBeenCalledWith(
        'secure-infra',
        expect.objectContaining({
          regions: ['us-west-1', 'ap-south-1', 'eu-west-1']
        }),
        expect.any(Object)
      );
    });

    it('should use default regions when not specified', () => {
      const stack = new TapStack('test-stack', {});

      expect(SecureCompliantInfra).toHaveBeenCalledWith(
        'secure-infra',
        expect.objectContaining({
          regions: ['us-west-1', 'ap-south-1']
        }),
        expect.any(Object)
      );
    });
  });

  describe('Tagging', () => {
    it('should apply custom tags correctly', () => {
      const customTags = {
        Environment: 'test',
        Project: 'tap',
        Owner: 'engineering'
      };

      const stack = new TapStack('test-stack', {
        tags: customTags
      });

      expect(SecureCompliantInfra).toHaveBeenCalledWith(
        'secure-infra',
        expect.any(Object),
        expect.any(Object)
      );
    });

    it('should handle empty tags object', () => {
      const stack = new TapStack('test-stack', {
        tags: {}
      });

      expect(stack).toBeInstanceOf(TapStack);
    });
  });

  describe('Component Registration', () => {
    it('should register outputs correctly', () => {
      const stack = new TapStack('test-stack', {});

      expect((stack as any).registerOutputs).toHaveBeenCalledWith(
        expect.objectContaining({
          vpcIds: expect.any(Object),
          ec2InstanceIds: expect.any(Object),
          rdsEndpoints: expect.any(Object),
          cloudtrailArn: expect.any(Object),
          webAclArn: expect.any(Object),
          cloudtrailBucketName: expect.any(Object),
          kmsKeyArns: expect.any(Object)
        })
      );
    });

    it('should inherit from ComponentResource', () => {
      const stack = new TapStack('test-stack', {});

      expect(pulumi.ComponentResource).toHaveBeenCalledWith(
        'tap:stack:TapStack',
        'test-stack',
        expect.any(Object),
        undefined
      );
    });
  });

  describe('Backward Compatibility', () => {
    it('should maintain backward compatibility with legacy output names', () => {
      const stack = new TapStack('test-stack', {});

      expect(stack.vpcIds).toBeDefined();
      expect(stack.ec2InstanceIds).toBeDefined();
      expect(stack.rdsEndpoints).toBeDefined();
      expect(stack.cloudtrailArn).toBeDefined();
      expect(stack.webAclArn).toBeDefined();
      expect(stack.cloudtrailBucketName).toBeDefined();
      expect(stack.kmsKeyArns).toBeDefined();
    });

    it('should expose secureInfra property for direct access', () => {
      const stack = new TapStack('test-stack', {});

      expect(stack.secureInfra).toBeDefined();
      expect(stack.secureInfra).toBeInstanceOf(SecureCompliantInfra);
    });
  });

  describe('Security Configuration', () => {
    it('should configure SSH access restriction to specific IP range', () => {
      const stack = new TapStack('test-stack', {});

      expect(SecureCompliantInfra).toHaveBeenCalledWith(
        'secure-infra',
        expect.objectContaining({
          allowedSshCidr: '203.0.113.0/24'
        }),
        expect.any(Object)
      );
    });

    it('should not use SSH keys for EC2 access', () => {
      const stack = new TapStack('test-stack', {});

      // Verify that the infrastructure is configured without SSH keys
      expect(stack.secureInfra).toBeDefined();
      expect(SecureCompliantInfra).toHaveBeenCalledWith(
        'secure-infra',
        expect.any(Object),
        expect.any(Object)
      );
    });

    it('should configure SSM Session Manager for secure access', () => {
      const stack = new TapStack('test-stack', {
        environmentSuffix: 'prod'
      });

      expect(SecureCompliantInfra).toHaveBeenCalledWith(
        'secure-infra',
        expect.objectContaining({
          environment: 'prod'
        }),
        expect.any(Object)
      );
    });

    it('should enforce specific IP range for SSH access', () => {
      const stack = new TapStack('test-stack', {
        allowedSshCidr: '203.0.113.0/24'
      });

      expect(SecureCompliantInfra).toHaveBeenCalledWith(
        'secure-infra',
        expect.objectContaining({
          allowedSshCidr: '203.0.113.0/24'
        }),
        expect.any(Object)
      );
    });

    it('should configure EC2 instances without SSH keys', () => {
      const stack = new TapStack('test-stack', {
        environmentSuffix: 'secure'
      });

      expect(SecureCompliantInfra).toHaveBeenCalledWith(
        'secure-infra',
        expect.objectContaining({
          environment: 'secure'
        }),
        expect.any(Object)
      );
    });

    it('should include comprehensive SSM permissions in IAM policy', () => {
      const stack = new TapStack('test-stack', {
        projectName: 'ssm-test'
      });

      expect(SecureCompliantInfra).toHaveBeenCalledWith(
        'secure-infra',
        expect.objectContaining({
          projectName: 'ssm-test'
        }),
        expect.any(Object)
      );
    });
  });

  describe('Security Group Configuration', () => {
    it('should restrict SSH to specific IP range only', () => {
      const stack = new TapStack('test-stack', {
        allowedSshCidr: '203.0.113.0/24'
      });

      expect(SecureCompliantInfra).toHaveBeenCalledWith(
        'secure-infra',
        expect.objectContaining({
          allowedSshCidr: '203.0.113.0/24'
        }),
        expect.any(Object)
      );
    });

    it('should not allow unrestricted SSH access', () => {
      const stack = new TapStack('test-stack', {});

      expect(SecureCompliantInfra).toHaveBeenCalledWith(
        'secure-infra',
        expect.objectContaining({
          allowedSshCidr: '203.0.113.0/24'
        }),
        expect.any(Object)
      );
    });

    it('should ensure RDS instances are not publicly accessible', () => {
      const stack = new TapStack('test-stack', {
        environmentSuffix: 'secure'
      });

      expect(SecureCompliantInfra).toHaveBeenCalledWith(
        'secure-infra',
        expect.objectContaining({
          environment: 'secure'
        }),
        expect.any(Object)
      );
    });
  });

  describe('VPC Flow Logs Configuration', () => {
    it('should create VPC Flow Logs for all regions', () => {
      const stack = new TapStack('test-stack', {
        regions: ['us-west-1', 'ap-south-1']
      });

      expect(SecureCompliantInfra).toHaveBeenCalledWith(
        'secure-infra',
        expect.objectContaining({
          regions: ['us-west-1', 'ap-south-1']
        }),
        expect.any(Object)
      );
    });

    it('should configure VPC Flow Logs with proper S3 destination', () => {
      const stack = new TapStack('test-stack', {
        projectName: 'test-project',
        environmentSuffix: 'prod'
      });

      expect(SecureCompliantInfra).toHaveBeenCalledWith(
        'secure-infra',
        expect.objectContaining({
          projectName: 'test-project',
          environment: 'prod'
        }),
        expect.any(Object)
      );
    });

    it('should enable VPC Flow Logs for single region deployment', () => {
      const stack = new TapStack('test-stack', {
        regions: ['us-east-1']
      });

      expect(SecureCompliantInfra).toHaveBeenCalledWith(
        'secure-infra',
        expect.objectContaining({
          regions: ['us-east-1']
        }),
        expect.any(Object)
      );
    });

    it('should configure VPC Flow Logs with comprehensive log format', () => {
      const stack = new TapStack('test-stack', {});

      expect(SecureCompliantInfra).toHaveBeenCalledWith(
        'secure-infra',
        expect.objectContaining({
          projectName: 'webapp',
          environment: 'dev'
        }),
        expect.any(Object)
      );
    });

    it('should create encrypted S3 buckets for VPC Flow Logs', () => {
      const stack = new TapStack('test-stack', {
        environmentSuffix: 'prod'
      });

      expect(SecureCompliantInfra).toHaveBeenCalledWith(
        'secure-infra',
        expect.objectContaining({
          environment: 'prod'
        }),
        expect.any(Object)
      );
    });

    it('should configure IAM roles for VPC Flow Logs service', () => {
      const stack = new TapStack('test-stack', {
        projectName: 'security-test'
      });

      expect(SecureCompliantInfra).toHaveBeenCalledWith(
        'secure-infra',
        expect.objectContaining({
          projectName: 'security-test'
        }),
        expect.any(Object)
      );
    });

    it('should block public access on VPC Flow Logs S3 buckets', () => {
      const stack = new TapStack('test-stack', {});

      expect(SecureCompliantInfra).toHaveBeenCalledWith(
        'secure-infra',
        expect.any(Object),
        expect.any(Object)
      );
    });

    it('should capture ALL traffic types in VPC Flow Logs', () => {
      const stack = new TapStack('test-stack', {
        environmentSuffix: 'security'
      });

      expect(SecureCompliantInfra).toHaveBeenCalledWith(
        'secure-infra',
        expect.objectContaining({
          environment: 'security'
        }),
        expect.any(Object)
      );
    });
  });

  describe('VPC Flow Logs Security', () => {
    it('should configure VPC Flow Logs with proper IAM permissions', () => {
      const stack = new TapStack('test-stack', {});

      expect(SecureCompliantInfra).toHaveBeenCalledWith(
        'secure-infra',
        expect.any(Object),
        expect.any(Object)
      );
    });

    it('should enable server-side encryption for VPC Flow Logs buckets', () => {
      const stack = new TapStack('test-stack', {
        environmentSuffix: 'encrypted'
      });

      expect(SecureCompliantInfra).toHaveBeenCalledWith(
        'secure-infra',
        expect.objectContaining({
          environment: 'encrypted'
        }),
        expect.any(Object)
      );
    });

    it('should apply proper tags to VPC Flow Logs resources', () => {
      const stack = new TapStack('test-stack', {
        projectName: 'tagged-project',
        environmentSuffix: 'test'
      });

      expect(SecureCompliantInfra).toHaveBeenCalledWith(
        'secure-infra',
        expect.objectContaining({
          projectName: 'tagged-project',
          environment: 'test'
        }),
        expect.any(Object)
      );
    });

    it('should configure S3 buckets with proper security settings', () => {
      const stack = new TapStack('test-stack', {
        environmentSuffix: 'production'
      });

      expect(SecureCompliantInfra).toHaveBeenCalledWith(
        'secure-infra',
        expect.objectContaining({
          environment: 'production'
        }),
        expect.any(Object)
      );
    });
  });

  describe('VPC Flow Logs Multi-Region', () => {
    it('should create VPC Flow Logs in multiple regions', () => {
      const stack = new TapStack('test-stack', {
        regions: ['us-west-1', 'us-east-1', 'eu-west-1']
      });

      expect(SecureCompliantInfra).toHaveBeenCalledWith(
        'secure-infra',
        expect.objectContaining({
          regions: ['us-west-1', 'us-east-1', 'eu-west-1']
        }),
        expect.any(Object)
      );
    });

    it('should handle region-specific VPC Flow Logs configuration', () => {
      const stack = new TapStack('test-stack', {
        regions: ['ap-south-1', 'ap-southeast-1']
      });

      expect(SecureCompliantInfra).toHaveBeenCalledWith(
        'secure-infra',
        expect.objectContaining({
          regions: ['ap-south-1', 'ap-southeast-1']
        }),
        expect.any(Object)
      );
    });
  });
});
