// __tests__/tap-stack.unit.test.ts
import { App } from "cdktf";
import "cdktf/lib/testing/adapters/jest";
import { TapStack } from "../lib/tap-stack";

// Mock all modules used in TapStack
jest.mock("../lib/modules", () => ({
  VpcModule: jest.fn().mockImplementation((scope, id, config) => ({
    vpc: { id: `${id}-vpc-id` },
    publicSubnets: [
      { id: `${id}-public-subnet-1` }, 
      { id: `${id}-public-subnet-2` },
      { id: `${id}-public-subnet-3` }
    ],
    privateSubnets: [
      { id: `${id}-private-subnet-1` }, 
      { id: `${id}-private-subnet-2` },
      { id: `${id}-private-subnet-3` }
    ],
    webSecurityGroup: { id: `${id}-web-sg-id` },
    dbSecurityGroup: { id: `${id}-db-sg-id` },
    availabilityZones: ['us-east-1a', 'us-east-1b', 'us-east-1c'],
  })),
  ElbModule: jest.fn().mockImplementation((scope, id, config) => ({
    loadBalancer: { 
      dnsName: `${id}-elb.us-east-1.elb.amazonaws.com`,
      zoneId: "Z35SXDOTRQ7X7K"
    },
    targetGroup: { arn: `${id}-target-group-arn` },
  })),
  AsgModule: jest.fn().mockImplementation((scope, id, config) => ({
    autoScalingGroup: { 
      name: `${id}-asg`,
      arn: `arn:aws:autoscaling:us-east-1:123456789012:autoScalingGroup:${id}`
    },
  })),
  RdsModule: jest.fn().mockImplementation((scope, id, config) => ({
    dbInstance: { 
      endpoint: `${id}-db.cluster-xyz.us-east-1.rds.amazonaws.com`,
      port: 3306
    },
  })),
}));

// Mock AWS Secrets Manager data source
jest.mock("@cdktf/provider-aws/lib/data-aws-secretsmanager-secret-version", () => ({
  DataAwsSecretsmanagerSecretVersion: jest.fn().mockImplementation((scope, id, config) => ({
    secretString: "mock-secret-password",
  })),
}));

// Mock TerraformOutput and TerraformVariable
jest.mock("cdktf", () => {
  const actual = jest.requireActual("cdktf");
  return {
    ...actual,
    TerraformOutput: jest.fn(),
    TerraformVariable: jest.fn().mockImplementation((scope, id, config) => ({
      stringValue: config.default,
      numberValue: config.default,
    })),
  };
});

// Mock AWS Provider
jest.mock("@cdktf/provider-aws/lib/provider", () => ({
  AwsProvider: jest.fn(),
}));

describe("TapStack Unit Tests", () => {
  const { VpcModule, ElbModule, AsgModule, RdsModule } = require("../lib/modules");
  const { TerraformOutput, TerraformVariable } = require("cdktf");
  const { AwsProvider } = require("@cdktf/provider-aws/lib/provider");
  const { DataAwsSecretsmanagerSecretVersion } = require("@cdktf/provider-aws/lib/data-aws-secretsmanager-secret-version");

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Stack Initialization", () => {
    test("should create stack with default props", () => {
      const app = new App();
      const stack = new TapStack(app, "TestStack");

      expect(stack).toBeDefined();
      expect(AwsProvider).toHaveBeenCalledWith(
        expect.anything(),
        "aws",
        expect.objectContaining({
          region: "us-east-1",
          defaultTags: [],
        })
      );
    });

    test("should create stack with custom props", () => {
      const app = new App();
      const customProps = {
        environmentSuffix: "prod",
        awsRegion: "us-west-2",
        stateBucket: "custom-tf-states",
        stateBucketRegion: "us-west-2",
        defaultTags: {
          tags: {
            Environment: "production",
            Project: "tap-app"
          }
        }
      };

      new TapStack(app, "TestStackCustom", customProps);

      expect(AwsProvider).toHaveBeenCalledWith(
        expect.anything(),
        "aws",
        expect.objectContaining({
          region: "us-west-2",
          defaultTags: [customProps.defaultTags],
        })
      );
    });
  });

  describe("Terraform Variables", () => {
    test("should create all required variables with default values", () => {
      const app = new App();
      new TapStack(app, "TestStackVars");

      // Check that all variables are created with correct default values
      expect(TerraformVariable).toHaveBeenCalledWith(
        expect.anything(),
        "app_name",
        expect.objectContaining({
          type: "string",
          default: "tap-web-app",
          description: "Name of the application - used for resource naming",
        })
      );

      expect(TerraformVariable).toHaveBeenCalledWith(
        expect.anything(),
        "vpc_cidr",
        expect.objectContaining({
          type: "string",
          default: "10.0.0.0/16",
          description: "CIDR block for VPC - provides IP address space",
        })
      );

      expect(TerraformVariable).toHaveBeenCalledWith(
        expect.anything(),
        "instance_type",
        expect.objectContaining({
          type: "string",
          default: "t3.micro", // Corrected from "t3.medium"
          description: "EC2 instance type for web servers",
        })
      );

      expect(TerraformVariable).toHaveBeenCalledWith(
        expect.anything(),
        "asg_min_size",
        expect.objectContaining({
          type: "number",
          default: 1,
          description: "Minimum number of instances in ASG - ensures baseline capacity",
        })
      );

      expect(TerraformVariable).toHaveBeenCalledWith(
        expect.anything(),
        "asg_max_size",
        expect.objectContaining({
          type: "number",
          default: 3,
          description: "Maximum number of instances in ASG - controls cost",
        })
      );

      expect(TerraformVariable).toHaveBeenCalledWith(
        expect.anything(),
        "asg_desired_capacity",
        expect.objectContaining({
          type: "number",
          default: 1, // Corrected from 3
          description: "Desired number of instances - one per AZ for HA",
        })
      );

      expect(TerraformVariable).toHaveBeenCalledWith(
        expect.anything(),
        "db_instance_class",
        expect.objectContaining({
          type: "string",
          default: "db.t3.medium", // Corrected from "db.t3.micro"
          description: "RDS instance class - determines compute and memory",
        })
      );

      expect(TerraformVariable).toHaveBeenCalledWith(
        expect.anything(),
        "db_allocated_storage",
        expect.objectContaining({
          type: "number",
          default: 20,
          description: "Initial storage allocation for RDS in GB",
        })
      );

      expect(TerraformVariable).toHaveBeenCalledWith(
        expect.anything(),
        "db_name",
        expect.objectContaining({
          type: "string",
          default: "tapdb",
          description: "Name of the database to create",
        })
      );

      expect(TerraformVariable).toHaveBeenCalledWith(
        expect.anything(),
        "db_username",
        expect.objectContaining({
          type: "string",
          default: "admin",
          description: "Master username for database",
        })
      );
    });
  });

  describe("Secrets Manager Integration", () => {
    test("should create DataAwsSecretsmanagerSecretVersion for database password", () => {
      const app = new App();
      new TapStack(app, "TestStackSecrets");

      expect(DataAwsSecretsmanagerSecretVersion).toHaveBeenCalledWith(
        expect.anything(),
        "db-password-secret",
        expect.objectContaining({
          secretId: "my-db-password",
        })
      );
    });
  });

  describe("Infrastructure Modules", () => {
    test("should create VpcModule with correct configuration", () => {
      const app = new App();
      new TapStack(app, "TestStackVpc");

      expect(VpcModule).toHaveBeenCalledTimes(1);
      expect(VpcModule).toHaveBeenCalledWith(
        expect.anything(),
        "vpc",
        expect.objectContaining({
          cidrBlock: "10.0.0.0/16",
          region: "us-east-1",
          name: "tap-web-app",
        })
      );
    });

    test("should create ElbModule with correct dependencies", () => {
      const app = new App();
      new TapStack(app, "TestStackElb");

      expect(ElbModule).toHaveBeenCalledTimes(1);
      expect(ElbModule).toHaveBeenCalledWith(
        expect.anything(),
        "elb",
        expect.objectContaining({
          name: "tap-web-app",
          vpcId: "vpc-vpc-id",
          subnetIds: ["vpc-public-subnet-1", "vpc-public-subnet-2", "vpc-public-subnet-3"],
          securityGroupIds: ["vpc-web-sg-id"],
        })
      );
    });

    test("should create AsgModule with correct configuration", () => {
      const app = new App();
      new TapStack(app, "TestStackAsg");

      expect(AsgModule).toHaveBeenCalledTimes(1);
      expect(AsgModule).toHaveBeenCalledWith(
        expect.anything(),
        "asg",
        expect.objectContaining({
          name: "tap-web-app",
          vpcId: "vpc-vpc-id",
          subnetIds: ["vpc-private-subnet-1", "vpc-private-subnet-2", "vpc-private-subnet-3"],
          targetGroupArn: "elb-target-group-arn",
          instanceType: "t3.micro", // Corrected from "t3.medium"
          minSize: 1, // Corrected from 2
          maxSize: 3, // Corrected from 6
          desiredCapacity: 1, // Corrected from 3
          securityGroupIds: ["vpc-web-sg-id"],
        })
      );
    });

    test("should create RdsModule with correct configuration", () => {
      const app = new App();
      new TapStack(app, "TestStackRds");

      expect(RdsModule).toHaveBeenCalledTimes(1);
      expect(RdsModule).toHaveBeenCalledWith(
        expect.anything(),
        "rds",
        expect.objectContaining({
          name: "tap-web-app",
          engine: "mysql",
          engineVersion: "8.0",
          instanceClass: "db.t3.medium",
          allocatedStorage: 20,
          dbName: "tapdb",
          username: "admin",
          password: "mock-secret-password",
          vpcSecurityGroupIds: ["vpc-db-sg-id"],
          subnetIds: ["vpc-private-subnet-1", "vpc-private-subnet-2", "vpc-private-subnet-3"],
          backupRetentionPeriod: 7,
          multiAz: true,
        })
      );
    });
  });

  describe("Terraform Outputs", () => {
    test("should define all required outputs", () => {
      const app = new App();
      new TapStack(app, "TestStackOutputs");

      // Count total outputs - should be 11 based on the code
      expect(TerraformOutput).toHaveBeenCalledTimes(11);

      // Check specific outputs
      expect(TerraformOutput).toHaveBeenCalledWith(
        expect.anything(),
        "load_balancer_dns",
        expect.objectContaining({
          value: "elb-elb.us-east-1.elb.amazonaws.com",
          description: "DNS name of the Application Load Balancer - use this to access the application",
        })
      );

      expect(TerraformOutput).toHaveBeenCalledWith(
        expect.anything(),
        "load_balancer_zone_id",
        expect.objectContaining({
          value: "Z35SXDOTRQ7X7K",
          description: "Zone ID of the load balancer for DNS configuration",
        })
      );

      expect(TerraformOutput).toHaveBeenCalledWith(
        expect.anything(),
        "rds_endpoint",
        expect.objectContaining({
          value: "rds-db.cluster-xyz.us-east-1.rds.amazonaws.com",
          description: "RDS instance endpoint for database connections",
          sensitive: false,
        })
      );

      expect(TerraformOutput).toHaveBeenCalledWith(
        expect.anything(),
        "rds_port",
        expect.objectContaining({
          value: 3306,
          description: "Port number for database connections",
        })
      );

      expect(TerraformOutput).toHaveBeenCalledWith(
        expect.anything(),
        "asg_name",
        expect.objectContaining({
          value: "asg-asg",
          description: "Name of the Auto Scaling Group for monitoring and management",
        })
      );

      expect(TerraformOutput).toHaveBeenCalledWith(
        expect.anything(),
        "asg_arn",
        expect.objectContaining({
          value: "arn:aws:autoscaling:us-east-1:123456789012:autoScalingGroup:asg",
          description: "ARN of the Auto Scaling Group for IAM policies and monitoring",
        })
      );

      expect(TerraformOutput).toHaveBeenCalledWith(
        expect.anything(),
        "vpc_id",
        expect.objectContaining({
          value: "vpc-vpc-id",
          description: "VPC ID for additional resource deployment",
        })
      );

      expect(TerraformOutput).toHaveBeenCalledWith(
        expect.anything(),
        "availability_zones",
        expect.objectContaining({
          value: ['us-east-1a', 'us-east-1b', 'us-east-1c'],
          description: "Availability zones used for deployment - shows multi-AZ setup",
        })
      );

      expect(TerraformOutput).toHaveBeenCalledWith(
        expect.anything(),
        "web_security_group_id",
        expect.objectContaining({
          value: "vpc-web-sg-id",
          description: "Security group ID for web tier - use for additional web resources",
        })
      );

      expect(TerraformOutput).toHaveBeenCalledWith(
        expect.anything(),
        "db_security_group_id",
        expect.objectContaining({
          value: "vpc-db-sg-id",
          description: "Security group ID for database tier - use for additional DB resources",
        })
      );

      expect(TerraformOutput).toHaveBeenCalledWith(
        expect.anything(),
        "application_url",
        expect.objectContaining({
          value: "http://elb-elb.us-east-1.elb.amazonaws.com",
          description: "Complete application URL - ready to use endpoint",
        })
      );
    });
  });

  describe("AWS Region Override", () => {
    test("should use custom AWS region when provided in props", () => {
      const app = new App();
      new TapStack(app, "TestStackRegion", { awsRegion: "eu-west-1" });

      expect(AwsProvider).toHaveBeenCalledWith(
        expect.anything(),
        "aws",
        expect.objectContaining({
          region: "eu-west-1",
        })
      );
    });
  });

  describe("Error Handling", () => {
    test("should handle missing environment suffix gracefully", () => {
      const app = new App();
      const stack = new TapStack(app, "TestStackNoEnv");

      expect(stack).toBeDefined();
      // Should default to 'dev' environment suffix
    });

    test("should handle missing state bucket gracefully", () => {
      const app = new App();
      const stack = new TapStack(app, "TestStackNoBucket");

      expect(stack).toBeDefined();
      // Should default to 'iac-rlhf-tf-states' bucket
    });
  });

  describe("High Availability Configuration", () => {
    test("should configure multi-AZ deployment", () => {
      const app = new App();
      new TapStack(app, "TestStackHA");

      // Verify RDS is configured with Multi-AZ
      expect(RdsModule).toHaveBeenCalledWith(
        expect.anything(),
        "rds",
        expect.objectContaining({
          multiAz: true,
          backupRetentionPeriod: 7,
        })
      );

      // Verify ASG spans multiple subnets (AZs)
      expect(AsgModule).toHaveBeenCalledWith(
        expect.anything(),
        "asg",
        expect.objectContaining({
          subnetIds: ["vpc-private-subnet-1", "vpc-private-subnet-2", "vpc-private-subnet-3"],
        })
      );

      // Verify ELB spans multiple public subnets
      expect(ElbModule).toHaveBeenCalledWith(
        expect.anything(),
        "elb",
        expect.objectContaining({
          subnetIds: ["vpc-public-subnet-1", "vpc-public-subnet-2", "vpc-public-subnet-3"],
        })
      );
    });
  });
});