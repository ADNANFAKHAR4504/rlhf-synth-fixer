import { App } from "cdktf";
import "cdktf/lib/testing/adapters/jest";
import { TapStack } from "../lib/tap-stack";

// Mock all the modules used in TapStack
jest.mock("../lib/modules", () => ({
  SecureVpcConstruct: jest.fn().mockImplementation((scope, id, config) => ({
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
    flowLogsRole: {
      arn: `arn:aws:iam::123456789012:role/flow-logs-role-${id}`
    }
  })),
  SecurityGroupsConstruct: jest.fn().mockImplementation((scope, id, vpc, config) => ({
    lambdaSecurityGroup: { 
      id: `sg-lambda-${id}-12345`
    },
    dbSecurityGroup: { 
      id: `sg-db-${id}-12345`
    }
  })),
  KmsConstruct: jest.fn().mockImplementation((scope, id, config) => ({
    kmsKey: { 
      keyId: `kms-key-${id}-12345`,
      arn: `arn:aws:kms:${config.region}:123456789012:key/kms-key-${id}-12345`
    },
    kmsAlias: {
      name: `alias/${config.companyName}-${config.environment}-key`
    }
  })),
  IamConstruct: jest.fn().mockImplementation((scope, id, config) => ({
    lambdaRole: {
      name: `lambda-role-${id}`,
      arn: `arn:aws:iam::123456789012:role/lambda-role-${id}`
    }
  })),
  S3Construct: jest.fn().mockImplementation((scope, id, kmsKey, config) => ({
    bucket: { 
      bucket: `app-bucket-${config.environment}-${config.companyName}`,
      arn: `arn:aws:s3:::app-bucket-${config.environment}-${config.companyName}`
    },
    configBucket: {
      bucket: `config-bucket-${config.environment}-${config.companyName}`,
      arn: `arn:aws:s3:::config-bucket-${config.environment}-${config.companyName}`
    }
  })),
  LambdaConstruct: jest.fn().mockImplementation((scope, id, role, securityGroup, subnets, config) => ({
    lambdaFunction: {
      functionName: `lambda-${id}-${config.environment}`,
      arn: `arn:aws:lambda:${config.region}:123456789012:function:lambda-${id}-${config.environment}`
    },
    logGroup: {
      name: `/aws/lambda/lambda-${id}-${config.environment}`
    }
  })),
  ApiGatewayConstruct: jest.fn().mockImplementation((scope, id, lambdaFunction, config) => ({
    api: {
      id: `api-${id}-12345`,
      name: `api-${config.environment}`
    },
    wafAcl: {
      arn: `arn:aws:wafv2:${config.region}:123456789012:regional/webacl/waf-${id}/12345`
    }
  })),
  RdsConstruct: jest.fn().mockImplementation((scope, id, securityGroup, subnets, kmsKey, config) => ({
    dbInstance: {
      id: `rds-${id}-${config.environment}`,
      endpoint: `rds-${id}-${config.environment}.cluster-xyz.${config.region}.rds.amazonaws.com`,
      dbName: config.dbName
    }
  })),
  VpcFlowLogsConstruct: jest.fn().mockImplementation((scope, id, vpc, flowLogsRole, config) => ({
    logGroup: {
      name: `/aws/vpc/flowlogs/${config.environment}`
    }
  })),
  MonitoringConstruct: jest.fn().mockImplementation((scope, id, lambdaFunction, config) => ({
    snsTopic: {
      arn: `arn:aws:sns:${config.region}:123456789012:monitoring-topic-${config.environment}`,
      name: `monitoring-topic-${config.environment}`
    },
    cpuAlarm: {
      arn: `arn:aws:cloudwatch:${config.region}:123456789012:alarm:cpu-alarm-${config.environment}`
    },
    errorAlarm: {
      arn: `arn:aws:cloudwatch:${config.region}:123456789012:alarm:error-alarm-${config.environment}`
    }
  })),
  ShieldConstruct: jest.fn().mockImplementation((scope, id) => ({}))
}));

// Mock CDKTF constructs to avoid duplicate construct errors
jest.mock("cdktf", () => {
  const actual = jest.requireActual("cdktf");
  return {
    ...actual,
    TerraformOutput: jest.fn(),
    TerraformVariable: jest.fn().mockImplementation((scope, id, config) => ({
      stringValue: config.default
    })),
    S3Backend: jest.fn(),
  };
});

// Mock AWS Provider
jest.mock("@cdktf/provider-aws/lib/provider", () => ({
  AwsProvider: jest.fn(),
}));

describe("TapStack Unit Tests", () => {
  const { 
    SecureVpcConstruct,
    SecurityGroupsConstruct,
    KmsConstruct,
    IamConstruct,
    S3Construct,
    LambdaConstruct,
    ApiGatewayConstruct,
    RdsConstruct,
    VpcFlowLogsConstruct,
    MonitoringConstruct,
    ShieldConstruct
  } = require("../lib/modules");
  const { TerraformOutput, TerraformVariable, S3Backend } = require("cdktf");
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
              Project: 'acme-secure-infrastructure',
              Environment: 'dev',
              ManagedBy: 'CDKTF',
              Owner: 'DevOps Team',
              CostCenter: 'IT-Security',
              Compliance: 'SOC2-Required',
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

  test("should create Terraform variables with correct defaults", () => {
    const app = new App();
    new TapStack(app, "TestStackVariables");

    expect(TerraformVariable).toHaveBeenCalledWith(
      expect.anything(),
      'vpc_cidr',
      {
        type: 'string',
        default: '10.0.0.0/16',
        description: 'CIDR block for the VPC',
      }
    );

    expect(TerraformVariable).toHaveBeenCalledWith(
      expect.anything(),
      'allowed_ssh_cidr',
      {
        type: 'string',
        default: '203.0.113.0/24',
        description: 'Company IP range allowed for SSH access (e.g., 203.0.113.0/24)',
      }
    );

    expect(TerraformVariable).toHaveBeenCalledWith(
      expect.anything(),
      'db_username',
      {
        type: 'string',
        default: 'admin',
        description: 'Database administrator username',
      }
    );

    expect(TerraformVariable).toHaveBeenCalledWith(
      expect.anything(),
      'db_name',
      {
        type: 'string',
        default: 'appdb',
        description: 'Database name',
      }
    );

    expect(TerraformVariable).toHaveBeenCalledWith(
      expect.anything(),
      'company_name',
      {
        type: 'string',
        default: 'acme',
        description: 'Company name for resource naming and tagging',
      }
    );
  });

  test("should create module configuration with correct default values", () => {
    const app = new App();
    new TapStack(app, "TestStackConfig");

    const expectedConfig = {
      region: 'us-east-1',
      vpcCidr: '10.0.0.0/16',
      allowedSshCidr: '203.0.113.0/24',
      dbUsername: 'admin',
      dbName: 'appdb',
      companyName: 'acme',
      environment: 'dev',
    };

    expect(SecureVpcConstruct).toHaveBeenCalledWith(
      expect.anything(),
      "vpc",
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
      region: 'eu-west-1',
      vpcCidr: '10.0.0.0/16',
      allowedSshCidr: '203.0.113.0/24',
      dbUsername: 'admin',
      dbName: 'appdb',
      companyName: 'acme',
      environment: 'staging',
    };

    expect(SecureVpcConstruct).toHaveBeenCalledWith(
      expect.anything(),
      "vpc",
      expectedConfig
    );
  });

  test("should create all modules in correct order with proper dependencies", () => {
    const app = new App();
    new TapStack(app, "TestStackModules");

    // Verify all modules are created once
    expect(SecureVpcConstruct).toHaveBeenCalledTimes(1);
    expect(SecurityGroupsConstruct).toHaveBeenCalledTimes(1);
    expect(KmsConstruct).toHaveBeenCalledTimes(1);
    expect(IamConstruct).toHaveBeenCalledTimes(1);
    expect(S3Construct).toHaveBeenCalledTimes(1);
    expect(LambdaConstruct).toHaveBeenCalledTimes(1);
    expect(ApiGatewayConstruct).toHaveBeenCalledTimes(1);
    expect(RdsConstruct).toHaveBeenCalledTimes(1);
    expect(VpcFlowLogsConstruct).toHaveBeenCalledTimes(1);
    expect(MonitoringConstruct).toHaveBeenCalledTimes(1);
    expect(ShieldConstruct).toHaveBeenCalledTimes(1);
  });

  test("should create security groups module with VPC dependency", () => {
    const app = new App();
    new TapStack(app, "TestStackSecurityGroups");

    // Get the mocked VPC construct result
    const vpcInstance = SecureVpcConstruct.mock.results[0].value;

    expect(SecurityGroupsConstruct).toHaveBeenCalledWith(
      expect.anything(),
      "security-groups",
      vpcInstance.vpc,
      expect.objectContaining({
        environment: 'dev',
        companyName: 'acme'
      })
    );
  });

  test("should create S3 construct with KMS dependency", () => {
    const app = new App();
    new TapStack(app, "TestStackS3");

    const kmsInstance = KmsConstruct.mock.results[0].value;

    expect(S3Construct).toHaveBeenCalledWith(
      expect.anything(),
      "s3",
      kmsInstance.kmsKey,
      expect.objectContaining({
        environment: 'dev',
        companyName: 'acme'
      })
    );
  });

  test("should create Lambda construct with all dependencies", () => {
    const app = new App();
    new TapStack(app, "TestStackLambda");

    const vpcInstance = SecureVpcConstruct.mock.results[0].value;
    const securityGroupsInstance = SecurityGroupsConstruct.mock.results[0].value;
    const iamInstance = IamConstruct.mock.results[0].value;

    expect(LambdaConstruct).toHaveBeenCalledWith(
      expect.anything(),
      "lambda",
      iamInstance.lambdaRole,
      securityGroupsInstance.lambdaSecurityGroup,
      vpcInstance.privateSubnets,
      expect.objectContaining({
        environment: 'dev'
      })
    );
  });

  test("should create API Gateway construct with Lambda dependency", () => {
    const app = new App();
    new TapStack(app, "TestStackApiGateway");

    const lambdaInstance = LambdaConstruct.mock.results[0].value;

    expect(ApiGatewayConstruct).toHaveBeenCalledWith(
      expect.anything(),
      "api-gateway",
      lambdaInstance.lambdaFunction,
      expect.objectContaining({
        environment: 'dev'
      })
    );
  });

  test("should create RDS construct with all dependencies", () => {
    const app = new App();
    new TapStack(app, "TestStackRds");

    const vpcInstance = SecureVpcConstruct.mock.results[0].value;
    const securityGroupsInstance = SecurityGroupsConstruct.mock.results[0].value;
    const kmsInstance = KmsConstruct.mock.results[0].value;

    expect(RdsConstruct).toHaveBeenCalledWith(
      expect.anything(),
      "rds",
      securityGroupsInstance.dbSecurityGroup,
      vpcInstance.privateSubnets,
      kmsInstance.kmsKey,
      expect.objectContaining({
        environment: 'dev'
      })
    );
  });

  test("should create VPC Flow Logs construct with dependencies", () => {
    const app = new App();
    new TapStack(app, "TestStackFlowLogs");

    const vpcInstance = SecureVpcConstruct.mock.results[0].value;

    expect(VpcFlowLogsConstruct).toHaveBeenCalledWith(
      expect.anything(),
      "flow-logs",
      vpcInstance.vpc,
      vpcInstance.flowLogsRole,
      expect.objectContaining({
        environment: 'dev'
      })
    );
  });

  test("should create Monitoring construct with Lambda dependency", () => {
    const app = new App();
    new TapStack(app, "TestStackMonitoring");

    const lambdaInstance = LambdaConstruct.mock.results[0].value;

    expect(MonitoringConstruct).toHaveBeenCalledWith(
      expect.anything(),
      "monitoring",
      lambdaInstance.lambdaFunction,
      expect.objectContaining({
        environment: 'dev'
      })
    );
  });

  test("should create Shield construct", () => {
    const app = new App();
    new TapStack(app, "TestStackShield");

    expect(ShieldConstruct).toHaveBeenCalledWith(
      expect.anything(),
      "shield"
    );
  });

  test("should create all required Terraform outputs", () => {
    const app = new App();
    new TapStack(app, "TestStackOutputs");

    // Should create 17 outputs based on the actual code
    expect(TerraformOutput).toHaveBeenCalledTimes(18);

    // Verify key outputs
    expect(TerraformOutput).toHaveBeenCalledWith(
      expect.anything(),
      "vpc_id",
      expect.objectContaining({
        description: "ID of the created VPC",
      })
    );

    expect(TerraformOutput).toHaveBeenCalledWith(
      expect.anything(),
      "api_gateway_url",
      expect.objectContaining({
        description: "URL of the API Gateway endpoint",
      })
    );

    expect(TerraformOutput).toHaveBeenCalledWith(
      expect.anything(),
      "rds_endpoint",
      expect.objectContaining({
        description: "RDS database endpoint",
        sensitive: true,
      })
    );

    expect(TerraformOutput).toHaveBeenCalledWith(
      expect.anything(),
      "lambda_function_arn",
      expect.objectContaining({
        description: "ARN of the Lambda function",
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

    expect(SecureVpcConstruct).toHaveBeenCalledWith(
      expect.anything(),
      "vpc",
      expect.anything()
    );

    expect(SecurityGroupsConstruct).toHaveBeenCalledWith(
      expect.anything(),
      "security-groups",
      expect.anything(),
      expect.anything()
    );

    expect(KmsConstruct).toHaveBeenCalledWith(
      expect.anything(),
      "kms",
      expect.anything()
    );

    expect(IamConstruct).toHaveBeenCalledWith(
      expect.anything(),
      "iam",
      expect.anything()
    );

    expect(S3Construct).toHaveBeenCalledWith(
      expect.anything(),
      "s3",
      expect.anything(),
      expect.anything()
    );

    expect(LambdaConstruct).toHaveBeenCalledWith(
      expect.anything(),
      "lambda",
      expect.anything(),
      expect.anything(),
      expect.anything(),
      expect.anything()
    );

    expect(ApiGatewayConstruct).toHaveBeenCalledWith(
      expect.anything(),
      "api-gateway",
      expect.anything(),
      expect.anything()
    );

    expect(RdsConstruct).toHaveBeenCalledWith(
      expect.anything(),
      "rds",
      expect.anything(),
      expect.anything(),
      expect.anything(),
      expect.anything()
    );

    expect(VpcFlowLogsConstruct).toHaveBeenCalledWith(
      expect.anything(),
      "flow-logs",
      expect.anything(),
      expect.anything(),
      expect.anything()
    );

    expect(MonitoringConstruct).toHaveBeenCalledWith(
      expect.anything(),
      "monitoring",
      expect.anything(),
      expect.anything()
    );

    expect(ShieldConstruct).toHaveBeenCalledWith(
      expect.anything(),
      "shield"
    );
  });

  test("should override AWS region when provided in props", () => {
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
    expect(SecureVpcConstruct).toHaveBeenCalledWith(
      expect.anything(),
      "vpc",
      expect.objectContaining({
        region: "ap-southeast-1",
      })
    );
  });

  test("should create correct API Gateway URL in outputs", () => {
    const app = new App();
    new TapStack(app, "TestStackApiUrl");

    const apiGatewayInstance = ApiGatewayConstruct.mock.results[0].value;

    expect(TerraformOutput).toHaveBeenCalledWith(
      expect.anything(),
      "api_gateway_url",
      expect.objectContaining({
        value: `https://${apiGatewayInstance.api.id}.execute-api.us-east-1.amazonaws.com/dev`,
      })
    );
  });

  test("should pass correct config to all constructs", () => {
    const app = new App();
    new TapStack(app, "TestStackConfigPassing", {
      environmentSuffix: "production",
      awsRegion: "eu-west-1"
    });

    const expectedConfig = {
      region: 'eu-west-1',
      vpcCidr: '10.0.0.0/16',
      allowedSshCidr: '203.0.113.0/24',
      dbUsername: 'admin',
      dbName: 'appdb',
      companyName: 'acme',
      environment: 'production',
    };

    // All constructs should receive the same config
    expect(SecureVpcConstruct).toHaveBeenCalledWith(
      expect.anything(),
      "vpc",
      expectedConfig
    );

    expect(KmsConstruct).toHaveBeenCalledWith(
      expect.anything(),
      "kms",
      expectedConfig
    );

    expect(IamConstruct).toHaveBeenCalledWith(
      expect.anything(),
      "iam",
      expectedConfig
    );
  });
});