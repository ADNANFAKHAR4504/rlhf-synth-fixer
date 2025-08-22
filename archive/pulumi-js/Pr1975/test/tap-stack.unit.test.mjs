// Mock the modules before importing anything
jest.mock("@pulumi/pulumi", () => ({
  ComponentResource: jest.fn().mockImplementation(function(type, name, args, opts) {
    this.registerOutputs = jest.fn();
    this.type = type;
    this.name = name;
    this.args = args;
    this.opts = opts;
  }),
  getStack: jest.fn(() => 'test-stack'),
  Output: {
    create: jest.fn((val) => ({ apply: (fn) => fn(val) }))
  }
}));

jest.mock("@pulumi/aws", () => ({
  ec2: {
    Vpc: jest.fn().mockImplementation((name, args) => ({ 
      id: "vpc-mock-id",
      name,
      args 
    })),
    InternetGateway: jest.fn().mockImplementation((name, args) => ({ 
      id: "igw-mock-id",
      name,
      args 
    })),
    Subnet: jest.fn().mockImplementation((name, args) => ({ 
      id: `subnet-mock-${name}`,
      name,
      args 
    })),
    RouteTable: jest.fn().mockImplementation((name, args) => ({ 
      id: "rt-mock-id",
      name,
      args 
    })),
    RouteTableAssociation: jest.fn().mockImplementation((name, args) => ({ 
      id: "rta-mock-id",
      name,
      args 
    })),
    SecurityGroup: jest.fn().mockImplementation((name, args) => ({ 
      id: "sg-mock-id",
      name,
      args 
    })),
    Instance: jest.fn().mockImplementation((name, args) => ({ 
      id: "i-mock-id",
      publicIp: "1.2.3.4",
      name,
      args 
    })),
    getAmiOutput: jest.fn(() => ({ 
      id: "ami-mock-id" 
    }))
  },
  s3: {
    Bucket: jest.fn().mockImplementation((name, args) => ({ 
      id: "bucket-mock-id",
      bucket: `${name}-bucket`,
      name,
      args 
    })),
    BucketVersioning: jest.fn().mockImplementation((name, args) => ({ 
      id: "versioning-mock-id",
      name,
      args 
    })),
    BucketServerSideEncryptionConfiguration: jest.fn().mockImplementation((name, args) => ({ 
      id: "encryption-mock-id",
      name,
      args 
    })),
    BucketLifecycleConfiguration: jest.fn().mockImplementation((name, args) => ({ 
      id: "lifecycle-mock-id",
      name,
      args 
    }))
  },
  iam: {
    Role: jest.fn().mockImplementation((name, args) => ({ 
      name: `${name}-role`,
      arn: `arn:aws:iam::123456789012:role/${name}`,
      args 
    })),
    InstanceProfile: jest.fn().mockImplementation((name, args) => ({ 
      name: `${name}-profile`,
      args 
    }))
  },
  dynamodb: {
    Table: jest.fn().mockImplementation((name, args) => ({ 
      name: `${name}-table`,
      arn: `arn:aws:dynamodb:us-west-2:123456789012:table/${name}`,
      args 
    }))
  }
}));

import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";

// Import after mocking
import { TapStack } from "../lib/tap-stack.mjs";

describe("TapStack Infrastructure Tests", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Stack Creation", () => {
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
      expect(stack.registerOutputs).toHaveBeenCalled();
    });

    it("should create TapStack with custom tags", () => {
      const stack = new TapStack("test-stack", {
        environmentSuffix: "dev",
        tags: {
          Owner: "TestTeam",
          Purpose: "Testing"
        }
      });
      expect(stack).toBeDefined();
    });
  });

  describe("VPC Resources", () => {
    it("should create VPC with correct configuration", () => {
      new TapStack("test-stack", { environmentSuffix: "test" });
      
      expect(aws.ec2.Vpc).toHaveBeenCalledWith(
        "migration-vpc-test",
        expect.objectContaining({
          cidrBlock: '10.0.0.0/16',
          enableDnsHostnames: true,
          enableDnsSupport: true,
          tags: expect.objectContaining({
            Name: "migration-vpc-test",
            Environment: "test"
          })
        }),
        expect.objectContaining({ parent: expect.any(Object) })
      );
    });

    it("should create Internet Gateway attached to VPC", () => {
      new TapStack("test-stack", { environmentSuffix: "test" });
      
      expect(aws.ec2.InternetGateway).toHaveBeenCalledWith(
        "migration-igw-test",
        expect.objectContaining({
          vpcId: "vpc-mock-id",
          tags: expect.objectContaining({
            Name: "migration-igw-test"
          })
        }),
        expect.objectContaining({ parent: expect.any(Object) })
      );
    });

    it("should create public subnet with correct configuration", () => {
      new TapStack("test-stack", { environmentSuffix: "test" });
      
      expect(aws.ec2.Subnet).toHaveBeenCalledWith(
        "migration-public-subnet-test",
        expect.objectContaining({
          vpcId: "vpc-mock-id",
          cidrBlock: '10.0.1.0/24',
          availabilityZone: 'us-west-2a',
          mapPublicIpOnLaunch: true
        }),
        expect.any(Object)
      );
    });

    it("should create private subnet with correct configuration", () => {
      new TapStack("test-stack", { environmentSuffix: "test" });
      
      expect(aws.ec2.Subnet).toHaveBeenCalledWith(
        "migration-private-subnet-test",
        expect.objectContaining({
          vpcId: "vpc-mock-id",
          cidrBlock: '10.0.2.0/24',
          availabilityZone: 'us-west-2b'
        }),
        expect.any(Object)
      );
    });

    it("should create route table with internet gateway route", () => {
      new TapStack("test-stack", { environmentSuffix: "test" });
      
      expect(aws.ec2.RouteTable).toHaveBeenCalledWith(
        "migration-public-rt-test",
        expect.objectContaining({
          vpcId: "vpc-mock-id",
          routes: expect.arrayContaining([
            expect.objectContaining({
              cidrBlock: '0.0.0.0/0',
              gatewayId: "igw-mock-id"
            })
          ])
        }),
        expect.any(Object)
      );
    });
  });

  describe("Security Group", () => {
    it("should create security group with HTTP and SSH rules", () => {
      new TapStack("test-stack", { environmentSuffix: "test" });
      
      expect(aws.ec2.SecurityGroup).toHaveBeenCalledWith(
        "migration-ec2-sg-test",
        expect.objectContaining({
          name: "migration-ec2-sg-test",
          description: 'Security group for migrated EC2 instance',
          vpcId: "vpc-mock-id",
          ingress: expect.arrayContaining([
            expect.objectContaining({
              protocol: 'tcp',
              fromPort: 80,
              toPort: 80,
              cidrBlocks: ['0.0.0.0/0'],
              description: 'HTTP access from anywhere'
            }),
            expect.objectContaining({
              protocol: 'tcp',
              fromPort: 22,
              toPort: 22,
              cidrBlocks: ['10.0.0.0/8'],
              description: 'SSH access from private networks'
            })
          ]),
          egress: expect.arrayContaining([
            expect.objectContaining({
              protocol: '-1',
              fromPort: 0,
              toPort: 0,
              cidrBlocks: ['0.0.0.0/0']
            })
          ])
        }),
        expect.any(Object)
      );
    });
  });

  describe("EC2 Resources", () => {
    it("should get Amazon Linux 2023 AMI", () => {
      new TapStack("test-stack", { environmentSuffix: "test" });
      
      expect(aws.ec2.getAmiOutput).toHaveBeenCalledWith(
        expect.objectContaining({
          filters: expect.arrayContaining([
            expect.objectContaining({
              name: 'name',
              values: ['al2023-ami-*-x86_64']
            }),
            expect.objectContaining({
              name: 'owner-alias',
              values: ['amazon']
            }),
            expect.objectContaining({
              name: 'state',
              values: ['available']
            })
          ]),
          owners: ['amazon'],
          mostRecent: true
        })
      );
    });

    it("should create IAM role for EC2", () => {
      new TapStack("test-stack", { environmentSuffix: "test" });
      
      expect(aws.iam.Role).toHaveBeenCalledWith(
        "migration-ec2-role-test",
        expect.objectContaining({
          assumeRolePolicy: expect.stringContaining('ec2.amazonaws.com')
        }),
        expect.any(Object)
      );
    });

    it("should create EC2 instance with correct configuration", () => {
      new TapStack("test-stack", { environmentSuffix: "test" });
      
      expect(aws.ec2.Instance).toHaveBeenCalledWith(
        "migration-ec2-test",
        expect.objectContaining({
          ami: "ami-mock-id",
          instanceType: 'c6i.large',
          monitoring: true
        }),
        expect.any(Object)
      );
    });
  });

  describe("S3 Resources", () => {
    it("should create S3 bucket with deterministic naming", () => {
      new TapStack("test-stack", { environmentSuffix: "test" });
      
      expect(aws.s3.Bucket).toHaveBeenCalledWith(
        "migration-bucket-test",
        expect.objectContaining({
          bucket: expect.stringContaining("migration-bucket-test"),
          forceDestroy: true,
          tags: expect.objectContaining({
            Name: "migration-bucket-test"
          })
        }),
        expect.any(Object)
      );
    });

    it("should enable S3 bucket versioning", () => {
      new TapStack("test-stack", { environmentSuffix: "test" });
      
      expect(aws.s3.BucketVersioning).toHaveBeenCalledWith(
        "migration-bucket-versioning-test",
        expect.objectContaining({
          bucket: "bucket-mock-id",
          versioningConfiguration: expect.objectContaining({
            status: 'Enabled'
          })
        }),
        expect.any(Object)
      );
    });

    it("should configure S3 bucket encryption", () => {
      new TapStack("test-stack", { environmentSuffix: "test" });
      
      expect(aws.s3.BucketServerSideEncryptionConfiguration).toHaveBeenCalledWith(
        "migration-bucket-encryption-test",
        expect.objectContaining({
          bucket: "bucket-mock-id",
          rules: expect.arrayContaining([
            expect.objectContaining({
              applyServerSideEncryptionByDefault: expect.objectContaining({
                sseAlgorithm: 'AES256'
              })
            })
          ])
        }),
        expect.any(Object)
      );
    });

    it("should configure S3 lifecycle policies", () => {
      new TapStack("test-stack", { environmentSuffix: "test" });
      
      expect(aws.s3.BucketLifecycleConfiguration).toHaveBeenCalledWith(
        "migration-bucket-lifecycle-test",
        expect.objectContaining({
          bucket: "bucket-mock-id",
          rules: expect.arrayContaining([
            expect.objectContaining({
              id: 'transition-to-ia',
              status: 'Enabled',
              transitions: expect.arrayContaining([
                expect.objectContaining({
                  days: 30,
                  storageClass: 'STANDARD_IA'
                }),
                expect.objectContaining({
                  days: 90,
                  storageClass: 'GLACIER'
                })
              ])
            })
          ])
        }),
        expect.any(Object)
      );
    });
  });

  describe("DynamoDB Resources", () => {
    it("should create DynamoDB table with correct configuration", () => {
      new TapStack("test-stack", { environmentSuffix: "test" });
      
      expect(aws.dynamodb.Table).toHaveBeenCalledWith(
        "migration-table-test",
        expect.objectContaining({
          name: "migration-table-test",
          billingMode: 'PAY_PER_REQUEST',
          hashKey: 'id',
          rangeKey: 'sortKey',
          attributes: expect.arrayContaining([
            expect.objectContaining({
              name: 'id',
              type: 'S'
            }),
            expect.objectContaining({
              name: 'sortKey',
              type: 'S'
            })
          ]),
          pointInTimeRecovery: expect.objectContaining({
            enabled: true
          }),
          deletionProtection: false
        }),
        expect.any(Object)
      );
    });
  });

  describe("Stack Outputs", () => {
    it("should expose all required outputs", () => {
      const stack = new TapStack("test-stack", { environmentSuffix: "test" });
      
      expect(stack.vpcId).toBeDefined();
      expect(stack.ec2InstanceId).toBeDefined();
      expect(stack.ec2PublicIp).toBeDefined();
      expect(stack.bucketName).toBeDefined();
      expect(stack.dynamoTableName).toBeDefined();
    });

    it("should register outputs correctly", () => {
      const stack = new TapStack("test-stack", { environmentSuffix: "test" });
      
      expect(stack.registerOutputs).toHaveBeenCalledWith(
        expect.objectContaining({
          vpcId: expect.anything(),
          ec2InstanceId: expect.anything(),
          ec2PublicIp: expect.anything(),
          bucketName: expect.anything(),
          dynamoTableName: expect.anything()
        })
      );
    });
  });

  describe("Error Handling", () => {
    it("should handle undefined args gracefully", () => {
      expect(() => {
        new TapStack("test-stack");
      }).not.toThrow();
    });

    it("should handle empty args object", () => {
      expect(() => {
        new TapStack("test-stack", {});
      }).not.toThrow();
    });

    it("should use default environment suffix when not provided", () => {
      new TapStack("test-stack", {});
      
      expect(aws.ec2.Vpc).toHaveBeenCalledWith(
        expect.stringContaining("migration-vpc-dev"),
        expect.any(Object),
        expect.any(Object)
      );
    });
  });

  describe("Resource Tagging", () => {
    it("should apply default tags to all resources", () => {
      new TapStack("test-stack", { environmentSuffix: "staging" });
      
      const expectedTags = expect.objectContaining({
        Environment: "staging",
        Project: 'Infrastructure-Migration',
        Region: 'us-west-2',
        ManagedBy: 'Pulumi'
      });

      expect(aws.ec2.Vpc).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ tags: expectedTags }),
        expect.any(Object)
      );
    });

    it("should merge custom tags with default tags", () => {
      new TapStack("test-stack", { 
        environmentSuffix: "prod",
        tags: {
          Owner: "DevOps",
          CostCenter: "Engineering"
        }
      });
      
      expect(aws.ec2.Vpc).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          tags: expect.objectContaining({
            Environment: "prod",
            Project: 'Infrastructure-Migration',
            Owner: "DevOps",
            CostCenter: "Engineering"
          })
        }),
        expect.any(Object)
      );
    });
  });
});