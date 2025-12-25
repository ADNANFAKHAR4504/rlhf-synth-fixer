// tests/unit/unit-tests.ts
// Comprehensive unit tests for ../lib/tap_stack.tf
// No Terraform or CDKTF commands are executed - pure file content validation

import fs from "fs";
import path from "path";

const STACK_REL = "../lib/tap_stack.tf";
const stackPath = path.resolve(__dirname, STACK_REL);

describe("Terraform Infrastructure Stack: tap_stack.tf", () => {
  let stackContent: string;

  beforeAll(() => {
    if (fs.existsSync(stackPath)) {
      stackContent = fs.readFileSync(stackPath, "utf8");
    }
  });

  describe("File Structure", () => {
    test("tap_stack.tf exists", () => {
      const exists = fs.existsSync(stackPath);
      if (!exists) {
        console.error(`[unit] Expected stack at: ${stackPath}`);
      }
      expect(exists).toBe(true);
    });

    test("file is not empty", () => {
      expect(stackContent.length).toBeGreaterThan(100);
    });
  });

  describe("Variable Declarations", () => {
    test("declares aws_region variable", () => {
      expect(stackContent).toMatch(/variable\s+"aws_region"\s*{/);
    });

    test("declares environment variable", () => {
      expect(stackContent).toMatch(/variable\s+"environment"\s*{/);
    });

    test("declares project_name variable", () => {
      expect(stackContent).toMatch(/variable\s+"project_name"\s*{/);
    });

    test("declares environment_suffix variable", () => {
      expect(stackContent).toMatch(/variable\s+"environment_suffix"\s*{/);
    });

    test("declares vpc_cidr variable", () => {
      expect(stackContent).toMatch(/variable\s+"vpc_cidr"\s*{/);
    });

    test("declares instance_type variable", () => {
      expect(stackContent).toMatch(/variable\s+"instance_type"\s*{/);
    });

    test("declares min_size variable", () => {
      expect(stackContent).toMatch(/variable\s+"min_size"\s*{/);
    });

    test("declares max_size variable", () => {
      expect(stackContent).toMatch(/variable\s+"max_size"\s*{/);
    });

    test("declares db_instance_class variable", () => {
      expect(stackContent).toMatch(/variable\s+"db_instance_class"\s*{/);
    });
  });

  describe("Locals Configuration", () => {
    test("defines locals block", () => {
      expect(stackContent).toMatch(/locals\s*{/);
    });

    test("defines common_tags in locals", () => {
      expect(stackContent).toMatch(/common_tags\s*=/);
    });

    test("defines name_prefix in locals", () => {
      expect(stackContent).toMatch(/name_prefix\s*=/);
    });

    test("uses environment_suffix in naming", () => {
      expect(stackContent).toContain("local.environment_suffix");
    });
  });

  describe("Networking Resources", () => {
    test("creates VPC resource", () => {
      expect(stackContent).toMatch(/resource\s+"aws_vpc"\s+"main"/);
    });

    test("creates Internet Gateway", () => {
      expect(stackContent).toMatch(/resource\s+"aws_internet_gateway"\s+"main"/);
    });

    test("creates public subnets", () => {
      expect(stackContent).toMatch(/resource\s+"aws_subnet"\s+"public"/);
    });

    test("creates private subnets", () => {
      expect(stackContent).toMatch(/resource\s+"aws_subnet"\s+"private"/);
    });

    test("creates database subnets", () => {
      expect(stackContent).toMatch(/resource\s+"aws_subnet"\s+"database"/);
    });

    test("creates NAT Gateways", () => {
      expect(stackContent).toMatch(/resource\s+"aws_nat_gateway"\s+"main"/);
    });

    test("creates Elastic IPs for NAT", () => {
      expect(stackContent).toMatch(/resource\s+"aws_eip"\s+"nat"/);
    });

    test("creates route tables", () => {
      expect(stackContent).toMatch(/resource\s+"aws_route_table"\s+"public"/);
      expect(stackContent).toMatch(/resource\s+"aws_route_table"\s+"private"/);
    });

    test("creates route table associations", () => {
      expect(stackContent).toMatch(/resource\s+"aws_route_table_association"\s+"public"/);
      expect(stackContent).toMatch(/resource\s+"aws_route_table_association"\s+"private"/);
    });
  });

  describe("Security Groups", () => {
    test("creates ALB security group", () => {
      expect(stackContent).toMatch(/resource\s+"aws_security_group"\s+"alb"/);
    });

    test("creates EC2 security group", () => {
      expect(stackContent).toMatch(/resource\s+"aws_security_group"\s+"ec2"/);
    });

    test("creates RDS security group", () => {
      expect(stackContent).toMatch(/resource\s+"aws_security_group"\s+"rds"/);
    });


    test("ALB security group allows HTTP", () => {
      expect(stackContent).toContain("from_port   = 80");
    });

    test("ALB security group allows HTTPS", () => {
      expect(stackContent).toContain("from_port   = 443");
    });

    test("RDS security group allows MySQL port", () => {
      expect(stackContent).toContain("from_port       = 3306");
    });

  });

  describe("IAM Resources", () => {
    test("creates EC2 IAM role", () => {
      expect(stackContent).toMatch(/resource\s+"aws_iam_role"\s+"ec2_role"/);
    });

    test("creates EC2 IAM policy", () => {
      expect(stackContent).toMatch(/resource\s+"aws_iam_role_policy"\s+"ec2_policy"/);
    });

    test("creates EC2 instance profile", () => {
      expect(stackContent).toMatch(/resource\s+"aws_iam_instance_profile"\s+"ec2_profile"/);
    });

    test("EC2 role has AssumeRole policy for EC2 service", () => {
      expect(stackContent).toContain('Service = "ec2.amazonaws.com"');
    });

    test("creates EventBridge IAM role", () => {
      expect(stackContent).toMatch(/resource\s+"aws_iam_role"\s+"eventbridge_logs_role"/);
    });

    test("creates EventBridge IAM policy", () => {
      expect(stackContent).toMatch(/resource\s+"aws_iam_role_policy"\s+"eventbridge_logs_policy"/);
    });

    test("EventBridge role has AssumeRole policy for events service", () => {
      expect(stackContent).toContain('Service = "events.amazonaws.com"');
    });


    test("EC2 policy includes EventBridge permissions", () => {
      expect(stackContent).toContain("events:PutEvents");
    });
  });

  describe("Compute Resources", () => {
    test("creates launch template", () => {
      expect(stackContent).toMatch(/resource\s+"aws_launch_template"\s+"main"/);
    });

    test("creates Application Load Balancer", () => {
      expect(stackContent).toMatch(/resource\s+"aws_lb"\s+"main"/);
    });

    test("creates target group", () => {
      expect(stackContent).toMatch(/resource\s+"aws_lb_target_group"\s+"main"/);
    });

    test("creates ALB listener", () => {
      expect(stackContent).toMatch(/resource\s+"aws_lb_listener"\s+"main"/);
    });

    test("creates Auto Scaling Group", () => {
      expect(stackContent).toMatch(/resource\s+"aws_autoscaling_group"\s+"main"/);
    });

    test("launch template has user_data", () => {
      expect(stackContent).toContain("user_data");
    });

    test("launch template enables encryption", () => {
      expect(stackContent).toContain('encrypted             = true');
    });


  });

  describe("Database Resources", () => {
    test("creates RDS instance", () => {
      expect(stackContent).toMatch(/resource\s+"aws_db_instance"\s+"main"/);
    });

    test("creates DB subnet group", () => {
      expect(stackContent).toMatch(/resource\s+"aws_db_subnet_group"\s+"main"/);
    });

    test("creates DB parameter group", () => {
      expect(stackContent).toMatch(/resource\s+"aws_db_parameter_group"\s+"main"/);
    });

    test("creates KMS key for RDS encryption", () => {
      expect(stackContent).toMatch(/resource\s+"aws_kms_key"\s+"rds"/);
    });

    test("creates KMS alias", () => {
      expect(stackContent).toMatch(/resource\s+"aws_kms_alias"\s+"rds"/);
    });

    test("creates SSM parameter for DB password", () => {
      expect(stackContent).toMatch(/resource\s+"aws_ssm_parameter"\s+"db_password"/);
    });

    test("generates random password", () => {
      expect(stackContent).toMatch(/resource\s+"random_password"\s+"db_password"/);
    });

    test("RDS has encryption enabled", () => {
      expect(stackContent).toContain("storage_encrypted     = true");
    });

    test("RDS has backup retention", () => {
      expect(stackContent).toContain("backup_retention_period");
    });

    test("RDS skip_final_snapshot is true", () => {
      expect(stackContent).toContain("skip_final_snapshot = true");
    });

    test("RDS deletion_protection is false", () => {
      expect(stackContent).toContain("deletion_protection = false");
    });
  });


  describe("EventBridge Resources", () => {
    test("creates custom EventBridge bus", () => {
      expect(stackContent).toMatch(/resource\s+"aws_cloudwatch_event_bus"\s+"app_events"/);
    });

    test("creates ASG events rule", () => {
      expect(stackContent).toMatch(/resource\s+"aws_cloudwatch_event_rule"\s+"asg_events"/);
    });

    test("creates application events rule", () => {
      expect(stackContent).toMatch(/resource\s+"aws_cloudwatch_event_rule"\s+"app_events"/);
    });

    test("creates EventBridge targets", () => {
      expect(stackContent).toMatch(/resource\s+"aws_cloudwatch_event_target"\s+"asg_logs"/);
      expect(stackContent).toMatch(/resource\s+"aws_cloudwatch_event_target"\s+"app_logs"/);
    });

    test("creates EventBridge log group", () => {
      expect(stackContent).toMatch(/resource\s+"aws_cloudwatch_log_group"\s+"eventbridge_logs"/);
    });

    test("ASG events rule captures correct events", () => {
      expect(stackContent).toContain('"EC2 Instance Launch Successful"');
      expect(stackContent).toContain('"EC2 Instance Terminate Successful"');
    });

    test("ASG events rule uses correct source", () => {
      expect(stackContent).toContain('"aws.autoscaling"');
    });

    test("application events rule captures custom events", () => {
      expect(stackContent).toContain("${local.name_prefix}-app");
    });

    test("EventBridge rules use custom event bus", () => {
      expect(stackContent).toContain("event_bus_name = aws_cloudwatch_event_bus.app_events.name");
    });

    test("EventBridge targets point to log group", () => {
      expect(stackContent).toContain("arn            = aws_cloudwatch_log_group.eventbridge_logs.arn");
    });

    test("EventBridge custom bus name uses environment suffix", () => {
      expect(stackContent).toContain('name = "${local.name_prefix}-app-events"');
    });
  });

  describe("Monitoring Resources", () => {
    test("creates CloudWatch log group", () => {
      expect(stackContent).toMatch(/resource\s+"aws_cloudwatch_log_group"\s+"app_logs"/);
    });

    test("creates EventBridge CloudWatch log group", () => {
      expect(stackContent).toMatch(/resource\s+"aws_cloudwatch_log_group"\s+"eventbridge_logs"/);
    });

    test("log group has retention period", () => {
      expect(stackContent).toContain("retention_in_days");
    });

    test("EventBridge log group name uses environment suffix", () => {
      expect(stackContent).toContain('name              = "/aws/events/${local.name_prefix}"');
    });
  });

  describe("Data Sources", () => {
    test("uses AMI data source", () => {
      expect(stackContent).toMatch(/data\s+"aws_ami"\s+"amazon_linux"/);
    });

    test("uses availability zones data source", () => {
      expect(stackContent).toMatch(/data\s+"aws_availability_zones"\s+"available"/);
    });
  });

  describe("Outputs", () => {
    test("outputs VPC ID", () => {
      expect(stackContent).toMatch(/output\s+"vpc_id"/);
    });

    test("outputs subnet IDs", () => {
      expect(stackContent).toMatch(/output\s+"public_subnet_ids"/);
      expect(stackContent).toMatch(/output\s+"private_subnet_ids"/);
      expect(stackContent).toMatch(/output\s+"database_subnet_ids"/);
    });

    test("outputs load balancer details", () => {
      expect(stackContent).toMatch(/output\s+"load_balancer_dns_name"/);
    });

    test("outputs RDS endpoint", () => {
      expect(stackContent).toMatch(/output\s+"rds_endpoint"/);
    });

    test("outputs security group IDs", () => {
      expect(stackContent).toMatch(/output\s+"security_group_alb_id"/);
      expect(stackContent).toMatch(/output\s+"security_group_ec2_id"/);
      expect(stackContent).toMatch(/output\s+"security_group_rds_id"/);
    });

    test("outputs IAM role ARN", () => {
      expect(stackContent).toMatch(/output\s+"iam_role_ec2_arn"/);
    });

    test("outputs SSM parameter name", () => {
      expect(stackContent).toMatch(/output\s+"db_parameter_ssm_name"/);
    });


    test("outputs EventBridge details", () => {
      expect(stackContent).toMatch(/output\s+"eventbridge_bus_name"/);
      expect(stackContent).toMatch(/output\s+"eventbridge_bus_arn"/);
      expect(stackContent).toMatch(/output\s+"eventbridge_asg_rule_arn"/);
      expect(stackContent).toMatch(/output\s+"eventbridge_app_rule_arn"/);
      expect(stackContent).toMatch(/output\s+"eventbridge_log_group_name"/);
    });

  });

  describe("Best Practices", () => {
    test("does NOT declare provider in tap_stack.tf", () => {
      expect(stackContent).not.toMatch(/^\s*provider\s+"aws"\s*{/m);
    });

    test("uses consistent tagging with locals", () => {
      const tagCount = (stackContent.match(/tags\s*=\s*merge\(local\.common_tags/g) || []).length;
      expect(tagCount).toBeGreaterThan(5);
    });

    test("uses lifecycle rules for critical resources", () => {
      expect(stackContent).toContain("lifecycle {");
    });

    test("uses depends_on for resource dependencies", () => {
      expect(stackContent).toContain("depends_on");
    });

    test("no hardcoded credentials", () => {
      expect(stackContent).not.toContain("aws_access_key");
      expect(stackContent).not.toContain("aws_secret_key");
    });

    test("uses parameterized naming with environment suffix", () => {
      const namePrefixUsage = (stackContent.match(/\$\{local\.name_prefix\}/g) || []).length;
      expect(namePrefixUsage).toBeGreaterThan(10);
    });
  });

  describe("Security Best Practices", () => {
    test("enables VPC DNS support", () => {
      expect(stackContent).toContain("enable_dns_support   = true");
    });

    test("enables VPC DNS hostnames", () => {
      expect(stackContent).toContain("enable_dns_hostnames = true");
    });

    test("uses IMDSv2 for EC2 metadata", () => {
      expect(stackContent).toContain('http_tokens   = "required"');
    });

    test("encrypts EBS volumes", () => {
      expect(stackContent).toContain("encrypted             = true");
    });

    test("uses KMS for encryption", () => {
      expect(stackContent).toContain("kms_key_id");
    });

    test("stores sensitive data in SSM Parameter Store", () => {
      expect(stackContent).toContain("aws_ssm_parameter");
    });
  });
});