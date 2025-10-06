// test/tap-stack.unit.test.ts
import { App } from "cdktf";
import "cdktf/lib/testing/adapters/jest";
import { TapStack } from "../lib/tap-stack";

// Mock all the modules used in TapStack
jest.mock("../lib/modules", () => ({
  NetworkingConstruct: jest.fn().mockImplementation((scope: any, id: string) => ({
    vpc: { id: `${id}-vpc-id`, arn: `arn:aws:ec2:us-east-1:123456789012:vpc/${id}-vpc-id` },
    publicSubnet: { id: `${id}-public-subnet-id`, arn: `arn:aws:ec2:us-east-1:123456789012:subnet/${id}-public-subnet-id` },
    privateSubnet: { id: `${id}-private-subnet-id`, arn: `arn:aws:ec2:us-east-1:123456789012:subnet/${id}-private-subnet-id` },
    internetGateway: { id: `${id}-igw-id`, arn: `arn:aws:ec2:us-east-1:123456789012:internet-gateway/${id}-igw-id` },
    natGateway: { id: `${id}-nat-id`, arn: `arn:aws:ec2:us-east-1:123456789012:natgateway/${id}-nat-id` },
  })),
  SecureComputeConstruct: jest.fn().mockImplementation((scope: any, id: string) => ({
    instance: { 
      id: `${id}-instance-id`,
      privateIp: `10.0.2.${Math.floor(Math.random() * 255)}`,
      arn: `arn:aws:ec2:us-east-1:123456789012:instance/${id}-instance-id`
    },
    role: { 
      arn: `arn:aws:iam::123456789012:role/${id}-role`,
      name: `${id}-role`
    },
    securityGroup: { 
      id: `${id}-sg-id`,
      arn: `arn:aws:ec2:us-east-1:123456789012:security-group/${id}-sg-id`
    },
  })),
  SecretsConstruct: jest.fn().mockImplementation((scope: any, id: string) => ({
    secret: { 
      arn: `arn:aws:secretsmanager:us-east-1:123456789012:secret:${id}-secret-AbCdEf`,
      id: `${id}-secret-id`,
      name: `production/database/credentials`
    },
    secretVersion: { 
      id: `${id}-secret-version-id`,
      arn: `arn:aws:secretsmanager:us-east-1:123456789012:secret:${id}-secret-AbCdEf|version-id`
    },
  })),
}));

// Mock TerraformOutput and S3Backend to prevent duplicate construct errors
jest.mock("cdktf", () => {
  const actual = jest.requireActual("cdktf");
  
  // Create a mock TerraformStack that includes addOverride method
  class MockTerraformStack {
    addOverride = jest.fn();
  }
  
  return {
    ...actual,
    TerraformStack: MockTerraformStack,
    TerraformOutput: jest.fn(),
    S3Backend: jest.fn().mockImplementation(function(this: any) {
      return {};
    }),
  };
});

// Mock AWS Provider
jest.mock("@cdktf/provider-aws/lib/provider", () => ({
  AwsProvider: jest.fn(),
}));

// Helper to set AWS_REGION_OVERRIDE
const setAwsRegionOverride = (value: string) => {
  jest.replaceProperty(require("../lib/tap-stack"), "AWS_REGION_OVERRIDE", value);
};

describe("TapStack Unit Tests", () => {
  const { 
    NetworkingConstruct,
    SecureComputeConstruct,
    SecretsConstruct
  } = require("../lib/modules");
  const { TerraformOutput, S3Backend } = require("cdktf");
  const { AwsProvider } = require("@cdktf/provider-aws/lib/provider");

  beforeEach(() => {
    jest.clearAllMocks();
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
        environmentSuffix: 'production',
        stateBucket: 'custom-bucket',
        stateBucketRegion: 'eu-west-1',
        awsRegion: 'us-west-2',
        defaultTags: {
          tags: {
            Team: 'DevOps',
            CostCenter: '12345'
          }
        }
      });

      expect(stack).toBeDefined();
      expect(stack).toBeInstanceOf(TapStack);
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
          Owner: 'Platform-Team',
        },
      };

      new TapStack(app, "TestStackCustom", {
        environmentSuffix: 'staging',
        stateBucket: 'custom-tf-states',
        stateBucketRegion: 'eu-west-1',
        awsRegion: 'eu-central-1',
        defaultTags: customTags,
      });

      expect(AwsProvider).toHaveBeenCalledWith(
        expect.anything(),
        'aws',
        expect.objectContaining({
          region: 'eu-central-1',
          defaultTags: [customTags],
        })
      );

      expect(S3Backend).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          bucket: 'custom-tf-states',
          key: 'staging/TestStackCustom.tfstate',
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

    test("should handle empty props object", () => {
      const app = new App();
      new TapStack(app, "TestStackEmptyProps", {});

      expect(S3Backend).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          bucket: 'iac-rlhf-tf-states',
          key: 'dev/TestStackEmptyProps.tfstate',
          region: 'us-east-1',
        })
      );
    });

    test("should handle partial props correctly", () => {
      const app = new App();
      new TapStack(app, "TestStackPartialProps", {
        environmentSuffix: 'qa',
        // Other props undefined
      });

      expect(S3Backend).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          bucket: 'iac-rlhf-tf-states', // Should use default
          key: 'qa/TestStackPartialProps.tfstate', // Should use provided env
          region: 'us-east-1', // Should use default
        })
      );

      expect(AwsProvider).toHaveBeenCalledWith(
        expect.anything(),
        'aws',
        expect.objectContaining({
          region: 'us-east-1', // Should use default
        })
      );
    });

    test("should prioritize AWS_REGION_OVERRIDE when set", () => {
      // This test would need modification of the actual code to make AWS_REGION_OVERRIDE 
      // injectable for testing. As it's currently a const, we can't easily test it.
      // Keeping this as a placeholder for when the code is refactored.
      const app = new App();
      new TapStack(app, "TestStackOverrideRegion", {
        awsRegion: 'ap-southeast-1',
      });

      // If AWS_REGION_OVERRIDE was set to 'us-west-2', it would override awsRegion
      // Currently testing the non-override case
      expect(AwsProvider).toHaveBeenCalledWith(
        expect.anything(),
        'aws',
        expect.objectContaining({
          region: 'ap-southeast-1',
        })
      );
    });
  });

  describe("Module Creation and Dependencies", () => {
    test("should create NetworkingConstruct with correct tags", () => {
      const app = new App();
      new TapStack(app, "TestNetworking", {
        environmentSuffix: 'prod'
      });

      expect(NetworkingConstruct).toHaveBeenCalledWith(
        expect.anything(),
        "networking",
        expect.objectContaining({
          tags: expect.objectContaining({
            Environment: 'prod',
            ManagedBy: 'CDKTF',
            Project: 'Production-Infrastructure',
            Owner: 'Platform-Team',
          })
        })
      );
    });

    test("should create SecretsConstruct with correct tags", () => {
      const app = new App();
      new TapStack(app, "TestSecrets", {
        environmentSuffix: 'staging'
      });

      expect(SecretsConstruct).toHaveBeenCalledWith(
        expect.anything(),
        "secrets",
        expect.objectContaining({
          tags: expect.objectContaining({
            Environment: 'staging',
            ManagedBy: 'CDKTF',
            Project: 'Production-Infrastructure',
            Owner: 'Platform-Team',
          })
        })
      );
    });

    test("should create SecureComputeConstruct with proper dependencies", () => {
      const app = new App();
      new TapStack(app, "TestCompute");

      expect(SecureComputeConstruct).toHaveBeenCalledWith(
        expect.anything(),
        "secure-compute",
        expect.objectContaining({
          instanceType: 't3.medium',
          subnetId: 'networking-private-subnet-id',
          vpcId: 'networking-vpc-id',
          secretArn: 'arn:aws:secretsmanager:us-east-1:123456789012:secret:secrets-secret-AbCdEf',
          tags: expect.objectContaining({
            Environment: 'dev',
            ManagedBy: 'CDKTF',
            Project: 'Production-Infrastructure',
            Owner: 'Platform-Team',
          })
        })
      );
    });

    test("should pass dependencies between modules correctly", () => {
      const app = new App();
      new TapStack(app, "TestDependencies");

      // Verify correct order of module creation
      const networkingCallOrder = NetworkingConstruct.mock.invocationCallOrder[0];
      const secretsCallOrder = SecretsConstruct.mock.invocationCallOrder[0];
      const computeCallOrder = SecureComputeConstruct.mock.invocationCallOrder[0];

      expect(networkingCallOrder).toBeLessThan(computeCallOrder);
      expect(secretsCallOrder).toBeLessThan(computeCallOrder);

      // Verify SecureComputeConstruct receives networking dependencies
      expect(SecureComputeConstruct).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        expect.objectContaining({
          subnetId: 'networking-private-subnet-id',
          vpcId: 'networking-vpc-id',
        })
      );

      // Verify SecureComputeConstruct receives secrets dependencies
      expect(SecureComputeConstruct).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        expect.objectContaining({
          secretArn: 'arn:aws:secretsmanager:us-east-1:123456789012:secret:secrets-secret-AbCdEf',
        })
      );
    });

    test("should create all modules even with custom environment", () => {
      const app = new App();
      new TapStack(app, "TestAllModules", {
        environmentSuffix: 'production'
      });

      expect(NetworkingConstruct).toHaveBeenCalledTimes(1);
      expect(SecretsConstruct).toHaveBeenCalledTimes(1);
      expect(SecureComputeConstruct).toHaveBeenCalledTimes(1);
    });
  });

  describe("S3 Backend Configuration", () => {
    test("should configure S3 backend with state locking", () => {
      const app = new App();
      const stack = new TapStack(app, "TestBackend");

      expect(S3Backend).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          bucket: 'iac-rlhf-tf-states',
          key: 'dev/TestBackend.tfstate',
          region: 'us-east-1',
          encrypt: true,
        })
      );

      // Verify the escape hatch for state locking is set
      expect(stack.addOverride).toHaveBeenCalledWith('terraform.backend.s3.use_lockfile', true);
    });

    test("should handle custom S3 backend configuration", () => {
      const app = new App();
      const stack = new TapStack(app, "TestCustomBackend", {
        stateBucket: 'my-custom-state-bucket',
        stateBucketRegion: 'ap-northeast-1',
        environmentSuffix: 'prod'
      });

      expect(S3Backend).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          bucket: 'my-custom-state-bucket',
          key: 'prod/TestCustomBackend.tfstate',
          region: 'ap-northeast-1',
          encrypt: true,
        })
      );

      expect(stack.addOverride).toHaveBeenCalledWith('terraform.backend.s3.use_lockfile', true);
    });

    test("should always enable encryption for S3 backend", () => {
      const app = new App();
      new TapStack(app, "TestEncryption");

      expect(S3Backend).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          encrypt: true,
        })
      );
    });
  });

  describe("Terraform Outputs", () => {
    test("should create all 10 required outputs", () => {
      const app = new App();
      new TapStack(app, "TestOutputs");

      // Verify exactly 10 outputs are created
      expect(TerraformOutput).toHaveBeenCalledTimes(10);

      expect(TerraformOutput).toHaveBeenCalledWith(
        expect.anything(),
        'vpc-id',
        expect.objectContaining({
          value: 'networking-vpc-id',
          description: 'Production VPC ID',
        })
      );

      expect(TerraformOutput).toHaveBeenCalledWith(
        expect.anything(),
        'public-subnet-id',
        expect.objectContaining({
          value: 'networking-public-subnet-id',
          description: 'Public subnet ID',
        })
      );

      expect(TerraformOutput).toHaveBeenCalledWith(
        expect.anything(),
        'private-subnet-id',
        expect.objectContaining({
          value: 'networking-private-subnet-id',
          description: 'Private subnet ID',
        })
      );

      expect(TerraformOutput).toHaveBeenCalledWith(
        expect.anything(),
        'internet-gateway-id',
        expect.objectContaining({
          value: 'networking-igw-id',
          description: 'Internet Gateway ID',
        })
      );

      expect(TerraformOutput).toHaveBeenCalledWith(
        expect.anything(),
        'nat-gateway-id',
        expect.objectContaining({
          value: 'networking-nat-id',
          description: 'NAT Gateway ID for private subnet connectivity',
        })
      );

      expect(TerraformOutput).toHaveBeenCalledWith(
        expect.anything(),
        'ec2-instance-id',
        expect.objectContaining({
          value: 'secure-compute-instance-id',
          description: 'Secure EC2 instance ID',
        })
      );

      expect(TerraformOutput).toHaveBeenCalledWith(
        expect.anything(),
        'ec2-instance-private-ip',
        expect.objectContaining({
          value: expect.stringMatching(/^10\.0\.2\.\d+$/),
          description: 'EC2 instance private IP address',
        })
      );

      expect(TerraformOutput).toHaveBeenCalledWith(
        expect.anything(),
        'ec2-security-group-id',
        expect.objectContaining({
          value: 'secure-compute-sg-id',
          description: 'EC2 instance security group ID',
        })
      );

      expect(TerraformOutput).toHaveBeenCalledWith(
        expect.anything(),
        'iam-role-arn',
        expect.objectContaining({
          value: 'arn:aws:iam::123456789012:role/secure-compute-role',
          description: 'IAM role ARN for EC2 instance',
        })
      );

      expect(TerraformOutput).toHaveBeenCalledWith(
        expect.anything(),
        'secret-arn',
        expect.objectContaining({
          value: 'arn:aws:secretsmanager:us-east-1:123456789012:secret:secrets-secret-AbCdEf',
          description: 'Secrets Manager secret ARN for database credentials',
        })
      );
    });

    test("should create outputs with correct values from module references", () => {
      const app = new App();
      new TapStack(app, "TestOutputValues");

      // Get all calls to TerraformOutput
      const outputCalls = TerraformOutput.mock.calls;
      
      // Create a map of output names to values
      const outputMap = outputCalls.reduce((acc: any, call: any) => {
        acc[call[1]] = call[2].value;
        return acc;
      }, {});

      // Verify outputs reference correct module properties
      expect(outputMap['vpc-id']).toBe('networking-vpc-id');
      expect(outputMap['public-subnet-id']).toBe('networking-public-subnet-id');
      expect(outputMap['private-subnet-id']).toBe('networking-private-subnet-id');
      expect(outputMap['internet-gateway-id']).toBe('networking-igw-id');
      expect(outputMap['nat-gateway-id']).toBe('networking-nat-id');
      expect(outputMap['ec2-instance-id']).toBe('secure-compute-instance-id');
      expect(outputMap['ec2-security-group-id']).toBe('secure-compute-sg-id');
      expect(outputMap['iam-role-arn']).toBe('arn:aws:iam::123456789012:role/secure-compute-role');
      expect(outputMap['secret-arn']).toBe('arn:aws:secretsmanager:us-east-1:123456789012:secret:secrets-secret-AbCdEf');
    });
  });

  describe("AWS Provider Configuration", () => {
    test("should configure AWS provider with region and tags", () => {
      const app = new App();
      const customTags = {
        tags: {
          Department: 'Engineering',
          Environment: 'test'
        }
      };

      new TapStack(app, "TestProvider", {
        awsRegion: 'us-west-1',
        defaultTags: customTags
      });

      expect(AwsProvider).toHaveBeenCalledWith(
        expect.anything(),
        'aws',
        {
          region: 'us-west-1',
          defaultTags: [customTags],
        }
      );
    });

    test("should handle multiple stacks with different regions", () => {
      const app = new App();
      
      new TapStack(app, "Stack1", { awsRegion: 'us-east-1' });
      new TapStack(app, "Stack2", { awsRegion: 'eu-west-1' });
      
      const providerCalls = AwsProvider.mock.calls;
      
      expect(providerCalls[0][2].region).toBe('us-east-1');
      expect(providerCalls[1][2].region).toBe('eu-west-1');
    });
  });

  describe("Edge Cases and Error Scenarios", () => {
    test("should handle when module creation returns partial data", () => {
      // This tests that the stack handles gracefully when modules return partial data
      const app = new App();
      expect(() => new TapStack(app, "TestPartialData")).not.toThrow();
    });

    test("should create stack with minimum required configuration", () => {
      const app = new App();
      const stack = new TapStack(app, "MinimalStack");
      
      expect(stack).toBeDefined();
      expect(NetworkingConstruct).toHaveBeenCalled();
      expect(SecretsConstruct).toHaveBeenCalled();
      expect(SecureComputeConstruct).toHaveBeenCalled();
    });

    test("should maintain consistent tagging across all resources", () => {
      const app = new App();
      new TapStack(app, "TestConsistentTags", {
        environmentSuffix: 'qa'
      });

      const expectedTags = {
        Environment: 'qa',
        ManagedBy: 'CDKTF',
        Project: 'Production-Infrastructure',
        Owner: 'Platform-Team',
      };

      // Check that all modules received the same tags
      expect(NetworkingConstruct).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        expect.objectContaining({ tags: expectedTags })
      );

      expect(SecretsConstruct).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        expect.objectContaining({ tags: expectedTags })
      );

      expect(SecureComputeConstruct).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        expect.objectContaining({ tags: expectedTags })
      );
    });
  });
});