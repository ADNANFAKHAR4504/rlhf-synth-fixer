import fs from "fs";
import path from "path";

const STACK_REL = "../lib/tap_stack.tf";
const stackPath = path.resolve(__dirname, STACK_REL);

describe("Terraform single-file stack: tap_stack.tf", () => {
  let content: string;

  beforeAll(() => {
    const exists = fs.existsSync(stackPath);
    if (!exists) {
      throw new Error(`Expected stack at: ${stackPath}`);
    }
    content = fs.readFileSync(stackPath, "utf8");
  });

  test("tap_stack.tf exists", () => {
    expect(fs.existsSync(stackPath)).toBe(true);
  });

  test("does NOT declare provider in tap_stack.tf (provider.tf owns providers)", () => {
    expect(content).not.toMatch(/\bprovider\s+"aws"\s*{/);
  });

  test("declares aws_region variable", () => {
    expect(content).toMatch(/variable\s+"aws_region"\s*{/);
  });

  test("declares aws_region variable with validation", () => {
    expect(content).toMatch(/validation\s*{/);
    expect(content).toMatch(/condition.*contains/);
    expect(content).toMatch(/us-east-1.*us-west-2.*eu-west-1/);
  });

  test("declares project_name variable", () => {
    expect(content).toMatch(/variable\s+"project_name"\s*{/);
  });

  test("declares service_name variable", () => {
    expect(content).toMatch(/variable\s+"service_name"\s*{/);
  });

  test("declares database_password variable as sensitive", () => {
    expect(content).toMatch(/variable\s+"database_password"\s*{/);
    expect(content).toMatch(/sensitive\s*=\s*true/);
  });

  test("declares vpc_cidr variable", () => {
    expect(content).toMatch(/variable\s+"vpc_cidr"\s*{/);
  });

  test("declares database_instance_class variable", () => {
    expect(content).toMatch(/variable\s+"database_instance_class"\s*{/);
  });

  test("declares database_allocated_storage variable with validation", () => {
    expect(content).toMatch(/variable\s+"database_allocated_storage"\s*{/);
    expect(content).toMatch(/validation\s*{/);
    expect(content).toMatch(/>= 20.*<= 65536/);
  });

  test("declares compute_instance_type variable", () => {
    expect(content).toMatch(/variable\s+"compute_instance_type"\s*{/);
  });

  test("declares compute_desired_capacity variable with validation", () => {
    expect(content).toMatch(/variable\s+"compute_desired_capacity"\s*{/);
    expect(content).toMatch(/validation\s*{/);
  });

  test("declares storage_buckets variable with complex type", () => {
    expect(content).toMatch(/variable\s+"storage_buckets"\s*{/);
    expect(content).toMatch(/type\s*=\s*map\(object\(/);
  });

  test("uses locals for common_tags", () => {
    expect(content).toMatch(/locals\s*{/);
    expect(content).toMatch(/common_tags\s*=/);
    expect(content).toMatch(/Environment\s*=\s*terraform\.workspace/);
  });

  test("uses locals for name_prefix with naming convention", () => {
    expect(content).toMatch(/name_prefix\s*=/);
    expect(content).toMatch(/\$\{local\.environment\}/);
    expect(content).toMatch(/\$\{local\.region\}/);
    expect(content).toMatch(/\$\{var\.service_name\}/);
  });

  test("uses merge() for resource tagging", () => {
    expect(content).toMatch(/merge\(local\.common_tags/);
  });

  test("uses for_each instead of count", () => {
    expect(content).toMatch(/for_each\s*=/);
    expect(content).not.toMatch(/count\s*=\s*[0-9]/);
  });

  test("creates VPC resource", () => {
    expect(content).toMatch(/resource\s+"aws_vpc"\s+"main"\s*{/);
    expect(content).toMatch(/cidr_block\s*=\s*var\.vpc_cidr/);
  });

  test("creates public subnets with for_each", () => {
    expect(content).toMatch(/resource\s+"aws_subnet"\s+"public"\s*{/);
    expect(content).toMatch(/for_each\s*=/);
  });

  test("creates private subnets with for_each", () => {
    expect(content).toMatch(/resource\s+"aws_subnet"\s+"private"\s*{/);
    expect(content).toMatch(/for_each\s*=/);
  });

  test("creates database subnets with for_each", () => {
    expect(content).toMatch(/resource\s+"aws_subnet"\s+"database"\s*{/);
    expect(content).toMatch(/for_each\s*=/);
  });

  test("creates internet gateway", () => {
    expect(content).toMatch(/resource\s+"aws_internet_gateway"\s+"main"\s*{/);
  });

  test("creates NAT gateway with conditional for_each", () => {
    expect(content).toMatch(/resource\s+"aws_nat_gateway"\s+"main"\s*{/);
    expect(content).toMatch(/for_each\s*=.*enable_nat_gateway/);
  });

  test("creates route tables", () => {
    expect(content).toMatch(/resource\s+"aws_route_table"\s+"public"\s*{/);
    expect(content).toMatch(/resource\s+"aws_route_table"\s+"private"\s*{/);
    expect(content).toMatch(/resource\s+"aws_route_table"\s+"database"\s*{/);
  });

  test("creates security groups for compute, database, and storage", () => {
    expect(content).toMatch(/resource\s+"aws_security_group"\s+"compute"\s*{/);
    expect(content).toMatch(/resource\s+"aws_security_group"\s+"database"\s*{/);
    expect(content).toMatch(/resource\s+"aws_security_group"\s+"storage"\s*{/);
  });

  test("creates KMS keys for database and S3", () => {
    expect(content).toMatch(/resource\s+"aws_kms_key"\s+"database"\s*{/);
    expect(content).toMatch(/resource\s+"aws_kms_key"\s+"s3"\s*{/);
    expect(content).toMatch(/enable_key_rotation\s*=\s*true/);
  });

  test("creates RDS instance", () => {
    expect(content).toMatch(/resource\s+"aws_db_instance"\s+"main"\s*{/);
    expect(content).toMatch(/engine\s*=\s*"postgres"/);
    expect(content).toMatch(/storage_encrypted\s*=\s*true/);
    expect(content).toMatch(/kms_key_id\s*=\s*aws_kms_key\.database\.arn/);
    expect(content).toMatch(/publicly_accessible\s*=\s*false/);
    expect(content).toMatch(/deletion_protection\s*=\s*false/);
  });

  test("creates S3 buckets with for_each", () => {
    expect(content).toMatch(/resource\s+"aws_s3_bucket"\s+"storage"\s*{/);
    expect(content).toMatch(/for_each\s*=\s*var\.storage_buckets/);
  });

  test("creates S3 bucket encryption configuration", () => {
    expect(content).toMatch(/resource\s+"aws_s3_bucket_server_side_encryption_configuration"/);
    expect(content).toMatch(/sse_algorithm\s*=\s*"aws:kms"/);
  });

  test("creates S3 bucket versioning", () => {
    expect(content).toMatch(/resource\s+"aws_s3_bucket_versioning"\s+"storage"/);
  });

  test("creates S3 bucket lifecycle configuration", () => {
    expect(content).toMatch(/resource\s+"aws_s3_bucket_lifecycle_configuration"/);
  });

  test("creates S3 bucket public access block", () => {
    expect(content).toMatch(/resource\s+"aws_s3_bucket_public_access_block"/);
  });

  test("creates launch template for compute", () => {
    expect(content).toMatch(/resource\s+"aws_launch_template"\s+"compute"\s*{/);
  });

  test("creates autoscaling group", () => {
    expect(content).toMatch(/resource\s+"aws_autoscaling_group"\s+"compute"\s*{/);
    expect(content).toMatch(/vpc_zone_identifier/);
  });

  test("creates VPC Flow Logs with conditional", () => {
    expect(content).toMatch(/resource\s+"aws_flow_log"\s+"vpc"/);
    expect(content).toMatch(/count\s*=.*enable_flow_logs/);
  });

  test("uses data sources for AWS resources", () => {
    expect(content).toMatch(/data\s+"aws_availability_zones"\s+"available"/);
    expect(content).toMatch(/data\s+"aws_caller_identity"\s+"current"/);
    expect(content).toMatch(/data\s+"aws_region"\s+"current"/);
    expect(content).toMatch(/data\s+"aws_ami"\s+"amazon_linux"/);
  });

  test("uses create_before_destroy lifecycle for zero downtime updates", () => {
    const lifecycleMatches = content.match(/lifecycle\s*{[^}]*create_before_destroy\s*=\s*true[^}]*}/g);
    expect(lifecycleMatches?.length).toBeGreaterThan(5);
  });

  test("creates outputs for all major resources", () => {
    expect(content).toMatch(/output\s+"vpc_id"/);
    expect(content).toMatch(/output\s+"public_subnet_ids"/);
    expect(content).toMatch(/output\s+"private_subnet_ids"/);
    expect(content).toMatch(/output\s+"database_subnet_ids"/);
    expect(content).toMatch(/output\s+"database_endpoint"/);
    expect(content).toMatch(/output\s+"database_arn"/);
    expect(content).toMatch(/output\s+"storage_bucket_names"/);
    expect(content).toMatch(/output\s+"storage_bucket_arns"/);
    expect(content).toMatch(/output\s+"compute_security_group_id"/);
    expect(content).toMatch(/output\s+"database_security_group_id"/);
    expect(content).toMatch(/output\s+"autoscaling_group_name"/);
    expect(content).toMatch(/output\s+"kms_key_ids"/);
  });

  test("database_endpoint output is marked sensitive", () => {
    const outputMatch = content.match(/output\s+"database_endpoint"\s*{[^}]*sensitive\s*=\s*true[^}]*}/s);
    expect(outputMatch).not.toBeNull();
  });

  test("uses workspace-aware configuration", () => {
    expect(content).toMatch(/terraform\.workspace/);
    expect(content).toMatch(/local\.environment/);
    expect(content).toMatch(/compute_instance_type_map/);
    expect(content).toMatch(/compute_capacity_map/);
    expect(content).toMatch(/database_instance_class_map/);
  });

  test("uses lookup for environment-specific values", () => {
    expect(content).toMatch(/lookup\(/);
    expect(content).toMatch(/dev.*staging.*prod/);
  });

  test("database uses multi_az based on environment", () => {
    expect(content).toMatch(/multi_az\s*=.*local\.environment/);
  });

  test("all resources follow naming convention", () => {
    const resourceMatches = content.match(/Name\s*=\s*"\$\{local\.name_prefix\}/g);
    expect(resourceMatches?.length).toBeGreaterThan(10);
  });

  test("uses relative module paths only (no external modules)", () => {
    const moduleMatches = content.match(/module\s+"[^"]+"\s*{/g);
    if (moduleMatches) {
      expect(moduleMatches.length).toBe(0);
    }
  });

  test("uses cidrsubnet for subnet calculation", () => {
    expect(content).toMatch(/cidrsubnet\(/);
  });

  test("RDS subnet group references database subnets", () => {
    expect(content).toMatch(/aws_db_subnet_group/);
    expect(content).toMatch(/subnet_ids\s*=\s*\[for subnet in aws_subnet\.database/);
  });

  test("security groups use proper ingress/egress rules", () => {
    expect(content).toMatch(/ingress\s*{/);
    expect(content).toMatch(/egress\s*{/);
    expect(content).toMatch(/security_groups\s*=\s*\[aws_security_group\.compute\.id\]/);
  });

  test("uses base64encode for user_data", () => {
    expect(content).toMatch(/base64encode\(/);
  });

  test("autoscaling group uses dynamic tags", () => {
    expect(content).toMatch(/dynamic\s+"tag"\s*{/);
    expect(content).toMatch(/for_each\s*=\s*local\.common_tags/);
  });
});
