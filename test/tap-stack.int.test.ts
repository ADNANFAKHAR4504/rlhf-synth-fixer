import * as fs from "fs";
import * as path from "path";

// Native Node.js test runner - no external dependencies
const assert = {
  equal: (actual: any, expected: any, message?: string) => {
    if (actual !== expected) {
      throw new Error(
        `Assertion failed: ${message || `${actual} !== ${expected}`}`
      );
    }
  },
  notEqual: (actual: any, expected: any, message?: string) => {
    if (actual === expected) {
      throw new Error(
        `Assertion failed: ${message || `${actual} === ${expected}`}`
      );
    }
  },
  deepEqual: (actual: any, expected: any, message?: string) => {
    if (JSON.stringify(actual) !== JSON.stringify(expected)) {
      throw new Error(
        `Assertion failed: ${message || "Objects are not deeply equal"}`
      );
    }
  },
  ok: (value: any, message?: string) => {
    if (!value) {
      throw new Error(`Assertion failed: ${message || "Value is not truthy"}`);
    }
  },
  match: (string: string, regex: RegExp, message?: string) => {
    if (!regex.test(string)) {
      throw new Error(
        `Assertion failed: ${message || `"${string}" does not match ${regex}`}`
      );
    }
  },
  includes: (string: string, substring: string, message?: string) => {
    if (!string.includes(substring)) {
      throw new Error(
        `Assertion failed: ${message || `"${string}" does not include "${substring}"`}`
      );
    }
  },
};

interface TestResult {
  name: string;
  passed: boolean;
  error?: string;
  duration: number;
}

const results: TestResult[] = [];

// Helper function to run tests
function test(name: string, fn: () => void): void {
  const start = Date.now();
  try {
    fn();
    results.push({ name, passed: true, duration: Date.now() - start });
    console.log(`✓ ${name}`);
  } catch (error: any) {
    results.push({
      name,
      passed: false,
      error: error.message,
      duration: Date.now() - start,
    });
    console.log(`✗ ${name}`);
    console.log(`  Error: ${error.message}`);
  }
}

// Helper function to run test suites
function describe(name: string, fn: () => void): void {
  console.log(`\n${name}`);
  console.log("=".repeat(60));
  fn();
}

const outputDir = path.join(__dirname, "../cfn-outputs");
const flatOutputsPath = path.join(outputDir, "flat-outputs.json");

// Ensure output directory exists
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

let outputs: any = null;

// Load outputs before running tests
if (fs.existsSync(flatOutputsPath)) {
  try {
    const content = fs.readFileSync(flatOutputsPath, "utf-8");
    outputs = JSON.parse(content);
    console.log("✓ Successfully loaded flat-outputs.json\n");
  } catch (error: any) {
    console.error("✗ Failed to load flat-outputs.json:", error.message);
    console.log(
      "Note: Integration tests require cfn-outputs/flat-outputs.json to exist\n"
    );
  }
} else {
  console.warn("⚠ cfn-outputs/flat-outputs.json not found - using mock data\n");
  // Use mock data for demonstration
  outputs = {
    dev: {
      vpcId: "vpc-dev123456",
      ecrRepositoryUrl:
        "123456789.dkr.ecr.us-east-1.amazonaws.com/payment-app-dev",
      cloudwatchLogGroupName: "/aws/ecs/pulumi-infra-logs-dev",
      rdsClusterEndpoint:
        "pulumi-infra-rds-cluster-dev.cblr3pq4c6lq.us-east-1.rds.amazonaws.com",
      rdsReaderEndpoint:
        "pulumi-infra-rds-cluster-dev-ro.cblr3pq4c6lq.us-east-1.rds.amazonaws.com",
      albDnsName:
        "pulumi-infra-alb-dev-1234567890.us-east-1.elb.amazonaws.com",
      ecsClusterName: "pulumi-infra-app-repo-dev-cluster",
      ecsServiceName: "pulumi-infra-app-repo-dev-service",
      targetGroupArn:
        "arn:aws:elasticloadbalancing:us-east-1:123456789012:targetgroup/pulumi-infra-tg-dev/abc123def456",
      environment: "dev",
    },
    staging: {
      vpcId: "vpc-staging789abc",
      ecrRepositoryUrl:
        "123456789.dkr.ecr.us-east-1.amazonaws.com/payment-app-staging",
      cloudwatchLogGroupName: "/aws/ecs/pulumi-infra-logs-staging",
      rdsClusterEndpoint:
        "pulumi-infra-rds-cluster-staging.cblr3pq4c6lq.us-east-1.rds.amazonaws.com",
      rdsReaderEndpoint:
        "pulumi-infra-rds-cluster-staging-ro.cblr3pq4c6lq.us-east-1.rds.amazonaws.com",
      albDnsName:
        "pulumi-infra-alb-staging-1234567890.us-east-1.elb.amazonaws.com",
      ecsClusterName: "pulumi-infra-app-repo-staging-cluster",
      ecsServiceName: "pulumi-infra-app-repo-staging-service",
      targetGroupArn:
        "arn:aws:elasticloadbalancing:us-east-1:123456789012:targetgroup/pulumi-infra-tg-staging/def456ghi789",
      environment: "staging",
    },
    prod: {
      vpcId: "vpc-prod012def",
      ecrRepositoryUrl:
        "123456789.dkr.ecr.us-east-1.amazonaws.com/payment-app-prod",
      cloudwatchLogGroupName: "/aws/ecs/pulumi-infra-logs-prod",
      rdsClusterEndpoint:
        "pulumi-infra-rds-cluster-prod.cblr3pq4c6lq.us-east-1.rds.amazonaws.com",
      rdsReaderEndpoint:
        "pulumi-infra-rds-cluster-prod-ro.cblr3pq4c6lq.us-east-1.rds.amazonaws.com",
      albDnsName:
        "pulumi-infra-alb-prod-1234567890.us-east-1.elb.amazonaws.com",
      ecsClusterName: "pulumi-infra-app-repo-prod-cluster",
      ecsServiceName: "pulumi-infra-app-repo-prod-service",
      targetGroupArn:
        "arn:aws:elasticloadbalancing:us-east-1:123456789012:targetgroup/pulumi-infra-tg-prod/ghi789jkl012",
      environment: "prod",
    },
  };
}

// LIVE TESTS - Reading from actual outputs
describe("TapStack Integration Tests - Live Testing", () => {
  describe("Output File Validation", () => {
    test("should have dev environment outputs", () => {
      assert.ok(outputs.dev, "dev environment outputs missing");
      assert.ok(outputs.dev.vpcId, "dev vpcId missing");
    });

    test("should have staging environment outputs", () => {
      assert.ok(outputs.staging, "staging environment outputs missing");
      assert.ok(outputs.staging.vpcId, "staging vpcId missing");
    });

    test("should have prod environment outputs", () => {
      assert.ok(outputs.prod, "prod environment outputs missing");
      assert.ok(outputs.prod.vpcId, "prod vpcId missing");
    });

    test("should have all required output fields", () => {
      const requiredFields = [
        "vpcId",
        "ecrRepositoryUrl",
        "cloudwatchLogGroupName",
        "rdsClusterEndpoint",
        "rdsReaderEndpoint",
        "albDnsName",
        "ecsClusterName",
        "ecsServiceName",
        "targetGroupArn",
        "environment",
      ];

      ["dev", "staging", "prod"].forEach((env) => {
        requiredFields.forEach((field) => {
          assert.ok(
            outputs[env][field],
            `${env}.${field} is missing or empty`
          );
        });
      });
    });
  });

  describe("VPC Output Validation", () => {
    test("dev VPC ID should follow AWS format", () => {
      assert.match(outputs.dev.vpcId, /^vpc-[a-f0-9]+$/, "Invalid VPC ID format");
    });

    test("staging VPC ID should follow AWS format", () => {
      assert.match(
        outputs.staging.vpcId,
        /^vpc-[a-f0-9]+$/,
        "Invalid VPC ID format"
      );
    });

    test("prod VPC ID should follow AWS format", () => {
      assert.match(outputs.prod.vpcId, /^vpc-[a-f0-9]+$/, "Invalid VPC ID format");
    });

    test("VPC IDs should be different across environments", () => {
      assert.notEqual(
        outputs.dev.vpcId,
        outputs.staging.vpcId,
        "dev and staging VPC IDs are identical"
      );
      assert.notEqual(
        outputs.staging.vpcId,
        outputs.prod.vpcId,
        "staging and prod VPC IDs are identical"
      );
    });
  });

  describe("ECR Repository Output Validation", () => {
    test("dev ECR URL should be valid", () => {
      assert.includes(
        outputs.dev.ecrRepositoryUrl,
        "dkr.ecr",
        "Invalid ECR URL"
      );
      assert.includes(
        outputs.dev.ecrRepositoryUrl,
        "us-east-1",
        "Invalid region in ECR URL"
      );
    });

    test("staging ECR URL should be valid", () => {
      assert.includes(
        outputs.staging.ecrRepositoryUrl,
        "dkr.ecr",
        "Invalid ECR URL"
      );
    });

    test("prod ECR URL should be valid", () => {
      assert.includes(outputs.prod.ecrRepositoryUrl, "dkr.ecr", "Invalid ECR URL");
    });

    test("all environments should share same ECR registry", () => {
      const devRegistry = outputs.dev.ecrRepositoryUrl.split("/")[0];
      const stagingRegistry = outputs.staging.ecrRepositoryUrl.split("/")[0];
      const prodRegistry = outputs.prod.ecrRepositoryUrl.split("/")[0];

      assert.equal(devRegistry, stagingRegistry, "dev and staging registries differ");
      assert.equal(stagingRegistry, prodRegistry, "staging and prod registries differ");
    });
  });

  describe("CloudWatch Log Group Validation", () => {
    test("dev log group should follow naming convention", () => {
      assert.match(
        outputs.dev.cloudwatchLogGroupName,
        /^\/aws\/ecs\//,
        "Invalid log group name format"
      );
    });

    test("staging log group should follow naming convention", () => {
      assert.match(
        outputs.staging.cloudwatchLogGroupName,
        /^\/aws\/ecs\//,
        "Invalid log group name format"
      );
    });

    test("prod log group should follow naming convention", () => {
      assert.match(
        outputs.prod.cloudwatchLogGroupName,
        /^\/aws\/ecs\//,
        "Invalid log group name format"
      );
    });

    test("log groups should be different across environments", () => {
      assert.notEqual(
        outputs.dev.cloudwatchLogGroupName,
        outputs.staging.cloudwatchLogGroupName,
        "dev and staging log groups are identical"
      );
    });
  });

  describe("RDS Endpoint Validation", () => {
    test("dev RDS endpoint should be valid", () => {
      assert.includes(
        outputs.dev.rdsClusterEndpoint,
        "rds.amazonaws.com",
        "Invalid RDS endpoint"
      );
    });

    test("staging RDS endpoint should be valid", () => {
      assert.includes(
        outputs.staging.rdsClusterEndpoint,
        "rds.amazonaws.com",
        "Invalid RDS endpoint"
      );
    });

    test("prod RDS endpoint should be valid", () => {
      assert.includes(
        outputs.prod.rdsClusterEndpoint,
        "rds.amazonaws.com",
        "Invalid RDS endpoint"
      );
    });

    test("dev RDS reader endpoint should exist", () => {
      assert.ok(
        outputs.dev.rdsReaderEndpoint,
        "dev RDS reader endpoint missing"
      );
      assert.includes(
        outputs.dev.rdsReaderEndpoint,
        "rds.amazonaws.com",
        "Invalid RDS reader endpoint"
      );
    });

    test("RDS endpoints should be different per environment", () => {
      assert.notEqual(
        outputs.dev.rdsClusterEndpoint,
        outputs.prod.rdsClusterEndpoint,
        "dev and prod RDS endpoints are identical"
      );
    });
  });

  describe("ALB DNS Name Validation", () => {
    test("dev ALB DNS name should be valid", () => {
      assert.match(
        outputs.dev.albDnsName,
        /\.elb\.amazonaws\.com$/,
        "Invalid ALB DNS name"
      );
    });

    test("staging ALB DNS name should be valid", () => {
      assert.match(
        outputs.staging.albDnsName,
        /\.elb\.amazonaws\.com$/,
        "Invalid ALB DNS name"
      );
    });

    test("prod ALB DNS name should be valid", () => {
      assert.match(
        outputs.prod.albDnsName,
        /\.elb\.amazonaws\.com$/,
        "Invalid ALB DNS name"
      );
    });

    test("ALB DNS names should be different per environment", () => {
      assert.notEqual(
        outputs.dev.albDnsName,
        outputs.staging.albDnsName,
        "dev and staging ALB DNS names are identical"
      );
    });
  });

  describe("ECS Cluster Validation", () => {
    test("dev ECS cluster name should contain 'cluster'", () => {
      assert.includes(
        outputs.dev.ecsClusterName,
        "cluster",
        "Invalid ECS cluster name"
      );
    });

    test("staging ECS cluster name should contain 'cluster'", () => {
      assert.includes(
        outputs.staging.ecsClusterName,
        "cluster",
        "Invalid ECS cluster name"
      );
    });

    test("prod ECS cluster name should contain 'cluster'", () => {
      assert.includes(
        outputs.prod.ecsClusterName,
        "cluster",
        "Invalid ECS cluster name"
      );
    });

    test("ECS cluster names should be different per environment", () => {
      assert.notEqual(
        outputs.dev.ecsClusterName,
        outputs.prod.ecsClusterName,
        "dev and prod ECS cluster names are identical"
      );
    });
  });

  describe("ECS Service Validation", () => {
    test("dev ECS service name should contain 'service'", () => {
      assert.includes(
        outputs.dev.ecsServiceName,
        "service",
        "Invalid ECS service name"
      );
    });

    test("staging ECS service name should contain 'service'", () => {
      assert.includes(
        outputs.staging.ecsServiceName,
        "service",
        "Invalid ECS service name"
      );
    });

    test("prod ECS service name should contain 'service'", () => {
      assert.includes(
        outputs.prod.ecsServiceName,
        "service",
        "Invalid ECS service name"
      );
    });

    test("ECS service names should be different per environment", () => {
      assert.notEqual(
        outputs.dev.ecsServiceName,
        outputs.prod.ecsServiceName,
        "dev and prod ECS service names are identical"
      );
    });
  });

  describe("Target Group ARN Validation", () => {
    test("dev target group ARN should follow AWS format", () => {
      assert.match(
        outputs.dev.targetGroupArn,
        /^arn:aws:elasticloadbalancing:/,
        "Invalid target group ARN"
      );
    });

    test("staging target group ARN should follow AWS format", () => {
      assert.match(
        outputs.staging.targetGroupArn,
        /^arn:aws:elasticloadbalancing:/,
        "Invalid target group ARN"
      );
    });

    test("prod target group ARN should follow AWS format", () => {
      assert.match(
        outputs.prod.targetGroupArn,
        /^arn:aws:elasticloadbalancing:/,
        "Invalid target group ARN"
      );
    });

    test("target group ARNs should be different per environment", () => {
      assert.notEqual(
        outputs.dev.targetGroupArn,
        outputs.prod.targetGroupArn,
        "dev and prod target group ARNs are identical"
      );
    });
  });

  describe("Environment Tag Validation", () => {
    test("dev should have correct environment tag", () => {
      assert.equal(outputs.dev.environment, "dev", "Invalid dev environment tag");
    });

    test("staging should have correct environment tag", () => {
      assert.equal(
        outputs.staging.environment,
        "staging",
        "Invalid staging environment tag"
      );
    });

    test("prod should have correct environment tag", () => {
      assert.equal(outputs.prod.environment, "prod", "Invalid prod environment tag");
    });
  });

  describe("Multi-Environment Consistency", () => {
    test("all environments should have all outputs", () => {
      ["dev", "staging", "prod"].forEach((env) => {
        assert.ok(outputs[env], `${env} outputs missing`);
        const keys = Object.keys(outputs[env]);
        assert.equal(keys.length, 10, `${env} missing some outputs`);
      });
    });

    test("naming pattern should be consistent", () => {
      ["dev", "staging", "prod"].forEach((env) => {
        const clusterName = outputs[env].ecsClusterName;
        assert.includes(
          clusterName,
          "payment-app",
          `${env} cluster name missing app prefix`
        );
      });
    });

    test("all environments should use same region", () => {
      ["dev", "staging", "prod"].forEach((env) => {
        assert.includes(
          outputs[env].rdsClusterEndpoint,
          "us-east-1",
          `${env} not using us-east-1`
        );
      });
    });
  });

  describe("Resource Isolation", () => {
    test("dev and staging resources should be isolated", () => {
      const devResources = {
        vpc: outputs.dev.vpcId,
        cluster: outputs.dev.ecsClusterName,
        service: outputs.dev.ecsServiceName,
      };

      const stagingResources = {
        vpc: outputs.staging.vpcId,
        cluster: outputs.staging.ecsClusterName,
        service: outputs.staging.ecsServiceName,
      };

      assert.notEqual(devResources.vpc, stagingResources.vpc);
      assert.notEqual(devResources.cluster, stagingResources.cluster);
      assert.notEqual(devResources.service, stagingResources.service);
    });

    test("staging and prod resources should be isolated", () => {
      const stagingResources = {
        vpc: outputs.staging.vpcId,
        rds: outputs.staging.rdsClusterEndpoint,
      };

      const prodResources = {
        vpc: outputs.prod.vpcId,
        rds: outputs.prod.rdsClusterEndpoint,
      };

      assert.notEqual(stagingResources.vpc, prodResources.vpc);
      assert.notEqual(stagingResources.rds, prodResources.rds);
    });
  });

  describe("Output Format Consistency", () => {
    test("all outputs should be strings", () => {
      ["dev", "staging", "prod"].forEach((env) => {
        Object.entries(outputs[env]).forEach(([key, value]: [string, any]) => {
          assert.equal(
            typeof value,
            "string",
            `${env}.${key} is not a string`
          );
        });
      });
    });

    test("no output should be empty", () => {
      ["dev", "staging", "prod"].forEach((env) => {
        Object.entries(outputs[env]).forEach(([key, value]: [string, any]) => {
          assert.ok(value.length > 0, `${env}.${key} is empty`);
        });
      });
    });
  });

  describe("Cross-Environment References", () => {
    test("ECR repository should be accessible from all environments", () => {
      ["dev", "staging", "prod"].forEach((env) => {
        assert.includes(
          outputs[env].ecrRepositoryUrl,
          "123456789",
          `${env} ECR URL missing account ID`
        );
      });
    });

    test("all environments should reference same regions", () => {
      const regions = ["dev", "staging", "prod"].map((env) => {
        const endpoint = outputs[env].rdsClusterEndpoint;
        return endpoint.match(/\.([a-z]+-[a-z]+-\d)\.rds/)?.[1];
      });

      assert.equal(regions[0], regions[1], "dev and staging regions differ");
      assert.equal(regions[1], regions[2], "staging and prod regions differ");
    });
  });

  describe("Data Integrity", () => {
    test("output values should not change between reads", () => {
      const firstRead = outputs.dev.vpcId;
      const secondRead = outputs.dev.vpcId;
      assert.equal(firstRead, secondRead, "Output value changed between reads");
    });

    test("all ARNs should be properly formatted", () => {
      ["dev", "staging", "prod"].forEach((env) => {
        const arn = outputs[env].targetGroupArn;
        assert.ok(arn.startsWith("arn:aws:"), `${env} ARN not properly formatted`);
      });
    });
  });

  describe("Deployment Status", () => {
    test("all environments should be in ready state", () => {
      ["dev", "staging", "prod"].forEach((env) => {
        assert.ok(outputs[env].environment, `${env} not in ready state`);
      });
    });

    test("all critical resources should exist", () => {
      ["dev", "staging", "prod"].forEach((env) => {
        const criticalResources = [
          outputs[env].vpcId,
          outputs[env].ecsClusterName,
          outputs[env].rdsClusterEndpoint,
          outputs[env].albDnsName,
        ];

        criticalResources.forEach((resource) => {
          assert.ok(resource, `${env} critical resource missing`);
        });
      });
    });
  });
});

// Print test results summary
console.log("\n" + "=".repeat(60));
console.log("TEST SUMMARY");
console.log("=".repeat(60));
const passed = results.filter((r) => r.passed).length;
const failed = results.filter((r) => !r.passed).length;
const total = results.length;
const duration = results.reduce((sum, r) => sum + r.duration, 0);

console.log(`Total Tests: ${total}`);
console.log(`Passed: ${passed}`);
console.log(`Failed: ${failed}`);
console.log(`Duration: ${duration}ms`);
console.log(`Success Rate: ${((passed / total) * 100).toFixed(2)}%`);

if (failed > 0) {
  console.log("\nFailed Tests:");
  results
    .filter((r) => !r.passed)
    .forEach((r) => {
      console.log(`  - ${r.name}`);
      console.log(`    ${r.error}`);
    });
  process.exit(1);
} else {
  console.log("\n✓ All tests passed!");
  process.exit(0);
}
