// tests/unit/unit-tests.ts
// Comprehensive unit tests for ../lib/tap_stack.tf
// Tests configuration structure, naming patterns, and security settings

import fs from "fs";
import path from "path";

const STACK_REL = "../lib/tap_stack.tf";
const PROVIDER_REL = "../lib/provider.tf";
const stackPath = path.resolve(__dirname, STACK_REL);
const providerPath = path.resolve(__dirname, PROVIDER_REL);

describe("Terraform Infrastructure Configuration Tests", () => {
  let stackContent: string;
  let providerContent: string;

  beforeAll(() => {
    stackContent = fs.readFileSync(stackPath, "utf8");
    if (fs.existsSync(providerPath)) {
      providerContent = fs.readFileSync(providerPath, "utf8");
    }
  });

  // File existence tests
  describe("File Structure", () => {
    test("tap_stack.tf exists", () => {
      expect(fs.existsSync(stackPath)).toBe(true);
    });

    test("provider.tf exists", () => {
      expect(fs.existsSync(providerPath)).toBe(true);
    });
  });

  // Provider configuration tests
  describe("Provider Configuration", () => {
    test("does NOT declare provider in tap_stack.tf (provider.tf owns providers)", () => {
      expect(stackContent).not.toMatch(/\bprovider\s+"aws"\s*{/);
    });

    test("provider.tf contains AWS provider", () => {
      if (providerContent) {
        expect(providerContent).toMatch(/provider\s+"aws"\s*{/);
      }
    });
  });

  // Variable declarations
  describe("Variable Declarations", () => {
    test("declares aws_region variable", () => {
      expect(stackContent).toMatch(/variable\s+"aws_region"\s*{/);
    });

    test("declares environment variable", () => {
      expect(stackContent).toMatch(/variable\s+"environment"\s*{/);
    });

    test("declares cost_center variable", () => {
      expect(stackContent).toMatch(/variable\s+"cost_center"\s*{/);
    });

    test("declares vpc_cidr variable", () => {
      expect(stackContent).toMatch(/variable\s+"vpc_cidr"\s*{/);
    });

    test("declares instance_type variable", () => {
      expect(stackContent).toMatch(/variable\s+"instance_type"\s*{/);
    });

    test("declares app_config_bucket variable with empty default", () => {
      expect(stackContent).toMatch(/variable\s+"app_config_bucket"\s*{/);
      expect(stackContent).toMatch(/default\s*=\s*""/);
    });

    test("declares key_pair_name variable with empty default", () => {
      expect(stackContent).toMatch(/variable\s+"key_pair_name"\s*{/);
      expect(stackContent).toMatch(/default\s*=\s*""/);
    });
  });

  // Random suffix implementation
  describe("Random Suffix Implementation", () => {
    test("declares random_id resource for unique naming", () => {
      expect(stackContent).toMatch(/resource\s+"random_id"\s+"suffix"\s*{/);
    });

    test("defines local.random_suffix variable", () => {
      expect(stackContent).toMatch(/random_suffix\s*=\s*random_id\.suffix\.hex/);
    });

    test("IAM role uses random suffix", () => {
      expect(stackContent).toMatch(/name\s*=\s*"\${var\.environment}-ec2-role-\${local\.random_suffix}"/);
    });

    test("IAM policy uses random suffix", () => {
      expect(stackContent).toMatch(/name\s*=\s*"\${var\.environment}-s3-access-\${local\.random_suffix}"/);
    });

    test("IAM instance profile uses random suffix", () => {
      expect(stackContent).toMatch(/name\s*=\s*"\${var\.environment}-ec2-profile-\${local\.random_suffix}"/);
    });

    test("Load balancer uses random suffix", () => {
      expect(stackContent).toMatch(/name\s*=\s*"\${var\.environment}-alb-\${local\.random_suffix}"/);
    });

    test("Target group uses random suffix", () => {
      expect(stackContent).toMatch(/name\s*=\s*"\${var\.environment}-web-tg-\${local\.random_suffix}"/);
    });

    test("Target group tag uses random suffix", () => {
      expect(stackContent).toMatch(/Name\s*=\s*"\${var\.environment}-web-tg-\${local\.random_suffix}"/);
    });

    test("Auto scaling group uses random suffix", () => {
      expect(stackContent).toMatch(/name\s*=\s*"\${var\.environment}-web-asg-\${local\.random_suffix}"/);
    });

    test("CloudWatch alarms use random suffix", () => {
      expect(stackContent).toMatch(/alarm_name\s*=\s*"\${var\.environment}-high-cpu-\${local\.random_suffix}"/);
      expect(stackContent).toMatch(/alarm_name\s*=\s*"\${var\.environment}-low-cpu-\${local\.random_suffix}"/);
    });

    test("CloudWatch log group uses random suffix", () => {
      expect(stackContent).toMatch(/name\s*=\s*"\/aws\/ec2\/\${var\.environment}-web-app-\${local\.random_suffix}"/);
    });
  });

  // Network infrastructure
  describe("Network Infrastructure", () => {
    test("declares VPC resource", () => {
      expect(stackContent).toMatch(/resource\s+"aws_vpc"\s+"main"\s*{/);
    });

    test("VPC enables DNS hostnames and support", () => {
      expect(stackContent).toMatch(/enable_dns_hostnames\s*=\s*true/);
      expect(stackContent).toMatch(/enable_dns_support\s*=\s*true/);
    });

    test("declares public subnets with count", () => {
      expect(stackContent).toMatch(/resource\s+"aws_subnet"\s+"public"\s*{/);
      expect(stackContent).toMatch(/count\s*=\s*length\(var\.public_subnet_cidrs\)/);
    });

    test("declares private subnets with count", () => {
      expect(stackContent).toMatch(/resource\s+"aws_subnet"\s+"private"\s*{/);
      expect(stackContent).toMatch(/count\s*=\s*length\(var\.private_subnet_cidrs\)/);
    });

    test("public subnets have map_public_ip_on_launch enabled", () => {
      expect(stackContent).toMatch(/map_public_ip_on_launch\s*=\s*true/);
    });

    test("declares internet gateway", () => {
      expect(stackContent).toMatch(/resource\s+"aws_internet_gateway"\s+"main"\s*{/);
    });

    test("declares NAT gateways with proper dependencies", () => {
      expect(stackContent).toMatch(/resource\s+"aws_nat_gateway"\s+"main"\s*{/);
      expect(stackContent).toMatch(/depends_on\s*=\s*\[aws_internet_gateway\.main\]/);
    });
  });

  // Security groups
  describe("Security Groups", () => {
    test("declares ALB security group with proper ingress", () => {
      expect(stackContent).toMatch(/resource\s+"aws_security_group"\s+"alb"\s*{/);
      expect(stackContent).toMatch(/from_port\s*=\s*80/);
      expect(stackContent).toMatch(/from_port\s*=\s*443/);
    });

    test("declares web security group with ALB reference", () => {
      expect(stackContent).toMatch(/resource\s+"aws_security_group"\s+"web"\s*{/);
      expect(stackContent).toMatch(/security_groups\s*=\s*\[aws_security_group\.alb\.id\]/);
    });

    test("security groups use name_prefix for uniqueness", () => {
      expect(stackContent).toMatch(/name_prefix\s*=\s*"\${var\.environment}-alb-"/);
      expect(stackContent).toMatch(/name_prefix\s*=\s*"\${var\.environment}-web-"/);
    });

    test("security groups have lifecycle create_before_destroy", () => {
      const sgMatches = stackContent.match(/resource\s+"aws_security_group"/g);
      const lifecycleMatches = stackContent.match(/create_before_destroy\s*=\s*true/g);
      expect(sgMatches).toBeTruthy();
      expect(lifecycleMatches).toBeTruthy();
      expect(lifecycleMatches!.length).toBeGreaterThanOrEqual(2);
    });
  });

  // IAM resources
  describe("IAM Configuration", () => {
    test("declares EC2 IAM role with proper assume role policy", () => {
      expect(stackContent).toMatch(/resource\s+"aws_iam_role"\s+"ec2_role"\s*{/);
      expect(stackContent).toMatch(/Service.*ec2\.amazonaws\.com/);
    });

    test("IAM policy is conditional on S3 bucket", () => {
      expect(stackContent).toMatch(/count\s*=\s*var\.app_config_bucket\s*!=\s*""\s*\?\s*1\s*:\s*0/);
    });

    test("IAM instance profile references EC2 role", () => {
      expect(stackContent).toMatch(/resource\s+"aws_iam_instance_profile"\s+"ec2_profile"\s*{/);
      expect(stackContent).toMatch(/role\s*=\s*aws_iam_role\.ec2_role\.name/);
    });

    test("CloudWatch agent policy attachment", () => {
      expect(stackContent).toMatch(/policy_arn\s*=\s*"arn:aws:iam::aws:policy\/CloudWatchAgentServerPolicy"/);
    });
  });

  // Load balancer configuration
  describe("Load Balancer Configuration", () => {
    test("declares application load balancer", () => {
      expect(stackContent).toMatch(/resource\s+"aws_lb"\s+"main"\s*{/);
      expect(stackContent).toMatch(/load_balancer_type\s*=\s*"application"/);
    });

    test("ALB is internet-facing", () => {
      expect(stackContent).toMatch(/internal\s*=\s*false/);
    });

    test("declares target group with health checks", () => {
      expect(stackContent).toMatch(/resource\s+"aws_lb_target_group"\s+"web"\s*{/);
      expect(stackContent).toMatch(/health_check\s*{/);
    });

    test("load balancer listener configured correctly", () => {
      expect(stackContent).toMatch(/resource\s+"aws_lb_listener"\s+"web"\s*{/);
      expect(stackContent).toMatch(/type\s*=\s*"forward"/);
    });
  });

  // Auto Scaling configuration
  describe("Auto Scaling Configuration", () => {
    test("declares launch template", () => {
      expect(stackContent).toMatch(/resource\s+"aws_launch_template"\s+"web"\s*{/);
    });

    test("launch template uses conditional key pair", () => {
      expect(stackContent).toMatch(/key_name\s*=\s*var\.key_pair_name\s*!=\s*""\s*\?\s*var\.key_pair_name\s*:\s*null/);
    });

    test("launch template has EBS encryption enabled", () => {
      expect(stackContent).toMatch(/encrypted\s*=\s*true/);
    });

    test("launch template includes IAM instance profile", () => {
      expect(stackContent).toMatch(/iam_instance_profile\s*{/);
      expect(stackContent).toMatch(/name\s*=\s*aws_iam_instance_profile\.ec2_profile\.name/);
    });

    test("declares auto scaling group with proper configuration", () => {
      expect(stackContent).toMatch(/resource\s+"aws_autoscaling_group"\s+"web"\s*{/);
      expect(stackContent).toMatch(/health_check_type\s*=\s*"ELB"/);
    });

    test("auto scaling policies defined", () => {
      expect(stackContent).toMatch(/resource\s+"aws_autoscaling_policy"\s+"scale_up"\s*{/);
      expect(stackContent).toMatch(/resource\s+"aws_autoscaling_policy"\s+"scale_down"\s*{/);
    });
  });

  // CloudWatch monitoring
  describe("CloudWatch Monitoring", () => {
    test("declares CloudWatch alarms", () => {
      expect(stackContent).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"high_cpu"\s*{/);
      expect(stackContent).toMatch(/resource\s+"aws_cloudwatch_metric_alarm"\s+"low_cpu"\s*{/);
    });

    test("CloudWatch alarms have proper thresholds", () => {
      expect(stackContent).toMatch(/threshold\s*=\s*"70"/);
      expect(stackContent).toMatch(/threshold\s*=\s*"20"/);
    });

    test("declares CloudWatch log group", () => {
      expect(stackContent).toMatch(/resource\s+"aws_cloudwatch_log_group"\s+"web_app"\s*{/);
    });

    test("log group has retention policy", () => {
      expect(stackContent).toMatch(/retention_in_days\s*=\s*14/);
    });
  });

  // User data configuration
  describe("User Data Configuration", () => {
    test("launch template uses inline user_data", () => {
      expect(stackContent).toMatch(/user_data\s*=\s*base64encode\(/);
    });

    test("user_data includes Apache setup", () => {
      expect(stackContent).toMatch(/yum install -y httpd/);
      expect(stackContent).toMatch(/systemctl start httpd/);
    });

    test("user_data includes conditional S3 access", () => {
      expect(stackContent).toMatch(/%\{if var\.app_config_bucket != ""\}/);
    });
  });

  // Lifecycle management
  describe("Lifecycle Management", () => {
    test("resources have lifecycle blocks for conflict prevention", () => {
      const lifecycleMatches = stackContent.match(/lifecycle\s*{[^}]*create_before_destroy\s*=\s*true[^}]*}/g);
      expect(lifecycleMatches).toBeTruthy();
      expect(lifecycleMatches!.length).toBeGreaterThan(5);
    });
  });

  // Tagging strategy
  describe("Tagging Strategy", () => {
    test("defines common_tags local", () => {
      expect(stackContent).toMatch(/common_tags\s*=\s*{/);
      expect(stackContent).toMatch(/Environment\s*=\s*var\.environment/);
      expect(stackContent).toMatch(/CostCenter\s*=\s*var\.cost_center/);
    });

    test("resources use common tags", () => {
      expect(stackContent).toMatch(/tags\s*=\s*local\.common_tags/);
      expect(stackContent).toMatch(/tags\s*=\s*merge\(local\.common_tags/);
    });
  });

  // Output declarations
  describe("Output Declarations", () => {
    test("declares essential outputs", () => {
      expect(stackContent).toMatch(/output\s+"vpc_id"\s*{/);
      expect(stackContent).toMatch(/output\s+"load_balancer_dns"\s*{/);
      expect(stackContent).toMatch(/output\s+"auto_scaling_group_arn"\s*{/);
      expect(stackContent).toMatch(/output\s+"random_suffix"\s*{/);
    });

    test("outputs have descriptions", () => {
      expect(stackContent).toMatch(/description\s*=\s*"ID of the VPC"/);
      expect(stackContent).toMatch(/description\s*=\s*"DNS name of the load balancer"/);
      expect(stackContent).toMatch(/description\s*=\s*"Random suffix used for resource naming"/);
    });

    test("random_suffix output references local variable", () => {
      expect(stackContent).toMatch(/value\s*=\s*local\.random_suffix/);
    });
  });

  // Data source usage
  describe("Data Sources", () => {
    test("uses availability zones data source", () => {
      expect(stackContent).toMatch(/data\s+"aws_availability_zones"\s+"available"\s*{/);
    });

    test("uses Amazon Linux AMI data source", () => {
      expect(stackContent).toMatch(/data\s+"aws_ami"\s+"amazon_linux"\s*{/);
      expect(stackContent).toMatch(/owners\s*=\s*\["amazon"\]/);
    });
  });
});