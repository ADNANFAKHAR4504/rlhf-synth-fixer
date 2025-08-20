// tests/unit/terraform.unit.test.ts
// Comprehensive unit tests for Terraform infrastructure

import fs from "fs";
import path from "path";

const STACK_PATH = path.resolve(__dirname, "../lib/tap_stack.tf");
const PROVIDER_PATH = path.resolve(__dirname, "../lib/provider.tf");
const USERDATA_PATH = path.resolve(__dirname, "../lib/userdata.sh");

describe("Terraform Infrastructure Unit Tests", () => {
  let stackContent: string;
  let providerContent: string;
  let userdataContent: string;

  beforeAll(() => {
    stackContent = fs.readFileSync(STACK_PATH, "utf8");
    providerContent = fs.readFileSync(PROVIDER_PATH, "utf8");
    userdataContent = fs.readFileSync(USERDATA_PATH, "utf8");
  });

  describe("File Structure", () => {
    test("tap_stack.tf exists", () => {
      expect(fs.existsSync(STACK_PATH)).toBe(true);
    });

    test("provider.tf exists", () => {
      expect(fs.existsSync(PROVIDER_PATH)).toBe(true);
    });

    test("userdata.sh exists", () => {
      expect(fs.existsSync(USERDATA_PATH)).toBe(true);
    });
  });

  describe("Variables", () => {
    test("declares aws_region variable", () => {
      expect(stackContent).toMatch(/variable\s+"aws_region"\s*{/);
    });

    test("declares environment_suffix variable", () => {
      expect(stackContent).toMatch(/variable\s+"environment_suffix"\s*{/);
    });

    test("declares project_name variable", () => {
      expect(stackContent).toMatch(/variable\s+"project_name"\s*{/);
    });

    test("declares vpc_cidr variable", () => {
      expect(stackContent).toMatch(/variable\s+"vpc_cidr"\s*{/);
    });

    test("declares auto scaling variables", () => {
      expect(stackContent).toMatch(/variable\s+"min_size"\s*{/);
      expect(stackContent).toMatch(/variable\s+"max_size"\s*{/);
      expect(stackContent).toMatch(/variable\s+"desired_capacity"\s*{/);
    });
  });

  describe("Networking Resources", () => {
    test("creates VPC with IPv6 support", () => {
      expect(stackContent).toMatch(/resource\s+"aws_vpc"\s+"main"\s*{/);
      expect(stackContent).toMatch(/assign_generated_ipv6_cidr_block\s*=\s*true/);
      expect(stackContent).toMatch(/enable_dns_hostnames\s*=\s*true/);
      expect(stackContent).toMatch(/enable_dns_support\s*=\s*true/);
    });

    test("creates Internet Gateway", () => {
      expect(stackContent).toMatch(/resource\s+"aws_internet_gateway"\s+"main"\s*{/);
    });

    test("creates public subnets across multiple AZs", () => {
      expect(stackContent).toMatch(/resource\s+"aws_subnet"\s+"public"\s*{/);
      expect(stackContent).toMatch(/count\s*=\s*length\(local\.availability_zones\)/);
      expect(stackContent).toMatch(/map_public_ip_on_launch\s*=\s*true/);
    });

    test("creates private subnets across multiple AZs", () => {
      expect(stackContent).toMatch(/resource\s+"aws_subnet"\s+"private"\s*{/);
      expect(stackContent).toMatch(/count\s*=\s*length\(local\.availability_zones\)/);
    });

    test("creates NAT Gateways for private subnet connectivity", () => {
      expect(stackContent).toMatch(/resource\s+"aws_nat_gateway"\s+"main"\s*{/);
      expect(stackContent).toMatch(/resource\s+"aws_eip"\s+"nat"\s*{/);
    });

    test("creates Route Tables", () => {
      expect(stackContent).toMatch(/resource\s+"aws_route_table"\s+"public"\s*{/);
      expect(stackContent).toMatch(/resource\s+"aws_route_table"\s+"private"\s*{/);
    });

    test("associates subnets with route tables", () => {
      expect(stackContent).toMatch(/resource\s+"aws_route_table_association"\s+"public"\s*{/);
      expect(stackContent).toMatch(/resource\s+"aws_route_table_association"\s+"private"\s*{/);
    });
  });

  describe("Security Groups", () => {
    test("creates ALB security group", () => {
      expect(stackContent).toMatch(/resource\s+"aws_security_group"\s+"alb"\s*{/);
    });

    test("ALB security group allows HTTP and HTTPS from internet", () => {
      const albSgMatch = stackContent.match(/resource\s+"aws_security_group"\s+"alb"\s*{[\s\S]*?^\}/m);
      expect(albSgMatch).toBeTruthy();
      if (albSgMatch) {
        expect(albSgMatch[0]).toMatch(/from_port\s*=\s*80/);
        expect(albSgMatch[0]).toMatch(/from_port\s*=\s*443/);
        expect(albSgMatch[0]).toMatch(/cidr_blocks\s*=\s*\["0\.0\.0\.0\/0"\]/);
      }
    });

    test("creates EC2 security group", () => {
      expect(stackContent).toMatch(/resource\s+"aws_security_group"\s+"ec2"\s*{/);
    });

    test("EC2 security group only allows traffic from ALB", () => {
      const ec2SgMatch = stackContent.match(/resource\s+"aws_security_group"\s+"ec2"\s*{[\s\S]*?^\}/m);
      expect(ec2SgMatch).toBeTruthy();
      if (ec2SgMatch) {
        expect(ec2SgMatch[0]).toMatch(/security_groups\s*=\s*\[aws_security_group\.alb\.id\]/);
      }
    });
  });

  describe("IAM Roles and Policies", () => {
    test("creates EC2 IAM role", () => {
      expect(stackContent).toMatch(/resource\s+"aws_iam_role"\s+"ec2_role"\s*{/);
    });

    test("creates S3 read-only policy", () => {
      expect(stackContent).toMatch(/resource\s+"aws_iam_policy"\s+"s3_readonly"\s*{/);
    });

    test("S3 policy has correct permissions", () => {
      expect(stackContent).toMatch(/"s3:GetObject"/);
      expect(stackContent).toMatch(/"s3:GetObjectVersion"/);
      expect(stackContent).toMatch(/"s3:ListBucket"/);
    });

    test("attaches SSM managed policy", () => {
      expect(stackContent).toMatch(/resource\s+"aws_iam_role_policy_attachment"\s+"ssm_managed"\s*{/);
      expect(stackContent).toMatch(/AmazonSSMManagedInstanceCore/);
    });

    test("attaches CloudWatch agent policy", () => {
      expect(stackContent).toMatch(/resource\s+"aws_iam_role_policy_attachment"\s+"cloudwatch_agent"\s*{/);
      expect(stackContent).toMatch(/CloudWatchAgentServerPolicy/);
    });

    test("creates instance profile", () => {
      expect(stackContent).toMatch(/resource\s+"aws_iam_instance_profile"\s+"ec2_profile"\s*{/);
    });
  });

  describe("Load Balancing", () => {
    test("creates Application Load Balancer", () => {
      expect(stackContent).toMatch(/resource\s+"aws_lb"\s+"main"\s*{/);
      expect(stackContent).toMatch(/load_balancer_type\s*=\s*"application"/);
    });

    test("ALB has deletion protection disabled for testing", () => {
      expect(stackContent).toMatch(/enable_deletion_protection\s*=\s*false/);
    });

    test("ALB supports IPv6 (dualstack)", () => {
      expect(stackContent).toMatch(/ip_address_type\s*=\s*"dualstack"/);
    });

    test("creates Target Group", () => {
      expect(stackContent).toMatch(/resource\s+"aws_lb_target_group"\s+"main"\s*{/);
    });

    test("Target Group has health checks configured", () => {
      const tgMatch = stackContent.match(/resource\s+"aws_lb_target_group"\s+"main"\s*{[\s\S]*?health_check\s*{[\s\S]*?}/);
      expect(tgMatch).toBeTruthy();
      if (tgMatch) {
        expect(tgMatch[0]).toMatch(/enabled\s*=\s*true/);
        expect(tgMatch[0]).toMatch(/path\s*=\s*"\/"/);
        expect(tgMatch[0]).toMatch(/healthy_threshold/);
        expect(tgMatch[0]).toMatch(/unhealthy_threshold/);
      }
    });

    test("creates ALB Listener", () => {
      expect(stackContent).toMatch(/resource\s+"aws_lb_listener"\s+"main"\s*{/);
      expect(stackContent).toMatch(/port\s*=\s*"80"/);
      expect(stackContent).toMatch(/protocol\s*=\s*"HTTP"/);
    });
  });

  describe("Auto Scaling", () => {
    test("creates Launch Template", () => {
      expect(stackContent).toMatch(/resource\s+"aws_launch_template"\s+"main"\s*{/);
    });

    test("Launch Template uses user data", () => {
      expect(stackContent).toMatch(/user_data\s*=\s*base64encode\(templatefile/);
      expect(stackContent).toMatch(/userdata\.sh/);
    });

    test("Launch Template enables monitoring", () => {
      expect(stackContent).toMatch(/monitoring\s*{[\s\S]*?enabled\s*=\s*true/);
    });

    test("Launch Template uses IMDSv2", () => {
      expect(stackContent).toMatch(/metadata_options\s*{[\s\S]*?http_tokens\s*=\s*"required"/);
    });

    test("creates Auto Scaling Group", () => {
      expect(stackContent).toMatch(/resource\s+"aws_autoscaling_group"\s+"main"\s*{/);
    });

    test("ASG has correct size constraints", () => {
      expect(stackContent).toMatch(/min_size\s*=\s*var\.min_size/);
      expect(stackContent).toMatch(/max_size\s*=\s*var\.max_size/);
      expect(stackContent).toMatch(/desired_capacity\s*=\s*var\.desired_capacity/);
    });

    test("ASG uses ELB health checks", () => {
      expect(stackContent).toMatch(/health_check_type\s*=\s*"ELB"/);
    });

    test("creates scaling policies", () => {
      expect(stackContent).toMatch(/resource\s+"aws_autoscaling_policy"\s+"scale_up"\s*{/);
      expect(stackContent).toMatch(/resource\s+"aws_autoscaling_policy"\s+"scale_down"\s*{/);
    });
  });

  describe("Monitoring and Logging", () => {
    test("creates CloudWatch alarms for CPU", () => {
      expect(stackContent).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"high_cpu"\s*{/);
      expect(stackContent).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"low_cpu"\s*{/);
    });

    test("alarms trigger scaling policies", () => {
      expect(stackContent).toMatch(/alarm_actions\s*=\s*\[aws_autoscaling_policy\.scale_up\.arn\]/);
      expect(stackContent).toMatch(/alarm_actions\s*=\s*\[aws_autoscaling_policy\.scale_down\.arn\]/);
    });

    test("creates CloudWatch log groups", () => {
      expect(stackContent).toMatch(/resource\s+"aws_cloudwatch_log_group"\s+"app_logs"\s*{/);
      expect(stackContent).toMatch(/resource\s+"aws_cloudwatch_log_group"\s+"vpc_flow_logs"\s*{/);
    });

    test("enables VPC Flow Logs", () => {
      expect(stackContent).toMatch(/resource\s+"aws_flow_log"\s+"vpc_flow_log"\s*{/);
      expect(stackContent).toMatch(/traffic_type\s*=\s*"ALL"/);
    });

    test("creates Network Monitor", () => {
      expect(stackContent).toMatch(/resource\s+"aws_networkmonitor_monitor"\s+"main"\s*{/);
    });

    test("creates Network Monitor probes", () => {
      expect(stackContent).toMatch(/resource\s+"aws_networkmonitor_probe"\s+"main"\s*{/);
    });
  });

  describe("Tagging", () => {
    test("uses common tags including Environment=Production", () => {
      expect(stackContent).toMatch(/Environment\s*=\s*var\.environment/);
      expect(stackContent).toMatch(/default\s*=\s*"Production"/);
    });

    test("uses environment suffix in resource names", () => {
      expect(stackContent).toMatch(/\$\{local\.name_prefix\}/);
      expect(stackContent).toMatch(/name_prefix\s*=\s*"\$\{var\.project_name\}-\$\{var\.environment_suffix\}"/);
    });
  });

  describe("Outputs", () => {
    test("outputs VPC ID", () => {
      expect(stackContent).toMatch(/output\s+"vpc_id"\s*{/);
    });

    test("outputs Load Balancer DNS", () => {
      expect(stackContent).toMatch(/output\s+"load_balancer_dns"\s*{/);
    });

    test("outputs subnet IDs", () => {
      expect(stackContent).toMatch(/output\s+"public_subnet_ids"\s*{/);
      expect(stackContent).toMatch(/output\s+"private_subnet_ids"\s*{/);
    });

    test("outputs security group IDs", () => {
      expect(stackContent).toMatch(/output\s+"security_group_alb_id"\s*{/);
      expect(stackContent).toMatch(/output\s+"security_group_ec2_id"\s*{/);
    });

    test("outputs Auto Scaling Group name", () => {
      expect(stackContent).toMatch(/output\s+"autoscaling_group_name"\s*{/);
    });
  });

  describe("User Data Script", () => {
    test("installs and configures httpd", () => {
      expect(userdataContent).toMatch(/yum install -y httpd/);
      expect(userdataContent).toMatch(/systemctl start httpd/);
      expect(userdataContent).toMatch(/systemctl enable httpd/);
    });

    test("installs CloudWatch agent", () => {
      expect(userdataContent).toMatch(/yum install -y amazon-cloudwatch-agent/);
    });

    test("installs SSM agent", () => {
      expect(userdataContent).toMatch(/yum install -y amazon-ssm-agent/);
      expect(userdataContent).toMatch(/systemctl start amazon-ssm-agent/);
    });

    test("configures CloudWatch agent for logs", () => {
      expect(userdataContent).toMatch(/amazon-cloudwatch-agent\.json/);
      expect(userdataContent).toMatch(/log_group_name/);
      expect(userdataContent).toMatch(/httpd\/access_log/);
      expect(userdataContent).toMatch(/httpd\/error_log/);
    });

    test("creates web page with instance metadata", () => {
      expect(userdataContent).toMatch(/169\.254\.169\.254\/latest\/meta-data\/instance-id/);
      expect(userdataContent).toMatch(/\/var\/www\/html\/index\.html/);
    });
  });

  describe("Provider Configuration", () => {
    test("provider.tf configures AWS provider", () => {
      expect(providerContent).toMatch(/provider\s+"aws"\s*{/);
    });

    test("provider uses variable for region", () => {
      expect(providerContent).toMatch(/region\s*=\s*var\.aws_region/);
    });

    test("configures S3 backend", () => {
      expect(providerContent).toMatch(/backend\s+"s3"\s*{/);
    });

    test("requires Terraform version >= 1.4.0", () => {
      expect(providerContent).toMatch(/required_version\s*=\s*">=\s*1\.4\.0"/);
    });
  });

  describe("Security Best Practices", () => {
    test("no hardcoded credentials", () => {
      expect(stackContent).not.toMatch(/aws_access_key/);
      expect(stackContent).not.toMatch(/aws_secret_key/);
      expect(stackContent).not.toMatch(/password\s*=/);
    });

    test("no prevent_destroy lifecycle rules (for testing)", () => {
      expect(stackContent).not.toMatch(/prevent_destroy\s*=\s*true/);
    });

    test("uses least privilege IAM policies", () => {
      // S3 policy should not have admin access
      expect(stackContent).not.toMatch(/\*:\*/);
      expect(stackContent).not.toMatch(/AdministratorAccess/);
    });
  });
});