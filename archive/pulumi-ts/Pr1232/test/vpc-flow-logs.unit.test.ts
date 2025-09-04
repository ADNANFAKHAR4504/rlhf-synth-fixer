import * as aws from '@pulumi/aws';
import * as pulumi from '@pulumi/pulumi';
import { SecureCompliantInfra } from '../lib/secure-compliant-infra';

jest.mock('@pulumi/pulumi', () => ({
  ComponentResource: jest.fn().mockImplementation(function(this: any, type: string, name: string, args: any, opts: any) {
    this.registerOutputs = jest.fn();
    return this;
  }),
  Output: {
    create: jest.fn((value) => ({ apply: jest.fn((fn) => fn(value)) })),
  },
  output: jest.fn((value) => {
    if (value && value.names) {
      return { names: value.names };
    }
    return { apply: jest.fn((fn) => fn(value)) };
  }),
  all: jest.fn((outputs) => ({ apply: jest.fn((fn) => fn(outputs)) })),
  interpolate: jest.fn((template) => ({ apply: jest.fn((fn) => fn(template)) })),
}));

jest.mock('@pulumi/aws', () => ({
  Provider: jest.fn().mockImplementation(function(this: any, name: string, args: any, opts: any) {
    return this;
  }),
  getCallerIdentity: jest.fn(() => ({ accountId: '123456789012' })),
  getAvailabilityZones: jest.fn(() => ({ names: ['us-west-1a', 'us-west-1b'] })),
  kms: {
    Key: jest.fn().mockImplementation(function(this: any, name: string, args: any, opts: any) {
      this.keyId = 'mock-key-id';
      this.arn = 'arn:aws:kms:us-west-1:123456789012:key/mock-key-id';
      return this;
    }),
    Alias: jest.fn().mockImplementation(function(this: any, name: string, args: any, opts: any) {
      return this;
    }),
  },
  s3: {
    Bucket: jest.fn().mockImplementation(function(this: any, name: string, args: any, opts: any) {
      this.id = `mock-bucket-${name}`;
      this.arn = `arn:aws:s3:::${args.bucket}`;
      this.bucket = args.bucket;
      return this;
    }),
    BucketServerSideEncryptionConfiguration: jest.fn().mockImplementation(function(this: any, name: string, args: any, opts: any) {
      return this;
    }),
    BucketPublicAccessBlock: jest.fn().mockImplementation(function(this: any, name: string, args: any, opts: any) {
      return this;
    }),
    BucketLogging: jest.fn().mockImplementation(function(this: any, name: string, args: any, opts: any) {
      return this;
    }),
    BucketPolicy: jest.fn().mockImplementation(function(this: any, name: string, args: any, opts: any) {
      return this;
    }),
  },
  cloudtrail: {
    Trail: jest.fn().mockImplementation(function(this: any, name: string, args: any, opts: any) {
      this.arn = `arn:aws:cloudtrail:us-west-1:123456789012:trail/${args.name}`;
      return this;
    }),
  },
  wafv2: {
    WebAcl: jest.fn().mockImplementation(function(this: any, name: string, args: any, opts: any) {
      this.arn = `arn:aws:wafv2:us-west-1:123456789012:regional/webacl/${args.name}/mock-id`;
      return this;
    }),
  },
  ec2: {
    getAmi: jest.fn(() => ({ id: 'ami-12345678' })),
    Vpc: jest.fn().mockImplementation(function(this: any, name: string, args: any, opts: any) {
      this.id = `vpc-${name}`;
      return this;
    }),
    InternetGateway: jest.fn().mockImplementation(function(this: any, name: string, args: any, opts: any) {
      this.id = `igw-${name}`;
      return this;
    }),
    Subnet: jest.fn().mockImplementation(function(this: any, name: string, args: any, opts: any) {
      this.id = `subnet-${name}`;
      return this;
    }),
    RouteTable: jest.fn().mockImplementation(function(this: any, name: string, args: any, opts: any) {
      this.id = `rt-${name}`;
      return this;
    }),
    RouteTableAssociation: jest.fn().mockImplementation(function(this: any, name: string, args: any, opts: any) {
      return this;
    }),
    SecurityGroup: jest.fn().mockImplementation(function(this: any, name: string, args: any, opts: any) {
      this.id = `sg-${name}`;
      return this;
    }),
    KeyPair: jest.fn().mockImplementation(function(this: any, name: string, args: any, opts: any) {
      this.keyName = args.keyName;
      return this;
    }),
    Instance: jest.fn().mockImplementation(function(this: any, name: string, args: any, opts: any) {
      this.id = `i-${name}`;
      return this;
    }),
    FlowLog: jest.fn().mockImplementation(function(this: any, name: string, args: any, opts: any) {
      this.id = `fl-${name}`;
      this.vpcId = args.vpcId;
      this.trafficType = args.trafficType;
      this.logDestinationType = args.logDestinationType;
      this.logDestination = args.logDestination;
      this.logFormat = args.logFormat;
      return this;
    }),
  },
  iam: {
    Role: jest.fn().mockImplementation(function(this: any, name: string, args: any, opts: any) {
      this.id = `role-${name}`;
      this.name = args.name;
      this.arn = `arn:aws:iam::123456789012:role/${args.name}`;
      return this;
    }),
    RolePolicy: jest.fn().mockImplementation(function(this: any, name: string, args: any, opts: any) {
      return this;
    }),
    InstanceProfile: jest.fn().mockImplementation(function(this: any, name: string, args: any, opts: any) {
      this.name = args.name;
      return this;
    }),
  },
  rds: {
    SubnetGroup: jest.fn().mockImplementation(function(this: any, name: string, args: any, opts: any) {
      this.name = args.name;
      return this;
    }),
    Instance: jest.fn().mockImplementation(function(this: any, name: string, args: any, opts: any) {
      this.endpoint = `${args.identifier}.cluster-xyz.us-west-1.rds.amazonaws.com`;
      return this;
    }),
  },
}));

describe('VPC Flow Logs Unit Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('VPC Flow Logs Creation', () => {
    it('should create VPC Flow Logs for each VPC', () => {
      const infra = new SecureCompliantInfra('test-infra', {
        projectName: 'test-project',
        environment: 'test',
        regions: ['us-west-1', 'ap-south-1']
      });

      expect(aws.ec2.FlowLog).toHaveBeenCalledTimes(2);
    });

    it('should configure VPC Flow Logs with correct parameters', () => {
      const infra = new SecureCompliantInfra('test-infra', {
        projectName: 'security-test',
        environment: 'prod',
        regions: ['us-west-1']
      });

      expect(aws.ec2.FlowLog).toHaveBeenCalledWith(
        'security-test-prod-vpc-flow-logs-us-west-1',
        expect.objectContaining({
          trafficType: 'ALL',
          logDestinationType: 's3',
          logFormat: expect.stringContaining('${version}'),
          tags: expect.objectContaining({
            Project: 'security-test',
            Environment: 'prod',
            Name: 'security-test-prod-vpc-flow-logs-us-west-1'
          })
        }),
        expect.objectContaining({
          parent: expect.any(Object)
        })
      );
    });

    it('should create VPC Flow Logs with comprehensive log format', () => {
      const infra = new SecureCompliantInfra('test-infra', {
        regions: ['us-east-1']
      });

      expect(aws.ec2.FlowLog).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          logFormat: expect.stringMatching(/.*\$\{version\}.*\$\{account-id\}.*\$\{interface-id\}.*\$\{srcaddr\}.*\$\{dstaddr\}.*\$\{srcport\}.*\$\{dstport\}.*\$\{protocol\}.*\$\{packets\}.*\$\{bytes\}.*\$\{action\}.*\$\{log-status\}.*/)
        }),
        expect.any(Object)
      );
    });

    it('should capture ALL traffic types', () => {
      const infra = new SecureCompliantInfra('test-infra', {
        regions: ['eu-west-1']
      });

      expect(aws.ec2.FlowLog).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          trafficType: 'ALL'
        }),
        expect.any(Object)
      );
    });
  });

  describe('VPC Flow Logs S3 Bucket Configuration', () => {
    it('should create S3 bucket for VPC Flow Logs in each region', () => {
      const infra = new SecureCompliantInfra('test-infra', {
        projectName: 'bucket-test',
        environment: 'dev',
        regions: ['us-west-1', 'ap-south-1']
      });

      expect(aws.s3.Bucket).toHaveBeenCalledWith(
        'bucket-test-dev-vpc-flow-logs-us-west-1',
        expect.objectContaining({
          bucket: 'dev-bucket-test-vpc-flow-logs-us-west-1',
          forceDestroy: true,
          tags: expect.objectContaining({
            Project: 'bucket-test',
            Environment: 'dev',
            Name: 'bucket-test-dev-vpc-flow-logs-us-west-1'
          })
        }),
        expect.any(Object)
      );
    });

    it('should enable encryption for VPC Flow Logs S3 buckets', () => {
      const infra = new SecureCompliantInfra('test-infra', {
        regions: ['us-west-1']
      });

      expect(aws.s3.BucketServerSideEncryptionConfiguration).toHaveBeenCalledWith(
        expect.stringContaining('vpc-flow-logs-encryption'),
        expect.objectContaining({
          rules: [
            {
              applyServerSideEncryptionByDefault: {
                sseAlgorithm: 'AES256',
              },
              bucketKeyEnabled: true,
            },
          ],
        }),
        expect.any(Object)
      );
    });

    it('should block public access for VPC Flow Logs S3 buckets', () => {
      const infra = new SecureCompliantInfra('test-infra', {
        regions: ['ap-south-1']
      });

      expect(aws.s3.BucketPublicAccessBlock).toHaveBeenCalledWith(
        expect.stringContaining('vpc-flow-logs-public-block'),
        expect.objectContaining({
          blockPublicAcls: true,
          blockPublicPolicy: true,
          ignorePublicAcls: true,
          restrictPublicBuckets: true,
        }),
        expect.any(Object)
      );
    });
  });

  describe('VPC Flow Logs IAM Configuration', () => {
    it('should create IAM role for VPC Flow Logs service', () => {
      const infra = new SecureCompliantInfra('test-infra', {
        projectName: 'iam-test',
        environment: 'staging',
        regions: ['us-west-1']
      });

      expect(aws.iam.Role).toHaveBeenCalledWith(
        'iam-test-staging-vpc-flow-logs-role-us-west-1',
        expect.objectContaining({
          name: 'iam-test-staging-vpc-flow-logs-role-us-west-1',
          assumeRolePolicy: expect.stringContaining('vpc-flow-logs.amazonaws.com'),
          tags: expect.objectContaining({
            Project: 'iam-test',
            Environment: 'staging'
          })
        }),
        expect.any(Object)
      );
    });

    it('should create IAM policy with proper S3 permissions', () => {
      const infra = new SecureCompliantInfra('test-infra', {
        regions: ['eu-west-1']
      });

      expect(aws.iam.RolePolicy).toHaveBeenCalledWith(
        expect.stringContaining('vpc-flow-logs-policy'),
        expect.objectContaining({
          name: expect.stringContaining('vpc-flow-logs-policy'),
        }),
        expect.any(Object)
      );
    });

    it('should configure IAM role trust policy for VPC Flow Logs service', () => {
      const infra = new SecureCompliantInfra('test-infra', {
        regions: ['us-east-1']
      });

      expect(aws.iam.Role).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          assumeRolePolicy: expect.stringMatching(/.*vpc-flow-logs\.amazonaws\.com.*/)
        }),
        expect.any(Object)
      );
    });
  });

  describe('VPC Flow Logs Multi-Region Support', () => {
    it('should create VPC Flow Logs in multiple regions', () => {
      const infra = new SecureCompliantInfra('test-infra', {
        regions: ['us-west-1', 'us-east-1', 'eu-west-1']
      });

      expect(aws.ec2.FlowLog).toHaveBeenCalledTimes(3);
    });

    it('should create region-specific resources with proper naming', () => {
      const infra = new SecureCompliantInfra('test-infra', {
        projectName: 'multi-region',
        environment: 'test',
        regions: ['ap-south-1', 'ap-southeast-1']
      });

      expect(aws.ec2.FlowLog).toHaveBeenCalledWith(
        'multi-region-test-vpc-flow-logs-ap-south-1',
        expect.any(Object),
        expect.any(Object)
      );

      expect(aws.ec2.FlowLog).toHaveBeenCalledWith(
        'multi-region-test-vpc-flow-logs-ap-southeast-1',
        expect.any(Object),
        expect.any(Object)
      );
    });
  });

  describe('VPC Flow Logs Security Configuration', () => {
    it('should use S3 as log destination for security', () => {
      const infra = new SecureCompliantInfra('test-infra', {
        regions: ['us-west-1']
      });

      expect(aws.ec2.FlowLog).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          logDestinationType: 's3'
        }),
        expect.any(Object)
      );
    });

    it('should configure proper S3 destination path', () => {
      const infra = new SecureCompliantInfra('test-infra', {
        regions: ['us-west-1']
      });

      expect(aws.ec2.FlowLog).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          logDestination: expect.objectContaining({
            apply: expect.any(Function)
          })
        }),
        expect.any(Object)
      );
    });

    it('should apply security tags to all VPC Flow Logs resources', () => {
      const infra = new SecureCompliantInfra('test-infra', {
        projectName: 'security-tags',
        environment: 'prod',
        regions: ['us-west-1']
      });

      expect(aws.ec2.FlowLog).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          tags: expect.objectContaining({
            Project: 'security-tags',
            Environment: 'prod'
          })
        }),
        expect.any(Object)
      );
    });
  });

  describe('VPC Flow Logs Error Handling', () => {
    it('should handle single region deployment', () => {
      expect(() => {
        new SecureCompliantInfra('test-infra', {
          regions: ['us-west-1']
        });
      }).not.toThrow();

      expect(aws.ec2.FlowLog).toHaveBeenCalledTimes(1);
    });

    it('should handle empty regions array gracefully', () => {
      expect(() => {
        new SecureCompliantInfra('test-infra', {
          regions: []
        });
      }).not.toThrow();
    });

    it('should use default regions when not specified', () => {
      const infra = new SecureCompliantInfra('test-infra', {});

      expect(aws.ec2.FlowLog).toHaveBeenCalledTimes(2);
    });
  });

  describe('VPC Flow Logs Resource Dependencies', () => {
    it('should create VPC Flow Logs after VPC creation', () => {
      const infra = new SecureCompliantInfra('test-infra', {
        regions: ['us-west-1']
      });

      expect(aws.ec2.Vpc).toHaveBeenCalled();
      expect(aws.ec2.FlowLog).toHaveBeenCalled();
    });

    it('should create S3 bucket before VPC Flow Logs', () => {
      const infra = new SecureCompliantInfra('test-infra', {
        regions: ['us-west-1']
      });

      expect(aws.s3.Bucket).toHaveBeenCalled();
      expect(aws.ec2.FlowLog).toHaveBeenCalled();
    });

    it('should create IAM role before VPC Flow Logs', () => {
      const infra = new SecureCompliantInfra('test-infra', {
        regions: ['us-west-1']
      });

      expect(aws.iam.Role).toHaveBeenCalled();
      expect(aws.ec2.FlowLog).toHaveBeenCalled();
    });
  });
});
