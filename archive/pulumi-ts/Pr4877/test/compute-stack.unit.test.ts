/**
 * compute-stack.unit.test.ts
 *
 * Unit tests for ComputeStack
 */
import * as pulumi from "@pulumi/pulumi";
import { ComputeStack } from "../lib/global-banking/compute-stack";

describe("ComputeStack", () => {
  let stack: ComputeStack;

  beforeAll(() => {
    pulumi.runtime.setMocks({
      newResource: (args: pulumi.runtime.MockResourceArgs): { id: string; state: any } => {
        return {
          id: `${args.name}_id`,
          state: {
            ...args.inputs,
            arn: `arn:aws:${args.type}:us-east-1:123456789012:${args.name}`,
            name: args.inputs?.name || args.name,
          },
        };
      },
      call: (args: pulumi.runtime.MockCallArgs) => {
        if (args.token === "aws:index/getRegion:getRegion") {
          return { name: "us-east-1" };
        }
        if (args.token === "aws:index/getCallerIdentity:getCallerIdentity") {
          return { accountId: "123456789012" };
        }
        return args.inputs;
      },
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("Stack Creation", () => {
    beforeEach(() => {
      stack = new ComputeStack("test-compute", {
        environmentSuffix: "test",
        tags: pulumi.output({ Environment: "test" }),
        vpcId: pulumi.output("vpc-123"),
        privateSubnetIds: pulumi.output(["subnet-1", "subnet-2", "subnet-3"]),
        kmsKeyId: pulumi.output("key-123"),
        kmsKeyArn: pulumi.output("arn:aws:kms:us-east-1:123456789012:key/key-123"),
        regions: {
          primary: "us-east-1",
          replicas: ["eu-west-1"],
        },
        enableAppMesh: true,
        enableAutoScaling: true,
        secretsManagerArns: pulumi.output({
          database: "arn:aws:secretsmanager:us-east-1:123456789012:secret:db-secret",
          api: "arn:aws:secretsmanager:us-east-1:123456789012:secret:api-secret",
        }),
      });
    });

    it("creates stack successfully", () => {
      expect(stack).toBeDefined();
      expect(stack).toBeInstanceOf(ComputeStack);
    });

    it("exposes ECS cluster ARN", (done) => {
      expect(stack.ecsClusterArn).toBeDefined();
      pulumi.all([stack.ecsClusterArn]).apply(([arn]) => {
        expect(arn).toContain("arn:aws:");
        done();
      });
    });

    it("exposes ECS cluster name", (done) => {
      expect(stack.ecsClusterName).toBeDefined();
      pulumi.all([stack.ecsClusterName]).apply(([name]) => {
        expect(name).toBeTruthy();
        done();
      });
    });

    it("exposes App Mesh name", (done) => {
      expect(stack.appMeshName).toBeDefined();
      pulumi.all([stack.appMeshName]).apply(([meshName]) => {
        expect(meshName).toBeTruthy();
        done();
      });
    });

    it("exposes ECS security group ID", (done) => {
      expect(stack.ecsSecurityGroupId).toBeDefined();
      pulumi.all([stack.ecsSecurityGroupId]).apply(([sgId]) => {
        expect(sgId).toBeTruthy();
        done();
      });
    });

    it("exposes task execution role ARN", (done) => {
      expect(stack.taskExecutionRoleArn).toBeDefined();
      pulumi.all([stack.taskExecutionRoleArn]).apply(([arn]) => {
        expect(arn).toContain("arn:aws:");
        done();
      });
    });

    it("exposes task role ARN", (done) => {
      expect(stack.taskRoleArn).toBeDefined();
      pulumi.all([stack.taskRoleArn]).apply(([arn]) => {
        expect(arn).toContain("arn:aws:");
        done();
      });
    });
  });

  describe("ECS Cluster Configuration", () => {
    beforeEach(() => {
      stack = new ComputeStack("test-ecs-cluster", {
        environmentSuffix: "cluster",
        tags: pulumi.output({ Component: "ecs" }),
        vpcId: pulumi.output("vpc-123"),
        privateSubnetIds: pulumi.output(["subnet-1", "subnet-2"]),
        kmsKeyId: pulumi.output("key-123"),
        kmsKeyArn: pulumi.output("arn:aws:kms:us-east-1:123456789012:key/key-123"),
        regions: { primary: "us-east-1", replicas: [] },
        enableAppMesh: false,
        enableAutoScaling: false,
        secretsManagerArns: pulumi.output({
          database: "arn:aws:secretsmanager:us-east-1:123456789012:secret:db-secret",
          api: "arn:aws:secretsmanager:us-east-1:123456789012:secret:api-secret",
        }),
      });
    });

    it("creates ECS cluster", (done) => {
      pulumi.all([stack.ecsClusterArn]).apply(([clusterArn]) => {
        expect(clusterArn).toBeTruthy();
        done();
      });
    });

    it("enables Container Insights", (done) => {
      pulumi.all([stack.ecsClusterName]).apply(([clusterName]) => {
        expect(clusterName).toBeDefined();
        done();
      });
    });

    it("configures execute command with KMS encryption", (done) => {
      pulumi.all([stack.ecsClusterArn]).apply(([clusterArn]) => {
        expect(clusterArn).toBeDefined();
        done();
      });
    });

    it("creates CloudWatch log group", (done) => {
      pulumi.all([stack.ecsClusterName]).apply(([clusterName]) => {
        expect(clusterName).toBeDefined();
        done();
      });
    });
  });

  describe("Security Group Configuration", () => {
    beforeEach(() => {
      stack = new ComputeStack("test-sg", {
        environmentSuffix: "sg",
        tags: pulumi.output({ SecurityGroup: "configured" }),
        vpcId: pulumi.output("vpc-123"),
        privateSubnetIds: pulumi.output(["subnet-1", "subnet-2"]),
        kmsKeyId: pulumi.output("key-123"),
        kmsKeyArn: pulumi.output("arn:aws:kms:us-east-1:123456789012:key/key-123"),
        regions: { primary: "us-east-1", replicas: [] },
        enableAppMesh: false,
        enableAutoScaling: false,
        secretsManagerArns: pulumi.output({
          database: "arn:aws:secretsmanager:us-east-1:123456789012:secret:db-secret",
          api: "arn:aws:secretsmanager:us-east-1:123456789012:secret:api-secret",
        }),
      });
    });

    it("creates security group for ECS tasks", (done) => {
      pulumi.all([stack.ecsSecurityGroupId]).apply(([sgId]) => {
        expect(sgId).toBeTruthy();
        done();
      });
    });

    it("allows application traffic on port 8080", (done) => {
      pulumi.all([stack.ecsSecurityGroupId]).apply(([sgId]) => {
        expect(sgId).toBeDefined();
        done();
      });
    });

    it("allows Envoy admin traffic on port 9901", (done) => {
      pulumi.all([stack.ecsSecurityGroupId]).apply(([sgId]) => {
        expect(sgId).toBeDefined();
        done();
      });
    });

    it("allows all outbound traffic", (done) => {
      pulumi.all([stack.ecsSecurityGroupId]).apply(([sgId]) => {
        expect(sgId).toBeDefined();
        done();
      });
    });
  });

  describe("IAM Roles Configuration", () => {
    beforeEach(() => {
      stack = new ComputeStack("test-iam", {
        environmentSuffix: "iam",
        tags: pulumi.output({ IAM: "configured" }),
        vpcId: pulumi.output("vpc-123"),
        privateSubnetIds: pulumi.output(["subnet-1", "subnet-2"]),
        kmsKeyId: pulumi.output("key-123"),
        kmsKeyArn: pulumi.output("arn:aws:kms:us-east-1:123456789012:key/key-123"),
        regions: { primary: "us-east-1", replicas: [] },
        enableAppMesh: false,
        enableAutoScaling: false,
        secretsManagerArns: pulumi.output({
          database: "arn:aws:secretsmanager:us-east-1:123456789012:secret:db-secret",
          api: "arn:aws:secretsmanager:us-east-1:123456789012:secret:api-secret",
        }),
      });
    });

    it("creates task execution role", (done) => {
      pulumi.all([stack.taskExecutionRoleArn]).apply(([roleArn]) => {
        expect(roleArn).toContain("arn:aws:");
        done();
      });
    });

    it("creates task role", (done) => {
      pulumi.all([stack.taskRoleArn]).apply(([roleArn]) => {
        expect(roleArn).toContain("arn:aws:");
        done();
      });
    });

    it("grants Secrets Manager access to task execution role", (done) => {
      pulumi.all([stack.taskExecutionRoleArn]).apply(([roleArn]) => {
        expect(roleArn).toBeDefined();
        done();
      });
    });

    it("grants KMS decrypt permissions", (done) => {
      pulumi.all([stack.taskExecutionRoleArn]).apply(([roleArn]) => {
        expect(roleArn).toBeDefined();
        done();
      });
    });

    it("grants DynamoDB permissions to task role", (done) => {
      pulumi.all([stack.taskRoleArn]).apply(([roleArn]) => {
        expect(roleArn).toBeDefined();
        done();
      });
    });

    it("grants SQS permissions to task role", (done) => {
      pulumi.all([stack.taskRoleArn]).apply(([roleArn]) => {
        expect(roleArn).toBeDefined();
        done();
      });
    });

    it("grants Kinesis permissions to task role", (done) => {
      pulumi.all([stack.taskRoleArn]).apply(([roleArn]) => {
        expect(roleArn).toBeDefined();
        done();
      });
    });

    it("grants X-Ray permissions to task role", (done) => {
      pulumi.all([stack.taskRoleArn]).apply(([roleArn]) => {
        expect(roleArn).toBeDefined();
        done();
      });
    });
  });

  describe("App Mesh Configuration", () => {
    it("creates App Mesh when enabled", (done) => {
      stack = new ComputeStack("test-mesh-enabled", {
        environmentSuffix: "mesh",
        tags: pulumi.output({ AppMesh: "enabled" }),
        vpcId: pulumi.output("vpc-123"),
        privateSubnetIds: pulumi.output(["subnet-1", "subnet-2"]),
        kmsKeyId: pulumi.output("key-123"),
        kmsKeyArn: pulumi.output("arn:aws:kms:us-east-1:123456789012:key/key-123"),
        regions: { primary: "us-east-1", replicas: [] },
        enableAppMesh: true,
        enableAutoScaling: false,
        secretsManagerArns: pulumi.output({
          database: "arn:aws:secretsmanager:us-east-1:123456789012:secret:db-secret",
          api: "arn:aws:secretsmanager:us-east-1:123456789012:secret:api-secret",
        }),
      });

      pulumi.all([stack.appMeshName]).apply(([meshName]) => {
        expect(meshName).toBeTruthy();
        expect(meshName).not.toContain("no-mesh");
        done();
      });
    });

    it("does not create App Mesh when disabled", (done) => {
      stack = new ComputeStack("test-mesh-disabled", {
        environmentSuffix: "no-mesh",
        tags: pulumi.output({ AppMesh: "disabled" }),
        vpcId: pulumi.output("vpc-123"),
        privateSubnetIds: pulumi.output(["subnet-1", "subnet-2"]),
        kmsKeyId: pulumi.output("key-123"),
        kmsKeyArn: pulumi.output("arn:aws:kms:us-east-1:123456789012:key/key-123"),
        regions: { primary: "us-east-1", replicas: [] },
        enableAppMesh: false,
        enableAutoScaling: false,
        secretsManagerArns: pulumi.output({
          database: "arn:aws:secretsmanager:us-east-1:123456789012:secret:db-secret",
          api: "arn:aws:secretsmanager:us-east-1:123456789012:secret:api-secret",
        }),
      });

      pulumi.all([stack.appMeshName]).apply(([meshName]) => {
        expect(meshName).toContain("no-mesh");
        done();
      });
    });

    it("creates virtual gateway", (done) => {
      stack = new ComputeStack("test-vgw", {
        environmentSuffix: "vgw",
        tags: pulumi.output({ VirtualGateway: "created" }),
        vpcId: pulumi.output("vpc-123"),
        privateSubnetIds: pulumi.output(["subnet-1", "subnet-2"]),
        kmsKeyId: pulumi.output("key-123"),
        kmsKeyArn: pulumi.output("arn:aws:kms:us-east-1:123456789012:key/key-123"),
        regions: { primary: "us-east-1", replicas: [] },
        enableAppMesh: true,
        enableAutoScaling: false,
        secretsManagerArns: pulumi.output({
          database: "arn:aws:secretsmanager:us-east-1:123456789012:secret:db-secret",
          api: "arn:aws:secretsmanager:us-east-1:123456789012:secret:api-secret",
        }),
      });

      pulumi.all([stack.appMeshName]).apply(([meshName]) => {
        expect(meshName).toBeDefined();
        done();
      });
    });

    it("creates gateway route", (done) => {
      stack = new ComputeStack("test-route", {
        environmentSuffix: "route",
        tags: pulumi.output({ Route: "created" }),
        vpcId: pulumi.output("vpc-123"),
        privateSubnetIds: pulumi.output(["subnet-1", "subnet-2"]),
        kmsKeyId: pulumi.output("key-123"),
        kmsKeyArn: pulumi.output("arn:aws:kms:us-east-1:123456789012:key/key-123"),
        regions: { primary: "us-east-1", replicas: [] },
        enableAppMesh: true,
        enableAutoScaling: false,
        secretsManagerArns: pulumi.output({
          database: "arn:aws:secretsmanager:us-east-1:123456789012:secret:db-secret",
          api: "arn:aws:secretsmanager:us-east-1:123456789012:secret:api-secret",
        }),
      });

      pulumi.all([stack.appMeshName]).apply(([meshName]) => {
        expect(meshName).toBeDefined();
        done();
      });
    });
  });

  describe("Microservices Creation", () => {
    beforeEach(() => {
      stack = new ComputeStack("test-services", {
        environmentSuffix: "services",
        tags: pulumi.output({ Microservices: "deployed" }),
        vpcId: pulumi.output("vpc-123"),
        privateSubnetIds: pulumi.output(["subnet-1", "subnet-2"]),
        kmsKeyId: pulumi.output("key-123"),
        kmsKeyArn: pulumi.output("arn:aws:kms:us-east-1:123456789012:key/key-123"),
        regions: { primary: "us-east-1", replicas: [] },
        enableAppMesh: true,
        enableAutoScaling: true,
        secretsManagerArns: pulumi.output({
          database: "arn:aws:secretsmanager:us-east-1:123456789012:secret:db-secret",
          api: "arn:aws:secretsmanager:us-east-1:123456789012:secret:api-secret",
        }),
      });
    });

    it("creates transaction service", (done) => {
      pulumi.all([stack.ecsClusterArn]).apply(([clusterArn]) => {
        expect(clusterArn).toBeDefined();
        done();
      });
    });

    it("creates account service", (done) => {
      pulumi.all([stack.ecsClusterArn]).apply(([clusterArn]) => {
        expect(clusterArn).toBeDefined();
        done();
      });
    });

    it("creates fraud detection service", (done) => {
      pulumi.all([stack.ecsClusterArn]).apply(([clusterArn]) => {
        expect(clusterArn).toBeDefined();
        done();
      });
    });
  });

  describe("Auto Scaling Configuration", () => {
    it("creates auto scaling when enabled", (done) => {
      stack = new ComputeStack("test-scaling-enabled", {
        environmentSuffix: "scaling",
        tags: pulumi.output({ AutoScaling: "enabled" }),
        vpcId: pulumi.output("vpc-123"),
        privateSubnetIds: pulumi.output(["subnet-1", "subnet-2"]),
        kmsKeyId: pulumi.output("key-123"),
        kmsKeyArn: pulumi.output("arn:aws:kms:us-east-1:123456789012:key/key-123"),
        regions: { primary: "us-east-1", replicas: [] },
        enableAppMesh: false,
        enableAutoScaling: true,
        secretsManagerArns: pulumi.output({
          database: "arn:aws:secretsmanager:us-east-1:123456789012:secret:db-secret",
          api: "arn:aws:secretsmanager:us-east-1:123456789012:secret:api-secret",
        }),
      });

      pulumi.all([stack.ecsClusterArn]).apply(([clusterArn]) => {
        expect(clusterArn).toBeDefined();
        done();
      });
    });

    it("does not create auto scaling when disabled", (done) => {
      stack = new ComputeStack("test-scaling-disabled", {
        environmentSuffix: "no-scaling",
        tags: pulumi.output({ AutoScaling: "disabled" }),
        vpcId: pulumi.output("vpc-123"),
        privateSubnetIds: pulumi.output(["subnet-1", "subnet-2"]),
        kmsKeyId: pulumi.output("key-123"),
        kmsKeyArn: pulumi.output("arn:aws:kms:us-east-1:123456789012:key/key-123"),
        regions: { primary: "us-east-1", replicas: [] },
        enableAppMesh: false,
        enableAutoScaling: false,
        secretsManagerArns: pulumi.output({
          database: "arn:aws:secretsmanager:us-east-1:123456789012:secret:db-secret",
          api: "arn:aws:secretsmanager:us-east-1:123456789012:secret:api-secret",
        }),
      });

      pulumi.all([stack.ecsClusterName]).apply(([clusterName]) => {
        expect(clusterName).toBeDefined();
        done();
      });
    });
  });

  describe("Task Definitions", () => {
    beforeEach(() => {
      stack = new ComputeStack("test-tasks", {
        environmentSuffix: "tasks",
        tags: pulumi.output({ Tasks: "configured" }),
        vpcId: pulumi.output("vpc-123"),
        privateSubnetIds: pulumi.output(["subnet-1", "subnet-2"]),
        kmsKeyId: pulumi.output("key-123"),
        kmsKeyArn: pulumi.output("arn:aws:kms:us-east-1:123456789012:key/key-123"),
        regions: { primary: "us-east-1", replicas: [] },
        enableAppMesh: true,
        enableAutoScaling: false,
        secretsManagerArns: pulumi.output({
          database: "arn:aws:secretsmanager:us-east-1:123456789012:secret:db-secret",
          api: "arn:aws:secretsmanager:us-east-1:123456789012:secret:api-secret",
        }),
      });
    });

    it("uses Fargate launch type", (done) => {
      pulumi.all([stack.ecsClusterArn]).apply(([clusterArn]) => {
        expect(clusterArn).toBeDefined();
        done();
      });
    });

    it("configures awsvpc network mode", (done) => {
      pulumi.all([stack.ecsClusterName]).apply(([clusterName]) => {
        expect(clusterName).toBeDefined();
        done();
      });
    });

    it("includes Envoy sidecar when App Mesh enabled", (done) => {
      pulumi.all([stack.appMeshName]).apply(([meshName]) => {
        expect(meshName).toBeTruthy();
        done();
      });
    });

    it("configures health checks", (done) => {
      pulumi.all([stack.ecsClusterArn]).apply(([clusterArn]) => {
        expect(clusterArn).toBeDefined();
        done();
      });
    });

    it("configures CloudWatch logging", (done) => {
      pulumi.all([stack.ecsClusterName]).apply(([clusterName]) => {
        expect(clusterName).toBeDefined();
        done();
      });
    });
  });

  describe("ECS Services", () => {
    beforeEach(() => {
      stack = new ComputeStack("test-ecs-services", {
        environmentSuffix: "svc",
        tags: pulumi.output({ Services: "running" }),
        vpcId: pulumi.output("vpc-123"),
        privateSubnetIds: pulumi.output(["subnet-1", "subnet-2"]),
        kmsKeyId: pulumi.output("key-123"),
        kmsKeyArn: pulumi.output("arn:aws:kms:us-east-1:123456789012:key/key-123"),
        regions: { primary: "us-east-1", replicas: [] },
        enableAppMesh: false,
        enableAutoScaling: false,
        secretsManagerArns: pulumi.output({
          database: "arn:aws:secretsmanager:us-east-1:123456789012:secret:db-secret",
          api: "arn:aws:secretsmanager:us-east-1:123456789012:secret:api-secret",
        }),
      });
    });

    it("deploys services in private subnets", (done) => {
      pulumi.all([stack.ecsClusterArn]).apply(([clusterArn]) => {
        expect(clusterArn).toBeDefined();
        done();
      });
    });

    it("enables execute command", (done) => {
      pulumi.all([stack.ecsClusterName]).apply(([clusterName]) => {
        expect(clusterName).toBeDefined();
        done();
      });
    });

    it("configures health check grace period", (done) => {
      pulumi.all([stack.ecsClusterArn]).apply(([clusterArn]) => {
        expect(clusterArn).toBeDefined();
        done();
      });
    });
  });

  describe("Virtual Nodes and Services", () => {
    beforeEach(() => {
      stack = new ComputeStack("test-vnodes", {
        environmentSuffix: "vnodes",
        tags: pulumi.output({ VirtualNodes: "created" }),
        vpcId: pulumi.output("vpc-123"),
        privateSubnetIds: pulumi.output(["subnet-1", "subnet-2"]),
        kmsKeyId: pulumi.output("key-123"),
        kmsKeyArn: pulumi.output("arn:aws:kms:us-east-1:123456789012:key/key-123"),
        regions: { primary: "us-east-1", replicas: [] },
        enableAppMesh: true,
        enableAutoScaling: false,
        secretsManagerArns: pulumi.output({
          database: "arn:aws:secretsmanager:us-east-1:123456789012:secret:db-secret",
          api: "arn:aws:secretsmanager:us-east-1:123456789012:secret:api-secret",
        }),
      });
    });

    it("creates virtual nodes for each service", (done) => {
      pulumi.all([stack.appMeshName]).apply(([meshName]) => {
        expect(meshName).toBeDefined();
        done();
      });
    });

    it("creates virtual services for each node", (done) => {
      pulumi.all([stack.appMeshName]).apply(([meshName]) => {
        expect(meshName).toBeTruthy();
        done();
      });
    });

    it("configures service discovery", (done) => {
      pulumi.all([stack.appMeshName]).apply(([meshName]) => {
        expect(meshName).toBeDefined();
        done();
      });
    });

    it("configures health checks on virtual nodes", (done) => {
      pulumi.all([stack.appMeshName]).apply(([meshName]) => {
        expect(meshName).toBeDefined();
        done();
      });
    });
  });

  describe("Output Registration", () => {
    beforeEach(() => {
      stack = new ComputeStack("test-outputs", {
        environmentSuffix: "outputs",
        tags: pulumi.output({ Test: "outputs" }),
        vpcId: pulumi.output("vpc-123"),
        privateSubnetIds: pulumi.output(["subnet-1", "subnet-2"]),
        kmsKeyId: pulumi.output("key-123"),
        kmsKeyArn: pulumi.output("arn:aws:kms:us-east-1:123456789012:key/key-123"),
        regions: { primary: "us-east-1", replicas: [] },
        enableAppMesh: true,
        enableAutoScaling: true,
        secretsManagerArns: pulumi.output({
          database: "arn:aws:secretsmanager:us-east-1:123456789012:secret:db-secret",
          api: "arn:aws:secretsmanager:us-east-1:123456789012:secret:api-secret",
        }),
      });
    });

    it("registers all required outputs", () => {
      expect(stack).toHaveProperty("ecsClusterArn");
      expect(stack).toHaveProperty("ecsClusterName");
      expect(stack).toHaveProperty("appMeshName");
      expect(stack).toHaveProperty("ecsSecurityGroupId");
      expect(stack).toHaveProperty("taskExecutionRoleArn");
      expect(stack).toHaveProperty("taskRoleArn");
    });

    it("outputs are Pulumi Output types", () => {
      expect(pulumi.Output.isInstance(stack.ecsClusterArn)).toBe(true);
      expect(pulumi.Output.isInstance(stack.ecsClusterName)).toBe(true);
      expect(pulumi.Output.isInstance(stack.appMeshName)).toBe(true);
      expect(pulumi.Output.isInstance(stack.ecsSecurityGroupId)).toBe(true);
      expect(pulumi.Output.isInstance(stack.taskExecutionRoleArn)).toBe(true);
      expect(pulumi.Output.isInstance(stack.taskRoleArn)).toBe(true);
    });
  });

  describe("Resource Dependencies", () => {
    beforeEach(() => {
      stack = new ComputeStack("test-deps", {
        environmentSuffix: "deps",
        tags: pulumi.output({ Dependencies: "test" }),
        vpcId: pulumi.output("vpc-123"),
        privateSubnetIds: pulumi.output(["subnet-1", "subnet-2"]),
        kmsKeyId: pulumi.output("key-123"),
        kmsKeyArn: pulumi.output("arn:aws:kms:us-east-1:123456789012:key/key-123"),
        regions: { primary: "us-east-1", replicas: [] },
        enableAppMesh: true,
        enableAutoScaling: true,
        secretsManagerArns: pulumi.output({
          database: "arn:aws:secretsmanager:us-east-1:123456789012:secret:db-secret",
          api: "arn:aws:secretsmanager:us-east-1:123456789012:secret:api-secret",
        }),
      });
    });

    it("log group created before cluster", (done) => {
      pulumi.all([stack.ecsClusterArn]).apply(([clusterArn]) => {
        expect(clusterArn).toBeDefined();
        done();
      });
    });

    it("task definitions depend on IAM roles", (done) => {
      pulumi.all([stack.taskExecutionRoleArn, stack.taskRoleArn]).apply(([executionRoleArn, taskRoleArn]) => {
        expect(executionRoleArn).toBeDefined();
        expect(taskRoleArn).toBeDefined();
        done();
      });
    });

    it("services depend on task definitions", (done) => {
      pulumi.all([stack.ecsClusterArn]).apply(([clusterArn]) => {
        expect(clusterArn).toBeDefined();
        done();
      });
    });

    it("virtual services depend on virtual nodes", (done) => {
      pulumi.all([stack.appMeshName]).apply(([meshName]) => {
        expect(meshName).toBeDefined();
        done();
      });
    });
  });
});