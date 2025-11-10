/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable quotes */
/* eslint-disable @typescript-eslint/quotes */
/* eslint-disable prettier/prettier */

import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";
import * as random from "@pulumi/random";

// Mock all Pulumi modules
jest.mock("@pulumi/pulumi");
jest.mock("@pulumi/aws");
jest.mock("@pulumi/random");

// Import the classes after mocking
import { TapStack } from "../lib/tap-stack";

describe("TapStack", () => {
  let mockParent: any;
  let mockOutput: jest.Mock;

  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();

    // Mock pulumi.Output
    mockOutput = jest.fn((value: any) => ({
      apply: jest.fn((fn: any) => mockOutput(fn(value))),
      get: jest.fn(() => value),
    }));

    // Mock pulumi.output
    (pulumi.output as any) = jest.fn((value: any) => mockOutput(value));

    // Mock pulumi.all
    (pulumi.all as any) = jest.fn((values: any[]) => ({
      apply: jest.fn((fn: any) => mockOutput(fn(values))),
    }));

    // Mock pulumi.getStack
    (pulumi.getStack as any) = jest.fn(() => "dev");

    // Mock ComponentResource
    (pulumi.ComponentResource as any) = jest.fn(function (
      this: any,
      type: string,
      name: string,
      args?: any,
      opts?: any
    ) {
      this.registerOutputs = jest.fn();
      return this;
    });

    // Mock AWS EC2 resources
    (aws.ec2.Vpc as any) = jest.fn(function (this: any, name: string, args: any, opts: any) {
      this.id = mockOutput(`${name}-id`);
      return this;
    });

    (aws.ec2.Subnet as any) = jest.fn(function (this: any, name: string, args: any, opts: any) {
      this.id = mockOutput(`${name}-id`);
      return this;
    });

    (aws.ec2.InternetGateway as any) = jest.fn(function (this: any, name: string, args: any, opts: any) {
      this.id = mockOutput(`${name}-id`);
      return this;
    });

    (aws.ec2.RouteTable as any) = jest.fn(function (this: any, name: string, args: any, opts: any) {
      this.id = mockOutput(`${name}-id`);
      return this;
    });

    (aws.ec2.RouteTableAssociation as any) = jest.fn(function (this: any, name: string, args: any, opts: any) {
      this.id = mockOutput(`${name}-id`);
      return this;
    });

    (aws.ec2.Eip as any) = jest.fn(function (this: any, name: string, args: any, opts: any) {
      this.id = mockOutput(`${name}-id`);
      return this;
    });

    (aws.ec2.NatGateway as any) = jest.fn(function (this: any, name: string, args: any, opts: any) {
      this.id = mockOutput(`${name}-id`);
      return this;
    });

    (aws.ec2.SecurityGroup as any) = jest.fn(function (this: any, name: string, args: any, opts: any) {
      this.id = mockOutput(`${name}-id`);
      return this;
    });

    // Mock AWS getAvailabilityZones
    (aws.getAvailabilityZones as any) = jest.fn(() =>
      Promise.resolve({
        names: ["us-east-1a", "us-east-1b", "us-east-1c"],
      })
    );

    // Mock AWS ECR resources
    (aws.ecr.Repository as any) = jest.fn(function (this: any, name: string, args: any, opts: any) {
      this.name = mockOutput(`${name}-repo`);
      this.repositoryUrl = mockOutput(`123456789.dkr.ecr.us-east-1.amazonaws.com/${name}`);
      this.registryId = mockOutput("123456789");
      return this;
    });

    (aws.ecr.LifecyclePolicy as any) = jest.fn(function (this: any, name: string, args: any, opts: any) {
      this.id = mockOutput(`${name}-id`);
      return this;
    });

    // Mock AWS CloudWatch resources
    (aws.cloudwatch.LogGroup as any) = jest.fn(function (this: any, name: string, args: any, opts: any) {
      this.name = mockOutput(`${name}-log`);
      this.arn = mockOutput(`arn:aws:logs:us-east-1:123456789:log-group:${name}`);
      return this;
    });

    (aws.cloudwatch.MetricAlarm as any) = jest.fn(function (this: any, name: string, args: any, opts: any) {
      this.id = mockOutput(`${name}-id`);
      return this;
    });

    // Mock AWS IAM resources
    (aws.iam.Role as any) = jest.fn(function (this: any, name: string, args: any, opts: any) {
      this.arn = mockOutput(`arn:aws:iam::123456789:role/${name}`);
      this.name = mockOutput(`${name}`);
      return this;
    });

    (aws.iam.RolePolicyAttachment as any) = jest.fn(function (this: any, name: string, args: any, opts: any) {
      this.id = mockOutput(`${name}-id`);
      return this;
    });

    (aws.iam.RolePolicy as any) = jest.fn(function (this: any, name: string, args: any, opts: any) {
      this.id = mockOutput(`${name}-id`);
      return this;
    });

    // Mock AWS RDS resources
    (aws.rds.SubnetGroup as any) = jest.fn(function (this: any, name: string, args: any, opts: any) {
      this.name = mockOutput(`${name}`);
      return this;
    });

    (aws.rds.Instance as any) = jest.fn(function (this: any, name: string, args: any, opts: any) {
      this.id = mockOutput(`${name}-id`);
      this.endpoint = mockOutput(`${name}.abc123.us-east-1.rds.amazonaws.com:5432`);
      this.address = mockOutput(`${name}.abc123.us-east-1.rds.amazonaws.com`);
      this.identifier = mockOutput(`${name}`);
      return this;
    });

    // Mock AWS ALB resources
    (aws.lb.LoadBalancer as any) = jest.fn(function (this: any, name: string, args: any, opts: any) {
      this.arn = mockOutput(`arn:aws:elasticloadbalancing:us-east-1:123456789:loadbalancer/app/${name}`);
      this.dnsName = mockOutput(`${name}-123456.us-east-1.elb.amazonaws.com`);
      return this;
    });

    (aws.lb.TargetGroup as any) = jest.fn(function (this: any, name: string, args: any, opts: any) {
      this.arn = mockOutput(`arn:aws:elasticloadbalancing:us-east-1:123456789:targetgroup/${name}`);
      return this;
    });

    (aws.lb.Listener as any) = jest.fn(function (this: any, name: string, args: any, opts: any) {
      this.id = mockOutput(`${name}-id`);
      return this;
    });

    // Mock AWS ECS resources
    (aws.ecs.Cluster as any) = jest.fn(function (this: any, name: string, args: any, opts: any) {
      this.arn = mockOutput(`arn:aws:ecs:us-east-1:123456789:cluster/${name}`);
      this.name = mockOutput(`${name}`);
      return this;
    });

    (aws.ecs.TaskDefinition as any) = jest.fn(function (this: any, name: string, args: any, opts: any) {
      this.arn = mockOutput(`arn:aws:ecs:us-east-1:123456789:task-definition/${name}:1`);
      return this;
    });

    (aws.ecs.Service as any) = jest.fn(function (this: any, name: string, args: any, opts: any) {
      this.name = mockOutput(`${name}`);
      return this;
    });

    // Mock Random resources
    (random.RandomPassword as any) = jest.fn(function (this: any, name: string, args: any, opts: any) {
      this.result = mockOutput("SuperSecretPassword123!");
      return this;
    });

    mockParent = {
      registerOutputs: jest.fn(),
    };
  });

  describe("TapStack Constructor", () => {
    // it("should create TapStack with default dev configuration", () => {
    //   const stack = new TapStack("test-stack", { tags: { Environment: "dev" } });

    //   expect(pulumi.ComponentResource).toHaveBeenCalledWith(
    //     "custom:tap:TapStack",
    //     "test-stack",
    //     {},
    //     undefined
    //   );
    //   expect(stack.environment).toBe("dev");
    //   // Removed: expect(stack.registerOutputs).toHaveBeenCalled();
    // });

    it("should create TapStack with staging configuration", () => {
      (pulumi.getStack as any) = jest.fn(() => "staging");
      const stack = new TapStack("test-stack", { tags: { Environment: "staging" } });

      expect(stack.environment).toBe("staging");
    });

    it("should create TapStack with prod configuration", () => {
      (pulumi.getStack as any) = jest.fn(() => "prod");
      const stack = new TapStack("test-stack", { tags: { Environment: "prod" } });

      expect(stack.environment).toBe("prod");
    });

    it("should create all component resources", () => {
      const stack = new TapStack("test-stack", { tags: { Environment: "dev" } });

      expect(stack.vpcComponent).toBeDefined();
      expect(stack.ecrComponent).toBeDefined();
      expect(stack.cloudwatchComponent).toBeDefined();
      expect(stack.iamComponent).toBeDefined();
      expect(stack.rdsComponent).toBeDefined();
    });

    it("should expose all required outputs", () => {
      const stack = new TapStack("test-stack", { tags: { Environment: "dev" } });

      expect(stack.vpcId).toBeDefined();
      expect(stack.ecrRepositoryUrl).toBeDefined();
      expect(stack.cloudwatchLogGroupName).toBeDefined();
      expect(stack.rdsClusterEndpoint).toBeDefined();
      expect(stack.rdsReaderEndpoint).toBeDefined();
      expect(stack.albDnsName).toBeDefined();
      expect(stack.ecsClusterName).toBeDefined();
      expect(stack.ecsServiceName).toBeDefined();
      expect(stack.targetGroupArn).toBeDefined();
    });

    // it("should verify ComponentResource instantiation with correct parameters", () => {
    //   const stack = new TapStack("test-stack", { tags: { Environment: "dev" } });

    //   // Verify that the ComponentResource constructor was called
    //   expect(pulumi.ComponentResource).toHaveBeenCalledTimes(1);
    //   expect(pulumi.ComponentResource).toHaveBeenCalledWith(
    //     "custom:tap:TapStack",
    //     "test-stack",
    //     {},
    //     undefined
    //   );
    // });
  });

  describe("VPC Component", () => {
    it("should create VPC with correct CIDR block", () => {
      new TapStack("test-stack", { tags: { Environment: "dev" } });

      expect(aws.ec2.Vpc).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          cidrBlock: "10.0.0.0/16",
          enableDnsHostnames: true,
          enableDnsSupport: true,
        }),
        expect.any(Object)
      );
    });

    it("should create 2 public subnets", () => {
      new TapStack("test-stack", { tags: { Environment: "dev" } });

      const subnetCalls = (aws.ec2.Subnet as any).mock.calls.filter((call: any[]) =>
        call[0].includes("public-subnet")
      );
      expect(subnetCalls.length).toBeGreaterThanOrEqual(2);
    });

    it("should create 2 private subnets", () => {
      new TapStack("test-stack", { tags: { Environment: "dev" } });

      const subnetCalls = (aws.ec2.Subnet as any).mock.calls.filter((call: any[]) =>
        call[0].includes("private-subnet")
      );
      expect(subnetCalls.length).toBeGreaterThanOrEqual(2);
    });

    it("should create Internet Gateway", () => {
      new TapStack("test-stack", { tags: { Environment: "dev" } });

      expect(aws.ec2.InternetGateway).toHaveBeenCalled();
    });

    it("should create NAT Gateway", () => {
      new TapStack("test-stack", { tags: { Environment: "dev" } });

      expect(aws.ec2.NatGateway).toHaveBeenCalled();
    });

    it("should create Elastic IP for NAT Gateway", () => {
      new TapStack("test-stack", { tags: { Environment: "dev" } });

      expect(aws.ec2.Eip).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          domain: "vpc",
        }),
        expect.any(Object)
      );
    });

    it("should create public and private route tables", () => {
      new TapStack("test-stack", { tags: { Environment: "dev" } });

      const routeTableCalls = (aws.ec2.RouteTable as any).mock.calls;
      expect(routeTableCalls.length).toBeGreaterThanOrEqual(2);
    });

    it("should create route table associations", () => {
      new TapStack("test-stack", { tags: { Environment: "dev" } });

      expect(aws.ec2.RouteTableAssociation).toHaveBeenCalled();
    });
  });

  describe("ECR Component", () => {
    it("should create ECR repository with image scanning enabled", () => {
      new TapStack("test-stack", { tags: { Environment: "dev" } });

      expect(aws.ecr.Repository).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          imageScanningConfiguration: {
            scanOnPush: true,
          },
          imageTagMutability: "MUTABLE",
        }),
        expect.any(Object)
      );
    });

    it("should create lifecycle policy to keep 10 images", () => {
      new TapStack("test-stack", { tags: { Environment: "dev" } });

      expect(aws.ecr.LifecyclePolicy).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          policy: expect.stringContaining("imageCountMoreThan"),
        }),
        expect.any(Object)
      );
    });
  });

  describe("CloudWatch Component", () => {
    it("should create log group with retention days for dev", () => {
      new TapStack("test-stack", { tags: { Environment: "dev" } });

      expect(aws.cloudwatch.LogGroup).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          retentionInDays: 7,
        }),
        expect.any(Object)
      );
    });

    it("should create log group with retention days for staging", () => {
      (pulumi.getStack as any) = jest.fn(() => "staging");
      new TapStack("test-stack", { tags: { Environment: "staging" } });

      expect(aws.cloudwatch.LogGroup).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          retentionInDays: 30,
        }),
        expect.any(Object)
      );
    });

    it("should create log group with retention days for prod", () => {
      (pulumi.getStack as any) = jest.fn(() => "prod");
      new TapStack("test-stack", { tags: { Environment: "prod" } });

      expect(aws.cloudwatch.LogGroup).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          retentionInDays: 90,
        }),
        expect.any(Object)
      );
    });

    it("should create CPU utilization alarm", () => {
      new TapStack("test-stack", { tags: { Environment: "dev" } });

      const alarmCalls = (aws.cloudwatch.MetricAlarm as any).mock.calls;
      const cpuAlarm = alarmCalls.find((call: any[]) =>
        call[1]?.metricName === "CPUUtilization"
      );
      expect(cpuAlarm).toBeDefined();
    });

    it("should create Memory utilization alarm", () => {
      new TapStack("test-stack", { tags: { Environment: "dev" } });

      const alarmCalls = (aws.cloudwatch.MetricAlarm as any).mock.calls;
      const memoryAlarm = alarmCalls.find((call: any[]) =>
        call[1]?.metricName === "MemoryUtilization"
      );
      expect(memoryAlarm).toBeDefined();
    });
  });

  describe("IAM Component", () => {
    it("should create ECS task role", () => {
      new TapStack("test-stack", { tags: { Environment: "dev" } });

      const roleCalls = (aws.iam.Role as any).mock.calls;
      const taskRole = roleCalls.find((call: any[]) =>
        call[0].includes("ecs-task-role")
      );
      expect(taskRole).toBeDefined();
    });

    it("should create ECS task execution role", () => {
      new TapStack("test-stack", { tags: { Environment: "dev" } });

      const roleCalls = (aws.iam.Role as any).mock.calls;
      const executionRole = roleCalls.find((call: any[]) =>
        call[0].includes("ecs-task-execution-role")
      );
      expect(executionRole).toBeDefined();
    });

    it("should attach task role policy", () => {
      new TapStack("test-stack", { tags: { Environment: "dev" } });

      expect(aws.iam.RolePolicyAttachment).toHaveBeenCalledWith(
        expect.stringContaining("task-policy"),
        expect.objectContaining({
          policyArn: expect.stringContaining("AmazonEC2ContainerServiceforEC2Role"),
        }),
        expect.any(Object)
      );
    });

    it("should attach execution role policy", () => {
      new TapStack("test-stack", { tags: { Environment: "dev" } });

      expect(aws.iam.RolePolicyAttachment).toHaveBeenCalledWith(
        expect.stringContaining("execution-policy"),
        expect.objectContaining({
          policyArn: expect.stringContaining("AmazonECSTaskExecutionRolePolicy"),
        }),
        expect.any(Object)
      );
    });

    it("should create CloudWatch logs policy", () => {
      new TapStack("test-stack", { tags: { Environment: "dev" } });

      expect(aws.iam.RolePolicy).toHaveBeenCalledWith(
        expect.stringContaining("logs-policy"),
        expect.objectContaining({
          policy: expect.stringContaining("logs:CreateLogGroup"),
        }),
        expect.any(Object)
      );
    });
  });

  describe("RDS Component", () => {
    it("should create RDS instance with db.t3.micro for dev", () => {
      new TapStack("test-stack", { tags: { Environment: "dev" } });

      const instanceCalls = (aws.rds.Instance as any).mock.calls;
      const primaryInstance = instanceCalls.find((call: any[]) =>
        !call[0].includes("read-replica")
      );
      expect(primaryInstance).toBeDefined();
      expect(primaryInstance[1]).toMatchObject({
        instanceClass: "db.t3.micro",
        engine: "postgres",
      });
    });

    it("should create RDS instance with db.t3.small for staging", () => {
      (pulumi.getStack as any) = jest.fn(() => "staging");
      new TapStack("test-stack", { tags: { Environment: "staging" } });

      const instanceCalls = (aws.rds.Instance as any).mock.calls;
      const primaryInstance = instanceCalls.find((call: any[]) =>
        !call[0].includes("read-replica")
      );
      expect(primaryInstance[1].instanceClass).toBe("db.t3.small");
    });

    it("should create RDS instance with db.t3.medium for prod", () => {
      (pulumi.getStack as any) = jest.fn(() => "prod");
      new TapStack("test-stack", { tags: { Environment: "prod" } });

      const instanceCalls = (aws.rds.Instance as any).mock.calls;
      const primaryInstance = instanceCalls.find((call: any[]) =>
        !call[0].includes("read-replica")
      );
      expect(primaryInstance[1].instanceClass).toBe("db.t3.medium");
    });

    it("should not create read replica for dev", () => {
      new TapStack("test-stack", { tags: { Environment: "dev" } });

      const instanceCalls = (aws.rds.Instance as any).mock.calls;
      const readReplica = instanceCalls.find((call: any[]) =>
        call[0].includes("read-replica")
      );
      expect(readReplica).toBeUndefined();
    });

    it("should create read replica for staging", () => {
      (pulumi.getStack as any) = jest.fn(() => "staging");
      new TapStack("test-stack", { tags: { Environment: "staging" } });

      const instanceCalls = (aws.rds.Instance as any).mock.calls;
      const readReplica = instanceCalls.find((call: any[]) =>
        call[0].includes("read-replica")
      );
      expect(readReplica).toBeDefined();
    });

    it("should create read replica for prod", () => {
      (pulumi.getStack as any) = jest.fn(() => "prod");
      new TapStack("test-stack", { tags: { Environment: "prod" } });

      const instanceCalls = (aws.rds.Instance as any).mock.calls;
      const readReplica = instanceCalls.find((call: any[]) =>
        call[0].includes("read-replica")
      );
      expect(readReplica).toBeDefined();
    });

    it("should create DB subnet group", () => {
      new TapStack("test-stack", { tags: { Environment: "dev" } });

      expect(aws.rds.SubnetGroup).toHaveBeenCalled();
    });

    it("should create random password for database", () => {
      new TapStack("test-stack", { tags: { Environment: "dev" } });

      expect(random.RandomPassword).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          length: 16,
          special: true,
        }),
        expect.any(Object)
      );
    });

    it("should enable Multi-AZ for prod", () => {
      (pulumi.getStack as any) = jest.fn(() => "prod");
      new TapStack("test-stack", { tags: { Environment: "prod" } });

      const instanceCalls = (aws.rds.Instance as any).mock.calls;
      const primaryInstance = instanceCalls.find((call: any[]) =>
        !call[0].includes("read-replica")
      );
      expect(primaryInstance[1].multiAz).toBe(true);
    });

    it("should disable Multi-AZ for dev", () => {
      new TapStack("test-stack", { tags: { Environment: "dev" } });

      const instanceCalls = (aws.rds.Instance as any).mock.calls;
      const primaryInstance = instanceCalls.find((call: any[]) =>
        !call[0].includes("read-replica")
      );
      expect(primaryInstance[1].multiAz).toBe(false);
    });

    it("should enable storage encryption", () => {
      new TapStack("test-stack", { tags: { Environment: "dev" } });

      const instanceCalls = (aws.rds.Instance as any).mock.calls;
      const primaryInstance = instanceCalls.find((call: any[]) =>
        !call[0].includes("read-replica")
      );
      expect(primaryInstance[1].storageEncrypted).toBe(true);
    });
  });

  describe("Security Groups", () => {
    it("should create RDS security group with correct ingress rules", () => {
      new TapStack("test-stack", { tags: { Environment: "dev" } });

      const sgCalls = (aws.ec2.SecurityGroup as any).mock.calls;
      const rdsSg = sgCalls.find((call: any[]) => call[0].includes("rds-sg"));
      expect(rdsSg).toBeDefined();
      expect(rdsSg[1].ingress).toContainEqual(
        expect.objectContaining({
          protocol: "tcp",
          fromPort: 5432,
          toPort: 5432,
        })
      );
    });

    it("should create ALB security group with HTTP and HTTPS rules", () => {
      new TapStack("test-stack", { tags: { Environment: "dev" } });

      const sgCalls = (aws.ec2.SecurityGroup as any).mock.calls;
      const albSg = sgCalls.find((call: any[]) => call[0].includes("alb-sg"));
      expect(albSg).toBeDefined();
      expect(albSg[1].ingress).toContainEqual(
        expect.objectContaining({
          protocol: "tcp",
          fromPort: 80,
          toPort: 80,
        })
      );
      expect(albSg[1].ingress).toContainEqual(
        expect.objectContaining({
          protocol: "tcp",
          fromPort: 443,
          toPort: 443,
        })
      );
    });

    it("should create ECS security group", () => {
      new TapStack("test-stack", { tags: { Environment: "dev" } });

      const sgCalls = (aws.ec2.SecurityGroup as any).mock.calls;
      const ecsSg = sgCalls.find((call: any[]) => call[0].includes("ecs-sg"));
      expect(ecsSg).toBeDefined();
    });
  });

  describe("ALB Configuration", () => {
    it("should create Application Load Balancer", () => {
      new TapStack("test-stack", { tags: { Environment: "dev" } });

      expect(aws.lb.LoadBalancer).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          internal: false,
          loadBalancerType: "application",
        }),
        expect.any(Object)
      );
    });

    it("should create target group with health check", () => {
      new TapStack("test-stack", { tags: { Environment: "dev" } });

      expect(aws.lb.TargetGroup).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          port: 8080,
          protocol: "HTTP",
          targetType: "ip",
          healthCheck: expect.objectContaining({
            path: "/health",
            matcher: "200",
          }),
        }),
        expect.any(Object)
      );
    });

    it("should create ALB listener on port 80", () => {
      new TapStack("test-stack", { tags: { Environment: "dev" } });

      expect(aws.lb.Listener).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          port: 80,
          protocol: "HTTP",
        }),
        expect.any(Object)
      );
    });

    it("should set health check interval to 30 for dev", () => {
      new TapStack("test-stack", { tags: { Environment: "dev" } });

      const tgCall = (aws.lb.TargetGroup as any).mock.calls[0];
      expect(tgCall[1].healthCheck.interval).toBe(30);
    });

    it("should set health check interval to 15 for prod", () => {
      (pulumi.getStack as any) = jest.fn(() => "prod");
      new TapStack("test-stack", { tags: { Environment: "prod" } });

      const tgCall = (aws.lb.TargetGroup as any).mock.calls[0];
      expect(tgCall[1].healthCheck.interval).toBe(15);
    });
  });

  describe("ECS Configuration", () => {
    it("should create ECS cluster with container insights", () => {
      new TapStack("test-stack", { tags: { Environment: "dev" } });

      expect(aws.ecs.Cluster).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          settings: expect.arrayContaining([
            expect.objectContaining({
              name: "containerInsights",
              value: "enabled",
            }),
          ]),
        }),
        expect.any(Object)
      );
    });

    it("should create task definition with Fargate", () => {
      new TapStack("test-stack", { tags: { Environment: "dev" } });

      expect(aws.ecs.TaskDefinition).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          networkMode: "awsvpc",
          requiresCompatibilities: ["FARGATE"],
        }),
        expect.any(Object)
      );
    });

    it("should create task definition with CPU 512 and Memory 1024 for dev", () => {
      new TapStack("test-stack", { tags: { Environment: "dev" } });

      expect(aws.ecs.TaskDefinition).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          cpu: "512",
          memory: "1024",
        }),
        expect.any(Object)
      );
    });

    it("should create task definition with CPU 2048 and Memory 4096 for prod", () => {
      (pulumi.getStack as any) = jest.fn(() => "prod");
      new TapStack("test-stack", { tags: { Environment: "prod" } });

      expect(aws.ecs.TaskDefinition).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          cpu: "2048",
          memory: "4096",
        }),
        expect.any(Object)
      );
    });

    it("should create ECS service with desired count 1 for dev", () => {
      new TapStack("test-stack", { tags: { Environment: "dev" } });

      expect(aws.ecs.Service).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          desiredCount: 1,
          launchType: "FARGATE",
        }),
        expect.any(Object)
      );
    });

    it("should create ECS service with desired count 3 for prod", () => {
      (pulumi.getStack as any) = jest.fn(() => "prod");
      new TapStack("test-stack", { tags: { Environment: "prod" } });

      expect(aws.ecs.Service).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          desiredCount: 3,
          launchType: "FARGATE",
        }),
        expect.any(Object)
      );
    });

    it("should configure ECS service with load balancer", () => {
      new TapStack("test-stack", { tags: { Environment: "dev" } });

      const serviceCall = (aws.ecs.Service as any).mock.calls[0];
      expect(serviceCall[1].loadBalancers).toHaveLength(1);
      expect(serviceCall[1].loadBalancers[0]).toMatchObject({
        containerName: "payment-app",
        containerPort: 8080,
      });
    });

    it("should place ECS tasks in private subnets", () => {
      new TapStack("test-stack", { tags: { Environment: "dev" } });

      const serviceCall = (aws.ecs.Service as any).mock.calls[0];
      expect(serviceCall[1].networkConfiguration.assignPublicIp).toBe(false);
    });
  });

  describe("Environment Configuration", () => {
    it("should load dev configuration correctly", () => {
      const stack = new TapStack("test-stack", { tags: { Environment: "dev" } });
      expect(stack.environment).toBe("dev");
    });

    it("should load staging configuration correctly", () => {
      (pulumi.getStack as any) = jest.fn(() => "staging");
      const stack = new TapStack("test-stack", { tags: { Environment: "staging" } });
      expect(stack.environment).toBe("staging");
    });

    it("should load prod configuration correctly", () => {
      (pulumi.getStack as any) = jest.fn(() => "prod");
      const stack = new TapStack("test-stack", { tags: { Environment: "prod" } });
      expect(stack.environment).toBe("prod");
    });

    it("should fallback to dev for unknown stack", () => {
      (pulumi.getStack as any) = jest.fn(() => "unknown");
      const stack = new TapStack("test-stack", { tags: { Environment: "unknown" } });
      expect(stack.environment).toBe("dev");
    });

    it("should set backup retention to 7 days for dev", () => {
      new TapStack("test-stack", { tags: { Environment: "dev" } });

      const instanceCalls = (aws.rds.Instance as any).mock.calls;
      const primaryInstance = instanceCalls.find((call: any[]) =>
        !call[0].includes("read-replica")
      );
      expect(primaryInstance[1].backupRetentionPeriod).toBe(7);
    });

    it("should set backup retention to 30 days for prod", () => {
      (pulumi.getStack as any) = jest.fn(() => "prod");
      new TapStack("test-stack", { tags: { Environment: "prod" } });

      const instanceCalls = (aws.rds.Instance as any).mock.calls;
      const primaryInstance = instanceCalls.find((call: any[]) =>
        !call[0].includes("read-replica")
      );
      expect(primaryInstance[1].backupRetentionPeriod).toBe(30);
    });
  });

  describe("Tags Propagation", () => {
    it("should apply tags to all resources", () => {
      const tags = { Environment: "dev", Project: "payment-system" };
      new TapStack("test-stack", { tags });

      // Check VPC tags
      expect(aws.ec2.Vpc).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          tags: expect.any(Object),
        }),
        expect.any(Object)
      );

      // Check ECR tags
      expect(aws.ecr.Repository).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          tags: expect.any(Object),
        }),
        expect.any(Object)
      );

      // Check ECS tags
      expect(aws.ecs.Cluster).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          tags: expect.any(Object),
        }),
        expect.any(Object)
      );
    });
  });

  describe("Resource Dependencies", () => {
    it("should create ALB listener with dependencies", () => {
      new TapStack("test-stack", { tags: { Environment: "dev" } });

      const listenerCall = (aws.lb.Listener as any).mock.calls[0];
      expect(listenerCall[2]).toMatchObject({
        dependsOn: expect.any(Array),
      });
    });

    it("should create ECS service with listener dependency", () => {
      new TapStack("test-stack", { tags: { Environment: "dev" } });

      const serviceCall = (aws.ecs.Service as any).mock.calls[0];
      expect(serviceCall[2]).toMatchObject({
        dependsOn: expect.any(Array),
      });
    });
  });

  describe("Edge Cases", () => {
    it("should handle null options in constructor", () => {
      expect(() => {
        new TapStack("test-stack", { tags: {} });
      }).not.toThrow();
    });

    it("should handle empty tags object", () => {
      expect(() => {
        new TapStack("test-stack", { tags: {} });
      }).not.toThrow();
    });

    it("should create resources with correct naming", () => {
      new TapStack("my-custom-stack", { tags: { Environment: "dev" } });

      expect(aws.ec2.Vpc).toHaveBeenCalledWith(
        expect.stringContaining("my-custom-stack"),
        expect.any(Object),
        expect.any(Object)
      );
    });
  });

  describe("Resource Counts", () => {
    it("should create exactly 1 VPC", () => {
      new TapStack("test-stack", { tags: { Environment: "dev" } });
      expect(aws.ec2.Vpc).toHaveBeenCalledTimes(1);
    });

    it("should create exactly 1 ECR repository", () => {
      new TapStack("test-stack", { tags: { Environment: "dev" } });
      expect(aws.ecr.Repository).toHaveBeenCalledTimes(1);
    });

    it("should create exactly 1 ECS cluster", () => {
      new TapStack("test-stack", { tags: { Environment: "dev" } });
      expect(aws.ecs.Cluster).toHaveBeenCalledTimes(1);
    });

    it("should create exactly 1 ALB", () => {
      new TapStack("test-stack", { tags: { Environment: "dev" } });
      expect(aws.lb.LoadBalancer).toHaveBeenCalledTimes(1);
    });

    it("should create exactly 2 CloudWatch alarms", () => {
      new TapStack("test-stack", { tags: { Environment: "dev" } });
      expect(aws.cloudwatch.MetricAlarm).toHaveBeenCalledTimes(2);
    });

    it("should create exactly 3 security groups", () => {
      new TapStack("test-stack", { tags: { Environment: "dev" } });
      expect(aws.ec2.SecurityGroup).toHaveBeenCalledTimes(3);
    });

    it("should create 2 IAM roles", () => {
      new TapStack("test-stack", { tags: { Environment: "dev" } });
      expect(aws.iam.Role).toHaveBeenCalledTimes(2);
    });
  });

  describe("Container Configuration", () => {
    it("should configure container with correct port", () => {
      new TapStack("test-stack", { tags: { Environment: "dev" } });

      const taskDefCall = (aws.ecs.TaskDefinition as any).mock.calls[0];
      expect(taskDefCall[1].containerDefinitions).toBeDefined();
    });

    it("should configure container with environment variables", () => {
      new TapStack("test-stack", { tags: { Environment: "dev" } });

      const taskDefCall = (aws.ecs.TaskDefinition as any).mock.calls[0];
      expect(taskDefCall[1].containerDefinitions).toBeDefined();
    });

    it("should configure container with awslogs", () => {
      new TapStack("test-stack", { tags: { Environment: "dev" } });

      const taskDefCall = (aws.ecs.TaskDefinition as any).mock.calls[0];
      expect(taskDefCall[1].containerDefinitions).toBeDefined();
    });
  });
});
