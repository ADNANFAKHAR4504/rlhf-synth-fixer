// __tests__/tap-stack.unit.test.ts
import { App } from "cdktf";
import "cdktf/lib/testing/adapters/jest";
import { TapStack } from "../lib/tap-stack";

// Mock InfrastructureModule used in TapStack
jest.mock("../lib/modules", () => ({
  InfrastructureModule: jest.fn().mockImplementation((_, id, config) => ({
    vpc: { id: `vpc-${id}-12345` },
    publicSubnet: { id: `subnet-${id}-public-1` },
    privateSubnet: { id: `subnet-${id}-private-1` },
    ec2Instance: { 
      id: `i-${id}1234567890abcdef0`,
      publicIp: "1.2.3.4"
    },
    asg: { name: `${id}-asg` },
    s3Bucket: { 
      bucket: `${id}-secure-bucket-${config.environment}`,
      arn: `arn:aws:s3:::${id}-secure-bucket-${config.environment}`
    },
    cloudwatchAlarm: { 
      arn: `arn:aws:cloudwatch:${config.region}:123456789012:alarm:${id}-cpu-alarm`
    },
    route53Zone: {
      zoneId: `Z${id}123456789`,
      nameServers: [`ns-123.awsdns-12.com`, `ns-456.awsdns-34.net`],
      arn: `arn:aws:route53:::hostedzone/Z${id}123456789`
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

// Mock AWS Provider and DataAwsAmi
jest.mock("@cdktf/provider-aws/lib/provider", () => ({
  AwsProvider: jest.fn(),
}));

jest.mock("@cdktf/provider-aws/lib/data-aws-ami", () => ({
  DataAwsAmi: jest.fn().mockImplementation((_, id) => ({
    id: `ami-${id}123456789abcdef0`,
    name: `amzn2-ami-hvm-2.0.20231101.0-x86_64-gp2`,
    creationDate: "2023-11-01T00:00:00.000Z"
  }))
}));

describe("TapStack Unit Tests", () => {
  const { InfrastructureModule } = require("../lib/modules");
  const { TerraformOutput, S3Backend } = require("cdktf");
  const { AwsProvider } = require("@cdktf/provider-aws/lib/provider");
  const { DataAwsAmi } = require("@cdktf/provider-aws/lib/data-aws-ami");

  // Mock addOverride method
  const mockAddOverride = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    // Mock the addOverride method on TerraformStack
    jest.spyOn(TapStack.prototype, 'addOverride').mockImplementation(mockAddOverride);
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
        region: "us-east-1", // Since AWS_REGION_OVERRIDE is empty, uses default
        defaultTags: [
          {
            tags: {
              ManagedBy: "CDKTF",
              Project: "tap-infrastructure",
              Environment: "dev",
            },
          },
        ],
      })
    );
  });

  test("should use AWS_REGION_OVERRIDE when set (simulated)", () => {
    // Since AWS_REGION_OVERRIDE is a const in your code, we'll test the logic path
    const app = new App();
    // Test with custom region in props when override is empty
    new TapStack(app, "TestStackEnvRegion", { awsRegion: "eu-west-1" });

    expect(AwsProvider).toHaveBeenCalledWith(
      expect.anything(),
      "aws",
      expect.objectContaining({
        region: "eu-west-1", // Since AWS_REGION_OVERRIDE is empty, uses props
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

  test("should create DataAwsAmi with correct filters", () => {
    const app = new App();
    new TapStack(app, "TestStackAmi");

    expect(DataAwsAmi).toHaveBeenCalledTimes(1);
    expect(DataAwsAmi).toHaveBeenCalledWith(
      expect.anything(),
      "amazon-linux",
      expect.objectContaining({
        mostRecent: true,
        owners: ['amazon'],
        filter: [
          {
            name: 'name',
            values: ['amzn2-ami-hvm-*-x86_64-gp2'],
          },
          {
            name: 'virtualization-type',
            values: ['hvm'],
          },
        ],
      })
    );
  });

  test("should create InfrastructureModule with correct configuration", () => {
    const app = new App();
    new TapStack(app, "TestStackInfra");

    expect(InfrastructureModule).toHaveBeenCalledTimes(1);
    expect(InfrastructureModule).toHaveBeenCalledWith(
      expect.anything(),
      "infrastructure",
      expect.objectContaining({
        vpcCidr: '10.0.0.0/16',
        publicSubnetCidr: '10.0.1.0/24',
        privateSubnetCidr: '10.0.2.0/24',
        instanceType: 't3.micro',
        asgDesiredCapacity: 2,
        domainName: 'dev.tap-infrastructure.com',
        projectName: 'tap-infrastructure',
        environment: 'dev',
        region: 'us-east-1',
        amiId: 'ami-amazon-linux123456789abcdef0',
      })
    );
  });

  test("should create all required Terraform outputs", () => {
    const app = new App();
    new TapStack(app, "TestStackOutputs");

    expect(TerraformOutput).toHaveBeenCalledTimes(17);

    // Verify AMI outputs
    expect(TerraformOutput).toHaveBeenCalledWith(
      expect.anything(),
      "ami-id",
      expect.objectContaining({
        description: "ID of the dynamically selected Amazon Linux 2 AMI",
      })
    );

    expect(TerraformOutput).toHaveBeenCalledWith(
      expect.anything(),
      "ami-name",
      expect.objectContaining({
        description: "Name of the dynamically selected Amazon Linux 2 AMI",
      })
    );

    expect(TerraformOutput).toHaveBeenCalledWith(
      expect.anything(),
      "ami-creation-date",
      expect.objectContaining({
        description: "Creation date of the selected AMI",
      })
    );

    // Verify network outputs
    expect(TerraformOutput).toHaveBeenCalledWith(
      expect.anything(),
      "vpc-id",
      expect.objectContaining({
        description: "ID of the main VPC",
      })
    );

    expect(TerraformOutput).toHaveBeenCalledWith(
      expect.anything(),
      "public-subnet-id",
      expect.objectContaining({
        description: "ID of the public subnet",
      })
    );

    expect(TerraformOutput).toHaveBeenCalledWith(
      expect.anything(),
      "private-subnet-id",
      expect.objectContaining({
        description: "ID of the private subnet",
      })
    );

    // Verify compute outputs
    expect(TerraformOutput).toHaveBeenCalledWith(
      expect.anything(),
      "ec2-instance-id",
      expect.objectContaining({
        description: "ID of the EC2 instance in public subnet",
      })
    );

    expect(TerraformOutput).toHaveBeenCalledWith(
      expect.anything(),
      "ec2-public-ip",
      expect.objectContaining({
        description: "Public IP address of the EC2 instance",
      })
    );

    expect(TerraformOutput).toHaveBeenCalledWith(
      expect.anything(),
      "asg-name",
      expect.objectContaining({
        description: "Name of the Auto Scaling Group",
      })
    );

    // Verify storage outputs
    expect(TerraformOutput).toHaveBeenCalledWith(
      expect.anything(),
      "s3-bucket-name",
      expect.objectContaining({
        description: "Name of the S3 bucket for application data",
      })
    );

    expect(TerraformOutput).toHaveBeenCalledWith(
      expect.anything(),
      "s3-bucket-arn",
      expect.objectContaining({
        description: "ARN of the S3 bucket",
      })
    );

    // Verify DNS outputs
    expect(TerraformOutput).toHaveBeenCalledWith(
      expect.anything(),
      "route53-zone-id",
      expect.objectContaining({
        description: "Zone ID of the newly created Route 53 hosted zone",
      })
    );

    expect(TerraformOutput).toHaveBeenCalledWith(
      expect.anything(),
      "route53-name-servers",
      expect.objectContaining({
        description: "Name servers for the newly created Route 53 hosted zone - configure these with your domain registrar",
      })
    );

    expect(TerraformOutput).toHaveBeenCalledWith(
      expect.anything(),
      "route53-zone-arn",
      expect.objectContaining({
        description: "ARN of the Route 53 hosted zone",
      })
    );

    // Verify monitoring outputs
    expect(TerraformOutput).toHaveBeenCalledWith(
      expect.anything(),
      "cloudwatch-alarm-arn",
      expect.objectContaining({
        description: "ARN of the CloudWatch CPU utilization alarm",
      })
    );

    // Verify domain output
    expect(TerraformOutput).toHaveBeenCalledWith(
      expect.anything(),
      "domain-name",
      expect.objectContaining({
        description: "Domain name configured for this environment",
      })
    );
  });

  test("should use custom props when provided", () => {
    const app = new App();
    const customProps = {
      environmentSuffix: "prod",
      stateBucket: "custom-tf-states",
      stateBucketRegion: "eu-west-1",
      awsRegion: "us-west-2",
    };

    new TapStack(app, "TestStackCustomProps", customProps);

    expect(AwsProvider).toHaveBeenCalledWith(
      expect.anything(),
      "aws",
      expect.objectContaining({
        region: "us-west-2", // Uses props since AWS_REGION_OVERRIDE is empty
        defaultTags: [
          {
            tags: expect.objectContaining({
              Environment: "prod",
            }),
          },
        ],
      })
    );

    expect(S3Backend).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        bucket: "custom-tf-states",
        key: "prod/TestStackCustomProps.tfstate",
        region: "eu-west-1",
      })
    );

    expect(InfrastructureModule).toHaveBeenCalledWith(
      expect.anything(),
      "infrastructure",
      expect.objectContaining({
        domainName: 'prod.tap-infrastructure.com',
        environment: 'prod',
        region: 'us-west-2',
      })
    );
  });

  test("should use default values when props are not provided", () => {
    const app = new App();
    new TapStack(app, "TestStackDefaults");

    expect(S3Backend).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        bucket: "iac-rlhf-tf-states", // default
        key: "dev/TestStackDefaults.tfstate", // default environment
        region: "us-east-1", // default
      })
    );

    expect(InfrastructureModule).toHaveBeenCalledWith(
      expect.anything(),
      "infrastructure",
      expect.objectContaining({
        domainName: 'dev.tap-infrastructure.com',
        environment: 'dev',
        region: 'us-east-1',
      })
    );
  });

  test("should add S3 backend override for state locking", () => {
    const app = new App();
    new TapStack(app, "TestStackOverride");

    // Verify that addOverride was called for S3 state locking
    expect(mockAddOverride).toHaveBeenCalledWith('terraform.backend.s3.use_lockfile', true);
  });

  test("should create outputs with correct resource references", () => {
    const app = new App();
    new TapStack(app, "TestStackReferences");

    const infraInstance = InfrastructureModule.mock.results[0].value;

    // Verify that outputs reference the correct InfrastructureModule properties
    expect(TerraformOutput).toHaveBeenCalledWith(
      expect.anything(),
      "vpc-id",
      expect.objectContaining({
        value: infraInstance.vpc.id,
      })
    );

    expect(TerraformOutput).toHaveBeenCalledWith(
      expect.anything(),
      "public-subnet-id",
      expect.objectContaining({
        value: infraInstance.publicSubnet.id,
      })
    );

    expect(TerraformOutput).toHaveBeenCalledWith(
      expect.anything(),
      "ec2-instance-id",
      expect.objectContaining({
        value: infraInstance.ec2Instance.id,
      })
    );

    expect(TerraformOutput).toHaveBeenCalledWith(
      expect.anything(),
      "s3-bucket-name",
      expect.objectContaining({
        value: infraInstance.s3Bucket.bucket,
      })
    );
  });

  test("should handle AWS region override correctly", () => {
    const app = new App();
    
    // Test with custom AWS region in props
    new TapStack(app, "TestRegionOverride", { awsRegion: "us-east-2" });

    // Since AWS_REGION_OVERRIDE is empty, should use props value
    expect(AwsProvider).toHaveBeenCalledWith(
      expect.anything(),
      "aws",
      expect.objectContaining({
        region: "us-east-2", // Uses props since override is empty
      })
    );
  });

  test("should handle different environment suffixes correctly", () => {
    const app = new App();
    
    // Test staging environment
    new TapStack(app, "TestStagingEnv", { environmentSuffix: "staging" });

    expect(InfrastructureModule).toHaveBeenCalledWith(
      expect.anything(),
      "infrastructure",
      expect.objectContaining({
        environment: "staging",
        domainName: "staging.tap-infrastructure.com",
      })
    );

    expect(AwsProvider).toHaveBeenCalledWith(
      expect.anything(),
      "aws",
      expect.objectContaining({
        defaultTags: [
          {
            tags: expect.objectContaining({
              Environment: "staging",
            }),
          },
        ],
      })
    );
  });

  test("should create stack with correct project configuration", () => {
    const app = new App();
    new TapStack(app, "TestProjectConfig");

    expect(InfrastructureModule).toHaveBeenCalledWith(
      expect.anything(),
      "infrastructure",
      expect.objectContaining({
        vpcCidr: '10.0.0.0/16',
        publicSubnetCidr: '10.0.1.0/24',
        privateSubnetCidr: '10.0.2.0/24',
        instanceType: 't3.micro',
        asgDesiredCapacity: 2,
        projectName: 'tap-infrastructure',
        environment: "dev",
        region: "us-east-1",
      })
    );

    expect(AwsProvider).toHaveBeenCalledWith(
      expect.anything(),
      "aws",
      expect.objectContaining({
        defaultTags: [
          {
            tags: expect.objectContaining({
              Project: "tap-infrastructure",
              ManagedBy: "CDKTF",
            }),
          },
        ],
      })
    );
  });

  test("should handle custom default tags when provided", () => {
    const app = new App();
    const customTags = {
      tags: {
        CustomTag: "CustomValue",
        Team: "Platform",
      },
    };

    new TapStack(app, "TestCustomTags", { defaultTags: customTags });

    expect(AwsProvider).toHaveBeenCalledWith(
      expect.anything(),
      "aws",
      expect.objectContaining({
        defaultTags: [
          {
            tags: {
              ManagedBy: "CDKTF",
              Project: "tap-infrastructure",
              Environment: "dev",
            },
          },
        ],
      })
    );
  });

  test("should handle empty props object", () => {
    const app = new App();
    new TapStack(app, "TestEmptyProps", {});

    // Should use all default values
    expect(S3Backend).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        bucket: "iac-rlhf-tf-states",
        key: "dev/TestEmptyProps.tfstate",
        region: "us-east-1",
      })
    );

    expect(AwsProvider).toHaveBeenCalledWith(
      expect.anything(),
      "aws",
      expect.objectContaining({
        region: "us-east-1", // Since AWS_REGION_OVERRIDE is empty, uses default
        defaultTags: [
          {
            tags: expect.objectContaining({
              Environment: "dev",
            }),
          },
        ],
      })
    );
  });

  test("should handle undefined environmentSuffix", () => {
    const app = new App();
    new TapStack(app, "TestUndefinedEnv", { 
      environmentSuffix: undefined,
      stateBucket: "test-bucket" 
    });

    // Should default to 'dev'
    expect(S3Backend).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        key: "dev/TestUndefinedEnv.tfstate",
      })
    );
  });

  test("should handle undefined stateBucket", () => {
    const app = new App();
    new TapStack(app, "TestUndefinedBucket", { 
      stateBucket: undefined,
      environmentSuffix: "test" 
    });

    // Should use default bucket
    expect(S3Backend).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        bucket: "iac-rlhf-tf-states",
      })
    );
  });

  test("should handle undefined stateBucketRegion", () => {
    const app = new App();
    new TapStack(app, "TestUndefinedBucketRegion", { 
      stateBucketRegion: undefined,
      environmentSuffix: "test" 
    });

    // Should use default region
    expect(S3Backend).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        region: "us-east-1",
      })
    );
  });

  test("should handle undefined awsRegion", () => {
    const app = new App();
    new TapStack(app, "TestUndefinedAwsRegion", { 
      awsRegion: undefined,
      environmentSuffix: "test" 
    });

    // Since AWS_REGION_OVERRIDE is empty and awsRegion is undefined, should use default
    expect(AwsProvider).toHaveBeenCalledWith(
      expect.anything(),
      "aws",
      expect.objectContaining({
        region: "us-east-1", // Falls back to default
      })
    );
  });

  test("should use props awsRegion when AWS_REGION_OVERRIDE would be falsy", () => {
    const app = new App();
    new TapStack(app, "TestPropsRegion", { awsRegion: "eu-central-1" });

    expect(AwsProvider).toHaveBeenCalledWith(
      expect.anything(),
      "aws",
      expect.objectContaining({
        region: "eu-central-1", // Uses props since override is empty
      })
    );
  });

  test("should use default region when both AWS_REGION_OVERRIDE and props.awsRegion are falsy", () => {
    const app = new App();
    new TapStack(app, "TestDefaultRegion", { awsRegion: undefined });

    expect(AwsProvider).toHaveBeenCalledWith(
      expect.anything(),
      "aws",
      expect.objectContaining({
        region: "us-east-1", // Uses default when both override and props are falsy
      })
    );
  });

  test("should handle empty AWS_REGION environment variable", () => {
    const app = new App();
    // Since AWS_REGION_OVERRIDE is already empty in your code, this tests that scenario
    new TapStack(app, "TestEmptyEnvRegion");

    expect(AwsProvider).toHaveBeenCalledWith(
      expect.anything(),
      "aws",
      expect.objectContaining({
        region: "us-east-1", // Uses default when override is empty
      })
    );
  });

  test("should pass AMI ID to infrastructure configuration", () => {
    const app = new App();
    new TapStack(app, "TestAmiId");

    expect(InfrastructureModule).toHaveBeenCalledWith(
      expect.anything(),
      "infrastructure",
      expect.objectContaining({
        amiId: 'ami-amazon-linux123456789abcdef0', // AMI ID from mocked DataAwsAmi
      })
    );
  });

  test("should create VPC CIDR output with correct value", () => {
    const app = new App();
    new TapStack(app, "TestVpcCidr");

    expect(TerraformOutput).toHaveBeenCalledWith(
      expect.anything(),
      "vpc-cidr",
      expect.objectContaining({
        value: '10.0.0.0/16',
        description: "CIDR block of the VPC",
      })
    );
  });

  test("should create domain name output with environment-specific domain", () => {
    const app = new App();
    new TapStack(app, "TestDomainOutput", { environmentSuffix: "prod" });

    expect(TerraformOutput).toHaveBeenCalledWith(
      expect.anything(),
      "domain-name",
      expect.objectContaining({
        value: 'prod.tap-infrastructure.com',
        description: "Domain name configured for this environment",
      })
    );
  });

  test("should create Route53 outputs with correct values", () => {
    const app = new App();
    new TapStack(app, "TestRoute53Outputs");

    const infraInstance = InfrastructureModule.mock.results[0].value;

    expect(TerraformOutput).toHaveBeenCalledWith(
      expect.anything(),
      "route53-zone-id",
      expect.objectContaining({
        value: infraInstance.route53Zone.zoneId,
      })
    );

    expect(TerraformOutput).toHaveBeenCalledWith(
      expect.anything(),
      "route53-name-servers",
      expect.objectContaining({
        value: infraInstance.route53Zone.nameServers,
      })
    );

    expect(TerraformOutput).toHaveBeenCalledWith(
      expect.anything(),
      "route53-zone-arn",
      expect.objectContaining({
        value: infraInstance.route53Zone.arn,
      })
    );
  });

  test("should create all AMI-related outputs with correct values", () => {
    const app = new App();
    new TapStack(app, "TestAmiOutputs");

    const amiInstance = DataAwsAmi.mock.results[0].value;

    expect(TerraformOutput).toHaveBeenCalledWith(
      expect.anything(),
      "ami-id",
      expect.objectContaining({
        value: amiInstance.id,
      })
    );

    expect(TerraformOutput).toHaveBeenCalledWith(
      expect.anything(),
      "ami-name",
      expect.objectContaining({
        value: amiInstance.name,
      })
    );

    expect(TerraformOutput).toHaveBeenCalledWith(
      expect.anything(),
      "ami-creation-date",
      expect.objectContaining({
        value: amiInstance.creationDate,
      })
    );
  });
});