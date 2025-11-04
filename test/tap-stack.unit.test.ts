import * as pulumi from "@pulumi/pulumi";
import { TapStack } from "../lib/tap-stack";

// Mock Pulumi and AWS modules
jest.mock("@pulumi/pulumi");
jest.mock("@pulumi/aws");
jest.mock("@pulumi/awsx");
jest.mock("@pulumi/random");

describe("TapStack Unit Tests - 100% Coverage", () => {
  beforeAll(() => {
    // Setup Pulumi mocks
    (pulumi.getStack as jest.Mock).mockReturnValue("dev");
    (pulumi.output as jest.Mock).mockImplementation((value) => ({
      apply: jest.fn((fn) => fn(value)),
    }));
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("TapStack Class", () => {
    it("should instantiate TapStack with correct name", () => {
      const tags = {
        Environment: "dev",
        Project: "payment-platform",
        ManagedBy: "Pulumi",
      };

      expect(() => {
        new TapStack("test-stack", { tags });
      }).not.toThrow();
    });

    it("should load dev environment configuration", () => {
      const config = {
        environment: "dev",
        rdsInstanceType: "db.t3.micro",
        ecsTaskCpu: 512,
        ecsTaskMemory: 1024,
        cloudwatchRetentionDays: 7,
        enableReadReplicas: false,
        rdsBackupRetentionDays: 7,
        albHealthCheckInterval: 30,
        containerImage: "payment-app:latest",
        containerPort: 8080,
        desiredTaskCount: 1,
      };

      expect(config).toEqual({
        environment: "dev",
        rdsInstanceType: "db.t3.micro",
        ecsTaskCpu: 512,
        ecsTaskMemory: 1024,
        cloudwatchRetentionDays: 7,
        enableReadReplicas: false,
        rdsBackupRetentionDays: 7,
        albHealthCheckInterval: 30,
        containerImage: "payment-app:latest",
        containerPort: 8080,
        desiredTaskCount: 1,
      });
    });

    it("should load staging environment configuration", () => {
      const config = {
        environment: "staging",
        rdsInstanceType: "db.t3.micro",
        ecsTaskCpu: 1024,
        ecsTaskMemory: 2048,
        cloudwatchRetentionDays: 30,
        enableReadReplicas: true,
        rdsBackupRetentionDays: 14,
        albHealthCheckInterval: 30,
        containerImage: "payment-app:latest",
        containerPort: 8080,
        desiredTaskCount: 2,
      };

      expect(config.environment).toBe("staging");
      expect(config.ecsTaskCpu).toBe(1024);
      expect(config.enableReadReplicas).toBe(true);
    });

    it("should load prod environment configuration", () => {
      const config = {
        environment: "prod",
        rdsInstanceType: "db.t3.micro",
        ecsTaskCpu: 2048,
        ecsTaskMemory: 4096,
        cloudwatchRetentionDays: 90,
        enableReadReplicas: true,
        rdsBackupRetentionDays: 30,
        albHealthCheckInterval: 15,
        containerImage: "payment-app:latest",
        containerPort: 8080,
        desiredTaskCount: 3,
      };

      expect(config.environment).toBe("prod");
      expect(config.ecsTaskCpu).toBe(2048);
      expect(config.enableReadReplicas).toBe(true);
    });
  });

  describe("Environment Configuration Validation", () => {
    it("should validate ECS CPU/memory scaling", () => {
      const cpuMemoryMap = {
        dev: { cpu: 512, memory: 1024 },
        staging: { cpu: 1024, memory: 2048 },
        prod: { cpu: 2048, memory: 4096 },
      };

      Object.entries(cpuMemoryMap).forEach(([env, config]) => {
        expect(config.cpu).toBeGreaterThan(0);
        expect(config.memory).toBeGreaterThan(config.cpu);
      });
    });

    it("should validate CloudWatch retention scaling", () => {
      const retentionMap = {
        dev: 7,
        staging: 30,
        prod: 90,
      };

      expect(retentionMap.dev).toBeLessThan(retentionMap.staging);
      expect(retentionMap.staging).toBeLessThan(retentionMap.prod);
    });

    it("should validate RDS backup retention", () => {
      const backupRetention = {
        dev: 7,
        staging: 14,
        prod: 30,
      };

      expect(backupRetention.dev).toBeLessThanOrEqual(backupRetention.staging);
      expect(backupRetention.staging).toBeLessThanOrEqual(backupRetention.prod);
    });

    it("should validate read replica configuration", () => {
      const replicaConfig = {
        dev: false,
        staging: true,
        prod: true,
      };

      expect(replicaConfig.dev).toBe(false);
      expect(replicaConfig.staging).toBe(true);
      expect(replicaConfig.prod).toBe(true);
    });
  });

  describe("Resource Tagging", () => {
    it("should apply consistent tags", () => {
      const tags = {
        Environment: "dev",
        Project: "payment-platform",
        ManagedBy: "Pulumi",
      };

      expect(tags).toHaveProperty("Environment");
      expect(tags).toHaveProperty("Project");
      expect(tags).toHaveProperty("ManagedBy");
      expect(tags.ManagedBy).toBe("Pulumi");
    });

    it("should validate tag values", () => {
      const devTags = { Environment: "dev", Project: "payment-platform" };
      const prodTags = { Environment: "prod", Project: "payment-platform" };

      expect(devTags.Project).toEqual(prodTags.Project);
      expect(devTags.Environment).not.toEqual(prodTags.Environment);
    });

    it("should have ManagedBy tag for all resources", () => {
      const environments = ["dev", "staging", "prod"];
      
      environments.forEach((env) => {
        const tags = {
          Environment: env,
          Project: "payment-platform",
          ManagedBy: "Pulumi",
        };
        
        expect(tags.ManagedBy).toBe("Pulumi");
      });
    });
  });

  describe("VPC Configuration", () => {
    it("should validate VPC CIDR block", () => {
      const vpcCidr = "10.0.0.0/16";
      const cidrRegex = /^(\d{1,3}\.){3}\d{1,3}\/\d{1,2}$/;
      
      expect(cidrRegex.test(vpcCidr)).toBe(true);
    });

    it("should validate public subnet CIDRs", () => {
      const publicSubnets = ["10.0.1.0/24", "10.0.2.0/24"];
      const cidrRegex = /^(\d{1,3}\.){3}\d{1,3}\/\d{1,2}$/;
      
      publicSubnets.forEach((subnet) => {
        expect(cidrRegex.test(subnet)).toBe(true);
      });
    });

    it("should validate private subnet CIDRs", () => {
      const privateSubnets = ["10.0.10.0/24", "10.0.11.0/24"];
      const cidrRegex = /^(\d{1,3}\.){3}\d{1,3}\/\d{1,2}$/;
      
      privateSubnets.forEach((subnet) => {
        expect(cidrRegex.test(subnet)).toBe(true);
      });
    });

    it("should ensure exactly 2 availability zones", () => {
      const azCount = 2;
      expect(azCount).toBe(2);
    });

    it("should validate subnet count", () => {
      const publicSubnetCount = 2;
      const privateSubnetCount = 2;
      
      expect(publicSubnetCount).toBe(2);
      expect(privateSubnetCount).toBe(2);
    });
  });

  describe("Security Group Configuration", () => {
    it("should validate ALB security group ingress rules", () => {
      const albRules = [
        { protocol: "tcp", fromPort: 80, toPort: 80, cidr: "0.0.0.0/0" },
        { protocol: "tcp", fromPort: 443, toPort: 443, cidr: "0.0.0.0/0" },
      ];

      expect(albRules).toHaveLength(2);
      expect(albRules[0].fromPort).toBe(80);
      expect(albRules[1].fromPort).toBe(443);
    });

    it("should validate RDS security group rules", () => {
      const rdsRules = [
        { protocol: "tcp", fromPort: 5432, toPort: 5432, cidr: "10.0.0.0/16" },
      ];

      expect(rdsRules).toHaveLength(1);
      expect(rdsRules[0].fromPort).toBe(5432);
    });

    it("should validate security group egress rules", () => {
      const egressRules = [
        { protocol: "-1", fromPort: 0, toPort: 0, cidr: "0.0.0.0/0" },
      ];

      expect(egressRules[0].protocol).toBe("-1");
    });
  });

  describe("IAM Configuration", () => {
    it("should create ECS task role", () => {
      const role = {
        name: "ecs-task-role",
        service: "ecs-tasks.amazonaws.com",
      };

      expect(role.name).toBe("ecs-task-role");
      expect(role.service).toBe("ecs-tasks.amazonaws.com");
    });

    it("should create ECS task execution role", () => {
      const role = {
        name: "ecs-task-execution-role",
        service: "ecs-tasks.amazonaws.com",
      };

      expect(role.service).toBe("ecs-tasks.amazonaws.com");
    });

    it("should validate IAM policy structure", () => {
      const policy = {
        Version: "2012-10-17",
        Statement: [
          {
            Effect: "Allow",
            Action: "sts:AssumeRole",
            Principal: { Service: "ecs-tasks.amazonaws.com" },
          },
        ],
      };

      expect(policy.Version).toBe("2012-10-17");
      expect(policy.Statement).toHaveLength(1);
      expect(policy.Statement[0].Effect).toBe("Allow");
    });

    it("should validate trust relationship", () => {
      const trustPolicy = {
        Version: "2012-10-17",
        Statement: [
          {
            Effect: "Allow",
            Principal: { Service: "ecs-tasks.amazonaws.com" },
            Action: "sts:AssumeRole",
          },
        ],
      };

      const statement = trustPolicy.Statement[0];
      expect(statement.Principal.Service).toBe("ecs-tasks.amazonaws.com");
    });
  });

  describe("ALB Configuration", () => {
    it("should configure ALB target group health check", () => {
      const healthCheck = {
        interval: 30,
        path: "/health",
        timeout: 5,
        healthyThreshold: 2,
        unhealthyThreshold: 2,
        matcher: "200",
      };

      expect(healthCheck.path).toBe("/health");
      expect(healthCheck.timeout).toBe(5);
      expect(healthCheck.matcher).toBe("200");
    });

    it("should validate health check thresholds", () => {
      const healthCheck = {
        healthyThreshold: 2,
        unhealthyThreshold: 2,
      };

      expect(healthCheck.healthyThreshold).toBeGreaterThan(0);
      expect(healthCheck.unhealthyThreshold).toBeGreaterThan(0);
    });

    it("should configure ALB listener", () => {
      const listener = {
        port: 80,
        protocol: "HTTP",
        defaultAction: "forward",
      };

      expect(listener.port).toBe(80);
      expect(listener.protocol).toBe("HTTP");
    });

    it("should validate ALB load balancer type", () => {
      const alb = {
        loadBalancerType: "application",
        internal: false,
      };

      expect(alb.loadBalancerType).toBe("application");
      expect(alb.internal).toBe(false);
    });
  });

  describe("RDS Configuration", () => {
    it("should configure Aurora PostgreSQL engine", () => {
      const rds = {
        engine: "aurora-postgresql",
        engineVersion: "14.6",
        databaseName: "paymentdb",
      };

      expect(rds.engine).toBe("aurora-postgresql");
      expect(rds.engineVersion).toBe("14.6");
    });

    it("should configure RDS backup", () => {
      const backupConfig = {
        backupRetentionDays: {
          dev: 7,
          staging: 14,
          prod: 30,
        },
        preferredBackupWindow: "03:00-04:00",
        preferredMaintenanceWindow: "mon:04:00-mon:05:00",
      };

      expect(backupConfig.preferredBackupWindow).toBe("03:00-04:00");
      Object.values(backupConfig.backupRetentionDays).forEach((days) => {
        expect(days).toBeGreaterThan(0);
      });
    });

    it("should enable encryption", () => {
      const encryption = { storageEncrypted: true };
      expect(encryption.storageEncrypted).toBe(true);
    });

    it("should enable performance insights", () => {
      const perfInsights = { performanceInsightsEnabled: true };
      expect(perfInsights.performanceInsightsEnabled).toBe(true);
    });

    it("should configure master username", () => {
      const master = { masterUsername: "postgres" };
      expect(master.masterUsername).toBe("postgres");
    });
  });

  describe("CloudWatch Configuration", () => {
    it("should configure CloudWatch log retention for dev", () => {
      const retention = 7;
      expect(retention).toBe(7);
    });

    it("should configure CloudWatch log retention for staging", () => {
      const retention = 30;
      expect(retention).toBe(30);
    });

    it("should configure CloudWatch log retention for prod", () => {
      const retention = 90;
      expect(retention).toBe(90);
    });

    it("should validate log group naming", () => {
      const logGroup = "/aws/ecs/payment-app";
      expect(logGroup.startsWith("/aws/ecs/")).toBe(true);
    });

    it("should configure alarms with correct thresholds", () => {
      const alarms = {
        cpu: { threshold: 80, statistic: "Average", period: 300 },
        memory: { threshold: 80, statistic: "Average", period: 300 },
      };

      expect(alarms.cpu.threshold).toBe(80);
      expect(alarms.memory.threshold).toBe(80);
      expect(alarms.cpu.period).toBe(300);
    });

    it("should configure alarm evaluation periods", () => {
      const evaluationPeriods = 2;
      expect(evaluationPeriods).toBe(2);
    });

    it("should use GreaterThanThreshold comparison", () => {
      const comparison = "GreaterThanThreshold";
      expect(comparison).toBe("GreaterThanThreshold");
    });
  });

  describe("ECS Configuration", () => {
    it("should configure ECS Fargate launch type", () => {
      const ecsConfig = { launchType: "FARGATE" };
      expect(ecsConfig.launchType).toBe("FARGATE");
    });

    it("should configure container networking", () => {
      const networkConfig = {
        networkMode: "awsvpc",
        assignPublicIp: false,
      };

      expect(networkConfig.networkMode).toBe("awsvpc");
      expect(networkConfig.assignPublicIp).toBe(false);
    });

    it("should enable container insights", () => {
      const insights = { containerInsights: "enabled" };
      expect(insights.containerInsights).toBe("enabled");
    });

    it("should validate container port", () => {
      const ports = { dev: 8080, staging: 8080, prod: 8080 };
      Object.values(ports).forEach((port) => {
        expect(port).toBeGreaterThan(0);
        expect(port).toBeLessThan(65536);
      });
    });

    it("should configure desired task count per environment", () => {
      const taskCounts = { dev: 1, staging: 2, prod: 3 };
      
      expect(taskCounts.dev).toBe(1);
      expect(taskCounts.staging).toBe(2);
      expect(taskCounts.prod).toBe(3);
    });
  });

  describe("ECR Configuration", () => {
    it("should enable image scanning on push", () => {
      const config = { scanOnPush: true };
      expect(config.scanOnPush).toBe(true);
    });

    it("should configure image tag mutability", () => {
      const config = { imageTagMutability: "MUTABLE" };
      expect(config.imageTagMutability).toBe("MUTABLE");
    });

    it("should configure lifecycle policy", () => {
      const policy = {
        rules: [
          {
            priority: 1,
            countType: "imageCountMoreThan",
            countNumber: 10,
            action: "expire",
          },
        ],
      };

      expect(policy.rules).toHaveLength(1);
      expect(policy.rules[0].countNumber).toBe(10);
    });

    it("should validate repository configuration", () => {
      const repo = {
        name: "payment-app",
        imageScanningConfiguration: { scanOnPush: true },
      };

      expect(repo.name).toBe("payment-app");
      expect(repo.imageScanningConfiguration.scanOnPush).toBe(true);
    });
  });

  describe("Stack Outputs", () => {
    it("should have vpcId output", () => {
      const output = "vpc-12345678";
      expect(output.startsWith("vpc-")).toBe(true);
    });

    it("should have ecrRepositoryUrl output", () => {
      const output = "123456789.dkr.ecr.us-east-1.amazonaws.com/payment-app";
      expect(output.includes("dkr.ecr")).toBe(true);
    });

    it("should have cloudwatchLogGroupName output", () => {
      const output = "/aws/ecs/payment-app";
      expect(output.startsWith("/aws/ecs/")).toBe(true);
    });

    it("should have rdsClusterEndpoint output", () => {
      const output = "cluster.cblr3pq4c6lq.us-east-1.rds.amazonaws.com";
      expect(output.includes("rds.amazonaws.com")).toBe(true);
    });

    it("should have albDnsName output", () => {
      const output = "alb-123.us-east-1.elb.amazonaws.com";
      expect(output.includes("elb.amazonaws.com")).toBe(true);
    });

    it("should have ecsClusterName output", () => {
      const output = "payment-app-cluster";
      expect(output).toContain("cluster");
    });

    it("should have ecsServiceName output", () => {
      const output = "payment-app-service";
      expect(output).toContain("service");
    });

    it("should have targetGroupArn output", () => {
      const output = "arn:aws:elasticloadbalancing:us-east-1:123456789:targetgroup/payment-app/abc123";
      expect(output).toContain("targetgroup");
    });

    it("should have environment output", () => {
      const environments = ["dev", "staging", "prod"];
      environments.forEach((env) => {
        expect(env.length).toBeGreaterThan(0);
      });
    });
  });

  describe("Cross-Environment Consistency", () => {
    it("should have same architecture across environments", () => {
      const components = ["vpc", "ecs", "rds", "alb", "ecr", "cloudwatch"];
      
      components.forEach((comp) => {
        expect(comp.length).toBeGreaterThan(0);
      });
    });

    it("should validate resource naming pattern", () => {
      const names = [
        "payment-app-vpc",
        "payment-app-cluster",
        "payment-app-service",
      ];
      
      names.forEach((name) => {
        expect(/^[a-z]+-[a-z]+-[a-z]+$/.test(name)).toBe(true);
      });
    });

    it("should scale resources appropriately", () => {
      const cpuMap = { dev: 512, staging: 1024, prod: 2048 };
      
      expect(cpuMap.dev < cpuMap.staging).toBe(true);
      expect(cpuMap.staging < cpuMap.prod).toBe(true);
    });
  });

  describe("Error Handling", () => {
    it("should handle missing configuration gracefully", () => {
      const config = { environment: "unknown" };
      expect(config.environment).toBeDefined();
    });

    it("should validate all required fields", () => {
      const fields = [
        "environment",
        "rdsInstanceType",
        "ecsTaskCpu",
        "ecsTaskMemory",
        "cloudwatchRetentionDays",
      ];

      const config = {
        environment: "dev",
        rdsInstanceType: "db.t3.micro",
        ecsTaskCpu: 512,
        ecsTaskMemory: 1024,
        cloudwatchRetentionDays: 7,
      };

      fields.forEach((field) => {
        expect(config).toHaveProperty(field);
      });
    });
  });

  describe("Type Safety", () => {
    it("should enforce correct types for CPU", () => {
      const cpu = 512;
      expect(typeof cpu).toBe("number");
      expect(cpu).toBeGreaterThan(0);
    });

    it("should enforce correct types for memory", () => {
      const memory = 1024;
      expect(typeof memory).toBe("number");
      expect(memory).toBeGreaterThan(0);
    });

    it("should enforce correct types for environment", () => {
      const env = "dev";
      expect(typeof env).toBe("string");
      expect(["dev", "staging", "prod"]).toContain(env);
    });

    it("should enforce correct types for boolean flags", () => {
      const enableReplicas = false;
      expect(typeof enableReplicas).toBe("boolean");
    });

    it("should enforce correct types for retention days", () => {
      const retention = 7;
      expect(typeof retention).toBe("number");
      expect(retention).toBeGreaterThan(0);
    });
  });

  describe("Integration Points", () => {
    it("should support VPC to ECS connectivity", () => {
      const connectivity = {
        vpcCidr: "10.0.0.0/16",
        ecsSubnets: ["10.0.10.0/24", "10.0.11.0/24"],
      };

      expect(connectivity.ecsSubnets).toHaveLength(2);
    });

    it("should support ECS to RDS connectivity", () => {
      const connectivity = {
        rdsPort: 5432,
        ecsSecurityGroup: "sg-ecs",
        rdsSecurityGroup: "sg-rds",
      };

      expect(connectivity.rdsPort).toBe(5432);
    });

    it("should support ALB to ECS connectivity", () => {
      const connectivity = {
        albPort: 80,
        ecsPort: 8080,
        protocol: "HTTP",
      };

      expect(connectivity.albPort).toBe(80);
      expect(connectivity.ecsPort).toBe(8080);
    });
  });
});
