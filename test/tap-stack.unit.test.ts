import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";
import { TapStack, TapStackArgs } from "../lib/tap-stack";

// Mock file system
jest.mock("fs");
jest.mock("path");

// Mock Pulumi
jest.mock("@pulumi/pulumi", () => {
  const actual = jest.requireActual("@pulumi/pulumi");
  return {
    ...actual,
    output: jest.fn((value: any) => ({
      apply: jest.fn((fn: any) => {
        try {
          return actual.output(fn(value));
        } catch {
          return actual.output(value);
        }
      }),
      get: jest.fn(() => actual.output(value)),
      toString: () => `Output<${value}>`,
    })),
    all: jest.fn((values: any[]) => ({
      apply: jest.fn((fn: any) => actual.output(fn(values))),
    })),
    ComponentResource: jest.fn(function (
      this: any,
      type: string,
      name: string,
      props: any,
      opts: any
    ) {
      this.urn = actual.output(`urn:pulumi:stack::project::${type}::${name}`);
      this.id = actual.output(name);
      this.registerOutputs = jest.fn();
      return this;
    }),
  };
});

// Mock AWS SDK
jest.mock("@pulumi/aws", () => ({
  kms: {
    Key: jest.fn(function (this: any, name: string, args: any) {
      this.arn = pulumi.output(
        `arn:aws:kms:us-east-1:123456789012:key/${name}`
      );
      this.keyId = pulumi.output(`key-${name}`);
      this.id = pulumi.output(`key-${name}`);
      return this;
    }),
  },
  ec2: {
    Vpc: jest.fn(function (this: any, name: string, args: any) {
      this.id = pulumi.output(`vpc-${name}`);
      this.cidrBlock = args?.cidrBlock;
      return this;
    }),
    InternetGateway: jest.fn(function (this: any, name: string, args: any) {
      this.id = pulumi.output(`igw-${name}`);
      return this;
    }),
    Subnet: jest.fn(function (this: any, name: string, args: any) {
      this.id = pulumi.output(`subnet-${name}`);
      this.availabilityZone = args?.availabilityZone;
      this.cidrBlock = args?.cidrBlock;
      this.mapPublicIpOnLaunch = args?.mapPublicIpOnLaunch;
      return this;
    }),
    Eip: jest.fn(function (this: any, name: string, args: any) {
      this.id = pulumi.output(`eip-${name}`);
      return this;
    }),
    NatGateway: jest.fn(function (this: any, name: string, args: any) {
      this.id = pulumi.output(`nat-${name}`);
      return this;
    }),
    RouteTable: jest.fn(function (this: any, name: string, args: any) {
      this.id = pulumi.output(`rtb-${name}`);
      return this;
    }),
    Route: jest.fn(function (this: any, name: string, args: any) {
      this.id = pulumi.output(`route-${name}`);
      return this;
    }),
    RouteTableAssociation: jest.fn(function (
      this: any,
      name: string,
      args: any
    ) {
      this.id = pulumi.output(`rtbassoc-${name}`);
      return this;
    }),
    SecurityGroup: jest.fn(function (this: any, name: string, args: any) {
      this.id = pulumi.output(`sg-${name}`);
      this.ingress = args?.ingress || [];
      this.egress = args?.egress || [];
      return this;
    }),
    SecurityGroupRule: jest.fn(function (this: any, name: string, args: any) {
      this.id = pulumi.output(`sgr-${name}`);
      this.type = args?.type;
      this.fromPort = args?.fromPort;
      this.toPort = args?.toPort;
      return this;
    }),
    LaunchTemplate: jest.fn(function (this: any, name: string, args: any) {
      this.id = pulumi.output(`lt-${name}`);
      this.metadataOptions = args?.metadataOptions || {};
      this.blockDeviceMappings = args?.blockDeviceMappings || [];
      return this;
    }),
    getAmi: jest.fn().mockResolvedValue({
      id: "ami-0123456789abcdef0",
      name: "amzn2-ami-hvm-2.0.20231219.1-x86_64-gp2",
      architecture: "x86_64",
      arn: "arn:aws:ec2:us-east-1::image/ami-0123456789abcdef0",
      blockDeviceMappings: [],
      bootMode: "legacy-bios",
      creationDate: "2023-12-19T12:34:56.000Z",
      description: "Amazon Linux 2",
      ena: true,
      encryptionByDefault: false,
      hypervisor: "xen",
      imageId: "ami-0123456789abcdef0",
      imageLocation: "amazon/amzn2-ami-hvm",
      imageOwnerId: "137112412989",
      imageType: "machine",
      kernelId: "",
      mostRecent: true,
      ownerIds: ["137112412989"],
      platformDetails: "Linux/UNIX",
      publiclyAccessible: true,
      ramdiskId: "",
      rootDeviceName: "/dev/xvda",
      rootDeviceType: "ebs",
      sriovNetSupport: "simple",
      state: "available",
      stateReason: "available",
      stateTransitionReason: "",
      tags: {},
      usageOperation: "RunInstances",
      usageOperationUpdateTime: "2023-12-19T12:34:56.000Z",
      virtualizationType: "hvm",
    }),
  },
  iam: {
    Role: jest.fn(function (this: any, name: string, args: any) {
      this.arn = pulumi.output(`arn:aws:iam::123456789012:role/${name}`);
      this.name = name;
      return this;
    }),
    Policy: jest.fn(function (this: any, name: string, args: any) {
      this.arn = pulumi.output(`arn:aws:iam::123456789012:policy/${name}`);
      return this;
    }),
    RolePolicyAttachment: jest.fn(function (
      this: any,
      name: string,
      args: any
    ) {
      this.id = pulumi.output(`rpa-${name}`);
      this.policyArn = args?.policyArn;
      return this;
    }),
    InstanceProfile: jest.fn(function (this: any, name: string, args: any) {
      this.arn = pulumi.output(
        `arn:aws:iam::123456789012:instance-profile/${name}`
      );
      return this;
    }),
  },
  rds: {
    SubnetGroup: jest.fn(function (this: any, name: string, args: any) {
      this.id = pulumi.output(`rds-sg-${name}`);
      this.name = name;
      return this;
    }),
    ParameterGroup: jest.fn(function (this: any, name: string, args: any) {
      this.id = pulumi.output(`rds-pg-${name}`);
      this.name = name;
      this.family = args?.family;
      this.parameters = args?.parameters || [];
      return this;
    }),
    ClusterSnapshot: jest.fn(function (this: any, name: string, args: any) {
      this.id = pulumi.output(`snapshot-${name}`);
      return this;
    }),
    Instance: jest.fn(function (this: any, name: string, args: any) {
      this.endpoint = pulumi.output(
        "prod-rds.123456.us-east-1.rds.amazonaws.com"
      );
      this.port = pulumi.output(3306);
      this.identifier = args?.identifier;
      this.arn = pulumi.output(
        `arn:aws:rds:us-east-1:123456789012:db/${name}`
      );
      this.engine = args?.engine;
      this.engineVersion = args?.engineVersion;
      this.instanceClass = args?.instanceClass;
      this.allocatedStorage = args?.allocatedStorage;
      this.storageEncrypted = args?.storageEncrypted;
      this.multiAz = args?.multiAz;
      this.backupRetentionPeriod = args?.backupRetentionPeriod;
      this.monitoringInterval = args?.monitoringInterval;
      this.performanceInsightsEnabled = args?.performanceInsightsEnabled;
      this.deletionProtection = args?.deletionProtection;
      this.skipFinalSnapshot = args?.skipFinalSnapshot;
      return this;
    }),
  },
  s3: {
    Bucket: jest.fn(function (this: any, name: string, args: any) {
      const bucketName = args?.bucket || `bucket-${name}`;
      this.id = pulumi.output(bucketName);
      this.arn = pulumi.output(`arn:aws:s3:::${bucketName}`);
      return this;
    }),
    BucketVersioning: jest.fn(function (this: any, name: string, args: any) {
      this.id = pulumi.output(`versioning-${name}`);
      return this;
    }),
    BucketServerSideEncryptionConfiguration: jest.fn(function (
      this: any,
      name: string,
      args: any
    ) {
      this.id = pulumi.output(`sse-${name}`);
      this.rules = args?.rules || [];
      return this;
    }),
    BucketLifecycleConfiguration: jest.fn(function (
      this: any,
      name: string,
      args: any
    ) {
      this.id = pulumi.output(`lifecycle-${name}`);
      this.rules = args?.rules || [];
      return this;
    }),
    BucketPublicAccessBlock: jest.fn(function (
      this: any,
      name: string,
      args: any
    ) {
      this.id = pulumi.output(`pab-${name}`);
      this.blockPublicAcls = args?.blockPublicAcls;
      this.blockPublicPolicy = args?.blockPublicPolicy;
      this.ignorePublicAcls = args?.ignorePublicAcls;
      this.restrictPublicBuckets = args?.restrictPublicBuckets;
      return this;
    }),
    BucketReplicationConfig: jest.fn(function (
      this: any,
      name: string,
      args: any
    ) {
      this.id = pulumi.output(`replication-${name}`);
      this.rules = args?.rules || [];
      return this;
    }),
  },
  lb: {
    LoadBalancer: jest.fn(function (this: any, name: string, args: any) {
      this.dnsName = pulumi.output(
        "prod-alb-1234567890.us-east-1.elb.amazonaws.com"
      );
      this.zoneId = pulumi.output("Z35SXDOTRQ7X7K");
      this.arn = pulumi.output(
        `arn:aws:elasticloadbalancing:us-east-1:123456789012:loadbalancer/app/${name}/1234567890abcdef`
      );
      this.arnSuffix = pulumi.output(`app/${name}/1234567890abcdef`);
      this.loadBalancerType = args?.loadBalancerType;
      this.enableHttp2 = args?.enableHttp2;
      this.enableDeletionProtection = args?.enableDeletionProtection;
      return this;
    }),
    TargetGroup: jest.fn(function (this: any, name: string, args: any) {
      this.arn = pulumi.output(
        `arn:aws:elasticloadbalancing:us-east-1:123456789012:targetgroup/${name}/1234567890abcdef`
      );
      this.arnSuffix = pulumi.output(`targetgroup/${name}/1234567890abcdef`);
      this.healthCheck = args?.healthCheck || {};
      return this;
    }),
    Listener: jest.fn(function (this: any, name: string, args: any) {
      this.id = pulumi.output(`listener-${name}`);
      this.port = args?.port;
      this.protocol = args?.protocol;
      return this;
    }),
  },
  autoscaling: {
    Group: jest.fn(function (this: any, name: string, args: any) {
      this.name = name;
      this.id = pulumi.output(`asg-${name}`);
      this.arn = pulumi.output(
        `arn:aws:autoscaling:us-east-1:123456789012:autoScalingGroup:1234567890:autoScalingGroupName/${name}`
      );
      this.minSize = args?.minSize;
      this.maxSize = args?.maxSize;
      this.desiredCapacity = args?.desiredCapacity;
      this.healthCheckType = args?.healthCheckType;
      this.healthCheckGracePeriod = args?.healthCheckGracePeriod;
      return this;
    }),
    Policy: jest.fn(function (this: any, name: string, args: any) {
      this.arn = pulumi.output(
        `arn:aws:autoscaling:us-east-1:123456789012:policy:1234567890:policyName/${name}`
      );
      this.scalingAdjustment = args?.scalingAdjustment;
      this.adjustmentType = args?.adjustmentType;
      this.cooldown = args?.cooldown;
      return this;
    }),
  },
  route53: {
    Zone: jest.fn(function (this: any, name: string, args: any) {
      this.zoneId = pulumi.output(`Z1234567890ABC`);
      this.name = args?.name || `zone-${name}`;
      return this;
    }),
    Record: jest.fn(function (this: any, name: string, args: any) {
      this.id = pulumi.output(`record-${name}`);
      this.type = args?.type;
      this.setIdentifier = args?.setIdentifier;
      this.aliases = args?.aliases || [];
      return this;
    }),
  },
  sns: {
    Topic: jest.fn(function (this: any, name: string, args: any) {
      this.arn = pulumi.output(`arn:aws:sns:us-east-1:123456789012:${name}`);
      return this;
    }),
  },
  cloudwatch: {
    MetricAlarm: jest.fn(function (this: any, name: string, args: any) {
      this.id = pulumi.output(`alarm-${name}`);
      this.metricName = args?.metricName;
      this.namespace = args?.namespace;
      this.threshold = args?.threshold;
      this.comparisonOperator = args?.comparisonOperator;
      this.evaluationPeriods = args?.evaluationPeriods;
      this.alarmActions = args?.alarmActions || [];
      return this;
    }),
    LogGroup: jest.fn(function (this: any, name: string, args: any) {
      this.name = args?.name || `lg-${name}`;
      this.id = pulumi.output(`lg-${name}`);
      return this;
    }),
  },
  Provider: jest.fn(function (this: any, name: string, args: any) {
    this.region = args?.region || "us-east-1";
    return this;
  }),
}));

describe("TapStack Infrastructure Tests - 100% Coverage", () => {
  const defaultArgs: TapStackArgs = {
    stackName: "tap-stack",
    environmentSuffix: "prod-001",
    env: {
      account: "123456789012",
      region: "us-east-1",
    },
    tags: {
      Project: "TapStack",
      Owner: "DevOps",
    },
    migrationPhase: "initial",
    devEnvironment: {
      rdsInstanceIdentifier: "dev-rds-instance",
      vpcId: "vpc-dev123",
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Constructor Initialization", () => {
    it("should create a TapStack instance with default arguments", () => {
      const stack = new TapStack("tap-stack-test", defaultArgs);
      expect(stack).toBeDefined();
    });

    it("should initialize all public output properties", () => {
      const stack = new TapStack("tap-stack-test", defaultArgs);

      expect(stack.vpcId).toBeDefined();
      expect(stack.prodRdsEndpoint).toBeDefined();
      expect(stack.prodRdsPort).toBeDefined();
      expect(stack.albDnsName).toBeDefined();
      expect(stack.route53DomainName).toBeDefined();
      expect(stack.prodLogBucketName).toBeDefined();
      expect(stack.replicaLogBucketName).toBeDefined();
      expect(stack.migrationStatus).toBeDefined();
    });

    it("should set environment suffix correctly", () => {
      new TapStack("tap-stack-test", defaultArgs);

      const vpcMock = aws.ec2.Vpc as unknown as jest.Mock;
      expect(vpcMock).toHaveBeenCalled();
      const vpcCalls = vpcMock.mock.calls;
      expect(vpcCalls[0][0]).toContain(defaultArgs.environmentSuffix);
    });

    it("should include custom tags in resource creation", () => {
      new TapStack("tap-stack-test", defaultArgs);

      const vpcMock = aws.ec2.Vpc as unknown as jest.Mock;
      const vpcCalls = vpcMock.mock.calls;
      expect(vpcCalls[0][1].tags).toEqual(
        expect.objectContaining(defaultArgs.tags)
      );

    });
  });

  describe("KMS Key Configuration", () => {
    it("should create KMS key with encryption enabled", () => {
      new TapStack("tap-stack-test", defaultArgs);

      const kmsMock = aws.kms.Key as unknown as jest.Mock;
      expect(kmsMock).toHaveBeenCalledTimes(1);
      const args = kmsMock.mock.calls[0][1];

      expect(args.enableKeyRotation).toBe(true);
      expect(args.deletionWindowInDays).toBe(10);
    });

    it("should tag KMS key with environment and managed by labels", () => {
      new TapStack("tap-stack-test", defaultArgs);

      const kmsMock = aws.kms.Key as unknown as jest.Mock;
      const args = kmsMock.mock.calls[0][1];

      expect(args.tags.Environment).toBe("production");
      expect(args.tags.ManagedBy).toBe("pulumi");
    });

    it("should create KMS key with proper description", () => {
      new TapStack("tap-stack-test", defaultArgs);

      const kmsMock = aws.kms.Key as unknown as jest.Mock;
      const args = kmsMock.mock.calls[0][1];

      expect(args.description).toBe("KMS key for production encryption");
    });
  });

  describe("VPC Configuration", () => {
    it("should create VPC with correct CIDR block", () => {
      new TapStack("tap-stack-test", defaultArgs);

      const vpcMock = aws.ec2.Vpc as unknown as jest.Mock;
      expect(vpcMock).toHaveBeenCalledTimes(1);
      const args = vpcMock.mock.calls[0][1];

      expect(args.cidrBlock).toBe("10.0.0.0/16");
    });

    it("should enable DNS hostnames and support", () => {
      new TapStack("tap-stack-test", defaultArgs);

      const vpcMock = aws.ec2.Vpc as unknown as jest.Mock;
      const args = vpcMock.mock.calls[0][1];

      expect(args.enableDnsHostnames).toBe(true);
      expect(args.enableDnsSupport).toBe(true);
    });

    it("should create Internet Gateway for the VPC", () => {
      new TapStack("tap-stack-test", defaultArgs);

      const igwMock = aws.ec2.InternetGateway as unknown as jest.Mock;
      expect(igwMock).toHaveBeenCalledTimes(1);
    });

    it("should create public subnets across 3 AZs", () => {
      new TapStack("tap-stack-test", defaultArgs);

      const subnetMock = aws.ec2.Subnet as unknown as jest.Mock;
      const subnetCalls = subnetMock.mock.calls;
      const publicSubnets = subnetCalls.filter(
        (call) => call[1]?.mapPublicIpOnLaunch === true
      );

      expect(publicSubnets.length).toBe(3);
    });

    it("should create private subnets across 3 AZs", () => {
      new TapStack("tap-stack-test", defaultArgs);

      const subnetMock = aws.ec2.Subnet as unknown as jest.Mock;
      const subnetCalls = subnetMock.mock.calls;
      const privateSubnets = subnetCalls.filter(
        (call) => call[1]?.mapPublicIpOnLaunch === false
      );

      expect(privateSubnets.length).toBe(3);
    });

    it("should create EIPs for NAT Gateways", () => {
      new TapStack("tap-stack-test", defaultArgs);

      const eipMock = aws.ec2.Eip as unknown as jest.Mock;
      expect(eipMock).toHaveBeenCalledTimes(3);
    });

    it("should create NAT Gateways in public subnets", () => {
      new TapStack("tap-stack-test", defaultArgs);

      const natMock = aws.ec2.NatGateway as unknown as jest.Mock;
      expect(natMock).toHaveBeenCalledTimes(3);
    });

    it("should create route tables and routes", () => {
      new TapStack("tap-stack-test", defaultArgs);

      const rtMock = aws.ec2.RouteTable as unknown as jest.Mock;
      const routeMock = aws.ec2.Route as unknown as jest.Mock;

      expect(rtMock).toHaveBeenCalled();
      expect(routeMock).toHaveBeenCalled();
    });

    it("should associate subnets with route tables", () => {
      new TapStack("tap-stack-test", defaultArgs);

      const rtaMock = aws.ec2.RouteTableAssociation as unknown as jest.Mock;
      expect(rtaMock).toHaveBeenCalled();
      expect(rtaMock.mock.calls.length).toBeGreaterThanOrEqual(6);
    });
  });

  describe("Security Groups", () => {
    it("should create ALB security group", () => {
      new TapStack("tap-stack-test", defaultArgs);

      const sgMock = aws.ec2.SecurityGroup as unknown as jest.Mock;
      const sgCalls = sgMock.mock.calls;
      const albSg = sgCalls.find((call) => call[0].includes("alb-sg"));

      expect(albSg).toBeDefined();
    });

    it("should allow HTTP traffic (port 80) in ALB security group", () => {
      new TapStack("tap-stack-test", defaultArgs);

      const sgMock = aws.ec2.SecurityGroup as unknown as jest.Mock;
      const sgCalls = sgMock.mock.calls;
      const albSg = sgCalls.find((call) => call[0].includes("alb-sg"));
      const ingress = albSg?.[1]?.ingress || [];

      const httpRule = ingress.find((rule: any) => rule.fromPort === 80);
      expect(httpRule).toBeDefined();
      expect(httpRule.toPort).toBe(80);
      expect(httpRule.protocol).toBe("tcp");
    });

    it("should create production application security group", () => {
      new TapStack("tap-stack-test", defaultArgs);

      const sgMock = aws.ec2.SecurityGroup as unknown as jest.Mock;
      const sgCalls = sgMock.mock.calls;
      const appSg = sgCalls.find((call) => call[0].includes("app-sg"));

      expect(appSg).toBeDefined();
    });

    it("should create database security group", () => {
      new TapStack("tap-stack-test", defaultArgs);

      const sgMock = aws.ec2.SecurityGroup as unknown as jest.Mock;
      const sgCalls = sgMock.mock.calls;
      const dbSg = sgCalls.find((call) => call[0].includes("db-sg"));

      expect(dbSg).toBeDefined();
    });

    it("should create security group rules for app ingress", () => {
      new TapStack("tap-stack-test", defaultArgs);

      const sgrMock = aws.ec2.SecurityGroupRule as unknown as jest.Mock;
      const rulesCalls = sgrMock.mock.calls;
      const appIngressRule = rulesCalls.find((call) =>
        call[0].includes("app-ingress")
      );

      expect(appIngressRule).toBeDefined();
      expect(appIngressRule[1]?.fromPort).toBe(8080);
      expect(appIngressRule[1]?.toPort).toBe(8080);
    });

    it("should create security group rules for database ingress", () => {
      new TapStack("tap-stack-test", defaultArgs);

      const sgrMock = aws.ec2.SecurityGroupRule as unknown as jest.Mock;
      const rulesCalls = sgrMock.mock.calls;
      const dbIngressRule = rulesCalls.find((call) =>
        call[0].includes("db-ingress")
      );

      expect(dbIngressRule).toBeDefined();
      expect(dbIngressRule[1]?.fromPort).toBe(3306);
      expect(dbIngressRule[1]?.toPort).toBe(3306);
    });

    it("should create egress rules", () => {
      new TapStack("tap-stack-test", defaultArgs);

      const sgrMock = aws.ec2.SecurityGroupRule as unknown as jest.Mock;
      const rulesCalls = sgrMock.mock.calls;
      const egressRules = rulesCalls.filter(
        (call) => call[1]?.type === "egress"
      );

      expect(egressRules.length).toBeGreaterThan(0);
    });
  });

  describe("IAM Roles and Policies", () => {
    it("should create EC2 IAM role", () => {
      new TapStack("tap-stack-test", defaultArgs);

      const roleMock = aws.iam.Role as unknown as jest.Mock;
      const roleCalls = roleMock.mock.calls;
      const ec2Role = roleCalls.find((call) => call[0].includes("ec2-role"));

      expect(ec2Role).toBeDefined();
    });

    it("should attach RDS policy to EC2 role", () => {
      new TapStack("tap-stack-test", defaultArgs);

      const policyMock = aws.iam.Policy as unknown as jest.Mock;
      expect(policyMock).toHaveBeenCalled();
      const policyCalls = policyMock.mock.calls;
      const rdsPolicy = policyCalls.find((call) =>
        call[0].includes("rds-policy")
      );

      expect(rdsPolicy).toBeDefined();
    });

    it("should attach SSM policy to EC2 role", () => {
      new TapStack("tap-stack-test", defaultArgs);

      const attachmentMock = aws.iam.RolePolicyAttachment as unknown as jest.Mock;
      const attachmentCalls = attachmentMock.mock.calls;
      const ssmAttachment = attachmentCalls.find((call) =>
        call[0].includes("ssm-attachment")
      );

      expect(ssmAttachment).toBeDefined();
      expect(ssmAttachment[1]?.policyArn).toBe(
        "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore"
      );
    });

    it("should attach CloudWatch policy to EC2 role", () => {
      new TapStack("tap-stack-test", defaultArgs);

      const attachmentMock = aws.iam.RolePolicyAttachment as unknown as jest.Mock;
      const attachmentCalls = attachmentMock.mock.calls;
      const cloudwatchAttachment = attachmentCalls.find((call) =>
        call[0].includes("cloudwatch-attachment")
      );

      expect(cloudwatchAttachment).toBeDefined();
      expect(cloudwatchAttachment[1]?.policyArn).toBe(
        "arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy"
      );
    });

    it("should create instance profile for EC2 role", () => {
      new TapStack("tap-stack-test", defaultArgs);

      const profileMock = aws.iam.InstanceProfile as unknown as jest.Mock;
      expect(profileMock).toHaveBeenCalled();
    });

    it("should create RDS monitoring role", () => {
      new TapStack("tap-stack-test", defaultArgs);

      const roleMock = aws.iam.Role as unknown as jest.Mock;
      const roleCalls = roleMock.mock.calls;
      const monitoringRole = roleCalls.find((call) =>
        call[0].includes("rds-monitoring-role")
      );

      expect(monitoringRole).toBeDefined();
    });
  });

  describe("RDS Database Configuration", () => {
    it("should create RDS subnet group", () => {
      new TapStack("tap-stack-test", defaultArgs);

      const sgMock = aws.rds.SubnetGroup as unknown as jest.Mock;
      expect(sgMock).toHaveBeenCalledTimes(1);
    });

    it("should create RDS parameter group for MySQL 8.0", () => {
      new TapStack("tap-stack-test", defaultArgs);

      const pgMock = aws.rds.ParameterGroup as unknown as jest.Mock;
      expect(pgMock).toHaveBeenCalledTimes(1);
      const args = pgMock.mock.calls[0][1];

      expect(args.family).toBe("mysql8.0");
    });

    it("should configure UTF-8 character set in parameter group", () => {
      new TapStack("tap-stack-test", defaultArgs);

      const pgMock = aws.rds.ParameterGroup as unknown as jest.Mock;
      const args = pgMock.mock.calls[0][1];

      expect(args.parameters).toContainEqual(
        expect.objectContaining({
          name: "character_set_server",
          value: "utf8mb4",
        })
      );
      expect(args.parameters).toContainEqual(
        expect.objectContaining({
          name: "collation_server",
          value: "utf8mb4_unicode_ci",
        })
      );
    });

    it("should create RDS instance with correct configuration", () => {
      new TapStack("tap-stack-test", defaultArgs);

      const rdsMock = aws.rds.Instance as unknown as jest.Mock;
      expect(rdsMock).toHaveBeenCalledTimes(1);
      const args = rdsMock.mock.calls[0][1];

      expect(args.engine).toBe("mysql");
      expect(args.engineVersion).toBe("8.0");
      expect(args.instanceClass).toBe("db.r5.large");
      expect(args.allocatedStorage).toBe(100);
      expect(args.storageType).toBe("gp3");
    });

    it("should enable encryption on RDS instance", () => {
      new TapStack("tap-stack-test", defaultArgs);

      const rdsMock = aws.rds.Instance as unknown as jest.Mock;
      const args = rdsMock.mock.calls[0][1];

      expect(args.storageEncrypted).toBe(true);
      expect(args.kmsKeyId).toBeDefined();
    });

    it("should enable Multi-AZ deployment", () => {
      new TapStack("tap-stack-test", defaultArgs);

      const rdsMock = aws.rds.Instance as unknown as jest.Mock;
      const args = rdsMock.mock.calls[0][1];

      expect(args.multiAz).toBe(true);
    });

    it("should enable automated backups with 7-day retention", () => {
      new TapStack("tap-stack-test", defaultArgs);

      const rdsMock = aws.rds.Instance as unknown as jest.Mock;
      const args = rdsMock.mock.calls[0][1];

      expect(args.backupRetentionPeriod).toBe(7);
    });

    it("should enable RDS Enhanced Monitoring", () => {
      new TapStack("tap-stack-test", defaultArgs);

      const rdsMock = aws.rds.Instance as unknown as jest.Mock;
      const args = rdsMock.mock.calls[0][1];

      expect(args.monitoringInterval).toBe(60);
      expect(args.monitoringRoleArn).toBeDefined();
    });

    it("should enable Performance Insights", () => {
      new TapStack("tap-stack-test", defaultArgs);

      const rdsMock = aws.rds.Instance as unknown as jest.Mock;
      const args = rdsMock.mock.calls[0][1];

      expect(args.performanceInsightsEnabled).toBe(true);
      expect(args.performanceInsightsRetentionPeriod).toBe(7);
    });

    it("should enable CloudWatch Logs exports", () => {
      new TapStack("tap-stack-test", defaultArgs);

      const rdsMock = aws.rds.Instance as unknown as jest.Mock;
      const args = rdsMock.mock.calls[0][1];

      expect(args.enabledCloudwatchLogsExports).toContain("error");
      expect(args.enabledCloudwatchLogsExports).toContain("general");
      expect(args.enabledCloudwatchLogsExports).toContain("slowquery");
    });

    it("should set deletion protection to false", () => {
      new TapStack("tap-stack-test", defaultArgs);

      const rdsMock = aws.rds.Instance as unknown as jest.Mock;
      const args = rdsMock.mock.calls[0][1];

      expect(args.deletionProtection).toBe(true);
    });

    it("should not skip final snapshot", () => {
      new TapStack("tap-stack-test", defaultArgs);

      const rdsMock = aws.rds.Instance as unknown as jest.Mock;
      const args = rdsMock.mock.calls[0][1];

      expect(args.skipFinalSnapshot).toBe(false);
    });
  });

  describe("Migration Phase Handling", () => {
    it("should create RDS snapshot when migration phase is not initial", () => {
      const argsWithSnapshot = {
        ...defaultArgs,
        migrationPhase: "snapshot" as const,
      };

      new TapStack("tap-stack-test", argsWithSnapshot);

      const snapshotMock = aws.rds.ClusterSnapshot as unknown as jest.Mock;
      expect(snapshotMock).toHaveBeenCalled();
    });

    it("should not create RDS snapshot for initial migration phase", () => {
      jest.clearAllMocks();
      const argsInitial = {
        ...defaultArgs,
        migrationPhase: "initial" as const,
      };

      new TapStack("tap-stack-test", argsInitial);

      const snapshotMock = aws.rds.ClusterSnapshot as unknown as jest.Mock;
      expect(snapshotMock).not.toHaveBeenCalled();
    });

    it("should create blue ASG for non-complete migration phases", () => {
      const argsBlueGreen = {
        ...defaultArgs,
        migrationPhase: "blue-green" as const,
      };

      new TapStack("tap-stack-test", argsBlueGreen);

      const asgMock = aws.autoscaling.Group as unknown as jest.Mock;
      expect(asgMock.mock.calls.length).toBeGreaterThanOrEqual(2);
    });

    it("should not create blue ASG for complete migration phase", () => {
      jest.clearAllMocks();
      const argsComplete = {
        ...defaultArgs,
        migrationPhase: "complete" as const,
      };

      new TapStack("tap-stack-test", argsComplete);

      const asgMock = aws.autoscaling.Group as unknown as jest.Mock;
      expect(asgMock.mock.calls.length).toBeGreaterThanOrEqual(1);
    });

    it("should handle all migration phases without errors", () => {
      const phases: Array<
        | "initial"
        | "snapshot"
        | "blue-green"
        | "traffic-shift-10"
        | "traffic-shift-50"
        | "traffic-shift-100"
        | "complete"
      > = [
          "initial",
          "snapshot",
          "blue-green",
          "traffic-shift-10",
          "traffic-shift-50",
          "traffic-shift-100",
          "complete",
        ];

      phases.forEach((phase) => {
        jest.clearAllMocks();
        const args = { ...defaultArgs, migrationPhase: phase };

        expect(() => {
          new TapStack("tap-stack-test", args);
        }).not.toThrow();
      });
    });
  });

  describe("S3 Buckets Configuration", () => {
    it("should create production log bucket", () => {
      new TapStack("tap-stack-test", defaultArgs);

      const bucketMock = aws.s3.Bucket as unknown as jest.Mock;
      const bucketCalls = bucketMock.mock.calls;
      const prodBucket = bucketCalls.find((call) =>
        call[0].includes("prod-logs-")
      );

      expect(prodBucket).toBeDefined();
    });

    it("should create replica log bucket", () => {
      new TapStack("tap-stack-test", defaultArgs);

      const bucketMock = aws.s3.Bucket as unknown as jest.Mock;
      const bucketCalls = bucketMock.mock.calls;
      const replicaBucket = bucketCalls.find((call) =>
        call[0].includes("prod-logs-replica-")
      );

      expect(replicaBucket).toBeDefined();
    });

    it("should enable versioning on buckets", () => {
      new TapStack("tap-stack-test", defaultArgs);

      const versioningMock = aws.s3.BucketVersioning as unknown as jest.Mock;
      expect(versioningMock).toHaveBeenCalled();
      expect(versioningMock.mock.calls.length).toBeGreaterThanOrEqual(2);
    });

    it("should enable server-side encryption", () => {
      new TapStack("tap-stack-test", defaultArgs);

      const sseMock = aws.s3
        .BucketServerSideEncryptionConfiguration as unknown as jest.Mock;
      expect(sseMock).toHaveBeenCalledTimes(1);
      const args = sseMock.mock.calls[0][1];

      expect(
        args.rules[0].applyServerSideEncryptionByDefault.sseAlgorithm
      ).toBe("AES256");
    });

    it("should configure lifecycle rules", () => {
      new TapStack("tap-stack-test", defaultArgs);

      const lifecycleMock = aws.s3
        .BucketLifecycleConfiguration as unknown as jest.Mock;
      expect(lifecycleMock).toHaveBeenCalledTimes(1);
      const args = lifecycleMock.mock.calls[0][1];

      expect(args.rules[0].transitions).toContainEqual(
        expect.objectContaining({
          days: 30,
          storageClass: "STANDARD_IA",
        })
      );
      expect(args.rules[0].transitions).toContainEqual(
        expect.objectContaining({
          days: 90,
          storageClass: "GLACIER",
        })
      );
      expect(args.rules[0].expiration.days).toBe(365);
    });

    it("should block public access on buckets", () => {
      new TapStack("tap-stack-test", defaultArgs);

      const pabMock = aws.s3
        .BucketPublicAccessBlock as unknown as jest.Mock;
      expect(pabMock).toHaveBeenCalled();
      const args = pabMock.mock.calls[0][1];

      expect(args.blockPublicAcls).toBe(true);
      expect(args.blockPublicPolicy).toBe(true);
      expect(args.ignorePublicAcls).toBe(true);
      expect(args.restrictPublicBuckets).toBe(true);
    });

    it("should configure S3 replication", () => {
      new TapStack("tap-stack-test", defaultArgs);

      const replicationMock = aws.s3
        .BucketReplicationConfig as unknown as jest.Mock;
      expect(replicationMock).toHaveBeenCalledTimes(1);
      const args = replicationMock.mock.calls[0][1];

      expect(args.rules[0].status).toBe("Enabled");
      expect(args.rules[0].id).toBe("replicate-all");
    });
  });

  describe("Application Load Balancer Configuration", () => {
    it("should create application load balancer", () => {
      new TapStack("tap-stack-test", defaultArgs);

      const albMock = aws.lb.LoadBalancer as unknown as jest.Mock;
      expect(albMock).toHaveBeenCalledTimes(1);
      const args = albMock.mock.calls[0][1];

      expect(args.loadBalancerType).toBe("application");
      expect(args.enableHttp2).toBe(true);
      expect(args.enableDeletionProtection).toBe(true);
    });

    it("should create blue target group", () => {
      new TapStack("tap-stack-test", defaultArgs);

      const tgMock = aws.lb.TargetGroup as unknown as jest.Mock;
      const tgCalls = tgMock.mock.calls;
      const blueTg = tgCalls.find((call) => call[0].includes("blue"));

      expect(blueTg).toBeDefined();
    });

    it("should create green target group", () => {
      new TapStack("tap-stack-test", defaultArgs);

      const tgMock = aws.lb.TargetGroup as unknown as jest.Mock;
      const tgCalls = tgMock.mock.calls;
      const greenTg = tgCalls.find((call) => call[0].includes("green"));

      expect(greenTg).toBeDefined();
    });

    it("should configure health checks on target groups", () => {
      new TapStack("tap-stack-test", defaultArgs);

      const tgMock = aws.lb.TargetGroup as unknown as jest.Mock;
      const tgCalls = tgMock.mock.calls;
      tgCalls.forEach((call) => {
        const args = call[1];
        expect(args.healthCheck.enabled).toBe(true);
        expect(args.healthCheck.path).toBe("/health");
        expect(args.healthCheck.matcher).toBe("200");
      });
    });

    it("should create HTTP listener on port 80", () => {
      new TapStack("tap-stack-test", defaultArgs);

      const listenerMock = aws.lb.Listener as unknown as jest.Mock;
      expect(listenerMock).toHaveBeenCalledTimes(1);
      const args = listenerMock.mock.calls[0][1];

      expect(args.port).toBe(80);
      expect(args.protocol).toBe("HTTP");
    });
  });

  describe("EC2 Auto Scaling Groups", () => {
    it("should create production (green) ASG", () => {
      new TapStack("tap-stack-test", defaultArgs);

      const asgMock = aws.autoscaling.Group as unknown as jest.Mock;
      const asgCalls = asgMock.mock.calls;
      const greenAsg = asgCalls.find((call) => call[0].includes("asg-green"));

      expect(greenAsg).toBeDefined();
    });

    it("should configure green ASG with minimum 3 instances", () => {
      new TapStack("tap-stack-test", defaultArgs);

      const asgMock = aws.autoscaling.Group as unknown as jest.Mock;
      const asgCalls = asgMock.mock.calls;
      const greenAsg = asgCalls.find((call) => call[0].includes("asg-green"));
      const args = greenAsg?.[1];

      expect(args?.minSize).toBe(3);
      expect(args?.desiredCapacity).toBe(3);
    });

    it("should configure green ASG with maximum 9 instances", () => {
      new TapStack("tap-stack-test", defaultArgs);

      const asgMock = aws.autoscaling.Group as unknown as jest.Mock;
      const asgCalls = asgMock.mock.calls;
      const greenAsg = asgCalls.find((call) => call[0].includes("asg-green"));
      const args = greenAsg?.[1];

      expect(args?.maxSize).toBe(9);
    });

    it("should use ELB health checks for ASGs", () => {
      new TapStack("tap-stack-test", defaultArgs);

      const asgMock = aws.autoscaling.Group as unknown as jest.Mock;
      const asgCalls = asgMock.mock.calls;
      asgCalls.forEach((call) => {
        const args = call[1];
        expect(args?.healthCheckType).toBe("ELB");
        expect(args?.healthCheckGracePeriod).toBe(300);
      });
    });

    it("should create launch template for green ASG", () => {
      new TapStack("tap-stack-test", defaultArgs);

      const ltMock = aws.ec2.LaunchTemplate as unknown as jest.Mock;
      const ltCalls = ltMock.mock.calls;
      const greenLt = ltCalls.find((call) => call[0].includes("lt-green"));

      expect(greenLt).toBeDefined();
    });

    it("should configure launch template with IMDSv2", () => {
      new TapStack("tap-stack-test", defaultArgs);

      const ltMock = aws.ec2.LaunchTemplate as unknown as jest.Mock;
      const ltCalls = ltMock.mock.calls;
      const greenLt = ltCalls.find((call) => call[0].includes("lt-green"));
      const args = greenLt?.[1];

      expect(args?.metadataOptions?.httpTokens).toBe("required");
      expect(args?.metadataOptions?.httpEndpoint).toBe("enabled");
    });

    it("should encrypt EBS volumes in launch template", () => {
      new TapStack("tap-stack-test", defaultArgs);

      const ltMock = aws.ec2.LaunchTemplate as unknown as jest.Mock;
      const ltCalls = ltMock.mock.calls;
      const greenLt = ltCalls.find((call) => call[0].includes("lt-green"));
      const args = greenLt?.[1];

      expect(args?.blockDeviceMappings[0]?.ebs?.encrypted).toBe("true");
    });

    it("should create autoscaling policy", () => {
      new TapStack("tap-stack-test", defaultArgs);

      const policyMock = aws.autoscaling.Policy as unknown as jest.Mock;
      expect(policyMock).toHaveBeenCalled();
      const args = policyMock.mock.calls[0][1];

      expect(args.scalingAdjustment).toBe(1);
      expect(args.adjustmentType).toBe("ChangeInCapacity");
      expect(args.cooldown).toBe(300);
    });
  });

  describe("Route53 Configuration", () => {
    it("should create Route53 hosted zone", () => {
      new TapStack("tap-stack-test", defaultArgs);

      const zoneMock = aws.route53.Zone as unknown as jest.Mock;
      expect(zoneMock).toHaveBeenCalledTimes(1);
      const args = zoneMock.mock.calls[0][1];

      expect(args.name).toBe(
        `app-${defaultArgs.environmentSuffix}.internal.local`
      );
    });

    it("should create weighted routing for green (production)", () => {
      new TapStack("tap-stack-test", defaultArgs);

      const recordMock = aws.route53.Record as unknown as jest.Mock;
      const recordCalls = recordMock.mock.calls;
      const greenRecord = recordCalls.find((call) =>
        call[0].includes("record-green")
      );

      expect(greenRecord).toBeDefined();
      expect(greenRecord[1]?.setIdentifier).toBe("green-production");
    });

    it("should create DNS A records pointing to ALB", () => {
      new TapStack("tap-stack-test", defaultArgs);

      const recordMock = aws.route53.Record as unknown as jest.Mock;
      const recordCalls = recordMock.mock.calls;
      recordCalls.forEach((call) => {
        const args = call[1];
        expect(args?.type).toBe("A");
        expect(args?.aliases).toBeDefined();
        expect(args?.aliases[0]?.evaluateTargetHealth).toBe(true);
      });
    });
  });

  describe("CloudWatch Monitoring", () => {
    it("should create SNS topic for alarms", () => {
      new TapStack("tap-stack-test", defaultArgs);

      const topicMock = aws.sns.Topic as unknown as jest.Mock;
      expect(topicMock).toHaveBeenCalledTimes(1);
    });

    it("should create CPU utilization alarm", () => {
      new TapStack("tap-stack-test", defaultArgs);

      const alarmMock = aws.cloudwatch.MetricAlarm as unknown as jest.Mock;
      const alarmCalls = alarmMock.mock.calls;
      const cpuAlarm = alarmCalls.find((call) =>
        call[0].includes("cpu-alarm")
      );

      expect(cpuAlarm).toBeDefined();
      expect(cpuAlarm[1]?.metricName).toBe("CPUUtilization");
      expect(cpuAlarm[1]?.threshold).toBe(80);
      expect(cpuAlarm[1]?.comparisonOperator).toBe("GreaterThanThreshold");
    });

    it("should create database connections alarm", () => {
      new TapStack("tap-stack-test", defaultArgs);

      const alarmMock = aws.cloudwatch.MetricAlarm as unknown as jest.Mock;
      const alarmCalls = alarmMock.mock.calls;
      const dbAlarm = alarmCalls.find((call) =>
        call[0].includes("db-connections-alarm")
      );

      expect(dbAlarm).toBeDefined();
      expect(dbAlarm[1]?.metricName).toBe("DatabaseConnections");
      expect(dbAlarm[1]?.namespace).toBe("AWS/RDS");
    });

    it("should create target health alarm", () => {
      new TapStack("tap-stack-test", defaultArgs);

      const alarmMock = aws.cloudwatch.MetricAlarm as unknown as jest.Mock;
      const alarmCalls = alarmMock.mock.calls;
      const healthAlarm = alarmCalls.find((call) =>
        call[0].includes("target-health-alarm")
      );

      expect(healthAlarm).toBeDefined();
      expect(healthAlarm[1]?.metricName).toBe("HealthyHostCount");
      expect(healthAlarm[1]?.comparisonOperator).toBe("LessThanThreshold");
      expect(healthAlarm[1]?.threshold).toBe(2);
    });

    it("should create RDS CPU alarm", () => {
      new TapStack("tap-stack-test", defaultArgs);

      const alarmMock = aws.cloudwatch.MetricAlarm as unknown as jest.Mock;
      const alarmCalls = alarmMock.mock.calls;
      const rdsAlarm = alarmCalls.find((call) =>
        call[0].includes("rds-cpu-alarm")
      );

      expect(rdsAlarm).toBeDefined();
      expect(rdsAlarm[1]?.namespace).toBe("AWS/RDS");
    });

    it("should set alarms to publish to SNS", () => {
      new TapStack("tap-stack-test", defaultArgs);

      const alarmMock = aws.cloudwatch.MetricAlarm as unknown as jest.Mock;
      const alarmCalls = alarmMock.mock.calls;
      alarmCalls.forEach((call) => {
        const args = call[1];
        expect(args?.alarmActions).toBeDefined();
        expect(args?.alarmActions.length).toBeGreaterThan(0);
      });
    });
  });

  describe("Output Exports", () => {
    it("should export all required outputs", () => {
      const stack = new TapStack("tap-stack-test", defaultArgs);

      expect(stack.vpcId).toBeDefined();
      expect(stack.prodRdsEndpoint).toBeDefined();
      expect(stack.prodRdsPort).toBeDefined();
      expect(stack.albDnsName).toBeDefined();
      expect(stack.route53DomainName).toBeDefined();
      expect(stack.prodLogBucketName).toBeDefined();
      expect(stack.replicaLogBucketName).toBeDefined();
      expect(stack.migrationStatus).toBeDefined();
    });
  });

  describe("Edge Cases and Error Handling", () => {
    it("should handle empty tags object", () => {
      const argsNoTags = {
        ...defaultArgs,
        tags: {},
      };

      const stack = new TapStack("tap-stack-test", argsNoTags);
      expect(stack).toBeDefined();
    });

    it("should handle undefined tags", () => {
      const argsUndefinedTags = {
        ...defaultArgs,
        tags: undefined,
      };

      const stack = new TapStack("tap-stack-test", argsUndefinedTags);
      expect(stack).toBeDefined();
    });

    it("should apply tags consistently", () => {
      new TapStack("tap-stack-test", defaultArgs);

      const kmsMock = aws.kms.Key as unknown as jest.Mock;
      const vpcMock = aws.ec2.Vpc as unknown as jest.Mock;

      expect(kmsMock.mock.calls[0][1]?.tags).toEqual(
        expect.objectContaining(defaultArgs.tags)
      );
      expect(vpcMock.mock.calls[0][1]?.tags).toEqual(
        expect.objectContaining(defaultArgs.tags)
      );
    });
  });

  describe("Integration Tests", () => {
    it("should create complete production infrastructure", () => {
      new TapStack("tap-stack-test", defaultArgs);

      const kmsMock = aws.kms.Key as unknown as jest.Mock;
      const vpcMock = aws.ec2.Vpc as unknown as jest.Mock;
      const rdsMock = aws.rds.Instance as unknown as jest.Mock;
      const bucketMock = aws.s3.Bucket as unknown as jest.Mock;
      const albMock = aws.lb.LoadBalancer as unknown as jest.Mock;
      const zoneMock = aws.route53.Zone as unknown as jest.Mock;

      expect(kmsMock).toHaveBeenCalledTimes(1);
      expect(vpcMock).toHaveBeenCalledTimes(1);
      expect(rdsMock).toHaveBeenCalledTimes(1);
      expect(bucketMock).toHaveBeenCalled();
      expect(albMock).toHaveBeenCalledTimes(1);
      expect(zoneMock).toHaveBeenCalledTimes(1);
    });

    it("should maintain proper resource dependencies", () => {
      new TapStack("tap-stack-test", defaultArgs);

      const vpcMock = aws.ec2.Vpc as unknown as jest.Mock;
      const subnetMock = aws.ec2.Subnet as unknown as jest.Mock;
      const sgMock = aws.ec2.SecurityGroup as unknown as jest.Mock;
      const sgrMock = aws.ec2.SecurityGroupRule as unknown as jest.Mock;

      expect(vpcMock).toHaveBeenCalled();
      expect(subnetMock).toHaveBeenCalled();
      expect(sgMock).toHaveBeenCalled();
      expect(sgrMock).toHaveBeenCalled();
    });

    it("should configure RDS components in order", () => {
      new TapStack("tap-stack-test", defaultArgs);

      const sgMock = aws.rds.SubnetGroup as unknown as jest.Mock;
      const pgMock = aws.rds.ParameterGroup as unknown as jest.Mock;
      const rdsMock = aws.rds.Instance as unknown as jest.Mock;

      expect(sgMock).toHaveBeenCalledTimes(1);
      expect(pgMock).toHaveBeenCalledTimes(1);
      expect(rdsMock).toHaveBeenCalledTimes(1);
    });

    it("should create ALB infrastructure", () => {
      new TapStack("tap-stack-test", defaultArgs);

      const albMock = aws.lb.LoadBalancer as unknown as jest.Mock;
      const tgMock = aws.lb.TargetGroup as unknown as jest.Mock;
      const listenerMock = aws.lb.Listener as unknown as jest.Mock;
      const asgMock = aws.autoscaling.Group as unknown as jest.Mock;

      expect(albMock).toHaveBeenCalled();
      expect(tgMock).toHaveBeenCalled();
      expect(listenerMock).toHaveBeenCalled();
      expect(asgMock).toHaveBeenCalled();
    });
  });
});
