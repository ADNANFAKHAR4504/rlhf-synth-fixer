// Mock the modules before importing anything
jest.mock("@pulumi/pulumi", () => ({
  ComponentResource: jest.fn().mockImplementation(function(type, name, args, opts) {
    this.type = type;
    this.name = name;
    this.args = args;
    this.opts = opts;
    this.registerOutputs = jest.fn();
  }),
  interpolate: jest.fn((str) => str),
  jsonStringify: jest.fn((obj) => JSON.stringify(obj))
}));

jest.mock("@pulumi/aws", () => ({
  iam: {
    Role: jest.fn().mockImplementation(function(name) { 
      this.arn = `arn:aws:iam::123456789012:role/${name}`;
      this.name = name;
    }),
    Policy: jest.fn().mockImplementation(function(name) { 
      this.arn = `arn:aws:iam::123456789012:policy/${name}`;
    }),
    RolePolicyAttachment: jest.fn()
  },
  ecs: {
    Cluster: jest.fn().mockImplementation(function(name) { 
      this.id = `cluster-${name}`;
      this.name = name;
      this.arn = `arn:aws:ecs:us-west-2:123456789012:cluster/${name}`;
    }),
    TaskDefinition: jest.fn().mockImplementation(function(name) { 
      this.arn = `arn:aws:ecs:us-west-2:123456789012:task-definition/${name}`;
    }),
    Service: jest.fn().mockImplementation(function(name) { 
      this.name = name;
      this.id = `service-${name}`;
    })
  },
  ec2: {
    SecurityGroup: jest.fn().mockImplementation(function(name) { 
      this.id = `sg-${name}`;
    })
  },
  lb: {
    LoadBalancer: jest.fn().mockImplementation(function(name) { 
      this.arn = `arn:aws:elasticloadbalancing:us-west-2:123456789012:loadbalancer/app/${name}`;
      this.dnsName = `${name}.elb.amazonaws.com`;
    }),
    TargetGroup: jest.fn().mockImplementation(function(name) { 
      this.arn = `arn:aws:elasticloadbalancing:us-west-2:123456789012:targetgroup/${name}`;
    }),
    Listener: jest.fn()
  },
  ecr: {
    Repository: jest.fn().mockImplementation(function(name) { 
      this.repositoryUrl = `123456789012.dkr.ecr.us-west-2.amazonaws.com/${name}`;
    })
  },
  secretsmanager: {
    Secret: jest.fn().mockImplementation(function(name) { 
      this.id = `secret-${name}`;
      this.arn = `arn:aws:secretsmanager:us-west-2:123456789012:secret:${name}`;
    }),
    SecretVersion: jest.fn()
  },
  cloudwatch: {
    LogGroup: jest.fn(),
    MetricAlarm: jest.fn()
  },
  servicediscovery: {
    HttpNamespace: jest.fn().mockImplementation(function(name) { 
      this.arn = `arn:aws:servicediscovery:us-west-2:123456789012:namespace/${name}`;
    }),
    getHttpNamespace: jest.fn().mockResolvedValue({ id: 'namespace-id' })
  },
  appautoscaling: {
    Target: jest.fn().mockImplementation(function(name) { 
      this.resourceId = `service/cluster/service`;
      this.scalableDimension = "ecs:service:DesiredCount";
      this.serviceNamespace = "ecs";
    }),
    Policy: jest.fn()
  }
}));

jest.mock("@pulumi/awsx", () => ({
  ec2: {
    Vpc: jest.fn().mockImplementation(function(name) { 
      this.vpcId = `vpc-${name}`;
      this.publicSubnetIds = [`subnet-public-1`, `subnet-public-2`];
      this.privateSubnetIds = [`subnet-private-1`, `subnet-private-2`];
    })
  }
}));

import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";
import * as awsx from "@pulumi/awsx";

// Import after mocking
import { TapStack } from "../lib/tap-stack.mjs";

describe("TapStack Structure", () => {
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
          Project: "TAP",
          Environment: "Development"
        }
      });
      expect(stack).toBeDefined();
      expect(stack).toBeInstanceOf(TapStack);
    });
  });

  describe("Component Resource Behavior", () => {
    it("should call super constructor with correct parameters", () => {
      const args = { environmentSuffix: "test" };
      new TapStack("TestTapStackSuper", args);
      
      expect(pulumi.ComponentResource).toHaveBeenCalledWith(
        'tap:stack:TapStack',
        'TestTapStackSuper',
        args,
        undefined
      );
    });

    it("should have registerOutputs method", () => {
      const stack = new TapStack("TestTapStackOutputs", {});
      expect(typeof stack.registerOutputs).toBe('function');
    });

    it("should register correct outputs", () => {
      const stack = new TapStack("TestTapStackRegister", { environmentSuffix: "test" });
      expect(stack.registerOutputs).toHaveBeenCalledWith(
        expect.objectContaining({
          vpcId: expect.any(String),
          albDnsName: expect.any(String),
          albArn: expect.any(String),
          ecrRepositoryUrl: expect.any(String),
          ecsClusterName: expect.any(String),
          ecsServiceName: expect.any(String),
          secretsManagerSecretArn: expect.any(String)
        })
      );
    });
  });

  describe("VPC Creation", () => {
    it("should create VPC with correct configuration", () => {
      new TapStack("TestVpc", { environmentSuffix: "test" });
      
      expect(awsx.ec2.Vpc).toHaveBeenCalledWith(
        "vpc-test",
        expect.objectContaining({
          numberOfAvailabilityZones: 2,
          subnets: expect.arrayContaining([
            expect.objectContaining({ type: "public", name: "public" }),
            expect.objectContaining({ type: "private", name: "private" })
          ])
        }),
        expect.any(Object)
      );
    });
  });

  describe("Security Groups", () => {
    it("should create ALB security group with correct ingress rules", () => {
      new TapStack("TestSG", { environmentSuffix: "test" });
      
      expect(aws.ec2.SecurityGroup).toHaveBeenCalledWith(
        "alb-sg-test",
        expect.objectContaining({
          description: "Security group for Application Load Balancer",
          ingress: expect.arrayContaining([
            expect.objectContaining({
              protocol: "tcp",
              fromPort: 80,
              toPort: 80,
              cidrBlocks: ["0.0.0.0/0"]
            }),
            expect.objectContaining({
              protocol: "tcp",
              fromPort: 443,
              toPort: 443,
              cidrBlocks: ["0.0.0.0/0"]
            })
          ])
        }),
        expect.any(Object)
      );
    });

    it("should create ECS security group with correct configuration", () => {
      new TapStack("TestEcsSG", { environmentSuffix: "test" });
      
      expect(aws.ec2.SecurityGroup).toHaveBeenCalledWith(
        "ecs-sg-test",
        expect.objectContaining({
          description: "Security group for ECS Fargate tasks",
          ingress: expect.arrayContaining([
            expect.objectContaining({
              protocol: "tcp",
              fromPort: 80,
              toPort: 80
            })
          ])
        }),
        expect.any(Object)
      );
    });
  });

  describe("Load Balancer", () => {
    it("should create Application Load Balancer", () => {
      new TapStack("TestALB", { environmentSuffix: "test" });
      
      expect(aws.lb.LoadBalancer).toHaveBeenCalledWith(
        "alb-test",
        expect.objectContaining({
          internal: false,
          loadBalancerType: "application",
          enableDeletionProtection: false
        }),
        expect.any(Object)
      );
    });

    it("should create target group with health check", () => {
      new TapStack("TestTG", { environmentSuffix: "test" });
      
      expect(aws.lb.TargetGroup).toHaveBeenCalledWith(
        "tg-test",
        expect.objectContaining({
          port: 80,
          protocol: "HTTP",
          targetType: "ip",
          healthCheck: expect.objectContaining({
            enabled: true,
            path: "/",
            interval: 30,
            timeout: 5
          })
        }),
        expect.any(Object)
      );
    });
  });

  describe("ECS Resources", () => {
    it("should create ECS cluster with Container Insights", () => {
      new TapStack("TestCluster", { environmentSuffix: "test" });
      
      expect(aws.ecs.Cluster).toHaveBeenCalledWith(
        "cluster-test",
        expect.objectContaining({
          name: "ci-cd-pipeline-cluster-test",
          settings: expect.arrayContaining([
            expect.objectContaining({
              name: "containerInsights",
              value: "enhanced"
            })
          ])
        }),
        expect.any(Object)
      );
    });

    it("should create ECS task definition with Fargate", () => {
      new TapStack("TestTask", { environmentSuffix: "test" });
      
      expect(aws.ecs.TaskDefinition).toHaveBeenCalledWith(
        "task-test",
        expect.objectContaining({
          family: "ci-cd-pipeline-task-test",
          networkMode: "awsvpc",
          requiresCompatibilities: ["FARGATE"],
          cpu: "256",
          memory: "512"
        }),
        expect.any(Object)
      );
    });

    it("should create ECS service with correct configuration", () => {
      new TapStack("TestService", { environmentSuffix: "test" });
      
      expect(aws.ecs.Service).toHaveBeenCalledWith(
        "service-test",
        expect.objectContaining({
          name: "ci-cd-pipeline-service-test",
          launchType: "FARGATE",
          desiredCount: 2,
          enableExecuteCommand: true,
          deploymentMaximumPercent: 200,
          deploymentMinimumHealthyPercent: 50
        }),
        expect.any(Object)
      );
    });
  });

  describe("ECR Repository", () => {
    it("should create ECR repository with image scanning", () => {
      new TapStack("TestECR", { environmentSuffix: "test" });
      
      expect(aws.ecr.Repository).toHaveBeenCalledWith(
        "ecr-test",
        expect.objectContaining({
          name: "ci-cd-pipeline-app-test",
          imageTagMutability: "MUTABLE",
          imageScanningConfiguration: expect.objectContaining({
            scanOnPush: true
          })
        }),
        expect.any(Object)
      );
    });
  });

  describe("Secrets Management", () => {
    it("should create Secrets Manager secret", () => {
      new TapStack("TestSecrets", { environmentSuffix: "test" });
      
      expect(aws.secretsmanager.Secret).toHaveBeenCalledWith(
        "secrets-test",
        expect.objectContaining({
          name: "ci-cd-pipeline/app/test",
          description: "Application secrets for CI/CD pipeline"
        }),
        expect.any(Object)
      );
    });

    it("should create secret version with default values", () => {
      new TapStack("TestSecretVersion", { environmentSuffix: "test" });
      
      expect(aws.secretsmanager.SecretVersion).toHaveBeenCalledWith(
        "secret-ver-test",
        expect.objectContaining({
          secretString: expect.stringContaining("DATABASE_URL")
        }),
        expect.any(Object)
      );
    });
  });

  describe("IAM Roles", () => {
    it("should create task execution role", () => {
      new TapStack("TestIAM", { environmentSuffix: "test" });
      
      expect(aws.iam.Role).toHaveBeenCalledWith(
        "task-exec-role-test",
        expect.objectContaining({
          assumeRolePolicy: expect.stringContaining("ecs-tasks.amazonaws.com")
        }),
        expect.any(Object)
      );
    });

    it("should attach ECS task execution policy", () => {
      new TapStack("TestIAMPolicy", { environmentSuffix: "test" });
      
      expect(aws.iam.RolePolicyAttachment).toHaveBeenCalledWith(
        "task-exec-policy-test",
        expect.objectContaining({
          policyArn: "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
        }),
        expect.any(Object)
      );
    });
  });

  describe("Auto Scaling", () => {
    it("should create auto scaling target", () => {
      new TapStack("TestScaling", { environmentSuffix: "test" });
      
      expect(aws.appautoscaling.Target).toHaveBeenCalledWith(
        "scaling-target-test",
        expect.objectContaining({
          maxCapacity: 10,
          minCapacity: 1,
          scalableDimension: "ecs:service:DesiredCount",
          serviceNamespace: "ecs"
        }),
        expect.any(Object)
      );
    });

    it("should create CPU scaling policy", () => {
      new TapStack("TestCPUScaling", { environmentSuffix: "test" });
      
      expect(aws.appautoscaling.Policy).toHaveBeenCalledWith(
        "cpu-scaling-test",
        expect.objectContaining({
          name: "ci-cd-pipeline-cpu-scaling-test",
          policyType: "TargetTrackingScaling",
          targetTrackingScalingPolicyConfiguration: expect.objectContaining({
            targetValue: 70.0
          })
        }),
        expect.any(Object)
      );
    });

    it("should create memory scaling policy", () => {
      new TapStack("TestMemScaling", { environmentSuffix: "test" });
      
      expect(aws.appautoscaling.Policy).toHaveBeenCalledWith(
        "mem-scaling-test",
        expect.objectContaining({
          name: "ci-cd-pipeline-memory-scaling-test",
          policyType: "TargetTrackingScaling",
          targetTrackingScalingPolicyConfiguration: expect.objectContaining({
            targetValue: 80.0
          })
        }),
        expect.any(Object)
      );
    });
  });

  describe("Monitoring", () => {
    it("should create CloudWatch log group", () => {
      new TapStack("TestLogs", { environmentSuffix: "test" });
      
      expect(aws.cloudwatch.LogGroup).toHaveBeenCalledWith(
        "logs-test",
        expect.objectContaining({
          name: "/ecs/ci-cd-pipeline-test",
          retentionInDays: 7
        }),
        expect.any(Object)
      );
    });

    it("should create CPU alarm", () => {
      new TapStack("TestAlarm", { environmentSuffix: "test" });
      
      expect(aws.cloudwatch.MetricAlarm).toHaveBeenCalledWith(
        "cpu-alarm-test",
        expect.objectContaining({
          comparisonOperator: "GreaterThanThreshold",
          metricName: "CPUUtilization",
          namespace: "AWS/ECS",
          threshold: 85
        }),
        expect.any(Object)
      );
    });
  });

  describe("Service Discovery", () => {
    it("should create service discovery namespace", () => {
      new TapStack("TestServiceDiscovery", { environmentSuffix: "test" });
      
      expect(aws.servicediscovery.HttpNamespace).toHaveBeenCalledWith(
        "namespace-test",
        expect.objectContaining({
          name: "ci-cd-pipeline-namespace-test",
          description: "Service discovery namespace for CI/CD pipeline"
        }),
        expect.any(Object)
      );
    });
  });

  describe("Stack Outputs", () => {
    it("should expose all required outputs", () => {
      const stack = new TapStack("TestOutputs", { environmentSuffix: "test" });
      
      expect(stack.vpcId).toBeDefined();
      expect(stack.albDnsName).toBeDefined();
      expect(stack.albArn).toBeDefined();
      expect(stack.ecrRepositoryUrl).toBeDefined();
      expect(stack.ecsClusterName).toBeDefined();
      expect(stack.ecsServiceName).toBeDefined();
      expect(stack.secretsManagerSecretArn).toBeDefined();
    });
  });

  describe("Error Handling", () => {
    it("should handle undefined args gracefully", () => {
      expect(() => {
        const stack = new TapStack("TestUndefined");
        expect(stack).toBeDefined();
      }).not.toThrow();
    });

    it("should use default environment suffix when not provided", () => {
      new TapStack("TestDefaults", {});
      
      expect(awsx.ec2.Vpc).toHaveBeenCalledWith(
        "vpc-dev",
        expect.any(Object),
        expect.any(Object)
      );
    });
  });
});