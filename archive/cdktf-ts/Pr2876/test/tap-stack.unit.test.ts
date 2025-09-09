import { App } from "cdktf";
import "cdktf/lib/testing/adapters/jest";
import { TapStack } from "../lib/tap-stack";

// Mock all the modules used in TapStack
jest.mock("../lib/modules", () => ({
  VpcModule: jest.fn().mockImplementation((scope, id, cidr) => ({
    vpc: { 
      id: `vpc-${id}-12345`
    },
    publicSubnets: [
      { id: `subnet-public-${id}-1` },
      { id: `subnet-public-${id}-2` }
    ],
    privateSubnets: [
      { id: `subnet-private-${id}-1` },
      { id: `subnet-private-${id}-2` }
    ],
    natGateway: {
      publicIp: `52.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`
    }
  })),
  SecurityGroupsModule: jest.fn().mockImplementation((scope, id, vpcId) => ({
    webSecurityGroup: { 
      id: `sg-web-${id}-12345`
    },
    databaseSecurityGroup: { 
      id: `sg-db-${id}-12345`
    },
    lambdaSecurityGroup: {
      id: `sg-lambda-${id}-12345`
    }
  })),
  EC2Module: jest.fn().mockImplementation((scope, id, subnetIds, sgId, amiId) => ({
    instances: [
      { id: `i-ec2-${id}-11111` },
      { id: `i-ec2-${id}-22222` }
    ]
  })),
  S3Module: jest.fn().mockImplementation((scope, id, bucketPrefix) => ({
    contentBucket: { 
      id: `${bucketPrefix}-content`,
      bucketDomainName: `${bucketPrefix}-content.s3.amazonaws.com`
    },
    logsBucket: {
      id: `${bucketPrefix}-logs`
    }
  })),
  RDSModule: jest.fn().mockImplementation((scope, id, subnetIds, sgId) => ({
    dbInstance: {
      id: `rds-${id}-instance`,
      endpoint: `rds-${id}.cluster-xyz.us-east-1.rds.amazonaws.com`
    }
  })),
  CloudFrontModule: jest.fn().mockImplementation((scope, id, originDomainName, originId) => ({
    distribution: {
      id: `E${id.toUpperCase()}123456789`,
      domainName: `d123456789abcdef.cloudfront.net`
    }
  })),
  LambdaModule: jest.fn().mockImplementation((scope, id, subnetIds, sgId) => ({
    functions: [
      { arn: `arn:aws:lambda:us-east-1:123456789012:function:lambda-${id}-1` },
      { arn: `arn:aws:lambda:us-east-1:123456789012:function:lambda-${id}-2` }
    ]
  })),
  CloudWatchModule: jest.fn().mockImplementation((scope, id, instanceIds) => ({
    alarms: [
      { arn: `arn:aws:cloudwatch:us-east-1:123456789012:alarm:cpu-alarm-${id}` },
      { arn: `arn:aws:cloudwatch:us-east-1:123456789012:alarm:memory-alarm-${id}` }
    ]
  })),
  DynamoDBModule: jest.fn().mockImplementation((scope, id, tableName) => ({
    table: {
      name: tableName,
      arn: `arn:aws:dynamodb:us-east-1:123456789012:table/${tableName}`
    }
  }))
}));

// Mock CDKTF constructs to avoid duplicate construct errors
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
  const { 
    VpcModule,
    SecurityGroupsModule,
    EC2Module,
    S3Module,
    RDSModule,
    CloudFrontModule,
    LambdaModule,
    CloudWatchModule,
    DynamoDBModule
  } = require("../lib/modules");
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
          Project: "test-project",
          Environment: "staging"
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

    test("should override AWS region with AWS_REGION_OVERRIDE constant", () => {
      // Since AWS_REGION_OVERRIDE is empty in the code, this test verifies the logic
      const app = new App();
      new TapStack(app, "TestStackRegionOverride", { awsRegion: "eu-west-1" });

      // Should use props region since AWS_REGION_OVERRIDE is empty
      expect(AwsProvider).toHaveBeenCalledWith(
        expect.anything(),
        "aws",
        expect.objectContaining({
          region: "eu-west-1",
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

  describe("Module Creation and Dependencies", () => {
    test("should create all modules in correct order", () => {
      const app = new App();
      new TapStack(app, "TestStackModules");

      // Verify all modules are created once
      expect(VpcModule).toHaveBeenCalledTimes(1);
      expect(SecurityGroupsModule).toHaveBeenCalledTimes(1);
      expect(EC2Module).toHaveBeenCalledTimes(1);
      expect(S3Module).toHaveBeenCalledTimes(1);
      expect(RDSModule).toHaveBeenCalledTimes(1);
      expect(CloudFrontModule).toHaveBeenCalledTimes(1);
      expect(LambdaModule).toHaveBeenCalledTimes(1);
      expect(CloudWatchModule).toHaveBeenCalledTimes(1);
      expect(DynamoDBModule).toHaveBeenCalledTimes(1);
    });

    test("should create VPC module with correct CIDR block", () => {
      const app = new App();
      new TapStack(app, "TestStackVpc");

      expect(VpcModule).toHaveBeenCalledWith(
        expect.anything(),
        "vpc",
        "10.0.0.0/16"
      );
    });

    test("should create Security Groups module with VPC dependency", () => {
      const app = new App();
      new TapStack(app, "TestStackSecurityGroups");

      const vpcInstance = VpcModule.mock.results[0].value;

      expect(SecurityGroupsModule).toHaveBeenCalledWith(
        expect.anything(),
        "security-groups",
        vpcInstance.vpc.id
      );
    });

    test("should create EC2 module with correct dependencies", () => {
      const app = new App();
      new TapStack(app, "TestStackEC2");

      const vpcInstance = VpcModule.mock.results[0].value;
      const securityGroupsInstance = SecurityGroupsModule.mock.results[0].value;

      expect(EC2Module).toHaveBeenCalledWith(
        expect.anything(),
        "ec2",
        vpcInstance.privateSubnets.map((subnet: { id: string }) => subnet.id),
        securityGroupsInstance.webSecurityGroup.id,
        "ami-0bbc328167dee8f3c"
      );
    });

    test("should create S3 module with correct bucket prefix", () => {
      const app = new App();
      new TapStack(app, "TestStackS3");

      expect(S3Module).toHaveBeenCalledWith(
        expect.anything(),
        "s3",
        "production-app-123456-dev"
      );
    });

    test("should create S3 module with custom environment suffix", () => {
      const app = new App();
      new TapStack(app, "TestStackS3Custom", { environmentSuffix: "staging" });

      expect(S3Module).toHaveBeenCalledWith(
        expect.anything(),
        "s3",
        "production-app-123456-staging"
      );
    });

    test("should create RDS module with correct dependencies", () => {
      const app = new App();
      new TapStack(app, "TestStackRDS");

      const vpcInstance = VpcModule.mock.results[0].value;
      const securityGroupsInstance = SecurityGroupsModule.mock.results[0].value;

      expect(RDSModule).toHaveBeenCalledWith(
        expect.anything(),
        "rds",
        vpcInstance.privateSubnets.map((subnet: { id: string }) => subnet.id),
        securityGroupsInstance.databaseSecurityGroup.id
      );
    });

    test("should create CloudFront module with S3 dependency", () => {
      const app = new App();
      new TapStack(app, "TestStackCloudFront");

      const s3Instance = S3Module.mock.results[0].value;

      expect(CloudFrontModule).toHaveBeenCalledWith(
        expect.anything(),
        "cloudfront",
        s3Instance.contentBucket.bucketDomainName,
        s3Instance.contentBucket.id
      );
    });

    test("should create Lambda module with VPC dependencies", () => {
      const app = new App();
      new TapStack(app, "TestStackLambda");

      const vpcInstance = VpcModule.mock.results[0].value;
      const securityGroupsInstance = SecurityGroupsModule.mock.results[0].value;

      expect(LambdaModule).toHaveBeenCalledWith(
        expect.anything(),
        "lambda",
        vpcInstance.privateSubnets.map((subnet: { id: string }) => subnet.id),
        securityGroupsInstance.lambdaSecurityGroup.id
      );
    });

    test("should create CloudWatch module with EC2 dependency", () => {
      const app = new App();
      new TapStack(app, "TestStackCloudWatch");

      const ec2Instance = EC2Module.mock.results[0].value;

      expect(CloudWatchModule).toHaveBeenCalledWith(
        expect.anything(),
        "cloudwatch",
        ec2Instance.instances.map((instance: { id: string }) => instance.id)
      );
    });

    test("should create DynamoDB module with correct table name", () => {
      const app = new App();
      new TapStack(app, "TestStackDynamoDB");

      expect(DynamoDBModule).toHaveBeenCalledWith(
        expect.anything(),
        "dynamodb",
        "production-dynamodb-table"
      );
    });
  });

  describe("Terraform Outputs", () => {
    test("should create all required Terraform outputs", () => {
      const app = new App();
      new TapStack(app, "TestStackOutputs");

      // Should create 13 outputs based on the actual code
      expect(TerraformOutput).toHaveBeenCalledTimes(13);
    });

    test("should create VPC ID output", () => {
      const app = new App();
      new TapStack(app, "TestStackVpcOutput");

      const vpcInstance = VpcModule.mock.results[0].value;

      expect(TerraformOutput).toHaveBeenCalledWith(
        expect.anything(),
        "vpc-id",
        expect.objectContaining({
          value: vpcInstance.vpc.id,
          description: "VPC ID for the production environment",
        })
      );
    });

    test("should create EC2 instance IDs output", () => {
      const app = new App();
      new TapStack(app, "TestStackEC2Output");

      const ec2Instance = EC2Module.mock.results[0].value;

      expect(TerraformOutput).toHaveBeenCalledWith(
        expect.anything(),
        "ec2-instance-ids",
        expect.objectContaining({
          value: ec2Instance.instances.map((instance: { id: string }) => instance.id),
          description: "EC2 instance IDs for web servers",
        })
      );
    });

    test("should create S3 bucket outputs", () => {
      const app = new App();
      new TapStack(app, "TestStackS3Output");

      const s3Instance = S3Module.mock.results[0].value;

      expect(TerraformOutput).toHaveBeenCalledWith(
        expect.anything(),
        "s3-content-bucket-name",
        expect.objectContaining({
          value: s3Instance.contentBucket.id,
          description: "S3 content bucket name",
        })
      );

      expect(TerraformOutput).toHaveBeenCalledWith(
        expect.anything(),
        "s3-logs-bucket-name",
        expect.objectContaining({
          value: s3Instance.logsBucket.id,
          description: "S3 access logs bucket name",
        })
      );
    });

    test("should create sensitive RDS endpoint output", () => {
      const app = new App();
      new TapStack(app, "TestStackRDSOutput");

      const rdsInstance = RDSModule.mock.results[0].value;

      expect(TerraformOutput).toHaveBeenCalledWith(
        expect.anything(),
        "rds-endpoint",
        expect.objectContaining({
          value: rdsInstance.dbInstance.endpoint,
          description: "RDS database endpoint",
          sensitive: true,
        })
      );
    });

    test("should create CloudFront distribution outputs", () => {
      const app = new App();
      new TapStack(app, "TestStackCloudFrontOutput");

      const cloudFrontInstance = CloudFrontModule.mock.results[0].value;

      expect(TerraformOutput).toHaveBeenCalledWith(
        expect.anything(),
        "cloudfront-distribution-domain",
        expect.objectContaining({
          value: cloudFrontInstance.distribution.domainName,
          description: "CloudFront distribution domain name",
        })
      );

      expect(TerraformOutput).toHaveBeenCalledWith(
        expect.anything(),
        "cloudfront-distribution-id",
        expect.objectContaining({
          value: cloudFrontInstance.distribution.id,
          description: "CloudFront distribution ID",
        })
      );
    });

    test("should create Lambda function ARNs output", () => {
      const app = new App();
      new TapStack(app, "TestStackLambdaOutput");

      const lambdaInstance = LambdaModule.mock.results[0].value;

      expect(TerraformOutput).toHaveBeenCalledWith(
        expect.anything(),
        "lambda-function-arns",
        expect.objectContaining({
          value: lambdaInstance.functions.map((func: { arn: string }) => func.arn),
          description: "Lambda function ARNs",
        })
      );
    });

    test("should create NAT Gateway IP output", () => {
      const app = new App();
      new TapStack(app, "TestStackNATOutput");

      const vpcInstance = VpcModule.mock.results[0].value;

      expect(TerraformOutput).toHaveBeenCalledWith(
        expect.anything(),
        "nat-gateway-ip",
        expect.objectContaining({
          value: vpcInstance.natGateway.publicIp,
          description: "NAT Gateway public IP address",
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

  describe("Module Construction with Correct IDs", () => {
    test("should create modules with correct construct IDs", () => {
      const app = new App();
      new TapStack(app, "TestStackConstructIds");

      expect(VpcModule).toHaveBeenCalledWith(
        expect.anything(),
        "vpc",
        expect.anything()
      );

      expect(SecurityGroupsModule).toHaveBeenCalledWith(
        expect.anything(),
        "security-groups",
        expect.anything()
      );

      expect(EC2Module).toHaveBeenCalledWith(
        expect.anything(),
        "ec2",
        expect.anything(),
        expect.anything(),
        expect.anything()
      );

      expect(S3Module).toHaveBeenCalledWith(
        expect.anything(),
        "s3",
        expect.anything()
      );

      expect(RDSModule).toHaveBeenCalledWith(
        expect.anything(),
        "rds",
        expect.anything(),
        expect.anything()
      );

      expect(CloudFrontModule).toHaveBeenCalledWith(
        expect.anything(),
        "cloudfront",
        expect.anything(),
        expect.anything()
      );

      expect(LambdaModule).toHaveBeenCalledWith(
        expect.anything(),
        "lambda",
        expect.anything(),
        expect.anything()
      );

      expect(CloudWatchModule).toHaveBeenCalledWith(
        expect.anything(),
        "cloudwatch",
        expect.anything()
      );

      expect(DynamoDBModule).toHaveBeenCalledWith(
        expect.anything(),
        "dynamodb",
        expect.anything()
      );
    });
  });

  describe("Constants and Configuration", () => {
    test("should use correct hardcoded values", () => {
      const app = new App();
      new TapStack(app, "TestStackConstants");

      // Check VPC CIDR
      expect(VpcModule).toHaveBeenCalledWith(
        expect.anything(),
        "vpc",
        "10.0.0.0/16"
      );

      // Check AMI ID
      expect(EC2Module).toHaveBeenCalledWith(
        expect.anything(),
        "ec2",
        expect.anything(),
        expect.anything(),
        "ami-0bbc328167dee8f3c"
      );

      // Check DynamoDB table name
      expect(DynamoDBModule).toHaveBeenCalledWith(
        expect.anything(),
        "dynamodb",
        "production-dynamodb-table"
      );
    });

    test("should generate correct bucket prefix with environment", () => {
      const app = new App();
      new TapStack(app, "TestStackBucketPrefix", { environmentSuffix: "staging" });

      expect(S3Module).toHaveBeenCalledWith(
        expect.anything(),
        "s3",
        "production-app-123456-staging"
      );
    });
  });
});