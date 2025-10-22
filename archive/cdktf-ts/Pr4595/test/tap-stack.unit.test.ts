// __tests__/tap-stack.test.ts
import { App } from "cdktf";
import "cdktf/lib/testing/adapters/jest";
import { TapStack } from "../lib/tap-stack";

// Mock all the modules used in TapStack
jest.mock("../lib/modules", () => ({
  VPCConstruct: jest.fn().mockImplementation((scope: any, id: string, config: any) => ({
    vpc: {
      id: `vpc-${config.projectName}-${config.environment}`,
      cidrBlock: config.vpcCidr,
    },
    publicSubnets: config.publicSubnetCidrs.map((cidr: string, index: number) => ({
      id: `subnet-public-${index + 1}-${config.projectName}`
    })),
    privateSubnets: config.privateSubnetCidrs.map((cidr: string, index: number) => ({
      id: `subnet-private-${index + 1}-${config.projectName}`
    }))
  })),

  IAMConstruct: jest.fn().mockImplementation((scope: any, id: string, config: any) => ({
    createRole: jest.fn().mockImplementation((roleConfig: any) => ({
      name: roleConfig.roleName,
      arn: `arn:aws:iam::123456789012:role/${roleConfig.roleName}`,
    }))
  })),

  S3BucketConstruct: jest.fn().mockImplementation((scope: any, id: string, config: any) => ({
    bucket: {
      id: `s3-${config.bucketName}`,
      bucket: config.bucketName,
      arn: `arn:aws:s3:::${config.bucketName}`,
    }
  })),

  RDSConstruct: jest.fn().mockImplementation((scope: any, id: string, config: any) => ({
    instance: {
      id: config.instanceIdentifier,
      endpoint: `${config.instanceIdentifier}.cluster-123456789012.us-east-1.rds.amazonaws.com:5432`,
      dbName: 'appdb',
      arn: `arn:aws:rds:us-east-1:123456789012:db:${config.instanceIdentifier}`,
    }
  }))
}));

// Add static method mock for IAMConstruct
(require("../lib/modules").IAMConstruct as any).getEc2InstancePolicy = jest.fn().mockReturnValue({
  Version: '2012-10-17',
  Statement: [
    {
      Effect: 'Allow',
      Action: ['s3:GetObject', 's3:PutObject'],
      Resource: ['arn:aws:s3:::*/*']
    }
  ]
});

// Mock AWS Provider and related data sources
jest.mock("@cdktf/provider-aws/lib/provider", () => ({
  AwsProvider: jest.fn(),
  AwsProviderDefaultTags: jest.fn(),
}));

jest.mock("@cdktf/provider-aws/lib/data-aws-caller-identity", () => ({
  DataAwsCallerIdentity: jest.fn().mockImplementation(() => ({
    accountId: "123456789012",
    arn: "arn:aws:iam::123456789012:root",
    userId: "AIDACKCEVSQ6C2EXAMPLE",
  })),
}));

jest.mock("@cdktf/provider-aws/lib/data-aws-ami", () => ({
  DataAwsAmi: jest.fn().mockImplementation(() => ({
    id: "ami-0c02fb55956c7d316",
    name: "amzn2-ami-hvm-2.0.20220121.0-x86_64-gp2",
  })),
}));

jest.mock("@cdktf/provider-aws/lib/instance", () => ({
  Instance: jest.fn().mockImplementation((scope: any, id: string, config: any) => ({
    id: `i-${id}-${Math.random().toString(36).substr(2, 9)}`,
    publicIp: config.subnetId.includes('public') ? `54.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}` : undefined,
    privateIp: `10.0.${config.subnetId.includes('public') ? '1' : '11'}.${Math.floor(Math.random() * 255)}`,
  })),
}));

jest.mock("@cdktf/provider-aws/lib/security-group", () => ({
  SecurityGroup: jest.fn().mockImplementation((scope: any, id: string, config: any) => ({
    id: `sg-${id}-${Math.random().toString(36).substr(2, 9)}`,
    name: config.name,
  })),
}));

jest.mock("@cdktf/provider-aws/lib/kms-key", () => ({
  KmsKey: jest.fn().mockImplementation((scope: any, id: string, config: any) => ({
    keyId: `key-${id}-${Math.random().toString(36).substr(2, 9)}`,
    arn: `arn:aws:kms:us-east-1:123456789012:key/${id}`,
  })),
}));

jest.mock("@cdktf/provider-aws/lib/kms-alias", () => ({
  KmsAlias: jest.fn().mockImplementation((scope: any, id: string, config: any) => ({
    name: config.name,
    targetKeyId: config.targetKeyId,
  })),
}));

jest.mock("@cdktf/provider-aws/lib/iam-instance-profile", () => ({
  IamInstanceProfile: jest.fn().mockImplementation((scope: any, id: string, config: any) => ({
    name: config.name,
    role: config.role,
    arn: `arn:aws:iam::123456789012:instance-profile/${config.name}`,
  })),
}));

jest.mock("@cdktf/provider-random/lib/provider", () => ({
  RandomProvider: jest.fn(),
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

describe("TapStack Unit Tests", () => {
  const {
    VPCConstruct,
    IAMConstruct,
    S3BucketConstruct,
    RDSConstruct,
  } = require("../lib/modules");
  
  const { TerraformOutput, S3Backend } = require("cdktf");
  const { AwsProvider } = require("@cdktf/provider-aws/lib/provider");
  const { RandomProvider } = require("@cdktf/provider-random/lib/provider");
  const { DataAwsCallerIdentity } = require("@cdktf/provider-aws/lib/data-aws-caller-identity");
  const { DataAwsAmi } = require("@cdktf/provider-aws/lib/data-aws-ami");
  const { Instance } = require("@cdktf/provider-aws/lib/instance");
  const { SecurityGroup } = require("@cdktf/provider-aws/lib/security-group");
  const { KmsKey } = require("@cdktf/provider-aws/lib/kms-key");
  const { KmsAlias } = require("@cdktf/provider-aws/lib/kms-alias");
  const { IamInstanceProfile } = require("@cdktf/provider-aws/lib/iam-instance-profile");

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Stack Creation and Configuration", () => {
    test("should create TapStack with default configuration", () => {
      const app = new App();
      const stack = new TapStack(app, "test-stack");

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

      // Verify RandomProvider is created
      expect(RandomProvider).toHaveBeenCalledTimes(1);

      // Verify DataAwsCallerIdentity is created
      expect(DataAwsCallerIdentity).toHaveBeenCalledTimes(1);
    });

    test("should create TapStack with custom AWS region", () => {
      const app = new App();
      new TapStack(app, "test-stack", {
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
      const customTags = { tags: { Department: 'Engineering', Team: 'Platform' } };

      new TapStack(app, "test-stack", {
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

    test("should create TapStack with custom environment suffix", () => {
      const app = new App();
      new TapStack(app, "test-stack", {
        environmentSuffix: 'production'
      });

      expect(VPCConstruct).toHaveBeenCalledWith(
        expect.anything(),
        'vpc',
        expect.objectContaining({
          environment: 'production'
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

      new TapStack(app, "test-stack");

      expect(S3Backend).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          bucket: 'iac-rlhf-tf-states',
          key: 'dev/us-east-1/test-stack.tfstate',
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
      new TapStack(app, "test-stack", {
        stateBucket: 'my-custom-state-bucket',
        stateBucketRegion: 'ap-southeast-1'
      });

      expect(S3Backend).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          bucket: 'my-custom-state-bucket',
          region: 'ap-southeast-1'
        })
      );
    });

    test("should include region in state key path", () => {
      const app = new App();
      new TapStack(app, "test-stack", {
        environmentSuffix: 'prod',
        awsRegion: 'eu-west-2'
      });

      expect(S3Backend).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          key: 'prod/eu-west-2/test-stack.tfstate'
        })
      );
    });
  });

  describe("VPC Module Configuration", () => {
    test("should create VPC with correct configuration", () => {
      const app = new App();
      new TapStack(app, "test-stack");

      expect(VPCConstruct).toHaveBeenCalledWith(
        expect.anything(),
        'vpc',
        expect.objectContaining({
          projectName: 'test-stack',
          environment: 'dev',
          vpcCidr: '10.0.0.0/16',
          publicSubnetCidrs: ['10.0.1.0/24', '10.0.2.0/24'],
          privateSubnetCidrs: ['10.0.11.0/24', '10.0.12.0/24'],
          azs: ['us-east-1a', 'us-east-1b'],
          tags: expect.objectContaining({
            Environment: 'dev',
            ManagedBy: 'Terraform',
            Project: 'test-stack'
          })
        })
      );
    });

    test("should configure availability zones based on region", () => {
      const app = new App();
      new TapStack(app, "test-stack", {
        awsRegion: 'eu-central-1'
      });

      expect(VPCConstruct).toHaveBeenCalledWith(
        expect.anything(),
        'vpc',
        expect.objectContaining({
          azs: ['eu-central-1a', 'eu-central-1b']
        })
      );
    });
  });

  describe("IAM Module Configuration", () => {
    test("should create IAM module with correct configuration", () => {
      const app = new App();
      new TapStack(app, "test-stack");

      expect(IAMConstruct).toHaveBeenCalledWith(
        expect.anything(),
        'iam',
        expect.objectContaining({
          projectName: 'test-stack',
          environment: 'dev',
          tags: expect.objectContaining({
            Environment: 'dev',
            ManagedBy: 'Terraform',
            Project: 'test-stack'
          })
        })
      );
    });

    test("should create EC2 role with correct policies", () => {
      const app = new App();
      new TapStack(app, "test-stack");

      const iamConstructInstance = IAMConstruct.mock.results[0].value;
      expect(iamConstructInstance.createRole).toHaveBeenCalledWith(
        expect.objectContaining({
          roleName: 'test-stack-dev-ecc2-role',
          assumeRolePolicy: expect.objectContaining({
            Version: '2012-10-17',
            Statement: expect.arrayContaining([
              expect.objectContaining({
                Effect: 'Allow',
                Principal: { Service: 'ec2.amazonaws.com' },
                Action: 'sts:AssumeRole'
              })
            ])
          }),
          managedPolicyArns: ['arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy']
        })
      );
    });

    test("should call getEc2InstancePolicy with S3 bucket ARNs", () => {
      const app = new App();
      new TapStack(app, "test-stack");

      expect(IAMConstruct.getEc2InstancePolicy).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.stringContaining('arn:aws:s3:::test-stack-dev-pubblic-assets'),
          expect.stringContaining('arn:aws:s3:::test-stack-dev-priivate-data')
        ]),
        []
      );
    });
  });

  describe("S3 Bucket Configuration", () => {
    test("should create public S3 bucket with SSE-S3 encryption", () => {
      const app = new App();
      new TapStack(app, "test-stack");

      expect(S3BucketConstruct).toHaveBeenCalledWith(
        expect.anything(),
        'public-s3',
        expect.objectContaining({
          projectName: 'test-stack',
          environment: 'dev',
          bucketName: 'test-stack-dev-pubblic-assets',
          encryption: 'SSE-S3',
          versioning: true
        })
      );
    });

    test("should create private S3 bucket with KMS encryption", () => {
      const app = new App();
      new TapStack(app, "test-stack");

      expect(S3BucketConstruct).toHaveBeenCalledWith(
        expect.anything(),
        'private-s3',
        expect.objectContaining({
          projectName: 'test-stack',
          environment: 'dev',
          bucketName: 'test-stack-dev-priivate-data',
          encryption: 'SSE-KMS',
          kmsKeyArn: expect.stringContaining('arn:aws:kms:'),
          versioning: true
        })
      );
    });

    test("should lowercase bucket names", () => {
      const app = new App();
      new TapStack(app, "MyApp-Stack", {
        environmentSuffix: 'prod'
      });

      expect(S3BucketConstruct).toHaveBeenCalledWith(
        expect.anything(),
        'public-s3',
        expect.objectContaining({
          bucketName: 'myapp-stack-prod-pubblic-assets'
        })
      );

      expect(S3BucketConstruct).toHaveBeenCalledWith(
        expect.anything(),
        'private-s3',
        expect.objectContaining({
          bucketName: 'myapp-stack-prod-priivate-data'
        })
      );
    });
  });

  describe("Security Groups Configuration", () => {
    test("should create ALB security group", () => {
      const app = new App();
      new TapStack(app, "test-stack");

      expect(SecurityGroup).toHaveBeenCalledWith(
        expect.anything(),
        'alb-sg',
        expect.objectContaining({
          name: 'test-stack-dev-alb-sg',
          description: 'Security group for ALB',
          ingress: expect.arrayContaining([
            expect.objectContaining({
              fromPort: 80,
              toPort: 80,
              protocol: 'tcp',
              cidrBlocks: ['0.0.0.0/0']
            })
          ])
        })
      );
    });

    test("should create instance security group with ALB ingress", () => {
      const app = new App();
      new TapStack(app, "test-stack");

      const securityGroupCalls = SecurityGroup.mock.calls;
      const instanceSgCall = securityGroupCalls.find((call: any) => call[1] === 'instance-sg');

      expect(instanceSgCall[2]).toMatchObject({
        name: 'test-stack-dev-instance-sg',
        description: 'Security group for EC2 instances',
        ingress: expect.arrayContaining([
          expect.objectContaining({
            fromPort: 80,
            toPort: 80,
            protocol: 'tcp',
            securityGroups: expect.arrayContaining([expect.any(String)])
          })
        ])
      });
    });

    test("should create RDS security group with instance ingress", () => {
      const app = new App();
      new TapStack(app, "test-stack");

      const securityGroupCalls = SecurityGroup.mock.calls;
      const rdsSgCall = securityGroupCalls.find((call: any) => call[1] === 'rds-sg');

      expect(rdsSgCall[2]).toMatchObject({
        name: 'test-stack-dev-rds-sg',
        description: 'Security group for RDS',
        ingress: expect.arrayContaining([
          expect.objectContaining({
            fromPort: 5432,
            toPort: 5432,
            protocol: 'tcp',
            securityGroups: expect.arrayContaining([expect.any(String)])
          })
        ])
      });
    });
  });

  describe("EC2 Instance Configuration", () => {
    test("should create EC2 instance profile", () => {
      const app = new App();
      new TapStack(app, "test-stack");

      expect(IamInstanceProfile).toHaveBeenCalledWith(
        expect.anything(),
        'ec2-instance-profile',
        expect.objectContaining({
          name: 'test-stack-dev-instannce-profile',
          role: 'test-stack-dev-ecc2-role'
        })
      );
    });

    test("should get latest Amazon Linux 2 AMI", () => {
      const app = new App();
      new TapStack(app, "test-stack");

      expect(DataAwsAmi).toHaveBeenCalledWith(
        expect.anything(),
        'amazon-linux-2',
        expect.objectContaining({
          mostRecent: true,
          owners: ['amazon'],
          filter: expect.arrayContaining([
            expect.objectContaining({
              name: 'name',
              values: ['amzn2-ami-hvm-*-x86_64-gp2']
            }),
            expect.objectContaining({
              name: 'virtualization-type',
              values: ['hvm']
            })
          ])
        })
      );
    });

    test("should use instance profile for EC2 instances", () => {
      const app = new App();
      new TapStack(app, "test-stack");

      const instanceCalls = Instance.mock.calls;
      
      instanceCalls.forEach(call => {
        expect(call[2]).toHaveProperty('iamInstanceProfile', 'test-stack-dev-instannce-profile');
      });
    });
  });

  describe("RDS Module Configuration", () => {
    test("should create RDS instance with correct configuration", () => {
      const app = new App();
      new TapStack(app, "test-stack");

      expect(RDSConstruct).toHaveBeenCalledWith(
        expect.anything(),
        'rds',
        expect.objectContaining({
          projectName: 'test-stack',
          environment: 'dev',
          instanceIdentifier: 'test-stack-dev-db',
          instanceClass: 'db.t3.micro',
          allocatedStorage: 20,
          engine: 'postgres',
          multiAz: false,
          backupRetentionPeriod: 7,
          backupWindow: '03:00-04:00',
          maintenanceWindow: 'sun:04:00-sun:05:00',
          deletionProtection: false,
          storageEncrypted: true
        })
      );
    });

    test("should enable multi-AZ and deletion protection for production", () => {
      const app = new App();
      new TapStack(app, "test-stack", {
        environmentSuffix: 'production'
      });

      expect(RDSConstruct).toHaveBeenCalledWith(
        expect.anything(),
        'rds',
        expect.objectContaining({
          multiAz: true,
          deletionProtection: true,
          backupRetentionPeriod: 30
        })
      );
    });

    test("should use KMS key for RDS encryption", () => {
      const app = new App();
      new TapStack(app, "test-stack");

      expect(RDSConstruct).toHaveBeenCalledWith(
        expect.anything(),
        'rds',
        expect.objectContaining({
          kmsKeyId: expect.stringContaining('arn:aws:kms:'),
          storageEncrypted: true
        })
      );
    });

    test("should lowercase RDS identifier", () => {
      const app = new App();
      new TapStack(app, "MyApp-Stack", {
        environmentSuffix: 'prod'
      });

      expect(RDSConstruct).toHaveBeenCalledWith(
        expect.anything(),
        'rds',
        expect.objectContaining({
          projectName: 'myapp-stack',
          instanceIdentifier: 'myapp-stack-prod-db'
        })
      );
    });
  });

  describe("Terraform Outputs", () => {
    test("should create all required terraform outputs", () => {
      const app = new App();
      new TapStack(app, "test-stack");

      expect(TerraformOutput).toHaveBeenCalled();

      const outputCalls = TerraformOutput.mock.calls;
      const outputIds = outputCalls.map((call: any) => call[1]);

      expect(outputIds).toContain('vpc-id');
      expect(outputIds).toContain('public-subnet-ids');
      expect(outputIds).toContain('private-subnet-ids');
      expect(outputIds).toContain('public-ec2-instance-id');
      expect(outputIds).toContain('public-ec2-public-ip');
      expect(outputIds).toContain('private-ec2-instance-id');
      expect(outputIds).toContain('private-ec2-private-ip');
      expect(outputIds).toContain('public-s3-bucket-name');
      expect(outputIds).toContain('private-s3-bucket-name');
      expect(outputIds).toContain('rds-endpoint');
      expect(outputIds).toContain('kms-key-id');
      expect(outputIds).toContain('aws-account-id');
    });

    test("should output VPC information", () => {
      const app = new App();
      new TapStack(app, "test-stack");

      const vpcOutput = TerraformOutput.mock.calls.find(
        (call: any) => call[1] === 'vpc-id'
      );

      expect(vpcOutput).toBeDefined();
      expect(vpcOutput[2]).toHaveProperty('description', 'VPC ID');
    });

    test("should output subnet IDs", () => {
      const app = new App();
      new TapStack(app, "test-stack");

      const publicSubnetsOutput = TerraformOutput.mock.calls.find(
        (call: any) => call[1] === 'public-subnet-ids'
      );
      const privateSubnetsOutput = TerraformOutput.mock.calls.find(
        (call: any) => call[1] === 'private-subnet-ids'
      );

      expect(publicSubnetsOutput[2]).toHaveProperty('description', 'Public subnet IDs');
      expect(privateSubnetsOutput[2]).toHaveProperty('description', 'Private subnet IDs');
    });

    test("should output EC2 instance information", () => {
      const app = new App();
      new TapStack(app, "test-stack");

      const publicEc2IdOutput = TerraformOutput.mock.calls.find(
        (call: any) => call[1] === 'public-ec2-instance-id'
      );
      const publicEc2IpOutput = TerraformOutput.mock.calls.find(
        (call: any) => call[1] === 'public-ec2-public-ip'
      );

      expect(publicEc2IdOutput[2]).toHaveProperty('description', 'Public EC2 instance ID');
      expect(publicEc2IpOutput[2]).toHaveProperty('description', 'Public EC2 instance public IP address');
    });

    test("should output S3 bucket names", () => {
      const app = new App();
      new TapStack(app, "test-stack");

      const publicS3Output = TerraformOutput.mock.calls.find(
        (call: any) => call[1] === 'public-s3-bucket-name'
      );
      const privateS3Output = TerraformOutput.mock.calls.find(
        (call: any) => call[1] === 'private-s3-bucket-name'
      );

      expect(publicS3Output[2]).toHaveProperty('description', 'Public S3 bucket name for app assets');
      expect(privateS3Output[2]).toHaveProperty('description', 'Private S3 bucket name for internal data');
    });

    test("should output RDS endpoint", () => {
      const app = new App();
      new TapStack(app, "test-stack");

      const rdsOutput = TerraformOutput.mock.calls.find(
        (call: any) => call[1] === 'rds-endpoint'
      );

      expect(rdsOutput[2]).toHaveProperty('description', 'RDS instance endpoint');
    });
  });

  describe("Edge Cases and Error Scenarios", () => {
    test("should handle undefined props", () => {
      const app = new App();
      const stack = new TapStack(app, "test-stack", undefined);

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

      expect(S3Backend).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          bucket: 'iac-rlhf-tf-states',
          key: 'dev/us-east-1/test-stack.tfstate',
          region: 'us-east-1'
        })
      );
    });

    test("should handle empty props object", () => {
      const app = new App();
      const stack = new TapStack(app, "test-stack", {});

      expect(stack).toBeDefined();

      // Should use all defaults
      expect(VPCConstruct).toHaveBeenCalledWith(
        expect.anything(),
        'vpc',
        expect.objectContaining({
          projectName: 'test-stack',
          environment: 'dev'
        })
      );
    });
  });

  describe("Resource Naming Conventions", () => {
    test("should follow consistent naming pattern for all resources", () => {
      const app = new App();
      new TapStack(app, "my-app", {
        environmentSuffix: 'staging'
      });

      // Check naming patterns
      expect(VPCConstruct).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        expect.objectContaining({
          projectName: 'my-app',
          environment: 'staging'
        })
      );

      expect(IAMConstruct).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        expect.objectContaining({
          projectName: 'my-app',
          environment: 'staging'
        })
      );

      expect(RDSConstruct).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        expect.objectContaining({
          projectName: 'my-app',
          environment: 'staging',
          instanceIdentifier: 'my-app-staging-db'
        })
      );
    });

    test("should maintain naming consistency in tags", () => {
      const app = new App();
      new TapStack(app, "awesome-app", {
        environmentSuffix: 'qa'
      });

      const expectedTags = {
        Environment: 'qa',
        ManagedBy: 'Terraform',
        Project: 'awesome-app'
      };

      // Verify tags are consistently applied to modules
      expect(VPCConstruct).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        expect.objectContaining({
          tags: expectedTags
        })
      );

      expect(IAMConstruct).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        expect.objectContaining({
          tags: expectedTags
        })
      );

      expect(S3BucketConstruct).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        expect.objectContaining({
          tags: expectedTags
        })
      );

      expect(RDSConstruct).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        expect.objectContaining({
          tags: expectedTags
        })
      );
    });
  });

  describe("Complete Infrastructure Integration", () => {
    test("should create complete infrastructure stack", () => {
      const app = new App();
      const stack = new TapStack(app, "IntegrationTest");

      // Verify all components are created
      expect(AwsProvider).toHaveBeenCalledTimes(1);
      expect(RandomProvider).toHaveBeenCalledTimes(1);
      expect(S3Backend).toHaveBeenCalledTimes(1);
      expect(DataAwsCallerIdentity).toHaveBeenCalledTimes(1);
      expect(DataAwsAmi).toHaveBeenCalledTimes(1);
      expect(VPCConstruct).toHaveBeenCalledTimes(1);
      expect(KmsKey).toHaveBeenCalledTimes(1);
      expect(KmsAlias).toHaveBeenCalledTimes(1);
      expect(IAMConstruct).toHaveBeenCalledTimes(1);
      expect(S3BucketConstruct).toHaveBeenCalledTimes(2); // public and private
      expect(SecurityGroup).toHaveBeenCalledTimes(3); // alb, instance, rds
      expect(IamInstanceProfile).toHaveBeenCalledTimes(1);
      expect(Instance).toHaveBeenCalledTimes(2); // public and private
      expect(RDSConstruct).toHaveBeenCalledTimes(1);
      expect(TerraformOutput).toHaveBeenCalled();

      expect(stack).toBeDefined();
    });

    test("should handle dependencies between resources", () => {
      const app = new App();
      new TapStack(app, "test-stack");

      // VPC should be created first
      const vpcCall = VPCConstruct.mock.calls[0];
      expect(vpcCall).toBeDefined();

      // Security groups should use VPC ID
      const sgCalls = SecurityGroup.mock.calls;
      sgCalls.forEach(call => {
        expect(call[2]).toHaveProperty('vpcId');
      });

      // Instances should use subnet IDs
      const instanceCalls = Instance.mock.calls;
      instanceCalls.forEach(call => {
        expect(call[2]).toHaveProperty('subnetId');
      });

      // RDS should use private subnet IDs
      const rdsCall = RDSConstruct.mock.calls[0];
      expect(rdsCall[2]).toHaveProperty('subnetIds');
    });

    test("should handle cross-region configurations", () => {
      const app = new App();
      new TapStack(app, "RegionTest", {
        awsRegion: 'ap-southeast-2',
        stateBucketRegion: 'us-west-2',
        environmentSuffix: 'global'
      });

      // Provider uses deployment region
      expect(AwsProvider).toHaveBeenCalledWith(
        expect.anything(),
        'aws',
        expect.objectContaining({
          region: 'ap-southeast-2'
        })
      );

      // State backend uses different region
      expect(S3Backend).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          region: 'us-west-2',
          key: 'global/ap-southeast-2/RegionTest.tfstate'
        })
      );

      // AZs match deployment region
      expect(VPCConstruct).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        expect.objectContaining({
          azs: ['ap-southeast-2a', 'ap-southeast-2b']
        })
      );
    });
  });

  describe("Security and Compliance", () => {
    test("should enable encryption for all resources", () => {
      const app = new App();
      new TapStack(app, "test-stack");

      // S3 Backend encryption
      expect(S3Backend).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          encrypt: true
        })
      );

      // KMS key rotation
      expect(KmsKey).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        expect.objectContaining({
          enableKeyRotation: true
        })
      );

      // S3 bucket encryption
      expect(S3BucketConstruct).toHaveBeenNthCalledWith(
        1,
        expect.anything(),
        'public-s3',
        expect.objectContaining({
          encryption: 'SSE-S3'
        })
      );

      expect(S3BucketConstruct).toHaveBeenNthCalledWith(
        2,
        expect.anything(),
        'private-s3',
        expect.objectContaining({
          encryption: 'SSE-KMS'
        })
      );

      // RDS encryption
      expect(RDSConstruct).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        expect.objectContaining({
          storageEncrypted: true
        })
      );
    });

    test("should enforce IMDSv2 for EC2 instances", () => {
      const app = new App();
      new TapStack(app, "test-stack");

      const instanceCalls = Instance.mock.calls;
      instanceCalls.forEach(call => {
        expect(call[2].metadataOptions).toEqual({
          httpTokens: 'required',
          httpPutResponseHopLimit: 1
        });
      });
    });

    test("should enable S3 versioning", () => {
      const app = new App();
      new TapStack(app, "test-stack");

      const s3Calls = S3BucketConstruct.mock.calls;
      s3Calls.forEach(call => {
        expect(call[2]).toHaveProperty('versioning', true);
      });
    });

    test("should configure proper backup retention for production", () => {
      const app = new App();
      new TapStack(app, "test-stack", {
        environmentSuffix: 'production'
      });

      expect(RDSConstruct).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        expect.objectContaining({
          backupRetentionPeriod: 30
        })
      );
    });
  });
});
