const { execSync } = require("child_process");

interface ResourceChange {
  type: string;
  change: {
    after: {
      tags?: Record<string, string | undefined> & {
        Name?: string;
      };
      enable_dns_support?: boolean;
      enable_dns_hostnames?: boolean;
      ingress?: Array<{
        from_port: number;
        cidr_blocks: string[];
      }>;
      is_multi_region_trail?: boolean;
      enable_log_file_validation?: boolean;
    };
  };
}



interface TerraformPlan {
  resource_changes: ResourceChange[];
}

let plan: TerraformPlan;

beforeAll(() => {
  // Run terraform plan and output JSON
  execSync("terraform init -input=false", { stdio: "inherit" });
  execSync("terraform plan -out=tfplan -input=false", { stdio: "inherit" });
  const output = execSync("terraform show -json tfplan");
  plan = JSON.parse(output.toString());
});

describe("Terraform Multi-Region Infrastructure", () => {
  test("Terraform version >= 1.0.0", () => {
    const versionOut = execSync("terraform version -json");
    const version = JSON.parse(versionOut.toString()).terraform_version;
    expect(version >= "1.0.0").toBe(true);
  });

  test("All VPCs must have DNS support and hostnames enabled", () => {
    const vpcs = plan.resource_changes.filter((r: ResourceChange) => r.type === "aws_vpc");
    vpcs.forEach((vpc: ResourceChange) => {
      const after = vpc.change.after;
      expect(after.enable_dns_support).toBe(true);
      expect(after.enable_dns_hostnames).toBe(true);
    });
  });

  test("Each region must have at least 2 public and 2 private subnets", () => {
    const subnets = plan.resource_changes.filter((r: ResourceChange) => r.type === "aws_subnet");
    const grouped: { [key: string]: { public: number; private: number } } = {};
    subnets.forEach((s: ResourceChange) => {
      const name = s.change.after.tags?.Name || "unknown";
      const region = name.includes("eu-central-1")
        ? "eu-central-1"
        : "us-east-1";
      grouped[region] = grouped[region] || { public: 0, private: 0 };
      if (name.includes("public")) grouped[region].public++;
      if (name.includes("private")) grouped[region].private++;
    });
    Object.values(grouped).forEach((region: { public: number; private: number }) => {
      expect(region.public).toBeGreaterThanOrEqual(2);
      expect(region.private).toBeGreaterThanOrEqual(2);
    });
  });

  test("All Security Groups must restrict ingress to allowed CIDRs", () => {
    const sgs = plan.resource_changes.filter((r: ResourceChange) => r.type === "aws_security_group");
    sgs.forEach((sg: ResourceChange) => {
      const ingresses = sg.change.after.ingress || [];
      ingresses.forEach((rule: { from_port: number; cidr_blocks: string[] }) => {
        if (rule.from_port === 80 || rule.from_port === 443) {
          expect(rule.cidr_blocks).not.toContain("0.0.0.0/0");
        }
      });
    });
  });

  test("All resources must have required tags", () => {
    const required = ["Owner", "Purpose", "Environment", "CostCenter", "Project"];
    plan.resource_changes.forEach((r: ResourceChange) => {
      const tags = r.change.after.tags || {};
      required.forEach(tag => {
        expect(tags).toHaveProperty(tag);
      });
    });
  });

  test("All data at rest must be encrypted with KMS", () => {
    const kmsUsage = plan.resource_changes.filter((r: ResourceChange) =>
      ["aws_s3_bucket_encryption", "aws_kms_key", "aws_secretsmanager_secret"].includes(r.type)
    );
    expect(kmsUsage.length).toBeGreaterThan(0);
  });

  test("CloudTrail must be multi-region and log file validation enabled", () => {
    const trails = plan.resource_changes.filter((r: ResourceChange) => r.type === "aws_cloudtrail");
    expect(trails.length).toBeGreaterThan(0);
    trails.forEach((trail: ResourceChange) => {
      const after = trail.change.after;
      expect(after.is_multi_region_trail).toBe(true);
      expect(after.enable_log_file_validation).toBe(true);
    });
  });

  test("Auto Scaling Groups must exist", () => {
    const asgs = plan.resource_changes.filter((r: ResourceChange) => r.type === "aws_autoscaling_group");
    expect(asgs.length).toBeGreaterThanOrEqual(2); // one per region
  });

  test("CloudFront distribution must exist", () => {
    const cf = plan.resource_changes.find((r: ResourceChange) => r.type === "aws_cloudfront_distribution");
    expect(cf).toBeDefined();
  });

  test("VPC peering connection must exist", () => {
    const pcx = plan.resource_changes.find((r: ResourceChange) => r.type === "aws_vpc_peering_connection");
    expect(pcx).toBeDefined();
  });
});