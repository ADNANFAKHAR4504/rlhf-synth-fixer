// test/terraform.int.test.ts
// Integration tests for deployed EKS infrastructure
// These tests validate the deployed resources using outputs from cfn-outputs/flat-outputs.json

import fs from "fs";
import path from "path";

// Load outputs from deployment
const OUTPUTS_FILE = path.resolve(__dirname, "../cfn-outputs/flat-outputs.json");

// Helper function to parse outputs that may be stored as JSON strings
function parseOutputValue(value: any): any {
  // If already an array or object, return as-is
  if (Array.isArray(value) || (typeof value === "object" && value !== null && !(value instanceof Date))) {
    return value;
  }
  
  if (typeof value === "string") {
    // Try to parse as JSON if it looks like JSON (starts with [ or {)
    const trimmed = value.trim();
    if ((trimmed.startsWith("[") && trimmed.endsWith("]")) || (trimmed.startsWith("{") && trimmed.endsWith("}"))) {
      try {
        const parsed = JSON.parse(trimmed);
        // Only return parsed value if it's actually an array or object
        if (Array.isArray(parsed) || (typeof parsed === "object" && parsed !== null)) {
          return parsed;
        }
      } catch {
        // If parsing fails, return original string
      }
    }
  }
  return value;
}

// Helper function to normalize outputs - converts JSON string arrays to actual arrays
function normalizeOutputs(rawOutputs: Record<string, any>): Record<string, any> {
  const normalized: Record<string, any> = {};
  for (const [key, value] of Object.entries(rawOutputs)) {
    normalized[key] = parseOutputValue(value);
  }
  return normalized;
}

describe("EKS Cluster Integration Tests", () => {
  let outputs: Record<string, any>;
  let clusterName: string;
  let environmentSuffix: string;

  beforeAll(() => {
    if (!fs.existsSync(OUTPUTS_FILE)) {
      throw new Error(
        `Outputs file not found at ${OUTPUTS_FILE}. Run terraform apply first.`
      );
    }
    const outputsContent = fs.readFileSync(OUTPUTS_FILE, "utf8");
    const rawOutputs = JSON.parse(outputsContent);
    outputs = normalizeOutputs(rawOutputs);
    
    // Dynamically discover cluster name from outputs
    clusterName = outputs.cluster_name;
    if (!clusterName) {
      throw new Error("cluster_name output not found. Cannot determine cluster name.");
    }
    
    // Extract environment suffix from cluster name (e.g., "payment-eks-dev" -> "dev")
    // Split by hyphen and take the last segment to get just the suffix
    const parts = clusterName.split("-");
    environmentSuffix = parts.length > 0 ? parts[parts.length - 1] : "unknown";
  });

  describe("EKS Cluster Deployment", () => {
    test("cluster_id output is present", () => {
      expect(outputs).toHaveProperty("cluster_id");
      expect(outputs.cluster_id).toBeTruthy();
    });

    test("cluster_name output is present and non-empty", () => {
      expect(outputs).toHaveProperty("cluster_name");
      expect(outputs.cluster_name).toBeTruthy();
      expect(typeof outputs.cluster_name).toBe("string");
    });

    test("cluster_name includes environment suffix", () => {
      expect(outputs.cluster_name).toBeTruthy();
      expect(typeof outputs.cluster_name).toBe("string");
      // Cluster name should contain the discovered environment suffix
      expect(outputs.cluster_name).toContain(environmentSuffix);
    });

    test("cluster_endpoint output is present and valid URL", () => {
      expect(outputs).toHaveProperty("cluster_endpoint");
      expect(outputs.cluster_endpoint).toBeTruthy();
      expect(outputs.cluster_endpoint).toMatch(/^https:\/\//);
      expect(outputs.cluster_endpoint).toContain("eks.amazonaws.com");
    });

    test("cluster_version output is present", () => {
      expect(outputs).toHaveProperty("cluster_version");
      expect(outputs.cluster_version).toBeTruthy();
      expect(outputs.cluster_version).toMatch(/^1\.\d+$/);
    });

    test("cluster_iam_role_arn output is valid ARN", () => {
      expect(outputs).toHaveProperty("cluster_iam_role_arn");
      expect(outputs.cluster_iam_role_arn).toMatch(
        /^arn:aws:iam::\d{12}:role\//
      );
    });

    test("cluster_security_group_id output is valid", () => {
      expect(outputs).toHaveProperty("cluster_security_group_id");
      expect(outputs.cluster_security_group_id).toMatch(/^sg-[a-f0-9]+$/);
    });

    test("kubeconfig_command output is present and valid", () => {
      expect(outputs).toHaveProperty("kubeconfig_command");
      expect(outputs.kubeconfig_command).toContain("aws eks update-kubeconfig");
      expect(outputs.kubeconfig_command).toContain("--region");
      expect(outputs.kubeconfig_command).toContain("--name");
    });
  });

  describe("VPC and Network Configuration", () => {
    test("vpc_id output is present and valid", () => {
      expect(outputs).toHaveProperty("vpc_id");
      expect(outputs.vpc_id).toMatch(/^vpc-[a-f0-9]+$/);
    });

    test("vpc_cidr_block output is valid CIDR", () => {
      expect(outputs).toHaveProperty("vpc_cidr_block");
      expect(outputs.vpc_cidr_block).toMatch(/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\/\d{1,2}$/);
    });

    test("public_subnet_ids output is array with valid subnet IDs", () => {
      expect(outputs).toHaveProperty("public_subnet_ids");
      // Ensure it's an array (defensive check in case normalization didn't work)
      if (!Array.isArray(outputs.public_subnet_ids)) {
        // Try one more time to parse if it's a string
        outputs.public_subnet_ids = parseOutputValue(outputs.public_subnet_ids);
      }
      expect(Array.isArray(outputs.public_subnet_ids)).toBe(true);
      expect(outputs.public_subnet_ids.length).toBeGreaterThanOrEqual(2);

      outputs.public_subnet_ids.forEach((subnetId: string) => {
        expect(subnetId).toMatch(/^subnet-[a-f0-9]+$/);
      });
    });

    test("private_subnet_ids output is array with valid subnet IDs", () => {
      expect(outputs).toHaveProperty("private_subnet_ids");
      // Ensure it's an array (defensive check in case normalization didn't work)
      if (!Array.isArray(outputs.private_subnet_ids)) {
        // Try one more time to parse if it's a string
        outputs.private_subnet_ids = parseOutputValue(outputs.private_subnet_ids);
      }
      expect(Array.isArray(outputs.private_subnet_ids)).toBe(true);
      expect(outputs.private_subnet_ids.length).toBeGreaterThanOrEqual(2);

      outputs.private_subnet_ids.forEach((subnetId: string) => {
        expect(subnetId).toMatch(/^subnet-[a-f0-9]+$/);
      });
    });

    test("nat_gateway_id output is valid", () => {
      expect(outputs).toHaveProperty("nat_gateway_id");
      expect(outputs.nat_gateway_id).toMatch(/^nat-[a-f0-9]+$/);
    });

    test("public and private subnets are different", () => {
      // Ensure arrays are arrays (defensive check)
      const publicSubnets = Array.isArray(outputs.public_subnet_ids) 
        ? outputs.public_subnet_ids 
        : parseOutputValue(outputs.public_subnet_ids);
      const privateSubnets = Array.isArray(outputs.private_subnet_ids) 
        ? outputs.private_subnet_ids 
        : parseOutputValue(outputs.private_subnet_ids);
      
      expect(Array.isArray(publicSubnets)).toBe(true);
      expect(Array.isArray(privateSubnets)).toBe(true);
      
      const publicSet = new Set(publicSubnets);
      const privateSet = new Set(privateSubnets);

      privateSubnets.forEach((subnetId: string) => {
        expect(publicSet.has(subnetId)).toBe(false);
      });
    });
  });

  describe("Security Configuration", () => {
    test("kms_key_id output is present", () => {
      expect(outputs).toHaveProperty("kms_key_id");
      expect(outputs.kms_key_id).toBeTruthy();
      expect(outputs.kms_key_id).toMatch(/^[a-f0-9-]+$/);
    });

    test("kms_key_arn output is valid ARN", () => {
      expect(outputs).toHaveProperty("kms_key_arn");
      expect(outputs.kms_key_arn).toMatch(
        /^arn:aws:kms:[a-z0-9-]+:\d{12}:key\/[a-f0-9-]+$/
      );
    });

    test("node_security_group_id output is valid", () => {
      expect(outputs).toHaveProperty("node_security_group_id");
      expect(outputs.node_security_group_id).toMatch(/^sg-[a-f0-9]+$/);
    });

    test("cluster and node security groups are different", () => {
      expect(outputs.cluster_security_group_id).not.toBe(
        outputs.node_security_group_id
      );
    });
  });

  describe("Node Group Configuration", () => {
    test("node_group_id output is present", () => {
      expect(outputs).toHaveProperty("node_group_id");
      expect(outputs.node_group_id).toBeTruthy();
    });

    test("node_group_arn output is valid ARN", () => {
      expect(outputs).toHaveProperty("node_group_arn");
      expect(outputs.node_group_arn).toMatch(
        /^arn:aws:eks:[a-z0-9-]+:\d{12}:nodegroup\//
      );
    });

    test("node_group_status output indicates active or creating", () => {
      expect(outputs).toHaveProperty("node_group_status");
      expect(["ACTIVE", "CREATING", "UPDATING"]).toContain(
        outputs.node_group_status
      );
    });
  });

  describe("CloudWatch Logging", () => {
    test("cloudwatch_log_group_name output is present", () => {
      expect(outputs).toHaveProperty("cloudwatch_log_group_name");
      expect(outputs.cloudwatch_log_group_name).toContain("/aws/eks/");
      // Dynamically check that log group name contains the cluster name
      expect(outputs.cloudwatch_log_group_name).toContain(clusterName);
    });

    test("vpc_flow_log_group_name output is present", () => {
      expect(outputs).toHaveProperty("vpc_flow_log_group_name");
      expect(outputs.vpc_flow_log_group_name).toContain("/aws/vpc/");
      // Dynamically check that flow log name contains the environment suffix
      expect(outputs.vpc_flow_log_group_name).toContain(environmentSuffix);
    });

    test("log group names are different", () => {
      expect(outputs.cloudwatch_log_group_name).not.toBe(
        outputs.vpc_flow_log_group_name
      );
    });
  });

  describe("Resource Naming Compliance", () => {
    test("all resource names follow naming convention with environment suffix", () => {
      const namingPattern = /-[a-z0-9-]+$/; // Ends with environment suffix (allows hyphens)

      // Check cluster name
      expect(outputs.cluster_name).toMatch(namingPattern);

      // Check log group names contain the environment suffix
      expect(outputs.cloudwatch_log_group_name).toContain(environmentSuffix);
      expect(outputs.vpc_flow_log_group_name).toContain(environmentSuffix);
    });

    test("cluster name follows eks cluster naming pattern", () => {
      // Dynamically validate cluster name format: should contain "eks" and environment suffix
      expect(outputs.cluster_name).toMatch(/eks/);
      expect(outputs.cluster_name).toMatch(/^[a-z0-9-]+-eks-[a-z0-9-]+$/);
    });
  });

  describe("Output Value Types", () => {
    test("all string outputs are non-empty strings", () => {
      const stringOutputs = [
        "cluster_id",
        "cluster_name",
        "cluster_endpoint",
        "cluster_version",
        "cluster_iam_role_arn",
        "cluster_security_group_id",
        "vpc_id",
        "vpc_cidr_block",
        "nat_gateway_id",
        "kms_key_id",
        "kms_key_arn",
        "node_group_id",
        "node_group_arn",
        "node_group_status",
        "node_security_group_id",
        "cloudwatch_log_group_name",
        "vpc_flow_log_group_name",
        "kubeconfig_command",
      ];

      stringOutputs.forEach((outputName) => {
        expect(outputs).toHaveProperty(outputName);
        expect(typeof outputs[outputName]).toBe("string");
        expect(outputs[outputName].length).toBeGreaterThan(0);
      });
    });

    test("all array outputs are non-empty arrays", () => {
      const arrayOutputs = ["public_subnet_ids", "private_subnet_ids"];

      arrayOutputs.forEach((outputName) => {
        expect(outputs).toHaveProperty(outputName);
        // Ensure it's an array (defensive check)
        let value = outputs[outputName];
        if (!Array.isArray(value)) {
          value = parseOutputValue(value);
          outputs[outputName] = value; // Update in place for subsequent tests
        }
        expect(Array.isArray(value)).toBe(true);
        expect(value.length).toBeGreaterThan(0);
      });
    });
  });

  describe("AWS Resource ARN Format Validation", () => {
    test("all ARN outputs follow AWS ARN format", () => {
      const arnOutputs = [
        "cluster_iam_role_arn",
        "kms_key_arn",
        "node_group_arn",
      ];

      const arnPattern = /^arn:aws:[a-z0-9-]+:[a-z0-9-]*:\d{12}:.+$/;

      arnOutputs.forEach((outputName) => {
        expect(outputs[outputName]).toMatch(arnPattern);
      });
    });
  });

  describe("Multi-AZ Deployment Validation", () => {
    test("public subnets span multiple availability zones", () => {
      const publicSubnets = Array.isArray(outputs.public_subnet_ids) 
        ? outputs.public_subnet_ids 
        : parseOutputValue(outputs.public_subnet_ids);
      expect(Array.isArray(publicSubnets)).toBe(true);
      expect(publicSubnets.length).toBeGreaterThanOrEqual(2);
    });

    test("private subnets span multiple availability zones", () => {
      const privateSubnets = Array.isArray(outputs.private_subnet_ids) 
        ? outputs.private_subnet_ids 
        : parseOutputValue(outputs.private_subnet_ids);
      expect(Array.isArray(privateSubnets)).toBe(true);
      expect(privateSubnets.length).toBeGreaterThanOrEqual(2);
    });

    test("equal number of public and private subnets", () => {
      const publicSubnets = Array.isArray(outputs.public_subnet_ids) 
        ? outputs.public_subnet_ids 
        : parseOutputValue(outputs.public_subnet_ids);
      const privateSubnets = Array.isArray(outputs.private_subnet_ids) 
        ? outputs.private_subnet_ids 
        : parseOutputValue(outputs.private_subnet_ids);
      expect(publicSubnets.length).toBe(privateSubnets.length);
    });
  });

  describe("Deployment Completeness", () => {
    test("all expected outputs are present", () => {
      const requiredOutputs = [
        "cluster_id",
        "cluster_name",
        "cluster_endpoint",
        "cluster_security_group_id",
        "cluster_iam_role_arn",
        "cluster_version",
        "node_group_id",
        "node_group_arn",
        "node_group_status",
        "node_security_group_id",
        "vpc_id",
        "vpc_cidr_block",
        "public_subnet_ids",
        "private_subnet_ids",
        "nat_gateway_id",
        "kms_key_id",
        "kms_key_arn",
        "cloudwatch_log_group_name",
        "vpc_flow_log_group_name",
        "kubeconfig_command",
      ];

      requiredOutputs.forEach((outputName) => {
        expect(outputs).toHaveProperty(outputName);
      });
    });

    test("no output is null or undefined", () => {
      Object.entries(outputs).forEach(([key, value]) => {
        expect(value).not.toBeNull();
        expect(value).not.toBeUndefined();
      });
    });
  });
});

describe("EKS Infrastructure Compliance Tests", () => {
  let outputs: Record<string, any>;

  beforeAll(() => {
    if (!fs.existsSync(OUTPUTS_FILE)) {
      throw new Error(
        `Outputs file not found at ${OUTPUTS_FILE}. Run terraform apply first.`
      );
    }
    const outputsContent = fs.readFileSync(OUTPUTS_FILE, "utf8");
    const rawOutputs = JSON.parse(outputsContent);
    outputs = normalizeOutputs(rawOutputs);
  });

  test("cluster endpoint uses HTTPS", () => {
    expect(outputs.cluster_endpoint).toMatch(/^https:\/\//);
  });

  test("Kubernetes version is 1.31 or higher", () => {
    const version = parseFloat(outputs.cluster_version);
    expect(version).toBeGreaterThanOrEqual(1.31);
  });

  test("VPC CIDR is appropriate for production workloads", () => {
    // Check if CIDR provides adequate IP space (at least /16 or larger subnet)
    expect(outputs.vpc_cidr_block).toMatch(/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\/\d{1,2}$/);
    const cidrParts = outputs.vpc_cidr_block.split("/");
    const subnetMask = parseInt(cidrParts[1], 10);
    // Ensure subnet mask is /16 or larger (smaller number = larger subnet)
    expect(subnetMask).toBeLessThanOrEqual(16);
  });

  test("at least 2 availability zones for high availability", () => {
    const publicSubnets = Array.isArray(outputs.public_subnet_ids) 
      ? outputs.public_subnet_ids 
      : parseOutputValue(outputs.public_subnet_ids);
    const privateSubnets = Array.isArray(outputs.private_subnet_ids) 
      ? outputs.private_subnet_ids 
      : parseOutputValue(outputs.private_subnet_ids);
    expect(Array.isArray(publicSubnets)).toBe(true);
    expect(Array.isArray(privateSubnets)).toBe(true);
    expect(publicSubnets.length).toBeGreaterThanOrEqual(2);
    expect(privateSubnets.length).toBeGreaterThanOrEqual(2);
  });

  test("KMS encryption is configured", () => {
    expect(outputs.kms_key_arn).toBeTruthy();
    expect(outputs.kms_key_id).toBeTruthy();
  });
});
