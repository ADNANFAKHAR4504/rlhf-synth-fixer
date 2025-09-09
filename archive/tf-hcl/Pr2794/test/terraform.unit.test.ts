// Template: Add to your Jest/Mocha test file
import * as fs from "fs";
import * as path from "path";

const TAP_STACK_TF = path.resolve(__dirname, "../lib/tap_stack.tf");
const tf = fs.readFileSync(TAP_STACK_TF, "utf8");

const has = (regex: RegExp) => regex.test(tf);
const resourceBlockHas = (resourceType: string, resourceName: string, field: string) =>
  new RegExp(`resource\\s+"${resourceType}"\\s+"${resourceName}"[\\s\\S]*${field}\\s*=`).test(tf);

describe("Terraform tap-stack.tf Comprehensive Validation", () => {
  // FILE
  it("should exist and not be empty/minimal", () => {
    expect(fs.existsSync(TAP_STACK_TF)).toBe(true);
    expect(tf.length).toBeGreaterThan(10000);
  });

  // VARIABLES
  // Check for all variables (expand as needed)
  ["primary_region", "secondary_region", "environment", "project_name", "allowed_ssh_cidr", "allowed_https_cidr", "instance_type", "domain_name", "notification_email"].forEach(v => {
    it(`has variable ${v}`, () => {
      expect(has(new RegExp(`variable\\s+"${v}"`))).toBe(true);
    });
  });

  // LOCALS
  it("defines common_tags and standard VPC/subnet CIDRs", () => {
    expect(has(/locals\s*{[\s\S]*common_tags/)).toBe(true);
    expect(has(/primary_prefix\s*=\s*"\${var.project_name}-\${var.primary_region}"/)).toBe(true);
    expect(has(/secondary_prefix\s*=\s*"\${var.project_name}-\${var.secondary_region}"/)).toBe(true);
    expect(has(/primary_vpc_cidr\s*=\s*"10\.0\.0\.0\/16"/)).toBe(true);
    expect(has(/secondary_vpc_cidr\s*=\s*"10\.1\.0\.0\/16"/)).toBe(true);
  });

  // DATA SOURCES
  ["aws_availability_zones"].forEach(ds => {
    ["primary", "secondary"].forEach(region => {
      it(`has data source "${ds}" for ${region}`, () => {
        expect(has(new RegExp(`data\\s+"${ds}"\\s+"${region}"`))).toBe(true);
      });
    });
  });

  // NETWORK INFRASTRUCTURE
  ["vpc", "internet_gateway", "subnet", "eip", "nat_gateway", "route_table", "route_table_association"]
    .forEach(resource => {
      ["primary", "secondary"].forEach(region => {
        it(`has aws_${resource} resource for ${region}`, () => {
          expect(has(new RegExp(`resource\\s+"aws_${resource}"\\s+"${region}`))).toBe(true);
        });
      });
    });

  // SECURITY GROUPS
  ["primary_ec2", "secondary_ec2", "alb"].forEach(sg => {
    it(`has security group '${sg}' defined`, () => {
      expect(has(new RegExp(`resource\\s+"aws_security_group"\\s+"${sg}"`))).toBe(true);
    });
  });

  // EC2 INSTANCES
  ["primary", "secondary"].forEach(region => {
    it(`deploys EC2 instance in ${region}`, () => {
      expect(has(new RegExp(`resource\\s+"aws_instance"\\s+"${region}"`))).toBe(true);
      expect(resourceBlockHas("aws_instance", region, "user_data")).toBe(true);
    });
  });

  // LOAD BALANCER / ASG
  ["primary"].forEach(region => { // Only primary region in this file
    ["lb", "lb_target_group", "lb_listener", "launch_template"].forEach(resource => {
      it(`has ${resource} resource for ${region}`, () => {
        expect(has(new RegExp(`resource\\s+"aws_${resource}"\\s+"${region}"`))).toBe(true);
      });
    });
  });

  // S3 RESOURCES & REPLICATION
  ["primary", "secondary"].forEach(region => {
    it(`defines S3 bucket with versioning/encryption for ${region}`, () => {
      expect(has(new RegExp(`resource\\s+"aws_s3_bucket"\\s+"${region}"`))).toBe(true);
      expect(has(new RegExp(`resource\\s+"aws_s3_bucket_versioning"\\s+"${region}"`))).toBe(true);
      expect(has(new RegExp(`resource\\s+"aws_s3_bucket_server_side_encryption_configuration"\\s+"${region}"`))).toBe(true);
    });
  });
  it("declares bucket replication configuration", () => {
    expect(has(/resource\s+"aws_s3_bucket_replication_configuration"\s+"primary_to_secondary"/)).toBe(true);
  });
  it("uses a random bucket name suffix", () => {
    expect(has(/resource\s+"random_string"\s+"bucket_suffix"/)).toBe(true);
  });

  // CLOUDWATCH & SNS
  [
    "sns_topic", "sns_topic_subscription", "cloudwatch_metric_alarm"
  ].forEach(r => {
    it(`has ${r} resources present`, () => {
      expect(has(new RegExp(`resource\\s+"aws_${r}"`))).toBe(true);
    });
  });

  it("has CloudWatch alarms on EC2, ASG, ALB health", () => {
    [
      "primary_cpu", "secondary_cpu", "alb_health", "asg_cpu", "scale_up_alarm", "scale_down_alarm"
    ].forEach(alarm => {
      expect(has(new RegExp(`resource\\s+"aws_cloudwatch_metric_alarm"\\s+"${alarm}"`))).toBe(true);
    });
  });

  // ROUTE53
  ["route53_zone", "route53_health_check", "route53_record"].forEach(r => {
    it(`has ${r} resource`, () => {
      expect(has(new RegExp(`resource\\s+"aws_${r}"`))).toBe(true);
    });
  });

  // KMS
  ["kms_key", "kms_alias"].forEach(r => {
    ["s3_primary", "s3_secondary"].forEach(k => {
      it(`declares ${r} "${k}"`, () => {
        expect(has(new RegExp(`resource\\s+"aws_${r}"\\s+"${k}"`))).toBe(true);
      });
    });
  });

  // OUTPUTS
  [
    "primary_vpc_id", "secondary_vpc_id", "primary_instance_id", "secondary_instance_id", 
    "primary_s3_bucket_name", "secondary_s3_bucket_name", "ec2_iam_role_arn", 
    "s3_replication_role_arn", "primary_availability_zones", "secondary_availability_zones"
  ].forEach(out => {
    it(`exports output ${out}`, () => {
      expect(has(new RegExp(`output\\s+"${out}"`))).toBe(true);
    });
  });

  // SENSITIVE OUTPUTS
  it("should not output secrets or passwords", () => {
    expect(has(/output\s+.*password/i)).toBe(false);
    expect(has(/output\s+.*secret_string/i)).toBe(false);
    expect(has(/output\s+.*secret_value/i)).toBe(false);
  });

  // TAGGING STANDARDS
  it("tags resources using ManagedBy & Project standard", () => {
    expect(has(/tags\s+=\s+merge\(local\.common_tags,/)).toBe(true);
    expect(has(/ManagedBy\s+=\s+"Terraform"/)).toBe(true);
    expect(has(/Project\s+=\s*var\.project_name/)).toBe(true);
  });
});
