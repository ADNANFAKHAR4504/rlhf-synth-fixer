// Mock Pulumi and AWS before importing
jest.mock('@pulumi/pulumi', () => ({
  ComponentResource: class MockComponentResource {
    constructor(type: string, name: string, args: any, opts?: any) {
      // Mock implementation
    }
    registerOutputs(outputs: any) {
      // Mock implementation
    }
  },
  Output: jest.fn().mockImplementation(value => ({
    promise: () => Promise.resolve(value),
    apply: (fn: any) => fn(value),
  })),
  output: jest.fn().mockImplementation(value => ({
    apply: (fn: any) => fn(value),
  })),
  all: jest.fn().mockImplementation(values => ({
    apply: (fn: any) => fn(values),
  })),
  secret: jest.fn().mockImplementation(value => ({
    apply: (fn: any) => fn(value),
  })),
  interpolate: jest.fn((template: string) => template),
}));

jest.mock('@pulumi/aws', () => ({
  getCallerIdentity: jest.fn(() => Promise.resolve({ accountId: '123456789012' })),
  Provider: jest.fn().mockImplementation(() => ({
    region: 'ap-south-1',
  })),
  ec2: {
    Vpc: jest.fn().mockImplementation(() => ({
      id: 'mock-vpc-id',
      cidrBlock: '10.0.0.0/16',
    })),
    InternetGateway: jest.fn().mockImplementation(() => ({
      id: 'mock-igw-id',
    })),
    Subnet: jest.fn().mockImplementation((name: string) => ({
      id: `mock-subnet-${name}`,
      availabilityZone: 'ap-south-1a',
    })),
    RouteTable: jest.fn().mockImplementation(() => ({
      id: 'mock-route-table-id',
    })),
    Route: jest.fn().mockImplementation(() => ({
      id: 'mock-route-id',
    })),
    RouteTableAssociation: jest.fn().mockImplementation(() => ({
      id: 'mock-route-table-association-id',
    })),
    SecurityGroup: jest.fn().mockImplementation(() => ({
      id: 'mock-security-group-id',
    })),
    SecurityGroupRule: jest.fn().mockImplementation(() => ({
      id: 'mock-security-group-rule-id',
    })),
    Eip: jest.fn().mockImplementation(() => ({
      id: 'mock-eip-id',
    })),
    NatGateway: jest.fn().mockImplementation(() => ({
      id: 'mock-nat-gateway-id',
    })),
    NetworkAcl: jest.fn().mockImplementation(() => ({
      id: 'mock-network-acl-id',
    })),
    NetworkAclRule: jest.fn().mockImplementation(() => ({
      id: 'mock-network-acl-rule-id',
    })),
    NetworkAclAssociation: jest.fn().mockImplementation(() => ({
      id: 'mock-network-acl-association-id',
    })),
    FlowLog: jest.fn().mockImplementation(() => ({
      id: 'mock-flow-log-id',
    })),
  },
  rds: {
    SubnetGroup: jest.fn().mockImplementation(() => ({
      id: 'mock-subnet-group-id',
      name: 'mock-subnet-group-name',
    })),
    Instance: jest.fn().mockImplementation(() => ({
      id: 'mock-rds-instance-id',
      endpoint: 'mock-rds-endpoint.amazonaws.com',
      port: 3306,
      arn: 'arn:aws:rds:ap-south-1:123456789012:db:mock-rds-instance',
    })),
    ParameterGroup: jest.fn().mockImplementation(() => ({
      id: 'mock-parameter-group-id',
      name: 'mock-parameter-group-name',
    })),
  },
  s3: {
    Bucket: jest.fn().mockImplementation(() => ({
      id: 'mock-s3-bucket-name',
      bucket: 'mock-s3-bucket-name',
      arn: 'arn:aws:s3:::mock-s3-bucket-name',
    })),
    BucketVersioning: jest.fn().mockImplementation(() => ({
      id: 'mock-bucket-versioning-id',
    })),
    BucketServerSideEncryptionConfiguration: jest.fn().mockImplementation(() => ({
      id: 'mock-bucket-encryption-id',
    })),
    BucketLifecycleConfiguration: jest.fn().mockImplementation(() => ({
      id: 'mock-bucket-lifecycle-id',
    })),
    BucketPublicAccessBlock: jest.fn().mockImplementation(() => ({
      id: 'mock-bucket-public-access-block-id',
    })),
    BucketPolicy: jest.fn().mockImplementation(() => ({
      id: 'mock-bucket-policy-id',
    })),
    BucketLogging: jest.fn().mockImplementation(() => ({
      id: 'mock-bucket-logging-id',
    })),
  },
  iam: {
    Role: jest.fn().mockImplementation(() => ({
      id: 'mock-role-id',
      arn: 'arn:aws:iam::123456789012:role/mock-role',
      name: 'mock-role-name',
    })),
    RolePolicyAttachment: jest.fn().mockImplementation(() => ({
      id: 'mock-role-policy-attachment-id',
    })),
    InstanceProfile: jest.fn().mockImplementation(() => ({
      id: 'mock-instance-profile-id',
      arn: 'arn:aws:iam::123456789012:instance-profile/mock-profile',
      name: 'mock-instance-profile-name',
    })),
    Policy: jest.fn().mockImplementation(() => ({
      id: 'mock-policy-id',
      arn: 'arn:aws:iam::123456789012:policy/mock-policy',
    })),
  },
  kms: {
    Key: jest.fn().mockImplementation(() => ({
      id: 'mock-kms-key-id',
      keyId: 'mock-kms-key-id',
      arn: 'arn:aws:kms:ap-south-1:123456789012:key/mock-key',
    })),
    Alias: jest.fn().mockImplementation(() => ({
      id: 'mock-kms-alias-id',
    })),
  },
  sns: {
    Topic: jest.fn().mockImplementation(() => ({
      id: 'mock-sns-topic-id',
      arn: 'arn:aws:sns:ap-south-1:123456789012:mock-topic',
    })),
  },
  cloudwatch: {
    LogGroup: jest.fn().mockImplementation(() => ({
      id: 'mock-log-group-id',
      arn: {
        apply: (fn: any) => fn('arn:aws:logs:ap-south-1:123456789012:log-group:mock-log-group'),
      },
    })),
    MetricAlarm: jest.fn().mockImplementation(() => ({
      id: 'mock-metric-alarm-id',
    })),
    Dashboard: jest.fn().mockImplementation(() => ({
      id: 'mock-dashboard-id',
    })),
  },
  secretsmanager: {
    Secret: jest.fn().mockImplementation(() => ({
      id: 'mock-secret-id',
      arn: 'arn:aws:secretsmanager:ap-south-1:123456789012:secret:mock-secret',
    })),
    SecretVersion: jest.fn().mockImplementation(() => ({
      id: 'mock-secret-version-id',
    })),
  },
}));

import { Infrastructure, InfrastructureConfig, createResourceName, createTags } from '../lib/infrastructure';

describe('Infrastructure Unit Tests', () => {
  let mockConfig: InfrastructureConfig;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockConfig = {
      region: 'ap-south-1',
      availabilityZones: ['ap-south-1a', 'ap-south-1b'],
      vpcCidr: '10.0.0.0/16',
      publicSubnetCidrs: ['10.0.1.0/24', '10.0.2.0/24'],
      privateSubnetCidrs: ['10.0.10.0/24', '10.0.20.0/24'],
      rdsConfig: {
        instanceClass: 'db.t3.micro',
        allocatedStorage: 20,
        engine: 'mysql',
        engineVersion: '8.0',
        dbName: 'appdb',
        username: 'admin',
      },
      s3Config: {
        lifecyclePolicies: {
          transitionToIa: 30,
          transitionToGlacier: 90,
          expiration: 365,
        },
      },
      tags: {
        Environment: 'test',
        Project: 'TAP',
        Owner: 'DevTeam',
      },
    };
  });

  describe('Helper Functions', () => {
    describe('createResourceName', () => {
      it('should create resource name with correct format', () => {
        const result = createResourceName('vpc', 'us-east-1', 'prod');
        expect(result).toBe('vpc-prod-us-east-1');
      });

      it('should handle different base names', () => {
        expect(createResourceName('subnet', 'ap-south-1', 'dev')).toBe('subnet-dev-ap-south-1');
        expect(createResourceName('rds-instance', 'eu-west-1', 'staging')).toBe('rds-instance-staging-eu-west-1');
      });
    });

    describe('createTags', () => {
      it('should merge base tags with region and managed by tags', () => {
        const baseTags = {
          Environment: 'prod',
          Project: 'MyProject',
        };
        
        const result = createTags(baseTags, 'us-east-1');
        
        expect(result).toEqual({
          Environment: 'prod',
          Project: 'MyProject',
          Region: 'us-east-1',
          ManagedBy: 'Pulumi',
        });
      });

      it('should override region if already present in base tags', () => {
        const baseTags = {
          Environment: 'prod',
          Region: 'should-be-overridden',
        };
        
        const result = createTags(baseTags, 'ap-south-1');
        
        expect(result).toEqual({
          Environment: 'prod',
          Region: 'ap-south-1',
          ManagedBy: 'Pulumi',
        });
      });
    });
  });

  describe('Infrastructure Constructor', () => {
    it('should create Infrastructure with valid configuration', () => {
      const infrastructure = new Infrastructure('test-infra', mockConfig, 'dev');
      
      expect(infrastructure).toBeInstanceOf(Infrastructure);
      expect(infrastructure.vpcId).toBeDefined();
      expect(infrastructure.publicSubnetIds).toBeDefined();
      expect(infrastructure.privateSubnetIds).toBeDefined();
      expect(infrastructure.rdsEndpoint).toBeDefined();
      expect(infrastructure.s3BucketName).toBeDefined();
      expect(infrastructure.applicationRoleArn).toBeDefined();
      expect(infrastructure.kmsKeyId).toBeDefined();
      expect(infrastructure.instanceProfileArn).toBeDefined();
    });

    it('should create VPC with correct configuration', () => {
      const aws = require('@pulumi/aws');
      new Infrastructure('test-infra', mockConfig, 'dev');
      
      expect(aws.ec2.Vpc).toHaveBeenCalledWith(
        'vpc-dev-ap-south-1',
        expect.objectContaining({
          cidrBlock: '10.0.0.0/16',
          enableDnsHostnames: true,
          enableDnsSupport: true,
          tags: expect.objectContaining({
            Name: 'vpc-dev-ap-south-1',
            Environment: 'test',
            Project: 'TAP',
            Owner: 'DevTeam',
            Region: 'ap-south-1',
            ManagedBy: 'Pulumi',
          }),
        }),
        expect.any(Object)
      );
    });

    it('should create Internet Gateway', () => {
      const aws = require('@pulumi/aws');
      new Infrastructure('test-infra', mockConfig, 'dev');
      
      expect(aws.ec2.InternetGateway).toHaveBeenCalledWith(
        'igw-dev-ap-south-1',
        expect.objectContaining({
          vpcId: expect.any(String),
          tags: expect.objectContaining({
            Name: 'igw-dev-ap-south-1',
          }),
        }),
        expect.any(Object)
      );
    });

    it('should create public subnets for each availability zone', () => {
      const aws = require('@pulumi/aws');
      new Infrastructure('test-infra', mockConfig, 'dev');
      
      expect(aws.ec2.Subnet).toHaveBeenCalledWith(
        'public-subnet-1-dev-ap-south-1',
        expect.objectContaining({
          vpcId: expect.any(String),
          cidrBlock: '10.0.1.0/24',
          availabilityZone: 'ap-south-1a',
          mapPublicIpOnLaunch: true,
        }),
        expect.any(Object)
      );

      expect(aws.ec2.Subnet).toHaveBeenCalledWith(
        'public-subnet-2-dev-ap-south-1',
        expect.objectContaining({
          vpcId: expect.any(String),
          cidrBlock: '10.0.2.0/24',
          availabilityZone: 'ap-south-1b',
          mapPublicIpOnLaunch: true,
        }),
        expect.any(Object)
      );
    });

    it('should create private subnets for each availability zone', () => {
      const aws = require('@pulumi/aws');
      new Infrastructure('test-infra', mockConfig, 'dev');
      
      expect(aws.ec2.Subnet).toHaveBeenNthCalledWith(
        3, // Third call should be private-subnet-1
        'private-subnet-1-dev-ap-south-1',
        expect.objectContaining({
          vpcId: expect.any(String),
          cidrBlock: '10.0.10.0/24',
          availabilityZone: 'ap-south-1a',
        }),
        expect.any(Object)
      );

      expect(aws.ec2.Subnet).toHaveBeenNthCalledWith(
        4, // Fourth call should be private-subnet-2
        'private-subnet-2-dev-ap-south-1',
        expect.objectContaining({
          vpcId: expect.any(String),
          cidrBlock: '10.0.20.0/24',
          availabilityZone: 'ap-south-1b',
        }),
        expect.any(Object)
      );
    });

    it('should create KMS key with correct configuration', () => {
      const aws = require('@pulumi/aws');
      new Infrastructure('test-infra', mockConfig, 'dev');
      
      expect(aws.kms.Key).toHaveBeenCalledWith(
        'app-key-dev-ap-south-1',
        expect.objectContaining({
          description: 'KMS key for dev environment in ap-south-1',
          enableKeyRotation: true,
          policy: expect.any(Object),
        }),
        expect.any(Object)
      );
    });

    it('should create S3 bucket with encryption and lifecycle policies', () => {
      const aws = require('@pulumi/aws');
      new Infrastructure('test-infra', mockConfig, 'dev');
      
      expect(aws.s3.Bucket).toHaveBeenCalled();
      expect(aws.s3.BucketServerSideEncryptionConfiguration).toHaveBeenCalled();
      expect(aws.s3.BucketVersioning).toHaveBeenCalled();
      expect(aws.s3.BucketLifecycleConfiguration).toHaveBeenCalled();
      expect(aws.s3.BucketPublicAccessBlock).toHaveBeenCalled();
    });


    it('should create IAM role and instance profile', () => {
      const aws = require('@pulumi/aws');
      new Infrastructure('test-infra', mockConfig, 'dev');
      
      expect(aws.iam.Role).toHaveBeenCalledWith(
        'app-role-dev-ap-south-1',
        expect.objectContaining({
          assumeRolePolicy: expect.any(String),
          tags: expect.any(Object),
        }),
        expect.any(Object)
      );

      expect(aws.iam.InstanceProfile).toHaveBeenCalledWith(
        'app-instance-profile-dev-ap-south-1',
        expect.objectContaining({
          role: expect.any(String),
          tags: expect.any(Object),
        }),
        expect.any(Object)
      );
    });

    it('should create security groups with proper configuration', () => {
      const aws = require('@pulumi/aws');
      new Infrastructure('test-infra', mockConfig, 'dev');
      
      expect(aws.ec2.SecurityGroup).toHaveBeenCalledWith(
        'web-sg-dev-ap-south-1',
        expect.objectContaining({
          namePrefix: 'web-sg-dev-ap-south-1',
          description: 'Security group for web tier - public facing',
          ingress: expect.arrayContaining([
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

    it('should create CloudWatch monitoring resources', () => {
      const aws = require('@pulumi/aws');
      new Infrastructure('test-infra', mockConfig, 'dev');
      
      expect(aws.cloudwatch.LogGroup).toHaveBeenCalled();
      expect(aws.cloudwatch.MetricAlarm).toHaveBeenCalled();
      expect(aws.sns.Topic).toHaveBeenCalled();
    });
  });

  describe('Resource Outputs', () => {
    let infrastructure: Infrastructure;

    beforeEach(() => {
      infrastructure = new Infrastructure('test-infra', mockConfig, 'dev');
    });

    it('should expose VPC ID output', () => {
      expect(infrastructure.vpcId).toBeDefined();
      expect(infrastructure.vpcId).toBe('mock-vpc-id');
    });

    it('should expose public subnet IDs as array', () => {
      expect(infrastructure.publicSubnetIds).toBeDefined();
      expect(Array.isArray(infrastructure.publicSubnetIds)).toBe(true);
    });

    it('should expose private subnet IDs as array', () => {
      expect(infrastructure.privateSubnetIds).toBeDefined();
      expect(Array.isArray(infrastructure.privateSubnetIds)).toBe(true);
    });

    it('should expose RDS endpoint output', () => {
      expect(infrastructure.rdsEndpoint).toBeDefined();
      expect(infrastructure.rdsEndpoint).toBe('mock-rds-endpoint.amazonaws.com');
    });

    it('should expose S3 bucket name output', () => {
      expect(infrastructure.s3BucketName).toBeDefined();
      expect(infrastructure.s3BucketName).toBe('mock-s3-bucket-name');
    });

    it('should expose application role ARN output', () => {
      expect(infrastructure.applicationRoleArn).toBeDefined();
      expect(infrastructure.applicationRoleArn).toBe('arn:aws:iam::123456789012:role/mock-role');
    });

    it('should expose KMS key ID output', () => {
      expect(infrastructure.kmsKeyId).toBeDefined();
      expect(infrastructure.kmsKeyId).toBe('mock-kms-key-id');
    });

    it('should expose instance profile ARN output', () => {
      expect(infrastructure.instanceProfileArn).toBeDefined();
      expect(infrastructure.instanceProfileArn).toBe('arn:aws:iam::123456789012:instance-profile/mock-profile');
    });
  });

  describe('Configuration Validation', () => {
    it('should handle different regions', () => {
      const configWithDifferentRegion = {
        ...mockConfig,
        region: 'us-west-2',
        availabilityZones: ['us-west-2a', 'us-west-2b'],
      };
      
      const infrastructure = new Infrastructure('test-infra', configWithDifferentRegion, 'prod');
      expect(infrastructure).toBeInstanceOf(Infrastructure);
    });

    it('should handle different RDS engines', () => {
      const postgresConfig = {
        ...mockConfig,
        rdsConfig: {
          ...mockConfig.rdsConfig,
          engine: 'postgres',
          engineVersion: '13.7',
        },
      };
      
      expect(() => {
        new Infrastructure('test-infra', postgresConfig, 'dev');
      }).not.toThrow();
    });

    it('should handle single availability zone', () => {
      const singleAzConfig = {
        ...mockConfig,
        availabilityZones: ['ap-south-1a'],
        publicSubnetCidrs: ['10.0.1.0/24'],
        privateSubnetCidrs: ['10.0.10.0/24'],
      };
      
      const infrastructure = new Infrastructure('test-infra', singleAzConfig, 'dev');
      expect(infrastructure).toBeInstanceOf(Infrastructure);
    });
  });
});
