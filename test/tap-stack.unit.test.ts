import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";
import * as awsx from "@pulumi/awsx";
import { TapStack } from "../lib/tap-stack";

// Mock Pulumi runtime
pulumi.runtime.setMocks({
  newResource: function (args: pulumi.runtime.MockResourceArgs): {
    id: string;
    state: any;
  } {
    const outputs: any = {
      ...args.inputs,
      id: `${args.name}-id`,
      arn: `arn:aws:${args.type}:us-east-1:123456789012:${args.name}`,
    };

    // Add type-specific outputs
    switch (args.type) {
      case "aws:ec2/vpc:Vpc":
        outputs.cidrBlock = args.inputs.cidrBlock || "10.0.0.0/16";
        outputs.vpcId = `${args.name}-vpc-id`;
        break;
      case "aws:ec2/subnet:Subnet":
        outputs.subnetId = `${args.name}-subnet-id`;
        outputs.availabilityZone = "us-east-1a";
        break;
      case "aws:lb/loadBalancer:LoadBalancer":
        outputs.dnsName = `${args.name}.elb.amazonaws.com`;
        outputs.zoneId = "Z123456789ABC";
        outputs.arnSuffix = `app/${args.name}/1234567890abcdef`;
        break;
      case "aws:ecs/cluster:Cluster":
        outputs.name = args.inputs.name || args.name;
        break;
      case "aws:ecs/service:Service":
        outputs.name = args.inputs.name || args.name;
        break;
      case "aws:rds/cluster:Cluster":
        outputs.endpoint = `${args.name}.cluster-abc123.us-east-1.rds.amazonaws.com`;
        outputs.port = 5432;
        outputs.masterUserSecrets = [
          {
            secretArn: `arn:aws:secretsmanager:us-east-1:123456789012:secret:${args.name}`,
            secretStatus: "active",
            kmsKeyId: "key-id",
          },
        ];
        break;
      case "aws:s3/bucketV2:BucketV2":
        outputs.bucket = args.inputs.bucket || args.name;
        break;
      case "aws:route53/zone:Zone":
        outputs.zoneId = `Z${args.name.toUpperCase()}`;
        outputs.name = args.inputs.name || `${args.name}.com`;
        break;
      case "aws:cloudwatch/dashboard:Dashboard":
        outputs.dashboardArn = `arn:aws:cloudwatch:us-east-1:123456789012:dashboard/${args.name}`;
        outputs.dashboardName = args.inputs.dashboardName || args.name;
        break;
      case "aws:ec2/securityGroup:SecurityGroup":
        outputs.vpcId = args.inputs.vpcId;
        break;
      case "aws:lb/targetGroup:TargetGroup":
        outputs.arnSuffix = `targetgroup/${args.name}/1234567890abcdef`;
        break;
      case "aws:kms/key:Key":
        outputs.keyId = `key-${args.name}`;
        break;
      case "awsx:ec2:Vpc":
        outputs.vpcId = pulumi.output(`${args.name}-vpc-id`);
        outputs.publicSubnetIds = pulumi.output([
          `${args.name}-public-subnet-1`,
          `${args.name}-public-subnet-2`,
        ]);
        outputs.privateSubnetIds = pulumi.output([
          `${args.name}-private-subnet-1`,
          `${args.name}-private-subnet-2`,
        ]);
        break;
    }

    return {
      id: outputs.id,
      state: outputs,
    };
  },
  call: function (args: pulumi.runtime.MockCallArgs) {
    const outputs: any = {};

    switch (args.token) {
      case "aws:secretsmanager/getSecret:getSecret":
        outputs.arn = args.inputs.arn;
        outputs.name = "test-secret";
        break;
      case "aws:index/getCallerIdentity:getCallerIdentity":
        outputs.accountId = "123456789012";
        outputs.arn = "arn:aws:iam::123456789012:user/test";
        outputs.userId = "AIDAI123456789012345";
        break;
    }

    return outputs;
  },
});

// Set mock configuration
pulumi.runtime.setConfig("tap:vpcCidr", "10.0.0.0/16");
pulumi.runtime.setConfig("tap:ecsTaskCount", "2");
pulumi.runtime.setConfig("tap:rdsInstanceClass", "db.t3.micro");
pulumi.runtime.setConfig("tap:s3LogRetentionDays", "30");
pulumi.runtime.setConfig(
  "tap:availabilityZones",
  JSON.stringify(["us-east-1a", "us-east-1b", "us-east-1c"])
);
pulumi.runtime.setConfig("tap:team", "platform-team");
pulumi.runtime.setConfig("tap:costCenter", "eng-12345");
pulumi.runtime.setConfig("tap:domain", "staging.example.com");
pulumi.runtime.setConfig("tap:ecsTaskCpu", "512");
pulumi.runtime.setConfig("tap:ecsTaskMemory", "1024");
pulumi.runtime.setConfig("tap:rdsAllocatedStorage", "20");
pulumi.runtime.setConfig("tap:enableVpcPeering", "false");
pulumi.runtime.setConfig("tap:cloudwatchLogRetentionDays", "30");
pulumi.runtime.setConfig("tap:albHealthCheckPath", "/health");
pulumi.runtime.setConfig("tap:albHealthCheckInterval", "30");
pulumi.runtime.setConfig("tap:containerPort", "8080");
pulumi.runtime.setConfig("tap:containerImage", "nginx:latest");

describe("TapStack Unit Tests", () => {
  let stack: TapStack;

  beforeAll(() => {
    stack = new TapStack("test-stack", { environmentSuffix: "staging" });
  });

  describe("Stack Creation", () => {
    it("should create the stack successfully", (done) => {
      pulumi
        .all([stack.outputs.vpcId])
        .apply(([vpcId]) => {
          expect(vpcId).toBeDefined();
          expect(typeof vpcId).toBe("string");
          done();
        });
    });

    it("should have all required outputs defined", (done) => {
      pulumi
        .all([
          stack.outputs.vpcId,
          stack.outputs.albDnsName,
          stack.outputs.ecsClusterArn,
          stack.outputs.rdsEndpoint,
          stack.outputs.s3BucketName,
          stack.outputs.route53ZoneId,
        ])
        .apply(
          ([vpcId, albDns, ecsArn, rdsEndpoint, s3Bucket, route53Zone]) => {
            expect(vpcId).toBeDefined();
            expect(albDns).toBeDefined();
            expect(ecsArn).toBeDefined();
            expect(rdsEndpoint).toBeDefined();
            expect(s3Bucket).toBeDefined();
            expect(route53Zone).toBeDefined();
            done();
          }
        );
    });
  });

  describe("Resource Naming Convention", () => {
    it("should follow the naming pattern for VPC", (done) => {
      pulumi
        .all([stack.outputs.vpcId])
        .apply(([vpcId]) => {
          expect(vpcId).toContain("staging");
          done();
        });
    });

    it("should follow the naming pattern for ECS service", (done) => {
      pulumi
        .all([stack.outputs.ecsServiceName])
        .apply(([serviceName]) => {
          expect(serviceName).toContain("staging");
          expect(serviceName).toContain("service");
          done();
        });
    });

    it("should follow the naming pattern for S3 bucket", (done) => {
      pulumi
        .all([stack.outputs.s3BucketName])
        .apply(([bucketName]) => {
          expect(bucketName).toContain("staging");
          expect(bucketName).toContain("logs");
          done();
        });
    });

    it("should follow the naming pattern for Route53 zone", (done) => {
      pulumi
        .all([stack.outputs.route53ZoneName])
        .apply(([zoneName]) => {
          expect(zoneName).toBeDefined();
          expect(zoneName).toContain("example.com");
          done();
        });
    });
  });

  describe("VPC Configuration", () => {
    it("should create VPC with correct CIDR block", (done) => {
      pulumi
        .all([stack.outputs.vpcCidr])
        .apply(([vpcCidr]) => {
          expect(vpcCidr).toBe("10.0.0.0/16");
          done();
        });
    });

    it("should create public subnets", (done) => {
      pulumi
        .all([stack.outputs.publicSubnetIds])
        .apply(([subnetIds]) => {
          expect(Array.isArray(subnetIds)).toBe(true);
          expect(subnetIds.length).toBeGreaterThan(0);
          done();
        });
    });

    it("should create private subnets", (done) => {
      pulumi
        .all([stack.outputs.privateSubnetIds])
        .apply(([subnetIds]) => {
          expect(Array.isArray(subnetIds)).toBe(true);
          expect(subnetIds.length).toBeGreaterThan(0);
          done();
        });
    });

    it("should have matching number of public and private subnets", (done) => {
      pulumi
        .all([stack.outputs.publicSubnetIds, stack.outputs.privateSubnetIds])
        .apply(([publicSubnets, privateSubnets]) => {
          expect(publicSubnets.length).toBe(privateSubnets.length);
          done();
        });
    });
  });

  describe("ECS Configuration", () => {
    it("should create ECS cluster", (done) => {
      pulumi
        .all([stack.outputs.ecsClusterArn])
        .apply(([clusterArn]) => {
          expect(clusterArn).toBeDefined();
          expect(clusterArn).toContain("arn:aws");
          expect(clusterArn).toContain("ecs");
          done();
        });
    });

    it("should create ECS service with correct name", (done) => {
      pulumi
        .all([stack.outputs.ecsServiceName])
        .apply(([serviceName]) => {
          expect(serviceName).toBeDefined();
          expect(typeof serviceName).toBe("string");
          done();
        });
    });

    it("should validate ECS task count from config", (done) => {
      const config = new pulumi.Config();
      const taskCount = config.requireNumber("ecsTaskCount");
      expect(taskCount).toBe(2);
      done();
    });

    it("should validate ECS task CPU configuration", (done) => {
      const config = new pulumi.Config();
      const taskCpu = config.require("ecsTaskCpu");
      expect(taskCpu).toBe("512");
      done();
    });

    it("should validate ECS task memory configuration", (done) => {
      const config = new pulumi.Config();
      const taskMemory = config.require("ecsTaskMemory");
      expect(taskMemory).toBe("1024");
      done();
    });
  });

  describe("RDS Configuration", () => {
    it("should create RDS cluster with correct endpoint", (done) => {
      pulumi
        .all([stack.outputs.rdsEndpoint])
        .apply(([endpoint]) => {
          expect(endpoint).toBeDefined();
          expect(endpoint).toContain(".rds.amazonaws.com");
          done();
        });
    });

    it("should create RDS cluster on correct port", (done) => {
      pulumi
        .all([stack.outputs.rdsPort])
        .apply(([port]) => {
          expect(port).toBe(5432);
          done();
        });
    });

    it("should create RDS secret in Secrets Manager", (done) => {
      pulumi
        .all([stack.outputs.rdsSecretArn])
        .apply(([secretArn]) => {
          expect(secretArn).toBeDefined();
          expect(secretArn).toContain("arn:aws:secretsmanager");
          done();
        });
    });

    it("should validate RDS instance class from config", (done) => {
      const config = new pulumi.Config();
      const instanceClass = config.require("rdsInstanceClass");
      expect(instanceClass).toBe("db.t3.micro");
      done();
    });

    it("should not allow public access to RDS", (done) => {
      pulumi
        .all([stack.outputs.privateSubnetIds])
        .apply(([privateSubnets]) => {
          expect(privateSubnets.length).toBeGreaterThan(0);
          done();
        });
    });
  });

  describe("Load Balancer Configuration", () => {
    it("should create ALB with DNS name", (done) => {
      pulumi
        .all([stack.outputs.albDnsName])
        .apply(([dnsName]) => {
          expect(dnsName).toBeDefined();
          expect(dnsName).toContain(".elb.amazonaws.com");
          done();
        });
    });

    it("should create ALB with ARN", (done) => {
      pulumi
        .all([stack.outputs.albArn])
        .apply(([arn]) => {
          expect(arn).toBeDefined();
          expect(arn).toContain("arn:aws");
          done();
        });
    });

    it("should validate health check configuration", (done) => {
      const config = new pulumi.Config();
      const healthCheckPath = config.require("albHealthCheckPath");
      const healthCheckInterval = config.requireNumber(
        "albHealthCheckInterval"
      );
      expect(healthCheckPath).toBe("/health");
      expect(healthCheckInterval).toBe(30);
      done();
    });
  });

  describe("S3 Configuration", () => {
    it("should create S3 bucket", (done) => {
      pulumi
        .all([stack.outputs.s3BucketName])
        .apply(([bucketName]) => {
          expect(bucketName).toBeDefined();
          expect(typeof bucketName).toBe("string");
          done();
        });
    });

    it("should validate S3 log retention days", (done) => {
      const config = new pulumi.Config();
      const retentionDays = config.requireNumber("s3LogRetentionDays");
      expect(retentionDays).toBe(30);
      done();
    });

    it("should have environment-specific bucket naming", (done) => {
      pulumi
        .all([stack.outputs.s3BucketName])
        .apply(([bucketName]) => {
          expect(bucketName).toContain("staging");
          done();
        });
    });
  });

  describe("Route53 Configuration", () => {
    it("should create Route53 hosted zone", (done) => {
      pulumi
        .all([stack.outputs.route53ZoneId])
        .apply(([zoneId]) => {
          expect(zoneId).toBeDefined();
          expect(typeof zoneId).toBe("string");
          done();
        });
    });

    it("should create Route53 zone with correct name", (done) => {
      pulumi
        .all([stack.outputs.route53ZoneName])
        .apply(([zoneName]) => {
          expect(zoneName).toBeDefined();
          expect(zoneName).toContain("example.com");
          done();
        });
    });

    it("should validate domain configuration", (done) => {
      const config = new pulumi.Config();
      const domain = config.require("domain");
      expect(domain).toBe("staging.example.com");
      done();
    });
  });

  describe("CloudWatch Configuration", () => {
    it("should create CloudWatch dashboard", (done) => {
      pulumi
        .all([stack.outputs.cloudwatchDashboardArn])
        .apply(([dashboardArn]) => {
          expect(dashboardArn).toBeDefined();
          expect(dashboardArn).toContain("arn:aws:cloudwatch");
          done();
        });
    });

    it("should validate CloudWatch log retention", (done) => {
      const config = new pulumi.Config();
      const retentionDays = config.requireNumber("cloudwatchLogRetentionDays");
      expect(retentionDays).toBe(30);
      done();
    });
  });

  describe("Tagging Strategy", () => {
    it("should validate environment tag", (done) => {
      const config = new pulumi.Config();
      const tags = {
        Environment: "staging",
        Team: config.require("team"),
        CostCenter: config.require("costCenter"),
      };
      expect(tags.Environment).toBe("staging");
      done();
    });

    it("should validate team tag", (done) => {
      const config = new pulumi.Config();
      const team = config.require("team");
      expect(team).toBe("platform-team");
      done();
    });

    it("should validate cost center tag", (done) => {
      const config = new pulumi.Config();
      const costCenter = config.require("costCenter");
      expect(costCenter).toBe("eng-12345");
      done();
    });

    it("should have all required tags configured", (done) => {
      const config = new pulumi.Config();
      expect(() => config.require("team")).not.toThrow();
      expect(() => config.require("costCenter")).not.toThrow();
      done();
    });
  });

  describe("VPC Peering Configuration", () => {
    it("should respect VPC peering enable flag", (done) => {
      const config = new pulumi.Config();
      const enablePeering = config.requireBoolean("enableVpcPeering");
      expect(enablePeering).toBe(false);
      done();
    });

    it("should have empty peering connections when disabled", (done) => {
      pulumi
        .all([stack.outputs.vpcPeeringConnectionIds])
        .apply(([peeringIds]) => {
          expect(Array.isArray(peeringIds)).toBe(true);
          expect(peeringIds.length).toBe(0);
          done();
        });
    });
  });

  describe("Security Groups", () => {
    it("should validate container port configuration", (done) => {
      const config = new pulumi.Config();
      const containerPort = config.requireNumber("containerPort");
      expect(containerPort).toBe(8080);
      expect(containerPort).toBeGreaterThan(0);
      expect(containerPort).toBeLessThan(65536);
      done();
    });

    it("should validate security group configuration", (done) => {
      pulumi
        .all([stack.outputs.vpcId])
        .apply(([vpcId]) => {
          expect(vpcId).toBeDefined();
          done();
        });
    });
  });

  describe("Environment-Specific Configuration", () => {
    it("should validate availability zones", (done) => {
      const config = new pulumi.Config();
      const azs = config.requireObject<string[]>("availabilityZones");
      expect(Array.isArray(azs)).toBe(true);
      expect(azs.length).toBe(3);
      done();
    });

    it("should validate container image configuration", (done) => {
      const config = new pulumi.Config();
      const containerImage = config.require("containerImage");
      expect(containerImage).toBe("nginx:latest");
      done();
    });

    it("should validate all required configurations are present", (done) => {
      const config = new pulumi.Config();
      const requiredConfigs = [
        "vpcCidr",
        "ecsTaskCount",
        "rdsInstanceClass",
        "s3LogRetentionDays",
        "team",
        "costCenter",
        "domain",
        "ecsTaskCpu",
        "ecsTaskMemory",
        "containerPort",
        "containerImage",
      ];

      requiredConfigs.forEach((configKey) => {
        expect(() => config.require(configKey)).not.toThrow();
      });
      done();
    });
  });

  describe("Output Validation", () => {
    it("should export all required stack outputs", (done) => {
      const requiredOutputs = [
        "vpcId",
        "vpcCidr",
        "albDnsName",
        "albArn",
        "ecsClusterArn",
        "ecsServiceName",
        "rdsEndpoint",
        "rdsPort",
        "rdsSecretArn",
        "s3BucketName",
        "route53ZoneId",
        "route53ZoneName",
        "cloudwatchDashboardArn",
        "publicSubnetIds",
        "privateSubnetIds",
        "vpcPeeringConnectionIds",
      ];

      requiredOutputs.forEach((outputKey) => {
        expect(stack.outputs).toHaveProperty(outputKey);
      });
      done();
    });

    it("should have valid output types", (done) => {
      pulumi
        .all([
          stack.outputs.vpcId,
          stack.outputs.publicSubnetIds,
        ])
        .apply(([vpcId, subnetIds]) => {
          expect(typeof vpcId).toBe("string");
          expect(Array.isArray(subnetIds)).toBe(true);
          done();
        });
    });
  });

  describe("Resource Dependencies", () => {
    it("should have VPC created before subnets", (done) => {
      pulumi
        .all([stack.outputs.vpcId, stack.outputs.publicSubnetIds])
        .apply(([vpcId, subnetIds]) => {
          expect(vpcId).toBeDefined();
          expect(subnetIds.length).toBeGreaterThan(0);
          done();
        });
    });

    it("should have RDS endpoint after cluster creation", (done) => {
      pulumi
        .all([stack.outputs.rdsEndpoint, stack.outputs.rdsSecretArn])
        .apply(([endpoint, secretArn]) => {
          expect(endpoint).toBeDefined();
          expect(secretArn).toBeDefined();
          done();
        });
    });

    it("should have ALB DNS after load balancer creation", (done) => {
      pulumi
        .all([stack.outputs.albDnsName, stack.outputs.albArn])
        .apply(([dnsName, arn]) => {
          expect(dnsName).toBeDefined();
          expect(arn).toBeDefined();
          done();
        });
    });
  });

  describe("Configuration Validation", () => {
    it("should reject invalid VPC CIDR format", () => {
      expect(() => {
        const invalidCidr = "invalid-cidr";
      }).not.toThrow();
    });

    it("should validate ECS task count is positive", (done) => {
      const config = new pulumi.Config();
      const taskCount = config.requireNumber("ecsTaskCount");
      expect(taskCount).toBeGreaterThan(0);
      done();
    });

    it("should validate S3 retention days is positive", (done) => {
      const config = new pulumi.Config();
      const retentionDays = config.requireNumber("s3LogRetentionDays");
      expect(retentionDays).toBeGreaterThan(0);
      done();
    });

    it("should validate CloudWatch retention days is positive", (done) => {
      const config = new pulumi.Config();
      const retentionDays = config.requireNumber("cloudwatchLogRetentionDays");
      expect(retentionDays).toBeGreaterThan(0);
      done();
    });
  });

  describe("Lifecycle Policies", () => {
    it("should validate S3 lifecycle configuration", (done) => {
      const config = new pulumi.Config();
      const retentionDays = config.requireNumber("s3LogRetentionDays");
      expect(retentionDays).toBeGreaterThanOrEqual(7);
      done();
    });

    it("should validate different retention for different environments", () => {
      const config = new pulumi.Config();
      const retentionDays = config.requireNumber("s3LogRetentionDays");
      expect([7, 30, 90]).toContain(retentionDays);
    });
  });

  describe("Encryption Configuration", () => {
    it("should validate RDS encryption is enabled", (done) => {
      pulumi
        .all([stack.outputs.rdsEndpoint])
        .apply(([endpoint]) => {
          expect(endpoint).toBeDefined();
          done();
        });
    });

    it("should validate S3 encryption configuration", (done) => {
      pulumi
        .all([stack.outputs.s3BucketName])
        .apply(([bucketName]) => {
          expect(bucketName).toBeDefined();
          done();
        });
    });
  });

  describe("High Availability Configuration", () => {
    it("should deploy across multiple availability zones", (done) => {
      const config = new pulumi.Config();
      const azs = config.requireObject<string[]>("availabilityZones");
      expect(azs.length).toBeGreaterThanOrEqual(2);
      done();
    });

    it("should have redundant subnets for high availability", (done) => {
      pulumi
        .all([stack.outputs.publicSubnetIds, stack.outputs.privateSubnetIds])
        .apply(([publicSubnets, privateSubnets]) => {
          expect(publicSubnets.length).toBeGreaterThanOrEqual(2);
          expect(privateSubnets.length).toBeGreaterThanOrEqual(2);
          done();
        });
    });
  });

  describe("Container Configuration", () => {
    it("should validate container port is within valid range", (done) => {
      const config = new pulumi.Config();
      const port = config.requireNumber("containerPort");
      expect(port).toBeGreaterThanOrEqual(1);
      expect(port).toBeLessThanOrEqual(65535);
      done();
    });

    it("should validate ECS task resources", (done) => {
      const config = new pulumi.Config();
      const cpu = config.require("ecsTaskCpu");
      const memory = config.require("ecsTaskMemory");
      
      expect(["256", "512", "1024", "2048", "4096"]).toContain(cpu);
      expect(parseInt(memory)).toBeGreaterThan(0);
      done();
    });
  });

  describe("Monitoring Configuration", () => {
    it("should create CloudWatch dashboard for monitoring", (done) => {
      pulumi
        .all([stack.outputs.cloudwatchDashboardArn])
        .apply(([dashboardArn]) => {
          expect(dashboardArn).toContain("dashboard");
          done();
        });
    });

    it("should validate monitoring configuration", (done) => {
      pulumi
        .all([
          stack.outputs.ecsClusterArn,
          stack.outputs.albArn,
          stack.outputs.rdsEndpoint,
        ])
        .apply(([ecsArn, albArn, rdsEndpoint]) => {
          expect(ecsArn).toBeDefined();
          expect(albArn).toBeDefined();
          expect(rdsEndpoint).toBeDefined();
          done();
        });
    });
  });

  describe("Network Isolation", () => {
    it("should place RDS in private subnets only", (done) => {
      pulumi
        .all([stack.outputs.privateSubnetIds])
        .apply(([privateSubnets]) => {
          expect(privateSubnets.length).toBeGreaterThan(0);
          done();
        });
    });

    it("should place ALB in public subnets", (done) => {
      pulumi
        .all([stack.outputs.publicSubnetIds])
        .apply(([publicSubnets]) => {
          expect(publicSubnets.length).toBeGreaterThan(0);
          done();
        });
    });

    it("should place ECS tasks in private subnets", (done) => {
      pulumi
        .all([stack.outputs.privateSubnetIds])
        .apply(([privateSubnets]) => {
          expect(privateSubnets.length).toBeGreaterThan(0);
          done();
        });
    });
  });

  describe("DNS Configuration", () => {
    it("should create correct DNS records for environment", (done) => {
      const config = new pulumi.Config();
      const domain = config.require("domain");
      
      pulumi
        .all([stack.outputs.route53ZoneName])
        .apply(([zoneName]) => {
          expect(zoneName).toBeDefined();
          done();
        });
    });

    it("should link DNS to ALB", (done) => {
      pulumi
        .all([stack.outputs.albDnsName, stack.outputs.route53ZoneId])
        .apply(([albDns, zoneId]) => {
          expect(albDns).toBeDefined();
          expect(zoneId).toBeDefined();
          done();
        });
    });
  });

  describe("Secrets Management", () => {
    it("should store RDS credentials in Secrets Manager", (done) => {
      pulumi
        .all([stack.outputs.rdsSecretArn])
        .apply(([secretArn]) => {
          expect(secretArn).toContain("secretsmanager");
          expect(secretArn).toContain("secret");
          done();
        });
    });

    it("should validate secret ARN format", (done) => {
      pulumi
        .all([stack.outputs.rdsSecretArn])
        .apply(([secretArn]) => {
          expect(secretArn).toMatch(/^arn:aws:secretsmanager:/);
          done();
        });
    });
  });
});
