import * as fs from "fs";
import * as path from "path";

const TAP_STACK_TF = path.resolve(__dirname, "../lib/tap_stack.tf");
const tf = fs.readFileSync(TAP_STACK_TF, "utf8");
const has = (regex: RegExp) => regex.test(tf);

describe("Terraform tap-stack static validation", () => {
  // General checks
  it("file exists and has sufficient length", () => {
    expect(fs.existsSync(TAP_STACK_TF)).toBe(true);
    expect(tf.length).toBeGreaterThan(60000); // matches large config attached
  });

  // ==== VARIABLES ====
  const expectedVariables = [
    "primary_region",
    "secondary_region",
    "allowed_ssh_cidr",
    "allowed_https_cidr",
    "instance_type",
    "db_instance_class"
  ];
  it("declares required input variables", () => {
    expectedVariables.forEach(v =>
      expect(has(new RegExp(`variable\\s+"${v}"`))).toBe(true)
    );
  });

  // ==== LOCALS ====
  it("declares common locals like project_name and common_tags", () => {
    expect(has(/locals\s*{[\s\S]*project_name/)).toBe(true);
    expect(has(/locals\s*{[\s\S]*common_tags/)).toBe(true);
    expect(has(/Environment\s+=\s+"Production"/)).toBe(true);
    expect(has(/ManagedBy\s+=\s+"Terraform"/)).toBe(true);
  });

  // ==== DATA SOURCES ====
  it("declares AMI and AZ data sources per region", () => {
    expect(has(/data\s+"aws_availability_zones"\s+"primary"/)).toBe(true);
    expect(has(/data\s+"aws_availability_zones"\s+"secondary"/)).toBe(true);
    expect(has(/data\s+"aws_ami"\s+"amazon_linux_primary"/)).toBe(true);
    expect(has(/data\s+"aws_ami"\s+"amazon_linux_secondary"/)).toBe(true);
  });

  // ==== NETWORKING ====
  ["primary", "secondary"].forEach(region => {
    it(`declares networking resources for ${region}`, () => {
      expect(has(new RegExp(`resource\\s+"aws_vpc"\\s+"${region}"`))).toBe(true);
      expect(has(new RegExp(`resource\\s+"aws_internet_gateway"\\s+"${region}"`))).toBe(true);
      expect(has(new RegExp(`resource\\s+"aws_nat_gateway"\\s+"${region}"`))).toBe(true);
      expect(has(new RegExp(`resource\\s+"aws_eip"\\s+"${region}_nat"`))).toBe(true);
      expect(has(new RegExp(`resource\\s+"aws_subnet"\\s+"${region}_public"`))).toBe(true);
      expect(has(new RegExp(`resource\\s+"aws_subnet"\\s+"${region}_private"`))).toBe(true);
      expect(has(new RegExp(`resource\\s+"aws_route_table"\\s+"${region}_public"`))).toBe(true);
      expect(has(new RegExp(`resource\\s+"aws_route_table"\\s+"${region}_private"`))).toBe(true);
    });
  });

  // ==== SECURITY GROUPS ====
  it("declares SGs for EC2, ALB, and RDS in both regions", () => {
    ["primary_ec2","secondary_ec2","primary_alb","secondary_alb","primary_rds","secondary_rds"]
      .forEach(sg => {
        expect(has(new RegExp(`resource\\s+"aws_security_group"\\s+"${sg}"`))).toBe(true);
      });
  });

  // ==== IAM ====
  it("declares EC2 IAM role, policy, and profile", () => {
    expect(has(/resource\s+"aws_iam_role"\s+"ec2_role"/)).toBe(true);
    expect(has(/resource\s+"aws_iam_role_policy"\s+"ec2_policy"/)).toBe(true);
    expect(has(/resource\s+"aws_iam_instance_profile"\s+"ec2_profile"/)).toBe(true);
  });

  it("declares IAM role+policy for S3 replication and Config", () => {
    expect(has(/resource\s+"aws_iam_role"\s+"s3_replication"/)).toBe(true);
    expect(has(/resource\s+"aws_iam_role_policy"\s+"s3_replication"/)).toBe(true);
    expect(has(/resource\s+"aws_iam_role"\s+"config_role"/)).toBe(true);
    expect(has(/resource\s+"aws_iam_role_policy_attachment"\s+"config_role_policy"/)).toBe(true);
  });

  // ==== SECRETS MANAGER ====
  it("declares secrets per region", () => {
    expect(has(/resource\s+"aws_secretsmanager_secret"\s+"primary_db_credentials"/)).toBe(true);
    expect(has(/resource\s+"aws_secretsmanager_secret"\s+"secondary_db_credentials"/)).toBe(true);
  });

  // ==== RDS ====
  ["primary", "secondary"].forEach(region => {
    it(`declares RDS instance and subnet group for ${region}`, () => {
      expect(has(new RegExp(`resource\\s+"aws_db_instance"\\s+"${region}"`))).toBe(true);
      expect(has(new RegExp(`resource\\s+"aws_db_subnet_group"\\s+"${region}"`))).toBe(true);
      // enforce encryption, multi_az and private
      expect(
        tf.match(new RegExp(`resource\\s+"aws_db_instance"\\s+"${region}"[\\s\\S]*storage_encrypted\\s*=\\s*true`))
      ).not.toBeNull();
      expect(
        tf.match(new RegExp(`resource\\s+"aws_db_instance"\\s+"${region}"[\\s\\S]*multi_az\\s*=\\s*true`))
      ).not.toBeNull();
      expect(
        tf.match(new RegExp(`resource\\s+"aws_db_instance"\\s+"${region}"[\\s\\S]*publicly_accessible\\s*=\\s*false`))
      ).not.toBeNull();
    });
  });

  // ==== S3 ====
  it("declares S3 buckets, versioning, and replication", () => {
    expect(has(/resource\s+"aws_s3_bucket"\s+"primary"/)).toBe(true);
    expect(has(/resource\s+"aws_s3_bucket"\s+"secondary"/)).toBe(true);
    expect(has(/resource\s+"aws_s3_bucket_versioning"\s+"primary"/)).toBe(true);
    expect(has(/resource\s+"aws_s3_bucket_versioning"\s+"secondary"/)).toBe(true);
    expect(has(/resource\s+"aws_s3_bucket_replication_configuration"\s+"primary_to_secondary"/)).toBe(true);
  });

  // ==== COMPUTE ====
  ["primary","secondary"].forEach(region => {
    it(`declares launch template and autoscaling group for ${region}`, () => {
      expect(has(new RegExp(`resource\\s+"aws_launch_template"\\s+"${region}"`))).toBe(true);
      expect(has(new RegExp(`resource\\s+"aws_autoscaling_group"\\s+"${region}"`))).toBe(true);
    });
  });

  // ==== LOAD BALANCER ====
  ["primary","secondary"].forEach(region => {
    it(`declares ALB, target group, and listener for ${region}`, () => {
      expect(has(new RegExp(`resource\\s+"aws_lb"\\s+"${region}"`))).toBe(true);
      expect(has(new RegExp(`resource\\s+"aws_lb_target_group"\\s+"${region}"`))).toBe(true);
      expect(has(new RegExp(`resource\\s+"aws_lb_listener"\\s+"${region}"`))).toBe(true);
    });
  });

  // ==== CLOUDWATCH ====
  const alarms = ["primary_cpu_high","secondary_cpu_high","primary_rds_cpu","secondary_rds_cpu"];
  it("declares monitoring alarms for ASG and RDS", () => {
    alarms.forEach(a => expect(has(new RegExp(`resource\\s+"aws_cloudwatch_metric_alarm"\\s+"${a}"`))).toBe(true));
  });

  it("declares scaling policies per region", () => {
    ["primary_scale_up","primary_scale_down","secondary_scale_up","secondary_scale_down"]
      .forEach(p => expect(has(new RegExp(`resource\\s+"aws_autoscaling_policy"\\s+"${p}"`))).toBe(true));
  });

  // ==== AWS CONFIG ====
  it("declares Config recorders, delivery channels and statuses", () => {
    expect(has(/resource\s+"aws_config_configuration_recorder"\s+"primary"/)).toBe(true);
    expect(has(/resource\s+"aws_config_configuration_recorder"\s+"secondary"/)).toBe(true);
    expect(has(/resource\s+"aws_config_delivery_channel"\s+"primary"/)).toBe(true);
    expect(has(/resource\s+"aws_config_delivery_channel"\s+"secondary"/)).toBe(true);
    expect(has(/resource\s+"aws_config_configuration_recorder_status"\s+"primary"/)).toBe(true);
    expect(has(/resource\s+"aws_config_configuration_recorder_status"\s+"secondary"/)).toBe(true);
  });

  // ==== RANDOM SECRETS ====
  it("declares random strings and passwords", () => {
    expect(has(/resource\s+"random_string"\s+"primary_db_username"/)).toBe(true);
    expect(has(/resource\s+"random_password"\s+"primary_db_password"/)).toBe(true);
    expect(has(/resource\s+"random_string"\s+"secondary_db_username"/)).toBe(true);
    expect(has(/resource\s+"random_password"\s+"secondary_db_password"/)).toBe(true);
    expect(has(/resource\s+"random_string"\s+"bucket_suffix"/)).toBe(true);
  });

  // ==== OUTPUTS ====
  it("has required outputs for VPCs, RDS, S3, ALB, ASG, IAM, Config etc", () => {
    const mustHave = [
      "primary_vpc_id","secondary_vpc_id",
      "primary_rds_endpoint","secondary_rds_endpoint",
      "primary_s3_bucket_name","secondary_s3_bucket_name",
      "primary_alb_dns_name","secondary_alb_dns_name",
      "primary_asg_name","secondary_asg_name",
      "ec2_iam_role_arn","ec2_instance_profile_arn",
      "s3_replication_role_arn","config_role_arn"
    ];
    mustHave.forEach(o => expect(has(new RegExp(`output\\s+"${o}"`))).toBe(true));

    // Ensure sensitive outputs like password/secret are not directly exposed
    expect(has(/output\s+.*(password|secret_value)/i)).toBe(false);
  });

  // ==== TAG STANDARDS ====
  it("applies common tags consistently", () => {
    expect(has(/tags\s+=\s+merge\(local\.common_tags,/)).toBe(true);
  });
});
