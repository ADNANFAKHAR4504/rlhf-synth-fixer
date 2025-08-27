// Mock the modules before importing anything
jest.mock('@pulumi/pulumi', () => ({
  ComponentResource: jest.fn().mockImplementation(function () {
    this.registerOutputs = jest.fn();
  }),
  interpolate: jest.fn((strings, ...values) => {
    if (typeof strings === 'string') return strings;
    return strings.reduce(
      (result, str, i) => result + str + (values[i] || ''),
      ''
    );
  }),
  output: jest.fn(val => ({
    apply: jest.fn(fn => fn(val)),
  })),
  secret: jest.fn(val => val),
  asset: {
    AssetArchive: jest.fn(),
    StringAsset: jest.fn(),
  },
  Config: jest.fn().mockImplementation(() => ({
    get: jest.fn(key => {
      const values = {
        env: 'test',
        repository: 'test-repo',
        commitAuthor: 'test-author',
      };
      return values[key];
    }),
  })),
}));

jest.mock('@pulumi/aws', () => ({
  ec2: {
    Vpc: jest.fn().mockImplementation(() => ({
      id: 'vpc-mock-12345',
      defaultSecurityGroupId: 'sg-default-12345',
    })),
    InternetGateway: jest
      .fn()
      .mockImplementation(() => ({ id: 'igw-mock-12345' })),
    Subnet: jest.fn().mockImplementation(() => ({ id: 'subnet-mock-12345' })),
    RouteTable: jest.fn().mockImplementation(() => ({ id: 'rt-mock-12345' })),
    Route: jest.fn(),
    RouteTableAssociation: jest.fn(),
    SecurityGroup: jest
      .fn()
      .mockImplementation(() => ({ id: 'sg-mock-12345' })),
    Instance: jest.fn().mockImplementation(() => ({ id: 'i-mock-12345' })),
    getAmi: jest.fn(() => Promise.resolve({ id: 'ami-12345' })),
  },
  s3: {
    Bucket: jest.fn().mockImplementation(() => ({
      id: 'mock-bucket-id-12345',
      bucket: 'mock-bucket-name',
      arn: 'arn:aws:s3:::mock-bucket',
    })),
    BucketVersioning: jest.fn(),
    BucketServerSideEncryptionConfiguration: jest.fn(),
    BucketPublicAccessBlock: jest.fn(),
    BucketLogging: jest.fn(),
    BucketLifecycleConfiguration: jest.fn(),
    BucketPolicy: jest.fn(),
  },
  kms: {
    Key: jest.fn().mockImplementation(() => ({
      keyId: 'key-mock-12345',
      arn: 'arn:aws:kms:us-east-1:123456789012:key/mock-key',
    })),
    Alias: jest.fn(),
  },
  rds: {
    Instance: jest.fn().mockImplementation(() => ({
      endpoint: 'mysql.mock.rds.amazonaws.com:3306',
      identifier: 'mysql-mock-12345',
    })),
    SubnetGroup: jest
      .fn()
      .mockImplementation(() => ({ name: 'db-subnet-group-mock' })),
    ParameterGroup: jest
      .fn()
      .mockImplementation(() => ({ name: 'db-params-mock' })),
  },
  iam: {
    Role: jest.fn().mockImplementation(() => ({
      name: 'role-mock-12345',
      arn: 'arn:aws:iam::123456789012:role/mock-role',
    })),
    Policy: jest
      .fn()
      .mockImplementation(() => ({
        arn: 'arn:aws:iam::123456789012:policy/mock-policy',
      })),
    RolePolicyAttachment: jest.fn(),
    InstanceProfile: jest
      .fn()
      .mockImplementation(() => ({ name: 'instance-profile-mock' })),
  },
  cloudwatch: {
    MetricAlarm: jest.fn(),
    Dashboard: jest
      .fn()
      .mockImplementation(() => ({
        dashboardUrl: 'https://cloudwatch.mock.url',
      })),
    EventRule: jest.fn().mockImplementation(() => ({
      name: 'event-rule-mock',
      arn: 'arn:aws:events:us-east-1:123456789012:rule/mock-rule',
    })),
    EventTarget: jest.fn(),
  },
  sns: {
    Topic: jest
      .fn()
      .mockImplementation(() => ({
        arn: 'arn:aws:sns:us-east-1:123456789012:mock-topic',
      })),
  },
  cloudtrail: {
    Trail: jest
      .fn()
      .mockImplementation(() => ({
        arn: 'arn:aws:cloudtrail:us-east-1:123456789012:trail/mock-trail',
      })),
  },
  secretsmanager: {
    Secret: jest.fn().mockImplementation(() => ({
      id: 'secret-mock-12345',
      arn: 'arn:aws:secretsmanager:us-east-1:123456789012:secret:mock-secret',
    })),
    SecretVersion: jest
      .fn()
      .mockImplementation(() => ({ secretString: 'mock-password' })),
  },
  lambda: {
    Function: jest.fn().mockImplementation(() => ({
      functionName: 'lambda-mock-12345',
      arn: 'arn:aws:lambda:us-east-1:123456789012:function:mock-function',
    })),
    Permission: jest.fn(),
  },
  random: {
    randomPassword: jest.fn(() => ({ result: 'mock-random-password' })),
  },
}));

jest.mock('@pulumi/random', () => ({
  RandomPassword: jest
    .fn()
    .mockImplementation(() => ({ result: 'mock-random-password' })),
}));

// Import mocked modules
import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

// Import components after mocking
import { TapStack } from '../lib/tap-stack.mjs';
import { VPCStack } from '../lib/vpc-stack.mjs';
import { S3Stack } from '../lib/s3-stack.mjs';
import { RDSStack } from '../lib/rds-stack.mjs';
import { EC2Stack } from '../lib/ec2-stack.mjs';
import { MonitoringStack } from '../lib/monitoring-stack.mjs';
import { SecurityStack } from '../lib/security-stack.mjs';

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

    it('should create all child stacks', () => {
      const stack = new TapStack('TestTapStackComplete', {
        environmentSuffix: 'test',
        tags: { Project: 'SecureApp' },
      });
      expect(stack.vpcId).toBeDefined();
      expect(stack.bucketName).toBeDefined();
      expect(stack.rdsEndpoint).toBeDefined();
      expect(stack.ec2InstanceIds).toBeDefined();
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

    it('should register outputs correctly', () => {
      const stack = new TapStack('TestTapStackRegisterOutputs', {});
      expect(stack.registerOutputs).toHaveBeenCalledWith(
        expect.objectContaining({
          vpcId: expect.anything(),
          bucketName: expect.anything(),
          rdsEndpoint: expect.anything(),
          instanceIds: expect.anything(),
        })
      );
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
});

describe('VPCStack', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should create VPC with correct configuration', () => {
    const stack = new VPCStack('TestVPC', {
      environmentSuffix: 'test',
      tags: { Project: 'SecureApp' },
    });

    expect(aws.ec2.Vpc).toHaveBeenCalledWith(
      expect.stringContaining('SecureApp-vpc-test'),
      expect.objectContaining({
        cidrBlock: '10.0.0.0/16',
        enableDnsHostnames: true,
        enableDnsSupport: true,
      }),
      expect.any(Object)
    );
    expect(stack.vpcId).toBeDefined();
  });

  it('should use default environment suffix when not provided', () => {
    const stack = new VPCStack('TestVPCDefault', {});
    expect(aws.ec2.Vpc).toHaveBeenCalledWith(
      expect.stringContaining('SecureApp-vpc-dev'),
      expect.any(Object),
      expect.any(Object)
    );
  });

  it('should use empty tags when not provided', () => {
    const stack = new VPCStack('TestVPCNoTags', { environmentSuffix: 'test' });
    expect(aws.ec2.Vpc).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        tags: expect.objectContaining({
          Name: expect.stringContaining('SecureApp-vpc-test'),
        }),
      }),
      expect.any(Object)
    );
  });

  it('should create Internet Gateway', () => {
    new VPCStack('TestVPCIGW', { environmentSuffix: 'test' });
    expect(aws.ec2.InternetGateway).toHaveBeenCalled();
  });

  it('should create public subnets', () => {
    const stack = new VPCStack('TestVPCSubnets', { environmentSuffix: 'test' });
    expect(aws.ec2.Subnet).toHaveBeenCalledTimes(2);
    expect(stack.publicSubnetIds).toHaveLength(2);
  });

  it('should create security groups', () => {
    const stack = new VPCStack('TestVPCSG', { environmentSuffix: 'test' });
    expect(aws.ec2.SecurityGroup).toHaveBeenCalled();
    expect(stack.webSecurityGroupId).toBeDefined();
  });
});

describe('S3Stack', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should create S3 bucket with KMS encryption', () => {
    const stack = new S3Stack('TestS3', {
      environmentSuffix: 'test',
      tags: { Project: 'SecureApp' },
      cloudTrailArn: 'arn:aws:cloudtrail:us-east-1:123456789012:trail/test',
    });

    expect(aws.kms.Key).toHaveBeenCalled();
    expect(aws.s3.Bucket).toHaveBeenCalledTimes(2); // Main bucket and logs bucket
    expect(stack.bucketName).toBeDefined();
    expect(stack.bucketArn).toBeDefined();
  });

  it('should use default environment suffix when not provided', () => {
    new S3Stack('TestS3Default', { cloudTrailArn: 'arn:test' });
    expect(aws.s3.Bucket).toHaveBeenCalledWith(
      expect.stringContaining('SecureApp-data-bucket-dev'),
      expect.any(Object),
      expect.any(Object)
    );
  });

  it('should configure bucket versioning', () => {
    new S3Stack('TestS3Versioning', {
      environmentSuffix: 'test',
      cloudTrailArn: 'arn:aws:cloudtrail:us-east-1:123456789012:trail/test',
    });
    expect(aws.s3.BucketVersioning).toHaveBeenCalled();
  });

  it('should configure server-side encryption', () => {
    new S3Stack('TestS3Encryption', {
      environmentSuffix: 'test',
      cloudTrailArn: 'arn:aws:cloudtrail:us-east-1:123456789012:trail/test',
    });
    expect(aws.s3.BucketServerSideEncryptionConfiguration).toHaveBeenCalled();
  });

  it('should block public access', () => {
    new S3Stack('TestS3PublicAccess', {
      environmentSuffix: 'test',
      cloudTrailArn: 'arn:aws:cloudtrail:us-east-1:123456789012:trail/test',
    });
    expect(aws.s3.BucketPublicAccessBlock).toHaveBeenCalledTimes(2);
  });

  it('should configure access logging', () => {
    new S3Stack('TestS3Logging', {
      environmentSuffix: 'test',
      cloudTrailArn: 'arn:aws:cloudtrail:us-east-1:123456789012:trail/test',
    });
    expect(aws.s3.BucketLogging).toHaveBeenCalled();
  });
});

describe('RDSStack', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should create RDS instance with encryption', () => {
    const stack = new RDSStack('TestRDS', {
      environmentSuffix: 'test',
      tags: { Project: 'SecureApp' },
      vpcId: 'vpc-12345',
      publicSubnetIds: ['subnet-1', 'subnet-2'],
      vpcSecurityGroupId: 'sg-12345',
    });

    expect(aws.kms.Key).toHaveBeenCalled();
    expect(aws.rds.Instance).toHaveBeenCalledWith(
      expect.stringContaining('SecureApp-mysql-test'),
      expect.objectContaining({
        engine: 'mysql',
        storageEncrypted: true,
        instanceClass: 'db.t3.micro',
      }),
      expect.any(Object)
    );
    expect(stack.rdsEndpoint).toBeDefined();
  });

  it('should use default environment suffix when not provided', () => {
    new RDSStack('TestRDSDefault', {
      vpcId: 'vpc-12345',
      publicSubnetIds: ['subnet-1'],
      vpcSecurityGroupId: 'sg-12345',
    });
    expect(aws.rds.Instance).toHaveBeenCalledWith(
      expect.stringContaining('SecureApp-mysql-dev'),
      expect.any(Object),
      expect.any(Object)
    );
  });

  it('should create DB subnet group', () => {
    new RDSStack('TestRDSSubnetGroup', {
      environmentSuffix: 'test',
      vpcId: 'vpc-12345',
      publicSubnetIds: ['subnet-1', 'subnet-2'],
      vpcSecurityGroupId: 'sg-12345',
    });
    expect(aws.rds.SubnetGroup).toHaveBeenCalled();
  });

  it('should create RDS security group', () => {
    new RDSStack('TestRDSSG', {
      environmentSuffix: 'test',
      vpcId: 'vpc-12345',
      publicSubnetIds: ['subnet-1', 'subnet-2'],
      vpcSecurityGroupId: 'sg-12345',
    });
    expect(aws.ec2.SecurityGroup).toHaveBeenCalled();
  });

  it('should use default DB parameter group', () => {
    new RDSStack('TestRDSParams', {
      environmentSuffix: 'test',
      vpcId: 'vpc-12345',
      publicSubnetIds: ['subnet-1', 'subnet-2'],
      vpcSecurityGroupId: 'sg-12345',
    });
    // Verify RDS instance is created with default parameter group
    expect(aws.rds.Instance).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        parameterGroupName: 'default.mysql8.0',
      }),
      expect.any(Object)
    );
  });

  it('should store password in Secrets Manager', () => {
    const stack = new RDSStack('TestRDSSecrets', {
      environmentSuffix: 'test',
      vpcId: 'vpc-12345',
      publicSubnetIds: ['subnet-1', 'subnet-2'],
      vpcSecurityGroupId: 'sg-12345',
    });
    expect(aws.secretsmanager.Secret).toHaveBeenCalled();
    expect(aws.secretsmanager.SecretVersion).toHaveBeenCalled();
    expect(stack.dbPasswordSecretArn).toBeDefined();
  });
});

describe('EC2Stack', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should create EC2 instances with IAM roles', async () => {
    const stack = new EC2Stack('TestEC2', {
      environmentSuffix: 'test',
      tags: { Project: 'SecureApp' },
      vpcId: 'vpc-12345',
      publicSubnetIds: ['subnet-1', 'subnet-2'],
      s3BucketArn: 'arn:aws:s3:::test-bucket',
      rdsEndpoint: 'mysql.test.rds.amazonaws.com',
    });

    // Wait for async operations
    await new Promise(resolve => setTimeout(resolve, 0));

    expect(aws.iam.Role).toHaveBeenCalled();
    expect(aws.ec2.Instance).toHaveBeenCalledTimes(2);
    expect(stack.instanceIds).toHaveLength(2);
  });

  it('should use default environment suffix when not provided', () => {
    new EC2Stack('TestEC2Default', {
      vpcId: 'vpc-12345',
      publicSubnetIds: ['subnet-1'],
      s3BucketArn: 'arn:aws:s3:::test-bucket',
      rdsEndpoint: 'mysql.test.rds.amazonaws.com',
    });
    expect(aws.ec2.Instance).toHaveBeenCalledWith(
      expect.stringContaining('SecureApp-ec2-1-dev'),
      expect.any(Object),
      expect.any(Object)
    );
  });

  it('should create IAM policies for S3 and RDS access', () => {
    new EC2Stack('TestEC2Policies', {
      environmentSuffix: 'test',
      vpcId: 'vpc-12345',
      publicSubnetIds: ['subnet-1'],
      s3BucketArn: 'arn:aws:s3:::test-bucket',
      rdsEndpoint: 'mysql.test.rds.amazonaws.com',
    });

    // Should create S3, RDS, and CloudWatch policies
    expect(aws.iam.Policy).toHaveBeenCalledTimes(3);
    expect(aws.iam.RolePolicyAttachment).toHaveBeenCalledTimes(3);
  });

  it('should create instance profile', () => {
    new EC2Stack('TestEC2Profile', {
      environmentSuffix: 'test',
      vpcId: 'vpc-12345',
      publicSubnetIds: ['subnet-1'],
      s3BucketArn: 'arn:aws:s3:::test-bucket',
      rdsEndpoint: 'mysql.test.rds.amazonaws.com',
    });
    expect(aws.iam.InstanceProfile).toHaveBeenCalled();
  });

  it('should create EC2 security group', () => {
    new EC2Stack('TestEC2SG', {
      environmentSuffix: 'test',
      vpcId: 'vpc-12345',
      publicSubnetIds: ['subnet-1'],
      s3BucketArn: 'arn:aws:s3:::test-bucket',
      rdsEndpoint: 'mysql.test.rds.amazonaws.com',
    });
    expect(aws.ec2.SecurityGroup).toHaveBeenCalled();
  });
});

describe('MonitoringStack', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should create CloudWatch alarms for EC2 CPU', () => {
    new MonitoringStack('TestMonitoring', {
      environmentSuffix: 'test',
      tags: { Project: 'SecureApp' },
      ec2InstanceIds: ['i-12345', 'i-67890'],
      rdsInstanceId: 'mysql-test',
      s3BucketName: 'test-bucket',
    });

    // Should create one alarm per EC2 instance
    expect(aws.cloudwatch.MetricAlarm).toHaveBeenCalledTimes(4); // 2 EC2 + 2 RDS alarms
  });

  it('should use default environment suffix when not provided', () => {
    new MonitoringStack('TestMonitoringDefault', {
      ec2InstanceIds: ['i-12345'],
      rdsInstanceId: 'mysql-test',
      s3BucketName: 'test-bucket',
    });
    expect(aws.cloudwatch.MetricAlarm).toHaveBeenCalledWith(
      expect.stringContaining('SecureApp-ec2-cpu-alarm-1-dev'),
      expect.any(Object),
      expect.any(Object)
    );
  });

  it('should create SNS topic for alarms', () => {
    new MonitoringStack('TestMonitoringSNS', {
      environmentSuffix: 'test',
      ec2InstanceIds: ['i-12345'],
      rdsInstanceId: 'mysql-test',
      s3BucketName: 'test-bucket',
    });
    expect(aws.sns.Topic).toHaveBeenCalled();
  });

  it('should create CloudWatch dashboard', () => {
    const stack = new MonitoringStack('TestMonitoringDashboard', {
      environmentSuffix: 'test',
      ec2InstanceIds: ['i-12345'],
      rdsInstanceId: 'mysql-test',
      s3BucketName: 'test-bucket',
    });
    expect(aws.cloudwatch.Dashboard).toHaveBeenCalled();
    expect(stack.dashboardUrl).toBeDefined();
  });

  it('should set correct alarm thresholds', () => {
    new MonitoringStack('TestMonitoringThresholds', {
      environmentSuffix: 'test',
      ec2InstanceIds: ['i-12345'],
      rdsInstanceId: 'mysql-test',
      s3BucketName: 'test-bucket',
    });

    // Check EC2 CPU alarm threshold is 75%
    expect(aws.cloudwatch.MetricAlarm).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        threshold: 75,
        metricName: 'CPUUtilization',
      }),
      expect.any(Object)
    );
  });
});

describe('SecurityStack', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should create CloudTrail for audit logging', () => {
    const stack = new SecurityStack('TestSecurity', {
      environmentSuffix: 'test',
      tags: { Project: 'SecureApp' },
    });

    expect(aws.cloudtrail.Trail).toHaveBeenCalled();
    expect(stack.cloudTrailArn).toBeDefined();
  });

  it('should use default environment suffix when not provided', () => {
    new SecurityStack('TestSecurityDefault', {});
    expect(aws.cloudtrail.Trail).toHaveBeenCalledWith(
      expect.stringContaining('SecureApp-cloudtrail-dev'),
      expect.any(Object),
      expect.any(Object)
    );
  });

  it('should create S3 bucket for CloudTrail logs', () => {
    new SecurityStack('TestSecurityS3', {
      environmentSuffix: 'test',
    });
    expect(aws.s3.Bucket).toHaveBeenCalled();
    expect(aws.s3.BucketPublicAccessBlock).toHaveBeenCalled();
  });

  it('should create EventBridge rules for security events', () => {
    new SecurityStack('TestSecurityEvents', {
      environmentSuffix: 'test',
    });
    // Should create rules for S3 and RDS security events
    expect(aws.cloudwatch.EventRule).toHaveBeenCalledTimes(2);
  });

  it('should create Lambda function for automated response', () => {
    new SecurityStack('TestSecurityLambda', {
      environmentSuffix: 'test',
    });
    expect(aws.lambda.Function).toHaveBeenCalled();
    expect(aws.lambda.Permission).toHaveBeenCalled();
  });

  it('should create SNS topic for security alerts', () => {
    const stack = new SecurityStack('TestSecuritySNS', {
      environmentSuffix: 'test',
    });
    expect(aws.sns.Topic).toHaveBeenCalled();
    expect(stack.securityAlertTopicArn).toBeDefined();
  });

  it('should configure EventBridge targets', () => {
    new SecurityStack('TestSecurityTargets', {
      environmentSuffix: 'test',
    });
    // Should create targets for S3, RDS rules and Lambda
    expect(aws.cloudwatch.EventTarget).toHaveBeenCalledTimes(3);
  });
});
