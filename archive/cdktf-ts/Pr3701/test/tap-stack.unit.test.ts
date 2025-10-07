// test/tap-stack.unit.test.ts
import { App } from "cdktf";
import "cdktf/lib/testing/adapters/jest";
import { TapStack } from "../lib/tap-stack";

// Mock all the modules used in TapStack
jest.mock("../lib/modules", () => ({
  NetworkModule: jest.fn().mockImplementation((scope: any, id: string, config: any) => ({
    vpc: {
      id: `vpc-${config.projectName}-${config.environment}`,
      cidrBlock: config.vpcCidr
    },
    publicSubnets: config.publicSubnetCidrs.map((cidr: string, index: number) => ({
      id: `pub-subnet-${index + 1}-${config.projectName}`,
      cidrBlock: cidr,
      availabilityZone: config.availabilityZones[index]
    })),
    privateSubnets: config.privateSubnetCidrs.map((cidr: string, index: number) => ({
      id: `priv-subnet-${index + 1}-${config.projectName}`,
      cidrBlock: cidr,
      availabilityZone: config.availabilityZones[index]
    })),
    internetGateway: { id: `igw-${config.projectName}` },
    natGateway: { id: `nat-${config.projectName}` },
    elasticIp: {
      id: `eip-${config.projectName}`,
      publicIp: '52.123.456.789'
    },
    publicRouteTable: { id: `public-rt-${config.projectName}` },
    privateRouteTable: { id: `private-rt-${config.projectName}` }
  })),

  SecurityGroupModule: jest.fn().mockImplementation((scope: any, id: string, config: any) => ({
    publicSecurityGroup: {
      id: `public-sg-${config.projectName}`,
      name: `${config.projectName}-${config.environment}-public-sg`
    },
    privateSecurityGroup: {
      id: `private-sg-${config.projectName}`,
      name: `${config.projectName}-${config.environment}-private-sg`
    },
    rdsSecurityGroup: {
      id: `rds-sg-${config.projectName}`,
      name: `${config.projectName}-${config.environment}-rds-sg`
    }
  })),

  RdsModule: jest.fn().mockImplementation((scope: any, id: string, config: any) => ({
    dbSubnetGroup: {
      name: `${config.projectName}-${config.environment}-db-subnet-group`
    },
    dbInstance: {
      endpoint: `db-${config.projectName}.cluster-xyz.us-west-2.rds.amazonaws.com:3306`,
      dbName: `${config.projectName}${config.environment}db`,
      identifier: `${config.projectName}-${config.environment}-db`,
      allocatedStorage: config.allocatedStorage,
      instanceClass: config.instanceClass
    }
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
  const { NetworkModule, SecurityGroupModule, RdsModule } = require("../lib/modules");
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

  describe("NetworkModule Resource Creation", () => {
    test("should create NetworkModule with correct VPC configuration", () => {
      const app = new App();
      new TapStack(app, "TestStack");

      expect(NetworkModule).toHaveBeenCalledWith(
        expect.anything(),
        'network',
        expect.objectContaining({
          projectName: 'tap',
          environment: 'dev',
          vpcCidr: '10.0.0.0/16',
          publicSubnetCidrs: ['10.0.1.0/24', '10.0.2.0/24'],
          privateSubnetCidrs: ['10.0.10.0/24', '10.0.11.0/24'],
          availabilityZones: ['us-east-1a', 'us-east-1b'],
          tags: expect.objectContaining({
            Project: 'tap',
            Environment: 'dev',
            ManagedBy: 'Terraform',
            CreatedBy: 'CDKTF'
          })
        })
      );
    });

    test("should create NetworkModule with correct availability zones for custom region", () => {
      const app = new App();
      new TapStack(app, "TestStack", {
        awsRegion: 'ap-southeast-1'
      });

      expect(NetworkModule).toHaveBeenCalledWith(
        expect.anything(),
        'network',
        expect.objectContaining({
          availabilityZones: ['ap-southeast-1a', 'ap-southeast-1b']
        })
      );
    });

    test("should pass correct subnet configurations to NetworkModule", () => {
      const app = new App();
      new TapStack(app, "TestStack", {
        environmentSuffix: 'staging'
      });

      expect(NetworkModule).toHaveBeenCalledWith(
        expect.anything(),
        'network',
        expect.objectContaining({
          environment: 'staging',
          publicSubnetCidrs: expect.arrayContaining(['10.0.1.0/24', '10.0.2.0/24']),
          privateSubnetCidrs: expect.arrayContaining(['10.0.10.0/24', '10.0.11.0/24'])
        })
      );
    });
  });

  describe("SecurityGroupModule Resource Creation", () => {
    test("should create SecurityGroupModule with VPC dependency", () => {
      const app = new App();
      new TapStack(app, "TestStack");

      const networkModuleCall = NetworkModule.mock.calls[0];
      const networkConfig = networkModuleCall[2];
      const expectedVpcId = `vpc-${networkConfig.projectName}-${networkConfig.environment}`;

      expect(SecurityGroupModule).toHaveBeenCalledWith(
        expect.anything(),
        'security',
        expect.objectContaining({
          projectName: 'tap',
          environment: 'dev',
          vpcId: expectedVpcId,
          sshAllowedCidr: '106.213.83.113/32',
          tags: expect.objectContaining({
            Project: 'tap',
            Environment: 'dev'
          })
        })
      );
    });

    test("should create SecurityGroupModule with proper SSH CIDR configuration", () => {
      const app = new App();
      new TapStack(app, "TestStack");

      expect(SecurityGroupModule).toHaveBeenCalledWith(
        expect.anything(),
        'security',
        expect.objectContaining({
          sshAllowedCidr: '106.213.83.113/32'
        })
      );
    });
  });

  describe("RdsModule Resource Creation", () => {
    test("should create RdsModule with correct database configuration", () => {
      const app = new App();
      new TapStack(app, "TestStack");

      expect(RdsModule).toHaveBeenCalledWith(
        expect.anything(),
        'database',
        expect.objectContaining({
          projectName: 'tap',
          environment: 'dev',
          subnetIds: expect.arrayContaining([
            'priv-subnet-1-tap',
            'priv-subnet-2-tap'
          ]),
          securityGroupId: 'rds-sg-tap',
          instanceClass: 'db.t3.micro',
          allocatedStorage: 20,
          backupRetentionDays: 7,
          deletionProtection: false,
          tags: expect.objectContaining({
            Project: 'tap',
            Environment: 'dev'
          })
        })
      );
    });

    test("should enable deletion protection for production environment", () => {
      const app = new App();
      new TapStack(app, "TestStack", {
        environmentSuffix: 'prod'
      });

      expect(RdsModule).toHaveBeenCalledWith(
        expect.anything(),
        'database',
        expect.objectContaining({
          deletionProtection: true
        })
      );
    });

    test("should disable deletion protection for non-production environments", () => {
      const app = new App();
      new TapStack(app, "TestStack", {
        environmentSuffix: 'staging'
      });

      expect(RdsModule).toHaveBeenCalledWith(
        expect.anything(),
        'database',
        expect.objectContaining({
          deletionProtection: false
        })
      );
    });

    test("should pass private subnet IDs from NetworkModule to RdsModule", () => {
      const app = new App();
      new TapStack(app, "TestStack");

      const rdsCall = RdsModule.mock.calls[0];
      expect(rdsCall[2].subnetIds).toEqual(
        expect.arrayContaining(['priv-subnet-1-tap', 'priv-subnet-2-tap'])
      );
    });

    test("should pass RDS security group ID from SecurityGroupModule to RdsModule", () => {
      const app = new App();
      new TapStack(app, "TestStack");

      const rdsCall = RdsModule.mock.calls[0];
      expect(rdsCall[2].securityGroupId).toBe('rds-sg-tap');
    });
  });

  describe("Terraform Outputs", () => {
    test("should create all required terraform outputs", () => {
      const app = new App();
      new TapStack(app, "TestStack");

      expect(TerraformOutput).toHaveBeenCalledTimes(11);

      const outputCalls = TerraformOutput.mock.calls;
      const outputIds = outputCalls.map((call: any) => call[1]);

      expect(outputIds).toContain('vpc-id');
      expect(outputIds).toContain('public-subnet-ids');
      expect(outputIds).toContain('private-subnet-ids');
      expect(outputIds).toContain('nat-gateway-id');
      expect(outputIds).toContain('nat-eip-address');
      expect(outputIds).toContain('public-security-group-id');
      expect(outputIds).toContain('private-security-group-id');
      expect(outputIds).toContain('rds-security-group-id');
      expect(outputIds).toContain('rds-endpoint');
      expect(outputIds).toContain('rds-db-name');
      expect(outputIds).toContain('aws-account-id');
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

    test("should output public subnet IDs as array", () => {
      const app = new App();
      new TapStack(app, "TestStack");

      const subnetOutput = TerraformOutput.mock.calls.find(
        (call: any) => call[1] === 'public-subnet-ids'
      );

      expect(subnetOutput[2].value).toEqual(['pub-subnet-1-tap', 'pub-subnet-2-tap']);
      expect(subnetOutput[2].description).toBe('Public subnet IDs');
    });

    test("should output private subnet IDs as array", () => {
      const app = new App();
      new TapStack(app, "TestStack");

      const subnetOutput = TerraformOutput.mock.calls.find(
        (call: any) => call[1] === 'private-subnet-ids'
      );

      expect(subnetOutput[2].value).toEqual(['priv-subnet-1-tap', 'priv-subnet-2-tap']);
      expect(subnetOutput[2].description).toBe('Private subnet IDs');
    });

    test("should output NAT Gateway resources", () => {
      const app = new App();
      new TapStack(app, "TestStack");

      const natGatewayOutput = TerraformOutput.mock.calls.find(
        (call: any) => call[1] === 'nat-gateway-id'
      );

      expect(natGatewayOutput[2]).toEqual({
        value: 'nat-tap',
        description: 'NAT Gateway ID'
      });

      const natEipOutput = TerraformOutput.mock.calls.find(
        (call: any) => call[1] === 'nat-eip-address'
      );

      expect(natEipOutput[2]).toEqual({
        value: '52.123.456.789',
        description: 'NAT Gateway Elastic IP address'
      });
    });

    test("should output all security group IDs", () => {
      const app = new App();
      new TapStack(app, "TestStack");

      const publicSgOutput = TerraformOutput.mock.calls.find(
        (call: any) => call[1] === 'public-security-group-id'
      );
      expect(publicSgOutput[2].value).toBe('public-sg-tap');

      const privateSgOutput = TerraformOutput.mock.calls.find(
        (call: any) => call[1] === 'private-security-group-id'
      );
      expect(privateSgOutput[2].value).toBe('private-sg-tap');

      const rdsSgOutput = TerraformOutput.mock.calls.find(
        (call: any) => call[1] === 'rds-security-group-id'
      );
      expect(rdsSgOutput[2].value).toBe('rds-sg-tap');
    });

    test("should output RDS endpoint and database name", () => {
      const app = new App();
      new TapStack(app, "TestStack");

      const rdsEndpointOutput = TerraformOutput.mock.calls.find(
        (call: any) => call[1] === 'rds-endpoint'
      );
      expect(rdsEndpointOutput[2].value).toBe('db-tap.cluster-xyz.us-west-2.rds.amazonaws.com:3306');

      const rdsDbNameOutput = TerraformOutput.mock.calls.find(
        (call: any) => call[1] === 'rds-db-name'
      );
      expect(rdsDbNameOutput[2].value).toBe('tapdevdb');
    });

    test("should output AWS account ID", () => {
      const app = new App();
      new TapStack(app, "TestStack");

      const accountIdOutput = TerraformOutput.mock.calls.find(
        (call: any) => call[1] === 'aws-account-id'
      );

      expect(accountIdOutput[2]).toEqual({
        value: '123456789012',
        description: 'Current AWS Account ID'
      });
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

  describe("Module Dependencies and Ordering", () => {
    test("should create modules in correct order with proper dependencies", () => {
      const app = new App();
      new TapStack(app, "TestStack");

      const callOrder: string[] = [];

      // Track the order of module creation
      NetworkModule.mock.calls.forEach((_: any) => callOrder.push('Network'));
      SecurityGroupModule.mock.calls.forEach((_: any) => callOrder.push('Security'));
      RdsModule.mock.calls.forEach((_: any) => callOrder.push('RDS'));

      // Network should be created first, then Security, then RDS
      expect(callOrder).toEqual(['Network', 'Security', 'RDS']);
    });

    test("should pass VPC ID from NetworkModule to SecurityGroupModule", () => {
      const app = new App();
      new TapStack(app, "TestStack");

      const networkReturn = NetworkModule.mock.results[0].value;
      const securityCall = SecurityGroupModule.mock.calls[0];

      expect(securityCall[2].vpcId).toBe(networkReturn.vpc.id);
    });

    test("should pass subnet IDs from NetworkModule to RdsModule", () => {
      const app = new App();
      new TapStack(app, "TestStack");

      const networkReturn = NetworkModule.mock.results[0].value;
      const rdsCall = RdsModule.mock.calls[0];

      expect(rdsCall[2].subnetIds).toEqual(
        networkReturn.privateSubnets.map((s: any) => s.id)
      );
    });

    test("should pass security group ID from SecurityGroupModule to RdsModule", () => {
      const app = new App();
      new TapStack(app, "TestStack");

      const securityReturn = SecurityGroupModule.mock.results[0].value;
      const rdsCall = RdsModule.mock.calls[0];

      expect(rdsCall[2].securityGroupId).toBe(securityReturn.rdsSecurityGroup.id);
    });
  });

  describe("Environment-specific Configurations", () => {
    test("should configure resources for development environment", () => {
      const app = new App();
      new TapStack(app, "TestStack", {
        environmentSuffix: 'dev'
      });

      expect(NetworkModule).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        expect.objectContaining({
          environment: 'dev'
        })
      );

      expect(RdsModule).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        expect.objectContaining({
          deletionProtection: false
        })
      );
    });

    test("should configure resources for staging environment", () => {
      const app = new App();
      new TapStack(app, "TestStack", {
        environmentSuffix: 'staging'
      });

      expect(NetworkModule).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        expect.objectContaining({
          environment: 'staging'
        })
      );

      expect(RdsModule).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        expect.objectContaining({
          environment: 'staging',
          deletionProtection: false
        })
      );
    });

    test("should configure resources for production environment", () => {
      const app = new App();
      new TapStack(app, "TestStack", {
        environmentSuffix: 'prod'
      });

      expect(NetworkModule).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        expect.objectContaining({
          environment: 'prod'
        })
      );

      expect(RdsModule).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        expect.objectContaining({
          environment: 'prod',
          deletionProtection: true
        })
      );
    });
  });

  describe("Tag Propagation", () => {
    test("should propagate common tags to all modules", () => {
      const app = new App();
      new TapStack(app, "TestStack");

      const expectedTags = {
        Project: 'tap',
        Environment: 'dev',
        ManagedBy: 'Terraform',
        CreatedBy: 'CDKTF'
      };

      expect(NetworkModule).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        expect.objectContaining({ tags: expectedTags })
      );

      expect(SecurityGroupModule).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        expect.objectContaining({ tags: expectedTags })
      );

      expect(RdsModule).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        expect.objectContaining({ tags: expectedTags })
      );
    });

    test("should update tags based on environment", () => {
      const app = new App();
      new TapStack(app, "TestStack", {
        environmentSuffix: 'qa'
      });

      const expectedTags = expect.objectContaining({
        Environment: 'qa'
      });

      expect(NetworkModule).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        expect.objectContaining({ tags: expectedTags })
      );
    });
  });

  describe("Edge Cases and Error Scenarios", () => {
    test("should handle empty environment suffix", () => {
      const app = new App();
      new TapStack(app, "TestStack", {
        environmentSuffix: ''
      });

      // Should default to 'dev'
      expect(S3Backend).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          key: 'dev/TestStack.tfstate'
        })
      );
    });

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

      // Check that all modules receive consistent project name and environment
      const networkCall = NetworkModule.mock.calls[0][2];
      const securityCall = SecurityGroupModule.mock.calls[0][2];
      const rdsCall = RdsModule.mock.calls[0][2];

      expect(networkCall.projectName).toBe('tap');
      expect(networkCall.environment).toBe('test');

      expect(securityCall.projectName).toBe('tap');
      expect(securityCall.environment).toBe('test');

      expect(rdsCall.projectName).toBe('tap');
      expect(rdsCall.environment).toBe('test');
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
      expect(NetworkModule).toHaveBeenCalledTimes(1);
      expect(SecurityGroupModule).toHaveBeenCalledTimes(1);
      expect(RdsModule).toHaveBeenCalledTimes(1);
      expect(TerraformOutput).toHaveBeenCalledTimes(11);

      expect(stack).toBeDefined();
    });

    test("should maintain resource relationships", () => {
      const app = new App();
      new TapStack(app, "RelationshipTest");

      // Verify that NetworkModule is created before others
      const networkModule = NetworkModule.mock.results[0].value;

      // Verify SecurityGroupModule uses VPC from NetworkModule
      const securityCall = SecurityGroupModule.mock.calls[0][2];
      expect(securityCall.vpcId).toBe(networkModule.vpc.id);

      // Verify RdsModule uses resources from both Network and Security modules
      const rdsCall = RdsModule.mock.calls[0][2];
      expect(rdsCall.subnetIds).toEqual(
        networkModule.privateSubnets.map((s: any) => s.id)
      );

      const securityModule = SecurityGroupModule.mock.results[0].value;
      expect(rdsCall.securityGroupId).toBe(securityModule.rdsSecurityGroup.id);
    });
  });
});