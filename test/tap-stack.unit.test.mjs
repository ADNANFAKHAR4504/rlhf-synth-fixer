// Mock the modules before importing anything
jest.mock('@pulumi/pulumi', () => ({
  ComponentResource: jest.fn().mockImplementation(function () {
    this.registerOutputs = jest.fn();
  }),
  interpolate: jest.fn((strings, ...values) => {
    if (typeof strings === 'string') return strings;
    return strings[0] + 'mock-interpolated-value';
  }),
  Output: {
    create: jest.fn(() => 'mock-output'),
  },
}));

jest.mock('@pulumi/aws', () => {
  const mockResource = name =>
    jest.fn().mockImplementation(function (resourceName, args, opts) {
      this.id = `mock-${name}-id`;
      this.arn = `arn:aws:${name}:us-east-1:123456789012:${resourceName}`;
      this.bucket = resourceName;
      this.name = resourceName;
    });

  return {
    getAvailabilityZones: jest.fn(() =>
      Promise.resolve({
        names: ['us-east-1a', 'us-east-1b', 'us-east-1c'],
      })
    ),
    ec2: {
      Vpc: mockResource('vpc'),
      InternetGateway: mockResource('igw'),
      Subnet: mockResource('subnet'),
      Eip: mockResource('eip'),
      NatGateway: mockResource('nat'),
      RouteTable: mockResource('rt'),
      Route: mockResource('route'),
      RouteTableAssociation: mockResource('rta'),
      SecurityGroup: mockResource('sg'),
    },
    s3: {
      Bucket: mockResource('bucket'),
      BucketVersioning: mockResource('versioning'),
      BucketServerSideEncryptionConfiguration: mockResource('encryption'),
      BucketPublicAccessBlock: mockResource('pab'),
      BucketPolicy: mockResource('policy'),
    },
    kms: {
      Key: mockResource('key'),
      Alias: mockResource('alias'),
    },
    iam: {
      Role: mockResource('role'),
      Policy: mockResource('policy'),
      RolePolicyAttachment: mockResource('attachment'),
      InstanceProfile: mockResource('profile'),
    },
    cloudtrail: {
      Trail: mockResource('trail'),
    },
    rds: {
      SubnetGroup: mockResource('subnetgroup'),
    },
    ssm: {
      Parameter: mockResource('parameter'),
    },
  };
});

import * as aws from '@pulumi/aws';
import * as pulumi from '@pulumi/pulumi';

// Import after mocking
import { TapStack } from '../lib/tap-stack.mjs';

describe('TapStack Structure', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic Stack Creation', () => {
    it('should instantiate TapStack successfully', () => {
      const stack = new TapStack('TestTapStack', {});
      expect(stack).toBeDefined();
      expect(stack).toBeInstanceOf(TapStack);
    });

    it('should instantiate TapStack with custom environment suffix', () => {
      const stack = new TapStack('TestTapStackCustom', {
        environmentSuffix: 'prod',
      });
      expect(stack).toBeDefined();
      expect(stack).toBeInstanceOf(TapStack);
    });

    it('should instantiate TapStack with custom tags', () => {
      const stack = new TapStack('TestTapStackTagged', {
        environmentSuffix: 'dev',
        tags: {
          Project: 'TAP',
          Environment: 'Development',
        },
      });
      expect(stack).toBeDefined();
      expect(stack).toBeInstanceOf(TapStack);
    });

    it('should use default environment suffix when not provided', () => {
      const stack = new TapStack('TestDefaultEnv', {});
      expect(stack).toBeDefined();
      // Verify VPC was created with dev suffix
      expect(aws.ec2.Vpc).toHaveBeenCalledWith(
        expect.stringContaining('tap-vpc-dev'),
        expect.any(Object),
        expect.any(Object)
      );
    });
  });

  describe('Component Resource Behavior', () => {
    it('should call super constructor with correct parameters', () => {
      new TapStack('TestTapStackSuper', {});

      expect(pulumi.ComponentResource).toHaveBeenCalledWith(
        'tap:stack:TapStack',
        'TestTapStackSuper',
        {},
        undefined
      );
    });

    it('should have registerOutputs method', () => {
      const stack = new TapStack('TestTapStackOutputs', {});
      expect(typeof stack.registerOutputs).toBe('function');
    });
  });

  describe('Configuration Handling', () => {
    it('should handle undefined args gracefully', () => {
      expect(() => {
        const stack = new TapStack('TestTapStackUndefined');
        expect(stack).toBeDefined();
      }).not.toThrow();
    });

    it('should handle empty args object', () => {
      expect(() => {
        const stack = new TapStack('TestTapStackEmpty', {});
        expect(stack).toBeDefined();
      }).not.toThrow();
    });

    it('should handle partial configuration', () => {
      expect(() => {
        const stack1 = new TapStack('TestTapStackPartial1', {
          environmentSuffix: 'partial',
          // tags intentionally omitted
        });
        expect(stack1).toBeDefined();

        const stack2 = new TapStack('TestTapStackPartial2', {
          tags: { Project: 'Test' },
          // environmentSuffix intentionally omitted
        });
        expect(stack2).toBeDefined();
      }).not.toThrow();
    });
  });

  describe('VPC and Networking Resources', () => {
    it('should create VPC with correct configuration', () => {
      new TapStack('TestVPC', {
        environmentSuffix: 'test',
      });

      expect(aws.ec2.Vpc).toHaveBeenCalledWith(
        'tap-vpc-test',
        expect.objectContaining({
          cidrBlock: '10.0.0.0/16',
          enableDnsHostnames: true,
          enableDnsSupport: true,
        }),
        expect.any(Object)
      );
    });

    it('should create Internet Gateway', () => {
      new TapStack('TestIGW', {
        environmentSuffix: 'test',
      });

      expect(aws.ec2.InternetGateway).toHaveBeenCalledWith(
        'tap-igw-test',
        expect.objectContaining({
          vpcId: expect.any(String),
        }),
        expect.any(Object)
      );
    });

    it('should create public and private subnets', () => {
      new TapStack('TestSubnets', {
        environmentSuffix: 'test',
      });

      // Public subnets
      expect(aws.ec2.Subnet).toHaveBeenCalledWith(
        'tap-public-subnet-1-test',
        expect.objectContaining({
          cidrBlock: '10.0.1.0/24',
          mapPublicIpOnLaunch: true,
        }),
        expect.any(Object)
      );

      expect(aws.ec2.Subnet).toHaveBeenCalledWith(
        'tap-public-subnet-2-test',
        expect.objectContaining({
          cidrBlock: '10.0.2.0/24',
          mapPublicIpOnLaunch: true,
        }),
        expect.any(Object)
      );

      // Private subnets
      expect(aws.ec2.Subnet).toHaveBeenCalledWith(
        'tap-private-subnet-1-test',
        expect.objectContaining({
          cidrBlock: '10.0.11.0/24',
        }),
        expect.any(Object)
      );

      expect(aws.ec2.Subnet).toHaveBeenCalledWith(
        'tap-private-subnet-2-test',
        expect.objectContaining({
          cidrBlock: '10.0.12.0/24',
        }),
        expect.any(Object)
      );
    });

    it('should create NAT Gateways with EIPs', () => {
      new TapStack('TestNAT', {
        environmentSuffix: 'test',
        createNatGateways: true,
      });

      // EIPs
      expect(aws.ec2.Eip).toHaveBeenCalledWith(
        'tap-eip-1-test',
        expect.objectContaining({
          domain: 'vpc',
        }),
        expect.any(Object)
      );

      expect(aws.ec2.Eip).toHaveBeenCalledWith(
        'tap-eip-2-test',
        expect.objectContaining({
          domain: 'vpc',
        }),
        expect.any(Object)
      );

      // NAT Gateways
      expect(aws.ec2.NatGateway).toHaveBeenCalledTimes(2);
    });

    it('should create and configure route tables', () => {
      new TapStack('TestRouteTables', {
        environmentSuffix: 'test',
        createNatGateways: true,
      });

      // Public route table
      expect(aws.ec2.RouteTable).toHaveBeenCalledWith(
        'tap-public-rt-test',
        expect.any(Object),
        expect.any(Object)
      );

      // Private route tables
      expect(aws.ec2.RouteTable).toHaveBeenCalledWith(
        'tap-private-rt-1-test',
        expect.any(Object),
        expect.any(Object)
      );

      expect(aws.ec2.RouteTable).toHaveBeenCalledWith(
        'tap-private-rt-2-test',
        expect.any(Object),
        expect.any(Object)
      );

      // Routes
      expect(aws.ec2.Route).toHaveBeenCalledTimes(3);

      // Route table associations
      expect(aws.ec2.RouteTableAssociation).toHaveBeenCalledTimes(4);
    });
  });

  describe('Security Groups', () => {
    it('should create SSH security group with correct rules', () => {
      new TapStack('TestSSHSG', {
        environmentSuffix: 'test',
      });

      expect(aws.ec2.SecurityGroup).toHaveBeenCalledWith(
        'tap-ssh-sg-test',
        expect.objectContaining({
          name: 'tap-ssh-sg-test',
          description: 'Security group for SSH access',
          ingress: expect.arrayContaining([
            expect.objectContaining({
              fromPort: 22,
              toPort: 22,
              protocol: 'tcp',
              cidrBlocks: ['10.0.0.0/16'],
            }),
          ]),
        }),
        expect.any(Object)
      );
    });

    it('should create web security group with HTTP and HTTPS rules', () => {
      new TapStack('TestWebSG', {
        environmentSuffix: 'test',
      });

      expect(aws.ec2.SecurityGroup).toHaveBeenCalledWith(
        'tap-web-sg-test',
        expect.objectContaining({
          name: 'tap-web-sg-test',
          description: 'Security group for HTTP and HTTPS access',
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
        expect.any(Object)
      );
    });

    it('should create RDS security group', () => {
      new TapStack('TestRDSSG', {
        environmentSuffix: 'test',
      });

      expect(aws.ec2.SecurityGroup).toHaveBeenCalledWith(
        'tap-rds-sg-test',
        expect.objectContaining({
          name: 'tap-rds-sg-test',
          description: 'Security group for RDS database access',
          ingress: expect.arrayContaining([
            expect.objectContaining({
              fromPort: 3306,
              toPort: 3306,
              protocol: 'tcp',
              cidrBlocks: ['10.0.0.0/16'],
            }),
          ]),
        }),
        expect.any(Object)
      );
    });
  });

  describe('S3 Buckets and Encryption', () => {
    it('should create KMS key with rotation enabled', () => {
      new TapStack('TestKMS', {
        environmentSuffix: 'test',
      });

      expect(aws.kms.Key).toHaveBeenCalledWith(
        'tap-kms-key-test',
        expect.objectContaining({
          enableKeyRotation: true,
          deletionWindowInDays: 7,
        }),
        expect.any(Object)
      );

      expect(aws.kms.Alias).toHaveBeenCalledWith(
        'tap-kms-alias-test',
        expect.objectContaining({
          name: 'alias/tap-test',
        }),
        expect.any(Object)
      );
    });

    it('should create logs bucket with forceDestroy', () => {
      new TapStack('TestLogsBucket', {
        environmentSuffix: 'test',
      });

      expect(aws.s3.Bucket).toHaveBeenCalledWith(
        expect.stringContaining('tap-logs-test'),
        expect.objectContaining({
          forceDestroy: true,
        }),
        expect.any(Object)
      );
    });

    it('should configure bucket versioning', () => {
      new TapStack('TestBucketVersioning', {
        environmentSuffix: 'test',
      });

      expect(aws.s3.BucketVersioning).toHaveBeenCalledWith(
        'tap-logs-versioning-test',
        expect.objectContaining({
          versioningConfiguration: {
            status: 'Enabled',
          },
        }),
        expect.any(Object)
      );
    });

    it('should configure bucket encryption with KMS', () => {
      new TapStack('TestBucketEncryption', {
        environmentSuffix: 'test',
      });

      expect(
        aws.s3.BucketServerSideEncryptionConfiguration
      ).toHaveBeenCalledWith(
        'tap-logs-encryption-test',
        expect.objectContaining({
          rules: expect.arrayContaining([
            expect.objectContaining({
              applyServerSideEncryptionByDefault: expect.objectContaining({
                sseAlgorithm: 'aws:kms',
              }),
              bucketKeyEnabled: true,
            }),
          ]),
        }),
        expect.any(Object)
      );
    });

    it('should block public access on buckets', () => {
      new TapStack('TestPublicAccess', {
        environmentSuffix: 'test',
      });

      expect(aws.s3.BucketPublicAccessBlock).toHaveBeenCalledWith(
        expect.stringContaining('tap-logs-pab-test'),
        expect.objectContaining({
          blockPublicAcls: true,
          blockPublicPolicy: true,
          ignorePublicAcls: true,
          restrictPublicBuckets: true,
        }),
        expect.any(Object)
      );
    });

    it('should create CloudTrail bucket with forceDestroy', () => {
      new TapStack('TestCloudTrailBucket', {
        environmentSuffix: 'test',
        createCloudTrail: true,
      });

      expect(aws.s3.Bucket).toHaveBeenCalledWith(
        expect.stringContaining('tap-cloudtrail-test'),
        expect.objectContaining({
          forceDestroy: true,
        }),
        expect.any(Object)
      );
    });
  });

  describe('IAM Resources', () => {
    it('should create EC2 IAM role', () => {
      new TapStack('TestIAMRole', {
        environmentSuffix: 'test',
      });

      expect(aws.iam.Role).toHaveBeenCalledWith(
        'tap-ec2-role-test',
        expect.objectContaining({
          assumeRolePolicy: expect.stringContaining('ec2.amazonaws.com'),
        }),
        expect.any(Object)
      );
    });

    it('should create S3 access policy with least privilege', () => {
      new TapStack('TestIAMPolicy', {
        environmentSuffix: 'test',
      });

      expect(aws.iam.Policy).toHaveBeenCalledWith(
        'tap-s3-access-policy-test',
        expect.objectContaining({
          description: 'Policy for EC2 instances to access logs S3 bucket',
        }),
        expect.any(Object)
      );
    });

    it('should attach policy to role', () => {
      new TapStack('TestPolicyAttachment', {
        environmentSuffix: 'test',
      });

      expect(aws.iam.RolePolicyAttachment).toHaveBeenCalled();
    });

    it('should create instance profile', () => {
      new TapStack('TestInstanceProfile', {
        environmentSuffix: 'test',
      });

      expect(aws.iam.InstanceProfile).toHaveBeenCalledWith(
        'tap-ec2-profile-test',
        expect.any(Object),
        expect.any(Object)
      );
    });
  });

  describe('CloudTrail and Auditing', () => {
    it('should create CloudTrail with multi-region support', () => {
      new TapStack('TestCloudTrail', {
        environmentSuffix: 'test',
        createCloudTrail: true,
      });

      expect(aws.cloudtrail.Trail).toHaveBeenCalledWith(
        'tap-cloudtrail-test',
        expect.objectContaining({
          name: 'tap-cloudtrail-test',
          includeGlobalServiceEvents: true,
          isMultiRegionTrail: true,
          enableLogging: true,
        }),
        expect.any(Object)
      );
    });

    it('should configure CloudTrail bucket policy', () => {
      new TapStack('TestCloudTrailPolicy', {
        environmentSuffix: 'test',
        createCloudTrail: true,
      });

      expect(aws.s3.BucketPolicy).toHaveBeenCalledWith(
        expect.stringContaining('tap-cloudtrail-policy-test'),
        expect.any(Object),
        expect.any(Object)
      );
    });
  });

  describe('RDS and Database Resources', () => {
    it('should create DB subnet group in private subnets', () => {
      new TapStack('TestDBSubnetGroup', {
        environmentSuffix: 'test',
        createDbSubnetGroup: true,
      });

      expect(aws.rds.SubnetGroup).toHaveBeenCalledWith(
        'tap-db-subnet-group-test',
        expect.objectContaining({
          name: 'tap-db-subnet-group-test',
          description: 'Database subnet group for private subnets',
        }),
        expect.any(Object)
      );
    });
  });

  describe('Parameter Store Integration', () => {
    it('should store VPC ID in Parameter Store', () => {
      new TapStack('TestParameterStore', {
        environmentSuffix: 'test',
      });

      expect(aws.ssm.Parameter).toHaveBeenCalledWith(
        'tap-vpc-id-test',
        expect.objectContaining({
          name: '/tap/test/vpc-id',
          type: 'String',
          description: 'VPC ID for test environment',
        }),
        expect.any(Object)
      );
    });
  });

  describe('Stack Outputs', () => {
    it('should expose all required outputs', () => {
      const stack = new TapStack('TestOutputs', {
        environmentSuffix: 'test',
        createCloudTrail: true,
        createDbSubnetGroup: true,
        createNatGateways: true,
      });

      expect(stack.vpcId).toBeDefined();
      expect(stack.publicSubnetIds).toBeDefined();
      expect(stack.privateSubnetIds).toBeDefined();
      expect(stack.sshSecurityGroupId).toBeDefined();
      expect(stack.webSecurityGroupId).toBeDefined();
      expect(stack.rdsSecurityGroupId).toBeDefined();
      expect(stack.logsBucketName).toBeDefined();
      expect(stack.logsBucketArn).toBeDefined();
      expect(stack.cloudtrailBucketName).toBeDefined();
      expect(stack.ec2RoleArn).toBeDefined();
      expect(stack.ec2InstanceProfileName).toBeDefined();
      expect(stack.kmsKeyId).toBeDefined();
      expect(stack.kmsKeyArn).toBeDefined();
      expect(stack.dbSubnetGroupName).toBeDefined();
    });

    it('should register outputs correctly', () => {
      const stack = new TapStack('TestRegisterOutputs', {
        environmentSuffix: 'test',
        createCloudTrail: true,
        createDbSubnetGroup: true,
        createNatGateways: true,
      });

      expect(stack.registerOutputs).toHaveBeenCalledWith(
        expect.objectContaining({
          vpcId: expect.any(String),
          publicSubnetIds: expect.any(Array),
          privateSubnetIds: expect.any(Array),
          sshSecurityGroupId: expect.any(String),
          webSecurityGroupId: expect.any(String),
          rdsSecurityGroupId: expect.any(String),
          logsBucketName: expect.any(String),
          logsBucketArn: expect.any(String),
          cloudtrailBucketName: expect.any(String),
          ec2RoleArn: expect.any(String),
          ec2InstanceProfileName: expect.any(String),
          kmsKeyId: expect.any(String),
          kmsKeyArn: expect.any(String),
          dbSubnetGroupName: expect.any(String),
        })
      );
    });
  });

  describe('Tag Management', () => {
    it('should apply default tags to all resources', () => {
      new TapStack('TestTags', {
        environmentSuffix: 'staging',
        tags: {
          Owner: 'devops-team',
          CostCenter: 'engineering',
        },
      });

      // Check that VPC has the merged tags
      expect(aws.ec2.Vpc).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          tags: expect.objectContaining({
            Environment: 'staging',
            Owner: 'devops-team',
            Project: 'tap-cloud-environment',
            CostCenter: 'engineering',
          }),
        }),
        expect.any(Object)
      );
    });
  });
});
