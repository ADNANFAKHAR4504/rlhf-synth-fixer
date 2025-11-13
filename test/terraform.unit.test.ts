import fs from "fs";
import path from "path";

const LIB_DIR = path.resolve(__dirname, "../lib");

const read = (filename: string): string =>
  fs.readFileSync(path.join(LIB_DIR, filename), "utf8");

describe("Terraform EMR stack conformance", () => {
  const mainTf = read("main.tf");
  const autoscalingTf = read("autoscaling.tf");
  const variablesTf = read("variables.tf");
  const tapStackTf = read("tap_stack.tf");
  const iamTf = read("iam.tf");
  const bootstrapSh = read("bootstrap.sh");

  test("tap_stack.tf wires shared locals and outputs without redefining providers", () => {
    expect(tapStackTf).not.toMatch(/\bprovider\s+"aws"\s*{/);
    expect(tapStackTf).toMatch(/locals\s+{/);
    expect(tapStackTf).toMatch(/output\s+"emr_master_public_dns"/);
    expect(tapStackTf).toMatch(/data\s+"aws_region"\s+"current"/);
  });

  test("variables enforce environment suffix, region, and subnet expectations", () => {
    expect(variablesTf).toMatch(/variable\s+"environment_suffix"/);
    expect(variablesTf).toMatch(/variable\s+"aws_region"/);
    expect(variablesTf).toMatch(/length\(var\.private_subnet_ids\) >= 2/);
    expect(variablesTf).toMatch(/var\.core_instance_count >= 2/);
  });

  test("EMR cluster uses secure configuration, logging, and bootstrap action", () => {
    expect(mainTf).toMatch(/resource\s+"aws_emr_cluster"\s+"main"/);
    expect(mainTf).toMatch(/termination_protection\s*=\s*true/);
    expect(mainTf).toMatch(/auto_termination_policy\s*{\s*idle_timeout\s*=\s*var\.idle_timeout_seconds/s);
    expect(mainTf).toMatch(/bootstrap\/install-analytics-libs\.sh/);
    expect(mainTf).toMatch(/log_uri\s*=\s*"s3:\/\/\$\{aws_s3_bucket\.logs\.bucket}\/emr-logs\/"/);
    expect(mainTf).toMatch(/security_configuration\s*=\s*aws_emr_security_configuration\.main\.name/);
  });

  test("network security groups limit SSH and allow intra-cluster traffic", () => {
    expect(mainTf).toMatch(/resource\s+"aws_security_group"\s+"emr_master"/);
    expect(mainTf).toMatch(/ingress[^}]*tcp[^}]*22[^}]*var\.corporate_cidr/s);
    expect(mainTf).toMatch(/aws_security_group_rule"\s+"core_task_self"/);
  });

  test("S3 buckets enable encryption, versioning, and block public access", () => {
    ["raw", "curated", "logs"].forEach((logical) => {
      expect(mainTf).toMatch(
        new RegExp(`aws_s3_bucket_server_side_encryption_configuration"\\s+"${logical}"`)
      );
      expect(mainTf).toMatch(
        new RegExp(`aws_s3_bucket_versioning"\\s+"${logical}"`)
      );
      expect(mainTf).toMatch(
        new RegExp(`aws_s3_bucket_public_access_block"\\s+"${logical}"`)
      );
    });
  });

  test("task instance group is configured for Spot with autoscaling headroom", () => {
    expect(mainTf).toMatch(/resource\s+"aws_emr_instance_group"\s+"task"/);
    expect(mainTf).toMatch(/bid_price\s*=\s*var\.task_spot_bid_price/);
    expect(mainTf).toMatch(/instance_count\s*=\s*max\(1,\s*var\.task_instance_min\)/);
    expect(mainTf).toMatch(/autoscaling_policy\s*=\s*jsonencode/);
    expect(mainTf).toMatch(/ScaleOutOnYarnMemory/);
    expect(mainTf).toMatch(/var\.yarn_memory_scale_out_threshold/);
    expect(mainTf).toMatch(/var\.yarn_memory_scale_in_threshold/);
  });

  test("IAM policies restrict S3 access to specific buckets and log prefixes", () => {
    expect(iamTf).toMatch(/aws_iam_role_policy"\s+"emr_s3_access"/);
    expect(iamTf).toMatch(/ListBucket/);
    expect(iamTf).not.toMatch(/Resource\s*=\s*"\*"/);
    expect(iamTf).toMatch(/aws_s3_bucket\.logs\.arn}\/bootstrap\//);
  });

  test("bootstrap script installs required analytics libraries idempotently", () => {
    expect(bootstrapSh).toMatch(/numpy==1\.24\.3/);
    expect(bootstrapSh).toMatch(/pandas==2\.0\.3/);
    expect(bootstrapSh).toMatch(/pyarrow==12\.0\.1/);
    expect(bootstrapSh).toMatch(/set -euo pipefail/);
  });
});
