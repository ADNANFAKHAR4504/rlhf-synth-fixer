// tests/unit/unit-tests.ts
// Comprehensive unit tests for ../lib/tap_stack.tf
// No Terraform or CDKTF commands are executed.

import fs from "fs";
import path from "path";

const STACK_REL = "../lib/tap_stack.tf";
const PROVIDER_REL = "../lib/provider.tf";
const stackPath = path.resolve(__dirname, STACK_REL);
const providerPath = path.resolve(__dirname, PROVIDER_REL);

describe("Terraform Infrastructure Unit Tests", () => {
  let stackContent: string;
  let providerContent: string;

  beforeAll(() => {
    stackContent = fs.readFileSync(stackPath, "utf8");
    providerContent = fs.readFileSync(providerPath, "utf8");
  });

  describe("File Structure", () => {
    test("tap_stack.tf exists", () => {
      const exists = fs.existsSync(stackPath);
      expect(exists).toBe(true);
    });

    test("provider.tf exists", () => {
      const exists = fs.existsSync(providerPath);
      expect(exists).toBe(true);
    });

    test("does NOT declare provider in tap_stack.tf (provider.tf owns providers)", () => {
      expect(stackContent).not.toMatch(/\bprovider\s+"aws"\s*{/);
    });

    test("provider.tf declares AWS provider correctly", () => {
      expect(providerContent).toMatch(/provider\s+"aws"\s*{/);
      expect(providerContent).toMatch(/region\s*=\s*var\.aws_region/);
    });

    test("provider.tf declares random provider", () => {
      expect(providerContent).toMatch(/random\s*=\s*{/);
      expect(providerContent).toMatch(/source\s*=\s*"hashicorp\/random"/);
    });
  });

  describe("Variables", () => {
    test("declares aws_region variable", () => {
      expect(stackContent).toMatch(/variable\s+"aws_region"\s*{/);
      expect(stackContent).toMatch(/default\s*=\s*"us-west-2"/);
    });

    test("declares environment_suffix variable", () => {
      expect(stackContent).toMatch(/variable\s+"environment_suffix"\s*{/);
      expect(stackContent).toMatch(/description\s*=\s*"Environment suffix for unique resource naming"/);
    });

    test("declares all required variables", () => {
      const requiredVars = [
        "aws_region",
        "project",
        "environment",
        "vpc_cidr",
        "public_subnet_cidrs",
        "private_subnet_cidrs",
        "instance_type",
        "asg_min_size",
        "asg_desired_capacity",
        "asg_max_size",
        "db_instance_class",
        "db_name",
        "db_username",
        "log_retention_days",
        "environment_suffix"
      ];

      requiredVars.forEach(varName => {
        expect(stackContent).toMatch(new RegExp(`variable\\s+"${varName}"\\s*{`));
      });
    });
  });

  describe("Locals", () => {
    test("defines name_prefix with environment suffix", () => {
      // Accept either the old direct concatenation OR the new computed_suffix form
      const direct = /name_prefix\s*=\s*"\$\{var\.project\}-\$\{var\.environment\}-\$\{var\.environment_suffix\}"/;
      const computed =
        /computed_suffix[\s\S]*name_prefix\s*=\s*"\$\{var\.project\}-\$\{var\.environment\}\$\{local\.computed_suffix\}"/;

      expect(direct.test(stackContent) || computed.test(stackContent)).toBe(true);
    });

    test("defines common_tags", () => {
      expect(stackContent).toMatch(/common_tags\s*=\s*{/);
      expect(stackContent).toMatch(/project\s*=\s*var\.project/);
      expect(stackContent).toMatch(/environment\s*=\s*var\.environment/);
    });
});


  describe("VPC and Networking", () => {
    test("creates VPC with correct configuration", () => {
      expect(stackContent).toMatch(/resource\s+"aws_vpc"\s+"main"/);
      expect(stackContent).toMatch(/enable_dns_hostnames\s*=\s*true/);
      expect(stackContent).toMatch(/enable_dns_support\s*=\s*true/);
    });

    test("creates Internet Gateway", () => {
      expect(stackContent).toMatch(/resource\s+"aws_internet_gateway"\s+"main"/);
      expect(stackContent).toMatch(/vpc_id\s*=\s*aws_vpc\.main\.id/);
    });

    test("creates public subnets", () => {
      expect(stackContent).toMatch(/resource\s+"aws_subnet"\s+"public"/);
      expect(stackContent).toMatch(/map_public_ip_on_launch\s*=\s*true/);
    });

    test("creates private subnets", () => {
      expect(stackContent).toMatch(/resource\s+"aws_subnet"\s+"private"/);
      expect(stackContent).toMatch(/availability_zone\s*=\s*data\.aws_availability_zones\.available\.names\[count\.index\]/);
    });

    test("creates NAT Gateways", () => {
      expect(stackContent).toMatch(/resource\s+"aws_nat_gateway"\s+"main"/);
      expect(stackContent).toMatch(/allocation_id\s*=\s*aws_eip\.nat\[count\.index\]\.id/);
    });

    test("creates Elastic IPs for NAT", () => {
      expect(stackContent).toMatch(/resource\s+"aws_eip"\s+"nat"/);
      expect(stackContent).toMatch(/domain\s*=\s*"vpc"/);
    });

    test("creates route tables", () => {
      expect(stackContent).toMatch(/resource\s+"aws_route_table"\s+"public"/);
      expect(stackContent).toMatch(/resource\s+"aws_route_table"\s+"private"/);
    });

    test("associates subnets with route tables", () => {
      expect(stackContent).toMatch(/resource\s+"aws_route_table_association"\s+"public"/);
      expect(stackContent).toMatch(/resource\s+"aws_route_table_association"\s+"private"/);
    });
  });

  describe("Security Groups", () => {
    test("creates ALB security group with correct ingress rules", () => {
      expect(stackContent).toMatch(/resource\s+"aws_security_group"\s+"alb"/);
      expect(stackContent).toMatch(/from_port\s*=\s*80/);
      expect(stackContent).toMatch(/from_port\s*=\s*443/);
      expect(stackContent).toMatch(/cidr_blocks\s*=\s*\["0\.0\.0\.0\/0"\]/);
    });

    test("creates app security group", () => {
      expect(stackContent).toMatch(/resource\s+"aws_security_group"\s+"app"/);
      expect(stackContent).toMatch(/description\s*=\s*"HTTP from ALB"/);
      expect(stackContent).toMatch(/security_groups\s*=\s*\[aws_security_group\.alb\.id\]/);
    });

    test("creates RDS security group", () => {
      expect(stackContent).toMatch(/resource\s+"aws_security_group"\s+"rds"/);
      expect(stackContent).toMatch(/from_port\s*=\s*5432/);
      expect(stackContent).toMatch(/description\s*=\s*"PostgreSQL from App"/);
    });
  });

  describe("IAM Resources", () => {
    test("creates instance IAM role", () => {
      expect(stackContent).toMatch(/resource\s+"aws_iam_role"\s+"instance_role"/);
      expect(stackContent).toMatch(/Service.*ec2\.amazonaws\.com/);
    });

    test("attaches SSM managed instance core policy", () => {
      expect(stackContent).toMatch(/resource\s+"aws_iam_role_policy_attachment"\s+"ssm_managed_instance_core"/);
      expect(stackContent).toMatch(/policy_arn\s*=\s*"arn:aws:iam::aws:policy\/AmazonSSMManagedInstanceCore"/);
    });

    test("attaches CloudWatch agent policy", () => {
      expect(stackContent).toMatch(/resource\s+"aws_iam_role_policy_attachment"\s+"cloudwatch_agent_server_policy"/);
      expect(stackContent).toMatch(/policy_arn\s*=\s*"arn:aws:iam::aws:policy\/CloudWatchAgentServerPolicy"/);
    });

    test("creates SSM parameter access policy", () => {
      expect(stackContent).toMatch(/resource\s+"aws_iam_role_policy"\s+"ssm_parameter_access"/);
      expect(stackContent).toMatch(/"ssm:GetParameter"/);
      expect(stackContent).toMatch(/"ssm:GetParameters"/);
      expect(stackContent).toMatch(/"ssm:GetParametersByPath"/);
      expect(stackContent).toMatch(/"kms:Decrypt"/);
    });

    test("creates instance profile", () => {
      expect(stackContent).toMatch(/resource\s+"aws_iam_instance_profile"\s+"instance_profile"/);
      expect(stackContent).toMatch(/role\s*=\s*aws_iam_role\.instance_role\.name/);
    });
  });

  describe("SSM Parameters", () => {
    test("creates app config parameter", () => {
      expect(stackContent).toMatch(/resource\s+"aws_ssm_parameter"\s+"app_config"/);
      expect(stackContent).toMatch(/name\s*=\s*"\/app\/\$\{local\.name_prefix\}\/app\/config_json"/);
    });

    test("creates database username parameter", () => {
      expect(stackContent).toMatch(/resource\s+"aws_ssm_parameter"\s+"db_username"/);
      expect(stackContent).toMatch(/type\s*=\s*"String"/);
    });

    test("creates database password parameter", () => {
      expect(stackContent).toMatch(/resource\s+"aws_ssm_parameter"\s+"db_password"/);
      expect(stackContent).toMatch(/type\s*=\s*"SecureString"/);
      expect(stackContent).toMatch(/value\s*=\s*random_password\.db_password\.result/);
    });

    test("creates CloudWatch config parameter", () => {
      expect(stackContent).toMatch(/resource\s+"aws_ssm_parameter"\s+"cloudwatch_config"/);
      expect(stackContent).toMatch(/name\s*=\s*"\/app\/\$\{local\.name_prefix\}\/cloudwatch\/config"/);
    });
  });

  describe("CloudWatch Log Groups", () => {
    test("creates app log group", () => {
      expect(stackContent).toMatch(/resource\s+"aws_cloudwatch_log_group"\s+"app"/);
      expect(stackContent).toMatch(/name\s*=\s*"\/app\/\$\{local\.name_prefix\}\/web"/);
      expect(stackContent).toMatch(/retention_in_days\s*=\s*var\.log_retention_days/);
    });

    test("creates RDS log group", () => {
      expect(stackContent).toMatch(/resource\s+"aws_cloudwatch_log_group"\s+"rds"/);
      expect(stackContent).toMatch(/name\s*=\s*"\/aws\/rds\/instance\/\$\{local\.name_prefix\}-rds\/postgresql"/);
    });
  });

  describe("Launch Template", () => {
    test("creates single launch template", () => {
      const launchTemplates = stackContent.match(/resource\s+"aws_launch_template"\s+"[^"]+"/g);
      expect(launchTemplates).toHaveLength(1);
      expect(launchTemplates![0]).toMatch(/resource\s+"aws_launch_template"\s+"app"/);
    });

    test("launch template uses correct AMI", () => {
      expect(stackContent).toMatch(/image_id\s*=\s*data\.aws_ssm_parameter\.amazon_linux_ami\.value/);
    });

    test("launch template has user data", () => {
      expect(stackContent).toMatch(/user_data\s*=\s*base64encode/);
      expect(stackContent).toMatch(/yum install -y nginx/);
      expect(stackContent).toMatch(/yum install -y amazon-cloudwatch-agent/);
    });

    test("launch template references instance profile", () => {
      expect(stackContent).toMatch(/iam_instance_profile\s*{[\s\S]*?name\s*=\s*aws_iam_instance_profile\.instance_profile\.name/);
    });
  });

  describe("Auto Scaling Group", () => {
    test("creates ASG with correct configuration", () => {
      expect(stackContent).toMatch(/resource\s+"aws_autoscaling_group"\s+"app"/);
      expect(stackContent).toMatch(/min_size\s*=\s*var\.asg_min_size/);
      expect(stackContent).toMatch(/max_size\s*=\s*var\.asg_max_size/);
      expect(stackContent).toMatch(/desired_capacity\s*=\s*var\.asg_desired_capacity/);
    });

    test("ASG uses correct launch template", () => {
      expect(stackContent).toMatch(/launch_template\s*{[\s\S]*?id\s*=\s*aws_launch_template\.app\.id/);
    });

    test("ASG has instance refresh strategy", () => {
      expect(stackContent).toMatch(/instance_refresh\s*{/);
      expect(stackContent).toMatch(/strategy\s*=\s*"Rolling"/);
    });

    test("ASG is associated with target group", () => {
      // Conditional: target_group_arns = var.enable_alb ? [aws_lb_target_group.app[0].arn] : []
      expect(stackContent).toMatch(/target_group_arns\s*=\s*var\.enable_alb\s*\?\s*\[aws_lb_target_group\.app\[0\]\.arn\]/);
    });
  });

  describe("Application Load Balancer", () => {
    test("creates ALB", () => {
      expect(stackContent).toMatch(/resource\s+"aws_lb"\s+"app"/);
      expect(stackContent).toMatch(/load_balancer_type\s*=\s*"application"/);
      expect(stackContent).toMatch(/internal\s*=\s*false/);
    });

    test("creates target group", () => {
      expect(stackContent).toMatch(/resource\s+"aws_lb_target_group"\s+"app"/);
      expect(stackContent).toMatch(/port\s*=\s*80/);
      expect(stackContent).toMatch(/protocol\s*=\s*"HTTP"/);
    });

    test("target group has health check", () => {
      expect(stackContent).toMatch(/health_check\s*{/);
      expect(stackContent).toMatch(/path\s*=\s*"\/"/);
      expect(stackContent).toMatch(/matcher\s*=\s*"200"/);
    });

    test("creates listener", () => {
      expect(stackContent).toMatch(/resource\s+"aws_lb_listener"\s+"app"/);
      expect(stackContent).toMatch(/port\s*=\s*"80"/);
      expect(stackContent).toMatch(/default_action\s*{[\s\S]*?type\s*=\s*"forward"/);
    });
  });

  describe("RDS Database", () => {
    test("creates DB subnet group", () => {
      expect(stackContent).toMatch(/resource\s+"aws_db_subnet_group"\s+"app"/);
      expect(stackContent).toMatch(/subnet_ids\s*=\s*aws_subnet\.private\[\*\]\.id/);
    });

    test("creates RDS instance", () => {
      expect(stackContent).toMatch(/resource\s+"aws_db_instance"\s+"app"/);
      expect(stackContent).toMatch(/engine\s*=\s*"postgres"/);
      // LocalStack: Multi-AZ not fully supported, accept true or false
      expect(stackContent).toMatch(/multi_az\s*=\s*(true|false)/);
    });

    test("RDS has encryption enabled", () => {
      expect(stackContent).toMatch(/storage_encrypted\s*=\s*true/);
    });

    test("RDS has deletion protection disabled", () => {
      expect(stackContent).toMatch(/deletion_protection\s*=\s*false/);
    });

    test("RDS skips final snapshot", () => {
      expect(stackContent).toMatch(/skip_final_snapshot\s*=\s*true/);
    });

    test("RDS has CloudWatch logs exports", () => {
      expect(stackContent).toMatch(/enabled_cloudwatch_logs_exports\s*=\s*\["postgresql".*\]/);
    });

    test("RDS has backup retention", () => {
      expect(stackContent).toMatch(/backup_retention_period\s*=\s*7/);
    });
  });

  describe("Data Sources", () => {
    test("uses availability zones data source", () => {
      expect(stackContent).toMatch(/data\s+"aws_availability_zones"\s+"available"/);
      expect(stackContent).toMatch(/state\s*=\s*"available"/);
    });

    test("uses SSM parameter for AMI", () => {
      expect(stackContent).toMatch(/data\s+"aws_ssm_parameter"\s+"amazon_linux_ami"/);
      expect(stackContent).toMatch(/name\s*=\s*"\/aws\/service\/ami-amazon-linux-latest\/al2023-ami-kernel-default-x86_64"/);
    });

    test("uses KMS key data source", () => {
      expect(stackContent).toMatch(/data\s+"aws_kms_key"\s+"ssm"/);
      expect(stackContent).toMatch(/key_id\s*=\s*"alias\/aws\/ssm"/);
    });
  });

  describe("Random Resources", () => {
    test("generates random password for RDS", () => {
      expect(stackContent).toMatch(/resource\s+"random_password"\s+"db_password"/);
      expect(stackContent).toMatch(/length\s*=\s*16/);
      expect(stackContent).toMatch(/special\s*=\s*true/);
    });
  });

  describe("Outputs", () => {
    test("outputs VPC ID", () => {
      expect(stackContent).toMatch(/output\s+"vpc_id"/);
      expect(stackContent).toMatch(/value\s*=\s*aws_vpc\.main\.id/);
    });

    test("outputs subnet IDs", () => {
      expect(stackContent).toMatch(/output\s+"public_subnet_ids"/);
      expect(stackContent).toMatch(/output\s+"private_subnet_ids"/);
    });

    test("outputs ALB DNS name", () => {
      expect(stackContent).toMatch(/output\s+"alb_dns_name"/);
      // Conditional: value = var.enable_alb ? aws_lb.app[0].dns_name : ""
      expect(stackContent).toMatch(/value\s*=\s*var\.enable_alb\s*\?\s*aws_lb\.app\[0\]\.dns_name/);
    });

    test("outputs RDS endpoint", () => {
      expect(stackContent).toMatch(/output\s+"rds_endpoint"/);
      // Conditional: value = var.enable_rds ? aws_db_instance.app[0].endpoint : ""
      expect(stackContent).toMatch(/value\s*=\s*var\.enable_rds\s*\?\s*aws_db_instance\.app\[0\]\.endpoint/);
    });

    test("outputs SSM parameter ARNs", () => {
      expect(stackContent).toMatch(/output\s+"ssm_parameter_arns"/);
    });

    test("outputs security group IDs", () => {
      expect(stackContent).toMatch(/output\s+"security_group_ids"/);
    });

    test("outputs ALB URL", () => {
      expect(stackContent).toMatch(/output\s+"alb_url"/);
      // Conditional: value = var.enable_alb ? "http://${aws_lb.app[0].dns_name}" : ""
      expect(stackContent).toMatch(/value\s*=\s*var\.enable_alb\s*\?\s*"http:\/\/\$\{aws_lb\.app\[0\]\.dns_name\}"/);
    });
  });

  describe("Tagging", () => {
    test("all resources use common tags", () => {
      const resourcesWithTags = stackContent.match(/tags\s*=\s*merge\(local\.common_tags/g);
      expect(resourcesWithTags).not.toBeNull();
      expect(resourcesWithTags!.length).toBeGreaterThan(15);
    });

    test("resources have Name tags with name_prefix", () => {
      const nameTags = stackContent.match(/Name\s*=\s*"\$\{local\.name_prefix\}-[^"]+"/g);
      expect(nameTags).not.toBeNull();
      expect(nameTags!.length).toBeGreaterThan(10);
    });
  });

  describe("Best Practices", () => {
    test("uses lifecycle create_before_destroy for critical resources", () => {
      const lifecycleBlocks = stackContent.match(/lifecycle\s*{\s*create_before_destroy\s*=\s*true/g);
      expect(lifecycleBlocks).not.toBeNull();
      expect(lifecycleBlocks!.length).toBeGreaterThan(3);
    });

    test("security groups use name_prefix instead of name", () => {
      expect(stackContent).toMatch(/name_prefix\s*=\s*"\$\{local\.name_prefix\}-alb-"/);
      expect(stackContent).toMatch(/name_prefix\s*=\s*"\$\{local\.name_prefix\}-app-"/);
      expect(stackContent).toMatch(/name_prefix\s*=\s*"\$\{local\.name_prefix\}-rds-"/);
    });

    test("all S3-related operations use encryption", () => {
      expect(stackContent).toMatch(/storage_encrypted\s*=\s*true/);
    });

    test("uses data sources for dynamic values", () => {
      expect(stackContent).toMatch(/data\.aws_availability_zones\.available/);
      expect(stackContent).toMatch(/data\.aws_ssm_parameter\.amazon_linux_ami/);
      expect(stackContent).toMatch(/data\.aws_kms_key\.ssm/);
    });
  });
});