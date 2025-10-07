import { App } from "cdktf";
import "cdktf/lib/testing/adapters/jest";
import { TapStack } from "../lib/tap-stack";

// Mock all the modules used in TapStack
jest.mock("../lib/modules", () => ({
  NetworkingConstruct: jest.fn().mockImplementation((scope, id, props) => ({
    vpc: { id: `vpc-${id}-12345` },
    publicSubnet: { id: `subnet-public-${id}-12345` },
    privateSubnet: { id: `subnet-private-${id}-12345` },
    internetGateway: { id: `igw-${id}-12345` },
    natGateway: { id: `nat-${id}-12345` }
  })),
  SecretsConstruct: jest.fn().mockImplementation((scope, id, props) => ({
    secret: { 
      arn: `arn:aws:secretsmanager:us-east-1:123456789012:secret:${id}-12345`
    }
  })),
  SecureComputeConstruct: jest.fn().mockImplementation((scope, id, props) => ({
    instance: { 
      id: `i-${id}-12345`,
      privateIp: "10.0.3.100"
    },
    securityGroup: { id: `sg-${id}-12345` },
    role: { arn: `arn:aws:iam::123456789012:role/${id}-role` }
  }))
}));

// Mock CDKTF constructs to avoid duplicate construct errors
jest.mock("cdktf", () => {
  const actual = jest.requireActual("cdktf");
  return {
    ...actual,
    TerraformOutput: jest.fn(),
    TerraformVariable: jest.fn().mockImplementation((scope, id, config) => ({
      stringValue: config.default || ""
    })),
    S3Backend: jest.fn(),
  };
});

// Mock AWS Provider
jest.mock("@cdktf/provider-aws/lib/provider", () => ({
  AwsProvider: jest.fn(),
}));

describe("TapStack Unit Tests", () => {
  const { 
    NetworkingConstruct,
    SecretsConstruct,
    SecureComputeConstruct
  } = require("../lib/modules");
  const { TerraformOutput, TerraformVariable, S3Backend } = require("cdktf");
  const { AwsProvider } = require("@cdktf/provider-aws/lib/provider");

  // Mock addOverride method
  const mockAddOverride = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    // Mock the addOverride method on TerraformStack
    jest.spyOn(TapStack.prototype, 'addOverride').mockImplementation(mockAddOverride);
    
    // Mock console methods to avoid noise in test output
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("AWS Provider Configuration", () => {
    test("should create AWS provider with correct default configuration", () => {
      const app = new App();
      new TapStack(app, "TestStackProvider");

      expect(AwsProvider).toHaveBeenCalledTimes(1);
      expect(AwsProvider).toHaveBeenCalledWith(
        expect.anything(),
        "aws",
        expect.objectContaining({
          region: "us-east-1",
          defaultTags: []
        })
      );
    });

    test("should use custom AWS region when provided in props", () => {
      const app = new App();
      new TapStack(app, "TestStackCustomRegion", { awsRegion: "us-west-2" });

      expect(AwsProvider).toHaveBeenCalledWith(
        expect.anything(),
        "aws",
        expect.objectContaining({
          region: "us-west-2",
        })
      );
    });

    test("should use custom default tags when provided", () => {
      const app = new App();
      const customTags = {
        tags: {
          Project: "CustomProject",
          Environment: "Production"
        }
      };
      
      new TapStack(app, "TestStackCustomTags", { 
        defaultTags: customTags 
      });

      expect(AwsProvider).toHaveBeenCalledWith(
        expect.anything(),
        "aws",
        expect.objectContaining({
          defaultTags: [customTags]
        })
      );
    });
  });

  describe("S3 Backend Configuration", () => {
    test("should create S3 backend with correct default configuration", () => {
      const app = new App();
      new TapStack(app, "TestStackBackend");

      expect(S3Backend).toHaveBeenCalledTimes(1);
      expect(S3Backend).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          bucket: "iac-rlhf-tf-states",
          key: "dev/TestStackBackend.tfstate",
          region: "us-east-1",
          encrypt: true,
        })
      );
    });

    test("should create S3 backend with custom configuration", () => {
      const app = new App();
      const customProps = {
        environmentSuffix: "prod",
        stateBucket: "custom-tf-states",
        stateBucketRegion: "eu-west-1",
      };

      new TapStack(app, "TestStackCustomBackend", customProps);

      expect(S3Backend).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          bucket: "custom-tf-states",
          key: "prod/TestStackCustomBackend.tfstate",
          region: "eu-west-1",
          encrypt: true,
        })
      );
    });

    test("should add S3 backend override for state locking", () => {
      const app = new App();
      new TapStack(app, "TestStackOverride");

      expect(mockAddOverride).toHaveBeenCalledWith('terraform.backend.s3.use_lockfile', true);
    });

    test("should ensure S3 backend encryption is enabled", () => {
      const app = new App();
      new TapStack(app, "TestStackEncryption");

      expect(S3Backend).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          encrypt: true,
        })
      );
    });
  });

  describe("Module Creation and Dependencies", () => {
    test("should create all modules in correct order", () => {
      const app = new App();
      new TapStack(app, "TestStackModules");

      // Verify all modules are created with correct call counts
      expect(NetworkingConstruct).toHaveBeenCalledTimes(1);
      expect(SecretsConstruct).toHaveBeenCalledTimes(1);
      expect(SecureComputeConstruct).toHaveBeenCalledTimes(1);
      expect(TerraformVariable).toHaveBeenCalledTimes(1);
    });

    test("should create NetworkingConstruct with correct configuration", () => {
      const app = new App();
      new TapStack(app, "TestStackNetworking");

      expect(NetworkingConstruct).toHaveBeenCalledWith(
        expect.anything(),
        "networking",
        expect.objectContaining({
          tags: {
            Environment: "dev",
            ManagedBy: "CDKTF",
            Project: "Production-Infrastructure",
            Owner: "Platform-Team",
          }
        })
      );
    });

    test("should use custom environment suffix in tags", () => {
      const app = new App();
      new TapStack(app, "TestStackCustomEnv", { environmentSuffix: "prod" });

      expect(NetworkingConstruct).toHaveBeenCalledWith(
        expect.anything(),
        "networking",
        expect.objectContaining({
          tags: expect.objectContaining({
            Environment: "prod"
          })
        })
      );
    });

    test("should create SecretsConstruct with correct configuration", () => {
      const app = new App();
      new TapStack(app, "TestStackSecrets");

      expect(SecretsConstruct).toHaveBeenCalledWith(
        expect.anything(),
        "secrets",
        expect.objectContaining({
          tags: {
            Environment: "dev",
            ManagedBy: "CDKTF",
            Project: "Production-Infrastructure",
            Owner: "Platform-Team",
          }
        })
      );
    });

    test("should create TerraformVariable for EC2 instance type", () => {
      const app = new App();
      new TapStack(app, "TestStackVariable");

      expect(TerraformVariable).toHaveBeenCalledWith(
        expect.anything(),
        "ec2_instance_type",
        expect.objectContaining({
          type: "string",
          default: "t3.medium",
          description: "EC2 instance type for the compute instance"
        })
      );
    });

    test("should create SecureComputeConstruct with correct dependencies", () => {
      const app = new App();
      new TapStack(app, "TestStackSecureCompute");

      const networkingInstance = NetworkingConstruct.mock.results[0].value;
      const secretsInstance = SecretsConstruct.mock.results[0].value;

      expect(SecureComputeConstruct).toHaveBeenCalledWith(
        expect.anything(),
        "secure-compute",
        expect.objectContaining({
          instanceType: "t3.medium", // default value from variable
          subnetId: networkingInstance.privateSubnet.id,
          vpcId: networkingInstance.vpc.id,
          secretArn: secretsInstance.secret.arn,
          tags: {
            Environment: "dev",
            ManagedBy: "CDKTF",
            Project: "Production-Infrastructure",
            Owner: "Platform-Team",
          }
        })
      );
    });
  });

  describe("Terraform Outputs", () => {
    test("should create all required Terraform outputs", () => {
      const app = new App();
      new TapStack(app, "TestStackOutputs");

      // Should create 10 outputs as specified
      expect(TerraformOutput).toHaveBeenCalledTimes(10);
    });

    test("should create networking outputs", () => {
      const app = new App();
      new TapStack(app, "TestStackNetworkingOutputs");

      const networkingInstance = NetworkingConstruct.mock.results[0].value;

      expect(TerraformOutput).toHaveBeenCalledWith(
        expect.anything(),
        "vpc-id",
        expect.objectContaining({
          value: networkingInstance.vpc.id,
          description: "Production VPC ID",
        })
      );

      expect(TerraformOutput).toHaveBeenCalledWith(
        expect.anything(),
        "public-subnet-id",
        expect.objectContaining({
          value: networkingInstance.publicSubnet.id,
          description: "Public subnet ID",
        })
      );

      expect(TerraformOutput).toHaveBeenCalledWith(
        expect.anything(),
        "private-subnet-id",
        expect.objectContaining({
          value: networkingInstance.privateSubnet.id,
          description: "Private subnet ID",
        })
      );

      expect(TerraformOutput).toHaveBeenCalledWith(
        expect.anything(),
        "internet-gateway-id",
        expect.objectContaining({
          value: networkingInstance.internetGateway.id,
          description: "Internet Gateway ID",
        })
      );

      expect(TerraformOutput).toHaveBeenCalledWith(
        expect.anything(),
        "nat-gateway-id",
        expect.objectContaining({
          value: networkingInstance.natGateway.id,
          description: "NAT Gateway ID for private subnet connectivity",
        })
      );
    });

    test("should create EC2 related outputs", () => {
      const app = new App();
      new TapStack(app, "TestStackEC2Outputs");

      const secureComputeInstance = SecureComputeConstruct.mock.results[0].value;

      expect(TerraformOutput).toHaveBeenCalledWith(
        expect.anything(),
        "ec2-instance-id",
        expect.objectContaining({
          value: secureComputeInstance.instance.id,
          description: "Secure EC2 instance ID",
        })
      );

      expect(TerraformOutput).toHaveBeenCalledWith(
        expect.anything(),
        "ec2-instance-private-ip",
        expect.objectContaining({
          value: secureComputeInstance.instance.privateIp,
          description: "EC2 instance private IP address",
        })
      );

      expect(TerraformOutput).toHaveBeenCalledWith(
        expect.anything(),
        "ec2-security-group-id",
        expect.objectContaining({
          value: secureComputeInstance.securityGroup.id,
          description: "EC2 instance security group ID",
        })
      );

      expect(TerraformOutput).toHaveBeenCalledWith(
        expect.anything(),
        "iam-role-arn",
        expect.objectContaining({
          value: secureComputeInstance.role.arn,
          description: "IAM role ARN for EC2 instance",
        })
      );
    });

    test("should create secrets output", () => {
      const app = new App();
      new TapStack(app, "TestStackSecretsOutput");

      const secretsInstance = SecretsConstruct.mock.results[0].value;

      expect(TerraformOutput).toHaveBeenCalledWith(
        expect.anything(),
        "secret-arn",
        expect.objectContaining({
          value: secretsInstance.secret.arn,
          description: "Secrets Manager secret ARN for database credentials",
        })
      );
    });
  });

  describe("Props Handling", () => {
    test("should handle undefined props gracefully", () => {
      const app = new App();
      
      expect(() => {
        new TapStack(app, "TestStackUndefinedProps", undefined);
      }).not.toThrow();

      // Should use all default values
      expect(S3Backend).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          bucket: "iac-rlhf-tf-states",
          key: "dev/TestStackUndefinedProps.tfstate",
          region: "us-east-1",
        })
      );

      expect(AwsProvider).toHaveBeenCalledWith(
        expect.anything(),
        "aws",
        expect.objectContaining({
          region: "us-east-1",
        })
      );
    });

    test("should handle empty props object", () => {
      const app = new App();
      new TapStack(app, "TestStackEmptyProps", {});

      // Should use all default values
      expect(S3Backend).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          bucket: "iac-rlhf-tf-states",
          key: "dev/TestStackEmptyProps.tfstate",
          region: "us-east-1",
        })
      );

      expect(AwsProvider).toHaveBeenCalledWith(
        expect.anything(),
        "aws",
        expect.objectContaining({
          region: "us-east-1",
        })
      );
    });

    test("should use different regions for state bucket and AWS provider", () => {
      const app = new App();
      new TapStack(app, "TestStackDifferentRegions", { 
        stateBucketRegion: "eu-central-1",
        awsRegion: "us-west-2"
      });

      expect(S3Backend).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          region: "eu-central-1",
        })
      );

      expect(AwsProvider).toHaveBeenCalledWith(
        expect.anything(),
        "aws",
        expect.objectContaining({
          region: "us-west-2",
        })
      );
    });
  });

  describe("Module Construction with Correct IDs", () => {
    test("should create modules with correct construct IDs", () => {
      const app = new App();
      new TapStack(app, "TestStackConstructIds");

      expect(NetworkingConstruct).toHaveBeenCalledWith(
        expect.anything(),
        "networking",
        expect.anything()
      );

      expect(SecretsConstruct).toHaveBeenCalledWith(
        expect.anything(),
        "secrets",
        expect.anything()
      );

      expect(SecureComputeConstruct).toHaveBeenCalledWith(
        expect.anything(),
        "secure-compute",
        expect.anything()
      );
    });
  });

  describe("Common Tags Structure", () => {
    test("should use correct common tags structure", () => {
      const app = new App();
      new TapStack(app, "TestStackCommonTags");

      const expectedTags = {
        Environment: "dev",
        ManagedBy: "CDKTF",
        Project: "Production-Infrastructure",
        Owner: "Platform-Team"
      };

      // Verify tags are passed to all modules
      expect(NetworkingConstruct).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        expect.objectContaining({
          tags: expectedTags
        })
      );

      expect(SecretsConstruct).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        expect.objectContaining({
          tags: expectedTags
        })
      );

      expect(SecureComputeConstruct).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        expect.objectContaining({
          tags: expectedTags
        })
      );
    });

    test("should update environment tag based on environmentSuffix", () => {
      const app = new App();
      new TapStack(app, "TestStackEnvTag", { environmentSuffix: "staging" });

      expect(NetworkingConstruct).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        expect.objectContaining({
          tags: expect.objectContaining({
            Environment: "staging"
          })
        })
      );
    });
  });
});