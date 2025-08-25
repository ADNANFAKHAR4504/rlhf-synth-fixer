// Mock the modules before importing anything
jest.mock("@pulumi/pulumi", () => ({
  ComponentResource: jest.fn().mockImplementation(function() {
    this.registerOutputs = jest.fn();
  }),
  getStack: jest.fn(() => 'test-stack'),
  jsonStringify: jest.fn((obj) => JSON.stringify(obj)),
  interpolate: jest.fn((template) => `interpolated-${template}`)
}));

jest.mock("@pulumi/aws", () => ({
  getAvailabilityZones: jest.fn(() => Promise.resolve({ names: ['us-east-1a', 'us-east-1b'] })),
  ec2: {
    Vpc: jest.fn(() => ({ id: 'mock-vpc-id', cidrBlock: '10.0.0.0/16' })),
    InternetGateway: jest.fn(() => ({ id: 'mock-igw-id' })),
    Subnet: jest.fn(() => ({ id: 'mock-subnet-id' })),
    Eip: jest.fn(() => ({ id: 'mock-eip-id' })),
    NatGateway: jest.fn(() => ({ id: 'mock-nat-gw-id' })),
    RouteTable: jest.fn(() => ({ id: 'mock-rt-id' })),
    Route: jest.fn(() => ({ id: 'mock-route-id' })),
    RouteTableAssociation: jest.fn(() => ({ id: 'mock-rta-id' })),
    SecurityGroup: jest.fn(() => ({ id: 'mock-sg-id' })),
    LaunchTemplate: jest.fn(() => ({ id: 'mock-lt-id' })),
    getAmi: jest.fn(() => Promise.resolve({ id: 'ami-12345678' }))
  },
  iam: {
    Role: jest.fn(() => ({ id: 'mock-role-id', name: 'mock-role-name', arn: 'mock-role-arn' })),
    RolePolicyAttachment: jest.fn(() => ({ id: 'mock-policy-attachment-id' })),
    InstanceProfile: jest.fn(() => ({ id: 'mock-profile-id', name: 'mock-profile-name' })),
    getRole: jest.fn(() => Promise.resolve({ arn: 'mock-existing-role-arn' }))
  },
  lb: {
    LoadBalancer: jest.fn(() => ({ 
      id: 'mock-alb-id', 
      dnsName: 'mock-alb-dns.us-east-1.elb.amazonaws.com',
      zoneId: 'Z123456789',
      arn: 'mock-alb-arn',
      arnSuffix: 'mock-alb-suffix'
    })),
    TargetGroup: jest.fn(() => ({ id: 'mock-tg-id', arn: 'mock-tg-arn' })),
    Listener: jest.fn(() => ({ id: 'mock-listener-id' }))
  },
  autoscaling: {
    Group: jest.fn(() => ({ id: 'mock-asg-id', name: 'prod-asg' })),
    Policy: jest.fn(() => ({ id: 'mock-policy-id', arn: 'mock-policy-arn' }))
  },
  cloudwatch: {
    MetricAlarm: jest.fn(() => ({ id: 'mock-alarm-id' })),
    Dashboard: jest.fn(() => ({ id: 'mock-dashboard-id', dashboardName: 'prod-web-app-dashboard' })),
    LogGroup: jest.fn(() => ({ id: 'mock-log-group-id' }))
  },
  rds: {
    SubnetGroup: jest.fn(() => ({ id: 'mock-db-subnet-group-id', name: 'prod-db-subnet-group' })),
    ParameterGroup: jest.fn(() => ({ id: 'mock-param-group-id', name: 'prod-db-param-group' })),
    Instance: jest.fn(() => ({ 
      id: 'mock-rds-id', 
      endpoint: 'mock-rds-endpoint.region.rds.amazonaws.com',
      port: 3306 
    }))
  },
  s3: {
    Bucket: jest.fn(() => ({ 
      id: 'mock-bucket-name', 
      arn: 'arn:aws:s3:::mock-bucket-name' 
    })),
    BucketPolicy: jest.fn(() => ({ id: 'mock-bucket-policy-id' })),
    BucketPublicAccessBlock: jest.fn(() => ({ id: 'mock-bucket-pab-id' })),
    BucketVersioning: jest.fn(() => ({ id: 'mock-bucket-versioning-id' })),
    BucketServerSideEncryptionConfiguration: jest.fn(() => ({ id: 'mock-bucket-encryption-id' }))
  }
}));

import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";

// Import after mocking
import { TapStack } from "../lib/tap-stack.mjs";

describe("TapStack Highly Available Web Application Infrastructure", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Basic Stack Creation", () => {
    it("should instantiate TapStack successfully", () => {
      const stack = new TapStack("TestTapStack", {});
      expect(stack).toBeDefined();
      expect(stack).toBeInstanceOf(TapStack);
    });

    it("should instantiate TapStack with custom environment suffix", () => {
      const stack = new TapStack("TestTapStackCustom", {
        environmentSuffix: "prod"
      });
      expect(stack).toBeDefined();
      expect(stack).toBeInstanceOf(TapStack);
    });

    it("should instantiate TapStack with custom tags", () => {
      const stack = new TapStack("TestTapStackTagged", {
        environmentSuffix: "dev",
        tags: {
          Project: "Custom",
          Owner: "TestUser"
        }
      });
      expect(stack).toBeDefined();
      expect(stack).toBeInstanceOf(TapStack);
    });

    it("should call super constructor with correct parameters", () => {
      new TapStack("TestTapStackSuper", {});
      
      expect(pulumi.ComponentResource).toHaveBeenCalledWith(
        'tap:stack:TapStack',
        'TestTapStackSuper',
        {},
        undefined
      );
    });
  });

  describe("VPC and Networking Infrastructure", () => {
    let stack;

    beforeEach(() => {
      stack = new TapStack("TestVPCStack", {
        environmentSuffix: "test",
        tags: { Environment: "testing" }
      });
    });

    it("should create VPC with correct configuration", () => {
      expect(aws.ec2.Vpc).toHaveBeenCalledWith('prod-vpc', 
        expect.objectContaining({
          cidrBlock: '10.0.0.0/16',
          enableDnsHostnames: true,
          enableDnsSupport: true,
          tags: expect.objectContaining({
            Name: 'prod-vpc',
            Project: 'prod-web-app'
          })
        }),
        expect.objectContaining({
          parent: expect.any(Object)
        })
      );
    });

    it("should create Internet Gateway", () => {
      expect(aws.ec2.InternetGateway).toHaveBeenCalledWith('prod-igw',
        expect.objectContaining({
          tags: expect.objectContaining({
            Name: 'prod-igw'
          })
        }),
        expect.objectContaining({
          parent: expect.any(Object)
        })
      );
    });

    it("should create public subnets in different AZs", () => {
      expect(aws.ec2.Subnet).toHaveBeenCalledWith('prod-public-subnet-1',
        expect.objectContaining({
          cidrBlock: '10.0.1.0/24',
          mapPublicIpOnLaunch: true,
          tags: expect.objectContaining({
            Name: 'prod-public-subnet-1',
            Type: 'public'
          })
        }),
        expect.objectContaining({
          parent: expect.any(Object)
        })
      );

      expect(aws.ec2.Subnet).toHaveBeenCalledWith('prod-public-subnet-2',
        expect.objectContaining({
          cidrBlock: '10.0.2.0/24',
          mapPublicIpOnLaunch: true,
          tags: expect.objectContaining({
            Name: 'prod-public-subnet-2',
            Type: 'public'
          })
        }),
        expect.objectContaining({
          parent: expect.any(Object)
        })
      );
    });

    it("should create private subnets in different AZs", () => {
      expect(aws.ec2.Subnet).toHaveBeenCalledWith('prod-private-subnet-1',
        expect.objectContaining({
          cidrBlock: '10.0.3.0/24',
          tags: expect.objectContaining({
            Name: 'prod-private-subnet-1',
            Type: 'private'
          })
        }),
        expect.objectContaining({
          parent: expect.any(Object)
        })
      );

      expect(aws.ec2.Subnet).toHaveBeenCalledWith('prod-private-subnet-2',
        expect.objectContaining({
          cidrBlock: '10.0.4.0/24',
          tags: expect.objectContaining({
            Name: 'prod-private-subnet-2',
            Type: 'private'
          })
        }),
        expect.objectContaining({
          parent: expect.any(Object)
        })
      );
    });

    it("should create NAT Gateways for high availability", () => {
      expect(aws.ec2.NatGateway).toHaveBeenCalledWith('prod-nat-gw-1',
        expect.objectContaining({
          tags: expect.objectContaining({
            Name: 'prod-nat-gw-1'
          })
        }),
        expect.objectContaining({
          parent: expect.any(Object)
        })
      );

      expect(aws.ec2.NatGateway).toHaveBeenCalledWith('prod-nat-gw-2',
        expect.objectContaining({
          tags: expect.objectContaining({
            Name: 'prod-nat-gw-2'
          })
        }),
        expect.objectContaining({
          parent: expect.any(Object)
        })
      );
    });

    it("should create Elastic IPs for NAT Gateways", () => {
      expect(aws.ec2.Eip).toHaveBeenCalledWith('prod-nat-eip-1',
        expect.objectContaining({
          domain: 'vpc',
          tags: expect.objectContaining({
            Name: 'prod-nat-eip-1'
          })
        }),
        expect.objectContaining({
          parent: expect.any(Object),
          dependsOn: expect.any(Array)
        })
      );

      expect(aws.ec2.Eip).toHaveBeenCalledWith('prod-nat-eip-2',
        expect.objectContaining({
          domain: 'vpc',
          tags: expect.objectContaining({
            Name: 'prod-nat-eip-2'
          })
        }),
        expect.objectContaining({
          parent: expect.any(Object),
          dependsOn: expect.any(Array)
        })
      );
    });
  });

  describe("Security Groups", () => {
    let stack;

    beforeEach(() => {
      stack = new TapStack("TestSecurityStack", {
        environmentSuffix: "test"
      });
    });

    it("should create ALB security group with HTTP/HTTPS access", () => {
      expect(aws.ec2.SecurityGroup).toHaveBeenCalledWith('prod-alb-sg',
        expect.objectContaining({
          namePrefix: 'prod-alb-sg',
          description: 'Security group for Application Load Balancer',
          ingress: expect.arrayContaining([
            expect.objectContaining({
              fromPort: 80,
              toPort: 80,
              protocol: 'tcp',
              cidrBlocks: ['0.0.0.0/0']
            }),
            expect.objectContaining({
              fromPort: 443,
              toPort: 443,
              protocol: 'tcp',
              cidrBlocks: ['0.0.0.0/0']
            })
          ]),
          egress: expect.arrayContaining([
            expect.objectContaining({
              fromPort: 0,
              toPort: 0,
              protocol: '-1',
              cidrBlocks: ['0.0.0.0/0']
            })
          ]),
          tags: expect.objectContaining({
            Name: 'prod-alb-sg'
          })
        }),
        expect.objectContaining({
          parent: expect.any(Object)
        })
      );
    });

    it("should create EC2 security group with restricted access", () => {
      expect(aws.ec2.SecurityGroup).toHaveBeenCalledWith('prod-ec2-sg',
        expect.objectContaining({
          namePrefix: 'prod-ec2-sg',
          description: 'Security group for EC2 instances',
          ingress: expect.arrayContaining([
            expect.objectContaining({
              fromPort: 80,
              toPort: 80,
              protocol: 'tcp'
            }),
            expect.objectContaining({
              fromPort: 22,
              toPort: 22,
              protocol: 'tcp'
            })
          ]),
          tags: expect.objectContaining({
            Name: 'prod-ec2-sg'
          })
        }),
        expect.objectContaining({
          parent: expect.any(Object)
        })
      );
    });

    it("should create RDS security group with database access", () => {
      expect(aws.ec2.SecurityGroup).toHaveBeenCalledWith('prod-rds-sg',
        expect.objectContaining({
          namePrefix: 'prod-rds-sg',
          description: 'Security group for RDS database',
          ingress: expect.arrayContaining([
            expect.objectContaining({
              fromPort: 3306,
              toPort: 3306,
              protocol: 'tcp'
            })
          ]),
          tags: expect.objectContaining({
            Name: 'prod-rds-sg'
          })
        }),
        expect.objectContaining({
          parent: expect.any(Object)
        })
      );
    });
  });

  describe("IAM Roles and Policies", () => {
    let stack;

    beforeEach(() => {
      stack = new TapStack("TestIAMStack", {
        environmentSuffix: "test"
      });
    });

    it("should create EC2 instance role", () => {
      expect(aws.iam.Role).toHaveBeenCalledWith('prod-ec2-role',
        expect.objectContaining({
          namePrefix: 'prod-ec2-role',
          assumeRolePolicy: expect.any(String),
          tags: expect.objectContaining({
            Name: 'prod-ec2-role'
          })
        }),
        expect.objectContaining({
          parent: expect.any(Object)
        })
      );
    });

    it("should attach CloudWatch policy to EC2 role", () => {
      expect(aws.iam.RolePolicyAttachment).toHaveBeenCalledWith('prod-ec2-cloudwatch',
        expect.objectContaining({
          policyArn: 'arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy'
        }),
        expect.objectContaining({
          parent: expect.any(Object)
        })
      );
    });

    it("should attach S3 read policy to EC2 role", () => {
      expect(aws.iam.RolePolicyAttachment).toHaveBeenCalledWith('prod-ec2-s3-read',
        expect.objectContaining({
          policyArn: 'arn:aws:iam::aws:policy/AmazonS3ReadOnlyAccess'
        }),
        expect.objectContaining({
          parent: expect.any(Object)
        })
      );
    });

    it("should create instance profile", () => {
      expect(aws.iam.InstanceProfile).toHaveBeenCalledWith('prod-ec2-profile',
        expect.objectContaining({
          namePrefix: 'prod-ec2-profile'
        }),
        expect.objectContaining({
          parent: expect.any(Object)
        })
      );
    });
  });

  describe("Load Balancer Configuration", () => {
    let stack;

    beforeEach(() => {
      stack = new TapStack("TestALBStack", {
        environmentSuffix: "test"
      });
    });

    it("should create Application Load Balancer", () => {
      expect(aws.lb.LoadBalancer).toHaveBeenCalledWith(expect.stringMatching(/prod-alb-.+/),
        expect.objectContaining({
          name: expect.stringMatching(/prod-alb-.+/),
          internal: false,
          loadBalancerType: 'application',
          enableDeletionProtection: false,
          tags: expect.objectContaining({
            Name: expect.stringMatching(/prod-alb-.+/)
          })
        }),
        expect.objectContaining({
          parent: expect.any(Object)
        })
      );
    });

    it("should create target group with health checks", () => {
      expect(aws.lb.TargetGroup).toHaveBeenCalledWith(expect.stringMatching(/prod-tg-.+/),
        expect.objectContaining({
          name: expect.stringMatching(/prod-tg-.+/),
          port: 80,
          protocol: 'HTTP',
          healthCheck: expect.objectContaining({
            enabled: true,
            healthyThreshold: 2,
            unhealthyThreshold: 2,
            timeout: 5,
            interval: 30,
            path: '/',
            matcher: '200',
            port: 'traffic-port',
            protocol: 'HTTP'
          }),
          tags: expect.objectContaining({
            Name: expect.stringMatching(/prod-tg-.+/)
          })
        }),
        expect.objectContaining({
          parent: expect.any(Object)
        })
      );
    });

    it("should create ALB listener", () => {
      expect(aws.lb.Listener).toHaveBeenCalledWith(expect.stringMatching(/prod-alb-listener-.+/),
        expect.objectContaining({
          port: 80,
          protocol: 'HTTP',
          defaultActions: expect.arrayContaining([
            expect.objectContaining({
              type: 'forward'
            })
          ])
        }),
        expect.objectContaining({
          parent: expect.any(Object)
        })
      );
    });
  });

  describe("Auto Scaling Configuration", () => {
    let stack;

    beforeEach(() => {
      stack = new TapStack("TestASGStack", {
        environmentSuffix: "test"
      });
    });

    it("should create launch template", () => {
      expect(aws.ec2.LaunchTemplate).toHaveBeenCalledWith(expect.stringMatching(/prod-launch-template-.+/),
        expect.objectContaining({
          namePrefix: expect.stringMatching(/prod-launch-template-.+/),
          instanceType: 't3.micro',
          userData: expect.any(String),
          tagSpecifications: expect.arrayContaining([
            expect.objectContaining({
              resourceType: 'instance',
              tags: expect.objectContaining({
                Name: 'prod-web-server'
              })
            })
          ])
        }),
        expect.objectContaining({
          parent: expect.any(Object)
        })
      );
    });

    it("should create Auto Scaling Group", () => {
      expect(aws.autoscaling.Group).toHaveBeenCalledWith(expect.stringMatching(/prod-asg-.+/),
        expect.objectContaining({
          name: expect.stringMatching(/prod-asg-.+/),
          healthCheckType: 'ELB',
          healthCheckGracePeriod: 300,
          minSize: 2,
          maxSize: 6,
          desiredCapacity: 2,
          launchTemplate: expect.objectContaining({
            version: '$Latest'
          })
        }),
        expect.objectContaining({
          parent: expect.any(Object)
        })
      );
    });

    it("should create scaling policies", () => {
      expect(aws.autoscaling.Policy).toHaveBeenCalledWith(expect.stringMatching(/prod-scale-up-.+/),
        expect.objectContaining({
          name: expect.stringMatching(/prod-scale-up-.+/),
          scalingAdjustment: 2,
          adjustmentType: 'ChangeInCapacity',
          cooldown: 300
        }),
        expect.objectContaining({
          parent: expect.any(Object)
        })
      );

      expect(aws.autoscaling.Policy).toHaveBeenCalledWith(expect.stringMatching(/prod-scale-down-.+/),
        expect.objectContaining({
          name: expect.stringMatching(/prod-scale-down-.+/),
          scalingAdjustment: -1,
          adjustmentType: 'ChangeInCapacity',
          cooldown: 300
        }),
        expect.objectContaining({
          parent: expect.any(Object)
        })
      );
    });
  });

  describe("RDS Database Configuration", () => {
    let stack;

    beforeEach(() => {
      stack = new TapStack("TestRDSStack", {
        environmentSuffix: "test"
      });
    });

    it("should create DB subnet group", () => {
      expect(aws.rds.SubnetGroup).toHaveBeenCalledWith(expect.stringMatching(/prod-db-subnet-group-.+/),
        expect.objectContaining({
          name: expect.stringMatching(/prod-db-subnet-group-.+/),
          description: 'Subnet group for RDS database',
          tags: expect.objectContaining({
            Name: expect.stringMatching(/prod-db-subnet-group-.+/)
          })
        }),
        expect.objectContaining({
          parent: expect.any(Object)
        })
      );
    });

    it("should create parameter group", () => {
      expect(aws.rds.ParameterGroup).toHaveBeenCalledWith(expect.stringMatching(/prod-db-param-group-.+/),
        expect.objectContaining({
          name: expect.stringMatching(/prod-db-param-group-.+/),
          family: 'mysql8.0',
          description: 'Parameter group for RDS MySQL database',
          parameters: expect.arrayContaining([
            expect.objectContaining({
              name: 'slow_query_log',
              value: '1'
            }),
            expect.objectContaining({
              name: 'long_query_time',
              value: '2'
            })
          ]),
          tags: expect.objectContaining({
            Name: expect.stringMatching(/prod-db-param-group-.+/)
          })
        }),
        expect.objectContaining({
          parent: expect.any(Object)
        })
      );
    });

    it("should create RDS instance with Multi-AZ and monitoring", () => {
      expect(aws.rds.Instance).toHaveBeenCalledWith(expect.stringMatching(/prod-mysql-db-.+/),
        expect.objectContaining({
          identifier: expect.stringMatching(/prod-mysql-db-.+/),
          engine: 'mysql',
          engineVersion: '8.0',
          instanceClass: 'db.t3.micro',
          allocatedStorage: 20,
          storageType: 'gp2',
          storageEncrypted: true,
          dbName: 'proddb',
          username: 'admin',
          manageMasterUserPassword: true,
          multiAz: true,
          backupRetentionPeriod: 7,
          backupWindow: '03:00-04:00',
          maintenanceWindow: 'sun:04:00-sun:05:00',
          deletionProtection: false,
          skipFinalSnapshot: true,
          performanceInsightsEnabled: false,
          monitoringInterval: 60,
          tags: expect.objectContaining({
            Name: expect.stringMatching(/prod-mysql-db-.+/)
          })
        }),
        expect.objectContaining({
          parent: expect.any(Object)
        })
      );
    });
  });

  describe("S3 Bucket Configuration", () => {
    let stack;

    beforeEach(() => {
      stack = new TapStack("TestS3Stack", {
        environmentSuffix: "test"
      });
    });

    it("should create S3 bucket", () => {
      expect(aws.s3.Bucket).toHaveBeenCalledWith(expect.stringMatching(/prod-static-assets-.+/),
        expect.objectContaining({
          bucket: expect.stringMatching(/prod-static-assets-/),
          tags: expect.objectContaining({
            Name: expect.stringMatching(/prod-static-assets-.+/)
          })
        }),
        expect.objectContaining({
          parent: expect.any(Object)
        })
      );
    });

    it("should create bucket versioning configuration", () => {
      expect(aws.s3.BucketVersioning).toHaveBeenCalledWith(expect.stringMatching(/prod-bucket-versioning-.+/),
        expect.objectContaining({
          bucket: expect.any(String),
          versioningConfiguration: expect.objectContaining({
            status: 'Enabled'
          })
        }),
        expect.objectContaining({
          parent: expect.any(Object)
        })
      );
    });

    it("should create bucket server-side encryption configuration", () => {
      expect(aws.s3.BucketServerSideEncryptionConfiguration).toHaveBeenCalledWith(expect.stringMatching(/prod-bucket-encryption-.+/),
        expect.objectContaining({
          bucket: expect.any(String),
          rules: expect.arrayContaining([
            expect.objectContaining({
              applyServerSideEncryptionByDefault: expect.objectContaining({
                sseAlgorithm: 'AES256'
              })
            })
          ])
        }),
        expect.objectContaining({
          parent: expect.any(Object)
        })
      );
    });

    it("should create bucket policy for HTTPS only", () => {
      expect(aws.s3.BucketPolicy).toHaveBeenCalledWith(expect.stringMatching(/prod-bucket-policy-.+/),
        expect.objectContaining({
          bucket: expect.any(String),
          policy: expect.any(String)
        }),
        expect.objectContaining({
          parent: expect.any(Object)
        })
      );
    });

    it("should block public access", () => {
      expect(aws.s3.BucketPublicAccessBlock).toHaveBeenCalledWith(expect.stringMatching(/prod-bucket-pab-.+/),
        expect.objectContaining({
          blockPublicAcls: true,
          blockPublicPolicy: true,
          ignorePublicAcls: true,
          restrictPublicBuckets: true
        }),
        expect.objectContaining({
          parent: expect.any(Object)
        })
      );
    });
  });

  describe("CloudWatch Monitoring", () => {
    let stack;

    beforeEach(() => {
      stack = new TapStack("TestMonitoringStack", {
        environmentSuffix: "test"
      });
    });

    it("should create CPU-based alarms for scaling", () => {
      expect(aws.cloudwatch.MetricAlarm).toHaveBeenCalledWith(expect.stringMatching(/prod-high-cpu-alarm-.+/),
        expect.objectContaining({
          name: expect.stringMatching(/prod-high-cpu-alarm-.+/),
          description: 'Alarm when CPU exceeds 70%',
          metricName: 'CPUUtilization',
          namespace: 'AWS/EC2',
          statistic: 'Average',
          period: 120,
          evaluationPeriods: 2,
          threshold: 70,
          comparisonOperator: 'GreaterThanThreshold'
        }),
        expect.objectContaining({
          parent: expect.any(Object)
        })
      );

      expect(aws.cloudwatch.MetricAlarm).toHaveBeenCalledWith(expect.stringMatching(/prod-low-cpu-alarm-.+/),
        expect.objectContaining({
          name: expect.stringMatching(/prod-low-cpu-alarm-.+/),
          description: 'Alarm when CPU is below 30%',
          metricName: 'CPUUtilization',
          namespace: 'AWS/EC2',
          statistic: 'Average',
          period: 120,
          evaluationPeriods: 2,
          threshold: 30,
          comparisonOperator: 'LessThanThreshold'
        }),
        expect.objectContaining({
          parent: expect.any(Object)
        })
      );
    });

    it("should create CloudWatch dashboard", () => {
      expect(aws.cloudwatch.Dashboard).toHaveBeenCalledWith(expect.stringMatching(/prod-dashboard-.+/),
        expect.objectContaining({
          dashboardName: expect.stringMatching(/prod-web-app-dashboard-.+/),
          dashboardBody: expect.any(String)
        }),
        expect.objectContaining({
          parent: expect.any(Object)
        })
      );
    });

    it("should create log groups", () => {
      expect(aws.cloudwatch.LogGroup).toHaveBeenCalledWith(expect.stringMatching(/prod-ec2-logs-.+/),
        expect.objectContaining({
          name: expect.stringMatching(/\/aws\/ec2\/prod-web-servers-.+/),
          retentionInDays: 14
        }),
        expect.objectContaining({
          parent: expect.any(Object)
        })
      );

      expect(aws.cloudwatch.LogGroup).toHaveBeenCalledWith(expect.stringMatching(/prod-alb-logs-.+/),
        expect.objectContaining({
          name: expect.stringMatching(/\/aws\/applicationloadbalancer\/prod-alb-.+/),
          retentionInDays: 14
        }),
        expect.objectContaining({
          parent: expect.any(Object)
        })
      );
    });
  });

  describe("Stack Outputs", () => {
    let stack;

    beforeEach(() => {
      stack = new TapStack("TestOutputsStack", {
        environmentSuffix: "test"
      });
    });

    it("should register all required outputs", () => {
      expect(stack.registerOutputs).toHaveBeenCalledWith(
        expect.objectContaining({
          vpcId: expect.anything(),
          albDnsName: expect.anything(),
          albZoneId: expect.anything(),
          bucketName: expect.anything(),
          rdsEndpoint: expect.anything(),
          rdsPort: expect.anything(),
          dashboardUrl: expect.anything()
        })
      );
    });

    it("should expose public properties", () => {
      expect(stack.vpcId).toBeDefined();
      expect(stack.albDnsName).toBeDefined();
      expect(stack.bucketName).toBeDefined();
      expect(stack.rdsEndpoint).toBeDefined();
      expect(stack.dashboardUrl).toBeDefined();
    });
  });

  describe("Configuration Handling", () => {
    it("should handle undefined args gracefully", () => {
      expect(() => {
        const stack = new TapStack("TestTapStackUndefined");
        expect(stack).toBeDefined();
      }).not.toThrow();
    });

    it("should handle empty args object", () => {
      expect(() => {
        const stack = new TapStack("TestTapStackEmpty", {});
        expect(stack).toBeDefined();
      }).not.toThrow();
    });

    it("should use default environment suffix", () => {
      const stack = new TapStack("TestTapStackDefault", {});
      expect(stack).toBeDefined();
      // Default environmentSuffix should be 'dev'
    });

    it("should merge custom tags with default tags", () => {
      const stack = new TapStack("TestTapStackCustomTags", {
        environmentSuffix: "prod",
        tags: {
          Owner: "DevOps Team",
          CostCenter: "Engineering"
        }
      });
      expect(stack).toBeDefined();
    });
  });
});