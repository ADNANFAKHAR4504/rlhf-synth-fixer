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
  ec2: {
    Vpc: jest.fn().mockImplementation(() => ({
      id: 'mock-vpc-id',
    })),
    InternetGateway: jest.fn().mockImplementation(() => ({
      id: 'mock-igw-id',
    })),
    Subnet: jest.fn().mockImplementation(() => ({
      id: 'mock-subnet-id',
    })),
    RouteTable: jest.fn().mockImplementation(() => ({
      id: 'mock-rt-id',
    })),
    Route: jest.fn().mockImplementation(() => ({
      id: 'mock-route-id',
    })),
    RouteTableAssociation: jest.fn().mockImplementation(() => ({
      id: 'mock-rta-id',
    })),
    NatGateway: jest.fn().mockImplementation(() => ({
      id: 'mock-nat-id',
    })),
    Eip: jest.fn().mockImplementation(() => ({
      id: 'mock-eip-id',
    })),
    SecurityGroup: jest.fn().mockImplementation(() => ({
      id: 'mock-sg-id',
    })),
    LaunchTemplate: jest.fn().mockImplementation(() => ({
      id: 'mock-lt-id',
    })),
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
    RolePolicy: jest.fn().mockImplementation(() => ({
      id: 'mock-policy-id',
    })),
    InstanceProfile: jest.fn().mockImplementation(() => ({
      id: 'mock-profile-id',
      name: 'mock-profile-name',
    })),
  },
  kms: {
    Key: jest.fn().mockImplementation(() => ({
      keyId: 'mock-key-id',
      arn: 'mock-key-arn',
    })),
    Alias: jest.fn().mockImplementation(() => ({
      id: 'mock-alias-id',
    })),
  },
  rds: {
    SubnetGroup: jest.fn().mockImplementation(() => ({
      id: 'mock-subnet-group-id',
      name: 'mock-subnet-group-name',
    })),
    Instance: jest.fn().mockImplementation(() => ({
      id: 'mock-rds-id',
      endpoint: 'mock-rds-endpoint.amazonaws.com',
    })),
  },
  lb: {
    LoadBalancer: jest.fn().mockImplementation(() => ({
      id: 'mock-alb-id',
      arn: 'mock-alb-arn',
      dnsName: 'mock-alb-dns.amazonaws.com',
    })),
    TargetGroup: jest.fn().mockImplementation(() => ({
      id: 'mock-tg-id',
      arn: 'mock-tg-arn',
    })),
    Listener: jest.fn().mockImplementation(() => ({
      id: 'mock-listener-id',
    })),
  },
  autoscaling: {
    Group: jest.fn().mockImplementation(() => ({
      id: 'mock-asg-id',
      name: 'mock-asg-name',
    })),
  },
  s3: {
    Bucket: jest.fn().mockImplementation(() => ({
      id: 'mock-bucket-id',
      arn: 'mock-bucket-arn',
      bucket: 'mock-bucket-name',
    })),
    BucketVersioningV2: jest.fn().mockImplementation(() => ({
      id: 'mock-versioning-id',
    })),
    BucketPublicAccessBlock: jest.fn().mockImplementation(() => ({
      id: 'mock-pab-id',
    })),
    BucketServerSideEncryptionConfigurationV2: jest.fn().mockImplementation(() => ({
      id: 'mock-encryption-id',
    })),
  },
  secretsmanager: {
    Secret: jest.fn().mockImplementation(() => ({
      id: 'mock-secret-id',
      arn: {
        apply: jest.fn().mockImplementation((fn) => fn('mock-secret-arn')),
      },
    })),
    SecretVersion: jest.fn().mockImplementation(() => ({
      id: 'mock-secret-version-id',
    })),
  },
  getAvailabilityZones: jest.fn().mockResolvedValue({
    names: ['us-east-1a', 'us-east-1b', 'us-east-1c'],
    state: 'available',
  }),
}));

import { ProductionWebAppStack } from '../lib/production-web-app-stack';

describe('ProductionWebAppStack Component Tests', () => {
  describe('Constructor Variations', () => {
    it('should create production web app stack with default values', () => {
      const stack = new ProductionWebAppStack('test-web-app', {});
      expect(stack).toBeDefined();
      expect(stack.vpc).toBeDefined();
      expect(stack.loadBalancer).toBeDefined();
      expect(stack.autoScalingGroup).toBeDefined();
      expect(stack.database).toBeDefined();
      expect(stack.bucket).toBeDefined();
      expect(stack.publicSubnets).toBeDefined();
      expect(stack.privateSubnets).toBeDefined();
      expect(stack.albDnsName).toBeDefined();
      expect(stack.rdsEndpoint).toBeDefined();
      expect(stack.s3BucketName).toBeDefined();
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

    it('should create stack with custom environment suffix', () => {
      const stack = new ProductionWebAppStack('test-web-app', {
        environmentSuffix: 'staging',
      });
      expect(stack).toBeDefined();
    });

    it('should create stack with custom tags', () => {
      const stack = new ProductionWebAppStack('test-web-app', {
        environmentSuffix: 'test',
        tags: { Environment: 'test', Project: 'tap', Owner: 'team-alpha' },
      });
      expect(stack).toBeDefined();
    });

    it('should create stack with all custom parameters', () => {
      const stack = new ProductionWebAppStack('test-web-app', {
        vpcCidr: '192.168.0.0/16',
        projectName: 'full-custom-app',
        environmentSuffix: 'prod',
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
        environmentSuffix: 'test',
        tags: undefined,
      });
      expect(stack).toBeDefined();
    });

    it('should handle null tags gracefully', () => {
      const stack = new ProductionWebAppStack('test-web-app', {
        environmentSuffix: 'test',
        tags: null as any,
      });
      expect(stack).toBeDefined();
    });

    it('should handle empty tags object', () => {
      const stack = new ProductionWebAppStack('test-web-app', {
        environmentSuffix: 'test',
        tags: {},
      });
      expect(stack).toBeDefined();
    });

    it('should handle falsy values in configuration', () => {
      const falsyValues = [false, 0, '', NaN];
      falsyValues.forEach((value, index) => {
        const stack = new ProductionWebAppStack(`test-web-app-${index}`, {
          environmentSuffix: 'test',
          tags: { falsyTest: value as any },
        });
        expect(stack).toBeDefined();
      });
    });

    it('should handle empty string values', () => {
      const stack = new ProductionWebAppStack('test-web-app', {
        vpcCidr: '', // Should fall back to default
        projectName: '', // Should fall back to default
        environmentSuffix: '',
      });
      expect(stack).toBeDefined();
    });

    it('should handle special characters in project name', () => {
      const stack = new ProductionWebAppStack('test-web-app', {
        projectName: 'test-app_with.special-chars',
      });
      expect(stack).toBeDefined();
    });
  });

  describe('Resource Creation Validation', () => {
    let stack: ProductionWebAppStack;

    beforeEach(() => {
      stack = new ProductionWebAppStack('test-web-app', {
        projectName: 'test-project',
        environmentSuffix: 'test',
      });
    });

    it('should create VPC with correct configuration', () => {
      const aws = require('@pulumi/aws');
      expect(aws.ec2.Vpc).toHaveBeenCalledWith(
        'main-vpc',
        expect.objectContaining({
          cidrBlock: '10.0.0.0/16',
          enableDnsHostnames: true,
          enableDnsSupport: true,
          tags: expect.objectContaining({
            Name: 'test-project-test-vpc',
            Environment: 'Test',
            Project: 'test-project',
          }),
        }),
        expect.objectContaining({ parent: stack })
      );
    });

    it('should create Internet Gateway', () => {
      const aws = require('@pulumi/aws');
      expect(aws.ec2.InternetGateway).toHaveBeenCalledWith(
        'main-igw',
        expect.objectContaining({
          vpcId: 'mock-vpc-id',
          tags: expect.objectContaining({
            Name: 'test-project-test-igw',
          }),
        }),
        expect.objectContaining({ parent: stack })
      );
    });

    it('should create public and private subnets', () => {
      const aws = require('@pulumi/aws');
      
      // Check public subnets
      expect(aws.ec2.Subnet).toHaveBeenCalledWith(
        'public-subnet-1',
        expect.objectContaining({
          vpcId: 'mock-vpc-id',
          cidrBlock: '10.0.1.0/24',
          mapPublicIpOnLaunch: true,
          tags: expect.objectContaining({
            Name: 'test-project-test-public-subnet-1',
            Type: 'Public',
          }),
        }),
        expect.objectContaining({ parent: stack })
      );

      // Check private subnets
      expect(aws.ec2.Subnet).toHaveBeenCalledWith(
        'private-subnet-1',
        expect.objectContaining({
          vpcId: 'mock-vpc-id',
          cidrBlock: '10.0.10.0/24',
          tags: expect.objectContaining({
            Name: 'test-project-test-private-subnet-1',
            Type: 'Private',
          }),
        }),
        expect.objectContaining({ parent: stack })
      );
    });

    it('should create NAT Gateways and Elastic IPs', () => {
      const aws = require('@pulumi/aws');
      
      expect(aws.ec2.Eip).toHaveBeenCalledWith(
        'nat-eip-1',
        expect.objectContaining({
          domain: 'vpc',
          tags: expect.objectContaining({
            Name: 'test-project-test-nat-eip-1',
          }),
        }),
        expect.objectContaining({ parent: stack })
      );

      expect(aws.ec2.NatGateway).toHaveBeenCalledWith(
        'nat-gateway-1',
        expect.objectContaining({
          allocationId: 'mock-eip-id',
          subnetId: 'mock-subnet-id',
          tags: expect.objectContaining({
            Name: 'test-project-test-nat-gateway-1',
          }),
        }),
        expect.objectContaining({ parent: stack })
      );
    });

    it('should create security groups with proper rules', () => {
      const aws = require('@pulumi/aws');
      
      // ALB Security Group
      expect(aws.ec2.SecurityGroup).toHaveBeenCalledWith(
        'alb-sg',
        expect.objectContaining({
          name: 'test-project-test-alb-sg',
          description: 'Security group for Application Load Balancer',
          vpcId: 'mock-vpc-id',
          ingress: expect.arrayContaining([
            expect.objectContaining({
              fromPort: 80,
              toPort: 80,
              protocol: 'tcp',
              cidrBlocks: ['0.0.0.0/0'],
            }),
            expect.objectContaining({
              fromPort: 443,
              toPort: 443,
              protocol: 'tcp',
              cidrBlocks: ['0.0.0.0/0'],
            }),
          ]),
        }),
        expect.objectContaining({ parent: stack })
      );

      // EC2 Security Group (No SSH - Session Manager only)
      expect(aws.ec2.SecurityGroup).toHaveBeenCalledWith(
        'ec2-sg',
        expect.objectContaining({
          name: 'test-project-test-ec2-sg',
          description: 'Security group for EC2 instances - ALB access only',
          vpcId: 'mock-vpc-id',
          ingress: expect.arrayContaining([
            expect.objectContaining({
              fromPort: 80,
              toPort: 80,
              protocol: 'tcp',
              securityGroups: ['mock-sg-id'],
            }),
          ]),
        }),
        expect.objectContaining({ parent: stack })
      );

      // RDS Security Group
      expect(aws.ec2.SecurityGroup).toHaveBeenCalledWith(
        'rds-sg',
        expect.objectContaining({
          name: 'test-project-test-rds-sg',
          description: 'Security group for RDS MySQL instance',
          vpcId: 'mock-vpc-id',
          ingress: expect.arrayContaining([
            expect.objectContaining({
              fromPort: 3306,
              toPort: 3306,
              protocol: 'tcp',
              securityGroups: ['mock-sg-id'],
            }),
          ]),
        }),
        expect.objectContaining({ parent: stack })
      );
    });

    it('should create IAM role and instance profile', () => {
      const aws = require('@pulumi/aws');
      
      expect(aws.iam.Role).toHaveBeenCalledWith(
        'ec2-role',
        expect.objectContaining({
          name: 'test-project-test-ec2-role',
          assumeRolePolicy: expect.stringContaining('ec2.amazonaws.com'),
          managedPolicyArns: expect.arrayContaining([
            'arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore'
          ]),
        }),
        expect.objectContaining({ parent: stack })
      );

      // Should create least privilege S3 policy
      expect(aws.iam.RolePolicy).toHaveBeenCalledWith(
        'ec2-s3-policy',
        expect.objectContaining({
          name: 'test-project-test-ec2-s3-policy',
          role: 'mock-role-id',
          policy: expect.stringContaining('s3:GetObject'),
        }),
        expect.objectContaining({ parent: stack })
      );

      // Should create Secrets Manager policy
      expect(aws.iam.RolePolicy).toHaveBeenCalledWith(
        'ec2-secrets-policy',
        expect.objectContaining({
          name: 'test-project-test-ec2-secrets-policy',
          role: 'mock-role-id',
          policy: expect.stringContaining('secretsmanager:GetSecretValue'),
        }),
        expect.objectContaining({ parent: stack })
      );

      expect(aws.iam.InstanceProfile).toHaveBeenCalledWith(
        'ec2-instance-profile',
        expect.objectContaining({
          name: 'test-project-test-ec2-instance-profile',
          role: 'mock-role-name',
        }),
        expect.objectContaining({ parent: stack })
      );
    });

    it('should create KMS key and alias', () => {
      const aws = require('@pulumi/aws');
      
      expect(aws.kms.Key).toHaveBeenCalledWith(
        'rds-kms-key',
        expect.objectContaining({
          description: 'KMS key for RDS encryption',
          tags: expect.objectContaining({
            Name: 'test-project-test-rds-kms-key',
          }),
        }),
        expect.objectContaining({ parent: stack })
      );

      expect(aws.kms.Alias).toHaveBeenCalledWith(
        'rds-kms-alias',
        expect.objectContaining({
          name: 'alias/test-project-test-rds-key',
          targetKeyId: 'mock-key-id',
        }),
        expect.objectContaining({ parent: stack })
      );
    });

    it('should create RDS subnet group and instance', () => {
      const aws = require('@pulumi/aws');
      
      expect(aws.rds.SubnetGroup).toHaveBeenCalledWith(
        'rds-subnet-group',
        expect.objectContaining({
          name: 'test-project-test-rds-subnet-group',
          subnetIds: ['mock-subnet-id', 'mock-subnet-id', 'mock-subnet-id'],
        }),
        expect.objectContaining({ parent: stack })
      );

      expect(aws.rds.Instance).toHaveBeenCalledWith(
        'mysql-instance',
        expect.objectContaining({
          identifier: 'test-project-test-mysql',
          engine: 'mysql',
          engineVersion: '8.0',
          instanceClass: 'db.t3.micro',
          allocatedStorage: 20,
          maxAllocatedStorage: 100,
          storageType: 'gp2',
          storageEncrypted: true,
          kmsKeyId: 'mock-key-arn',
          dbName: 'production',
          username: 'admin',
          password: 'TempPassword123!', // Temporary - should use Secrets Manager in production
          skipFinalSnapshot: false,
          backupRetentionPeriod: 7,
          deletionProtection: false, // Set to true for production
        }),
        expect.objectContaining({ parent: stack })
      );
    });

    it('should create launch template', () => {
      const aws = require('@pulumi/aws');
      
      expect(aws.ec2.LaunchTemplate).toHaveBeenCalledWith(
        'launch-template',
        expect.objectContaining({
          name: 'test-project-test-launch-template',
          instanceType: 't3.micro',
          vpcSecurityGroupIds: ['mock-sg-id'],
          iamInstanceProfile: expect.objectContaining({
            name: 'mock-profile-name',
          }),
          userData: expect.any(String),
        }),
        expect.objectContaining({ parent: stack })
      );
    });

    it('should create Application Load Balancer and Target Group', () => {
      const aws = require('@pulumi/aws');
      
      expect(aws.lb.LoadBalancer).toHaveBeenCalledWith(
        'app-lb',
        expect.objectContaining({
          name: 'test-project-test-alb',
          loadBalancerType: 'application',
          securityGroups: ['mock-sg-id'],
          subnets: ['mock-subnet-id', 'mock-subnet-id', 'mock-subnet-id'],
        }),
        expect.objectContaining({ parent: stack })
      );

      expect(aws.lb.TargetGroup).toHaveBeenCalledWith(
        'app-tg',
        expect.objectContaining({
          name: 'test-project-test-tg',
          port: 80,
          protocol: 'HTTP',
          vpcId: 'mock-vpc-id',
          healthCheck: expect.objectContaining({
            enabled: true,
            healthyThreshold: 2,
            interval: 30,
            path: '/',
          }),
        }),
        expect.objectContaining({ parent: stack })
      );
    });

    it('should create Auto Scaling Group', () => {
      const aws = require('@pulumi/aws');
      
      expect(aws.autoscaling.Group).toHaveBeenCalledWith(
        'app-asg',
        expect.objectContaining({
          name: 'test-project-test-asg',
          vpcZoneIdentifiers: ['mock-subnet-id', 'mock-subnet-id', 'mock-subnet-id'],
          targetGroupArns: ['mock-tg-arn'],
          healthCheckType: 'ELB',
          healthCheckGracePeriod: 300,
          minSize: 2,
          maxSize: 6,
          desiredCapacity: 2,
          launchTemplate: expect.objectContaining({
            id: 'mock-lt-id',
            version: '$Latest',
          }),
        }),
        expect.objectContaining({ parent: stack })
      );
    });

    it('should create S3 bucket with security configurations', () => {
      const aws = require('@pulumi/aws');
      
      expect(aws.s3.Bucket).toHaveBeenCalledWith(
        'app-bucket',
        expect.objectContaining({
          bucket: expect.stringContaining('test-project-test-bucket-'),
          tags: expect.objectContaining({
            Name: 'test-project-test-bucket',
          }),
        }),
        expect.objectContaining({ parent: stack })
      );

      expect(aws.s3.BucketVersioningV2).toHaveBeenCalledWith(
        'app-bucket-versioning',
        expect.objectContaining({
          bucket: 'mock-bucket-id',
          versioningConfiguration: expect.objectContaining({
            status: 'Enabled',
          }),
        }),
        expect.objectContaining({ parent: stack })
      );

      expect(aws.s3.BucketPublicAccessBlock).toHaveBeenCalledWith(
        'app-bucket-pab',
        expect.objectContaining({
          bucket: 'mock-bucket-id',
          blockPublicAcls: true,
          blockPublicPolicy: true,
          ignorePublicAcls: true,
          restrictPublicBuckets: true,
        }),
        expect.objectContaining({ parent: stack })
      );

      expect(aws.s3.BucketServerSideEncryptionConfigurationV2).toHaveBeenCalledWith(
        'app-bucket-encryption',
        expect.objectContaining({
          bucket: 'mock-bucket-id',
          rules: expect.arrayContaining([
            expect.objectContaining({
              applyServerSideEncryptionByDefault: expect.objectContaining({
                sseAlgorithm: 'AES256',
              }),
            }),
          ]),
        }),
        expect.objectContaining({ parent: stack })
      );
    });
  });

  describe('Output Validation', () => {
    it('should register correct outputs', () => {
      const stack = new ProductionWebAppStack('test-web-app', {});
      
      expect(stack.albDnsName).toBeDefined();
      expect(stack.rdsEndpoint).toBeDefined();
      expect(stack.s3BucketName).toBeDefined();
    });
  });

  describe('Resource Naming Conventions', () => {
    it('should use consistent naming patterns', () => {
      const stack = new ProductionWebAppStack('test-web-app', {
        projectName: 'naming-test',
        environmentSuffix: 'dev',
      });

      const aws = require('@pulumi/aws');
      
      // Check that resources are named consistently with environment suffix
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
