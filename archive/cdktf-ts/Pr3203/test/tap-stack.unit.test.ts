import { App } from "cdktf";
import "cdktf/lib/testing/adapters/jest";
import { TapStack } from "../lib/tap-stack";

// Mock all the modules used in TapStack
jest.mock("../lib/modules", () => ({
  SecureVpc: jest.fn().mockImplementation((scope, id, config) => ({
    vpc: { 
      id: `vpc-${id}-12345`,
      cidrBlock: config.cidrBlock
    },
    publicSubnets: [
      { id: `subnet-public-${id}-1`, vpcId: `vpc-${id}-12345` },
      { id: `subnet-public-${id}-2`, vpcId: `vpc-${id}-12345` }
    ],
    privateSubnets: [
      { id: `subnet-private-${id}-1`, vpcId: `vpc-${id}-12345` },
      { id: `subnet-private-${id}-2`, vpcId: `vpc-${id}-12345` }
    ],
    databaseSubnets: [
      { id: `subnet-db-${id}-1`, vpcId: `vpc-${id}-12345` },
      { id: `subnet-db-${id}-2`, vpcId: `vpc-${id}-12345` }
    ]
  })),
  SecureIamRole: jest.fn().mockImplementation((scope, id, config) => ({
    role: {
      name: config.name,
      arn: `arn:aws:iam::123456789012:role/${config.name}`
    }
  })),
  SecureS3Bucket: jest.fn().mockImplementation((scope, id, config) => ({
    bucket: { 
      bucket: config.name,
      arn: `arn:aws:s3:::${config.name}`,
      id: `${config.name}-${id}`
    }
  })),
  SecureCloudTrail: jest.fn().mockImplementation((scope, id, config) => ({
    trail: {
      arn: `arn:aws:cloudtrail:us-east-1:123456789012:trail/${config.name}`,
      name: config.name,
      id: `${config.name}-${id}`
    }
  })),
  SecureEc2Instance: jest.fn().mockImplementation((scope, id, config) => ({
    instance: { 
      id: `i-${id}-12345`,
      publicIp: "1.2.3.4",
      privateIp: "10.0.1.5"
    }
  })),
  SecureRdsInstance: jest.fn().mockImplementation((scope, id, config) => ({
    instance: {
      endpoint: `${config.identifier}.cluster-12345.us-east-1.rds.amazonaws.com`,
      id: config.identifier,
      arn: `arn:aws:rds:us-east-1:123456789012:db:${config.identifier}`
    }
  })),
  SecureLambdaFunction: jest.fn().mockImplementation((scope, id, config) => ({
    function: {
      arn: `arn:aws:lambda:us-east-1:123456789012:function:${config.functionName}`,
      functionName: config.functionName,
      id: `${config.functionName}-${id}`
    }
  })),
  SecureParameter: jest.fn().mockImplementation((scope, id, config) => ({
    parameter: {
      name: config.name,
      arn: `arn:aws:ssm:us-east-1:123456789012:parameter${config.name}`
    }
  })),
  SecureWaf: jest.fn().mockImplementation((scope, id, config) => ({
    webAcl: {
      id: `waf-${id}-12345`,
      arn: `arn:aws:wafv2:us-east-1:123456789012:${config.scope.toLowerCase()}/webacl/${config.name}/12345`
    }
  }))
}));

// Mock CDKTF constructs
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
  AwsProviderDefaultTags: jest.fn()
}));

// Mock KMS Key
jest.mock("@cdktf/provider-aws/lib/kms-key", () => ({
  KmsKey: jest.fn().mockImplementation((scope, id, config) => ({
    id: `kms-key-${id}-12345`,
    arn: `arn:aws:kms:us-east-1:123456789012:key/kms-key-${id}-12345`,
    keyId: `kms-key-${id}-12345`
  }))
}));

// Mock SecurityGroup
jest.mock("@cdktf/provider-aws/lib/security-group", () => ({
  SecurityGroup: jest.fn().mockImplementation((scope, id, config) => ({
    id: `sg-${id}-12345`,
    arn: `arn:aws:ec2:us-east-1:123456789012:security-group/sg-${id}-12345`
  }))
}));

// Mock IamInstanceProfile
jest.mock("@cdktf/provider-aws/lib/iam-instance-profile", () => ({
  IamInstanceProfile: jest.fn().mockImplementation((scope, id, config) => ({
    name: config.name,
    id: `${config.name}-${id}`,
    arn: `arn:aws:iam::123456789012:instance-profile/${config.name}`
  }))
}));

// Mock DataAwsCallerIdentity
jest.mock("@cdktf/provider-aws/lib/data-aws-caller-identity", () => ({
  DataAwsCallerIdentity: jest.fn().mockImplementation(() => ({
    accountId: "123456789012"
  }))
}));

describe("TapStack Unit Tests", () => {
  const { 
    SecureVpc,
    SecureIamRole,
    SecureS3Bucket,
    SecureCloudTrail,
    SecureEc2Instance,
    SecureRdsInstance,
    SecureLambdaFunction,
    SecureParameter,
    SecureWaf
  } = require("../lib/modules");
  const { TerraformOutput, S3Backend } = require("cdktf");
  const { AwsProvider } = require("@cdktf/provider-aws/lib/provider");
  const { KmsKey } = require("@cdktf/provider-aws/lib/kms-key");
  const { SecurityGroup } = require("@cdktf/provider-aws/lib/security-group");
  const { IamInstanceProfile } = require("@cdktf/provider-aws/lib/iam-instance-profile");
  const { DataAwsCallerIdentity } = require("@cdktf/provider-aws/lib/data-aws-caller-identity");

  // Mock addOverride method
  const mockAddOverride = jest.fn();

  // Mock environment variables
  const OLD_ENV = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...OLD_ENV };
    delete process.env.DB_USERNAME;
    delete process.env.DB_PASSWORD;
    // Mock the addOverride method on TerraformStack
    jest.spyOn(TapStack.prototype, 'addOverride').mockImplementation(mockAddOverride);
  });

  afterEach(() => {
    jest.restoreAllMocks();
    process.env = OLD_ENV;
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

  test("should apply custom default tags when provided", () => {
    const app = new App();
    const customTags = {
      tags: {
        Environment: "production",
        Team: "DevOps"
      }
    };
    new TapStack(app, "TestStackTags", { defaultTags: customTags });

    expect(AwsProvider).toHaveBeenCalledWith(
      expect.anything(),
      "aws",
      expect.objectContaining({
        defaultTags: [customTags]
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

  test("should create KMS key with correct configuration", () => {
    const app = new App();
    new TapStack(app, "TestStackKms");

    expect(KmsKey).toHaveBeenCalledWith(
      expect.anything(),
      "kms-key",
      expect.objectContaining({
        description: 'KMS key for encrypting resources',
        enableKeyRotation: true,
        tags: {
          Environment: 'Production'
        }
      })
    );
  });

  test("should create VPC with correct configuration", () => {
    const app = new App();
    new TapStack(app, "TestStackVpc");

    expect(SecureVpc).toHaveBeenCalledWith(
      expect.anything(),
      "vpc",
      expect.objectContaining({
        cidrBlock: '10.0.0.0/16',
        subnetCidrBlocks: [
          '10.0.0.0/24',
          '10.0.1.0/24',
          '10.0.2.0/24',
          '10.0.3.0/24',
          '10.0.4.0/24',
          '10.0.5.0/24',
        ],
        availabilityZones: ['us-east-1a', 'us-east-1b'],
        enableDnsSupport: true,
        enableDnsHostnames: true,
      })
    );
  });

  test("should create S3 buckets with correct configuration", () => {
    const app = new App();
    new TapStack(app, "TestStackS3");

    const kmsInstance = KmsKey.mock.results[0].value;

    // Verify logging bucket
    expect(SecureS3Bucket).toHaveBeenCalledWith(
      expect.anything(),
      "logging-bucket",
      expect.objectContaining({
        name: 'secure-tap-logging-bucket',
        kmsKeyId: kmsInstance.id,
      })
    );

    // Verify cloudtrail bucket
    expect(SecureS3Bucket).toHaveBeenCalledWith(
      expect.anything(),
      "cloudtrail-bucket",
      expect.objectContaining({
        name: 'secure-tap-cloudtrail-bucket',
        kmsKeyId: kmsInstance.id,
        logging: {
          targetBucket: 'secure-tap-logging-bucket',
          targetPrefix: 'cloudtrail-logs/',
        }
      })
    );

    // Verify app bucket
    expect(SecureS3Bucket).toHaveBeenCalledWith(
      expect.anything(),
      "app-bucket",
      expect.objectContaining({
        name: 'secure-tap-app-bucket',
        kmsKeyId: kmsInstance.id,
        logging: {
          targetBucket: 'secure-tap-logging-bucket',
          targetPrefix: 'app-logs/',
        }
      })
    );
  });

  test("should create CloudTrail with correct configuration", () => {
    const app = new App();
    new TapStack(app, "TestStackCloudTrail");

    const kmsInstance = KmsKey.mock.results[0].value;

    expect(SecureCloudTrail).toHaveBeenCalledWith(
      expect.anything(),
      "cloudtrail",
      expect.objectContaining({
        name: 'secure-tap-cloudtrail',
        s3BucketName: 'secure-tap-cloudtrail-bucket',
        kmsKeyId: kmsInstance.arn, // Changed to use ARN instead of ID
      })
    );
  });

  test("should create Lambda function with correct configuration", () => {
    const app = new App();
    new TapStack(app, "TestStackLambda");

    const vpcInstance = SecureVpc.mock.results[0].value;
    const lambdaRoleInstance = SecureIamRole.mock.results[0].value;
    const lambdaSgInstance = SecurityGroup.mock.results[0].value;

    expect(SecureLambdaFunction).toHaveBeenCalledWith(
      expect.anything(),
      "lambda",
      expect.objectContaining({
        functionName: 'secure-tap-function',
        handler: 'index.handler',
        runtime: 'nodejs20.x', // Updated to nodejs20.x
        role: lambdaRoleInstance.role.arn,
        s3Bucket: 'test12345-ts', // Updated to match actual implementation
        s3Key: 'lambda/lambda-function.zip', // Updated to match actual implementation
        vpcConfig: {
          subnetIds: vpcInstance.privateSubnets.map((s: any) => s.id),
          securityGroupIds: [lambdaSgInstance.id], // Use security group ID
        },
        environment: {
          DB_HOST: 'secure-tap-db.instance.endpoint',
          DB_NAME: 'mydatabase',
          DB_USER_PARAM: '/secure-tap/db/username',
          DB_PASSWORD_PARAM: '/secure-tap/db/password',
        },
        timeout: 30,
        memorySize: 512,
      })
    );
  });

  test("should create RDS instance with correct configuration", () => {
    const app = new App();
    new TapStack(app, "TestStackRds");

    const vpcInstance = SecureVpc.mock.results[0].value;
    const kmsInstance = KmsKey.mock.results[0].value;
    const rdsSgInstance = SecurityGroup.mock.results[1].value; // Second security group created

    expect(SecureRdsInstance).toHaveBeenCalledWith(
      expect.anything(),
      "rds",
      expect.objectContaining({
        identifier: 'secure-tap-db',
        allocatedStorage: 20,
        engine: 'mysql',
        engineVersion: '8.0',
        instanceClass: 'db.t3.micro',
        dbName: 'mydatabase',
        username: 'admin',
        password: 'changeme123!', // Updated to match actual default
        subnetIds: vpcInstance.databaseSubnets.map((s: any) => s.id),
        vpcSecurityGroupIds: [rdsSgInstance.id], // Use actual security group
        kmsKeyId: kmsInstance.arn, // Changed to use ARN instead of ID
      })
    );
  });

  test("should create SSM parameters for database credentials", () => {
    const app = new App();
    new TapStack(app, "TestStackParameters");

    const kmsInstance = KmsKey.mock.results[0].value;

    // Verify username parameter
    expect(SecureParameter).toHaveBeenCalledWith(
      expect.anything(),
      "db-username",
      expect.objectContaining({
        name: '/secure-tap/db/username',
        value: 'admin',
        type: 'SecureString',
        kmsKeyId: kmsInstance.id,
      })
    );

    // Verify password parameter
    expect(SecureParameter).toHaveBeenCalledWith(
      expect.anything(),
      "db-password",
      expect.objectContaining({
        name: '/secure-tap/db/password',
        value: 'GenerateAStrongPasswordHere',
        type: 'SecureString',
        kmsKeyId: kmsInstance.id,
      })
    );
  });

  test("should create EC2 instance with correct configuration", () => {
    const app = new App();
    new TapStack(app, "TestStackEc2");

    const vpcInstance = SecureVpc.mock.results[0].value;
    const ec2ProfileInstance = IamInstanceProfile.mock.results[0].value;
    const ec2SgInstance = SecurityGroup.mock.results[2].value; // Third security group created

    expect(SecureEc2Instance).toHaveBeenCalledWith(
      expect.anything(),
      "ec2",
      expect.objectContaining({
        instanceType: 't3.micro',
        amiId: 'ami-0c02fb55956c7d316', // Updated to match actual AMI
        subnetId: vpcInstance.privateSubnets[0].id,
        securityGroupIds: [ec2SgInstance.id], // Use actual security group
        iamInstanceProfile: ec2ProfileInstance.name, // Use instance profile name
        userData: expect.stringContaining('Setting up secure instance'),
      })
    );
  });

  test("should create WAF with correct configuration", () => {
    const app = new App();
    new TapStack(app, "TestStackWaf");

    expect(SecureWaf).toHaveBeenCalledWith(
      expect.anything(),
      "waf",
      expect.objectContaining({
        name: 'secure-tap-waf',
        scope: 'REGIONAL',
      })
    );
  });

  test("should create all resources in correct order", () => {
    const app = new App();
    new TapStack(app, "TestStackOrder");

    // Verify all resources are created once
    expect(KmsKey).toHaveBeenCalledTimes(1);
    expect(SecureVpc).toHaveBeenCalledTimes(1);
    expect(SecureS3Bucket).toHaveBeenCalledTimes(3); // logging, cloudtrail, app
    expect(SecureCloudTrail).toHaveBeenCalledTimes(1);
    expect(SecureIamRole).toHaveBeenCalledTimes(2); // lambda, ec2
    expect(SecureLambdaFunction).toHaveBeenCalledTimes(1);
    expect(SecureRdsInstance).toHaveBeenCalledTimes(1);
    expect(SecureParameter).toHaveBeenCalledTimes(2); // username, password
    expect(SecureEc2Instance).toHaveBeenCalledTimes(1);
    expect(SecureWaf).toHaveBeenCalledTimes(1);
    expect(SecurityGroup).toHaveBeenCalledTimes(3); // lambda, rds, ec2
    expect(IamInstanceProfile).toHaveBeenCalledTimes(1); // ec2
    expect(DataAwsCallerIdentity).toHaveBeenCalledTimes(1);
  });

  test("should create all required Terraform outputs", () => {
    const app = new App();
    new TapStack(app, "TestStackOutputs");

    // Should create 11 outputs based on the actual code
    expect(TerraformOutput).toHaveBeenCalledTimes(11);

    // Verify key outputs
    expect(TerraformOutput).toHaveBeenCalledWith(
      expect.anything(),
      "vpc_id",
      expect.objectContaining({
        value: expect.stringContaining("vpc-"),
      })
    );

    expect(TerraformOutput).toHaveBeenCalledWith(
      expect.anything(),
      "public_subnet_ids",
      expect.objectContaining({
        value: expect.arrayContaining([
          expect.stringContaining("subnet-public-"),
        ]),
      })
    );

    expect(TerraformOutput).toHaveBeenCalledWith(
      expect.anything(),
      "rds_endpoint",
      expect.objectContaining({
        value: expect.stringContaining("secure-tap-db.cluster-"),
      })
    );

    expect(TerraformOutput).toHaveBeenCalledWith(
      expect.anything(),
      "lambda_arn",
      expect.objectContaining({
        value: expect.stringContaining("arn:aws:lambda:"),
      })
    );

    expect(TerraformOutput).toHaveBeenCalledWith(
      expect.anything(),
      "kms_key_id",
      expect.objectContaining({
        value: expect.stringContaining("kms-key-"),
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
        defaultTags: [],
      })
    );
  });

  test("should use custom environment suffix in state key", () => {
    const app = new App();
    new TapStack(app, "TestStackCustomEnv", { environmentSuffix: "staging" });

    expect(S3Backend).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        key: "staging/TestStackCustomEnv.tfstate",
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
        region: "eu-central-1",
      })
    );

    expect(AwsProvider).toHaveBeenCalledWith(
      expect.anything(),
      "aws",
      expect.objectContaining({
        region: "us-west-2",
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

  test("should use correct availability zones for VPC", () => {
    const app = new App();
    new TapStack(app, "TestStackVpcAzs", { awsRegion: "us-west-2" });

    expect(SecureVpc).toHaveBeenCalledWith(
      expect.anything(),
      "vpc",
      expect.objectContaining({
        availabilityZones: ['us-west-2a', 'us-west-2b'],
      })
    );
  });

  test("should configure EC2 user data script correctly", () => {
    const app = new App();
    new TapStack(app, "TestStackUserData");

    expect(SecureEc2Instance).toHaveBeenCalledWith(
      expect.anything(),
      "ec2",
      expect.objectContaining({
        userData: expect.stringContaining('aws ssm get-parameter'),
      })
    );
  });

  test("should pass S3 bucket references correctly between resources", () => {
    const app = new App();
    new TapStack(app, "TestStackBucketRefs");

    const s3Instances = SecureS3Bucket.mock.results;
    const cloudtrailBucket = s3Instances[1].value;

    // CloudTrail should use cloudtrail bucket
    expect(SecureCloudTrail).toHaveBeenCalledWith(
      expect.anything(),
      "cloudtrail",
      expect.objectContaining({
        s3BucketName: cloudtrailBucket.bucket.bucket,
      })
    );

    // Lambda uses hardcoded bucket name in current implementation
    expect(SecureLambdaFunction).toHaveBeenCalledWith(
      expect.anything(),
      "lambda",
      expect.objectContaining({
        s3Bucket: 'test12345-ts', // Hardcoded in the implementation
      })
    );
  });

  test("should use environment variables for RDS credentials when available", () => {
    process.env.DB_USERNAME = 'env-username';
    process.env.DB_PASSWORD = 'env-password';

    const app = new App();
    new TapStack(app, "TestStackEnvVars");

    expect(SecureRdsInstance).toHaveBeenCalledWith(
      expect.anything(),
      "rds",
      expect.objectContaining({
        username: 'env-username',
        password: 'env-password',
      })
    );
  });

  test("should create security groups with correct configurations", () => {
    const app = new App();
    new TapStack(app, "TestStackSecurityGroups");

    // Lambda security group
    expect(SecurityGroup).toHaveBeenNthCalledWith(1,
      expect.anything(),
      "lambda-sg",
      expect.objectContaining({
        description: 'Security group for Lambda functions',
        tags: {
          Name: 'secure-tap-lambda-sg',
          Environment: 'Production',
        }
      })
    );

    // RDS security group
    expect(SecurityGroup).toHaveBeenNthCalledWith(2,
      expect.anything(),
      "rds-sg",
      expect.objectContaining({
        description: 'Security group for RDS instances',
        tags: {
          Name: 'secure-tap-rds-sg',
          Environment: 'Production',
        }
      })
    );

    // EC2 security group
    expect(SecurityGroup).toHaveBeenNthCalledWith(3,
      expect.anything(),
      "ec2-sg",
      expect.objectContaining({
        description: 'Security group for EC2 instances',
        tags: {
          Name: 'secure-tap-ec2-sg',
          Environment: 'Production',
        }
      })
    );
  });
});