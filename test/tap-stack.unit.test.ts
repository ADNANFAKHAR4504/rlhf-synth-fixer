import { App } from "cdktf";
import "cdktf/lib/testing/adapters/jest";
import { TapStack } from "../lib/tap-stack";

// Mock WebAppModules used in TapStack
jest.mock("../lib/modules", () => ({
  WebAppModules: jest.fn().mockImplementation((_, id, config) => ({
    vpc: { 
      id: `vpc-${id}-12345`
    },
    loadBalancer: { 
      dnsName: `${id}-alb-123456789.${config.region}.elb.amazonaws.com`
    },
    autoScalingGroup: { 
      name: `${id}-asg`
    },
    rdsInstance: {
      endpoint: `${id}-db.cluster-xyz.${config.region}.rds.amazonaws.com`
    },
    secretsManagerSecret: { 
      arn: `arn:aws:secretsmanager:${config.region}:123456789012:secret:${id}-db-credentials-abc123`
    },
    route53Zone: { 
      zoneId: `Z1D633PJN98FT9`
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
  const { WebAppModules } = require("../lib/modules");
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
        defaultTags: [],
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

  test("should create WebAppModules with correct default configuration", () => {
    const app = new App();
    new TapStack(app, "TestStackWebApp");

    expect(WebAppModules).toHaveBeenCalledTimes(1);
    expect(WebAppModules).toHaveBeenCalledWith(
      expect.anything(),
      "web-app",
      expect.objectContaining({
        region: 'us-east-1',
        amiId: 'ami-01102c5e8ab69fb75',
        instanceType: 't3.micro',
        dbUsername: 'admin',
        dbPassword: 'changeme123!',
        domainName: 'iacnova.com',
        environment: 'dev',
      })
    );
  });

  test("should create WebAppModules with custom environment suffix", () => {
    const app = new App();
    new TapStack(app, "TestStackCustomEnv", { environmentSuffix: "staging" });

    expect(WebAppModules).toHaveBeenCalledWith(
      expect.anything(),
      "web-app",
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

    expect(WebAppModules).toHaveBeenCalledWith(
      expect.anything(),
      "web-app",
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

    // Should create 6 outputs
    expect(TerraformOutput).toHaveBeenCalledTimes(6);

    // Verify Load Balancer DNS output
    expect(TerraformOutput).toHaveBeenCalledWith(
      expect.anything(),
      "load-balancer-dns",
      expect.objectContaining({
        description: "DNS name of the Application Load Balancer",
      })
    );

    // Verify Auto Scaling Group output
    expect(TerraformOutput).toHaveBeenCalledWith(
      expect.anything(),
      "auto-scaling-group-name",
      expect.objectContaining({
        description: "Name of the Auto Scaling Group",
      })
    );

    // Verify RDS endpoint output (sensitive)
    expect(TerraformOutput).toHaveBeenCalledWith(
      expect.anything(),
      "rds-endpoint",
      expect.objectContaining({
        description: "RDS database endpoint",
        sensitive: true,
      })
    );

    // Verify Secrets Manager ARN output
    expect(TerraformOutput).toHaveBeenCalledWith(
      expect.anything(),
      "secrets-manager-arn",
      expect.objectContaining({
        description: "ARN of the Secrets Manager secret containing DB credentials",
      })
    );

    // Verify Route 53 zone ID output
    expect(TerraformOutput).toHaveBeenCalledWith(
      expect.anything(),
      "route53-zone-id",
      expect.objectContaining({
        description: "Route 53 hosted zone ID",
      })
    );

    // Verify VPC ID output
    expect(TerraformOutput).toHaveBeenCalledWith(
      expect.anything(),
      "vpc-id",
      expect.objectContaining({
        description: "ID of the main VPC",
      })
    );
  });

  test("should create outputs with correct resource references", () => {
    const app = new App();
    new TapStack(app, "TestStackReferences");

    const webAppInstance = WebAppModules.mock.results[0].value;

    // Verify that outputs reference the correct WebAppModules properties
    expect(TerraformOutput).toHaveBeenCalledWith(
      expect.anything(),
      "load-balancer-dns",
      expect.objectContaining({
        value: webAppInstance.loadBalancer.dnsName,
      })
    );

    expect(TerraformOutput).toHaveBeenCalledWith(
      expect.anything(),
      "auto-scaling-group-name",
      expect.objectContaining({
        value: webAppInstance.autoScalingGroup.name,
      })
    );

    expect(TerraformOutput).toHaveBeenCalledWith(
      expect.anything(),
      "rds-endpoint",
      expect.objectContaining({
        value: webAppInstance.rdsInstance.endpoint,
      })
    );

    expect(TerraformOutput).toHaveBeenCalledWith(
      expect.anything(),
      "secrets-manager-arn",
      expect.objectContaining({
        value: webAppInstance.secretsManagerSecret.arn,
      })
    );

    expect(TerraformOutput).toHaveBeenCalledWith(
      expect.anything(),
      "route53-zone-id",
      expect.objectContaining({
        value: webAppInstance.route53Zone.zoneId,
      })
    );

    expect(TerraformOutput).toHaveBeenCalledWith(
      expect.anything(),
      "vpc-id",
      expect.objectContaining({
        value: webAppInstance.vpc.id,
      })
    );
  });

  test("should use custom default tags when provided", () => {
    const app = new App();
    const customTags = {
      tags: {
        Project: "WebApp",
        Team: "Platform",
        Environment: "Production",
      },
    };

    new TapStack(app, "TestStackCustomTags", { defaultTags: customTags });

    expect(AwsProvider).toHaveBeenCalledWith(
      expect.anything(),
      "aws",
      expect.objectContaining({
        defaultTags: [customTags],
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
        defaultTags: [],
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
        defaultTags: [],
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

    expect(WebAppModules).toHaveBeenCalledWith(
      expect.anything(),
      "web-app",
      expect.objectContaining({
        region: "us-west-2",
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

    expect(WebAppModules).toHaveBeenCalledWith(
      expect.anything(),
      "web-app",
      expect.objectContaining({
        environment: "prod",
      })
    );
  });

  test("should use correct AMI ID for the specified region", () => {
    const app = new App();
    new TapStack(app, "TestStackAMI");

    expect(WebAppModules).toHaveBeenCalledWith(
      expect.anything(),
      "web-app",
      expect.objectContaining({
        amiId: 'ami-01102c5e8ab69fb75', // Amazon Linux 2 AMI
      })
    );
  });

  test("should use correct instance type for cost optimization", () => {
    const app = new App();
    new TapStack(app, "TestStackInstanceType");

    expect(WebAppModules).toHaveBeenCalledWith(
      expect.anything(),
      "web-app",
      expect.objectContaining({
        instanceType: 't3.micro', // Cost-effective instance type
      })
    );
  });

  test("should use correct domain name", () => {
    const app = new App();
    new TapStack(app, "TestStackDomain");

    expect(WebAppModules).toHaveBeenCalledWith(
      expect.anything(),
      "web-app",
      expect.objectContaining({
        domainName: 'iacnova.com',
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

    expect(WebAppModules).toHaveBeenCalledWith(
      expect.anything(),
      "web-app",
      expect.objectContaining({
        dbUsername: 'admin',
        dbPassword: 'changeme123!',
      })
    );

    // Restore original environment
    process.env = originalEnv;
  });

  test("should create WebAppModules with region matching AWS provider", () => {
    const app = new App();
    const customRegion = "eu-central-1";
    new TapStack(app, "TestStackRegionConsistency", { awsRegion: customRegion });

    // Both AWS provider and WebAppModules should use the same region
    expect(AwsProvider).toHaveBeenCalledWith(
      expect.anything(),
      "aws",
      expect.objectContaining({
        region: customRegion,
      })
    );

    expect(WebAppModules).toHaveBeenCalledWith(
      expect.anything(),
      "web-app",
      expect.objectContaining({
        region: customRegion,
      })
    );
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
});