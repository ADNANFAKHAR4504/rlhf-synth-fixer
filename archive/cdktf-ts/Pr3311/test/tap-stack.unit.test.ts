// __tests__/tap-stack.unit.test.ts
import { App } from "cdktf";
import "cdktf/lib/testing/adapters/jest";
import { TapStack } from "../lib/tap-stack";

// Mock all the modules used in TapStack
jest.mock("../lib/modules", () => ({
  VpcModule: jest.fn().mockImplementation(() => ({
    vpc: { id: "mock-vpc-id" }
  })),
  SubnetModule: jest.fn().mockImplementation(() => ({
    publicSubnets: [
      { id: "mock-public-subnet-1" },
      { id: "mock-public-subnet-2" }
    ],
    privateSubnets: [
      { id: "mock-private-subnet-1" },
      { id: "mock-private-subnet-2" }
    ]
  })),
  InternetGatewayModule: jest.fn().mockImplementation(() => ({
    internetGateway: { id: "mock-internet-gateway-id" }
  })),
  RouteTableModule: jest.fn().mockImplementation(() => ({
    publicRouteTable: { id: "mock-public-route-table-id" },
    privateRouteTable: { id: "mock-private-route-table-id" }
  })),
  NatGatewayModule: jest.fn().mockImplementation(() => ({
    natGateway: { id: "mock-nat-gateway-id" }
  })),
  SecurityGroupModule: jest.fn().mockImplementation(() => ({
    publicSecurityGroup: { id: "mock-public-sg-id" },
    rdsSecurityGroup: { id: "mock-rds-sg-id" }
  })),
  RdsModule: jest.fn().mockImplementation(() => ({
    dbInstance: {
      id: "mock-rds-instance-id",
      endpoint: "mock-rds-endpoint.us-east-1.rds.amazonaws.com",
      port: 3306,
      masterUserSecret: {
        get: jest.fn().mockReturnValue({
          secretArn: "arn:aws:secretsmanager:us-east-1:123456789012:secret:mock-secret"
        })
      }
    }
  })),
}));

// Mock TerraformOutput and S3Backend to prevent duplicate construct errors
jest.mock("cdktf", () => {
  const actual = jest.requireActual("cdktf");
  return {
    ...actual,
    TerraformOutput: jest.fn(),
    S3Backend: jest.fn(),
  };
});

// Mock AWS Provider
jest.mock("@cdktf/provider-aws/lib/provider", () => ({
  AwsProvider: jest.fn(),
}));

// Mock DataAwsAvailabilityZones
jest.mock("@cdktf/provider-aws/lib/data-aws-availability-zones", () => ({
  DataAwsAvailabilityZones: jest.fn().mockImplementation(() => ({
    fqn: "data.aws_availability_zones.azs"
  })),
}));

describe("TapStack Unit Tests", () => {
  const {
    VpcModule,
    SubnetModule,
    InternetGatewayModule,
    RouteTableModule,
    NatGatewayModule,
    SecurityGroupModule,
    RdsModule,
  } = require("../lib/modules");
  const { TerraformOutput, S3Backend } = require("cdktf");
  const { AwsProvider } = require("@cdktf/provider-aws/lib/provider");
  const { DataAwsAvailabilityZones } = require("@cdktf/provider-aws/lib/data-aws-availability-zones");

  // Mock addOverride method
  const mockAddOverride = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    // Mock the addOverride method on TerraformStack
    jest.spyOn(require("cdktf").TerraformStack.prototype, 'addOverride').mockImplementation(mockAddOverride);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("Constructor and Basic Functionality", () => {
    test("should create TapStack with default props", () => {
      const app = new App();
      const stack = new TapStack(app, "TestStack");

      expect(stack).toBeDefined();
      expect(stack).toBeInstanceOf(TapStack);
    });

    test("should create TapStack with custom props", () => {
      const app = new App();
      const stack = new TapStack(app, "TestStack", {
        environmentSuffix: 'prod',
        stateBucket: 'custom-bucket',
        stateBucketRegion: 'eu-west-1',
        awsRegion: 'eu-west-1',
      });

      expect(stack).toBeDefined();
    });

    test("should create TapStack with all custom props", () => {
      const app = new App();
      const customTags = {
        tags: {
          Environment: 'production',
          Owner: 'DevOps',
          Project: 'TAP',
        },
      };

      const stack = new TapStack(app, "TestStackFull", {
        environmentSuffix: 'staging',
        stateBucket: 'my-custom-tf-states',
        stateBucketRegion: 'ap-southeast-1',
        awsRegion: 'ap-southeast-1',
        defaultTags: customTags,
      });

      expect(stack).toBeDefined();
    });
  });

  describe("Props Handling and Default Values", () => {
    test("should use default values when props are not provided", () => {
      const app = new App();
      new TapStack(app, "TestStackDefaults");

      expect(AwsProvider).toHaveBeenCalledWith(
        expect.anything(),
        'aws',
        expect.objectContaining({
          region: 'us-east-1', // Default region
          defaultTags: [],
        })
      );

      expect(S3Backend).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          bucket: 'iac-rlhf-tf-states',
          key: 'dev/TestStackDefaults.tfstate',
          region: 'us-east-1',
          encrypt: true,
        })
      );
    });

    test("should use custom props when provided", () => {
      const app = new App();
      const customTags = {
        tags: {
          Environment: 'production',
          Owner: 'DevOps',
          CostCenter: '12345',
        },
      };

      new TapStack(app, "TestStackCustom", {
        environmentSuffix: 'prod',
        stateBucket: 'custom-tf-states',
        stateBucketRegion: 'eu-west-1',
        awsRegion: 'eu-west-1',
        defaultTags: customTags,
      });

      expect(AwsProvider).toHaveBeenCalledWith(
        expect.anything(),
        'aws',
        expect.objectContaining({
          region: 'eu-west-1',
          defaultTags: [customTags],
        })
      );

      expect(S3Backend).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          bucket: 'custom-tf-states',
          key: 'prod/TestStackCustom.tfstate',
          region: 'eu-west-1',
          encrypt: true,
        })
      );
    });

    test("should handle undefined defaultTags", () => {
      const app = new App();
      new TapStack(app, "TestStackUndefinedTags", {
        defaultTags: undefined,
      });

      expect(AwsProvider).toHaveBeenCalledWith(
        expect.anything(),
        'aws',
        expect.objectContaining({
          defaultTags: [],
        })
      );
    });

    test("should handle empty string values and fallback to defaults", () => {
      const app = new App();
      new TapStack(app, "TestStackEmptyStrings", {
        environmentSuffix: '',
        stateBucket: '',
        stateBucketRegion: '',
      });

      expect(S3Backend).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          bucket: 'iac-rlhf-tf-states', // Should fallback to default
          key: 'dev/TestStackEmptyStrings.tfstate', // Should fallback to default env
          region: 'us-east-1', // Should fallback to default
        })
      );
    });
  });

  describe("AWS Provider Configuration", () => {
    test("should configure AWS provider with correct region and tags", () => {
      const app = new App();
      const customTags = {
        tags: {
          Environment: 'test',
          Application: 'tap',
        },
      };

      new TapStack(app, "TestStackProvider", {
        defaultTags: customTags,
        awsRegion: 'ap-southeast-2',
      });

      expect(AwsProvider).toHaveBeenCalledWith(
        expect.anything(),
        'aws',
        {
          region: 'ap-southeast-2',
          defaultTags: [customTags],
        }
      );
    });

    test("should configure AWS provider with empty tags when not provided", () => {
      const app = new App();
      new TapStack(app, "TestStackProviderNoTags");

      expect(AwsProvider).toHaveBeenCalledWith(
        expect.anything(),
        'aws',
        {
          region: 'us-east-1', // Default region
          defaultTags: [],
        }
      );
    });
  });

  describe("S3 Backend Configuration", () => {
    test("should configure S3 backend with correct parameters", () => {
      const app = new App();
      new TapStack(app, "TestStackBackend", {
        environmentSuffix: 'test',
        stateBucket: 'test-bucket',
        stateBucketRegion: 'us-west-1',
      });

      expect(S3Backend).toHaveBeenCalledWith(
        expect.anything(),
        {
          bucket: 'test-bucket',
          key: 'test/TestStackBackend.tfstate',
          region: 'us-west-1',
          encrypt: true,
        }
      );
    });

    test("should add override for S3 state locking", () => {
      const app = new App();
      new TapStack(app, "TestStackLocking");

      expect(mockAddOverride).toHaveBeenCalledWith('terraform.backend.s3.use_lockfile', true);
    });
  });

  describe("Production Environment Detection", () => {
    test("should detect production environment with 'prod' suffix", () => {
      const app = new App();
      new TapStack(app, "TestStackProd", {
        environmentSuffix: 'prod',
      });

      expect(RdsModule).toHaveBeenCalledWith(
        expect.anything(),
        'rds',
        expect.objectContaining({
          dbInstanceClass: 'db.t3.small', // Production instance
          backupRetentionPeriod: 30,
          deletionProtection: true,
          enablePerformanceInsights: true,
          monitoringInterval: 60,
        })
      );
    });

    test("should detect production environment with 'production' suffix", () => {
      const app = new App();
      new TapStack(app, "TestStackProduction", {
        environmentSuffix: 'production',
      });

      expect(RdsModule).toHaveBeenCalledWith(
        expect.anything(),
        'rds',
        expect.objectContaining({
          dbInstanceClass: 'db.t3.small',
          backupRetentionPeriod: 30,
          deletionProtection: true,
          enablePerformanceInsights: true,
          monitoringInterval: 60,
        })
      );
    });

    test("should use development settings for non-production environments", () => {
      const app = new App();
      new TapStack(app, "TestStackDev", {
        environmentSuffix: 'dev',
      });

      expect(RdsModule).toHaveBeenCalledWith(
        expect.anything(),
        'rds',
        expect.objectContaining({
          dbInstanceClass: 'db.t3.micro', // Development instance
          backupRetentionPeriod: 7,
          deletionProtection: false,
          enablePerformanceInsights: false,
          monitoringInterval: 0,
        })
      );
    });

    test("should handle case insensitive production detection", () => {
      const app = new App();
      new TapStack(app, "TestStackPROD", {
        environmentSuffix: 'PROD',
      });

      expect(RdsModule).toHaveBeenCalledWith(
        expect.anything(),
        'rds',
        expect.objectContaining({
          dbInstanceClass: 'db.t3.small',
          deletionProtection: true,
        })
      );
    });
  });

  describe("Module Creation and Configuration", () => {
    test("should create availability zones data source", () => {
      const app = new App();
      new TapStack(app, "TestStackAZs");

      expect(DataAwsAvailabilityZones).toHaveBeenCalledWith(
        expect.anything(),
        'azs',
        {
          state: 'available',
        }
      );
    });

    test("should create VPC module with correct configuration", () => {
      const app = new App();
      new TapStack(app, "TestStackVPC", {
        environmentSuffix: 'test',
      });

      expect(VpcModule).toHaveBeenCalledWith(
        expect.anything(),
        'vpc',
        expect.objectContaining({
          cidr: '10.0.0.0/16',
          tagConfig: expect.objectContaining({
            project: 'tap',
            env: 'test',
            owner: 'infrastructure-team',
          }),
          enableDnsHostnames: true,
          enableDnsSupport: true,
        })
      );
    });

    test("should create subnet module with correct configuration", () => {
      const app = new App();
      new TapStack(app, "TestStackSubnets");

      expect(SubnetModule).toHaveBeenCalledWith(
        expect.anything(),
        'subnets',
        expect.objectContaining({
          vpc: { id: "mock-vpc-id" },
          subnets: expect.arrayContaining([
            expect.objectContaining({
              cidr: '10.0.1.0/24',
              type: 'public',
              name: 'public-subnet-1',
            }),
            expect.objectContaining({
              cidr: '10.0.2.0/24',
              type: 'public',
              name: 'public-subnet-2',
            }),
            expect.objectContaining({
              cidr: '10.0.11.0/24',
              type: 'private',
              name: 'private-subnet-1',
            }),
            expect.objectContaining({
              cidr: '10.0.12.0/24',
              type: 'private',
              name: 'private-subnet-2',
            }),
          ]),
          tagConfig: expect.objectContaining({
            project: 'tap',
            env: 'dev',
            owner: 'infrastructure-team',
          }),
        })
      );
    });

    test("should create internet gateway module", () => {
      const app = new App();
      new TapStack(app, "TestStackIGW");

      expect(InternetGatewayModule).toHaveBeenCalledWith(
        expect.anything(),
        'igw',
        expect.objectContaining({
          vpc: { id: "mock-vpc-id" },
          tagConfig: expect.any(Object),
        })
      );
    });

    test("should create NAT gateway module", () => {
      const app = new App();
      new TapStack(app, "TestStackNAT");

      expect(NatGatewayModule).toHaveBeenCalledWith(
        expect.anything(),
        'nat',
        expect.objectContaining({
          publicSubnet: { id: "mock-public-subnet-1" },
          tagConfig: expect.any(Object),
        })
      );
    });

    test("should create route table module with dependencies", () => {
      const app = new App();
      new TapStack(app, "TestStackRoutes");

      expect(RouteTableModule).toHaveBeenCalledWith(
        expect.anything(),
        'route-tables',
        expect.objectContaining({
          vpc: { id: "mock-vpc-id" },
          internetGateway: { id: "mock-internet-gateway-id" },
          natGateway: { id: "mock-nat-gateway-id" },
          publicSubnets: expect.arrayContaining([
            { id: "mock-public-subnet-1" },
            { id: "mock-public-subnet-2" }
          ]),
          privateSubnets: expect.arrayContaining([
            { id: "mock-private-subnet-1" },
            { id: "mock-private-subnet-2" }
          ]),
          tagConfig: expect.any(Object),
        })
      );
    });

    test("should create security group module", () => {
      const app = new App();
      new TapStack(app, "TestStackSG");

      expect(SecurityGroupModule).toHaveBeenCalledWith(
        expect.anything(),
        'security-groups',
        expect.objectContaining({
          vpc: { id: "mock-vpc-id" },
          sshAllowCidr: '0.0.0.0/0',
          tagConfig: expect.any(Object),
        })
      );
    });

    test("should create RDS module with correct configuration", () => {
      const app = new App();
      new TapStack(app, "TestStackRDS", {
        environmentSuffix: 'staging',
      });

      expect(RdsModule).toHaveBeenCalledWith(
        expect.anything(),
        'rds',
        expect.objectContaining({
          vpc: { id: "mock-vpc-id" },
          privateSubnets: expect.arrayContaining([
            { id: "mock-private-subnet-1" },
            { id: "mock-private-subnet-2" }
          ]),
          securityGroup: { id: "mock-rds-sg-id" },
          dbName: 'tapdb',
          tagConfig: expect.objectContaining({
            project: 'tap',
            env: 'staging',
            owner: 'infrastructure-team',
          }),
          environmentName: 'staging',
          masterUsername: 'dbadmin',
        })
      );
    });
  });

  describe("Terraform Outputs", () => {
    test("should create all VPC-related terraform outputs", () => {
      const app = new App();
      new TapStack(app, "TestStackOutputs");

      expect(TerraformOutput).toHaveBeenCalledWith(
        expect.anything(),
        'vpc-id',
        expect.objectContaining({
          value: 'mock-vpc-id',
          description: 'VPC ID',
        })
      );

      expect(TerraformOutput).toHaveBeenCalledWith(
        expect.anything(),
        'public-subnet-ids',
        expect.objectContaining({
          value: JSON.stringify(['mock-public-subnet-1', 'mock-public-subnet-2']),
          description: 'Public subnet IDs',
        })
      );

      expect(TerraformOutput).toHaveBeenCalledWith(
        expect.anything(),
        'private-subnet-ids',
        expect.objectContaining({
          value: JSON.stringify(['mock-private-subnet-1', 'mock-private-subnet-2']),
          description: 'Private subnet IDs',
        })
      );
    });

    test("should create all infrastructure outputs", () => {
      const app = new App();
      new TapStack(app, "TestStackInfraOutputs");

      expect(TerraformOutput).toHaveBeenCalledWith(
        expect.anything(),
        'internet-gateway-id',
        expect.objectContaining({
          value: 'mock-internet-gateway-id',
          description: 'Internet Gateway ID',
        })
      );

      expect(TerraformOutput).toHaveBeenCalledWith(
        expect.anything(),
        'nat-gateway-id',
        expect.objectContaining({
          value: 'mock-nat-gateway-id',
          description: 'NAT Gateway ID',
        })
      );

      expect(TerraformOutput).toHaveBeenCalledWith(
        expect.anything(),
        'public-route-table-id',
        expect.objectContaining({
          value: 'mock-public-route-table-id',
          description: 'Public route table ID',
        })
      );

      expect(TerraformOutput).toHaveBeenCalledWith(
        expect.anything(),
        'private-route-table-id',
        expect.objectContaining({
          value: 'mock-private-route-table-id',
          description: 'Private route table ID',
        })
      );
    });

    test("should create all security group outputs", () => {
      const app = new App();
      new TapStack(app, "TestStackSGOutputs");

      expect(TerraformOutput).toHaveBeenCalledWith(
        expect.anything(),
        'public-security-group-id',
        expect.objectContaining({
          value: 'mock-public-sg-id',
          description: 'Public Security Group ID',
        })
      );

      expect(TerraformOutput).toHaveBeenCalledWith(
        expect.anything(),
        'rds-security-group-id',
        expect.objectContaining({
          value: 'mock-rds-sg-id',
          description: 'RDS Security Group ID',
        })
      );
    });

    test("should create all RDS outputs including sensitive ones", () => {
      const app = new App();
      new TapStack(app, "TestStackRDSOutputs");

      expect(TerraformOutput).toHaveBeenCalledWith(
        expect.anything(),
        'rds-endpoint',
        expect.objectContaining({
          value: 'mock-rds-endpoint.us-east-1.rds.amazonaws.com',
          description: 'RDS database endpoint',
          sensitive: false,
        })
      );

      expect(TerraformOutput).toHaveBeenCalledWith(
        expect.anything(),
        'rds-port',
        expect.objectContaining({
          value: '3306',
          description: 'RDS database port',
        })
      );

      expect(TerraformOutput).toHaveBeenCalledWith(
        expect.anything(),
        'rds-master-user-secret-arn',
        expect.objectContaining({
          value: 'arn:aws:secretsmanager:us-east-1:123456789012:secret:mock-secret',
          description: 'ARN of the AWS-managed master user secret',
          sensitive: true,
        })
      );

      expect(TerraformOutput).toHaveBeenCalledWith(
        expect.anything(),
        'rds-instance-id',
        expect.objectContaining({
          value: 'mock-rds-instance-id',
          description: 'RDS instance identifier',
        })
      );
    });

  });

  describe("Module Dependencies and Call Order", () => {
    test("should call each module creation exactly once", () => {
      const app = new App();
      new TapStack(app, "TestStackModuleCounts");

      expect(VpcModule).toHaveBeenCalledTimes(1);
      expect(SubnetModule).toHaveBeenCalledTimes(1);
      expect(InternetGatewayModule).toHaveBeenCalledTimes(1);
      expect(NatGatewayModule).toHaveBeenCalledTimes(1);
      expect(RouteTableModule).toHaveBeenCalledTimes(1);
      expect(SecurityGroupModule).toHaveBeenCalledTimes(1);
      expect(RdsModule).toHaveBeenCalledTimes(1);
    });

    test("should create modules with proper tag configuration", () => {
      const app = new App();
      new TapStack(app, "TestStackTags", {
        environmentSuffix: 'test-env',
      });

      const expectedTagConfig = {
        project: 'tap',
        env: 'test-env',
        owner: 'infrastructure-team',
      };

      expect(VpcModule).toHaveBeenCalledWith(
        expect.anything(),
        'vpc',
        expect.objectContaining({
          tagConfig: expectedTagConfig,
        })
      );

      expect(SubnetModule).toHaveBeenCalledWith(
        expect.anything(),
        'subnets',
        expect.objectContaining({
          tagConfig: expectedTagConfig,
        })
      );

      expect(RdsModule).toHaveBeenCalledWith(
        expect.anything(),
        'rds',
        expect.objectContaining({
          tagConfig: expectedTagConfig,
        })
      );
    });
  });

  describe("Integration Tests", () => {
    test("should create complete stack with all components", () => {
      const app = new App();
      const stack = new TapStack(app, "TestStackIntegration");

      // Verify all main components are created
      expect(AwsProvider).toHaveBeenCalledTimes(1);
      expect(S3Backend).toHaveBeenCalledTimes(1);
      expect(DataAwsAvailabilityZones).toHaveBeenCalledTimes(1);
      expect(VpcModule).toHaveBeenCalledTimes(1);
      expect(SubnetModule).toHaveBeenCalledTimes(1);
      expect(InternetGatewayModule).toHaveBeenCalledTimes(1);
      expect(NatGatewayModule).toHaveBeenCalledTimes(1);
      expect(RouteTableModule).toHaveBeenCalledTimes(1);
      expect(SecurityGroupModule).toHaveBeenCalledTimes(1);
      expect(RdsModule).toHaveBeenCalledTimes(1);


      expect(stack).toBeDefined();
      expect(stack).toBeInstanceOf(TapStack);
    });

    test("should handle multiple stack instances", () => {
      const app = new App();
      const stack1 = new TapStack(app, "TestStack1", { environmentSuffix: 'dev' });
      const stack2 = new TapStack(app, "TestStack2", { environmentSuffix: 'prod' });

      expect(stack1).toBeDefined();
      expect(stack2).toBeDefined();
      expect(stack1).not.toBe(stack2);
    });

    test("should work with complex configuration", () => {
      const app = new App();
      const complexProps = {
        environmentSuffix: 'staging',
        stateBucket: 'complex-tf-states-bucket',
        stateBucketRegion: 'eu-central-1',
        awsRegion: 'eu-central-1',
        defaultTags: {
          tags: {
            Environment: 'staging',
            Project: 'TAP',
            Owner: 'DevOps Team',
            CostCenter: 'Engineering',
          },
        },
      };

      const stack = new TapStack(app, "ComplexTestStack", complexProps);

      expect(stack).toBeDefined();
      expect(AwsProvider).toHaveBeenCalledWith(
        expect.anything(),
        'aws',
        expect.objectContaining({
          region: 'eu-central-1',
          defaultTags: [complexProps.defaultTags],
        })
      );

      expect(S3Backend).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          bucket: 'complex-tf-states-bucket',
          key: 'staging/ComplexTestStack.tfstate',
          region: 'eu-central-1',
        })
      );
    });
  });

  describe("Error Handling and Edge Cases", () => {
    test("should handle null props gracefully", () => {
      const app = new App();
      const stack = new TapStack(app, "TestStackNullProps", null as any);

      expect(stack).toBeDefined();
      expect(AwsProvider).toHaveBeenCalledWith(
        expect.anything(),
        'aws',
        expect.objectContaining({
          region: 'us-east-1',
          defaultTags: [],
        })
      );
    });

    test("should handle empty object props", () => {
      const app = new App();
      const stack = new TapStack(app, "TestStackEmptyProps", {});

      expect(stack).toBeDefined();
      expect(S3Backend).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          bucket: 'iac-rlhf-tf-states',
          key: 'dev/TestStackEmptyProps.tfstate',
          region: 'us-east-1',
        })
      );
    });

    test("should handle special characters in stack id", () => {
      const app = new App();
      const stack = new TapStack(app, "Test-Stack_123", {
        environmentSuffix: 'test-env',
      });

      expect(stack).toBeDefined();
      expect(S3Backend).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          key: 'test-env/Test-Stack_123.tfstate',
        })
      );
    });
  });

  describe("AWS Region Override Logic", () => {
    test("should use default region when no awsRegion prop provided", () => {
      const app = new App();
      new TapStack(app, "TestStackDefaultRegion");

      expect(AwsProvider).toHaveBeenCalledWith(
        expect.anything(),
        'aws',
        expect.objectContaining({
          region: 'us-east-1', // Default fallback
        })
      );
    });

    test("should use awsRegion prop when provided", () => {
      const app = new App();
      new TapStack(app, "TestStackCustomRegion", {
        awsRegion: 'ap-northeast-1',
      });

      expect(AwsProvider).toHaveBeenCalledWith(
        expect.anything(),
        'aws',
        expect.objectContaining({
          region: 'ap-northeast-1',
        })
      );
    });

    test("should handle empty string awsRegion prop", () => {
      const app = new App();
      new TapStack(app, "TestStackEmptyRegion", {
        awsRegion: '',
      });

      expect(AwsProvider).toHaveBeenCalledWith(
        expect.anything(),
        'aws',
        expect.objectContaining({
          region: 'us-east-1', // Should fallback to default
        })
      );
    });
  });

  describe("Tag Configuration", () => {
    test("should create consistent tag configuration across modules", () => {
      const app = new App();
      new TapStack(app, "TestStackTagConsistency", {
        environmentSuffix: 'consistency-test',
      });

      const expectedTagConfig = {
        project: 'tap',
        env: 'consistency-test',
        owner: 'infrastructure-team',
      };

      // Check that all modules receive the same tag configuration
      expect(VpcModule).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        expect.objectContaining({ tagConfig: expectedTagConfig })
      );

      expect(SubnetModule).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        expect.objectContaining({ tagConfig: expectedTagConfig })
      );

      expect(InternetGatewayModule).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        expect.objectContaining({ tagConfig: expectedTagConfig })
      );

      expect(NatGatewayModule).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        expect.objectContaining({ tagConfig: expectedTagConfig })
      );

      expect(RouteTableModule).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        expect.objectContaining({ tagConfig: expectedTagConfig })
      );

      expect(SecurityGroupModule).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        expect.objectContaining({ tagConfig: expectedTagConfig })
      );

      expect(RdsModule).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        expect.objectContaining({ tagConfig: expectedTagConfig })
      );
    });
  });
});