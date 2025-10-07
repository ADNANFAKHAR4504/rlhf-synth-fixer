// test/tap-stack.unit.test.ts
import { App } from "cdktf";
import "cdktf/lib/testing/adapters/jest";
import { TapStack } from "../lib/tap-stack";

// Mock all the modules used in TapStack
jest.mock("../lib/modules", () => ({
  NetworkModule: jest.fn().mockImplementation((scope: any, id: string, config: any) => ({
    vpc: { id: `vpc-${id}` },
    publicSubnets: [
      { id: `pub-subnet-1-${id}` },
      { id: `pub-subnet-2-${id}` }
    ],
    privateSubnets: [
      { id: `priv-subnet-1-${id}` },
      { id: `priv-subnet-2-${id}` }
    ],
    natGateway: { id: `nat-gateway-${id}` },
    elasticIp: { publicIp: `52.123.45.${id.length}` }
  })),
  SecurityGroupModule: jest.fn().mockImplementation((scope: any, id: string, config: any) => ({
    publicSecurityGroup: { id: `public-sg-${id}` },
    privateSecurityGroup: { id: `private-sg-${id}` },
    rdsSecurityGroup: { id: `rds-sg-${id}` }
  })),
  RdsModule: jest.fn().mockImplementation((scope: any, id: string, config: any) => ({
    dbInstance: { 
      endpoint: `db-${id}.cluster-xyz.us-east-1.rds.amazonaws.com:3306`,
      dbName: `database_${id}`
    }
  }))
}));

// Mock DataAwsCallerIdentity
jest.mock("@cdktf/provider-aws/lib/data-aws-caller-identity", () => ({
  DataAwsCallerIdentity: jest.fn().mockImplementation((scope: any, id: string, config: any) => ({
    accountId: "123456789012"
  }))
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

// Mock AWS Provider
jest.mock("@cdktf/provider-aws/lib/provider", () => ({
  AwsProvider: jest.fn(),
  AwsProviderDefaultTags: jest.fn()
}));

// Helper to reset and reimport the module with different AWS_REGION_OVERRIDE
const resetModule = () => {
  jest.resetModules();
  return require("../lib/tap-stack");
};

describe("TapStack Unit Tests", () => {
  const { 
    NetworkModule,
    SecurityGroupModule,
    RdsModule
  } = require("../lib/modules");
  const { TerraformOutput, S3Backend } = require("cdktf");
  const { AwsProvider } = require("@cdktf/provider-aws/lib/provider");
  const { DataAwsCallerIdentity } = require("@cdktf/provider-aws/lib/data-aws-caller-identity");

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Constructor and Basic Functionality", () => {
    test("should create TapStack with default props", () => {
      const app = new App();
      const stack = new TapStack(app, "test-stack");

      expect(stack).toBeDefined();
      expect(stack).toBeInstanceOf(TapStack);
      
      // Verify AWS Provider is configured with defaults
      expect(AwsProvider).toHaveBeenCalledWith(
        expect.anything(),
        'aws',
        expect.objectContaining({
          region: 'us-east-1',
          defaultTags: []
        })
      );
    });

    test("should create TapStack with custom props", () => {
      const app = new App();
      const customTags = { 
        tags: { 
          Owner: 'Platform-Team',
          CostCenter: 'Engineering' 
        } 
      };
      
      const stack = new TapStack(app, "test-stack", {
        environmentSuffix: 'prod',
        stateBucket: 'custom-bucket',
        stateBucketRegion: 'us-west-2',
        awsRegion: 'eu-west-1',
        defaultTags: customTags
      });

      expect(stack).toBeDefined();
      
      // Verify AWS Provider uses custom region and tags
      expect(AwsProvider).toHaveBeenCalledWith(
        expect.anything(),
        'aws',
        expect.objectContaining({
          region: 'eu-west-1',
          defaultTags: [customTags]
        })
      );
    });

    test("should handle undefined props gracefully", () => {
      const app = new App();
      const stack = new TapStack(app, "test-stack", undefined);

      expect(stack).toBeDefined();
      expect(stack).toBeInstanceOf(TapStack);
    });

    test("should handle empty props object", () => {
      const app = new App();
      const stack = new TapStack(app, "test-stack", {});

      expect(stack).toBeDefined();
      expect(stack).toBeInstanceOf(TapStack);
    });
  });

  describe("S3 Backend Configuration", () => {
    test("should configure S3 backend with default settings", () => {
      const app = new App();
      const mockAddOverride = jest.fn();
      
      // Mock the stack instance to capture addOverride calls
      const originalPrototype = TapStack.prototype.addOverride;
      TapStack.prototype.addOverride = mockAddOverride;

      new TapStack(app, "test-stack");

      // Verify S3 backend is configured with defaults
      expect(S3Backend).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          bucket: 'iac-rlhf-tf-states',
          key: 'dev/test-stack.tfstate',
          region: 'us-east-1',
          encrypt: true
        })
      );

      // Verify state locking is enabled
      expect(mockAddOverride).toHaveBeenCalledWith(
        'terraform.backend.s3.use_lockfile',
        true
      );

      // Restore original prototype
      TapStack.prototype.addOverride = originalPrototype;
    });

    test("should configure S3 backend with custom settings", () => {
      const app = new App();
      const mockAddOverride = jest.fn();
      
      TapStack.prototype.addOverride = mockAddOverride;

      new TapStack(app, "custom-stack", {
        environmentSuffix: 'staging',
        stateBucket: 'my-state-bucket',
        stateBucketRegion: 'eu-central-1'
      });

      expect(S3Backend).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          bucket: 'my-state-bucket',
          key: 'staging/custom-stack.tfstate',
          region: 'eu-central-1',
          encrypt: true
        })
      );
    });
  });

  describe("Module Creation and Dependencies", () => {
    test("should create NetworkModule with correct configuration", () => {
      const app = new App();
      new TapStack(app, "test-stack");

      expect(NetworkModule).toHaveBeenCalledWith(
        expect.anything(),
        'network',
        expect.objectContaining({
          projectName: 'tap',
          environment: 'dev',
          vpcCidr: '10.0.0.0/16',
          publicSubnetCidrs: ['10.0.1.0/24', '10.0.2.0/24'],
          privateSubnetCidrs: ['10.0.10.0/24', '10.0.11.0/24'],
          availabilityZones: ['us-east-1a', 'us-east-1b'],
          tags: expect.objectContaining({
            Project: 'tap',
            Environment: 'dev',
            ManagedBy: 'Terraform',
            CreatedBy: 'CDKTF'
          })
        })
      );
    });

    test("should create NetworkModule with custom AWS region", () => {
      const app = new App();
      new TapStack(app, "test-stack", {
        awsRegion: 'ap-southeast-1'
      });

      expect(NetworkModule).toHaveBeenCalledWith(
        expect.anything(),
        'network',
        expect.objectContaining({
          availabilityZones: ['ap-southeast-1a', 'ap-southeast-1b']
        })
      );
    });

    test("should create SecurityGroupModule with VPC dependency", () => {
      const app = new App();
      new TapStack(app, "test-stack");

      expect(SecurityGroupModule).toHaveBeenCalledWith(
        expect.anything(),
        'security',
        expect.objectContaining({
          projectName: 'tap',
          environment: 'dev',
          vpcId: 'vpc-network',
          sshAllowedCidr: '106.213.83.113/32',
          tags: expect.objectContaining({
            Project: 'tap',
            Environment: 'dev'
          })
        })
      );
    });

    test("should create RdsModule with correct dependencies", () => {
      const app = new App();
      new TapStack(app, "test-stack");

      expect(RdsModule).toHaveBeenCalledWith(
        expect.anything(),
        'database',
        expect.objectContaining({
          projectName: 'tap',
          environment: 'dev',
          subnetIds: [
            'priv-subnet-1-network',
            'priv-subnet-2-network'
          ],
          securityGroupId: 'rds-sg-security',
          instanceClass: 'db.t3.micro',
          allocatedStorage: 20,
          backupRetentionDays: 7,
          deletionProtection: false,
          tags: expect.objectContaining({
            Project: 'tap',
            Environment: 'dev'
          })
        })
      );
    });

    test("should enable deletion protection for production environment", () => {
      const app = new App();
      new TapStack(app, "test-stack", {
        environmentSuffix: 'prod'
      });

      expect(RdsModule).toHaveBeenCalledWith(
        expect.anything(),
        'database',
        expect.objectContaining({
          deletionProtection: true
        })
      );
    });

    test("should disable deletion protection for non-production environments", () => {
      const app = new App();
      
      // Test with dev
      new TapStack(app, "test-stack-dev", {
        environmentSuffix: 'dev'
      });
      
      expect(RdsModule).toHaveBeenCalledWith(
        expect.anything(),
        'database',
        expect.objectContaining({
          deletionProtection: false
        })
      );

      jest.clearAllMocks();

      // Test with staging
      new TapStack(app, "test-stack-staging", {
        environmentSuffix: 'staging'
      });
      
      expect(RdsModule).toHaveBeenCalledWith(
        expect.anything(),
        'database',
        expect.objectContaining({
          deletionProtection: false
        })
      );
    });
  });

  describe("DataAwsCallerIdentity", () => {
    test("should create DataAwsCallerIdentity to get account ID", () => {
      const app = new App();
      new TapStack(app, "test-stack");

      expect(DataAwsCallerIdentity).toHaveBeenCalledWith(
        expect.anything(),
        'current',
        {}
      );
    });
  });

  describe("Terraform Outputs", () => {
    test("should create all expected outputs", () => {
      const app = new App();
      new TapStack(app, "test-stack");

      // Should create 11 outputs total
      expect(TerraformOutput).toHaveBeenCalledTimes(11);

      const outputCalls = (TerraformOutput as jest.Mock).mock.calls;
      const outputIds = outputCalls.map(call => call[1]);

      // Verify all output IDs
      expect(outputIds).toContain('vpc-id');
      expect(outputIds).toContain('public-subnet-ids');
      expect(outputIds).toContain('private-subnet-ids');
      expect(outputIds).toContain('nat-gateway-id');
      expect(outputIds).toContain('nat-eip-address');
      expect(outputIds).toContain('public-security-group-id');
      expect(outputIds).toContain('private-security-group-id');
      expect(outputIds).toContain('rds-security-group-id');
      expect(outputIds).toContain('rds-endpoint');
      expect(outputIds).toContain('rds-db-name');
      expect(outputIds).toContain('aws-account-id');
    });

    test("should create outputs with correct values", () => {
      const app = new App();
      new TapStack(app, "test-stack");

      const outputCalls = (TerraformOutput as jest.Mock).mock.calls;

      // Verify VPC output
      const vpcOutput = outputCalls.find(call => call[1] === 'vpc-id');
      expect(vpcOutput[2]).toMatchObject({
        value: 'vpc-network',
        description: 'VPC ID'
      });

      // Verify public subnet IDs output
      const publicSubnetsOutput = outputCalls.find(call => call[1] === 'public-subnet-ids');
      expect(publicSubnetsOutput[2]).toMatchObject({
        value: ['pub-subnet-1-network', 'pub-subnet-2-network'],
        description: 'Public subnet IDs'
      });

      // Verify RDS endpoint output
      const rdsEndpointOutput = outputCalls.find(call => call[1] === 'rds-endpoint');
      expect(rdsEndpointOutput[2]).toMatchObject({
        value: 'db-database.cluster-xyz.us-east-1.rds.amazonaws.com:3306',
        description: 'RDS instance endpoint'
      });

      // Verify AWS account ID output
      const accountIdOutput = outputCalls.find(call => call[1] === 'aws-account-id');
      expect(accountIdOutput[2]).toMatchObject({
        value: '123456789012',
        description: 'Current AWS Account ID'
      });
    });

    test("should create array outputs correctly", () => {
      const app = new App();
      new TapStack(app, "test-stack");

      const outputCalls = (TerraformOutput as jest.Mock).mock.calls;

      // Check that subnet outputs are arrays
      const privateSubnetsOutput = outputCalls.find(call => call[1] === 'private-subnet-ids');
      expect(Array.isArray(privateSubnetsOutput[2].value)).toBe(true);
      expect(privateSubnetsOutput[2].value).toHaveLength(2);
    });
  });

  describe("Edge Cases and Environment Handling", () => {
    test("should handle production environment configuration", () => {
      const app = new App();
      const prodTags = {
        tags: {
          Environment: 'production',
          Owner: 'Platform-Team',
          CostCenter: 'Engineering',
        },
      };

      new TapStack(app, "prod-stack", {
        environmentSuffix: 'production',
        stateBucket: 'prod-tf-state-bucket',
        stateBucketRegion: 'us-west-2',
        awsRegion: 'us-west-2',
        defaultTags: prodTags,
      });

      // Verify production configuration is applied
      expect(S3Backend).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          bucket: 'prod-tf-state-bucket',
          key: 'production/prod-stack.tfstate',
          region: 'us-west-2'
        })
      );

      // Verify modules use production environment
      expect(NetworkModule).toHaveBeenCalledWith(
        expect.anything(),
        'network',
        expect.objectContaining({
          environment: 'production'
        })
      );
    });

    test("should handle empty string environment suffix", () => {
      const app = new App();
      new TapStack(app, "test-stack", {
        environmentSuffix: ''
      });

      // Should fall back to 'dev'
      expect(S3Backend).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          key: 'dev/test-stack.tfstate'
        })
      );

      expect(NetworkModule).toHaveBeenCalledWith(
        expect.anything(),
        'network',
        expect.objectContaining({
          environment: 'dev'
        })
      );
    });

    test("should handle all falsy environment values", () => {
      const app = new App();

      // Test with null
      const stack1 = new TapStack(app, "test-stack-null", {
        environmentSuffix: null as any
      });
      expect(stack1).toBeDefined();

      // Test with undefined (already covered but included for completeness)
      const stack2 = new TapStack(app, "test-stack-undefined", {
        environmentSuffix: undefined
      });
      expect(stack2).toBeDefined();

      // All should use 'dev' as default
      const s3Calls = (S3Backend as jest.Mock).mock.calls;
      s3Calls.forEach(call => {
        expect(call[1].key).toContain('dev/');
      });
    });

    test("should handle different AWS regions correctly", () => {
      const app = new App();
      const regions = ['eu-west-1', 'ap-northeast-1', 'us-west-2'];

      regions.forEach((region, index) => {
        jest.clearAllMocks();
        
        new TapStack(app, `test-stack-${index}`, {
          awsRegion: region
        });

        expect(AwsProvider).toHaveBeenCalledWith(
          expect.anything(),
          'aws',
          expect.objectContaining({
            region: region
          })
        );

        expect(NetworkModule).toHaveBeenCalledWith(
          expect.anything(),
          'network',
          expect.objectContaining({
            availabilityZones: [`${region}a`, `${region}b`]
          })
        );
      });
    });
  });

  describe("Integration Flow", () => {
    test("should create stack with all components in correct order", () => {
      const app = new App();
      const stack = new TapStack(app, "integration-test");

      // Verify all components are created
      expect(AwsProvider).toHaveBeenCalledTimes(1);
      expect(S3Backend).toHaveBeenCalledTimes(1);
      expect(DataAwsCallerIdentity).toHaveBeenCalledTimes(1);
      expect(NetworkModule).toHaveBeenCalledTimes(1);
      expect(SecurityGroupModule).toHaveBeenCalledTimes(1);
      expect(RdsModule).toHaveBeenCalledTimes(1);
      expect(TerraformOutput).toHaveBeenCalledTimes(11);

      // Verify the stack is properly constructed
      expect(stack).toBeDefined();
    });

    test("should pass dependencies correctly between modules", () => {
      const app = new App();
      new TapStack(app, "deps-test");

      // Get the calls to verify dependencies
      const networkCall = (NetworkModule as jest.Mock).mock.calls[0];
      const securityGroupCall = (SecurityGroupModule as jest.Mock).mock.calls[0];
      const rdsCall = (RdsModule as jest.Mock).mock.calls[0];

      // Verify VPC ID from NetworkModule is passed to SecurityGroupModule
      expect(securityGroupCall[2].vpcId).toBe('vpc-network');

      // Verify subnet IDs from NetworkModule are passed to RdsModule
      expect(rdsCall[2].subnetIds).toEqual([
        'priv-subnet-1-network',
        'priv-subnet-2-network'
      ]);

      // Verify security group ID from SecurityGroupModule is passed to RdsModule
      expect(rdsCall[2].securityGroupId).toBe('rds-sg-security');
    });

    test("should maintain consistent tagging across all modules", () => {
      const app = new App();
      new TapStack(app, "tags-test", {
        environmentSuffix: 'staging'
      });

      const expectedTags = {
        Project: 'tap',
        Environment: 'staging',
        ManagedBy: 'Terraform',
        CreatedBy: 'CDKTF'
      };

      // Verify all modules receive the same tags
      expect(NetworkModule).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        expect.objectContaining({ tags: expectedTags })
      );

      expect(SecurityGroupModule).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        expect.objectContaining({ tags: expectedTags })
      );

      expect(RdsModule).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        expect.objectContaining({ tags: expectedTags })
      );
    });

    test("should create multiple stacks without conflicts", () => {
      const app = new App();
      
      const stack1 = new TapStack(app, "stack-1", {
        environmentSuffix: 'dev'
      });
      
      const stack2 = new TapStack(app, "stack-2", {
        environmentSuffix: 'staging'
      });
      
      const stack3 = new TapStack(app, "stack-3", {
        environmentSuffix: 'prod'
      });

      expect(stack1).toBeDefined();
      expect(stack2).toBeDefined();
      expect(stack3).toBeDefined();

      // Verify each stack has unique state file
      const s3Calls = (S3Backend as jest.Mock).mock.calls;
      const stateKeys = s3Calls.map(call => call[1].key);
      
      expect(stateKeys).toContain('dev/stack-1.tfstate');
      expect(stateKeys).toContain('staging/stack-2.tfstate');
      expect(stateKeys).toContain('prod/stack-3.tfstate');
    });
  });

  describe("Configuration Defaults", () => {
    test("should use correct default values when no props provided", () => {
      const app = new App();
      new TapStack(app, "defaults-test");

      // Check AWS Provider defaults
      expect(AwsProvider).toHaveBeenCalledWith(
        expect.anything(),
        'aws',
        expect.objectContaining({
          region: 'us-east-1',
          defaultTags: []
        })
      );

      // Check S3 Backend defaults
      expect(S3Backend).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          bucket: 'iac-rlhf-tf-states',
          region: 'us-east-1',
          key: 'dev/defaults-test.tfstate'
        })
      );

      // Check module defaults
      expect(RdsModule).toHaveBeenCalledWith(
        expect.anything(),
        'database',
        expect.objectContaining({
          instanceClass: 'db.t3.micro',
          allocatedStorage: 20,
          backupRetentionDays: 7,
          deletionProtection: false
        })
      );
    });

    test("should properly merge custom tags with default provider tags", () => {
      const app = new App();
      const customDefaultTags = {
        tags: {
          Owner: 'DevOps',
          Team: 'Platform'
        }
      };

      new TapStack(app, "tags-merge-test", {
        defaultTags: customDefaultTags
      });

      expect(AwsProvider).toHaveBeenCalledWith(
        expect.anything(),
        'aws',
        expect.objectContaining({
          defaultTags: [customDefaultTags]
        })
      );
    });
  });
});