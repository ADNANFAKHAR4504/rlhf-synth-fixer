// Mock the modules before importing anything
jest.mock("@pulumi/pulumi", () => {
  const originalModule = jest.requireActual("@pulumi/pulumi");
  
  return {
    ...originalModule,
    ComponentResource: jest.fn().mockImplementation(function(type, name, args, opts) {
      this.type = type;
      this.name = name;
      this.args = args;
      this.opts = opts;
      this.registerOutputs = jest.fn();
    }),
    interpolate: jest.fn((template) => template),
    jsonStringify: jest.fn((obj) => JSON.stringify(obj)),
    asset: {
      AssetArchive: jest.fn().mockImplementation((assets) => ({ assets })),
      StringAsset: jest.fn().mockImplementation((content) => ({ content }))
    }
  };
});

jest.mock("@pulumi/aws", () => ({
  ec2: {
    Vpc: jest.fn().mockImplementation(function(name, args, opts) {
      this.id = `vpc-${Math.random().toString(36).substring(7)}`;
      this.name = name;
      this.args = args;
      this.opts = opts;
    }),
    InternetGateway: jest.fn().mockImplementation(function(name, args, opts) {
      this.id = `igw-${Math.random().toString(36).substring(7)}`;
      this.name = name;
      this.args = args;
      this.opts = opts;
    }),
    Subnet: jest.fn().mockImplementation(function(name, args, opts) {
      this.id = `subnet-${Math.random().toString(36).substring(7)}`;
      this.name = name;
      this.args = args;
      this.opts = opts;
    }),
    RouteTable: jest.fn().mockImplementation(function(name, args, opts) {
      this.id = `rtb-${Math.random().toString(36).substring(7)}`;
      this.name = name;
      this.args = args;
      this.opts = opts;
    }),
    Route: jest.fn().mockImplementation(function(name, args, opts) {
      this.id = `r-${Math.random().toString(36).substring(7)}`;
      this.name = name;
      this.args = args;
      this.opts = opts;
    }),
    RouteTableAssociation: jest.fn().mockImplementation(function(name, args, opts) {
      this.id = `rtbassoc-${Math.random().toString(36).substring(7)}`;
      this.name = name;
      this.args = args;
      this.opts = opts;
    }),
    SecurityGroup: jest.fn().mockImplementation(function(name, args, opts) {
      this.id = `sg-${Math.random().toString(36).substring(7)}`;
      this.name = name;
      this.args = args;
      this.opts = opts;
    })
  },
  s3: {
    Bucket: jest.fn().mockImplementation(function(name, args, opts) {
      this.id = `bucket-${Math.random().toString(36).substring(7)}`;
      this.bucket = name;
      this.arn = `arn:aws:s3:::${name}`;
      this.name = name;
      this.args = args;
      this.opts = opts;
    }),
    BucketObject: jest.fn().mockImplementation(function(name, args, opts) {
      this.id = `object-${Math.random().toString(36).substring(7)}`;
      this.key = args.key || "lambda-function.zip";
      this.name = name;
      this.args = args;
      this.opts = opts;
    })
  },
  iam: {
    Role: jest.fn().mockImplementation(function(name, args, opts) {
      this.id = `role-${Math.random().toString(36).substring(7)}`;
      this.arn = `arn:aws:iam::123456789012:role/${name}`;
      this.name = name;
      this.args = args;
      this.opts = opts;
    }),
    Policy: jest.fn().mockImplementation(function(name, args, opts) {
      this.id = `policy-${Math.random().toString(36).substring(7)}`;
      this.arn = `arn:aws:iam::123456789012:policy/${name}`;
      this.name = name;
      this.args = args;
      this.opts = opts;
    }),
    RolePolicyAttachment: jest.fn().mockImplementation(function(name, args, opts) {
      this.id = `attach-${Math.random().toString(36).substring(7)}`;
      this.name = name;
      this.args = args;
      this.opts = opts;
    })
  },
  rds: {
    SubnetGroup: jest.fn().mockImplementation(function(name, args, opts) {
      this.id = `subgrp-${Math.random().toString(36).substring(7)}`;
      this.name = name;
      this.args = args;
      this.opts = opts;
    }),
    Cluster: jest.fn().mockImplementation(function(name, args, opts) {
      this.id = `cluster-${Math.random().toString(36).substring(7)}`;
      this.endpoint = `${name}.cluster-xxxxx.us-west-2.rds.amazonaws.com`;
      this.port = 3306;
      this.engine = args.engine || "aurora-mysql";
      this.engineVersion = args.engineVersion || "8.0.mysql_aurora.3.04.0";
      this.name = name;
      this.args = args;
      this.opts = opts;
    }),
    ClusterInstance: jest.fn().mockImplementation(function(name, args, opts) {
      this.id = `instance-${Math.random().toString(36).substring(7)}`;
      this.name = name;
      this.args = args;
      this.opts = opts;
    })
  },
  lambda: {
    Function: jest.fn().mockImplementation(function(name, args, opts) {
      this.id = `func-${Math.random().toString(36).substring(7)}`;
      this.name = name;
      this.arn = `arn:aws:lambda:us-west-2:123456789012:function:${name}`;
      this.args = args;
      this.opts = opts;
    })
  },
  cloudwatch: {
    LogGroup: jest.fn().mockImplementation(function(name, args, opts) {
      this.id = `lg-${Math.random().toString(36).substring(7)}`;
      this.name = name;
      this.args = args;
      this.opts = opts;
    })
  },
  getAvailabilityZones: jest.fn(() => Promise.resolve({
    names: ["us-west-2a", "us-west-2b", "us-west-2c"]
  }))
}));

import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";

// Import stacks after mocking
import { TapStack } from "../lib/tap-stack.mjs";
import { VpcStack } from "../lib/vpc-stack.mjs";
import { S3Stack } from "../lib/s3-stack.mjs";
import { IamStack } from "../lib/iam-stack.mjs";
import { RdsStack } from "../lib/rds-stack.mjs";
import { LambdaStack } from "../lib/lambda-stack.mjs";

describe("TapStack Unit Tests", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Main Stack Creation", () => {
    it("should create TapStack with default configuration", () => {
      const stack = new TapStack("test-stack", {});
      
      expect(stack).toBeDefined();
      expect(stack).toBeInstanceOf(TapStack);
      expect(pulumi.ComponentResource).toHaveBeenCalledWith(
        'tap:stack:TapStack',
        'test-stack',
        {},
        undefined
      );
    });

    it("should create TapStack with custom environment suffix", () => {
      const stack = new TapStack("test-stack", {
        environmentSuffix: "prod"
      });
      
      expect(stack).toBeDefined();
      expect(stack.bucketName).toBeDefined();
      expect(stack.rdsEndpoint).toBeDefined();
      expect(stack.lambdaFunctionName).toBeDefined();
    });

    it("should register outputs correctly", () => {
      const stack = new TapStack("test-stack", {
        environmentSuffix: "test"
      });
      
      expect(stack.registerOutputs).toHaveBeenCalledWith(
        expect.objectContaining({
          bucketName: expect.anything(),
          rdsEndpoint: expect.anything(),
          lambdaFunctionName: expect.anything(),
          vpcId: expect.anything()
        })
      );
    });
  });

  describe("VPC Stack", () => {
    it("should create VPC with correct CIDR block", () => {
      const stack = new VpcStack("test-vpc", {
        environmentSuffix: "test"
      });
      
      expect(aws.ec2.Vpc).toHaveBeenCalledWith(
        "tap-vpc-test",
        expect.objectContaining({
          cidrBlock: "10.0.0.0/16",
          enableDnsHostnames: true,
          enableDnsSupport: true
        }),
        expect.anything()
      );
    });

    it("should create Internet Gateway", () => {
      const stack = new VpcStack("test-vpc", {
        environmentSuffix: "test"
      });
      
      expect(aws.ec2.InternetGateway).toHaveBeenCalledWith(
        "tap-igw-test",
        expect.objectContaining({
          vpcId: expect.anything()
        }),
        expect.anything()
      );
    });

    it("should create 2 public and 2 private subnets", () => {
      const stack = new VpcStack("test-vpc", {
        environmentSuffix: "test"
      });
      
      // Check that 4 subnets were created (2 public + 2 private)
      expect(aws.ec2.Subnet).toHaveBeenCalledTimes(4);
      
      // Check public subnets
      expect(aws.ec2.Subnet).toHaveBeenCalledWith(
        expect.stringContaining("tap-public-subnet"),
        expect.objectContaining({
          mapPublicIpOnLaunch: true
        }),
        expect.anything()
      );
      
      // Check private subnets
      const privateSubnetCall = jest.mocked(aws.ec2.Subnet).mock.calls.find(
        call => call[0].includes("tap-private-subnet")
      );
      expect(privateSubnetCall).toBeDefined();
      expect(privateSubnetCall[1].mapPublicIpOnLaunch).toBeUndefined();
    });

    it("should create route table and associations", () => {
      const stack = new VpcStack("test-vpc", {
        environmentSuffix: "test"
      });
      
      expect(aws.ec2.RouteTable).toHaveBeenCalled();
      expect(aws.ec2.Route).toHaveBeenCalledWith(
        expect.stringContaining("tap-public-route"),
        expect.objectContaining({
          destinationCidrBlock: "0.0.0.0/0"
        }),
        expect.anything()
      );
      expect(aws.ec2.RouteTableAssociation).toHaveBeenCalledTimes(2); // For 2 public subnets
    });
  });

  describe("S3 Stack", () => {
    it("should create S3 bucket with versioning enabled", () => {
      const stack = new S3Stack("test-s3", {
        environmentSuffix: "test"
      });
      
      expect(aws.s3.Bucket).toHaveBeenCalledWith(
        "tap-app-bucket-test",
        expect.objectContaining({
          versioning: {
            enabled: true
          }
        }),
        expect.anything()
      );
    });

    it("should upload Lambda code to S3", () => {
      const stack = new S3Stack("test-s3", {
        environmentSuffix: "test"
      });
      
      expect(aws.s3.BucketObject).toHaveBeenCalledWith(
        "lambda-code-test",
        expect.objectContaining({
          key: "lambda-function.zip"
        }),
        expect.anything()
      );
    });

    it("should export bucket name and code key", () => {
      const stack = new S3Stack("test-s3", {
        environmentSuffix: "test"
      });
      
      expect(stack.bucketName).toBeDefined();
      expect(stack.codeKey).toBeDefined();
      expect(stack.registerOutputs).toHaveBeenCalledWith(
        expect.objectContaining({
          bucketName: expect.anything(),
          bucketArn: expect.anything(),
          codeKey: expect.anything()
        })
      );
    });
  });

  describe("IAM Stack", () => {
    it("should create Lambda execution role", () => {
      const stack = new IamStack("test-iam", {
        environmentSuffix: "test"
      });
      
      expect(aws.iam.Role).toHaveBeenCalledWith(
        "tap-lambda-role-test",
        expect.objectContaining({
          assumeRolePolicy: expect.stringContaining("lambda.amazonaws.com")
        }),
        expect.anything()
      );
    });

    it("should attach basic and VPC execution policies", () => {
      const stack = new IamStack("test-iam", {
        environmentSuffix: "test"
      });
      
      // Check basic execution policy attachment
      expect(aws.iam.RolePolicyAttachment).toHaveBeenCalledWith(
        "tap-lambda-basic-test",
        expect.objectContaining({
          policyArn: "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
        }),
        expect.anything()
      );
      
      // Check VPC execution policy attachment
      expect(aws.iam.RolePolicyAttachment).toHaveBeenCalledWith(
        "tap-lambda-vpc-test",
        expect.objectContaining({
          policyArn: "arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole"
        }),
        expect.anything()
      );
    });

    it("should create custom policy for S3 and RDS access", () => {
      const stack = new IamStack("test-iam", {
        environmentSuffix: "test"
      });
      
      expect(aws.iam.Policy).toHaveBeenCalledWith(
        "tap-lambda-policy-test",
        expect.objectContaining({
          description: "Custom policy for Lambda to access RDS and S3",
          policy: expect.stringContaining("s3:GetObject")
        }),
        expect.anything()
      );
    });
  });

  describe("RDS Stack", () => {
    it("should create Aurora Serverless v2 cluster", () => {
      const stack = new RdsStack("test-rds", {
        environmentSuffix: "test",
        vpcId: "vpc-test",
        privateSubnetIds: ["subnet-1", "subnet-2"]
      });
      
      expect(aws.rds.Cluster).toHaveBeenCalledWith(
        "tap-aurora-cluster-test",
        expect.objectContaining({
          engine: "aurora-mysql",
          engineMode: "provisioned",
          engineVersion: "8.0.mysql_aurora.3.04.0",
          backupRetentionPeriod: 7,
          serverlessv2ScalingConfiguration: {
            minCapacity: 0.5,
            maxCapacity: 2
          }
        }),
        expect.anything()
      );
    });

    it("should create DB subnet group", () => {
      const stack = new RdsStack("test-rds", {
        environmentSuffix: "test",
        vpcId: "vpc-test",
        privateSubnetIds: ["subnet-1", "subnet-2"]
      });
      
      expect(aws.rds.SubnetGroup).toHaveBeenCalledWith(
        "tap-db-subnet-group-test",
        expect.objectContaining({
          subnetIds: ["subnet-1", "subnet-2"]
        }),
        expect.anything()
      );
    });

    it("should create RDS security group", () => {
      const stack = new RdsStack("test-rds", {
        environmentSuffix: "test",
        vpcId: "vpc-test",
        privateSubnetIds: ["subnet-1", "subnet-2"]
      });
      
      expect(aws.ec2.SecurityGroup).toHaveBeenCalledWith(
        "tap-db-sg-test",
        expect.objectContaining({
          vpcId: "vpc-test",
          ingress: expect.arrayContaining([
            expect.objectContaining({
              fromPort: 3306,
              toPort: 3306,
              protocol: "tcp"
            })
          ])
        }),
        expect.anything()
      );
    });

    it("should create Aurora Serverless v2 instance", () => {
      const stack = new RdsStack("test-rds", {
        environmentSuffix: "test",
        vpcId: "vpc-test",
        privateSubnetIds: ["subnet-1", "subnet-2"]
      });
      
      expect(aws.rds.ClusterInstance).toHaveBeenCalledWith(
        "tap-aurora-instance-test",
        expect.objectContaining({
          instanceClass: "db.serverless"
        }),
        expect.anything()
      );
    });
  });

  describe("Lambda Stack", () => {
    it("should create Lambda function with correct configuration", () => {
      const stack = new LambdaStack("test-lambda", {
        environmentSuffix: "test",
        bucketName: "test-bucket",
        lambdaRole: { arn: "arn:aws:iam::123456789012:role/test-role" },
        rdsEndpoint: "test-cluster.amazonaws.com",
        vpcId: "vpc-test",
        privateSubnetIds: ["subnet-1", "subnet-2"]
      });
      
      expect(aws.lambda.Function).toHaveBeenCalledWith(
        "tap-lambda-test",
        expect.objectContaining({
          handler: "index.handler",
          runtime: "nodejs18.x",
          s3Bucket: "test-bucket",
          s3Key: "lambda-function.zip",
          timeout: 30,
          memorySize: 256,
          vpcConfig: {
            subnetIds: ["subnet-1", "subnet-2"],
            securityGroupIds: expect.arrayContaining([expect.anything()])
          },
          environment: {
            variables: {
              RDS_ENDPOINT: "test-cluster.amazonaws.com",
              ENVIRONMENT: "test"
            }
          }
        }),
        expect.anything()
      );
    });

    it("should create Lambda security group", () => {
      const stack = new LambdaStack("test-lambda", {
        environmentSuffix: "test",
        bucketName: "test-bucket",
        lambdaRole: { arn: "arn:aws:iam::123456789012:role/test-role" },
        rdsEndpoint: "test-cluster.amazonaws.com",
        vpcId: "vpc-test",
        privateSubnetIds: ["subnet-1", "subnet-2"]
      });
      
      expect(aws.ec2.SecurityGroup).toHaveBeenCalledWith(
        "tap-lambda-sg-test",
        expect.objectContaining({
          vpcId: "vpc-test",
          description: "Security group for Lambda function"
        }),
        expect.anything()
      );
    });

    it("should create CloudWatch Log Group", () => {
      const stack = new LambdaStack("test-lambda", {
        environmentSuffix: "test",
        bucketName: "test-bucket",
        lambdaRole: { arn: "arn:aws:iam::123456789012:role/test-role" },
        rdsEndpoint: "test-cluster.amazonaws.com",
        vpcId: "vpc-test",
        privateSubnetIds: ["subnet-1", "subnet-2"]
      });
      
      expect(aws.cloudwatch.LogGroup).toHaveBeenCalledWith(
        "tap-lambda-logs-test",
        expect.objectContaining({
          retentionInDays: 7
        }),
        expect.anything()
      );
    });
  });

  describe("Component Integration", () => {
    it("should pass VPC configuration to RDS and Lambda stacks", () => {
      const mainStack = new TapStack("integration-test", {
        environmentSuffix: "test"
      });
      
      // Verify VPC was created first
      expect(aws.ec2.Vpc).toHaveBeenCalled();
      
      // Verify RDS received VPC configuration
      expect(aws.rds.Cluster).toHaveBeenCalled();
      expect(aws.ec2.SecurityGroup).toHaveBeenCalledWith(
        expect.stringContaining("tap-db-sg"),
        expect.anything(),
        expect.anything()
      );
      
      // Verify Lambda received VPC configuration
      expect(aws.lambda.Function).toHaveBeenCalledWith(
        expect.stringContaining("tap-lambda"),
        expect.objectContaining({
          vpcConfig: expect.anything()
        }),
        expect.anything()
      );
    });

    it("should pass S3 bucket name to Lambda stack", () => {
      const mainStack = new TapStack("integration-test", {
        environmentSuffix: "test"
      });
      
      // Verify S3 bucket was created
      expect(aws.s3.Bucket).toHaveBeenCalled();
      
      // Verify Lambda received bucket name
      expect(aws.lambda.Function).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          s3Bucket: expect.anything(),
          s3Key: "lambda-function.zip"
        }),
        expect.anything()
      );
    });

    it("should pass IAM role to Lambda stack", () => {
      const mainStack = new TapStack("integration-test", {
        environmentSuffix: "test"
      });
      
      // Verify IAM role was created
      expect(aws.iam.Role).toHaveBeenCalled();
      
      // Verify Lambda received role ARN
      expect(aws.lambda.Function).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          role: expect.stringContaining("arn:aws:iam")
        }),
        expect.anything()
      );
    });

    it("should pass RDS endpoint to Lambda environment variables", () => {
      const mainStack = new TapStack("integration-test", {
        environmentSuffix: "test"
      });
      
      // Verify RDS cluster was created
      expect(aws.rds.Cluster).toHaveBeenCalled();
      
      // Verify Lambda received RDS endpoint
      expect(aws.lambda.Function).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          environment: {
            variables: expect.objectContaining({
              RDS_ENDPOINT: expect.stringContaining("cluster")
            })
          }
        }),
        expect.anything()
      );
    });
  });

  describe("Error Handling", () => {
    it("should handle undefined args gracefully", () => {
      expect(() => {
        new TapStack("test-stack");
      }).not.toThrow();
    });

    it("should use default environment suffix when not provided", () => {
      const stack = new TapStack("test-stack", {});
      
      // Verify default 'dev' suffix is used
      expect(aws.s3.Bucket).toHaveBeenCalledWith(
        expect.stringContaining("-dev"),
        expect.anything(),
        expect.anything()
      );
    });

    it("should handle empty tags object", () => {
      const stack = new TapStack("test-stack", {
        tags: {}
      });
      
      expect(stack).toBeDefined();
      expect(stack.registerOutputs).toHaveBeenCalled();
    });
  });

  describe("Resource Tagging", () => {
    it("should apply custom tags to all resources", () => {
      const customTags = {
        Project: "TestProject",
        Environment: "Testing",
        Owner: "TestTeam"
      };
      
      const stack = new TapStack("test-stack", {
        environmentSuffix: "test",
        tags: customTags
      });
      
      // Check VPC has tags
      expect(aws.ec2.Vpc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          tags: expect.objectContaining(customTags)
        }),
        expect.anything()
      );
      
      // Check S3 bucket has tags
      expect(aws.s3.Bucket).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          tags: expect.objectContaining(customTags)
        }),
        expect.anything()
      );
      
      // Check Lambda has tags
      expect(aws.lambda.Function).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          tags: expect.objectContaining(customTags)
        }),
        expect.anything()
      );
    });
  });
});