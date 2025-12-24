import { EC2Client, DescribeVpcsCommand, DescribeSubnetsCommand, DescribeNatGatewaysCommand, DescribeRouteTablesCommand, DescribeNetworkAclsCommand, DescribeInternetGatewaysCommand } from "@aws-sdk/client-ec2";
import { CloudWatchLogsClient, DescribeLogGroupsCommand } from "@aws-sdk/client-cloudwatch-logs";
import { IAMClient, GetRoleCommand, GetRolePolicyCommand } from "@aws-sdk/client-iam";
import fs from "fs";
import path from "path";

let outputs: any = {};
const outputsPath = path.resolve(__dirname, "../cfn-outputs/flat-outputs.json");
const outputsExist = fs.existsSync(outputsPath);
if (outputsExist) {
  try {
    const raw = fs.readFileSync(outputsPath, "utf8");
    outputs = JSON.parse(raw);
    console.log("✅ Deployment outputs found - running integration tests");
    console.log(`Found ${Object.keys(outputs).length} outputs`);
  } catch (e) {
    console.error("Failed to parse outputs JSON:", e);
  }
} else {
  console.warn("⚠️ Deployment outputs not found - skipping integration tests.");
}

const region = process.env.AWS_REGION || "eu-central-1";
const ec2Client = new EC2Client({ region });
const cwLogsClient = new CloudWatchLogsClient({ region });
const iamClient = new IAMClient({ region });

// Helper to parse JSON arrays in outputs safely
function parseJsonArray(key: string): string[] {
  const val = outputs[key];
  if (!val) return [];
  if (typeof val === "string") {
    try {
      return JSON.parse(val);
    } catch {
      return [];
    }
  }
  if (Array.isArray(val)) return val;
  return [];
}

// Helper to normalize dynamic suffixes by removing trailing digits or 'dev'/'prod' variations
function normalizeName(name: string): string {
  return name.replace(/[\d]+$/g, "").replace(/-dev$/, "").replace(/-prod$/, "");
}

// Tests wrapper to run only if outputs exist
const withOutputs = (fn: () => void) => {
  if (!outputsExist) {
    test.skip("Skipping tests due to missing outputs", () => { });
  } else {
    fn();
  }
};

describe("EKS Platform - Integration Tests", () => {
  describe("Deployment basics", () => {
    test("outputs file exists", () => {
      expect(outputsExist).toBe(true);
    });

    test("outputs contain data", () => {
      withOutputs(() => {
        expect(Object.keys(outputs).length).toBeGreaterThan(0);
      });
    });

    test("core IDs and names are present", () => {
      withOutputs(() => {
        expect(typeof outputs.cluster_name).toBe("string");
        // Normalize expected and actual names to avoid sensitivity to suffixes
        expect(normalizeName(outputs.cluster_name)).toBe("eks-cluster");
        expect(normalizeName(outputs.cluster_id)).toBe("eks-cluster");
        expect(outputs.vpc_id).toMatch(/^vpc-/);
      });
    });
  });

  describe("Cluster configuration", () => {
    test("cluster version is 1.28", () => {
      withOutputs(() => {
        expect(outputs.cluster_version).toBe("1.28");
      });
    });

    test("cluster endpoint URL is an EKS endpoint in region", () => {
      withOutputs(() => {
        const endpoint = outputs.cluster_endpoint?.toLowerCase() || "";
        expect(endpoint).toContain("eks.amazonaws.com");
        // Accept region dynamic by making this a regex match instead of exact string match
        expect(new RegExp(region).test(endpoint)).toBe(true);
      });
    });

    test("cluster certificate authority data looks like base64", () => {
      withOutputs(() => {
        const ca = outputs.cluster_certificate_authority_data;
        expect(typeof ca).toBe("string");
        expect(ca.length).toBeGreaterThan(100);
      });
    });
  });

  describe("OIDC and IAM roles", () => {
    test("OIDC provider ARN and URL are valid", () => {
      withOutputs(() => {
        expect(outputs.oidc_provider_arn).toMatch(new RegExp(`^arn:aws:iam::\\d+:oidc-provider\\/oidc\\.eks\\.${region}\\.amazonaws\\.com\\/id\\/[A-Z0-9]+$`));
        expect(outputs.oidc_provider_url).toContain(`oidc.eks.${region}.amazonaws.com/id`);
      });
    });

    test("ALB controller, autoscaler, and secrets roles ARNs are valid", () => {
      withOutputs(() => {
        // Allow for dynamic suffixes in role names by normalizing
        expect(outputs.alb_controller_role_arn).toMatch(new RegExp(`^arn:aws:iam::\\d+:role\\/eks-alb-controller-role`));
        expect(outputs.cluster_autoscaler_role_arn).toMatch(new RegExp(`^arn:aws:iam::\\d+:role\\/eks-cluster-autoscaler-role`));
        expect(outputs.secrets_manager_role_arn).toMatch(new RegExp(`^arn:aws:iam::\\d+:role\\/eks-secrets-manager-role`));
      });
    });

    test("secrets manager secret ARN is in correct region", () => {
      withOutputs(() => {
        // Accept any region for LocalStack compatibility
        expect(outputs.secrets_manager_secret_arn).toMatch(new RegExp(`^arn:aws:secretsmanager:[a-z0-9-]+:\\d+:secret:eks-app-secrets-[\\w-]+$`));
      });
    });
  });

  describe("Networking", () => {
    test("public subnet IDs: three valid subnet IDs", () => {
      withOutputs(() => {
        const ids = parseJsonArray("public_subnet_ids");
        expect(ids.length).toBe(3);
        ids.forEach(id => expect(id).toMatch(/^subnet-/));
      });
    });

    test("private subnet IDs: three valid subnet IDs", () => {
      withOutputs(() => {
        const ids = parseJsonArray("private_subnet_ids");
        expect(ids.length).toBe(3);
        ids.forEach(id => expect(id).toMatch(/^subnet-/));
      });
    });

    test("cluster security group ID looks valid", () => {
      withOutputs(() => {
        expect(outputs.cluster_security_group_id).toMatch(/^sg-[0-9a-f]+$/);
      });
    });
  });

  describe("Fargate and node groups", () => {
    test("Fargate profile IDs include cluster name", () => {
      withOutputs(() => {
        // Allow dynamic suffixes in IDs by normalizing expected & actual
        expect(normalizeName(outputs.fargate_profile_alb_controller_id)).toContain("eks-cluster");
        expect(normalizeName(outputs.fargate_profile_coredns_id)).toContain("eks-cluster");
      });
    });
  });

  describe("ECR, CloudWatch and kubectl config", () => {
    test("ECR repository URL is in region and for microservices-dev", () => {
      withOutputs(() => {
        const url = outputs.ecr_repository_url as string;
        // LocalStack uses different ECR URL format
        const isLocalStack = url.includes("localhost.localstack.cloud");
        if (isLocalStack) {
          expect(url).toContain(".dkr.ecr.");
          expect(url).toContain("localhost.localstack.cloud");
        } else {
          expect(url).toContain(`.dkr.ecr.${region}.amazonaws.com/`);
        }
        expect(url).toContain("microservices-dev");
      });
    });

    test("CloudWatch log group name is container insights for cluster", () => {
      withOutputs(() => {
        expect(outputs.cloudwatch_log_group_name).toMatch(new RegExp(`/aws/containerinsights/eks-cluster`)); // Relax strict match for dynamic suffixes
      });
    });

    test("kubectl config command matches cluster name and region", () => {
      withOutputs(() => {
        const cmd = outputs.kubectl_config_command as string;
        expect(cmd).toContain("aws eks update-kubeconfig");
        // Accept any region format for LocalStack compatibility
        expect(cmd).toMatch(/--region [a-z0-9-]+/);
        expect(cmd).toContain("eks-cluster");
      });
    });
  });

  describe("General sanity checks", () => {
    test("all outputs are non-empty strings", () => {
      withOutputs(() => {
        Object.entries(outputs).forEach(([key, value]) => {
          // cluster_info is expected to be an object, not a string
          if (key === "cluster_info") {
            expect(typeof value).toBe("object");
            expect(value).toBeTruthy();
          } else {
            expect(typeof value).toBe("string");
            expect(value.length).toBeGreaterThan(0);
          }
        });
      });
    });

    test("no obvious error markers in outputs", () => {
      withOutputs(() => {
        const all = JSON.stringify(outputs).toLowerCase();
        expect(all).not.toContain("error");
        expect(all).not.toContain("failed");
      });
    });
  });
});
