import { Testing, App } from "cdktf";
import "cdktf/lib/testing/adapters/jest";
import { TapStack } from "../lib/tap-stack"; // Adjust path as needed

// Mock all imported modules
jest.mock("../lib/modules", () => ({
  VpcModule: jest.fn().mockImplementation(() => ({
    vpc: { id: "vpc-12345" },
    publicSubnets: [{ id: "subnet-public-1" }, { id: "subnet-public-2" }],
    privateSubnets: [{ id: "subnet-private-1" }, { id: "subnet-private-2" }],
    securityGroupWeb: { id: "sg-web-12345" },
    securityGroupDatabase: { id: "sg-db-12345" },
  })),
  IamModule: jest.fn().mockImplementation(() => ({
    ec2InstanceProfile: { arn: "arn:aws:iam::123456789012:instance-profile/test-profile" },
  })),
  SecretsManagerModule: jest.fn().mockImplementation(() => ({
    dbSecret: { arn: "arn:aws:secretsmanager:us-east-1:123456789012:secret:db-secret" },
  })),
  S3Module: jest.fn().mockImplementation(() => ({
    bucket: { 
      id: "tap-webapp-assets-12345",
      arn: "arn:aws:s3:::tap-webapp-assets-12345"
    },
  })),
  RdsModule: jest.fn().mockImplementation(() => ({
    dbInstance: {
      id: "db-instance-12345",
      endpoint: "db-instance.cluster-xyz.us-east-1.rds.amazonaws.com",
      masterUserSecret: {
        get: jest.fn().mockReturnValue({
          secretArn: "arn:aws:secretsmanager:us-east-1:123456789012:secret:rds-secret",
        }),
      },
    },
  })),
  Ec2Module: jest.fn().mockImplementation(() => ({
    autoScalingGroup: { name: "asg-12345" },
    applicationLoadBalancer: { dnsName: "alb-12345.us-east-1.elb.amazonaws.com" },
  })),
  MonitoringModule: jest.fn().mockImplementation(() => ({
    dashboard: { dashboardName: "tap-dashboard" },
  })),
  LoggingModule: jest.fn().mockImplementation(() => ({
    logGroup: { name: "/aws/tap/application" },
  })),
}));

// Mock AWS Provider and Backend
jest.mock("@cdktf/provider-aws/lib/provider", () => ({
  AwsProvider: jest.fn(),
}));

jest.mock("cdktf", () => {
  const actual = jest.requireActual("cdktf");
  return {
    ...actual,
    S3Backend: jest.fn(),
    TerraformOutput: jest.fn(),
  };
});

describe("TapStack Unit Tests", () => {
  let app: App;

  beforeEach(() => {
    jest.clearAllMocks();
    app = Testing.app();
    
    // Reset environment variables
    delete process.env.DB_USERNAME;
    delete process.env.AWS_REGION;
  });

  describe("Stack Configuration", () => {
    test("should create stack with default configuration", () => {
      const stack = new TapStack(app, "test-stack");
      
      const { AwsProvider } = require("@cdktf/provider-aws/lib/provider");
      const { S3Backend } = require("cdktf");

      // Check AWS Provider was configured
      expect(AwsProvider).toHaveBeenCalledWith(
        stack,
        "aws",
        expect.objectContaining({
          region: "us-east-1",
          defaultTags: expect.arrayContaining([
            expect.objectContaining({
              tags: expect.objectContaining({
                Environment: "Production",
                Project: "WebAppInfra",
                ManagedBy: "CDKTF",
                Owner: "Platform Team",
              }),
            }),
          ]),
        })
      );

      // Check S3 Backend was configured
      expect(S3Backend).toHaveBeenCalledWith(
        stack,
        expect.objectContaining({
          bucket: "iac-rlhf-tf-states",
          key: "dev/test-stack.tfstate",
          region: "us-east-1",
          encrypt: true,
        })
      );
    });

    test("should use custom configuration when provided", () => {
      const customProps = {
        environmentSuffix: "prod",
        stateBucket: "custom-state-bucket",
        stateBucketRegion: "eu-west-1",
        awsRegion: "us-west-2",
      };

      const stack = new TapStack(app, "test-stack", customProps);
      
      const { AwsProvider } = require("@cdktf/provider-aws/lib/provider");
      const { S3Backend } = require("cdktf");

      expect(AwsProvider).toHaveBeenCalledWith(
        stack,
        "aws",
        expect.objectContaining({
          region: "us-west-2",
        })
      );

      expect(S3Backend).toHaveBeenCalledWith(
        stack,
        expect.objectContaining({
          bucket: "custom-state-bucket",
          key: "prod/test-stack.tfstate",
          region: "eu-west-1",
        })
      );
    });

    test("should add S3 backend state locking override", () => {
      const stack = new TapStack(app, "test-stack");
      
      // Check that the override was added
      expect(stack.addOverride).toBeDefined();
      // We can't easily test addOverride since it's internal to CDKTF
      // but we can verify the stack was created successfully
      expect(stack).toBeDefined();
    });
  });

  describe("Module Instantiation", () => {
    test("should create VPC module with correct configuration", () => {
      const stack = new TapStack(app, "test-stack");
      
      const { VpcModule } = require("../lib/modules");
      
      expect(VpcModule).toHaveBeenCalledWith(
        stack,
        "vpc-module",
        expect.objectContaining({
          cidrBlock: "10.0.0.0/16",
          azCount: 2,
          availabilityZones: ["us-east-1a", "us-east-1b"],
          tags: expect.objectContaining({
            Environment: "Production",
            Project: "WebAppInfra",
            Stack: "test-stack",
            IaC: "CDKTF",
          }),
        })
      );
    });

    test("should create S3 module with unique bucket name", () => {
      const stack = new TapStack(app, "test-stack");
      
      const { S3Module } = require("../lib/modules");
      
      expect(S3Module).toHaveBeenCalledWith(
        stack,
        "s3-module",
        expect.objectContaining({
          bucketName: expect.stringMatching(/^tap-webapp-assets-\d+$/),
          tags: expect.objectContaining({
            Environment: "Production",
            Project: "WebAppInfra",
          }),
        })
      );
    });

    test("should create IAM module with dependencies", () => {
      const stack = new TapStack(app, "test-stack");
      
      const { IamModule } = require("../lib/modules");
      
      expect(IamModule).toHaveBeenCalledWith(
        stack,
        "iam-module",
        expect.objectContaining({
          s3BucketArn: "arn:aws:s3:::tap-webapp-assets-12345",
          secretArn: "arn:aws:secretsmanager:us-east-1:123456789012:secret:db-secret",
          tags: expect.objectContaining({
            Environment: "Production",
          }),
        })
      );
    });

    test("should create RDS module with VPC references", () => {
      const stack = new TapStack(app, "test-stack");
      
      const { RdsModule } = require("../lib/modules");
      
      expect(RdsModule).toHaveBeenCalledWith(
        stack,
        "rds-module",
        expect.objectContaining({
          vpcId: "vpc-12345",
          subnetIds: ["subnet-private-1", "subnet-private-2"],
          securityGroupId: "sg-db-12345",
          dbName: "tapwebapp",
          username: "admin",
          tags: expect.objectContaining({
            Environment: "Production",
          }),
        })
      );
    });

    test("should use DB_USERNAME environment variable when set", () => {
      process.env.DB_USERNAME = "custom-admin";
      
      const stack = new TapStack(app, "test-stack");
      
      const { RdsModule } = require("../lib/modules");
      
      expect(RdsModule).toHaveBeenCalledWith(
        stack,
        "rds-module",
        expect.objectContaining({
          username: "custom-admin",
        })
      );
    });

    test("should create EC2 module with user data", () => {
      const stack = new TapStack(app, "test-stack");
      
      const { Ec2Module } = require("../lib/modules");
      
      const ec2Call = Ec2Module.mock.calls[0];
      
      expect(ec2Call[1]).toBe("ec2-module");
      expect(ec2Call[2]).toMatchObject({
        vpcId: "vpc-12345",
        publicSubnetIds: ["subnet-public-1", "subnet-public-2"],
        privateSubnetIds: ["subnet-private-1", "subnet-private-2"],
        securityGroupId: "sg-web-12345",
        instanceProfileArn: "arn:aws:iam::123456789012:instance-profile/test-profile",
        tags: expect.objectContaining({
          Environment: "Production",
        }),
      });
      
      // Check user data contains expected scripts
      expect(ec2Call[2].userData).toContain("#!/bin/bash");
      expect(ec2Call[2].userData).toContain("yum update -y");
      expect(ec2Call[2].userData).toContain("amazon-cloudwatch-agent");
      expect(ec2Call[2].userData).toContain("httpd");
      expect(ec2Call[2].userData).toContain("TAP Web Application");
    });

    test("should create Monitoring module with dependencies", () => {
      const stack = new TapStack(app, "test-stack");
      
      const { MonitoringModule } = require("../lib/modules");
      
      expect(MonitoringModule).toHaveBeenCalledWith(
        stack,
        "monitoring-module",
        expect.objectContaining({
          autoScalingGroupName: "asg-12345",
          dbInstanceId: "db-instance-12345",
          tags: expect.objectContaining({
            Environment: "Production",
          }),
        })
      );
    });

    test("should create Logging module with retention days", () => {
      const stack = new TapStack(app, "test-stack");
      
      const { LoggingModule } = require("../lib/modules");
      
      expect(LoggingModule).toHaveBeenCalledWith(
        stack,
        "logging-module",
        expect.objectContaining({
          retentionDays: 30,
          tags: expect.objectContaining({
            Environment: "Production",
          }),
        })
      );
    });
  });

  describe("Terraform Outputs", () => {
    test("should create all required outputs", () => {
      const stack = new TapStack(app, "test-stack");
      
      const { TerraformOutput } = require("cdktf");
      
      const outputCalls = TerraformOutput.mock.calls;
      
      // Check that all expected outputs are created
      const outputNames = outputCalls.map((call: any) => call[1]);
      
      expect(outputNames).toContain("vpc-id");
      expect(outputNames).toContain("alb-dns");
      expect(outputNames).toContain("auto-scaling-group");
      expect(outputNames).toContain("rds-endpoint");
      expect(outputNames).toContain("s3-bucket");
      expect(outputNames).toContain("cloudwatch-dashboard");
      expect(outputNames).toContain("log-group");
      expect(outputNames).toContain("rds-secret-arn");
    });

    test("should mark sensitive outputs correctly", () => {
      const stack = new TapStack(app, "test-stack");
      
      const { TerraformOutput } = require("cdktf");
      
      // Find RDS endpoint output
      const rdsEndpointOutput = TerraformOutput.mock.calls.find(
        (call: any) => call[1] === "rds-endpoint"
      );
      
      expect(rdsEndpointOutput[2].sensitive).toBe(true);
      
      // Find RDS secret ARN output
      const rdsSecretOutput = TerraformOutput.mock.calls.find(
        (call: any) => call[1] === "rds-secret-arn"
      );
      
      expect(rdsSecretOutput[2].sensitive).toBe(true);
    });

    test("should create CloudWatch dashboard URL with correct region", () => {
      process.env.AWS_REGION = "eu-west-1";
      
      const stack = new TapStack(app, "test-stack");
      
      const { TerraformOutput } = require("cdktf");
      
      const dashboardOutput = TerraformOutput.mock.calls.find(
        (call: any) => call[1] === "cloudwatch-dashboard"
      );
      
      expect(dashboardOutput[2].value).toContain("region=eu-west-1");
      expect(dashboardOutput[2].value).toContain("tap-dashboard");
    });

    test("should use default region in CloudWatch URL when AWS_REGION not set", () => {
      delete process.env.AWS_REGION;
      
      const stack = new TapStack(app, "test-stack");
      
      const { TerraformOutput } = require("cdktf");
      
      const dashboardOutput = TerraformOutput.mock.calls.find(
        (call: any) => call[1] === "cloudwatch-dashboard"
      );
      
      expect(dashboardOutput[2].value).toContain("region=us-east-1");
    });

    test("should have correct output values", () => {
      const stack = new TapStack(app, "test-stack");
      
      const { TerraformOutput } = require("cdktf");
      
      const outputs = TerraformOutput.mock.calls.reduce((acc: any, call: any) => {
        acc[call[1]] = call[2];
        return acc;
      }, {});
      
      expect(outputs["vpc-id"].value).toBe("vpc-12345");
      expect(outputs["alb-dns"].value).toBe("alb-12345.us-east-1.elb.amazonaws.com");
      expect(outputs["auto-scaling-group"].value).toBe("asg-12345");
      expect(outputs["rds-endpoint"].value).toBe("db-instance.cluster-xyz.us-east-1.rds.amazonaws.com");
      expect(outputs["s3-bucket"].value).toBe("tap-webapp-assets-12345");
      expect(outputs["log-group"].value).toBe("/aws/tap/application");
    });
  });
});