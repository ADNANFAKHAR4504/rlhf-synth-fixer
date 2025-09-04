import { App } from "cdktf";
import "cdktf/lib/testing/adapters/jest";
import { TapStack } from "../lib/tap-stack";

// Mock InfrastructureModule used in TapStack
jest.mock("../lib/modules", () => ({
  InfrastructureModule: jest.fn().mockImplementation((_, id, config) => ({
    s3Bucket: { 
      bucket: `${id}-logs-bucket-${config.environment}`
    },
    ec2Instance: { 
      id: `i-${id}-12345`,
      publicIp: `203.0.113.${Math.floor(Math.random() * 255)}`
    },
    rdsInstance: {
      endpoint: `${id}-db.cluster-xyz.${config.environment}.rds.amazonaws.com`
    },
    cloudTrail: { 
      arn: `arn:aws:cloudtrail:us-east-1:123456789012:trail/${id}-cloudtrail`
    },
    wafWebAcl: { 
      arn: `arn:aws:wafv2:us-east-1:123456789012:global/webacl/${id}-waf/abc123`
    },
    vpc: { 
      id: `vpc-${id}-12345`
    },
    config,
  }))
}));

// Mock TerraformOutput to avoid duplicate construct errors
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

describe("TapStack Unit Tests", () => {
  const { InfrastructureModule } = require("../lib/modules");
  const { TerraformOutput, S3Backend } = require("cdktf");
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

  test("should create AWS provider with correct region and default tags", () => {
    const app = new App();
    new TapStack(app, "TestStackProvider");

    expect(AwsProvider).toHaveBeenCalledTimes(1);
    expect(AwsProvider).toHaveBeenCalledWith(
      expect.anything(),
      "aws",
      expect.objectContaining({
        region: "us-east-1",
        defaultTags: [
          {
            tags: {
              Project: 'Financial Services Infrastructure',
              ManagedBy: 'CDKTF',
              Compliance: 'SOX-PCI-DSS',
              CostCenter: 'IT-Infrastructure',
            },
          },
        ],
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

  test("should create S3 backend with correct configuration", () => {
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

  test("should create InfrastructureModule with correct default configuration", () => {
    const app = new App();
    new TapStack(app, "TestStackInfrastructure");

    expect(InfrastructureModule).toHaveBeenCalledTimes(1);
    expect(InfrastructureModule).toHaveBeenCalledWith(
      expect.anything(),
      "infrastructure",
      expect.objectContaining({
        vpcCidr: '10.0.0.0/16',
        companyIpRange: '203.0.113.0/24',
        amiId: 'ami-01102c5e8ab69fb75',
        instanceType: 't3.micro',
        dbUsername: 'admin',
        dbPassword: 'changeme123!',
        environment: 'dev',
      })
    );
  });

  test("should create InfrastructureModule with custom environment suffix", () => {
    const app = new App();
    new TapStack(app, "TestStackCustomEnv", { environmentSuffix: "staging" });

    expect(InfrastructureModule).toHaveBeenCalledWith(
      expect.anything(),
      "infrastructure",
      expect.objectContaining({
        environment: 'staging',
      })
    );
  });

  test("should use environment variables for database credentials", () => {
    const originalEnv = process.env;
    process.env = {
      ...originalEnv,
      DB_USERNAME: 'testuser',
      DB_PASSWORD: 'testpassword123!',
    };

    const app = new App();
    new TapStack(app, "TestStackEnvVars");

    expect(InfrastructureModule).toHaveBeenCalledWith(
      expect.anything(),
      "infrastructure",
      expect.objectContaining({
        dbUsername: 'testuser',
        dbPassword: 'testpassword123!',
      })
    );

    // Restore original environment
    process.env = originalEnv;
  });

  test("should create all required Terraform outputs", () => {
    const app = new App();
    new TapStack(app, "TestStackOutputs");

    // Should create 7 outputs
    expect(TerraformOutput).toHaveBeenCalledTimes(7);

    // Verify S3 bucket name output
    expect(TerraformOutput).toHaveBeenCalledWith(
      expect.anything(),
      "s3-bucket-name",
      expect.objectContaining({
        description: "Name of the S3 bucket for application logs",
        sensitive: false,
      })
    );

    // Verify EC2 instance ID output
    expect(TerraformOutput).toHaveBeenCalledWith(
      expect.anything(),
      "ec2-instance-id",
      expect.objectContaining({
        description: "ID of the application server EC2 instance",
        sensitive: false,
      })
    );

    // Verify RDS endpoint output
    expect(TerraformOutput).toHaveBeenCalledWith(
      expect.anything(),
      "rds-endpoint",
      expect.objectContaining({
        description: "RDS database endpoint for application connections",
        sensitive: false,
      })
    );

    // Verify CloudTrail ARN output
    expect(TerraformOutput).toHaveBeenCalledWith(
      expect.anything(),
      "cloudtrail-arn",
      expect.objectContaining({
        description: "ARN of the CloudTrail for audit logging",
        sensitive: false,
      })
    );

    // Verify WAF Web ACL ARN output
    expect(TerraformOutput).toHaveBeenCalledWith(
      expect.anything(),
      "waf-webacl-arn",
      expect.objectContaining({
        description: "ARN of the WAF Web ACL for application protection",
        sensitive: false,
      })
    );

    // Verify VPC ID output
    expect(TerraformOutput).toHaveBeenCalledWith(
      expect.anything(),
      "vpc-id",
      expect.objectContaining({
        description: "ID of the main VPC",
        sensitive: false,
      })
    );

    // Verify Application server public IP output
    expect(TerraformOutput).toHaveBeenCalledWith(
      expect.anything(),
      "app-server-public-ip",
      expect.objectContaining({
        description: "Public IP address of the application server",
        sensitive: false,
      })
    );
  });

  test("should create outputs with correct resource references", () => {
    const app = new App();
    new TapStack(app, "TestStackReferences");

    const infrastructureInstance = InfrastructureModule.mock.results[0].value;

    // Verify that outputs reference the correct InfrastructureModule properties
    expect(TerraformOutput).toHaveBeenCalledWith(
      expect.anything(),
      "s3-bucket-name",
      expect.objectContaining({
        value: infrastructureInstance.s3Bucket.bucket,
      })
    );

    expect(TerraformOutput).toHaveBeenCalledWith(
      expect.anything(),
      "ec2-instance-id",
      expect.objectContaining({
        value: infrastructureInstance.ec2Instance.id,
      })
    );

    expect(TerraformOutput).toHaveBeenCalledWith(
      expect.anything(),
      "rds-endpoint",
      expect.objectContaining({
        value: infrastructureInstance.rdsInstance.endpoint,
      })
    );

    expect(TerraformOutput).toHaveBeenCalledWith(
      expect.anything(),
      "cloudtrail-arn",
      expect.objectContaining({
        value: infrastructureInstance.cloudTrail.arn,
      })
    );

    expect(TerraformOutput).toHaveBeenCalledWith(
      expect.anything(),
      "waf-webacl-arn",
      expect.objectContaining({
        value: infrastructureInstance.wafWebAcl.arn,
      })
    );

    expect(TerraformOutput).toHaveBeenCalledWith(
      expect.anything(),
      "vpc-id",
      expect.objectContaining({
        value: infrastructureInstance.vpc.id,
      })
    );

    expect(TerraformOutput).toHaveBeenCalledWith(
      expect.anything(),
      "app-server-public-ip",
      expect.objectContaining({
        value: infrastructureInstance.ec2Instance.publicIp,
      })
    );
  });

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

  test("should handle AWS region override correctly when AWS_REGION_OVERRIDE is empty", () => {
    const app = new App();
    
    // Test with custom AWS region in props (since AWS_REGION_OVERRIDE is empty string)
    new TapStack(app, "TestRegionOverride", { awsRegion: "us-west-2" });

    expect(AwsProvider).toHaveBeenCalledWith(
      expect.anything(),
      "aws",
      expect.objectContaining({
        region: "us-west-2",
      })
    );

    expect(InfrastructureModule).toHaveBeenCalledWith(
      expect.anything(),
      "infrastructure",
      expect.objectContaining({
        environment: "dev",
      })
    );
  });

  test("should create stack with different environment suffixes", () => {
    const app = new App();
    
    // Test production environment
    new TapStack(app, "TestStackProd", { environmentSuffix: "prod" });

    expect(S3Backend).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        key: "prod/TestStackProd.tfstate",
      })
    );

    expect(InfrastructureModule).toHaveBeenCalledWith(
      expect.anything(),
      "infrastructure",
      expect.objectContaining({
        environment: "prod",
      })
    );
  });

  test("should use correct AMI ID for Amazon Linux 2", () => {
    const app = new App();
    new TapStack(app, "TestStackAMI");

    expect(InfrastructureModule).toHaveBeenCalledWith(
      expect.anything(),
      "infrastructure",
      expect.objectContaining({
        amiId: 'ami-01102c5e8ab69fb75', // Amazon Linux 2 AMI
      })
    );
  });

  test("should use correct instance type for cost optimization", () => {
    const app = new App();
    new TapStack(app, "TestStackInstanceType");

    expect(InfrastructureModule).toHaveBeenCalledWith(
      expect.anything(),
      "infrastructure",
      expect.objectContaining({
        instanceType: 't3.micro', // Cost-effective instance type
      })
    );
  });

  test("should use correct VPC CIDR block", () => {
    const app = new App();
    new TapStack(app, "TestStackVPC");

    expect(InfrastructureModule).toHaveBeenCalledWith(
      expect.anything(),
      "infrastructure",
      expect.objectContaining({
        vpcCidr: '10.0.0.0/16',
      })
    );
  });

  test("should use correct company IP range", () => {
    const app = new App();
    new TapStack(app, "TestStackCompanyIP");

    expect(InfrastructureModule).toHaveBeenCalledWith(
      expect.anything(),
      "infrastructure",
      expect.objectContaining({
        companyIpRange: '203.0.113.0/24',
      })
    );
  });

  test("should handle missing environment variables with defaults", () => {
    const originalEnv = process.env;
    // Remove DB environment variables
    const { DB_USERNAME, DB_PASSWORD, ...envWithoutDB } = process.env;
    process.env = envWithoutDB;

    const app = new App();
    new TapStack(app, "TestStackDefaults");

    expect(InfrastructureModule).toHaveBeenCalledWith(
      expect.anything(),
      "infrastructure",
      expect.objectContaining({
        dbUsername: 'admin',
        dbPassword: 'changeme123!',
      })
    );

    // Restore original environment
    process.env = originalEnv;
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

  test("should create unique S3 backend keys for different stacks", () => {
    const app = new App();
    
    new TapStack(app, "Stack1");
    new TapStack(app, "Stack2");

    expect(S3Backend).toHaveBeenNthCalledWith(1,
      expect.anything(),
      expect.objectContaining({
        key: "dev/Stack1.tfstate",
      })
    );

    expect(S3Backend).toHaveBeenNthCalledWith(2,
      expect.anything(),
      expect.objectContaining({
        key: "dev/Stack2.tfstate",
      })
    );
  });

  test("should create infrastructure module with correct construct id", () => {
    const app = new App();
    new TapStack(app, "TestStackConstructId");

    expect(InfrastructureModule).toHaveBeenCalledWith(
      expect.anything(),
      "infrastructure",
      expect.anything()
    );
  });

  test("should handle all financial services compliance tags", () => {
    const app = new App();
    new TapStack(app, "TestStackCompliance");

    expect(AwsProvider).toHaveBeenCalledWith(
      expect.anything(),
      "aws",
      expect.objectContaining({
        defaultTags: [
          {
            tags: expect.objectContaining({
              Project: 'Financial Services Infrastructure',
              ManagedBy: 'CDKTF',
              Compliance: 'SOX-PCI-DSS',
              CostCenter: 'IT-Infrastructure',
            }),
          },
        ],
      })
    );
  });

  test("should use state bucket region for S3 backend", () => {
    const app = new App();
    new TapStack(app, "TestStackStateBucketRegion", { 
      stateBucketRegion: "eu-central-1",
      awsRegion: "us-west-2" // Different from state bucket region
    });

    expect(S3Backend).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        region: "eu-central-1", // Should use stateBucketRegion
      })
    );

    expect(AwsProvider).toHaveBeenCalledWith(
      expect.anything(),
      "aws",
      expect.objectContaining({
        region: "us-west-2", // Should use awsRegion
      })
    );
  });

  test("should create InfrastructureModule configuration with all required fields", () => {
    const app = new App();
    new TapStack(app, "TestStackFullConfig");

    const expectedConfig = {
      vpcCidr: '10.0.0.0/16',
      companyIpRange: '203.0.113.0/24',
      amiId: 'ami-01102c5e8ab69fb75',
      instanceType: 't3.micro',
      dbUsername: 'admin',
      dbPassword: 'changeme123!',
      environment: 'dev',
    };

    expect(InfrastructureModule).toHaveBeenCalledWith(
      expect.anything(),
      "infrastructure",
      expectedConfig
    );
  });
});