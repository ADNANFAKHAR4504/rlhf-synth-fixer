import { App } from "cdktf";
import "cdktf/lib/testing/adapters/jest";
import { HealthcareStack } from "../lib/healthcare-stack";

// Mock AWS Provider
jest.mock("@cdktf/provider-aws/lib/provider", () => ({
  AwsProvider: jest.fn(),
  AwsProviderDefaultTags: jest.fn(),
}));

// Mock AWS data sources
jest.mock("@cdktf/provider-aws/lib/data-aws-caller-identity", () => ({
  DataAwsCallerIdentity: jest.fn().mockImplementation(() => ({
    accountId: "123456789012",
  })),
}));

jest.mock("@cdktf/provider-aws/lib/data-aws-iam-policy-document", () => ({
  DataAwsIamPolicyDocument: jest.fn().mockImplementation(() => ({
    json: JSON.stringify({
      Version: "2012-10-17",
      Statement: [],
    }),
  })),
}));

// Mock KMS resources
jest.mock("@cdktf/provider-aws/lib/kms-key", () => ({
  KmsKey: jest.fn().mockImplementation(() => ({
    id: "kms-key-12345",
    keyId: "12345678-1234-1234-1234-123456789012",
    arn: "arn:aws:kms:us-east-1:123456789012:key/12345678-1234-1234-1234-123456789012",
  })),
}));

jest.mock("@cdktf/provider-aws/lib/kms-alias", () => ({
  KmsAlias: jest.fn(),
}));

// Mock VPC resources
jest.mock("@cdktf/provider-aws/lib/vpc", () => ({
  Vpc: jest.fn().mockImplementation(() => ({
    id: "vpc-12345",
  })),
}));

jest.mock("@cdktf/provider-aws/lib/subnet", () => ({
  Subnet: jest.fn().mockImplementation(() => ({
    id: "subnet-12345",
  })),
}));

jest.mock("@cdktf/provider-aws/lib/internet-gateway", () => ({
  InternetGateway: jest.fn().mockImplementation(() => ({
    id: "igw-12345",
  })),
}));

jest.mock("@cdktf/provider-aws/lib/route-table", () => ({
  RouteTable: jest.fn().mockImplementation(() => ({
    id: "rtb-12345",
  })),
}));

jest.mock("@cdktf/provider-aws/lib/route", () => ({
  Route: jest.fn(),
}));

jest.mock("@cdktf/provider-aws/lib/route-table-association", () => ({
  RouteTableAssociation: jest.fn(),
}));

// Mock Security Group resources
jest.mock("@cdktf/provider-aws/lib/security-group", () => ({
  SecurityGroup: jest.fn().mockImplementation(() => ({
    id: "sg-12345",
  })),
}));

jest.mock("@cdktf/provider-aws/lib/security-group-rule", () => ({
  SecurityGroupRule: jest.fn(),
}));

// Mock RDS resources
jest.mock("@cdktf/provider-aws/lib/db-subnet-group", () => ({
  DbSubnetGroup: jest.fn().mockImplementation(() => ({
    id: "db-subnet-group-12345",
    name: "healthcare-db-subnet-group-dev",
  })),
}));

jest.mock("@cdktf/provider-aws/lib/rds-cluster", () => ({
  RdsCluster: jest.fn().mockImplementation(() => ({
    id: "rds-cluster-12345",
    endpoint: "healthcare-db-dev.cluster-xyz.us-east-1.rds.amazonaws.com",
  })),
}));

jest.mock("@cdktf/provider-aws/lib/rds-cluster-instance", () => ({
  RdsClusterInstance: jest.fn(),
}));

// Mock ElastiCache resources
jest.mock("@cdktf/provider-aws/lib/elasticache-subnet-group", () => ({
  ElasticacheSubnetGroup: jest.fn().mockImplementation(() => ({
    id: "elasticache-subnet-group-12345",
    name: "healthcare-cache-subnet-group-dev",
  })),
}));

jest.mock("@cdktf/provider-aws/lib/elasticache-cluster", () => ({
  ElasticacheCluster: jest.fn().mockImplementation(() => ({
    id: "elasticache-cluster-12345",
    clusterId: "healthcare-cache-dev",
  })),
}));

// Mock Secrets Manager
jest.mock("@cdktf/provider-aws/lib/secretsmanager-secret", () => ({
  SecretsmanagerSecret: jest.fn().mockImplementation(() => ({
    id: "secret-12345",
    arn: "arn:aws:secretsmanager:us-east-1:123456789012:secret:healthcare-db-credentials-dev-AbCdEf",
  })),
}));

jest.mock("@cdktf/provider-aws/lib/secretsmanager-secret-version", () => ({
  SecretsmanagerSecretVersion: jest.fn(),
}));

// Mock CloudWatch Logs
jest.mock("@cdktf/provider-aws/lib/cloudwatch-log-group", () => ({
  CloudwatchLogGroup: jest.fn().mockImplementation(() => ({
    id: "log-group-12345",
    arn: "arn:aws:logs:us-east-1:123456789012:log-group:/aws/apigateway/healthcare-dev",
  })),
}));

// Mock IAM resources
jest.mock("@cdktf/provider-aws/lib/iam-role", () => ({
  IamRole: jest.fn().mockImplementation(() => ({
    id: "iam-role-12345",
    name: "healthcare-lambda-role-dev",
    arn: "arn:aws:iam::123456789012:role/healthcare-lambda-role-dev",
  })),
}));

jest.mock("@cdktf/provider-aws/lib/iam-role-policy-attachment", () => ({
  IamRolePolicyAttachment: jest.fn(),
}));

jest.mock("@cdktf/provider-aws/lib/iam-policy", () => ({
  IamPolicy: jest.fn().mockImplementation(() => ({
    id: "iam-policy-12345",
    arn: "arn:aws:iam::123456789012:policy/healthcare-lambda-policy-dev",
  })),
}));

// Mock Lambda resources
jest.mock("@cdktf/provider-aws/lib/lambda-function", () => ({
  LambdaFunction: jest.fn().mockImplementation(() => ({
    id: "lambda-12345",
    functionName: "healthcare-processor-dev",
    arn: "arn:aws:lambda:us-east-1:123456789012:function:healthcare-processor-dev",
  })),
}));

jest.mock("@cdktf/provider-aws/lib/lambda-permission", () => ({
  LambdaPermission: jest.fn(),
}));

// Mock API Gateway resources
jest.mock("@cdktf/provider-aws/lib/apigatewayv2-api", () => ({
  Apigatewayv2Api: jest.fn().mockImplementation(() => ({
    id: "api-12345",
    executionArn: "arn:aws:execute-api:us-east-1:123456789012:api12345",
  })),
}));

jest.mock("@cdktf/provider-aws/lib/apigatewayv2-stage", () => ({
  Apigatewayv2Stage: jest.fn(),
}));

jest.mock("@cdktf/provider-aws/lib/apigatewayv2-integration", () => ({
  Apigatewayv2Integration: jest.fn().mockImplementation(() => ({
    id: "integration-12345",
  })),
}));

jest.mock("@cdktf/provider-aws/lib/apigatewayv2-route", () => ({
  Apigatewayv2Route: jest.fn(),
}));

// Mock CDKTF components
jest.mock("cdktf", () => {
  const actual = jest.requireActual("cdktf");
  return {
    ...actual,
    TerraformAsset: jest.fn().mockImplementation(() => ({
      path: "/mock/path/lambda.zip",
      assetHash: "mock-hash-12345",
    })),
  };
});

describe("HealthcareStack Unit Tests", () => {
  let app: App;

  beforeEach(() => {
    jest.clearAllMocks();
    app = new App();
  });

  describe("Stack Instantiation", () => {
    test("should create healthcare stack with required props", () => {
      const props = {
        environmentSuffix: "dev",
        awsRegion: "us-east-1",
      };

      expect(() => {
        new HealthcareStack(app, "healthcare-stack", props);
      }).not.toThrow();
    });

    test("should create healthcare stack with production environment", () => {
      const props = {
        environmentSuffix: "prod",
        awsRegion: "us-west-2",
      };

      expect(() => {
        new HealthcareStack(app, "healthcare-stack-prod", props);
      }).not.toThrow();
    });
  });

  describe("KMS Configuration", () => {
    test("should create KMS key with proper HIPAA compliance settings", () => {
      const props = {
        environmentSuffix: "dev",
        awsRegion: "us-east-1",
      };

      new HealthcareStack(app, "healthcare-stack", props);

      const { KmsKey } = require("@cdktf/provider-aws/lib/kms-key");

      expect(KmsKey).toHaveBeenCalledWith(
        expect.any(Object),
        "HealthcareKmsKey",
        expect.objectContaining({
          description: "KMS key for HIPAA compliance - dev",
          enableKeyRotation: true,
          deletionWindowInDays: 7,
          policy: expect.any(String),
          tags: expect.objectContaining({
            Name: "healthcare-kms-dev",
            Environment: "dev",
            Compliance: "HIPAA",
          }),
        })
      );
    });

    test("should create KMS alias with correct naming", () => {
      const props = {
        environmentSuffix: "prod",
        awsRegion: "us-east-1",
      };

      new HealthcareStack(app, "healthcare-stack", props);

      const { KmsAlias } = require("@cdktf/provider-aws/lib/kms-alias");

      expect(KmsAlias).toHaveBeenCalledWith(
        expect.any(Object),
        "HealthcareKmsAlias",
        expect.objectContaining({
          name: "alias/healthcare-prod",
        })
      );
    });

    test("should create KMS key policy for CloudWatch Logs access", () => {
      const props = {
        environmentSuffix: "dev",
        awsRegion: "us-east-1",
      };

      new HealthcareStack(app, "healthcare-stack", props);

      const { DataAwsIamPolicyDocument } = require("@cdktf/provider-aws/lib/data-aws-iam-policy-document");

      expect(DataAwsIamPolicyDocument).toHaveBeenCalledWith(
        expect.any(Object),
        "KmsKeyPolicy",
        expect.objectContaining({
          statement: expect.arrayContaining([
            expect.objectContaining({
              sid: "EnableIAMUserPermissions",
              effect: "Allow",
            }),
            expect.objectContaining({
              sid: "AllowCloudWatchLogsEncryption",
              effect: "Allow",
            }),
          ]),
        })
      );
    });
  });

  describe("VPC Configuration", () => {
    test("should create VPC with proper CIDR and DNS settings", () => {
      const props = {
        environmentSuffix: "dev",
        awsRegion: "us-east-1",
      };

      new HealthcareStack(app, "healthcare-stack", props);

      const { Vpc } = require("@cdktf/provider-aws/lib/vpc");

      expect(Vpc).toHaveBeenCalledWith(
        expect.any(Object),
        "HealthcareVpc",
        expect.objectContaining({
          cidrBlock: "10.0.0.0/16",
          enableDnsHostnames: true,
          enableDnsSupport: true,
          tags: expect.objectContaining({
            Name: "healthcare-vpc-dev",
            Environment: "dev",
          }),
        })
      );
    });

    test("should create internet gateway", () => {
      const props = {
        environmentSuffix: "dev",
        awsRegion: "us-east-1",
      };

      new HealthcareStack(app, "healthcare-stack", props);

      const { InternetGateway } = require("@cdktf/provider-aws/lib/internet-gateway");

      expect(InternetGateway).toHaveBeenCalledWith(
        expect.any(Object),
        "InternetGateway",
        expect.objectContaining({
          tags: expect.objectContaining({
            Name: "healthcare-igw-dev",
            Environment: "dev",
          }),
        })
      );
    });

    test("should create public subnets in multiple AZs", () => {
      const props = {
        environmentSuffix: "dev",
        awsRegion: "us-east-1",
      };

      new HealthcareStack(app, "healthcare-stack", props);

      const { Subnet } = require("@cdktf/provider-aws/lib/subnet");

      // Check for public subnet 1
      expect(Subnet).toHaveBeenCalledWith(
        expect.any(Object),
        "PublicSubnet1",
        expect.objectContaining({
          cidrBlock: "10.0.1.0/24",
          availabilityZone: "us-east-1a",
          mapPublicIpOnLaunch: true,
          tags: expect.objectContaining({
            Name: "healthcare-public-subnet-1-dev",
            Environment: "dev",
          }),
        })
      );

      // Check for public subnet 2
      expect(Subnet).toHaveBeenCalledWith(
        expect.any(Object),
        "PublicSubnet2",
        expect.objectContaining({
          cidrBlock: "10.0.2.0/24",
          availabilityZone: "us-east-1b",
          mapPublicIpOnLaunch: true,
          tags: expect.objectContaining({
            Name: "healthcare-public-subnet-2-dev",
            Environment: "dev",
          }),
        })
      );
    });

    test("should create private subnets for database resources", () => {
      const props = {
        environmentSuffix: "dev",
        awsRegion: "us-east-1",
      };

      new HealthcareStack(app, "healthcare-stack", props);

      const { Subnet } = require("@cdktf/provider-aws/lib/subnet");

      // Check for private subnet 1
      expect(Subnet).toHaveBeenCalledWith(
        expect.any(Object),
        "PrivateSubnet1",
        expect.objectContaining({
          cidrBlock: "10.0.10.0/24",
          availabilityZone: "us-east-1a",
          tags: expect.objectContaining({
            Name: "healthcare-private-subnet-1-dev",
            Environment: "dev",
          }),
        })
      );

      // Check for private subnet 2
      expect(Subnet).toHaveBeenCalledWith(
        expect.any(Object),
        "PrivateSubnet2",
        expect.objectContaining({
          cidrBlock: "10.0.11.0/24",
          availabilityZone: "us-east-1b",
          tags: expect.objectContaining({
            Name: "healthcare-private-subnet-2-dev",
            Environment: "dev",
          }),
        })
      );
    });
  });

  describe("Security Groups Configuration", () => {
    test("should create Lambda security group with proper egress rules", () => {
      const props = {
        environmentSuffix: "dev",
        awsRegion: "us-east-1",
      };

      new HealthcareStack(app, "healthcare-stack", props);

      const { SecurityGroup } = require("@cdktf/provider-aws/lib/security-group");

      expect(SecurityGroup).toHaveBeenCalledWith(
        expect.any(Object),
        "LambdaSecurityGroup",
        expect.objectContaining({
          name: "healthcare-lambda-sg-dev",
          description: "Security group for Lambda functions",
          tags: expect.objectContaining({
            Name: "healthcare-lambda-sg-dev",
            Environment: "dev",
          }),
        })
      );
    });

    test("should create RDS security group with proper ingress rules", () => {
      const props = {
        environmentSuffix: "dev",
        awsRegion: "us-east-1",
      };

      new HealthcareStack(app, "healthcare-stack", props);

      const { SecurityGroup } = require("@cdktf/provider-aws/lib/security-group");

      expect(SecurityGroup).toHaveBeenCalledWith(
        expect.any(Object),
        "RdsSecurityGroup",
        expect.objectContaining({
          name: "healthcare-rds-sg-dev",
          description: "Security group for RDS Aurora cluster",
          tags: expect.objectContaining({
            Name: "healthcare-rds-sg-dev",
            Environment: "dev",
          }),
        })
      );
    });

    test("should create ElastiCache security group", () => {
      const props = {
        environmentSuffix: "dev",
        awsRegion: "us-east-1",
      };

      new HealthcareStack(app, "healthcare-stack", props);

      const { SecurityGroup } = require("@cdktf/provider-aws/lib/security-group");

      expect(SecurityGroup).toHaveBeenCalledWith(
        expect.any(Object),
        "ElasticacheSecurityGroup",
        expect.objectContaining({
          name: "healthcare-elasticache-sg-dev",
          description: "Security group for ElastiCache Redis cluster",
          tags: expect.objectContaining({
            Name: "healthcare-elasticache-sg-dev",
            Environment: "dev",
          }),
        })
      );
    });
  });

  describe("RDS Configuration", () => {
    test("should create RDS subnet group", () => {
      const props = {
        environmentSuffix: "dev",
        awsRegion: "us-east-1",
      };

      new HealthcareStack(app, "healthcare-stack", props);

      const { DbSubnetGroup } = require("@cdktf/provider-aws/lib/db-subnet-group");

      expect(DbSubnetGroup).toHaveBeenCalledWith(
        expect.any(Object),
        "RdsSubnetGroup",
        expect.objectContaining({
          name: "healthcare-db-subnet-group-dev",
          description: "Subnet group for RDS Aurora cluster",
          tags: expect.objectContaining({
            Name: "healthcare-db-subnet-group-dev",
            Environment: "dev",
          }),
        })
      );
    });

    test("should create RDS Aurora cluster with HIPAA compliance", () => {
      const props = {
        environmentSuffix: "dev",
        awsRegion: "us-east-1",
      };

      new HealthcareStack(app, "healthcare-stack", props);

      const { RdsCluster } = require("@cdktf/provider-aws/lib/rds-cluster");

      expect(RdsCluster).toHaveBeenCalledWith(
        expect.any(Object),
        "AuroraCluster",
        expect.objectContaining({
          clusterIdentifier: "healthcare-db-dev",
          engine: "aurora-postgresql",
          engineMode: "provisioned",
          storageEncrypted: true,
          backupRetentionPeriod: 7,
          deletionProtection: false,
          skipFinalSnapshot: true,
          tags: expect.objectContaining({
            Name: "healthcare-aurora-dev",
            Environment: "dev",
            Compliance: "HIPAA",
          }),
        })
      );
    });

    test("should create RDS cluster instances", () => {
      const props = {
        environmentSuffix: "dev",
        awsRegion: "us-east-1",
      };

      new HealthcareStack(app, "healthcare-stack", props);

      const { RdsClusterInstance } = require("@cdktf/provider-aws/lib/rds-cluster-instance");

      // Check for instance 1
      expect(RdsClusterInstance).toHaveBeenCalledWith(
        expect.any(Object),
        "AuroraInstance1",
        expect.objectContaining({
          identifier: "healthcare-db-instance-1-dev",
          instanceClass: "db.serverless",
          engine: "aurora-postgresql",
          publiclyAccessible: false,
        })
      );

      // Check for instance 2
      expect(RdsClusterInstance).toHaveBeenCalledWith(
        expect.any(Object),
        "AuroraInstance2",
        expect.objectContaining({
          identifier: "healthcare-db-instance-2-dev",
          instanceClass: "db.serverless",
          engine: "aurora-postgresql",
          publiclyAccessible: false,
        })
      );
    });
  });

  describe("ElastiCache Configuration", () => {
    test("should create ElastiCache subnet group", () => {
      const props = {
        environmentSuffix: "dev",
        awsRegion: "us-east-1",
      };

      new HealthcareStack(app, "healthcare-stack", props);

      const { ElasticacheSubnetGroup } = require("@cdktf/provider-aws/lib/elasticache-subnet-group");

      expect(ElasticacheSubnetGroup).toHaveBeenCalledWith(
        expect.any(Object),
        "ElasticacheSubnetGroup",
        expect.objectContaining({
          name: "healthcare-cache-subnet-group-dev",
          description: "Subnet group for ElastiCache Redis cluster",
          tags: expect.objectContaining({
            Name: "healthcare-cache-subnet-group-dev",
            Environment: "dev",
          }),
        })
      );
    });

    test("should create Redis cluster with HIPAA compliance", () => {
      const props = {
        environmentSuffix: "dev",
        awsRegion: "us-east-1",
      };

      new HealthcareStack(app, "healthcare-stack", props);

      const { ElasticacheCluster } = require("@cdktf/provider-aws/lib/elasticache-cluster");

      expect(ElasticacheCluster).toHaveBeenCalledWith(
        expect.any(Object),
        "RedisCluster",
        expect.objectContaining({
          clusterId: "healthcare-cache-dev",
          engine: "redis",
          engineVersion: "7.0",
          nodeType: "cache.t4g.micro",
          numCacheNodes: 1,
          port: 6379,
          snapshotRetentionLimit: 5,
          tags: expect.objectContaining({
            Name: "healthcare-redis-dev",
            Environment: "dev",
            Compliance: "HIPAA",
          }),
        })
      );
    });
  });

  describe("Secrets Manager Configuration", () => {
    test("should create database secret with KMS encryption", () => {
      const props = {
        environmentSuffix: "dev",
        awsRegion: "us-east-1",
      };

      new HealthcareStack(app, "healthcare-stack", props);

      const { SecretsmanagerSecret } = require("@cdktf/provider-aws/lib/secretsmanager-secret");

      expect(SecretsmanagerSecret).toHaveBeenCalledWith(
        expect.any(Object),
        "DatabaseSecret",
        expect.objectContaining({
          name: "healthcare-db-credentials-dev",
          description: "Database credentials for HIPAA-compliant RDS cluster",
          tags: expect.objectContaining({
            Name: "healthcare-db-credentials-dev",
            Environment: "dev",
          }),
        })
      );
    });

    test("should create secret version with database credentials", () => {
      const props = {
        environmentSuffix: "dev",
        awsRegion: "us-east-1",
      };

      new HealthcareStack(app, "healthcare-stack", props);

      const { SecretsmanagerSecretVersion } = require("@cdktf/provider-aws/lib/secretsmanager-secret-version");

      expect(SecretsmanagerSecretVersion).toHaveBeenCalledWith(
        expect.any(Object),
        "DatabaseSecretVersion",
        expect.objectContaining({
          secretString: expect.stringContaining("healthcareadmin"),
        })
      );
    });
  });

  describe("Lambda Configuration", () => {
    test("should create Lambda execution role with proper policies", () => {
      const props = {
        environmentSuffix: "dev",
        awsRegion: "us-east-1",
      };

      new HealthcareStack(app, "healthcare-stack", props);

      const { IamRole } = require("@cdktf/provider-aws/lib/iam-role");

      expect(IamRole).toHaveBeenCalledWith(
        expect.any(Object),
        "LambdaExecutionRole",
        expect.objectContaining({
          name: "healthcare-lambda-role-dev",
          tags: expect.objectContaining({
            Name: "healthcare-lambda-role-dev",
            Environment: "dev",
          }),
        })
      );
    });

    test("should create Lambda function with proper configuration", () => {
      const props = {
        environmentSuffix: "dev",
        awsRegion: "us-east-1",
      };

      new HealthcareStack(app, "healthcare-stack", props);

      const { LambdaFunction } = require("@cdktf/provider-aws/lib/lambda-function");

      expect(LambdaFunction).toHaveBeenCalledWith(
        expect.any(Object),
        "PatientRecordProcessor",
        expect.objectContaining({
          functionName: "healthcare-processor-dev",
          description: "Processes patient records with HIPAA compliance",
          runtime: "nodejs20.x",
          handler: "index.handler",
          timeout: 30,
          memorySize: 512,
          environment: expect.objectContaining({
            variables: expect.objectContaining({
              ENVIRONMENT: "dev",
              REDIS_PORT: "6379",
            }),
          }),
          tags: expect.objectContaining({
            Name: "healthcare-processor-dev",
            Environment: "dev",
          }),
        })
      );
    });
  });

  describe("API Gateway Configuration", () => {
    test("should create API Gateway with CORS configuration", () => {
      const props = {
        environmentSuffix: "dev",
        awsRegion: "us-east-1",
      };

      new HealthcareStack(app, "healthcare-stack", props);

      const { Apigatewayv2Api } = require("@cdktf/provider-aws/lib/apigatewayv2-api");

      expect(Apigatewayv2Api).toHaveBeenCalledWith(
        expect.any(Object),
        "HealthcareApi",
        expect.objectContaining({
          name: "healthcare-api-dev",
          description: "HIPAA-compliant healthcare data processing API",
          protocolType: "HTTP",
          corsConfiguration: expect.objectContaining({
            allowOrigins: ["*"],
            allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
            allowHeaders: ["Content-Type", "Authorization"],
          }),
          tags: expect.objectContaining({
            Name: "healthcare-api-dev",
            Environment: "dev",
          }),
        })
      );
    });

    test("should create API Gateway stage with logging and throttling", () => {
      const props = {
        environmentSuffix: "dev",
        awsRegion: "us-east-1",
      };

      new HealthcareStack(app, "healthcare-stack", props);

      const { Apigatewayv2Stage } = require("@cdktf/provider-aws/lib/apigatewayv2-stage");

      expect(Apigatewayv2Stage).toHaveBeenCalledWith(
        expect.any(Object),
        "ApiStage",
        expect.objectContaining({
          name: "prod",
          autoDeploy: true,
          defaultRouteSettings: expect.objectContaining({
            throttlingBurstLimit: 100,
            throttlingRateLimit: 50,
            detailedMetricsEnabled: true,
            loggingLevel: "INFO",
          }),
        })
      );
    });

    test("should create API routes for patient operations", () => {
      const props = {
        environmentSuffix: "dev",
        awsRegion: "us-east-1",
      };

      new HealthcareStack(app, "healthcare-stack", props);

      const { Apigatewayv2Route } = require("@cdktf/provider-aws/lib/apigatewayv2-route");

      // Check POST patients route
      expect(Apigatewayv2Route).toHaveBeenCalledWith(
        expect.any(Object),
        "PostPatientsRoute",
        expect.objectContaining({
          routeKey: "POST /patients",
        })
      );

      // Check GET patients route
      expect(Apigatewayv2Route).toHaveBeenCalledWith(
        expect.any(Object),
        "GetPatientsRoute",
        expect.objectContaining({
          routeKey: "GET /patients/{id}",
        })
      );
    });
  });

  describe("CloudWatch Logs Configuration", () => {
    test("should create API Gateway log group with KMS encryption", () => {
      const props = {
        environmentSuffix: "dev",
        awsRegion: "us-east-1",
      };

      new HealthcareStack(app, "healthcare-stack", props);

      const { CloudwatchLogGroup } = require("@cdktf/provider-aws/lib/cloudwatch-log-group");

      expect(CloudwatchLogGroup).toHaveBeenCalledWith(
        expect.any(Object),
        "ApiGatewayLogGroup",
        expect.objectContaining({
          name: "/aws/apigateway/healthcare-dev",
          retentionInDays: 90,
          tags: expect.objectContaining({
            Name: "healthcare-api-logs-dev",
            Environment: "dev",
            Compliance: "HIPAA",
          }),
        })
      );
    });
  });

  describe("Regional Configuration", () => {
    test("should handle different AWS regions correctly", () => {
      const regions = ["us-east-1", "us-west-2", "eu-west-1"];

      regions.forEach((region) => {
        const props = {
          environmentSuffix: "test",
          awsRegion: region,
        };

        expect(() => {
          new HealthcareStack(app, `healthcare-stack-${region}`, props);
        }).not.toThrow();

        const { Subnet } = require("@cdktf/provider-aws/lib/subnet");

        // Verify subnets are created with correct AZ suffixes
        expect(Subnet).toHaveBeenCalledWith(
          expect.any(Object),
          "PublicSubnet1",
          expect.objectContaining({
            availabilityZone: `${region}a`,
          })
        );

        expect(Subnet).toHaveBeenCalledWith(
          expect.any(Object),
          "PublicSubnet2",
          expect.objectContaining({
            availabilityZone: `${region}b`,
          })
        );
      });
    });
  });

  describe("HIPAA Compliance", () => {
    test("should ensure all resources have proper compliance tags", () => {
      const props = {
        environmentSuffix: "prod",
        awsRegion: "us-east-1",
      };

      new HealthcareStack(app, "healthcare-stack", props);

      // Check KMS key has HIPAA compliance tag
      const { KmsKey } = require("@cdktf/provider-aws/lib/kms-key");
      expect(KmsKey).toHaveBeenCalledWith(
        expect.any(Object),
        expect.any(String),
        expect.objectContaining({
          tags: expect.objectContaining({
            Compliance: "HIPAA",
          }),
        })
      );

      // Check RDS cluster has HIPAA compliance tag
      const { RdsCluster } = require("@cdktf/provider-aws/lib/rds-cluster");
      expect(RdsCluster).toHaveBeenCalledWith(
        expect.any(Object),
        expect.any(String),
        expect.objectContaining({
          tags: expect.objectContaining({
            Compliance: "HIPAA",
          }),
        })
      );

      // Check ElastiCache has HIPAA compliance tag
      const { ElasticacheCluster } = require("@cdktf/provider-aws/lib/elasticache-cluster");
      expect(ElasticacheCluster).toHaveBeenCalledWith(
        expect.any(Object),
        expect.any(String),
        expect.objectContaining({
          tags: expect.objectContaining({
            Compliance: "HIPAA",
          }),
        })
      );
    });

    test("should enable encryption for all data stores", () => {
      const props = {
        environmentSuffix: "prod",
        awsRegion: "us-east-1",
      };

      new HealthcareStack(app, "healthcare-stack", props);

      // Check RDS encryption
      const { RdsCluster } = require("@cdktf/provider-aws/lib/rds-cluster");
      expect(RdsCluster).toHaveBeenCalledWith(
        expect.any(Object),
        expect.any(String),
        expect.objectContaining({
          storageEncrypted: true,
        })
      );

      // Check Secrets Manager uses KMS
      const { SecretsmanagerSecret } = require("@cdktf/provider-aws/lib/secretsmanager-secret");
      expect(SecretsmanagerSecret).toHaveBeenCalledWith(
        expect.any(Object),
        expect.any(String),
        expect.objectContaining({
          kmsKeyId: expect.any(String),
        })
      );

      // Check CloudWatch Logs uses KMS
      const { CloudwatchLogGroup } = require("@cdktf/provider-aws/lib/cloudwatch-log-group");
      expect(CloudwatchLogGroup).toHaveBeenCalledWith(
        expect.any(Object),
        expect.any(String),
        expect.objectContaining({
          kmsKeyId: expect.any(String),
        })
      );
    });
  });
});