// Mock Pulumi before importing
jest.mock('@pulumi/pulumi', () => ({
  runtime: {
    setMocks: jest.fn(),
  },
  ComponentResource: class MockComponentResource {
    constructor(type: string, name: string, args: any, opts?: any) {
      // Mock implementation
    }
    registerOutputs(outputs: any) {
      // Mock implementation
    }
  },
  all: jest.fn().mockImplementation((values) => ({
    apply: jest.fn().mockImplementation((fn) => fn(['mock-bucket-arn', 'mock-bucket-name'])),
  })),
  Output: jest.fn(),
}));

jest.mock('@pulumi/aws', () => ({
  Provider: jest.fn().mockImplementation(() => ({
    id: 'mock-provider-id',
  })),
  ec2: {
    Vpc: jest.fn().mockImplementation(() => ({
      id: 'mock-vpc-id',
    })),
    InternetGateway: jest.fn(),
    Subnet: jest.fn().mockImplementation(() => ({
      id: 'mock-subnet-id',
    })),
    RouteTable: jest.fn(),
    Route: jest.fn(),
    RouteTableAssociation: jest.fn(),
    NatGateway: jest.fn(),
    Eip: jest.fn(),
    SecurityGroup: jest.fn().mockImplementation(() => ({
      id: 'mock-sg-id',
    })),
    LaunchTemplate: jest.fn(),
    getAmi: jest.fn().mockResolvedValue({
      id: 'ami-12345678',
      name: 'amzn2-ami-hvm-2.0.20231218.0-x86_64-gp2',
    }),
  },
  iam: {
    Role: jest.fn().mockImplementation(() => ({
      id: 'mock-role-id',
      name: 'mock-role-name',
    })),
    RolePolicy: jest.fn(),
    InstanceProfile: jest.fn(),
  },
  kms: {
    Key: jest.fn().mockImplementation(() => ({
      keyId: 'mock-key-id',
      arn: 'mock-key-arn',
    })),
    Alias: jest.fn(),
  },
  rds: {
    SubnetGroup: jest.fn(),
    Instance: jest.fn().mockImplementation(() => ({
      endpoint: 'mock-rds-endpoint.amazonaws.com',
    })),
  },
  lb: {
    LoadBalancer: jest.fn().mockImplementation(() => ({
      dnsName: 'mock-alb-dns.amazonaws.com',
    })),
    TargetGroup: jest.fn(),
    Listener: jest.fn(),
  },
  autoscaling: {
    Group: jest.fn(),
  },
  s3: {
    Bucket: jest.fn().mockImplementation(() => ({
      id: 'mock-bucket-id',
    })),
    BucketVersioningV2: jest.fn(),
    BucketPublicAccessBlock: jest.fn(),
    BucketServerSideEncryptionConfigurationV2: jest.fn(),
  },
  secretsmanager: {
    Secret: jest.fn().mockImplementation(() => ({
      arn: {
        apply: jest.fn().mockImplementation((fn) => fn('mock-secret-arn')),
      },
    })),
    SecretVersion: jest.fn(),
  },
  getAvailabilityZones: jest.fn().mockResolvedValue({
    names: ['us-east-1a', 'us-east-1b', 'us-east-1c'],
    state: 'available',
  }),
}));

import { ProductionWebAppStack } from '../lib/production-web-app-stack';

describe('ProductionWebAppStack Component Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Constructor Variations', () => {
    it('should create production web app stack with default values', () => {
      const stack = new ProductionWebAppStack('test-web-app', {});
      expect(stack).toBeDefined();
      expect(stack).toBeInstanceOf(ProductionWebAppStack);
    });

    it('should create stack with custom VPC CIDR', () => {
      const stack = new ProductionWebAppStack('test-web-app', {
        vpcCidr: '172.16.0.0/16',
      });
      expect(stack).toBeDefined();
    });

    it('should create stack with custom project name', () => {
      const stack = new ProductionWebAppStack('test-web-app', {
        projectName: 'custom-project',
      });
      expect(stack).toBeDefined();
    });

    it('should create stack with custom environment', () => {
      const stack = new ProductionWebAppStack('test-web-app', {
        environment: 'staging',
      });
      expect(stack).toBeDefined();
    });

    it('should create stack with custom region', () => {
      const stack = new ProductionWebAppStack('test-web-app', {
        environment: 'test',
        region: 'us-west-2',
      });
      expect(stack).toBeDefined();
    });

    it('should create stack with custom tags', () => {
      const stack = new ProductionWebAppStack('test-web-app', {
        environment: 'test',
        tags: { Environment: 'test', Project: 'tap', Owner: 'team-alpha' },
      });
      expect(stack).toBeDefined();
    });

    it('should create stack with all custom parameters', () => {
      const stack = new ProductionWebAppStack('test-web-app', {
        vpcCidr: '192.168.0.0/16',
        projectName: 'full-custom-app',
        environment: 'prod',
        region: 'eu-west-1',
        tags: {
          Environment: 'production',
          Project: 'enterprise-app',
          CostCenter: '12345',
          Owner: 'platform-team',
        },
      });
      expect(stack).toBeDefined();
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle undefined tags gracefully', () => {
      const stack = new ProductionWebAppStack('test-web-app', {
        environment: 'test',
        tags: undefined,
      });
      expect(stack).toBeDefined();
    });

    it('should handle null tags gracefully', () => {
      const stack = new ProductionWebAppStack('test-web-app', {
        environment: 'test',
        tags: null as any,
      });
      expect(stack).toBeDefined();
    });

    it('should handle empty tags object', () => {
      const stack = new ProductionWebAppStack('test-web-app', {
        environment: 'test',
        tags: {},
      });
      expect(stack).toBeDefined();
    });

    it('should handle empty string values', () => {
      const stack = new ProductionWebAppStack('test-web-app', {
        vpcCidr: '', // Should fall back to default
        projectName: '', // Should fall back to default
        environment: '',
      });
      expect(stack).toBeDefined();
    });
  });

  describe('AWS Provider Creation', () => {
    it('should create AWS provider with specified region', () => {
      new ProductionWebAppStack('test-web-app', {
        region: 'us-east-1',
      });

      const aws = require('@pulumi/aws');
      expect(aws.Provider).toHaveBeenCalledWith(
        'aws-provider',
        expect.objectContaining({
          region: 'us-east-1',
        }),
        expect.any(Object)
      );
    });

    it('should create AWS provider with default region', () => {
      new ProductionWebAppStack('test-web-app', {});

      const aws = require('@pulumi/aws');
      expect(aws.Provider).toHaveBeenCalledWith(
        'aws-provider',
        expect.objectContaining({
          region: 'us-west-2',
        }),
        expect.any(Object)
      );
    });
  });

  describe('Resource Creation Validation', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should create VPC', () => {
      new ProductionWebAppStack('test-web-app', {
        projectName: 'test-project',
        environment: 'test',
      });

      const aws = require('@pulumi/aws');
      expect(aws.ec2.Vpc).toHaveBeenCalledWith(
        'main-vpc',
        expect.objectContaining({
          cidrBlock: '10.0.0.0/16',
          enableDnsHostnames: true,
          enableDnsSupport: true,
        }),
        expect.any(Object)
      );
    });

    it('should create Internet Gateway', () => {
      new ProductionWebAppStack('test-web-app', {});

      const aws = require('@pulumi/aws');
      expect(aws.ec2.InternetGateway).toHaveBeenCalledWith(
        'main-igw',
        expect.any(Object),
        expect.any(Object)
      );
    });

    it('should create subnets', () => {
      new ProductionWebAppStack('test-web-app', {});

      const aws = require('@pulumi/aws');
      expect(aws.ec2.Subnet).toHaveBeenCalled();
      // Should create 6 subnets (3 public + 3 private)
      expect(aws.ec2.Subnet).toHaveBeenCalledTimes(6);
    });

    it('should create security groups', () => {
      new ProductionWebAppStack('test-web-app', {});

      const aws = require('@pulumi/aws');
      expect(aws.ec2.SecurityGroup).toHaveBeenCalled();
      // Should create 3 security groups (ALB, EC2, RDS)
      expect(aws.ec2.SecurityGroup).toHaveBeenCalledTimes(3);
    });

    it('should create IAM resources', () => {
      new ProductionWebAppStack('test-web-app', {});

      const aws = require('@pulumi/aws');
      expect(aws.iam.Role).toHaveBeenCalled();
      expect(aws.iam.InstanceProfile).toHaveBeenCalled();
      expect(aws.iam.RolePolicy).toHaveBeenCalled();
    });

    it('should create RDS resources', () => {
      new ProductionWebAppStack('test-web-app', {});

      const aws = require('@pulumi/aws');
      expect(aws.rds.SubnetGroup).toHaveBeenCalled();
      expect(aws.rds.Instance).toHaveBeenCalled();
    });

    it('should create Load Balancer resources', () => {
      new ProductionWebAppStack('test-web-app', {});

      const aws = require('@pulumi/aws');
      expect(aws.lb.LoadBalancer).toHaveBeenCalled();
      expect(aws.lb.TargetGroup).toHaveBeenCalled();
      expect(aws.lb.Listener).toHaveBeenCalled();
    });

    it('should create Auto Scaling Group', () => {
      new ProductionWebAppStack('test-web-app', {});

      const aws = require('@pulumi/aws');
      expect(aws.autoscaling.Group).toHaveBeenCalled();
    });

    it('should create S3 bucket with correct name', () => {
      new ProductionWebAppStack('test-web-app', {
        projectName: 'test-project',
        environment: 'test',
      });

      const aws = require('@pulumi/aws');
      expect(aws.s3.Bucket).toHaveBeenCalledWith(
        'app-bucket',
        expect.objectContaining({
          bucket: 'test-project-test-bucket',
        }),
        expect.any(Object)
      );
    });

    it('should create S3 security configurations', () => {
      new ProductionWebAppStack('test-web-app', {});

      const aws = require('@pulumi/aws');
      expect(aws.s3.BucketVersioningV2).toHaveBeenCalled();
      expect(aws.s3.BucketPublicAccessBlock).toHaveBeenCalled();
      expect(aws.s3.BucketServerSideEncryptionConfigurationV2).toHaveBeenCalled();
    });

    it('should create KMS resources', () => {
      new ProductionWebAppStack('test-web-app', {});

      const aws = require('@pulumi/aws');
      expect(aws.kms.Key).toHaveBeenCalled();
      expect(aws.kms.Alias).toHaveBeenCalled();
    });

    it('should create Secrets Manager resources', () => {
      new ProductionWebAppStack('test-web-app', {});

      const aws = require('@pulumi/aws');
      expect(aws.secretsmanager.Secret).toHaveBeenCalled();
      expect(aws.secretsmanager.SecretVersion).toHaveBeenCalled();
    });
  });

  describe('Resource Naming Conventions', () => {
    it('should use consistent naming patterns', () => {
      new ProductionWebAppStack('test-web-app', {
        projectName: 'naming-test',
        environment: 'dev',
      });

      const aws = require('@pulumi/aws');
      expect(aws.ec2.Vpc).toHaveBeenCalledWith(
        'main-vpc',
        expect.objectContaining({
          tags: expect.objectContaining({
            Name: 'naming-test-dev-vpc',
          }),
        }),
        expect.any(Object)
      );
    });
  });
});
