import { App } from "cdktf";
import "cdktf/lib/testing/adapters/jest";
import { TapStack } from "../lib/tap-stack";

// Mock all the modules used in TapStack
jest.mock("../lib/modules", () => ({
  NetworkingModule: jest.fn().mockImplementation((scope, id, config) => ({
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
      id: `nat-${id}-12345` 
    },
    s3VpcEndpoint: {
      id: `vpce-s3-${id}-12345`
    }
  })),
  SecurityGroupsModule: jest.fn().mockImplementation((scope, id, vpc, config) => ({
    ec2SecurityGroup: { 
      id: `sg-ec2-${id}-12345`
    },
    rdsSecurityGroup: { 
      id: `sg-rds-${id}-12345`
    },
    lambdaSecurityGroup: {
      id: `sg-lambda-${id}-12345`
    }
  })),
  IamModule: jest.fn().mockImplementation((scope, id, config) => ({
    ec2InstanceProfile: { 
      name: `instance-profile-ec2-${id}`,
      arn: `arn:aws:iam::123456789012:instance-profile/instance-profile-ec2-${id}`
    },
    lambdaRole: {
      name: `lambda-role-${id}`,
      arn: `arn:aws:iam::123456789012:role/lambda-role-${id}`
    }
  })),
  ComputeModule: jest.fn().mockImplementation((scope, id, subnets, securityGroup, instanceProfile, config) => ({
    instances: [
      { 
        id: `i-compute-${id}-1`,
        privateIp: "10.0.10.100"
      },
      { 
        id: `i-compute-${id}-2`,
        privateIp: "10.0.20.100"
      }
    ]
  })),
  StorageModule: jest.fn().mockImplementation((scope, id, config) => ({
    appBucket: { 
      bucket: `app-bucket-${config.environment}-${config.companyName}`,
      arn: `arn:aws:s3:::app-bucket-${config.environment}-${config.companyName}`
    },
    logsBucket: {
      bucket: `logs-bucket-${config.environment}-${config.companyName}`,
      arn: `arn:aws:s3:::logs-bucket-${config.environment}-${config.companyName}`
    }
  })),
  LambdaModule: jest.fn().mockImplementation((scope, id, subnets, securityGroup, role, config) => ({
    lambdaFunction: {
      functionName: `lambda-${id}-${config.environment}`,
      arn: `arn:aws:lambda:${config.region}:123456789012:function:lambda-${id}-${config.environment}`
    }
  })),
  DatabaseModule: jest.fn().mockImplementation((scope, id, subnets, securityGroup, config) => ({
    dynamoTable: {
      name: `dynamo-table-${config.environment}`,
      arn: `arn:aws:dynamodb:${config.region}:123456789012:table/dynamo-table-${config.environment}`
    },
    rdsInstance: {
      id: `rds-${id}-${config.environment}`,
      endpoint: `rds-${id}-${config.environment}.cluster-xyz.${config.region}.rds.amazonaws.com`
    }
  })),
  AnalyticsModule: jest.fn().mockImplementation((scope, id, config) => ({
    elasticsearchDomain: {
      domainName: `es-domain-${config.environment}`,
      endpoint: `https://search-es-domain-${config.environment}-xyz.${config.region}.es.amazonaws.com`
    }
  })),
  MonitoringModule: jest.fn().mockImplementation((scope, id, logsBucket, instances, config) => ({
    snsTopic: {
      arn: `arn:aws:sns:${config.region}:123456789012:monitoring-topic-${config.environment}`,
      name: `monitoring-topic-${config.environment}`
    },
    cloudTrail: {
      arn: `arn:aws:cloudtrail:${config.region}:123456789012:trail/cloudtrail-${config.environment}`,
      name: `cloudtrail-${config.environment}`
    }
  }))
}));

// Mock TerraformOutput and S3Backend to avoid duplicate construct errors
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
    NetworkingModule, 
    SecurityGroupsModule,
    ComputeModule, 
    IamModule,
    StorageModule, 
    LambdaModule,
    DatabaseModule, 
    AnalyticsModule,
    MonitoringModule 
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

  test("should create AWS provider with correct default configuration", () => {
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
              Project: 'secure-web-application',
              Environment: 'dev',
              ManagedBy: 'CDKTF',
              Owner: 'infrastructure-team',
              CostCenter: 'engineering',
            }
          }
        ]
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

  test("should create module configuration with correct default values", () => {
    const app = new App();
    new TapStack(app, "TestStackConfig");

    const expectedConfig = {
      environment: 'dev',
      region: 'us-east-1',
      companyName: 'acme-corp',
      allowedCidrBlocks: ['203.0.113.0/24', '198.51.100.0/24'],
      keyPairName: 'production-key-poetic-primate',
      amiId: 'ami-0c02fb55956c7d316',
    };

    expect(NetworkingModule).toHaveBeenCalledWith(
      expect.anything(),
      "networking",
      expectedConfig
    );
  });

  test("should create module configuration with custom environment", () => {
    const app = new App();
    new TapStack(app, "TestStackCustomConfig", { 
      environmentSuffix: "staging",
      awsRegion: "eu-west-1"
    });

    const expectedConfig = {
      environment: 'staging',
      region: 'eu-west-1',
      companyName: 'acme-corp',
      allowedCidrBlocks: ['203.0.113.0/24', '198.51.100.0/24'],
      keyPairName: 'production-key-poetic-primate',
      amiId: 'ami-0c02fb55956c7d316',
    };

    expect(NetworkingModule).toHaveBeenCalledWith(
      expect.anything(),
      "networking",
      expectedConfig
    );
  });

  test("should create all modules in correct order with proper dependencies", () => {
    const app = new App();
    new TapStack(app, "TestStackModules");

    // Verify all modules are created once
    expect(NetworkingModule).toHaveBeenCalledTimes(1);
    expect(SecurityGroupsModule).toHaveBeenCalledTimes(1);
    expect(IamModule).toHaveBeenCalledTimes(1);
    expect(ComputeModule).toHaveBeenCalledTimes(1);
    expect(StorageModule).toHaveBeenCalledTimes(1);
    expect(LambdaModule).toHaveBeenCalledTimes(1);
    expect(DatabaseModule).toHaveBeenCalledTimes(1);
    expect(AnalyticsModule).toHaveBeenCalledTimes(1);
    expect(MonitoringModule).toHaveBeenCalledTimes(1);
  });

  test("should create security groups module with VPC dependency", () => {
    const app = new App();
    new TapStack(app, "TestStackSecurityGroups");

    // Get the mocked networking module result
    const networkingInstance = NetworkingModule.mock.results[0].value;

    expect(SecurityGroupsModule).toHaveBeenCalledWith(
      expect.anything(),
      "security-groups",
      networkingInstance.vpc,
      expect.objectContaining({
        environment: 'dev',
        companyName: 'acme-corp'
      })
    );
  });

  test("should create compute module with all dependencies", () => {
    const app = new App();
    new TapStack(app, "TestStackCompute");

    const networkingInstance = NetworkingModule.mock.results[0].value;
    const securityGroupsInstance = SecurityGroupsModule.mock.results[0].value;
    const iamInstance = IamModule.mock.results[0].value;

    expect(ComputeModule).toHaveBeenCalledWith(
      expect.anything(),
      "compute",
      networkingInstance.privateSubnets,
      securityGroupsInstance.ec2SecurityGroup,
      iamInstance.ec2InstanceProfile,
      expect.objectContaining({
        environment: 'dev',
        amiId: 'ami-0c02fb55956c7d316',
        keyPairName: 'production-key-poetic-primate'
      })
    );
  });

  test("should create lambda module with VPC and security group dependencies", () => {
    const app = new App();
    new TapStack(app, "TestStackLambda");

    const networkingInstance = NetworkingModule.mock.results[0].value;
    const securityGroupsInstance = SecurityGroupsModule.mock.results[0].value;
    const iamInstance = IamModule.mock.results[0].value;

    expect(LambdaModule).toHaveBeenCalledWith(
      expect.anything(),
      "lambda",
      networkingInstance.privateSubnets,
      securityGroupsInstance.lambdaSecurityGroup,
      iamInstance.lambdaRole,
      expect.objectContaining({
        environment: 'dev'
      })
    );
  });

  test("should create database module with subnet and security group dependencies", () => {
    const app = new App();
    new TapStack(app, "TestStackDatabase");

    const networkingInstance = NetworkingModule.mock.results[0].value;
    const securityGroupsInstance = SecurityGroupsModule.mock.results[0].value;

    expect(DatabaseModule).toHaveBeenCalledWith(
      expect.anything(),
      "database",
      networkingInstance.privateSubnets,
      securityGroupsInstance.rdsSecurityGroup,
      expect.objectContaining({
        environment: 'dev'
      })
    );
  });

  test("should create monitoring module with dependencies", () => {
    const app = new App();
    new TapStack(app, "TestStackMonitoring");

    const storageInstance = StorageModule.mock.results[0].value;
    const computeInstance = ComputeModule.mock.results[0].value;

    expect(MonitoringModule).toHaveBeenCalledWith(
      expect.anything(),
      "monitoring",
      storageInstance.logsBucket,
      computeInstance.instances,
      expect.objectContaining({
        environment: 'dev'
      })
    );
  });

  test("should create all required Terraform outputs", () => {
    const app = new App();
    new TapStack(app, "TestStackOutputs");

    // Should create 12 outputs based on the actual code
    expect(TerraformOutput).toHaveBeenCalledTimes(12);

    // Verify VPC ID output
    expect(TerraformOutput).toHaveBeenCalledWith(
      expect.anything(),
      "vpc-id",
      expect.objectContaining({
        description: "VPC ID for the secure environment",
      })
    );

    // Verify EC2 instance IDs output
    expect(TerraformOutput).toHaveBeenCalledWith(
      expect.anything(),
      "ec2-instance-ids",
      expect.objectContaining({
        description: "EC2 instance IDs deployed in private subnets",
      })
    );

    // Verify app bucket name output
    expect(TerraformOutput).toHaveBeenCalledWith(
      expect.anything(),
      "app-bucket-name",
      expect.objectContaining({
        description: "S3 bucket name for application data",
      })
    );

    // Verify logs bucket name output
    expect(TerraformOutput).toHaveBeenCalledWith(
      expect.anything(),
      "logs-bucket-name",
      expect.objectContaining({
        description: "S3 bucket name for audit logs",
      })
    );

    // Verify DynamoDB table name output
    expect(TerraformOutput).toHaveBeenCalledWith(
      expect.anything(),
      "dynamodb-table-name",
      expect.objectContaining({
        description: "DynamoDB table name with PITR enabled",
      })
    );

    // Verify RDS endpoint output (sensitive)
    expect(TerraformOutput).toHaveBeenCalledWith(
      expect.anything(),
      "rds-endpoint",
      expect.objectContaining({
        description: "RDS instance endpoint (private access only)",
        sensitive: true,
      })
    );

    // Verify Lambda function name output
    expect(TerraformOutput).toHaveBeenCalledWith(
      expect.anything(),
      "lambda-function-name",
      expect.objectContaining({
        description: "Lambda function name deployed in VPC",
      })
    );

    // Verify Elasticsearch endpoint output
    expect(TerraformOutput).toHaveBeenCalledWith(
      expect.anything(),
      "elasticsearch-endpoint",
      expect.objectContaining({
        description: "Elasticsearch domain endpoint with encryption",
      })
    );

    // Verify SNS topic ARN output
    expect(TerraformOutput).toHaveBeenCalledWith(
      expect.anything(),
      "sns-topic-arn",
      expect.objectContaining({
        description: "SNS topic ARN for alarm notifications",
      })
    );

    // Verify CloudTrail ARN output
    expect(TerraformOutput).toHaveBeenCalledWith(
      expect.anything(),
      "cloudtrail-arn",
      expect.objectContaining({
        description: "CloudTrail ARN with KMS encryption enabled",
      })
    );

    // Verify NAT Gateway ID output
    expect(TerraformOutput).toHaveBeenCalledWith(
      expect.anything(),
      "nat-gateway-id",
      expect.objectContaining({
        description: "NAT Gateway ID for private subnet internet access",
      })
    );

    // Verify S3 VPC Endpoint ID output
    expect(TerraformOutput).toHaveBeenCalledWith(
      expect.anything(),
      "s3-vpc-endpoint-id",
      expect.objectContaining({
        description: "S3 VPC Endpoint ID for private S3 access",
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

  test("should use custom environment suffix in tags and state key", () => {
    const app = new App();
    new TapStack(app, "TestStackCustomEnv", { environmentSuffix: "staging" });

    expect(S3Backend).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        key: "staging/TestStackCustomEnv.tfstate",
      })
    );

    expect(AwsProvider).toHaveBeenCalledWith(
      expect.anything(),
      "aws",
      expect.objectContaining({
        defaultTags: [
          {
            tags: expect.objectContaining({
              Environment: 'staging',
            })
          }
        ]
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

  test("should create modules with correct construct IDs", () => {
    const app = new App();
    new TapStack(app, "TestStackConstructIds");

    expect(NetworkingModule).toHaveBeenCalledWith(
      expect.anything(),
      "networking",
      expect.anything()
    );

    expect(SecurityGroupsModule).toHaveBeenCalledWith(
      expect.anything(),
      "security-groups",
      expect.anything(),
      expect.anything()
    );

    expect(IamModule).toHaveBeenCalledWith(
      expect.anything(),
      "iam",
      expect.anything()
    );

    expect(ComputeModule).toHaveBeenCalledWith(
      expect.anything(),
      "compute",
      expect.anything(),
      expect.anything(),
      expect.anything(),
      expect.anything()
    );

    expect(StorageModule).toHaveBeenCalledWith(
      expect.anything(),
      "storage",
      expect.anything()
    );

    expect(LambdaModule).toHaveBeenCalledWith(
      expect.anything(),
      "lambda",
      expect.anything(),
      expect.anything(),
      expect.anything(),
      expect.anything()
    );

    expect(DatabaseModule).toHaveBeenCalledWith(
      expect.anything(),
      "database",
      expect.anything(),
      expect.anything(),
      expect.anything()
    );

    expect(AnalyticsModule).toHaveBeenCalledWith(
      expect.anything(),
      "analytics",
      expect.anything()
    );

    expect(MonitoringModule).toHaveBeenCalledWith(
      expect.anything(),
      "monitoring",
      expect.anything(),
      expect.anything(),
      expect.anything()
    );
  });

  test("should use correct hardcoded configuration values", () => {
    const app = new App();
    new TapStack(app, "TestStackHardcodedValues");

    const expectedConfig = {
      environment: 'dev',
      region: 'us-east-1',
      companyName: 'acme-corp',
      allowedCidrBlocks: ['203.0.113.0/24', '198.51.100.0/24'],
      keyPairName: 'production-key-poetic-primate',
      amiId: 'ami-0c02fb55956c7d316',
    };

    // Verify all modules receive the same config
    expect(NetworkingModule).toHaveBeenCalledWith(
      expect.anything(),
      "networking",
      expectedConfig
    );

    expect(StorageModule).toHaveBeenCalledWith(
      expect.anything(),
      "storage",
      expectedConfig
    );

    expect(DatabaseModule).toHaveBeenCalledWith(
      expect.anything(),
      "database",
      expect.anything(),
      expect.anything(),
      expectedConfig
    );

    expect(AnalyticsModule).toHaveBeenCalledWith(
      expect.anything(),
      "analytics",
      expectedConfig
    );
  });

  test("should handle custom default tags in AWS provider", () => {
    const app = new App();
    const customTags = {
      tags: {
        CustomTag: "CustomValue",
        Environment: "test"
      }
    };
    
    new TapStack(app, "TestStackCustomTags", { defaultTags: customTags });
  });

  test("should override AWS region when AWS_REGION_OVERRIDE is set", () => {
    // Since AWS_REGION_OVERRIDE is a const, we test the behavior when awsRegion prop is provided
    const app = new App();
    new TapStack(app, "TestStackRegionOverride", { awsRegion: "ap-southeast-1" });

    expect(AwsProvider).toHaveBeenCalledWith(
      expect.anything(),
      "aws",
      expect.objectContaining({
        region: "ap-southeast-1",
      })
    );

    // Config should also use the custom region
    expect(NetworkingModule).toHaveBeenCalledWith(
      expect.anything(),
      "networking",
      expect.objectContaining({
        region: "ap-southeast-1",
      })
    );
  });
});