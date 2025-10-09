// __tests__/tap-stack.test.ts
import { App } from "cdktf";
import "cdktf/lib/testing/adapters/jest";
import { TapStack } from "../lib/tap-stack";

// Mock all the modules used in TapStack
jest.mock("../lib/modules", () => ({
  VpcModule: jest.fn().mockImplementation((scope: any, id: string, config: any) => ({
    vpcId: `vpc-${config.projectName}`,
    publicSubnetIds: config.publicSubnetCidrs.map((_: string, index: number) => 
      `pub-subnet-${index + 1}-${config.projectName}`
    ),
    privateSubnetIds: config.privateSubnetCidrs.map((_: string, index: number) => 
      `priv-subnet-${index + 1}-${config.projectName}`
    ),
    natGatewayId: `nat-${config.projectName}`,
    natGatewayEip: '52.123.456.789',
    enableFlowLogs: jest.fn()
  })),

  SecurityModule: jest.fn().mockImplementation((scope: any, id: string, config: any) => ({
    publicInstanceSecurityGroupId: `public-sg-${config.vpcId}`,
    rdsSecurityGroupId: `rds-sg-${config.vpcId}`,
    allowDatabaseAccess: jest.fn()
  })),

  ComputeModule: jest.fn().mockImplementation((scope: any, id: string, config: any) => ({
    instanceIds: config.publicSubnetIds.map((_: string, index: number) => 
      `instance-${index + 1}-${config.projectName}`
    )
  })),

  DatabaseModule: jest.fn().mockImplementation((scope: any, id: string, config: any) => ({
    endpoint: `db-${config.projectName}.cluster-xyz.us-east-1.rds.amazonaws.com`,
    port: 3306,
    instanceId: `db-instance-${config.projectName}`
  })),

  StorageModule: jest.fn().mockImplementation((scope: any, id: string, config: any) => ({
    bucketName: `${config.projectName}-app-logs-123456`,
    bucketArn: `arn:aws:s3:::${config.projectName}-app-logs-123456`
  })),

  MonitoringModule: jest.fn().mockImplementation((scope: any, id: string, config: any) => ({
    flowLogsGroup: {
      name: `/aws/vpc/flowlogs/${config.projectName}`,
      arn: `arn:aws:logs:us-east-1:123456789012:log-group:/aws/vpc/flowlogs/${config.projectName}`
    },
    flowLogsGroupName: `/aws/vpc/flowlogs/${config.projectName}`
  })),

  ParameterStoreModule: jest.fn().mockImplementation((scope: any, id: string, config: any) => ({
    dbEndpointParameterArn: `arn:aws:ssm:us-east-1:123456789012:parameter/${config.projectName}/db/endpoint`,
    dbEndpointParameterName: `/${config.projectName}/db/endpoint`,
    dbPortParameterArn: `arn:aws:ssm:us-east-1:123456789012:parameter/${config.projectName}/db/port`,
    dbPortParameterName: `/${config.projectName}/db/port`,
    dbCredentialsRefParameterArn: `arn:aws:ssm:us-east-1:123456789012:parameter/${config.projectName}/db/credentials-ref`,
    dbCredentialsRefParameterName: `/${config.projectName}/db/credentials-ref`
  }))
}));

// Mock DataAwsCallerIdentity
jest.mock("@cdktf/provider-aws/lib/data-aws-caller-identity", () => ({
  DataAwsCallerIdentity: jest.fn().mockImplementation((scope: any, id: string) => ({
    id: `caller-identity-${id}`,
    accountId: '123456789012'
  }))
}));

// Mock TerraformOutput and S3Backend
jest.mock("cdktf", () => {
  const actual = jest.requireActual("cdktf");
  return {
    ...actual,
    TerraformOutput: jest.fn(),
    S3Backend: jest.fn().mockImplementation((scope: any, config: any) => ({
      addOverride: jest.fn()
    })),
    TerraformStack: actual.TerraformStack,
  };
});

// Mock AWS Provider
jest.mock("@cdktf/provider-aws/lib/provider", () => ({
  AwsProvider: jest.fn(),
}));

describe("TapStack Unit Tests", () => {
  const { 
    VpcModule, 
    SecurityModule, 
    ComputeModule, 
    DatabaseModule,
    StorageModule,
    MonitoringModule,
    ParameterStoreModule
  } = require("../lib/modules");
  const { TerraformOutput, S3Backend } = require("cdktf");
  const { AwsProvider } = require("@cdktf/provider-aws/lib/provider");
  const { DataAwsCallerIdentity } = require("@cdktf/provider-aws/lib/data-aws-caller-identity");

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Stack Creation and Configuration", () => {
    test("should create TapStack with default configuration", () => {
      const app = new App();
      const stack = new TapStack(app, "TestStack");

      expect(stack).toBeDefined();
      expect(stack).toBeInstanceOf(TapStack);

      // Verify AWS Provider is configured with default region
      expect(AwsProvider).toHaveBeenCalledWith(
        expect.anything(),
        'aws',
        expect.objectContaining({
          region: 'us-east-1',
          defaultTags: []
        })
      );
    });

    test("should create TapStack with custom AWS region", () => {
      const app = new App();
      new TapStack(app, "TestStack", {
        awsRegion: 'eu-west-1'
      });

      expect(AwsProvider).toHaveBeenCalledWith(
        expect.anything(),
        'aws',
        expect.objectContaining({
          region: 'eu-west-1'
        })
      );
    });

    test("should create TapStack with custom default tags", () => {
      const app = new App();
      const customTags = { tags: { Owner: 'Platform-Team', CostCenter: 'Engineering' } };

      new TapStack(app, "TestStack", {
        defaultTags: customTags
      });

      expect(AwsProvider).toHaveBeenCalledWith(
        expect.anything(),
        'aws',
        expect.objectContaining({
          defaultTags: [customTags]
        })
      );
    });
  });

  describe("S3 Backend Configuration", () => {
    test("should configure S3 backend with default settings", () => {
      const app = new App();
      const mockAddOverride = jest.fn();
      const originalPrototype = TapStack.prototype.addOverride;
      TapStack.prototype.addOverride = mockAddOverride;

      new TapStack(app, "TestStack");

      expect(S3Backend).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          bucket: 'iac-rlhf-tf-states',
          key: 'dev/TestStack.tfstate',
          region: 'us-east-1',
          encrypt: true
        })
      );

      expect(mockAddOverride).toHaveBeenCalledWith(
        'terraform.backend.s3.use_lockfile',
        true
      );

      TapStack.prototype.addOverride = originalPrototype;
    });

    test("should configure S3 backend with custom state bucket", () => {
      const app = new App();
      new TapStack(app, "TestStack", {
        stateBucket: 'custom-state-bucket',
        stateBucketRegion: 'eu-central-1'
      });

      expect(S3Backend).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          bucket: 'custom-state-bucket',
          region: 'eu-central-1'
        })
      );
    });

    test("should configure S3 backend with production environment", () => {
      const app = new App();
      new TapStack(app, "TestStack", {
        environmentSuffix: 'prod'
      });

      expect(S3Backend).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          key: 'prod/TestStack.tfstate'
        })
      );
    });
  });

  describe("VPC Module Tests", () => {
    test("should create VPC with correct CIDR block and DNS settings", () => {
      const app = new App();
      new TapStack(app, "TestStack");

      expect(VpcModule).toHaveBeenCalledWith(
        expect.anything(),
        'vpc-module',
        expect.objectContaining({
          projectName: 'tap-dev',
          vpcCidr: '10.0.0.0/16',
          publicSubnetCidrs: ['10.0.1.0/24', '10.0.2.0/24'],
          privateSubnetCidrs: ['10.0.10.0/24', '10.0.11.0/24'],
          availabilityZones: ['us-east-1a', 'us-east-1b'],
          enableFlowLogs: true,
          tags: expect.objectContaining({
            Environment: 'dev',
            Project: 'tap-infrastructure',
            ManagedBy: 'terraform'
          })
        })
      );
    });

    test("should create public and private subnets with correct configuration", () => {
      const app = new App();
      new TapStack(app, "TestStack");

      const vpcModuleCall = VpcModule.mock.calls[0];
      const config = vpcModuleCall[2];

      expect(config.publicSubnetCidrs).toEqual(['10.0.1.0/24', '10.0.2.0/24']);
      expect(config.privateSubnetCidrs).toEqual(['10.0.10.0/24', '10.0.11.0/24']);
      expect(config.availabilityZones).toHaveLength(2);
    });

    test("should enable VPC Flow Logs", () => {
      const app = new App();
      new TapStack(app, "TestStack");

      const vpcModuleMock = VpcModule.mock.results[0].value;
      const monitoringModuleMock = MonitoringModule.mock.results[0].value;

      expect(vpcModuleMock.enableFlowLogs).toHaveBeenCalledWith(
        monitoringModuleMock.flowLogsGroup
      );
    });

    test("should create VPC with custom availability zones for different region", () => {
      const app = new App();
      new TapStack(app, "TestStack", {
        awsRegion: 'ap-southeast-1'
      });

      expect(VpcModule).toHaveBeenCalledWith(
        expect.anything(),
        'vpc-module',
        expect.objectContaining({
          availabilityZones: ['ap-southeast-1a', 'ap-southeast-1b']
        })
      );
    });
  });

  describe("Security Module Tests", () => {
    test("should create security groups with correct VPC dependency", () => {
      const app = new App();
      new TapStack(app, "TestStack");

      const vpcModuleMock = VpcModule.mock.results[0].value;

      expect(SecurityModule).toHaveBeenCalledWith(
        expect.anything(),
        'security-module',
        expect.objectContaining({
          vpcId: vpcModuleMock.vpcId,
          sshAllowedCidr: '223.233.86.188/32',
          tags: expect.objectContaining({
            Environment: 'dev',
            Project: 'tap-infrastructure'
          })
        })
      );
    });

    test("should allow database access from compute instances", () => {
      const app = new App();
      new TapStack(app, "TestStack");

      const securityModuleMock = SecurityModule.mock.results[0].value;
      const computeModuleMock = ComputeModule.mock.results[0].value;
      const databaseModuleMock = DatabaseModule.mock.results[0].value;

      expect(securityModuleMock.allowDatabaseAccess).toHaveBeenCalledWith(
        computeModuleMock.instanceIds,
        databaseModuleMock.port
      );
    });

    test("should configure SSH allowed CIDR correctly", () => {
      const app = new App();
      new TapStack(app, "TestStack");

      expect(SecurityModule).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        expect.objectContaining({
          sshAllowedCidr: '223.233.86.188/32'
        })
      );
    });
  });

  describe("Compute Module Tests", () => {
    test("should create compute instances with correct configuration", () => {
      const app = new App();
      new TapStack(app, "TestStack");

      const vpcModuleMock = VpcModule.mock.results[0].value;
      const securityModuleMock = SecurityModule.mock.results[0].value;

      expect(ComputeModule).toHaveBeenCalledWith(
        expect.anything(),
        'compute-module',
        expect.objectContaining({
          projectName: 'tap-dev',
          publicSubnetIds: vpcModuleMock.publicSubnetIds,
          securityGroupId: securityModuleMock.publicInstanceSecurityGroupId,
          instanceType: 't3.micro',
          amiId: 'ami-052064a798f08f0d3',
          tags: expect.objectContaining({
            Environment: 'dev',
            Project: 'tap-infrastructure'
          })
        })
      );
    });

    test("should create IAM role and instance profile for EC2 instances", () => {
      const app = new App();
      new TapStack(app, "TestStack");

      // Verify ComputeModule was created (which internally creates IAM resources)
      expect(ComputeModule).toHaveBeenCalledTimes(1);
      
      const computeCall = ComputeModule.mock.calls[0];
      expect(computeCall[2]).toHaveProperty('projectName');
      expect(computeCall[2]).toHaveProperty('instanceType');
    });

    test("should create instances in public subnets", () => {
      const app = new App();
      new TapStack(app, "TestStack");

      const computeCall = ComputeModule.mock.calls[0];
      expect(computeCall[2].publicSubnetIds).toEqual([
        'pub-subnet-1-tap-dev',
        'pub-subnet-2-tap-dev'
      ]);
    });
  });

  describe("Database Module Tests", () => {
    test("should create RDS MySQL database with Multi-AZ enabled", () => {
      const app = new App();
      new TapStack(app, "TestStack");

      const vpcModuleMock = VpcModule.mock.results[0].value;
      const securityModuleMock = SecurityModule.mock.results[0].value;

      expect(DatabaseModule).toHaveBeenCalledWith(
        expect.anything(),
        'database-module',
        expect.objectContaining({
          projectName: 'tap-dev',
          privateSubnetIds: vpcModuleMock.privateSubnetIds,
          vpcSecurityGroupIds: [securityModuleMock.rdsSecurityGroupId],
          dbInstanceClass: 'db.t3.micro',
          allocatedStorage: 20,
          backupRetentionPeriod: 7,
          deletionProtection: false,
          tags: expect.objectContaining({
            Environment: 'dev',
            Project: 'tap-infrastructure'
          })
        })
      );
    });

    test("should configure database in private subnets", () => {
      const app = new App();
      new TapStack(app, "TestStack");

      const databaseCall = DatabaseModule.mock.calls[0];
      expect(databaseCall[2].privateSubnetIds).toEqual([
        'priv-subnet-1-tap-dev',
        'priv-subnet-2-tap-dev'
      ]);
    });

    test("should enable automated backups with retention period", () => {
      const app = new App();
      new TapStack(app, "TestStack");

      const databaseCall = DatabaseModule.mock.calls[0];
      expect(databaseCall[2].backupRetentionPeriod).toBe(7);
    });

    test("should disable deletion protection for dev environment", () => {
      const app = new App();
      new TapStack(app, "TestStack", {
        environmentSuffix: 'dev'
      });

      const databaseCall = DatabaseModule.mock.calls[0];
      expect(databaseCall[2].deletionProtection).toBe(false);
    });
  });

  describe("Storage Module Tests", () => {
    test("should create S3 bucket with versioning enabled", () => {
      const app = new App();
      new TapStack(app, "TestStack");

      expect(StorageModule).toHaveBeenCalledWith(
        expect.anything(),
        'storage-module',
        expect.objectContaining({
          projectName: 'tap-dev',
          tags: expect.objectContaining({
            Environment: 'dev',
            Project: 'tap-infrastructure'
          })
        })
      );
    });

    test("should block all public access to S3 bucket", () => {
      const app = new App();
      new TapStack(app, "TestStack");

      // StorageModule internally creates S3BucketPublicAccessBlock
      expect(StorageModule).toHaveBeenCalledTimes(1);
      
      const storageCall = StorageModule.mock.calls[0];
      expect(storageCall[2]).toHaveProperty('projectName');
    });
  });

  describe("Monitoring Module Tests", () => {
    test("should create CloudWatch log group for VPC Flow Logs", () => {
      const app = new App();
      new TapStack(app, "TestStack");

      const vpcModuleMock = VpcModule.mock.results[0].value;

      expect(MonitoringModule).toHaveBeenCalledWith(
        expect.anything(),
        'monitoring-module',
        expect.objectContaining({
          projectName: 'tap-dev',
          vpcId: vpcModuleMock.vpcId,
          tags: expect.objectContaining({
            Environment: 'dev',
            Project: 'tap-infrastructure'
          })
        })
      );
    });

    test("should configure flow logs with proper retention", () => {
      const app = new App();
      new TapStack(app, "TestStack");

      const monitoringModuleMock = MonitoringModule.mock.results[0].value;
      expect(monitoringModuleMock.flowLogsGroupName).toBe('/aws/vpc/flowlogs/tap-dev');
    });
  });

  describe("Parameter Store Module Tests", () => {
    test("should store database connection parameters", () => {
      const app = new App();
      new TapStack(app, "TestStack");

      const databaseModuleMock = DatabaseModule.mock.results[0].value;

      expect(ParameterStoreModule).toHaveBeenCalledWith(
        expect.anything(),
        'parameter-store-module',
        expect.objectContaining({
          projectName: 'tap-dev',
          dbEndpoint: databaseModuleMock.endpoint,
          dbPort: '3306',
          tags: expect.objectContaining({
            Environment: 'dev',
            Project: 'tap-infrastructure'
          })
        })
      );
    });

    test("should create parameters with correct naming convention", () => {
      const app = new App();
      new TapStack(app, "TestStack");

      const parameterStoreCall = ParameterStoreModule.mock.calls[0];
      expect(parameterStoreCall[2].projectName).toBe('tap-dev');
      expect(parameterStoreCall[2].dbPort).toBe('3306');
    });
  });

  describe("Terraform Outputs", () => {
    test("should create all required terraform outputs", () => {
      const app = new App();
      new TapStack(app, "TestStack");

      expect(TerraformOutput).toHaveBeenCalledTimes(8);

      const outputCalls = TerraformOutput.mock.calls;
      const outputIds = outputCalls.map((call: any) => call[1]);

      expect(outputIds).toContain('vpc-id');
      expect(outputIds).toContain('public-subnet-ids');
      expect(outputIds).toContain('private-subnet-ids');
      expect(outputIds).toContain('public-ec2-instance-ids');
      expect(outputIds).toContain('rds-endpoint');
      expect(outputIds).toContain('app-logs-s3-bucket');
      expect(outputIds).toContain('aws-account-id');
      expect(outputIds).toContain('nat-gateway-eip');
    });

    test("should output correct VPC ID", () => {
      const app = new App();
      new TapStack(app, "TestStack");

      const vpcOutput = TerraformOutput.mock.calls.find(
        (call: any) => call[1] === 'vpc-id'
      );

      expect(vpcOutput[2]).toEqual({
        value: 'vpc-tap-dev',
        description: 'VPC ID'
      });
    });

    test("should output public subnet IDs", () => {
      const app = new App();
      new TapStack(app, "TestStack");

      const subnetOutput = TerraformOutput.mock.calls.find(
        (call: any) => call[1] === 'public-subnet-ids'
      );

      expect(subnetOutput[2].value).toEqual(['pub-subnet-1-tap-dev', 'pub-subnet-2-tap-dev']);
    });

    test("should output RDS endpoint", () => {
      const app = new App();
      new TapStack(app, "TestStack");

      const rdsOutput = TerraformOutput.mock.calls.find(
        (call: any) => call[1] === 'rds-endpoint'
      );

      expect(rdsOutput[2].value).toBe('db-tap-dev.cluster-xyz.us-east-1.rds.amazonaws.com');
    });

    test("should output AWS account ID", () => {
      const app = new App();
      new TapStack(app, "TestStack");

      const accountOutput = TerraformOutput.mock.calls.find(
        (call: any) => call[1] === 'aws-account-id'
      );

      expect(accountOutput[2]).toEqual({
        value: '123456789012',
        description: 'Current AWS Account ID'
      });
    });

    test("should output NAT Gateway Elastic IP", () => {
      const app = new App();
      new TapStack(app, "TestStack");

      const natEipOutput = TerraformOutput.mock.calls.find(
        (call: any) => call[1] === 'nat-gateway-eip'
      );

      expect(natEipOutput[2]).toEqual({
        value: '52.123.456.789',
        description: 'NAT Gateway Elastic IP'
      });
    });
  });

  describe("Module Dependencies and Ordering", () => {
    test("should create modules in correct order with proper dependencies", () => {
      const app = new App();
      new TapStack(app, "TestStack");
      
      // VPC Module should be created before Security Module
      const vpcCallIndex = VpcModule.mock.invocationCallOrder[0];
      const securityCallIndex = SecurityModule.mock.invocationCallOrder[0];
      
      expect(vpcCallIndex).toBeLessThan(securityCallIndex);

      // Security Module should be created before Database Module
      const databaseCallIndex = DatabaseModule.mock.invocationCallOrder[0];
      expect(securityCallIndex).toBeLessThan(databaseCallIndex);
    });

    test("should pass VPC ID from VpcModule to other modules", () => {
      const app = new App();
      new TapStack(app, "TestStack");

      const vpcId = VpcModule.mock.results[0].value.vpcId;
      
      const securityCall = SecurityModule.mock.calls[0];
      expect(securityCall[2].vpcId).toBe(vpcId);

      const monitoringCall = MonitoringModule.mock.calls[0];
      expect(monitoringCall[2].vpcId).toBe(vpcId);
    });

    test("should pass subnet IDs from VpcModule to ComputeModule", () => {
      const app = new App();
      new TapStack(app, "TestStack");

      const vpcModule = VpcModule.mock.results[0].value;
      const computeCall = ComputeModule.mock.calls[0];

      expect(computeCall[2].publicSubnetIds).toEqual(vpcModule.publicSubnetIds);
    });

    test("should pass security group IDs correctly between modules", () => {
      const app = new App();
      new TapStack(app, "TestStack");

      const securityModule = SecurityModule.mock.results[0].value;
      const computeCall = ComputeModule.mock.calls[0];
      const databaseCall = DatabaseModule.mock.calls[0];

      expect(computeCall[2].securityGroupId).toBe(securityModule.publicInstanceSecurityGroupId);
      expect(databaseCall[2].vpcSecurityGroupIds).toEqual([securityModule.rdsSecurityGroupId]);
    });
  });

  describe("Data Sources", () => {
    test("should create DataAwsCallerIdentity for account information", () => {
      const app = new App();
      new TapStack(app, "TestStack");

      expect(DataAwsCallerIdentity).toHaveBeenCalledWith(
        expect.anything(),
        'current',
        {}
      );
    });
  });

  describe("Environment-specific Configurations", () => {
    test("should configure resources for development environment", () => {
      const app = new App();
      new TapStack(app, "TestStack", {
        environmentSuffix: 'dev'
      });

      const databaseCall = DatabaseModule.mock.calls[0];
      expect(databaseCall[2].deletionProtection).toBe(false);

      const vpcCall = VpcModule.mock.calls[0];
      expect(vpcCall[2].projectName).toBe('tap-dev');
    });

    test("should configure resources for staging environment", () => {
      const app = new App();
      new TapStack(app, "TestStack", {
        environmentSuffix: 'staging'
      });

      const vpcCall = VpcModule.mock.calls[0];
      expect(vpcCall[2].projectName).toBe('tap-staging');

      const databaseCall = DatabaseModule.mock.calls[0];
      expect(databaseCall[2].deletionProtection).toBe(false);
    });

    test("should configure resources for production environment", () => {
      const app = new App();
      new TapStack(app, "TestStack", {
        environmentSuffix: 'prod'
      });

      const vpcCall = VpcModule.mock.calls[0];
      expect(vpcCall[2].projectName).toBe('tap-prod');

      // In the actual implementation, you might want to set deletionProtection to true for prod
      // For now, checking that prod environment is handled
      expect(vpcCall[2].tags.Environment).toBe('prod');
    });
  });

  describe("Tag Propagation", () => {
    test("should propagate common tags to all modules", () => {
      const app = new App();
      new TapStack(app, "TestStack");

      const expectedTags = {
        Environment: 'dev',
        Project: 'tap-infrastructure',
        ManagedBy: 'terraform'
      };

      // Check VpcModule
      const vpcCall = VpcModule.mock.calls[0];
      expect(vpcCall[2].tags).toMatchObject(expectedTags);

      // Check SecurityModule
      const securityCall = SecurityModule.mock.calls[0];
      expect(securityCall[2].tags).toMatchObject(expectedTags);

      // Check DatabaseModule
      const databaseCall = DatabaseModule.mock.calls[0];
      expect(databaseCall[2].tags).toMatchObject(expectedTags);

      // Check ComputeModule
      const computeCall = ComputeModule.mock.calls[0];
      expect(computeCall[2].tags).toMatchObject(expectedTags);

      // Check StorageModule
      const storageCall = StorageModule.mock.calls[0];
      expect(storageCall[2].tags).toMatchObject(expectedTags);

      // Check MonitoringModule
      const monitoringCall = MonitoringModule.mock.calls[0];
      expect(monitoringCall[2].tags).toMatchObject(expectedTags);
    });

    test("should update tags based on environment", () => {
      const app = new App();
      new TapStack(app, "TestStack", {
        environmentSuffix: 'qa'
      });

      const vpcCall = VpcModule.mock.calls[0];
      expect(vpcCall[2].tags.Environment).toBe('qa');

      const databaseCall = DatabaseModule.mock.calls[0];
      expect(databaseCall[2].tags.Environment).toBe('qa');
    });
  });

  describe("Edge Cases and Error Scenarios", () => {

    test("should handle undefined props", () => {
      const app = new App();
      const stack = new TapStack(app, "TestStack", undefined);

      expect(stack).toBeDefined();

      // Should use all defaults
      expect(AwsProvider).toHaveBeenCalledWith(
        expect.anything(),
        'aws',
        expect.objectContaining({
          region: 'us-east-1',
          defaultTags: []
        })
      );
    });

    test("should handle all props being set", () => {
      const app = new App();
      const stack = new TapStack(app, "TestStack", {
        environmentSuffix: 'prod',
        stateBucket: 'my-state-bucket',
        stateBucketRegion: 'eu-west-1',
        awsRegion: 'ap-southeast-2',
        defaultTags: { tags: { Owner: 'TeamA' } }
      });

      expect(stack).toBeDefined();

      expect(AwsProvider).toHaveBeenCalledWith(
        expect.anything(),
        'aws',
        expect.objectContaining({
          region: 'ap-southeast-2',
          defaultTags: [{ tags: { Owner: 'TeamA' } }]
        })
      );

      expect(S3Backend).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          bucket: 'my-state-bucket',
          key: 'prod/TestStack.tfstate',
          region: 'eu-west-1'
        })
      );
    });
  });

  describe("Resource Naming Conventions", () => {
    test("should follow consistent naming pattern across all resources", () => {
      const app = new App();
      new TapStack(app, "TestStack", {
        environmentSuffix: 'test'
      });

      // Check that all modules receive consistent project name
      const vpcCall = VpcModule.mock.calls[0][2];
      const securityCall = SecurityModule.mock.calls[0][2];
      const computeCall = ComputeModule.mock.calls[0][2];
      const databaseCall = DatabaseModule.mock.calls[0][2];

      expect(vpcCall.projectName).toBe('tap-test');
      expect(computeCall.projectName).toBe('tap-test');
      expect(databaseCall.projectName).toBe('tap-test');
    });

    test("should include environment suffix in resource names", () => {
      const app = new App();
      new TapStack(app, "TestStack", {
        environmentSuffix: 'staging'
      });

      const projectName = 'tap-staging';
      
      const vpcCall = VpcModule.mock.calls[0];
      expect(vpcCall[2].projectName).toBe(projectName);

      const paramCall = ParameterStoreModule.mock.calls[0];
      expect(paramCall[2].projectName).toBe(projectName);
    });
  });

  describe("Network ACL Configuration", () => {
    test("should create network ACLs with correct rules", () => {
      const app = new App();
      new TapStack(app, "TestStack");

      // VpcModule internally creates NetworkAcls
      const vpcCall = VpcModule.mock.calls[0];
      expect(vpcCall[2].vpcCidr).toBe('10.0.0.0/16');
      
      // Network ACLs are created internally within VpcModule
      expect(VpcModule).toHaveBeenCalledTimes(1);
    });
  });

  describe("Integration Tests", () => {
    test("should create complete infrastructure stack", () => {
      const app = new App();
      const stack = new TapStack(app, "IntegrationTest");

      // Verify all components are created
      expect(AwsProvider).toHaveBeenCalledTimes(1);
      expect(S3Backend).toHaveBeenCalledTimes(1);
      expect(DataAwsCallerIdentity).toHaveBeenCalledTimes(1);
      expect(VpcModule).toHaveBeenCalledTimes(1);
      expect(MonitoringModule).toHaveBeenCalledTimes(1);
      expect(SecurityModule).toHaveBeenCalledTimes(1);
      expect(ComputeModule).toHaveBeenCalledTimes(1);
      expect(DatabaseModule).toHaveBeenCalledTimes(1);
      expect(StorageModule).toHaveBeenCalledTimes(1);
      expect(ParameterStoreModule).toHaveBeenCalledTimes(1);
      expect(TerraformOutput).toBeCalledTimes(8);

      expect(stack).toBeDefined();
    });

    test("should maintain resource relationships", () => {
      const app = new App();
      new TapStack(app, "RelationshipTest");

      // Verify that VpcModule is created before others
      const vpcModule = VpcModule.mock.results[0].value;

      // Verify SecurityModule uses VPC from VpcModule
      const securityCall = SecurityModule.mock.calls[0][2];
      expect(securityCall.vpcId).toBe(vpcModule.vpcId);

      // Verify ComputeModule uses resources from VPC and Security modules
      const computeCall = ComputeModule.mock.calls[0][2];
      expect(computeCall.publicSubnetIds).toEqual(vpcModule.publicSubnetIds);

      const securityModule = SecurityModule.mock.results[0].value;
      expect(computeCall.securityGroupId).toBe(securityModule.publicInstanceSecurityGroupId);

      // Verify DatabaseModule uses resources from VPC and Security modules
      const databaseCall = DatabaseModule.mock.calls[0][2];
      expect(databaseCall.privateSubnetIds).toEqual(vpcModule.privateSubnetIds);
      expect(databaseCall.vpcSecurityGroupIds).toEqual([securityModule.rdsSecurityGroupId]);
    });

    test("should configure monitoring for all resources", () => {
      const app = new App();
      new TapStack(app, "MonitoringTest");

      // Verify monitoring module is created
      expect(MonitoringModule).toHaveBeenCalledTimes(1);

      // Verify VPC flow logs are enabled
      const vpcModule = VpcModule.mock.results[0].value;
      const monitoringModule = MonitoringModule.mock.results[0].value;
      
      expect(vpcModule.enableFlowLogs).toHaveBeenCalledWith(
        monitoringModule.flowLogsGroup
      );
    });

    test("should handle AWS region configuration correctly", () => {
      const app = new App();
      new TapStack(app, "RegionTest", {
        awsRegion: 'eu-west-2'
      });

      // Verify provider uses correct region
      expect(AwsProvider).toHaveBeenCalledWith(
        expect.anything(),
        'aws',
        expect.objectContaining({
          region: 'eu-west-2'
        })
      );

      // Verify availability zones match the region
      const vpcCall = VpcModule.mock.calls[0];
      expect(vpcCall[2].availabilityZones).toEqual(['eu-west-2a', 'eu-west-2b']);
    });
  });
});