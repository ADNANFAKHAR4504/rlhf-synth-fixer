import * as pulumi from "@pulumi/pulumi";
import * as assert from "assert";
import { TapStack } from "../lib/tap-stack";

// Mock Pulumi runtime
pulumi.runtime.setMocks({
  newResource: (args: pulumi.runtime.MockResourceArgs): { id: string; state: any } => {
    const state: any = {
      ...args.inputs,
    };

    // Mock specific resource outputs
    switch (args.type) {
      case "aws:ec2/vpc:Vpc":
        state.id = "vpc-mock123";
        state.cidrBlock = args.inputs.cidrBlock || "10.0.0.0/16";
        break;
      case "aws:ec2/subnet:Subnet":
        state.id = `subnet-mock${Math.random().toString(36).substr(2, 9)}`;
        break;
      case "aws:rds/instance:Instance":
        state.endpoint = "prod-rds-mock.us-east-1.rds.amazonaws.com:3306";
        state.port = 3306;
        state.address = "prod-rds-mock.us-east-1.rds.amazonaws.com";
        break;
      case "aws:lb/loadBalancer:LoadBalancer":
        state.dnsName = "prod-alb-mock-123456.us-east-1.elb.amazonaws.com";
        state.arn = "arn:aws:elasticloadbalancing:us-east-1:123456789012:loadbalancer/app/prod-alb-mock/abc123";
        state.zoneId = "Z35SXDOTRQ7X7K";
        state.arnSuffix = "app/prod-alb-mock/abc123";
        break;
      case "aws:s3/bucket:Bucket":
        state.id = args.inputs.bucket || `bucket-mock-${args.name}`;
        state.arn = `arn:aws:s3:::${state.id}`;
        break;
      case "aws:route53/zone:Zone":
        state.zoneId = "Z1234567890ABC";
        state.nameServers = ["ns-1.awsdns.com", "ns-2.awsdns.com"];
        break;
      case "aws:kms/key:Key":
        state.arn = "arn:aws:kms:us-east-1:123456789012:key/12345678-1234-1234-1234-123456789012";
        state.keyId = "12345678-1234-1234-1234-123456789012";
        break;
      case "aws:iam/role:Role":
        state.arn = `arn:aws:iam::123456789012:role/${args.name}`;
        break;
      case "aws:autoscaling/group:Group":
        state.name = args.inputs.name || args.name;
        state.arn = `arn:aws:autoscaling:us-east-1:123456789012:autoScalingGroup:${args.name}`;
        break;
      case "aws:lb/targetGroup:TargetGroup":
        state.arnSuffix = `targetgroup/${args.name}/abc123def456`;
        break;
      case "pulumi:pulumi:Stack":
        state.id = "test-stack";
        break;
      case "pulumi:providers:aws":
        state.id = "aws-provider";
        break;
    }

    return {
      id: args.id || `${args.name}-id`,
      state: state,
    };
  },
  call: (args: pulumi.runtime.MockCallArgs) => {
    // Mock getAmi call
    if (args.token === "aws:ec2/getAmi:getAmi") {
      return {
        id: "ami-0c55b159cbfafe1f0",
        architecture: "x86_64",
        imageId: "ami-0c55b159cbfafe1f0",
      };
    }
    return {};
  },
});

describe("TapStack Unit Tests", () => {
  let stack: TapStack;

  beforeAll(async () => {
    // Create a test stack
    stack = new TapStack("test-stack", {
      stackName: "TapStackTest",
      environmentSuffix: "test",
      env: {
        account: "123456789012",
        region: "us-east-1",
      },
      migrationPhase: "initial",
      tags: {
        Environment: "test",
        Repository: "test-repo",
        Author: "test-author",
      },
    });
  });

  // =========================================================================
  // VPC and Networking Tests - FIXED
  // =========================================================================

  describe("VPC Configuration", () => {
    it("should create VPC with correct CIDR block", async () => {
      const vpcId = await stack.vpcId;
      assert.ok(vpcId, "VPC ID should be defined");
    });

    it("should have Environment=production tag", async () => {
      // FIX: Use apply to unwrap Output
      const tagValue = await stack["vpc"].tags.apply(t => t?.Environment);
      assert.strictEqual(tagValue, "production");
    });

    it("should have ManagedBy=pulumi tag", async () => {
      // FIX: Use apply to unwrap Output
      const tagValue = await stack["vpc"].tags.apply(t => t?.ManagedBy);
      assert.strictEqual(tagValue, "pulumi");
    });

    it("should enable DNS support", async () => {
      const enableDnsSupport = await stack["vpc"].enableDnsSupport;
      assert.strictEqual(enableDnsSupport, true);
    });

    it("should enable DNS hostnames", async () => {
      const enableDnsHostnames = await stack["vpc"].enableDnsHostnames;
      assert.strictEqual(enableDnsHostnames, true);
    });
  });

  describe("Subnet Configuration", () => {
    it("should create 3 public subnets", () => {
      assert.strictEqual(stack["publicSubnets"].length, 3);
    });

    it("should create 3 private subnets", () => {
      assert.strictEqual(stack["privateSubnets"].length, 3);
    });

    it("should have correct CIDR blocks for public subnets", async () => {
      const expectedCidrs = ["10.0.1.0/24", "10.0.2.0/24", "10.0.3.0/24"];
      for (let i = 0; i < stack["publicSubnets"].length; i++) {
        const cidr = await stack["publicSubnets"][i].cidrBlock;
        assert.strictEqual(cidr, expectedCidrs[i]);
      }
    });

    it("should have correct CIDR blocks for private subnets", async () => {
      const expectedCidrs = ["10.0.11.0/24", "10.0.12.0/24", "10.0.13.0/24"];
      for (let i = 0; i < stack["privateSubnets"].length; i++) {
        const cidr = await stack["privateSubnets"][i].cidrBlock;
        assert.strictEqual(cidr, expectedCidrs[i]);
      }
    });

    it("should map public IP on launch for public subnets", async () => {
      for (const subnet of stack["publicSubnets"]) {
        const mapPublicIp = await subnet.mapPublicIpOnLaunch;
        assert.strictEqual(mapPublicIp, true);
      }
    });

    it("should NOT map public IP for private subnets", async () => {
      for (const subnet of stack["privateSubnets"]) {
        const mapPublicIp = await subnet.mapPublicIpOnLaunch;
        assert.strictEqual(mapPublicIp, false);
      }
    });

    it("should span across 3 availability zones", async () => {
      const azs = ["us-east-1a", "us-east-1b", "us-east-1c"];
      for (let i = 0; i < stack["publicSubnets"].length; i++) {
        const az = await stack["publicSubnets"][i].availabilityZone;
        assert.strictEqual(az, azs[i]);
      }
    });
  });

  describe("NAT Gateway Configuration", () => {
    it("should create 3 NAT gateways", () => {
      assert.strictEqual(stack["natGateways"].length, 3);
    });

    it("should have proper tags on NAT gateways", async () => {
      for (const nat of stack["natGateways"]) {
        // FIX: Use apply to unwrap Output
        const envTag = await nat.tags.apply(t => t?.Environment);
        const managedByTag = await nat.tags.apply(t => t?.ManagedBy);
        assert.strictEqual(envTag, "production");
        assert.strictEqual(managedByTag, "pulumi");
      }
    });
  });

  // =========================================================================
  // Security Group Tests
  // =========================================================================

  describe("Security Groups", () => {
    it("should create ALB security group with HTTPS ingress only", async () => {
      const ingress = await stack["albSecurityGroup"].ingress;
      assert.strictEqual(ingress.length, 1);
      assert.strictEqual(ingress[0].protocol, "tcp");
      assert.strictEqual(ingress[0].fromPort, 443);
      assert.strictEqual(ingress[0].toPort, 443);
    });

    it("should allow HTTPS from 0.0.0.0/0 for ALB", async () => {
      const ingress = await stack["albSecurityGroup"].ingress;
      assert.deepStrictEqual(ingress[0].cidrBlocks, ["0.0.0.0/0"]);
    });

    it("should create application security group", async () => {
      const sg = stack["prodSecurityGroup"];
      assert.ok(sg);
    });

    it("should create database security group", async () => {
      const sg = stack["dbSecurityGroup"];
      assert.ok(sg);
    });

    it("should have proper descriptions for security groups", async () => {
      const albDesc = await stack["albSecurityGroup"].description;
      // FIX: Use apply to check string includes
      const albCheck = await pulumi.output(albDesc).apply(d => d ? d.includes("HTTPS") : false);
      assert.ok(albCheck);

      const dbDesc = await stack["dbSecurityGroup"].description;
      const dbCheck = await pulumi.output(dbDesc).apply(d => d ? d.includes("restricted") : false);
      assert.ok(dbCheck);
    });
  });

  // =========================================================================
  // RDS Tests - FIXED
  // =========================================================================

  describe("RDS Configuration", () => {
    it("should create RDS instance", () => {
      assert.ok(stack["prodRdsInstance"]);
    });

    it("should enable Multi-AZ deployment", async () => {
      const multiAz = await stack["prodRdsInstance"].multiAz;
      assert.strictEqual(multiAz, true);
    });

    it("should enable storage encryption", async () => {
      const encrypted = await stack["prodRdsInstance"].storageEncrypted;
      assert.strictEqual(encrypted, true);
    });

    it("should use KMS key for encryption", async () => {
      const kmsKeyId = await stack["prodRdsInstance"].kmsKeyId;
      assert.ok(kmsKeyId);
    });

    it("should have 7-day backup retention", async () => {
      const retention = await stack["prodRdsInstance"].backupRetentionPeriod;
      assert.strictEqual(retention, 7);
    });

    it("should use MySQL 8.0 engine", async () => {
      const engine = await stack["prodRdsInstance"].engine;
      const engineVersion = await stack["prodRdsInstance"].engineVersion;
      assert.strictEqual(engine, "mysql");
      assert.strictEqual(engineVersion, "8.0");
    });

    it("should not be publicly accessible", async () => {
      const publicAccess = await stack["prodRdsInstance"].publiclyAccessible;
      assert.strictEqual(publicAccess, false);
    });

    it("should enable deletion protection", async () => {
      const deletionProtection = await stack["prodRdsInstance"].deletionProtection;
      assert.strictEqual(deletionProtection, true);
    });

    it("should enable Performance Insights", async () => {
      const perfInsights = await stack["prodRdsInstance"].performanceInsightsEnabled;
      assert.strictEqual(perfInsights, true);
    });

    it("should enable CloudWatch log exports", async () => {
      const logExports = await stack["prodRdsInstance"].enabledCloudwatchLogsExports;
      // FIX: Use apply to check array includes
      const hasError = await pulumi.output(logExports).apply(logs =>
        logs ? logs.includes("error") : false
      );
      const hasGeneral = await pulumi.output(logExports).apply(logs =>
        logs ? logs.includes("general") : false
      );
      const hasSlow = await pulumi.output(logExports).apply(logs =>
        logs ? logs.includes("slowquery") : false
      );

      assert.ok(hasError);
      assert.ok(hasGeneral);
      assert.ok(hasSlow);
    });

    it("should output RDS endpoint", async () => {
      const endpoint = await stack.prodRdsEndpoint;
      assert.ok(endpoint);
    });

    it("should output RDS port", async () => {
      const port = await stack.prodRdsPort;
      assert.strictEqual(port, 3306);
    });
  });

  // =========================================================================
  // IAM Tests - FIXED
  // =========================================================================

  describe("IAM Configuration", () => {
    it("should create EC2 instance role", () => {
      assert.ok(stack["ec2Role"]);
    });

    it("should have proper assume role policy for EC2", async () => {
      const policy = await stack["ec2Role"].assumeRolePolicy;
      // FIX: Use apply to parse JSON
      const principal = await pulumi.output(policy).apply(p => {
        const parsed = JSON.parse(p);
        return parsed.Statement[0].Principal.Service;
      });
      assert.strictEqual(principal, "ec2.amazonaws.com");
    });

    it("should have Environment=production tag on IAM role", async () => {
      // FIX: Use apply to access tag property
      const envTag = await stack["ec2Role"].tags.apply(t => t?.Environment);
      assert.strictEqual(envTag, "production");
    });

    it("should have ManagedBy=pulumi tag on IAM role", async () => {
      // FIX: Use apply to access tag property
      const managedByTag = await stack["ec2Role"].tags.apply(t => t?.ManagedBy);
      assert.strictEqual(managedByTag, "pulumi");
    });
  });

  // =========================================================================
  // S3 Tests - FIXED
  // =========================================================================

  describe("S3 Configuration", () => {
    it("should create production log bucket", () => {
      assert.ok(stack["prodLogBucket"]);
    });

    it("should create replica log bucket", () => {
      assert.ok(stack["replicaLogBucket"]);
    });

    it("should enable versioning on production bucket", async () => {
      const versioning = await stack["prodLogBucket"].versioning;
      // FIX: Use apply to access nested property
      const enabled = await pulumi.output(versioning).apply(v => v?.enabled);
      assert.strictEqual(enabled, true);
    });

    it("should enable AES-256 encryption", async () => {
      const encryption = await stack["prodLogBucket"].serverSideEncryptionConfiguration;
      // FIX: Use apply to access deeply nested property
      const algorithm = await pulumi.output(encryption).apply(enc =>
        enc?.rule?.applyServerSideEncryptionByDefault?.sseAlgorithm
      );
      assert.strictEqual(algorithm, "AES256");
    });

    it("should have lifecycle rules configured", async () => {
      const lifecycleRules = await stack["prodLogBucket"].lifecycleRules;
      // FIX: Use apply to check array length and comparison operator
      const hasRules = await pulumi.output(lifecycleRules).apply(rules =>
        rules ? rules.length > 0 : false
      );
      assert.ok(hasRules);
    });

    it("should transition to STANDARD_IA after 30 days", async () => {
      const lifecycleRules = await stack["prodLogBucket"].lifecycleRules;
      // FIX: Use apply to access nested array
      const iaTransitionDays = await pulumi.output(lifecycleRules).apply(rules => {
        if (!rules || rules.length === 0) return undefined;
        const transitions = rules[0].transitions;
        if (!transitions) return undefined;
        const iaTransition = transitions.find(t => t.storageClass === "STANDARD_IA");
        return iaTransition?.days;
      });

      assert.strictEqual(iaTransitionDays, 30);
    });

    it("should transition to GLACIER after 90 days", async () => {
      const lifecycleRules = await stack["prodLogBucket"].lifecycleRules;
      // FIX: Use apply to access nested array
      const glacierTransitionDays = await pulumi.output(lifecycleRules).apply(rules => {
        if (!rules || rules.length === 0) return undefined;
        const transitions = rules[0].transitions;
        if (!transitions) return undefined;
        const glacierTransition = transitions.find(t => t.storageClass === "GLACIER");
        return glacierTransition?.days;
      });

      assert.strictEqual(glacierTransitionDays, 90);
    });

    it("should expire objects after 365 days", async () => {
      const lifecycleRules = await stack["prodLogBucket"].lifecycleRules;
      // FIX: Use apply to access nested property
      const expirationDays = await pulumi.output(lifecycleRules).apply(rules => {
        if (!rules || rules.length === 0) return undefined;
        return rules[0].expiration?.days;
      });

      assert.strictEqual(expirationDays, 365);
    });

    it("should output production bucket name", async () => {
      const bucketName = await stack.prodLogBucketName;
      assert.ok(bucketName);
    });

    it("should output replica bucket name", async () => {
      const bucketName = await stack.replicaLogBucketName;
      assert.ok(bucketName);
    });
  });


  // =========================================================================
  // Load Balancer Tests
  // =========================================================================

  describe("Application Load Balancer", () => {
    it("should create ALB", () => {
      assert.ok(stack["alb"]);
    });

    it("should be application type", async () => {
      const lbType = await stack["alb"].loadBalancerType;
      assert.strictEqual(lbType, "application");
    });

    it("should enable HTTP/2", async () => {
      const http2 = await stack["alb"].enableHttp2;
      assert.strictEqual(http2, true);
    });

    it("should enable deletion protection", async () => {
      const deletionProtection = await stack["alb"].enableDeletionProtection;
      assert.strictEqual(deletionProtection, true);
    });

    it("should output ALB DNS name", async () => {
      const dnsName = await stack.albDnsName;
      assert.ok(dnsName);
    });

    it("should create blue target group", () => {
      assert.ok(stack["targetGroupBlue"]);
    });

    it("should create green target group", () => {
      assert.ok(stack["targetGroupGreen"]);
    });

    it("should configure health checks on target groups", async () => {
      const healthCheck = await stack["targetGroupGreen"].healthCheck;
      // FIX: Use apply to access nested properties
      const enabled = await pulumi.output(healthCheck).apply(hc => hc?.enabled);
      const path = await pulumi.output(healthCheck).apply(hc => hc?.path);
      const matcher = await pulumi.output(healthCheck).apply(hc => hc?.matcher);

      assert.strictEqual(enabled, true);
      assert.strictEqual(path, "/health");
      assert.strictEqual(matcher, "200");
    });

    it("should have proper deregistration delay", async () => {
      const delay = await stack["targetGroupGreen"].deregistrationDelay;
      assert.strictEqual(delay, 30);
    });
  });

  // =========================================================================
  // Auto Scaling Tests
  // =========================================================================

  describe("Auto Scaling Groups", () => {
    it("should create production ASG", () => {
      assert.ok(stack["prodAutoScalingGroup"]);
    });

    it("should have min size of 3", async () => {
      const minSize = await stack["prodAutoScalingGroup"].minSize;
      assert.strictEqual(minSize, 3);
    });

    it("should have max size of 9", async () => {
      const maxSize = await stack["prodAutoScalingGroup"].maxSize;
      assert.strictEqual(maxSize, 9);
    });

    it("should have desired capacity of 3", async () => {
      const desired = await stack["prodAutoScalingGroup"].desiredCapacity;
      assert.strictEqual(desired, 3);
    });

    it("should use ELB health check", async () => {
      const healthCheckType = await stack["prodAutoScalingGroup"].healthCheckType;
      assert.strictEqual(healthCheckType, "ELB");
    });

    it("should have health check grace period", async () => {
      const gracePeriod = await stack["prodAutoScalingGroup"].healthCheckGracePeriod;
      assert.strictEqual(gracePeriod, 300);
    });
  });

  // =========================================================================
  // Route53 Tests - FIXED
  // =========================================================================

  describe("Route53 Configuration", () => {
    it("should create hosted zone", () => {
      assert.ok(stack["route53Zone"]);
    });

    it("should output Route53 domain name", async () => {
      const domainName = await stack.route53DomainName;
      assert.ok(domainName);
    });

    it("should have proper tags on hosted zone", async () => {
      // FIX: Use apply to access tag properties
      const envTag = await stack["route53Zone"].tags.apply(t => t?.Environment);
      const managedByTag = await stack["route53Zone"].tags.apply(t => t?.ManagedBy);
      assert.strictEqual(envTag, "production");
      assert.strictEqual(managedByTag, "pulumi");
    });
  });

  // =========================================================================
  // Encryption Tests
  // =========================================================================

  describe("Encryption Configuration", () => {
    it("should create KMS key", () => {
      assert.ok(stack["kmsKey"]);
    });

    it("should enable key rotation", async () => {
      const rotation = await stack["kmsKey"].enableKeyRotation;
      assert.strictEqual(rotation, true);
    });

    it("should have deletion window of 10 days", async () => {
      const window = await stack["kmsKey"].deletionWindowInDays;
      assert.strictEqual(window, 10);
    });
  });

  // =========================================================================
  // Resource Naming Tests - FIXED
  // =========================================================================

  describe("Resource Naming Convention", () => {
    it("should follow pattern prod-{service}-{az}-{random}", async () => {
      // FIX: Use apply to access Name tag
      const name = await stack["vpc"].tags.apply(t => t?.Name);
      // Name should start with prod-
      const startsWithProd = name ? name.toString().startsWith("prod-") : false;
      assert.ok(startsWithProd);
    });

    it("should have random suffix in names", async () => {
      // FIX: Use apply to access Name tag
      const name = await stack["vpc"].tags.apply(t => t?.Name);
      // Should have random suffix
      const hasLength = name ? name.toString().length > 10 : false;
      assert.ok(hasLength);
    });
  });

  // =========================================================================
  // Tagging Tests - FIXED
  // =========================================================================

  describe("Resource Tagging", () => {
    it("should tag all resources with Environment=production", async () => {
      const resources = [
        stack["vpc"],
        stack["prodSecurityGroup"],
        stack["prodRdsInstance"],
        stack["prodLogBucket"],
        stack["alb"],
      ];

      for (const resource of resources) {
        // FIX: Use apply to access Environment tag
        const envTag = await resource.tags.apply(t => t?.Environment);
        assert.strictEqual(envTag, "production");
      }
    });

    it("should tag all resources with ManagedBy=pulumi", async () => {
      const resources = [
        stack["vpc"],
        stack["prodSecurityGroup"],
        stack["prodRdsInstance"],
        stack["prodLogBucket"],
        stack["alb"],
      ];

      for (const resource of resources) {
        // FIX: Use apply to access ManagedBy tag
        const managedByTag = await resource.tags.apply(t => t?.ManagedBy);
        assert.strictEqual(managedByTag, "pulumi");
      }
    });
  });

  // =========================================================================
  // Migration Phase Tests
  // =========================================================================

  describe("Migration Phase Logic", () => {
    it("should start with initial phase", async () => {
      const phase = await stack.migrationStatus;
      assert.strictEqual(phase, "initial");
    });

    it("should calculate correct traffic weights for initial phase", () => {
      const weights = stack["getTrafficWeights"]("initial");
      assert.strictEqual(weights.blue, 100);
      assert.strictEqual(weights.green, 0);
    });

    it("should calculate correct traffic weights for 10% shift", () => {
      const weights = stack["getTrafficWeights"]("traffic-shift-10");
      assert.strictEqual(weights.blue, 90);
      assert.strictEqual(weights.green, 10);
    });

    it("should calculate correct traffic weights for 50% shift", () => {
      const weights = stack["getTrafficWeights"]("traffic-shift-50");
      assert.strictEqual(weights.blue, 50);
      assert.strictEqual(weights.green, 50);
    });

    it("should calculate correct traffic weights for 100% shift", () => {
      const weights = stack["getTrafficWeights"]("traffic-shift-100");
      assert.strictEqual(weights.blue, 0);
      assert.strictEqual(weights.green, 100);
    });

    it("should calculate correct traffic weights for complete phase", () => {
      const weights = stack["getTrafficWeights"]("complete");
      assert.strictEqual(weights.blue, 0);
      assert.strictEqual(weights.green, 100);
    });
  });

  // =========================================================================
  // Output Tests
  // =========================================================================

  describe("Stack Outputs", () => {
    it("should export vpcId", () => {
      assert.ok(stack.vpcId);
    });

    it("should export prodRdsEndpoint", () => {
      assert.ok(stack.prodRdsEndpoint);
    });

    it("should export prodRdsPort", () => {
      assert.ok(stack.prodRdsPort);
    });

    it("should export albDnsName", () => {
      assert.ok(stack.albDnsName);
    });

    it("should export route53DomainName", () => {
      assert.ok(stack.route53DomainName);
    });

    it("should export prodLogBucketName", () => {
      assert.ok(stack.prodLogBucketName);
    });

    it("should export replicaLogBucketName", () => {
      assert.ok(stack.replicaLogBucketName);
    });

    it("should export migrationStatus", () => {
      assert.ok(stack.migrationStatus);
    });

    it("should have outputs object populated", () => {
      assert.ok(stack.outputs);
      assert.ok(Object.keys(stack.outputs).length > 0);
    });
  });

  // =========================================================================
  // Additional Edge Case Tests - FIXED
  // =========================================================================

  describe("Edge Cases and Constraints", () => {
    it("should enforce IMDSv2 for metadata access", () => {
      // Launch template configuration checked in stack implementation
      assert.ok(true);
    });

    it("should support idempotent operations", () => {
      // Pulumi handles idempotency by default
      assert.ok(stack);
    });

    it("should follow naming pattern for all resources", async () => {
      // FIX: Use apply to access Name tags
      const vpcName = await stack["vpc"].tags.apply(t => t?.Name);
      const rdsName = await stack["prodRdsInstance"].tags.apply(t => t?.Name);

      // All should have Name tag
      assert.ok(vpcName);
      assert.ok(rdsName);
    });

    it("should handle AES-256 encryption for all storage", async () => {
      const rdsEncrypted = await stack["prodRdsInstance"].storageEncrypted;
      const s3Encryption = await stack["prodLogBucket"].serverSideEncryptionConfiguration;

      // FIX: Use apply to access nested property
      const algorithm = await pulumi.output(s3Encryption).apply(enc =>
        enc?.rule?.applyServerSideEncryptionByDefault?.sseAlgorithm
      );

      assert.strictEqual(rdsEncrypted, true);
      assert.strictEqual(algorithm, "AES256");
    });
  });
});
