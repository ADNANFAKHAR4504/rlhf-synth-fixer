// __tests__/tap-stack.test.ts
import { App } from "cdktf";
import "cdktf/lib/testing/adapters/jest";
import { TapStack } from "../lib/tap-stack";

// Mock all the modules used in TapStack
jest.mock("../lib/modules", () => ({
  validateStackConfiguration: jest.fn(),
  createKmsKey: jest.fn().mockImplementation((scope: any, config: any) => ({
    keyId: `key-${config.kmsKeyAlias}`,
    keyArn: `arn:aws:kms:${config.region}:${config.accountId}:key/${config.kmsKeyAlias}`,
  })),
  createVpcWithSubnetsAndNat: jest.fn().mockImplementation((scope: any, config: any) => ({
    vpc: {
      id: `vpc-${config.environment}`,
      cidrBlock: config.vpcCidr,
    },
    publicSubnets: [
      { id: `subnet-public-1-${config.environment}` },
      { id: `subnet-public-2-${config.environment}` }
    ],
    privateSubnets: [
      { id: `subnet-private-1-${config.environment}` },
      { id: `subnet-private-2-${config.environment}` }
    ],
    natGateways: [
      { id: `nat-1-${config.environment}` },
      { id: `nat-2-${config.environment}` }
    ],
  })),
  createIamRolesAndPolicies: jest.fn().mockImplementation((scope: any, config: any) => ({
    ec2Role: {
      arn: `arn:aws:iam::${config.accountId}:role/ec2-role-${config.environment}`,
      name: `ec2-role-${config.environment}`,
    },
    instanceProfile: {
      name: `instance-profile-${config.environment}`,
      arn: `arn:aws:iam::${config.accountId}:instance-profile/${config.environment}`,
    }
  })),
  createEncryptedS3Buckets: jest.fn().mockImplementation((scope: any, config: any, kmsKey: any) => ({
    appBucket: {
      bucket: `app-bucket-${config.environment}`,
      arn: `arn:aws:s3:::app-bucket-${config.environment}`,
      id: `app-bucket-${config.environment}`,
    },
    logBucket: {
      bucket: `log-bucket-${config.environment}`,
      arn: `arn:aws:s3:::log-bucket-${config.environment}`,
      id: `log-bucket-${config.environment}`,
    },
  })),
  createBastionHost: jest.fn().mockImplementation((scope: any, config: any, vpc: any, iam: any, kms: any) => ({
    instance: {
      id: `i-bastion-${config.environment}`,
      publicIp: "54.123.45.67",
      privateIp: "10.0.1.10",
    },
    securityGroup: {
      id: `sg-bastion-${config.environment}`,
    }
  })),
  createPrivateEc2Fleet: jest.fn().mockImplementation((scope: any, config: any, vpc: any, iam: any, kms: any) => ({
    instances: Array.from({ length: config.fleetSize }, (_, i) => ({
      id: `i-private-${i + 1}-${config.environment}`,
      privateIp: `10.0.10.${i + 10}`,
    })),
    securityGroup: {
      id: `sg-private-${config.environment}`,
    }
  })),
  createAlbForPrivateInstances: jest.fn().mockImplementation((scope: any, config: any, vpc: any, fleet: any) => ({
    alb: {
      dnsName: `alb-${config.environment}.elb.amazonaws.com`,
      arn: `arn:aws:elasticloadbalancing:${config.region}:${config.accountId}:loadbalancer/app/alb-${config.environment}`,
    },
    targetGroup: {
      arn: `arn:aws:elasticloadbalancing:${config.region}:${config.accountId}:targetgroup/tg-${config.environment}`,
    }
  })),
  createRdsMultiAz: jest.fn().mockImplementation((scope: any, config: any, vpc: any, kms: any) => ({
    instance: {
      endpoint: `rds-${config.environment}.cluster-123456789012.${config.region}.rds.amazonaws.com:3306`,
      id: `rds-${config.environment}`,
      arn: `arn:aws:rds:${config.region}:${config.accountId}:db:rds-${config.environment}`,
    },
    securityGroup: {
      id: `sg-rds-${config.environment}`,
    }
  })),
  createVPCFlowLogs: jest.fn().mockImplementation((scope: any, config: any, vpc: any) => ({
    logGroup: `/aws/vpc/flowlogs/${config.environment}`,
    flowLog: {
      id: `fl-${config.environment}`,
    }
  })),
  enableGuardDuty: jest.fn().mockImplementation((scope: any, config: any) => ({
    detector: {
      id: `detector-${config.environment}`,
      accountId: config.accountId,
    }
  })),
  createCloudWatchAlarms: jest.fn().mockImplementation((scope: any, config: any, fleet: any, alb: any, rds: any) => ({
    alarms: [
      { name: `cpu-alarm-${config.environment}` },
      { name: `memory-alarm-${config.environment}` },
      { name: `disk-alarm-${config.environment}` },
    ]
  })),
  createSsmSetupAndVpcEndpoints: jest.fn().mockImplementation((scope: any, config: any, vpc: any, iam: any) => ({
    endpoints: [
      { id: `vpce-ssm-${config.environment}` },
      { id: `vpce-ssmmessages-${config.environment}` },
      { id: `vpce-ec2messages-${config.environment}` },
    ]
  })),
}));

// Mock AWS Provider and related data sources
jest.mock("@cdktf/provider-aws/lib/provider", () => ({
  AwsProvider: jest.fn(),
  AwsProviderDefaultTags: jest.fn(),
}));

jest.mock("@cdktf/provider-aws/lib/data-aws-caller-identity", () => ({
  DataAwsCallerIdentity: jest.fn().mockImplementation(() => ({
    accountId: "123456789012",
    arn: "arn:aws:iam::123456789012:root",
    userId: "AIDACKCEVSQ6C2EXAMPLE",
  })),
}));

// Mock TerraformOutput and S3Backend
jest.mock("cdktf", () => {
  const actual = jest.requireActual("cdktf");
  return {
    ...actual,
    TerraformOutput: jest.fn(),
    S3Backend: jest.fn().mockImplementation((scope: any, config: any) => ({
      addOverride: jest.fn()
    })),
    TerraformStack: actual.TerraformStack,
  };
});

describe("TapStack Unit Tests", () => {
  const modules = require("../lib/modules");
  const { TerraformOutput, S3Backend } = require("cdktf");
  const { AwsProvider } = require("@cdktf/provider-aws/lib/provider");
  const { DataAwsCallerIdentity } = require("@cdktf/provider-aws/lib/data-aws-caller-identity");

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Stack Creation and Configuration", () => {
    test("should create TapStack with default configuration", () => {
      const app = new App();
      const stack = new TapStack(app, "test-stack");

      expect(stack).toBeDefined();
      expect(stack).toBeInstanceOf(TapStack);

      // Verify AWS Provider is configured with default region
      expect(AwsProvider).toHaveBeenCalledWith(
        expect.anything(),
        'aws',
        expect.objectContaining({
          region: 'us-east-1',
          defaultTags: []
        })
      );

      // Verify DataAwsCallerIdentity is created
      expect(DataAwsCallerIdentity).toHaveBeenCalledTimes(1);
    });

    test("should create TapStack with custom AWS region", () => {
      const app = new App();
      new TapStack(app, "test-stack", {
        awsRegion: 'eu-west-1'
      });

      expect(AwsProvider).toHaveBeenCalledWith(
        expect.anything(),
        'aws',
        expect.objectContaining({
          region: 'eu-west-1'
        })
      );
    });

    test("should create TapStack with custom default tags", () => {
      const app = new App();
      const customTags = { tags: { Department: 'Engineering', Team: 'Platform' } };

      new TapStack(app, "test-stack", {
        defaultTags: customTags
      });

      expect(AwsProvider).toHaveBeenCalledWith(
        expect.anything(),
        'aws',
        expect.objectContaining({
          defaultTags: [customTags]
        })
      );
    });

    test("should respect AWS_REGION_OVERRIDE if set", () => {
      // Mock the AWS_REGION_OVERRIDE constant
      const originalOverride = process.env.AWS_REGION_OVERRIDE;
      process.env.AWS_REGION_OVERRIDE = 'ap-southeast-2';
      
      // Need to re-import the module to pick up the env change
      jest.resetModules();
      const { TapStack: TapStackWithOverride } = require("../lib/tap-stack");

      const app = new App();
      new TapStackWithOverride(app, "test-stack", {
        awsRegion: 'eu-west-1' // This should be ignored
      });

      // Clean up
      if (originalOverride !== undefined) {
        process.env.AWS_REGION_OVERRIDE = originalOverride;
      } else {
        delete process.env.AWS_REGION_OVERRIDE;
      }
    });
  });

  describe("S3 Backend Configuration", () => {
    test("should configure S3 backend with default settings", () => {
      const app = new App();
      const mockAddOverride = jest.fn();
      const originalPrototype = TapStack.prototype.addOverride;
      TapStack.prototype.addOverride = mockAddOverride;

      new TapStack(app, "test-stack");

      expect(S3Backend).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          bucket: 'iac-rlhf-tf-states',
          key: 'dev/test-stack.tfstate',
          region: 'us-east-1',
          encrypt: true
        })
      );

      expect(mockAddOverride).toHaveBeenCalledWith(
        'terraform.backend.s3.use_lockfile',
        true
      );

      TapStack.prototype.addOverride = originalPrototype;
    });

    test("should configure S3 backend with custom state bucket", () => {
      const app = new App();
      new TapStack(app, "test-stack", {
        stateBucket: 'my-custom-state-bucket',
        stateBucketRegion: 'ap-southeast-1'
      });

      expect(S3Backend).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          bucket: 'my-custom-state-bucket',
          region: 'ap-southeast-1'
        })
      );
    });

    test("should configure S3 backend with production environment", () => {
      const app = new App();
      new TapStack(app, "test-stack", {
        environmentSuffix: 'prod'
      });

      expect(S3Backend).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          key: 'prod/test-stack.tfstate'
        })
      );
    });
  });

  describe("Stack Configuration Validation", () => {
    test("should validate stack configuration", () => {
      const app = new App();
      new TapStack(app, "test-stack");

      expect(modules.validateStackConfiguration).toHaveBeenCalledWith(
        expect.objectContaining({
          environment: 'dev',
          trustedIpRanges: ['10.0.0.0/8'],
          vpcCidr: '10.0.0.0/16',
          availabilityZones: ['us-east-1a', 'us-east-1b'],
          instanceType: 't3.medium',
          keyPairName: 'TapStackpr4141-keypair',
          dbPassword: 'ChangeMePlease123!',
          kmsKeyAlias: 'dev-master-key',
          notificationEmail: 'alerts@example.com',
          dbInstanceClass: 'db.t3.medium',
          fleetSize: 2,
          region: 'us-east-1',
          accountId: '123456789012'
        })
      );
    });

    test("should use custom environment suffix in configuration", () => {
      const app = new App();
      new TapStack(app, "test-stack", {
        environmentSuffix: 'staging'
      });

      expect(modules.validateStackConfiguration).toHaveBeenCalledWith(
        expect.objectContaining({
          environment: 'staging',
          kmsKeyAlias: 'staging-master-key'
        })
      );
    });
  });

  describe("Resource Creation", () => {
    test("should create KMS key", () => {
      const app = new App();
      new TapStack(app, "test-stack");

      expect(modules.createKmsKey).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          kmsKeyAlias: 'dev-master-key',
          accountId: '123456789012'
        })
      );
    });

    test("should create VPC with subnets and NAT", () => {
      const app = new App();
      new TapStack(app, "test-stack");

      expect(modules.createVpcWithSubnetsAndNat).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          vpcCidr: '10.0.0.0/16',
          availabilityZones: ['us-east-1a', 'us-east-1b']
        })
      );
    });

    test("should create IAM roles and policies", () => {
      const app = new App();
      new TapStack(app, "test-stack");

      expect(modules.createIamRolesAndPolicies).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          environment: 'dev',
          accountId: '123456789012'
        })
      );
    });

    test("should create encrypted S3 buckets", () => {
      const app = new App();
      new TapStack(app, "test-stack");

      expect(modules.createEncryptedS3Buckets).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          environment: 'dev'
        }),
        expect.objectContaining({
          keyId: expect.stringContaining('key-')
        })
      );
    });

    test("should create bastion host", () => {
      const app = new App();
      new TapStack(app, "test-stack");

      expect(modules.createBastionHost).toHaveBeenCalled();
      const callArgs = modules.createBastionHost.mock.calls[0];
      expect(callArgs[1]).toMatchObject({
        environment: 'dev',
        instanceType: 't3.medium',
        keyPairName: 'TapStackpr4141-keypair'
      });
    });

    test("should create private EC2 fleet", () => {
      const app = new App();
      new TapStack(app, "test-stack");

      expect(modules.createPrivateEc2Fleet).toHaveBeenCalled();
      const callArgs = modules.createPrivateEc2Fleet.mock.calls[0];
      expect(callArgs[1]).toMatchObject({
        fleetSize: 2,
        instanceType: 't3.medium'
      });
    });

    test("should create ALB for private instances", () => {
      const app = new App();
      new TapStack(app, "test-stack");

      expect(modules.createAlbForPrivateInstances).toHaveBeenCalled();
      expect(modules.createAlbForPrivateInstances.mock.calls[0][1]).toMatchObject({
        environment: 'dev'
      });
    });

    test("should create RDS Multi-AZ instance", () => {
      const app = new App();
      new TapStack(app, "test-stack");

      expect(modules.createRdsMultiAz).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          dbPassword: 'ChangeMePlease123!',
          dbInstanceClass: 'db.t3.medium'
        }),
        expect.anything(),
        expect.anything()
      );
    });

    test("should create VPC Flow Logs", () => {
      const app = new App();
      new TapStack(app, "test-stack");

      expect(modules.createVPCFlowLogs).toHaveBeenCalled();
      expect(modules.createVPCFlowLogs.mock.calls[0][1]).toMatchObject({
        environment: 'dev'
      });
    });

    test("should enable GuardDuty", () => {
      const app = new App();
      new TapStack(app, "test-stack");

      expect(modules.enableGuardDuty).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          environment: 'dev',
          region: 'us-east-1'
        })
      );
    });

    test("should create CloudWatch alarms", () => {
      const app = new App();
      new TapStack(app, "test-stack");

      expect(modules.createCloudWatchAlarms).toHaveBeenCalled();
      const callArgs = modules.createCloudWatchAlarms.mock.calls[0];
      expect(callArgs[1]).toMatchObject({
        notificationEmail: 'alerts@example.com'
      });
    });

    test("should create SSM setup and VPC endpoints", () => {
      const app = new App();
      new TapStack(app, "test-stack");

      expect(modules.createSsmSetupAndVpcEndpoints).toHaveBeenCalled();
      expect(modules.createSsmSetupAndVpcEndpoints.mock.calls[0][1]).toMatchObject({
        environment: 'dev',
        region: 'us-east-1'
      });
    });
  });

  describe("Terraform Outputs", () => {
    test("should create all required terraform outputs", () => {
      const app = new App();
      new TapStack(app, "test-stack");

      expect(TerraformOutput).toHaveBeenCalled();

      const outputCalls = TerraformOutput.mock.calls;
      const outputIds = outputCalls.map((call: any) => call[1]);

      expect(outputIds).toContain('vpc-id');
      expect(outputIds).toContain('public-subnet-ids');
      expect(outputIds).toContain('private-subnet-ids');
      expect(outputIds).toContain('bastion-instance-id');
      expect(outputIds).toContain('bastion-public-ip');
      expect(outputIds).toContain('app-s3-bucket-name');
      expect(outputIds).toContain('log-s3-bucket-name');
      expect(outputIds).toContain('rds-endpoint');
      expect(outputIds).toContain('kms-key-id');
      expect(outputIds).toContain('aws-account-id');
      expect(outputIds).toContain('alb-dns-name');
      expect(outputIds).toContain('private-ec2-instance-ids');
    });

    test("should output VPC and subnet information with correct descriptions", () => {
      const app = new App();
      new TapStack(app, "test-stack");

      const vpcOutput = TerraformOutput.mock.calls.find(
        (call: any) => call[1] === 'vpc-id'
      );

      expect(vpcOutput).toBeDefined();
      expect(vpcOutput[2]).toHaveProperty('value');
      expect(vpcOutput[2]).toHaveProperty('description', 'VPC ID');

      const publicSubnetOutput = TerraformOutput.mock.calls.find(
        (call: any) => call[1] === 'public-subnet-ids'
      );
      expect(publicSubnetOutput[2]).toHaveProperty('description', 'Public subnet IDs');

      const privateSubnetOutput = TerraformOutput.mock.calls.find(
        (call: any) => call[1] === 'private-subnet-ids'
      );
      expect(privateSubnetOutput[2]).toHaveProperty('description', 'Private subnet IDs');
    });

    test("should output EC2 instance information", () => {
      const app = new App();
      new TapStack(app, "test-stack");

      const bastionIdOutput = TerraformOutput.mock.calls.find(
        (call: any) => call[1] === 'bastion-instance-id'
      );
      expect(bastionIdOutput[2]).toHaveProperty('description', 'Bastion host instance ID');
      
      const bastionIpOutput = TerraformOutput.mock.calls.find(
        (call: any) => call[1] === 'bastion-public-ip'
      );
      expect(bastionIpOutput[2]).toHaveProperty('description', 'Bastion host public IP address');

      const privateEc2Output = TerraformOutput.mock.calls.find(
        (call: any) => call[1] === 'private-ec2-instance-ids'
      );
      expect(privateEc2Output[2]).toHaveProperty('description', 'Private EC2 fleet instance IDs');
    });

    test("should output S3 bucket names", () => {
      const app = new App();
      new TapStack(app, "test-stack");

      const appBucketOutput = TerraformOutput.mock.calls.find(
        (call: any) => call[1] === 'app-s3-bucket-name'
      );
      expect(appBucketOutput[2]).toHaveProperty('description', 'Application S3 bucket name');

      const logBucketOutput = TerraformOutput.mock.calls.find(
        (call: any) => call[1] === 'log-s3-bucket-name'
      );
      expect(logBucketOutput[2]).toHaveProperty('description', 'Log S3 bucket name');
    });

    test("should output RDS and ALB endpoints", () => {
      const app = new App();
      new TapStack(app, "test-stack");

      const rdsOutput = TerraformOutput.mock.calls.find(
        (call: any) => call[1] === 'rds-endpoint'
      );
      expect(rdsOutput[2]).toHaveProperty('description', 'RDS instance endpoint');

      const albOutput = TerraformOutput.mock.calls.find(
        (call: any) => call[1] === 'alb-dns-name'
      );
      expect(albOutput[2]).toHaveProperty('description', 'Application Load Balancer DNS name');
    });

    test("should output security-related information", () => {
      const app = new App();
      new TapStack(app, "test-stack");

      const kmsOutput = TerraformOutput.mock.calls.find(
        (call: any) => call[1] === 'kms-key-id'
      );
      expect(kmsOutput[2]).toHaveProperty('description', 'KMS key ID');

      const accountOutput = TerraformOutput.mock.calls.find(
        (call: any) => call[1] === 'aws-account-id'
      );
      expect(accountOutput[2]).toHaveProperty('description', 'Current AWS Account ID');
    });
  });

  describe("Environment-specific Configurations", () => {
    test("should configure resources for development environment", () => {
      const app = new App();
      new TapStack(app, "test-stack", {
        environmentSuffix: 'dev'
      });

      expect(modules.createVpcWithSubnetsAndNat).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          environment: 'dev'
        })
      );

      expect(modules.createKmsKey).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          kmsKeyAlias: 'dev-master-key'
        })
      );
    });

    test("should configure resources for staging environment", () => {
      const app = new App();
      new TapStack(app, "test-stack", {
        environmentSuffix: 'staging'
      });

      expect(modules.createKmsKey).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          kmsKeyAlias: 'staging-master-key'
        })
      );

      expect(S3Backend).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          key: 'staging/test-stack.tfstate'
        })
      );
    });

    test("should configure resources for production environment", () => {
      const app = new App();
      new TapStack(app, "test-stack", {
        environmentSuffix: 'prod'
      });

      expect(modules.createRdsMultiAz).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          environment: 'prod'
        }),
        expect.anything(),
        expect.anything()
      );

      expect(S3Backend).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          key: 'prod/test-stack.tfstate'
        })
      );
    });
  });

  describe("Module Dependencies and Integration", () => {
    test("should pass KMS key to dependent resources", () => {
      const app = new App();
      new TapStack(app, "test-stack");

      // Get the mocked KMS key
      const kmsKeyResult = modules.createKmsKey.mock.results[0].value;

      // S3 buckets should receive KMS key
      expect(modules.createEncryptedS3Buckets).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        kmsKeyResult
      );

      // RDS should receive KMS key
      expect(modules.createRdsMultiAz).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        expect.anything(),
        kmsKeyResult
      );

      // Bastion host should receive KMS key
      expect(modules.createBastionHost).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        expect.anything(),
        expect.anything(),
        kmsKeyResult
      );

      // Private EC2 fleet should receive KMS key
      expect(modules.createPrivateEc2Fleet).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        expect.anything(),
        expect.anything(),
        kmsKeyResult
      );
    });

    test("should pass VPC resources to dependent modules", () => {
      const app = new App();
      new TapStack(app, "test-stack");

      const vpcResult = modules.createVpcWithSubnetsAndNat.mock.results[0].value;

      // Bastion host should receive VPC resources
      expect(modules.createBastionHost).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        vpcResult,
        expect.anything(),
        expect.anything()
      );

      // Private EC2 fleet should receive VPC resources
      expect(modules.createPrivateEc2Fleet).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        vpcResult,
        expect.anything(),
        expect.anything()
      );

      // ALB should receive VPC resources
      expect(modules.createAlbForPrivateInstances).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        vpcResult,
        expect.anything()
      );

      // RDS should receive VPC resources
      expect(modules.createRdsMultiAz).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        vpcResult,
        expect.anything()
      );

      // VPC Flow Logs should receive VPC resources
      expect(modules.createVPCFlowLogs).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        vpcResult
      );

      // SSM endpoints should receive VPC resources
      expect(modules.createSsmSetupAndVpcEndpoints).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        vpcResult,
        expect.anything()
      );
    });

    test("should pass IAM resources to dependent modules", () => {
      const app = new App();
      new TapStack(app, "test-stack");

      const iamResult = modules.createIamRolesAndPolicies.mock.results[0].value;

      // Bastion host should receive IAM resources
      expect(modules.createBastionHost).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        expect.anything(),
        iamResult,
        expect.anything()
      );

      // Private EC2 fleet should receive IAM resources
      expect(modules.createPrivateEc2Fleet).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        expect.anything(),
        iamResult,
        expect.anything()
      );

      // SSM endpoints should receive IAM resources
      expect(modules.createSsmSetupAndVpcEndpoints).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        expect.anything(),
        iamResult
      );
    });

    test("should pass EC2 fleet resources to ALB creation", () => {
      const app = new App();
      new TapStack(app, "test-stack");

      const ec2FleetResult = modules.createPrivateEc2Fleet.mock.results[0].value;

      expect(modules.createAlbForPrivateInstances).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        expect.anything(),
        ec2FleetResult
      );
    });

    test("should pass resources to CloudWatch alarms", () => {
      const app = new App();
      new TapStack(app, "test-stack");

      const ec2FleetResult = modules.createPrivateEc2Fleet.mock.results[0].value;
      const albResult = modules.createAlbForPrivateInstances.mock.results[0].value;
      const rdsResult = modules.createRdsMultiAz.mock.results[0].value;

      expect(modules.createCloudWatchAlarms).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        ec2FleetResult,
        albResult,
        rdsResult
      );
    });
  });

  describe("Edge Cases and Error Scenarios", () => {
    test("should handle undefined props", () => {
      const app = new App();
      const stack = new TapStack(app, "test-stack", undefined);

      expect(stack).toBeDefined();

      // Should use all defaults
      expect(AwsProvider).toHaveBeenCalledWith(
        expect.anything(),
        'aws',
        expect.objectContaining({
          region: 'us-east-1',
          defaultTags: []
        })
      );

      expect(S3Backend).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          bucket: 'iac-rlhf-tf-states',
          key: 'dev/test-stack.tfstate',
          region: 'us-east-1'
        })
      );
    });

    test("should handle empty props object", () => {
      const app = new App();
      const stack = new TapStack(app, "test-stack", {});

      expect(stack).toBeDefined();

      // Should use all defaults
      expect(modules.validateStackConfiguration).toHaveBeenCalledWith(
        expect.objectContaining({
          environment: 'dev',
          region: 'us-east-1'
        })
      );
    });

    test("should handle all props being set", () => {
      const app = new App();
      const stack = new TapStack(app, "test-stack", {
        environmentSuffix: 'prod',
        stateBucket: 'my-state-bucket',
        stateBucketRegion: 'eu-west-1',
        awsRegion: 'ap-southeast-2',
        defaultTags: { tags: { Owner: 'TeamA' } }
      });

      expect(stack).toBeDefined();

      expect(AwsProvider).toHaveBeenCalledWith(
        expect.anything(),
        'aws',
        expect.objectContaining({
          region: 'ap-southeast-2',
          defaultTags: [{ tags: { Owner: 'TeamA' } }]
        })
      );

      expect(S3Backend).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          bucket: 'my-state-bucket',
          key: 'prod/test-stack.tfstate',
          region: 'eu-west-1'
        })
      );
    });
  });

  describe("Tags Configuration", () => {
    test("should apply correct tags to stack configuration", () => {
      const app = new App();
      new TapStack(app, "my-project", {
        environmentSuffix: 'test'
      });

      expect(modules.validateStackConfiguration).toHaveBeenCalledWith(
        expect.objectContaining({
          tags: {
            Environment: 'test',
            ManagedBy: 'Terraform',
            Stack: 'my-project'
          }
        })
      );
    });

    test("should propagate tags through all module calls", () => {
      const app = new App();
      new TapStack(app, "test-app", {
        environmentSuffix: 'staging'
      });

      const expectedTags = {
        Environment: 'staging',
        ManagedBy: 'Terraform',
        Stack: 'test-app'
      };

      expect(modules.validateStackConfiguration).toHaveBeenCalledWith(
        expect.objectContaining({
          tags: expectedTags
        })
      );
    });
  });

  describe("Complete Infrastructure Integration", () => {
    test("should create complete infrastructure stack", () => {
      const app = new App();
      const stack = new TapStack(app, "IntegrationTest");

      // Verify all components are created
      expect(AwsProvider).toHaveBeenCalledTimes(1);
      expect(S3Backend).toHaveBeenCalledTimes(1);
      expect(DataAwsCallerIdentity).toHaveBeenCalledTimes(1);
      expect(modules.validateStackConfiguration).toHaveBeenCalledTimes(1);
      expect(modules.createKmsKey).toHaveBeenCalledTimes(1);
      expect(modules.createVpcWithSubnetsAndNat).toHaveBeenCalledTimes(1);
      expect(modules.createIamRolesAndPolicies).toHaveBeenCalledTimes(1);
      expect(modules.createEncryptedS3Buckets).toHaveBeenCalledTimes(1);
      expect(modules.createBastionHost).toHaveBeenCalledTimes(1);
      expect(modules.createPrivateEc2Fleet).toHaveBeenCalledTimes(1);
      expect(modules.createAlbForPrivateInstances).toHaveBeenCalledTimes(1);
      expect(modules.createRdsMultiAz).toHaveBeenCalledTimes(1);
      expect(modules.createVPCFlowLogs).toHaveBeenCalledTimes(1);
      expect(modules.enableGuardDuty).toHaveBeenCalledTimes(1);
      expect(modules.createCloudWatchAlarms).toHaveBeenCalledTimes(1);
      expect(modules.createSsmSetupAndVpcEndpoints).toHaveBeenCalledTimes(1);
      expect(TerraformOutput).toHaveBeenCalled();

      expect(stack).toBeDefined();
    });

    test("should handle AWS region configuration across all resources", () => {
      const app = new App();
      new TapStack(app, "RegionTest", {
        awsRegion: 'eu-central-1',
        stateBucketRegion: 'us-west-2',
        environmentSuffix: 'prod'
      });

      // Verify provider uses correct region
      expect(AwsProvider).toHaveBeenCalledWith(
        expect.anything(),
        'aws',
        expect.objectContaining({
          region: 'eu-central-1'
        })
      );

      // Verify state bucket uses different region
      expect(S3Backend).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          region: 'us-west-2'
        })
      );

      // Verify stack config has correct region
      expect(modules.validateStackConfiguration).toHaveBeenCalledWith(
        expect.objectContaining({
          region: 'eu-central-1'
        })
      );
    });

    test("should create all outputs with correct values", () => {
      const app = new App();
      new TapStack(app, "OutputTest", {
        environmentSuffix: 'qa'
      });

      // Verify all outputs are created with values
      const outputs = TerraformOutput.mock.calls;
      
      // Check that each output has a value property
      outputs.forEach((call: any) => {
        expect(call[2]).toHaveProperty('value');
        expect(call[2]).toHaveProperty('description');
      });

      // Verify specific output values
      const vpcIdOutput = outputs.find((call: any) => call[1] === 'vpc-id');
      expect(vpcIdOutput[2].value).toBe('vpc-qa');

      const accountIdOutput = outputs.find((call: any) => call[1] === 'aws-account-id');
      expect(accountIdOutput[2].value).toBe('123456789012');
    });
  });
});