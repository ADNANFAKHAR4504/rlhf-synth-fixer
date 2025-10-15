// test/terraform.unit.test.ts
import fs from "fs";
import path from "path";

let tfContent: string;

beforeAll(() => {
  const tfPath = path.join(__dirname, "../lib/tap_stack.tf");
  tfContent = fs.readFileSync(tfPath, "utf8");
});

describe("tap_stack.tf comprehensive verification", () => {

  // ===============================
  // VARIABLES
  // ===============================
  it("declares all required variables", () => {
    const expectedVars = [
      "primary_region",
      "secondary_region",
      "environment",
      "project_name",
      "db_instance_class",
      "db_engine_version",
      "db_allocated_storage",
    ];
    expectedVars.forEach(v => {
      expect(tfContent).toMatch(new RegExp(`variable\\s+"${v}"`));
    });
  });

  // ===============================
  // LOCALS
  // ===============================
  it("defines all expected locals", () => {
    const expectedLocals = [
      "common_tags",
      "name_prefix",
      "primary_vpc_cidr",
      "secondary_vpc_cidr",
      "primary_public_subnet_cidrs",
      "primary_private_subnet_cidrs",
      "secondary_public_subnet_cidrs",
      "secondary_private_subnet_cidrs",
      "db_username",
      "db_password",
      "db_name",
    ];
    expectedLocals.forEach(l => {
      expect(tfContent).toMatch(new RegExp(`\\b${l}\\s*=`));
    });
  });

  // ===============================
  // RANDOM RESOURCES
  // ===============================
  ["random_string.suffix", "random_string.db_username", "random_password.db_password"].forEach(r => {
    it(`defines random resource ${r}`, () => {
      const [type, name] = r.split(".");
      expect(tfContent).toMatch(new RegExp(`resource\\s+"${type}"\\s+"${name}"`));
    });
  });

  // ===============================
  // VPCs & Networking
  // ===============================
  const vpcs = ["aws_vpc.primary", "aws_vpc.secondary"];
  const igws = ["aws_internet_gateway.primary", "aws_internet_gateway.secondary"];
  const subnets = [
    "aws_subnet.primary_public",
    "aws_subnet.primary_private",
    "aws_subnet.secondary_public",
    "aws_subnet.secondary_private",
  ];
  const eips = ["aws_eip.primary_nat", "aws_eip.secondary_nat"];
  const nats = ["aws_nat_gateway.primary", "aws_nat_gateway.secondary"];
  const routeTables = [
    "aws_route_table.primary_public",
    "aws_route_table.primary_private",
    "aws_route_table.secondary_public",
    "aws_route_table.secondary_private",
  ];
  const rtAssociations = [
    "aws_route_table_association.primary_public",
    "aws_route_table_association.primary_private",
    "aws_route_table_association.secondary_public",
    "aws_route_table_association.secondary_private",
  ];

  [...vpcs, ...igws, ...subnets, ...eips, ...nats, ...routeTables, ...rtAssociations].forEach(r => {
    it(`defines networking resource ${r}`, () => {
      const [type, name] = r.split(".");
      expect(tfContent).toMatch(new RegExp(`resource\\s+"${type}"\\s+"${name}"`));
    });
  });

  // ===============================
  // SECURITY GROUPS
  // ===============================
  ["aws_security_group.primary_rds", "aws_security_group.secondary_rds"].forEach(r => {
    it(`defines security group ${r}`, () => {
      const [type, name] = r.split(".");
      expect(tfContent).toMatch(new RegExp(`resource\\s+"${type}"\\s+"${name}"`));
      // check MySQL ingress
      expect(tfContent).toMatch(/from_port\s*=\s*3306/);
      expect(tfContent).toMatch(/to_port\s*=\s*3306/);
      expect(tfContent).toMatch(/protocol\s*=\s*"tcp"/);
    });
  });

  // ===============================
  // DB SUBNET GROUPS & RDS
  // ===============================
  ["aws_db_subnet_group.primary", "aws_db_subnet_group.secondary"].forEach(r => {
    it(`defines DB subnet group ${r}`, () => {
      const [type, name] = r.split(".");
      expect(tfContent).toMatch(new RegExp(`resource\\s+"${type}"\\s+"${name}"`));
    });
  });

  ["aws_db_instance.primary", "aws_db_instance.secondary"].forEach(r => {
    it(`defines RDS instance ${r}`, () => {
      const [type, name] = r.split(".");
      expect(tfContent).toMatch(new RegExp(`resource\\s+"${type}"\\s+"${name}"`));
      // check multi_az & storage encryption
      expect(tfContent).toMatch(/multi_az\s*=\s*true/);
      expect(tfContent).toMatch(/storage_encrypted\s*=\s*true/);
    });
  });

  // ===============================
  // SECRETS MANAGER
  // ===============================
  ["aws_secretsmanager_secret.primary_rds", "aws_secretsmanager_secret.secondary_rds"].forEach(r => {
    it(`defines secrets manager secret ${r}`, () => {
      const [type, name] = r.split(".");
      expect(tfContent).toMatch(new RegExp(`resource\\s+"${type}"\\s+"${name}"`));
    });
  });

  // ===============================
  // S3 BUCKETS
  // ===============================
  ["aws_s3_bucket.primary", "aws_s3_bucket.secondary"].forEach(r => {
    it(`defines S3 bucket ${r}`, () => {
      const [type, name] = r.split(".");
      expect(tfContent).toMatch(new RegExp(`resource\\s+"${type}"\\s+"${name}"`));
      // check encryption
      expect(tfContent).toMatch(/sse_algorithm\s*=\s*"AES256"/);
      // check versioning
      expect(tfContent).toMatch(/versioning_configuration\s*{[\s\S]*status\s*=\s*"Enabled"/);
      // check public access block
      expect(tfContent).toMatch(/block_public_acls\s*=\s*true/);
      expect(tfContent).toMatch(/restrict_public_buckets\s*=\s*true/);
    });
  });

  // ===============================
  // CLOUDWATCH ALARMS
  // ===============================
  [
    "aws_cloudwatch_metric_alarm.primary_rds_cpu",
    "aws_cloudwatch_metric_alarm.primary_rds_storage",
    "aws_cloudwatch_metric_alarm.secondary_rds_cpu",
    "aws_cloudwatch_metric_alarm.secondary_rds_storage",
  ].forEach(r => {
    it(`defines CloudWatch alarm ${r}`, () => {
      const [type, name] = r.split(".");
      expect(tfContent).toMatch(new RegExp(`resource\\s+"${type}"\\s+"${name}"`));
    });
  });

  // ===============================
  // IAM ROLES, POLICIES & ATTACHMENTS
  // ===============================
  [
    "aws_iam_role.application",
    "aws_iam_role.rds_monitoring",
    "aws_iam_instance_profile.application",
    "aws_iam_policy.s3_access",
    "aws_iam_policy.secrets_access",
    "aws_iam_role_policy_attachment.application_s3",
    "aws_iam_role_policy_attachment.application_secrets",
    "aws_iam_role_policy_attachment.rds_monitoring",
  ].forEach(r => {
    it(`defines IAM resource ${r}`, () => {
      const [type, name] = r.split(".");
      expect(tfContent).toMatch(new RegExp(`resource\\s+"${type}"\\s+"${name}"`));
    });
  });

  // ===============================
  // OUTPUTS
  // ===============================
  [
    "primary_vpc_id",
    "primary_vpc_cidr",
    "primary_public_subnet_ids",
    "primary_private_subnet_ids",
    "primary_nat_gateway_ids",
    "primary_internet_gateway_id",
    "primary_rds_endpoint",
    "primary_rds_id",
    "primary_rds_security_group_id",
    "primary_s3_bucket_name",
    "primary_s3_bucket_arn",
    "primary_secrets_manager_arn",
    "primary_cloudwatch_cpu_alarm_arn",
    "primary_cloudwatch_storage_alarm_arn",
    "secondary_vpc_id",
    "secondary_vpc_cidr",
    "secondary_public_subnet_ids",
    "secondary_private_subnet_ids",
    "secondary_nat_gateway_ids",
    "secondary_internet_gateway_id",
    "secondary_rds_endpoint",
    "secondary_rds_id",
    "secondary_rds_security_group_id",
    "secondary_s3_bucket_name",
    "secondary_s3_bucket_arn",
    "secondary_secrets_manager_arn",
    "secondary_cloudwatch_cpu_alarm_arn",
    "secondary_cloudwatch_storage_alarm_arn",
    "application_role_arn",
    "application_instance_profile_arn",
    "db_name",
    "db_username",
    "resource_suffix",
    "deployment_timestamp",
  ].forEach(output => {
    it(`defines output ${output}`, () => {
      expect(tfContent).toMatch(new RegExp(`output\\s+"${output}"`));
    });
  });

});
