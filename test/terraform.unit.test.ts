// tests/unit/unit-tests.ts
// Comprehensive unit tests for ../lib/tap_stack.tf based on prompt.md requirements
// No Terraform or CDKTF commands are executed.

import fs from "fs";
import path from "path";

const STACK_REL = "../lib/tap_stack.tf";
const stackPath = path.resolve(__dirname, STACK_REL);

describe("Terraform Infrastructure Requirements - Unit Tests", () => {
  let content: string;

  beforeAll(() => {
    content = fs.readFileSync(stackPath, "utf8");
  });

  describe("Basic File Requirements", () => {
    test("tap_stack.tf exists", () => {
      const exists = fs.existsSync(stackPath);
      if (!exists) {
        console.error(`[unit] Expected stack at: ${stackPath}`);
      }
      expect(exists).toBe(true);
    });

    test("does NOT declare provider in tap_stack.tf (provider.tf owns providers)", () => {
      expect(content).not.toMatch(/\bprovider\s+"aws"\s*{/);
    });

    test("declares aws_region variable in tap_stack.tf", () => {
      expect(content).toMatch(/variable\s+"aws_region"\s*{/);
    });
  });

  describe("Network Architecture Requirements", () => {
    test("VPC spans multiple availability zones", () => {
      expect(content).toMatch(/aws_vpc\.main/);
      expect(content).toMatch(/enable_dns_hostnames\s*=\s*true/);
      expect(content).toMatch(/enable_dns_support\s*=\s*true/);
    });

    test("Public and private subnets across at least 2 AZs", () => {
      expect(content).toMatch(/aws_subnet\.public/);
      expect(content).toMatch(/aws_subnet\.private/);
      expect(content).toMatch(/count\s*=\s*min\(2,\s*length\(data\.aws_availability_zones\.available\.names\)\)/);
    });

    test("Database subnets for RDS isolation", () => {
      expect(content).toMatch(/aws_subnet\.database/);
    });

    test("Internet Gateway for public resources", () => {
      expect(content).toMatch(/aws_internet_gateway\.main/);
    });

    test("NAT Gateway for private resources", () => {
      expect(content).toMatch(/aws_nat_gateway\.main/);
    });

    test("Proper routing tables configured", () => {
      expect(content).toMatch(/aws_route_table\.public/);
      expect(content).toMatch(/aws_route_table\.private/);
      expect(content).toMatch(/aws_route_table_association/);
    });
  });

  describe("Load Balancing & Traffic Distribution", () => {
    test("Application Load Balancer in public subnets", () => {
      expect(content).toMatch(/aws_lb\.main/);
      expect(content).toMatch(/load_balancer_type\s*=\s*"application"/);
      expect(content).toMatch(/internal\s*=\s*false/);
    });

    test("Health checks for backend instances", () => {
      expect(content).toMatch(/aws_lb_target_group\.main/);
      expect(content).toMatch(/health_check/);
      expect(content).toMatch(/enabled\s*=\s*true/);
    });

    test("ALB listener configured", () => {
      expect(content).toMatch(/aws_lb_listener/);
      expect(content).toMatch(/port.*=.*"80"/);
      expect(content).toMatch(/protocol.*=.*"HTTP"/);
    });
  });

  describe("Compute Resources", () => {
    test("Auto Scaling Group with EC2 instances in private subnets", () => {
      expect(content).toMatch(/aws_autoscaling_group\.main/);
      expect(content).toMatch(/vpc_zone_identifier\s*=\s*aws_subnet\.private/);
    });

    test("Minimum 2 instances for high availability", () => {
      expect(content).toMatch(/min_size\s*=\s*var\.min_size/);
      expect(content).toMatch(/variable\s+"min_size"/);
      expect(content).toMatch(/default\s*=\s*2/);
    });

    test("Scaling policies based on demand", () => {
      expect(content).toMatch(/aws_autoscaling_policy\.scale_up/);
      expect(content).toMatch(/aws_autoscaling_policy\.scale_down/);
      expect(content).toMatch(/aws_cloudwatch_metric_alarm/);
    });

    test("IAM roles and policies for secure AWS service access", () => {
      expect(content).toMatch(/aws_iam_role\.ec2_role/);
      expect(content).toMatch(/aws_iam_policy\.s3_access/);
      expect(content).toMatch(/aws_iam_instance_profile/);
    });

    test("Launch template with proper configuration", () => {
      expect(content).toMatch(/aws_launch_template\.main/);
      expect(content).toMatch(/instance_type\s*=\s*var\.instance_type/);
      expect(content).toMatch(/user_data\s*=\s*base64encode/);
    });
  });

  describe("Database Layer", () => {
    test("RDS instance in private subnets", () => {
      expect(content).toMatch(/aws_db_instance\.main/);
      expect(content).toMatch(/aws_db_subnet_group\.main/);
    });

    test("Multi-AZ deployment for high availability", () => {
      expect(content).toMatch(/multi_az\s*=\s*true/);
    });

    test("Database isolated from direct internet access", () => {
      expect(content).toMatch(/aws_security_group\.rds/);
      expect(content).toMatch(/from_port\s*=\s*3306/);
      expect(content).toMatch(/to_port\s*=\s*3306/);
    });

    test("RDS parameter group configured", () => {
      expect(content).toMatch(/aws_db_parameter_group\.main/);
      expect(content).toMatch(/family\s*=\s*"mysql8\.0"/);
    });
  });

  describe("Security Implementation", () => {
    test("AWS KMS customer-managed keys for encryption", () => {
      expect(content).toMatch(/aws_kms_key\.main/);
      expect(content).toMatch(/enable_key_rotation\s*=\s*true/);
      expect(content).toMatch(/storage_encrypted\s*=\s*true/);
      expect(content).toMatch(/kms_key_id\s*=\s*aws_kms_key\.main\.arn/);
    });

    test("Security groups with least privilege access", () => {
      expect(content).toMatch(/aws_security_group\.alb/);
      expect(content).toMatch(/aws_security_group\.ec2/);
      expect(content).toMatch(/aws_security_group\.rds/);
      expect(content).toMatch(/ingress/);
      expect(content).toMatch(/egress/);
    });

    test("IAM roles and policies properly configured", () => {
      expect(content).toMatch(/assume_role_policy/);
      expect(content).toMatch(/sts:AssumeRole/);
      expect(content).toMatch(/ec2\.amazonaws\.com/);
    });
  });

  describe("Resource Naming and Documentation", () => {
    test("Random suffixes to prevent naming conflicts", () => {
      expect(content).toMatch(/random_string\.suffix/);
      expect(content).toMatch(/length\s*=\s*8/);
    });

    test("Clear comments explaining resource purposes", () => {
      expect(content).toMatch(/#.*VPC and Networking/);
      expect(content).toMatch(/#.*Application Load Balancer/);
      expect(content).toMatch(/#.*Auto Scaling Group/);
      expect(content).toMatch(/#.*RDS Database/);
    });

    test("Comprehensive tagging for all resources", () => {
      expect(content).toMatch(/tags\s*=\s*merge\(local\.common_tags/);
      expect(content).toMatch(/Environment\s*=\s*var\.environment/);
      expect(content).toMatch(/Project\s*=\s*var\.project_name/);
      expect(content).toMatch(/ManagedBy\s*=\s*"Terraform"/);
    });
  });

  describe("Variables and Configuration", () => {
    test("All required variables defined", () => {
      expect(content).toMatch(/variable\s+"aws_region"/);
      expect(content).toMatch(/variable\s+"environment"/);
      expect(content).toMatch(/variable\s+"vpc_cidr"/);
      expect(content).toMatch(/variable\s+"instance_type"/);
      expect(content).toMatch(/variable\s+"min_size"/);
      expect(content).toMatch(/variable\s+"max_size"/);
      expect(content).toMatch(/variable\s+"db_instance_class"/);
    });

    test("Sensible default values provided", () => {
      expect(content).toMatch(/default\s*=\s*"us-west-1"/);
      expect(content).toMatch(/default\s*=\s*"prod"/);
      expect(content).toMatch(/default\s*=\s*"10\.0\.0\.0\/16"/);
      expect(content).toMatch(/default\s*=\s*"t3\.micro"/);
    });
  });

  describe("Outputs and Monitoring", () => {
    test("Essential outputs defined", () => {
      expect(content).toMatch(/output\s+"alb_dns_name"/);
      expect(content).toMatch(/output\s+"vpc_id"/);
      expect(content).toMatch(/output\s+"rds_endpoint"/);
      expect(content).toMatch(/output\s+"kms_key_arn"/);
    });

    test("CloudWatch alarms for monitoring", () => {
      expect(content).toMatch(/aws_cloudwatch_metric_alarm/);
      expect(content).toMatch(/cpu_high/);
      expect(content).toMatch(/cpu_low/);
      expect(content).toMatch(/CPUUtilization/);
    });
  });

  describe("Additional Features", () => {
    test("S3 bucket with encryption", () => {
      expect(content).toMatch(/aws_s3_bucket\.app_data/);
      expect(content).toMatch(/aws_s3_bucket_server_side_encryption_configuration/);
      expect(content).toMatch(/aws_s3_bucket_versioning/);
    });

    test("User data script for web server setup", () => {
      expect(content).toMatch(/user_data\s*=\s*base64encode\(templatefile/);
      expect(content).toMatch(/user_data\.sh/);
    });

    test("Random password generation for database", () => {
      expect(content).toMatch(/random_password\.db_password/);
      expect(content).toMatch(/length\s*=\s*16/);
    });
  });
});
