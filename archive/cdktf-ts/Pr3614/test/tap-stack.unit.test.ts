// test/tap-stack.unit.test.ts
import { App } from "cdktf";
import "cdktf/lib/testing/adapters/jest";
import { TapStack } from "../lib/tap-stack";
import * as fs from 'fs';
import * as path from 'path';

// Mock fs module
jest.mock('fs');

// Mock all the modules used in TapStack
jest.mock("../lib/modules", () => ({
  VpcModule: jest.fn().mockImplementation((scope: any, id: string, tags: any) => ({
    vpc: { id: `vpc-${id}` },
    publicSubnets: [
      { id: `pub-subnet-1-${id}` },
      { id: `pub-subnet-2-${id}` }
    ],
    privateSubnets: [
      { id: `priv-subnet-1-${id}` },
      { id: `priv-subnet-2-${id}` }
    ]
  })),
  SecurityGroupsModule: jest.fn().mockImplementation((scope: any, id: string, vpcId: string, tags: any) => ({
    albSg: { id: `alb-sg-${id}` },
    ec2Sg: { id: `ec2-sg-${id}` },
    rdsSg: { id: `rds-sg-${id}` }
  })),
  IamModule: jest.fn().mockImplementation((scope: any, id: string, secretArn: string, tags: any) => ({
    instanceProfile: { arn: `arn:aws:iam::123456789012:instance-profile/${id}` }
  })),
  AutoScalingModule: jest.fn().mockImplementation((scope: any, id: string, config: any) => ({
    asg: { name: `asg-${id}` }
  })),
  AlbModule: jest.fn().mockImplementation((scope: any, id: string, config: any) => ({
    alb: { 
      dnsName: `alb-${id}.elb.amazonaws.com`,
      arn: `arn:aws:elasticloadbalancing:us-west-2:123456789012:loadbalancer/app/${id}/1234567890abcdef`
    },
    targetGroup: { arn: `arn:aws:elasticloadbalancing:us-west-2:123456789012:targetgroup/${id}/1234567890abcdef` }
  })),
  RdsModule: jest.fn().mockImplementation((scope: any, id: string, config: any) => ({
    dbInstance: { 
      endpoint: `db-${id}.cluster-xyz.us-west-2.rds.amazonaws.com:3306`,
      identifier: `db-${id}`
    }
  })),
  S3Module: jest.fn().mockImplementation((scope: any, id: string, config: any) => ({
    bucket: { bucket: `s3-bucket-${id}` }
  })),
  CloudWatchDashboardModule: jest.fn().mockImplementation((scope: any, id: string, config: any) => ({
    dashboard: { dashboardName: `dashboard-${id}` }
  }))
}));

// Mock Secrets Manager components
jest.mock("@cdktf/provider-aws/lib/secretsmanager-secret", () => ({
  SecretsmanagerSecret: jest.fn().mockImplementation((scope: any, id: string, config: any) => ({
    id: `secret-${id}`,
    arn: `arn:aws:secretsmanager:us-west-2:123456789012:secret:${config.name}-abcdef`
  }))
}));

jest.mock("@cdktf/provider-aws/lib/secretsmanager-secret-version", () => ({
  SecretsmanagerSecretVersion: jest.fn().mockImplementation((scope: any, id: string, config: any) => ({
    id: `secret-version-${id}`,
    secretId: config.secretId
  }))
}));

// Mock TerraformOutput and S3Backend to prevent duplicate construct errors
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

// Store the original module to allow for mocking AWS_REGION_OVERRIDE
let TapStackModule = require("../lib/tap-stack");

describe("TapStack Unit Tests", () => {
  const { 
    VpcModule,
    SecurityGroupsModule,
    IamModule,
    AutoScalingModule,
    AlbModule,
    RdsModule,
    S3Module,
    CloudWatchDashboardModule
  } = require("../lib/modules");
  const { TerraformOutput, S3Backend } = require("cdktf");
  const { AwsProvider } = require("@cdktf/provider-aws/lib/provider");
  const { SecretsmanagerSecret } = require("@cdktf/provider-aws/lib/secretsmanager-secret");
  const { SecretsmanagerSecretVersion } = require("@cdktf/provider-aws/lib/secretsmanager-secret-version");

  beforeEach(() => {
    jest.clearAllMocks();
    // Reset fs mocks
    (fs.existsSync as jest.Mock).mockReturnValue(false);
    (fs.readFileSync as jest.Mock).mockReturnValue('');
  });

  describe("Constructor and Basic Functionality", () => {
    test("should create TapStack with default props", () => {
      const app = new App();
      const stack = new TapStack(app, "TestStack");

      expect(stack).toBeDefined();
      expect(stack).toBeInstanceOf(TapStack);
    });

    test("should create TapStack with custom props", () => {
      const app = new App();
      const stack = new TapStack(app, "TestStack", {
        environmentSuffix: 'prod',
        stateBucket: 'custom-bucket',
        stateBucketRegion: 'us-west-2',
        awsRegion: 'us-east-1',
        defaultTags: { tags: { Owner: 'Platform-Team' } }
      });

      expect(stack).toBeDefined();
    });
  });


  describe("S3 Backend Configuration", () => {
    test("should configure S3 backend with state locking", () => {
      const app = new App();
      const mockAddOverride = jest.fn();
      
      // Mock the stack instance to capture addOverride calls
      const originalPrototype = TapStack.prototype.addOverride;
      TapStack.prototype.addOverride = mockAddOverride;

      new TapStack(app, "TestStackLocking");

      // Verify S3 backend is configured
      expect(S3Backend).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          bucket: 'iac-rlhf-tf-states',
          key: 'dev/TestStackLocking.tfstate',
          region: 'us-east-1',
          encrypt: true
        })
      );

      // Verify state locking is enabled
      expect(mockAddOverride).toHaveBeenCalledWith(
        'terraform.backend.s3.use_lockfile',
        true
      );

      // Restore original prototype
      TapStack.prototype.addOverride = originalPrototype;
    });
  });

  describe("Module Creation and Dependencies", () => {
    test("should create VPC module with correct tags", () => {
      const app = new App();
      new TapStack(app, "TestStackVPC");

      expect(VpcModule).toHaveBeenCalledWith(
        expect.anything(),
        "TestStackVPC-vpc",
        expect.objectContaining({
          Environment: 'dev',
          ManagedBy: 'Terraform',
          Project: 'TestStackVPC',
          CreatedAt: expect.any(String)
        })
      );
    });

    test("should create SecurityGroups module with VPC dependency", () => {
      const app = new App();
      new TapStack(app, "TestStackSG");

      expect(SecurityGroupsModule).toHaveBeenCalledWith(
        expect.anything(),
        "TestStackSG-security-groups",
        "vpc-TestStackSG-vpc",
        expect.objectContaining({
          Environment: 'dev',
          ManagedBy: 'Terraform',
          Project: 'TestStackSG'
        })
      );
    });

    test("should create RDS secret with proper configuration", () => {
      const app = new App();
      new TapStack(app, "TestStackRDS", {
        environmentSuffix: 'prod'
      });

      expect(SecretsmanagerSecret).toHaveBeenCalledWith(
        expect.anything(),
        'rds-secret',
        expect.objectContaining({
          name: 'TestStackRDS-rds-mysql-credentials-prod',
          description: 'RDS MySQL master credentials',
          recoveryWindowInDays: 0,
          tags: expect.objectContaining({
            Environment: 'prod'
          })
        })
      );
    });

    test("should create RDS secret version with generated password", () => {
      const app = new App();
      new TapStack(app, "TestStackSecretVersion");

      expect(SecretsmanagerSecretVersion).toHaveBeenCalledWith(
        expect.anything(),
        'rds-secret-version',
        expect.objectContaining({
          secretId: 'secret-rds-secret',
          secretString: expect.stringContaining('"username":"admin"')
        })
      );

      // Verify the secret string contains a password field
      const secretStringCall = (SecretsmanagerSecretVersion as jest.Mock).mock.calls[0][2].secretString;
      const parsedSecret = JSON.parse(secretStringCall);
      expect(parsedSecret).toHaveProperty('username', 'admin');
      expect(parsedSecret).toHaveProperty('password');
      expect(parsedSecret.password).toHaveLength(32);
    });

    test("should create IAM module with RDS secret ARN", () => {
      const app = new App();
      new TapStack(app, "TestStackIAM");

      expect(IamModule).toHaveBeenCalledWith(
        expect.anything(),
        "TestStackIAM-iam",
        expect.stringContaining('arn:aws:secretsmanager:us-west-2:123456789012:secret:'),
        expect.objectContaining({
          Environment: 'dev'
        })
      );
    });

    test("should create S3 module with lifecycle configuration", () => {
      const app = new App();
      new TapStack(app, "TestStackS3");

      expect(S3Module).toHaveBeenCalledWith(
        expect.anything(),
        "TestStackS3-s3",
        expect.objectContaining({
          transitionDays: 30,
          expirationDays: 365,
          tags: expect.objectContaining({
            Environment: 'dev'
          })
        })
      );
    });

    test("should create RDS module with private subnets and security group", () => {
      const app = new App();
      new TapStack(app, "TestStackRDSModule");

      expect(RdsModule).toHaveBeenCalledWith(
        expect.anything(),
        "TestStackRDSModule-rds",
        expect.objectContaining({
          subnetIds: expect.arrayContaining([
            'priv-subnet-1-TestStackRDSModule-vpc',
            'priv-subnet-2-TestStackRDSModule-vpc'
          ]),
          securityGroupId: 'rds-sg-TestStackRDSModule-security-groups',
          secretArn: expect.stringContaining('arn:aws:secretsmanager:'),
          instanceClass: 'db.t3.micro',
          allocatedStorage: 20,
          dependsOn: expect.arrayContaining([expect.any(Object)]),
          tags: expect.objectContaining({
            Environment: 'dev'
          })
        })
      );
    });

    test("should create ALB module with public subnets", () => {
      const app = new App();
      new TapStack(app, "TestStackALB");

      expect(AlbModule).toHaveBeenCalledWith(
        expect.anything(),
        "TestStackALB-alb",
        expect.objectContaining({
          subnetIds: expect.arrayContaining([
            'pub-subnet-1-TestStackALB-vpc',
            'pub-subnet-2-TestStackALB-vpc'
          ]),
          securityGroupId: 'alb-sg-TestStackALB-security-groups',
          vpcId: 'vpc-TestStackALB-vpc',
          logBucketName: 's3-bucket-TestStackALB-s3',
          tags: expect.objectContaining({
            Environment: 'dev'
          })
        })
      );
    });

    test("should create AutoScaling module with proper AWS region", () => {
      const app = new App();
      new TapStack(app, "TestStackASG", {
        awsRegion: 'eu-central-1'
      });

      expect(AutoScalingModule).toHaveBeenCalledWith(
        expect.anything(),
        "TestStackASG-asg",
        expect.objectContaining({
          awsRegion: 'eu-central-1'
        })
      );
    });

    test("should create CloudWatch Dashboard with monitoring dependencies", () => {
      const app = new App();
      new TapStack(app, "TestStackCW");

      expect(CloudWatchDashboardModule).toHaveBeenCalledWith(
        expect.anything(),
        "TestStackCW-monitoring",
        expect.objectContaining({
          asgName: 'asg-TestStackCW-asg',
          albArn: expect.stringContaining('arn:aws:elasticloadbalancing:'),
          dbInstanceId: 'db-TestStackCW-rds',
          tags: expect.objectContaining({
            Environment: 'dev'
          })
        })
      );
    });
  });

  describe("Edge Cases and Error Handling", () => {
    test("should handle production environment configuration", () => {
      const app = new App();
      const prodTags = {
        tags: {
          Environment: 'production',
          Owner: 'Platform-Team',
          CostCenter: 'Engineering',
        },
      };

      new TapStack(app, "TapStackProd", {
        environmentSuffix: 'production',
        stateBucket: 'prod-tf-state-bucket',
        stateBucketRegion: 'us-west-2',
        awsRegion: 'us-west-2',
        defaultTags: prodTags,
      });

      // Verify production configuration is applied
      expect(S3Backend).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          bucket: 'prod-tf-state-bucket',
          key: 'production/TapStackProd.tfstate',
          region: 'us-west-2'
        })
      );

      expect(VpcModule).toHaveBeenCalledWith(
        expect.anything(),
        "TapStackProd-vpc",
        expect.objectContaining({
          Environment: 'production'
        })
      );
    });

    test("should handle empty string environment suffix", () => {
      const app = new App();
      new TapStack(app, "TestStackEmpty", {
        environmentSuffix: ''
      });

      // Should fall back to 'dev'
      expect(S3Backend).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          key: 'dev/TestStackEmpty.tfstate'
        })
      );
    });

    test("should handle undefined environment suffix", () => {
      const app = new App();
      new TapStack(app, "TestStackUndefined", {
        // environmentSuffix is not provided
      });

      // Should fall back to 'dev'
      expect(S3Backend).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          key: 'dev/TestStackUndefined.tfstate'
        })
      );
    });

    test("should create all resources with consistent naming", () => {
      const app = new App();
      const stackId = "TestStackNaming";
      const envSuffix = "staging";
      
      new TapStack(app, stackId, {
        environmentSuffix: envSuffix
      });

      // Verify consistent naming across all resources
      expect(VpcModule).toHaveBeenCalledWith(
        expect.anything(),
        `${stackId}-vpc`,
        expect.any(Object)
      );

      expect(SecurityGroupsModule).toHaveBeenCalledWith(
        expect.anything(),
        `${stackId}-security-groups`,
        expect.any(String),
        expect.any(Object)
      );

      expect(SecretsmanagerSecret).toHaveBeenCalledWith(
        expect.anything(),
        'rds-secret',
        expect.objectContaining({
          name: `${stackId}-rds-mysql-credentials-${envSuffix}`
        })
      );
    });

  });

  describe("Integration Flow", () => {
    test("should create stack with all components in correct order", () => {
      const app = new App();
      const stack = new TapStack(app, "TestStackIntegration");

      // Verify all components are created
      expect(AwsProvider).toHaveBeenCalledTimes(1);
      expect(S3Backend).toHaveBeenCalledTimes(1);
      expect(VpcModule).toHaveBeenCalledTimes(1);
      expect(SecurityGroupsModule).toHaveBeenCalledTimes(1);
      expect(SecretsmanagerSecret).toHaveBeenCalledTimes(1);
      expect(SecretsmanagerSecretVersion).toHaveBeenCalledTimes(1);
      expect(IamModule).toHaveBeenCalledTimes(1);
      expect(S3Module).toHaveBeenCalledTimes(1);
      expect(RdsModule).toHaveBeenCalledTimes(1);
      expect(AlbModule).toHaveBeenCalledTimes(1);
      expect(AutoScalingModule).toHaveBeenCalledTimes(1);
      expect(CloudWatchDashboardModule).toHaveBeenCalledTimes(1);
      expect(TerraformOutput).toHaveBeenCalledTimes(10);

      // Verify the stack is properly constructed
      expect(stack).toBeDefined();
    });

    test("should pass dependencies correctly between modules", () => {
      const app = new App();
      new TapStack(app, "TestStackDeps");

      // Verify VPC ID is passed to SecurityGroups
      const vpcId = "vpc-TestStackDeps-vpc";
      expect(SecurityGroupsModule).toHaveBeenCalledWith(
        expect.anything(),
        expect.any(String),
        vpcId,
        expect.any(Object)
      );

      // Verify security group IDs are passed to other modules
      expect(RdsModule).toHaveBeenCalledWith(
        expect.anything(),
        expect.any(String),
        expect.objectContaining({
          securityGroupId: 'rds-sg-TestStackDeps-security-groups'
        })
      );

      expect(AlbModule).toHaveBeenCalledWith(
        expect.anything(),
        expect.any(String),
        expect.objectContaining({
          securityGroupId: 'alb-sg-TestStackDeps-security-groups'
        })
      );

      expect(AutoScalingModule).toHaveBeenCalledWith(
        expect.anything(),
        expect.any(String),
        expect.objectContaining({
          securityGroupId: 'ec2-sg-TestStackDeps-security-groups'
        })
      );
    });

    test("should validate password generation creates unique passwords", () => {
      const app = new App();
      
      // Create multiple stacks to ensure password generation is unique
      new TapStack(app, "TestStackPass1");
      new TapStack(app, "TestStackPass2");

      // Get the generated passwords from the secret version calls
      const calls = (SecretsmanagerSecretVersion as jest.Mock).mock.calls;
      const password1 = JSON.parse(calls[calls.length - 2][2].secretString).password;
      const password2 = JSON.parse(calls[calls.length - 1][2].secretString).password;

      // Passwords should be different
      expect(password1).not.toBe(password2);
      // Both should be 32 characters
      expect(password1).toHaveLength(32);
      expect(password2).toHaveLength(32);
    });

    test("should create all outputs with correct values", () => {
      const app = new App();
      new TapStack(app, "TestStackOutputs");

      // Verify all 10 outputs are created
      const outputCalls = (TerraformOutput as jest.Mock).mock.calls;
      expect(outputCalls).toHaveLength(10);

      // Verify output IDs
      const outputIds = outputCalls.map(call => call[1]);
      expect(outputIds).toContain('vpc-id');
      expect(outputIds).toContain('alb-dns-name');
      expect(outputIds).toContain('rds-endpoint');
      expect(outputIds).toContain('asg-name');
      expect(outputIds).toContain('s3-logs-bucket');
      expect(outputIds).toContain('dashboard-url');
      expect(outputIds).toContain('private-subnet-ids');
      expect(outputIds).toContain('security-group-ids');
      expect(outputIds).toContain('rds-secret-arn');
      expect(outputIds).toContain('target-group-arn');

      // Verify sensitive outputs
      const rdsEndpointOutput = outputCalls.find(call => call[1] === 'rds-endpoint');
      expect(rdsEndpointOutput[2]).toMatchObject({
        sensitive: true
      });
    });
  });

  describe("Password Generation", () => {
    test("should generate passwords with required complexity", () => {
      const app = new App();
      new TapStack(app, "TestStackPasswordComplexity");

      const call = (SecretsmanagerSecretVersion as jest.Mock).mock.calls[0];
      const password = JSON.parse(call[2].secretString).password;

      // Check password contains various character types
      expect(password).toMatch(/[A-Z]/); // Uppercase
      expect(password).toMatch(/[a-z]/); // Lowercase
      expect(password).toMatch(/[0-9]/); // Numbers
      expect(password).toMatch(/[!@#$%^&*()_+\-=$${}|;:,.<>?]/); // Special chars
    });
  });
});