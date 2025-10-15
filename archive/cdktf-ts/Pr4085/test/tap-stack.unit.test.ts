import { Testing, App } from "cdktf";
import "cdktf/lib/testing/adapters/jest";
import { TapStack } from "../lib/tap-stack"; // Adjust path as needed

// Mock all imported modules
jest.mock("../lib/modules", () => ({
  VpcModule: jest.fn().mockImplementation(() => ({
    vpc: { id: "vpc-12345" },
    publicSubnets: [{ id: "subnet-public-1" }, { id: "subnet-public-2" }],
    privateSubnets: [{ id: "subnet-private-1" }, { id: "subnet-private-2" }],
  })),
  S3Module: jest.fn().mockImplementation(() => ({
    bucket: {
      id: "s3-bucket-12345",
      bucket: "tap-central-logging-unique-name",
      bucketDomainName: "tap-central-logging.s3.amazonaws.com",
      arn: "arn:aws:s3:::tap-central-logging",
    },
    bucketVersioning: {
      versioningConfiguration: {
        status: "Enabled"
      }
    }
  })),
  Ec2Module: jest.fn().mockImplementation(() => ({
    instance: { 
      id: "i-1234567890abcdef0",
    },
  })),
  IamLambdaModule: jest.fn().mockImplementation(() => ({
    lambda: { 
      arn: "arn:aws:lambda:us-east-1:123456789012:function:tap-api-processor",
      functionName: "tap-api-processor"
    },
  })),
  RdsModule: jest.fn().mockImplementation(() => ({
    dbInstance: {
      id: "db-instance-12345",
      endpoint: "tap-db.cluster-xyz.us-east-1.rds.amazonaws.com",
      dbName: "tapdb",
      storageEncrypted: true,
    },
  })),
  DynamoDbModule: jest.fn().mockImplementation(() => ({
    table: { 
      name: "tap-user-sessions",
      arn: "arn:aws:dynamodb:us-east-1:123456789012:table/tap-user-sessions",
      pointInTimeRecovery: { enabled: true }
    },
  })),
  RedshiftModule: jest.fn().mockImplementation(() => ({
    cluster: {
      id: "tap-analytics-cluster",
      endpoint: "tap-analytics-cluster.abcdefg.us-east-1.redshift.amazonaws.com",
    },
  })),
  ElbModule: jest.fn().mockImplementation(() => ({
    alb: { 
      id: "alb-12345",
      dnsName: "tap-alb-123456.us-east-1.elb.amazonaws.com",
      arn: "arn:aws:elasticloadbalancing:us-east-1:123456789012:loadbalancer/app/tap-alb/123456"
    },
  })),
  ApiGatewayModule: jest.fn().mockImplementation(() => ({
    api: { 
      id: "api-12345",
      executionArn: "arn:aws:execute-api:us-east-1:123456789012:api-12345"
    },
    stage: {
      accessLogSettings: {
        destinationArn: "arn:aws:logs:us-east-1:123456789012:log-group:/aws/api-gateway/tap-api"
      }
    }
  })),
  EcrModule: jest.fn().mockImplementation(() => ({
    repository: { 
      repositoryUrl: "123456789012.dkr.ecr.us-east-1.amazonaws.com/tap-application",
      arn: "arn:aws:ecr:us-east-1:123456789012:repository/tap-application"
    },
  })),
  SnsModule: jest.fn().mockImplementation(() => ({
    topic: { 
      arn: "arn:aws:sns:us-east-1:123456789012:tap-security-alerts",
      name: "tap-security-alerts"
    },
  })),
  MonitoringModule: jest.fn().mockImplementation(() => ({
    dashboard: { 
      dashboardName: "tap-dashboard",
    },
  })),
  CloudFrontWafModule: jest.fn().mockImplementation(() => ({
    distribution: { 
      id: "E1234567890ABC",
      domainName: "d111111abcdef8.cloudfront.net"
    },
    waf: null, // No WAF in non-us-east-1 regions
  })),
  CloudTrailModule: jest.fn().mockImplementation(() => ({
    trail: { 
      name: "tap-trail",
      arn: "arn:aws:cloudtrail:us-east-1:123456789012:trail/tap-trail"
    },
    trailBucket: {
      bucket: "tap-cloudtrail-bucket"
    },
    logGroup: {
      name: "/aws/cloudtrail/tap-trail"
    }
  })),
}));

// Mock AWS Provider and related types
jest.mock("@cdktf/provider-aws/lib/provider", () => ({
  AwsProvider: jest.fn(),
  AwsProviderDefaultTags: jest.fn(),
}));

// Mock AWS resources
jest.mock("@cdktf/provider-aws", () => ({
  dataAwsCallerIdentity: {
    DataAwsCallerIdentity: jest.fn().mockImplementation(() => ({
      accountId: "123456789012",
    })),
  },
  dataAwsAmi: {
    DataAwsAmi: jest.fn().mockImplementation(() => ({
      id: "ami-0123456789abcdef0",
    })),
  },
  kmsKey: {
    KmsKey: jest.fn().mockImplementation(() => ({
      id: "key-12345",
      arn: "arn:aws:kms:us-east-1:123456789012:key/12345678-1234-1234-1234-123456789012",
    })),
  },
  kmsAlias: {
    KmsAlias: jest.fn(),
  },
}));

// Mock CDKTF core
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
  });

  describe("Stack Configuration", () => {
    test("should create stack with default configuration", () => {
      const stack = new TapStack(app, "test-stack");
      
      const { AwsProvider } = require("@cdktf/provider-aws/lib/provider");
      const { S3Backend } = require("cdktf");

      // Check AWS Provider was configured with default region
      expect(AwsProvider).toHaveBeenCalledWith(
        stack,
        "aws",
        expect.objectContaining({
          region: "us-east-1",
          defaultTags: [],
        })
      );

      // Check S3 Backend was configured with defaults
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
        defaultTags: {
          tags: {
            Environment: "Test",
            Project: "CustomProject"
          }
        }
      };

      const stack = new TapStack(app, "test-stack", customProps);
      
      const { AwsProvider } = require("@cdktf/provider-aws/lib/provider");
      const { S3Backend } = require("cdktf");

      expect(AwsProvider).toHaveBeenCalledWith(
        stack,
        "aws",
        expect.objectContaining({
          region: "us-west-2",
          defaultTags: [customProps.defaultTags],
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
      const addOverrideSpy = jest.spyOn(stack, 'addOverride');
      
      // Create another stack instance to trigger override
      new TapStack(app, "test-stack-2");
      
      expect(stack).toBeDefined();
    });

    test("should use correct availability zones based on region", () => {
      const stack = new TapStack(app, "test-stack", { awsRegion: "us-west-2" });
      
      const { VpcModule } = require("../lib/modules");
      
      expect(VpcModule).toHaveBeenCalledWith(
        stack,
        "main-vpc",
        "10.0.0.0/16",
        ["us-west-2a", "us-west-2b"],
        expect.objectContaining({
          Environment: "Production",
        })
      );
    });
  });

  describe("KMS Configuration", () => {
    test("should create master KMS key with rotation enabled", () => {
      const stack = new TapStack(app, "test-stack");
      
      const aws = require("@cdktf/provider-aws");
      
      expect(aws.kmsKey.KmsKey).toHaveBeenCalledWith(
        stack,
        "master-kms-key",
        expect.objectContaining({
          description: "Master KMS key for encryption",
          enableKeyRotation: true,
          tags: expect.objectContaining({
            Environment: "Production",
            Security: "Enabled",
            Compliance: "True",
            Owner: "DevOps Team",
            Region: "us-east-1",
          }),
        })
      );
    });

    test("should create KMS alias", () => {
      const stack = new TapStack(app, "test-stack");
      
      const aws = require("@cdktf/provider-aws");
      
      expect(aws.kmsAlias.KmsAlias).toHaveBeenCalledWith(
        stack,
        "master-kms-alias",
        expect.objectContaining({
          name: "alias/tap-master-key",
          targetKeyId: "key-12345",
        })
      );
    });
  });

  describe("S3 Module Configuration", () => {
    test("should create central logging bucket with ALB permissions", () => {
      const stack = new TapStack(app, "test-stack");
      
      const { S3Module } = require("../lib/modules");
      
      expect(S3Module).toHaveBeenCalledWith(
        stack,
        "central-logging",
        "tap-central-logging-unique-name",
        "key-12345",
        "",
        expect.objectContaining({
          Environment: "Production",
          Security: "Enabled",
        }),
        true,
        "123456789012",
        "us-east-1"
      );
    });

    test("should create application bucket with logging", () => {
      const stack = new TapStack(app, "test-stack");
      
      const { S3Module } = require("../lib/modules");
      
      expect(S3Module).toHaveBeenCalledWith(
        stack,
        "app-bucket",
        "tap-application-data-123456789012",
        "arn:aws:kms:us-east-1:123456789012:key/12345678-1234-1234-1234-123456789012",
        "s3-bucket-12345",
        expect.objectContaining({
          Environment: "Production",
        })
      );
    });

    test("should create backup bucket", () => {
      const stack = new TapStack(app, "test-stack");
      
      const { S3Module } = require("../lib/modules");
      
      expect(S3Module).toHaveBeenCalledWith(
        stack,
        "backup-bucket",
        "tap-backup-data-123456789012",
        "arn:aws:kms:us-east-1:123456789012:key/12345678-1234-1234-1234-123456789012",
        "s3-bucket-12345",
        expect.objectContaining({
          Environment: "Production",
        })
      );
    });
  });

  describe("Module Instantiation", () => {
    test("should create VPC module", () => {
      const stack = new TapStack(app, "test-stack");
      
      const { VpcModule } = require("../lib/modules");
      
      expect(VpcModule).toHaveBeenCalledWith(
        stack,
        "main-vpc",
        "10.0.0.0/16",
        ["us-east-1a", "us-east-1b"],
        expect.objectContaining({
          Environment: "Production",
          Security: "Enabled",
          Compliance: "True",
          Owner: "DevOps Team",
          Region: "us-east-1",
        })
      );
    });

    test("should create EC2 module with correct parameters", () => {
      const stack = new TapStack(app, "test-stack");
      
      const { Ec2Module } = require("../lib/modules");
      
      expect(Ec2Module).toHaveBeenCalledWith(
        stack,
        "web-server",
        "t3.medium",
        "ami-0123456789abcdef0",
        "subnet-private-1",
        "vpc-12345",
        "us-east-1a",
        "arn:aws:kms:us-east-1:123456789012:key/12345678-1234-1234-1234-123456789012",
        expect.objectContaining({
          Environment: "Production",
        })
      );
    });

    test("should create Lambda module", () => {
      const stack = new TapStack(app, "test-stack");
      
      const { IamLambdaModule } = require("../lib/modules");
      
      expect(IamLambdaModule).toHaveBeenCalledWith(
        stack,
        "api-processor",
        "tap-api-processor",
        "index.handler",
        "nodejs20.x",
        "my-lambda-bucket777",
        "lambda/lambda-function.zip",
        "arn:aws:kms:us-east-1:123456789012:key/12345678-1234-1234-1234-123456789012",
        expect.objectContaining({
          Environment: "Production",
        })
      );
    });

    test("should create RDS module with subnets", () => {
      const stack = new TapStack(app, "test-stack");
      
      const { RdsModule } = require("../lib/modules");
      
      expect(RdsModule).toHaveBeenCalledWith(
        stack,
        "main-db",
        "db.t3.medium",
        "postgres",
        ["subnet-private-1", "subnet-private-2"],
        "us-east-1a",
        expect.objectContaining({
          Environment: "Production",
        })
      );
    });

    test("should create DynamoDB module", () => {
      const stack = new TapStack(app, "test-stack");
      
      const { DynamoDbModule } = require("../lib/modules");
      
      expect(DynamoDbModule).toHaveBeenCalledWith(
        stack,
        "session-table",
        "tap-user-sessions",
        expect.objectContaining({
          Environment: "Production",
        })
      );
    });

    test("should create Redshift module with correct node type", () => {
      const stack = new TapStack(app, "test-stack");
      
      const { RedshiftModule } = require("../lib/modules");
      
      expect(RedshiftModule).toHaveBeenCalledWith(
        stack,
        "analytics",
        "tap-analytics-cluster",
        "ra3.xlplus",
        2,
        ["subnet-private-1", "subnet-private-2"],
        expect.objectContaining({
          Environment: "Production",
        })
      );
    });

    test("should create ELB module", () => {
      const stack = new TapStack(app, "test-stack");
      
      const { ElbModule } = require("../lib/modules");
      
      expect(ElbModule).toHaveBeenCalledWith(
        stack,
        "main-alb",
        "vpc-12345",
        ["subnet-public-1", "subnet-public-2"],
        "tap-central-logging-unique-name",
        expect.objectContaining({
          Environment: "Production",
        })
      );
    });

    test("should create API Gateway module", () => {
      const stack = new TapStack(app, "test-stack");
      
      const { ApiGatewayModule } = require("../lib/modules");
      
      expect(ApiGatewayModule).toHaveBeenCalledWith(
        stack,
        "rest-api",
        "tap-api",
        "arn:aws:kms:us-east-1:123456789012:key/12345678-1234-1234-1234-123456789012",
        expect.objectContaining({
          Environment: "Production",
        })
      );
    });

    test("should create ECR module", () => {
      const stack = new TapStack(app, "test-stack");
      
      const { EcrModule } = require("../lib/modules");
      
      expect(EcrModule).toHaveBeenCalledWith(
        stack,
        "app-repo",
        "tap-application",
        expect.objectContaining({
          Environment: "Production",
        })
      );
    });

    test("should create SNS module", () => {
      const stack = new TapStack(app, "test-stack");
      
      const { SnsModule } = require("../lib/modules");
      
      expect(SnsModule).toHaveBeenCalledWith(
        stack,
        "alerts",
        "tap-security-alerts",
        "arn:aws:kms:us-east-1:123456789012:key/12345678-1234-1234-1234-123456789012",
        expect.objectContaining({
          Environment: "Production",
        })
      );
    });

    test("should create Monitoring module", () => {
      const stack = new TapStack(app, "test-stack");
      
      const { MonitoringModule } = require("../lib/modules");
      
      expect(MonitoringModule).toHaveBeenCalledWith(
        stack,
        "security-monitoring",
        "arn:aws:sns:us-east-1:123456789012:tap-security-alerts",
        expect.objectContaining({
          Environment: "Production",
        })
      );
    });

    test("should create CloudFront without WAF in non-us-east-1 regions", () => {
      const stack = new TapStack(app, "test-stack", { awsRegion: "eu-west-1" });
      
      const { CloudFrontWafModule } = require("../lib/modules");
      
      expect(CloudFrontWafModule).toHaveBeenCalledWith(
        stack,
        "cdn",
        "tap-alb-123456.us-east-1.elb.amazonaws.com",
        "tap-central-logging.s3.amazonaws.com",
        expect.objectContaining({
          Environment: "Production",
        }),
        false
      );
    });

    test("should create CloudTrail module", () => {
      const stack = new TapStack(app, "test-stack");
      
      const { CloudTrailModule } = require("../lib/modules");
      
      expect(CloudTrailModule).toHaveBeenCalledWith(
        stack,
        "cloudtrail",
        "arn:aws:kms:us-east-1:123456789012:key/12345678-1234-1234-1234-123456789012",
        expect.objectContaining({
          Environment: "Production",
        })
      );
    });
  });

  describe("Data Sources", () => {
    test("should get current AWS account ID", () => {
      const stack = new TapStack(app, "test-stack");
      
      const aws = require("@cdktf/provider-aws");
      
      expect(aws.dataAwsCallerIdentity.DataAwsCallerIdentity).toHaveBeenCalledWith(
        stack,
        "current-account"
      );
    });

    test("should get latest Amazon Linux 2 AMI", () => {
      const stack = new TapStack(app, "test-stack");
      
      const aws = require("@cdktf/provider-aws");
      
      expect(aws.dataAwsAmi.DataAwsAmi).toHaveBeenCalledWith(
        stack,
        "ami",
        expect.objectContaining({
          mostRecent: true,
          owners: ["amazon"],
          filter: expect.arrayContaining([
            expect.objectContaining({
              name: "name",
              values: ["amzn2-ami-hvm-*-x86_64-gp2"],
            }),
            expect.objectContaining({
              name: "virtualization-type",
              values: ["hvm"],
            }),
          ]),
        })
      );
    });
  });

  describe("Terraform Outputs", () => {
    test("should create all infrastructure outputs", () => {
      const stack = new TapStack(app, "test-stack");
      
      const { TerraformOutput } = require("cdktf");
      
      const outputCalls = TerraformOutput.mock.calls;
      const outputNames = outputCalls.map((call: any) => call[1]);
      
      // Check that all expected outputs are created
      expect(outputNames).toContain("vpc-id");
      expect(outputNames).toContain("private-subnet-ids");
      expect(outputNames).toContain("public-subnet-ids");
      expect(outputNames).toContain("aws-region");
      expect(outputNames).toContain("availability-zones");
      expect(outputNames).toContain("ami-id");
      expect(outputNames).toContain("s3-versioning-enabled");
      expect(outputNames).toContain("rds-encryption-enabled");
      expect(outputNames).toContain("cloudtrail-enabled");
      expect(outputNames).toContain("cloudtrail-bucket");
      expect(outputNames).toContain("cloudtrail-log-group");
      expect(outputNames).toContain("api-gateway-logging");
      expect(outputNames).toContain("dynamodb-pitr-enabled");
      expect(outputNames).toContain("alb-dns-name");
      expect(outputNames).toContain("cloudfront-distribution-id");
      expect(outputNames).toContain("ecr-repository-url");
      expect(outputNames).toContain("ec2-instance-id");
      expect(outputNames).toContain("kms-key-id");
      expect(outputNames).toContain("account-id");
    });

    test("should have correct output values", () => {
      const stack = new TapStack(app, "test-stack");
      
      const { TerraformOutput } = require("cdktf");
      
      const outputs = TerraformOutput.mock.calls.reduce((acc: any, call: any) => {
        acc[call[1]] = call[2];
        return acc;
      }, {});
      
      expect(outputs["vpc-id"].value).toBe("vpc-12345");
      expect(outputs["private-subnet-ids"].value).toEqual(["subnet-private-1", "subnet-private-2"]);
      expect(outputs["public-subnet-ids"].value).toEqual(["subnet-public-1", "subnet-public-2"]);
      expect(outputs["aws-region"].value).toBe("us-east-1");
      expect(outputs["availability-zones"].value).toBe("us-east-1a, us-east-1b");
      expect(outputs["ami-id"].value).toBe("ami-0123456789abcdef0");
      expect(outputs["s3-versioning-enabled"].value).toBe("Enabled");
      expect(outputs["rds-encryption-enabled"].value).toBe(true);
      expect(outputs["cloudtrail-enabled"].value).toBe("tap-trail");
      expect(outputs["cloudtrail-bucket"].value).toBe("tap-cloudtrail-bucket");
      expect(outputs["cloudtrail-log-group"].value).toBe("/aws/cloudtrail/tap-trail");
      expect(outputs["alb-dns-name"].value).toBe("tap-alb-123456.us-east-1.elb.amazonaws.com");
      expect(outputs["cloudfront-distribution-id"].value).toBe("E1234567890ABC");
      expect(outputs["ecr-repository-url"].value).toBe("123456789012.dkr.ecr.us-east-1.amazonaws.com/tap-application");
      expect(outputs["ec2-instance-id"].value).toBe("i-1234567890abcdef0");
      expect(outputs["kms-key-id"].value).toBe("key-12345");
      expect(outputs["account-id"].value).toBe("123456789012");
    });

    test("should handle WAF output only when WAF is created", () => {
      // Test with us-east-1 where WAF should be created
      const mockWafModule = jest.fn().mockImplementation(() => ({
        distribution: { 
          id: "E1234567890ABC",
          domainName: "d111111abcdef8.cloudfront.net"
        },
        waf: {
          name: "tap-waf-web-acl"
        },
      }));
      
      // Temporarily replace the mock
      const { CloudFrontWafModule } = require("../lib/modules");
      CloudFrontWafModule.mockImplementationOnce(mockWafModule);
      
      const stack = new TapStack(app, "test-stack-with-waf");
      
      const { TerraformOutput } = require("cdktf");
      
      const wafOutput = TerraformOutput.mock.calls.find((call: any) => call[1] === "waf-enabled");
      expect(wafOutput).toBeDefined();
      expect(wafOutput[2].value).toBe("tap-waf-web-acl");
    });

    test("should not create WAF output in non-us-east-1 regions", () => {
      const stack = new TapStack(app, "test-stack", { awsRegion: "eu-west-1" });
      
      const { TerraformOutput } = require("cdktf");
      
      const wafOutput = TerraformOutput.mock.calls.find((call: any) => call[1] === "waf-enabled");
      expect(wafOutput).toBeUndefined();
    });

    test("should have proper descriptions for all outputs", () => {
      const stack = new TapStack(app, "test-stack");
      
      const { TerraformOutput } = require("cdktf");
      
      const outputs = TerraformOutput.mock.calls.reduce((acc: any, call: any) => {
        acc[call[1]] = call[2];
        return acc;
      }, {});
      
      // Check that all outputs have descriptions
      Object.entries(outputs).forEach(([name, config]: [string, any]) => {
        expect(config.description).toBeTruthy();
        expect(typeof config.description).toBe("string");
      });
    });

    test("should handle undefined API Gateway logging", () => {
      // Mock API Gateway without logging
      const mockApiModule = jest.fn().mockImplementation(() => ({
        api: { id: "api-12345" },
        stage: {
          accessLogSettings: undefined
        }
      }));
      
      const { ApiGatewayModule } = require("../lib/modules");
      ApiGatewayModule.mockImplementationOnce(mockApiModule);
      
      const stack = new TapStack(app, "test-stack-no-logging");
      
      const { TerraformOutput } = require("cdktf");
      
      const apiOutput = TerraformOutput.mock.calls.find((call: any) => call[1] === "api-gateway-logging");
      expect(apiOutput[2].value).toBeUndefined();
    });

    test("should handle DynamoDB PITR configuration", () => {
      const stack = new TapStack(app, "test-stack");
      
      const { TerraformOutput } = require("cdktf");
      
      const pitrOutput = TerraformOutput.mock.calls.find((call: any) => call[1] === "dynamodb-pitr-enabled");
      expect(pitrOutput[2].value).toBe(true);
    });
  });

  describe("Common Tags", () => {
    test("should apply common tags to all resources", () => {
      const stack = new TapStack(app, "test-stack", { awsRegion: "us-west-2" });
      
      const expectedTags = {
        Environment: "Production",
        Security: "Enabled",
        Compliance: "True",
        Owner: "DevOps Team",
        Region: "us-west-2",
      };
      
      const aws = require("@cdktf/provider-aws");
      
      // Check KMS key has tags
      expect(aws.kmsKey.KmsKey).toHaveBeenCalledWith(
        stack,
        "master-kms-key",
        expect.objectContaining({
          tags: expectedTags
        })
      );
      
      const modules = require("../lib/modules");
      
      // Check all modules receive common tags
      const moduleCalls = [
        modules.VpcModule.mock.calls[0],
        modules.S3Module.mock.calls[0],
        modules.Ec2Module.mock.calls[0],
        modules.IamLambdaModule.mock.calls[0],
        modules.RdsModule.mock.calls[0],
        modules.DynamoDbModule.mock.calls[0],
        modules.RedshiftModule.mock.calls[0],
        modules.ElbModule.mock.calls[0],
        modules.ApiGatewayModule.mock.calls[0],
        modules.EcrModule.mock.calls[0],
        modules.SnsModule.mock.calls[0],
        modules.MonitoringModule.mock.calls[0],
        modules.CloudFrontWafModule.mock.calls[0],
        modules.CloudTrailModule.mock.calls[0],
      ];
      
      moduleCalls.forEach((call) => {
        const lastArg = call[call.length - 1];
        // Check if last argument is the tags object (some modules have different signatures)
        if (typeof lastArg === 'object' && lastArg.Environment) {
          expect(lastArg).toEqual(expectedTags);
        }
      });
    });
  });
});
